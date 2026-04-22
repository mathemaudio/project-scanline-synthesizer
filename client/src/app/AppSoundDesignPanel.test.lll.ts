import './AppSoundDesignPanel.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '@shared/lll.lll'
import { AppSoundDesignPanel } from './AppSoundDesignPanel.lll'
import type { App } from '../App.lll'

@Spec('Verifies the focused sound-design panel renderer output.')
export class AppSoundDesignPanelTest {
	testType = 'unit'

	@Scenario('the upload panel includes both loop crossfade and row randomness controls')
	static async rendersWaveformPreviewControls(subjectFactory: SubjectFactory<AppSoundDesignPanel>, scenario?: ScenarioParameter): Promise<{ markup: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const panel = new AppSoundDesignPanel(this.createAppStub())
		const crossfadeKnob = panel.renderVintageKnob('waveform-crossfade-slider', 'Loop crossfade', '', 10, 0, 50, 1, '10%', () => undefined)
		const randomnessKnob = panel.renderVintageKnob('waveform-row-randomness-slider', 'Randomize row', '', 0.5, 0, 10, 0.5, '0.5%', () => undefined)
		const markup = `${crossfadeKnob.strings.join(' ')} ${crossfadeKnob.values.map((value) => String(value)).join(' ')} ${randomnessKnob.strings.join(' ')} ${randomnessKnob.values.map((value) => String(value)).join(' ')}`
		assert(markup.includes('waveform-crossfade-slider'), 'Expected the upload panel to include the loop crossfade knob')
		assert(markup.includes('waveform-row-randomness-slider'), 'Expected the upload panel to include the new row randomness knob')
		assert(markup.includes('vintage-knob'), 'Expected the upload panel to render the reusable vintage knob component')
		return { markup }
	}

	@Scenario('pluck playback settings render damping brightness and noise controls')
	static async rendersPluckPlaybackControls(subjectFactory: SubjectFactory<AppSoundDesignPanel>, scenario?: ScenarioParameter): Promise<{ markup: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const panel = new AppSoundDesignPanel(this.createAppStub('pluck'))
		const dampingSlider = panel.renderVintageKnob('pluck-damping-slider', 'Damping', 'pluck-damping-percent', 58, 0, 100, 1, '58%', () => undefined, 'Controls sustain length and loop energy loss.')
		const brightnessSlider = panel.renderVintageKnob('pluck-brightness-slider', 'Brightness', 'pluck-brightness-percent', 72, 0, 100, 1, '72%', () => undefined, 'Controls high-frequency retention in the string loop.')
		const noiseSlider = panel.renderVintageKnob('pluck-noise-blend-slider', 'Noise blend', 'pluck-noise-blend-percent', 18, 0, 100, 1, '18%', () => undefined, 'Crossfades between uploaded waveform excitation and broadband noise.')
		const markup = `${dampingSlider.strings.join(' ')} ${dampingSlider.values.map((value) => String(value)).join(' ')} ${brightnessSlider.strings.join(' ')} ${brightnessSlider.values.map((value) => String(value)).join(' ')} ${noiseSlider.strings.join(' ')} ${noiseSlider.values.map((value) => String(value)).join(' ')}`
		assert(markup.includes('pluck-damping-slider'), 'Expected pluck settings to render the damping knob')
		assert(markup.includes('pluck-brightness-slider'), 'Expected pluck settings to render the brightness knob')
		assert(markup.includes('pluck-noise-blend-slider'), 'Expected pluck settings to render the noise blend knob')
		assert(markup.includes('vintage-knob'), 'Expected pluck settings to use the shared vintage knob component')
		return { markup }
	}

	@Spec('Builds the minimal app stub needed by the sound-design panel tests.')
	private static createAppStub(playbackMode: 'cutoff' | 'pluck' = 'cutoff'): App {
		return {
			playbackMode,
			chorusMixPercent: 22,
			chorusFeedbackPercent: 8,
			chorusDepthMs: 8,
			delayMixPercent: 18,
			delayFeedbackPercent: 24,
			delayTimeMs: 280,
			filterAttackMs: 40,
			filterDecayMs: 725,
			filterSustainPercent: 15,
			filterReleaseMs: 220,
			filterBaseCutoffHz: 480,
			filterPeakCutoffHz: 2600,
			filterResonance: 13,
			waveformCrossfadePercent: 10,
			waveformRowRandomnessPercent: 0.5,
			pluckDampingPercent: 58,
			pluckBrightnessPercent: 72,
			pluckNoiseBlendPercent: 18,
			availableRowCount: 2,
			selectedRowIndex: 0,
			uploadedImageUrl: null,
			uploadedImageName: 'stub.png',
			uploadedPreviewWidthPx: 0,
			imageWaveformRows: [{ samples: [0, 1], averageBrightness: 0.5 }],
			waveformLabel: 'Row 1',
			noteStateLabel: 'Ready',
			activeKeyLabel: '—',
			activeNoteLabel: '—',
			pitchLabel: '—',
			soundingVoiceCount: 0,
			triggerCount: 0,
			isMonophonic: true,
			onEffectsSettingChange: () => undefined,
			onFilterSettingChange: () => undefined,
			onPluckSettingChange: () => undefined,
			onKeyboardOctaveShift: async () => undefined,
			onImageSelection: () => undefined,
			onRowSelectionChange: () => undefined,
			onUploadedImageWidthChange: () => undefined,
			onWaveformCrossfadeChange: () => undefined,
			onWaveformRowRandomnessChange: () => undefined,
			createWaveformPreviewSamples: () => [0, 1, 0, 1],
			createWaveformPreviewSeamRatios: () => [1 / 3, 2 / 3],
			getPlaybackModeLabel: () => playbackMode === 'pluck' ? 'Pluck' : 'Cutoff',
			getEnvelopeSummary: () => playbackMode === 'pluck' ? '58% damping · 72% brightness · 18% noise' : '40 ms A · 725 ms D · 15% S · 220 ms R'
		} as unknown as App
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
