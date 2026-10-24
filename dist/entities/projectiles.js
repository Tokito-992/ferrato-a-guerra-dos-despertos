/** Projéteis e zonas de perigo (magma, singularidade, raios, fendas...). */
import { clamp, rectsOverlap, TAU } from '../core/math.js';
export class Projectile {
    constructor(def) {
        this.spinAngle = 0;
        this.trailAcc = 0;
        this.dead = false;
        this.hitSet = new Set();
        this.x = def.x;
        this.y = def.y;
        this.vx = def.vx;
        this.vy = def.vy;
        this.radius = def.radius;
        this.damage = def.damage;
        this.owner = def.owner;
        this.color = def.color;
        this.accent = def.accent ?? '#ffffff';
        this.life = def.life ?? 2;
        this.gravity = def.gravity ?? 0;
        this.homing = def.homing ?? 0;
        this.pierce = def.pierce ?? false;
        this.style = def.style ?? 'orb';
        this.spin = def.spin ?? 4;
    }
    get box() {
        return { x: this.x - this.radius, y: this.y - this.radius, w: this.radius * 2, h: this.radius * 2 };
    }
    update(dt, world) {
        this.life -= dt;
        if (this.life <= 0) {
            this.dead = true;
            return;
        }
        this.vy += this.gravity * dt;
        if (this.homing > 0 && this.owner === 'enemy') {
            const p = world.player;
            const angle = Math.atan2(p.centerY - this.y, p.x - this.x);
            const speed = Math.hypot(this.vx, this.vy);
            const current = Math.atan2(this.vy, this.vx);
            let diff = angle - current;
            while (diff > Math.PI)
                diff -= TAU;
            while (diff < -Math.PI)
                diff += TAU;
            const turn = clamp(diff, -this.homing * dt, this.homing * dt);
            const na = current + turn;
            this.vx = Math.cos(na) * speed;
            this.vy = Math.sin(na) * speed;
        }
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.spinAngle += this.spin * dt;
        // Rastro luminoso.
        this.trailAcc += dt;
        if (this.trailAcc > 0.03) {
            this.trailAcc = 0;
            world.particles.spawn({
                kind: 'glow',
                x: this.x,
                y: this.y,
                vx: -this.vx * 0.04,
                vy: -this.vy * 0.04,
                life: 0.26,
                size: this.radius * 1.9,
                color: this.color,
            });
        }
        if (this.owner === 'player') {
            const targets = [...world.enemies];
            if (world.boss)
                targets.push(world.boss);
            for (const target of targets) {
                if (target.dead || this.hitSet.has(target))
                    continue;
                if (!rectsOverlap(this.box, target.hurtbox))
                    continue;
                this.hitSet.add(target);
                world.damageEnemy(target, this.damage, {
                    fromX: this.x - this.vx,
                    knockback: 120,
                    hitstun: 0.16,
                    color: this.accent,
                    shake: 0.12,
                });
                world.particles.burst(this.x, this.y, 7, this.accent, { speed: 180, gravity: 160, size: 2.6 });
                if (!this.pierce) {
                    this.dead = true;
                    break;
                }
            }
        }
        else {
            const p = world.player;
            if (!p.dead && rectsOverlap(this.box, p.hurtbox)) {
                const dealt = world.damagePlayer(this.damage, {
                    fromX: this.x - this.vx,
                    knockback: 180,
                    hitstun: 0.2,
                    color: this.color,
                });
                world.particles.burst(this.x, this.y, 8, this.color, { speed: 190, gravity: 180, size: 2.8 });
                if (dealt > 0)
                    world.hitStop(0.03);
                this.dead = true;
            }
        }
        if (this.x < world.camera.x - 220 || this.x > world.camera.x + world.viewW + 220) {
            this.dead = true;
        }
        if (this.y > world.groundY + 40 || this.y < -200)
            this.dead = true;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(this.x, this.y);
        const r = this.radius;
        switch (this.style) {
            case 'feather': {
                ctx.rotate(this.spinAngle);
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, r * 0.35, r * 1.5, 0, 0, TAU);
                ctx.fill();
                ctx.strokeStyle = this.accent;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(0, -r * 1.3);
                ctx.lineTo(0, r * 1.3);
                ctx.stroke();
                break;
            }
            case 'star': {
                ctx.rotate(this.spinAngle);
                ctx.fillStyle = this.color;
                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    const a = (i / 4) * TAU;
                    ctx.lineTo(Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.5);
                    ctx.lineTo(Math.cos(a + TAU / 8) * r * 0.45, Math.sin(a + TAU / 8) * r * 0.45);
                }
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = this.accent;
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.4, 0, TAU);
                ctx.fill();
                break;
            }
            case 'plasma': {
                const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.9);
                g.addColorStop(0, '#ffffff');
                g.addColorStop(0.35, this.color);
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(0, 0, r * 1.9, 0, TAU);
                ctx.fill();
                ctx.strokeStyle = this.accent;
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.ellipse(0, 0, r * 1.5, r * 0.55, this.spinAngle, 0, TAU);
                ctx.stroke();
                break;
            }
            case 'echo': {
                ctx.rotate(this.spinAngle * 0.5);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                for (let i = 0; i < 2; i++) {
                    ctx.beginPath();
                    ctx.ellipse(0, 0, r * (1.2 + i * 0.55), r * (0.7 + i * 0.3), i * 0.9, 0, TAU);
                    ctx.stroke();
                }
                ctx.fillStyle = this.accent;
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.55, 0, TAU);
                ctx.fill();
                break;
            }
            case 'bolt': {
                ctx.strokeStyle = this.color;
                ctx.lineWidth = r * 0.8;
                ctx.beginPath();
                ctx.moveTo(-this.vx * 0.02, -this.vy * 0.02);
                ctx.lineTo(0, 0);
                ctx.stroke();
                ctx.fillStyle = this.accent;
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.45, 0, TAU);
                ctx.fill();
                break;
            }
            default: {
                const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.7);
                g.addColorStop(0, this.accent);
                g.addColorStop(0.45, this.color);
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(0, 0, r * 1.7, 0, TAU);
                ctx.fill();
                break;
            }
        }
        ctx.restore();
    }
}
export class Hazard {
    constructor(def) {
        this.time = 0;
        this.dead = false;
        this.tickAcc = 0;
        this.didFinal = false;
        this.didFirst = false;
        this.kind = def.kind;
        this.x = def.x;
        this.y = def.y;
        this.w = def.w ?? 0;
        this.h = def.h ?? 0;
        this.radius = def.radius ?? 90;
        this.duration = def.duration;
        this.damage = def.damage;
        this.owner = def.owner;
        this.color = def.color;
        this.accent = def.accent ?? '#ffffff';
        this.tick = def.tick ?? 0;
        this.pull = def.pull ?? 0;
        this.finalBurst = def.finalBurst ?? 0;
        this.delay = def.delay ?? 0;
    }
    get active() {
        return this.delay <= 0;
    }
    get progress() {
        if (this.delay > 0)
            return 1 - this.delay / Math.max(0.001, this.delay);
        return clamp(this.time / this.duration, 0, 1);
    }
    get box() {
        if (this.w > 0)
            return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h };
        return { x: this.x - this.radius, y: this.y - this.radius, w: this.radius * 2, h: this.radius * 2 };
    }
    update(dt, world) {
        if (this.delay > 0) {
            this.delay -= dt;
            if (this.delay <= 0)
                this.onActivate(world);
            return;
        }
        this.time += dt;
        const remaining = this.duration - this.time;
        if (this.kind === 'singularity' || this.kind === 'void') {
            this.applyPull(dt, world);
        }
        if (this.tick > 0) {
            this.tickAcc += dt;
            if (this.tickAcc >= this.tick) {
                this.tickAcc = 0;
                this.applyAreaDamage(world, 1);
                this.spawnTickParticles(world);
            }
        }
        else if (!this.didFirst) {
            this.didFirst = true;
            this.applyAreaDamage(world, 1);
        }
        if (remaining <= 0) {
            if (this.finalBurst > 0 && !this.didFinal) {
                this.didFinal = true;
                this.applyAreaDamage(world, 1, this.finalBurst);
                world.particles.ring(this.x, this.y, this.color, this.radius * 1.7, 0.5, 7);
                world.shake(0.5);
                world.audio.sfx('explode');
            }
            this.dead = true;
        }
    }
    onActivate(world) {
        if (this.kind === 'explosion') {
            this.applyAreaDamage(world, 1);
            world.particles.ring(this.x, this.y - 30, this.color, this.radius, 0.4, 5);
            world.particles.burst(this.x, this.y - 20, 22, this.color, {
                speed: 320,
                gravity: 500,
                size: 3,
                color2: '#ffffff',
            });
            world.shake(0.45);
            world.audio.sfx('explode');
            this.dead = true;
        }
        else if (this.kind === 'rift') {
            this.applyAreaDamage(world, 1);
            world.particles.ring(this.x, this.y, this.color, this.radius, 0.35, 4);
            world.audio.sfx('echo');
        }
    }
    applyPull(dt, world) {
        const strength = this.pull;
        if (this.owner === 'player') {
            const targets = [...world.enemies];
            if (world.boss)
                targets.push(world.boss);
            for (const t of targets) {
                if (t.dead)
                    continue;
                const dx = this.x - t.x;
                const dy = this.y - 40 - t.centerY;
                const dist = Math.hypot(dx, dy);
                if (dist < this.radius * 2.4) {
                    const f = (1 - dist / (this.radius * 2.4)) * strength;
                    t.vx += (dx / Math.max(1, dist)) * f * dt * 9;
                    if (!t.onGround)
                        t.vy += (dy / Math.max(1, dist)) * f * dt * 4;
                }
            }
        }
        else {
            const p = world.player;
            const dx = this.x - p.x;
            const dist = Math.abs(dx);
            if (dist < this.radius * 2) {
                p.vx += Math.sign(dx) * this.pull * dt * 2.2;
            }
        }
    }
    applyAreaDamage(world, mult, overrideDamage) {
        if (this.damage <= 0 && !overrideDamage)
            return;
        const dmg = (overrideDamage ?? this.damage) * mult;
        if (this.owner === 'player') {
            const targets = [...world.enemies];
            if (world.boss)
                targets.push(world.boss);
            for (const t of targets) {
                if (t.dead)
                    continue;
                if (!rectsOverlap(this.box, t.hurtbox))
                    continue;
                world.damageEnemy(t, dmg, {
                    fromX: this.x,
                    knockback: this.kind === 'singularity' ? 0 : 90,
                    hitstun: 0.2,
                    color: this.accent,
                    status: this.kind === 'magma' ? 'burn' : undefined,
                    statusTime: this.kind === 'magma' ? 2.5 : undefined,
                    shake: 0.1,
                });
            }
            if (world.boss && rectsOverlap(this.box, world.boss.hurtbox)) {
                // O chefe também sofre, mas com resistência a dano contínuo.
                world.damageEnemy(world.boss, dmg * 0.8, {
                    fromX: this.x,
                    hitstun: 0,
                    color: this.accent,
                });
            }
        }
        else {
            const p = world.player;
            if (!p.dead && rectsOverlap(this.box, p.hurtbox)) {
                world.damagePlayer(dmg, {
                    fromX: this.x,
                    knockback: this.kind === 'void' ? 60 : 220,
                    launch: 100,
                    hitstun: 0.22,
                    color: this.color,
                });
            }
        }
    }
    spawnTickParticles(world) {
        if (this.kind === 'magma') {
            for (let i = 0; i < 2; i++) {
                world.particles.spawn({
                    kind: 'magma',
                    x: this.x + (Math.random() - 0.5) * this.radius * 1.4,
                    y: this.y - Math.random() * 10,
                    vy: -120 - Math.random() * 140,
                    life: 0.6,
                    size: 3 + Math.random() * 3,
                    color: this.color,
                    gravity: 160,
                });
            }
        }
        else if (this.kind === 'singularity' || this.kind === 'void') {
            world.particles.spawn({
                kind: 'star',
                x: this.x + (Math.random() - 0.5) * this.radius * 2,
                y: this.y - 40 + (Math.random() - 0.5) * this.radius * 2,
                vx: (this.x - this.x) * 0,
                vy: -10,
                life: 0.4,
                size: 2.5,
                color: this.color,
                vrot: 2,
            });
        }
    }
    draw(ctx) {
        ctx.save();
        const t = this.active ? clamp(this.time / this.duration, 0, 1) : 0;
        const pulse = 0.75 + Math.sin(this.time * 14) * 0.25;
        if (this.delay > 0) {
            // Telegrafia de perigo: círculo que se fecha.
            const p = 1 - this.delay / 0.6;
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = this.color;
            ctx.globalAlpha = 0.5 + Math.sin(this.time * 20) * 0.2;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y - (this.w > 0 ? this.h / 2 : 30), this.radius, 0, TAU);
            ctx.stroke();
            ctx.globalAlpha = 0.18;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y - (this.w > 0 ? this.h / 2 : 30), this.radius * clamp(p, 0, 1), 0, TAU);
            ctx.fill();
            ctx.restore();
            return;
        }
        switch (this.kind) {
            case 'magma': {
                const fade = 1 - t;
                ctx.globalCompositeOperation = 'lighter';
                const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
                g.addColorStop(0, 'rgba(255,240,170,0.9)');
                g.addColorStop(0.35, this.color);
                g.addColorStop(1, 'rgba(255,60,0,0)');
                ctx.globalAlpha = 0.65 * fade;
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, this.radius, 26, 0, 0, TAU);
                ctx.fill();
                for (let i = 0; i < 5; i++) {
                    const off = (i - 2) * (this.radius / 3.2);
                    const h = 42 + Math.sin(this.time * 9 + i) * 26;
                    ctx.globalAlpha = 0.55 * fade;
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.moveTo(this.x + off - 13, this.y);
                    ctx.quadraticCurveTo(this.x + off, this.y - h * 1.4, this.x + off + 9, this.y - h);
                    ctx.quadraticCurveTo(this.x + off + 2, this.y - h * 0.4, this.x + off + 13, this.y);
                    ctx.fill();
                }
                break;
            }
            case 'singularity': {
                ctx.globalAlpha = 0.85;
                const grad = ctx.createRadialGradient(this.x, this.y - 40, 4, this.x, this.y - 40, this.radius * 1.2);
                grad.addColorStop(0, '#05010a');
                grad.addColorStop(0.55, 'rgba(20,4,40,0.85)');
                grad.addColorStop(0.8, this.color);
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(this.x, this.y - 40, this.radius * 1.2, 0, TAU);
                ctx.fill();
                ctx.globalCompositeOperation = 'lighter';
                for (let i = 0; i < 3; i++) {
                    ctx.strokeStyle = this.accent;
                    ctx.globalAlpha = 0.5 - i * 0.13;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.ellipse(this.x, this.y - 40, this.radius * (1 + i * 0.22), this.radius * 0.38 * (1 + i * 0.2), this.time * (1.2 + i), 0, TAU);
                    ctx.stroke();
                }
                break;
            }
            case 'seal': {
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 0.75 * (1 - t);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3;
                for (let i = 0; i < 3; i++) {
                    const rr = this.radius * (1 - i * 0.22) * (0.6 + t * 0.5);
                    ctx.beginPath();
                    ctx.ellipse(this.x, this.y - 50, rr, rr * 0.5, 0, 0, TAU);
                    ctx.stroke();
                }
                ctx.fillStyle = this.color;
                ctx.globalAlpha = 0.2 * (1 - t);
                ctx.beginPath();
                ctx.ellipse(this.x, this.y - 50, this.radius, this.radius * 0.5, 0, 0, TAU);
                ctx.fill();
                break;
            }
            case 'shock': {
                ctx.globalCompositeOperation = 'lighter';
                const r = this.radius * (0.4 + t * 0.9);
                ctx.globalAlpha = (1 - t) * 0.8;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 5 * (1 - t);
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, r, r * 0.3, 0, 0, TAU);
                ctx.stroke();
                break;
            }
            case 'beam': {
                ctx.globalCompositeOperation = 'lighter';
                const height = this.h;
                const grd = ctx.createLinearGradient(this.x - 18, 0, this.x + 18, 0);
                grd.addColorStop(0, 'rgba(0,0,0,0)');
                grd.addColorStop(0.35, this.color);
                grd.addColorStop(0.5, '#ffffff');
                grd.addColorStop(0.65, this.color);
                grd.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.globalAlpha = 0.85;
                ctx.fillStyle = grd;
                ctx.fillRect(this.x - 18, this.y - height, 36, height);
                ctx.globalAlpha = 0.6 * (1 - t);
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - 48, this.y - height, 96, height);
                break;
            }
            case 'explosion': {
                ctx.restore();
                return;
            }
            case 'rift': {
                const flick = Math.random() * 0.3 + 0.7;
                ctx.globalCompositeOperation = 'lighter';
                ctx.translate(this.x, this.y - 70);
                ctx.globalAlpha = (1 - t) * flick;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(0, -85);
                ctx.lineTo(-16, -32);
                ctx.lineTo(10, 6);
                ctx.lineTo(-8, 52);
                ctx.stroke();
                ctx.strokeStyle = this.accent;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, -78);
                ctx.lineTo(-9, -30);
                ctx.lineTo(7, 4);
                ctx.lineTo(-4, 44);
                ctx.stroke();
                break;
            }
            case 'void': {
                ctx.globalAlpha = 0.9;
                const grad = ctx.createRadialGradient(this.x, this.y - 90, 6, this.x, this.y - 90, this.radius);
                grad.addColorStop(0, '#000000');
                grad.addColorStop(0.6, 'rgba(30,0,50,0.9)');
                grad.addColorStop(0.85, this.color);
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(this.x, this.y - 90, this.radius, 0, TAU);
                ctx.fill();
                ctx.globalCompositeOperation = 'lighter';
                ctx.strokeStyle = this.accent;
                ctx.globalAlpha = 0.6 * pulse;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(this.x, this.y - 90, this.radius * 1.2, this.radius * 0.35, this.time, 0, TAU);
                ctx.stroke();
                break;
            }
            default:
                break;
        }
        ctx.restore();
    }
}
//# sourceMappingURL=projectiles.js.map