export type Mode = 'piano' | 'chords' | 'drums';

export interface EngineState {
  enabled: boolean;
  mode: Mode;
  octave: number;      // 1..7, middle C lives in octave 4
  velocity: number;    // 1..127
  portName: string;
  portOpen: boolean;
}

export interface EngineEvent {
  ts: number;
  kind: 'noteon' | 'noteoff' | 'chord' | 'drum' | 'system';
  label: string;       // human-readable, e.g. "Gdom7 → G3 B3 D4 F4"
}

export type StateListener = (state: EngineState) => void;
export type EventListener = (ev: EngineEvent) => void;
