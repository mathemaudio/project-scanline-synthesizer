import './AppStyleSheet.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '../system/lll.lll'
import { AppStyleSheet } from './AppStyleSheet.lll'

@Spec('Verifies the combined app style sheet still exposes the split chrome and control-panel selectors.')
export class AppStyleSheetTest {
	testType = 'unit'

	@Scenario('combined style sheet includes piano guide, corner badge, and status table selectors from both style modules')
	static async includesSplitStyleSelectors(scenario?: ScenarioParameter): Promise<{ cssText: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const cssText = String(AppStyleSheet.styles)
		assert(cssText.includes('.piano-keyboard'), 'Expected the combined style sheet to include the piano keyboard guide selector')
		assert(cssText.includes('.lll-corner-link'), 'Expected the combined style sheet to include the bottom-left LLL corner badge selector')
		assert(cssText.includes('.status-table-card'), 'Expected the combined style sheet to include the status table card selector')
		return { cssText }
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
