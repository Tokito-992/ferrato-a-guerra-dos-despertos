/** Câmera com suavização, limites de cenário e screen shake. */

import { clamp, damp, rand } from './math.js';
import type { Rect } from './types.js';

export class Camera {
  x = 0;
  y = 0;
  targetX = 0;
  shakeAmount = 0;
  offsetX = 0;
  offsetY = 0;
  private bounds: { min: number; max: number } = { min: 0, max: 0 };

  constructor(
    public readonly viewW: number,
    public readonly viewH: number,
  ) {}

  setBounds(min: number, max: number): void {
    this.bounds.min = min;
    this.bounds.max = Math.max(min, max);
    this.x = clamp(this.x, min, this.bounds.max);
  }

  get maxX(): number {
    return this.bounds.max;
  }

  snapTo(targetX: number): void {
    this.targetX = clamp(targetX, this.bounds.min, this.bounds.max);
    this.x = this.targetX;
  }

  update(dt: number, targetX: number, immediate = false): void {
    this.targetX = clamp(targetX, this.bounds.min, this.bounds.max);
    if (immediate) {
      this.x = this.targetX;
    } else {
      this.x = damp(this.x, this.targetX, 7, dt);
    }
    this.shakeAmount = Math.max(0, this.shakeAmount - dt * (14 + this.shakeAmount * 9));
    const s = this.shakeAmount;
    this.offsetX = rand(-s, s);
    this.offsetY = rand(-s, s) * 0.7;
  }

  addShake(amount: number): void {
    this.shakeAmount = Math.min(26, this.shakeAmount + amount);
  }

  /** Converte um retângulo de tela para o mundo. */
  screenToWorld(x: number, y: number): { x: number; y: number } {
    return { x: x + this.x, y: y + this.y };
  }

  get view(): Rect {
    return { x: this.x, y: this.y, w: this.viewW, h: this.viewH };
  }
}
