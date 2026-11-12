/**
 * Cutscene em quadrinhos de toda a campanha.
 *
 * Cada página exibe até três painéis desenhados proceduralmente (fundo da fase,
 * personagens, retratos e efeitos). A narração usa caixas de legenda; as falas
 * usam balões com rabicho. ENTER/clique avança; ESC pula a cena.
 *
 * A cena reaproveita os mesmos `StoryBeat[]` da cutscene normal, então nenhum
 * texto precisou ser reescrito. Os capítulos de abertura de arco recebem arte
 * extra e uma página inteira de despertar.
 */
import { CHAPTERS_PER_ARC } from '../data/stages.js?v=6ccbb66fdb55';
import { STORY } from '../data/story.js?v=6ccbb66fdb55';
import { CHARACTERS } from '../data/characters.js?v=6ccbb66fdb55';
import { clamp, easeOutCubic, hexToRgba, TAU } from '../core/math.js?v=6ccbb66fdb55';
import { drawStageBackground } from '../render/backgrounds.js?v=6ccbb66fdb55';
import { BASE, drawCharacterFigure, drawCharacterPortrait } from '../render/characters.js?v=6ccbb66fdb55';
import { FONTS, label, roundRectPath } from '../render/theme.js?v=6ccbb66fdb55';
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
/** Capítulos de abertura de arco, que mostram o herói despertando. */
export const AWAKENING_STAGES = new Set([1, 8, 15, 22, 29, 36]);
const AWAKENING_SFX = {
    ravi: 'abilityRavi',
    miriam: 'abilityMiriam',
    kael: 'abilityKael',
    ozric: 'abilityOzric',
    elodie: 'abilityElodie',
    thryc: 'abilityThryc',
};
const halftoneCache = new Map();
/** Ruído determinístico para texturas de impressão. */
function comicNoise(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}
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
    /** Quadro de página inteira em que o herói acorda com o Ferrato. */
    isAwakeningPanel(globalIndex) {
        return this.phase === 'intro' && this.stage.chapter === 1 && globalIndex === 3;
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
            // O despertar merece som próprio, disparado uma única vez.
            if (this.isAwakeningPanel(this.active)) {
                this.game.audio.sfx(AWAKENING_SFX[this.stage.character]);
            }
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
        this.drawComicFx(ctx, rect, globalIndex);
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
        if (this.isAwakeningPanel(globalIndex)) {
            this.drawAwakeningPanel(ctx, rect, index);
            return;
        }
        if (this.stage.id === 1 && this.phase === 'intro' && this.page === 0) {
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
        // Cap. 14 (finale do Arco II): o último quadro mostra o braço de Miriam acendendo.
        if (this.stage.arc === 2 && this.stage.chapter === CHAPTERS_PER_ARC && this.phase === 'intro' && globalIndex === 4) {
            this.drawMiriamIgnitionPanel(ctx, rect);
            return;
        }
        // Cap. 27 (crônica do Arco IV): os três Despertos quebram a última corrente de Ozric.
        if (this.stage.id === 27 && this.phase === 'intro' && globalIndex === 2) {
            this.drawOzricRescuePanel(ctx, rect);
            return;
        }
        // Cap. 41 (crônica do Arco VI): a mesa das seis cadeiras, a memória que o Ferrato não digeriu.
        if (this.stage.id === 41 && this.phase === 'intro' && globalIndex === 2) {
            this.drawSixChairsPanel(ctx, rect);
            return;
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
            const awakening = this.isAwakeningPanel(globalIndex);
            const maxW = Math.min(rect.w - 40, awakening ? 660 : index === 2 ? 540 : 340);
            const bottom = index === 2 && !awakening;
            const y = bottom ? rect.y + rect.h - 18 : rect.y + 18;
            this.drawCaption(ctx, rect.x + 20, y, maxW, beat.text, visible, globalIndex, bottom, awakening);
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
    /**
     * Passe de textura compartilhado por todos os quadros: retícula de impressão,
     * grão, riscos de tinta e vinheta. Mantém os painéis especiais e os genéricos
     * com a mesma linguagem visual de HQ.
     */
    drawComicFx(ctx, rect, seed) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.w, rect.h);
        ctx.clip();
        const pattern = halftonePattern(ctx, '#f2e7c9');
        if (pattern) {
            ctx.globalAlpha = 0.035;
            ctx.fillStyle = pattern;
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            ctx.globalAlpha = 1;
        }
        // Grão e riscos de impressão, determinísticos por quadro.
        for (let i = 0; i < 22; i++) {
            const n = seed * 37 + i * 13;
            const x = rect.x + comicNoise(n) * rect.w;
            const y = rect.y + comicNoise(n + 5) * rect.h;
            const w = 6 + comicNoise(n + 9) * 34;
            ctx.strokeStyle = `rgba(242,231,201,${0.018 + comicNoise(n + 2) * 0.04})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y + (comicNoise(n + 4) - 0.5) * 2);
            ctx.stroke();
        }
        // Vinheta de papel impresso.
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const vignette = ctx.createRadialGradient(cx, cy, Math.min(rect.w, rect.h) * 0.28, cx, cy, Math.max(rect.w, rect.h) * 0.72);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(0.72, 'rgba(0,0,0,0.06)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = vignette;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
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
    /** Página inteira: o instante em que o Ferrato acorda em cada Desperto. */
    drawAwakeningPanel(ctx, rect, index) {
        const def = CHARACTERS[this.stage.character];
        const c = def.colors;
        const groundY = rect.y + rect.h - 52;
        const cx = rect.x + rect.w * 0.54;
        const coreY = groundY - 210;
        // Kael desperta flutuando; os demais fincam os pés no chão.
        const heroY = groundY - (def.id === 'kael' ? 26 : 0);
        // Cores muito claras (Élodie) precisam de um meio mais escuro no clarão.
        const light = this.isLightAccent(c.accent);
        const mid = light ? c.secondary : c.accent;
        // Cenário frio e escuro, como se o mundo tivesse perdido a cor.
        this.drawBackgroundIn(ctx, rect, (this.stage.width - this.game.width) * 0.52, 1.08);
        ctx.fillStyle = 'rgba(3,5,12,0.74)';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
        wash.addColorStop(0, hexToRgba(c.aura, 0.3));
        wash.addColorStop(0.55, 'rgba(4,10,26,0.24)');
        wash.addColorStop(1, 'rgba(2,3,8,0.76)');
        ctx.fillStyle = wash;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        // Sombra no chão.
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(cx, groundY + 8, 132, 18, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
        // Explosão de energia atrás do herói.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const burst = ctx.createRadialGradient(cx, coreY, 6, cx, coreY, 330);
        burst.addColorStop(0, `rgba(255,255,255,${light ? 0.78 : 0.92})`);
        burst.addColorStop(0.12, hexToRgba(mid, light ? 0.5 : 0.62));
        burst.addColorStop(0.42, hexToRgba(c.aura, light ? 0.18 : 0.24));
        burst.addColorStop(1, hexToRgba(c.aura, 0));
        ctx.fillStyle = burst;
        ctx.fillRect(cx - 340, coreY - 340, 680, 680);
        this.drawSpeedLines(ctx, cx, coreY, rect, hexToRgba(c.accent, light ? 0.12 : 0.16), 40);
        // Anéis de choque irregulares.
        for (let ring = 0; ring < 3; ring++) {
            const radius = 118 + ring * 64 + Math.sin(this.t * 2.2 + ring * 1.7) * 7;
            ctx.beginPath();
            for (let i = 0; i <= 48; i++) {
                const a = (i / 48) * TAU;
                const r = radius * (0.9 + 0.1 * Math.sin(i * 2.3 + ring * 3.1 + this.t * 3.4));
                const px = cx + Math.cos(a) * r;
                const py = coreY + Math.sin(a) * r;
                if (i === 0)
                    ctx.moveTo(px, py);
                else
                    ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.strokeStyle = hexToRgba(c.accent, 0.32 - ring * 0.08);
            ctx.lineWidth = ring === 0 ? 3 : 2;
            ctx.stroke();
        }
        // Raios saindo do núcleo.
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * TAU + 0.18;
            const inner = 46 + (i % 3) * 12;
            const outer = 210 + (i % 4) * 42;
            this.drawLightning(ctx, cx + Math.cos(a) * inner, coreY + Math.sin(a) * inner, cx + Math.cos(a) * outer, coreY + Math.sin(a) * outer, i + 1, hexToRgba(c.accent, light ? 0.6 : 0.78));
        }
        ctx.restore();
        // Rachaduras no chão.
        ctx.save();
        ctx.lineCap = 'round';
        for (let i = 0; i < 8; i++) {
            const dir = i % 2 === 0 ? 1 : -1;
            const len = 130 + (i % 5) * 46;
            ctx.beginPath();
            ctx.moveTo(cx + dir * 18, groundY + 2);
            for (let s = 1; s <= 5; s++) {
                const px = cx + dir * (18 + (len * s) / 5);
                const py = groundY + 2 + Math.sin(i * 2.1 + s * 1.7) * (4 + (i % 3) * 3);
                ctx.lineTo(px, py);
            }
            ctx.strokeStyle = hexToRgba(c.accent, 0.2);
            ctx.lineWidth = 7;
            ctx.stroke();
            ctx.strokeStyle = hexToRgba(c.glow, 0.78);
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();
        // Inimigos recuando da explosão.
        this.drawRecoilingFoe(ctx, def.id, rect.x + 182, groundY + 10, 1.7, -0.34, c.accent);
        this.drawRecoilingFoe(ctx, def.id, rect.x + rect.w - 172, groundY + 12, 1.82, 0.3, c.accent);
        // Objetos civis arrancados pelo despertar.
        this.drawAwakeningProps(ctx, rect, def);
        // Detalhes próprios de cada elemento.
        this.drawAwakeningExtras(ctx, rect, def, cx, coreY, groundY);
        // Aura de energia ao redor do corpo.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const aura = ctx.createRadialGradient(cx, heroY - 150, 20, cx, heroY - 150, 260);
        aura.addColorStop(0, hexToRgba(c.accent, light ? 0.2 : 0.3));
        aura.addColorStop(0.55, hexToRgba(c.aura, light ? 0.08 : 0.12));
        aura.addColorStop(1, hexToRgba(c.aura, 0));
        ctx.fillStyle = aura;
        ctx.fillRect(cx - 270, heroY - 420, 540, 500);
        ctx.restore();
        // Contraste atrás do herói: silhuetas claras não somem no clarão.
        ctx.save();
        const sep = ctx.createRadialGradient(cx, heroY - 150, 30, cx, heroY - 150, 210);
        sep.addColorStop(0, 'rgba(4,5,12,0.38)');
        sep.addColorStop(0.65, 'rgba(4,5,12,0.2)');
        sep.addColorStop(1, 'rgba(4,5,12,0)');
        ctx.fillStyle = sep;
        ctx.fillRect(cx - 230, heroY - 380, 460, 440);
        ctx.restore();
        const build = {
            ...BASE,
            bob: Math.sin(this.t * 5) * 1.2,
            lean: -0.1,
            crouch: 0.02,
            armFront: 2.35,
            armFrontElbow: 0.12,
            armBack: -2.35,
            armBackElbow: -0.12,
            legFront: 0.34,
            legFrontKnee: 0.06,
            legBack: -0.34,
            legBackKnee: -0.06,
            headTilt: -0.18,
            bodyRot: -0.03,
            weaponA: this.awakeningWeaponAngle(def),
            airborne: def.id === 'kael',
        };
        drawCharacterFigure(ctx, def, cx, heroY, 1, 2.7, this.t, build, 0.05 + Math.sin(this.t * 9) * 0.03);
        // Núcleo aceso no peito.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const core = ctx.createRadialGradient(cx, coreY, 2, cx, coreY, 54);
        core.addColorStop(0, 'rgba(255,255,255,0.95)');
        core.addColorStop(0.25, hexToRgba(c.accent, light ? 0.6 : 0.72));
        core.addColorStop(1, hexToRgba(c.aura, 0));
        ctx.fillStyle = core;
        ctx.fillRect(cx - 62, coreY - 62, 124, 124);
        ctx.restore();
        // Arcos de energia nas mãos erguidas.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const dir of [-1, 1]) {
            const hx = cx + dir * 79;
            const hy = heroY - 272;
            this.drawLightning(ctx, hx, hy, hx + dir * 44, hy - 58, dir === 1 ? 31 : 32, hexToRgba(c.accent, 0.9));
        }
        ctx.restore();
        // Onomatopeias do despertar.
        for (const sfx of this.awakeningSfx(def)) {
            this.drawAwakeningSfx(ctx, rect, sfx, index);
        }
    }
    isLightAccent(hex) {
        const n = parseInt(hex.replace('#', ''), 16);
        const r = (n >> 16) & 255;
        const g = (n >> 8) & 255;
        const b = n & 255;
        return r * 0.299 + g * 0.587 + b * 0.114 > 220;
    }
    awakeningWeaponAngle(def) {
        switch (def.weapon) {
            case 'scythe':
                return -2.25;
            case 'sword':
                return -2.1;
            case 'blades':
                return -1.85;
            case 'gravity':
                return -0.85;
            default:
                return -0.35;
        }
    }
    awakeningSfx(def) {
        const table = {
            ravi: ['FZZZAP!', '#8df4ff', 'KRAAK!'],
            miriam: ['FWOOM!', '#ffb066', 'KRUMP!'],
            kael: ['VRRRM!', '#9df6ff', 'WUMP!'],
            ozric: ['SHRRK!', '#ff7a8c', 'CLANG!'],
            elodie: ['SHING!', '#fff4cd', 'FWOOM!'],
            thryc: ['VWOOM!', '#b48bff', 'ECHO!'],
        };
        const [main, color, secondary] = table[def.id];
        return [
            { text: main, color, x: 0.78, y: 0.2, size: 76, rotation: -0.1 },
            {
                text: secondary,
                color: def.id === 'thryc' ? '#6ff2ff' : '#ffd166',
                x: 0.34,
                y: 0.885,
                size: 34,
                rotation: 0.12,
            },
        ];
    }
    drawAwakeningSfx(ctx, rect, sfx, index) {
        const age = this.t - this.panelStart[index];
        const punch = age < 0.35 ? 1.45 - clamp(age / 0.35, 0, 1) * 0.45 : 1;
        ctx.save();
        ctx.translate(rect.x + rect.w * sfx.x, rect.y + rect.h * sfx.y);
        ctx.rotate(sfx.rotation);
        ctx.scale(punch, punch);
        ctx.font = `900 ${sfx.size}px ${FONTS.ui}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = sfx.size > 50 ? 13 : 8;
        ctx.strokeStyle = '#07121c';
        ctx.strokeText(sfx.text, 0, 0);
        ctx.fillStyle = sfx.color;
        ctx.fillText(sfx.text, 0, 0);
        if (sfx.size > 50) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillText(sfx.text, -2, -3);
        }
        ctx.restore();
    }
    /** Detalhes de energia que diferenciam o despertar de cada herói. */
    drawAwakeningExtras(ctx, rect, def, cx, coreY, groundY) {
        const c = def.colors;
        switch (def.id) {
            case 'miriam': {
                // Brasas subindo e poças de magma.
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                for (let i = 0; i < 28; i++) {
                    const t = (this.t * 0.4 + i * 0.37) % 1;
                    const x = rect.x + rect.w * 0.16 + ((i * 97) % Math.max(1, Math.round(rect.w * 0.68)));
                    const y = groundY - t * 320;
                    const r = 1.4 + (i % 3) * 0.8;
                    ctx.fillStyle = hexToRgba(i % 2 === 0 ? c.accent : c.glow, 0.5 * (1 - t));
                    ctx.beginPath();
                    ctx.arc(x + Math.sin(this.t + i) * 8, y, r, 0, TAU);
                    ctx.fill();
                }
                for (const side of [-1, 1]) {
                    const px = cx + side * (126 + (side === 1 ? 18 : 0));
                    const g = ctx.createRadialGradient(px, groundY + 2, 2, px, groundY + 2, 90);
                    g.addColorStop(0, hexToRgba(c.accent, 0.5));
                    g.addColorStop(1, hexToRgba(c.aura, 0));
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.ellipse(px, groundY + 2, 90, 18, 0, 0, TAU);
                    ctx.fill();
                }
                ctx.restore();
                break;
            }
            case 'kael': {
                // Detritos flutuando em órbita.
                ctx.save();
                for (let i = 0; i < 14; i++) {
                    const a = (i / 14) * TAU + this.t * 0.25;
                    const r = 150 + (i % 4) * 40;
                    const x = cx + Math.cos(a) * r;
                    const y = coreY + Math.sin(a) * r * 0.55;
                    ctx.fillStyle = i % 3 === 0 ? hexToRgba(c.accent, 0.55) : 'rgba(20,24,40,0.85)';
                    ctx.strokeStyle = hexToRgba(c.accent, 0.4);
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(x - 8, y);
                    ctx.lineTo(x + 4, y - 6);
                    ctx.lineTo(x + 10, y + 3);
                    ctx.lineTo(x - 2, y + 8);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
                ctx.restore();
                break;
            }
            case 'ozric': {
                // Chamas negras subindo do chão.
                this.drawBlackFlames(ctx, cx, groundY, c.accent);
                break;
            }
            case 'elodie': {
                // Halo e penas de luz.
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                const hy = groundY - 352;
                ctx.strokeStyle = hexToRgba(c.accent, 0.8);
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.ellipse(cx, hy, 62, 14, 0, 0, TAU);
                ctx.stroke();
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(cx, hy, 68, 17, 0, 0, TAU);
                ctx.stroke();
                for (let i = 0; i < 12; i++) {
                    const a = (i / 12) * TAU + this.t * 0.3;
                    const r = 120 + (i % 4) * 30;
                    const x = cx + Math.cos(a) * r;
                    const y = coreY + Math.sin(a) * r * 0.7;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(a + Math.PI / 2);
                    ctx.fillStyle = hexToRgba(c.accent, 0.45);
                    ctx.beginPath();
                    ctx.ellipse(0, 0, 4, 14, 0, 0, TAU);
                    ctx.fill();
                    ctx.restore();
                }
                ctx.restore();
                break;
            }
            case 'thryc': {
                // Fragmentos de memória girando.
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                for (let i = 0; i < 18; i++) {
                    const a = (i / 18) * TAU + this.t * 0.2;
                    const r = 110 + (i % 5) * 34;
                    const x = cx + Math.cos(a) * r;
                    const y = coreY + Math.sin(a) * r * 0.6;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(a + this.t * 0.5);
                    ctx.fillStyle = hexToRgba(i % 2 === 0 ? c.accent : c.glow, 0.35);
                    ctx.beginPath();
                    ctx.moveTo(0, -10);
                    ctx.lineTo(6, 0);
                    ctx.lineTo(0, 12);
                    ctx.lineTo(-5, 2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
                ctx.restore();
                break;
            }
            default:
                break;
        }
    }
    drawBlackFlames(ctx, cx, groundY, accent) {
        ctx.save();
        for (let i = 0; i < 10; i++) {
            const x = cx - 180 + i * 40 + Math.sin(this.t * 2 + i) * 10;
            const h = 90 + (i % 4) * 34 + Math.sin(this.t * 3 + i * 1.7) * 12;
            ctx.beginPath();
            ctx.moveTo(x - 18, groundY + 4);
            ctx.quadraticCurveTo(x - 10, groundY - h * 0.55, x + Math.sin(this.t + i) * 12, groundY - h);
            ctx.quadraticCurveTo(x + 12, groundY - h * 0.5, x + 18, groundY + 4);
            ctx.closePath();
            ctx.fillStyle = 'rgba(6,3,10,0.88)';
            ctx.fill();
            ctx.strokeStyle = hexToRgba(accent, 0.5);
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();
    }
    drawRecoilingFoe(ctx, kind, x, y, scale, rotation, accent) {
        if (kind === 'ravi') {
            this.drawRecoilingCrawler(ctx, x, y, scale, rotation);
            return;
        }
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.ellipse(x, y, 46 * scale, 9 * scale, 0, 0, TAU);
        ctx.fill();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        // Halo colorido nas bordas para a silhueta não sumir no escuro.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = hexToRgba(accent, 0.24);
        this.drawFoeSilhouette(ctx, kind, scale * 1.07);
        ctx.restore();
        ctx.fillStyle = '#12121d';
        this.drawFoeSilhouette(ctx, kind, scale);
        // Detalhes luminosos próprios de cada criatura.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = hexToRgba(accent, 0.75);
        ctx.fillStyle = hexToRgba(accent, 0.75);
        ctx.lineWidth = 2;
        if (kind === 'miriam') {
            ctx.beginPath();
            ctx.moveTo(-18 * scale, -70 * scale);
            ctx.lineTo(-4 * scale, -54 * scale);
            ctx.lineTo(-12 * scale, -38 * scale);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(16 * scale, -82 * scale);
            ctx.lineTo(6 * scale, -62 * scale);
            ctx.lineTo(18 * scale, -46 * scale);
            ctx.stroke();
        }
        else if (kind === 'kael') {
            ctx.beginPath();
            ctx.arc(0, -86 * scale, 4 * scale, 0, TAU);
            ctx.fill();
        }
        else if (kind === 'ozric') {
            ctx.beginPath();
            ctx.ellipse(-7 * scale, -106 * scale, 3 * scale, 2 * scale, 0, 0, TAU);
            ctx.ellipse(7 * scale, -106 * scale, 3 * scale, 2 * scale, 0, 0, TAU);
            ctx.fill();
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc((i - 1) * 16 * scale, -24 * scale, 5 * scale, 0, TAU);
                ctx.stroke();
            }
        }
        else if (kind === 'elodie') {
            ctx.beginPath();
            ctx.moveTo(-10 * scale, -104 * scale);
            ctx.quadraticCurveTo(-70 * scale, -140 * scale, -64 * scale, -58 * scale);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(10 * scale, -104 * scale);
            ctx.quadraticCurveTo(70 * scale, -140 * scale, 64 * scale, -58 * scale);
            ctx.stroke();
        }
        else if (kind === 'thryc') {
            ctx.beginPath();
            ctx.arc(0, -76 * scale, 6 * scale, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
        ctx.restore();
        // Linhas de choque ao redor da criatura.
        ctx.save();
        ctx.strokeStyle = hexToRgba(accent, 0.4);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        const dir = rotation < 0 ? -1 : 1;
        for (let i = 0; i < 4; i++) {
            const yy = y - 100 - i * 26;
            ctx.beginPath();
            ctx.moveTo(x + dir * (52 + i * 6), yy);
            ctx.lineTo(x + dir * (86 + i * 10), yy - 14);
            ctx.stroke();
        }
        ctx.restore();
    }
    /** Silhueta da criatura que recua diante do despertar. */
    drawFoeSilhouette(ctx, kind, scale) {
        ctx.save();
        ctx.scale(scale, scale);
        switch (kind) {
            case 'miriam': {
                // Saqueador carbonizado: humanoide largo e quebrado.
                ctx.fillRect(-24, -34, 16, 34);
                ctx.fillRect(8, -34, 16, 34);
                ctx.beginPath();
                ctx.moveTo(-30, -90);
                ctx.quadraticCurveTo(0, -106, 30, -90);
                ctx.lineTo(24, -32);
                ctx.lineTo(-24, -32);
                ctx.closePath();
                ctx.fill();
                ctx.save();
                ctx.translate(-28, -84);
                ctx.rotate(-0.55);
                ctx.fillRect(-8, -6, 14, 58);
                ctx.restore();
                ctx.save();
                ctx.translate(28, -84);
                ctx.rotate(0.55);
                ctx.fillRect(-6, -6, 14, 58);
                ctx.restore();
                ctx.beginPath();
                ctx.arc(0, -108, 16, 0, TAU);
                ctx.fill();
                break;
            }
            case 'kael': {
                // Drone assimilado com anel e tentáculos.
                ctx.beginPath();
                ctx.ellipse(0, -84, 30, 24, 0, 0, TAU);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(0, -84, 54, 12, 0.18, 0, TAU);
                ctx.fill();
                for (let i = 0; i < 3; i++) {
                    const ox = (i - 1) * 22;
                    ctx.beginPath();
                    ctx.moveTo(ox - 6, -64);
                    ctx.quadraticCurveTo(ox - 12, -34, ox + 2, -12);
                    ctx.lineTo(ox + 10, -14);
                    ctx.quadraticCurveTo(ox - 2, -36, ox + 4, -64);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            }
            case 'ozric': {
                // Coletor encapuzado com foice.
                ctx.beginPath();
                ctx.moveTo(0, -132);
                ctx.quadraticCurveTo(38, -106, 44, -18);
                ctx.lineTo(26, 0);
                ctx.lineTo(-26, 0);
                ctx.lineTo(-44, -18);
                ctx.quadraticCurveTo(-38, -106, 0, -132);
                ctx.closePath();
                ctx.fill();
                ctx.save();
                ctx.translate(30, -78);
                ctx.rotate(-0.5);
                ctx.fillRect(-3, -54, 6, 108);
                ctx.beginPath();
                ctx.moveTo(0, -54);
                ctx.quadraticCurveTo(34, -66, 46, -38);
                ctx.quadraticCurveTo(24, -48, 0, -42);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                break;
            }
            case 'elodie': {
                // Serafim caído com asas partidas.
                ctx.beginPath();
                ctx.ellipse(0, -76, 17, 44, 0, 0, TAU);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, -124, 13, 0, TAU);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(-10, -104);
                ctx.quadraticCurveTo(-72, -142, -64, -56);
                ctx.quadraticCurveTo(-38, -86, -8, -72);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(10, -104);
                ctx.quadraticCurveTo(72, -142, 64, -56);
                ctx.quadraticCurveTo(38, -86, 8, -72);
                ctx.closePath();
                ctx.fill();
                ctx.save();
                ctx.translate(24, -70);
                ctx.rotate(-0.7);
                ctx.fillRect(-2, -56, 4, 112);
                ctx.fillRect(-12, -56, 24, 5);
                ctx.restore();
                break;
            }
            case 'thryc': {
                // Eco fragmentado: cacos ao redor de um núcleo.
                for (let i = 0; i < 9; i++) {
                    const a = (i / 9) * TAU;
                    const r = 28 + (i % 3) * 14;
                    const px = Math.cos(a) * r;
                    const py = -76 + Math.sin(a) * r;
                    ctx.save();
                    ctx.translate(px, py);
                    ctx.rotate(a);
                    ctx.beginPath();
                    ctx.moveTo(0, -14);
                    ctx.lineTo(9, 0);
                    ctx.lineTo(0, 14);
                    ctx.lineTo(-7, 0);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
                ctx.beginPath();
                ctx.arc(0, -76, 12, 0, TAU);
                ctx.fill();
                break;
            }
            default:
                break;
        }
        ctx.restore();
    }
    drawRecoilingCrawler(ctx, x, y, scale, rotation) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.ellipse(x, y, 40 * scale, 8 * scale, 0, 0, TAU);
        ctx.fill();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        // Halo azul nas bordas para a silhueta não sumir no escuro.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        this.drawCrawler(ctx, 0, 0, scale * 1.06, 'rgba(86,227,255,0.26)', false);
        ctx.restore();
        this.drawCrawler(ctx, 0, 0, scale, '#12121d', true);
        ctx.restore();
        // Linhas de choque ao redor da criatura.
        ctx.save();
        ctx.strokeStyle = 'rgba(255,90,122,0.38)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        const dir = rotation < 0 ? -1 : 1;
        for (let i = 0; i < 4; i++) {
            const yy = y - 90 - i * 26;
            ctx.beginPath();
            ctx.moveTo(x + dir * (52 + i * 6), yy);
            ctx.lineTo(x + dir * (86 + i * 10), yy - 14);
            ctx.stroke();
        }
        ctx.restore();
    }
    drawFlyingCap(ctx, x, y, rotation, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        // Rastro de movimento.
        ctx.strokeStyle = 'rgba(242,231,201,0.28)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-32 - i * 8, -4 + i * 8);
            ctx.lineTo(-58 - i * 12, -12 + i * 12);
            ctx.stroke();
        }
        // Coroa.
        ctx.beginPath();
        ctx.moveTo(-22, 6);
        ctx.quadraticCurveTo(-20, -18, 0, -20);
        ctx.quadraticCurveTo(20, -18, 22, 6);
        ctx.closePath();
        ctx.fillStyle = '#d2543f';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();
        // Aba.
        ctx.beginPath();
        ctx.moveTo(20, 6);
        ctx.quadraticCurveTo(42, 4, 46, 12);
        ctx.quadraticCurveTo(32, 18, 18, 12);
        ctx.closePath();
        ctx.fillStyle = '#a83b2f';
        ctx.fill();
        ctx.stroke();
        // Faixa creme.
        ctx.beginPath();
        ctx.moveTo(-20, 2);
        ctx.lineTo(20, 0);
        ctx.strokeStyle = '#f2e7c9';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
    }
    drawFlyingBag(ctx, x, y, rotation, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        // Rastro.
        ctx.strokeStyle = 'rgba(242,231,201,0.24)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-26 - i * 6, 20 + i * 7);
            ctx.lineTo(-52 - i * 10, 32 + i * 10);
            ctx.stroke();
        }
        roundRectPath(ctx, -20, -28, 40, 56, 8);
        ctx.fillStyle = '#b8453a';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f2e7c9';
        ctx.fillRect(-18, -18, 36, 6);
        ctx.fillRect(-18, 16, 36, 4);
        ctx.beginPath();
        ctx.arc(0, 4, 6, 0, TAU);
        ctx.strokeStyle = '#f2e7c9';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // Alça solta.
        ctx.beginPath();
        ctx.moveTo(-10, -28);
        ctx.quadraticCurveTo(-30, -48, -8, -54);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.strokeStyle = '#f2e7c9';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
    drawFlyingBox(ctx, x, y, rotation, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.strokeStyle = 'rgba(242,231,201,0.2)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.moveTo(-34 - i * 8, 6 + i * 8);
            ctx.lineTo(-56 - i * 12, 14 + i * 12);
            ctx.stroke();
        }
        ctx.fillStyle = '#c94f3d';
        ctx.strokeStyle = 'rgba(242,231,201,0.85)';
        ctx.lineWidth = 2;
        ctx.fillRect(-30, -11, 60, 22);
        ctx.strokeRect(-30, -11, 60, 22);
        ctx.beginPath();
        ctx.moveTo(-24, -4);
        ctx.lineTo(24, -4);
        ctx.strokeStyle = 'rgba(242,231,201,0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }
    /** Objetos civis que cada herói deixa para trás ao despertar. */
    drawAwakeningProps(ctx, rect, def) {
        const t = this.t;
        switch (def.id) {
            case 'ravi':
                this.drawFlyingCap(ctx, rect.x + rect.w * 0.79, rect.y + 220, -0.55 + Math.sin(t * 2.6) * 0.05, 1.35);
                this.drawFlyingBag(ctx, rect.x + rect.w * 0.17, rect.y + 250, 0.62 + Math.sin(t * 2.2) * 0.05, 1.2);
                this.drawFlyingBox(ctx, rect.x + rect.w * 0.25, rect.y + 128, -0.35, 0.95);
                this.drawFlyingBox(ctx, rect.x + rect.w * 0.69, rect.y + 344, 0.28, 0.78);
                break;
            case 'miriam':
                this.drawFlyingHelmet(ctx, rect.x + rect.w * 0.8, rect.y + 220, -0.5 + Math.sin(t * 2.4) * 0.05, 1.25);
                this.drawFlyingAxe(ctx, rect.x + rect.w * 0.16, rect.y + 300, 0.6 + Math.sin(t * 2) * 0.05, 1.05);
                break;
            case 'kael':
                this.drawFlyingWrench(ctx, rect.x + rect.w * 0.8, rect.y + 220, -0.7 + Math.sin(t * 2.1) * 0.06, 1.2);
                this.drawFlyingRadio(ctx, rect.x + rect.w * 0.17, rect.y + 290, 0.55 + Math.sin(t * 2.5) * 0.05, 1);
                this.drawFlyingBolt(ctx, rect.x + rect.w * 0.26, rect.y + 150, 0.3, 0.9);
                this.drawFlyingBolt(ctx, rect.x + rect.w * 0.71, rect.y + 380, -0.4, 0.7);
                break;
            case 'ozric':
                this.drawFlyingChain(ctx, rect.x + rect.w * 0.17, rect.y + 260, 0.6 + Math.sin(t * 2.3) * 0.05, 1.1);
                this.drawFlyingChain(ctx, rect.x + rect.w * 0.82, rect.y + 330, -0.45 + Math.sin(t * 2) * 0.05, 0.9);
                this.drawFlyingFeather(ctx, rect.x + rect.w * 0.72, rect.y + 160, -0.4, 1, '#2a1620', '#ff3357');
                break;
            case 'elodie':
                this.drawFlyingPage(ctx, rect.x + rect.w * 0.19, rect.y + 240, 0.5 + Math.sin(t * 2.2) * 0.05, 1.05);
                this.drawFlyingPage(ctx, rect.x + rect.w * 0.81, rect.y + 320, -0.6 + Math.sin(t * 2.5) * 0.05, 0.9);
                this.drawFlyingFeather(ctx, rect.x + rect.w * 0.72, rect.y + 150, -0.3, 1.1, '#fff4cd', '#ffe08a');
                this.drawFlyingFeather(ctx, rect.x + rect.w * 0.28, rect.y + 380, 0.5, 0.8, '#fff4cd', '#ffe08a');
                break;
            case 'thryc':
                this.drawFlyingShard(ctx, rect.x + rect.w * 0.18, rect.y + 240, 0.4 + Math.sin(t * 2.2) * 0.05, 1.1);
                this.drawFlyingShard(ctx, rect.x + rect.w * 0.8, rect.y + 300, -0.5 + Math.sin(t * 2.5) * 0.05, 1.25);
                this.drawFlyingShard(ctx, rect.x + rect.w * 0.72, rect.y + 150, 0.2, 0.8);
                this.drawFlyingShard(ctx, rect.x + rect.w * 0.27, rect.y + 390, -0.3, 0.7);
                break;
        }
    }
    drawFlyingHelmet(ctx, x, y, rotation, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.strokeStyle = 'rgba(255,209,102,0.25)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-34 - i * 8, 8 + i * 7);
            ctx.lineTo(-60 - i * 12, 20 + i * 10);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(-26, 6);
        ctx.quadraticCurveTo(-24, -28, 0, -30);
        ctx.quadraticCurveTo(24, -28, 26, 6);
        ctx.closePath();
        ctx.fillStyle = '#c9412f';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-28, 4);
        ctx.quadraticCurveTo(0, 18, 32, 4);
        ctx.lineTo(28, -4);
        ctx.quadraticCurveTo(0, 8, -26, -2);
        ctx.closePath();
        ctx.fillStyle = '#8f2b22';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-4, -30);
        ctx.quadraticCurveTo(0, -48, 6, -30);
        ctx.closePath();
        ctx.fillStyle = '#f2e7c9';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-24, -8);
        ctx.quadraticCurveTo(0, -16, 24, -8);
        ctx.strokeStyle = '#f2e7c9';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
    }
    drawFlyingAxe(ctx, x, y, rotation, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.strokeStyle = 'rgba(255,155,60,0.25)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.moveTo(-24 - i * 8, 30 + i * 8);
            ctx.lineTo(-48 - i * 12, 44 + i * 12);
            ctx.stroke();
        }
        ctx.strokeStyle = '#3a2a22';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-8, 34);
        ctx.lineTo(8, -30);
        ctx.stroke();
        ctx.strokeStyle = '#6b4a35';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-8, 34);
        ctx.lineTo(8, -30);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(6, -26);
        ctx.quadraticCurveTo(34, -36, 38, -8);
        ctx.quadraticCurveTo(20, -12, 10, -8);
        ctx.closePath();
        ctx.fillStyle = '#d8dde8';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2.5;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    drawFlyingWrench(ctx, x, y, rotation, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.strokeStyle = 'rgba(111,242,255,0.25)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.moveTo(-22 - i * 8, 26 + i * 8);
            ctx.lineTo(-46 - i * 12, 40 + i * 12);
            ctx.stroke();
        }
        ctx.strokeStyle = '#b9c2d6';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-18, 26);
        ctx.lineTo(12, -20);
        ctx.stroke();
        ctx.strokeStyle = '#6f7890';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-18, 26);
        ctx.lineTo(12, -20);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(16, -26, 12, 0.5, TAU - 0.5);
        ctx.strokeStyle = '#b9c2d6';
        ctx.lineWidth = 7;
        ctx.stroke();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }
    drawFlyingRadio(ctx, x, y, rotation, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.strokeStyle = 'rgba(111,242,255,0.22)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.moveTo(-22 - i * 8, 24 + i * 8);
            ctx.lineTo(-46 - i * 12, 36 + i * 12);
            ctx.stroke();
        }
        roundRectPath(ctx, -18, -26, 36, 52, 6);
        ctx.fillStyle = '#26304b';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#6ff2ff';
        ctx.fillRect(-12, -18, 24, 14);
        ctx.fillStyle = '#111827';
        for (let i = 0; i < 3; i++)
            ctx.fillRect(-12, 2 + i * 6, 24, 3);
        ctx.strokeStyle = '#b9c2d6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(12, -26);
        ctx.lineTo(24, -50);
        ctx.stroke();
        ctx.restore();
    }
    drawFlyingBolt(ctx, x, y, rotation, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * TAU;
            const px = Math.cos(a) * 9;
            const py = Math.sin(a) * 9;
            if (i === 0)
                ctx.moveTo(px, py);
            else
                ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = '#9aa3b8';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, TAU);
        ctx.fillStyle = '#26304b';
        ctx.fill();
        ctx.restore();
    }
    drawFlyingChain(ctx, x, y, rotation, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.strokeStyle = 'rgba(255,51,87,0.25)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.moveTo(-24 - i * 8, 22 + i * 8);
            ctx.lineTo(-48 - i * 12, 34 + i * 12);
            ctx.stroke();
        }
        for (let i = 0; i < 4; i++) {
            const px = i * 14 - 20;
            const py = Math.sin(i * 1.3) * 8;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(i % 2 === 0 ? 0.3 : -0.3);
            ctx.beginPath();
            ctx.ellipse(0, 0, 5, 9, 0, 0, TAU);
            ctx.strokeStyle = '#8a8f9e';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.strokeStyle = INK;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }
    drawFlyingFeather(ctx, x, y, rotation, scale, fill, edge) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.strokeStyle = hexToRgba(edge, 0.25);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.moveTo(-18 - i * 6, 10 + i * 6);
            ctx.lineTo(-42 - i * 10, 22 + i * 10);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(0, -26);
        ctx.quadraticCurveTo(18, -6, 8, 26);
        ctx.quadraticCurveTo(-2, 8, 0, -26);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.strokeStyle = edge;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.quadraticCurveTo(6, 0, 8, 24);
        ctx.strokeStyle = edge;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }
    drawFlyingPage(ctx, x, y, rotation, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.strokeStyle = 'rgba(255,224,138,0.25)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.moveTo(-24 - i * 8, 24 + i * 8);
            ctx.lineTo(-48 - i * 12, 38 + i * 12);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(-18, -24);
        ctx.lineTo(18, -20);
        ctx.lineTo(14, 26);
        ctx.lineTo(-22, 22);
        ctx.closePath();
        ctx.fillStyle = '#f8f4ea';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2.5;
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(23,18,28,0.35)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(-12, -12 + i * 9);
            ctx.lineTo(10, -10 + i * 9);
            ctx.stroke();
        }
        ctx.strokeStyle = '#ffe08a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 6, 6, 0, TAU);
        ctx.stroke();
        ctx.restore();
    }
    drawFlyingShard(ctx, x, y, rotation, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.strokeStyle = 'rgba(180,139,255,0.25)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.moveTo(-20 - i * 7, 22 + i * 7);
            ctx.lineTo(-44 - i * 11, 36 + i * 11);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.lineTo(12, -4);
        ctx.lineTo(4, 28);
        ctx.lineTo(-8, 2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(111,242,255,0.32)';
        ctx.strokeStyle = '#b48bff';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(6, -4);
        ctx.stroke();
        ctx.restore();
    }
    /** Raio irregular usado nos efeitos elétricos. */
    drawLightning(ctx, x1, y1, x2, y2, seed, color) {
        const steps = 6;
        const points = [];
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const jitter = i === 0 || i === steps ? 0 : 10;
            const px = x1 + (x2 - x1) * t + Math.sin(seed * 12.9 + i * 7.3 + this.t * 9) * jitter;
            const py = y1 + (y2 - y1) * t + Math.cos(seed * 4.7 + i * 5.1 + this.t * 7) * jitter;
            points.push([px, py]);
        }
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const passes = [
            [7, 'rgba(56,216,255,0.18)'],
            [2.4, color],
        ];
        for (const [width, stroke] of passes) {
            ctx.beginPath();
            points.forEach(([px, py], i) => {
                if (i === 0)
                    ctx.moveTo(px, py);
                else
                    ctx.lineTo(px, py);
            });
            ctx.strokeStyle = stroke;
            ctx.lineWidth = width;
            ctx.stroke();
        }
        ctx.restore();
    }
    /** Fallback para qualquer outro capítulo: fundo + retrato + texto. */
    // -------------------------------------------------------- painéis especiais
    /** Painel final do Cap. 12: o braço de Miriam acende em magma diante do portal. */
    drawMiriamIgnitionPanel(ctx, rect) {
        const time = this.t;
        const camera = (this.stage.width - this.game.width) * 0.82;
        this.drawBackgroundIn(ctx, rect, camera, 1.16);
        // Brasília sob um céu doente.
        const dusk = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
        dusk.addColorStop(0, 'rgba(8,4,12,0.48)');
        dusk.addColorStop(0.5, 'rgba(38,9,9,0.3)');
        dusk.addColorStop(1, 'rgba(5,3,8,0.72)');
        ctx.fillStyle = dusk;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        // Portal orbital: uma ferida aberta no céu.
        const px = rect.x + rect.w * 0.72;
        const py = rect.y + rect.h * 0.34;
        const pulse = 0.8 + Math.sin(time * 2.2) * 0.12;
        ctx.save();
        ctx.translate(px, py);
        ctx.globalCompositeOperation = 'lighter';
        const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 150);
        halo.addColorStop(0, 'rgba(255,220,150,0.5)');
        halo.addColorStop(0.3, 'rgba(255,96,40,0.26)');
        halo.addColorStop(1, 'rgba(255,51,87,0)');
        ctx.fillStyle = halo;
        ctx.fillRect(-160, -160, 320, 320);
        ctx.rotate(time * 0.08);
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = hexToRgba(i === 1 ? '#ffd166' : '#ff7a2f', (0.5 - i * 0.1) * pulse);
            ctx.lineWidth = 3.4 - i * 0.8;
            ctx.beginPath();
            ctx.arc(0, 0, 30 + i * 14, i * 0.9, i * 0.9 + Math.PI * 1.52);
            ctx.stroke();
        }
        const core = ctx.createRadialGradient(0, 0, 1, 0, 0, 30);
        core.addColorStop(0, 'rgba(255,255,255,0.95)');
        core.addColorStop(0.3, 'rgba(255,209,102,0.85)');
        core.addColorStop(1, 'rgba(255,51,87,0)');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, TAU);
        ctx.fill();
        ctx.rotate(-time * 0.08);
        ctx.strokeStyle = 'rgba(255,140,70,0.42)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 7; i++) {
            const a = i * 0.92 + 0.3;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 34, Math.sin(a) * 34);
            ctx.lineTo(Math.cos(a + 0.09) * (72 + (i % 3) * 16), Math.sin(a + 0.09) * (72 + (i % 3) * 16));
            ctx.stroke();
        }
        ctx.restore();
        this.drawVektharSilhouette(ctx, rect.x + rect.w * 0.45, rect.y + rect.h * 0.66, 0.92);
        this.drawIgnitingArm(ctx, rect);
    }
    /** Vek'thar ao fundo, pequeno diante do portal, para dar escala ao braço. */
    drawVektharSilhouette(ctx, cx, groundY, scale) {
        ctx.save();
        ctx.translate(cx, groundY);
        ctx.scale(scale, scale);
        const ink = 'rgba(6,4,9,0.94)';
        ctx.fillStyle = ink;
        // Pernas.
        roundRectPath(ctx, -27, -68, 21, 70, 7);
        ctx.fill();
        roundRectPath(ctx, 7, -68, 21, 70, 7);
        ctx.fill();
        // Capa.
        ctx.beginPath();
        ctx.moveTo(-34, -124);
        ctx.quadraticCurveTo(-58, -64, -42, -6);
        ctx.lineTo(42, -6);
        ctx.quadraticCurveTo(58, -66, 34, -124);
        ctx.closePath();
        ctx.fill();
        // Torso.
        roundRectPath(ctx, -23, -132, 46, 76, 10);
        ctx.fill();
        // Ombreiras.
        ctx.beginPath();
        ctx.ellipse(-30, -126, 18, 13, -0.25, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(30, -126, 18, 13, 0.25, 0, TAU);
        ctx.fill();
        // Elmo com chifres.
        roundRectPath(ctx, -12, -164, 24, 34, 6);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-10, -160);
        ctx.quadraticCurveTo(-26, -176, -30, -190);
        ctx.quadraticCurveTo(-14, -184, -4, -166);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(10, -160);
        ctx.quadraticCurveTo(26, -176, 30, -190);
        ctx.quadraticCurveTo(14, -184, 4, -166);
        ctx.closePath();
        ctx.fill();
        // Canhão erguido para o portal.
        ctx.save();
        ctx.translate(18, -118);
        ctx.rotate(-0.92);
        roundRectPath(ctx, -8, -9, 70, 18, 6);
        ctx.fill();
        roundRectPath(ctx, 52, -13, 16, 26, 5);
        ctx.fill();
        ctx.restore();
        // Luz de contorno e olho.
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255,122,47,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(34, -122);
        ctx.quadraticCurveTo(54, -68, 42, -10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(14, -162);
        ctx.lineTo(30, -190);
        ctx.stroke();
        ctx.fillStyle = '#ff8a3c';
        ctx.beginPath();
        ctx.arc(0, -148, 3.4, 0, TAU);
        ctx.fill();
        const eg = ctx.createRadialGradient(0, -148, 1, 0, -148, 22);
        eg.addColorStop(0, 'rgba(255,138,60,0.55)');
        eg.addColorStop(1, 'rgba(255,138,60,0)');
        ctx.fillStyle = eg;
        ctx.fillRect(-24, -172, 48, 48);
        ctx.restore();
    }
    /** Recorte da silhueta do braço (dois segmentos + articulações). */
    armClipPath(ctx, a, b, c) {
        const capsule = (p, q, wp, wq) => {
            const dx = q.x - p.x;
            const dy = q.y - p.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            ctx.moveTo(p.x + nx * wp, p.y + ny * wp);
            ctx.lineTo(p.x - nx * wp, p.y - ny * wp);
            ctx.lineTo(q.x - nx * wq, q.y - ny * wq);
            ctx.lineTo(q.x + nx * wq, q.y + ny * wq);
            ctx.closePath();
        };
        ctx.beginPath();
        ctx.arc(a.x, a.y, 54, 0, TAU);
        ctx.arc(b.x, b.y, 49, 0, TAU);
        ctx.arc(c.x, c.y, 44, 0, TAU);
        capsule(a, b, 54, 49);
        capsule(b, c, 49, 44);
    }
    /** Close do braço esquerdo de Miriam: costuras, placas e magma acendendo. */
    drawIgnitingArm(ctx, rect) {
        const time = this.t;
        const shoulder = { x: rect.x - 36, y: rect.y + rect.h + 8 };
        const elbow = { x: rect.x + 180, y: rect.y + rect.h * 0.79 };
        const wrist = { x: rect.x + 350, y: rect.y + rect.h * 0.56 };
        const fist = { x: rect.x + 416, y: rect.y + rect.h * 0.47 };
        const skin = '#8a5a3b';
        const skinLight = '#b87a52';
        const skinDark = '#3a1f16';
        const hot = '#ff9b3c';
        const ember = '#ffd166';
        // Calor irradiando do braço.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const heat = ctx.createRadialGradient(elbow.x, elbow.y - 20, 10, elbow.x, elbow.y - 20, 250);
        heat.addColorStop(0, 'rgba(255,122,47,0.34)');
        heat.addColorStop(0.45, 'rgba(255,74,32,0.14)');
        heat.addColorStop(1, 'rgba(255,51,87,0)');
        ctx.fillStyle = heat;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.restore();
        const segment = (ax, ay, bx, by, width, color) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
        };
        // Silhueta escura + massa do braço.
        segment(shoulder.x, shoulder.y, elbow.x, elbow.y, 118, 'rgba(5,3,7,0.94)');
        segment(elbow.x, elbow.y, wrist.x, wrist.y, 98, 'rgba(5,3,7,0.94)');
        const armGrad = ctx.createLinearGradient(shoulder.x, shoulder.y - 40, wrist.x, wrist.y + 30);
        armGrad.addColorStop(0, skinDark);
        armGrad.addColorStop(0.3, skin);
        armGrad.addColorStop(0.62, skinLight);
        armGrad.addColorStop(1, skin);
        segment(shoulder.x, shoulder.y, elbow.x, elbow.y, 108, armGrad);
        segment(elbow.x, elbow.y, wrist.x, wrist.y, 88, armGrad);
        // Textura e músculos, recortados na silhueta do braço.
        ctx.save();
        this.armClipPath(ctx, shoulder, elbow, wrist);
        ctx.clip();
        const sheen = ctx.createLinearGradient(shoulder.x - 30, shoulder.y, wrist.x, wrist.y);
        sheen.addColorStop(0, 'rgba(255,255,255,0)');
        sheen.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        sheen.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sheen;
        ctx.fillRect(rect.x - 60, rect.y, rect.w + 120, rect.h);
        ctx.fillStyle = 'rgba(20,6,8,0.32)';
        ctx.beginPath();
        ctx.ellipse((shoulder.x + wrist.x) / 2, (shoulder.y + wrist.y) / 2 + 34, 190, 34, -0.6, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(52,24,18,0.55)';
        ctx.lineWidth = 1.6;
        for (let i = 0; i < 5; i++) {
            const t = 0.12 + i * 0.17;
            const ax = shoulder.x + (elbow.x - shoulder.x) * t;
            const ay = shoulder.y + (elbow.y - shoulder.y) * t;
            ctx.beginPath();
            ctx.moveTo(ax - 26, ay - 6);
            ctx.quadraticCurveTo(ax, ay + 9, ax + 22, ay + 2);
            ctx.stroke();
        }
        // Rachaduras de magma: acendem na pele e sobem até a manopla.
        const crack = (points, width, alpha) => {
            if (points.length < 2)
                return;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = hexToRgba(hot, alpha * 0.34);
            ctx.lineWidth = width + 7;
            ctx.beginPath();
            points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
            ctx.stroke();
            ctx.strokeStyle = hexToRgba(hot, alpha);
            ctx.lineWidth = width;
            ctx.stroke();
            ctx.strokeStyle = hexToRgba(ember, alpha * 0.85);
            ctx.lineWidth = Math.max(0.8, width * 0.38);
            ctx.stroke();
            ctx.restore();
        };
        const flow = 0.72 + Math.sin(time * 4.2) * 0.16;
        crack([
            [shoulder.x + 40, shoulder.y - 34],
            [shoulder.x + 82, shoulder.y - 62],
            [shoulder.x + 108, shoulder.y - 34],
            [elbow.x - 18, elbow.y - 22],
            [elbow.x + 6, elbow.y - 44],
        ], 2.6, flow);
        crack([
            [elbow.x - 34, elbow.y + 18],
            [elbow.x + 4, elbow.y - 2],
            [wrist.x - 44, wrist.y + 12],
            [wrist.x - 18, wrist.y - 8],
        ], 2.2, flow * 0.9);
        crack([
            [shoulder.x + 4, shoulder.y - 88],
            [shoulder.x + 44, shoulder.y - 96],
            [elbow.x - 54, elbow.y - 6],
        ], 1.5, flow * 0.7);
        crack([
            [elbow.x + 22, elbow.y + 40],
            [elbow.x + 52, elbow.y + 8],
            [wrist.x - 8, wrist.y + 34],
        ], 1.4, flow * 0.65);
        // Faixa de tecido atravessando o bíceps.
        ctx.save();
        ctx.translate((shoulder.x + elbow.x) / 2, (shoulder.y + elbow.y) / 2);
        ctx.rotate(0.99);
        ctx.fillStyle = '#2e211c';
        roundRectPath(ctx, -58, -12, 116, 24, 5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(8,5,8,0.9)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,155,60,0.35)';
        ctx.fillRect(-52, 6, 104, 2);
        ctx.restore();
        ctx.restore();
        // Placas do antebraço.
        const foreAngle = Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x);
        for (let i = 0; i < 3; i++) {
            const t = 0.18 + i * 0.26;
            const px = elbow.x + (wrist.x - elbow.x) * t;
            const py = elbow.y + (wrist.y - elbow.y) * t;
            const w = 92 - i * 10;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(foreAngle + Math.PI / 2);
            const plate = ctx.createLinearGradient(-w / 2, -12, w / 2, 12);
            plate.addColorStop(0, '#241a18');
            plate.addColorStop(0.45, '#4a342d');
            plate.addColorStop(1, '#6a5548');
            ctx.fillStyle = plate;
            roundRectPath(ctx, -w / 2, -14, w, 28, 7);
            ctx.fill();
            ctx.strokeStyle = 'rgba(6,5,10,0.92)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#8a7566';
            for (const rx of [-w * 0.34, w * 0.34]) {
                ctx.beginPath();
                ctx.arc(rx, 0, 2.6, 0, TAU);
                ctx.fill();
            }
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = hexToRgba(hot, 0.5 + Math.sin(time * 5 + i) * 0.18);
            ctx.fillRect(-w / 2 + 6, -2, w - 12, 2.4);
            ctx.restore();
            ctx.restore();
        }
        // Manopla da Miriam.
        ctx.save();
        ctx.translate(fist.x, fist.y);
        ctx.rotate(-0.3);
        const gaunt = ctx.createRadialGradient(-14, -18, 6, 0, 0, 74);
        gaunt.addColorStop(0, '#6a5548');
        gaunt.addColorStop(0.55, '#3b2a26');
        gaunt.addColorStop(1, '#1c1311');
        ctx.fillStyle = gaunt;
        ctx.beginPath();
        ctx.moveTo(-62, -8);
        ctx.quadraticCurveTo(-58, -58, -6, -62);
        ctx.quadraticCurveTo(48, -66, 64, -18);
        ctx.quadraticCurveTo(72, 24, 30, 52);
        ctx.quadraticCurveTo(-16, 66, -48, 38);
        ctx.quadraticCurveTo(-72, 16, -62, -8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(5,3,7,0.95)';
        ctx.lineWidth = 3;
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
            const ky = -38 + i * 24;
            ctx.fillStyle = '#5a453a';
            roundRectPath(ctx, 28, ky - 9, 34, 18, 5);
            ctx.fill();
            ctx.strokeStyle = 'rgba(6,5,10,0.9)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.fillStyle = hexToRgba(hot, 0.8);
            ctx.beginPath();
            ctx.arc(56, ky, 2.2, 0, TAU);
            ctx.fill();
        }
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = hexToRgba(hot, 0.9);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-30, -46);
        ctx.lineTo(-10, -20);
        ctx.lineTo(-24, 4);
        ctx.lineTo(-2, 30);
        ctx.stroke();
        ctx.strokeStyle = hexToRgba(ember, 0.8);
        ctx.lineWidth = 0.8;
        ctx.stroke();
        const core = ctx.createRadialGradient(0, 0, 2, 0, 0, 54);
        core.addColorStop(0, hexToRgba(hot, 0.3 + Math.sin(time * 4) * 0.1));
        core.addColorStop(1, hexToRgba(hot, 0));
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(0, 0, 54, 0, TAU);
        ctx.fill();
        ctx.restore();
        ctx.restore();
        // Fagulhas subindo do braço.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 22; i++) {
            const seed = i * 1.618;
            const rise = (time * (0.16 + (i % 5) * 0.03) + i * 0.11) % 1;
            const bx = rect.x + 50 + ((i * 71) % Math.max(1, rect.w - 90));
            const by = rect.y + rect.h - 24 - rise * (rect.h * 0.78);
            const drift = Math.sin(time * 1.6 + seed) * (10 + (i % 4) * 5);
            const a = Math.sin(rise * Math.PI) * (0.3 + (i % 3) * 0.18);
            const r = 1.2 + (i % 3) * 0.9;
            ctx.fillStyle = i % 4 === 0 ? hexToRgba('#fff3c4', a) : hexToRgba(hot, a);
            ctx.beginPath();
            ctx.arc(bx + drift, by, r, 0, TAU);
            ctx.fill();
        }
        for (let i = 0; i < 2; i++) {
            const p = (time * 0.55 + i * 0.5) % 1;
            const r = 46 + p * 150;
            ctx.strokeStyle = hexToRgba(hot, (1 - p) * 0.18);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(elbow.x + 30, elbow.y - 30, r, r * 0.52, -0.55, 0, TAU);
            ctx.stroke();
        }
        ctx.restore();
        // Vinheta local para fechar o quadro no braço.
        const v = ctx.createRadialGradient(wrist.x, wrist.y, 40, wrist.x, wrist.y, rect.w * 0.82);
        v.addColorStop(0, 'rgba(0,0,0,0)');
        v.addColorStop(0.7, 'rgba(0,0,0,0.12)');
        v.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = v;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    /** Crônica do Arco IV: três Despertos quebram a última corrente de Ozric. */
    drawOzricRescuePanel(ctx, rect) {
        const time = this.t;
        const camera = (this.stage.width - this.game.width) * 0.78;
        this.drawBackgroundIn(ctx, rect, camera, 1.16);
        // O Abismo respira em vermelho.
        const hell = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
        hell.addColorStop(0, 'rgba(8,1,4,0.82)');
        hell.addColorStop(0.45, 'rgba(62,5,10,0.42)');
        hell.addColorStop(1, 'rgba(6,1,3,0.9)');
        ctx.fillStyle = hell;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        // Portão de ossos: pilar, arco e runas.
        ctx.save();
        ctx.fillStyle = 'rgba(4,2,4,0.94)';
        ctx.fillRect(rect.x - 8, rect.y + rect.h * 0.06, rect.w * 0.16, rect.h * 0.94);
        ctx.beginPath();
        ctx.moveTo(rect.x + rect.w * 0.16, rect.y + rect.h * 0.06);
        ctx.quadraticCurveTo(rect.x + rect.w * 0.27, rect.y - rect.h * 0.08, rect.x + rect.w * 0.39, rect.y + rect.h * 0.1);
        ctx.lineTo(rect.x + rect.w * 0.33, rect.y + rect.h * 0.16);
        ctx.quadraticCurveTo(rect.x + rect.w * 0.26, rect.y + rect.h * 0.04, rect.x + rect.w * 0.16, rect.y + rect.h * 0.18);
        ctx.closePath();
        ctx.fill();
        for (let i = 0; i < 7; i++) {
            const bx = rect.x + 8 + (i % 2) * 34;
            const by = rect.y + rect.h * (0.24 + i * 0.09);
            ctx.save();
            ctx.translate(bx, by);
            ctx.rotate((i % 2 === 0 ? 0.3 : -0.4) + Math.sin(time + i) * 0.02);
            ctx.strokeStyle = 'rgba(214,198,170,0.2)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-14, 0);
            ctx.lineTo(14, 0);
            ctx.stroke();
            ctx.fillStyle = 'rgba(214,198,170,0.24)';
            ctx.beginPath();
            ctx.arc(-14, 0, 4.5, 0, TAU);
            ctx.arc(14, 0, 4.5, 0, TAU);
            ctx.fill();
            ctx.restore();
        }
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) {
            ctx.strokeStyle = hexToRgba('#ff3357', 0.3 + Math.sin(time * 2 + i) * 0.12);
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(rect.x + rect.w * 0.22, rect.y + rect.h * 0.08, 24 + i * 9, Math.PI * 0.8, Math.PI * 1.9);
            ctx.stroke();
        }
        ctx.restore();
        const ozricX = rect.x + rect.w * 0.56;
        const ozricY = rect.y + rect.h * 0.53;
        const chainY = rect.y + rect.h * 0.64;
        const gateX = rect.x + rect.w * 0.12;
        const pullX = rect.x + rect.w * 0.83;
        // Corrente: do portão ao peito de Ozric e do peito aos três resgatadores.
        this.drawChainRun(ctx, gateX, chainY + 24, ozricX - 52, chainY, 12, 34, 16, 'rgba(5,3,6,0.98)', '#ff3357', 0.8);
        this.drawChainRun(ctx, ozricX + 46, chainY, pullX, chainY - 14, 9, 30, 14, 'rgba(5,3,6,0.98)', '#ffd166', 0.95);
        // Chamas negras atrás do carrasco.
        this.drawBlackFlames(ctx, ozricX, rect.y + rect.h * 0.88, '#ff3357');
        // Ozric, ainda acorrentado, mas com a mão estendida.
        const size = Math.min(rect.w * 0.34, rect.h * 0.92);
        ctx.save();
        const aura = ctx.createRadialGradient(ozricX, ozricY - 20, 10, ozricX, ozricY - 20, size * 0.85);
        aura.addColorStop(0, 'rgba(255,51,87,0.24)');
        aura.addColorStop(0.55, 'rgba(120,10,40,0.12)');
        aura.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = aura;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.restore();
        drawCharacterPortrait(ctx, CHARACTERS.ozric, ozricX, ozricY + 8, size, time, false);
        // A corrente atravessa o peito dele.
        this.drawChainRun(ctx, ozricX - 72, chainY + 2, ozricX + 70, chainY - 4, 5, 28, 13, 'rgba(5,3,6,0.98)', '#ffd166', 0.9);
        // Os três resgatadores puxando o último elo.
        const feetY = rect.y + rect.h * 0.9;
        const pullBuild = {
            ...BASE,
            lean: -0.52,
            armFront: -1.16,
            armFrontElbow: 0.34,
            armBack: -0.92,
            armBackElbow: 0.26,
            legFront: 0.56,
            legBack: -0.38,
            crouch: 0.22,
            bob: Math.sin(time * 6) * 1.2,
        };
        const rescuers = [
            ['ravi', 0.775, 0.76],
            ['miriam', 0.86, 0.84],
            ['kael', 0.945, 0.72],
        ];
        for (const [id, xRatio, scale] of rescuers) {
            const def = CHARACTERS[id];
            const x = rect.x + rect.w * xRatio;
            const glowG = ctx.createRadialGradient(x, feetY - 42, 4, x, feetY - 42, 74);
            glowG.addColorStop(0, hexToRgba(def.colors.aura, 0.24));
            glowG.addColorStop(1, hexToRgba(def.colors.aura, 0));
            ctx.fillStyle = glowG;
            ctx.fillRect(x - 80, feetY - 130, 160, 140);
            drawCharacterFigure(ctx, def, x, feetY, -1, scale, time + xRatio * 3, pullBuild);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = hexToRgba(def.colors.accent, 0.3 + Math.sin(time * 4 + xRatio) * 0.08);
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(x - 24, feetY - 54);
            ctx.lineTo(ozricX + 46, chainY);
            ctx.stroke();
            ctx.restore();
        }
        // Fagulhas e brasas do elo quebrando.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 30; i++) {
            const p = (time * (0.2 + (i % 5) * 0.04) + i * 0.07) % 1;
            const bx = ozricX + 20 + Math.sin(i * 2.3 + time) * (40 + p * 110);
            const by = chainY - p * (60 + (i % 4) * 34);
            ctx.fillStyle = i % 3 === 0 ? hexToRgba('#fff3c4', (1 - p) * 0.7) : hexToRgba('#ff6a3c', (1 - p) * 0.55);
            ctx.beginPath();
            ctx.arc(bx, by, 1 + (i % 3) * 0.8, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
        this.drawSpeedLines(ctx, ozricX + 20, chainY, rect, 'rgba(255,51,87,0.1)', 26);
    }
    /** Desenha uma corrente de elos alternados ao longo de um segmento. */
    drawChainRun(ctx, x1, y1, x2, y2, count, linkW, linkH, color, glowColor, glowAlpha) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const baseAngle = Math.atan2(dy, dx);
        ctx.save();
        for (let i = 0; i < count; i++) {
            const t = (i + 0.5) / count;
            const sag = Math.sin(t * Math.PI) * 12;
            const x = x1 + dx * t + nx * sag;
            const y = y1 + dy * t + ny * sag;
            const angle = baseAngle + (i % 2 === 0 ? 0 : Math.PI / 2);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.strokeStyle = color;
            ctx.lineWidth = 5.5;
            ctx.beginPath();
            ctx.ellipse(0, 0, linkW * 0.5, linkH * 0.5, 0, 0, TAU);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(242,231,201,0.16)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(0, 0, linkW * 0.4, linkH * 0.38, 0, 0, TAU);
            ctx.stroke();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = hexToRgba(glowColor, glowAlpha * (0.35 + (i % 4) * 0.1));
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(-linkW * 0.22, -linkH * 0.16);
            ctx.lineTo(0, 0);
            ctx.lineTo(linkW * 0.2, linkH * 0.18);
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }
    /** Crônica do Arco VI: a mesa que o Ferrato não conseguiu devorar. */
    drawSixChairsPanel(ctx, rect) {
        const time = this.t;
        const camera = (this.stage.width - this.game.width) * 0.54;
        this.drawBackgroundIn(ctx, rect, camera, 1.14);
        const memory = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
        memory.addColorStop(0, 'rgba(12,5,24,0.82)');
        memory.addColorStop(0.55, 'rgba(32,14,42,0.48)');
        memory.addColorStop(1, 'rgba(6,3,10,0.9)');
        ctx.fillStyle = memory;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        const lampX = rect.x + rect.w * 0.72;
        const lampY = rect.y + rect.h * 0.08;
        const tableX = rect.x + rect.w * 0.46;
        const tableY = rect.y + rect.h * 0.72;
        const tableW = rect.w * 0.55;
        const tableH = rect.h * 0.11;
        // Luz quente da lâmpada: a memória que não esfria.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const cone = ctx.createLinearGradient(lampX, lampY, lampX, tableY);
        cone.addColorStop(0, 'rgba(255,209,102,0.34)');
        cone.addColorStop(0.65, 'rgba(255,174,90,0.12)');
        cone.addColorStop(1, 'rgba(255,138,61,0)');
        ctx.fillStyle = cone;
        ctx.beginPath();
        ctx.moveTo(lampX - 24, lampY + 22);
        ctx.lineTo(lampX + 24, lampY + 22);
        ctx.lineTo(lampX + 190, tableY + 20);
        ctx.lineTo(lampX - 190, tableY + 20);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // Lâmpada pendurada.
        ctx.save();
        ctx.strokeStyle = 'rgba(242,231,201,0.32)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lampX, rect.y);
        ctx.lineTo(lampX, lampY + 10);
        ctx.stroke();
        ctx.fillStyle = '#2a1c20';
        ctx.beginPath();
        ctx.moveTo(lampX - 36, lampY + 28);
        ctx.quadraticCurveTo(lampX, lampY - 14, lampX + 36, lampY + 28);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,209,102,0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,230,163,0.9)';
        ctx.beginPath();
        ctx.arc(lampX, lampY + 34, 7 + Math.sin(time * 3) * 0.8, 0, TAU);
        ctx.fill();
        ctx.restore();
        // Cadeiras: seis lugares, nenhum vazio.
        const chars = ['ravi', 'miriam', 'kael', 'ozric', 'elodie', 'thryc'];
        const seatY = tableY - rect.h * 0.16;
        for (let i = 0; i < 6; i++) {
            const x = rect.x + rect.w * (0.52 + i * 0.083);
            ctx.save();
            ctx.translate(x, seatY);
            ctx.fillStyle = 'rgba(24,13,16,0.9)';
            roundRectPath(ctx, -20, 0, 40, rect.h * 0.22, 5);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,209,102,0.14)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }
        // Os seis Despertos, sentados à mesa.
        for (let i = 0; i < 6; i++) {
            const def = CHARACTERS[chars[i]];
            const x = rect.x + rect.w * (0.52 + i * 0.083);
            const scale = 0.78 + (i % 2) * 0.03;
            const sitBuild = {
                ...BASE,
                crouch: 0.42,
                armFront: 0.55,
                armFrontElbow: 0.2,
                armBack: 0.3,
                armBackElbow: 0.18,
                legFront: 0.42,
                legBack: 0.18,
                bob: Math.sin(time * 1.4 + i) * 0.8,
                alpha: 1,
            };
            const halo = ctx.createRadialGradient(x, tableY - 58, 2, x, tableY - 58, 62);
            halo.addColorStop(0, hexToRgba(def.colors.aura, 0.2));
            halo.addColorStop(1, hexToRgba(def.colors.aura, 0));
            ctx.fillStyle = halo;
            ctx.fillRect(x - 70, tableY - 130, 140, 140);
            drawCharacterFigure(ctx, def, x, tableY + 4, i < 3 ? 1 : -1, scale, time + i * 0.7, sitBuild);
        }
        // Mesa de madeira.
        ctx.save();
        const wood = ctx.createLinearGradient(tableX, tableY, tableX, tableY + tableH);
        wood.addColorStop(0, '#6b4428');
        wood.addColorStop(0.35, '#4a2c1b');
        wood.addColorStop(1, '#2a1710');
        ctx.fillStyle = wood;
        roundRectPath(ctx, tableX, tableY, tableW, tableH, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(8,4,6,0.92)';
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,209,102,0.18)';
        ctx.fillRect(tableX + 8, tableY + 2, tableW - 16, 2);
        ctx.fillStyle = 'rgba(18,9,7,0.95)';
        ctx.fillRect(tableX + 14, tableY + tableH, 14, rect.h * 0.12);
        ctx.fillRect(tableX + tableW - 30, tableY + tableH, 14, rect.h * 0.12);
        ctx.restore();
        // Caixa de pizza aberta no centro.
        const boxX = tableX + tableW * 0.44;
        const boxY = tableY - 2;
        ctx.save();
        ctx.translate(boxX, boxY);
        ctx.fillStyle = '#d8b56a';
        ctx.beginPath();
        ctx.moveTo(-62, 0);
        ctx.lineTo(62, 0);
        ctx.lineTo(54, 16);
        ctx.lineTo(-54, 16);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(70,40,20,0.8)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.fillStyle = '#f0d089';
        ctx.beginPath();
        ctx.ellipse(0, 1, 50, 8, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#e8843c';
        ctx.beginPath();
        ctx.arc(0, 1, 42, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ffcf6a';
        for (let i = 0; i < 7; i++) {
            const a = i * 0.9;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * 20, 1 + Math.sin(a) * 4, 2.4, 0, TAU);
            ctx.fill();
        }
        ctx.fillStyle = 'rgba(216,181,106,0.9)';
        ctx.beginPath();
        ctx.moveTo(-62, 0);
        ctx.lineTo(-96, -54);
        ctx.lineTo(26, -54);
        ctx.lineTo(62, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(70,40,20,0.7)';
        ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) {
            const p = (time * 0.24 + i * 0.25) % 1;
            ctx.strokeStyle = `rgba(255,240,200,${(1 - p) * 0.26})`;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(-16 + i * 12, -8 - p * 48);
            ctx.bezierCurveTo(-28 + i * 12, -22 - p * 58, 4 + i * 12, -32 - p * 66, -10 + i * 12, -52 - p * 78);
            ctx.stroke();
        }
        ctx.restore();
        // Seis lembranças flutuando à esquerda: o que cada um trouxe para a mesa.
        const tokens = [
            ['pizza', 'ravi', 0.09, 0.22],
            ['helmet', 'miriam', 0.2, 0.32],
            ['radio', 'kael', 0.31, 0.2],
            ['chain', 'ozric', 0.12, 0.5],
            ['feather', 'elodie', 0.23, 0.56],
            ['seed', 'thryc', 0.34, 0.42],
        ];
        for (const [kind, id, xr, yr] of tokens) {
            this.drawMemoryToken(ctx, kind, rect.x + rect.w * xr, rect.y + rect.h * yr, 22, CHARACTERS[id].colors.aura);
        }
        // Motes de memória.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 24; i++) {
            const x = rect.x + comicNoise(i * 3 + 1) * rect.w;
            const y = rect.y + comicNoise(i * 7 + 2) * rect.h;
            const a = 0.12 + Math.sin(time * 1.6 + i) * 0.08;
            ctx.fillStyle = i % 4 === 0 ? hexToRgba('#ffd166', a) : hexToRgba('#ff8ae2', a * 0.7);
            ctx.beginPath();
            ctx.arc(x, y, 1 + (i % 3) * 0.7, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }
    /** Pequenos ícones das lembranças que cada Desperto leva para a mesa. */
    drawMemoryToken(ctx, kind, x, y, r, color) {
        ctx.save();
        ctx.translate(x, y);
        const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 2.6);
        halo.addColorStop(0, hexToRgba(color, 0.28));
        halo.addColorStop(1, hexToRgba(color, 0));
        ctx.fillStyle = halo;
        ctx.fillRect(-r * 2.8, -r * 2.8, r * 5.6, r * 5.6);
        ctx.strokeStyle = hexToRgba(color, 0.7);
        ctx.fillStyle = 'rgba(6,4,10,0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = hexToRgba('#f2e7c9', 0.9);
        ctx.fillStyle = hexToRgba(color, 0.9);
        ctx.lineWidth = 1.8;
        switch (kind) {
            case 'pizza': {
                ctx.beginPath();
                ctx.moveTo(-9, 8);
                ctx.lineTo(9, 8);
                ctx.lineTo(0, -10);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = 'rgba(6,4,10,0.75)';
                ctx.beginPath();
                ctx.arc(-2, 3, 1.6, 0, TAU);
                ctx.arc(4, 4, 1.4, 0, TAU);
                ctx.fill();
                break;
            }
            case 'helmet': {
                ctx.beginPath();
                ctx.arc(0, 2, 9, Math.PI, TAU);
                ctx.fill();
                ctx.stroke();
                ctx.fillRect(-12, 1, 24, 4);
                ctx.strokeRect(-12, 1, 24, 4);
                ctx.beginPath();
                ctx.moveTo(0, -7);
                ctx.lineTo(0, 1);
                ctx.stroke();
                break;
            }
            case 'radio': {
                roundRectPath(ctx, -10, -6, 20, 14, 3);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-5, -6);
                ctx.lineTo(-8, -13);
                ctx.stroke();
                ctx.fillStyle = 'rgba(6,4,10,0.8)';
                ctx.beginPath();
                ctx.arc(4, 1, 3, 0, TAU);
                ctx.fill();
                ctx.fillRect(-7, 5, 14, 2);
                break;
            }
            case 'chain': {
                ctx.beginPath();
                ctx.ellipse(-4, 0, 7, 4, -0.5, 0, TAU);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(4, 0, 7, 4, 0.5, 0, TAU);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-8, 6);
                ctx.lineTo(-4, 3);
                ctx.stroke();
                break;
            }
            case 'feather': {
                ctx.beginPath();
                ctx.moveTo(0, 11);
                ctx.bezierCurveTo(-9, 3, -5, -7, 2, -11);
                ctx.bezierCurveTo(7, -5, 5, 4, 0, 11);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, 10);
                ctx.lineTo(1, -8);
                ctx.stroke();
                break;
            }
            case 'seed': {
                ctx.beginPath();
                ctx.moveTo(0, -11);
                ctx.bezierCurveTo(9, -4, 8, 5, 0, 10);
                ctx.bezierCurveTo(-8, 5, -9, -4, 0, -11);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, 10);
                ctx.quadraticCurveTo(2, 14, 6, 15);
                ctx.stroke();
                break;
            }
            default:
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, TAU);
                ctx.fill();
                break;
        }
        ctx.restore();
    }
    drawGenericPanel(ctx, rect, beat, globalIndex) {
        const camera = (this.stage.width - this.game.width) * (0.2 + (globalIndex % 3) * 0.12);
        this.drawBackgroundIn(ctx, rect, camera, 1.12);
        ctx.fillStyle = 'rgba(4,5,10,0.52)';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        const color = SPEAKER_COLOR[beat.who] ?? '#ffd166';
        const flip = globalIndex % 2 === 1;
        const cx = rect.x + rect.w * (beat.who === 'narrator' ? 0.5 : flip ? 0.38 : 0.64);
        const cy = rect.y + rect.h * (beat.who === 'narrator' ? 0.5 : 0.58);
        // Lavagem de cor do orador: cada painel tem a temperatura de quem fala.
        const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
        wash.addColorStop(0, hexToRgba(color, 0.04));
        wash.addColorStop(0.55, hexToRgba(color, 0.02));
        wash.addColorStop(1, hexToRgba(color, 0.13));
        ctx.fillStyle = wash;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        if (beat.who === 'narrator') {
            // Horizonte de ruínas: o mundo continua existindo atrás da narração.
            const horizon = rect.y + rect.h * 0.72;
            const hg = ctx.createLinearGradient(rect.x, horizon - 46, rect.x, rect.y + rect.h);
            hg.addColorStop(0, 'rgba(4,5,10,0)');
            hg.addColorStop(1, 'rgba(4,5,10,0.88)');
            ctx.fillStyle = hg;
            ctx.fillRect(rect.x, horizon - 46, rect.w, rect.h - (horizon - 46));
            for (let i = 0; i < 11; i++) {
                const bw = 24 + comicNoise(globalIndex * 11 + i) * 76;
                const bh = 18 + comicNoise(globalIndex * 17 + i * 3) * 96;
                const bx = rect.x + (i / 11) * rect.w + comicNoise(i * 5) * 26;
                ctx.fillStyle = 'rgba(3,4,8,0.74)';
                ctx.fillRect(bx, horizon - bh, bw, bh + 14);
                ctx.fillStyle = hexToRgba(color, 0.1);
                for (let w = 0; w < 3; w++) {
                    if (comicNoise(globalIndex * 23 + i * 7 + w) > 0.5) {
                        ctx.fillRect(bx + 7 + w * 12, horizon - bh + 10, 3, 5);
                    }
                }
            }
            ctx.save();
            ctx.translate(cx, cy);
            ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 150);
            g.addColorStop(0, hexToRgba(color, 0.32));
            g.addColorStop(1, hexToRgba(color, 0));
            ctx.fillStyle = g;
            ctx.fillRect(-150, -150, 300, 300);
            for (let i = 0; i < 4; i++) {
                ctx.strokeStyle = hexToRgba(color, 0.34 - i * 0.06);
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.ellipse(0, 0, 30 + i * 18, 16 + i * 10, this.t * 0.2 + i * 0.4, 0, TAU);
                ctx.stroke();
            }
            // Fragmentos de memória girando ao redor da narração.
            for (let i = 0; i < 7; i++) {
                const a = this.t * 0.24 + (i / 7) * TAU;
                const rr = 74 + (i % 3) * 24;
                const x = Math.cos(a) * rr;
                const y = Math.sin(a) * rr * 0.56;
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(a + i);
                ctx.fillStyle = hexToRgba(color, 0.08 + (i % 3) * 0.03);
                ctx.fillRect(-9, -5, 18, 10);
                ctx.restore();
            }
            ctx.restore();
            return;
        }
        if (beat.who === 'ferrato' || beat.who === 'boss') {
            ctx.save();
            ctx.translate(cx, cy);
            // Tentáculos de fome saindo do escuro.
            ctx.globalCompositeOperation = 'lighter';
            ctx.rotate(this.t * 0.05);
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * TAU;
                const len = 90 + (i % 4) * 36;
                ctx.strokeStyle = hexToRgba(color, 0.08 + (i % 3) * 0.04);
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * 30, Math.sin(a) * 22);
                ctx.quadraticCurveTo(Math.cos(a + 0.4) * len * 0.7, Math.sin(a + 0.4) * len * 0.5, Math.cos(a) * len, Math.sin(a) * len * 0.72);
                ctx.stroke();
            }
            ctx.rotate(-this.t * 0.05);
            const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 160);
            g.addColorStop(0, hexToRgba('#ffffff', 0.34));
            g.addColorStop(0.35, hexToRgba(color, 0.34));
            g.addColorStop(1, hexToRgba(color, 0));
            ctx.fillStyle = g;
            ctx.fillRect(-170, -170, 340, 340);
            // Coroa de espinhos.
            ctx.fillStyle = 'rgba(5,3,11,0.96)';
            for (let i = 0; i < 7; i++) {
                const a = -Math.PI * 0.9 + (i / 6) * Math.PI * 0.8;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * 46, Math.sin(a) * 30 - 18);
                ctx.lineTo(Math.cos(a) * 76, Math.sin(a) * 48 - 42);
                ctx.lineTo(Math.cos(a + 0.09) * 48, Math.sin(a + 0.09) * 32 - 14);
                ctx.closePath();
                ctx.fill();
            }
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
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.beginPath();
            ctx.arc(-7, -5, 3, 0, TAU);
            ctx.fill();
            ctx.restore();
            return;
        }
        const def = CHARACTERS[beat.who];
        if (def) {
            const size = Math.min(rect.w * 0.64, rect.h * 0.92);
            // Luz do Desperto atrás do retrato.
            const halo = ctx.createRadialGradient(cx, cy + 4, 8, cx, cy + 4, size * 0.72);
            halo.addColorStop(0, hexToRgba(color, 0.22));
            halo.addColorStop(0.55, hexToRgba(color, 0.07));
            halo.addColorStop(1, hexToRgba(color, 0));
            ctx.fillStyle = halo;
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            // Sombra no chão do quadro.
            ctx.save();
            ctx.fillStyle = 'rgba(2,3,7,0.5)';
            ctx.beginPath();
            ctx.ellipse(cx, rect.y + rect.h * 0.94, size * 0.36, size * 0.06, 0, 0, TAU);
            ctx.fill();
            ctx.restore();
            this.drawSpeedLines(ctx, cx, cy, rect, hexToRgba(color, 0.08), 20);
            drawCharacterPortrait(ctx, def, cx, cy + 8, size, this.t, false);
            // Luz de contorno separando o herói do fundo.
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = hexToRgba(def.colors.accent, 0.26);
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.arc(cx, cy + 4, size * 0.33, -Math.PI * 0.78, -Math.PI * 0.22);
            ctx.stroke();
            ctx.strokeStyle = hexToRgba(def.colors.secondary, 0.14);
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(cx, cy + 4, size * 0.4, Math.PI * 0.08, Math.PI * 0.7);
            ctx.stroke();
            // Poeira de luz.
            for (let i = 0; i < 12; i++) {
                const a = this.t * 0.5 + i * 2.1;
                const rr = size * (0.24 + (i % 4) * 0.08);
                ctx.fillStyle = hexToRgba(color, 0.1 + (i % 3) * 0.05);
                ctx.beginPath();
                ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a * 0.7) * rr * 0.72, 1.2 + (i % 3) * 0.6, 0, TAU);
                ctx.fill();
            }
            ctx.restore();
            // Antes do despertar, o herói aparece em silhueta. O quadro seguinte
            // é quem revela a forma desperta em cores.
            if (this.phase === 'intro' && this.stage.chapter === 1 && this.page === 0) {
                ctx.save();
                ctx.fillStyle = 'rgba(3,5,12,0.68)';
                ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
                const rim = ctx.createRadialGradient(cx, cy + 8, size * 0.18, cx, cy + 8, size * 0.62);
                rim.addColorStop(0, 'rgba(0,0,0,0)');
                rim.addColorStop(0.62, 'rgba(0,0,0,0)');
                rim.addColorStop(0.82, hexToRgba(color, 0.28));
                rim.addColorStop(1, hexToRgba(color, 0));
                ctx.fillStyle = rim;
                ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
                ctx.restore();
            }
        }
    }
    // -------------------------------------------------------- textos e balões
    drawCaption(ctx, x, y, maxW, text, visible, seed, bottom = false, large = false) {
        const size = large ? 17.5 : 15.5;
        const lineH = large ? 23 : 20;
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