/** Tela de personalização dos botões de teclado e mouse. */
import { TITLE_THEME_INDEX } from '../core/audio.js?v=6ccbb66fdb55';
import { ACTION_LABELS, BINDABLE_ACTIONS, assignKeyboardBinding, assignMouseBinding, defaultBindings, isReservedKey, keyLabel, mouseLabel, } from '../core/bindings.js?v=6ccbb66fdb55';
import { hexToRgba } from '../core/math.js?v=6ccbb66fdb55';
import { drawTitleBackground } from '../render/backgrounds.js?v=6ccbb66fdb55';
import { FONTS, label, panel, roundRectPath } from '../render/theme.js?v=6ccbb66fdb55';
function inside(box, x, y) {
    return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}
const KEYBOARD_ACTIONS = BINDABLE_ACTIONS;
const MOUSE_ACTIONS = BINDABLE_ACTIONS.filter((action) => action !== 'confirm');
const ROW_HEIGHT = 46;
const ROW_GAP = 8;
const COLUMN_WIDTH = 500;
const LEFT_X = 90;
const RIGHT_X = 650;
const LIST_Y = 238;
export class ControlsScene {
    constructor(game) {
        this.game = game;
        this.device = 'keyboard';
        this.index = 0;
        this.t = 0;
        this.hover = -1;
        this.tabRects = [];
        this.rowRects = [];
        this.resetRect = { x: 0, y: 0, w: 0, h: 0 };
        this.backRect = { x: 0, y: 0, w: 0, h: 0 };
        this.captureDevice = null;
        this.captureAction = null;
    }
    enter() {
        this.game.audio.playMusic(TITLE_THEME_INDEX);
        this.game.audio.playAmbience('cosmic');
        this.index = Math.min(this.index, this.actions.length - 1);
        this.hover = -1;
        this.captureDevice = null;
        this.captureAction = null;
    }
    exit() {
        this.game.input.cancelCapture();
    }
    get actions() {
        return this.device === 'keyboard' ? KEYBOARD_ACTIONS : MOUSE_ACTIONS;
    }
    setDevice(device) {
        if (this.device === device)
            return;
        this.device = device;
        this.index = Math.min(this.index, this.actions.length - 1);
        this.hover = -1;
        this.game.audio.sfx('select');
    }
    moveColumn(dir) {
        const leftCount = Math.ceil(this.actions.length / 2);
        const inLeft = this.index < leftCount;
        if (dir < 0 && !inLeft) {
            this.index = Math.min(this.index - leftCount, leftCount - 1);
            this.game.audio.sfx('select');
        }
        else if (dir > 0 && inLeft) {
            this.index = leftCount + Math.min(this.index, this.actions.length - leftCount - 1);
            this.game.audio.sfx('select');
        }
    }
    moveRow(dir) {
        const leftCount = Math.ceil(this.actions.length / 2);
        const inLeft = this.index < leftCount;
        const row = inLeft ? this.index : this.index - leftCount;
        const count = inLeft ? leftCount : this.actions.length - leftCount;
        const next = row + dir;
        if (next < 0 || next >= count)
            return;
        this.index = (inLeft ? 0 : leftCount) + next;
        this.game.audio.sfx('select');
    }
    startCapture(action) {
        if (this.captureDevice)
            return;
        this.captureDevice = this.device;
        this.captureAction = action;
        this.game.audio.sfx('select');
        this.game.input.captureNext(this.device, (capture) => {
            const target = this.captureAction;
            this.captureDevice = null;
            this.captureAction = null;
            if (!capture || !target)
                return;
            if (capture.device === 'keyboard') {
                if (isReservedKey(capture.code)) {
                    this.game.setNotice('TECLA RESERVADA — ESCOLHA OUTRA', '#ff6a7a');
                    return;
                }
                assignKeyboardBinding(this.game.save.bindings, target, capture.code);
                this.game.setNotice(`TECLADO · ${ACTION_LABELS[target]} → ${keyLabel(capture.code)}`, '#56e3ff', 2.4);
            }
            else {
                assignMouseBinding(this.game.save.bindings, target, capture.button);
                this.game.setNotice(capture.button === null
                    ? `MOUSE · ${ACTION_LABELS[target]} REMOVIDO`
                    : `MOUSE · ${ACTION_LABELS[target]} → ${mouseLabel(capture.button)}`, '#b48bff', 2.4);
            }
            this.game.input.setBindings(this.game.save.bindings);
            this.game.persist();
            this.game.audio.sfx('confirm');
        });
    }
    clearMouseBinding() {
        const action = this.actions[this.index];
        if (!action)
            return;
        if (this.game.save.bindings[action].mouse === null)
            return;
        assignMouseBinding(this.game.save.bindings, action, null);
        this.game.input.setBindings(this.game.save.bindings);
        this.game.persist();
        this.game.setNotice(`MOUSE · ${ACTION_LABELS[action]} REMOVIDO`, '#b48bff', 2.2);
        this.game.audio.sfx('ui');
    }
    resetAll() {
        this.game.save.bindings = defaultBindings();
        this.game.input.setBindings(this.game.save.bindings);
        this.game.persist();
        this.game.setNotice('TECLADO E MOUSE RESTAURADOS AO PADRÃO', '#56e3ff', 2.8);
        this.game.audio.sfx('confirm');
    }
    handleClick(x, y) {
        const tab = this.tabRects.findIndex((rect) => inside(rect, x, y));
        if (tab >= 0) {
            this.setDevice(tab === 0 ? 'keyboard' : 'mouse');
            return;
        }
        if (inside(this.resetRect, x, y)) {
            this.resetAll();
            return;
        }
        if (inside(this.backRect, x, y)) {
            this.game.gotoSettings();
            return;
        }
        const row = this.rowRects.findIndex((rect) => inside(rect, x, y));
        if (row < 0)
            return;
        if (row === this.index) {
            const action = this.actions[row];
            if (action)
                this.startCapture(action);
            return;
        }
        this.index = row;
        this.game.audio.sfx('select');
    }
    update(dt) {
        this.t += dt;
        const input = this.game.input;
        if (this.captureDevice)
            return;
        if (input.pressedCode('Digit1')) {
            this.setDevice('keyboard');
            return;
        }
        if (input.pressedCode('Digit2')) {
            this.setDevice('mouse');
            return;
        }
        if (input.pressedCode('KeyR')) {
            this.resetAll();
            return;
        }
        if (this.device === 'mouse' && input.pressedCode('Delete')) {
            this.clearMouseBinding();
            return;
        }
        if (input.pressed('back') || input.pressed('pause')) {
            this.game.audio.sfx('ui');
            this.game.gotoSettings();
            return;
        }
        if (input.pressed('left')) {
            this.moveColumn(-1);
            return;
        }
        if (input.pressed('right')) {
            this.moveColumn(1);
            return;
        }
        if (input.pressed('up')) {
            this.moveRow(-1);
            return;
        }
        if (input.pressed('down')) {
            this.moveRow(1);
            return;
        }
        if (input.pressed('confirm') || input.pressed('attack') || input.pressed('jump')) {
            const action = this.actions[this.index];
            if (action)
                this.startCapture(action);
            return;
        }
        if (input.mouse.moved) {
            this.hover = this.rowRects.findIndex((rect) => inside(rect, input.mouse.x, input.mouse.y));
        }
        if (input.mouse.clicked)
            this.handleClick(input.mouse.x, input.mouse.y);
    }
    draw(ctx) {
        const { width, height } = this.game;
        drawTitleBackground(ctx, this.t);
        const shade = ctx.createLinearGradient(0, 0, width * 0.8, 0);
        shade.addColorStop(0, 'rgba(4,5,10,0.96)');
        shade.addColorStop(0.65, 'rgba(4,5,10,0.82)');
        shade.addColorStop(1, 'rgba(4,5,10,0.4)');
        ctx.fillStyle = shade;
        ctx.fillRect(0, 0, width, height);
        label(ctx, 'CONTROLES', 90, 104, 40, '#f4f7ff', {
            weight: 800,
            spacing: 7,
            glow: 'rgba(180,139,255,0.42)',
        });
        label(ctx, 'TECLADO E MOUSE · PERSONALIZE CADA BOTÃO', 92, 130, 10.5, 'rgba(180,139,255,0.8)', {
            font: FONTS.mono,
            spacing: 1.8,
        });
        label(ctx, 'SALVO AUTOMATICAMENTE', width - 92, 130, 9.5, 'rgba(190,198,220,0.45)', {
            align: 'right',
            font: FONTS.mono,
            spacing: 1.1,
        });
        this.tabRects = [];
        this.drawTab(ctx, LEFT_X, 164, 170, 36, 'TECLADO', 'keyboard', '#56e3ff', '1');
        this.drawTab(ctx, LEFT_X + 182, 164, 170, 36, 'MOUSE', 'mouse', '#b48bff', '2');
        label(ctx, '1 / 2 TROCAM A ABA', width - 92, 186, 9.5, 'rgba(190,198,220,0.45)', {
            align: 'right',
            font: FONTS.mono,
            spacing: 1.1,
        });
        label(ctx, 'MOVIMENTO & COMBATE', LEFT_X, 218, 9.5, 'rgba(86,227,255,0.62)', {
            font: FONTS.mono,
            spacing: 1.4,
        });
        label(ctx, 'AÇÕES & SISTEMA', RIGHT_X, 218, 9.5, 'rgba(180,139,255,0.62)', {
            font: FONTS.mono,
            spacing: 1.4,
        });
        this.rowRects = [];
        const actions = this.actions;
        const leftCount = Math.ceil(actions.length / 2);
        const accent = this.device === 'keyboard' ? '#56e3ff' : '#b48bff';
        actions.forEach((action, i) => {
            const inLeft = i < leftCount;
            const row = inLeft ? i : i - leftCount;
            const x = inLeft ? LEFT_X : RIGHT_X;
            const y = LIST_Y + row * (ROW_HEIGHT + ROW_GAP);
            this.rowRects.push({ x, y, w: COLUMN_WIDTH, h: ROW_HEIGHT });
            this.drawRow(ctx, action, i, x, y, COLUMN_WIDTH, ROW_HEIGHT, accent);
        });
        this.resetRect = { x: LEFT_X, y: 636, w: 280, h: 36 };
        this.backRect = { x: LEFT_X + 292, y: 636, w: 190, h: 36 };
        this.drawButton(ctx, this.resetRect, 'R  RESTAURAR PADRÃO', '#ffd166');
        this.drawButton(ctx, this.backRect, 'ESC  VOLTAR', '#ff6a7a');
        label(ctx, 'ENTER / A: ALTERAR BOTÃO   ·   DELETE: LIMPAR MOUSE', LEFT_X, 700, 9.5, 'rgba(190,198,220,0.5)', {
            font: FONTS.mono,
            spacing: 1.1,
        });
        label(ctx, 'ESC SEMPRE VOLTA, MESMO APÓS REMAPEAR', width - 92, 700, 9.5, 'rgba(190,198,220,0.4)', {
            align: 'right',
            font: FONTS.mono,
            spacing: 1.1,
        });
        if (this.captureDevice)
            this.drawCapture(ctx);
    }
    drawTab(ctx, x, y, w, h, title, device, accent, badge) {
        const active = this.device === device;
        this.tabRects.push({ x, y, w, h });
        ctx.save();
        roundRectPath(ctx, x, y, w, h, 5);
        ctx.fillStyle = active ? hexToRgba(accent, 0.18) : 'rgba(255,255,255,0.025)';
        ctx.fill();
        ctx.strokeStyle = active ? hexToRgba(accent, 0.72) : 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        label(ctx, title, x + 16, y + h / 2 + 4, 12, active ? '#ffffff' : 'rgba(210,218,238,0.6)', {
            weight: 700,
            font: FONTS.mono,
            spacing: 1.5,
        });
        label(ctx, badge, x + w - 16, y + h / 2 + 4, 10, active ? hexToRgba(accent, 0.95) : 'rgba(160,166,184,0.4)', {
            align: 'right',
            font: FONTS.mono,
            spacing: 1,
        });
    }
    bindingText(action) {
        if (this.device === 'keyboard') {
            const labels = this.game.save.bindings[action].keyboard.map(keyLabel);
            return Array.from(new Set(labels)).join(' / ');
        }
        return mouseLabel(this.game.save.bindings[action].mouse);
    }
    drawRow(ctx, action, index, x, y, w, h, accent) {
        const selected = index === this.index;
        const hovered = index === this.hover && !selected;
        ctx.save();
        roundRectPath(ctx, x, y, w, h, 4);
        if (selected) {
            const gradient = ctx.createLinearGradient(x, y, x + w, y);
            gradient.addColorStop(0, hexToRgba(accent, 0.28));
            gradient.addColorStop(0.7, hexToRgba(accent, 0.06));
            gradient.addColorStop(1, hexToRgba(accent, 0));
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.strokeStyle = hexToRgba(accent, 0.55);
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        else {
            ctx.fillStyle = hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.025)';
            ctx.fill();
        }
        ctx.restore();
        if (selected) {
            ctx.save();
            ctx.fillStyle = accent;
            ctx.fillRect(x, y + 6, 3, h - 12);
            ctx.restore();
        }
        label(ctx, ACTION_LABELS[action], x + 20, y + h / 2 + 5, 14, selected ? '#ffffff' : 'rgba(225,230,242,0.78)', {
            weight: selected ? 700 : 600,
            spacing: 1.2,
            glow: selected ? accent : undefined,
        });
        label(ctx, this.captureDevice && this.captureAction === action ? 'AGUARDANDO…' : this.bindingText(action), x + w - 18, y + h / 2 + 5, 11, selected ? hexToRgba(accent, 0.95) : 'rgba(160,166,184,0.7)', { align: 'right', weight: 600, font: FONTS.mono, spacing: 0.8 });
    }
    drawButton(ctx, rect, text, accent) {
        ctx.save();
        roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 5);
        ctx.fillStyle = hexToRgba(accent, 0.1);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(accent, 0.45);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        label(ctx, text, rect.x + 16, rect.y + rect.h / 2 + 4, 11, 'rgba(244,247,255,0.86)', {
            weight: 700,
            font: FONTS.mono,
            spacing: 1.1,
        });
    }
    drawCapture(ctx) {
        const { width, height } = this.game;
        const accent = this.captureDevice === 'mouse' ? '#b48bff' : '#56e3ff';
        const action = this.captureAction;
        ctx.fillStyle = 'rgba(2,4,10,0.78)';
        ctx.fillRect(0, 0, width, height);
        const w = 560;
        const h = 230;
        const x = (width - w) / 2;
        const y = (height - h) / 2;
        panel(ctx, x, y, w, h, {
            fill: 'rgba(6,9,18,0.98)',
            border: hexToRgba(accent, 0.65),
            glow: hexToRgba(accent, 0.25),
            cut: 14,
        });
        label(ctx, 'ALTERAR BOTÃO', x + w / 2, y + 40, 11, hexToRgba(accent, 0.9), {
            align: 'center',
            font: FONTS.mono,
            spacing: 2,
        });
        label(ctx, action ? ACTION_LABELS[action] : '', x + w / 2, y + 84, 26, '#f4f7ff', {
            align: 'center',
            weight: 800,
            spacing: 2,
            glow: accent,
        });
        label(ctx, this.captureDevice === 'keyboard' ? 'PRESSIONE UMA TECLA' : 'CLIQUE UM BOTÃO DO MOUSE', x + w / 2, y + 132, 15, '#ffffff', { align: 'center', weight: 700, spacing: 1.5 });
        label(ctx, this.captureDevice === 'keyboard' ? 'ESC CANCELA' : 'ESC CANCELA · DELETE REMOVE', x + w / 2, y + 172, 10, 'rgba(190,198,220,0.6)', { align: 'center', font: FONTS.mono, spacing: 1.2 });
        const pulse = 0.5 + Math.sin(this.t * 5) * 0.5;
        ctx.save();
        ctx.strokeStyle = hexToRgba(accent, 0.25 + pulse * 0.45);
        ctx.lineWidth = 1.5;
        roundRectPath(ctx, x + 18, y + h - 34, w - 36, 2, 1);
        ctx.stroke();
        ctx.restore();
    }
}
//# sourceMappingURL=controls.js.map