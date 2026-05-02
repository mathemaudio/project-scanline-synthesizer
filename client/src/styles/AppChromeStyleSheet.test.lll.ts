import './AppChromeStyleSheet.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '../system/lll.lll'
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
		assert(cssText.includes('display: none;'), 'Expected the chrome style sheet to collapse the old middle-row mode section')
		assert(cssText.includes('width: calc(100% / var(--white-key-count) * 0.54);'), 'Expected the chrome style sheet to squeeze the black key width')
		assert(cssText.includes('grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);'), 'Expected the chrome style sheet to preserve the keyboard guide row with centered octave controls')
		assert(cssText.includes('grid-template-columns: minmax(250px, 0.62fr) minmax(600px, 1.52fr) minmax(440px, 1.18fr);'), 'Expected the chrome style sheet to preserve the three-column desktop panel layout while zoom handles narrower widths')
		return { cssText }
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
