import { app, ipcMain, nativeImage } from 'electron';
import { menubar } from 'menubar';
import * as path from 'path';
import { Engine } from './engine/engine';
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
    height: 480,
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

function pushToWindow(channel: string, payload: EngineState | EngineEvent): void {
  mb.window?.webContents.send(channel, payload);
}

mb.on('ready', () => {
  engine.onState((state) => {
    pushToWindow('keymidi:state', state);
    // Tray tooltip doubles as an at-a-glance status
    mb.tray.setToolTip(
      `KeyMIDI — ${state.enabled ? 'ON' : 'paused'} · ${state.mode} · oct ${state.octave}`,
    );
  });
  engine.onEvent((ev) => pushToWindow('keymidi:event', ev));

  engine.start();
});

// Re-sync the popover every time it opens
mb.on('show', () => {
  pushToWindow('keymidi:state', engine.getState());
});

// ------------------------------------------------------------------- IPC

ipcMain.handle('keymidi:getState', () => engine.getState());
ipcMain.on('keymidi:setEnabled', (_e: unknown, enabled: boolean) => engine.setEnabled(enabled));
ipcMain.on('keymidi:setMode', (_e: unknown, mode: 'piano' | 'chords' | 'drums') => engine.setMode(mode));
ipcMain.on('keymidi:setOctave', (_e: unknown, octave: number) => engine.setOctave(octave));
ipcMain.on('keymidi:setVelocity', (_e: unknown, velocity: number) => engine.setVelocity(velocity));
ipcMain.on('keymidi:quit', () => {
  engine.stop();
  app.quit();
});

app.on('will-quit', () => engine.stop());
