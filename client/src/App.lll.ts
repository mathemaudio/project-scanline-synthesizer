import { LitElement, html, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { Spec } from '@shared/lll.lll'
import { AppStyles } from './AppStyles.lll'
import { ImageWaveformBank } from './ImageWaveformBank.lll'
import { ImageWaveformRow } from './ImageWaveformRow.lll'
import { KeyboardPitch } from './KeyboardPitch.lll'
import { PrimitiveSynth } from './PrimitiveSynth.lll'
import { QwertyKeyboard } from './QwertyKeyboard.lll'
import { FilterEnvelopeSettings } from './synth/FilterEnvelopeSettings.lll'
import { SynthPlaybackMode } from './synth/SynthPlaybackMode.lll'
import './ImageWaveformPreview.lll'
import './UploadedImagePreview.lll'

@Spec('Renders the Scanline Synth interface around a playable QWERTY keyboard with switchable mono-poly voice behavior, three playback-shaping modes, and uploaded image row waveforms.')
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

	@state()
	private playbackMode: SynthPlaybackMode = 'raw'

	@state()
	private filterAttackMs: number = 40

	@state()
	private filterDecayMs: number = 180

	@state()
	private filterSustainPercent: number = 42

	@state()
	private filterReleaseMs: number = 220

	@state()
	private filterBaseCutoffHz: number = 480

	@state()
	private filterPeakCutoffHz: number = 2800

	@state()
	private filterResonance: number = 6

	private imageWaveformRows: ImageWaveformRow[] = []
	private readonly imageWaveformBank = new ImageWaveformBank()

	private readonly synth = new PrimitiveSynth({
		monophonic: false,
		playbackMode: 'raw',
		filterEnvelopeSettings: {
			attackSeconds: 0.04,
			decaySeconds: 0.18,
			sustainLevel: 0.42,
			releaseSeconds: 0.22,
			baseCutoffHz: 480,
			peakCutoffHz: 2800,
			resonance: 6
		},
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

	@Spec('Switches the playback-shaping mode from the radio selector and rebuilds any held notes so the new routing is heard immediately.')
	private async onPlaybackModeChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement | null
		const nextPlaybackMode = input?.value
		if (nextPlaybackMode !== 'raw' && nextPlaybackMode !== 'cutoff' && nextPlaybackMode !== 'pluck') {
			return
		}
		this.playbackMode = nextPlaybackMode
		this.synth.setPlaybackMode(this.playbackMode)
		this.synth.setFilterEnvelopeSettings(this.createFilterEnvelopeSettings())
		await this.rebuildHeldNotesForPlaybackChange()
	}

	@Spec('Applies one visible filter-setting slider change and forwards the updated cutoff envelope to the synth engine.')
	private onFilterSettingChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement | null
		const nextValue = Number(input?.value ?? '0')
		if (Number.isFinite(nextValue) === false) {
			return
		}
		const settingName = input?.name ?? ''
		if (settingName === 'filter-attack-ms') {
			this.filterAttackMs = nextValue
		}
		if (settingName === 'filter-decay-ms') {
			this.filterDecayMs = nextValue
		}
		if (settingName === 'filter-sustain-percent') {
			this.filterSustainPercent = nextValue
		}
		if (settingName === 'filter-release-ms') {
			this.filterReleaseMs = nextValue
		}
		if (settingName === 'filter-base-cutoff-hz') {
			this.filterBaseCutoffHz = nextValue
		}
		if (settingName === 'filter-peak-cutoff-hz') {
			this.filterPeakCutoffHz = nextValue
		}
		if (settingName === 'filter-resonance') {
			this.filterResonance = nextValue
		}
		this.synth.setFilterEnvelopeSettings(this.createFilterEnvelopeSettings())
	}

	@Spec('Rebuilds any held notes after a playback-mode change so the currently selected keys adopt the new voice routing immediately.')
	private async rebuildHeldNotesForPlaybackChange() {
		const heldPitches = this.qwertyKeyboard.getHeldPitches()
		if (heldPitches.length === 0) {
			this.refreshVisibleStatusText()
			return
		}
		await this.synth.rebuildNotes(heldPitches.map((pitch) => pitch.frequencyHz))
		this.updateSoundingVoiceCount(heldPitches)
		this.refreshVisibleStatusText()
	}

	@Spec('Builds the current filter-envelope settings object from the visible slider state.')
	private createFilterEnvelopeSettings(): FilterEnvelopeSettings {
		return {
			attackSeconds: this.filterAttackMs / 1000,
			decaySeconds: this.filterDecayMs / 1000,
			sustainLevel: this.filterSustainPercent / 100,
			releaseSeconds: this.filterReleaseMs / 1000,
			baseCutoffHz: this.filterBaseCutoffHz,
			peakCutoffHz: Math.max(this.filterPeakCutoffHz, this.filterBaseCutoffHz + 20),
			resonance: this.filterResonance
		}
	}

	@Spec('Maps synth engine state changes to visible keyboard status text that reflects the current voice mode and playback-shaping mode.')
	private onSynthStateChange(state: 'ready' | 'playing' | 'releasing' | 'unsupported') {
		this.updateSoundingVoiceCount()
		if (state === 'ready') {
			this.noteStateLabel = 'Ready to play'
			if (this.playbackMode === 'cutoff') {
				this.noteDetailText = 'Cutoff mode is armed. Newly played notes open their low-pass filter with a visible filter ADSR, then settle back to the sustain cutoff while the key is held.'
				return
			}
			if (this.playbackMode === 'pluck') {
				this.noteDetailText = 'Pluck mode is armed. New notes start bright, then damp quickly toward a softer string-like tone.'
				return
			}
			this.noteDetailText = this.isMonophonic
				? 'Monophonic mode is armed. Hold overlapping mapped keys to let the newest key take over while earlier keys stay available for fallback.'
				: 'Polyphonic mode is armed. Hold several mapped keys together to stack a chord, and release them to let every sounding voice fade cleanly.'
			return
		}

		if (state === 'playing') {
			const activePitch = this.qwertyKeyboard.getActivePitch()
			if (this.playbackMode === 'cutoff') {
				this.noteStateLabel = 'Playing'
				this.noteDetailText = activePitch === null
					? 'The filter ADSR is ready to open and settle the low-pass cutoff on the next played note.'
					: `${activePitch.noteLabel} is playing through the cutoff mode. The filter opens quickly, then settles into its sustain cutoff while the note stays held.`
				return
			}
			if (this.playbackMode === 'pluck') {
				this.noteStateLabel = 'Playing'
				this.noteDetailText = activePitch === null
					? 'The pluck mode is ready with a damped, string-like response.'
					: `${activePitch.noteLabel} is sounding in pluck mode with a bright transient and quick damping toward a softer tone.`
				return
			}
			if (this.isMonophonic) {
				this.noteStateLabel = 'Playing'
				this.noteDetailText = activePitch === null
					? 'The monophonic synth is following the newest mapped key with a single raw voice.'
					: `${activePitch.noteLabel} is leading the monophonic synth. The newest held key controls one voice while earlier held keys wait silently for fallback.`
				return
			}

			this.noteStateLabel = 'Playing'
			this.noteDetailText = activePitch === null
				? 'The polyphonic synth is sounding every currently held mapped key with its own raw voice.'
				: `${this.soundingVoiceCount} sounding voice${this.soundingVoiceCount === 1 ? '' : 's'} ${this.soundingVoiceCount === 1 ? 'is' : 'are'} active in polyphonic mode. ${activePitch.noteLabel} is the newest visible key while earlier held notes keep ringing.`
			return
		}

		if (state === 'releasing') {
			this.noteStateLabel = 'Releasing'
			if (this.playbackMode === 'cutoff') {
				this.noteDetailText = 'All held keys are up, so the filtered voice is fading out while the cutoff closes back toward its base position.'
				return
			}
			if (this.playbackMode === 'pluck') {
				this.noteDetailText = 'All held keys are up, so the pluck voice is fading through its short damped tail.'
				return
			}
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

	@Spec('Refreshes visible status text after a mode or routing change using the synth state already on screen.')
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

	@Spec('Updates the uploaded image preview and image-row waveform bank from one file selection so the synth can switch away from the built-in oscillator shapes.')
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
			this.waveformLabel = this.playbackMode === 'pluck' ? 'Triangle pluck' : 'Sine'
			this.waveformDetailText = 'The selected image could not be decoded into waveform rows, so the synth stayed on its built-in waveform.'
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
			this.waveformLabel = this.playbackMode === 'pluck' ? 'Triangle pluck' : 'Sine'
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

	@Spec('Returns the compact help sentence shown under the smaller monophonic toggle card.')
	private getMonophonicHelpText(): string {
		return this.isMonophonic
			? 'On makes the synth follow only the newest held pitch.'
			: 'Off keeps every unique held pitch sounding polyphonically.'
	}

	@Spec('Returns the visible playback-mode label used in the right-side settings panel and compact summaries.')
	private getPlaybackModeLabel(): string {
		if (this.playbackMode === 'cutoff') {
			return 'Cutoff'
		}
		if (this.playbackMode === 'pluck') {
			return 'Pluck'
		}
		return 'Raw'
	}

	@Spec('Returns the visible envelope summary card text appropriate for the currently selected playback mode.')
	private getEnvelopeSummary(): string {
		if (this.playbackMode === 'cutoff') {
			return `${this.filterAttackMs} ms A · ${this.filterDecayMs} ms D · ${this.filterSustainPercent}% S · ${this.filterReleaseMs} ms R`
		}
		if (this.playbackMode === 'pluck') {
			return 'Fast pluck decay · damped filter'
		}
		return '40 ms attack · 120 ms release'
	}

	@Spec('Renders one visible playback-mode radio option inside the compact selector block.')
	private renderPlaybackModeOption(playbackMode: SynthPlaybackMode, title: string, detail: string): TemplateResult {
		const optionId = `playback-mode-${playbackMode}`
		return html`
			<label class=${`radio-option ${this.playbackMode === playbackMode ? 'radio-option-selected' : ''}`} for=${optionId}>
				<input id=${optionId} class="radio-input" type="radio" name="playback-mode" value=${playbackMode} ?checked=${this.playbackMode === playbackMode} @change=${this.onPlaybackModeChange} />
				<span class="radio-mark" aria-hidden="true"></span>
				<span class="radio-copy">
					<span class="radio-title">${title}</span>
					<span class="radio-detail">${detail}</span>
				</span>
			</label>
		`
	}

	@Spec('Renders one labeled filter slider row for the cutoff playback mode settings panel.')
	private renderFilterSettingSlider(
		inputId: string,
		label: string,
		name: string,
		value: number,
		min: number,
		max: number,
		step: number,
		valueSuffix: string
	): TemplateResult {
		return html`
			<label class="setting-control" for=${inputId}>
				<span class="setting-label-row">
					<span class="status-label">${label}</span>
					<span class="setting-value">${value}${valueSuffix}</span>
				</span>
				<input id=${inputId} class="settings-slider" type="range" name=${name} min=${String(min)} max=${String(max)} step=${String(step)} .value=${String(value)} @input=${this.onFilterSettingChange} />
			</label>
		`
	}

	@Spec('Renders the right-side playback settings panel so cutoff controls appear in the formerly empty area beside the main panel.')
	private renderSoundDesignPanel(): TemplateResult {
		if (this.playbackMode === 'cutoff') {
			return html`
				<section class="sound-design-card" aria-label="Playback settings panel">
					<div class="sound-design-header">
						<div class="status-label">Playback settings</div>
						<div id="playback-mode-value" class="plate-value">${this.getPlaybackModeLabel()}</div>
					</div>
					<div id="playback-settings-mode-copy" class="panel-copy">Filter ADSR + low-pass cutoff shaping for the active waveform.</div>
					<div id="filter-envelope-summary" class="settings-summary">${this.getEnvelopeSummary()}</div>
					<div id="filter-cutoff-summary" class="settings-summary">${this.filterBaseCutoffHz} Hz base · ${Math.max(this.filterPeakCutoffHz, this.filterBaseCutoffHz + 20)} Hz peak · Q ${this.filterResonance.toFixed(1)}</div>
					<div class="settings-grid">
						${this.renderFilterSettingSlider('filter-attack-slider', 'Attack', 'filter-attack-ms', this.filterAttackMs, 0, 1000, 5, ' ms')}
						${this.renderFilterSettingSlider('filter-decay-slider', 'Decay', 'filter-decay-ms', this.filterDecayMs, 0, 2000, 5, ' ms')}
						${this.renderFilterSettingSlider('filter-sustain-slider', 'Sustain', 'filter-sustain-percent', this.filterSustainPercent, 0, 100, 1, '%')}
						${this.renderFilterSettingSlider('filter-release-slider', 'Release', 'filter-release-ms', this.filterReleaseMs, 10, 2500, 5, ' ms')}
						${this.renderFilterSettingSlider('filter-base-cutoff-slider', 'Base cutoff', 'filter-base-cutoff-hz', this.filterBaseCutoffHz, 40, 4000, 10, ' Hz')}
						${this.renderFilterSettingSlider('filter-peak-cutoff-slider', 'Peak cutoff', 'filter-peak-cutoff-hz', this.filterPeakCutoffHz, 80, 12000, 10, ' Hz')}
						${this.renderFilterSettingSlider('filter-resonance-slider', 'Resonance', 'filter-resonance', this.filterResonance, 0.1, 18, 0.1, '')}
					</div>
				</section>
			`
		}

		if (this.playbackMode === 'pluck') {
			return html`
				<section class="sound-design-card" aria-label="Playback settings panel">
					<div class="sound-design-header">
						<div class="status-label">Playback settings</div>
						<div id="playback-mode-value" class="plate-value">${this.getPlaybackModeLabel()}</div>
					</div>
					<div id="playback-settings-mode-copy" class="panel-copy">Pluck mode uses a bright transient, quick damping, and a low-pass settle to approximate a string-like response.</div>
					<div id="playback-settings-empty" class="settings-empty">No extra controls yet. This mode uses a fixed damped-pluck recipe for now.</div>
				</section>
			`
		}

		return html`
			<section class="sound-design-card" aria-label="Playback settings panel">
				<div class="sound-design-header">
					<div class="status-label">Playback settings</div>
					<div id="playback-mode-value" class="plate-value">${this.getPlaybackModeLabel()}</div>
				</div>
				<div id="playback-settings-mode-copy" class="panel-copy">Raw mode plays the current waveform directly with no extra shaping stage.</div>
				<div id="playback-settings-empty" class="settings-empty">No extra settings are needed for raw playback.</div>
			</section>
		`
	}

	@Spec('Builds the synth status cards, uploaded image panel, and the new right-side playback settings panel used by the main application layout.')
	private renderStatusUploadPanel(): TemplateResult {
		return html`
			<section class="status-upload-layout" aria-label="Synth status, uploaded image panel, and playback settings">
				<section class="status-grid" aria-label="Keyboard synth status">
					<div class="status-card"><div class="status-label">Waveform</div><div id="waveform-value" class="status-value">${this.waveformLabel}</div></div>
					<div class="status-card"><div class="status-label">Envelope</div><div id="envelope-value" class="status-value">${this.getEnvelopeSummary()}</div></div>
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
				${this.renderSoundDesignPanel()}
			</section>
		`
	}

	@Spec('Renders the QWERTY keyboard guide, compact monophonic toggle, playback-mode selector, visible synth status cards, uploaded image waveform panel, and right-side sound settings panel.')
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

				<section class="mode-section" aria-label="Synth voice mode and playback mode controls">
					<label class="switch-card switch-card-compact" for="monophonic-toggle">
						<div class="switch-label">Monophonic mode</div>
						<div class="switch-row">
							<div id="monophonic-toggle-value" class="switch-value">${this.isMonophonic ? 'On' : 'Off'}</div>
							<span class="switch-control">
								<input id="monophonic-toggle" class="switch-input" type="checkbox" ?checked=${this.isMonophonic} @change=${this.onMonophonicToggle} />
								<span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
							</span>
						</div>
						<div id="voice-mode-help" class="switch-detail">${this.getMonophonicHelpText()}</div>
					</label>
					<section class="mode-selector-card" aria-label="Playback mode selector">
						<div class="switch-label">Playback mode</div>
						<div class="radio-group" role="radiogroup" aria-label="Playback mode selector">
							${this.renderPlaybackModeOption('raw', 'Raw', 'Play raw')}
							${this.renderPlaybackModeOption('cutoff', 'Cutoff', 'Filter ADSR')}
							${this.renderPlaybackModeOption('pluck', 'Pluck', 'String-style')}
						</div>
					</section>
				</section>

				${this.renderStatusUploadPanel()}
				<section class="detail" id="note-detail-text">${this.noteDetailText}</section>
				<section class="detail" id="waveform-detail-text">${this.waveformDetailText}</section>
			</main>
		`
	}
}
