/** Chefes com múltiplos estágios, telegrafia e padrões únicos por fase. */
import { clamp, rand, rectsOverlap, TAU } from '../core/math.js?v=ab11b465bc0a';
import { Combatant } from './combatant.js?v=ab11b465bc0a';
import { BOSSES } from '../data/bosses.js?v=ab11b465bc0a';
import { getStage } from '../data/stages.js?v=ab11b465bc0a';
const ATTACK_LABELS = {
    slam: 'PISADA',
    charge: 'INVESTIDA',
    debris: 'DETRITOS',
    summon: 'CHAMADO',
    rageSlam: 'FÚRIA',
    cannon: 'CANHÃO',
    dashSlash: 'LÂMINA',
    grenade: 'PLASMA',
    summonCrew: 'TROPA',
    barrage: 'BARRAGEM',
    orbital: 'ÓRBITA',
    laser: 'LASER',
    pull: 'GRAVIDADE',
    missiles: 'MÍSSEIS',
    beamSweep: 'VARREDURA',
    chainWhip: 'CORRENTE',
    firePillars: 'PILARES',
    teleportSlash: 'SALTO',
    summonSouls: 'ALMAS',
    hellRain: 'CHUVA RUBRA',
    featherFan: 'PENAS',
    diveSlash: 'MERGULHO',
    lightBeam: 'LUZ',
    summonSeraphs: 'CORO',
    wingStorm: 'TEMPESTADE',
    echoStrike: 'ECO',
    voidOrbs: 'VAZIO',
    groundRift: 'FENDAS',
    summonEchoes: 'MEMÓRIAS',
    celestialBeam: 'JULGAMENTO',
    gravityCrush: 'ESMAGAMENTO',
    summonPlanes: 'PLANOS',
    blackHole: 'SINGULARIDADE',
    allPlanes: 'TODOS OS PLANOS',
    timeStop: 'TEMPO',
    finalJudgment: 'SENTENÇA FINAL',
};
export class Boss extends Combatant {
    constructor(id, x, worldFloor) {
        const def = BOSSES[id];
        super(x, worldFloor, def.w, def.h, def.hp);
        this.phaseIndex = 0;
        this.state = 'intro';
        this.stateT = 0;
        this.introTimer = 2.6;
        this.idleTimer = 1.2;
        this.attackId = null;
        this.attackWindup = 0.7;
        this.attackDuration = 0.5;
        this.attackRecover = 0.7;
        this.warning = '';
        this.animPhase = 0;
        this.flashRing = 0;
        this.spawnedAdds = 0;
        /** Usado pelo HUD para pulsar a barra durante transição de fase. */
        this.phaseFlash = 0;
        this.volleyAcc = 0;
        this.volleyShots = 0;
        this.didContact = false;
        this.hoverPhase = 0;
        this.baseY = 0;
        this.def = def;
        this.scale = def.scale;
        this.gravity = 1950;
        this.facing = -1;
        // O chefe voador fica baixo o suficiente para ser atingido por golpes terrestres.
        this.baseY = def.flying ? worldFloor - 42 : worldFloor;
        this.y = this.baseY;
        this.onGround = !def.flying;
        this.invuln = 999;
        this.idleTimer = 1.4;
        this.hoverPhase = rand(0, TAU);
    }
    get phaseName() {
        return this.def.phases[this.phaseIndex]?.name ?? '';
    }
    get attackLabel() {
        return this.attackId ? ATTACK_LABELS[this.attackId] ?? this.attackId : '';
    }
    get isIntro() {
        return this.state === 'intro';
    }
    get isTransitioning() {
        return this.state === 'phase';
    }
    update(dt, world) {
        this.tickTimers(dt);
        this.animPhase += dt;
        this.phaseFlash = Math.max(0, this.phaseFlash - dt);
        this.flashRing = Math.max(0, this.flashRing - dt);
        if (this.dead) {
            this.alphaDeath(dt, world);
            return;
        }
        if (this.state === 'intro') {
            this.introTimer -= dt;
            this.faceToward(world.player.x);
            this.hoverBob(dt);
            this.invuln = 999;
            if (this.introTimer <= 0) {
                this.state = 'idle';
                this.invuln = 0;
                this.idleTimer = 0.7;
                this.phaseFlash = 0.6;
                world.audio.sfx('boss');
            }
            return;
        }
        if (this.state === 'phase') {
            this.stateT += dt;
            this.invuln = 999;
            this.hoverBob(dt);
            if (Math.random() < 0.5) {
                world.particles.spawn({
                    kind: 'spark',
                    x: this.x + rand(-this.w * 0.6, this.w * 0.6),
                    y: this.centerY + rand(-this.h * 0.4, this.h * 0.4),
                    vx: rand(-180, 180),
                    vy: rand(-200, 60),
                    life: 0.5,
                    size: 3,
                    color: this.def.colors.accent,
                    gravity: 0,
                });
            }
            if (this.stateT > 1.9) {
                this.state = 'idle';
                this.invuln = 0;
                this.stateT = 0;
                this.idleTimer = 0.6;
                this.hoverBob(dt);
            }
            return;
        }
        if (this.isStunned) {
            // Chefes resistem a atordoamento, mas ficam mais lentos.
            this.sealTime = Math.min(this.sealTime, 0.6);
        }
        this.faceToward(world.player.x);
        if (this.state === 'idle') {
            this.moveIdle(dt, world);
            this.idleTimer -= dt * this.pace;
            if (this.idleTimer <= 0)
                this.chooseAttack(world);
            return;
        }
        if (this.state === 'windup') {
            this.stateT += dt;
            this.warningParticles(world);
            if (this.stateT >= this.attackWindup) {
                this.state = 'execute';
                this.stateT = 0;
                this.volleyAcc = 0;
                this.volleyShots = 0;
                this.didContact = false;
                this.startAttack(world);
            }
            return;
        }
        if (this.state === 'execute') {
            this.stateT += dt;
            this.tickAttack(dt, world);
            if (this.stateT >= this.attackDuration) {
                this.state = 'recover';
                this.stateT = 0;
            }
            return;
        }
        if (this.state === 'recover') {
            this.stateT += dt;
            this.hoverBob(dt);
            if (this.stateT >= this.attackRecover) {
                this.state = 'idle';
                this.attackId = null;
                this.stateT = 0;
                this.idleTimer = rand(0.65, 1.15);
            }
        }
    }
    get pace() {
        return this.def.phases[this.phaseIndex]?.pace ?? 1;
    }
    hoverBob(dt) {
        if (!this.def.flying)
            return;
        const bob = Math.sin(this.animPhase * 1.8 + this.hoverPhase) * 12;
        this.y += (this.baseY + bob - this.y) * Math.min(1, dt * 3);
    }
    moveIdle(dt, world) {
        const p = world.player;
        const dx = p.x - this.x;
        const dist = Math.abs(dx);
        const preferred = this.def.preferredRange;
        let target = 0;
        if (dist > preferred + 70)
            target = Math.sign(dx) * 120 * this.pace;
        else if (dist < preferred - 110)
            target = -Math.sign(dx) * 90 * this.pace;
        if (this.def.flying) {
            this.vx += (target - this.vx) * Math.min(1, dt * 3);
            this.x += this.vx * dt;
            this.y += (this.baseY + Math.sin(this.animPhase * 1.8 + this.hoverPhase) * 12 - this.y) * Math.min(1, dt * 3);
        }
        else {
            this.vx = target;
            this.applyPhysics(dt, getStage(this.def.stage).floor, 8);
        }
        this.x = clamp(this.x, world.camera.x + 80, world.camera.x + world.viewW - 80);
    }
    chooseAttack(world) {
        const phase = this.def.phases[this.phaseIndex];
        const pool = phase.attacks.filter((a) => a !== this.attackId);
        const id = pool[Math.floor(Math.random() * pool.length)] ?? phase.attacks[0];
        this.attackId = id;
        const timing = this.attackTiming(id);
        this.attackWindup = timing[0];
        this.attackDuration = timing[1];
        this.attackRecover = timing[2];
        this.state = 'windup';
        this.stateT = 0;
        this.warning = ATTACK_LABELS[id] ?? id;
        world.audio.sfx('ui');
    }
    attackTiming(id) {
        switch (id) {
            case 'charge':
            case 'dashSlash':
                return [0.6, 0.8, 0.65];
            case 'barrage':
                return [0.5, 1.5, 0.7];
            case 'laser':
            case 'lightBeam':
            case 'celestialBeam':
                return [0.7, 1.2, 0.7];
            case 'beamSweep':
                return [0.8, 1.8, 0.8];
            case 'hellRain':
                return [0.9, 2.0, 0.9];
            case 'summon':
            case 'summonCrew':
            case 'summonSouls':
            case 'summonSeraphs':
            case 'summonEchoes':
            case 'summonPlanes':
                return [0.55, 0.4, 0.8];
            case 'timeStop':
                return [0.5, 1.1, 0.9];
            case 'finalJudgment':
                return [1.3, 2.2, 1.2];
            case 'blackHole':
                return [0.9, 0.8, 0.9];
            case 'pull':
            case 'gravityCrush':
                return [0.7, 1.2, 0.8];
            default:
                return [0.7, 0.55, 0.65];
        }
    }
    warningParticles(world) {
        if (Math.random() > 0.4)
            return;
        const t = this.stateT / Math.max(0.01, this.attackWindup);
        world.particles.spawn({
            kind: 'ember',
            x: this.x + rand(-this.w * 0.7, this.w * 0.7),
            y: this.centerY + rand(-this.h * 0.5, this.h * 0.5),
            vx: rand(-40, 40),
            vy: rand(-140, -40),
            life: 0.35,
            size: 2 + t * 3,
            color: this.def.colors.accent,
            gravity: 0,
        });
    }
    // ------------------------------------------------------------ ataques
    startAttack(world) {
        const id = this.attackId;
        switch (id) {
            case 'slam':
            case 'rageSlam':
            case 'finalJudgment':
                world.audio.sfx('roar');
                break;
            case 'cannon':
            case 'barrage':
                world.audio.sfx('beam');
                break;
            case 'laser':
            case 'beamSweep':
                world.audio.sfx('beam');
                break;
            case 'teleportSlash':
                this.teleport(world);
                world.audio.sfx('blink');
                break;
            case 'summon':
                this.summon(world, 'crawler', 2);
                break;
            case 'summonCrew':
                this.summon(world, 'warrior', 2);
                break;
            case 'summonSouls':
                this.summon(world, 'shade', 2);
                break;
            case 'summonSeraphs':
                this.summon(world, 'seraph', 2);
                break;
            case 'summonEchoes':
                this.summon(world, 'echo', 2);
                break;
            case 'summonPlanes': {
                const kinds = ['shade', 'seraph', 'construct', 'brute'];
                this.summon(world, kinds[Math.floor(rand(0, kinds.length))], 1);
                this.summon(world, kinds[Math.floor(rand(0, kinds.length))], 1);
                break;
            }
            case 'gravityCrush':
                world.spawnHazard({
                    kind: 'void',
                    x: world.player.x,
                    y: world.player.y,
                    radius: 200,
                    duration: 2.1,
                    damage: 7,
                    tick: 0.35,
                    pull: 260,
                    finalBurst: 22,
                    owner: 'enemy',
                    color: this.def.colors.accent,
                    accent: this.def.colors.glow,
                });
                world.audio.sfx('gravity');
                world.shake(0.6);
                break;
            case 'blackHole':
                world.spawnHazard({
                    kind: 'void',
                    x: this.x,
                    y: this.y,
                    radius: 310,
                    duration: 3.2,
                    damage: 8,
                    tick: 0.4,
                    pull: 420,
                    finalBurst: 34,
                    owner: 'enemy',
                    color: '#3a0a5a',
                    accent: this.def.colors.accent,
                });
                world.audio.sfx('gravity');
                world.shake(1);
                world.flash(this.def.colors.accent, 0.2);
                break;
            case 'timeStop':
                world.flash('#ffffff', 0.55);
                world.shake(0.9);
                world.audio.sfx('seal');
                world.text('O TEMPO É MEU', this.x, this.centerY - 150, this.def.colors.accent, 30);
                this.teleport(world);
                break;
        }
    }
    tickAttack(dt, world) {
        const id = this.attackId;
        const player = world.player;
        switch (id) {
            case 'slam': {
                if (!this.didContact) {
                    this.didContact = true;
                    this.groundSlam(world, 300, 18);
                }
                break;
            }
            case 'rageSlam': {
                if (this.stateT < 1.0) {
                    this.volleyAcc += dt;
                    if (this.volleyAcc > 0.32) {
                        this.volleyAcc = 0;
                        this.groundSlam(world, 170 + rand(0, 90), 12);
                    }
                }
                break;
            }
            case 'charge': {
                this.vx = Math.sign(player.x - this.x) * 760 * this.pace;
                this.x += this.vx * dt;
                this.x = clamp(this.x, world.camera.x + 80, world.camera.x + world.viewW - 80);
                this.contactDamage(world, 150, 20);
                this.dustTrail(world, this.def.colors.primary);
                break;
            }
            case 'debris': {
                this.volleyAcc += dt;
                if (this.volleyAcc > 0.18) {
                    this.volleyAcc = 0;
                    const dx = player.x - this.x;
                    world.spawnProjectile({
                        x: this.x,
                        y: this.y - this.h * 0.7,
                        vx: dx * rand(0.7, 1.4),
                        vy: -420 + rand(-80, 80),
                        radius: 14,
                        damage: 12,
                        owner: 'enemy',
                        color: this.def.colors.accent,
                        accent: this.def.colors.eye,
                        gravity: 900,
                        life: 2.2,
                        style: 'star',
                        spin: 8,
                    });
                }
                break;
            }
            case 'cannon': {
                if (!this.didContact) {
                    this.didContact = true;
                    this.fireAimed(world, 520, 18, 22, 'plasma');
                    this.fireAimed(world, 430, 10, 12, 'plasma', 0.18);
                    this.fireAimed(world, 430, 10, 12, 'plasma', -0.18);
                    world.audio.sfx('beam');
                }
                break;
            }
            case 'dashSlash': {
                this.vx = this.facing * 900;
                this.x += this.vx * dt;
                this.x = clamp(this.x, world.camera.x + 80, world.camera.x + world.viewW - 80);
                this.contactDamage(world, 140, 18);
                this.dustTrail(world, this.def.colors.accent);
                if (!this.didContact) {
                    this.didContact = false;
                    world.particles.slash(this.x + this.facing * 90, this.centerY, this.facing > 0 ? 0 : Math.PI, this.def.colors.accent, 130, 0.22);
                }
                break;
            }
            case 'grenade': {
                if (!this.didContact) {
                    this.didContact = true;
                    for (let i = 0; i < 3; i++) {
                        const x = player.x + rand(-150, 150);
                        world.spawnHazard({
                            kind: 'explosion',
                            x,
                            y: world.groundY,
                            radius: 90,
                            duration: 0.5,
                            damage: 15,
                            owner: 'enemy',
                            color: this.def.colors.accent,
                            delay: 0.55 + i * 0.15,
                        });
                    }
                    world.audio.sfx('explode');
                }
                break;
            }
            case 'barrage': {
                this.volleyAcc += dt;
                if (this.volleyAcc > 0.12 && this.volleyShots < 10) {
                    this.volleyAcc = 0;
                    this.volleyShots++;
                    this.fireAimed(world, 620, 8, 10, 'plasma', rand(-0.12, 0.12));
                    world.audio.sfx('zap');
                }
                break;
            }
            case 'orbital': {
                this.volleyAcc += dt;
                if (this.volleyAcc > 0.4) {
                    this.volleyAcc = 0;
                    this.radialBurst(world, 10, 260, 8, 'plasma', rand(0, TAU));
                    world.audio.sfx('gravity');
                }
                break;
            }
            case 'laser': {
                if (!this.didContact) {
                    this.didContact = true;
                    this.beamAt(world, player.x, 0.55);
                    this.beamAt(world, player.x - 170, 0.75);
                    this.beamAt(world, player.x + 170, 0.95);
                    world.audio.sfx('beam');
                    world.shake(0.4);
                }
                break;
            }
            case 'beamSweep': {
                if (!this.didContact) {
                    this.didContact = true;
                    const baseX = world.camera.x + 200;
                    for (let i = 0; i < 6; i++) {
                        this.beamAt(world, baseX + i * 190, 0.35 + i * 0.22);
                    }
                    world.audio.sfx('beam');
                }
                break;
            }
            case 'pull': {
                if (!this.didContact) {
                    this.didContact = true;
                    world.spawnHazard({
                        kind: 'void',
                        x: this.x,
                        y: this.y,
                        radius: 280,
                        duration: 2.2,
                        damage: 6,
                        tick: 0.4,
                        pull: 300,
                        finalBurst: 20,
                        owner: 'enemy',
                        color: '#2a1a5a',
                        accent: this.def.colors.accent,
                    });
                    world.audio.sfx('gravity');
                }
                this.radialBurst(world, 4, 300, 8, 'orb', this.stateT * 4);
                break;
            }
            case 'missiles': {
                this.volleyAcc += dt;
                if (this.volleyAcc > 0.22 && this.volleyShots < 5) {
                    this.volleyAcc = 0;
                    this.volleyShots++;
                    this.fireAimed(world, 240, 10, 11, 'star', rand(-0.2, 0.2), 1.6);
                    world.audio.sfx('zap');
                }
                break;
            }
            case 'chainWhip': {
                if (!this.didContact) {
                    this.didContact = true;
                    this.meleeArc(world, 340, 150, 18);
                    const dx = this.x - player.x;
                    player.vx = Math.sign(dx) * 460;
                    player.vy = -180;
                    world.particles.bolt([
                        { x: this.x, y: this.centerY },
                        { x: player.x, y: player.centerY },
                    ], this.def.colors.accent, 0.3, 5);
                    world.particles.slash(this.x + this.facing * 160, this.centerY, this.facing > 0 ? -0.1 : Math.PI + 0.1, this.def.colors.accent, 170, 0.3);
                    world.audio.sfx('slash');
                }
                break;
            }
            case 'firePillars': {
                this.volleyAcc += dt;
                if (this.volleyAcc > 0.28 && this.volleyShots < 5) {
                    this.volleyAcc = 0;
                    this.volleyShots++;
                    world.spawnHazard({
                        kind: 'explosion',
                        x: player.x + rand(-80, 80),
                        y: world.groundY,
                        radius: 85,
                        duration: 0.5,
                        damage: 14,
                        owner: 'enemy',
                        color: '#ff4a2f',
                        delay: 0.45,
                    });
                    world.audio.sfx('magma');
                }
                break;
            }
            case 'teleportSlash': {
                if (!this.didContact) {
                    this.didContact = true;
                    this.meleeArc(world, 210, 130, 14, true);
                    world.particles.slash(this.x + this.facing * 90, this.centerY, this.facing > 0 ? 0 : Math.PI, this.def.colors.accent, 140, 0.24);
                    this.teleport(world);
                }
                else if (this.stateT > 0.35) {
                    this.meleeArc(world, 210, 130, 14, true);
                    world.particles.slash(this.x + this.facing * 90, this.centerY, this.facing > 0 ? 0 : Math.PI, this.def.colors.accent, 140, 0.24);
                    this.teleport(world);
                    this.didContact = false;
                }
                break;
            }
            case 'hellRain': {
                this.volleyAcc += dt;
                if (this.volleyAcc > 0.2 && this.volleyShots < 9) {
                    this.volleyAcc = 0;
                    this.volleyShots++;
                    world.spawnHazard({
                        kind: 'explosion',
                        x: world.camera.x + rand(80, world.viewW - 80),
                        y: world.groundY,
                        radius: 80,
                        duration: 0.5,
                        damage: 12,
                        owner: 'enemy',
                        color: '#ff4a2f',
                        delay: rand(0.45, 0.9),
                    });
                    world.audio.sfx('magma');
                }
                break;
            }
            case 'featherFan': {
                if (!this.didContact) {
                    this.didContact = true;
                    const angle = Math.atan2(player.centerY - this.centerY, player.x - this.x);
                    for (let i = -3; i <= 3; i++) {
                        const a = angle + i * 0.16;
                        world.spawnProjectile({
                            x: this.x + Math.cos(a) * 40,
                            y: this.centerY + Math.sin(a) * 20,
                            vx: Math.cos(a) * 430,
                            vy: Math.sin(a) * 430,
                            radius: 11,
                            damage: 10,
                            owner: 'enemy',
                            color: this.def.colors.accent,
                            accent: '#ffffff',
                            life: 2.4,
                            style: 'feather',
                            spin: 6,
                        });
                    }
                    world.audio.sfx('slash');
                }
                break;
            }
            case 'diveSlash': {
                if (!this.didContact) {
                    this.didContact = true;
                    this.x = clamp(player.x + 30, world.camera.x + 80, world.camera.x + world.viewW - 80);
                    this.y = world.groundY - 70;
                    this.contactDamage(world, 150, 16);
                    this.groundSlam(world, 160, 10);
                    world.audio.sfx('explode');
                    world.particles.ring(this.x, this.y, this.def.colors.accent, 130, 0.5, 5);
                }
                break;
            }
            case 'lightBeam': {
                if (!this.didContact) {
                    this.didContact = true;
                    this.beamAt(world, player.x, 0.5);
                    this.beamAt(world, player.x - 150, 0.7);
                    this.beamAt(world, player.x + 150, 0.7);
                    this.radialBurst(world, 8, 280, 7, 'feather', this.stateT);
                    world.audio.sfx('beam');
                }
                break;
            }
            case 'wingStorm': {
                this.volleyAcc += dt;
                if (this.volleyAcc > 0.24 && this.volleyShots < 7) {
                    this.volleyAcc = 0;
                    this.volleyShots++;
                    this.radialBurst(world, 6, 320, 8, 'feather', this.volleyShots * 0.4);
                    world.audio.sfx('slash');
                }
                break;
            }
            case 'echoStrike': {
                if (!this.didContact) {
                    this.didContact = true;
                    this.summon(world, 'echo', 2);
                    this.radialBurst(world, 8, 260, 9, 'echo', rand(0, TAU));
                    world.audio.sfx('echo');
                }
                break;
            }
            case 'voidOrbs': {
                if (!this.didContact) {
                    this.didContact = true;
                    this.radialBurst(world, 14, 300, 10, 'orb', rand(0, TAU));
                    this.fireAimed(world, 360, 14, 16, 'orb');
                    world.audio.sfx('gravity');
                    world.shake(0.4);
                }
                break;
            }
            case 'groundRift': {
                this.volleyAcc += dt;
                if (this.volleyAcc > 0.24 && this.volleyShots < 6) {
                    this.volleyAcc = 0;
                    this.volleyShots++;
                    world.spawnHazard({
                        kind: 'explosion',
                        x: player.x + rand(-120, 120),
                        y: world.groundY,
                        radius: 95,
                        duration: 0.45,
                        damage: 13,
                        owner: 'enemy',
                        color: this.def.colors.accent,
                        delay: 0.4,
                    });
                }
                break;
            }
            case 'celestialBeam': {
                this.volleyAcc += dt;
                if (this.volleyAcc > 0.3 && this.volleyShots < 6) {
                    this.volleyAcc = 0;
                    this.volleyShots++;
                    this.beamAt(world, world.camera.x + 120 + this.volleyShots * 160, 0.5);
                    world.audio.sfx('beam');
                }
                break;
            }
            case 'gravityCrush':
            case 'blackHole':
            case 'pull':
                break;
            case 'allPlanes': {
                this.volleyAcc += dt;
                if (this.volleyAcc > 0.5) {
                    this.volleyAcc = 0;
                    const mode = this.volleyShots % 3;
                    this.volleyShots++;
                    if (mode === 0) {
                        this.radialBurst(world, 10, 340, 10, 'plasma', rand(0, TAU));
                    }
                    else if (mode === 1) {
                        this.beamAt(world, player.x, 0.4);
                        this.beamAt(world, player.x + 180, 0.6);
                    }
                    else {
                        this.groundSlam(world, 200, 14);
                    }
                }
                break;
            }
            case 'timeStop': {
                this.volleyAcc += dt;
                if (this.volleyAcc > 0.16) {
                    this.volleyAcc = 0;
                    this.volleyShots++;
                    const x = player.x + rand(-90, 90);
                    world.spawnHazard({
                        kind: 'explosion',
                        x,
                        y: world.groundY,
                        radius: 70,
                        duration: 0.3,
                        damage: 10,
                        owner: 'enemy',
                        color: '#ffffff',
                        delay: 0.12,
                    });
                    this.teleport(world);
                    if (this.volleyShots % 2 === 0)
                        world.audio.sfx('blink');
                }
                break;
            }
            case 'finalJudgment': {
                this.volleyAcc += dt;
                if (this.volleyAcc > 0.4) {
                    this.volleyAcc = 0;
                    this.volleyShots++;
                    if (this.volleyShots <= 3) {
                        this.radialBurst(world, 12, 360, 12, 'orb', this.volleyShots);
                        world.flash(this.def.colors.accent, 0.12);
                    }
                    else if (this.volleyShots <= 6) {
                        this.beamAt(world, world.camera.x + 200 + (this.volleyShots - 4) * 300, 0.4);
                    }
                    else if (this.volleyShots === 7) {
                        this.groundSlam(world, 380, 20);
                    }
                }
                break;
            }
        }
    }
    groundSlam(world, radius, damage) {
        world.shake(0.9);
        world.audio.sfx('heavy');
        world.particles.ring(this.x, world.groundY - 6, this.def.colors.accent, radius, 0.55, 7);
        world.particles.burst(this.x, world.groundY - 8, 22, this.def.colors.accent, {
            speed: 380,
            angle: -Math.PI / 2,
            spread: Math.PI,
            gravity: 800,
            size: 4,
            kind: 'magma',
        });
        world.spawnHazard({
            kind: 'shock',
            x: this.x,
            y: world.groundY,
            radius,
            duration: 0.55,
            damage: 0,
            owner: 'enemy',
            color: this.def.colors.accent,
        });
        const p = world.player;
        if (Math.abs(p.x - this.x) < radius && p.y > world.groundY - 120) {
            world.damagePlayer(damage, {
                fromX: this.x,
                knockback: 400,
                launch: 260,
                hitstun: 0.4,
                color: this.def.colors.accent,
            });
        }
    }
    contactDamage(world, width, damage) {
        const p = world.player;
        const box = {
            x: this.x - width,
            y: this.y - this.h * this.scale,
            w: width * 2,
            h: this.h * this.scale,
        };
        if (rectsOverlap(box, p.hurtbox)) {
            const dealt = world.damagePlayer(damage, {
                fromX: this.x,
                knockback: 360,
                launch: 160,
                hitstun: 0.3,
                color: this.def.colors.accent,
            });
            if (dealt > 0) {
                world.shake(0.5);
                world.hitStop(0.05);
            }
        }
    }
    meleeArc(world, range, height, damage, fast = false) {
        const p = world.player;
        const box = {
            x: this.x + (this.facing > 0 ? 0 : -range),
            y: this.y - height,
            w: range,
            h: height + 40,
        };
        if (rectsOverlap(box, p.hurtbox)) {
            world.damagePlayer(damage, {
                fromX: this.x,
                knockback: fast ? 240 : 340,
                launch: 140,
                hitstun: 0.3,
                color: this.def.colors.accent,
            });
            world.shake(0.35);
        }
        world.particles.slash(this.x + this.facing * range * 0.45, this.centerY, this.facing > 0 ? -0.15 : Math.PI + 0.15, this.def.colors.accent, range * 0.55, 0.24);
    }
    fireAimed(world, speed, damage, radius, style, spread = 0, homing = 0) {
        const p = world.player;
        const angle = Math.atan2(p.centerY - this.centerY, p.x - this.x) + spread;
        world.spawnProjectile({
            x: this.x + Math.cos(angle) * 40,
            y: this.centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius,
            damage,
            owner: 'enemy',
            color: this.def.colors.accent,
            accent: this.def.colors.glow,
            life: 3,
            style,
            homing,
            spin: 5,
        });
    }
    radialBurst(world, count, speed, damage, style, offset) {
        for (let i = 0; i < count; i++) {
            const a = offset + (i / count) * TAU;
            world.spawnProjectile({
                x: this.x + Math.cos(a) * 30,
                y: this.centerY + Math.sin(a) * 30,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                radius: 11,
                damage,
                owner: 'enemy',
                color: this.def.colors.accent,
                accent: this.def.colors.glow,
                life: 3.2,
                style,
                spin: 4,
            });
        }
        world.particles.ring(this.x, this.centerY, this.def.colors.accent, 110, 0.4, 3);
    }
    beamAt(world, x, delay) {
        world.spawnHazard({
            kind: 'beam',
            x,
            y: world.groundY,
            w: 60,
            h: world.groundY + 10,
            radius: 30,
            duration: 0.7,
            damage: 13,
            tick: 0.26,
            owner: 'enemy',
            color: this.def.colors.accent,
            accent: '#ffffff',
            delay,
        });
    }
    teleport(world) {
        world.particles.burst(this.x, this.centerY, 22, this.def.colors.accent, {
            speed: 260,
            gravity: -40,
            size: 4,
            kind: 'smoke',
        });
        const side = Math.random() < 0.5 ? -1 : 1;
        const nx = clamp(world.player.x - side * 120, world.camera.x + 90, world.camera.x + world.viewW - 90);
        this.x = nx;
        this.faceToward(world.player.x);
        world.particles.burst(this.x, this.centerY, 22, this.def.colors.accent, {
            speed: 260,
            gravity: -40,
            size: 4,
            kind: 'smoke',
        });
        world.audio.sfx('blink');
    }
    summon(world, kind, count) {
        for (let i = 0; i < count; i++) {
            const side = i % 2 === 0 ? -1 : 1;
            const x = clamp(this.x + side * rand(180, 300), world.camera.x + 60, world.camera.x + world.viewW - 60);
            world.spawnEnemy(kind, x);
        }
        world.audio.sfx('roar');
        world.particles.ring(this.x, this.centerY, this.def.colors.accent, 200, 0.6, 4);
    }
    dustTrail(world, color) {
        if (Math.random() < 0.6) {
            world.particles.spawn({
                kind: 'smoke',
                x: this.x - this.facing * 30,
                y: this.y - 10,
                vx: rand(-30, 30),
                vy: rand(-50, -10),
                life: 0.5,
                size: rand(10, 20),
                color,
                gravity: -40,
            });
        }
    }
    // ------------------------------------------------------------ dano / fases
    takeDamage(amount, opts, world) {
        if (this.dead || this.state === 'intro' || this.state === 'phase')
            return 0;
        const dmg = Math.max(1, Math.round(amount * (1 + this.vulnerability)));
        const nextIndex = this.phaseIndex + 1;
        this.hitFlash = 0.16;
        if (opts.status === 'seal' || opts.status === 'stun') {
            this.sealTime = Math.max(this.sealTime, Math.min(0.55, (opts.statusTime ?? 1) * 0.25));
            this.stunTime = this.sealTime;
        }
        if (opts.status === 'burn') {
            this.burnTime = Math.max(this.burnTime, opts.statusTime ?? 3);
            this.burnDps = 8;
        }
        if (opts.status === 'mark')
            this.markTime = Math.max(this.markTime, opts.statusTime ?? 3);
        if (nextIndex < this.def.phases.length) {
            const thresholdHp = this.maxHp * this.def.phases[nextIndex].threshold;
            if (this.hp - dmg <= thresholdHp) {
                this.hp = Math.max(1, thresholdHp + 8);
                this.startPhase(world, nextIndex);
                return dmg;
            }
        }
        this.hp = Math.max(0, this.hp - dmg);
        if (this.hp <= 0)
            this.die(world);
        return dmg;
    }
    startPhase(world, index) {
        this.phaseIndex = index;
        this.state = 'phase';
        this.stateT = 0;
        this.invuln = 999;
        this.attackId = null;
        this.phaseFlash = 1;
        this.vulnerability = 0;
        this.sealTime = 0;
        this.stunTime = 0;
        world.audio.sfx('roar');
        world.audio.sfx('boss');
        world.shake(1.3);
        world.flash(this.def.colors.accent, 0.4);
        world.particles.ring(this.x, this.centerY, this.def.colors.accent, 420, 0.9, 10);
        world.particles.burst(this.x, this.centerY, 46, this.def.colors.accent, {
            speed: 460,
            gravity: 0,
            size: 4,
            color2: this.def.colors.glow,
            life: 0.9,
        });
        world.text(this.phaseName.toUpperCase(), this.x, this.centerY - 130, this.def.colors.accent, 30);
        const p = world.player;
        p.vx = Math.sign(p.x - this.x || 1) * 520;
        p.vy = -320;
        p.invuln = Math.max(p.invuln, 1.1);
        // Reforços na transição (exceto no primeiro chefe).
        if (this.def.id !== 'colossus') {
            this.summon(world, this.def.stage >= 4 ? 'shade' : 'drone', 2);
        }
    }
    alphaDeath(dt, world) {
        this.deathTimer += dt;
        if (Math.random() < 0.5) {
            world.particles.spawn({
                kind: 'ember',
                x: this.x + rand(-this.w, this.w),
                y: this.centerY + rand(-this.h / 2, this.h / 2),
                vx: rand(-90, 90),
                vy: rand(-200, -40),
                life: 0.8,
                size: rand(2, 5),
                color: this.def.colors.accent,
                gravity: 20,
            });
        }
        if (this.def.flying) {
            this.y += dt * 24;
        }
    }
    onDeath(world) {
        world.audio.sfx('explode');
        world.audio.sfx('roar');
        world.shake(1.6);
        world.flash(this.def.colors.glow, 0.5);
        world.particles.ring(this.x, this.centerY, this.def.colors.accent, 500, 1.1, 12);
        world.particles.ring(this.x, this.centerY, '#ffffff', 320, 0.8, 6);
        world.particles.burst(this.x, this.centerY, 70, this.def.colors.accent, {
            speed: 520,
            gravity: 160,
            size: 4.5,
            color2: '#ffffff',
            life: 1.1,
        });
        for (let i = 0; i < 26; i++) {
            world.particles.spawn({
                kind: 'shard',
                x: this.x + rand(-this.w / 2, this.w / 2),
                y: this.centerY + rand(-this.h / 2, this.h / 2),
                vx: rand(-320, 320),
                vy: rand(-420, -80),
                gravity: 700,
                life: rand(0.8, 1.6),
                size: rand(4, 9),
                color: this.def.colors.primary,
                vrot: rand(-12, 12),
            });
        }
        world.text(this.def.defeat, this.x, this.centerY - 120, '#ffffff', 20);
    }
}
//# sourceMappingURL=boss.js.map