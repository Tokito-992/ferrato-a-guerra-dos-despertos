/** Tutorial ilustrado de abertura: controles, combate, Câmara do Coração e celular. */
import { clamp, hexToRgba, TAU } from '../core/math.js?v=c5d0d69737a2';
import { drawTitleBackground } from '../render/backgrounds.js?v=c5d0d69737a2';
import { drawCharacterSilhouette } from '../render/characters.js?v=c5d0d69737a2';
import { drawHeart } from '../render/hearts.js?v=c5d0d69737a2';
import { FONTS, label, panel, roundRectPath } from '../render/theme.js?v=c5d0d69737a2';
function inside(box, x, y) {
    return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}
const PAGES = [
    {
        title: 'MOVER & ATACAR',
        subtitle: 'O RITMO DO DESPERTO',
        accent: '#ff8a3d',
        bullets: [
            { icon: '◀ ▶', text: 'Ande para os lados e encurralle os inimigos.' },
            { icon: '⤒', text: 'Pule para escapar de golpes baixos e projéteis.' },
            { icon: '⚔', text: 'Ataque leve encadeia combos rápidos.' },
            { icon: '✹', text: 'Ataque pesado quebra a guarda e causa impacto.' },
        ],
        tip: 'Comece com dois golpes leves e finalize com um pesado para manter o combo.',
    },
    {
        title: 'DASH & ESPECIAL',
        subtitle: 'SOBREVIVA AO VÉU',
        accent: '#56e3ff',
        bullets: [
            { icon: '»', text: 'Dash atravessa inimigos e dá invulnerabilidade curta.' },
            { icon: '✦', text: 'Especial usa a energia do Desperto; espere recarregar.' },
            { icon: '!', text: 'Brilho vermelho é golpe iminente: pule ou dê dash.' },
            { icon: '◈', text: 'Cada herói tem uma passiva que muda o combate.' },
        ],
        tip: 'O dash é defesa e mobilidade. Use-o para reposicionar, não só para fugir.',
    },
    {
        title: 'CÂMARA DO CORAÇÃO',
        subtitle: 'O BÔNUS RARO',
        accent: '#ff6a8a',
        bullets: [
            { icon: '♥', text: 'Surge no capítulo 3 de cada arco da campanha.' },
            { icon: '10s', text: 'Colete os 3 corações antes do tempo acabar.' },
            { icon: '3/3', text: 'Só a coleta completa concede 1 vida extra.' },
            { icon: '!', text: 'Corações parciais dão pontos, mas não curam.' },
        ],
        tip: 'A Câmara é opcional. Se o tempo estiver curto, priorize sobreviver à onda.',
    },
    {
        title: 'NO CELULAR',
        subtitle: 'CONTROLES DE TOQUE',
        accent: '#b48bff',
        bullets: [
            { icon: '◀ ▶', text: 'No padrão, mover fica à esquerda e ações à direita.' },
            { icon: '⚙', text: 'Em CONFIGURAÇÕES, abra POSIÇÃO DOS BOTÕES.' },
            { icon: '✥', text: 'Arraste cada botão e solte para salvar seu layout.' },
            { icon: '⌂', text: 'Na pausa, use SAIR PARA O MENU para voltar ao título.' },
            { icon: '⛶', text: 'No iPhone, adicione à Tela de Início para jogar em tela cheia.' },
        ],
        tip: 'Lado e dock são presets. Arraste os botões para criar um layout só seu.',
    },
];
export class TutorialScene {
    constructor(game, onDone) {
        this.game = game;
        this.onDone = onDone;
        this.page = 0;
        this.t = 0;
        this.finished = false;
        this.skipRect = { x: 1008, y: 62, w: 198, h: 44 };
        this.prevRect = { x: 74, y: 646, w: 150, h: 44 };
        this.nextRect = { x: 1056, y: 646, w: 150, h: 44 };
    }
    enter() {
        this.game.audio.playMusic(35);
        this.game.audio.playAmbience('cosmic');
        this.page = 0;
        this.t = 0;
    }
    goToPage(index) {
        const next = clamp(index, 0, PAGES.length - 1);
        if (next === this.page)
            return;
        this.page = next;
        this.t = 0;
        this.game.audio.sfx('select');
    }
    advance() {
        if (this.page >= PAGES.length - 1) {
            this.finish();
            return;
        }
        this.goToPage(this.page + 1);
    }
    finish() {
        if (this.finished)
            return;
        this.finished = true;
        this.game.audio.sfx('confirm');
        this.onDone();
    }
    update(dt) {
        this.t += dt;
        const input = this.game.input;
        if (input.pressed('back') || input.pressed('pause')) {
            this.finish();
            return;
        }
        if (input.pressed('left')) {
            this.goToPage(this.page - 1);
            return;
        }
        if (input.pressed('right')) {
            this.advance();
            return;
        }
        if (input.mouse.clicked) {
            if (inside(this.skipRect, input.mouse.x, input.mouse.y)) {
                this.finish();
                return;
            }
            if (this.page > 0 && inside(this.prevRect, input.mouse.x, input.mouse.y)) {
                this.goToPage(this.page - 1);
                return;
            }
            this.advance();
            return;
        }
        if (input.pressed('confirm') || input.pressed('attack') || input.pressed('jump')) {
            this.advance();
        }
    }
    draw(ctx) {
        const { width, height } = this.game;
        const page = PAGES[this.page];
        drawTitleBackground(ctx, this.t);
        const shade = ctx.createLinearGradient(0, 0, 0, height);
        shade.addColorStop(0, 'rgba(4,5,10,0.78)');
        shade.addColorStop(0.55, 'rgba(4,5,10,0.9)');
        shade.addColorStop(1, 'rgba(4,5,10,0.96)');
        ctx.fillStyle = shade;
        ctx.fillRect(0, 0, width, height);
        label(ctx, 'FERRATO · GUIA DO DESPERTO', 76, 50, 10, hexToRgba(page.accent, 0.9), {
            font: FONTS.mono,
            spacing: 2,
        });
        label(ctx, 'COMO JOGAR', 74, 96, 42, '#f4f7ff', {
            weight: 800,
            spacing: 6,
            glow: hexToRgba(page.accent, 0.42),
        });
        label(ctx, `PÁGINA ${this.page + 1} / ${PAGES.length}`, 1204, 50, 10, 'rgba(190,198,220,0.62)', {
            align: 'right',
            font: FONTS.mono,
            spacing: 1.6,
        });
        this.drawSkip(ctx, page.accent);
        this.drawTextPanel(ctx, 74, 150, 600, 470, page);
        this.drawIllustrationPanel(ctx, 700, 150, 506, 470, page);
        this.drawFooter(ctx, page.accent);
    }
    drawSkip(ctx, accent) {
        const r = this.skipRect;
        panel(ctx, r.x, r.y, r.w, r.h, {
            fill: 'rgba(255,255,255,0.035)',
            border: hexToRgba(accent, 0.4),
            r: 5,
        });
        label(ctx, 'PULAR TUTORIAL', r.x + r.w / 2, r.y + 27, 10, 'rgba(230,235,248,0.8)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.2,
        });
    }
    drawTextPanel(ctx, x, y, w, h, page) {
        panel(ctx, x, y, w, h, {
            fill: 'rgba(5,8,16,0.9)',
            border: hexToRgba(page.accent, 0.28),
            glow: hexToRgba(page.accent, 0.12),
            cut: 18,
        });
        ctx.fillStyle = page.accent;
        ctx.fillRect(x, y, 3, h);
        label(ctx, page.title, x + 34, y + 62, 31, '#f4f7ff', {
            weight: 800,
            spacing: 3.5,
            glow: hexToRgba(page.accent, 0.35),
        });
        label(ctx, page.subtitle, x + 36, y + 86, 10, hexToRgba(page.accent, 0.78), {
            font: FONTS.mono,
            spacing: 1.8,
        });
        const bulletGap = page.bullets.length > 4 ? 50 : 58;
        page.bullets.forEach((bullet, i) => {
            const by = y + 138 + i * bulletGap;
            ctx.save();
            ctx.beginPath();
            ctx.arc(x + 56, by - 5, 17, 0, TAU);
            ctx.fillStyle = hexToRgba(page.accent, 0.13);
            ctx.fill();
            ctx.strokeStyle = hexToRgba(page.accent, 0.48);
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
            label(ctx, bullet.icon, x + 56, by - 1, bullet.icon.length > 2 ? 8.5 : 15, '#f4f7ff', {
                align: 'center',
                baseline: 'middle',
                weight: 700,
                font: bullet.icon.length > 2 ? FONTS.mono : FONTS.ui,
            });
            label(ctx, bullet.text, x + 86, by + 1, 14.5, 'rgba(224,230,244,0.86)', {
                font: FONTS.ui,
                weight: 600,
            });
        });
        const ty = y + h - 96;
        ctx.save();
        roundRectPath(ctx, x + 34, ty, w - 68, 64, 5);
        ctx.fillStyle = hexToRgba(page.accent, 0.075);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(page.accent, 0.24);
        ctx.stroke();
        ctx.restore();
        label(ctx, 'DICA', x + 50, ty + 23, 9, hexToRgba(page.accent, 0.9), {
            font: FONTS.mono,
            spacing: 1.8,
        });
        label(ctx, page.tip, x + 50, ty + 46, 12.5, 'rgba(214,222,240,0.7)', {
            font: FONTS.ui,
            weight: 500,
        });
    }
    drawIllustrationPanel(ctx, x, y, w, h, page) {
        panel(ctx, x, y, w, h, {
            fill: 'rgba(5,8,16,0.86)',
            border: hexToRgba(page.accent, 0.3),
            glow: hexToRgba(page.accent, 0.12),
            cut: 18,
        });
        label(ctx, 'ILUSTRAÇÃO', x + 24, y + 30, 9, hexToRgba(page.accent, 0.75), {
            font: FONTS.mono,
            spacing: 1.8,
        });
        const ix = x + 24;
        const iy = y + 48;
        const iw = w - 48;
        const ih = h - 72;
        ctx.save();
        roundRectPath(ctx, ix, iy, iw, ih, 10);
        ctx.clip();
        const g = ctx.createLinearGradient(ix, iy, ix, iy + ih);
        g.addColorStop(0, 'rgba(25,16,34,0.95)');
        g.addColorStop(0.62, 'rgba(10,10,22,0.98)');
        g.addColorStop(1, 'rgba(4,5,12,1)');
        ctx.fillStyle = g;
        ctx.fillRect(ix, iy, iw, ih);
        this.drawIllustration(ctx, ix, iy, iw, ih, page);
        ctx.restore();
        ctx.save();
        roundRectPath(ctx, ix, iy, iw, ih, 10);
        ctx.strokeStyle = hexToRgba(page.accent, 0.25);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
    drawIllustration(ctx, x, y, w, h, page) {
        if (page.title === 'MOVER & ATACAR') {
            this.drawMovementScene(ctx, x, y, w, h, page.accent);
        }
        else if (page.title === 'DASH & ESPECIAL') {
            this.drawCombatScene(ctx, x, y, w, h, page.accent);
        }
        else if (page.title === 'CÂMARA DO CORAÇÃO') {
            this.drawHeartScene(ctx, x, y, w, h, page.accent);
        }
        else {
            this.drawMobileScene(ctx, x, y, w, h, page.accent);
        }
    }
    drawMovementScene(ctx, x, y, w, h, accent) {
        const ground = y + h - 92;
        this.drawGround(ctx, x, ground, w, accent);
        const bob = Math.sin(this.t * 2.4) * 2;
        drawCharacterSilhouette(ctx, 'ravi', x + w * 0.3, ground + bob, 1.32, '#ff8a3d');
        this.drawEnemy(ctx, x + w * 0.73, ground, 1.16, '#9c4a64');
        ctx.save();
        ctx.strokeStyle = hexToRgba('#ffd166', 0.9);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + w * 0.34, ground - 72, 82, -0.7, 0.55);
        ctx.stroke();
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + w * 0.34, ground - 72, 96, -0.6, 0.4);
        ctx.stroke();
        ctx.restore();
        label(ctx, 'MOVER', x + w * 0.3, ground + 34, 9, 'rgba(255,138,60,0.8)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.2,
        });
        label(ctx, 'ATACAR', x + w * 0.73, ground + 34, 9, 'rgba(255,209,102,0.8)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.2,
        });
        this.drawArrow(ctx, x + w * 0.13, ground + 8, -1, '#56e3ff');
        this.drawArrow(ctx, x + w * 0.19, ground + 8, 1, '#56e3ff');
        this.drawJumpArc(ctx, x + w * 0.3, ground - 150, '#56e3ff');
        this.drawButtonRow(ctx, x + w / 2, y + h - 34, accent, [
            ['◀', '#56e3ff'],
            ['▶', '#56e3ff'],
            ['⤒', '#ffd166'],
            ['⚔', '#ff7a3c'],
            ['✹', '#ff7a3c'],
        ]);
    }
    drawCombatScene(ctx, x, y, w, h, accent) {
        const ground = y + h - 92;
        this.drawGround(ctx, x, ground, w, accent);
        const heroX = x + w * 0.35;
        for (let i = 3; i >= 0; i--) {
            ctx.save();
            ctx.globalAlpha = 0.08 + (3 - i) * 0.07;
            drawCharacterSilhouette(ctx, 'ravi', heroX - i * 30, ground, 1.16, '#56e3ff');
            ctx.restore();
        }
        drawCharacterSilhouette(ctx, 'ravi', heroX, ground, 1.3, '#ff8a3d');
        const pulse = 1 + Math.sin(this.t * 3) * 0.08;
        ctx.save();
        ctx.strokeStyle = hexToRgba('#56e3ff', 0.9);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(heroX, ground - 62, 64 * pulse, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(heroX, ground - 62, 82 * pulse, 0, TAU);
        ctx.stroke();
        ctx.restore();
        label(ctx, 'ESPECIAL', heroX, ground - 160, 8.5, 'rgba(86,227,255,0.85)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1,
        });
        const enemyX = x + w * 0.75;
        this.drawEnemy(ctx, enemyX, ground, 1.16, '#9c4a64');
        ctx.save();
        ctx.strokeStyle = 'rgba(255,70,90,0.85)';
        ctx.fillStyle = 'rgba(255,50,70,0.12)';
        ctx.setLineDash([7, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(enemyX, ground - 60, 66, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        label(ctx, 'TELEGRAFIA', enemyX, ground - 150, 8.5, 'rgba(255,90,110,0.9)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1,
        });
        this.drawArrow(ctx, x + w * 0.2, ground + 8, 1, '#56e3ff');
        this.drawButtonRow(ctx, x + w / 2, y + h - 34, accent, [
            ['»', '#56e3ff'],
            ['✦', '#56e3ff'],
            ['⤒', '#ffd166'],
            ['⚔', '#ff7a3c'],
        ]);
    }
    drawHeartScene(ctx, x, y, w, h, accent) {
        const ground = y + h - 98;
        this.drawGround(ctx, x, ground, w, accent);
        ctx.save();
        ctx.fillStyle = 'rgba(255,106,138,0.08)';
        ctx.strokeStyle = 'rgba(255,106,138,0.32)';
        ctx.lineWidth = 1.5;
        roundRectPath(ctx, x + 38, ground - 14, w - 76, 26, 5);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        const hearts = [
            { x: x + w * 0.3, y: ground - 120, filled: true },
            { x: x + w * 0.5, y: ground - 136, filled: true },
            { x: x + w * 0.7, y: ground - 120, filled: true },
        ];
        hearts.forEach((heart, i) => {
            const bob = Math.sin(this.t * 2.5 + i * 0.8) * 3;
            drawHeart(ctx, heart.x, heart.y + bob, 34, '#ff6a8a', {
                filled: heart.filled,
                glow: 16,
                outline: 'rgba(255,210,220,0.8)',
                outlineWidth: 1.5,
            });
        });
        const timerX = x + w - 66;
        const timerY = y + 64;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(timerX, timerY, 28, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = hexToRgba(accent, 0.95);
        ctx.beginPath();
        ctx.arc(timerX, timerY, 28, -Math.PI / 2, -Math.PI / 2 + TAU * 0.68);
        ctx.stroke();
        ctx.restore();
        label(ctx, '10s', timerX, timerY + 4, 11, '#ffffff', {
            align: 'center',
            baseline: 'middle',
            font: FONTS.mono,
            weight: 700,
        });
        label(ctx, '3 / 3', x + w / 2, ground - 196, 12, 'rgba(255,210,220,0.85)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.4,
        });
        label(ctx, '1 VIDA EXTRA', x + w / 2, ground - 176, 9, 'rgba(255,106,138,0.65)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.2,
        });
        label(ctx, 'CÂMARA DO CORAÇÃO', x + w / 2, ground + 34, 9, 'rgba(255,106,138,0.8)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.2,
        });
    }
    drawMobileScene(ctx, x, y, w, h, accent) {
        const fx = x + 34;
        const fy = y + 38;
        const fw = w - 68;
        const fh = h - 92;
        ctx.save();
        roundRectPath(ctx, fx, fy, fw, fh, 14);
        ctx.fillStyle = '#02040a';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
        const dockH = 64;
        const arenaY = fy;
        const arenaH = fh - dockH;
        const g = ctx.createLinearGradient(fx, arenaY, fx, arenaY + arenaH);
        g.addColorStop(0, 'rgba(72,26,38,0.9)');
        g.addColorStop(1, 'rgba(8,8,18,0.96)');
        ctx.fillStyle = g;
        ctx.fillRect(fx + 2, arenaY + 2, fw - 4, arenaH - 4);
        ctx.strokeStyle = 'rgba(255,138,60,0.3)';
        ctx.beginPath();
        ctx.moveTo(fx + 10, arenaY + arenaH - 22);
        ctx.lineTo(fx + fw - 10, arenaY + arenaH - 22);
        ctx.stroke();
        drawCharacterSilhouette(ctx, 'ravi', fx + fw * 0.42, arenaY + arenaH - 26, 0.58, '#ff8a3d');
        this.drawEnemy(ctx, fx + fw * 0.7, arenaY + arenaH - 26, 0.52, '#9c4a64');
        const dy = fy + fh - dockH;
        ctx.fillStyle = 'rgba(4,7,14,0.98)';
        ctx.fillRect(fx + 2, dy, fw - 4, dockH);
        ctx.strokeStyle = 'rgba(86,227,255,0.2)';
        ctx.beginPath();
        ctx.moveTo(fx + 2, dy);
        ctx.lineTo(fx + fw - 2, dy);
        ctx.stroke();
        const cy = dy + dockH / 2;
        const moveX = fx + 54;
        const actionX = fx + fw - 82;
        this.circleButton(ctx, moveX - 24, cy, 17, '◀', '#56e3ff');
        this.circleButton(ctx, moveX + 24, cy, 17, '▶', '#56e3ff');
        label(ctx, 'MOVER', moveX, dy + dockH - 8, 7, 'rgba(86,227,255,0.7)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 0.8,
        });
        const icons = [
            ['⤒', '#ffd166'],
            ['⚔', '#ff7a3c'],
            ['✹', '#ff7a3c'],
            ['»', '#56e3ff'],
            ['✦', '#56e3ff'],
        ];
        icons.forEach(([icon, color], i) => {
            this.circleButton(ctx, actionX + (i - 2) * 26, cy, i === 4 ? 18 : 14, icon, color);
        });
        label(ctx, 'AÇÕES', actionX, dy + dockH - 8, 7, 'rgba(255,122,60,0.7)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 0.8,
        });
        this.circleButton(ctx, fx + fw / 2 - 16, cy, 11, 'Ⅱ', 'rgba(255,255,255,0.55)');
        this.circleButton(ctx, fx + fw / 2 + 16, cy, 11, '⛶', 'rgba(255,255,255,0.55)');
        label(ctx, 'DOCK INFERIOR · PADRÃO', x + w / 2, y + h - 22, 9, 'rgba(180,139,255,0.75)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.2,
        });
        label(ctx, 'NO IPHONE · TELA DE INÍCIO', x + w / 2, y + 22, 9, hexToRgba(accent, 0.8), {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.4,
        });
    }
    drawGround(ctx, x, y, w, accent) {
        const g = ctx.createLinearGradient(x, y - 30, x, y + 30);
        g.addColorStop(0, 'rgba(255,255,255,0.02)');
        g.addColorStop(0.5, hexToRgba(accent, 0.16));
        g.addColorStop(1, 'rgba(255,255,255,0.01)');
        ctx.fillStyle = g;
        ctx.fillRect(x + 16, y - 2, w - 32, 4);
    }
    drawEnemy(ctx, x, y, scale, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, -104, 13, 15, 0, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-17, -88);
        ctx.quadraticCurveTo(-27, -58, -18, -30);
        ctx.lineTo(-28, 0);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-7, -26);
        ctx.lineTo(-2, 0);
        ctx.lineTo(13, 0);
        ctx.lineTo(18, -30);
        ctx.quadraticCurveTo(29, -62, 17, -88);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-11, -112);
        ctx.lineTo(-18, -132);
        ctx.moveTo(11, -112);
        ctx.lineTo(18, -132);
        ctx.stroke();
        ctx.fillStyle = '#ff6a7a';
        ctx.beginPath();
        ctx.arc(-5, -106, 2.4, 0, TAU);
        ctx.arc(5, -106, 2.4, 0, TAU);
        ctx.fill();
        ctx.restore();
    }
    drawArrow(ctx, x, y, dir, color) {
        ctx.save();
        ctx.fillStyle = hexToRgba(color, 0.8);
        ctx.beginPath();
        ctx.moveTo(x + dir * 10, y);
        ctx.lineTo(x - dir * 6, y - 8);
        ctx.lineTo(x - dir * 6, y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    drawJumpArc(ctx, x, y, color) {
        ctx.save();
        ctx.strokeStyle = hexToRgba(color, 0.55);
        ctx.setLineDash([4, 5]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y + 60, 60, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.restore();
    }
    drawButtonRow(ctx, cx, y, accent, buttons) {
        const total = (buttons.length - 1) * 38;
        buttons.forEach(([icon, color], i) => {
            this.circleButton(ctx, cx - total / 2 + i * 38, y, 14, icon, color);
        });
        label(ctx, 'CONTROLES DE TOQUE', cx, y + 28, 8, hexToRgba(accent, 0.6), {
            align: 'center',
            font: FONTS.mono,
            spacing: 1,
        });
    }
    circleButton(ctx, x, y, r, icon, color) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fillStyle = hexToRgba(color, 0.17);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(color, 0.72);
        ctx.lineWidth = 1.2;
        ctx.stroke();
        label(ctx, icon, x, y + 1, Math.max(8, r * 0.85), '#f4f7ff', {
            align: 'center',
            baseline: 'middle',
            weight: 700,
            font: FONTS.ui,
        });
        ctx.restore();
    }
    drawFooter(ctx, accent) {
        if (this.page > 0) {
            const r = this.prevRect;
            panel(ctx, r.x, r.y, r.w, r.h, {
                fill: 'rgba(255,255,255,0.035)',
                border: 'rgba(255,255,255,0.16)',
                r: 5,
            });
            label(ctx, '◀ ANTERIOR', r.x + r.w / 2, r.y + 27, 9.5, 'rgba(220,226,240,0.72)', {
                align: 'center',
                font: FONTS.mono,
                spacing: 1,
            });
        }
        const next = this.nextRect;
        panel(ctx, next.x, next.y, next.w, next.h, {
            fill: hexToRgba(accent, 0.14),
            border: hexToRgba(accent, 0.5),
            r: 5,
        });
        label(ctx, this.page >= PAGES.length - 1 ? 'COMEÇAR ▶' : 'PRÓXIMO ▶', next.x + next.w / 2, next.y + 27, 10, '#ffffff', { align: 'center', font: FONTS.mono, spacing: 1.2 });
        const dotY = 670;
        const dotGap = 22;
        const start = 640 - ((PAGES.length - 1) * dotGap) / 2;
        PAGES.forEach((_, i) => {
            const active = i === this.page;
            ctx.save();
            ctx.beginPath();
            ctx.arc(start + i * dotGap, dotY, active ? 4.5 : 2.6, 0, TAU);
            ctx.fillStyle = active ? accent : 'rgba(255,255,255,0.22)';
            ctx.fill();
            ctx.restore();
        });
        label(ctx, 'TOQUE EM QUALQUER LUGAR PARA AVANÇAR', 74, 704, 9, 'rgba(190,198,220,0.45)', {
            font: FONTS.mono,
            spacing: 0.9,
        });
        label(ctx, 'ESC / BOTÃO VOLTAR PULA O TUTORIAL', 1204, 704, 9, 'rgba(190,198,220,0.4)', {
            align: 'right',
            font: FONTS.mono,
            spacing: 0.9,
        });
    }
}
//# sourceMappingURL=tutorial.js.map