/** Cutscenes de abertura e encerramento, com retratos e efeito de máquina de escrever. */

import type { Game, Scene } from '../core/game.js';
import type { StageDef } from '../data/stages.js';
import type { StoryBeat, SpeakerId } from '../data/story.js';
import { STORY } from '../data/story.js';
import { CHARACTERS } from '../data/characters.js';
import { clamp, hexToRgba, TAU } from '../core/math.js';
import { drawStageBackground } from '../render/backgrounds.js';
import { drawCharacterPortrait } from '../render/characters.js';
import { FONTS, glow, label, panel, roundRectPath } from '../render/theme.js';

type StoryPhase = 'intro' | 'outro';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

const SPEAKER_META: Record<SpeakerId, { name: string; color: string; role: string }> = {
  narrator: { name: 'NARRADOR', color: '#ffe6a3', role: 'A VOZ DO VÉU' },
  ferrato: { name: 'FERRATO', color: '#ff8ae2', role: 'CONSCIÊNCIA DO VÉU' },
  boss: { name: 'FERRATO', color: '#ff5a7a', role: 'A FOME' },
  ravi: { name: 'RAVI', color: CHARACTERS.ravi.colors.accent, role: 'O PULSO · DESPERTO' },
  miriam: { name: 'MIRIAM', color: CHARACTERS.miriam.colors.accent, role: 'A QUEBRA-OSSOS · DESPERTA' },
  kael: { name: 'KAEL', color: CHARACTERS.kael.colors.accent, role: 'ZERO-G · DESPERTO' },
  ozric: { name: 'OZRIC', color: CHARACTERS.ozric.colors.accent, role: 'O EXILADO · DESPERTO' },
  elodie: { name: 'ÉLODIE', color: CHARACTERS.elodie.colors.accent, role: 'LÂMINA CELESTE · DESPERTA' },
  thryc: { name: 'THRYC', color: CHARACTERS.thryc.colors.accent, role: 'ECO DO NEXUS · DESPERTO' },
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number, size: number, font = FONTS.ui): string[] {
  ctx.save();
  ctx.font = `500 ${size}px ${font}`;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  ctx.restore();
  return lines;
}

export class StoryScene implements Scene {
  private beats: StoryBeat[];
  private index = 0;
  private typed = 0;
  private t = 0;
  private finished = false;
  private onDone: () => void;
  private scrollCamera: number;

  constructor(
    private readonly game: Game,
    private readonly stage: StageDef,
    private readonly phase: StoryPhase,
    onDone: () => void,
  ) {
    this.beats = STORY[stage.id]?.[phase] ?? [];
    this.onDone = onDone;
    this.scrollCamera = (stage.width - game.width) * (phase === 'intro' ? 0.16 : 0.52);
  }

  enter(): void {
    this.game.audio.playMusic(this.stage.music);
    if (this.beats.length === 0) this.finish();
  }

  private get beat(): StoryBeat | null {
    return this.beats[this.index] ?? null;
  }

  private get fullText(): string {
    return this.beat?.text ?? '';
  }

  private get textComplete(): boolean {
    return this.typed >= this.fullText.length;
  }

  private advance(): void {
    if (this.finished) return;
    if (!this.textComplete) {
      this.typed = this.fullText.length;
      this.game.audio.sfx('ui');
      return;
    }
    if (this.index < this.beats.length - 1) {
      this.index++;
      this.typed = 0;
      this.game.audio.sfx('select');
      return;
    }
    this.finish();
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.game.transitionTo(this.onDone, '#030409', 0.45);
  }

  update(dt: number): void {
    this.t += dt;
    const input = this.game.input;

    if (input.pressed('back') || input.pressed('pause')) {
      this.game.audio.sfx('ui');
      this.finish();
      return;
    }

    if (this.textComplete) {
      this.typed = this.fullText.length;
    } else {
      this.typed = Math.min(this.fullText.length, this.typed + dt * 52);
    }

    if (input.pressed('confirm') || input.pressed('attack') || input.pressed('jump') || input.mouse.clicked) {
      this.advance();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.drawBackdrop(ctx);
    const beat = this.beat;
    if (!beat) return;

    const meta = SPEAKER_META[beat.who] ?? SPEAKER_META.narrator;

    // Barras de cinema.
    ctx.fillStyle = 'rgba(2,3,7,0.92)';
    ctx.fillRect(0, 0, this.game.width, 46);
    ctx.fillRect(0, 686, this.game.width, 34);
    ctx.strokeStyle = hexToRgba(meta.color, 0.25);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 46);
    ctx.lineTo(this.game.width, 46);
    ctx.moveTo(0, 686);
    ctx.lineTo(this.game.width, 686);
    ctx.stroke();

    label(ctx, `FASE ${ROMAN[this.stage.id - 1]} · ${this.stage.name.toUpperCase()}`, 26, 30, 10, hexToRgba(this.stage.palette.accent, 0.8), {
      font: FONTS.mono,
      spacing: 1.4,
    });
    label(ctx, this.phase === 'intro' ? 'ABERTURA' : 'ENCERRAMENTO', this.game.width / 2, 30, 10, 'rgba(190,198,220,0.45)', {
      align: 'center',
      font: FONTS.mono,
      spacing: 2.4,
    });
    label(ctx, 'ESC PULAR CENA', this.game.width - 26, 30, 9.5, 'rgba(190,198,220,0.4)', {
      align: 'right',
      font: FONTS.mono,
      spacing: 1.2,
    });

    // Painel de diálogo.
    const panelX = 112;
    const panelY = 468;
    const panelW = 1056;
    const panelH = 208;
    panel(ctx, panelX, panelY, panelW, panelH, {
      fill: 'rgba(4,6,14,0.9)',
      border: hexToRgba(meta.color, 0.32),
      glow: hexToRgba(meta.color, 0.14),
      cut: 18,
    });
    ctx.fillStyle = hexToRgba(meta.color, 0.7);
    ctx.fillRect(panelX, panelY, 3, panelH);

    // Retrato.
    this.drawSpeaker(ctx, beat.who, 200, 492, meta.color);

    // Nome e função.
    label(ctx, meta.name, 314, 512, 26, '#f4f7ff', {
      weight: 800,
      spacing: 3,
      glow: hexToRgba(meta.color, 0.4),
    });
    label(ctx, meta.role, 314, 531, 9.5, hexToRgba(meta.color, 0.8), {
      font: FONTS.mono,
      spacing: 1.4,
    });

    ctx.strokeStyle = hexToRgba(meta.color, 0.2);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(314, 542);
    ctx.lineTo(1128, 542);
    ctx.stroke();

    // Texto com máquina de escrever.
    const text = this.fullText;
    const lines = wrapText(ctx, text, 800, 18);
    const visible = Math.floor(this.typed);
    let used = 0;
    let ly = 574;
    for (const line of lines) {
      if (used >= visible) break;
      const remaining = visible - used;
      const part = line.slice(0, Math.min(line.length, remaining));
      label(ctx, part, 314, ly, 18, 'rgba(236,240,250,0.92)', {
        font: FONTS.ui,
        weight: 500,
      });
      used += line.length + 1; // + espaço entre palavras
      ly += 28;
    }

    // Indicador de continuação.
    if (this.textComplete) {
      const a = 0.55 + Math.sin(this.t * 4.2) * 0.3;
      label(ctx, 'ENTER', 1136, 650, 10, `rgba(255,255,255,${a})`, {
        align: 'right',
        font: FONTS.mono,
        spacing: 1.4,
      });
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath();
      ctx.moveTo(1146, 643);
      ctx.lineTo(1154, 650);
      ctx.lineTo(1146, 657);
      ctx.closePath();
      ctx.fill();
    } else {
      // Cursor de digitação.
      ctx.fillStyle = hexToRgba(meta.color, 0.8);
      const lastPart = lines[0]?.slice(0, Math.max(0, visible)) ?? '';
      ctx.font = `500 18px ${FONTS.ui}`;
      const tw = Math.min(800, ctx.measureText(lastPart).width);
      const cx = 314 + tw;
      const cy = 574 + Math.min(lines.length - 1, Math.floor(visible / 80)) * 28;
      ctx.fillRect(cx + 2, cy - 14, 2, 18);
    }

    // Pips de progresso.
    const pipW = 20;
    const totalW = this.beats.length * (pipW + 5) - 5;
    this.beats.forEach((_, i) => {
      const x = this.game.width / 2 - totalW / 2 + i * (pipW + 5);
      ctx.fillStyle = i < this.index ? hexToRgba(meta.color, 0.8) : i === this.index ? '#ffffff' : 'rgba(255,255,255,0.15)';
      ctx.fillRect(x, 664, pipW, 2);
    });
    label(ctx, `${this.index + 1} / ${this.beats.length}`, 1136, 674, 9, 'rgba(170,178,200,0.4)', {
      align: 'right',
      font: FONTS.mono,
      spacing: 1,
    });

    label(ctx, 'ENTER / CLIQUE AVANÇAR', 314, 674, 9, 'rgba(170,178,200,0.35)', {
      font: FONTS.mono,
      spacing: 1.1,
    });
  }

  private drawBackdrop(ctx: CanvasRenderingContext2D): void {
    drawStageBackground(ctx, this.stage, this.scrollCamera, this.t);
    const shade = ctx.createLinearGradient(0, 0, 0, this.game.height);
    shade.addColorStop(0, 'rgba(3,4,9,0.55)');
    shade.addColorStop(0.55, 'rgba(3,4,9,0.42)');
    shade.addColorStop(1, 'rgba(3,4,9,0.78)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, this.game.width, this.game.height);

    // Foco de luz atrás do retrato.
    glow(ctx, 200, 492, 190, SPEAKER_META[this.beat?.who ?? 'narrator'].color, 0.12);
  }

  private drawSpeaker(ctx: CanvasRenderingContext2D, who: SpeakerId, cx: number, cy: number, color: string): void {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 74, 0, TAU);
    ctx.fillStyle = 'rgba(2,4,10,0.7)';
    ctx.fill();
    ctx.strokeStyle = hexToRgba(color, 0.4);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.clip();

    if (who === 'narrator') {
      // Sigilo do narrador.
      const t = this.t;
      ctx.translate(cx, cy);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 72);
      g.addColorStop(0, hexToRgba(color, 0.35));
      g.addColorStop(1, hexToRgba(color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(-74, -74, 148, 148);
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = hexToRgba(color, 0.38 - i * 0.08);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 28 + i * 13, 14 + i * 8, t * (0.2 + i * 0.1), 0, TAU);
        ctx.stroke();
      }
      ctx.fillStyle = hexToRgba(color, 0.85);
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 18, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#05030b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.5, 13, 0, 0, TAU);
      ctx.fill();
    } else if (who === 'ferrato' || who === 'boss') {
      // Olho cósmico do Ferrato.
      const t = this.t;
      ctx.translate(cx, cy);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 74);
      g.addColorStop(0, hexToRgba('#ffffff', 0.45));
      g.addColorStop(0.3, hexToRgba(color, 0.4));
      g.addColorStop(1, hexToRgba(color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(-74, -74, 148, 148);
      ctx.strokeStyle = hexToRgba(color, 0.5);
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 54 + i * 9, 22 + i * 4, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.fillStyle = '#05030b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 44, 20, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = hexToRgba(color, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 15, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#05030b';
      ctx.beginPath();
      ctx.ellipse(Math.sin(t * 0.4) * 6, 0, 3.5, 13, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(-6, -6, 2.4, 0, TAU);
      ctx.fill();
    } else {
      const def = CHARACTERS[who as keyof typeof CHARACTERS];
      if (def) {
        drawCharacterPortrait(ctx, def, cx, cy + 12, 150, this.t, false);
      }
    }
    ctx.restore();

    // Aro externo.
    ctx.save();
    ctx.strokeStyle = hexToRgba(color, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 75, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
}
