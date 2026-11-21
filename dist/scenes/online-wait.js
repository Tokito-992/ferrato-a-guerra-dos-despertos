/**
 * Espera do convidado entre capítulos online.
 *
 * A história de encerramento e a abertura do próximo capítulo já foram lidas
 * localmente. Enquanto o host não inicia a simulação do novo capítulo, o
 * convidado vê esta tela; assim que o `start` chega, o combate continua.
 */
import { CHARACTERS } from '../data/characters.js?v=d7bd45e88846';
import { clamp, easeOutCubic, hexToRgba, TAU } from '../core/math.js?v=d7bd45e88846';
import { drawStageBackground } from '../render/backgrounds.js?v=d7bd45e88846';
import { FONTS, glow, label, panel } from '../render/theme.js?v=d7bd45e88846';
const EXIT_W = 260;
const EXIT_H = 46;
export class OnlineWaitScene {
    constructor(game, stage, partner) {
        this.game = game;
        this.stage = stage;
        this.partner = partner;
        this.t = 0;
        this.intro = 0;
        this.exitRect = { x: 0, y: 0, w: EXIT_W, h: EXIT_H };
    }
    enter() {
        this.game.audio.playMusic(this.stage.music);
        this.game.audio.playAmbience(this.stage.ambient);
        // O aviso de capítulo concluído já cumpriu o papel e cobriria o botão de saída.
        this.game.clearNotice();
    }
    update(dt) {
        this.t += dt;
        this.intro = Math.min(1, this.intro + dt / 0.5);
        this.exitRect.x = this.game.width / 2 - EXIT_W / 2;
        this.exitRect.y = 600;
        const pending = this.game.takePendingOnlineStart();
        if (pending) {
            this.game.enterOnlineGuestStage(pending);
            return;
        }
        if (this.game.input.pressed('back') ||
            this.game.input.pressed('pause') ||
            this.game.input.pressed('cancel') ||
            this.game.input.pressed('back', 1)) {
            this.game.leaveOnlineStory();
            return;
        }
        if (this.game.input.mouse.clicked) {
            const { x, y } = this.game.input.mouse;
            const r = this.exitRect;
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                this.game.leaveOnlineStory();
            }
        }
    }
    draw(ctx) {
        const { width, height } = this.game;
        const accent = this.stage.palette.accent;
        const cameraX = Math.max(0, (this.stage.width - width) * 0.5);
        const ease = easeOutCubic(clamp(this.intro, 0, 1));
        drawStageBackground(ctx, this.stage, cameraX, this.t);
        // O mundo continua ao fundo, mas o foco é a espera.
        ctx.fillStyle = 'rgba(3,5,12,0.6)';
        ctx.fillRect(0, 0, width, height);
        const vignette = ctx.createRadialGradient(width / 2, height / 2, 120, width / 2, height / 2, 620);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(0.7, 'rgba(0,0,0,0.18)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.62)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
        // Feixes de luz na cor do capítulo.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
            const a = -0.5 + i * 0.5 + Math.sin(this.t * 0.12 + i) * 0.03;
            const g = ctx.createLinearGradient(0, height, width / 2, 0);
            g.addColorStop(0, hexToRgba(accent, 0.11));
            g.addColorStop(1, hexToRgba(accent, 0));
            ctx.save();
            ctx.translate(width / 2, height * 0.52);
            ctx.rotate(a);
            ctx.fillStyle = g;
            ctx.fillRect(-120, -height, 240, height * 1.4);
            ctx.restore();
        }
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = ease;
        ctx.translate(0, (1 - ease) * 14);
        label(ctx, 'CO-OP ONLINE · CAMPANHA CONTÍNUA', width / 2, 128, 10, hexToRgba(accent, 0.82), {
            align: 'center',
            font: FONTS.mono,
            spacing: 2.6,
        });
        const pulse = 0.72 + Math.sin(this.t * 2.4) * 0.12;
        glow(ctx, width / 2, 218, 190, accent, 0.14 + pulse * 0.08);
        label(ctx, 'AGUARDANDO O HOST', width / 2, 232, 44, '#f4f7ff', {
            align: 'center',
            weight: 800,
            spacing: 3.4,
            glow: hexToRgba(accent, 0.55),
            outline: 'rgba(0,0,0,0.45)',
            outlineWidth: 3,
        });
        // Três pontos pulsando: o host está prestes a iniciar.
        for (let i = 0; i < 3; i++) {
            const dotPulse = 0.35 + 0.65 * Math.max(0, Math.sin(this.t * 4.2 - i * 0.7));
            ctx.save();
            ctx.globalAlpha = 0.25 + dotPulse * 0.75;
            ctx.fillStyle = accent;
            ctx.shadowColor = accent;
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(width / 2 - 20 + i * 20, 268, 4.2, 0, TAU);
            ctx.fill();
            ctx.restore();
        }
        panel(ctx, width / 2 - 310, 300, 620, 218, {
            fill: 'rgba(6,9,20,0.78)',
            border: hexToRgba(accent, 0.32),
            glow: hexToRgba(accent, 0.15),
            cut: 18,
        });
        ctx.fillStyle = hexToRgba(accent, 0.9);
        ctx.fillRect(width / 2 - 310, 300, 3, 218);
        label(ctx, 'PRÓXIMO CAPÍTULO', width / 2 - 282, 334, 9.5, hexToRgba(accent, 0.8), {
            font: FONTS.mono,
            spacing: 1.8,
        });
        label(ctx, `CAP. ${String(this.stage.id).padStart(2, '0')} · ${this.stage.subtitle.toUpperCase()}`, width / 2 - 282, 376, 26, '#f2f5ff', {
            weight: 800,
            spacing: 1.1,
        });
        label(ctx, this.stage.name.toUpperCase(), width / 2 - 282, 402, 11, 'rgba(226,232,246,0.86)', {
            font: FONTS.mono,
            spacing: 1.1,
        });
        label(ctx, this.stage.location.toUpperCase(), width / 2 - 282, 424, 9.5, hexToRgba(accent, 0.85), {
            font: FONTS.mono,
            spacing: 0.9,
        });
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.moveTo(width / 2 - 282, 444);
        ctx.lineTo(width / 2 + 282, 444);
        ctx.stroke();
        const hero = CHARACTERS[this.partner];
        label(ctx, `VOCÊ CONTROLA ${hero.name.toUpperCase()} · ${hero.epithet.toUpperCase()}`, width / 2 - 282, 474, 10, hexToRgba(hero.colors.accent, 0.9), { font: FONTS.mono, spacing: 1.1 });
        label(ctx, 'O PROGRESSO DESTE APARELHO JÁ FOI SALVO. A HISTÓRIA CONTINUA QUANDO O HOST INICIAR.', width / 2, 556, 9.5, 'rgba(190,198,220,0.56)', { align: 'center', font: FONTS.mono, spacing: 0.8 });
        // Botão de saída: útil se o host demorar ou fechar a sala.
        const exit = this.exitRect;
        const hover = this.game.input.mouse.x >= exit.x &&
            this.game.input.mouse.x <= exit.x + exit.w &&
            this.game.input.mouse.y >= exit.y &&
            this.game.input.mouse.y <= exit.y + exit.h;
        panel(ctx, exit.x, exit.y, exit.w, exit.h, {
            fill: hover ? 'rgba(255,106,122,0.16)' : 'rgba(6,9,20,0.74)',
            border: hover ? 'rgba(255,106,122,0.65)' : 'rgba(180,190,220,0.22)',
            glow: hover ? 'rgba(255,106,122,0.25)' : undefined,
            r: 8,
        });
        label(ctx, 'SAIR DA SALA', width / 2, 628, 12, hover ? '#ffd4da' : 'rgba(220,226,242,0.72)', {
            align: 'center',
            weight: 700,
            spacing: 1.6,
        });
        label(ctx, 'ESC / VOLTAR', width / 2, 668, 8.5, 'rgba(170,178,200,0.4)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1,
        });
        ctx.restore();
        // Pequeno selo de conexão viva.
        const status = this.game.onlineSession?.status;
        const connected = status === 'connected';
        ctx.fillStyle = connected ? 'rgba(141,244,168,0.85)' : 'rgba(255,209,102,0.85)';
        ctx.beginPath();
        ctx.arc(width - 82, 52, 3.5, 0, TAU);
        ctx.fill();
        label(ctx, connected ? 'SALA CONECTADA' : 'RECONECTANDO…', width - 70, 56, 8.5, 'rgba(210,218,236,0.55)', {
            font: FONTS.mono,
            spacing: 1,
        });
    }
}
//# sourceMappingURL=online-wait.js.map