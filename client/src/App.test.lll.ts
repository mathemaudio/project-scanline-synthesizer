import './App.lll'
import { LitElement, css, html, render, type TemplateResult } from 'lit'
import { customElement } from 'lit/decorators.js'
import { AssertFn, Scenario, Spec, WaitForFn } from '@shared/lll.lll'
import { App } from './App.lll'

@Spec('Exercises the phase-two Scanline Synth UI through visible QWERTY keyboard interactions only.')
@customElement('app-test-panel')
export class AppTest extends LitElement {
	testType = "behavioral"
	private static activeInstance: AppTest | null = null

	static styles = css`
		:host {
			display: block;
			padding: 8px;
		}
	`

	@Spec('Tracks the currently connected App test panel for behavioral scenario reuse.')
	connectedCallback() {
		super.connectedCallback()
		AppTest.activeInstance = this
	}

	@Spec('Clears the tracked App test panel when it disconnects.')
	disconnectedCallback() {
		if (AppTest.activeInstance === this) {
			AppTest.activeInstance = null
		}
		super.disconnectedCallback()
	}

	@Spec('Renders the app host used to mount app-root for behavioral keyboard scenarios.')
	render(): TemplateResult {
		return html`<div id="app-host"><app-root></app-root></div>`
	}

	@Scenario('pressing Q starts a visible C4 note from the keyboard')
	static async startsMappedKeyboardNote(
		input = {},
		assert: AssertFn,
		waitFor: WaitForFn
	): Promise<{ activeKey: string, activeNote: string, noteState: string }> {
		this.installAudioContextStub()
		const app = await this.getRenderedApp(waitFor)
		assert(this.readTextById(app, 'waveform-value') === 'Sine', 'Expected waveform card to show Sine')
		this.dispatchKeyboardEvent('keydown', 'q')
		await waitFor(() => this.readTextById(app, 'note-state-value') === 'Playing', 'Expected note state to show Playing after pressing Q')
		const activeKey = this.readTextById(app, 'active-key-value')
		const activeNote = this.readTextById(app, 'active-note-value')
		const noteState = this.readTextById(app, 'note-state-value')
		const pitchText = this.readTextById(app, 'pitch-value')
		assert(activeKey === 'Q', 'Expected Q to be shown as the active key')
		assert(activeNote === 'C4', 'Expected pressing Q to show active note C4')
		assert(noteState === 'Playing', 'Expected note state to be Playing after pressing Q')
		assert(pitchText.includes('C4'), 'Expected pitch card to include the C4 note label')
		assert(this.readTextById(app, 'trigger-count-value') === '1', 'Expected first mapped key press to increase trigger count to 1')
		return { activeKey, activeNote, noteState }
	}

	@Scenario('releasing a mapped key returns the UI to ready and clears the active note')
	static async releasesMappedKeyboardNote(
		input = {},
		assert: AssertFn,
		waitFor: WaitForFn
	): Promise<{ noteStateAfterRelease: string, activeNoteAfterRelease: string }> {
		this.installAudioContextStub()
		const app = await this.getRenderedApp(waitFor)
		this.dispatchKeyboardEvent('keydown', 'q')
		await waitFor(() => this.readTextById(app, 'note-state-value') === 'Playing', 'Expected note to begin playing before key release')
		this.dispatchKeyboardEvent('keyup', 'q')
		await waitFor(() => this.readTextById(app, 'note-state-value') === 'Releasing', 'Expected key release to show Releasing immediately')
		await waitFor(() => this.readTextById(app, 'note-state-value') === 'Ready to play', 'Expected key release to return the UI to Ready to play')
		const noteStateAfterRelease = this.readTextById(app, 'note-state-value')
		const activeNoteAfterRelease = this.readTextById(app, 'active-note-value')
		assert(noteStateAfterRelease === 'Ready to play', 'Expected note state to return to Ready to play after release')
		assert(activeNoteAfterRelease === '—', 'Expected active note card to clear after releasing the final held key')
		assert(this.readTextById(app, 'pitch-value') === 'No active note', 'Expected pitch card to clear after note-off')
		return { noteStateAfterRelease, activeNoteAfterRelease }
	}

	@Scenario('adjacent mapped keys step through visible chromatic notes in semitone order')
	static async stepsThroughChromaticKeyboardNotes(
		input = {},
		assert: AssertFn,
		waitFor: WaitForFn
	): Promise<{ firstNote: string, secondNote: string, thirdNote: string }> {
		this.installAudioContextStub()
		const app = await this.getRenderedApp(waitFor)
		this.dispatchKeyboardEvent('keydown', 'q')
		await waitFor(() => this.readTextById(app, 'active-note-value') === 'C4', 'Expected Q to activate C4')
		await waitFor(() => this.readTextById(app, 'note-state-value') === 'Playing', 'Expected Q keydown to place the synth in Playing state')
		const firstNote = this.readTextById(app, 'active-note-value')
		this.dispatchKeyboardEvent('keyup', 'q')
		await waitFor(() => this.readTextById(app, 'note-state-value') === 'Ready to play', 'Expected release of Q to settle before the next mapped key')
		this.dispatchKeyboardEvent('keydown', '2')
		await waitFor(() => this.readTextById(app, 'active-note-value') === 'C#4', 'Expected 2 to activate C#4')
		await waitFor(() => this.readTextById(app, 'note-state-value') === 'Playing', 'Expected 2 keydown to place the synth in Playing state')
		const secondNote = this.readTextById(app, 'active-note-value')
		this.dispatchKeyboardEvent('keyup', '2')
		await waitFor(() => this.readTextById(app, 'note-state-value') === 'Ready to play', 'Expected release of 2 to settle before the next mapped key')
		this.dispatchKeyboardEvent('keydown', 'w')
		await waitFor(() => this.readTextById(app, 'active-note-value') === 'D4', 'Expected W to activate D4')
		await waitFor(() => this.readTextById(app, 'note-state-value') === 'Playing', 'Expected W keydown to place the synth in Playing state')
		const thirdNote = this.readTextById(app, 'active-note-value')
		assert(firstNote === 'C4', 'Expected first visible chromatic note to be C4')
		assert(secondNote === 'C#4', 'Expected second visible chromatic note to be C#4')
		assert(thirdNote === 'D4', 'Expected third visible chromatic note to be D4')
		return { firstNote, secondNote, thirdNote }
	}

	@Scenario('the upper row continues visibly into the next octave and matches the duplicated lower-row start')
	static async continuesTopRowIntoNextOctave(
		input = {},
		assert: AssertFn,
		waitFor: WaitForFn
	): Promise<{ topGuide: string, continuedTopRowNote: string, duplicatedLowerRowNote: string }> {
		this.installAudioContextStub()
		const app = await this.getRenderedApp(waitFor)
		const topGuide = this.readTextById(app, 'keyboard-row-top-value')
		assert(topGuide.includes('I 9 O 0 P'), 'Expected the visible upper-row guide to continue through I 9 O 0 P')
		assert(topGuide.includes('C4 to E5'), 'Expected the visible upper-row guide to describe the continued octave range')
		this.dispatchKeyboardEvent('keydown', 'i')
		await waitFor(() => this.readTextById(app, 'active-note-value') === 'C5', 'Expected I to continue the top row at C5')
		const continuedTopRowNote = this.readTextById(app, 'active-note-value')
		this.dispatchKeyboardEvent('keydown', 'z')
		await waitFor(() => this.readTextById(app, 'active-key-value') === 'Z', 'Expected Z to become the newest visibly active duplicated key')
		await waitFor(() => this.readTextById(app, 'active-note-value') === 'C5', 'Expected Z to duplicate the same next-octave C5 note')
		const duplicatedLowerRowNote = this.readTextById(app, 'active-note-value')
		assert(continuedTopRowNote === 'C5', 'Expected I to produce visible note C5')
		assert(duplicatedLowerRowNote === 'C5', 'Expected Z to produce the duplicated visible note C5')
		return { topGuide, continuedTopRowNote, duplicatedLowerRowNote }
	}

	@Spec('Finds the on-screen App instance and remounts it in place for each behavioral scenario.')
	private static async getRenderedApp(waitFor: WaitForFn): Promise<App> {
		await waitFor(() => this.findBestRenderedPanel() !== null, 'Expected app-test-panel to be rendered before scenario actions')
		const panel = this.findBestRenderedPanel()
		if (panel === null) {
			throw new Error('Expected an already-rendered app-test-panel element')
		}
		await panel.updateComplete
		const host = panel.shadowRoot?.querySelector<HTMLElement>('#app-host')
		if (!host) {
			throw new Error('App host not found in rendered app-test-panel')
		}
		render(html``, host)
		render(html`<app-root></app-root>`, host)
		const app = host.querySelector<App>('app-root')
		if (!app) {
			throw new Error('Failed to render app-root in App host')
		}
		await app.updateComplete
		return app
	}

	@Spec('Selects the best currently rendered App test panel, preferring the active visible instance.')
	private static findBestRenderedPanel(): AppTest | null {
		if (this.activeInstance !== null && this.activeInstance.isConnected) {
			return this.activeInstance
		}

		const panels = Array.from(document.querySelectorAll<AppTest>('app-test-panel'))
		const visiblePanel = panels.find((element) => element.isConnected && element.getClientRects().length > 0)
		if (visiblePanel !== undefined) {
			return visiblePanel
		}
		return panels.find((element) => element.isConnected) ?? null
	}

	@Spec('Installs a minimal AudioContext stub so behavioral keyboard tests never depend on real device audio.')
	private static installAudioContextStub() {
		const maybeGlobal = globalThis as Record<string, unknown>
		const audioContextConstructor = function AudioContextStub() {
			const destination = {}
			let contextState: 'running' | 'suspended' | 'closed' = 'suspended'
			return {
				currentTime: 0,
				get state() {
					return contextState
				},
				destination,
				resume: async () => {
					contextState = 'running'
					return undefined
				},
				createGain: () => {
					const gain = {
						value: 0.0001,
						cancelScheduledValues: (_time: number) => undefined,
						setValueAtTime: (value: number, _time: number) => {
							gain.value = value
						},
						linearRampToValueAtTime: (value: number, _time: number) => {
							gain.value = value
						},
						exponentialRampToValueAtTime: (value: number, _time: number) => {
							gain.value = value
						}
					}
					return {
						gain,
						connect: (_destinationNode: unknown) => undefined,
						disconnect: () => undefined
					}
				},
				createOscillator: () => {
					const oscillator = {
						type: 'sine',
						frequency: { value: 440 },
						onended: null as ((event: Event) => void) | null,
						connect: (_destinationNode: unknown) => undefined,
						disconnect: () => undefined,
						start: (_time?: number) => undefined,
						stop: (_time?: number) => {
							oscillator.onended?.(new Event('ended'))
						}
					}
					return oscillator
				}
			}
		} as unknown as new () => AudioContext
		maybeGlobal['AudioContext'] = audioContextConstructor
		maybeGlobal['webkitAudioContext'] = audioContextConstructor
	}

	@Spec('Dispatches a browser keyboard event so the mounted app receives a visible keyboard interaction.')
	private static dispatchKeyboardEvent(type: 'keydown' | 'keyup', key: string) {
		window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true }))
	}

	@Spec('Reads visible text content from a stable element id inside app-root.')
	private static readTextById(app: App, elementId: string): string {
		const element = app.shadowRoot?.querySelector<HTMLElement>(`#${elementId}`)
		if (!element) {
			throw new Error(`Element not found: ${elementId}`)
		}
		return element.textContent?.trim() ?? ''
	}
}
