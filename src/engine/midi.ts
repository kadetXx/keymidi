import easymidi from 'easymidi';

interface NoteMessage {
  note: number;
  velocity: number;
  channel: number;
}

interface VirtualOutput {
  send(type: 'noteon' | 'noteoff', msg: NoteMessage): void;
  close(): void;
}

/**
 * Virtual MIDI output.
 * easymidi's `virtual: true` creates a CoreMIDI virtual source on macOS,
 * so Ableton sees "KeyMIDI" as a MIDI input with zero setup — no IAC driver needed.
 */
export class MidiOut {
  private output: VirtualOutput | null = null;
  readonly portName: string;

  constructor(portName = 'KeyMIDI') {
    this.portName = portName;
  }

  open(): boolean {
    try {
      this.output = new easymidi.Output(this.portName, true) as unknown as VirtualOutput;
      return true;
    } catch (err) {
      console.error('Failed to open virtual MIDI port:', err);
      this.output = null;
      return false;
    }
  }

  get isOpen(): boolean {
    return this.output !== null;
  }

  noteOn(note: number, velocity: number, channel: number): void {
    if (!this.output) return;
    if (note < 0 || note > 127) return; // skip out-of-range, never crash
    this.output.send('noteon', { note, velocity, channel });
  }

  noteOff(note: number, channel: number): void {
    if (!this.output) return;
    if (note < 0 || note > 127) return;
    this.output.send('noteoff', { note, velocity: 0, channel });
  }

  close(): void {
    if (this.output) {
      this.output.close();
      this.output = null;
    }
  }
}
