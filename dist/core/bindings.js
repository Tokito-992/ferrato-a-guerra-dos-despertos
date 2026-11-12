/** Mapeamento configurável de teclado e mouse. */
export const BINDABLE_ACTIONS = [
    'left',
    'right',
    'up',
    'down',
    'jump',
    'attack',
    'heavy',
    'dash',
    'ability',
    'confirm',
    'pause',
    'mute',
    'back',
];
export const ACTION_LABELS = {
    left: 'ESQUERDA',
    right: 'DIREITA',
    up: 'CIMA',
    down: 'BAIXO',
    jump: 'PULO',
    attack: 'ATAQUE LEVE',
    heavy: 'ATAQUE PESADO',
    dash: 'DASH',
    ability: 'ESPECIAL',
    confirm: 'CONFIRMAR',
    pause: 'PAUSA',
    mute: 'ÁUDIO',
    back: 'VOLTAR',
};
/** Teclas padrão de cada ação; algumas ações mantêm duas ou três alternativas. */
const DEFAULT_KEYBOARD = {
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    jump: ['Space'],
    attack: ['KeyJ'],
    heavy: ['KeyK'],
    dash: ['KeyL', 'ShiftLeft', 'ShiftRight'],
    ability: ['KeyE'],
    confirm: ['Enter', 'NumpadEnter'],
    pause: ['KeyP'],
    mute: ['KeyM'],
    back: ['Backspace', 'KeyQ'],
};
/** Mouse fica desligado nos menus; estes botões funcionam durante o combate. */
const DEFAULT_MOUSE = {
    left: null,
    right: null,
    up: null,
    down: null,
    jump: null,
    attack: 0,
    heavy: 2,
    dash: 1,
    ability: null,
    confirm: null,
    pause: null,
    mute: null,
    back: null,
};
export function defaultBindings() {
    const result = {};
    for (const action of BINDABLE_ACTIONS) {
        result[action] = {
            keyboard: [...DEFAULT_KEYBOARD[action]],
            mouse: DEFAULT_MOUSE[action],
        };
    }
    return result;
}
/** Escape é reservado para cancelar/voltar; F5 e F11/F12 são do navegador. */
export function isReservedKey(code) {
    return code === 'Escape' || code === 'F5' || code === 'F11' || code === 'F12';
}
function validKeyCode(value) {
    if (typeof value !== 'string')
        return null;
    if (value.length < 1 || value.length > 40)
        return null;
    if (isReservedKey(value))
        return null;
    return value;
}
function validMouseButton(value) {
    if (typeof value !== 'number' || !Number.isInteger(value))
        return null;
    return value >= 0 && value <= 4 ? value : null;
}
/** Normaliza um save antigo ou adulterado, sempre devolvendo um mapa completo. */
export function sanitizeBindings(value) {
    const result = defaultBindings();
    if (!value || typeof value !== 'object')
        return result;
    const source = value;
    const keyboard = source.keyboard && typeof source.keyboard === 'object'
        ? source.keyboard
        : {};
    const mouse = source.mouse && typeof source.mouse === 'object'
        ? source.mouse
        : {};
    for (const action of BINDABLE_ACTIONS) {
        const rawKeys = keyboard[action];
        if (Array.isArray(rawKeys)) {
            const keys = [];
            for (const item of rawKeys) {
                const code = validKeyCode(item);
                if (code && !keys.includes(code))
                    keys.push(code);
                if (keys.length >= 4)
                    break;
            }
            if (keys.length > 0)
                result[action].keyboard = keys;
        }
        if (Object.prototype.hasOwnProperty.call(mouse, action)) {
            result[action].mouse = validMouseButton(mouse[action]);
        }
    }
    // Teclas repetidas: a primeira ação fica com a tecla; as seguintes usam o padrão.
    const usedKeys = new Set();
    for (const action of BINDABLE_ACTIONS) {
        const binding = result[action];
        binding.keyboard = binding.keyboard.filter((code) => !usedKeys.has(code));
        if (binding.keyboard.length === 0) {
            const fallback = DEFAULT_KEYBOARD[action].find((code) => !usedKeys.has(code));
            if (fallback)
                binding.keyboard.push(fallback);
        }
        for (const code of binding.keyboard)
            usedKeys.add(code);
    }
    // Botões do mouse repetidos: mantém o primeiro.
    const usedButtons = new Set();
    for (const action of BINDABLE_ACTIONS) {
        const button = result[action].mouse;
        if (button === null)
            continue;
        if (usedButtons.has(button))
            result[action].mouse = null;
        else
            usedButtons.add(button);
    }
    return result;
}
/** Troca a tecla de uma ação e devolve a tecla antiga para quem for deslocado. */
export function assignKeyboardBinding(bindings, action, code) {
    if (isReservedKey(code))
        return;
    const previous = bindings[action].keyboard[0] ?? null;
    for (const other of BINDABLE_ACTIONS) {
        if (other === action)
            continue;
        const keys = bindings[other].keyboard;
        const index = keys.indexOf(code);
        if (index < 0)
            continue;
        keys.splice(index, 1);
        if (keys.length > 0)
            continue;
        const used = new Set();
        for (const id of BINDABLE_ACTIONS) {
            if (id === other)
                continue;
            for (const key of bindings[id].keyboard)
                used.add(key);
        }
        const fallback = [previous, ...DEFAULT_KEYBOARD[other]].find((key) => Boolean(key && key !== code && !used.has(key)));
        if (fallback)
            keys.push(fallback);
    }
    bindings[action].keyboard = [code];
}
/** Troca o botão do mouse; `null` remove a atribuição. */
export function assignMouseBinding(bindings, action, button) {
    if (button !== null) {
        if (!Number.isInteger(button) || button < 0 || button > 4)
            return;
        for (const other of BINDABLE_ACTIONS) {
            if (other !== action && bindings[other].mouse === button)
                bindings[other].mouse = null;
        }
    }
    bindings[action].mouse = button;
}
const KEY_LABELS = {
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
    Space: 'ESPAÇO',
    Enter: 'ENTER',
    NumpadEnter: 'NUM ENTER',
    Backspace: 'BACKSPACE',
    Tab: 'TAB',
    CapsLock: 'CAPS',
    ShiftLeft: 'SHIFT',
    ShiftRight: 'SHIFT',
    ControlLeft: 'CTRL',
    ControlRight: 'CTRL',
    AltLeft: 'ALT',
    AltRight: 'ALT',
    MetaLeft: 'META',
    MetaRight: 'META',
    Delete: 'DEL',
    Insert: 'INS',
    Home: 'HOME',
    End: 'END',
    PageUp: 'PGUP',
    PageDown: 'PGDN',
    Semicolon: ';',
    Equal: '=',
    Comma: ',',
    Minus: '-',
    Period: '.',
    Slash: '/',
    Backquote: '`',
    BracketLeft: '[',
    Backslash: '\\',
    BracketRight: ']',
    Quote: "'",
    NumpadAdd: 'NUM +',
    NumpadSubtract: 'NUM -',
    NumpadMultiply: 'NUM *',
    NumpadDivide: 'NUM /',
    NumpadDecimal: 'NUM .',
};
export function keyLabel(code) {
    const known = KEY_LABELS[code];
    if (known)
        return known;
    if (code.startsWith('Key'))
        return code.slice(3);
    if (code.startsWith('Digit'))
        return code.slice(5);
    if (code.startsWith('Numpad'))
        return `NUM ${code.slice(6)}`;
    if (/^F\d{1,2}$/.test(code))
        return code;
    return code.toUpperCase();
}
const MOUSE_LABELS = {
    0: 'ESQUERDO',
    1: 'MEIO',
    2: 'DIREITO',
    3: 'LATERAL 1',
    4: 'LATERAL 2',
};
export function mouseLabel(button) {
    if (button === null)
        return '—';
    return MOUSE_LABELS[button] ?? `BOTÃO ${button}`;
}
//# sourceMappingURL=bindings.js.map