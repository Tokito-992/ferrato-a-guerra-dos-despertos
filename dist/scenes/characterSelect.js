/** Seleção de Desperto e de fase, com detalhes de jogabilidade e lore. */
import { CHARACTERS, CHARACTER_ORDER } from '../data/characters.js';
import { BOSSES } from '../data/bosses.js';
import { getStage, STAGES } from '../data/stages.js';
import { clamp, hexToRgba } from '../core/math.js';
import { drawStageBackground } from '../render/backgrounds.js';
import { drawCharacterPortrait, drawCharacterSilhouette } from '../render/characters.js';
import { FONTS, bar, glow, label, panel, roundRectPath } from '../render/theme.js';
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
function inside(box, x, y) {
    return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
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
    constructor(game, stageId, selected) {
        this.game = game;
        this.t = 0;
        this.charIndex = 0;
        this.hoverCard = -1;
        this.cardRects = [];
        this.stageRects = [];
        this.startRect = { x: 0, y: 0, w: 0, h: 0 };
        this.backRect = { x: 0, y: 0, w: 0, h: 0 };
        this.stageId = clamp(stageId, 1, Math.max(1, this.game.save.maxStage));
        const preferred = selected ?? this.game.save.selected;
        const idx = CHARACTER_ORDER.indexOf(preferred);
        this.charIndex = idx >= 0 ? idx : 0;
    }
    enter() {
        const stage = getStage(this.stageId);
        this.game.audio.playMusic(stage.music);
    }
    get selectedId() {
        return CHARACTER_ORDER[this.charIndex];
    }
    get selectedUnlocked() {
        return this.game.save.unlocked.includes(this.selectedId);
    }
    chooseStage(id) {
        const clamped = clamp(id, 1, Math.max(1, this.game.save.maxStage));
        if (clamped === this.stageId)
            return;
        this.stageId = clamped;
        this.game.audio.sfx('select');
        this.game.audio.playMusic(getStage(this.stageId).music);
    }
    start() {
        const id = this.selectedId;
        if (!this.selectedUnlocked) {
            const unlockStage = CHARACTERS[id].stage;
            this.game.audio.sfx('ui');
            this.game.setNotice(`SELADO — CONCLUA A FASE ${ROMAN[unlockStage - 1]} PARA DESPERTAR`, '#ff6a7a');
            return;
        }
        this.game.audio.sfx('confirm');
        this.game.startStage(this.stageId, id);
    }
    update(dt) {
        this.t += dt;
        const input = this.game.input;
        const maxStage = Math.max(1, this.game.save.maxStage);
        if (input.pressed('back') || input.pressed('pause')) {
            this.game.audio.sfx('ui');
            this.game.gotoTitle();
            return;
        }
        if (input.pressed('left')) {
            this.charIndex = (this.charIndex + CHARACTER_ORDER.length - 1) % CHARACTER_ORDER.length;
            this.game.audio.sfx('select');
        }
        if (input.pressed('right')) {
            this.charIndex = (this.charIndex + 1) % CHARACTER_ORDER.length;
            this.game.audio.sfx('select');
        }
        if (input.pressed('up'))
            this.chooseStage(this.stageId - 1);
        if (input.pressed('down'))
            this.chooseStage(this.stageId + 1);
        // Mouse: abas de fase.
        for (let i = 0; i < this.stageRects.length; i++) {
            if (input.mouse.clicked && inside(this.stageRects[i], input.mouse.x, input.mouse.y)) {
                if (i + 1 <= maxStage)
                    this.chooseStage(i + 1);
                else
                    this.game.audio.sfx('ui');
            }
        }
        // Mouse: cartões.
        this.hoverCard = -1;
        for (let i = 0; i < this.cardRects.length; i++) {
            if (inside(this.cardRects[i], input.mouse.x, input.mouse.y)) {
                this.hoverCard = i;
                if (input.mouse.clicked) {
                    if (this.charIndex !== i)
                        this.game.audio.sfx('select');
                    this.charIndex = i;
                }
            }
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
        if (input.pressed('confirm') || input.pressed('attack')) {
            this.start();
        }
    }
    draw(ctx) {
        const { width } = this.game;
        const stage = getStage(this.stageId);
        const def = CHARACTERS[this.selectedId];
        const unlocked = this.selectedUnlocked;
        const accent = unlocked ? def.colors.accent : '#7c8399';
        const scroll = (stage.width - width) * 0.22;
        drawStageBackground(ctx, stage, scroll, this.t);
        ctx.fillStyle = 'rgba(3,4,9,0.72)';
        ctx.fillRect(0, 0, width, this.game.height);
        const topFade = ctx.createLinearGradient(0, 0, 0, 180);
        topFade.addColorStop(0, 'rgba(3,4,9,0.92)');
        topFade.addColorStop(1, 'rgba(3,4,9,0)');
        ctx.fillStyle = topFade;
        ctx.fillRect(0, 0, width, 180);
        // Cabeçalho.
        label(ctx, 'DESPERTOS', 82, 56, 38, '#f2f5ff', {
            weight: 800,
            spacing: 6,
            glow: 'rgba(180,139,255,0.35)',
        });
        label(ctx, 'ESCOLHA QUEM VAI ENCARAR O VÉU', 82, 76, 10, 'rgba(190,198,220,0.55)', {
            font: FONTS.mono,
            spacing: 1.5,
        });
        label(ctx, `FASE ${ROMAN[this.stageId - 1]} · ${stage.name.toUpperCase()}`, width - 82, 50, 16, hexToRgba(stage.palette.accent, 0.95), {
            align: 'right',
            weight: 700,
            spacing: 2,
        });
        label(ctx, stage.location.toUpperCase(), width - 82, 70, 9.5, 'rgba(190,198,220,0.5)', {
            align: 'right',
            font: FONTS.mono,
            spacing: 1,
        });
        // Abas de fase.
        this.stageRects = [];
        const tabY = 92;
        const tabW = 176;
        const tabGap = 10;
        for (let i = 0; i < STAGES.length; i++) {
            const x = 82 + i * (tabW + tabGap);
            const r = { x, y: tabY, w: tabW, h: 38 };
            this.stageRects.push(r);
            const available = i + 1 <= this.game.save.maxStage;
            const active = i + 1 === this.stageId;
            ctx.save();
            ctx.fillStyle = active
                ? hexToRgba(STAGES[i].palette.accent, 0.2)
                : available
                    ? 'rgba(255,255,255,0.045)'
                    : 'rgba(255,255,255,0.015)';
            roundRectPath(ctx, x, tabY, tabW, 38, 3);
            ctx.fill();
            ctx.strokeStyle = active
                ? hexToRgba(STAGES[i].palette.accent, 0.8)
                : available
                    ? 'rgba(255,255,255,0.13)'
                    : 'rgba(255,255,255,0.04)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
            label(ctx, `${ROMAN[i]}`, x + 14, tabY + 24, 15, active ? '#ffffff' : available ? 'rgba(220,226,242,0.7)' : 'rgba(160,168,190,0.25)', {
                weight: 800,
                font: FONTS.mono,
            });
            label(ctx, STAGES[i].name.toUpperCase(), x + 40, tabY + 23, 10, active ? hexToRgba(STAGES[i].palette.accent, 0.95) : available ? 'rgba(200,208,228,0.55)' : 'rgba(160,168,190,0.22)', {
                weight: 600,
                spacing: 0.6,
            });
            if (!available) {
                label(ctx, '—', x + tabW - 14, tabY + 23, 12, 'rgba(160,168,190,0.3)', { align: 'right', font: FONTS.mono });
            }
        }
        // Cartões.
        this.cardRects = [];
        const cardY = 144;
        const cardW = 176;
        const cardH = 214;
        CHARACTER_ORDER.forEach((id, i) => {
            const c = CHARACTERS[id];
            const x = 82 + i * (cardW + 10);
            const r = { x, y: cardY, w: cardW, h: cardH };
            this.cardRects.push(r);
            const selected = i === this.charIndex;
            const isUnlocked = this.game.save.unlocked.includes(id);
            const hovered = i === this.hoverCard;
            const col = isUnlocked ? c.colors.accent : '#4d5366';
            ctx.save();
            ctx.fillStyle = selected ? hexToRgba(col, 0.13) : 'rgba(8,10,20,0.62)';
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
            // Selo de fase.
            label(ctx, `FASE ${ROMAN[c.stage - 1]}`, x + 12, cardY + 19, 8.5, isUnlocked ? hexToRgba(col, 0.7) : 'rgba(160,168,190,0.28)', {
                font: FONTS.mono,
                spacing: 1.2,
            });
            if (isUnlocked) {
                glow(ctx, x + cardW / 2, cardY + 96, 84, c.colors.aura, selected ? 0.18 : 0.08);
                drawCharacterPortrait(ctx, c, x + cardW / 2, cardY + 96, 100, this.t, false);
            }
            else {
                drawCharacterSilhouette(ctx, id, x + cardW / 2, cardY + 146, 0.72, '#181a24');
                label(ctx, 'SELADO', x + cardW / 2, cardY + 176, 10, 'rgba(170,178,200,0.42)', {
                    align: 'center',
                    font: FONTS.mono,
                    spacing: 2,
                });
            }
            label(ctx, c.name.toUpperCase(), x + cardW / 2, cardY + 178, 19, isUnlocked ? '#f2f5ff' : 'rgba(170,178,200,0.4)', {
                align: 'center',
                weight: 800,
                spacing: 1.8,
            });
            label(ctx, c.epithet.toUpperCase(), x + cardW / 2, cardY + 196, 9.5, isUnlocked ? hexToRgba(col, 0.85) : 'rgba(170,178,200,0.28)', {
                align: 'center',
                font: FONTS.mono,
                spacing: 1.3,
            });
            if (selected) {
                ctx.fillStyle = col;
                ctx.fillRect(x + 10, cardY + cardH - 4, cardW - 20, 2);
            }
        });
        // Painel de detalhes.
        panel(ctx, 82, 374, 1116, 268, {
            fill: 'rgba(4,6,14,0.82)',
            border: hexToRgba(accent, 0.3),
            glow: hexToRgba(accent, 0.12),
            cut: 16,
        });
        ctx.fillStyle = hexToRgba(accent, 0.55);
        ctx.fillRect(82, 374, 2, 268);
        // Retrato grande.
        const px = 202;
        const py = 508;
        if (unlocked) {
            glow(ctx, px, py, 138, def.colors.aura, 0.16 + Math.sin(this.t * 2) * 0.03);
            drawCharacterPortrait(ctx, def, px, py, 190, this.t, false);
        }
        else {
            glow(ctx, px, py, 130, '#5b6072', 0.08);
            drawCharacterSilhouette(ctx, this.selectedId, px, py + 86, 1.25, '#141620');
            label(ctx, 'SELADO', px, py + 118, 13, 'rgba(170,178,200,0.4)', {
                align: 'center',
                font: FONTS.mono,
                spacing: 3,
            });
        }
        // Identidade.
        label(ctx, def.name.toUpperCase(), 312, 420, 33, unlocked ? '#f2f5ff' : 'rgba(200,206,224,0.45)', {
            weight: 800,
            spacing: 2,
            glow: unlocked ? hexToRgba(accent, 0.3) : undefined,
        });
        label(ctx, `${def.epithet.toUpperCase()} · ${def.gender.toUpperCase()}`, 313, 442, 10, unlocked ? hexToRgba(accent, 0.9) : 'rgba(170,178,200,0.3)', {
            font: FONTS.mono,
            spacing: 1,
        });
        label(ctx, def.origin, 313, 464, 12, 'rgba(215,221,238,0.72)');
        label(ctx, `${def.combat} · ${def.style}`, 313, 482, 11, 'rgba(170,178,200,0.55)');
        if (unlocked) {
            label(ctx, `HABILIDADE · ${def.ability.name.toUpperCase()}`, 313, 514, 9.5, hexToRgba(accent, 0.95), {
                font: FONTS.mono,
                spacing: 1.2,
            });
            wrapped(ctx, def.ability.desc, 313, 532, 360, 15, 11.5, 'rgba(205,212,230,0.68)', 3);
            label(ctx, def.ability.hint, 313, 588, 10, 'rgba(255,255,255,0.45)', { font: FONTS.mono });
            label(ctx, `PASSIVA · ${def.passive.name.toUpperCase()}`, 313, 610, 9.5, '#ffe6a3', {
                font: FONTS.mono,
                spacing: 1.2,
            });
            wrapped(ctx, def.passive.desc, 313, 625, 360, 13, 10.5, 'rgba(205,212,230,0.58)', 1);
        }
        else {
            label(ctx, 'MEMÓRIA AINDA NÃO DESPERTA', 313, 516, 11, 'rgba(170,178,200,0.4)', { font: FONTS.mono, spacing: 1 });
            wrapped(ctx, `Conclua a Fase ${ROMAN[def.stage - 1]} para desbloquear ${def.name}.`, 313, 542, 360, 18, 14, 'rgba(215,221,238,0.65)', 2);
            label(ctx, `“${def.lore[0]}”`, 313, 590, 11.5, 'rgba(205,212,230,0.4)', { font: FONTS.ui });
        }
        // Atributos.
        const statX = 712;
        const statW = 280;
        label(ctx, 'ATRIBUTOS', statX, 420, 9.5, 'rgba(255,230,163,0.75)', { font: FONTS.mono, spacing: 1.6 });
        const stats = [
            ['VIDA', def.maxHp / 160, '#ff6a7a'],
            ['VELOCIDADE', def.speed / 290, '#56e3ff'],
            ['IMPULSO', def.jump / 650, '#b48bff'],
            ['PESO', def.weight / 1.6, '#ffae5a'],
        ];
        stats.forEach(([name, value, color], i) => {
            const y = 440 + i * 24;
            label(ctx, name, statX, y + 8, 9, 'rgba(190,198,220,0.55)', { font: FONTS.mono, spacing: 0.9 });
            bar(ctx, statX + 90, y, statW - 90, 7, clamp(value, 0, 1), color, 'rgba(255,255,255,0.06)');
            label(ctx, `${Math.round(clamp(value, 0, 1) * 100)}`, statX + statW, y + 8, 9, hexToRgba(color, 0.75), {
                align: 'right',
                font: FONTS.mono,
            });
        });
        // Estilo de combate / chefe.
        const boss = BOSSES[stage.boss];
        label(ctx, 'CHEFE DA FASE', statX, 554, 9, hexToRgba(stage.palette.accent, 0.75), { font: FONTS.mono, spacing: 1.4 });
        wrapped(ctx, `${boss.name} — ${boss.title}`, statX, 572, 286, 14, 11.5, 'rgba(230,234,245,0.7)', 2);
        label(ctx, `DIFICULDADE ${'◆'.repeat(Math.round(stage.difficulty * 3))}`, statX, 612, 9, 'rgba(170,178,200,0.45)', {
            font: FONTS.mono,
            spacing: 0.8,
        });
        // Botão iniciar.
        this.startRect = { x: 1020, y: 520, w: 156, h: 58 };
        const canStart = unlocked;
        ctx.save();
        if (canStart) {
            const g = ctx.createLinearGradient(1020, 520, 1176, 578);
            g.addColorStop(0, hexToRgba(accent, 0.85));
            g.addColorStop(1, hexToRgba(accent, 0.35));
            ctx.fillStyle = g;
            ctx.shadowColor = hexToRgba(accent, 0.7);
            ctx.shadowBlur = 20;
        }
        else {
            ctx.fillStyle = 'rgba(90,96,116,0.25)';
        }
        roundRectPath(ctx, 1020, 520, 156, 58, 4);
        ctx.fill();
        ctx.restore();
        label(ctx, 'INICIAR', 1098, 548, 18, canStart ? '#0b0910' : 'rgba(180,188,208,0.4)', {
            align: 'center',
            weight: 800,
            spacing: 2.4,
        });
        label(ctx, 'ENTER', 1098, 566, 8.5, canStart ? 'rgba(10,8,14,0.65)' : 'rgba(180,188,208,0.25)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.5,
        });
        // Voltar.
        this.backRect = { x: 1020, y: 596, w: 156, h: 30 };
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 1;
        roundRectPath(ctx, 1020, 596, 156, 30, 3);
        ctx.stroke();
        ctx.restore();
        label(ctx, 'VOLTAR · ESC', 1098, 616, 9.5, 'rgba(190,198,220,0.55)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.2,
        });
        // Rodapé.
        label(ctx, '← → DESPERTOS   ↑ ↓ FASE   ENTER INICIAR   ESC VOLTAR', 82, 688, 10, 'rgba(190,198,220,0.42)', {
            font: FONTS.mono,
            spacing: 1.2,
        });
        label(ctx, `${this.game.save.unlocked.length} / 6 DESPERTOS DESPERTOS`, width - 82, 688, 9.5, 'rgba(160,168,190,0.35)', {
            align: 'right',
            font: FONTS.mono,
            spacing: 1,
        });
        // Selo de seleção.
        if (!unlocked) {
            label(ctx, 'CONCLUA A FASE ANTERIOR PARA DESPERTAR ESTE HERÓI', 82, 662, 9.5, 'rgba(255,106,122,0.5)', {
                font: FONTS.mono,
                spacing: 1,
            });
        }
    }
}
//# sourceMappingURL=characterSelect.js.map