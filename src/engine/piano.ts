/**
 * Piano mode — Ableton-style single-row layout
 * --------------------------------------------
 * Home row = white keys starting at C, the row above = black keys.
 *   A W S E D F T G Y H U J K O L P ;
 *   C C# D D# E F F# G G# A A# B C C# D D# E
 */

export const PIANO_OFFSETS: Record<string, number> = {
  A: 0,
  W: 1,
  S: 2,
  E: 3,
  D: 4,
  F: 5,
  T: 6,
  G: 7,
  Y: 8,
  H: 9,
  U: 10,
  J: 11,
  K: 12,
  O: 13,
  L: 14,
  P: 15,
  Semicolon: 16,
};

/** MIDI note for a piano-mode key at a given octave (A at octave 4 = C4 = 60). */
export function pianoToMidi(key: string, octave: number): number {
  return 12 * (octave + 1) + PIANO_OFFSETS[key];
}
