import { LitElement, css, html, type TemplateResult } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { Spec } from '@shared/lll.lll'

@Spec('Draws a visible three-cycle preview of the currently selected image-derived waveform row.')
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
			height: 146px;
			border-radius: 12px;
			background: linear-gradient(180deg, rgba(0, 0, 0, 0.22), rgba(255, 255, 255, 0.01));
		}

		:host(.image-cycle-preview-plain) {
			gap: 0;
		}

		:host(.image-cycle-preview-plain) .preview-frame {
			padding: 0;
			gap: 0;
			border: 1px solid rgba(255, 255, 255, 0.24);
			border-radius: 0;
			background: #000000;
			box-shadow: none;
		}

		:host(.image-cycle-preview-plain) canvas {
			height: 54px;
			border-radius: 0;
			background: #000000;
		}
	`

	@property({ attribute: false })
	samples: number[] = []

	@property({ attribute: false })
	seamRatios: number[] = []

	@property({ type: String })
	previewLabel: string = 'Waveform preview unavailable'

	@property({ type: Number })
	cycleCount: number = 3

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

	@Spec('Draws the visible waveform preview so the two loop seams can be inspected at their true overlap-shortened positions.')
	private drawWaveform() {
		const canvas = this.canvasElement
		if (canvas === undefined) {
			return
		}
		const context = canvas.getContext('2d')
		if (context === null) {
			return
		}

		const width = 960
		const height = this.cycleCount === 1 ? 56 : 146
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
		context.strokeStyle = 'rgba(255, 235, 205, 0.12)'
		context.setLineDash([8, 10])
		context.beginPath()
		for (const seamRatio of this.getVisibleSeamRatios()) {
			const seamX = width * seamRatio
			context.moveTo(seamX, 10)
			context.lineTo(seamX, height - 10)
		}
		context.stroke()
		context.setLineDash([])

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
		const visibleSamples = this.getVisibleSamples()
		for (let sampleIndex = 0; sampleIndex < visibleSamples.length; sampleIndex += 1) {
			const sample = visibleSamples[sampleIndex] ?? 0
			const x = visibleSamples.length === 1 ? width / 2 : (sampleIndex / (visibleSamples.length - 1)) * width
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

	@Spec('Returns the waveform samples that should be drawn, either as a supplied overlap-shortened preview or as repeated cycles sized for the requested display.')
	private getVisibleSamples(): number[] {
		if (this.samples.length === 0) {
			return []
		}
		if (this.cycleCount === 1) {
			return [...this.samples]
		}
		if (this.seamRatios.length === 2) {
			return [...this.samples]
		}
		return Array.from({ length: this.cycleCount }, () => this.samples).flat()
	}

	@Spec('Returns the visible seam positions, using supplied overlap-shortened joins when available and hiding them for a single-cycle display.')
	private getVisibleSeamRatios(): number[] {
		if (this.cycleCount === 1) {
			return []
		}
		if (this.seamRatios.length === 2) {
			return this.seamRatios
		}
		return [1 / this.cycleCount, (this.cycleCount - 1) / this.cycleCount]
	}

	@Spec('Renders the waveform canvas and accessible metadata for the currently selected image row.')
	render(): TemplateResult {
		const visibleLabel = this.rowCount <= 0 || this.rowIndex < 0
			? this.previewLabel
			: `${this.previewLabel} · Row ${this.rowIndex + 1} of ${this.rowCount}`
		return html`
			<div class="preview-frame">
				${visibleLabel === '' ? null : html`<div id="waveform-preview-meta" class="preview-meta">${visibleLabel}</div>`}
				<canvas
					id="waveform-preview-canvas"
					role="img"
					aria-label=${visibleLabel}
				></canvas>
			</div>
		`
	}
}
