import './App.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory, WaitForFn } from '@shared/lll.lll'
import { App } from './App.lll'

@Spec('Exercises the Scanline Synth app only through visible UI and keyboard interactions.')
export class AppTest {
	testType = 'behavioral'

	@Scenario('polyphonic mode shows two sounding voices for Q then W')
	static async showsPolyphonicVoiceCountForTwoHeldKeys(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ voiceMode: string, soundingVoices: string, activeKey: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
		;(globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true, cancelable: true }))
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', bubbles: true, cancelable: true }))
			await app.updateComplete

			await waitFor(() => this.readText(app, '#sounding-voices-value') === '2', 'Expected two sounding voices after holding Q and W in polyphonic mode')
			const voiceMode = this.readText(app, '#voice-mode-value')
			const soundingVoices = this.readText(app, '#sounding-voices-value')
			const activeKey = this.readText(app, '#active-key-value')

			assert(voiceMode === 'Polyphonic', 'Expected the app to remain in polyphonic mode by default')
			assert(soundingVoices === '2', 'Expected two sounding voices to be visible')
			assert(activeKey === 'W', 'Expected the newest held key to become active')
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

	@Scenario('switching monophonic mode collapses held keys to one sounding voice')
	static async collapsesHeldKeysWhenMonophonicModeIsEnabled(subjectFactory: SubjectFactory<App>, scenario?: ScenarioParameter): Promise<{ toggleValue: string, voiceMode: string, soundingVoices: string, noteState: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const originalAudioContext = (globalThis as Record<string, unknown>)['AudioContext']
		;(globalThis as Record<string, unknown>)['AudioContext'] = this.createBehavioralAudioContextConstructor()
		try {
			const app = await subjectFactory()
			await this.prepareMountedApp(app, waitFor)
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true, cancelable: true }))
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', bubbles: true, cancelable: true }))
			const toggle = app.shadowRoot?.querySelector<HTMLInputElement>('#monophonic-toggle')
			assert(toggle !== null && toggle !== undefined, 'Expected monophonic toggle to exist')
			toggle.checked = true
			toggle.dispatchEvent(new Event('change', { bubbles: true }))
			await app.updateComplete

			await waitFor(() => this.readText(app, '#sounding-voices-value') === '1', 'Expected monophonic mode to collapse visible sounding voices to one')
			const toggleValue = this.readText(app, '#monophonic-toggle-value')
			const voiceMode = this.readText(app, '#voice-mode-value')
			const soundingVoices = this.readText(app, '#sounding-voices-value')
			const noteState = this.readText(app, '#note-state-value')

			assert(toggleValue === 'On', 'Expected the visible monophonic toggle label to turn On')
			assert(voiceMode === 'Monophonic', 'Expected voice mode card to show Monophonic')
			assert(soundingVoices === '1', 'Expected only one sounding voice in monophonic mode with overlapping keys held')
			assert(noteState === 'Playing', 'Expected note state to remain visibly Playing while a note is sounding')
			return { toggleValue, voiceMode, soundingVoices, noteState }
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

	@Spec('Waits for app shadow DOM and the visible status cards needed by the scenarios.')
	private static async prepareMountedApp(app: App, waitFor: WaitForFn): Promise<void> {
		await waitFor(() => app.shadowRoot !== null, 'Expected app shadow DOM to render')
		await app.updateComplete
		await waitFor(() => this.readText(app, '#voice-mode-value').length > 0, 'Expected voice mode card to render visible text')
	}

	@Spec('Reads visible text from one element inside the app shadow DOM.')
	private static readText(app: App, selector: string): string {
		const element = app.shadowRoot?.querySelector<HTMLElement>(selector)
		if (element === null || element === undefined) {
			throw new Error(`App element not found: ${selector}`)
		}
		return element.textContent?.trim() ?? ''
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
			createOscillator(): OscillatorNode {
				const oscillator = {
					type: 'sine',
					frequency: { value: 0 },
					onended: null as (() => void) | null,
					connect: () => {},
					disconnect: () => {},
					start: () => {},
					stop() {
						oscillator.onended?.()
					}
				}
				return oscillator as unknown as OscillatorNode
			}
			createGain(): GainNode {
				const gain = {
					value: 0,
					cancelScheduledValues: () => {},
					setValueAtTime(value: number) {
						this.value = value
					},
					linearRampToValueAtTime(value: number) {
						this.value = value
					},
					exponentialRampToValueAtTime(value: number) {
						this.value = value
					}
				}
				return {
					gain,
					connect: () => {},
					disconnect: () => {}
				} as unknown as GainNode
			}
		} as unknown as new () => AudioContext
	}
}
