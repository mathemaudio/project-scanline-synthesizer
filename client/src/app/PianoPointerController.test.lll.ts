import './PianoPointerController.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '../system/lll.lll'
import { PianoPointerController } from './PianoPointerController.lll'

@Spec('Verifies pointer-drag piano key state transitions for the on-screen keyboard controller.')
export class PianoPointerControllerTest {
	testType = 'unit'

	@Scenario('dragging from one piano key into another releases the first key and presses the next key')
	static async switchesDraggedKeyWhenPointerEntersAnotherKey(subjectFactory: SubjectFactory<PianoPointerController>, scenario?: ScenarioParameter): Promise<{ calls: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const calls: string[] = []
		const controller = new PianoPointerController({
			pressMappedKey: async (keyLabel) => { calls.push(`press:${keyLabel}`) },
			releaseMappedKey: async (keyLabel) => { calls.push(`release:${keyLabel}`) }
		})
		await controller.onPointerDown('Q', this.createPointerEventStub(1))
		await controller.onPointerEnter('W', this.createPointerEventStub(1))
		assert(calls.join('|') === 'press:Q|release:Q|press:W', 'Expected dragging into a second key to release the first key before pressing the next one')
		assert(controller.getActivePointerKeyLabel() === 'W', 'Expected the controller to track the dragged key now under the pointer')
		return { calls: calls.join('|') }
	}

	@Scenario('leaving the active dragged key releases it and clears pointer state')
	static async releasesActiveDraggedKeyOnLeave(subjectFactory: SubjectFactory<PianoPointerController>, scenario?: ScenarioParameter): Promise<{ calls: string, activeKey: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		void subjectFactory
		const calls: string[] = []
		const controller = new PianoPointerController({
			pressMappedKey: async (keyLabel) => { calls.push(`press:${keyLabel}`) },
			releaseMappedKey: async (keyLabel) => { calls.push(`release:${keyLabel}`) }
		})
		await controller.onPointerDown('Q', this.createPointerEventStub(1))
		await controller.onPointerLeave('Q')
		assert(calls.join('|') === 'press:Q|release:Q', 'Expected leaving the active dragged key to release it')
		assert(controller.getActivePointerKeyLabel() === null, 'Expected the controller to clear active pointer state after leaving the dragged key')
		return { calls: calls.join('|'), activeKey: String(controller.getActivePointerKeyLabel()) }
	}

	@Spec('Builds one tiny pointer event stub with configurable button state for unit scenarios.')
	private static createPointerEventStub(buttons: number): PointerEvent {
		return {
			buttons,
			preventDefault: () => undefined
		} as unknown as PointerEvent
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
