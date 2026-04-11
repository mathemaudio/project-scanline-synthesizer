import './App.lll'
import { Spec, Scenario } from '@shared/lll.lll'

@Spec('Covers the visible Scanline Synth app shell and mode toggle behavior.')
export class AppTest {
	static readonly testType = 'behavioral' as const

	@Spec('Waits for Lit updates to flush after a user-visible UI action.')
	private static async settle() {
		await Promise.resolve()
		await Promise.resolve()
	}

	@Scenario('Shows the synth shell and updates the visible voice mode when the mono toggle changes.')
	static async showsShellAndTogglesMode() {
		const element = document.createElement('app-root') as HTMLElement
		document.body.appendChild(element)
		await AppTest.settle()

		const root = element.shadowRoot
		if (root === null) {
			throw new Error('Expected app-root to render a shadow root')
		}

		const title = root.querySelector('h1')?.textContent?.trim()
		if (title !== 'Scanline Synth') {
			throw new Error(`Expected title to be Scanline Synth but received ${title ?? 'nothing'}`)
		}

		const voiceModeBefore = root.querySelector('#voice-mode-value')?.textContent?.trim()
		if (voiceModeBefore !== 'Polyphonic') {
			throw new Error(`Expected initial voice mode to be Polyphonic but received ${voiceModeBefore ?? 'nothing'}`)
		}

		const toggle = root.querySelector('#monophonic-toggle') as HTMLInputElement | null
		if (toggle === null) {
			throw new Error('Expected monophonic toggle to be rendered')
		}
		toggle.checked = true
		toggle.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
		await AppTest.settle()

		const voiceModeAfter = root.querySelector('#voice-mode-value')?.textContent?.trim()
		if (voiceModeAfter !== 'Monophonic') {
			throw new Error(`Expected toggled voice mode to be Monophonic but received ${voiceModeAfter ?? 'nothing'}`)
		}

		element.remove()
	}
}
