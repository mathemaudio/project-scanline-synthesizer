## Sprint 1

### Goal
Replace the current incomplete pluck behavior with a real Karplus–Strong voice engine that supports independent polyphonic strings per note and uses the uploaded waveform row as the excitation shape.

### Implementation
- Audit the current pluck mode code path and identify:
  - Where pluck mode is selected.
  - How note-on/note-off voices are allocated today.
  - Where the current faux-pluck oscillator/filter behavior lives.
  - How uploaded waveform rows are currently converted into playback data.
- Introduce a dedicated Karplus–Strong pluck voice implementation, separate from the current oscillator-based path:
  - Create a `KarplusStrongVoice`/equivalent per-note voice object.
  - Each voice owns its own delay-line/ring-buffer, loop state, filter state, amplitude envelope, and excitation buffer.
  - On note start:
    - Compute target frequency from the note pitch.
    - Convert frequency to loop length in samples.
    - Initialize a delay buffer sized for that note.
    - Seed the buffer from an excitation signal built from:
      - uploaded waveform row content when available,
      - optionally mixed with noise according to the future blend control.
- Use uploaded waveform rows as excitation only:
  - Resample or map the selected waveform row into the note’s initial delay buffer length.
  - Normalize safely to avoid clipping or silent excitation.
  - If the waveform row is shorter/longer than the required loop length, interpolate/resample into the loop size.
  - If no waveform is uploaded, fall back to a sensible default excitation shape.
- Implement the core Karplus–Strong loop:
  - Read the current delay sample.
  - Apply the KS feedback update using averaged/filtered neighboring samples.
  - Write back into the circular buffer.
  - Output the loop sample through voice gain.
- Support full polyphony:
  - One independent string loop per active note.
  - No shared delay lines or shared excitation state between voices.
  - Voice lifecycle includes creation on note-on and cleanup on release/end-of-decay.
- Add a minimal release/voice stop policy:
  - For the first version, note-off may either:
    - allow natural decay to continue, or
    - optionally apply a very short tail attenuation for stuck-note prevention.
  - Ensure stolen voices are faded out cleanly to avoid clicks.
- Preserve all non-pluck modes unchanged.

### How To Test
- Unit/integration test frequency-to-delay conversion:
  - Verify expected delay lengths for several pitches.
  - Confirm no zero/negative/undersized buffers at high notes.
- Test excitation mapping:
  - Uploaded waveform row seeds the buffer and produces audible variation versus default noise-only fallback.
  - Different waveform rows produce audibly different attack/body.
- Test polyphony:
  - Play overlapping notes/chords and confirm independent decays.
  - Ensure one note retrigger does not reset another note’s buffer.
- Regression test mode switching:
  - Switching into/out of pluck mode does not affect other synthesis modes.
- Audio sanity checks:
  - No major clicks on note-on, note-off, or voice stealing.
  - High notes and low notes remain stable.

### Demo/Exit Criteria
- Pluck mode no longer sounds like filtered oscillator playback; it behaves like a decaying string model.
- Each pressed note has its own independent Karplus–Strong string loop.
- Uploaded waveform rows audibly affect the pluck excitation.
- Existing non-pluck modes continue working without regressions.

## Sprint 2

### Goal
Expose the first essential pluck controls in the UI and wire them to musically meaningful Karplus–Strong parameters: decay/damping, brightness, and blend/noise-excitation.

### Implementation
- Add pluck-only parameters to the synth model/state:
  - `decay` or `damping`
  - `brightness`
  - `blend` / `noiseExcitationMix`
- Define parameter behavior clearly and map to DSP:
  - **Decay/Damping**
    - Controls loop feedback loss / effective sustain time.
    - Lower damping = longer sustain.
    - Higher damping = faster energy loss.
  - **Brightness**
    - Controls high-frequency retention in the loop filter and/or excitation tilt.
    - Lower brightness = darker, more muted string.
    - Higher brightness = brighter initial pluck and sustained harmonics.
  - **Blend / Noise-Excitation**
    - Crossfade between uploaded waveform excitation and broadband noise.
    - `0` = waveform excitation only.
    - `1` = noise excitation only.
    - Middle values mix both.
- Implement DSP parameter mapping:
  - Add a one-pole or simple averaging loop filter with coefficient derived from brightness.
  - Tie decay/damping to loop feedback gain and/or loss coefficient.
  - Build excitation as:
    - `excitation = waveformExcitation * (1 - blend) + noiseExcitation * blend`
  - Normalize the mixed excitation to prevent output jumps across settings.
- Add UI controls in the existing parameter panel for pluck mode only:
  - Slider/knob for Decay/Damping.
  - Slider/knob for Brightness.
  - Slider/knob for Blend/Noise.
- Add defaults and persistence:
  - Choose musical defaults that sound good on first load.
  - Ensure values serialize/deserialize with the existing preset/project state.
  - Ensure switching modes preserves pluck settings.
- Implement smoothing where needed:
  - Smooth parameter changes enough to avoid zipper noise during live tweaking.
  - Decide whether active voices update immediately or new-note-only:
    - brightness and damping can update live,
    - excitation blend should primarily affect new plucks, unless existing architecture supports safe mid-voice re-excitation-free updates.
- Add labels/tooltips/help text:
  - Decay/Damping: sustain length / energy loss.
  - Brightness: tone / high-frequency content.
  - Blend/Noise: uploaded waveform vs noise pluck source.

### How To Test
- UI tests:
  - Controls appear only when pluck mode is active.
  - Controls update synth state and persist through save/load if supported.
- DSP behavior tests:
  - Lower damping produces shorter plucks; lower loss produces longer plucks.
  - Brightness changes spectral content clearly without destabilizing the loop.
  - Blend at extremes gives:
    - pure uploaded-waveform excitation,
    - pure noise excitation.
- Live interaction tests:
  - Adjust decay/brightness during sustained polyphonic playback; confirm no clicks or engine instability.
  - Retrigger notes at different blend settings and confirm attacks change as expected.
- Regression tests:
  - Hidden pluck controls do not affect other modes.
  - Existing waveform upload behavior outside pluck mode remains intact.

### Demo/Exit Criteria
- Pluck mode UI exposes exactly the essential first controls:
  - decay/damping,
  - brightness,
  - blend/noise-excitation.
- Each control produces an audible and intuitive change.
- Settings save/load correctly and do not leak into other modes.
- The engine remains stable under polyphonic use and live parameter changes.

## Sprint 3

### Goal
Polish the implementation for production readiness: tuning accuracy, robustness across pitch range, clean voice management, and verification against the old unfinished pluck mode.

### Implementation
- Improve pitch accuracy:
  - If needed, add fractional delay handling or interpolation to reduce detuning caused by integer-only loop lengths.
  - Validate low and high note tuning against expected pitch.
- Refine loop filter behavior:
  - Ensure brightness and damping ranges feel musical across the full keyboard.
  - Prevent unstable feedback at extreme settings.
- Tighten voice management:
  - Confirm voice stealing policy in polyphony-heavy situations.
  - Add short anti-click ramps on note start/stop/steal.
  - Ensure voices self-terminate once energy falls below threshold.
- Handle edge cases:
  - Very short loop lengths for high notes.
  - Large sample rates / sample-rate changes.
  - Missing, silent, or malformed uploaded waveform data.
  - Repeated rapid retriggering of the same note.
- Clean up/remove old faux-pluck logic:
  - Either fully delete obsolete code or isolate it behind dead-path removal.
  - Update comments and internal naming so “pluck mode” unambiguously means KS-based pluck.
- Add developer documentation:
  - Brief DSP notes in code:
    - excitation source,
    - loop filter,
    - parameter mapping,
    - per-voice lifecycle.
  - Add a short user-facing note in the relevant docs/changelog describing the new pluck model and controls.

### How To Test
- Tuning tests:
  - Measure pitch error across a note range.
  - Verify octave relationships are preserved.
- Stress tests:
  - Dense chord clusters and fast repeated notes.
  - Rapid automation of pluck parameters.
  - Mode switching during active playback.
- Edge-case tests:
  - No uploaded waveform present.
  - Silent waveform row upload.
  - Extremely bright and extremely damped settings.
- Comparison/regression pass:
  - Confirm the old pluck artifacts are gone.
  - Confirm CPU usage remains acceptable relative to expected polyphony.

### Demo/Exit Criteria
- Pluck mode is production-usable, not a placeholder.
- Notes are stably tuned, polyphonic, and free of obvious clicks/glitches.
- Old faux-pluck behavior is removed or no longer reachable.
- The feature is ready for user validation as the first proper Karplus–Strong pluck release.
