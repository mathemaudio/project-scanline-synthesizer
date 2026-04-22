import { Spec } from '@shared/lll.lll'

@Spec('Provides a harmless workspace-local marker used only to exercise tool invocation in the plugin UI.')
export class ToolUiDebug {
	@Spec('Returns a fixed label so the temporary marker file remains valid and inert.')
	public getLabel(): string {
		return 'tool-ui-debug-marker'
	}
}
