import { MidiInputCollectionLike } from './MidiInputCollectionLike.lll'

export type MidiAccessLike = {
	inputs: MidiInputCollectionLike
	onstatechange: (() => void) | null
}
