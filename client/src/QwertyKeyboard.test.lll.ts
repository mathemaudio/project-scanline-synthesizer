import './QwertyKeyboard.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '@shared/lll.lll'
import { QwertyKeyboard } from './QwertyKeyboard.lll'

@Spec('Verifies mapped QWERTY keyboard note selection and held-key fallback behavior.')
export class QwertyKeyboardTest {
	testType = 'unit'

	@Scenario('Q then W then release W falls back to C4')
	static async fallsBackToPreviousHeldPitch(subjectFactory: SubjectFactory<QwertyKeyboard>, scenario: ScenarioParameter): Promise<{ activeBeforeRelease: string, activeAfterRelease: string, heldCountAfterRelease: number }> {
		const assert: AssertFn = this.readScenario(subjectFactory, scenario)?.assert ?? this.failFastAssert
		const keyboard = await this.createKeyboard(subjectFactory)

		const firstPress = keyboard.pressKey('q')
		const secondPress = keyboard.pressKey('w')
		const release = keyboard.releaseKey('w')
		const activeBeforeRelease = secondPress.activePitch?.noteLabel ?? 'none'
		const activeAfterRelease = release.activePitch?.noteLabel ?? 'none'
		const heldCountAfterRelease = release.heldPitches.length

		assert(firstPress.activePitch?.noteLabel === 'C4', 'Expected Q to map to C4')
		assert(activeBeforeRelease === 'D4', 'Expected W to become the active pitch while held')
		assert(activeAfterRelease === 'C4', 'Expected releasing W to fall back to the earlier held Q pitch')
		assert(heldCountAfterRelease === 1, 'Expected one held pitch to remain after releasing W')
		return { activeBeforeRelease, activeAfterRelease, heldCountAfterRelease }
	}

	@Scenario('duplicate upper and lower row enharmonic mapping keeps both visible in held order')
	static async exposesHeldOrderAcrossDuplicatePitchMappings(subjectFactory: SubjectFactory<QwertyKeyboard>, scenario: ScenarioParameter): Promise<{ heldLabels: string, activeKey: string }> {
		const assert: AssertFn = this.readScenario(subjectFactory, scenario)?.assert ?? this.failFastAssert
		const keyboard = await this.createKeyboard(subjectFactory)

		keyboard.pressKey('i')
		const secondPress = keyboard.pressKey('z')
		const heldLabels = secondPress.heldPitches.map((pitch) => `${pitch.keyLabel}:${pitch.noteLabel}`).join(', ')
		const activeKey = secondPress.activePitch?.keyLabel ?? 'none'

		assert(heldLabels === 'I:C5, Z:C5', 'Expected I and Z to both appear in held order even though they share the same pitch')
		assert(activeKey === 'Z', 'Expected the newest held key to become active')
		return { heldLabels, activeKey }
	}

	@Spec('Creates a keyboard subject through the runner when available or directly otherwise.')
	private static async createKeyboard(subjectFactory: SubjectFactory<QwertyKeyboard>): Promise<QwertyKeyboard> {
		if (typeof subjectFactory === 'function') {
			return await subjectFactory()
		}
		return new QwertyKeyboard()
	}

	@Spec('Reads the scenario helper bag even when the runner supplies it in the first parameter slot.')
	private static readScenario(subjectFactory: SubjectFactory<QwertyKeyboard>, scenario: ScenarioParameter): ScenarioParameter | undefined {
		const maybeScenario = subjectFactory as unknown as ScenarioParameter | undefined
		if (scenario !== undefined) {
			return scenario
		}
		if (maybeScenario !== undefined && typeof maybeScenario === 'object' && 'assert' in maybeScenario && 'waitFor' in maybeScenario) {
			return maybeScenario
		}
		return undefined
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
