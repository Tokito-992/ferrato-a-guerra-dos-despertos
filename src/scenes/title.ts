/**
 * Tela-título: o Véu observa enquanto o jogador escolhe o caminho.
 *
 * Composição em três zonas — identidade/ações à esquerda, arquivo da campanha
 * à direita e rodapé de estado — para separar leitura, navegação e progresso.
 */

import type { Game, Scene } from '../core/game.js';
import { TITLE_THEME_INDEX } from '../core/audio.js';
import { CHARACTER_ORDER, CHARACTERS } from '../data/characters.js';
import type { CharacterId } from '../data/characters.js';
import { ARC_COUNT, CHAPTERS_PER_ARC, getArcStages, getStage, MAX_STAGE } from '../data/stages.js';
import { TITLE_QUOTE } from '../data/story.js';
import { archiveTotalProgress } from '../data/archive.js';
import { clamp, easeOutCubic, hexToRgba, TAU } from '../core/math.js';
import { drawTitleBackground } from '../render/backgrounds.js';
import { drawCharacterPortrait } from '../render/characters.js';
import { FONTS, glow, label, panel, roundRectPath } from '../render/theme.js';
import { Menu } from '../ui/menu.js';
import type { MenuItem } from '../ui/menu.js';

/** Anel arcano usado como marca d'água e como emblema de canto. */
function drawSigil(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  time: number,
  colorA: string,
  colorB: string,
  alpha: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  const baseAlpha = ctx.globalAlpha * alpha;
  ctx.globalAlpha = baseAlpha;
  ctx.globalCompositeOperation = 'lighter';
  ctx.rotate(time * 0.045);
  ctx.strokeStyle = colorA;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([2, 11]);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);

  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU;
    const long = i % 3 === 0;
    ctx.strokeStyle = i % 2 === 0 ? colorA : colorB;
    ctx.globalAlpha = baseAlpha * (long ? 0.85 : 0.4);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * radius * (long ? 0.84 : 0.9), Math.sin(a) * radius * (long ? 0.84 : 0.9));
    ctx.lineTo(Math.cos(a) * radius * 0.97, Math.sin(a) * radius * 0.97);
    ctx.stroke();
  }

  ctx.globalAlpha = baseAlpha;
  ctx.rotate(-time * 0.085);
  ctx.strokeStyle = colorB;
  ctx.lineWidth = 1;
  for (let i = 0; i < 2; i++) {
    const r = radius * (0.46 + i * 0.16);
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU + Math.PI / 4;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }

  ctx.globalAlpha = baseAlpha * 0.9;
  ctx.strokeStyle = colorA;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.31, -0.4, 1.7);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.31, Math.PI - 0.4, Math.PI + 1.7);
  ctx.stroke();
  ctx.restore();
}

/** Cantos em L para dar acabamento de HUD aos painéis. */
function drawBrackets(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  size = 13,
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + size);
  ctx.lineTo(x + 2, y + 2);
  ctx.lineTo(x + size, y + 2);
  ctx.moveTo(x + w - size, y + h - 2);
  ctx.lineTo(x + w - 2, y + h - 2);
  ctx.lineTo(x + w - 2, y + h - size);
  ctx.stroke();
  ctx.restore();
}

/** Barra de 42 segmentos, agrupada por arco. */
function drawProgressPips(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  cleared: Set<number>,
  current: number,
  time: number,
): void {
  const gap = 2.2;
  const groupGap = 6;
  const segW = (w - gap * (MAX_STAGE - 1) - groupGap * (ARC_COUNT - 1)) / MAX_STAGE;
  let cx = x;
  for (let stage = 1; stage <= MAX_STAGE; stage++) {
    const arc = Math.ceil(stage / CHAPTERS_PER_ARC);
    const hero = CHARACTER_ORDER[arc - 1];
    const col = CHARACTERS[hero].colors.accent;
    const done = cleared.has(stage);
    const active = stage === current && !done;
    ctx.save();
    if (active) {
      const pulse = 0.55 + Math.sin(time * 3.4) * 0.3;
      ctx.shadowColor = col;
      ctx.shadowBlur = 9;
      ctx.fillStyle = hexToRgba(col, pulse);
    } else {
      ctx.fillStyle = done ? hexToRgba(col, 0.82) : 'rgba(255,255,255,0.075)';
    }
    roundRectPath(ctx, cx, y, segW, 6, 1.6);
    ctx.fill();
    ctx.restore();
    cx += segW + gap;
    if (stage % CHAPTERS_PER_ARC === 0) cx += groupGap;
  }
}

/** Medalhão de herói com retrato, estado selado e seleção. */
function drawMedallion(
  ctx: CanvasRenderingContext2D,
  id: CharacterId,
  cx: number,
  cy: number,
  radius: number,
  unlocked: boolean,
  selected: boolean,
  time: number,
): void {
  const def = CHARACTERS[id];
  const col = unlocked ? def.colors.accent : '#45455a';
  if (unlocked) glow(ctx, cx, cy, radius * 1.8, def.colors.aura, selected ? 0.24 : 0.09);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, TAU);
  ctx.fillStyle = '#070912';
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 1.5, 0, TAU);
  ctx.clip();
  drawCharacterPortrait(ctx, def, cx, cy + radius * 0.06, radius * 1.62, time, !unlocked);
  ctx.restore();

  ctx.strokeStyle = hexToRgba(col, unlocked ? (selected ? 0.95 : 0.55) : 0.22);
  ctx.lineWidth = selected ? 2.2 : 1;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, TAU);
  ctx.stroke();

  if (selected) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 0.4);
    ctx.strokeStyle = hexToRgba(col, 0.6);
    ctx.setLineDash([3, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 4.5, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  if (!unlocked) {
    const lx = cx + radius * 0.62;
    const ly = cy + radius * 0.62;
    ctx.fillStyle = 'rgba(4,6,12,0.94)';
    ctx.beginPath();
    ctx.arc(lx, ly, 8, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(190,196,220,0.45)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(lx, ly - 1.5, 3.1, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = 'rgba(190,196,220,0.5)';
    ctx.fillRect(lx - 4, ly - 1, 8, 5.5);
  }
  ctx.restore();
}

export class TitleScene implements Scene {
  private menu: Menu;
  private t = 0;
  private pulse = 0;
  private intro = 0;

  constructor(private readonly game: Game) {
    this.menu = new Menu([]);
    this.buildMenu();
  }

  enter(): void {
    this.game.audio.playMusic(TITLE_THEME_INDEX);
    this.game.audio.playAmbience('cosmic');
    this.intro = 0;
    this.buildMenu();
  }

  /** Atualiza o menu sem perder o item selecionado (usado pela sincronização). */
  refreshMenu(): void {
    this.buildMenu(true);
  }

  private buildMenu(keepIndex = false): void {
    const save = this.game.save;
    const stage = getStage(save.maxStage);
    const hasProgress = save.cleared.length > 0;
    const arcsDone = Array.from({ length: ARC_COUNT }, (_, index) => index + 1).filter((arc) =>
      getArcStages(arc).every((chapter) => save.cleared.includes(chapter.id)),
    ).length;
    const archive = archiveTotalProgress(save);
    const items: MenuItem[] = [
      { id: 'new', badge: '01', label: 'NOVO JOGO', detail: 'ARCO I · CAP. 1', accent: '#ff8a3d', height: 46 },
      {
        id: 'continue',
        badge: '02',
        label: 'CONTINUAR',
        detail: hasProgress ? stage.subtitle.toUpperCase() : 'SEM PROGRESSO',
        disabled: !hasProgress,
        accent: '#56e3ff',
        height: 46,
      },
      {
        id: 'select',
        badge: '03',
        label: 'DESPERTOS & ARCOS',
        detail: `${arcsDone} / ${ARC_COUNT} ARCOS`,
        accent: '#b48bff',
        height: 46,
      },
      {
        id: 'archive',
        badge: '04',
        label: 'ARQUIVO DO VÉU',
        detail: `${archive.unlocked} / ${archive.total} REGISTROS`,
        accent: '#ffd166',
        height: 46,
      },
      { id: 'settings', badge: '05', label: 'CONFIGURAÇÕES', detail: 'CONTROLES · ÁUDIO · TELA', accent: '#56e3ff', height: 46 },
    ];

    const cloud = this.game.cloudSnapshot;
    if (cloud.configured) {
      const detail = !cloud.signedIn
        ? 'ENTRAR OU CRIAR CONTA'
        : cloud.conflict
          ? 'ESCOLHA O SAVE'
          : cloud.cloudNewer
            ? 'NUVEM MAIS RECENTE'
            : cloud.lastError
              ? 'VER CONTA'
              : 'NUVEM CONECTADA';
      items.push({
        id: 'account',
        badge: String(items.length + 1).padStart(2, '0'),
        label: 'CONTA',
        detail,
        accent: '#ffd166',
        minor: true,
        height: 28,
      });
    }

    items.push({
      id: 'credits',
      badge: String(items.length + 1).padStart(2, '0'),
      label: 'CRÉDITOS',
      detail: 'O VÉU',
      accent: '#ffe6a3',
      minor: true,
      height: 28,
    });
    this.menu.setItems(items, keepIndex);
  }

  update(dt: number): void {
    this.t += dt;
    this.pulse += dt;
    this.intro = Math.min(1, this.intro + dt / 0.85);
    const action = this.menu.update(this.game.input, this.game.audio);
    if (!action) return;
    switch (action) {
      case 'new':
        this.game.gotoTutorial(() =>
          this.game.gotoCharacterSelect(1, this.game.save.selected),
        );
        break;
      case 'continue':
        this.game.gotoCharacterSelect(this.game.save.maxStage, this.game.save.selected);
        break;
      case 'select':
        this.game.gotoCharacterSelect(this.game.save.maxStage, this.game.save.selected);
        break;
      case 'archive':
        this.game.gotoArchive();
        break;
      case 'settings':
        this.game.gotoSettings();
        break;
      case 'account':
        this.game.openAccountPanel();
        break;
      case 'credits':
        this.game.gotoCredits();
        break;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.game;
    const save = this.game.save;
    const stage = getStage(save.maxStage);
    const cleared = new Set(save.cleared);
    const arcsDone = Array.from({ length: ARC_COUNT }, (_, index) => index + 1).filter((arc) =>
      getArcStages(arc).every((chapter) => cleared.has(chapter.id)),
    ).length;

    drawTitleBackground(ctx, this.t);

    // Véu de leitura: escurece a coluna de texto sem apagar o olho.
    const shade = ctx.createLinearGradient(0, 0, width * 0.72, 0);
    shade.addColorStop(0, 'rgba(4,5,10,0.96)');
    shade.addColorStop(0.42, 'rgba(4,5,10,0.82)');
    shade.addColorStop(0.7, 'rgba(4,5,10,0.32)');
    shade.addColorStop(1, 'rgba(4,5,10,0)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, height);

    const bottom = ctx.createLinearGradient(0, height - 120, 0, height);
    bottom.addColorStop(0, 'rgba(3,4,10,0)');
    bottom.addColorStop(1, 'rgba(3,4,10,0.85)');
    ctx.fillStyle = bottom;
    ctx.fillRect(0, height - 120, width, 120);

    // ---------------------------------------------------------------- topo
    ctx.save();
    ctx.globalAlpha = easeOutCubic(clamp(this.intro * 1.6, 0, 1));
    drawSigil(ctx, 92, 44, 13, this.t, '#ff8ae2', '#b48bff', 0.7);
    label(ctx, 'FERRATO  ·  ARQUIVO DO VÉU', 116, 48, 9.5, 'rgba(225,230,245,0.5)', {
      font: FONTS.mono,
      spacing: 1.8,
    });
    const cloud = this.game.cloudSnapshot;
    const status = cloud.signedIn ? 'NUVEM CONECTADA' : cloud.configured ? 'MODO LOCAL' : 'ARQUIVO LOCAL';
    label(ctx, `V2  ·  ${status}`, width - 80, 48, 9, 'rgba(190,198,220,0.42)', {
      align: 'right',
      font: FONTS.mono,
      spacing: 1.4,
    });
    ctx.strokeStyle = 'rgba(180,139,255,0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, 60);
    ctx.lineTo(width - 80, 60);
    ctx.stroke();
    ctx.restore();

    // ------------------------------------------------------- coluna esquerda
    const ease = easeOutCubic(clamp(this.intro, 0, 1));
    ctx.save();
    ctx.globalAlpha = ease;
    ctx.translate(0, (1 - ease) * 10);

    // Marca d'água arcana atrás do título.
    drawSigil(ctx, 392, 176, 178, this.t, '#ff8ae2', '#b48bff', 0.055);

    // Kicker.
    ctx.fillStyle = 'rgba(255,138,60,0.9)';
    ctx.fillRect(80, 89, 22, 2);
    label(ctx, 'UM BEAT \'EM UP 2D  ·  SEIS DESPERTOS  ·  UM VÉU FAMINTO', 112, 94, 10, 'rgba(235,238,250,0.55)', {
      font: FONTS.mono,
      spacing: 1.6,
    });

    // Título com aberração cromática sutil.
    const titleY = 212;
    ctx.save();
    ctx.font = `900 112px ${FONTS.title}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = ease * 0.28;
    ctx.fillStyle = '#56e3ff';
    ctx.fillText('FERRATO', 78, titleY - 1.5);
    ctx.fillStyle = '#ff3357';
    ctx.fillText('FERRATO', 82, titleY + 1.5);
    ctx.restore();

    const grad = ctx.createLinearGradient(80, 120, 760, 240);
    grad.addColorStop(0, '#fff6de');
    grad.addColorStop(0.3, '#ffc06a');
    grad.addColorStop(0.62, '#ff5a57');
    grad.addColorStop(1, '#c08bff');
    ctx.save();
    ctx.font = `900 112px ${FONTS.title}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(255, 51, 87, 0.42)';
    ctx.shadowBlur = 30 + Math.sin(this.pulse * 1.3) * 7;
    ctx.fillStyle = grad;
    ctx.fillText('FERRATO', 80, titleY);
    ctx.restore();

    label(ctx, 'A GUERRA DOS DESPERTOS', 84, 252, 23, '#f2f5ff', {
      weight: 700,
      spacing: 7.4,
      glow: 'rgba(180,139,255,0.4)',
    });

    // Régua com losango.
    const lineGrad = ctx.createLinearGradient(82, 0, 596, 0);
    lineGrad.addColorStop(0, 'rgba(255,138,60,0.95)');
    lineGrad.addColorStop(0.55, 'rgba(255,51,87,0.55)');
    lineGrad.addColorStop(1, 'rgba(180,139,255,0)');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(82, 269, 514, 2);
    ctx.save();
    ctx.translate(600, 270);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = 'rgba(255,209,102,0.9)';
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();

    // Citação em duas linhas, com barra de acento.
    const quoteGrad = ctx.createLinearGradient(84, 286, 84, 336);
    quoteGrad.addColorStop(0, 'rgba(255,138,60,0.85)');
    quoteGrad.addColorStop(1, 'rgba(180,139,255,0.25)');
    ctx.fillStyle = quoteGrad;
    ctx.fillRect(84, 288, 2, 46);
    label(ctx, '“O comum pode se tornar extraordinário', 100, 303, 15.5, 'rgba(225,230,245,0.72)', {
      font: FONTS.ui,
      style: 'italic',
      weight: 500,
    });
    label(ctx, 'quando há algo pelo qual lutar.”', 100, 325, 15.5, 'rgba(225,230,245,0.72)', {
      font: FONTS.ui,
      style: 'italic',
      weight: 500,
    });

    // Menu principal + ações secundárias.
    this.menu.draw(ctx, 80, 348, 470, {
      itemHeight: 46,
      gap: 4,
      size: 16,
      accent: '#ff8a3d',
    });
    ctx.restore();

    // -------------------------------------------------------- coluna direita
    const easeR = easeOutCubic(clamp((this.intro - 0.12) / 0.88, 0, 1));
    ctx.save();
    ctx.globalAlpha = easeR;
    ctx.translate(0, (1 - easeR) * 12);

    // Rótulo do observador.
    const eyeX = 994;
    ctx.strokeStyle = 'rgba(255,138,226,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(790, 344);
    ctx.lineTo(900, 344);
    ctx.moveTo(1088, 344);
    ctx.lineTo(1196, 344);
    ctx.stroke();
    label(ctx, 'O VÉU OBSERVA', eyeX, 347, 9, 'rgba(255,138,226,0.55)', {
      align: 'center',
      font: FONTS.mono,
      spacing: 3.1,
    });

    // Painel do arquivo.
    const px = 772;
    const py = 362;
    const pw = 444;
    const ph = 282;
    panel(ctx, px, py, pw, ph, {
      fill: 'rgba(6,8,18,0.74)',
      border: 'rgba(180,139,255,0.28)',
      glow: 'rgba(180,139,255,0.14)',
      r: 8,
      cut: 16,
    });
    drawBrackets(ctx, px, py, pw, ph, 'rgba(255,209,102,0.45)');
    const topLine = ctx.createLinearGradient(px + 20, 0, px + pw - 20, 0);
    topLine.addColorStop(0, 'rgba(255,138,226,0)');
    topLine.addColorStop(0.5, 'rgba(255,138,226,0.65)');
    topLine.addColorStop(1, 'rgba(180,139,255,0)');
    ctx.fillStyle = topLine;
    ctx.fillRect(px + 20, py + 1, pw - 40, 1.5);

    const ix = px + 20;
    const ir = px + pw - 20;

    label(ctx, 'ARQUIVO DO VÉU', ix, py + 26, 10.5, 'rgba(200,170,255,0.92)', {
      font: FONTS.mono,
      spacing: 1.8,
    });
    label(ctx, 'SIGILO VI', ir, py + 26, 8.5, 'rgba(190,198,220,0.32)', {
      align: 'right',
      font: FONTS.mono,
      spacing: 1.4,
    });
    ctx.strokeStyle = 'rgba(180,139,255,0.16)';
    ctx.beginPath();
    ctx.moveTo(ix, py + 36);
    ctx.lineTo(ir, py + 36);
    ctx.stroke();

    // Campanha.
    label(ctx, 'CAMPANHA', ix, py + 56, 8.5, 'rgba(190,198,220,0.48)', {
      font: FONTS.mono,
      spacing: 1.6,
    });
    label(ctx, `${String(save.cleared.length).padStart(2, '0')} / ${MAX_STAGE}`, ix, py + 82, 23, '#ffe6a3', {
      font: FONTS.mono,
      weight: 700,
      spacing: 1,
      glow: 'rgba(255,209,102,0.35)',
    });
    label(ctx, `ARCOS  ${arcsDone} / ${ARC_COUNT}`, ir, py + 56, 9, 'rgba(190,198,220,0.55)', {
      align: 'right',
      font: FONTS.mono,
      spacing: 1,
    });
    label(ctx, `DESPERTOS  ${save.unlocked.length} / 6`, ir, py + 72, 9, 'rgba(190,198,220,0.55)', {
      align: 'right',
      font: FONTS.mono,
      spacing: 1,
    });

    drawProgressPips(ctx, ix, py + 92, ir - ix, cleared, save.maxStage, this.t);

    const stageName = stage.name.toUpperCase();
    const clipped = stageName.length > 27 ? `${stageName.slice(0, 26)}…` : stageName;
    label(ctx, `PRÓXIMO  ·  ${stage.subtitle.toUpperCase()}`, ix, py + 116, 8.5, 'rgba(86,227,255,0.72)', {
      font: FONTS.mono,
      spacing: 0.9,
    });
    label(ctx, clipped, ir, py + 116, 8.5, 'rgba(190,198,220,0.38)', {
      align: 'right',
      font: FONTS.mono,
      spacing: 0.6,
    });

    ctx.strokeStyle = 'rgba(180,139,255,0.14)';
    ctx.beginPath();
    ctx.moveTo(ix, py + 128);
    ctx.lineTo(ir, py + 128);
    ctx.stroke();

    // Estatísticas em quatro células.
    const stats = [
      { key: 'ABATES', value: String(save.kills).padStart(3, '0'), color: '#f2f5ff' },
      { key: 'COMBO', value: String(save.bestCombo).padStart(3, '0'), color: '#56e3ff' },
      { key: 'RECORDE', value: String(save.bestScore).padStart(6, '0'), color: '#ffd166' },
      { key: 'RANK', value: save.bestRank, color: '#ff9bb8' },
    ];
    const cellW = (ir - ix) / stats.length;
    stats.forEach((stat, i) => {
      const cx = ix + i * cellW;
      if (i > 0) {
        ctx.strokeStyle = 'rgba(180,139,255,0.12)';
        ctx.beginPath();
        ctx.moveTo(cx - 8, py + 140);
        ctx.lineTo(cx - 8, py + 166);
        ctx.stroke();
      }
      label(ctx, stat.key, cx, py + 144, 8, 'rgba(190,198,220,0.42)', {
        font: FONTS.mono,
        spacing: 1.2,
      });
      label(ctx, stat.value, cx, py + 165, 17, stat.color, {
        font: FONTS.mono,
        weight: 700,
        spacing: 0.6,
      });
    });

    ctx.strokeStyle = 'rgba(180,139,255,0.14)';
    ctx.beginPath();
    ctx.moveTo(ix, py + 178);
    ctx.lineTo(ir, py + 178);
    ctx.stroke();

    // Roster de Despertos.
    label(ctx, 'DESPERTOS', ix, py + 198, 9, 'rgba(200,170,255,0.7)', {
      font: FONTS.mono,
      spacing: 1.7,
    });
    label(ctx, `${save.unlocked.length} / 6`, ir, py + 198, 9, 'rgba(190,198,220,0.4)', {
      align: 'right',
      font: FONTS.mono,
      spacing: 1,
    });

    const slotW = (ir - ix) / 6;
    CHARACTER_ORDER.forEach((id, i) => {
      const def = CHARACTERS[id];
      const cx = ix + slotW * (i + 0.5);
      const cy = py + 228;
      const unlocked = save.unlocked.includes(id);
      const selected = unlocked && save.selected === id;
      drawMedallion(ctx, id, cx, cy, 23, unlocked, selected, this.t);
      label(ctx, unlocked ? def.name.toUpperCase() : 'SELADO', cx, cy + 36, 8, unlocked ? hexToRgba(def.colors.accent, 0.8) : 'rgba(160,166,184,0.32)', {
        align: 'center',
        font: FONTS.mono,
        spacing: 1,
      });
    });
    ctx.restore();

    // ---------------------------------------------------------------- rodapé
    ctx.save();
    ctx.globalAlpha = easeOutCubic(clamp((this.intro - 0.2) / 0.8, 0, 1));
    const footLine = ctx.createLinearGradient(80, 0, width - 80, 0);
    footLine.addColorStop(0, 'rgba(180,139,255,0.2)');
    footLine.addColorStop(0.5, 'rgba(180,139,255,0.08)');
    footLine.addColorStop(1, 'rgba(180,139,255,0)');
    ctx.fillStyle = footLine;
    ctx.fillRect(80, 674, width - 160, 1);

    const mute = this.game.audio.muted ? '  ·  ÁUDIO MUDO' : '';
    label(
      ctx,
      this.game.isTouchDevice
        ? 'TOQUE PARA CONFIRMAR  ·  CONFIGURAÇÕES AJUSTAM OS CONTROLES'
        : `↑ ↓ NAVEGAR  ·  ENTER CONFIRMAR  ·  M ÁUDIO${mute}`,
      80,
      696,
      9.5,
      'rgba(190,198,220,0.42)',
      {
        font: FONTS.mono,
        spacing: 1.1,
      },
    );
    label(ctx, 'CANVAS 2D  ·  WEB AUDIO  ·  ARTE PROCEDURAL', width - 80, 696, 9, 'rgba(160,168,190,0.3)', {
      align: 'right',
      font: FONTS.mono,
      spacing: 0.9,
    });

    if (save.cleared.length === 0) {
      const a = 0.5 + Math.sin(this.t * 2.1) * 0.16;
      label(ctx, 'A PRIMEIRA FAÍSCA ESPERA POR VOCÊ', 80, 344, 9, `rgba(255,209,102,${a})`, {
        font: FONTS.mono,
        spacing: 1.5,
      });
    }
    ctx.restore();
  }
}
