/**
 * Arquivo do Véu — o livro-bestiário da campanha.
 *
 * Duas páginas: à esquerda, o índice da seção; à direita, o registro aberto.
 * Tudo nasce selado e só é revelado quando o jogador avista a criatura,
 * enfrenta o chefe, visita o capítulo ou encontra a relíquia.
 */

import type { Game, Scene } from '../core/game.js';
import { TITLE_THEME_INDEX } from '../core/audio.js';
import { clamp, hexToRgba, TAU } from '../core/math.js';
import { drawArchiveBackground } from '../render/backgrounds.js';
import { drawArchiveIcon } from '../render/archive.js';
import {
  ARCHIVE_SECTIONS,
  archiveEntriesForSection,
  archiveEntryUnlocked,
  archiveSectionProgress,
  archiveTotalProgress,
} from '../data/archive.js';
import type { ArchiveEntry, ArchiveSection, ArchiveSectionDef } from '../data/archive.js';
import { FONTS, label, roundRectPath } from '../render/theme.js';

const BOOK_X = 56;
const BOOK_Y = 142;
const BOOK_W = 1168;
const BOOK_H = 528;

const PAGE_Y = 156;
const PAGE_H = 500;
const PAGE_W = 550;
const PAGE_LEFT = 80;
const PAGE_RIGHT = 650;

const LIST_X = 100;
const LIST_Y = 232;
const LIST_W = 508;
const VISIBLE_ROWS = 7;
const ROW_H = 48;
const ROW_GAP = 4;

const DETAIL_X = 674;
const DETAIL_W = 502;

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function inside(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function drawSeal(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, time: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = hexToRgba(color, 0.7);
  ctx.lineWidth = 1.2;
  ctx.rotate(time * 0.12);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.rotate(-time * 0.2);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.56, r * 0.3, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = hexToRgba(color, 0.85);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.12, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function pageCorner(ctx: CanvasRenderingContext2D, x: number, y: number, sx: number, sy: number, color: string): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + sx * 20, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + sy * 20);
  ctx.stroke();
  ctx.restore();
}

export class ArchiveScene implements Scene {
  private t = 0;
  private sectionIndex = 0;
  private selectedIndex = 0;
  private scroll = 0;
  private tabRects: Rect[] = [];
  private rowRects: Rect[] = [];
  private hoverTab = -1;
  private hoverRow = -1;
  private readonly entriesBySection: Map<ArchiveSection, ArchiveEntry[]>;
  readonly noticeY = 668;

  constructor(private readonly game: Game) {
    this.entriesBySection = new Map(
      ARCHIVE_SECTIONS.map((section) => [section.id, archiveEntriesForSection(section.id)]),
    );
  }

  enter(): void {
    this.game.audio.playMusic(TITLE_THEME_INDEX);
    this.game.audio.playAmbience('cosmic');
    this.sectionIndex = 0;
    this.selectedIndex = 0;
    this.scroll = 0;
  }

  private get section(): ArchiveSectionDef {
    return ARCHIVE_SECTIONS[this.sectionIndex];
  }

  private get entries(): ArchiveEntry[] {
    return this.entriesBySection.get(this.section.id) ?? [];
  }

  private get selectedEntry(): ArchiveEntry | null {
    return this.entries[this.selectedIndex] ?? null;
  }

  private isUnlocked(entry: ArchiveEntry): boolean {
    return archiveEntryUnlocked(entry, this.game.save);
  }

  private lockHint(section: ArchiveSection): string {
    switch (section) {
      case 'heroes':
        return 'DESBLOQUEIE O DESPERTO NA CAMPANHA PARA LER ESTE REGISTRO';
      case 'creatures':
        return 'AVISTE A CRIATURA EM COMBATE PARA REVELAR ESTE REGISTRO';
      case 'bosses':
        return 'ENFRENTE O CHEFE NO CAPÍTULO PARA REVELAR ESTE REGISTRO';
      case 'places':
        return 'VISITE O CAPÍTULO PARA REVELAR ESTE LUGAR';
      case 'relics':
        return 'ENCONTRE A RELÍQUIA OU O FENÔMENO NO MAPA PARA REVELAR';
    }
  }

  private selectSection(index: number, playSound = true): void {
    const next = (index + ARCHIVE_SECTIONS.length) % ARCHIVE_SECTIONS.length;
    if (next === this.sectionIndex && playSound) return;
    this.sectionIndex = next;
    this.selectedIndex = 0;
    this.scroll = 0;
    if (playSound) this.game.audio.sfx('select');
  }

  private ensureVisible(): void {
    const total = this.entries.length;
    if (this.selectedIndex < this.scroll) this.scroll = this.selectedIndex;
    const last = this.scroll + VISIBLE_ROWS - 1;
    if (this.selectedIndex > last) this.scroll = this.selectedIndex - VISIBLE_ROWS + 1;
    this.scroll = clamp(this.scroll, 0, Math.max(0, total - VISIBLE_ROWS));
  }

  private moveSelection(dir: number): void {
    if (!this.entries.length) return;
    const next = clamp(this.selectedIndex + dir, 0, this.entries.length - 1);
    if (next === this.selectedIndex) return;
    this.selectedIndex = next;
    this.ensureVisible();
    this.game.audio.sfx('select');
  }

  private confirmSelection(): void {
    const entry = this.selectedEntry;
    if (!entry) return;
    if (this.isUnlocked(entry)) {
      this.game.audio.sfx('confirm');
      this.game.setNotice(`${entry.name.toUpperCase()}  ·  REGISTRO LIDO`, this.section.accent, 2.8);
      return;
    }
    this.game.audio.sfx('ui');
    this.game.setNotice(this.lockHint(entry.section), '#ffd166', 3.6);
  }

  update(dt: number): void {
    this.t += dt;
    const input = this.game.input;

    if (input.pressed('back') || input.pressed('pause')) {
      this.game.audio.sfx('ui');
      this.game.gotoTitle();
      return;
    }

    if (input.pressed('left')) {
      this.selectSection(this.sectionIndex - 1);
      return;
    }
    if (input.pressed('right')) {
      this.selectSection(this.sectionIndex + 1);
      return;
    }
    if (input.pressed('up')) {
      this.moveSelection(-1);
      return;
    }
    if (input.pressed('down')) {
      this.moveSelection(1);
      return;
    }
    if (input.pressed('confirm') || input.pressed('attack') || input.pressed('jump')) {
      this.confirmSelection();
      return;
    }

    if (input.mouse.moved) {
      this.hoverTab = this.tabRects.findIndex((r) => inside(r, input.mouse.x, input.mouse.y));
      this.hoverRow = this.rowRects.findIndex((r) => inside(r, input.mouse.x, input.mouse.y));
    }

    if (!input.mouse.clicked) return;

    const tab = this.tabRects.findIndex((r) => inside(r, input.mouse.x, input.mouse.y));
    if (tab >= 0) {
      this.selectSection(tab);
      return;
    }

    const row = this.rowRects.findIndex((r) => inside(r, input.mouse.x, input.mouse.y));
    if (row < 0) return;
    const index = this.scroll + row;
    if (index >= this.entries.length) return;
    this.selectedIndex = index;
    this.confirmSelection();
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.game;
    drawArchiveBackground(ctx, this.t);

    this.drawHeader(ctx);
    this.drawTabs(ctx);
    this.drawBook(ctx);
    this.drawList(ctx);
    this.drawDetail(ctx);
    this.drawFooter(ctx);

    const top = ctx.createLinearGradient(0, 0, 0, 120);
    top.addColorStop(0, 'rgba(3,3,9,0.72)');
    top.addColorStop(1, 'rgba(3,3,9,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, width, 120);

    const bottom = ctx.createLinearGradient(0, height - 70, 0, height);
    bottom.addColorStop(0, 'rgba(3,3,9,0)');
    bottom.addColorStop(1, 'rgba(3,3,9,0.78)');
    ctx.fillStyle = bottom;
    ctx.fillRect(0, height - 70, width, 70);
  }

  private drawHeader(ctx: CanvasRenderingContext2D): void {
    const total = archiveTotalProgress(this.game.save);
    drawSeal(ctx, 86, 48, 16, '#b48bff', this.t);
    label(ctx, 'ARQUIVO DO VÉU', 118, 55, 27, '#f4f0ff', {
      weight: 800,
      spacing: 3.2,
      glow: 'rgba(180,139,255,0.45)',
    });
    label(ctx, 'BESTIÁRIO, LUGARES, CHEFES E RELÍQUIAS DA CAMPANHA', 120, 74, 9, 'rgba(200,190,230,0.58)', {
      font: FONTS.mono,
      spacing: 1.8,
    });

    label(ctx, `ARQUIVO  ${String(total.unlocked).padStart(2, '0')} / ${total.total}`, 1200, 50, 12, '#ffe6a3', {
      align: 'right',
      font: FONTS.mono,
      weight: 700,
      spacing: 1.6,
      glow: 'rgba(255,209,102,0.35)',
    });
    label(ctx, 'SIGILO VI  ·  LEITURA PARCIAL', 1200, 70, 8.5, 'rgba(190,198,220,0.42)', {
      align: 'right',
      font: FONTS.mono,
      spacing: 1.3,
    });

    const line = ctx.createLinearGradient(BOOK_X, 0, BOOK_X + BOOK_W, 0);
    line.addColorStop(0, 'rgba(180,139,255,0)');
    line.addColorStop(0.2, 'rgba(180,139,255,0.35)');
    line.addColorStop(0.8, 'rgba(255,209,102,0.25)');
    line.addColorStop(1, 'rgba(255,209,102,0)');
    ctx.fillStyle = line;
    ctx.fillRect(BOOK_X, 86, BOOK_W, 1);
  }

  private drawTabs(ctx: CanvasRenderingContext2D): void {
    const gap = 8;
    const tabW = (BOOK_W - gap * (ARCHIVE_SECTIONS.length - 1)) / ARCHIVE_SECTIONS.length;
    this.tabRects = [];

    ARCHIVE_SECTIONS.forEach((section, i) => {
      const x = BOOK_X + i * (tabW + gap);
      const y = 96;
      const h = 40;
      this.tabRects.push({ x, y, w: tabW, h });
      const active = i === this.sectionIndex;
      const hover = i === this.hoverTab;
      const progress = archiveSectionProgress(section.id, this.game.save);
      const accent = section.accent;

      ctx.save();
      roundRectPath(ctx, x, y, tabW, h, 5);
      ctx.fillStyle = active
        ? hexToRgba(accent, 0.2)
        : hover
          ? hexToRgba(accent, 0.1)
          : 'rgba(7,9,18,0.74)';
      ctx.fill();
      ctx.strokeStyle = active ? hexToRgba(accent, 0.68) : hexToRgba(accent, hover ? 0.3 : 0.16);
      ctx.lineWidth = active ? 1.4 : 1;
      ctx.stroke();
      if (active) {
        ctx.fillStyle = hexToRgba(accent, 0.9);
        ctx.fillRect(x + 12, y + h - 1, tabW - 24, 2);
      }
      ctx.restore();

      label(ctx, section.short, x + 14, y + 18, 9.5, active ? '#ffffff' : hexToRgba(accent, 0.72), {
        font: FONTS.mono,
        weight: active ? 700 : 600,
        spacing: 1.2,
        glow: active ? accent : undefined,
      });
      label(ctx, `${progress.unlocked}/${progress.total}`, x + tabW - 14, y + 18, 8.5, active ? hexToRgba(accent, 0.95) : 'rgba(190,198,220,0.42)', {
        align: 'right',
        font: FONTS.mono,
        weight: 600,
        spacing: 0.8,
      });

      const barX = x + 14;
      const barY = y + 30;
      const barW = tabW - 28;
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(barX, barY, barW, 2);
      ctx.fillStyle = hexToRgba(accent, active ? 0.9 : 0.42);
      ctx.fillRect(barX, barY, barW * (progress.total ? progress.unlocked / progress.total : 0), 2);
    });
  }

  private drawBook(ctx: CanvasRenderingContext2D): void {
    // Sombra e capa de couro.
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 14;
    roundRectPath(ctx, BOOK_X, BOOK_Y, BOOK_W, BOOK_H, 16);
    const cover = ctx.createLinearGradient(BOOK_X, BOOK_Y, BOOK_X, BOOK_Y + BOOK_H);
    cover.addColorStop(0, '#1a1326');
    cover.addColorStop(0.5, '#0e0a18');
    cover.addColorStop(1, '#07050e');
    ctx.fillStyle = cover;
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRectPath(ctx, BOOK_X + 1, BOOK_Y + 1, BOOK_W - 2, BOOK_H - 2, 15);
    ctx.strokeStyle = 'rgba(255,209,102,0.24)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    roundRectPath(ctx, BOOK_X + 7, BOOK_Y + 7, BOOK_W - 14, BOOK_H - 14, 12);
    ctx.strokeStyle = 'rgba(180,139,255,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Bloco de páginas.
    for (let i = 3; i >= 1; i--) {
      roundRectPath(ctx, PAGE_LEFT + i * 2, PAGE_Y + i * 2, PAGE_RIGHT + PAGE_W - PAGE_LEFT + i * 2, PAGE_H - i * 2, 6);
      ctx.fillStyle = i === 1 ? 'rgba(30,27,40,0.7)' : 'rgba(20,18,28,0.6)';
      ctx.fill();
    }

    // Página esquerda.
    const left = ctx.createLinearGradient(PAGE_LEFT, PAGE_Y, PAGE_LEFT, PAGE_Y + PAGE_H);
    left.addColorStop(0, '#0d101a');
    left.addColorStop(0.45, '#0a0c15');
    left.addColorStop(1, '#070810');
    roundRectPath(ctx, PAGE_LEFT, PAGE_Y, PAGE_W, PAGE_H, 7);
    ctx.fillStyle = left;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,209,102,0.14)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Página direita.
    const right = ctx.createLinearGradient(PAGE_RIGHT, PAGE_Y, PAGE_RIGHT, PAGE_Y + PAGE_H);
    right.addColorStop(0, '#0e111c');
    right.addColorStop(0.45, '#0b0d16');
    right.addColorStop(1, '#080911');
    roundRectPath(ctx, PAGE_RIGHT, PAGE_Y, PAGE_W, PAGE_H, 7);
    ctx.fillStyle = right;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,209,102,0.14)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Lombada.
    const spine = ctx.createLinearGradient(PAGE_LEFT + PAGE_W, 0, PAGE_RIGHT, 0);
    spine.addColorStop(0, 'rgba(0,0,0,0.55)');
    spine.addColorStop(0.35, 'rgba(24,19,34,0.95)');
    spine.addColorStop(0.5, 'rgba(46,36,58,0.55)');
    spine.addColorStop(0.65, 'rgba(24,19,34,0.95)');
    spine.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = spine;
    ctx.fillRect(PAGE_LEFT + PAGE_W, PAGE_Y, PAGE_RIGHT - PAGE_LEFT - PAGE_W, PAGE_H);
    ctx.strokeStyle = 'rgba(255,209,102,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAGE_LEFT + PAGE_W + 9, PAGE_Y + 8);
    ctx.lineTo(PAGE_LEFT + PAGE_W + 9, PAGE_Y + PAGE_H - 8);
    ctx.moveTo(PAGE_RIGHT - 9, PAGE_Y + 8);
    ctx.lineTo(PAGE_RIGHT - 9, PAGE_Y + PAGE_H - 8);
    ctx.stroke();

    // Pauta sutil e margens.
    ctx.save();
    ctx.strokeStyle = 'rgba(200,210,235,0.035)';
    ctx.lineWidth = 1;
    for (let y = PAGE_Y + 42; y < PAGE_Y + PAGE_H - 16; y += 24) {
      ctx.beginPath();
      ctx.moveTo(PAGE_LEFT + 18, y);
      ctx.lineTo(PAGE_LEFT + PAGE_W - 18, y);
      ctx.moveTo(PAGE_RIGHT + 18, y);
      ctx.lineTo(PAGE_RIGHT + PAGE_W - 18, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,120,120,0.08)';
    ctx.beginPath();
    ctx.moveTo(PAGE_LEFT + 48, PAGE_Y + 16);
    ctx.lineTo(PAGE_LEFT + 48, PAGE_Y + PAGE_H - 16);
    ctx.moveTo(PAGE_RIGHT + PAGE_W - 42, PAGE_Y + 16);
    ctx.lineTo(PAGE_RIGHT + PAGE_W - 42, PAGE_Y + PAGE_H - 16);
    ctx.stroke();
    ctx.restore();

    // Cantos ornamentados.
    const gold = 'rgba(255,209,102,0.4)';
    pageCorner(ctx, PAGE_LEFT + 14, PAGE_Y + 14, 1, 1, gold);
    pageCorner(ctx, PAGE_LEFT + PAGE_W - 14, PAGE_Y + 14, -1, 1, gold);
    pageCorner(ctx, PAGE_LEFT + 14, PAGE_Y + PAGE_H - 14, 1, -1, gold);
    pageCorner(ctx, PAGE_LEFT + PAGE_W - 14, PAGE_Y + PAGE_H - 14, -1, -1, gold);
    pageCorner(ctx, PAGE_RIGHT + 14, PAGE_Y + 14, 1, 1, gold);
    pageCorner(ctx, PAGE_RIGHT + PAGE_W - 14, PAGE_Y + 14, -1, 1, gold);
    pageCorner(ctx, PAGE_RIGHT + 14, PAGE_Y + PAGE_H - 14, 1, -1, gold);
    pageCorner(ctx, PAGE_RIGHT + PAGE_W - 14, PAGE_Y + PAGE_H - 14, -1, -1, gold);

    label(ctx, 'ÍNDICE', PAGE_LEFT + PAGE_W / 2, PAGE_Y + PAGE_H - 18, 8, 'rgba(190,198,220,0.28)', {
      align: 'center',
      font: FONTS.mono,
      spacing: 2.4,
    });
    label(ctx, 'REGISTRO', PAGE_RIGHT + PAGE_W / 2, PAGE_Y + PAGE_H - 18, 8, 'rgba(190,198,220,0.28)', {
      align: 'center',
      font: FONTS.mono,
      spacing: 2.4,
    });
  }

  private drawList(ctx: CanvasRenderingContext2D): void {
    const entries = this.entries;
    const accent = this.section.accent;
    const progress = archiveSectionProgress(this.section.id, this.game.save);

    label(ctx, this.section.label.toUpperCase(), LIST_X + 4, 190, 18, '#f4f0ff', {
      weight: 800,
      spacing: 1.8,
      glow: hexToRgba(accent, 0.35),
    });
    label(ctx, `${progress.unlocked} / ${progress.total} REVELADOS`, LIST_X + LIST_W - 4, 190, 8.5, hexToRgba(accent, 0.8), {
      align: 'right',
      font: FONTS.mono,
      spacing: 1.1,
    });
    label(ctx, this.section.description, LIST_X + 4, 208, 9.5, 'rgba(190,198,220,0.5)', {
      font: FONTS.ui,
    });

    ctx.strokeStyle = hexToRgba(accent, 0.24);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(LIST_X, 219);
    ctx.lineTo(LIST_X + LIST_W, 219);
    ctx.stroke();

    this.rowRects = [];
    for (let i = 0; i < VISIBLE_ROWS; i++) {
      const index = this.scroll + i;
      const row: Rect = { x: LIST_X, y: LIST_Y + i * (ROW_H + ROW_GAP), w: LIST_W, h: ROW_H };
      this.rowRects.push(row);
      if (index >= entries.length) continue;
      this.drawRow(ctx, entries[index], index, row);
    }

    // Barra de rolagem.
    const trackX = LIST_X + LIST_W + 6;
    const trackY = LIST_Y;
    const trackH = VISIBLE_ROWS * (ROW_H + ROW_GAP) - ROW_GAP;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(trackX, trackY, 3, trackH);
    if (entries.length > VISIBLE_ROWS) {
      const thumbH = Math.max(34, trackH * (VISIBLE_ROWS / entries.length));
      const maxScroll = Math.max(1, entries.length - VISIBLE_ROWS);
      const thumbY = trackY + (trackH - thumbH) * (this.scroll / maxScroll);
      ctx.fillStyle = hexToRgba(accent, 0.55);
      ctx.fillRect(trackX, thumbY, 3, thumbH);
    }
  }

  private drawRow(ctx: CanvasRenderingContext2D, entry: ArchiveEntry, index: number, row: Rect): void {
    const unlocked = this.isUnlocked(entry);
    const active = index === this.selectedIndex;
    const hover = index === this.scroll + this.hoverRow;
    const accent = this.section.accent;

    ctx.save();
    if (active || hover) {
      roundRectPath(ctx, row.x, row.y, row.w, row.h, 4);
      ctx.fillStyle = active ? hexToRgba(accent, 0.15) : hexToRgba(accent, 0.06);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(accent, active ? 0.42 : 0.16);
      ctx.lineWidth = 1;
      ctx.stroke();
      if (active) {
        ctx.fillStyle = accent;
        ctx.fillRect(row.x, row.y + 7, 3, row.h - 14);
      }
    }
    ctx.restore();

    const cy = row.y + row.h / 2;
    drawArchiveIcon(ctx, entry, row.x + 28, cy, 32, this.t, !unlocked);

    const nameColor = unlocked
      ? active
        ? '#ffffff'
        : 'rgba(230,235,248,0.82)'
      : 'rgba(160,168,190,0.4)';
    label(ctx, unlocked ? entry.name : '???', row.x + 52, cy - 4, 13.5, nameColor, {
      weight: active ? 700 : 600,
      spacing: 0.4,
      glow: active && unlocked ? hexToRgba(accent, 0.5) : undefined,
    });

    ctx.save();
    ctx.font = `600 8.5px ${FONTS.mono}`;
    const sub = unlocked ? entry.subtitle : 'AVISTE PARA REVELAR';
    label(ctx, this.ellipsize(ctx, sub, 320), row.x + 52, cy + 13, 8.5, unlocked ? 'rgba(170,180,205,0.48)' : 'rgba(150,158,180,0.32)', {
      font: FONTS.mono,
      spacing: 0.7,
    });
    ctx.restore();

    const right = row.x + row.w - 14;
    if (unlocked) {
      const tag = entry.arc > 0 ? `ARCO ${ROMAN[clamp(entry.arc - 1, 0, 5)]}` : 'RELIQUÍDIA';
      label(ctx, tag, right, cy + 4, 8, hexToRgba(accent, active ? 0.9 : 0.5), {
        align: 'right',
        font: FONTS.mono,
        spacing: 0.9,
      });
    } else {
      label(ctx, 'SELADO', right, cy + 4, 8, 'rgba(160,168,190,0.34)', {
        align: 'right',
        font: FONTS.mono,
        spacing: 1.1,
      });
    }
  }

  private drawDetail(ctx: CanvasRenderingContext2D): void {
    const entry = this.selectedEntry;
    const accent = this.section.accent;
    if (!entry) {
      label(ctx, 'NENHUM REGISTRO NESTA SEÇÃO', PAGE_RIGHT + PAGE_W / 2, PAGE_Y + PAGE_H / 2, 12, 'rgba(190,198,220,0.4)', {
        align: 'center',
        font: FONTS.mono,
        spacing: 1.4,
      });
      return;
    }

    const unlocked = this.isUnlocked(entry);
    const indexLabel = `${String(this.selectedIndex + 1).padStart(2, '0')} / ${String(this.entries.length).padStart(2, '0')}`;

    // Halo atrás do ícone.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const halo = ctx.createRadialGradient(DETAIL_X + 58, 248, 4, DETAIL_X + 58, 248, 92);
    halo.addColorStop(0, hexToRgba(accent, unlocked ? 0.2 : 0.06));
    halo.addColorStop(1, hexToRgba(accent, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(DETAIL_X - 34, 156, 190, 190);
    ctx.restore();

    drawArchiveIcon(ctx, entry, DETAIL_X + 58, 248, 104, this.t, !unlocked);

    const textX = DETAIL_X + 128;
    const textW = DETAIL_X + DETAIL_W - textX;

    if (!unlocked) {
      label(ctx, 'REGISTRO SELADO', textX, 224, 21, 'rgba(225,230,245,0.55)', {
        weight: 800,
        spacing: 2.2,
      });
      label(ctx, 'O VÉU AINDA NÃO PERMITIU ESTA LEITURA.', textX, 246, 9, 'rgba(190,198,220,0.45)', {
        font: FONTS.mono,
        spacing: 1.1,
      });
      label(ctx, indexLabel, DETAIL_X + DETAIL_W, 224, 9, 'rgba(160,168,190,0.4)', {
        align: 'right',
        font: FONTS.mono,
        spacing: 1,
      });
      ctx.strokeStyle = hexToRgba(accent, 0.2);
      ctx.beginPath();
      ctx.moveTo(DETAIL_X, 300);
      ctx.lineTo(DETAIL_X + DETAIL_W, 300);
      ctx.stroke();

      // Linhas censuradas.
      for (let i = 0; i < 8; i++) {
        const w = 150 + ((i * 73 + (entry.stageId ?? 3) * 19) % 250);
        ctx.fillStyle = `rgba(200,210,230,${0.035 + (i % 3) * 0.012})`;
        ctx.fillRect(DETAIL_X, 330 + i * 18, w, 5);
      }

      const hint = this.lockHint(entry.section);
      const boxY = 486;
      ctx.save();
      roundRectPath(ctx, DETAIL_X, boxY, DETAIL_W, 82, 5);
      ctx.fillStyle = 'rgba(5,7,14,0.72)';
      ctx.fill();
      ctx.strokeStyle = hexToRgba('#ffd166', 0.32);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      label(ctx, 'COMO REVELAR', DETAIL_X + 18, boxY + 24, 9, 'rgba(255,209,102,0.85)', {
        font: FONTS.mono,
        spacing: 1.6,
      });
      this.drawWrapped(ctx, hint, DETAIL_X + 18, boxY + 44, DETAIL_W - 36, 15, 2, 10.5, 'rgba(230,235,248,0.68)', {
        font: FONTS.ui,
        weight: 500,
      });
      label(ctx, 'A PÁGINA REAGE À SUA PRESENÇA. CONTINUE A CAMPANHA.', DETAIL_X + DETAIL_W, 632, 8, 'rgba(160,168,190,0.34)', {
        align: 'right',
        font: FONTS.mono,
        spacing: 0.8,
      });
      return;
    }

    // Registro aberto.
    const nameSize = this.fitSize(ctx, entry.name, textW, 26, 16, 800, FONTS.ui);
    label(ctx, entry.name, textX, 224, nameSize, '#f6f2ff', {
      weight: 800,
      spacing: 0.6,
      glow: hexToRgba(accent, 0.45),
    });

    ctx.save();
    ctx.font = `600 10.5px ${FONTS.ui}`;
    label(ctx, this.ellipsize(ctx, entry.subtitle, textW), textX, 246, 10.5, hexToRgba(accent, 0.82), {
      font: FONTS.ui,
      weight: 600,
      spacing: 0.3,
    });
    ctx.restore();

    label(ctx, `ARCO ${entry.arc > 0 ? ROMAN[clamp(entry.arc - 1, 0, 5)] : '—'}  ·  ${this.section.label.toUpperCase()}  ·  ${indexLabel}`, textX, 266, 8.5, 'rgba(190,198,220,0.44)', {
      font: FONTS.mono,
      spacing: 1,
    });

    ctx.strokeStyle = hexToRgba(accent, 0.26);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(DETAIL_X, 300);
    ctx.lineTo(DETAIL_X + DETAIL_W, 300);
    ctx.stroke();

    let loreY = 326;
    for (const paragraph of entry.lore) {
      const next = this.drawWrapped(ctx, paragraph, DETAIL_X, loreY, DETAIL_W, 16.5, 9, 12.5, 'rgba(224,229,242,0.78)', {
        font: FONTS.ui,
        weight: 500,
      });
      loreY = next + 5;
      if (loreY > 474) break;
    }

    // Ficha do registro.
    label(ctx, 'FICHA DO REGISTRO', DETAIL_X, 496, 8.5, 'rgba(190,198,220,0.48)', {
      font: FONTS.mono,
      spacing: 1.7,
    });
    const stats = entry.stats.slice(0, 4);
    stats.forEach((stat, i) => {
      const y = 520 + i * 28;
      ctx.strokeStyle = 'rgba(180,139,255,0.1)';
      ctx.beginPath();
      ctx.moveTo(DETAIL_X, y - 11);
      ctx.lineTo(DETAIL_X + DETAIL_W, y - 11);
      ctx.stroke();
      label(ctx, stat.label, DETAIL_X, y, 8.5, hexToRgba(accent, 0.72), {
        font: FONTS.mono,
        spacing: 1.2,
      });
      ctx.save();
      ctx.font = `600 11px ${FONTS.ui}`;
      label(ctx, this.ellipsize(ctx, stat.value, DETAIL_W - 128), DETAIL_X + DETAIL_W, y, 11, 'rgba(230,235,248,0.78)', {
        align: 'right',
        font: FONTS.ui,
        weight: 600,
      });
      ctx.restore();
    });

    label(ctx, '— ARQUIVO DO VÉU', DETAIL_X + DETAIL_W, 636, 8.5, 'rgba(180,139,255,0.36)', {
      align: 'right',
      font: FONTS.mono,
      spacing: 1.4,
    });
  }

  private drawFooter(ctx: CanvasRenderingContext2D): void {
    const line = ctx.createLinearGradient(BOOK_X, 0, BOOK_X + BOOK_W, 0);
    line.addColorStop(0, 'rgba(180,139,255,0.2)');
    line.addColorStop(0.6, 'rgba(180,139,255,0.08)');
    line.addColorStop(1, 'rgba(180,139,255,0)');
    ctx.fillStyle = line;
    ctx.fillRect(BOOK_X, 684, BOOK_W, 1);

    label(
      ctx,
      this.game.isTouchDevice
        ? 'TOQUE NAS ABAS E REGISTROS  ·  BOTÃO VOLTAR RETORNA AO MENU'
        : '← → SEÇÃO  ·  ↑ ↓ REGISTRO  ·  ENTER LER  ·  ESC / Q VOLTAR',
      BOOK_X,
      704,
      9,
      'rgba(190,198,220,0.42)',
      {
        font: FONTS.mono,
        spacing: 1.1,
      },
    );
    label(ctx, 'ARQUIVO DO VÉU  ·  V2  ·  TUDO O QUE O FERRATO NÃO CONSEGUIU ESQUECER', BOOK_X + BOOK_W, 704, 8.5, 'rgba(160,168,190,0.3)', {
      align: 'right',
      font: FONTS.mono,
      spacing: 0.8,
    });
  }

  private fitSize(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    start: number,
    min: number,
    weight: number,
    font: string,
  ): number {
    let size = start;
    ctx.save();
    while (size > min) {
      ctx.font = `${weight} ${size}px ${font}`;
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 1;
    }
    ctx.restore();
    return size;
  }

  private ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let lo = 0;
    let hi = text.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (ctx.measureText(`${text.slice(0, mid)}…`).width <= maxWidth) lo = mid;
      else hi = mid - 1;
    }
    return `${text.slice(0, Math.max(1, lo)).trimEnd()}…`;
  }

  private drawWrapped(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number,
    size: number,
    color: string,
    opts: { font?: string; weight?: number } = {},
  ): number {
    const font = opts.font ?? FONTS.ui;
    const weight = opts.weight ?? 500;
    ctx.save();
    ctx.font = `${weight} ${size}px ${font}`;
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);

    const shown = lines.slice(0, maxLines);
    if (lines.length > maxLines && shown.length > 0) {
      shown[shown.length - 1] = this.ellipsize(ctx, `${shown[shown.length - 1]}…`, maxWidth);
    }
    ctx.restore();

    let cursor = y;
    for (const line of shown) {
      label(ctx, line, x, cursor, size, color, { font, weight });
      cursor += lineHeight;
    }
    return cursor;
  }
}
