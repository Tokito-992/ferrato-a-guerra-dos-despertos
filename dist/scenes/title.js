/** Tela-título: o Nexus observa enquanto o jogador escolhe o caminho. */
import { CHARACTER_ORDER, CHARACTERS } from '../data/characters.js';
import { ARC_COUNT, getArcStages, getStage, MAX_STAGE } from '../data/stages.js';
import { TITLE_QUOTE } from '../data/story.js';
import { hexToRgba } from '../core/math.js';
import { drawTitleBackground } from '../render/backgrounds.js';
import { drawCharacterSilhouette } from '../render/characters.js';
import { FONTS, glow, label, panel } from '../render/theme.js';
import { Menu } from '../ui/menu.js';
export class TitleScene {
    constructor(game) {
        this.game = game;
        this.t = 0;
        this.pulse = 0;
        this.menu = new Menu([]);
        this.buildMenu();
    }
    enter() {
        this.game.audio.playMusic(35);
        this.game.audio.playAmbience('cosmic');
        this.buildMenu();
    }
    buildMenu() {
        const save = this.game.save;
        const stage = getStage(save.maxStage);
        const hasProgress = save.cleared.length > 0;
        this.menu.setItems([
            { id: 'new', label: 'NOVO JOGO', detail: 'ARCO I · CAP. 1', accent: '#ff8a3d' },
            {
                id: 'continue',
                label: 'CONTINUAR',
                detail: hasProgress ? stage.subtitle.toUpperCase() : undefined,
                disabled: !hasProgress,
                accent: '#56e3ff',
            },
            { id: 'select', label: 'DESPERTOS & ARCOS', detail: '36 CAPÍTULOS', accent: '#b48bff' },
            { id: 'credits', label: 'CRÉDITOS', detail: 'O VÉU', accent: '#ffe6a3' },
        ]);
    }
    update(dt) {
        this.t += dt;
        this.pulse += dt;
        const action = this.menu.update(this.game.input, this.game.audio);
        if (!action)
            return;
        switch (action) {
            case 'new':
                this.game.gotoCharacterSelect(1, this.game.save.selected);
                break;
            case 'continue':
                this.game.gotoCharacterSelect(this.game.save.maxStage, this.game.save.selected);
                break;
            case 'select':
                this.game.gotoCharacterSelect(this.game.save.maxStage, this.game.save.selected);
                break;
            case 'credits':
                this.game.gotoCredits();
                break;
        }
    }
    draw(ctx) {
        const { width, height } = this.game;
        drawTitleBackground(ctx, this.t);
        // Véu escuro para leitura.
        const shade = ctx.createLinearGradient(0, 0, width * 0.75, 0);
        shade.addColorStop(0, 'rgba(4,5,10,0.94)');
        shade.addColorStop(0.55, 'rgba(4,5,10,0.68)');
        shade.addColorStop(1, 'rgba(4,5,10,0)');
        ctx.fillStyle = shade;
        ctx.fillRect(0, 0, width, height);
        // Linhas decorativas.
        ctx.save();
        ctx.strokeStyle = 'rgba(255,138,226,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(88, 132);
        ctx.lineTo(88 + 210, 132);
        ctx.stroke();
        ctx.restore();
        const kicker = 'UM BEAT \'EM UP 2D · SEIS DESPERTOS · UM VÉU FAMINTO';
        label(ctx, kicker, 90, 124, 10.5, 'rgba(235,238,250,0.55)', {
            font: FONTS.mono,
            spacing: 1.7,
        });
        // Título com gradiente.
        const grad = ctx.createLinearGradient(80, 180, 720, 300);
        grad.addColorStop(0, '#fff3d4');
        grad.addColorStop(0.34, '#ff8a3d');
        grad.addColorStop(0.68, '#ff3357');
        grad.addColorStop(1, '#b48bff');
        ctx.save();
        ctx.font = `900 118px ${FONTS.title}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.shadowColor = 'rgba(255, 51, 87, 0.45)';
        ctx.shadowBlur = 38;
        ctx.fillStyle = grad;
        ctx.fillText('FERRATO', 82, 282);
        ctx.restore();
        label(ctx, 'A GUERRA DOS DESPERTOS', 90, 328, 27, '#f2f5ff', {
            weight: 700,
            spacing: 8,
            glow: 'rgba(180,139,255,0.45)',
        });
        const lineGrad = ctx.createLinearGradient(90, 0, 660, 0);
        lineGrad.addColorStop(0, 'rgba(255,138,60,0.9)');
        lineGrad.addColorStop(0.5, 'rgba(255,51,87,0.6)');
        lineGrad.addColorStop(1, 'rgba(180,139,255,0)');
        ctx.fillStyle = lineGrad;
        ctx.fillRect(90, 344, 570, 2);
        label(ctx, `“${TITLE_QUOTE}”`, 92, 378, 14.5, 'rgba(220,226,242,0.64)', {
            font: FONTS.ui,
        });
        // Menu.
        this.menu.draw(ctx, 90, 412, 414, {
            itemHeight: 52,
            gap: 7,
            size: 19,
            accent: '#ff8a3d',
        });
        // Estatísticas do arquivo.
        const save = this.game.save;
        const sx = 930;
        const sy = 470;
        panel(ctx, sx, sy, 300, 128, {
            fill: 'rgba(5,8,16,0.6)',
            border: 'rgba(180,139,255,0.25)',
            glow: 'rgba(180,139,255,0.15)',
            cut: 12,
        });
        label(ctx, 'ARQUIVO DO VÉU', sx + 18, sy + 23, 10, 'rgba(180,139,255,0.9)', {
            font: FONTS.mono,
            spacing: 1.6,
        });
        const arcsDone = Array.from({ length: ARC_COUNT }, (_, index) => index + 1).filter((arc) => getArcStages(arc).every((chapter) => save.cleared.includes(chapter.id))).length;
        label(ctx, `CAPÍTULOS  ${save.cleared.length} / ${MAX_STAGE}`, sx + 18, sy + 47, 11, 'rgba(225,230,242,0.8)', {
            font: FONTS.mono,
            spacing: 0.8,
        });
        label(ctx, `ARCOS  ${arcsDone} / ${ARC_COUNT}`, sx + 18, sy + 64, 11, 'rgba(225,230,242,0.8)', {
            font: FONTS.mono,
            spacing: 0.8,
        });
        label(ctx, `ABATES  ${String(save.kills).padStart(4, '0')}`, sx + 18, sy + 81, 11, 'rgba(225,230,242,0.8)', {
            font: FONTS.mono,
            spacing: 0.8,
        });
        label(ctx, `MELHOR COMBO  ${String(save.bestCombo).padStart(3, '0')}`, sx + 18, sy + 98, 11, 'rgba(225,230,242,0.8)', {
            font: FONTS.mono,
            spacing: 0.8,
        });
        label(ctx, `RECORDE  ${String(save.bestScore).padStart(6, '0')}  ·  RANK ${save.bestRank}`, sx + 18, sy + 115, 10.5, '#ff9bb8', {
            font: FONTS.mono,
            spacing: 0.8,
            glow: 'rgba(255,106,154,0.35)',
        });
        label(ctx, `${save.unlocked.length} / 6 DESPERTOS`, sx + 282, sy + 23, 10, 'rgba(255,230,163,0.7)', {
            font: FONTS.mono,
            align: 'right',
            spacing: 0.8,
        });
        // Silhuetas dos Despertos na plataforma.
        CHARACTER_ORDER.forEach((id, i) => {
            const def = CHARACTERS[id];
            const x = 748 + i * 82;
            const unlocked = save.unlocked.includes(id);
            const bob = Math.sin(this.t * (1.1 + i * 0.08) + i) * 2.5;
            glow(ctx, x, 664, 46, unlocked ? def.colors.aura : '#3a3a4a', unlocked ? 0.16 : 0.05);
            ctx.save();
            ctx.globalAlpha = unlocked ? 0.8 : 0.22;
            drawCharacterSilhouette(ctx, id, x, 700 + bob, 0.86, unlocked ? def.colors.primary : '#1a1a24');
            ctx.restore();
            if (unlocked) {
                label(ctx, def.name.toUpperCase(), x, 714, 8.5, hexToRgba(def.colors.accent, 0.6), {
                    align: 'center',
                    font: FONTS.mono,
                    spacing: 1.1,
                });
            }
        });
        // Dica inferior.
        label(ctx, 'SETAS NAVEGAR   ENTER CONFIRMAR   M ÁUDIO', 90, 694, 10, 'rgba(190,198,220,0.45)', {
            font: FONTS.mono,
            spacing: 1.1,
        });
        label(ctx, 'HTML5 · CANVAS 2D · TYPESCRIPT · ARTE PROCEDURAL', width - 26, 694, 9.5, 'rgba(160,168,190,0.35)', {
            align: 'right',
            font: FONTS.mono,
            spacing: 0.8,
        });
        // Pulso do olho.
        const pulse = 0.5 + Math.sin(this.pulse * 1.2) * 0.5;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.15 + pulse * 0.12;
        const g = ctx.createRadialGradient(920, 320, 20, 920, 320, 250);
        g.addColorStop(0, 'rgba(255,138,226,0.6)');
        g.addColorStop(1, 'rgba(255,138,226,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(920, 320, 250, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (this.game.save.cleared.length === 0) {
            const a = 0.55 + Math.sin(this.t * 2.1) * 0.18;
            label(ctx, 'A PRIMEIRA FAÍSCA ESPERA POR VOCÊ', 90, 682, 10.5, `rgba(255,209,102,${a})`, {
                font: FONTS.mono,
                spacing: 1.6,
            });
        }
    }
}
//# sourceMappingURL=title.js.map