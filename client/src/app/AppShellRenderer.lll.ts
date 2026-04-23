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
						<div class="guide-card piano-guide-card">
							<div class="guide-label">Upper keyboard</div>
							<div class="guide-subtitle">QWERTY row mapped to C${this.source.keyboardBaseOctave} through E${this.source.keyboardBaseOctave + 1}</div>
							<div id="keyboard-row-top-value" class="piano-guide">${this.renderUpperRowPianoKeyboard()}</div>
						</div>
						<div class="keyboard-guide-octave-controls">
							${this.source.appSoundDesignPanel.renderKeyboardOctaveControls()}
						</div>
						<div class="guide-card piano-guide-card">
							<div class="guide-label">Lower keyboard</div>
							<div class="guide-subtitle">QWERTY row mapped to C${this.source.keyboardBaseOctave + 1} through B${this.source.keyboardBaseOctave + 1}</div>
							<div id="keyboard-row-bottom-value" class="piano-guide">${this.renderLowerRowPianoKeyboard()}</div>
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

	@Spec('Renders the upper mapped QWERTY row as a compact piano keyboard spanning a little over one octave.')
	public renderUpperRowPianoKeyboard(): TemplateResult {
		return this.renderPianoKeyboard([
			{ noteLabel: `C${this.source.keyboardBaseOctave}`, qwertyLabel: 'Q', tone: 'white' },
			{ noteLabel: `C♯${this.source.keyboardBaseOctave}`, qwertyLabel: '2', tone: 'black' },
			{ noteLabel: `D${this.source.keyboardBaseOctave}`, qwertyLabel: 'W', tone: 'white' },
			{ noteLabel: `D♯${this.source.keyboardBaseOctave}`, qwertyLabel: '3', tone: 'black' },
			{ noteLabel: `E${this.source.keyboardBaseOctave}`, qwertyLabel: 'E', tone: 'white' },
			{ noteLabel: `F${this.source.keyboardBaseOctave}`, qwertyLabel: 'R', tone: 'white' },
			{ noteLabel: `F♯${this.source.keyboardBaseOctave}`, qwertyLabel: '5', tone: 'black' },
			{ noteLabel: `G${this.source.keyboardBaseOctave}`, qwertyLabel: 'T', tone: 'white' },
			{ noteLabel: `G♯${this.source.keyboardBaseOctave}`, qwertyLabel: '6', tone: 'black' },
			{ noteLabel: `A${this.source.keyboardBaseOctave}`, qwertyLabel: 'Y', tone: 'white' },
			{ noteLabel: `A♯${this.source.keyboardBaseOctave}`, qwertyLabel: '7', tone: 'black' },
			{ noteLabel: `B${this.source.keyboardBaseOctave}`, qwertyLabel: 'U', tone: 'white' },
			{ noteLabel: `C${this.source.keyboardBaseOctave + 1}`, qwertyLabel: 'I', tone: 'white' },
			{ noteLabel: `C♯${this.source.keyboardBaseOctave + 1}`, qwertyLabel: '9', tone: 'black' },
			{ noteLabel: `D${this.source.keyboardBaseOctave + 1}`, qwertyLabel: 'O', tone: 'white' },
			{ noteLabel: `D♯${this.source.keyboardBaseOctave + 1}`, qwertyLabel: '0', tone: 'black' },
			{ noteLabel: `E${this.source.keyboardBaseOctave + 1}`, qwertyLabel: 'P', tone: 'white' }
		])
	}

	@Spec('Renders the lower mapped QWERTY row as a compact one-octave piano keyboard.')
	public renderLowerRowPianoKeyboard(): TemplateResult {
		return this.renderPianoKeyboard([
			{ noteLabel: `C${this.source.keyboardBaseOctave + 1}`, qwertyLabel: 'Z', tone: 'white' },
			{ noteLabel: `C♯${this.source.keyboardBaseOctave + 1}`, qwertyLabel: 'S', tone: 'black' },
			{ noteLabel: `D${this.source.keyboardBaseOctave + 1}`, qwertyLabel: 'X', tone: 'white' },
			{ noteLabel: `D♯${this.source.keyboardBaseOctave + 1}`, qwertyLabel: 'D', tone: 'black' },
			{ noteLabel: `E${this.source.keyboardBaseOctave + 1}`, qwertyLabel: 'C', tone: 'white' },
			{ noteLabel: `F${this.source.keyboardBaseOctave + 1}`, qwertyLabel: 'V', tone: 'white' },
			{ noteLabel: `F♯${this.source.keyboardBaseOctave + 1}`, qwertyLabel: 'G', tone: 'black' },
			{ noteLabel: `G${this.source.keyboardBaseOctave + 1}`, qwertyLabel: 'B', tone: 'white' },
			{ noteLabel: `G♯${this.source.keyboardBaseOctave + 1}`, qwertyLabel: 'H', tone: 'black' },
			{ noteLabel: `A${this.source.keyboardBaseOctave + 1}`, qwertyLabel: 'N', tone: 'white' },
			{ noteLabel: `A♯${this.source.keyboardBaseOctave + 1}`, qwertyLabel: 'J', tone: 'black' },
			{ noteLabel: `B${this.source.keyboardBaseOctave + 1}`, qwertyLabel: 'M', tone: 'white' }
		])
	}

	@Spec('Renders one compact piano keyboard using labeled white and black keys for the mapped QWERTY guide.')
	public renderPianoKeyboard(keys: Array<{ noteLabel: string, qwertyLabel: string, tone: 'white' | 'black' }>): TemplateResult {
		return html`
			<div class="piano-keyboard" aria-hidden="true">
				${keys.map((key) => html`
					<div class=${`piano-key piano-key-${key.tone}`}>
						<span class="piano-note-label">${key.noteLabel}</span>
						<span class="piano-qwerty-label">${key.qwertyLabel}</span>
					</div>
				`)}
			</div>
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
