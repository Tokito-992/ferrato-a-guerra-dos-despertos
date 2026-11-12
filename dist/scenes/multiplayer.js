/**
 * Lobby de multijogador: co-op local para dois jogadores.
 *
 * A party escolhe um capítulo liberado, o P1 assume o herói daquele capítulo e
 * o P2 escolhe entre os Despertos já desbloqueados. O segundo controle é
 * obrigatório para iniciar. A sala privada online fica sinalizada como próxima
 * etapa, sem prometer uma conexão que ainda não existe.
 */
import { TITLE_THEME_INDEX } from '../core/audio.js?v=876088114997';
import { CHARACTER_ORDER, CHARACTERS } from '../data/characters.js?v=876088114997';
import { BOSSES } from '../data/bosses.js?v=876088114997';
import { getStage, MAX_STAGE } from '../data/stages.js?v=876088114997';
import { clamp, easeOutCubic, hexToRgba } from '../core/math.js?v=876088114997';
import { drawTitleBackground } from '../render/backgrounds.js?v=876088114997';
import { drawCharacterPortrait } from '../render/characters.js?v=876088114997';
import { FONTS, label, panel, roundRectPath } from '../render/theme.js?v=876088114997';
import { Menu } from '../ui/menu.js?v=876088114997';
function fitText(ctx, text, maxW, size) {
    ctx.save();
    ctx.font = `600 ${size}px ${FONTS.ui}`;
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
function wrapped(ctx, text, x, y, maxW, lineH, size, color, maxLines = 2) {
    ctx.save();
    ctx.font = `500 ${size}px ${FONTS.ui}`;
    const words = text.split(/\s+/);
    let line = '';
    let ly = y;
    let lines = 0;
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxW && line) {
            label(ctx, line, x, ly, size, color, { weight: 500 });
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
        label(ctx, line, x, ly, size, color, { weight: 500 });
        ly += lineH;
    }
    ctx.restore();
    return ly;
}
export class MultiplayerScene {
    constructor(game) {
        this.game = game;
        this.partnerIndex = 0;
        this.t = 0;
        this.intro = 0;
        this.lastP2 = false;
        const max = clamp(game.save.maxStage, 1, MAX_STAGE);
        this.stageOptions = Array.from({ length: max }, (_, index) => index + 1);
        this.chapterIndex = this.stageOptions.length - 1;
        const unlocked = CHARACTER_ORDER.filter((id) => game.save.unlocked.includes(id));
        this.partnerOptions = unlocked.length > 0 ? unlocked : [CHARACTER_ORDER[0]];
        const hero = getStage(this.stageOptions[this.chapterIndex]).character;
        const preferred = this.partnerOptions.find((id) => id !== hero) ?? this.partnerOptions[0];
        this.partnerIndex = Math.max(0, this.partnerOptions.indexOf(preferred));
        this.menu = new Menu([]);
        this.syncMenu(false);
    }
    get stage() {
        return getStage(this.stageOptions[this.chapterIndex]);
    }
    get partnerId() {
        return this.partnerOptions[this.partnerIndex];
    }
    get canStart() {
        return this.game.input.gamepadConnected(1);
    }
    enter() {
        this.game.audio.playMusic(TITLE_THEME_INDEX);
        this.game.audio.playAmbience('cosmic');
        this.intro = 0;
        this.lastP2 = this.canStart;
        this.syncMenu();
    }
    syncMenu(keepIndex = true) {
        const stage = this.stage;
        const partner = CHARACTERS[this.partnerId];
        const ready = this.canStart;
        const items = [
            {
                id: 'chapter',
                badge: 'CAP',
                label: `CAPÍTULO ${String(stage.id).padStart(2, '0')}`,
                detail: `◀ ${this.chapterIndex + 1}/${this.stageOptions.length} ▶`,
                accent: stage.palette.accent,
                height: 48,
            },
            {
                id: 'partner',
                badge: 'P2',
                label: partner.name.toUpperCase(),
                detail: `◀ ${partner.epithet.toUpperCase()} ▶`,
                accent: partner.colors.accent,
                height: 48,
            },
            {
                id: 'start',
                badge: '▶',
                label: 'INICIAR CO-OP LOCAL',
                detail: ready ? '2º CONTROLE PRONTO' : undefined,
                disabled: !ready,
                disabledTag: 'SEM CONTROLE',
                accent: '#8df4a8',
                height: 54,
            },
            {
                id: 'online',
                badge: 'ON',
                label: 'SALA PRIVADA ONLINE',
                disabled: true,
                disabledTag: 'EM BREVE',
                accent: '#56e3ff',
                height: 42,
            },
            {
                id: 'back',
                badge: 'ESC',
                label: 'VOLTAR AO TÍTULO',
                accent: '#9aa3b8',
                minor: true,
                height: 30,
            },
        ];
        this.menu.setItems(items, keepIndex);
    }
    cycleChapter(dir) {
        if (this.stageOptions.length <= 1)
            return;
        this.chapterIndex =
            (this.chapterIndex + dir + this.stageOptions.length) % this.stageOptions.length;
        this.game.audio.sfx('select');
        this.syncMenu();
    }
    cyclePartner(dir) {
        if (this.partnerOptions.length <= 1)
            return;
        this.partnerIndex =
            (this.partnerIndex + dir + this.partnerOptions.length) % this.partnerOptions.length;
        this.game.audio.sfx('select');
        this.syncMenu();
    }
    start() {
        if (!this.canStart) {
            this.game.audio.sfx('ui');
            this.game.setNotice('CONECTE UM SEGUNDO CONTROLE PARA JOGAR EM CO-OP', '#ff6a9a');
            return;
        }
        const stageId = this.stage.id;
        const p1 = this.stage.character;
        const p2 = this.partnerId;
        this.game.audio.sfx('confirm');
        this.game.transitionTo(() => this.game.showCoopGameplay(stageId, p1, p2));
    }
    update(dt) {
        this.t += dt;
        this.intro = Math.min(1, this.intro + dt / 0.55);
        const ready = this.canStart;
        if (ready !== this.lastP2) {
            this.lastP2 = ready;
            this.syncMenu();
        }
        if (this.game.input.pressed('pause') || this.game.input.pressed('back') || this.game.input.pressed('cancel')) {
            this.game.gotoTitle();
            return;
        }
        if (this.game.input.pressed('cancel', 1)) {
            this.game.gotoTitle();
            return;
        }
        const selected = this.menu.selected?.id;
        if (selected === 'chapter') {
            if (this.game.input.pressed('left'))
                this.cycleChapter(-1);
            if (this.game.input.pressed('right'))
                this.cycleChapter(1);
        }
        else if (selected === 'partner') {
            if (this.game.input.pressed('left'))
                this.cyclePartner(-1);
            if (this.game.input.pressed('right'))
                this.cyclePartner(1);
        }
        if (ready &&
            (this.game.input.pressed('confirm', 1) ||
                this.game.input.pressed('attack', 1) ||
                this.game.input.pressed('jump', 1))) {
            this.start();
            return;
        }
        const action = this.menu.update(this.game.input, this.game.audio);
        if (!action)
            return;
        switch (action) {
            case 'chapter':
                this.cycleChapter(1);
                break;
            case 'partner':
                this.cyclePartner(1);
                break;
            case 'start':
                this.start();
                break;
            case 'back':
                this.game.gotoTitle();
                break;
        }
    }
    draw(ctx) {
        const { width, height } = this.game;
        const stage = this.stage;
        const accent = stage.palette.accent;
        const p1Def = CHARACTERS[stage.character];
        const p2Def = CHARACTERS[this.partnerId];
        const boss = stage.boss ? BOSSES[stage.boss] : null;
        drawTitleBackground(ctx, this.t);
        ctx.fillStyle = 'rgba(4,5,10,0.7)';
        ctx.fillRect(0, 0, width, height);
        const ease = easeOutCubic(clamp(this.intro, 0, 1));
        ctx.save();
        ctx.globalAlpha = ease;
        ctx.translate(0, (1 - ease) * 12);
        // ------------------------------------------------------------ cabeçalho
        label(ctx, 'MULTIJOGADOR', 80, 86, 46, '#f2f5ff', {
            weight: 800,
            spacing: 4.5,
            glow: hexToRgba(accent, 0.5),
            outline: 'rgba(0,0,0,0.45)',
            outlineWidth: 3,
        });
        label(ctx, 'CO-OP LOCAL · A CAMPANHA É MELHOR A DOIS', 82, 108, 11, hexToRgba(accent, 0.9), {
            font: FONTS.mono,
            spacing: 1.8,
        });
        label(ctx, `CAPÍTULOS LIBERADOS ${this.stageOptions.length} / ${MAX_STAGE}`, width - 80, 88, 10, 'rgba(210,218,236,0.6)', { align: 'right', font: FONTS.mono, spacing: 1.2 });
        ctx.strokeStyle = hexToRgba(accent, 0.2);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(80, 126);
        ctx.lineTo(width - 80, 126);
        ctx.stroke();
        // ------------------------------------------------------ painel do capítulo
        panel(ctx, 80, 150, 560, 474, {
            fill: 'rgba(5,8,16,0.72)',
            border: hexToRgba(accent, 0.3),
            glow: hexToRgba(accent, 0.14),
            cut: 16,
        });
        ctx.fillStyle = hexToRgba(accent, 0.9);
        ctx.fillRect(80, 150, 3, 474);
        label(ctx, 'CAPÍTULO SELECIONADO', 104, 180, 9, hexToRgba(accent, 0.8), {
            font: FONTS.mono,
            spacing: 1.6,
        });
        label(ctx, `CAP. ${String(stage.id).padStart(2, '0')}`, 104, 218, 27, accent, {
            font: FONTS.mono,
            weight: 800,
            spacing: 1.4,
        });
        label(ctx, fitText(ctx, stage.subtitle.toUpperCase(), 500, 26), 104, 254, 26, '#f2f5ff', {
            weight: 800,
            spacing: 1.4,
        });
        label(ctx, fitText(ctx, stage.name.toUpperCase(), 500, 11), 104, 276, 11, 'rgba(210,218,236,0.68)', {
            font: FONTS.mono,
            spacing: 0.9,
        });
        label(ctx, fitText(ctx, stage.location.toUpperCase(), 500, 10), 104, 296, 10, hexToRgba(accent, 0.7), {
            font: FONTS.mono,
            spacing: 0.8,
        });
        label(ctx, boss ? `CHEFE · ${boss.name.toUpperCase()}` : `ELITE · ${stage.eliteName.toUpperCase()}`, 104, 324, 10.5, boss ? hexToRgba(boss.colors.accent, 0.95) : 'rgba(255,230,163,0.85)', { font: FONTS.mono, spacing: 0.9 });
        const difficulty = clamp(Math.round(stage.difficulty * 3), 1, 9);
        label(ctx, `DIFICULDADE ${'◆'.repeat(difficulty)}`, 616, 324, 9, 'rgba(190,198,220,0.6)', {
            align: 'right',
            font: FONTS.mono,
            spacing: 0.6,
        });
        wrapped(ctx, stage.synopsis, 104, 350, 492, 17, 12, 'rgba(220,226,242,0.68)', 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.moveTo(104, 390);
        ctx.lineTo(616, 390);
        ctx.stroke();
        label(ctx, 'FORMEM A PARTY', 104, 414, 9, 'rgba(190,198,220,0.58)', {
            font: FONTS.mono,
            spacing: 1.5,
        });
        label(ctx, '◀ ▶ ALTERAM A SELEÇÃO', 616, 414, 8.5, 'rgba(170,178,200,0.42)', {
            align: 'right',
            font: FONTS.mono,
            spacing: 1,
        });
        this.drawPartyCard(ctx, 104, 428, 246, 178, 'P1', p1Def, 'HERÓI DO CAPÍTULO', true);
        this.drawPartyCard(ctx, 370, 428, 246, 178, 'P2', p2Def, this.canStart ? '2º CONTROLE CONECTADO' : '2º CONTROLE OFFLINE', this.canStart);
        // --------------------------------------------------------- painel de ação
        panel(ctx, 660, 150, 540, 474, {
            fill: 'rgba(5,8,16,0.72)',
            border: 'rgba(180,190,220,0.2)',
            glow: 'rgba(86,227,255,0.08)',
            cut: 16,
        });
        label(ctx, 'PAINEL DA PARTY', 684, 180, 9, 'rgba(190,198,220,0.58)', {
            font: FONTS.mono,
            spacing: 1.6,
        });
        wrapped(ctx, 'Duas pessoas, um Véu. A party divide corações, ondas e a câmera; cada herói mantém seu próprio ritmo de combate.', 684, 206, 492, 17, 12.5, 'rgba(225,230,245,0.76)', 2);
        this.menu.draw(ctx, 684, 250, 492, {
            itemHeight: 46,
            gap: 6,
            size: 16,
            accent: accent,
        });
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.moveTo(684, 520);
        ctx.lineTo(1176, 520);
        ctx.stroke();
        label(ctx, 'COMO FUNCIONA', 684, 542, 9, hexToRgba(accent, 0.7), {
            font: FONTS.mono,
            spacing: 1.5,
        });
        label(ctx, 'P1 usa teclado, mouse ou o 1º controle.', 684, 562, 11.5, 'rgba(215,222,238,0.68)', {
            weight: 500,
        });
        label(ctx, 'P2 usa o 2º controle — obrigatório para iniciar.', 684, 580, 11.5, 'rgba(215,222,238,0.68)', {
            weight: 500,
        });
        label(ctx, 'Corações e reanimação são compartilhados.', 684, 598, 11.5, 'rgba(215,222,238,0.68)', {
            weight: 500,
        });
        // Nota da próxima etapa: sala online por código.
        label(ctx, 'SALA ONLINE · EM BREVE', 684, 636, 9.5, hexToRgba('#56e3ff', 0.8), {
            font: FONTS.mono,
            spacing: 1.2,
        });
        label(ctx, 'CÓDIGO CURTO · CADA JOGADOR MANTÉM O PRÓPRIO SAVE', 1176, 636, 8.5, 'rgba(170,178,200,0.42)', {
            align: 'right',
            font: FONTS.mono,
            spacing: 0.8,
        });
        ctx.restore();
    }
    drawPartyCard(ctx, x, y, w, h, tag, def, status, online) {
        const accent = def.colors.accent;
        ctx.save();
        ctx.fillStyle = online ? hexToRgba(accent, 0.08) : 'rgba(255,255,255,0.025)';
        roundRectPath(ctx, x, y, w, h, 6);
        ctx.fill();
        ctx.strokeStyle = online ? hexToRgba(accent, 0.36) : 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        roundRectPath(ctx, x, y, w, h, 6);
        ctx.stroke();
        ctx.restore();
        label(ctx, tag, x + 14, y + 21, 11, online ? hexToRgba(accent, 0.95) : 'rgba(160,168,190,0.5)', {
            font: FONTS.mono,
            weight: 700,
            spacing: 1.2,
        });
        // Indicador de conexão.
        ctx.save();
        ctx.fillStyle = online ? '#8df4a8' : '#ff6a7a';
        ctx.beginPath();
        ctx.arc(x + w - 18, y + 17, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = online ? 1 : 0.55;
        drawCharacterPortrait(ctx, def, x + 58, y + 92, 92, this.t, false);
        ctx.restore();
        const textX = x + 112;
        label(ctx, def.name.toUpperCase(), textX, y + 66, 18, online ? '#f2f5ff' : 'rgba(200,208,228,0.55)', {
            weight: 800,
            spacing: 1.4,
        });
        label(ctx, def.epithet.toUpperCase(), textX, y + 82, 8.5, hexToRgba(accent, online ? 0.85 : 0.35), {
            font: FONTS.mono,
            spacing: 0.9,
        });
        ctx.strokeStyle = online ? hexToRgba(accent, 0.22) : 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(textX, y + 92);
        ctx.lineTo(x + w - 14, y + 92);
        ctx.stroke();
        label(ctx, def.combat.toUpperCase(), textX, y + 110, 8.5, 'rgba(200,208,228,0.62)', {
            font: FONTS.mono,
            spacing: 0.6,
        });
        label(ctx, def.ability.name.toUpperCase(), textX, y + 128, 8.5, hexToRgba(accent, online ? 0.82 : 0.3), {
            font: FONTS.mono,
            spacing: 0.6,
        });
        label(ctx, status, textX, y + 154, 8, online ? 'rgba(141,244,168,0.82)' : 'rgba(255,106,122,0.72)', {
            font: FONTS.mono,
            spacing: 0.6,
        });
    }
}
//# sourceMappingURL=multiplayer.js.map