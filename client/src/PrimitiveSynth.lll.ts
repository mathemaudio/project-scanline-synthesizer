import { Spec } from '@shared/lll.lll'
import { AdsrEnvelope } from './synth/AdsrEnvelope.lll'
import { EffectsSettings } from './synth/EffectsSettings.lll'
import { FilterEnvelopeSettings } from './synth/FilterEnvelopeSettings.lll'
import { SynthPlaybackMode } from './synth/SynthPlaybackMode.lll'

@Spec('Provides a minimal browser synth voice engine that can switch between raw playback, filter-envelope playback, and a damped pluck mode while using uploaded image-derived waveforms when available.')
export class PrimitiveSynth {
	private readonly attackDurationSeconds: number
	private readonly releaseDurationSeconds: number
	private readonly defaultFrequencyHz: number
	private readonly createAudioContext: () => AudioContext | null
	private readonly onStateChange: ((state: 'ready' | 'playing' | 'releasing' | 'unsupported') => void) | null
	private readonly scheduleTimeout: (callback: () => void, delayMs: number) => number
	private readonly cancelTimeout: (timeoutId: number) => void
	private readonly adsrEnvelope = new AdsrEnvelope()
	private audioContext: AudioContext | null = null
	private readonly activeVoicesByFrequencyKey: Map<string, { frequencyHz: number, oscillator: OscillatorNode, gainNode: GainNode, filterNode: BiquadFilterNode | null, playbackMode: SynthPlaybackMode }> = new Map()
	private readonly chorusInputNodeByAudioContext: WeakMap<AudioContext, GainNode> = new WeakMap()
	private readonly delayInputNodeByAudioContext: WeakMap<AudioContext, GainNode> = new WeakMap()
	private pendingReadyTimeoutId: number | null = null
	private requestVersion: number = 0
	private isMonophonic: boolean
	private waveformSamples: number[] | null = null
	private playbackMode: SynthPlaybackMode
	private filterEnvelopeSettings: FilterEnvelopeSettings
	private effectsSettings: EffectsSettings

	constructor(
		options: {
			attackDurationSeconds?: number
			releaseDurationSeconds?: number
			frequencyHz?: number
			monophonic?: boolean
			playbackMode?: SynthPlaybackMode
			filterEnvelopeSettings?: FilterEnvelopeSettings
			effectsSettings?: EffectsSettings
			createAudioContext?: () => AudioContext | null
			onStateChange?: (state: 'ready' | 'playing' | 'releasing' | 'unsupported') => void
			scheduleTimeout?: (callback: () => void, delayMs: number) => number
			cancelTimeout?: (timeoutId: number) => void
		} = {}
	) {
		Spec('Configures the primitive synth with audio creation hooks, voice mode, playback-shaping mode, and short envelope timings.')
		this.attackDurationSeconds = options.attackDurationSeconds ?? 0.04
		this.releaseDurationSeconds = options.releaseDurationSeconds ?? 0.12
		this.defaultFrequencyHz = options.frequencyHz ?? 440
		this.isMonophonic = options.monophonic ?? false
		this.playbackMode = options.playbackMode ?? 'raw'
		this.filterEnvelopeSettings = this.normalizeFilterEnvelopeSettings(options.filterEnvelopeSettings ?? this.createDefaultFilterEnvelopeSettings())
		this.effectsSettings = this.normalizeEffectsSettings(options.effectsSettings ?? this.createDefaultEffectsSettings())
		this.createAudioContext = options.createAudioContext ?? (() => this.createBrowserAudioContext())
		this.onStateChange = options.onStateChange ?? null
		this.scheduleTimeout = options.scheduleTimeout ?? ((callback, delayMs) => globalThis.setTimeout(callback, delayMs))
		this.cancelTimeout = options.cancelTimeout ?? ((timeoutId) => globalThis.clearTimeout(timeoutId))
	}

	@Spec('Switches the synth between monophonic note selection and polyphonic chord playback.')
	setMonophonic(isMonophonic: boolean) {
		this.isMonophonic = isMonophonic
	}

	@Spec('Switches the synth between raw playback, filter-envelope playback, and damped pluck playback.')
	setPlaybackMode(playbackMode: SynthPlaybackMode) {
		this.playbackMode = playbackMode
	}

	@Spec('Replaces the active filter-envelope settings used by the cutoff playback mode and refreshes any currently sounding filtered voices.')
	setFilterEnvelopeSettings(filterEnvelopeSettings: FilterEnvelopeSettings) {
		this.filterEnvelopeSettings = this.normalizeFilterEnvelopeSettings(filterEnvelopeSettings)
		this.refreshActiveVoiceFilters()
	}

	@Spec('Replaces the active chorus and delay settings used by the effects playback mode and refreshes the shared effect buses.')
	setEffectsSettings(effectsSettings: EffectsSettings) {
		this.effectsSettings = this.normalizeEffectsSettings(effectsSettings)
		this.refreshEffectsRouting()
	}

	@Spec('Replaces the default sine oscillator shape with one uploaded image row waveform or clears back to the built-in raw oscillator shape when null is provided.')
	setWaveformSamples(waveformSamples: number[] | null) {
		this.waveformSamples = waveformSamples === null ? null : [...waveformSamples]
		this.refreshActiveVoiceWaveforms()
	}

	@Spec('Reports how many voices are currently sounding so the UI can reflect the synth engine output.')
	getActiveVoiceCount(): number {
		return this.activeVoicesByFrequencyKey.size
	}

	@Spec('Starts or retriggers one synth note using the currently selected playback mode.')
	async startNote(frequencyHz: number = this.defaultFrequencyHz): Promise<boolean> {
		return this.syncNotes([frequencyHz])
	}

	@Spec('Synchronizes the synth with all currently held pitches and lets the synth decide mono or poly playback.')
	async syncNotes(frequenciesHz: number[]): Promise<boolean> {
		const requestVersion = this.requestVersion + 1
		this.requestVersion = requestVersion
		const targetFrequencies = this.selectTargetFrequencies(frequenciesHz)
		if (targetFrequencies.length === 0) {
			return this.releaseVoices()
		}

		const audioContext = this.ensureAudioContext()
		if (audioContext === null) {
			this.emitStateChange('unsupported')
			return false
		}

		this.cancelPendingReadyState()
		if (audioContext.state === 'suspended') {
			await audioContext.resume()
		}

		if (this.requestVersion !== requestVersion) {
			return false
		}

		this.applyTargetFrequencies(targetFrequencies, audioContext)
		return true
	}

	@Spec('Rebuilds all active voices immediately so a playback-mode change can retimbre held notes without waiting for key releases.')
	async rebuildNotes(frequenciesHz: number[]): Promise<boolean> {
		this.requestVersion += 1
		this.stopActiveVoicesImmediately()
		return this.syncNotes(frequenciesHz)
	}

	@Spec('Releases all currently sounding notes with an exponential fade and scheduled ready-state recovery.')
	releaseNote(): boolean {
		this.requestVersion += 1
		return this.releaseVoices()
	}

	@Spec('Ensures an audio context instance exists when the browser exposes Web Audio support.')
	private ensureAudioContext(): AudioContext | null {
		if (this.audioContext !== null) {
			return this.audioContext
		}
		this.audioContext = this.createAudioContext()
		return this.audioContext
	}

	@Spec('Creates a browser audio context using AudioContext or webkitAudioContext when available.')
	private createBrowserAudioContext(): AudioContext | null {
		const maybeGlobal = globalThis as Record<string, unknown>
		const maybeConstructor = maybeGlobal['AudioContext'] ?? maybeGlobal['webkitAudioContext']
		if (typeof maybeConstructor !== 'function') {
			return null
		}
		return new (maybeConstructor as new () => AudioContext)()
	}

	@Spec('Returns the default filter-envelope settings used when callers do not provide any explicit filter shaping values.')
	private createDefaultFilterEnvelopeSettings(): FilterEnvelopeSettings {
		return {
			attackSeconds: 0.04,
			decaySeconds: 0.18,
			sustainLevel: 0.42,
			releaseSeconds: 0.22,
			baseCutoffHz: 480,
			peakCutoffHz: 2800,
			resonance: 6
		}
	}

	@Spec('Clamps one set of filter-envelope settings into stable ranges before the synth uses them for scheduling.')
	private normalizeFilterEnvelopeSettings(filterEnvelopeSettings: FilterEnvelopeSettings): FilterEnvelopeSettings {
		return {
			attackSeconds: Math.max(0, filterEnvelopeSettings.attackSeconds),
			decaySeconds: Math.max(0, filterEnvelopeSettings.decaySeconds),
			sustainLevel: Math.max(0, Math.min(1, filterEnvelopeSettings.sustainLevel)),
			releaseSeconds: Math.max(0.01, filterEnvelopeSettings.releaseSeconds),
			baseCutoffHz: Math.max(40, filterEnvelopeSettings.baseCutoffHz),
			peakCutoffHz: Math.max(Math.max(40, filterEnvelopeSettings.baseCutoffHz) + 20, filterEnvelopeSettings.peakCutoffHz),
			resonance: Math.max(0.1, Math.min(18, filterEnvelopeSettings.resonance))
		}
	}

	@Spec('Returns the default chorus and delay settings used when callers do not provide any explicit effects values.')
	private createDefaultEffectsSettings(): EffectsSettings {
		return {
			chorusMix: 0.22,
			chorusFeedback: 0.08,
			chorusDepthMs: 8,
			delayMix: 0.18,
			delayFeedback: 0.24,
			delayTimeMs: 280
		}
	}

	@Spec('Clamps one set of chorus and delay settings into stable ranges before the synth uses them for routing.')
	private normalizeEffectsSettings(effectsSettings: EffectsSettings): EffectsSettings {
		return {
			chorusMix: Math.max(0, Math.min(0.8, effectsSettings.chorusMix)),
			chorusFeedback: Math.max(0, Math.min(0.75, effectsSettings.chorusFeedback)),
			chorusDepthMs: Math.max(1, Math.min(30, effectsSettings.chorusDepthMs)),
			delayMix: Math.max(0, Math.min(0.8, effectsSettings.delayMix)),
			delayFeedback: Math.max(0, Math.min(0.85, effectsSettings.delayFeedback)),
			delayTimeMs: Math.max(40, Math.min(900, effectsSettings.delayTimeMs))
		}
	}

	@Spec('Applies the requested target note set by retiring stale voices and starting any missing ones with the currently selected playback mode.')
	private applyTargetFrequencies(targetFrequencies: number[], audioContext: AudioContext) {
		const targetFrequencyKeys = new Set(targetFrequencies.map((frequencyHz) => this.formatFrequencyKey(frequencyHz)))
		for (const [frequencyKey, voice] of this.activeVoicesByFrequencyKey.entries()) {
			if (targetFrequencyKeys.has(frequencyKey)) {
				continue
			}
			this.retireVoice(voice, audioContext.currentTime, this.calculateReleaseFadeDurationSeconds(voice))
			this.activeVoicesByFrequencyKey.delete(frequencyKey)
		}

		for (const frequencyHz of targetFrequencies) {
			const frequencyKey = this.formatFrequencyKey(frequencyHz)
			if (this.activeVoicesByFrequencyKey.has(frequencyKey)) {
				continue
			}

			const oscillator = audioContext.createOscillator()
			const voiceNodes = this.createVoiceNodes(audioContext, frequencyHz)
			this.configureOscillatorWaveform(oscillator, audioContext)
			oscillator.frequency.value = frequencyHz
			voiceNodes.gainNode.gain.cancelScheduledValues(audioContext.currentTime)
			voiceNodes.gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime)
			this.scheduleGainEnvelope(voiceNodes.gainNode, audioContext.currentTime)
			this.scheduleFilterEnvelope(voiceNodes.filterNode, frequencyHz, audioContext.currentTime)
			oscillator.connect(voiceNodes.inputNode)
			this.connectVoiceOutput(voiceNodes.outputNode, audioContext)
			this.trackVoiceEnd(frequencyKey, oscillator, voiceNodes.gainNode, voiceNodes.filterNode)
			oscillator.start(audioContext.currentTime)
			this.activeVoicesByFrequencyKey.set(frequencyKey, {
				frequencyHz,
				oscillator,
				gainNode: voiceNodes.gainNode,
				filterNode: voiceNodes.filterNode,
				playbackMode: this.playbackMode
			})
		}

		this.emitStateChange('playing')
	}

	@Spec('Builds the audio-node chain for one voice according to the active playback mode.')
	private createVoiceNodes(audioContext: AudioContext, frequencyHz: number): { gainNode: GainNode, filterNode: BiquadFilterNode | null, inputNode: AudioNode, outputNode: AudioNode } {
		const gainNode = audioContext.createGain()
		if (this.playbackMode === 'raw' || this.playbackMode === 'effects') {
			return {
				gainNode,
				filterNode: null,
				inputNode: gainNode,
				outputNode: gainNode
			}
		}

		const filterNode = audioContext.createBiquadFilter()
		filterNode.type = 'lowpass'
		if (this.playbackMode === 'cutoff') {
			filterNode.frequency.value = this.filterEnvelopeSettings.baseCutoffHz
			filterNode.Q.value = this.filterEnvelopeSettings.resonance
		} else {
			filterNode.frequency.value = this.calculatePluckBrightCutoffHz(frequencyHz)
			filterNode.Q.value = 0.9
		}
		filterNode.connect(gainNode)
		return {
			gainNode,
			filterNode,
			inputNode: filterNode,
			outputNode: gainNode
		}
	}

	@Spec('Applies the amplitude envelope for one new voice according to the active playback mode.')
	private scheduleGainEnvelope(gainNode: GainNode, startTime: number) {
		if (this.playbackMode === 'pluck') {
			gainNode.gain.linearRampToValueAtTime(0.22, startTime + 0.005)
			gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.36)
			return
		}
		gainNode.gain.linearRampToValueAtTime(0.18, startTime + this.attackDurationSeconds)
	}

	@Spec('Applies the playback-mode-specific filter envelope for one new voice when the mode uses a filter stage.')
	private scheduleFilterEnvelope(filterNode: BiquadFilterNode | null, frequencyHz: number, startTime: number) {
		if (filterNode === null) {
			return
		}
		if (this.playbackMode === 'cutoff') {
			const sustainCutoffHz = this.calculateFilterSustainCutoffHz()
			this.adsrEnvelope.scheduleAttackDecay(filterNode.frequency, {
				startTime,
				startValue: this.filterEnvelopeSettings.baseCutoffHz,
				peakValue: this.filterEnvelopeSettings.peakCutoffHz,
				sustainValue: sustainCutoffHz,
				attackSeconds: this.filterEnvelopeSettings.attackSeconds,
				decaySeconds: this.filterEnvelopeSettings.decaySeconds
			})
			filterNode.Q.setValueAtTime(this.filterEnvelopeSettings.resonance, startTime)
			return
		}
		this.adsrEnvelope.scheduleAttackDecay(filterNode.frequency, {
			startTime,
			startValue: this.calculatePluckBrightCutoffHz(frequencyHz),
			peakValue: this.calculatePluckBrightCutoffHz(frequencyHz),
			sustainValue: this.calculatePluckSettledCutoffHz(frequencyHz),
			attackSeconds: 0,
			decaySeconds: 0.26
		})
	}

	@Spec('Returns the sustain cutoff implied by the current filter-envelope settings.')
	private calculateFilterSustainCutoffHz(): number {
		const cutoffRange = this.filterEnvelopeSettings.peakCutoffHz - this.filterEnvelopeSettings.baseCutoffHz
		return this.filterEnvelopeSettings.baseCutoffHz + cutoffRange * this.filterEnvelopeSettings.sustainLevel
	}

	@Spec('Estimates a bright low-pass cutoff for the pluck mode so higher notes stay lively without becoming brittle.')
	private calculatePluckBrightCutoffHz(frequencyHz: number): number {
		return Math.min(9000, Math.max(900, frequencyHz * 12))
	}

	@Spec('Estimates the darker settled cutoff that the pluck mode falls toward as the note damps out.')
	private calculatePluckSettledCutoffHz(frequencyHz: number): number {
		return Math.min(3200, Math.max(320, frequencyHz * 3.4))
	}

	@Spec('Releases every active voice and schedules the synth to return visibly to ready after the fade completes.')
	private releaseVoices(): boolean {
		this.cancelPendingReadyState()
		if (this.audioContext === null || this.activeVoicesByFrequencyKey.size === 0) {
			return false
		}

		const audioContext = this.audioContext
		let longestFadeDurationSeconds = this.releaseDurationSeconds
		for (const [frequencyKey, voice] of this.activeVoicesByFrequencyKey.entries()) {
			const fadeDurationSeconds = this.calculateReleaseFadeDurationSeconds(voice)
			longestFadeDurationSeconds = Math.max(longestFadeDurationSeconds, fadeDurationSeconds)
			this.retireVoice(voice, audioContext.currentTime, fadeDurationSeconds)
			this.activeVoicesByFrequencyKey.delete(frequencyKey)
		}

		this.emitStateChange('releasing')
		this.pendingReadyTimeoutId = this.scheduleTimeout(() => {
			this.pendingReadyTimeoutId = null
			if (this.activeVoicesByFrequencyKey.size === 0) {
				this.emitStateChange('ready')
			}
		}, Math.ceil((longestFadeDurationSeconds + 0.03) * 1000))
		return true
	}

	@Spec('Stops every active voice quickly without emitting a visible release transition so playback-mode changes can rebuild held notes immediately.')
	private stopActiveVoicesImmediately() {
		this.cancelPendingReadyState()
		if (this.audioContext === null || this.activeVoicesByFrequencyKey.size === 0) {
			return
		}
		for (const [frequencyKey, voice] of this.activeVoicesByFrequencyKey.entries()) {
			this.retireVoice(voice, this.audioContext.currentTime, 0.01)
			this.activeVoicesByFrequencyKey.delete(frequencyKey)
		}
	}

	@Spec('Cancels any pending ready-state timer so a fresh note change cannot be overwritten by an old release.')
	private cancelPendingReadyState() {
		if (this.pendingReadyTimeoutId === null) {
			return
		}
		this.cancelTimeout(this.pendingReadyTimeoutId)
		this.pendingReadyTimeoutId = null
	}

	@Spec('Chooses the target note set for the current synth mode and removes duplicate mapped frequencies.')
	private selectTargetFrequencies(frequenciesHz: number[]): number[] {
		const uniqueFrequencies: number[] = []
		const seenFrequencyKeys = new Set<string>()
		for (const frequencyHz of frequenciesHz) {
			const frequencyKey = this.formatFrequencyKey(frequencyHz)
			if (seenFrequencyKeys.has(frequencyKey)) {
				continue
			}
			seenFrequencyKeys.add(frequencyKey)
			uniqueFrequencies.push(frequencyHz)
		}

		if (this.isMonophonic === false) {
			return uniqueFrequencies
		}

		const latestFrequency = uniqueFrequencies[uniqueFrequencies.length - 1]
		return latestFrequency === undefined ? [] : [latestFrequency]
	}

	@Spec('Formats one frequency as a stable key so the synth can track active voices across note syncs.')
	private formatFrequencyKey(frequencyHz: number): string {
		return frequencyHz.toFixed(6)
	}

	@Spec('Returns the release fade duration that best matches one voice based on how it was created.')
	private calculateReleaseFadeDurationSeconds(voice: { playbackMode: SynthPlaybackMode }): number {
		if (voice.playbackMode === 'cutoff') {
			return Math.max(this.releaseDurationSeconds, this.filterEnvelopeSettings.releaseSeconds)
		}
		if (voice.playbackMode === 'pluck') {
			return Math.max(this.releaseDurationSeconds, 0.18)
		}
		if (voice.playbackMode === 'effects') {
			return Math.max(this.releaseDurationSeconds, 0.24)
		}
		return this.releaseDurationSeconds
	}

	@Spec('Routes one voice output either directly to the destination or through the shared chorus and delay buses for effects mode.')
	private connectVoiceOutput(outputNode: AudioNode, audioContext: AudioContext) {
		if (this.playbackMode !== 'effects') {
			outputNode.connect(audioContext.destination)
			return
		}
		const chorusInputNode = this.ensureChorusInputNode(audioContext)
		const delayInputNode = this.ensureDelayInputNode(audioContext)
		outputNode.connect(audioContext.destination)
		outputNode.connect(chorusInputNode)
		outputNode.connect(delayInputNode)
	}

	@Spec('Ensures one shared chorus send bus exists for the audio context and applies the latest chorus routing values.')
	private ensureChorusInputNode(audioContext: AudioContext): GainNode {
		const existingNode = this.chorusInputNodeByAudioContext.get(audioContext)
		if (existingNode !== undefined) {
			return existingNode
		}
		const sendNode = audioContext.createGain()
		const wetGainNode = audioContext.createGain()
		const feedbackGainNode = audioContext.createGain()
		const delayNode = audioContext.createDelay(0.05)
		const lfoOscillator = audioContext.createOscillator()
		const lfoDepthNode = audioContext.createGain()
		sendNode.gain.value = this.effectsSettings.chorusMix
		wetGainNode.gain.value = 0.7
		feedbackGainNode.gain.value = this.effectsSettings.chorusFeedback
		delayNode.delayTime.value = this.effectsSettings.chorusDepthMs / 1000
		lfoOscillator.frequency.value = 0.28
		lfoDepthNode.gain.value = this.effectsSettings.chorusDepthMs / 2000
		sendNode.connect(delayNode)
		delayNode.connect(wetGainNode)
		wetGainNode.connect(audioContext.destination)
		delayNode.connect(feedbackGainNode)
		feedbackGainNode.connect(sendNode)
		lfoOscillator.connect(lfoDepthNode)
		lfoDepthNode.connect(delayNode.delayTime)
		lfoOscillator.start(audioContext.currentTime)
		this.chorusInputNodeByAudioContext.set(audioContext, sendNode)
		return sendNode
	}

	@Spec('Ensures one shared delay send bus exists for the audio context and applies the latest delay routing values.')
	private ensureDelayInputNode(audioContext: AudioContext): GainNode {
		const existingNode = this.delayInputNodeByAudioContext.get(audioContext)
		if (existingNode !== undefined) {
			return existingNode
		}
		const sendNode = audioContext.createGain()
		const wetGainNode = audioContext.createGain()
		const feedbackGainNode = audioContext.createGain()
		const delayNode = audioContext.createDelay(1)
		sendNode.gain.value = this.effectsSettings.delayMix
		wetGainNode.gain.value = 0.65
		feedbackGainNode.gain.value = this.effectsSettings.delayFeedback
		delayNode.delayTime.value = this.effectsSettings.delayTimeMs / 1000
		sendNode.connect(delayNode)
		delayNode.connect(wetGainNode)
		wetGainNode.connect(audioContext.destination)
		delayNode.connect(feedbackGainNode)
		feedbackGainNode.connect(delayNode)
		this.delayInputNodeByAudioContext.set(audioContext, sendNode)
		return sendNode
	}

	@Spec('Refreshes the shared chorus and delay buses with the latest settings after the visible effects sliders change.')
	private refreshEffectsRouting() {
		if (this.audioContext === null) {
			return
		}
		const chorusInputNode = this.chorusInputNodeByAudioContext.get(this.audioContext)
		if (chorusInputNode !== undefined) {
			chorusInputNode.gain.value = this.effectsSettings.chorusMix
		}
		const delayInputNode = this.delayInputNodeByAudioContext.get(this.audioContext)
		if (delayInputNode !== undefined) {
			delayInputNode.gain.value = this.effectsSettings.delayMix
		}
	}

	@Spec('Applies a short fade and stop time to a voice so repeated triggers do not click or hang while also releasing any active filter sweep.')
	private retireVoice(
		voice: { frequencyHz: number, oscillator: OscillatorNode, gainNode: GainNode, filterNode: BiquadFilterNode | null, playbackMode: SynthPlaybackMode },
		currentTime: number,
		fadeDurationSeconds: number
	) {
		if (voice.filterNode !== null && voice.playbackMode === 'cutoff') {
			this.adsrEnvelope.scheduleRelease(voice.filterNode.frequency, {
				startTime: currentTime,
				startValue: Math.max(voice.filterNode.frequency.value, this.calculateFilterSustainCutoffHz()),
				endValue: this.filterEnvelopeSettings.baseCutoffHz,
				releaseSeconds: this.filterEnvelopeSettings.releaseSeconds
			})
		}
		if (voice.filterNode !== null && voice.playbackMode === 'pluck') {
			this.adsrEnvelope.scheduleRelease(voice.filterNode.frequency, {
				startTime: currentTime,
				startValue: Math.max(voice.filterNode.frequency.value, this.calculatePluckSettledCutoffHz(voice.frequencyHz)),
				endValue: this.calculatePluckSettledCutoffHz(voice.frequencyHz),
				releaseSeconds: 0.18
			})
		}
		const safeStartGain = Math.max(voice.gainNode.gain.value, 0.0001)
		voice.gainNode.gain.cancelScheduledValues(currentTime)
		voice.gainNode.gain.setValueAtTime(safeStartGain, currentTime)
		voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, currentTime + fadeDurationSeconds)
		voice.oscillator.stop(currentTime + fadeDurationSeconds + 0.01)
	}

	@Spec('Configures one oscillator to use either the default built-in tone or the currently selected image-derived waveform samples.')
	private configureOscillatorWaveform(oscillator: OscillatorNode, audioContext: AudioContext) {
		if (this.waveformSamples === null || this.waveformSamples.length === 0) {
			oscillator.type = this.playbackMode === 'pluck' ? 'triangle' : 'sine'
			return
		}
		const periodicWave = this.createPeriodicWaveFromSamples(audioContext, this.waveformSamples)
		oscillator.setPeriodicWave(periodicWave)
	}

	@Spec('Refreshes every currently sounding oscillator so scanline row changes can retimbre held notes without retriggering them.')
	private refreshActiveVoiceWaveforms() {
		if (this.audioContext === null || this.activeVoicesByFrequencyKey.size === 0) {
			return
		}
		for (const voice of this.activeVoicesByFrequencyKey.values()) {
			this.configureOscillatorWaveform(voice.oscillator, this.audioContext)
		}
	}

	@Spec('Refreshes currently sounding filtered voices with the latest stable cutoff and resonance values after the UI changes filter settings.')
	private refreshActiveVoiceFilters() {
		if (this.activeVoicesByFrequencyKey.size === 0) {
			return
		}
		for (const voice of this.activeVoicesByFrequencyKey.values()) {
			if (voice.filterNode === null) {
				continue
			}
			if (voice.playbackMode === 'cutoff') {
				voice.filterNode.Q.value = this.filterEnvelopeSettings.resonance
				voice.filterNode.frequency.value = this.calculateFilterSustainCutoffHz()
				continue
			}
			voice.filterNode.frequency.value = this.calculatePluckSettledCutoffHz(voice.frequencyHz)
		}
	}

	@Spec('Builds a periodic wave from time-domain samples by converting them into Fourier coefficients for Web Audio playback.')
	private createPeriodicWaveFromSamples(audioContext: AudioContext, samples: number[]): PeriodicWave {
		const harmonicCount = Math.max(2, Math.min(samples.length, 64))
		const real = new Float32Array(harmonicCount)
		const imaginary = new Float32Array(harmonicCount)
		for (let harmonicIndex = 1; harmonicIndex < harmonicCount; harmonicIndex += 1) {
			let realSum = 0
			let imaginarySum = 0
			for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex += 1) {
				const phase = (2 * Math.PI * harmonicIndex * sampleIndex) / samples.length
				const sample = samples[sampleIndex] ?? 0
				realSum += sample * Math.cos(phase)
				imaginarySum += sample * Math.sin(phase)
			}
			real[harmonicIndex] = realSum / samples.length
			imaginary[harmonicIndex] = -imaginarySum / samples.length
		}
		return audioContext.createPeriodicWave(real, imaginary, { disableNormalization: false })
	}

	@Spec('Disconnects finished nodes and prevents stale voice endings from overriding newer active note state.')
	private trackVoiceEnd(frequencyKey: string, oscillator: OscillatorNode, gainNode: GainNode, filterNode: BiquadFilterNode | null) {
		oscillator.onended = () => {
			oscillator.disconnect()
			filterNode?.disconnect()
			gainNode.disconnect()
			const activeVoice = this.activeVoicesByFrequencyKey.get(frequencyKey)
			if (activeVoice?.oscillator === oscillator) {
				this.activeVoicesByFrequencyKey.delete(frequencyKey)
			}
			if (this.activeVoicesByFrequencyKey.size === 0 && this.pendingReadyTimeoutId === null) {
				this.emitStateChange('ready')
			}
		}
	}

	@Spec('Emits a synth state change when a listener was provided by the caller.')
	private emitStateChange(state: 'ready' | 'playing' | 'releasing' | 'unsupported') {
		this.onStateChange?.(state)
	}
}
