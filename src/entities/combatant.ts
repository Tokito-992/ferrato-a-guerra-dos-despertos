/** Base compartilhada por jogador, inimigos e chefes. */

import { clamp, TAU } from '../core/math.js';
import type { HitOptions, Rect, World } from '../core/types.js';

export abstract class Combatant {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  w: number;
  h: number;
  facing: 1 | -1 = 1;
  hp: number;
  maxHp: number;
  onGround = true;
  gravity = 1950;
  invuln = 0;
  hitFlash = 0;
  hitstun = 0;
  dead = false;
  deathTimer = 0;
  burnTime = 0;
  burnDps = 0;
  burnAcc = 0;
  sealTime = 0;
  markTime = 0;
  stunTime = 0;
  scale = 1;
  /** Multiplicador de dano recebido (usado por selo/marca). */
  vulnerability = 0;

  constructor(x: number, y: number, w: number, h: number, maxHp: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.maxHp = maxHp;
    this.hp = maxHp;
  }

  abstract update(dt: number, world: World): void;

  get hurtbox(): Rect {
    return { x: this.x - (this.w * this.scale) / 2, y: this.y - this.h * this.scale, w: this.w * this.scale, h: this.h * this.scale };
  }

  get centerY(): number {
    return this.y - (this.h * this.scale) / 2;
  }

  get headY(): number {
    return this.y - this.h * this.scale;
  }

  get isStunned(): boolean {
    return this.sealTime > 0 || this.stunTime > 0;
  }

  get hpRatio(): number {
    return clamp(this.hp / this.maxHp, 0, 1);
  }

  faceToward(x: number): void {
    if (Math.abs(x - this.x) > 4) this.facing = x < this.x ? -1 : 1;
  }

  tickTimers(dt: number): void {
    this.invuln = Math.max(0, this.invuln - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.hitstun = Math.max(0, this.hitstun - dt);
    this.sealTime = Math.max(0, this.sealTime - dt);
    this.stunTime = Math.max(0, this.stunTime - dt);
    this.markTime = Math.max(0, this.markTime - dt);
    this.burnTime = Math.max(0, this.burnTime - dt);
    if (this.dead) this.deathTimer += dt;
  }

  applyPhysics(dt: number, groundY: number, friction = 12): void {
    this.vy += this.gravity * dt;
    const drag = Math.exp(-friction * dt);
    if (Math.abs(this.vx) > 0) this.vx *= drag;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.y >= groundY) {
      const wasAir = !this.onGround;
      this.y = groundY;
      this.vy = 0;
      this.onGround = true;
      if (wasAir) this.onLand();
    } else {
      this.onGround = false;
    }
  }

  protected onLand(): void {
    // Sobrescrito por subclasses que precisam de feedback de pouso.
  }

  applyStatuses(dt: number, world: World): void {
    if (this.burnTime > 0 && this.burnDps > 0) {
      this.burnAcc += dt;
      if (this.burnAcc >= 0.55) {
        this.burnAcc -= 0.55;
        const dmg = Math.max(1, Math.round(this.burnDps * 0.55));
        this.hp = Math.max(0, this.hp - dmg);
        world.particles.spawn({
          kind: 'ember',
          x: this.x + (Math.random() - 0.5) * this.w,
          y: this.centerY + (Math.random() - 0.5) * this.h * 0.6,
          vx: (Math.random() - 0.5) * 40,
          vy: -60 - Math.random() * 60,
          life: 0.6,
          size: 2.4,
          color: '#ff5a2a',
        });
        if (this.hp <= 0 && !this.dead) this.die(world);
      }
    }
    this.vulnerability = this.markTime > 0 ? 0.35 : 0;
  }

  takeDamage(amount: number, opts: HitOptions, world: World): number {
    if (this.dead || this.invuln > 0) return 0;
    const dmg = Math.max(1, Math.round(amount * (1 + this.vulnerability)));
    this.hp = Math.max(0, this.hp - dmg);
    this.hitFlash = 0.16;
    if (opts.hitstun !== undefined) this.hitstun = Math.max(this.hitstun, opts.hitstun);
    const from = opts.fromX ?? this.x;
    const dir = Math.sign(this.x - from) || -this.facing;
    if (opts.knockback) this.vx += dir * opts.knockback;
    if (opts.launch) {
      this.vy = -opts.launch;
      this.onGround = false;
    }
    if (opts.status) {
      const time = opts.statusTime ?? 2;
      if (opts.status === 'burn') {
        this.burnTime = Math.max(this.burnTime, time);
        this.burnDps = Math.max(this.burnDps, 8);
      } else if (opts.status === 'seal' || opts.status === 'stun') {
        this.sealTime = Math.max(this.sealTime, time);
        this.stunTime = Math.max(this.stunTime, time);
      } else if (opts.status === 'mark') {
        this.markTime = Math.max(this.markTime, time);
      }
    }
    if (this.hp <= 0) this.die(world);
    return dmg;
  }

  heal(amount: number): number {
    if (this.dead) return 0;
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - before;
  }

  die(world: World): void {
    if (this.dead) return;
    this.dead = true;
    this.deathTimer = 0;
    this.hp = 0;
    this.vy = -180;
    this.vx *= 0.5;
    this.onDeath(world);
  }

  protected onDeath(world: World): void {
    void world;
  }

  /** Anel de impacto genérico. */
  protected burstRing(world: World, color: string, radius: number): void {
    world.particles.ring(this.x, this.centerY, color, radius, 0.4, 3);
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * TAU;
      world.particles.spawn({
        kind: 'spark',
        x: this.x + Math.cos(a) * 10,
        y: this.centerY + Math.sin(a) * 10,
        vx: Math.cos(a) * 160,
        vy: Math.sin(a) * 160,
        life: 0.5,
        size: 3,
        color,
        gravity: 200,
      });
    }
  }
}
