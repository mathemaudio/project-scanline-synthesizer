import { LitElement, css, html, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { Spec } from '@shared/lll.lll'
import { KeyboardPitch } from './KeyboardPitch.lll'
import { PrimitiveSynth } from './PrimitiveSynth.lll'
import { QwertyKeyboard } from './QwertyKeyboard.lll'

@Spec('Renders the phase-two Scanline Synth interface around a playable QWERTY keyboard sine synth.')
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

		header,
		.keyboard-guide,
		.status-grid {
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

		.lead,
		.detail {
			line-height: 1.6;
			color: rgba(232, 238, 247, 0.84);
		}

		.keyboard-guide {
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		}

		.guide-card,
		.status-card {
			display: grid;
			gap: 8px;
			padding: 16px;
			border-radius: 16px;
			background: rgba(255, 255, 255, 0.06);
			border: 1px solid rgba(255, 255, 255, 0.08);
		}

		.guide-label,
		.status-label {
			font-size: 0.74rem;
			text-transform: uppercase;
			letter-spacing: 0.12em;
			color: rgba(232, 238, 247, 0.62);
		}

		.guide-value,
		.status-value {
			font-size: 1.05rem;
			font-weight: 700;
		}

		.status-grid {
			grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
		}

		.detail {
			padding: 16px;
			border-radius: 16px;
			background: rgba(64, 180, 255, 0.08);
			border: 1px solid rgba(64, 180, 255, 0.18);
		}
	`

	@state()
	private noteStateLabel: string = 'Ready to play'

	@state()
	private noteDetailText: string = 'Press Q through P for C4 to E5, or Z through M for C5 to B5. The upper row continues naturally into the next octave, and key release fades notes out cleanly.'

	@state()
	private activeNoteLabel: string = '—'

	@state()
	private activeKeyLabel: string = '—'

	@state()
	private pitchLabel: string = 'No active note'

	@state()
	private triggerCount: number = 0

	private readonly synth = new PrimitiveSynth({
		onStateChange: (state) => this.onSynthStateChange(state)
	})

	private readonly qwertyKeyboard = new QwertyKeyboard({
		baseOctave: 4,
		pitchReferenceHz: 440
	})

	private readonly onWindowKeyDownListener = (event: KeyboardEvent) => {
		void this.onWindowKeyDown(event)
	}

	private readonly onWindowKeyUpListener = (event: KeyboardEvent) => {
		void this.onWindowKeyUp(event)
	}

	@Spec('Connects global keyboard listeners so mapped QWERTY presses can control the synth while the app is mounted.')
	connectedCallback() {
		super.connectedCallback()
		window.addEventListener('keydown', this.onWindowKeyDownListener)
		window.addEventListener('keyup', this.onWindowKeyUpListener)
	}

	@Spec('Disconnects global keyboard listeners when the app unmounts to avoid leaked key handlers.')
	disconnectedCallback() {
		window.removeEventListener('keydown', this.onWindowKeyDownListener)
		window.removeEventListener('keyup', this.onWindowKeyUpListener)
		super.disconnectedCallback()
	}

	@Spec('Handles mapped key presses by starting or changing the active synth pitch and preventing browser interference.')
	private async onWindowKeyDown(event: KeyboardEvent) {
		const playState = this.qwertyKeyboard.pressKey(event.key)
		await this.syncKeyboardChange(event, playState)
	}

	@Spec('Handles mapped key releases by triggering note-off or falling back to the next held pitch cleanly.')
	private async onWindowKeyUp(event: KeyboardEvent) {
		const playState = this.qwertyKeyboard.releaseKey(event.key)
		await this.syncKeyboardChange(event, playState)
	}

	@Spec('Applies one keyboard state change to the synth and visible UI so keydown and keyup stay in sync.')
	private async syncKeyboardChange(
		event: KeyboardEvent,
		playState: { consumed: boolean, didChange: boolean, activePitch: KeyboardPitch | null }
	) {
		if (playState.consumed && event.cancelable) {
			event.preventDefault()
		}

		if (playState.didChange === false) {
			return
		}

		this.updateActivePitchDisplay(playState.activePitch)
		if (playState.activePitch === null) {
			this.synth.releaseNote()
			return
		}

		this.triggerCount += 1
		await this.synth.startNote(playState.activePitch.frequencyHz)
	}

	@Spec('Maps synth engine state changes to visible phase-two keyboard status text in the UI.')
	private onSynthStateChange(state: 'ready' | 'playing' | 'releasing' | 'unsupported') {
		if (state === 'ready') {
			this.noteStateLabel = 'Ready to play'
			this.noteDetailText = 'Press Q through P for C4 to E5, or Z through M for C5 to B5. The upper row continues naturally into the next octave, and key release fades notes out cleanly.'
			return
		}

		if (state === 'playing') {
			const activePitch = this.qwertyKeyboard.getActivePitch()
			this.noteStateLabel = 'Playing'
			this.noteDetailText = activePitch === null
				? 'A mapped key is driving the sine synth. Press another neighboring key to move in semitone steps.'
				: `${activePitch.noteLabel} is sounding from the ${activePitch.keyLabel} key. Press another mapped key to move chromatically across the keyboard.`
			return
		}

		if (state === 'releasing') {
			this.noteStateLabel = 'Releasing'
			this.noteDetailText = 'All currently active mapped keys are up, so the note is fading out with a short release.'
			return
		}

		this.noteStateLabel = 'Unavailable'
		this.noteDetailText = 'This environment does not expose a browser AudioContext, so the QWERTY synth cannot start.'
	}

	@Spec('Updates the visible active key, note, and pitch cards to match the currently selected keyboard pitch.')
	private updateActivePitchDisplay(activePitch: KeyboardPitch | null) {
		if (activePitch === null) {
			this.activeKeyLabel = '—'
			this.activeNoteLabel = '—'
			this.pitchLabel = 'No active note'
			return
		}

		this.activeKeyLabel = activePitch.keyLabel
		this.activeNoteLabel = activePitch.noteLabel
		this.pitchLabel = this.formatPitchValue(activePitch)
	}

	@Spec('Formats one mapped pitch into the visible frequency card text shown in the app UI.')
	private formatPitchValue(activePitch: KeyboardPitch): string {
		return `${activePitch.frequencyHz.toFixed(2)} Hz · ${activePitch.noteLabel}`
	}

	@Spec('Renders the phase-two QWERTY keyboard guide and visible synth status cards.')
	render(): TemplateResult {
		return html`
			<main>
				<header>
					<p class="eyebrow">Phase 2 — Playable QWERTY Keyboard</p>
					<h1>Scanline Synth</h1>
					<p class="lead">
						The synth is now playable from the computer keyboard. Press mapped keys for chromatic notes,
						release them for note-off, and use adjacent keys to step through semitone intervals.
					</p>
				</header>

				<section class="keyboard-guide" aria-label="QWERTY keyboard mapping">
					<div class="guide-card">
						<div class="guide-label">Upper row</div>
						<div id="keyboard-row-top-value" class="guide-value">Q 2 W 3 E R 5 T 6 Y 7 U I 9 O 0 P → C4 to E5</div>
					</div>
					<div class="guide-card">
						<div class="guide-label">Lower row</div>
						<div id="keyboard-row-bottom-value" class="guide-value">Z S X D C V G B H N J M → C5 to B5</div>
					</div>
				</section>

				<section class="status-grid" aria-label="Keyboard synth status">
					<div class="status-card">
						<div class="status-label">Waveform</div>
						<div id="waveform-value" class="status-value">Sine</div>
					</div>
					<div class="status-card">
						<div class="status-label">Envelope</div>
						<div id="envelope-value" class="status-value">40 ms attack · 120 ms release</div>
					</div>
					<div class="status-card">
						<div class="status-label">Active key</div>
						<div id="active-key-value" class="status-value">${this.activeKeyLabel}</div>
					</div>
					<div class="status-card">
						<div class="status-label">Active note</div>
						<div id="active-note-value" class="status-value">${this.activeNoteLabel}</div>
					</div>
					<div class="status-card">
						<div class="status-label">Pitch</div>
						<div id="pitch-value" class="status-value">${this.pitchLabel}</div>
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
