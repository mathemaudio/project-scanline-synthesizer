import { Spec } from '../system/lll.lll'
import type { App } from '../App.lll'

@Spec("Loads default and user-selected synthesizer images into the app waveform state.")
export class AppImageWaveformLoader {
	public static readonly defaultSynthImageUrl: string = `${import.meta.env.BASE_URL}images/karamazov_chart.jpg`
	public static readonly defaultSynthImageName: string = 'karamazov_chart.jpg'

	public constructor(private readonly source: App) {
		Spec('Captures the app instance whose image waveform state this loader coordinates.')
	}

	@Spec('Loads the bundled default synthesizer image so the app starts with one visible image waveform without requiring an upload.')
	public async loadDefaultSynthImage() {
			this.source.hasCompletedDefaultImageInitialization = false
			this.source.revokeUploadedImageUrl()
			this.source.uploadedPreviewWidthPx = 0
			this.source.uploadedImageUrl = AppImageWaveformLoader.defaultSynthImageUrl
			this.source.uploadedImageName = AppImageWaveformLoader.defaultSynthImageName
			try {
				const waveformBank = await this.source.imageWaveformBank.loadFromImageUrl(AppImageWaveformLoader.defaultSynthImageUrl, 'Unable to decode the default synthesizer image')
				this.source.imageWaveformRows = waveformBank.rows
				this.source.availableRowCount = waveformBank.rows.length
				this.source.selectedRowIndex = this.source.chooseDefaultRowIndex(waveformBank.rows)
				this.source.applySelectedWaveformRow()
				this.source.waveformDetailText = `${waveformBank.width} × ${waveformBank.height} image loaded. Row ${this.source.selectedRowIndex + 1} is active for playback. Loop crossfade ${this.source.waveformCrossfadePercent}%.`
			} catch (_error) {
				this.source.imageWaveformRows = []
				this.source.availableRowCount = 0
				this.source.selectedRowIndex = 0
				this.source.synth.setWaveformSamples(null)
				this.source.waveformLabel = this.source.playbackMode === 'pluck' ? 'Default pluck source' : this.source.playbackMode === 'fm' ? 'FM sine carrier' : 'Sine'
				this.source.uploadedImageUrl = null
				this.source.uploadedImageName = 'No image selected'
				this.source.waveformDetailText = 'The default synthesizer image could not be decoded, so the synth stayed on its built-in waveform.'
			} finally {
				this.source.hasCompletedDefaultImageInitialization = true
			}
		}


	@Spec('Updates the uploaded image preview and image-row waveform bank from one file selection so the synth can switch away from the built-in oscillator shapes.')
	public async onImageSelection(event: Event) {
			const input = event.currentTarget as HTMLInputElement | null
			const file = input?.files?.[0] ?? null
			if (file === null) {
				return
			}
			this.source.revokeUploadedImageUrl()
			this.source.uploadedPreviewWidthPx = 0
			this.source.uploadedImageUrl = URL.createObjectURL(file)
			this.source.uploadedImageName = file.name
			try {
				const waveformBank = await this.source.imageWaveformBank.loadFromFile(file)
				this.source.imageWaveformRows = waveformBank.rows
				this.source.availableRowCount = waveformBank.rows.length
				this.source.selectedRowIndex = this.source.chooseDefaultRowIndex(waveformBank.rows)
				this.source.applySelectedWaveformRow()
				this.source.waveformDetailText = `${waveformBank.width} × ${waveformBank.height} image loaded. Row ${this.source.selectedRowIndex + 1} is active for playback. Loop crossfade ${this.source.waveformCrossfadePercent}%.`
			} catch (_error) {
				this.source.imageWaveformRows = []
				this.source.availableRowCount = 0
				this.source.selectedRowIndex = 0
				this.source.synth.setWaveformSamples(null)
				this.source.waveformLabel = this.source.playbackMode === 'pluck' ? 'Default pluck source' : this.source.playbackMode === 'fm' ? 'FM sine carrier' : 'Sine'
				this.source.waveformDetailText = 'The selected image could not be decoded into waveform rows, so the synth stayed on its built-in waveform.'
			}
		}

}
