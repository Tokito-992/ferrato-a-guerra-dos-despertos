/** Ilustração procedural dos seis Despertos (corpo inteiro, retratos e poses). */

import { clamp, easeInCubic, easeOutCubic, hexToRgba, lerp, mixColor, TAU } from '../core/math.js';
import type { CharacterDef } from '../data/characters.js';
import { CHARACTERS } from '../data/characters.js';
import type { Player } from '../entities/player.js';
import { glow, joint, limb, roundRectPath } from './theme.js';

interface Build {
  bob: number;
  lean: number;
  crouch: number;
  armFront: number;
  armFrontElbow: number;
  armBack: number;
  armBackElbow: number;
  legFront: number;
  legFrontKnee: number;
  legBack: number;
  legBackKnee: number;
  headTilt: number;
  weaponA: number;
  weaponGrip: number;
  bodyRot: number;
  alpha: number;
  airborne: boolean;
}

const BASE: Build = {
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

function playerBuild(p: Player, time: number): Build {
  const b: Build = { ...BASE };
  const weapon = p.def.weapon;
  b.alpha = p.dead ? clamp(1 - p.deathTimer / 1.4, 0, 1) : 1;
  if (p.dead) {
    b.bodyRot = -Math.min(1.45, p.deathTimer * 2.2);
    b.armFront = 1.4;
    b.armBack = 1.1;
    b.legFront = 0.5;
    b.legBack = -0.3;
    b.bob = Math.min(6, p.deathTimer * 10);
    if (weapon === 'scythe') b.weaponA = -2.1;
    else if (weapon === 'sword') b.weaponA = -1.9;
    else if (weapon === 'blades') b.weaponA = -1.5;
    return b;
  }
  if (p.attack) {
    const a = p.attack;
    const d = a.def;
    const t = a.t;
    b.airborne = !p.onGround;
    let sweep = 0;
    if (t < d.startup) sweep = -easeOutCubic(t / Math.max(0.001, d.startup));
    else if (t < d.startup + d.active) sweep = lerp(-1, 1, easeOutCubic((t - d.startup) / Math.max(0.001, d.active)));
    else sweep = 1 - easeInCubic((t - d.startup - d.active) / Math.max(0.001, d.recovery));
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
    if (weapon === 'scythe') b.weaponA = -2.1;
    else if (weapon === 'sword') b.weaponA = -1.9;
    else if (weapon === 'blades') b.weaponA = -1.5;
    return b;
  }
  if (p.state === 'hurt') {
    b.lean = -0.28;
    b.armFront = 1.5;
    b.armBack = 1.9;
    b.headTilt = -0.2;
    b.legFront = 0.25;
    b.legBack = -0.35;
    if (weapon === 'scythe') b.weaponA = -2.1;
    else if (weapon === 'sword') b.weaponA = -1.9;
    else if (weapon === 'blades') b.weaponA = -1.5;
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
    if (weapon === 'scythe') b.weaponA = rising ? -2.3 : -2.2;
    else if (weapon === 'sword') b.weaponA = rising ? -2.1 : -2.0;
    else if (weapon === 'blades') b.weaponA = rising ? -1.7 : -1.6;
    else b.weaponA = rising ? -1.4 : -0.9;
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
    if (weapon === 'scythe') b.weaponA = -2.2 + cycle * 0.06;
    else if (weapon === 'sword') b.weaponA = -2.0 + cycle * 0.05;
    else if (weapon === 'blades') b.weaponA = -1.6 + cycle * 0.05;
    else b.weaponA = -0.7 + cycle * 0.15;
    return b;
  }
  // idle
  b.bob = Math.sin(time * 2.1 + p.animTime * 0.2) * 1.4;
  b.lean = 0.04 + Math.sin(time * 1.4) * 0.012;
  b.armFront = 0.22 + Math.sin(time * 1.7) * 0.05;
  b.armBack = -0.18 - Math.sin(time * 1.6) * 0.05;
  if (weapon === 'scythe') b.weaponA = -2.2;
  else if (weapon === 'sword') b.weaponA = -2.0;
  else if (weapon === 'blades') b.weaponA = -1.6;
  else b.weaponA = -0.3;
  return b;
}

function tint(color: string, flash: number): string {
  return flash > 0 ? mixColor(color, '#ffffff', clamp(flash * 4.5, 0, 0.88)) : color;
}

interface Point {
  x: number;
  y: number;
}

/** Membro com contorno, volume cilíndrico e brilho direcional. */
function limbShaded(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  base: string,
): void {
  limb(ctx, x1, y1, x2, y2, width + 1.8, 'rgba(6, 5, 10, 0.55)');
  limb(ctx, x1, y1, x2, y2, width, base);
  const ox = width * 0.16;
  const oy = -width * 0.16;
  limb(ctx, x1 + ox, y1 + oy, x2 + ox, y2 + oy, Math.max(1.2, width * 0.3), mixColor(base, '#ffffff', 0.34));
}

/** Faixa curta atravessando um membro (tiras, munhequeiras, ligas). */
function limbBand(
  ctx: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  t: number,
  color: string,
  width: number,
): void {
  const px = lerp(a.x, b.x, t);
  const py = lerp(a.y, b.y, t);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const half = width * 0.58;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(px - nx * half, py - ny * half);
  ctx.lineTo(px + nx * half, py + ny * half);
  ctx.stroke();
}

/** Bota em camadas: cano, bico, sola e costuras. */
function drawBoot(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  foot: Point,
  size: number,
  back: boolean,
  flash: number,
): void {
  const c = def.colors;
  const x = foot.x;
  const y = foot.y;
  const w = size;
  const outline = 'rgba(6, 5, 10, 0.9)';
  const leather = tint(mixColor(c.secondary, back ? '#000000' : '#ffffff', back ? 0.28 : 0.08), flash);
  const toe = tint(mixColor(c.secondary, '#ffffff', back ? 0.1 : 0.24), flash);
  const sole = tint('#08070c', flash);
  const cuff = tint(mixColor(c.secondary, '#000000', 0.42), flash);

  ctx.save();
  if (back) ctx.globalAlpha *= 0.92;

  // Cano.
  ctx.fillStyle = cuff;
  roundRectPath(ctx, x - w * 0.4, y - 9.2, w * 0.46, 5, 1.8);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Corpo da bota.
  ctx.fillStyle = leather;
  roundRectPath(ctx, x - w * 0.42, y - 6.8, w * 0.98, 8.2, 3);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Bico reforçado.
  ctx.fillStyle = toe;
  roundRectPath(ctx, x + w * 0.16, y - 5.2, w * 0.44, 5.8, 2.2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Sola.
  ctx.fillStyle = sole;
  roundRectPath(ctx, x - w * 0.46, y + 0.7, w * 1.06, 3.2, 1.4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.38, y + 1.1);
  ctx.lineTo(x + w * 0.48, y + 1.1);
  ctx.stroke();

  // Brilho no peito do pé.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.3, y - 5.4);
  ctx.quadraticCurveTo(x + w * 0.02, y - 6.4, x + w * 0.2, y - 5.2);
  ctx.stroke();

  // Costura.
  ctx.strokeStyle = hexToRgba(c.accent, 0.55);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.18, y - 5.2);
  ctx.lineTo(x + w * 0.12, y - 5.2);
  ctx.stroke();

  // Assinatura de cada Desperto.
  switch (def.id) {
    case 'ravi':
      ctx.strokeStyle = hexToRgba(c.accent, 0.9);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.34, y + 2.4);
      ctx.lineTo(x + w * 0.44, y + 2.4);
      ctx.stroke();
      ctx.fillStyle = hexToRgba(c.accent, 0.8);
      ctx.beginPath();
      ctx.arc(x + w * 0.46, y - 2.6, 1.2, 0, TAU);
      ctx.fill();
      break;
    case 'miriam':
      ctx.fillStyle = tint('#6a5548', flash);
      roundRectPath(ctx, x - w * 0.1, y - 8.4, w * 0.5, 4.2, 1.4);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(c.accent, 0.85);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.02, y - 6.3);
      ctx.lineTo(x + w * 0.32, y - 6.3);
      ctx.stroke();
      break;
    case 'kael':
      ctx.strokeStyle = hexToRgba(c.accent, 0.6);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x + w * 0.08, y + 2.2, w * 0.5, 1.6, 0, 0, TAU);
      ctx.stroke();
      break;
    case 'ozric':
      ctx.strokeStyle = hexToRgba('#ff3357', 0.75);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.3, y - 0.2);
      ctx.lineTo(x + w * 0.2, y - 0.2);
      ctx.stroke();
      break;
    case 'elodie':
      ctx.strokeStyle = hexToRgba(c.secondary, 0.95);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.28, y - 6.1);
      ctx.lineTo(x + w * 0.18, y - 6.1);
      ctx.stroke();
      break;
    case 'thryc':
      ctx.fillStyle = hexToRgba(c.accent, 0.75);
      ctx.fillRect(x - w * 0.1, y - 3.2, 1.3, 1.3);
      ctx.fillRect(x + w * 0.18, y + 0.4, 1.1, 1.1);
      break;
  }
  ctx.restore();
}

/** Punho detalhado, com luvas, nós dos dedos, polegar e brilho. */
function drawFist(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  x: number,
  y: number,
  radius: number,
  front: boolean,
  time: number,
  flash: number,
): void {
  const c = def.colors;
  const skin = tint(c.skin, flash);
  const glove = tint(mixColor(c.secondary, '#000000', 0.15), flash);
  const gloveLight = tint(mixColor(c.secondary, '#ffffff', 0.24), flash);
  const accent = tint(c.accent, flash);
  const outline = 'rgba(6, 5, 10, 0.92)';
  const r = radius * (front ? 1 : 0.9);

  ctx.save();
  ctx.translate(x, y);
  if (!front) ctx.globalAlpha *= 0.92;

  // Munhequeira.
  ctx.fillStyle = glove;
  roundRectPath(ctx, -r * 1.35, -r * 0.58, r * 0.8, r * 1.16, r * 0.26);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.strokeStyle = hexToRgba(accent, 0.8);
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-r * 1.24, -r * 0.28);
  ctx.lineTo(-r * 0.72, -r * 0.2);
  ctx.moveTo(-r * 1.24, r * 0.26);
  ctx.lineTo(-r * 0.72, r * 0.18);
  ctx.stroke();

  // Dorso da mão enluvado.
  ctx.fillStyle = glove;
  roundRectPath(ctx, -r * 0.72, -r * 0.82, r * 1.45, r * 1.64, r * 0.4);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Pele / couro interno.
  ctx.fillStyle = skin;
  roundRectPath(ctx, -r * 0.46, -r * 0.64, r * 1.02, r * 1.28, r * 0.28);
  ctx.fill();

  // Placa de nós dos dedos.
  ctx.fillStyle = gloveLight;
  roundRectPath(ctx, r * 0.34, -r * 0.72, r * 0.52, r * 1.44, r * 0.2);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Três nós.
  for (let i = 0; i < 3; i++) {
    const ky = -r * 0.42 + i * r * 0.42;
    ctx.beginPath();
    ctx.arc(r * 0.72, ky, r * 0.15, 0, TAU);
    ctx.fillStyle = skin;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  // Sulcos dos dedos.
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.lineWidth = 0.7;
  for (let i = 0; i < 2; i++) {
    const ky = -r * 0.21 + i * r * 0.42;
    ctx.beginPath();
    ctx.moveTo(r * 0.34, ky);
    ctx.lineTo(r * 0.86, ky);
    ctx.stroke();
  }

  // Polegar.
  ctx.beginPath();
  ctx.ellipse(r * 0.24, -r * 0.78, r * 0.38, r * 0.2, -0.5, 0, TAU);
  ctx.fillStyle = skin;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Brilho.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = Math.max(0.8, r * 0.14);
  ctx.beginPath();
  ctx.arc(-r * 0.08, -r * 0.08, r * 0.6, Math.PI * 1.1, Math.PI * 1.55);
  ctx.stroke();

  // Assinatura de cada Desperto.
  switch (def.id) {
    case 'ravi': {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(r * 0.36, -r * 0.62);
      ctx.lineTo(r * 0.82, -r * 0.55);
      ctx.stroke();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = hexToRgba(accent, 0.8);
      ctx.lineWidth = 0.8;
      const a = time * 9;
      ctx.beginPath();
      ctx.moveTo(-r * 0.4 + Math.sin(a) * 2, -r * 0.4);
      ctx.lineTo(r * 0.2, r * 0.2 + Math.cos(a) * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'kael': {
      ctx.strokeStyle = hexToRgba(accent, 0.8);
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.25, -0.5, 0.9);
      ctx.stroke();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = hexToRgba(accent, 0.55);
      ctx.beginPath();
      ctx.arc(r * 0.2, -r * 0.1, r * 0.22, 0, TAU);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'ozric': {
      ctx.fillStyle = tint('#1a1018', flash);
      for (let i = 0; i < 3; i++) {
        const ky = -r * 0.42 + i * r * 0.42;
        ctx.beginPath();
        ctx.moveTo(r * 0.82, ky - r * 0.12);
        ctx.lineTo(r * 1.18, ky);
        ctx.lineTo(r * 0.82, ky + r * 0.12);
        ctx.closePath();
        ctx.fill();
      }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = hexToRgba('#ff3357', 0.7);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-r * 0.2, r * 0.5);
      ctx.lineTo(r * 0.4, r * 0.1);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'elodie': {
      ctx.strokeStyle = hexToRgba(c.secondary, 0.95);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-r * 1.1, -r * 0.38);
      ctx.lineTo(-r * 0.72, -r * 0.3);
      ctx.moveTo(-r * 1.1, r * 0.34);
      ctx.lineTo(-r * 0.72, r * 0.26);
      ctx.stroke();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255, 244, 205, 0.4)';
      ctx.beginPath();
      ctx.arc(r * 0.1, 0, r * 0.82, 0, TAU);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'thryc': {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.4);
      g.addColorStop(0, 'rgba(180, 139, 255, 0.45)');
      g.addColorStop(1, 'rgba(111, 242, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(r * 0.2, -r * 0.2, 1.1, 1.1);
      ctx.fillRect(-r * 0.3, r * 0.3, 0.9, 0.9);
      ctx.restore();
      break;
    }
  }
  ctx.restore();
}

/** Manopla blindada da Miriam: placas, rebites e rachaduras de magma. */
function drawGauntlet(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  x: number,
  y: number,
  radius: number,
  front: boolean,
  time: number,
  flash: number,
): void {
  const c = def.colors;
  const metal = tint('#3b2a26', flash);
  const metalLight = tint('#6a5548', flash);
  const metalDark = tint('#241a18', flash);
  const accent = tint(c.accent, flash);
  const outline = 'rgba(6, 5, 10, 0.92)';
  const r = radius * (front ? 1 : 0.92);

  ctx.save();
  ctx.translate(x, y);
  if (!front) ctx.globalAlpha *= 0.9;

  // Munhequeira e braçadeira.
  ctx.fillStyle = metalDark;
  roundRectPath(ctx, -r * 1.3, -r * 0.62, r * 0.72, r * 1.24, r * 0.24);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.fillStyle = metal;
  roundRectPath(ctx, -r * 1.12, -r * 0.7, r * 0.58, r * 1.4, r * 0.2);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.strokeStyle = hexToRgba(accent, 0.85);
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 2; i++) {
    const oy = -r * 0.24 + i * r * 0.48;
    ctx.beginPath();
    ctx.moveTo(-r * 1.04, oy);
    ctx.lineTo(-r * 0.7, oy - r * 0.06);
    ctx.stroke();
  }

  // Corpo da manopla, mais largo nas falanges.
  const bodyGrad = ctx.createLinearGradient(-r * 0.8, -r * 0.6, r * 0.8, r * 0.6);
  bodyGrad.addColorStop(0, metalDark);
  bodyGrad.addColorStop(0.45, metal);
  bodyGrad.addColorStop(1, metalLight);
  ctx.beginPath();
  ctx.moveTo(-r * 0.72, -r * 0.62);
  ctx.lineTo(r * 0.42, -r * 0.78);
  ctx.quadraticCurveTo(r * 0.92, -r * 0.72, r * 0.92, -r * 0.28);
  ctx.lineTo(r * 0.92, r * 0.28);
  ctx.quadraticCurveTo(r * 0.92, r * 0.72, r * 0.42, r * 0.78);
  ctx.lineTo(-r * 0.72, r * 0.62);
  ctx.quadraticCurveTo(-r * 0.88, r * 0.2, -r * 0.88, -r * 0.2);
  ctx.closePath();
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Placa superior.
  ctx.fillStyle = metalLight;
  ctx.beginPath();
  ctx.moveTo(-r * 0.58, -r * 0.5);
  ctx.lineTo(r * 0.35, -r * 0.64);
  ctx.quadraticCurveTo(r * 0.7, -r * 0.58, r * 0.7, -r * 0.26);
  ctx.lineTo(r * 0.1, -r * 0.18);
  ctx.lineTo(-r * 0.58, -r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Placas das falanges.
  for (let i = 0; i < 3; i++) {
    const ky = -r * 0.52 + i * r * 0.52;
    ctx.fillStyle = metalLight;
    roundRectPath(ctx, r * 0.58, ky - r * 0.16, r * 0.34, r * 0.32, r * 0.1);
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.fillStyle = hexToRgba(accent, 0.85);
    ctx.beginPath();
    ctx.arc(r * 0.75, ky, r * 0.05, 0, TAU);
    ctx.fill();
  }

  // Placa do polegar.
  ctx.fillStyle = metalLight;
  roundRectPath(ctx, -r * 0.05, -r * 0.88, r * 0.45, r * 0.24, r * 0.1);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Rachaduras incandescentes.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = hexToRgba(accent, 0.85);
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.2, -r * 0.62);
  ctx.lineTo(r * 0.05, -r * 0.26);
  ctx.lineTo(-r * 0.08, r * 0.05);
  ctx.lineTo(r * 0.2, r * 0.42);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 235, 190, 0.7)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(r * 0.1, -r * 0.1);
  ctx.lineTo(r * 0.42, r * 0.12);
  ctx.stroke();
  ctx.restore();

  // Rebites.
  ctx.fillStyle = tint('#8a7360', flash);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(-r * 0.5, -r * 0.42 + i * r * 0.42, r * 0.06, 0, TAU);
    ctx.fill();
  }

  // Brilho metálico.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = Math.max(0.9, r * 0.11);
  ctx.beginPath();
  ctx.arc(-r * 0.02, -r * 0.08, r * 0.68, Math.PI * 1.08, Math.PI * 1.52);
  ctx.stroke();

  // Pulso de calor.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(r * 0.35, 0, 0, r * 0.35, 0, r * 1.6);
  g.addColorStop(0, hexToRgba(accent, 0.18 + Math.sin(time * 4) * 0.05));
  g.addColorStop(1, hexToRgba(accent, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(r * 0.35, 0, r * 1.6, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/** Ombreira específica de cada Desperto. */
function drawPauldron(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  sx: number,
  sy: number,
  time: number,
  flash: number,
  front: boolean,
): void {
  const c = def.colors;
  const outline = 'rgba(6, 5, 10, 0.88)';
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(front ? 1 : -1, 1);
  if (!front) ctx.globalAlpha *= 0.82;

  switch (def.id) {
    case 'ravi': {
      ctx.fillStyle = tint(c.primary, flash);
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.quadraticCurveTo(0, -8, 7, -3);
      ctx.lineTo(6, 3);
      ctx.quadraticCurveTo(0, 6, -6, 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.fillStyle = tint(c.secondary, flash);
      roundRectPath(ctx, -4, -2, 9, 2, 1);
      ctx.fill();
      ctx.fillStyle = tint(c.accent, flash);
      ctx.beginPath();
      ctx.arc(4, 1.5, 1.1, 0, TAU);
      ctx.fill();
      break;
    }
    case 'miriam': {
      ctx.fillStyle = tint('#2c1f1c', flash);
      ctx.beginPath();
      ctx.moveTo(-8, -2);
      ctx.quadraticCurveTo(-2, -10, 9, -5);
      ctx.lineTo(8, 4);
      ctx.quadraticCurveTo(0, 8, -8, 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = tint('#4a342d', flash);
      roundRectPath(ctx, -5, -6, 11, 4, 2);
      ctx.fill();
      ctx.strokeStyle = tint(c.accent, flash);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-6, 1);
      ctx.lineTo(7, 2);
      ctx.stroke();
      ctx.fillStyle = tint('#ffcf9a', flash);
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.arc(-3 + i * 7, -3, 0.9, 0, TAU);
        ctx.fill();
      }
      break;
    }
    case 'kael': {
      ctx.fillStyle = tint(c.secondary, flash);
      ctx.beginPath();
      ctx.moveTo(-7, -3);
      ctx.lineTo(7, -5);
      ctx.lineTo(8, 1);
      ctx.lineTo(2, 5);
      ctx.lineTo(-5, 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = hexToRgba(c.accent, 0.85);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-5, -2);
      ctx.lineTo(6, -3.5);
      ctx.stroke();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = hexToRgba(c.accent, 0.55);
      const lift = Math.sin(time * 2.4) * 1.5;
      ctx.beginPath();
      ctx.moveTo(9, -5 + lift);
      ctx.lineTo(12, -1 + lift);
      ctx.lineTo(9, 2 + lift);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'ozric': {
      ctx.fillStyle = tint('#1a0b12', flash);
      ctx.beginPath();
      ctx.moveTo(-7, -1);
      ctx.lineTo(-3, -8);
      ctx.lineTo(1, -2);
      ctx.lineTo(7, -7);
      ctx.lineTo(9, 2);
      ctx.lineTo(4, 6);
      ctx.lineTo(-5, 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = tint('#5e1a26', flash);
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.strokeStyle = hexToRgba('#ff3357', 0.65);
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-4, 2);
      ctx.lineTo(6, 1);
      ctx.stroke();
      break;
    }
    case 'elodie': {
      ctx.fillStyle = tint('#fff2cc', flash);
      ctx.beginPath();
      ctx.moveTo(-6, -2);
      ctx.quadraticCurveTo(0, -9, 8, -4);
      ctx.lineTo(7, 3);
      ctx.quadraticCurveTo(0, 6, -6, 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = tint(c.secondary, flash);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-4, -1);
      ctx.quadraticCurveTo(1, -5, 6, -3);
      ctx.stroke();
      ctx.strokeStyle = tint(c.secondary, flash);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-3, 1);
      ctx.lineTo(5, 0);
      ctx.stroke();
      break;
    }
    case 'thryc': {
      const g = ctx.createLinearGradient(-8, -8, 8, 6);
      g.addColorStop(0, 'rgba(111, 242, 255, 0.75)');
      g.addColorStop(0.5, 'rgba(180, 139, 255, 0.8)');
      g.addColorStop(1, 'rgba(255, 138, 226, 0.6)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-6, 3);
      ctx.lineTo(-2, -7);
      ctx.lineTo(3, -3);
      ctx.lineTo(8, -6);
      ctx.lineTo(9, 2);
      ctx.lineTo(2, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(230, 220, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, -2, 1.1, 1.1);
      ctx.fillRect(4, 1, 1, 1);
      ctx.restore();
      break;
    }
  }
  ctx.restore();
}

/** Joelheira com placa, costura e detalhe luminoso. */
function drawKneeGuard(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  knee: Point,
  flash: number,
  front: boolean,
): void {
  const c = def.colors;
  ctx.save();
  ctx.translate(knee.x, knee.y);
  ctx.scale(front ? 1 : -1, 1);
  if (!front) ctx.globalAlpha *= 0.7;

  const base = def.id === 'miriam' ? '#3a2a22' : mixColor(c.secondary, '#000000', 0.25);
  ctx.fillStyle = tint(base, flash);
  ctx.beginPath();
  ctx.ellipse(0, 0, 5.4, 4.4, 0.1, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(6, 5, 10, 0.85)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.strokeStyle = hexToRgba(c.accent, def.id === 'elodie' ? 0.9 : 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-3, -1);
  ctx.lineTo(3, 1);
  ctx.stroke();

  if (def.id === 'miriam') {
    ctx.fillStyle = tint('#6a5548', flash);
    roundRectPath(ctx, -4, -3, 8, 2, 1);
    ctx.fill();
  } else if (def.id === 'kael') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = hexToRgba(c.accent, 0.7);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 5, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  } else if (def.id === 'thryc') {
    ctx.fillStyle = hexToRgba(c.accent, 0.6);
    ctx.fillRect(-2, -2, 1, 1);
    ctx.fillRect(2, 1, 1, 1);
  }
  ctx.restore();
}

/** Pescoço e gola, preenchendo a silhueta entre tronco e cabeça. */
function drawNeck(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  neckX: number,
  chestY: number,
  headY: number,
  flash: number,
): void {
  const c = def.colors;
  const skin = tint(c.skin, flash);
  const shadow = tint(mixColor(c.skin, '#000000', 0.3), flash);

  ctx.fillStyle = skin;
  roundRectPath(ctx, neckX - 4.6, headY + 7, 9.2, chestY - 2 - (headY + 7), 3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(6, 5, 10, 0.7)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = hexToRgba(shadow, 0.55);
  roundRectPath(ctx, neckX - 4.6, headY + 7, 9.2, 4, 2);
  ctx.fill();

  // Gola.
  ctx.fillStyle = tint(mixColor(c.secondary, '#000000', 0.35), flash);
  ctx.beginPath();
  ctx.moveTo(neckX - 7, chestY - 2);
  ctx.quadraticCurveTo(neckX, chestY + 3, neckX + 7, chestY - 2);
  ctx.lineTo(neckX + 6, chestY + 3);
  ctx.quadraticCurveTo(neckX, chestY + 7, neckX - 6, chestY + 3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = hexToRgba(c.accent, 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(neckX - 5, chestY + 1);
  ctx.quadraticCurveTo(neckX, chestY + 4, neckX + 5, chestY + 1);
  ctx.stroke();
}

/** Desenha o corpo inteiro de um personagem, com origem nos pés. */
export function drawCharacterFigure(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  x: number,
  y: number,
  facing: 1 | -1,
  scale: number,
  time: number,
  build: Build,
  flash = 0,
): void {
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
  limbShaded(ctx, hipB.x, hipB.y, kneeB.x, kneeB.y, isWide ? 13 : 10, dark);
  limbShaded(ctx, kneeB.x, kneeB.y, footB.x, footB.y, isWide ? 12 : 9, secondary);
  drawKneeGuard(ctx, def, kneeB, flash, false);
  drawBoot(ctx, def, footB, isWide ? 16 : 13, true, flash);

  limbShaded(ctx, shoulderB.x, shoulderB.y, elbowB.x, elbowB.y, isSlim ? 7 : 9, dark);
  limbShaded(ctx, elbowB.x, elbowB.y, handB.x, handB.y, isSlim ? 6 : 8, secondary);
  limbBand(ctx, shoulderB, elbowB, 0.55, hexToRgba(accent, 0.45), isSlim ? 7 : 9);
  if (def.weapon === 'gauntlets') {
    drawGauntlet(ctx, def, handB.x, handB.y, 8.4, false, time, flash);
  } else {
    drawFist(ctx, def, handB.x, handB.y, isSlim ? 4.4 : 5.4, false, time, flash);
  }
  drawPauldron(ctx, def, shoulderB.x, shoulderB.y - 1, time, flash, false);

  // Mochila, tanque, asa quebrada ou halo: assinatura visual de cada Desperto.
  drawBackAccessory(ctx, def, chestX, chestY, hipY, time, flash, build);

  // Capa / sobretudo de Ozric.
  if (def.id === 'ozric') {
    const flap = Math.sin(time * 2.4) * 6;
    const capeGrad = ctx.createLinearGradient(chestX - 20, chestY, hipX - 20, hipY + 44);
    capeGrad.addColorStop(0, tint('#241018', flash));
    capeGrad.addColorStop(0.55, tint('#170b12', flash));
    capeGrad.addColorStop(1, tint('#2a0b14', flash));
    ctx.beginPath();
    ctx.moveTo(chestX - 10, chestY - 4);
    ctx.quadraticCurveTo(chestX - 26 - flap, hipY + 20, hipX - 20 - flap * 0.4, hipY + 44);
    ctx.quadraticCurveTo(hipX - 4, hipY + 26, hipX + 2, hipY + 12);
    ctx.closePath();
    ctx.fillStyle = capeGrad;
    ctx.fill();
    ctx.strokeStyle = tint('#4a1826', flash);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // Forro interno e dobras.
    ctx.strokeStyle = hexToRgba('#ff3357', 0.32);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chestX - 13, chestY + 2);
    ctx.quadraticCurveTo(chestX - 24 - flap, hipY + 18, hipX - 17 - flap * 0.35, hipY + 38);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chestX - 15, chestY + 6);
    ctx.quadraticCurveTo(chestX - 18 - flap * 0.5, hipY + 12, hipX - 10, hipY + 28);
    ctx.moveTo(chestX - 8, chestY + 10);
    ctx.quadraticCurveTo(chestX - 10, hipY + 4, hipX - 2, hipY + 20);
    ctx.stroke();
    // Barra esfarrapada.
    ctx.strokeStyle = tint('#3a1622', flash);
    ctx.beginPath();
    ctx.moveTo(hipX - 20 - flap * 0.4, hipY + 44);
    ctx.lineTo(hipX - 16, hipY + 39);
    ctx.lineTo(hipX - 13, hipY + 43);
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

  // Volume do traje: sombra lateral, brilho de peito e dobras.
  ctx.save();
  ctx.clip();
  const torsoShade = ctx.createLinearGradient(chestX - chestW, chestY, chestX + chestW, hipY);
  torsoShade.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
  torsoShade.addColorStop(0.4, 'rgba(0, 0, 0, 0.04)');
  torsoShade.addColorStop(0.72, 'rgba(255, 255, 255, 0.11)');
  torsoShade.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
  ctx.fillStyle = torsoShade;
  ctx.fillRect(chestX - chestW - 6, chestY - 12, chestW * 2 + 12, hipY - chestY + 24);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(chestX + 2, chestY + 5);
  ctx.quadraticCurveTo(chestX - 3, chestY + 16, hipX - 2, hipY - 2);
  ctx.moveTo(chestX - 6, chestY + 3);
  ctx.quadraticCurveTo(chestX - 9, chestY + 14, hipX - 7, hipY - 4);
  ctx.stroke();
  ctx.restore();

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
  } else if (def.id === 'miriam') {
    ctx.fillStyle = tint('#3a2a22', flash);
    roundRectPath(ctx, chestX - 14, chestY - 2, 28, 17, 5);
    ctx.fill();
    ctx.fillStyle = tint('#ff6a2b', flash);
    ctx.globalAlpha *= 0.8;
    ctx.beginPath();
    ctx.arc(chestX + 6, chestY + 8, 3, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = build.alpha;
  } else if (def.id === 'kael') {
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
  } else if (def.id === 'ozric') {
    ctx.strokeStyle = '#ff3357';
    ctx.lineWidth = 1;
    ctx.globalAlpha *= 0.7;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      ctx.moveTo(chestX - 8 + i * 7, chestY + 2);
      ctx.quadraticCurveTo(chestX - 4 + i * 6, chestY + 12, chestX - 7 + i * 7, hipY - 2);
    }
    ctx.stroke();
  } else if (def.id === 'elodie') {
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
  } else if (def.id === 'thryc') {
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

  // Cinto com fivela e bolsas.
  ctx.fillStyle = tint('#15121c', flash);
  roundRectPath(ctx, hipX - hipW - 2, hipY - 3.6, hipW * 2 + 4, 5.2, 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(6, 5, 10, 0.8)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = tint(mixColor(accent, '#ffffff', 0.1), flash);
  roundRectPath(ctx, hipX - 3, hipY - 3.4, 6, 4.8, 1.5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.fillStyle = tint(mixColor(secondary, '#000000', 0.25), flash);
  roundRectPath(ctx, hipX + hipW - 2, hipY + 1, 5.5, 7, 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  roundRectPath(ctx, hipX - hipW - 3, hipY + 1, 5, 6, 2);
  ctx.fill();
  ctx.stroke();

  // Perna dianteira.
  limbShaded(ctx, hipF.x, hipF.y, kneeF.x, kneeF.y, isWide ? 14 : 10.5, dark);
  limbShaded(ctx, kneeF.x, kneeF.y, footF.x, footF.y, isWide ? 13 : 9.5, secondary);
  limbBand(ctx, hipF, kneeF, 0.42, hexToRgba(accent, 0.4), isWide ? 14 : 10.5);
  drawKneeGuard(ctx, def, kneeF, flash, true);
  drawBoot(ctx, def, footF, isWide ? 18 : 14, false, flash);
  drawFootwear(ctx, def, footF, footB, time, flash);

  // Braço dianteiro.
  limbShaded(ctx, shoulderF.x, shoulderF.y, elbowF.x, elbowF.y, isSlim ? 7 : 9, dark);
  limbShaded(ctx, elbowF.x, elbowF.y, handF.x, handF.y, isSlim ? 6.2 : 8, secondary);
  limbBand(ctx, shoulderF, elbowF, 0.58, hexToRgba(accent, 0.5), isSlim ? 7 : 9);
  drawPauldron(ctx, def, shoulderF.x, shoulderF.y - 1, time, flash, true);

  // Pescoço e gola.
  drawNeck(ctx, def, neckX, chestY, headY, flash);

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

  // Orelha, sombra de mandíbula e maçã do rosto.
  ctx.fillStyle = tint(mixColor(c.skin, '#000000', 0.15), flash);
  ctx.beginPath();
  ctx.ellipse(-6.5, 0.5, 2.1, 3.1, -0.2, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.fillStyle = hexToRgba(mixColor(c.skin, '#000000', 0.35), 0.22);
  ctx.beginPath();
  ctx.ellipse(-2, 4, 6.5, 4.5, 0.15, 0, TAU);
  ctx.fill();

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
  } else if (def.id === 'kael') {
    ctx.fillStyle = '#56e3ff';
    ctx.fillRect(1.5, -3, 3, 2);
    ctx.fillStyle = '#b48bff';
    ctx.fillRect(-5, -3, 3, 2);
  } else {
    ctx.beginPath();
    ctx.arc(4.2, -2, 1.5, 0, TAU);
    ctx.fill();
  }

  // Nariz, boca, sobrancelha e brilho de rosto.
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(7.2, -1.2);
  ctx.lineTo(8.2, 1.6);
  ctx.lineTo(6.8, 2.2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(5.2, 4.6);
  ctx.lineTo(7.4, 4.4);
  ctx.stroke();
  ctx.strokeStyle = hexToRgba(mixColor(c.hair, '#000000', 0.2), 0.7);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(2.4, -4.6);
  ctx.lineTo(5.8, -4.2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(1, 1, 7, Math.PI * 1.2, Math.PI * 1.55);
  ctx.stroke();

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

  // Brilho no cabelo/elmo e luz de contorno.
  const hairSheen = mixColor(c.hair, '#ffffff', 0.55);
  ctx.strokeStyle = hexToRgba(hairSheen, def.id === 'thryc' ? 0.8 : 0.45);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(-1, -4, 7.2, Math.PI * 1.08, Math.PI * 1.52);
  ctx.stroke();
  ctx.strokeStyle = hexToRgba(c.accent, 0.3);
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(0, 0, isSlim ? 8 : 9, -0.55, 0.65);
  ctx.stroke();
  ctx.restore();

  // Arma (atrás da mão, para o punho envolvê-la). O corte no chão evita que
  // lâminas longas atravessem o piso durante golpes descendentes.
  const clipWeapon = !build.airborne && build.bodyRot === 0;
  if (clipWeapon) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-400, -600, 800, 600);
    ctx.clip();
  }
  drawWeapon(ctx, def, handF.x, handF.y, build, time, flash, accent);
  if (clipWeapon) ctx.restore();

  // Mão dianteira detalhada.
  if (def.weapon === 'gauntlets') {
    drawGauntlet(ctx, def, handF.x, handF.y, 8.4, true, time, flash);
  } else {
    drawFist(ctx, def, handF.x, handF.y, isSlim ? 4.4 : 5.4, true, time, flash);
  }

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
function drawBackAccessory(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  chestX: number,
  chestY: number,
  hipY: number,
  time: number,
  flash: number,
  build: Build,
): void {
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
function drawFootwear(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  footF: { x: number; y: number },
  footB: { x: number; y: number },
  time: number,
  flash: number,
): void {
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

function drawHeadwear(ctx: CanvasRenderingContext2D, def: CharacterDef, time: number, flash: number): void {
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

function drawWeapon(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  hx: number,
  hy: number,
  build: Build,
  time: number,
  flash: number,
  accent: string,
): void {
  const a = build.weaponA;
  const c = def.colors;
  switch (def.weapon) {
    case 'scythe': {
      const tip = joint(hx, hy, 104, a);
      const perp = { x: Math.cos(a), y: -Math.sin(a) };
      ctx.save();
      ctx.lineCap = 'round';

      // Haste com contorno, madeira e faixas de couro.
      ctx.strokeStyle = 'rgba(8, 5, 10, 0.9)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();
      const shaft = ctx.createLinearGradient(hx, hy, tip.x, tip.y);
      shaft.addColorStop(0, tint('#241820', flash));
      shaft.addColorStop(0.5, tint('#3a2028', flash));
      shaft.addColorStop(1, tint('#1a0e14', flash));
      ctx.strokeStyle = shaft;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();
      ctx.strokeStyle = tint('#5a2630', flash);
      ctx.lineWidth = 1.4;
      for (let i = 1; i <= 5; i++) {
        const t = i / 6;
        const px = lerp(hx, tip.x, t);
        const py = lerp(hy, tip.y, t);
        const half = 3.4;
        ctx.beginPath();
        ctx.moveTo(px - perp.x * half, py - perp.y * half);
        ctx.lineTo(px + perp.x * half, py + perp.y * half);
        ctx.stroke();
      }
      ctx.strokeStyle = hexToRgba('#ff3357', 0.25);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx + perp.x * 1.2, hy + perp.y * 1.2);
      ctx.lineTo(tip.x + perp.x * 1.2, tip.y + perp.y * 1.2);
      ctx.stroke();

      // Contrapeso.
      ctx.fillStyle = tint('#2a1a22', flash);
      ctx.beginPath();
      ctx.arc(hx - Math.sin(a) * 7, hy - Math.cos(a) * 7, 3.2, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = hexToRgba('#ff3357', 0.5);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Lâmina curva em forma preenchida.
      const bx = tip.x;
      const by = tip.y;
      const cx = tip.x + perp.x * 34 + 20;
      const cy = tip.y + perp.y * 34 - 22;
      const ex = tip.x + perp.x * 52 + 6;
      const ey = tip.y + perp.y * 52 + 14;
      const ix = tip.x + perp.x * 19 + 9;
      const iy = tip.y + perp.y * 19 - 2;
      const jx = tip.x + perp.x * 42 + 1;
      const jy = tip.y + perp.y * 42 + 16;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(cx, cy, ex, ey);
      ctx.quadraticCurveTo(jx, jy, ix, iy);
      ctx.quadraticCurveTo(bx + perp.x * 7, by + perp.y * 7, bx, by);
      ctx.closePath();
      const blade = ctx.createLinearGradient(bx, by, ex, ey);
      blade.addColorStop(0, tint('#3a0c18', flash));
      blade.addColorStop(0.45, tint('#6a1424', flash));
      blade.addColorStop(1, tint('#ff3357', flash));
      ctx.fillStyle = blade;
      ctx.fill();
      ctx.strokeStyle = 'rgba(8, 4, 8, 0.9)';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // Fio luminoso.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = hexToRgba('#ff5a72', 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(cx, cy, ex, ey);
      ctx.stroke();
      ctx.strokeStyle = hexToRgba('#ffb0b8', 0.65);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(cx, cy, ex, ey);
      ctx.stroke();
      ctx.restore();

      // Nervura escura.
      ctx.strokeStyle = 'rgba(20, 5, 12, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.quadraticCurveTo(jx, jy, ex, ey);
      ctx.stroke();

      // Runa na base da lâmina.
      ctx.save();
      ctx.translate(bx + perp.x * 12 + 4, by + perp.y * 12 + 2);
      ctx.strokeStyle = hexToRgba('#ff8a9a', 0.8);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-2, 3);
      ctx.lineTo(0, -3);
      ctx.lineTo(2, 3);
      ctx.moveTo(-1.2, 0);
      ctx.lineTo(1.2, 0);
      ctx.stroke();
      ctx.restore();
      glow(ctx, bx + 20, by - 10, 26, accent, 0.35);
      ctx.restore();
      break;
    }
    case 'sword': {
      const dir = { x: Math.sin(a), y: Math.cos(a) };
      const perp = { x: Math.cos(a), y: -Math.sin(a) };
      const tip = joint(hx, hy, 92, a);
      const base = joint(hx, hy, 16, a);
      ctx.save();
      ctx.lineCap = 'round';
      glow(ctx, (hx + tip.x) / 2, (hy + tip.y) / 2, 34, accent, 0.22);

      // Lâmina afilada.
      const tipBase = { x: tip.x - dir.x * 8, y: tip.y - dir.y * 8 };
      ctx.beginPath();
      ctx.moveTo(base.x + perp.x * 3.2, base.y + perp.y * 3.2);
      ctx.lineTo(tipBase.x + perp.x * 2.2, tipBase.y + perp.y * 2.2);
      ctx.lineTo(tip.x, tip.y);
      ctx.lineTo(tipBase.x - perp.x * 2.2, tipBase.y - perp.y * 2.2);
      ctx.lineTo(base.x - perp.x * 3.2, base.y - perp.y * 3.2);
      ctx.closePath();
      const bg = ctx.createLinearGradient(base.x, base.y, tip.x, tip.y);
      bg.addColorStop(0, tint('#c9a44f', flash));
      bg.addColorStop(0.25, '#fff4cd');
      bg.addColorStop(0.75, '#fffdf2');
      bg.addColorStop(1, '#ffffff');
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(120, 90, 40, 0.75)';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // Veio central.
      ctx.strokeStyle = 'rgba(180, 140, 70, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(base.x + dir.x * 2, base.y + dir.y * 2);
      ctx.lineTo(tipBase.x, tipBase.y);
      ctx.stroke();

      // Fio luminoso.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(base.x + perp.x * 2.6, base.y + perp.y * 2.6);
      ctx.lineTo(tipBase.x + perp.x * 1.7, tipBase.y + perp.y * 1.7);
      ctx.stroke();
      ctx.restore();

      // Guarda dourada.
      const gx = joint(hx, hy, 13, a);
      const guard = ctx.createLinearGradient(
        gx.x - perp.x * 10,
        gx.y - perp.y * 10,
        gx.x + perp.x * 10,
        gx.y + perp.y * 10,
      );
      guard.addColorStop(0, tint('#8a6a2a', flash));
      guard.addColorStop(0.5, tint('#ffe6a3', flash));
      guard.addColorStop(1, tint('#8a6a2a', flash));
      ctx.strokeStyle = guard;
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(gx.x - perp.x * 9 - dir.x * 1.5, gx.y - perp.y * 9 - dir.y * 1.5);
      ctx.quadraticCurveTo(gx.x, gx.y + 2, gx.x + perp.x * 9 - dir.x * 1.5, gx.y + perp.y * 9 - dir.y * 1.5);
      ctx.stroke();

      // Gema.
      ctx.fillStyle = tint(accent, flash);
      ctx.beginPath();
      ctx.arc(gx.x, gx.y, 2.4, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120, 90, 40, 0.8)';
      ctx.lineWidth = 0.7;
      ctx.stroke();

      // Cabo enrolado e pomo.
      const gripEnd = joint(hx, hy, -9, a);
      ctx.strokeStyle = tint('#3a2a1a', flash);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(gripEnd.x, gripEnd.y);
      ctx.stroke();
      ctx.strokeStyle = hexToRgba('#c9a44f', 0.7);
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const t = (i + 0.5) / 3;
        const px = lerp(hx, gripEnd.x, t);
        const py = lerp(hy, gripEnd.y, t);
        ctx.beginPath();
        ctx.moveTo(px - perp.x * 2.4, py - perp.y * 2.4);
        ctx.lineTo(px + perp.x * 2.4, py + perp.y * 2.4);
        ctx.stroke();
      }
      ctx.fillStyle = tint('#c9a44f', flash);
      ctx.beginPath();
      ctx.arc(gripEnd.x, gripEnd.y, 2.4, 0, TAU);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'blades': {
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 0; i < 2; i++) {
        const aa = a + (i === 0 ? 0 : -0.5);
        const tip = joint(hx, hy, 58, aa);
        const perp = { x: Math.cos(aa), y: -Math.sin(aa) };
        const base = joint(hx, hy, 7, aa);
        const midX = hx + Math.sin(aa) * 34 + Math.cos(aa) * 8;
        const midY = hy + Math.cos(aa) * 34 - Math.sin(aa) * 8;

        // Aura externa.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = hexToRgba(i === 0 ? c.accent : c.glow, 0.35);
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(base.x, base.y);
        ctx.quadraticCurveTo(midX, midY, tip.x, tip.y);
        ctx.stroke();
        ctx.restore();

        // Lâmina preenchida.
        ctx.beginPath();
        ctx.moveTo(base.x + perp.x * 2.6, base.y + perp.y * 2.6);
        ctx.quadraticCurveTo(midX + perp.x * 1.8, midY + perp.y * 1.8, tip.x, tip.y);
        ctx.quadraticCurveTo(midX - perp.x * 1.8, midY - perp.y * 1.8, base.x - perp.x * 2.6, base.y - perp.y * 2.6);
        ctx.closePath();
        const bg = ctx.createLinearGradient(base.x, base.y, tip.x, tip.y);
        bg.addColorStop(0, hexToRgba(c.accent, 0.55));
        bg.addColorStop(0.5, 'rgba(180, 139, 255, 0.95)');
        bg.addColorStop(1, 'rgba(255, 138, 226, 0.95)');
        ctx.fillStyle = bg;
        ctx.fill();

        // Núcleo branco.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(base.x, base.y);
        ctx.quadraticCurveTo(midX, midY, tip.x, tip.y);
        ctx.stroke();
        ctx.restore();

        // Anel na empunhadura.
        ctx.strokeStyle = hexToRgba(c.accent, 0.8);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(hx, hy, 4.2, 0, TAU);
        ctx.stroke();
      }

      // Eco fantasma.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha *= 0.35;
      const ghost = joint(hx, hy, 46, a - 0.9);
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(ghost.x, ghost.y);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
      break;
    }
    case 'gravity': {
      // Orbes de gravidade com halo, núcleo, anel e partículas.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 2; i++) {
        const ox = hx + (i === 0 ? 8 : -6);
        const oy = hy + (i === 0 ? -6 : 2) + Math.sin(time * 2.6 + i) * 3;
        const halo = ctx.createRadialGradient(ox, oy, 1, ox, oy, 15);
        halo.addColorStop(0, hexToRgba(accent, 0.5));
        halo.addColorStop(0.5, hexToRgba(accent, 0.14));
        halo.addColorStop(1, hexToRgba(accent, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(ox, oy, 15, 0, TAU);
        ctx.fill();

        const g = ctx.createRadialGradient(ox - 1, oy - 1, 0, ox, oy, 6);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.4, accent);
        g.addColorStop(0.85, '#2a1a6a');
        g.addColorStop(1, 'rgba(10, 5, 20, 0.9)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(ox, oy, 6, 0, TAU);
        ctx.fill();

        ctx.strokeStyle = hexToRgba(accent, 0.75);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(ox, oy, 9.5, 3.2, time * 0.8 + i, 0, TAU);
        ctx.stroke();

        ctx.save();
        ctx.globalAlpha *= 0.6;
        for (let j = 0; j < 3; j++) {
          const ang = time * 2 + i * 2 + j * 2.1;
          const px = ox + Math.cos(ang) * (8 + j * 2);
          const py = oy + Math.sin(ang) * (3 + j * 1.5);
          ctx.fillStyle = j === 0 ? '#ffffff' : accent;
          ctx.fillRect(px, py, 1.1, 1.1);
        }
        ctx.restore();
      }

      // Arco gravitacional entre as mãos.
      ctx.strokeStyle = hexToRgba(accent, 0.25);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx + 4, hy - 5);
      ctx.quadraticCurveTo(hx + 1, hy - 12, hx - 4, hy + 1);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'gauntlets': {
      // Calor e fagulhas ao redor da manopla.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 18);
      g.addColorStop(0, hexToRgba(accent, 0.3));
      g.addColorStop(1, hexToRgba(accent, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(hx, hy, 18, 0, TAU);
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        const ang = time * 3 + i * 2.1;
        ctx.fillStyle = i === 0 ? '#fff2d0' : accent;
        ctx.fillRect(hx + Math.cos(ang) * (9 + i * 3), hy + Math.sin(ang) * (6 + i * 2), 1.3, 1.3);
      }
      ctx.restore();
      break;
    }
    case 'fists':
    default: {
      if (def.id === 'ravi') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 15);
        g.addColorStop(0, hexToRgba(accent, 0.25));
        g.addColorStop(1, hexToRgba(accent, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(hx, hy, 15, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.4;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          const ang = time * 9 + i * 2.1;
          ctx.moveTo(hx - 8 + Math.sin(ang) * 3, hy - 6);
          ctx.lineTo(hx + Math.cos(ang) * 8, hy + 4 - Math.cos(ang) * 5);
          ctx.stroke();
        }
        ctx.restore();
      }
      break;
    }
  }
}

function drawBodyEffects(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  o: {
    time: number;
    chestX: number;
    chestY: number;
    headX: number;
    headY: number;
    handF: { x: number; y: number };
    handB: { x: number; y: number };
    hipY: number;
    flash: number;
    build: Build;
  },
): void {
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
function drawPlayerAura(ctx: CanvasRenderingContext2D, p: Player, time: number): void {
  if (p.dead) return;
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
function drawCombatFlair(ctx: CanvasRenderingContext2D, p: Player, time: number): void {
  const a = p.attack;
  if (!a || p.dead) return;
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
export function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, time: number): void {
  const build = playerBuild(p, time);
  ctx.save();
  if (p.invulnFlash && !p.dead) ctx.globalAlpha = 0.55;

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
      drawCharacterFigure(
        ctx,
        p.def,
        p.x - p.dashDir * i * 22,
        p.y,
        p.facing,
        p.def.scale,
        time,
        build,
        p.hitFlash,
      );
    }
    ctx.restore();
  }
  ctx.restore();
}

/** Motivo de fundo exclusivo de cada retrato. */
function drawPortraitMotif(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  size: number,
  time: number,
  dim: boolean,
): void {
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
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
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
export function drawCharacterPortrait(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  cx: number,
  cy: number,
  size: number,
  time: number,
  dim = false,
): void {
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

  // Volume e costuras do busto.
  ctx.save();
  ctx.clip();
  const bustShade = ctx.createLinearGradient(-34, -6, 34, 30);
  bustShade.addColorStop(0, 'rgba(0,0,0,0.35)');
  bustShade.addColorStop(0.45, 'rgba(0,0,0,0.05)');
  bustShade.addColorStop(0.75, 'rgba(255,255,255,0.12)');
  bustShade.addColorStop(1, 'rgba(255,255,255,0.02)');
  ctx.fillStyle = bustShade;
  ctx.fillRect(-36, -8, 72, 40);
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-12, 2);
  ctx.quadraticCurveTo(-8, 16, -6, 30);
  ctx.moveTo(10, 4);
  ctx.quadraticCurveTo(8, 18, 10, 30);
  ctx.stroke();
  ctx.restore();

  // Ombreiras.
  const plateBase =
    def.id === 'ravi'
      ? c.primary
      : def.id === 'elodie'
        ? '#f5e2b0'
        : def.id === 'miriam'
          ? '#4a342d'
          : def.id === 'ozric'
            ? '#2a0f16'
            : def.id === 'thryc'
              ? c.primary
              : c.secondary;
  for (const side of [-1, 1] as const) {
    ctx.save();
    ctx.translate(side * 28, 14);
    ctx.scale(side, 1);
    const plate = ctx.createLinearGradient(-11, -8, 11, 10);
    plate.addColorStop(0, mixColor(plateBase, '#ffffff', 0.3));
    plate.addColorStop(0.55, plateBase);
    plate.addColorStop(1, mixColor(plateBase, '#000000', 0.45));
    ctx.fillStyle = plate;
    ctx.beginPath();
    ctx.moveTo(-11, -2);
    ctx.quadraticCurveTo(-4, -9, 9, -4);
    ctx.lineTo(11, 3);
    ctx.quadraticCurveTo(2, 8, -10, 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Placa superior menor.
    ctx.fillStyle = mixColor(plateBase, '#ffffff', 0.18);
    ctx.beginPath();
    ctx.moveTo(-8, -1);
    ctx.quadraticCurveTo(-3, -6, 7, -3);
    ctx.lineTo(6, 1);
    ctx.quadraticCurveTo(0, 4, -7, 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Fita e rebite externo.
    ctx.strokeStyle = hexToRgba(c.accent, 0.85);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, 3);
    ctx.quadraticCurveTo(0, 7, 9, 1);
    ctx.stroke();
    ctx.fillStyle = hexToRgba(c.accent, 0.9);
    ctx.beginPath();
    ctx.arc(7, -1.5, 1.1, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // Pescoço e gola.
  ctx.fillStyle = c.skin;
  ctx.fillRect(-6, -20, 12, 18);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, -16, 7, 4, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = mixColor(c.secondary, '#000000', 0.35);
  ctx.beginPath();
  ctx.moveTo(-14, -5);
  ctx.quadraticCurveTo(0, 4, 14, -5);
  ctx.lineTo(10, 4);
  ctx.quadraticCurveTo(0, 10, -10, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = hexToRgba(c.accent, 0.65);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-11, -1);
  ctx.quadraticCurveTo(0, 7, 11, -1);
  ctx.stroke();

  // Cabeça.
  ctx.beginPath();
  ctx.ellipse(0, -32, 18, 21, 0, 0, TAU);
  ctx.fillStyle = c.skin;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Orelhas, sombras de mandíbula e maçãs do rosto.
  ctx.fillStyle = mixColor(c.skin, '#000000', 0.12);
  ctx.beginPath();
  ctx.ellipse(-17, -32, 4, 6, 0.1, 0, TAU);
  ctx.ellipse(17, -32, 4, 6, -0.1, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(-11, -26, 6, 10, 0.15, 0, TAU);
  ctx.ellipse(11, -26, 6, 10, -0.15, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -16, 12, 5, 0, 0, TAU);
  ctx.fill();

  // Olhos.
  ctx.fillStyle = c.eye;
  ctx.beginPath();
  ctx.ellipse(-7, -34, 3, 2.2, 0, 0, TAU);
  ctx.ellipse(8, -34, 3, 2.2, 0, 0, TAU);
  ctx.fill();
  if (def.id !== 'thryc') {
    ctx.fillStyle = 'rgba(18, 14, 24, 0.72)';
    ctx.beginPath();
    ctx.ellipse(-7, -34, 1.1, 1.5, 0, 0, TAU);
    ctx.ellipse(8, -34, 1.1, 1.5, 0, 0, TAU);
    ctx.fill();
  }

  // Brilho dos olhos, sobrancelhas, nariz e lábios.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(-8, -35, 0.8, 0, TAU);
  ctx.arc(7, -35, 0.8, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(mixColor(c.hair, '#000000', 0.2), 0.55);
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-11, -40);
  ctx.quadraticCurveTo(-7, -41.5, -3, -40);
  ctx.moveTo(4, -40);
  ctx.quadraticCurveTo(8, -41.5, 12, -40);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -27.5);
  ctx.lineTo(-1.2, -24);
  ctx.quadraticCurveTo(0, -23, 1.3, -23.4);
  ctx.stroke();
  ctx.strokeStyle = hexToRgba(mixColor(c.skin, '#7a2a30', 0.5), 0.55);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-4, -18);
  ctx.quadraticCurveTo(0, -16.5, 4, -18);
  ctx.stroke();

  // Cabelo por personagem.
  drawPortraitHeadwear(ctx, def, time, s);

  // Brilho no cabelo e luz de contorno.
  ctx.strokeStyle = hexToRgba(mixColor(c.hair, '#ffffff', 0.6), 0.5);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(-2, -44, 14, Math.PI * 1.1, Math.PI * 1.48);
  ctx.stroke();
  ctx.strokeStyle = hexToRgba(c.accent, 0.32);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, -32, 18.5, 21.5, 0, -0.9, 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(20, -2);
  ctx.quadraticCurveTo(32, 8, 34, 28);
  ctx.stroke();

  // Detalhes de traje.
  if (def.id === 'miriam') {
    ctx.fillStyle = '#3a2a22';
    roundRectPath(ctx, -22, 4, 44, 22, 6);
    ctx.fill();
    ctx.fillStyle = '#ff9b3c';
    ctx.beginPath();
    ctx.arc(12, 13, 4, 0, TAU);
    ctx.fill();
  } else if (def.id === 'ozric') {
    ctx.fillStyle = '#1a1018';
    ctx.beginPath();
    ctx.moveTo(-34, 26);
    ctx.quadraticCurveTo(-26, 6, -12, 2);
    ctx.lineTo(-4, 30);
    ctx.closePath();
    ctx.fill();
  } else if (def.id === 'elodie') {
    ctx.strokeStyle = 'rgba(255,240,190,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -54, 24, 6, 0, 0, TAU);
    ctx.stroke();
  } else if (def.id === 'kael') {
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-16, -34);
    ctx.lineTo(2, -34);
    ctx.stroke();
  } else if (def.id === 'thryc') {
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
    ctx.globalAlpha = dim ? 0.35 : 1;
  }

  // Detalhes extras de cada Desperto.
  if (def.id === 'ravi') {
    ctx.strokeStyle = hexToRgba(c.accent, 0.7);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(0, 28);
    ctx.stroke();
    ctx.fillStyle = hexToRgba(c.accent, 0.9);
    ctx.beginPath();
    ctx.arc(-16, 9, 2, 0, TAU);
    ctx.fill();
  } else if (def.id === 'miriam') {
    ctx.fillStyle = 'rgba(255, 207, 154, 0.8)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(-14 + i * 14, 9, 1.4, 0, TAU);
      ctx.fill();
    }
  } else if (def.id === 'kael') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = hexToRgba(c.accent, 0.55);
    const lift = Math.sin(time * 2.2) * 2;
    ctx.beginPath();
    ctx.moveTo(28, -2 + lift);
    ctx.lineTo(34, 4 + lift);
    ctx.lineTo(28, 10 + lift);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (def.id === 'ozric') {
    ctx.strokeStyle = 'rgba(255, 51, 87, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-28, 10);
    ctx.quadraticCurveTo(-18, 20, -24, 30);
    ctx.stroke();
  } else if (def.id === 'elodie') {
    ctx.strokeStyle = hexToRgba(c.secondary, 0.8);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(-24 + i * 5, 12 + i * 4, 8 - i * 2, 2.2, -0.4, 0, TAU);
      ctx.stroke();
    }
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

function drawPortraitHeadwear(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  time: number,
  s: number,
): void {
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

export function drawCharacterSilhouette(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  scale: number,
  color: string,
): void {
  const def = CHARACTERS[id as keyof typeof CHARACTERS] ?? CHARACTERS.ravi;
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
