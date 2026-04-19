import { Spec } from '@shared/lll.lll'
import { css } from 'lit';


@Spec("Provides the reusable visual style sheet for the Scanline Synth application shell.")
export class AppStyles {
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
					url('/images/bg70s/2.webp');
				background-size: cover;
				background-position: center;
				background-repeat: no-repeat;
				font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
			}
	
			main {
				width: min(1240px, 100%);
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
			.status-upload-layout,
			.mode-section {
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
			.plate-value {
				line-height: 1.6;
				color: rgba(244, 235, 212, 0.86);
			}
	
			.plate-value {
				font-family: 'Orbitron', 'Inter', sans-serif;
				font-size: 1.05rem;
				letter-spacing: 0.08em;
				color: var(--display-green);
			}
	
			.keyboard-guide,
			.mode-section {
				grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
			}
	
			.guide-card,
			.status-card,
			.switch-card,
			.upload-card {
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
			.switch-value {
				font-family: 'Orbitron', 'Inter', sans-serif;
				font-size: 1rem;
				font-weight: 700;
				letter-spacing: 0.06em;
			}
	
			.guide-value {
				padding-bottom: 14px;
				line-height: 1.7;
			}
	
			.status-upload-layout {
				grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);
				align-items: start;
			}
	
			.status-grid {
				grid-template-columns: repeat(2, minmax(180px, 1fr));
			}
	
			.status-card {
				min-height: 104px;
			}
	
			.status-value {
				color: var(--display-green);
				text-shadow: 0 0 10px rgba(184, 246, 169, 0.12);
			}
	
			.upload-card {
				gap: 16px;
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
	
			.upload-input {
				display: none;
			}
	
	
			.waveform-preview-panel {
				display: grid;
				gap: 10px;
			}
	
			.switch-card {
				gap: 14px;
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
	
			.switch-input {
				position: absolute;
				opacity: 0;
				pointer-events: none;
			}
	
			.switch-track {
				width: 70px;
				height: 36px;
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
				width: 26px;
				height: 26px;
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
				transform: translateX(34px);
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
	
			@media (max-width: 900px) {
				.status-upload-layout {
					grid-template-columns: 1fr;
				}
			}
	
			@media (max-width: 760px) {
				header {
					grid-template-columns: 1fr;
				}
	
				.status-grid {
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
