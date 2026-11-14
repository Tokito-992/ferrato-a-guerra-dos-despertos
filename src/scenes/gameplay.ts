/** Cena principal: arena lateral, ondas, chefe, pausa, troca de herói e game over. */

import type { Game, Scene } from '../core/game.js';
import type { HitOptions, HazardDef, ProjectileDef, World } from '../core/types.js';
import type { AudioEngine } from '../core/audio.js';
import type { Input } from '../core/input.js';
import { Camera } from '../core/camera.js';
import { ParticleSystem } from '../core/particles.js';
import { clamp, hexToRgba } from '../core/math.js';
import { rankColor, rankFromPressure, rankValue } from '../core/rank.js';
import type { Rank } from '../core/rank.js';
import { MAX_HEARTS } from '../core/save.js';
import type { CharacterId } from '../data/characters.js';
import { getStage, MAX_STAGE } from '../data/stages.js';
import type { StageDef, WaveDef } from '../data/stages.js';
import type { EnemyKind } from '../data/enemies.js';
import type { BossId } from '../data/bosses.js';
import type { OnlineSnapshot } from '../core/online.js';
import { packInput, unpackInput } from '../core/online.js';
import type { OnlineSession } from '../core/online.js';
import type { ObstacleKind } from '../entities/obstacles.js';
import {
  archiveBossId,
  archiveCreatureId,
  archivePhenomenonId,
  archivePlaceId,
  archiveRelicId,
  stageRelicKinds,
} from '../data/archive.js';
import { Combatant } from '../entities/combatant.js';
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
import { FONTS, glow, label, panel, roundRectPath } from '../render/theme.js';
import type { HudBanner } from '../ui/hud.js';
import { drawHud } from '../ui/hud.js';
import { Menu } from '../ui/menu.js';

type GameplayPhase = 'intro' | 'combat' | 'bonus' | 'cleared';

interface HeartMote {
  x: number;
  y: number;
  baseY: number;
  phase: number;
}

interface Timer {
  t: number;
  fn: () => void;
}

function insideRect(rect: { x: number; y: number; w: number; h: number }, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function isGameplayPhase(value: string): value is GameplayPhase {
  return value === 'intro' || value === 'combat' || value === 'bonus' || value === 'cleared';
}

/** Grão de filme procedural, gerado uma vez e repetido em tela. */
let grainPattern: CanvasPattern | null = null;
function getGrainPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (grainPattern) return grainPattern;
  if (typeof document === 'undefined') return null;
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const g = tile.getContext('2d');
  if (!g) return null;
  const img = g.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 90 + Math.floor(Math.random() * 165);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 8 + Math.floor(Math.random() * 20);
  }
  g.putImageData(img, 0, 0);
  grainPattern = ctx.createPattern(tile, 'repeat');
  return grainPattern;
}

export class GameplayScene implements Scene, World {
  readonly audio: AudioEngine;
  readonly particles = new ParticleSystem();
  readonly camera: Camera;
  readonly input: Input;
  readonly stage: StageDef;
  readonly groundY: number;
  readonly viewW: number;
  readonly viewH: number;

  time = 0;
  readonly players: Player[];
  enemies: Enemy[] = [];
  boss: Boss | null = null;
  noticeY = 568;

  /** Primeiro jogador; mantém compatibilidade com a lógica antiga. */
  get player(): Player {
    return this.players[0];
  }

  get isCoop(): boolean {
    return this.players.length > 1;
  }

  private projectiles: Projectile[] = [];
  private hazards: Hazard[] = [];
  private timers: Timer[] = [];
  private banner: HudBanner | null = null;
  private obstacles: StageObstacle[] = [];

  private phase: GameplayPhase = 'intro';
  private introT = 2.4;
  private waveIndex = 0;
  private waveActive = false;
  private waveSpawned = 0;
  private kills = 0;
  private maxCombo = 0;
  private deathHandled: boolean[] = [];
  private downed: boolean[] = [];
  private reviveProgress: number[] = [];
  private partyDeathTimer = 0;
  private gameOver = false;
  private paused = false;
  private bossCleared = false;
  private bossWasIntro = true;
  private pauseMenu: Menu;
  private gameOverMenu: Menu;
  private pauseHomeRect = { x: 0, y: 0, w: 0, h: 0 };
  private gameOverHomeRect = { x: 0, y: 0, w: 0, h: 0 };

  // Sistema competitivo e de vidas extras.
  private hearts = 0;
  private readonly maxHearts = MAX_HEARTS;
  private score = 0;
  private pressure = 0;
  private damageTaken = 0;
  private record = 0;
  private waveStartTime = 0;
  private waveDamageStart = 0;
  private waveComboStart = 0;
  private waveKillStart = 0;
  private hunterSpawned = false;
  private hunter: Enemy | null = null;
  private nextAnomalyPressure = 58;

  // Impacto estilo anime: estrela radial + flash curto.
  private animeImpact = 0;
  private animeImpactX = 0;
  private animeImpactY = 0;
  private animeImpactColor = '#fff4cd';

  // Câmara do Coração: evento raro (capítulo 3 de cada arco), curto e com no máximo uma vida extra.
  private readonly bonusDuration = 10;
  private readonly bonusTotal = 3;
  private bonusTriggered = false;
  private bonusAt = 0;
  private bonusTimer = 0;
  private bonusCollected = 0;
  private bonusRewardCap = 1;
  private bonusMotes: HeartMote[] = [];
  private bonusHazardTimer = 0;
  private bonusHazardCount = 0;

  // Co-op online: o host simula e envia snapshots; o convidado só desenha.
  private readonly online: OnlineSession | null;
  private readonly onlineRole: 'host' | 'guest' | null;
  private onlineUnsubs: (() => void)[] = [];
  private onlineSnapshot: OnlineSnapshot | null = null;
  private onlineSnapshotAcc = 0;
  private onlineInputAcc = 0;
  private onlineFinished = false;
  private onlineReturning = false;
  private onlinePauseSentAt = -10;
  private nextNetId = 1;
  private readonly guestEnemies = new Map<number, Enemy>();
  private playerTargets: { x: number; y: number }[] = [];
  private readonly enemyTargets = new Map<number, { x: number; y: number }>();
  private bossTarget: { x: number; y: number } | null = null;

  constructor(
    private readonly game: Game,
    stage: StageDef,
    charId: CharacterId,
    partnerId?: CharacterId,
    online?: OnlineSession,
  ) {
    this.stage = stage;
    this.online = online ?? null;
    this.onlineRole = online?.role ?? null;
    this.audio = game.audio;
    this.input = game.input;
    this.viewW = game.width;
    this.viewH = game.height;
    this.groundY = stage.floor;
    this.camera = new Camera(game.width, game.height);
    this.camera.setBounds(0, Math.max(0, stage.width - this.viewW));
    this.camera.snapTo(0);

    const hero = new Player(170, charId, stage.floor, 0);
    this.players = [hero];
    if (partnerId !== undefined) {
      this.players.push(new Player(250, partnerId, stage.floor, 1));
    }
    this.deathHandled = this.players.map(() => false);
    this.downed = this.players.map(() => false);
    this.reviveProgress = this.players.map(() => 0);
    this.pauseMenu = new Menu([]);
    this.gameOverMenu = new Menu([]);
    this.obstacles = buildStageObstacles(stage);
    this.pressure = clamp(16 + (stage.arc - 1) * 4 + (stage.chapter - 1) * 2, 0, 100);
    this.nextAnomalyPressure = clamp(this.pressure + 20, 58, 92);
    this.bonusAt = stage.width * 0.52;
    this.bonusRewardCap = this.heartRewardCap();
    // Corações não são mais por capítulo: o que o jogador conquistou (e não
    // gastou) acompanha a campanha e pode ser acumulado até MAX_HEARTS.
    this.hearts = clamp(game.save.hearts, 0, this.maxHearts);
    this.record = this.game.save.bestScore;
    this.setBanner(stage.name, `${stage.subtitle} · ${stage.location}`, stage.palette.accent, 3.6);
  }

  enter(): void {
    this.game.setTouchControlsVisible(true);
    this.audio.playMusic(this.stage.music);
    this.audio.playAmbience(this.stage.ambient);
    this.discover(
      [
        archivePlaceId(this.stage.id),
        archivePhenomenonId(this.stage.ambient),
        ...stageRelicKinds(this.stage).map((kind) => archiveRelicId(kind)),
      ],
      'ARQUIVO DO VÉU ATUALIZADO',
    );

    if (this.onlineRole === 'host') this.setupHostOnline();
    else if (this.onlineRole === 'guest') this.setupGuestOnline();
  }

  exit(): void {
    this.game.setTouchControlsVisible(false);
    for (const unsubscribe of this.onlineUnsubs) unsubscribe();
    this.onlineUnsubs = [];
    if (this.onlineRole === 'host') this.input.setRemotePlayer(1, false);
  }

  // ------------------------------------------------------------ co-op online

  /** Host: recebe a entrada do convidado e mantém a simulação autoritativa. */
  private setupHostOnline(): void {
    const session = this.online;
    if (!session) return;
    this.input.setRemotePlayer(1, true);
    this.onlineUnsubs.push(
      session.on('input', (value) => {
        const input = value as { down?: number; pressed?: number };
        const unpacked = unpackInput(input.down ?? 0, input.pressed ?? 0);
        this.input.setRemoteState(1, unpacked.down, unpacked.pressed);
      }),
    );
    this.onlineUnsubs.push(
      session.on('pause-request', () => {
        if (!this.paused && !this.gameOver) this.openPause();
      }),
    );
    this.onlineUnsubs.push(
      session.on('resume-request', () => {
        if (this.paused) this.resumePause();
      }),
    );
    this.onlineUnsubs.push(
      session.on('restart-request', () => {
        this.performOnlineRestart();
      }),
    );
    this.onlineUnsubs.push(
      session.on('peer-left', () => {
        this.game.setNotice('O CONVIDADO SAIU DA SALA', '#ff6a7a');
        this.returnToOnlineRoom();
      }),
    );
  }

  /** Convidado: envia entrada local e desenha os snapshots recebidos. */
  private setupGuestOnline(): void {
    const session = this.online;
    if (!session) return;
    this.onlineUnsubs.push(
      session.on('snapshot', (value) => {
        if (value && typeof value === 'object') this.applyGuestSnapshot(value as OnlineSnapshot);
      }),
    );
    this.onlineUnsubs.push(
      session.on('pause', (value) => {
        if (value === true) this.openGuestPause();
        else this.resumePause();
      }),
    );
    this.onlineUnsubs.push(
      session.on('stage-clear', (value) => {
        const stageId = Number(value);
        this.applyGuestStageClear(Number.isFinite(stageId) ? stageId : this.stage.id);
      }),
    );
    this.onlineUnsubs.push(
      session.on('lobby-return', (value) => {
        const info = value as { cleared?: boolean } | null;
        if (info?.cleared) {
          // Deixa o banner de capítulo concluído aparecer; `applyGuestStageClear`
          // agenda a volta para a sala.
          this.applyGuestStageClear(this.stage.id);
          return;
        }
        this.returnToOnlineRoom();
      }),
    );
    this.onlineUnsubs.push(
      session.on('restart', (value) => {
        const start = value as { stageId: number; p1: CharacterId; p2: CharacterId } | null;
        if (!start) return;
        this.game.transitionTo(() =>
          this.game.showOnlineGuest(start.stageId, start.p1, start.p2),
        );
      }),
    );
    this.onlineUnsubs.push(
      session.on('peer-left', () => {
        this.game.dropOnlineSession();
        this.game.setNotice('O HOST ENCERROU A SALA', '#ff6a7a');
        this.returnToOnlineRoom();
      }),
    );
  }

  /** Convidado aplica o progresso no próprio save quando o host conclui o capítulo. */
  private applyGuestStageClear(stageId: number): void {
    if (this.onlineRole !== 'guest' || this.onlineFinished) return;
    this.onlineFinished = true;
    const stage = getStage(clamp(Math.floor(stageId), 1, MAX_STAGE));
    this.persistRecord();
    this.game.applyStageClear(stage.id, stage.character);
    this.setBanner(
      'CAPÍTULO CONCLUÍDO',
      'PROGRESSO SALVO NESTE APARELHO · VOLTANDO À SALA',
      '#8df4a8',
      3.2,
    );
    this.after(2.4, () => this.returnToOnlineRoom());
  }

  private returnToOnlineRoom(): void {
    if (this.onlineReturning) return;
    this.onlineReturning = true;
    this.online?.setPaused(false);
    this.game.returnToOnlineLobby();
  }

  private performOnlineRestart(): void {
    if (this.onlineRole === 'host') {
      this.online?.restart(this.stage.id, this.player.charId, this.players[1]?.charId ?? this.stage.character);
      this.game.transitionTo(() =>
        this.game.showOnlineHost(this.stage.id, this.player.charId, this.players[1]?.charId ?? this.stage.character),
      );
    } else if (this.onlineRole === 'guest') {
      this.online?.requestRestart();
      this.game.setNotice('PEDIDO DE REINÍCIO ENVIADO AO HOST', '#56e3ff');
    }
  }

  private openGuestPause(): void {
    if (this.gameOver) return;
    this.onlinePauseSentAt = this.time;
    // O host atendeu: o aviso do pedido já cumpriu o papel e não deve cobrir o menu.
    this.game.clearNotice('PEDIDO DE PAUSA ENVIADO AO HOST');
    this.paused = true;
    this.input.setGameplayContext(false);
    this.game.setTouchControlsVisible(false);
    this.pauseMenu.setItems(
      [
        { id: 'resume', label: 'CONTINUAR', detail: 'PEDIR AO HOST', accent: this.player.def.colors.accent },
        { id: 'restart', label: 'PEDIR REINÍCIO', detail: 'HOST DECIDE', accent: '#ffd166' },
        { id: 'leave', label: 'SAIR DA SALA', detail: 'VOLTAR AO LOBBY', accent: '#ff6a7a' },
      ],
      true,
    );
    this.audio.sfx('ui');
  }

  private applyGuestSnapshot(snapshot: OnlineSnapshot): void {
    this.onlineSnapshot = snapshot;
    this.time = Math.max(this.time, snapshot.t);
    const wasPaused = this.paused;
    this.paused = snapshot.paused;
    if (snapshot.paused && !wasPaused) this.openGuestPause();
    else if (!snapshot.paused && wasPaused) this.resumePause();
    if (snapshot.gameOver && !this.gameOver) this.openGuestGameOver();

    const maxCam = Math.max(0, this.stage.width - this.viewW);
    this.camera.setBounds(0, maxCam);

    // Jogadores.
    snapshot.players.forEach((value, index) => {
      const player = this.players[index];
      if (!player) return;
      const oldX = player.x;
      const oldY = player.y;
      player.applyNetVisual(value);
      this.playerTargets[index] = { x: player.x, y: player.y };
      player.x = oldX;
      player.y = oldY;
    });

    // Inimigos comuns.
    const seenEnemies = new Set<number>();
    for (const value of snapshot.enemies) {
      let enemy = this.guestEnemies.get(value.id);
      if (!enemy) {
        enemy = new Enemy(this.stage, value.kind as EnemyKind, value.x, value.elite);
        enemy.netId = value.id;
        this.guestEnemies.set(value.id, enemy);
      }
      const oldX = enemy.x;
      const oldY = enemy.y;
      enemy.applyNetVisual(value);
      this.enemyTargets.set(value.id, { x: enemy.x, y: enemy.y });
      enemy.x = oldX;
      enemy.y = oldY;
      seenEnemies.add(value.id);
    }
    for (const id of [...this.guestEnemies.keys()]) {
      if (seenEnemies.has(id)) continue;
      this.guestEnemies.delete(id);
      this.enemyTargets.delete(id);
    }
    this.enemies = [...this.guestEnemies.values()];

    // Chefe.
    if (snapshot.boss) {
      const value = snapshot.boss;
      if (!this.boss || this.boss.def.id !== value.id) {
        this.boss = new Boss(value.id as BossId, value.x, this.stage.floor);
      }
      const oldX = this.boss.x;
      const oldY = this.boss.y;
      this.boss.applyNetVisual(value);
      this.bossTarget = { x: this.boss.x, y: this.boss.y };
      this.boss.x = oldX;
      this.boss.y = oldY;
    } else {
      this.boss = null;
      this.bossTarget = null;
    }

    // Projéteis e zonas: recriados a partir do snapshot apenas para desenho.
    this.projectiles = snapshot.projectile.map((value) => {
      const projectile = new Projectile({
        x: value.x,
        y: value.y,
        vx: value.vx,
        vy: value.vy,
        radius: value.radius,
        damage: 0,
        owner: value.owner,
        color: value.color,
        accent: value.accent,
        style: value.style as ProjectileDef['style'],
        life: 999,
      });
      projectile.spinAngle = value.spinAngle;
      return projectile;
    });
    this.hazards = snapshot.hazards.map((value) => {
      const hazard = new Hazard({
        kind: value.kind as HazardDef['kind'],
        x: value.x,
        y: value.y,
        w: value.w,
        h: value.h,
        radius: value.radius,
        duration: value.duration,
        damage: 0,
        owner: value.owner,
        color: value.color,
        accent: value.accent,
      });
      hazard.time = value.time;
      hazard.delay = value.delay;
      return hazard;
    });

    this.obstacles = snapshot.obstacles.map((value) => {
      const obstacle = new StageObstacle(
        value.kind as ObstacleKind,
        value.x,
        value.y,
        this.stage,
        { temporary: value.temporary, life: value.life },
      );
      obstacle.cycle = value.cycle;
      obstacle.active = value.active;
      obstacle.used = value.used;
      obstacle.phase = value.phase;
      return obstacle;
    });

    this.bonusMotes = snapshot.bonus
      ? snapshot.bonus.motes.map((mote, index) => ({
          x: mote.x,
          y: mote.y,
          baseY: mote.y,
          phase: index * 1.7,
        }))
      : [];
    this.bonusTimer = snapshot.bonus ? snapshot.bonus.time : 0;
    this.bonusCollected = snapshot.bonus ? snapshot.bonus.collected : 0;
    this.bonusRewardCap = snapshot.bonus ? snapshot.bonus.rewardCap : 1;

    this.phase = isGameplayPhase(snapshot.phase) ? snapshot.phase : 'combat';
    this.waveIndex = snapshot.waveIndex;
    this.kills = snapshot.kills;
    this.score = snapshot.score;
    this.maxCombo = snapshot.maxCombo;
    this.hearts = snapshot.hearts;
    this.pressure = snapshot.pressure;
    this.downed = snapshot.downed;
    this.reviveProgress = snapshot.revive;
    this.banner = snapshot.banner
      ? {
          text: snapshot.banner.text,
          sub: snapshot.banner.sub,
          color: snapshot.banner.color,
          t: Math.max(0, snapshot.banner.max - snapshot.banner.remaining),
          max: snapshot.banner.max,
        }
      : null;
  }

  private updateGuest(dt: number): void {
    this.time += dt;
    if (this.gameOver) {
      this.updateGameOverMenu();
      return;
    }
    if (this.paused) {
      this.updateGuestPauseMenu();
      return;
    }
    if (this.input.pressed('pause') || this.input.pressed('back') || this.input.pressed('pause', 1)) {
      // Um pedido por vez: segurar/teclar repetidamente não deve inundar o host
      // nem empilhar avisos sobre o menu de pausa.
      if (this.time - this.onlinePauseSentAt >= 1.6) {
        this.onlinePauseSentAt = this.time;
        this.online?.requestPause();
        this.game.setNotice('PEDIDO DE PAUSA ENVIADO AO HOST', '#56e3ff', 2.2);
      }
      return;
    }

    this.onlineInputAcc += dt;
    const packed = packInput(this.input, 0);
    if (packed.pressed !== 0 || this.onlineInputAcc >= 1 / 24) {
      this.onlineInputAcc = 0;
      this.online?.sendInput(packed.down, packed.pressed);
    }

    this.updateGuestVisuals(dt);
    if (this.animeImpact > 0) this.animeImpact = Math.max(0, this.animeImpact - dt);
    this.updateBanner(dt);
    // O convidado não simula combate, mas usa timers de cena para o retorno
    // automático à sala depois do aviso de capítulo concluído.
    this.updateTimers(dt);

    if (this.onlineSnapshot) {
      const targetCam = clamp(
        this.onlineSnapshot.cam,
        0,
        Math.max(0, this.stage.width - this.viewW),
      );
      this.camera.update(dt, targetCam);
    }
  }

  private updateGuestVisuals(dt: number): void {
    const blend = 1 - Math.exp(-dt * 16);
    this.players.forEach((player, index) => {
      const target = this.playerTargets[index];
      if (target) {
        player.x += (target.x - player.x) * blend;
        player.y += (target.y - player.y) * blend;
      }
      player.animTime += dt;
      player.walkPhase += dt * (6 + Math.abs(player.vx) * 0.03);
      player.hitFlash = Math.max(0, player.hitFlash - dt);
      player.abilityFlash = Math.max(0, player.abilityFlash - dt);
      player.comboTimerDisplay = Math.max(0, player.comboTimerDisplay - dt);
    });

    for (const enemy of this.enemies) {
      const target = this.enemyTargets.get(enemy.netId);
      if (target) {
        enemy.x += (target.x - enemy.x) * blend;
        enemy.y += (target.y - enemy.y) * blend;
      }
      enemy.animPhase += dt;
      enemy.walkPhase += dt * (4 + Math.abs(enemy.vx) * 0.02);
      enemy.stateTime += dt;
      enemy.windupFlash = Math.max(0, enemy.windupFlash - dt);
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
      if (enemy.dead) enemy.deathTimer += dt;
    }

    if (this.boss && this.bossTarget) {
      this.boss.x += (this.bossTarget.x - this.boss.x) * blend;
      this.boss.y += (this.bossTarget.y - this.boss.y) * blend;
      this.boss.animPhase += dt;
      this.boss.stateT += dt;
      this.boss.hitFlash = Math.max(0, this.boss.hitFlash - dt);
      if (this.boss.dead) this.boss.deathTimer += dt;
    }
  }

  private updateGuestPauseMenu(): void {
    if (this.input.pressed('pause') || this.input.pressed('back') || this.input.pressed('cancel')) {
      this.online?.requestResume();
      this.resumePause();
      return;
    }
    const action = this.pauseMenu.update(this.input, this.audio);
    if (!action) return;
    switch (action) {
      case 'resume':
        this.online?.requestResume();
        this.resumePause();
        break;
      case 'restart':
        this.online?.requestRestart();
        this.game.setNotice('PEDIDO DE REINÍCIO ENVIADO AO HOST', '#56e3ff');
        break;
      case 'leave':
        this.leaveOnlineRoom();
        break;
    }
  }

  private leaveOnlineRoom(): void {
    this.online?.leave();
    this.game.dropOnlineSession();
    this.game.returnToOnlineLobby('VOCÊ SAIU DA SALA');
  }

  private openGuestGameOver(): void {
    this.gameOver = true;
    this.input.setGameplayContext(false);
    this.game.setTouchControlsVisible(false);
    this.persistRecord();
    this.gameOverMenu.setItems(
      [
        { id: 'retry', label: 'PEDIR REINÍCIO', detail: 'HOST DECIDE', accent: this.player.def.colors.accent },
        { id: 'swap', label: 'SAIR DA SALA', detail: 'VOLTAR AO LOBBY', accent: '#56e3ff' },
        { id: 'title', label: 'MENU PRINCIPAL', detail: 'ARQUIVO SALVO', accent: '#ffe6a3' },
      ],
      false,
    );
    this.audio.sfx('gameover');
  }

  // ------------------------------------------------------------ World

  get bossActive(): boolean {
    return this.boss !== null && !this.boss.dead;
  }

  get locked(): boolean {
    return this.phase === 'intro' || this.phase === 'bonus' || this.waveActive || this.boss !== null || this.paused || this.gameOver;
  }

  get enemyProjectiles(): Projectile[] {
    return this.projectiles;
  }

  spawnProjectile(def: ProjectileDef): Projectile {
    const p = new Projectile(def);
    this.projectiles.push(p);
    return p;
  }

  spawnHazard(def: HazardDef): void {
    this.hazards.push(new Hazard(def));
  }

  spawnEnemy(kind: string, x: number, elite = false): Enemy {
    const px = clamp(x, this.camera.x + 74, this.camera.x + this.viewW - 74);
    const enemy = new Enemy(this.stage, kind as EnemyKind, px, elite);
    enemy.netId = this.nextNetId++;
    this.game.unlockArchive([archiveCreatureId(this.stage.arc, enemy.def.kind)]);
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

  /** Revela registros no livro e avisa o jogador sem interromper o combate. */
  private discover(ids: readonly string[], label: string): void {
    const fresh = this.game.unlockArchive(ids);
    if (fresh.length === 0) return;
    const noun = fresh.length === 1 ? 'REGISTRO' : 'REGISTROS';
    this.game.setNotice(`${label}  ·  ${fresh.length} ${noun} NO ARQUIVO`, '#b48bff', 3.1);
  }

  damageEnemy(target: Combatant, damage: number, opts: HitOptions = {}): void {
    const dealt = target.takeDamage(damage, opts, this);
    if (dealt <= 0) return;
    const color = opts.crit ? '#fff4cd' : opts.color ?? this.stage.palette.accent;
    this.particles.text(
      target.x + (Math.random() - 0.5) * 22,
      target.centerY - 12,
      String(dealt),
      color,
      opts.crit ? 25 : 16,
      false,
      0.72,
    );
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

  nearestPlayer(x: number, y?: number): Player {
    let best = this.players[0];
    let bestDist = Number.POSITIVE_INFINITY;
    for (const p of this.players) {
      if (p.dead) continue;
      const dist = y === undefined ? Math.abs(p.x - x) : Math.hypot(p.x - x, p.centerY - y);
      if (dist < bestDist) {
        best = p;
        bestDist = dist;
      }
    }
    return best;
  }

  damagePlayer(damage: number, opts: HitOptions = {}, target: Player = this.players[0]): number {
    if (target.dead) return 0;
    const dealt = target.takeDamage(damage, opts, this);
    if (dealt > 0) {
      this.damageTaken += dealt;
      this.pressure = clamp(this.pressure - 9, 0, 100);
      if (visualStyle.anime) {
        this.animeImpact = Math.max(this.animeImpact, 0.18);
        this.animeImpactX = target.x;
        this.animeImpactY = target.centerY;
        this.animeImpactColor = '#ff3357';
      }
    }
    return dealt;
  }

  damagePlayers(x: number, y: number, radius: number, damage: number, opts: HitOptions = {}): number {
    let total = 0;
    for (const p of this.players) {
      if (p.dead) continue;
      const reach = radius + Math.max(0, p.w * p.scale * 0.3);
      if (Math.hypot(p.x - x, p.centerY - y) > reach) continue;
      total += this.damagePlayer(damage, { ...opts, fromX: opts.fromX ?? x }, p);
    }
    return total;
  }

  healPlayer(amount: number, target: Player = this.players[0]): void {
    if (target.dead || amount <= 0) return;
    const healed = target.heal(amount);
    if (healed > 0.4) {
      this.text(`+${Math.round(healed)}`, target.x, target.y - 122, '#8df4a8', 17);
      this.particles.spawn({
        kind: 'glow',
        x: target.x,
        y: target.centerY,
        vy: -50,
        life: 0.5,
        size: 34,
        color: '#8df4a8',
      });
    }
  }

  healParty(amount: number): void {
    for (const p of this.players) this.healPlayer(amount, p);
  }

  shake(amount: number): void {
    this.camera.addShake(amount);
  }

  flash(color: string, alpha: number): void {
    this.game.flash(color, alpha);
  }

  hitStop(seconds: number): void {
    this.game.hitStop(seconds);
  }

  text(text: string, x: number, y: number, color = '#ffffff', size = 18): void {
    this.particles.text(x, y, text, color, size, false, 0.85);
  }

  after(seconds: number, fn: () => void): void {
    this.timers.push({ t: seconds, fn });
  }

  addCombo(count = 1): void {
    const best = Math.max(...this.players.map((p) => p.comboHits));
    this.maxCombo = Math.max(this.maxCombo, best + Math.max(0, count - 1));
    this.game.save.bestCombo = Math.max(this.game.save.bestCombo, this.maxCombo);
    this.pressure = clamp(this.pressure + 0.3, 0, 100);
    this.addScore(4);
  }

  enemyKilled(enemy: Enemy): void {
    this.kills++;
    this.game.save.kills++;
    this.pressure = clamp(this.pressure + (enemy.elite ? 5.5 : 2.2), 0, 100);
    this.addScore(enemy.elite ? 380 : 130);
    if (enemy === this.hunter) {
      this.hunter = null;
      this.addScore(1200);
      this.healParty(8);
      this.text('CAÇADOR DO VÉU ABATIDO', enemy.x, enemy.centerY - 44, '#ff9bb8', 16);
      this.game.flash('#ff6a9a', 0.12);
      this.audio.sfx('victory');
    } else if (enemy.elite) {
      this.healParty(5);
      this.text('ELITE ABATIDO', enemy.x, enemy.centerY - 40, '#ffe6a3', 15);
    }
  }

  heavyImpact(x: number, y: number, color: string): void {
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

  sealEnemies(radius: number, duration: number, ox?: number, oy?: number): void {
    const px = ox ?? this.player.x;
    const py = oy ?? this.player.centerY;
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      if (Math.hypot(enemy.x - px, enemy.centerY - py) > radius) continue;
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

  clearEnemyProjectiles(x: number, y: number, radius: number): void {
    for (const p of this.projectiles) {
      if (p.dead || p.owner !== 'enemy') continue;
      if (Math.hypot(p.x - x, p.y - y) > radius) continue;
      p.dead = true;
      this.particles.ring(p.x, p.y, '#fff4cd', 28, 0.25, 2);
    }
  }

  // ------------------------------------------------------------ ciclo

  update(dt: number): void {
    if (this.onlineRole === 'guest') {
      this.updateGuest(dt);
      return;
    }
    if (this.gameOver) {
      this.updateGameOverMenu();
      return;
    }
    if (this.paused) {
      this.updatePauseMenu();
      return;
    }

    if (this.input.pressed('pause') || this.input.pressed('back') || this.input.pressed('pause', 1)) {
      this.openPause();
      return;
    }

    this.time += dt;
    if (this.animeImpact > 0) this.animeImpact = Math.max(0, this.animeImpact - dt);
    this.updateBanner(dt);
    this.updateTimers(dt);
    this.particles.update(dt);

    if (this.phase === 'intro') {
      this.introT -= dt;
      if (this.introT <= 0) {
        this.phase = 'combat';
        // A trilha do estágio cede lugar à tensão assim que o combate começa.
        this.audio.playCombatMusic(this.stage.arc);
        this.audio.sfx('wave');
      }
    }

    for (const player of this.players) player.update(dt, this);
    for (let i = 0; i < this.players.length; i++) this.updatePlayerDeath(dt, i);

    for (const enemy of this.enemies) enemy.update(dt, this);
    if (this.boss) {
      this.boss.update(dt, this);
      this.boss.applyStatuses(dt, this);
    }

    for (const p of this.projectiles) p.update(dt, this);
    for (const h of this.hazards) h.update(dt, this);
    for (const obstacle of this.obstacles) obstacle.update(dt, this);
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    this.hazards = this.hazards.filter((h) => !h.dead);
    this.obstacles = this.obstacles.filter((o) => !o.expired);
    this.enemies = this.enemies.filter((e) => !e.dead || e.deathTimer < 1.25);

    this.updateCamera(dt);
    this.updateFlow(dt);

    if (this.players.every((p) => p.dead)) {
      this.partyDeathTimer += dt;
      if (this.partyDeathTimer > 1.75 && !this.gameOver) this.openGameOver();
    } else {
      this.partyDeathTimer = 0;
    }

    if (this.onlineRole === 'host') {
      this.onlineSnapshotAcc += dt;
      if (this.onlineSnapshotAcc >= 1 / 20) {
        this.onlineSnapshotAcc = 0;
        this.online?.sendSnapshot(this.buildSnapshot());
      }
    }
  }

  /** Monta o estado autoritativo enviado ao convidado. */
  private buildSnapshot(): OnlineSnapshot {
    return {
      t: this.time,
      cam: this.camera.x,
      players: this.players.map((player) => ({
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        hp: player.hp,
        maxHp: player.maxHp,
        dead: player.dead,
        facing: player.facing,
        state: player.state,
        onGround: player.onGround,
        walkPhase: player.walkPhase,
        combatState: player.state,
        dashTime: player.dashTime,
        dashDir: player.dashDir,
        invuln: player.invuln,
        hitFlash: player.hitFlash,
        abilityFlash: player.abilityFlash,
        deathTimer: player.deathTimer,
        comboHits: player.comboHits,
        abilityCd: player.abilityCd,
        attack: player.attack
          ? { slot: player.attack.slot, t: player.attack.t }
          : null,
      })),
      enemies: this.enemies.map((enemy) => ({
        id: enemy.netId,
        kind: enemy.def.kind,
        elite: enemy.elite,
        x: enemy.x,
        y: enemy.y,
        vx: enemy.vx,
        vy: enemy.vy,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        facing: enemy.facing,
        state: enemy.state,
        stateTime: enemy.stateTime,
        dead: enemy.dead,
        alpha: enemy.alpha,
        hitFlash: enemy.hitFlash,
        enrage: enemy.enrage,
        deathTimer: enemy.deathTimer,
        aimX: enemy.aimX,
        aimY: enemy.aimY,
        windupFlash: enemy.windupFlash,
      })),
      boss: this.boss
        ? {
            id: this.boss.def.id,
            x: this.boss.x,
            y: this.boss.y,
            hp: this.boss.hp,
            maxHp: this.boss.maxHp,
            facing: this.boss.facing,
            state: this.boss.state,
            stateT: this.boss.stateT,
            phaseIndex: this.boss.phaseIndex,
            dead: this.boss.dead,
            hitFlash: this.boss.hitFlash,
            alpha: 1,
            animPhase: this.boss.animPhase,
            attackId: this.boss.attackId,
            attackWindup: this.boss.attackWindup,
            attackDuration: this.boss.attackDuration,
            attackRecover: this.boss.attackRecover,
          }
        : null,
      projectile: this.projectiles.map((projectile) => ({
        x: projectile.x,
        y: projectile.y,
        vx: projectile.vx,
        vy: projectile.vy,
        radius: projectile.radius,
        color: projectile.color,
        accent: projectile.accent,
        style: projectile.style,
        owner: projectile.owner,
        spinAngle: projectile.spinAngle,
      })),
      hazards: this.hazards.map((hazard) => ({
        kind: hazard.kind,
        x: hazard.x,
        y: hazard.y,
        w: hazard.w,
        h: hazard.h,
        radius: hazard.radius,
        duration: hazard.duration,
        damage: hazard.damage,
        owner: hazard.owner,
        color: hazard.color,
        accent: hazard.accent,
        time: hazard.time,
        delay: hazard.delay,
      })),
      waveIndex: this.waveIndex,
      waveLabel: this.waveLabel,
      waveCount: this.stage.waves.length,
      kills: this.kills,
      score: this.score,
      maxCombo: Math.max(this.maxCombo, ...this.players.map((player) => player.bestCombo)),
      hearts: this.hearts,
      pressure: this.pressure,
      phase: this.phase,
      paused: this.paused,
      gameOver: this.gameOver,
      banner: this.banner
        ? {
            text: this.banner.text,
            sub: this.banner.sub,
            color: this.banner.color,
            remaining: Math.max(0, this.banner.max - this.banner.t),
            max: this.banner.max,
          }
        : null,
      bonus:
        this.phase === 'bonus'
          ? {
              time: Math.max(0, this.bonusTimer),
              max: this.bonusDuration,
              collected: this.bonusCollected,
              total: this.bonusTotal,
              rewardCap: this.bonusRewardCap,
              motes: this.bonusMotes.map((mote) => ({ x: mote.x, y: mote.y })),
            }
          : null,
      obstacles: this.obstacles.map((obstacle) => ({
        kind: obstacle.kind,
        x: obstacle.x,
        y: obstacle.y,
        temporary: obstacle.temporary,
        life: obstacle.life,
        cycle: obstacle.cycle,
        active: obstacle.active,
        used: obstacle.used,
        phase: obstacle.phase,
      })),
      revive: [...this.reviveProgress],
      downed: [...this.downed],
    };
  }

  /** Trata a queda de um jogador: coração, reanimação pelo parceiro ou game over. */
  private updatePlayerDeath(dt: number, index: number): void {
    const p = this.players[index];
    if (!p.dead) {
      this.downed[index] = false;
      this.deathHandled[index] = false;
      this.reviveProgress[index] = 0;
      return;
    }
    if (!this.deathHandled[index]) {
      this.deathHandled[index] = true;
      if (this.hearts > 0 && !this.gameOver) {
        this.revivePlayer(index, true);
        return;
      }
      this.game.recordDeath();
      this.downed[index] = true;
      this.reviveProgress[index] = 0;
      const partnerAlive = this.players.some((other, i) => i !== index && !other.dead);
      this.setBanner(
        `${p.def.name.toUpperCase()} CAIU`,
        partnerAlive
          ? 'APROXIME-SE DO PARCEIRO PARA REANIMAR · OU USE UM CORAÇÃO'
          : 'SEM CORAÇÕES RESTANTES',
        '#ff6a9a',
        3.2,
      );
      this.audio.sfx('gameover');
      this.game.slowMo(0.45, 1.1);
      return;
    }
    if (!this.downed[index]) return;

    // Reanimação cooperativa: ficar próximo do corpo por alguns segundos.
    const helper = this.players.find(
      (other, i) =>
        i !== index &&
        !other.dead &&
        Math.abs(other.x - p.x) < 125 &&
        Math.abs(other.centerY - p.centerY) < 130,
    );
    if (helper) {
      this.reviveProgress[index] = Math.min(1, this.reviveProgress[index] + dt / 2.2);
      if (this.reviveProgress[index] >= 1) this.revivePlayer(index, false);
    } else {
      this.reviveProgress[index] = Math.max(0, this.reviveProgress[index] - dt / 3);
    }
  }

  /** Centro horizontal da party (jogadores vivos), usado pela câmera e pelo fluxo. */
  private partyX(): number {
    const alive = this.players.filter((p) => !p.dead);
    const focus = alive.length > 0 ? alive : this.players;
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const p of focus) {
      min = Math.min(min, p.x);
      max = Math.max(max, p.x);
    }
    return (min + max) / 2;
  }

  private updateCamera(dt: number): void {
    if (this.locked) {
      this.camera.update(dt, this.camera.x);
      return;
    }
    const maxCam = Math.max(0, this.stage.width - this.viewW);
    // A câmera enquadra o grupo: metade do caminho entre os jogadores vivos.
    const target = clamp(this.partyX() - this.viewW * 0.5, 0, maxCam);
    this.camera.update(dt, target);
  }

  private updateFlow(dt: number): void {
    const anyAlive = this.players.some((p) => !p.dead);
    if (this.phase === 'bonus') {
      if (anyAlive) this.updateBonus(dt);
      return;
    }
    if (!anyAlive || this.phase !== 'combat') return;

    this.updatePressureEvents();
    const partyX = this.partyX();

    // Fim de onda.
    if (this.waveActive) {
      const alive = this.enemies.some((e) => !e.dead);
      if (!alive) this.finishWave();
      return;
    }

    // Câmara do Coração: evento raro, apenas no capítulo central de cada arco.
    if (
      this.stage.chapter === 3 &&
      !this.bonusTriggered &&
      this.waveIndex >= 2 &&
      this.waveIndex < this.stage.waves.length &&
      partyX >= this.bonusAt
    ) {
      this.startBonus();
      return;
    }

    // Próxima onda por proximidade do grupo.
    if (this.waveIndex < this.stage.waves.length) {
      const wave = this.stage.waves[this.waveIndex];
      if (partyX >= wave.at - 20) this.startWave(wave);
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
      if (partyX >= trigger) this.spawnBoss();
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
      // O combate terminou: a tensão sai e o tema do plano volta para o finale.
      this.audio.playMusic(this.stage.music);
      this.persistRecord();
      this.after(2.7, () => this.finishChapter());
    }
  }

  /** Conclui o capítulo: online host avisa e volta à sala; solo/local segue o fluxo normal. */
  private finishChapter(): void {
    if (this.onlineRole === 'host') {
      if (this.onlineFinished) return;
      this.onlineFinished = true;
      this.online?.stageClear(this.stage.id);
      this.game.applyStageClear(this.stage.id, this.player.charId);
      this.online?.lobbyReturn(this.stage.id, this.player.charId, true);
      this.game.setNotice('CAPÍTULO CONCLUÍDO — PROGRESSO SALVO', '#8df4a8');
      this.returnToOnlineRoom();
      return;
    }
    this.game.finishStage(this.stage.id, this.player.charId, this.isCoop);
  }

  private completeChapter(): void {
    if (this.phase === 'cleared') return;
    this.phase = 'cleared';
    this.waveActive = false;
    this.audio.playMusic(this.stage.music);
    this.addScore(1500);
    this.setBanner(
      'CAPÍTULO CONCLUÍDO',
      `${this.stage.subtitle.toUpperCase()} · RANK ${this.rank} · ${this.score} PTS`,
      '#8df4a8',
      3.2,
    );
    this.particles.ring(this.partyX(), this.stage.floor - 30, this.stage.palette.accent, 180, 0.7, 6);
    this.game.flash(this.stage.palette.accent, 0.16);
    this.audio.sfx('victory');
    this.persistRecord();
    this.after(2.4, () => this.finishChapter());
  }

  private startWave(wave: WaveDef): void {
    this.waveActive = true;
    this.waveSpawned = 0;
    this.waveStartTime = this.time;
    this.waveDamageStart = this.damageTaken;
    this.waveComboStart = this.maxCombo;
    this.waveKillStart = this.kills;
    this.discover(
      wave.spawns.map((group) => archiveCreatureId(this.stage.arc, group.kind)),
      'CRIATURA AVISTADA',
    );
    const maxCam = Math.max(0, this.stage.width - this.viewW);
    const lock = clamp(this.partyX() - this.viewW * 0.44, 0, maxCam);
    this.camera.setBounds(lock, lock);
    this.camera.snapTo(lock);

    let index = 0;
    for (const group of wave.spawns) {
      for (let i = 0; i < group.count; i++) {
        const side = index % 2 === 0 ? 1 : -1;
        const distance = 215 + Math.floor(index / 2) * 118 + Math.random() * 28;
        const x = clamp(
          this.partyX() + side * distance,
          this.camera.x + 92,
          this.camera.x + this.viewW - 92,
        );
        this.spawnEnemy(group.kind, x, group.elite);
        this.waveSpawned++;
        index++;
      }
    }

    this.setBanner(
      wave.label,
      `ONDA ${this.waveIndex + 1} / ${this.stage.waves.length} · ${this.waveSpawned} HOSTIS`,
      this.stage.palette.accent,
      2.8,
    );
    this.audio.sfx('wave');
    this.game.flash(this.stage.palette.accent, 0.07);
  }

  private finishWave(): void {
    const clearTime = Math.max(0, this.time - this.waveStartTime);
    const damage = Math.max(0, this.damageTaken - this.waveDamageStart);
    const combo = Math.max(0, this.maxCombo - this.waveComboStart);
    const kills = Math.max(0, this.kills - this.waveKillStart);
    const performance = clamp(
      this.pressure + combo * 1.2 + kills * 2 - damage * 1.8 - Math.max(0, clearTime - 18) * 1.2,
      0,
      100,
    );
    const waveRank = rankFromPressure(performance);

    this.addScore(350 + Math.round(this.pressure * 4) + combo * 20 + kills * 30);
    this.pressure = clamp(this.pressure + 5, 0, 100);
    this.waveActive = false;
    this.waveIndex++;
    this.camera.setBounds(0, Math.max(0, this.stage.width - this.viewW));
    // Cura menor: as vidas extras vêm da Câmara do Coração, não de ondas fáceis.
    this.healParty(this.player.maxHp * 0.07 + 2);
    // O fim da onda também levanta o parceiro caído.
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].dead && this.downed[i]) this.revivePlayer(i, false, true);
    }
    this.persistRecord();

    if (this.waveIndex >= this.stage.waves.length) {
      if (this.stage.boss) {
        this.setBanner('CAMINHO LIVRE', `RANK ${waveRank} · O CHEFE AGUARDA NO FIM DO PLANO`, rankColor(waveRank), 3.4);
      } else {
        this.completeChapter();
        return;
      }
    } else {
      this.setBanner(
        `ONDA LIMPA · RANK ${waveRank}`,
        `${kills} ABATES · ${combo} COMBO · AVANCE PARA O PRÓXIMO SELO`,
        rankColor(waveRank),
        2.8,
      );
    }
    this.audio.sfx('confirm');
  }

  private spawnBoss(): void {
    const bossId = this.stage.boss;
    if (!bossId) return;
    const maxCam = Math.max(0, this.stage.width - this.viewW);
    this.camera.setBounds(maxCam, maxCam);
    this.camera.snapTo(maxCam);
    const bossX = maxCam + this.viewW - 335;
    this.boss = new Boss(bossId, bossX, this.stage.floor);
    this.discover([archiveBossId(bossId)], 'CHEFE REVELADO');
    // Chefes ficam mais resistentes a cada arco, sem depender apenas de dano.
    const hpScale = 0.95 + (this.stage.arc - 1) * 0.07;
    this.boss.maxHp = Math.round(this.boss.maxHp * hpScale);
    this.boss.hp = this.boss.maxHp;
    this.bossWasIntro = true;
    this.bossCleared = false;
    this.game.save.bestCombo = Math.max(
      this.game.save.bestCombo,
      this.maxCombo,
      ...this.players.map((p) => p.bestCombo),
    );
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

  private get rank(): Rank {
    return rankFromPressure(this.pressure);
  }

  private addScore(amount: number): void {
    if (amount <= 0) return;
    this.score += Math.round(amount * (1 + this.pressure / 140));
  }

  private persistRecord(): void {
    const save = this.game.save;
    const bestCombo = Math.max(this.maxCombo, ...this.players.map((p) => p.bestCombo), ...this.players.map((p) => p.comboHits));
    save.hearts = this.hearts;
    save.bestCombo = Math.max(save.bestCombo, bestCombo);
    save.bestScore = Math.max(save.bestScore, this.score);
    if (rankValue(this.rank) > rankValue(save.bestRank)) save.bestRank = this.rank;
    this.game.persist();
  }

  private heartRewardCap(): number {
    // A Câmara é um desafio opcional, não uma fonte de vidas em série.
    return 1;
  }

  private revivePlayer(index: number, spendHeart: boolean, fromWave = false): void {
    const p = this.players[index];
    if (spendHeart) {
      this.hearts = Math.max(0, this.hearts - 1);
      this.game.save.hearts = this.hearts;
      this.game.persist();
    }
    p.dead = false;
    p.hp = Math.max(1, Math.round(p.maxHp * (fromWave ? 0.4 : 0.3)));
    p.invuln = 1.8;
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
    this.deathHandled[index] = false;
    this.downed[index] = false;
    this.reviveProgress[index] = 0;
    this.pressure = clamp(this.pressure - 6, 0, 100);

    // O coração limpa o entorno para a segunda chance ser justa.
    this.hazards = this.hazards.filter((h) => h.owner !== 'enemy');
    this.projectiles = this.projectiles.filter((pr) => pr.owner !== 'enemy');
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      if (Math.abs(enemy.x - p.x) > 220) continue;
      enemy.vx = Math.sign(enemy.x - p.x || 1) * 340;
      enemy.stunTime = Math.max(enemy.stunTime, 0.45);
    }

    if (spendHeart) {
      this.setBanner('CORAÇÃO CONSUMIDO', `${this.hearts} RESTANTE(S) · 30% DE VIDA · INVULNERÁVEL`, '#ff6a9a', 3.2);
      this.text('VIDA EXTRA', p.x, p.centerY - 70, '#ff9bb8', 22);
      this.particles.ring(p.x, p.centerY, '#ff6a9a', 170, 0.7, 5);
      this.game.flash('#ff6a9a', 0.22);
      this.game.slowMo(0.45, 0.45);
      this.audio.sfx('heal');
    } else {
      this.setBanner('PARCEIRO REANIMADO', `${p.def.name.toUpperCase()} VOLTOU À LUTA`, p.def.colors.accent, 3);
      this.text('REANIMADO', p.x, p.centerY - 70, p.def.colors.accent, 20);
      this.particles.ring(p.x, p.centerY, p.def.colors.accent, 130, 0.6, 4);
      this.game.flash(p.def.colors.accent, 0.14);
      this.audio.sfx('heal');
    }
  }

  private updatePressureEvents(): void {
    if (this.waveActive && !this.hunterSpawned && rankValue(this.rank) >= rankValue('S')) {
      this.spawnHunter();
    }
    if (
      (this.waveActive || this.boss !== null) &&
      this.pressure >= this.nextAnomalyPressure &&
      this.obstacles.filter((o) => o.temporary).length < 2
    ) {
      this.spawnAnomaly();
      this.nextAnomalyPressure = clamp(this.nextAnomalyPressure + 16, 58, 100);
    }
  }

  private spawnHunter(): void {
    const kinds: EnemyKind[] = ['hound', 'brute', 'seraph', 'shade', 'construct', 'echo'];
    const kind = kinds[clamp(this.stage.arc - 1, 0, kinds.length - 1)];
    const center = this.partyX();
    const side = center < this.camera.x + this.viewW / 2 ? 1 : -1;
    const x = clamp(
      center + side * 420,
      this.camera.x + 92,
      this.camera.x + this.viewW - 92,
    );
    this.hunter = this.spawnEnemy(kind, x, true);
    this.hunterSpawned = true;
    this.discover([archiveCreatureId(this.stage.arc, this.hunter.def.kind)], 'CAÇADOR REVELADO');
    this.pressure = clamp(this.pressure + 4, 0, 100);
    this.setBanner('CAÇADOR DO VÉU', 'SUA PERFORMANCE ATRAIU UMA AMEAÇA ANTIGA', '#ff6a9a', 3.2);
    this.audio.sfx('roar');
    this.game.flash('#ff6a9a', 0.14);
    this.shake(0.45);
  }

  private spawnAnomaly(): void {
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = clamp(
      this.partyX() + side * (240 + Math.random() * 150),
      this.camera.x + 120,
      this.camera.x + this.viewW - 120,
    );
    this.obstacles.push(
      new StageObstacle('fracture', x, this.stage.floor, this.stage, { temporary: true, life: 8 }),
    );
    this.discover([archiveRelicId('fracture')], 'ANOMALIA REVELADA');
    this.text('ANOMALIA', x, this.stage.floor - 132, '#ff5a3c', 15);
    this.game.flash('#ff5a3c', 0.06);
  }

  private startBonus(): void {
    if (this.bonusTriggered) return;
    this.bonusTriggered = true;
    this.phase = 'bonus';
    // A Câmara é um respiro: a tensão do combate dá lugar ao tema do plano.
    this.audio.playMusic(this.stage.music);
    this.waveActive = false;
    this.bonusTimer = this.bonusDuration;
    this.bonusCollected = 0;
    this.bonusHazardTimer = 1.15;
    this.bonusHazardCount = 0;
    this.bonusMotes = [];
    this.hazards = this.hazards.filter((h) => h.owner !== 'enemy');
    this.projectiles = this.projectiles.filter((p) => p.owner !== 'enemy');

    const maxCam = Math.max(0, this.stage.width - this.viewW);
    const lock = clamp(this.partyX() - this.viewW * 0.45, 0, maxCam);
    this.camera.setBounds(lock, lock);
    this.camera.snapTo(lock);

    for (let i = 0; i < this.bonusTotal; i++) {
      const x = clamp(
        this.camera.x + 190 + (this.viewW - 380) * (i / Math.max(1, this.bonusTotal - 1)),
        this.camera.x + 120,
        this.camera.x + this.viewW - 120,
      );
      // A fileira alta precisa ser alcançável até pelos heróis com um único pulo.
      const y = this.stage.floor - 120 - (i % 2) * 55;
      this.bonusMotes.push({ x, y, baseY: y, phase: Math.random() * Math.PI * 2 });
    }

    this.setBanner(
      'CÂMARA DO CORAÇÃO',
      `COLETE TODOS OS ${this.bonusTotal} CORAÇÕES · ${this.bonusRewardCap} VIDA EXTRA`,
      '#ff6a9a',
      3.8,
    );
    this.audio.sfx('confirm');
    this.game.flash('#ff6a9a', 0.14);
  }

  private updateBonus(dt: number): void {
    this.bonusTimer -= dt;
    this.bonusHazardTimer -= dt;
    if (this.bonusHazardTimer <= 0 && this.bonusTimer > 1.2 && this.bonusHazardCount < 10) {
      this.spawnBonusHazard();
      this.bonusHazardTimer = Math.max(0.7, 1.35 - this.stage.arc * 0.06);
    }

    for (const mote of this.bonusMotes) {
      mote.phase += dt;
      mote.y = mote.baseY + Math.sin(mote.phase * 2.2) * 7;
    }

    for (let i = this.bonusMotes.length - 1; i >= 0; i--) {
      const mote = this.bonusMotes[i];
      const collector = this.players.find(
        (p) => !p.dead && Math.hypot(p.x - mote.x, p.centerY - mote.y) <= 58,
      );
      if (!collector) continue;
      this.bonusMotes.splice(i, 1);
      this.bonusCollected++;
      this.addScore(120);
      this.pressure = clamp(this.pressure + 1.2, 0, 100);
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

    if (this.bonusMotes.length === 0 || this.bonusTimer <= 0) this.finishBonus();
  }

  private spawnBonusHazard(): void {
    const center = this.partyX();
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = clamp(
      center + side * (90 + Math.random() * 240),
      this.camera.x + 90,
      this.camera.x + this.viewW - 90,
    );
    this.spawnHazard({
      kind: 'explosion',
      x,
      y: this.stage.floor,
      radius: 90,
      duration: 0.1,
      damage: 10 + this.stage.arc * 2.2,
      owner: 'enemy',
      color: '#ff6a9a',
      accent: '#ffffff',
      delay: 0.85,
    });
    this.bonusHazardCount++;
  }

  private finishBonus(): void {
    if (this.phase !== 'bonus') return;
    const fullClear = this.bonusCollected >= this.bonusTotal;
    const reward = fullClear ? this.bonusRewardCap : 0;
    const before = this.hearts;
    this.hearts = Math.min(this.maxHearts, this.hearts + reward);
    const gained = this.hearts - before;
    this.addScore(200 + this.bonusCollected * 90);
    this.pressure = clamp(this.pressure + 2.5, 0, 100);
    this.phase = 'combat';
    this.audio.playCombatMusic(this.stage.arc);
    this.bonusMotes = [];
    this.bonusTimer = 0;
    this.hazards = this.hazards.filter((h) => h.owner !== 'enemy');
    for (const p of this.players) p.invuln = Math.max(p.invuln, 0.8);
    this.camera.setBounds(0, Math.max(0, this.stage.width - this.viewW));
    this.persistRecord();

    if (gained > 0) {
      this.setBanner(
        'CORAÇÃO CONQUISTADO',
        `${gained} VIDA(S) EXTRA(S) · ${this.bonusCollected}/${this.bonusTotal} COLETADOS`,
        '#ff6a9a',
        3.4,
      );
      this.particles.ring(this.partyX(), this.stage.floor - 60, '#ff6a9a', 190, 0.7, 6);
      this.game.flash('#ff6a9a', 0.18);
      this.audio.sfx('heal');
    } else if (fullClear && reward > 0) {
      this.setBanner('CORAÇÕES CHEIOS', 'A CÂMARA NÃO PÔDE AUMENTAR SUAS VIDAS', '#ff9bb8', 3.2);
      this.audio.sfx('ui');
    } else {
      this.setBanner(
        'CÂMARA INCOMPLETA',
        `${this.bonusCollected}/${this.bonusTotal} · COLETE TODOS PARA GANHAR ${this.bonusRewardCap} VIDA EXTRA`,
        '#9aa3b8',
        3.2,
      );
      this.audio.sfx('ui');
    }
  }

  // ------------------------------------------------------------ menus

  private openPause(): void {
    if (this.players.every((p) => p.dead)) return;
    this.paused = true;
    this.online?.setPaused(true);
    // Mouse e botão B voltam ao contexto de menu enquanto a pausa estiver aberta.
    this.input.setGameplayContext(false);
    // Os botões virtuais não devem ativar itens do menu de pausa.
    this.game.setTouchControlsVisible(false);
    const onlineHost = this.onlineRole === 'host';
    this.pauseMenu.setItems(
      [
        { id: 'resume', label: 'CONTINUAR', detail: 'ESC', accent: this.player.def.colors.accent },
        onlineHost
          ? { id: 'swap', label: 'VOLTAR À SALA ONLINE', detail: 'SEM SALVAR ESTE CAPÍTULO', accent: '#56e3ff' }
          : { id: 'swap', label: 'MAPA DA CAMPANHA', detail: 'ARCOS & CAPÍTULOS', accent: '#56e3ff' },
        { id: 'restart', label: 'REINICIAR CAPÍTULO', detail: onlineHost ? 'AVISA O CONVIDADO' : `CAP. ${this.stage.chapter}`, accent: '#ffd166' },
        onlineHost
          ? { id: 'title', label: 'FECHAR SALA', detail: 'O CONVIDADO SAI', accent: '#ff6a7a' }
          : { id: 'title', label: 'SAIR PARA O MENU', detail: 'PROGRESSO SALVO', accent: '#ff6a7a' },
      ],
      true,
    );
    this.audio.sfx('ui');
  }

  private resumePause(): void {
    if (!this.paused) return;
    this.paused = false;
    this.input.setGameplayContext(true);
    this.game.setTouchControlsVisible(true);
    this.online?.setPaused(false);
  }

  private updatePauseMenu(): void {
    if (
      this.input.pressed('pause') ||
      this.input.pressed('back') ||
      this.input.pressed('cancel') ||
      this.input.pressed('pause', 1) ||
      this.input.pressed('cancel', 1)
    ) {
      this.resumePause();
      this.audio.sfx('ui');
      return;
    }
    // Atalho de toque: o botão de casa no topo da pausa volta direto ao título.
    if (this.input.mouse.clicked && insideRect(this.pauseHomeRect, this.input.mouse.x, this.input.mouse.y)) {
      this.leaveToTitle();
      return;
    }
    const action =
      this.pauseMenu.update(this.input, this.audio) ?? this.pauseMenu.update(this.input, this.audio, 1);
    if (!action) return;
    switch (action) {
      case 'resume':
        this.resumePause();
        break;
      case 'swap':
        this.leaveToMap();
        break;
      case 'restart':
        this.restartScene();
        break;
      case 'title':
        this.leaveToTitle();
        break;
    }
  }

  private restartScene(): void {
    if (this.onlineRole === 'host' || this.onlineRole === 'guest') {
      this.performOnlineRestart();
      return;
    }
    if (this.isCoop) {
      this.game.transitionTo(() =>
        this.game.showCoopGameplay(this.stage.id, this.players[0].charId, this.players[1].charId),
      );
    } else {
      this.game.transitionTo(() => this.game.showGameplay(this.stage.id, this.players[0].charId));
    }
  }

  private leaveToMap(): void {
    if (this.onlineRole === 'host') {
      this.online?.lobbyReturn(this.stage.id, this.player.charId);
      this.returnToOnlineRoom();
      return;
    }
    if (this.onlineRole === 'guest') {
      this.leaveOnlineRoom();
      return;
    }
    if (this.isCoop) this.game.gotoMultiplayer();
    else this.game.gotoCharacterSelect(this.stage.id, this.player.charId);
  }

  private leaveToTitle(): void {
    if (this.online) {
      this.online.leave();
      this.game.dropOnlineSession();
    }
    this.game.gotoTitle();
  }

  private openGameOver(): void {
    this.gameOver = true;
    this.input.setGameplayContext(false);
    this.game.setTouchControlsVisible(false);
    this.persistRecord();
    const onlineHost = this.onlineRole === 'host';
    this.gameOverMenu.setItems(
      [
        { id: 'retry', label: 'TENTAR NOVAMENTE', detail: onlineHost ? 'REINICIA PARA A DUPLA' : `CAP. ${this.stage.chapter}`, accent: this.player.def.colors.accent },
        { id: 'swap', label: onlineHost ? 'VOLTAR À SALA ONLINE' : 'MAPA DA CAMPANHA', detail: onlineHost ? 'SEM SALVAR ESTE CAPÍTULO' : 'ARCOS & CAPÍTULOS', accent: '#56e3ff' },
        { id: 'title', label: onlineHost ? 'FECHAR SALA' : 'MENU PRINCIPAL', detail: onlineHost ? 'O CONVIDADO SAI' : 'ARQUIVO SALVO', accent: '#ffe6a3' },
      ],
      false,
    );
    this.audio.sfx('gameover');
    // O host não envia mais snapshots depois do game over; este é o último.
    this.online?.sendSnapshot(this.buildSnapshot());
  }

  private updateGameOverMenu(): void {
    if (this.input.pressed('back') || this.input.pressed('cancel')) {
      this.leaveToTitle();
      return;
    }
    if (this.input.mouse.clicked && insideRect(this.gameOverHomeRect, this.input.mouse.x, this.input.mouse.y)) {
      this.leaveToTitle();
      return;
    }
    const action =
      this.gameOverMenu.update(this.input, this.audio) ?? this.gameOverMenu.update(this.input, this.audio, 1);
    if (!action) return;
    switch (action) {
      case 'retry':
        if (this.onlineRole === 'guest') {
          this.online?.requestRestart();
          this.game.setNotice('PEDIDO DE REINÍCIO ENVIADO AO HOST', '#56e3ff');
        } else {
          this.restartScene();
        }
        break;
      case 'swap':
        if (this.onlineRole === 'guest') this.leaveOnlineRoom();
        else this.leaveToMap();
        break;
      case 'title':
        this.leaveToTitle();
        break;
    }
  }

  // ------------------------------------------------------------ auxiliares

  private setBanner(text: string, sub: string, color: string, max: number): void {
    this.banner = { text, sub, color, t: 0, max };
  }

  private updateBanner(dt: number): void {
    if (!this.banner) return;
    this.banner.t += dt;
    if (this.banner.t >= this.banner.max) this.banner = null;
  }

  private updateTimers(dt: number): void {
    if (!this.timers.length) return;
    const ready: Timer[] = [];
    for (const timer of this.timers) {
      timer.t -= dt;
      if (timer.t <= 0) ready.push(timer);
    }
    if (!ready.length) return;
    this.timers = this.timers.filter((t) => !ready.includes(t));
    for (const timer of ready) timer.fn();
  }

  private get waveLabel(): string {
    if (this.boss) return this.boss.def.name;
    if (this.waveIndex >= this.stage.waves.length) {
      return this.stage.boss ? 'RUMO AO CHEFE' : 'CAPÍTULO CONCLUÍDO';
    }
    return this.stage.waves[this.waveIndex]?.label ?? 'COMBATE';
  }

  // ------------------------------------------------------------ desenho

  draw(ctx: CanvasRenderingContext2D): void {
    const camX = this.camera.x + this.camera.offsetX;
    drawStageBackground(ctx, this.stage, camX, this.time);

    ctx.save();
    ctx.translate(-this.camera.x + this.camera.offsetX, this.camera.offsetY);

    for (const h of this.hazards) h.draw(ctx);
    for (const obstacle of this.obstacles) obstacle.draw(ctx, this.time, this.camera.x, this.viewW);

    const actors: Combatant[] = [...this.enemies];
    if (this.boss) actors.push(this.boss);
    actors.push(...this.players);
    actors.sort((a, b) => a.y - b.y);

    for (const actor of actors) {
      if (actor instanceof Boss) drawBoss(ctx, actor, this.time);
      else if (actor instanceof Enemy) drawEnemy(ctx, actor, this.time);
      else if (actor instanceof Player) drawPlayer(ctx, actor, this.time);
    }
    if (this.isCoop) this.drawPartyMarkers(ctx);

    for (const p of this.projectiles) p.draw(ctx);
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

    if (visualStyle.anime) this.drawAnimeScreen(ctx, camX);
    this.drawScreenPostFx(ctx);

    if (this.phase === 'bonus') {
      ctx.save();
      const vignette = ctx.createRadialGradient(
        this.viewW / 2,
        this.viewH / 2,
        120,
        this.viewW / 2,
        this.viewH / 2,
        this.viewW * 0.7,
      );
      vignette.addColorStop(0, 'rgba(255,106,154,0.02)');
      vignette.addColorStop(1, 'rgba(255,50,110,0.2)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
      ctx.restore();
    }

    this.drawArenaFrame(ctx);

    drawHud(
      ctx,
      {
        player: this.player,
        playerRevive: this.reviveProgress[0] ?? 0,
        partner: this.players[1] ?? null,
        partnerRevive: this.players[1] ? this.reviveProgress[1] ?? 0 : 0,
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
        bonus:
          this.phase === 'bonus'
            ? {
                time: Math.max(0, this.bonusTimer),
                maxTime: this.bonusDuration,
                collected: this.bonusCollected,
                total: this.bonusTotal,
                rewardCap: this.bonusRewardCap,
              }
            : null,
        touch: this.game.isTouchDevice,
      },
      this.time,
    );

    if (this.paused) this.drawPause(ctx);
    if (this.gameOver) this.drawGameOver(ctx);
  }

  /** Marcadores de party no mundo: anel de cor, etiqueta P1/P2 e reanimação. */
  private drawPartyMarkers(ctx: CanvasRenderingContext2D): void {
    const colors = ['#56e3ff', '#ffd166'];
    this.players.forEach((p, i) => {
      const color = colors[i] ?? '#ffffff';
      if (!p.dead) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 2, 30 * p.scale, 9, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      const downed = this.downed[i] && p.dead;
      const tag = downed ? `P${i + 1} CAÍDO` : `P${i + 1}`;
      const tagY = p.y - 146 * p.scale;
      const tagW = 22 + tag.length * 6.4;
      ctx.save();
      ctx.globalAlpha = p.dead ? 0.92 : 0.78;
      ctx.fillStyle = 'rgba(5,8,16,0.82)';
      roundRectPath(ctx, p.x - tagW / 2, tagY - 16, tagW, 20, 9);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(color, 0.7);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      label(ctx, tag, p.x, tagY - 1, 9.5, color, {
        align: 'center',
        font: FONTS.mono,
        weight: 700,
        spacing: 0.8,
        alpha: p.dead ? 0.85 : 0.95,
      });

      if (downed) {
        const barW = 128;
        const bx = p.x - barW / 2;
        const by = tagY + 10;
        const progress = this.reviveProgress[i];
        ctx.save();
        ctx.fillStyle = 'rgba(5,8,16,0.82)';
        roundRectPath(ctx, bx, by, barW, 8, 3);
        ctx.fill();
        ctx.fillStyle = color;
        if (progress > 0.001) {
          roundRectPath(ctx, bx, by, barW * progress, 8, 3);
          ctx.fill();
        }
        ctx.strokeStyle = hexToRgba(color, 0.45);
        ctx.lineWidth = 1;
        roundRectPath(ctx, bx + 0.5, by + 0.5, barW - 1, 7, 3);
        ctx.stroke();
        ctx.restore();
        label(
          ctx,
          progress > 0.001 ? 'REANIMANDO…' : 'APROXIME-SE PARA REANIMAR',
          p.x,
          by + 22,
          8.5,
          hexToRgba(color, 0.9),
          { align: 'center', font: FONTS.mono, spacing: 0.7 },
        );
      }
    });
  }

  /** Camada de pós-processamento do modo anime: linhas de velocidade, impacto e cor. */
  private drawAnimeScreen(ctx: CanvasRenderingContext2D, camX: number): void {
    const w = this.viewW;
    const h = this.viewH;
    const speed = Math.max(...this.players.map((p) => Math.abs(p.vx)));
    const dashing = this.players.some((p) => p.dashTime > 0);
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

  /** Pós-processamento de tela: vinheta dinâmica, tingimento, perigo e grão. */
  private drawScreenPostFx(ctx: CanvasRenderingContext2D): void {
    const w = this.viewW;
    const h = this.viewH;
    const hpDanger = Math.max(...this.players.map((p) => (p.dead ? 1 : clamp(1 - p.hpRatio, 0, 1))));
    const bossDanger = this.boss ? clamp(this.boss.phaseIndex / 2, 0, 1) : 0;
    const danger = clamp(hpDanger * 0.7 + bossDanger * 0.45, 0, 1);
    const pressure = clamp(this.pressure / 100, 0, 1);
    const tint = this.phase === 'bonus' ? '#ff6a9a' : this.boss ? this.boss.def.colors.accent : this.stage.palette.accent;

    // Vinheta.
    const vg = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.3, w / 2, h * 0.5, h * 0.9);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.62, `rgba(2,3,9,${0.1 + danger * 0.08})`);
    vg.addColorStop(1, `rgba(0,0,0,${0.46 + danger * 0.2})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);

    // Tingimento de borda pela paleta da fase/chefe.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const sideW = 150 + pressure * 60;
    const left = ctx.createLinearGradient(0, 0, sideW, 0);
    left.addColorStop(0, hexToRgba(tint, 0.07 + pressure * 0.05));
    left.addColorStop(1, hexToRgba(tint, 0));
    ctx.fillStyle = left;
    ctx.fillRect(0, 0, sideW, h);
    const right = ctx.createLinearGradient(w, 0, w - sideW, 0);
    right.addColorStop(0, hexToRgba(tint, 0.07 + pressure * 0.05));
    right.addColorStop(1, hexToRgba(tint, 0));
    ctx.fillStyle = right;
    ctx.fillRect(w - sideW, 0, sideW, h);
    const top = ctx.createLinearGradient(0, 0, 0, 110);
    top.addColorStop(0, hexToRgba(tint, 0.05));
    top.addColorStop(1, hexToRgba(tint, 0));
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, w, 110);
    ctx.restore();

    // Pulso vermelho de perigo.
    if (danger > 0.15) {
      const pulse = 0.55 + Math.sin(this.time * (3.2 + danger * 2.4)) * 0.35;
      const red = ctx.createRadialGradient(w / 2, h / 2, h * 0.36, w / 2, h / 2, h * 0.82);
      red.addColorStop(0, 'rgba(255,20,46,0)');
      red.addColorStop(0.75, `rgba(255,20,46,${0.05 * danger * pulse})`);
      red.addColorStop(1, `rgba(255,20,46,${0.28 * danger * pulse})`);
      ctx.fillStyle = red;
      ctx.fillRect(0, 0, w, h);
    }

    // Grão de filme procedural.
    const grain = getGrainPattern(ctx);
    if (grain) {
      ctx.save();
      ctx.globalAlpha = 0.34 + pressure * 0.12;
      ctx.translate(-((this.time * 43) % 128), -((this.time * 71) % 128));
      ctx.fillStyle = grain;
      ctx.fillRect(0, 0, w + 128, h + 128);
      ctx.restore();
    }
  }

  private drawArenaFrame(ctx: CanvasRenderingContext2D): void {
    const locked = this.waveActive || this.boss !== null || this.phase === 'bonus';
    if (!locked) return;
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

  private drawPause(ctx: CanvasRenderingContext2D): void {
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

    // Atalho de toque para voltar ao título sem procurar o item no menu.
    this.pauseHomeRect = { x: x + w - 144, y: y + 24, w: 112, h: 34 };
    panel(ctx, this.pauseHomeRect.x, this.pauseHomeRect.y, this.pauseHomeRect.w, this.pauseHomeRect.h, {
      fill: 'rgba(255,106,122,0.1)',
      border: 'rgba(255,106,122,0.42)',
      r: 5,
    });
    label(ctx, '⌂ MENU', this.pauseHomeRect.x + this.pauseHomeRect.w / 2, this.pauseHomeRect.y + 22, 10, '#ffb3bd', {
      align: 'center',
      font: FONTS.mono,
      spacing: 1.1,
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
    const partner = this.players[1];
    const partnerLine = partner
      ? `   ·   P2 ${partner.dead ? 'CAÍDO' : `${Math.ceil(partner.hp)}/${partner.maxHp}`}`
      : '';
    label(ctx, `P1 ${Math.ceil(p.hp)} / ${p.maxHp}${partnerLine}   ·   ABATES ${this.kills}`, x + 142, y + 157, 10.5, 'rgba(200,208,228,0.7)', {
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
          ['⚔', 'LEVE'],
          ['✹', 'PESADO'],
          ['»', 'DASH'],
          ['✦', 'ESPECIAL'],
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
    const pauseHint = this.game.isTouchDevice
      ? 'TOQUE NOS ITENS · ⌂ MENU ACIMA'
      : this.onlineRole === 'host'
        ? 'ESC / BACKSPACE FECHAR · P2 É O CONVIDADO'
        : this.onlineRole === 'guest'
          ? 'ESC / BACKSPACE FECHAR · VOCÊ CONTROLA O P2'
          : 'ESC / BACKSPACE FECHAR · P2 USA O 2º CONTROLE';
    label(ctx, pauseHint, x + w - 32, y + h - 18, 9, 'rgba(170,178,200,0.42)', {
      align: 'right',
      font: FONTS.mono,
      spacing: 1,
    });
    ctx.restore();
  }

  private drawGameOver(ctx: CanvasRenderingContext2D): void {
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

    this.gameOverHomeRect = { x: x + w - 144, y: y + 24, w: 112, h: 34 };
    panel(ctx, this.gameOverHomeRect.x, this.gameOverHomeRect.y, this.gameOverHomeRect.w, this.gameOverHomeRect.h, {
      fill: 'rgba(255,209,102,0.08)',
      border: 'rgba(255,209,102,0.38)',
      r: 5,
    });
    label(ctx, '⌂ MENU', this.gameOverHomeRect.x + this.gameOverHomeRect.w / 2, this.gameOverHomeRect.y + 22, 10, '#ffe6a3', {
      align: 'center',
      font: FONTS.mono,
      spacing: 1.1,
    });

    const names = this.players.map((p) => p.def.name.toUpperCase()).join('  ·  ');
    label(ctx, this.isCoop ? 'A PARTY CAIU' : 'O VÉU O DEVOROU', this.viewW / 2, y + 76, 40, '#ffe7eb', {
      align: 'center',
      weight: 800,
      spacing: 4,
      glow: accent,
      outline: 'rgba(0,0,0,0.6)',
      outlineWidth: 4,
    });
    label(ctx, `${names} CAÍRAM NO ${this.stage.subtitle.toUpperCase()} — ${this.stage.name.toUpperCase()}`, this.viewW / 2, y + 100, 10.5, hexToRgba(accent, 0.9), {
      align: 'center',
      font: FONTS.mono,
      spacing: 1.2,
    });

    const stats = [
      ['PONTOS', String(this.score).padStart(6, '0')],
      ['RANK', this.rank],
      ['ABATES', String(this.kills)],
      ['COMBO', String(Math.max(this.maxCombo, ...this.players.map((p) => p.bestCombo))).padStart(2, '0')],
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

    label(
      ctx,
      this.score > this.record
        ? 'NOVO RECORDE DE PONTOS'
        : `RECORDE ${String(this.game.save.bestScore).padStart(6, '0')} · RANK ${this.game.save.bestRank}`,
      this.viewW / 2,
      y + h - 62,
      10,
      this.score > this.record ? '#ffd166' : 'rgba(190,198,220,0.55)',
      {
        align: 'center',
        font: FONTS.mono,
        spacing: 1.1,
        glow: this.score > this.record ? 'rgba(255,209,102,0.5)' : undefined,
      },
    );
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
