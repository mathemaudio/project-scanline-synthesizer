import './App.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory, WaitForFn } from '@shared/lll.lll'
import { App } from './App.lll'

@Spec('Exercises the Scanline Synth app only through visible UI and keyboard interactions.')
export class AppTest {
	testType = 'behavioral'

	@Scenario('monophonic mode is on by default and still tracks the newest held key')
	static async showsMonophonicDefaultForTwoHeldKeys(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ voiceMode: string, soundingVoices: string, activeKey: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true, cancelable: true }))
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', bubbles: true, cancelable: true }))
			await app.updateComplete

			await waitFor(() => this.readText(app, '#sounding-voices-value') === '1', 'Expected one sounding voice after holding Q and W in default monophonic mode')
			const voiceMode = this.readText(app, '#voice-mode-value')
			const soundingVoices = this.readText(app, '#sounding-voices-value')
			const activeKey = this.readText(app, '#active-key-value')
			const playbackMode = this.readText(app, '#playback-mode-value')

			assert(voiceMode === 'Monophonic', 'Expected the app to start in monophonic mode by default')
			assert(soundingVoices === '1', 'Expected only one sounding voice to be visible in default monophonic mode')
			assert(activeKey === 'W', 'Expected the newest held key to become active')
			assert(playbackMode === 'Cutoff', 'Expected cutoff playback mode to be selected by default')
			return { voiceMode, soundingVoices, activeKey }
		} finally {
			window.dispatchEvent(new KeyboardEvent('keyup', { key: 'q', bubbles: true, cancelable: true }))
			window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w', bubbles: true, cancelable: true }))
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
		}
	}

	@Scenario('monophonic mode and portamento are on by default')
	static async showsMonophonicAndPortamentoDefaults(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ toggleValue: string, voiceMode: string, soundingVoices: string, noteState: string, portamentoValue: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true, cancelable: true }))
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', bubbles: true, cancelable: true }))
			await app.updateComplete

			await waitFor(() => this.readText(app, '#sounding-voices-value') === '1', 'Expected monophonic mode to be active by default and keep one visible sounding voice')
			const toggleValue = this.readText(app, '#monophonic-toggle-value')
			const voiceMode = this.readText(app, '#voice-mode-value')
			const soundingVoices = this.readText(app, '#sounding-voices-value')
			const noteState = this.readText(app, '#note-state-value')
			const portamentoValue = this.readTextFromShadowHost(app, '#portamento-slider', '.value')

			assert(toggleValue === 'On', 'Expected the visible monophonic toggle label to turn On')
			assert(voiceMode === 'Monophonic', 'Expected voice mode card to show Monophonic')
			assert(soundingVoices === '1', 'Expected only one sounding voice in monophonic mode with overlapping keys held')
			assert(noteState === 'Playing', 'Expected note state to remain visibly Playing while a note is sounding')
			assert(portamentoValue === '50 ms', 'Expected the monophonic card to show the new 50 ms default portamento value')
			return { toggleValue, voiceMode, soundingVoices, noteState, portamentoValue }
		} finally {
			window.dispatchEvent(new KeyboardEvent('keyup', { key: 'q', bubbles: true, cancelable: true }))
			window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w', bubbles: true, cancelable: true }))
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
		}
	}

	@Scenario('adjusting monophonic portamento updates the visible slider value')
	static async updatesMonophonicPortamentoValue(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ portamentoValue: string, sliderValue: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			const portamentoSlider = app.shadowRoot?.querySelector<HTMLElement & { value: string }>('#portamento-slider')
			assert(portamentoSlider !== null && portamentoSlider !== undefined, 'Expected portamento knob to exist in the monophonic card')
			portamentoSlider.value = '640'
			portamentoSlider.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
			await app.updateComplete
			await waitFor(() => this.readTextFromShadowHost(app, '#portamento-slider', '.value') === '640 ms', 'Expected the visible portamento value to update after moving the slider')

			const portamentoValue = this.readTextFromShadowHost(app, '#portamento-slider', '.value')
			const sliderValue = this.readTextFromValueContainer(app, '#portamento-slider')

			assert(portamentoValue === '640 ms', 'Expected the monophonic card to show the updated portamento milliseconds')
			assert(sliderValue === '640', 'Expected the portamento knob value to stay in sync with the visible label')
			return { portamentoValue, sliderValue }
		} finally {
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
		}
	}

	@Scenario('switching playback mode shows cutoff settings in the right-side panel')
	static async showsCutoffPlaybackSettingsPanel(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ playbackMode: string, modeCopy: string, summary: string, resonanceValue: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			const cutoffRadio = app.shadowRoot?.querySelector<HTMLInputElement>('#playback-mode-cutoff')
			assert(cutoffRadio !== null && cutoffRadio !== undefined, 'Expected cutoff playback radio button to exist')
			cutoffRadio.checked = true
			cutoffRadio.dispatchEvent(new Event('change', { bubbles: true }))
			await app.updateComplete
			await waitFor(() => this.readText(app, '#playback-mode-value') === 'Cutoff', 'Expected the right-side playback settings panel to show the Cutoff label')

			const playbackMode = this.readText(app, '#playback-mode-value')
			const modeCopy = this.readText(app, '#playback-settings-mode-copy')
			const summary = this.readText(app, '#filter-envelope-summary')
			const resonanceValue = this.readTextFromValueContainer(app, '#filter-resonance-slider')

			assert(playbackMode === 'Cutoff', 'Expected the playback settings panel label to switch to Cutoff')
			assert(modeCopy.includes('Filter ADSR'), 'Expected the cutoff panel copy to mention filter ADSR shaping')
			assert(summary.includes('725 ms D') && summary.includes('15% S'), 'Expected the filter envelope summary to show the default cutoff settings')
			assert(resonanceValue === '13', 'Expected the resonance slider to start from the default value of 13')
			return { playbackMode, modeCopy, summary, resonanceValue }
		} finally {
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
		}
	}

	@Scenario('adjusting cutoff playback settings updates the visible summary values')
	static async updatesCutoffPlaybackSummaryValues(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ envelopeSummary: string, cutoffSummary: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			const cutoffRadio = app.shadowRoot?.querySelector<HTMLInputElement>('#playback-mode-cutoff')
			assert(cutoffRadio !== null && cutoffRadio !== undefined, 'Expected cutoff playback radio button to exist')
			cutoffRadio.checked = true
			cutoffRadio.dispatchEvent(new Event('change', { bubbles: true }))
			await app.updateComplete
			await waitFor(() => this.readText(app, '#playback-mode-value') === 'Cutoff', 'Expected cutoff settings panel to render before changing a slider')

			const attackSlider = app.shadowRoot?.querySelector<HTMLInputElement>('#filter-attack-slider')
			const peakCutoffSlider = app.shadowRoot?.querySelector<HTMLInputElement>('#filter-peak-cutoff-slider')
			assert(attackSlider !== null && attackSlider !== undefined, 'Expected attack slider to exist in cutoff mode')
			assert(peakCutoffSlider !== null && peakCutoffSlider !== undefined, 'Expected peak cutoff slider to exist in cutoff mode')
			attackSlider.value = '125'
			attackSlider.dispatchEvent(new Event('input', { bubbles: true }))
			peakCutoffSlider.value = '4200'
			peakCutoffSlider.dispatchEvent(new Event('input', { bubbles: true }))
			await app.updateComplete

			const envelopeSummary = this.readText(app, '#filter-envelope-summary')
			const cutoffSummary = this.readText(app, '#filter-cutoff-summary')
			assert(envelopeSummary.includes('125 ms A'), 'Expected changing the attack slider to update the visible envelope summary')
			assert(cutoffSummary.includes('4200 Hz peak'), 'Expected changing the peak cutoff slider to update the visible cutoff summary')
			return { envelopeSummary, cutoffSummary }
		} finally {
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
		}
	}

	@Scenario('switching playback modes keeps keyboard play active while the panel changes')
	static async keepsKeyboardPlayableWhileSwitchingPlaybackModes(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ playbackMode: string, noteState: string, activeKey: string, panelCopy: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			const pluckRadio = app.shadowRoot?.querySelector<HTMLInputElement>('#playback-mode-pluck')
			assert(pluckRadio !== null && pluckRadio !== undefined, 'Expected pluck playback radio button to exist')
			pluckRadio.checked = true
			pluckRadio.dispatchEvent(new Event('change', { bubbles: true }))
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true, cancelable: true }))
			await app.updateComplete

			await waitFor(() => this.readText(app, '#playback-mode-value') === 'Pluck', 'Expected the playback settings panel to switch to Pluck')
			await waitFor(() => this.readText(app, '#active-key-value') === 'Q', 'Expected keyboard play to remain active after switching playback mode')
			const playbackMode = this.readText(app, '#playback-mode-value')
			const noteState = this.readText(app, '#note-state-value')
			const activeKey = this.readText(app, '#active-key-value')
			const panelCopy = this.readText(app, '#playback-settings-mode-copy')

			assert(playbackMode === 'Pluck', 'Expected playback mode label to show Pluck after selecting it')
			assert(noteState === 'Playing', 'Expected note state to remain visibly Playing while the keyboard is used after a mode switch')
			assert(activeKey === 'Q', 'Expected the active key to still reflect keyboard play after switching playback mode')
			assert(panelCopy.includes('Karplus') || panelCopy.includes('string loop'), 'Expected the pluck panel copy to describe the Karplus-Strong string behavior')
			return { playbackMode, noteState, activeKey, panelCopy }
		} finally {
			window.dispatchEvent(new KeyboardEvent('keyup', { key: 'q', bubbles: true, cancelable: true }))
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
		}
	}

	@Scenario('pluck playback settings show damping brightness and noise controls')
	static async showsPluckPlaybackControls(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ summary: string, dampingValue: string, brightnessValue: string, noiseValue: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			const pluckRadio = app.shadowRoot?.querySelector<HTMLInputElement>('#playback-mode-pluck')
			assert(pluckRadio !== null && pluckRadio !== undefined, 'Expected pluck playback radio button to exist')
			pluckRadio.checked = true
			pluckRadio.dispatchEvent(new Event('change', { bubbles: true }))
			await app.updateComplete
			await waitFor(() => this.readText(app, '#playback-mode-value') === 'Pluck', 'Expected playback settings to switch to Pluck before checking the new controls')
			const summary = this.readText(app, '#pluck-settings-summary')
			const dampingValue = this.readTextFromValueContainer(app, '#pluck-damping-slider')
			const brightnessValue = this.readTextFromValueContainer(app, '#pluck-brightness-slider')
			const noiseValue = this.readTextFromValueContainer(app, '#pluck-noise-blend-slider')
			assert(summary.includes('damping') && summary.includes('brightness') && summary.includes('noise'), 'Expected the pluck summary to report damping, brightness, and noise values')
			assert(dampingValue === '58', 'Expected pluck damping slider to show the default value')
			assert(brightnessValue === '72', 'Expected pluck brightness slider to show the default value')
			assert(noiseValue === '18', 'Expected pluck noise blend slider to show the default value')
			return { summary, dampingValue, brightnessValue, noiseValue }
		} finally {
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
		}
	}

	@Scenario('effects settings stay visible below playback settings for every playback mode')
	static async showsAlwaysOnEffectsPanelAcrossPlaybackModes(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ rawLabel: string, cutoffLabel: string, pluckLabel: string, chorusLabel: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			const rawRadio = app.shadowRoot?.querySelector<HTMLInputElement>('#playback-mode-raw')
			const cutoffRadio = app.shadowRoot?.querySelector<HTMLInputElement>('#playback-mode-cutoff')
			const pluckRadio = app.shadowRoot?.querySelector<HTMLInputElement>('#playback-mode-pluck')
			assert(rawRadio !== null && rawRadio !== undefined, 'Expected raw playback radio button to exist')
			assert(cutoffRadio !== null && cutoffRadio !== undefined, 'Expected cutoff playback radio button to exist')
			assert(pluckRadio !== null && pluckRadio !== undefined, 'Expected pluck playback radio button to exist')

			rawRadio.checked = true
			rawRadio.dispatchEvent(new Event('change', { bubbles: true }))
			await waitFor(() => this.readText(app, '#playback-mode-value') === 'Raw', 'Expected playback settings label to switch to Raw')
			const rawLabel = this.readText(app, '#effects-panel-value')

			cutoffRadio.checked = true
			cutoffRadio.dispatchEvent(new Event('change', { bubbles: true }))
			await waitFor(() => this.readText(app, '#playback-mode-value') === 'Cutoff', 'Expected playback settings label to switch to Cutoff')
			const cutoffLabel = this.readText(app, '#effects-panel-value')

			pluckRadio.checked = true
			pluckRadio.dispatchEvent(new Event('change', { bubbles: true }))
			await waitFor(() => this.readText(app, '#playback-mode-value') === 'Pluck', 'Expected playback settings label to switch to Pluck')
			const pluckLabel = this.readText(app, '#effects-panel-value')
			const chorusLabel = app.shadowRoot?.querySelector('.settings-grid .setting-control .status-label')?.textContent?.trim() ?? ''

			assert(rawLabel === 'Always on', 'Expected effects panel to stay visible in raw mode')
			assert(cutoffLabel === 'Always on', 'Expected effects panel to stay visible in cutoff mode')
			assert(pluckLabel === 'Always on', 'Expected effects panel to stay visible in pluck mode')
			assert(chorusLabel === 'Chorus mix', 'Expected effects controls to remain visible below playback settings across modes')
			return { rawLabel, cutoffLabel, pluckLabel, chorusLabel }
		} finally {
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
		}
	}

	@Scenario('uploading an image activates an image row waveform and exposes the row selector')
	static async showsImageRowWaveformControlsAfterUpload(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ uploadedImageName: string, waveform: string, rowValue: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
		const originalCreateObjectUrl = URL.createObjectURL
		const originalRevokeObjectUrl = URL.revokeObjectURL
		const originalImage = (globalThis as Record<string, unknown>)['Image']
		const originalHTMLElement = (globalThis as Record<string, unknown>)['HTMLElement']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		URL.createObjectURL = ((_file: Blob | MediaSource) => this.behavioralPreviewImageUrl) as typeof URL.createObjectURL
		URL.revokeObjectURL = (() => undefined) as typeof URL.revokeObjectURL
			; (globalThis as Record<string, unknown>)['Image'] = this.createBehavioralImageConstructor()
			; (globalThis as Record<string, unknown>)['HTMLElement'] = this.createBehavioralHTMLElementConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			const uploadInput = app.shadowRoot?.querySelector<HTMLInputElement>('#image-upload-input')
			assert(uploadInput !== null && uploadInput !== undefined, 'Expected image upload input to exist')
			this.installCanvasTestDouble()
			const uploadedFile = this.createBehavioralImageFile('panel-reference.svg')
			Object.defineProperty(uploadInput, 'files', {
				configurable: true,
				value: [uploadedFile]
			})
			uploadInput.dispatchEvent(new Event('change', { bubbles: true }))
			await app.updateComplete

			await waitFor(() => this.readText(app, '#waveform-value').startsWith('Row '), 'Expected an uploaded image row waveform to become active')
			const uploadedImageName = this.readText(app, '#uploaded-image-name')
			const waveform = this.readText(app, '#waveform-value')
			const rowValue = this.readText(app, '#waveform-row-value')

			assert(uploadedImageName === 'panel-reference.svg', 'Expected uploaded image file name to be shown')
			assert(waveform.startsWith('Row '), 'Expected waveform card to switch from Sine to a compact uploaded row label')
			assert(rowValue.includes('of 2'), 'Expected row selector to reveal two loaded rows from the canvas image')
			return { uploadedImageName, waveform, rowValue }
		} finally {
			this.restoreCanvasTestDouble()
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
			URL.createObjectURL = originalCreateObjectUrl
			URL.revokeObjectURL = originalRevokeObjectUrl
			if (originalImage === undefined) {
				delete (globalThis as Record<string, unknown>)['Image']
			} else {
				(globalThis as Record<string, unknown>)['Image'] = originalImage
			}
			if (originalHTMLElement === undefined) {
				delete (globalThis as Record<string, unknown>)['HTMLElement']
			} else {
				(globalThis as Record<string, unknown>)['HTMLElement'] = originalHTMLElement
			}
		}
	}

	@Scenario('loop crossfade defaults to ten percent and the waveform preview shows three cycles')
	static async showsLoopCrossfadeControlAndThreeCyclePreview(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ crossfadeValue: string, previewMeta: string, canvasWidth: number, canvasHeight: number }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
		const originalCreateObjectUrl = URL.createObjectURL
		const originalRevokeObjectUrl = URL.revokeObjectURL
		const originalImage = (globalThis as Record<string, unknown>)['Image']
		const originalHTMLElement = (globalThis as Record<string, unknown>)['HTMLElement']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		URL.createObjectURL = ((_file: Blob | MediaSource) => this.behavioralPreviewImageUrl) as typeof URL.createObjectURL
		URL.revokeObjectURL = (() => undefined) as typeof URL.revokeObjectURL
			; (globalThis as Record<string, unknown>)['Image'] = this.createBehavioralImageConstructor()
			; (globalThis as Record<string, unknown>)['HTMLElement'] = this.createBehavioralHTMLElementConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			this.installCanvasTestDouble()
			const uploadInput = app.shadowRoot?.querySelector<HTMLInputElement>('#image-upload-input')
			assert(uploadInput !== null && uploadInput !== undefined, 'Expected image upload input to exist')
			Object.defineProperty(uploadInput, 'files', {
				configurable: true,
				value: [this.createBehavioralImageFile('cycles.svg')]
			})
			uploadInput.dispatchEvent(new Event('change', { bubbles: true }))
			await app.updateComplete
			await waitFor(() => this.readText(app, '#waveform-value').startsWith('Row '), 'Expected an uploaded image row waveform to become active before inspecting the new preview controls')
			await waitFor(() => this.readText(app, '#waveform-crossfade-value').includes('10%'), 'Expected the new loop crossfade control to default to ten percent')

			const crossfadeValue = this.readText(app, '#waveform-crossfade-value')
			const previewMeta = this.readTextFromShadowHost(app, 'image-waveform-preview', '#waveform-preview-meta')
			const previewCanvas = app.shadowRoot?.querySelector('image-waveform-preview')?.shadowRoot?.querySelector<HTMLCanvasElement>('#waveform-preview-canvas')
			assert(previewCanvas !== null && previewCanvas !== undefined, 'Expected the three-cycle waveform preview canvas to render after upload')
			assert(crossfadeValue === '10% seam overlap', 'Expected the loop crossfade value label to default to ten percent')
			assert(previewMeta.includes('10% loop crossfade'), 'Expected the preview metadata to mention the default loop crossfade amount')
			assert(previewCanvas.width === 960, 'Expected the selected waveform preview to widen for three cycles')
			assert(previewCanvas.height === 146, 'Expected the selected waveform preview to become taller for the new three-cycle display')
			return { crossfadeValue, previewMeta, canvasWidth: previewCanvas.width, canvasHeight: previewCanvas.height }
		} finally {
			this.restoreCanvasTestDouble()
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
			URL.createObjectURL = originalCreateObjectUrl
			URL.revokeObjectURL = originalRevokeObjectUrl
			if (originalImage === undefined) {
				delete (globalThis as Record<string, unknown>)['Image']
			} else {
				(globalThis as Record<string, unknown>)['Image'] = originalImage
			}
			if (originalHTMLElement === undefined) {
				delete (globalThis as Record<string, unknown>)['HTMLElement']
			} else {
				(globalThis as Record<string, unknown>)['HTMLElement'] = originalHTMLElement
			}
		}
	}

	@Scenario('moving the loop crossfade slider updates the visible preview seam amount')
	static async updatesLoopCrossfadePreview(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ crossfadeValue: string, previewMeta: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
		const originalCreateObjectUrl = URL.createObjectURL
		const originalRevokeObjectUrl = URL.revokeObjectURL
		const originalImage = (globalThis as Record<string, unknown>)['Image']
		const originalHTMLElement = (globalThis as Record<string, unknown>)['HTMLElement']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		URL.createObjectURL = ((_file: Blob | MediaSource) => this.behavioralPreviewImageUrl) as typeof URL.createObjectURL
		URL.revokeObjectURL = (() => undefined) as typeof URL.revokeObjectURL
			; (globalThis as Record<string, unknown>)['Image'] = this.createBehavioralImageConstructor()
			; (globalThis as Record<string, unknown>)['HTMLElement'] = this.createBehavioralHTMLElementConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			this.installCanvasTestDouble()
			const uploadInput = app.shadowRoot?.querySelector<HTMLInputElement>('#image-upload-input')
			assert(uploadInput !== null && uploadInput !== undefined, 'Expected image upload input to exist')
			Object.defineProperty(uploadInput, 'files', {
				configurable: true,
				value: [this.createBehavioralImageFile('crossfade.svg')]
			})
			uploadInput.dispatchEvent(new Event('change', { bubbles: true }))
			await app.updateComplete
			await waitFor(() => this.readText(app, '#waveform-value').startsWith('Row '), 'Expected an uploaded image row waveform to become active before moving the loop crossfade slider')
			await waitFor(() => this.readText(app, '#waveform-crossfade-value').includes('10%'), 'Expected the loop crossfade control to render at the new default before adjusting it')

			const crossfadeSlider = app.shadowRoot?.querySelector<HTMLElement & { value: string }>('#waveform-crossfade-slider')
			assert(crossfadeSlider !== null && crossfadeSlider !== undefined, 'Expected loop crossfade knob to exist')
			crossfadeSlider.value = '50'
			crossfadeSlider.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
			await app.updateComplete
			await waitFor(() => this.readText(app, '#waveform-crossfade-value') === '50% seam overlap', 'Expected the loop crossfade value label to update when the slider moves')

			const crossfadeValue = this.readText(app, '#waveform-crossfade-value')
			const previewMeta = this.readTextFromShadowHost(app, 'image-waveform-preview', '#waveform-preview-meta')
			assert(crossfadeValue === '50% seam overlap', 'Expected the loop crossfade value to reflect the slider movement')
			assert(previewMeta.includes('50% loop crossfade'), 'Expected the selected waveform preview metadata to follow the loop crossfade slider')
			return { crossfadeValue, previewMeta }
		} finally {
			this.restoreCanvasTestDouble()
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
			URL.createObjectURL = originalCreateObjectUrl
			URL.revokeObjectURL = originalRevokeObjectUrl
			if (originalImage === undefined) {
				delete (globalThis as Record<string, unknown>)['Image']
			} else {
				(globalThis as Record<string, unknown>)['Image'] = originalImage
			}
			if (originalHTMLElement === undefined) {
				delete (globalThis as Record<string, unknown>)['HTMLElement']
			} else {
				(globalThis as Record<string, unknown>)['HTMLElement'] = originalHTMLElement
			}
		}
	}

	@Scenario('row randomness defaults to 5 percent and its slider exposes the nearby range control')
	static async showsRowRandomnessControlDefault(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ randomnessValue: string, sliderValue: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
		const originalCreateObjectUrl = URL.createObjectURL
		const originalRevokeObjectUrl = URL.revokeObjectURL
		const originalImage = (globalThis as Record<string, unknown>)['Image']
		const originalHTMLElement = (globalThis as Record<string, unknown>)['HTMLElement']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		URL.createObjectURL = ((_file: Blob | MediaSource) => this.behavioralPreviewImageUrl) as typeof URL.createObjectURL
		URL.revokeObjectURL = (() => undefined) as typeof URL.revokeObjectURL
			; (globalThis as Record<string, unknown>)['Image'] = this.createBehavioralImageConstructor()
			; (globalThis as Record<string, unknown>)['HTMLElement'] = this.createBehavioralHTMLElementConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			this.installCanvasTestDouble()
			const uploadInput = app.shadowRoot?.querySelector<HTMLInputElement>('#image-upload-input')
			assert(uploadInput !== null && uploadInput !== undefined, 'Expected image upload input to exist')
			Object.defineProperty(uploadInput, 'files', {
				configurable: true,
				value: [this.createBehavioralImageFile('randomness-default.svg')]
			})
			uploadInput.dispatchEvent(new Event('change', { bubbles: true }))
			await app.updateComplete
			await waitFor(() => this.readText(app, '#waveform-row-randomness-value') === '5% nearby row range', 'Expected row randomness to default to 5 percent after an image upload')
			const randomnessValue = this.readText(app, '#waveform-row-randomness-value')
			const sliderValue = this.readTextFromValueContainer(app, '#waveform-row-randomness-slider')
			assert(randomnessValue === '5% nearby row range', 'Expected the visible row randomness label to start at 5 percent')
			assert(sliderValue === '5', 'Expected the row randomness knob value to start at 5')
			return { randomnessValue, sliderValue }
		} finally {
			this.restoreCanvasTestDouble()
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
			URL.createObjectURL = originalCreateObjectUrl
			URL.revokeObjectURL = originalRevokeObjectUrl
			if (originalImage === undefined) {
				delete (globalThis as Record<string, unknown>)['Image']
			} else {
				(globalThis as Record<string, unknown>)['Image'] = originalImage
			}
			if (originalHTMLElement === undefined) {
				delete (globalThis as Record<string, unknown>)['HTMLElement']
			} else {
				(globalThis as Record<string, unknown>)['HTMLElement'] = originalHTMLElement
			}
		}
	}

	@Scenario('a new key press can jump to a nearby uploaded row when row randomness is enabled')
	static async randomizesNearbyRowOnNewKeyPress(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ rowValue: string, waveform: string, triggerCount: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
		const originalCreateObjectUrl = URL.createObjectURL
		const originalRevokeObjectUrl = URL.revokeObjectURL
		const originalImage = (globalThis as Record<string, unknown>)['Image']
		const originalHTMLElement = (globalThis as Record<string, unknown>)['HTMLElement']
		const originalMathRandom = Math.random
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		URL.createObjectURL = ((_file: Blob | MediaSource) => this.behavioralPreviewImageUrl) as typeof URL.createObjectURL
		URL.revokeObjectURL = (() => undefined) as typeof URL.revokeObjectURL
			; (globalThis as Record<string, unknown>)['Image'] = this.createBehavioralImageConstructor()
			; (globalThis as Record<string, unknown>)['HTMLElement'] = this.createBehavioralHTMLElementConstructor()
		Math.random = (() => 0.75) as typeof Math.random
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			this.installCanvasTestDouble()
			const uploadInput = app.shadowRoot?.querySelector<HTMLInputElement>('#image-upload-input')
			assert(uploadInput !== null && uploadInput !== undefined, 'Expected image upload input to exist')
			Object.defineProperty(uploadInput, 'files', {
				configurable: true,
				value: [this.createBehavioralImageFile('randomness-jump.svg')]
			})
			uploadInput.dispatchEvent(new Event('change', { bubbles: true }))
			await app.updateComplete
			await waitFor(() => this.readText(app, '#waveform-row-value').includes('of 2'), 'Expected the row selector to become available before enabling row randomness')
			const rowSlider = app.shadowRoot?.querySelector<HTMLInputElement>('#waveform-row-slider')
			const randomnessSlider = app.shadowRoot?.querySelector<HTMLElement & { value: string }>('#waveform-row-randomness-slider')
			assert(rowSlider !== null && rowSlider !== undefined, 'Expected waveform row slider to exist')
			assert(randomnessSlider !== null && randomnessSlider !== undefined, 'Expected waveform row randomness knob to exist')
			rowSlider.value = '0'
			rowSlider.dispatchEvent(new Event('input', { bubbles: true }))
			randomnessSlider.value = '10'
			randomnessSlider.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true, cancelable: true }))
			await app.updateComplete
			await waitFor(() => this.readText(app, '#waveform-row-value') === 'Row 2 of 2', 'Expected the next key press to jump to a nearby row when randomness is enabled')
			const rowValue = this.readText(app, '#waveform-row-value')
			const waveform = this.readText(app, '#waveform-value')
			const triggerCount = this.readText(app, '#trigger-count-value')
			assert(rowValue === 'Row 2 of 2', 'Expected row randomness to move from the first row to the nearby second row on the next key press')
			assert(waveform === 'Row 2', 'Expected the visible waveform label to follow the randomized row jump')
			assert(triggerCount === '1', 'Expected the key press that randomized the row to still count as one trigger')
			return { rowValue, waveform, triggerCount }
		} finally {
			window.dispatchEvent(new KeyboardEvent('keyup', { key: 'q', bubbles: true, cancelable: true }))
			this.restoreCanvasTestDouble()
			Math.random = originalMathRandom
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
			URL.createObjectURL = originalCreateObjectUrl
			URL.revokeObjectURL = originalRevokeObjectUrl
			if (originalImage === undefined) {
				delete (globalThis as Record<string, unknown>)['Image']
			} else {
				(globalThis as Record<string, unknown>)['Image'] = originalImage
			}
			if (originalHTMLElement === undefined) {
				delete (globalThis as Record<string, unknown>)['HTMLElement']
			} else {
				(globalThis as Record<string, unknown>)['HTMLElement'] = originalHTMLElement
			}
		}
	}

	@Scenario('moving the row selector changes the visible active image row while keyboard play still works')
	static async changesSelectedImageRowAndKeepsKeyboardPlayable(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ waveform: string, rowValue: string, previewMeta: string, selectedRowLineTop: string, activeKey: string, noteState: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
		const originalCreateObjectUrl = URL.createObjectURL
		const originalRevokeObjectUrl = URL.revokeObjectURL
		const originalImage = (globalThis as Record<string, unknown>)['Image']
		const originalHTMLElement = (globalThis as Record<string, unknown>)['HTMLElement']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		URL.createObjectURL = ((_file: Blob | MediaSource) => this.behavioralPreviewImageUrl) as typeof URL.createObjectURL
		URL.revokeObjectURL = (() => undefined) as typeof URL.revokeObjectURL
			; (globalThis as Record<string, unknown>)['Image'] = this.createBehavioralImageConstructor()
			; (globalThis as Record<string, unknown>)['HTMLElement'] = this.createBehavioralHTMLElementConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			this.installCanvasTestDouble()
			const uploadInput = app.shadowRoot?.querySelector<HTMLInputElement>('#image-upload-input')
			assert(uploadInput !== null && uploadInput !== undefined, 'Expected image upload input to exist')
			Object.defineProperty(uploadInput, 'files', {
				configurable: true,
				value: [this.createBehavioralImageFile('rows.svg')]
			})
			uploadInput.dispatchEvent(new Event('change', { bubbles: true }))
			await app.updateComplete
			await waitFor(() => this.readText(app, '#waveform-row-value').includes('of 2'), 'Expected row slider to become active after upload')

			const slider = app.shadowRoot?.querySelector<HTMLInputElement>('#waveform-row-slider')
			const randomnessSlider = app.shadowRoot?.querySelector<HTMLElement & { value: string }>('#waveform-row-randomness-slider')
			assert(slider !== null && slider !== undefined, 'Expected waveform row slider to exist')
			assert(randomnessSlider !== null && randomnessSlider !== undefined, 'Expected waveform row randomness knob to exist')
			randomnessSlider.value = '0'
			randomnessSlider.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
			slider.value = '1'
			slider.dispatchEvent(new Event('input', { bubbles: true }))
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true, cancelable: true }))
			await app.updateComplete

			await waitFor(() => this.readText(app, '#active-key-value') === 'Q', 'Expected QWERTY keyboard playback to remain active after selecting an image row')
			const waveform = this.readText(app, '#waveform-value')
			const rowValue = this.readText(app, '#waveform-row-value')
			const previewMeta = this.readTextFromShadowHost(app, 'image-waveform-preview', '#waveform-preview-meta')
			const previewCanvas = app.shadowRoot?.querySelector('image-waveform-preview')?.shadowRoot?.querySelector<HTMLCanvasElement>('#waveform-preview-canvas')
			const selectedRowLineTop = this.readStyleFromShadowHost(app, 'uploaded-image-preview', '#selected-row-line', 'top')
			const activeKey = this.readText(app, '#active-key-value')
			const noteState = this.readText(app, '#note-state-value')

			assert(waveform === 'Row 2', 'Expected moving the slider to activate the second image row with the compact label')
			assert(rowValue === 'Row 2 of 2', 'Expected row status text to follow the slider')
			assert(previewMeta.includes('Row 2 of 2'), 'Expected the visible waveform preview metadata to follow the selected row')
			assert(previewCanvas !== null && previewCanvas !== undefined, 'Expected the waveform preview canvas to render below the uploaded image')
			assert(previewCanvas.width > 0 && previewCanvas.height > 0, 'Expected the waveform preview canvas to be sized for drawing')
			assert(selectedRowLineTop === '75%', 'Expected the selected-row line to move to the center of the second row out of two')
			assert(activeKey === 'Q', 'Expected keyboard control to remain playable after selecting a new image row')
			assert(noteState === 'Playing', 'Expected a played key to keep the synth visibly playing after image upload')
			return { waveform, rowValue, previewMeta, selectedRowLineTop, activeKey, noteState }
		} finally {
			window.dispatchEvent(new KeyboardEvent('keyup', { key: 'q', bubbles: true, cancelable: true }))
			this.restoreCanvasTestDouble()
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
			URL.createObjectURL = originalCreateObjectUrl
			URL.revokeObjectURL = originalRevokeObjectUrl
			if (originalImage === undefined) {
				delete (globalThis as Record<string, unknown>)['Image']
			} else {
				(globalThis as Record<string, unknown>)['Image'] = originalImage
			}
			if (originalHTMLElement === undefined) {
				delete (globalThis as Record<string, unknown>)['HTMLElement']
			} else {
				(globalThis as Record<string, unknown>)['HTMLElement'] = originalHTMLElement
			}
		}
	}

	@Scenario('pitch card shows only frequency because active note is already listed separately')
	static async showsPitchCardAsFrequencyOnly(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ activeNote: string, pitch: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true, cancelable: true }))
			await app.updateComplete
			await waitFor(() => this.readText(app, '#pitch-value') === '65.41 Hz', 'Expected the pitch card to show only the played frequency for Q at the default octave')

			const activeNote = this.readText(app, '#active-note-value')
			const pitch = this.readText(app, '#pitch-value')
			assert(activeNote === 'C2', 'Expected the active note card to keep showing the note label separately')
			assert(pitch === '65.41 Hz', 'Expected the pitch card to omit duplicated note text and show only frequency')
			return { activeNote, pitch }
		} finally {
			window.dispatchEvent(new KeyboardEvent('keyup', { key: 'q', bubbles: true, cancelable: true }))
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
		}
	}

	@Scenario('octave corner buttons shift the QWERTY guide and active played note up and down')
	static async shiftsKeyboardOctaveFromCornerButtons(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ loweredGuide: string, raisedGuide: string, loweredNote: string, raisedNote: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
			; (globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			const octaveDownButton = app.shadowRoot?.querySelector<HTMLButtonElement>('#keyboard-octave-down-button')
			const octaveUpButton = app.shadowRoot?.querySelector<HTMLButtonElement>('#keyboard-octave-up-button')
			assert(octaveDownButton !== null && octaveDownButton !== undefined, 'Expected the lower-left octave down button to exist')
			assert(octaveUpButton !== null && octaveUpButton !== undefined, 'Expected the lower-left octave up button to exist')

			octaveDownButton.click()
			await app.updateComplete
			await waitFor(() => this.readText(app, '#keyboard-row-top-value').includes('C1 to E2'), 'Expected the upper keyboard guide to move down one octave after clicking the down button')
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true, cancelable: true }))
			await app.updateComplete
			await waitFor(() => this.readText(app, '#active-note-value') === 'C1', 'Expected Q to play C1 after lowering the keyboard octave')
			const loweredGuide = this.readText(app, '#keyboard-row-top-value')
			const loweredNote = this.readText(app, '#active-note-value')

			window.dispatchEvent(new KeyboardEvent('keyup', { key: 'q', bubbles: true, cancelable: true }))
			octaveUpButton.click()
			await app.updateComplete
			await waitFor(() => this.readText(app, '#keyboard-row-top-value').includes('C2 to E3'), 'Expected the upper keyboard guide to return to the new default octave after clicking the up button')
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true, cancelable: true }))
			await app.updateComplete
			await waitFor(() => this.readText(app, '#active-note-value') === 'C2', 'Expected Q to play C2 again after raising the keyboard octave')
			const raisedGuide = this.readText(app, '#keyboard-row-top-value')
			const raisedNote = this.readText(app, '#active-note-value')

			assert(loweredGuide.includes('C1 to E2'), 'Expected the visible upper-row guide to reflect the lowered octave range')
			assert(raisedGuide.includes('C2 to E3'), 'Expected the visible upper-row guide to reflect the restored default octave range')
			assert(loweredNote === 'C1', 'Expected the played Q note to follow the lowered octave mapping')
			assert(raisedNote === 'C2', 'Expected the played Q note to follow the raised octave mapping')
			return { loweredGuide, raisedGuide, loweredNote, raisedNote }
		} finally {
			window.dispatchEvent(new KeyboardEvent('keyup', { key: 'q', bubbles: true, cancelable: true }))
			if (originalAudioContext === undefined) {
				delete (globalThis as Record<string, unknown>)['AudioContext']
			} else {
				(globalThis as Record<string, unknown>)['AudioContext'] = originalAudioContext
			}
		}
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}

	@Spec('Provides a local waitFor fallback when the scenario runner omits helper functions.')
	private static async failFastWaitFor(predicate: () => boolean | Promise<boolean>, message: string): Promise<void> {
		const passed = await predicate()
		if (passed === false) {
			throw new Error(message)
		}
	}

	@Spec('Waits for app shadow DOM, visible status cards, and the startup image initialization attempt needed before scenarios interact with live controls.')
	private static async prepareMountedApp(app: App, waitFor: WaitForFn): Promise<void> {
		await waitFor(() => app.shadowRoot !== null, 'Expected app shadow DOM to render')
		await app.updateComplete
		await waitFor(() => this.readText(app, '#voice-mode-value').length > 0, 'Expected voice mode card to render visible text')
		await waitFor(() => app.hasCompletedDefaultImageInitialization, 'Expected the default synthesizer image initialization attempt to finish before scenarios interact with the mounted app')
		await app.updateComplete
	}

	@Spec('Reads visible text from one element inside the app shadow DOM.')
	private static readText(app: App, selector: string): string {
		const element = app.shadowRoot?.querySelector<HTMLElement>(selector)
		if (element === null || element === undefined) {
			throw new Error(`App element not found: ${selector}`)
		}
		return element.textContent?.trim() ?? ''
	}

	@Spec('Reads visible text from one nested shadow host inside the app so behavioral scenarios can inspect custom element output.')
	private static readTextFromShadowHost(app: App, hostSelector: string, innerSelector: string): string {
		const host = app.shadowRoot?.querySelector<HTMLElement>(hostSelector)
		if (host === null || host === undefined) {
			throw new Error(`App shadow host not found: ${hostSelector}`)
		}
		const element = host.shadowRoot?.querySelector<HTMLElement>(innerSelector)
		if (element === null || element === undefined) {
			throw new Error(`Nested shadow element not found: ${hostSelector} -> ${innerSelector}`)
		}
		return element.textContent?.trim() ?? ''
	}

	@Spec('Reads one control value from the app shadow DOM so behavioral scenarios can verify visible slider and knob defaults.')
	private static readTextFromValueContainer(app: App, selector: string): string {
		const input = app.shadowRoot?.querySelector<HTMLElement & { value?: string }>(selector)
		if (input === null || input === undefined) {
			throw new Error(`App control not found: ${selector}`)
		}
		return input.value ?? ''
	}

	@Spec('Reads one inline style property from a nested shadow host element inside the app for visible behavioral UI checks.')
	private static readStyleFromShadowHost(app: App, hostSelector: string, innerSelector: string, propertyName: 'top'): string {
		const host = app.shadowRoot?.querySelector<HTMLElement>(hostSelector)
		if (host === null || host === undefined) {
			throw new Error(`App shadow host not found: ${hostSelector}`)
		}
		const element = host.shadowRoot?.querySelector<HTMLElement>(innerSelector)
		if (element === null || element === undefined) {
			throw new Error(`Nested shadow element not found: ${hostSelector} -> ${innerSelector}`)
		}
		return element.style[propertyName]
	}

	@Spec('Installs a tiny canvas test double that exposes deterministic image rows for behavioral upload scenarios.')
	private static installCanvasTestDouble() {
		const originalCreateElement = document.createElement.bind(document)
			; (document as unknown as { __scanlineOriginalCreateElement?: typeof document.createElement }).__scanlineOriginalCreateElement = originalCreateElement
		document.createElement = ((tagName: string, options?: ElementCreationOptions) => {
			if (tagName.toLowerCase() !== 'canvas') {
				return originalCreateElement(tagName, options)
			}
			const canvas = originalCreateElement('canvas', options)
			const context = {
				drawImage: () => undefined,
				getImageData: () => new ImageData(
					new Uint8ClampedArray([
						255, 255, 255, 255, 0, 0, 0, 255,
						0, 0, 0, 255, 255, 255, 255, 255
					]),
					2,
					2
				)
			}
			Object.defineProperty(canvas, 'getContext', {
				configurable: true,
				value: () => context
			})
			return canvas
		}) as typeof document.createElement
	}

	@Spec('Restores the browser createElement implementation after one behavioral upload scenario completes.')
	private static restoreCanvasTestDouble() {
		const originalCreateElement = (document as unknown as { __scanlineOriginalCreateElement?: typeof document.createElement }).__scanlineOriginalCreateElement
		if (originalCreateElement === undefined) {
			return
		}
		document.createElement = originalCreateElement
		delete (document as unknown as { __scanlineOriginalCreateElement?: typeof document.createElement }).__scanlineOriginalCreateElement
	}

	@Spec('Creates a tiny AudioContext constructor usable by behavioral app scenarios.')
	private static createBehavioralAudioContextConstructor(): new () => AudioContext {
		return class implements Partial<AudioContext> {
			state: AudioContextState = 'running'
			currentTime = 0
			destination = {} as AudioDestinationNode
			async resume(): Promise<void> {
				return undefined
			}
			createPeriodicWave(): PeriodicWave {
				return {} as PeriodicWave
			}
			createBiquadFilter(): BiquadFilterNode {
				const frequency = {
					value: 0,
					cancelScheduledValues: () => { },
					setValueAtTime(value: number) {
						this.value = value
						return this
					},
					linearRampToValueAtTime(value: number) {
						this.value = value
						return this
					}
				}
				const quality = {
					value: 0,
					setValueAtTime(value: number) {
						this.value = value
						return this
					}
				}
				return {
					type: 'lowpass',
					frequency: frequency as unknown as AudioParam,
					Q: quality as unknown as AudioParam,
					connect: () => { },
					disconnect: () => { }
				} as unknown as BiquadFilterNode
			}
			createDelay(): DelayNode {
				const delayTime = {
					value: 0,
					cancelScheduledValues: () => { },
					setValueAtTime(value: number) {
						this.value = value
						return this
					},
					linearRampToValueAtTime(value: number) {
						this.value = value
						return this
					}
				}
				return {
					delayTime: delayTime as unknown as AudioParam,
					connect: () => { },
					disconnect: () => { }
				} as unknown as DelayNode
			}
			createOscillator(): OscillatorNode {
				const frequency = {
					value: 0,
					cancelScheduledValues: () => { },
					setValueAtTime(value: number) {
						this.value = value
						return this
					},
					linearRampToValueAtTime(value: number) {
						this.value = value
						return this
					}
				}
				const oscillator = {
					type: 'sine',
					frequency: frequency,
					onended: null as (() => void) | null,
					connect: () => { },
					disconnect: () => { },
					start: () => { },
					setPeriodicWave: () => { },
					stop() {
						oscillator.onended?.()
					}
				}
				return oscillator as unknown as OscillatorNode
			}
			createGain(): GainNode {
				const gain = {
					value: 0,
					cancelScheduledValues: () => { },
					setValueAtTime(value: number) {
						this.value = value
						return this
					},
					linearRampToValueAtTime(value: number) {
						this.value = value
						return this
					},
					exponentialRampToValueAtTime(value: number) {
						this.value = value
						return this
					}
				}
				return {
					gain,
					connect: () => { },
					disconnect: () => { }
				} as unknown as GainNode
			}
			createScriptProcessor(): ScriptProcessorNode {
				return {
					connect: () => { },
					disconnect: () => { },
					onaudioprocess: null
				} as unknown as ScriptProcessorNode
			}
		} as unknown as new () => AudioContext
	}

	@Spec('Creates one small synthetic image file so upload scenarios show a visible preview instead of an empty placeholder blob.')
	private static createBehavioralImageFile(fileName: string): File {
		return new File([this.behavioralPreviewImageSvg], fileName, { type: 'image/svg+xml' })
	}

	@Spec('Creates a tiny image constructor that reports a decoded 2x2 image immediately for behavioral upload scenarios.')
	private static createBehavioralImageConstructor(): new () => HTMLImageElement {
		return class {
			naturalWidth = 2
			naturalHeight = 2
			onload: (() => void) | null = null
			onerror: (() => void) | null = null
			set src(_value: string) {
				this.onload?.()
			}
		} as unknown as new () => HTMLImageElement
	}

	private static readonly behavioralPreviewImageSvg: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">
		<defs>
			<linearGradient id="scanlineGradient" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stop-color="#2a1b12"/>
				<stop offset="45%" stop-color="#d86d33"/>
				<stop offset="100%" stop-color="#8bf0a4"/>
			</linearGradient>
		</defs>
		<rect width="320" height="180" rx="20" fill="#1a120d"/>
		<rect x="10" y="10" width="300" height="160" rx="16" fill="url(#scanlineGradient)" opacity="0.85"/>
		<path d="M20 118 C60 82, 98 140, 138 100 S214 66, 300 116" fill="none" stroke="#f7e1b2" stroke-width="8" stroke-linecap="round"/>
		<path d="M20 138 C74 160, 128 84, 184 116 S246 152, 300 86" fill="none" stroke="#101514" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
		<text x="24" y="42" fill="#f7e1b2" font-size="18" font-family="monospace">SCANLINE TEST PREVIEW</text>
		<text x="24" y="66" fill="#d6ffd9" font-size="12" font-family="monospace">synthetic upload image</text>
	</svg>`
	private static readonly behavioralPreviewImageUrl: string = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20320%20180%22%3E%0A%09%09%3Cdefs%3E%0A%09%09%09%3ClinearGradient%20id%3D%22scanlineGradient%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%0A%09%09%09%09%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%232a1b12%22%2F%3E%0A%09%09%09%09%3Cstop%20offset%3D%2245%25%22%20stop-color%3D%22%23d86d33%22%2F%3E%0A%09%09%09%09%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%238bf0a4%22%2F%3E%0A%09%09%09%3C%2FlinearGradient%3E%0A%09%09%3C%2Fdefs%3E%0A%09%09%3Crect%20width%3D%22320%22%20height%3D%22180%22%20rx%3D%2220%22%20fill%3D%22%231a120d%22%2F%3E%0A%09%09%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%22300%22%20height%3D%22160%22%20rx%3D%2216%22%20fill%3D%22url(%23scanlineGradient)%22%20opacity%3D%220.85%22%2F%3E%0A%09%09%3Cpath%20d%3D%22M20%20118%20C60%2082%2C%2098%20140%2C%20138%20100%20S214%2066%2C%20300%20116%22%20fill%3D%22none%22%20stroke%3D%22%23f7e1b2%22%20stroke-width%3D%228%22%20stroke-linecap%3D%22round%22%2F%3E%0A%09%09%3Cpath%20d%3D%22M20%20138%20C74%20160%2C%20128%2084%2C%20184%20116%20S246%20152%2C%20300%2086%22%20fill%3D%22none%22%20stroke%3D%22%23101514%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%20opacity%3D%220.8%22%2F%3E%0A%09%09%3Ctext%20x%3D%2224%22%20y%3D%2242%22%20fill%3D%22%23f7e1b2%22%20font-size%3D%2218%22%20font-family%3D%22monospace%22%3ESCANLINE%20TEST%20PREVIEW%3C%2Ftext%3E%0A%09%09%3Ctext%20x%3D%2224%22%20y%3D%2266%22%20fill%3D%22%23d6ffd9%22%20font-size%3D%2212%22%20font-family%3D%22monospace%22%3Esynthetic%20upload%20image%3C%2Ftext%3E%0A%09%3C%2Fsvg%3E'

	@Spec('Creates a tiny HTMLElement constructor so behavioral subject creation can succeed in headless client-tunnel runs.')
	private static createBehavioralHTMLElementConstructor(): new () => HTMLElement {
		return class {
		} as unknown as new () => HTMLElement
	}

}
