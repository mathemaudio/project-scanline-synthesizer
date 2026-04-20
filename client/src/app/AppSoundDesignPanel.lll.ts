import { Spec } from '@shared/lll.lll'
import { html, type TemplateResult } from 'lit'
import type { App } from '../App.lll'

@Spec('Builds the playback settings and always-on effects panels for Scanline Synth.')
export class AppSoundDesignPanel {
	private readonly source: App

	public constructor(source: App) {
		Spec('Stores the app source reference used to render and route playback settings controls.')
		this.source = source
	}

	@Spec('Renders one labeled effects slider row for the chorus and delay controls shown in the always-on effects panel.')
	public renderEffectsSettingSlider(inputId: string, label: string, name: string, value: number, min: number, max: number, step: number, valueSuffix: string): TemplateResult {
			return html`
				<label class="setting-control" for=${inputId}>
					<span class="setting-label-row"><span class="status-label">${label}</span><span class="setting-value">${value}${valueSuffix}</span></span>
					<input id=${inputId} class="settings-slider" type="range" name=${name} min=${String(min)} max=${String(max)} step=${String(step)} .value=${String(value)} @input=${this.source.onEffectsSettingChange} />
				</label>
			`
		}


	@Spec('Renders one labeled filter slider row for the cutoff playback mode settings panel.')
	public renderFilterSettingSlider(inputId: string, label: string, name: string, value: number, min: number, max: number, step: number, valueSuffix: string): TemplateResult {
			return html`
				<label class="setting-control" for=${inputId}>
					<span class="setting-label-row">
						<span class="status-label">${label}</span>
						<span class="setting-value">${value}${valueSuffix}</span>
					</span>
					<input id=${inputId} class="settings-slider" type="range" name=${name} min=${String(min)} max=${String(max)} step=${String(step)} .value=${String(value)} @input=${this.source.onFilterSettingChange} />
				</label>
			`
		}


	@Spec('Renders the right-side playback settings panel followed by an always-on effects panel below it.')
	public renderSoundDesignPanel(): TemplateResult {
			return html`
				${this.renderPlaybackSettingsPanel()}
				<section class="sound-design-card" aria-label="Effects settings panel">
					<div class="sound-design-header">
						<div class="status-label">Effects</div>
						<div id="effects-panel-value" class="plate-value">Always on</div>
					</div>
					<div id="effects-settings-mode-copy" class="panel-copy">Chorus and delay are applied across raw, cutoff, and pluck playback with one shared always-on effects block.</div>
					<div id="effects-chorus-summary" class="settings-summary">Chorus · ${this.source.chorusMixPercent}% mix · ${this.source.chorusFeedbackPercent}% feedback · ${this.source.chorusDepthMs} ms depth</div>
					<div id="effects-delay-summary" class="settings-summary">Delay · ${this.source.delayMixPercent}% mix · ${this.source.delayFeedbackPercent}% feedback · ${this.source.delayTimeMs} ms time</div>
					<div class="settings-grid">
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
						<div id="playback-settings-mode-copy" class="panel-copy">Pluck mode uses a bright transient, quick damping, and a low-pass settle to approximate a string-like response.</div>
						<div id="playback-settings-empty" class="settings-empty">No extra controls yet. This mode uses a fixed damped-pluck recipe for now.</div>
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

	@Spec('Builds the synth status cards, uploaded image panel, and the new right-side playback settings panel used by the main application layout.')
	public renderStatusUploadPanel(): TemplateResult {
			return html`
				<section class="status-upload-layout" aria-label="Synth status, uploaded image panel, and playback settings">
					<section class="status-grid" aria-label="Keyboard synth status">
						<div class="status-card"><div class="status-label">Waveform</div><div id="waveform-value" class="status-value">${this.source.waveformLabel}</div></div>
						<div class="status-card"><div class="status-label">Envelope</div><div id="envelope-value" class="status-value">${this.source.getEnvelopeSummary()}</div></div>
						<div class="status-card"><div class="status-label">Voice mode</div><div id="voice-mode-value" class="status-value">${this.source.isMonophonic ? 'Monophonic' : 'Polyphonic'}</div></div>
						<div class="status-card"><div class="status-label">Sounding voices</div><div id="sounding-voices-value" class="status-value">${this.source.soundingVoiceCount}</div></div>
						<div class="status-card"><div class="status-label">Active key</div><div id="active-key-value" class="status-value">${this.source.activeKeyLabel}</div></div>
						<div class="status-card"><div class="status-label">Active note</div><div id="active-note-value" class="status-value">${this.source.activeNoteLabel}</div></div>
						<div class="status-card"><div class="status-label">Pitch</div><div id="pitch-value" class="status-value">${this.source.pitchLabel}</div></div>
						<div class="status-card"><div class="status-label">Note state</div><div id="note-state-value" class="status-value">${this.source.noteStateLabel}</div></div>
						<div class="status-card"><div class="status-label">Trigger count</div><div id="trigger-count-value" class="status-value">${this.source.triggerCount}</div></div>
					</section>
					<section class="upload-card" aria-label="Image upload panel">
						<div class="status-label">Reference image</div>
						<label class="upload-button" for="image-upload-input">Upload image</label>
						<input id="image-upload-input" class="upload-input" type="file" accept="image/*" @change=${this.source.onImageSelection} />
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
							<div class="preview-controls">
								<div class="status-label">Loop crossfade</div>
								<input id="waveform-crossfade-slider" class="row-slider" type="range" min="0" max="50" step="1" .value=${String(this.source.waveformCrossfadePercent)} @input=${this.source.onWaveformCrossfadeChange} />
								<div id="waveform-crossfade-value" class="plate-value">${this.source.waveformCrossfadePercent}% seam overlap</div>
							</div>
						</div>
						<div class="selected-image-cycle-strip" style=${this.source.uploadedPreviewWidthPx > 0 ? `width: ${this.source.uploadedPreviewWidthPx}px;` : 'width: 100%;'}>
							<image-waveform-preview id="selected-image-cycle-preview" class="image-cycle-preview-plain" .samples=${this.source.imageWaveformRows[this.source.selectedRowIndex]?.samples ?? []} .seamRatios=${[]} previewLabel=${''} .cycleCount=${1} .rowIndex=${-1} .rowCount=${0}></image-waveform-preview>
						</div>
					</section>
					${this.source.appSoundDesignPanel.renderSoundDesignPanel()}
				</section>
			`
		}


}
