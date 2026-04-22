import { Spec } from '@shared/lll.lll'
import { LitElement, css, html, type TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

@Spec('Renders a compact vintage circular knob that behaves like a slider while showing its current value in the center.')
@customElement('vintage-knob')
export class VintageKnob extends LitElement {
	public static styles = css`
		:host {
			display: inline-grid;
			justify-items: center;
			align-items: center;
			user-select: none;
			-webkit-user-select: none;
			touch-action: none;
		}

		.knob {
			position: relative;
			width: 110px;
			height: 110px;
			display: grid;
			place-items: center;
			border: none;
			padding: 0;
			border-radius: 50%;
			cursor: grab;
			outline: none;
			background:
				radial-gradient(circle at 50% 50%, rgba(7, 6, 5, 0.92) 0 31%, transparent 31.5%),
				conic-gradient(from 225deg, rgba(255, 224, 178, 0.08) 0deg, rgba(255, 224, 178, 0.08) var(--knob-fill), rgba(72, 61, 52, 0.92) var(--knob-fill), rgba(35, 29, 24, 0.96) 270deg, rgba(255, 224, 178, 0.08) 270deg 360deg),
				radial-gradient(circle at 35% 30%, rgba(255, 246, 221, 0.28), rgba(0, 0, 0, 0) 40%),
				radial-gradient(circle at 50% 50%, #564335 0 45%, #342921 59%, #130f0c 74%, #050404 100%);
			box-shadow:
				inset 0 2px 2px rgba(255, 248, 232, 0.1),
				inset 0 -8px 14px rgba(0, 0, 0, 0.6),
				0 10px 20px rgba(0, 0, 0, 0.34),
				0 0 0 1px rgba(255, 226, 177, 0.12),
				0 0 0 8px rgba(11, 9, 7, 0.42);
			transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
		}

		.knob::before {
			content: '';
			position: absolute;
			inset: 11px;
			border-radius: 50%;
			background:
				repeating-conic-gradient(from -135deg, rgba(248, 229, 188, 0.8) 0deg 1.6deg, transparent 1.6deg 8deg),
				radial-gradient(circle at 50% 50%, transparent 0 71%, rgba(0, 0, 0, 0.85) 72% 100%);
			opacity: 0.9;
			mask: radial-gradient(circle at center, transparent 0 68%, black 69% 100%);
			-webkit-mask: radial-gradient(circle at center, transparent 0 68%, black 69% 100%);
		}

		.knob::after {
			content: '';
			position: absolute;
			width: 8px;
			height: 32px;
			border-radius: 999px;
			background: linear-gradient(180deg, #fff1d2, #cf6f36 60%, #4a2412);
			box-shadow: 0 0 10px rgba(255, 211, 152, 0.22);
			transform: rotate(var(--knob-rotation)) translateY(-28px);
			transform-origin: 50% 48px;
		}

		.knob:hover,
		.knob:focus-visible {
			transform: translateY(-1px);
			filter: brightness(1.06);
			box-shadow:
				inset 0 2px 2px rgba(255, 248, 232, 0.1),
				inset 0 -8px 14px rgba(0, 0, 0, 0.6),
				0 14px 24px rgba(0, 0, 0, 0.36),
				0 0 0 1px rgba(255, 226, 177, 0.2),
				0 0 18px rgba(207, 111, 54, 0.18),
				0 0 0 8px rgba(11, 9, 7, 0.42);
		}

		.knob[data-disabled='true'] {
			opacity: 0.56;
			cursor: not-allowed;
			filter: saturate(0.65);
		}

		.value {
			position: relative;
			z-index: 1;
			max-width: 60px;
			text-align: center;
			font-family: 'Orbitron', 'Inter', sans-serif;
			font-size: 0.84rem;
			font-weight: 700;
			line-height: 1.15;
			letter-spacing: 0.05em;
			color: #d8f9bf;
			text-shadow: 0 0 10px rgba(184, 246, 169, 0.28);
		}
	`

	@property({ type: String })
	public name: string = ''

	@property({ type: Number })
	public min: number = 0

	@property({ type: Number })
	public max: number = 100

	@property({ type: Number })
	public step: number = 1

	@property({ type: String })
	public value: string = '0'

	@property({ type: String, attribute: 'value-text' })
	public valueText: string = '0'

	@property({ type: Boolean, reflect: true })
	public disabled: boolean = false

	@state()
	private dragValueStart: number | null = null

	@state()
	private dragPointerStartY: number | null = null

	@Spec('Renders the circular knob shell, center display, and ARIA slider metadata for one compact control.')
	public render(): TemplateResult {
		return html`
			<div
				class="knob"
				role="slider"
				tabindex=${this.disabled ? '-1' : '0'}
				data-disabled=${String(this.disabled)}
				aria-label=${this.name}
				aria-valuemin=${String(this.min)}
				aria-valuemax=${String(this.max)}
				aria-valuenow=${String(this.getNumericValue())}
				aria-valuetext=${this.valueText}
				style=${this.createKnobStyle()}
				@pointerdown=${this.onPointerDown}
				@keydown=${this.onKeyDown}
				@wheel=${this.onWheel}
			>
				<div class="value">${this.valueText}</div>
			</div>
		`
	}

	@Spec('Builds the inline CSS custom properties that rotate the indicator and fill the vintage sweep arc.')
	private createKnobStyle(): string {
		const fillDegrees = Math.max(0, Math.min(270, this.getProgressRatio() * 270))
		const rotationDegrees = -135 + fillDegrees
		return `--knob-fill: ${fillDegrees}deg; --knob-rotation: ${rotationDegrees}deg;`
	}

	@Spec('Returns the current numeric knob value while falling back safely when the bound value string is invalid.')
	private getNumericValue(): number {
		const numericValue = Number(this.value)
		if (Number.isFinite(numericValue) === false) {
			return this.min
		}
		return Math.max(this.min, Math.min(this.max, numericValue))
	}

	@Spec('Normalizes the current numeric value into a 0-to-1 ratio used by the arc and indicator visuals.')
	private getProgressRatio(): number {
		const range = this.max - this.min
		if (range <= 0) {
			return 0
		}
		return (this.getNumericValue() - this.min) / range
	}

	@Spec('Starts pointer dragging so vertical motion can sweep the knob through its configured range.')
	private onPointerDown(event: PointerEvent) {
		if (this.disabled) {
			return
		}
		this.dragValueStart = this.getNumericValue()
		this.dragPointerStartY = event.clientY
		this.setPointerCapture(event.pointerId)
		this.addEventListener('pointermove', this.onPointerMove)
		this.addEventListener('pointerup', this.onPointerUp)
		this.addEventListener('pointercancel', this.onPointerUp)
		const knob = this.renderRoot.querySelector<HTMLElement>('.knob')
		knob?.focus()
		this.style.cursor = 'grabbing'
		event.preventDefault()
	}

	@Spec('Applies one pointer drag delta to the knob value using the configured step and overall range size.')
	private onPointerMove(event: PointerEvent) {
		if (this.dragValueStart === null || this.dragPointerStartY === null) {
			return
		}
		const range = Math.max(this.max - this.min, this.step)
		const dragOffset = (this.dragPointerStartY - event.clientY) / 120
		const nextValue = this.dragValueStart + dragOffset * range
		this.applyValueChange(nextValue)
	}

	@Spec('Ends pointer dragging and removes the temporary pointer listeners used during one knob gesture.')
	private onPointerUp(event: PointerEvent) {
		if (this.hasPointerCapture(event.pointerId)) {
			this.releasePointerCapture(event.pointerId)
		}
		this.dragValueStart = null
		this.dragPointerStartY = null
		this.removeEventListener('pointermove', this.onPointerMove)
		this.removeEventListener('pointerup', this.onPointerUp)
		this.removeEventListener('pointercancel', this.onPointerUp)
		this.style.cursor = ''
	}

	@Spec('Responds to keyboard arrows home and end so the knob remains accessible without pointer input.')
	private onKeyDown(event: KeyboardEvent) {
		if (this.disabled) {
			return
		}
		if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
			this.applyValueChange(this.getNumericValue() + this.step)
			event.preventDefault()
			return
		}
		if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
			this.applyValueChange(this.getNumericValue() - this.step)
			event.preventDefault()
			return
		}
		if (event.key === 'Home') {
			this.applyValueChange(this.min)
			event.preventDefault()
			return
		}
		if (event.key === 'End') {
			this.applyValueChange(this.max)
			event.preventDefault()
		}
	}

	@Spec('Maps mouse-wheel motion to stepped value changes so the vintage knob feels quick to trim.')
	private onWheel(event: WheelEvent) {
		if (this.disabled) {
			return
		}
		const direction = event.deltaY <= 0 ? 1 : -1
		this.applyValueChange(this.getNumericValue() + this.step * direction)
		event.preventDefault()
	}

	@Spec('Rounds clamps stores and emits the next knob value whenever one interaction changes the control.')
	private applyValueChange(nextValue: number) {
		const clampedValue = Math.max(this.min, Math.min(this.max, nextValue))
		const steppedValue = this.step > 0
			? Math.round((clampedValue - this.min) / this.step) * this.step + this.min
			: clampedValue
		const normalizedValue = Number(steppedValue.toFixed(this.getStepPrecision()))
		const nextValueText = String(normalizedValue)
		if (nextValueText === this.value) {
			return
		}
		this.value = nextValueText
		this.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
	}

	@Spec('Infers the decimal precision implied by the configured step so emitted string values stay stable.')
	private getStepPrecision(): number {
		const stepText = String(this.step)
		const dotIndex = stepText.indexOf('.')
		if (dotIndex < 0) {
			return 0
		}
		return stepText.length - dotIndex - 1
	}
}
