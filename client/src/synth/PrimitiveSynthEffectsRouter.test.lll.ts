import './PrimitiveSynthEffectsRouter.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '../system/lll.lll'
import { PrimitiveSynthEffectsRouter } from './PrimitiveSynthEffectsRouter.lll'

@Spec('Verifies the shared effects router refreshes existing chorus and delay buses with live parameter values from its owning synth.')
export class PrimitiveSynthEffectsRouterTest {
	testType = 'unit'

	@Scenario('refreshing effect routing updates cached chorus and delay node parameters')
	static async refreshesCachedEffectNodes(subjectFactory: SubjectFactory<PrimitiveSynthEffectsRouter>, scenario?: ScenarioParameter): Promise<{ chorusMix: number, chorusFeedback: number, chorusDelaySeconds: number, chorusDepthGain: number, delayMix: number, delayFeedback: number, delayTimeSeconds: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const chorusInputNode = { gain: { value: 0.12 } }
		const chorusFeedbackGainNode = { gain: { value: 0.07 } }
		const chorusDelayNode = { delayTime: { value: 0.008 } }
		const chorusDepthNode = { gain: { value: 0.004 } }
		const delayInputNode = { gain: { value: 0.18 } }
		const delayFeedbackGainNode = { gain: { value: 0.24 } }
		const delayNode = { delayTime: { value: 0.28 } }
		const audioContext = {} as AudioContext
		const owner = {
			audioContext,
			effectsSettings: {
				chorusMix: 0.46,
				chorusFeedback: 0.35,
				chorusDepthMs: 19,
				delayMix: 0.31,
				delayFeedback: 0.57,
				delayTimeMs: 720
			},
			chorusInputNodeByAudioContext: new WeakMap<AudioContext, { inputNode: { gain: { value: number } }, feedbackGainNode: { gain: { value: number } }, delayNode: { delayTime: { value: number } }, lfoDepthNode: { gain: { value: number } } }>(),
			delayInputNodeByAudioContext: new WeakMap<AudioContext, { inputNode: { gain: { value: number } }, feedbackGainNode: { gain: { value: number } }, delayNode: { delayTime: { value: number } } }>()
		}
		owner.chorusInputNodeByAudioContext.set(audioContext, { inputNode: chorusInputNode, feedbackGainNode: chorusFeedbackGainNode, delayNode: chorusDelayNode, lfoDepthNode: chorusDepthNode })
		owner.delayInputNodeByAudioContext.set(audioContext, { inputNode: delayInputNode, feedbackGainNode: delayFeedbackGainNode, delayNode })
		const router = new PrimitiveSynthEffectsRouter(owner as never)
		router.refreshEffectsRouting()
		const chorusMix = chorusInputNode.gain.value
		const chorusFeedback = chorusFeedbackGainNode.gain.value
		const chorusDelaySeconds = chorusDelayNode.delayTime.value
		const chorusDepthGain = chorusDepthNode.gain.value
		const delayMix = delayInputNode.gain.value
		const delayFeedback = delayFeedbackGainNode.gain.value
		const delayTimeSeconds = delayNode.delayTime.value
		assert(Math.abs(chorusMix - 0.46) < 0.000001, 'Expected chorus mix refresh to update the cached chorus input gain')
		assert(Math.abs(chorusFeedback - 0.35) < 0.000001, 'Expected chorus feedback refresh to update the cached chorus feedback gain')
		assert(Math.abs(chorusDelaySeconds - 0.019) < 0.000001, 'Expected chorus depth refresh to update the cached chorus delay time in seconds')
		assert(Math.abs(chorusDepthGain - 0.0095) < 0.000001, 'Expected chorus depth refresh to update the cached chorus LFO gain in seconds')
		assert(Math.abs(delayMix - 0.31) < 0.000001, 'Expected delay mix refresh to update the cached delay input gain')
		assert(Math.abs(delayFeedback - 0.57) < 0.000001, 'Expected delay feedback refresh to update the cached delay feedback gain')
		assert(Math.abs(delayTimeSeconds - 0.72) < 0.000001, 'Expected delay time refresh to update the cached delay node time in seconds')
		return { chorusMix, chorusFeedback, chorusDelaySeconds, chorusDepthGain, delayMix, delayFeedback, delayTimeSeconds }
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
