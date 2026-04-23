import { Spec } from '@shared/lll.lll'
import { css } from 'lit'

@Spec('Provides the shared status, upload, control-panel, and responsive styles for the Scanline Synth app.')
export class AppControlPanelStyleSheet {
	public static styles = css`
		.status-table-card {
			display: grid;
			padding: 14px 16px;
			border-radius: 18px;
			background:
				linear-gradient(180deg, rgba(255, 247, 234, 0.04), rgba(0, 0, 0, 0.14)),
				linear-gradient(135deg, rgba(80, 62, 49, 0.94), rgba(46, 35, 28, 0.96));
			border: 1px solid rgba(255, 225, 173, 0.12);
			box-shadow:
				inset 0 1px 0 rgba(255, 248, 230, 0.06),
				0 10px 18px rgba(0, 0, 0, 0.18);
		}

		.status-table {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 8px 14px;
		}

		.status-table-row {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: baseline;
			gap: 12px;
			padding: 10px 0;
			border-bottom: 1px solid rgba(255, 225, 173, 0.08);
		}

		.status-table-row-wide {
			grid-column: 1 / -1;
			grid-template-columns: minmax(90px, 110px) minmax(0, 1fr);
			align-items: start;
		}

		.status-table-row:last-child,
		.status-table-row:nth-last-child(2):not(.status-table-row-wide) {
			border-bottom: none;
		}

		.status-value,
		.setting-value {
			color: var(--display-green);
			text-shadow: 0 0 10px rgba(184, 246, 169, 0.12);
		}

		.upload-card {
			gap: 18px;
		}

		.preview-controls {
			display: grid;
			gap: 10px;
			padding: 12px 14px;
			border-radius: 14px;
			background: linear-gradient(180deg, rgba(207, 111, 54, 0.08), rgba(0, 0, 0, 0.08));
			border: 1px solid rgba(221, 157, 90, 0.12);
		}

		.preview-controls-inline {
			height: 100%;
			align-content: start;
		}

		.preview-controls-knob {
			justify-items: center;
			text-align: center;
		}

		.upload-controls {
			display: grid;
			gap: 12px;
		}

		.row-slider {
			width: 100%;
			accent-color: #cf6f36;
		}

		.upload-button {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			padding: 12px 16px;
			border-radius: 12px;
			border: 1px solid rgba(255, 225, 173, 0.2);
			background: linear-gradient(180deg, rgba(207, 111, 54, 0.28), rgba(104, 53, 26, 0.95));
			color: #f8e2b8;
			font-family: 'Orbitron', 'Inter', sans-serif;
			font-size: 0.86rem;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			cursor: pointer;
			width: fit-content;
		}

		.upload-input,
		.radio-input,
		.switch-input {
			display: none;
		}

		.keyboard-octave-button {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			min-height: 96px;
			border-radius: 18px;
			border: 1px solid rgba(109, 214, 117, 0.45);
			background:
				linear-gradient(180deg, rgba(255, 247, 234, 0.04), rgba(0, 0, 0, 0.18)),
				linear-gradient(135deg, rgba(63, 49, 39, 0.98), rgba(38, 29, 23, 0.98));
			box-shadow:
				inset 0 1px 0 rgba(255, 248, 230, 0.05),
				0 0 0 1px rgba(17, 178, 42, 0.22),
				0 10px 18px rgba(0, 0, 0, 0.18);
			color: #19d12f;
			cursor: pointer;
			transition: transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease;
		}

		.keyboard-octave-button:hover,
		.keyboard-octave-button:focus-visible {
			transform: translateY(-1px);
			border-color: rgba(128, 238, 136, 0.7);
			box-shadow:
				inset 0 1px 0 rgba(255, 248, 230, 0.05),
				0 0 0 1px rgba(31, 217, 59, 0.32),
				0 0 20px rgba(25, 209, 47, 0.15),
				0 10px 18px rgba(0, 0, 0, 0.18);
			outline: none;
		}

		.keyboard-octave-symbol {
			font-family: 'Orbitron', 'Inter', sans-serif;
			font-size: 3.6rem;
			line-height: 1;
			font-weight: 700;
			text-shadow: 0 0 14px rgba(25, 209, 47, 0.24);
		}

		.waveform-preview-panel {
			display: grid;
			gap: 12px;
			margin-top: 4px;
			order: 2;
		}

		.selected-image-cycle-strip {
			justify-self: center;
			max-width: 100%;
			margin-top: -2px;
			margin-bottom: 6px;
			order: 1;
		}

		.switch-card {
			gap: 12px;
		}

		.switch-card-compact {
			align-content: start;
			gap: 12px;
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

		.switch-track {
			width: 62px;
			height: 32px;
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
			width: 22px;
			height: 22px;
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
			transform: translateX(30px);
		}

		.switch-setting-control {
			gap: 10px;
			padding: 12px 14px;
			justify-items: center;
		}

		.radio-group {
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 12px;
		}

		.radio-option {
			display: grid;
			grid-template-columns: auto 1fr;
			align-items: center;
			gap: 12px;
			padding: 14px;
			border-radius: 16px;
			border: 1px solid rgba(255, 225, 173, 0.12);
			background: linear-gradient(180deg, rgba(0, 0, 0, 0.12), rgba(255, 255, 255, 0.02));
			cursor: pointer;
			min-height: 84px;
		}

		.radio-option-selected {
			border-color: rgba(221, 157, 90, 0.42);
			box-shadow: inset 0 0 0 1px rgba(221, 157, 90, 0.2), 0 0 16px rgba(207, 111, 54, 0.12);
		}

		.radio-mark {
			width: 16px;
			height: 16px;
			border-radius: 50%;
			border: 1px solid rgba(255, 225, 173, 0.34);
			background: rgba(0, 0, 0, 0.28);
			box-shadow: inset 0 1px 0 rgba(255, 248, 230, 0.05);
		}

		.radio-input:checked + .radio-mark {
			background: radial-gradient(circle at center, #f6e2bf 0 34%, #cf6f36 35% 100%);
			border-color: rgba(255, 225, 173, 0.56);
		}

		.radio-copy,
		.sound-design-header,
		.setting-control {
			display: grid;
			gap: 4px;
		}

		.radio-title {
			color: var(--display-green);
		}

		.radio-detail {
			font-size: 0.86rem;
		}

		.sound-design-card {
			align-content: start;
			min-height: 100%;
		}

		.sound-design-stack {
			display: grid;
			gap: 12px;
			align-content: start;
		}

		.sound-design-card-effects {
			margin-top: -4px;
		}

		.panel-copy,
		.settings-empty,
		.settings-summary {
			padding: 12px 14px;
			border-radius: 14px;
			background: linear-gradient(180deg, rgba(207, 111, 54, 0.1), rgba(0, 0, 0, 0.1));
			border: 1px solid rgba(221, 157, 90, 0.12);
		}

		.settings-grid {
			grid-template-columns: repeat(auto-fit, minmax(158px, 1fr));
			gap: 12px;
		}

		.settings-grid-waveform-inline {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			align-items: stretch;
		}

		.settings-grid-effects {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.setting-control {
			padding: 12px 14px;
			border-radius: 14px;
			background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(0, 0, 0, 0.12));
			border: 1px solid rgba(255, 225, 173, 0.08);
		}

		.setting-control-knob {
			justify-items: center;
			align-content: start;
			text-align: center;
			gap: 10px;
			padding-bottom: 16px;
		}

		.settings-help {
			font-size: 0.8rem;
			line-height: 1.45;
			color: rgba(244, 235, 212, 0.72);
			text-align: center;
		}

		.setting-label-row {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 12px;
			width: 100%;
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

		@media (max-width: 1420px) {
			.status-upload-layout {
				grid-template-columns: repeat(2, minmax(0, 1fr));
			}

			.keyboard-guide {
				grid-template-columns: 1fr;
			}

			.sound-design-card {
				grid-column: 1 / -1;
			}
		}

		@media (max-width: 1080px) {
			.mode-section {
				grid-template-columns: 1fr;
			}

			.radio-group {
				grid-template-columns: 1fr;
			}

			.settings-grid {
				grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
			}

			.settings-grid-waveform-inline {
				grid-template-columns: 1fr;
			}

			.settings-grid-effects {
				grid-template-columns: repeat(3, minmax(0, 1fr));
			}
		}

		@media (max-width: 900px) {
			.status-upload-layout {
				grid-template-columns: 1fr;
			}

			.sound-design-card {
				grid-column: auto;
			}

			.settings-grid {
				grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
			}

			.settings-grid-effects {
				grid-template-columns: repeat(2, minmax(0, 1fr));
			}
		}

		@media (max-width: 760px) {
			header {
				grid-template-columns: 1fr;
			}

			.status-table {
				grid-template-columns: 1fr;
			}

			.status-table-row,
			.status-table-row-wide {
				grid-column: auto;
				grid-template-columns: minmax(0, 1fr);
				gap: 4px;
			}

			.keyboard-octave-button {
				min-height: 78px;
			}

			.settings-grid {
				grid-template-columns: 1fr 1fr;
			}

			.settings-grid-effects {
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
}
