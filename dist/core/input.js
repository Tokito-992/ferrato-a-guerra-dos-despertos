/** Entrada de teclado, mouse, toque e controle com noções de "pressionado neste frame". */
import { BINDABLE_ACTIONS, defaultBindings } from './bindings.js?v=6ccbb66fdb55';
const DIRECTIONS = ['left', 'right', 'up', 'down'];
/** Mapeamento do Gamepad API padrão (Xbox/PlayStation/Switch Pro). */
const GAMEPAD_BUTTONS = [
    [0, 'jump'],
    [0, 'confirm'],
    [2, 'attack'],
    [3, 'heavy'],
    [4, 'ability'],
    [5, 'ability'],
    [6, 'ability'],
    [7, 'ability'],
    [8, 'back'],
    [9, 'pause'],
    [12, 'up'],
    [13, 'down'],
    [14, 'left'],
    [15, 'right'],
];
const STICK_DEADZONE = 0.36;
const STICK_RELEASE = 0.22;
const MENU_REPEAT_DELAY = 0.45;
const MENU_REPEAT_RATE = 0.14;
function emptyPadState() {
    return { down: new Set(), pressed: new Set(), released: new Set() };
}
function isButtonDown(button) {
    return Boolean(button && (button.pressed || button.value > 0.5));
}
export class Input {
    constructor(canvas) {
        this.state = {
            raw: new Set(),
            down: new Set(),
            pressed: new Set(),
            released: new Set(),
        };
        this.virtualDown = new Set();
        this.virtualPressed = new Set();
        this.virtualReleased = new Set();
        this.bindings = defaultBindings();
        this.keymap = new Map();
        this.rawPressed = new Set();
        this.mouseButtonsDown = new Set();
        this.mouseButtonsPressed = new Set();
        this.mouseButtonsReleased = new Set();
        this.captureDevice = null;
        this.captureCallback = null;
        this.suppressClickUntil = 0;
        this.pads = [emptyPadState(), emptyPadState()];
        this.padSlots = [null, null];
        this.padRepeat = [new Map(), new Map()];
        this.gameplayContext = false;
        this.mouse = { x: 0, y: 0, down: false, clicked: false, moved: false };
        /** Chamado no primeiro gesto do usuário (para liberar áudio). */
        this.onFirstGesture = null;
        /** Avisa quando um controle é conectado (índice do Gamepad). */
        this.onGamepadConnected = null;
        this.gestureFired = false;
        this.lastTouchAt = 0;
        this.handleKeyDown = (e) => {
            // Overlays de interface (ex.: guia de instalação) têm prioridade no teclado.
            if (document.body.classList.contains('ui-overlay-open'))
                return;
            if (this.captureDevice) {
                e.preventDefault();
                e.stopPropagation();
                if (e.repeat)
                    return;
                if (e.code === 'Escape') {
                    this.finishCapture(null);
                    return;
                }
                if (this.captureDevice === 'keyboard') {
                    this.finishCapture({ device: 'keyboard', code: e.code });
                }
                else if (e.code === 'Delete' || e.code === 'Backspace') {
                    this.finishCapture({ device: 'mouse', button: null });
                }
                return;
            }
            const action = this.keymap.get(e.code);
            this.fireGesture();
            this.rawPressed.add(e.code);
            // Evita rolagem/atalhos do navegador nos controles do jogo.
            if (e.code === 'Space' || e.code === 'Backspace' || e.code.startsWith('Arrow')) {
                e.preventDefault();
            }
            if (!action)
                return;
            e.preventDefault();
            if (!this.state.raw.has(e.code)) {
                this.state.pressed.add(action);
            }
            this.state.raw.add(e.code);
            this.state.down.add(action);
        };
        this.handleKeyUp = (e) => {
            const action = this.keymap.get(e.code);
            this.state.raw.delete(e.code);
            if (!action)
                return;
            // Só libera a ação se nenhuma tecla alternativa ainda estiver pressionada.
            let stillDown = false;
            for (const [code, act] of this.keymap) {
                if (act === action && this.state.raw.has(code)) {
                    stillDown = true;
                    break;
                }
            }
            if (!stillDown) {
                this.state.down.delete(action);
                this.state.released.add(action);
            }
        };
        this.handleBlur = () => {
            this.state.raw.clear();
            this.state.down.clear();
            this.rawPressed.clear();
            this.mouseButtonsDown.clear();
            this.releaseAllVirtual();
            this.finishCapture(null);
        };
        this.handleGamepadConnected = (e) => {
            this.fireGesture();
            this.onGamepadConnected?.(e.gamepad.index);
        };
        this.handleMouseMove = (e) => {
            const p = this.eventToCanvas(e);
            this.mouse.x = p.x;
            this.mouse.y = p.y;
            this.mouse.moved = true;
        };
        this.handleMouseDown = (e) => {
            if (this.captureDevice) {
                if (this.captureDevice === 'mouse') {
                    e.preventDefault();
                    if (e.button === 0)
                        this.suppressClickUntil = performance.now() + 600;
                    this.finishCapture({ device: 'mouse', button: e.button });
                }
                else {
                    e.preventDefault();
                }
                return;
            }
            // Toques sintetizam eventos de mouse em alguns navegadores; não os trate como clique.
            if (performance.now() - this.lastTouchAt < 700)
                return;
            this.fireGesture();
            const p = this.eventToCanvas(e);
            this.mouse.x = p.x;
            this.mouse.y = p.y;
            if (e.button === 0)
                this.mouse.down = true;
            this.mouseButtonsDown.add(e.button);
            this.mouseButtonsPressed.add(e.button);
            // Evita autoscroll do botão do meio e navegação dos botões laterais.
            if (e.button !== 0)
                e.preventDefault();
        };
        this.handleMouseUp = (e) => {
            if (e.button === 0)
                this.mouse.down = false;
            if (this.mouseButtonsDown.delete(e.button)) {
                this.mouseButtonsReleased.add(e.button);
            }
            if (e.button !== 0)
                e.preventDefault();
        };
        this.handleClick = (e) => {
            if (e.button !== 0)
                return;
            if (this.captureDevice)
                return;
            if (performance.now() < this.suppressClickUntil) {
                // Consome apenas o clique gerado pelo próprio botão capturado.
                this.suppressClickUntil = 0;
                return;
            }
            // O toque já registra o clique em touchstart; evita confirmação dupla.
            if (performance.now() - this.lastTouchAt < 700)
                return;
            const p = this.eventToCanvas(e);
            this.mouse.x = p.x;
            this.mouse.y = p.y;
            this.mouse.clicked = true;
        };
        this.handleTouchStart = (e) => {
            const touch = e.changedTouches[0];
            if (!touch)
                return;
            this.fireGesture();
            const p = this.eventToCanvas(touch);
            this.mouse.x = p.x;
            this.mouse.y = p.y;
            this.mouse.down = true;
            this.mouse.clicked = true;
            this.lastTouchAt = performance.now();
            if (e.cancelable)
                e.preventDefault();
        };
        this.handleTouchMove = (e) => {
            const touch = e.changedTouches[0];
            if (!touch)
                return;
            const p = this.eventToCanvas(touch);
            this.mouse.x = p.x;
            this.mouse.y = p.y;
            this.mouse.moved = true;
            if (e.cancelable)
                e.preventDefault();
        };
        this.handleTouchEnd = (e) => {
            this.mouse.down = false;
            this.lastTouchAt = performance.now();
            if (e.cancelable)
                e.preventDefault();
        };
        this.canvas = canvas;
        this.setBindings(this.bindings);
        this.touchMode =
            'ontouchstart' in window ||
                (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
                window.matchMedia('(pointer: coarse)').matches;
        window.addEventListener('keydown', this.handleKeyDown, { passive: false });
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('blur', this.handleBlur);
        window.addEventListener('gamepadconnected', this.handleGamepadConnected);
        canvas.addEventListener('mousemove', this.handleMouseMove);
        canvas.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mouseup', this.handleMouseUp);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        canvas.addEventListener('auxclick', (e) => e.preventDefault());
        canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        canvas.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
    }
    fireGesture() {
        if (this.gestureFired)
            return;
        this.gestureFired = true;
        this.onFirstGesture?.();
    }
    /** Atualiza o mapa de teclas a partir do save. */
    setBindings(bindings) {
        this.bindings = bindings;
        this.keymap.clear();
        for (const action of BINDABLE_ACTIONS) {
            for (const code of bindings[action].keyboard) {
                if (!this.keymap.has(code))
                    this.keymap.set(code, action);
            }
        }
        // Escape é reservado para cancelar/voltar em qualquer tela.
        this.keymap.set('Escape', 'pause');
    }
    /** Captura o próximo botão pressionado (usado pela tela de controles). */
    captureNext(device, callback) {
        this.cancelCapture();
        this.clear();
        this.captureDevice = device;
        this.captureCallback = callback;
    }
    cancelCapture() {
        if (!this.captureDevice)
            return;
        this.finishCapture(null);
    }
    isCapturing() {
        return this.captureDevice !== null;
    }
    finishCapture(capture) {
        const callback = this.captureCallback;
        this.captureDevice = null;
        this.captureCallback = null;
        this.mouse.clicked = false;
        this.mouseButtonsPressed.clear();
        this.mouseButtonsReleased.clear();
        this.state.pressed.clear();
        this.state.released.clear();
        callback?.(capture);
    }
    /** Tecla crua do frame, mesmo que não esteja mapeada (ex.: 1, 2, R). */
    pressedCode(code) {
        return this.rawPressed.has(code);
    }
    mouseActionDown(action) {
        if (!this.gameplayContext)
            return false;
        const binding = this.bindings[action];
        return Boolean(binding && binding.mouse !== null && this.mouseButtonsDown.has(binding.mouse));
    }
    mouseActionPressed(action) {
        if (!this.gameplayContext)
            return false;
        const binding = this.bindings[action];
        return Boolean(binding && binding.mouse !== null && this.mouseButtonsPressed.has(binding.mouse));
    }
    mouseActionReleased(action) {
        if (!this.gameplayContext)
            return false;
        const binding = this.bindings[action];
        return Boolean(binding && binding.mouse !== null && this.mouseButtonsReleased.has(binding.mouse));
    }
    /** Em combate, B dá dash; nos menus, B volta. */
    setGameplayContext(active) {
        this.gameplayContext = active;
    }
    /** Lê os controles conectados. Chamar uma vez por frame, antes da cena. */
    poll(dt) {
        const api = typeof navigator !== 'undefined' ? navigator.getGamepads?.() : null;
        const connected = [];
        if (api) {
            for (const pad of api)
                if (pad)
                    connected.push(pad);
        }
        const byIndex = new Map();
        for (const pad of connected)
            byIndex.set(pad.index, pad);
        // O primeiro controle conectado sempre vira o jogador 1.
        const slot0 = this.padSlots[0];
        let p0 = slot0 !== null ? byIndex.get(slot0) : undefined;
        if (!p0) {
            p0 = connected[0];
            if (p0) {
                this.padSlots[0] = p0.index;
                if (this.padSlots[1] === p0.index)
                    this.padSlots[1] = null;
            }
            else {
                this.padSlots[0] = null;
            }
        }
        // O segundo controle conectado fica reservado para o futuro co-op local.
        const slot1 = this.padSlots[1];
        let p1 = slot1 !== null ? byIndex.get(slot1) : undefined;
        if (p1 && p0 && p1.index === p0.index) {
            p1 = undefined;
            this.padSlots[1] = null;
        }
        if (!p1) {
            p1 = connected.find((pad) => pad.index !== p0?.index);
            this.padSlots[1] = p1 ? p1.index : null;
        }
        this.applyPad(0, p0, dt);
        this.applyPad(1, p1, dt);
    }
    applyPad(slot, pad, dt) {
        const state = this.pads[slot];
        const prev = state.down;
        const next = new Set();
        if (pad) {
            for (const [index, action] of GAMEPAD_BUTTONS) {
                if (isButtonDown(pad.buttons[index]))
                    next.add(action);
            }
            if (isButtonDown(pad.buttons[1])) {
                next.add('cancel');
                next.add(this.gameplayContext ? 'dash' : 'back');
            }
            const lx = pad.axes[0] ?? 0;
            const ly = pad.axes[1] ?? 0;
            if (lx < -(prev.has('left') ? STICK_RELEASE : STICK_DEADZONE))
                next.add('left');
            if (lx > (prev.has('right') ? STICK_RELEASE : STICK_DEADZONE))
                next.add('right');
            if (ly < -(prev.has('up') ? STICK_RELEASE : STICK_DEADZONE))
                next.add('up');
            if (ly > (prev.has('down') ? STICK_RELEASE : STICK_DEADZONE))
                next.add('down');
        }
        const pressed = new Set();
        const released = new Set();
        for (const action of next)
            if (!prev.has(action))
                pressed.add(action);
        for (const action of prev)
            if (!next.has(action))
                released.add(action);
        // Repetição suave das direções para navegar nos menus segurando o direcional.
        for (const action of DIRECTIONS) {
            if (!next.has(action)) {
                this.padRepeat[slot].delete(action);
                continue;
            }
            if (!prev.has(action)) {
                this.padRepeat[slot].set(action, MENU_REPEAT_DELAY);
                continue;
            }
            const remaining = (this.padRepeat[slot].get(action) ?? 0) - dt;
            if (remaining <= 0) {
                pressed.add(action);
                this.padRepeat[slot].set(action, MENU_REPEAT_RATE);
            }
            else {
                this.padRepeat[slot].set(action, remaining);
            }
        }
        state.down = next;
        state.pressed = pressed;
        state.released = released;
    }
    /** Informa se há um controle ativo para o jogador. */
    gamepadConnected(player = 0) {
        return this.padSlots[player] !== null;
    }
    eventToCanvas(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / Math.max(1, rect.width)) * this.canvas.width,
            y: ((e.clientY - rect.top) / Math.max(1, rect.height)) * this.canvas.height,
        };
    }
    /** Entrada virtual usada pelos botões de toque. */
    setVirtual(action, down) {
        if (down) {
            if (!this.virtualDown.has(action)) {
                this.virtualDown.add(action);
                this.virtualPressed.add(action);
            }
            return;
        }
        if (this.virtualDown.has(action)) {
            this.virtualDown.delete(action);
            this.virtualReleased.add(action);
        }
    }
    releaseAllVirtual() {
        for (const action of this.virtualDown)
            this.virtualReleased.add(action);
        this.virtualDown.clear();
    }
    isDown(action, player = 0) {
        if (player === 0) {
            return (this.state.down.has(action) ||
                this.virtualDown.has(action) ||
                this.pads[0].down.has(action) ||
                this.mouseActionDown(action));
        }
        return this.pads[1].down.has(action);
    }
    pressed(action, player = 0) {
        if (player === 0) {
            return (this.state.pressed.has(action) ||
                this.virtualPressed.has(action) ||
                this.pads[0].pressed.has(action) ||
                this.mouseActionPressed(action));
        }
        return this.pads[1].pressed.has(action);
    }
    released(action, player = 0) {
        if (player === 0) {
            return (this.state.released.has(action) ||
                this.virtualReleased.has(action) ||
                this.pads[0].released.has(action) ||
                this.mouseActionReleased(action));
        }
        return this.pads[1].released.has(action);
    }
    /** Limpa eventos de frame. Chamar ao final de cada atualização. */
    endFrame() {
        this.state.pressed.clear();
        this.state.released.clear();
        this.virtualPressed.clear();
        this.virtualReleased.clear();
        this.pads[0].pressed.clear();
        this.pads[0].released.clear();
        this.pads[1].pressed.clear();
        this.pads[1].released.clear();
        this.rawPressed.clear();
        this.mouseButtonsPressed.clear();
        this.mouseButtonsReleased.clear();
        this.mouse.clicked = false;
        this.mouse.moved = false;
    }
    clear() {
        this.cancelCapture();
        this.state.pressed.clear();
        this.state.released.clear();
        this.state.down.clear();
        this.state.raw.clear();
        this.virtualPressed.clear();
        this.virtualReleased.clear();
        this.virtualDown.clear();
        this.rawPressed.clear();
        this.mouseButtonsDown.clear();
        this.mouseButtonsPressed.clear();
        this.mouseButtonsReleased.clear();
        this.pads[0].pressed.clear();
        this.pads[0].released.clear();
        this.pads[1].pressed.clear();
        this.pads[1].released.clear();
        this.padRepeat[0].clear();
        this.padRepeat[1].clear();
        // Mantém direções seguradas sem repetir imediatamente na cena nova.
        for (const action of this.pads[0].down) {
            if (DIRECTIONS.includes(action))
                this.padRepeat[0].set(action, MENU_REPEAT_DELAY);
        }
        for (const action of this.pads[1].down) {
            if (DIRECTIONS.includes(action))
                this.padRepeat[1].set(action, MENU_REPEAT_DELAY);
        }
        // Evita que o clique usado para trocar de cena avance a próxima tela.
        this.mouse.clicked = false;
        this.mouse.moved = false;
        this.mouse.down = false;
    }
}
//# sourceMappingURL=input.js.map