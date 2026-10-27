/**
 * Cenários procedurais com parallax para as seis fases e para o menu.
 * Nenhuma imagem externa é usada: tudo é desenhado no Canvas.
 */
import { clamp, hexToRgba, TAU } from '../core/math.js';
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
/** Desenha o cenário completo de uma fase. */
export function drawStageBackground(ctx, stage, cameraX, time) {
    const p = stage.palette;
    drawSky(ctx, stage, cameraX, time);
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