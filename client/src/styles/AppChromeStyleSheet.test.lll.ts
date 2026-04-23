import './AppChromeStyleSheet.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { AppChromeStyleSheet } from './AppChromeStyleSheet.lll'

@Spec('Verifies the app chrome style sheet covers the shell and piano keyboard guide selectors.')
export class AppChromeStyleSheetTest {
	testType = 'unit'

	@Scenario('chrome style sheet includes shell and piano keyboard guide selectors')
	static async includesPianoGuideSelectors(scenario?: ScenarioParameter): Promise<{ cssText: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const cssText = String(AppChromeStyleSheet.styles)
		assert(cssText.includes('.keyboard-guide'), 'Expected the chrome style sheet to include the keyboard guide selector')
		assert(cssText.includes('.piano-keyboard'), 'Expected the chrome style sheet to include the piano keyboard selector')
		assert(cssText.includes('.guide-subtitle'), 'Expected the chrome style sheet to include the guide subtitle selector')
		assert(cssText.includes('.mode-section'), 'Expected the chrome style sheet to include the playback mode section selector')
		assert(cssText.includes('grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);'), 'Expected the chrome style sheet to tighten the playback mode section columns')
		return { cssText }
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
