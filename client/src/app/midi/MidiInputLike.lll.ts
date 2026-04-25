import { MidiMessageLike } from './MidiMessageLike.lll'

export type MidiInputLike = {
	onmidimessage: ((event: MidiMessageLike) => void) | null
}
