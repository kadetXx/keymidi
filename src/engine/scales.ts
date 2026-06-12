/**
 * Scale palette — diatonic chords of a key
 * ----------------------------------------
 * Powers the popover's "Scales" page: pick a root + scale, get the seven
 * chords that belong to that key as tappable buttons. The five scales
 * songwriters actually reach for; more modes are a table-row away.
 */
import { QUALITIES, NOTE_NAMES, midiToName } from './chords';

export type ScaleName = 'major' | 'minor' | 'harmonicMinor' | 'dorian' | 'mixolydian';

export interface ScaleChord {
  label: string;    // "Dm" — chord name shown on the button
  numeral: string;  // "ii" — roman numeral, the songwriter's vocabulary
  notes: number[];  // ready-to-play MIDI notes at the requested octave
}

export interface ScaleNote {
  label: string;   // "D4" — note name shown on the pad
  degree: string;  // "2" — scale degree, the melodic counterpart of a numeral
  notes: number[]; // single MIDI note (array, so it plays through paletteDown)
}

interface Degree {
  offset: number;   // semitones above the scale root
  quality: string;  // QUALITIES name: 'maj' | 'min' | 'dim'
  numeral: string;
}

// Triad quality of each scale degree (the I-ii-iii… everyone learns).
const SCALES: Record<ScaleName, Degree[]> = {
  major: [
    { offset: 0,  quality: 'maj', numeral: 'I' },
    { offset: 2,  quality: 'min', numeral: 'ii' },
    { offset: 4,  quality: 'min', numeral: 'iii' },
    { offset: 5,  quality: 'maj', numeral: 'IV' },
    { offset: 7,  quality: 'maj', numeral: 'V' },
    { offset: 9,  quality: 'min', numeral: 'vi' },
    { offset: 11, quality: 'dim', numeral: 'vii°' },
  ],
  minor: [
    { offset: 0,  quality: 'min', numeral: 'i' },
    { offset: 2,  quality: 'dim', numeral: 'ii°' },
    { offset: 3,  quality: 'maj', numeral: 'III' },
    { offset: 5,  quality: 'min', numeral: 'iv' },
    { offset: 7,  quality: 'min', numeral: 'v' },
    { offset: 8,  quality: 'maj', numeral: 'VI' },
    { offset: 10, quality: 'maj', numeral: 'VII' },
  ],
  harmonicMinor: [
    { offset: 0,  quality: 'min', numeral: 'i' },
    { offset: 2,  quality: 'dim', numeral: 'ii°' },
    { offset: 3,  quality: 'aug', numeral: 'III+' },
    { offset: 5,  quality: 'min', numeral: 'iv' },
    { offset: 7,  quality: 'maj', numeral: 'V' },
    { offset: 8,  quality: 'maj', numeral: 'VI' },
    { offset: 11, quality: 'dim', numeral: 'vii°' },
  ],
  dorian: [
    { offset: 0,  quality: 'min', numeral: 'i' },
    { offset: 2,  quality: 'min', numeral: 'ii' },
    { offset: 3,  quality: 'maj', numeral: '♭III' },
    { offset: 5,  quality: 'maj', numeral: 'IV' },
    { offset: 7,  quality: 'min', numeral: 'v' },
    { offset: 9,  quality: 'dim', numeral: 'vi°' },
    { offset: 10, quality: 'maj', numeral: '♭VII' },
  ],
  mixolydian: [
    { offset: 0,  quality: 'maj', numeral: 'I' },
    { offset: 2,  quality: 'min', numeral: 'ii' },
    { offset: 4,  quality: 'dim', numeral: 'iii°' },
    { offset: 5,  quality: 'maj', numeral: 'IV' },
    { offset: 7,  quality: 'min', numeral: 'v' },
    { offset: 9,  quality: 'min', numeral: 'vi' },
    { offset: 10, quality: 'maj', numeral: '♭VII' },
  ],
};

// Chord intervals come from the same table chord mode uses — one source of truth.
const INTERVALS_BY_NAME: Record<string, number[]> = Object.fromEntries(
  Object.values(QUALITIES).map((q) => [q.name, q.intervals]),
);

const SUFFIX: Record<string, string> = { maj: '', min: 'm', dim: 'dim', aug: 'aug' };

/** The notes of a scale (its seven degrees) as single-note pads — piano mode. */
export function scaleNotes(rootPc: number, scale: ScaleName, octave: number): ScaleNote[] {
  const base = 12 * (octave + 1) + rootPc;
  return SCALES[scale].map(({ offset }, i) => {
    const note = base + offset;
    return {
      label: midiToName(note),
      degree: String(i + 1),
      notes: note >= 0 && note <= 127 ? [note] : [],
    };
  });
}

/** The seven diatonic chords of a key, voiced at the given octave. */
export function scaleChords(rootPc: number, scale: ScaleName, octave: number): ScaleChord[] {
  const base = 12 * (octave + 1) + rootPc; // root at the engine's octave (C4 = 60)
  return SCALES[scale].map(({ offset, quality, numeral }) => {
    const chordRoot = base + offset;
    return {
      label: NOTE_NAMES[(rootPc + offset) % 12] + SUFFIX[quality],
      numeral,
      notes: INTERVALS_BY_NAME[quality]
        .map((iv) => chordRoot + iv)
        .filter((n) => n >= 0 && n <= 127),
    };
  });
}
