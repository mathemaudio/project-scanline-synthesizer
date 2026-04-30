import './AppSoundDesignPanel.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '../system/lll.lll'
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
		const waveformControls = panel.renderWaveformPlaybackControls()
		const markup = `${waveformControls.strings.join(' ')} ${waveformControls.values.map((value) => String(value)).join(' ')}`
		assert(markup.includes('Waveform playback'), 'Expected the upload panel to keep the waveform playback heading')
		assert(markup.includes('Row shaping'), 'Expected the upload panel to keep the row shaping summary label')
		return { markup }
	}

	@Scenario('fm playback settings render ratio and depth controls')
	static async rendersFmPlaybackControls(subjectFactory: SubjectFactory<AppSoundDesignPanel>, scenario?: ScenarioParameter): Promise<{ markup: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const panel = new AppSoundDesignPanel(this.createAppStub('fm'))
		const playbackPanel = panel.renderPlaybackSettingsPanel()
		const markup = `${playbackPanel.strings.join(' ')} ${playbackPanel.values.map((value) => String(value)).join(' ')}`
		assert(markup.includes('FM mode uses a sine modulator to bend the pitch of the current carrier'), 'Expected FM playback copy to describe the new two-operator path')
		assert(markup.includes('fm-settings-summary'), 'Expected the FM settings summary region to render in FM mode')
		assert(playbackPanel.values.length >= 7, 'Expected the FM panel to expose nested values for its mode options and knob controls')
		return { markup }
	}

	@Scenario('pluck playback settings render damping brightness and noise controls')
	static async rendersPluckPlaybackControls(subjectFactory: SubjectFactory<AppSoundDesignPanel>, scenario?: ScenarioParameter): Promise<{ markup: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const panel = new AppSoundDesignPanel(this.createAppStub('pluck'))
		const playbackPanel = panel.renderPlaybackSettingsPanel()
		const markup = `${playbackPanel.strings.join(' ')} ${playbackPanel.values.map((value) => String(value)).join(' ')}`
		assert(markup.includes('Playback mode'), 'Expected the playback settings panel to include the inline playback mode selector heading')
		assert(markup.includes('Playback settings'), 'Expected the playback settings panel to keep the playback settings heading')
		assert(markup.includes('Pluck mode now runs a Karplus–Strong string loop per note'), 'Expected pluck playback copy to remain visible in the panel')
		return { markup }
	}

	@Scenario('multi-word knob labels render as a stable two-line label while single words stay on one line')
	static async rendersStableKnobLabelBreaks(subjectFactory: SubjectFactory<AppSoundDesignPanel>, scenario?: ScenarioParameter): Promise<{ markup: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const panel = new AppSoundDesignPanel(this.createAppStub())
		const multiWordKnob = panel.renderVintageKnob('delay-time-slider', 'Delay time', 'delay-time-ms', 260, 40, 900, 5, '260 ms', () => undefined)
		const singleWordKnob = panel.renderVintageKnob('attack-slider', 'Attack', 'attack-ms', 40, 0, 1000, 5, '40 ms', () => undefined)
		const markup = `${multiWordKnob.strings.join(' ')} ${multiWordKnob.values.map((value) => String(value)).join(' ')} ${singleWordKnob.strings.join(' ')} ${singleWordKnob.values.map((value) => String(value)).join(' ')}`
		const multiWordValues = multiWordKnob.values.map((value) => String(value)).join(' ')
		assert(markup.includes('setting-label-row-stacked'), 'Expected multi-word knob labels to use the stacked label-row class')
		assert(markup.includes('delay-time-slider'), 'Expected the multi-word knob markup to preserve the knob id')
		assert(multiWordValues.includes('[object Object]'), 'Expected the multi-word knob label to render through a nested template result')
		assert(markup.includes('Attack'), 'Expected single-word knob labels to remain renderable without forced stacking')
		return { markup }
	}

	@Spec('Builds the minimal app stub needed by the sound-design panel tests.')
	private static createAppStub(playbackMode: 'cutoff' | 'fm' | 'pluck' = 'cutoff'): App {
		return {
			playbackMode,
			portamentoMs: 87,
			chorusMixPercent: 43,
			chorusFeedbackPercent: 25,
			chorusDepthMs: 10,
			delayMixPercent: 30,
			delayFeedbackPercent: 60,
			delayTimeMs: 260,
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
			pluckNoiseBlendPercent: 0,
			fmRatioPercent: 200,
			fmDepthHz: 120,
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
			onMonophonicToggle: () => undefined,
			onPortamentoInput: () => undefined,
			onEffectsSettingChange: () => undefined,
			onFilterSettingChange: () => undefined,
			onPluckSettingChange: () => undefined,
			onFmSettingChange: () => undefined,
			onKeyboardOctaveShift: async () => undefined,
			onImageSelection: () => undefined,
			onRowSelectionChange: () => undefined,
			onUploadedImageWidthChange: () => undefined,
			onWaveformCrossfadeChange: () => undefined,
			onWaveformRowRandomnessChange: () => undefined,
			createWaveformPreviewSamples: () => [0, 1, 0, 1],
			createWaveformPreviewSeamRatios: () => [1 / 3, 2 / 3],
			getPlaybackModeLabel: () => playbackMode === 'pluck' ? 'Pluck' : playbackMode === 'fm' ? 'FM' : 'Cutoff',
			getPortamentoValueLabel: () => '87 ms',
			renderPlaybackModeOption: () => ({ strings: ['option Playback mode'], values: [] } as unknown),
			getEnvelopeSummary: () => playbackMode === 'pluck' ? '58% damping · 72% brightness · 0% noise' : playbackMode === 'fm' ? '2.00× ratio · 120 Hz depth' : '40 ms A · 725 ms D · 15% S · 220 ms R'
		} as unknown as App
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
