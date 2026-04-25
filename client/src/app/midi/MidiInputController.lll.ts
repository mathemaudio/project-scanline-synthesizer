import { KeyboardPitch } from '../../KeyboardPitch.lll'
import { Spec } from '../../system/lll.lll'
import { MidiAccessLike } from './MidiAccessLike.lll'
import { MidiInputCollectionLike } from './MidiInputCollectionLike.lll'
import { MidiInputLike } from './MidiInputLike.lll'
import { MidiMessageLike } from './MidiMessageLike.lll'
import { MidiNoteMapper } from './MidiNoteMapper.lll'

@Spec('Tracks Web MIDI note input, keeps held-note order, and reports synth-ready play-state snapshots as MIDI devices connect and send note events.')
export class MidiInputController {
	private readonly midiNoteMapper: MidiNoteMapper
	private readonly createMidiAccess: () => Promise<MidiAccessLike | null>
	private readonly onPlayStateChange: (playState: { didChange: boolean, activePitch: KeyboardPitch | null, heldPitches: KeyboardPitch[] }) => Promise<void> | void
	private midiAccess: MidiAccessLike | null = null
	private readonly heldMidiNoteNumbers: number[] = []
	private readonly knownInputs: Set<MidiInputLike> = new Set()

	constructor(options: {
		midiNoteMapper?: MidiNoteMapper
		createMidiAccess?: () => Promise<MidiAccessLike | null>
		onPlayStateChange: (playState: { didChange: boolean, activePitch: KeyboardPitch | null, heldPitches: KeyboardPitch[] }) => Promise<void> | void
	}) {
		Spec('Configures the MIDI input controller around a Web MIDI access factory and one callback that receives held-note snapshots after note changes.')
		this.midiNoteMapper = options.midiNoteMapper ?? new MidiNoteMapper()
		this.createMidiAccess = options.createMidiAccess ?? (() => this.requestBrowserMidiAccess())
		this.onPlayStateChange = options.onPlayStateChange
	}

	@Spec('Connects Web MIDI when available and starts listening to every currently attached MIDI input device.')
	public async connect() {
		this.midiAccess = await this.createMidiAccess()
		if (this.midiAccess === null) {
			return
		}
		this.attachKnownInputs()
		this.midiAccess.onstatechange = () => {
			this.attachKnownInputs()
		}
	}

	@Spec('Disconnects Web MIDI listeners, clears any held MIDI notes, and emits one empty note snapshot when those notes had been sounding.')
	public async disconnect() {
		if (this.midiAccess !== null) {
			this.midiAccess.onstatechange = null
		}
		for (const input of this.knownInputs.values()) {
			input.onmidimessage = null
		}
		this.knownInputs.clear()
		this.midiAccess = null
		if (this.heldMidiNoteNumbers.length === 0) {
			return
		}
		this.heldMidiNoteNumbers.splice(0, this.heldMidiNoteNumbers.length)
		await this.emitPlayStateChange(true)
	}

	@Spec('Returns all currently held MIDI pitches in held order so the app can merge them with other active input sources.')
	public getHeldPitches(): KeyboardPitch[] {
		return this.heldMidiNoteNumbers
			.map((midiNoteNumber) => this.midiNoteMapper.getPitchForMidiNote(midiNoteNumber))
			.filter((pitch): pitch is KeyboardPitch => pitch !== null)
	}

	@Spec('Returns the most recently held MIDI pitch so the app can choose a visible leading note when MIDI is active.')
	public getActivePitch(): KeyboardPitch | null {
		const activeMidiNoteNumber = this.heldMidiNoteNumbers[this.heldMidiNoteNumbers.length - 1] ?? null
		if (activeMidiNoteNumber === null) {
			return null
		}
		return this.midiNoteMapper.getPitchForMidiNote(activeMidiNoteNumber)
	}

	@Spec('Attaches note-message handlers to every currently visible MIDI input and avoids rebinding inputs already being tracked.')
	private attachKnownInputs() {
		if (this.midiAccess === null) {
			return
		}
		for (const input of this.readInputs(this.midiAccess.inputs)) {
			if (this.knownInputs.has(input)) {
				continue
			}
			input.onmidimessage = (event) => {
				void this.onMidiMessage(event)
			}
			this.knownInputs.add(input)
		}
	}

	@Spec('Handles one MIDI message by converting note-on and note-off commands into held-note updates for the synth.')
	private async onMidiMessage(event: MidiMessageLike) {
		const data = event.data
		if (data === undefined || data === null || data.length < 2) {
			return
		}
		const statusByte = data[0] ?? 0
		const command = statusByte & 0xf0
		const midiNoteNumber = data[1] ?? -1
		const velocity = data.length >= 3 ? (data[2] ?? 0) : 0
		if (command === 0x90 && velocity > 0) {
			await this.pressMidiNote(midiNoteNumber)
			return
		}
		if (command === 0x80 || (command === 0x90 && velocity === 0)) {
			await this.releaseMidiNote(midiNoteNumber)
		}
	}

	@Spec('Marks one MIDI note as held when it is valid and newly pressed, then emits the updated held-note snapshot.')
	private async pressMidiNote(midiNoteNumber: number) {
		if (this.midiNoteMapper.getPitchForMidiNote(midiNoteNumber) === null) {
			return
		}
		if (this.heldMidiNoteNumbers.includes(midiNoteNumber)) {
			return
		}
		this.heldMidiNoteNumbers.push(midiNoteNumber)
		await this.emitPlayStateChange(true)
	}

	@Spec('Releases one MIDI note when it is currently held, then emits the updated held-note snapshot for the synth.')
	private async releaseMidiNote(midiNoteNumber: number) {
		const heldNoteIndex = this.heldMidiNoteNumbers.lastIndexOf(midiNoteNumber)
		if (heldNoteIndex === -1) {
			return
		}
		this.heldMidiNoteNumbers.splice(heldNoteIndex, 1)
		await this.emitPlayStateChange(true)
	}

	@Spec('Emits one play-state snapshot built from the current MIDI held-note order and leading active note.')
	private async emitPlayStateChange(didChange: boolean) {
		await this.onPlayStateChange({
			didChange,
			activePitch: this.getActivePitch(),
			heldPitches: this.getHeldPitches()
		})
	}

	@Spec('Reads MIDI inputs from a browser MIDIAccess map-like object or a compatible test double exposing values iteration.')
	private readInputs(inputs: MidiInputCollectionLike): MidiInputLike[] {
		return Array.from(inputs.values())
	}

	@Spec('Requests browser Web MIDI access when the feature exists and otherwise falls back cleanly to no MIDI support.')
	private async requestBrowserMidiAccess(): Promise<MidiAccessLike | null> {
		const maybeNavigator = globalThis.navigator as Navigator & { requestMIDIAccess?: (() => Promise<MidiAccessLike>) | undefined }
		if (typeof maybeNavigator.requestMIDIAccess !== 'function') {
			return null
		}
		try {
			return await maybeNavigator.requestMIDIAccess() as unknown as MidiAccessLike
		} catch {
			return null
		}
	}
}
