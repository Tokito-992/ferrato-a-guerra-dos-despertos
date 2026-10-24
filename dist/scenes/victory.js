/** Tela de vitória: o Véu se fecha, os seis Despertos respiram. */
import { CHARACTERS, CHARACTER_ORDER } from '../data/characters.js';
import { STAGES } from '../data/stages.js';
import { clamp, hexToRgba, TAU } from '../core/math.js';
import { drawTitleBackground } from '../render/backgrounds.js';
import { drawCharacterPortrait } from '../render/characters.js';
import { FONTS, glow, label, panel } from '../render/theme.js';
import { Menu } from '../ui/menu.js';
export class VictoryScene {
    constructor(game, charId) {
        this.game = game;
        this.charId = charId;
        this.t = 0;
        this.lockT = 0.9;
        this.menu = new Menu([
            { id: 'free', label: 'MODO LIVRE', detail: 'FASES & DESPERTOS', accent: '#56e3ff' },
            { id: 'credits', label: 'CRÉDITOS', detail: 'O VÉU', accent: '#ffe6a3' },
            { id: 'title', label: 'MENU PRINCIPAL', detail: 'ARQUIVO SALVO', accent: '#ff8a3d' },
        ]);
    }
    enter() {
        this.game.audio.playMusic(5);
        this.game.audio.sfx('victory');
        this.game.persist();
    }
    update(dt) {
        this.t += dt;
        this.lockT = Math.max(0, this.lockT - dt);
        if (this.lockT > 0)
            return;
        const action = this.menu.update(this.game.input, this.game.audio);
        if (!action)
            return;
        switch (action) {
            case 'free':
                this.game.gotoCharacterSelect(this.game.save.maxStage, this.charId);
                break;
            case 'credits':
                this.game.gotoCredits();
                break;
            case 'title':
                this.game.gotoTitle();
                break;
        }
    }
    draw(ctx) {
        const { width, height } = this.game;
        drawTitleBackground(ctx, this.t);
        // Véu lumoso por cima do Nexus.
        const veil = ctx.createRadialGradient(width / 2, 280, 30, width / 2, 280, 760);
        veil.addColorStop(0, 'rgba(255,230,163,0.24)');
        veil.addColorStop(0.45, 'rgba(255,138,226,0.1)');
        veil.addColorStop(1, 'rgba(4,5,10,0)');
        ctx.fillStyle = veil;
        ctx.fillRect(0, 0, width, height);
        // Raios de aurora.
        ctx.save();
        ctx.translate(width / 2, 300);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 9; i++) {
            const a = (i / 9) * TAU + this.t * 0.035;
            const g = ctx.createLinearGradient(0, 0, Math.cos(a) * 620, Math.sin(a) * 620);
            g.addColorStop(0, `rgba(255,230,163,${0.05 + (i % 3) * 0.012})`);
            g.addColorStop(1, 'rgba(180,139,255,0)');
            ctx.strokeStyle = g;
            ctx.lineWidth = 20 + (i % 4) * 9;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * 620, Math.sin(a) * 620);
            ctx.stroke();
        }
        ctx.restore();
        // Sombras de cinema.
        ctx.fillStyle = 'rgba(3,4,9,0.42)';
        ctx.fillRect(0, 0, width, 94);
        const bottom = ctx.createLinearGradient(0, height - 250, 0, height);
        bottom.addColorStop(0, 'rgba(3,4,9,0)');
        bottom.addColorStop(1, 'rgba(3,4,9,0.92)');
        ctx.fillStyle = bottom;
        ctx.fillRect(0, height - 250, width, 250);
        label(ctx, 'FASE VI CONCLUÍDA · O NEXUS SE CALA', width / 2, 50, 10.5, 'rgba(255,230,163,0.78)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 2.2,
        });
        label(ctx, 'A GUERRA DOS DESPERTOS', width / 2, 78, 9.5, 'rgba(190,198,220,0.42)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 2.8,
        });
        const titleGrad = ctx.createLinearGradient(width / 2 - 380, 0, width / 2 + 380, 0);
        titleGrad.addColorStop(0, '#fff3d4');
        titleGrad.addColorStop(0.38, '#ffe6a3');
        titleGrad.addColorStop(0.66, '#ff8ae2');
        titleGrad.addColorStop(1, '#b48bff');
        ctx.save();
        ctx.font = `900 76px ${FONTS.title}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.shadowColor = 'rgba(255,230,163,0.45)';
        ctx.shadowBlur = 42;
        ctx.fillStyle = titleGrad;
        ctx.fillText('O VÉU SE FECHOU', width / 2, 190);
        ctx.restore();
        label(ctx, 'NÃO COM VIOLÊNCIA — COM CUIDADO, COMO ALGUÉM COSTURANDO UMA FERIDA.', width / 2, 222, 11, 'rgba(235,238,250,0.72)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.6,
        });
        // Estatísticas.
        const px = width / 2 - 270;
        panel(ctx, px, 254, 540, 106, {
            fill: 'rgba(5,8,16,0.64)',
            border: 'rgba(255,230,163,0.28)',
            glow: 'rgba(255,230,163,0.14)',
            cut: 14,
        });
        const stats = [
            ['FASES SELADAS', '6 / 6'],
            ['ABATES TOTAIS', String(this.game.save.kills).padStart(4, '0')],
            ['MELHOR COMBO', String(this.game.save.bestCombo).padStart(3, '0')],
            ['QUEDAS', String(this.game.save.deaths).padStart(2, '0')],
        ];
        stats.forEach(([k, v], i) => {
            const sx = px + 44 + i * 128;
            label(ctx, v, sx, 302, 27, '#ffffff', { weight: 800, glow: 'rgba(255,230,163,0.3)' });
            label(ctx, k, sx, 322, 8.5, 'rgba(190,198,220,0.55)', { font: FONTS.mono, spacing: 0.8 });
        });
        const names = ['RAVI', 'MIRIAM', 'KAEL', 'OZRIC', 'ÉLODIE', 'THRYC'];
        label(ctx, `DESPERTO FINAL — ${CHARACTERS[this.charId].name.toUpperCase()} · ${names.join(' · ')}`, width / 2, 346, 9.5, 'rgba(255,230,163,0.68)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.2,
        });
        // Line-up dos seis.
        CHARACTER_ORDER.forEach((id, i) => {
            const def = CHARACTERS[id];
            const x = width / 2 - 375 + i * 150;
            const y = 486 + Math.sin(this.t * 1.1 + i * 0.7) * 4;
            const current = id === this.charId;
            glow(ctx, x, y, current ? 72 : 62, current ? '#ffe6a3' : def.colors.aura, current ? 0.24 : 0.13);
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, current ? 56 : 52, 0, TAU);
            ctx.fillStyle = 'rgba(3,4,9,0.6)';
            ctx.fill();
            ctx.strokeStyle = hexToRgba(current ? '#ffe6a3' : def.colors.accent, current ? 0.75 : 0.35);
            ctx.lineWidth = current ? 2 : 1;
            ctx.stroke();
            ctx.clip();
            drawCharacterPortrait(ctx, def, x, y + 7, current ? 112 : 102, this.t);
            ctx.restore();
            label(ctx, def.name.toUpperCase(), x, y + 70, current ? 10.5 : 9, current ? '#ffe6a3' : 'rgba(220,226,242,0.55)', {
                align: 'center',
                font: FONTS.mono,
                spacing: 1.2,
                weight: current ? 800 : 600,
            });
        });
        // Menu.
        this.menu.draw(ctx, width / 2 - 250, 584, 500, {
            itemHeight: 29,
            gap: 5,
            size: 14,
            accent: '#ffe6a3',
        });
        label(ctx, 'O AMANHÃ AINDA VAI EXISTIR. É O SUFICIENTE.', width / 2, 714, 11, 'rgba(255,230,163,0.62)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 2,
        });
        // Confete de brasas.
        for (let i = 0; i < 26; i++) {
            const x = ((i * 149 + this.t * (10 + (i % 5) * 5)) % (width + 80)) - 40;
            const y = ((i * 83 + this.t * (18 + (i % 4) * 9)) % (height + 100)) - 50;
            const a = clamp(Math.sin(this.t * 2 + i) * 0.35 + 0.45, 0, 0.8);
            ctx.fillStyle = hexToRgba(i % 3 === 0 ? '#ff8ae2' : '#ffe6a3', a);
            ctx.beginPath();
            ctx.arc(x, y, i % 5 === 0 ? 2.2 : 1.2, 0, TAU);
            ctx.fill();
        }
        void STAGES;
    }
}
//# sourceMappingURL=victory.js.map