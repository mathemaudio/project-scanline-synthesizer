import './PrimitiveSynthFmVoiceBuilder.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '../system/lll.lll'
import { PrimitiveSynthFmVoiceBuilder } from './PrimitiveSynthFmVoiceBuilder.lll'
import type { PrimitiveSynth } from '../PrimitiveSynth.lll'

@Spec('Verifies focused FM modulator node construction for PrimitiveSynth voices.')
export class PrimitiveSynthFmVoiceBuilderTest {
	testType = 'unit'

	@Scenario('fm builder returns a sine modulator and depth gain for fm playback mode')
	static async buildsFmVoiceNodes(subjectFactory: SubjectFactory<PrimitiveSynthFmVoiceBuilder>, scenario?: ScenarioParameter): Promise<{ modulatorType: string, modulatorFrequencyHz: number, modulationDepthHz: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const audioContext = this.createFakeAudioContext()
		const builder = new PrimitiveSynthFmVoiceBuilder({
			playbackMode: 'fm',
			fmSettings: {
				ratio: 2.5,
				depthHz: 180
			}
		} as PrimitiveSynth)
		const carrierOscillator = audioContext.createOscillator()
		const nodes = builder.createFmVoiceNodes(audioContext, carrierOscillator, 220, 0, 220)
		const modulatorType = (nodes.modulatorOscillator as unknown as { type: string }).type
		const modulatorFrequencyHz = ((nodes.modulatorOscillator as unknown as { frequency: { value: number } }).frequency.value)
		const modulationDepthHz = ((nodes.modulationDepthNode as unknown as { gain: { value: number } }).gain.value)
		assert(nodes.modulatorOscillator !== null, 'Expected FM playback mode to create a modulator oscillator')
		assert(nodes.modulationDepthNode !== null, 'Expected FM playback mode to create a modulation depth gain node')
		assert(modulatorType === 'sine', 'Expected the FM builder to keep the modulator oscillator as a sine wave')
		assert(Math.abs(modulatorFrequencyHz - 550) < 0.000001, 'Expected the FM builder to tune the modulator by carrier frequency times ratio')
		assert(Math.abs(modulationDepthHz - 180) < 0.000001, 'Expected the FM builder to set modulation depth in hertz')
		return { modulatorType, modulatorFrequencyHz, modulationDepthHz }
	}

	@Spec('Builds a tiny fake audio context with only the methods the FM builder uses.')
	private static createFakeAudioContext(): AudioContext {
		return {
			createOscillator: () => ({
				type: 'sine',
				frequency: {
					value: 0,
					setValueAtTime(value: number) {
						this.value = value
						return this
					}
				},
				connect: () => undefined
			}) as unknown as OscillatorNode,
			createGain: () => ({
				gain: {
					value: 0,
					setValueAtTime(value: number) {
						this.value = value
						return this
					}
				},
				connect: () => undefined
			}) as unknown as GainNode
		} as unknown as AudioContext
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
