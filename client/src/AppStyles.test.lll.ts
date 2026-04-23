import './AppStyles.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { AppStyles } from './AppStyles.lll'

@Spec('Verifies the shared Scanline Synth style sheet includes the new compact mode row, playback selector, and right-side settings panel selectors.')
export class AppStylesTest {
	testType = 'unit'

	@Scenario('style sheet includes selectors for the compact monophonic card, radio group, and sound-design panel')
	static async includesPlaybackModeLayoutSelectors(scenario?: ScenarioParameter): Promise<{ cssText: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const cssText = String(AppStyles.styles)

		assert(cssText.includes('.switch-card-compact'), 'Expected the compact monophonic control selector to exist in the shared style sheet')
		assert(cssText.includes('.radio-group'), 'Expected the playback-mode radio group selector to exist in the shared style sheet')
		assert(cssText.includes('.sound-design-card'), 'Expected the right-side playback settings panel selector to exist in the shared style sheet')
		return { cssText }
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
