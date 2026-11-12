/** Menu navegável por teclado e mouse, usado em todas as telas. */
import { hexToRgba } from '../core/math.js?v=6ccbb66fdb55';
import { FONTS, label, roundRectPath } from '../render/theme.js?v=6ccbb66fdb55';
export class Menu {
    constructor(items) {
        this.index = 0;
        this.rects = [];
        this.hover = -1;
        this.items = items;
        this.ensureEnabled();
    }
    setItems(items, keepIndex = false) {
        const old = this.index;
        this.items = items;
        this.index = keepIndex ? Math.max(0, Math.min(old, items.length - 1)) : 0;
        this.ensureEnabled();
    }
    get selected() {
        return this.items[this.index] ?? null;
    }
    ensureEnabled() {
        if (!this.items.length)
            return;
        let guard = 0;
        while (this.items[this.index]?.disabled && guard < this.items.length) {
            this.index = (this.index + 1) % this.items.length;
            guard++;
        }
    }
    move(dir, audio) {
        if (!this.items.length)
            return;
        let next = this.index;
        for (let i = 0; i < this.items.length; i++) {
            next = (next + dir + this.items.length) % this.items.length;
            if (!this.items[next].disabled)
                break;
        }
        if (next !== this.index) {
            this.index = next;
            audio.sfx('select');
        }
    }
    update(input, audio) {
        if (!this.items.length)
            return null;
        this.ensureEnabled();
        if (input.pressed('up'))
            this.move(-1, audio);
        if (input.pressed('down'))
            this.move(1, audio);
        if (input.mouse.moved) {
            this.hover = this.rects.findIndex((r) => input.mouse.x >= r.x && input.mouse.x <= r.x + r.w && input.mouse.y >= r.y && input.mouse.y <= r.y + r.h);
            if (this.hover >= 0 && !this.items[this.hover]?.disabled && this.hover !== this.index) {
                this.index = this.hover;
                audio.sfx('select');
            }
        }
        if (input.mouse.clicked) {
            const hit = this.rects.findIndex((r) => input.mouse.x >= r.x && input.mouse.x <= r.x + r.w && input.mouse.y >= r.y && input.mouse.y <= r.y + r.h);
            if (hit >= 0) {
                const item = this.items[hit];
                if (item && !item.disabled) {
                    this.index = hit;
                    audio.sfx('confirm');
                    return item.id;
                }
                audio.sfx('ui');
            }
        }
        if (input.pressed('confirm') || input.pressed('attack') || input.pressed('jump')) {
            const item = this.items[this.index];
            if (item && !item.disabled) {
                audio.sfx('confirm');
                return item.id;
            }
            audio.sfx('ui');
        }
        return null;
    }
    draw(ctx, x, y, w, style = {}) {
        const itemH = style.itemHeight ?? 46;
        const gap = style.gap ?? 8;
        const size = style.size ?? 20;
        const accent = style.accent ?? '#ff8a3d';
        const align = style.align ?? 'left';
        this.rects = [];
        let cursor = y;
        this.items.forEach((item, i) => {
            const height = item.height ?? itemH;
            const y0 = cursor;
            cursor += height + gap;
            this.rects.push({ x, y: y0, w, h: height });
            const active = i === this.index;
            const disabled = !!item.disabled;
            const minor = !!item.minor;
            const col = item.accent ?? accent;
            const labelSize = minor ? Math.max(11, size * 0.78) : size;
            ctx.save();
            if (active) {
                const g = ctx.createLinearGradient(x, y0, x + w, y0);
                g.addColorStop(0, hexToRgba(col, minor ? 0.16 : 0.28));
                g.addColorStop(0.7, hexToRgba(col, minor ? 0.04 : 0.06));
                g.addColorStop(1, hexToRgba(col, 0));
                ctx.fillStyle = g;
                roundRectPath(ctx, x, y0, w, height, 4);
                ctx.fill();
                ctx.strokeStyle = hexToRgba(col, minor ? 0.32 : 0.55);
                ctx.lineWidth = 1;
                roundRectPath(ctx, x + 0.5, y0 + 0.5, w - 1, height - 1, 4);
                ctx.stroke();
                // Barra e seta.
                ctx.fillStyle = col;
                ctx.fillRect(x, y0 + (minor ? 5 : 6), minor ? 2 : 3, height - (minor ? 10 : 12));
                if (style.showArrows !== false) {
                    const ax = x + 14;
                    const ay = y0 + height / 2;
                    const as = minor ? 3 : 4;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay - as);
                    ctx.lineTo(ax + as + 2, ay);
                    ctx.lineTo(ax, ay + as);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            else if (!disabled && !minor) {
                ctx.fillStyle = 'rgba(255,255,255,0.025)';
                roundRectPath(ctx, x, y0, w, height, 4);
                ctx.fill();
            }
            ctx.restore();
            const badgeX = x + (minor ? 24 : 28);
            const labelX = x + (item.badge ? (minor ? 48 : 60) : minor ? 24 : 30);
            const tx = align === 'center' ? x + w / 2 : align === 'right' ? x + w - 14 : labelX;
            if (item.badge) {
                label(ctx, item.badge, badgeX, y0 + height / 2 + (minor ? 4 : 5), minor ? 9 : 10, active ? hexToRgba(col, 0.9) : 'rgba(160,166,184,0.45)', {
                    font: FONTS.mono,
                    weight: active ? 700 : 400,
                    spacing: 1,
                });
            }
            label(ctx, item.label, tx, y0 + height / 2 + labelSize * 0.35, labelSize, disabled ? 'rgba(160,166,184,0.35)' : active ? '#ffffff' : 'rgba(225,230,242,0.78)', {
                align,
                weight: active ? 700 : 600,
                font: FONTS.ui,
                spacing: style.compact ? 0.5 : minor ? 1 : 1.4,
                glow: active ? col : undefined,
            });
            if (item.detail && !disabled) {
                label(ctx, item.detail, x + w - 18, y0 + height / 2 + (minor ? 4 : 6), Math.max(minor ? 9 : 11, labelSize * 0.62), disabled ? 'rgba(160,166,184,0.3)' : active ? hexToRgba(col, 0.9) : 'rgba(160,166,184,0.65)', { align: 'right', weight: 600, font: FONTS.mono });
            }
            if (disabled) {
                label(ctx, 'BLOQUEADO', x + w - 18, y0 + height / 2 + 6, 10, 'rgba(160,166,184,0.35)', {
                    align: 'right',
                    font: FONTS.mono,
                    spacing: 1,
                });
            }
        });
    }
}
//# sourceMappingURL=menu.js.map