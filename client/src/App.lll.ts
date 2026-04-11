import { LitElement, css, html, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { Spec } from '@shared/lll.lll'
import { PrimitiveSynth } from './PrimitiveSynth.lll'

@Spec('Renders the phase-one Scanline Synth interface around a primitive sine-wave instrument.')
@customElement('app-root')
export class App extends LitElement {
	static styles = css`
		:host {
			display: grid;
			min-height: 100vh;
			padding: 28px;
			box-sizing: border-box;
			align-items: center;
			justify-items: center;
			color: rgb(232, 238, 247);
			background-image:
				linear-gradient(rgba(5, 6, 11, 0.82), rgba(10, 12, 18, 0.9)),
				url('/images/bg70s/2.webp');
			background-size: cover;
			background-position: center;
			background-repeat: no-repeat;
			font-family: 'Manrope', 'Segoe UI', system-ui, -apple-system, sans-serif;
		}

		main {
			width: min(920px, 100%);
			display: grid;
			gap: 24px;
			padding: 28px;
			border-radius: 24px;
			background: rgba(7, 10, 18, 0.72);
			border: 1px solid rgba(255, 255, 255, 0.1);
			box-shadow: 0 22px 80px rgba(0, 0, 0, 0.42);
			backdrop-filter: blur(10px);
		}

		header {
			display: grid;
			gap: 12px;
		}

		h1,
		h2,
		p {
			margin: 0;
		}

		.eyebrow {
			text-transform: uppercase;
			letter-spacing: 0.14em;
			font-size: 0.78rem;
			color: rgba(157, 214, 255, 0.9);
		}

		h1 {
			font-size: clamp(2rem, 5vw, 3.4rem);
			letter-spacing: -0.03em;
		}

		.lead {
			max-width: 60ch;
			line-height: 1.6;
			color: rgba(232, 238, 247, 0.82);
		}

		.controls {
			display: flex;
			flex-wrap: wrap;
			gap: 12px;
		}

		button {
			padding: 13px 18px;
			border-radius: 14px;
			border: 1px solid rgba(255, 255, 255, 0.14);
			background: linear-gradient(135deg, #7757ff, #40b4ff);
			color: white;
			font-size: 1rem;
			font-weight: 700;
			cursor: pointer;
			transition: transform 0.12s ease, filter 0.12s ease, opacity 0.12s ease;
		}

		button.secondary {
			background: linear-gradient(135deg, #2e3447, #171c27);
		}

		button:disabled {
			opacity: 0.58;
			cursor: not-allowed;
			filter: grayscale(0.28);
		}

		button:not(:disabled):hover {
			transform: translateY(-1px);
			filter: brightness(1.04);
		}

		.status-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
			gap: 12px;
		}

		.status-card {
			display: grid;
			gap: 6px;
			padding: 16px;
			border-radius: 16px;
			background: rgba(255, 255, 255, 0.06);
			border: 1px solid rgba(255, 255, 255, 0.08);
		}

		.status-label {
			font-size: 0.74rem;
			text-transform: uppercase;
			letter-spacing: 0.12em;
			color: rgba(232, 238, 247, 0.62);
		}

		.status-value {
			font-size: 1.1rem;
			font-weight: 700;
		}

		.detail {
			padding: 16px;
			border-radius: 16px;
			background: rgba(64, 180, 255, 0.08);
			border: 1px solid rgba(64, 180, 255, 0.18);
			line-height: 1.6;
			color: rgba(232, 238, 247, 0.86);
		}
	`

	@state()
	private noteStateLabel: string = 'Ready to play'

	@state()
	private noteDetailText: string = 'Click Play tone to create a simple 440 Hz sine note with short attack and release shaping.'

	@state()
	private triggerCount: number = 0

	private readonly synth = new PrimitiveSynth({
		onStateChange: (state) => this.onSynthStateChange(state)
	})

	@Spec('Starts or retriggers the phase-one tone through the primitive synth engine.')
	private async onPlayTone() {
		const didStart = await this.synth.startNote()
		if (didStart) {
			this.triggerCount += 1
		}
	}

	@Spec('Releases the currently playing tone when the user requests note-off.')
	private onReleaseTone() {
		this.synth.releaseNote()
	}

	@Spec('Maps synth engine state changes to visible status text in the UI.')
	private onSynthStateChange(state: 'ready' | 'playing' | 'releasing' | 'unsupported') {
		if (state === 'ready') {
			this.noteStateLabel = 'Ready to play'
			this.noteDetailText = 'The note has faded out cleanly and the synth is ready for another trigger.'
			return
		}

		if (state === 'playing') {
			this.noteStateLabel = 'Playing'
			this.noteDetailText = 'A steady sine wave is sustaining at 440 Hz while the release button remains available.'
			return
		}

		if (state === 'releasing') {
			this.noteStateLabel = 'Releasing'
			this.noteDetailText = 'The current note is fading out with a short release so it stops cleanly without clicks.'
			return
		}

		this.noteStateLabel = 'Unavailable'
		this.noteDetailText = 'This environment does not expose a browser AudioContext, so the primitive synth cannot start.'
	}

	@Spec('Renders the phase-one primitive synth controls and visible note status.')
	render(): TemplateResult {
		return html`
			<main>
				<header>
					<p class="eyebrow">Phase 1 — Primitive Synth Foundation</p>
					<h1>Scanline Synth</h1>
					<p class="lead">
						This first milestone proves the browser audio path with a single sine-wave note, a short attack,
						and a clean release that can be triggered repeatedly.
					</p>
				</header>

				<section class="controls" aria-label="Primitive synth controls">
					<button id="play-tone-button" @click=${() => this.onPlayTone()}>Play tone</button>
					<button
						id="release-tone-button"
						class="secondary"
						@click=${() => this.onReleaseTone()}
						?disabled=${this.noteStateLabel !== 'Playing'}
					>
						Release tone
					</button>
				</section>

				<section class="status-grid" aria-label="Primitive synth status">
					<div class="status-card">
						<div class="status-label">Waveform</div>
						<div id="waveform-value" class="status-value">Sine</div>
					</div>
					<div class="status-card">
						<div class="status-label">Pitch</div>
						<div id="pitch-value" class="status-value">440 Hz · A4</div>
					</div>
					<div class="status-card">
						<div class="status-label">Envelope</div>
						<div id="envelope-value" class="status-value">40 ms attack · 120 ms release</div>
					</div>
					<div class="status-card">
						<div class="status-label">Note state</div>
						<div id="note-state-value" class="status-value">${this.noteStateLabel}</div>
					</div>
					<div class="status-card">
						<div class="status-label">Trigger count</div>
						<div id="trigger-count-value" class="status-value">${this.triggerCount}</div>
					</div>
				</section>

				<section class="detail" id="note-detail-text">${this.noteDetailText}</section>
			</main>
		`
	}
}
