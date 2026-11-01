/** Núcleo do jogo: loop, troca de cenas, transições, hitstop e persistência. */
import { CHARACTERS } from '../data/characters.js?v=ab11b465bc0a';
import { getStage, MAX_STAGE } from '../data/stages.js?v=ab11b465bc0a';
import { STORY } from '../data/story.js?v=ab11b465bc0a';
import { AudioEngine } from './audio.js?v=ab11b465bc0a';
import { Input } from './input.js?v=ab11b465bc0a';
import { ParticleSystem } from './particles.js?v=ab11b465bc0a';
import { loadSave, writeSave, TOUCH_BUTTON_IDS } from './save.js?v=ab11b465bc0a';
import { canFullscreen, toggleFullscreen } from './fullscreen.js?v=ab11b465bc0a';
import { clamp, hexToRgba } from './math.js?v=ab11b465bc0a';
import { FONTS, label, panel, roundRectPath } from '../render/theme.js?v=ab11b465bc0a';
import { TitleScene } from '../scenes/title.js?v=ab11b465bc0a';
import { CharacterSelectScene } from '../scenes/characterSelect.js?v=ab11b465bc0a';
import { GameplayScene } from '../scenes/gameplay.js?v=ab11b465bc0a';
import { StoryScene } from '../scenes/story.js?v=ab11b465bc0a';
import { VictoryScene } from '../scenes/victory.js?v=ab11b465bc0a';
import { CreditsScene } from '../scenes/credits.js?v=ab11b465bc0a';
import { SettingsScene } from '../scenes/settings.js?v=ab11b465bc0a';
import { TutorialScene } from '../scenes/tutorial.js?v=ab11b465bc0a';
/** Posições normalizadas usadas quando não há layout livre salvo. */
function presetTouchPositions(layout, dock) {
    const y = dock === 'top' ? 0.1 : 0.9;
    if (layout === 'lefty') {
        return {
            left: { x: 0.86, y },
            right: { x: 0.94, y },
            jump: { x: 0.06, y },
            attack: { x: 0.14, y },
            heavy: { x: 0.22, y },
            dash: { x: 0.3, y },
            ability: { x: 0.38, y },
            pause: { x: 0.48, y },
            fullscreen: { x: 0.54, y },
        };
    }
    return {
        left: { x: 0.06, y },
        right: { x: 0.14, y },
        jump: { x: 0.62, y },
        attack: { x: 0.7, y },
        heavy: { x: 0.78, y },
        dash: { x: 0.86, y },
        ability: { x: 0.94, y },
        pause: { x: 0.48, y },
        fullscreen: { x: 0.54, y },
    };
}
export class Game {
    constructor(canvas) {
        this.width = 1280;
        this.height = 720;
        this.time = 0;
        this.sceneTime = 0;
        this.hitStopTimer = 0;
        this.slowTimer = 0;
        this.slowScale = 1;
        this.flashColor = '#ffffff';
        this.flashAlpha = 0;
        this.fade = {
            alpha: 0,
            phase: 0,
            duration: 0.32,
            color: '#04050a',
            callback: null,
        };
        this.notice = null;
        this.uiParticles = new ParticleSystem();
        this.lastTimestamp = 0;
        this.started = false;
        this.finishing = false;
        this.touchControls = null;
        this.touchButtons = new Map();
        this.touchEditing = false;
        this.touchEditPositions = {};
        this.handleTouchEditorDown = (event) => {
            if (!this.touchEditing)
                return;
            const target = event.target instanceof Element ? event.target.closest('.touch-btn') : null;
            if (!target)
                return;
            event.preventDefault();
            event.stopPropagation();
            this.dragTouchButton(target, event);
        };
        // ------------------------------------------------------------- loop
        this.frame = (timestamp) => {
            const raw = clamp((timestamp - this.lastTimestamp) / 1000, 0, 0.05);
            this.lastTimestamp = timestamp;
            this.time += raw;
            this.sceneTime += raw;
            this.update(raw);
            this.draw();
            this.input.endFrame();
            requestAnimationFrame(this.frame);
        };
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('Canvas 2D não disponível neste navegador.');
        this.ctx = ctx;
        this.audio = new AudioEngine();
        this.input = new Input(canvas);
        this.save = loadSave();
        this.audio.setMuted(this.save.muted);
        this.input.onFirstGesture = () => {
            this.audio.init();
            this.audio.setMuted(this.save.muted);
        };
        this.setupTouchControls();
        this.applyTouchSettings();
    }
    /** Aplica as preferências de layout dos controles de toque. */
    applyTouchSettings() {
        const custom = this.save.touchPositions;
        document.body.classList.toggle('touch-lefty', this.save.touchLayout === 'lefty');
        document.body.classList.toggle('touch-dock-top', this.save.touchDock === 'top');
        document.body.classList.toggle('touch-custom', Boolean(custom));
        if (custom) {
            this.applyTouchPositions(custom);
        }
        else {
            this.clearTouchPositions();
        }
    }
    /** Entra no modo de arrastar botões; as posições só são salvas ao soltar um botão. */
    beginTouchEdit() {
        if (this.touchEditing)
            return;
        this.touchEditing = true;
        document.body.classList.add('touch-edit');
        if (this.save.touchPositions) {
            const fallback = presetTouchPositions(this.save.touchLayout, this.save.touchDock);
            this.touchEditPositions = { ...fallback, ...this.save.touchPositions };
            document.body.classList.add('touch-custom');
            this.applyTouchPositions(this.touchEditPositions);
            return;
        }
        // Sem layout salvo: mostra o dock do preset, mede os centros reais e
        // converte para coordenadas livres antes de soltar os botões na tela.
        document.body.classList.remove('touch-custom');
        this.clearTouchPositions();
        this.touchEditPositions = this.capturePresetTouchPositions();
        document.body.classList.add('touch-custom');
        this.applyTouchPositions(this.touchEditPositions);
    }
    /** Sai do modo de edição mantendo o layout livre, se ele foi salvo. */
    endTouchEdit() {
        if (!this.touchEditing)
            return;
        this.touchEditing = false;
        document.body.classList.remove('touch-edit');
        if (this.save.touchPositions) {
            this.applyTouchSettings();
        }
        else {
            document.body.classList.remove('touch-custom');
            this.clearTouchPositions();
        }
    }
    /** Volta ao preset de lado/dock e apaga o layout livre. */
    resetTouchPositions() {
        this.save.touchPositions = null;
        this.touchEditPositions = {};
        this.persist();
        document.body.classList.remove('touch-custom');
        this.clearTouchPositions();
    }
    get isTouchDevice() {
        return this.input.touchMode;
    }
    /** Botões de toque independentes do canvas; aparecem em combate e no editor. */
    setupTouchControls() {
        if (this.input.touchMode)
            document.body.classList.add('touch-device');
        const wrap = document.createElement('div');
        wrap.id = 'touch-controls';
        wrap.setAttribute('aria-label', 'Controles de toque');
        const left = document.createElement('div');
        left.className = 'touch-cluster touch-cluster-left';
        const right = document.createElement('div');
        right.className = 'touch-cluster touch-cluster-right';
        const makeButton = (action, icon, extra = '', label = '', ariaLabel = '') => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `touch-btn${extra ? ` ${extra}` : ''}`;
            button.dataset.action = action;
            button.dataset.touchId = action;
            button.setAttribute('aria-label', ariaLabel || label || action);
            this.touchButtons.set(action, button);
            const iconEl = document.createElement('span');
            iconEl.className = 'touch-icon';
            iconEl.textContent = icon;
            iconEl.setAttribute('aria-hidden', 'true');
            button.append(iconEl);
            if (label) {
                const labelEl = document.createElement('span');
                labelEl.className = 'touch-label';
                labelEl.textContent = label;
                labelEl.setAttribute('aria-hidden', 'true');
                button.append(labelEl);
            }
            const press = (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (this.touchEditing)
                    return;
                this.input.setVirtual(action, true);
                try {
                    button.setPointerCapture(event.pointerId);
                }
                catch {
                    // Alguns navegadores móveis não expõem captura para todos os pointers.
                }
            };
            const release = (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (this.touchEditing)
                    return;
                this.input.setVirtual(action, false);
            };
            button.addEventListener('pointerdown', press, { passive: false });
            button.addEventListener('pointerup', release, { passive: false });
            button.addEventListener('pointercancel', release, { passive: false });
            button.addEventListener('lostpointercapture', release);
            button.addEventListener('contextmenu', (event) => event.preventDefault());
            return button;
        };
        left.append(makeButton('left', '◀', 'touch-move', '', 'Mover para a esquerda'), makeButton('right', '▶', 'touch-move', '', 'Mover para a direita'));
        right.append(makeButton('jump', '⤒', 'touch-jump', 'PULAR', 'Pular'), makeButton('attack', '⚔', 'touch-action', 'LEVE', 'Ataque leve'), makeButton('heavy', '✹', 'touch-action', 'PESADO', 'Ataque pesado'), makeButton('dash', '»', 'touch-action', 'DASH', 'Dash'), makeButton('ability', '✦', 'touch-ability', 'ESPECIAL', 'Habilidade especial'));
        const pause = document.createElement('div');
        pause.className = 'touch-cluster touch-cluster-pause';
        pause.append(makeButton('pause', 'Ⅱ', 'touch-pause', '', 'Pausa'));
        if (canFullscreen()) {
            const fullscreen = document.createElement('button');
            fullscreen.type = 'button';
            fullscreen.className = 'touch-btn touch-fullscreen';
            fullscreen.dataset.touchId = 'fullscreen';
            fullscreen.textContent = '⛶';
            fullscreen.setAttribute('aria-label', 'Tela cheia');
            fullscreen.title = 'Tela cheia';
            this.touchButtons.set('fullscreen', fullscreen);
            fullscreen.addEventListener('pointerdown', (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (this.touchEditing)
                    return;
                void toggleFullscreen();
            });
            fullscreen.addEventListener('contextmenu', (event) => event.preventDefault());
            pause.append(fullscreen);
        }
        wrap.append(left, right, pause);
        wrap.addEventListener('pointerdown', this.handleTouchEditorDown, { capture: true });
        (document.getElementById('frame') ?? document.body).appendChild(wrap);
        this.touchControls = wrap;
    }
    dragTouchButton(button, start) {
        const wrap = this.touchControls;
        const id = button.dataset.touchId;
        if (!wrap || !id)
            return;
        const overlay = wrap.getBoundingClientRect();
        if (overlay.width < 2 || overlay.height < 2)
            return;
        const rect = button.getBoundingClientRect();
        const offsetX = start.clientX - (rect.left + rect.width / 2);
        const offsetY = start.clientY - (rect.top + rect.height / 2);
        const halfW = button.offsetWidth / 2 / overlay.width;
        const halfH = button.offsetHeight / 2 / overlay.height;
        button.classList.add('touch-dragging');
        try {
            button.setPointerCapture(start.pointerId);
        }
        catch {
            // Sem captura de pointer, os listeners de window abaixo continuam valendo.
        }
        const move = (event) => {
            if (event.pointerId !== start.pointerId)
                return;
            event.preventDefault();
            const x = clamp((event.clientX - offsetX - overlay.left) / overlay.width, halfW + 0.004, 1 - halfW - 0.004);
            const y = clamp((event.clientY - offsetY - overlay.top) / overlay.height, halfH + 0.004, 1 - halfH - 0.004);
            this.touchEditPositions[id] = { x, y };
            button.style.left = `${x * 100}%`;
            button.style.top = `${y * 100}%`;
        };
        const finish = (event) => {
            if (event.pointerId !== start.pointerId)
                return;
            button.classList.remove('touch-dragging');
            window.removeEventListener('pointermove', move, true);
            window.removeEventListener('pointerup', finish, true);
            window.removeEventListener('pointercancel', finish, true);
            try {
                button.releasePointerCapture(start.pointerId);
            }
            catch {
                // Ignora navegadores sem captura.
            }
            this.save.touchPositions = { ...this.touchEditPositions };
            this.persist();
            this.audio.sfx('ui');
        };
        window.addEventListener('pointermove', move, { passive: false, capture: true });
        window.addEventListener('pointerup', finish, true);
        window.addEventListener('pointercancel', finish, true);
    }
    capturePresetTouchPositions() {
        const fallback = presetTouchPositions(this.save.touchLayout, this.save.touchDock);
        const frame = document.getElementById('frame');
        if (!frame)
            return fallback;
        // O dock pode estar voltando de um layout livre: desliga a transição de
        // transform para medir os centros reais, não um quadro intermediário.
        document.body.classList.add('touch-measuring');
        try {
            void frame.offsetWidth;
            // Mede a área que o overlay livre ocupará (frame menos safe areas).
            const probe = document.createElement('div');
            probe.style.position = 'absolute';
            probe.style.inset =
                'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
            probe.style.visibility = 'hidden';
            probe.style.pointerEvents = 'none';
            frame.append(probe);
            const bounds = probe.getBoundingClientRect();
            probe.remove();
            if (bounds.width < 2 || bounds.height < 2)
                return fallback;
            const positions = {};
            for (const id of TOUCH_BUTTON_IDS) {
                const button = this.touchButtons.get(id);
                if (!button)
                    continue;
                const rect = button.getBoundingClientRect();
                if (rect.width < 2 || rect.height < 2) {
                    const point = fallback[id];
                    if (point)
                        positions[id] = point;
                    continue;
                }
                positions[id] = {
                    x: clamp((rect.left + rect.width / 2 - bounds.left) / bounds.width, 0.01, 0.99),
                    y: clamp((rect.top + rect.height / 2 - bounds.top) / bounds.height, 0.01, 0.99),
                };
            }
            return positions;
        }
        finally {
            document.body.classList.remove('touch-measuring');
        }
    }
    applyTouchPositions(positions) {
        const fallback = presetTouchPositions(this.save.touchLayout, this.save.touchDock);
        for (const id of TOUCH_BUTTON_IDS) {
            const button = this.touchButtons.get(id);
            if (!button)
                continue;
            const point = positions[id] ?? fallback[id];
            if (!point)
                continue;
            button.style.left = `${(point.x * 100).toFixed(3)}%`;
            button.style.top = `${(point.y * 100).toFixed(3)}%`;
        }
    }
    clearTouchPositions() {
        for (const button of this.touchButtons.values()) {
            button.style.left = '';
            button.style.top = '';
        }
    }
    setTouchControlsVisible(visible) {
        if (!this.touchControls)
            return;
        document.body.classList.toggle('touch-gameplay', visible);
        if (!visible)
            this.input.releaseAllVirtual();
    }
    start() {
        if (this.started)
            return;
        this.started = true;
        this.showTitle();
        this.lastTimestamp = performance.now();
        requestAnimationFrame(this.frame);
    }
    // ------------------------------------------------------------- navegação
    gotoTitle() {
        this.transitionTo(() => this.showTitle());
    }
    showTitle() {
        this.setScene(new TitleScene(this));
    }
    gotoCharacterSelect(stageId, selected) {
        this.transitionTo(() => this.showCharacterSelect(stageId, selected));
    }
    showCharacterSelect(stageId, selected) {
        this.setScene(new CharacterSelectScene(this, stageId, selected));
    }
    /** Inicia um capítulo (com cutscene de abertura, se houver). */
    startStage(stageId, charId, skipStory = false) {
        const stage = getStage(stageId);
        // Cada arco pertence ao seu Desperto: a narrativa e as habilidades contam a
        // mesma história. O parâmetro fica por compatibilidade com chamadas antigas.
        const requested = (charId in CHARACTERS ? charId : stage.character);
        const id = requested === stage.character ? requested : stage.character;
        this.save.selected = id;
        this.finishing = false;
        this.transitionTo(() => {
            const go = () => this.showGameplay(stage.id, id);
            const intro = STORY[stage.id]?.intro;
            if (!skipStory && intro && intro.length > 0) {
                this.setScene(new StoryScene(this, stage, 'intro', go));
            }
            else {
                go();
            }
        });
    }
    showGameplay(stageId, charId) {
        this.setScene(new GameplayScene(this, getStage(stageId), charId));
    }
    /** Chamado pela cena de combate quando o chefe cai. */
    finishStage(stageId, charId) {
        if (this.finishing)
            return;
        this.finishing = true;
        const stage = getStage(stageId);
        const id = charId in CHARACTERS ? charId : 'ravi';
        if (!this.save.cleared.includes(stageId))
            this.save.cleared.push(stageId);
        if (!this.save.unlocked.includes(id))
            this.save.unlocked.push(id);
        this.save.selected = id;
        this.save.bestCombo = Math.max(this.save.bestCombo, 0);
        let nextChar = null;
        if (stageId < MAX_STAGE) {
            const next = getStage(stageId + 1);
            nextChar = next.character;
            if (!this.save.unlocked.includes(nextChar)) {
                this.save.unlocked.push(nextChar);
                const c = CHARACTERS[nextChar];
                this.setNotice(`${c.name.toUpperCase()} DESPERTOU — ${c.epithet.toUpperCase()}`, c.colors.accent);
            }
            this.save.maxStage = Math.max(this.save.maxStage, Math.min(MAX_STAGE, stageId + 1));
            this.save.selected = nextChar;
        }
        writeSave(this.save);
        const outro = STORY[stageId]?.outro;
        const finish = () => {
            if (stageId >= MAX_STAGE) {
                this.showVictory(id);
            }
            else {
                this.showCharacterSelect(stageId + 1, nextChar ?? undefined);
            }
        };
        this.transitionTo(() => {
            if (outro && outro.length > 0) {
                this.setScene(new StoryScene(this, stage, 'outro', finish));
            }
            else {
                finish();
            }
        });
    }
    showVictory(charId) {
        this.setScene(new VictoryScene(this, charId));
    }
    gotoTutorialFreeStage() {
        this.gotoCharacterSelect(this.save.maxStage);
    }
    gotoCredits() {
        this.transitionTo(() => this.setScene(new CreditsScene(this)));
    }
    gotoSettings() {
        this.transitionTo(() => this.setScene(new SettingsScene(this)));
    }
    gotoTutorial(onDone) {
        this.transitionTo(() => this.setScene(new TutorialScene(this, onDone)));
    }
    // ------------------------------------------------------------- cenas
    setScene(scene) {
        if (this.scene)
            this.scene.exit?.();
        this.scene = scene;
        this.sceneTime = 0;
        this.hitStopTimer = 0;
        this.slowTimer = 0;
        this.slowScale = 1;
        this.flashAlpha = 0;
        this.input.clear();
        this.uiParticles.clear();
        scene.enter?.();
    }
    transitionTo(callback, color = '#04050a', duration = 0.34) {
        this.fade.phase = 1;
        this.fade.alpha = 0;
        this.fade.duration = duration;
        this.fade.color = color;
        this.fade.callback = callback;
    }
    setNotice(text, color = '#ff8a3d') {
        this.notice = { text, color, t: 0, max: 5.5 };
    }
    persist() {
        writeSave(this.save);
    }
    recordDeath() {
        this.save.deaths++;
        this.persist();
    }
    recordKill() {
        this.save.kills++;
        this.persist();
    }
    // ------------------------------------------------------------- efeitos globais
    flash(color, alpha) {
        this.flashColor = color;
        this.flashAlpha = Math.max(this.flashAlpha, clamp(alpha, 0, 0.85));
    }
    hitStop(seconds) {
        this.hitStopTimer = Math.max(this.hitStopTimer, seconds);
    }
    slowMo(scale, duration) {
        this.slowScale = clamp(scale, 0.12, 1);
        this.slowTimer = Math.max(this.slowTimer, duration);
    }
    get hitStopped() {
        return this.hitStopTimer > 0;
    }
    update(dt) {
        // Transições de cena.
        if (this.fade.phase === 1) {
            this.fade.alpha = Math.min(1, this.fade.alpha + dt / this.fade.duration);
            if (this.fade.alpha >= 1) {
                const cb = this.fade.callback;
                this.fade.callback = null;
                this.fade.phase = -1;
                if (cb)
                    cb();
            }
        }
        else if (this.fade.phase === -1) {
            this.fade.alpha = Math.max(0, this.fade.alpha - dt / (this.fade.duration * 1.15));
            if (this.fade.alpha <= 0)
                this.fade.phase = 0;
        }
        // Flash de tela.
        this.flashAlpha = Math.max(0, this.flashAlpha - dt * (1.6 + this.flashAlpha * 2.4));
        // Aviso persistente.
        if (this.notice) {
            this.notice.t += dt;
            if (this.notice.t >= this.notice.max)
                this.notice = null;
        }
        this.uiParticles.update(dt);
        if (this.input.pressed('mute')) {
            const muted = this.audio.toggleMuted();
            this.save.muted = muted;
            this.persist();
            this.setNotice(muted ? 'ÁUDIO SILENCIADO' : 'ÁUDIO ATIVADO', '#56e3ff');
            this.audio.sfx('ui');
        }
        if (this.hitStopTimer > 0) {
            this.hitStopTimer = Math.max(0, this.hitStopTimer - dt);
            return;
        }
        let scaled = dt;
        if (this.slowTimer > 0) {
            this.slowTimer = Math.max(0, this.slowTimer - dt);
            scaled = dt * this.slowScale;
        }
        this.scene.update(scaled);
    }
    draw() {
        const ctx = this.ctx;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, this.width, this.height);
        this.scene.draw(ctx);
        this.uiParticles.draw(ctx, true);
        // Flash.
        if (this.flashAlpha > 0.005) {
            ctx.save();
            ctx.globalAlpha = this.flashAlpha;
            ctx.fillStyle = this.flashColor;
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.restore();
        }
        this.drawNotice(ctx);
        // Fade de cena.
        if (this.fade.alpha > 0.001) {
            ctx.save();
            ctx.globalAlpha = this.fade.alpha;
            ctx.fillStyle = this.fade.color;
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.restore();
        }
    }
    drawNotice(ctx) {
        const n = this.notice;
        if (!n)
            return;
        const inA = clamp(n.t / 0.25, 0, 1);
        const outA = clamp((n.max - n.t) / 0.5, 0, 1);
        const alpha = Math.min(inA, outA);
        if (alpha <= 0.01)
            return;
        const text = n.text;
        ctx.save();
        ctx.font = `700 13px ${FONTS.mono}`;
        const w = clamp(ctx.measureText(text).width + 44, 260, 720);
        const x = this.width / 2 - w / 2;
        const y = this.scene.noticeY ?? 660;
        ctx.globalAlpha = alpha;
        panel(ctx, x, y, w, 34, {
            fill: 'rgba(5,8,16,0.9)',
            border: hexToRgba(n.color, 0.5),
            glow: hexToRgba(n.color, 0.25),
            r: 3,
        });
        ctx.fillStyle = n.color;
        ctx.fillRect(x, y + 6, 3, 22);
        label(ctx, text, this.width / 2, y + 22, 12, '#eef2ff', {
            align: 'center',
            font: FONTS.mono,
            weight: 700,
            spacing: 1.4,
        });
        ctx.restore();
    }
    /** Utilizado pelas cenas para desenhar uma pílula de tecla. */
    drawKey(ctx, x, y, key, color = '#56e3ff') {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        roundRectPath(ctx, x, y, 24, 20, 3);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(color, 0.5);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        label(ctx, key, x + 12, y + 14, 10, color, { align: 'center', weight: 800, font: FONTS.mono });
    }
    get timeInScene() {
        return this.sceneTime;
    }
}
//# sourceMappingURL=game.js.map