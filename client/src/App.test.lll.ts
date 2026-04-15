import './App.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory, WaitForFn } from '@shared/lll.lll'
import { App } from './App.lll'

@Spec('Exercises the Scanline Synth app only through visible UI and keyboard interactions.')
export class AppTest {
	testType = 'behavioral'

	@Scenario('polyphonic mode shows two sounding voices for Q then W!')
	static async showsPolyphonicVoiceCountForTwoHeldKeys(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ voiceMode: string, soundingVoices: string, activeKey: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true, cancelable: true }))
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', bubbles: true, cancelable: true }))
			await app.updateComplete

			await waitFor(() => this.readText(app, '#sounding-voices-value') === '2', 'Expected two sounding voices after holding Q and W in polyphonic mode')
			const voiceMode = this.readText(app, '#voice-mode-value')
			const soundingVoices = this.readText(app, '#sounding-voices-value')
			const activeKey = this.readText(app, '#active-key-value')

			assert(voiceMode === 'Polyphonic', 'Expected the app to remain in polyphonic mode by default')
			assert(soundingVoices === '2', 'Expected two sounding voices to be visible')
			assert(activeKey === 'W', 'Expected the newest held key to become active')
			return { voiceMode, soundingVoices, activeKey }
		} finally {
			window.dispatchEvent(new KeyboardEvent('keyup', { key: 'q', bubbles: true, cancelable: true }))
			window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w', bubbles: true, cancelable: true }))
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
		}
	}

	@Scenario('switching monophonic mode collapses held keys to one sounding voice')
	static async collapsesHeldKeysWhenMonophonicModeIsEnabled(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ toggleValue: string, voiceMode: string, soundingVoices: string, noteState: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true, cancelable: true }))
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', bubbles: true, cancelable: true }))
			const toggle = app.shadowRoot?.querySelector<HTMLInputElement>('#monophonic-toggle')
			assert(toggle !== null && toggle !== undefined, 'Expected monophonic toggle to exist')
			toggle.checked = true
			toggle.dispatchEvent(new Event('change', { bubbles: true }))
			await app.updateComplete

			await waitFor(() => this.readText(app, '#sounding-voices-value') === '1', 'Expected monophonic mode to collapse visible sounding voices to one')
			const toggleValue = this.readText(app, '#monophonic-toggle-value')
			const voiceMode = this.readText(app, '#voice-mode-value')
			const soundingVoices = this.readText(app, '#sounding-voices-value')
			const noteState = this.readText(app, '#note-state-value')

			assert(toggleValue === 'On', 'Expected the visible monophonic toggle label to turn On')
			assert(voiceMode === 'Monophonic', 'Expected voice mode card to show Monophonic')
			assert(soundingVoices === '1', 'Expected only one sounding voice in monophonic mode with overlapping keys held')
			assert(noteState === 'Playing', 'Expected note state to remain visibly Playing while a note is sounding')
			return { toggleValue, voiceMode, soundingVoices, noteState }
		} finally {
			window.dispatchEvent(new KeyboardEvent('keyup', { key: 'q', bubbles: true, cancelable: true }))
			window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w', bubbles: true, cancelable: true }))
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
		}
	}

	@Scenario('uploading an image activates an image row waveform and exposes the row selector')
	static async showsImageRowWaveformControlsAfterUpload(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ uploadedImageName: string, waveform: string, rowValue: string, waveformDetail: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
		const originalCreateObjectUrl = URL.createObjectURL
		const originalRevokeObjectUrl = URL.revokeObjectURL
		const originalImage = (globalThis as Record<string, unknown>)['Image']
		const originalHTMLElement = (globalThis as Record<string, unknown>)['HTMLElement']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		URL.createObjectURL = ((_file: Blob | MediaSource) => this.behavioralPreviewImageUrl) as typeof URL.createObjectURL
		URL.revokeObjectURL = (() => undefined) as typeof URL.revokeObjectURL
			; (globalThis as Record<string, unknown>)['Image'] = this.createBehavioralImageConstructor()
			; (globalThis as Record<string, unknown>)['HTMLElement'] = this.createBehavioralHTMLElementConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			const uploadInput = app.shadowRoot?.querySelector<HTMLInputElement>('#image-upload-input')
			assert(uploadInput !== null && uploadInput !== undefined, 'Expected image upload input to exist')
			this.installCanvasTestDouble()
			const uploadedFile = this.createBehavioralImageFile('panel-reference.svg')
			Object.defineProperty(uploadInput, 'files', {
				configurable: true,
				value: [uploadedFile]
			})
			uploadInput.dispatchEvent(new Event('change', { bubbles: true }))
			await app.updateComplete

			await waitFor(() => this.readText(app, '#waveform-value').startsWith('Image row'), 'Expected an uploaded image row waveform to become active')
			const uploadedImageName = this.readText(app, '#uploaded-image-name')
			const waveform = this.readText(app, '#waveform-value')
			const rowValue = this.readText(app, '#waveform-row-value')
			const waveformDetail = this.readText(app, '#waveform-detail-text')

			assert(uploadedImageName === 'panel-reference.svg', 'Expected uploaded image file name to be shown')
			assert(waveform.startsWith('Image row'), 'Expected waveform card to switch from Sine to an uploaded image row')
			assert(rowValue.includes('of 2'), 'Expected row selector to reveal two loaded rows from the canvas image')
			assert(waveformDetail.includes('image loaded'), 'Expected waveform detail text to describe the loaded image dimensions')
			return { uploadedImageName, waveform, rowValue, waveformDetail }
		} finally {
			this.restoreCanvasTestDouble()
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
			URL.createObjectURL = originalCreateObjectUrl
			URL.revokeObjectURL = originalRevokeObjectUrl
			if (originalImage === undefined) {
				delete (globalThis as Record<string, unknown>)['Image']
			} else {
				(globalThis as Record<string, unknown>)['Image'] = originalImage
			}
			if (originalHTMLElement === undefined) {
				delete (globalThis as Record<string, unknown>)['HTMLElement']
			} else {
				(globalThis as Record<string, unknown>)['HTMLElement'] = originalHTMLElement
			}
		}
	}

	@Scenario('moving the row selector changes the visible active image row while keyboard play still works')
	static async changesSelectedImageRowAndKeepsKeyboardPlayable(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ waveform: string, rowValue: string, previewMeta: string, selectedRowLineTop: string, activeKey: string, noteState: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
		const originalCreateObjectUrl = URL.createObjectURL
		const originalRevokeObjectUrl = URL.revokeObjectURL
		const originalImage = (globalThis as Record<string, unknown>)['Image']
		const originalHTMLElement = (globalThis as Record<string, unknown>)['HTMLElement']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		URL.createObjectURL = ((_file: Blob | MediaSource) => this.behavioralPreviewImageUrl) as typeof URL.createObjectURL
		URL.revokeObjectURL = (() => undefined) as typeof URL.revokeObjectURL
			; (globalThis as Record<string, unknown>)['Image'] = this.createBehavioralImageConstructor()
			; (globalThis as Record<string, unknown>)['HTMLElement'] = this.createBehavioralHTMLElementConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			this.installCanvasTestDouble()
			const uploadInput = app.shadowRoot?.querySelector<HTMLInputElement>('#image-upload-input')
			assert(uploadInput !== null && uploadInput !== undefined, 'Expected image upload input to exist')
			Object.defineProperty(uploadInput, 'files', {
				configurable: true,
				value: [this.createBehavioralImageFile('rows.svg')]
			})
			uploadInput.dispatchEvent(new Event('change', { bubbles: true }))
			await app.updateComplete
			await waitFor(() => this.readText(app, '#waveform-row-value').includes('of 2'), 'Expected row slider to become active after upload')

			const slider = app.shadowRoot?.querySelector<HTMLInputElement>('#waveform-row-slider')
			assert(slider !== null && slider !== undefined, 'Expected waveform row slider to exist')
			slider.value = '1'
			slider.dispatchEvent(new Event('input', { bubbles: true }))
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true, cancelable: true }))
			await app.updateComplete

			await waitFor(() => this.readText(app, '#active-key-value') === 'Q', 'Expected QWERTY keyboard playback to remain active after selecting an image row')
			const waveform = this.readText(app, '#waveform-value')
			const rowValue = this.readText(app, '#waveform-row-value')
			const previewMeta = this.readTextFromShadowHost(app, 'image-waveform-preview', '#waveform-preview-meta')
			const previewCanvas = app.shadowRoot?.querySelector('image-waveform-preview')?.shadowRoot?.querySelector<HTMLCanvasElement>('#waveform-preview-canvas')
			const selectedRowLineTop = this.readStyleFromShadowHost(app, 'uploaded-image-preview', '#selected-row-line', 'top')
			const activeKey = this.readText(app, '#active-key-value')
			const noteState = this.readText(app, '#note-state-value')

			assert(waveform === 'Image row 2', 'Expected moving the slider to activate the second image row')
			assert(rowValue === 'Row 2 of 2', 'Expected row status text to follow the slider')
			assert(previewMeta.includes('Row 2 of 2'), 'Expected the visible waveform preview metadata to follow the selected row')
			assert(previewCanvas !== null && previewCanvas !== undefined, 'Expected the waveform preview canvas to render below the uploaded image')
			assert(previewCanvas.width > 0 && previewCanvas.height > 0, 'Expected the waveform preview canvas to be sized for drawing')
			assert(selectedRowLineTop === '75%', 'Expected the selected-row line to move to the center of the second row out of two')
			assert(activeKey === 'Q', 'Expected keyboard control to remain playable after selecting a new image row')
			assert(noteState === 'Playing', 'Expected a played key to keep the synth visibly playing after image upload')
			return { waveform, rowValue, previewMeta, selectedRowLineTop, activeKey, noteState }
		} finally {
			window.dispatchEvent(new KeyboardEvent('keyup', { key: 'q', bubbles: true, cancelable: true }))
			this.restoreCanvasTestDouble()
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
			URL.createObjectURL = originalCreateObjectUrl
			URL.revokeObjectURL = originalRevokeObjectUrl
			if (originalImage === undefined) {
				delete (globalThis as Record<string, unknown>)['Image']
			} else {
				(globalThis as Record<string, unknown>)['Image'] = originalImage
			}
			if (originalHTMLElement === undefined) {
				delete (globalThis as Record<string, unknown>)['HTMLElement']
			} else {
				(globalThis as Record<string, unknown>)['HTMLElement'] = originalHTMLElement
			}
		}
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}

	@Spec('Provides a local waitFor fallback when the scenario runner omits helper functions.')
	private static async failFastWaitFor(predicate: () => boolean | Promise<boolean>, message: string): Promise<void> {
		const passed = await predicate()
		if (passed === false) {
			throw new Error(message)
		}
	}

	@Spec('Waits for app shadow DOM and the visible status cards needed by the scenarios.')
	private static async prepareMountedApp(app: App, waitFor: WaitForFn): Promise<void> {
		await waitFor(() => app.shadowRoot !== null, 'Expected app shadow DOM to render')
		await app.updateComplete
		await waitFor(() => this.readText(app, '#voice-mode-value').length > 0, 'Expected voice mode card to render visible text')
	}

	@Spec('Reads visible text from one element inside the app shadow DOM.')
	private static readText(app: App, selector: string): string {
		const element = app.shadowRoot?.querySelector<HTMLElement>(selector)
		if (element === null || element === undefined) {
			throw new Error(`App element not found: ${selector}`)
		}
		return element.textContent?.trim() ?? ''
	}

	@Spec('Reads visible text from one nested shadow host inside the app so behavioral scenarios can inspect custom element output.')
	private static readTextFromShadowHost(app: App, hostSelector: string, innerSelector: string): string {
		const host = app.shadowRoot?.querySelector<HTMLElement>(hostSelector)
		if (host === null || host === undefined) {
			throw new Error(`App shadow host not found: ${hostSelector}`)
		}
		const element = host.shadowRoot?.querySelector<HTMLElement>(innerSelector)
		if (element === null || element === undefined) {
			throw new Error(`Nested shadow element not found: ${hostSelector} -> ${innerSelector}`)
		}
		return element.textContent?.trim() ?? ''
	}

	@Spec('Reads one inline style property from a nested shadow host element inside the app for visible behavioral UI checks.')
	private static readStyleFromShadowHost(app: App, hostSelector: string, innerSelector: string, propertyName: 'top'): string {
		const host = app.shadowRoot?.querySelector<HTMLElement>(hostSelector)
		if (host === null || host === undefined) {
			throw new Error(`App shadow host not found: ${hostSelector}`)
		}
		const element = host.shadowRoot?.querySelector<HTMLElement>(innerSelector)
		if (element === null || element === undefined) {
			throw new Error(`Nested shadow element not found: ${hostSelector} -> ${innerSelector}`)
		}
		return element.style[propertyName]
	}

	@Spec('Installs a tiny canvas test double that exposes deterministic image rows for behavioral upload scenarios.')
	private static installCanvasTestDouble() {
		const originalCreateElement = document.createElement.bind(document)
			; (document as unknown as { __scanlineOriginalCreateElement?: typeof document.createElement }).__scanlineOriginalCreateElement = originalCreateElement
		document.createElement = ((tagName: string, options?: ElementCreationOptions) => {
			if (tagName.toLowerCase() !== 'canvas') {
				return originalCreateElement(tagName, options)
			}
			const canvas = originalCreateElement('canvas', options)
			const context = {
				drawImage: () => undefined,
				getImageData: () => new ImageData(
					new Uint8ClampedArray([
						255, 255, 255, 255, 0, 0, 0, 255,
						0, 0, 0, 255, 255, 255, 255, 255
					]),
					2,
					2
				)
			}
			Object.defineProperty(canvas, 'getContext', {
				configurable: true,
				value: () => context
			})
			return canvas
		}) as typeof document.createElement
	}

	@Spec('Restores the browser createElement implementation after one behavioral upload scenario completes.')
	private static restoreCanvasTestDouble() {
		const originalCreateElement = (document as unknown as { __scanlineOriginalCreateElement?: typeof document.createElement }).__scanlineOriginalCreateElement
		if (originalCreateElement === undefined) {
			return
		}
		document.createElement = originalCreateElement
		delete (document as unknown as { __scanlineOriginalCreateElement?: typeof document.createElement }).__scanlineOriginalCreateElement
	}

	@Spec('Creates a tiny AudioContext constructor usable by behavioral app scenarios.')
	private static createBehavioralAudioContextConstructor(): new () => AudioContext {
		return class implements Partial<AudioContext> {
			state: AudioContextState = 'running'
			currentTime = 0
			destination = {} as AudioDestinationNode
			async resume(): Promise<void> {
				return undefined
			}
			createPeriodicWave(): PeriodicWave {
				return {} as PeriodicWave
			}
			createOscillator(): OscillatorNode {
				const oscillator = {
					type: 'sine',
					frequency: { value: 0 },
					onended: null as (() => void) | null,
					connect: () => { },
					disconnect: () => { },
					start: () => { },
					setPeriodicWave: () => { },
					stop() {
						oscillator.onended?.()
					}
				}
				return oscillator as unknown as OscillatorNode
			}
			createGain(): GainNode {
				const gain = {
					value: 0,
					cancelScheduledValues: () => { },
					setValueAtTime(value: number) {
						this.value = value
					},
					linearRampToValueAtTime(value: number) {
						this.value = value
					},
					exponentialRampToValueAtTime(value: number) {
						this.value = value
					}
				}
				return {
					gain,
					connect: () => { },
					disconnect: () => { }
				} as unknown as GainNode
			}
		} as unknown as new () => AudioContext
	}

	@Spec('Creates one small synthetic image file so upload scenarios show a visible preview instead of an empty placeholder blob.')
	private static createBehavioralImageFile(fileName: string): File {
		return new File([this.behavioralPreviewImageSvg], fileName, { type: 'image/svg+xml' })
	}

	@Spec('Creates a tiny image constructor that reports a decoded 2x2 image immediately for behavioral upload scenarios.')
	private static createBehavioralImageConstructor(): new () => HTMLImageElement {
		return class {
			naturalWidth = 2
			naturalHeight = 2
			onload: (() => void) | null = null
			onerror: (() => void) | null = null
			set src(_value: string) {
				this.onload?.()
			}
		} as unknown as new () => HTMLImageElement
	}

	private static readonly behavioralPreviewImageSvg: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">
		<defs>
			<linearGradient id="scanlineGradient" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stop-color="#2a1b12"/>
				<stop offset="45%" stop-color="#d86d33"/>
				<stop offset="100%" stop-color="#8bf0a4"/>
			</linearGradient>
		</defs>
		<rect width="320" height="180" rx="20" fill="#1a120d"/>
		<rect x="10" y="10" width="300" height="160" rx="16" fill="url(#scanlineGradient)" opacity="0.85"/>
		<path d="M20 118 C60 82, 98 140, 138 100 S214 66, 300 116" fill="none" stroke="#f7e1b2" stroke-width="8" stroke-linecap="round"/>
		<path d="M20 138 C74 160, 128 84, 184 116 S246 152, 300 86" fill="none" stroke="#101514" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
		<text x="24" y="42" fill="#f7e1b2" font-size="18" font-family="monospace">SCANLINE TEST PREVIEW</text>
		<text x="24" y="66" fill="#d6ffd9" font-size="12" font-family="monospace">synthetic upload image</text>
	</svg>`
	private static readonly behavioralPreviewImageUrl: string = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20320%20180%22%3E%0A%09%09%3Cdefs%3E%0A%09%09%09%3ClinearGradient%20id%3D%22scanlineGradient%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%0A%09%09%09%09%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%232a1b12%22%2F%3E%0A%09%09%09%09%3Cstop%20offset%3D%2245%25%22%20stop-color%3D%22%23d86d33%22%2F%3E%0A%09%09%09%09%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%238bf0a4%22%2F%3E%0A%09%09%09%3C%2FlinearGradient%3E%0A%09%09%3C%2Fdefs%3E%0A%09%09%3Crect%20width%3D%22320%22%20height%3D%22180%22%20rx%3D%2220%22%20fill%3D%22%231a120d%22%2F%3E%0A%09%09%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%22300%22%20height%3D%22160%22%20rx%3D%2216%22%20fill%3D%22url(%23scanlineGradient)%22%20opacity%3D%220.85%22%2F%3E%0A%09%09%3Cpath%20d%3D%22M20%20118%20C60%2082%2C%2098%20140%2C%20138%20100%20S214%2066%2C%20300%20116%22%20fill%3D%22none%22%20stroke%3D%22%23f7e1b2%22%20stroke-width%3D%228%22%20stroke-linecap%3D%22round%22%2F%3E%0A%09%09%3Cpath%20d%3D%22M20%20138%20C74%20160%2C%20128%2084%2C%20184%20116%20S246%20152%2C%20300%2086%22%20fill%3D%22none%22%20stroke%3D%22%23101514%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%20opacity%3D%220.8%22%2F%3E%0A%09%09%3Ctext%20x%3D%2224%22%20y%3D%2242%22%20fill%3D%22%23f7e1b2%22%20font-size%3D%2218%22%20font-family%3D%22monospace%22%3ESCANLINE%20TEST%20PREVIEW%3C%2Ftext%3E%0A%09%09%3Ctext%20x%3D%2224%22%20y%3D%2266%22%20fill%3D%22%23d6ffd9%22%20font-size%3D%2212%22%20font-family%3D%22monospace%22%3Esynthetic%20upload%20image%3C%2Ftext%3E%0A%09%3C%2Fsvg%3E'

	@Spec('Creates a tiny HTMLElement constructor so behavioral subject creation can succeed in headless client-tunnel runs.')
	private static createBehavioralHTMLElementConstructor(): new () => HTMLElement {
		return class {
		} as unknown as new () => HTMLElement
	}

}
