/** Ícones procedurais do Arquivo do Véu. */
import { CHARACTERS } from '../data/characters.js?v=bf59b6c4844c';
import { clamp, hexToRgba, TAU } from '../core/math.js?v=bf59b6c4844c';
import { drawCharacterPortrait } from './characters.js?v=bf59b6c4844c';
import { glow, roundRectPath } from './theme.js?v=bf59b6c4844c';
function frame(ctx, size, color, active) {
    ctx.save();
    const r = size * 0.47;
    ctx.strokeStyle = hexToRgba(color, active ? 0.72 : 0.3);
    ctx.lineWidth = Math.max(1, size * 0.012);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([size * 0.03, size * 0.055]);
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}
function lockSeal(ctx, size, color) {
    const s = size * 0.22;
    ctx.save();
    ctx.fillStyle = 'rgba(4,6,12,0.9)';
    ctx.strokeStyle = hexToRgba(color, 0.45);
    ctx.lineWidth = Math.max(1, size * 0.014);
    roundRectPath(ctx, -s * 0.8, -s * 0.1, s * 1.6, s * 1.35, s * 0.16);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -s * 0.1, s * 0.5, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = hexToRgba(color, 0.6);
    ctx.beginPath();
    ctx.arc(0, s * 0.5, s * 0.12, 0, TAU);
    ctx.fill();
    ctx.fillRect(-s * 0.06, s * 0.5, s * 0.12, s * 0.32);
    ctx.restore();
}
function eye(ctx, x, y, rx, ry, color, pupil = '#08050c') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = pupil;
    ctx.beginPath();
    ctx.ellipse(x, y, rx * 0.32, ry * 0.8, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(x - rx * 0.26, y - ry * 0.24, Math.max(0.7, rx * 0.18), 0, TAU);
    ctx.fill();
}
function drawHeroIcon(ctx, entry, size, time, locked) {
    const def = entry.heroId ? CHARACTERS[entry.heroId] : null;
    if (!def)
        return;
    const r = size * 0.46;
    glow(ctx, 0, 0, r * 1.5, def.colors.aura, locked ? 0.06 : 0.2);
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fillStyle = '#070912';
    ctx.fill();
    ctx.clip();
    drawCharacterPortrait(ctx, def, 0, r * 0.1, size * 1.42, time, locked);
    ctx.restore();
    frame(ctx, size, def.colors.accent, !locked);
    if (locked)
        lockSeal(ctx, size, '#b8c0dc');
}
function drawCreatureIcon(ctx, entry, size, time, locked) {
    const kind = entry.creatureKind;
    if (!kind)
        return;
    const accent = entry.accent;
    const dark = '#0b0710';
    const s = size / 100;
    ctx.save();
    ctx.scale(s, s);
    glow(ctx, 0, 0, 44, accent, locked ? 0.04 : 0.14);
    if (locked) {
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = '#9aa3b8';
        ctx.beginPath();
        ctx.ellipse(0, 6, 28, 34, 0, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    else {
        ctx.fillStyle = dark;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.6;
        ctx.lineJoin = 'round';
        switch (kind) {
            case 'crawler': {
                ctx.fillStyle = '#18220f';
                ctx.beginPath();
                ctx.ellipse(0, 10, 30, 17, 0, 0, TAU);
                ctx.fill();
                ctx.stroke();
                for (let i = 0; i < 3; i++) {
                    const y = 2 + i * 9;
                    ctx.beginPath();
                    ctx.moveTo(-20 + i * 4, y);
                    ctx.lineTo(-36 - i * 3, y + 10);
                    ctx.moveTo(20 - i * 4, y);
                    ctx.lineTo(36 + i * 3, y + 10);
                    ctx.stroke();
                }
                ctx.beginPath();
                ctx.moveTo(-28, 6);
                ctx.quadraticCurveTo(-46, -8, -34, -22);
                ctx.stroke();
                eye(ctx, 13, 5, 5, 3.6, accent, dark);
                break;
            }
            case 'warrior': {
                ctx.fillStyle = '#241a38';
                ctx.beginPath();
                ctx.moveTo(-20, 30);
                ctx.lineTo(-25, -6);
                ctx.lineTo(-12, -24);
                ctx.lineTo(12, -24);
                ctx.lineTo(25, -6);
                ctx.lineTo(20, 30);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#3a2a56';
                ctx.beginPath();
                ctx.moveTo(-15, -22);
                ctx.lineTo(0, -40);
                ctx.lineTo(15, -22);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                eye(ctx, -7, -4, 3.6, 2.6, accent, dark);
                eye(ctx, 7, -4, 3.6, 2.6, accent, dark);
                ctx.strokeStyle = '#d8c9ff';
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.moveTo(26, 18);
                ctx.lineTo(40, -28);
                ctx.stroke();
                break;
            }
            case 'drone': {
                ctx.fillStyle = '#152736';
                ctx.beginPath();
                ctx.arc(0, 2, 20, 0, TAU);
                ctx.fill();
                ctx.stroke();
                ctx.strokeStyle = accent;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.ellipse(0, 2, 36, 12, -0.18, 0, TAU);
                ctx.stroke();
                for (const side of [-1, 1]) {
                    ctx.beginPath();
                    ctx.moveTo(side * 16, -8);
                    ctx.lineTo(side * 38, -22);
                    ctx.lineTo(side * 30, -2);
                    ctx.closePath();
                    ctx.stroke();
                }
                eye(ctx, 4, 0, 8, 5.2, accent, dark);
                break;
            }
            case 'hound': {
                ctx.fillStyle = '#2a100c';
                ctx.beginPath();
                ctx.ellipse(0, 8, 30, 20, -0.1, 0, TAU);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-20, -6);
                ctx.lineTo(-30, -30);
                ctx.lineTo(-8, -14);
                ctx.moveTo(20, -6);
                ctx.lineTo(30, -30);
                ctx.lineTo(8, -14);
                ctx.stroke();
                ctx.fillStyle = '#180806';
                ctx.beginPath();
                ctx.ellipse(18, 12, 16, 10, 0.12, 0, TAU);
                ctx.fill();
                ctx.stroke();
                for (let i = 0; i < 3; i++) {
                    ctx.fillStyle = '#fff1d6';
                    ctx.beginPath();
                    ctx.moveTo(12 + i * 6, 18);
                    ctx.lineTo(15 + i * 6, 25);
                    ctx.lineTo(18 + i * 6, 18);
                    ctx.fill();
                }
                eye(ctx, 10, 4, 4.6, 3, accent, dark);
                eye(ctx, 24, 4, 4.2, 2.8, accent, dark);
                break;
            }
            case 'caster': {
                ctx.fillStyle = '#2a1024';
                ctx.beginPath();
                ctx.moveTo(0, -36);
                ctx.quadraticCurveTo(28, -14, 22, 34);
                ctx.lineTo(-22, 34);
                ctx.quadraticCurveTo(-28, -14, 0, -36);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#120612';
                ctx.beginPath();
                ctx.ellipse(0, -8, 13, 16, 0, 0, TAU);
                ctx.fill();
                eye(ctx, -5, -8, 2.8, 2.2, accent, dark);
                eye(ctx, 5, -8, 2.8, 2.2, accent, dark);
                glow(ctx, 0, 20, 18, accent, 0.3);
                ctx.fillStyle = accent;
                ctx.beginPath();
                ctx.arc(0, 20, 5, 0, TAU);
                ctx.fill();
                break;
            }
            case 'brute': {
                ctx.fillStyle = '#2a1a12';
                ctx.beginPath();
                ctx.moveTo(-34, 30);
                ctx.lineTo(-30, -6);
                ctx.lineTo(-14, -26);
                ctx.lineTo(14, -26);
                ctx.lineTo(30, -6);
                ctx.lineTo(34, 30);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#3a241a';
                ctx.beginPath();
                ctx.arc(0, -20, 13, 0, TAU);
                ctx.fill();
                ctx.stroke();
                eye(ctx, -5, -21, 3.2, 2.2, accent, dark);
                eye(ctx, 5, -21, 3.2, 2.2, accent, dark);
                ctx.fillStyle = '#1a0e0a';
                ctx.beginPath();
                ctx.arc(-32, 16, 10, 0, TAU);
                ctx.arc(32, 16, 10, 0, TAU);
                ctx.fill();
                ctx.stroke();
                break;
            }
            case 'shade': {
                ctx.fillStyle = '#141c30';
                ctx.beginPath();
                ctx.moveTo(0, -34);
                ctx.quadraticCurveTo(26, -18, 24, 18);
                ctx.quadraticCurveTo(14, 34, 0, 28);
                ctx.quadraticCurveTo(-14, 34, -24, 18);
                ctx.quadraticCurveTo(-26, -18, 0, -34);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                eye(ctx, -6, -6, 3.4, 2.6, accent, dark);
                eye(ctx, 6, -6, 3.4, 2.6, accent, dark);
                ctx.globalAlpha = 0.35;
                ctx.beginPath();
                ctx.moveTo(-18, 24);
                ctx.quadraticCurveTo(0, 40, 18, 24);
                ctx.stroke();
                break;
            }
            case 'construct': {
                ctx.fillStyle = '#1b2638';
                ctx.beginPath();
                ctx.moveTo(0, -40);
                ctx.lineTo(30, -10);
                ctx.lineTo(20, 30);
                ctx.lineTo(-20, 30);
                ctx.lineTo(-30, -10);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.strokeStyle = hexToRgba(accent, 0.7);
                ctx.beginPath();
                ctx.moveTo(0, -28);
                ctx.lineTo(18, -4);
                ctx.lineTo(10, 20);
                ctx.lineTo(-10, 20);
                ctx.lineTo(-18, -4);
                ctx.closePath();
                ctx.stroke();
                glow(ctx, 0, -2, 18, accent, 0.35);
                ctx.fillStyle = accent;
                ctx.beginPath();
                ctx.arc(0, -2, 5, 0, TAU);
                ctx.fill();
                break;
            }
            case 'seraph': {
                ctx.strokeStyle = hexToRgba(accent, 0.8);
                ctx.fillStyle = '#2a2618';
                for (const side of [-1, 1]) {
                    ctx.beginPath();
                    ctx.moveTo(side * 6, -10);
                    ctx.quadraticCurveTo(side * 38, -36, side * 34, 12);
                    ctx.quadraticCurveTo(side * 22, 2, side * 8, 10);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
                ctx.fillStyle = '#3a3422';
                ctx.beginPath();
                ctx.ellipse(0, 2, 10, 26, 0, 0, TAU);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, -30, 9, 0, TAU);
                ctx.stroke();
                eye(ctx, 0, -4, 3.4, 2.6, accent, dark);
                break;
            }
            case 'echo': {
                for (const offset of [-8, 8]) {
                    ctx.globalAlpha = offset < 0 ? 0.35 : 0.75;
                    ctx.fillStyle = '#241a38';
                    ctx.beginPath();
                    ctx.moveTo(offset, -32);
                    ctx.quadraticCurveTo(offset + 20, -12, offset + 14, 30);
                    ctx.lineTo(offset - 14, 30);
                    ctx.quadraticCurveTo(offset - 20, -12, offset, -32);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
                eye(ctx, -4, -6, 3.2, 2.4, accent, dark);
                eye(ctx, 4, -6, 3.2, 2.4, accent, dark);
                break;
            }
        }
    }
    ctx.restore();
    frame(ctx, size, accent, !locked);
    if (locked)
        lockSeal(ctx, size, '#b8c0dc');
}
function drawBossIcon(ctx, entry, size, time, locked) {
    const accent = entry.accent;
    const s = size / 100;
    ctx.save();
    ctx.scale(s, s);
    glow(ctx, 0, 0, 46, accent, locked ? 0.04 : 0.22);
    if (locked) {
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = '#c8ccdc';
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
        frame(ctx, size, accent, false);
        lockSeal(ctx, size, '#c8ccdc');
        return;
    }
    const pulse = 0.5 + Math.sin(time * 2.4) * 0.5;
    ctx.fillStyle = '#08050c';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.6;
    switch (entry.bossId) {
        case 'colossus': {
            ctx.beginPath();
            ctx.ellipse(0, 8, 32, 28, 0, 0, TAU);
            ctx.fill();
            ctx.stroke();
            for (const [ex, ey, er] of [
                [-14, -4, 5],
                [6, -12, 4],
                [18, 2, 6],
                [-2, 12, 3.4],
            ]) {
                eye(ctx, ex, ey, er, er * 0.7, accent, '#1a0808');
            }
            ctx.fillStyle = '#1a0808';
            ctx.beginPath();
            ctx.ellipse(0, 20, 4, 12, 0, 0, TAU);
            ctx.fill();
            for (let i = 0; i < 4; i++) {
                ctx.fillStyle = '#ffe6a3';
                ctx.beginPath();
                ctx.moveTo(-4 + i * 3, 11);
                ctx.lineTo(-2 + i * 3, 17);
                ctx.lineTo(0 + i * 3, 11);
                ctx.fill();
            }
            break;
        }
        case 'vekthar': {
            ctx.fillStyle = '#241a34';
            ctx.beginPath();
            ctx.moveTo(-22, 28);
            ctx.lineTo(-26, -10);
            ctx.lineTo(-12, -30);
            ctx.lineTo(12, -30);
            ctx.lineTo(26, -10);
            ctx.lineTo(22, 28);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            eye(ctx, -7, -8, 3.4, 2.4, accent, '#1a0808');
            eye(ctx, 7, -8, 3.4, 2.4, accent, '#1a0808');
            ctx.fillStyle = '#1a1522';
            roundRectPath(ctx, 20, 2, 24, 10, 3);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = accent;
            ctx.globalAlpha = 0.5 + pulse * 0.4;
            ctx.beginPath();
            ctx.arc(44, 7, 3.4, 0, TAU);
            ctx.fill();
            break;
        }
        case 'xalmor': {
            ctx.fillStyle = '#101c28';
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, TAU);
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = hexToRgba(accent, 0.8);
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.ellipse(0, 0, 38 - i * 5, 12 - i * 2, 0.3 + i * 0.5, 0, TAU);
                ctx.stroke();
            }
            eye(ctx, 0, 0, 8, 6, accent, '#0d141c');
            break;
        }
        case 'acheron': {
            ctx.fillStyle = '#240810';
            ctx.beginPath();
            ctx.ellipse(0, 4, 25, 28, 0, 0, TAU);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-18, -16);
            ctx.quadraticCurveTo(-38, -42, -26, -6);
            ctx.moveTo(18, -16);
            ctx.quadraticCurveTo(38, -42, 26, -6);
            ctx.stroke();
            eye(ctx, -8, -2, 4, 3, accent, '#160a0e');
            eye(ctx, 8, -2, 4, 3, accent, '#160a0e');
            ctx.strokeStyle = accent;
            ctx.globalAlpha = 0.5 + pulse * 0.3;
            ctx.beginPath();
            ctx.arc(0, 20, 12, 0.2, Math.PI - 0.2);
            ctx.stroke();
            break;
        }
        case 'malakhim': {
            ctx.fillStyle = '#2a2518';
            ctx.beginPath();
            ctx.ellipse(0, 4, 16, 26, 0, 0, TAU);
            ctx.fill();
            ctx.stroke();
            for (const side of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(side * 8, -8);
                ctx.quadraticCurveTo(side * 42, -36, side * 36, 12);
                ctx.quadraticCurveTo(side * 22, 0, side * 8, 8);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
            ctx.beginPath();
            ctx.arc(0, -30, 10, 0, TAU);
            ctx.stroke();
            eye(ctx, 0, 0, 3.6, 2.6, accent, '#2a2518');
            break;
        }
        case 'ferrato': {
            ctx.fillStyle = '#0a0612';
            ctx.beginPath();
            ctx.arc(0, 0, 28, 0, TAU);
            ctx.fill();
            ctx.stroke();
            for (let i = 0; i < 7; i++) {
                const a = (i / 7) * TAU + time * 0.15;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * 26, Math.sin(a) * 26);
                ctx.quadraticCurveTo(Math.cos(a + 0.3) * 44, Math.sin(a + 0.3) * 44, Math.cos(a + 0.12) * 48, Math.sin(a + 0.12) * 48);
                ctx.stroke();
            }
            eye(ctx, 0, 0, 12, 9, accent, '#08050c');
            ctx.fillStyle = accent;
            ctx.globalAlpha = 0.35 + pulse * 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, 38, 0, TAU);
            ctx.fill();
            break;
        }
    }
    ctx.restore();
    frame(ctx, size, accent, true);
}
function drawPlaceIcon(ctx, entry, size, time, locked) {
    const accent = entry.accent;
    const s = size / 100;
    ctx.save();
    ctx.scale(s, s);
    glow(ctx, 0, 10, 46, accent, locked ? 0.04 : 0.12);
    if (locked) {
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = '#c8ccdc';
        ctx.fillRect(-34, -6, 68, 30);
        ctx.globalAlpha = 1;
    }
    else {
        // Céu do capítulo.
        const sky = ctx.createLinearGradient(0, -38, 0, 34);
        sky.addColorStop(0, hexToRgba(accent, 0.32));
        sky.addColorStop(1, 'rgba(5,5,12,0.05)');
        ctx.fillStyle = sky;
        ctx.beginPath();
        ctx.arc(0, 0, 42, 0, TAU);
        ctx.fill();
        ctx.fillStyle = hexToRgba(accent, 0.65);
        ctx.beginPath();
        ctx.arc(14, -16, 9, 0, TAU);
        ctx.fill();
        // Silhueta urbana / ruína.
        ctx.fillStyle = '#08060c';
        for (let i = 0; i < 6; i++) {
            const bx = -36 + i * 13;
            const bh = 10 + ((i * 7 + (entry.stageId ?? 1)) % 24);
            ctx.fillRect(bx, 32 - bh, 10, bh);
        }
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.4 + Math.sin(time * 2.2 + (entry.stageId ?? 0)) * 0.12;
        for (let i = 0; i < 7; i++) {
            ctx.fillRect(-32 + i * 10, 22 - ((i * 5) % 14), 2, 2);
        }
        ctx.globalAlpha = 1;
    }
    ctx.restore();
    frame(ctx, size, accent, !locked);
    if (locked)
        lockSeal(ctx, size, '#c8ccdc');
}
function drawRelicIcon(ctx, entry, size, time, locked) {
    const accent = entry.accent;
    const s = size / 100;
    const pulse = 0.5 + Math.sin(time * 3.2) * 0.5;
    ctx.save();
    ctx.scale(s, s);
    glow(ctx, 0, 0, 42, accent, locked ? 0.04 : 0.18 + pulse * 0.08);
    if (locked) {
        ctx.globalAlpha = 0.16;
        ctx.strokeStyle = '#c8ccdc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
    else if (entry.relicKind) {
        ctx.strokeStyle = accent;
        ctx.fillStyle = '#0a0712';
        ctx.lineWidth = 2;
        switch (entry.relicKind) {
            case 'fracture': {
                ctx.beginPath();
                ctx.ellipse(0, 18, 32, 10, 0, 0, TAU);
                ctx.fill();
                ctx.stroke();
                ctx.strokeStyle = '#ffd166';
                ctx.beginPath();
                ctx.moveTo(-26, 14);
                ctx.lineTo(-10, 4);
                ctx.lineTo(-2, 16);
                ctx.lineTo(12, 2);
                ctx.lineTo(26, 14);
                ctx.stroke();
                for (let i = 0; i < 4; i++) {
                    ctx.fillStyle = hexToRgba(accent, 0.7);
                    ctx.beginPath();
                    ctx.moveTo(-16 + i * 10, 18);
                    ctx.quadraticCurveTo(-12 + i * 10, -2 - i * 3, -6 + i * 10, 18);
                    ctx.fill();
                }
                break;
            }
            case 'sanctuary': {
                ctx.beginPath();
                ctx.arc(0, 0, 24, 0, TAU);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = accent;
                ctx.beginPath();
                ctx.moveTo(0, 16);
                ctx.bezierCurveTo(-24, 0, -16, -20, 0, -8);
                ctx.bezierCurveTo(16, -20, 24, 0, 0, 16);
                ctx.fill();
                break;
            }
            case 'anchor': {
                ctx.beginPath();
                ctx.arc(0, 0, 22, 0, TAU);
                ctx.fill();
                ctx.stroke();
                ctx.strokeStyle = hexToRgba(accent, 0.7);
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.ellipse(0, 0, 32 + i * 5, 13 + i * 2, time * 0.2 + i, 0, TAU);
                    ctx.stroke();
                }
                ctx.fillStyle = accent;
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, TAU);
                ctx.fill();
                break;
            }
            case 'overcharge': {
                ctx.beginPath();
                ctx.arc(0, 0, 24, 0, TAU);
                ctx.fill();
                ctx.stroke();
                ctx.strokeStyle = accent;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(8, -30);
                ctx.lineTo(-10, 0);
                ctx.lineTo(4, 0);
                ctx.lineTo(-8, 30);
                ctx.lineTo(16, -4);
                ctx.lineTo(2, -4);
                ctx.closePath();
                ctx.stroke();
                ctx.fillStyle = hexToRgba(accent, 0.45);
                ctx.fill();
                break;
            }
        }
    }
    else if (entry.ambient) {
        ctx.strokeStyle = accent;
        ctx.fillStyle = accent;
        switch (entry.ambient) {
            case 'embers':
            case 'ash': {
                for (let i = 0; i < 12; i++) {
                    const a = (i / 12) * TAU + time * 0.2;
                    const r = 10 + ((i * 13) % 28);
                    ctx.globalAlpha = 0.35 + ((i * 7) % 10) / 14;
                    ctx.beginPath();
                    ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2 + (i % 3), 0, TAU);
                    ctx.fill();
                }
                break;
            }
            case 'stars': {
                for (let i = 0; i < 18; i++) {
                    const x = ((i * 37) % 70) - 35;
                    const y = ((i * 23) % 60) - 30;
                    ctx.globalAlpha = 0.3 + ((i * 11) % 10) / 12;
                    ctx.fillRect(x, y, i % 5 === 0 ? 3 : 1.5, i % 5 === 0 ? 3 : 1.5);
                }
                break;
            }
            case 'magma': {
                ctx.lineWidth = 3;
                for (let i = 0; i < 3; i++) {
                    ctx.globalAlpha = 0.5 + i * 0.15;
                    ctx.beginPath();
                    ctx.moveTo(-36, 20 + i * 6);
                    ctx.quadraticCurveTo(-10, 2 + i * 8 + Math.sin(time + i) * 4, 0, 16 + i * 6);
                    ctx.quadraticCurveTo(14, 28 + i * 5, 36, 12 + i * 6);
                    ctx.stroke();
                }
                break;
            }
            case 'feathers': {
                for (let i = 0; i < 4; i++) {
                    ctx.save();
                    ctx.rotate(-0.5 + i * 0.3 + Math.sin(time + i) * 0.08);
                    ctx.globalAlpha = 0.45 + i * 0.12;
                    ctx.beginPath();
                    ctx.ellipse(-10 + i * 8, -8 + i * 6, 5, 20, 0.3, 0, TAU);
                    ctx.fill();
                    ctx.restore();
                }
                break;
            }
            case 'cosmic': {
                ctx.lineWidth = 2;
                for (let i = 0; i < 3; i++) {
                    ctx.globalAlpha = 0.3 + i * 0.2;
                    ctx.beginPath();
                    for (let k = 0; k < 40; k++) {
                        const a = k * 0.24 + time * 0.2 + i;
                        const r = 4 + k * 0.8;
                        const x = Math.cos(a) * r;
                        const y = Math.sin(a) * r * 0.7;
                        if (k === 0)
                            ctx.moveTo(x, y);
                        else
                            ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                }
                break;
            }
        }
    }
    ctx.restore();
    frame(ctx, size, accent, !locked);
    if (locked)
        lockSeal(ctx, size, '#c8ccdc');
}
export function drawArchiveIcon(ctx, entry, x, y, size, time, locked) {
    ctx.save();
    ctx.translate(x, y);
    if (locked) {
        ctx.save();
        ctx.globalAlpha = clamp(ctx.globalAlpha * 0.8, 0, 1);
        ctx.fillStyle = 'rgba(4,6,12,0.72)';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.44, 0, TAU);
        ctx.fill();
        ctx.restore();
    }
    switch (entry.section) {
        case 'heroes':
            drawHeroIcon(ctx, entry, size, time, locked);
            break;
        case 'creatures':
            drawCreatureIcon(ctx, entry, size, time, locked);
            break;
        case 'bosses':
            drawBossIcon(ctx, entry, size, time, locked);
            break;
        case 'places':
            drawPlaceIcon(ctx, entry, size, time, locked);
            break;
        case 'relics':
            drawRelicIcon(ctx, entry, size, time, locked);
            break;
    }
    ctx.restore();
}
//# sourceMappingURL=archive.js.map