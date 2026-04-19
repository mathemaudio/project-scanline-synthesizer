import './AdsrEnvelope.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '@shared/lll.lll'
import { AdsrEnvelope } from './AdsrEnvelope.lll'

@Spec('Verifies reusable ADSR scheduling for attack-decay and release automation on audio parameters.')
export class AdsrEnvelopeTest {
	testType = 'unit'

	@Scenario('attack and decay scheduling writes the expected ordered automation points')
	static async schedulesAttackDecaySteps(subjectFactory: SubjectFactory<AdsrEnvelope>, scenario?: ScenarioParameter): Promise<{ operations: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const envelope = new AdsrEnvelope()
		const operations: string[] = []
		const audioParameter = this.createRecordingAudioParam(operations)

		envelope.scheduleAttackDecay(audioParameter, {
			startTime: 1.5,
			startValue: 200,
			peakValue: 2200,
			sustainValue: 900,
			attackSeconds: 0.05,
			decaySeconds: 0.2
		})

		const joinedOperations = operations.join(' | ')
		assert(joinedOperations === 'cancel@1.5 | set:200@1.5 | ramp:2200@1.55 | ramp:900@1.75', 'Expected attack-decay scheduling to cancel old automation, set the starting value, then ramp to peak and sustain')
		return { operations: joinedOperations }
	}

	@Scenario('release scheduling writes the expected ordered release automation points')
	static async schedulesReleaseSteps(subjectFactory: SubjectFactory<AdsrEnvelope>, scenario?: ScenarioParameter): Promise<{ operations: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const envelope = new AdsrEnvelope()
		const operations: string[] = []
		const audioParameter = this.createRecordingAudioParam(operations)

		envelope.scheduleRelease(audioParameter, {
			startTime: 2,
			startValue: 1200,
			endValue: 480,
			releaseSeconds: 0.3
		})

		const joinedOperations = operations.join(' | ')
		assert(joinedOperations === 'cancel@2 | set:1200@2 | ramp:480@2.3', 'Expected release scheduling to cancel old automation, set the current value, then ramp to the release target')
		return { operations: joinedOperations }
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}

	@Spec('Builds a tiny recording audio parameter so ADSR scheduling can be asserted without a browser audio graph.')
	private static createRecordingAudioParam(operations: string[]): AudioParam {
		return {
			cancelScheduledValues(startTime: number) {
				operations.push(`cancel@${startTime}`)
			},
			setValueAtTime(value: number, startTime: number) {
				operations.push(`set:${value}@${startTime}`)
				return this
			},
			linearRampToValueAtTime(value: number, endTime: number) {
				operations.push(`ramp:${value}@${endTime}`)
				return this
			}
		} as unknown as AudioParam
	}
}
