import { SynthPlaybackMode } from './SynthPlaybackMode.lll'
import { KarplusStrongPluckVoice } from './KarplusStrongPluckVoice.lll'

export type PrimitiveSynthVoice = {
	frequencyHz: number
	gainNode: GainNode
	playbackMode: SynthPlaybackMode
	oscillator: OscillatorNode | null
	filterNode: BiquadFilterNode | null
	pluckVoice: KarplusStrongPluckVoice | null
	modulatorOscillator: OscillatorNode | null
	modulationDepthNode: GainNode | null
}
