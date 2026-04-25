import './MidiInputController.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '../../system/lll.lll'
import { MidiAccessLike } from './MidiAccessLike.lll'
import { MidiInputLike } from './MidiInputLike.lll'
import { MidiInputController } from './MidiInputController.lll'
import { MidiNoteMapper } from './MidiNoteMapper.lll'

@Spec('Verifies the MIDI input controller tracks held notes and clears them on disconnect.')
export class MidiInputControllerTest {
	testType = 'unit'

	@Scenario('note on and note off update held MIDI note order')
	static async tracksHeldMidiNotes(subjectFactory: SubjectFactory<MidiInputController>, scenario?: ScenarioParameter): Promise<{ activeNote: string, heldNotes: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const emittedStates: string[] = []
		const input: MidiInputLike = { onmidimessage: null }
		const access: MidiAccessLike = { inputs: this.createMidiInputCollection(input), onstatechange: null }
		const controller = await this.createController(subjectFactory, access, emittedStates)
		await controller.connect()
		input.onmidimessage?.({ data: [0x90, 60, 100] })
		input.onmidimessage?.({ data: [0x90, 64, 100] })
		input.onmidimessage?.({ data: [0x80, 60, 0] })
		const activeNote = controller.getActivePitch()?.noteLabel ?? 'none'
		const heldNotes = controller.getHeldPitches().map((pitch) => pitch.noteLabel).join(', ')
		assert(activeNote === 'E4', 'Expected the newest held MIDI note to remain active after releasing the earlier note')
		assert(heldNotes === 'E4', 'Expected only E4 to remain held after releasing middle C')
		assert(emittedStates.join(' | ') === 'C4 | C4, E4 | E4', 'Expected the controller to emit each visible held-note state in order')
		return { activeNote, heldNotes }
	}

	@Scenario('disconnect clears any held MIDI notes')
	static async clearsHeldNotesOnDisconnect(subjectFactory: SubjectFactory<MidiInputController>, scenario?: ScenarioParameter): Promise<{ heldAfterDisconnect: number, finalEmission: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const emittedStates: string[] = []
		const input: MidiInputLike = { onmidimessage: null }
		const access: MidiAccessLike = { inputs: this.createMidiInputCollection(input), onstatechange: null }
		const controller = await this.createController(subjectFactory, access, emittedStates)
		await controller.connect()
		input.onmidimessage?.({ data: [0x90, 72, 100] })
		await controller.disconnect()
		const heldAfterDisconnect = controller.getHeldPitches().length
		const finalEmission = emittedStates[emittedStates.length - 1] ?? 'missing'
		assert(heldAfterDisconnect === 0, 'Expected disconnect to clear held MIDI notes')
		assert(finalEmission === 'none', 'Expected disconnect to emit an empty held-note state after clearing MIDI notes')
		return { heldAfterDisconnect, finalEmission }
	}

	@Spec('Creates a MIDI controller subject through the runner when available or directly otherwise.')
	private static async createController(subjectFactory: SubjectFactory<MidiInputController>, access: MidiAccessLike, emittedStates: string[]): Promise<MidiInputController> {
		if (typeof subjectFactory === 'function') {
			return await subjectFactory()
		}
		return new MidiInputController({
			midiNoteMapper: new MidiNoteMapper(),
			createMidiAccess: async () => access,
			onPlayStateChange: async (playState) => {
				emittedStates.push(playState.heldPitches.length === 0 ? 'none' : playState.heldPitches.map((pitch) => pitch.noteLabel).join(', '))
			}
		})
	}

	@Spec('Creates a tiny MIDI input collection test double that matches the values iterator shape used by the controller.')
	private static createMidiInputCollection(input: MidiInputLike): { values(): IterableIterator<MidiInputLike> } {
		return {
			values: function* () {
				yield input
			}
		}
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
