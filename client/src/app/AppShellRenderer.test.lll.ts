import './AppShellRenderer.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '../system/lll.lll'
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

	@Scenario('keyboard guide renders piano keyboard markup for the mapped upper and lower rows')
	static async rendersPianoKeyboardGuide(subjectFactory: SubjectFactory<AppShellRenderer>, scenario?: ScenarioParameter): Promise<{ upperValueCount: number, lowerValueCount: number, renderStringCount: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const renderer = new AppShellRenderer(this.createAppStub())
		const renderTemplate = renderer.render()
		const upperTemplate = renderer.renderUpperRowPianoKeyboard()
		const lowerTemplate = renderer.renderLowerRowPianoKeyboard()
		const renderMarkup = renderTemplate.strings.join('')
		const upperMarkup = upperTemplate.strings.join('')
		const lowerMarkup = lowerTemplate.strings.join('')
		assert(renderMarkup.includes('lll-corner-link'), 'Expected the shell renderer to include the bottom-left LLL corner link class in the top-level shell markup')
		assert(renderMarkup.includes('https://lllts.dev'), 'Expected the shell renderer to link the corner badge to the LLL website')
		assert(renderMarkup.includes('made with LLL'), 'Expected the shell renderer to label the corner badge with made with LLL text')
		assert(renderMarkup.includes('Upper keyboard'), 'Expected the keyboard guide to relabel the upper row as an upper keyboard')
		assert(renderMarkup.includes('Lower keyboard'), 'Expected the keyboard guide to relabel the lower row as a lower keyboard')
		assert(renderMarkup.includes('panel'), 'Expected the shell renderer to delegate lower layout content to the sound-design panel renderer')
		assert(upperMarkup.includes('piano-keyboard'), 'Expected the upper keyboard guide template to include piano keyboard markup')
		assert(lowerMarkup.includes('piano-keyboard'), 'Expected the lower keyboard guide template to include piano keyboard markup')
		assert(upperMarkup.includes('piano-white-keys'), 'Expected the upper piano keyboard template to render a white-key layer')
		assert(upperMarkup.includes('piano-black-keys'), 'Expected the upper piano keyboard template to render a black-key overlay layer')
		assert(lowerMarkup.includes('piano-white-keys'), 'Expected the lower piano keyboard template to render a white-key layer')
		assert(lowerMarkup.includes('piano-black-keys'), 'Expected the lower piano keyboard template to render a black-key overlay layer')
		assert(upperTemplate.values.length === 3, 'Expected the upper piano keyboard template to expose style, white-key list, and black-key list values')
		assert(lowerTemplate.values.length === 3, 'Expected the lower piano keyboard template to expose style, white-key list, and black-key list values')
		return {
			upperValueCount: upperTemplate.values.length,
			lowerValueCount: lowerTemplate.values.length,
			renderStringCount: renderTemplate.strings.length
		}
	}

	@Spec('Builds the minimal app stub needed by the shell renderer tests.')
	private static createAppStub(): App {
		return {
			playbackMode: 'cutoff',
			isMonophonic: true,
			portamentoMs: 87,
			keyboardBaseOctave: 3,
			appSoundDesignPanel: {
				renderStatusUploadPanel: () => ({ strings: ['panel'], values: [] } as unknown),
				renderKeyboardOctaveControls: () => ({ strings: ['octave-controls'], values: [] } as unknown)
			},
			onMonophonicToggle: () => undefined,
			onPortamentoInput: () => undefined,
			getKeyboardUpperRowGuide: () => 'upper guide',
			getKeyboardLowerRowGuide: () => 'lower guide',
			getPortamentoValueLabel: () => '87 ms',
			renderPlaybackModeOption: () => ({ strings: ['option'], values: [] } as unknown),
			isPianoKeyActive: () => false,
			onPianoKeyPointerDown: async () => undefined,
			onPianoKeyPointerEnter: async () => undefined,
			onPianoKeyPointerLeave: async () => undefined
		} as unknown as App
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
