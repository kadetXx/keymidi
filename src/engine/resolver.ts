import { MidiOut } from './midi';
import {
  ROOT_PITCH_CLASS,
  QUALITIES,
  SHARP_KEY,
  rootToMidi,
  midiToName,
} from './chords';
import { DRUM_MAP } from './drums';
import { PIANO_OFFSETS, pianoToMidi } from './piano';
import { EngineState, EngineEvent, Mode } from './types';

const MELODIC_CHANNEL = 0; // MIDI channel 1
const DRUM_CHANNEL = 9;    // MIDI channel 10 (GM drums)

const OCTAVE_DOWN = 'Comma';
const OCTAVE_UP = 'Period';
const VEL_DOWN = 'Minus';
const VEL_UP = 'Equal';

interface HeldRoot {
  rootNote: number;     // MIDI note of the root as pressed (incl. sharp)
  letter: string;       // "G"
  sharp: boolean;
  notes: number[];      // notes currently sounding for this root
}

export class Resolver {
  /** notes currently sounding, keyed by the physical key that started them */
  private activePiano = new Map<string, number>();
  private activeDrums = new Map<string, number>();
  private heldRoots = new Map<string, HeldRoot>();
  private rootOrder: string[] = []; // most recent root last

  constructor(
    private midi: MidiOut,
    private state: EngineState,
    private isKeyHeld: (name: string) => boolean,
    private emit: (ev: EngineEvent) => void,
    private stateChanged: () => void,
  ) {}

  // ---------------------------------------------------------------- keydown

  handleKeyDown(key: string): void {
    if (!this.state.enabled) return;

    // Global controls (work in every mode)
    if (key === OCTAVE_DOWN) return this.shiftOctave(-1);
    if (key === OCTAVE_UP) return this.shiftOctave(+1);
    if (key === VEL_DOWN) return this.shiftVelocity(-10);
    if (key === VEL_UP) return this.shiftVelocity(+10);

    switch (this.state.mode) {
      case 'piano': return this.pianoDown(key);
      case 'chords': return this.chordDown(key);
      case 'drums': return this.drumDown(key);
    }
  }

  handleKeyUp(key: string): void {
    // Note-offs must fire even if the engine was toggled off mid-hold,
    // otherwise notes hang. So no enabled-check here.
    switch (this.state.mode) {
      case 'piano': return this.pianoUp(key);
      case 'chords': return this.chordUp(key);
      case 'drums': return this.drumUp(key);
    }
  }

  // ------------------------------------------------------------------ piano

  private pianoDown(key: string): void {
    if (!(key in PIANO_OFFSETS)) return;
    if (this.activePiano.has(key)) return;
    const note = pianoToMidi(key, this.state.octave);
    if (note < 0 || note > 127) return;
    this.midi.noteOn(note, this.state.velocity, MELODIC_CHANNEL);
    this.activePiano.set(key, note);
    this.emit({ ts: Date.now(), kind: 'noteon', label: midiToName(note) });
  }

  private pianoUp(key: string): void {
    const note = this.activePiano.get(key);
    if (note === undefined) return;
    this.midi.noteOff(note, MELODIC_CHANNEL);
    this.activePiano.delete(key);
  }

  // ----------------------------------------------------------------- chords

  private chordDown(key: string): void {
    // Root letter pressed → sound the root immediately
    if (key in ROOT_PITCH_CLASS) {
      if (this.heldRoots.has(key)) return;
      const sharp = this.isKeyHeld(SHARP_KEY);
      const rootNote = rootToMidi(key, this.state.octave, sharp);
      if (rootNote < 0 || rootNote > 127) return;
      this.midi.noteOn(rootNote, this.state.velocity, MELODIC_CHANNEL);
      this.heldRoots.set(key, { rootNote, letter: key, sharp, notes: [rootNote] });
      this.rootOrder.push(key);
      this.emit({
        ts: Date.now(),
        kind: 'noteon',
        label: `${key}${sharp ? '#' : ''} root → ${midiToName(rootNote)}`,
      });
      return;
    }

    // Quality digit pressed → upgrade the most recent held root to a chord
    if (key in QUALITIES) {
      const rootKey = this.rootOrder[this.rootOrder.length - 1];
      if (!rootKey) return; // no root held → digit means nothing, ignore
      const root = this.heldRoots.get(rootKey);
      if (!root) return;

      const quality = QUALITIES[key];

      // Stop whatever this root is currently sounding…
      for (const n of root.notes) this.midi.noteOff(n, MELODIC_CHANNEL);

      // …and replace it with the chord.
      const chordNotes = quality.intervals
        .map((iv) => root.rootNote + iv)
        .filter((n) => n >= 0 && n <= 127);
      for (const n of chordNotes) {
        this.midi.noteOn(n, this.state.velocity, MELODIC_CHANNEL);
      }
      root.notes = chordNotes;

      this.emit({
        ts: Date.now(),
        kind: 'chord',
        label: `${root.letter}${root.sharp ? '#' : ''}${quality.name} → ${chordNotes
          .map(midiToName)
          .join(' ')}`,
      });
    }
  }

  private chordUp(key: string): void {
    const root = this.heldRoots.get(key);
    if (!root) return;
    for (const n of root.notes) this.midi.noteOff(n, MELODIC_CHANNEL);
    this.heldRoots.delete(key);
    this.rootOrder = this.rootOrder.filter((k) => k !== key);
  }

  // ------------------------------------------------------------------ drums

  private drumDown(key: string): void {
    const pad = DRUM_MAP[key];
    if (!pad) return;
    if (this.activeDrums.has(key)) return;
    this.midi.noteOn(pad.note, this.state.velocity, DRUM_CHANNEL);
    this.activeDrums.set(key, pad.note);
    this.emit({ ts: Date.now(), kind: 'drum', label: pad.label });
  }

  private drumUp(key: string): void {
    const note = this.activeDrums.get(key);
    if (note === undefined) return;
    this.midi.noteOff(note, DRUM_CHANNEL);
    this.activeDrums.delete(key);
  }

  // -------------------------------------------------------------- controls

  private shiftOctave(delta: number): void {
    const next = this.state.octave + delta;
    if (next < 0 || next > 7) return;
    this.state.octave = next;
    this.emit({ ts: Date.now(), kind: 'system', label: `Octave ${next}` });
    this.stateChanged();
  }

  private shiftVelocity(delta: number): void {
    const next = Math.min(127, Math.max(1, this.state.velocity + delta));
    this.state.velocity = next;
    this.emit({ ts: Date.now(), kind: 'system', label: `Velocity ${next}` });
    this.stateChanged();
  }

  /** Kill every sounding note — used on mode switch, disable, and quit. */
  allNotesOff(): void {
    for (const note of this.activePiano.values()) this.midi.noteOff(note, MELODIC_CHANNEL);
    this.activePiano.clear();
    for (const root of this.heldRoots.values()) {
      for (const n of root.notes) this.midi.noteOff(n, MELODIC_CHANNEL);
    }
    this.heldRoots.clear();
    this.rootOrder = [];
    for (const note of this.activeDrums.values()) this.midi.noteOff(note, DRUM_CHANNEL);
    this.activeDrums.clear();
  }

  setMode(mode: Mode): void {
    if (mode === this.state.mode) return;
    this.allNotesOff();
    this.state.mode = mode;
    this.emit({ ts: Date.now(), kind: 'system', label: `Mode: ${mode}` });
    this.stateChanged();
  }
}
