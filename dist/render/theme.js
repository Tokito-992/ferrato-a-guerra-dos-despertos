/** Helpers visuais: painéis, tipografia, brilhos e barras. */
import { clamp, hexToRgba, mixColor } from '../core/math.js?v=c5d0d69737a2';
export const FONTS = {
    title: '"Cinzel", "Times New Roman", serif',
    ui: '"Rajdhani", "Segoe UI", system-ui, sans-serif',
    mono: '"Share Tech Mono", "Consolas", monospace',
};
export function roundRectPath(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.arcTo(x + w, y, x + w, y + rad, rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
    ctx.lineTo(x + rad, y + h);
    ctx.arcTo(x, y + h, x, y + h - rad, rad);
    ctx.lineTo(x, y + rad);
    ctx.arcTo(x, y, x + rad, y, rad);
    ctx.closePath();
}
export function panel(ctx, x, y, w, h, opts = {}) {
    const r = opts.r ?? 6;
    ctx.save();
    roundRectPath(ctx, x, y, w, h, r);
    ctx.fillStyle = opts.fill ?? 'rgba(8, 10, 20, 0.82)';
    ctx.fill();
    if (opts.glow) {
        ctx.shadowColor = opts.glow;
        ctx.shadowBlur = 18;
    }
    ctx.strokeStyle = opts.border ?? 'rgba(180, 190, 220, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    if (opts.cut) {
        ctx.save();
        ctx.strokeStyle = opts.border ?? 'rgba(180,190,220,0.25)';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + opts.cut);
        ctx.lineTo(x + opts.cut, y + 2);
        ctx.moveTo(x + w - opts.cut, y + h - 2);
        ctx.lineTo(x + w - 2, y + h - opts.cut);
        ctx.stroke();
        ctx.restore();
    }
}
export function label(ctx, text, x, y, size, color, opts = {}) {
    ctx.save();
    ctx.globalAlpha = opts.alpha ?? 1;
    ctx.font = `${opts.weight ?? 600} ${size}px ${opts.font ?? FONTS.ui}`;
    ctx.textAlign = opts.align ?? 'left';
    ctx.textBaseline = opts.baseline ?? 'alphabetic';
    if (opts.spacing && opts.spacing !== 0) {
        // Espaçamento manual (compatível com todos os navegadores).
        const chars = [...text];
        const widths = chars.map((c) => ctx.measureText(c).width + opts.spacing);
        const total = widths.reduce((a, b) => a + b, 0) - opts.spacing;
        let cx = x;
        if (ctx.textAlign === 'center')
            cx = x - total / 2;
        else if (ctx.textAlign === 'right')
            cx = x - total;
        ctx.textAlign = 'left';
        if (opts.glow)
            ctx.shadowColor = opts.glow;
        if (opts.glow)
            ctx.shadowBlur = 16;
        chars.forEach((c, i) => {
            if (opts.outline) {
                ctx.lineWidth = opts.outlineWidth ?? 4;
                ctx.strokeStyle = opts.outline;
                ctx.strokeText(c, cx, y);
            }
            ctx.fillStyle = color;
            ctx.fillText(c, cx, y);
            cx += widths[i];
        });
        ctx.restore();
        return;
    }
    if (opts.outline) {
        ctx.lineWidth = opts.outlineWidth ?? 4;
        ctx.strokeStyle = opts.outline;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y);
    }
    if (opts.glow) {
        ctx.shadowColor = opts.glow;
        ctx.shadowBlur = 16;
    }
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
}
export function glow(ctx, x, y, radius, color, alpha = 0.6) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, hexToRgba(color, alpha));
    g.addColorStop(0.45, hexToRgba(color, alpha * 0.35));
    g.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
export function bar(ctx, x, y, w, h, ratio, color, bg = 'rgba(255,255,255,0.1)') {
    const r = clamp(ratio, 0, 1);
    ctx.save();
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    const g = ctx.createLinearGradient(x, y, x + w, y);
    g.addColorStop(0, mixColor(color, '#ffffff', 0.15));
    g.addColorStop(1, color);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w * r, h);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x, y, w * r, 1);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.restore();
}
/** Segmento de membro com pontas arredondadas. */
export function limb(ctx, x1, y1, x2, y2, width, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}
export function joint(x, y, length, angle) {
    return { x: x + Math.sin(angle) * length, y: y + Math.cos(angle) * length };
}
export function shapedPanel(ctx, x, y, w, h, fill, border, accent) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - 10);
    ctx.lineTo(x + w - 10, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + 10);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x, y + 10);
    ctx.moveTo(x + w - 10, y + h);
    ctx.lineTo(x + w, y + h - 10);
    ctx.stroke();
    ctx.restore();
}
//# sourceMappingURL=theme.js.map