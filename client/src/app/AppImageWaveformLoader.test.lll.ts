import './AppImageWaveformLoader.lll'
import { Scenario, ScenarioParameter, Spec, SubjectFactory } from '@shared/lll.lll'
import { AppImageWaveformLoader } from './AppImageWaveformLoader.lll'

@Spec('Verifies the image waveform loader points the synthesizer at the bundled default reference image.')
export class AppImageWaveformLoaderTest {
	testType = 'unit'

	@Scenario('loading the default synthesizer image points the app at karamazov_chart.jpg')
	static async loadsBundledDefaultImage(subjectFactory: SubjectFactory<AppImageWaveformLoader>, scenario?: ScenarioParameter): Promise<{ uploadedImageUrl: string | null, uploadedImageName: string }> {
		void subjectFactory
		const assert: (condition: boolean, message?: string) => asserts condition = scenario?.assert ?? this.failFastAssert
		const appState = this.createStubAppState()
		const loader = new AppImageWaveformLoader(appState as never)

		await loader.loadDefaultSynthImage()

		assert(appState.uploadedImageUrl === AppImageWaveformLoader.defaultSynthImageUrl, 'Expected the bundled Karamazov chart path to become the default synth image URL')
		assert(appState.uploadedImageName === AppImageWaveformLoader.defaultSynthImageName, 'Expected the bundled Karamazov chart file name to be visible by default')
		return { uploadedImageUrl: appState.uploadedImageUrl, uploadedImageName: appState.uploadedImageName }
	}

	@Spec('Creates one small stub app state object that accepts the default image load without needing the full Lit app.')
	private static createStubAppState(): {
		uploadedImageUrl: string | null,
		uploadedImageName: string,
		uploadedPreviewWidthPx: number,
		imageWaveformRows: Array<{ samples: number[], averageBrightness: number }>,
		availableRowCount: number,
		selectedRowIndex: number,
		waveformCrossfadePercent: number,
		waveformDetailText: string,
		waveformLabel: string,
		playbackMode: string,
		imageWaveformBank: { loadFromImageUrl: (imageUrl: string) => Promise<{ rows: Array<{ samples: number[], averageBrightness: number }>, width: number, height: number }> },
		synth: { setWaveformSamples: (_samples: number[] | null) => void },
		revokeUploadedImageUrl: () => void,
		chooseDefaultRowIndex: () => number,
		applySelectedWaveformRow: () => void
	} {
		return {
			uploadedImageUrl: null as string | null,
			uploadedImageName: 'No image selected',
			uploadedPreviewWidthPx: 99,
			imageWaveformRows: [] as Array<{ samples: number[], averageBrightness: number }>,
			availableRowCount: 0,
			selectedRowIndex: 0,
			waveformCrossfadePercent: 10,
			waveformDetailText: '',
			waveformLabel: 'Sine',
			playbackMode: 'cutoff',
			imageWaveformBank: {
				async loadFromImageUrl(imageUrl: string) {
					return {
						rows: [{ samples: [0.25, -0.25], averageBrightness: 0.5 }],
						width: imageUrl === '/images/karamazov_chart.jpg' ? 320 : 0,
						height: 180
					}
				}
			},
			synth: {
				setWaveformSamples: (_samples: number[] | null) => undefined
			},
			revokeUploadedImageUrl() {
				this.uploadedImageUrl = null
			},
			chooseDefaultRowIndex() {
				return 0
			},
			applySelectedWaveformRow() {
				this.waveformLabel = 'Row 1'
			}
		}
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
