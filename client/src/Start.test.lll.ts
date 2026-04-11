import './Start.lll'
import { LitElement, css, html, type TemplateResult } from 'lit'
import { customElement } from 'lit/decorators.js'
import { AssertFn, Scenario, Spec, WaitForFn } from '@shared/lll.lll'
import { Start } from './Start.lll'

@Spec('Covers client bootstrapping behavior for Start.')
@customElement('start-test-panel')
export class StartTest extends LitElement {
	testType = "behavioral"
	private static activeInstance: StartTest | null = null

	static styles = css`
		:host {
			display: block;
			padding: 8px;
		}
	`

	@Spec('Tracks the currently rendered Start test panel for scenario lookup.')
	connectedCallback() {
		super.connectedCallback()
		StartTest.activeInstance = this
	}

	@Spec('Clears the tracked Start test panel when it disconnects.')
	disconnectedCallback() {
		if (StartTest.activeInstance === this) {
			StartTest.activeInstance = null
		}
		super.disconnectedCallback()
	}

	@Spec('Renders the visible #app container used by Start.')
	render(): TemplateResult {
		return html`<div>Start bootstrap behavioral test</div>`
	}

	@Scenario('renders app-root into #app when container exists')
	static async rendersAppIntoContainer(input = {}, assert: AssertFn, waitFor: WaitForFn): Promise<{ renderedTagName: string }> {
		const panel = await this.getRenderedPanel(waitFor)
		const root = this.ensureAppContainer(panel)
		assert(root.id === 'app', 'Expected behavioral test host to use the #app id')

		new Start()
		await waitFor(() => root.querySelector('app-root') !== null, 'Expected Start bootstrap to render app-root into #app')
		const renderedElement = root.querySelector('app-root')
		assert(renderedElement !== null, 'Expected Start to render app-root into #app')
		return { renderedTagName: renderedElement.tagName.toLowerCase() }
	}

	@Spec('Finds the visible Start test panel used by behavioral scenarios.')
	private static async getRenderedPanel(waitFor: WaitForFn): Promise<StartTest> {
		await waitFor(() => this.findBestRenderedPanel() !== null, 'Expected start-test-panel to be rendered before scenario actions')
		const panel = this.findBestRenderedPanel()
		if (panel === null) {
			throw new Error('Expected an already-rendered start-test-panel element')
		}
		await panel.updateComplete
		return panel
	}

	@Spec('Creates or resets an #app container outside Lit-managed DOM for Start scenarios.')
	private static ensureAppContainer(panel: StartTest): HTMLElement {
		const staleRoots = Array.from(document.querySelectorAll<HTMLElement>('#app'))
		for (const root of staleRoots) {
			if (panel.contains(root) === false) {
				root.remove()
			}
		}

		const existingExternalRoot = Array.from(document.querySelectorAll<HTMLElement>('#app')).find((root) => panel.contains(root) === false)
		if (existingExternalRoot !== undefined) {
			existingExternalRoot.replaceChildren()
			return existingExternalRoot
		}

		const root = document.createElement('div')
		root.id = 'app'
		document.body.append(root)
		return root
	}

	@Spec('Selects the best currently rendered Start test panel.')
	private static findBestRenderedPanel(): StartTest | null {
		if (this.activeInstance !== null && this.activeInstance.isConnected) {
			return this.activeInstance
		}

		const panels = Array.from(document.querySelectorAll<StartTest>('start-test-panel'))
		const visiblePanel = panels.find((element) => element.isConnected && element.getClientRects().length > 0)
		if (visiblePanel !== undefined) {
			return visiblePanel
		}
		return panels.find((element) => element.isConnected) ?? null
	}

}
