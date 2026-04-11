import { Spec } from '@shared/lll.lll'
import { KeyboardPitch } from './KeyboardPitch.lll'

@Spec('Maps QWERTY keys to chromatic pitches and tracks the currently held note for phase-two playability.')
export class QwertyKeyboard {
	private readonly baseOctave: number
	private readonly pitchReferenceHz: number
	private readonly semitoneOffsetsByKey: Record<string, number> = {
		q: 0,
		'2': 1,
		w: 2,
		'3': 3,
		e: 4,
		r: 5,
		'5': 6,
		t: 7,
		'6': 8,
		y: 9,
		'7': 10,
		u: 11,
		i: 12,
		'9': 13,
		o: 14,
		'0': 15,
		p: 16,
		z: 12,
		s: 13,
		x: 14,
		d: 15,
		c: 16,
		v: 17,
		g: 18,
		b: 19,
		h: 20,
		n: 21,
		j: 22,
		m: 23
	}
	private readonly noteNames: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
	private readonly heldKeys: string[] = []

	constructor(options: { baseOctave?: number, pitchReferenceHz?: number } = {}) {
		Spec('Configures the QWERTY keyboard around a base octave and equal-tempered pitch reference.')
		this.baseOctave = options.baseOctave ?? 4
		this.pitchReferenceHz = options.pitchReferenceHz ?? 440
	}

	@Spec('Returns the mapped pitch for a browser keyboard key when the key participates in the synth layout.')
	getPitchForKey(key: string): KeyboardPitch | null {
		const normalizedKey = this.normalizeKey(key)
		const semitoneOffset = this.semitoneOffsetsByKey[normalizedKey]
		if (semitoneOffset === undefined) {
			return null
		}

		const midiNoteNumber = (this.baseOctave + 1) * 12 + semitoneOffset
		const noteLabel = `${this.noteNames[midiNoteNumber % 12]}${Math.floor(midiNoteNumber / 12) - 1}`
		const frequencyHz = this.pitchReferenceHz * 2 ** ((midiNoteNumber - 69) / 12)
		return {
			keyLabel: normalizedKey.length === 1 ? normalizedKey.toUpperCase() : normalizedKey,
			noteLabel,
			frequencyHz
		}
	}

	@Spec('Marks a mapped key as held and returns the active pitch state that the synth should follow.')
	pressKey(key: string): { consumed: boolean, didChange: boolean, activePitch: KeyboardPitch | null } {
		const pitch = this.getPitchForKey(key)
		if (pitch === null) {
			return {
				consumed: false,
				didChange: false,
				activePitch: this.getActivePitch()
			}
		}

		const normalizedKey = this.normalizeKey(key)
		if (this.heldKeys.includes(normalizedKey)) {
			return {
				consumed: true,
				didChange: false,
				activePitch: this.getActivePitch()
			}
		}

		this.heldKeys.push(normalizedKey)
		return {
			consumed: true,
			didChange: true,
			activePitch: this.getActivePitch()
		}
	}

	@Spec('Releases a mapped key and returns the next active pitch so note-off and fallback can be handled cleanly.')
	releaseKey(key: string): { consumed: boolean, didChange: boolean, activePitch: KeyboardPitch | null } {
		const pitch = this.getPitchForKey(key)
		if (pitch === null) {
			return {
				consumed: false,
				didChange: false,
				activePitch: this.getActivePitch()
			}
		}

		const normalizedKey = this.normalizeKey(key)
		const activeKeyBeforeRelease = this.heldKeys[this.heldKeys.length - 1] ?? null
		const keyIndex = this.heldKeys.lastIndexOf(normalizedKey)
		if (keyIndex === -1) {
			return {
				consumed: true,
				didChange: false,
				activePitch: this.getActivePitch()
			}
		}

		this.heldKeys.splice(keyIndex, 1)
		const activeKeyAfterRelease = this.heldKeys[this.heldKeys.length - 1] ?? null
		return {
			consumed: true,
			didChange: activeKeyBeforeRelease !== activeKeyAfterRelease,
			activePitch: this.getActivePitch()
		}
	}

	@Spec('Returns the currently active pitch based on the most recently held mapped key.')
	getActivePitch(): KeyboardPitch | null {
		const activeKey = this.heldKeys[this.heldKeys.length - 1]
		if (activeKey === undefined) {
			return null
		}
		return this.getPitchForKey(activeKey)
	}

	@Spec('Normalizes browser key text so shifted letter presses still map to the intended synth note.')
	private normalizeKey(key: string): string {
		return key.trim().toLowerCase()
	}
}
