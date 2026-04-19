import { Spec } from '@shared/lll.lll'

@Spec('Schedules reusable ADSR curves on Web Audio parameters so the same shape logic can later drive filter or volume envelopes.')
export class AdsrEnvelope {
	@Spec('Applies the attack and decay stages of an ADSR envelope to one audio parameter.')
	scheduleAttackDecay(
		audioParameter: AudioParam,
		options: {
			startTime: number
			startValue: number
			peakValue: number
			sustainValue: number
			attackSeconds: number
			decaySeconds: number
		}
	) {
		const attackEndTime = options.startTime + Math.max(options.attackSeconds, 0)
		const decayEndTime = attackEndTime + Math.max(options.decaySeconds, 0)
		audioParameter.cancelScheduledValues(options.startTime)
		audioParameter.setValueAtTime(options.startValue, options.startTime)
		if (attackEndTime === options.startTime) {
			audioParameter.setValueAtTime(options.peakValue, attackEndTime)
		} else {
			audioParameter.linearRampToValueAtTime(options.peakValue, attackEndTime)
		}
		if (decayEndTime === attackEndTime) {
			audioParameter.setValueAtTime(options.sustainValue, decayEndTime)
			return
		}
		audioParameter.linearRampToValueAtTime(options.sustainValue, decayEndTime)
	}

	@Spec('Applies the release stage of an ADSR envelope to one audio parameter.')
	scheduleRelease(
		audioParameter: AudioParam,
		options: {
			startTime: number
			startValue: number
			endValue: number
			releaseSeconds: number
		}
	) {
		const releaseEndTime = options.startTime + Math.max(options.releaseSeconds, 0)
		audioParameter.cancelScheduledValues(options.startTime)
		audioParameter.setValueAtTime(options.startValue, options.startTime)
		if (releaseEndTime === options.startTime) {
			audioParameter.setValueAtTime(options.endValue, releaseEndTime)
			return
		}
		audioParameter.linearRampToValueAtTime(options.endValue, releaseEndTime)
	}
}
