/** Coração vetorial compartilhado por HUD, bônus e obstáculos. */
export function heartPath(ctx, x, y, size) {
    const s = size;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.42);
    ctx.bezierCurveTo(x - s * 0.72, y - s * 0.05, x - s * 0.52, y - s * 0.62, x - s * 0.16, y - s * 0.5);
    ctx.bezierCurveTo(x - s * 0.05, y - s * 0.46, x, y - s * 0.34, x, y - s * 0.22);
    ctx.bezierCurveTo(x, y - s * 0.34, x + s * 0.05, y - s * 0.46, x + s * 0.16, y - s * 0.5);
    ctx.bezierCurveTo(x + s * 0.52, y - s * 0.62, x + s * 0.72, y - s * 0.05, x, y + s * 0.42);
    ctx.closePath();
}
export function drawHeart(ctx, x, y, size, color, style = {}) {
    const filled = style.filled ?? true;
    ctx.save();
    ctx.globalAlpha = style.alpha ?? 1;
    if (style.glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = style.glow;
    }
    heartPath(ctx, x, y, size);
    if (filled) {
        ctx.fillStyle = color;
        ctx.fill();
    }
    else {
        ctx.fillStyle = 'rgba(255,255,255,0.035)';
        ctx.fill();
    }
    ctx.lineWidth = style.outlineWidth ?? Math.max(1, size * 0.08);
    ctx.strokeStyle = style.outline ?? color;
    ctx.stroke();
    if (filled) {
        ctx.globalAlpha = (style.alpha ?? 1) * 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x - size * 0.2, y - size * 0.23, size * 0.1, size * 0.055, -0.55, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}
//# sourceMappingURL=hearts.js.map