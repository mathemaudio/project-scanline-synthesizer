import { Spec } from '@shared/lll.lll'

@Spec('Provides a minimal browser sine-wave synth voice with clean attack and release shaping.')
export class PrimitiveSynth {
	private readonly attackDurationSeconds: number
	private readonly releaseDurationSeconds: number
	private readonly defaultFrequencyHz: number
	private readonly createAudioContext: () => AudioContext | null
	private readonly onStateChange: ((state: 'ready' | 'playing' | 'releasing' | 'unsupported') => void) | null
	private readonly scheduleTimeout: (callback: () => void, delayMs: number) => number
	private readonly cancelTimeout: (timeoutId: number) => void
	private audioContext: AudioContext | null = null
	private activeVoice: { oscillator: OscillatorNode, gainNode: GainNode } | null = null
	private pendingReadyTimeoutId: number | null = null
	private requestVersion: number = 0

	constructor(
		options: {
			attackDurationSeconds?: number
			releaseDurationSeconds?: number
			frequencyHz?: number
			createAudioContext?: () => AudioContext | null
			onStateChange?: (state: 'ready' | 'playing' | 'releasing' | 'unsupported') => void
			scheduleTimeout?: (callback: () => void, delayMs: number) => number
			cancelTimeout?: (timeoutId: number) => void
		} = {}
	) {
		Spec('Configures the primitive synth with audio creation hooks and short envelope timings.')
		this.attackDurationSeconds = options.attackDurationSeconds ?? 0.04
		this.releaseDurationSeconds = options.releaseDurationSeconds ?? 0.12
		this.defaultFrequencyHz = options.frequencyHz ?? 440
		this.createAudioContext = options.createAudioContext ?? (() => this.createBrowserAudioContext())
		this.onStateChange = options.onStateChange ?? null
		this.scheduleTimeout = options.scheduleTimeout ?? ((callback, delayMs) => globalThis.setTimeout(callback, delayMs))
		this.cancelTimeout = options.cancelTimeout ?? ((timeoutId) => globalThis.clearTimeout(timeoutId))
	}

	@Spec('Starts or retriggers the synth note with a sine oscillator and short attack envelope.')
	async startNote(frequencyHz: number = this.defaultFrequencyHz): Promise<boolean> {
		const requestVersion = this.requestVersion + 1
		this.requestVersion = requestVersion
		const audioContext = this.ensureAudioContext()
		if (audioContext === null) {
			this.emitStateChange('unsupported')
			return false
		}

		if (this.pendingReadyTimeoutId !== null) {
			this.cancelTimeout(this.pendingReadyTimeoutId)
			this.pendingReadyTimeoutId = null
		}

		if (audioContext.state === 'suspended') {
			await audioContext.resume()
		}

		if (this.requestVersion !== requestVersion) {
			return false
		}

		if (this.activeVoice !== null) {
			this.retireVoice(this.activeVoice, audioContext.currentTime, 0.01)
			this.activeVoice = null
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
		this.trackVoiceEnd(oscillator, gainNode)
		oscillator.start(audioContext.currentTime)
		this.activeVoice = { oscillator, gainNode }
		this.emitStateChange('playing')
		return true
	}

	@Spec('Releases the active note with an exponential fade and scheduled ready-state recovery.')
	releaseNote(): boolean {
		this.requestVersion += 1
		if (this.pendingReadyTimeoutId !== null) {
			this.cancelTimeout(this.pendingReadyTimeoutId)
			this.pendingReadyTimeoutId = null
		}

		if (this.activeVoice === null || this.audioContext === null) {
			return false
		}

		const voice = this.activeVoice
		this.activeVoice = null
		this.retireVoice(voice, this.audioContext.currentTime, this.releaseDurationSeconds)
		this.emitStateChange('releasing')
		this.pendingReadyTimeoutId = this.scheduleTimeout(() => {
			this.pendingReadyTimeoutId = null
			if (this.activeVoice === null) {
				this.emitStateChange('ready')
			}
		}, Math.ceil((this.releaseDurationSeconds + 0.03) * 1000))
		return true
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

	@Spec('Applies a short fade and stop time to a voice so repeated triggers do not click or hang.')
	private retireVoice(voice: { oscillator: OscillatorNode, gainNode: GainNode }, currentTime: number, fadeDurationSeconds: number) {
		const safeStartGain = Math.max(voice.gainNode.gain.value, 0.0001)
		voice.gainNode.gain.cancelScheduledValues(currentTime)
		voice.gainNode.gain.setValueAtTime(safeStartGain, currentTime)
		voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, currentTime + fadeDurationSeconds)
		voice.oscillator.stop(currentTime + fadeDurationSeconds + 0.01)
	}

	@Spec('Disconnects finished nodes and prevents stale voice endings from overriding new note state.')
	private trackVoiceEnd(oscillator: OscillatorNode, gainNode: GainNode) {
		oscillator.onended = () => {
			oscillator.disconnect()
			gainNode.disconnect()
			if (this.activeVoice?.oscillator === oscillator && this.pendingReadyTimeoutId === null) {
				this.activeVoice = null
				this.emitStateChange('ready')
			}
		}
	}

	@Spec('Emits a synth state change when a listener was provided by the caller.')
	private emitStateChange(state: 'ready' | 'playing' | 'releasing' | 'unsupported') {
		this.onStateChange?.(state)
	}
}
