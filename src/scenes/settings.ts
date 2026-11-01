/** Configurações: layout dos controles de toque, dock, áudio e tutorial. */

import type { Game, Scene } from '../core/game.js';
import { hexToRgba } from '../core/math.js';
import { drawTitleBackground } from '../render/backgrounds.js';
import { drawCharacterSilhouette } from '../render/characters.js';
import { FONTS, label, panel, roundRectPath } from '../render/theme.js';
import { Menu } from '../ui/menu.js';

export class SettingsScene implements Scene {
  private menu: Menu;
  private t = 0;

  constructor(private readonly game: Game) {
    this.menu = new Menu([]);
    this.buildMenu();
  }

  enter(): void {
    this.game.audio.playMusic(35);
    this.game.audio.playAmbience('cosmic');
    this.buildMenu();
  }

  private sideDetail(): string {
    return this.game.save.touchLayout === 'lefty'
      ? 'CANHOTO · MOVER À DIREITA'
      : 'PADRÃO · MOVER À ESQUERDA';
  }

  private dockDetail(): string {
    return this.game.save.touchDock === 'top' ? 'SUPERIOR' : 'INFERIOR';
  }

  private buildMenu(keepIndex = false): void {
    this.menu.setItems(
      [
        {
          id: 'side',
          label: 'LADO DOS CONTROLES',
          detail: this.sideDetail(),
          accent: '#56e3ff',
        },
        {
          id: 'dock',
          label: 'DOCK DOS CONTROLES',
          detail: this.dockDetail(),
          accent: '#b48bff',
        },
        {
          id: 'audio',
          label: 'ÁUDIO',
          detail: this.game.save.muted ? 'SILENCIADO' : 'LIGADO',
          accent: '#ff8a3d',
        },
        {
          id: 'tutorial',
          label: 'VER TUTORIAL',
          detail: 'COMO JOGAR',
          accent: '#ffd166',
        },
        { id: 'back', label: 'VOLTAR', detail: 'MENU PRINCIPAL', accent: '#ff6a7a' },
      ],
      keepIndex,
    );
  }

  private cycle(id: string): void {
    const save = this.game.save;
    switch (id) {
      case 'side':
        save.touchLayout = save.touchLayout === 'lefty' ? 'standard' : 'lefty';
        this.game.applyTouchSettings();
        break;
      case 'dock':
        save.touchDock = save.touchDock === 'top' ? 'bottom' : 'top';
        this.game.applyTouchSettings();
        break;
      case 'audio': {
        const muted = this.game.audio.toggleMuted();
        save.muted = muted;
        break;
      }
      case 'tutorial':
        this.game.gotoTutorial(() => this.game.gotoSettings());
        return;
      case 'back':
        this.game.gotoTitle();
        return;
      default:
        return;
    }
    this.game.persist();
    this.buildMenu(true);
    this.game.audio.sfx('select');
  }

  update(dt: number): void {
    this.t += dt;
    const input = this.game.input;
    if (input.pressed('back') || input.pressed('pause')) {
      this.game.audio.sfx('ui');
      this.game.gotoTitle();
      return;
    }

    if (input.pressed('left') || input.pressed('right')) {
      const id = this.menu.selected?.id;
      if (id === 'side' || id === 'dock' || id === 'audio') this.cycle(id);
      return;
    }

    const action = this.menu.update(input, this.game.audio);
    if (action) this.cycle(action);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.game;
    drawTitleBackground(ctx, this.t);

    const shade = ctx.createLinearGradient(0, 0, width * 0.78, 0);
    shade.addColorStop(0, 'rgba(4,5,10,0.95)');
    shade.addColorStop(0.6, 'rgba(4,5,10,0.78)');
    shade.addColorStop(1, 'rgba(4,5,10,0.3)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, height);

    label(ctx, 'CONFIGURAÇÕES', 90, 112, 42, '#f4f7ff', {
      weight: 800,
      spacing: 7,
      glow: 'rgba(86,227,255,0.42)',
    });
    label(ctx, 'CONTROLES, TELA E ACESSIBILIDADE', 92, 136, 10.5, 'rgba(86,227,255,0.72)', {
      font: FONTS.mono,
      spacing: 2.1,
    });
    label(ctx, 'AS ALTERAÇÕES SÃO SALVAS AUTOMATICAMENTE', width - 92, 136, 9.5, 'rgba(190,198,220,0.45)', {
      align: 'right',
      font: FONTS.mono,
      spacing: 1.1,
    });

    this.menu.draw(ctx, 90, 198, 520, {
      itemHeight: 52,
      gap: 8,
      size: 17,
      accent: '#56e3ff',
    });

    label(ctx, '◀ ▶ ALTERAR   ·   ENTER / TOQUE CONFIRMAR', 90, 616, 10, 'rgba(190,198,220,0.52)', {
      font: FONTS.mono,
      spacing: 1.2,
    });
    label(ctx, 'ESC / BOTÃO VOLTAR: MENU PRINCIPAL', 90, 638, 9.5, 'rgba(170,178,200,0.4)', {
      font: FONTS.mono,
      spacing: 1.1,
    });

    this.drawPreview(ctx, 686, 190, 504, 388);
  }

  private drawPreview(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    panel(ctx, x, y, w, h, {
      fill: 'rgba(5,8,16,0.82)',
      border: 'rgba(180,139,255,0.3)',
      glow: 'rgba(180,139,255,0.14)',
      cut: 16,
    });
    label(ctx, 'PRÉVIA DOS CONTROLES', x + 22, y + 28, 10, 'rgba(180,139,255,0.9)', {
      font: FONTS.mono,
      spacing: 1.6,
    });
    label(ctx, this.game.save.touchLayout === 'lefty' ? 'CANHOTO' : 'PADRÃO', x + w - 22, y + 28, 9, 'rgba(255,255,255,0.55)', {
      align: 'right',
      font: FONTS.mono,
      spacing: 1.2,
    });

    const fx = x + 28;
    const fy = y + 54;
    const fw = w - 56;
    const fh = 214;
    const dockH = 62;
    const dockTop = this.game.save.touchDock === 'top';

    // Moldura do "celular" em paisagem.
    ctx.save();
    roundRectPath(ctx, fx, fy, fw, fh, 14);
    ctx.fillStyle = '#02040a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    const arenaY = dockTop ? fy + dockH : fy;
    const arenaH = fh - dockH;
    const arenaGrad = ctx.createLinearGradient(fx, arenaY, fx, arenaY + arenaH);
    arenaGrad.addColorStop(0, 'rgba(72,26,38,0.9)');
    arenaGrad.addColorStop(1, 'rgba(8,8,18,0.96)');
    ctx.fillStyle = arenaGrad;
    ctx.fillRect(fx + 2, arenaY + 2, fw - 4, arenaH - 4);

    // Chão e silhuetas.
    ctx.strokeStyle = 'rgba(255,138,60,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fx + 10, arenaY + arenaH - 24);
    ctx.lineTo(fx + fw - 10, arenaY + arenaH - 24);
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.8;
    drawCharacterSilhouette(ctx, 'ravi', fx + fw * 0.42, arenaY + arenaH - 30, 0.62, '#ff8a3d');
    ctx.globalAlpha = 0.42;
    drawCharacterSilhouette(ctx, 'ozric', fx + fw * 0.7, arenaY + arenaH - 30, 0.58, '#b48bff');
    ctx.restore();

    // Dock.
    const dy = dockTop ? fy + 2 : fy + fh - dockH - 2;
    const dockGrad = ctx.createLinearGradient(fx, dy, fx, dy + dockH);
    dockGrad.addColorStop(0, 'rgba(9,12,22,0.98)');
    dockGrad.addColorStop(1, 'rgba(3,5,12,0.98)');
    ctx.fillStyle = dockGrad;
    ctx.fillRect(fx + 2, dy, fw - 4, dockH);
    ctx.strokeStyle = 'rgba(86,227,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(fx + 2, dockTop ? dy + dockH : dy);
    ctx.lineTo(fx + fw - 2, dockTop ? dy + dockH : dy);
    ctx.stroke();

    const lefty = this.game.save.touchLayout === 'lefty';
    const moveX = lefty ? fx + fw - 54 : fx + 54;
    const actionX = lefty ? fx + 82 : fx + fw - 82;
    const cy = dy + dockH / 2;

    // Movimento.
    this.circle(ctx, moveX - 24, cy, 17, '◀', '#56e3ff');
    this.circle(ctx, moveX + 24, cy, 17, '▶', '#56e3ff');
    label(ctx, 'MOVER', moveX, dy + dockH - 8, 7, 'rgba(86,227,255,0.65)', {
      align: 'center',
      font: FONTS.mono,
      spacing: 0.8,
    });

    // Ações.
    const actionIcons: [string, string][] = [
      ['⤒', '#ffd166'],
      ['⚔', '#ff7a3c'],
      ['✹', '#ff7a3c'],
      ['»', '#ff7a3c'],
      ['✦', '#56e3ff'],
    ];
    actionIcons.forEach(([icon, color], i) => {
      const offset = (i - 2) * 26;
      this.circle(ctx, actionX + offset, cy, i === 4 ? 18 : 14, icon, color);
    });
    label(ctx, 'AÇÕES', actionX, dy + dockH - 8, 7, 'rgba(255,122,60,0.65)', {
      align: 'center',
      font: FONTS.mono,
      spacing: 0.8,
    });

    // Pausa e fullscreen no centro.
    this.circle(ctx, fx + fw / 2 - 16, cy, 11, 'Ⅱ', 'rgba(255,255,255,0.55)');
    this.circle(ctx, fx + fw / 2 + 16, cy, 11, '⛶', 'rgba(255,255,255,0.55)');

    // Legendas.
    label(ctx, dockTop ? 'DOCK SUPERIOR' : 'DOCK INFERIOR', x + w / 2, y + 300, 9, 'rgba(190,198,220,0.55)', {
      align: 'center',
      font: FONTS.mono,
      spacing: 1.4,
    });
    label(ctx, 'A prévia acompanha o layout salvo neste dispositivo.', x + w / 2, y + 326, 10, 'rgba(190,198,220,0.45)', {
      align: 'center',
      font: FONTS.ui,
    });
    label(ctx, 'Use “LADO DOS CONTROLES” para trocar as mãos.', x + w / 2, y + 350, 9.5, 'rgba(255,209,102,0.6)', {
      align: 'center',
      font: FONTS.mono,
      spacing: 0.8,
    });
  }

  private circle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    icon: string,
    color: string,
  ): void {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(color, 0.18);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(color, 0.7);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#f4f7ff';
    ctx.font = `700 ${Math.max(9, r * 0.8)}px ${FONTS.ui}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, x, y + 0.5);
    ctx.restore();
  }
}
