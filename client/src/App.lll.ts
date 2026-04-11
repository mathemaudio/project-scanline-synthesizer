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
			--panel-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
			--panel-border: rgba(255, 224, 168, 0.18);
			--surface-dark: #221b15;
			--surface-mid: #3f3128;
			--surface-light: #8e7257;
			--label-ink: #f5dfb0;
			--display-green: #b8f6a9;
			--switch-off: #5c5046;
			--switch-on: #cf6f36;
			display: grid;
			min-height: 100vh;
			padding: 32px;
			box-sizing: border-box;
			align-items: center;
			justify-items: center;
			color: rgb(244, 235, 212);
			background:
				radial-gradient(circle at top, rgba(217, 149, 70, 0.22), transparent 36%),
				linear-gradient(rgba(10, 7, 5, 0.58), rgba(9, 7, 6, 0.82)),
				url('/images/bg70s/2.webp');
			background-size: cover;
			background-position: center;
			background-repeat: no-repeat;
			font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
		}

		main {
			width: min(1040px, 100%);
			display: grid;
			gap: 24px;
			padding: 28px;
			border-radius: 28px;
			background:
				linear-gradient(180deg, rgba(147, 117, 84, 0.22), rgba(26, 21, 16, 0.14)),
				linear-gradient(135deg, rgba(53, 41, 32, 0.98), rgba(24, 19, 14, 0.98));
			border: 1px solid var(--panel-border);
			box-shadow: var(--panel-shadow);
			position: relative;
			overflow: hidden;
		}

		main::before {
			content: '';
			position: absolute;
			inset: 14px;
			border-radius: 20px;
			border: 1px solid rgba(255, 242, 214, 0.08);
			pointer-events: none;
		}

		header,
		.keyboard-guide,
		.status-grid,
		.mode-section {
			display: grid;
			gap: 14px;
			position: relative;
			z-index: 1;
		}

		h1,
		h2,
		p {
			margin: 0;
		}

		header {
			grid-template-columns: minmax(0, 1.4fr) minmax(220px, 0.9fr);
			align-items: end;
			gap: 18px 28px;
			padding-bottom: 20px;
			border-bottom: 1px solid rgba(255, 219, 160, 0.14);
		}

		.header-copy {
			display: grid;
			gap: 12px;
		}

		.brand-plate {
			display: grid;
			gap: 10px;
			padding: 16px 18px;
			border-radius: 16px;
			background: linear-gradient(180deg, rgba(0, 0, 0, 0.28), rgba(255, 255, 255, 0.03));
			border: 1px solid rgba(255, 226, 177, 0.18);
			box-shadow: inset 0 1px 0 rgba(255, 245, 223, 0.08);
		}

		.eyebrow,
		.guide-label,
		.status-label,
		.switch-label,
		.plate-label {
			text-transform: uppercase;
			letter-spacing: 0.18em;
			font-size: 0.72rem;
			color: rgba(245, 223, 176, 0.7);
		}

		h1 {
			font-family: 'Orbitron', 'Inter', sans-serif;
			font-size: clamp(2.4rem, 5vw, 4rem);
			letter-spacing: 0.08em;
			text-transform: uppercase;
			color: #f8e2b8;
			text-shadow: 0 0 18px rgba(207, 111, 54, 0.16);
		}

		.lead,
		.detail,
		.switch-detail,
		.plate-value {
			line-height: 1.6;
			color: rgba(244, 235, 212, 0.86);
		}

		.plate-value {
			font-family: 'Orbitron', 'Inter', sans-serif;
			font-size: 1.05rem;
			letter-spacing: 0.08em;
			color: var(--display-green);
		}

		.keyboard-guide,
		.mode-section {
			grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		}

		.guide-card,
		.status-card,
		.switch-card {
			display: grid;
			gap: 10px;
			padding: 18px;
			border-radius: 18px;
			background:
				linear-gradient(180deg, rgba(255, 247, 234, 0.04), rgba(0, 0, 0, 0.14)),
				linear-gradient(135deg, rgba(80, 62, 49, 0.94), rgba(46, 35, 28, 0.96));
			border: 1px solid rgba(255, 225, 173, 0.12);
			box-shadow:
				inset 0 1px 0 rgba(255, 248, 230, 0.06),
				0 10px 18px rgba(0, 0, 0, 0.18);
		}

		.guide-card {
			position: relative;
			overflow: hidden;
		}

		.guide-card::after {
			content: '';
			position: absolute;
			left: 18px;
			right: 18px;
			bottom: 14px;
			height: 4px;
			border-radius: 999px;
			background: linear-gradient(90deg, #d85e31, #e0b95f, #9bc67d);
			opacity: 0.75;
		}

		.guide-value,
		.status-value,
		.switch-value {
			font-family: 'Orbitron', 'Inter', sans-serif;
			font-size: 1rem;
			font-weight: 700;
			letter-spacing: 0.06em;
		}

		.guide-value {
			padding-bottom: 14px;
			line-height: 1.7;
		}

		.status-grid {
			grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		}

		.status-card {
			min-height: 104px;
		}

		.status-value {
			color: var(--display-green);
			text-shadow: 0 0 10px rgba(184, 246, 169, 0.12);
		}

		.switch-card {
			gap: 14px;
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
			width: 70px;
			height: 36px;
			display: inline-flex;
			align-items: center;
			padding: 4px;
			box-sizing: border-box;
			border-radius: 999px;
			border: 1px solid rgba(255, 230, 181, 0.14);
			background: linear-gradient(180deg, var(--switch-off), #393028);
			box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.32);
			transition: background 0.18s ease;
		}

		.switch-thumb {
			width: 26px;
			height: 26px;
			border-radius: 50%;
			background: linear-gradient(180deg, #f6e2bf, #caa36f);
			box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
			transform: translateX(0);
			transition: transform 0.18s ease;
		}

		.switch-input:checked + .switch-track {
			background: linear-gradient(180deg, var(--switch-on), #92441d);
		}

		.switch-input:checked + .switch-track .switch-thumb {
			transform: translateX(34px);
		}

		.detail {
			position: relative;
			z-index: 1;
			padding: 18px 20px;
			border-radius: 18px;
			background: linear-gradient(180deg, rgba(207, 111, 54, 0.15), rgba(0, 0, 0, 0.16));
			border: 1px solid rgba(221, 157, 90, 0.24);
			min-height: 4.6em;
		}

		@media (max-width: 760px) {
			header {
				grid-template-columns: 1fr;
			}

			:host {
				padding: 18px;
			}

			main {
				padding: 20px;
			}
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
					<div class="header-copy">
						<p class="eyebrow">Phase 2 — Playable QWERTY Keyboard</p>
						<h1>Scanline Synth</h1>
						<p class="lead">
							The synth now feels more like a warm vintage instrument panel, with mapped QWERTY notes,
							retro status displays, and a mono-poly performance switch.
						</p>
					</div>
					<div class="brand-plate" aria-label="Instrument panel badge">
						<div class="plate-label">Program</div>
						<div class="plate-value">ANALOG KEYS / PANEL A</div>
						<div class="plate-label">Circuit status</div>
						<div class="plate-value">OSC READY · FILTER WARM</div>
					</div>
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
