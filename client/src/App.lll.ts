import { LitElement, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { Spec } from './system/lll.lll'
import { AppViewStyles } from './AppViewStyles.lll'
import { ImageWaveformBank } from './ImageWaveformBank.lll'
import { ImageWaveformRow } from './ImageWaveformRow.lll'
import { KeyboardPitch } from './KeyboardPitch.lll'
import { PrimitiveSynth } from './PrimitiveSynth.lll'
import { AppSoundDesignPanel } from './app/AppSoundDesignPanel.lll'
import { PianoPointerController } from './app/PianoPointerController.lll'
import { WaveformCycleCrossfader } from './synth/WaveformCycleCrossfader.lll'
import { QwertyKeyboard } from './QwertyKeyboard.lll'
import { EffectsSettings } from './synth/EffectsSettings.lll'
import { FilterEnvelopeSettings } from './synth/FilterEnvelopeSettings.lll'
import { SynthPlaybackMode } from './synth/SynthPlaybackMode.lll'
import { PluckSettings } from './synth/PluckSettings.lll'
import { WaveformRowRandomizer } from './app/WaveformRowRandomizer.lll'
import { MidiInputController } from './app/midi/MidiInputController.lll'
import './ImageWaveformPreview.lll'
import './UploadedImagePreview.lll'
import { AppShellRenderer } from './app/AppShellRenderer.lll'
import { AppControlValueReader } from './app/AppControlValueReader.lll'
import { AppImageWaveformLoader } from './app/AppImageWaveformLoader.lll'
import { AppSynthStatusPresenter } from './app/AppSynthStatusPresenter.lll';

@Spec('Renders the Scanline Synth interface around a playable QWERTY keyboard with switchable mono-poly voice behavior, three playback-shaping modes, and uploaded image row waveforms.')
@customElement('app-root')
export class App extends LitElement {
	private readonly appSynthStatusPresenter = new AppSynthStatusPresenter()
	public readonly appImageWaveformLoader = new AppImageWaveformLoader(this)
	private readonly appControlValueReader = new AppControlValueReader(this)
	private readonly appShellRenderer = new AppShellRenderer(this)
	public readonly appSoundDesignPanel = new AppSoundDesignPanel(this)

	static styles = AppViewStyles.styles
	@state()
	public noteStateLabel: string = 'Ready'
	@state()
	public noteDetailText: string = 'Cutoff mode is armed. Newly played notes open their low-pass filter with a visible filter ADSR, then settle back to the sustain cutoff while the key is held.'
	@state()
	public activeNoteLabel: string = '—'
	@state()
	public activeKeyLabel: string = '—'
	@state()
	public pitchLabel: string = '—'
	@state()
	public triggerCount: number = 0
	@state()
	public keyboardBaseOctave: number = 2
	@state()
	public isMonophonic: boolean = true
	@state()
	public portamentoMs: number = 87
	@state()
	public soundingVoiceCount: number = 0
	@state()
	public uploadedImageUrl: string | null = null

	@state()
	public uploadedImageName: string = 'No image selected'

	@state()
	public waveformLabel: string = 'Sine'

	@state()
	public uploadedPreviewWidthPx: number = 0

	@state()
	public hasCompletedDefaultImageInitialization: boolean = false

	@state()
	public waveformDetailText: string = 'No uploaded image row is active yet.'

	@state()
	public selectedRowIndex: number = 0

	@state()
	public availableRowCount: number = 0

	@state()
	public playbackMode: SynthPlaybackMode = 'cutoff'

	@state()
	public filterAttackMs: number = 40

	@state()
	public filterDecayMs: number = 725

	@state()
	public filterSustainPercent: number = 15

	@state()
	public filterReleaseMs: number = 220

	@state()
	public filterBaseCutoffHz: number = 480

	@state()
	public filterPeakCutoffHz: number = 2600

	@state()
	public filterResonance: number = 13

	@state()
	public chorusMixPercent: number = 43
	@state()
	public chorusFeedbackPercent: number = 25
	@state()
	public chorusDepthMs: number = 10
	@state()
	public delayMixPercent: number = 30
	@state()
	public delayFeedbackPercent: number = 60
	@state()
	public delayTimeMs: number = 260
	@state()
	public waveformCrossfadePercent: number = 10
	@state()
	public waveformRowRandomnessPercent: number = 5
	@state()
	public pluckDampingPercent: number = 58
	@state()
	public pluckBrightnessPercent: number = 72
	@state()
	public pluckNoiseBlendPercent: number = 18

	public imageWaveformRows: ImageWaveformRow[] = []
	public readonly imageWaveformBank = new ImageWaveformBank()
	private readonly waveformCycleCrossfader = new WaveformCycleCrossfader()
	private readonly waveformRowRandomizer = new WaveformRowRandomizer()
	private readonly pianoPointerController = new PianoPointerController({
		pressMappedKey: async (keyLabel) => await this.pressMappedPianoKey(keyLabel),
		releaseMappedKey: async (keyLabel) => await this.releaseMappedPianoKey(keyLabel)
	})

	public readonly synth = new PrimitiveSynth({
		monophonic: true,
		playbackMode: 'cutoff',
		filterEnvelopeSettings: {
			attackSeconds: 0.04,
			decaySeconds: 0.725,
			sustainLevel: 0.15,
			releaseSeconds: 0.22,
			baseCutoffHz: 480,
			peakCutoffHz: 2600,
			resonance: 13
		},
		effectsSettings: {
			chorusMix: 0.43,
			chorusFeedback: 0.25,
			chorusDepthMs: 10,
			delayMix: 0.3,
			delayFeedback: 0.6,
			delayTimeMs: 260
		},
		pluckSettings: {
			damping: 0.58,
			brightness: 0.72,
			noiseBlend: 0.18
		},
		portamentoSeconds: 0.087,
		onStateChange: (state) => this.applySynthStatusState(state)
	})

	public readonly qwertyKeyboard = new QwertyKeyboard({
		baseOctave: this.keyboardBaseOctave,
		pitchReferenceHz: 440
	})

	private readonly midiInputController = new MidiInputController({
		onPlayStateChange: async (playState) => await this.syncMidiChange(playState)
	})

	private readonly onWindowKeyDownListener = (event: KeyboardEvent) => {
		void this.onWindowKeyDown(event)
	}

	private readonly onWindowKeyUpListener = (event: KeyboardEvent) => {
		void this.onWindowKeyUp(event)
	}

	private readonly onWindowPointerUpListener = () => {
		void this.pianoPointerController.releaseActivePointerKey()
	}

	private readonly onWindowPointerCancelListener = () => {
		void this.pianoPointerController.releaseActivePointerKey()
	}

	@Spec('Connects global keyboard and pointer listeners so mapped QWERTY presses and dragged piano-key pointer gestures can control the synth while the app is mounted.')
	connectedCallback() {
		super.connectedCallback()
		window.addEventListener('keydown', this.onWindowKeyDownListener)
		window.addEventListener('keyup', this.onWindowKeyUpListener)
		window.addEventListener('pointerup', this.onWindowPointerUpListener)
		window.addEventListener('pointercancel', this.onWindowPointerCancelListener)
		void this.midiInputController.connect()
		void this.appImageWaveformLoader.loadDefaultSynthImage()
	}

	@Spec('Disconnects global keyboard and pointer listeners, releases any sounding synth voices, and cleans up uploaded preview resources when the app unmounts.')
	disconnectedCallback() {
		window.removeEventListener('keydown', this.onWindowKeyDownListener)
		window.removeEventListener('keyup', this.onWindowKeyUpListener)
		window.removeEventListener('pointerup', this.onWindowPointerUpListener)
		window.removeEventListener('pointercancel', this.onWindowPointerCancelListener)
		void this.midiInputController.disconnect()
		void this.pianoPointerController.releaseActivePointerKey()
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

		await this.applyMergedInputChange(playState.activePitch, playState.didChange, event.type === 'keydown')
	}

	@Spec('Applies one MIDI state change to the synth and visible UI after merging MIDI-held notes with any current keyboard-held notes.')
	private async syncMidiChange(playState: { didChange: boolean, activePitch: KeyboardPitch | null, heldPitches: KeyboardPitch[] }) {
		await this.applyMergedInputChange(playState.activePitch, playState.didChange, playState.didChange)
	}

	@Spec('Applies one merged input update from keyboard or MIDI so all active note sources share the same synth and visible UI flow.')
	private async applyMergedInputChange(activePitchHint: KeyboardPitch | null, didChange: boolean, shouldCountAsNewPress: boolean) {
		const heldPitches = this.getMergedHeldPitches()
		this.updateActivePitchDisplay(this.chooseVisibleActivePitch(activePitchHint))
		if (shouldCountAsNewPress && didChange && activePitchHint !== null) {
			this.triggerCount += 1
			this.randomizeWaveformRowForNewKeyPress()
		}
		await this.synth.syncNotes(heldPitches.map((pitch) => pitch.frequencyHz))
		this.updateSoundingVoiceCount(heldPitches)
	}

	@Spec('Turns monophonic synth mode on or off from the visible switch and reapplies the current held notes immediately.')
	public async onMonophonicToggle(event: Event) {
		const input = event.currentTarget as HTMLInputElement | null
		this.isMonophonic = input?.checked ?? false
		this.synth.setMonophonic(this.isMonophonic)
		const heldPitches = this.getMergedHeldPitches()
		await this.synth.syncNotes(heldPitches.map((pitch) => pitch.frequencyHz))
		this.updateSoundingVoiceCount(heldPitches)
		this.refreshVisibleStatusText()
	}

	@Spec('Applies the visible monophonic portamento control and forwards the glide time to the synth engine in seconds.')
	public onPortamentoInput(event: Event) {
		const input = this.appControlValueReader.readKnobLikeTarget(event)
		const nextValue = Number(input?.value ?? '0')
		if (Number.isFinite(nextValue) === false) {
			return
		}
		this.portamentoMs = Math.max(0, Math.min(1000, nextValue))
		this.synth.setPortamentoSeconds(this.portamentoMs / 1000)
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
		this.synth.setEffectsSettings(this.createEffectsSettings())
		this.synth.setPluckSettings(this.createPluckSettings())
		await this.rebuildHeldNotesForPlaybackChange()
	}

	@Spec('Moves the mapped QWERTY keyboard one octave down or up and immediately refreshes the synth and visible guide text.')
	public async onKeyboardOctaveShift(direction: -1 | 1) {
		this.keyboardBaseOctave = this.qwertyKeyboard.shiftBaseOctave(direction)
		const activePitch = this.qwertyKeyboard.getActivePitch()
		this.updateActivePitchDisplay(activePitch)
		await this.rebuildHeldNotesForPlaybackChange()
	}

	@Spec('Starts one mapped piano key from pointer interaction so on-screen key buttons mirror the same synth behavior as physical keyboard play.')
	public async onPianoKeyPointerDown(keyLabel: string, event: PointerEvent) {
		await this.pianoPointerController.onPointerDown(keyLabel, event)
	}

	@Spec('Starts one mapped piano key when the held pointer drags into that key like a software piano.')
	public async onPianoKeyPointerEnter(keyLabel: string, event: PointerEvent) {
		await this.pianoPointerController.onPointerEnter(keyLabel, event)
	}

	@Spec('Stops one mapped piano key when the held pointer drags out of that key like a software piano.')
	public async onPianoKeyPointerLeave(keyLabel: string) {
		await this.pianoPointerController.onPointerLeave(keyLabel)
	}

	@Spec('Applies one visible filter-setting control change and forwards the updated cutoff envelope to the synth engine.')
	public onFilterSettingChange(event: Event) {
		const input = this.appControlValueReader.readKnobLikeTarget(event)
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

	@Spec('Applies one visible effects control change and forwards the updated chorus and delay settings to the synth engine.')
	public onEffectsSettingChange(event: Event) {
		const input = this.appControlValueReader.readKnobLikeTarget(event)
		const nextValue = Number(input?.value ?? '0')
		if (Number.isFinite(nextValue) === false) {
			return
		}
		const settingName = input?.name ?? ''
		if (settingName === 'chorus-mix-percent') {
			this.chorusMixPercent = nextValue
		}
		if (settingName === 'chorus-feedback-percent') {
			this.chorusFeedbackPercent = nextValue
		}
		if (settingName === 'chorus-depth-ms') {
			this.chorusDepthMs = nextValue
		}
		if (settingName === 'delay-mix-percent') {
			this.delayMixPercent = nextValue
		}
		if (settingName === 'delay-feedback-percent') {
			this.delayFeedbackPercent = nextValue
		}
		if (settingName === 'delay-time-ms') {
			this.delayTimeMs = nextValue
		}
		this.synth.setEffectsSettings(this.createEffectsSettings())
	}

	@Spec('Applies one visible pluck-setting control change and forwards the updated Karplus-Strong settings to the synth engine.')
	public onPluckSettingChange(event: Event) {
		const input = this.appControlValueReader.readKnobLikeTarget(event)
		const nextValue = Number(input?.value ?? '0')
		if (Number.isFinite(nextValue) === false) {
			return
		}
		const settingName = input?.name ?? ''
		if (settingName === 'pluck-damping-percent') {
			this.pluckDampingPercent = nextValue
		}
		if (settingName === 'pluck-brightness-percent') {
			this.pluckBrightnessPercent = nextValue
		}
		if (settingName === 'pluck-noise-blend-percent') {
			this.pluckNoiseBlendPercent = nextValue
		}
		this.synth.setPluckSettings(this.createPluckSettings())
	}

	@Spec('Rebuilds any held notes after a playback-mode change so the currently selected keys adopt the new voice routing immediately.')
	private async rebuildHeldNotesForPlaybackChange() {
		const heldPitches = this.getMergedHeldPitches()
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

	@Spec('Builds the current chorus and delay settings object from the visible slider state.')
	private createEffectsSettings(): EffectsSettings {
		return {
			chorusMix: this.chorusMixPercent / 100,
			chorusFeedback: this.chorusFeedbackPercent / 100,
			chorusDepthMs: this.chorusDepthMs,
			delayMix: this.delayMixPercent / 100,
			delayFeedback: this.delayFeedbackPercent / 100,
			delayTimeMs: this.delayTimeMs
		}
	}

	@Spec('Builds the current pluck settings object from the visible pluck slider state.')
	private createPluckSettings(): PluckSettings {
		return {
			damping: this.pluckDampingPercent / 100,
			brightness: this.pluckBrightnessPercent / 100,
			noiseBlend: this.pluckNoiseBlendPercent / 100
		}
	}
	@Spec('Updates the visible active key, note, and pitch cards to match the latest keyboard-leading pitch.')
	private updateActivePitchDisplay(activePitch: KeyboardPitch | null) {
		if (activePitch === null) {
			this.activeKeyLabel = '—'
			this.activeNoteLabel = '—'
			this.pitchLabel = '—'
			return
		}

		this.activeKeyLabel = activePitch.keyLabel
		this.activeNoteLabel = activePitch.noteLabel
		this.pitchLabel = this.formatPitchValue(activePitch)
	}

	@Spec('Refreshes the visible sounding-voice counter from the synth engine.')
	public updateSoundingVoiceCount(heldPitches: KeyboardPitch[] = this.getMergedHeldPitches()) {
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
			this.applySynthStatusState('playing')
			return
		}
		if (this.noteStateLabel === 'Releasing') {
			this.applySynthStatusState('releasing')
			return
		}
		this.applySynthStatusState('ready')
	}

	@Spec('Applies one synth status state to the visible labels and detail text through the focused presenter.')
	private applySynthStatusState(state: 'ready' | 'playing' | 'releasing' | 'unsupported') {
		this.updateSoundingVoiceCount()
		const statusSnapshot = this.appSynthStatusPresenter.createSynthStatusSnapshot({
			state,
			playbackMode: this.playbackMode,
			isMonophonic: this.isMonophonic,
			soundingVoiceCount: this.soundingVoiceCount,
			activePitch: this.chooseVisibleActivePitch()
		})
		this.noteStateLabel = statusSnapshot.noteStateLabel
		this.noteDetailText = statusSnapshot.noteDetailText
	}

	@Spec('Formats one mapped pitch into the visible frequency card text shown in the app UI.')
	private formatPitchValue(activePitch: KeyboardPitch): string {
		return `${activePitch.frequencyHz.toFixed(2)} Hz`
	}
	@Spec('Selects a default uploaded row near the middle of the image bank so the initial waveform starts around the visual midpoint.')
	public chooseDefaultRowIndex(rows: ImageWaveformRow[]): number {
		if (rows.length <= 1) {
			return 0
		}
		return Math.floor(rows.length / 2)
	}

	@Spec('Applies the currently selected uploaded image row to the synth and refreshes the visible waveform status cards.')
	public applySelectedWaveformRow() {
		const selectedRow = this.imageWaveformRows[this.selectedRowIndex] ?? null
		if (selectedRow === null) {
			this.synth.setWaveformSamples(null)
			this.waveformLabel = this.playbackMode === 'pluck' ? 'Default pluck source' : 'Sine'
			this.waveformDetailText = 'No uploaded image row is active yet.'
			return
		}
		const processedSamples = this.createCrossfadedWaveformSamples(selectedRow.samples)
		this.synth.setWaveformSamples(processedSamples)
		this.waveformLabel = `Row ${this.selectedRowIndex + 1}`
		this.waveformDetailText = `Uploaded waveform row ${this.selectedRowIndex + 1} of ${this.availableRowCount} is active. Loop crossfade ${this.waveformCrossfadePercent}%. Row randomness ${this.waveformRowRandomnessPercent}%. Average brightness ${(selectedRow.averageBrightness * 100).toFixed(1)}%.`
	}

	@Spec('Handles a visible row selection change so users can audition different uploaded image rows as stable waveforms.')
	public onRowSelectionChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement | null
		const nextRowIndex = Number(input?.value ?? '0')
		if (Number.isFinite(nextRowIndex) === false) {
			return
		}
		this.selectedRowIndex = Math.max(0, Math.min(nextRowIndex, Math.max(this.availableRowCount - 1, 0)))
		this.applySelectedWaveformRow()
	}

	@Spec('Tracks the currently rendered uploaded image width so the single-cycle strip can match it directly below the image.')
	public onUploadedImageWidthChange(event: CustomEvent<number>) {
		this.uploadedPreviewWidthPx = Math.max(0, event.detail)
	}

	@Spec('Applies one visible loop-crossfade control change so neighboring waveform cycles blend more smoothly at their seam.')
	public onWaveformCrossfadeChange(event: Event) {
		const input = this.appControlValueReader.readKnobLikeTarget(event)
		const nextValue = Number(input?.value ?? '0')
		if (Number.isFinite(nextValue) === false) {
			return
		}
		this.waveformCrossfadePercent = Math.max(0, Math.min(50, nextValue))
		this.applySelectedWaveformRow()
	}

	@Spec('Applies one visible row-randomness control change so future key presses can jump to nearby uploaded waveform rows.')
	public onWaveformRowRandomnessChange(event: Event) {
		const input = this.appControlValueReader.readKnobLikeTarget(event)
		const nextValue = Number(input?.value ?? '0')
		if (Number.isFinite(nextValue) === false) {
			return
		}
		this.waveformRowRandomnessPercent = Math.max(0, Math.min(10, nextValue))
		this.applySelectedWaveformRow()
	}
	@Spec('Randomizes the active uploaded waveform row around the current row whenever a new playable key press arrives and row randomness is enabled.')
	private randomizeWaveformRowForNewKeyPress() {
		if (this.availableRowCount <= 1 || this.waveformRowRandomnessPercent <= 0) {
			return
		}
		const nextRowIndex = this.waveformRowRandomizer.chooseRandomizedRowIndex(
			this.selectedRowIndex,
			this.availableRowCount,
			this.waveformRowRandomnessPercent,
			Math.random(),
			Math.random()
		)
		if (nextRowIndex === this.selectedRowIndex) {
			return
		}
		this.selectedRowIndex = nextRowIndex
		this.applySelectedWaveformRow()
	}

	@Spec('Builds the steady-state loop period used for playback after the selected waveform seam is converted into a linear overlap-add join.')
	private createCrossfadedWaveformSamples(samples: number[]): number[] {
		return this.waveformCycleCrossfader.createCrossfadedCycleSamples(samples, this.waveformCrossfadePercent / 100)
	}

	@Spec('Builds the visible three-cycle preview samples so two neighboring overlaps shorten the total preview span.')
	public createWaveformPreviewSamples(samples: number[]): number[] {
		return this.waveformCycleCrossfader.createThreeCyclePreviewSamples(samples, this.waveformCrossfadePercent / 100)
	}

	@Spec('Returns the two seam markers for the visible preview after overlap-add shortening is applied between neighboring cycles.')
	public createWaveformPreviewSeamRatios(samples: number[]): number[] {
		return this.waveformCycleCrossfader.createThreeCyclePreviewSeamRatios(samples.length, this.waveformCrossfadePercent / 100)
	}

	@Spec('Releases the current uploaded image object URL when a new preview replaces it or the app unmounts.')
	public revokeUploadedImageUrl() {
		if (this.uploadedImageUrl === null) {
			return
		}
		URL.revokeObjectURL(this.uploadedImageUrl)
		this.uploadedImageUrl = null
	}

	@Spec('Returns the visible portamento value label shown beside the monophonic glide slider.')
	public getPortamentoValueLabel(): string {
		return `${this.portamentoMs} ms`
	}

	@Spec('Returns the visible playback-mode label used in the right-side settings panel and compact summaries.')
	public getPlaybackModeLabel(): string {
		if (this.playbackMode === 'cutoff') {
			return 'Cutoff'
		}
		if (this.playbackMode === 'pluck') {
			return 'Pluck'
		}
		return 'Raw'
	}

	@Spec('Returns the current visible QWERTY guide label for the upper mapped row based on the selected base octave.')
	public getKeyboardUpperRowGuide(): string {
		return `Q 2 W 3 E R 5 T 6 Y 7 U I 9 O 0 P → C${this.keyboardBaseOctave} to E${this.keyboardBaseOctave + 1}`
	}

	@Spec('Returns the current visible QWERTY guide label for the lower mapped row based on the selected base octave.')
	public getKeyboardLowerRowGuide(): string {
		return `Z S X D C V G B H N J M → C${this.keyboardBaseOctave + 1} to B${this.keyboardBaseOctave + 1}`
	}

	@Spec('Returns the visible envelope summary card text appropriate for the currently selected playback mode.')
	public getEnvelopeSummary(): string {
		if (this.playbackMode === 'cutoff') {
			return `${this.filterAttackMs} ms A · ${this.filterDecayMs} ms D · ${this.filterSustainPercent}% S · ${this.filterReleaseMs} ms R`
		}
		if (this.playbackMode === 'pluck') {
			return `${this.pluckDampingPercent}% damping · ${this.pluckBrightnessPercent}% brightness · ${this.pluckNoiseBlendPercent}% noise`
		}
		return '40 ms attack · 120 ms release'
	}

	@Spec('Renders one visible playback-mode radio option inside the compact selector block.')
	public renderPlaybackModeOption(playbackMode: SynthPlaybackMode, title: string, detail: string): TemplateResult {
		return this.appShellRenderer.renderPlaybackModeOption(playbackMode, title, detail)
	}

	@Spec('Returns whether one mapped piano key is currently held so the visible keyboard guide can light active keys for both hardware and pointer play.')
	public isPianoKeyActive(keyLabel: string): boolean {
		return this.qwertyKeyboard.getHeldPitches().some((pitch) => pitch.keyLabel === keyLabel)
	}

	@Spec('Renders the app through the focused shell renderer so the top-level Lit custom element still exposes its visible UI.')
	public render(): TemplateResult {
		return this.appShellRenderer.render()
	}

	@Spec('Presses one mapped piano key using the shared keyboard-state flow so pointer and hardware interactions stay in sync.')
	private async pressMappedPianoKey(keyLabel: string) {
		const keyboardEvent = new KeyboardEvent('keydown', { key: keyLabel, cancelable: true })
		const playState = this.qwertyKeyboard.pressKey(keyLabel)
		await this.syncKeyboardChange(keyboardEvent, playState)
	}

	@Spec('Releases one mapped piano key using the shared keyboard-state flow so pointer and hardware interactions stay in sync.')
	private async releaseMappedPianoKey(keyLabel: string) {
		const keyboardEvent = new KeyboardEvent('keyup', { key: keyLabel, cancelable: true })
		const playState = this.qwertyKeyboard.releaseKey(keyLabel)
		await this.syncKeyboardChange(keyboardEvent, playState)
	}

	@Spec('Returns all held pitches across QWERTY and MIDI input so both sources can drive the same synth voice-selection flow together.')
	private getMergedHeldPitches(): KeyboardPitch[] {
		return [...this.qwertyKeyboard.getHeldPitches(), ...this.midiInputController.getHeldPitches()]
	}

	@Spec('Chooses the visible leading pitch by preferring a fresh input hint and otherwise falling back to the newest held MIDI or keyboard pitch.')
	private chooseVisibleActivePitch(activePitchHint: KeyboardPitch | null = null): KeyboardPitch | null {
		if (activePitchHint !== null) {
			return activePitchHint
		}
		const midiActivePitch = this.midiInputController.getActivePitch()
		if (midiActivePitch !== null) {
			return midiActivePitch
		}
		return this.qwertyKeyboard.getActivePitch()
	}
}
