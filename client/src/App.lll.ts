import { LitElement, css, html, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { Spec } from '@shared/lll.lll'
import { KeyboardPitch } from './KeyboardPitch.lll'
import { PrimitiveSynth } from './PrimitiveSynth.lll'
import { QwertyKeyboard } from './QwertyKeyboard.lll'

@Spec('Renders the Scanline Synth interface around a playable QWERTY keyboard with switchable mono and poly playback.')
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
		.status-grid,
		.mode-section {
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
		.detail,
		.switch-detail {
			line-height: 1.6;
			color: rgba(232, 238, 247, 0.84);
		}

		.keyboard-guide,
		.mode-section {
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		}

		.guide-card,
		.status-card,
		.switch-card {
			display: grid;
			gap: 8px;
			padding: 16px;
			border-radius: 16px;
			background: rgba(255, 255, 255, 0.06);
			border: 1px solid rgba(255, 255, 255, 0.08);
		}

		.guide-label,
		.status-label,
		.switch-label {
			font-size: 0.74rem;
			text-transform: uppercase;
			letter-spacing: 0.12em;
			color: rgba(232, 238, 247, 0.62);
		}

		.guide-value,
		.status-value,
		.switch-value {
			font-size: 1.05rem;
			font-weight: 700;
		}

		.status-grid {
			grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
		}

		.switch-card {
			gap: 12px;
		}

		.switch-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 16px;
		}

		.switch-control {
			display: inline-flex;
			align-items: center;
			gap: 12px;
			cursor: pointer;
		}

		.switch-input {
			position: absolute;
			opacity: 0;
			pointer-events: none;
		}

		.switch-track {
			width: 58px;
			height: 32px;
			display: inline-flex;
			align-items: center;
			padding: 4px;
			box-sizing: border-box;
			border-radius: 999px;
			background: rgba(255, 255, 255, 0.18);
			transition: background 0.18s ease;
		}

		.switch-thumb {
			width: 24px;
			height: 24px;
			border-radius: 50%;
			background: rgb(255, 255, 255);
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.28);
			transform: translateX(0);
			transition: transform 0.18s ease;
		}

		.switch-input:checked + .switch-track {
			background: rgba(64, 180, 255, 0.9);
		}

		.switch-input:checked + .switch-track .switch-thumb {
			transform: translateX(26px);
		}

		.detail {
			padding: 16px;
			border-radius: 16px;
			background: rgba(64, 180, 255, 0.08);
			border: 1px solid rgba(64, 180, 255, 0.18);
			height: 3em;
		}
	`

	@state()
	private noteStateLabel: string = 'Ready to play'

	@state()
	private noteDetailText: string = 'Polyphonic mode is armed. Hold Q through P or Z through M to stack notes, and release them to let every sounding voice fade cleanly.'

	@state()
	private activeNoteLabel: string = '—'

	@state()
	private activeKeyLabel: string = '—'

	@state()
	private pitchLabel: string = 'No active note'

	@state()
	private triggerCount: number = 0

	@state()
	private isMonophonic: boolean = false

	@state()
	private soundingVoiceCount: number = 0

	private readonly synth = new PrimitiveSynth({
		monophonic: false,
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

	@Spec('Disconnects global keyboard listeners and releases any sounding synth voices when the app unmounts.')
	disconnectedCallback() {
		window.removeEventListener('keydown', this.onWindowKeyDownListener)
		window.removeEventListener('keyup', this.onWindowKeyUpListener)
		this.synth.releaseNote()
		super.disconnectedCallback()
	}

	@Spec('Handles mapped key presses by updating held keyboard state and letting the synth choose mono or poly playback.')
	private async onWindowKeyDown(event: KeyboardEvent) {
		const playState = this.qwertyKeyboard.pressKey(event.key)
		await this.syncKeyboardChange(event, playState)
	}

	@Spec('Handles mapped key releases by updating held keyboard state and letting the synth choose the remaining voices.')
	private async onWindowKeyUp(event: KeyboardEvent) {
		const playState = this.qwertyKeyboard.releaseKey(event.key)
		await this.syncKeyboardChange(event, playState)
	}

	@Spec('Applies one keyboard state change to the synth and visible UI so mono and poly playback stay in sync.')
	private async syncKeyboardChange(
		event: KeyboardEvent,
		playState: { consumed: boolean, didChange: boolean, activePitch: KeyboardPitch | null, heldPitches: KeyboardPitch[] }
	) {
		if (playState.consumed && event.cancelable) {
			event.preventDefault()
		}

		if (playState.consumed === false) {
			return
		}

		this.updateActivePitchDisplay(playState.activePitch)
		if (event.type === 'keydown' && playState.didChange && playState.activePitch !== null) {
			this.triggerCount += 1
		}
		await this.synth.syncNotes(playState.heldPitches.map((pitch) => pitch.frequencyHz))
		this.updateSoundingVoiceCount(playState.heldPitches)
	}

	@Spec('Turns monophonic synth mode on or off from the visible switch and reapplies the current held notes immediately.')
	private async onMonophonicToggle(event: Event) {
		const input = event.currentTarget as HTMLInputElement | null
		this.isMonophonic = input?.checked ?? false
		this.synth.setMonophonic(this.isMonophonic)
		const heldPitches = this.qwertyKeyboard.getHeldPitches()
		await this.synth.syncNotes(heldPitches.map((pitch) => pitch.frequencyHz))
		this.updateSoundingVoiceCount(heldPitches)
		this.refreshVisibleStatusText()
	}

	@Spec('Maps synth engine state changes to visible keyboard status text that reflects the current voice mode.')
	private onSynthStateChange(state: 'ready' | 'playing' | 'releasing' | 'unsupported') {
		this.updateSoundingVoiceCount()
		if (state === 'ready') {
			this.noteStateLabel = 'Ready to play'
			this.noteDetailText = this.isMonophonic
				? 'Monophonic mode is armed. Hold overlapping mapped keys to let the newest key take over while earlier keys stay available for fallback.'
				: 'Polyphonic mode is armed. Hold several mapped keys together to stack a chord, and release them to let every sounding voice fade cleanly.'
			return
		}

		if (state === 'playing') {
			const activePitch = this.qwertyKeyboard.getActivePitch()
			if (this.isMonophonic) {
				this.noteStateLabel = 'Playing'
				this.noteDetailText = activePitch === null
					? 'The monophonic synth is following the newest mapped key with a single sine voice.'
					: `${activePitch.noteLabel} is leading the monophonic synth. The newest held key controls one voice while earlier held keys wait silently for fallback.`
				return
			}

			this.noteStateLabel = 'Playing'
			this.noteDetailText = activePitch === null
				? 'The polyphonic synth is sounding every currently held mapped key with its own sine voice.'
				: `${this.soundingVoiceCount} sounding voice${this.soundingVoiceCount === 1 ? '' : 's'} ${this.soundingVoiceCount === 1 ? 'is' : 'are'} active in polyphonic mode. ${activePitch.noteLabel} is the newest visible key while earlier held notes keep ringing.`
			return
		}

		if (state === 'releasing') {
			this.noteStateLabel = 'Releasing'
			this.noteDetailText = this.isMonophonic
				? 'All held keys are up, so the monophonic voice is fading out with a short release.'
				: 'All held keys are up, so every sounding voice is fading out together with a short release.'
			return
		}

		this.noteStateLabel = 'Unavailable'
		this.noteDetailText = 'This environment does not expose a browser AudioContext, so the QWERTY synth cannot start.'
	}

	@Spec('Updates the visible active key, note, and pitch cards to match the latest keyboard-leading pitch.')
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

	@Spec('Refreshes the visible sounding-voice counter from the synth engine.')
	private updateSoundingVoiceCount(heldPitches: KeyboardPitch[] = this.qwertyKeyboard.getHeldPitches()) {
		this.soundingVoiceCount = this.calculateVisibleVoiceCount(heldPitches)
	}

	@Spec('Calculates the visible voice count implied by the held-note snapshot and the synth voice mode.')
	private calculateVisibleVoiceCount(heldPitches: KeyboardPitch[]): number {
		if (heldPitches.length === 0) {
			return 0
		}
		if (this.isMonophonic) {
			return 1
		}
		const uniqueFrequencyKeys = new Set(heldPitches.map((pitch) => pitch.frequencyHz.toFixed(6)))
		return uniqueFrequencyKeys.size
	}

	@Spec('Refreshes visible status text after a mode toggle using the synth state already on screen.')
	private refreshVisibleStatusText() {
		if (this.noteStateLabel === 'Unavailable') {
			return
		}
		if (this.soundingVoiceCount > 0) {
			this.onSynthStateChange('playing')
			return
		}
		if (this.noteStateLabel === 'Releasing') {
			this.onSynthStateChange('releasing')
			return
		}
		this.onSynthStateChange('ready')
	}

	@Spec('Formats one mapped pitch into the visible frequency card text shown in the app UI.')
	private formatPitchValue(activePitch: KeyboardPitch): string {
		return `${activePitch.frequencyHz.toFixed(2)} Hz · ${activePitch.noteLabel}`
	}

	@Spec('Renders the QWERTY keyboard guide, mono-poly switch, and visible synth status cards.')
	render(): TemplateResult {
		return html`
			<main>
				<header>
					<p class="eyebrow">Phase 2 — Playable QWERTY Keyboard</p>
					<h1>Scanline Synth</h1>
					<p class="lead">
						The synth now receives the full set of held QWERTY notes and decides whether to sound them
						polyphonically or collapse them into one monophonic lead voice.
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

				<section class="mode-section" aria-label="Synth voice mode control">
					<label class="switch-card" for="monophonic-toggle">
						<div class="switch-label">Monophonic mode</div>
						<div class="switch-row">
							<div id="monophonic-toggle-value" class="switch-value">${this.isMonophonic ? 'On' : 'Off'}</div>
							<span class="switch-control">
								<input
									id="monophonic-toggle"
									class="switch-input"
									type="checkbox"
									?checked=${this.isMonophonic}
									@change=${this.onMonophonicToggle}
								/>
								<span class="switch-track" aria-hidden="true">
									<span class="switch-thumb"></span>
								</span>
							</span>
						</div>
						<div id="voice-mode-help" class="switch-detail">Off keeps every unique held pitch sounding polyphonically. On makes the synth follow only the newest held pitch.</div>
					</label>
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
						<div class="status-label">Voice mode</div>
						<div id="voice-mode-value" class="status-value">${this.isMonophonic ? 'Monophonic' : 'Polyphonic'}</div>
					</div>
					<div class="status-card">
						<div class="status-label">Sounding voices</div>
						<div id="sounding-voices-value" class="status-value">${this.soundingVoiceCount}</div>
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
