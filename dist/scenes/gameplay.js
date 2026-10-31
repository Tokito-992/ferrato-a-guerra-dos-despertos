/** Cena principal: arena lateral, ondas, chefe, pausa, troca de herói e game over. */
import { Camera } from '../core/camera.js';
import { ParticleSystem } from '../core/particles.js';
import { clamp, hexToRgba } from '../core/math.js';
import { rankColor, rankFromPressure, rankValue } from '../core/rank.js';
import { MAX_STAGE } from '../data/stages.js';
import { Player } from '../entities/player.js';
import { Enemy } from '../entities/enemy.js';
import { Boss } from '../entities/boss.js';
import { Hazard, Projectile } from '../entities/projectiles.js';
import { StageObstacle, buildStageObstacles } from '../entities/obstacles.js';
import { drawStageBackground } from '../render/backgrounds.js';
import { drawCharacterPortrait, drawPlayer } from '../render/characters.js';
import { drawBoss, drawEnemy } from '../render/enemies.js';
import { drawHeart } from '../render/hearts.js';
import { visualStyle } from '../render/style.js';
import { FONTS, label, panel, roundRectPath } from '../render/theme.js';
import { drawHud } from '../ui/hud.js';
import { Menu } from '../ui/menu.js';
export class GameplayScene {
    constructor(game, stage, charId) {
        this.game = game;
        this.particles = new ParticleSystem();
        this.time = 0;
        this.enemies = [];
        this.boss = null;
        this.noticeY = 568;
        this.projectiles = [];
        this.hazards = [];
        this.timers = [];
        this.banner = null;
        this.obstacles = [];
        this.phase = 'intro';
        this.introT = 2.4;
        this.waveIndex = 0;
        this.waveActive = false;
        this.waveSpawned = 0;
        this.kills = 0;
        this.maxCombo = 0;
        this.deathTimer = 0;
        this.deathHandled = false;
        this.gameOver = false;
        this.paused = false;
        this.bossCleared = false;
        this.bossWasIntro = true;
        // Sistema competitivo e de vidas extras.
        this.hearts = 0;
        this.maxHearts = 3;
        this.score = 0;
        this.pressure = 0;
        this.damageTaken = 0;
        this.record = 0;
        this.waveStartTime = 0;
        this.waveDamageStart = 0;
        this.waveComboStart = 0;
        this.waveKillStart = 0;
        this.hunterSpawned = false;
        this.hunter = null;
        this.nextAnomalyPressure = 58;
        // Impacto estilo anime: estrela radial + flash curto.
        this.animeImpact = 0;
        this.animeImpactX = 0;
        this.animeImpactY = 0;
        this.animeImpactColor = '#fff4cd';
        // Câmara do Coração.
        this.bonusDuration = 14;
        this.bonusTotal = 3;
        this.bonusTriggered = false;
        this.bonusAt = 0;
        this.bonusTimer = 0;
        this.bonusCollected = 0;
        this.bonusRewardCap = 1;
        this.bonusMotes = [];
        this.bonusHazardTimer = 0;
        this.bonusHazardCount = 0;
        this.stage = stage;
        this.audio = game.audio;
        this.input = game.input;
        this.viewW = game.width;
        this.viewH = game.height;
        this.groundY = stage.floor;
        this.camera = new Camera(game.width, game.height);
        this.camera.setBounds(0, Math.max(0, stage.width - this.viewW));
        this.camera.snapTo(0);
        this.player = new Player(170, charId, stage.floor);
        this.pauseMenu = new Menu([]);
        this.gameOverMenu = new Menu([]);
        this.obstacles = buildStageObstacles(stage);
        this.pressure = clamp(16 + (stage.arc - 1) * 4 + (stage.chapter - 1) * 2, 0, 100);
        this.nextAnomalyPressure = clamp(this.pressure + 20, 58, 92);
        this.bonusAt = stage.width * 0.52;
        this.bonusRewardCap = this.heartRewardCap();
        this.record = this.game.save.bestScore;
        this.setBanner(stage.name, `${stage.subtitle} · ${stage.location}`, stage.palette.accent, 3.6);
    }
    enter() {
        this.game.setTouchControlsVisible(true);
        this.audio.playMusic(this.stage.music);
        this.audio.playAmbience(this.stage.ambient);
    }
    exit() {
        this.game.setTouchControlsVisible(false);
    }
    // ------------------------------------------------------------ World
    get bossActive() {
        return this.boss !== null && !this.boss.dead;
    }
    get locked() {
        return this.phase === 'intro' || this.phase === 'bonus' || this.waveActive || this.boss !== null || this.paused || this.gameOver;
    }
    get enemyProjectiles() {
        return this.projectiles;
    }
    spawnProjectile(def) {
        const p = new Projectile(def);
        this.projectiles.push(p);
        return p;
    }
    spawnHazard(def) {
        this.hazards.push(new Hazard(def));
    }
    spawnEnemy(kind, x, elite = false) {
        const px = clamp(x, this.camera.x + 74, this.camera.x + this.viewW - 74);
        const enemy = new Enemy(this.stage, kind, px, elite);
        this.enemies.push(enemy);
        this.particles.ring(px, this.stage.floor - 6, enemy.def.accent, 42, 0.35, 2);
        for (let i = 0; i < 8; i++) {
            this.particles.spawn({
                kind: 'ember',
                x: px + (Math.random() - 0.5) * 34,
                y: this.stage.floor - Math.random() * 26,
                vx: (Math.random() - 0.5) * 70,
                vy: -70 - Math.random() * 110,
                life: 0.5,
                size: 2.2,
                color: enemy.def.accent,
                gravity: 90,
            });
        }
        return enemy;
    }
    damageEnemy(target, damage, opts = {}) {
        const dealt = target.takeDamage(damage, opts, this);
        if (dealt <= 0)
            return;
        const color = opts.crit ? '#fff4cd' : opts.color ?? this.stage.palette.accent;
        this.particles.text(target.x + (Math.random() - 0.5) * 22, target.centerY - 12, String(dealt), color, opts.crit ? 25 : 16, false, 0.72);
        if (opts.crit) {
            this.particles.ring(target.x, target.centerY, '#ffffff', 46, 0.28, 2);
        }
        if (visualStyle.anime && (opts.crit || damage >= 18)) {
            this.animeImpact = Math.max(this.animeImpact, opts.crit ? 0.2 : 0.12);
            this.animeImpactX = target.x;
            this.animeImpactY = target.centerY;
            this.animeImpactColor = color;
        }
    }
    damagePlayer(damage, opts = {}) {
        if (this.player.dead)
            return 0;
        const dealt = this.player.takeDamage(damage, opts, this);
        if (dealt > 0) {
            this.damageTaken += dealt;
            this.pressure = clamp(this.pressure - 9, 0, 100);
            if (visualStyle.anime) {
                this.animeImpact = Math.max(this.animeImpact, 0.18);
                this.animeImpactX = this.player.x;
                this.animeImpactY = this.player.centerY;
                this.animeImpactColor = '#ff3357';
            }
        }
        return dealt;
    }
    healPlayer(amount) {
        if (this.player.dead || amount <= 0)
            return;
        const healed = this.player.heal(amount);
        if (healed > 0.4) {
            this.text(`+${Math.round(healed)}`, this.player.x, this.player.y - 122, '#8df4a8', 17);
            this.particles.spawn({
                kind: 'glow',
                x: this.player.x,
                y: this.player.centerY,
                vy: -50,
                life: 0.5,
                size: 34,
                color: '#8df4a8',
            });
        }
    }
    shake(amount) {
        this.camera.addShake(amount);
    }
    flash(color, alpha) {
        this.game.flash(color, alpha);
    }
    hitStop(seconds) {
        this.game.hitStop(seconds);
    }
    text(text, x, y, color = '#ffffff', size = 18) {
        this.particles.text(x, y, text, color, size, false, 0.85);
    }
    after(seconds, fn) {
        this.timers.push({ t: seconds, fn });
    }
    addCombo(count = 1) {
        this.maxCombo = Math.max(this.maxCombo, this.player.comboHits + Math.max(0, count - 1));
        this.game.save.bestCombo = Math.max(this.game.save.bestCombo, this.maxCombo);
        this.pressure = clamp(this.pressure + 0.3, 0, 100);
        this.addScore(4);
    }
    enemyKilled(enemy) {
        this.kills++;
        this.game.save.kills++;
        this.pressure = clamp(this.pressure + (enemy.elite ? 5.5 : 2.2), 0, 100);
        this.addScore(enemy.elite ? 380 : 130);
        if (enemy === this.hunter) {
            this.hunter = null;
            this.addScore(1200);
            this.healPlayer(8);
            this.text('CAÇADOR DO VÉU ABATIDO', enemy.x, enemy.centerY - 44, '#ff9bb8', 16);
            this.game.flash('#ff6a9a', 0.12);
            this.audio.sfx('victory');
        }
        else if (enemy.elite) {
            this.healPlayer(5);
            this.text('ELITE ABATIDO', enemy.x, enemy.centerY - 40, '#ffe6a3', 15);
        }
    }
    heavyImpact(x, y, color) {
        this.shake(0.5);
        this.audio.sfx('heavy');
        if (visualStyle.anime) {
            this.animeImpact = Math.max(this.animeImpact, 0.24);
            this.animeImpactX = x;
            this.animeImpactY = y;
            this.animeImpactColor = color;
        }
        this.particles.ring(x, y, color, 120, 0.5, 5);
        this.particles.burst(x, y, 18, color, {
            speed: 320,
            angle: -Math.PI / 2,
            spread: Math.PI,
            gravity: 650,
            size: 3,
            kind: 'magma',
        });
        this.spawnHazard({
            kind: 'shock',
            x,
            y,
            radius: 140,
            duration: 0.5,
            damage: 0,
            owner: 'player',
            color,
        });
    }
    sealEnemies(radius, duration) {
        const px = this.player.x;
        const py = this.player.centerY;
        for (const enemy of this.enemies) {
            if (enemy.dead)
                continue;
            if (Math.hypot(enemy.x - px, enemy.centerY - py) > radius)
                continue;
            enemy.sealTime = Math.max(enemy.sealTime, duration);
            enemy.stunTime = Math.max(enemy.stunTime, duration);
            enemy.markTime = Math.max(enemy.markTime, duration);
            enemy.vulnerability = 0.35;
            this.particles.rune(enemy.x, enemy.centerY, '#fff4cd', 42);
            this.particles.ring(enemy.x, enemy.centerY, '#fff4cd', 54, 0.4, 2);
            this.text('SELADO', enemy.x, enemy.centerY - 32, '#fff4cd', 14);
        }
        if (this.boss && !this.boss.dead) {
            if (Math.hypot(this.boss.x - px, this.boss.centerY - py) <= radius + this.boss.w * 0.35) {
                this.boss.sealTime = Math.max(this.boss.sealTime, Math.min(1.4, duration));
                this.boss.markTime = Math.max(this.boss.markTime, duration);
                this.boss.vulnerability = 0.35;
                this.particles.rune(this.boss.x, this.boss.centerY, '#fff4cd', 70);
                this.text('SELADO', this.boss.x, this.boss.centerY - 70, '#fff4cd', 20);
            }
        }
    }
    clearEnemyProjectiles(x, y, radius) {
        for (const p of this.projectiles) {
            if (p.dead || p.owner !== 'enemy')
                continue;
            if (Math.hypot(p.x - x, p.y - y) > radius)
                continue;
            p.dead = true;
            this.particles.ring(p.x, p.y, '#fff4cd', 28, 0.25, 2);
        }
    }
    // ------------------------------------------------------------ ciclo
    update(dt) {
        if (this.gameOver) {
            this.updateGameOverMenu();
            return;
        }
        if (this.paused) {
            this.updatePauseMenu();
            return;
        }
        if (this.input.pressed('pause') || this.input.pressed('back')) {
            this.openPause();
            return;
        }
        this.time += dt;
        if (this.animeImpact > 0)
            this.animeImpact = Math.max(0, this.animeImpact - dt);
        this.updateBanner(dt);
        this.updateTimers(dt);
        this.particles.update(dt);
        if (this.phase === 'intro') {
            this.introT -= dt;
            if (this.introT <= 0) {
                this.phase = 'combat';
                this.audio.sfx('wave');
            }
        }
        this.player.update(dt, this);
        if (this.player.dead && !this.deathHandled) {
            if (this.hearts > 0 && !this.gameOver) {
                this.revivePlayer();
            }
            else {
                this.deathHandled = true;
                this.deathTimer = 0;
                this.game.recordDeath();
                this.audio.sfx('gameover');
                this.game.slowMo(0.45, 1.1);
            }
        }
        if (this.player.dead)
            this.deathTimer += dt;
        for (const enemy of this.enemies)
            enemy.update(dt, this);
        if (this.boss) {
            this.boss.update(dt, this);
            this.boss.applyStatuses(dt, this);
        }
        for (const p of this.projectiles)
            p.update(dt, this);
        for (const h of this.hazards)
            h.update(dt, this);
        for (const obstacle of this.obstacles)
            obstacle.update(dt, this);
        this.projectiles = this.projectiles.filter((p) => !p.dead);
        this.hazards = this.hazards.filter((h) => !h.dead);
        this.obstacles = this.obstacles.filter((o) => !o.expired);
        this.enemies = this.enemies.filter((e) => !e.dead || e.deathTimer < 1.25);
        this.updateCamera(dt);
        this.updateFlow(dt);
        if (this.player.dead && this.deathTimer > 1.75 && !this.gameOver) {
            this.openGameOver();
        }
    }
    updateCamera(dt) {
        if (this.locked) {
            this.camera.update(dt, this.camera.x);
            return;
        }
        const maxCam = Math.max(0, this.stage.width - this.viewW);
        const target = clamp(this.player.x - this.viewW * 0.42, 0, maxCam);
        this.camera.update(dt, target);
    }
    updateFlow(dt) {
        if (this.phase === 'bonus') {
            if (!this.player.dead)
                this.updateBonus(dt);
            return;
        }
        if (this.player.dead || this.phase !== 'combat')
            return;
        this.updatePressureEvents();
        // Fim de onda.
        if (this.waveActive) {
            const alive = this.enemies.some((e) => !e.dead);
            if (!alive)
                this.finishWave();
            return;
        }
        // Câmara do Coração: bônus opcional entre a segunda e a terceira onda.
        if (!this.bonusTriggered &&
            this.waveIndex >= 2 &&
            this.waveIndex < this.stage.waves.length &&
            this.player.x >= this.bonusAt) {
            this.startBonus();
            return;
        }
        // Próxima onda por proximidade.
        if (this.waveIndex < this.stage.waves.length) {
            const wave = this.stage.waves[this.waveIndex];
            if (this.player.x >= wave.at - 20)
                this.startWave(wave);
            return;
        }
        // Capítulos 1–5 terminam com um elite, sem chefe de planeta.
        if (!this.stage.boss) {
            this.completeChapter();
            return;
        }
        // Arena do chefe.
        if (!this.boss) {
            const trigger = Math.max(this.stage.waves[this.stage.waves.length - 1].at + 160, this.stage.width - 760);
            if (this.player.x >= trigger)
                this.spawnBoss();
            return;
        }
        if (this.boss.isIntro === false && this.bossWasIntro) {
            this.bossWasIntro = false;
            this.setBanner('CHEFE DO PLANO', this.boss.def.title, this.boss.def.colors.accent, 2.4);
        }
        if (this.boss.dead && !this.bossCleared) {
            this.bossCleared = true;
            this.phase = 'cleared';
            this.addScore(5000);
            this.pressure = 100;
            const finale = this.stage.id === MAX_STAGE;
            this.setBanner(finale ? 'VÉU ROMPIDO' : 'ARCO CONCLUÍDO', this.boss.def.defeat, finale ? '#ffffff' : this.stage.palette.accent, 5);
            this.game.slowMo(0.32, 2.6);
            this.game.flash(this.boss.def.colors.glow, 0.3);
            this.audio.sfx('victory');
            this.persistRecord();
            this.after(2.7, () => this.game.finishStage(this.stage.id, this.player.charId));
        }
    }
    completeChapter() {
        if (this.phase === 'cleared')
            return;
        this.phase = 'cleared';
        this.waveActive = false;
        this.addScore(1500);
        this.setBanner('CAPÍTULO CONCLUÍDO', `${this.stage.subtitle.toUpperCase()} · RANK ${this.rank} · ${this.score} PTS`, '#8df4a8', 3.2);
        this.particles.ring(this.player.x, this.stage.floor - 30, this.stage.palette.accent, 180, 0.7, 6);
        this.game.flash(this.stage.palette.accent, 0.16);
        this.audio.sfx('victory');
        this.persistRecord();
        this.after(2.4, () => this.game.finishStage(this.stage.id, this.player.charId));
    }
    startWave(wave) {
        this.waveActive = true;
        this.waveSpawned = 0;
        this.waveStartTime = this.time;
        this.waveDamageStart = this.damageTaken;
        this.waveComboStart = this.maxCombo;
        this.waveKillStart = this.kills;
        const maxCam = Math.max(0, this.stage.width - this.viewW);
        const lock = clamp(this.player.x - this.viewW * 0.44, 0, maxCam);
        this.camera.setBounds(lock, lock);
        this.camera.snapTo(lock);
        let index = 0;
        for (const group of wave.spawns) {
            for (let i = 0; i < group.count; i++) {
                const side = index % 2 === 0 ? 1 : -1;
                const distance = 215 + Math.floor(index / 2) * 118 + Math.random() * 28;
                const x = clamp(this.player.x + side * distance, this.camera.x + 92, this.camera.x + this.viewW - 92);
                this.spawnEnemy(group.kind, x, group.elite);
                this.waveSpawned++;
                index++;
            }
        }
        this.setBanner(wave.label, `ONDA ${this.waveIndex + 1} / ${this.stage.waves.length} · ${this.waveSpawned} HOSTIS`, this.stage.palette.accent, 2.8);
        this.audio.sfx('wave');
        this.game.flash(this.stage.palette.accent, 0.07);
    }
    finishWave() {
        const clearTime = Math.max(0, this.time - this.waveStartTime);
        const damage = Math.max(0, this.damageTaken - this.waveDamageStart);
        const combo = Math.max(0, this.maxCombo - this.waveComboStart);
        const kills = Math.max(0, this.kills - this.waveKillStart);
        const performance = clamp(this.pressure + combo * 1.2 + kills * 2 - damage * 1.8 - Math.max(0, clearTime - 18) * 1.2, 0, 100);
        const waveRank = rankFromPressure(performance);
        this.addScore(350 + Math.round(this.pressure * 4) + combo * 20 + kills * 30);
        this.pressure = clamp(this.pressure + 5, 0, 100);
        this.waveActive = false;
        this.waveIndex++;
        this.camera.setBounds(0, Math.max(0, this.stage.width - this.viewW));
        // Cura menor: as vidas extras vêm da Câmara do Coração, não de ondas fáceis.
        this.healPlayer(this.player.maxHp * 0.07 + 2);
        this.persistRecord();
        if (this.waveIndex >= this.stage.waves.length) {
            if (this.stage.boss) {
                this.setBanner('CAMINHO LIVRE', `RANK ${waveRank} · O CHEFE AGUARDA NO FIM DO PLANO`, rankColor(waveRank), 3.4);
            }
            else {
                this.completeChapter();
                return;
            }
        }
        else {
            this.setBanner(`ONDA LIMPA · RANK ${waveRank}`, `${kills} ABATES · ${combo} COMBO · AVANCE PARA O PRÓXIMO SELO`, rankColor(waveRank), 2.8);
        }
        this.audio.sfx('confirm');
    }
    spawnBoss() {
        const bossId = this.stage.boss;
        if (!bossId)
            return;
        const maxCam = Math.max(0, this.stage.width - this.viewW);
        this.camera.setBounds(maxCam, maxCam);
        this.camera.snapTo(maxCam);
        const bossX = maxCam + this.viewW - 335;
        this.boss = new Boss(bossId, bossX, this.stage.floor);
        // Chefes ficam mais resistentes a cada arco, sem depender apenas de dano.
        const hpScale = 0.95 + (this.stage.arc - 1) * 0.07;
        this.boss.maxHp = Math.round(this.boss.maxHp * hpScale);
        this.boss.hp = this.boss.maxHp;
        this.bossWasIntro = true;
        this.bossCleared = false;
        this.game.save.bestCombo = Math.max(this.game.save.bestCombo, this.maxCombo, this.player.bestCombo);
        this.game.persist();
        this.setBanner(this.boss.def.name, this.boss.def.title, this.boss.def.colors.accent, 4.4);
        this.audio.playBossMusic(this.stage.arc);
        this.audio.sfx('boss');
        this.audio.sfx('roar');
        this.game.flash(this.boss.def.colors.accent, 0.28);
        this.shake(0.7);
        this.particles.ring(this.boss.x, this.boss.centerY, this.boss.def.colors.accent, 280, 0.8, 8);
    }
    // ------------------------------------------------------------ sistemas competitivos
    get rank() {
        return rankFromPressure(this.pressure);
    }
    addScore(amount) {
        if (amount <= 0)
            return;
        this.score += Math.round(amount * (1 + this.pressure / 140));
    }
    persistRecord() {
        const save = this.game.save;
        save.bestCombo = Math.max(save.bestCombo, this.maxCombo, this.player.bestCombo);
        save.bestScore = Math.max(save.bestScore, this.score);
        if (rankValue(this.rank) > rankValue(save.bestRank))
            save.bestRank = this.rank;
        this.game.persist();
    }
    heartRewardCap() {
        return Math.max(1, 4 - Math.ceil(this.stage.id / 12));
    }
    revivePlayer() {
        this.hearts = Math.max(0, this.hearts - 1);
        const p = this.player;
        p.dead = false;
        p.hp = Math.max(1, Math.round(p.maxHp * 0.35));
        p.invuln = 2.2;
        p.hitstun = 0;
        p.stunTime = 0;
        p.sealTime = 0;
        p.burnTime = 0;
        p.hitFlash = 0;
        p.vx = 0;
        p.vy = 0;
        p.y = this.stage.floor;
        p.onGround = true;
        p.dashTime = 0;
        p.attack = null;
        p.comboHits = 0;
        p.state = 'idle';
        this.deathHandled = false;
        this.deathTimer = 0;
        this.pressure = clamp(this.pressure - 6, 0, 100);
        // O coração limpa o entorno para a segunda chance ser justa.
        this.hazards = this.hazards.filter((h) => h.owner !== 'enemy');
        this.projectiles = this.projectiles.filter((pr) => pr.owner !== 'enemy');
        for (const enemy of this.enemies) {
            if (enemy.dead)
                continue;
            if (Math.abs(enemy.x - p.x) > 220)
                continue;
            enemy.vx = Math.sign(enemy.x - p.x || 1) * 340;
            enemy.stunTime = Math.max(enemy.stunTime, 0.45);
        }
        this.setBanner('CORAÇÃO CONSUMIDO', `${this.hearts} RESTANTE(S) · 35% DE VIDA · INVULNERÁVEL`, '#ff6a9a', 3.2);
        this.text('VIDA EXTRA', p.x, p.centerY - 70, '#ff9bb8', 22);
        this.particles.ring(p.x, p.centerY, '#ff6a9a', 170, 0.7, 5);
        this.game.flash('#ff6a9a', 0.22);
        this.game.slowMo(0.45, 0.45);
        this.audio.sfx('heal');
    }
    updatePressureEvents() {
        if (this.waveActive && !this.hunterSpawned && rankValue(this.rank) >= rankValue('S')) {
            this.spawnHunter();
        }
        if ((this.waveActive || this.boss !== null) &&
            this.pressure >= this.nextAnomalyPressure &&
            this.obstacles.filter((o) => o.temporary).length < 2) {
            this.spawnAnomaly();
            this.nextAnomalyPressure = clamp(this.nextAnomalyPressure + 16, 58, 100);
        }
    }
    spawnHunter() {
        const kinds = ['hound', 'brute', 'seraph', 'shade', 'construct', 'echo'];
        const kind = kinds[clamp(this.stage.arc - 1, 0, kinds.length - 1)];
        const side = this.player.x < this.camera.x + this.viewW / 2 ? 1 : -1;
        const x = clamp(this.player.x + side * 420, this.camera.x + 92, this.camera.x + this.viewW - 92);
        this.hunter = this.spawnEnemy(kind, x, true);
        this.hunterSpawned = true;
        this.pressure = clamp(this.pressure + 4, 0, 100);
        this.setBanner('CAÇADOR DO VÉU', 'SUA PERFORMANCE ATRAIU UMA AMEAÇA ANTIGA', '#ff6a9a', 3.2);
        this.audio.sfx('roar');
        this.game.flash('#ff6a9a', 0.14);
        this.shake(0.45);
    }
    spawnAnomaly() {
        const side = Math.random() < 0.5 ? -1 : 1;
        const x = clamp(this.player.x + side * (240 + Math.random() * 150), this.camera.x + 120, this.camera.x + this.viewW - 120);
        this.obstacles.push(new StageObstacle('fracture', x, this.stage.floor, this.stage, { temporary: true, life: 8 }));
        this.text('ANOMALIA', x, this.stage.floor - 132, '#ff5a3c', 15);
        this.game.flash('#ff5a3c', 0.06);
    }
    startBonus() {
        if (this.bonusTriggered)
            return;
        this.bonusTriggered = true;
        this.phase = 'bonus';
        this.waveActive = false;
        this.bonusTimer = this.bonusDuration;
        this.bonusCollected = 0;
        this.bonusHazardTimer = 1.4;
        this.bonusHazardCount = 0;
        this.bonusMotes = [];
        this.hazards = this.hazards.filter((h) => h.owner !== 'enemy');
        this.projectiles = this.projectiles.filter((p) => p.owner !== 'enemy');
        const maxCam = Math.max(0, this.stage.width - this.viewW);
        const lock = clamp(this.player.x - this.viewW * 0.45, 0, maxCam);
        this.camera.setBounds(lock, lock);
        this.camera.snapTo(lock);
        for (let i = 0; i < this.bonusTotal; i++) {
            const x = clamp(this.camera.x + 190 + (this.viewW - 380) * (i / Math.max(1, this.bonusTotal - 1)), this.camera.x + 120, this.camera.x + this.viewW - 120);
            // A fileira alta precisa ser alcançável até pelos heróis com um único pulo.
            const y = this.stage.floor - 120 - (i % 2) * 55;
            this.bonusMotes.push({ x, y, baseY: y, phase: Math.random() * Math.PI * 2 });
        }
        this.setBanner('CÂMARA DO CORAÇÃO', `COLETE ${this.bonusTotal} CORAÇÕES · RECOMPENSA MÁX. ${this.bonusRewardCap}`, '#ff6a9a', 3.8);
        this.audio.sfx('confirm');
        this.game.flash('#ff6a9a', 0.14);
    }
    updateBonus(dt) {
        this.bonusTimer -= dt;
        this.bonusHazardTimer -= dt;
        if (this.bonusHazardTimer <= 0 && this.bonusTimer > 1.5 && this.bonusHazardCount < 7) {
            this.spawnBonusHazard();
            this.bonusHazardTimer = Math.max(0.8, 1.75 - this.stage.arc * 0.08);
        }
        for (const mote of this.bonusMotes) {
            mote.phase += dt;
            mote.y = mote.baseY + Math.sin(mote.phase * 2.2) * 7;
        }
        const p = this.player;
        for (let i = this.bonusMotes.length - 1; i >= 0; i--) {
            const mote = this.bonusMotes[i];
            if (Math.hypot(p.x - mote.x, p.centerY - mote.y) > 58)
                continue;
            this.bonusMotes.splice(i, 1);
            this.bonusCollected++;
            this.addScore(220);
            this.pressure = clamp(this.pressure + 2.5, 0, 100);
            this.particles.ring(mote.x, mote.y, '#ff6a9a', 64, 0.45, 3);
            this.particles.burst(mote.x, mote.y, 14, '#ff9bb8', {
                speed: 150,
                gravity: -40,
                kind: 'star',
                size: 3,
                life: 0.55,
            });
            this.text('+1 CORAÇÃO', mote.x, mote.y - 30, '#ff9bb8', 16);
            this.audio.sfx('heal');
            this.game.flash('#ff6a9a', 0.06);
        }
        if (this.bonusMotes.length === 0 || this.bonusTimer <= 0)
            this.finishBonus();
    }
    spawnBonusHazard() {
        const p = this.player;
        const side = Math.random() < 0.5 ? -1 : 1;
        const x = clamp(p.x + side * (90 + Math.random() * 240), this.camera.x + 90, this.camera.x + this.viewW - 90);
        this.spawnHazard({
            kind: 'explosion',
            x,
            y: this.stage.floor,
            radius: 86,
            duration: 0.1,
            damage: 8 + this.stage.arc * 2,
            owner: 'enemy',
            color: '#ff6a9a',
            accent: '#ffffff',
            delay: 0.95,
        });
        this.bonusHazardCount++;
    }
    finishBonus() {
        if (this.phase !== 'bonus')
            return;
        const reward = Math.min(this.bonusRewardCap, this.bonusCollected);
        const before = this.hearts;
        this.hearts = Math.min(this.maxHearts, this.hearts + reward);
        const gained = this.hearts - before;
        this.addScore(300 + this.bonusCollected * 180);
        this.pressure = clamp(this.pressure + 4, 0, 100);
        this.phase = 'combat';
        this.bonusMotes = [];
        this.bonusTimer = 0;
        this.hazards = this.hazards.filter((h) => h.owner !== 'enemy');
        this.player.invuln = Math.max(this.player.invuln, 0.8);
        this.camera.setBounds(0, Math.max(0, this.stage.width - this.viewW));
        this.persistRecord();
        if (gained > 0) {
            this.setBanner('CORAÇÃO CONQUISTADO', `${gained} VIDA(S) EXTRA(S) · ${this.bonusCollected}/${this.bonusTotal} COLETADOS`, '#ff6a9a', 3.4);
            this.particles.ring(this.player.x, this.player.centerY, '#ff6a9a', 190, 0.7, 6);
            this.game.flash('#ff6a9a', 0.18);
            this.audio.sfx('heal');
        }
        else if (reward > 0) {
            this.setBanner('CORAÇÕES CHEIOS', 'A CÂMARA NÃO PÔDE AUMENTAR SUAS VIDAS', '#ff9bb8', 3.2);
            this.audio.sfx('ui');
        }
        else {
            this.setBanner('CÂMARA VAZIA', 'NENHUM CORAÇÃO COLETADO', '#9aa3b8', 3.2);
            this.audio.sfx('ui');
        }
    }
    // ------------------------------------------------------------ menus
    openPause() {
        if (this.player.dead)
            return;
        this.paused = true;
        // Os botões virtuais não devem ativar itens do menu de pausa.
        this.game.setTouchControlsVisible(false);
        this.pauseMenu.setItems([
            { id: 'resume', label: 'CONTINUAR', detail: 'ESC', accent: this.player.def.colors.accent },
            { id: 'swap', label: 'MAPA DA CAMPANHA', detail: 'ARCOS & CAPÍTULOS', accent: '#56e3ff' },
            { id: 'restart', label: 'REINICIAR CAPÍTULO', detail: `CAP. ${this.stage.chapter}`, accent: '#ffd166' },
            { id: 'title', label: 'SAIR PARA O MENU', detail: 'PROGRESSO SALVO', accent: '#ff6a7a' },
        ], true);
        this.audio.sfx('ui');
    }
    updatePauseMenu() {
        if (this.input.pressed('pause') || this.input.pressed('back')) {
            this.paused = false;
            this.game.setTouchControlsVisible(true);
            this.audio.sfx('ui');
            return;
        }
        const action = this.pauseMenu.update(this.input, this.audio);
        if (!action)
            return;
        switch (action) {
            case 'resume':
                this.paused = false;
                this.game.setTouchControlsVisible(true);
                break;
            case 'swap':
                this.game.gotoCharacterSelect(this.stage.id, this.player.charId);
                break;
            case 'restart':
                this.game.transitionTo(() => this.game.showGameplay(this.stage.id, this.player.charId));
                break;
            case 'title':
                this.game.gotoTitle();
                break;
        }
    }
    openGameOver() {
        this.gameOver = true;
        this.game.setTouchControlsVisible(false);
        this.persistRecord();
        this.gameOverMenu.setItems([
            { id: 'retry', label: 'TENTAR NOVAMENTE', detail: `CAP. ${this.stage.chapter}`, accent: this.player.def.colors.accent },
            { id: 'swap', label: 'MAPA DA CAMPANHA', detail: 'ARCOS & CAPÍTULOS', accent: '#56e3ff' },
            { id: 'title', label: 'MENU PRINCIPAL', detail: 'ARQUIVO SALVO', accent: '#ffe6a3' },
        ], false);
        this.audio.sfx('gameover');
    }
    updateGameOverMenu() {
        if (this.input.pressed('back')) {
            this.game.gotoTitle();
            return;
        }
        const action = this.gameOverMenu.update(this.input, this.audio);
        if (!action)
            return;
        switch (action) {
            case 'retry':
                this.game.transitionTo(() => this.game.showGameplay(this.stage.id, this.player.charId));
                break;
            case 'swap':
                this.game.gotoCharacterSelect(this.stage.id, this.player.charId);
                break;
            case 'title':
                this.game.gotoTitle();
                break;
        }
    }
    // ------------------------------------------------------------ auxiliares
    setBanner(text, sub, color, max) {
        this.banner = { text, sub, color, t: 0, max };
    }
    updateBanner(dt) {
        if (!this.banner)
            return;
        this.banner.t += dt;
        if (this.banner.t >= this.banner.max)
            this.banner = null;
    }
    updateTimers(dt) {
        if (!this.timers.length)
            return;
        const ready = [];
        for (const timer of this.timers) {
            timer.t -= dt;
            if (timer.t <= 0)
                ready.push(timer);
        }
        if (!ready.length)
            return;
        this.timers = this.timers.filter((t) => !ready.includes(t));
        for (const timer of ready)
            timer.fn();
    }
    get waveLabel() {
        if (this.boss)
            return this.boss.def.name;
        if (this.waveIndex >= this.stage.waves.length) {
            return this.stage.boss ? 'RUMO AO CHEFE' : 'CAPÍTULO CONCLUÍDO';
        }
        return this.stage.waves[this.waveIndex]?.label ?? 'COMBATE';
    }
    // ------------------------------------------------------------ desenho
    draw(ctx) {
        const camX = this.camera.x + this.camera.offsetX;
        drawStageBackground(ctx, this.stage, camX, this.time);
        ctx.save();
        ctx.translate(-this.camera.x + this.camera.offsetX, this.camera.offsetY);
        for (const h of this.hazards)
            h.draw(ctx);
        for (const obstacle of this.obstacles)
            obstacle.draw(ctx, this.time, this.camera.x, this.viewW);
        const actors = [...this.enemies];
        if (this.boss)
            actors.push(this.boss);
        actors.push(this.player);
        actors.sort((a, b) => a.y - b.y);
        for (const actor of actors) {
            if (actor instanceof Boss)
                drawBoss(ctx, actor, this.time);
            else if (actor instanceof Enemy)
                drawEnemy(ctx, actor, this.time);
            else if (actor instanceof Player)
                drawPlayer(ctx, actor, this.time);
        }
        for (const p of this.projectiles)
            p.draw(ctx);
        for (const mote of this.bonusMotes) {
            const pulse = 0.85 + Math.sin(mote.phase * 2.2) * 0.15;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = '#ff6a9a';
            ctx.beginPath();
            ctx.arc(mote.x, mote.y, 30 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            drawHeart(ctx, mote.x, mote.y, 28 * pulse, '#ff6a9a', {
                glow: 20,
                outline: '#ffd0de',
            });
        }
        this.particles.draw(ctx);
        ctx.restore();
        if (visualStyle.anime)
            this.drawAnimeScreen(ctx, camX);
        if (this.phase === 'bonus') {
            ctx.save();
            const vignette = ctx.createRadialGradient(this.viewW / 2, this.viewH / 2, 120, this.viewW / 2, this.viewH / 2, this.viewW * 0.7);
            vignette.addColorStop(0, 'rgba(255,106,154,0.02)');
            vignette.addColorStop(1, 'rgba(255,50,110,0.2)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, this.viewW, this.viewH);
            ctx.restore();
        }
        this.drawArenaFrame(ctx);
        drawHud(ctx, {
            player: this.player,
            stage: this.stage,
            waveIndex: this.waveIndex,
            waveCount: this.stage.waves.length,
            waveLabel: this.phase === 'bonus' ? 'CÂMARA DO CORAÇÃO' : this.waveLabel,
            boss: this.boss,
            kills: this.kills,
            time: this.time,
            banner: this.banner,
            showHints: this.time < 20,
            hearts: this.hearts,
            maxHearts: this.maxHearts,
            score: this.score,
            rank: this.rank,
            pressure: this.pressure / 100,
            bestScore: this.game.save.bestScore,
            bonus: this.phase === 'bonus'
                ? {
                    time: Math.max(0, this.bonusTimer),
                    maxTime: this.bonusDuration,
                    collected: this.bonusCollected,
                    total: this.bonusTotal,
                    rewardCap: this.bonusRewardCap,
                }
                : null,
            touch: this.game.isTouchDevice,
        }, this.time);
        if (this.paused)
            this.drawPause(ctx);
        if (this.gameOver)
            this.drawGameOver(ctx);
    }
    /** Camada de pós-processamento do modo anime: linhas de velocidade, impacto e cor. */
    drawAnimeScreen(ctx, camX) {
        const w = this.viewW;
        const h = this.viewH;
        const speed = Math.abs(this.player.vx);
        const dashing = this.player.dashTime > 0;
        if (dashing || speed > 260) {
            const power = dashing ? 1 : clamp((speed - 260) / 180, 0, 1);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = hexToRgba('#ffffff', 0.08 + power * 0.08);
            ctx.lineWidth = 1.2;
            const cx = w / 2;
            const cy = h * 0.48;
            for (let i = 0; i < 24; i++) {
                const a = (i / 24) * Math.PI * 2 + Math.sin(this.time * 2 + i) * 0.02;
                const r0 = 240 + (i % 4) * 40;
                const r1 = r0 + 80 + power * 160;
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.55);
                ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.55);
                ctx.stroke();
            }
            ctx.restore();
        }
        if (this.animeImpact > 0) {
            const t = clamp(this.animeImpact / 0.24, 0, 1);
            const sx = this.animeImpactX - camX;
            const sy = this.animeImpactY + this.camera.offsetY;
            const color = this.animeImpactColor;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = t;
            for (let i = 0; i < 16; i++) {
                const a = (i / 16) * Math.PI * 2 + this.time * 1.5;
                const r0 = 10 + (1 - t) * 20;
                const r1 = 70 + (i % 3) * 28 + (1 - t) * 60;
                ctx.strokeStyle = i % 2 === 0 ? '#ffffff' : color;
                ctx.lineWidth = i % 3 === 0 ? 3 : 1.5;
                ctx.beginPath();
                ctx.moveTo(sx + Math.cos(a) * r0, sy + Math.sin(a) * r0 * 0.7);
                ctx.lineTo(sx + Math.cos(a) * r1, sy + Math.sin(a) * r1 * 0.7);
                ctx.stroke();
            }
            const burst = ctx.createRadialGradient(sx, sy, 0, sx, sy, 90);
            burst.addColorStop(0, hexToRgba('#ffffff', 0.5 * t));
            burst.addColorStop(0.35, hexToRgba(color, 0.3 * t));
            burst.addColorStop(1, hexToRgba(color, 0));
            ctx.fillStyle = burst;
            ctx.beginPath();
            ctx.arc(sx, sy, 90, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            ctx.save();
            ctx.globalAlpha = 0.08 * t;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }
        ctx.save();
        const grade = ctx.createLinearGradient(0, 0, w, h);
        grade.addColorStop(0, 'rgba(86, 227, 255, 0.035)');
        grade.addColorStop(0.5, 'rgba(255, 106, 213, 0.025)');
        grade.addColorStop(1, 'rgba(255, 138, 61, 0.04)');
        ctx.fillStyle = grade;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }
    drawArenaFrame(ctx) {
        const locked = this.waveActive || this.boss !== null || this.phase === 'bonus';
        if (!locked)
            return;
        const color = this.phase === 'bonus' ? '#ff6a9a' : this.boss ? this.boss.def.colors.accent : this.stage.palette.accent;
        ctx.save();
        const left = ctx.createLinearGradient(0, 0, 110, 0);
        left.addColorStop(0, hexToRgba(color, 0.22));
        left.addColorStop(1, hexToRgba(color, 0));
        ctx.fillStyle = left;
        ctx.fillRect(0, 0, 110, this.viewH);
        const right = ctx.createLinearGradient(this.viewW, 0, this.viewW - 110, 0);
        right.addColorStop(0, hexToRgba(color, 0.22));
        right.addColorStop(1, hexToRgba(color, 0));
        ctx.fillStyle = right;
        ctx.fillRect(this.viewW - 110, 0, 110, this.viewH);
        ctx.restore();
    }
    drawPause(ctx) {
        const p = this.player;
        const accent = p.def.colors.accent;
        ctx.save();
        ctx.fillStyle = 'rgba(2,3,8,0.74)';
        ctx.fillRect(0, 0, this.viewW, this.viewH);
        const x = 338;
        const y = 96;
        const w = 604;
        const h = 528;
        panel(ctx, x, y, w, h, {
            fill: 'rgba(5,8,16,0.94)',
            border: hexToRgba(accent, 0.38),
            glow: hexToRgba(accent, 0.2),
            cut: 20,
        });
        ctx.fillStyle = accent;
        ctx.fillRect(x, y, 3, h);
        label(ctx, 'PAUSA', x + 32, y + 50, 34, '#f4f7ff', {
            weight: 800,
            spacing: 7,
            glow: hexToRgba(accent, 0.5),
        });
        label(ctx, `${this.stage.subtitle.toUpperCase()} · ${this.stage.name.toUpperCase()}`, x + 34, y + 70, 10, hexToRgba(accent, 0.85), {
            font: FONTS.mono,
            spacing: 1.3,
        });
        // Retrato e ficha do Desperto.
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + 84, y + 134, 44, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fill();
        ctx.strokeStyle = hexToRgba(accent, 0.5);
        ctx.stroke();
        ctx.clip();
        drawCharacterPortrait(ctx, p.def, x + 84, y + 134, 104, this.time);
        ctx.restore();
        label(ctx, p.def.name.toUpperCase(), x + 142, y + 120, 20, '#f2f5ff', { weight: 800, spacing: 1.6 });
        label(ctx, `${p.def.combat.toUpperCase()} · ${p.def.ability.name.toUpperCase()}`, x + 142, y + 138, 9.5, hexToRgba(accent, 0.8), {
            font: FONTS.mono,
            spacing: 0.8,
        });
        label(ctx, `VIDA ${Math.ceil(p.hp)} / ${p.maxHp}   ·   ABATES ${this.kills}`, x + 142, y + 157, 10.5, 'rgba(200,208,228,0.7)', {
            font: FONTS.mono,
            spacing: 0.8,
        });
        label(ctx, `CORAÇÕES ${this.hearts}/${this.maxHearts}   ·   RANK ${this.rank}   ·   PONTOS ${this.score}`, x + 142, y + 174, 10.5, '#ff9bb8', {
            font: FONTS.mono,
            spacing: 0.8,
        });
        this.pauseMenu.draw(ctx, x + 32, y + 192, w - 64, {
            itemHeight: 44,
            gap: 7,
            size: 17,
            accent,
        });
        // Controles.
        const cy = y + 424;
        ctx.strokeStyle = hexToRgba(accent, 0.2);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 32, cy - 16);
        ctx.lineTo(x + w - 32, cy - 16);
        ctx.stroke();
        label(ctx, 'CONTROLES', x + 32, cy, 9.5, 'rgba(190,198,220,0.5)', { font: FONTS.mono, spacing: 1.4 });
        const controls = this.game.isTouchDevice
            ? [
                ['◀ ▶', 'MOVER'],
                ['⤒', 'PULAR'],
                ['J', 'LEVE'],
                ['K', 'PESADO'],
                ['L', 'DASH'],
                ['E', 'HABILIDADE'],
            ]
            : [
                ['A / D', 'MOVER'],
                ['ESPAÇO', 'PULAR'],
                ['J', 'LEVE'],
                ['K', 'PESADO / CONTRA'],
                ['L', 'DASH'],
                ['E', 'HABILIDADE'],
            ];
        controls.forEach(([key, action], i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const cx = x + 32 + col * 180;
            const cyy = cy + 26 + row * 30;
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            roundRectPath(ctx, cx, cyy - 15, 62, 21, 3);
            ctx.fill();
            ctx.strokeStyle = hexToRgba(accent, 0.35);
            ctx.stroke();
            ctx.restore();
            label(ctx, key, cx + 31, cyy, 9, '#ffffff', { align: 'center', font: FONTS.mono, weight: 700 });
            label(ctx, action, cx + 72, cyy, 10, 'rgba(200,208,228,0.65)', { font: FONTS.mono, spacing: 0.8 });
        });
        label(ctx, this.game.isTouchDevice ? 'II FECHAR' : 'ESC / BACKSPACE FECHAR · M ÁUDIO', x + w - 32, y + h - 18, 9, 'rgba(170,178,200,0.42)', {
            align: 'right',
            font: FONTS.mono,
            spacing: 1,
        });
        ctx.restore();
    }
    drawGameOver(ctx) {
        const accent = '#ff3357';
        ctx.save();
        ctx.fillStyle = 'rgba(4,2,6,0.82)';
        ctx.fillRect(0, 0, this.viewW, this.viewH);
        const g = ctx.createRadialGradient(this.viewW / 2, 300, 20, this.viewW / 2, 300, 620);
        g.addColorStop(0, 'rgba(255,51,87,0.18)');
        g.addColorStop(1, 'rgba(255,51,87,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, this.viewW, this.viewH);
        const w = 620;
        const h = 452;
        const x = this.viewW / 2 - w / 2;
        const y = 116;
        panel(ctx, x, y, w, h, {
            fill: 'rgba(8,3,8,0.95)',
            border: hexToRgba(accent, 0.45),
            glow: hexToRgba(accent, 0.28),
            cut: 22,
        });
        ctx.fillStyle = accent;
        ctx.fillRect(x, y, 3, h);
        label(ctx, 'O VÉU O DEVOROU', this.viewW / 2, y + 76, 40, '#ffe7eb', {
            align: 'center',
            weight: 800,
            spacing: 4,
            glow: accent,
            outline: 'rgba(0,0,0,0.6)',
            outlineWidth: 4,
        });
        label(ctx, `${this.player.def.name.toUpperCase()} CAIU NO ${this.stage.subtitle.toUpperCase()} — ${this.stage.name.toUpperCase()}`, this.viewW / 2, y + 100, 10.5, hexToRgba(accent, 0.9), {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.2,
        });
        const stats = [
            ['PONTOS', String(this.score).padStart(6, '0')],
            ['RANK', this.rank],
            ['ABATES', String(this.kills)],
            ['COMBO', String(Math.max(this.maxCombo, this.player.bestCombo)).padStart(2, '0')],
        ];
        stats.forEach(([k, v], i) => {
            const sx = x + 86 + i * 150;
            label(ctx, v, sx, y + 156, 20, '#ffffff', { align: 'center', weight: 800 });
            label(ctx, k, sx, y + 172, 8.5, 'rgba(190,198,220,0.55)', { align: 'center', font: FONTS.mono, spacing: 1.2 });
        });
        this.gameOverMenu.draw(ctx, x + 58, y + 202, w - 116, {
            itemHeight: 46,
            gap: 8,
            size: 17,
            accent,
        });
        label(ctx, this.score > this.record
            ? 'NOVO RECORDE DE PONTOS'
            : `RECORDE ${String(this.game.save.bestScore).padStart(6, '0')} · RANK ${this.game.save.bestRank}`, this.viewW / 2, y + h - 62, 10, this.score > this.record ? '#ffd166' : 'rgba(190,198,220,0.55)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.1,
            glow: this.score > this.record ? 'rgba(255,209,102,0.5)' : undefined,
        });
        label(ctx, 'DICA: O DASH (L) CONCEDE INVULNERABILIDADE CURTA.', this.viewW / 2, y + h - 42, 9.5, 'rgba(190,198,220,0.48)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 0.9,
        });
        label(ctx, 'SEU PROGRESSO FOI SALVO LOCALMENTE.', this.viewW / 2, y + h - 24, 9, 'rgba(170,178,200,0.35)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1,
        });
        ctx.restore();
    }
}
//# sourceMappingURL=gameplay.js.map