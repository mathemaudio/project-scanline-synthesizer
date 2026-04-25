import './VintageKnob.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '@shared/lll.lll'
import { VintageKnob } from './VintageKnob.lll'

@Spec('Verifies the reusable vintage knob control markup and interaction behavior.')
export class VintageKnobTest {
	testType = 'unit'

	@Scenario('the knob renders its centered value text and emits input when keyboard interaction changes the value')
	static async rendersValueAndEmitsInput(subjectFactory: SubjectFactory<VintageKnob>, scenario?: ScenarioParameter): Promise<{ valueText: string, value: string, inputCount: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const knob = document.createElement('vintage-knob') as VintageKnob
		knob.min = 0
		knob.max = 100
		knob.step = 5
		knob.value = '40'
		knob.valueText = '40 ms'
		let inputCount = 0
		knob.addEventListener('input', () => {
			inputCount += 1
		})
		document.body.appendChild(knob)
		await knob.updateComplete
		const valueText = knob.shadowRoot?.querySelector('.value')?.textContent?.trim() ?? ''
		const valueMarkup = knob.shadowRoot?.querySelector('.value')?.innerHTML ?? ''
		const surface = knob.shadowRoot?.querySelector<HTMLElement>('.knob')
		assert(surface !== null && surface !== undefined, 'Expected the vintage knob surface to render')
		surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }))
		await knob.updateComplete
		const value = knob.value
		knob.remove()
		assert(valueText === '40ms', 'Expected the knob center display text to remain readable after forced two-line rendering')
		assert(valueMarkup.includes('<br'), 'Expected multi-word knob values to include a forced line break')
		assert(value === '45', 'Expected keyboard interaction to increase the knob value by one step')
		assert(inputCount === 1, 'Expected the knob to emit one input event after one arrow step')
		return { valueText, value, inputCount }
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
