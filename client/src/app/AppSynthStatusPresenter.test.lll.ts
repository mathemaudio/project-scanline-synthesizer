import './AppSynthStatusPresenter.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '../system/lll.lll'
import { AppSynthStatusPresenter } from './AppSynthStatusPresenter.lll'

@Spec('Verifies the synth status presenter returns the expected labels and detail text for key app states.')
export class AppSynthStatusPresenterTest {
	testType = 'unit'

	@Scenario('synth status presenter returns ready and unsupported snapshots')
	static async returnsReadyAndUnavailableSnapshots(subjectFactory: SubjectFactory<AppSynthStatusPresenter>, scenario?: ScenarioParameter): Promise<{ readyLabel: string, unavailableLabel: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const presenter = new AppSynthStatusPresenter()
		const readySnapshot = presenter.createSynthStatusSnapshot({
			state: 'ready',
			playbackMode: 'cutoff',
			isMonophonic: true,
			soundingVoiceCount: 0,
			activePitch: null
		})
		const unavailableSnapshot = presenter.createSynthStatusSnapshot({
			state: 'unsupported',
			playbackMode: 'raw',
			isMonophonic: true,
			soundingVoiceCount: 0,
			activePitch: null
		})
		assert(readySnapshot.noteStateLabel === 'Ready', 'Expected ready state to set the Ready label')
		assert(readySnapshot.noteDetailText.includes('Cutoff mode is armed.'), 'Expected ready cutoff detail text to be applied')
		assert(unavailableSnapshot.noteStateLabel === 'Unavailable', 'Expected unsupported state to set the Unavailable label')
		assert(unavailableSnapshot.noteDetailText.includes('AudioContext'), 'Expected unsupported detail text to mention AudioContext availability')
		return {
			readyLabel: readySnapshot.noteStateLabel,
			unavailableLabel: unavailableSnapshot.noteStateLabel
		}
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
