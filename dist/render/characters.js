/** Ilustração procedural dos seis Despertos (corpo inteiro, retratos e poses). */
import { clamp, easeInCubic, easeOutCubic, hexToRgba, lerp, mixColor, TAU } from '../core/math.js';
import { CHARACTERS } from '../data/characters.js';
import { glow, joint, limb, roundRectPath } from './theme.js';
const BASE = {
    bob: 0,
    lean: 0.04,
    crouch: 0,
    armFront: 0.22,
    armFrontElbow: 0.3,
    armBack: -0.18,
    armBackElbow: 0.28,
    legFront: 0.12,
    legFrontKnee: 0.04,
    legBack: -0.14,
    legBackKnee: 0.05,
    headTilt: 0,
    weaponA: -0.35,
    weaponGrip: 0,
    bodyRot: 0,
    alpha: 1,
    airborne: false,
};
function playerBuild(p, time) {
    const b = { ...BASE };
    b.alpha = p.dead ? clamp(1 - p.deathTimer / 1.4, 0, 1) : 1;
    if (p.dead) {
        b.bodyRot = -Math.min(1.45, p.deathTimer * 2.2);
        b.armFront = 1.4;
        b.armBack = 1.1;
        b.legFront = 0.5;
        b.legBack = -0.3;
        b.bob = Math.min(6, p.deathTimer * 10);
        return b;
    }
    if (p.attack) {
        const a = p.attack;
        const d = a.def;
        const t = a.t;
        let sweep = 0;
        if (t < d.startup)
            sweep = -easeOutCubic(t / Math.max(0.001, d.startup));
        else if (t < d.startup + d.active)
            sweep = lerp(-1, 1, easeOutCubic((t - d.startup) / Math.max(0.001, d.active)));
        else
            sweep = 1 - easeInCubic((t - d.startup - d.active) / Math.max(0.001, d.recovery));
        const thrust = d.w > 0 && d.h < 70;
        b.lean = 0.06 + Math.max(0, sweep) * 0.22;
        b.crouch = 0.18 + Math.max(0, -sweep) * 0.1;
        b.armFront = thrust ? -0.9 + (sweep + 1) * 0.55 : -1.2 + (sweep + 1) * 0.75;
        b.armFrontElbow = thrust ? 0.05 : 0.1;
        b.armBack = -0.9 - Math.max(0, sweep) * 0.5;
        b.armBackElbow = 0.4;
        b.weaponA = -1.9 + (sweep + 1) * 1.55;
        b.legFront = 0.42;
        b.legFrontKnee = 0.12;
        b.legBack = -0.34;
        b.legBackKnee = 0.2;
        b.bob = 0;
        b.headTilt = -0.06 * Math.max(0, sweep);
        return b;
    }
    if (p.state === 'dash') {
        b.lean = 0.58;
        b.crouch = 0.28;
        b.armFront = -0.9;
        b.armBack = -1.2;
        b.armFrontElbow = 0.1;
        b.armBackElbow = 0.1;
        b.legFront = 0.85;
        b.legBack = -0.75;
        b.legFrontKnee = 0.15;
        b.legBackKnee = 0.5;
        b.bob = 2;
        return b;
    }
    if (p.state === 'hurt') {
        b.lean = -0.28;
        b.armFront = 1.5;
        b.armBack = 1.9;
        b.headTilt = -0.2;
        b.legFront = 0.25;
        b.legBack = -0.35;
        return b;
    }
    if (!p.onGround) {
        const rising = p.vy < 0;
        b.airborne = true;
        b.lean = rising ? 0.12 : -0.05;
        b.legFront = rising ? 0.75 : 0.35;
        b.legFrontKnee = rising ? 1.15 : 0.3;
        b.legBack = rising ? -0.1 : -0.45;
        b.legBackKnee = rising ? 0.8 : 0.35;
        b.armFront = rising ? 2.1 : 1.3;
        b.armFrontElbow = 0.4;
        b.armBack = rising ? -0.9 : -1.4;
        b.armBackElbow = 0.5;
        b.weaponA = rising ? -1.4 : -0.9;
        b.bob = 0;
        return b;
    }
    if (p.state === 'run') {
        const cycle = Math.sin(p.walkPhase);
        const cycle2 = Math.cos(p.walkPhase);
        b.lean = 0.2;
        b.legFront = cycle * 0.85;
        b.legBack = -cycle * 0.85;
        b.legFrontKnee = Math.max(0, -cycle) * 0.9;
        b.legBackKnee = Math.max(0, cycle) * 0.9;
        b.armFront = -cycle * 0.9;
        b.armBack = cycle * 0.9;
        b.armFrontElbow = 0.45;
        b.armBackElbow = 0.4;
        b.bob = Math.abs(cycle2) * 1.6;
        b.headTilt = 0.02;
        b.weaponA = -0.7 + cycle * 0.15;
        return b;
    }
    // idle
    b.bob = Math.sin(time * 2.1 + p.animTime * 0.2) * 1.4;
    b.lean = 0.04 + Math.sin(time * 1.4) * 0.012;
    b.armFront = 0.22 + Math.sin(time * 1.7) * 0.05;
    b.armBack = -0.18 - Math.sin(time * 1.6) * 0.05;
    b.weaponA = -0.3;
    return b;
}
function tint(color, flash) {
    return flash > 0 ? mixColor(color, '#ffffff', clamp(flash * 4.5, 0, 0.88)) : color;
}
/** Desenha o corpo inteiro de um personagem, com origem nos pés. */
export function drawCharacterFigure(ctx, def, x, y, facing, scale, time, build, flash = 0) {
    const c = def.colors;
    const skin = tint(c.skin, flash);
    const primary = tint(c.primary, flash);
    const secondary = tint(c.secondary, flash);
    const accent = tint(c.accent, flash);
    const hair = tint(c.hair, flash);
    const dark = tint('#0d0b14', flash);
    const outline = 'rgba(6, 5, 10, 0.9)';
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing * scale, scale);
    ctx.rotate(build.bodyRot);
    ctx.globalAlpha = build.alpha;
    // Sombra / presença.
    glow(ctx, 0, -46, 46, c.aura, 0.12 + Math.sin(time * 3) * 0.02);
    const hipY = -47 + build.crouch * 7 + build.bob;
    const hipX = build.lean * 3;
    const chestY = hipY - 31;
    const chestX = hipX + build.lean * 9;
    const neckY = chestY - 11;
    const neckX = chestX + build.lean * 2;
    const headY = neckY - 12;
    const headX = neckX + build.headTilt * 5;
    const shoulderF = { x: chestX + 4, y: chestY + 3 };
    const shoulderB = { x: chestX - 4, y: chestY + 3 };
    const hipF = { x: hipX + 2, y: hipY };
    const hipB = { x: hipX - 2, y: hipY };
    const elbowF = joint(shoulderF.x, shoulderF.y, 19, build.armFront);
    const handF = joint(elbowF.x, elbowF.y, 18, build.armFront + build.armFrontElbow);
    const elbowB = joint(shoulderB.x, shoulderB.y, 19, build.armBack);
    const handB = joint(elbowB.x, elbowB.y, 18, build.armBack + build.armBackElbow);
    const kneeF = joint(hipF.x, hipF.y, 23, build.legFront);
    const footF = joint(kneeF.x, kneeF.y, 24, build.legFront + build.legFrontKnee);
    const kneeB = joint(hipB.x, hipB.y, 23, build.legBack);
    const footB = joint(kneeB.x, kneeB.y, 24, build.legBack + build.legBackKnee);
    const isWide = def.id === 'miriam';
    const isSlim = def.id === 'kael' || def.id === 'thryc';
    // Membro posterior.
    limb(ctx, hipB.x, hipB.y, kneeB.x, kneeB.y, isWide ? 13 : 10, dark);
    limb(ctx, kneeB.x, kneeB.y, footB.x, footB.y, isWide ? 12 : 9, secondary);
    ctx.fillStyle = dark;
    roundRectPath(ctx, footB.x - 5, footB.y - 3, isWide ? 16 : 13, 7, 3);
    ctx.fill();
    limb(ctx, shoulderB.x, shoulderB.y, elbowB.x, elbowB.y, isSlim ? 7 : 9, dark);
    limb(ctx, elbowB.x, elbowB.y, handB.x, handB.y, isSlim ? 6 : 8, secondary);
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(handB.x, handB.y, isSlim ? 3.6 : 4.6, 0, TAU);
    ctx.fill();
    // Mochila, tanque, asa quebrada ou halo: assinatura visual de cada Desperto.
    drawBackAccessory(ctx, def, chestX, chestY, hipY, time, flash, build);
    // Capa / sobretudo de Ozric.
    if (def.id === 'ozric') {
        const flap = Math.sin(time * 2.4) * 6;
        ctx.fillStyle = tint('#1a1018', flash);
        ctx.beginPath();
        ctx.moveTo(chestX - 10, chestY - 4);
        ctx.quadraticCurveTo(chestX - 26 - flap, hipY + 20, hipX - 20 - flap * 0.4, hipY + 44);
        ctx.quadraticCurveTo(hipX - 4, hipY + 26, hipX + 2, hipY + 12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = tint('#3a1622', flash);
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    // Torso.
    ctx.beginPath();
    const chestW = isWide ? 17 : isSlim ? 10.5 : 13;
    const hipW = isWide ? 13 : isSlim ? 8.5 : 10.5;
    ctx.moveTo(hipX - hipW, hipY + 2);
    ctx.quadraticCurveTo(chestX - chestW - 2, chestY + 8, chestX - chestW, chestY);
    ctx.quadraticCurveTo(chestX, chestY - 7, chestX + chestW, chestY + 1);
    ctx.quadraticCurveTo(chestX + chestW + 2, chestY + 8, hipX + hipW, hipY + 2);
    ctx.quadraticCurveTo(hipX, hipY + 8, hipX - hipW, hipY + 2);
    ctx.closePath();
    ctx.fillStyle = primary;
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // Detalhes de traje.
    ctx.save();
    ctx.globalAlpha *= 0.9;
    if (def.id === 'ravi') {
        ctx.fillStyle = secondary;
        ctx.beginPath();
        ctx.moveTo(chestX - 6, chestY + 2);
        ctx.lineTo(chestX + 6, chestY + 2);
        ctx.lineTo(hipX + 4, hipY);
        ctx.lineTo(hipX - 4, hipY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(chestX - 8, chestY + 6);
        ctx.lineTo(chestX + 7, chestY + 2);
        ctx.stroke();
    }
    else if (def.id === 'miriam') {
        ctx.fillStyle = tint('#3a2a22', flash);
        roundRectPath(ctx, chestX - 14, chestY - 2, 28, 17, 5);
        ctx.fill();
        ctx.fillStyle = tint('#ff6a2b', flash);
        ctx.globalAlpha *= 0.8;
        ctx.beginPath();
        ctx.arc(chestX + 6, chestY + 8, 3, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = build.alpha;
    }
    else if (def.id === 'kael') {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.3;
        ctx.globalAlpha *= 0.9;
        ctx.beginPath();
        ctx.moveTo(chestX - 7, chestY + 12);
        ctx.lineTo(chestX, chestY + 4);
        ctx.lineTo(chestX + 7, chestY + 12);
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(chestX, chestY + 10, 2.2, 0, TAU);
        ctx.fill();
    }
    else if (def.id === 'ozric') {
        ctx.strokeStyle = '#ff3357';
        ctx.lineWidth = 1;
        ctx.globalAlpha *= 0.7;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            ctx.moveTo(chestX - 8 + i * 7, chestY + 2);
            ctx.quadraticCurveTo(chestX - 4 + i * 6, chestY + 12, chestX - 7 + i * 7, hipY - 2);
        }
        ctx.stroke();
    }
    else if (def.id === 'elodie') {
        ctx.fillStyle = tint('#fff4cd', flash);
        ctx.globalAlpha *= 0.55;
        ctx.beginPath();
        ctx.arc(chestX, chestY + 9, 4, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = build.alpha;
        ctx.strokeStyle = tint(c.secondary, flash);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(hipX - 10, hipY - 2);
        ctx.lineTo(chestX + 4, chestY + 10);
        ctx.stroke();
    }
    else if (def.id === 'thryc') {
        const g = ctx.createLinearGradient(chestX - 14, chestY, chestX + 14, hipY + 6);
        g.addColorStop(0, 'rgba(120, 240, 255, 0.45)');
        g.addColorStop(0.5, 'rgba(180, 139, 255, 0.5)');
        g.addColorStop(1, 'rgba(255, 138, 226, 0.4)');
        ctx.fillStyle = g;
        ctx.globalAlpha *= 0.7;
        ctx.beginPath();
        ctx.moveTo(chestX - 9, chestY + 3);
        ctx.lineTo(chestX + 9, chestY + 3);
        ctx.lineTo(hipX + 7, hipY - 2);
        ctx.lineTo(hipX - 7, hipY - 2);
        ctx.closePath();
        ctx.fill();
        for (let i = 0; i < 5; i++) {
            const sx = chestX + Math.sin(time * 2 + i * 3.4) * 9;
            const sy = chestY + 8 + Math.cos(time * 1.7 + i * 2.1) * 14;
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.7;
            ctx.fillRect(sx, sy, 1.3, 1.3);
        }
        ctx.globalAlpha = build.alpha;
    }
    ctx.restore();
    // Cinto.
    ctx.fillStyle = tint('#15121c', flash);
    ctx.fillRect(hipX - hipW - 1, hipY - 3, hipW * 2 + 2, 4);
    ctx.fillStyle = accent;
    ctx.fillRect(hipX - 2, hipY - 3, 4, 4);
    // Perna dianteira.
    limb(ctx, hipF.x, hipF.y, kneeF.x, kneeF.y, isWide ? 14 : 10.5, dark);
    limb(ctx, kneeF.x, kneeF.y, footF.x, footF.y, isWide ? 13 : 9.5, secondary);
    ctx.fillStyle = dark;
    roundRectPath(ctx, footF.x - 5, footF.y - 3, isWide ? 18 : 14, 7, 3);
    ctx.fill();
    if (def.id === 'miriam') {
        ctx.fillStyle = tint('#2a2020', flash);
        roundRectPath(ctx, footF.x - 6, footF.y - 7, 18, 9, 3);
        ctx.fill();
    }
    drawFootwear(ctx, def, footF, footB, time, flash);
    // Braço dianteiro.
    limb(ctx, shoulderF.x, shoulderF.y, elbowF.x, elbowF.y, isSlim ? 7 : 9, dark);
    limb(ctx, elbowF.x, elbowF.y, handF.x, handF.y, isSlim ? 6.2 : 8, secondary);
    // Cabeça.
    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(build.headTilt);
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(0, 0, isSlim ? 8 : 9, isSlim ? 10 : 10.5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // Olhos.
    ctx.fillStyle = c.eye;
    if (def.id === 'thryc') {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha *= 0.8;
        ctx.beginPath();
        ctx.arc(-3, -1, 1.6, 0, TAU);
        ctx.arc(3.4, -1, 1.6, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = build.alpha;
    }
    else if (def.id === 'kael') {
        ctx.fillStyle = '#56e3ff';
        ctx.fillRect(1.5, -3, 3, 2);
        ctx.fillStyle = '#b48bff';
        ctx.fillRect(-5, -3, 3, 2);
    }
    else {
        ctx.beginPath();
        ctx.arc(4.2, -2, 1.5, 0, TAU);
        ctx.fill();
    }
    // Cabelo / elmo / chifres.
    drawHeadwear(ctx, def, time, flash);
    // Extras de cabeça.
    if (def.id === 'elodie') {
        ctx.strokeStyle = 'rgba(255, 230, 163, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, -16, 13, 4, -0.15, 0.3, Math.PI * 2 - 0.5);
        ctx.stroke();
    }
    if (def.id === 'ozric') {
        ctx.strokeStyle = tint('#8a2030', flash);
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-6, -8);
        ctx.quadraticCurveTo(-16, -20, -9, -28);
        ctx.moveTo(6, -8);
        ctx.quadraticCurveTo(16, -20, 9, -28);
        ctx.stroke();
        ctx.strokeStyle = '#ff3357';
        ctx.lineWidth = 1;
        ctx.globalAlpha *= 0.7;
        ctx.beginPath();
        ctx.moveTo(-14, -6);
        ctx.lineTo(-12, -1);
        ctx.moveTo(14, -6);
        ctx.lineTo(12, -1);
        ctx.stroke();
        ctx.globalAlpha = build.alpha;
    }
    ctx.restore();
    // Braços com detalhes (luvas, manoplas).
    if (def.weapon === 'gauntlets' && def.id === 'miriam') {
        ctx.fillStyle = tint('#3b2a26', flash);
        roundRectPath(ctx, handF.x - 8, handF.y - 8, 16, 15, 5);
        ctx.fill();
        ctx.strokeStyle = tint('#ff9b3c', flash);
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.fillStyle = tint('#3b2a26', flash);
        roundRectPath(ctx, handB.x - 7, handB.y - 7, 14, 13, 5);
        ctx.fill();
    }
    else {
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.arc(handF.x, handF.y, isSlim ? 4 : 4.8, 0, TAU);
        ctx.fill();
    }
    // Arma.
    drawWeapon(ctx, def, handF.x, handF.y, build, time, flash, accent);
    // Efeitos corporais por personagem.
    drawBodyEffects(ctx, def, {
        time,
        chestX,
        chestY,
        headX,
        headY,
        handF,
        handB,
        hipY,
        flash,
        build,
    });
    ctx.restore();
}
/** Equipamento de costas que ajuda a reconhecer cada silhueta mesmo de longe. */
function drawBackAccessory(ctx, def, chestX, chestY, hipY, time, flash, build) {
    const c = def.colors;
    const sway = Math.sin(time * 2.2) * 1.4;
    ctx.save();
    switch (def.id) {
        case 'ravi': {
            // Mochila de entregador com caixa de pizza e faixa refletiva.
            ctx.translate(chestX - 13, chestY + 7);
            ctx.rotate(-0.1 + sway * 0.012);
            ctx.fillStyle = tint('#241b1a', flash);
            roundRectPath(ctx, -9, -7, 16, 24, 4);
            ctx.fill();
            ctx.strokeStyle = tint(c.accent, flash);
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.fillStyle = tint('#c58b54', flash);
            ctx.save();
            ctx.rotate(-0.22);
            roundRectPath(ctx, -16, -18, 14, 13, 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(90, 40, 25, 0.8)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.strokeStyle = tint('#ff5a3c', flash);
            ctx.beginPath();
            ctx.moveTo(-14, -12);
            ctx.lineTo(-4, -12);
            ctx.stroke();
            ctx.restore();
            ctx.strokeStyle = tint(c.accent, flash);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-7, -5);
            ctx.lineTo(6, 1);
            ctx.moveTo(-7, 10);
            ctx.lineTo(6, 15);
            ctx.stroke();
            // Emblema de raio.
            ctx.strokeStyle = tint(c.accent, flash);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -1);
            ctx.lineTo(-3, 4);
            ctx.lineTo(1, 4);
            ctx.lineTo(-2, 10);
            ctx.stroke();
            break;
        }
        case 'miriam': {
            // Cilindro de oxigênio e mangueira de bombeira.
            ctx.translate(chestX - 15, chestY + 3);
            ctx.fillStyle = tint('#25211f', flash);
            roundRectPath(ctx, -5, 0, 11, 25, 5);
            ctx.fill();
            ctx.strokeStyle = tint('#6b5144', flash);
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = tint('#4a3d38', flash);
            roundRectPath(ctx, -6, -3, 13, 5, 2);
            ctx.fill();
            ctx.fillStyle = tint('#ff9b3c', flash);
            ctx.beginPath();
            ctx.arc(1, 7, 2.3, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 120, 50, 0.55)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(6, 22);
            ctx.bezierCurveTo(19, 20, 18, 7, 10, 3);
            ctx.stroke();
            break;
        }
        case 'kael': {
            // Mochila gravitacional com aletas flutuantes.
            ctx.translate(chestX - 12, chestY + 3);
            ctx.fillStyle = tint('#0a2234', flash);
            roundRectPath(ctx, -8, -2, 11, 19, 3);
            ctx.fill();
            ctx.strokeStyle = hexToRgba(c.accent, 0.7);
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = hexToRgba(c.accent, 0.8);
            ctx.lineWidth = 1.2;
            for (let i = 0; i < 2; i++) {
                const lift = 7 + i * 6 + Math.sin(time * 2.4 + i) * 2;
                ctx.beginPath();
                ctx.moveTo(-4 - i * 2, -1);
                ctx.lineTo(-15 - i * 4, -lift);
                ctx.stroke();
            }
            ctx.fillStyle = 'rgba(120, 240, 255, 0.75)';
            ctx.fillRect(-1, 5, 1.8, 1.8);
            ctx.fillRect(-1, 11, 1.8, 1.8);
            ctx.restore();
            break;
        }
        case 'ozric': {
            // Ombreira infernal fragmentada e corrente presa à cintura.
            ctx.translate(chestX - 11, chestY - 1);
            ctx.fillStyle = tint('#180a0f', flash);
            ctx.beginPath();
            ctx.moveTo(-8, 4);
            ctx.lineTo(-3, -8);
            ctx.lineTo(2, -2);
            ctx.lineTo(8, -7);
            ctx.lineTo(10, 6);
            ctx.lineTo(1, 11);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = tint('#5e1a26', flash);
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255, 51, 87, 0.45)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.ellipse(chestX - 16 + i * 2, hipY - 4 + i * 4, 4, 2.2, 0.4, 0, TAU);
                ctx.stroke();
            }
            break;
        }
        case 'elodie': {
            // Asa traseira maior, com penas soltas e luz dourada.
            ctx.translate(chestX - 7, chestY + 8);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 4; i++) {
                ctx.save();
                ctx.rotate(-0.55 - i * 0.12 + Math.sin(time * 1.7 + i) * 0.03);
                ctx.fillStyle = `rgba(255, 240, 196, ${0.15 - i * 0.02})`;
                ctx.beginPath();
                ctx.ellipse(-13 - i * 9, -5 + i * 7, 23 - i * 2.5, 6.5 - i * 0.7, -0.2, 0, TAU);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 246, 210, 0.42)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-2, 0);
                ctx.quadraticCurveTo(-16 - i * 7, -4 + i * 5, -27 - i * 8, 1 + i * 7);
                ctx.stroke();
                ctx.restore();
            }
            ctx.restore();
            break;
        }
        case 'thryc': {
            // Disco de nebulosa atrás do corpo, com estrelas e matéria do Nexus.
            ctx.translate(chestX, chestY + 9);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const ng = ctx.createRadialGradient(0, 0, 2, 0, 0, 37);
            ng.addColorStop(0, 'rgba(180, 139, 255, 0.22)');
            ng.addColorStop(0.5, 'rgba(111, 242, 255, 0.08)');
            ng.addColorStop(1, 'rgba(255, 138, 226, 0)');
            ctx.fillStyle = ng;
            ctx.beginPath();
            ctx.ellipse(0, 0, 38, 27, Math.sin(time * 0.4) * 0.12, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = 'rgba(180, 139, 255, 0.28)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(0, 0, 32, 18, -0.25, 0, TAU);
            ctx.stroke();
            for (let i = 0; i < 7; i++) {
                const a = time * 0.45 + i * 2.3;
                const r = 20 + (i % 3) * 6;
                ctx.fillStyle = i % 2 ? '#ffffff' : c.accent;
                ctx.globalAlpha = 0.35 + (i % 3) * 0.15;
                ctx.fillRect(Math.cos(a) * r - 0.8, Math.sin(a) * r * 0.58 - 0.8, 1.7, 1.7);
            }
            ctx.restore();
            break;
        }
    }
    ctx.restore();
    void build;
}
/** Solas, grevas e anéis que diferenciam os pés de cada Desperto. */
function drawFootwear(ctx, def, footF, footB, time, flash) {
    const c = def.colors;
    ctx.save();
    switch (def.id) {
        case 'ravi': {
            ctx.strokeStyle = tint(c.accent, flash);
            ctx.lineWidth = 2;
            for (const f of [footF, footB]) {
                ctx.beginPath();
                ctx.moveTo(f.x - 4, f.y - 1);
                ctx.lineTo(f.x + 5, f.y - 1);
                ctx.stroke();
            }
            ctx.fillStyle = hexToRgba(c.accent, 0.55);
            ctx.beginPath();
            ctx.arc(footF.x + 6, footF.y + 1, 2, 0, TAU);
            ctx.fill();
            break;
        }
        case 'miriam': {
            ctx.fillStyle = tint('#6a5548', flash);
            for (const f of [footF, footB]) {
                roundRectPath(ctx, f.x - 3, f.y - 7, 14, 8, 3);
                ctx.fill();
            }
            ctx.strokeStyle = tint('#ff9b3c', flash);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(footF.x + 2, footF.y - 6);
            ctx.lineTo(footF.x + 9, footF.y - 6);
            ctx.stroke();
            break;
        }
        case 'kael': {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 2; i++) {
                const f = i === 0 ? footF : footB;
                ctx.strokeStyle = hexToRgba(c.accent, 0.5 + Math.sin(time * 3 + i) * 0.15);
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.ellipse(f.x + 4, f.y + 1, 12, 3.5, 0, 0, TAU);
                ctx.stroke();
            }
            ctx.restore();
            break;
        }
        case 'ozric': {
            ctx.strokeStyle = 'rgba(255, 51, 87, 0.7)';
            ctx.lineWidth = 1.4;
            for (const f of [footF, footB]) {
                ctx.beginPath();
                ctx.moveTo(f.x - 4, f.y + 2);
                ctx.lineTo(f.x + 8, f.y + 2);
                ctx.stroke();
            }
            break;
        }
        case 'elodie': {
            ctx.strokeStyle = tint('#ffe6a3', flash);
            ctx.lineWidth = 1.4;
            for (const f of [footF, footB]) {
                ctx.beginPath();
                ctx.moveTo(f.x - 4, f.y - 4);
                ctx.lineTo(f.x + 7, f.y - 2);
                ctx.stroke();
            }
            break;
        }
        case 'thryc': {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 3; i++) {
                const f = i % 2 === 0 ? footF : footB;
                ctx.fillStyle = i === 1 ? '#ffffff' : c.accent;
                ctx.globalAlpha = 0.55;
                ctx.fillRect(f.x - 6 + i * 6, f.y + 1 + Math.sin(time * 2 + i) * 1.5, 1.4, 1.4);
            }
            ctx.restore();
            break;
        }
    }
    ctx.restore();
}
function drawHeadwear(ctx, def, time, flash) {
    const c = def.colors;
    switch (def.id) {
        case 'ravi': {
            ctx.fillStyle = tint(c.hair, flash);
            ctx.beginPath();
            ctx.moveTo(-9, -2);
            ctx.quadraticCurveTo(-11, -13, -2, -12);
            ctx.quadraticCurveTo(5, -15, 10, -8);
            ctx.quadraticCurveTo(13, -3, 8, 0);
            ctx.quadraticCurveTo(4, -7, -1, -5);
            ctx.quadraticCurveTo(-5, -3, -9, -2);
            ctx.fill();
            // Pequenos cachos.
            ctx.beginPath();
            ctx.arc(-7, -9, 3, 0, TAU);
            ctx.arc(0, -12, 3.4, 0, TAU);
            ctx.arc(7, -9, 3, 0, TAU);
            ctx.fill();
            // Faísca nos olhos.
            ctx.strokeStyle = c.accent;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(7, -4);
            ctx.lineTo(5, -1);
            ctx.stroke();
            break;
        }
        case 'miriam': {
            ctx.fillStyle = tint(c.hair, flash);
            ctx.beginPath();
            ctx.arc(0, -4, 10, Math.PI, TAU);
            ctx.fill();
            // Tranças.
            ctx.strokeStyle = tint('#241812', flash);
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-7, -2);
            ctx.quadraticCurveTo(-13, 8, -10, 18);
            ctx.moveTo(7, -3);
            ctx.quadraticCurveTo(12, 7, 9, 16);
            ctx.stroke();
            ctx.fillStyle = tint('#ff9b3c', flash);
            ctx.beginPath();
            ctx.arc(-10, 18, 2, 0, TAU);
            ctx.arc(9, 16, 2, 0, TAU);
            ctx.fill();
            break;
        }
        case 'kael': {
            ctx.fillStyle = tint(c.secondary, flash);
            ctx.beginPath();
            ctx.arc(0, 0, 9.6, 0, TAU);
            ctx.fill();
            ctx.fillStyle = tint(c.hair, flash);
            ctx.beginPath();
            ctx.arc(-1, -2, 9, Math.PI, TAU);
            ctx.fill();
            ctx.strokeStyle = tint(c.hair, flash);
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-7, -2);
            ctx.quadraticCurveTo(-14, 4, -17, 2);
            ctx.stroke();
            // Visor.
            ctx.strokeStyle = 'rgba(120, 240, 255, 0.8)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-6, -4);
            ctx.lineTo(7, -4);
            ctx.stroke();
            break;
        }
        case 'ozric': {
            ctx.fillStyle = tint(c.hair, flash);
            ctx.beginPath();
            ctx.arc(0, -1, 9.4, Math.PI * 0.95, TAU * 0.98);
            ctx.fill();
            ctx.fillStyle = tint('#2a1a22', flash);
            ctx.beginPath();
            ctx.moveTo(-9, 2);
            ctx.lineTo(-9.5, 8);
            ctx.lineTo(-5, 3);
            ctx.closePath();
            ctx.fill();
            break;
        }
        case 'elodie': {
            ctx.fillStyle = tint(c.hair, flash);
            ctx.beginPath();
            ctx.arc(0, -2, 9.5, Math.PI * 0.9, TAU * 1.02);
            ctx.fill();
            // Cabelo longo luminoso.
            ctx.strokeStyle = tint(c.hair, flash);
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.quadraticCurveTo(-16, 14, -11, 30);
            ctx.moveTo(-4, 2);
            ctx.quadraticCurveTo(-8, 18, -4, 30);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255, 240, 190, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-9, 0);
            ctx.quadraticCurveTo(-15, 14, -11, 28);
            ctx.stroke();
            break;
        }
        case 'thryc': {
            const g = ctx.createLinearGradient(-12, -10, 12, 16);
            g.addColorStop(0, 'rgba(111, 242, 255, 0.85)');
            g.addColorStop(0.5, 'rgba(180, 139, 255, 0.85)');
            g.addColorStop(1, 'rgba(255, 138, 226, 0.8)');
            ctx.fillStyle = g;
            // Cabelo-nebulosa.
            ctx.beginPath();
            ctx.moveTo(-10, -2);
            ctx.quadraticCurveTo(-20, -10, -14, -20);
            ctx.quadraticCurveTo(-4, -16, 2, -13);
            ctx.quadraticCurveTo(12, -16, 12, -4);
            ctx.quadraticCurveTo(18, 6, 10, 12);
            ctx.quadraticCurveTo(4, 2, 0, -2);
            ctx.quadraticCurveTo(-5, 4, -10, -2);
            ctx.fill();
            ctx.globalAlpha *= 0.8;
            for (let i = 0; i < 4; i++) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-10 + Math.sin(time * 2 + i * 4) * 8, -8 + i * 4, 1.4, 1.4);
            }
            break;
        }
    }
}
function drawWeapon(ctx, def, hx, hy, build, time, flash, accent) {
    const a = build.weaponA;
    switch (def.weapon) {
        case 'scythe': {
            const tip = joint(hx, hy, 104, a);
            ctx.save();
            ctx.strokeStyle = tint('#2a1a22', flash);
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(tip.x, tip.y);
            ctx.stroke();
            ctx.strokeStyle = tint('#5a2630', flash);
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(tip.x, tip.y);
            ctx.stroke();
            // Lâmina curva.
            const perp = { x: Math.cos(a), y: -Math.sin(a) };
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = accent;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(tip.x, tip.y);
            ctx.quadraticCurveTo(tip.x + perp.x * 34 + 20, tip.y + perp.y * 34 - 22, tip.x + perp.x * 52 + 6, tip.y + perp.y * 52 + 14);
            ctx.stroke();
            ctx.strokeStyle = '#1a0a10';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(tip.x, tip.y);
            ctx.quadraticCurveTo(tip.x + perp.x * 34 + 20, tip.y + perp.y * 34 - 22, tip.x + perp.x * 52 + 6, tip.y + perp.y * 52 + 14);
            ctx.stroke();
            glow(ctx, tip.x + 20, tip.y - 10, 26, accent, 0.35);
            ctx.restore();
            break;
        }
        case 'sword': {
            const tip = joint(hx, hy, 92, a);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const grad = ctx.createLinearGradient(hx, hy, tip.x, tip.y);
            grad.addColorStop(0, 'rgba(255, 244, 205, 0.2)');
            grad.addColorStop(0.35, 'rgba(255, 244, 205, 0.95)');
            grad.addColorStop(1, '#ffffff');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(tip.x, tip.y);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255, 230, 163, 0.5)';
            ctx.lineWidth = 13;
            ctx.stroke();
            ctx.restore();
            // Guarda e cabo.
            ctx.strokeStyle = tint('#c9a44f', flash);
            ctx.lineWidth = 3;
            const gx = joint(hx, hy, 12, a);
            const perp = { x: Math.cos(a), y: -Math.sin(a) };
            ctx.beginPath();
            ctx.moveTo(gx.x - perp.x * 7, gx.y - perp.y * 7);
            ctx.lineTo(gx.x + perp.x * 7, gx.y + perp.y * 7);
            ctx.stroke();
            break;
        }
        case 'blades': {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 2; i++) {
                const aa = a + (i === 0 ? 0 : -0.5);
                const tip = joint(hx, hy, 58, aa);
                const grad = ctx.createLinearGradient(hx, hy, tip.x, tip.y);
                grad.addColorStop(0, 'rgba(111, 242, 255, 0.15)');
                grad.addColorStop(0.5, 'rgba(180, 139, 255, 0.9)');
                grad.addColorStop(1, 'rgba(255, 138, 226, 0.9)');
                ctx.strokeStyle = grad;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(hx, hy);
                ctx.quadraticCurveTo(hx + Math.sin(aa) * 34 + Math.cos(aa) * 8, hy + Math.cos(aa) * 34 - Math.sin(aa) * 8, tip.x, tip.y);
                ctx.stroke();
            }
            ctx.restore();
            break;
        }
        case 'gravity': {
            // Orbes de gravidade flutuando nas mãos.
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 2; i++) {
                const ox = hx + (i === 0 ? 8 : -6);
                const oy = hy + (i === 0 ? -6 : 2) + Math.sin(time * 2.6 + i) * 3;
                const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, 9);
                g.addColorStop(0, '#ffffff');
                g.addColorStop(0.45, accent);
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(ox, oy, 9, 0, TAU);
                ctx.fill();
            }
            ctx.restore();
            break;
        }
        case 'gauntlets':
        case 'fists':
        default: {
            if (def.id === 'ravi') {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.strokeStyle = accent;
                ctx.lineWidth = 1.4;
                for (let i = 0; i < 2; i++) {
                    ctx.beginPath();
                    const ang = time * 9 + i * 3;
                    ctx.moveTo(hx - 8 + Math.sin(ang) * 3, hy - 6);
                    ctx.lineTo(hx + Math.cos(ang) * 7, hy + 4 - Math.cos(ang) * 4);
                    ctx.stroke();
                }
                ctx.restore();
            }
            break;
        }
    }
}
function drawBodyEffects(ctx, def, o) {
    const c = def.colors;
    switch (def.id) {
        case 'miriam': {
            // Cicatriz incandescente.
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = '#ff5b1f';
            ctx.lineWidth = 1.6;
            ctx.globalAlpha = 0.55 + Math.sin(o.time * 4) * 0.2;
            ctx.beginPath();
            ctx.moveTo(o.chestX - 12, o.chestY + 6);
            ctx.lineTo(o.chestX - 8, o.chestY + 14 + Math.sin(o.time * 3) * 2);
            ctx.lineTo(o.chestX - 12, o.chestY + 20);
            ctx.stroke();
            ctx.restore();
            break;
        }
        case 'kael': {
            // Placas gravitacionais orbitando.
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 3; i++) {
                const ang = o.time * 1.3 + (i / 3) * TAU;
                const px = Math.cos(ang) * 30;
                const py = o.chestY + 8 + Math.sin(ang) * 12;
                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(ang * 1.4);
                ctx.strokeStyle = c.accent;
                ctx.lineWidth = 1.4;
                ctx.globalAlpha = 0.75;
                ctx.beginPath();
                ctx.moveTo(0, -6);
                ctx.lineTo(5, 5);
                ctx.lineTo(-5, 5);
                ctx.closePath();
                ctx.stroke();
                ctx.fillStyle = 'rgba(120, 230, 255, 0.25)';
                ctx.fill();
                ctx.restore();
            }
            ctx.restore();
            break;
        }
        case 'ozric': {
            // Correntes vivas.
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 51, 87, 0.55)';
            ctx.lineWidth = 1.2;
            for (let i = 0; i < 2; i++) {
                ctx.beginPath();
                const sx = o.chestX - 14 - i * 4;
                const sy = o.chestY + 10;
                ctx.moveTo(sx, sy);
                ctx.bezierCurveTo(sx - 18, sy + 14, sx + 8, sy + 26, sx - 6, sy + 40);
                ctx.stroke();
            }
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = 'rgba(255, 51, 87, 0.18)';
            ctx.beginPath();
            ctx.arc(o.chestX, o.chestY + 12, 22 + Math.sin(o.time * 3) * 3, 0, TAU);
            ctx.fill();
            ctx.restore();
            break;
        }
        case 'elodie': {
            // Asas pequenas e quebradas.
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const flap = Math.sin(o.time * 2.2) * 4;
            for (let side = -1; side <= 1; side += 2) {
                ctx.save();
                ctx.translate(o.chestX + side * 9, o.chestY + 6);
                ctx.rotate(side * (0.5 + flap * 0.01));
                for (let i = 0; i < 3; i++) {
                    const len = 26 - i * 6;
                    ctx.fillStyle = `rgba(255, 240, 200, ${0.32 - i * 0.07})`;
                    ctx.beginPath();
                    ctx.ellipse(side * (10 + i * 5), -6 + i * 6, len * 0.55, 6 - i, side * 0.5, 0, TAU);
                    ctx.fill();
                }
                ctx.restore();
            }
            ctx.restore();
            break;
        }
        case 'thryc': {
            // Runas orbitando o corpo.
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = c.glow;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.ellipse(0, o.chestY + 16, 34, 11, Math.sin(o.time * 0.5) * 0.4, 0, TAU);
            ctx.stroke();
            for (let i = 0; i < 3; i++) {
                const ang = o.time * 1.1 + (i * TAU) / 3;
                const px = Math.cos(ang) * 34;
                const py = o.chestY + 16 + Math.sin(ang) * 11;
                ctx.fillStyle = c.accent;
                ctx.globalAlpha = 0.8;
                ctx.fillRect(px - 1, py - 1, 2, 2);
            }
            ctx.restore();
            break;
        }
        case 'ravi': {
            // Relâmpagos nos braços.
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = c.accent;
            ctx.lineWidth = 1.1;
            ctx.globalAlpha = 0.6;
            for (let i = 0; i < 2; i++) {
                const bx = i === 0 ? o.handF.x : o.handB.x;
                const by = i === 0 ? o.handF.y : o.handB.y;
                ctx.beginPath();
                ctx.moveTo(bx - 6, by - 10);
                ctx.lineTo(bx - 2, by - 4);
                ctx.lineTo(bx - 7, by);
                ctx.lineTo(bx - 1, by + 5);
                ctx.stroke();
            }
            ctx.restore();
            break;
        }
        case 'ozric':
        default:
            break;
    }
}
/** Assinatura mágica/tecnológica no chão, desenhada atrás de cada Desperto. */
function drawPlayerAura(ctx, p, time) {
    if (p.dead)
        return;
    const s = p.scale;
    const moving = Math.abs(p.vx) > 28;
    const pulse = 0.65 + Math.sin(time * 3.1) * 0.12;
    const boost = clamp(p.abilityFlash * 2.2, 0, 0.75);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(s, s);
    ctx.globalCompositeOperation = 'lighter';
    switch (p.charId) {
        case 'ravi': {
            // Faíscas elétricas e solas de neon.
            const rg = ctx.createRadialGradient(0, 0, 2, 0, 0, 42);
            rg.addColorStop(0, `rgba(86, 227, 255, ${0.16 + boost * 0.2})`);
            rg.addColorStop(1, 'rgba(86, 227, 255, 0)');
            ctx.fillStyle = rg;
            ctx.beginPath();
            ctx.ellipse(0, 0, 42, 12, 0, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = `rgba(86, 227, 255, ${pulse * 0.7})`;
            ctx.lineWidth = 1.2;
            for (let i = 0; i < 5; i++) {
                const a = time * 2.4 + i * 1.7;
                const x = Math.cos(a) * (18 + (i % 3) * 7);
                const y = -Math.abs(Math.sin(a)) * 6;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.sin(a * 2) * 4, y - 7 - (i % 2) * 4);
                ctx.lineTo(x + Math.sin(a * 2 + 1) * 3, y - 2);
                ctx.stroke();
            }
            if (moving) {
                ctx.strokeStyle = 'rgba(255, 195, 66, 0.45)';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(-p.facing * 14, -2);
                ctx.lineTo(-p.facing * 25, 1);
                ctx.moveTo(-p.facing * 10, 2);
                ctx.lineTo(-p.facing * 19, 4);
                ctx.stroke();
            }
            break;
        }
        case 'miriam': {
            // Calor de fornalha, rachaduras e brasas.
            const rg = ctx.createRadialGradient(0, 0, 1, 0, 0, 45);
            rg.addColorStop(0, `rgba(255, 120, 44, ${0.22 + boost * 0.2})`);
            rg.addColorStop(0.55, 'rgba(201, 65, 47, 0.1)');
            rg.addColorStop(1, 'rgba(201, 65, 47, 0)');
            ctx.fillStyle = rg;
            ctx.beginPath();
            ctx.ellipse(0, 0, 46, 13, 0, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 155, 60, ${pulse * 0.55})`;
            ctx.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
                const a = i * 1.57 + 0.4;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 3);
                ctx.lineTo(Math.cos(a + 0.12) * 32, Math.sin(a + 0.12) * 8);
                ctx.lineTo(Math.cos(a - 0.08) * 38, Math.sin(a - 0.08) * 10);
                ctx.stroke();
            }
            ctx.fillStyle = 'rgba(255, 183, 92, 0.65)';
            for (let i = 0; i < 4; i++) {
                const a = time * 1.4 + i * 2.1;
                ctx.fillRect(Math.cos(a) * 16, -4 - Math.abs(Math.sin(a)) * 12, 1.6, 1.6);
            }
            break;
        }
        case 'kael': {
            // Anéis de gravidade e poeira suspensa.
            const rg = ctx.createRadialGradient(0, -2, 2, 0, -2, 48);
            rg.addColorStop(0, `rgba(111, 242, 255, ${0.14 + boost * 0.2})`);
            rg.addColorStop(1, 'rgba(111, 242, 255, 0)');
            ctx.fillStyle = rg;
            ctx.beginPath();
            ctx.ellipse(0, -2, 48, 15, 0, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = `rgba(127, 107, 255, ${pulse * 0.7})`;
            ctx.lineWidth = 1.2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.ellipse(0, -2 - i * 2, 27 + i * 7, 6 + i * 2, 0.08 * i, 0, TAU);
                ctx.stroke();
            }
            ctx.fillStyle = 'rgba(111, 242, 255, 0.55)';
            for (let i = 0; i < 5; i++) {
                const a = time * 0.9 + i * 1.4;
                const r = 20 + (i % 3) * 8;
                ctx.fillRect(Math.cos(a) * r - 1, -6 - Math.abs(Math.sin(a)) * 18, 2, 2);
            }
            break;
        }
        case 'ozric': {
            // Fumaça infernal, correntes e brasas vermelhas.
            const rg = ctx.createRadialGradient(0, 0, 2, 0, 0, 44);
            rg.addColorStop(0, `rgba(255, 51, 87, ${0.12 + boost * 0.25})`);
            rg.addColorStop(1, 'rgba(90, 10, 26, 0)');
            ctx.fillStyle = rg;
            ctx.beginPath();
            ctx.ellipse(0, 0, 44, 14, 0, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 51, 87, ${pulse * 0.45})`;
            ctx.lineWidth = 1.1;
            for (let i = 0; i < 4; i++) {
                const dir = i % 2 === 0 ? -1 : 1;
                ctx.beginPath();
                ctx.moveTo(dir * (14 + i * 6), -1);
                ctx.quadraticCurveTo(dir * (22 + i * 6), -12 - i * 2, dir * (30 + i * 5), -3);
                ctx.stroke();
            }
            ctx.fillStyle = 'rgba(255, 51, 87, 0.6)';
            for (let i = 0; i < 4; i++) {
                const a = time * 1.1 + i * 1.8;
                ctx.fillRect(Math.cos(a) * 22, -6 - Math.abs(Math.sin(a)) * 16, 1.5, 2.5);
            }
            break;
        }
        case 'elodie': {
            // Sigilo dourado, penas e luz de vitral.
            const rg = ctx.createRadialGradient(0, 0, 3, 0, 0, 50);
            rg.addColorStop(0, `rgba(255, 240, 196, ${0.2 + boost * 0.22})`);
            rg.addColorStop(1, 'rgba(255, 240, 196, 0)');
            ctx.fillStyle = rg;
            ctx.beginPath();
            ctx.ellipse(0, 0, 50, 14, 0, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 244, 205, ${pulse * 0.75})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(0, 0, 31, 10, 0, 0, TAU);
            ctx.stroke();
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * TAU + time * 0.15;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 4);
                ctx.lineTo(Math.cos(a) * 30, Math.sin(a) * 10);
                ctx.stroke();
            }
            ctx.fillStyle = 'rgba(255, 248, 220, 0.75)';
            for (let i = 0; i < 5; i++) {
                const a = time * 0.7 + i * 1.3;
                ctx.save();
                ctx.rotate(a);
                ctx.beginPath();
                ctx.ellipse(22, -5, 4, 1.2, -0.5, 0, TAU);
                ctx.fill();
                ctx.restore();
            }
            break;
        }
        case 'thryc': {
            // Distorção do Nexus e poeira estelar.
            const rg = ctx.createRadialGradient(0, 0, 3, 0, 0, 52);
            rg.addColorStop(0, `rgba(180, 139, 255, ${0.18 + boost * 0.25})`);
            rg.addColorStop(0.5, 'rgba(111, 242, 255, 0.08)');
            rg.addColorStop(1, 'rgba(255, 138, 226, 0)');
            ctx.fillStyle = rg;
            ctx.beginPath();
            ctx.ellipse(0, 0, 52, 16, 0, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = `rgba(180, 139, 255, ${pulse * 0.6})`;
            ctx.lineWidth = 1.1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.ellipse(0, 0, 22 + i * 9, 6 + i * 2.5, -0.3 + i * 0.25, 0, TAU);
                ctx.stroke();
            }
            for (let i = 0; i < 7; i++) {
                const a = time * 0.8 + i * 1.9;
                const r = 18 + (i % 4) * 7;
                ctx.fillStyle = i % 2 ? '#ffffff' : '#b48bff';
                ctx.globalAlpha = 0.45 + (i % 3) * 0.15;
                ctx.fillRect(Math.cos(a) * r, -5 - Math.abs(Math.sin(a)) * 20, 1.8, 1.8);
            }
            ctx.globalAlpha = 1;
            break;
        }
    }
    ctx.restore();
}
/** Rastro de arma/impacto que dá personalidade a cada golpe. */
function drawCombatFlair(ctx, p, time) {
    const a = p.attack;
    if (!a || p.dead)
        return;
    const d = a.def;
    const total = Math.max(0.01, d.startup + d.active + d.recovery);
    const prog = clamp(a.t / total, 0, 1);
    const phase = p.attackPhase;
    const alpha = phase === 'active' ? 0.9 : phase === 'windup' ? 0.3 : 0.45;
    const cx = p.x + p.facing * (18 + prog * 26) * p.scale;
    const cy = p.y - (44 + Math.sin(prog * Math.PI) * 8) * p.scale;
    const s = p.scale;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(p.facing * s, s);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha;
    switch (p.charId) {
        case 'ravi': {
            ctx.strokeStyle = p.def.colors.accent;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(-18, 14);
            ctx.lineTo(-4, 4);
            ctx.lineTo(-9, -3);
            ctx.lineTo(8, -14);
            ctx.lineTo(2, -2);
            ctx.lineTo(14, 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255, 209, 102, 0.8)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(0, 0, 20, -0.9, 0.9);
            ctx.stroke();
            break;
        }
        case 'miriam': {
            ctx.strokeStyle = 'rgba(255, 155, 60, 0.85)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 4, 22 + prog * 8, -0.8, 0.8);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255, 235, 190, 0.7)';
            ctx.lineWidth = 1.2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(0, 4, 10 + i * 7 + prog * 5, -0.7, 0.7);
                ctx.stroke();
            }
            break;
        }
        case 'kael': {
            ctx.strokeStyle = 'rgba(111, 242, 255, 0.9)';
            ctx.lineWidth = 1.6;
            for (let i = 0; i < 2; i++) {
                ctx.beginPath();
                ctx.ellipse(2, 0, 18 + i * 7 + prog * 5, 6 + i * 2, 0.4 + i * 0.5, 0, TAU);
                ctx.stroke();
            }
            ctx.fillStyle = 'rgba(127, 107, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, TAU);
            ctx.fill();
            break;
        }
        case 'ozric': {
            ctx.fillStyle = 'rgba(30, 6, 12, 0.85)';
            ctx.beginPath();
            ctx.arc(0, 0, 26, -0.8, 0.8);
            ctx.arc(8, 0, 18, 0.8, -0.8, true);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 51, 87, 0.8)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(0, 0, 27, -0.85, 0.85);
            ctx.stroke();
            break;
        }
        case 'elodie': {
            ctx.strokeStyle = 'rgba(255, 244, 205, 0.95)';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.arc(0, 0, 24 + prog * 7, -1.1, 1.1);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255, 214, 121, 0.65)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.ellipse(-4 + i * 7, -8 + i * 5, 5, 1.4, -0.7, 0, TAU);
                ctx.stroke();
            }
            break;
        }
        case 'thryc': {
            ctx.strokeStyle = 'rgba(180, 139, 255, 0.9)';
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 3; i++) {
                const off = i * 5 - 5;
                ctx.beginPath();
                ctx.moveTo(off - 8, -13);
                ctx.lineTo(off + 2, -4);
                ctx.lineTo(off - 4, 3);
                ctx.lineTo(off + 9, 13);
                ctx.stroke();
            }
            ctx.fillStyle = 'rgba(111, 242, 255, 0.65)';
            ctx.fillRect(-1, -1, 2, 2);
            break;
        }
    }
    ctx.restore();
    void time;
}
/** Desenha o jogador em combate. */
export function drawPlayer(ctx, p, time) {
    const build = playerBuild(p, time);
    ctx.save();
    if (p.invulnFlash && !p.dead)
        ctx.globalAlpha = 0.55;
    // Sombra no chão.
    if (!p.dead) {
        ctx.save();
        ctx.globalAlpha = 0.35 * clamp(1 - (p.y - (p.y - 0)) / 200, 0.2, 1);
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 2, 24 * p.scale, 7, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
    }
    drawPlayerAura(ctx, p, time);
    drawCharacterFigure(ctx, p.def, p.x, p.y, p.facing, p.def.scale, time, build, p.hitFlash);
    drawCombatFlair(ctx, p, time);
    // Rastro de dash.
    if (p.dashTime > 0) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        for (let i = 1; i <= 3; i++) {
            drawCharacterFigure(ctx, p.def, p.x - p.dashDir * i * 22, p.y, p.facing, p.def.scale, time, build, p.hitFlash);
        }
        ctx.restore();
    }
    ctx.restore();
}
/** Motivo de fundo exclusivo de cada retrato. */
function drawPortraitMotif(ctx, def, size, time, dim) {
    const c = def.colors;
    const r = size * 0.52;
    ctx.save();
    ctx.globalAlpha = dim ? 0.22 : 0.72;
    switch (def.id) {
        case 'ravi': {
            // Linhas de velocidade e raio de entregador.
            ctx.strokeStyle = hexToRgba(c.accent, 0.55);
            ctx.lineWidth = Math.max(1, size * 0.012);
            for (let i = 0; i < 7; i++) {
                const y = -r * 0.62 + (i / 6) * r * 1.24;
                ctx.beginPath();
                ctx.moveTo(-r * 0.9, y);
                ctx.lineTo(-r * (0.35 + (i % 3) * 0.08), y);
                ctx.stroke();
            }
            ctx.save();
            ctx.translate(r * 0.45, -r * 0.2);
            ctx.rotate(-0.2);
            ctx.strokeStyle = hexToRgba(c.accent, 0.9);
            ctx.lineWidth = Math.max(2, size * 0.035);
            ctx.beginPath();
            ctx.moveTo(0, -r * 0.35);
            ctx.lineTo(-r * 0.1, -r * 0.04);
            ctx.lineTo(r * 0.06, -r * 0.04);
            ctx.lineTo(-r * 0.04, r * 0.34);
            ctx.stroke();
            ctx.restore();
            break;
        }
        case 'miriam': {
            // Rachaduras de brasa e arco de incêndio.
            ctx.strokeStyle = hexToRgba(c.accent, 0.8);
            ctx.lineWidth = Math.max(1, size * 0.014);
            for (let i = 0; i < 5; i++) {
                const a = 0.4 + i * 0.58;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
                ctx.lineTo(Math.cos(a + 0.12) * r * 0.6, Math.sin(a + 0.12) * r * 0.6);
                ctx.lineTo(Math.cos(a - 0.08) * r * 0.88, Math.sin(a - 0.08) * r * 0.88);
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(255, 190, 100, 0.45)';
            ctx.lineWidth = Math.max(2, size * 0.025);
            ctx.beginPath();
            ctx.arc(0, size * 0.2, r * 0.82, Math.PI * 1.08, Math.PI * 1.92);
            ctx.stroke();
            break;
        }
        case 'kael': {
            // Órbitas de gravidade.
            ctx.strokeStyle = hexToRgba(c.accent, 0.6);
            ctx.lineWidth = Math.max(1, size * 0.012);
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.ellipse(0, -size * 0.04, r * (0.72 - i * 0.08), r * (0.22 + i * 0.04), -0.35 + i * 0.22, 0, TAU);
                ctx.stroke();
            }
            ctx.fillStyle = hexToRgba(c.primary, 0.75);
            for (let i = 0; i < 5; i++) {
                const a = time * 0.35 + i * 1.9;
                ctx.beginPath();
                ctx.arc(Math.cos(a) * r * 0.55, -size * 0.04 + Math.sin(a) * r * 0.2, size * 0.012, 0, TAU);
                ctx.fill();
            }
            break;
        }
        case 'ozric': {
            // Lua sangrenta, correntes e coroa quebrada.
            ctx.fillStyle = 'rgba(120, 18, 34, 0.35)';
            ctx.beginPath();
            ctx.arc(r * 0.28, -r * 0.3, r * 0.34, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 51, 87, 0.55)';
            ctx.lineWidth = Math.max(1.2, size * 0.016);
            for (let side = -1; side <= 1; side += 2) {
                ctx.beginPath();
                ctx.moveTo(side * r * 0.86, -r * 0.1);
                ctx.quadraticCurveTo(side * r * 0.55, r * 0.34, side * r * 0.86, r * 0.8);
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(138, 32, 48, 0.7)';
            ctx.lineWidth = Math.max(2, size * 0.024);
            ctx.beginPath();
            ctx.moveTo(-r * 0.3, -r * 0.54);
            ctx.lineTo(-r * 0.36, -r * 0.78);
            ctx.lineTo(-r * 0.08, -r * 0.62);
            ctx.lineTo(r * 0.08, -r * 0.84);
            ctx.lineTo(r * 0.34, -r * 0.56);
            ctx.stroke();
            break;
        }
        case 'elodie': {
            // Rosácea, raios e penas douradas.
            ctx.strokeStyle = 'rgba(255, 240, 196, 0.45)';
            ctx.lineWidth = Math.max(1, size * 0.012);
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * TAU + 0.15;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * r * 0.34, Math.sin(a) * r * 0.34);
                ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(255, 228, 150, 0.6)';
            ctx.lineWidth = Math.max(1.4, size * 0.018);
            ctx.beginPath();
            ctx.arc(0, -r * 0.05, r * 0.72, -2.6, -0.5);
            ctx.stroke();
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.ellipse(-r * 0.5 + i * r * 0.5, r * 0.54, r * 0.14, r * 0.04, -0.5, 0, TAU);
                ctx.stroke();
            }
            break;
        }
        case 'thryc': {
            // Galáxia espiral e estrelas do Nexus.
            ctx.strokeStyle = 'rgba(180, 139, 255, 0.42)';
            ctx.lineWidth = Math.max(1.2, size * 0.015);
            for (let arm = 0; arm < 2; arm++) {
                ctx.beginPath();
                for (let i = 0; i < 24; i++) {
                    const a = arm * Math.PI + i * 0.18 + time * 0.05;
                    const rr = r * (0.16 + i * 0.028);
                    const x = Math.cos(a) * rr;
                    const y = Math.sin(a) * rr * 0.58;
                    if (i === 0)
                        ctx.moveTo(x, y);
                    else
                        ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(111, 242, 255, 0.32)';
            for (let i = 0; i < 2; i++) {
                ctx.beginPath();
                ctx.ellipse(0, 0, r * (0.62 - i * 0.18), r * (0.24 - i * 0.08), 0.4, 0, TAU);
                ctx.stroke();
            }
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 9; i++) {
                const a = time * 0.28 + i * 2.1;
                const rr = r * (0.28 + (i % 4) * 0.14);
                ctx.globalAlpha = dim ? 0.18 : 0.45 + (i % 3) * 0.15;
                ctx.fillRect(Math.cos(a) * rr, Math.sin(a) * rr * 0.62, size * 0.012, size * 0.012);
            }
            break;
        }
    }
    ctx.restore();
}
/** Busto estilizado para menus, HUD e telas de seleção. */
export function drawCharacterPortrait(ctx, def, cx, cy, size, time, dim = false) {
    const s = size / 100;
    const c = def.colors;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = dim ? 0.35 : 1;
    // Fundo radial.
    const bg = ctx.createRadialGradient(0, 0, 4, 0, 0, size * 0.62);
    bg.addColorStop(0, dim ? 'rgba(30,30,44,0.7)' : `${c.aura}33`);
    bg.addColorStop(1, 'rgba(4,5,10,0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.62, 0, TAU);
    ctx.fill();
    drawPortraitMotif(ctx, def, size, time, dim);
    ctx.translate(-8 * s, 40 * s);
    ctx.scale(s, s);
    // Ombro / busto.
    ctx.beginPath();
    ctx.moveTo(-34, 30);
    ctx.quadraticCurveTo(-30, -2, -12, -6);
    ctx.lineTo(12, -6);
    ctx.quadraticCurveTo(30, -2, 34, 30);
    ctx.closePath();
    ctx.fillStyle = c.primary;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // Pescoço e cabeça.
    ctx.fillStyle = c.skin;
    ctx.fillRect(-6, -20, 12, 18);
    ctx.beginPath();
    ctx.ellipse(0, -32, 18, 21, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // Olhos.
    ctx.fillStyle = c.eye;
    ctx.beginPath();
    ctx.ellipse(-7, -34, 3, 2.2, 0, 0, TAU);
    ctx.ellipse(8, -34, 3, 2.2, 0, 0, TAU);
    ctx.fill();
    // Cabelo por personagem.
    drawPortraitHeadwear(ctx, def, time, s);
    // Detalhes de traje.
    if (def.id === 'miriam') {
        ctx.fillStyle = '#3a2a22';
        roundRectPath(ctx, -22, 4, 44, 22, 6);
        ctx.fill();
        ctx.fillStyle = '#ff9b3c';
        ctx.beginPath();
        ctx.arc(12, 13, 4, 0, TAU);
        ctx.fill();
    }
    else if (def.id === 'ozric') {
        ctx.fillStyle = '#1a1018';
        ctx.beginPath();
        ctx.moveTo(-34, 26);
        ctx.quadraticCurveTo(-26, 6, -12, 2);
        ctx.lineTo(-4, 30);
        ctx.closePath();
        ctx.fill();
    }
    else if (def.id === 'elodie') {
        ctx.strokeStyle = 'rgba(255,240,190,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, -54, 24, 6, 0, 0, TAU);
        ctx.stroke();
    }
    else if (def.id === 'kael') {
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-16, -34);
        ctx.lineTo(2, -34);
        ctx.stroke();
    }
    else if (def.id === 'thryc') {
        const g = ctx.createLinearGradient(-30, -50, 30, 30);
        g.addColorStop(0, 'rgba(111,242,255,0.5)');
        g.addColorStop(0.5, 'rgba(180,139,255,0.45)');
        g.addColorStop(1, 'rgba(255,138,226,0.4)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, 10, 26, 30, 0, 0, TAU);
        ctx.fill();
        // Estrelas.
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * TAU + time * 0.2;
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.6;
            ctx.fillRect(Math.cos(a) * 18, 8 + Math.sin(a) * 24, 1.6, 1.6);
        }
        ctx.globalAlpha = 1;
    }
    // Moldura circular.
    ctx.strokeStyle = dim ? 'rgba(120,120,140,0.35)' : c.accent;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = dim ? 0.4 : 0.65;
    ctx.beginPath();
    ctx.arc(8 * s, 34 * s, size * 0.46, 0, TAU);
    ctx.stroke();
    ctx.restore();
}
function drawPortraitHeadwear(ctx, def, time, s) {
    const c = def.colors;
    switch (def.id) {
        case 'ravi': {
            ctx.fillStyle = c.hair;
            ctx.beginPath();
            ctx.arc(0, -40, 20, Math.PI, TAU);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(-12, -46, 7, 0, TAU);
            ctx.arc(0, -52, 7, 0, TAU);
            ctx.arc(13, -46, 7, 0, TAU);
            ctx.fill();
            break;
        }
        case 'miriam': {
            ctx.fillStyle = c.hair;
            ctx.beginPath();
            ctx.arc(0, -42, 21, Math.PI, TAU);
            ctx.fill();
            ctx.strokeStyle = c.hair;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(-16, -34);
            ctx.quadraticCurveTo(-24, -10, -18, 12);
            ctx.moveTo(17, -34);
            ctx.quadraticCurveTo(24, -10, 18, 10);
            ctx.stroke();
            break;
        }
        case 'kael': {
            ctx.fillStyle = c.hair;
            ctx.beginPath();
            ctx.arc(0, -38, 20, Math.PI * 1.02, TAU * 0.98);
            ctx.fill();
            ctx.strokeStyle = c.hair;
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(18, -36);
            ctx.quadraticCurveTo(30, -26, 28, -8);
            ctx.stroke();
            ctx.strokeStyle = c.accent;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-14, -34);
            ctx.lineTo(4, -34);
            ctx.stroke();
            break;
        }
        case 'ozric': {
            ctx.fillStyle = c.hair;
            ctx.beginPath();
            ctx.arc(0, -36, 21, Math.PI * 0.9, TAU * 0.99);
            ctx.fill();
            ctx.strokeStyle = '#8a2030';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(-16, -44);
            ctx.quadraticCurveTo(-30, -60, -22, -72);
            ctx.moveTo(16, -44);
            ctx.quadraticCurveTo(30, -60, 22, -72);
            ctx.stroke();
            break;
        }
        case 'elodie': {
            ctx.fillStyle = c.hair;
            ctx.beginPath();
            ctx.arc(0, -40, 21, Math.PI * 0.92, TAU * 1.02);
            ctx.fill();
            ctx.strokeStyle = c.hair;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(-20, -36);
            ctx.quadraticCurveTo(-32, 0, -22, 26);
            ctx.moveTo(20, -36);
            ctx.quadraticCurveTo(32, 0, 22, 24);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255,240,190,0.7)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.ellipse(0, -60, 22, 5, 0, 0.4, TAU - 0.8);
            ctx.stroke();
            break;
        }
        case 'thryc': {
            const g = ctx.createLinearGradient(-24, -64, 24, -20);
            g.addColorStop(0, 'rgba(111,242,255,0.9)');
            g.addColorStop(0.5, 'rgba(180,139,255,0.9)');
            g.addColorStop(1, 'rgba(255,138,226,0.85)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(-20, -34);
            ctx.quadraticCurveTo(-34, -56, -16, -66);
            ctx.quadraticCurveTo(0, -52, 4, -58);
            ctx.quadraticCurveTo(18, -68, 22, -44);
            ctx.quadraticCurveTo(32, -22, 18, -12);
            ctx.quadraticCurveTo(10, -30, 0, -32);
            ctx.quadraticCurveTo(-10, -26, -20, -34);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 4; i++) {
                ctx.globalAlpha = 0.7;
                ctx.fillRect(-14 + Math.sin(time + i * 2) * 12, -60 + i * 7, 1.6, 1.6);
            }
            break;
        }
    }
}
export function drawCharacterSilhouette(ctx, id, x, y, scale, color) {
    const def = CHARACTERS[id] ?? CHARACTERS.ravi;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    // Silhueta simples e reconhecível.
    ctx.beginPath();
    ctx.ellipse(0, -100, 12, 14, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-14, -86);
    ctx.quadraticCurveTo(-24, -60, -16, -36);
    ctx.lineTo(-24, 0);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-6, -30);
    ctx.lineTo(-2, 0);
    ctx.lineTo(12, 0);
    ctx.lineTo(16, -34);
    ctx.quadraticCurveTo(26, -64, 16, -86);
    ctx.closePath();
    ctx.fill();
    void def;
    ctx.restore();
}
//# sourceMappingURL=characters.js.map