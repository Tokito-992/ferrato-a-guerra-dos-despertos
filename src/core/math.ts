/** Utilidades matemáticas e geométricas compartilhadas. */

export const TAU = Math.PI * 2;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Interpolação independente de framerate. */
export function damp(a: number, b: number, lambda: number, dt: number): number {
  return lerp(a, b, 1 - Math.exp(-lambda * dt));
}

export function approach(v: number, target: number, delta: number): number {
  if (v < target) return Math.min(v + delta, target);
  return Math.max(v - delta, target);
}

export function rand(a = 0, b = 1): number {
  return a + Math.random() * (b - a);
}

export function randInt(a: number, b: number): number {
  return Math.floor(rand(a, b + 1));
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function chance(p: number): boolean {
  return Math.random() < p;
}

export function sign(v: number): number {
  return v < 0 ? -1 : v > 0 ? 1 : 0;
}

export function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function circleRect(cx: number, cy: number, r: number, rect: Rect): boolean {
  const nx = clamp(cx, rect.x, rect.x + rect.w);
  const ny = clamp(cy, rect.y, rect.y + rect.h);
  return (cx - nx) * (cx - nx) + (cy - ny) * (cy - ny) <= r * r;
}

export function rectFromCenter(cx: number, cy: number, w: number, h: number): Rect {
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

export function easeOutCubic(t: number): number {
  const p = 1 - clamp(t, 0, 1);
  return 1 - p * p * p;
}

export function easeInCubic(t: number): number {
  const p = clamp(t, 0, 1);
  return p * p * p;
}

export function easeOutBack(t: number): number {
  const p = clamp(t, 0, 1);
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
}

export function pingPong(t: number): number {
  const p = t % 2;
  return p > 1 ? 2 - p : p;
}

/** PRNG determinístico para cenários estáveis entre frames. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseColor(color: string): [number, number, number] {
  const c = color.trim();
  // Aceita rgb()/rgba() além de hex, evitando canais NaN em gradientes.
  if (c.startsWith('rgb')) {
    const parts = c.match(/[\d.]+/g) ?? [];
    return [Number(parts[0] ?? 0) || 0, Number(parts[1] ?? 0) || 0, Number(parts[2] ?? 0) || 0];
  }
  const clean = c.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((ch) => ch + ch).join('') : clean;
  return [
    parseInt(full.slice(0, 2), 16) || 0,
    parseInt(full.slice(2, 4), 16) || 0,
    parseInt(full.slice(4, 6), 16) || 0,
  ];
}

export function hexToRgba(color: string, alpha: number): string {
  const [r, g, b] = parseColor(color);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

export function mixColor(a: string, b: string, t: number): string {
  const ca = parseColor(a);
  const cb = parseColor(b);
  const k = clamp(t, 0, 1);
  const toHex = (v: number): string =>
    Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
  return `#${toHex(lerp(ca[0], cb[0], k))}${toHex(lerp(ca[1], cb[1], k))}${toHex(lerp(ca[2], cb[2], k))}`;
}
