# Playback Mode Expansion Plan

## Reference Layout Description

I could not save the attached screenshot into the workspace from this environment, so this file includes a textual reference instead.

The requested layout uses four highlighted regions from the screenshot:

1. **Top red box**: the full horizontal control strip that currently contains the monophonic toggle.
2. **Green box inside the red box**: the desired smaller size for the monophonic selector block.
3. **Blue box inside the red box**: the new playback-mode selector area that should sit to the right of the smaller monophonic block.
4. **Large pink box on the far right**: the currently empty area that should hold the playback settings panel.

---

## Chapter 1 — Compact Voice-Mode Control Layout

### Goal

Shrink the monophonic control so it occupies roughly the compact footprint shown by the green box instead of filling the whole red-box strip.

### Acceptance Criteria

- The monophonic control sits as a smaller card on the left side of the combined control row.
- The long explanatory paragraph is removed.
- The visible helper text uses only one short sentence.
- The monophonic control remains fully usable with the existing toggle.

### How to Test

- Open the app and inspect the control row below the keyboard mapping cards.
- Verify the monophonic block is visibly narrower than before.
- Verify the help text fits in a compact two-line layout or less.
- Toggle monophonic mode on and off and confirm the voice-mode card still updates.

---

## Chapter 2 — Playback-Mode Selector in the Blue-Box Area

### Goal

Add a three-option selector to the right of the compact monophonic block.

### Required Options

- **Raw**: plays the current waveform as-is.
- **Cutoff**: applies a filter ADSR / cutoff-style shaping stage.
- **Pluck**: applies a damped pluck-style response intended to feel string-like.

### Acceptance Criteria

- Three radio-button style options are visible in the blue-box area.
- Only one playback mode can be active at a time.
- Switching modes updates the visible playback-mode label in the settings panel.
- Existing keyboard play still works after switching playback modes.

### How to Test

- Load the app and verify that Raw, Cutoff, and Pluck are all visible.
- Select each mode once and confirm the selected state changes.
- Press a mapped keyboard key after each mode switch.
- Confirm the synth still responds and the mode label changes accordingly.

---

## Chapter 3 — Right-Side Playback Settings Panel

### Goal

Use the large empty right-side area for the settings that belong to the selected playback mode.

### Acceptance Criteria

- A dedicated settings panel appears in the large right-side area.
- **Raw** shows that no extra settings are needed.
- **Cutoff** shows filter ADSR controls and cutoff-related settings.
- **Pluck** shows a pluck-specific summary, even if extra controls are deferred.
- The filter ADSR abstraction is implemented so similar ADSR scheduling can later be reused for volume shaping.

### How to Test

- Select **Raw** and confirm the right panel says no extra settings are required.
- Select **Cutoff** and confirm the right panel shows filter Attack, Decay, Sustain, Release, cutoff, and resonance controls.
- Move one of the cutoff sliders and confirm its visible numeric value updates.
- Select **Pluck** and confirm the panel switches away from cutoff controls to a pluck summary.
