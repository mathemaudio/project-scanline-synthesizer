import { Spec } from '@shared/lll.lll'
import { html, type TemplateResult } from 'lit'
import type { App } from '../App.lll'
import './VintageKnob.lll'

@Spec('Builds the playback settings and always-on effects panels for Scanline Synth.')
export class AppSoundDesignPanel {
	private readonly source: App

	public constructor(source: App) {
		Spec('Stores the app source reference used to render and route playback settings controls.')
		this.source = source
	}

	@Spec('Renders one compact labeled effects knob for the chorus and delay controls shown in the always-on effects panel.')
	public renderEffectsSettingSlider(inputId: string, label: string, name: string, value: number, min: number, max: number, step: number, valueSuffix: string): TemplateResult {
		return this.renderVintageKnob(inputId, label, name, value, min, max, step, `${value}${valueSuffix}`, this.source.onEffectsSettingChange)
	}

	@Spec('Renders one compact labeled filter knob for the cutoff playback mode settings panel.')
	public renderFilterSettingSlider(inputId: string, label: string, name: string, value: number, min: number, max: number, step: number, valueSuffix: string): TemplateResult {
		return this.renderVintageKnob(inputId, label, name, value, min, max, step, `${value}${valueSuffix}`, this.source.onFilterSettingChange)
	}

	@Spec('Renders one compact labeled pluck knob for the Karplus-Strong playback mode settings panel.')
	public renderPluckSettingSlider(inputId: string, label: string, name: string, value: number, detail: string): TemplateResult {
		return html`
			${this.renderVintageKnob(inputId, label, name, value, 0, 100, 1, `${value}%`, this.source.onPluckSettingChange, detail)}
		`
	}

	@Spec('Renders one shared vintage knob card with label value text and optional supporting help copy.')
	public renderVintageKnob(inputId: string, label: string, name: string, value: number, min: number, max: number, step: number, valueText: string, onInput: (event: Event) => void, detail: string = ''): TemplateResult {
		return html`
			<label class="setting-control setting-control-knob" for=${inputId}>
				<span class="setting-label-row"><span class="status-label">${label}</span></span>
				<vintage-knob id=${inputId} name=${name} .min=${min} .max=${max} .step=${step} .value=${String(value)} value-text=${valueText} @input=${onInput}></vintage-knob>
				${detail.length > 0 ? html`<span class="settings-help">${detail}</span>` : html``}
			</label>
		`
	}

	@Spec('Renders the two compact octave shift buttons placed at the lower-left corner of the status column.')
	public renderKeyboardOctaveControls(): TemplateResult {
		return html`
			<section class="keyboard-octave-controls" aria-label="Keyboard octave controls">
				<button id="keyboard-octave-down-button" class="keyboard-octave-button" type="button" aria-label="Move keyboard down one octave" @click=${() => void this.source.onKeyboardOctaveShift(-1)}>
					<span class="keyboard-octave-symbol" aria-hidden="true">↓</span>
				</button>
				<button id="keyboard-octave-up-button" class="keyboard-octave-button" type="button" aria-label="Move keyboard up one octave" @click=${() => void this.source.onKeyboardOctaveShift(1)}>
					<span class="keyboard-octave-symbol" aria-hidden="true">↑</span>
				</button>
			</section>
		`
	}

	@Spec('Renders the always-on effects card used in the left status column beneath the synth status table.')
	public renderEffectsPanel(): TemplateResult {
		return html`
				<section class="sound-design-card sound-design-card-effects" aria-label="Effects settings panel">
					<div class="sound-design-header">
						<div class="status-label">Effects</div>
						<div id="effects-panel-value" class="plate-value">Always on</div>
					</div>
					<div class="settings-grid settings-grid-effects">
						${this.renderEffectsSettingSlider('chorus-mix-slider', 'Chorus mix', 'chorus-mix-percent', this.source.chorusMixPercent, 0, 80, 1, '%')}
						${this.renderEffectsSettingSlider('chorus-feedback-slider', 'Chorus feedback', 'chorus-feedback-percent', this.source.chorusFeedbackPercent, 0, 75, 1, '%')}
						${this.renderEffectsSettingSlider('chorus-depth-slider', 'Chorus depth', 'chorus-depth-ms', this.source.chorusDepthMs, 1, 30, 1, ' ms')}
						${this.renderEffectsSettingSlider('delay-mix-slider', 'Delay mix', 'delay-mix-percent', this.source.delayMixPercent, 0, 80, 1, '%')}
						${this.renderEffectsSettingSlider('delay-feedback-slider', 'Delay feedback', 'delay-feedback-percent', this.source.delayFeedbackPercent, 0, 85, 1, '%')}
						${this.renderEffectsSettingSlider('delay-time-slider', 'Delay time', 'delay-time-ms', this.source.delayTimeMs, 40, 900, 5, ' ms')}
					</div>
				</section>
			`
	}

	@Spec('Renders the waveform crossfade and row-randomness controls together in one compact horizontal strip below the playback settings card.')
	public renderWaveformPlaybackControls(): TemplateResult {
		return html`
			<section class="sound-design-card sound-design-card-waveform" aria-label="Waveform playback controls panel">
				<div class="sound-design-header">
					<div class="status-label">Waveform playback</div>
					<div class="plate-value">Row shaping</div>
				</div>
				<div class="settings-grid settings-grid-waveform-inline">
					<div class="preview-controls preview-controls-knob preview-controls-inline">
						${this.renderVintageKnob('waveform-crossfade-slider', 'Loop crossfade', '', this.source.waveformCrossfadePercent, 0, 50, 1, `${this.source.waveformCrossfadePercent}%`, this.source.onWaveformCrossfadeChange)}
						<div id="waveform-crossfade-value" class="plate-value">${this.source.waveformCrossfadePercent}% seam overlap</div>
					</div>
					<div class="preview-controls preview-controls-knob preview-controls-inline">
						${this.renderVintageKnob('waveform-row-randomness-slider', 'Randomize row', '', this.source.waveformRowRandomnessPercent, 0, 10, 0.5, `${this.source.waveformRowRandomnessPercent}%`, this.source.onWaveformRowRandomnessChange)}
						<div id="waveform-row-randomness-value" class="plate-value">${this.source.waveformRowRandomnessPercent}% nearby row range</div>
					</div>
				</div>
			</section>
		`
	}

	@Spec('Renders only the playback settings card that corresponds to the currently selected raw, cutoff, or pluck mode.')
	public renderPlaybackSettingsPanel(): TemplateResult {
		if (this.source.playbackMode === 'cutoff') {
			return html`
					<section class="sound-design-card" aria-label="Playback settings panel">
						<div class="sound-design-header">
							<div class="status-label">Playback settings</div>
							<div id="playback-mode-value" class="plate-value">${this.source.getPlaybackModeLabel()}</div>
						</div>
						<div id="playback-settings-mode-copy" class="panel-copy">Filter ADSR + low-pass cutoff shaping for the active waveform.</div>
						<div id="filter-envelope-summary" class="settings-summary">${this.source.getEnvelopeSummary()}</div>
						<div id="filter-cutoff-summary" class="settings-summary">${this.source.filterBaseCutoffHz} Hz base · ${Math.max(this.source.filterPeakCutoffHz, this.source.filterBaseCutoffHz + 20)} Hz peak · Q ${this.source.filterResonance.toFixed(1)}</div>
						<div class="settings-grid">
							${this.renderFilterSettingSlider('filter-attack-slider', 'Attack', 'filter-attack-ms', this.source.filterAttackMs, 0, 1000, 5, ' ms')}
							${this.renderFilterSettingSlider('filter-decay-slider', 'Decay', 'filter-decay-ms', this.source.filterDecayMs, 0, 2000, 5, ' ms')}
							${this.renderFilterSettingSlider('filter-sustain-slider', 'Sustain', 'filter-sustain-percent', this.source.filterSustainPercent, 0, 100, 1, '%')}
							${this.renderFilterSettingSlider('filter-release-slider', 'Release', 'filter-release-ms', this.source.filterReleaseMs, 10, 2500, 5, ' ms')}
							${this.renderFilterSettingSlider('filter-base-cutoff-slider', 'Base cutoff', 'filter-base-cutoff-hz', this.source.filterBaseCutoffHz, 40, 4000, 10, ' Hz')}
							${this.renderFilterSettingSlider('filter-peak-cutoff-slider', 'Peak cutoff', 'filter-peak-cutoff-hz', this.source.filterPeakCutoffHz, 80, 12000, 10, ' Hz')}
							${this.renderFilterSettingSlider('filter-resonance-slider', 'Resonance', 'filter-resonance', this.source.filterResonance, 0.1, 18, 0.1, '')}
						</div>
					</section>
				`
		}

		if (this.source.playbackMode === 'pluck') {
			return html`
					<section class="sound-design-card" aria-label="Playback settings panel">
						<div class="sound-design-header">
							<div class="status-label">Playback settings</div>
							<div id="playback-mode-value" class="plate-value">${this.source.getPlaybackModeLabel()}</div>
						</div>
						<div id="playback-settings-mode-copy" class="panel-copy">Pluck mode now runs a Karplus–Strong string loop per note, using the uploaded waveform row as excitation and blending in noise when desired.</div>
						<div id="pluck-settings-summary" class="settings-summary">${this.source.getEnvelopeSummary()}</div>
						<div class="settings-grid">
							${this.renderPluckSettingSlider('pluck-damping-slider', 'Damping', 'pluck-damping-percent', this.source.pluckDampingPercent, 'Controls sustain length and loop energy loss.')}
							${this.renderPluckSettingSlider('pluck-brightness-slider', 'Brightness', 'pluck-brightness-percent', this.source.pluckBrightnessPercent, 'Controls high-frequency retention in the string loop.')}
							${this.renderPluckSettingSlider('pluck-noise-blend-slider', 'Noise blend', 'pluck-noise-blend-percent', this.source.pluckNoiseBlendPercent, 'Crossfades between uploaded waveform excitation and broadband noise.')}
						</div>
					</section>
				`
		}

		return html`
				<section class="sound-design-card" aria-label="Playback settings panel">
					<div class="sound-design-header">
						<div class="status-label">Playback settings</div>
						<div id="playback-mode-value" class="plate-value">${this.source.getPlaybackModeLabel()}</div>
					</div>
					<div id="playback-settings-mode-copy" class="panel-copy">Raw mode plays the current waveform directly with no extra shaping stage.</div>
					<div id="playback-settings-empty" class="settings-empty">No extra settings are needed for raw playback.</div>
				</section>
			`
	}

	@Spec('Builds the synth status table, effects panel, uploaded image panel, and right-side playback settings panel used by the main application layout.')
	public renderStatusUploadPanel(): TemplateResult {
		return html`
				<section class="status-upload-layout" aria-label="Synth status, uploaded image panel, and playback settings">
					<section class="status-grid" aria-label="Keyboard synth status">
						<div class="status-table-card">
							<div class="status-table">
								<div class="status-table-row status-table-row-wide"><div class="status-label">Envelope</div><div id="envelope-value" class="status-value">${this.source.getEnvelopeSummary()}</div></div>
								<div class="status-table-row"><div class="status-label">Voice</div><div id="voice-mode-value" class="status-value">${this.source.isMonophonic ? 'Mono' : 'Poly'}</div></div>
								<div class="status-table-row"><div class="status-label">Voices</div><div id="sounding-voices-value" class="status-value">${this.source.soundingVoiceCount}</div></div>
								<div class="status-table-row"><div class="status-label">Key</div><div id="active-key-value" class="status-value">${this.source.activeKeyLabel}</div></div>
								<div class="status-table-row"><div class="status-label">Note</div><div id="active-note-value" class="status-value">${this.source.activeNoteLabel}</div></div>
								<div class="status-table-row"><div class="status-label">Pitch</div><div id="pitch-value" class="status-value">${this.source.pitchLabel}</div></div>
								<div class="status-table-row"><div class="status-label">State</div><div id="note-state-value" class="status-value">${this.source.noteStateLabel}</div></div>
								<div class="status-table-row"><div class="status-label">Hits</div><div id="trigger-count-value" class="status-value">${this.source.triggerCount}</div></div>
								<div class="status-table-row"><div class="status-label">Row</div><div id="waveform-value" class="status-value">${this.source.waveformLabel}</div></div>
							</div>
						</div>
						${this.renderEffectsPanel()}
						${this.renderKeyboardOctaveControls()}
					</section>
					<section class="upload-card" aria-label="Image upload panel">
						<div class="status-label">Reference image</div>
						<label class="upload-button" for="image-upload-input">Upload image</label>
						<input id="image-upload-input" class="upload-input" type="file" accept="image/*" @change=${this.source.appImageWaveformLoader.onImageSelection.bind(this.source.appImageWaveformLoader)} />
						<div class="plate-value" id="uploaded-image-name">${this.source.uploadedImageName}</div>
						<div class="upload-controls">
							<div class="status-label">Waveform row select</div>
							<input id="waveform-row-slider" class="row-slider" type="range" min="0" max=${Math.max(this.source.availableRowCount - 1, 0)} .value=${String(this.source.selectedRowIndex)} ?disabled=${this.source.availableRowCount <= 1} @input=${this.source.onRowSelectionChange} />
							<div id="waveform-row-value" class="plate-value">${this.source.availableRowCount === 0 ? 'No rows loaded' : `Row ${this.source.selectedRowIndex + 1} of ${this.source.availableRowCount}`}</div>
						</div>
						<uploaded-image-preview id="uploaded-image-preview" .imageUrl=${this.source.uploadedImageUrl} .imageName=${this.source.uploadedImageName} .selectedRowIndex=${this.source.selectedRowIndex} .rowCount=${this.source.availableRowCount} @rendered-image-width-change=${this.source.onUploadedImageWidthChange}></uploaded-image-preview>
						<div class="waveform-preview-panel">
							<div class="status-label">Selected waveform</div>
							<image-waveform-preview id="selected-waveform-preview" .samples=${this.source.createWaveformPreviewSamples(this.source.imageWaveformRows[this.source.selectedRowIndex]?.samples ?? [])} .seamRatios=${this.source.createWaveformPreviewSeamRatios(this.source.imageWaveformRows[this.source.selectedRowIndex]?.samples ?? [])} previewLabel=${`Selected waveform preview · ${this.source.waveformCrossfadePercent}% loop crossfade`} .rowIndex=${this.source.availableRowCount === 0 ? -1 : this.source.selectedRowIndex} .rowCount=${this.source.availableRowCount}></image-waveform-preview>
						</div>
						<div class="selected-image-cycle-strip" style=${this.source.uploadedPreviewWidthPx > 0 ? `width: ${this.source.uploadedPreviewWidthPx}px;` : 'width: 100%;'}>
							<image-waveform-preview id="selected-image-cycle-preview" class="image-cycle-preview-plain" .samples=${this.source.imageWaveformRows[this.source.selectedRowIndex]?.samples ?? []} .seamRatios=${[]} previewLabel=${''} .cycleCount=${1} .rowIndex=${-1} .rowCount=${0}></image-waveform-preview>
						</div>
					</section>
					<section class="sound-design-stack" aria-label="Playback settings and waveform controls">
						${this.renderPlaybackSettingsPanel()}
						${this.renderWaveformPlaybackControls()}
					</section>
				</section>
			`
	}
}
