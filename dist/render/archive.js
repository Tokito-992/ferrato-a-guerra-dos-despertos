/** Ícones procedurais do Arquivo do Véu. */
import { CHARACTERS } from '../data/characters.js?v=2287ee03d2bc';
import { hexToRgba, mixColor, mulberry32, TAU } from '../core/math.js?v=2287ee03d2bc';
import { drawCharacterPortrait } from './characters.js?v=2287ee03d2bc';
import { glow, roundRectPath } from './theme.js?v=2287ee03d2bc';
const INK = '#06070d';
function makeInk(accent) {
    return {
        accent,
        bright: mixColor(accent, '#ffffff', 0.55),
        deep: mixColor(accent, INK, 0.7),
    };
}
function poly(ctx, pts) {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i];
        if (i === 0)
            ctx.moveTo(x, y);
        else
            ctx.lineTo(x, y);
    }
    ctx.closePath();
}
function shade(ctx, color, accent, y0 = -40, y1 = 40, lift = 0.22) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, mixColor(color, accent, lift));
    g.addColorStop(0.45, color);
    g.addColorStop(1, mixColor(color, INK, 0.6));
    return g;
}
function rim(ctx, color, width = 1.2) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
}
function floorShadow(ctx, y, rx, ry, alpha = 0.5) {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, `rgba(0,0,0,${alpha})`);
    g.addColorStop(0.65, `rgba(0,0,0,${alpha * 0.4})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.translate(0, y);
    ctx.scale(1, ry / rx);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, TAU);
    ctx.fill();
    ctx.restore();
}
function motes(ctx, color, time, seed, count = 7, radius = 38, alpha = 0.4) {
    ctx.save();
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
        const a = seed * 1.7 + i * 2.399 + time * (0.18 + (i % 3) * 0.04);
        const rr = radius * (0.42 + ((i * 37 + seed * 11) % 55) / 100);
        const x = Math.cos(a) * rr;
        const y = Math.sin(a * 1.2) * rr * 0.82 - 2 + Math.sin(time * 1.4 + i) * 1.5;
        ctx.globalAlpha = alpha * (0.35 + ((i * 13) % 10) / 15);
        ctx.beginPath();
        ctx.arc(x, y, 0.8 + (i % 3) * 0.45, 0, TAU);
        ctx.fill();
    }
    ctx.restore();
}
function runeRing(ctx, radius, color, time, alpha = 0.3, ticks = 8) {
    ctx.save();
    ctx.rotate(time * 0.16);
    ctx.strokeStyle = hexToRgba(color, alpha);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, radius - 3, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < ticks; i++) {
        const a = (i / ticks) * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (radius - 1.5), Math.sin(a) * (radius - 1.5));
        ctx.lineTo(Math.cos(a) * (radius + 2.5), Math.sin(a) * (radius + 2.5));
        ctx.stroke();
    }
    ctx.restore();
}
function eye(ctx, x, y, rx, ry, color, pupil = '#08050c') {
    ctx.save();
    ctx.fillStyle = hexToRgba(color, 0.18);
    ctx.beginPath();
    ctx.ellipse(x, y, rx * 1.7, ry * 1.7, 0, 0, TAU);
    ctx.fill();
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
    ctx.restore();
}
function feather(ctx, x, y, length, angle, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, length * 0.2, length * 0.5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -length * 0.46);
    ctx.lineTo(0, length * 0.46);
    ctx.stroke();
    ctx.restore();
}
function brokenHalo(ctx, y, radius, color, alpha) {
    ctx.save();
    ctx.strokeStyle = hexToRgba(color, alpha);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, y, radius, 0.42, TAU - 0.42);
    ctx.stroke();
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 5; i++) {
        const a = 0.5 + i * 0.22;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * radius, y + Math.sin(a) * radius);
        ctx.lineTo(Math.cos(a) * (radius + 4), y + Math.sin(a) * (radius + 4));
        ctx.stroke();
    }
    ctx.restore();
}
function medallion(ctx, size, accent, locked) {
    const r = size * 0.462;
    const g = ctx.createRadialGradient(-r * 0.28, -r * 0.36, r * 0.06, 0, 0, r);
    g.addColorStop(0, locked ? 'rgba(21,23,35,0.98)' : hexToRgba(mixColor(accent, '#131625', 0.8), 0.98));
    g.addColorStop(0.58, 'rgba(8,9,16,0.98)');
    g.addColorStop(1, 'rgba(2,3,8,1)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    const vignette = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.82, 'rgba(0,0,0,0.16)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.62)');
    ctx.fillStyle = vignette;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.055)';
    ctx.lineWidth = Math.max(1, size * 0.007);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
}
function frame(ctx, size, color, active) {
    const r = size * 0.462;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = hexToRgba(color, active ? 0.1 : 0.035);
    ctx.lineWidth = Math.max(2, size * 0.03);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = hexToRgba(color, active ? 0.78 : 0.28);
    ctx.lineWidth = Math.max(1, size * 0.012);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(color, active ? 0.26 : 0.12);
    ctx.lineWidth = Math.max(1, size * 0.005);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        const long = i % 3 === 0;
        const inner = r * (long ? 0.9 : 0.925);
        const outer = r * 0.965;
        ctx.strokeStyle = hexToRgba(color, active ? (long ? 0.55 : 0.28) : 0.12);
        ctx.lineWidth = Math.max(1, size * (long ? 0.009 : 0.006));
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
        ctx.stroke();
    }
    if (size >= 48) {
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * TAU + Math.PI / 4;
            const cx = Math.cos(a) * r;
            const cy = Math.sin(a) * r;
            const d = size * 0.018;
            poly(ctx, [
                [cx, cy - d],
                [cx + d, cy],
                [cx, cy + d],
                [cx - d, cy],
            ]);
            ctx.fillStyle = hexToRgba(color, active ? 0.55 : 0.18);
            ctx.fill();
        }
    }
    ctx.restore();
}
function lockSeal(ctx, size, color) {
    const s = size * 0.2;
    ctx.save();
    const back = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 1.6);
    back.addColorStop(0, 'rgba(4,6,12,0.95)');
    back.addColorStop(1, 'rgba(4,6,12,0)');
    ctx.fillStyle = back;
    ctx.beginPath();
    ctx.arc(0, 0, s * 1.6, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(color, 0.65);
    ctx.lineWidth = Math.max(1, size * 0.013);
    ctx.beginPath();
    ctx.arc(0, -s * 0.18, s * 0.46, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = 'rgba(8,10,18,0.96)';
    ctx.strokeStyle = hexToRgba(color, 0.6);
    roundRectPath(ctx, -s * 0.72, -s * 0.08, s * 1.44, s * 1.12, s * 0.14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hexToRgba(color, 0.8);
    ctx.beginPath();
    ctx.arc(0, s * 0.32, s * 0.13, 0, TAU);
    ctx.fill();
    ctx.fillRect(-s * 0.055, s * 0.32, s * 0.11, s * 0.3);
    ctx.restore();
}
function sealedSigil(ctx, time) {
    const pulse = 0.5 + Math.sin(time * 1.5) * 0.5;
    ctx.save();
    ctx.strokeStyle = 'rgba(158,168,196,0.5)';
    ctx.lineWidth = 1.1;
    ctx.setLineDash([2.5, 4.5]);
    ctx.beginPath();
    ctx.arc(0, 0, 33, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    // Olho do Véu.
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.quadraticCurveTo(0, -20, 20, 0);
    ctx.quadraticCurveTo(0, 20, -20, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(0, 7);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + Math.PI / 8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 35, Math.sin(a) * 35);
        ctx.lineTo(Math.cos(a) * 38, Math.sin(a) * 38);
        ctx.stroke();
    }
    ctx.strokeStyle = `rgba(190,198,220,${0.12 + pulse * 0.14})`;
    ctx.beginPath();
    ctx.arc(0, 0, 24 + pulse * 2, 0, TAU);
    ctx.stroke();
    ctx.restore();
}
function drawHeroIcon(ctx, entry, time) {
    const def = entry.heroId ? CHARACTERS[entry.heroId] : null;
    if (!def)
        return;
    const ink = makeInk(def.colors.accent);
    glow(ctx, 0, 4, 46, def.colors.aura, 0.24);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = hexToRgba(ink.accent, 0.18);
    ctx.lineWidth = 1;
    for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU;
        const inner = 36;
        const outer = 40 + ((i * 7) % 4);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
        ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = hexToRgba(ink.accent, 0.24);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 41, 0, TAU);
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, 43.5, 0, TAU);
    ctx.clip();
    drawCharacterPortrait(ctx, def, 0, 10, 138, time);
    ctx.restore();
}
function drawCreatureIcon(ctx, entry, time) {
    const kind = entry.creatureKind;
    if (!kind)
        return;
    const ink = makeInk(entry.accent);
    glow(ctx, 0, 0, 46, entry.accent, 0.14);
    switch (kind) {
        case 'crawler':
            drawCrawler(ctx, ink, time);
            break;
        case 'warrior':
            drawWarrior(ctx, ink, time);
            break;
        case 'drone':
            drawDrone(ctx, ink, time);
            break;
        case 'hound':
            drawHound(ctx, ink, time);
            break;
        case 'caster':
            drawCaster(ctx, ink, time);
            break;
        case 'brute':
            drawBrute(ctx, ink, time);
            break;
        case 'shade':
            drawShade(ctx, ink, time);
            break;
        case 'construct':
            drawConstruct(ctx, ink, time);
            break;
        case 'seraph':
            drawSeraph(ctx, ink, time);
            break;
        case 'echo':
            drawEcho(ctx, ink, time);
            break;
    }
    motes(ctx, ink.accent, time, entry.arc * 7 + (entry.stageId ?? 0), 6, 40, 0.32);
}
function drawCrawler(ctx, ink, time) {
    const body = mixColor('#4a5c2e', ink.accent, 0.22);
    floorShadow(ctx, 32, 36, 7, 0.55);
    glow(ctx, 24, 2, 22, ink.accent, 0.18);
    // Cauda segmentada com ferrão.
    ctx.lineCap = 'round';
    ctx.strokeStyle = ink.deep;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-20, 12);
    ctx.quadraticCurveTo(-34, 6, -38, -10);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(ink.accent, 0.5);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    poly(ctx, [
        [-38, -10],
        [-43, -17],
        [-34, -14],
    ]);
    ctx.fillStyle = ink.accent;
    ctx.fill();
    // Seis patas articuladas.
    for (let i = 0; i < 3; i++) {
        for (const side of [-1, 1]) {
            const bx = side * (8 + i * 7);
            const by = 9 + i * 3;
            const kx = side * (18 + i * 4);
            const ky = 1 + i * 4;
            const fx = side * (28 + i * 4);
            const fy = 25 + i * 1.5;
            ctx.strokeStyle = ink.deep;
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(kx, ky);
            ctx.lineTo(fx, fy);
            ctx.stroke();
            ctx.strokeStyle = hexToRgba(ink.accent, 0.45);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(kx, ky);
            ctx.lineTo(fx, fy);
            ctx.stroke();
        }
    }
    // Carapaça.
    ctx.fillStyle = shade(ctx, body, ink.accent, -8, 22, 0.28);
    ctx.beginPath();
    ctx.ellipse(0, 8, 26, 13, 0, 0, TAU);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.65), 1.3);
    for (let i = 0; i < 4; i++) {
        const px = -16 + i * 10;
        ctx.fillStyle = hexToRgba(mixColor(body, ink.accent, 0.25), 0.9);
        ctx.beginPath();
        ctx.ellipse(px, 2, 7, 4.5, -0.18, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(ink.accent, 0.35);
        ctx.lineWidth = 0.8;
        ctx.stroke();
    }
    // Espinhos dorsais.
    for (let i = 0; i < 5; i++) {
        const sx = -16 + i * 8;
        poly(ctx, [
            [sx - 3, 0],
            [sx, -9 - (i % 2) * 3],
            [sx + 3, 0],
        ]);
        ctx.fillStyle = ink.deep;
        ctx.fill();
        ctx.strokeStyle = hexToRgba(ink.accent, 0.4);
        ctx.lineWidth = 0.8;
        ctx.stroke();
    }
    // Cabeça e mandíbulas.
    ctx.save();
    ctx.translate(24, 3);
    ctx.fillStyle = shade(ctx, body, ink.accent, -10, 12, 0.3);
    poly(ctx, [
        [-8, -9],
        [7, -10],
        [12, -2],
        [8, 8],
        [-7, 7],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.7), 1.2);
    ctx.strokeStyle = ink.deep;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(8, -2);
    ctx.quadraticCurveTo(15, -7, 19, -2);
    ctx.moveTo(8, 5);
    ctx.quadraticCurveTo(15, 9, 18, 4);
    ctx.stroke();
    ctx.strokeStyle = ink.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(19, -2);
    ctx.lineTo(23, -6);
    ctx.moveTo(18, 4);
    ctx.lineTo(22, 7);
    ctx.stroke();
    eye(ctx, -1, -4, 2.6, 1.8, ink.accent, INK);
    eye(ctx, 5, -6, 1.8, 1.4, ink.accent, INK);
    eye(ctx, 4, 2, 1.5, 1.2, ink.accent, INK);
    ctx.strokeStyle = hexToRgba(ink.accent, 0.55);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3, -9);
    ctx.quadraticCurveTo(-11, -20, -4, -26);
    ctx.moveTo(2, -10);
    ctx.quadraticCurveTo(9, -19, 15, -18);
    ctx.stroke();
    ctx.restore();
    // Rachaduras bioluminescentes.
    ctx.strokeStyle = hexToRgba(ink.accent, 0.75);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-14, 4);
    ctx.lineTo(-8, 9);
    ctx.lineTo(-2, 5);
    ctx.lineTo(5, 10);
    ctx.stroke();
    // Sombra viva sob o corpo.
    ctx.globalAlpha = 0.25 + Math.sin(time * 2.2) * 0.05;
    ctx.strokeStyle = ink.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 30, 24, 3.5, 0, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
}
function drawWarrior(ctx, ink, time) {
    const armor = mixColor('#3a2a58', ink.accent, 0.18);
    floorShadow(ctx, 35, 28, 6, 0.55);
    glow(ctx, 0, -4, 42, ink.accent, 0.16);
    // Capa esfarrapada.
    ctx.fillStyle = 'rgba(16,11,26,0.95)';
    poly(ctx, [
        [-16, -18],
        [-26, 30],
        [-18, 26],
        [-12, 34],
        [-4, 27],
        [2, 34],
        [8, 27],
        [16, 33],
        [24, 26],
        [18, -18],
    ]);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(ink.accent, 0.18);
    ctx.lineWidth = 1;
    ctx.stroke();
    // Pernas.
    ctx.fillStyle = shade(ctx, armor, ink.accent, 8, 36, 0.2);
    poly(ctx, [
        [-13, 10],
        [-2, 10],
        [-3, 34],
        [-14, 34],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.4), 1);
    poly(ctx, [
        [2, 10],
        [13, 10],
        [15, 34],
        [3, 34],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.4), 1);
    ctx.fillStyle = ink.deep;
    ctx.beginPath();
    ctx.ellipse(-8, 23, 4, 3, 0, 0, TAU);
    ctx.ellipse(8, 23, 4, 3, 0, 0, TAU);
    ctx.fill();
    // Torso e peitoral.
    ctx.fillStyle = shade(ctx, armor, ink.accent, -24, 14, 0.32);
    poly(ctx, [
        [-17, -14],
        [17, -14],
        [14, 12],
        [-14, 12],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.65), 1.3);
    ctx.strokeStyle = hexToRgba(ink.accent, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-11, -10);
    ctx.lineTo(0, -2);
    ctx.lineTo(11, -10);
    ctx.moveTo(0, -2);
    ctx.lineTo(0, 9);
    ctx.stroke();
    glow(ctx, 0, 0, 9, ink.accent, 0.3);
    ctx.fillStyle = ink.accent;
    poly(ctx, [
        [0, -4],
        [3, 0],
        [0, 4],
        [-3, 0],
    ]);
    ctx.fill();
    // Ombreiras.
    for (const side of [-1, 1]) {
        ctx.fillStyle = shade(ctx, armor, ink.accent, -20, -4, 0.35);
        ctx.beginPath();
        ctx.ellipse(side * 19, -13, 9, 7, side * 0.25, 0, TAU);
        ctx.fill();
        rim(ctx, hexToRgba(ink.accent, 0.65), 1.1);
        poly(ctx, [
            [side * 19, -19],
            [side * 26, -15],
            [side * 22, -8],
        ]);
        ctx.fillStyle = ink.deep;
        ctx.fill();
    }
    // Braço esquerdo e punho.
    ctx.strokeStyle = ink.deep;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-18, -8);
    ctx.lineTo(-25, 4);
    ctx.stroke();
    ctx.fillStyle = shade(ctx, armor, ink.accent, -4, 10, 0.25);
    ctx.beginPath();
    ctx.arc(-26, 6, 4.5, 0, TAU);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.5), 1);
    // Espada.
    ctx.save();
    ctx.translate(20, 2);
    ctx.rotate(-0.18);
    ctx.fillStyle = '#d9d3ee';
    poly(ctx, [
        [-2, 4],
        [2, 4],
        [3, -34],
        [0, -40],
        [-3, -34],
    ]);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(ink.bright, 0.8);
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.fillStyle = ink.accent;
    ctx.fillRect(-6, -2, 12, 3);
    ctx.fillStyle = ink.deep;
    ctx.fillRect(-1.5, 3, 3, 7);
    ctx.restore();
    // Elmo com chifres.
    ctx.fillStyle = shade(ctx, armor, ink.accent, -34, -14, 0.35);
    poly(ctx, [
        [-8, -25],
        [8, -25],
        [10, -16],
        [5, -11],
        [-5, -11],
        [-10, -16],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.7), 1.2);
    ctx.strokeStyle = ink.bright;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -23);
    ctx.quadraticCurveTo(-18, -30, -16, -38);
    ctx.moveTo(8, -23);
    ctx.quadraticCurveTo(18, -30, 16, -38);
    ctx.stroke();
    ctx.fillStyle = ink.accent;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(-6, -19, 12, 2.4);
    ctx.globalAlpha = 1;
    glow(ctx, 0, -18, 10, ink.accent, 0.4);
    // Brasas subindo da lâmina.
    for (let i = 0; i < 3; i++) {
        const y = -12 - i * 8 + Math.sin(time * 2 + i) * 2;
        ctx.fillStyle = hexToRgba(ink.accent, 0.5 - i * 0.1);
        ctx.beginPath();
        ctx.arc(27 + i * 2, y, 1.1, 0, TAU);
        ctx.fill();
    }
}
function drawDrone(ctx, ink, time) {
    const hull = mixColor('#2b4356', ink.accent, 0.2);
    glow(ctx, 0, 2, 44, ink.accent, 0.16);
    const ground = ctx.createRadialGradient(0, 32, 0, 0, 32, 22);
    ground.addColorStop(0, hexToRgba(ink.accent, 0.12));
    ground.addColorStop(1, hexToRgba(ink.accent, 0));
    ctx.fillStyle = ground;
    ctx.beginPath();
    ctx.ellipse(0, 32, 22, 6, 0, 0, TAU);
    ctx.fill();
    // Hélices girando.
    const spin = time * 0.9;
    for (let i = 0; i < 4; i++) {
        const a = spin + (i / 4) * TAU;
        const ex = Math.cos(a) * 30;
        const ey = Math.sin(a) * 18 + 2;
        ctx.strokeStyle = ink.deep;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 11, Math.sin(a) * 7 + 2);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.strokeStyle = hexToRgba(ink.accent, 0.45);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(ex, ey, 7, 3, a, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = hexToRgba(ink.bright, 0.8);
        ctx.beginPath();
        ctx.moveTo(ex - 5, ey);
        ctx.lineTo(ex + 5, ey);
        ctx.stroke();
    }
    // Casco.
    const bodyGrad = ctx.createRadialGradient(-5, -6, 2, 0, 2, 20);
    bodyGrad.addColorStop(0, mixColor(hull, ink.bright, 0.35));
    bodyGrad.addColorStop(0.6, hull);
    bodyGrad.addColorStop(1, ink.deep);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 2, 18, 0, TAU);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.6), 1.3);
    ctx.strokeStyle = hexToRgba(ink.accent, 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 2, 13, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(ink.accent, 0.25);
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 9, 2 + Math.sin(a) * 9);
        ctx.lineTo(Math.cos(a) * 17, 2 + Math.sin(a) * 17);
        ctx.stroke();
    }
    // Lente central.
    glow(ctx, 0, 2, 14, ink.accent, 0.45);
    eye(ctx, 0, 2, 7, 5, ink.accent, INK);
    // Antena e luz de transmissão.
    ctx.strokeStyle = ink.deep;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(2, -24);
    ctx.stroke();
    ctx.fillStyle = ink.accent;
    ctx.globalAlpha = 0.5 + Math.sin(time * 4) * 0.4;
    ctx.beginPath();
    ctx.arc(2, -25, 1.6, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Propulsor.
    glow(ctx, 0, 20, 10, ink.accent, 0.3);
    ctx.fillStyle = hexToRgba(ink.accent, 0.6);
    poly(ctx, [
        [-4, 18],
        [0, 26],
        [4, 18],
    ]);
    ctx.fill();
}
function drawHound(ctx, ink, time) {
    const fur = mixColor('#5c211a', ink.accent, 0.16);
    floorShadow(ctx, 32, 34, 7, 0.55);
    glow(ctx, 16, 2, 24, ink.accent, 0.16);
    // Cauda com chama.
    ctx.strokeStyle = ink.deep;
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-22, 8);
    ctx.quadraticCurveTo(-34, 4, -36, -10);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(ink.accent, 0.6);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = hexToRgba(ink.accent, 0.85);
    poly(ctx, [
        [-36, -10],
        [-41, -20],
        [-34, -17],
        [-32, -25],
        [-28, -15],
    ]);
    ctx.fill();
    // Patas.
    const legs = [
        [-16, 9, -22, 31],
        [-6, 11, -8, 32],
        [10, 9, 8, 31],
        [20, 8, 26, 30],
    ];
    for (const [bx, by, fx, fy] of legs) {
        ctx.strokeStyle = ink.deep;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx - 2, (by + fy) / 2, fx, fy);
        ctx.stroke();
        ctx.strokeStyle = hexToRgba(ink.accent, 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.strokeStyle = ink.bright;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + 3, fy + 3);
        ctx.stroke();
    }
    // Corpo.
    ctx.fillStyle = shade(ctx, fur, ink.accent, -8, 22, 0.3);
    ctx.beginPath();
    ctx.ellipse(0, 6, 25, 13, 0, 0, TAU);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.65), 1.3);
    // Juba de brasas.
    for (let i = 0; i < 5; i++) {
        const sx = -18 + i * 8;
        poly(ctx, [
            [sx - 4, 0],
            [sx - 1, -10 - (i % 2) * 4],
            [sx + 3, 0],
        ]);
        ctx.fillStyle = hexToRgba(ink.accent, 0.3 + (i % 3) * 0.12);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(ink.accent, 0.5);
        ctx.lineWidth = 0.8;
        ctx.stroke();
    }
    // Cabeça.
    ctx.save();
    ctx.translate(24, 0);
    ctx.fillStyle = shade(ctx, fur, ink.accent, -10, 14, 0.32);
    poly(ctx, [
        [-9, -8],
        [5, -10],
        [13, -3],
        [14, 4],
        [7, 9],
        [-7, 9],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.7), 1.2);
    // Orelhas.
    poly(ctx, [
        [-7, -9],
        [-12, -20],
        [-2, -12],
    ]);
    ctx.fillStyle = ink.deep;
    ctx.fill();
    ctx.strokeStyle = hexToRgba(ink.accent, 0.45);
    ctx.lineWidth = 0.9;
    ctx.stroke();
    poly(ctx, [
        [0, -10],
        [-1, -21],
        [7, -12],
    ]);
    ctx.fillStyle = ink.deep;
    ctx.fill();
    ctx.stroke();
    // Focinho aberto e dentes.
    ctx.fillStyle = INK;
    poly(ctx, [
        [10, -2],
        [23, 1],
        [21, 5],
        [9, 4],
    ]);
    ctx.fill();
    poly(ctx, [
        [9, 5],
        [21, 7],
        [18, 12],
        [7, 9],
    ]);
    ctx.fill();
    ctx.fillStyle = '#f4ecd2';
    for (let i = 0; i < 3; i++) {
        poly(ctx, [
            [12 + i * 3, 3],
            [13 + i * 3, 7],
            [14 + i * 3, 3],
        ]);
        ctx.fill();
    }
    for (let i = 0; i < 2; i++) {
        poly(ctx, [
            [12 + i * 3, 7],
            [13 + i * 3, 4],
            [14 + i * 3, 7],
        ]);
        ctx.fill();
    }
    eye(ctx, 3, -4, 3, 2, ink.accent, INK);
    ctx.strokeStyle = hexToRgba(ink.accent, 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-2, -7);
    ctx.lineTo(2, -1);
    ctx.stroke();
    ctx.restore();
    // Brasas da juba.
    for (let i = 0; i < 4; i++) {
        const y = 18 - i * 6 + Math.sin(time * 2 + i) * 2;
        ctx.fillStyle = hexToRgba(ink.accent, 0.4 - i * 0.07);
        ctx.beginPath();
        ctx.arc(-24 + i * 4, y, 1.1, 0, TAU);
        ctx.fill();
    }
}
function drawCaster(ctx, ink, time) {
    const robe = mixColor('#4a2240', ink.accent, 0.18);
    floorShadow(ctx, 35, 22, 5, 0.4);
    runeRing(ctx, 36, ink.accent, time, 0.22, 10);
    glow(ctx, 0, 0, 40, ink.accent, 0.14);
    // Manto.
    ctx.fillStyle = shade(ctx, robe, ink.accent, -34, 34, 0.3);
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.quadraticCurveTo(15, -26, 17, -12);
    ctx.quadraticCurveTo(24, 10, 29, 31);
    ctx.lineTo(20, 27);
    ctx.lineTo(14, 33);
    ctx.lineTo(6, 27);
    ctx.lineTo(0, 34);
    ctx.lineTo(-6, 27);
    ctx.lineTo(-14, 33);
    ctx.lineTo(-20, 27);
    ctx.lineTo(-29, 31);
    ctx.quadraticCurveTo(-24, 10, -17, -12);
    ctx.quadraticCurveTo(-15, -26, 0, -32);
    ctx.closePath();
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.55), 1.2);
    ctx.strokeStyle = hexToRgba(ink.accent, 0.18);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-10, 6);
    ctx.quadraticCurveTo(-14, 20, -18, 28);
    ctx.moveTo(10, 6);
    ctx.quadraticCurveTo(14, 20, 18, 28);
    ctx.stroke();
    // Capuz vazio.
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(0, -19, 10, 13, 0, 0, TAU);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.5), 1);
    eye(ctx, -4, -20, 2.2, 1.6, ink.accent, INK);
    eye(ctx, 4, -20, 2.2, 1.6, ink.accent, INK);
    // Mangas e mãos.
    for (const side of [-1, 1]) {
        ctx.strokeStyle = shade(ctx, robe, ink.accent, 0, 20, 0.25);
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(side * 13, -8);
        ctx.quadraticCurveTo(side * 24, -2, side * 26, 6);
        ctx.stroke();
        ctx.strokeStyle = hexToRgba(ink.accent, 0.25);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = ink.deep;
        ctx.beginPath();
        ctx.arc(side * 27, 8, 3, 0, TAU);
        ctx.fill();
    }
    // Orbe.
    glow(ctx, 27, 8, 14, ink.accent, 0.4 + Math.sin(time * 3) * 0.1);
    ctx.fillStyle = ink.bright;
    ctx.beginPath();
    ctx.arc(27, 8, 4, 0, TAU);
    ctx.fill();
    // Runas flutuantes.
    for (let i = 0; i < 4; i++) {
        const a = time * 0.4 + (i / 4) * TAU;
        const x = Math.cos(a) * 35;
        const y = Math.sin(a) * 24 - 2;
        ctx.strokeStyle = hexToRgba(ink.accent, 0.4);
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(x - 2, y - 2);
        ctx.lineTo(x + 2, y - 2);
        ctx.moveTo(x, y - 2);
        ctx.lineTo(x, y + 2);
        ctx.stroke();
    }
    // Barra do manto.
    ctx.strokeStyle = hexToRgba(ink.bright, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-17, -13);
    ctx.quadraticCurveTo(0, -8, 17, -13);
    ctx.stroke();
}
function drawBrute(ctx, ink, time) {
    const skin = mixColor('#4a3024', ink.accent, 0.18);
    floorShadow(ctx, 35, 38, 8, 0.6);
    glow(ctx, 0, 4, 42, ink.accent, 0.16);
    // Pernas.
    ctx.fillStyle = shade(ctx, skin, ink.accent, 10, 36, 0.2);
    poly(ctx, [
        [-20, 12],
        [-6, 12],
        [-8, 35],
        [-24, 35],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.4), 1);
    poly(ctx, [
        [6, 12],
        [20, 12],
        [24, 35],
        [8, 35],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.4), 1);
    // Torso.
    ctx.fillStyle = shade(ctx, skin, ink.accent, -28, 16, 0.32);
    poly(ctx, [
        [-24, 12],
        [-28, -14],
        [-16, -28],
        [16, -28],
        [28, -14],
        [24, 12],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.6), 1.4);
    ctx.strokeStyle = hexToRgba(ink.accent, 0.25);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-16, -8);
    ctx.quadraticCurveTo(0, 2, 16, -8);
    ctx.moveTo(-12, 2);
    ctx.quadraticCurveTo(0, 10, 12, 2);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(ink.accent, 0.8);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-10, -20);
    ctx.lineTo(-4, -10);
    ctx.lineTo(-8, -2);
    ctx.moveTo(8, -22);
    ctx.lineTo(4, -12);
    ctx.lineTo(10, -4);
    ctx.stroke();
    // Ombros.
    for (const side of [-1, 1]) {
        ctx.fillStyle = shade(ctx, skin, ink.accent, -24, -8, 0.3);
        ctx.beginPath();
        ctx.ellipse(side * 25, -18, 10, 8, side * 0.2, 0, TAU);
        ctx.fill();
        rim(ctx, hexToRgba(ink.accent, 0.55), 1.1);
        poly(ctx, [
            [side * 22, -26],
            [side * 30, -22],
            [side * 25, -15],
        ]);
        ctx.fillStyle = ink.deep;
        ctx.fill();
        ctx.strokeStyle = hexToRgba(ink.accent, 0.4);
        ctx.lineWidth = 0.8;
        ctx.stroke();
    }
    // Braços e punhos.
    for (const side of [-1, 1]) {
        ctx.strokeStyle = ink.deep;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(side * 24, -14);
        ctx.lineTo(side * 33, 16);
        ctx.stroke();
        ctx.strokeStyle = shade(ctx, skin, ink.accent, 0, 20, 0.25);
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(side * 24, -14);
        ctx.lineTo(side * 33, 16);
        ctx.stroke();
        ctx.fillStyle = shade(ctx, skin, ink.accent, 10, 28, 0.3);
        ctx.beginPath();
        ctx.arc(side * 34, 19, 8, 0, TAU);
        ctx.fill();
        rim(ctx, hexToRgba(ink.accent, 0.55), 1.1);
        ctx.fillStyle = ink.deep;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(side * (30 + i * 3), 15, 1.5, 0, TAU);
            ctx.fill();
        }
    }
    // Cabeça pequena.
    ctx.fillStyle = shade(ctx, skin, ink.accent, -38, -22, 0.3);
    ctx.beginPath();
    ctx.arc(0, -31, 8, 0, TAU);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.6), 1.1);
    eye(ctx, -3, -32, 2, 1.5, ink.accent, INK);
    eye(ctx, 3, -32, 2, 1.5, ink.accent, INK);
    // Correntes.
    ctx.strokeStyle = hexToRgba(ink.bright, 0.4);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-18, -14);
    ctx.quadraticCurveTo(0, -4, 18, -14);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
        const x = -12 + i * 12;
        const y = -10 + Math.sin((i / 2) * Math.PI) * 4;
        ctx.beginPath();
        ctx.ellipse(x, y, 2.4, 1.4, 0.4, 0, TAU);
        ctx.stroke();
    }
    // Respiração.
    const pulse = 0.5 + Math.sin(time * 2.4) * 0.5;
    ctx.globalAlpha = 0.25 + pulse * 0.2;
    ctx.strokeStyle = ink.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 32, 28, 4, 0, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
}
function drawShade(ctx, ink, time) {
    const mist = mixColor('#2b3654', ink.accent, 0.22);
    floorShadow(ctx, 37, 24, 4, 0.35);
    glow(ctx, 0, 0, 42, ink.accent, 0.16);
    // Véu externo.
    ctx.fillStyle = 'rgba(20,28,48,0.45)';
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.quadraticCurveTo(24, -20, 22, 8);
    ctx.quadraticCurveTo(28, 28, 12, 38);
    ctx.quadraticCurveTo(6, 30, 0, 38);
    ctx.quadraticCurveTo(-6, 30, -12, 38);
    ctx.quadraticCurveTo(-28, 28, -22, 8);
    ctx.quadraticCurveTo(-24, -20, 0, -30);
    ctx.fill();
    // Corpo.
    ctx.fillStyle = shade(ctx, mist, ink.accent, -30, 30, 0.3);
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.quadraticCurveTo(17, -24, 18, -6);
    ctx.quadraticCurveTo(20, 12, 14, 26);
    ctx.quadraticCurveTo(8, 20, 2, 32);
    ctx.quadraticCurveTo(-2, 22, -8, 30);
    ctx.quadraticCurveTo(-14, 16, -18, -4);
    ctx.quadraticCurveTo(-17, -24, 0, -32);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.55), 1.2);
    // Rosto vazio.
    ctx.fillStyle = 'rgba(4,6,12,0.9)';
    ctx.beginPath();
    ctx.ellipse(0, -19, 9, 11, 0, 0, TAU);
    ctx.fill();
    eye(ctx, -4, -20, 2.2, 1.6, ink.accent, INK);
    eye(ctx, 4, -20, 2.2, 1.6, ink.accent, INK);
    // Núcleo frio.
    glow(ctx, 0, 2, 14, ink.accent, 0.3);
    ctx.fillStyle = hexToRgba(ink.accent, 0.6);
    ctx.beginPath();
    ctx.arc(0, 2, 2.6, 0, TAU);
    ctx.fill();
    // Tentáculos.
    ctx.strokeStyle = hexToRgba(ink.accent, 0.4);
    ctx.lineWidth = 1.2;
    for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 10, 22);
        ctx.quadraticCurveTo(side * (18 + Math.sin(time * 2 + side) * 2), 30, side * 14, 40);
        ctx.stroke();
    }
    // Almas ao redor.
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 3; i++) {
        const a = time * 0.5 + i * 2.1;
        const x = Math.cos(a) * 26;
        const y = Math.sin(a * 1.3) * 22 + 4;
        ctx.fillStyle = ink.accent;
        ctx.beginPath();
        ctx.arc(x, y, 1.4, 0, TAU);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}
function drawConstruct(ctx, ink, time) {
    const glass = mixColor('#34445e', ink.accent, 0.28);
    floorShadow(ctx, 35, 26, 6, 0.45);
    glow(ctx, 0, -2, 42, ink.accent, 0.16);
    // Estilhaços orbitando.
    for (let i = 0; i < 6; i++) {
        const a = time * 0.35 + (i / 6) * TAU;
        const r = 34 + Math.sin(time * 1.2 + i) * 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r * 0.8 - 2;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a + time * 0.3);
        ctx.fillStyle = hexToRgba(ink.accent, 0.18 + (i % 3) * 0.08);
        poly(ctx, [
            [0, -4],
            [3, 0],
            [0, 4],
            [-3, 0],
        ]);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(ink.accent, 0.5);
        ctx.lineWidth = 0.7;
        ctx.stroke();
        ctx.restore();
    }
    // Pernas.
    ctx.fillStyle = shade(ctx, glass, ink.accent, 8, 36, 0.3);
    poly(ctx, [
        [-14, 10],
        [-3, 10],
        [-7, 35],
        [-18, 35],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.5), 1);
    poly(ctx, [
        [3, 10],
        [14, 10],
        [18, 35],
        [7, 35],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.5), 1);
    // Torso facetado.
    ctx.fillStyle = shade(ctx, glass, ink.accent, -28, 16, 0.35);
    poly(ctx, [
        [-16, -16],
        [0, -26],
        [16, -16],
        [13, 12],
        [0, 18],
        [-13, 12],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.7), 1.2);
    ctx.strokeStyle = hexToRgba(ink.accent, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(0, 18);
    ctx.moveTo(-16, -16);
    ctx.lineTo(13, 12);
    ctx.moveTo(16, -16);
    ctx.lineTo(-13, 12);
    ctx.stroke();
    // Núcleo prismático.
    glow(ctx, 0, -2, 16, ink.accent, 0.45);
    ctx.fillStyle = ink.bright;
    poly(ctx, [
        [0, -8],
        [5, 0],
        [0, 8],
        [-5, 0],
    ]);
    ctx.fill();
    // Braços.
    for (const side of [-1, 1]) {
        ctx.strokeStyle = shade(ctx, glass, ink.accent, 0, 20, 0.25);
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(side * 15, -10);
        ctx.lineTo(side * 24, 12);
        ctx.stroke();
        ctx.strokeStyle = hexToRgba(ink.accent, 0.4);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = shade(ctx, glass, ink.accent, 10, 22, 0.3);
        poly(ctx, [
            [side * 24, 8],
            [side * 29, 12],
            [side * 25, 18],
            [side * 20, 14],
        ]);
        ctx.fill();
        rim(ctx, hexToRgba(ink.accent, 0.5), 0.8);
    }
    // Cabeça.
    ctx.fillStyle = shade(ctx, glass, ink.accent, -38, -20, 0.35);
    poly(ctx, [
        [-8, -28],
        [0, -36],
        [8, -28],
        [0, -20],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.7), 1);
    glow(ctx, 0, -28, 8, ink.accent, 0.4);
    ctx.fillStyle = ink.accent;
    ctx.fillRect(-4, -29, 8, 2);
    // Rachaduras internas.
    ctx.strokeStyle = hexToRgba(ink.bright, 0.5);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-8, -6);
    ctx.lineTo(-4, 2);
    ctx.lineTo(-6, 8);
    ctx.moveTo(6, -12);
    ctx.lineTo(3, -4);
    ctx.lineTo(7, 4);
    ctx.stroke();
}
function drawSeraph(ctx, ink, time) {
    const featherColor = mixColor('#8a8160', ink.accent, 0.35);
    glow(ctx, 0, -2, 44, ink.accent, 0.2);
    // Dois pares de asas.
    for (const side of [-1, 1]) {
        for (let layer = 0; layer < 2; layer++) {
            const spread = 26 + layer * 10;
            const lift = -16 - layer * 7;
            ctx.fillStyle =
                layer === 0
                    ? hexToRgba(ink.deep, 0.95)
                    : hexToRgba(mixColor('#4a4430', ink.accent, 0.2), 0.9);
            ctx.beginPath();
            ctx.moveTo(side * 6, lift + 4);
            ctx.quadraticCurveTo(side * spread, lift - 18, side * (spread + 5), lift + 10);
            ctx.quadraticCurveTo(side * (spread - 6), lift + 4, side * (spread - 14), lift + 14);
            ctx.quadraticCurveTo(side * (spread - 18), lift + 6, side * 7, lift + 16);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = hexToRgba(ink.accent, 0.35);
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.strokeStyle = hexToRgba(ink.accent, 0.2);
            ctx.lineWidth = 0.8;
            for (let f = 0; f < 3; f++) {
                const t = 0.25 + f * 0.22;
                ctx.beginPath();
                ctx.moveTo(side * (7 + t * 10), lift + 10);
                ctx.quadraticCurveTo(side * (spread * 0.7), lift - 6, side * (spread - 6), lift + 2 + f * 3);
                ctx.stroke();
            }
        }
    }
    // Corpo.
    ctx.fillStyle = shade(ctx, featherColor, ink.accent, -26, 30, 0.3);
    ctx.beginPath();
    ctx.ellipse(0, 4, 10, 24, 0, 0, TAU);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.55), 1.2);
    // Cabeça.
    ctx.fillStyle = shade(ctx, featherColor, ink.accent, -36, -18, 0.35);
    ctx.beginPath();
    ctx.arc(0, -27, 8, 0, TAU);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.6), 1.1);
    brokenHalo(ctx, -36, 9, ink.accent, 0.7);
    eye(ctx, -3, -28, 1.8, 1.3, ink.accent, INK);
    eye(ctx, 3, -28, 1.8, 1.3, ink.accent, INK);
    // Lança.
    ctx.strokeStyle = hexToRgba(ink.bright, 0.75);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(16, -34);
    ctx.lineTo(16, 32);
    ctx.stroke();
    ctx.fillStyle = ink.accent;
    poly(ctx, [
        [16, -38],
        [19, -32],
        [13, -32],
    ]);
    ctx.fill();
    // Penas caindo.
    for (let i = 0; i < 3; i++) {
        const y = -14 + i * 15 + Math.sin(time * 1.5 + i) * 3;
        feather(ctx, -24 + i * 20, y, 8, -0.4 + i * 0.35, ink.accent, 0.35);
    }
}
function drawEcho(ctx, ink, time) {
    const shell = mixColor('#3c2a5a', ink.accent, 0.22);
    glow(ctx, 0, 0, 42, ink.accent, 0.16);
    ctx.strokeStyle = hexToRgba(ink.accent, 0.18);
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 4, 18 + i * 10, 0, TAU);
        ctx.stroke();
    }
    const drawEchoBody = (dx, alpha, detail) => {
        ctx.save();
        ctx.translate(dx, 0);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = shell;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.quadraticCurveTo(14, -24, 13, 2);
        ctx.quadraticCurveTo(16, 18, 8, 30);
        ctx.lineTo(-8, 30);
        ctx.quadraticCurveTo(-16, 18, -13, 2);
        ctx.quadraticCurveTo(-14, -24, 0, -30);
        ctx.fill();
        if (detail) {
            rim(ctx, hexToRgba(ink.accent, 0.55), 1.2);
            ctx.fillStyle = 'rgba(5,6,12,0.85)';
            ctx.beginPath();
            ctx.ellipse(0, -20, 7, 9, 0, 0, TAU);
            ctx.fill();
            eye(ctx, -3, -20, 2, 1.5, ink.accent, INK);
            eye(ctx, 3, -20, 2, 1.5, ink.accent, INK);
            ctx.strokeStyle = shell;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(10, -6);
            ctx.lineTo(24, 4);
            ctx.stroke();
            ctx.fillStyle = ink.accent;
            ctx.beginPath();
            ctx.arc(25, 5, 2.4, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    };
    drawEchoBody(-12, 0.22, false);
    drawEchoBody(12, 0.34, false);
    drawEchoBody(0, 1, true);
    // Estilhaços de memória.
    for (let i = 0; i < 5; i++) {
        const a = time * 0.4 + (i / 5) * TAU;
        const r = 30 + Math.sin(time + i) * 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r * 0.8;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);
        ctx.fillStyle = hexToRgba(ink.accent, 0.35);
        poly(ctx, [
            [0, -3],
            [2.5, 0],
            [0, 3],
            [-2.5, 0],
        ]);
        ctx.fill();
        ctx.restore();
    }
    ctx.strokeStyle = hexToRgba(ink.accent, 0.3 + Math.sin(time * 2) * 0.1);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 4, 36 + Math.sin(time * 2) * 2, 0, TAU);
    ctx.stroke();
}
function drawBossIcon(ctx, entry, time) {
    const ink = makeInk(entry.accent);
    const pulse = 0.5 + Math.sin(time * 2.4) * 0.5;
    glow(ctx, 0, 0, 46, entry.accent, 0.2);
    switch (entry.bossId) {
        case 'colossus':
            drawColossus(ctx, ink, pulse);
            break;
        case 'vekthar':
            drawVekthar(ctx, ink, pulse);
            break;
        case 'xalmor':
            drawXalmor(ctx, ink, time, pulse);
            break;
        case 'acheron':
            drawAcheron(ctx, ink, time, pulse);
            break;
        case 'malakhim':
            drawMalakhim(ctx, ink, time, pulse);
            break;
        case 'ferrato':
            drawFerrato(ctx, ink, time, pulse);
            break;
    }
    motes(ctx, ink.accent, time, entry.arc * 5 + 11, 5, 40, 0.28);
}
function drawColossus(ctx, ink, pulse) {
    const flesh = mixColor('#5a2a22', ink.accent, 0.18);
    const eyeColor = '#c6ff5a';
    floorShadow(ctx, 38, 40, 8, 0.6);
    glow(ctx, 0, 4, 44, ink.accent, 0.2);
    // Tentáculos.
    const tendrils = [
        [-22, 0, -40, -20, -38, -34],
        [24, 4, 42, -10, 36, -30],
        [-10, 20, -30, 30, -34, 40],
        [14, 22, 32, 32, 36, 40],
    ];
    for (const [sx, sy, cx, cy, ex, ey] of tendrils) {
        ctx.strokeStyle = ink.deep;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cx, cy, ex, ey);
        ctx.stroke();
        ctx.strokeStyle = hexToRgba(ink.accent, 0.3);
        ctx.lineWidth = 1.4;
        ctx.stroke();
    }
    // Massa de carne e concreto.
    const g = ctx.createRadialGradient(-8, -12, 4, 0, 6, 36);
    g.addColorStop(0, mixColor(flesh, ink.accent, 0.25));
    g.addColorStop(0.65, flesh);
    g.addColorStop(1, ink.deep);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-30, 10);
    ctx.quadraticCurveTo(-38, -12, -20, -24);
    ctx.quadraticCurveTo(-8, -36, 8, -28);
    ctx.quadraticCurveTo(30, -30, 34, -6);
    ctx.quadraticCurveTo(38, 16, 20, 28);
    ctx.quadraticCurveTo(0, 38, -20, 28);
    ctx.quadraticCurveTo(-36, 24, -30, 10);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.5), 1.4);
    // Muitos olhos.
    eye(ctx, -14, -8, 5, 4, eyeColor, INK);
    eye(ctx, 5, -14, 4, 3.2, eyeColor, INK);
    eye(ctx, 17, -2, 6, 4.6, eyeColor, INK);
    eye(ctx, -3, 7, 3.4, 2.6, eyeColor, INK);
    eye(ctx, 20, 14, 3, 2.2, eyeColor, INK);
    // Boca.
    ctx.fillStyle = '#1a0808';
    ctx.beginPath();
    ctx.ellipse(0, 20, 12, 7, 0, 0, TAU);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.5), 1);
    ctx.fillStyle = '#f4ecd2';
    for (let i = 0; i < 6; i++) {
        const x = -9 + i * 3.6;
        poly(ctx, [
            [x, 14],
            [x + 1.5, 18],
            [x + 3, 14],
        ]);
        ctx.fill();
        poly(ctx, [
            [x, 26],
            [x + 1.5, 22],
            [x + 3, 26],
        ]);
        ctx.fill();
    }
    // Rachaduras.
    ctx.strokeStyle = hexToRgba(ink.accent, 0.75);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-24, -8);
    ctx.lineTo(-16, -2);
    ctx.lineTo(-20, 6);
    ctx.moveTo(10, -24);
    ctx.lineTo(6, -14);
    ctx.lineTo(12, -6);
    ctx.moveTo(-8, 26);
    ctx.lineTo(-2, 20);
    ctx.lineTo(4, 26);
    ctx.stroke();
    // Destroços de concreto.
    ctx.fillStyle = 'rgba(120,118,124,0.55)';
    const chunks = [
        [-24, 14, 7, 4, 0.3],
        [12, -20, 8, 4, -0.4],
        [26, 10, 6, 3, 0.2],
        [-14, -24, 5, 3, 0.5],
    ];
    for (const [x, y, w, h, r] of chunks) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(r);
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.restore();
    }
    // Pulso da fome.
    ctx.globalAlpha = 0.15 + pulse * 0.15;
    ctx.strokeStyle = ink.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 34, 30, 5, 0, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
}
function drawVekthar(ctx, ink, pulse) {
    const armor = mixColor('#3a2c58', ink.accent, 0.18);
    const eyeColor = '#ffb04a';
    floorShadow(ctx, 36, 32, 7, 0.55);
    glow(ctx, 0, 0, 44, ink.accent, 0.2);
    // Capa.
    ctx.fillStyle = 'rgba(20,12,28,0.95)';
    poly(ctx, [
        [-18, -20],
        [-30, 32],
        [-16, 26],
        [-8, 36],
        [0, 28],
        [10, 36],
        [18, 27],
        [30, 32],
        [18, -20],
    ]);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(ink.accent, 0.2);
    ctx.lineWidth = 1;
    ctx.stroke();
    // Pernas.
    ctx.fillStyle = shade(ctx, armor, ink.accent, 8, 36, 0.2);
    poly(ctx, [
        [-15, 10],
        [-3, 10],
        [-4, 35],
        [-16, 35],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.4), 1);
    poly(ctx, [
        [3, 10],
        [15, 10],
        [16, 35],
        [4, 35],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.4), 1);
    // Torso.
    ctx.fillStyle = shade(ctx, armor, ink.accent, -28, 14, 0.32);
    poly(ctx, [
        [-20, 12],
        [-24, -16],
        [-12, -28],
        [12, -28],
        [24, -16],
        [20, 12],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.65), 1.3);
    ctx.strokeStyle = hexToRgba(ink.accent, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-12, -14);
    ctx.lineTo(0, -4);
    ctx.lineTo(12, -14);
    ctx.moveTo(0, -4);
    ctx.lineTo(0, 9);
    ctx.stroke();
    glow(ctx, 0, -4, 12, ink.accent, 0.35);
    ctx.fillStyle = ink.accent;
    poly(ctx, [
        [0, -8],
        [4, -4],
        [0, 0],
        [-4, -4],
    ]);
    ctx.fill();
    // Ombreiras.
    for (const side of [-1, 1]) {
        ctx.fillStyle = shade(ctx, armor, ink.accent, -24, -8, 0.32);
        ctx.beginPath();
        ctx.ellipse(side * 24, -16, 10, 8, side * 0.2, 0, TAU);
        ctx.fill();
        rim(ctx, hexToRgba(ink.accent, 0.6), 1.1);
        poly(ctx, [
            [side * 22, -24],
            [side * 32, -20],
            [side * 27, -12],
        ]);
        ctx.fillStyle = ink.deep;
        ctx.fill();
        ctx.strokeStyle = hexToRgba(ink.accent, 0.5);
        ctx.lineWidth = 0.8;
        ctx.stroke();
    }
    // Canhão fundido ao ombro.
    ctx.fillStyle = ink.deep;
    roundRectPath(ctx, 14, -32, 24, 9, 3);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(ink.accent, 0.6);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = armor;
    roundRectPath(ctx, 14, -32, 17, 9, 3);
    ctx.fill();
    ctx.fillStyle = ink.accent;
    ctx.fillRect(33, -29, 7, 3);
    glow(ctx, 40, -27, 9, ink.accent, 0.35 + pulse * 0.2);
    // Espada.
    ctx.save();
    ctx.translate(-22, 4);
    ctx.rotate(0.15);
    ctx.fillStyle = '#d9d3ee';
    poly(ctx, [
        [-2, 4],
        [2, 4],
        [3, -34],
        [0, -40],
        [-3, -34],
    ]);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(ink.bright, 0.8);
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.fillStyle = ink.accent;
    ctx.fillRect(-6, -2, 12, 3);
    ctx.restore();
    // Elmo com chifres.
    ctx.fillStyle = shade(ctx, armor, ink.accent, -38, -14, 0.35);
    poly(ctx, [
        [-8, -31],
        [8, -31],
        [10, -20],
        [5, -14],
        [-5, -14],
        [-10, -20],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.7), 1.2);
    ctx.strokeStyle = ink.bright;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-7, -31);
    ctx.quadraticCurveTo(-20, -38, -15, -42);
    ctx.moveTo(7, -31);
    ctx.quadraticCurveTo(20, -38, 15, -42);
    ctx.stroke();
    ctx.fillStyle = eyeColor;
    ctx.fillRect(-7, -25, 14, 2.5);
    glow(ctx, 0, -24, 9, eyeColor, 0.4);
}
function drawXalmor(ctx, ink, time, pulse) {
    const metal = mixColor('#244058', ink.accent, 0.2);
    const eyeColor = '#ff5470';
    glow(ctx, 0, 0, 46, ink.accent, 0.2);
    // Anéis orbitais.
    for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate(time * 0.12 + i * 0.9);
        ctx.strokeStyle = hexToRgba(ink.accent, 0.22 + i * 0.08);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 38 - i * 4, 12 - i * 2, 0.25, 0, TAU);
        ctx.stroke();
        ctx.restore();
    }
    // Núcleo.
    const g = ctx.createRadialGradient(-6, -6, 3, 0, 0, 22);
    g.addColorStop(0, mixColor(metal, ink.bright, 0.35));
    g.addColorStop(0.6, metal);
    g.addColorStop(1, ink.deep);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, TAU);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.7), 1.4);
    // Painéis.
    ctx.strokeStyle = hexToRgba(ink.accent, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, TAU);
    ctx.moveTo(-20, 0);
    ctx.lineTo(20, 0);
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 20);
    ctx.stroke();
    // Olho.
    glow(ctx, 0, 0, 16, eyeColor, 0.5);
    eye(ctx, 0, 0, 8, 6, eyeColor, INK);
    // Antenas.
    ctx.strokeStyle = ink.deep;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-16, -10);
    ctx.lineTo(-28, -20);
    ctx.moveTo(16, -10);
    ctx.lineTo(28, -20);
    ctx.stroke();
    ctx.fillStyle = ink.accent;
    ctx.beginPath();
    ctx.arc(-29, -21, 1.4, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(29, -21, 1.4, 0, TAU);
    ctx.fill();
    // Satélites.
    for (let i = 0; i < 4; i++) {
        const a = time * 0.6 + (i / 4) * TAU;
        const x = Math.cos(a) * 30;
        const y = Math.sin(a) * 13;
        ctx.fillStyle = ink.accent;
        ctx.globalAlpha = 0.55 + pulse * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = ink.accent;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
    // Feixe fraco.
    ctx.globalAlpha = 0.18 + pulse * 0.12;
    ctx.fillStyle = eyeColor;
    poly(ctx, [
        [-3, 4],
        [3, 4],
        [10, 38],
        [-10, 38],
    ]);
    ctx.fill();
    ctx.globalAlpha = 1;
}
function drawAcheron(ctx, ink, time, pulse) {
    const armor = mixColor('#4a1018', ink.accent, 0.18);
    const eyeColor = '#ffe066';
    floorShadow(ctx, 37, 34, 7, 0.6);
    glow(ctx, 0, 4, 44, ink.accent, 0.22);
    // Chamas atrás.
    for (let i = 0; i < 4; i++) {
        const x = -18 + i * 12;
        const h = 10 + ((i * 7) % 10) + Math.sin(time * 3 + i) * 2;
        ctx.fillStyle = hexToRgba(ink.accent, 0.12 + ((i * 3) % 5) * 0.03);
        poly(ctx, [
            [x - 6, 34],
            [x, 34 - h],
            [x + 6, 34],
        ]);
        ctx.fill();
    }
    // Capa e colarinho.
    ctx.fillStyle = 'rgba(24,8,12,0.95)';
    poly(ctx, [
        [-22, -10],
        [-30, 30],
        [-14, 24],
        [-6, 34],
        [4, 25],
        [14, 34],
        [22, 25],
        [30, 30],
        [20, -10],
    ]);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(ink.accent, 0.2);
    ctx.lineWidth = 1;
    ctx.stroke();
    // Torso.
    ctx.fillStyle = shade(ctx, armor, ink.accent, -24, 16, 0.28);
    poly(ctx, [
        [-16, 12],
        [-20, -12],
        [-8, -22],
        [8, -22],
        [20, -12],
        [16, 12],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.6), 1.3);
    ctx.strokeStyle = hexToRgba(ink.accent, 0.4);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.lineTo(0, -2);
    ctx.lineTo(10, -12);
    ctx.moveTo(0, -2);
    ctx.lineTo(0, 10);
    ctx.stroke();
    // Correntes.
    ctx.strokeStyle = hexToRgba(ink.bright, 0.5);
    ctx.lineWidth = 1.2;
    for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 14, -14);
        ctx.quadraticCurveTo(side * 24, 0, side * 16, 14);
        ctx.stroke();
        for (let i = 0; i < 3; i++) {
            const t = 0.25 + i * 0.25;
            const x = side * (14 * (1 - t) * (1 - t) + 24 * 2 * t * (1 - t) + 16 * t * t);
            const y = -14 * (1 - t) * (1 - t) + 14 * t * t;
            ctx.beginPath();
            ctx.ellipse(x, y, 2, 1.2, 0.4, 0, TAU);
            ctx.stroke();
        }
    }
    // Cabeça.
    ctx.fillStyle = shade(ctx, armor, ink.accent, -40, -16, 0.3);
    ctx.beginPath();
    ctx.ellipse(0, -30, 10, 11, 0, 0, TAU);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.6), 1.1);
    // Chifres.
    ctx.strokeStyle = ink.bright;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, -34);
    ctx.quadraticCurveTo(-24, -40, -21, -43);
    ctx.moveTo(8, -34);
    ctx.quadraticCurveTo(24, -40, 21, -43);
    ctx.stroke();
    // Olhos.
    eye(ctx, -4, -31, 2.4, 1.8, eyeColor, INK);
    eye(ctx, 4, -31, 2.4, 1.8, eyeColor, INK);
    // Sorriso.
    ctx.strokeStyle = eyeColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -24, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Coroa.
    ctx.fillStyle = ink.accent;
    poly(ctx, [
        [-9, -38],
        [-7, -43],
        [-3, -39],
        [0, -44],
        [3, -39],
        [7, -43],
        [9, -38],
    ]);
    ctx.fill();
    // Pulso do trono.
    ctx.globalAlpha = 0.15 + pulse * 0.15;
    ctx.strokeStyle = ink.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 34, 28, 4, 0, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
}
function drawMalakhim(ctx, ink, time, pulse) {
    const gold = mixColor('#8a7c4a', ink.accent, 0.4);
    const eyeColor = '#ff9b3c';
    glow(ctx, 0, 0, 46, ink.accent, 0.24);
    // Três pares de asas.
    for (const side of [-1, 1]) {
        for (let layer = 0; layer < 3; layer++) {
            const spread = 26 + layer * 6;
            const lift = -18 + layer * 7;
            ctx.fillStyle =
                layer === 0
                    ? hexToRgba(ink.deep, 0.92)
                    : hexToRgba(mixColor(gold, ink.deep, 0.35 + layer * 0.18), 0.88);
            ctx.beginPath();
            ctx.moveTo(side * 6, lift + 4);
            ctx.quadraticCurveTo(side * spread, lift - 16, side * (spread + 4), lift + 9);
            ctx.quadraticCurveTo(side * (spread - 6), lift + 3, side * (spread - 12), lift + 12);
            ctx.quadraticCurveTo(side * (spread - 16), lift + 5, side * 7, lift + 15);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = hexToRgba(ink.accent, 0.3);
            ctx.lineWidth = 0.9;
            ctx.stroke();
        }
    }
    // Corpo.
    ctx.fillStyle = shade(ctx, gold, ink.accent, -28, 30, 0.3);
    ctx.beginPath();
    ctx.ellipse(0, 4, 10, 25, 0, 0, TAU);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.55), 1.2);
    // Cabeça.
    ctx.fillStyle = shade(ctx, gold, ink.accent, -38, -20, 0.35);
    ctx.beginPath();
    ctx.arc(0, -27, 8, 0, TAU);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.65), 1.1);
    brokenHalo(ctx, -35, 9, ink.accent, 0.75);
    eye(ctx, -3, -28, 1.8, 1.3, eyeColor, INK);
    eye(ctx, 3, -28, 1.8, 1.3, eyeColor, INK);
    eye(ctx, 0, -23, 1.4, 1, eyeColor, INK);
    // Lança de luz.
    ctx.strokeStyle = hexToRgba(ink.bright, 0.8);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, -34);
    ctx.lineTo(-16, 32);
    ctx.stroke();
    ctx.fillStyle = ink.accent;
    poly(ctx, [
        [-16, -38],
        [-13, -32],
        [-19, -32],
    ]);
    ctx.fill();
    // Penas.
    for (let i = 0; i < 4; i++) {
        const y = -16 + i * 12 + Math.sin(time * 1.4 + i) * 3;
        feather(ctx, 22 - i * 4, y, 7, 0.5 - i * 0.25, ink.accent, 0.3);
    }
    // Pulso celestial.
    ctx.globalAlpha = 0.12 + pulse * 0.12;
    ctx.strokeStyle = ink.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -2, 40, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
}
function drawFerrato(ctx, ink, time, pulse) {
    glow(ctx, 0, 0, 48, ink.accent, 0.24);
    // Disco de acreção.
    ctx.save();
    ctx.rotate(time * 0.1);
    for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = hexToRgba(i === 1 ? ink.bright : ink.accent, 0.25 + i * 0.12);
        ctx.lineWidth = 1.5 - i * 0.3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 36 + i * 4, 12 + i * 2, 0.35, 0, TAU);
        ctx.stroke();
    }
    ctx.restore();
    // Horizonte de eventos.
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 30);
    g.addColorStop(0, '#000000');
    g.addColorStop(0.7, '#05030a');
    g.addColorStop(1, hexToRgba(ink.accent, 0.18));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, TAU);
    ctx.fill();
    rim(ctx, hexToRgba(ink.accent, 0.65), 1.4);
    // Olho do Véu.
    glow(ctx, 0, 0, 20, '#6ff2ff', 0.35 + pulse * 0.2);
    eye(ctx, 0, 0, 11, 8, '#6ff2ff', '#08050f');
    // Tentáculos de fome.
    for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU + time * 0.2;
        const x1 = Math.cos(a) * 26;
        const y1 = Math.sin(a) * 26;
        const x2 = Math.cos(a + 0.3) * 40;
        const y2 = Math.sin(a + 0.3) * 40;
        ctx.strokeStyle = hexToRgba(ink.accent, 0.45);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(Math.cos(a + 0.15) * 36, Math.sin(a + 0.15) * 36, x2, y2);
        ctx.stroke();
        ctx.fillStyle = hexToRgba(ink.bright, 0.5);
        poly(ctx, [
            [x2, y2 - 2],
            [x2 + 2, y2],
            [x2, y2 + 2],
            [x2 - 2, y2],
        ]);
        ctx.fill();
    }
    // Fragmentos devorados.
    for (let i = 0; i < 6; i++) {
        const a = -time * 0.3 + (i / 6) * TAU;
        const r = 32 + ((i * 7) % 6);
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r * 0.85;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);
        ctx.fillStyle = hexToRgba(ink.accent, 0.35);
        ctx.fillRect(-2.5, -1.5, 5, 3);
        ctx.restore();
    }
    // Pulso.
    ctx.globalAlpha = 0.1 + pulse * 0.12;
    ctx.strokeStyle = ink.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 43, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
}
function drawPlaceIcon(ctx, entry, time) {
    const ink = makeInk(entry.accent);
    const rnd = mulberry32((entry.stageId ?? 1) * 7919 + 17);
    glow(ctx, 0, 8, 44, ink.accent, 0.14);
    const sky = ctx.createLinearGradient(0, -44, 0, 42);
    sky.addColorStop(0, hexToRgba(ink.accent, 0.42));
    sky.addColorStop(0.5, hexToRgba(ink.accent, 0.1));
    sky.addColorStop(1, 'rgba(3,4,10,0.92)');
    ctx.fillStyle = sky;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, TAU);
    ctx.fill();
    switch (entry.arc) {
        case 2:
            drawMonumentsPlace(ctx, ink, time);
            break;
        case 3:
            drawStationPlace(ctx, ink, time);
            break;
        case 4:
            drawAbyssPlace(ctx, ink, time);
            break;
        case 5:
            drawEclesiaPlace(ctx, ink, time);
            break;
        case 6:
            drawNexusPlace(ctx, ink, time);
            break;
        default:
            drawCityPlace(ctx, ink, time, rnd);
            break;
    }
    const vignette = ctx.createRadialGradient(0, 0, 20, 0, 0, 44);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vignette;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, TAU);
    ctx.fill();
}
function drawCityPlace(ctx, ink, time, rnd) {
    // Lua partida.
    glow(ctx, 16, -20, 20, '#ffd9a0', 0.22);
    ctx.fillStyle = '#ffe9c4';
    ctx.beginPath();
    ctx.arc(16, -20, 9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(8,9,16,0.92)';
    ctx.beginPath();
    ctx.arc(20, -23, 8, 0, TAU);
    ctx.fill();
    // Skyline distante.
    ctx.fillStyle = hexToRgba(ink.deep, 0.7);
    for (let i = 0; i < 7; i++) {
        const w = 7 + rnd() * 5;
        const h = 8 + rnd() * 16;
        const x = -40 + i * 11;
        ctx.fillRect(x, 28 - h, w, h);
    }
    // Skyline próximo com janelas.
    for (let i = 0; i < 5; i++) {
        const w = 10 + rnd() * 6;
        const h = 14 + rnd() * 18;
        const x = -38 + i * 16;
        ctx.fillStyle = '#070810';
        ctx.fillRect(x, 32 - h, w, h);
        ctx.fillStyle = hexToRgba(ink.accent, 0.55);
        for (let k = 0; k < 3; k++) {
            if (rnd() > 0.35)
                ctx.fillRect(x + 2 + ((k * 5) % (w - 3)), 32 - h + 3 + k * 5, 1.5, 2);
        }
    }
    // Antenas e luzes.
    ctx.strokeStyle = hexToRgba(ink.accent, 0.35);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-22, 10);
    ctx.lineTo(-22, 2);
    ctx.moveTo(14, 12);
    ctx.lineTo(14, 4);
    ctx.stroke();
    ctx.fillStyle = ink.accent;
    ctx.globalAlpha = 0.5 + Math.sin(time * 3) * 0.3;
    ctx.beginPath();
    ctx.arc(-22, 2, 1.2, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(14, 4, 1.2, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Fumaça.
    ctx.strokeStyle = hexToRgba(ink.accent, 0.18);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 14);
    ctx.quadraticCurveTo(-14, 4, -6, -4);
    ctx.stroke();
    // Brasas.
    for (let i = 0; i < 10; i++) {
        const x = -34 + ((i * 37) % 68);
        const y = 24 - ((i * 23 + time * 12) % 54);
        ctx.fillStyle = hexToRgba(ink.accent, 0.3 + ((i * 7) % 5) * 0.08);
        ctx.beginPath();
        ctx.arc(x, y, 0.9 + (i % 2) * 0.5, 0, TAU);
        ctx.fill();
    }
}
function drawMonumentsPlace(ctx, ink, time) {
    // Sol baixo.
    glow(ctx, -10, -12, 22, '#ffd9a0', 0.24);
    ctx.fillStyle = '#ffe0a8';
    ctx.beginPath();
    ctx.arc(-10, -12, 9, 0, TAU);
    ctx.fill();
    // Horizonte.
    ctx.fillStyle = hexToRgba(ink.deep, 0.65);
    ctx.fillRect(-44, 24, 88, 20);
    // Torres gêmeas, cúpula e bowl.
    ctx.fillStyle = '#080810';
    ctx.fillRect(-24, 2, 5, 24);
    ctx.fillRect(19, 2, 5, 24);
    ctx.beginPath();
    ctx.arc(0, 26, 13, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-2, 24, 9, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    // Mastro e bandeira.
    ctx.strokeStyle = '#080810';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, 26);
    ctx.lineTo(30, -8);
    ctx.stroke();
    ctx.fillStyle = ink.accent;
    poly(ctx, [
        [30, -8],
        [38, -5],
        [30, -2],
    ]);
    ctx.fill();
    // Janelas e brilho da cúpula.
    ctx.fillStyle = hexToRgba(ink.accent, 0.5);
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(-23, 6 + i * 6, 3, 2);
        ctx.fillRect(20, 6 + i * 6, 3, 2);
    }
    glow(ctx, 0, 18, 12, ink.accent, 0.2);
    // Cinzas subindo.
    for (let i = 0; i < 12; i++) {
        const x = -36 + ((i * 41) % 72);
        const y = 26 - ((i * 17 + time * 8) % 50);
        ctx.fillStyle = `rgba(220,220,230,${0.2 + ((i * 5) % 4) * 0.06})`;
        ctx.beginPath();
        ctx.arc(x, y, 0.8 + (i % 2) * 0.5, 0, TAU);
        ctx.fill();
    }
}
function drawStationPlace(ctx, ink, time) {
    // Campo de estrelas.
    for (let i = 0; i < 22; i++) {
        const x = ((i * 37) % 80) - 40;
        const y = ((i * 23) % 56) - 32;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(time * 1.5 + i));
        ctx.fillStyle = `rgba(220,240,255,${0.2 + tw * 0.4})`;
        ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
    }
    // Limbo do planeta.
    ctx.fillStyle = '#070b16';
    ctx.beginPath();
    ctx.arc(0, 60, 52, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(ink.accent, 0.4);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 60, 52, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    glow(ctx, 0, 30, 30, ink.accent, 0.18);
    // Estação orbital.
    ctx.save();
    ctx.rotate(-0.3);
    ctx.strokeStyle = hexToRgba(ink.accent, 0.65);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 10, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(ink.accent, 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 13, 0, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU;
        const x = Math.cos(a) * 30;
        const y = Math.sin(a) * 10;
        ctx.fillStyle = hexToRgba(ink.accent, 0.25);
        ctx.fillRect(x - 4, y - 3, 8, 6);
        ctx.strokeStyle = hexToRgba(ink.accent, 0.5);
        ctx.lineWidth = 0.7;
        ctx.strokeRect(x - 4, y - 3, 8, 6);
    }
    ctx.restore();
    // Núcleo da estação.
    ctx.fillStyle = ink.deep;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(ink.accent, 0.7);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    glow(ctx, 0, 0, 9, ink.accent, 0.4);
    ctx.fillStyle = ink.accent;
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, TAU);
    ctx.fill();
    // Estrela cadente.
    ctx.strokeStyle = hexToRgba(ink.bright, 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-30, -26);
    ctx.lineTo(-20, -20);
    ctx.stroke();
}
function drawAbyssPlace(ctx, ink, time) {
    // Teto da caverna.
    ctx.fillStyle = '#07060c';
    poly(ctx, [
        [-44, -18],
        [-34, -30],
        [-26, -16],
        [-16, -34],
        [-6, -14],
        [4, -28],
        [14, -12],
        [26, -30],
        [36, -16],
        [44, -26],
        [44, -44],
        [-44, -44],
    ]);
    ctx.fill();
    // Chão irregular.
    poly(ctx, [
        [-44, 22],
        [-30, 14],
        [-20, 26],
        [-8, 16],
        [2, 28],
        [12, 18],
        [24, 30],
        [36, 20],
        [44, 26],
        [44, 44],
        [-44, 44],
    ]);
    ctx.fill();
    // Rio de magma.
    glow(ctx, 0, 22, 28, ink.accent, 0.35);
    const lava = () => {
        ctx.beginPath();
        ctx.moveTo(-36, 26);
        ctx.quadraticCurveTo(-18, 16, -2, 22);
        ctx.quadraticCurveTo(14, 28, 34, 18);
    };
    ctx.strokeStyle = ink.accent;
    ctx.lineWidth = 3;
    lava();
    ctx.stroke();
    ctx.strokeStyle = ink.bright;
    ctx.lineWidth = 1.2;
    lava();
    ctx.stroke();
    // Estalactites.
    ctx.fillStyle = '#07060c';
    for (let i = 0; i < 5; i++) {
        const x = -32 + i * 16;
        poly(ctx, [
            [x - 4, -20],
            [x, -10 - ((i * 7) % 8)],
            [x + 4, -20],
        ]);
        ctx.fill();
    }
    // Correntes penduradas.
    ctx.strokeStyle = hexToRgba(ink.accent, 0.3);
    ctx.lineWidth = 1;
    for (let i = 0; i < 2; i++) {
        const x = -20 + i * 40;
        ctx.beginPath();
        ctx.moveTo(x, -26);
        ctx.lineTo(x + 2, 0);
        ctx.stroke();
        for (let k = 0; k < 3; k++) {
            ctx.beginPath();
            ctx.ellipse(x + 2 * k * 0.4, -22 + k * 7, 1.5, 2.2, 0, 0, TAU);
            ctx.stroke();
        }
    }
    // Brasas.
    for (let i = 0; i < 10; i++) {
        const x = -34 + ((i * 43) % 68);
        const y = 26 - ((i * 19 + time * 10) % 44);
        ctx.fillStyle = hexToRgba(ink.accent, 0.35 + ((i * 7) % 4) * 0.08);
        ctx.beginPath();
        ctx.arc(x, y, 0.8 + (i % 2) * 0.6, 0, TAU);
        ctx.fill();
    }
}
function drawEclesiaPlace(ctx, ink, time) {
    // Raios de luz.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
        const a = -0.5 + i * 0.25;
        ctx.fillStyle = hexToRgba(ink.accent, 0.04);
        poly(ctx, [
            [0, -44],
            [Math.cos(a) * 44, 44],
            [Math.cos(a + 0.16) * 44, 44],
        ]);
        ctx.fill();
    }
    ctx.restore();
    // Catedral.
    ctx.fillStyle = '#08070c';
    poly(ctx, [
        [-10, 34],
        [-10, -4],
        [-4, -14],
        [0, -30],
        [4, -14],
        [10, -4],
        [10, 34],
    ]);
    ctx.fill();
    ctx.fillRect(-24, 0, 8, 34);
    ctx.fillRect(16, 0, 8, 34);
    poly(ctx, [
        [-24, 0],
        [-20, -16],
        [-16, 0],
    ]);
    ctx.fill();
    poly(ctx, [
        [16, 0],
        [20, -16],
        [24, 0],
    ]);
    ctx.fill();
    // Cruz.
    ctx.strokeStyle = '#08070c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(0, -40);
    ctx.moveTo(-3, -36);
    ctx.lineTo(3, -36);
    ctx.stroke();
    // Rosácea.
    glow(ctx, 0, 2, 12, ink.accent, 0.35);
    ctx.fillStyle = hexToRgba(ink.accent, 0.8);
    ctx.beginPath();
    ctx.arc(0, 2, 4.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(ink.bright, 0.6);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(0, 2, 6.5, 0, TAU);
    ctx.stroke();
    // Janelas das torres.
    ctx.fillStyle = hexToRgba(ink.accent, 0.5);
    ctx.fillRect(-22, 8, 4, 6);
    ctx.fillRect(18, 8, 4, 6);
    // Penas.
    for (let i = 0; i < 4; i++) {
        const y = -24 + i * 13 + Math.sin(time * 1.2 + i) * 3;
        feather(ctx, -28 + i * 18, y, 7, 0.4 - i * 0.2, ink.accent, 0.4);
    }
}
function drawNexusPlace(ctx, ink, time) {
    // Portal.
    ctx.save();
    ctx.rotate(time * 0.06);
    ctx.strokeStyle = hexToRgba(ink.accent, 0.55);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 30, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(ink.accent, 0.2);
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 24, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
    // Espiral de memórias.
    ctx.strokeStyle = hexToRgba(ink.bright, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 50; k++) {
        const a = k * 0.22 + time * 0.2;
        const r = 1 + k * 0.34;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r * 1.1;
        if (k === 0)
            ctx.moveTo(x, y);
        else
            ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Ilhas flutuantes.
    const islands = [
        [-30, -18, 10],
        [28, -24, 8],
        [-26, 24, 9],
        [30, 20, 11],
    ];
    for (const [x, y, s] of islands) {
        ctx.fillStyle = '#08070e';
        poly(ctx, [
            [x - s, y],
            [x + s * 0.7, y - s * 0.4],
            [x + s * 0.3, y + s * 0.7],
            [x - s * 0.6, y + s * 0.4],
        ]);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(ink.accent, 0.4);
        ctx.lineWidth = 0.8;
        ctx.stroke();
    }
    // Fios de memória.
    ctx.strokeStyle = hexToRgba(ink.accent, 0.25);
    ctx.lineWidth = 1;
    for (const [x, y] of islands) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x * 0.4, y * 0.2, 0, 0);
        ctx.stroke();
    }
    // Nós de memória.
    for (let i = 0; i < 7; i++) {
        const a = time * 0.3 + (i / 7) * TAU;
        const r = 12 + ((i * 11) % 20);
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r * 0.8;
        ctx.fillStyle = hexToRgba(ink.bright, 0.55);
        ctx.beginPath();
        ctx.arc(x, y, 1.3, 0, TAU);
        ctx.fill();
    }
    // Estrelas.
    for (let i = 0; i < 12; i++) {
        const x = ((i * 41) % 76) - 38;
        const y = ((i * 29) % 60) - 30;
        ctx.fillStyle = `rgba(230,220,255,${0.2 + ((i * 7) % 5) * 0.08})`;
        ctx.fillRect(x, y, 1, 1);
    }
}
function drawRelicIcon(ctx, entry, time) {
    const ink = makeInk(entry.accent);
    const pulse = 0.5 + Math.sin(time * 3.2) * 0.5;
    glow(ctx, 0, 0, 44, ink.accent, 0.18 + pulse * 0.06);
    if (entry.relicKind) {
        switch (entry.relicKind) {
            case 'fracture':
                drawFracture(ctx, ink, time);
                break;
            case 'sanctuary':
                drawSanctuary(ctx, ink, time);
                break;
            case 'anchor':
                drawAnchor(ctx, ink, time);
                break;
            case 'overcharge':
                drawOvercharge(ctx, ink, time);
                break;
        }
    }
    else if (entry.ambient) {
        switch (entry.ambient) {
            case 'embers':
                drawEmbersPhenomenon(ctx, ink, time);
                break;
            case 'ash':
                drawAshPhenomenon(ctx, ink, time);
                break;
            case 'stars':
                drawStarsPhenomenon(ctx, ink, time);
                break;
            case 'magma':
                drawMagmaPhenomenon(ctx, ink, time);
                break;
            case 'feathers':
                drawFeathersPhenomenon(ctx, ink, time);
                break;
            case 'cosmic':
                drawCosmicPhenomenon(ctx, ink, time);
                break;
        }
    }
    motes(ctx, ink.accent, time, 31 + entry.arc * 3, 5, 38, 0.3);
}
function drawFracture(ctx, ink, time) {
    // Chão.
    ctx.fillStyle = '#0a0810';
    ctx.beginPath();
    ctx.ellipse(0, 20, 34, 9, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(ink.accent, 0.3);
    ctx.lineWidth = 1;
    ctx.stroke();
    // Fissura.
    glow(ctx, 0, 18, 28, ink.accent, 0.35 + Math.sin(time * 2.5) * 0.1);
    const crack = () => {
        ctx.beginPath();
        ctx.moveTo(-30, 16);
        ctx.lineTo(-20, 20);
        ctx.lineTo(-12, 15);
        ctx.lineTo(-4, 22);
        ctx.lineTo(6, 15);
        ctx.lineTo(16, 21);
        ctx.lineTo(26, 16);
    };
    ctx.strokeStyle = ink.accent;
    ctx.lineWidth = 3.5;
    crack();
    ctx.stroke();
    ctx.strokeStyle = ink.bright;
    ctx.lineWidth = 1.2;
    crack();
    ctx.stroke();
    // Abertura de lava.
    ctx.fillStyle = hexToRgba(ink.accent, 0.18);
    ctx.beginPath();
    ctx.moveTo(-26, 18);
    ctx.quadraticCurveTo(0, 32, 26, 18);
    ctx.quadraticCurveTo(0, 24, -26, 18);
    ctx.fill();
    // Fragmentos suspensos.
    for (let i = 0; i < 6; i++) {
        const x = -24 + i * 9;
        const y = 6 - ((i * 13) % 18) + Math.sin(time * 2 + i) * 2;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(i * 0.7 + time * 0.3);
        ctx.fillStyle = hexToRgba(ink.accent, 0.35 + ((i * 3) % 4) * 0.08);
        poly(ctx, [
            [0, -4],
            [3, 0],
            [0, 4],
            [-3, 0],
        ]);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(ink.bright, 0.4);
        ctx.lineWidth = 0.7;
        ctx.stroke();
        ctx.restore();
    }
    // Anel de detritos.
    ctx.strokeStyle = hexToRgba(ink.accent, 0.25);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.ellipse(0, 20, 36, 11, 0, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
}
function drawSanctuary(ctx, ink, time) {
    runeRing(ctx, 34, ink.accent, time, 0.3, 8);
    const beat = 1 + Math.sin(time * 3) * 0.04;
    glow(ctx, 0, 0, 26, ink.accent, 0.3 + Math.sin(time * 3) * 0.06);
    ctx.save();
    ctx.scale(beat, beat);
    ctx.fillStyle = shade(ctx, '#5a1a2a', ink.accent, -20, 18, 0.3);
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.bezierCurveTo(-24, 0, -16, -20, 0, -8);
    ctx.bezierCurveTo(16, -20, 24, 0, 0, 16);
    ctx.fill();
    rim(ctx, hexToRgba(ink.bright, 0.6), 1.2);
    ctx.fillStyle = hexToRgba(ink.bright, 0.35);
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(-12, 0, -8, -10, 0, -3);
    ctx.bezierCurveTo(8, -10, 12, 0, 0, 10);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(ink.accent, 0.5);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-8, -2);
    ctx.lineTo(-4, 4);
    ctx.moveTo(8, -2);
    ctx.lineTo(4, 4);
    ctx.stroke();
    ctx.restore();
    // Partículas orbitando.
    for (let i = 0; i < 6; i++) {
        const a = time * 0.8 + (i / 6) * TAU;
        ctx.fillStyle = hexToRgba(ink.bright, 0.4);
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 38, Math.sin(a) * 30, 1, 0, TAU);
        ctx.fill();
    }
}
function drawAnchor(ctx, ink, time) {
    // Anéis gravitacionais.
    for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = hexToRgba(ink.accent, 0.3 - i * 0.05);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 36 - i * 5, 14 - i * 2, time * 0.2 + i * 0.4, 0, TAU);
        ctx.stroke();
    }
    // Linhas de atração.
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + time * 0.1;
        ctx.strokeStyle = hexToRgba(ink.accent, 0.25);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 34, Math.sin(a) * 13);
        ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 8);
        ctx.stroke();
    }
    // Fragmento central.
    glow(ctx, 0, 0, 20, ink.accent, 0.4);
    ctx.fillStyle = shade(ctx, '#3a2a5a', ink.accent, -24, 24, 0.35);
    poly(ctx, [
        [0, -26],
        [11, -4],
        [0, 26],
        [-11, -4],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.bright, 0.7), 1.3);
    ctx.strokeStyle = hexToRgba(ink.bright, 0.35);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(0, 26);
    ctx.moveTo(-11, -4);
    ctx.lineTo(11, -4);
    ctx.stroke();
    // Partículas puxadas.
    for (let i = 0; i < 6; i++) {
        const a = time * 1.2 + (i / 6) * TAU;
        const r = 30 - ((i * 5) % 12);
        ctx.fillStyle = hexToRgba(ink.accent, 0.5);
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r * 0.7, 1.2, 0, TAU);
        ctx.fill();
    }
}
function drawOvercharge(ctx, ink, time) {
    runeRing(ctx, 32, ink.accent, time, 0.28, 8);
    glow(ctx, 0, 0, 28, ink.accent, 0.35 + Math.sin(time * 4) * 0.1);
    ctx.strokeStyle = hexToRgba(ink.bright, 0.5);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, TAU);
    ctx.stroke();
    // Raio.
    ctx.fillStyle = shade(ctx, ink.accent, ink.bright, -28, 28, 0.3);
    poly(ctx, [
        [7, -30],
        [-12, 2],
        [-2, 2],
        [-8, 30],
        [14, -6],
        [2, -6],
    ]);
    ctx.fill();
    rim(ctx, hexToRgba(ink.bright, 0.8), 1.2);
    // Arcos elétricos.
    for (let i = 0; i < 4; i++) {
        const a = time * 1.5 + (i / 4) * TAU;
        const x1 = Math.cos(a) * 24;
        const y1 = Math.sin(a) * 24;
        ctx.strokeStyle = hexToRgba(ink.bright, 0.5);
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + Math.cos(a + 0.5) * 5, y1 + Math.sin(a + 0.5) * 5);
        ctx.lineTo(x1 + Math.cos(a - 0.3) * 8, y1 + Math.sin(a - 0.3) * 8);
        ctx.stroke();
    }
}
function drawEmbersPhenomenon(ctx, ink, time) {
    // Céu de fumaça.
    const sky = ctx.createLinearGradient(0, -44, 0, 26);
    sky.addColorStop(0, 'rgba(30,14,10,0.9)');
    sky.addColorStop(0.6, hexToRgba(ink.accent, 0.14));
    sky.addColorStop(1, 'rgba(8,4,6,0.95)');
    ctx.fillStyle = sky;
    ctx.fillRect(-44, -44, 88, 70);
    // Ruínas da cidade.
    ctx.fillStyle = '#070509';
    ctx.fillRect(-44, 22, 88, 22);
    const ruins = [
        [-38, 4, 13, 18],
        [-22, 12, 10, 10],
        [-8, -2, 9, 24],
        [3, 8, 14, 14],
        [20, -6, 11, 28],
        [33, 6, 10, 16],
    ];
    for (const [x, y, w, h] of ruins) {
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = hexToRgba(ink.accent, 0.3);
        for (let k = 0; k < 2; k++) {
            if ((x * 7 + k * 13) % 3 === 0)
                ctx.fillRect(x + 2 + k * 4, y + 4, 2, 2);
        }
        ctx.fillStyle = '#070509';
    }
    // Brilho do incêndio no horizonte.
    glow(ctx, 0, 26, 36, ink.accent, 0.4 + Math.sin(time * 2) * 0.06);
    ctx.fillStyle = hexToRgba(ink.accent, 0.35);
    ctx.beginPath();
    ctx.ellipse(0, 28, 30, 4, 0, 0, TAU);
    ctx.fill();
    // Brasas subindo.
    for (let i = 0; i < 18; i++) {
        const x = -40 + ((i * 37) % 80);
        const drift = Math.sin(time * 1.6 + i) * 3;
        const y = 26 - ((i * 17 + time * (9 + (i % 4) * 3)) % 62);
        const fade = 0.25 + ((i * 7) % 5) * 0.1;
        ctx.fillStyle = hexToRgba(i % 3 === 0 ? ink.bright : ink.accent, fade);
        ctx.beginPath();
        ctx.arc(x + drift, y, 0.8 + (i % 3) * 0.5, 0, TAU);
        ctx.fill();
    }
    // Fumaça.
    ctx.strokeStyle = 'rgba(120,110,120,0.16)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-10, 16);
    ctx.quadraticCurveTo(-18, 2, -8, -10);
    ctx.moveTo(14, 18);
    ctx.quadraticCurveTo(22, 4, 12, -8);
    ctx.stroke();
}
function drawAshPhenomenon(ctx, ink, time) {
    // Sol velado.
    glow(ctx, 4, -10, 30, '#e8dcc4', 0.22);
    ctx.fillStyle = 'rgba(232,220,196,0.55)';
    ctx.beginPath();
    ctx.arc(4, -10, 11, 0, TAU);
    ctx.fill();
    ctx.fillStyle = hexToRgba(ink.accent, 0.18);
    ctx.beginPath();
    ctx.arc(4, -10, 15, 0, TAU);
    ctx.fill();
    // Horizonte de escombros.
    ctx.fillStyle = '#0a0910';
    ctx.beginPath();
    ctx.moveTo(-44, 30);
    ctx.lineTo(-34, 20);
    ctx.lineTo(-24, 26);
    ctx.lineTo(-12, 14);
    ctx.lineTo(-2, 24);
    ctx.lineTo(10, 16);
    ctx.lineTo(22, 25);
    ctx.lineTo(34, 18);
    ctx.lineTo(44, 28);
    ctx.lineTo(44, 44);
    ctx.lineTo(-44, 44);
    ctx.closePath();
    ctx.fill();
    // Colunas quebradas.
    ctx.fillStyle = '#08070c';
    const columns = [
        [-28, 18, 14],
        [-6, 6, 20],
        [18, 14, 12],
    ];
    for (const [x, y, h] of columns) {
        ctx.fillRect(x - 3, y, 6, h);
        ctx.fillRect(x - 5, y - 2, 10, 3);
        ctx.fillStyle = 'rgba(180,178,190,0.16)';
        ctx.fillRect(x - 3, y, 2, h);
        ctx.fillStyle = '#08070c';
    }
    // Cinzas caindo.
    for (let i = 0; i < 22; i++) {
        const x = -42 + ((i * 31) % 84) + Math.sin(time * 0.9 + i) * 4;
        const y = -40 + ((i * 23 + time * (4 + (i % 3) * 2)) % 76);
        const a = 0.18 + ((i * 5) % 4) * 0.07;
        ctx.fillStyle = `rgba(214,210,220,${a})`;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(time * 0.5 + i);
        ctx.fillRect(-1.2, -0.7, 2.4, 1.4);
        ctx.restore();
    }
    // Névoa baixa.
    ctx.fillStyle = 'rgba(150,150,168,0.08)';
    ctx.beginPath();
    ctx.ellipse(0, 30, 42, 8, 0, 0, TAU);
    ctx.fill();
}
function drawStarsPhenomenon(ctx, ink, time) {
    // Nebulosa.
    const neb = ctx.createRadialGradient(-8, -6, 2, 0, 0, 46);
    neb.addColorStop(0, hexToRgba(ink.accent, 0.3));
    neb.addColorStop(0.5, hexToRgba(ink.accent, 0.1));
    neb.addColorStop(1, 'rgba(3,4,10,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(-44, -44, 88, 88);
    // Campo de estrelas.
    for (let i = 0; i < 42; i++) {
        const x = ((i * 37) % 84) - 42;
        const y = ((i * 53) % 84) - 42;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(time * (1.2 + (i % 4) * 0.4) + i));
        ctx.fillStyle = `rgba(226,236,255,${0.2 + tw * 0.55})`;
        const sz = i % 9 === 0 ? 2 : 1;
        ctx.fillRect(x, y, sz, sz);
    }
    // Constelação.
    const pts = [
        [-30, -22],
        [-18, -10],
        [-8, -18],
        [4, -4],
        [18, -12],
        [30, 4],
    ];
    ctx.strokeStyle = hexToRgba(ink.bright, 0.35);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i];
        if (i === 0)
            ctx.moveTo(x, y);
        else
            ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i];
        ctx.fillStyle = hexToRgba(i === 3 ? ink.bright : ink.accent, 0.75);
        ctx.beginPath();
        ctx.arc(x, y, i === 3 ? 1.8 : 1.2, 0, TAU);
        ctx.fill();
        if (i === 3)
            glow(ctx, x, y, 7, ink.bright, 0.35);
    }
    // Órbita.
    ctx.strokeStyle = hexToRgba(ink.accent, 0.22);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 14, -0.3, 0, TAU);
    ctx.stroke();
    // Estrela cadente.
    const t = (time * 0.35) % 1;
    const sx = 34 - t * 52;
    const sy = -32 + t * 24;
    ctx.strokeStyle = hexToRgba(ink.bright, 0.65 * (1 - t));
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 10, sy - 5);
    ctx.stroke();
}
function drawMagmaPhenomenon(ctx, ink, time) {
    // Teto da caverna.
    ctx.fillStyle = '#08050a';
    poly(ctx, [
        [-44, -44],
        [44, -44],
        [44, -20],
        [32, -28],
        [22, -16],
        [10, -26],
        [0, -14],
        [-12, -24],
        [-24, -14],
        [-34, -26],
        [-44, -18],
    ]);
    ctx.fill();
    // Chão.
    ctx.fillStyle = '#0a0509';
    ctx.beginPath();
    ctx.moveTo(-44, 20);
    ctx.quadraticCurveTo(-20, 12, 0, 18);
    ctx.quadraticCurveTo(22, 24, 44, 14);
    ctx.lineTo(44, 44);
    ctx.lineTo(-44, 44);
    ctx.closePath();
    ctx.fill();
    // Rio de lava.
    glow(ctx, 0, 26, 34, ink.accent, 0.45 + Math.sin(time * 2) * 0.08);
    const flow = (offset) => {
        ctx.beginPath();
        ctx.moveTo(-44, 30 + offset);
        ctx.quadraticCurveTo(-20, 20 + offset, 0, 26 + offset);
        ctx.quadraticCurveTo(22, 32 + offset, 44, 22 + offset);
    };
    ctx.strokeStyle = ink.accent;
    ctx.lineWidth = 5;
    flow(0);
    ctx.stroke();
    ctx.strokeStyle = ink.bright;
    ctx.lineWidth = 1.6;
    flow(0);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(ink.bright, 0.4);
    ctx.lineWidth = 0.9;
    flow(-2.4);
    ctx.stroke();
    // Fissuras no chão.
    ctx.strokeStyle = hexToRgba(ink.accent, 0.55);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-32, 16);
    ctx.lineTo(-26, 22);
    ctx.lineTo(-30, 28);
    ctx.moveTo(12, 14);
    ctx.lineTo(18, 20);
    ctx.lineTo(14, 26);
    ctx.stroke();
    // Erupção.
    const burst = 0.5 + Math.sin(time * 2.6) * 0.5;
    glow(ctx, 0, 8, 14 + burst * 6, ink.bright, 0.2 + burst * 0.2);
    for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i / 8 - 0.5) * 1.4;
        const d = 6 + ((i * 13 + time * 22) % 22);
        ctx.fillStyle = hexToRgba(i % 2 === 0 ? ink.bright : ink.accent, 0.5 - d / 70);
        ctx.beginPath();
        ctx.arc(Math.cos(a) * d, 18 + Math.sin(a) * d * 1.3, 1 + (i % 2) * 0.5, 0, TAU);
        ctx.fill();
    }
    // Estalactites.
    ctx.fillStyle = '#08050a';
    for (let i = 0; i < 5; i++) {
        const x = -32 + i * 16;
        poly(ctx, [
            [x - 4, -22],
            [x, -10 - ((i * 7) % 8)],
            [x + 4, -22],
        ]);
        ctx.fill();
    }
    // Brasas.
    for (let i = 0; i < 10; i++) {
        const x = -36 + ((i * 43) % 72);
        const y = 24 - ((i * 19 + time * 12) % 50);
        ctx.fillStyle = hexToRgba(ink.accent, 0.4 - ((i * 3) % 4) * 0.06);
        ctx.beginPath();
        ctx.arc(x, y, 0.9, 0, TAU);
        ctx.fill();
    }
}
function drawFeathersPhenomenon(ctx, ink, time) {
    // Feixe de luz.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = hexToRgba(ink.accent, 0.07);
    poly(ctx, [
        [-14, -44],
        [14, -44],
        [34, 44],
        [-4, 44],
    ]);
    ctx.fill();
    ctx.restore();
    // Halo partido.
    ctx.save();
    ctx.translate(0, -8);
    ctx.strokeStyle = hexToRgba(ink.accent, 0.65);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0.5, Math.PI * 1.55);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(ink.bright, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 29, Math.PI * 0.15, Math.PI * 0.8);
    ctx.stroke();
    ctx.restore();
    // Núcleo de luz.
    glow(ctx, 0, -4, 20, ink.bright, 0.3 + Math.sin(time * 1.8) * 0.06);
    ctx.fillStyle = hexToRgba(ink.bright, 0.6);
    ctx.beginPath();
    ctx.arc(0, -4, 2.6, 0, TAU);
    ctx.fill();
    // Penas caindo.
    for (let i = 0; i < 7; i++) {
        const x = -32 + ((i * 47) % 64) + Math.sin(time * 1.1 + i) * 4;
        const y = -30 + ((i * 29 + time * (6 + (i % 3) * 3)) % 68);
        const a = Math.sin(time * 1.4 + i) * 0.5 + (i % 2 === 0 ? 0.5 : -0.4);
        feather(ctx, x, y, 9 + (i % 3) * 2, a, i % 2 === 0 ? ink.accent : '#d8d2c0', 0.5);
    }
    // Poeira dourada.
    for (let i = 0; i < 10; i++) {
        const x = -30 + ((i * 31) % 60);
        const y = 30 - ((i * 17 + time * 5) % 60);
        ctx.fillStyle = hexToRgba(ink.bright, 0.22 + ((i * 7) % 4) * 0.06);
        ctx.beginPath();
        ctx.arc(x, y, 0.8, 0, TAU);
        ctx.fill();
    }
}
function drawCosmicPhenomenon(ctx, ink, time) {
    // Fundo profundo.
    const bg = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
    bg.addColorStop(0, hexToRgba(ink.accent, 0.3));
    bg.addColorStop(0.55, hexToRgba(ink.deep, 0.6));
    bg.addColorStop(1, 'rgba(2,3,8,0.95)');
    ctx.fillStyle = bg;
    ctx.fillRect(-44, -44, 88, 88);
    // Espiral galáctica.
    for (let arm = 0; arm < 2; arm++) {
        ctx.strokeStyle = hexToRgba(arm === 0 ? ink.accent : ink.bright, 0.4);
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let k = 0; k < 48; k++) {
            const a = k * 0.24 + time * 0.12 + arm * Math.PI;
            const r = 2 + k * 0.72;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r * 0.52;
            if (k === 0)
                ctx.moveTo(x, y);
            else
                ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.strokeStyle = hexToRgba(ink.bright, 0.2);
        ctx.lineWidth = 0.8;
        ctx.stroke();
    }
    // Estrelas da galáxia.
    for (let i = 0; i < 26; i++) {
        const a = i * 1.9 + time * 0.1;
        const r = 4 + ((i * 13) % 34);
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r * 0.52;
        ctx.fillStyle = `rgba(235,240,255,${0.25 + ((i * 5) % 4) * 0.1})`;
        ctx.fillRect(x, y, 1, 1);
    }
    // Olho do Véu.
    glow(ctx, 0, 0, 22, ink.bright, 0.3 + Math.sin(time * 2) * 0.08);
    ctx.fillStyle = 'rgba(4,5,12,0.92)';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(ink.bright, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, TAU);
    ctx.stroke();
    eye(ctx, 0, 0, 8, 4.4, ink.bright, '#08050f');
    // Raios.
    ctx.strokeStyle = hexToRgba(ink.accent, 0.25);
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + time * 0.08;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 16);
        ctx.lineTo(Math.cos(a) * 24, Math.sin(a) * 24);
        ctx.stroke();
    }
}
export function drawArchiveIcon(ctx, entry, x, y, size, time, locked) {
    const accent = locked ? '#8f96ad' : entry.accent;
    ctx.save();
    ctx.translate(x, y);
    medallion(ctx, size, accent, locked);
    // Conteúdo recortado no disco do medalhão.
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.44, 0, TAU);
    ctx.clip();
    const s = size / 100;
    ctx.scale(s, s);
    if (locked) {
        ctx.globalAlpha = 0.85;
        sealedSigil(ctx, time);
        ctx.globalAlpha = 1;
        motes(ctx, '#aeb6cc', time, 7, 4, 34, 0.16);
    }
    else {
        switch (entry.section) {
            case 'heroes':
                drawHeroIcon(ctx, entry, time);
                break;
            case 'creatures':
                drawCreatureIcon(ctx, entry, time);
                break;
            case 'bosses':
                drawBossIcon(ctx, entry, time);
                break;
            case 'places':
                drawPlaceIcon(ctx, entry, time);
                break;
            case 'relics':
                drawRelicIcon(ctx, entry, time);
                break;
        }
    }
    ctx.restore();
    frame(ctx, size, accent, !locked);
    if (locked)
        lockSeal(ctx, size, '#c8ccdc');
    ctx.restore();
}
//# sourceMappingURL=archive.js.map