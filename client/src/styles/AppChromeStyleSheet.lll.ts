import { Spec } from '../system/lll.lll'
import { css } from 'lit'

@Spec('Provides the shared shell, guide, and piano keyboard styles for the Scanline Synth app.')
export class AppChromeStyleSheet {
	public static styles = css`
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
				url('../../public/images/bg70s/2.webp');
			background-size: cover;
			background-position: center;
			background-repeat: no-repeat;
			font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
		}

		main {
			width: min(1860px, 100%);
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
		.status-table,
		.status-upload-layout,
		.mode-section,
		.mode-selector-card,
		.sound-design-card,
		.settings-grid {
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
		.guide-subtitle,
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
		.plate-value,
		.panel-copy,
		.settings-empty,
		.settings-summary,
		.radio-detail {
			line-height: 1.6;
			color: rgba(244, 235, 212, 0.86);
		}

		.plate-value {
			font-family: 'Orbitron', 'Inter', sans-serif;
			font-size: 1.05rem;
			letter-spacing: 0.08em;
			color: var(--display-green);
		}

		.keyboard-guide {
			grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
			align-items: stretch;
			gap: 12px;
		}

		.keyboard-guide-octave-controls {
			display: grid;
			align-items: center;
			justify-items: center;
		}

		.mode-section {
			display: none;
		}

		.guide-card,
		.status-card,
		.switch-card,
		.upload-card,
		.mode-selector-card,
		.sound-design-card {
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
		.switch-value,
		.radio-title,
		.setting-value {
			font-family: 'Orbitron', 'Inter', sans-serif;
			font-size: 1rem;
			font-weight: 700;
			letter-spacing: 0.06em;
		}

		.guide-value {
			padding-bottom: 14px;
			line-height: 1.7;
		}

		.guide-subtitle {
			font-size: 0.82rem;
			letter-spacing: 0.08em;
			color: rgba(244, 235, 212, 0.72);
		}

		.piano-guide-card {
			gap: 12px;
		}

		.piano-guide {
			padding-bottom: 14px;
		}

		.piano-keyboard {
			position: relative;
			min-width: 0;
			overflow: hidden;
			padding: 8px;
			border-radius: 16px;
			background: linear-gradient(180deg, rgba(23, 17, 13, 0.92), rgba(56, 42, 31, 0.86));
			box-shadow: inset 0 1px 0 rgba(255, 248, 230, 0.06);
		}

		.piano-white-keys {
			display: grid;
			grid-template-columns: repeat(var(--white-key-count), minmax(0, 1fr));
			gap: 0;
			align-items: stretch;
		}

		.piano-black-keys {
			position: absolute;
			inset: 8px 8px auto 8px;
			height: 68px;
			pointer-events: none;
		}

		.piano-key {
			display: grid;
			align-content: space-between;
			justify-items: center;
			gap: 6px;
			padding: 8px 4px 7px;
			border-radius: 0 0 11px 11px;
			box-sizing: border-box;
			text-align: center;
			cursor: pointer;
			appearance: none;
			-webkit-appearance: none;
			font: inherit;
			outline: none;
			transition: transform 0.08s ease, filter 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
		}

		.piano-key-white {
			min-height: 98px;
			background: linear-gradient(180deg, rgba(255, 251, 243, 0.98), rgba(223, 207, 179, 0.96));
			border: 1px solid rgba(108, 84, 62, 0.34);
			box-shadow:
				inset 0 1px 0 rgba(255, 255, 255, 0.6),
				inset 0 -10px 18px rgba(168, 130, 86, 0.18);
		}

		.piano-key-white:hover,
		.piano-key-white:focus-visible {
			filter: brightness(1.05);
			box-shadow:
				inset 0 1px 0 rgba(255, 255, 255, 0.72),
				inset 0 -10px 18px rgba(196, 151, 98, 0.24),
				0 0 10px rgba(255, 227, 158, 0.18);
		}

		.piano-key-black {
			position: absolute;
			top: 0;
			width: calc(100% / var(--white-key-count) * 0.54);
			min-height: 68px;
			transform: translateX(-50%);
			padding-top: 6px;
			padding-bottom: 5px;
			border-radius: 0 0 9px 9px;
			background: linear-gradient(180deg, rgba(58, 66, 63, 0.98), rgba(16, 20, 19, 0.98));
			border: 1px solid rgba(0, 0, 0, 0.5);
			box-shadow:
				0 5px 10px rgba(0, 0, 0, 0.32),
				inset 0 1px 0 rgba(203, 224, 212, 0.08);
			z-index: 1;
		}

		.piano-key-black:hover,
		.piano-key-black:focus-visible {
			filter: brightness(1.12);
			box-shadow:
				0 5px 12px rgba(0, 0, 0, 0.36),
				inset 0 1px 0 rgba(226, 246, 236, 0.16),
				0 0 12px rgba(179, 246, 169, 0.12);
		}

		.piano-key-active {
			transform: translateY(1px);
		}

		.piano-key-white.piano-key-active {
			background: linear-gradient(180deg, rgba(255, 252, 245, 1), rgba(236, 216, 170, 0.98));
			box-shadow:
				inset 0 1px 0 rgba(255, 255, 255, 0.75),
				inset 0 -12px 22px rgba(214, 162, 91, 0.28),
				0 0 16px rgba(255, 224, 149, 0.22);
		}

		.piano-key-black.piano-key-active {
			background: linear-gradient(180deg, rgba(86, 104, 97, 1), rgba(26, 34, 31, 1));
			box-shadow:
				0 6px 14px rgba(0, 0, 0, 0.38),
				inset 0 1px 0 rgba(235, 255, 245, 0.18),
				0 0 18px rgba(184, 246, 169, 0.22);
		}

		.piano-note-label,
		.piano-qwerty-label {
			font-family: 'Orbitron', 'Inter', sans-serif;
			line-height: 1.1;
		}

		.piano-note-label {
			font-size: 0.67rem;
			letter-spacing: 0.04em;
		}

		.piano-qwerty-label {
			font-size: 0.82rem;
			font-weight: 700;
			letter-spacing: 0.05em;
		}

		.piano-key-white .piano-note-label,
		.piano-key-white .piano-qwerty-label {
			color: #2a211b;
		}

		.piano-key-black .piano-note-label,
		.piano-key-black .piano-qwerty-label {
			color: rgba(241, 248, 243, 0.96);
		}

		.status-upload-layout {
			grid-template-columns: minmax(250px, 0.62fr) minmax(600px, 1.52fr) minmax(440px, 1.18fr);
			align-items: start;
			margin-top: -4px;
		}

		.status-grid {
			grid-template-columns: minmax(0, 1fr);
			gap: 12px;
		}

		.keyboard-octave-controls {
			display: grid;
			grid-template-columns: repeat(2, minmax(92px, 120px));
			gap: 18px;
			margin-top: 0;
		}
	`
}
