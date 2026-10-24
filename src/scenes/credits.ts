/** Créditos finais com rolagem cinematográfica. */

import type { Game, Scene } from '../core/game.js';
import { CREDITS, TITLE_QUOTE } from '../data/story.js';
import { clamp, hexToRgba } from '../core/math.js';
import { drawTitleBackground } from '../render/backgrounds.js';
import { FONTS, label } from '../render/theme.js';

const LINE_H = 78;

export class CreditsScene implements Scene {
  private t = 0;
  private scroll = 0;
  private finished = false;

  constructor(private readonly game: Game) {}

  enter(): void {
    this.game.audio.playMusic(5);
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.game.gotoTitle();
  }

  update(dt: number): void {
    this.t += dt;
    this.scroll += dt * 43;
    if (this.t > 0.85) {
      const input = this.game.input;
      if (
        input.pressed('confirm') ||
        input.pressed('back') ||
        input.pressed('pause') ||
        input.pressed('attack') ||
        input.pressed('jump') ||
        input.mouse.clicked
      ) {
        this.finish();
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.game;
    drawTitleBackground(ctx, this.t);
    ctx.fillStyle = 'rgba(3,4,9,0.62)';
    ctx.fillRect(0, 0, width, height);

    // Header fixo.
    ctx.fillStyle = 'rgba(3,4,9,0.94)';
    ctx.fillRect(0, 0, width, 100);
    ctx.strokeStyle = 'rgba(255,230,163,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.lineTo(width, 100);
    ctx.moveTo(0, 686);
    ctx.lineTo(width, 686);
    ctx.stroke();
    label(ctx, 'CRÉDITOS', width / 2, 48, 30, '#f4f7ff', {
      align: 'center',
      weight: 800,
      spacing: 8,
      glow: 'rgba(255,230,163,0.42)',
    });
    label(ctx, 'FERRATO · A GUERRA DOS DESPERTOS', width / 2, 74, 9.5, 'rgba(255,230,163,0.62)', {
      align: 'center',
      font: FONTS.mono,
      spacing: 2.4,
    });
    label(ctx, this.t > 0.85 ? 'ENTER / ESC VOLTAR' : 'ABRINDO O VÉU…', width - 28, 54, 9.5, 'rgba(200,208,228,0.5)', {
      align: 'right',
      font: FONTS.mono,
      spacing: 1.2,
    });

    // Área rolável.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 101, width, 584);
    ctx.clip();

    const base = 630 - this.scroll;
    const fadeTop = ctx.createLinearGradient(0, 101, 0, 166);
    const fadeBottom = ctx.createLinearGradient(0, 604, 0, 685);

    // Bloco de abertura.
    this.drawLine(base, 0, 'UMA HISTÓRIA DE', '', 'rgba(190,198,220,0.55)', 9.5);
    this.drawLine(base, 30, 'FERRATO', '', '#ffe6a3', 46, true);
    this.drawLine(base, 58, 'A GUERRA DOS DESPERTOS', '', 'rgba(235,238,250,0.82)', 14);
    this.drawLine(base, 104, 'SEIS DESPERTOS. UM VÉU FAMINTO. UMA ESCOLHA.', '', 'rgba(190,198,220,0.5)', 9.5);

    const listTop = 178;
    CREDITS.forEach((line, i) => {
      const y = base + listTop + i * LINE_H;
      this.drawLine(y, 0, line.role.toUpperCase(), line.names, '#ffe6a3', 10, false, true);
    });

    const endY = base + listTop + CREDITS.length * LINE_H + 66;
    this.drawLine(endY, 0, 'OBRIGADO POR JOGAR', '', '#ffffff', 24, true);
    this.drawLine(endY + 34, 0, `“${TITLE_QUOTE}”`, '', 'rgba(220,226,242,0.58)', 11);
    this.drawLine(endY + 70, 0, 'O AMANHÃ AINDA VAI EXISTIR.', '', 'rgba(255,230,163,0.65)', 10);

    // Névoa nas bordas do recorte.
    ctx.fillStyle = fadeTop;
    ctx.fillRect(0, 101, width, 65);
    ctx.fillStyle = fadeBottom;
    ctx.fillRect(0, 604, width, 82);
    ctx.restore();

    // Prompt final.
    const endReached = this.scroll > base + listTop + CREDITS.length * LINE_H + 40;
    if (endReached) {
      const a = 0.55 + Math.sin(this.t * 4) * 0.3;
      label(ctx, 'ENTER PARA VOLTAR AO MENU', width / 2, 674, 10, `rgba(255,230,163,${a})`, {
        align: 'center',
        font: FONTS.mono,
        spacing: 2,
      });
    } else {
      label(ctx, 'M ÁUDIO · ESC PULAR', width / 2, 674, 9, 'rgba(170,178,200,0.4)', {
        align: 'center',
        font: FONTS.mono,
        spacing: 1.6,
      });
    }

    // Moldura decorativa.
    const edge = ctx.createLinearGradient(0, 0, 0, height);
    edge.addColorStop(0, 'rgba(255,230,163,0.05)');
    edge.addColorStop(0.5, 'rgba(255,230,163,0)');
    edge.addColorStop(1, 'rgba(180,139,255,0.06)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, width, height);

    // Poeira dourada.
    for (let i = 0; i < 22; i++) {
      const x = ((i * 191 + this.t * (7 + (i % 4) * 4)) % (width + 60)) - 30;
      const y = 120 + ((i * 97 + this.t * (12 + (i % 3) * 7)) % 540);
      const a = clamp(0.2 + Math.sin(this.t * 1.7 + i) * 0.18, 0, 0.5);
      ctx.fillStyle = hexToRgba(i % 3 === 0 ? '#ff8ae2' : '#ffe6a3', a);
      ctx.fillRect(x, y, 1.6, 1.6);
    }
  }

  private drawLine(
    y: number,
    xOffset: number,
    left: string,
    right: string,
    color: string,
    size: number,
    centered = false,
    mono = false,
  ): void {
    const ctx = this.game.ctx;
    if (y < 90 || y > 700) return;
    if (centered) {
      label(ctx, left, this.game.width / 2 + xOffset, y, size, color, {
        align: 'center',
        weight: size >= 20 ? 800 : 600,
        spacing: size >= 20 ? 4 : 1.6,
        glow: size >= 20 ? hexToRgba(color, 0.35) : undefined,
      });
      return;
    }
    if (mono) {
      label(ctx, left, this.game.width / 2 - 26, y, size, 'rgba(190,198,220,0.55)', {
        align: 'right',
        font: FONTS.mono,
        spacing: 1.4,
      });
      label(ctx, right, this.game.width / 2 - 4, y, size + 6, color, {
        font: FONTS.ui,
        weight: 700,
        spacing: 0.5,
      });
      return;
    }
    label(ctx, left, this.game.width / 2, y, size, color, {
      align: 'center',
      font: FONTS.mono,
      spacing: 1.8,
    });
    if (right) {
      label(ctx, right, this.game.width / 2, y + 18, size + 2, 'rgba(236,240,250,0.82)', {
        align: 'center',
        font: FONTS.ui,
        weight: 600,
      });
    }
  }
}
