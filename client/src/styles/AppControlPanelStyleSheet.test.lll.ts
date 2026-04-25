import './AppControlPanelStyleSheet.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { AppControlPanelStyleSheet } from './AppControlPanelStyleSheet.lll'

@Spec('Verifies the control-panel style sheet covers the status cards and playback controls.')
export class AppControlPanelStyleSheetTest {
	testType = 'unit'

	@Scenario('control-panel style sheet includes status table and playback control selectors')
	static async includesControlPanelSelectors(scenario?: ScenarioParameter): Promise<{ cssText: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const cssText = String(AppControlPanelStyleSheet.styles)
		assert(cssText.includes('.status-table-card'), 'Expected the control-panel style sheet to include the status table card selector')
		assert(cssText.includes('.switch-card-compact'), 'Expected the control-panel style sheet to include the compact switch selector')
		assert(cssText.includes('.mode-selector-card-inline'), 'Expected the control-panel style sheet to include the inline playback mode card selector')
		assert(cssText.includes('.switch-card-keyboard-side'), 'Expected the control-panel style sheet to include the keyboard-side monophonic card selector')
		assert(cssText.includes('grid-template-columns: repeat(3, minmax(150px, 1fr));'), 'Expected the control-panel style sheet to define narrower playback mode columns in the right panel')
		return { cssText }
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
