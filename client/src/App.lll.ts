import { LitElement, html, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { Spec } from '@shared/lll.lll'
import { AppStyles } from './AppStyles.lll'
import { ImageWaveformBank } from './ImageWaveformBank.lll'
import { ImageWaveformRow } from './ImageWaveformRow.lll'
import { KeyboardPitch } from './KeyboardPitch.lll'
import { PrimitiveSynth } from './PrimitiveSynth.lll'
import { QwertyKeyboard } from './QwertyKeyboard.lll'
import './ImageWaveformPreview.lll'
import './UploadedImagePreview.lll'

@Spec('Renders the Scanline Synth interface around a playable QWERTY keyboard with switchable mono and poly playback plus uploaded image row waveforms.')
@customElement('app-root')
export class App extends LitElement {
	static styles = AppStyles.styles
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

	@state()
	private uploadedImageUrl: string | null = null

	@state()
	private uploadedImageName: string = 'No image selected'

	@state()
	private waveformLabel: string = 'Sine'

	@state()
	private waveformDetailText: string = 'No uploaded image row is active yet.'

	@state()
	private selectedRowIndex: number = 0

	@state()
	private availableRowCount: number = 0

	private imageWaveformRows: ImageWaveformRow[] = []
	private readonly imageWaveformBank = new ImageWaveformBank()

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

	@Spec('Disconnects global keyboard listeners, releases any sounding synth voices, and cleans up uploaded preview resources when the app unmounts.')
	disconnectedCallback() {
		window.removeEventListener('keydown', this.onWindowKeyDownListener)
		window.removeEventListener('keyup', this.onWindowKeyUpListener)
		this.synth.releaseNote()
		this.revokeUploadedImageUrl()
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

	@Spec('Updates the uploaded image preview and image-row waveform bank from one file selection so the synth can switch away from the sine oscillator.')
	private async onImageSelection(event: Event) {
		const input = event.currentTarget as HTMLInputElement | null
		const file = input?.files?.[0] ?? null
		if (file === null) {
			return
		}
		this.revokeUploadedImageUrl()
		this.uploadedImageUrl = URL.createObjectURL(file)
		this.uploadedImageName = file.name
		try {
			const waveformBank = await this.imageWaveformBank.loadFromFile(file)
			this.imageWaveformRows = waveformBank.rows
			this.availableRowCount = waveformBank.rows.length
			this.selectedRowIndex = this.chooseDefaultRowIndex(waveformBank.rows)
			this.applySelectedWaveformRow()
			this.waveformDetailText = `${waveformBank.width} × ${waveformBank.height} image loaded. Row ${this.selectedRowIndex + 1} is active for playback.`
		} catch (_error) {
			this.imageWaveformRows = []
			this.availableRowCount = 0
			this.selectedRowIndex = 0
			this.synth.setWaveformSamples(null)
			this.waveformLabel = 'Sine'
			this.waveformDetailText = 'The selected image could not be decoded into waveform rows, so the synth stayed on the sine oscillator.'
		}
	}

	@Spec('Selects a default uploaded row that is likely to sound distinct by preferring the brightest row in the image bank.')
	private chooseDefaultRowIndex(rows: ImageWaveformRow[]): number {
		let brightestRowIndex = 0
		let brightestAverage = -1
		for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
			const averageBrightness = rows[rowIndex]?.averageBrightness ?? -1
			if (averageBrightness <= brightestAverage) {
				continue
			}
			brightestAverage = averageBrightness
			brightestRowIndex = rowIndex
		}
		return brightestRowIndex
	}

	@Spec('Applies the currently selected uploaded image row to the synth and refreshes the visible waveform status cards.')
	private applySelectedWaveformRow() {
		const selectedRow = this.imageWaveformRows[this.selectedRowIndex] ?? null
		if (selectedRow === null) {
			this.synth.setWaveformSamples(null)
			this.waveformLabel = 'Sine'
			this.waveformDetailText = 'No uploaded image row is active yet.'
			return
		}
		this.synth.setWaveformSamples(selectedRow.samples)
		this.waveformLabel = `Image row ${this.selectedRowIndex + 1}`
		this.waveformDetailText = `Uploaded waveform row ${this.selectedRowIndex + 1} of ${this.availableRowCount} is active. Average brightness ${(selectedRow.averageBrightness * 100).toFixed(1)}%.`
	}

	@Spec('Handles a visible row selection change so users can audition different uploaded image rows as stable waveforms.')
	private onRowSelectionChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement | null
		const nextRowIndex = Number(input?.value ?? '0')
		if (Number.isFinite(nextRowIndex) === false) {
			return
		}
		this.selectedRowIndex = Math.max(0, Math.min(nextRowIndex, Math.max(this.availableRowCount - 1, 0)))
		this.applySelectedWaveformRow()
	}

	@Spec('Releases the current uploaded image object URL when a new preview replaces it or the app unmounts.')
	private revokeUploadedImageUrl() {
		if (this.uploadedImageUrl === null) {
			return
		}
		URL.revokeObjectURL(this.uploadedImageUrl)
		this.uploadedImageUrl = null
	}

	@Spec('Builds the synth status and uploaded image panel section used by the main application layout.')
	private renderStatusUploadPanel(): TemplateResult {
		return html`
			<section class="status-upload-layout" aria-label="Synth status and uploaded image panel">
				<section class="status-grid" aria-label="Keyboard synth status">
					<div class="status-card"><div class="status-label">Waveform</div><div id="waveform-value" class="status-value">${this.waveformLabel}</div></div>
					<div class="status-card"><div class="status-label">Envelope</div><div id="envelope-value" class="status-value">40 ms attack · 120 ms release</div></div>
					<div class="status-card"><div class="status-label">Voice mode</div><div id="voice-mode-value" class="status-value">${this.isMonophonic ? 'Monophonic' : 'Polyphonic'}</div></div>
					<div class="status-card"><div class="status-label">Sounding voices</div><div id="sounding-voices-value" class="status-value">${this.soundingVoiceCount}</div></div>
					<div class="status-card"><div class="status-label">Active key</div><div id="active-key-value" class="status-value">${this.activeKeyLabel}</div></div>
					<div class="status-card"><div class="status-label">Active note</div><div id="active-note-value" class="status-value">${this.activeNoteLabel}</div></div>
					<div class="status-card"><div class="status-label">Pitch</div><div id="pitch-value" class="status-value">${this.pitchLabel}</div></div>
					<div class="status-card"><div class="status-label">Note state</div><div id="note-state-value" class="status-value">${this.noteStateLabel}</div></div>
					<div class="status-card"><div class="status-label">Trigger count</div><div id="trigger-count-value" class="status-value">${this.triggerCount}</div></div>
				</section>
				<section class="upload-card" aria-label="Image upload panel">
					<div class="status-label">Reference image</div>
					<label class="upload-button" for="image-upload-input">Upload image</label>
					<input id="image-upload-input" class="upload-input" type="file" accept="image/*" @change=${this.onImageSelection} />
					<div class="plate-value" id="uploaded-image-name">${this.uploadedImageName}</div>
					<div class="upload-controls">
						<div class="status-label">Waveform row select</div>
						<input id="waveform-row-slider" class="row-slider" type="range" min="0" max=${Math.max(this.availableRowCount - 1, 0)} .value=${String(this.selectedRowIndex)} ?disabled=${this.availableRowCount <= 1} @input=${this.onRowSelectionChange} />
						<div id="waveform-row-value" class="plate-value">${this.availableRowCount === 0 ? 'No rows loaded' : `Row ${this.selectedRowIndex + 1} of ${this.availableRowCount}`}</div>
					</div>
					<uploaded-image-preview id="uploaded-image-preview" .imageUrl=${this.uploadedImageUrl} .imageName=${this.uploadedImageName} .selectedRowIndex=${this.selectedRowIndex} .rowCount=${this.availableRowCount}></uploaded-image-preview>
					<div class="waveform-preview-panel">
						<div class="status-label">Selected waveform</div>
						<image-waveform-preview .samples=${[...(this.imageWaveformRows[this.selectedRowIndex]?.samples ?? [])]} previewLabel=${'Selected waveform preview'} .rowIndex=${this.availableRowCount === 0 ? -1 : this.selectedRowIndex} .rowCount=${this.availableRowCount}></image-waveform-preview>
					</div>
				</section>
			</section>
		`
	}

	@Spec('Renders the QWERTY keyboard guide, mono-poly switch, visible synth status cards, and the uploaded image waveform panel.')
	render(): TemplateResult {
		return html`
			<main>
				<header>
					<div class="header-copy">
						<p class="eyebrow">Phase 3 — Image Upload and Row-Based Waveform Synth</p>
						<h1>Scanline Synth</h1>
						<p class="lead">
							Upload an image, turn its horizontal rows into single-cycle waveforms, and keep playing the
							QWERTY keyboard while selecting which row shapes the active timbre.
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
								<input id="monophonic-toggle" class="switch-input" type="checkbox" ?checked=${this.isMonophonic} @change=${this.onMonophonicToggle} />
								<span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
							</span>
						</div>
						<div id="voice-mode-help" class="switch-detail">Off keeps every unique held pitch sounding polyphonically. On makes the synth follow only the newest held pitch.</div>
					</label>
				</section>

				${this.renderStatusUploadPanel()}
				<section class="detail" id="note-detail-text">${this.noteDetailText}</section>
				<section class="detail" id="waveform-detail-text">${this.waveformDetailText}</section>
			</main>
		`
	}
}
