# KeyMIDI

A macOS menu bar app that turns your computer keyboard into a context-aware MIDI
controller for Ableton Live (or any DAW). Lives in the title bar — click the icon
to open the controls, flip the switch to turn it on/off.

What makes it different from Easy MIDI / MidiKeys / Ableton's built-in keyboard:

- **Real-time chord grammar** — hold `G`, tap `7`, hear a Gdom7. No presets.
- **Mnemonic drums** — `K` = Kick, `S` = Snare, `H` = Hat. No grid to memorize.
- **Global keyboard hook** — works while Ableton is focused/fullscreen.

---

## Requirements

- macOS (Apple Silicon or Intel)
- Node.js 18+ and npm (`brew install node` if you don't have it)
- Xcode Command Line Tools — needed to compile the two native modules:
  ```
  xcode-select --install
  ```

## Install

```bash
cd keymidi
npm install
npm run rebuild:electron   # rebuilds native modules against Electron's ABI
npm start
```

`npm start` compiles the TypeScript and launches the app. You'll see the
KeyMIDI icon appear in your menu bar.

### First-run: Accessibility permission (this WILL bite you once)

The global keyboard hook needs the macOS Accessibility permission. On first
launch, macOS either prompts you or the hook silently does nothing. Go to:

**System Settings → Privacy & Security → Accessibility** → enable **Electron**
(or **KeyMIDI** if you've packaged it).

If you granted it and keys still don't register, remove the entry, re-add it,
and relaunch — macOS caches this per-binary and gets confused after rebuilds.

### Ableton setup (one-time)

KeyMIDI creates its own virtual MIDI source — no IAC driver needed.

1. Launch KeyMIDI first, then Ableton.
2. Ableton → Settings → Link/MIDI: you'll see **KeyMIDI** as an input.
3. Enable **Track** (and **Remote** if you want) for the KeyMIDI input.
4. Arm a MIDI track. Flip the switch in the KeyMIDI popover (or hit **F9**). Play.

---

## How to play

The popover (click the menu bar icon) has the on/off switch, mode buttons,
octave/velocity steppers, a live signal log, and Quit. Everything also has a
global hotkey so you never have to leave Ableton:

| Key | Action |
|---|---|
| **F9** | KeyMIDI on/off |
| **F6 / F7 / F8** | Piano / Chord / Drum mode |
| **, / .** | Octave down / up |
| **− / =** | Velocity down / up (steps of 10) |

### Chord mode (the whole point)

- Hold a root letter **A–G** → the root note sounds immediately.
- While holding it, tap a digit → the root becomes the full chord:

| Digit | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0 |
|---|---|---|---|---|---|---|---|---|---|---|
| Quality | maj | min | dim | aug | sus4 | 6 | **dom7** | maj7 | min7 | sus2 |

- Hold **;** while pressing the root to sharpen it (`;` + `G` = G#).
- Release the root letter → everything belonging to it stops.
- Multiple roots track independently — hold `C` and `G`, give each a quality,
  release them separately. The digit applies to the most recently pressed root.

So: `G` + `7` = Gdom7. `;`+`F` + `9` = F#min7. Think a chord, play it.

### Drum mode (channel 10, General MIDI)

| Key | K | S | H | O | C | R | X | T | Y | U | M | N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Sound | Kick | Snare | Closed Hat | Open Hat | Clap | Ride | Crash | Low Tom | Mid Tom | High Tom | Rimshot | Shaker |

Drop Ableton's Drum Rack on the track and the GM notes land on sensible pads.

### Piano mode

Ableton-style single row: `A W S E D F T G Y H U J K O L P ;` =
C C# D D# E F F# G G# A A# B C C# D D# E.

---

## The one honest limitation

The hook **listens** globally but doesn't **swallow** keys — while KeyMIDI is on,
your keystrokes still reach the focused app. If Ableton has key mappings on
letters you play, they'll fire. Two mitigations:

1. **F9 is your friend** — toggle off the instant you need to type.
2. Avoid mapping Ableton shortcuts onto the playing keys, or play with a
   non-armed window focused (e.g. Finder) since the hook works regardless.

This is a macOS architecture constraint (true key suppression needs a CGEventTap
that consumes events — a possible v2 via a small native module).

## CLI debug mode

The whole MIDI engine runs without Electron, per the original build plan:

```bash
npm run rebuild:node   # native modules back to Node's ABI
npm run cli
```

(Then `npm run rebuild:electron` again before `npm start` — the two ABIs are
incompatible, this is normal Electron friction.)

## Troubleshooting

- **No "KeyMIDI" input in Ableton** → launch KeyMIDI before Ableton, or rescan
  MIDI in Ableton's settings. Check the popover footer: the port LED should be
  green / "OPEN".
- **Keys don't register at all** → Accessibility permission (see above).
- **`npm install` fails on uiohook-napi / easymidi** → missing Xcode CLT;
  run `xcode-select --install` then `npm install` again.
- **App starts but `Error: Module did not self-register`** → ABI mismatch;
  run `npm run rebuild:electron`.
- **Hanging note** → flip F9 off/on; that sends all-notes-off.

## Project layout

```
src/main.ts            Electron main: tray, popover, IPC
src/preload.ts         Safe bridge between popover and engine
src/cli.ts             Terminal debug mode
src/engine/engine.ts   Facade: hotkeys, state, wiring
src/engine/listener.ts Global keyboard hook (uiohook-napi)
src/engine/resolver.ts Key events → MIDI notes, per-root tracking
src/engine/chords.ts   Chord grammar (roots, qualities, sharp key)
src/engine/drums.ts    Mnemonic GM drum map
src/engine/piano.ts    Ableton-style row layout
src/engine/midi.ts     Virtual MIDI port (easymidi)
ui/index.html          The popover
```

All MIDI-critical code runs in the Electron main process; the popover is
display-only, so the UI adds zero latency to the keyboard → MIDI path.
Expected total latency: ~5–15 ms (hook → engine → CoreMIDI → Ableton).
If it feels slow, lower Ableton's audio buffer to 64–128 samples.
