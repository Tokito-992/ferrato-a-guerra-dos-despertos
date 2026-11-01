/** Seleção de arcos e capítulos: história, lore, dificuldade e chefe de cada fase. */
import { CHARACTERS, CHARACTER_ORDER } from '../data/characters.js?v=c5d0d69737a2';
import { BOSSES } from '../data/bosses.js?v=c5d0d69737a2';
import { arcFinaleStage, arcFirstStage, ARC_COUNT, CHAPTERS_PER_ARC, getArcStages, getStage, MAX_STAGE, STAGE_ROMAN, } from '../data/stages.js?v=c5d0d69737a2';
import { clamp, hexToRgba } from '../core/math.js?v=c5d0d69737a2';
import { drawStageBackground } from '../render/backgrounds.js?v=c5d0d69737a2';
import { drawCharacterPortrait, drawCharacterSilhouette } from '../render/characters.js?v=c5d0d69737a2';
import { FONTS, bar, glow, label, panel, roundRectPath } from '../render/theme.js?v=c5d0d69737a2';
function inside(box, x, y) {
    return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}
function fitText(ctx, text, maxW, size, font = FONTS.ui) {
    ctx.save();
    ctx.font = `600 ${size}px ${font}`;
    if (ctx.measureText(text).width <= maxW) {
        ctx.restore();
        return text;
    }
    let out = text;
    while (out.length > 1 && ctx.measureText(`${out}…`).width > maxW)
        out = out.slice(0, -1);
    ctx.restore();
    return `${out}…`;
}
function wrapped(ctx, text, x, y, maxW, lineH, size, color, maxLines = 3, font = FONTS.ui, weight = 500) {
    ctx.save();
    ctx.font = `${weight} ${size}px ${font}`;
    const words = text.split(/\s+/);
    let line = '';
    let ly = y;
    let lines = 0;
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxW && line) {
            label(ctx, line, x, ly, size, color, { font, weight });
            lines++;
            ly += lineH;
            line = word;
            if (lines >= maxLines)
                break;
        }
        else {
            line = test;
        }
    }
    if (lines < maxLines && line) {
        label(ctx, line, x, ly, size, color, { font, weight });
        lines++;
        ly += lineH;
    }
    ctx.restore();
    return ly;
}
export class CharacterSelectScene {
    constructor(game, stageId, _selected) {
        this.game = game;
        this.t = 0;
        this.charIndex = 0;
        this.hoverCard = -1;
        this.hoverChapter = -1;
        this.cardRects = [];
        this.stageRects = [];
        this.startRect = { x: 0, y: 0, w: 0, h: 0 };
        this.backRect = { x: 0, y: 0, w: 0, h: 0 };
        const max = Math.max(1, Math.min(MAX_STAGE, this.game.save.maxStage));
        this.stageId = clamp(Math.round(stageId), 1, max);
        const arc = Math.max(1, Math.min(ARC_COUNT, Math.ceil(this.stageId / CHAPTERS_PER_ARC)));
        this.charIndex = arc - 1;
    }
    enter() {
        this.preview(this.stageId);
    }
    get selectedId() {
        return CHARACTER_ORDER[this.charIndex];
    }
    get selectedUnlocked() {
        return this.game.save.unlocked.includes(this.selectedId);
    }
    get maxStage() {
        return Math.max(1, Math.min(MAX_STAGE, this.game.save.maxStage));
    }
    preview(id) {
        this.stageId = clamp(Math.round(id), 1, MAX_STAGE);
        const stage = getStage(this.stageId);
        this.game.audio.playMusic(stage.music);
        this.game.audio.playAmbience(stage.ambient);
    }
    selectArc(index) {
        const next = (index + CHARACTER_ORDER.length) % CHARACTER_ORDER.length;
        if (next === this.charIndex)
            return;
        this.charIndex = next;
        const arc = this.charIndex + 1;
        const first = arcFirstStage(arc);
        const last = Math.min(arcFinaleStage(arc), this.maxStage);
        this.game.audio.sfx('select');
        this.preview(last >= first ? last : first);
    }
    chooseChapter(id) {
        const arc = this.charIndex + 1;
        const first = arcFirstStage(arc);
        const finale = arcFinaleStage(arc);
        if (id < first || id > finale || id === this.stageId)
            return;
        const available = id <= this.maxStage;
        this.game.audio.sfx(available ? 'select' : 'ui');
        this.preview(id);
    }
    start() {
        const stage = getStage(this.stageId);
        const hero = stage.character;
        if (this.stageId > this.maxStage || !this.game.save.unlocked.includes(hero)) {
            this.game.audio.sfx('ui');
            return;
        }
        this.game.audio.sfx('confirm');
        this.game.startStage(this.stageId, hero);
    }
    update(dt) {
        this.t += dt;
        const input = this.game.input;
        if (input.pressed('back') || input.pressed('pause')) {
            this.game.audio.sfx('ui');
            this.game.gotoTitle();
            return;
        }
        if (input.pressed('left'))
            this.selectArc(this.charIndex - 1);
        if (input.pressed('right'))
            this.selectArc(this.charIndex + 1);
        const arcStages = getArcStages(this.charIndex + 1);
        const current = arcStages.findIndex((stage) => stage.id === this.stageId);
        if (input.pressed('up')) {
            const next = Math.max(0, current < 0 ? 0 : current - 1);
            if (next !== current)
                this.chooseChapter(arcStages[next].id);
        }
        if (input.pressed('down')) {
            const next = Math.min(arcStages.length - 1, current < 0 ? 0 : current + 1);
            if (next !== current)
                this.chooseChapter(arcStages[next].id);
        }
        // Mouse: abas de capítulo.
        this.hoverChapter = -1;
        for (let i = 0; i < this.stageRects.length; i++) {
            if (!inside(this.stageRects[i], input.mouse.x, input.mouse.y))
                continue;
            this.hoverChapter = i;
            if (input.mouse.clicked)
                this.chooseChapter(arcStages[i].id);
        }
        // Mouse: cartões de arco.
        this.hoverCard = -1;
        for (let i = 0; i < this.cardRects.length; i++) {
            if (!inside(this.cardRects[i], input.mouse.x, input.mouse.y))
                continue;
            this.hoverCard = i;
            if (input.mouse.clicked)
                this.selectArc(i);
        }
        if (input.mouse.clicked && inside(this.startRect, input.mouse.x, input.mouse.y)) {
            this.start();
            return;
        }
        if (input.mouse.clicked && inside(this.backRect, input.mouse.x, input.mouse.y)) {
            this.game.audio.sfx('ui');
            this.game.gotoTitle();
            return;
        }
        if (input.pressed('confirm') || input.pressed('attack'))
            this.start();
    }
    draw(ctx) {
        const { width } = this.game;
        const stage = getStage(this.stageId);
        const def = CHARACTERS[this.selectedId];
        const heroUnlocked = this.selectedUnlocked;
        const canStart = heroUnlocked && this.stageId <= this.maxStage;
        const accent = heroUnlocked ? def.colors.accent : '#7c8399';
        const scroll = (stage.width - width) * 0.22;
        drawStageBackground(ctx, stage, scroll, this.t);
        ctx.fillStyle = 'rgba(3,4,9,0.68)';
        ctx.fillRect(0, 0, width, this.game.height);
        const topFade = ctx.createLinearGradient(0, 0, 0, 180);
        topFade.addColorStop(0, 'rgba(3,4,9,0.94)');
        topFade.addColorStop(1, 'rgba(3,4,9,0)');
        ctx.fillStyle = topFade;
        ctx.fillRect(0, 0, width, 180);
        // ------------------------------------------------------------ cabeçalho
        label(ctx, 'DESPERTOS & ARCOS', 82, 54, 34, '#f2f5ff', {
            weight: 800,
            spacing: 5,
            glow: 'rgba(180,139,255,0.35)',
        });
        label(ctx, 'SEIS HISTÓRIAS · TRINTA E SEIS CAPÍTULOS · UM VÉU FAMINTO', 82, 75, 9.5, 'rgba(190,198,220,0.66)', {
            font: FONTS.mono,
            spacing: 1.35,
        });
        label(ctx, `ARCO ${STAGE_ROMAN[stage.arc - 1]} · CAP. ${stage.chapter} / ${CHAPTERS_PER_ARC}`, width - 82, 46, 16, hexToRgba(stage.palette.accent, 0.95), {
            align: 'right',
            weight: 700,
            spacing: 2,
        });
        label(ctx, fitText(ctx, stage.name.toUpperCase(), 540, 11.5, FONTS.mono), width - 82, 66, 11.5, 'rgba(235,239,250,0.84)', {
            align: 'right',
            font: FONTS.mono,
            weight: 600,
            spacing: 1.1,
        });
        label(ctx, fitText(ctx, stage.location.toUpperCase(), 540, 9, FONTS.mono), width - 82, 84, 9, 'rgba(190,198,220,0.6)', {
            align: 'right',
            font: FONTS.mono,
            spacing: 0.9,
        });
        // ------------------------------------------------------------ abas de capítulo
        this.stageRects = [];
        const arcStages = getArcStages(stage.arc);
        const tabW = 176;
        const tabGap = 10;
        const tabY = 100;
        const tabX = 87;
        arcStages.forEach((chapter, i) => {
            const x = tabX + i * (tabW + tabGap);
            const r = { x, y: tabY, w: tabW, h: 34 };
            this.stageRects.push(r);
            const available = chapter.id <= this.maxStage;
            const active = chapter.id === this.stageId;
            const hovered = i === this.hoverChapter;
            ctx.save();
            ctx.fillStyle = active
                ? hexToRgba(chapter.palette.accent, 0.22)
                : available
                    ? 'rgba(255,255,255,0.07)'
                    : 'rgba(255,255,255,0.025)';
            roundRectPath(ctx, x, tabY, tabW, 34, 3);
            ctx.fill();
            ctx.strokeStyle = active
                ? hexToRgba(chapter.palette.accent, 0.85)
                : hovered
                    ? 'rgba(255,255,255,0.24)'
                    : available
                        ? 'rgba(255,255,255,0.13)'
                        : 'rgba(255,255,255,0.04)';
            ctx.lineWidth = active ? 1.5 : 1;
            ctx.stroke();
            ctx.restore();
            label(ctx, STAGE_ROMAN[i], x + 13, tabY + 22, 14, active ? '#ffffff' : available ? 'rgba(220,226,242,0.72)' : 'rgba(160,168,190,0.25)', {
                weight: 800,
                font: FONTS.mono,
            });
            label(ctx, fitText(ctx, chapter.name.toUpperCase(), tabW - 58, 9.5), x + 37, tabY + 21, 9.5, active ? hexToRgba(chapter.palette.accent, 0.98) : available ? 'rgba(210,218,236,0.74)' : 'rgba(160,168,190,0.24)', { weight: 600, spacing: 0.5 });
            if (chapter.boss) {
                label(ctx, '◆', x + tabW - 12, tabY + 21, 9, available ? hexToRgba(chapter.palette.accent, 0.7) : 'rgba(160,168,190,0.2)', {
                    align: 'right',
                    font: FONTS.mono,
                });
            }
            else if (!available) {
                label(ctx, '—', x + tabW - 12, tabY + 21, 9, 'rgba(160,168,190,0.3)', { align: 'right', font: FONTS.mono });
            }
        });
        // ------------------------------------------------------------ cartões de arco
        this.cardRects = [];
        const cardW = 176;
        const cardGap = 10;
        const cardY = 146;
        const cardH = 188;
        const cardX = 87;
        CHARACTER_ORDER.forEach((id, i) => {
            const c = CHARACTERS[id];
            const x = cardX + i * (cardW + cardGap);
            const r = { x, y: cardY, w: cardW, h: cardH };
            this.cardRects.push(r);
            const selected = i === this.charIndex;
            const isUnlocked = this.game.save.unlocked.includes(id);
            const hovered = i === this.hoverCard;
            const col = isUnlocked ? c.colors.accent : '#4d5366';
            const arc = i + 1;
            const clearedInArc = getArcStages(arc).filter((s) => this.game.save.cleared.includes(s.id)).length;
            ctx.save();
            ctx.fillStyle = selected ? hexToRgba(col, 0.16) : 'rgba(8,10,20,0.55)';
            roundRectPath(ctx, x, cardY, cardW, cardH, 6);
            ctx.fill();
            if (selected) {
                ctx.shadowColor = hexToRgba(col, 0.8);
                ctx.shadowBlur = 22;
            }
            ctx.strokeStyle = selected ? col : hovered ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.09)';
            ctx.lineWidth = selected ? 1.6 : 1;
            roundRectPath(ctx, x, cardY, cardW, cardH, 6);
            ctx.stroke();
            ctx.restore();
            label(ctx, `ARCO ${STAGE_ROMAN[i]}`, x + 12, cardY + 19, 8.5, isUnlocked ? hexToRgba(col, 0.7) : 'rgba(160,168,190,0.28)', {
                font: FONTS.mono,
                spacing: 1.2,
            });
            label(ctx, isUnlocked ? `${clearedInArc} / ${CHAPTERS_PER_ARC}` : 'SELADO', x + cardW - 12, cardY + 19, 8.5, isUnlocked ? 'rgba(200,208,228,0.68)' : 'rgba(255,106,122,0.5)', {
                align: 'right',
                font: FONTS.mono,
                spacing: 0.9,
            });
            if (isUnlocked) {
                glow(ctx, x + cardW / 2, cardY + 86, 80, c.colors.aura, selected ? 0.18 : 0.08);
                drawCharacterPortrait(ctx, c, x + cardW / 2, cardY + 88, 96, this.t, false);
            }
            else {
                drawCharacterSilhouette(ctx, id, x + cardW / 2, cardY + 136, 0.72, '#181a24');
                label(ctx, 'SELADO', x + cardW / 2, cardY + 96, 9, 'rgba(170,178,200,0.4)', {
                    align: 'center',
                    font: FONTS.mono,
                    spacing: 2,
                });
            }
            label(ctx, c.name.toUpperCase(), x + cardW / 2, cardY + 158, 18, isUnlocked ? '#f2f5ff' : 'rgba(170,178,200,0.4)', {
                align: 'center',
                weight: 800,
                spacing: 1.6,
            });
            label(ctx, c.epithet.toUpperCase(), x + cardW / 2, cardY + 176, 9, isUnlocked ? hexToRgba(col, 0.85) : 'rgba(170,178,200,0.28)', {
                align: 'center',
                font: FONTS.mono,
                spacing: 1.2,
            });
            if (selected) {
                ctx.fillStyle = col;
                ctx.fillRect(x + 10, cardY + cardH - 4, cardW - 20, 2);
            }
        });
        // ------------------------------------------------------------ painel de detalhes
        panel(ctx, 82, 348, 1116, 294, {
            fill: 'rgba(4,6,14,0.8)',
            border: hexToRgba(accent, 0.3),
            glow: hexToRgba(accent, 0.12),
            cut: 16,
        });
        ctx.fillStyle = hexToRgba(accent, 0.55);
        ctx.fillRect(82, 348, 2, 294);
        // Retrato grande.
        const px = 200;
        const py = 494;
        if (heroUnlocked) {
            glow(ctx, px, py, 128, def.colors.aura, 0.16 + Math.sin(this.t * 2) * 0.03);
            drawCharacterPortrait(ctx, def, px, py, 168, this.t, false);
        }
        else {
            glow(ctx, px, py, 122, '#5b6072', 0.08);
            drawCharacterSilhouette(ctx, this.selectedId, px, py + 70, 1.15, '#141620');
            label(ctx, 'SELADO', px, py + 102, 12, 'rgba(170,178,200,0.4)', {
                align: 'center',
                font: FONTS.mono,
                spacing: 3,
            });
        }
        // Identidade e lore.
        label(ctx, def.name.toUpperCase(), 308, 392, 31, heroUnlocked ? '#f2f5ff' : 'rgba(200,206,224,0.45)', {
            weight: 800,
            spacing: 2,
            glow: heroUnlocked ? hexToRgba(accent, 0.3) : undefined,
        });
        label(ctx, fitText(ctx, `${def.epithet.toUpperCase()} · ${def.gender.toUpperCase()}`, 292, 9.5, FONTS.mono), 309, 414, 9.5, heroUnlocked ? hexToRgba(accent, 0.9) : 'rgba(170,178,200,0.3)', {
            font: FONTS.mono,
            spacing: 0.9,
        });
        label(ctx, fitText(ctx, def.origin, 292, 11.5), 309, 436, 11.5, 'rgba(215,221,238,0.82)');
        label(ctx, fitText(ctx, `${def.combat} · ${def.style}`, 292, 10.5), 309, 454, 10.5, 'rgba(180,188,208,0.66)');
        wrapped(ctx, def.lore[0] ?? '', 309, 474, 292, 13, 10.5, 'rgba(205,212,230,0.68)', 3);
        if (heroUnlocked) {
            label(ctx, `HABILIDADE · ${def.ability.name.toUpperCase()}`, 309, 516, 9.2, hexToRgba(accent, 0.95), {
                font: FONTS.mono,
                spacing: 1.1,
            });
            wrapped(ctx, def.ability.desc, 309, 532, 292, 13, 10.5, 'rgba(205,212,230,0.68)', 2);
            label(ctx, def.ability.hint, 309, 568, 9.2, 'rgba(255,255,255,0.45)', { font: FONTS.mono });
            label(ctx, `PASSIVA · ${def.passive.name.toUpperCase()}`, 309, 590, 9.2, '#ffe6a3', {
                font: FONTS.mono,
                spacing: 1.1,
            });
            wrapped(ctx, def.passive.desc, 309, 604, 292, 12, 10, 'rgba(205,212,230,0.58)', 2);
        }
        else {
            const unlockArc = Math.ceil(stage.id / CHAPTERS_PER_ARC);
            label(ctx, 'MEMÓRIA AINDA NÃO DESPERTA', 309, 516, 10.5, 'rgba(170,178,200,0.45)', { font: FONTS.mono, spacing: 1 });
            wrapped(ctx, `Conclua o Capítulo ${Math.max(1, arcFirstStage(unlockArc) - 1)} para despertar ${def.name}.`, 309, 542, 292, 17, 14, 'rgba(215,221,238,0.65)', 2);
            wrapped(ctx, `“${def.lore[0] ?? ''}”`, 309, 588, 292, 14, 11, 'rgba(205,212,230,0.4)', 3);
        }
        // Centro: capítulo, sinopse, motivo e guardião/chefe.
        const infoX = 618;
        const infoW = 280;
        label(ctx, `CAPÍTULO ${stage.chapter} / ${CHAPTERS_PER_ARC}`, infoX, 392, 9.2, 'rgba(255,230,163,0.8)', {
            font: FONTS.mono,
            spacing: 1.5,
        });
        label(ctx, stage.name.toUpperCase(), infoX, 416, 17, '#f2f5ff', {
            weight: 800,
            spacing: 1.2,
            glow: hexToRgba(stage.palette.accent, 0.28),
        });
        label(ctx, stage.location.toUpperCase(), infoX, 434, 8.8, 'rgba(190,198,220,0.62)', {
            font: FONTS.mono,
            spacing: 0.8,
        });
        wrapped(ctx, stage.synopsis, infoX, 456, infoW, 14, 10.5, 'rgba(215,221,238,0.76)', 3);
        label(ctx, 'MOTIVO', infoX, 516, 9, hexToRgba(stage.palette.accent, 0.8), {
            font: FONTS.mono,
            spacing: 1.4,
        });
        wrapped(ctx, stage.motive, infoX, 530, infoW, 14, 10.5, 'rgba(235,239,250,0.84)', 3);
        const boss = stage.boss ? BOSSES[stage.boss] : null;
        label(ctx, boss ? 'CHEFE DO PLANETA' : 'GUARDIÃO DO CAPÍTULO', infoX, 588, 9, boss ? '#ff8a9a' : 'rgba(255,230,163,0.75)', {
            font: FONTS.mono,
            spacing: 1.3,
        });
        if (boss) {
            wrapped(ctx, `${boss.name} — ${boss.title}`, infoX, 602, infoW, 14, 10.5, 'rgba(230,234,245,0.8)', 2);
        }
        else {
            wrapped(ctx, `${stage.eliteName} — elite no fim do capítulo`, infoX, 602, infoW, 14, 10.5, 'rgba(230,234,245,0.76)', 2);
        }
        // Direita: atributos, dificuldade e progresso.
        const statX = 920;
        const statW = 270;
        label(ctx, 'ATRIBUTOS', statX, 392, 9.2, 'rgba(255,230,163,0.75)', { font: FONTS.mono, spacing: 1.5 });
        const stats = [
            ['VIDA', def.maxHp / 160, '#ff6a7a'],
            ['VELOCIDADE', def.speed / 290, '#56e3ff'],
            ['IMPULSO', def.jump / 650, '#b48bff'],
            ['PESO', def.weight / 1.6, '#ffae5a'],
        ];
        stats.forEach(([name, value, color], i) => {
            const y = 410 + i * 24;
            label(ctx, name, statX, y + 8, 8.8, 'rgba(190,198,220,0.66)', { font: FONTS.mono, spacing: 0.8 });
            bar(ctx, statX + 90, y, statW - 96, 7, clamp(value, 0, 1), color, 'rgba(255,255,255,0.06)');
            label(ctx, `${Math.round(clamp(value, 0, 1) * 100)}`, statX + statW - 6, y + 8, 8.8, hexToRgba(color, 0.75), {
                align: 'right',
                font: FONTS.mono,
            });
        });
        label(ctx, `DIFICULDADE ${'◆'.repeat(clamp(Math.round(stage.difficulty * 3), 1, 8))}`, statX, 510, 8.8, 'rgba(170,178,200,0.62)', {
            font: FONTS.mono,
            spacing: 0.8,
        });
        label(ctx, `CAPÍTULO ${stage.id} / ${MAX_STAGE}`, statX, 528, 8.8, 'rgba(170,178,200,0.54)', {
            font: FONTS.mono,
            spacing: 0.8,
        });
        // Botão iniciar.
        this.startRect = { x: 974, y: 548, w: 170, h: 52 };
        ctx.save();
        if (canStart) {
            const g = ctx.createLinearGradient(this.startRect.x, this.startRect.y, this.startRect.x + this.startRect.w, this.startRect.y + this.startRect.h);
            g.addColorStop(0, hexToRgba(accent, 0.88));
            g.addColorStop(1, hexToRgba(accent, 0.38));
            ctx.fillStyle = g;
            ctx.shadowColor = hexToRgba(accent, 0.7);
            ctx.shadowBlur = 20;
        }
        else {
            ctx.fillStyle = 'rgba(90,96,116,0.25)';
        }
        roundRectPath(ctx, this.startRect.x, this.startRect.y, this.startRect.w, this.startRect.h, 4);
        ctx.fill();
        ctx.restore();
        label(ctx, canStart ? 'INICIAR' : 'SELADO', this.startRect.x + this.startRect.w / 2, this.startRect.y + 24, 17, canStart ? '#0b0910' : 'rgba(180,188,208,0.4)', {
            align: 'center',
            weight: 800,
            spacing: 2.2,
        });
        label(ctx, canStart ? (this.game.isTouchDevice ? 'TOQUE PARA INICIAR' : 'ENTER') : `CAP. ${this.maxStage}`, this.startRect.x + this.startRect.w / 2, this.startRect.y + 42, 8.3, canStart ? 'rgba(10,8,14,0.65)' : 'rgba(180,188,208,0.25)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.3,
        });
        // Voltar: alvo grande o bastante para o polegar no celular.
        this.backRect = { x: 954, y: 610, w: 190, h: 40 };
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        roundRectPath(ctx, this.backRect.x, this.backRect.y, this.backRect.w, this.backRect.h, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        label(ctx, '⌂ VOLTAR AO MENU', this.backRect.x + this.backRect.w / 2, 635, 9.5, 'rgba(210,218,238,0.72)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.1,
        });
        // Rodapé.
        label(ctx, this.game.isTouchDevice
            ? 'TOQUE NOS ARCOS E CAPÍTULOS   ·   ⌂ VOLTAR AO MENU'
            : '← → ARCOS   ↑ ↓ CAPÍTULOS   ENTER INICIAR   ESC VOLTAR', 82, 688, 9.5, 'rgba(190,198,220,0.54)', { font: FONTS.mono, spacing: 1.1 });
        const arcsDone = Array.from({ length: ARC_COUNT }, (_, i) => i + 1).filter((arc) => getArcStages(arc).every((chapter) => this.game.save.cleared.includes(chapter.id))).length;
        label(ctx, `${this.game.save.cleared.length} / ${MAX_STAGE} CAP. · ${arcsDone} / ${ARC_COUNT} ARCOS · ${this.game.save.unlocked.length} / 6 DESPERTOS`, width - 82, 688, 9, 'rgba(160,168,190,0.48)', { align: 'right', font: FONTS.mono, spacing: 0.8 });
        if (!canStart) {
            const message = !heroUnlocked
                ? `SELADO — CONCLUA O CAP. ${this.maxStage} PARA DESPERTAR ${def.name.toUpperCase()}`
                : `SELADO — CONCLUA O CAP. ${this.maxStage} PARA LIBERAR ESTE CAPÍTULO`;
            label(ctx, message, 82, 662, 9.3, 'rgba(255,106,122,0.66)', {
                font: FONTS.mono,
                spacing: 0.9,
            });
        }
    }
}
//# sourceMappingURL=characterSelect.js.map