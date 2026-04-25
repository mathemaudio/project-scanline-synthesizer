import './WaveformRowRandomizer.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '../system/lll.lll'
import { WaveformRowRandomizer } from './WaveformRowRandomizer.lll'

@Spec('Verifies nearby-row randomization behavior for uploaded waveform rows.')
export class WaveformRowRandomizerTest {
	testType = 'unit'

	@Scenario('zero randomness keeps the current row unchanged')
	static async keepsCurrentRowWhenDisabled(subjectFactory: SubjectFactory<WaveformRowRandomizer>, scenario?: ScenarioParameter): Promise<{ rowIndex: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const randomizer = new WaveformRowRandomizer()
		const rowIndex = randomizer.chooseRandomizedRowIndex(7, 100, 0, 0.1, 0.9)
		assert(rowIndex === 7, 'Expected zero randomness to leave the current row unchanged')
		return { rowIndex }
	}

	@Scenario('enabled randomness chooses from the upper half of the configured nearby range')
	static async usesUpperHalfDistanceRange(subjectFactory: SubjectFactory<WaveformRowRandomizer>, scenario?: ScenarioParameter): Promise<{ rowIndex: number, jumpDistance: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const randomizer = new WaveformRowRandomizer()
		const rowIndex = randomizer.chooseRandomizedRowIndex(50, 100, 10, 0.75, 0.99)
		const jumpDistance = Math.abs(rowIndex - 50)
		assert(rowIndex === 60, 'Expected a 10 percent range to allow an upper-half jump out to ten rows when moving upward')
		assert(jumpDistance >= 5 && jumpDistance <= 10, 'Expected row randomness to stay inside the upper half of the configured nearby range')
		return { rowIndex, jumpDistance }
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
