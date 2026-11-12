/** Ilustração procedural de inimigos e chefes. */
import { clamp, hexToRgba, mixColor, TAU } from '../core/math.js?v=6ccbb66fdb55';
import { CHAPTERS_PER_ARC, getStage } from '../data/stages.js?v=6ccbb66fdb55';
import { visualStyle } from './style.js?v=6ccbb66fdb55';
import { glow, joint, limb, roundRectPath } from './theme.js?v=6ccbb66fdb55';
function tint(color, flash) {
    return flash > 0 ? mixColor(color, '#ffffff', clamp(flash * 4.5, 0, 0.9)) : color;
}
function shadow(ctx, x, y, w) {
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, w, w * 0.28, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
}
const INK = 'rgba(5, 4, 8, 0.9)';
function outlinePath(ctx, width = 1.4, color = INK) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
}
/** Membro com contorno, sombra dura e luz de contorno — leitura forte em qualquer escala. */
function armoredLimb(ctx, x1, y1, x2, y2, width, base, opts = {}) {
    const dark = opts.dark ?? mixColor(base, '#08060c', 0.58);
    const light = opts.light ?? mixColor(base, '#ffffff', 0.32);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    limb(ctx, x1, y1, x2, y2, width + 2.6, INK);
    limb(ctx, x1, y1, x2, y2, width, base);
    limb(ctx, x1 + nx * width * 0.12, y1 + ny * width * 0.12, x2 + nx * width * 0.12, y2 + ny * width * 0.12, Math.max(1.2, width * 0.36), dark);
    limb(ctx, x1 - nx * width * 0.18, y1 - ny * width * 0.18, x2 - nx * width * 0.18, y2 - ny * width * 0.18, Math.max(0.8, width * 0.14), light);
    if (opts.band) {
        const mx = (x1 + x2) * 0.5;
        const my = (y1 + y2) * 0.5;
        limb(ctx, mx - nx * width * 0.52, my - ny * width * 0.52, mx + nx * width * 0.52, my + ny * width * 0.52, Math.max(1, width * 0.24), opts.accent ?? light);
    }
}
function enemyEye(ctx, x, y, r, color, opts = {}) {
    if (opts.glow !== false)
        glow(ctx, x, y, r * 3.4, color, 0.28);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#08050c';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.5, r * (opts.vertical ? 1.8 : 1.0), 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * (opts.vertical ? 0.62 : 1.08), r * (opts.vertical ? 1.25 : 0.68), 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = opts.pupil ?? '#08050c';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * (opts.vertical ? 0.22 : 0.38), r * (opts.vertical ? 0.9 : 0.48), 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(-r * 0.32, -r * 0.26, Math.max(0.7, r * 0.26), 0, TAU);
    ctx.fill();
    if (opts.angry) {
        ctx.strokeStyle = INK;
        ctx.lineWidth = Math.max(1.2, r * 0.55);
        ctx.beginPath();
        ctx.moveTo(-r * 1.5, -r * 1.15);
        ctx.lineTo(r * 1.5, -r * 0.45);
        ctx.stroke();
    }
    ctx.restore();
}
function spike(ctx, x, y, w, h, color, angle = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, 0);
    ctx.lineTo(0, -h);
    ctx.lineTo(w * 0.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.restore();
}
function claw(ctx, x, y, len, angle, color = '#efe6cf') {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.6, -2, len, 2);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
}
function runeMark(ctx, x, y, s, color, angle = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-s, -s);
    ctx.lineTo(s, -s * 0.2);
    ctx.lineTo(-s * 0.4, s);
    ctx.lineTo(s * 0.7, s * 0.4);
    ctx.stroke();
    ctx.restore();
}
export function drawEnemy(ctx, e, time) {
    const c = e.def;
    const flash = e.hitFlash;
    const col = tint(c.color, flash);
    const accent = tint(c.accent, flash);
    const dark = tint('#0d0a12', flash);
    const scale = e.scale;
    const bob = e.def.flying ? Math.sin(time * 2.4 + e.animPhase) * 4 : 0;
    const walk = Math.sin(e.walkPhase);
    shadow(ctx, e.x, e.def.flying ? e.stage.floor + 2 : e.y + 2, Math.max(22, e.w * 0.38) * (e.def.flying ? 0.85 : 1));
    // Telegrafias desenhadas no mundo: linha de investida, raio de pisada,
    // zona de pouso e mira à distância. O jogador lê o ataque antes dele sair.
    drawEnemyTelegraphs(ctx, e, time);
    drawSpawnRift(ctx, e, time);
    ctx.save();
    ctx.translate(e.x, e.y + bob);
    ctx.scale(e.facing * scale, scale);
    ctx.globalAlpha = e.alpha;
    // Antecipação, investida e recuperação: o corpo inclina, comprime e estica.
    const windup = e.state === 'windup' ? e.windupRatio : 0;
    const attack = e.state === 'attack' ? e.attackRatio : 0;
    const lunge = Math.sin(attack * Math.PI);
    const lean = -0.07 * windup + (e.def.ai === 'charger' ? 0.2 : 0.11) * lunge;
    ctx.rotate(lean);
    ctx.scale(1, 1 - 0.055 * windup + 0.05 * lunge);
    drawEnemyAura(ctx, e, time, accent);
    if (visualStyle.anime) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const halo = ctx.createRadialGradient(0, -e.h * 0.5, 2, 0, -e.h * 0.5, e.w * 0.82);
        halo.addColorStop(0, hexToRgba(accent, 0.12));
        halo.addColorStop(0.55, hexToRgba(accent, 0.05));
        halo.addColorStop(1, hexToRgba(accent, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, -e.h * 0.5, e.w * 0.82, 0, TAU);
        ctx.fill();
        ctx.restore();
    }
    if (e.dead) {
        ctx.rotate(-Math.min(1.3, e.deathTimer * 2));
    }
    // Presença de elite: anel no chão, aura e runas.
    if (e.elite) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(0, -e.h / 2, 4, 0, -e.h / 2, e.w * 0.9);
        g.addColorStop(0, hexToRgba(c.accent, 0.18));
        g.addColorStop(1, hexToRgba(c.accent, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, -e.h / 2, e.w * 0.9, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, e.w * 0.72, e.w * 0.2, 0, 0, TAU);
        ctx.stroke();
        for (let i = 0; i < 6; i++) {
            const a = time * 0.7 + (i * TAU) / 6;
            runeMark(ctx, Math.cos(a) * e.w * 0.72, Math.sin(a) * e.w * 0.2, 3, accent, a);
        }
        ctx.restore();
    }
    // Explosão de linhas de velocidade ao carregar ou levar um golpe.
    if (visualStyle.anime && (e.state === 'windup' || flash > 0.02)) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = flash > 0.02 ? 0.55 : 0.3;
        const cy = -e.h * 0.5;
        const inner = e.w * 0.34;
        const outer = e.w * (0.6 + (flash > 0.02 ? 0.22 : 0));
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * TAU + time * 0.7;
            ctx.strokeStyle = flash > 0.02 ? '#ffffff' : accent;
            ctx.lineWidth = i % 3 === 0 ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * inner, cy + Math.sin(a) * inner * 0.7);
            ctx.lineTo(Math.cos(a) * outer, cy + Math.sin(a) * outer * 0.7);
            ctx.stroke();
        }
        ctx.restore();
    }
    // Telegrafia de ataque.
    if (e.state === 'windup') {
        const p = e.windupRatio;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35 + p * 0.5;
        ctx.strokeStyle = c.windupFx;
        ctx.lineWidth = 2 + p * 2;
        ctx.beginPath();
        ctx.arc(0, -e.h * 0.45, e.w * (0.9 + (1 - p) * 0.6), 0, TAU);
        ctx.stroke();
        ctx.restore();
    }
    // Afterimages: investidas rápidas deixam rastros vivos atrás do corpo.
    const fastAttack = e.state === 'attack' &&
        !e.dead &&
        (e.def.ai === 'charger' ||
            e.def.ai === 'leaper' ||
            e.def.ai === 'diver' ||
            e.def.ai === 'teleporter' ||
            e.def.ai === 'mirror');
    if (fastAttack) {
        const spacing = e.def.ai === 'charger' ? 42 : e.def.ai === 'diver' ? 22 : 28;
        for (let i = 3; i >= 1; i--) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.045 + (3 - i) * 0.03;
            ctx.translate(-spacing * i, e.def.ai === 'diver' ? -i * 13 : 0);
            drawEnemyBody(ctx, e, time - i * 0.035, col, accent, dark, walk);
            ctx.restore();
        }
    }
    drawEnemyBody(ctx, e, time, col, accent, dark, walk);
    drawEnemyAttackFx(ctx, e, time, accent);
    if (e.elite) {
        // Coroa de elite com halo e gema central.
        const y = -e.h * 0.95 - 6;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, 0, y - 2, 26, accent, 0.42);
        ctx.strokeStyle = hexToRgba(accent, 0.65);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(0, y + 1, 18, 5, 0, 0, TAU);
        ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(-12, y);
        ctx.lineTo(-9, y - 11);
        ctx.lineTo(-3, y - 3);
        ctx.lineTo(0, y - 15);
        ctx.lineTo(3, y - 3);
        ctx.lineTo(9, y - 11);
        ctx.lineTo(12, y);
        ctx.lineTo(10, y + 3);
        ctx.lineTo(-10, y + 3);
        ctx.closePath();
        ctx.fill();
        outlinePath(ctx, 1, '#fff4c9');
        ctx.fillStyle = '#fff4c9';
        ctx.beginPath();
        ctx.arc(0, y - 5, 2.2, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = e.alpha;
    }
    ctx.restore();
}
/** Corpo do inimigo sem os efeitos de cena; também usado pelos afterimages. */
function drawEnemyBody(ctx, e, time, col, accent, dark, walk) {
    switch (e.def.kind) {
        case 'crawler':
            drawCrawler(ctx, e, time, col, accent, dark, walk);
            break;
        case 'warrior':
            drawWarrior(ctx, e, time, col, accent, dark, walk);
            break;
        case 'drone':
            drawDrone(ctx, e, time, col, accent, dark);
            break;
        case 'hound':
            drawHound(ctx, e, time, col, accent, dark, walk);
            break;
        case 'caster':
            drawCaster(ctx, e, time, col, accent, dark);
            break;
        case 'brute':
            drawBrute(ctx, e, time, col, accent, dark, walk);
            break;
        case 'shade':
            drawShade(ctx, e, time, col, accent, dark);
            break;
        case 'construct':
            drawConstruct(ctx, e, time, col, accent, dark);
            break;
        case 'seraph':
            drawSeraph(ctx, e, time, col, accent, dark);
            break;
        case 'echo':
            drawEcho(ctx, e, time, col, accent, dark, walk);
            break;
    }
}
/** Telegrafia de ataque no espaço do mundo. */
function drawEnemyTelegraphs(ctx, e, time) {
    const windup = e.state === 'windup' ? e.windupRatio : 0;
    const attackFade = e.state === 'attack' ? 1 - e.attackRatio : 0;
    const p = Math.max(windup, attackFade);
    if (p <= 0.01 || e.dead)
        return;
    const floor = e.stage.floor;
    const color = e.def.windupFx;
    const pulse = 0.62 + Math.sin(time * 22) * 0.24;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    switch (e.def.ai) {
        case 'charger': {
            const dir = e.facing;
            const reach = 440;
            const x1 = e.x + dir * 24;
            const x2 = e.x + dir * reach;
            const top = floor - 60;
            const h = 54;
            const g = ctx.createLinearGradient(x1, 0, x2, 0);
            g.addColorStop(0, hexToRgba(color, 0.02));
            g.addColorStop(0.14, hexToRgba(color, 0.16 + p * 0.24));
            g.addColorStop(1, hexToRgba(color, 0));
            ctx.fillStyle = g;
            ctx.fillRect(Math.min(x1, x2), top, Math.abs(x2 - x1), h);
            ctx.strokeStyle = hexToRgba(color, 0.3 * pulse);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x1, floor - 2);
            ctx.lineTo(x2, floor - 2);
            ctx.stroke();
            for (let i = 0; i < 5; i++) {
                const cx = e.x + dir * (72 + i * 72);
                ctx.strokeStyle = hexToRgba(color, (0.2 + p * 0.55) * pulse);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(cx - dir * 9, top + 9);
                ctx.lineTo(cx + dir * 5, top + h / 2);
                ctx.lineTo(cx - dir * 9, top + h - 9);
                ctx.stroke();
            }
            break;
        }
        case 'brute': {
            const r = e.elite ? 170 : 135;
            const g = ctx.createRadialGradient(e.x, floor, 6, e.x, floor, r);
            g.addColorStop(0, hexToRgba(color, 0.16 + p * 0.16));
            g.addColorStop(0.72, hexToRgba(color, 0.07));
            g.addColorStop(1, hexToRgba(color, 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(e.x, floor, r, r * 0.25, 0, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = hexToRgba(color, (0.32 + p * 0.45) * pulse);
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(e.x, floor, r * (1 - p * 0.12), r * 0.25 * (1 - p * 0.12), 0, 0, TAU);
            ctx.stroke();
            for (let i = 0; i < 7; i++) {
                const a = (i / 7) * TAU + e.animPhase;
                const inner = r * 0.2;
                const outer = r * (0.55 + p * 0.35);
                ctx.strokeStyle = hexToRgba(color, (0.12 + p * 0.3) * pulse);
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(e.x + Math.cos(a) * inner, floor + Math.sin(a) * inner * 0.24);
                ctx.lineTo(e.x + Math.cos(a) * outer, floor + Math.sin(a) * outer * 0.24);
                ctx.stroke();
            }
            break;
        }
        case 'diver': {
            const tx = e.aimX;
            const r = 72;
            const g = ctx.createRadialGradient(tx, floor, 3, tx, floor, r);
            g.addColorStop(0, hexToRgba(color, 0.18 + p * 0.18));
            g.addColorStop(1, hexToRgba(color, 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(tx, floor, r, r * 0.3, 0, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = hexToRgba(color, (0.35 + p * 0.45) * pulse);
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(tx, floor, r * (1 - p * 0.1), r * 0.3 * (1 - p * 0.1), 0, 0, TAU);
            ctx.stroke();
            ctx.setLineDash([7, 9]);
            ctx.strokeStyle = hexToRgba(color, 0.18 + p * 0.28);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(e.x, e.y - 20);
            ctx.lineTo(tx, floor - 4);
            ctx.stroke();
            ctx.setLineDash([]);
            break;
        }
        case 'leaper': {
            const tx = e.aimX;
            const r = 66;
            ctx.strokeStyle = hexToRgba(color, (0.3 + p * 0.45) * pulse);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(tx, floor, r, r * 0.28, 0, 0, TAU);
            ctx.stroke();
            ctx.fillStyle = hexToRgba(color, 0.06 + p * 0.1);
            ctx.beginPath();
            ctx.ellipse(tx, floor, r, r * 0.28, 0, 0, TAU);
            ctx.fill();
            ctx.setLineDash([6, 8]);
            ctx.strokeStyle = hexToRgba(color, 0.16 + p * 0.24);
            ctx.beginPath();
            ctx.moveTo(e.x, e.y - 8);
            ctx.quadraticCurveTo((e.x + tx) * 0.5, floor - 210, tx, floor - 6);
            ctx.stroke();
            ctx.setLineDash([]);
            break;
        }
        case 'flyer':
        case 'caster':
        case 'turret': {
            const ax = e.aimX;
            const ay = e.aimY;
            const muzzleY = e.y - e.h * 0.62;
            ctx.setLineDash([5, 8]);
            ctx.strokeStyle = hexToRgba(color, 0.16 + p * 0.32);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(e.x, muzzleY);
            ctx.lineTo(ax, ay);
            ctx.stroke();
            ctx.setLineDash([]);
            const rr = 16 + (1 - p) * 20;
            ctx.strokeStyle = hexToRgba(color, (0.38 + p * 0.45) * pulse);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ax, ay, rr, 0, TAU);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(ax - rr - 7, ay);
            ctx.lineTo(ax - rr + 5, ay);
            ctx.moveTo(ax + rr - 5, ay);
            ctx.lineTo(ax + rr + 7, ay);
            ctx.moveTo(ax, ay - rr - 7);
            ctx.lineTo(ax, ay - rr + 5);
            ctx.moveTo(ax, ay + rr - 5);
            ctx.lineTo(ax, ay + rr + 7);
            ctx.stroke();
            break;
        }
        default: {
            // melee, mirror e teleporter: cunha de alcance à frente.
            const dir = e.facing;
            const reach = e.def.range + 34;
            const y = floor - e.h * 0.56;
            const g = ctx.createLinearGradient(e.x, 0, e.x + dir * reach, 0);
            g.addColorStop(0, hexToRgba(color, 0.02));
            g.addColorStop(1, hexToRgba(color, 0.18 + p * 0.24));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(e.x, y - 28);
            ctx.lineTo(e.x + dir * reach, y - 12);
            ctx.lineTo(e.x + dir * reach, y + 28);
            ctx.lineTo(e.x, y + 28);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = hexToRgba(color, (0.3 + p * 0.4) * pulse);
            ctx.lineWidth = 2;
            ctx.stroke();
            break;
        }
    }
    ctx.restore();
}
/** Aura de fúria: leitura imediata de que a criatura entrou em estado crítico. */
function drawEnemyAura(ctx, e, time, accent) {
    if (!e.enrage && e.enragePulse <= 0)
        return;
    const burst = clamp(e.enragePulse / 1.2, 0, 1);
    const pulse = 0.55 + Math.sin(time * 9 + e.animPhase) * 0.22;
    const r = e.w * (0.82 + pulse * 0.14 + burst * 0.3);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, -e.h * 0.45, 4, 0, -e.h * 0.45, r);
    g.addColorStop(0, hexToRgba('#ff3b2f', 0.1 + burst * 0.16));
    g.addColorStop(0.6, hexToRgba(accent, 0.07 + burst * 0.1));
    g.addColorStop(1, hexToRgba(accent, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, -e.h * 0.45, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = hexToRgba('#ff5a3c', (0.24 + burst * 0.4) * pulse);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, e.w * (0.78 + burst * 0.2), e.w * 0.2, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
}
/** Rastro do golpe: arco, linha de velocidade, estilhaço ou clarão de tiro. */
function drawEnemyAttackFx(ctx, e, time, accent) {
    if (e.state !== 'attack' && e.state !== 'recover')
        return;
    const fade = e.state === 'recover' ? clamp(1 - e.stateTime / 0.32, 0, 1) : 1;
    if (fade <= 0)
        return;
    const p = e.state === 'attack' ? e.attackRatio : 1;
    const color = e.def.windupFx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = fade;
    if (e.def.ai === 'charger') {
        for (let i = 0; i < 6; i++) {
            const y = -e.h * (0.18 + i * 0.12);
            const len = e.w * (0.6 + (i % 3) * 0.25);
            ctx.strokeStyle = hexToRgba(color, 0.28 + (i % 2) * 0.16);
            ctx.lineWidth = 1.5 + (i % 2);
            ctx.beginPath();
            ctx.moveTo(-len, y);
            ctx.lineTo(-e.w * 0.2, y);
            ctx.stroke();
        }
    }
    else if (e.def.ai === 'brute') {
        ctx.strokeStyle = hexToRgba(color, 0.45 * fade);
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * TAU + 0.3;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * e.w * 0.2, -2 + Math.sin(a) * e.w * 0.06);
            ctx.lineTo(Math.cos(a) * e.w * 0.75, -2 + Math.sin(a) * e.w * 0.18);
            ctx.stroke();
        }
    }
    else if (e.def.ai === 'diver') {
        ctx.strokeStyle = hexToRgba(color, 0.55 * fade);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -e.h * 0.2);
        ctx.lineTo(0, -e.h * 1.15);
        ctx.stroke();
        ctx.strokeStyle = hexToRgba('#ffffff', 0.25 * fade);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-e.w * 0.16, -e.h * 0.25);
        ctx.lineTo(-e.w * 0.16, -e.h * 1.05);
        ctx.moveTo(e.w * 0.16, -e.h * 0.25);
        ctx.lineTo(e.w * 0.16, -e.h * 1.05);
        ctx.stroke();
    }
    else if (e.def.ai === 'flyer' || e.def.ai === 'caster' || e.def.ai === 'turret') {
        const my = -e.h * 0.62;
        const flash = 1 - Math.min(1, p * 2);
        const g = ctx.createRadialGradient(0, my, 1, 0, my, 24 + flash * 16);
        g.addColorStop(0, hexToRgba('#ffffff', 0.5 * fade));
        g.addColorStop(0.4, hexToRgba(color, 0.3 * fade));
        g.addColorStop(1, hexToRgba(color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, my, 24 + flash * 16, 0, TAU);
        ctx.fill();
    }
    else if (e.def.ai !== 'leaper') {
        const cy = -e.h * 0.55;
        const sweep = -1.1 + p * 2.2;
        ctx.strokeStyle = hexToRgba(color, 0.7 * fade);
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.arc(0, cy, e.w * 0.92, sweep - 0.55, sweep + 0.55);
        ctx.stroke();
        ctx.strokeStyle = hexToRgba('#ffffff', 0.4 * fade);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, cy, e.w * 0.76, sweep - 0.45, sweep + 0.45);
        ctx.stroke();
    }
    ctx.restore();
}
/** Fenda de spawn: o inimigo nasce de uma rasgo no chão, não do nada. */
function drawSpawnRift(ctx, e, time) {
    if (e.state !== 'spawn' || e.dead)
        return;
    const p = clamp(1 - e.spawnTimer / 0.8, 0, 1);
    const floor = e.stage.floor;
    const accent = e.def.accent;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(e.x, floor, 2, e.x, floor, 66 + p * 34);
    g.addColorStop(0, hexToRgba(accent, 0.24));
    g.addColorStop(0.5, hexToRgba(accent, 0.08));
    g.addColorStop(1, hexToRgba(accent, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(e.x, floor, 66 + p * 34, 17 + p * 8, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(accent, 0.3 + p * 0.3);
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.17 + Math.sin(time * 3 + i) * 0.03;
        const len = 44 + p * 58 + (i % 2) * 12;
        ctx.beginPath();
        ctx.moveTo(e.x, floor);
        ctx.lineTo(e.x + Math.cos(a) * len * 0.42, floor - len);
        ctx.stroke();
    }
    ctx.restore();
}
function drawCrawler(ctx, e, time, col, accent, dark, walk) {
    const crouch = e.state === 'windup' ? 0.35 : 0;
    ctx.translate(0, crouch * 10);
    const bodyY = -22;
    // Cauda segmentada com ferrão.
    ctx.save();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-26, bodyY - 2);
    ctx.quadraticCurveTo(-38, -30 + Math.sin(time * 2) * 2, -46, -18);
    ctx.quadraticCurveTo(-50, -10, -40, -5);
    ctx.stroke();
    ctx.strokeStyle = tintShade(col);
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-40, -5);
    ctx.lineTo(-47, 3);
    ctx.lineTo(-34, -1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Seis patas articuladas com placas e garras.
    for (let i = 0; i < 3; i++) {
        for (const side of [-1, 1]) {
            const baseX = side * (7 + i * 8);
            const baseY = bodyY + i * 2;
            const ph = walk * 1.4 + i * 1.8 + (side > 0 ? 0.7 : 0);
            const kneeX = baseX + side * (12 + i * 2);
            const kneeY = baseY - 9 + Math.sin(ph) * 2;
            const footX = baseX + side * (23 + i * 3);
            const footY = -2 + Math.cos(ph) * 2;
            armoredLimb(ctx, baseX, baseY, kneeX, kneeY, 3.2, tintShade(col), { dark });
            armoredLimb(ctx, kneeX, kneeY, footX, footY, 2.4, col, { dark, band: true, accent });
            claw(ctx, footX, footY, side * 4, side > 0 ? 0.2 : Math.PI - 0.2, accent);
        }
    }
    // Sombra interna / abdômen.
    ctx.fillStyle = 'rgba(5,4,8,0.55)';
    ctx.beginPath();
    ctx.ellipse(0, -18, 30, 10, 0, 0, TAU);
    ctx.fill();
    // Carapaça principal.
    const grad = ctx.createLinearGradient(-32, -38, 30, -10);
    grad.addColorStop(0, tintShade(col));
    grad.addColorStop(0.45, col);
    grad.addColorStop(1, dark);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, bodyY, 32, 15, 0, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 2);
    // Placas sobrepostas.
    for (let i = 0; i < 4; i++) {
        const px = -22 + i * 13;
        ctx.fillStyle = i % 2 === 0 ? tintShade(col) : mixColor(col, '#ffffff', 0.12);
        ctx.beginPath();
        ctx.ellipse(px, bodyY - 9, 9, 6, -0.18, 0, TAU);
        ctx.fill();
        outlinePath(ctx, 1);
        ctx.strokeStyle = hexToRgba(accent, 0.55);
        ctx.beginPath();
        ctx.arc(px, bodyY - 9, 6, Math.PI * 1.1, Math.PI * 1.75);
        ctx.stroke();
    }
    // Rachaduras bioluminescentes.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = hexToRgba(accent, 0.8);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-18, -26);
    ctx.lineTo(-12, -20);
    ctx.lineTo(-6, -24);
    ctx.lineTo(2, -18);
    ctx.lineTo(8, -25);
    ctx.stroke();
    ctx.restore();
    // Espinhos dorsais.
    for (let i = 0; i < 5; i++) {
        spike(ctx, -20 + i * 10, bodyY - 13, 5, 11 + (i % 2) * 4, dark, -0.08 + i * 0.04);
    }
    // Cabeça angular com mandíbulas e múltiplos olhos.
    ctx.save();
    ctx.translate(28, -23);
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(8, -10);
    ctx.lineTo(14, -2);
    ctx.lineTo(8, 8);
    ctx.lineTo(-8, 7);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.8);
    ctx.strokeStyle = tintShade(col);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, -2);
    ctx.quadraticCurveTo(18, -6, 22, -1);
    ctx.moveTo(8, 4);
    ctx.quadraticCurveTo(18, 8, 20, 3);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(20, -1);
    ctx.lineTo(24, -4);
    ctx.moveTo(18, 4);
    ctx.lineTo(23, 6);
    ctx.stroke();
    enemyEye(ctx, 1, -4, 2.4, accent, { angry: true, glow: false });
    enemyEye(ctx, 7, -6, 1.8, accent, { angry: true, glow: false });
    enemyEye(ctx, 5, 2, 1.6, accent, { glow: false });
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-4, -8);
    ctx.quadraticCurveTo(-12, -20, -4, -25);
    ctx.moveTo(2, -9);
    ctx.quadraticCurveTo(10, -19, 16, -17);
    ctx.stroke();
    ctx.restore();
    glow(ctx, 30, -23, 18, e.def.glow, 0.28 + Math.sin(time * 4) * 0.04);
}
function drawWarrior(ctx, e, time, col, accent, dark, walk) {
    const armSwing = e.state === 'attack' ? 1.3 : e.state === 'windup' ? -1.5 : walk * 0.2;
    const lean = e.state === 'attack' ? 0.25 : 0.06;
    ctx.save();
    ctx.rotate(lean * 0.2);
    // Capa curta atrás do corpo.
    ctx.fillStyle = tintShade(dark);
    ctx.beginPath();
    ctx.moveTo(-8, -64);
    ctx.quadraticCurveTo(-30, -50, -26 - walk * 2, -10);
    ctx.quadraticCurveTo(-16, -22, -4, -36);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.2);
    // Perna traseira.
    armoredLimb(ctx, -5, -40, -9 + walk * 5, -20, 7, dark, { band: true, accent });
    armoredLimb(ctx, -9 + walk * 5, -20, -11 + walk * 8, 0, 6, tintShade(col), { band: true, accent });
    ctx.save();
    ctx.translate(-11 + walk * 8, -2);
    ctx.fillStyle = dark;
    roundRectPath(ctx, -6, -4, 14, 6, 2);
    ctx.fill();
    outlinePath(ctx, 1.2);
    ctx.restore();
    // Perna dianteira.
    armoredLimb(ctx, 5, -40, 9 - walk * 5, -20, 7, dark, { band: true, accent });
    armoredLimb(ctx, 9 - walk * 5, -20, 12 - walk * 8, 0, 6, tintShade(col), { band: true, accent });
    ctx.save();
    ctx.translate(12 - walk * 8, -2);
    ctx.fillStyle = tintShade(dark);
    roundRectPath(ctx, -5, -4, 15, 6, 2);
    ctx.fill();
    outlinePath(ctx, 1.2);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3, -2);
    ctx.lineTo(8, -2);
    ctx.stroke();
    ctx.restore();
    // Braço traseiro com escudo.
    const shieldArm = joint(-11, -62, 20, -0.5 + walk * 0.1);
    armoredLimb(ctx, -11, -62, shieldArm.x, shieldArm.y, 6, col, { band: true, accent });
    ctx.save();
    ctx.translate(shieldArm.x - 3, shieldArm.y + 2);
    ctx.rotate(0.12);
    ctx.fillStyle = tintShade(dark);
    ctx.beginPath();
    ctx.moveTo(-11, -16);
    ctx.quadraticCurveTo(11, -16, 11, -3);
    ctx.quadraticCurveTo(8, 10, 0, 17);
    ctx.quadraticCurveTo(-8, 10, -11, -3);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.6);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-7, -12);
    ctx.quadraticCurveTo(7, -12, 7, -2);
    ctx.quadraticCurveTo(5, 8, 0, 13);
    ctx.quadraticCurveTo(-5, 8, -7, -2);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(accent, 0.8);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 10);
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(0, 0, 2.8, 0, TAU);
    ctx.fill();
    ctx.restore();
    // Torso com placas sobrepostas.
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-12, -38);
    ctx.lineTo(-14, -64);
    ctx.quadraticCurveTo(0, -76, 14, -64);
    ctx.lineTo(12, -38);
    ctx.lineTo(0, -32);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.8);
    ctx.fillStyle = 'rgba(5,4,8,0.22)';
    ctx.beginPath();
    ctx.moveTo(-14, -64);
    ctx.lineTo(-4, -72);
    ctx.lineTo(-2, -34);
    ctx.lineTo(-12, -38);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = tintShade(dark);
    ctx.beginPath();
    ctx.moveTo(-12, -66);
    ctx.lineTo(12, -66);
    ctx.lineTo(9, -48);
    ctx.lineTo(0, -44);
    ctx.lineTo(-9, -48);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.4);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-8, -60);
    ctx.lineTo(8, -60);
    ctx.moveTo(0, -64);
    ctx.lineTo(0, -46);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i % 2 === 0 ? tintShade(dark) : dark;
        roundRectPath(ctx, -8, -44 + i * 5, 16, 4, 1.5);
        ctx.fill();
        outlinePath(ctx, 0.9);
    }
    // Cinto e tassets.
    ctx.fillStyle = dark;
    roundRectPath(ctx, -13, -38, 26, 5, 2);
    ctx.fill();
    outlinePath(ctx, 1);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(0, -35.5, 2.2, 0, TAU);
    ctx.fill();
    for (const side of [-1, 1]) {
        ctx.fillStyle = tintShade(dark);
        ctx.beginPath();
        ctx.moveTo(side * 8, -34);
        ctx.lineTo(side * 15, -30);
        ctx.lineTo(side * 12, -20);
        ctx.lineTo(side * 6, -24);
        ctx.closePath();
        ctx.fill();
        outlinePath(ctx, 1);
    }
    // Ombros com espinhos.
    ctx.fillStyle = tintShade(col);
    ctx.beginPath();
    ctx.ellipse(-15, -66, 10, 7, -0.4, 0, TAU);
    ctx.ellipse(15, -66, 10, 7, 0.4, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 1.4);
    spike(ctx, -21, -68, 6, 13, dark, -0.5);
    spike(ctx, 21, -68, 6, 13, dark, 0.5);
    // Cabeça com elmo, visor e crista.
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.ellipse(0, -84, 10, 11, 0, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 1.4);
    ctx.fillStyle = tintShade(col);
    ctx.beginPath();
    ctx.moveTo(-8, -88);
    ctx.lineTo(8, -88);
    ctx.lineTo(6, -78);
    ctx.lineTo(-6, -78);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -84);
    ctx.lineTo(7, -84);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-2, -94);
    ctx.quadraticCurveTo(-8, -104, -4, -112);
    ctx.stroke();
    spike(ctx, -9, -90, 5, 12, tintShade(col), -0.4);
    spike(ctx, 9, -90, 5, 12, tintShade(col), 0.4);
    // Braço dianteiro com lâmina.
    const shoulder = { x: 11, y: -64 };
    const elbow = joint(shoulder.x, shoulder.y, 16, armSwing);
    const hand = joint(elbow.x, elbow.y, 16, armSwing + 0.4);
    armoredLimb(ctx, shoulder.x, shoulder.y, elbow.x, elbow.y, 6, col, { band: true, accent });
    armoredLimb(ctx, elbow.x, elbow.y, hand.x, hand.y, 5, tintShade(col), { band: true, accent });
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, 4, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 1);
    ctx.save();
    ctx.translate(hand.x, hand.y);
    ctx.rotate(armSwing * 0.9 - 0.15);
    ctx.strokeStyle = '#2a1c24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(5, 0);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(3, -7);
    ctx.lineTo(3, 7);
    ctx.stroke();
    ctx.fillStyle = tintShade(col);
    ctx.beginPath();
    ctx.moveTo(4, -4);
    ctx.lineTo(44, -8);
    ctx.lineTo(52, 0);
    ctx.lineTo(42, 5);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.4);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(8, -3);
    ctx.lineTo(44, -6);
    ctx.stroke();
    glow(ctx, 34, -2, 14, accent, 0.18);
    ctx.restore();
    ctx.restore();
    void time;
}
function drawDrone(ctx, e, time, col, accent, dark) {
    const hover = Math.sin(time * 2.6 + e.animPhase) * 2;
    ctx.translate(0, hover);
    // Casco inferior blindado.
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.ellipse(0, -31, 24, 15, 0, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 1.8);
    // Cúpula superior.
    const shell = ctx.createLinearGradient(-20, -54, 18, -26);
    shell.addColorStop(0, mixColor(col, '#ffffff', 0.22));
    shell.addColorStop(0.55, col);
    shell.addColorStop(1, dark);
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.moveTo(-20, -34);
    ctx.quadraticCurveTo(-18, -52, 0, -55);
    ctx.quadraticCurveTo(18, -52, 20, -34);
    ctx.lineTo(12, -24);
    ctx.lineTo(-12, -24);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.6);
    // Placas de blindagem e rebites.
    ctx.strokeStyle = hexToRgba(accent, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-14, -44);
    ctx.quadraticCurveTo(0, -48, 14, -44);
    ctx.moveTo(-10, -31);
    ctx.lineTo(10, -31);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 === 0 ? accent : mixColor(col, '#ffffff', 0.5);
        ctx.beginPath();
        ctx.arc(-16 + i * 8, -48 + (i % 2) * 2, 1, 0, TAU);
        ctx.fill();
    }
    // Anel rotativo externo.
    ctx.save();
    ctx.translate(0, -34);
    ctx.rotate(time * 1.6);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.ellipse(0, 0, 29, 9, 0.25, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 7, -0.5, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 29, Math.sin(a) * 9, 2, 0, TAU);
        ctx.fill();
    }
    ctx.restore();
    // Alojamento do olho.
    ctx.fillStyle = '#08050c';
    ctx.beginPath();
    ctx.arc(4, -38, 10, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 1.6);
    const lens = ctx.createRadialGradient(2, -40, 1, 4, -38, 8);
    lens.addColorStop(0, '#ffffff');
    lens.addColorStop(0.35, accent);
    lens.addColorStop(0.8, mixColor(accent, '#08050c', 0.55));
    lens.addColorStop(1, '#08050c');
    ctx.fillStyle = lens;
    ctx.beginPath();
    ctx.arc(4, -38, 7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#08050c';
    ctx.beginPath();
    ctx.ellipse(4, -38, 2.2, 4.4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(2, -40, 1.4, 0, TAU);
    ctx.fill();
    // Blindagem ao redor do olho.
    ctx.strokeStyle = tintShade(col);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(4, -38, 11.5, Math.PI * 0.65, Math.PI * 1.35);
    ctx.stroke();
    // Pods laterais com tubos de mísseis.
    for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side * 21, -36);
        ctx.rotate(side * 0.08);
        ctx.fillStyle = tintShade(dark);
        roundRectPath(ctx, -7, -8, 14, 16, 3);
        ctx.fill();
        outlinePath(ctx, 1.2);
        ctx.fillStyle = accent;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, -5 + i * 5, 1.5, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }
    // Propulsores com chama.
    for (const side of [-1, 1]) {
        ctx.fillStyle = tintShade(dark);
        roundRectPath(ctx, side * 16 - 4, -25, 8, 9, 2);
        ctx.fill();
        outlinePath(ctx, 1);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.55 + Math.random() * 0.3;
        ctx.beginPath();
        ctx.moveTo(side * 16 - 4, -17);
        ctx.lineTo(side * 16, -5 - Math.random() * 8);
        ctx.lineTo(side * 16 + 4, -17);
        ctx.fill();
        ctx.restore();
    }
    // Braços manipuladores recolhidos.
    for (const side of [-1, 1]) {
        const elbow = { x: side * 27, y: -25 };
        const hand = { x: side * 31, y: -17 };
        armoredLimb(ctx, side * 18, -28, elbow.x, elbow.y, 2.4, tintShade(col), { dark });
        armoredLimb(ctx, elbow.x, elbow.y, hand.x, hand.y, 1.8, col, { dark });
        claw(ctx, hand.x, hand.y, side * 4, side > 0 ? 0.9 : Math.PI - 0.9, accent);
    }
    // Antenas e sensores.
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-10, -51);
    ctx.lineTo(-16, -62);
    ctx.moveTo(8, -51);
    ctx.lineTo(14, -60);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(-16, -62, 1.6, 0, TAU);
    ctx.arc(14, -60, 1.6, 0, TAU);
    ctx.fill();
    glow(ctx, 4, -38, 24, e.def.glow, 0.2 + Math.sin(time * 3) * 0.04);
}
function drawHound(ctx, e, time, col, accent, dark, walk) {
    ctx.translate(0, -6);
    const bodyY = -24;
    // Cauda com brasa na ponta.
    ctx.strokeStyle = dark;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-28, bodyY - 2);
    ctx.quadraticCurveTo(-42, -34 + Math.sin(time * 5) * 3, -46, -18);
    ctx.stroke();
    ctx.strokeStyle = tintShade(col);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, -46, -18, 12, accent, 0.5);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-46, -18);
    ctx.quadraticCurveTo(-52, -26, -48, -30);
    ctx.quadraticCurveTo(-44, -22, -42, -18);
    ctx.fill();
    ctx.restore();
    // Quatro patas articuladas com garras.
    for (let i = 0; i < 4; i++) {
        const px = -18 + i * 12;
        const ph = walk * 1.4 + i * 1.3;
        const kneeX = px + Math.sin(ph) * 4;
        const kneeY = -12;
        const footX = px + Math.sin(ph) * 7;
        const footY = 0;
        armoredLimb(ctx, px, bodyY, kneeX, kneeY, 4.5, i % 2 === 0 ? dark : tintShade(col), {
            dark,
            band: true,
            accent,
        });
        armoredLimb(ctx, kneeX, kneeY, footX, footY, 3.5, col, { dark });
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.ellipse(footX + 2, -1, 5, 2.5, 0, 0, TAU);
        ctx.fill();
        outlinePath(ctx, 0.9);
        claw(ctx, footX + 5, -1, 4, 0.15, accent);
    }
    // Corpo esguio com costelas e crina.
    const grad = ctx.createLinearGradient(-30, -36, 26, -14);
    grad.addColorStop(0, dark);
    grad.addColorStop(0.5, col);
    grad.addColorStop(1, dark);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, bodyY, 30, 13, -0.06, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 1.8);
    // Costelas.
    ctx.strokeStyle = hexToRgba(accent, 0.4);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(-10 + i * 7, bodyY, 10 - i * 1.2, -1.15, 1.15);
        ctx.stroke();
    }
    // Crina de brasas.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
        const fx = -18 + i * 7;
        const fh = 8 + Math.sin(time * 9 + i) * 4;
        ctx.fillStyle = hexToRgba(accent, 0.5);
        ctx.beginPath();
        ctx.moveTo(fx - 4, -32);
        ctx.quadraticCurveTo(fx, -32 - fh, fx + 4, -32);
        ctx.fill();
    }
    ctx.restore();
    // Espinhos dorsais.
    for (let i = 0; i < 4; i++) {
        spike(ctx, -12 + i * 9, bodyY - 11, 5, 11 + (i % 2) * 4, tintShade(col), -0.08);
    }
    // Cabeça com focinho alongado, mandíbula, presas e coleira.
    ctx.save();
    ctx.translate(28, -30);
    // Pescoço.
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(-10, 4, 10, 8, -0.15, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 1.2);
    // Crânio.
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 9, 0.08, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 1.6);
    // Focinho alongado.
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(6, -5);
    ctx.lineTo(22, -2);
    ctx.lineTo(20, 5);
    ctx.lineTo(6, 6);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.2);
    ctx.strokeStyle = tintShade(dark);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(7, -2);
    ctx.lineTo(19, 0);
    ctx.stroke();
    // Mandíbula aberta e dentes.
    ctx.fillStyle = '#1a0910';
    ctx.beginPath();
    ctx.moveTo(7, 6);
    ctx.lineTo(20, 5);
    ctx.lineTo(17, 10);
    ctx.lineTo(6, 10);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 0.9);
    ctx.fillStyle = '#fff1d0';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(9 + i * 3, 6);
        ctx.lineTo(10 + i * 3, 10);
        ctx.lineTo(11 + i * 3, 6);
        ctx.fill();
    }
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(14, 8, 3, 1.4, 0, 0, TAU);
    ctx.fill();
    // Olho e sobrancelha.
    enemyEye(ctx, 0, -4, 2.8, accent, { angry: true, glow: false });
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-5, -9);
    ctx.lineTo(7, -6);
    ctx.stroke();
    // Orelhas e chifre.
    spike(ctx, -8, -7, 5, 12, tintShade(col), -0.6);
    spike(ctx, 3, -8, 4, 10, tintShade(col), 0.2);
    ctx.strokeStyle = tintShade(col);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-3, -8);
    ctx.quadraticCurveTo(-10, -17, -6, -22);
    ctx.stroke();
    // Coleira com elos.
    ctx.strokeStyle = tintShade(dark);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-6, 5, 11, 0.2, Math.PI * 1.1);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = 'rgba(200, 190, 170, 0.55)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(-13 - i * 3, 10 + i * 4, 2.4, 0, TAU);
        ctx.stroke();
    }
    ctx.restore();
    glow(ctx, 36, -32, 18, e.def.glow, 0.24 + Math.sin(time * 4) * 0.04);
}
function drawCaster(ctx, e, time, col, accent, dark) {
    const float = Math.sin(time * 2 + e.animPhase) * 3;
    ctx.translate(0, float);
    // Cajado atrás do manto.
    ctx.save();
    ctx.translate(30, 0);
    ctx.strokeStyle = '#241522';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(4, -96);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(1, 2);
    ctx.lineTo(5, -92);
    ctx.stroke();
    ctx.strokeStyle = tintShade(col);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4, -92);
    ctx.quadraticCurveTo(-6, -102, -2, -112);
    ctx.moveTo(4, -92);
    ctx.quadraticCurveTo(14, -102, 10, -112);
    ctx.stroke();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const orb = ctx.createRadialGradient(4, -102, 0, 4, -102, 14);
    orb.addColorStop(0, '#ffffff');
    orb.addColorStop(0.35, accent);
    orb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(4, -102, 14, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.restore();
    // Manto externo com camadas e barra rasgada.
    const g = ctx.createLinearGradient(0, -86, 0, 6);
    g.addColorStop(0, col);
    g.addColorStop(0.58, dark);
    g.addColorStop(1, 'rgba(10,6,12,0.12)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-18, -72);
    ctx.quadraticCurveTo(-34, -30, -24, 2);
    ctx.quadraticCurveTo(0, -10, 24, 2);
    ctx.quadraticCurveTo(34, -30, 18, -72);
    ctx.quadraticCurveTo(0, -84, -18, -72);
    ctx.fill();
    outlinePath(ctx, 1.6);
    // Manto interno / forro.
    ctx.fillStyle = mixColor(col, '#ffffff', 0.1);
    ctx.beginPath();
    ctx.moveTo(-10, -66);
    ctx.quadraticCurveTo(-18, -30, -12, -2);
    ctx.quadraticCurveTo(0, -12, 12, -2);
    ctx.quadraticCurveTo(18, -30, 10, -66);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.5;
    outlinePath(ctx, 1);
    ctx.globalAlpha = 1;
    // Barra rasgada em tiras.
    ctx.fillStyle = dark;
    for (let i = 0; i < 5; i++) {
        const x = -22 + i * 11;
        ctx.beginPath();
        ctx.moveTo(x, -4);
        ctx.lineTo(x - 3, 8 + (i % 2) * 5);
        ctx.lineTo(x + 3, 2);
        ctx.closePath();
        ctx.fill();
    }
    // Trim e cinto do manto.
    ctx.strokeStyle = hexToRgba(accent, 0.55);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-20, -58);
    ctx.quadraticCurveTo(-30, -22, -20, 2);
    ctx.moveTo(20, -58);
    ctx.quadraticCurveTo(30, -22, 20, 2);
    ctx.stroke();
    ctx.fillStyle = tintShade(dark);
    roundRectPath(ctx, -14, -55, 28, 5, 2);
    ctx.fill();
    outlinePath(ctx, 1);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(0, -52.5, 2.2, 0, TAU);
    ctx.fill();
    // Mantle / ombros.
    ctx.fillStyle = tintShade(dark);
    ctx.beginPath();
    ctx.moveTo(-22, -68);
    ctx.quadraticCurveTo(0, -78, 22, -68);
    ctx.quadraticCurveTo(14, -58, 0, -56);
    ctx.quadraticCurveTo(-14, -58, -22, -68);
    ctx.fill();
    outlinePath(ctx, 1.2);
    ctx.strokeStyle = hexToRgba(accent, 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-18, -67);
    ctx.quadraticCurveTo(0, -74, 18, -67);
    ctx.stroke();
    // Capuz.
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(0, -78, 16, Math.PI * 0.95, TAU * 1.05);
    ctx.fill();
    outlinePath(ctx, 1.4);
    // Vazio interno.
    ctx.fillStyle = '#050308';
    ctx.beginPath();
    ctx.ellipse(0, -78, 10, 12, 0, 0, TAU);
    ctx.fill();
    // Máscara e olhos.
    ctx.strokeStyle = tintShade(col);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-8, -82);
    ctx.lineTo(-2, -86);
    ctx.lineTo(2, -82);
    ctx.lineTo(8, -86);
    ctx.stroke();
    enemyEye(ctx, -4, -80, 2.2, accent, { glow: false, vertical: true });
    enemyEye(ctx, 5, -80, 2.2, accent, { glow: false, vertical: true });
    runeMark(ctx, 0, -88, 2.4, hexToRgba(accent, 0.8), 0.2);
    // Mangas largas e mãos com magia.
    for (const side of [-1, 1]) {
        const hx = side * 31;
        const hy = -48 + Math.sin(time * 3 + side) * 4;
        ctx.fillStyle = side > 0 ? tintShade(col) : dark;
        ctx.beginPath();
        ctx.moveTo(side * 14, -66);
        ctx.quadraticCurveTo(side * 30, -62, hx, hy - 4);
        ctx.quadraticCurveTo(side * 24, hy + 8, side * 12, -54);
        ctx.closePath();
        ctx.fill();
        outlinePath(ctx, 1.2);
        armoredLimb(ctx, side * 14, -62, hx, hy, 3.4, col, { dark });
        ctx.fillStyle = tintShade(col);
        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, TAU);
        ctx.fill();
        outlinePath(ctx, 1);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const gg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 12);
        gg.addColorStop(0, '#ffffff');
        gg.addColorStop(0.4, accent);
        gg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(hx, hy, 12, 0, TAU);
        ctx.fill();
        ctx.restore();
    }
    // Correntes e sinos no cinto.
    ctx.strokeStyle = 'rgba(190, 170, 140, 0.5)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-12 + i * 12, -54);
        ctx.quadraticCurveTo(-16 + i * 14, -34, -8 + i * 8, -18);
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(-8 + i * 8, -17, 1.6, 0, TAU);
        ctx.fill();
    }
    // Runas flutuantes.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, -8, 28, 9, 0, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
        const a = time * 0.9 + (i * TAU) / 5;
        const px = Math.cos(a) * 28;
        const py = -8 + Math.sin(a) * 9;
        ctx.fillStyle = accent;
        ctx.fillRect(px - 1, py - 1, 2, 2);
        runeMark(ctx, px, py, 2.4, hexToRgba(accent, 0.65), a);
    }
    ctx.restore();
    glow(ctx, 0, -60, 44, accent, 0.12 + Math.sin(time * 3) * 0.03);
}
function drawBrute(ctx, e, time, col, accent, dark, walk) {
    const stomp = e.state === 'windup' ? Math.sin(e.stateTime * 26) * 2 : 0;
    ctx.translate(0, stomp);
    // Pernas grossas com placas e botas.
    armoredLimb(ctx, -13, -42, -17 + walk * 5, -20, 14, dark, { band: true, accent });
    armoredLimb(ctx, -17 + walk * 5, -20, -19 + walk * 6, 0, 12, tintShade(col), {
        band: true,
        accent,
    });
    armoredLimb(ctx, 13, -42, 17 - walk * 5, -20, 14, dark, { band: true, accent });
    armoredLimb(ctx, 17 - walk * 5, -20, 19 - walk * 6, 0, 12, tintShade(col), {
        band: true,
        accent,
    });
    for (const side of [-1, 1]) {
        ctx.fillStyle = dark;
        roundRectPath(ctx, side * 19 - 8 + (side < 0 ? walk * 6 : -walk * 6), -5, 18, 7, 2);
        ctx.fill();
        outlinePath(ctx, 1.2);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(side * 19 - 4 + (side < 0 ? walk * 6 : -walk * 6), -2);
        ctx.lineTo(side * 19 + 6 + (side < 0 ? walk * 6 : -walk * 6), -2);
        ctx.stroke();
    }
    // Torso gigante com placas sobrepostas.
    const g = ctx.createLinearGradient(-30, -110, 30, -40);
    g.addColorStop(0, tintShade(col));
    g.addColorStop(0.5, col);
    g.addColorStop(1, dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-24, -40);
    ctx.quadraticCurveTo(-36, -80, -26, -104);
    ctx.quadraticCurveTo(0, -116, 26, -104);
    ctx.quadraticCurveTo(36, -80, 24, -40);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 2.2);
    ctx.fillStyle = 'rgba(5,4,8,0.24)';
    ctx.beginPath();
    ctx.moveTo(-26, -104);
    ctx.quadraticCurveTo(-10, -110, -6, -106);
    ctx.lineTo(-4, -42);
    ctx.lineTo(-24, -40);
    ctx.quadraticCurveTo(-36, -80, -26, -104);
    ctx.fill();
    // Placas peitorais.
    ctx.fillStyle = tintShade(dark);
    ctx.beginPath();
    ctx.moveTo(-24, -98);
    ctx.quadraticCurveTo(0, -112, 24, -98);
    ctx.lineTo(18, -70);
    ctx.lineTo(0, -64);
    ctx.lineTo(-18, -70);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.6);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-18, -92);
    ctx.quadraticCurveTo(0, -102, 18, -92);
    ctx.moveTo(0, -106);
    ctx.lineTo(0, -66);
    ctx.stroke();
    // Placas abdominais.
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i % 2 === 0 ? dark : tintShade(dark);
        roundRectPath(ctx, -16, -62 + i * 8, 32, 6, 2);
        ctx.fill();
        outlinePath(ctx, 1);
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(-11, -59 + i * 8, 1.2, 0, TAU);
        ctx.arc(11, -59 + i * 8, 1.2, 0, TAU);
        ctx.fill();
    }
    // Fornalha no peito.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const core = ctx.createRadialGradient(0, -78, 2, 0, -78, 18);
    core.addColorStop(0, '#fff4c9');
    core.addColorStop(0.35, accent);
    core.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = core;
    ctx.globalAlpha = 0.65 + Math.sin(time * 5) * 0.2;
    ctx.beginPath();
    ctx.arc(0, -78, 18, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = tintShade(dark);
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-10, -86 + i * 8);
        ctx.lineTo(10, -86 + i * 8);
        ctx.stroke();
    }
    // Ombros enormes com espinhos.
    for (const side of [-1, 1]) {
        ctx.fillStyle = tintShade(dark);
        ctx.beginPath();
        ctx.ellipse(side * 30, -98, 17, 13, side * 0.3, 0, TAU);
        ctx.fill();
        outlinePath(ctx, 1.6);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(side * 30, -98, 13, Math.PI * 0.9, Math.PI * 2.1);
        ctx.stroke();
        spike(ctx, side * 39, -104, 7, 15, dark, side * 0.5);
        spike(ctx, side * 30, -110, 6, 13, tintShade(col), side * 0.15);
    }
    // Cabeça pequena com elmo e chifres.
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(0, -116, 12, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 1.6);
    ctx.fillStyle = tintShade(col);
    ctx.beginPath();
    ctx.moveTo(-9, -120);
    ctx.lineTo(9, -120);
    ctx.lineTo(7, -108);
    ctx.lineTo(-7, -108);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -115);
    ctx.lineTo(7, -115);
    ctx.stroke();
    ctx.strokeStyle = tintShade(col);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-8, -124);
    ctx.quadraticCurveTo(-18, -136, -11, -144);
    ctx.moveTo(8, -124);
    ctx.quadraticCurveTo(18, -136, 11, -144);
    ctx.stroke();
    // Braço com cutelo serrilhado.
    const armAng = e.state === 'attack' ? 1.2 : e.state === 'windup' ? -1.2 : 0.2;
    const shoulder = { x: 22, y: -96 };
    const elbow = joint(shoulder.x, shoulder.y, 22, armAng);
    const hand = joint(elbow.x, elbow.y, 22, armAng + 0.2);
    armoredLimb(ctx, shoulder.x, shoulder.y, elbow.x, elbow.y, 12, col, {
        band: true,
        accent,
    });
    armoredLimb(ctx, elbow.x, elbow.y, hand.x, hand.y, 10, tintShade(col), {
        band: true,
        accent,
    });
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, 7, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 1.2);
    ctx.save();
    ctx.translate(hand.x, hand.y);
    ctx.rotate(armAng * 0.8);
    ctx.fillStyle = tintShade(col);
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(34, -16);
    ctx.lineTo(43, -4);
    ctx.lineTo(40, 4);
    ctx.lineTo(44, 10);
    ctx.lineTo(34, 12);
    ctx.lineTo(0, 9);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.5);
    // Bisel escuro e fio luminoso.
    ctx.fillStyle = 'rgba(5,4,8,0.35)';
    ctx.beginPath();
    ctx.moveTo(2, 2);
    ctx.lineTo(35, -7);
    ctx.lineTo(37, 7);
    ctx.lineTo(2, 7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(6, -8);
    ctx.lineTo(34, -13);
    ctx.lineTo(41, -3);
    ctx.stroke();
    // Serrilhado.
    ctx.fillStyle = accent;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(36 + i * 2, 3 + i * 2);
        ctx.lineTo(40 + i * 2, 8 + i * 2);
        ctx.lineTo(42 + i * 2, 4 + i * 2);
        ctx.fill();
    }
    glow(ctx, 32, -4, 18, accent, 0.26);
    ctx.restore();
    // Correntes e ganchos.
    ctx.strokeStyle = 'rgba(190, 170, 140, 0.55)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(-24 + i * 4, -64 + i * 4);
        ctx.quadraticCurveTo(-38 - i * 4, -42 + i * 8, -26 - i * 4, -18 + i * 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-26 - i * 4, -16 + i * 6, 3, 0, TAU);
        ctx.stroke();
    }
    void e;
}
function drawShade(ctx, e, time, col, accent, dark) {
    const wave = Math.sin(time * 2.5 + e.animPhase);
    ctx.translate(0, wave * 2);
    // Chamas espectrais atrás do corpo.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
        const a = time * 1.4 + i * 2.1;
        const fx = Math.cos(a) * (22 + i * 4);
        const fy = -56 + Math.sin(a * 1.3) * 16;
        glow(ctx, fx, fy, 9 + i * 2, accent, 0.18);
    }
    ctx.restore();
    // Manto externo rasgado.
    ctx.fillStyle = hexToRgba(dark, 0.55);
    ctx.beginPath();
    ctx.moveTo(-18, -70);
    ctx.quadraticCurveTo(-30, -30, -22, 2);
    ctx.lineTo(-16, -8);
    ctx.lineTo(-10, 6);
    ctx.lineTo(-4, -10);
    ctx.lineTo(2, 8);
    ctx.lineTo(8, -8);
    ctx.lineTo(14, 4);
    ctx.lineTo(22, 2);
    ctx.quadraticCurveTo(30, -30, 18, -70);
    ctx.quadraticCurveTo(0, -84, -18, -70);
    ctx.fill();
    outlinePath(ctx, 1);
    // Corpo etéreo com cauda esfumada.
    const g = ctx.createLinearGradient(0, -96, 0, 4);
    g.addColorStop(0, hexToRgba(col, 0.95));
    g.addColorStop(0.55, hexToRgba(col, 0.6));
    g.addColorStop(1, hexToRgba(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-16, -70);
    ctx.quadraticCurveTo(-28, -20, -8, 8);
    ctx.quadraticCurveTo(0, 0, 8, 8);
    ctx.quadraticCurveTo(28, -20, 16, -70);
    ctx.quadraticCurveTo(0, -84, -16, -70);
    ctx.fill();
    // Manto interno escuro.
    ctx.fillStyle = hexToRgba(dark, 0.65);
    ctx.beginPath();
    ctx.moveTo(-10, -68);
    ctx.quadraticCurveTo(-16, -30, -4, 2);
    ctx.quadraticCurveTo(0, -4, 4, 2);
    ctx.quadraticCurveTo(16, -30, 10, -68);
    ctx.closePath();
    ctx.fill();
    // Tiras rasgadas.
    ctx.fillStyle = hexToRgba(accent, 0.28);
    for (let i = 0; i < 4; i++) {
        const x = -18 + i * 12;
        ctx.beginPath();
        ctx.moveTo(x, -16);
        ctx.lineTo(x - 3, 10 + (i % 2) * 8);
        ctx.lineTo(x + 3, 2);
        ctx.closePath();
        ctx.fill();
    }
    // Ombros / manto.
    ctx.fillStyle = hexToRgba(dark, 0.85);
    ctx.beginPath();
    ctx.moveTo(-20, -68);
    ctx.quadraticCurveTo(0, -78, 20, -68);
    ctx.quadraticCurveTo(12, -58, 0, -56);
    ctx.quadraticCurveTo(-12, -58, -20, -68);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(accent, 0.45);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // Cabeça / máscara rachada.
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.ellipse(0, -82, 12, 14, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, -82, 12, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(accent, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-6, -94);
    ctx.lineTo(-2, -86);
    ctx.lineTo(-5, -78);
    ctx.moveTo(6, -92);
    ctx.lineTo(3, -84);
    ctx.lineTo(7, -76);
    ctx.stroke();
    // Olhos verticais.
    enemyEye(ctx, -4, -84, 2.2, accent, { glow: false, vertical: true });
    enemyEye(ctx, 5, -84, 2.2, accent, { glow: false, vertical: true });
    // Braços espectrais com garras.
    for (const side of [-1, 1]) {
        const sway = wave * side * 3;
        ctx.strokeStyle = hexToRgba(accent, 0.7);
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(side * 14, -64);
        ctx.quadraticCurveTo(side * 28, -54 + sway, side * 24, -38 + sway);
        ctx.stroke();
        ctx.strokeStyle = hexToRgba(accent, 0.45);
        ctx.lineWidth = 2;
        ctx.stroke();
        claw(ctx, side * 24, -38 + sway, side * 7, side > 0 ? 0.4 : Math.PI - 0.4, accent);
        claw(ctx, side * 22, -34 + sway, side * 6, side > 0 ? 1.0 : Math.PI - 1.0, accent);
    }
    // Correntes flutuantes.
    ctx.strokeStyle = hexToRgba(accent, 0.5);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-18 + i * 18, -70);
        ctx.quadraticCurveTo(-24 + i * 22, -40, -10 + i * 12, -8 + i * 2);
        ctx.stroke();
        for (let j = 0; j < 3; j++) {
            ctx.beginPath();
            ctx.arc(-18 + i * 18 + j * 2, -52 + j * 14, 2, 0, TAU);
            ctx.stroke();
        }
    }
    // Runas ao redor.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 3; i++) {
        const a = time * 0.8 + (i * TAU) / 3;
        runeMark(ctx, Math.cos(a) * 26, -58 + Math.sin(a) * 18, 2.6, accent, a);
    }
    ctx.restore();
    glow(ctx, 0, -60, 42, accent, 0.14 + Math.sin(time * 3) * 0.03);
}
function drawConstruct(ctx, e, time, col, accent, dark) {
    const float = Math.sin(time * 1.8 + e.animPhase) * 2;
    ctx.translate(0, float);
    // Círculo rúnico no chão.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 2, 30, 8, 0, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
        const a = time * 0.5 + (i * TAU) / 4;
        runeMark(ctx, Math.cos(a) * 30, 2 + Math.sin(a) * 8, 2.4, accent, a);
    }
    ctx.restore();
    // Pernas geométricas articuladas.
    for (const side of [-1, 1]) {
        const hip = { x: side * 12, y: -34 };
        const knee = { x: side * 20, y: -17 };
        const foot = { x: side * 21, y: 0 };
        armoredLimb(ctx, hip.x, hip.y, knee.x, knee.y, 6, dark, { band: true, accent });
        armoredLimb(ctx, knee.x, knee.y, foot.x, foot.y, 5, tintShade(col), { dark });
        ctx.fillStyle = dark;
        roundRectPath(ctx, side * 21 - 7, -4, 15, 5, 2);
        ctx.fill();
        outlinePath(ctx, 1);
    }
    // Corpo de vitral.
    const g = ctx.createLinearGradient(-24, -100, 24, -30);
    g.addColorStop(0, tintShade(col));
    g.addColorStop(0.4, col);
    g.addColorStop(1, dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -104);
    ctx.lineTo(22, -76);
    ctx.lineTo(14, -36);
    ctx.lineTo(-14, -36);
    ctx.lineTo(-22, -76);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.6);
    // Estrutura de chumbo / painéis de vidro.
    ctx.strokeStyle = tintShade(dark);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -100);
    ctx.lineTo(0, -38);
    ctx.moveTo(-20, -74);
    ctx.lineTo(18, -50);
    ctx.moveTo(20, -74);
    ctx.lineTo(-18, -50);
    ctx.stroke();
    ctx.fillStyle = hexToRgba(accent, 0.35);
    ctx.beginPath();
    ctx.moveTo(-18, -74);
    ctx.lineTo(-2, -78);
    ctx.lineTo(-2, -52);
    ctx.lineTo(-14, -44);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hexToRgba(mixColor(col, '#ffffff', 0.3), 0.32);
    ctx.beginPath();
    ctx.moveTo(18, -74);
    ctx.lineTo(2, -78);
    ctx.lineTo(2, -52);
    ctx.lineTo(14, -44);
    ctx.closePath();
    ctx.fill();
    // Rachaduras luminosas.
    ctx.strokeStyle = hexToRgba(accent, 0.85);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -98);
    ctx.lineTo(-6, -78);
    ctx.lineTo(4, -64);
    ctx.lineTo(-2, -44);
    ctx.moveTo(-14, -72);
    ctx.lineTo(-6, -66);
    ctx.lineTo(-12, -54);
    ctx.stroke();
    // Núcleo com anéis.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const cg = ctx.createRadialGradient(0, -64, 0, 0, -64, 20);
    cg.addColorStop(0, '#ffffff');
    cg.addColorStop(0.35, accent);
    cg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, -64, 20, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -64, 11, time * 1.4, time * 1.4 + Math.PI * 1.4);
    ctx.stroke();
    ctx.restore();
    // Cabeça angular com coroa.
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(0, -118);
    ctx.lineTo(12, -104);
    ctx.lineTo(0, -96);
    ctx.lineTo(-12, -104);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.4);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(0, -106, 2.5, 0, TAU);
    ctx.fill();
    for (let i = 0; i < 3; i++) {
        spike(ctx, -8 + i * 8, -116, 4, 8 + (i === 1 ? 4 : 0), tintShade(col), (i - 1) * 0.2);
    }
    // Halo quebrado.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = hexToRgba(accent, 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -104, 22, Math.PI * 1.1, Math.PI * 1.75);
    ctx.stroke();
    ctx.restore();
    // Braço-canhão.
    const shoulder = { x: 16, y: -84 };
    const elbow = { x: 34, y: -72 };
    const cannon = { x: 46, y: -66 };
    armoredLimb(ctx, shoulder.x, shoulder.y, elbow.x, elbow.y, 6, col, { band: true, accent });
    armoredLimb(ctx, elbow.x, elbow.y, cannon.x, cannon.y, 5, tintShade(col), {
        band: true,
        accent,
    });
    ctx.fillStyle = dark;
    roundRectPath(ctx, 38, -78, 28, 18, 4);
    ctx.fill();
    outlinePath(ctx, 1.4);
    ctx.fillStyle = tintShade(col);
    roundRectPath(ctx, 42, -75, 18, 11, 3);
    ctx.fill();
    outlinePath(ctx, 1);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(65, -69, 4.6, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(65, -69, 7, 0, TAU);
    ctx.stroke();
    glow(ctx, 65, -69, 18, accent, 0.38);
    // Fragmentos flutuantes.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
        const a = time * 0.8 + (i * TAU) / 6;
        const px = Math.cos(a) * (30 + (i % 2) * 6);
        const py = -66 + Math.sin(a) * 18;
        ctx.fillStyle = hexToRgba(accent, 0.5);
        ctx.beginPath();
        ctx.moveTo(px, py - 6);
        ctx.lineTo(px + 5, py);
        ctx.lineTo(px, py + 6);
        ctx.lineTo(px - 5, py);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
    glow(ctx, 0, -64, 38, accent, 0.12);
}
function drawSeraph(ctx, e, time, col, accent, dark) {
    const flap = Math.sin(time * 3 + e.animPhase) * 0.12;
    // Asas em camadas.
    for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side * 8, -72);
        ctx.rotate(side * (0.4 + flap));
        for (let i = 0; i < 4; i++) {
            const len = 40 - i * 8;
            ctx.fillStyle = hexToRgba(i === 0 ? mixColor(col, '#ffffff', 0.35) : accent, 0.2 - i * 0.03);
            ctx.beginPath();
            ctx.ellipse(side * (13 + i * 8), -8 + i * 9, len, 9 - i * 1.4, side * 0.3, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = hexToRgba(accent, 0.4);
            ctx.lineWidth = 1;
            ctx.stroke();
            // Ponta escura.
            ctx.fillStyle = hexToRgba(dark, 0.35);
            ctx.beginPath();
            ctx.ellipse(side * (13 + i * 8) + side * len * 0.45, -8 + i * 9, len * 0.35, 4, side * 0.3, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }
    // Penas flutuantes.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
        const a = time * 0.8 + i * 1.7;
        const px = Math.cos(a) * (26 + i * 5);
        const py = -54 + Math.sin(a * 1.3) * 22;
        ctx.fillStyle = hexToRgba(accent, 0.35);
        ctx.beginPath();
        ctx.ellipse(px, py, 5, 1.8, a, 0, TAU);
        ctx.fill();
    }
    ctx.restore();
    // Corpo blindado.
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-10, -40);
    ctx.quadraticCurveTo(-14, -70, -8, -82);
    ctx.lineTo(8, -82);
    ctx.quadraticCurveTo(14, -70, 10, -40);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.4);
    // Peitoral e cinto.
    ctx.fillStyle = tintShade(dark);
    ctx.beginPath();
    ctx.moveTo(-9, -76);
    ctx.quadraticCurveTo(0, -82, 9, -76);
    ctx.lineTo(7, -56);
    ctx.lineTo(0, -52);
    ctx.lineTo(-7, -56);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, -78);
    ctx.lineTo(0, -54);
    ctx.moveTo(-6, -64);
    ctx.lineTo(6, -64);
    ctx.stroke();
    // Ombros / pauldrons.
    for (const side of [-1, 1]) {
        ctx.fillStyle = tintShade(dark);
        ctx.beginPath();
        ctx.ellipse(side * 12, -76, 8, 6, side * 0.3, 0, TAU);
        ctx.fill();
        outlinePath(ctx, 1);
        spike(ctx, side * 16, -80, 4, 9, tintShade(col), side * 0.4);
    }
    // Saia rasgada em camadas.
    ctx.fillStyle = tintShade(dark);
    ctx.beginPath();
    ctx.moveTo(-10, -44);
    ctx.lineTo(-20, -4);
    ctx.lineTo(-8, -18);
    ctx.lineTo(0, 2);
    ctx.lineTo(8, -18);
    ctx.lineTo(20, -4);
    ctx.lineTo(10, -44);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.2);
    ctx.strokeStyle = hexToRgba(accent, 0.45);
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-8 + i * 8, -40);
        ctx.lineTo(-12 + i * 8, -10);
        ctx.stroke();
    }
    // Cabeça com máscara.
    ctx.fillStyle = '#efe6cf';
    ctx.beginPath();
    ctx.ellipse(0, -90, 9, 10, 0, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 1.2);
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(-8, -92);
    ctx.lineTo(8, -92);
    ctx.lineTo(5, -84);
    ctx.lineTo(-5, -84);
    ctx.closePath();
    ctx.fill();
    enemyEye(ctx, -3, -90, 1.8, accent, { glow: false });
    enemyEye(ctx, 4, -90, 1.8, accent, { glow: false });
    ctx.strokeStyle = hexToRgba(accent, 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-7, -96);
    ctx.lineTo(-3, -102);
    ctx.lineTo(3, -98);
    ctx.lineTo(7, -104);
    ctx.stroke();
    // Aurora quebrada.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = hexToRgba(accent, 0.85);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -104, 14, 0.4, Math.PI * 1.4);
    ctx.stroke();
    ctx.restore();
    // Lança ornamentada.
    ctx.strokeStyle = '#d8c8a0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, -100);
    ctx.lineTo(24, -10);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(17, -96);
    ctx.lineTo(25, -12);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(16, -104);
    ctx.lineTo(21, -116);
    ctx.lineTo(24, -102);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 0.9);
    ctx.strokeStyle = hexToRgba(accent, 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(13, -100);
    ctx.lineTo(27, -100);
    ctx.stroke();
    glow(ctx, 20, -108, 14, accent, 0.3);
    // Manchas de corrupção.
    ctx.fillStyle = 'rgba(40, 10, 30, 0.55)';
    ctx.beginPath();
    ctx.ellipse(-4, -66, 5, 9, 0.3, 0, TAU);
    ctx.ellipse(4, -48, 4, 7, -0.3, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(70, 20, 50, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4, -74);
    ctx.lineTo(-1, -64);
    ctx.lineTo(-6, -56);
    ctx.stroke();
    glow(ctx, 0, -60, 48, accent, 0.12);
}
function drawEcho(ctx, e, time, col, accent, dark, walk) {
    // Três cópias deslocadas para o efeito de glitch.
    for (let i = 2; i >= 0; i--) {
        ctx.save();
        ctx.globalAlpha = i === 0 ? 1 : 0.2;
        ctx.translate(i * 4 + (i > 0 ? Math.sin(time * 24 + i) * 1.5 : 0), -i * 2);
        const bodyCol = i === 0 ? col : accent;
        const armor = i === 0 ? dark : accent;
        // Pernas blindadas.
        armoredLimb(ctx, -7, -32, -10, -12, 4.5, armor, { dark, band: true, accent });
        armoredLimb(ctx, -10, -12, -11, 0, 3.8, bodyCol, { dark });
        armoredLimb(ctx, 7, -32, 10, -12, 4.5, armor, { dark, band: true, accent });
        armoredLimb(ctx, 10, -12, 11, 0, 3.8, bodyCol, { dark });
        for (const side of [-1, 1]) {
            ctx.fillStyle = armor;
            roundRectPath(ctx, side * 11 - 5, -3, 11, 5, 2);
            ctx.fill();
            outlinePath(ctx, 0.9);
        }
        // Torso.
        ctx.fillStyle = bodyCol;
        ctx.beginPath();
        ctx.moveTo(-11, -74);
        ctx.quadraticCurveTo(-15, -54, -10, -34);
        ctx.lineTo(10, -34);
        ctx.quadraticCurveTo(15, -54, 11, -74);
        ctx.closePath();
        ctx.fill();
        outlinePath(ctx, 1.4);
        // Peitoral e placas.
        ctx.fillStyle = armor;
        ctx.beginPath();
        ctx.moveTo(-10, -72);
        ctx.lineTo(10, -72);
        ctx.lineTo(8, -54);
        ctx.lineTo(0, -50);
        ctx.lineTo(-8, -54);
        ctx.closePath();
        ctx.fill();
        outlinePath(ctx, 1);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -70);
        ctx.lineTo(0, -52);
        ctx.moveTo(-7, -60);
        ctx.lineTo(7, -60);
        ctx.stroke();
        // Ombros.
        for (const side of [-1, 1]) {
            ctx.fillStyle = armor;
            ctx.beginPath();
            ctx.ellipse(side * 12, -68, 7, 5, side * 0.4, 0, TAU);
            ctx.fill();
            outlinePath(ctx, 1);
            spike(ctx, side * 16, -71, 4, 8, accent, side * 0.4);
        }
        // Cabeça / visor.
        ctx.fillStyle = armor;
        ctx.beginPath();
        ctx.ellipse(0, -86, 10, 12, 0, 0, TAU);
        ctx.fill();
        outlinePath(ctx, 1.2);
        ctx.fillStyle = '#08050c';
        ctx.beginPath();
        ctx.moveTo(-8, -88);
        ctx.lineTo(8, -88);
        ctx.lineTo(6, -81);
        ctx.lineTo(-6, -81);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(-3, -86, 1.8, 0, TAU);
        ctx.arc(4, -86, 1.8, 0, TAU);
        ctx.fill();
        // Braços com lâminas de eco.
        for (const side of [-1, 1]) {
            const shoulder = { x: side * 10, y: -68 };
            const elbow = { x: side * 19, y: -50 + walk * side * 2 };
            const hand = { x: side * 24, y: -36 - walk * side * 2 };
            armoredLimb(ctx, shoulder.x, shoulder.y, elbow.x, elbow.y, 4.5, bodyCol, {
                dark,
                band: true,
                accent,
            });
            armoredLimb(ctx, elbow.x, elbow.y, hand.x, hand.y, 3.6, armor, { dark });
            ctx.strokeStyle = accent;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(hand.x, hand.y);
            ctx.lineTo(hand.x + side * 9, hand.y + 18);
            ctx.stroke();
            ctx.strokeStyle = hexToRgba(accent, 0.5);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(hand.x + side * 3, hand.y + 4);
            ctx.lineTo(hand.x + side * 10, hand.y + 20);
            ctx.stroke();
        }
        // Falhas de glitch no corpo.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35;
        for (let g = 0; g < 3; g++) {
            const gy = -80 + ((time * 40 + g * 18 + i * 7) % 48);
            ctx.fillStyle = accent;
            ctx.fillRect(-14 + (g % 2) * 3, gy, 28, 1);
        }
        ctx.restore();
        ctx.restore();
    }
    // Faixas de scanline.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 6; i++) {
        const y = -92 + ((time * 60 + i * 22) % 92);
        ctx.fillStyle = accent;
        ctx.fillRect(-20, y, 40, 1);
    }
    ctx.restore();
    // Fragmentos de espelho.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
        const a = time * 0.9 + (i * TAU) / 5;
        const px = Math.cos(a) * (28 + (i % 2) * 6);
        const py = -54 + Math.sin(a) * 22;
        ctx.fillStyle = hexToRgba(accent, 0.4);
        ctx.beginPath();
        ctx.moveTo(px, py - 5);
        ctx.lineTo(px + 4, py);
        ctx.lineTo(px, py + 5);
        ctx.lineTo(px - 4, py);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
    glow(ctx, 0, -50, 46, accent, 0.16 + Math.sin(time * 3) * 0.03);
}
function tintShade(color) {
    return mixColor(color, '#0b0810', 0.35);
}
// ------------------------------------------------------------------ chefes
export function drawBoss(ctx, b, time) {
    const def = b.def;
    const flash = b.hitFlash;
    const c = def.colors;
    const col = tint(c.primary, flash);
    const dark = tint(c.dark, flash);
    const accent = tint(c.accent, flash);
    const scale = def.scale;
    const bob = def.flying ? Math.sin(time * 1.6 + b.animPhase) * 8 : 0;
    const floor = def.flying ? getFloorFromBoss(b) : b.y + 2;
    shadow(ctx, b.x, floor, b.w * 0.42);
    drawBossGroundPresence(ctx, b, time, floor, accent);
    ctx.save();
    ctx.translate(b.x, b.y + bob);
    ctx.scale(b.facing * scale, scale);
    ctx.globalAlpha = b.dead ? clamp(1 - b.deathTimer / 2.2, 0, 1) : 1;
    // Aura de chefe.
    glow(ctx, 0, -b.h * 0.5, b.w * 0.9, accent, b.state === 'phase' ? 0.3 : 0.14);
    if (b.phaseIndex > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const rage = 0.1 + Math.sin(time * 6.2) * 0.04;
        const rg = ctx.createRadialGradient(0, -b.h * 0.52, b.w * 0.2, 0, -b.h * 0.52, b.w * 1.05);
        rg.addColorStop(0, hexToRgba('#ff3b2f', rage));
        rg.addColorStop(0.65, hexToRgba(accent, rage * 0.5));
        rg.addColorStop(1, hexToRgba(accent, 0));
        ctx.fillStyle = rg;
        ctx.fillRect(-b.w * 1.1, -b.h * 1.35, b.w * 2.2, b.h * 1.5);
        ctx.restore();
    }
    if (b.state === 'windup') {
        const p = clamp(b.stateT / Math.max(0.01, b.attackWindup), 0, 1);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.3 + p * 0.45;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -b.h * 0.45, b.w * (0.65 + (1 - p) * 0.7), 0, TAU);
        ctx.stroke();
        // Marca de perigo no chão.
        ctx.globalAlpha = 0.14 + p * 0.3;
        ctx.strokeStyle = '#ff3b2f';
        ctx.lineWidth = 2;
        ctx.setLineDash([12, 10]);
        ctx.lineDashOffset = -time * 40;
        ctx.beginPath();
        ctx.ellipse(0, 0, b.w * (0.75 + p * 0.25), b.w * 0.18, 0, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }
    switch (def.id) {
        case 'colossus':
            drawColossus(ctx, b, time, col, dark, accent, c.eye);
            break;
        case 'vekthar':
            drawVekthar(ctx, b, time, col, dark, accent);
            break;
        case 'xalmor':
            drawXalmor(ctx, b, time, col, dark, accent);
            break;
        case 'acheron':
            drawAcheron(ctx, b, time, col, dark, accent);
            break;
        case 'malakhim':
            drawMalakhim(ctx, b, time, col, dark, accent);
            break;
        case 'ferrato':
            drawFerrato(ctx, b, time, col, dark, accent);
            break;
    }
    if (b.state === 'phase') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const r = 120 + i * 60 + (b.stateT % 1) * 80;
            ctx.beginPath();
            ctx.arc(0, -b.h * 0.5, r, 0, TAU);
            ctx.stroke();
        }
        // Estilhaços da transição.
        for (let i = 0; i < 14; i++) {
            const a = (i / 14) * TAU + b.stateT * 0.6;
            const r = 40 + ((b.stateT * 260 + i * 17) % 210);
            ctx.fillStyle = hexToRgba(i % 2 === 0 ? accent : '#ffffff', 0.5);
            ctx.fillRect(Math.cos(a) * r, -b.h * 0.5 + Math.sin(a) * r, 2.4, 2.4);
        }
        ctx.restore();
    }
    if (b.dead) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 16; i++) {
            const a = i * 2.37 + b.deathTimer * 0.8;
            const r = 20 + ((b.deathTimer * 90 + i * 19) % 240);
            const px = Math.cos(a) * r;
            const py = -b.h * 0.45 + Math.sin(a) * r * 0.7 - b.deathTimer * 22;
            const alpha = clamp(1 - b.deathTimer / 2.2, 0, 1) * (0.35 + (i % 3) * 0.18);
            ctx.fillStyle = hexToRgba(i % 2 === 0 ? accent : '#ffe6a3', alpha);
            ctx.beginPath();
            ctx.arc(px, py, 1.5 + (i % 3), 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }
    ctx.restore();
}
/** Presença do chefe no chão: runas, poeira e distorção gravitacional. */
function drawBossGroundPresence(ctx, b, time, floor, accent) {
    const def = b.def;
    const phase = b.phaseIndex;
    const color = phase > 0 ? mixColor(accent, '#ff3b2f', 0.35) : accent;
    const w = def.w * (def.flying ? 0.7 : 0.58);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(b.x, floor, 4, b.x, floor, w * 1.8);
    g.addColorStop(0, hexToRgba(color, 0.16 + phase * 0.05));
    g.addColorStop(0.5, hexToRgba(color, 0.05));
    g.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(b.x, floor, w * 1.8, w * 0.44, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(color, 0.24);
    ctx.lineWidth = 1.6;
    ctx.setLineDash([10, 14]);
    ctx.lineDashOffset = -time * 26;
    ctx.beginPath();
    ctx.ellipse(b.x, floor, w * 1.35, w * 0.3, 0, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + time * 0.12;
        const r1 = w * 0.55;
        const r2 = w * (0.95 + Math.sin(time * 2 + i) * 0.08);
        ctx.strokeStyle = hexToRgba(color, 0.1 + (i % 2) * 0.05);
        ctx.beginPath();
        ctx.moveTo(b.x + Math.cos(a) * r1, floor + Math.sin(a) * r1 * 0.22);
        ctx.lineTo(b.x + Math.cos(a) * r2, floor + Math.sin(a) * r2 * 0.22);
        ctx.stroke();
    }
    if (!def.flying) {
        for (let i = 0; i < 6; i++) {
            const a = time * (0.4 + i * 0.08) + i;
            const r = w * (0.5 + (i % 3) * 0.18);
            const px = b.x + Math.cos(a) * r;
            const py = floor - 4 - Math.abs(Math.sin(a)) * 22 - (i % 2) * 8;
            ctx.fillStyle = hexToRgba('#8a8070', 0.35);
            ctx.fillRect(px, py, 3 + (i % 2) * 2, 2 + (i % 3));
        }
    }
    ctx.restore();
}
function getFloorFromBoss(b) {
    return getStage(b.def.arc * CHAPTERS_PER_ARC).floor;
}
function colossusCrack(ctx, points, color, width, glowColor) {
    if (points.length < 2)
        return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = hexToRgba(glowColor, 0.22);
    ctx.lineWidth = width + 4;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = Math.max(0.7, width * 0.28);
    ctx.stroke();
    ctx.restore();
}
function colossusEye(ctx, x, y, r, color, time, seed, opts = {}) {
    const blink = Math.sin(time * 1.1 + seed * 2.7) > 0.965 ? 0.12 : 1;
    ctx.save();
    ctx.translate(x, y);
    // Órbita e veias.
    ctx.fillStyle = '#0a0508';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.55, r * 1.15 * blink, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,20,24,0.55)';
    ctx.lineWidth = Math.max(0.6, r * 0.12);
    for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + seed;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.5 * blink);
        ctx.lineTo(Math.cos(a) * r * 1.45, Math.sin(a) * r * 0.95 * blink);
        ctx.stroke();
    }
    // Brilho.
    if (opts.glow !== 0) {
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 2.6);
        g.addColorStop(0, hexToRgba(color, 0.45 * (opts.glow ?? 1)));
        g.addColorStop(1, hexToRgba(color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.6, 0, TAU);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }
    // Íris.
    const iris = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 1.1);
    iris.addColorStop(0, '#ffffff');
    iris.addColorStop(0.28, color);
    iris.addColorStop(0.75, mixColor(color, '#0a0508', 0.45));
    iris.addColorStop(1, '#12080a');
    ctx.fillStyle = iris;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.08, r * 0.78 * blink, 0, 0, TAU);
    ctx.fill();
    // Pupila vertical.
    const look = Math.sin(time * 0.8 + seed * 3.1) * r * 0.18;
    ctx.fillStyle = '#07040a';
    ctx.beginPath();
    ctx.ellipse(look, 0, r * (opts.vertical === false ? 0.3 : 0.18), r * 0.62 * blink, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(-r * 0.34, -r * 0.28, Math.max(0.7, r * 0.18), 0, TAU);
    ctx.fill();
    // Pálpebra e sobrancelha.
    ctx.strokeStyle = 'rgba(20,8,10,0.85)';
    ctx.lineWidth = Math.max(1, r * 0.22);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.5, r * 1.08 * blink, 0, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    if (opts.angry) {
        ctx.strokeStyle = '#1a0a0c';
        ctx.lineWidth = Math.max(1.2, r * 0.3);
        ctx.beginPath();
        ctx.moveTo(-r * 1.4, -r * 0.9);
        ctx.lineTo(r * 1.1, -r * 0.25);
        ctx.stroke();
    }
    ctx.restore();
}
function drawColossus(ctx, b, time, col, dark, accent, eye) {
    const rage = b.phaseIndex > 0;
    const windup = b.state === 'windup' ? clamp(b.stateT / Math.max(0.01, b.attackWindup), 0, 1) : 0;
    const execute = b.state === 'execute' ? clamp(b.stateT / Math.max(0.01, b.attackDuration), 0, 1) : 0;
    const recover = b.state === 'recover' ? clamp(1 - b.stateT / Math.max(0.01, b.attackRecover), 0, 1) : 0;
    const breathe = Math.sin(time * 1.35) * 3;
    const hunch = windup * 9 - execute * 7;
    const mouthOpen = clamp(0.32 + windup * 0.5 + execute * 0.34 + (rage ? 0.14 : 0), 0, 1);
    const attackId = b.attackId;
    const slam = attackId === 'slam' || attackId === 'rageSlam' || attackId === 'finalJudgment';
    const charge = attackId === 'charge';
    const debris = attackId === 'debris';
    const summon = attackId === 'summon';
    const fleshLight = mixColor(col, '#ffc0a0', 0.28);
    const fleshDark = mixColor(col, '#1a0808', 0.5);
    const concrete = mixColor(dark, '#8c867a', 0.42);
    const bone = '#d8c6a2';
    const hot = rage ? '#ff5a1c' : accent;
    const eyeColor = rage ? '#ff6a3c' : eye;
    // Base de asfalto rachado e magma.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const base = ctx.createRadialGradient(0, 0, 3, 0, 0, 128);
    base.addColorStop(0, hexToRgba(hot, rage ? 0.3 : 0.18));
    base.addColorStop(0.55, hexToRgba(hot, 0.08));
    base.addColorStop(1, hexToRgba(hot, 0));
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.ellipse(0, 0, 128, 30, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = hexToRgba(hot, 0.28);
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU + 0.2;
        const r1 = 26 + (i % 3) * 12;
        const r2 = 74 + (i % 4) * 14;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1 * 0.22);
        ctx.lineTo(Math.cos(a + 0.08) * r2, Math.sin(a + 0.08) * r2 * 0.22);
        ctx.stroke();
    }
    ctx.restore();
    // Pernas curtas, grossas e desiguais.
    const step = charge && b.state === 'execute' ? Math.sin(time * 24) * 5 : 0;
    const legGrad = ctx.createLinearGradient(-60, -80, 60, 0);
    legGrad.addColorStop(0, fleshDark);
    legGrad.addColorStop(0.45, col);
    legGrad.addColorStop(1, dark);
    ctx.fillStyle = legGrad;
    ctx.beginPath();
    ctx.moveTo(-72, -2);
    ctx.lineTo(-64 + step, -58);
    ctx.quadraticCurveTo(-58, -82, -36, -80);
    ctx.lineTo(-18, -66);
    ctx.lineTo(-12, -4);
    ctx.quadraticCurveTo(-40, 2, -72, -2);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 2, 'rgba(5,4,8,0.85)');
    ctx.beginPath();
    ctx.moveTo(10, -2);
    ctx.lineTo(16 - step, -62);
    ctx.quadraticCurveTo(22, -86, 44, -82);
    ctx.lineTo(62, -64);
    ctx.lineTo(70, -4);
    ctx.quadraticCurveTo(40, 2, 10, -2);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 2, 'rgba(5,4,8,0.85)');
    ctx.fillStyle = concrete;
    roundRectPath(ctx, -78, -14, 58, 16, 5);
    ctx.fill();
    outlinePath(ctx, 1.6);
    roundRectPath(ctx, 18, -14, 58, 16, 5);
    ctx.fill();
    outlinePath(ctx, 1.6);
    colossusCrack(ctx, [[-58, -16], [-52, -38], [-60, -52], [-46, -66]], hexToRgba(hot, 0.85), 1.6, hot);
    colossusCrack(ctx, [[34, -18], [28, -40], [38, -56], [24, -70]], hexToRgba(hot, 0.75), 1.4, hot);
    ctx.fillStyle = dark;
    for (const [x, y, w] of [[-88, -6, 14], [86, -8, 12], [6, -2, 10]]) {
        roundRectPath(ctx, x, y - 5, w, 6, 2);
        ctx.fill();
    }
    ctx.save();
    ctx.translate(0, -hunch + breathe * 0.3);
    // Corpo principal assimétrico.
    const body = ctx.createRadialGradient(-34, -158, 12, 8, -118, 158);
    body.addColorStop(0, fleshLight);
    body.addColorStop(0.34, col);
    body.addColorStop(0.72, fleshDark);
    body.addColorStop(1, dark);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-88, -66);
    ctx.bezierCurveTo(-114, -110, -112, -168, -72, -198);
    ctx.bezierCurveTo(-48, -218, -22, -232, 8, -226);
    ctx.bezierCurveTo(44, -244, 88, -220, 100, -180);
    ctx.bezierCurveTo(116, -146, 106, -104, 84, -78);
    ctx.bezierCurveTo(52, -56, -8, -48, -48, -58);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 2.4, 'rgba(4,3,6,0.85)');
    ctx.fillStyle = mixColor(col, '#3a1a14', 0.35);
    ctx.beginPath();
    ctx.ellipse(-70, -188, 38, 48, -0.35, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 1.6, 'rgba(4,3,6,0.6)');
    ctx.fillStyle = mixColor(col, '#2a0c0c', 0.42);
    ctx.beginPath();
    ctx.ellipse(12, -82, 62, 36, 0.06, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 1.4, 'rgba(4,3,6,0.55)');
    // Placa de concreto no ombro direito.
    ctx.fillStyle = concrete;
    ctx.beginPath();
    ctx.moveTo(28, -224);
    ctx.lineTo(86, -218);
    ctx.lineTo(102, -190);
    ctx.lineTo(72, -172);
    ctx.lineTo(34, -184);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.6, 'rgba(5,4,8,0.8)');
    colossusCrack(ctx, [[42, -214], [58, -202], [52, -190], [72, -184]], 'rgba(255,190,120,0.55)', 1.2, hot);
    // Costelas expostas.
    ctx.save();
    ctx.strokeStyle = bone;
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
        const y = -154 + i * 14;
        ctx.beginPath();
        ctx.arc(-44, y, 28 + i * 2, -0.2, 1.25);
        ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(80,30,24,0.7)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        const y = -154 + i * 14;
        ctx.beginPath();
        ctx.arc(-44, y, 28 + i * 2, -0.2, 1.25);
        ctx.stroke();
    }
    ctx.restore();
    // Carro absorvido no quadril.
    ctx.save();
    ctx.translate(-66, -92);
    ctx.rotate(-0.2);
    ctx.fillStyle = '#3b4048';
    roundRectPath(ctx, -30, -16, 60, 32, 7);
    ctx.fill();
    outlinePath(ctx, 1.4);
    ctx.fillStyle = '#172634';
    roundRectPath(ctx, -22, -12, 20, 12, 2);
    ctx.fill();
    roundRectPath(ctx, 2, -12, 18, 12, 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-18, 17, 7, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(18, 17, 7, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(hot, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-28, -8);
    ctx.lineTo(-6, 4);
    ctx.lineTo(10, -6);
    ctx.stroke();
    ctx.restore();
    // Placa de rua no ombro.
    ctx.save();
    ctx.translate(64, -214);
    ctx.rotate(0.16);
    ctx.strokeStyle = '#7e858c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -46);
    ctx.stroke();
    ctx.fillStyle = '#2f6b4f';
    roundRectPath(ctx, -22, -66, 44, 20, 3);
    ctx.fill();
    outlinePath(ctx, 1.2);
    ctx.strokeStyle = '#d8e6d8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-13, -56);
    ctx.lineTo(13, -56);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6, -60);
    ctx.lineTo(2, -52);
    ctx.stroke();
    ctx.restore();
    // Semáforo nas costas.
    ctx.save();
    ctx.translate(-92, -172);
    ctx.rotate(-0.12);
    ctx.fillStyle = '#1a1a1c';
    roundRectPath(ctx, -10, -30, 20, 56, 5);
    ctx.fill();
    outlinePath(ctx, 1.2);
    const lights = [
        [-18, '#ff3b2f', true],
        [-2, '#ffb02e', false],
        [14, '#4aff8a', false],
    ];
    for (const [ly, lc, on] of lights) {
        ctx.fillStyle = on ? lc : hexToRgba(lc, 0.18);
        ctx.beginPath();
        ctx.arc(0, ly, 5, 0, TAU);
        ctx.fill();
        if (on)
            glow(ctx, 0, ly, 18, lc, 0.35);
    }
    ctx.restore();
    // Rebar e espinhos nas costas.
    ctx.strokeStyle = '#6a5a50';
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 7; i++) {
        const x = -78 + i * 20;
        const y = -210 - (i % 3) * 8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 8 + (i % 2) * 14, y - 30 - (i % 3) * 8);
        ctx.stroke();
    }
    for (let i = 0; i < 5; i++) {
        const x = -60 + i * 26;
        spike(ctx, x, -214, 10, 26 + (i % 2) * 8, mixColor(concrete, '#2a1a14', 0.3), -0.2 + i * 0.1);
    }
    // Braços: direito gigante, esquerdo duplo e um vestigial.
    let armR = Math.sin(time * 1.2) * 0.12;
    let armL = -armR * 0.7;
    if (slam) {
        if (b.state === 'windup') {
            armR = -1.9 - windup * 0.25;
            armL = -1.55 - windup * 0.2;
        }
        else if (b.state === 'execute') {
            armR = 0.7 + execute * 0.5;
            armL = 0.55 + execute * 0.4;
        }
        else {
            armR = 0.2;
            armL = 0.15;
        }
    }
    else if (charge) {
        if (b.state === 'windup') {
            armR = 2.25;
            armL = 2.05;
        }
        else if (b.state === 'execute') {
            armR = 0.1;
            armL = -0.1;
        }
        else {
            armR = 0.3;
            armL = 0.2;
        }
    }
    else if (debris) {
        if (b.state === 'windup') {
            armR = 2.6;
            armL = -0.4;
        }
        else if (b.state === 'execute') {
            armR = -0.6;
            armL = 0.3;
        }
    }
    else if (summon) {
        armR = -0.9 + Math.sin(time * 3) * 0.1;
        armL = 0.9 - Math.sin(time * 3) * 0.1;
    }
    else if (b.state === 'recover') {
        armR = 0.25 + recover * 0.15;
        armL = 0.1 + recover * 0.1;
    }
    const armR2 = armR + 0.5;
    const armL2 = armL - 0.45;
    const shoulderR = { x: 66, y: -178 };
    const elbowR = joint(shoulderR.x, shoulderR.y, 62, armR);
    const handR = joint(elbowR.x, elbowR.y, 60, armR2);
    armoredLimb(ctx, shoulderR.x, shoulderR.y, elbowR.x, elbowR.y, 36, col, {
        dark,
        light: fleshLight,
        accent,
        band: true,
    });
    armoredLimb(ctx, elbowR.x, elbowR.y, handR.x, handR.y, 30, tintShade(col), {
        dark,
        light: fleshLight,
        accent,
    });
    ctx.fillStyle = fleshDark;
    ctx.beginPath();
    ctx.arc(handR.x, handR.y, 28, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 1.8);
    ctx.fillStyle = '#2a1c18';
    ctx.beginPath();
    ctx.arc(handR.x + 4, handR.y - 2, 18, 0, TAU);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
        const a = armR2 + 0.35 + i * 0.28;
        const len = 30 + (i % 2) * 10;
        claw(ctx, handR.x + Math.cos(a) * 12, handR.y + Math.sin(a) * 12, len, a, bone);
    }
    const shoulderL = { x: -64, y: -170 };
    const elbowL = joint(shoulderL.x, shoulderL.y, 56, armL);
    const handL = joint(elbowL.x, elbowL.y, 54, armL2);
    armoredLimb(ctx, shoulderL.x, shoulderL.y, elbowL.x, elbowL.y, 26, col, {
        dark,
        light: fleshLight,
        accent,
    });
    armoredLimb(ctx, elbowL.x, elbowL.y, handL.x, handL.y, 22, tintShade(col), { dark, accent });
    // Porta de carro presa ao antebraço esquerdo.
    ctx.save();
    ctx.translate((elbowL.x + handL.x) * 0.5, (elbowL.y + handL.y) * 0.5);
    ctx.rotate(armL2 + 0.2);
    ctx.fillStyle = '#414852';
    roundRectPath(ctx, -12, -24, 24, 48, 5);
    ctx.fill();
    outlinePath(ctx, 1.3);
    ctx.fillStyle = '#1a2a38';
    roundRectPath(ctx, -7, -18, 14, 16, 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(hot, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-9, 8);
    ctx.lineTo(9, -4);
    ctx.stroke();
    ctx.restore();
    // Segunda garra esquerda.
    const armL3 = armL + 1.15;
    const handL2 = joint(shoulderL.x + 6, shoulderL.y + 18, 66, armL3);
    armoredLimb(ctx, shoulderL.x + 6, shoulderL.y + 18, handL2.x, handL2.y, 12, fleshDark, { dark, accent });
    for (let i = 0; i < 3; i++) {
        const a = armL3 + 0.4 + i * 0.3;
        claw(ctx, handL2.x, handL2.y, 18, a, bone);
    }
    // Braço vestigial nas costas.
    ctx.save();
    ctx.strokeStyle = 'rgba(5,4,8,0.8)';
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-18, -222);
    ctx.quadraticCurveTo(-42, -240, -58, -226);
    ctx.quadraticCurveTo(-66, -214, -52, -204);
    ctx.stroke();
    ctx.strokeStyle = fleshDark;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-18, -222);
    ctx.quadraticCurveTo(-42, -240, -58, -226);
    ctx.quadraticCurveTo(-66, -214, -52, -204);
    ctx.stroke();
    ctx.restore();
    // Cintura de asfalto.
    ctx.fillStyle = concrete;
    roundRectPath(ctx, -66, -76, 132, 18, 6);
    ctx.fill();
    outlinePath(ctx, 1.4);
    ctx.fillStyle = '#2a2420';
    for (let i = 0; i < 5; i++) {
        roundRectPath(ctx, -54 + i * 26, -74, 14, 14, 3);
        ctx.fill();
    }
    // Fissuras de magma.
    const cracks = [
        [[-58, -202], [-42, -182], [-52, -164], [-34, -148]],
        [[36, -214], [24, -194], [34, -176], [16, -160]],
        [[-76, -144], [-58, -130], [-66, -112], [-46, -96]],
        [[74, -156], [58, -140], [66, -120], [48, -104]],
        [[-28, -92], [-14, -78], [-22, -66], [-6, -54]],
        [[18, -98], [30, -84], [22, -70], [38, -58]],
    ];
    if (rage) {
        cracks.push([[-48, -224], [-28, -204], [-40, -188], [-18, -170]], [[62, -200], [44, -184], [56, -166], [38, -150]], [[-10, -140], [6, -124], [-2, -108], [12, -92]]);
    }
    for (const crack of cracks) {
        colossusCrack(ctx, crack, hexToRgba(hot, rage ? 0.95 : 0.7), rage ? 2.4 : 1.8, hot);
    }
    // Boca vertical.
    const mouthX = 14;
    const mouthTop = -156;
    const mouthBottom = -72;
    const mouthW = 9 + mouthOpen * 15;
    ctx.save();
    const inner = ctx.createLinearGradient(mouthX, mouthTop, mouthX, mouthBottom);
    inner.addColorStop(0, '#120306');
    inner.addColorStop(0.45, hexToRgba(hot, 0.35));
    inner.addColorStop(0.7, '#2a0808');
    inner.addColorStop(1, '#080204');
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.moveTo(mouthX, mouthTop);
    ctx.quadraticCurveTo(mouthX + mouthW, mouthTop + 18, mouthX + mouthW * 0.8, mouthTop + 36);
    ctx.quadraticCurveTo(mouthX + mouthW * 1.15, mouthBottom - 18, mouthX, mouthBottom);
    ctx.quadraticCurveTo(mouthX - mouthW * 1.1, mouthBottom - 18, mouthX - mouthW * 0.75, mouthTop + 36);
    ctx.quadraticCurveTo(mouthX - mouthW, mouthTop + 18, mouthX, mouthTop);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 2, 'rgba(10,2,4,0.9)');
    ctx.fillStyle = '#e8d8b0';
    for (let i = 0; i < 7; i++) {
        const t = i / 6;
        const y = mouthTop + 10 + t * (mouthBottom - mouthTop - 20);
        const side = i % 2 === 0 ? -1 : 1;
        const bx = mouthX + side * mouthW * (0.55 + t * 0.18);
        const len = 8 + (1 - Math.abs(t - 0.5) * 2) * 8;
        ctx.beginPath();
        ctx.moveTo(bx - 4, y);
        ctx.lineTo(bx + side * len, y + 5);
        ctx.lineTo(bx + 2, y + 10);
        ctx.closePath();
        ctx.fill();
        outlinePath(ctx, 0.8, 'rgba(40,20,12,0.8)');
    }
    ctx.strokeStyle = mixColor(hot, '#5a0a12', 0.35);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mouthX + 2, mouthBottom - 6);
    ctx.quadraticCurveTo(mouthX + 14 + Math.sin(time * 2.5) * 5, mouthBottom - 30, mouthX + 4, mouthBottom - 48);
    ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    const mg = ctx.createRadialGradient(mouthX, mouthBottom - 26, 2, mouthX, mouthBottom - 26, 40);
    mg.addColorStop(0, hexToRgba(hot, 0.34 + mouthOpen * 0.2));
    mg.addColorStop(1, hexToRgba(hot, 0));
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(mouthX, mouthBottom - 26, 40, 0, TAU);
    ctx.fill();
    ctx.restore();
    // Olhos espalhados.
    const eyes = [
        [22, -192, 13, 0.4, true],
        [-40, -208, 7, 1.2, false],
        [-66, -174, 9, 2.4, true],
        [58, -218, 6, 3.1, false],
        [80, -178, 8, 4.2, true],
        [-8, -148, 5, 5.3, false],
        [48, -134, 6, 6.1, false],
        [-22, -110, 4, 7.4, false],
    ];
    if (rage) {
        eyes.push([-52, -136, 5, 8.2, true], [72, -146, 5, 9.1, false], [4, -214, 4, 10.4, false]);
    }
    for (const [ex, ey, er, seed, angry] of eyes) {
        colossusEye(ctx, ex, ey, er, eyeColor, time, seed, { angry, glow: rage ? 1.3 : 1 });
    }
    colossusEye(ctx, handR.x + 8, handR.y - 4, 6, eyeColor, time, 11.3, { angry: true });
    // Quebras e dobras de pele.
    ctx.strokeStyle = 'rgba(30,10,12,0.6)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) {
        const x = -40 + i * 18;
        ctx.beginPath();
        ctx.moveTo(x, -64);
        ctx.quadraticCurveTo(x + 6, -52, x - 2, -42);
        ctx.stroke();
    }
    // Fumaça e brasas nas costas.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
        const px = -74 + i * 18 + Math.sin(time * 1.3 + i) * 6;
        const py = -212 - ((time * 24 + i * 17) % 70);
        const pr = 8 + (i % 3) * 4;
        ctx.fillStyle = hexToRgba(i % 2 === 0 ? hot : '#6a5a50', 0.08 + (i % 2) * 0.06);
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, TAU);
        ctx.fill();
    }
    ctx.restore();
    // Fase 2: carne exposta e magma escorrendo.
    if (rage) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.55 + Math.sin(time * 5) * 0.15;
        const rg = ctx.createRadialGradient(-20, -120, 10, -20, -120, 120);
        rg.addColorStop(0, hexToRgba(hot, 0.16));
        rg.addColorStop(1, hexToRgba(hot, 0));
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(-20, -120, 120, 0, TAU);
        ctx.fill();
        for (let i = 0; i < 6; i++) {
            const dx = -58 + i * 22;
            const dy = -58 + Math.sin(time * 3 + i) * 4;
            ctx.fillStyle = hexToRgba(hot, 0.6);
            ctx.beginPath();
            ctx.ellipse(dx, dy, 2.5, 7 + (i % 3) * 2, 0, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }
    ctx.restore();
}
function drawVekthar(ctx, b, time, col, dark, accent) {
    const phase2 = b.phaseIndex > 0;
    const eye = b.def.colors.eye;
    const hot = phase2 ? '#ff8a3c' : accent;
    const windup = b.state === 'windup' ? clamp(b.stateT / Math.max(0.01, b.attackWindup), 0, 1) : 0;
    const execute = b.state === 'execute' ? clamp(b.stateT / Math.max(0.01, b.attackDuration), 0, 1) : 0;
    const recover = b.state === 'recover' ? clamp(1 - b.stateT / Math.max(0.01, b.attackRecover), 0, 1) : 0;
    const breathe = Math.sin(time * 1.7) * 2;
    const attack = b.attackId;
    const isCannon = attack === 'cannon' || attack === 'barrage';
    const isDash = attack === 'dashSlash';
    const isGrenade = attack === 'grenade';
    const isSummon = attack === 'summonCrew';
    ctx.translate(0, breathe * 0.25);
    // Capa rasgada com brasas.
    const flap = Math.sin(time * 1.9) * 7;
    const cape = ctx.createLinearGradient(0, -172, 0, -4);
    cape.addColorStop(0, mixColor(col, dark, 0.55));
    cape.addColorStop(0.6, mixColor(dark, '#3a0c16', 0.42));
    cape.addColorStop(1, '#0c070d');
    ctx.fillStyle = cape;
    ctx.beginPath();
    ctx.moveTo(-18, -168);
    ctx.quadraticCurveTo(-70 - flap, -120, -64 - flap * 0.6, -4);
    ctx.lineTo(-42, -30);
    ctx.lineTo(-32, -6);
    ctx.lineTo(-14, -36);
    ctx.lineTo(0, -10);
    ctx.quadraticCurveTo(24, -92, 18, -162);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(hot, 0.55);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-18, -164);
    ctx.quadraticCurveTo(-66 - flap, -118, -60 - flap * 0.6, -8);
    ctx.stroke();
    // Rasgos iluminados na capa.
    ctx.strokeStyle = hexToRgba(hot, 0.28);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
        const ty = -132 + i * 28;
        ctx.beginPath();
        ctx.moveTo(-40 - flap * 0.5 + i * 2, ty);
        ctx.lineTo(-58 - flap * 0.6 + i * 4, ty + 16);
        ctx.lineTo(-48 - flap * 0.55 + i * 3, ty + 30);
        ctx.stroke();
    }
    if (phase2) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 5; i++) {
            const px = -58 - flap * 0.6 + i * 7 + Math.sin(time * 4 + i) * 3;
            const py = -26 - i * 24;
            ctx.fillStyle = hexToRgba(hot, 0.3 + (i % 2) * 0.2);
            ctx.beginPath();
            ctx.arc(px, py, 1.6 + (i % 2), 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }
    // Pernas blindadas.
    armoredLimb(ctx, -16, -78, -24, -42, 18, tintShade(col), { dark, light: tintShade(col), accent: hot });
    armoredLimb(ctx, -24, -42, -28, -6, 14, dark, { light: tintShade(col), accent: hot });
    armoredLimb(ctx, 16, -78, 24, -42, 18, tintShade(col), { dark, light: tintShade(col), accent: hot });
    armoredLimb(ctx, 24, -42, 28, -6, 14, dark, { light: tintShade(col), accent: hot });
    ctx.fillStyle = tintShade(dark);
    roundRectPath(ctx, -42, -14, 34, 16, 5);
    ctx.fill();
    outlinePath(ctx, 1.6);
    roundRectPath(ctx, 10, -14, 36, 16, 5);
    ctx.fill();
    outlinePath(ctx, 1.6);
    spike(ctx, -26, -40, 12, 16, accent, 0.2);
    spike(ctx, 26, -40, 12, 16, accent, -0.2);
    // Torso e placas.
    const g = ctx.createLinearGradient(-34, -170, 34, -64);
    g.addColorStop(0, tintShade(col));
    g.addColorStop(0.5, col);
    g.addColorStop(1, dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-30, -70);
    ctx.lineTo(-38, -146);
    ctx.quadraticCurveTo(-20, -172, 0, -174);
    ctx.quadraticCurveTo(24, -172, 38, -146);
    ctx.lineTo(28, -70);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 2, 'rgba(5,3,7,0.85)');
    ctx.fillStyle = tintShade(dark);
    roundRectPath(ctx, -26, -146, 52, 52, 8);
    ctx.fill();
    outlinePath(ctx, 1.4);
    ctx.fillStyle = mixColor(col, '#ffffff', 0.12);
    ctx.beginPath();
    ctx.moveTo(-20, -140);
    ctx.lineTo(0, -118);
    ctx.lineTo(20, -140);
    ctx.lineTo(14, -150);
    ctx.lineTo(0, -132);
    ctx.lineTo(-14, -150);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.2);
    // Reator no peito.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const chestCore = ctx.createRadialGradient(0, -122, 1, 0, -122, 24);
    chestCore.addColorStop(0, 'rgba(255,255,255,0.85)');
    chestCore.addColorStop(0.3, hexToRgba(hot, 0.65 + Math.sin(time * 4.4) * 0.15));
    chestCore.addColorStop(1, hexToRgba(hot, 0));
    ctx.fillStyle = chestCore;
    ctx.beginPath();
    ctx.arc(0, -122, 24, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(hot, 0.7);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-6, -122);
    ctx.lineTo(0, -129);
    ctx.lineTo(6, -122);
    ctx.lineTo(0, -115);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = hexToRgba(hot, 0.75);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-12, -104 + i * 7);
        ctx.lineTo(0, -110 + i * 7);
        ctx.lineTo(12, -104 + i * 7);
        ctx.stroke();
    }
    ctx.fillStyle = dark;
    roundRectPath(ctx, -30, -84, 60, 12, 3);
    ctx.fill();
    ctx.fillStyle = accent;
    roundRectPath(ctx, -7, -83, 14, 10, 2);
    ctx.fill();
    // Mochila reator e cabos.
    ctx.fillStyle = tintShade(dark);
    roundRectPath(ctx, -48, -164, 18, 62, 6);
    ctx.fill();
    outlinePath(ctx, 1.4);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = hexToRgba(hot, 0.5 + Math.sin(time * 3) * 0.12);
    roundRectPath(ctx, -44, -154, 10, 38, 4);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(10,8,14,0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-32, -150);
    ctx.bezierCurveTo(-6, -166, 18, -164, 32, -146);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(hot, 0.5);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-32, -150);
    ctx.bezierCurveTo(-6, -166, 18, -164, 32, -146);
    ctx.stroke();
    // Ombros pontiagudos.
    for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side * 34, -148);
        ctx.scale(side, 1);
        const plate = ctx.createLinearGradient(-16, -18, 18, 12);
        plate.addColorStop(0, tintShade(col));
        plate.addColorStop(0.55, col);
        plate.addColorStop(1, dark);
        ctx.fillStyle = plate;
        ctx.beginPath();
        ctx.moveTo(-16, -6);
        ctx.quadraticCurveTo(-6, -22, 16, -18);
        ctx.lineTo(22, 2);
        ctx.quadraticCurveTo(6, 14, -14, 8);
        ctx.closePath();
        ctx.fill();
        outlinePath(ctx, 1.6);
        spike(ctx, 14, -10, 12, 22, tintShade(col), 0.5);
        spike(ctx, 2, -18, 9, 16, accent, 0.2);
        ctx.fillStyle = hexToRgba(accent, 0.8);
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(-8 + i * 9, -4, 1.4, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }
    // Elmo de general.
    ctx.fillStyle = dark;
    roundRectPath(ctx, -8, -182, 16, 16, 4);
    ctx.fill();
    const helm = ctx.createLinearGradient(-16, -208, 16, -176);
    helm.addColorStop(0, tintShade(col));
    helm.addColorStop(0.6, col);
    helm.addColorStop(1, dark);
    ctx.fillStyle = helm;
    ctx.beginPath();
    ctx.moveTo(-16, -180);
    ctx.quadraticCurveTo(-20, -204, 0, -210);
    ctx.quadraticCurveTo(20, -204, 16, -180);
    ctx.lineTo(10, -174);
    ctx.lineTo(-10, -174);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.8);
    ctx.fillStyle = tintShade(dark);
    roundRectPath(ctx, -10, -181, 20, 10, 3);
    ctx.fill();
    outlinePath(ctx, 1);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const vis = ctx.createLinearGradient(-13, -196, 13, -190);
    vis.addColorStop(0, 'rgba(255,176,74,0.15)');
    vis.addColorStop(0.5, eye);
    vis.addColorStop(1, 'rgba(255,176,74,0.15)');
    ctx.fillStyle = vis;
    roundRectPath(ctx, -13, -196, 26, 5, 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-3, -210);
    ctx.lineTo(0, -227);
    ctx.lineTo(3, -210);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = tintShade(col);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-13, -204);
    ctx.quadraticCurveTo(-28, -216, -30, -233);
    ctx.moveTo(13, -204);
    ctx.quadraticCurveTo(28, -216, 30, -233);
    ctx.stroke();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, -178);
    ctx.quadraticCurveTo(-20, -170, -18, -154);
    ctx.moveTo(10, -178);
    ctx.quadraticCurveTo(20, -170, 18, -154);
    ctx.stroke();
    // Braço esquerdo com lâmina de plasma.
    const bladeShoulder = { x: -30, y: -142 };
    // Braço da lâmina fica do lado oposto ao canhão; no golpe, varre à frente.
    let bladeAng = Math.PI - 0.35 + Math.sin(time * 1.4) * 0.05;
    if (isDash) {
        bladeAng =
            b.state === 'windup' ? Math.PI + 0.55 : b.state === 'execute' ? 0.22 : Math.PI - 0.55;
    }
    else if (isSummon)
        bladeAng = Math.PI + 0.25;
    const bElbow = joint(bladeShoulder.x, bladeShoulder.y, 30, bladeAng);
    const bHand = joint(bElbow.x, bElbow.y, 26, bladeAng + 0.15);
    armoredLimb(ctx, bladeShoulder.x, bladeShoulder.y, bElbow.x, bElbow.y, 13, tintShade(col), {
        dark,
        accent: hot,
    });
    armoredLimb(ctx, bElbow.x, bElbow.y, bHand.x, bHand.y, 11, dark, { light: tintShade(col), accent: hot });
    ctx.save();
    ctx.translate(bHand.x, bHand.y);
    ctx.rotate(bladeAng + 0.2);
    ctx.fillStyle = '#2a1a22';
    roundRectPath(ctx, -4, -4, 18, 8, 2);
    ctx.fill();
    ctx.strokeStyle = tintShade(col);
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.quadraticCurveTo(58, -10, 94, -2);
    ctx.stroke();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = hot;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.quadraticCurveTo(58, -10, 94, -2);
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 9;
    ctx.stroke();
    if (b.state === 'execute' && isDash) {
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = hexToRgba(hot, 0.3 - i * 0.08);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 60 + i * 24, -1.1, 0.4);
            ctx.stroke();
        }
    }
    ctx.restore();
    ctx.restore();
    // Granada na mão durante a preparação.
    if (isGrenade && b.state === 'windup') {
        ctx.save();
        ctx.translate(bHand.x, bHand.y);
        ctx.rotate(-0.3);
        ctx.fillStyle = '#3a3a44';
        roundRectPath(ctx, -5, -8, 10, 16, 3);
        ctx.fill();
        outlinePath(ctx, 1);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = hexToRgba('#ff5a3c', 0.9);
        ctx.beginPath();
        ctx.arc(0, -9, 3 + windup * 2.5, 0, TAU);
        ctx.fill();
        ctx.restore();
        ctx.restore();
    }
    // Canhão de plasma integrado.
    const cannonShoulder = { x: 30, y: -142 };
    let cannonAng = 0.16 + Math.sin(time * 1.3) * 0.03;
    if (isCannon) {
        if (b.state === 'windup')
            cannonAng = -0.42 - windup * 0.18;
        else if (b.state === 'execute')
            cannonAng = -0.05;
        else
            cannonAng = 0.22 - recover * 0.05;
    }
    else if (isSummon)
        cannonAng = -1.25;
    else if (isGrenade)
        cannonAng = 0.4;
    const recoil = isCannon && b.state === 'execute' ? Math.sin(execute * Math.PI) * 9 : 0;
    const cElbow = joint(cannonShoulder.x - recoil * 0.4, cannonShoulder.y, 32, cannonAng);
    const cHand = joint(cElbow.x - recoil * 0.6, cElbow.y, 26, cannonAng);
    armoredLimb(ctx, cannonShoulder.x, cannonShoulder.y, cElbow.x, cElbow.y, 17, tintShade(col), {
        dark,
        accent: hot,
    });
    armoredLimb(ctx, cElbow.x, cElbow.y, cHand.x, cHand.y, 14, dark, { light: tintShade(col), accent: hot });
    ctx.save();
    ctx.translate(cHand.x - recoil, cHand.y);
    ctx.rotate(cannonAng);
    const barrel = ctx.createLinearGradient(0, -16, 0, 16);
    barrel.addColorStop(0, tintShade(col));
    barrel.addColorStop(0.5, col);
    barrel.addColorStop(1, dark);
    ctx.fillStyle = barrel;
    roundRectPath(ctx, -12, -15, 60, 30, 8);
    ctx.fill();
    outlinePath(ctx, 1.8);
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = tintShade(dark);
        roundRectPath(ctx, 42, -11 + i * 8, 30, 6, 2);
        ctx.fill();
        outlinePath(ctx, 0.8);
    }
    ctx.save();
    ctx.translate(34, 0);
    ctx.rotate(time * 3);
    ctx.strokeStyle = hexToRgba(hot, 0.7);
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
        ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12);
        ctx.stroke();
    }
    ctx.restore();
    const charge = isCannon
        ? b.state === 'windup'
            ? windup
            : b.state === 'execute'
                ? 1
                : recover * 0.4
        : 0;
    if (charge > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const mg = ctx.createRadialGradient(72, 0, 1, 72, 0, 8 + charge * 26);
        mg.addColorStop(0, 'rgba(255,255,255,0.95)');
        mg.addColorStop(0.35, hexToRgba(hot, 0.75));
        mg.addColorStop(1, hexToRgba(hot, 0));
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(72, 0, 8 + charge * 26, 0, TAU);
        ctx.fill();
        ctx.restore();
    }
    for (let i = 0; i < 4; i++) {
        ctx.fillStyle = hexToRgba(hot, 0.25 + (phase2 ? 0.2 : 0));
        ctx.fillRect(-4 + i * 8, -19, 4, 3);
    }
    ctx.restore();
    // Fase 2: rachaduras e sobrecarga.
    if (phase2) {
        colossusCrack(ctx, [[-24, -140], [-8, -126], [-18, -110], [2, -96]], hexToRgba(hot, 0.85), 1.6, hot);
        colossusCrack(ctx, [[24, -152], [12, -136], [22, -120], [8, -106]], hexToRgba(hot, 0.7), 1.3, hot);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) {
            const px = 24 + Math.sin(time * 2 + i) * 8;
            const py = -158 - ((time * 26 + i * 15) % 44);
            ctx.fillStyle = hexToRgba('#6a5a50', 0.14);
            ctx.beginPath();
            ctx.arc(px, py, 6 + (i % 2) * 4, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }
    // Portal de chamado.
    if (isSummon) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const p = b.state === 'windup' ? windup : b.state === 'execute' ? 1 : recover;
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = hexToRgba(hot, (0.35 - i * 0.08) * p);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(-10, -120, 48 + i * 18 + p * 20, 22 + i * 8 + p * 8, 0.3, 0, TAU);
            ctx.stroke();
        }
        ctx.restore();
    }
}
function drawXalmor(ctx, b, time, col, dark, accent) {
    const phase2 = b.phaseIndex > 0;
    const eyeColor = b.def.colors.eye;
    const windup = b.state === 'windup' ? clamp(b.stateT / Math.max(0.01, b.attackWindup), 0, 1) : 0;
    const execute = b.state === 'execute' ? clamp(b.stateT / Math.max(0.01, b.attackDuration), 0, 1) : 0;
    const recover = b.state === 'recover' ? clamp(1 - b.stateT / Math.max(0.01, b.attackRecover), 0, 1) : 0;
    const attack = b.attackId;
    const isBeam = attack === 'laser' || attack === 'beamSweep' || attack === 'orbital';
    const isPull = attack === 'pull';
    const isMissiles = attack === 'missiles';
    const spin = time * (phase2 ? 0.55 : 0.3);
    ctx.translate(0, -26 + Math.sin(time * 1.2) * 4);
    // Distorção gravitacional.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
        const rr = 84 + i * 24 + Math.sin(time * 0.8 + i) * 6;
        ctx.strokeStyle = hexToRgba(accent, 0.07 - i * 0.012);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, -118, rr, rr * 0.32, time * (0.08 + i * 0.02), 0, TAU);
        ctx.stroke();
    }
    ctx.restore();
    // Anéis orbitais segmentados.
    const ring = (rx, ry, tilt, rot, thickness, alpha) => {
        ctx.save();
        ctx.translate(0, -118);
        ctx.rotate(tilt);
        ctx.strokeStyle = hexToRgba(accent, alpha);
        ctx.lineWidth = thickness;
        ctx.setLineDash([26, 12, 8, 12]);
        ctx.lineDashOffset = rot;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        // Nós e satélites.
        for (let i = 0; i < 6; i++) {
            const a = rot * 0.012 + (i / 6) * TAU;
            const px = Math.cos(a) * rx;
            const py = Math.sin(a) * ry;
            ctx.fillStyle = tintShade(dark);
            ctx.beginPath();
            ctx.arc(px, py, 3.4, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = hexToRgba(accent, 0.6);
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.restore();
    };
    ring(116, 38, 0.12, spin * 90, 5, 0.5);
    ring(138, 48, -0.52, -spin * 70, 3.5, 0.32);
    ring(98, 32, 0.88, spin * 130, 3, 0.28);
    // Painéis solares partidos.
    for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side * 78, -118);
        ctx.rotate(side * (0.16 + Math.sin(time * 0.6 + side) * 0.04));
        ctx.strokeStyle = tintShade(col);
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(side * 16, 0);
        ctx.stroke();
        const px = side > 0 ? 12 : -76;
        const pw = 64;
        const ph = 78;
        const panelGrad = ctx.createLinearGradient(px, -ph / 2, px + pw, ph / 2);
        panelGrad.addColorStop(0, tintShade(col));
        panelGrad.addColorStop(0.5, col);
        panelGrad.addColorStop(1, dark);
        ctx.fillStyle = panelGrad;
        roundRectPath(ctx, px, -ph / 2, pw, ph, 4);
        ctx.fill();
        outlinePath(ctx, 1.4);
        ctx.strokeStyle = hexToRgba(accent, 0.42);
        ctx.lineWidth = 0.8;
        for (let i = 1; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(px + 2, -ph / 2 + (ph / 4) * i);
            ctx.lineTo(px + pw - 2, -ph / 2 + (ph / 4) * i);
            ctx.stroke();
        }
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(px + (pw / 3) * i, -ph / 2 + 2);
            ctx.lineTo(px + (pw / 3) * i, ph / 2 - 2);
            ctx.stroke();
        }
        // Dano e faísca.
        ctx.strokeStyle = 'rgba(0,0,0,0.65)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(px + pw * 0.2, -ph / 2 + 4);
        ctx.lineTo(px + pw * 0.44, -ph * 0.1);
        ctx.lineTo(px + pw * 0.3, ph * 0.2);
        ctx.lineTo(px + pw * 0.52, ph / 2 - 4);
        ctx.stroke();
        if (phase2) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = hexToRgba(eyeColor, 0.35 + Math.sin(time * 7 + side) * 0.2);
            ctx.beginPath();
            ctx.arc(px + pw * 0.44, -ph * 0.1, 2.2, 0, TAU);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }
    // Casco do núcleo.
    const body = ctx.createRadialGradient(-24, -142, 8, 0, -118, 86);
    body.addColorStop(0, tintShade(col));
    body.addColorStop(0.45, col);
    body.addColorStop(0.8, dark);
    body.addColorStop(1, '#060a10');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, -118, 74, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 2.4, 'rgba(4,6,10,0.9)');
    // Placas de blindagem.
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + 0.3;
        ctx.save();
        ctx.translate(0, -118);
        ctx.rotate(a);
        ctx.fillStyle = i % 2 === 0 ? tintShade(dark) : mixColor(col, '#0a1018', 0.4);
        roundRectPath(ctx, 44, -19, 34, 38, 7);
        ctx.fill();
        outlinePath(ctx, 1.2);
        ctx.fillStyle = hexToRgba(accent, 0.55);
        for (let j = 0; j < 2; j++) {
            ctx.beginPath();
            ctx.arc(60, -8 + j * 16, 1.6, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }
    // Veias orgânicas do Ferrato fundidas ao metal.
    ctx.save();
    ctx.strokeStyle = 'rgba(120,22,34,0.6)';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
        const a = 0.4 + i * 1.15;
        const sx = Math.cos(a) * 30;
        const sy = -118 + Math.sin(a) * 30;
        const ex = Math.cos(a + 0.4) * 72;
        const ey = -118 + Math.sin(a + 0.4) * 72;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(Math.cos(a + 0.9) * 54, -118 + Math.sin(a + 0.9) * 54, ex, ey);
        ctx.stroke();
    }
    ctx.restore();
    // Olho-aperture central.
    ctx.fillStyle = '#060408';
    ctx.beginPath();
    ctx.ellipse(0, -118, 38, 27, 0, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 1.6, 'rgba(0,0,0,0.9)');
    const iris = ctx.createRadialGradient(0, -118, 2, 0, -118, 24);
    iris.addColorStop(0, '#ffffff');
    iris.addColorStop(0.3, eyeColor);
    iris.addColorStop(0.75, mixColor(eyeColor, '#1a0408', 0.55));
    iris.addColorStop(1, '#100408');
    ctx.fillStyle = iris;
    ctx.beginPath();
    ctx.ellipse(0, -118, 23, 17, 0, 0, TAU);
    ctx.fill();
    // Pupila e brilho.
    ctx.fillStyle = '#07030a';
    ctx.beginPath();
    ctx.ellipse(Math.sin(time * 0.7) * 3, -118, 5, 14, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(-7, -125, 3, 0, TAU);
    ctx.fill();
    // Lâminas da íris.
    ctx.strokeStyle = hexToRgba(accent, 0.5);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + time * (phase2 ? 0.3 : 0.1);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 24, -118 + Math.sin(a) * 18);
        ctx.lineTo(Math.cos(a) * 32, -118 + Math.sin(a) * 23);
        ctx.stroke();
    }
    // Sensores menores.
    for (const [sx, sy, sr] of [
        [-46, -152, 4],
        [44, -154, 3.2],
        [-52, -92, 3],
        [52, -86, 4.2],
    ]) {
        enemyEye(ctx, sx, sy, sr, eyeColor, { glow: phase2 });
    }
    // Pods de mísseis.
    for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side * 64, -54);
        ctx.rotate(side * 0.16);
        const open = isMissiles ? (b.state === 'windup' ? windup : b.state === 'execute' ? 1 : recover) : 0;
        ctx.fillStyle = tintShade(dark);
        roundRectPath(ctx, -18, -14, 36, 30, 5);
        ctx.fill();
        outlinePath(ctx, 1.2);
        for (let i = 0; i < 3; i++) {
            const tx = -10 + i * 10;
            ctx.fillStyle = '#05070c';
            roundRectPath(ctx, tx - 3, -8 - open * 2, 6, 16, 2);
            ctx.fill();
            if (open > 0.05) {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = hexToRgba(eyeColor, open * (0.5 + Math.sin(time * 8 + i) * 0.2));
                ctx.beginPath();
                ctx.arc(tx, -8 - open * 2, 2.4, 0, TAU);
                ctx.fill();
                ctx.restore();
            }
        }
        ctx.restore();
    }
    // Antenas e luzes de alerta.
    ctx.strokeStyle = tintShade(col);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-20, -186);
    ctx.lineTo(-38, -216);
    ctx.moveTo(22, -184);
    ctx.lineTo(42, -208);
    ctx.stroke();
    const alarm = 0.4 + Math.sin(time * (phase2 ? 9 : 4)) * 0.35;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = hexToRgba(phase2 ? '#ff3b2f' : eyeColor, alarm);
    ctx.beginPath();
    ctx.arc(-38, -216, 3, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(42, -208, 2.6, 0, TAU);
    ctx.fill();
    ctx.restore();
    // Carga do olho / raio.
    const charge = isBeam ? (b.state === 'windup' ? windup : b.state === 'execute' ? 1 : recover * 0.5) : 0;
    if (charge > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const cg = ctx.createRadialGradient(0, -118, 2, 0, -118, 18 + charge * 42);
        cg.addColorStop(0, 'rgba(255,255,255,0.9)');
        cg.addColorStop(0.35, hexToRgba(eyeColor, 0.7));
        cg.addColorStop(1, hexToRgba(eyeColor, 0));
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(0, -118, 18 + charge * 42, 0, TAU);
        ctx.fill();
        if (b.state === 'execute') {
            const beam = ctx.createLinearGradient(20, 0, 300, 0);
            beam.addColorStop(0, hexToRgba(eyeColor, 0.8));
            beam.addColorStop(0.5, hexToRgba(eyeColor, 0.28));
            beam.addColorStop(1, hexToRgba(eyeColor, 0));
            ctx.fillStyle = beam;
            ctx.beginPath();
            ctx.moveTo(18, -126);
            ctx.lineTo(300, -150 - execute * 16);
            ctx.lineTo(300, -86 + execute * 16);
            ctx.lineTo(18, -110);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
    // Campo de atração.
    if (isPull) {
        const p = b.state === 'windup' ? windup : b.state === 'execute' ? 1 : recover;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 7; i++) {
            const a = time * (1.6 + i * 0.1) + i;
            const r = 170 - ((time * 90 + i * 26) % 150);
            ctx.strokeStyle = hexToRgba(accent, 0.22 * p);
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(0, -118, r, a, a + 1.1);
            ctx.stroke();
        }
        ctx.restore();
    }
    // Fase 2: colapso orbital.
    if (phase2) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 9; i++) {
            const a = time * (0.9 + i * 0.05) + i * 2.1;
            const r = 90 + ((i * 23) % 70);
            ctx.fillStyle = hexToRgba(i % 3 === 0 ? '#ffffff' : eyeColor, 0.4);
            ctx.fillRect(Math.cos(a) * r, -118 + Math.sin(a) * r * 0.5, 2, 2);
        }
        ctx.restore();
        colossusCrack(ctx, [[-54, -146], [-38, -128], [-48, -108], [-28, -92]], hexToRgba(eyeColor, 0.8), 1.4, eyeColor);
    }
}
function drawAcheron(ctx, b, time, col, dark, accent) {
    const phase2 = b.phaseIndex > 0;
    const eye = b.def.colors.eye;
    const hot = phase2 ? '#ff6a1f' : accent;
    const windup = b.state === 'windup' ? clamp(b.stateT / Math.max(0.01, b.attackWindup), 0, 1) : 0;
    const execute = b.state === 'execute' ? clamp(b.stateT / Math.max(0.01, b.attackDuration), 0, 1) : 0;
    const recover = b.state === 'recover' ? clamp(1 - b.stateT / Math.max(0.01, b.attackRecover), 0, 1) : 0;
    const attack = b.attackId;
    const isWhip = attack === 'chainWhip';
    const isPillars = attack === 'firePillars';
    const isSlash = attack === 'teleportSlash';
    const isSummon = attack === 'summonSouls';
    const breathe = Math.sin(time * 1.5) * 3;
    if (isSlash)
        ctx.globalAlpha *= 0.55 + Math.sin(time * 30) * 0.28;
    ctx.translate(0, breathe * 0.3);
    // Capa de almas.
    const flap = Math.sin(time * 1.7) * 8;
    const cape = ctx.createLinearGradient(0, -190, 0, 0);
    cape.addColorStop(0, tintShade(dark));
    cape.addColorStop(0.55, mixColor(dark, '#3a0a14', 0.4));
    cape.addColorStop(1, '#080306');
    ctx.fillStyle = cape;
    ctx.beginPath();
    ctx.moveTo(-18, -188);
    ctx.quadraticCurveTo(-92 - flap, -130, -84 - flap * 0.7, -2);
    ctx.lineTo(-58, -34);
    ctx.lineTo(-44, -4);
    ctx.lineTo(-22, -40);
    ctx.lineTo(-4, -8);
    ctx.quadraticCurveTo(34, -104, 20, -184);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 2.2, 'rgba(0,0,0,0.7)');
    ctx.strokeStyle = hexToRgba(hot, 0.4);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-18, -184);
    ctx.quadraticCurveTo(-88 - flap, -128, -80 - flap * 0.7, -6);
    ctx.stroke();
    // Rostos presos na capa.
    const faces = [
        [-52, -126, 0.7],
        [-26, -92, 0.9],
        [-58, -64, 0.6],
        [-14, -44, 0.5],
        [-40, -152, 0.45],
    ];
    if (phase2)
        faces.push([-66, -100, 0.8], [2, -124, 0.5], [-30, -20, 0.4]);
    for (const [fx, fy, fs] of faces) {
        ctx.save();
        ctx.translate(fx + Math.sin(time * 1.2 + fx) * 2, fy);
        ctx.scale(fs, fs);
        ctx.fillStyle = 'rgba(10,4,8,0.85)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 10, 0, 0, TAU);
        ctx.fill();
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const fa = 0.35 + Math.sin(time * 2.4 + fy) * 0.2;
        ctx.fillStyle = hexToRgba(eye, fa);
        ctx.beginPath();
        ctx.arc(-2.4, -1.6, 1.2, 0, TAU);
        ctx.arc(2.4, -1.6, 1.2, 0, TAU);
        ctx.fill();
        ctx.restore();
        ctx.restore();
    }
    // Pernas e botas.
    armoredLimb(ctx, -14, -82, -22, -44, 16, dark, { light: tintShade(col), accent: hot });
    armoredLimb(ctx, -22, -44, -20, -4, 12, tintShade(col), { dark });
    armoredLimb(ctx, 14, -82, 22, -44, 16, dark, { light: tintShade(col), accent: hot });
    armoredLimb(ctx, 22, -44, 20, -4, 12, tintShade(col), { dark });
    ctx.fillStyle = tintShade(dark);
    roundRectPath(ctx, -34, -14, 28, 16, 4);
    ctx.fill();
    outlinePath(ctx, 1.4);
    roundRectPath(ctx, 6, -14, 28, 16, 4);
    ctx.fill();
    outlinePath(ctx, 1.4);
    // Torso.
    const g = ctx.createLinearGradient(-34, -190, 34, -70);
    g.addColorStop(0, tintShade(col));
    g.addColorStop(0.55, col);
    g.addColorStop(1, dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-28, -76);
    ctx.lineTo(-34, -154);
    ctx.quadraticCurveTo(0, -180, 34, -154);
    ctx.lineTo(28, -76);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 2, 'rgba(5,2,6,0.85)');
    // Costelas expostas.
    ctx.strokeStyle = '#c9b48c';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(0, -142 + i * 15, 24 + i * 2, -0.15, Math.PI + 0.15);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(80,30,20,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, -142 + i * 15, 24 + i * 2, -0.15, Math.PI + 0.15);
        ctx.stroke();
        ctx.strokeStyle = '#c9b48c';
        ctx.lineWidth = 3;
    }
    // Coração incandescente.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const heart = ctx.createRadialGradient(0, -120, 1, 0, -120, 20);
    heart.addColorStop(0, '#ffffff');
    heart.addColorStop(0.3, hot);
    heart.addColorStop(1, hexToRgba(hot, 0));
    ctx.fillStyle = heart;
    ctx.beginPath();
    ctx.arc(0, -120, 20 + Math.sin(time * 4) * 3, 0, TAU);
    ctx.fill();
    ctx.restore();
    // Correntes cruzando o peito.
    ctx.strokeStyle = 'rgba(190,160,120,0.55)';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([5, 4]);
    for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(-30, -150 + i * 20);
        ctx.quadraticCurveTo(0, -126 + i * 24, 30, -150 + i * 20);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    // Rachaduras de magma.
    colossusCrack(ctx, [[-22, -160], [-8, -144], [-18, -128], [2, -110]], hexToRgba(hot, 0.8), 1.6, hot);
    colossusCrack(ctx, [[22, -148], [10, -132], [20, -116], [6, -100]], hexToRgba(hot, 0.65), 1.3, hot);
    // Ombreiras com crânios.
    for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side * 32, -158);
        ctx.scale(side, 1);
        const plate = ctx.createLinearGradient(-16, -18, 20, 14);
        plate.addColorStop(0, tintShade(col));
        plate.addColorStop(0.6, col);
        plate.addColorStop(1, dark);
        ctx.fillStyle = plate;
        ctx.beginPath();
        ctx.moveTo(-18, -8);
        ctx.quadraticCurveTo(-8, -26, 16, -20);
        ctx.lineTo(24, 4);
        ctx.quadraticCurveTo(6, 16, -16, 10);
        ctx.closePath();
        ctx.fill();
        outlinePath(ctx, 1.6);
        spike(ctx, 16, -12, 12, 24, tintShade(col), 0.55);
        spike(ctx, 4, -20, 9, 18, hot, 0.2);
        // Crânio.
        ctx.fillStyle = '#d8c6a2';
        ctx.beginPath();
        ctx.ellipse(-2, -2, 6, 7, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#1a0808';
        ctx.beginPath();
        ctx.arc(-4, -3, 1.4, 0, TAU);
        ctx.arc(1, -3, 1.4, 0, TAU);
        ctx.fill();
        ctx.restore();
    }
    // Cabeça e coroa.
    ctx.fillStyle = tintShade(dark);
    roundRectPath(ctx, -8, -196, 16, 16, 4);
    ctx.fill();
    const skull = ctx.createLinearGradient(-18, -222, 18, -188);
    skull.addColorStop(0, '#e2d2ae');
    skull.addColorStop(0.55, '#b8a078');
    skull.addColorStop(1, '#5a4a36');
    ctx.fillStyle = skull;
    ctx.beginPath();
    ctx.ellipse(0, -208, 17, 21, 0, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 1.6, 'rgba(10,6,8,0.8)');
    // Mandíbula.
    ctx.fillStyle = '#a8906a';
    roundRectPath(ctx, -12, -198, 24, 12, 4);
    ctx.fill();
    outlinePath(ctx, 1.1);
    // Dentes.
    ctx.fillStyle = '#e8dcc0';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(-10 + i * 5, -196, 2.4, 4);
    }
    // Olhos.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const eyeGlow = ctx.createRadialGradient(0, -214, 2, 0, -214, 26);
    eyeGlow.addColorStop(0, hexToRgba(eye, 0.5));
    eyeGlow.addColorStop(1, hexToRgba(eye, 0));
    ctx.fillStyle = eyeGlow;
    ctx.fillRect(-26, -240, 52, 52);
    ctx.restore();
    enemyEye(ctx, -6.5, -214, 3.4, eye, { vertical: true, angry: true, glow: false });
    enemyEye(ctx, 6.5, -214, 3.4, eye, { vertical: true, angry: true, glow: false });
    // Boca de brasas.
    ctx.strokeStyle = hexToRgba(hot, 0.75);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -199);
    ctx.lineTo(-3, -197);
    ctx.lineTo(1, -200);
    ctx.lineTo(5, -197);
    ctx.lineTo(9, -199);
    ctx.stroke();
    // Chifres (três pares).
    ctx.strokeStyle = tintShade(col);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 12, -220);
        ctx.quadraticCurveTo(side * 38, -234, side * 30, -258);
        ctx.stroke();
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.moveTo(side * 15, -214);
        ctx.quadraticCurveTo(side * 34, -218, side * 42, -238);
        ctx.stroke();
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(side * 14, -204);
        ctx.quadraticCurveTo(side * 26, -202, side * 34, -214);
        ctx.stroke();
        ctx.lineWidth = 5;
    }
    // Coroa.
    ctx.fillStyle = hot;
    for (let i = 0; i < 7; i++) {
        const px = -18 + i * 6;
        const h = 14 + (i % 2) * 8 + (i === 3 ? 6 : 0);
        ctx.beginPath();
        ctx.moveTo(px, -224);
        ctx.lineTo(px + 3, -224 - h);
        ctx.lineTo(px + 6, -224);
        ctx.closePath();
        ctx.fill();
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = hexToRgba(hot, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-20, -224);
    ctx.lineTo(20, -224);
    ctx.stroke();
    ctx.restore();
    if (phase2) {
        // Coroa derretendo.
        ctx.strokeStyle = hexToRgba(hot, 0.7);
        ctx.lineWidth = 1.4;
        for (let i = 0; i < 5; i++) {
            const px = -16 + i * 8;
            ctx.beginPath();
            ctx.moveTo(px, -222);
            ctx.quadraticCurveTo(px + 2, -212, px - 1, -204 + Math.sin(time * 3 + i) * 2);
            ctx.stroke();
        }
    }
    // Braços de corrente na fase 2.
    if (phase2) {
        for (const side of [-1, 1]) {
            const sway = Math.sin(time * 1.4 + side) * 0.25;
            const sx = side * 26;
            const sy = -166;
            const mx = side * (58 + Math.sin(time * 1.2 + side) * 6);
            const my = -116 + sway * 20;
            const ex = side * (76 + Math.sin(time * 1.6 + side * 2) * 8);
            const ey = -54 + sway * 24;
            ctx.strokeStyle = 'rgba(12,6,10,0.9)';
            ctx.lineWidth = 9;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(mx, my, ex, ey);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(190,160,120,0.65)';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 5]);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(mx, my, ex, ey);
            ctx.stroke();
            ctx.setLineDash([]);
            // Garra.
            for (let i = 0; i < 3; i++) {
                claw(ctx, ex, ey, 18, Math.PI * 0.4 + i * 0.25 + side * 0.1, '#d8c6a2');
            }
        }
    }
    // Foice acorrentada.
    const shoulder = { x: 32, y: -156 };
    let scytheAng = 0.22 + Math.sin(time * 0.9) * 0.05;
    if (isWhip)
        scytheAng = b.state === 'windup' ? -0.9 : b.state === 'execute' ? 0.95 : 0.4;
    else if (isSlash)
        scytheAng = b.state === 'windup' ? -1.55 : b.state === 'execute' ? 1.25 : 0.35;
    else if (isPillars)
        scytheAng = b.state === 'windup' ? -1.2 : 0.5;
    const elbow = joint(shoulder.x, shoulder.y, 30, scytheAng);
    const hand = joint(elbow.x, elbow.y, 28, scytheAng + 0.12);
    armoredLimb(ctx, shoulder.x, shoulder.y, elbow.x, elbow.y, 13, tintShade(col), { dark, accent: hot });
    armoredLimb(ctx, elbow.x, elbow.y, hand.x, hand.y, 11, dark, { light: tintShade(col), accent: hot });
    ctx.save();
    ctx.translate(hand.x, hand.y);
    ctx.rotate(scytheAng + 0.12);
    // Haste.
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(96, 0);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(210,180,140,0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-30, -1.6);
    ctx.lineTo(96, -1.6);
    ctx.stroke();
    // Lâmina crescente.
    const bladeGrad = ctx.createLinearGradient(80, -8, 120, -60);
    bladeGrad.addColorStop(0, tintShade(dark));
    bladeGrad.addColorStop(0.55, mixColor(col, '#ffffff', 0.15));
    bladeGrad.addColorStop(1, '#e8dcc0');
    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    ctx.moveTo(80, -4);
    ctx.quadraticCurveTo(126, -18, 120, -66);
    ctx.quadraticCurveTo(104, -34, 76, -20);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.4);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = hot;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(80, -4);
    ctx.quadraticCurveTo(126, -18, 120, -66);
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.restore();
    // Corrente pendurada na haste.
    ctx.strokeStyle = 'rgba(190,160,120,0.5)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(10, 2);
    ctx.quadraticCurveTo(26, 34, 8, 58);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    // Correntes flutuantes com ganchos.
    for (let i = 0; i < 3; i++) {
        const ph = time * 1.1 + i * 2.1;
        const sx = -52 - i * 6;
        const sy = -158 + i * 30;
        const ex = -78 + Math.sin(ph) * 12;
        const ey = -66 + i * 22 + Math.cos(ph * 0.8) * 8;
        ctx.strokeStyle = 'rgba(10,6,8,0.85)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(-96, -120 + i * 20, -58, -94 + i * 18, ex, ey);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(200,170,130,0.6)';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(-96, -120 + i * 20, -58, -94 + i * 18, ex, ey);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(200,170,130,0.8)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(ex, ey + 6, 7, -0.4, Math.PI * 1.2);
        ctx.stroke();
    }
    // Pilares de fogo.
    if (isPillars) {
        const p = b.state === 'windup' ? windup : b.state === 'execute' ? 1 : recover;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) {
            const px = -66 + i * 44;
            const h = 60 + p * 110 + Math.sin(time * 9 + i) * 10;
            const fg = ctx.createLinearGradient(px, 0, px, -h);
            fg.addColorStop(0, hexToRgba(hot, 0.55 * p));
            fg.addColorStop(0.5, hexToRgba(hot, 0.24 * p));
            fg.addColorStop(1, hexToRgba(hot, 0));
            ctx.fillStyle = fg;
            ctx.beginPath();
            ctx.moveTo(px - 14, 0);
            ctx.quadraticCurveTo(px - 6, -h * 0.5, px, -h);
            ctx.quadraticCurveTo(px + 8, -h * 0.5, px + 14, 0);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
    // Almas orbitando.
    if (isSummon || phase2) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const count = isSummon ? 7 : 4;
        for (let i = 0; i < count; i++) {
            const a = time * 0.9 + (i / count) * TAU;
            const r = 66 + Math.sin(time * 1.3 + i) * 10;
            const px = Math.cos(a) * r;
            const py = -128 + Math.sin(a) * r * 0.5;
            const alpha = 0.3 + Math.sin(time * 3 + i) * 0.2;
            ctx.fillStyle = hexToRgba(eye, alpha);
            ctx.beginPath();
            ctx.ellipse(px, py, 3, 7, a, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }
    // Aura de fase 2.
    if (phase2) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const fg = ctx.createRadialGradient(0, -110, 20, 0, -110, 110);
        fg.addColorStop(0, hexToRgba(hot, 0.14));
        fg.addColorStop(1, hexToRgba(hot, 0));
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(0, -110, 110, 0, TAU);
        ctx.fill();
        ctx.restore();
    }
}
function drawMalakhim(ctx, b, time, col, dark, accent) {
    const phase2 = b.phaseIndex > 0;
    const eye = b.def.colors.eye;
    const windup = b.state === 'windup' ? clamp(b.stateT / Math.max(0.01, b.attackWindup), 0, 1) : 0;
    const execute = b.state === 'execute' ? clamp(b.stateT / Math.max(0.01, b.attackDuration), 0, 1) : 0;
    const recover = b.state === 'recover' ? clamp(1 - b.stateT / Math.max(0.01, b.attackRecover), 0, 1) : 0;
    const attack = b.attackId;
    const isBeam = attack === 'lightBeam';
    const isDive = attack === 'diveSlash';
    const isStorm = attack === 'wingStorm' || attack === 'featherFan';
    const isSummon = attack === 'summonSeraphs';
    const flap = Math.sin(time * 1.6) * 0.18;
    const breathe = Math.sin(time * 1.3) * 2;
    ctx.translate(0, breathe * 0.4);
    // Auréola partida com olhos.
    ctx.save();
    ctx.translate(0, -238);
    ctx.rotate(Math.sin(time * 0.4) * 0.08);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const hg = ctx.createRadialGradient(0, 0, 4, 0, 0, 66);
    hg.addColorStop(0, hexToRgba(accent, 0.3));
    hg.addColorStop(1, hexToRgba(accent, 0));
    ctx.fillStyle = hg;
    ctx.fillRect(-70, -70, 140, 140);
    ctx.restore();
    for (let i = 0; i < 2; i++) {
        ctx.strokeStyle = hexToRgba(accent, 0.55 - i * 0.15);
        ctx.lineWidth = 2.4 - i * 0.6;
        ctx.beginPath();
        ctx.arc(0, 0, 34 + i * 9, i * 0.8 + time * 0.15, i * 0.8 + Math.PI * 1.45 + time * 0.15);
        ctx.stroke();
    }
    // Olhos na auréola.
    for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + 0.6 + time * 0.1;
        const hx = Math.cos(a) * 38;
        const hy = Math.sin(a) * 38;
        if (phase2 && i % 2 === 0)
            continue;
        enemyEye(ctx, hx, hy, 2.2, accent, { glow: false, vertical: true });
    }
    if (phase2) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 7; i++) {
            const a = i * 1.4 + time * 0.2;
            const r = 40 + ((i * 17 + time * 20) % 40);
            ctx.fillStyle = hexToRgba(accent, 0.35);
            ctx.fillRect(Math.cos(a) * r, Math.sin(a) * r, 2.4, 2.4);
        }
        ctx.restore();
    }
    ctx.restore();
    // Brilho por trás das asas.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const wingGlow = ctx.createRadialGradient(0, -148, 10, 0, -148, 165);
    wingGlow.addColorStop(0, hexToRgba(accent, 0.22));
    wingGlow.addColorStop(0.55, hexToRgba(col, 0.09));
    wingGlow.addColorStop(1, hexToRgba(accent, 0));
    ctx.fillStyle = wingGlow;
    ctx.beginPath();
    ctx.ellipse(0, -148, 178, 118, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    // Seis asas em três pares.
    for (const side of [-1, 1]) {
        for (let w = 0; w < 3; w++) {
            ctx.save();
            ctx.translate(side * 12, -154 + w * 12);
            const spread = isStorm ? 0.2 + (b.state === 'windup' ? windup : 0.4) * 0.5 : 0;
            ctx.rotate(side * (-0.24 + w * 0.3 + flap * (1 - w * 0.2) + spread));
            const len = 132 - w * 20;
            const droop = 18 + w * 5;
            const burntWing = phase2 && w === 2;
            // Silhueta escura de reforço.
            ctx.fillStyle = 'rgba(8,6,10,0.88)';
            ctx.beginPath();
            ctx.moveTo(-4, -14);
            ctx.quadraticCurveTo(side * len * 0.55, -38 - w * 6, side * (len + 8), -8 + w * 6);
            ctx.quadraticCurveTo(side * len * 0.62, 22 + w * 5, -4, 16);
            ctx.closePath();
            ctx.fill();
            // Membrana da asa.
            const wing = ctx.createLinearGradient(0, 0, side * len, droop);
            wing.addColorStop(0, hexToRgba(accent, burntWing ? 0.35 : 0.72));
            wing.addColorStop(0.42, hexToRgba(mixColor(col, '#ffffff', 0.18), burntWing ? 0.26 : 0.5));
            wing.addColorStop(0.78, hexToRgba(burntWing ? mixColor(col, '#2a1810', 0.5) : col, 0.36));
            wing.addColorStop(1, hexToRgba(burntWing ? '#3a2010' : accent, 0.06));
            ctx.fillStyle = wing;
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.quadraticCurveTo(side * len * 0.48, -36 - w * 5, side * len, -8 + w * 6);
            ctx.quadraticCurveTo(side * len * 0.6, 24 + w * 5, 0, 12);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = burntWing ? hexToRgba('#ff6a1f', 0.4) : hexToRgba(accent, 0.55);
            ctx.lineWidth = 1.4;
            ctx.stroke();
            // Penas longas.
            for (let f = 0; f < 7; f++) {
                const t = (f + 1) / 8;
                const fx = side * len * t * 0.94;
                const fy = -8 + t * 20 + Math.sin(time * 2 + f + w) * 1.2;
                const flen = 30 + (1 - t) * 34;
                ctx.save();
                ctx.translate(fx, fy);
                ctx.rotate(side * (0.3 + t * 0.5));
                const burnt = burntWing || (phase2 && (f + w) % 3 === 0);
                const featherCol = burnt ? mixColor(col, '#2a1810', 0.55) : mixColor(col, '#ffffff', 0.45);
                ctx.fillStyle = featherCol;
                ctx.beginPath();
                ctx.ellipse(side * flen * 0.5, 0, flen * 0.6, 4.2 - t * 1.1, 0, 0, TAU);
                ctx.fill();
                ctx.strokeStyle = burnt ? hexToRgba('#ff6a1f', 0.5) : hexToRgba(accent, 0.5);
                ctx.lineWidth = 0.9;
                ctx.stroke();
                // Cálamo da pena.
                ctx.strokeStyle = hexToRgba(accent, 0.35);
                ctx.lineWidth = 0.7;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(side * flen * 0.9, 0);
                ctx.stroke();
                ctx.restore();
            }
            // Coberturas menores na base.
            for (let f = 0; f < 4; f++) {
                const t = (f + 1) / 5;
                ctx.save();
                ctx.translate(side * len * 0.18 * t, -4 + t * 8);
                ctx.rotate(side * (0.1 + t * 0.3));
                ctx.fillStyle = burntWing ? mixColor(col, '#2a1810', 0.45) : mixColor(col, '#ffffff', 0.55);
                ctx.beginPath();
                ctx.ellipse(side * 10, 0, 11, 3.4, 0, 0, TAU);
                ctx.fill();
                ctx.restore();
            }
            ctx.restore();
        }
    }
    // Corpo e manto.
    ctx.fillStyle = tintShade(dark);
    roundRectPath(ctx, -26, -164, 52, 92, 10);
    ctx.fill();
    const robe = ctx.createLinearGradient(0, -160, 0, -20);
    robe.addColorStop(0, col);
    robe.addColorStop(0.45, mixColor(col, '#ffffff', 0.15));
    robe.addColorStop(1, dark);
    ctx.fillStyle = robe;
    ctx.beginPath();
    ctx.moveTo(-24, -152);
    ctx.quadraticCurveTo(-38, -90, -46, -8);
    ctx.lineTo(-18, -26);
    ctx.lineTo(0, -6);
    ctx.lineTo(18, -26);
    ctx.lineTo(46, -8);
    ctx.quadraticCurveTo(38, -90, 24, -152);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.8, 'rgba(20,16,8,0.7)');
    // Peitoral dourado.
    ctx.fillStyle = mixColor(accent, '#ffffff', 0.2);
    ctx.beginPath();
    ctx.moveTo(-20, -156);
    ctx.lineTo(0, -138);
    ctx.lineTo(20, -156);
    ctx.lineTo(13, -118);
    ctx.lineTo(-13, -118);
    ctx.closePath();
    ctx.fill();
    outlinePath(ctx, 1.2, 'rgba(60,48,20,0.7)');
    // Sigilo solar.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = hexToRgba(accent, 0.8);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, -138, 7, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 9, -138 + Math.sin(a) * 9);
        ctx.lineTo(Math.cos(a) * 13, -138 + Math.sin(a) * 13);
        ctx.stroke();
    }
    ctx.restore();
    // Cabeça serena.
    ctx.fillStyle = '#f0e6cf';
    ctx.beginPath();
    ctx.ellipse(0, -184, 13, 16, 0, 0, TAU);
    ctx.fill();
    outlinePath(ctx, 1.2, 'rgba(60,48,30,0.6)');
    // Cabelo / elmo dourado.
    ctx.fillStyle = mixColor(accent, '#b89440', 0.4);
    ctx.beginPath();
    ctx.arc(0, -190, 14, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();
    // Olhos fechados.
    ctx.strokeStyle = 'rgba(60,44,30,0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-5.5, -186, 3.2, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(5.5, -186, 3.2, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    // Lágrima de luz.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = hexToRgba(accent, 0.85);
    ctx.beginPath();
    ctx.ellipse(6, -178 + ((time * 12) % 10), 1.4, 2.6, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    // Boca.
    ctx.strokeStyle = 'rgba(80,56,40,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3, -174);
    ctx.quadraticCurveTo(0, -172.5, 3, -174);
    ctx.stroke();
    // Terceiro olho na fase 2.
    if (phase2) {
        enemyEye(ctx, 0, -198, 3, eye, { vertical: true, angry: false });
    }
    // Manchas de corrupção.
    ctx.fillStyle = 'rgba(40,12,30,0.5)';
    ctx.beginPath();
    ctx.ellipse(-16, -120, 5, 11, 0.3, 0, TAU);
    ctx.ellipse(13, -96, 4, 8, -0.2, 0, TAU);
    ctx.fill();
    if (phase2) {
        ctx.strokeStyle = 'rgba(80,20,40,0.55)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-10, -132);
        ctx.quadraticCurveTo(-24, -100, -14, -64);
        ctx.moveTo(12, -118);
        ctx.quadraticCurveTo(28, -84, 18, -46);
        ctx.stroke();
        colossusCrack(ctx, [[-6, -160], [6, -146], [-4, -130], [8, -112]], hexToRgba(eye, 0.6), 1.2, eye);
    }
    // Espada de luz.
    let armAng = 0.1;
    if (isDive)
        armAng = b.state === 'windup' ? -1.5 : b.state === 'execute' ? 1.1 : 0.3;
    else if (isBeam)
        armAng = b.state === 'windup' ? -1.1 : -0.2;
    else if (isStorm)
        armAng = b.state === 'windup' ? -0.8 : 0.7;
    const hand = joint(26, -148, 42, armAng);
    armoredLimb(ctx, 22, -150, hand.x, hand.y, 8, col, { dark, light: '#fff4cd', accent });
    const tip = joint(hand.x, hand.y, 108, armAng + 0.2);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const bladeGrad = ctx.createLinearGradient(hand.x, hand.y, tip.x, tip.y);
    bladeGrad.addColorStop(0, 'rgba(255,240,180,0.25)');
    bladeGrad.addColorStop(0.45, '#fff2b0');
    bladeGrad.addColorStop(1, '#ffffff');
    ctx.strokeStyle = bladeGrad;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hand.x, hand.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 18;
    ctx.stroke();
    ctx.restore();
    // Guarda em forma de penas.
    ctx.save();
    ctx.translate(hand.x, hand.y);
    ctx.rotate(armAng + 0.2);
    ctx.fillStyle = mixColor(accent, '#ffffff', 0.25);
    for (const side of [-1, 1]) {
        ctx.save();
        ctx.scale(side, 1);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(10, -8, 20, -4);
        ctx.quadraticCurveTo(12, 0, 18, 6);
        ctx.quadraticCurveTo(8, 4, 0, 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    ctx.restore();
    // Raio de luz celestial.
    if (isBeam) {
        const charge = b.state === 'windup' ? windup : b.state === 'execute' ? 1 : recover * 0.5;
        if (charge > 0.01) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const bg = ctx.createLinearGradient(0, -360, 0, -190);
            bg.addColorStop(0, hexToRgba(accent, 0));
            bg.addColorStop(0.7, hexToRgba(accent, 0.22 * charge));
            bg.addColorStop(1, hexToRgba('#ffffff', 0.4 * charge));
            ctx.fillStyle = bg;
            ctx.beginPath();
            ctx.moveTo(-20 - charge * 12, -360);
            ctx.lineTo(20 + charge * 12, -360);
            ctx.lineTo(10 + charge * 6, -190);
            ctx.lineTo(-10 - charge * 6, -190);
            ctx.closePath();
            ctx.fill();
            const cg = ctx.createRadialGradient(0, -184, 2, 0, -184, 20 + charge * 30);
            cg.addColorStop(0, 'rgba(255,255,255,0.9)');
            cg.addColorStop(0.4, hexToRgba(accent, 0.6));
            cg.addColorStop(1, hexToRgba(accent, 0));
            ctx.fillStyle = cg;
            ctx.beginPath();
            ctx.arc(0, -184, 20 + charge * 30, 0, TAU);
            ctx.fill();
            ctx.restore();
        }
    }
    // Chamado de serafins.
    if (isSummon) {
        const p = b.state === 'windup' ? windup : b.state === 'execute' ? 1 : recover;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = hexToRgba(accent, (0.28 - i * 0.06) * p);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, -140, 56 + i * 20 + p * 16, 24 + i * 9 + p * 6, 0.2, 0, TAU);
            ctx.stroke();
        }
        ctx.restore();
    }
    // Penas caindo.
    const feathers = phase2 ? 14 : 6;
    for (let i = 0; i < feathers; i++) {
        const t = (time * (0.14 + (i % 3) * 0.03) + i * 0.13) % 1;
        const px = -140 + ((i * 47) % 280) + Math.sin(time * 1.4 + i) * 8;
        const py = -230 + t * 230;
        const alpha = Math.sin(t * Math.PI) * (phase2 ? 0.55 : 0.32);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.sin(time * 2 + i) * 0.5 + t * 2);
        ctx.fillStyle = phase2 && i % 3 === 0 ? hexToRgba('#ff8a3c', alpha) : hexToRgba(accent, alpha);
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 1.4, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
    }
}
function drawFerrato(ctx, b, time, col, dark, accent) {
    const phase = b.phaseIndex;
    const eyeColor = b.def.colors.eye;
    const glowColor = b.def.colors.glow;
    const windup = b.state === 'windup' ? clamp(b.stateT / Math.max(0.01, b.attackWindup), 0, 1) : 0;
    const execute = b.state === 'execute' ? clamp(b.stateT / Math.max(0.01, b.attackDuration), 0, 1) : 0;
    const recover = b.state === 'recover' ? clamp(1 - b.stateT / Math.max(0.01, b.attackRecover), 0, 1) : 0;
    const attack = b.attackId;
    const isBlackHole = attack === 'blackHole';
    const isJudgment = attack === 'finalJudgment' || attack === 'allPlanes';
    const isOrbs = attack === 'voidOrbs' || attack === 'summonEchoes';
    const pulse = Math.sin(time * 1.2) * 8;
    const breathe = Math.sin(time * 1.05) * 4;
    const compress = isBlackHole ? (b.state === 'windup' ? windup : b.state === 'execute' ? 1 : recover) : 0;
    const bodyScale = 1 - compress * 0.14 + phase * 0.015;
    ctx.translate(0, breathe);
    // Silhueta irregular: uma massa de carne cósmica com farpas ósseas.
    const bodyPath = () => {
        const N = 30;
        const pts = [];
        for (let i = 0; i < N; i++) {
            const a = -Math.PI / 2 + (i / N) * TAU;
            const spike = i % 3 === 0 ? 15 + Math.sin(time * 1.1 + i) * 5 : 0;
            const wob = Math.sin(a * 3 + 0.7) * 9 + Math.sin(a * 5 + 1.3) * 6;
            const rx = 106 + wob + spike + pulse * 0.25;
            const ry = 124 + Math.cos(a * 4 + 0.4) * 9 + spike * 0.8;
            pts.push({ x: Math.cos(a) * rx, y: -176 + Math.sin(a) * ry });
        }
        const mid = (p, q) => ({
            x: (p.x + q.x) / 2,
            y: (p.y + q.y) / 2,
        });
        ctx.beginPath();
        const start = mid(pts[N - 1], pts[0]);
        ctx.moveTo(start.x, start.y);
        for (let i = 0; i < N; i++) {
            const p = pts[i];
            const next = pts[(i + 1) % N];
            const m = mid(p, next);
            ctx.quadraticCurveTo(p.x, p.y, m.x, m.y);
        }
        ctx.closePath();
    };
    ctx.save();
    ctx.translate(0, -170);
    ctx.scale(bodyScale, bodyScale);
    ctx.translate(0, 170);
    // Distorção do Véu ao redor.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
        const rr = 130 + i * 30 + Math.sin(time * (0.4 + i * 0.1) + i) * 14;
        ctx.strokeStyle = hexToRgba(i % 2 === 0 ? accent : glowColor, 0.07 - i * 0.011);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(0, -178, rr, rr * 0.34, time * (0.06 + i * 0.02), 0, TAU);
        ctx.stroke();
    }
    ctx.restore();
    // Halos rachados.
    for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(0, -296);
        ctx.rotate(time * (0.05 + i * 0.03) + i * 0.6);
        ctx.strokeStyle = hexToRgba(i % 2 === 0 ? accent : glowColor, 0.24 - i * 0.05);
        ctx.lineWidth = 2.6 - i * 0.5;
        ctx.setLineDash([44, 18, 10, 18]);
        ctx.lineDashOffset = time * 20 * (i % 2 === 0 ? 1 : -1);
        ctx.beginPath();
        ctx.ellipse(0, 0, 132 + i * 20, 48 + i * 9, 0, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }
    // Tentáculos cósmicos atrás do corpo.
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + Math.sin(time * 0.5 + i) * 0.2;
        const sx = Math.cos(a) * 56;
        const sy = -168 + Math.sin(a) * 42;
        const reach = 168 + (i % 3) * 24;
        const ex = Math.cos(a + 0.2) * reach;
        const ey = -168 + Math.sin(a + 0.2) * reach * 0.72 + Math.sin(time * 1.3 + i) * 22;
        const cpx = (sx + ex) / 2 + 40;
        const cpy = (sy + ey) / 2 - 52;
        ctx.strokeStyle = 'rgba(6,3,12,0.96)';
        ctx.lineWidth = 26 - (i % 3) * 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cpx, cpy, ex, ey);
        ctx.stroke();
        ctx.strokeStyle = hexToRgba(i % 2 === 0 ? accent : glowColor, 0.3);
        ctx.lineWidth = 4;
        ctx.stroke();
        // Garras na ponta.
        for (let f = 0; f < 4; f++) {
            const fa = a + 0.2 + (f - 1.5) * 0.3;
            const fl = 28 + (f % 2) * 12;
            ctx.strokeStyle = 'rgba(8,4,14,0.95)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.quadraticCurveTo(ex + Math.cos(fa) * fl * 0.55, ey + Math.sin(fa) * fl * 0.55 - 8, ex + Math.cos(fa) * fl, ey + Math.sin(fa) * fl + 8);
            ctx.stroke();
            ctx.strokeStyle = hexToRgba(accent, 0.42);
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        if (i % 3 === 0) {
            colossusEye(ctx, ex, ey, 3.6, i % 2 === 0 ? eyeColor : accent, time, i * 2.3, {
                angry: true,
                glow: 0.9,
            });
        }
    }
    // Farpas ósseas ao redor da massa.
    for (let i = 0; i < 11; i++) {
        const a = (i / 11) * TAU + 0.18;
        const r0 = 94;
        const r1 = 152 + (i % 3) * 18;
        const bx = Math.cos(a) * r0;
        const by = -176 + Math.sin(a) * (r0 * 1.12);
        const tx = Math.cos(a + 0.06) * r1;
        const ty = -176 + Math.sin(a + 0.06) * (r1 * 1.12);
        const nx = Math.cos(a + Math.PI / 2);
        const ny = Math.sin(a + Math.PI / 2);
        ctx.fillStyle = i % 3 === 0 ? mixColor(accent, '#1a0c20', 0.72) : '#160c1e';
        ctx.beginPath();
        ctx.moveTo(bx + nx * 12, by + ny * 12);
        ctx.lineTo(tx, ty);
        ctx.lineTo(bx - nx * 12, by - ny * 12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = hexToRgba(accent, 0.34);
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    // Aura externa.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const outer = ctx.createRadialGradient(0, -176, 90, 0, -176, 210);
    outer.addColorStop(0, hexToRgba(accent, 0));
    outer.addColorStop(0.62, hexToRgba(accent, 0.07));
    outer.addColorStop(1, hexToRgba(accent, 0));
    ctx.fillStyle = outer;
    ctx.fillRect(-260, -420, 520, 500);
    ctx.restore();
    // Corpo.
    const bodyGrad = ctx.createRadialGradient(-26, -210, 10, 0, -170, 176);
    bodyGrad.addColorStop(0, phase >= 2 ? '#2e0a34' : '#161028');
    bodyGrad.addColorStop(0.55, dark);
    bodyGrad.addColorStop(0.86, '#06030c');
    bodyGrad.addColorStop(1, '#020106');
    ctx.fillStyle = bodyGrad;
    bodyPath();
    ctx.fill();
    outlinePath(ctx, 2.6, 'rgba(3,1,8,0.8)');
    // Luz de contorno.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = hexToRgba(accent, 0.32);
    ctx.lineWidth = 1.6;
    bodyPath();
    ctx.stroke();
    ctx.restore();
    // Interior: nebulosas, estrelas e galáxias devoradas.
    ctx.save();
    bodyPath();
    ctx.clip();
    const neb1 = ctx.createRadialGradient(-34, -226, 6, -34, -226, 96);
    neb1.addColorStop(0, hexToRgba(accent, 0.24));
    neb1.addColorStop(1, hexToRgba(accent, 0));
    ctx.fillStyle = neb1;
    ctx.fillRect(-150, -330, 300, 300);
    const neb2 = ctx.createRadialGradient(52, -126, 4, 52, -126, 84);
    neb2.addColorStop(0, hexToRgba(glowColor, 0.2));
    neb2.addColorStop(1, hexToRgba(glowColor, 0));
    ctx.fillStyle = neb2;
    ctx.fillRect(-140, -320, 300, 300);
    // Estrelas.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 44; i++) {
        const a = (i / 44) * TAU + time * 0.05;
        const rr = 24 + ((i * 37) % 110);
        const px = Math.cos(a) * rr;
        const py = -178 + Math.sin(a) * rr * 0.72;
        const tw = 0.4 + Math.sin(time * 3 + i) * 0.4;
        ctx.fillStyle = `rgba(255,255,255,${0.25 + tw * 0.5})`;
        ctx.fillRect(px, py, 1.6 + tw, 1.6 + tw);
    }
    // Braços de galáxia.
    for (let arm = 0; arm < 2; arm++) {
        ctx.strokeStyle = hexToRgba(arm === 0 ? accent : glowColor, 0.24);
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let k = 0; k <= 40; k++) {
            const t = k / 40;
            const a = arm * Math.PI + t * Math.PI * 3.4 + time * 0.08;
            const r = 6 + t * 122;
            const px = -8 + Math.cos(a) * r;
            const py = -178 + Math.sin(a) * r * 0.72;
            if (k === 0)
                ctx.moveTo(px, py);
            else
                ctx.lineTo(px, py);
        }
        ctx.stroke();
        for (let k = 4; k < 40; k += 5) {
            const t = k / 40;
            const a = arm * Math.PI + t * Math.PI * 3.4 + time * 0.08;
            const r = 6 + t * 122;
            ctx.fillStyle = hexToRgba('#ffffff', 0.35 + Math.sin(time * 2 + k) * 0.2);
            ctx.beginPath();
            ctx.arc(-8 + Math.cos(a) * r, -178 + Math.sin(a) * r * 0.72, 1.2, 0, TAU);
            ctx.fill();
        }
    }
    ctx.restore();
    // Detritos de mundos devorados.
    for (let i = 0; i < 8; i++) {
        const a = time * 0.16 + i * 1.9;
        const rr = 44 + ((i * 29) % 72);
        const px = Math.cos(a) * rr;
        const py = -178 + Math.sin(a) * rr * 0.72;
        ctx.fillStyle = 'rgba(40,28,46,0.9)';
        ctx.beginPath();
        ctx.arc(px, py, 2.4 + (i % 3), 0, TAU);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(accent, 0.3);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(px, py, 5 + (i % 2) * 2, 1.6, 0.6 + i, 0, TAU);
        ctx.stroke();
    }
    ctx.restore();
    // Olhos múltiplos.
    const eyeSpots = [
        [0, -248, 13, 0.4, true],
        [-66, -238, 8, 1.2, true],
        [64, -246, 7, 1.7, true],
        [-94, -184, 7, 2.1, true],
        [88, -192, 8, 3.2, true],
        [-34, -270, 5, 4.1, true],
        [40, -276, 4, 4.8, true],
        [-46, -126, 5, 5.3, true],
        [50, -130, 6, 6.2, true],
        [-106, -142, 4, 7.1, true],
        [106, -146, 4, 7.6, true],
    ];
    if (phase >= 1) {
        eyeSpots.push([12, -206, 5, 8.2, true], [90, -156, 5, 9.1, true], [-12, -104, 4, 10.3, true], [-60, -286, 4, 10.9, true]);
    }
    if (phase >= 2) {
        eyeSpots.push([-106, -156, 5, 11.1, true], [64, -226, 4, 12.2, true], [30, -100, 4, 13.4, true], [-48, -196, 4, 14.6, true], [78, -122, 4, 15.2, true]);
    }
    for (const [ex, ey, er, seed, angry] of eyeSpots) {
        const isCentral = ex === 0 && er === 13;
        colossusEye(ctx, ex, ey, er, isCentral ? glowColor : eyeColor, time, seed, {
            angry,
            glow: 1.15 + phase * 0.1,
        });
        // Pálpebra pesada para tirar a leitura "fofa".
        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(-0.24);
        ctx.fillStyle = 'rgba(6,3,9,0.92)';
        ctx.beginPath();
        ctx.moveTo(-er * 1.62, -er * 1.35);
        ctx.lineTo(er * 1.62, -er * 1.05);
        ctx.lineTo(er * 1.45, -er * 0.3);
        ctx.quadraticCurveTo(0, -er * 0.72, -er * 1.5, -er * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = hexToRgba(isCentral ? glowColor : accent, 0.3);
        ctx.lineWidth = Math.max(0.8, er * 0.12);
        ctx.beginPath();
        ctx.moveTo(-er * 1.5, -er * 0.45);
        ctx.quadraticCurveTo(0, -er * 0.72, er * 1.45, -er * 0.3);
        ctx.stroke();
        ctx.restore();
    }
    // Boca: horizonte de eventos com mandíbulas e disco de acreção.
    const mx = 0;
    const my = -170;
    const openW = 60 + compress * 16;
    const openH = 36 + compress * 11;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = hexToRgba(i % 2 === 0 ? glowColor : accent, 0.5 - i * 0.1);
        ctx.lineWidth = 3 - i * 0.5;
        ctx.beginPath();
        ctx.ellipse(mx, my, openW + i * 15, openH + i * 7, 0.12 + time * 0.07 * (i % 2 === 0 ? 1 : -1), 0, TAU);
        ctx.stroke();
    }
    ctx.restore();
    const hole = ctx.createRadialGradient(mx, my, 1, mx, my, 68 + compress * 18);
    hole.addColorStop(0, '#000000');
    hole.addColorStop(0.5, '#040108');
    hole.addColorStop(0.78, hexToRgba(dark, 0.9));
    hole.addColorStop(1, hexToRgba(accent, 0));
    ctx.fillStyle = hole;
    ctx.beginPath();
    ctx.ellipse(mx, my, openW, openH, 0, 0, TAU);
    ctx.fill();
    // Dentes externos, longos e irregulares.
    for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU + time * 0.08;
        const bx = mx + Math.cos(a) * openW;
        const by = my + Math.sin(a) * openH;
        const tx = mx + Math.cos(a) * (openW - 19);
        const ty = my + Math.sin(a) * (openH - 11);
        ctx.fillStyle = i % 4 === 0 ? '#ff8ae2' : 'rgba(232,216,176,0.92)';
        ctx.beginPath();
        ctx.moveTo(bx + Math.cos(a + 1.2) * 6, by + Math.sin(a + 1.2) * 6);
        ctx.lineTo(tx, ty);
        ctx.lineTo(bx + Math.cos(a - 1.2) * 6, by + Math.sin(a - 1.2) * 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(20,8,16,0.6)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
    }
    // Segunda fileira de dentes.
    for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU - time * 0.05 + 0.3;
        const rx = 42 + compress * 10;
        const ry = openH * 0.62;
        const bx = mx + Math.cos(a) * rx;
        const by = my + Math.sin(a) * ry;
        const tx = mx + Math.cos(a) * (rx - 10);
        const ty = my + Math.sin(a) * (ry - 6);
        ctx.fillStyle = 'rgba(200,170,150,0.75)';
        ctx.beginPath();
        ctx.moveTo(bx + Math.cos(a + 1.2) * 3, by + Math.sin(a + 1.2) * 3);
        ctx.lineTo(tx, ty);
        ctx.lineTo(bx + Math.cos(a - 1.2) * 3, by + Math.sin(a - 1.2) * 3);
        ctx.closePath();
        ctx.fill();
    }
    // Tentáculos da garganta.
    for (let i = 0; i < 4; i++) {
        const a = -Math.PI / 2 + (i - 1.5) * 0.55;
        const len = 18 + Math.sin(time * 2 + i) * 6 + windup * 26;
        ctx.strokeStyle = 'rgba(8,3,12,0.92)';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(mx + Math.cos(a) * 10, my + Math.sin(a) * 6);
        ctx.quadraticCurveTo(mx + Math.cos(a) * len * 0.7 + Math.sin(time * 3 + i) * 8, my + Math.sin(a) * len * 0.7, mx + Math.cos(a) * len, my + Math.sin(a) * len * 1.1);
        ctx.stroke();
        ctx.strokeStyle = hexToRgba(accent, 0.35);
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }
    // Gotas de vazio.
    for (let i = 0; i < 4; i++) {
        const t = (time * 0.5 + i * 0.27) % 1;
        const px = mx - 42 + i * 28;
        const py = my + openH * 0.8 + t * 74;
        ctx.fillStyle = hexToRgba(accent, (1 - t) * 0.35);
        ctx.beginPath();
        ctx.ellipse(px, py, 1.6, 3.5, 0, 0, TAU);
        ctx.fill();
    }
    // Núcleo pulsante.
    const coreScale = 1 + Math.sin(time * 3) * 0.08 + compress * 0.2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const core = ctx.createRadialGradient(mx, my, 0, mx, my, 52 * coreScale);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.22, glowColor);
    core.addColorStop(0.55, hexToRgba(accent, 0.55));
    core.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(mx, my, 52 * coreScale, 0, TAU);
    ctx.fill();
    ctx.restore();
    // Orbes do vazio / ecos chamados.
    if (isOrbs) {
        const p = b.state === 'windup' ? windup : b.state === 'execute' ? 1 : recover;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const count = attack === 'summonEchoes' ? 6 : 5;
        for (let i = 0; i < count; i++) {
            const a = time * 0.8 + (i / count) * TAU;
            const rr = 94 + Math.sin(time * 1.4 + i) * 12;
            const px = Math.cos(a) * rr;
            const py = -172 + Math.sin(a) * rr * 0.6;
            const og = ctx.createRadialGradient(px, py, 1, px, py, 16);
            og.addColorStop(0, '#ffffff');
            og.addColorStop(0.35, attack === 'summonEchoes' ? accent : eyeColor);
            og.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = og;
            ctx.beginPath();
            ctx.arc(px, py, 16, 0, TAU);
            ctx.fill();
            if (attack === 'summonEchoes') {
                ctx.strokeStyle = hexToRgba(accent, 0.4 * p);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(px, py, 10, 0, TAU);
                ctx.stroke();
            }
        }
        ctx.restore();
    }
    // Julgamento final: o Véu se abre.
    if (isJudgment) {
        const p = b.state === 'windup' ? windup : b.state === 'execute' ? 1 : recover;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = p * (0.4 + Math.sin(time * 8) * 0.15);
        for (let i = 0; i < 16; i++) {
            const a = (i / 16) * TAU + time * 0.2;
            ctx.strokeStyle = hexToRgba(i % 2 === 0 ? '#ffffff' : accent, 0.35);
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 70, -170 + Math.sin(a) * 46);
            ctx.lineTo(Math.cos(a) * 240, -170 + Math.sin(a) * 160);
            ctx.stroke();
        }
        ctx.restore();
    }
    // Fase 3: rachaduras na realidade.
    if (phase >= 2) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = hexToRgba('#ff8ae2', 0.2 + Math.sin(time * 3) * 0.06);
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 9; i++) {
            const a = (i / 9) * TAU + 0.3;
            const points = [];
            for (let k = 0; k < 4; k++) {
                const r = 120 + k * 34;
                const jitter = Math.sin(time * 2 + i * 3 + k) * 8;
                points.push([Math.cos(a) * r + jitter, -170 + Math.sin(a) * r * 0.7 + jitter * 0.5]);
            }
            ctx.beginPath();
            points.forEach(([x, y], k) => (k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
            ctx.stroke();
        }
        ctx.restore();
    }
    // Detritos planetários orbitando.
    if (phase >= 1) {
        ctx.save();
        for (let i = 0; i < 5; i++) {
            const a = time * 0.22 + i * 1.3;
            const rr = 150 + (i % 3) * 22;
            const px = Math.cos(a) * rr;
            const py = -190 + Math.sin(a) * rr * 0.42;
            ctx.fillStyle = 'rgba(30,20,38,0.95)';
            ctx.beginPath();
            ctx.arc(px, py, 4 + (i % 2) * 2, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = hexToRgba(accent, 0.35);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(px, py, 9 + (i % 3) * 3, 2.4, a + 0.6, 0, TAU);
            ctx.stroke();
        }
        ctx.restore();
    }
    ctx.restore();
}
//# sourceMappingURL=enemies.js.map