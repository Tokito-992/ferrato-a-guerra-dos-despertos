/** Bootstrap do jogo: valida o canvas, inicia o loop e remove a tela de carregamento. */
import { Game } from './core/game.js?v=8f2357506abc';
import { canFullscreen, enterFullscreen, toggleFullscreen, watchFullscreen } from './core/fullscreen.js?v=8f2357506abc';
import { toggleAnimeStyle, visualStyle } from './render/style.js?v=8f2357506abc';
function hideLoading() {
    const loading = document.getElementById('loading');
    if (!loading)
        return;
    loading.classList.add('hide');
    window.setTimeout(() => {
        loading.style.display = 'none';
    }, 700);
}
function fail(message) {
    const loading = document.getElementById('loading');
    if (!loading)
        return;
    loading.classList.remove('hide');
    loading.style.display = 'flex';
    loading.replaceChildren();
    const mark = document.createElement('div');
    mark.className = 'loading-mark';
    mark.textContent = 'FERRATO';
    const sub = document.createElement('div');
    sub.className = 'loading-sub';
    sub.textContent = message;
    loading.append(mark, sub);
}
try {
    const canvas = document.getElementById('game');
    if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error('Canvas #game não encontrado.');
    }
    const game = new Game(canvas);
    game.start();
    const stage = document.getElementById('stage') ?? canvas.parentElement;
    const fitCanvas = () => {
        if (!stage)
            return;
        const rect = stage.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2)
            return;
        const scale = Math.min(rect.width / 1280, rect.height / 720);
        canvas.style.width = `${Math.max(1, Math.floor(1280 * scale))}px`;
        canvas.style.height = `${Math.max(1, Math.floor(720 * scale))}px`;
    };
    fitCanvas();
    if (stage && typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(fitCanvas).observe(stage);
    }
    window.addEventListener('resize', fitCanvas);
    window.visualViewport?.addEventListener('resize', fitCanvas);
    window.addEventListener('orientationchange', () => window.setTimeout(fitCanvas, 180));
    const fullscreenButton = document.getElementById('fullscreen-toggle');
    if (fullscreenButton instanceof HTMLButtonElement) {
        if (!canFullscreen()) {
            fullscreenButton.remove();
        }
        else {
            fullscreenButton.addEventListener('click', (event) => {
                event.preventDefault();
                void toggleFullscreen();
            });
        }
    }
    const syncFullscreenUi = (on) => {
        document.body.classList.toggle('is-fullscreen', on);
        document
            .querySelectorAll('#fullscreen-toggle, .touch-fullscreen')
            .forEach((button) => {
            button.textContent = on ? '⤢' : '⛶';
            const label = on ? 'Sair da tela cheia' : 'Tela cheia';
            button.setAttribute('aria-label', label);
            button.title = label;
        });
        window.requestAnimationFrame(fitCanvas);
    };
    watchFullscreen(syncFullscreenUi);
    // No primeiro toque, tenta entrar em tela cheia (o gesto é necessário no mobile).
    if (window.matchMedia('(pointer: coarse)').matches && canFullscreen()) {
        const enterOnFirstTouch = (event) => {
            const target = event.target;
            if (target instanceof Element && target.closest('#fullscreen-toggle, .touch-fullscreen'))
                return;
            void enterFullscreen();
        };
        window.addEventListener('pointerdown', enterOnFirstTouch, { once: true, capture: true });
    }
    // Alternância reversível do estilo visual. `?anime=0` força o clássico.
    document.body.classList.toggle('anime-style', visualStyle.anime);
    window.addEventListener('keydown', (event) => {
        if (event.code === 'F2') {
            event.preventDefault();
            const on = toggleAnimeStyle();
            document.body.classList.toggle('anime-style', on);
            game.setNotice(on ? 'ESTILO ANIME ATIVADO' : 'ESTILO CLÁSSICO ATIVADO', on ? '#ff6ad5' : '#56e3ff');
            return;
        }
        if (event.code === 'KeyF' && !event.repeat) {
            event.preventDefault();
            void toggleFullscreen();
        }
    });
    // Só revela o jogo depois que as fontes estiverem prontas (ou após um curto prazo).
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    fontsReady.catch(() => undefined).finally(() => {
        window.setTimeout(hideLoading, 140);
    });
    window.setTimeout(hideLoading, 1600);
    // Expõe o núcleo para depuração no console.
    window.ferratoGame = game;
}
catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    fail(`não foi possível abrir o Véu — ${detail}`);
    console.error('[Ferrato] Falha ao iniciar:', error);
}
//# sourceMappingURL=main.js.map