import './WaveformCycleCrossfader.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '../system/lll.lll'
import { WaveformCycleCrossfader } from './WaveformCycleCrossfader.lll'

@Spec('Verifies seam crossfading for looped single-cycle waveforms.')
export class WaveformCycleCrossfaderTest {
	testType = 'unit'

	@Scenario('0 percent crossfade preserves the original cycle samples')
	static async preservesSamplesWithoutCrossfade(subjectFactory: SubjectFactory<WaveformCycleCrossfader>, scenario?: ScenarioParameter): Promise<{ firstSample: number, lastSample: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const crossfader = new WaveformCycleCrossfader()
		const sourceSamples = [-1, -0.5, 0.5, 1]

		const blendedSamples = crossfader.createCrossfadedCycleSamples(sourceSamples, 0)

		assert(blendedSamples.length === sourceSamples.length, 'Expected 0 percent crossfade to keep the original sample count')
		assert(blendedSamples[0] === sourceSamples[0], 'Expected 0 percent crossfade to preserve the first sample')
		assert(blendedSamples[blendedSamples.length - 1] === sourceSamples[sourceSamples.length - 1], 'Expected 0 percent crossfade to preserve the last sample')
		return { firstSample: blendedSamples[0] ?? 0, lastSample: blendedSamples[blendedSamples.length - 1] ?? 0 }
	}

	@Scenario('positive crossfade rewrites the steady-state loop so every repeated cycle begins at the blended seam')
	static async overlapAddsTailAndHeadSamples(subjectFactory: SubjectFactory<WaveformCycleCrossfader>, scenario?: ScenarioParameter): Promise<{ sampleCount: number, firstSample: number, lastSample: number, repeatedSeamStart: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const crossfader = new WaveformCycleCrossfader()
		const sourceSamples = [0, 1, 2, 3, 10, 11, 12, 13, 20, 21]

		const blendedSamples = crossfader.createCrossfadedCycleSamples(sourceSamples, 0.2)
		const expectedSamples = [20, 1, 2, 3, 10, 11, 12, 13]

		assert(blendedSamples.length === expectedSamples.length, 'Expected the steady-state loop period to shrink by one overlap region')
		assert(blendedSamples.every((sample, index) => sample === (expectedSamples[index] ?? NaN)), 'Expected the steady-state loop period to start at the blended seam before the unchanged middle samples')
		assert(blendedSamples[0] === 20, 'Expected the repeated loop seam to begin with the blended tail-to-head entry sample')
		return {
			sampleCount: blendedSamples.length,
			firstSample: blendedSamples[0] ?? 0,
			lastSample: blendedSamples[blendedSamples.length - 1] ?? 0,
			repeatedSeamStart: blendedSamples[0] ?? 0
		}
	}

	@Scenario('three-cycle preview repeats the same crossfaded loop period and keeps seam markers at one-third boundaries')
	static async shortensPreviewAcrossNeighboringCycleJoins(subjectFactory: SubjectFactory<WaveformCycleCrossfader>, scenario?: ScenarioParameter): Promise<{ previewLength: number, firstSeamRatio: number, secondSeamRatio: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const crossfader = new WaveformCycleCrossfader()
		const sourceSamples = [0, 1, 2, 3, 10, 11, 12, 13, 20, 21]

		const previewSamples = crossfader.createThreeCyclePreviewSamples(sourceSamples, 0.2)
		const seamRatios = crossfader.createThreeCyclePreviewSeamRatios(sourceSamples.length, 0.2)
		const steadyStateSamples = crossfader.createCrossfadedCycleSamples(sourceSamples, 0.2)

		assert(previewSamples.length === steadyStateSamples.length * 3, 'Expected the preview to show three repeated copies of the same playback loop period')
		assert(seamRatios.length === 2, 'Expected the preview to expose two seam markers')
		assert(Math.abs((seamRatios[0] ?? 0) - (1 / 3)) < 0.000001, 'Expected the first seam marker to stay at one third because the preview repeats the steady-state loop period')
		assert(Math.abs((seamRatios[1] ?? 0) - (2 / 3)) < 0.000001, 'Expected the second seam marker to stay at two thirds because the preview repeats the steady-state loop period')
		return { previewLength: previewSamples.length, firstSeamRatio: seamRatios[0] ?? 0, secondSeamRatio: seamRatios[1] ?? 0 }
	}

	@Scenario('preview copies prove the same crossfade applies at every repeated cycle boundary and not only inside one three-cycle visualization')
	static async repeatsTheCrossfadedLoopPeriodAcrossAllVisibleCycles(subjectFactory: SubjectFactory<WaveformCycleCrossfader>, scenario?: ScenarioParameter): Promise<{ cycleLength: number, firstPreviewCycleStart: number, secondPreviewCycleStart: number, thirdPreviewCycleStart: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const crossfader = new WaveformCycleCrossfader()
		const sourceSamples = [0, 1, 2, 3, 10, 11, 12, 13, 20, 21]

		const steadyStateSamples = crossfader.createCrossfadedCycleSamples(sourceSamples, 0.2)
		const previewSamples = crossfader.createThreeCyclePreviewSamples(sourceSamples, 0.2)
		const cycleLength = steadyStateSamples.length
		const secondCycle = previewSamples.slice(cycleLength, cycleLength * 2)
		const thirdCycle = previewSamples.slice(cycleLength * 2, cycleLength * 3)

		assert(previewSamples.slice(0, cycleLength).every((sample, index) => sample === (steadyStateSamples[index] ?? NaN)), 'Expected the first visible preview cycle to equal the playback loop period')
		assert(secondCycle.every((sample, index) => sample === (steadyStateSamples[index] ?? NaN)), 'Expected the second visible preview cycle to equal the same playback loop period')
		assert(thirdCycle.every((sample, index) => sample === (steadyStateSamples[index] ?? NaN)), 'Expected the third visible preview cycle to equal the same playback loop period')
		return {
			cycleLength,
			firstPreviewCycleStart: previewSamples[0] ?? 0,
			secondPreviewCycleStart: secondCycle[0] ?? 0,
			thirdPreviewCycleStart: thirdCycle[0] ?? 0
		}
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
