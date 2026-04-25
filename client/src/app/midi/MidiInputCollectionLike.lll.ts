import { MidiInputLike } from './MidiInputLike.lll'

export type MidiInputCollectionLike = {
	values(): IterableIterator<MidiInputLike>
}
