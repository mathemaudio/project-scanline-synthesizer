import { Spec } from '../system/lll.lll'

@Spec('Builds linear overlap-add joins between repeated waveform cycles without reshaping each cycle internally.')
export class WaveformCycleCrossfader {
	@Spec('Returns one steady-state loop period whose own repeated seam already includes the previous-tail and next-head overlap-add blend.')
	createCrossfadedCycleSamples(samples: number[], crossfadeRatio: number): number[] {
		if (samples.length <= 1) {
			return [...samples]
		}
		const overlapSampleCount = this.calculateOverlapSampleCount(samples.length, crossfadeRatio)
		if (overlapSampleCount === 0) {
			return [...samples]
		}
		return [
			...this.createOverlapSamples(samples, overlapSampleCount),
			...samples.slice(overlapSampleCount, samples.length - overlapSampleCount)
		]
	}

	@Spec('Builds a visible three-cycle preview by repeating the same already-crossfaded steady-state loop period that playback uses.')
	createThreeCyclePreviewSamples(samples: number[], crossfadeRatio: number): number[] {
		const crossfadedCycleSamples = this.createCrossfadedCycleSamples(samples, crossfadeRatio)
		if (crossfadedCycleSamples.length === 0) {
			return []
		}
		return [
			...crossfadedCycleSamples,
			...crossfadedCycleSamples,
			...crossfadedCycleSamples
		]
	}

	@Spec('Returns the two normalized seam locations for the visible three-period preview of the repeated playback waveform.')
	createThreeCyclePreviewSeamRatios(sampleCount: number, crossfadeRatio: number): number[] {
		void sampleCount
		void crossfadeRatio
		return [1 / 3, 2 / 3]
	}

	@Spec('Builds one overlap region by linearly fading the outgoing tail down while linearly fading the incoming head up.')
	private createOverlapSamples(samples: number[], overlapSampleCount: number): number[] {
		const overlappedSamples: number[] = []
		for (let overlapIndex = 0; overlapIndex < overlapSampleCount; overlapIndex += 1) {
			const headSample = samples[overlapIndex] ?? 0
			const tailSample = samples[samples.length - overlapSampleCount + overlapIndex] ?? 0
			const fadeInWeight = this.calculateLinearFadeInWeight(overlapIndex, overlapSampleCount)
			const fadeOutWeight = 1 - fadeInWeight
			overlappedSamples.push(tailSample * fadeOutWeight + headSample * fadeInWeight)
		}
		return overlappedSamples
	}

	@Spec('Calculates one linear fade-in weight for a sample inside the overlap region.')
	private calculateLinearFadeInWeight(overlapIndex: number, overlapSampleCount: number): number {
		if (overlapSampleCount <= 1) {
			return 0.5
		}
		return overlapIndex / (overlapSampleCount - 1)
	}

	@Spec('Converts one normalized overlap ratio into the count of samples that should be blended at the waveform seam.')
	private calculateOverlapSampleCount(sampleCount: number, crossfadeRatio: number): number {
		const clampedRatio = Math.max(0, Math.min(0.5, crossfadeRatio))
		if (sampleCount <= 1 || clampedRatio <= 0) {
			return 0
		}
		return Math.max(1, Math.min(Math.floor(sampleCount / 2), Math.round(sampleCount * clampedRatio)))
	}
}
