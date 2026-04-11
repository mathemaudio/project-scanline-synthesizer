import { Spec } from '@shared/lll.lll'

@Spec('Provides a minimal browser sine-wave synth voice engine that can choose monophonic or polyphonic playback.')
export class PrimitiveSynth {
	private readonly attackDurationSeconds: number
	private readonly releaseDurationSeconds: number
	private readonly defaultFrequencyHz: number
	private readonly createAudioContext: () => AudioContext | null
	private readonly onStateChange: ((state: 'ready' | 'playing' | 'releasing' | 'unsupported') => void) | null
	private readonly scheduleTimeout: (callback: () => void, delayMs: number) => number
	private readonly cancelTimeout: (timeoutId: number) => void
	private audioContext: AudioContext | null = null
	private readonly activeVoicesByFrequencyKey: Map<string, { frequencyHz: number, oscillator: OscillatorNode, gainNode: GainNode }> = new Map()
	private pendingReadyTimeoutId: number | null = null
	private requestVersion: number = 0
	private isMonophonic: boolean

	constructor(
		options: {
			attackDurationSeconds?: number
			releaseDurationSeconds?: number
			frequencyHz?: number
			monophonic?: boolean
			createAudioContext?: () => AudioContext | null
			onStateChange?: (state: 'ready' | 'playing' | 'releasing' | 'unsupported') => void
			scheduleTimeout?: (callback: () => void, delayMs: number) => number
			cancelTimeout?: (timeoutId: number) => void
		} = {}
	) {
		Spec('Configures the primitive synth with audio creation hooks, voice mode, and short envelope timings.')
		this.attackDurationSeconds = options.attackDurationSeconds ?? 0.04
		this.releaseDurationSeconds = options.releaseDurationSeconds ?? 0.12
		this.defaultFrequencyHz = options.frequencyHz ?? 440
		this.isMonophonic = options.monophonic ?? false
		this.createAudioContext = options.createAudioContext ?? (() => this.createBrowserAudioContext())
		this.onStateChange = options.onStateChange ?? null
		this.scheduleTimeout = options.scheduleTimeout ?? ((callback, delayMs) => globalThis.setTimeout(callback, delayMs))
		this.cancelTimeout = options.cancelTimeout ?? ((timeoutId) => globalThis.clearTimeout(timeoutId))
	}

	@Spec('Switches the synth between monophonic note selection and polyphonic chord playback.')
	setMonophonic(isMonophonic: boolean) {
		this.isMonophonic = isMonophonic
	}

	@Spec('Reports how many voices are currently sounding so the UI can reflect the synth engine output.')
	getActiveVoiceCount(): number {
		return this.activeVoicesByFrequencyKey.size
	}

	@Spec('Starts or retriggers the synth note with a sine oscillator and short attack envelope.')
	async startNote(frequencyHz: number = this.defaultFrequencyHz): Promise<boolean> {
		return this.syncNotes([frequencyHz])
	}

	@Spec('Synchronizes the synth with all currently held pitches and lets the synth decide mono or poly playback.')
	async syncNotes(frequenciesHz: number[]): Promise<boolean> {
		const requestVersion = this.requestVersion + 1
		this.requestVersion = requestVersion
		const targetFrequencies = this.selectTargetFrequencies(frequenciesHz)
		if (targetFrequencies.length === 0) {
			return this.releaseVoices()
		}

		const audioContext = this.ensureAudioContext()
		if (audioContext === null) {
			this.emitStateChange('unsupported')
			return false
		}

		this.cancelPendingReadyState()
		if (audioContext.state === 'suspended') {
			await audioContext.resume()
		}

		if (this.requestVersion !== requestVersion) {
			return false
		}

		this.applyTargetFrequencies(targetFrequencies, audioContext)
		return true
	}

	@Spec('Releases all currently sounding notes with an exponential fade and scheduled ready-state recovery.')
	releaseNote(): boolean {
		this.requestVersion += 1
		return this.releaseVoices()
	}

	@Spec('Ensures an audio context instance exists when the browser exposes Web Audio support.')
	private ensureAudioContext(): AudioContext | null {
		if (this.audioContext !== null) {
			return this.audioContext
		}
		this.audioContext = this.createAudioContext()
		return this.audioContext
	}

	@Spec('Creates a browser audio context using AudioContext or webkitAudioContext when available.')
	private createBrowserAudioContext(): AudioContext | null {
		const maybeGlobal = globalThis as Record<string, unknown>
		const maybeConstructor = maybeGlobal['AudioContext'] ?? maybeGlobal['webkitAudioContext']
		if (typeof maybeConstructor !== 'function') {
			return null
		}
		return new (maybeConstructor as new () => AudioContext)()
	}

	@Spec('Applies the requested target note set by retiring stale voices and starting any missing ones.')
	private applyTargetFrequencies(targetFrequencies: number[], audioContext: AudioContext) {
		const targetFrequencyKeys = new Set(targetFrequencies.map((frequencyHz) => this.formatFrequencyKey(frequencyHz)))
		for (const [frequencyKey, voice] of this.activeVoicesByFrequencyKey.entries()) {
			if (targetFrequencyKeys.has(frequencyKey)) {
				continue
			}
			this.retireVoice(voice, audioContext.currentTime, 0.01)
			this.activeVoicesByFrequencyKey.delete(frequencyKey)
		}

		for (const frequencyHz of targetFrequencies) {
			const frequencyKey = this.formatFrequencyKey(frequencyHz)
			if (this.activeVoicesByFrequencyKey.has(frequencyKey)) {
				continue
			}

			const oscillator = audioContext.createOscillator()
			const gainNode = audioContext.createGain()
			oscillator.type = 'sine'
			oscillator.frequency.value = frequencyHz
			gainNode.gain.cancelScheduledValues(audioContext.currentTime)
			gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime)
			gainNode.gain.linearRampToValueAtTime(0.18, audioContext.currentTime + this.attackDurationSeconds)
			oscillator.connect(gainNode)
			gainNode.connect(audioContext.destination)
			this.trackVoiceEnd(frequencyKey, oscillator, gainNode)
			oscillator.start(audioContext.currentTime)
			this.activeVoicesByFrequencyKey.set(frequencyKey, { frequencyHz, oscillator, gainNode })
		}

		this.emitStateChange('playing')
	}

	@Spec('Releases every active voice and schedules the synth to return visibly to ready after the fade completes.')
	private releaseVoices(): boolean {
		this.cancelPendingReadyState()
		if (this.audioContext === null || this.activeVoicesByFrequencyKey.size === 0) {
			return false
		}

		const audioContext = this.audioContext
		for (const [frequencyKey, voice] of this.activeVoicesByFrequencyKey.entries()) {
			this.retireVoice(voice, audioContext.currentTime, this.releaseDurationSeconds)
			this.activeVoicesByFrequencyKey.delete(frequencyKey)
		}

		this.emitStateChange('releasing')
		this.pendingReadyTimeoutId = this.scheduleTimeout(() => {
			this.pendingReadyTimeoutId = null
			if (this.activeVoicesByFrequencyKey.size === 0) {
				this.emitStateChange('ready')
			}
		}, Math.ceil((this.releaseDurationSeconds + 0.03) * 1000))
		return true
	}

	@Spec('Cancels any pending ready-state timer so a fresh note change cannot be overwritten by an old release.')
	private cancelPendingReadyState() {
		if (this.pendingReadyTimeoutId === null) {
			return
		}
		this.cancelTimeout(this.pendingReadyTimeoutId)
		this.pendingReadyTimeoutId = null
	}

	@Spec('Chooses the target note set for the current synth mode and removes duplicate mapped frequencies.')
	private selectTargetFrequencies(frequenciesHz: number[]): number[] {
		const uniqueFrequencies: number[] = []
		const seenFrequencyKeys = new Set<string>()
		for (const frequencyHz of frequenciesHz) {
			const frequencyKey = this.formatFrequencyKey(frequencyHz)
			if (seenFrequencyKeys.has(frequencyKey)) {
				continue
			}
			seenFrequencyKeys.add(frequencyKey)
			uniqueFrequencies.push(frequencyHz)
		}

		if (this.isMonophonic === false) {
			return uniqueFrequencies
		}

		const latestFrequency = uniqueFrequencies[uniqueFrequencies.length - 1]
		return latestFrequency === undefined ? [] : [latestFrequency]
	}

	@Spec('Formats one frequency as a stable key so the synth can track active voices across note syncs.')
	private formatFrequencyKey(frequencyHz: number): string {
		return frequencyHz.toFixed(6)
	}

	@Spec('Applies a short fade and stop time to a voice so repeated triggers do not click or hang.')
	private retireVoice(
		voice: { frequencyHz: number, oscillator: OscillatorNode, gainNode: GainNode },
		currentTime: number,
		fadeDurationSeconds: number
	) {
		const safeStartGain = Math.max(voice.gainNode.gain.value, 0.0001)
		voice.gainNode.gain.cancelScheduledValues(currentTime)
		voice.gainNode.gain.setValueAtTime(safeStartGain, currentTime)
		voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, currentTime + fadeDurationSeconds)
		voice.oscillator.stop(currentTime + fadeDurationSeconds + 0.01)
	}

	@Spec('Disconnects finished nodes and prevents stale voice endings from overriding newer active note state.')
	private trackVoiceEnd(frequencyKey: string, oscillator: OscillatorNode, gainNode: GainNode) {
		oscillator.onended = () => {
			oscillator.disconnect()
			gainNode.disconnect()
			const activeVoice = this.activeVoicesByFrequencyKey.get(frequencyKey)
			if (activeVoice?.oscillator === oscillator) {
				this.activeVoicesByFrequencyKey.delete(frequencyKey)
			}
			if (this.activeVoicesByFrequencyKey.size === 0 && this.pendingReadyTimeoutId === null) {
				this.emitStateChange('ready')
			}
		}
	}

	@Spec('Emits a synth state change when a listener was provided by the caller.')
	private emitStateChange(state: 'ready' | 'playing' | 'releasing' | 'unsupported') {
		this.onStateChange?.(state)
	}
}
