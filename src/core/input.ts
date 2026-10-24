/** Entrada de teclado e mouse com noções de "pressionado neste frame". */

export type Action =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'jump'
  | 'attack'
  | 'heavy'
  | 'dash'
  | 'ability'
  | 'confirm'
  | 'pause'
  | 'mute'
  | 'back';

const KEYMAP: Record<string, Action> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  Space: 'jump',
  KeyJ: 'attack',
  KeyK: 'heavy',
  KeyL: 'dash',
  ShiftLeft: 'dash',
  ShiftRight: 'dash',
  KeyE: 'ability',
  Enter: 'confirm',
  NumpadEnter: 'confirm',
  Escape: 'pause',
  KeyP: 'pause',
  KeyM: 'mute',
  Backspace: 'back',
  KeyQ: 'back',
};

interface KeyState {
  raw: Set<string>;
  down: Set<Action>;
  pressed: Set<Action>;
  released: Set<Action>;
}

export class Input {
  readonly canvas: HTMLCanvasElement;
  private state: KeyState = {
    raw: new Set(),
    down: new Set(),
    pressed: new Set(),
    released: new Set(),
  };

  mouse = { x: 0, y: 0, down: false, clicked: false, moved: false };

  /** Chamado no primeiro gesto do usuário (para liberar áudio). */
  onFirstGesture: (() => void) | null = null;
  private gestureFired = false;
  private scale = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    window.addEventListener('keydown', this.handleKeyDown, { passive: false });
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    canvas.addEventListener('click', this.handleClick);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private fireGesture(): void {
    if (this.gestureFired) return;
    this.gestureFired = true;
    this.onFirstGesture?.();
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    const action = KEYMAP[e.code];
    this.fireGesture();
    if (!action) return;
    // Evita rolagem/atalhos do navegador nos controles do jogo.
    if (
      e.code === 'Space' ||
      e.code === 'ArrowUp' ||
      e.code === 'ArrowDown' ||
      e.code === 'ArrowLeft' ||
      e.code === 'ArrowRight' ||
      e.code === 'Backspace'
    ) {
      e.preventDefault();
    }
    if (!this.state.raw.has(e.code)) {
      this.state.pressed.add(action);
    }
    this.state.raw.add(e.code);
    this.state.down.add(action);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    const action = KEYMAP[e.code];
    this.state.raw.delete(e.code);
    if (!action) return;
    // Só libera a ação se nenhuma tecla alternativa ainda estiver pressionada.
    const stillDown = Object.entries(KEYMAP).some(
      ([code, act]) => act === action && this.state.raw.has(code),
    );
    if (!stillDown) {
      this.state.down.delete(action);
      this.state.released.add(action);
    }
  };

  private handleBlur = (): void => {
    this.state.raw.clear();
    this.state.down.clear();
  };

  private eventToCanvas(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    this.scale = this.canvas.width / rect.width;
    return {
      x: (e.clientX - rect.left) * this.scale,
      y: (e.clientY - rect.top) * this.scale,
    };
  }

  private handleMouseMove = (e: MouseEvent): void => {
    const p = this.eventToCanvas(e);
    this.mouse.x = p.x;
    this.mouse.y = p.y;
    this.mouse.moved = true;
  };

  private handleMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    this.fireGesture();
    const p = this.eventToCanvas(e);
    this.mouse.x = p.x;
    this.mouse.y = p.y;
    this.mouse.down = true;
  };

  private handleMouseUp = (): void => {
    this.mouse.down = false;
  };

  private handleClick = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    const p = this.eventToCanvas(e);
    this.mouse.x = p.x;
    this.mouse.y = p.y;
    this.mouse.clicked = true;
  };

  isDown(action: Action): boolean {
    return this.state.down.has(action);
  }

  pressed(action: Action): boolean {
    return this.state.pressed.has(action);
  }

  released(action: Action): boolean {
    return this.state.released.has(action);
  }

  /** Limpa eventos de frame. Chamar ao final de cada atualização. */
  endFrame(): void {
    this.state.pressed.clear();
    this.state.released.clear();
    this.mouse.clicked = false;
    this.mouse.moved = false;
  }

  clear(): void {
    this.state.pressed.clear();
    this.state.released.clear();
    this.state.down.clear();
    this.state.raw.clear();
  }
}
