import { uIOhook, UiohookKey } from 'uiohook-napi';

/**
 * Global keyboard hook.
 * uiohook-napi installs an OS-level event tap, so key events arrive no matter
 * which app has focus (this is what requires the macOS Accessibility permission).
 * Note: it LISTENS, it does not SWALLOW — keys still reach the focused app.
 */

// Reverse map: uiohook keycode → key name ("A", "1", "Semicolon", "F9", ...)
const CODE_TO_NAME: Map<number, string> = new Map();
for (const [name, code] of Object.entries(UiohookKey)) {
  if (typeof code === 'number' && !CODE_TO_NAME.has(code)) {
    CODE_TO_NAME.set(code, name);
  }
}

export type KeyHandler = (keyName: string) => void;

export class KeyboardListener {
  private held = new Set<string>();
  private running = false;

  constructor(
    private onKeyDown: KeyHandler,
    private onKeyUp: KeyHandler,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;

    uIOhook.on('keydown', (e) => {
      const name = CODE_TO_NAME.get(e.keycode);
      if (!name) return;            // unknown key → silently ignore
      if (this.held.has(name)) return; // suppress OS key-repeat
      this.held.add(name);
      this.onKeyDown(name);
    });

    uIOhook.on('keyup', (e) => {
      const name = CODE_TO_NAME.get(e.keycode);
      if (!name) return;
      this.held.delete(name);
      this.onKeyUp(name);
    });

    uIOhook.start();
  }

  isHeld(name: string): boolean {
    return this.held.has(name);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    uIOhook.stop();
  }
}
