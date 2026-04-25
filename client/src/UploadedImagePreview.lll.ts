import { LitElement, css, html, type TemplateResult } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { Spec } from './system/lll.lll'

@Spec('Shows the uploaded reference image with a visible horizontal marker for the currently selected waveform row.')
@customElement('uploaded-image-preview')
export class UploadedImagePreview extends LitElement {
	static styles = css`
		:host {
			display: grid;
			place-items: center;
			min-height: 300px;
			padding: 16px;
			border-radius: 16px;
			border: 1px dashed rgba(255, 225, 173, 0.2);
			background: linear-gradient(180deg, rgba(0, 0, 0, 0.12), rgba(255, 255, 255, 0.02));
			overflow: hidden;
		}

		.preview-figure {
			position: relative;
			display: inline-grid;
			max-width: 100%;
			max-height: 340px;
		}

		img {
			display: block;
			max-width: 100%;
			max-height: 340px;
			object-fit: contain;
			border-radius: 12px;
			box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
		}

		.selected-row-line {
			position: absolute;
			left: 0;
			right: 0;
			height: 4px;
			border-radius: 999px;
			background: linear-gradient(90deg, rgba(255, 64, 32, 0.92), rgba(255, 106, 48, 0.98));
			box-shadow:
				0 0 0 1px rgba(255, 214, 188, 0.28),
				0 0 16px rgba(255, 76, 32, 0.45);
			transform: translateY(-50%);
			pointer-events: none;
		}

		.placeholder {
			text-align: center;
			color: rgba(244, 235, 212, 0.7);
			line-height: 1.6;
		}
	`

	@property({ type: String })
	imageUrl: string | null = null

	@property({ type: String })
	imageName: string = 'No image selected'

	@property({ type: Number })
	selectedRowIndex: number = 0

	@property({ type: Number })
	rowCount: number = 0

	@query('#uploaded-image-element')
	private imageElement?: HTMLImageElement

	@Spec('Dispatches the current rendered image width so sibling previews can match the visible uploaded image size.')
	private notifyRenderedImageWidth() {
		const renderedWidth = this.imageElement?.clientWidth ?? 0
		this.dispatchEvent(new CustomEvent<number>('rendered-image-width-change', {
			detail: renderedWidth,
			bubbles: true,
			composed: true
		}))
	}

	@Spec('Calculates the selected row marker offset so the visible line sits at the center of the active image row.')
	private getSelectedRowLineOffsetPercent(): string {
		if (this.rowCount <= 0) {
			return '50%'
		}
		return `${((this.selectedRowIndex + 0.5) / this.rowCount) * 100}%`
	}

	@Spec('Refreshes the reported rendered image width after updates so sibling previews can stay aligned with the visible image size.')
	protected updated(): void {
		this.notifyRenderedImageWidth()
	}

	@Spec('Renders either the uploaded image with its selected-row line or an empty-state message when nothing is loaded.')
	render(): TemplateResult {
		if (this.imageUrl === null) {
			return html`<div class="placeholder">Choose an image to show it here on the right side of the panel.</div>`
		}
		return html`
			<div class="preview-figure">
				<img id="uploaded-image-element" src=${this.imageUrl} alt=${`Uploaded preview for ${this.imageName}`} @load=${this.notifyRenderedImageWidth} />
				<div
					id="selected-row-line"
					class="selected-row-line"
					style=${`top: ${this.getSelectedRowLineOffsetPercent()};`}
					aria-hidden="true"
				></div>
			</div>
		`
	}
}
