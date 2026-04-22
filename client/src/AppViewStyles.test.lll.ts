import './AppViewStyles.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { AppStyles } from './AppStyles.lll'
import { AppViewStyles } from './AppViewStyles.lll'

@Spec('Verifies the focused App view style binding.')
export class AppViewStylesTest {
	testType = 'unit'

	@Scenario('app view styles reuse the shared app styles object')
	static async reusesSharedAppStyles(scenario?: ScenarioParameter): Promise<{ isSharedReference: boolean }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		assert(AppViewStyles.styles === AppStyles.styles, 'Expected AppViewStyles to expose the shared AppStyles reference directly')
		return { isSharedReference: AppViewStyles.styles === AppStyles.styles }
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
