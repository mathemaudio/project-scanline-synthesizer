import './MidiNoteMapper.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '../../system/lll.lll'
import { MidiNoteMapper } from './MidiNoteMapper.lll'

@Spec('Verifies MIDI note numbers map into stable note labels and frequencies for synth input.')
export class MidiNoteMapperTest {
	testType = 'unit'

	@Scenario('MIDI note 60 maps to middle C')
	static async mapsMiddleC(subjectFactory: SubjectFactory<MidiNoteMapper>, scenario?: ScenarioParameter): Promise<{ noteLabel: string, frequencyHz: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const mapper = await this.createMapper(subjectFactory)
		const pitch = mapper.getPitchForMidiNote(60)
		assert(pitch !== null, 'Expected MIDI note 60 to map to a pitch')
		assert(pitch.noteLabel === 'C4', 'Expected MIDI note 60 to map to C4')
		assert(Math.abs(pitch.frequencyHz - 261.6255653005986) < 0.000001, 'Expected MIDI note 60 to map to middle C frequency')
		return { noteLabel: pitch.noteLabel, frequencyHz: pitch.frequencyHz.toFixed(6) }
	}

	@Scenario('out of range MIDI notes are rejected')
	static async rejectsOutOfRangeMidiNotes(subjectFactory: SubjectFactory<MidiNoteMapper>, scenario?: ScenarioParameter): Promise<{ low: string, high: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const mapper = await this.createMapper(subjectFactory)
		const low = mapper.getPitchForMidiNote(-1)
		const high = mapper.getPitchForMidiNote(128)
		assert(low === null, 'Expected negative MIDI notes to be rejected')
		assert(high === null, 'Expected MIDI notes above 127 to be rejected')
		return { low: String(low), high: String(high) }
	}

	@Spec('Creates a mapper subject through the runner when available or directly otherwise.')
	private static async createMapper(subjectFactory: SubjectFactory<MidiNoteMapper>): Promise<MidiNoteMapper> {
		if (typeof subjectFactory === 'function') {
			return await subjectFactory()
		}
		return new MidiNoteMapper()
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
