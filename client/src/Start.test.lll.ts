import './Start.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '@shared/lll.lll'
import { Start } from './Start.lll'

@Spec('Verifies startup rendering behavior around the #app container.')
export class StartTest {
	testType = 'unit'

	@Scenario('bootstrapping renders app-root into #app')
	static async rendersAppRootIntoExistingContainer(subjectFactory: SubjectFactory<Start>, scenario: ScenarioParameter): Promise<{ rootTagName: string, renderedMarkup: string }> {
		const assert: AssertFn = this.readScenario(subjectFactory, scenario)?.assert ?? this.failFastAssert
		const originalBody = document.body.innerHTML
		document.body.innerHTML = '<div id="app"></div>'
		try {
			const start = await this.createStart(subjectFactory)
			const rootTagName = start.root?.tagName ?? 'none'
			const renderedMarkup = start.root?.innerHTML ?? ''

			assert(rootTagName === 'DIV', 'Expected Start to capture the #app container')
			assert(renderedMarkup.includes('app-root'), 'Expected Start to render an app-root element into #app')
			return { rootTagName, renderedMarkup }
		} finally {
			document.body.innerHTML = originalBody
		}
	}

	@Spec('Creates a start subject through the runner when available or directly otherwise.')
	private static async createStart(subjectFactory: SubjectFactory<Start>): Promise<Start> {
		if (typeof subjectFactory === 'function') {
			return await subjectFactory()
		}
		return new Start()
	}

	@Spec('Reads the scenario helper bag even when the runner supplies it in the first parameter slot.')
	private static readScenario(subjectFactory: SubjectFactory<Start>, scenario: ScenarioParameter): ScenarioParameter | undefined {
		const maybeScenario = subjectFactory as unknown as ScenarioParameter | undefined
		if (scenario !== undefined) {
			return scenario
		}
		if (maybeScenario !== undefined && typeof maybeScenario === 'object' && 'assert' in maybeScenario && 'waitFor' in maybeScenario) {
			return maybeScenario
		}
		return undefined
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}
}
