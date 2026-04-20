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

	@Scenario('releasing older keys from a three-note chord removes only those released pitches')
	static async releasesChordKeysIndividually(subjectFactory: SubjectFactory<QwertyKeyboard>, scenario: ScenarioParameter): Promise<{ heldAfterFirstRelease: string, heldAfterSecondRelease: string, finalActiveNote: string }> {
		const assert: AssertFn = this.readScenario(subjectFactory, scenario)?.assert ?? this.failFastAssert
		const keyboard = await this.createKeyboard(subjectFactory)

		keyboard.pressKey('q')
		keyboard.pressKey('e')
		keyboard.pressKey('r')
		const afterFirstRelease = keyboard.releaseKey('q')
		const afterSecondRelease = keyboard.releaseKey('e')
		const heldAfterFirstRelease = afterFirstRelease.heldPitches.map((pitch) => pitch.noteLabel).join(', ')
		const heldAfterSecondRelease = afterSecondRelease.heldPitches.map((pitch) => pitch.noteLabel).join(', ')
		const finalActiveNote = afterSecondRelease.activePitch?.noteLabel ?? 'none'

		assert(heldAfterFirstRelease === 'E4, F4', 'Expected releasing Q to keep only E4 and F4 held')
		assert(heldAfterSecondRelease === 'F4', 'Expected releasing E next to keep only F4 held')
		assert(finalActiveNote === 'F4', 'Expected F4 to remain active after earlier chord keys are released')
		return { heldAfterFirstRelease, heldAfterSecondRelease, finalActiveNote }
	}

	@Scenario('shifting the keyboard up and down changes the mapped base octave safely')
	static async shiftsKeyboardBaseOctave(subjectFactory: SubjectFactory<QwertyKeyboard>, scenario: ScenarioParameter): Promise<{ loweredNote: string, raisedNote: string, finalBaseOctave: number }> {
		const assert: AssertFn = this.readScenario(subjectFactory, scenario)?.assert ?? this.failFastAssert
		const keyboard = await this.createKeyboard(subjectFactory)

		const loweredBaseOctave = keyboard.shiftBaseOctave(-1)
		const loweredNote = keyboard.getPitchForKey('q')?.noteLabel ?? 'none'
		const raisedBaseOctave = keyboard.shiftBaseOctave(1)
		const raisedNote = keyboard.getPitchForKey('q')?.noteLabel ?? 'none'

		assert(loweredBaseOctave === 3, 'Expected shifting down from the default base octave to land on octave 3')
		assert(loweredNote === 'C3', 'Expected Q to map to C3 after lowering the base octave')
		assert(raisedBaseOctave === 4, 'Expected shifting back up to restore the default base octave')
		assert(raisedNote === 'C4', 'Expected Q to map back to C4 after raising the base octave')
		return { loweredNote, raisedNote, finalBaseOctave: keyboard.getBaseOctave() }
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
