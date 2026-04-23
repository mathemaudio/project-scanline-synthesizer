// Temporary harmless edit for tool icon debugging; safe to revert.
import './AppShellRenderer.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '@shared/lll.lll'
import { AppShellRenderer } from './AppShellRenderer.lll'
import type { App } from '../App.lll'

@Spec('Verifies the focused top-level app shell renderer output.')
export class AppShellRendererTest {
	testType = 'unit'

	@Scenario('playback mode options mark the selected mode and keep the expected radio metadata')
	static async rendersSelectedPlaybackModeOption(subjectFactory: SubjectFactory<AppShellRenderer>, scenario?: ScenarioParameter): Promise<{ stringCount: number, selectedClassName: string, serializedValues: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const renderer = new AppShellRenderer(this.createAppStub())
		const template = renderer.renderPlaybackModeOption('cutoff', 'Cutoff', 'Filter ADSR')
		const selectedClassName = String(template.values[0] ?? '')
		const serializedValues = template.values.map((value) => String(value)).join('|')
		assert(selectedClassName.includes('radio-option-selected'), 'Expected the selected playback mode option to include the selected class name')
		assert(serializedValues.includes('cutoff'), 'Expected the playback mode radio option to preserve the cutoff value somewhere in its dynamic values')
		assert(template.strings.join('').includes('radio-input'), 'Expected the playback mode template to render a radio input')
		return { stringCount: template.strings.length, selectedClassName, serializedValues }
	}

	@Spec('Builds the minimal app stub needed by the shell renderer tests.')
	private static createAppStub(): App {
		return {
			playbackMode: 'cutoff',
			isMonophonic: true,
			portamentoMs: 87,
			appSoundDesignPanel: { renderStatusUploadPanel: () => ({ strings: ['panel'], values: [] } as unknown) },
			onMonophonicToggle: () => undefined,
			onPortamentoInput: () => undefined,
			getKeyboardUpperRowGuide: () => 'upper guide',
			getKeyboardLowerRowGuide: () => 'lower guide',
			getPortamentoValueLabel: () => '87 ms',
			renderPlaybackModeOption: () => ({ strings: ['option'], values: [] } as unknown)
		} as unknown as App
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
