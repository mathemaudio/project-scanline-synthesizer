import './Start.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory, WaitForFn } from '@shared/lll.lll'
import { Start } from './Start.lll'

@Spec('Covers client bootstrapping behavior for Start.')
export class StartTest {
	testType = 'behavioral'

	@Scenario('renders app-root into #app when container exists')
	static async rendersAppIntoContainer(subjectFactory: SubjectFactory<Start>, scenario: ScenarioParameter): Promise<{ renderedTagName: string }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		const root = document.querySelector<HTMLElement>('#app')
		assert(root !== null, 'Expected document #app container to be available')

		const start = await subjectFactory()
		assert(start instanceof Start, 'Expected subjectFactory to create Start')
		await waitFor(() => root.querySelector('app-root') !== null, 'Expected Start bootstrap to render app-root into #app')
		const renderedElement = root.querySelector('app-root')
		assert(renderedElement !== null, 'Expected Start to render app-root into #app')
		return { renderedTagName: renderedElement.tagName.toLowerCase() }
	}
}
