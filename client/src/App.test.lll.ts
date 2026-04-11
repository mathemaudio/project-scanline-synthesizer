import './App.lll'
import { LitElement, css, html, render, type TemplateResult } from 'lit'
import { customElement } from 'lit/decorators.js'
import { AssertFn, Scenario, Spec, WaitForFn } from '@shared/lll.lll'
import { App } from './App.lll'

@Spec('Exercises the phase-one Scanline Synth UI through visible controls only.')
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

	@Spec('Renders the app host used to mount app-root for behavioral scenarios.')
	render(): TemplateResult {
		return html`<div id="app-host"><app-root></app-root></div>`
	}

	@Scenario('play tone shows the phase-one note as playing')
	static async startsToneThroughVisibleControls(input = {}, assert: AssertFn, waitFor: WaitForFn): Promise<{ noteState: string, triggerCount: string }> {
		this.installAudioContextStub()
		const app = await this.getRenderedApp(waitFor)
		assert(this.readTextById(app, 'waveform-value') === 'Sine', 'Expected waveform card to show Sine')
		await this.clickButtonById(app, 'play-tone-button')
		await waitFor(() => this.readTextById(app, 'note-state-value') === 'Playing', 'Expected note state to show Playing after clicking Play tone')
		const noteState = this.readTextById(app, 'note-state-value')
		const triggerCount = this.readTextById(app, 'trigger-count-value')
		assert(noteState === 'Playing', 'Expected note state to equal Playing')
		assert(triggerCount === '1', 'Expected visible trigger count to equal 1 after first play')
		assert(this.isButtonDisabled(app, 'release-tone-button') === false, 'Expected Release tone button to be enabled while playing')
		return { noteState, triggerCount }
	}

	@Scenario('release tone fades out and returns the UI to ready')
	static async releasesToneThroughVisibleControls(
		input = {},
		assert: AssertFn,
		waitFor: WaitForFn
	): Promise<{ noteStateAfterRelease: string }> {
		this.installAudioContextStub()
		const app = await this.getRenderedApp(waitFor)
		await this.clickButtonById(app, 'play-tone-button')
		await waitFor(() => this.readTextById(app, 'note-state-value') === 'Playing', 'Expected note to start playing before release')
		await this.clickButtonById(app, 'release-tone-button')
		await waitFor(() => this.readTextById(app, 'note-state-value') === 'Releasing', 'Expected note state to show Releasing immediately after release')
		await waitFor(() => this.readTextById(app, 'note-state-value') === 'Ready to play', 'Expected note state to return to Ready to play after release settles')
		const noteStateAfterRelease = this.readTextById(app, 'note-state-value')
		assert(noteStateAfterRelease === 'Ready to play', 'Expected release flow to restore Ready to play state')
		assert(this.isButtonDisabled(app, 'release-tone-button') === true, 'Expected Release tone button to be disabled after note-off settles')
		return { noteStateAfterRelease }
	}

	@Scenario('retriggering the tone increments the visible trigger count')
	static async retriggersToneThroughVisibleControls(
		input = {},
		assert: AssertFn,
		waitFor: WaitForFn
	): Promise<{ triggerCount: string }> {
		this.installAudioContextStub()
		const app = await this.getRenderedApp(waitFor)
		const initialTriggerCount = Number(this.readTextById(app, 'trigger-count-value'))
		await this.clickButtonById(app, 'play-tone-button')
		await waitFor(() => this.readTextById(app, 'note-state-value') === 'Playing', 'Expected first click to place the note in Playing state')
		await waitFor(
			() => Number(this.readTextById(app, 'trigger-count-value')) === initialTriggerCount + 1,
			'Expected first click to increase the visible trigger count by one'
		)
		await this.clickButtonById(app, 'play-tone-button')
		await waitFor(
			() => Number(this.readTextById(app, 'trigger-count-value')) === initialTriggerCount + 2,
			'Expected second click to increase the visible trigger count by two total'
		)
		const triggerCount = this.readTextById(app, 'trigger-count-value')
		assert(Number(triggerCount) === initialTriggerCount + 2, 'Expected visible trigger count to rise by two after retriggering')
		assert(this.readTextById(app, 'note-state-value') === 'Playing', 'Expected note state to remain Playing after retriggering')
		return { triggerCount }
	}

	@Spec('Finds the on-screen App instance and remounts it in place for each scenario.')
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

	@Spec('Installs a minimal AudioContext stub so behavioral UI tests never depend on real device audio.')
	private static installAudioContextStub() {
		const maybeGlobal = globalThis as Record<string, unknown>
		const audioContextConstructor = function AudioContextStub() {
			const destination = {}
			let contextState: 'running' | 'suspended' | 'closed' = 'suspended'
			return {
				currentTime: 0,
				state: contextState,
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

	@Spec('Clicks a button inside app-root by a stable id and waits for Lit to settle.')
	private static async clickButtonById(app: App, buttonId: string) {
		const button = app.shadowRoot?.querySelector<HTMLButtonElement>(`#${buttonId}`)
		if (!button) {
			throw new Error(`Button not found: ${buttonId}`)
		}
		button.click()
		await app.updateComplete
	}

	@Spec('Reads visible text content from a stable element id inside app-root.')
	private static readTextById(app: App, elementId: string): string {
		const element = app.shadowRoot?.querySelector<HTMLElement>(`#${elementId}`)
		if (!element) {
			throw new Error(`Element not found: ${elementId}`)
		}
		return element.textContent?.trim() ?? ''
	}

	@Spec('Returns whether a button is currently disabled in the rendered App UI.')
	private static isButtonDisabled(app: App, buttonId: string): boolean {
		const button = app.shadowRoot?.querySelector<HTMLButtonElement>(`#${buttonId}`)
		if (!button) {
			throw new Error(`Button not found: ${buttonId}`)
		}
		return button.disabled
	}
}
