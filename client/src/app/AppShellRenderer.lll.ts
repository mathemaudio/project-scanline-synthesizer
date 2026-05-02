import { Spec } from '../system/lll.lll'
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
				<a class="lll-corner-link" href="https://lllts.dev" target="_blank" rel="noreferrer" aria-label="Made with LLL">
					<span class="lll-corner-link-text">made with LLL</span>
				</a>
				<main>
					<header>
						<div class="header-copy">
							<h1>
								<a class="header-link" href="https://github.com/mathemaudio/project-scanline-synthesizer" target="_blank" rel="noreferrer">Scanline Synth</a>
							</h1>
							<p class="lead">
								<a class="header-link" href="https://github.com/mathemaudio/project-scanline-synthesizer" target="_blank" rel="noreferrer">
									Upload an image, turn its horizontal rows into single-cycle waveforms, and keep playing the
									QWERTY keyboard while selecting which row shapes the active timbre.
								</a>
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

	@Spec('Renders one compact piano keyboard using layered white and black key buttons so dragging and hardware play can light the active mapped notes.')
	public renderPianoKeyboard(keys: Array<{ noteLabel: string, qwertyLabel: string, tone: 'white' | 'black' }>): TemplateResult {
		const whiteKeys = keys.filter((key) => key.tone === 'white')
		const blackKeys = this.getBlackKeysWithWhiteIndex(keys)
		return html`
			<div class="piano-keyboard" style=${`--white-key-count: ${whiteKeys.length};`}>
				<div class="piano-white-keys">
					${whiteKeys.map((key) => this.renderPianoKeyButton(key))}
				</div>
				<div class="piano-black-keys">
					${blackKeys.map((key) => this.renderPianoBlackKeyButton(key))}
				</div>
			</div>
		`
	}

	@Spec('Renders one white or black piano key as a real button with active-state classes and pointer drag handlers.')
	private renderPianoKeyButton(key: { noteLabel: string, qwertyLabel: string, tone: 'white' | 'black' }): TemplateResult {
		const isActive = this.source.isPianoKeyActive(key.qwertyLabel)
		return html`
			<button
				type="button"
				class=${`piano-key piano-key-${key.tone} ${isActive ? 'piano-key-active' : ''}`}
				aria-label=${`Play ${key.noteLabel} with ${key.qwertyLabel}`}
				aria-pressed=${isActive ? 'true' : 'false'}
				data-qwerty-key=${key.qwertyLabel}
				@pointerdown=${(event: PointerEvent) => void this.source.onPianoKeyPointerDown(key.qwertyLabel, event)}
				@pointerenter=${(event: PointerEvent) => void this.source.onPianoKeyPointerEnter(key.qwertyLabel, event)}
				@pointerleave=${() => void this.source.onPianoKeyPointerLeave(key.qwertyLabel)}
			>
				<span class="piano-note-label">${key.noteLabel}</span>
				<span class="piano-qwerty-label">${key.qwertyLabel}</span>
			</button>
		`
	}

	@Spec('Renders one black piano key button at the boundary between white keys so the overlay layout remains playable.')
	private renderPianoBlackKeyButton(key: { noteLabel: string, qwertyLabel: string, whiteIndexAfterPreviousWhite: number }): TemplateResult {
		const isActive = this.source.isPianoKeyActive(key.qwertyLabel)
		return html`
			<button
				type="button"
				class=${`piano-key piano-key-black ${isActive ? 'piano-key-active' : ''}`}
				style=${this.getBlackKeyInlineStyle(key.whiteIndexAfterPreviousWhite)}
				aria-label=${`Play ${key.noteLabel} with ${key.qwertyLabel}`}
				aria-pressed=${isActive ? 'true' : 'false'}
				data-qwerty-key=${key.qwertyLabel}
				@pointerdown=${(event: PointerEvent) => void this.source.onPianoKeyPointerDown(key.qwertyLabel, event)}
				@pointerenter=${(event: PointerEvent) => void this.source.onPianoKeyPointerEnter(key.qwertyLabel, event)}
				@pointerleave=${() => void this.source.onPianoKeyPointerLeave(key.qwertyLabel)}
			>
				<span class="piano-note-label">${key.noteLabel}</span>
				<span class="piano-qwerty-label">${key.qwertyLabel}</span>
			</button>
		`
	}

	@Spec('Collects black keys with the index of the white-key boundary they should straddle in the layered piano layout.')
	private getBlackKeysWithWhiteIndex(keys: Array<{ noteLabel: string, qwertyLabel: string, tone: 'white' | 'black' }>): Array<{ noteLabel: string, qwertyLabel: string, whiteIndexAfterPreviousWhite: number }> {
		let whiteKeyCount = 0
		return keys.flatMap((key) => {
			if (key.tone === 'white') {
				whiteKeyCount += 1
				return []
			}
			return [{
				noteLabel: key.noteLabel,
				qwertyLabel: key.qwertyLabel,
				whiteIndexAfterPreviousWhite: whiteKeyCount
			}]
		})
	}

	@Spec('Builds the inline position for one black key so it centers over the seam between adjacent white keys.')
	private getBlackKeyInlineStyle(whiteIndexAfterPreviousWhite: number): string {
		return `left: calc((100% / var(--white-key-count)) * ${whiteIndexAfterPreviousWhite});`
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
