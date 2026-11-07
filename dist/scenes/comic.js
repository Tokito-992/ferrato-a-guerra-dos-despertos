/**
 * Protótipo de cutscene em quadrinhos.
 *
 * Cada página exibe até três painéis desenhados proceduralmente (fundo da fase,
 * personagens, retratos e efeitos). A narração usa caixas de legenda; as falas
 * usam balões com rabicho. ENTER/clique avança; ESC pula a cena.
 *
 * O protótipo reaproveita os mesmos `StoryBeat[]` da cutscene normal, então
 * nenhum texto precisou ser reescrito.
 */
import { STORY } from '../data/story.js?v=7f4be62fa121';
import { CHARACTERS } from '../data/characters.js?v=7f4be62fa121';
import { clamp, easeOutCubic, hexToRgba, TAU } from '../core/math.js?v=7f4be62fa121';
import { drawStageBackground } from '../render/backgrounds.js?v=7f4be62fa121';
import { drawCharacterPortrait } from '../render/characters.js?v=7f4be62fa121';
import { FONTS, label, roundRectPath } from '../render/theme.js?v=7f4be62fa121';
const PAGE_SIZE = 3;
const GAP = 16;
const MARGIN_X = 40;
const PAGE_TOP = 52;
const PAGE_BOTTOM = 668;
const INK = '#17121c';
const PAPER = '#f2e7c9';
const BALLOON = '#f8f4ea';
const SPEAKER_COLOR = {
    narrator: '#ffe6a3',
    ferrato: '#ff8ae2',
    boss: '#ff5a7a',
    ravi: CHARACTERS.ravi.colors.accent,
    miriam: CHARACTERS.miriam.colors.accent,
    kael: CHARACTERS.kael.colors.accent,
    ozric: CHARACTERS.ozric.colors.accent,
    elodie: CHARACTERS.elodie.colors.accent,
    thryc: CHARACTERS.thryc.colors.accent,
};
const halftoneCache = new Map();
/** Padrão de retícula para sombras e texturas de quadrinhos. */
function halftonePattern(ctx, color) {
    if (halftoneCache.has(color))
        return halftoneCache.get(color) ?? null;
    const tile = document.createElement('canvas');
    tile.width = 10;
    tile.height = 10;
    const g = tile.getContext('2d');
    if (!g) {
        halftoneCache.set(color, null);
        return null;
    }
    g.fillStyle = color;
    g.beginPath();
    g.arc(5, 5, 1.45, 0, TAU);
    g.fill();
    const pattern = ctx.createPattern(tile, 'repeat');
    halftoneCache.set(color, pattern);
    return pattern;
}
function wrapLines(ctx, text, maxW, size, font, weight = 600) {
    ctx.save();
    ctx.font = `${weight} ${size}px ${font}`;
    const words = text.split(/\s+/);
    const lines = [];
    let line = '';
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxW && line) {
            lines.push(line);
            line = word;
        }
        else {
            line = test;
        }
    }
    if (line)
        lines.push(line);
    ctx.restore();
    return lines;
}
function measure(ctx, text, size, font, weight = 600) {
    ctx.save();
    ctx.font = `${weight} ${size}px ${font}`;
    const w = ctx.measureText(text).width;
    ctx.restore();
    return w;
}
export class ComicScene {
    constructor(game, stage, phase, onDone) {
        this.game = game;
        this.stage = stage;
        this.phase = phase;
        this.page = 0;
        this.active = 0;
        this.typed = 0;
        this.t = 0;
        this.finished = false;
        this.panelStart = [0, 0, 0];
        this.beats = STORY[stage.id]?.[phase] ?? [];
        this.onDone = onDone;
    }
    enter() {
        this.game.audio.playMusic(this.stage.music);
        this.game.audio.playAmbience(this.stage.ambient);
        if (this.beats.length === 0)
            this.finish();
    }
    get beat() {
        return this.beats[this.active] ?? null;
    }
    get fullText() {
        return this.beat?.text ?? '';
    }
    get textComplete() {
        return this.typed >= this.fullText.length;
    }
    get totalPages() {
        return Math.max(1, Math.ceil(this.beats.length / PAGE_SIZE));
    }
    get pageStart() {
        return this.page * PAGE_SIZE;
    }
    advance() {
        if (this.finished)
            return;
        if (!this.textComplete) {
            this.typed = this.fullText.length;
            this.game.audio.sfx('ui');
            return;
        }
        if (this.active < this.beats.length - 1) {
            this.active++;
            this.typed = 0;
            const nextPage = Math.floor(this.active / PAGE_SIZE);
            if (nextPage !== this.page) {
                this.page = nextPage;
                this.panelStart = [this.t, this.t, this.t];
            }
            else {
                this.panelStart[this.active % PAGE_SIZE] = this.t;
            }
            this.game.audio.sfx('select');
            return;
        }
        this.finish();
    }
    finish() {
        if (this.finished)
            return;
        this.finished = true;
        this.game.transitionTo(this.onDone, '#030409', 0.45);
    }
    update(dt) {
        this.t += dt;
        const input = this.game.input;
        if (input.pressed('back') || input.pressed('pause')) {
            this.game.audio.sfx('ui');
            this.finish();
            return;
        }
        if (this.textComplete) {
            this.typed = this.fullText.length;
        }
        else {
            this.typed = Math.min(this.fullText.length, this.typed + dt * 46);
        }
        if (input.pressed('confirm') || input.pressed('attack') || input.pressed('jump') || input.mouse.clicked) {
            this.advance();
        }
    }
    draw(ctx) {
        this.drawBackdrop(ctx);
        this.drawHeader(ctx);
        const pageBeats = this.beats.slice(this.pageStart, this.pageStart + PAGE_SIZE);
        const rects = this.panelRects(pageBeats.length);
        rects.forEach((rect, index) => {
            const globalIndex = this.pageStart + index;
            const beat = this.beats[globalIndex];
            if (!beat)
                return;
            // Os quadros entram um por um: o próximo só aparece quando vira o foco.
            if (globalIndex > this.active) {
                this.drawEmptyPanel(ctx, rect, globalIndex);
                return;
            }
            this.drawPanel(ctx, rect, beat, index, globalIndex);
        });
        this.drawFooter(ctx);
    }
    // ------------------------------------------------------------ estrutura
    panelRects(count) {
        const left = MARGIN_X;
        const right = this.game.width - MARGIN_X;
        const totalW = right - left;
        const totalH = PAGE_BOTTOM - PAGE_TOP;
        if (count <= 1) {
            return [{ x: left, y: PAGE_TOP, w: totalW, h: totalH }];
        }
        if (count === 2) {
            const w = (totalW - GAP) / 2;
            return [
                { x: left, y: PAGE_TOP, w, h: totalH },
                { x: left + w + GAP, y: PAGE_TOP, w, h: totalH },
            ];
        }
        const topH = 300;
        const bottomH = totalH - topH - GAP;
        const topLeftW = 760;
        const topRightW = totalW - topLeftW - GAP;
        return [
            { x: left, y: PAGE_TOP, w: topLeftW, h: topH },
            { x: left + topLeftW + GAP, y: PAGE_TOP, w: topRightW, h: topH },
            { x: left, y: PAGE_TOP + topH + GAP, w: totalW, h: bottomH },
        ];
    }
    drawBackdrop(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, this.game.height);
        g.addColorStop(0, '#0b0d16');
        g.addColorStop(1, '#04050a');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        // Hachura diagonal discreta, como papel de quadrinho.
        ctx.save();
        ctx.globalAlpha = 0.045;
        ctx.strokeStyle = '#9aa3b8';
        ctx.lineWidth = 1;
        for (let x = -this.game.height; x < this.game.width; x += 24) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + this.game.height, this.game.height);
            ctx.stroke();
        }
        ctx.restore();
        const v = ctx.createRadialGradient(this.game.width / 2, this.game.height / 2, 220, this.game.width / 2, this.game.height / 2, 780);
        v.addColorStop(0, 'rgba(0,0,0,0)');
        v.addColorStop(1, 'rgba(0,0,0,0.58)');
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, this.game.width, this.game.height);
    }
    drawHeader(ctx) {
        label(ctx, 'FERRATO · A GUERRA DOS DESPERTOS', MARGIN_X, 28, 9, 'rgba(232,226,212,0.55)', {
            font: FONTS.mono,
            spacing: 1.4,
        });
        label(ctx, `CAPÍTULO ${this.stage.id} · ${this.phase === 'intro' ? 'ABERTURA' : 'ENCERRAMENTO'}`, this.game.width / 2, 28, 9, 'rgba(255,209,102,0.72)', { align: 'center', font: FONTS.mono, spacing: 2 });
        label(ctx, 'ESC PULAR', this.game.width - MARGIN_X, 28, 9, 'rgba(232,226,212,0.45)', {
            align: 'right',
            font: FONTS.mono,
            spacing: 1.2,
        });
    }
    drawFooter(ctx) {
        label(ctx, `PÁGINA ${this.page + 1} / ${this.totalPages}`, MARGIN_X, 694, 8.5, 'rgba(232,226,212,0.42)', { font: FONTS.mono, spacing: 1.2 });
        const pipW = 22;
        const totalW = this.beats.length * (pipW + 5) - 5;
        this.beats.forEach((_, i) => {
            const x = this.game.width / 2 - totalW / 2 + i * (pipW + 5);
            const color = SPEAKER_COLOR[this.beats[i].who] ?? '#ffd166';
            ctx.fillStyle = i < this.active ? hexToRgba(color, 0.85) : i === this.active ? '#ffffff' : 'rgba(255,255,255,0.16)';
            ctx.fillRect(x, 690, pipW, 2);
        });
        const hint = this.textComplete ? 'ENTER / CLIQUE AVANÇAR' : 'ENTER COMPLETAR';
        label(ctx, hint, this.game.width - MARGIN_X, 694, 8.5, 'rgba(232,226,212,0.5)', {
            align: 'right',
            font: FONTS.mono,
            spacing: 1.2,
        });
    }
    // ------------------------------------------------------------- painéis
    drawPanel(ctx, rect, beat, index, globalIndex) {
        const active = globalIndex === this.active;
        const past = globalIndex < this.active;
        const age = this.t - this.panelStart[index];
        // Entrada do quadro: surge do fundo com um leve encaixe.
        const reveal = active ? clamp(age / 0.5, 0, 1) : 1;
        const enter = easeOutCubic(reveal);
        ctx.save();
        ctx.globalAlpha = enter;
        if (reveal < 1) {
            const rcx = rect.x + rect.w / 2;
            const rcy = rect.y + rect.h / 2;
            ctx.translate(0, (1 - enter) * 14);
            ctx.translate(rcx, rcy);
            ctx.scale(0.965 + 0.035 * enter, 0.965 + 0.035 * enter);
            ctx.translate(-rcx, -rcy);
        }
        // Sombra atrás do painel.
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 22;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = '#07080d';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.w, rect.h);
        ctx.clip();
        // Zoom sutil quando o painel entra em foco.
        if (active) {
            const p = clamp(age / 0.35, 0, 1);
            const s = 1.035 - 0.035 * easeOutCubic(p);
            const cx = rect.x + rect.w / 2;
            const cy = rect.y + rect.h / 2;
            ctx.translate(cx, cy);
            ctx.scale(s, s);
            ctx.translate(-cx, -cy);
        }
        this.drawPanelArt(ctx, rect, beat, index, globalIndex);
        this.drawPanelText(ctx, rect, beat, index, globalIndex);
        if (!active) {
            ctx.fillStyle = past ? 'rgba(4,5,10,0.5)' : 'rgba(4,5,10,0.68)';
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        }
        ctx.restore();
        this.drawPanelFrame(ctx, rect, active, age);
        ctx.restore();
    }
    drawPanelArt(ctx, rect, beat, index, globalIndex) {
        if (this.stage.id === 1 && this.page === 0 && this.phase === 'intro') {
            if (index === 0) {
                this.drawCityPanel(ctx, rect);
                return;
            }
            if (index === 1) {
                this.drawCloseupPanel(ctx, rect);
                return;
            }
            if (index === 2) {
                this.drawImpactPanel(ctx, rect, index);
                return;
            }
        }
        this.drawGenericPanel(ctx, rect, beat, globalIndex);
    }
    drawPanelText(ctx, rect, beat, index, globalIndex) {
        // Painéis futuros ainda não mostram caixa de texto: evita balões vazios.
        if (globalIndex > this.active)
            return;
        const visible = globalIndex < this.active ? beat.text.length : Math.floor(this.typed);
        const color = SPEAKER_COLOR[beat.who] ?? '#ffd166';
        if (beat.who === 'narrator') {
            const maxW = Math.min(rect.w - 40, index === 2 ? 540 : 340);
            const bottom = index === 2;
            const y = bottom ? rect.y + rect.h - 18 : rect.y + 18;
            this.drawCaption(ctx, rect.x + 20, y, maxW, beat.text, visible, globalIndex, bottom);
            return;
        }
        const maxW = Math.min(rect.w - 36, index === 1 ? 252 : 330);
        const tailX = index === 1 ? rect.x + rect.w * 0.72 : rect.x + rect.w * 0.62;
        const tailY = index === 1 ? rect.y + rect.h * 0.56 : rect.y + rect.h * 0.58;
        this.drawBalloon(ctx, rect.x + 18, rect.y + 20, maxW, beat.text, visible, color, beat.speaker, tailX, tailY);
    }
    /** Espaço reservado do próximo quadro, como um esboço a lápis. */
    drawEmptyPanel(ctx, rect, globalIndex) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.w, rect.h);
        ctx.clip();
        ctx.fillStyle = 'rgba(8,10,17,0.42)';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.strokeStyle = 'rgba(154,163,184,0.055)';
        ctx.lineWidth = 1;
        for (let x = rect.x - rect.h; x < rect.x + rect.w; x += 18) {
            ctx.beginPath();
            ctx.moveTo(x, rect.y);
            ctx.lineTo(x + rect.h, rect.y + rect.h);
            ctx.stroke();
        }
        ctx.restore();
        ctx.save();
        ctx.setLineDash([7, 7]);
        ctx.strokeStyle = 'rgba(232,226,212,0.12)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
        ctx.restore();
        label(ctx, String(globalIndex + 1).padStart(2, '0'), rect.x + 15, rect.y + 20, 8, 'rgba(232,226,212,0.2)', {
            font: FONTS.mono,
            spacing: 1.4,
        });
    }
    drawPanelFrame(ctx, rect, active, age) {
        ctx.save();
        // Contorno preto externo.
        ctx.strokeStyle = 'rgba(2,2,6,0.95)';
        ctx.lineWidth = 7;
        ctx.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
        // Moldura clara (dourada no painel ativo).
        const pulse = 0.82 + Math.sin(age * 3) * 0.1;
        ctx.strokeStyle = active ? `rgba(255,209,102,${pulse})` : 'rgba(232,226,212,0.72)';
        ctx.lineWidth = active ? 3.5 : 2.5;
        if (active) {
            ctx.shadowColor = 'rgba(255,209,102,0.45)';
            ctx.shadowBlur = 16;
        }
        ctx.strokeRect(rect.x - 1, rect.y - 1, rect.w + 2, rect.h + 2);
        ctx.restore();
    }
    // ------------------------------------------------------ arte dos painéis
    drawBackgroundIn(ctx, rect, cameraX, scale = 1.12) {
        const bgScale = Math.max(rect.w / this.game.width, rect.h / this.game.height) * scale;
        ctx.save();
        ctx.translate(rect.x, rect.y);
        ctx.translate((rect.w - this.game.width * bgScale) / 2, (rect.h - this.game.height * bgScale) / 2);
        ctx.scale(bgScale, bgScale);
        drawStageBackground(ctx, this.stage, cameraX, this.t);
        ctx.restore();
    }
    /** Painel 1: New Haven ao entardecer, Ravi com a bicicleta e as pizzas. */
    drawCityPanel(ctx, rect) {
        const camera = (this.stage.width - this.game.width) * 0.16;
        this.drawBackgroundIn(ctx, rect, camera, 1.08);
        // Luz de fim de tarde.
        const warm = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
        warm.addColorStop(0, 'rgba(255,138,61,0.3)');
        warm.addColorStop(0.5, 'rgba(255,51,87,0.08)');
        warm.addColorStop(1, 'rgba(5,6,12,0.6)');
        ctx.fillStyle = warm;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        // Sol.
        const sx = rect.x + rect.w * 0.72;
        const sy = rect.y + rect.h * 0.3;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const sun = ctx.createRadialGradient(sx, sy, 4, sx, sy, 96);
        sun.addColorStop(0, 'rgba(255,230,163,0.9)');
        sun.addColorStop(0.35, 'rgba(255,138,61,0.42)');
        sun.addColorStop(1, 'rgba(255,51,87,0)');
        ctx.fillStyle = sun;
        ctx.fillRect(sx - 110, sy - 110, 220, 220);
        ctx.fillStyle = 'rgba(255,230,163,0.82)';
        ctx.beginPath();
        ctx.arc(sx, sy, 21, 0, TAU);
        ctx.fill();
        ctx.restore();
        // Calçada.
        ctx.fillStyle = 'rgba(5,5,10,0.55)';
        ctx.fillRect(rect.x, rect.y + rect.h - 50, rect.w, 50);
        const groundY = rect.y + rect.h - 16;
        this.drawBicycle(ctx, rect.x + 350, groundY, 1.05, 'rgba(8,8,14,0.94)');
        // Bagageiro da bicicleta, visível sob a pilha de pizzas.
        ctx.save();
        ctx.strokeStyle = 'rgba(242,231,201,0.34)';
        ctx.lineCap = 'round';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rect.x + 350, groundY - 45);
        ctx.lineTo(rect.x + 412, groundY - 45);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rect.x + 356, groundY - 44);
        ctx.lineTo(rect.x + 350, groundY - 10);
        ctx.moveTo(rect.x + 408, groundY - 44);
        ctx.lineTo(rect.x + 382, groundY - 48);
        ctx.stroke();
        ctx.restore();
        this.drawPizzaStack(ctx, rect.x + 358, groundY - 46);
        // Corda prendendo as caixas ao bagageiro.
        ctx.save();
        ctx.strokeStyle = 'rgba(242,231,201,0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(rect.x + 384, groundY - 73);
        ctx.lineTo(rect.x + 384, groundY - 46);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(rect.x + 624, groundY, 42, 8, 0, 0, TAU);
        ctx.fill();
        this.drawCivilianRavi(ctx, rect.x + 624, groundY, -1, 1.2, this.t);
        ctx.restore();
    }
    /** Painel 2: close-up de Ravi com o balão de fala. */
    drawCloseupPanel(ctx, rect) {
        const cx = rect.x + rect.w * 0.68;
        const cy = rect.y + rect.h * 0.62;
        const g = ctx.createRadialGradient(cx, cy, 18, cx, cy, rect.w * 0.82);
        g.addColorStop(0, 'rgba(126,56,34,0.9)');
        g.addColorStop(0.52, 'rgba(42,21,27,0.96)');
        g.addColorStop(1, 'rgba(8,6,12,1)');
        ctx.fillStyle = g;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        const pattern = halftonePattern(ctx, '#ffb37a');
        if (pattern) {
            ctx.save();
            ctx.globalAlpha = 0.07;
            ctx.fillStyle = pattern;
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            ctx.restore();
        }
        // Halo de fim de tarde atrás do retrato (luz da cena, não poder).
        ctx.save();
        const halo = ctx.createRadialGradient(cx, cy - 36, 18, cx, cy - 36, 210);
        halo.addColorStop(0, 'rgba(255,209,102,0.24)');
        halo.addColorStop(0.55, 'rgba(255,138,61,0.1)');
        halo.addColorStop(1, 'rgba(255,51,87,0)');
        ctx.fillStyle = halo;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.restore();
        this.drawCivilianRaviPortrait(ctx, cx, cy, 272, this.t);
        const v = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
        v.addColorStop(0, 'rgba(4,5,10,0.35)');
        v.addColorStop(0.5, 'rgba(4,5,10,0)');
        v.addColorStop(1, 'rgba(4,5,10,0.52)');
        ctx.fillStyle = v;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    /** Painel 3: a placa cai e algo desperta na rua. */
    drawImpactPanel(ctx, rect, index) {
        const camera = (this.stage.width - this.game.width) * 0.52;
        this.drawBackgroundIn(ctx, rect, camera, 1.1);
        ctx.fillStyle = 'rgba(4,4,9,0.58)';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        // Brilho vermelho vindo da direita.
        const glow = ctx.createRadialGradient(rect.x + rect.w * 0.86, rect.y + rect.h * 0.55, 10, rect.x + rect.w * 0.86, rect.y + rect.h * 0.55, 330);
        glow.addColorStop(0, 'rgba(255,51,87,0.24)');
        glow.addColorStop(1, 'rgba(255,51,87,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        // Linhas de perspectiva da rua.
        ctx.save();
        ctx.strokeStyle = 'rgba(232,226,212,0.08)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 7; i++) {
            const y = rect.y + 42 + i * 38;
            ctx.beginPath();
            ctx.moveTo(rect.x, y);
            ctx.lineTo(rect.x + rect.w, rect.y + rect.h * 0.62);
            ctx.stroke();
        }
        ctx.restore();
        this.drawSpeedLines(ctx, rect.x + 260, rect.y + 132, rect, 'rgba(255,209,102,0.14)', 28);
        // Placa da pizzaria caindo.
        ctx.save();
        ctx.translate(rect.x + 250, rect.y + 96);
        ctx.rotate(-0.16 + Math.sin(this.t * 1.4) * 0.015);
        ctx.fillStyle = '#7d2a2a';
        ctx.strokeStyle = PAPER;
        ctx.lineWidth = 3;
        ctx.fillRect(-115, -32, 230, 64);
        ctx.strokeRect(-115, -32, 230, 64);
        ctx.fillStyle = PAPER;
        ctx.font = `800 26px ${FONTS.ui}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PIZZARIA', 0, 2);
        ctx.restore();
        ctx.strokeStyle = 'rgba(232,226,212,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rect.x + 250, rect.y + 64);
        ctx.lineTo(rect.x + 250, rect.y + 28);
        ctx.stroke();
        // Poeira.
        ctx.save();
        ctx.fillStyle = 'rgba(180,170,150,0.16)';
        for (let i = 0; i < 7; i++) {
            const a = i * 0.9;
            ctx.beginPath();
            ctx.ellipse(rect.x + 250 + Math.cos(a) * (40 + i * 9), rect.y + 128 + Math.sin(a) * 18, 30 + i * 3, 18 + i * 2, 0, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
        // Onomatopeia.
        const age = this.t - this.panelStart[index];
        const punch = age < 0.32 ? 1.5 - clamp(age / 0.32, 0, 1) * 0.5 : 1;
        ctx.save();
        ctx.translate(rect.x + 404, rect.y + 82);
        ctx.rotate(-0.1);
        ctx.scale(punch, punch);
        ctx.font = `900 64px ${FONTS.ui}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 11;
        ctx.strokeStyle = '#160c18';
        ctx.strokeText('TRUM!', 0, 0);
        ctx.fillStyle = '#ffd166';
        ctx.fillText('TRUM!', 0, 0);
        ctx.fillStyle = 'rgba(255,255,255,0.42)';
        ctx.fillText('TRUM!', -2, -3);
        ctx.restore();
        // Ravi, pequeno diante da ameaça.
        const groundY = rect.y + rect.h - 12;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.42)';
        ctx.beginPath();
        ctx.ellipse(rect.x + 760, groundY, 42, 8, 0, 0, TAU);
        ctx.fill();
        this.drawCivilianRavi(ctx, rect.x + 760, groundY, 1, 1.0, this.t, true);
        ctx.restore();
        // Caixa de pizza no chão.
        ctx.save();
        ctx.translate(rect.x + 660, groundY - 6);
        ctx.rotate(-0.12);
        ctx.fillStyle = '#b8453a';
        ctx.strokeStyle = 'rgba(242,231,201,0.7)';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-28, -8, 56, 16);
        ctx.strokeRect(-28, -8, 56, 16);
        ctx.restore();
        this.drawCrawler(ctx, rect.x + 1020, groundY + 4, 1.9, '#07070c', true);
        this.drawCrawler(ctx, rect.x + 1128, groundY + 8, 1.22, '#0b0a12', false);
    }
    /** Fallback para qualquer outro capítulo: fundo + retrato + texto. */
    drawGenericPanel(ctx, rect, beat, globalIndex) {
        const camera = (this.stage.width - this.game.width) * (0.2 + (globalIndex % 3) * 0.12);
        this.drawBackgroundIn(ctx, rect, camera, 1.12);
        ctx.fillStyle = 'rgba(4,5,10,0.52)';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        const color = SPEAKER_COLOR[beat.who] ?? '#ffd166';
        const cx = rect.x + rect.w * (beat.who === 'narrator' ? 0.5 : 0.63);
        const cy = rect.y + rect.h * 0.56;
        if (beat.who === 'narrator') {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 140);
            g.addColorStop(0, hexToRgba(color, 0.32));
            g.addColorStop(1, hexToRgba(color, 0));
            ctx.fillStyle = g;
            ctx.fillRect(-140, -140, 280, 280);
            for (let i = 0; i < 4; i++) {
                ctx.strokeStyle = hexToRgba(color, 0.34 - i * 0.06);
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.ellipse(0, 0, 30 + i * 18, 16 + i * 10, this.t * 0.2 + i * 0.4, 0, TAU);
                ctx.stroke();
            }
            ctx.restore();
            return;
        }
        if (beat.who === 'ferrato' || beat.who === 'boss') {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 150);
            g.addColorStop(0, hexToRgba('#ffffff', 0.34));
            g.addColorStop(0.35, hexToRgba(color, 0.34));
            g.addColorStop(1, hexToRgba(color, 0));
            ctx.fillStyle = g;
            ctx.fillRect(-150, -150, 300, 300);
            ctx.fillStyle = '#05030b';
            ctx.beginPath();
            ctx.ellipse(0, 0, 74, 31, 0, 0, TAU);
            ctx.fill();
            ctx.fillStyle = hexToRgba(color, 0.9);
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, TAU);
            ctx.fill();
            ctx.fillStyle = '#05030b';
            ctx.beginPath();
            ctx.ellipse(Math.sin(this.t * 0.4) * 8, 0, 5, 18, 0, 0, TAU);
            ctx.fill();
            ctx.restore();
            return;
        }
        const def = CHARACTERS[beat.who];
        if (def) {
            const size = Math.min(rect.w * 0.64, rect.h * 0.92);
            drawCharacterPortrait(ctx, def, cx, cy + 8, size, this.t, false);
        }
    }
    // -------------------------------------------------------- textos e balões
    drawCaption(ctx, x, y, maxW, text, visible, seed, bottom = false) {
        const size = 15.5;
        const lineH = 20;
        const padX = 14;
        const padY = 11;
        const lines = wrapLines(ctx, text, maxW - padX * 2, size, FONTS.ui, 600);
        if (lines.length === 0)
            return;
        let textW = 0;
        for (const line of lines)
            textW = Math.max(textW, measure(ctx, line, size, FONTS.ui, 600));
        const boxW = Math.min(maxW, textW + padX * 2);
        const boxH = lines.length * lineH + padY * 2;
        const top = bottom ? y - boxH : y;
        const angle = seed % 2 === 0 ? -0.012 : 0.009;
        ctx.save();
        ctx.translate(x + boxW / 2, top + boxH / 2);
        ctx.rotate(angle);
        ctx.translate(-boxW / 2, -boxH / 2);
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = PAPER;
        ctx.fillRect(0, 0, boxW, boxH);
        ctx.restore();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(0, 0, boxW, boxH);
        ctx.strokeStyle = 'rgba(23,18,28,0.22)';
        ctx.lineWidth = 1;
        ctx.strokeRect(3.5, 3.5, boxW - 7, boxH - 7);
        ctx.fillStyle = '#1c1622';
        ctx.font = `600 ${size}px ${FONTS.ui}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        let used = 0;
        let lastPart = '';
        let lastLineIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (used >= visible)
                break;
            const line = lines[i];
            const part = line.slice(0, Math.max(0, Math.min(line.length, visible - used)));
            ctx.fillText(part, padX, padY + i * lineH);
            lastPart = part;
            lastLineIndex = i;
            used += line.length + 1;
        }
        if (visible < text.length && lastLineIndex >= 0) {
            const w = measure(ctx, lastPart, size, FONTS.ui, 600);
            ctx.fillStyle = 'rgba(28,22,34,0.65)';
            ctx.fillRect(padX + w + 2, padY + lastLineIndex * lineH - 1, 2, size + 1);
        }
        ctx.restore();
    }
    drawBalloon(ctx, x, y, maxW, text, visible, color, speaker, tailX, tailY) {
        const size = 15.5;
        const lineH = 20;
        const padX = 16;
        const padY = 13;
        const lines = wrapLines(ctx, text, maxW - padX * 2, size, FONTS.ui, 600);
        if (lines.length === 0)
            return;
        let textW = 0;
        for (const line of lines)
            textW = Math.max(textW, measure(ctx, line, size, FONTS.ui, 600));
        const boxW = Math.min(maxW, textW + padX * 2);
        const boxH = lines.length * lineH + padY * 2;
        // Nome do falante acima do balão.
        label(ctx, speaker, x + 4, y - 10, 9, hexToRgba(color, 0.9), {
            font: FONTS.mono,
            weight: 700,
            spacing: 1.6,
            outline: 'rgba(4,5,10,0.8)',
            outlineWidth: 3,
        });
        const base1 = { x: x + boxW * 0.56, y: y + boxH - 1 };
        const base2 = { x: x + boxW * 0.72, y: y + boxH - 1 };
        const tip = { x: tailX, y: tailY };
        // Rabicho (preenchimento antes do balão; laterais depois).
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(base1.x, base1.y);
        ctx.quadraticCurveTo(x + boxW * 0.66, y + boxH + 24, tip.x, tip.y);
        ctx.quadraticCurveTo(x + boxW * 0.6, y + boxH + 14, base2.x, base2.y);
        ctx.closePath();
        ctx.fillStyle = BALLOON;
        ctx.fill();
        ctx.restore();
        // Corpo do balão.
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        roundRectPath(ctx, x, y, boxW, boxH, 16);
        ctx.fillStyle = BALLOON;
        ctx.fill();
        ctx.restore();
        roundRectPath(ctx, x, y, boxW, boxH, 16);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // Laterais do rabicho.
        ctx.save();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(base1.x, base1.y);
        ctx.quadraticCurveTo(x + boxW * 0.66, y + boxH + 24, tip.x, tip.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(base2.x, base2.y);
        ctx.quadraticCurveTo(x + boxW * 0.6, y + boxH + 14, tip.x, tip.y);
        ctx.stroke();
        ctx.restore();
        // Texto.
        ctx.save();
        ctx.fillStyle = '#1c1622';
        ctx.font = `600 ${size}px ${FONTS.ui}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        let used = 0;
        let lastPart = '';
        let lastLineIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (used >= visible)
                break;
            const line = lines[i];
            const part = line.slice(0, Math.max(0, Math.min(line.length, visible - used)));
            ctx.fillText(part, x + padX, y + padY + i * lineH);
            lastPart = part;
            lastLineIndex = i;
            used += line.length + 1;
        }
        if (visible < text.length && lastLineIndex >= 0) {
            const w = measure(ctx, lastPart, size, FONTS.ui, 600);
            ctx.fillStyle = 'rgba(28,22,34,0.65)';
            ctx.fillRect(x + padX + w + 2, y + padY + lastLineIndex * lineH - 1, 2, size + 1);
        }
        ctx.restore();
    }
    // ------------------------------------------------------------ adereços
    drawBicycle(ctx, x, y, scale, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        for (const wx of [0, 92]) {
            ctx.beginPath();
            ctx.arc(wx, 0, 26, 0, TAU);
            ctx.stroke();
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI;
                ctx.beginPath();
                ctx.moveTo(wx - Math.cos(a) * 24, -Math.sin(a) * 24);
                ctx.lineTo(wx + Math.cos(a) * 24, Math.sin(a) * 24);
                ctx.stroke();
            }
            ctx.beginPath();
            ctx.arc(wx, 0, 3, 0, TAU);
            ctx.fill();
        }
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(30, -46);
        ctx.lineTo(62, -46);
        ctx.lineTo(92, 0);
        ctx.moveTo(30, -46);
        ctx.lineTo(46, 0);
        ctx.lineTo(92, 0);
        ctx.moveTo(62, -46);
        ctx.lineTo(46, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(26, -50);
        ctx.lineTo(40, -50);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(62, -46);
        ctx.lineTo(62, -62);
        ctx.lineTo(74, -66);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(6, -44);
        ctx.lineTo(38, -44);
        ctx.stroke();
        ctx.restore();
    }
    drawPizzaStack(ctx, x, y) {
        for (let i = 0; i < 3; i++) {
            const yy = y - i * 9;
            ctx.fillStyle = i === 2 ? '#e0604a' : '#c94f3d';
            ctx.strokeStyle = 'rgba(242,231,201,0.85)';
            ctx.lineWidth = 1.5;
            ctx.fillRect(x, yy - 8, 52, 8);
            ctx.strokeRect(x, yy - 8, 52, 8);
            ctx.strokeStyle = 'rgba(242,231,201,0.35)';
            ctx.beginPath();
            ctx.moveTo(x + 4, yy - 4);
            ctx.lineTo(x + 48, yy - 4);
            ctx.stroke();
        }
    }
    /**
     * Ravi antes do despertar: boné e uniforme de entregador, mochila térmica,
     * sem aura, sem armadura e sem eletricidade. A origem fica nos pés.
     */
    drawCivilianRavi(ctx, x, y, facing, scale, time, alarmed = false) {
        const ink = '#140e17';
        const skin = '#b4764c';
        const skinShade = '#8f5a39';
        const hair = '#201713';
        const cap = '#d2543f';
        const capShade = '#a83b2f';
        const shirt = '#ff8a3d';
        const shirtShade = '#d96a26';
        const jeans = '#2b3a58';
        const jeansShade = '#1d2942';
        const shoe = '#e8e2d4';
        const bag = '#b8453a';
        const cream = '#f2e7c9';
        const bob = Math.sin(time * 2.1) * 0.7;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(facing * scale, scale);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const limb = (x1, y1, x2, y2, w, color) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = ink;
            ctx.lineWidth = w + 4.5;
            ctx.stroke();
            ctx.strokeStyle = color;
            ctx.lineWidth = w;
            ctx.stroke();
        };
        // Pernas e tênis.
        limb(-8, -62, -10, -32, 9, jeansShade);
        limb(-10, -32, -13, -8, 8, jeansShade);
        limb(7, -62, 10, -32, 9, jeans);
        limb(10, -32, 12, -8, 8, jeans);
        for (const sx of [-20, 4]) {
            ctx.save();
            ctx.translate(sx, -7);
            roundRectPath(ctx, -2, -4, 19, 8, 4);
            ctx.fillStyle = shoe;
            ctx.strokeStyle = ink;
            ctx.lineWidth = 3;
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(2, 1);
            ctx.lineTo(15, 1);
            ctx.strokeStyle = '#c94f3d';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
        // Mochila térmica de entregas.
        ctx.save();
        ctx.translate(-26, -104 + bob);
        roundRectPath(ctx, -12, 0, 24, 36, 7);
        ctx.fillStyle = bag;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3.5;
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = cream;
        ctx.fillRect(-10, 5, 20, 5);
        ctx.beginPath();
        ctx.arc(0, 24, 5, 0, TAU);
        ctx.strokeStyle = cream;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        // Polo laranja da pizzaria.
        ctx.beginPath();
        ctx.moveTo(-18, -114 + bob);
        ctx.lineTo(17, -116 + bob);
        ctx.lineTo(14, -64);
        ctx.lineTo(-14, -64);
        ctx.closePath();
        ctx.fillStyle = shirt;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3.5;
        ctx.fill();
        ctx.stroke();
        // Sombra lateral do torso.
        ctx.beginPath();
        ctx.moveTo(17, -116 + bob);
        ctx.lineTo(14, -64);
        ctx.lineTo(5, -64);
        ctx.lineTo(8, -114 + bob);
        ctx.closePath();
        ctx.fillStyle = hexToRgba(shirtShade, 0.8);
        ctx.fill();
        // Cinto.
        ctx.fillStyle = '#1a2233';
        ctx.fillRect(-14, -68, 28, 6);
        // Gola creme.
        ctx.beginPath();
        ctx.moveTo(-8, -115 + bob);
        ctx.lineTo(0, -103 + bob);
        ctx.lineTo(8, -115 + bob);
        ctx.lineTo(2, -118 + bob);
        ctx.lineTo(-2, -118 + bob);
        ctx.closePath();
        ctx.fillStyle = cream;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        // Emblema da pizzaria no peito.
        ctx.save();
        ctx.translate(1, -92 + bob);
        ctx.beginPath();
        ctx.moveTo(-6, -7);
        ctx.lineTo(6, -7);
        ctx.lineTo(0, 6);
        ctx.closePath();
        ctx.fillStyle = cream;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.8;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        // Alça da mochila atravessando o peito.
        ctx.beginPath();
        ctx.moveTo(-13, -112 + bob);
        ctx.lineTo(10, -70);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 7;
        ctx.stroke();
        ctx.strokeStyle = cream;
        ctx.lineWidth = 3;
        ctx.stroke();
        // Braços.
        if (alarmed) {
            limb(-16, -110 + bob, -27, -96, 7, shirtShade);
            limb(-27, -96, -24, -76, 6, skinShade);
            limb(15, -110 + bob, 27, -102, 7, shirt);
            limb(27, -102, 27, -122, 6, skin);
        }
        else {
            limb(-16, -110 + bob, -22, -89, 7, shirtShade);
            limb(-22, -89, -19, -70, 6, skinShade);
            limb(15, -110 + bob, 22, -88, 7, shirt);
            limb(22, -88, 19, -69, 6, skin);
        }
        const hands = alarmed
            ? [
                [-24, -76],
                [27, -122],
            ]
            : [
                [-19, -70],
                [19, -69],
            ];
        for (const [hx, hy] of hands) {
            ctx.beginPath();
            ctx.arc(hx, hy, 4.2, 0, TAU);
            ctx.fillStyle = hx < 0 ? skinShade : skin;
            ctx.strokeStyle = ink;
            ctx.lineWidth = 2.5;
            ctx.fill();
            ctx.stroke();
        }
        const headY = -134 + bob;
        // Pescoço.
        ctx.beginPath();
        ctx.moveTo(-4, -122 + bob);
        ctx.lineTo(-4, -116 + bob);
        ctx.lineTo(6, -116 + bob);
        ctx.lineTo(6, -122 + bob);
        ctx.fillStyle = skinShade;
        ctx.fill();
        // Orelha.
        ctx.beginPath();
        ctx.arc(-6, headY + 2, 4.5, 0, TAU);
        ctx.fillStyle = skinShade;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.5;
        ctx.fill();
        ctx.stroke();
        // Cabeça.
        ctx.beginPath();
        ctx.ellipse(2, headY, 15, 16.5, -0.06, 0, TAU);
        ctx.fillStyle = skin;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3.2;
        ctx.fill();
        ctx.stroke();
        // Nariz.
        ctx.beginPath();
        ctx.moveTo(16, headY - 2);
        ctx.lineTo(20, headY + 3);
        ctx.lineTo(15, headY + 4);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.2;
        ctx.stroke();
        // Olho.
        ctx.beginPath();
        ctx.ellipse(10, headY - 3, 3.2, 2.4, 0, 0, TAU);
        ctx.fillStyle = '#f8f4ea';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(11, headY - 3, 1.5, 0, TAU);
        ctx.fillStyle = '#1a1420';
        ctx.fill();
        // Sobrancelha.
        ctx.beginPath();
        ctx.moveTo(6, headY - 8);
        ctx.lineTo(14, headY - 7);
        ctx.strokeStyle = hair;
        ctx.lineWidth = 2.4;
        ctx.stroke();
        // Boca.
        ctx.beginPath();
        ctx.moveTo(12, headY + 8);
        ctx.quadraticCurveTo(15, headY + 10, 17, headY + 7);
        ctx.strokeStyle = '#5c3028';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        // Cabelo.
        ctx.beginPath();
        ctx.moveTo(-13, headY - 6);
        ctx.quadraticCurveTo(-14, headY - 20, 2, headY - 17);
        ctx.quadraticCurveTo(16, headY - 16, 15, headY - 4);
        ctx.lineTo(11, headY - 8);
        ctx.quadraticCurveTo(4, headY - 12, -4, headY - 9);
        ctx.lineTo(-7, headY - 2);
        ctx.closePath();
        ctx.fillStyle = hair;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-11, headY - 7);
        ctx.lineTo(-12, headY + 6);
        ctx.lineTo(-8, headY + 4);
        ctx.lineTo(-7, headY - 4);
        ctx.closePath();
        ctx.fill();
        // Boné de entregador.
        ctx.beginPath();
        ctx.moveTo(-13, headY - 12);
        ctx.quadraticCurveTo(-12, headY - 28, 3, headY - 27);
        ctx.quadraticCurveTo(15, headY - 26, 16, headY - 13);
        ctx.lineTo(-13, headY - 12);
        ctx.closePath();
        ctx.fillStyle = cap;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(14, headY - 14);
        ctx.quadraticCurveTo(28, headY - 14, 30, headY - 9);
        ctx.quadraticCurveTo(22, headY - 6, 14, headY - 9);
        ctx.closePath();
        ctx.fillStyle = capShade;
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-11, headY - 15);
        ctx.lineTo(14, headY - 16);
        ctx.strokeStyle = cream;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    }
    /** Close-up civil de Ravi: sem raios, sem aura, só o rosto e o uniforme. */
    drawCivilianRaviPortrait(ctx, cx, cy, size, time) {
        const s = size / 272;
        const ink = '#140e17';
        const skin = '#b4764c';
        const skinShade = '#8f5a39';
        const hair = '#201713';
        const cap = '#d2543f';
        const capShade = '#a83b2f';
        const shirt = '#ff8a3d';
        const shirtShade = '#d96a26';
        const cream = '#f2e7c9';
        const breathe = Math.sin(time * 1.6) * 1.2;
        ctx.save();
        ctx.translate(cx, cy + breathe);
        ctx.scale(s, s);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Ombros / polo.
        ctx.beginPath();
        ctx.moveTo(-132, 140);
        ctx.quadraticCurveTo(-124, 88, -76, 66);
        ctx.lineTo(-40, 54);
        ctx.lineTo(42, 54);
        ctx.lineTo(82, 68);
        ctx.quadraticCurveTo(126, 90, 134, 140);
        ctx.closePath();
        ctx.fillStyle = shirt;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 5;
        ctx.fill();
        ctx.stroke();
        // Sombra do ombro esquerdo.
        ctx.beginPath();
        ctx.moveTo(-132, 140);
        ctx.quadraticCurveTo(-124, 88, -76, 66);
        ctx.lineTo(-48, 58);
        ctx.quadraticCurveTo(-86, 96, -92, 140);
        ctx.closePath();
        ctx.fillStyle = hexToRgba(shirtShade, 0.7);
        ctx.fill();
        // Pescoço.
        ctx.beginPath();
        ctx.moveTo(-24, 58);
        ctx.lineTo(-20, 18);
        ctx.lineTo(24, 18);
        ctx.lineTo(28, 58);
        ctx.closePath();
        ctx.fillStyle = skinShade;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 4;
        ctx.fill();
        ctx.stroke();
        // Gola creme.
        ctx.beginPath();
        ctx.moveTo(-46, 58);
        ctx.lineTo(-10, 44);
        ctx.lineTo(0, 60);
        ctx.lineTo(12, 44);
        ctx.lineTo(46, 58);
        ctx.lineTo(38, 76);
        ctx.lineTo(-38, 76);
        ctx.closePath();
        ctx.fillStyle = cream;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 4;
        ctx.fill();
        ctx.stroke();
        // Alça da mochila.
        ctx.beginPath();
        ctx.moveTo(-70, 70);
        ctx.quadraticCurveTo(-40, 120, -16, 142);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 18;
        ctx.stroke();
        ctx.strokeStyle = '#b8453a';
        ctx.lineWidth = 11;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(242,231,201,0.55)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([7, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
        // Orelha.
        ctx.beginPath();
        ctx.ellipse(-58, -8, 13, 20, -0.12, 0, TAU);
        ctx.fillStyle = skinShade;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 4;
        ctx.fill();
        ctx.stroke();
        // Cabeça.
        ctx.beginPath();
        ctx.moveTo(-60, -46);
        ctx.quadraticCurveTo(-62, 30, -18, 54);
        ctx.quadraticCurveTo(20, 70, 48, 30);
        ctx.quadraticCurveTo(66, 2, 58, -46);
        ctx.quadraticCurveTo(48, -86, -4, -86);
        ctx.quadraticCurveTo(-54, -84, -60, -46);
        ctx.closePath();
        ctx.fillStyle = skin;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 5;
        ctx.fill();
        ctx.stroke();
        // Sombra de barba.
        ctx.beginPath();
        ctx.moveTo(-44, 14);
        ctx.quadraticCurveTo(-30, 58, 10, 56);
        ctx.quadraticCurveTo(44, 48, 54, 12);
        ctx.quadraticCurveTo(36, 48, 4, 48);
        ctx.quadraticCurveTo(-26, 46, -44, 14);
        ctx.closePath();
        ctx.fillStyle = 'rgba(60,32,26,0.18)';
        ctx.fill();
        // Cabelo nas têmporas.
        ctx.beginPath();
        ctx.moveTo(-60, -38);
        ctx.quadraticCurveTo(-68, -6, -56, 6);
        ctx.lineTo(-46, -2);
        ctx.quadraticCurveTo(-50, -24, -44, -42);
        ctx.closePath();
        ctx.fillStyle = hair;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(56, -42);
        ctx.quadraticCurveTo(64, -12, 56, 4);
        ctx.lineTo(48, -4);
        ctx.quadraticCurveTo(52, -24, 46, -42);
        ctx.closePath();
        ctx.fill();
        // Sobrancelhas.
        ctx.strokeStyle = hair;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(-42, -28);
        ctx.quadraticCurveTo(-24, -38, -6, -30);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(22, -31);
        ctx.quadraticCurveTo(38, -39, 50, -30);
        ctx.stroke();
        // Olhos (normais, sem brilho de poder).
        const eyes = [
            [-24, -8, 17],
            [36, -9, 16],
        ];
        for (const [ex, ey, w] of eyes) {
            ctx.beginPath();
            ctx.ellipse(ex, ey, w, 9, 0, 0, TAU);
            ctx.fillStyle = '#f8f4ea';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 3;
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(ex + 2, ey + 1, 5.5, 0, TAU);
            ctx.fillStyle = '#241a1a';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ex + 4, ey - 1, 1.8, 0, TAU);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }
        // Nariz.
        ctx.beginPath();
        ctx.moveTo(6, -4);
        ctx.quadraticCurveTo(14, 12, 2, 16);
        ctx.strokeStyle = skinShade;
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-2, 17, 3, 0, TAU);
        ctx.fillStyle = skinShade;
        ctx.fill();
        // Boca: sorriso cansado.
        ctx.beginPath();
        ctx.moveTo(-14, 34);
        ctx.quadraticCurveTo(2, 42, 20, 32);
        ctx.strokeStyle = '#5c3028';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-12, 35);
        ctx.quadraticCurveTo(2, 38, 10, 34);
        ctx.strokeStyle = 'rgba(248,244,234,0.75)';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Gota de suor.
        ctx.beginPath();
        ctx.moveTo(58, -44);
        ctx.quadraticCurveTo(64, -34, 58, -28);
        ctx.quadraticCurveTo(52, -34, 58, -44);
        ctx.closePath();
        ctx.fillStyle = '#cfe9f7';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.5;
        ctx.fill();
        ctx.stroke();
        // Boné.
        ctx.beginPath();
        ctx.moveTo(-64, -54);
        ctx.quadraticCurveTo(-58, -112, 2, -112);
        ctx.quadraticCurveTo(58, -112, 64, -54);
        ctx.closePath();
        ctx.fillStyle = cap;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 5;
        ctx.fill();
        ctx.stroke();
        // Aba do boné.
        ctx.beginPath();
        ctx.moveTo(56, -58);
        ctx.quadraticCurveTo(106, -58, 112, -42);
        ctx.quadraticCurveTo(92, -34, 58, -42);
        ctx.closePath();
        ctx.fillStyle = capShade;
        ctx.fill();
        ctx.stroke();
        // Faixa creme.
        ctx.beginPath();
        ctx.moveTo(-60, -60);
        ctx.quadraticCurveTo(0, -70, 62, -60);
        ctx.strokeStyle = cream;
        ctx.lineWidth = 6;
        ctx.stroke();
        // Emblema de pizza no boné.
        ctx.beginPath();
        ctx.moveTo(-8, -88);
        ctx.lineTo(14, -86);
        ctx.lineTo(4, -68);
        ctx.closePath();
        ctx.fillStyle = cream;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.5;
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-1, -80, 1.6, 0, TAU);
        ctx.arc(7, -82, 1.6, 0, TAU);
        ctx.fillStyle = '#c94f3d';
        ctx.fill();
        ctx.restore();
    }
    drawCrawler(ctx, x, y, scale, color, glowingEyes) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(side * 12, -55);
            ctx.lineTo(side * 26, -20);
            ctx.lineTo(side * 18, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(side * 8, -55);
            ctx.lineTo(side * 2, -18);
            ctx.lineTo(side * 14, 0);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.ellipse(0, -80, 26, 38, 0.15, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-18, -96);
        ctx.lineTo(-46, -64);
        ctx.lineTo(-38, -18);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(18, -96);
        ctx.lineTo(48, -70);
        ctx.lineTo(42, -22);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(6, -122, 18, 26, -0.2, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-6, -112);
        ctx.lineTo(24, -104);
        ctx.lineTo(8, -96);
        ctx.closePath();
        ctx.fill();
        if (glowingEyes) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (const [ex, ey] of [
                [2, -126],
                [14, -128],
            ]) {
                const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, 13);
                g.addColorStop(0, 'rgba(255,51,87,0.95)');
                g.addColorStop(1, 'rgba(255,51,87,0)');
                ctx.fillStyle = g;
                ctx.fillRect(ex - 13, ey - 13, 26, 26);
                ctx.fillStyle = '#ff5a7a';
                ctx.beginPath();
                ctx.arc(ex, ey, 2.2, 0, TAU);
                ctx.fill();
            }
            ctx.restore();
        }
        ctx.restore();
    }
    drawSpeedLines(ctx, cx, cy, rect, color, count) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < count; i++) {
            const a = (i / count) * TAU + (i % 2) * 0.05;
            const inner = 40 + (i % 5) * 14;
            const outer = Math.max(rect.w, rect.h) * 0.78;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
            ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
            ctx.stroke();
        }
        ctx.restore();
    }
}
//# sourceMappingURL=comic.js.map