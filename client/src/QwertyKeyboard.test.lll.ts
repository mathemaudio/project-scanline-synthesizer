import './QwertyKeyboard.lll'
import { AssertFn, Scenario, Spec, WaitForFn } from '@shared/lll.lll'
import { QwertyKeyboard } from './QwertyKeyboard.lll'

@Spec('Covers the phase-two QWERTY keyboard mapping, held-key ordering, and polyphonic held-pitch snapshots with unit scenarios.')
export class QwertyKeyboardTest {
	testType = "unit"

	@Scenario('maps the upper row chromatically through B and continues naturally into the next octave')
	static async mapsChromaticKeyboardLayout(
		input = {},
		assert: AssertFn,
		waitFor: WaitForFn
	): Promise<{ firstNote: string, continuedTopRowNote: string, duplicatedLowerRowNote: string }> {
		const keyboard = new QwertyKeyboard({ baseOctave: 4, pitchReferenceHz: 440 })
		const firstPitch = keyboard.getPitchForKey('q')
		const sharpPitch = keyboard.getPitchForKey('2')
		const continuedTopRowPitch = keyboard.getPitchForKey('i')
		const continuedTopRowSharpPitch = keyboard.getPitchForKey('9')
		const duplicatedLowerRowPitch = keyboard.getPitchForKey('z')
		await waitFor(
			() => firstPitch !== null && sharpPitch !== null && continuedTopRowPitch !== null && continuedTopRowSharpPitch !== null && duplicatedLowerRowPitch !== null,
			'Expected extended mapped keyboard pitches to be available'
		)
		assert(firstPitch !== null, 'Expected Q to map to a playable pitch')
		assert(sharpPitch !== null, 'Expected 2 to map to a playable pitch')
		assert(continuedTopRowPitch !== null, 'Expected I to continue the upper row into the next octave')
		assert(continuedTopRowSharpPitch !== null, 'Expected 9 to continue the upper row chromatically into the next octave')
		assert(duplicatedLowerRowPitch !== null, 'Expected Z to remain a playable duplicated next-octave pitch')
		assert(firstPitch.noteLabel === 'C4', 'Expected Q to map to C4')
		assert(sharpPitch.noteLabel === 'C#4', 'Expected 2 to map to C#4')
		assert(continuedTopRowPitch.noteLabel === 'C5', 'Expected I to continue the upper row at C5')
		assert(continuedTopRowSharpPitch.noteLabel === 'C#5', 'Expected 9 to continue the upper row at C#5')
		assert(duplicatedLowerRowPitch.noteLabel === 'C5', 'Expected Z to duplicate the next octave start at C5')
		assert(Math.abs(sharpPitch.frequencyHz / firstPitch.frequencyHz - 2 ** (1 / 12)) < 0.000001, 'Expected adjacent chromatic keys to differ by one equal-tempered semitone')
		assert(Math.abs(continuedTopRowPitch.frequencyHz / firstPitch.frequencyHz - 2) < 0.000001, 'Expected I to be one octave above Q')
		assert(Math.abs(duplicatedLowerRowPitch.frequencyHz - continuedTopRowPitch.frequencyHz) < 0.000001, 'Expected Z to duplicate the same C5 pitch as I')
		return {
			firstNote: firstPitch.noteLabel,
			continuedTopRowNote: continuedTopRowPitch.noteLabel,
			duplicatedLowerRowNote: duplicatedLowerRowPitch.noteLabel
		}
	}

	@Scenario('held key tracking ignores repeats, promotes the newest key, and falls back on release')
	static async tracksHeldKeyboardState(
		input = {},
		assert: AssertFn,
		waitFor: WaitForFn
	): Promise<{ activeAfterFirstPress: string, activeAfterFallback: string, activeAfterFinalRelease: string }> {
		const keyboard = new QwertyKeyboard({ baseOctave: 4, pitchReferenceHz: 440 })
		const firstPress = keyboard.pressKey('q')
		const repeatedPress = keyboard.pressKey('q')
		const secondPress = keyboard.pressKey('w')
		const releaseNewest = keyboard.releaseKey('w')
		const releaseFinal = keyboard.releaseKey('q')
		const unmappedPress = keyboard.pressKey('[')
		await waitFor(() => true, 'Keyboard state transitions are synchronous and ready immediately')
		assert(firstPress.consumed === true && firstPress.didChange === true, 'Expected first mapped key press to be consumed and change the active note')
		assert(firstPress.activePitch?.noteLabel === 'C4', 'Expected first Q press to activate C4')
		assert(repeatedPress.consumed === true && repeatedPress.didChange === false, 'Expected repeated Q keydown to be ignored without changing the active note')
		assert(secondPress.activePitch?.noteLabel === 'D4', 'Expected the newest held key W to promote D4 as active')
		assert(releaseNewest.didChange === true, 'Expected releasing the newest held key to change the active note')
		assert(releaseNewest.activePitch?.noteLabel === 'C4', 'Expected releasing W to fall back to the still-held Q note')
		assert(releaseFinal.didChange === true, 'Expected releasing the final held key to change the active note state')
		assert(releaseFinal.activePitch === null, 'Expected releasing the last held mapped key to clear the active pitch')
		assert(unmappedPress.consumed === false && unmappedPress.didChange === false, 'Expected unmapped keys to leave keyboard state untouched')
		const activeAfterFirstPress = firstPress.activePitch?.noteLabel ?? 'none'
		const activeAfterFallback = releaseNewest.activePitch?.noteLabel ?? 'none'
		const activeAfterFinalRelease = 'none'
		return {
			activeAfterFirstPress,
			activeAfterFallback,
			activeAfterFinalRelease
		}
	}

	@Scenario('held pitch snapshots preserve all unique held notes for a synth that wants polyphonic input')
	static async exposesHeldPitchesForPolyphonicSynthDecision(
		input = {},
		assert: AssertFn,
		waitFor: WaitForFn
	): Promise<{ heldNotesBeforeRelease: string[], heldNotesAfterRelease: string[] }> {
		const keyboard = new QwertyKeyboard({ baseOctave: 4, pitchReferenceHz: 440 })
		keyboard.pressKey('q')
		keyboard.pressKey('w')
		keyboard.pressKey('q')
		const heldNotesBeforeRelease = keyboard.getHeldPitches().map((pitch) => pitch.noteLabel)
		keyboard.releaseKey('q')
		const heldNotesAfterRelease = keyboard.getHeldPitches().map((pitch) => pitch.noteLabel)
		await waitFor(() => heldNotesBeforeRelease.length === 2, 'Expected two unique held notes after pressing Q and W')
		assert(heldNotesBeforeRelease.length === 2, 'Expected held pitch snapshots to include both unique mapped keys')
		assert(heldNotesBeforeRelease[0] === 'C4', 'Expected held pitch snapshots to preserve Q as the first held note')
		assert(heldNotesBeforeRelease[1] === 'D4', 'Expected held pitch snapshots to preserve W as the second held note')
		assert(heldNotesAfterRelease.length === 1, 'Expected releasing Q to leave only one held pitch')
		assert(heldNotesAfterRelease[0] === 'D4', 'Expected remaining held pitch after releasing Q to be D4')
		return { heldNotesBeforeRelease, heldNotesAfterRelease }
	}
}
