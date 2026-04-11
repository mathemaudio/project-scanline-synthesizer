import './PrimitiveSynth.lll'
import { AssertFn, Scenario, Spec, WaitForFn } from '@shared/lll.lll'
import { PrimitiveSynth } from './PrimitiveSynth.lll'

@Spec('Covers the primitive sine-wave synth engine with deterministic unit scenarios for mono and poly voice behavior.')
export class PrimitiveSynthTest {
	testType = "unit"

	@Scenario('starts a sine voice with a short attack envelope at the requested keyboard pitch')
	static async startsSineVoiceWithAttackEnvelope(
		input = {},
		assert: AssertFn,
		waitFor: WaitForFn
	): Promise<{ oscillatorType: string, frequencyHz: number }> {
		const harness = this.createAudioHarness()
		const states: string[] = []
		const synth = new PrimitiveSynth({
			createAudioContext: () => harness.audioContext,
			onStateChange: (state) => states.push(state),
			scheduleTimeout: harness.scheduleTimeout,
			cancelTimeout: harness.cancelTimeout
		})

		const started = await synth.startNote(261.6255653005986)
		await waitFor(() => harness.oscillatorStates.length === 1, 'Expected synth start to create one oscillator')
		assert(started === true, 'Expected synth start to succeed with a stubbed audio context')
		assert(harness.resumeCalls === 1, 'Expected synth start to resume a suspended audio context once')
		assert(harness.oscillatorStates[0].type === 'sine', 'Expected oscillator type to be sine')
		assert(harness.oscillatorStates[0].frequencyHz === 261.6255653005986, 'Expected requested keyboard pitch to be applied to the oscillator frequency')
		assert(
			harness.gainEvents.some((event) => event.method === 'linearRampToValueAtTime' && event.value === 0.18),
			'Expected synth start to schedule an attack ramp toward the target gain'
		)
		assert(states[states.length - 1] === 'playing', 'Expected final emitted state after start to be playing')
		return {
			oscillatorType: harness.oscillatorStates[0].type,
			frequencyHz: harness.oscillatorStates[0].frequencyHz
		}
	}

	@Scenario('polyphonic sync starts one voice per unique held note and monophonic mode collapses to the latest note')
	static async syncsPolyphonicAndMonophonicVoices(
		input = {},
		assert: AssertFn,
		waitFor: WaitForFn
	): Promise<{ polyphonicVoiceCount: number, monophonicVoiceCount: number, survivingFrequencyHz: number }> {
		const harness = this.createAudioHarness()
		const synth = new PrimitiveSynth({
			createAudioContext: () => harness.audioContext,
			scheduleTimeout: harness.scheduleTimeout,
			cancelTimeout: harness.cancelTimeout
		})

		await synth.syncNotes([261.6255653005986, 293.6647679174076])
		await waitFor(() => synth.getActiveVoiceCount() === 2, 'Expected polyphonic sync to start two voices')
		const polyphonicVoiceCount = synth.getActiveVoiceCount()
		assert(polyphonicVoiceCount === 2, 'Expected synth to sound two simultaneous voices in polyphonic mode')
		assert(harness.oscillatorStates.length === 2, 'Expected polyphonic sync to create two oscillators')
		assert(harness.oscillatorStates[0].frequencyHz === 261.6255653005986, 'Expected first polyphonic voice to use the first requested pitch')
		assert(harness.oscillatorStates[1].frequencyHz === 293.6647679174076, 'Expected second polyphonic voice to use the second requested pitch')

		synth.setMonophonic(true)
		await synth.syncNotes([261.6255653005986, 293.6647679174076])
		await waitFor(() => synth.getActiveVoiceCount() === 1, 'Expected monophonic sync to collapse to one voice')
		const monophonicVoiceCount = synth.getActiveVoiceCount()
		assert(monophonicVoiceCount === 1, 'Expected monophonic mode to keep only one sounding voice')
		assert(harness.oscillatorStates[0].stopTimes.length >= 1, 'Expected the earlier polyphonic voice to be retired when switching to monophonic mode')
		const survivingFrequencyHz = harness.findActiveFrequencies()[0] ?? 0
		assert(survivingFrequencyHz === 293.6647679174076, 'Expected monophonic mode to keep only the latest held pitch sounding')
		return { polyphonicVoiceCount, monophonicVoiceCount, survivingFrequencyHz }
	}

	@Scenario('release and retrigger stop cleanly without losing the ability to play again')
	static async releasesAndRetriggersWithoutBreaking(
		input = {},
		assert: AssertFn,
		waitFor: WaitForFn
	): Promise<{ oscillatorCount: number, finalState: string }> {
		const harness = this.createAudioHarness()
		const states: string[] = []
		const synth = new PrimitiveSynth({
			createAudioContext: () => harness.audioContext,
			onStateChange: (state) => states.push(state),
			scheduleTimeout: harness.scheduleTimeout,
			cancelTimeout: harness.cancelTimeout
		})

		await synth.startNote()
		const released = synth.releaseNote()
		assert(released === true, 'Expected releaseNote to succeed after a note is started')
		assert(states[states.length - 1] === 'releasing', 'Expected releaseNote to emit a releasing state immediately')
		assert(harness.oscillatorStates[0].stopTimes.length === 1, 'Expected release to schedule one oscillator stop time')
		assert(
			harness.gainEvents.some((event) => event.method === 'exponentialRampToValueAtTime' && event.value === 0.0001),
			'Expected release to schedule an exponential fade toward silence'
		)

		harness.runScheduledTimeouts()
		await waitFor(() => states[states.length - 1] === 'ready', 'Expected scheduled ready-state callback to run after release')
		await synth.startNote(293.6647679174076)
		await waitFor(() => harness.oscillatorStates.length === 2, 'Expected retrigger to create a fresh oscillator after release')
		assert(harness.oscillatorStates.length === 2, 'Expected retrigger to create a second oscillator')
		assert(harness.oscillatorStates[1].frequencyHz === 293.6647679174076, 'Expected retrigger to allow a new keyboard pitch to be played')
		assert(states[states.length - 1] === 'playing', 'Expected synth to return to playing after retriggering')
		return { oscillatorCount: harness.oscillatorStates.length, finalState: states[states.length - 1] }
	}

	@Spec('Creates a deterministic fake AudioContext and timeout scheduler for synth unit scenarios.')
	private static createAudioHarness(): {
		audioContext: AudioContext
		resumeCalls: number
		oscillatorStates: { type: OscillatorType, frequencyHz: number, startTimes: number[], stopTimes: number[], disconnected: boolean }[]
		gainEvents: { method: string, value: number, time: number }[]
		scheduleTimeout: (callback: () => void, delayMs: number) => number
		cancelTimeout: (timeoutId: number) => void
		runScheduledTimeouts: () => void
		findActiveFrequencies: () => number[]
	} {
		let resumeCalls = 0
		let nextTimeoutId = 1
		const oscillatorStates: { type: OscillatorType, frequencyHz: number, startTimes: number[], stopTimes: number[], disconnected: boolean }[] = []
		const gainEvents: { method: string, value: number, time: number }[] = []
		const scheduledTimeouts: { id: number, callback: () => void, canceled: boolean }[] = []
		let contextState: 'running' | 'suspended' | 'closed' = 'suspended'
		const destination = {}

		const audioContext = {
			currentTime: 4,
			get state() {
				return contextState
			},
			destination,
			resume: async () => {
				resumeCalls += 1
				contextState = 'running'
				return undefined
			},
			createGain: () => {
				const gain = {
					value: 0.0001,
					cancelScheduledValues: (_time: number) => undefined,
					setValueAtTime: (value: number, time: number) => {
						gain.value = value
						gainEvents.push({ method: 'setValueAtTime', value, time })
					},
					linearRampToValueAtTime: (value: number, time: number) => {
						gain.value = value
						gainEvents.push({ method: 'linearRampToValueAtTime', value, time })
					},
					exponentialRampToValueAtTime: (value: number, time: number) => {
						gain.value = value
						gainEvents.push({ method: 'exponentialRampToValueAtTime', value, time })
					}
				}
				return {
					gain,
					connect: (_destinationNode: unknown) => undefined,
					disconnect: () => undefined
				}
			},
			createOscillator: () => {
				const oscillatorState: { type: OscillatorType, frequencyHz: number, startTimes: number[], stopTimes: number[], disconnected: boolean } = {
					type: 'sine',
					frequencyHz: 440,
					startTimes: [] as number[],
					stopTimes: [] as number[],
					disconnected: false
				}
				oscillatorStates.push(oscillatorState)
				const oscillator = {
					get type() {
						return oscillatorState.type
					},
					set type(value: OscillatorType) {
						oscillatorState.type = value
					},
					frequency: {
						get value() {
							return oscillatorState.frequencyHz
						},
						set value(value: number) {
							oscillatorState.frequencyHz = value
						}
					},
					onended: null as ((event: Event) => void) | null,
					connect: (_destinationNode: unknown) => undefined,
					disconnect: () => {
						oscillatorState.disconnected = true
					},
					start: (time?: number) => {
						oscillatorState.startTimes.push(time ?? 0)
					},
					stop: (time?: number) => {
						oscillatorState.stopTimes.push(time ?? 0)
						oscillator.onended?.(new Event('ended'))
					}
				}
				return oscillator
			}
		} as unknown as AudioContext

		return {
			audioContext,
			get resumeCalls() {
				return resumeCalls
			},
			oscillatorStates,
			gainEvents,
			scheduleTimeout: (callback: () => void, _delayMs: number) => {
				const timeoutId = nextTimeoutId
				nextTimeoutId += 1
				scheduledTimeouts.push({ id: timeoutId, callback, canceled: false })
				return timeoutId
			},
			cancelTimeout: (timeoutId: number) => {
				const timeout = scheduledTimeouts.find((candidate) => candidate.id === timeoutId)
				if (timeout !== undefined) {
					timeout.canceled = true
				}
			},
			runScheduledTimeouts: () => {
				for (const timeout of scheduledTimeouts) {
					if (timeout.canceled === false) {
						timeout.callback()
						timeout.canceled = true
					}
				}
			},
			findActiveFrequencies: () => oscillatorStates.filter((state) => state.disconnected === false).map((state) => state.frequencyHz)
		}
	}
}
