import { Spec } from '../system/lll.lll'
import type { PrimitiveSynth } from '../PrimitiveSynth.lll'

@Spec("Owns the shared chorus and delay bus nodes for PrimitiveSynth and refreshes their live routing parameters when effect settings change.")
export class PrimitiveSynthEffectsRouter {
	public constructor(private readonly source: PrimitiveSynth) {
		Spec('Stores the owning synth so the router can reuse its shared audio context, effect settings, and cached bus nodes.')
	}

	@Spec('Ensures one shared chorus send bus exists for the audio context and applies the latest chorus routing values.')
	public ensureChorusInputNode(audioContext: AudioContext): GainNode {
			const existingNode = this.source.chorusInputNodeByAudioContext.get(audioContext)
			if (existingNode !== undefined) {
				return existingNode.inputNode
			}
			const sendNode = audioContext.createGain()
			const wetGainNode = audioContext.createGain()
			const feedbackGainNode = audioContext.createGain()
			const delayNode = audioContext.createDelay(0.05)
			const lfoOscillator = audioContext.createOscillator()
			const lfoDepthNode = audioContext.createGain()
			sendNode.gain.value = this.source.effectsSettings.chorusMix
			wetGainNode.gain.value = 0.7
			feedbackGainNode.gain.value = this.source.effectsSettings.chorusFeedback
			delayNode.delayTime.value = this.source.effectsSettings.chorusDepthMs / 1000
			lfoOscillator.frequency.value = 0.28
			lfoDepthNode.gain.value = this.source.effectsSettings.chorusDepthMs / 2000
			sendNode.connect(delayNode)
			delayNode.connect(wetGainNode)
			wetGainNode.connect(audioContext.destination)
			delayNode.connect(feedbackGainNode)
			feedbackGainNode.connect(sendNode)
			lfoOscillator.connect(lfoDepthNode)
			lfoDepthNode.connect(delayNode.delayTime)
			lfoOscillator.start(audioContext.currentTime)
			this.source.chorusInputNodeByAudioContext.set(audioContext, { inputNode: sendNode, feedbackGainNode, delayNode, lfoDepthNode })
			return sendNode
		}


	@Spec('Ensures one shared delay send bus exists for the audio context and applies the latest delay routing values.')
	public ensureDelayInputNode(audioContext: AudioContext): GainNode {
			const existingNode = this.source.delayInputNodeByAudioContext.get(audioContext)
			if (existingNode !== undefined) {
				return existingNode.inputNode
			}
			const sendNode = audioContext.createGain()
			const wetGainNode = audioContext.createGain()
			const feedbackGainNode = audioContext.createGain()
			const delayNode = audioContext.createDelay(1)
			sendNode.gain.value = this.source.effectsSettings.delayMix
			wetGainNode.gain.value = 0.65
			feedbackGainNode.gain.value = this.source.effectsSettings.delayFeedback
			delayNode.delayTime.value = this.source.effectsSettings.delayTimeMs / 1000
			sendNode.connect(delayNode)
			delayNode.connect(wetGainNode)
			wetGainNode.connect(audioContext.destination)
			delayNode.connect(feedbackGainNode)
			feedbackGainNode.connect(delayNode)
			this.source.delayInputNodeByAudioContext.set(audioContext, { inputNode: sendNode, feedbackGainNode, delayNode })
			return sendNode
		}


	@Spec('Refreshes the shared chorus and delay buses with the latest settings after the visible effects sliders change.')
	public refreshEffectsRouting() {
			if (this.source.audioContext === null) {
				return
			}
			const chorusInputNode = this.source.chorusInputNodeByAudioContext.get(this.source.audioContext)
			if (chorusInputNode !== undefined) {
				chorusInputNode.inputNode.gain.value = this.source.effectsSettings.chorusMix
				chorusInputNode.feedbackGainNode.gain.value = this.source.effectsSettings.chorusFeedback
				chorusInputNode.delayNode.delayTime.value = this.source.effectsSettings.chorusDepthMs / 1000
				chorusInputNode.lfoDepthNode.gain.value = this.source.effectsSettings.chorusDepthMs / 2000
			}
			const delayInputNode = this.source.delayInputNodeByAudioContext.get(this.source.audioContext)
			if (delayInputNode !== undefined) {
				delayInputNode.inputNode.gain.value = this.source.effectsSettings.delayMix
				delayInputNode.feedbackGainNode.gain.value = this.source.effectsSettings.delayFeedback
				delayInputNode.delayNode.delayTime.value = this.source.effectsSettings.delayTimeMs / 1000
			}
		}

}
