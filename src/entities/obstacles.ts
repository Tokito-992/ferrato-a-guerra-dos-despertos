/** Obstáculos de arena: fraturas hostis, santuários, âncoras e sobrecargas. */

import { clamp, rand, TAU } from '../core/math.js';
import type { World } from '../core/types.js';
import type { StageDef } from '../data/stages.js';
import { drawHeart } from '../render/hearts.js';
import { FONTS, glow, label } from '../render/theme.js';

export type ObstacleKind = 'fracture' | 'sanctuary' | 'anchor' | 'overcharge';

export interface ObstacleOptions {
  temporary?: boolean;
  life?: number;
}

interface ObstacleVisual {
  name: string;
  color: string;
  accent: string;
}

const VISUALS: Record<ObstacleKind, ObstacleVisual> = {
  fracture: { name: 'FRATURA', color: '#ff5a3c', accent: '#ffd166' },
  sanctuary: { name: 'SANTUÁRIO', color: '#8df4a8', accent: '#fff4cd' },
  anchor: { name: 'ÂNCORA', color: '#9a7bff', accent: '#6ff2ff' },
  overcharge: { name: 'SOBRECARGA', color: '#56e3ff', accent: '#ffffff' },
};

const FRACTURE_PERIOD = 3.35;
const FRACTURE_WARN = 0.95;
const FRACTURE_ACTIVE = 0.42;

export class StageObstacle {
  readonly kind: ObstacleKind;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly stage: StageDef;
  readonly temporary: boolean;
  life: number;
  used = false;
  phase = rand(0, TAU);
  cycle = rand(0, FRACTURE_PERIOD);
  active = false;
  flash = 0;
  private didDamage = false;

  constructor(kind: ObstacleKind, x: number, y: number, stage: StageDef, opts: ObstacleOptions = {}) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.stage = stage;
    this.radius = kind === 'anchor' ? 132 : kind === 'overcharge' ? 54 : 72;
    this.temporary = opts.temporary ?? false;
    this.life = opts.life ?? (this.temporary ? 9 : Number.POSITIVE_INFINITY);
  }

  get visual(): ObstacleVisual {
    return VISUALS[this.kind];
  }

  get expired(): boolean {
    return this.life <= 0 || (this.kind !== 'fracture' && this.used && this.kind !== 'anchor');
  }

  update(dt: number, world: World): void {
    this.life -= dt;
    this.flash = Math.max(0, this.flash - dt * 3.5);
    this.phase += dt;

    if (this.expired) return;

    if (this.kind === 'fracture') {
      this.cycle = (this.cycle + dt) % FRACTURE_PERIOD;
      const wasActive = this.active;
      this.active = this.cycle >= FRACTURE_WARN && this.cycle < FRACTURE_WARN + FRACTURE_ACTIVE;
      if (this.active && !wasActive) this.didDamage = false;
      if (this.active && !this.didDamage) {
        this.didDamage = true;
        this.erupt(world);
      }
      return;
    }

    if (this.used) return;

    if (this.kind === 'anchor') {
      this.applyAnchor(dt, world);
      return;
    }

    const p = world.player;
    if (p.dead) return;
    const distance = Math.hypot(p.x - this.x, p.centerY - (this.y - 64));
    if (distance > this.radius + 30) return;

    if (this.kind === 'sanctuary') {
      if (p.hpRatio >= 0.995) return;
      this.used = true;
      this.flash = 1;
      world.healPlayer(p.maxHp * 0.09 + 3);
      p.invuln = Math.max(p.invuln, 1);
      world.particles.ring(this.x, this.y - 54, '#8df4a8', 96, 0.55, 4);
      world.particles.burst(this.x, this.y - 54, 18, '#8df4a8', {
        speed: 190,
        gravity: -70,
        kind: 'feather',
        size: 3,
        life: 0.7,
      });
      world.text('SANTUÁRIO', this.x, this.y - 112, '#8df4a8', 16);
      world.audio.sfx('heal');
      world.flash('#8df4a8', 0.1);
    } else if (this.kind === 'overcharge') {
      this.used = true;
      this.flash = 1;
      p.abilityCd = 0;
      p.empowerTime = Math.max(p.empowerTime, 5);
      p.invuln = Math.max(p.invuln, 0.45);
      world.particles.ring(this.x, this.y - 54, '#56e3ff', 90, 0.45, 4);
      world.particles.burst(this.x, this.y - 54, 20, '#56e3ff', {
        speed: 220,
        gravity: 20,
        kind: 'star',
        size: 3,
        life: 0.6,
      });
      world.text('SOBRECARGA', this.x, this.y - 112, '#56e3ff', 16);
      world.audio.sfx('zap');
      world.flash('#56e3ff', 0.12);
    }
  }

  private erupt(world: World): void {
    const damage = 8 + this.stage.arc * 2;
    const p = world.player;
    if (!p.dead && Math.abs(p.x - this.x) < this.radius + 22 && p.y > this.y - 120) {
      world.damagePlayer(damage, {
        fromX: this.x,
        knockback: 150,
        launch: 85,
        hitstun: 0.24,
        color: this.visual.color,
      });
    }

    const enemyDamage = 18 + this.stage.arc * 5;
    for (const enemy of world.enemies) {
      if (enemy.dead) continue;
      if (Math.abs(enemy.x - this.x) > this.radius + 28) continue;
      if (enemy.y < this.y - 140) continue;
      world.damageEnemy(enemy, enemyDamage, {
        fromX: this.x,
        knockback: 190,
        launch: 125,
        hitstun: 0.38,
        color: this.visual.accent,
        status: 'burn',
        statusTime: 2,
        shake: 0.18,
      });
    }
    if (world.boss && !world.boss.dead && Math.abs(world.boss.x - this.x) < this.radius + 60) {
      world.damageEnemy(world.boss, enemyDamage * 0.7, {
        fromX: this.x,
        knockback: 0,
        hitstun: 0,
        color: this.visual.accent,
      });
    }

    world.particles.ring(this.x, this.y - 8, this.visual.color, this.radius * 1.6, 0.45, 5);
    world.particles.burst(this.x, this.y - 14, 24, this.visual.color, {
      speed: 300,
      gravity: 620,
      angle: -Math.PI / 2,
      spread: Math.PI * 0.9,
      size: 3.4,
      kind: 'magma',
      life: 0.55,
    });
    world.shake(0.38);
    world.audio.sfx('explode');
  }

  private applyAnchor(dt: number, world: World): void {
    const step = clamp(dt, 0, 0.05);
    const p = world.player;
    if (!p.dead) {
      const dx = this.x - p.x;
      const distance = Math.abs(dx);
      if (distance < this.radius * 2.4 && distance > 8) {
        const force = (1 - distance / (this.radius * 2.4)) * 280;
        p.vx += Math.sign(dx) * force * step;
      }
    }
    for (const enemy of world.enemies) {
      if (enemy.dead) continue;
      const dx = this.x - enemy.x;
      const distance = Math.abs(dx);
      if (distance > this.radius * 2.2 || distance < 8) continue;
      const force = (1 - distance / (this.radius * 2.2)) * 520;
      enemy.vx += Math.sign(dx) * force * step;
    }
    if (world.boss && !world.boss.dead) {
      const dx = this.x - world.boss.x;
      if (Math.abs(dx) < this.radius * 1.4) world.boss.vx += Math.sign(dx) * 60 * step;
    }
  }

  draw(ctx: CanvasRenderingContext2D, time: number, camX: number, viewW: number): void {
    if (this.x < camX - 180 || this.x > camX + viewW + 180) return;
    const v = this.visual;
    const pulse = 0.5 + Math.sin(time * 3.2 + this.phase) * 0.5;
    const lifeFade = this.temporary ? clamp(this.life / 1.2, 0, 1) : 1;
    const usedFade = this.used && this.kind !== 'anchor' ? 0.35 : 1;
    const alpha = lifeFade * usedFade;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (this.kind === 'fracture') {
      this.drawFracture(ctx, pulse);
    } else {
      this.drawRune(ctx, pulse, v.color, v.accent);
    }

    label(ctx, v.name, this.x, this.y - 126, 8.5, v.color, {
      align: 'center',
      font: FONTS.mono,
      spacing: 1.3,
      alpha: 0.62 + pulse * 0.2,
      outline: 'rgba(0,0,0,0.6)',
      outlineWidth: 2,
    });
    ctx.restore();
  }

  private drawFracture(ctx: CanvasRenderingContext2D, pulse: number): void {
    const v = this.visual;
    const r = this.radius;
    const active = this.active;
    const warn = this.cycle >= 0 && this.cycle < FRACTURE_WARN;
    const warnRatio = warn ? this.cycle / FRACTURE_WARN : 1;

    glow(ctx, this.x, this.y - 8, r * (active ? 1.7 : 1.1), v.color, active ? 0.4 : 0.12 + pulse * 0.06);

    ctx.save();
    ctx.strokeStyle = v.color;
    ctx.lineWidth = active ? 3 : 1.4;
    ctx.globalAlpha = active ? 0.95 : 0.35 + pulse * 0.2;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y - 4, r, 16, 0, 0, TAU);
    ctx.stroke();

    if (warn) {
      ctx.globalAlpha = 0.25 + warnRatio * 0.5;
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y - 4, r * warnRatio, 16 * warnRatio, 0, 0, TAU);
      ctx.fill();
    }

    // Rachaduras no chão.
    ctx.globalAlpha = active ? 0.95 : 0.55;
    ctx.strokeStyle = v.accent;
    ctx.lineWidth = active ? 2.6 : 1.2;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI * 0.9 + (i / 4) * Math.PI * 0.8;
      const len = r * (0.45 + (i % 3) * 0.18);
      ctx.beginPath();
      ctx.moveTo(this.x + Math.cos(a) * 8, this.y - 4);
      ctx.lineTo(this.x + Math.cos(a) * len, this.y - 4 + Math.sin(a) * 16);
      ctx.stroke();
    }

    if (active) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = v.color;
      for (let i = 0; i < 5; i++) {
        const off = (i - 2) * (r / 3.3);
        const h = 34 + Math.sin(this.phase * 15 + i) * 24;
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.moveTo(this.x + off - 9, this.y);
        ctx.quadraticCurveTo(this.x + off, this.y - h * 1.5, this.x + off + 7, this.y - h);
        ctx.quadraticCurveTo(this.x + off + 2, this.y - h * 0.4, this.x + off + 10, this.y);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private drawRune(ctx: CanvasRenderingContext2D, pulse: number, color: string, accent: string): void {
    const y = this.y - 64;
    glow(ctx, this.x, y, this.radius * (0.9 + pulse * 0.18), color, 0.22 + pulse * 0.12);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y - 4, this.radius, 15, 0, 0, TAU);
    ctx.stroke();

    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const rr = this.radius * (0.55 + i * 0.18) * (0.9 + pulse * 0.12);
      ctx.strokeStyle = i === 0 ? accent : color;
      ctx.globalAlpha = 0.25 + (2 - i) * 0.15;
      ctx.beginPath();
      ctx.ellipse(this.x, y, rr, rr * 0.42, this.phase * (0.6 + i * 0.25), 0, TAU);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, y, this.radius * 0.34, 0, TAU);
    ctx.stroke();

    if (this.kind === 'sanctuary') {
      drawHeart(ctx, this.x, y, 28, this.used ? 'rgba(255,255,255,0.25)' : '#8df4a8', {
        filled: !this.used,
        glow: this.used ? 0 : 18,
        outline: '#d9ffe5',
      });
    } else if (this.kind === 'anchor') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = this.phase * 1.4 + (i / 4) * TAU;
        const ix = this.x + Math.cos(a) * 30;
        const iy = y + Math.sin(a) * 15;
        const ox = this.x + Math.cos(a) * 52;
        const oy = y + Math.sin(a) * 26;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ix, iy);
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(ix, iy, 3, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(5,2,14,0.9)';
      ctx.beginPath();
      ctx.arc(this.x, y, 18, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.stroke();
    } else if (this.kind === 'overcharge') {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(this.x + 10, y - 28);
      ctx.lineTo(this.x - 10, y - 2);
      ctx.lineTo(this.x + 3, y - 2);
      ctx.lineTo(this.x - 12, y + 28);
      ctx.lineTo(this.x + 14, y - 6);
      ctx.lineTo(this.x + 1, y - 6);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.5;
      ctx.fill();
    }
    ctx.restore();
  }
}

/** Distribui obstáculos fixos pela fase; arcos avançados recebem mais pressão ambiental. */
export function buildStageObstacles(stage: StageDef): StageObstacle[] {
  const count = clamp(2 + Math.floor((stage.arc - 1) / 2) + (stage.chapter >= 5 ? 1 : 0), 2, 5);
  const positions = [0.16, 0.34, 0.62, 0.78, 0.9];
  const extras: ObstacleKind[] = ['anchor', 'overcharge', 'fracture'];
  const obstacles: StageObstacle[] = [];
  for (let i = 0; i < count; i++) {
    let kind: ObstacleKind;
    if (i === 0) kind = 'sanctuary';
    else if (i === 1) kind = 'fracture';
    else kind = extras[(stage.id + i) % extras.length];
    obstacles.push(new StageObstacle(kind, stage.width * positions[i], stage.floor, stage));
  }
  return obstacles;
}
