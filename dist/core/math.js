/** Utilidades matemáticas e geométricas compartilhadas. */
export const TAU = Math.PI * 2;
export function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
}
export function lerp(a, b, t) {
    return a + (b - a) * t;
}
/** Interpolação independente de framerate. */
export function damp(a, b, lambda, dt) {
    return lerp(a, b, 1 - Math.exp(-lambda * dt));
}
export function approach(v, target, delta) {
    if (v < target)
        return Math.min(v + delta, target);
    return Math.max(v - delta, target);
}
export function rand(a = 0, b = 1) {
    return a + Math.random() * (b - a);
}
export function randInt(a, b) {
    return Math.floor(rand(a, b + 1));
}
export function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
export function chance(p) {
    return Math.random() < p;
}
export function sign(v) {
    return v < 0 ? -1 : v > 0 ? 1 : 0;
}
export function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}
export function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
export function circleRect(cx, cy, r, rect) {
    const nx = clamp(cx, rect.x, rect.x + rect.w);
    const ny = clamp(cy, rect.y, rect.y + rect.h);
    return (cx - nx) * (cx - nx) + (cy - ny) * (cy - ny) <= r * r;
}
export function rectFromCenter(cx, cy, w, h) {
    return { x: cx - w / 2, y: cy - h / 2, w, h };
}
export function easeOutCubic(t) {
    const p = 1 - clamp(t, 0, 1);
    return 1 - p * p * p;
}
export function easeInCubic(t) {
    const p = clamp(t, 0, 1);
    return p * p * p;
}
export function easeOutBack(t) {
    const p = clamp(t, 0, 1);
    const c = 1.70158;
    return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
}
export function pingPong(t) {
    const p = t % 2;
    return p > 1 ? 2 - p : p;
}
/** PRNG determinístico para cenários estáveis entre frames. */
export function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function parseColor(color) {
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
export function hexToRgba(color, alpha) {
    const [r, g, b] = parseColor(color);
    return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}
export function mixColor(a, b, t) {
    const ca = parseColor(a);
    const cb = parseColor(b);
    const k = clamp(t, 0, 1);
    const toHex = (v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
    return `#${toHex(lerp(ca[0], cb[0], k))}${toHex(lerp(ca[1], cb[1], k))}${toHex(lerp(ca[2], cb[2], k))}`;
}
//# sourceMappingURL=math.js.map