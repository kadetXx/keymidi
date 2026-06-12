# KeyMIDI



https://github.com/user-attachments/assets/5604e601-8df6-4dc7-bdb8-619c7c4a5923



A macOS menu bar app that lives in the title bar and turns your computer keyboard into a stupefied MIDI
controller for Ableton/DAWs.

What makes it different from Easy MIDI / MidiKeys / Ableton's built-in keyboard:

- **Mnemonic drums**: `K` = Kick, `S` = Snare, `H` = Hat. No grid to memorize.
- **Real-time chord grammar**: hold `G`, tap `1`, hear Gmaj. No presets. See the
  [chord mode digit map](#chord-mode-the-whole-point).
- **Global keyboard hook**: works while DAW is focused/fullscreen/unfocused/it just works.

## Install

macOS only for now (Apple Silicon or Intel).

### Homebrew

```bash
brew install --cask kadetXx/tap/keymidi
```

### Direct download

Grab the `.dmg` for your Mac (arm64 = Apple Silicon, x64 = Intel) from
[Releases](https://github.com/kadetXx/keymidi/releases), drag KeyMIDI to
Applications, and open it.

## Accessibility permission (one-time)

You'll only need to do this **ONCE**. The global keyboard hook needs the macOS Accessibility permission. On first
launch, macOS either prompts you or the hook silently does nothing. Go to:

**System Settings → Privacy & Security → Accessibility** → enable **KeyMIDI**
(or **Electron** if you're running from source).

If you granted it and keys still don't register, remove the entry, re-add it,
and relaunch. MacOS caches this per-binary and gets confused after rebuilds.

## Using with Ableton

KeyMIDI creates its own virtual MIDI source (no IAC driver needed) and Ableton
picks it up automatically. Arm a MIDI track, flip the switch in the popover
(or hit **F9**), play. If Ableton doesn't hear it, see
[Troubleshooting](#troubleshooting).

## How to play

The popover (click the menu bar icon) has the on/off switch, mode buttons,
octave/velocity steppers, a live signal log, and Quit. Everything also has a
global hotkey so you never have to leave Ableton:

| Key                    | Action                                     |
| ---------------------- | ------------------------------------------ |
| **`F9`**               | KeyMIDI on/off                             |
| **`F6` / `F7` / `F8`** | Piano / Chord / Drum mode                  |
| **`,` / `.`**          | Octave down / up                           |
| **`−` / `=`**          | Velocity down / up (steps of 10)           |
| **`[` / `]`**          | Flat / sharp modifier (chord & piano mode) |

### #Piano mode

Single notes by letter name, same model as chord mode, minus the qualities.
Press **C D E F G A B** to play those natural notes; hold **]** for sharp or
**[** for flat (`]`+`C` = C#, `[`+`B` = Bb); shift range with the octave keys.

### #Chord mode (the whole point)

- Hold a root letter **A–G** → the root note sounds immediately.
- While holding it, tap a digit → the root becomes the full chord:

| Digit   | `1` | `2` | `3` | `4` | `5`  | `6` | `7`      | `8`  | `9`  | `0`  |
| ------- | --- | --- | --- | --- | ---- | --- | -------- | ---- | ---- | ---- |
| Quality | maj | min | dim | aug | sus4 | 6   | **dom7** | maj7 | min7 | sus2 |

- Hold **]** while pressing the root to sharpen it (`]` + `G` = G#).
- Hold **[** while pressing the root to flatten it (`[` + `G` = Gb).
- Release the root letter → everything belonging to it stops.
- Multiple roots track independently: hold `C` and `G`, give each a quality,
  release them separately. The digit applies to the most recently pressed root.

So: `G` + `7` = Gdom7. `]`+`F` + `9` = F#min7. `[`+`B` + `1` = Bbmaj. Think a
chord, play it.

### #Drum mode (channel 10, General MIDI)

| Key   | `K`  | `S`   | `H`        | `O`      | `C`  | `R`  | `X`   | `T`     | `Y`     | `U`      | `M`     | `N`    |
| ----- | ---- | ----- | ---------- | -------- | ---- | ---- | ----- | ------- | ------- | -------- | ------- | ------ |
| Sound | Kick | Snare | Closed Hat | Open Hat | Clap | Ride | Crash | Low Tom | Mid Tom | High Tom | Rimshot | Shaker |

Drop Ableton's Drum Rack on the track and the GM notes land on sensible pads.

### #Scales view (mouse-only, the landing page)

The popover opens on the **Scales** view: pick a root and a scale (major,
minor, harmonic minor, dorian, mixolydian) and the seven chords of that key
show up as pads with roman numerals; so the classic pop progression
`I–V–vi–IV` (the "four chords" behind half the charts) is just four taps in
order. Tap to play, hold to sustain. No keyboard switch needed; it's all mouse, and it works
even while keyboard capture is off. The **KEYS/SCALES** button in the footer
flips between this and the keyboard modes.

Pro combo: scales send on channel 1, drums on channel 10. Hit **`F8`** (drum
mode) while on the Scales view and you can tap chord pads with the mouse while
drumming `K`/`S`/`H` on the keyboard, two instruments, two Ableton tracks,
one laptop.

## Current limitation

The hook **listens** globally but doesn't **swallow** keys so, while KeyMIDI is on,
your keystrokes still reach the focused app. If Ableton (or any other currently focused app) has key mappings on
letters you play, they'll also be triggered alongside. Two mitigations:

1. **F9 is your friend**: toggle off the instant you need to type.
2. **Focus elsewhere**: move focus to keymidi's control panel or a non-armed window (e.g. Finder) since the hook works regardless.

## Running from source

- Node.js 18+ (22.12+ if you want to package the DMG) and npm
- Xcode Command Line Tools, needed to compile the two native modules:
  `xcode-select --install`

```bash
git clone https://github.com/kadetXx/keymidi.git && cd keymidi
npm install
npm run rebuild:electron   # rebuilds native modules against Electron's ABI
npm start                  # compiles TypeScript and launches the app
```

To package an installable DMG locally (unsigned):

```bash
npm run dist
```

To cut a signed, notarized release from your Mac:

```bash
# 1. Bump version and push tag
npm version patch && git push --follow-tags

# 2. One-time credential setup
cp packaging/release.sample.env packaging/release.env
# Edit release.env — point APPLE_API_KEY at your .p8 file (keep it outside the repo)

# 3. Build + sign, notarize DMGs, upload to GitHub
npm run release:package
npm run release:notarize
npm run release:publish

# Or all at once:
npm run release -- --publish
```

Scripts live in `packaging/` (`package.sh`, `notarize.sh`, `publish.sh`).
CI no longer runs on tag push — releases are local/terminal.

## CLI debug mode

The whole MIDI engine can be run without Electron:

```bash
npm run rebuild:node   # native modules back to Node's ABI
npm run cli
```

(Then `npm run rebuild:electron` again before `npm start`; the two ABIs are
incompatible, this is normal Electron friction.)

## Performance

All MIDI-critical code runs in the Electron main process. The popover/control panel is
display-only, so the UI adds zero latency to the keyboard → MIDI path.

Expected total latency: ~5–15 ms (hook → engine → CoreMIDI → Ableton).
If it feels slow, lower Ableton's audio buffer to 64–128 samples.

## Troubleshooting

- **macOS blocks the app after install** ("damaged", "can't be opened", or
  quarantine dialog) → remove the quarantine flag:
  
  ```bash
  xattr -dr com.apple.quarantine /Applications/KeyMIDI.app
  ```
  or open KeyMIDI once, then go to **System Settings → Privacy &
  Security** and click **Open Anyway**.
- **Ableton doesn't hear KeyMIDI** → check the popover footer first (the port
  LED should be green / "OPEN"), then Ableton → Settings → Link/MIDI: **KeyMIDI**
  should be listed as an input with **Track** enabled. enable it if not.
  Also make sure your armed track's MIDI input is **All Ins** (or KeyMIDI
  specifically). Still missing from the list? Relaunch KeyMIDI, or restart
  Ableton to rescan.
- **Splitting scales & drums onto two tracks** (the pro combo) → set one
  track's input to **KeyMIDI · Ch. 1** (chords/notes) and another to
  **KeyMIDI · Ch. 10** (drums), instead of All Ins.
- **Keys don't register at all** → Accessibility permission (see above).
- **`npm install` fails on uiohook-napi / easymidi** → missing Xcode CLT;
  run `xcode-select --install` then `npm install` again.
- **App starts but `Error: Module did not self-register`** → ABI mismatch;
  run `npm run rebuild:electron`.
- **Hanging note** → flip F9 off/on; that sends all-notes-off.

## License

[MIT](LICENSE) © Collins Enebeli
