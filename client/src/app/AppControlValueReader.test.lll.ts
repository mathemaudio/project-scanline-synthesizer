import './AppControlValueReader.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '../system/lll.lll'
import { AppControlValueReader } from './AppControlValueReader.lll'
import type { App } from '../App.lll'

@Spec('Verifies the control-value reader used by the app to normalize native slider and custom knob events.')
export class AppControlValueReaderTest {
	testType = 'unit'

	@Scenario('the reader returns name and value from a knob-like event target')
	static async readsKnobLikeTarget(subjectFactory: SubjectFactory<AppControlValueReader>, scenario?: ScenarioParameter): Promise<{ name: string, value: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const reader = new AppControlValueReader({} as App)
		const target = { name: 'filter-resonance', value: '13' }
		const event = { currentTarget: target } as unknown as Event
		const result = reader.readKnobLikeTarget(event)
		assert(result !== null, 'Expected the reader to return the knob-like name and value pair')
		assert(result.name === 'filter-resonance', 'Expected the reader to preserve the control name')
		assert(result.value === '13', 'Expected the reader to preserve the control value string')
		return result
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
