import { contextBridge, ipcRenderer } from 'electron';
import { EngineEvent, EngineState, Mode } from './engine/types';
import { ScaleChord, ScaleName } from './engine/scales';

contextBridge.exposeInMainWorld('keymidi', {
  getState: (): Promise<EngineState> => ipcRenderer.invoke('keymidi:getState'),
  setEnabled: (enabled: boolean) => ipcRenderer.send('keymidi:setEnabled', enabled),
  setMode: (mode: Mode) => ipcRenderer.send('keymidi:setMode', mode),
  setOctave: (octave: number) => ipcRenderer.send('keymidi:setOctave', octave),
  setVelocity: (velocity: number) => ipcRenderer.send('keymidi:setVelocity', velocity),
  getScaleChords: (rootPc: number, scale: ScaleName): Promise<ScaleChord[]> =>
    ipcRenderer.invoke('keymidi:getScaleChords', rootPc, scale),
  paletteDown: (notes: number[], label: string) => ipcRenderer.send('keymidi:paletteDown', notes, label),
  paletteUp: (notes: number[]) => ipcRenderer.send('keymidi:paletteUp', notes),
  quit: () => ipcRenderer.send('keymidi:quit'),
  onState: (fn: (state: EngineState) => void) =>
    ipcRenderer.on('keymidi:state', (_e: unknown, state: EngineState) => fn(state)),
  // Events arrive batched (~30ms windows) — one IPC per batch, not per note.
  onEvents: (fn: (evs: EngineEvent[]) => void) =>
    ipcRenderer.on('keymidi:events', (_e: unknown, evs: EngineEvent[]) => fn(evs)),
});
