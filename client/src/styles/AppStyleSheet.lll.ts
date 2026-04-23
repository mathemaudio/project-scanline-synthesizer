import { Spec } from '@shared/lll.lll'
import { AppChromeStyleSheet } from './AppChromeStyleSheet.lll'
import { AppControlPanelStyleSheet } from './AppControlPanelStyleSheet.lll'

@Spec('Provides the combined shared Scanline Synth stylesheet from smaller focused style modules.')
export class AppStyleSheet {
	public static styles = [AppChromeStyleSheet.styles, AppControlPanelStyleSheet.styles]
}
