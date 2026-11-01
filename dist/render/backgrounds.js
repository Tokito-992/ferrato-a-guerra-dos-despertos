/**
 * Cenários procedurais com parallax para as seis fases e para o menu.
 * Nenhuma imagem externa é usada: tudo é desenhado no Canvas.
 */
import { clamp, hexToRgba, TAU } from '../core/math.js?v=c5d0d69737a2';
import { roundRectPath } from './theme.js?v=c5d0d69737a2';
const W = 1280;
const H = 720;
/** Ruído determinístico para que o cenário não "trema" entre frames. */
function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}
function wrap(value, span, margin) {
    return (((value % span) + span) % span) - margin;
}
function layerX(i, spacing, count, cameraX, parallax, margin = 280) {
    return wrap(i * spacing - cameraX * parallax, spacing * count, margin);
}
function fog(ctx, color, y, h, strength = 1) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.55, hexToRgba('#ffffff', 0));
    g.addColorStop(1, color);
    ctx.save();
    ctx.globalAlpha = strength;
    ctx.fillStyle = g;
    ctx.fillRect(0, y, W, h);
    ctx.restore();
}
function drawSky(ctx, stage, cameraX, time) {
    const p = stage.palette;
    const g = ctx.createLinearGradient(0, 0, 0, stage.floor);
    g.addColorStop(0, p.skyTop);
    g.addColorStop(0.62, p.skyBottom);
    g.addColorStop(1, p.mid);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, stage.floor + 2);
    // Sol / lua / núcleo distante.
    if (stage.ambient !== 'cosmic') {
        const sunX = W * 0.72 - cameraX * 0.025;
        const sunY = stage.arc === 4 ? 380 : stage.arc === 3 ? 200 : 190 + Math.sin(stage.arc) * 30;
        const radius = stage.arc === 5 ? 120 : stage.arc === 3 ? 90 : 150;
        const glowG = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, radius * 2.4);
        glowG.addColorStop(0, hexToRgba(p.sun, 0.85));
        glowG.addColorStop(0.25, hexToRgba(p.sun, 0.3));
        glowG.addColorStop(1, hexToRgba(p.sun, 0));
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = glowG;
        ctx.beginPath();
        ctx.arc(sunX, sunY, radius * 2.4, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = p.sun;
        ctx.beginPath();
        ctx.arc(sunX, sunY, radius * 0.45, 0, TAU);
        ctx.fill();
        ctx.restore();
    }
    // Estrelas / brasas no céu.
    if (stage.ambient === 'stars' || stage.ambient === 'cosmic') {
        for (let i = 0; i < 140; i++) {
            const sx = hash(i * 3 + stage.id) * W;
            const sy = hash(i * 7 + stage.id * 2) * stage.floor * 0.95;
            const tw = 0.35 + Math.sin(time * (0.5 + hash(i) * 1.8) + i) * 0.3;
            ctx.fillStyle = hexToRgba(i % 5 === 0 ? p.accent : '#ffffff', clamp(tw, 0.05, 0.9));
            ctx.fillRect(sx, sy, i % 9 === 0 ? 2 : 1, i % 9 === 0 ? 2 : 1);
        }
    }
}
// ------------------------------------------------------------------ fase 1
function cityFar(ctx, stage, cameraX) {
    const p = stage.palette;
    for (let i = 0; i < 11; i++) {
        const x = layerX(i, 230, 11, cameraX, 0.1, 220);
        const h = 120 + hash(i + 1) * 210;
        const buildW = 120 + hash(i + 4) * 110;
        ctx.fillStyle = p.far;
        ctx.beginPath();
        ctx.moveTo(x, stage.floor);
        ctx.lineTo(x, stage.floor - h);
        ctx.lineTo(x + buildW * 0.18, stage.floor - h - 18 * hash(i + 7));
        ctx.lineTo(x + buildW * 0.32, stage.floor - h);
        ctx.lineTo(x + buildW, stage.floor - h + 16);
        ctx.lineTo(x + buildW, stage.floor);
        ctx.closePath();
        ctx.fill();
        // Janelas acesas.
        for (let j = 0; j < 5; j++) {
            if (hash(i * 9 + j) < 0.55)
                continue;
            ctx.fillStyle = hexToRgba(p.accent2, 0.22 + hash(j + i) * 0.3);
            ctx.fillRect(x + 20 + (j % 2) * 38, stage.floor - h + 26 + Math.floor(j / 2) * 30, 14, 12);
        }
        // Antena.
        if (i % 3 === 0) {
            ctx.strokeStyle = hexToRgba(p.far, 0.9);
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + buildW * 0.5, stage.floor - h);
            ctx.lineTo(x + buildW * 0.5, stage.floor - h - 48);
            ctx.stroke();
            ctx.fillStyle = hexToRgba(p.accent, 0.8);
            ctx.beginPath();
            ctx.arc(x + buildW * 0.5, stage.floor - h - 50, 3, 0, TAU);
            ctx.fill();
        }
    }
}
function cityMid(ctx, stage, cameraX) {
    const p = stage.palette;
    for (let i = 0; i < 8; i++) {
        const x = layerX(i, 320, 8, cameraX, 0.26, 260);
        const h = 180 + hash(i + 11) * 190;
        const bw = 190 + hash(i + 3) * 120;
        ctx.fillStyle = p.mid;
        ctx.fillRect(x, stage.floor - h, bw, h);
        // Faixas de concreto quebradas.
        ctx.fillStyle = hexToRgba('#000000', 0.28);
        for (let j = 1; j < 4; j++) {
            ctx.fillRect(x, stage.floor - h + j * (h / 4), bw, 3);
        }
        // Janelas escuras.
        for (let j = 0; j < 12; j++) {
            const wx = x + 18 + (j % 4) * ((bw - 36) / 4);
            const wy = stage.floor - h + 22 + Math.floor(j / 4) * 34;
            ctx.fillStyle = hexToRgba(p.accent, hash(i * 13 + j) > 0.7 ? 0.3 : 0.06);
            ctx.fillRect(wx, wy, 24, 20);
        }
        // Teto irregular.
        ctx.fillStyle = p.near;
        ctx.beginPath();
        ctx.moveTo(x, stage.floor - h);
        ctx.lineTo(x + bw * 0.35, stage.floor - h - 22);
        ctx.lineTo(x + bw * 0.55, stage.floor - h + 2);
        ctx.lineTo(x + bw * 0.72, stage.floor - h - 14);
        ctx.lineTo(x + bw, stage.floor - h + 8);
        ctx.lineTo(x + bw, stage.floor - h + 28);
        ctx.lineTo(x, stage.floor - h + 24);
        ctx.closePath();
        ctx.fill();
    }
    // Postes inclinados.
    for (let i = 0; i < 4; i++) {
        const x = layerX(i, 640, 4, cameraX, 0.42, 180);
        const y = stage.floor;
        ctx.strokeStyle = hexToRgba('#0c0910', 0.9);
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 18, y - 230);
        ctx.stroke();
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + 18, y - 210);
        ctx.lineTo(x - 40, y - 220);
        ctx.moveTo(x + 18, y - 190);
        ctx.lineTo(x + 58, y - 205);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - 40, y - 220);
        ctx.quadraticCurveTo(x + 200, y - 150, x + 300, y - 210);
        ctx.stroke();
    }
}
function cityGround(ctx, stage, cameraX, time) {
    const p = stage.palette;
    // Entulho e carros.
    for (let i = 0; i < 10; i++) {
        const x = layerX(i, 300, 10, cameraX, 0.62, 240);
        const h = 18 + hash(i + 5) * 46;
        ctx.fillStyle = p.groundDark;
        ctx.beginPath();
        ctx.moveTo(x, stage.floor + 4);
        ctx.lineTo(x + 30, stage.floor - h);
        ctx.lineTo(x + 70, stage.floor - h * 0.5);
        ctx.lineTo(x + 120, stage.floor + 4);
        ctx.closePath();
        ctx.fill();
        if (i % 4 === 0) {
            // Fogo baixo.
            const fx = x + 60;
            const flick = 0.7 + Math.sin(time * 9 + i) * 0.25;
            const fg = ctx.createRadialGradient(fx, stage.floor - 10, 2, fx, stage.floor - 10, 52 * flick);
            fg.addColorStop(0, hexToRgba('#ffd08a', 0.8));
            fg.addColorStop(0.4, hexToRgba(p.accent, 0.4));
            fg.addColorStop(1, hexToRgba(p.accent, 0));
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = fg;
            ctx.beginPath();
            ctx.arc(fx, stage.floor - 10, 52 * flick, 0, TAU);
            ctx.fill();
            ctx.restore();
        }
    }
}
// ------------------------------------------------------------------ fase 2
function ruinsFar(ctx, stage, cameraX) {
    const p = stage.palette;
    // Cúpula ao fundo (Brasília).
    const dx = 500 - cameraX * 0.08;
    ctx.fillStyle = p.far;
    ctx.beginPath();
    ctx.arc(dx, stage.floor - 180, 170, Math.PI, TAU);
    ctx.lineTo(dx + 170, stage.floor);
    ctx.lineTo(dx - 170, stage.floor);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hexToRgba('#000000', 0.35);
    ctx.lineWidth = 6;
    for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(dx + i * 44, stage.floor - 180 - Math.sqrt(Math.max(0, 170 * 170 - (i * 44) ** 2)));
        ctx.lineTo(dx + i * 52, stage.floor);
        ctx.stroke();
    }
    // Colunas do Congresso.
    for (let i = 0; i < 7; i++) {
        const x = 760 + i * 54 - cameraX * 0.08;
        const h = 150 + hash(i) * 30;
        ctx.fillStyle = p.far;
        ctx.fillRect(x, stage.floor - h, 22, h);
        ctx.beginPath();
        ctx.arc(x + 11, stage.floor - h, 22, 0, TAU);
        ctx.fill();
    }
    // Prédios laterais.
    for (let i = 0; i < 9; i++) {
        const x = layerX(i, 310, 9, cameraX, 0.12, 240);
        const h = 100 + hash(i + 9) * 220;
        ctx.fillStyle = hexToRgba(p.far, 0.85);
        ctx.fillRect(x, stage.floor - h, 150 + hash(i) * 100, h);
    }
    // Fumaça no horizonte.
    for (let i = 0; i < 6; i++) {
        const x = layerX(i, 460, 6, cameraX, 0.06, 240);
        const g = ctx.createRadialGradient(x, stage.floor - 120, 10, x, stage.floor - 120, 140);
        g.addColorStop(0, hexToRgba('#0d0908', 0.4));
        g.addColorStop(1, hexToRgba('#0d0908', 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, stage.floor - 120, 140, 0, TAU);
        ctx.fill();
    }
}
function ruinsMid(ctx, stage, cameraX) {
    const p = stage.palette;
    for (let i = 0; i < 8; i++) {
        const x = layerX(i, 350, 8, cameraX, 0.28, 280);
        const h = 140 + hash(i + 4) * 160;
        ctx.fillStyle = p.mid;
        ctx.fillRect(x, stage.floor - h, 200, h);
        // Laje caída.
        ctx.save();
        ctx.translate(x + 40, stage.floor - h * 0.55);
        ctx.rotate(-0.18 + hash(i) * 0.3);
        ctx.fillStyle = hexToRgba(p.ground, 0.85);
        ctx.fillRect(0, 0, 130, 26);
        ctx.restore();
        // Vergalhões.
        ctx.strokeStyle = hexToRgba('#0e0b0a', 0.85);
        ctx.lineWidth = 2;
        for (let j = 0; j < 5; j++) {
            ctx.beginPath();
            ctx.moveTo(x + 20 + j * 34, stage.floor - h);
            ctx.lineTo(x + 10 + j * 40, stage.floor - h - 25 - hash(i + j) * 20);
            ctx.stroke();
        }
    }
    // Barricadas.
    for (let i = 0; i < 6; i++) {
        const x = layerX(i, 420, 6, cameraX, 0.5, 220);
        ctx.fillStyle = hexToRgba('#2e2822', 0.9);
        ctx.fillRect(x, stage.floor - 36, 100, 36);
        ctx.fillStyle = hexToRgba('#b2a07c', 0.4);
        for (let j = 0; j < 4; j++) {
            ctx.save();
            ctx.translate(x + 8 + j * 24, stage.floor - 34);
            ctx.rotate(-0.2);
            ctx.fillRect(0, 0, 12, 28);
            ctx.restore();
        }
    }
}
function ruinsGround(ctx, stage, cameraX, time) {
    const p = stage.palette;
    for (let i = 0; i < 12; i++) {
        const x = layerX(i, 240, 12, cameraX, 0.65, 220);
        const h = 10 + hash(i) * 34;
        ctx.fillStyle = hexToRgba(p.groundDark, 0.9);
        ctx.beginPath();
        ctx.moveTo(x, stage.floor + 4);
        ctx.lineTo(x + 24, stage.floor - h);
        ctx.lineTo(x + 52, stage.floor - h * 0.4);
        ctx.lineTo(x + 80, stage.floor + 4);
        ctx.closePath();
        ctx.fill();
        if (i % 5 === 0) {
            const fg = ctx.createRadialGradient(x + 40, stage.floor - 8, 2, x + 40, stage.floor - 8, 40);
            fg.addColorStop(0, hexToRgba(p.accent, 0.5 + Math.sin(time * 7 + i) * 0.1));
            fg.addColorStop(1, hexToRgba(p.accent, 0));
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = fg;
            ctx.beginPath();
            ctx.arc(x + 40, stage.floor - 8, 40, 0, TAU);
            ctx.fill();
            ctx.restore();
        }
    }
}
// ------------------------------------------------------------------ fase 3
function spaceFar(ctx, stage, cameraX) {
    const p = stage.palette;
    const px = 980 - cameraX * 0.04;
    const py = 220;
    // Planeta.
    const pg = ctx.createRadialGradient(px - 40, py - 50, 20, px, py, 170);
    pg.addColorStop(0, '#335f7c');
    pg.addColorStop(0.55, '#152c44');
    pg.addColorStop(1, '#070d16');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(px, py, 160, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-0.28);
    ctx.strokeStyle = hexToRgba(p.accent, 0.25);
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.ellipse(0, 0, 240, 54, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(p.accent2, 0.18);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 275, 66, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
    // Nebulosa.
    const ng = ctx.createRadialGradient(350 - cameraX * 0.02, 250, 40, 350 - cameraX * 0.02, 250, 360);
    ng.addColorStop(0, hexToRgba(p.accent2, 0.11));
    ng.addColorStop(0.5, hexToRgba(p.accent, 0.05));
    ng.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ng;
    ctx.fillRect(0, 0, W, stage.floor);
}
function spaceMid(ctx, stage, cameraX) {
    const p = stage.palette;
    // Estrutura da estação SOLACE.
    for (let i = 0; i < 6; i++) {
        const x = layerX(i, 520, 6, cameraX, 0.24, 320);
        const y = 140 + hash(i + 2) * 120;
        ctx.strokeStyle = hexToRgba(p.far, 0.95);
        ctx.lineWidth = 16;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 340, y + 30);
        ctx.stroke();
        ctx.strokeStyle = hexToRgba(p.mid, 0.95);
        ctx.lineWidth = 6;
        for (let j = 0; j < 5; j++) {
            ctx.beginPath();
            ctx.moveTo(x + 30 + j * 64, y + 4 + j * 5);
            ctx.lineTo(x + 30 + j * 64, y + 76 + j * 5);
            ctx.stroke();
        }
        // Painéis solares.
        ctx.fillStyle = hexToRgba(p.far, 0.8);
        ctx.strokeStyle = hexToRgba(p.accent, 0.3);
        ctx.lineWidth = 1;
        for (let j = 0; j < 3; j++) {
            ctx.save();
            ctx.translate(x + 80 + j * 88, y + 12);
            ctx.rotate(0.09);
            ctx.fillRect(0, 0, 64, 34);
            ctx.strokeRect(0, 0, 64, 34);
            ctx.restore();
        }
    }
    // Detritos flutuantes.
    for (let i = 0; i < 16; i++) {
        const x = layerX(i, 230, 16, cameraX, 0.35, 200);
        const y = 120 + hash(i + 8) * 380;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(hash(i) * TAU);
        ctx.fillStyle = hexToRgba(p.far, 0.6);
        ctx.fillRect(-8, -5, 16 + hash(i) * 18, 10 + hash(i + 1) * 8);
        ctx.restore();
    }
}
function spaceGround(ctx, stage, cameraX, time) {
    const p = stage.palette;
    // Painéis metálicos.
    const offset = (cameraX * 0.6) % 160;
    ctx.strokeStyle = hexToRgba(p.accent, 0.08);
    ctx.lineWidth = 1;
    for (let i = -1; i < 10; i++) {
        const x = i * 160 - offset;
        ctx.beginPath();
        ctx.moveTo(x, stage.floor);
        ctx.lineTo(x - 70, H);
        ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = hexToRgba('#000000', 0.35);
        ctx.beginPath();
        ctx.moveTo(0, stage.floor + 24 + i * 36);
        ctx.lineTo(W, stage.floor + 24 + i * 36);
        ctx.stroke();
    }
    // Luzes de pista.
    for (let i = 0; i < 8; i++) {
        const x = layerX(i, 240, 8, cameraX, 0.7, 180);
        const pulse = 0.3 + Math.sin(time * 3 + i) * 0.2;
        ctx.fillStyle = hexToRgba(p.accent, pulse);
        ctx.fillRect(x, stage.floor + 6, 34, 3);
    }
}
// ------------------------------------------------------------------ fase 4
function hellFar(ctx, stage, cameraX) {
    const p = stage.palette;
    // Espinhos do teto.
    ctx.fillStyle = p.far;
    for (let i = 0; i < 14; i++) {
        const x = layerX(i, 180, 14, cameraX, 0.08, 180);
        const h = 90 + hash(i) * 170;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 46, 0);
        ctx.lineTo(x + 20, h);
        ctx.closePath();
        ctx.fill();
    }
    // Arcos do abismo.
    for (let i = 0; i < 7; i++) {
        const x = layerX(i, 380, 7, cameraX, 0.16, 300);
        ctx.strokeStyle = hexToRgba(p.far, 0.9);
        ctx.lineWidth = 46;
        ctx.beginPath();
        ctx.arc(x + 170, stage.floor, 170, Math.PI, TAU);
        ctx.stroke();
        ctx.strokeStyle = hexToRgba('#000000', 0.25);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x + 170, stage.floor, 194, Math.PI, TAU);
        ctx.stroke();
    }
    // Rios de lava ao fundo.
    const lg = ctx.createLinearGradient(0, stage.floor - 120, 0, stage.floor);
    lg.addColorStop(0, hexToRgba(p.accent, 0));
    lg.addColorStop(1, hexToRgba(p.accent2, 0.25));
    ctx.fillStyle = lg;
    ctx.fillRect(0, stage.floor - 120, W, 120);
}
function hellMid(ctx, stage, cameraX, time) {
    const p = stage.palette;
    for (let i = 0; i < 9; i++) {
        const x = layerX(i, 300, 9, cameraX, 0.3, 240);
        const h = 160 + hash(i + 3) * 230;
        // Estalagmites / torres.
        ctx.fillStyle = p.mid;
        ctx.beginPath();
        ctx.moveTo(x, stage.floor + 4);
        ctx.lineTo(x + 26, stage.floor - h);
        ctx.lineTo(x + 58, stage.floor - h * 0.55);
        ctx.lineTo(x + 90, stage.floor - h * 0.85);
        ctx.lineTo(x + 120, stage.floor + 4);
        ctx.closePath();
        ctx.fill();
        // Rachaduras incandescentes.
        ctx.strokeStyle = hexToRgba(p.accent, 0.35 + Math.sin(time * 2 + i) * 0.08);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 36, stage.floor - 10);
        ctx.lineTo(x + 48, stage.floor - h * 0.4);
        ctx.lineTo(x + 42, stage.floor - h * 0.6);
        ctx.stroke();
    }
    // Correntes penduradas.
    for (let i = 0; i < 6; i++) {
        const x = layerX(i, 340, 6, cameraX, 0.42, 220);
        const len = 120 + hash(i + 6) * 160;
        ctx.strokeStyle = hexToRgba('#170a0d', 0.95);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + Math.sin(time * 0.7 + i) * 10, len);
        ctx.stroke();
        for (let j = 0; j < Math.floor(len / 28); j++) {
            ctx.strokeStyle = hexToRgba('#2c1418', 0.9);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(x + Math.sin(time * 0.7 + i) * 10, 18 + j * 28, 5, 9, 0, 0, TAU);
            ctx.stroke();
        }
    }
}
function hellGround(ctx, stage, cameraX, time) {
    const p = stage.palette;
    // Fendas de lava.
    for (let i = 0; i < 8; i++) {
        const x = layerX(i, 340, 8, cameraX, 0.7, 220);
        const y = stage.floor + 30 + hash(i) * 60;
        const glowG = ctx.createLinearGradient(x - 60, y, x + 60, y);
        glowG.addColorStop(0, hexToRgba(p.accent, 0));
        glowG.addColorStop(0.5, hexToRgba(p.accent, 0.5 + Math.sin(time * 3 + i) * 0.1));
        glowG.addColorStop(1, hexToRgba(p.accent, 0));
        ctx.fillStyle = glowG;
        ctx.fillRect(x - 60, y, 120, 4);
        ctx.strokeStyle = hexToRgba('#ffb36b', 0.35);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 40, y);
        ctx.lineTo(x - 10, y + 6);
        ctx.lineTo(x + 20, y - 4);
        ctx.lineTo(x + 46, y + 4);
        ctx.stroke();
    }
    // Ossos e pedras.
    for (let i = 0; i < 10; i++) {
        const x = layerX(i, 250, 10, cameraX, 0.8, 200);
        ctx.fillStyle = hexToRgba('#160a0e', 0.9);
        ctx.beginPath();
        ctx.arc(x, stage.floor + 22, 12 + hash(i) * 18, Math.PI, TAU);
        ctx.fill();
    }
}
// ------------------------------------------------------------------ fase 5
function heavenFar(ctx, stage, cameraX, time) {
    const p = stage.palette;
    // Ilhas flutuantes.
    for (let i = 0; i < 7; i++) {
        const x = layerX(i, 340, 7, cameraX, 0.09, 260);
        const y = 120 + hash(i + 2) * 160 + Math.sin(time * 0.3 + i) * 6;
        const w = 120 + hash(i) * 120;
        ctx.fillStyle = hexToRgba(p.far, 0.8);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + w / 2, y - 36, x + w, y);
        ctx.lineTo(x + w * 0.7, y + 38);
        ctx.lineTo(x + w * 0.34, y + 70);
        ctx.lineTo(x + w * 0.12, y + 32);
        ctx.closePath();
        ctx.fill();
        // Templo minúsculo.
        ctx.fillStyle = hexToRgba(p.near, 0.8);
        ctx.fillRect(x + w * 0.4, y - 44, 8, 44);
        ctx.fillRect(x + w * 0.6, y - 38, 6, 38);
        ctx.fillRect(x + w * 0.35, y - 52, w * 0.3, 8);
    }
    // Raios de luz.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
        const x = i * 210 - cameraX * 0.05;
        const g = ctx.createLinearGradient(x, 0, x + 120, stage.floor);
        g.addColorStop(0, hexToRgba(p.sun, 0.08));
        g.addColorStop(1, hexToRgba(p.sun, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 80, 0);
        ctx.lineTo(x + 240, stage.floor);
        ctx.lineTo(x + 130, stage.floor);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}
function heavenMid(ctx, stage, cameraX, time) {
    const p = stage.palette;
    const ch = stage.chapter;
    if (ch === 4) {
        // Sala do órgão: colunas e tubos substituem as arcadas do claustro.
        for (let i = 0; i < 6; i++) {
            const x = layerX(i, 380, 6, cameraX, 0.24, 260);
            ctx.fillStyle = hexToRgba(p.mid, 0.95);
            ctx.fillRect(x, stage.floor - 300, 50, 300);
            ctx.fillRect(x - 10, stage.floor - 312, 70, 14);
            for (let j = 0; j < 4; j++) {
                const w = 14 + (j % 2) * 8;
                const h = 160 + hash(i * 7 + j) * 150;
                ctx.fillStyle = hexToRgba(j % 2 ? p.accent : p.accent2, 0.11);
                ctx.strokeStyle = hexToRgba(p.mid, 0.8);
                ctx.lineWidth = 2;
                ctx.beginPath();
                roundRectPath(ctx, x - 20 + j * 20, stage.floor - 30 - h, w, h, w * 0.5);
                ctx.fill();
                ctx.stroke();
            }
            ctx.fillStyle = hexToRgba(p.accent, 0.12 + Math.sin(time * 0.8 + i) * 0.03);
            ctx.fillRect(x + 8, stage.floor - 270, 34, 90);
        }
        return;
    }
    if (ch === 5) {
        // Escadaria de Malakhim: colunas altas e arcos em ponta.
        for (let i = 0; i < 6; i++) {
            const x = layerX(i, 360, 6, cameraX, 0.26, 240);
            ctx.fillStyle = hexToRgba(p.mid, 0.9);
            ctx.fillRect(x, stage.floor - 430, 58, 430);
            ctx.fillRect(x + 210, stage.floor - 430, 58, 430);
            ctx.strokeStyle = hexToRgba(p.accent, 0.2);
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + 58, stage.floor - 360);
            ctx.quadraticCurveTo(x + 134, stage.floor - 470, x + 210, stage.floor - 360);
            ctx.stroke();
            ctx.strokeStyle = hexToRgba(p.accent, 0.1);
            ctx.lineWidth = 1;
            for (let j = 0; j < 4; j++) {
                ctx.beginPath();
                ctx.moveTo(x + 30 + j * 18, stage.floor - 420 + j * 18);
                ctx.lineTo(x + 30 + j * 18, stage.floor);
                ctx.stroke();
            }
        }
        return;
    }
    if (ch === 6) {
        // Eclésia rompida: colunas quebradas e arcos suspensos.
        for (let i = 0; i < 6; i++) {
            const x = layerX(i, 420, 6, cameraX, 0.22, 300);
            const h = 220 + hash(i + stage.id) * 150;
            ctx.fillStyle = hexToRgba(p.mid, 0.9);
            ctx.beginPath();
            ctx.moveTo(x, stage.floor);
            ctx.lineTo(x, stage.floor - h);
            ctx.lineTo(x + 16, stage.floor - h - 18);
            ctx.lineTo(x + 32, stage.floor - h + 8);
            ctx.lineTo(x + 48, stage.floor - h - 30);
            ctx.lineTo(x + 48, stage.floor);
            ctx.closePath();
            ctx.fill();
            if (i % 2 === 0) {
                ctx.strokeStyle = hexToRgba(p.accent, 0.16);
                ctx.lineWidth = 18;
                ctx.beginPath();
                ctx.arc(x + 140, stage.floor - 330, 92, Math.PI * 1.05, Math.PI * 1.6);
                ctx.stroke();
            }
        }
        return;
    }
    // Arcadas da Eclésia.
    for (let i = 0; i < 7; i++) {
        const x = layerX(i, 420, 7, cameraX, 0.26, 320);
        ctx.fillStyle = hexToRgba(p.mid, 0.95);
        ctx.fillRect(x, stage.floor - 360, 44, 360);
        ctx.fillRect(x + 210, stage.floor - 330, 40, 330);
        ctx.beginPath();
        ctx.arc(x + 127, stage.floor - 330, 127, Math.PI, TAU);
        ctx.lineWidth = 34;
        ctx.strokeStyle = hexToRgba(p.mid, 0.95);
        ctx.stroke();
        // Vitral quebrado.
        ctx.fillStyle = hexToRgba(p.accent, 0.1 + Math.sin(time * 1.2 + i) * 0.03);
        ctx.beginPath();
        ctx.moveTo(x + 74, stage.floor - 300);
        ctx.lineTo(x + 180, stage.floor - 300);
        ctx.lineTo(x + 180, stage.floor - 190);
        ctx.lineTo(x + 120, stage.floor - 210);
        ctx.lineTo(x + 74, stage.floor - 170);
        ctx.closePath();
        ctx.fill();
    }
}
function heavenGround(ctx, stage, cameraX) {
    const p = stage.palette;
    // Balaustrada.
    for (let i = 0; i < 12; i++) {
        const x = layerX(i, 150, 12, cameraX, 0.7, 160);
        ctx.fillStyle = hexToRgba(p.ground, 0.85);
        ctx.fillRect(x, stage.floor + 4, 22, 34);
        ctx.beginPath();
        ctx.arc(x + 11, stage.floor + 8, 13, Math.PI, TAU);
        ctx.fill();
    }
    ctx.fillStyle = hexToRgba(p.groundDark, 0.8);
    ctx.fillRect(0, stage.floor + 38, W, 10);
    // Penas no chão.
    for (let i = 0; i < 18; i++) {
        const x = layerX(i, 130, 18, cameraX, 0.9, 120);
        const y = stage.floor + 18 + hash(i) * 70;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(hash(i + 1) * TAU);
        ctx.fillStyle = hexToRgba(p.accent, 0.12);
        ctx.beginPath();
        ctx.ellipse(0, 0, 2.5, 8, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
    }
}
// ------------------------------------------------------------------ fase 6
function nexusFar(ctx, stage, cameraX, time) {
    const p = stage.palette;
    const cx = 880 - cameraX * 0.035;
    const cy = 260;
    // Galáxia.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.35 + Math.sin(time * 0.08) * 0.04);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 8, 0, 0, 340);
    g.addColorStop(0, hexToRgba('#ffffff', 0.5));
    g.addColorStop(0.12, hexToRgba(p.sun, 0.35));
    g.addColorStop(0.4, hexToRgba(p.accent, 0.16));
    g.addColorStop(0.7, hexToRgba(p.accent2, 0.06));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 340, 0, TAU);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = hexToRgba(i % 2 ? p.accent2 : p.accent, 0.18);
        ctx.lineWidth = 2.5 - i * 0.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 120 + i * 62, 34 + i * 18, 0.4 + i * 0.12, 0, TAU);
        ctx.stroke();
    }
    ctx.restore();
    // Olho do Ferrato ao fundo.
    if (stage.arc === 6) {
        const ex = 860 - cameraX * 0.02;
        const ey = 300;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const eg = ctx.createRadialGradient(ex, ey, 10, ex, ey, 200);
        eg.addColorStop(0, hexToRgba(p.sun, 0.25));
        eg.addColorStop(1, hexToRgba(p.sun, 0));
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.arc(ex, ey, 200, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(p.accent, 0.3);
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.ellipse(ex, ey, 250 + i * 60, 70 + i * 16, 0, 0, TAU);
            ctx.stroke();
        }
        ctx.restore();
    }
    // Fragmentos flutuantes.
    for (let i = 0; i < 14; i++) {
        const x = layerX(i, 230, 14, cameraX, 0.18, 240);
        const y = 60 + hash(i + 4) * 400 + Math.sin(time * 0.5 + i) * 14;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(hash(i) * TAU + time * 0.1);
        ctx.fillStyle = hexToRgba(p.far, 0.55);
        ctx.beginPath();
        ctx.moveTo(0, -16 - hash(i + 2) * 20);
        ctx.lineTo(10, 4);
        ctx.lineTo(-4, 16);
        ctx.lineTo(-11, 1);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}
function nexusMid(ctx, stage, cameraX, time) {
    const p = stage.palette;
    // Monólitos suspensos.
    for (let i = 0; i < 8; i++) {
        const x = layerX(i, 330, 8, cameraX, 0.3, 240);
        const y = 200 + hash(i + 5) * 220;
        const h = 100 + hash(i) * 180;
        ctx.fillStyle = hexToRgba(p.mid, 0.9);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 34, y - 18);
        ctx.lineTo(x + 50, y + h);
        ctx.lineTo(x + 12, y + h + 22);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = hexToRgba(p.accent, 0.18);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 20, y + 20);
        ctx.lineTo(x + 28, y + h - 30);
        ctx.stroke();
    }
    // Aros do Nexus.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
        const x = 640 - cameraX * 0.05;
        const y = 380;
        ctx.strokeStyle = hexToRgba(i % 2 ? p.accent : p.accent2, 0.08);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(x, y, 320 + i * 100, 80 + i * 24, 0.1, 0, TAU);
        ctx.stroke();
    }
    ctx.restore();
    // Névoa cósmica.
    const ng = ctx.createLinearGradient(0, stage.floor - 200, 0, stage.floor);
    ng.addColorStop(0, hexToRgba(p.accent, 0));
    ng.addColorStop(1, hexToRgba(p.accent, 0.06 + Math.sin(time * 0.7) * 0.02));
    ctx.fillStyle = ng;
    ctx.fillRect(0, stage.floor - 200, W, 200);
}
function nexusGround(ctx, stage, cameraX, time) {
    const p = stage.palette;
    // Plataforma de obsidiana.
    for (let i = 0; i < 9; i++) {
        const x = layerX(i, 280, 9, cameraX, 0.72, 220);
        ctx.fillStyle = hexToRgba('#08040f', 0.7);
        ctx.beginPath();
        ctx.moveTo(x, stage.floor + 40);
        ctx.lineTo(x + 30, stage.floor + 8);
        ctx.lineTo(x + 90, stage.floor + 20);
        ctx.lineTo(x + 120, stage.floor + 54);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = hexToRgba(p.accent, 0.18 + Math.sin(time * 2 + i) * 0.05);
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    // Fendas do Véu.
    for (let i = 0; i < 10; i++) {
        const x = layerX(i, 200, 10, cameraX, 0.85, 160);
        const y = stage.floor + 10 + hash(i) * 54;
        ctx.strokeStyle = hexToRgba(i % 2 ? p.accent : p.accent2, 0.3);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 30, y + 6);
        ctx.lineTo(x + 58, y - 4);
        ctx.stroke();
    }
}
// ------------------------------------------------------------------ assinaturas de fase
/** Placa luminosa com o nome do lugar; cada fase tem pelo menos uma. */
function stageSign(ctx, x, y, w, text, color, h = 30, sub = '') {
    const hh = sub ? h + 15 : h;
    ctx.save();
    ctx.fillStyle = 'rgba(4, 7, 12, 0.9)';
    roundRectPath(ctx, x - w / 2, y - hh / 2, w, hh, 4);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(color, 0.72);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(h * 0.42)}px "Rajdhani", "Segoe UI", sans-serif`;
    ctx.fillText(text, x, y - (sub ? 7 : 0));
    if (sub) {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.72;
        ctx.font = `600 ${Math.round(h * 0.27)}px "Share Tech Mono", "Consolas", monospace`;
        ctx.fillText(sub, x, y + h * 0.42);
    }
    ctx.restore();
}
/** Arco de pedra/metal para claustros, estações e portões. */
function stageArch(ctx, x, baseY, w, h, color, lw = 4) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x, baseY - h * 0.52);
    ctx.quadraticCurveTo(x + w / 2, baseY - h * 1.06, x + w, baseY - h * 0.52);
    ctx.lineTo(x + w, baseY);
    ctx.stroke();
    ctx.globalAlpha = 0.36;
    ctx.lineWidth = Math.max(1, lw * 0.4);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, baseY);
    ctx.lineTo(x + w * 0.1, baseY - h * 0.48);
    ctx.quadraticCurveTo(x + w / 2, baseY - h * 0.94, x + w * 0.9, baseY - h * 0.48);
    ctx.lineTo(x + w * 0.9, baseY);
    ctx.stroke();
    ctx.restore();
}
/** Corrente suspensa com elos desenhados ao longo da curva. */
function stageChain(ctx, x1, y1, x2, y2, sag, color, time, links = 12) {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2 + sag;
    ctx.save();
    ctx.strokeStyle = hexToRgba(color, 0.72);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cx, cy, x2, y2);
    ctx.stroke();
    for (let i = 0; i < links; i++) {
        const t = (i + 0.5) / links;
        const it = 1 - t;
        const x = it * it * x1 + 2 * it * t * cx + t * t * x2;
        const y = it * it * y1 + 2 * it * t * cy + t * t * y2 + Math.sin(time * 1.2 + i) * 1.5;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(i * 1.7) * 0.5);
        ctx.strokeStyle = hexToRgba(color, 0.5 + (i % 3) * 0.1);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 4.5, 2.5, 0, 0, TAU);
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
}
/** Fragmento flutuante de vidro, memória ou estação. */
function stageShard(ctx, x, y, size, color, rot, alpha = 0.55) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = hexToRgba(color, alpha * 0.45);
    ctx.strokeStyle = hexToRgba(color, alpha);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.52, -size * 0.1);
    ctx.lineTo(size * 0.24, size);
    ctx.lineTo(-size * 0.4, size * 0.62);
    ctx.lineTo(-size * 0.55, -size * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(0, size);
    ctx.moveTo(-size * 0.4, -size * 0.2);
    ctx.lineTo(size * 0.24, size * 0.2);
    ctx.stroke();
    ctx.restore();
}
/** Fenda vertical que marcou o fim de cada mundo. */
function stageRift(ctx, x, y, w, h, color, time) {
    const glow = ctx.createRadialGradient(x, y + h * 0.5, 2, x, y + h * 0.5, h * 0.8);
    glow.addColorStop(0, hexToRgba(color, 0.28));
    glow.addColorStop(0.55, hexToRgba(color, 0.08));
    glow.addColorStop(1, hexToRgba(color, 0));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(x, y + h * 0.52, w * 2.2, h * 0.8, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(4, 2, 8, 0.92)';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.35, y);
    ctx.lineTo(x + w * 0.22, y + h * 0.2);
    ctx.lineTo(x - w * 0.14, y + h * 0.38);
    ctx.lineTo(x + w * 0.38, y + h * 0.57);
    ctx.lineTo(x - w * 0.26, y + h * 0.76);
    ctx.lineTo(x + w * 0.1, y + h);
    ctx.lineTo(x + w * 0.56, y + h * 0.71);
    ctx.lineTo(x + w * 0.3, y + h * 0.43);
    ctx.lineTo(x + w * 0.65, y + h * 0.18);
    ctx.lineTo(x + w * 0.2, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hexToRgba(color, 0.7 + Math.sin(time * 2.2) * 0.18);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = hexToRgba(color, 0.55);
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        const yy = y + h * (0.18 + i * 0.2);
        ctx.beginPath();
        ctx.moveTo(x - w * 0.5, yy);
        ctx.lineTo(x + w * (0.4 + Math.sin(i + time) * 0.06), yy + h * 0.06);
        ctx.stroke();
    }
    ctx.restore();
}
/** Olho cósmico do Nexus/Ferrato. */
function stageEye(ctx, x, y, w, h, color, time) {
    ctx.save();
    ctx.translate(x, y);
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, w);
    glow.addColorStop(0, hexToRgba(color, 0.35));
    glow.addColorStop(0.5, hexToRgba(color, 0.1));
    glow.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 1.5, h * 1.8, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(8, 3, 14, 0.92)';
    ctx.strokeStyle = hexToRgba(color, 0.8);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.quadraticCurveTo(0, -h * 1.3, w, 0);
    ctx.quadraticCurveTo(0, h * 1.3, -w, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(color, 0.55);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
        const a = time * 0.3 + i * 1.45;
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.72, h * 0.58, a, 0, TAU);
        ctx.stroke();
    }
    ctx.fillStyle = hexToRgba(color, 0.9);
    ctx.beginPath();
    ctx.arc(0, 0, h * 0.26, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#08040c';
    ctx.beginPath();
    ctx.arc(0, 0, h * 0.12, 0, TAU);
    ctx.fill();
    ctx.restore();
}
/** Aglomerado de cristais do Nexus. */
function stageCrystal(ctx, x, baseY, height, color, time) {
    ctx.save();
    for (let i = 0; i < 5; i++) {
        const off = (i - 2) * height * 0.18;
        const hh = height * (0.45 + hash(i + x) * 0.6);
        const ww = height * (0.07 + hash(i + 2) * 0.08);
        ctx.save();
        ctx.translate(x + off, baseY);
        ctx.rotate(Math.sin(time * 0.5 + i) * 0.03 + (i - 2) * 0.04);
        ctx.fillStyle = hexToRgba(color, 0.28 + (i % 2) * 0.1);
        ctx.strokeStyle = hexToRgba(color, 0.75);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -hh);
        ctx.lineTo(ww, -hh * 0.3);
        ctx.lineTo(ww * 0.6, 0);
        ctx.lineTo(-ww * 0.6, 0);
        ctx.lineTo(-ww, -hh * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.moveTo(0, -hh);
        ctx.lineTo(0, 0);
        ctx.moveTo(-ww, -hh * 0.3);
        ctx.lineTo(ww, -hh * 0.3);
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
}
/** Bandeira/estandarte pendurado. */
function stageBanner(ctx, x, y, w, h, color, emblem = 'sword') {
    ctx.save();
    ctx.fillStyle = hexToRgba(color, 0.18);
    ctx.strokeStyle = hexToRgba(color, 0.55);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w * 0.86, y + h * 0.82);
    ctx.lineTo(x + w * 0.5, y + h);
    ctx.lineTo(x + w * 0.14, y + h * 0.82);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(color, 0.7);
    ctx.lineWidth = 1.4;
    const cx = x + w * 0.5;
    const cy = y + h * 0.48;
    const s = Math.min(w, h) * 0.22;
    if (emblem === 'sword') {
        ctx.beginPath();
        ctx.moveTo(cx, cy - s);
        ctx.lineTo(cx, cy + s);
        ctx.moveTo(cx - s * 0.5, cy + s * 0.28);
        ctx.lineTo(cx + s * 0.5, cy + s * 0.28);
        ctx.stroke();
    }
    else if (emblem === 'wing') {
        ctx.beginPath();
        ctx.moveTo(cx, cy + s * 0.5);
        ctx.quadraticCurveTo(cx - s, cy, cx - s * 1.3, cy - s * 0.6);
        ctx.moveTo(cx, cy + s * 0.5);
        ctx.quadraticCurveTo(cx + s, cy, cx + s * 1.3, cy - s * 0.6);
        ctx.stroke();
    }
    else if (emblem === 'eye') {
        ctx.beginPath();
        ctx.ellipse(cx, cy, s, s * 0.55, 0, 0, TAU);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.26, 0, TAU);
        ctx.stroke();
    }
    else if (emblem === 'flame') {
        ctx.beginPath();
        ctx.moveTo(cx, cy + s);
        ctx.quadraticCurveTo(cx - s, cy + s * 0.2, cx, cy - s);
        ctx.quadraticCurveTo(cx + s, cy + s * 0.2, cx, cy + s);
        ctx.stroke();
    }
    else {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const a = -Math.PI / 2 + (i / 5) * TAU;
            const b = a + TAU / 10;
            ctx.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s);
            ctx.lineTo(cx + Math.cos(b) * s * 0.42, cy + Math.sin(b) * s * 0.42);
        }
        ctx.closePath();
        ctx.stroke();
    }
    ctx.restore();
}
/** Asa/estátua alada da Catedral e de Malakhim. */
function stageWing(ctx, x, y, size, dir, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    ctx.fillStyle = hexToRgba(color, alpha * 0.32);
    ctx.strokeStyle = hexToRgba(color, alpha);
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate(-0.15 + i * 0.11);
        ctx.beginPath();
        ctx.ellipse(size * 0.44, i * size * 0.13, size * (0.52 - i * 0.06), size * 0.09, -0.35, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
}
/** Portal circular do Véu. */
function stagePortal(ctx, x, y, w, h, color, time) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(x, y, 2, x, y, w * 1.2);
    glow.addColorStop(0, hexToRgba(color, 0.35));
    glow.addColorStop(0.55, hexToRgba(color, 0.12));
    glow.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(x, y, w * 1.6, h * 1.35, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(color, 0.8);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        const rr = w * (0.28 + i * 0.18);
        ctx.globalAlpha = 0.35 + i * 0.1;
        ctx.beginPath();
        ctx.ellipse(x, y, rr, rr * (h / w), time * (0.16 + i * 0.06), 0, TAU);
        ctx.stroke();
    }
    ctx.restore();
}
/** Jaula suspensa do Tribunal e do Exílio. */
function stageCage(ctx, x, y, w, h, color) {
    ctx.save();
    ctx.strokeStyle = hexToRgba(color, 0.72);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.55, h * 0.16, 0, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
        const xx = x - w * 0.46 + (i / 4) * w * 0.92;
        ctx.beginPath();
        ctx.moveTo(xx, y);
        ctx.quadraticCurveTo(xx + (i % 2 ? 2 : -2), y + h * 0.5, xx, y + h);
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(x, y + h, w * 0.48, h * 0.13, 0, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - h * 0.45);
    ctx.stroke();
    ctx.restore();
}
/** Rosácea de vidro quebrada. */
function stageRose(ctx, x, y, r, color, accent, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = hexToRgba(color, 0.45);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.34, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + time * 0.02;
        ctx.strokeStyle = hexToRgba(i % 3 === 0 ? accent : color, 0.3);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.34, Math.sin(a) * r * 0.34);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * r * 0.68, Math.sin(a) * r * 0.68, r * 0.18, r * 0.1, a, 0, TAU);
        ctx.stroke();
    }
    ctx.fillStyle = hexToRgba(accent, 0.1);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.32, 0, TAU);
    ctx.fill();
    ctx.restore();
}
/** Tubos de órgão do Coro dos Caídos. */
function stageOrgan(ctx, x, baseY, color, time) {
    ctx.save();
    for (let i = 0; i < 9; i++) {
        const w = 11 + (i % 3) * 5;
        const h = 80 + Math.sin(i * 1.7) * 40 + (i % 4) * 26;
        const xx = x + i * (w + 5);
        ctx.fillStyle = hexToRgba(color, 0.22);
        ctx.strokeStyle = hexToRgba(color, 0.55);
        ctx.lineWidth = 1;
        ctx.beginPath();
        roundRectPath(ctx, xx, baseY - h, w, h, w * 0.5);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 0.35 + Math.abs(Math.sin(time * 0.7 + i)) * 0.3;
        ctx.fillStyle = hexToRgba(color, 0.7);
        ctx.fillRect(xx + w * 0.36, baseY - h + 6, w * 0.28, 1.5);
        ctx.globalAlpha = 1;
    }
    ctx.restore();
}
/** Placa de memória flutuante do Nexus. */
function stageMemory(ctx, x, y, w, h, color, rot, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot + Math.sin(time * 0.4 + x) * 0.02);
    ctx.fillStyle = hexToRgba(color, 0.12);
    ctx.strokeStyle = hexToRgba(color, 0.5);
    ctx.lineWidth = 1;
    roundRectPath(ctx, -w / 2, -h / 2, w, h, 3);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-w * 0.36, -h / 2 + (h / 4) * i);
        ctx.lineTo(w * (0.12 + (i % 2) * 0.2), -h / 2 + (h / 4) * i);
        ctx.stroke();
    }
    ctx.restore();
}
/** Imagem simplificada de um portão colossal. */
function stageGate(ctx, x, baseY, w, h, color, accent) {
    ctx.save();
    ctx.fillStyle = 'rgba(6, 3, 9, 0.9)';
    ctx.fillRect(x - w * 0.58, baseY - h, w * 0.16, h);
    ctx.fillRect(x + w * 0.42, baseY - h, w * 0.16, h);
    ctx.strokeStyle = hexToRgba(color, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.58, baseY - h);
    ctx.lineTo(x - w * 0.58, baseY - h * 0.7);
    ctx.quadraticCurveTo(x, baseY - h * 1.18, x + w * 0.58, baseY - h * 0.7);
    ctx.lineTo(x + w * 0.58, baseY - h);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(accent, 0.36);
    ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
        const xx = x - w * 0.3 + (i / 6) * w * 0.6;
        ctx.beginPath();
        ctx.moveTo(xx, baseY);
        ctx.lineTo(xx, baseY - h * (0.55 + (i % 2) * 0.2));
        ctx.stroke();
    }
    ctx.fillStyle = hexToRgba(accent, 0.08);
    ctx.beginPath();
    ctx.ellipse(x, baseY - h * 0.42, w * 0.24, h * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
}
/** Pequenas partículas atmosféricas exclusivas de cada capítulo. */
function stageMotes(ctx, stage, color, count, mode, time, speed = 34, size = 1.6, alpha = 0.55) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < count; i++) {
        const s1 = hash(i * 5 + stage.id * 19);
        const s2 = hash(i * 13 + stage.id * 7);
        const s3 = hash(i * 3 + stage.id * 31);
        let x = 0;
        let y = 0;
        if (mode === 'rise') {
            x = s1 * W;
            y = H - ((s2 * H + time * (speed + s3 * 30)) % (H + 60));
        }
        else if (mode === 'fall') {
            x = (s1 * W + Math.sin(time * 0.35 + i) * 18) % W;
            y = (s2 * H + time * (speed + s3 * 28)) % (H + 40) - 20;
        }
        else if (mode === 'drift') {
            x = (s1 * W + time * (speed * (s3 > 0.5 ? 1 : -1))) % W;
            if (x < 0)
                x += W;
            y = s2 * H * 0.86 + Math.sin(time * 0.6 + i) * 12;
        }
        else {
            const a = s1 * TAU + time * (0.12 + s2 * 0.24);
            const r = 60 + s3 * 430;
            x = W * 0.56 + Math.cos(a) * r;
            y = H * 0.38 + Math.sin(a) * r * 0.42;
        }
        const aa = alpha * (0.45 + Math.abs(Math.sin(time * 0.8 + i)) * 0.55);
        ctx.fillStyle = hexToRgba(color, clamp(aa, 0, 0.9));
        if (stage.ambient === 'feathers' || stage.id === 27 || stage.id === 29 || stage.id === 30) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(time * 0.5 + i);
            ctx.beginPath();
            ctx.ellipse(0, 0, size * 0.5, size * 2.2, 0, 0, TAU);
            ctx.fill();
            ctx.restore();
        }
        else {
            ctx.fillRect(x, y, size, size * (stage.id % 3 === 0 ? 2.2 : 1));
        }
    }
    ctx.restore();
}
function stageRain(ctx, stage, time, color) {
    ctx.save();
    ctx.strokeStyle = hexToRgba(color, 0.28);
    ctx.lineWidth = 1;
    for (let i = 0; i < 70; i++) {
        const s1 = hash(i * 4 + stage.id);
        const s2 = hash(i * 9 + stage.id * 3);
        const x = (s1 * W + time * (70 + s2 * 80)) % (W + 80) - 40;
        const y = (s2 * H + time * (420 + s1 * 240)) % (H + 40) - 20;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 7, y + 22 + s1 * 12);
        ctx.stroke();
    }
    ctx.restore();
}
function stageLightning(ctx, stage, time, color) {
    const cycle = (time * 0.55 + stage.id * 1.7) % 5.2;
    if (cycle > 0.14)
        return;
    ctx.save();
    ctx.fillStyle = hexToRgba(color, 0.08);
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const x = 360 + hash(stage.id) * 520;
    ctx.strokeStyle = hexToRgba(color, 0.75);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x - 18, 120);
    ctx.lineTo(x + 8, 138);
    ctx.lineTo(x - 30, 230);
    ctx.lineTo(x + 12, 250);
    ctx.lineTo(x - 14, 330);
    ctx.stroke();
    ctx.restore();
}
// ------------------------------------------------------------------ base
function drawGroundBase(ctx, stage) {
    const p = stage.palette;
    const g = ctx.createLinearGradient(0, stage.floor, 0, H);
    g.addColorStop(0, p.ground);
    g.addColorStop(0.35, p.groundDark);
    g.addColorStop(1, '#050409');
    ctx.fillStyle = g;
    ctx.fillRect(0, stage.floor, W, H - stage.floor);
    // Linha de impacto no horizonte.
    ctx.fillStyle = hexToRgba(p.accent, 0.45);
    ctx.fillRect(0, stage.floor - 2, W, 2);
    ctx.fillStyle = hexToRgba('#000000', 0.35);
    ctx.fillRect(0, stage.floor, W, 6);
    // Textura de piso com perspectiva.
    ctx.strokeStyle = hexToRgba('#ffffff', 0.035);
    ctx.lineWidth = 1;
    for (let i = 0; i < 18; i++) {
        const x = (i / 18) * W + ((stage.id * 37) % 30);
        ctx.beginPath();
        ctx.moveTo(x, stage.floor);
        ctx.lineTo(x - 90, H);
        ctx.stroke();
    }
}
function drawAmbient(ctx, stage, time) {
    const p = stage.palette;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const count = stage.ambient === 'stars' || stage.ambient === 'cosmic' ? 70 : 52;
    for (let i = 0; i < count; i++) {
        const s1 = hash(i * 3 + stage.id * 17);
        const s2 = hash(i * 11 + stage.id * 5);
        const speed = 18 + s2 * 58;
        let x = 0;
        let y = 0;
        let size = 1.4 + s1 * 2.2;
        let alpha = 0.2 + s2 * 0.5;
        switch (stage.ambient) {
            case 'embers': {
                x = (s1 * W + time * (8 + s2 * 22)) % (W + 40) - 20;
                y = H + 20 - ((s2 * H + time * speed) % (H + 140));
                size = 1.2 + s1 * 2;
                break;
            }
            case 'ash': {
                x = (s1 * W + Math.sin(time * 0.4 + i) * 24 + time * 12) % (W + 40) - 20;
                y = (s2 * H + time * speed) % (H + 80) - 40;
                size = 1 + s1 * 2.4;
                alpha *= 0.55;
                break;
            }
            case 'stars': {
                x = s1 * W;
                y = s2 * stage.floor * 0.9;
                alpha = 0.25 + Math.abs(Math.sin(time * (0.8 + s2) + i)) * 0.55;
                break;
            }
            case 'magma': {
                x = (s1 * W + time * (4 + s2 * 14)) % (W + 40) - 20;
                y = stage.floor - ((s2 * 260 + time * (30 + s1 * 70)) % 280);
                size = 1.8 + s1 * 3.4;
                alpha = 0.35 + s2 * 0.5;
                break;
            }
            case 'feathers': {
                x = (s1 * W + Math.sin(time * 0.8 + i * 2) * 60 + time * 16) % (W + 80) - 40;
                y = (s2 * H + time * 24) % (H + 60) - 30;
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(time * 0.6 + i);
                ctx.fillStyle = hexToRgba(p.accent, alpha * 0.75);
                ctx.beginPath();
                ctx.ellipse(0, 0, size * 0.4, size * 2.2, 0, 0, TAU);
                ctx.fill();
                ctx.restore();
                continue;
            }
            case 'cosmic': {
                const a = s1 * TAU + time * (0.05 + s2 * 0.12);
                const r = 90 + s2 * 460;
                x = 720 + Math.cos(a) * r - 60;
                y = 330 + Math.sin(a) * r * 0.5;
                alpha = 0.25 + Math.sin(time * 1.4 + i) * 0.2;
                break;
            }
        }
        ctx.fillStyle = hexToRgba(stage.ambient === 'magma' || stage.ambient === 'embers' ? p.accent : p.accent2, clamp(alpha, 0, 0.9));
        ctx.beginPath();
        ctx.arc(x, y, size, 0, TAU);
        ctx.fill();
    }
    ctx.restore();
}
/** Céu e estruturas distantes exclusivas de cada capítulo. */
function drawStageSky(ctx, stage, cameraX, time) {
    const p = stage.palette;
    const ch = stage.chapter;
    ctx.save();
    switch (stage.arc) {
        case 1: {
            if (ch === 1) {
                for (let i = 0; i < 5; i++) {
                    const x = layerX(i, 360, 5, cameraX, 0.05, 180);
                    const y = 100 + hash(i + stage.id) * 90;
                    ctx.fillStyle = hexToRgba('#1a0c14', 0.5);
                    ctx.beginPath();
                    ctx.ellipse(x, y, 150 + hash(i) * 90, 28 + hash(i + 3) * 20, 0, 0, TAU);
                    ctx.ellipse(x + 70, y - 14, 90, 24, 0, 0, TAU);
                    ctx.fill();
                }
            }
            else if (ch === 2) {
                ctx.fillStyle = hexToRgba(p.sun, 0.09);
                ctx.beginPath();
                ctx.arc(920 - cameraX * 0.03, 210, 210, 0, TAU);
                ctx.fill();
                for (let i = 0; i < 3; i++) {
                    const x = 180 + i * 360 - cameraX * 0.04;
                    ctx.fillStyle = hexToRgba(p.far, 0.45);
                    ctx.beginPath();
                    ctx.ellipse(x, 250 + i * 20, 110, 30, 0.2, 0, TAU);
                    ctx.fill();
                }
            }
            else if (ch === 3) {
                ctx.strokeStyle = hexToRgba(p.accent2, 0.12);
                ctx.lineWidth = 3;
                for (let i = 0; i < 4; i++) {
                    const x = 120 + i * 330 - cameraX * 0.04;
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x + 70, stage.floor);
                    ctx.stroke();
                }
            }
            else if (ch === 4) {
                const mx = 880 - cameraX * 0.02;
                ctx.fillStyle = 'rgba(250, 223, 190, 0.18)';
                ctx.beginPath();
                ctx.arc(mx, 170, 72, 0, TAU);
                ctx.fill();
                ctx.strokeStyle = 'rgba(250, 223, 190, 0.28)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(mx, 170, 84, 0, TAU);
                ctx.stroke();
            }
            else if (ch === 5) {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                for (let i = 0; i < 4; i++) {
                    const y = 110 + i * 30;
                    const g = ctx.createLinearGradient(0, y, W, y + 80);
                    g.addColorStop(0, 'rgba(80, 255, 190, 0)');
                    g.addColorStop(0.3, `rgba(80, 255, 190, ${0.08 + i * 0.02})`);
                    g.addColorStop(0.65, 'rgba(255, 160, 72, 0.06)');
                    g.addColorStop(1, 'rgba(255, 160, 72, 0)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.quadraticCurveTo(W * 0.4, y - 30 + Math.sin(time * 0.2 + i) * 12, W, y + 55);
                    ctx.lineTo(W, y + 95);
                    ctx.quadraticCurveTo(W * 0.4, y + 8 + Math.sin(time * 0.2 + i) * 12, 0, y + 35);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            }
            else {
                stageRift(ctx, 760 - cameraX * 0.035, 35, 44, 320, p.accent, time);
                ctx.fillStyle = hexToRgba('#120813', 0.55);
                ctx.beginPath();
                ctx.ellipse(1080 - cameraX * 0.04, 110, 230, 36, 0, 0, TAU);
                ctx.fill();
            }
            break;
        }
        case 2: {
            if (ch === 7 || ch === 11 || ch === 12) {
                for (let i = 0; i < 4; i++) {
                    const x = 120 + i * 330 - cameraX * 0.04;
                    const h = 150 + hash(i + stage.id) * 160;
                    const g = ctx.createLinearGradient(x, stage.floor, x, stage.floor - h);
                    g.addColorStop(0, 'rgba(35, 20, 20, 0)');
                    g.addColorStop(0.4, hexToRgba(p.far, 0.4));
                    g.addColorStop(1, hexToRgba('#0d090d', 0.8));
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.moveTo(x - 40, stage.floor);
                    ctx.quadraticCurveTo(x - 20, stage.floor - h * 0.6, x + 10, stage.floor - h);
                    ctx.quadraticCurveTo(x + 55, stage.floor - h * 0.5, x + 80, stage.floor);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            if (ch === 9) {
                const g = ctx.createRadialGradient(930 - cameraX * 0.04, 220, 4, 930 - cameraX * 0.04, 220, 180);
                g.addColorStop(0, 'rgba(95, 255, 190, 0.12)');
                g.addColorStop(1, 'rgba(95, 255, 190, 0)');
                ctx.fillStyle = g;
                ctx.fillRect(650, 40, 560, 380);
            }
            if (ch === 10) {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                for (let i = 0; i < 5; i++) {
                    const x = 140 + i * 250 - cameraX * 0.03;
                    const g = ctx.createLinearGradient(x, 0, x, 360);
                    g.addColorStop(0, `rgba(255, 211, 130, ${0.11 + i * 0.01})`);
                    g.addColorStop(1, 'rgba(255, 211, 130, 0)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x + 22, 0);
                    ctx.lineTo(x + 76, 370);
                    ctx.lineTo(x + 38, 370);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            }
            if (ch === 12) {
                ctx.fillStyle = hexToRgba('#1a1118', 0.68);
                ctx.beginPath();
                ctx.moveTo(0, 260);
                ctx.quadraticCurveTo(280, 100, 560, 250);
                ctx.quadraticCurveTo(820, 80, 1280, 230);
                ctx.lineTo(1280, 400);
                ctx.lineTo(0, 400);
                ctx.closePath();
                ctx.fill();
            }
            break;
        }
        case 3: {
            if (ch === 13) {
                const g = ctx.createRadialGradient(280, 210, 4, 280, 210, 150);
                g.addColorStop(0, 'rgba(120, 210, 255, 0.35)');
                g.addColorStop(0.65, 'rgba(60, 120, 180, 0.16)');
                g.addColorStop(1, 'rgba(20, 40, 90, 0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(280, 210, 150, 0, TAU);
                ctx.fill();
                ctx.fillStyle = 'rgba(30, 64, 110, 0.42)';
                ctx.beginPath();
                ctx.arc(280, 210, 65, 0, TAU);
                ctx.fill();
            }
            else if (ch === 14) {
                ctx.strokeStyle = hexToRgba(p.accent, 0.16);
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.arc(980 - cameraX * 0.025, 180, 190, 0.2, Math.PI + 0.4);
                ctx.stroke();
                ctx.lineWidth = 1.5;
                for (let i = 0; i < 7; i++) {
                    const a = 0.2 + (i / 7) * Math.PI;
                    const x = 980 - cameraX * 0.025 + Math.cos(a) * 190;
                    const y = 180 + Math.sin(a) * 190;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + Math.cos(a) * 40, y + Math.sin(a) * 40);
                    ctx.stroke();
                }
            }
            else if (ch === 16) {
                const g = ctx.createRadialGradient(940, 250, 4, 940, 250, 210);
                g.addColorStop(0, 'rgba(111, 242, 255, 0.22)');
                g.addColorStop(1, 'rgba(111, 242, 255, 0)');
                ctx.fillStyle = g;
                ctx.fillRect(680, 80, 520, 380);
            }
            else if (ch === 17) {
                ctx.fillStyle = 'rgba(8, 12, 26, 0.65)';
                for (let i = 0; i < 4; i++) {
                    const x = 90 + i * 310 - cameraX * 0.035;
                    const y = 100 + i * 24;
                    ctx.beginPath();
                    ctx.moveTo(x, y + 18);
                    ctx.lineTo(x + 80, y);
                    ctx.lineTo(x + 150, y + 18);
                    ctx.lineTo(x + 120, y + 26);
                    ctx.lineTo(x + 25, y + 30);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = hexToRgba(p.accent, 0.4);
                    ctx.fillRect(x + 18 + i * 3, y + 14, 2, 2);
                    ctx.fillStyle = 'rgba(8, 12, 26, 0.65)';
                }
                if ((time * 0.7 + stage.id) % 4 < 0.09) {
                    ctx.fillStyle = 'rgba(255, 190, 140, 0.15)';
                    ctx.fillRect(780, 150, 220, 40);
                }
            }
            else if (ch === 18) {
                ctx.strokeStyle = hexToRgba(p.accent2, 0.18);
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(780 - cameraX * 0.02, 220, 240, 3.7, TAU + 0.4);
                ctx.stroke();
                for (let i = 0; i < 9; i++) {
                    stageShard(ctx, 180 + i * 120 - cameraX * 0.03, 80 + hash(i + 3) * 220, 7 + hash(i) * 8, p.accent2, time * 0.1 + i, 0.3);
                }
            }
            break;
        }
        case 4: {
            if (ch === 19) {
                ctx.fillStyle = 'rgba(140, 24, 34, 0.18)';
                ctx.beginPath();
                ctx.arc(940 - cameraX * 0.03, 140, 110, 0, TAU);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 51, 87, 0.18)';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(940 - cameraX * 0.03, 140, 124, 0.3, TAU - 0.6);
                ctx.stroke();
            }
            else if (ch === 20) {
                for (let i = 0; i < 5; i++) {
                    const x = 120 + i * 260 - cameraX * 0.03;
                    stageChain(ctx, x, -20, x + 30, 260 + hash(i) * 100, 80, p.accent, time, 8);
                }
            }
            else if (ch === 22) {
                ctx.save();
                ctx.translate(900 - cameraX * 0.03, 130);
                ctx.strokeStyle = hexToRgba(p.accent, 0.4);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-48, 22);
                ctx.lineTo(-38, -20);
                ctx.lineTo(-14, 5);
                ctx.lineTo(0, -36);
                ctx.lineTo(16, 5);
                ctx.lineTo(40, -20);
                ctx.lineTo(48, 22);
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            }
            else if (ch === 23) {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                const g = ctx.createLinearGradient(800, 0, 920, 420);
                g.addColorStop(0, 'rgba(255, 196, 120, 0.12)');
                g.addColorStop(1, 'rgba(255, 196, 120, 0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.moveTo(800, 0);
                ctx.lineTo(880, 0);
                ctx.lineTo(960, 420);
                ctx.lineTo(860, 420);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
            else if (ch === 24) {
                stagePortal(ctx, 990 - cameraX * 0.035, 220, 120, 190, p.accent, time);
            }
            break;
        }
        case 5: {
            if (ch === 25) {
                ctx.fillStyle = hexToRgba('#f8e9c4', 0.1);
                ctx.beginPath();
                ctx.moveTo(160, 260);
                ctx.lineTo(310, 120);
                ctx.lineTo(460, 260);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = hexToRgba(p.accent, 0.25);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(160, 260);
                ctx.lineTo(310, 120);
                ctx.lineTo(460, 260);
                ctx.stroke();
            }
            else if (ch === 26) {
                stageRose(ctx, 930 - cameraX * 0.03, 200, 135, p.accent, p.accent2, time);
            }
            else if (ch === 27) {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                for (let i = 0; i < 3; i++) {
                    const y = 100 + i * 40;
                    ctx.strokeStyle = hexToRgba(i % 2 ? p.accent2 : p.accent, 0.16);
                    ctx.lineWidth = 8 - i * 2;
                    ctx.beginPath();
                    ctx.moveTo(-100, y);
                    ctx.bezierCurveTo(300, y - 80, 900, y + 100, 1380, y - 20);
                    ctx.stroke();
                }
                ctx.restore();
            }
            else if (ch === 28) {
                ctx.strokeStyle = hexToRgba(p.accent, 0.16);
                ctx.lineWidth = 2;
                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.arc(780, 250, 80 + i * 50 + Math.sin(time * 0.7 + i) * 8, 0.2, Math.PI - 0.2);
                    ctx.stroke();
                }
            }
            else if (ch === 29) {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                for (let i = 0; i < 6; i++) {
                    const x = 100 + i * 230;
                    const g = ctx.createLinearGradient(x, 0, x, 500);
                    g.addColorStop(0, 'rgba(255, 240, 196, 0.14)');
                    g.addColorStop(1, 'rgba(255, 240, 196, 0)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x + 30, 0);
                    ctx.lineTo(x + 110, 500);
                    ctx.lineTo(x + 60, 500);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            }
            else if (ch === 30) {
                stageRift(ctx, 720 - cameraX * 0.025, 20, 58, 390, p.accent, time);
                for (let i = 0; i < 5; i++) {
                    stageShard(ctx, 160 + i * 220 - cameraX * 0.03, 80 + hash(i) * 180, 8, p.accent2, i + time * 0.06, 0.32);
                }
            }
            break;
        }
        case 6:
        default: {
            if (ch === 31 || ch === 34) {
                for (let i = 0; i < 8; i++) {
                    stageShard(ctx, 80 + i * 180 - cameraX * 0.02, 70 + hash(i + stage.id) * 230, 8 + hash(i) * 12, i % 2 ? p.accent : p.accent2, i * 0.7 + time * 0.05, 0.24);
                }
            }
            else if (ch === 32) {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                const g = ctx.createRadialGradient(960, 210, 4, 960, 210, 280);
                g.addColorStop(0, 'rgba(180, 139, 255, 0.2)');
                g.addColorStop(0.5, 'rgba(111, 242, 255, 0.08)');
                g.addColorStop(1, 'rgba(255, 138, 226, 0)');
                ctx.fillStyle = g;
                ctx.fillRect(650, 0, 630, 460);
                ctx.restore();
            }
            else if (ch === 33) {
                stageRift(ctx, 880 - cameraX * 0.02, 40, 52, 300, p.accent, time);
                stageEye(ctx, 880 - cameraX * 0.02, 190, 38, 20, p.accent, time);
            }
            else if (ch === 35) {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                const g = ctx.createLinearGradient(880, 70, 1060, 430);
                g.addColorStop(0, 'rgba(255, 244, 205, 0.16)');
                g.addColorStop(1, 'rgba(255, 244, 205, 0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.moveTo(870, 70);
                ctx.lineTo(1010, 70);
                ctx.lineTo(1090, 430);
                ctx.lineTo(790, 430);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
            else if (ch === 36) {
                stageEye(ctx, 900 - cameraX * 0.018, 185, 150, 82, p.accent, time);
                ctx.strokeStyle = hexToRgba(p.accent, 0.18);
                ctx.lineWidth = 2;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.ellipse(900 - cameraX * 0.018, 185, 200 + i * 42, 70 + i * 20, time * 0.02, 0, TAU);
                    ctx.stroke();
                }
            }
            break;
        }
    }
    ctx.restore();
}
/** Marco visual exclusivo de cada uma das 36 fases. */
function drawStageLandmark(ctx, stage, cameraX, time) {
    const p = stage.palette;
    const f = stage.floor;
    ctx.save();
    switch (stage.id) {
        case 1: {
            const x = 170 - cameraX * 0.15;
            ctx.fillStyle = hexToRgba(p.near, 0.96);
            ctx.fillRect(x, f - 238, 260, 238);
            ctx.fillStyle = hexToRgba(p.mid, 1);
            ctx.fillRect(x - 8, f - 252, 276, 16);
            ctx.fillStyle = hexToRgba(p.accent, 0.18);
            ctx.fillRect(x + 28, f - 154, 96, 88);
            ctx.fillStyle = hexToRgba('#09060b', 0.9);
            ctx.fillRect(x + 142, f - 126, 48, 126);
            for (let i = 0; i < 8; i++) {
                ctx.fillStyle = hexToRgba(i % 2 ? p.accent : p.accent2, 0.28);
                ctx.beginPath();
                ctx.moveTo(x + 12 + i * 30, f - 172);
                ctx.lineTo(x + 32 + i * 30, f - 172);
                ctx.lineTo(x + 26 + i * 30, f - 148);
                ctx.lineTo(x + 6 + i * 30, f - 148);
                ctx.closePath();
                ctx.fill();
            }
            stageSign(ctx, x + 130, f - 268, 210, 'PIZZARIA', p.accent, 32, 'ENTREGA 24H');
            // Moto de entrega caída.
            ctx.strokeStyle = hexToRgba(p.accent2, 0.55);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + 282, f - 14, 13, 0, TAU);
            ctx.moveTo(x + 322, f - 14);
            ctx.arc(x + 309, f - 14, 13, 0, TAU);
            ctx.stroke();
            ctx.strokeStyle = hexToRgba(p.accent, 0.65);
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + 278, f - 28);
            ctx.lineTo(x + 310, f - 28);
            ctx.lineTo(x + 326, f - 14);
            ctx.stroke();
            break;
        }
        case 2: {
            const x = 70 - cameraX * 0.15;
            for (let i = 0; i < 3; i++) {
                const sx = x + i * 250;
                ctx.fillStyle = hexToRgba(p.near, 0.92);
                ctx.fillRect(sx, f - 132, 200, 132);
                ctx.fillStyle = hexToRgba(i % 2 ? p.accent : p.accent2, 0.28);
                ctx.beginPath();
                ctx.moveTo(sx - 8, f - 150);
                ctx.lineTo(sx + 208, f - 150);
                ctx.lineTo(sx + 188, f - 132);
                ctx.lineTo(sx + 12, f - 132);
                ctx.closePath();
                ctx.fill();
                for (let j = 0; j < 5; j++) {
                    ctx.fillStyle = hexToRgba(i % 2 ? p.accent2 : p.accent, 0.38);
                    ctx.fillRect(sx + 16 + j * 36, f - 146, 14, 10);
                }
                ctx.fillStyle = hexToRgba('#0c080c', 0.8);
                ctx.fillRect(sx + 24, f - 108, 70, 108);
                ctx.fillStyle = hexToRgba(p.accent2, 0.24);
                ctx.fillRect(sx + 112, f - 104, 64, 54);
            }
            stageSign(ctx, x + 300, f - 210, 270, 'MERCADO CENTRAL', p.accent, 30, 'SETOR DE ENTREGAS');
            ctx.strokeStyle = hexToRgba(p.accent, 0.28);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x, f - 240);
            ctx.quadraticCurveTo(x + 350, f - 210, x + 700, f - 238);
            ctx.stroke();
            for (let i = 0; i < 8; i++) {
                const bx = x + 30 + i * 82;
                const by = f - 232 + Math.sin((i / 7) * Math.PI) * 18;
                ctx.fillStyle = i % 2 ? p.accent2 : p.accent;
                ctx.beginPath();
                ctx.arc(bx, by, 2.4, 0, TAU);
                ctx.fill();
            }
            break;
        }
        case 3: {
            const x = 180 - cameraX * 0.15;
            ctx.fillStyle = 'rgba(7, 6, 12, 0.92)';
            ctx.fillRect(x, f - 210, 300, 210);
            stageArch(ctx, x + 26, f, 248, 210, hexToRgba(p.accent2, 0.55), 5);
            for (let i = 0; i < 7; i++) {
                ctx.strokeStyle = hexToRgba(p.accent2, 0.12 + i * 0.02);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + 50 + i * 30, f - 14);
                ctx.lineTo(x + 150 + i * 14, f - 118);
                ctx.stroke();
            }
            stageSign(ctx, x + 150, f - 238, 250, 'METRÔ CENTRAL', p.accent2, 30, 'PLATAFORMA 3');
            // Relógio de estação.
            ctx.strokeStyle = hexToRgba(p.accent, 0.55);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + 290, f - 180, 22, 0, TAU);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 290, f - 180);
            ctx.lineTo(x + 290, f - 194);
            ctx.moveTo(x + 290, f - 180);
            ctx.lineTo(x + 302, f - 176);
            ctx.stroke();
            break;
        }
        case 4: {
            const x = 110 - cameraX * 0.1;
            const towerH = 280;
            ctx.fillStyle = hexToRgba(p.near, 0.7);
            ctx.fillRect(x, f - towerH, 42, towerH);
            ctx.fillRect(x + 760, f - towerH * 0.82, 34, towerH * 0.82);
            ctx.strokeStyle = hexToRgba(p.accent, 0.22);
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(x + 21, f - towerH + 12);
                ctx.quadraticCurveTo(x + 390, f - 120 + i * 8, x + 760, f - towerH * 0.82 + 12);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + 21, f - towerH + 40);
                ctx.quadraticCurveTo(x + 390, f - 180 + i * 8, x + 760, f - towerH * 0.82 + 38);
                ctx.stroke();
            }
            ctx.strokeStyle = hexToRgba(p.accent2, 0.28);
            ctx.lineWidth = 2;
            for (let i = 0; i < 12; i++) {
                const px = x + 60 + i * 60;
                ctx.beginPath();
                ctx.moveTo(px, f - 48);
                ctx.lineTo(px, f - 14);
                ctx.stroke();
            }
            stageSign(ctx, x + 380, f - 72, 220, 'PONTE NOVA HAVEN', p.accent2, 26);
            break;
        }
        case 5: {
            const x = 60 - cameraX * 0.14;
            ctx.fillStyle = hexToRgba(p.near, 0.96);
            ctx.fillRect(x, f - 190, 390, 190);
            for (let i = 0; i < 3; i++) {
                const cx = x + 58 + i * 118;
                ctx.fillStyle = hexToRgba('#171015', 0.95);
                ctx.fillRect(cx, f - 310, 24, 310);
                ctx.fillStyle = hexToRgba(p.accent, 0.22);
                ctx.fillRect(cx - 4, f - 310, 32, 8);
            }
            ctx.fillStyle = hexToRgba(p.mid, 1);
            ctx.fillRect(x + 260, f - 230, 82, 230);
            stageSign(ctx, x + 301, f - 246, 150, 'AURORA', p.accent, 26, 'AÇO');
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createRadialGradient(x + 160, f - 60, 2, x + 160, f - 60, 110);
            g.addColorStop(0, 'rgba(255, 140, 60, 0.35)');
            g.addColorStop(1, 'rgba(255, 140, 60, 0)');
            ctx.fillStyle = g;
            ctx.fillRect(x, f - 180, 340, 180);
            ctx.restore();
            for (let i = 0; i < 4; i++) {
                ctx.strokeStyle = hexToRgba(p.accent, 0.25);
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(x + 390 + i * 14, f - 120 + i * 18);
                ctx.lineTo(x + 520, f - 120 + i * 18);
                ctx.stroke();
            }
            break;
        }
        case 6: {
            const x = 150 - cameraX * 0.13;
            ctx.fillStyle = hexToRgba(p.near, 0.9);
            ctx.fillRect(x, f - 180, 250, 180);
            ctx.fillStyle = hexToRgba('#08050a', 0.95);
            ctx.beginPath();
            ctx.moveTo(x + 110, f - 180);
            ctx.lineTo(x + 128, f - 110);
            ctx.lineTo(x + 118, f - 30);
            ctx.lineTo(x + 142, f);
            ctx.lineTo(x + 96, f - 10);
            ctx.lineTo(x + 70, f - 88);
            ctx.lineTo(x + 89, f - 148);
            ctx.closePath();
            ctx.fill();
            stageSign(ctx, x + 125, f - 212, 200, 'NEW HAVEN', p.accent2, 28, 'EVACUAÇÃO');
            ctx.strokeStyle = hexToRgba(p.accent, 0.45);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 270, f - 28);
            ctx.lineTo(x + 300, f - 28);
            ctx.lineTo(x + 300, f - 126);
            ctx.stroke();
            ctx.fillStyle = hexToRgba(p.accent, 0.32);
            ctx.fillRect(x + 278, f - 146, 44, 22);
            break;
        }
        case 7: {
            const x = 100 - cameraX * 0.12;
            ctx.fillStyle = hexToRgba(p.near, 0.85);
            ctx.fillRect(x, f - 184, 500, 28);
            ctx.fillRect(x + 60, f - 156, 28, 156);
            ctx.fillRect(x + 402, f - 156, 28, 156);
            stageSign(ctx, x + 250, f - 220, 270, 'RODOVIA DOS IMORTAIS', p.accent, 28, 'KM 09');
            // Ônibus tombado.
            ctx.fillStyle = 'rgba(44, 34, 30, 0.9)';
            roundRectPath(ctx, x + 60, f - 78, 190, 58, 8);
            ctx.fill();
            ctx.fillStyle = hexToRgba(p.accent2, 0.2);
            for (let i = 0; i < 4; i++)
                ctx.fillRect(x + 78 + i * 38, f - 68, 24, 18);
            ctx.strokeStyle = hexToRgba(p.accent, 0.4);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + 280, f - 16, 15, 0, TAU);
            ctx.moveTo(x + 345, f - 16);
            ctx.arc(x + 330, f - 16, 15, 0, TAU);
            ctx.stroke();
            break;
        }
        case 8: {
            const x = 150 - cameraX * 0.13;
            ctx.fillStyle = hexToRgba(p.near, 0.94);
            ctx.fillRect(x, f - 230, 390, 230);
            ctx.fillStyle = hexToRgba('#151016', 0.92);
            ctx.fillRect(x + 36, f - 150, 130, 150);
            ctx.fillRect(x + 216, f - 150, 130, 150);
            ctx.fillStyle = hexToRgba(p.accent, 0.18);
            ctx.fillRect(x + 48, f - 138, 106, 10);
            stageSign(ctx, x + 195, f - 258, 220, 'QUARTEL 09', p.accent, 32, 'BRIGADA DE NEW HAVEN');
            ctx.fillStyle = 'rgba(200, 44, 32, 0.25)';
            ctx.fillRect(x + 36, f - 162, 310, 12);
            // Caminhão de bombeiros.
            ctx.fillStyle = 'rgba(120, 28, 24, 0.7)';
            roundRectPath(ctx, x + 40, f - 46, 170, 34, 4);
            ctx.fill();
            ctx.strokeStyle = hexToRgba(p.accent, 0.5);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + 70, f - 12, 12, 0, TAU);
            ctx.moveTo(x + 190, f - 12);
            ctx.arc(x + 178, f - 12, 12, 0, TAU);
            ctx.stroke();
            break;
        }
        case 9: {
            const x = 130 - cameraX * 0.13;
            ctx.fillStyle = hexToRgba(p.near, 0.94);
            ctx.fillRect(x, f - 260, 360, 260);
            ctx.fillStyle = hexToRgba('#f2f4ef', 0.08);
            for (let i = 0; i < 5; i++)
                ctx.fillRect(x + 30 + (i % 3) * 96, f - 220 + Math.floor(i / 3) * 58, 44, 30);
            ctx.fillStyle = '#5fffc1';
            ctx.fillRect(x + 166, f - 178, 18, 58);
            ctx.fillRect(x + 146, f - 158, 58, 18);
            stageSign(ctx, x + 180, f - 286, 260, 'HOSPITAL ESPERANÇA', '#5fffc1', 28, 'EMERGÊNCIA');
            // Ambulância.
            ctx.fillStyle = 'rgba(210, 225, 218, 0.42)';
            roundRectPath(ctx, x + 40, f - 52, 180, 38, 5);
            ctx.fill();
            ctx.fillStyle = 'rgba(95, 255, 193, 0.5)';
            ctx.fillRect(x + 40, f - 50, 180, 4);
            break;
        }
        case 10: {
            const x = 210 - cameraX * 0.12;
            ctx.fillStyle = hexToRgba(p.near, 0.9);
            ctx.beginPath();
            ctx.moveTo(x, f);
            ctx.lineTo(x + 40, f - 250);
            ctx.lineTo(x + 70, f - 290);
            ctx.lineTo(x + 100, f - 250);
            ctx.lineTo(x + 140, f);
            ctx.closePath();
            ctx.fill();
            stageSign(ctx, x + 70, f - 322, 210, 'AVENIDA DOS HERÓIS', p.accent, 26, 'MEMORIAL');
            // Estátuas e velas.
            for (let i = 0; i < 4; i++) {
                const sx = x - 110 + i * 94;
                if (sx < -20)
                    continue;
                ctx.fillStyle = hexToRgba(p.mid, 0.9);
                ctx.fillRect(sx, f - 56, 32, 56);
                ctx.beginPath();
                ctx.arc(sx + 16, f - 66, 10, 0, TAU);
                ctx.fill();
                if (i % 2 === 0)
                    ctx.fillRect(sx + 12, f - 92, 8, 28);
            }
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 7; i++) {
                const cx = x - 160 + i * 62;
                ctx.fillStyle = 'rgba(255, 211, 130, 0.6)';
                ctx.fillRect(cx, f - 18, 2, 5);
            }
            ctx.restore();
            break;
        }
        case 11: {
            const x = 80 - cameraX * 0.12;
            for (let i = 0; i < 5; i++) {
                const cx = x + i * 190;
                ctx.fillStyle = hexToRgba('#1a1016', 0.8);
                ctx.fillRect(cx, f - 190, 30, 190);
                ctx.fillRect(cx - 12, f - 198, 54, 12);
                ctx.fillRect(cx - 12, f - 20, 54, 12);
            }
            stageSign(ctx, x + 380, f - 230, 240, 'ESPLANADA', p.accent, 30, 'FOGO PERPÉTUO');
            // Tornado de fogo.
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 7; i++) {
                const yy = f - 30 - i * 30;
                const rx = 20 + i * 9;
                ctx.strokeStyle = `rgba(255, ${110 + i * 10}, 48, ${0.22 + i * 0.035})`;
                ctx.lineWidth = 5 + i * 1.2;
                ctx.beginPath();
                ctx.ellipse(x + 680 + Math.sin(time * 0.4 + i) * 10, yy, rx, 9, 0.1, 0, TAU);
                ctx.stroke();
            }
            ctx.restore();
            break;
        }
        case 12: {
            const x = 210 - cameraX * 0.11;
            ctx.fillStyle = hexToRgba(p.near, 0.9);
            ctx.beginPath();
            ctx.moveTo(x, f);
            ctx.lineTo(x, f - 180);
            ctx.lineTo(x + 90, f - 300);
            ctx.lineTo(x + 180, f - 180);
            ctx.lineTo(x + 180, f);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = hexToRgba('#0a070c', 0.9);
            ctx.beginPath();
            ctx.arc(x + 90, f - 166, 24, Math.PI, TAU);
            ctx.fill();
            stageSign(ctx, x + 90, f - 344, 230, 'CATEDRAL DE CINZAS', p.accent, 26, 'ÚLTIMO REFÚGIO');
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createLinearGradient(0, f - 420, 0, f);
            g.addColorStop(0, 'rgba(150, 145, 150, 0)');
            g.addColorStop(0.55, 'rgba(150, 145, 150, 0.14)');
            g.addColorStop(1, 'rgba(255, 130, 70, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(x + 470, f);
            ctx.quadraticCurveTo(x + 400, f - 260, x + 540, f - 430);
            ctx.quadraticCurveTo(x + 660, f - 220, x + 620, f);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            break;
        }
        case 13: {
            const x = 100 - cameraX * 0.12;
            ctx.fillStyle = hexToRgba(p.near, 0.9);
            ctx.fillRect(x, f - 250, 470, 250);
            ctx.save();
            ctx.beginPath();
            ctx.arc(x + 150, f - 152, 92, 0, TAU);
            ctx.clip();
            const sky = ctx.createLinearGradient(0, f - 250, 0, f - 50);
            sky.addColorStop(0, '#071426');
            sky.addColorStop(1, '#173b5c');
            ctx.fillStyle = sky;
            ctx.fillRect(x + 40, f - 260, 220, 230);
            ctx.fillStyle = 'rgba(90, 180, 255, 0.45)';
            ctx.beginPath();
            ctx.arc(x + 150, f - 152, 48, 0, TAU);
            ctx.fill();
            ctx.fillStyle = 'rgba(40, 120, 200, 0.35)';
            ctx.beginPath();
            ctx.arc(x + 136, f - 162, 16, 0, TAU);
            ctx.arc(x + 170, f - 142, 11, 0, TAU);
            ctx.fill();
            ctx.restore();
            ctx.strokeStyle = hexToRgba(p.accent2, 0.5);
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x + 150, f - 152, 96, 0, TAU);
            ctx.stroke();
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = hexToRgba(i % 2 ? p.accent : p.accent2, 0.45);
                ctx.fillRect(x + 275 + (i % 2) * 56, f - 198 + Math.floor(i / 2) * 42, 34, 24);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + 280 + (i % 2) * 56, f - 182 + Math.floor(i / 2) * 42);
                ctx.lineTo(x + 300 + (i % 2) * 56, f - 190 + Math.floor(i / 2) * 42);
                ctx.stroke();
            }
            // Beliches.
            for (let i = 0; i < 3; i++) {
                const bx = x + 270 + i * 62;
                ctx.fillStyle = 'rgba(10, 18, 30, 0.8)';
                ctx.fillRect(bx, f - 54, 52, 8);
                ctx.fillRect(bx + 4, f - 54, 4, 32);
                ctx.fillRect(bx + 44, f - 54, 4, 32);
                ctx.fillStyle = hexToRgba(p.accent2, 0.14);
                ctx.fillRect(bx + 6, f - 64, 40, 10);
            }
            stageSign(ctx, x + 235, f - 284, 300, 'ÓRFÃOS DO AMANHECER', p.accent2, 28, 'SETOR RESIDENCIAL');
            break;
        }
        case 14: {
            const x = 60 - cameraX * 0.11;
            ctx.strokeStyle = hexToRgba(p.accent, 0.35);
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(x + 580, f - 300);
            ctx.lineTo(x + 680, f - 300);
            ctx.lineTo(x + 710, f - 120);
            ctx.stroke();
            for (let i = 0; i < 4; i++) {
                const bx = x + i * 125;
                ctx.fillStyle = hexToRgba(i % 2 ? p.accent : p.accent2, 0.15);
                roundRectPath(ctx, bx, f - 118, 105, 78, 4);
                ctx.fill();
                ctx.strokeStyle = hexToRgba(i % 2 ? p.accent : p.accent2, 0.42);
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.fillStyle = hexToRgba(p.accent2, 0.24);
                ctx.fillRect(bx + 12, f - 102, 34, 4);
            }
            // Nave atracada.
            ctx.fillStyle = 'rgba(9, 22, 36, 0.9)';
            ctx.beginPath();
            ctx.moveTo(x + 570, f - 186);
            ctx.lineTo(x + 760, f - 160);
            ctx.lineTo(x + 720, f - 118);
            ctx.lineTo(x + 540, f - 128);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = hexToRgba(p.accent, 0.5);
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = hexToRgba(p.accent, 0.7);
            ctx.fillRect(x + 736, f - 156, 16, 3);
            stageSign(ctx, x + 300, f - 190, 220, 'DOCA 3', p.accent2, 30, 'CARGA PESADA');
            break;
        }
        case 15: {
            const x = 150 - cameraX * 0.1;
            ctx.fillStyle = 'rgba(8, 12, 18, 0.82)';
            ctx.fillRect(x - 40, f - 300, 640, 300);
            ctx.strokeStyle = 'rgba(88, 118, 140, 0.35)';
            ctx.lineWidth = 8;
            ctx.strokeRect(x + 20, f - 270, 480, 270);
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(x + 60 + i * 92, f - 262);
                ctx.lineTo(x + 60 + i * 92, f);
                ctx.stroke();
            }
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = 'rgba(255, 42, 54, 0.55)';
                ctx.beginPath();
                ctx.arc(x + 100 + i * 190, f - 240, 4, 0, TAU);
                ctx.fill();
            }
            stageSign(ctx, x + 260, f - 292, 270, 'CORREDOR 7', '#ff5a5a', 30, 'ACESSO RESTRITO');
            ctx.fillStyle = hexToRgba(p.accent2, 0.16);
            ctx.fillRect(x + 410, f - 200, 70, 44);
            ctx.fillStyle = 'rgba(255, 80, 60, 0.6)';
            ctx.fillRect(x + 430, f - 118, 34, 4);
            break;
        }
        case 16: {
            const x = 420 - cameraX * 0.12;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createRadialGradient(x, f - 210, 4, x, f - 210, 160);
            g.addColorStop(0, 'rgba(111, 242, 255, 0.3)');
            g.addColorStop(1, 'rgba(111, 242, 255, 0)');
            ctx.fillStyle = g;
            ctx.fillRect(x - 180, f - 390, 360, 390);
            ctx.restore();
            ctx.fillStyle = 'rgba(10, 26, 38, 0.9)';
            ctx.fillRect(x - 34, f - 300, 68, 300);
            ctx.strokeStyle = hexToRgba(p.accent, 0.65);
            ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                const yy = f - 40 - i * 32;
                ctx.beginPath();
                ctx.ellipse(x + Math.sin(time * 0.7 + i) * 6, yy, 58 + (i % 3) * 12, 12, 0, 0, TAU);
                ctx.stroke();
            }
            for (let i = 0; i < 4; i++) {
                ctx.strokeStyle = hexToRgba(p.accent2, 0.3);
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(x + 30 + i * 18, f - 270 + i * 20);
                ctx.quadraticCurveTo(x + 200, f - 230 + i * 10, x + 280, f);
                ctx.stroke();
            }
            stageSign(ctx, x, f - 334, 250, 'NÚCLEO SOLACE', p.accent, 32, 'CÉREBRO DA ESTAÇÃO');
            break;
        }
        case 17: {
            const x = 110 - cameraX * 0.1;
            ctx.strokeStyle = hexToRgba(p.accent2, 0.4);
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(x, f - 140);
            ctx.lineTo(x + 350, f - 140);
            ctx.lineTo(x + 410, f - 80);
            ctx.stroke();
            // Torre de artilharia.
            ctx.fillStyle = 'rgba(12, 18, 30, 0.92)';
            ctx.beginPath();
            ctx.moveTo(x + 100, f - 140);
            ctx.lineTo(x + 170, f - 190);
            ctx.lineTo(x + 240, f - 140);
            ctx.lineTo(x + 210, f);
            ctx.lineTo(x + 130, f);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = hexToRgba(p.accent, 0.55);
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + 190, f - 186);
            ctx.lineTo(x + 290, f - 222);
            ctx.stroke();
            for (let i = 0; i < 4; i++) {
                ctx.strokeStyle = hexToRgba(p.accent2, 0.2);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(x + 470 + i * 130, f - 170, 14, 0, TAU);
                ctx.stroke();
            }
            stageSign(ctx, x + 250, f - 258, 260, 'ÓRBITA DE GUERRA', p.accent, 28, 'FROTA DE SOLACE');
            break;
        }
        case 18: {
            const x = 80 - cameraX * 0.08;
            ctx.strokeStyle = hexToRgba(p.accent2, 0.32);
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.arc(x + 520, f - 80, 280, 3.55, TAU + 0.45);
            ctx.stroke();
            for (let i = 0; i < 12; i++) {
                stageShard(ctx, x + 80 + i * 86, f - 120 - hash(i) * 170, 9 + hash(i + 2) * 14, i % 3 ? p.accent2 : p.accent, time * 0.08 + i, 0.38);
            }
            stageSign(ctx, x + 500, f - 90, 280, 'FALHA ESTRUTURAL', '#ff6a6a', 28, 'SOLACE EM RUÍNAS');
            ctx.strokeStyle = 'rgba(255, 80, 80, 0.45)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 300, f - 250);
            ctx.lineTo(x + 330, f - 180);
            ctx.lineTo(x + 315, f - 80);
            ctx.stroke();
            break;
        }
        case 19: {
            const x = 300 - cameraX * 0.12;
            ctx.fillStyle = hexToRgba(p.near, 0.9);
            ctx.fillRect(x - 20, f - 300, 34, 300);
            ctx.fillRect(x - 140, f - 298, 280, 14);
            ctx.strokeStyle = hexToRgba(p.accent, 0.55);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 132, f - 284);
            ctx.lineTo(x - 190, f - 230);
            ctx.lineTo(x - 150, f - 218);
            ctx.moveTo(x + 132, f - 284);
            ctx.lineTo(x + 190, f - 230);
            ctx.lineTo(x + 150, f - 218);
            ctx.stroke();
            stageCage(ctx, x - 172, f - 230, 70, 80, p.accent);
            stageCage(ctx, x + 172, f - 230, 70, 80, p.accent);
            stageSign(ctx, x, f - 330, 250, 'TRIBUNAL', p.accent, 32, 'OSSO E FERRO');
            break;
        }
        case 20: {
            const x = 40 - cameraX * 0.09;
            stageChain(ctx, x, f - 360, x + 620, f - 330, 80, p.accent, time, 18);
            stageChain(ctx, x + 360, f - 360, x + 980, f - 350, 100, p.accent2, time, 18);
            stageCage(ctx, x + 440, f - 260, 84, 96, p.accent);
            stageSign(ctx, x + 700, f - 108, 250, 'EXÍLIO', p.accent, 30, 'CORRENTES ETERNAS');
            break;
        }
        case 21: {
            const x = 80 - cameraX * 0.13;
            ctx.fillStyle = hexToRgba(p.near, 0.92);
            for (let i = 0; i < 5; i++) {
                const bx = x + i * 150;
                const bh = 150 + hash(i) * 120;
                ctx.fillRect(bx, f - bh, 100, bh);
                ctx.fillStyle = hexToRgba(p.accent, 0.24);
                ctx.fillRect(bx + 14, f - bh + 20, 18, 30);
                ctx.fillRect(bx + 60, f - bh + 58, 14, 22);
                ctx.fillStyle = hexToRgba(p.near, 0.92);
            }
            ctx.strokeStyle = hexToRgba(p.accent2, 0.28);
            ctx.lineWidth = 5;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(x, f - 70 - i * 24);
                ctx.lineTo(x + 760, f - 90 - i * 18);
                ctx.stroke();
            }
            stageSign(ctx, x + 340, f - 300, 230, 'COBRE', p.accent, 34, 'CIDADE DAS ALMAS');
            for (let i = 0; i < 6; i++) {
                const lx = x + 60 + i * 120;
                ctx.fillStyle = 'rgba(255, 170, 80, 0.35)';
                ctx.beginPath();
                ctx.arc(lx, f - 110 - (i % 3) * 14, 8, 0, TAU);
                ctx.fill();
            }
            break;
        }
        case 22: {
            const x = 360 - cameraX * 0.11;
            ctx.fillStyle = 'rgba(16, 8, 14, 0.9)';
            ctx.fillRect(x - 260, f - 26, 520, 26);
            ctx.fillStyle = hexToRgba(p.accent, 0.16);
            ctx.beginPath();
            ctx.moveTo(x - 200, f);
            ctx.lineTo(x - 120, f - 26);
            ctx.lineTo(x + 120, f - 26);
            ctx.lineTo(x + 200, f);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = hexToRgba(p.near, 0.96);
            ctx.fillRect(x - 100, f - 210, 200, 190);
            ctx.fillRect(x - 135, f - 250, 270, 48);
            ctx.fillRect(x - 150, f - 290, 42, 80);
            ctx.fillRect(x + 108, f - 290, 42, 80);
            stageSign(ctx, x, f - 338, 250, 'TRONO VAZIO', p.accent, 32, 'AUSÊNCIA');
            ctx.strokeStyle = hexToRgba(p.accent2, 0.35);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - 190, f - 20);
            ctx.lineTo(x - 190, f - 220);
            ctx.moveTo(x + 190, f - 20);
            ctx.lineTo(x + 190, f - 220);
            ctx.stroke();
            break;
        }
        case 23: {
            const x = 240 - cameraX * 0.12;
            ctx.fillStyle = hexToRgba(p.near, 0.94);
            ctx.fillRect(x - 160, f - 260, 320, 16);
            ctx.fillRect(x - 140, f - 260, 20, 260);
            ctx.fillRect(x + 120, f - 260, 20, 260);
            ctx.fillStyle = 'rgba(90, 94, 110, 0.55)';
            ctx.beginPath();
            ctx.moveTo(x - 120, f - 244);
            ctx.lineTo(x + 20, f - 244);
            ctx.lineTo(x + 80, f - 130);
            ctx.lineTo(x + 6, f - 180);
            ctx.lineTo(x - 64, f - 142);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = hexToRgba(p.accent, 0.65);
            ctx.lineWidth = 2;
            ctx.stroke();
            stageSign(ctx, x, f - 314, 230, 'A ÚLTIMA SENTENÇA', p.accent, 26, 'TRIBUNAL DO ABISMO');
            ctx.strokeStyle = 'rgba(255, 80, 80, 0.3)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
                ctx.beginPath();
                ctx.moveTo(x - 120 + i * 34, f - 16);
                ctx.lineTo(x - 120 + i * 34, f - 2);
                ctx.stroke();
            }
            break;
        }
        case 24: {
            const x = 350 - cameraX * 0.1;
            stageGate(ctx, x, f, 430, 330, p.accent, p.accent2);
            stageChain(ctx, x - 260, f - 360, x - 60, f - 230, 50, p.accent2, time, 10);
            stageChain(ctx, x + 260, f - 360, x + 60, f - 230, 50, p.accent2, time, 10);
            stageSign(ctx, x, f - 370, 250, 'PORTÕES CORROMPIDOS', p.accent, 26, 'FOME');
            break;
        }
        case 25: {
            const x = 80 - cameraX * 0.11;
            for (let i = 0; i < 4; i++) {
                stageArch(ctx, x + i * 165, f, 150, 250, hexToRgba(p.accent, 0.36), 4);
            }
            ctx.fillStyle = hexToRgba(p.near, 0.9);
            ctx.fillRect(x + 270, f - 88, 160, 88);
            ctx.strokeStyle = hexToRgba(p.accent, 0.65);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 350, f - 150);
            ctx.lineTo(x + 350, f - 240);
            ctx.moveTo(x + 326, f - 176);
            ctx.lineTo(x + 374, f - 176);
            ctx.stroke();
            stageBanner(ctx, x + 90, f - 310, 56, 120, p.accent, 'sword');
            stageBanner(ctx, x + 540, f - 310, 56, 120, p.accent, 'wing');
            stageSign(ctx, x + 350, f - 300, 250, 'O JURAMENTO', p.accent, 32, 'ORDEM DE AURORA');
            break;
        }
        case 26: {
            const x = 250 - cameraX * 0.1;
            ctx.fillStyle = 'rgba(7, 6, 12, 0.7)';
            ctx.fillRect(x - 80, f - 330, 460, 330);
            stageRose(ctx, x + 150, f - 150, 120, p.accent, p.accent2, time);
            for (let i = 0; i < 8; i++) {
                stageShard(ctx, x - 30 + i * 58, f - 250 + hash(i) * 150, 8 + hash(i + 1) * 10, i % 2 ? p.accent : p.accent2, i + time * 0.04, 0.4);
            }
            stageSign(ctx, x + 150, f - 360, 260, 'VITRAL PARTIDO', p.accent2, 28, 'CATEDRAL DE AURORA');
            break;
        }
        case 27: {
            const x = 130 - cameraX * 0.1;
            ctx.fillStyle = 'rgba(10, 26, 34, 0.55)';
            ctx.beginPath();
            ctx.ellipse(x + 350, f - 20, 310, 44, 0, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = hexToRgba(p.accent2, 0.35);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(x + 350, f - 20, 300, 38, 0, 0, TAU);
            ctx.stroke();
            for (let i = 0; i < 4; i++) {
                stageArch(ctx, x + i * 180, f - 40, 160, 190, hexToRgba(p.accent, 0.28), 3);
            }
            stageSign(ctx, x + 350, f - 286, 270, 'AURORA INTERIOR', p.accent2, 30, 'JARDIM DO VÉU');
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 3; i++) {
                ctx.strokeStyle = `rgba(160, 255, 220, ${0.12 + i * 0.03})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + 100, f - 200 - i * 18);
                ctx.bezierCurveTo(x + 280, f - 300, x + 460, f - 100, x + 650, f - 220 - i * 12);
                ctx.stroke();
            }
            ctx.restore();
            break;
        }
        case 28: {
            const x = 90 - cameraX * 0.11;
            stageOrgan(ctx, x + 120, f - 20, p.accent, time);
            ctx.fillStyle = hexToRgba(p.near, 0.9);
            ctx.fillRect(x, f - 110, 100, 110);
            ctx.fillRect(x + 560, f - 110, 100, 110);
            for (let i = 0; i < 4; i++) {
                ctx.fillStyle = hexToRgba(p.accent2, 0.35);
                ctx.beginPath();
                ctx.ellipse(x + 160 + i * 130, f - 150 - (i % 2) * 22, 18, 24, 0, 0, TAU);
                ctx.fill();
                ctx.fillStyle = hexToRgba('#0a0710', 0.7);
                ctx.beginPath();
                ctx.arc(x + 166 + i * 130, f - 144 - (i % 2) * 22, 8, 0, TAU);
                ctx.fill();
            }
            stageSign(ctx, x + 340, f - 310, 260, 'CORO DOS CAÍDOS', p.accent, 28, 'HINO SEM VOZ');
            break;
        }
        case 29: {
            const x = 100 - cameraX * 0.1;
            stageWing(ctx, x + 180, f - 300, 100, -1, p.accent, 0.55);
            stageWing(ctx, x + 760, f - 300, 100, 1, p.accent, 0.55);
            ctx.fillStyle = hexToRgba(p.near, 0.9);
            for (let i = 0; i < 6; i++) {
                ctx.fillRect(x + 140 + i * 80, f - 20 - i * 22, 560 - i * 80, 22);
            }
            for (let i = 0; i < 12; i++) {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = 'rgba(255, 220, 140, 0.4)';
                ctx.fillRect(x + 80 + i * 56, f - 34 - (i % 3) * 20, 2, 7);
                ctx.restore();
            }
            stageSign(ctx, x + 430, f - 334, 250, 'ASAS DE LUZ', p.accent, 32, 'MALAKHIM');
            break;
        }
        case 30: {
            const x = 260 - cameraX * 0.09;
            stageRift(ctx, x + 620, f - 530, 62, 420, p.accent, time);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 5; i++) {
                ctx.strokeStyle = `rgba(255, 244, 205, ${0.08 + i * 0.02})`;
                ctx.lineWidth = 2 + i * 2;
                ctx.beginPath();
                ctx.moveTo(x + 620 - 90, f - 360 + i * 26);
                ctx.quadraticCurveTo(x + 620, f - 150 + i * 22, x + 620 + 120, f - 330 + i * 26);
                ctx.stroke();
            }
            ctx.restore();
            ctx.fillStyle = hexToRgba(p.near, 0.88);
            ctx.fillRect(x, f - 180, 420, 180);
            stageArch(ctx, x + 20, f, 380, 250, hexToRgba(p.accent, 0.3), 5);
            ctx.strokeStyle = 'rgba(230, 230, 255, 0.25)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 210, f - 370);
            ctx.lineTo(x + 188, f - 280);
            ctx.lineTo(x + 225, f - 260);
            ctx.lineTo(x + 200, f - 160);
            ctx.stroke();
            for (let i = 0; i < 7; i++) {
                stageShard(ctx, x + 30 + i * 62, f - 130 - hash(i) * 120, 7 + hash(i + 1) * 8, p.accent2, time * 0.06 + i, 0.3);
            }
            stageSign(ctx, x + 210, f - 398, 240, 'VÉU RASGADO', p.accent, 28, 'FIM DO CÉU');
            break;
        }
        case 31: {
            const x = 90 - cameraX * 0.08;
            for (let i = 0; i < 5; i++) {
                stageMemory(ctx, x + 110 + i * 180, f - 150 - (i % 2) * 60, 80, 46, i % 2 ? p.accent : p.accent2, -0.2 + i * 0.1, time);
                ctx.fillStyle = hexToRgba(p.near, 0.55);
                ctx.beginPath();
                ctx.ellipse(x + 110 + i * 180, f - 60 + (i % 2) * 12, 54, 16, 0, 0, TAU);
                ctx.fill();
            }
            stageSign(ctx, x + 350, f - 350, 260, 'MAR DE ECOS', p.accent, 30, 'MEMÓRIAS PERDIDAS');
            break;
        }
        case 32: {
            const x = 80 - cameraX * 0.1;
            for (let i = 0; i < 4; i++) {
                stageCrystal(ctx, x + 130 + i * 190, f - 20, 100 + (i % 3) * 36, i % 2 ? p.accent2 : p.accent, time);
            }
            stageSign(ctx, x + 420, f - 300, 240, 'JARDIM DE VIDRO', p.accent2, 30, 'NEXUS');
            break;
        }
        case 33: {
            const x = 400 - cameraX * 0.1;
            stageRift(ctx, x + 220, f - 330, 48, 300, p.accent, time);
            for (let i = 0; i < 9; i++) {
                const side = i % 2 ? -1 : 1;
                ctx.fillStyle = 'rgba(230, 220, 240, 0.18)';
                ctx.beginPath();
                ctx.moveTo(x + 220, f - 300 + i * 24);
                ctx.lineTo(x + 220 + side * 46, f - 292 + i * 24);
                ctx.lineTo(x + 220 + side * 22, f - 278 + i * 24);
                ctx.closePath();
                ctx.fill();
            }
            stageEye(ctx, x + 220, f - 190, 26, 15, p.accent2, time);
            stageSign(ctx, x + 220, f - 365, 250, 'VOZES DO VÉU', p.accent, 28, 'A FOME OBSERVA');
            break;
        }
        case 34: {
            const x = 40 - cameraX * 0.08;
            ctx.strokeStyle = hexToRgba(p.accent2, 0.4);
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, f - 100);
            ctx.quadraticCurveTo(x + 400, f - 270, x + 900, f - 120);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, f - 90);
            ctx.quadraticCurveTo(x + 400, f - 250, x + 900, f - 110);
            ctx.stroke();
            for (let i = 0; i < 8; i++) {
                const t = i / 7;
                const bx = x + t * 900;
                const by = f - 100 + Math.sin(t * Math.PI) * -120;
                stageMemory(ctx, bx, by, 56, 32, i % 2 ? p.accent : p.accent2, -0.15 + t * 0.3, time);
            }
            stageSign(ctx, x + 450, f - 302, 250, 'PONTE DE MEMÓRIAS', p.accent, 26, 'PRIMEIRO ECO');
            break;
        }
        case 35: {
            const x = 430 - cameraX * 0.1;
            ctx.fillStyle = 'rgba(10, 7, 16, 0.92)';
            ctx.beginPath();
            ctx.moveTo(x - 170, f);
            ctx.lineTo(x - 170, f - 240);
            ctx.quadraticCurveTo(x, f - 380, x + 170, f - 240);
            ctx.lineTo(x + 170, f);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = hexToRgba(p.accent, 0.75);
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createLinearGradient(x, f - 320, x, f);
            g.addColorStop(0, 'rgba(255, 244, 205, 0.3)');
            g.addColorStop(1, 'rgba(255, 244, 205, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(x - 110, f);
            ctx.lineTo(x - 90, f - 230);
            ctx.quadraticCurveTo(x, f - 330, x + 90, f - 230);
            ctx.lineTo(x + 110, f);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            for (let i = 0; i < 5; i++) {
                ctx.fillStyle = 'rgba(20, 12, 30, 0.8)';
                ctx.fillRect(x - 190 - i * 16, f - 16 - i * 20, 380 + i * 32, 20);
            }
            stageSign(ctx, x, f - 398, 230, 'LIMIAR', p.accent, 34, 'ANTES DO FIM');
            break;
        }
        case 36: {
            const x = 300 - cameraX * 0.07;
            stageEye(ctx, x + 300, f - 220, 130, 70, p.accent, time);
            ctx.strokeStyle = hexToRgba(p.accent2, 0.25);
            ctx.lineWidth = 3;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.ellipse(x + 300, f - 220, 190 + i * 60, 74 + i * 26, time * 0.01, 0, TAU);
                ctx.stroke();
            }
            ctx.fillStyle = hexToRgba(p.near, 0.92);
            ctx.beginPath();
            ctx.moveTo(x - 80, f);
            ctx.lineTo(x - 30, f - 120);
            ctx.lineTo(x + 60, f - 180);
            ctx.lineTo(x + 140, f - 120);
            ctx.lineTo(x + 190, f);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = hexToRgba(p.accent, 0.45);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 20, f - 110);
            ctx.lineTo(x + 40, f - 154);
            ctx.lineTo(x + 74, f - 110);
            ctx.stroke();
            stageSign(ctx, x + 300, f - 342, 230, 'FERRATO', p.accent, 38, 'A GUERRA DOS DESPERTOS');
            break;
        }
        default:
            break;
    }
    ctx.restore();
}
/** Clima, poeira e luzes próprios de cada capítulo. */
function drawStageAtmosphere(ctx, stage, time) {
    const p = stage.palette;
    switch (stage.id) {
        case 1:
            stageRain(ctx, stage, time, p.accent2);
            stageMotes(ctx, stage, p.accent, 12, 'rise', time, 18, 1.4, 0.32);
            stageLightning(ctx, stage, time, p.accent2);
            break;
        case 2:
            stageMotes(ctx, stage, p.accent, 26, 'drift', time, 46, 2.2, 0.4);
            stageMotes(ctx, stage, p.accent2, 8, 'rise', time, 20, 1.2, 0.26);
            break;
        case 3:
            stageMotes(ctx, stage, p.accent2, 18, 'rise', time, 12, 2.6, 0.18);
            stageMotes(ctx, stage, p.accent, 8, 'drift', time, 28, 1.2, 0.28);
            break;
        case 4:
            stageRain(ctx, stage, time, p.accent2);
            stageMotes(ctx, stage, p.accent, 10, 'drift', time, 80, 1.3, 0.26);
            break;
        case 5:
            stageMotes(ctx, stage, p.accent, 24, 'rise', time, 44, 1.5, 0.55);
            stageMotes(ctx, stage, '#8dffb4', 10, 'rise', time, 26, 1.3, 0.28);
            break;
        case 6:
            stageMotes(ctx, stage, p.accent, 18, 'rise', time, 32, 1.5, 0.44);
            stageLightning(ctx, stage, time, p.accent2);
            break;
        case 7:
            stageMotes(ctx, stage, p.accent2, 24, 'fall', time, 22, 1.6, 0.35);
            stageMotes(ctx, stage, p.accent, 6, 'rise', time, 14, 1.2, 0.24);
            break;
        case 8:
            stageMotes(ctx, stage, p.accent, 20, 'rise', time, 16, 2.4, 0.22);
            stageMotes(ctx, stage, p.accent2, 8, 'fall', time, 18, 1.2, 0.3);
            break;
        case 9:
            stageMotes(ctx, stage, '#5fffc1', 16, 'rise', time, 20, 1.5, 0.4);
            stageMotes(ctx, stage, p.accent2, 10, 'fall', time, 16, 1.2, 0.24);
            break;
        case 10:
            stageMotes(ctx, stage, p.accent, 18, 'rise', time, 24, 1.3, 0.45);
            stageMotes(ctx, stage, '#ffe4a3', 8, 'drift', time, 18, 1.1, 0.28);
            break;
        case 11:
            stageMotes(ctx, stage, p.accent, 30, 'rise', time, 56, 1.8, 0.55);
            stageMotes(ctx, stage, p.accent2, 8, 'drift', time, 24, 1.2, 0.2);
            break;
        case 12:
            stageMotes(ctx, stage, p.accent2, 30, 'fall', time, 18, 1.8, 0.35);
            stageMotes(ctx, stage, p.accent, 8, 'rise', time, 12, 1.2, 0.22);
            break;
        case 13:
            stageMotes(ctx, stage, '#bfe9ff', 16, 'drift', time, 18, 1.4, 0.3);
            stageMotes(ctx, stage, p.accent2, 8, 'rise', time, 10, 1.1, 0.22);
            break;
        case 14:
            stageMotes(ctx, stage, p.accent2, 18, 'fall', time, 38, 1.4, 0.38);
            stageMotes(ctx, stage, p.accent, 8, 'drift', time, 22, 1.2, 0.22);
            break;
        case 15: {
            const alarm = 0.035 + Math.max(0, Math.sin(time * 3.1)) * 0.07;
            const g = ctx.createLinearGradient(0, 0, W, H);
            g.addColorStop(0, `rgba(255, 32, 42, ${alarm})`);
            g.addColorStop(0.55, 'rgba(255, 32, 42, 0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
            stageMotes(ctx, stage, p.accent2, 12, 'rise', time, 14, 1.4, 0.2);
            break;
        }
        case 16:
            stageMotes(ctx, stage, p.accent, 28, 'orbit', time, 24, 1.7, 0.48);
            stageMotes(ctx, stage, p.accent2, 8, 'rise', time, 18, 1.3, 0.22);
            break;
        case 17:
            stageMotes(ctx, stage, p.accent2, 18, 'drift', time, 52, 1.2, 0.3);
            if ((time * 0.5 + stage.id) % 3.4 < 0.08) {
                ctx.fillStyle = 'rgba(255, 190, 140, 0.09)';
                ctx.fillRect(0, 0, W, H);
            }
            break;
        case 18:
            stageMotes(ctx, stage, p.accent2, 22, 'drift', time, 26, 1.6, 0.32);
            stageMotes(ctx, stage, p.accent, 6, 'orbit', time, 18, 1.4, 0.2);
            break;
        case 19:
            stageMotes(ctx, stage, p.accent, 24, 'rise', time, 38, 1.5, 0.5);
            stageMotes(ctx, stage, p.accent2, 8, 'fall', time, 14, 1.2, 0.22);
            break;
        case 20:
            stageMotes(ctx, stage, p.accent2, 22, 'fall', time, 18, 1.3, 0.26);
            stageMotes(ctx, stage, p.accent, 8, 'drift', time, 16, 1.2, 0.3);
            break;
        case 21:
            stageMotes(ctx, stage, p.accent, 18, 'rise', time, 24, 1.6, 0.4);
            stageMotes(ctx, stage, p.accent2, 10, 'drift', time, 34, 1.2, 0.22);
            break;
        case 22:
            stageMotes(ctx, stage, '#ff3357', 16, 'fall', time, 28, 1.5, 0.36);
            stageMotes(ctx, stage, p.accent2, 8, 'rise', time, 12, 1.2, 0.2);
            break;
        case 23:
            stageMotes(ctx, stage, p.accent, 24, 'rise', time, 42, 1.4, 0.48);
            stageMotes(ctx, stage, p.accent2, 8, 'fall', time, 20, 1.1, 0.22);
            break;
        case 24:
            stageMotes(ctx, stage, p.accent, 22, 'orbit', time, 28, 1.6, 0.45);
            stageMotes(ctx, stage, p.accent2, 8, 'rise', time, 14, 1.2, 0.24);
            break;
        case 25:
            stageMotes(ctx, stage, '#fff4cd', 22, 'rise', time, 26, 1.4, 0.42);
            stageMotes(ctx, stage, p.accent2, 8, 'drift', time, 14, 1.2, 0.22);
            break;
        case 26:
            stageMotes(ctx, stage, p.accent, 18, 'fall', time, 30, 1.4, 0.35);
            stageMotes(ctx, stage, p.accent2, 14, 'drift', time, 20, 1.5, 0.3);
            break;
        case 27:
            stageMotes(ctx, stage, '#b8ffe0', 18, 'drift', time, 22, 1.5, 0.32);
            stageMotes(ctx, stage, p.accent, 10, 'rise', time, 14, 1.3, 0.24);
            break;
        case 28:
            stageMotes(ctx, stage, p.accent, 14, 'rise', time, 18, 1.3, 0.3);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = 'rgba(255, 244, 205, 0.12)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(640, 300, 90 + i * 38 + Math.sin(time * 0.7 + i) * 10, 0.25, Math.PI - 0.25);
                ctx.stroke();
            }
            ctx.restore();
            break;
        case 29:
            stageMotes(ctx, stage, '#ffe6a3', 24, 'fall', time, 28, 1.5, 0.4);
            stageMotes(ctx, stage, '#fff4cd', 8, 'rise', time, 14, 1.2, 0.24);
            break;
        case 30:
            stageMotes(ctx, stage, '#ffffff', 26, 'fall', time, 34, 1.5, 0.34);
            stageMotes(ctx, stage, p.accent2, 8, 'drift', time, 18, 1.2, 0.2);
            break;
        case 31:
            stageMotes(ctx, stage, p.accent, 20, 'drift', time, 18, 1.3, 0.3);
            stageMotes(ctx, stage, p.accent2, 10, 'orbit', time, 16, 1.2, 0.24);
            break;
        case 32:
            stageMotes(ctx, stage, p.accent2, 20, 'drift', time, 24, 1.4, 0.34);
            stageMotes(ctx, stage, '#ff8ae2', 10, 'rise', time, 18, 1.2, 0.28);
            break;
        case 33:
            stageMotes(ctx, stage, p.accent, 18, 'orbit', time, 20, 1.4, 0.32);
            for (let i = 0; i < 14; i++) {
                const y = hash(i + stage.id) * H;
                const x = (hash(i * 7) * W + time * (14 + i)) % W;
                ctx.fillStyle = `rgba(230, 220, 240, ${0.04 + hash(i) * 0.08})`;
                ctx.fillRect(x, y, 20 + hash(i + 4) * 70, 1);
            }
            break;
        case 34:
            stageMotes(ctx, stage, p.accent2, 24, 'orbit', time, 22, 1.4, 0.35);
            stageMotes(ctx, stage, p.accent, 8, 'drift', time, 16, 1.2, 0.22);
            break;
        case 35:
            stageMotes(ctx, stage, '#fff4cd', 26, 'rise', time, 30, 1.5, 0.42);
            stageMotes(ctx, stage, p.accent2, 8, 'drift', time, 20, 1.2, 0.2);
            break;
        case 36:
            stageMotes(ctx, stage, p.accent, 26, 'orbit', time, 26, 1.7, 0.42);
            stageMotes(ctx, stage, p.accent2, 10, 'rise', time, 14, 1.3, 0.24);
            break;
    }
}
/** Desenha o cenário completo de uma fase. */
export function drawStageBackground(ctx, stage, cameraX, time) {
    const p = stage.palette;
    drawSky(ctx, stage, cameraX, time);
    drawStageSky(ctx, stage, cameraX, time);
    switch (stage.arc) {
        case 1:
            cityFar(ctx, stage, cameraX);
            cityMid(ctx, stage, cameraX);
            break;
        case 2:
            ruinsFar(ctx, stage, cameraX);
            ruinsMid(ctx, stage, cameraX);
            break;
        case 3:
            spaceFar(ctx, stage, cameraX);
            spaceMid(ctx, stage, cameraX);
            break;
        case 4:
            hellFar(ctx, stage, cameraX);
            hellMid(ctx, stage, cameraX, time);
            break;
        case 5:
            heavenFar(ctx, stage, cameraX, time);
            heavenMid(ctx, stage, cameraX, time);
            break;
        case 6:
        default:
            nexusFar(ctx, stage, cameraX, time);
            nexusMid(ctx, stage, cameraX, time);
            break;
    }
    drawStageLandmark(ctx, stage, cameraX, time);
    // Faixa de neblina entre cenário e chão.
    fog(ctx, p.fog, stage.floor - 190, 210, 1);
    drawGroundBase(ctx, stage);
    switch (stage.arc) {
        case 1:
            cityGround(ctx, stage, cameraX, time);
            break;
        case 2:
            ruinsGround(ctx, stage, cameraX, time);
            break;
        case 3:
            spaceGround(ctx, stage, cameraX, time);
            break;
        case 4:
            hellGround(ctx, stage, cameraX, time);
            break;
        case 5:
            heavenGround(ctx, stage, cameraX);
            break;
        case 6:
        default:
            nexusGround(ctx, stage, cameraX, time);
            break;
    }
    // Vinheta superior e inferior.
    const top = ctx.createLinearGradient(0, 0, 0, 150);
    top.addColorStop(0, 'rgba(0,0,0,0.5)');
    top.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, 150);
    drawAmbient(ctx, stage, time);
    drawStageAtmosphere(ctx, stage, time);
}
/** Fundo animado do menu principal: o Nexus observando. */
export function drawTitleBackground(ctx, time) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#05030b');
    g.addColorStop(0.55, '#150b2a');
    g.addColorStop(1, '#08040f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // Nebulosas.
    const n1 = ctx.createRadialGradient(920, 300, 20, 920, 300, 480);
    n1.addColorStop(0, 'rgba(255,138,226,0.18)');
    n1.addColorStop(0.4, 'rgba(180,139,255,0.09)');
    n1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = n1;
    ctx.fillRect(0, 0, W, H);
    const n2 = ctx.createRadialGradient(190, 500, 20, 190, 500, 420);
    n2.addColorStop(0, 'rgba(86,227,255,0.1)');
    n2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = n2;
    ctx.fillRect(0, 0, W, H);
    // Estrelas.
    for (let i = 0; i < 170; i++) {
        const x = hash(i * 5) * W;
        const y = hash(i * 9 + 2) * H;
        const a = 0.25 + Math.abs(Math.sin(time * (0.4 + hash(i) * 1.4) + i)) * 0.6;
        ctx.fillStyle = hexToRgba(i % 7 === 0 ? '#ff8ae2' : '#ffffff', a);
        ctx.fillRect(x, y, i % 11 === 0 ? 2 : 1, i % 11 === 0 ? 2 : 1);
    }
    // Aros do Véu.
    ctx.save();
    ctx.translate(920, 320);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = hexToRgba(i % 2 ? '#b48bff' : '#ff8ae2', 0.1 + i * 0.015);
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 210 + i * 58, 58 + i * 20, 0.16 + Math.sin(time * 0.1 + i) * 0.04, 0, TAU);
        ctx.stroke();
    }
    ctx.restore();
    // Olho.
    const blink = Math.max(0, Math.sin(time * 0.42 + 2.2));
    const open = 0.45 + (1 - Math.pow(blink, 8)) * 0.55;
    ctx.save();
    ctx.translate(920, 320);
    ctx.globalCompositeOperation = 'lighter';
    const eg = ctx.createRadialGradient(0, 0, 8, 0, 0, 170);
    eg.addColorStop(0, 'rgba(255,255,255,0.9)');
    eg.addColorStop(0.12, 'rgba(255,138,226,0.75)');
    eg.addColorStop(0.45, 'rgba(180,139,255,0.25)');
    eg.addColorStop(1, 'rgba(180,139,255,0)');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.ellipse(0, 0, 150, 92 * open, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 150, 92 * open, 0, 0, TAU);
    ctx.stroke();
    // Íris.
    const ig = ctx.createRadialGradient(-12, -8, 4, 0, 0, 48);
    ig.addColorStop(0, '#0a0612');
    ig.addColorStop(0.5, '#3a0a5a');
    ig.addColorStop(1, '#ff8ae2');
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.ellipse(0, 0, 38, 38 * open, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#05030b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 30 * open, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(-14, -12, 5, 0, TAU);
    ctx.fill();
    ctx.restore();
    // Fragmentos.
    for (let i = 0; i < 18; i++) {
        const x = hash(i * 13 + 1) * W;
        const y = 80 + hash(i * 7 + 4) * 500;
        const s = 4 + hash(i) * 14;
        const a = time * (0.04 + hash(i + 2) * 0.1);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a + hash(i) * TAU);
        ctx.fillStyle = hexToRgba(i % 3 === 0 ? '#ff8ae2' : '#b48bff', 0.12 + hash(i) * 0.12);
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.5, s * 0.4);
        ctx.lineTo(-s * 0.35, s * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    // Plataforma / silhuetas ao fundo.
    const fg = ctx.createLinearGradient(0, 560, 0, H);
    fg.addColorStop(0, 'rgba(5,3,11,0)');
    fg.addColorStop(0.5, 'rgba(5,3,11,0.75)');
    fg.addColorStop(1, '#05030b');
    ctx.fillStyle = fg;
    ctx.fillRect(0, 540, W, H - 540);
    // Chão com fissuras.
    ctx.fillStyle = 'rgba(8,4,16,0.92)';
    ctx.beginPath();
    ctx.moveTo(0, 630);
    ctx.lineTo(W, 610);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 9; i++) {
        const x = 80 + i * 150;
        ctx.strokeStyle = hexToRgba(i % 2 ? '#b48bff' : '#ff8ae2', 0.16);
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(x, 640);
        ctx.lineTo(x - 20, 680);
        ctx.lineTo(x + 16, 706);
        ctx.stroke();
    }
    // Brasas flutuantes.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 40; i++) {
        const x = (hash(i * 3) * W + time * (6 + hash(i) * 12)) % W;
        const y = H - ((hash(i * 7) * H + time * (18 + hash(i + 2) * 40)) % (H + 60));
        const a = 0.18 + hash(i + 3) * 0.35;
        ctx.fillStyle = hexToRgba(i % 2 ? '#ff8ae2' : '#b48bff', a);
        ctx.beginPath();
        ctx.arc(x, y, 1 + hash(i) * 2.2, 0, TAU);
        ctx.fill();
    }
    ctx.restore();
}
//# sourceMappingURL=backgrounds.js.map