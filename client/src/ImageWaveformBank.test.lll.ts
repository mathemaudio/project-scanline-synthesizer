import './ImageWaveformBank.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '@shared/lll.lll'
import { ImageWaveformBank } from './ImageWaveformBank.lll'

@Spec('Verifies image rows are converted into normalized waveform banks suitable for audio playback.')
export class ImageWaveformBankTest {
	testType = 'unit'

	@Scenario('a bright top row and dark bottom row become distinct normalized waveform rows')
	static async extractsDistinctWaveformRows(subjectFactory: SubjectFactory<ImageWaveformBank>, scenario?: ScenarioParameter): Promise<{ rowCount: number, firstRowPeak: string, secondRowPeak: string, firstRowAverage: string, secondRowAverage: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const bank = new ImageWaveformBank()
		const imageData = new ImageData(
			new Uint8ClampedArray([
				255, 255, 255, 255,	255, 255, 255, 255,
				0, 0, 0, 255,	0, 0, 0, 255
			]),
			2,
			2
		)

		const rows = (bank as unknown as { extractRows: (imageData: ImageData) => Array<{ samples: number[], averageBrightness: number }> }).extractRows(imageData)
		const rowCount = rows.length
		const firstRowPeak = Math.max(...(rows[0]?.samples ?? [0])).toFixed(1)
		const secondRowPeak = Math.max(...(rows[1]?.samples ?? [0])).toFixed(1)
		const firstRowAverage = (rows[0]?.averageBrightness ?? 0).toFixed(1)
		const secondRowAverage = (rows[1]?.averageBrightness ?? 0).toFixed(1)

		assert(rowCount === 2, 'Expected one waveform row per image row')
		assert(firstRowPeak === '0.0', 'Expected a flat bright row to normalize to a centered silent waveform')
		assert(secondRowPeak === '0.0', 'Expected a flat dark row to normalize to a centered silent waveform')
		assert(firstRowAverage === '1.0', 'Expected the bright row average brightness to remain visible')
		assert(secondRowAverage === '0.0', 'Expected the dark row average brightness to remain visible')
		return { rowCount, firstRowPeak, secondRowPeak, firstRowAverage, secondRowAverage }
	}

	@Scenario('a mixed row is normalized across negative and positive sample values')
	static async normalizesMixedRowToAudioRange(subjectFactory: SubjectFactory<ImageWaveformBank>, scenario?: ScenarioParameter): Promise<{ sampleCount: number, minimum: string, maximum: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const bank = new ImageWaveformBank()
		const normalizedSamples = (bank as unknown as { normalizeSamples: (samples: number[]) => number[] }).normalizeSamples([-1, -0.5, 0.5, 1])
		const sampleCount = normalizedSamples.length
		const minimum = Math.min(...normalizedSamples).toFixed(1)
		const maximum = Math.max(...normalizedSamples).toFixed(1)

		assert(sampleCount === 4, 'Expected normalization to preserve the original sample count')
		assert(minimum === '-1.0', 'Expected normalization to span the negative audio range')
		assert(maximum === '1.0', 'Expected normalization to span the positive audio range')
		return { sampleCount, minimum, maximum }
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
