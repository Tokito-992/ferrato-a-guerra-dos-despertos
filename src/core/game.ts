/** Núcleo do jogo: loop, troca de cenas, transições, hitstop e persistência. */

import type { CharacterId } from '../data/characters.js';
import { CHARACTERS } from '../data/characters.js';
import { getStage, MAX_STAGE } from '../data/stages.js';
import { STORY } from '../data/story.js';
import { AudioEngine } from './audio.js';
import { Input } from './input.js';
import type { Action } from './input.js';
import { ParticleSystem } from './particles.js';
import { loadSave, writeSave } from './save.js';
import type { SaveData } from './save.js';
import { canFullscreen, toggleFullscreen } from './fullscreen.js';
import { clamp, hexToRgba } from './math.js';
import { FONTS, label, panel, roundRectPath } from '../render/theme.js';
import { TitleScene } from '../scenes/title.js';
import { CharacterSelectScene } from '../scenes/characterSelect.js';
import { GameplayScene } from '../scenes/gameplay.js';
import { StoryScene } from '../scenes/story.js';
import { VictoryScene } from '../scenes/victory.js';
import { CreditsScene } from '../scenes/credits.js';
import { SettingsScene } from '../scenes/settings.js';
import { TutorialScene } from '../scenes/tutorial.js';

export interface Scene {
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
  enter?(): void;
  exit?(): void;
  /** Posição vertical do aviso persistente; combate sobe o aviso para não cobrir o chefe. */
  noticeY?: number;
}

export interface GameNotice {
  text: string;
  color: string;
  t: number;
  max: number;
}

interface FadeState {
  alpha: number;
  phase: -1 | 0 | 1;
  duration: number;
  color: string;
  callback: (() => void) | null;
}

export class Game {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly input: Input;
  readonly audio: AudioEngine;
  save: SaveData;

  readonly width = 1280;
  readonly height = 720;

  scene!: Scene;
  time = 0;
  private sceneTime = 0;

  private hitStopTimer = 0;
  private slowTimer = 0;
  private slowScale = 1;

  private flashColor = '#ffffff';
  private flashAlpha = 0;

  private fade: FadeState = {
    alpha: 0,
    phase: 0,
    duration: 0.32,
    color: '#04050a',
    callback: null,
  };

  notice: GameNotice | null = null;
  uiParticles = new ParticleSystem();

  private lastTimestamp = 0;
  private started = false;
  private finishing = false;
  private touchControls: HTMLElement | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D não disponível neste navegador.');
    this.ctx = ctx;
    this.audio = new AudioEngine();
    this.input = new Input(canvas);
    this.save = loadSave();
    this.audio.setMuted(this.save.muted);
    this.input.onFirstGesture = () => {
      this.audio.init();
      this.audio.setMuted(this.save.muted);
    };
    this.setupTouchControls();
    this.applyTouchSettings();
  }

  /** Aplica as preferências de layout dos controles de toque. */
  applyTouchSettings(): void {
    document.body.classList.toggle('touch-lefty', this.save.touchLayout === 'lefty');
    document.body.classList.toggle('touch-dock-top', this.save.touchDock === 'top');
  }

  get isTouchDevice(): boolean {
    return this.input.touchMode;
  }

  /** Botões de toque independentes do canvas; aparecem apenas em combate. */
  private setupTouchControls(): void {
    if (!this.input.touchMode) return;
    document.body.classList.add('touch-device');

    const wrap = document.createElement('div');
    wrap.id = 'touch-controls';
    wrap.setAttribute('aria-label', 'Controles de toque');

    const left = document.createElement('div');
    left.className = 'touch-cluster touch-cluster-left';
    const right = document.createElement('div');
    right.className = 'touch-cluster touch-cluster-right';

    const makeButton = (
      action: Action,
      icon: string,
      extra = '',
      label = '',
      ariaLabel = '',
    ): HTMLButtonElement => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `touch-btn${extra ? ` ${extra}` : ''}`;
      button.dataset.action = action;
      button.setAttribute('aria-label', ariaLabel || label || action);
      const iconEl = document.createElement('span');
      iconEl.className = 'touch-icon';
      iconEl.textContent = icon;
      iconEl.setAttribute('aria-hidden', 'true');
      button.append(iconEl);
      if (label) {
        const labelEl = document.createElement('span');
        labelEl.className = 'touch-label';
        labelEl.textContent = label;
        labelEl.setAttribute('aria-hidden', 'true');
        button.append(labelEl);
      }
      const press = (event: PointerEvent): void => {
        event.preventDefault();
        event.stopPropagation();
        this.input.setVirtual(action, true);
        try {
          button.setPointerCapture(event.pointerId);
        } catch {
          // Alguns navegadores móveis não expõem captura para todos os pointers.
        }
      };
      const release = (event: PointerEvent): void => {
        event.preventDefault();
        event.stopPropagation();
        this.input.setVirtual(action, false);
      };
      button.addEventListener('pointerdown', press, { passive: false });
      button.addEventListener('pointerup', release, { passive: false });
      button.addEventListener('pointercancel', release, { passive: false });
      button.addEventListener('lostpointercapture', release);
      button.addEventListener('contextmenu', (event) => event.preventDefault());
      return button;
    };

    left.append(
      makeButton('left', '◀', 'touch-move', '', 'Mover para a esquerda'),
      makeButton('right', '▶', 'touch-move', '', 'Mover para a direita'),
    );
    right.append(
      makeButton('jump', '⤒', 'touch-jump', 'PULAR', 'Pular'),
      makeButton('attack', '⚔', 'touch-action', 'LEVE', 'Ataque leve'),
      makeButton('heavy', '✹', 'touch-action', 'PESADO', 'Ataque pesado'),
      makeButton('dash', '»', 'touch-action', 'DASH', 'Dash'),
      makeButton('ability', '✦', 'touch-ability', 'ESPECIAL', 'Habilidade especial'),
    );

    const pause = document.createElement('div');
    pause.className = 'touch-cluster touch-cluster-pause';
    pause.append(makeButton('pause', 'Ⅱ', 'touch-pause', '', 'Pausa'));

    if (canFullscreen()) {
      const fullscreen = document.createElement('button');
      fullscreen.type = 'button';
      fullscreen.className = 'touch-btn touch-fullscreen';
      fullscreen.textContent = '⛶';
      fullscreen.setAttribute('aria-label', 'Tela cheia');
      fullscreen.title = 'Tela cheia';
      fullscreen.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggleFullscreen();
      });
      fullscreen.addEventListener('contextmenu', (event) => event.preventDefault());
      pause.append(fullscreen);
    }

    wrap.append(left, right, pause);
    (document.getElementById('frame') ?? document.body).appendChild(wrap);
    this.touchControls = wrap;
  }

  setTouchControlsVisible(visible: boolean): void {
    if (!this.touchControls) return;
    document.body.classList.toggle('touch-gameplay', visible);
    if (!visible) this.input.releaseAllVirtual();
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.showTitle();
    this.lastTimestamp = performance.now();
    requestAnimationFrame(this.frame);
  }

  // ------------------------------------------------------------- navegação

  gotoTitle(): void {
    this.transitionTo(() => this.showTitle());
  }

  showTitle(): void {
    this.setScene(new TitleScene(this));
  }

  gotoCharacterSelect(stageId: number, selected?: string): void {
    this.transitionTo(() => this.showCharacterSelect(stageId, selected));
  }

  showCharacterSelect(stageId: number, selected?: string): void {
    this.setScene(new CharacterSelectScene(this, stageId, selected));
  }

  /** Inicia um capítulo (com cutscene de abertura, se houver). */
  startStage(stageId: number, charId: string, skipStory = false): void {
    const stage = getStage(stageId);
    // Cada arco pertence ao seu Desperto: a narrativa e as habilidades contam a
    // mesma história. O parâmetro fica por compatibilidade com chamadas antigas.
    const requested = (charId in CHARACTERS ? charId : stage.character) as CharacterId;
    const id = requested === stage.character ? requested : stage.character;
    this.save.selected = id;
    this.finishing = false;
    this.transitionTo(() => {
      const go = () => this.showGameplay(stage.id, id);
      const intro = STORY[stage.id]?.intro;
      if (!skipStory && intro && intro.length > 0) {
        this.setScene(new StoryScene(this, stage, 'intro', go));
      } else {
        go();
      }
    });
  }

  showGameplay(stageId: number, charId: CharacterId): void {
    this.setScene(new GameplayScene(this, getStage(stageId), charId));
  }

  /** Chamado pela cena de combate quando o chefe cai. */
  finishStage(stageId: number, charId: CharacterId): void {
    if (this.finishing) return;
    this.finishing = true;
    const stage = getStage(stageId);
    const id = charId in CHARACTERS ? charId : 'ravi';

    if (!this.save.cleared.includes(stageId)) this.save.cleared.push(stageId);
    if (!this.save.unlocked.includes(id)) this.save.unlocked.push(id);
    this.save.selected = id;
    this.save.bestCombo = Math.max(this.save.bestCombo, 0);

    let nextChar: CharacterId | null = null;
    if (stageId < MAX_STAGE) {
      const next = getStage(stageId + 1);
      nextChar = next.character;
      if (!this.save.unlocked.includes(nextChar)) {
        this.save.unlocked.push(nextChar);
        const c = CHARACTERS[nextChar];
        this.setNotice(`${c.name.toUpperCase()} DESPERTOU — ${c.epithet.toUpperCase()}`, c.colors.accent);
      }
      this.save.maxStage = Math.max(this.save.maxStage, Math.min(MAX_STAGE, stageId + 1));
      this.save.selected = nextChar;
    }
    writeSave(this.save);

    const outro = STORY[stageId]?.outro;
    const finish = () => {
      if (stageId >= MAX_STAGE) {
        this.showVictory(id);
      } else {
        this.showCharacterSelect(stageId + 1, nextChar ?? undefined);
      }
    };

    this.transitionTo(() => {
      if (outro && outro.length > 0) {
        this.setScene(new StoryScene(this, stage, 'outro', finish));
      } else {
        finish();
      }
    });
  }

  showVictory(charId: CharacterId): void {
    this.setScene(new VictoryScene(this, charId));
  }

  gotoTutorialFreeStage(): void {
    this.gotoCharacterSelect(this.save.maxStage);
  }

  gotoCredits(): void {
    this.transitionTo(() => this.setScene(new CreditsScene(this)));
  }

  gotoSettings(): void {
    this.transitionTo(() => this.setScene(new SettingsScene(this)));
  }

  gotoTutorial(onDone: () => void): void {
    this.transitionTo(() => this.setScene(new TutorialScene(this, onDone)));
  }

  // ------------------------------------------------------------- cenas

  setScene(scene: Scene): void {
    if (this.scene) this.scene.exit?.();
    this.scene = scene;
    this.sceneTime = 0;
    this.hitStopTimer = 0;
    this.slowTimer = 0;
    this.slowScale = 1;
    this.flashAlpha = 0;
    this.input.clear();
    this.uiParticles.clear();
    scene.enter?.();
  }

  transitionTo(callback: () => void, color = '#04050a', duration = 0.34): void {
    this.fade.phase = 1;
    this.fade.alpha = 0;
    this.fade.duration = duration;
    this.fade.color = color;
    this.fade.callback = callback;
  }

  setNotice(text: string, color = '#ff8a3d'): void {
    this.notice = { text, color, t: 0, max: 5.5 };
  }

  persist(): void {
    writeSave(this.save);
  }

  recordDeath(): void {
    this.save.deaths++;
    this.persist();
  }

  recordKill(): void {
    this.save.kills++;
    this.persist();
  }

  // ------------------------------------------------------------- efeitos globais

  flash(color: string, alpha: number): void {
    this.flashColor = color;
    this.flashAlpha = Math.max(this.flashAlpha, clamp(alpha, 0, 0.85));
  }

  hitStop(seconds: number): void {
    this.hitStopTimer = Math.max(this.hitStopTimer, seconds);
  }

  slowMo(scale: number, duration: number): void {
    this.slowScale = clamp(scale, 0.12, 1);
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  get hitStopped(): boolean {
    return this.hitStopTimer > 0;
  }

  // ------------------------------------------------------------- loop

  private frame = (timestamp: number): void => {
    const raw = clamp((timestamp - this.lastTimestamp) / 1000, 0, 0.05);
    this.lastTimestamp = timestamp;
    this.time += raw;
    this.sceneTime += raw;

    this.update(raw);
    this.draw();

    this.input.endFrame();
    requestAnimationFrame(this.frame);
  };

  private update(dt: number): void {
    // Transições de cena.
    if (this.fade.phase === 1) {
      this.fade.alpha = Math.min(1, this.fade.alpha + dt / this.fade.duration);
      if (this.fade.alpha >= 1) {
        const cb = this.fade.callback;
        this.fade.callback = null;
        this.fade.phase = -1;
        if (cb) cb();
      }
    } else if (this.fade.phase === -1) {
      this.fade.alpha = Math.max(0, this.fade.alpha - dt / (this.fade.duration * 1.15));
      if (this.fade.alpha <= 0) this.fade.phase = 0;
    }

    // Flash de tela.
    this.flashAlpha = Math.max(0, this.flashAlpha - dt * (1.6 + this.flashAlpha * 2.4));

    // Aviso persistente.
    if (this.notice) {
      this.notice.t += dt;
      if (this.notice.t >= this.notice.max) this.notice = null;
    }

    this.uiParticles.update(dt);

    if (this.input.pressed('mute')) {
      const muted = this.audio.toggleMuted();
      this.save.muted = muted;
      this.persist();
      this.setNotice(muted ? 'ÁUDIO SILENCIADO' : 'ÁUDIO ATIVADO', '#56e3ff');
      this.audio.sfx('ui');
    }

    if (this.hitStopTimer > 0) {
      this.hitStopTimer = Math.max(0, this.hitStopTimer - dt);
      return;
    }

    let scaled = dt;
    if (this.slowTimer > 0) {
      this.slowTimer = Math.max(0, this.slowTimer - dt);
      scaled = dt * this.slowScale;
    }

    this.scene.update(scaled);
  }

  private draw(): void {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, this.width, this.height);

    this.scene.draw(ctx);
    this.uiParticles.draw(ctx, true);

    // Flash.
    if (this.flashAlpha > 0.005) {
      ctx.save();
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    this.drawNotice(ctx);

    // Fade de cena.
    if (this.fade.alpha > 0.001) {
      ctx.save();
      ctx.globalAlpha = this.fade.alpha;
      ctx.fillStyle = this.fade.color;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }
  }

  private drawNotice(ctx: CanvasRenderingContext2D): void {
    const n = this.notice;
    if (!n) return;
    const inA = clamp(n.t / 0.25, 0, 1);
    const outA = clamp((n.max - n.t) / 0.5, 0, 1);
    const alpha = Math.min(inA, outA);
    if (alpha <= 0.01) return;
    const text = n.text;
    ctx.save();
    ctx.font = `700 13px ${FONTS.mono}`;
    const w = clamp(ctx.measureText(text).width + 44, 260, 720);
    const x = this.width / 2 - w / 2;
    const y = this.scene.noticeY ?? 660;
    ctx.globalAlpha = alpha;
    panel(ctx, x, y, w, 34, {
      fill: 'rgba(5,8,16,0.9)',
      border: hexToRgba(n.color, 0.5),
      glow: hexToRgba(n.color, 0.25),
      r: 3,
    });
    ctx.fillStyle = n.color;
    ctx.fillRect(x, y + 6, 3, 22);
    label(ctx, text, this.width / 2, y + 22, 12, '#eef2ff', {
      align: 'center',
      font: FONTS.mono,
      weight: 700,
      spacing: 1.4,
    });
    ctx.restore();
  }

  /** Utilizado pelas cenas para desenhar uma pílula de tecla. */
  drawKey(ctx: CanvasRenderingContext2D, x: number, y: number, key: string, color = '#56e3ff'): void {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRectPath(ctx, x, y, 24, 20, 3);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(color, 0.5);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    label(ctx, key, x + 12, y + 14, 10, color, { align: 'center', weight: 800, font: FONTS.mono });
  }

  get timeInScene(): number {
    return this.sceneTime;
  }
}
