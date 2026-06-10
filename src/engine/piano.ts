/**
 * Piano mode — letter-name layout (single notes)
 * ----------------------------------------------
 * Same mental model as chord mode: each letter key plays the note of that
 * name. Hold the sharp (']') or flat ('[') modifier to raise/lower a semitone,
 * and shift range with the octave keys. Unlike chord mode there are no quality
 * digits — piano mode is one note per key.
 *
 *   C D E F G A B   play those natural notes
 *   ] + key         sharp   (C + ] = C#)
 *   [ + key         flat    (B + [ = Bb)
 */
import { ROOT_PITCH_CLASS, rootToMidi } from './chords';

// Piano mode plays the same letter set as chord roots.
export const PIANO_NOTES = ROOT_PITCH_CLASS;

/** MIDI note for a piano-mode key, including the held accidental (-1, 0, +1). */
export function pianoToMidi(key: string, octave: number, accidental: number): number {
  return rootToMidi(key, octave, accidental);
}
