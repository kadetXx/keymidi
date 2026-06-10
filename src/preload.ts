import { contextBridge, ipcRenderer } from 'electron';
import { EngineEvent, EngineState, Mode } from './engine/types';

contextBridge.exposeInMainWorld('keymidi', {
  getState: (): Promise<EngineState> => ipcRenderer.invoke('keymidi:getState'),
  setEnabled: (enabled: boolean) => ipcRenderer.send('keymidi:setEnabled', enabled),
  setMode: (mode: Mode) => ipcRenderer.send('keymidi:setMode', mode),
  setOctave: (octave: number) => ipcRenderer.send('keymidi:setOctave', octave),
  setVelocity: (velocity: number) => ipcRenderer.send('keymidi:setVelocity', velocity),
  quit: () => ipcRenderer.send('keymidi:quit'),
  onState: (fn: (state: EngineState) => void) =>
    ipcRenderer.on('keymidi:state', (_e: unknown, state: EngineState) => fn(state)),
  onEvent: (fn: (ev: EngineEvent) => void) =>
    ipcRenderer.on('keymidi:event', (_e: unknown, ev: EngineEvent) => fn(ev)),
});
