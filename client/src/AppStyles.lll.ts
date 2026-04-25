import { Spec } from './system/lll.lll'
import { AppStyleSheet } from './styles/AppStyleSheet.lll'

@Spec('Provides the reusable visual style sheet for the Scanline Synth application shell.')
export class AppStyles {
	public static styles = AppStyleSheet.styles
}
