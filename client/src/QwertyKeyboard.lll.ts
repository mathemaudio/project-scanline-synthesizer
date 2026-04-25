import { Spec } from './system/lll.lll'
import { KeyboardPitch } from './KeyboardPitch.lll'

@Spec('Maps QWERTY keys to chromatic pitches, keeps held-key order, and exposes both active and polyphonic pitch state.')
export class QwertyKeyboard {
	private baseOctave: number
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

	@Spec('Marks a mapped key as held and returns the current active and held pitch state that the synth can interpret.')
	pressKey(key: string): { consumed: boolean, didChange: boolean, activePitch: KeyboardPitch | null, heldPitches: KeyboardPitch[] } {
		const pitch = this.getPitchForKey(key)
		if (pitch === null) {
			return this.createPlayState(false, false)
		}

		const normalizedKey = this.normalizeKey(key)
		if (this.heldKeys.includes(normalizedKey)) {
			return this.createPlayState(true, false)
		}

		this.heldKeys.push(normalizedKey)
		return this.createPlayState(true, true)
	}

	@Spec('Releases a mapped key and returns the next active and held pitch state so the synth can react cleanly.')
	releaseKey(key: string): { consumed: boolean, didChange: boolean, activePitch: KeyboardPitch | null, heldPitches: KeyboardPitch[] } {
		const pitch = this.getPitchForKey(key)
		if (pitch === null) {
			return this.createPlayState(false, false)
		}

		const normalizedKey = this.normalizeKey(key)
		const activeKeyBeforeRelease = this.heldKeys[this.heldKeys.length - 1] ?? null
		const keyIndex = this.heldKeys.lastIndexOf(normalizedKey)
		if (keyIndex === -1) {
			return this.createPlayState(true, false)
		}

		this.heldKeys.splice(keyIndex, 1)
		const activeKeyAfterRelease = this.heldKeys[this.heldKeys.length - 1] ?? null
		return this.createPlayState(true, activeKeyBeforeRelease !== activeKeyAfterRelease)
	}

	@Spec('Returns the currently active pitch based on the most recently held mapped key.')
	getActivePitch(): KeyboardPitch | null {
		const activeKey = this.heldKeys[this.heldKeys.length - 1]
		if (activeKey === undefined) {
			return null
		}
		return this.getPitchForKey(activeKey)
	}

	@Spec('Returns all currently held mapped pitches in held order so the synth can choose mono or poly behavior.')
	getHeldPitches(): KeyboardPitch[] {
		return this.heldKeys
			.map((heldKey) => this.getPitchForKey(heldKey))
			.filter((pitch): pitch is KeyboardPitch => pitch !== null)
	}

	@Spec('Shifts the mapped keyboard layout by octaves within a safe playable range and returns the applied base octave.')
	shiftBaseOctave(direction: -1 | 1): number {
		this.baseOctave = Math.max(0, Math.min(7, this.baseOctave + direction))
		return this.baseOctave
	}

	@Spec('Returns the current base octave used to derive mapped QWERTY note labels and frequencies.')
	getBaseOctave(): number {
		return this.baseOctave
	}

	@Spec('Normalizes browser key text so shifted letter presses still map to the intended synth note.')
	private normalizeKey(key: string): string {
		return key.trim().toLowerCase()
	}

	@Spec('Builds one play-state snapshot that includes both the active note and the full held-note list.')
	private createPlayState(
		consumed: boolean,
		didChange: boolean
	): { consumed: boolean, didChange: boolean, activePitch: KeyboardPitch | null, heldPitches: KeyboardPitch[] } {
		return {
			consumed,
			didChange,
			activePitch: this.getActivePitch(),
			heldPitches: this.getHeldPitches()
		}
	}
}
