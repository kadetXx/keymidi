/**
 * Drum mode — mnemonic layout
 * ---------------------------
 * Keys are named after the sound, not laid out as a grid:
 *   K = Kick, S = Snare, H = closed Hat, O = Open hat, C = Clap,
 *   R = Ride, X = crash (the "smash" key), T/Y/U = toms low→high,
 *   M = riM shot, N = shaker.
 * Notes follow General MIDI drum numbering and are sent on MIDI channel 10.
 */

export interface DrumPad {
  note: number;
  label: string;
}

export const DRUM_MAP: Record<string, DrumPad> = {
  K: { note: 36, label: 'Kick' },
  S: { note: 38, label: 'Snare' },
  H: { note: 42, label: 'Closed Hat' },
  O: { note: 46, label: 'Open Hat' },
  C: { note: 39, label: 'Clap' },
  R: { note: 51, label: 'Ride' },
  X: { note: 49, label: 'Crash' },
  T: { note: 41, label: 'Low Tom' },
  Y: { note: 47, label: 'Mid Tom' },
  U: { note: 50, label: 'High Tom' },
  M: { note: 37, label: 'Rimshot' },
  N: { note: 70, label: 'Shaker' },
};

/**
 * Pad grid — seven pads (same count as scale/chord modes). The keyboard still
 * plays every sound in DRUM_MAP, including toms on T/Y/U; the key is the caption.
 */
const PAD_KEYS = ['K', 'S', 'H', 'O', 'C', 'X', 'R'];
export const DRUM_PADS: { key: string; label: string; notes: number[] }[] =
  PAD_KEYS.map((key) => ({ key, label: DRUM_MAP[key].label, notes: [DRUM_MAP[key].note] }));
