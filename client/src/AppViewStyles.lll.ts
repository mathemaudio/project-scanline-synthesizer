import { Spec } from '@shared/lll.lll'
import { AppStyleSheet } from './styles/AppStyleSheet.lll'

@Spec('Provides the focused style binding used by the main App view shell.')
export class AppViewStyles {
	public static styles = AppStyleSheet.styles
}
