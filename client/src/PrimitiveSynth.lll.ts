import { Spec } from '@shared/lll.lll'
import { AdsrEnvelope } from './synth/AdsrEnvelope.lll'
import { EffectsSettings } from './synth/EffectsSettings.lll'
import { FilterEnvelopeSettings } from './synth/FilterEnvelopeSettings.lll'
import { KarplusStrongPluckVoice } from './synth/KarplusStrongPluckVoice.lll'
import { PluckSettings } from './synth/PluckSettings.lll'
import { PrimitiveSynthVoice } from './synth/PrimitiveSynthVoice.lll'
import { SynthPlaybackMode } from './synth/SynthPlaybackMode.lll'
import { PrimitiveSynthEffectsRouter } from './synth/PrimitiveSynthEffectsRouter.lll';


@Spec('Provides a minimal browser synth voice engine that can switch between raw playback, filter-envelope playback, and a Karplus-Strong pluck mode while using uploaded image-derived waveforms when available.')
export class PrimitiveSynth {
	private readonly primitiveSynthEffectsRouter = new PrimitiveSynthEffectsRouter(this);

	private readonly attackDurationSeconds: number
	private readonly releaseDurationSeconds: number
	private readonly defaultFrequencyHz: number
	private readonly createAudioContext: () => AudioContext | null
	private readonly onStateChange: ((state: 'ready' | 'playing' | 'releasing' | 'unsupported') => void) | null
	private readonly scheduleTimeout: (callback: () => void, delayMs: number) => number
	private readonly cancelTimeout: (timeoutId: number) => void
	private readonly adsrEnvelope = new AdsrEnvelope()
	public audioContext: AudioContext | null = null
	private readonly activeVoicesByFrequencyKey: Map<string, PrimitiveSynthVoice> = new Map()
	public readonly chorusInputNodeByAudioContext: WeakMap<AudioContext, { inputNode: GainNode, feedbackGainNode: GainNode, delayNode: DelayNode, lfoDepthNode: GainNode }> = new WeakMap()
	public readonly delayInputNodeByAudioContext: WeakMap<AudioContext, { inputNode: GainNode, feedbackGainNode: GainNode, delayNode: DelayNode }> = new WeakMap()
	private pendingReadyTimeoutId: number | null = null
	private requestVersion: number = 0
	private isMonophonic: boolean
	private waveformSamples: number[] | null = null
	private playbackMode: SynthPlaybackMode
	private filterEnvelopeSettings: FilterEnvelopeSettings
	public effectsSettings: EffectsSettings
	private pluckSettings: PluckSettings
	private portamentoSeconds: number
	private lastMonophonicFrequencyHz: number | null = null

	constructor(
		options: {
			attackDurationSeconds?: number
			releaseDurationSeconds?: number
			frequencyHz?: number
			monophonic?: boolean
			playbackMode?: SynthPlaybackMode
			filterEnvelopeSettings?: FilterEnvelopeSettings
			effectsSettings?: EffectsSettings
			pluckSettings?: PluckSettings
			portamentoSeconds?: number
			createAudioContext?: () => AudioContext | null
			onStateChange?: (state: 'ready' | 'playing' | 'releasing' | 'unsupported') => void
			scheduleTimeout?: (callback: () => void, delayMs: number) => number
			cancelTimeout?: (timeoutId: number) => void
		} = {}
	) {
		Spec('Configures the primitive synth with audio creation hooks, voice mode, playback-shaping mode, and short envelope timings.')
		this.attackDurationSeconds = options.attackDurationSeconds ?? 0.04
		this.releaseDurationSeconds = options.releaseDurationSeconds ?? 0.12
		this.defaultFrequencyHz = options.frequencyHz ?? 440
		this.isMonophonic = options.monophonic ?? false
		this.playbackMode = options.playbackMode ?? 'raw'
		this.filterEnvelopeSettings = this.normalizeFilterEnvelopeSettings(options.filterEnvelopeSettings ?? this.createDefaultFilterEnvelopeSettings())
		this.effectsSettings = this.normalizeEffectsSettings(options.effectsSettings ?? this.createDefaultEffectsSettings())
		this.pluckSettings = this.normalizePluckSettings(options.pluckSettings ?? this.createDefaultPluckSettings())
		this.portamentoSeconds = this.normalizePortamentoSeconds(options.portamentoSeconds ?? 0)
		this.createAudioContext = options.createAudioContext ?? (() => this.createBrowserAudioContext())
		this.onStateChange = options.onStateChange ?? null
		this.scheduleTimeout = options.scheduleTimeout ?? ((callback, delayMs) => globalThis.setTimeout(callback, delayMs))
		this.cancelTimeout = options.cancelTimeout ?? ((timeoutId) => globalThis.clearTimeout(timeoutId))
	}

	@Spec('Switches the synth between monophonic note selection and polyphonic chord playback.')
	setMonophonic(isMonophonic: boolean) {
		this.isMonophonic = isMonophonic
	}

	@Spec('Updates the monophonic glide time used when one held note hands off to another.')
	setPortamentoSeconds(portamentoSeconds: number) {
		this.portamentoSeconds = this.normalizePortamentoSeconds(portamentoSeconds)
	}

	@Spec('Switches the synth between raw playback, filter-envelope playback, and Karplus-Strong pluck playback.')
	setPlaybackMode(playbackMode: SynthPlaybackMode) {
		this.playbackMode = playbackMode
	}

	@Spec('Replaces the active filter-envelope settings used by the cutoff playback mode and refreshes any currently sounding filtered voices.')
	setFilterEnvelopeSettings(filterEnvelopeSettings: FilterEnvelopeSettings) {
		this.filterEnvelopeSettings = this.normalizeFilterEnvelopeSettings(filterEnvelopeSettings)
		this.refreshActiveVoiceFilters()
	}

	@Spec('Replaces the active chorus and delay settings used by the effects playback mode and refreshes the shared effect buses.')
	setEffectsSettings(effectsSettings: EffectsSettings) {
		this.effectsSettings = this.normalizeEffectsSettings(effectsSettings)
		this.primitiveSynthEffectsRouter.refreshEffectsRouting()
	}

	@Spec('Replaces the active Karplus-Strong pluck settings and updates any currently sounding pluck voices with the live damping and brightness values.')
	setPluckSettings(pluckSettings: PluckSettings) {
		this.pluckSettings = this.normalizePluckSettings(pluckSettings)
		this.refreshActivePluckVoices()
	}

	@Spec('Replaces the default sine oscillator shape with one uploaded image row waveform or clears back to the built-in raw oscillator shape when null is provided.')
	setWaveformSamples(waveformSamples: number[] | null) {
		this.waveformSamples = waveformSamples === null ? null : [...waveformSamples]
		this.refreshActiveVoiceWaveforms()
	}

	@Spec('Reports how many voices are currently sounding so the UI can reflect the synth engine output.')
	getActiveVoiceCount(): number {
		return this.activeVoicesByFrequencyKey.size
	}

	@Spec('Starts or retriggers one synth note using the currently selected playback mode.')
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

	@Spec('Rebuilds all active voices immediately so a playback-mode change can retimbre held notes without waiting for key releases.')
	async rebuildNotes(frequenciesHz: number[]): Promise<boolean> {
		this.requestVersion += 1
		this.stopActiveVoicesImmediately()
		return this.syncNotes(frequenciesHz)
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

	@Spec('Returns the default pluck settings used when callers do not provide any explicit Karplus-Strong shaping values.')
	private createDefaultPluckSettings(): PluckSettings {
		return {
			damping: 0.58,
			brightness: 0.72,
			noiseBlend: 0.18
		}
	}

	@Spec('Clamps one pluck-settings object into stable musical ranges before the synth uses it for Karplus-Strong playback.')
	private normalizePluckSettings(pluckSettings: PluckSettings): PluckSettings {
		return {
			damping: Math.max(0, Math.min(1, pluckSettings.damping)),
			brightness: Math.max(0, Math.min(1, pluckSettings.brightness)),
			noiseBlend: Math.max(0, Math.min(1, pluckSettings.noiseBlend))
		}
	}

	@Spec('Returns the default filter-envelope settings used when callers do not provide any explicit filter shaping values.')
	private createDefaultFilterEnvelopeSettings(): FilterEnvelopeSettings {
		return {
			attackSeconds: 0.04,
			decaySeconds: 0.18,
			sustainLevel: 0.42,
			releaseSeconds: 0.22,
			baseCutoffHz: 480,
			peakCutoffHz: 2800,
			resonance: 6
		}
	}

	@Spec('Clamps one set of filter-envelope settings into stable ranges before the synth uses them for scheduling.')
	private normalizeFilterEnvelopeSettings(filterEnvelopeSettings: FilterEnvelopeSettings): FilterEnvelopeSettings {
		return {
			attackSeconds: Math.max(0, filterEnvelopeSettings.attackSeconds),
			decaySeconds: Math.max(0, filterEnvelopeSettings.decaySeconds),
			sustainLevel: Math.max(0, Math.min(1, filterEnvelopeSettings.sustainLevel)),
			releaseSeconds: Math.max(0.01, filterEnvelopeSettings.releaseSeconds),
			baseCutoffHz: Math.max(40, filterEnvelopeSettings.baseCutoffHz),
			peakCutoffHz: Math.max(Math.max(40, filterEnvelopeSettings.baseCutoffHz) + 20, filterEnvelopeSettings.peakCutoffHz),
			resonance: Math.max(0.1, Math.min(18, filterEnvelopeSettings.resonance))
		}
	}

	@Spec('Returns the default chorus and delay settings used when callers do not provide any explicit effects values.')
	private createDefaultEffectsSettings(): EffectsSettings {
		return {
			chorusMix: 0.22,
			chorusFeedback: 0.08,
			chorusDepthMs: 8,
			delayMix: 0.18,
			delayFeedback: 0.24,
			delayTimeMs: 280
		}
	}

	@Spec('Clamps one set of chorus and delay settings into stable ranges before the synth uses them for routing.')
	private normalizeEffectsSettings(effectsSettings: EffectsSettings): EffectsSettings {
		return {
			chorusMix: Math.max(0, Math.min(0.8, effectsSettings.chorusMix)),
			chorusFeedback: Math.max(0, Math.min(0.75, effectsSettings.chorusFeedback)),
			chorusDepthMs: Math.max(1, Math.min(30, effectsSettings.chorusDepthMs)),
			delayMix: Math.max(0, Math.min(0.8, effectsSettings.delayMix)),
			delayFeedback: Math.max(0, Math.min(0.85, effectsSettings.delayFeedback)),
			delayTimeMs: Math.max(40, Math.min(900, effectsSettings.delayTimeMs))
		}
	}

	@Spec('Applies the requested target note set by retiring stale voices and starting any missing ones with the currently selected playback mode.')
	private applyTargetFrequencies(targetFrequencies: number[], audioContext: AudioContext) {
		if (this.tryRetuneMonophonicVoice(targetFrequencies, audioContext)) {
			return
		}
		const targetFrequencyKeys = new Set(targetFrequencies.map((frequencyHz) => this.formatFrequencyKey(frequencyHz)))
		for (const [frequencyKey, voice] of this.activeVoicesByFrequencyKey.entries()) {
			if (targetFrequencyKeys.has(frequencyKey)) {
				continue
			}
			this.retireVoice(voice, audioContext.currentTime, this.calculateReleaseFadeDurationSeconds(voice))
			this.activeVoicesByFrequencyKey.delete(frequencyKey)
		}

		for (const frequencyHz of targetFrequencies) {
			const frequencyKey = this.formatFrequencyKey(frequencyHz)
			if (this.activeVoicesByFrequencyKey.has(frequencyKey)) {
				continue
			}
			const voice = this.startVoice(audioContext, frequencyHz, frequencyKey)
			this.activeVoicesByFrequencyKey.set(frequencyKey, voice)
		}

		this.emitStateChange('playing')
	}

	@Spec('Starts one new voice according to the active playback mode and returns the tracked voice object stored by the synth.')
	private startVoice(audioContext: AudioContext, frequencyHz: number, frequencyKey: string): PrimitiveSynthVoice {
		if (this.playbackMode === 'pluck') {
			const pluckVoice = new KarplusStrongPluckVoice({
				audioContext,
				frequencyHz,
				pluckSettings: this.pluckSettings,
				waveformSamples: this.waveformSamples,
				onEnded: () => this.onPluckVoiceEnded(frequencyKey)
			})
			const gainNode = pluckVoice.getGainNode()
			gainNode.gain.cancelScheduledValues(audioContext.currentTime)
			gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime)
			gainNode.gain.linearRampToValueAtTime(0.18, audioContext.currentTime + 0.003)
			this.connectVoiceOutput(pluckVoice.getOutputNode(), audioContext)
			return {
				frequencyHz,
				gainNode,
				playbackMode: this.playbackMode,
				oscillator: null,
				filterNode: null,
				pluckVoice
			}
		}
		const oscillator = audioContext.createOscillator()
		const voiceNodes = this.createOscillatorVoiceNodes(audioContext)
		this.configureOscillatorWaveform(oscillator, audioContext)
		this.scheduleOscillatorFrequencyStart(oscillator, frequencyHz, audioContext.currentTime)
		voiceNodes.gainNode.gain.cancelScheduledValues(audioContext.currentTime)
		voiceNodes.gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime)
		this.scheduleGainEnvelope(voiceNodes.gainNode, audioContext.currentTime)
		this.scheduleFilterEnvelope(voiceNodes.filterNode, audioContext.currentTime)
		oscillator.connect(voiceNodes.inputNode)
		this.connectVoiceOutput(voiceNodes.outputNode, audioContext)
		this.trackOscillatorVoiceEnd(frequencyKey, oscillator, voiceNodes.gainNode, voiceNodes.filterNode)
		oscillator.start(audioContext.currentTime)
		return {
			frequencyHz,
			gainNode: voiceNodes.gainNode,
			playbackMode: this.playbackMode,
			oscillator,
			filterNode: voiceNodes.filterNode,
			pluckVoice: null
		}
	}

	@Spec('Builds the oscillator audio-node chain for one raw or cutoff voice according to the active playback mode.')
	private createOscillatorVoiceNodes(audioContext: AudioContext): { gainNode: GainNode, filterNode: BiquadFilterNode | null, inputNode: AudioNode, outputNode: AudioNode } {
		const gainNode = audioContext.createGain()
		if (this.playbackMode === 'raw') {
			return { gainNode, filterNode: null, inputNode: gainNode, outputNode: gainNode }
		}
		const filterNode = audioContext.createBiquadFilter()
		filterNode.type = 'lowpass'
		filterNode.frequency.value = this.filterEnvelopeSettings.baseCutoffHz
		filterNode.Q.value = this.filterEnvelopeSettings.resonance
		filterNode.connect(gainNode)
		return { gainNode, filterNode, inputNode: filterNode, outputNode: gainNode }
	}

	@Spec('Applies the amplitude envelope for one new oscillator voice according to the active playback mode.')
	private scheduleGainEnvelope(gainNode: GainNode, startTime: number) {
		gainNode.gain.linearRampToValueAtTime(0.18, startTime + this.attackDurationSeconds)
	}

	@Spec('Applies the cutoff ADSR for one new cutoff-mode oscillator voice when the mode uses a filter stage.')
	private scheduleFilterEnvelope(filterNode: BiquadFilterNode | null, startTime: number) {
		if (filterNode === null || this.playbackMode !== 'cutoff') {
			return
		}
		const sustainCutoffHz = this.calculateFilterSustainCutoffHz()
		this.adsrEnvelope.scheduleAttackDecay(filterNode.frequency, {
			startTime,
			startValue: this.filterEnvelopeSettings.baseCutoffHz,
			peakValue: this.filterEnvelopeSettings.peakCutoffHz,
			sustainValue: sustainCutoffHz,
			attackSeconds: this.filterEnvelopeSettings.attackSeconds,
			decaySeconds: this.filterEnvelopeSettings.decaySeconds
		})
		filterNode.Q.setValueAtTime(this.filterEnvelopeSettings.resonance, startTime)
	}

	@Spec('Returns the sustain cutoff implied by the current filter-envelope settings.')
	private calculateFilterSustainCutoffHz(): number {
		const cutoffRange = this.filterEnvelopeSettings.peakCutoffHz - this.filterEnvelopeSettings.baseCutoffHz
		return this.filterEnvelopeSettings.baseCutoffHz + cutoffRange * this.filterEnvelopeSettings.sustainLevel
	}
	@Spec('Releases every active voice and schedules the synth to return visibly to ready after the fade completes.')
	private releaseVoices(): boolean {
		this.cancelPendingReadyState()
		if (this.audioContext === null || this.activeVoicesByFrequencyKey.size === 0) {
			return false
		}

		const audioContext = this.audioContext
		let longestFadeDurationSeconds = this.releaseDurationSeconds
		for (const [frequencyKey, voice] of this.activeVoicesByFrequencyKey.entries()) {
			const fadeDurationSeconds = this.calculateReleaseFadeDurationSeconds(voice)
			longestFadeDurationSeconds = Math.max(longestFadeDurationSeconds, fadeDurationSeconds)
			this.retireVoice(voice, audioContext.currentTime, fadeDurationSeconds)
			this.activeVoicesByFrequencyKey.delete(frequencyKey)
		}

		this.emitStateChange('releasing')
		this.pendingReadyTimeoutId = this.scheduleTimeout(() => {
			this.pendingReadyTimeoutId = null
			if (this.activeVoicesByFrequencyKey.size === 0) {
				this.emitStateChange('ready')
			}
		}, Math.ceil((longestFadeDurationSeconds + 0.03) * 1000))
		return true
	}

	@Spec('Stops every active voice quickly without emitting a visible release transition so playback-mode changes can rebuild held notes immediately.')
	private stopActiveVoicesImmediately() {
		this.cancelPendingReadyState()
		if (this.audioContext === null || this.activeVoicesByFrequencyKey.size === 0) {
			return
		}
		for (const [frequencyKey, voice] of this.activeVoicesByFrequencyKey.entries()) {
			this.retireVoice(voice, this.audioContext.currentTime, 0.01)
			this.activeVoicesByFrequencyKey.delete(frequencyKey)
		}
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

	@Spec('Clamps one requested portamento duration so monophonic retuning stays within a stable musical range.')
	private normalizePortamentoSeconds(portamentoSeconds: number): number {
		return Math.max(0, Math.min(1, portamentoSeconds))
	}

	@Spec('Starts one new oscillator either directly at its target pitch or from the remembered monophonic pitch when portamento should glide from the last played note.')
	private scheduleOscillatorFrequencyStart(oscillator: OscillatorNode, targetFrequencyHz: number, startTime: number) {
		const startFrequencyHz = this.getPortamentoStartFrequencyHz(targetFrequencyHz)
		oscillator.frequency.cancelScheduledValues(startTime)
		oscillator.frequency.setValueAtTime(startFrequencyHz, startTime)
		if (startFrequencyHz !== targetFrequencyHz && this.portamentoSeconds > 0) {
			oscillator.frequency.linearRampToValueAtTime(targetFrequencyHz, startTime + this.portamentoSeconds)
		}
		this.lastMonophonicFrequencyHz = targetFrequencyHz
	}

	@Spec('Chooses the pitch a fresh note should glide from so portamento can remain active whenever a remembered prior pitch exists.')
	private getPortamentoStartFrequencyHz(targetFrequencyHz: number): number {
		if (this.portamentoSeconds === 0) {
			return targetFrequencyHz
		}
		if (this.lastMonophonicFrequencyHz === null) {
			return targetFrequencyHz
		}
		return this.lastMonophonicFrequencyHz
	}

	@Spec('Retunes the single active monophonic voice in place when only its target pitch changes.')
	private tryRetuneMonophonicVoice(targetFrequencies: number[], audioContext: AudioContext): boolean {
		if (this.isMonophonic === false || targetFrequencies.length !== 1 || this.activeVoicesByFrequencyKey.size !== 1) {
			return false
		}
		const [currentFrequencyKey, voice] = Array.from(this.activeVoicesByFrequencyKey.entries())[0] ?? []
		if (voice === undefined || currentFrequencyKey === undefined) {
			return false
		}
		const nextFrequencyHz = targetFrequencies[0] ?? voice.frequencyHz
		const nextFrequencyKey = this.formatFrequencyKey(nextFrequencyHz)
		this.lastMonophonicFrequencyHz = nextFrequencyHz
		if (currentFrequencyKey === nextFrequencyKey) {
			this.emitStateChange('playing')
			return true
		}
		if (voice.oscillator !== null) {
			voice.oscillator.frequency.cancelScheduledValues(audioContext.currentTime)
			voice.oscillator.frequency.setValueAtTime(voice.oscillator.frequency.value, audioContext.currentTime)
			if (this.portamentoSeconds === 0) {
				voice.oscillator.frequency.setValueAtTime(nextFrequencyHz, audioContext.currentTime)
			} else {
				voice.oscillator.frequency.linearRampToValueAtTime(nextFrequencyHz, audioContext.currentTime + this.portamentoSeconds)
			}
		}
		if (voice.pluckVoice !== null) {
			voice.pluckVoice.retune(nextFrequencyHz, this.waveformSamples)
		}
		voice.frequencyHz = nextFrequencyHz
		this.activeVoicesByFrequencyKey.delete(currentFrequencyKey)
		this.activeVoicesByFrequencyKey.set(nextFrequencyKey, voice)
		this.emitStateChange('playing')
		return true
	}

	@Spec('Returns the release fade duration that best matches one voice based on how it was created.')
	private calculateReleaseFadeDurationSeconds(voice: PrimitiveSynthVoice): number {
		if (voice.playbackMode === 'cutoff') {
			return Math.max(this.releaseDurationSeconds, this.filterEnvelopeSettings.releaseSeconds)
		}
		if (voice.playbackMode === 'pluck') {
			return Math.max(this.releaseDurationSeconds, 0.12 + this.pluckSettings.damping * 0.12)
		}
		return this.releaseDurationSeconds
	}

	@Spec('Routes one voice output to the destination and also through the shared chorus and delay buses so effects stay global across playback modes.')
	private connectVoiceOutput(outputNode: AudioNode, audioContext: AudioContext) {
		const chorusInputNode = this.primitiveSynthEffectsRouter.ensureChorusInputNode(audioContext)
		const delayInputNode = this.primitiveSynthEffectsRouter.ensureDelayInputNode(audioContext)
		outputNode.connect(audioContext.destination)
		outputNode.connect(chorusInputNode)
		outputNode.connect(delayInputNode)
	}
	@Spec('Applies a short fade and stop time to a voice so repeated triggers do not click or hang while also releasing any active filter sweep.')
	private retireVoice(voice: PrimitiveSynthVoice, currentTime: number, fadeDurationSeconds: number) {
		if (voice.filterNode !== null && voice.playbackMode === 'cutoff') {
			this.adsrEnvelope.scheduleRelease(voice.filterNode.frequency, {
				startTime: currentTime,
				startValue: Math.max(voice.filterNode.frequency.value, this.calculateFilterSustainCutoffHz()),
				endValue: this.filterEnvelopeSettings.baseCutoffHz,
				releaseSeconds: this.filterEnvelopeSettings.releaseSeconds
			})
		}
		const safeStartGain = Math.max(voice.gainNode.gain.value, 0.0001)
		voice.gainNode.gain.cancelScheduledValues(currentTime)
		voice.gainNode.gain.setValueAtTime(safeStartGain, currentTime)
		voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, currentTime + fadeDurationSeconds)
		voice.pluckVoice?.release(currentTime, fadeDurationSeconds)
		voice.oscillator?.stop(currentTime + fadeDurationSeconds + 0.01)
		if (voice.pluckVoice !== null) {
			this.scheduleTimeout(() => voice.pluckVoice?.stopImmediately(), Math.ceil((fadeDurationSeconds + 0.02) * 1000))
		}
	}

	@Spec('Configures one oscillator to use either the default built-in tone or the currently selected image-derived waveform samples.')
	private configureOscillatorWaveform(oscillator: OscillatorNode, audioContext: AudioContext) {
		if (this.waveformSamples === null || this.waveformSamples.length === 0) {
			oscillator.type = 'sine'
			return
		}
		const periodicWave = this.createPeriodicWaveFromSamples(audioContext, this.waveformSamples)
		oscillator.setPeriodicWave(periodicWave)
	}

	@Spec('Refreshes every currently sounding oscillator or pluck excitation source so scanline row changes can retimbre held notes without retriggering them.')
	private refreshActiveVoiceWaveforms() {
		if (this.audioContext === null || this.activeVoicesByFrequencyKey.size === 0) {
			return
		}
		for (const voice of this.activeVoicesByFrequencyKey.values()) {
			if (voice.oscillator !== null) {
				this.configureOscillatorWaveform(voice.oscillator, this.audioContext)
				continue
			}
			voice.pluckVoice?.retune(voice.frequencyHz, this.waveformSamples)
		}
	}

	@Spec('Refreshes active Karplus-Strong voices with the latest live damping and brightness settings while leaving their current excitation source intact.')
	private refreshActivePluckVoices() {
		for (const voice of this.activeVoicesByFrequencyKey.values()) {
			voice.pluckVoice?.updatePluckSettings(this.pluckSettings)
		}
	}

	@Spec('Refreshes currently sounding filtered voices with the latest stable cutoff and resonance values after the UI changes filter settings.')
	private refreshActiveVoiceFilters() {
		if (this.activeVoicesByFrequencyKey.size === 0) {
			return
		}
		for (const voice of this.activeVoicesByFrequencyKey.values()) {
			if (voice.filterNode === null || voice.playbackMode !== 'cutoff') {
				continue
			}
			voice.filterNode.Q.value = this.filterEnvelopeSettings.resonance
			voice.filterNode.frequency.value = this.calculateFilterSustainCutoffHz()
		}
	}

	@Spec('Builds a periodic wave from time-domain samples by converting them into Fourier coefficients for Web Audio playback.')
	private createPeriodicWaveFromSamples(audioContext: AudioContext, samples: number[]): PeriodicWave {
		const harmonicCount = Math.max(2, Math.min(samples.length, 64))
		const real = new Float32Array(harmonicCount)
		const imaginary = new Float32Array(harmonicCount)
		for (let harmonicIndex = 1; harmonicIndex < harmonicCount; harmonicIndex += 1) {
			let realSum = 0
			let imaginarySum = 0
			for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex += 1) {
				const phase = (2 * Math.PI * harmonicIndex * sampleIndex) / samples.length
				const sample = samples[sampleIndex] ?? 0
				realSum += sample * Math.cos(phase)
				imaginarySum += sample * Math.sin(phase)
			}
			real[harmonicIndex] = realSum / samples.length
			imaginary[harmonicIndex] = -imaginarySum / samples.length
		}
		return audioContext.createPeriodicWave(real, imaginary, { disableNormalization: false })
	}

	@Spec('Disconnects finished oscillator nodes and prevents stale voice endings from overriding newer active note state.')
	private trackOscillatorVoiceEnd(frequencyKey: string, oscillator: OscillatorNode, gainNode: GainNode, filterNode: BiquadFilterNode | null) {
		oscillator.onended = () => {
			oscillator.disconnect()
			filterNode?.disconnect()
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

	@Spec('Clears one finished Karplus-Strong voice from the active map when its processor decides the string energy is exhausted.')
	private onPluckVoiceEnded(frequencyKey: string) {
		const activeVoice = this.activeVoicesByFrequencyKey.get(frequencyKey)
		if (activeVoice?.pluckVoice === null || activeVoice === undefined) {
			return
		}
		this.activeVoicesByFrequencyKey.delete(frequencyKey)
		if (this.activeVoicesByFrequencyKey.size === 0 && this.pendingReadyTimeoutId === null) {
			this.emitStateChange('ready')
		}
	}

	@Spec('Emits a synth state change when a listener was provided by the caller.')
	private emitStateChange(state: 'ready' | 'playing' | 'releasing' | 'unsupported') {
		this.onStateChange?.(state)
	}
}
