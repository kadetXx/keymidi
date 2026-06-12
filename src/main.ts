import { app, ipcMain, nativeImage } from 'electron';
import { menubar } from 'menubar';
import * as path from 'path';
import { Engine } from './engine/engine';
import { ScaleName } from './engine/scales';
import { EngineEvent, EngineState } from './engine/types';

// Tray-only app: no dock icon.
app.dock?.hide();

const engine = new Engine();

const iconOn = path.join(__dirname, '..', 'assets', 'iconTemplate.png');

const mb = menubar({
  index: `file://${path.join(__dirname, '..', 'ui', 'index.html')}`,
  icon: nativeImage.createFromPath(iconOn),
  browserWindow: {
    width: 400,
    height: 550,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  },
  preloadWindow: true,
  showDockIcon: false,
});

function pushToWindow(channel: string, payload: EngineState | EngineEvent[]): void {
  mb.window?.webContents.send(channel, payload);
}

/**
 * Events fire per note, so fast playing produces hundreds per second. Sending
 * each one straight to the popover once saturated the IPC/DOM pipeline badly
 * enough to back up uiohook's event tap — which sits in macOS's keyboard
 * delivery chain, so the whole system's typing lagged (v0.2.0 incident).
 * Batch them into one IPC per frame-ish window, and drop them outright while
 * the popover is hidden: the log is a live signal monitor, not a recorder.
 */
const EVENT_FLUSH_MS = 33;
const EVENT_QUEUE_MAX = 60; // matches the log's MAX_LINES — older lines would be pruned anyway
let eventQueue: EngineEvent[] = [];
let eventFlushTimer: NodeJS.Timeout | null = null;

function queueEvent(ev: EngineEvent): void {
  if (!mb.window?.isVisible()) return;
  eventQueue.push(ev);
  if (eventQueue.length > EVENT_QUEUE_MAX) eventQueue.splice(0, eventQueue.length - EVENT_QUEUE_MAX);
  if (eventFlushTimer) return;
  eventFlushTimer = setTimeout(() => {
    eventFlushTimer = null;
    const batch = eventQueue;
    eventQueue = [];
    pushToWindow('keymidi:events', batch);
  }, EVENT_FLUSH_MS);
}

let lastTooltip = '';

mb.on('ready', () => {
  engine.onState((state) => {
    pushToWindow('keymidi:state', state);
    // Tray tooltip doubles as an at-a-glance status
    const tip = `KeyMIDI — ${state.enabled ? 'ON' : 'paused'} · ${state.mode} · oct ${state.octave}`;
    if (tip !== lastTooltip) {
      lastTooltip = tip;
      mb.tray.setToolTip(tip);
    }
  });
  engine.onEvent(queueEvent);

  engine.start();
});

// Re-sync the popover every time it opens
mb.on('show', () => {
  pushToWindow('keymidi:state', engine.getState());
});

// If the popover hides mid-tap, the mouseup never reaches the UI — kill any
// palette notes so nothing hangs. Keyboard-held notes are untouched.
mb.on('hide', () => engine.paletteAllOff());

// ------------------------------------------------------------------- IPC

ipcMain.handle('keymidi:getState', () => engine.getState());
ipcMain.on('keymidi:setEnabled', (_e: unknown, enabled: boolean) => engine.setEnabled(enabled));
ipcMain.on('keymidi:setMode', (_e: unknown, mode: 'piano' | 'chords' | 'drums') => engine.setMode(mode));
ipcMain.on('keymidi:setOctave', (_e: unknown, octave: number) => engine.setOctave(octave));
ipcMain.on('keymidi:setVelocity', (_e: unknown, velocity: number) => engine.setVelocity(velocity));
ipcMain.handle('keymidi:getScaleChords', (_e: unknown, rootPc: number, scale: ScaleName) =>
  engine.getScaleChords(rootPc, scale));
ipcMain.handle('keymidi:getScaleNotes', (_e: unknown, rootPc: number, scale: ScaleName) =>
  engine.getScaleNotes(rootPc, scale));
ipcMain.handle('keymidi:getDrumPads', () => engine.getDrumPads());
ipcMain.on('keymidi:paletteDown', (_e: unknown, notes: number[], label: string, drum: boolean) =>
  engine.paletteDown(notes, label, drum));
ipcMain.on('keymidi:paletteUp', (_e: unknown, notes: number[], drum: boolean) =>
  engine.paletteUp(notes, drum));
ipcMain.on('keymidi:quit', () => {
  engine.stop();
  app.quit();
});

app.on('will-quit', () => engine.stop());
