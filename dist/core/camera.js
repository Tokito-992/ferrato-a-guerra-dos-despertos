/** Câmera com suavização, limites de cenário e screen shake. */
import { clamp, damp, rand } from './math.js?v=8f2357506abc';
export class Camera {
    constructor(viewW, viewH) {
        this.viewW = viewW;
        this.viewH = viewH;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.shakeAmount = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.bounds = { min: 0, max: 0 };
    }
    setBounds(min, max) {
        this.bounds.min = min;
        this.bounds.max = Math.max(min, max);
        this.x = clamp(this.x, min, this.bounds.max);
    }
    get maxX() {
        return this.bounds.max;
    }
    snapTo(targetX) {
        this.targetX = clamp(targetX, this.bounds.min, this.bounds.max);
        this.x = this.targetX;
    }
    update(dt, targetX, immediate = false) {
        this.targetX = clamp(targetX, this.bounds.min, this.bounds.max);
        if (immediate) {
            this.x = this.targetX;
        }
        else {
            this.x = damp(this.x, this.targetX, 7, dt);
        }
        this.shakeAmount = Math.max(0, this.shakeAmount - dt * (14 + this.shakeAmount * 9));
        const s = this.shakeAmount;
        this.offsetX = rand(-s, s);
        this.offsetY = rand(-s, s) * 0.7;
    }
    addShake(amount) {
        this.shakeAmount = Math.min(26, this.shakeAmount + amount);
    }
    /** Converte um retângulo de tela para o mundo. */
    screenToWorld(x, y) {
        return { x: x + this.x, y: y + this.y };
    }
    get view() {
        return { x: this.x, y: this.y, w: this.viewW, h: this.viewH };
    }
}
//# sourceMappingURL=camera.js.map