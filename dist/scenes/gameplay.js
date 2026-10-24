/** Cena principal: arena lateral, ondas, chefe, pausa, troca de herói e game over. */
import { Camera } from '../core/camera.js';
import { ParticleSystem } from '../core/particles.js';
import { clamp, hexToRgba } from '../core/math.js';
import { Player } from '../entities/player.js';
import { Enemy } from '../entities/enemy.js';
import { Boss } from '../entities/boss.js';
import { Hazard, Projectile } from '../entities/projectiles.js';
import { drawStageBackground } from '../render/backgrounds.js';
import { drawCharacterPortrait, drawPlayer } from '../render/characters.js';
import { drawBoss, drawEnemy } from '../render/enemies.js';
import { FONTS, label, panel, roundRectPath } from '../render/theme.js';
import { drawHud } from '../ui/hud.js';
import { Menu } from '../ui/menu.js';
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
export class GameplayScene {
    constructor(game, stage, charId) {
        this.game = game;
        this.particles = new ParticleSystem();
        this.time = 0;
        this.enemies = [];
        this.boss = null;
        this.projectiles = [];
        this.hazards = [];
        this.timers = [];
        this.banner = null;
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
        this.setBanner(stage.name, `${stage.subtitle} · ${stage.location}`, stage.palette.accent, 3.6);
    }
    enter() {
        this.audio.playMusic(this.stage.music);
    }
    // ------------------------------------------------------------ World
    get bossActive() {
        return this.boss !== null && !this.boss.dead;
    }
    get locked() {
        return this.phase === 'intro' || this.waveActive || this.boss !== null || this.paused || this.gameOver;
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
    }
    damagePlayer(damage, opts = {}) {
        if (this.player.dead)
            return 0;
        return this.player.takeDamage(damage, opts, this);
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
    }
    enemyKilled(enemy) {
        this.kills++;
        this.game.save.kills++;
        if (enemy.elite) {
            this.healPlayer(7);
            this.text('ELITE ABATIDO', enemy.x, enemy.centerY - 40, '#ffe6a3', 15);
        }
    }
    heavyImpact(x, y, color) {
        this.shake(0.5);
        this.audio.sfx('heavy');
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
            this.deathHandled = true;
            this.deathTimer = 0;
            this.game.recordDeath();
            this.audio.sfx('gameover');
            this.game.slowMo(0.45, 1.1);
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
        this.projectiles = this.projectiles.filter((p) => !p.dead);
        this.hazards = this.hazards.filter((h) => !h.dead);
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
        void dt;
        if (this.player.dead || this.phase !== 'combat')
            return;
        // Fim de onda.
        if (this.waveActive) {
            const alive = this.enemies.some((e) => !e.dead);
            if (!alive)
                this.finishWave();
            return;
        }
        // Próxima onda por proximidade.
        if (this.waveIndex < this.stage.waves.length) {
            const wave = this.stage.waves[this.waveIndex];
            if (this.player.x >= wave.at - 20)
                this.startWave(wave);
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
            this.setBanner('CHEFE', this.boss.def.title, this.boss.def.colors.accent, 2.4);
        }
        if (this.boss.dead && !this.bossCleared) {
            this.bossCleared = true;
            this.phase = 'cleared';
            this.setBanner('VÉU ROMPIDO', this.boss.def.defeat, '#ffffff', 5);
            this.game.slowMo(0.32, 2.6);
            this.game.flash(this.boss.def.colors.glow, 0.3);
            this.audio.sfx('victory');
            this.game.persist();
            this.after(2.7, () => this.game.finishStage(this.stage.id, this.player.charId));
        }
    }
    startWave(wave) {
        this.waveActive = true;
        this.waveSpawned = 0;
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
        this.waveActive = false;
        this.waveIndex++;
        this.camera.setBounds(0, Math.max(0, this.stage.width - this.viewW));
        this.healPlayer(this.player.maxHp * 0.1 + 4);
        this.game.save.bestCombo = Math.max(this.game.save.bestCombo, this.maxCombo, this.player.bestCombo);
        this.game.persist();
        if (this.waveIndex >= this.stage.waves.length) {
            this.setBanner('CAMINHO LIVRE', 'O CHEFE AGUARDA NO FIM DO PLANO', '#ffe6a3', 3.4);
        }
        else {
            this.setBanner('ONDA LIMPA', 'AVANCE PARA O PRÓXIMO SELO', '#8df4a8', 2.4);
        }
        this.audio.sfx('confirm');
    }
    spawnBoss() {
        const maxCam = Math.max(0, this.stage.width - this.viewW);
        this.camera.setBounds(maxCam, maxCam);
        this.camera.snapTo(maxCam);
        const bossX = maxCam + this.viewW - 335;
        this.boss = new Boss(this.stage.boss, bossX, this.stage.floor);
        this.bossWasIntro = true;
        this.bossCleared = false;
        this.game.save.bestCombo = Math.max(this.game.save.bestCombo, this.maxCombo, this.player.bestCombo);
        this.game.persist();
        this.setBanner(this.boss.def.name, this.boss.def.title, this.boss.def.colors.accent, 4.4);
        this.audio.sfx('boss');
        this.audio.sfx('roar');
        this.game.flash(this.boss.def.colors.accent, 0.28);
        this.shake(0.7);
        this.particles.ring(this.boss.x, this.boss.centerY, this.boss.def.colors.accent, 280, 0.8, 8);
    }
    // ------------------------------------------------------------ menus
    openPause() {
        if (this.player.dead)
            return;
        this.paused = true;
        this.pauseMenu.setItems([
            { id: 'resume', label: 'CONTINUAR', detail: 'ESC', accent: this.player.def.colors.accent },
            { id: 'swap', label: 'TROCAR DESPERTO', detail: `${this.game.save.unlocked.length} LIBERADOS`, accent: '#56e3ff' },
            { id: 'restart', label: 'REINICIAR FASE', detail: `FASE ${ROMAN[this.stage.id - 1]}`, accent: '#ffd166' },
            { id: 'title', label: 'SAIR PARA O MENU', detail: 'PROGRESSO SALVO', accent: '#ff6a7a' },
        ], true);
        this.audio.sfx('ui');
    }
    updatePauseMenu() {
        if (this.input.pressed('pause') || this.input.pressed('back')) {
            this.paused = false;
            this.audio.sfx('ui');
            return;
        }
        const action = this.pauseMenu.update(this.input, this.audio);
        if (!action)
            return;
        switch (action) {
            case 'resume':
                this.paused = false;
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
        this.game.save.bestCombo = Math.max(this.game.save.bestCombo, this.maxCombo, this.player.bestCombo);
        this.game.persist();
        this.gameOverMenu.setItems([
            { id: 'retry', label: 'TENTAR NOVAMENTE', detail: `FASE ${ROMAN[this.stage.id - 1]}`, accent: this.player.def.colors.accent },
            { id: 'swap', label: 'TROCAR DESPERTO', detail: 'OUTRO DESPERTO', accent: '#56e3ff' },
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
        if (this.waveIndex >= this.stage.waves.length)
            return 'RUMO AO CHEFE';
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
        this.particles.draw(ctx);
        ctx.restore();
        this.drawArenaFrame(ctx);
        drawHud(ctx, {
            player: this.player,
            stage: this.stage,
            waveIndex: this.waveIndex,
            waveCount: this.stage.waves.length,
            waveLabel: this.waveLabel,
            boss: this.boss,
            kills: this.kills,
            time: this.time,
            banner: this.banner,
            showHints: this.time < 20,
        }, this.time);
        if (this.paused)
            this.drawPause(ctx);
        if (this.gameOver)
            this.drawGameOver(ctx);
    }
    drawArenaFrame(ctx) {
        const locked = this.waveActive || this.boss !== null;
        if (!locked)
            return;
        const color = this.boss ? this.boss.def.colors.accent : this.stage.palette.accent;
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
        label(ctx, `FASE ${ROMAN[this.stage.id - 1]} · ${this.stage.name.toUpperCase()}`, x + 34, y + 70, 10, hexToRgba(accent, 0.85), {
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
        const controls = [
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
        label(ctx, 'ESC / BACKSPACE FECHAR · M ÁUDIO', x + w - 32, y + h - 18, 9, 'rgba(170,178,200,0.42)', {
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
        label(ctx, `${this.player.def.name.toUpperCase()} CAIU NA FASE ${ROMAN[this.stage.id - 1]} — ${this.stage.name.toUpperCase()}`, this.viewW / 2, y + 100, 10.5, hexToRgba(accent, 0.9), {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.2,
        });
        const stats = [
            ['ABATES', String(this.kills)],
            ['MELHOR COMBO', String(Math.max(this.maxCombo, this.player.bestCombo)).padStart(2, '0')],
            ['TEMPO', `${Math.floor(this.time / 60)}:${String(Math.floor(this.time % 60)).padStart(2, '0')}`],
        ];
        stats.forEach(([k, v], i) => {
            const sx = x + 110 + i * 160;
            label(ctx, v, sx, y + 156, 24, '#ffffff', { align: 'center', weight: 800 });
            label(ctx, k, sx, y + 172, 8.5, 'rgba(190,198,220,0.55)', { align: 'center', font: FONTS.mono, spacing: 1.2 });
        });
        this.gameOverMenu.draw(ctx, x + 58, y + 202, w - 116, {
            itemHeight: 46,
            gap: 8,
            size: 17,
            accent,
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