/**
 * Chord mode grammar
 * ------------------
 * Hold a root letter (A–G) → the root note sounds immediately.
 * While holding it, tap a quality digit → the root is replaced by the full chord.
 * Hold ']' while pressing the root to sharpen it (']' + G = G#).
 * Hold '[' while pressing the root to flatten it ('[' + G = Gb).
 * Release the root letter → everything belonging to that root stops.
 * Multiple roots are tracked independently.
 */

// Pitch class of each natural root (C = 0)
export const ROOT_PITCH_CLASS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

// Accidental modifiers, held while pressing a root: ']' raises, '[' lowers.
export const SHARP_KEY = 'BracketRight';
export const FLAT_KEY = 'BracketLeft';

export interface ChordQuality {
  name: string;            // suffix shown in the log, e.g. "dom7"
  intervals: number[];     // semitones from root, always starting at 0
}

// Digit row → chord quality
export const QUALITIES: Record<string, ChordQuality> = {
  '1': { name: 'maj',  intervals: [0, 4, 7] },
  '2': { name: 'min',  intervals: [0, 3, 7] },
  '3': { name: 'dim',  intervals: [0, 3, 6] },
  '4': { name: 'aug',  intervals: [0, 4, 8] },
  '5': { name: 'sus4', intervals: [0, 5, 7] },
  '6': { name: '6',    intervals: [0, 4, 7, 9] },
  '7': { name: 'dom7', intervals: [0, 4, 7, 10] },
  '8': { name: 'maj7', intervals: [0, 4, 7, 11] },
  '9': { name: 'min7', intervals: [0, 3, 7, 10] },
  '0': { name: 'sus2', intervals: [0, 2, 7] },
};

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToName(note: number): string {
  const name = NOTE_NAMES[((note % 12) + 12) % 12];
  const octave = Math.floor(note / 12) - 1;
  return `${name}${octave}`;
}

/** MIDI note number for a root letter at a given octave (C4 = 60). */
export function rootToMidi(letter: string, octave: number, accidental: number): number {
  const pc = ROOT_PITCH_CLASS[letter] + accidental;
  return 12 * (octave + 1) + pc;
}
