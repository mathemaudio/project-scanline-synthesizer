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

	@Scenario('monophonic portamento glides one active voice toward the newest held frequency')
	static async glidesMonophonicVoiceWhenPortamentoIsRaised(subjectFactory: SubjectFactory<PrimitiveSynth>, scenario?: ScenarioParameter): Promise<{ activeVoiceCount: number, rampTargetHz: number, finalFrequencyHz: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		void subjectFactory
		const fakeAudioContext = this.createFakeAudioContext()
		const synth = new PrimitiveSynth({
			monophonic: true,
			portamentoSeconds: 0.4,
			createAudioContext: () => fakeAudioContext
		})

		await synth.syncNotes([261.625565])
		await waitFor(() => synth.getActiveVoiceCount() === 1, 'Expected one monophonic voice after starting the first note')
		await synth.syncNotes([329.627557])
		const activeVoiceCount = synth.getActiveVoiceCount()
		const rampTargetHz = (fakeAudioContext as unknown as { lastFrequencyRampTarget: number }).lastFrequencyRampTarget
		const finalFrequencyHz = (fakeAudioContext as unknown as { lastFrequencyValue: number }).lastFrequencyValue

		assert(activeVoiceCount === 1, 'Expected monophonic glide to keep only one active voice')
		assert(Math.abs(rampTargetHz - 329.627557) < 0.000001, 'Expected portamento to ramp toward the newest held frequency')
		assert(Math.abs(finalFrequencyHz - 329.627557) < 0.000001, 'Expected the oscillator frequency value to settle on the newest held frequency')
		return { activeVoiceCount, rampTargetHz, finalFrequencyHz }
	}

	@Scenario('monophonic portamento remembers the last played pitch even after release')
	static async remembersReleasedPitchForNextMonophonicGlide(subjectFactory: SubjectFactory<PrimitiveSynth>, scenario?: ScenarioParameter): Promise<{ restartVoiceCount: number, restartStartHz: number, rampTargetHz: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const readyCallbacks: Array<() => void> = []
		void subjectFactory
		const fakeAudioContext = this.createFakeAudioContext()
		const synth = new PrimitiveSynth({
			monophonic: true,
			portamentoSeconds: 0.05,
			createAudioContext: () => fakeAudioContext,
			scheduleTimeout: (callback: () => void) => {
				readyCallbacks.push(callback)
				return readyCallbacks.length
			},
			cancelTimeout: () => {}
		})

		await synth.syncNotes([261.625565])
		await waitFor(() => synth.getActiveVoiceCount() === 1, 'Expected one active monophonic voice after the first note starts')
		synth.releaseNote()
		readyCallbacks.forEach((callback) => callback())
		await waitFor(() => synth.getActiveVoiceCount() === 0, 'Expected the released monophonic voice to clear before the next note starts')
		await synth.syncNotes([391.995436])
		await waitFor(() => synth.getActiveVoiceCount() === 1, 'Expected one active monophonic voice after restarting from silence')
		const restartVoiceCount = synth.getActiveVoiceCount()
		const restartStartHz = (fakeAudioContext as unknown as { lastFrequencySetValue: number }).lastFrequencySetValue
		const rampTargetHz = (fakeAudioContext as unknown as { lastFrequencyRampTarget: number }).lastFrequencyRampTarget

		assert(restartVoiceCount === 1, 'Expected one restarted monophonic voice after playing a new note from silence')
		assert(Math.abs(restartStartHz - 261.625565) < 0.000001, 'Expected the restarted note to glide from the remembered last played pitch')
		assert(Math.abs(rampTargetHz - 391.995436) < 0.000001, 'Expected the restarted note to ramp toward the new target pitch after release')
		return { restartVoiceCount, restartStartHz, rampTargetHz }
	}

	@Scenario('polyphonic portamento also glides fresh notes from the most recently played pitch')
	static async glidesFreshPolyphonicNoteFromRememberedPitch(subjectFactory: SubjectFactory<PrimitiveSynth>, scenario?: ScenarioParameter): Promise<{ activeVoiceCount: number, secondNoteStartHz: number, secondNoteRampTargetHz: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		void subjectFactory
		const fakeAudioContext = this.createFakeAudioContext()
		const synth = new PrimitiveSynth({
			monophonic: false,
			portamentoSeconds: 0.2,
			createAudioContext: () => fakeAudioContext
		})

		await synth.syncNotes([261.625565])
		await waitFor(() => synth.getActiveVoiceCount() === 1, 'Expected the first polyphonic note to start one active voice')
		await synth.syncNotes([261.625565, 329.627557])
		await waitFor(() => synth.getActiveVoiceCount() === 2, 'Expected adding a second polyphonic note to keep both voices active')
		const activeVoiceCount = synth.getActiveVoiceCount()
		const secondNoteStartHz = (fakeAudioContext as unknown as { lastFrequencySetValue: number }).lastFrequencySetValue
		const secondNoteRampTargetHz = (fakeAudioContext as unknown as { lastFrequencyRampTarget: number }).lastFrequencyRampTarget

		assert(activeVoiceCount === 2, 'Expected two active voices after adding a second polyphonic note')
		assert(Math.abs(secondNoteStartHz - 261.625565) < 0.000001, 'Expected the new polyphonic voice to start from the most recently played pitch when portamento is enabled')
		assert(Math.abs(secondNoteRampTargetHz - 329.627557) < 0.000001, 'Expected the new polyphonic voice to ramp toward its target pitch when portamento is enabled')
		return { activeVoiceCount, secondNoteStartHz, secondNoteRampTargetHz }
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

	@Scenario('cutoff playback mode builds a filtered voice and applies resonance settings')
	static async usesFilteredVoiceInCutoffMode(subjectFactory: SubjectFactory<PrimitiveSynth>, scenario?: ScenarioParameter): Promise<{ didStart: boolean, activeVoiceCount: number, filterCount: number, resonance: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const fakeAudioContext = this.createFakeAudioContext()
		const synth = new PrimitiveSynth({
			playbackMode: 'cutoff',
			filterEnvelopeSettings: {
				attackSeconds: 0.05,
				decaySeconds: 0.2,
				sustainLevel: 0.5,
				releaseSeconds: 0.3,
				baseCutoffHz: 500,
				peakCutoffHz: 2400,
				resonance: 8
			},
			createAudioContext: () => fakeAudioContext
		})

		const didStart = await synth.startNote(261.625565)
		const activeVoiceCount = synth.getActiveVoiceCount()
		const filterCount = (fakeAudioContext as unknown as { filterCount: number }).filterCount
		const resonance = (fakeAudioContext as unknown as { lastFilterQ: number }).lastFilterQ

		assert(didStart === true, 'Expected cutoff playback mode to start successfully with a fake audio context')
		assert(activeVoiceCount === 1, 'Expected one active filtered voice after starting one note in cutoff mode')
		assert(filterCount === 1, 'Expected cutoff playback mode to create one low-pass filter node')
		assert(resonance === 8, 'Expected cutoff playback mode to apply the configured resonance to the filter')
		return { didStart, activeVoiceCount, filterCount, resonance }
	}

	@Scenario('raw playback still routes through shared effects buses when chorus and delay are configured')
	static async routesRawPlaybackThroughAlwaysOnEffects(subjectFactory: SubjectFactory<PrimitiveSynth>, scenario?: ScenarioParameter): Promise<{ didStart: boolean, gainCount: number, delayCount: number, activeVoiceCount: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const fakeAudioContext = this.createFakeAudioContext()
		const synth = new PrimitiveSynth({
			playbackMode: 'raw',
			effectsSettings: {
				chorusMix: 0.22,
				chorusFeedback: 0.08,
				chorusDepthMs: 8,
				delayMix: 0.18,
				delayFeedback: 0.24,
				delayTimeMs: 280
			},
			createAudioContext: () => fakeAudioContext
		})

		const didStart = await synth.startNote(261.625565)
		const gainCount = (fakeAudioContext as unknown as { gainCount: number }).gainCount
		const delayCount = (fakeAudioContext as unknown as { delayCount: number }).delayCount
		const activeVoiceCount = synth.getActiveVoiceCount()

		assert(didStart === true, 'Expected raw playback with always-on effects to start successfully with a fake audio context')
		assert(gainCount >= 5, 'Expected always-on effects routing to allocate additional gain nodes for chorus and delay sends')
		assert(delayCount >= 2, 'Expected always-on effects routing to allocate both chorus and delay delay-nodes')
		assert(activeVoiceCount === 1, 'Expected one active voice after starting one raw note with always-on effects')
		return { didStart, gainCount, delayCount, activeVoiceCount }
	}

	@Scenario('pluck playback mode rebuilds held notes while staying on one active voice')
	static async rebuildsHeldVoiceForPluckMode(subjectFactory: SubjectFactory<PrimitiveSynth>, scenario?: ScenarioParameter): Promise<{ rebuilt: boolean, activeVoiceCount: number, filterCount: number, oscillatorType: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const fakeAudioContext = this.createFakeAudioContext()
		const synth = new PrimitiveSynth({
			playbackMode: 'raw',
			createAudioContext: () => fakeAudioContext
		})
		await synth.startNote(261.625565)
		synth.setPlaybackMode('pluck')

		const rebuilt = await synth.rebuildNotes([261.625565])
		const activeVoiceCount = synth.getActiveVoiceCount()
		const filterCount = (fakeAudioContext as unknown as { filterCount: number }).filterCount
		const oscillatorType = (fakeAudioContext as unknown as { lastOscillatorType: string }).lastOscillatorType

		assert(rebuilt === true, 'Expected held notes to rebuild successfully after switching to pluck mode')
		assert(activeVoiceCount === 1, 'Expected one active voice to remain after rebuilding a single held note')
		assert(filterCount >= 1, 'Expected pluck mode to route the rebuilt note through a filter stage')
		assert(oscillatorType === 'triangle', 'Expected pluck mode without uploaded samples to switch the built-in oscillator to triangle')
		return { rebuilt, activeVoiceCount, filterCount, oscillatorType }
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
				return this
			},
			linearRampToValueAtTime(value: number) {
				this.value = value
				return this
			},
			exponentialRampToValueAtTime(value: number) {
				this.value = value
				return this
			}
		})
		const fakeAudioContext = {
			lastOscillatorType: 'sine',
			periodicWaveCallCount: 0,
			filterCount: 0,
			gainCount: 0,
			delayCount: 0,
			lastFilterQ: 0,
			lastFrequencyRampTarget: 0,
			lastFrequencyValue: 0,
			lastFrequencySetValue: 0,
			state: 'running',
			currentTime: 0,
			destination: destination as AudioDestinationNode,
			resume: async () => undefined,
			createPeriodicWave() {
				fakeAudioContext.periodicWaveCallCount += 1
				return {} as PeriodicWave
			},
			createBiquadFilter() {
				fakeAudioContext.filterCount += 1
				const frequency = createGainParam()
				const quality = {
					value: 0,
					setValueAtTime(value: number) {
						this.value = value
						fakeAudioContext.lastFilterQ = value
						return this
					}
				}
				return {
					type: 'lowpass',
					frequency: frequency as unknown as AudioParam,
					Q: quality as unknown as AudioParam,
					connect: () => {},
					disconnect: () => {}
				} as unknown as BiquadFilterNode
			},
			createDelay() {
				fakeAudioContext.delayCount += 1
				return {
					delayTime: createGainParam(),
					connect: () => {},
					disconnect: () => {}
				} as unknown as DelayNode
			},
			createOscillator() {
				const frequency = {
					value: 0,
					cancelScheduledValues: () => {},
					setValueAtTime(value: number) {
						this.value = value
						fakeAudioContext.lastFrequencyValue = value
						fakeAudioContext.lastFrequencySetValue = value
						return this
					},
					linearRampToValueAtTime(value: number) {
						this.value = value
						fakeAudioContext.lastFrequencyValue = value
						fakeAudioContext.lastFrequencyRampTarget = value
						return this
					}
				}
				const oscillator = {
					type: 'sine',
					frequency: frequency,
					onended: null as (() => void) | null,
					connect: () => {},
					disconnect: () => {},
					start: () => {
						if (fakeAudioContext.lastOscillatorType !== 'custom') {
							fakeAudioContext.lastOscillatorType = oscillator.type
						}
					},
					setPeriodicWave: () => {
						fakeAudioContext.lastOscillatorType = 'custom'
					},
					stop() {
						oscillator.onended?.()
					}
				}
				return oscillator as unknown as OscillatorNode
			},
			createGain: () => {
				fakeAudioContext.gainCount += 1
				return {
					gain: createGainParam(),
					connect: () => {},
					disconnect: () => {}
				} as unknown as GainNode
			}
		}
		return fakeAudioContext as unknown as AudioContext
	}
}
