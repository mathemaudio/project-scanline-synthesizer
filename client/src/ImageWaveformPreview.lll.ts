import { LitElement, css, html, type TemplateResult } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { Spec } from '@shared/lll.lll'

@Spec('Draws a visible canvas preview of the currently selected image-derived waveform row.')
@customElement('image-waveform-preview')
export class ImageWaveformPreview extends LitElement {
	static styles = css`
		:host {
			display: grid;
			gap: 10px;
		}

		.preview-frame {
			display: grid;
			gap: 10px;
			padding: 14px;
			border-radius: 16px;
			border: 1px solid rgba(255, 225, 173, 0.16);
			background: linear-gradient(180deg, rgba(0, 0, 0, 0.18), rgba(255, 255, 255, 0.02));
			box-shadow: inset 0 1px 0 rgba(255, 248, 230, 0.05);
		}

		.preview-meta {
			font-family: 'Orbitron', 'Inter', sans-serif;
			font-size: 0.82rem;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			color: rgba(245, 223, 176, 0.78);
		}

		canvas {
			display: block;
			width: 100%;
			height: 110px;
			border-radius: 12px;
			background: linear-gradient(180deg, rgba(0, 0, 0, 0.22), rgba(255, 255, 255, 0.01));
		}
	`

	@property({ attribute: false })
	samples: number[] = []

	@property({ type: String })
	previewLabel: string = 'Waveform preview unavailable'

	@property({ type: Number })
	rowIndex: number = -1

	@property({ type: Number })
	rowCount: number = 0

	@query('#waveform-preview-canvas')
	private canvasElement!: HTMLCanvasElement

	@Spec('Redraws the preview canvas whenever the selected waveform samples or row metadata change.')
	protected updated(): void {
		this.drawWaveform()
	}

	@Spec('Draws the selected waveform row as a centered oscilloscope-like line with a subtle baseline.')
	private drawWaveform() {
		const canvas = this.canvasElement
		if (canvas === undefined) {
			return
		}
		const context = canvas.getContext('2d')
		if (context === null) {
			return
		}

		const width = 640
		const height = 110
		canvas.width = width
		canvas.height = height
		context.clearRect(0, 0, width, height)

		const gradient = context.createLinearGradient(0, 0, width, height)
		gradient.addColorStop(0, 'rgba(255,255,255,0.08)')
		gradient.addColorStop(1, 'rgba(255,255,255,0.01)')
		context.fillStyle = gradient
		context.fillRect(0, 0, width, height)

		context.strokeStyle = 'rgba(255, 235, 205, 0.2)'
		context.lineWidth = 1
		context.beginPath()
		context.moveTo(0, height / 2)
		context.lineTo(width, height / 2)
		context.stroke()

		if (this.samples.length === 0) {
			context.fillStyle = 'rgba(245, 223, 176, 0.62)'
			context.font = '16px Inter, sans-serif'
			context.textAlign = 'center'
			context.textBaseline = 'middle'
			context.fillText('Upload an image to preview a waveform row.', width / 2, height / 2)
			return
		}

		context.strokeStyle = '#ffffff'
		context.lineWidth = 2.2
		context.lineJoin = 'round'
		context.lineCap = 'round'
		context.beginPath()
		for (let sampleIndex = 0; sampleIndex < this.samples.length; sampleIndex += 1) {
			const sample = this.samples[sampleIndex] ?? 0
			const x = this.samples.length === 1 ? width / 2 : (sampleIndex / (this.samples.length - 1)) * width
			const y = height / 2 - sample * (height * 0.34)
			if (sampleIndex === 0) {
				context.moveTo(x, y)
				continue
			}
			context.lineTo(x, y)
		}
		context.shadowColor = 'rgba(255, 255, 255, 0.28)'
		context.shadowBlur = 8
		context.stroke()
		context.shadowBlur = 0
	}

	@Spec('Renders the waveform canvas and accessible metadata for the currently selected image row.')
	render(): TemplateResult {
		const visibleLabel = this.rowCount <= 0 || this.rowIndex < 0
			? this.previewLabel
			: `${this.previewLabel} · Row ${this.rowIndex + 1} of ${this.rowCount}`
		return html`
			<div class="preview-frame">
				<div id="waveform-preview-meta" class="preview-meta">${visibleLabel}</div>
				<canvas
					id="waveform-preview-canvas"
					role="img"
					aria-label=${visibleLabel}
				></canvas>
			</div>
		`
	}
}
