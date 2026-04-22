import { Spec } from '@shared/lll.lll'
import type { App } from '../App.lll'

@Spec('Reads knob-like control values from native sliders and custom vintage knob events for the app.')
export class AppControlValueReader {
	private readonly source: App

	public constructor(source: App) {
		Spec('Stores the app reference while exposing a tiny helper that normalizes slider-like control events.')
		this.source = source
	}

	@Spec('Reads the event target as either a native range input or a custom knob element exposing name and value fields.')
	public readKnobLikeTarget(event: Event): { name: string, value: string } | null {
		void this.source
		const target = event.currentTarget as { name?: unknown, value?: unknown } | null
		const name = typeof target?.name === 'string' ? target.name : ''
		const value = typeof target?.value === 'string' ? target.value : ''
		if (value.length === 0 && name.length === 0) {
			return null
		}
		return { name, value }
	}
}
