import { Spec } from '@shared/lll.lll'
import type { KeyboardPitch } from '../KeyboardPitch.lll'

@Spec("Presents synth status label and detail text for ready, playing, releasing, and unsupported engine states.")
export class AppSynthStatusPresenter {
	public constructor() {
		Spec('Creates a stateless presenter for synth status label and detail text.')
	}

	@Spec('Creates the visible synth status label and detail text that reflect the current voice mode and playback-shaping mode.')
	public createSynthStatusSnapshot(options: {
		state: 'ready' | 'playing' | 'releasing' | 'unsupported'
		playbackMode: 'raw' | 'cutoff' | 'pluck'
		isMonophonic: boolean
		soundingVoiceCount: number
		activePitch: KeyboardPitch | null
	}): { noteStateLabel: string, noteDetailText: string } {
		if (options.state === 'ready') {
			if (options.playbackMode === 'cutoff') {
				return {
					noteStateLabel: 'Ready',
					noteDetailText: 'Cutoff mode is armed. Newly played notes open their low-pass filter with a visible filter ADSR, then settle back to the sustain cutoff while the key is held.'
				}
			}
			if (options.playbackMode === 'pluck') {
				return {
					noteStateLabel: 'Ready',
					noteDetailText: 'Pluck mode is armed. New notes seed an independent Karplus–Strong string loop from the uploaded waveform or blended noise source.'
				}
			}
			return {
				noteStateLabel: 'Ready',
				noteDetailText: options.isMonophonic
					? 'Monophonic mode is armed. Hold overlapping mapped keys to let the newest key take over while earlier keys stay available for fallback.'
					: 'Polyphonic mode is armed. Hold several mapped keys together to stack a chord, and release them to let every sounding voice fade cleanly.'
			}
		}

		if (options.state === 'playing') {
			if (options.playbackMode === 'cutoff') {
				return {
					noteStateLabel: 'Playing',
					noteDetailText: options.activePitch === null
						? 'The filter ADSR is ready to open and settle the low-pass cutoff on the next played note.'
						: `${options.activePitch.noteLabel} is playing through the cutoff mode. The filter opens quickly, then settles into its sustain cutoff while the note stays held.`
				}
			}
			if (options.playbackMode === 'pluck') {
				return {
					noteStateLabel: 'Playing',
					noteDetailText: options.activePitch === null
						? 'The pluck mode is ready with a tuned Karplus–Strong string response.'
						: `${options.activePitch.noteLabel} is sounding in pluck mode through its own Karplus–Strong string loop with live damping and brightness shaping.`
				}
			}
			if (options.isMonophonic) {
				return {
					noteStateLabel: 'Playing',
					noteDetailText: options.activePitch === null
						? 'The monophonic synth is following the newest mapped key with a single raw voice.'
						: `${options.activePitch.noteLabel} is leading the monophonic synth. The newest held key controls one voice while earlier held keys wait silently for fallback.`
				}
			}
			return {
				noteStateLabel: 'Playing',
				noteDetailText: options.activePitch === null
					? 'The polyphonic synth is sounding every currently held mapped key with its own raw voice.'
					: `${options.soundingVoiceCount} sounding voice${options.soundingVoiceCount === 1 ? '' : 's'} ${options.soundingVoiceCount === 1 ? 'is' : 'are'} active in polyphonic mode. ${options.activePitch.noteLabel} is the newest visible key while earlier held notes keep ringing.`
			}
		}

		if (options.state === 'releasing') {
			if (options.playbackMode === 'cutoff') {
				return {
					noteStateLabel: 'Releasing',
					noteDetailText: 'All held keys are up, so the filtered voice is fading out while the cutoff closes back toward its base position.'
				}
			}
			if (options.playbackMode === 'pluck') {
				return {
					noteStateLabel: 'Releasing',
					noteDetailText: 'All held keys are up, so the Karplus–Strong pluck voices are fading through their short release tails.'
				}
			}
			return {
				noteStateLabel: 'Releasing',
				noteDetailText: options.isMonophonic
					? 'All held keys are up, so the monophonic voice is fading out with a short release.'
					: 'All held keys are up, so every sounding voice is fading out together with a short release.'
			}
		}

		return {
			noteStateLabel: 'Unavailable',
			noteDetailText: 'This environment does not expose a browser AudioContext, so the QWERTY synth cannot start.'
		}
	}

}
