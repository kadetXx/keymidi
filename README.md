# KeyMIDI

A macOS menu bar app that lives in the title bar and turns your computer keyboard into a stupefied MIDI
controller for Ableton/DAWs.

What makes it different from Easy MIDI / MidiKeys / Ableton's built-in keyboard:

- **Mnemonic drums**: `K` = Kick, `S` = Snare, `H` = Hat. No grid to memorize.
- **Real-time chord grammar**: hold `G`, tap `1`, hear a Gmaj7. No presets.
- **Global keyboard hook**: works while Ableton is focused/fullscreen/unfocused/it just works.

## Install

macOS only for now (Apple Silicon or Intel).

### Homebrew

```bash
brew install --cask --no-quarantine kadetXx/tap/keymidi
```

The `--no-quarantine` flag is needed because early releases aren't yet
signed/notarized with apple. Without it, macOS will refuse to open the app.
Once notarized releases ship, the flag won't be necessary.

### Direct download

Grab the `.dmg` for your Mac (arm64 = Apple Silicon, x64 = Intel) from
[Releases](https://github.com/kadetXx/keymidi/releases), drag KeyMIDI to
Applications. Until releases are notarized, macOS will block the first launch;
go to **System Settings → Privacy & Security**, scroll down, and click
**Open Anyway**.

## Accessibility permission (one-time)

You'll only need to do this **ONCE**. The global keyboard hook needs the macOS Accessibility permission. On first
launch, macOS either prompts you or the hook silently does nothing. Go to:

**System Settings → Privacy & Security → Accessibility** → enable **KeyMIDI**
(or **Electron** if you're running from source).

If you granted it and keys still don't register, remove the entry, re-add it,
and relaunch — macOS caches this per-binary and gets confused after rebuilds.


## Ableton setup (one-time)

KeyMIDI creates its own virtual MIDI source — no IAC driver needed.

1. Launch KeyMIDI first, then Ableton.
2. Ableton → Settings → Link/MIDI: you'll see **KeyMIDI** as an input.
3. Enable **Track** (and **Remote** if you want) for the KeyMIDI input.
4. Arm a MIDI track. Flip the switch in the KeyMIDI popover (or hit **F9**). Play.

## How to play

The popover (click the menu bar icon) has the on/off switch, mode buttons,
octave/velocity steppers, a live signal log, and Quit. Everything also has a
global hotkey so you never have to leave Ableton:

| Key              | Action                                               |
| ---------------- | ---------------------------------------------------- |
| **`F9`**           | KeyMIDI on/off                                       |
| **`F6` / `F7` / `F8`** | Piano / Chord / Drum mode                            |
| **`,` / `.`**        | Octave down / up                                     |
| **`−` / `=`**        | Velocity down / up (steps of 10)                     |
| **`[` / `]`**        | Flat / sharp modifier (chord & piano mode)           |

### #Piano mode

Single notes by letter name — same model as chord mode, minus the qualities.
Press **C D E F G A B** to play those natural notes; hold **]** for sharp or
**[** for flat (`]`+`C` = C#, `[`+`B` = Bb); shift range with the octave keys.

### #Chord mode (the whole point)

- Hold a root letter **A–G** → the root note sounds immediately.
- While holding it, tap a digit → the root becomes the full chord:

| Digit   | `1`   | `2`   | `3`   | `4`   | `5`    | `6`   | `7`        | `8`    | `9`    | `0`    |
| ------- | --- | --- | --- | --- | ---- | --- | -------- | ---- | ---- | ---- |
| Quality | maj | min | dim | aug | sus4 | 6   | **dom7** | maj7 | min7 | sus2 |

- Hold **]** while pressing the root to sharpen it (`]` + `G` = G#).
- Hold **[** while pressing the root to flatten it (`[` + `G` = Gb).
- Release the root letter → everything belonging to it stops.
- Multiple roots track independently — hold `C` and `G`, give each a quality,
  release them separately. The digit applies to the most recently pressed root.

So: `G` + `7` = Gdom7. `]`+`F` + `9` = F#min7. `[`+`B` + `1` = Bbmaj. Think a
chord, play it.

### #Drum mode (channel 10, General MIDI)

| Key   | `K`    | `S`     | `H`          | `O`        | `C`    | `R`    | `X`     | `T`       | `Y`       | `U`        | `M`       | `N`      |
| ----- | ---- | ----- | ---------- | -------- | ---- | ---- | ----- | ------- | ------- | -------- | ------- | ------ |
| Sound | Kick | Snare | Closed Hat | Open Hat | Clap | Ride | Crash | Low Tom | Mid Tom | High Tom | Rimshot | Shaker |

Drop Ableton's Drum Rack on the track and the GM notes land on sensible pads.

## Current limitation

The hook **listens** globally but doesn't **swallow** keys so, while KeyMIDI is on,
your keystrokes still reach the focused app. If Ableton (or any other currently focused app) has key mappings on
letters you play, they'll also be triggered alongside. Two mitigations:

1. **F9 is your friend**: toggle off the instant you need to type.
2. **Focus elsewhere**: move focus to keymidi's control panel or a non-armed window (e.g. Finder) since the hook works regardless.

## Running from source

- Node.js 18+ (22.12+ if you want to package the DMG) and npm
- Xcode Command Line Tools — needed to compile the two native modules:
  `xcode-select --install`

```bash
git clone https://github.com/kadetXx/keymidi.git && cd keymidi
npm install
npm run rebuild:electron   # rebuilds native modules against Electron's ABI
npm start                  # compiles TypeScript and launches the app
```

To package an installable DMG locally: 

```bash
npm run dist
```

To publish a new release:

```bash
npm version patch && git push --follow-tags
```

## CLI debug mode

The whole MIDI engine can be run without Electron:

```bash
npm run rebuild:node   # native modules back to Node's ABI
npm run cli
```

(Then `npm run rebuild:electron` again before `npm start` — the two ABIs are
incompatible, this is normal Electron friction.)

## Performance

All MIDI-critical code runs in the Electron main process. The popover/control panel is
display-only, so the UI adds zero latency to the keyboard → MIDI path.

Expected total latency: ~5–15 ms (hook → engine → CoreMIDI → Ableton).
If it feels slow, lower Ableton's audio buffer to 64–128 samples.

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

## License

[MIT](LICENSE) © Collins Enebeli
