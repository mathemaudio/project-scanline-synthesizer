import './KarplusStrongPluckVoice.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '../system/lll.lll'
import { KarplusStrongPluckVoice } from './KarplusStrongPluckVoice.lll'

@Spec('Verifies Karplus-Strong delay sizing and excitation mapping for the dedicated pluck voice.')
export class KarplusStrongPluckVoiceTest {
	testType = 'unit'

	@Scenario('delay sizing stays positive and shrinks as pitch rises')
	static async calculatesStableDelayLengths(subjectFactory: SubjectFactory<KarplusStrongPluckVoice>, scenario?: ScenarioParameter): Promise<{ lowDelay: number, midDelay: number, highDelay: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const voice = this.createVoice()
		const lowDelay = voice.calculateDelaySamples(82.406889, 48000)
		const midDelay = voice.calculateDelaySamples(440, 48000)
		const highDelay = voice.calculateDelaySamples(3520, 48000)
		assert(lowDelay > midDelay, 'Expected lower notes to use longer Karplus-Strong loops than mid notes')
		assert(midDelay > highDelay, 'Expected higher notes to use shorter Karplus-Strong loops than mid notes')
		assert(highDelay >= 2.5, 'Expected very high notes to stay above the minimum stable loop size')
		return { lowDelay, midDelay, highDelay }
	}

	@Scenario('waveform excitation mapping differs from pure noise excitation while preserving loop length')
	static async mapsWaveformExcitationIntoTheLoop(subjectFactory: SubjectFactory<KarplusStrongPluckVoice>, scenario?: ScenarioParameter): Promise<{ waveformLength: number, noiseLength: number, firstWaveformSample: number, firstNoiseSample: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const originalMathRandom = Math.random
		Math.random = (() => 0.75) as typeof Math.random
		try {
			const voice = this.createVoice()
			const waveformExcitation = voice.buildExcitationBuffer(8, [-1, 0, 1, 0], 0)
			const noiseExcitation = voice.buildExcitationBuffer(8, [-1, 0, 1, 0], 1)
			const waveformLength = waveformExcitation.length
			const noiseLength = noiseExcitation.length
			const firstWaveformSample = waveformExcitation[0] ?? 0
			const firstNoiseSample = noiseExcitation[0] ?? 0
			assert(waveformLength === 8, 'Expected waveform excitation mapping to preserve the requested loop length')
			assert(noiseLength === 8, 'Expected noise excitation mapping to preserve the requested loop length')
			assert(firstWaveformSample !== firstNoiseSample, 'Expected pure waveform and pure noise excitation to seed different pluck buffers')
			return { waveformLength, noiseLength, firstWaveformSample, firstNoiseSample }
		} finally {
			Math.random = originalMathRandom
		}
	}

	@Spec('Builds one minimal pluck voice with a fake audio context so helper methods can be exercised without browser audio.')
	private static createVoice(): KarplusStrongPluckVoice {
		return new KarplusStrongPluckVoice({
			audioContext: this.createFakeAudioContext(),
			frequencyHz: 440,
			pluckSettings: {
				damping: 0.58,
				brightness: 0.72,
				noiseBlend: 0.2
			},
			waveformSamples: null
		})
	}

	@Spec('Builds the tiny fake audio context surface needed by the pluck voice constructor.')
	private static createFakeAudioContext(): AudioContext {
		const gainParam = {
			value: 0,
			cancelScheduledValues: () => undefined,
			setValueAtTime(value: number) {
				this.value = value
				return this
			},
			exponentialRampToValueAtTime(value: number) {
				this.value = value
				return this
			}
		}
		return {
			sampleRate: 48000,
			createGain: () => ({
				gain: gainParam as unknown as AudioParam,
				connect: () => undefined,
				disconnect: () => undefined
			}) as unknown as GainNode,
			createScriptProcessor: () => ({
				connect: () => undefined,
				disconnect: () => undefined,
				onaudioprocess: null
			}) as unknown as ScriptProcessorNode
		} as unknown as AudioContext
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
