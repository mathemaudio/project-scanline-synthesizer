import type { App } from '../App.lll'
import { Spec } from '../system/lll.lll'

@Spec('Applies App control-setting changes for filter, effects, pluck, and FM knob input events while keeping UI state and synth settings synchronized.')
export class AppControlSettingApplier {
	public constructor(private readonly source: App) {
		Spec('Stores the app instance whose visible control state and synth settings this applier keeps synchronized.')
	}

	@Spec('Applies one visible effects control change and forwards the updated chorus and delay settings to the synth engine.')
	public onEffectsSettingChange(event: Event) {
			const input = this.source.appControlValueReader.readKnobLikeTarget(event)
			const nextValue = Number(input?.value ?? '0')
			if (Number.isFinite(nextValue) === false) {
				return
			}
			const settingName = input?.name ?? ''
			if (settingName === 'chorus-mix-percent') {
				this.source.chorusMixPercent = nextValue
			}
			if (settingName === 'chorus-feedback-percent') {
				this.source.chorusFeedbackPercent = nextValue
			}
			if (settingName === 'chorus-depth-ms') {
				this.source.chorusDepthMs = nextValue
			}
			if (settingName === 'delay-mix-percent') {
				this.source.delayMixPercent = nextValue
			}
			if (settingName === 'delay-feedback-percent') {
				this.source.delayFeedbackPercent = nextValue
			}
			if (settingName === 'delay-time-ms') {
				this.source.delayTimeMs = nextValue
			}
			this.source.synth.setEffectsSettings(this.source.createEffectsSettings())
		}


	@Spec('Applies one visible filter-setting control change and forwards the updated cutoff envelope to the synth engine.')
	public onFilterSettingChange(event: Event) {
			const input = this.source.appControlValueReader.readKnobLikeTarget(event)
			const nextValue = Number(input?.value ?? '0')
			if (Number.isFinite(nextValue) === false) {
				return
			}
			const settingName = input?.name ?? ''
			if (settingName === 'filter-attack-ms') {
				this.source.filterAttackMs = nextValue
			}
			if (settingName === 'filter-decay-ms') {
				this.source.filterDecayMs = nextValue
			}
			if (settingName === 'filter-sustain-percent') {
				this.source.filterSustainPercent = nextValue
			}
			if (settingName === 'filter-release-ms') {
				this.source.filterReleaseMs = nextValue
			}
			if (settingName === 'filter-base-cutoff-hz') {
				this.source.filterBaseCutoffHz = nextValue
			}
			if (settingName === 'filter-peak-cutoff-hz') {
				this.source.filterPeakCutoffHz = nextValue
			}
			if (settingName === 'filter-resonance') {
				this.source.filterResonance = nextValue
			}
			this.source.synth.setFilterEnvelopeSettings(this.source.createFilterEnvelopeSettings())
		}


	@Spec('Applies one visible pluck-setting control change and forwards the updated Karplus-Strong settings to the synth engine.')
	public onPluckSettingChange(event: Event) {
			const input = this.source.appControlValueReader.readKnobLikeTarget(event)
			const nextValue = Number(input?.value ?? '0')
			if (Number.isFinite(nextValue) === false) {
				return
			}
			const settingName = input?.name ?? ''
			if (settingName === 'pluck-damping-percent') {
				this.source.pluckDampingPercent = nextValue
			}
			if (settingName === 'pluck-brightness-percent') {
				this.source.pluckBrightnessPercent = nextValue
			}
			if (settingName === 'pluck-noise-blend-percent') {
				this.source.pluckNoiseBlendPercent = nextValue
			}
			this.source.synth.setPluckSettings(this.source.createPluckSettings())
		}

	@Spec('Applies one visible FM-setting control change and forwards the updated two-operator ratio and depth settings to the synth engine.')
	public onFmSettingChange(event: Event) {
			const input = this.source.appControlValueReader.readKnobLikeTarget(event)
			const nextValue = Number(input?.value ?? '0')
			if (Number.isFinite(nextValue) === false) {
				return
			}
			const settingName = input?.name ?? ''
			if (settingName === 'fm-ratio-percent') {
				this.source.fmRatioPercent = nextValue
			}
			if (settingName === 'fm-depth-hz') {
				this.source.fmDepthHz = nextValue
			}
			this.source.synth.setFmSettings(this.source.createFmSettings())
		}


}
