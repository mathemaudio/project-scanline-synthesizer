import { Spec } from '../system/lll.lll'
import { PluckSettings } from './PluckSettings.lll'

@Spec('Generates one polyphonic Karplus-Strong pluck voice with its own string loop, excitation buffer, damping, and brightness state.')
export class KarplusStrongPluckVoice {
	private readonly processorNode: ScriptProcessorNode
	private readonly outputGainNode: GainNode
	private readonly onEnded: (() => void) | null
	private readonly bufferSize: number
	private readonly sampleRate: number
	private ringBuffer: Float32Array = new Float32Array(4)
	private loopDelaySamples: number = 2.5
	private writeIndex: number = 0
	private pluckSettings: PluckSettings
	private energyEstimate: number = 1
	private elapsedSampleCount: number = 0
	private hasEnded: boolean = false

	constructor(
		options: {
			audioContext: AudioContext
			frequencyHz: number
			pluckSettings: PluckSettings
			waveformSamples: number[] | null
			onEnded?: () => void
			bufferSize?: number
		}
	) {
		Spec('Builds one Karplus-Strong voice around a script processor node and seeds its private delay line from waveform or noise excitation.')
		this.bufferSize = options.bufferSize ?? 512
		this.sampleRate = options.audioContext.sampleRate
		this.pluckSettings = this.normalizePluckSettings(options.pluckSettings)
		this.onEnded = options.onEnded ?? null
		this.processorNode = options.audioContext.createScriptProcessor(this.bufferSize, 0, 1)
		this.outputGainNode = options.audioContext.createGain()
		this.outputGainNode.gain.value = 0.18
		this.processorNode.connect(this.outputGainNode)
		this.retune(options.frequencyHz, options.waveformSamples)
		this.processorNode.onaudioprocess = (event) => this.onAudioProcess(event)
	}

	@Spec('Returns the final audio output node for this pluck voice so callers can route it through the shared synth effects.')
	public getOutputNode(): AudioNode {
		return this.outputGainNode
	}

	@Spec('Returns the gain node controlled by the synth for anti-click note starts and stops.')
	public getGainNode(): GainNode {
		return this.outputGainNode
	}

	@Spec('Updates the active damping and brightness settings so sustained strings can respond to live pluck control changes.')
	public updatePluckSettings(pluckSettings: PluckSettings) {
		this.pluckSettings = this.normalizePluckSettings(pluckSettings)
	}

	@Spec('Retunes the string loop to one note frequency and reseeds its excitation from the latest waveform-or-noise pluck source.')
	public retune(frequencyHz: number, waveformSamples: number[] | null) {
		const normalizedFrequencyHz = Math.max(20, frequencyHz)
		this.loopDelaySamples = this.calculateDelaySamples(normalizedFrequencyHz, this.sampleRate)
		const ringBufferLength = Math.max(4, Math.ceil(this.loopDelaySamples) + 2)
		this.ringBuffer = this.buildExcitationBuffer(ringBufferLength, waveformSamples, this.pluckSettings.noiseBlend)
		this.writeIndex = 0
		this.energyEstimate = 1
		this.elapsedSampleCount = 0
		this.hasEnded = false
	}

	@Spec('Schedules a short exponential tail on the pluck voice output so note steals and explicit releases avoid clicks.')
	public release(currentTime: number, fadeDurationSeconds: number) {
		const safeStartGain = Math.max(this.outputGainNode.gain.value, 0.0001)
		this.outputGainNode.gain.cancelScheduledValues(currentTime)
		this.outputGainNode.gain.setValueAtTime(safeStartGain, currentTime)
		this.outputGainNode.gain.exponentialRampToValueAtTime(0.0001, currentTime + Math.max(0.01, fadeDurationSeconds))
	}

	@Spec('Stops the pluck voice immediately by silencing its output and disconnecting its processor graph.')
	public stopImmediately() {
		this.processorNode.onaudioprocess = null
		this.processorNode.disconnect()
		this.outputGainNode.disconnect()
		this.finishVoice()
	}

	@Spec('Converts one note frequency into the Karplus-Strong loop delay length needed for stable pitch at the current sample rate.')
	public calculateDelaySamples(frequencyHz: number, sampleRate: number): number {
		const boundedFrequencyHz = Math.max(20, frequencyHz)
		return Math.max(2.5, sampleRate / boundedFrequencyHz - 0.5)
	}

	@Spec('Builds the initial delay-line contents by resampling waveform excitation, mixing in noise, and normalizing the combined pluck source.')
	public buildExcitationBuffer(loopLength: number, waveformSamples: number[] | null, noiseBlend: number): Float32Array {
		const normalizedBlend = Math.max(0, Math.min(1, noiseBlend))
		const resampledWaveform = this.resampleExcitationSamples(waveformSamples, loopLength)
		const excitationBuffer = new Float32Array(loopLength)
		for (let index = 0; index < loopLength; index += 1) {
			const waveformSample = resampledWaveform[index] ?? 0
			const noiseSample = Math.random() * 2 - 1
			excitationBuffer[index] = waveformSample * (1 - normalizedBlend) + noiseSample * normalizedBlend
		}
		return this.normalizeExcitationBuffer(excitationBuffer)
	}

	@Spec('Processes one audio block by running the Karplus-Strong string loop and writing the current string sample into the output buffer.')
	private onAudioProcess(event: AudioProcessingEvent) {
		const outputChannel = event.outputBuffer.getChannelData(0)
		for (let sampleIndex = 0; sampleIndex < outputChannel.length; sampleIndex += 1) {
			if (this.hasEnded) {
				outputChannel[sampleIndex] = 0
				continue
			}
			const delayedSample = this.readDelaySample(this.loopDelaySamples)
			const neighborSample = this.readDelaySample(this.loopDelaySamples - 1)
			const averagedSample = (delayedSample + neighborSample) * 0.5
			const filteredSample = averagedSample * (1 - this.pluckSettings.brightness) + delayedSample * this.pluckSettings.brightness
			const feedbackGain = 0.94 + (1 - this.pluckSettings.damping) * 0.058
			const nextSample = filteredSample * feedbackGain
			this.ringBuffer[this.writeIndex] = nextSample
			this.writeIndex = (this.writeIndex + 1) % this.ringBuffer.length
			this.energyEstimate = this.energyEstimate * 0.999 + Math.abs(delayedSample) * 0.001
			this.elapsedSampleCount += 1
			outputChannel[sampleIndex] = delayedSample
			if (this.elapsedSampleCount > this.sampleRate * 0.05 && this.energyEstimate < 0.00015) {
				this.stopImmediately()
				outputChannel[sampleIndex] = 0
			}
		}
	}

	@Spec('Reads one delayed string sample using fractional interpolation so tuning stays stable across the keyboard.')
	private readDelaySample(delaySamples: number): number {
		const readPosition = this.writeIndex - delaySamples
		const wrappedPosition = this.wrapBufferPosition(readPosition)
		const lowerIndex = Math.floor(wrappedPosition)
		const upperIndex = (lowerIndex + 1) % this.ringBuffer.length
		const fraction = wrappedPosition - lowerIndex
		const lowerSample = this.ringBuffer[lowerIndex] ?? 0
		const upperSample = this.ringBuffer[upperIndex] ?? 0
		return lowerSample + (upperSample - lowerSample) * fraction
	}

	@Spec('Wraps one potentially negative circular-buffer position into the current ring-buffer length.')
	private wrapBufferPosition(position: number): number {
		const bufferLength = this.ringBuffer.length
		return ((position % bufferLength) + bufferLength) % bufferLength
	}

	@Spec('Resamples the source waveform excitation into the requested loop length or falls back to a short bright default pluck shape.')
	private resampleExcitationSamples(waveformSamples: number[] | null, loopLength: number): Float32Array {
		const sourceSamples = waveformSamples === null || waveformSamples.length === 0
			? this.createDefaultExcitationSamples(loopLength)
			: this.normalizeSourceSamples(waveformSamples)
		const resampledSamples = new Float32Array(loopLength)
		if (sourceSamples.length === 1) {
			resampledSamples.fill(sourceSamples[0] ?? 0)
			return resampledSamples
		}
		for (let index = 0; index < loopLength; index += 1) {
			const sourcePosition = (index * (sourceSamples.length - 1)) / Math.max(1, loopLength - 1)
			const lowerIndex = Math.floor(sourcePosition)
			const upperIndex = Math.min(sourceSamples.length - 1, lowerIndex + 1)
			const fraction = sourcePosition - lowerIndex
			const lowerSample = sourceSamples[lowerIndex] ?? 0
			const upperSample = sourceSamples[upperIndex] ?? 0
			resampledSamples[index] = lowerSample + (upperSample - lowerSample) * fraction
		}
		return resampledSamples
	}

	@Spec('Normalizes uploaded source samples into a safe bipolar range and falls back to a default pluck shape when they are silent.')
	private normalizeSourceSamples(samples: number[]): number[] {
		const peakAmplitude = samples.reduce((peak, sample) => Math.max(peak, Math.abs(sample)), 0)
		if (peakAmplitude < 0.000001) {
			return this.createDefaultExcitationSamples(samples.length)
		}
		return samples.map((sample) => sample / peakAmplitude)
	}

	@Spec('Builds a simple bright triangular excitation used when no uploaded waveform is available for the pluck source.')
	private createDefaultExcitationSamples(length: number): number[] {
		const excitationSamples: number[] = []
		for (let index = 0; index < length; index += 1) {
			const phase = index / Math.max(1, length - 1)
			const triangleSample = phase < 0.5 ? phase * 4 - 1 : 3 - phase * 4
			excitationSamples.push(triangleSample)
		}
		return excitationSamples
	}

	@Spec('Normalizes one mixed excitation buffer so waveform-noise blends remain audible without sudden output jumps or silence.')
	private normalizeExcitationBuffer(excitationBuffer: Float32Array): Float32Array {
		let peakAmplitude = 0
		for (const sample of excitationBuffer) {
			peakAmplitude = Math.max(peakAmplitude, Math.abs(sample))
		}
		if (peakAmplitude < 0.000001) {
			excitationBuffer.fill(0)
			excitationBuffer[0] = 1
			peakAmplitude = 1
		}
		for (let index = 0; index < excitationBuffer.length; index += 1) {
			const sample = excitationBuffer[index] ?? 0
			excitationBuffer[index] = sample / peakAmplitude
		}
		return excitationBuffer
	}

	@Spec('Clamps one pluck-settings object into stable musically useful ranges before the string loop uses it.')
	private normalizePluckSettings(pluckSettings: PluckSettings): PluckSettings {
		return {
			damping: Math.max(0, Math.min(1, pluckSettings.damping)),
			brightness: Math.max(0, Math.min(1, pluckSettings.brightness)),
			noiseBlend: Math.max(0, Math.min(1, pluckSettings.noiseBlend))
		}
	}

	@Spec('Marks the voice as finished once and notifies the synth so stale voices can be removed cleanly from its active map.')
	private finishVoice() {
		if (this.hasEnded) {
			return
		}
		this.hasEnded = true
		this.onEnded?.()
	}
}
