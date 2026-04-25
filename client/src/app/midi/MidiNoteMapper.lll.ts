import { Spec } from '../../system/lll.lll'
import { KeyboardPitch } from '../../KeyboardPitch.lll'

@Spec('Maps MIDI note numbers into note labels and equal-tempered frequencies for the synth input pipeline.')
export class MidiNoteMapper {
	private readonly pitchReferenceHz: number
	private readonly noteNames: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

	constructor(options: { pitchReferenceHz?: number } = {}) {
		Spec('Configures the MIDI note mapper around a pitch reference used for equal-tempered note frequencies.')
		this.pitchReferenceHz = options.pitchReferenceHz ?? 440
	}

	@Spec('Returns one mapped pitch for a MIDI note number when the note lies inside the standard 0 to 127 range.')
	public getPitchForMidiNote(midiNoteNumber: number): KeyboardPitch | null {
		if (Number.isInteger(midiNoteNumber) === false) {
			return null
		}
		if (midiNoteNumber < 0 || midiNoteNumber > 127) {
			return null
		}
		const noteLabel = `${this.noteNames[midiNoteNumber % 12]}${Math.floor(midiNoteNumber / 12) - 1}`
		const frequencyHz = this.pitchReferenceHz * 2 ** ((midiNoteNumber - 69) / 12)
		return {
			keyLabel: 'MIDI',
			noteLabel,
			frequencyHz
		}
	}
}
