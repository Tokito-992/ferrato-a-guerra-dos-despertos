/** Jogador: movimentação, combos, dash, habilidades e passivas por personagem. */
import { clamp, rand, rectsOverlap } from '../core/math.js';
import { Combatant } from './combatant.js';
import { getCharacter } from '../data/characters.js';
import { MOVESETS } from '../data/movesets.js';
/** Cada Desperto tem uma assinatura sonora própria ao ativar a habilidade. */
const ABILITY_SFX = {
    ravi: 'abilityRavi',
    miriam: 'abilityMiriam',
    kael: 'abilityKael',
    ozric: 'abilityOzric',
    elodie: 'abilityElodie',
    thryc: 'abilityThryc',
};
export class Player extends Combatant {
    constructor(x, charId, floor) {
        const def = getCharacter(charId);
        super(x, floor, 44, 100, def.maxHp);
        this.attack = null;
        this.queued = null;
        this.comboTimer = 0;
        this.nextSlot = null;
        this.comboHits = 0;
        this.comboTimerDisplay = 0;
        this.bestCombo = 0;
        this.dashTime = 0;
        this.dashCd = 0;
        this.dashDir = 1;
        this.dashSpeed = 0;
        this.dashHit = new Set();
        this.dashStartX = 0;
        this.jumpsUsed = 0;
        this.maxJumps = 1;
        this.abilityCd = 0;
        this.abilityFlash = 0;
        this.heat = 0;
        this.timeSinceHit = 99;
        this.auraWindow = 0;
        this.empowerTime = 0;
        this.drained = 0;
        this.lastAttack = null;
        this.lastAttackX = 0;
        this.lastAttackDir = 1;
        this.counterFlash = 0;
        this.state = 'idle';
        this.animTime = 0;
        this.walkPhase = 0;
        this.runDust = 0;
        this.moveInput = 0;
        this.landSquash = 0;
        this.wasAir = false;
        this.def = def;
        this.charId = def.id;
        this.scale = def.scale;
        this.gravity = 1950;
        this.maxJumps = def.id === 'thryc' ? 3 : def.id === 'ravi' || def.id === 'elodie' || def.id === 'kael' ? 2 : 1;
        this.dashCd = 0;
    }
    get abilityMax() {
        return this.def.ability.cooldown;
    }
    get abilityReady() {
        return this.abilityCd <= 0.001;
    }
    get invulnFlash() {
        return this.invuln > 0 && Math.floor(this.invuln * 22) % 2 === 0;
    }
    get attackPhase() {
        if (!this.attack)
            return 'none';
        const d = this.attack.def;
        if (this.attack.t < d.startup)
            return 'windup';
        if (this.attack.t <= d.startup + d.active)
            return 'active';
        return 'recover';
    }
    update(dt, world) {
        this.animTime += dt;
        this.tickTimers(dt);
        this.abilityFlash = Math.max(0, this.abilityFlash - dt);
        this.counterFlash = Math.max(0, this.counterFlash - dt);
        this.landSquash = Math.max(0, this.landSquash - dt * 4);
        if (this.dead) {
            this.state = 'dead';
            this.attack = null;
            this.dashTime = 0;
            this.applyPhysics(dt, world.groundY, 5);
            this.applyStatuses(dt, world);
            return;
        }
        this.abilityCd = Math.max(0, this.abilityCd - dt);
        this.dashCd = Math.max(0, this.dashCd - dt);
        this.auraWindow = Math.max(0, this.auraWindow - dt);
        this.empowerTime = Math.max(0, this.empowerTime - dt);
        this.comboTimer = Math.max(0, this.comboTimer - dt);
        this.timeSinceHit += dt;
        if (this.comboTimerDisplay > 0) {
            this.comboTimerDisplay -= dt;
            if (this.comboTimerDisplay <= 0) {
                this.bestCombo = Math.max(this.bestCombo, this.comboHits);
                this.comboHits = 0;
            }
        }
        if (this.timeSinceHit > 2.2 && this.heat > 0)
            this.heat = Math.max(0, this.heat - dt * 9);
        if (this.hitstun > 0) {
            this.attack = null;
            this.queued = null;
            this.wasAir = !this.onGround;
            this.applyPhysics(dt, world.groundY, 6);
            this.applyStatuses(dt, world);
            this.state = 'hurt';
            return;
        }
        if (this.isStunned) {
            this.attack = null;
            this.applyPhysics(dt, world.groundY, 6);
            this.applyStatuses(dt, world);
            this.state = 'hurt';
            return;
        }
        const input = world.input;
        this.moveInput = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
        if (input.pressed('ability') && this.abilityReady && this.dashTime <= 0) {
            this.useAbility(world);
        }
        if (input.pressed('dash') && this.dashCd <= 0 && this.dashTime <= 0) {
            this.startDash(world);
        }
        if (input.pressed('jump'))
            this.tryJump(world);
        if (input.pressed('attack'))
            this.tryAttack('light', world);
        if (input.pressed('heavy'))
            this.tryAttack('heavy', world);
        // Pulo variável / planeio do Kael.
        if (this.charId === 'kael' && !this.onGround && input.isDown('jump') && this.vy > 40) {
            this.vy = Math.min(this.vy, 90);
            if (Math.random() < 0.4) {
                world.particles.spawn({
                    kind: 'glow',
                    x: this.x + rand(-14, 14),
                    y: this.y - rand(10, 60),
                    vy: 30,
                    life: 0.4,
                    size: 8,
                    color: this.def.colors.accent,
                });
            }
        }
        if (this.vy < -140 && !input.isDown('jump'))
            this.vy += this.gravity * 0.9 * dt;
        this.wasAir = !this.onGround;
        if (this.dashTime > 0) {
            this.updateDash(dt, world);
            return;
        }
        this.updateAttack(dt, world);
        this.updateMovement(dt, world);
        this.applyPhysics(dt, world.groundY, this.attack ? 9 : 5);
        this.applyStatuses(dt, world);
        if (this.wasAir && this.onGround) {
            this.jumpsUsed = 0;
            this.landSquash = 1;
            world.audio.sfx('land');
            world.particles.burst(this.x, this.y - 4, 6, this.def.colors.accent, {
                speed: 110,
                angle: -Math.PI / 2,
                spread: Math.PI * 0.8,
                gravity: 500,
                size: 2.2,
                life: 0.32,
            });
        }
        this.x = clamp(this.x, world.camera.x + 22, world.camera.x + world.viewW - 22);
        this.state = this.computeState();
    }
    computeState() {
        if (this.dead)
            return 'dead';
        if (this.dashTime > 0)
            return 'dash';
        if (this.hitstun > 0)
            return 'hurt';
        if (this.attack)
            return 'attack';
        if (!this.onGround)
            return this.vy < 0 ? 'jump' : 'fall';
        if (Math.abs(this.vx) > 24)
            return 'run';
        return 'idle';
    }
    updateMovement(dt, world) {
        const dir = this.moveInput;
        const attacking = !!this.attack;
        const control = attacking ? 0.18 : 1;
        const speed = this.def.speed * control;
        const accel = (this.onGround ? 3200 : 2200) * dt;
        const target = dir * speed;
        if (dir !== 0) {
            if (this.vx < target)
                this.vx = Math.min(this.vx + accel, target);
            else if (this.vx > target)
                this.vx = Math.max(this.vx - accel, target);
            if (!attacking)
                this.facing = dir > 0 ? 1 : -1;
            this.walkPhase += dt * (6 + Math.abs(this.vx) * 0.03);
            this.runDust += dt;
            if (this.onGround && this.runDust > 0.14 && Math.abs(this.vx) > 130) {
                this.runDust = 0;
                world.particles.spawn({
                    kind: 'smoke',
                    x: this.x - this.facing * 12,
                    y: this.y - 4,
                    vx: -this.facing * rand(10, 50),
                    vy: rand(-30, -6),
                    life: 0.4,
                    size: rand(4, 8),
                    color: this.def.colors.accent,
                    gravity: -20,
                });
            }
        }
        else {
            this.vx = this.vx > 0 ? Math.max(0, this.vx - accel) : Math.min(0, this.vx + accel);
        }
    }
    tryJump(world) {
        if (this.attack && this.attackPhase === 'windup')
            return;
        if (this.onGround) {
            this.vy = -this.def.jump;
            this.onGround = false;
            this.jumpsUsed = 1;
            world.audio.sfx('jump');
            world.particles.burst(this.x, this.y - 2, 5, this.def.colors.accent, {
                speed: 90,
                angle: -Math.PI / 2,
                spread: Math.PI * 0.7,
                gravity: 400,
                size: 2,
                life: 0.3,
            });
        }
        else if (this.jumpsUsed < this.maxJumps) {
            this.vy = -this.def.jump * 0.9;
            this.jumpsUsed++;
            world.audio.sfx('jump');
            if (this.charId === 'elodie') {
                world.particles.burst(this.x, this.centerY, 10, '#fff4cd', { speed: 140, gravity: -30, kind: 'feather', size: 4, life: 0.5 });
            }
            else if (this.charId === 'thryc') {
                world.particles.ring(this.x, this.centerY, this.def.colors.accent, 40, 0.3, 2);
            }
            else if (this.charId === 'kael') {
                world.particles.ring(this.x, this.centerY, this.def.colors.accent, 46, 0.3, 2);
            }
            else {
                world.particles.burst(this.x, this.centerY, 8, this.def.colors.accent, { speed: 160, gravity: 60, size: 2.4 });
            }
        }
    }
    tryAttack(kind, world) {
        if (this.dashTime > 0)
            return;
        if (this.attack) {
            const a = this.attack;
            const past = a.t >= a.def.startup + a.def.active * 0.35;
            if (past) {
                if (kind === 'light' && a.def.chain)
                    this.queued = a.def.chain;
                else if (kind === 'heavy')
                    this.queued = 'heavy';
            }
            return;
        }
        let slot;
        if (!this.onGround)
            slot = 'air';
        else if (kind === 'heavy')
            slot = 'heavy';
        else if (this.comboTimer > 0 && this.nextSlot)
            slot = this.nextSlot;
        else
            slot = 'light1';
        this.startAttack(slot, world);
    }
    startAttack(slot, world) {
        const def = MOVESETS[this.charId][slot];
        this.attack = {
            def,
            slot,
            t: 0,
            dir: this.facing,
            damageScale: 1,
            spawned: false,
            fxDone: false,
            echo: false,
            hitInfo: new Map(),
        };
        if (def.advance)
            this.vx += this.facing * def.advance;
        if (def.trigger === 'counter') {
            this.counterFlash = 0.5;
            world.audio.sfx('seal');
            world.particles.ring(this.x, this.centerY, this.def.colors.accent, 54, 0.35, 2);
        }
        this.lastAttack = def;
        this.lastAttackX = this.x;
        this.lastAttackDir = this.facing;
    }
    updateAttack(dt, world) {
        const a = this.attack;
        if (!a)
            return;
        a.t += dt;
        const d = a.def;
        const activeStart = d.startup;
        const activeEnd = d.startup + d.active;
        const total = activeEnd + d.recovery;
        if (!a.spawned && a.t >= activeStart) {
            a.spawned = true;
            this.spawnAttackEffects(world, a);
        }
        if (a.t >= activeStart && a.t <= activeEnd && d.w > 0) {
            if (!a.fxDone) {
                a.fxDone = true;
                const cx = this.x + a.dir * d.offsetX;
                const cy = this.y - d.offsetY;
                if (d.arc) {
                    world.particles.slash(cx, cy, a.dir > 0 ? -0.25 : Math.PI + 0.25, this.def.colors.accent, d.arc, 0.18);
                }
                if (d.trigger === 'shockwave') {
                    world.heavyImpact(cx, world.groundY - 6, this.def.colors.accent);
                }
            }
            const box = {
                x: this.x + a.dir * d.offsetX - d.w / 2,
                y: this.y - d.offsetY - d.h / 2,
                w: d.w,
                h: d.h,
            };
            this.resolveHits(world, a, box);
        }
        if (d.trigger === 'counter' && a.t > activeEnd) {
            this.attack = null;
        }
        else if (a.t >= total) {
            this.endAttack(a, world);
        }
    }
    resolveHits(world, a, box) {
        const targets = [...world.enemies];
        if (world.boss && !world.boss.dead)
            targets.push(world.boss);
        const maxHits = a.def.hits ?? 1;
        for (const target of targets) {
            if (target.dead)
                continue;
            const info = a.hitInfo.get(target);
            if (info && info.count >= maxHits)
                continue;
            if (info && a.t - info.last < (a.def.hitInterval ?? 0.1))
                continue;
            if (!rectsOverlap(box, target.hurtbox))
                continue;
            a.hitInfo.set(target, { count: (info?.count ?? 0) + 1, last: a.t });
            this.landHit(world, target, a.def, a);
        }
    }
    landHit(world, target, def, a) {
        let damage = def.damage * this.damageMultiplier();
        let crit = false;
        if (this.charId === 'elodie' && this.auraWindow > 0) {
            damage *= 1.65;
            crit = true;
            this.auraWindow = 0;
            world.flash('#fff4cd', 0.08);
        }
        const opts = {
            fromX: this.x,
            knockback: def.knockback,
            launch: def.launch,
            hitstun: def.hitstun ?? 0.18,
            color: this.def.colors.accent,
            crit,
            status: def.status,
            statusTime: def.status === 'burn' ? 4 : def.status === 'mark' ? 4 : undefined,
            shake: def.shake,
            ignoreInvuln: false,
        };
        world.damageEnemy(target, damage, opts);
        if (this.charId === 'ozric') {
            const healed = this.heal(damage * 0.08);
            if (healed > 0.4) {
                this.drained += healed;
                world.particles.spawn({
                    kind: 'ember',
                    x: this.x,
                    y: this.centerY,
                    vy: -60,
                    life: 0.4,
                    size: 2.4,
                    color: '#ff3357',
                });
            }
        }
        if (this.charId === 'miriam')
            this.heat = Math.min(100, this.heat + 1.5);
        this.comboHits++;
        this.comboTimerDisplay = 2.4;
        this.bestCombo = Math.max(this.bestCombo, this.comboHits);
        world.addCombo(1);
        world.hitStop(def.damage >= 20 ? 0.075 : 0.04);
        world.shake(def.shake ?? 0.12);
        world.audio.sfx(def.damage >= 20 ? 'heavy' : 'hit');
        const tx = target.x;
        const ty = target.centerY;
        world.particles.burst(tx, ty, crit ? 14 : 7, this.def.colors.accent, {
            speed: 250,
            gravity: 340,
            size: 2.8,
            color2: '#ffffff',
            life: 0.42,
        });
        if (crit) {
            world.particles.ring(tx, ty, '#fff4cd', 52, 0.3, 3);
        }
        void a;
    }
    spawnAttackEffects(world, a) {
        const d = a.def;
        const dir = a.dir;
        const originY = this.y - (d.projectile?.offsetY ?? d.offsetY);
        if (d.projectile) {
            const count = d.projectile.count ?? 1;
            for (let i = 0; i < count; i++) {
                const spread = (i - (count - 1) / 2) * (d.projectile.spread ?? 0.12);
                const angle = spread;
                world.spawnProjectile({
                    x: this.x + dir * 34,
                    y: originY,
                    vx: Math.cos(angle) * d.projectile.speed * dir,
                    vy: Math.sin(angle) * d.projectile.speed + (d.projectile.gravity ? -120 : 0),
                    radius: d.projectile.radius,
                    damage: d.projectile.damage * this.damageMultiplier(),
                    owner: 'player',
                    color: d.projectile.color ?? this.def.colors.accent,
                    accent: this.def.colors.glow,
                    life: d.projectile.life,
                    gravity: d.projectile.gravity,
                    style: d.projectile.style,
                });
            }
            world.audio.sfx('gravity');
        }
        if (d.trigger === 'gravityWell') {
            world.spawnHazard({
                kind: 'singularity',
                x: this.x + dir * 130,
                y: world.groundY,
                radius: 115,
                duration: 1.7,
                damage: 6,
                tick: 0.3,
                pull: 340,
                finalBurst: 18,
                owner: 'player',
                color: '#6b4cff',
                accent: '#6ff2ff',
            });
            world.audio.sfx('gravity');
            world.shake(0.3);
        }
        if (d.trigger === 'rift') {
            world.spawnHazard({
                kind: 'rift',
                x: this.x + dir * 96,
                y: world.groundY,
                radius: 74,
                duration: 0.45,
                damage: 0,
                owner: 'player',
                color: this.def.colors.accent,
                accent: '#ffffff',
            });
            world.audio.sfx('echo');
        }
        if (d.trigger === 'shockwave') {
            world.spawnHazard({
                kind: 'shock',
                x: this.x + dir * 40,
                y: world.groundY,
                radius: 150,
                duration: 0.5,
                damage: 0,
                owner: 'player',
                color: this.def.colors.accent,
            });
        }
        if (d.trigger === 'counter') {
            world.particles.rune(this.x, this.centerY, this.def.colors.accent);
        }
    }
    endAttack(a, world) {
        this.attack = null;
        this.comboTimer = 0.46;
        this.nextSlot = a.def.chain ?? null;
        const q = this.queued;
        this.queued = null;
        if (q) {
            this.startAttack(q, world);
        }
    }
    damageMultiplier() {
        let mult = 1;
        if (this.charId === 'miriam')
            mult += (this.heat / 100) * 0.45;
        if (this.charId === 'ravi')
            mult += Math.min(this.comboHits, 18) * 0.012;
        if (this.empowerTime > 0)
            mult += 0.25;
        return mult;
    }
    startDash(world) {
        this.attack = null;
        this.queued = null;
        this.dashDir = this.facing;
        this.dashStartX = this.x;
        this.dashTime = 0.22;
        this.dashSpeed = 900;
        this.dashCd = 0.9;
        this.invuln = Math.max(this.invuln, 0.26);
        this.dashHit.clear();
        world.audio.sfx('dash');
        switch (this.charId) {
            case 'kael': {
                this.dashTime = 0;
                const targetX = clamp(this.x + this.facing * 185, world.camera.x + 24, world.camera.x + world.viewW - 24);
                world.particles.burst(this.x, this.centerY, 16, this.def.colors.accent, {
                    speed: 220,
                    gravity: -60,
                    kind: 'star',
                    size: 4,
                    life: 0.5,
                });
                this.x = targetX;
                this.invuln = 0.4;
                world.audio.sfx('blink');
                world.particles.ring(this.x, this.centerY, this.def.colors.accent, 70, 0.35, 3);
                break;
            }
            case 'miriam': {
                this.dashTime = 0.3;
                this.dashSpeed = 620;
                this.dashCd = 1.35;
                world.shake(0.25);
                world.particles.burst(this.x, this.y - 8, 12, this.def.colors.accent, {
                    speed: 180,
                    gravity: 500,
                    size: 3,
                    angle: -Math.PI / 2,
                    spread: Math.PI,
                });
                break;
            }
            case 'elodie': {
                this.dashSpeed = 1050;
                this.dashTime = 0.2;
                this.auraWindow = 2.6;
                world.particles.ring(this.x, this.centerY, '#fff4cd', 60, 0.3, 2);
                break;
            }
            case 'thryc': {
                this.dashSpeed = 1100;
                this.dashTime = 0.2;
                this.dashCd = 0.75;
                world.particles.ring(this.x, this.centerY, this.def.colors.accent, 56, 0.3, 2);
                break;
            }
            default:
                this.dashCd = 0.75;
                break;
        }
    }
    updateDash(dt, world) {
        this.state = 'dash';
        this.dashTime -= dt;
        this.vx = this.dashDir * this.dashSpeed;
        this.x += this.vx * dt;
        this.vx = 0;
        this.vy = 0;
        this.onGround = true;
        this.y = Math.min(this.y, world.groundY);
        this.x = clamp(this.x, world.camera.x + 22, world.camera.x + world.viewW - 22);
        if (Math.random() < 0.9) {
            world.particles.spawn({
                kind: this.charId === 'thryc' ? 'rune' : 'glow',
                x: this.x - this.dashDir * rand(0, 20),
                y: this.centerY + rand(-20, 20),
                life: 0.28,
                size: this.charId === 'thryc' ? 10 : 12,
                color: this.def.colors.accent,
                vrot: rand(-4, 4),
            });
        }
        if (this.charId === 'ravi') {
            const targets = [...world.enemies];
            if (world.boss && !world.boss.dead)
                targets.push(world.boss);
            for (const t of targets) {
                if (t.dead || this.dashHit.has(t))
                    continue;
                if (Math.abs(t.x - this.x) < (t.w * t.scale) / 2 + 34 && Math.abs(t.centerY - this.centerY) < 70) {
                    this.dashHit.add(t);
                    world.damageEnemy(t, 12 + Math.min(this.comboHits, 8), {
                        fromX: this.x,
                        knockback: 210,
                        hitstun: 0.3,
                        color: this.def.colors.accent,
                        status: 'stun',
                        statusTime: 0.35,
                    });
                    world.audio.sfx('zap');
                    world.particles.burst(t.x, t.centerY, 10, this.def.colors.accent, { speed: 240, gravity: 0, size: 2.6 });
                    world.hitStop(0.04);
                }
            }
        }
        if (this.dashTime <= 0) {
            if (this.charId === 'thryc') {
                world.spawnHazard({
                    kind: 'rift',
                    x: this.x - this.dashDir * 30,
                    y: world.groundY,
                    radius: 52,
                    duration: 0.25,
                    damage: 6,
                    owner: 'player',
                    color: this.def.colors.accent,
                    accent: '#ffffff',
                });
            }
            this.state = this.computeState();
            this.onGround = this.y >= world.groundY - 1;
        }
    }
    useAbility(world) {
        const c = this.def.colors;
        this.abilityCd = this.def.ability.cooldown;
        this.abilityFlash = 0.5;
        this.invuln = Math.max(this.invuln, 0.18);
        world.audio.sfx(ABILITY_SFX[this.charId]);
        world.hitStop(0.03);
        switch (this.charId) {
            case 'ravi': {
                const radius = 235;
                const bonus = 26 + Math.min(this.comboHits, 20) * 1.8;
                world.audio.sfx('zap');
                world.shake(0.7);
                world.flash(c.accent, 0.2);
                world.particles.ring(this.x, this.centerY, c.accent, radius, 0.5, 7);
                world.particles.ring(this.x, this.centerY, '#ffffff', radius * 0.7, 0.35, 3);
                world.particles.burst(this.x, this.centerY, 34, c.accent, {
                    speed: 460,
                    gravity: 40,
                    size: 3.2,
                    color2: '#ffffff',
                    life: 0.55,
                });
                const targets = [...world.enemies];
                if (world.boss && !world.boss.dead)
                    targets.push(world.boss);
                const hitTargets = targets.filter((t) => !t.dead && Math.hypot(t.x - this.x, t.centerY - this.centerY) < radius + 40);
                let prev = { x: this.x, y: this.centerY };
                for (const t of hitTargets) {
                    world.damageEnemy(t, bonus, {
                        fromX: this.x,
                        knockback: 280,
                        launch: 170,
                        hitstun: 0.5,
                        color: c.accent,
                        status: 'stun',
                        statusTime: 0.6,
                        crit: true,
                        shake: 0.2,
                    });
                    world.particles.bolt([prev, { x: t.x, y: t.centerY }], c.glow, 0.22, 4);
                    prev = { x: t.x, y: t.centerY };
                }
                world.hitStop(0.09);
                break;
            }
            case 'miriam': {
                world.audio.sfx('magma');
                world.shake(0.9);
                world.flash(c.glow, 0.18);
                world.particles.ring(this.x, world.groundY - 4, c.accent, 180, 0.5, 6);
                for (let i = 0; i < 3; i++) {
                    const px = this.x + this.facing * (80 + i * 85);
                    world.after(0.1 + i * 0.13, () => {
                        world.spawnHazard({
                            kind: 'magma',
                            x: px,
                            y: world.groundY,
                            radius: 72,
                            duration: 3.2,
                            damage: 12 * this.damageMultiplier(),
                            tick: 0.45,
                            owner: 'player',
                            color: '#ff5b1f',
                            accent: c.accent,
                        });
                        world.particles.burst(px, world.groundY - 10, 16, '#ff8a3c', {
                            speed: 300,
                            gravity: 700,
                            angle: -Math.PI / 2,
                            spread: Math.PI * 0.65,
                            size: 3.4,
                            kind: 'magma',
                        });
                        world.shake(0.3);
                        world.audio.sfx('magma');
                    });
                }
                break;
            }
            case 'kael': {
                world.audio.sfx('gravity');
                world.shake(0.6);
                world.flash(c.accent, 0.16);
                const sx = this.x + this.facing * 165;
                world.spawnHazard({
                    kind: 'singularity',
                    x: sx,
                    y: world.groundY,
                    radius: 150,
                    duration: 2.5,
                    damage: 9,
                    tick: 0.28,
                    pull: 520,
                    finalBurst: 36 * this.damageMultiplier(),
                    owner: 'player',
                    color: '#4b2bff',
                    accent: c.accent,
                });
                world.particles.ring(sx, world.groundY - 50, c.accent, 190, 0.6, 5);
                world.particles.burst(sx, world.groundY - 50, 26, c.accent, {
                    speed: 340,
                    gravity: -100,
                    size: 3,
                    color2: '#ffffff',
                });
                break;
            }
            case 'ozric': {
                world.shake(0.68);
                world.flash('#ff3357', 0.2);
                world.particles.ring(this.x, this.centerY, '#ff3357', 300, 0.55, 6);
                world.particles.ring(this.x, this.centerY, '#ffe6ea', 210, 0.4, 3);
                world.particles.spawn({
                    kind: 'glow',
                    x: this.x,
                    y: this.centerY,
                    life: 0.55,
                    size: 84,
                    color: '#ff3357',
                    color2: '#ff6a9a',
                });
                world.particles.burst(this.x, this.centerY, 26, '#ff3357', {
                    speed: 430,
                    gravity: -60,
                    size: 3.2,
                    color2: '#2a0a14',
                    life: 0.7,
                });
                world.particles.slash(this.x, this.centerY - 8, this.facing > 0 ? -0.15 : Math.PI + 0.15, '#ff3357', 178, 0.36);
                const radius = 300;
                const maxTargets = 5;
                const candidates = [...world.enemies];
                if (world.boss && !world.boss.dead)
                    candidates.push(world.boss);
                const targets = candidates
                    .filter((t) => {
                    if (t.dead)
                        return false;
                    const dx = t.x - this.x;
                    const dy = t.centerY - this.centerY;
                    return dx * dx + dy * dy <= radius * radius;
                })
                    .sort((a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x))
                    .slice(0, maxTargets);
                for (const t of targets) {
                    const away = Math.sign(t.x - this.x) || this.facing;
                    world.damageEnemy(t, 28 * this.damageMultiplier(), {
                        // `fromX` do lado oposto inverte o empurrão: o corpo é puxado para Ozric.
                        fromX: t.x + away * 90,
                        knockback: 165,
                        hitstun: 0.55,
                        color: '#ff3357',
                        status: 'burn',
                        statusTime: 4,
                        shake: 0.14,
                    });
                    world.particles.ring(t.x, t.centerY, '#ffe6ea', 34, 0.28, 2);
                    world.particles.burst(t.x, t.centerY, 9, '#ffe6ea', {
                        speed: 120,
                        gravity: -45,
                        size: 1.7,
                        color2: '#ff6a9a',
                        life: 0.4,
                    });
                    this.pullSoul(world, t.x, t.centerY);
                }
                world.after(0.4, () => {
                    world.particles.ring(this.x, this.centerY, '#ffe6ea', 104, 0.4, 3);
                    world.particles.ring(this.x, this.centerY, '#ff6a9a', 142, 0.45, 2);
                    world.particles.burst(this.x, this.centerY, 20, '#ff6a9a', {
                        speed: 190,
                        gravity: -40,
                        size: 2.6,
                        color2: '#ffffff',
                        life: 0.45,
                    });
                });
                break;
            }
            case 'elodie': {
                world.audio.sfx('seal');
                world.shake(0.45);
                world.flash('#fff4cd', 0.24);
                const radius = 330;
                world.sealEnemies(radius, 2.6);
                world.clearEnemyProjectiles(this.x, this.centerY, radius);
                world.particles.ring(this.x, this.centerY, '#fff4cd', radius, 0.8, 6);
                world.particles.ring(this.x, this.centerY, c.accent, radius * 0.7, 0.6, 3);
                world.spawnHazard({
                    kind: 'seal',
                    x: this.x,
                    y: world.groundY,
                    radius: 320,
                    duration: 1.1,
                    damage: 0,
                    owner: 'player',
                    color: '#ffe6a3',
                    accent: '#ffffff',
                });
                for (let i = 0; i < 3; i++) {
                    world.after(i * 0.08, () => {
                        world.particles.rune(this.x + rand(-120, 120), this.centerY + rand(-70, 70), '#fff4cd');
                    });
                }
                break;
            }
            case 'thryc': {
                world.audio.sfx('echo');
                world.flash(c.accent, 0.2);
                world.shake(0.4);
                const echoDef = this.lastAttack ?? MOVESETS.thryc.heavy;
                const ox = this.lastAttackX;
                const dir = this.lastAttackDir;
                world.particles.ring(this.x, this.centerY, c.accent, 120, 0.5, 4);
                for (let i = 0; i < 3; i++) {
                    world.after(0.12 + i * 0.2, () => {
                        const ex = ox + dir * (30 + i * 26);
                        world.particles.slash(ex, this.centerY - 10, dir > 0 ? -0.2 : Math.PI + 0.2, c.accent, 100, 0.25);
                        world.particles.ring(ex, this.centerY - 10, c.glow, 64, 0.32, 2);
                        world.spawnHazard({
                            kind: 'rift',
                            x: ex,
                            y: world.groundY,
                            radius: 88,
                            duration: 0.3,
                            damage: echoDef.damage * 0.7 * this.damageMultiplier(),
                            owner: 'player',
                            color: c.accent,
                            accent: '#ffffff',
                        });
                        world.audio.sfx('echo');
                        world.shake(0.15);
                    });
                }
                world.text('ECO', this.x, this.y - 140, c.accent, 20);
                break;
            }
        }
    }
    /** Correntes de alma: espectros saem do alvo e são arrastados até Ozric. */
    pullSoul(world, fromX, fromY) {
        const dx = this.x - fromX;
        const dy = this.centerY - fromY;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const life = clamp(dist / 460, 0.42, 0.85);
        const midX = (fromX + this.x) / 2;
        const midY = (fromY + this.centerY) / 2 - 26;
        world.particles.bolt([
            { x: fromX, y: fromY },
            { x: midX, y: midY },
            { x: this.x, y: this.centerY },
        ], '#ff3357', 0.42, 3.2);
        world.particles.bolt([{ x: fromX, y: fromY + 7 }, { x: this.x, y: this.centerY - 5 }], '#ffffff', 0.3, 1.6);
        // Espectro principal, seguido por um rastro de almas menores.
        world.particles.spawn({
            kind: 'soul',
            x: fromX,
            y: fromY,
            vx: dx / life,
            vy: dy / life,
            life,
            size: 8.2,
            color: '#ff6a9a',
            color2: '#ffffff',
            drag: 0.06,
            gravity: -26,
            rot: rand(-0.4, 0.4),
            vrot: rand(-7, 7),
            additive: true,
        });
        for (let i = 0; i < 4; i++) {
            const spread = i - 1.5;
            world.particles.spawn({
                kind: 'soul',
                x: fromX + rand(-10, 10),
                y: fromY + rand(-14, 14),
                vx: dx / life * (0.9 + i * 0.07) + spread * 14 + rand(-10, 10),
                vy: dy / life * (0.9 + i * 0.07) + rand(-14, 14),
                life: life * (0.78 + i * 0.07),
                size: 4.4 + i * 0.55,
                color: '#ff6a9a',
                color2: '#ffffff',
                drag: 0.08,
                gravity: -24,
                rot: rand(-0.6, 0.6),
                vrot: rand(-9, 9),
                flicker: 1,
                additive: true,
                delay: 0.04 + i * 0.05,
            });
        }
    }
    counterRiposte(world) {
        if (!this.attack)
            return;
        const dir = this.facing;
        this.counterFlash = 0.6;
        world.hitStop(0.1);
        world.flash('#fff4cd', 0.28);
        world.shake(0.5);
        world.audio.sfx('seal');
        world.particles.ring(this.x, this.centerY, '#fff4cd', 120, 0.45, 5);
        world.particles.slash(this.x + dir * 80, this.centerY, dir > 0 ? -0.3 : Math.PI + 0.3, '#fff4cd', 130, 0.28);
        const targets = [...world.enemies];
        if (world.boss && !world.boss.dead)
            targets.push(world.boss);
        for (const t of targets) {
            if (t.dead)
                continue;
            if (Math.abs(t.x - this.x) > 185 || Math.abs(t.centerY - this.centerY) > 120)
                continue;
            world.damageEnemy(t, 42, {
                fromX: this.x,
                knockback: 260,
                launch: 140,
                hitstun: 0.6,
                color: '#fff4cd',
                crit: true,
                status: 'stun',
                statusTime: 1.1,
                shake: 0.2,
            });
        }
        this.attack = null;
        this.queued = null;
        this.comboTimer = 0;
        this.auraWindow = 3;
        this.invuln = Math.max(this.invuln, 0.7);
        this.heal(8);
        world.text('CONTRA-ATAQUE', this.x, this.y - 130, '#fff4cd', 18);
    }
    takeDamage(amount, opts, world) {
        if (this.dead)
            return 0;
        if (this.attack &&
            this.attack.def.trigger === 'counter' &&
            this.attack.t <= this.attack.def.startup + this.attack.def.active) {
            this.counterRiposte(world);
            return 0;
        }
        let scaled = amount;
        if (this.attack?.def.armor)
            scaled *= 0.55;
        if (this.dashTime > 0)
            scaled *= 0.45;
        const dealt = super.takeDamage(scaled, { ...opts, hitstun: opts.hitstun ?? 0.26 }, world);
        if (dealt > 0) {
            this.invuln = Math.max(this.invuln, 0.68);
            this.attack = null;
            this.queued = null;
            this.dashTime = 0;
            this.comboTimer = 0;
            this.comboHits = 0;
            this.comboTimerDisplay = 0;
            this.timeSinceHit = 0;
            if (this.charId === 'miriam')
                this.heat = Math.min(100, this.heat + dealt * 1.6);
            world.audio.sfx('hurt');
            world.shake(0.45);
            world.flash('#ff3357', 0.14);
            world.particles.burst(this.x, this.centerY, 12, '#ff3357', { speed: 220, gravity: 300, size: 3 });
            world.text(`-${Math.round(dealt)}`, this.x, this.y - 120, '#ff6a7a', 20);
        }
        return dealt;
    }
    onDeath(world) {
        world.audio.sfx('death');
        world.shake(1);
        world.flash('#ff3357', 0.3);
        world.particles.burst(this.x, this.centerY, 26, this.def.colors.accent, {
            speed: 260,
            gravity: 300,
            size: 3,
            life: 0.9,
        });
        world.particles.ring(this.x, this.centerY, this.def.colors.accent, 90, 0.6, 4);
        this.attack = null;
        this.dashTime = 0;
    }
}
//# sourceMappingURL=player.js.map