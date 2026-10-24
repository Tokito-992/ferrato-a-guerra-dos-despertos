/** Ilustração procedural de inimigos e chefes. */

import { clamp, hexToRgba, mixColor, TAU } from '../core/math.js';
import type { Enemy } from '../entities/enemy.js';
import type { Boss } from '../entities/boss.js';
import { getStage } from '../data/stages.js';
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

export function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, time: number): void {
  const c = e.def;
  const flash = e.hitFlash;
  const col = tint(c.color, flash);
  const accent = tint(c.accent, flash);
  const dark = tint('#0d0a12', flash);
  const scale = e.scale;
  const bob = e.def.flying ? Math.sin(time * 2.4 + e.animPhase) * 4 : 0;
  const walk = Math.sin(e.walkPhase);

  shadow(ctx, e.x, e.def.flying ? e.stage.floor + 2 : e.y + 2, 22 * scale);

  ctx.save();
  ctx.translate(e.x, e.y + bob);
  ctx.scale(e.facing * scale, scale);
  ctx.globalAlpha = e.alpha;

  if (e.dead) {
    ctx.rotate(-Math.min(1.3, e.deathTimer * 2));
  }

  // Aura de elite.
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
    // Coroa de elite.
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.85;
    const y = -e.h - 16;
    ctx.beginPath();
    ctx.moveTo(-12, y);
    ctx.lineTo(-8, y - 9);
    ctx.lineTo(-3, y - 2);
    ctx.lineTo(2, y - 11);
    ctx.lineTo(7, y - 2);
    ctx.lineTo(12, y - 8);
    ctx.lineTo(11, y + 2);
    ctx.lineTo(-11, y + 2);
    ctx.closePath();
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
  const crouch = e.state === 'windup' ? 0.3 : 0;
  ctx.translate(0, crouch * 10);
  // Pernas articuladas.
  ctx.strokeStyle = dark;
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const side = i < 2 ? -1 : 1;
    const px = side * (10 + (i % 2) * 8);
    const ph = walk * (i % 2 === 0 ? 1 : -1) + i;
    ctx.beginPath();
    ctx.moveTo(px, -20);
    ctx.lineTo(px + side * 12, -12 + Math.sin(ph) * 3);
    ctx.lineTo(px + side * 20, -2 + Math.cos(ph) * 3);
    ctx.stroke();
  }
  // Corpo.
  const grad = ctx.createLinearGradient(-30, -34, 30, -10);
  grad.addColorStop(0, col);
  grad.addColorStop(1, dark);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, -22, 31, 15, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Placas.
  ctx.fillStyle = tintShade(col);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(-12 + i * 12, -30, 9, 5, -0.2, 0, TAU);
    ctx.fill();
  }
  // Espinhos.
  ctx.fillStyle = dark;
  for (let i = 0; i < 4; i++) {
    const sx = -18 + i * 11;
    ctx.beginPath();
    ctx.moveTo(sx, -32);
    ctx.lineTo(sx + 3, -44 - (i % 2) * 4);
    ctx.lineTo(sx + 6, -32);
    ctx.fill();
  }
  // Cabeça / mandíbula.
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(26, -20, 12, 10, 0.2, 0, TAU);
  ctx.fill();
  // Olhos brilhantes.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(30, -23, 3.2, 0, TAU);
  ctx.arc(23, -25, 2, 0, TAU);
  ctx.fill();
  // Faucinas.
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(34, -16);
  ctx.lineTo(40, -13);
  ctx.moveTo(30, -14);
  ctx.lineTo(35, -10);
  ctx.stroke();
  ctx.restore();
  // Emissão de calor.
  glow(ctx, 30, -22, 16, e.def.glow, 0.35);
  void time;
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
  // Pernas.
  limb(ctx, -5, -40, -9 + walk * 5, -20, 7, dark);
  limb(ctx, -9 + walk * 5, -20, -11 + walk * 8, 0, 6, tintShade(col));
  limb(ctx, 5, -40, 9 - walk * 5, -20, 7, dark);
  limb(ctx, 9 - walk * 5, -20, 12 - walk * 8, 0, 6, tintShade(col));
  // Torso.
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(-12, -38);
  ctx.lineTo(-14, -64);
  ctx.quadraticCurveTo(0, -76, 14, -64);
  ctx.lineTo(12, -38);
  ctx.lineTo(0, -32);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // Peitoral.
  ctx.fillStyle = tintShade(dark);
  roundRectPath(ctx, -10, -66, 20, 18, 4);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(0, -57, 3, 0, TAU);
  ctx.fill();
  // Ombros.
  ctx.fillStyle = tintShade(col);
  ctx.beginPath();
  ctx.ellipse(-14, -66, 9, 6, -0.4, 0, TAU);
  ctx.ellipse(14, -66, 9, 6, 0.4, 0, TAU);
  ctx.fill();
  // Cabeça com elmo.
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(0, -84, 10, 11, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(4, -84, 3, 2, 0, 0, TAU);
  ctx.fill();
  // Crista.
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-2, -94);
  ctx.quadraticCurveTo(-8, -104, -4, -112);
  ctx.stroke();
  // Braço com lâmina.
  const shoulder = { x: 11, y: -64 };
  const elbow = joint(shoulder.x, shoulder.y, 16, armSwing);
  const hand = joint(elbow.x, elbow.y, 16, armSwing + 0.4);
  limb(ctx, shoulder.x, shoulder.y, elbow.x, elbow.y, 6, col);
  limb(ctx, elbow.x, elbow.y, hand.x, hand.y, 5, tintShade(col));
  ctx.save();
  ctx.translate(hand.x, hand.y);
  ctx.rotate(armSwing * 0.9);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(0, -3);
  ctx.lineTo(42, -7);
  ctx.lineTo(48, 0);
  ctx.lineTo(40, 4);
  ctx.lineTo(0, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
  // Escudo / braço esquerdo.
  const shieldArm = joint(-11, -62, 20, -0.5 + walk * 0.1);
  limb(ctx, -11, -62, shieldArm.x, shieldArm.y, 6, col);
  ctx.fillStyle = tintShade(dark);
  ctx.beginPath();
  ctx.ellipse(shieldArm.x - 2, shieldArm.y + 2, 9, 13, 0.2, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.stroke();
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
  // Corpo flutuante.
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(0, -34, 22, 16, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(0, -38, 18, 12, 0, Math.PI, TAU);
  ctx.fill();
  // Anel rotativo.
  ctx.save();
  ctx.translate(0, -34);
  ctx.rotate(time * 1.6);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.ellipse(0, 0, 28, 9, 0.25, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 7, -0.5, 0, TAU);
  ctx.stroke();
  ctx.restore();
  // Olho.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(4, -38, 0, 4, -38, 10);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.4, accent);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(4, -38, 10, 0, TAU);
  ctx.fill();
  ctx.restore();
  // Propulsores.
  for (const side of [-1, 1]) {
    ctx.fillStyle = col;
    ctx.fillRect(side * 16 - 3, -26, 6, 8);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.5 + Math.random() * 0.3;
    ctx.beginPath();
    ctx.moveTo(side * 16 - 3, -18);
    ctx.lineTo(side * 16, -8 - Math.random() * 6);
    ctx.lineTo(side * 16 + 3, -18);
    ctx.fill();
    ctx.restore();
  }
  // Antenas.
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-10, -50);
  ctx.lineTo(-16, -60);
  ctx.moveTo(8, -50);
  ctx.lineTo(14, -58);
  ctx.stroke();
  void e;
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
  // Pernas.
  ctx.strokeStyle = dark;
  ctx.lineWidth = 5;
  for (let i = 0; i < 4; i++) {
    const px = -20 + i * 14;
    const ph = walk * 1.4 + i * 1.3;
    ctx.beginPath();
    ctx.moveTo(px, -22);
    ctx.lineTo(px + Math.sin(ph) * 4, -10);
    ctx.lineTo(px + Math.sin(ph) * 7, 0);
    ctx.stroke();
  }
  // Corpo esguio.
  const grad = ctx.createLinearGradient(-30, -34, 26, -14);
  grad.addColorStop(0, dark);
  grad.addColorStop(0.5, col);
  grad.addColorStop(1, dark);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, -24, 30, 13, -0.06, 0, TAU);
  ctx.fill();
  // Crina de brasas.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const fx = -16 + i * 8;
    const fh = 8 + Math.sin(time * 9 + i) * 4;
    ctx.fillStyle = hexToRgba(accent, 0.55);
    ctx.beginPath();
    ctx.moveTo(fx - 4, -32);
    ctx.quadraticCurveTo(fx, -32 - fh, fx + 4, -32);
    ctx.fill();
  }
  ctx.restore();
  // Cabeça.
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(28, -30, 13, 10, 0.1, 0, TAU);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(34, -34);
  ctx.lineTo(46, -30);
  ctx.lineTo(36, -24);
  ctx.closePath();
  ctx.fill();
  // Olho.
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(32, -33, 2.6, 0, TAU);
  ctx.fill();
  // Presas.
  ctx.fillStyle = '#fff1d0';
  ctx.beginPath();
  ctx.moveTo(38, -24);
  ctx.lineTo(39, -19);
  ctx.lineTo(41, -24);
  ctx.fill();
  // Espinhos.
  ctx.fillStyle = tintShade(col);
  for (let i = 0; i < 3; i++) {
    const sx = -10 + i * 10;
    ctx.beginPath();
    ctx.moveTo(sx, -34);
    ctx.lineTo(sx + 3, -44);
    ctx.lineTo(sx + 6, -34);
    ctx.fill();
  }
  void e;
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
  // Manto.
  const g = ctx.createLinearGradient(0, -86, 0, 0);
  g.addColorStop(0, col);
  g.addColorStop(0.6, dark);
  g.addColorStop(1, 'rgba(10,6,12,0.1)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-18, -72);
  ctx.quadraticCurveTo(-34, -30, -24, 2);
  ctx.quadraticCurveTo(0, -10, 24, 2);
  ctx.quadraticCurveTo(34, -30, 18, -72);
  ctx.quadraticCurveTo(0, -84, -18, -72);
  ctx.fill();
  // Capuz.
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(0, -78, 16, Math.PI * 0.95, TAU * 1.05);
  ctx.fill();
  // Vazio e olhos.
  ctx.fillStyle = '#050308';
  ctx.beginPath();
  ctx.ellipse(0, -78, 10, 12, 0, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(-4, -80, 2.4, 0, TAU);
  ctx.arc(5, -80, 2.4, 0, TAU);
  ctx.fill();
  ctx.restore();
  // Mãos com magia.
  for (const side of [-1, 1]) {
    const hx = side * 30;
    const hy = -48 + Math.sin(time * 3 + side) * 4;
    ctx.strokeStyle = col;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(side * 16, -62);
    ctx.quadraticCurveTo(side * 26, -56, hx, hy);
    ctx.stroke();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 11);
    gg.addColorStop(0, '#ffffff');
    gg.addColorStop(0.4, accent);
    gg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.arc(hx, hy, 11, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  // Runas flutuantes.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, -8, 26, 8, 0, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const a = time * 0.9 + (i * TAU) / 4;
    ctx.fillStyle = accent;
    ctx.fillRect(Math.cos(a) * 26 - 1, -8 + Math.sin(a) * 8, 2, 2);
  }
  ctx.restore();
  void e;
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
  // Pernas grossas.
  limb(ctx, -13, -42, -17 + walk * 5, -20, 14, dark);
  limb(ctx, -17 + walk * 5, -20, -19 + walk * 6, 0, 12, tintShade(col));
  limb(ctx, 13, -42, 17 - walk * 5, -20, 14, dark);
  limb(ctx, 17 - walk * 5, -20, 19 - walk * 6, 0, 12, tintShade(col));
  // Torso gigante.
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
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Fornalha no peito.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.5 + Math.sin(time * 5) * 0.2;
  ctx.beginPath();
  ctx.ellipse(0, -74, 10, 12, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#ffe6a3';
  ctx.beginPath();
  ctx.ellipse(0, -74, 4, 6, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  // Ombros enormes.
  ctx.fillStyle = tintShade(dark);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * 30, -98, 16, 12, side * 0.3, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // Cabeça pequena.
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(0, -116, 12, 0, TAU);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(5, -118, 2.6, 0, TAU);
  ctx.fill();
  // Chifres.
  ctx.strokeStyle = tintShade(col);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-8, -124);
  ctx.quadraticCurveTo(-16, -136, -10, -142);
  ctx.moveTo(8, -124);
  ctx.quadraticCurveTo(16, -136, 10, -142);
  ctx.stroke();
  // Braço com cutelo.
  const armAng = e.state === 'attack' ? 1.2 : e.state === 'windup' ? -1.2 : 0.2;
  const shoulder = { x: 22, y: -96 };
  const elbow = joint(shoulder.x, shoulder.y, 22, armAng);
  const hand = joint(elbow.x, elbow.y, 22, armAng + 0.2);
  limb(ctx, shoulder.x, shoulder.y, elbow.x, elbow.y, 12, col);
  limb(ctx, elbow.x, elbow.y, hand.x, hand.y, 10, tintShade(col));
  ctx.save();
  ctx.translate(hand.x, hand.y);
  ctx.rotate(armAng * 0.8);
  ctx.fillStyle = tintShade(dark);
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(36, -14);
  ctx.lineTo(42, 0);
  ctx.lineTo(34, 10);
  ctx.lineTo(0, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
  // Correntes.
  ctx.strokeStyle = 'rgba(190, 170, 140, 0.5)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-24, -60);
  ctx.quadraticCurveTo(-36, -40, -26, -18);
  ctx.stroke();
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
  // Cabeça / máscara.
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(0, -82, 12, 14, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, -82, 12, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(-4, -84, 2, 0, TAU);
  ctx.arc(5, -84, 2, 0, TAU);
  ctx.fill();
  // Braços espectrais.
  ctx.strokeStyle = hexToRgba(accent, 0.65);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-14, -64);
  ctx.quadraticCurveTo(-28, -54 + wave * 3, -22, -40);
  ctx.moveTo(14, -64);
  ctx.quadraticCurveTo(28, -54 - wave * 3, 22, -40);
  ctx.stroke();
  // Correntes.
  ctx.strokeStyle = hexToRgba(accent, 0.5);
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-18 + i * 30, -70);
    ctx.quadraticCurveTo(-24 + i * 38, -40, -10 + i * 22, -10);
    ctx.stroke();
  }
  // Aura.
  glow(ctx, 0, -60, 40, accent, 0.12 + Math.sin(time * 3) * 0.03);
  void e;
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
  // Pernas geométricas.
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(-12, -30);
  ctx.lineTo(-20, 0);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-4, -30);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(12, -30);
  ctx.lineTo(20, 0);
  ctx.lineTo(10, 0);
  ctx.lineTo(4, -30);
  ctx.fill();
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
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.3;
  ctx.stroke();
  // Rachaduras luminosas.
  ctx.strokeStyle = hexToRgba(accent, 0.8);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -98);
  ctx.lineTo(-6, -78);
  ctx.lineTo(4, -64);
  ctx.lineTo(-2, -44);
  ctx.stroke();
  // Núcleo.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const cg = ctx.createRadialGradient(0, -64, 0, 0, -64, 18);
  cg.addColorStop(0, '#ffffff');
  cg.addColorStop(0.4, accent);
  cg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(0, -64, 18, 0, TAU);
  ctx.fill();
  ctx.restore();
  // Cabeça angular.
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(0, -118);
  ctx.lineTo(12, -104);
  ctx.lineTo(0, -96);
  ctx.lineTo(-12, -104);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(0, -106, 2.5, 0, TAU);
  ctx.fill();
  // Fragmentos flutuantes.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const a = time * 0.8 + (i * TAU) / 4;
    const px = Math.cos(a) * 32;
    const py = -66 + Math.sin(a) * 16;
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
  void e;
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
  // Asas.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 8, -72);
    ctx.rotate(side * (0.4 + flap));
    for (let i = 0; i < 3; i++) {
      const len = 36 - i * 8;
      ctx.fillStyle = hexToRgba(accent, 0.18 - i * 0.03);
      ctx.beginPath();
      ctx.ellipse(side * (14 + i * 8), -8 + i * 9, len, 9 - i * 1.5, side * 0.3, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(accent, 0.35);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
  // Corpo.
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(-10, -40);
  ctx.quadraticCurveTo(-14, -70, -8, -82);
  ctx.lineTo(8, -82);
  ctx.quadraticCurveTo(14, -70, 10, -40);
  ctx.closePath();
  ctx.fill();
  // Saia rasgada.
  ctx.fillStyle = tintShade(dark);
  ctx.beginPath();
  ctx.moveTo(-10, -44);
  ctx.lineTo(-18, -4);
  ctx.lineTo(-6, -18);
  ctx.lineTo(0, 0);
  ctx.lineTo(6, -18);
  ctx.lineTo(18, -4);
  ctx.lineTo(10, -44);
  ctx.closePath();
  ctx.fill();
  // Cabeça.
  ctx.fillStyle = '#efe6cf';
  ctx.beginPath();
  ctx.ellipse(0, -90, 9, 10, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(4, -90, 1.8, 0, TAU);
  ctx.fill();
  // Aurora quebrada.
  ctx.strokeStyle = hexToRgba(accent, 0.8);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -104, 14, 0.4, Math.PI * 1.4);
  ctx.stroke();
  // Lança.
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(16, -100);
  ctx.lineTo(24, -10);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(16, -104);
  ctx.lineTo(21, -114);
  ctx.lineTo(24, -102);
  ctx.fill();
  // Manchas de corrupção.
  ctx.fillStyle = 'rgba(40, 10, 30, 0.55)';
  ctx.beginPath();
  ctx.ellipse(-4, -66, 5, 9, 0.3, 0, TAU);
  ctx.fill();
  glow(ctx, 0, -60, 46, accent, 0.1);
  void e;
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
    ctx.globalAlpha = i === 0 ? 1 : 0.18;
    ctx.translate(i * 4, -i * 2);
    ctx.fillStyle = i === 0 ? col : accent;
    // Corpo humanoide.
    ctx.beginPath();
    ctx.ellipse(0, -86, 10, 12, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-11, -74);
    ctx.quadraticCurveTo(-16, -50, -12, -32);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-4, -30);
    ctx.lineTo(4, -30);
    ctx.lineTo(6, 0);
    ctx.lineTo(20, 0);
    ctx.lineTo(12, -32);
    ctx.quadraticCurveTo(16, -50, 11, -74);
    ctx.closePath();
    ctx.fill();
    // Braços com lâminas de eco.
    ctx.strokeStyle = i === 0 ? tintShade(col) : accent;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-10, -68);
    ctx.lineTo(-20, -48 + walk * 4);
    ctx.moveTo(10, -68);
    ctx.lineTo(22, -50 - walk * 4);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-22, -48);
    ctx.lineTo(-30, -30);
    ctx.moveTo(24, -50);
    ctx.lineTo(32, -32);
    ctx.stroke();
    ctx.restore();
  }
  // Faixas de scanline.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 5; i++) {
    const y = -92 + ((time * 60 + i * 22) % 92);
    ctx.fillStyle = accent;
    ctx.fillRect(-20, y, 40, 1);
  }
  ctx.restore();
  // Olhos.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-3, -88, 1.6, 0, TAU);
  ctx.arc(4, -88, 1.6, 0, TAU);
  ctx.fill();
  glow(ctx, 0, -50, 46, accent, 0.16);
  void e;
  void dark;
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
