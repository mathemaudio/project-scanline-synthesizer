import './PrimitiveSynth.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory, WaitForFn } from '@shared/lll.lll'
import { PrimitiveSynth } from './PrimitiveSynth.lll'

@Spec('Verifies primitive synth voice selection, waveform switching, release transitions, and unsupported-audio handling.')
export class PrimitiveSynthTest {
	testType = 'unit'

	@Scenario('polyphonic sync deduplicates repeated frequencies')
	static async deduplicatesRepeatedFrequencies(subjectFactory: SubjectFactory<PrimitiveSynth>, scenario?: ScenarioParameter): Promise<{ activeVoiceCount: number, states: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const states: Array<'ready' | 'playing' | 'releasing' | 'unsupported'> = []
		void subjectFactory
		const synth = new PrimitiveSynth({
			monophonic: false,
			createAudioContext: () => this.createFakeAudioContext(),
			onStateChange: (state: 'ready' | 'playing' | 'releasing' | 'unsupported') => states.push(state)
		})

		const didStart = await synth.syncNotes([261.625565, 261.625565, 329.627557])
		await waitFor(() => synth.getActiveVoiceCount() === 2, 'Expected duplicate polyphonic frequencies to collapse into two voices')
		const activeVoiceCount = synth.getActiveVoiceCount()

		assert(didStart === true, 'Expected polyphonic sync to succeed with a fake audio context')
		assert(activeVoiceCount === 2, 'Expected two distinct active voices after deduplication')
		assert(states.includes('playing'), 'Expected synth to report playing state after starting voices')
		return { activeVoiceCount, states: states.join(', ') }
	}

	@Scenario('monophonic sync keeps only the newest held frequency and returns to ready after release')
	static async keepsLatestFrequencyInMonophonicMode(subjectFactory: SubjectFactory<PrimitiveSynth>, scenario?: ScenarioParameter): Promise<{ activeVoiceCountBeforeRelease: number, released: boolean, finalState: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const readyCallbacks: Array<() => void> = []
		const states: Array<'ready' | 'playing' | 'releasing' | 'unsupported'> = []
		void subjectFactory
		const synth = new PrimitiveSynth({
			monophonic: true,
			createAudioContext: () => this.createFakeAudioContext(),
			onStateChange: (state: 'ready' | 'playing' | 'releasing' | 'unsupported') => states.push(state),
			scheduleTimeout: (callback: () => void) => {
				readyCallbacks.push(callback)
				return readyCallbacks.length
			},
			cancelTimeout: () => {}
		})

		await synth.syncNotes([261.625565, 329.627557, 391.995436])
		await waitFor(() => synth.getActiveVoiceCount() === 1, 'Expected monophonic sync to keep only one active voice')
		const activeVoiceCountBeforeRelease = synth.getActiveVoiceCount()
		const released = synth.releaseNote()
		readyCallbacks.forEach((callback) => callback())
		await waitFor(() => states.includes('ready'), 'Expected synth to report ready after release timeout callback runs')
		const finalState = states[states.length - 1] ?? 'none'

		assert(activeVoiceCountBeforeRelease === 1, 'Expected monophonic sync to leave exactly one active voice')
		assert(released === true, 'Expected releasing an active monophonic voice to report success')
		assert(states.includes('releasing'), 'Expected synth to report releasing before returning to ready')
		assert(finalState === 'ready', 'Expected final state to settle back to ready')
		return { activeVoiceCountBeforeRelease, released, finalState }
	}

	@Scenario('uploaded waveform samples switch oscillators away from the default sine type')
	static async usesPeriodicWaveWhenImageSamplesAreProvided(subjectFactory: SubjectFactory<PrimitiveSynth>, scenario?: ScenarioParameter): Promise<{ didStart: boolean, activeVoiceCount: number, oscillatorType: string, periodicWaveCallCount: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const fakeAudioContext = this.createFakeAudioContext()
		const synth = new PrimitiveSynth({
			createAudioContext: () => fakeAudioContext
		})
		synth.setWaveformSamples([-1, -0.5, 0.5, 1])

		const didStart = await synth.startNote(261.625565)
		const activeVoiceCount = synth.getActiveVoiceCount()
		const oscillatorType = (fakeAudioContext as unknown as { lastOscillatorType: string }).lastOscillatorType
		const periodicWaveCallCount = (fakeAudioContext as unknown as { periodicWaveCallCount: number }).periodicWaveCallCount

		assert(didStart === true, 'Expected image-derived waveform playback to start with a fake audio context')
		assert(activeVoiceCount === 1, 'Expected one active voice after starting one image-derived note')
		assert(oscillatorType === 'custom', 'Expected oscillator playback to switch away from the default sine type')
		assert(periodicWaveCallCount === 1, 'Expected the synth to build one periodic wave for the uploaded waveform samples')
		return { didStart, activeVoiceCount, oscillatorType, periodicWaveCallCount }
	}

	@Scenario('changing waveform samples while a note is already sounding refreshes the active oscillator immediately')
	static async refreshesActiveVoicesWhenWaveformChanges(subjectFactory: SubjectFactory<PrimitiveSynth>, scenario?: ScenarioParameter): Promise<{ activeVoiceCount: number, periodicWaveCallCount: number, oscillatorType: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const fakeAudioContext = this.createFakeAudioContext()
		const synth = new PrimitiveSynth({
			createAudioContext: () => fakeAudioContext
		})
		const initialWaveformSamples = [-1, -0.5, 0.5, 1]
		const replacementWaveformSamples = [1, 0.5, -0.5, -1]
		synth.setWaveformSamples(initialWaveformSamples)
		await synth.startNote(261.625565)
		synth.setWaveformSamples(replacementWaveformSamples)

		const activeVoiceCount = synth.getActiveVoiceCount()
		const oscillatorType = (fakeAudioContext as unknown as { lastOscillatorType: string }).lastOscillatorType
		const periodicWaveCallCount = (fakeAudioContext as unknown as { periodicWaveCallCount: number }).periodicWaveCallCount

		assert(activeVoiceCount === 1, 'Expected the original note to keep sounding while its waveform refreshes')
		assert(oscillatorType === 'custom', 'Expected the active oscillator to keep using a custom waveform after the live update')
		assert(periodicWaveCallCount === 2, 'Expected the synth to rebuild the periodic wave when waveform samples change during playback')
		return { activeVoiceCount, periodicWaveCallCount, oscillatorType }
	}

	@Scenario('missing audio context reports unsupported without starting voices')
	static async reportsUnsupportedWhenAudioContextIsMissing(subjectFactory: SubjectFactory<PrimitiveSynth>, scenario?: ScenarioParameter): Promise<{ didStart: boolean, activeVoiceCount: number, states: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const states: Array<'ready' | 'playing' | 'releasing' | 'unsupported'> = []
		void subjectFactory
		const synth = new PrimitiveSynth({
			createAudioContext: () => null,
			onStateChange: (state: 'ready' | 'playing' | 'releasing' | 'unsupported') => states.push(state)
		})

		const didStart = await synth.startNote()
		const activeVoiceCount = synth.getActiveVoiceCount()

		assert(didStart === false, 'Expected synth start to fail when no audio context is available')
		assert(activeVoiceCount === 0, 'Expected no active voices when audio is unsupported')
		assert(states.includes('unsupported'), 'Expected synth to report unsupported audio state')
		return { didStart, activeVoiceCount, states: states.join(', ') }
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}

	@Spec('Provides a local waitFor fallback when the scenario runner omits helper functions.')
	private static async failFastWaitFor(predicate: () => boolean | Promise<boolean>, message: string): Promise<void> {
		const passed = await predicate()
		if (passed === false) {
			throw new Error(message)
		}
	}

	@Spec('Builds a tiny fake audio context with the Web Audio methods exercised by PrimitiveSynth.')
	private static createFakeAudioContext(): AudioContext {
		const destination = {}
		const createGainParam = () => ({
			value: 0,
			cancelScheduledValues: () => {},
			setValueAtTime(value: number) {
				this.value = value
			},
			linearRampToValueAtTime(value: number) {
				this.value = value
			},
			exponentialRampToValueAtTime(value: number) {
				this.value = value
			}
		})
		const fakeAudioContext = {
			lastOscillatorType: 'sine',
			periodicWaveCallCount: 0,
			state: 'running',
			currentTime: 0,
			destination: destination as AudioDestinationNode,
			resume: async () => undefined,
			createPeriodicWave() {
				fakeAudioContext.periodicWaveCallCount += 1
				return {} as PeriodicWave
			},
			createOscillator() {
				const oscillator = {
					type: 'sine',
					frequency: { value: 0 },
					onended: null as (() => void) | null,
					connect: () => {},
					disconnect: () => {},
					start: () => {},
					setPeriodicWave: () => {
						fakeAudioContext.lastOscillatorType = 'custom'
					},
					stop() {
						oscillator.onended?.()
					}
				}
				return oscillator as unknown as OscillatorNode
			},
			createGain: () => ({
				gain: createGainParam(),
				connect: () => {},
				disconnect: () => {}
			}) as unknown as GainNode
		}
		return fakeAudioContext as unknown as AudioContext
	}
}
