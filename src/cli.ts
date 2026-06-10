/**
 * CLI debug mode — runs the full engine in a terminal, no Electron.
 *
 *   npm run cli
 *
 * Useful for verifying the keyboard hook + MIDI path before touching the
 * menu bar shell. Hotkeys are identical to the app:
 *   F6 piano · F7 chords · F8 drums · F9 on/off · Ctrl+C to quit
 *
 * NOTE: if you've already run `npm run rebuild:electron`, the native modules
 * are compiled against Electron's ABI and plain `node` can't load them.
 * Run `npm run rebuild:node` first, and `npm run rebuild:electron` again
 * before going back to the app.
 */
import { Engine } from './engine/engine';

const engine = new Engine();

engine.onState((s) => {
  console.log(
    `[state] ${s.enabled ? 'ON ' : 'OFF'} | mode=${s.mode} | octave=${s.octave} | velocity=${s.velocity} | port=${s.portOpen ? s.portName : 'CLOSED'}`,
  );
});

engine.onEvent((ev) => {
  console.log(`[${ev.kind}] ${ev.label}`);
});

console.log('KeyMIDI CLI — F9 to enable, Ctrl+C to quit.');
engine.start();
engine.setEnabled(true);

process.on('SIGINT', () => {
  engine.stop();
  process.exit(0);
});
