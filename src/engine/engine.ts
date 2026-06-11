import { KeyboardListener } from './listener';
import { MidiOut } from './midi';
import { Resolver } from './resolver';
import { ScaleChord, ScaleName, scaleChords } from './scales';
import {
  EngineState,
  EngineEvent,
  EventListener,
  StateListener,
  Mode,
} from './types';

/**
 * Engine facade. Everything MIDI-critical lives here in the main process —
 * the popover UI is display/control only and adds zero latency.
 *
 * Global hotkeys (always active, even while the engine is paused):
 *   F6 = piano mode, F7 = chord mode, F8 = drum mode, F9 = toggle on/off
 */
export class Engine {
  private midi = new MidiOut('KeyMIDI');
  private state: EngineState = {
    enabled: false, // start paused so launching the app doesn't hijack typing
    mode: 'chords',
    octave: 4,
    velocity: 100,
    portName: 'KeyMIDI',
    portOpen: false,
  };

  private stateListeners: StateListener[] = [];
  private eventListeners: EventListener[] = [];

  private resolver = new Resolver(
    this.midi,
    this.state,
    (k) => this.listener.isHeld(k),
    (ev) => this.emitEvent(ev),
    () => this.emitState(),
  );

  private listener = new KeyboardListener(
    (key) => this.onKeyDown(key),
    (key) => this.resolver.handleKeyUp(key),
  );

  start(): void {
    this.state.portOpen = this.midi.open();
    this.listener.start();
    this.emitEvent({
      ts: Date.now(),
      kind: 'system',
      label: this.state.portOpen
        ? `Virtual port "${this.state.portName}" open`
        : 'MIDI port failed to open',
    });
    this.emitState();
  }

  stop(): void {
    this.resolver.allNotesOff();
    this.listener.stop();
    this.midi.close();
  }

  private onKeyDown(key: string): void {
    // Hotkeys first — they work even while paused
    switch (key) {
      case 'F6': return this.setMode('piano');
      case 'F7': return this.setMode('chords');
      case 'F8': return this.setMode('drums');
      case 'F9': return this.setEnabled(!this.state.enabled);
    }
    this.resolver.handleKeyDown(key);
  }

  // ------------------------------------------------------------- controls

  setEnabled(enabled: boolean): void {
    if (enabled === this.state.enabled) return;
    this.state.enabled = enabled;
    if (!enabled) this.resolver.allNotesOff();
    this.emitEvent({
      ts: Date.now(),
      kind: 'system',
      label: enabled ? 'KeyMIDI ON' : 'KeyMIDI paused',
    });
    this.emitState();
  }

  setMode(mode: Mode): void {
    this.resolver.setMode(mode);
  }

  setOctave(octave: number): void {
    if (octave < 0 || octave > 7) return;
    this.state.octave = octave;
    this.emitState();
  }

  setVelocity(velocity: number): void {
    this.state.velocity = Math.min(127, Math.max(1, velocity));
    this.emitState();
  }

  // ------------------------------------------------------- scale palette

  /** Diatonic chords for the popover's palette, voiced at the current octave. */
  getScaleChords(rootPc: number, scale: ScaleName): ScaleChord[] {
    return scaleChords(rootPc, scale, this.state.octave);
  }

  paletteDown(notes: number[], label: string): void {
    this.resolver.paletteDown(notes, label);
  }

  paletteUp(notes: number[]): void {
    this.resolver.paletteUp(notes);
  }

  paletteAllOff(): void {
    this.resolver.paletteAllOff();
  }

  getState(): EngineState {
    return { ...this.state };
  }

  // ------------------------------------------------------------ listeners

  onState(fn: StateListener): void {
    this.stateListeners.push(fn);
  }

  onEvent(fn: EventListener): void {
    this.eventListeners.push(fn);
  }

  private emitState(): void {
    const snapshot = this.getState();
    for (const fn of this.stateListeners) fn(snapshot);
  }

  private emitEvent(ev: EngineEvent): void {
    for (const fn of this.eventListeners) fn(ev);
  }
}
