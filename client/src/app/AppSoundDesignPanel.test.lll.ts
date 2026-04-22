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
		const template = panel.renderStatusUploadPanel()
		const markup = template.strings.join(' ')
		assert(markup.includes('waveform-crossfade-slider'), 'Expected the upload panel to include the loop crossfade slider')
		assert(markup.includes('waveform-row-randomness-slider'), 'Expected the upload panel to include the new row randomness slider')
		return { markup }
	}

	@Spec('Builds the minimal app stub needed by the sound-design panel tests.')
	private static createAppStub(): App {
		return {
			playbackMode: 'cutoff',
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
			onKeyboardOctaveShift: async () => undefined,
			onImageSelection: () => undefined,
			onRowSelectionChange: () => undefined,
			onUploadedImageWidthChange: () => undefined,
			onWaveformCrossfadeChange: () => undefined,
			onWaveformRowRandomnessChange: () => undefined,
			createWaveformPreviewSamples: () => [0, 1, 0, 1],
			createWaveformPreviewSeamRatios: () => [1 / 3, 2 / 3],
			getPlaybackModeLabel: () => 'Cutoff',
			getEnvelopeSummary: () => '40 ms A · 725 ms D · 15% S · 220 ms R'
		} as unknown as App
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
