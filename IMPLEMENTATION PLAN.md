# Scanline Synth

## Overview

Scanline Synth is a browser-based synthesizer that transforms an uploaded image into sound by interpreting its horizontal rows as waveforms. As a note is played, the instrument scans through these rows over time, shaping the sound according to an envelope. The simplest behavior sweeps from the top of the image to the bottom during the attack phase, then sustains using the bottom row.

The goal is to create a minimal, expressive instrument where visual structure directly becomes timbre.

---

## Core Idea

* Each horizontal line of an image represents a single-cycle waveform.
* A note triggers an envelope that determines which row is currently active.
* During the attack phase, the system scans through rows.
* During sustain, the final row is held continuously.
* The result is a direct mapping from image structure to sound evolution.

---

## Product Definition

### Core Experience

A user opens the app, plays notes from the computer keyboard, and hears a synthesizer. After loading an image, the played note uses waveforms derived from that image. At note onset, the sound evolves by scanning through image rows, then stabilizes on the final row until release.

### Minimum Viable Behavior

* Play a simple synthesized note
* Trigger notes from the computer QWERTY keyboard
* Load an image
* Convert horizontal rows into sound data
* Use image rows as oscillator waveforms
* Attack phase scans from top to bottom
* Sustain holds the bottom row
* Release fades the sound out

---

## Development Phases

### Phase 1 — Primitive Synth Foundation

Build the smallest possible working instrument: a browser synthesizer that can play a sine wave note with a basic amplitude envelope.

This phase is only about proving the audio path works reliably:

* Create an audio context
* Trigger a note on demand
* Play a sine oscillator
* Apply simple attack and release shaping
* Stop cleanly without clicks or hangs

#### End-of-phase test

The phase is complete when:

* A user can trigger a note and hear a clean sine tone
* The note starts, sustains, and stops predictably
* Repeated triggering works without breaking audio

---

### Phase 2 — Playable QWERTY Keyboard

Add musical playability through the computer keyboard using the standard musical mapping on QWERTY.

Example mapping:

* Q = C
* 2 = C#
* W = D
* 3 = D#
* E = E
* R = F
* 5 = F#
* T = G
* 6 = G#
* Y = A
* 7 = A#
* U = B

Then continue the same pattern across the next region of the keyboard for the next octave as needed.

This phase is about input and note assignment:

* Map computer keys to chromatic notes
* Support press to note-on
* Support release to note-off
* Choose a base octave and pitch reference
* Ensure adjacent keys produce correct semitone intervals
* Prevent browser key handling from interfering during play

#### End-of-phase test

The phase is complete when:

* The user can play a chromatic octave from the QWERTY keyboard
* Each mapped key produces the expected pitch
* Key press starts the note and key release ends it
* The instrument feels like a basic playable synth even before image features exist

---

### Phase 3 — Image Upload and Row-Based Waveform Synth

Introduce the image as the sound source.

This phase combines image loading, pixel access, and waveform preparation into one coherent milestone:

* Upload an image
* Read pixel data from a canvas
* Interpret each horizontal row as one single-cycle waveform
* Normalize or scale row data into usable audio values
* Store all rows as a waveform bank
* Allow the synth to use image-derived waveforms instead of the sine oscillator

At this point, the system does not need scanning yet. It just needs to prove that image rows can drive the sound.

#### End-of-phase test

The phase is complete when:

* A user can upload an image successfully
* At least one selected row can be heard as a stable playable note
* Different rows produce audibly different timbres
* The synth still responds correctly to the QWERTY keyboard while using image-derived sound

---

### Phase 4 — Scanline Playback

Implement the defining Scanline Synth behavior:

* On note start, scan from the top row toward the bottom during attack
* After the scan completes, hold the bottom row during sustain
* On note release, fade out cleanly
* Keep pitch constant while timbre changes through row selection
* Provide minimal control over attack and release timing

This is the first phase where the full concept is realized.

#### End-of-phase test

The phase is complete when:

* A played note audibly evolves from upper rows to lower rows during attack
* The sound settles and holds on the bottom row during sustain
* Releasing the key fades the sound out correctly
* The result is recognizably image-driven and musically controllable

---

### Phase 5 — Stability and Usability Refinement

Polish the instrument so it is reliable and pleasant to use:

* Smooth transitions between rows to reduce harsh discontinuities
* Improve behavior for repeated note triggering
* Add lightweight visual feedback for current row or scan position
* Expose essential controls such as attack and release
* Fix edge cases in image loading, note retriggering, and timing

This phase is not about changing the concept. It is about making the concept robust.

#### End-of-phase test

The phase is complete when:

* The instrument can be played repeatedly without unstable behavior
* Row transitions are smoother and less abrupt
* Controls behave consistently
* The app feels like a usable first version rather than a prototype fragment

---

## Milestones

* A sine-wave synthesizer works in the browser
* The computer QWERTY keyboard plays musical notes correctly
* An uploaded image can produce playable waveforms
* A note scans through image rows during attack
* The bottom row is sustained correctly
* The instrument is stable and responsive enough to play
