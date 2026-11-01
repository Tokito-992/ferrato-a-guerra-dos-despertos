/** Configurações: layout dos controles de toque, dock, áudio e tutorial. */
import { hexToRgba } from '../core/math.js?v=c5d0d69737a2';
import { drawTitleBackground } from '../render/backgrounds.js?v=c5d0d69737a2';
import { drawCharacterSilhouette } from '../render/characters.js?v=c5d0d69737a2';
import { FONTS, label, panel, roundRectPath } from '../render/theme.js?v=c5d0d69737a2';
import { Menu } from '../ui/menu.js?v=c5d0d69737a2';
import { needsIOSInstallGuide } from '../core/platform.js?v=c5d0d69737a2';
export class SettingsScene {
    constructor(game) {
        this.game = game;
        this.t = 0;
        this.editing = false;
        this.editorBar = null;
        this.menu = new Menu([]);
        this.buildMenu();
    }
    enter() {
        this.game.audio.playMusic(35);
        this.game.audio.playAmbience('cosmic');
        this.buildMenu();
    }
    exit() {
        this.removeEditorBar();
        if (this.editing) {
            this.editing = false;
            this.game.endTouchEdit();
        }
    }
    sideDetail() {
        return this.game.save.touchLayout === 'lefty'
            ? 'CANHOTO · MOVER À DIREITA'
            : 'PADRÃO · MOVER À ESQUERDA';
    }
    dockDetail() {
        return this.game.save.touchDock === 'top' ? 'SUPERIOR' : 'INFERIOR';
    }
    buildMenu(keepIndex = false) {
        const items = [
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
                id: 'customize',
                label: 'POSIÇÃO DOS BOTÕES',
                detail: this.game.save.touchPositions ? 'PERSONALIZADA' : 'ARRASTE OS BOTÕES',
                accent: '#56e3ff',
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
        ];
        if (needsIOSInstallGuide()) {
            items.push({
                id: 'ios-fullscreen',
                label: 'TELA CHEIA NO IPHONE',
                detail: 'INSTALAR NA TELA DE INÍCIO',
                accent: '#ff8a3d',
            });
        }
        items.push({ id: 'back', label: 'VOLTAR', detail: 'MENU PRINCIPAL', accent: '#ff6a7a' });
        this.menu.setItems(items, keepIndex);
    }
    cycle(id) {
        const save = this.game.save;
        switch (id) {
            case 'side':
            case 'dock': {
                // Os presets são pontos de partida: escolher um deles descarta o layout livre.
                if (save.touchPositions) {
                    save.touchPositions = null;
                    this.game.setNotice('PRESET APLICADO — POSIÇÕES LIVRES REDEFINIDAS', '#ffd166');
                }
                if (id === 'side') {
                    save.touchLayout = save.touchLayout === 'lefty' ? 'standard' : 'lefty';
                }
                else {
                    save.touchDock = save.touchDock === 'top' ? 'bottom' : 'top';
                }
                this.game.applyTouchSettings();
                break;
            }
            case 'customize':
                this.startEditing();
                return;
            case 'audio': {
                const muted = this.game.audio.toggleMuted();
                save.muted = muted;
                break;
            }
            case 'tutorial':
                this.game.gotoTutorial(() => this.game.gotoSettings());
                return;
            case 'ios-fullscreen':
                this.game.openIOSInstallGuide();
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
    startEditing() {
        if (this.editing)
            return;
        this.editing = true;
        this.game.beginTouchEdit();
        const bar = document.createElement('div');
        bar.id = 'touch-editor-bar';
        bar.append(this.makeEditorButton('CONCLUIR', 'done', () => this.finishEditing()), this.makeEditorButton('RESTAURAR PADRÃO', 'reset', () => this.resetEditing()));
        (document.getElementById('frame') ?? document.body).append(bar);
        this.editorBar = bar;
        this.game.audio.sfx('confirm');
    }
    makeEditorButton(label, action, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'touch-editor-btn';
        button.dataset.action = action;
        button.textContent = label;
        button.addEventListener('click', onClick);
        button.addEventListener('pointerdown', (event) => event.stopPropagation());
        return button;
    }
    removeEditorBar() {
        this.editorBar?.remove();
        this.editorBar = null;
    }
    finishEditing() {
        if (!this.editing)
            return;
        this.editing = false;
        this.game.endTouchEdit();
        this.removeEditorBar();
        this.buildMenu(true);
        this.game.audio.sfx('ui');
    }
    resetEditing() {
        if (!this.editing)
            return;
        this.game.resetTouchPositions();
        this.finishEditing();
        this.game.setNotice('CONTROLES RESTAURADOS AO PADRÃO', '#56e3ff');
    }
    update(dt) {
        this.t += dt;
        const input = this.game.input;
        if (this.editing) {
            if (input.pressed('back') || input.pressed('pause'))
                this.finishEditing();
            return;
        }
        if (input.pressed('back') || input.pressed('pause')) {
            this.game.audio.sfx('ui');
            this.game.gotoTitle();
            return;
        }
        if (input.pressed('left') || input.pressed('right')) {
            const id = this.menu.selected?.id;
            if (id === 'side' || id === 'dock' || id === 'audio')
                this.cycle(id);
            return;
        }
        const action = this.menu.update(input, this.game.audio);
        if (action)
            this.cycle(action);
    }
    draw(ctx) {
        if (this.editing) {
            this.drawEditor(ctx);
            return;
        }
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
        const hasIOSGuide = needsIOSInstallGuide();
        this.menu.draw(ctx, 90, 198, 520, {
            itemHeight: hasIOSGuide ? 46 : 52,
            gap: hasIOSGuide ? 7 : 8,
            size: hasIOSGuide ? 16 : 17,
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
    drawEditor(ctx) {
        const { width, height } = this.game;
        drawTitleBackground(ctx, this.t);
        const shade = ctx.createLinearGradient(0, 0, 0, height);
        shade.addColorStop(0, 'rgba(4,5,10,0.9)');
        shade.addColorStop(0.55, 'rgba(4,5,10,0.72)');
        shade.addColorStop(1, 'rgba(4,5,10,0.92)');
        ctx.fillStyle = shade;
        ctx.fillRect(0, 0, width, height);
        // Grade sutil para perceber a área livre de posicionamento.
        ctx.save();
        ctx.strokeStyle = 'rgba(86,227,255,0.08)';
        ctx.lineWidth = 1;
        for (let gx = 80; gx < width; gx += 80) {
            ctx.beginPath();
            ctx.moveTo(gx, 150);
            ctx.lineTo(gx, height - 60);
            ctx.stroke();
        }
        for (let gy = 160; gy < height - 60; gy += 80) {
            ctx.beginPath();
            ctx.moveTo(70, gy);
            ctx.lineTo(width - 70, gy);
            ctx.stroke();
        }
        ctx.restore();
        const ax = 80;
        const ay = 224;
        const aw = width - 160;
        const ah = 350;
        const arena = ctx.createLinearGradient(ax, ay, ax, ay + ah);
        arena.addColorStop(0, 'rgba(72,26,38,0.42)');
        arena.addColorStop(1, 'rgba(8,8,18,0.78)');
        ctx.fillStyle = arena;
        ctx.fillRect(ax, ay, aw, ah);
        ctx.save();
        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = 'rgba(86,227,255,0.35)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(ax, ay, aw, ah);
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,138,60,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ax + 18, ay + ah - 30);
        ctx.lineTo(ax + aw - 18, ay + ah - 30);
        ctx.stroke();
        ctx.save();
        ctx.globalAlpha = 0.72;
        drawCharacterSilhouette(ctx, 'ravi', ax + aw * 0.42, ay + ah - 36, 0.82, '#ff8a3d');
        ctx.globalAlpha = 0.36;
        drawCharacterSilhouette(ctx, 'ozric', ax + aw * 0.68, ay + ah - 36, 0.76, '#b48bff');
        ctx.restore();
        label(ctx, 'PERSONALIZAR CONTROLES', 80, 98, 38, '#f4f7ff', {
            weight: 800,
            spacing: 5,
            glow: 'rgba(86,227,255,0.42)',
        });
        label(ctx, 'ARRASTE CADA BOTÃO PARA ONDE FOR MAIS CONFORTÁVEL', 82, 126, 10.5, 'rgba(86,227,255,0.78)', {
            font: FONTS.mono,
            spacing: 1.7,
        });
        label(ctx, 'SALVO NESTE DISPOSITIVO', width - 80, 126, 9.5, 'rgba(190,198,220,0.5)', {
            align: 'right',
            font: FONTS.mono,
            spacing: 1.1,
        });
        label(ctx, 'TOQUE E ARRASTE · SOLTE PARA SALVAR', 82, 168, 10, 'rgba(255,209,102,0.72)', {
            font: FONTS.mono,
            spacing: 1.2,
        });
        label(ctx, 'USE CONCLUIR OU RESTAURAR PADRÃO NO TOPO', width - 80, 168, 9.5, 'rgba(190,198,220,0.46)', {
            align: 'right',
            font: FONTS.mono,
            spacing: 1.1,
        });
        label(ctx, 'ÁREA DE JOGO', ax + aw / 2, ay + 20, 9, 'rgba(255,255,255,0.32)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.8,
        });
    }
    drawPreview(ctx, x, y, w, h) {
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
        const modeLabel = this.game.save.touchPositions
            ? 'PERSONALIZADO'
            : this.game.save.touchLayout === 'lefty'
                ? 'CANHOTO'
                : 'PADRÃO';
        label(ctx, modeLabel, x + w - 22, y + 28, 9, 'rgba(255,255,255,0.55)', {
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
        if (this.game.save.touchPositions) {
            this.drawCustomPreview(ctx, x, y, w, h, fx, fy, fw, fh);
            return;
        }
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
        const actionIcons = [
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
        label(ctx, 'Lado e dock são presets de partida.', x + w / 2, y + 326, 10, 'rgba(190,198,220,0.45)', {
            align: 'center',
            font: FONTS.ui,
        });
        label(ctx, 'Use “POSIÇÃO DOS BOTÕES” para arrastar cada um.', x + w / 2, y + 350, 9.5, 'rgba(255,209,102,0.6)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 0.8,
        });
    }
    drawCustomPreview(ctx, x, y, w, h, fx, fy, fw, fh) {
        const arena = ctx.createLinearGradient(fx, fy, fx, fy + fh);
        arena.addColorStop(0, 'rgba(72,26,38,0.9)');
        arena.addColorStop(1, 'rgba(8,8,18,0.96)');
        ctx.fillStyle = arena;
        ctx.fillRect(fx + 2, fy + 2, fw - 4, fh - 4);
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(86,227,255,0.34)';
        ctx.lineWidth = 1;
        ctx.strokeRect(fx + 2, fy + 2, fw - 4, fh - 4);
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,138,60,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fx + 10, fy + fh - 24);
        ctx.lineTo(fx + fw - 10, fy + fh - 24);
        ctx.stroke();
        ctx.save();
        ctx.globalAlpha = 0.8;
        drawCharacterSilhouette(ctx, 'ravi', fx + fw * 0.42, fy + fh - 30, 0.62, '#ff8a3d');
        ctx.globalAlpha = 0.42;
        drawCharacterSilhouette(ctx, 'ozric', fx + fw * 0.7, fy + fh - 30, 0.58, '#b48bff');
        ctx.restore();
        const icons = {
            left: ['◀', '#56e3ff', 8],
            right: ['▶', '#56e3ff', 8],
            jump: ['⤒', '#ffd166', 7],
            attack: ['⚔', '#ff7a3c', 7],
            heavy: ['✹', '#ff7a3c', 7],
            dash: ['»', '#ff7a3c', 7],
            ability: ['✦', '#56e3ff', 8],
            pause: ['Ⅱ', 'rgba(255,255,255,0.55)', 6],
            fullscreen: ['⛶', 'rgba(255,255,255,0.55)', 6],
        };
        for (const [id, point] of Object.entries(this.game.save.touchPositions ?? {})) {
            const spec = icons[id];
            if (!spec)
                continue;
            this.circle(ctx, fx + point.x * fw, fy + point.y * fh, spec[2], spec[0], spec[1]);
        }
        label(ctx, 'POSIÇÕES PERSONALIZADAS', x + w / 2, y + 300, 9, 'rgba(86,227,255,0.75)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 1.4,
        });
        label(ctx, 'Arraste em “POSIÇÃO DOS BOTÕES”.', x + w / 2, y + 326, 10, 'rgba(190,198,220,0.5)', {
            align: 'center',
            font: FONTS.ui,
        });
        label(ctx, 'Alterar lado/dock restaura o preset.', x + w / 2, y + 350, 9.5, 'rgba(255,209,102,0.6)', {
            align: 'center',
            font: FONTS.mono,
            spacing: 0.8,
        });
    }
    circle(ctx, x, y, r, icon, color) {
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
//# sourceMappingURL=settings.js.map