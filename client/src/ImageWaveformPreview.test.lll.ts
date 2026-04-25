import './ImageWaveformPreview.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory, WaitForFn } from './system/lll.lll'
import { ImageWaveformPreview } from './ImageWaveformPreview.lll'

@Spec('Exercises the waveform preview only through its visible rendered metadata and canvas output.')
export class ImageWaveformPreviewTest {
	testType = 'behavioral'

	@Scenario('rendering a selected waveform row shows three-cycle metadata and a drawable canvas')
	static async showsSelectedWaveformMetadataAndCanvas(subjectFactory: SubjectFactory<ImageWaveformPreview>, scenario?: ScenarioParameter): Promise<{ previewMeta: string, canvasWidth: number, canvasHeight: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalGetContext = HTMLCanvasElement.prototype.getContext
		HTMLCanvasElement.prototype.getContext = this.createBehavioralCanvasGetContext()
		try {
			const preview = await subjectFactory()
			preview.samples = [-1, 0, 1, 0, -1]
			preview.previewLabel = 'Selected waveform preview'
			preview.rowIndex = 1
			preview.rowCount = 4
			await preview.updateComplete
			await waitFor(() => this.readText(preview, '#waveform-preview-meta').includes('Row 2 of 4'), 'Expected preview metadata to mention the selected row')
			const previewMeta = this.readText(preview, '#waveform-preview-meta')
			const canvas = preview.shadowRoot?.querySelector<HTMLCanvasElement>('#waveform-preview-canvas')
			assert(canvas !== null && canvas !== undefined, 'Expected waveform preview canvas to render')
			assert(previewMeta.includes('Selected waveform preview'), 'Expected preview metadata to include the provided preview label')
			assert(previewMeta.includes('Row 2 of 4'), 'Expected preview metadata to include selected row details')
			assert(canvas.width === 960, 'Expected waveform preview canvas width to be configured for three visible cycles')
			assert(canvas.height === 146, 'Expected waveform preview canvas height to be configured for the taller three-cycle display')
			return { previewMeta, canvasWidth: canvas.width, canvasHeight: canvas.height }
		} finally {
			HTMLCanvasElement.prototype.getContext = originalGetContext
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

	@Spec('Reads visible text from one element inside the preview shadow DOM.')
	private static readText(preview: ImageWaveformPreview, selector: string): string {
		const element = preview.shadowRoot?.querySelector<HTMLElement>(selector)
		if (element === null || element === undefined) {
			throw new Error(`Preview element not found: ${selector}`)
		}
		return element.textContent?.trim() ?? ''
	}

	@Spec('Creates a small canvas 2D context double that supports the drawing calls used by the waveform preview.')
	private static createBehavioralCanvasGetContext(): typeof HTMLCanvasElement.prototype.getContext {
		return ((contextId: '2d' | 'bitmaprenderer' | 'webgl' | 'webgl2' | 'webgpu', _options?: unknown) => {
			if (contextId !== '2d') {
				return null
			}
			const gradient = {
				addColorStop: () => undefined
			}
			const context = {
				clearRect: () => undefined,
				createLinearGradient: () => gradient,
				fillRect: () => undefined,
				beginPath: () => undefined,
				moveTo: () => undefined,
				lineTo: () => undefined,
				stroke: () => undefined,
				fillText: () => undefined,
				setLineDash: () => undefined,
				fillStyle: '',
				strokeStyle: '',
				lineWidth: 0,
				lineJoin: 'round',
				lineCap: 'round',
				shadowColor: '',
				shadowBlur: 0,
				font: '',
				textAlign: 'center',
				textBaseline: 'middle'
			}
			return context as unknown as CanvasRenderingContext2D
		}) as typeof HTMLCanvasElement.prototype.getContext
	}
}
