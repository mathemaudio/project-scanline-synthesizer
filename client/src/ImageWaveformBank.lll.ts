import { Spec } from './system/lll.lll'
import { ImageWaveformRow } from './ImageWaveformRow.lll'

@Spec('Builds a bank of normalized single-cycle waveforms by reading image rows through an offscreen canvas.')
export class ImageWaveformBank {
	@Spec('Loads one image file, reads its pixels through a canvas, and returns normalized waveform rows plus image dimensions.')
	async loadFromFile(file: File): Promise<{ rows: ImageWaveformRow[], width: number, height: number }> {
		const imageUrl = URL.createObjectURL(file)
		try {
			return await this.loadFromImageUrl(imageUrl, `Unable to decode image: ${file.name}`)
		} finally {
			URL.revokeObjectURL(imageUrl)
		}
	}

	@Spec('Loads one image URL, reads its pixels through a canvas, and returns normalized waveform rows plus image dimensions.')
	async loadFromImageUrl(imageUrl: string, decodeErrorMessage: string): Promise<{ rows: ImageWaveformRow[], width: number, height: number }> {
		const image = await this.loadImageElement(imageUrl, decodeErrorMessage)
		const width = Math.max(1, Math.floor(image.naturalWidth))
		const height = Math.max(1, Math.floor(image.naturalHeight))
		const canvas = document.createElement('canvas')
		canvas.width = width
		canvas.height = height
		const context = canvas.getContext('2d')
		if (context === null) {
			throw new Error('Canvas 2D context is unavailable')
		}
		context.drawImage(image, 0, 0, width, height)
		const imageData = context.getImageData(0, 0, width, height)
		return {
			rows: this.extractRows(imageData),
			width,
			height
		}
	}

	@Spec('Loads one image URL into an HTML image element and waits until the browser has decoded it.')
	private async loadImageElement(imageUrl: string, decodeErrorMessage: string): Promise<HTMLImageElement> {
		const image = new Image()
		await new Promise<void>((resolve, reject) => {
			image.onload = () => resolve()
			image.onerror = () => reject(new Error(decodeErrorMessage))
			image.src = imageUrl
		})
		return image
	}

	@Spec('Converts every horizontal pixel row into a normalized single-cycle waveform row.')
	private extractRows(imageData: ImageData): ImageWaveformRow[] {
		const rows: ImageWaveformRow[] = []
		for (let rowIndex = 0; rowIndex < imageData.height; rowIndex += 1) {
			rows.push(this.extractRow(imageData, rowIndex))
		}
		return rows
	}

	@Spec('Converts one horizontal image row into centered audio samples with a visible brightness summary.')
	private extractRow(imageData: ImageData, rowIndex: number): ImageWaveformRow {
		const samples: number[] = []
		let brightnessTotal = 0
		for (let columnIndex = 0; columnIndex < imageData.width; columnIndex += 1) {
			const pixelOffset = (rowIndex * imageData.width + columnIndex) * 4
			const red = imageData.data[pixelOffset] ?? 0
			const green = imageData.data[pixelOffset + 1] ?? 0
			const blue = imageData.data[pixelOffset + 2] ?? 0
			const alpha = imageData.data[pixelOffset + 3] ?? 255
			const luminance = this.calculateLuminance(red, green, blue)
			const alphaScale = alpha / 255
			const normalizedBrightness = luminance * alphaScale
			brightnessTotal += normalizedBrightness
			samples.push(normalizedBrightness * 2 - 1)
		}
		return {
			samples: this.normalizeSamples(samples),
			averageBrightness: imageData.width === 0 ? 0 : brightnessTotal / imageData.width
		}
	}

	@Spec('Calculates perceptual luminance from one RGB pixel using browser-friendly coefficients.')
	private calculateLuminance(red: number, green: number, blue: number): number {
		return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255
	}

	@Spec('Recenters and rescales one time-domain waveform so it spans a usable audio range without clipping.')
	private normalizeSamples(samples: number[]): number[] {
		if (samples.length === 0) {
			return [0]
		}
		const average = samples.reduce((sum, sample) => sum + sample, 0) / samples.length
		const centeredSamples = samples.map((sample) => sample - average)
		let peakMagnitude = 0
		for (const sample of centeredSamples) {
			peakMagnitude = Math.max(peakMagnitude, Math.abs(sample))
		}
		if (peakMagnitude <= 0.000001) {
			return centeredSamples.map(() => 0)
		}
		return centeredSamples.map((sample) => sample / peakMagnitude)
	}
}
