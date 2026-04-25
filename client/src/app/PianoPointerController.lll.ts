import { Spec } from '../system/lll.lll'

@Spec('Tracks pointer-driven piano key dragging so entering and leaving keys with the pointer held behaves like a software keyboard.')
export class PianoPointerController {
	private activePointerKeyLabel: string | null = null
	private readonly pressMappedKey: (keyLabel: string) => Promise<void>
	private readonly releaseMappedKey: (keyLabel: string) => Promise<void>

	constructor(options: { pressMappedKey: (keyLabel: string) => Promise<void>, releaseMappedKey: (keyLabel: string) => Promise<void> }) {
		Spec('Stores the mapped-key press and release callbacks used to mirror pointer gestures into keyboard note state.')
		this.pressMappedKey = options.pressMappedKey
		this.releaseMappedKey = options.releaseMappedKey
	}

	@Spec('Starts playing one mapped key when the pointer is pressed on a piano key.')
	public async onPointerDown(keyLabel: string, event: PointerEvent): Promise<void> {
		event.preventDefault()
		await this.capturePointerKey(keyLabel)
	}

	@Spec('Starts playing a newly hovered piano key when the pointer is already held during a drag gesture.')
	public async onPointerEnter(keyLabel: string, event: PointerEvent): Promise<void> {
		if (event.buttons <= 0) {
			return
		}
		await this.capturePointerKey(keyLabel)
	}

	@Spec('Stops playing the currently dragged key when the held pointer leaves that piano key.')
	public async onPointerLeave(keyLabel: string): Promise<void> {
		if (this.activePointerKeyLabel !== keyLabel) {
			return
		}
		await this.releaseActivePointerKey()
	}

	@Spec('Stops playing any pointer-held piano key when the pointer is released or cancelled anywhere in the window.')
	public async releaseActivePointerKey(): Promise<void> {
		if (this.activePointerKeyLabel === null) {
			return
		}
		const releasedKeyLabel = this.activePointerKeyLabel
		this.activePointerKeyLabel = null
		await this.releaseMappedKey(releasedKeyLabel)
	}

	@Spec('Returns the currently pointer-held key label so the host can inspect drag state when needed.')
	public getActivePointerKeyLabel(): string | null {
		return this.activePointerKeyLabel
	}

	@Spec('Moves the pointer-held note to one mapped key, releasing the prior dragged key first when needed.')
	private async capturePointerKey(keyLabel: string): Promise<void> {
		if (this.activePointerKeyLabel === keyLabel) {
			return
		}
		if (this.activePointerKeyLabel !== null) {
			await this.releaseMappedKey(this.activePointerKeyLabel)
		}
		this.activePointerKeyLabel = keyLabel
		await this.pressMappedKey(keyLabel)
	}
}
