import type { PrimitiveSynth } from '../PrimitiveSynth.lll'
import { Spec } from '../system/lll.lll'

@Spec('Builds and configures the two-operator FM modulator nodes used by PrimitiveSynth voices while leaving non-FM carrier setup unchanged.')
export class PrimitiveSynthFmVoiceBuilder {
	public constructor(private readonly source: PrimitiveSynth) {
		Spec('Stores the primitive synth instance whose FM ratio, depth, and playback mode this builder reads while wiring modulator nodes.')
	}

	@Spec('Builds one FM modulator oscillator and modulation-depth gain stage for one FM voice while leaving non-FM voices unmodulated.')
	public createFmVoiceNodes(audioContext: AudioContext, oscillator: OscillatorNode, targetFrequencyHz: number, startTime: number, carrierBaseFrequencyHz: number): { modulatorOscillator: OscillatorNode | null, modulationDepthNode: GainNode | null } {
			if (this.source.playbackMode !== 'fm') {
				return { modulatorOscillator: null, modulationDepthNode: null }
			}
			const modulatorOscillator = audioContext.createOscillator()
			modulatorOscillator.type = 'sine'
			modulatorOscillator.frequency.setValueAtTime(Math.max(0.001, targetFrequencyHz * this.source.fmSettings.ratio), startTime)
			const modulationDepthNode = audioContext.createGain()
			modulationDepthNode.gain.setValueAtTime(this.source.fmSettings.depthHz, startTime)
			modulatorOscillator.connect(modulationDepthNode)
			modulationDepthNode.connect(oscillator.frequency)
			oscillator.frequency.setValueAtTime(carrierBaseFrequencyHz, startTime)
			return { modulatorOscillator, modulationDepthNode }
		}

}
