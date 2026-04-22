import { Spec } from '@shared/lll.lll'
import { html, type TemplateResult } from 'lit'
import type { App } from '../App.lll'
import type { SynthPlaybackMode } from '../synth/SynthPlaybackMode.lll'
import './VintageKnob.lll'

@Spec('Builds the top-level Scanline Synth shell markup around the app state and delegated panel renderer.')
export class AppShellRenderer {
	private readonly source: App

	public constructor(source: App) {
		Spec('Stores the app source reference used to render the top-level shell and playback mode options.')
		this.source = source
	}

	@Spec('Renders the QWERTY keyboard guide, compact monophonic toggle, playback-mode selector, visible synth status cards, uploaded image waveform panel, and right-side sound settings panel.')
	public render(): TemplateResult {
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
							<div id="keyboard-row-top-value" class="guide-value">${this.source.getKeyboardUpperRowGuide()}</div>
						</div>
						<div class="guide-card">
							<div class="guide-label">Lower row</div>
							<div id="keyboard-row-bottom-value" class="guide-value">${this.source.getKeyboardLowerRowGuide()}</div>
						</div>
					</section>
	
					<section class="mode-section" aria-label="Synth voice mode and playback mode controls">
						<section class="switch-card switch-card-compact" aria-label="Monophonic mode card">
							<div class="switch-label">Monophonic mode</div>
							<div class="switch-row">
								<div id="monophonic-toggle-value" class="switch-value">${this.source.isMonophonic ? 'On' : 'Off'}</div>
								<label class="switch-control" for="monophonic-toggle">
									<input id="monophonic-toggle" class="switch-input" type="checkbox" ?checked=${this.source.isMonophonic} @change=${this.source.onMonophonicToggle} />
									<span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
								</label>
							</div>
							<div class="setting-control setting-control-knob switch-setting-control">
								<div class="setting-label-row">
									<div class="switch-label">Portamento</div>
								</div>
								<vintage-knob id="portamento-slider" name="portamento-ms" .min=${0} .max=${1000} .step=${1} .value=${String(this.source.portamentoMs)} value-text=${this.source.getPortamentoValueLabel()} @input=${this.source.onPortamentoInput}></vintage-knob>
							</div>
						</section>
						<section class="mode-selector-card" aria-label="Playback mode selector">
							<div class="switch-label">Playback mode</div>
							<div class="radio-group" role="radiogroup" aria-label="Playback mode selector">
								${this.source.renderPlaybackModeOption('raw', 'Raw', 'Play raw')}
								${this.source.renderPlaybackModeOption('cutoff', 'Cutoff', 'Filter ADSR')}
								${this.source.renderPlaybackModeOption('pluck', 'Pluck', 'String-style')}
							</div>
						</section>
					</section>
	
					${this.source.appSoundDesignPanel.renderStatusUploadPanel()}
				</main>
			`
		}

	@Spec('Renders one visible playback-mode radio option inside the compact selector block.')
	public renderPlaybackModeOption(playbackMode: SynthPlaybackMode, title: string, detail: string): TemplateResult {
		const optionId = `playback-mode-${playbackMode}`
		return html`
			<label class=${`radio-option ${this.source.playbackMode === playbackMode ? 'radio-option-selected' : ''}`} for=${optionId}>
				<input id=${optionId} class="radio-input" type="radio" name="playback-mode" value=${playbackMode} ?checked=${this.source.playbackMode === playbackMode} @change=${this.source['onPlaybackModeChange']} />
				<span class="radio-mark" aria-hidden="true"></span>
				<span class="radio-copy">
					<span class="radio-title">${title}</span>
					<span class="radio-detail">${detail}</span>
				</span>
			</label>
		`
	}
}
