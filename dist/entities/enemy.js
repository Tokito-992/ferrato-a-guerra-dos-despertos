/** Inimigos comuns com IA própria por arquétipo. */
import { clamp, rand, rectsOverlap, TAU } from '../core/math.js?v=ab11b465bc0a';
import { Combatant } from './combatant.js?v=ab11b465bc0a';
import { ENEMY_BASE, ELITE_DAMAGE_MULT, ELITE_HP_MULT } from '../data/enemies.js?v=ab11b465bc0a';
export class Enemy extends Combatant {
    constructor(stage, kind, x, elite = false) {
        const base = ENEMY_BASE[kind];
        const hp = Math.round(base.hp * stage.difficulty * (elite ? ELITE_HP_MULT : 1));
        super(x, stage.floor, base.w * (elite ? 1.35 : 1), base.h * (elite ? 1.35 : 1), hp);
        this.state = 'spawn';
        this.stateTime = 0;
        this.cooldown = 0;
        this.spawnTimer = 0.55;
        this.alpha = 1;
        this.animPhase = Math.random() * 10;
        this.walkPhase = 0;
        this.attackTime = 0;
        this.didHit = false;
        this.windupFlash = 0;
        this.hoverOffset = 0;
        this.isHovering = false;
        this.contactCooldown = 0;
        this.telegraphLabel = '';
        this.def = base;
        this.stage = stage;
        this.elite = elite;
        this.displayName = elite ? stage.eliteName : stage.enemyNames[kind] ?? base.baseName;
        this.scale = base.scale * (elite ? 1.4 : 1);
        this.gravity = stage.gravity;
        this.animPhase = rand(0, 10);
        this.cooldown = rand(0.35, 1.1);
        this.isHovering = base.flying;
        // Voo baixo o bastante para que golpes terrestres alcancem o inimigo.
        this.y = base.flying ? stage.floor - 62 : stage.floor;
        this.onGround = !base.flying;
        this.state = 'spawn';
        this.spawnTimer = rand(0.4, 0.8);
        this.alpha = 0;
        this.hoverOffset = rand(0, TAU);
    }
    get windupRatio() {
        if (this.state !== 'windup')
            return 0;
        const w = Math.max(0.01, this.def.windup);
        return clamp(this.stateTime / w, 0, 1);
    }
    get damageValue() {
        return this.def.damage * this.stage.difficulty * (this.elite ? ELITE_DAMAGE_MULT : 1);
    }
    update(dt, world) {
        this.tickTimers(dt);
        this.animPhase += dt;
        this.contactCooldown = Math.max(0, this.contactCooldown - dt);
        this.windupFlash = Math.max(0, this.windupFlash - dt);
        if (this.dead) {
            this.updateDeath(dt, world);
            return;
        }
        if (this.state === 'spawn') {
            this.spawnTimer -= dt;
            this.alpha = clamp(1 - this.spawnTimer / 0.5, 0, 1);
            if (Math.random() < 0.5) {
                world.particles.spawn({
                    kind: 'ember',
                    x: this.x + rand(-this.w * 0.5, this.w * 0.5),
                    y: this.stage.floor - rand(0, 10),
                    vy: rand(-90, -20),
                    life: 0.4,
                    size: 2,
                    color: this.def.accent,
                });
            }
            if (this.spawnTimer <= 0) {
                this.state = 'chase';
                this.alpha = 1;
                world.particles.ring(this.x, this.centerY, this.def.accent, 46, 0.35, 2);
            }
            return;
        }
        if (this.hitstun > 0) {
            this.state = 'stagger';
            this.aiPhysics(dt, world, 6);
            return;
        }
        if (this.isStunned) {
            this.vx *= 0.86;
            if (!this.isHovering)
                this.applyPhysics(dt, this.stage.floor, 8);
            return;
        }
        if (this.state === 'stagger') {
            this.state = 'chase';
            this.stateTime = 0;
        }
        this.cooldown = Math.max(0, this.cooldown - dt);
        this.updateAI(dt, world);
        if (this.isHovering) {
            this.hoverMovement(dt, world);
        }
        else {
            this.applyPhysics(dt, this.stage.floor, 10);
        }
        this.x = clamp(this.x, world.camera.x + 10, world.camera.x + world.viewW - 10);
        this.applyStatuses(dt, world);
    }
    aiPhysics(dt, world, friction) {
        if (this.isHovering) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.vx *= Math.exp(-friction * dt);
            this.vy *= Math.exp(-friction * dt);
        }
        else {
            this.applyPhysics(dt, this.stage.floor, friction);
        }
        this.x = clamp(this.x, world.camera.x + 10, world.camera.x + world.viewW - 10);
    }
    hoverMovement(dt, world) {
        const baseY = this.stage.floor - 62;
        const bob = Math.sin(this.animPhase * 2.2 + this.hoverOffset) * 10;
        if (this.state === 'chase' || this.state === 'hover' || this.state === 'recover') {
            this.y += (baseY + bob - this.y) * Math.min(1, dt * 4);
        }
        this.x += this.vx * dt;
        this.vx *= Math.exp(-3.5 * dt);
        this.vy = 0;
    }
    updateAI(dt, world) {
        const player = world.player;
        const dx = player.x - this.x;
        const adx = Math.abs(dx);
        this.stateTime += dt;
        switch (this.def.ai) {
            case 'leaper': {
                if (this.state === 'chase') {
                    this.faceToward(player.x);
                    if (adx > this.def.range || adx > 260) {
                        this.vx = Math.sign(dx) * this.def.speed;
                        this.walkPhase += dt * 10;
                    }
                    else {
                        this.vx *= 0.85;
                        if (this.cooldown <= 0)
                            this.beginWindup();
                    }
                }
                else if (this.state === 'windup' && this.stateTime >= this.def.windup) {
                    this.state = 'attack';
                    this.stateTime = 0;
                    this.didHit = false;
                    this.vy = -560;
                    this.vx = Math.sign(dx) * 300;
                    this.onGround = false;
                    world.audio.sfx('jump');
                    world.particles.burst(this.x, this.y - 6, 8, this.def.accent, { speed: 160, gravity: 300 });
                }
                else if (this.state === 'attack') {
                    this.vx *= 0.995;
                    if (!this.didHit && this.y > this.stage.floor - this.h * this.scale - 40) {
                        const box = { x: this.x - 34, y: this.y - 58, w: 68, h: 62 };
                        if (rectsOverlap(box, player.hurtbox))
                            this.hitPlayer(world, 1, 190);
                    }
                    if (this.onGround || this.stateTime > 0.75) {
                        this.touchGroundBurst(world);
                        this.state = 'recover';
                        this.stateTime = 0;
                        this.cooldown = this.def.attackCooldown * rand(0.9, 1.2);
                    }
                }
                else if (this.state === 'recover' && this.stateTime > 0.35) {
                    this.state = 'chase';
                    this.stateTime = 0;
                }
                break;
            }
            case 'melee':
            case 'mirror': {
                const reach = this.def.range;
                if (this.state === 'chase') {
                    this.faceToward(player.x);
                    if (adx > reach) {
                        this.vx = Math.sign(dx) * this.def.speed;
                        this.walkPhase += dt * 9;
                    }
                    else {
                        this.vx *= 0.8;
                        if (this.cooldown <= 0) {
                            this.beginWindup();
                            if (this.def.ai === 'mirror' && Math.random() < 0.5) {
                                this.teleportNear(player.x + (Math.random() < 0.5 ? -90 : 90), world);
                            }
                        }
                    }
                }
                else if (this.state === 'windup' && this.stateTime >= this.def.windup) {
                    this.state = 'attack';
                    this.stateTime = 0;
                    this.didHit = false;
                    this.vx = this.facing * 170;
                    if (this.def.ai === 'mirror') {
                        world.spawnProjectile({
                            x: this.x + this.facing * 30,
                            y: this.y - 64,
                            vx: this.facing * 380,
                            vy: 0,
                            radius: 13,
                            damage: this.damageValue * 0.8,
                            owner: 'enemy',
                            color: this.def.accent,
                            accent: '#ffffff',
                            life: 1.2,
                            style: 'echo',
                        });
                    }
                }
                else if (this.state === 'attack') {
                    if (!this.didHit) {
                        const reachBox = {
                            x: this.x + (this.facing > 0 ? 6 : -96),
                            y: this.y - 96,
                            w: 90,
                            h: 84,
                        };
                        if (rectsOverlap(reachBox, player.hurtbox))
                            this.hitPlayer(world, 1, 260);
                    }
                    if (this.stateTime >= this.def.attackDuration) {
                        this.state = 'recover';
                        this.stateTime = 0;
                        this.cooldown = this.def.attackCooldown * rand(0.85, 1.25);
                    }
                }
                else if (this.state === 'recover' && this.stateTime > 0.4) {
                    this.state = 'chase';
                    this.stateTime = 0;
                }
                break;
            }
            case 'flyer': {
                const targetX = player.x - Math.sign(dx) * 190 + Math.sin(this.animPhase * 1.4) * 40;
                if (this.state === 'chase') {
                    this.vx = clamp((targetX - this.x) * 1.6, -this.def.speed, this.def.speed);
                    this.faceToward(player.x);
                    if (this.cooldown <= 0 && adx < 520)
                        this.beginWindup();
                }
                else if (this.state === 'windup' && this.stateTime >= this.def.windup) {
                    this.state = 'attack';
                    this.stateTime = 0;
                    const shots = this.elite ? 3 : 1;
                    for (let i = 0; i < shots; i++) {
                        const spread = (i - (shots - 1) / 2) * 0.16;
                        const angle = Math.atan2(player.centerY - (this.y - 30), player.x - this.x) + spread;
                        world.spawnProjectile({
                            x: this.x,
                            y: this.y - 30,
                            vx: Math.cos(angle) * 330,
                            vy: Math.sin(angle) * 330,
                            radius: 10,
                            damage: this.damageValue,
                            owner: 'enemy',
                            color: this.def.accent,
                            accent: '#ffffff',
                            life: 2.6,
                            style: 'plasma',
                        });
                    }
                    world.audio.sfx('zap');
                    this.cooldown = this.def.attackCooldown * rand(0.9, 1.2);
                }
                else if (this.state === 'attack' && this.stateTime > 0.3) {
                    this.state = 'chase';
                    this.stateTime = 0;
                }
                break;
            }
            case 'charger': {
                if (this.state === 'chase') {
                    this.faceToward(player.x);
                    if (adx > 190) {
                        this.vx = Math.sign(dx) * this.def.speed;
                        this.walkPhase += dt * 12;
                    }
                    else {
                        this.vx *= 0.8;
                        if (this.cooldown <= 0)
                            this.beginWindup();
                    }
                }
                else if (this.state === 'windup' && this.stateTime >= this.def.windup) {
                    this.state = 'attack';
                    this.stateTime = 0;
                    this.didHit = false;
                    this.vx = this.facing * 700;
                    world.audio.sfx('dash');
                    world.particles.burst(this.x - this.facing * 20, this.y - 30, 10, this.def.accent, { speed: 140, gravity: 150 });
                }
                else if (this.state === 'attack') {
                    if (!this.didHit && this.stateTime < 0.36) {
                        const box = { x: this.x - 46, y: this.y - 64, w: 92, h: 68 };
                        if (rectsOverlap(box, player.hurtbox))
                            this.hitPlayer(world, 1, 300);
                    }
                    if (this.stateTime > this.def.attackDuration) {
                        this.state = 'recover';
                        this.stateTime = 0;
                        this.cooldown = this.def.attackCooldown * rand(0.9, 1.2);
                    }
                }
                else if (this.state === 'recover' && this.stateTime > 0.55) {
                    this.state = 'chase';
                    this.stateTime = 0;
                }
                break;
            }
            case 'caster': {
                if (this.state === 'chase') {
                    this.faceToward(player.x);
                    const ideal = 300;
                    if (adx < ideal - 60)
                        this.vx = -Math.sign(dx) * this.def.speed;
                    else if (adx > ideal + 80)
                        this.vx = Math.sign(dx) * this.def.speed;
                    else
                        this.vx *= 0.85;
                    if (this.cooldown <= 0)
                        this.beginWindup();
                }
                else if (this.state === 'windup' && this.stateTime >= this.def.windup) {
                    this.state = 'attack';
                    this.stateTime = 0;
                    const angle = Math.atan2(player.centerY - (this.y - 66), player.x - this.x);
                    const shots = this.elite ? 3 : 1;
                    for (let i = 0; i < shots; i++) {
                        world.spawnProjectile({
                            x: this.x + Math.cos(angle) * 26,
                            y: this.y - 66,
                            vx: Math.cos(angle + (i - (shots - 1) / 2) * 0.2) * 300,
                            vy: Math.sin(angle + (i - (shots - 1) / 2) * 0.2) * 300,
                            radius: this.elite ? 15 : 12,
                            damage: this.damageValue,
                            owner: 'enemy',
                            color: this.def.accent,
                            accent: '#ffffff',
                            life: 3.2,
                            style: 'orb',
                            homing: 0.9,
                        });
                    }
                    if (this.elite) {
                        world.spawnHazard({
                            kind: 'explosion',
                            x: player.x,
                            y: player.y,
                            radius: 95,
                            duration: 0.6,
                            damage: this.damageValue * 1.2,
                            owner: 'enemy',
                            color: this.def.accent,
                            delay: 0.5,
                        });
                    }
                    world.audio.sfx('gravity');
                    this.cooldown = this.def.attackCooldown * rand(0.9, 1.2);
                }
                else if (this.state === 'attack' && this.stateTime > 0.35) {
                    this.state = 'chase';
                    this.stateTime = 0;
                }
                break;
            }
            case 'brute': {
                if (this.state === 'chase') {
                    this.faceToward(player.x);
                    if (adx > this.def.range) {
                        this.vx = Math.sign(dx) * this.def.speed;
                        this.walkPhase += dt * 6;
                    }
                    else {
                        this.vx *= 0.9;
                        if (this.cooldown <= 0)
                            this.beginWindup();
                    }
                }
                else if (this.state === 'windup' && this.stateTime >= this.def.windup) {
                    this.state = 'attack';
                    this.stateTime = 0;
                    this.doBruteSlam(world);
                    this.cooldown = this.def.attackCooldown * rand(0.9, 1.2);
                }
                else if (this.state === 'attack' && this.stateTime > this.def.attackDuration) {
                    this.state = 'recover';
                    this.stateTime = 0;
                }
                else if (this.state === 'recover' && this.stateTime > 0.5) {
                    this.state = 'chase';
                    this.stateTime = 0;
                }
                break;
            }
            case 'teleporter': {
                if (this.state === 'chase') {
                    this.faceToward(player.x);
                    if (adx > 120) {
                        this.vx = Math.sign(dx) * this.def.speed;
                        this.walkPhase += dt * 10;
                    }
                    else {
                        this.vx *= 0.8;
                    }
                    if (this.cooldown <= 0) {
                        this.beginWindup();
                        this.teleportNear(player.x - Math.sign(dx || 1) * 80, world);
                    }
                }
                else if (this.state === 'windup' && this.stateTime >= this.def.windup) {
                    this.state = 'attack';
                    this.stateTime = 0;
                    this.didHit = false;
                    this.faceToward(player.x);
                }
                else if (this.state === 'attack') {
                    if (!this.didHit) {
                        const box = { x: this.x + (this.facing > 0 ? 0 : -84), y: this.y - 92, w: 84, h: 80 };
                        if (rectsOverlap(box, player.hurtbox))
                            this.hitPlayer(world, 1, 240);
                    }
                    if (this.stateTime > this.def.attackDuration) {
                        this.state = 'recover';
                        this.stateTime = 0;
                        this.cooldown = this.def.attackCooldown * rand(0.9, 1.25);
                    }
                }
                else if (this.state === 'recover' && this.stateTime > 0.35) {
                    this.state = 'chase';
                    this.stateTime = 0;
                }
                break;
            }
            case 'turret': {
                this.faceToward(player.x);
                if (this.state === 'chase') {
                    this.vx = clamp((player.x - this.x) * 0.4, -this.def.speed, this.def.speed);
                    if (adx < 700 && this.cooldown <= 0)
                        this.beginWindup();
                }
                else if (this.state === 'windup' && this.stateTime >= this.def.windup) {
                    this.state = 'attack';
                    this.stateTime = 0;
                    const count = this.elite ? 5 : 3;
                    const baseAngle = Math.atan2(player.centerY - (this.y - 80), player.x - this.x);
                    for (let i = 0; i < count; i++) {
                        const a = baseAngle + (i - (count - 1) / 2) * 0.22;
                        world.spawnProjectile({
                            x: this.x,
                            y: this.y - 80,
                            vx: Math.cos(a) * 300,
                            vy: Math.sin(a) * 300,
                            radius: 12,
                            damage: this.damageValue,
                            owner: 'enemy',
                            color: this.def.accent,
                            accent: '#ffffff',
                            life: 3,
                            style: 'star',
                        });
                    }
                    world.audio.sfx('beam');
                    this.cooldown = this.def.attackCooldown * rand(0.9, 1.2);
                }
                else if (this.state === 'attack' && this.stateTime > 0.35) {
                    this.state = 'chase';
                    this.stateTime = 0;
                }
                break;
            }
            case 'diver': {
                if (this.state === 'hover' || this.state === 'chase') {
                    this.state = 'chase';
                    const targetX = player.x - Math.sign(dx) * 120;
                    this.vx = clamp((targetX - this.x) * 1.3, -this.def.speed, this.def.speed);
                    this.faceToward(player.x);
                    if (this.cooldown <= 0)
                        this.beginWindup();
                }
                else if (this.state === 'windup' && this.stateTime >= this.def.windup) {
                    this.state = 'attack';
                    this.stateTime = 0;
                    this.didHit = false;
                    this.isHovering = false;
                    this.vy = 300;
                    this.vx = Math.sign(dx) * 380;
                    this.onGround = false;
                    world.audio.sfx('dash');
                }
                else if (this.state === 'attack') {
                    if (!this.didHit) {
                        const box = { x: this.x - 40, y: this.y - 80, w: 80, h: 78 };
                        if (rectsOverlap(box, player.hurtbox))
                            this.hitPlayer(world, 1, 260);
                    }
                    if (this.onGround || this.stateTime > 0.9) {
                        this.state = 'recover';
                        this.stateTime = 0;
                        this.isHovering = true;
                        this.y = Math.max(this.stage.floor - 60, this.y);
                        this.cooldown = this.def.attackCooldown * rand(0.9, 1.2);
                        world.particles.ring(this.x, this.y, this.def.accent, 60, 0.4, 3);
                    }
                }
                else if (this.state === 'recover' && this.stateTime > 0.5) {
                    this.state = 'chase';
                    this.stateTime = 0;
                }
                break;
            }
        }
    }
    beginWindup() {
        this.state = 'windup';
        this.stateTime = 0;
        this.windupFlash = 0.12;
        this.telegraphLabel = this.def.windupFx;
    }
    doBruteSlam(world) {
        const radius = this.elite ? 170 : 135;
        world.audio.sfx('heavy');
        world.shake(0.55);
        world.particles.ring(this.x, this.stage.floor - 6, this.def.accent, radius, 0.5, 5);
        world.particles.burst(this.x, this.stage.floor - 8, 18, this.def.accent, {
            speed: 300,
            gravity: 600,
            angle: -Math.PI / 2,
            spread: Math.PI,
            kind: 'magma',
            size: 3.4,
        });
        const distToPlayer = Math.abs(world.player.x - this.x);
        if (distToPlayer < radius && Math.abs(world.player.y - this.stage.floor) < 90) {
            world.damagePlayer(this.damageValue * 1.15, {
                fromX: this.x,
                knockback: 420,
                launch: 260,
                hitstun: 0.4,
                color: this.def.accent,
            });
        }
        world.spawnHazard({
            kind: 'shock',
            x: this.x,
            y: this.stage.floor,
            radius,
            duration: 0.45,
            damage: 0,
            owner: 'enemy',
            color: this.def.accent,
        });
    }
    teleportNear(x, world) {
        const target = clamp(x, world.camera.x + 40, world.camera.x + world.viewW - 40);
        world.particles.burst(this.x, this.centerY, 12, this.def.accent, { speed: 130, gravity: -40, kind: 'smoke', size: 8 });
        this.x = target;
        this.stateTime = 0;
        world.particles.burst(this.x, this.centerY, 12, this.def.accent, { speed: 130, gravity: -40, kind: 'smoke', size: 8 });
        world.audio.sfx('blink');
        this.faceToward(world.player.x);
    }
    hitPlayer(world, mult, knockback) {
        this.didHit = true;
        const dealt = world.damagePlayer(this.damageValue * mult, {
            fromX: this.x,
            knockback,
            launch: 120,
            hitstun: 0.22,
            color: this.def.accent,
        });
        if (dealt > 0) {
            world.hitStop(0.045);
            world.shake(0.22);
        }
    }
    touchGroundBurst(world) {
        world.particles.burst(this.x, this.stage.floor - 4, 8, this.def.accent, {
            speed: 160,
            angle: -Math.PI / 2,
            spread: Math.PI * 0.9,
            gravity: 500,
            size: 2.6,
        });
    }
    updateDeath(dt, world) {
        this.alpha = clamp(1 - this.deathTimer / 0.9, 0, 1);
        this.applyPhysics(dt, this.stage.floor, 4);
        if (this.deathTimer > 0.25 && Math.random() < 0.35) {
            world.particles.spawn({
                kind: 'smoke',
                x: this.x + rand(-this.w / 2, this.w / 2),
                y: this.centerY + rand(-this.h / 2, this.h / 2),
                vx: rand(-20, 20),
                vy: rand(-70, -20),
                life: 0.6,
                size: rand(8, 16),
                color: this.def.accent,
                gravity: -30,
            });
        }
    }
    onDeath(world) {
        world.enemyKilled(this);
        world.particles.burst(this.x, this.centerY, this.elite ? 34 : 18, this.def.accent, {
            speed: this.elite ? 380 : 260,
            gravity: 300,
            size: 3.4,
            color2: '#ffffff',
            life: 0.8,
        });
        world.particles.ring(this.x, this.centerY, this.def.accent, this.elite ? 150 : 80, 0.5, 3);
        world.audio.sfx(this.elite ? 'explode' : 'death');
        if (this.elite) {
            world.shake(0.7);
            world.flash(this.def.accent, 0.16);
        }
        for (let i = 0; i < (this.elite ? 14 : 6); i++) {
            world.particles.spawn({
                kind: 'shard',
                x: this.x + rand(-20, 20),
                y: this.centerY + rand(-30, 30),
                vx: rand(-180, 180),
                vy: rand(-260, -60),
                gravity: 700,
                life: rand(0.6, 1.1),
                size: rand(3, 6),
                color: this.def.color,
                vrot: rand(-10, 10),
            });
        }
    }
}
//# sourceMappingURL=enemy.js.map