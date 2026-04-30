import './AppControlSettingApplier.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '../system/lll.lll'
import { AppControlSettingApplier } from './AppControlSettingApplier.lll'
import type { App } from '../App.lll'

@Spec('Verifies focused control-setting updates routed through the app control-setting applier.')
export class AppControlSettingApplierTest {
	testType = 'unit'

	@Scenario('fm control updates adjust app state and forward normalized FM settings to the synth')
	static async appliesFmControlUpdates(subjectFactory: SubjectFactory<AppControlSettingApplier>, scenario?: ScenarioParameter): Promise<{ fmRatioPercent: number, fmDepthHz: number, forwardedRatio: number, forwardedDepthHz: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const forwardedSettings: Array<{ ratio: number, depthHz: number }> = []
		const app = this.createAppStub((settings) => forwardedSettings.push(settings))
		const applier = new AppControlSettingApplier(app)
		applier.onFmSettingChange(this.createKnobEvent('fm-ratio-percent', '350'))
		applier.onFmSettingChange(this.createKnobEvent('fm-depth-hz', '480'))
		const lastForwardedSettings = forwardedSettings[forwardedSettings.length - 1] ?? { ratio: 0, depthHz: 0 }
		assert(app.fmRatioPercent === 350, 'Expected the FM ratio control to update visible app state')
		assert(app.fmDepthHz === 480, 'Expected the FM depth control to update visible app state')
		assert(Math.abs(lastForwardedSettings.ratio - 3.5) < 0.000001, 'Expected the forwarded FM ratio to normalize percent into a carrier multiple')
		assert(lastForwardedSettings.depthHz === 480, 'Expected the forwarded FM depth to stay in hertz')
		return {
			fmRatioPercent: app.fmRatioPercent,
			fmDepthHz: app.fmDepthHz,
			forwardedRatio: lastForwardedSettings.ratio,
			forwardedDepthHz: lastForwardedSettings.depthHz
		}
	}

	@Spec('Builds a small knob-like event object used by the control-setting applier scenarios.')
	private static createKnobEvent(name: string, value: string): Event {
		return {
			currentTarget: {
				name,
				value
			}
		} as unknown as Event
	}

	@Spec('Builds the minimal app stub needed by the control-setting applier tests.')
	private static createAppStub(onFmSettings: (settings: { ratio: number, depthHz: number }) => void): App {
		return {
			fmRatioPercent: 200,
			fmDepthHz: 120,
			appControlValueReader: {
				readKnobLikeTarget: (event: Event) => event.currentTarget as HTMLInputElement
			},
			synth: {
				setFmSettings: (settings: { ratio: number, depthHz: number }) => onFmSettings(settings),
				setFilterEnvelopeSettings: () => undefined,
				setEffectsSettings: () => undefined,
				setPluckSettings: () => undefined
			},
			createFmSettings: () => ({ ratio: 3.5, depthHz: 480 }),
			createFilterEnvelopeSettings: () => ({ attackSeconds: 0, decaySeconds: 0, sustainLevel: 0, releaseSeconds: 0.01, baseCutoffHz: 40, peakCutoffHz: 60, resonance: 0.1 }),
			createEffectsSettings: () => ({ chorusMix: 0, chorusFeedback: 0, chorusDepthMs: 1, delayMix: 0, delayFeedback: 0, delayTimeMs: 40 }),
			createPluckSettings: () => ({ damping: 0, brightness: 0, noiseBlend: 0 })
		} as unknown as App
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
