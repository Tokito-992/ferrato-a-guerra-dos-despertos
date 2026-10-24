/** Sistema de partículas leve, com vários estilos visuais para habilidades. */

import { clamp, easeOutCubic, rand, TAU } from './math.js';

export type ParticleKind =
  | 'spark'
  | 'ember'
  | 'smoke'
  | 'ring'
  | 'shard'
  | 'star'
  | 'feather'
  | 'slash'
  | 'bolt'
  | 'orb'
  | 'text'
  | 'glow'
  | 'magma'
  | 'rune';

interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  color2: string;
  gravity: number;
  drag: number;
  rot: number;
  vrot: number;
  text: string;
  points: { x: number; y: number }[];
  screen: boolean;
  maxR: number;
  lineWidth: number;
  additive: boolean;
  flicker: number;
  delay: number;
}

export type ParticleOptions = Partial<Omit<Particle, 'life' | 'maxLife'>> & {
  x: number;
  y: number;
  kind?: ParticleKind;
  life?: number;
};

export class ParticleSystem {
  private items: Particle[] = [];

  get count(): number {
    return this.items.length;
  }

  spawn(opts: ParticleOptions): void {
    if (this.items.length > 1400) this.items.shift();
    const life = opts.life ?? 0.6;
    this.items.push({
      kind: opts.kind ?? 'spark',
      x: opts.x,
      y: opts.y,
      vx: opts.vx ?? 0,
      vy: opts.vy ?? 0,
      life,
      maxLife: life,
      size: opts.size ?? 4,
      color: opts.color ?? '#ffffff',
      color2: opts.color2 ?? opts.color ?? '#ffffff',
      gravity: opts.gravity ?? 0,
      drag: opts.drag ?? 0.9,
      rot: opts.rot ?? 0,
      vrot: opts.vrot ?? 0,
      text: opts.text ?? '',
      points: opts.points ?? [],
      screen: opts.screen ?? false,
      maxR: opts.maxR ?? 60,
      lineWidth: opts.lineWidth ?? 3,
      additive: opts.additive ?? true,
      flicker: opts.flicker ?? 0,
      delay: opts.delay ?? 0,
    });
  }

  burst(
    x: number,
    y: number,
    count: number,
    color: string,
    opts: {
      speed?: number;
      size?: number;
      life?: number;
      gravity?: number;
      kind?: ParticleKind;
      spread?: number;
      angle?: number;
      color2?: string;
      screen?: boolean;
    } = {},
  ): void {
    const speed = opts.speed ?? 220;
    const spread = opts.spread ?? TAU;
    const base = opts.angle ?? 0;
    for (let i = 0; i < count; i++) {
      const a = base + rand(-spread / 2, spread / 2);
      const v = rand(speed * 0.25, speed);
      this.spawn({
        kind: opts.kind ?? 'spark',
        x: x + rand(-4, 4),
        y: y + rand(-4, 4),
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: (opts.life ?? 0.55) * rand(0.6, 1.3),
        size: (opts.size ?? 3) * rand(0.7, 1.5),
        color,
        color2: opts.color2 ?? color,
        gravity: opts.gravity ?? 380,
        drag: 1.6,
        screen: opts.screen ?? false,
        vrot: rand(-8, 8),
        flicker: 1,
      });
    }
  }

  ring(
    x: number,
    y: number,
    color: string,
    maxR: number,
    life = 0.45,
    lineWidth = 4,
    screen = false,
  ): void {
    this.spawn({
      kind: 'ring',
      x,
      y,
      color,
      maxR,
      life,
      size: lineWidth,
      lineWidth,
      screen,
      additive: true,
    });
  }

  slash(
    x: number,
    y: number,
    angle: number,
    color: string,
    radius = 70,
    life = 0.22,
    screen = false,
  ): void {
    this.spawn({
      kind: 'slash',
      x,
      y,
      rot: angle,
      color,
      color2: '#ffffff',
      maxR: radius,
      size: radius,
      life,
      screen,
      additive: true,
    });
  }

  bolt(
    points: { x: number; y: number }[],
    color: string,
    life = 0.16,
    width = 3,
    screen = false,
  ): void {
    if (points.length < 2) return;
    const jittered: { x: number; y: number }[] = [{ ...points[0] }];
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const segs = 4;
      for (let s = 1; s <= segs; s++) {
        const t = s / segs;
        const nx = a.x + (b.x - a.x) * t;
        const ny = a.y + (b.y - a.y) * t;
        if (s < segs) {
          jittered.push({ x: nx + rand(-9, 9), y: ny + rand(-9, 9) });
        } else {
          jittered.push({ x: nx, y: ny });
        }
      }
    }
    this.spawn({
      kind: 'bolt',
      x: points[0].x,
      y: points[0].y,
      points: jittered,
      color,
      life,
      size: width,
      lineWidth: width,
      screen,
      additive: true,
    });
  }

  text(
    x: number,
    y: number,
    text: string,
    color = '#ffffff',
    size = 20,
    screen = false,
    life = 0.85,
  ): void {
    this.spawn({
      kind: 'text',
      x,
      y,
      vx: rand(-18, 18),
      vy: -90,
      text,
      color,
      size,
      life,
      screen,
      additive: false,
      drag: 1.4,
    });
  }

  rune(x: number, y: number, color: string, size = 34): void {
    this.spawn({
      kind: 'rune',
      x,
      y,
      vx: rand(-25, 25),
      vy: rand(-70, -20),
      life: 0.7,
      size,
      color,
      lineWidth: 2,
      vrot: rand(-4, 4),
      additive: true,
    });
  }

  clear(screen?: boolean): void {
    this.items = screen === undefined ? [] : this.items.filter((p) => p.screen !== screen);
  }

  update(dt: number): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      if (p.delay > 0) {
        p.delay -= dt;
        continue;
      }
      p.life -= dt;
      if (p.life <= 0) {
        this.items.splice(i, 1);
        continue;
      }
      const dragFactor = Math.exp(-p.drag * dt);
      p.vx *= dragFactor;
      p.vy *= dragFactor;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vrot * dt;
    }
  }

  draw(ctx: CanvasRenderingContext2D, screen = false): void {
    ctx.save();
    for (const p of this.items) {
      if (p.screen !== screen) continue;
      if (p.delay > 0) continue;
      const t = 1 - p.life / p.maxLife;
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalCompositeOperation = p.additive ? 'lighter' : 'source-over';
      ctx.globalAlpha = alpha;
      switch (p.kind) {
        case 'spark': {
          const len = clamp(Math.hypot(p.vx, p.vy) * 0.02, 2, 16);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1, p.size * alpha);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.012 - len, p.y - p.vy * 0.012);
          ctx.stroke();
          break;
        }
        case 'ember': {
          const flick = p.flicker ? 0.65 + Math.random() * 0.35 : 1;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.5, p.size * alpha * flick), 0, TAU);
          ctx.fill();
          break;
        }
        case 'magma': {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 1.8);
          grad.addColorStop(0, '#fff3b0');
          grad.addColorStop(0.4, p.color);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.8 * (0.6 + alpha * 0.6), 0, TAU);
          ctx.fill();
          break;
        }
        case 'smoke': {
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha * 0.28;
          const r = p.size * (1 + t * 2.4);
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, TAU);
          ctx.fill();
          break;
        }
        case 'glow': {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * (0.8 + t * 0.8));
          grad.addColorStop(0, p.color);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.8 + t * 0.8), 0, TAU);
          ctx.fill();
          break;
        }
        case 'ring': {
          const r = p.maxR * easeOutCubic(t);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(0.7, p.lineWidth * (1 - t));
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, TAU);
          ctx.stroke();
          if (p.color2 !== p.color) {
            ctx.strokeStyle = p.color2;
            ctx.lineWidth = Math.max(0.5, p.lineWidth * 0.4 * (1 - t));
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 0.94, 0, TAU);
            ctx.stroke();
          }
          break;
        }
        case 'shard': {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.55, p.size * 0.8);
          ctx.lineTo(-p.size * 0.55, p.size * 0.5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
        }
        case 'star': {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          const s = p.size * (0.4 + alpha * 0.8);
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * TAU;
            ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
            ctx.lineTo(Math.cos(a + TAU / 8) * s * 0.3, Math.sin(a + TAU / 8) * s * 0.3);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
        }
        case 'feather': {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.4, p.size, 0, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = p.color2;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 0.8);
          ctx.lineTo(0, p.size * 0.8);
          ctx.stroke();
          ctx.restore();
          break;
        }
        case 'slash': {
          const sweep = clamp(t * 2.6, 0, 1);
          const start = -0.9;
          const end = start + 1.9 * sweep;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.strokeStyle = p.color2;
          ctx.lineWidth = Math.max(1, p.lineWidth * (1 - t) * 2);
          ctx.beginPath();
          ctx.arc(0, 0, p.maxR * (0.75 + t * 0.35), start, end);
          ctx.stroke();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1, p.lineWidth * (1 - t) * 5);
          ctx.beginPath();
          ctx.arc(0, 0, p.maxR * (0.7 + t * 0.3), start + 0.1, end);
          ctx.stroke();
          ctx.restore();
          break;
        }
        case 'bolt': {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.lineWidth * 2.4 * alpha;
          ctx.globalAlpha = alpha * 0.45;
          this.strokePoints(ctx, p.points);
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = p.color2;
          ctx.lineWidth = Math.max(0.8, p.lineWidth * alpha);
          this.strokePoints(ctx, p.points);
          break;
        }
        case 'orb': {
          const r = p.size * (1 - t * 0.25);
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
          grad.addColorStop(0, p.color2);
          grad.addColorStop(0.45, p.color);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, TAU);
          ctx.fill();
          break;
        }
        case 'rune': {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1, p.lineWidth * alpha);
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, TAU);
          ctx.stroke();
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * TAU;
            const b = ((i + 2) / 6) * TAU;
            ctx.moveTo(Math.cos(a) * p.size * 0.8, Math.sin(a) * p.size * 0.8);
            ctx.lineTo(Math.cos(b) * p.size * 0.8, Math.sin(b) * p.size * 0.8);
          }
          ctx.stroke();
          ctx.restore();
          break;
        }
        case 'text': {
          ctx.globalCompositeOperation = 'source-over';
          ctx.font = `800 ${p.size}px Rajdhani, Segoe UI, sans-serif`;
          ctx.textAlign = 'center';
          ctx.lineWidth = 4;
          ctx.strokeStyle = 'rgba(0,0,0,0.75)';
          ctx.strokeText(p.text, p.x, p.y);
          ctx.fillStyle = p.color;
          ctx.fillText(p.text, p.x, p.y);
          break;
        }
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  private strokePoints(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]): void {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  }
}
