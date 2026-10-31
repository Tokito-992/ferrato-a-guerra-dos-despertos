/** Ilustração procedural de inimigos e chefes. */

import { clamp, hexToRgba, mixColor, TAU } from '../core/math.js';
import type { Enemy } from '../entities/enemy.js';
import type { Boss } from '../entities/boss.js';
import { getStage } from '../data/stages.js';
import { visualStyle } from './style.js';
import { glow, joint, limb, roundRectPath } from './theme.js';

function tint(color: string, flash: number): string {
  return flash > 0 ? mixColor(color, '#ffffff', clamp(flash * 4.5, 0, 0.9)) : color;
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, w, w * 0.28, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

const INK = 'rgba(5, 4, 8, 0.9)';

function outlinePath(ctx: CanvasRenderingContext2D, width = 1.4, color = INK): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

/** Membro com contorno, sombra dura e luz de contorno — leitura forte em qualquer escala. */
function armoredLimb(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  base: string,
  opts: { dark?: string; light?: string; accent?: string; band?: boolean } = {},
): void {
  const dark = opts.dark ?? mixColor(base, '#08060c', 0.58);
  const light = opts.light ?? mixColor(base, '#ffffff', 0.32);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  limb(ctx, x1, y1, x2, y2, width + 2.6, INK);
  limb(ctx, x1, y1, x2, y2, width, base);
  limb(
    ctx,
    x1 + nx * width * 0.12,
    y1 + ny * width * 0.12,
    x2 + nx * width * 0.12,
    y2 + ny * width * 0.12,
    Math.max(1.2, width * 0.36),
    dark,
  );
  limb(
    ctx,
    x1 - nx * width * 0.18,
    y1 - ny * width * 0.18,
    x2 - nx * width * 0.18,
    y2 - ny * width * 0.18,
    Math.max(0.8, width * 0.14),
    light,
  );
  if (opts.band) {
    const mx = (x1 + x2) * 0.5;
    const my = (y1 + y2) * 0.5;
    limb(
      ctx,
      mx - nx * width * 0.52,
      my - ny * width * 0.52,
      mx + nx * width * 0.52,
      my + ny * width * 0.52,
      Math.max(1, width * 0.24),
      opts.accent ?? light,
    );
  }
}

function enemyEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  opts: { pupil?: string; angry?: boolean; glow?: boolean; vertical?: boolean } = {},
): void {
  if (opts.glow !== false) glow(ctx, x, y, r * 3.4, color, 0.28);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#08050c';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.5, r * (opts.vertical ? 1.8 : 1.0), 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    r * (opts.vertical ? 0.62 : 1.08),
    r * (opts.vertical ? 1.25 : 0.68),
    0,
    0,
    TAU,
  );
  ctx.fill();
  ctx.fillStyle = opts.pupil ?? '#08050c';
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    r * (opts.vertical ? 0.22 : 0.38),
    r * (opts.vertical ? 0.9 : 0.48),
    0,
    0,
    TAU,
  );
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

function spike(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  angle = 0,
): void {
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

function claw(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  angle: number,
  color = '#efe6cf',
): void {
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

function runeMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  color: string,
  angle = 0,
): void {
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

export function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, time: number): void {
  const c = e.def;
  const flash = e.hitFlash;
  const col = tint(c.color, flash);
  const accent = tint(c.accent, flash);
  const dark = tint('#0d0a12', flash);
  const scale = e.scale;
  const bob = e.def.flying ? Math.sin(time * 2.4 + e.animPhase) * 4 : 0;
  const walk = Math.sin(e.walkPhase);

  shadow(
    ctx,
    e.x,
    e.def.flying ? e.stage.floor + 2 : e.y + 2,
    Math.max(22, e.w * 0.38) * (e.def.flying ? 0.85 : 1),
  );

  ctx.save();
  ctx.translate(e.x, e.y + bob);
  ctx.scale(e.facing * scale, scale);
  ctx.globalAlpha = e.alpha;

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

function drawCrawler(
  ctx: CanvasRenderingContext2D,
  e: Enemy,
  time: number,
  col: string,
  accent: string,
  dark: string,
  walk: number,
): void {
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

function drawWarrior(
  ctx: CanvasRenderingContext2D,
  e: Enemy,
  time: number,
  col: string,
  accent: string,
  dark: string,
  walk: number,
): void {
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

function drawDrone(
  ctx: CanvasRenderingContext2D,
  e: Enemy,
  time: number,
  col: string,
  accent: string,
  dark: string,
): void {
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

function drawHound(
  ctx: CanvasRenderingContext2D,
  e: Enemy,
  time: number,
  col: string,
  accent: string,
  dark: string,
  walk: number,
): void {
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

function drawCaster(
  ctx: CanvasRenderingContext2D,
  e: Enemy,
  time: number,
  col: string,
  accent: string,
  dark: string,
): void {
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

function drawBrute(
  ctx: CanvasRenderingContext2D,
  e: Enemy,
  time: number,
  col: string,
  accent: string,
  dark: string,
  walk: number,
): void {
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

function drawShade(
  ctx: CanvasRenderingContext2D,
  e: Enemy,
  time: number,
  col: string,
  accent: string,
  dark: string,
): void {
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

function drawConstruct(
  ctx: CanvasRenderingContext2D,
  e: Enemy,
  time: number,
  col: string,
  accent: string,
  dark: string,
): void {
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

function drawSeraph(
  ctx: CanvasRenderingContext2D,
  e: Enemy,
  time: number,
  col: string,
  accent: string,
  dark: string,
): void {
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

function drawEcho(
  ctx: CanvasRenderingContext2D,
  e: Enemy,
  time: number,
  col: string,
  accent: string,
  dark: string,
  walk: number,
): void {
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

function tintShade(color: string): string {
  return mixColor(color, '#0b0810', 0.35);
}

// ------------------------------------------------------------------ chefes

export function drawBoss(ctx: CanvasRenderingContext2D, b: Boss, time: number): void {
  const def = b.def;
  const flash = b.hitFlash;
  const c = def.colors;
  const col = tint(c.primary, flash);
  const dark = tint(c.dark, flash);
  const accent = tint(c.accent, flash);
  const scale = def.scale;
  const bob = def.flying ? Math.sin(time * 1.6 + b.animPhase) * 8 : 0;

  shadow(ctx, b.x, def.flying ? getFloorFromBoss(b) : b.y + 2, b.w * 0.42);

  ctx.save();
  ctx.translate(b.x, b.y + bob);
  ctx.scale(b.facing * scale, scale);
  ctx.globalAlpha = b.dead ? clamp(1 - b.deathTimer / 2.2, 0, 1) : 1;

  // Aura de chefe.
  glow(ctx, 0, -b.h * 0.5, b.w * 0.9, accent, b.state === 'phase' ? 0.3 : 0.14);

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
    ctx.restore();
  }

  switch (def.id) {
    case 'colossus':
      drawColossus(ctx, b, time, col, dark, accent);
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
    ctx.restore();
  }
  ctx.restore();
}

function getFloorFromBoss(b: Boss): number {
  return getStage(b.def.stage).floor;
}

function drawColossus(
  ctx: CanvasRenderingContext2D,
  b: Boss,
  time: number,
  col: string,
  dark: string,
  accent: string,
): void {
  const breathe = Math.sin(time * 1.4) * 3;
  // Pernas curtas e massivas.
  ctx.fillStyle = dark;
  roundRectPath(ctx, -50, -60, 34, 62, 12);
  ctx.fill();
  roundRectPath(ctx, 18, -58, 34, 60, 12);
  ctx.fill();
  // Massa central.
  const g = ctx.createRadialGradient(-20, -150, 20, 0, -120, 130);
  g.addColorStop(0, tintShade(col));
  g.addColorStop(0.55, col);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-78, -96);
  ctx.quadraticCurveTo(-96, -160, -52, -196);
  ctx.quadraticCurveTo(-20, -222, 20, -208);
  ctx.quadraticCurveTo(72, -224, 92, -170);
  ctx.quadraticCurveTo(106, -120, 74, -82);
  ctx.quadraticCurveTo(20, -62, -30, -76);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Carros absorvidos.
  ctx.fillStyle = tintShade(dark);
  roundRectPath(ctx, -62, -178, 52, 26, 5);
  ctx.fill();
  ctx.fillStyle = '#2a3a4a';
  roundRectPath(ctx, -56, -172, 18, 12, 3);
  ctx.fill();
  roundRectPath(ctx, -32, -172, 18, 12, 3);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(-58, -165, 4, 0, TAU);
  ctx.fill();
  // Braço gigante.
  const swing = b.state === 'execute' ? 1.4 : b.state === 'windup' ? -1.3 : Math.sin(time * 1.2) * 0.1;
  const shoulder = { x: 54, y: -168 };
  const elbow = joint(shoulder.x, shoulder.y, 66, swing);
  const hand = joint(elbow.x, elbow.y, 58, swing + 0.5);
  limb(ctx, shoulder.x, shoulder.y, elbow.x, elbow.y, 34, col);
  limb(ctx, elbow.x, elbow.y, hand.x, hand.y, 30, tintShade(col));
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(hand.x, hand.y, 26, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // Braço esquerdo menor.
  const lArm = joint(-58, -158, 50, -swing * 0.6);
  limb(ctx, -58, -158, lArm.x, lArm.y, 24, col);
  // Olhos múltiplos.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const eyes = [
    [-24, -150, 9],
    [8, -168, 6],
    [34, -140, 11],
    [-4, -118, 5],
    [52, -120, 7],
  ];
  for (const [ex, ey, er] of eyes) {
    const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, er * 2);
    eg.addColorStop(0, '#ffffff');
    eg.addColorStop(0.35, accent);
    eg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(ex, ey, er * 2, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  // Boca.
  ctx.fillStyle = '#1a0808';
  ctx.beginPath();
  ctx.ellipse(20, -92, 30, 14 + Math.sin(time * 4) * 3, 0.1, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe6a3';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-4 + i * 11, -98);
    ctx.lineTo(-1 + i * 11, -88);
    ctx.lineTo(3 + i * 11, -98);
    ctx.fill();
  }
  // Tubos de escape.
  ctx.fillStyle = '#2a2424';
  roundRectPath(ctx, -30, -210, 12, 34, 4);
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.4 + Math.sin(time * 6) * 0.15;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(-24, -214 - breathe, 10, 18, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawVekthar(
  ctx: CanvasRenderingContext2D,
  b: Boss,
  time: number,
  col: string,
  dark: string,
  accent: string,
): void {
  const lean = b.state === 'execute' ? 0.12 : 0.02;
  ctx.rotate(lean * 0.2);
  // Capa.
  const flap = Math.sin(time * 2) * 8;
  ctx.fillStyle = tintShade(dark);
  ctx.beginPath();
  ctx.moveTo(-20, -160);
  ctx.quadraticCurveTo(-80 - flap, -80, -60 - flap, 0);
  ctx.quadraticCurveTo(-20, -20, 0, -4);
  ctx.quadraticCurveTo(22, -24, 30, 0);
  ctx.quadraticCurveTo(40, -90, 18, -160);
  ctx.closePath();
  ctx.fill();
  // Pernas.
  limb(ctx, -14, -76, -20, -38, 16, dark);
  limb(ctx, -20, -38, -22, 0, 13, tintShade(col));
  limb(ctx, 14, -76, 20, -38, 16, dark);
  limb(ctx, 20, -38, 22, 0, 13, tintShade(col));
  // Torso.
  const g = ctx.createLinearGradient(-30, -170, 30, -60);
  g.addColorStop(0, tintShade(col));
  g.addColorStop(0.5, col);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-24, -70);
  ctx.lineTo(-32, -142);
  ctx.quadraticCurveTo(0, -166, 32, -142);
  ctx.lineTo(24, -70);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Placas e núcleo.
  ctx.fillStyle = tintShade(dark);
  roundRectPath(ctx, -18, -140, 36, 30, 6);
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const core = ctx.createRadialGradient(0, -124, 0, 0, -124, 16);
  core.addColorStop(0, '#ffffff');
  core.addColorStop(0.4, accent);
  core.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, -124, 16, 0, TAU);
  ctx.fill();
  ctx.restore();
  // Ombros pontiagudos.
  for (const side of [-1, 1]) {
    ctx.fillStyle = tintShade(col);
    ctx.beginPath();
    ctx.moveTo(side * 22, -146);
    ctx.lineTo(side * 48, -160);
    ctx.lineTo(side * 42, -128);
    ctx.lineTo(side * 24, -120);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // Cabeça / elmo.
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(0, -172, 16, 19, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(-14, -176);
  ctx.lineTo(0, -196);
  ctx.lineTo(14, -176);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(5, -172, 4.5, 3, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  // Canhão de plasma.
  const armAng = b.state === 'windup' ? -0.9 : b.state === 'execute' ? 1.3 : 0.25;
  const elbow = joint(34, -140, 40, armAng);
  const hand = joint(elbow.x, elbow.y, 34, armAng + 0.1);
  limb(ctx, 34, -140, elbow.x, elbow.y, 16, col);
  ctx.save();
  ctx.translate(hand.x, hand.y);
  ctx.rotate(armAng * 0.6);
  ctx.fillStyle = tintShade(dark);
  roundRectPath(ctx, -10, -14, 54, 28, 8);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(44, 0, 6, 12, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  // Braço esquerdo com lâmina.
  const lElbow = joint(-32, -140, 34, -0.4);
  limb(ctx, -32, -140, lElbow.x, lElbow.y, 12, col);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(lElbow.x, lElbow.y);
  ctx.lineTo(lElbow.x - 6, lElbow.y + 54);
  ctx.stroke();
  void b;
}

function drawXalmor(
  ctx: CanvasRenderingContext2D,
  b: Boss,
  time: number,
  col: string,
  dark: string,
  accent: string,
): void {
  // Corpo flutuante a 60px acima dos "pés".
  ctx.translate(0, -30);
  // Painéis solares.
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 74, -100);
    ctx.rotate(side * 0.2 + Math.sin(time * 0.6) * 0.05);
    ctx.fillStyle = tintShade(col);
    roundRectPath(ctx, side > 0 ? 0 : -56, -34, 56, 68, 4);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(side > 0 ? 0 : -56, -34 + i * 17);
      ctx.lineTo(side > 0 ? 56 : 0, -34 + i * 17);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  // Anéis orbitais.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = hexToRgba(accent, 0.5 - i * 0.1);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -100, 96 + i * 14, 34 + i * 8, time * (0.2 + i * 0.08), 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
  // Núcleo.
  const g = ctx.createRadialGradient(0, -100, 8, 0, -100, 70);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.15, accent);
  g.addColorStop(0.55, col);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, -100, 62, 0, TAU);
  ctx.fill();
  // Olho central.
  ctx.fillStyle = '#08040c';
  ctx.beginPath();
  ctx.ellipse(0, -100, 34, 22, 0, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const eye = ctx.createRadialGradient(0, -100, 0, 0, -100, 20);
  eye.addColorStop(0, '#ffffff');
  eye.addColorStop(0.4, b.def.colors.eye);
  eye.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = eye;
  ctx.beginPath();
  ctx.arc(0, -100, 20, 0, TAU);
  ctx.fill();
  ctx.restore();
  // Nós orbitando.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const a = time * 0.9 + (i * TAU) / 5;
    const px = Math.cos(a) * 100;
    const py = -100 + Math.sin(a) * 40;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(accent, 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -100);
    ctx.lineTo(px, py);
    ctx.stroke();
  }
  ctx.restore();
  // Detalhes metálicos.
  ctx.strokeStyle = tintShade(col);
  ctx.lineWidth = 6;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 50, -100 + Math.sin(a) * 50);
    ctx.lineTo(Math.cos(a) * 72, -100 + Math.sin(a) * 72);
    ctx.stroke();
  }
  void b;
}

function drawAcheron(
  ctx: CanvasRenderingContext2D,
  b: Boss,
  time: number,
  col: string,
  dark: string,
  accent: string,
): void {
  // Capa longa.
  const flap = Math.sin(time * 1.8) * 10;
  ctx.fillStyle = tintShade(dark);
  ctx.beginPath();
  ctx.moveTo(-16, -176);
  ctx.quadraticCurveTo(-80 - flap, -120, -72 - flap, 0);
  ctx.quadraticCurveTo(-30, -30, 0, -8);
  ctx.quadraticCurveTo(34, -34, 70 + flap, 0);
  ctx.quadraticCurveTo(70 + flap, -120, 16, -176);
  ctx.closePath();
  ctx.fill();
  // Pernas.
  limb(ctx, -12, -80, -20, -40, 14, dark);
  limb(ctx, -20, -40, -18, 0, 12, tintShade(col));
  limb(ctx, 12, -80, 20, -40, 14, dark);
  limb(ctx, 20, -40, 18, 0, 12, tintShade(col));
  // Torso.
  const g = ctx.createLinearGradient(-30, -180, 30, -60);
  g.addColorStop(0, tintShade(col));
  g.addColorStop(0.55, col);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-26, -74);
  ctx.lineTo(-30, -150);
  ctx.quadraticCurveTo(0, -172, 30, -150);
  ctx.lineTo(26, -74);
  ctx.closePath();
  ctx.fill();
  // Peitoral.
  ctx.fillStyle = tintShade(dark);
  ctx.beginPath();
  ctx.moveTo(-18, -144);
  ctx.lineTo(0, -124);
  ctx.lineTo(18, -144);
  ctx.lineTo(12, -104);
  ctx.lineTo(-12, -104);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Correntes no corpo.
  ctx.strokeStyle = 'rgba(210, 180, 140, 0.4)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-26, -140 + i * 20);
    ctx.quadraticCurveTo(0, -120 + i * 22, 26, -140 + i * 20);
    ctx.stroke();
  }
  // Cabeça.
  ctx.fillStyle = tintShade(dark);
  ctx.beginPath();
  ctx.ellipse(0, -176, 16, 18, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(0, -184, 16, 10, 0, Math.PI, TAU);
  ctx.fill();
  // Chifres enormes.
  ctx.strokeStyle = tintShade(col);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-12, -188);
  ctx.quadraticCurveTo(-36, -208, -26, -232);
  ctx.moveTo(12, -188);
  ctx.quadraticCurveTo(36, -208, 26, -232);
  ctx.stroke();
  // Olhos.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = b.def.colors.eye;
  ctx.beginPath();
  ctx.ellipse(-5, -178, 3.4, 2.2, 0, 0, TAU);
  ctx.ellipse(6, -178, 3.4, 2.2, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  // Coroa.
  ctx.fillStyle = accent;
  for (let i = 0; i < 5; i++) {
    const px = -16 + i * 8;
    ctx.beginPath();
    ctx.moveTo(px, -198);
    ctx.lineTo(px + 3, -212 - (i % 2) * 6);
    ctx.lineTo(px + 6, -198);
    ctx.fill();
  }
  // Foice acorrentada.
  const sweep = b.state === 'execute' ? 0.9 : b.state === 'windup' ? -1.1 : Math.sin(time * 0.8) * 0.1;
  const hand = joint(34, -140, 52, sweep);
  limb(ctx, 30, -142, hand.x, hand.y, 10, col);
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 4;
  const tip = joint(hand.x, hand.y, 100, sweep + 0.4);
  ctx.beginPath();
  ctx.moveTo(hand.x, hand.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.quadraticCurveTo(tip.x + 34, tip.y + 8, tip.x + 10, tip.y + 40);
  ctx.stroke();
  ctx.restore();
  // Correntes flutuantes.
  ctx.strokeStyle = 'rgba(255, 90, 50, 0.35)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-40 - i * 8, -120 + i * 26);
    ctx.bezierCurveTo(-70, -90 + i * 20, -40, -50 + i * 20, -62, -20 + i * 16);
    ctx.stroke();
  }
  glow(ctx, 0, -130, 80, accent, 0.12);
}

function drawMalakhim(
  ctx: CanvasRenderingContext2D,
  b: Boss,
  time: number,
  col: string,
  dark: string,
  accent: string,
): void {
  const flap = Math.sin(time * 1.6) * 0.18;
  // Asas múltiplas.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const side of [-1, 1]) {
    for (let w = 0; w < 3; w++) {
      ctx.save();
      ctx.translate(side * 14, -140 + w * 14);
      ctx.rotate(side * (0.55 + w * 0.22 + flap * (1 - w * 0.2)));
      const len = 96 - w * 20;
      ctx.fillStyle = hexToRgba(accent, 0.14 - w * 0.03);
      ctx.beginPath();
      ctx.ellipse(side * len * 0.5, 0, len * 0.55, 22 - w * 4, side * 0.15, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(accent, 0.35);
      ctx.lineWidth = 1;
      ctx.stroke();
      // Penas.
      for (let f = 0; f < 4; f++) {
        ctx.strokeStyle = hexToRgba(accent, 0.28);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(side * (26 + f * 18), -10 + f * 7);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  ctx.restore();
  // Corpo.
  ctx.fillStyle = dark;
  roundRectPath(ctx, -26, -156, 52, 86, 10);
  ctx.fill();
  ctx.fillStyle = col;
  roundRectPath(ctx, -22, -160, 44, 56, 8);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Detalhes dourados.
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, -150);
  ctx.lineTo(0, -132);
  ctx.lineTo(14, -150);
  ctx.moveTo(0, -132);
  ctx.lineTo(0, -106);
  ctx.stroke();
  // Pernas / saia.
  ctx.fillStyle = tintShade(col);
  ctx.beginPath();
  ctx.moveTo(-22, -74);
  ctx.lineTo(-34, -4);
  ctx.lineTo(-12, -26);
  ctx.lineTo(0, 0);
  ctx.lineTo(12, -26);
  ctx.lineTo(34, -4);
  ctx.lineTo(22, -74);
  ctx.closePath();
  ctx.fill();
  // Cabeça.
  ctx.fillStyle = '#f0e6cf';
  ctx.beginPath();
  ctx.ellipse(0, -178, 13, 15, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(5, -178, 2.4, 0, TAU);
  ctx.fill();
  // Lágrima de luz.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(5, -168, 2, 0, TAU);
  ctx.fill();
  ctx.restore();
  // Aurora partida.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = hexToRgba(accent, 0.85);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -202, 30, 0.2, Math.PI * 1.5);
  ctx.stroke();
  ctx.strokeStyle = hexToRgba(accent, 0.3);
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.restore();
  // Espada.
  const armAng = b.state === 'execute' ? 1.2 : b.state === 'windup' ? -1.0 : 0.1;
  const hand = joint(26, -144, 42, armAng);
  limb(ctx, 22, -146, hand.x, hand.y, 8, col);
  const tip = joint(hand.x, hand.y, 96, armAng + 0.25);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(hand.x, hand.y, tip.x, tip.y);
  g.addColorStop(0, 'rgba(255,240,180,0.2)');
  g.addColorStop(0.5, '#fff2b0');
  g.addColorStop(1, '#ffffff');
  ctx.strokeStyle = g;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(hand.x, hand.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();
  ctx.lineWidth = 16;
  ctx.globalAlpha = 0.25;
  ctx.stroke();
  ctx.restore();
  // Manchas de corrupção.
  ctx.fillStyle = 'rgba(40, 12, 30, 0.5)';
  ctx.beginPath();
  ctx.ellipse(-14, -120, 6, 12, 0.3, 0, TAU);
  ctx.ellipse(10, -96, 5, 8, -0.2, 0, TAU);
  ctx.fill();
  glow(ctx, 0, -140, 100, accent, 0.12);
}

function drawFerrato(
  ctx: CanvasRenderingContext2D,
  b: Boss,
  time: number,
  col: string,
  dark: string,
  accent: string,
): void {
  const phase = b.phaseIndex;
  const pulse = Math.sin(time * 1.4) * 10;
  // Corpo amorfo com anéis.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const r = 100 + i * 34 + Math.sin(time * (0.5 + i * 0.17) + i) * 12;
    ctx.strokeStyle = hexToRgba(i % 2 === 0 ? accent : b.def.colors.glow, 0.25 - i * 0.04);
    ctx.lineWidth = 2 + (i % 2);
    ctx.beginPath();
    ctx.ellipse(0, -150, r, r * 0.34, time * (0.14 + i * 0.04), 0, TAU);
    ctx.stroke();
  }
  ctx.restore();

  // Massa central com gradiente cósmico.
  const g = ctx.createRadialGradient(-20, -180, 10, 0, -150, 150);
  g.addColorStop(0, phase >= 2 ? '#ff8ae2' : '#6ff2ff');
  g.addColorStop(0.3, col);
  g.addColorStop(0.7, dark);
  g.addColorStop(1, 'rgba(4,2,10,0.95)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-70, -90);
  ctx.quadraticCurveTo(-120 + pulse, -160, -80, -230);
  ctx.quadraticCurveTo(-40, -300, 10, -270);
  ctx.quadraticCurveTo(70, -310, 110, -230);
  ctx.quadraticCurveTo(140 + pulse * 0.5, -150, 80, -80);
  ctx.quadraticCurveTo(20, -30, -30, -60);
  ctx.closePath();
  ctx.fill();

  // Estrelas dentro do corpo.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * TAU + time * 0.1;
    const rr = 30 + ((i * 37) % 80);
    const px = Math.cos(a) * rr;
    const py = -150 + Math.sin(a) * rr * 0.7;
    const tw = 0.4 + Math.sin(time * 3 + i) * 0.4;
    ctx.fillStyle = `rgba(255,255,255,${0.3 + tw * 0.5})`;
    ctx.fillRect(px, py, 1.6 + tw, 1.6 + tw);
  }
  ctx.restore();

  // Olhos: quantidade muda por fase.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const eyeCount = 3 + phase * 2;
  for (let i = 0; i < eyeCount; i++) {
    const ex = -50 + ((i * 53) % 110);
    const ey = -210 + ((i * 37) % 100);
    const er = 6 + (i % 3) * 3;
    const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, er * 2.4);
    eg.addColorStop(0, '#ffffff');
    eg.addColorStop(0.3, b.def.colors.eye);
    eg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(ex, ey, er * 2.4, 0, TAU);
    ctx.fill();
    // Pupila fendida.
    ctx.fillStyle = '#05010a';
    ctx.beginPath();
    ctx.ellipse(ex, ey, er * 0.25, er, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // Tentáculos / membros.
  ctx.strokeStyle = col;
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * TAU + Math.sin(time * 0.7 + i) * 0.3;
    const len = 120 + i * 12;
    const sx = Math.cos(ang) * 40;
    const sy = -150 + Math.sin(ang) * 40;
    const ex = Math.cos(ang) * len;
    const ey = -150 + Math.sin(ang) * len + Math.sin(time * 2 + i) * 20;
    ctx.lineWidth = 14 - i;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo((sx + ex) / 2 + 20, (sy + ey) / 2 - 30, ex, ey);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Núcleo pulsante.
  const coreScale = 1 + Math.sin(time * 3) * 0.08;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const core = ctx.createRadialGradient(0, -150, 0, 0, -150, 46 * coreScale);
  core.addColorStop(0, '#ffffff');
  core.addColorStop(0.25, b.def.colors.glow);
  core.addColorStop(0.6, hexToRgba(accent, 0.5));
  core.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, -150, 46 * coreScale, 0, TAU);
  ctx.fill();
  ctx.restore();

  // Coroa de "vozes" — pequenos ecos ao redor.
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 6; i++) {
    const a = time * 0.4 + (i * TAU) / 6;
    const px = Math.cos(a) * 150;
    const py = -180 + Math.sin(a) * 60;
    ctx.fillStyle = hexToRgba(accent, 0.5);
    ctx.beginPath();
    ctx.ellipse(px, py, 3, 9, a, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  void b;
}
