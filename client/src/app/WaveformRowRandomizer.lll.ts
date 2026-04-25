import { Spec } from '../system/lll.lll'

@Spec('Chooses a nearby uploaded waveform row jump from the upper half of a configured percentage range around the current row.')
export class WaveformRowRandomizer {
	@Spec('Returns one randomized row index near the current row, using an upper-half percentage range and preserving the chosen jump distance when possible.')
	public chooseRandomizedRowIndex(currentRowIndex: number, rowCount: number, randomnessPercent: number, directionRandomValue: number, distanceRandomValue: number): number {
		if (rowCount <= 1 || randomnessPercent <= 0) {
			return currentRowIndex
		}
		const maxDistance = Math.min(rowCount - 1, Math.ceil((rowCount * randomnessPercent) / 100))
		if (maxDistance <= 0) {
			return currentRowIndex
		}
		const minimumDistance = rowCount > 2 ? 2 : 1
		const minDistance = Math.min(maxDistance, Math.max(minimumDistance, Math.ceil(maxDistance / 2)))
		const distance = minDistance + Math.floor(Math.max(0, Math.min(0.999999, distanceRandomValue)) * (maxDistance - minDistance + 1))
		const canMoveDown = currentRowIndex - distance >= 0
		const canMoveUp = currentRowIndex + distance < rowCount
		if (canMoveDown && canMoveUp) {
			return directionRandomValue < 0.5 ? currentRowIndex - distance : currentRowIndex + distance
		}
		if (canMoveDown) {
			return currentRowIndex - distance
		}
		if (canMoveUp) {
			return currentRowIndex + distance
		}
		return currentRowIndex
	}
}
