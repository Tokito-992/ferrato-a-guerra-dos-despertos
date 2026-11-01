/** Bootstrap do jogo: valida o canvas, inicia o loop e remove a tela de carregamento. */

import { Game } from './core/game.js';
import { canFullscreen, enterFullscreen, toggleFullscreen, watchFullscreen } from './core/fullscreen.js';
import { needsIOSInstallGuide } from './core/platform.js';
import { toggleAnimeStyle, visualStyle } from './render/style.js';

function hideLoading(): void {
  const loading = document.getElementById('loading');
  if (!loading) return;
  loading.classList.add('hide');
  window.setTimeout(() => {
    loading.style.display = 'none';
  }, 700);
}

function fail(message: string): void {
  const loading = document.getElementById('loading');
  if (!loading) return;
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
  const fitCanvas = (): void => {
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
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

  // No iPhone sem Fullscreen API, o botão ⛶ abre o guia de instalação.
  const useIOSGuide = !canFullscreen() && needsIOSInstallGuide();
  const fullscreenButton = document.getElementById('fullscreen-toggle');
  if (fullscreenButton instanceof HTMLButtonElement) {
    if (!canFullscreen() && !useIOSGuide) {
      fullscreenButton.remove();
    } else {
      if (useIOSGuide) {
        fullscreenButton.dataset.iosGuide = 'true';
        fullscreenButton.setAttribute('aria-label', 'Tela cheia no iPhone — instalar');
        fullscreenButton.title = 'Tela cheia no iPhone — instalar';
      }
      fullscreenButton.addEventListener('click', (event) => {
        event.preventDefault();
        if (useIOSGuide) {
          game.openIOSInstallGuide();
        } else {
          void toggleFullscreen();
        }
      });
    }
  }

  const syncFullscreenUi = (on: boolean): void => {
    document.body.classList.toggle('is-fullscreen', on);
    document
      .querySelectorAll<HTMLButtonElement>('#fullscreen-toggle, .touch-fullscreen')
      .forEach((button) => {
        if (button.dataset.iosGuide === 'true' && !on) {
          button.textContent = '⛶';
          const label = 'Tela cheia no iPhone — instalar';
          button.setAttribute('aria-label', label);
          button.title = label;
          return;
        }
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
    const enterOnFirstTouch = (event: PointerEvent): void => {
      const target = event.target;
      if (target instanceof Element && target.closest('#fullscreen-toggle, .touch-fullscreen')) return;
      void enterFullscreen();
    };
    window.addEventListener('pointerdown', enterOnFirstTouch, { once: true, capture: true });
  }

  // Alternância reversível do estilo visual. `?anime=0` força o clássico.
  document.body.classList.toggle('anime-style', visualStyle.anime);
  window.addEventListener('keydown', (event) => {
    // O guia de instalação captura o teclado; não deixe atalhos do jogo vazarem.
    if (document.body.classList.contains('ui-overlay-open')) return;
    if (event.code === 'F2') {
      event.preventDefault();
      const on = toggleAnimeStyle();
      document.body.classList.toggle('anime-style', on);
      game.setNotice(
        on ? 'ESTILO ANIME ATIVADO' : 'ESTILO CLÁSSICO ATIVADO',
        on ? '#ff6ad5' : '#56e3ff',
      );
      return;
    }
    if (event.code === 'KeyF' && !event.repeat) {
      if (canFullscreen()) {
        event.preventDefault();
        void toggleFullscreen();
      } else if (needsIOSInstallGuide()) {
        event.preventDefault();
        game.openIOSInstallGuide();
      }
    }
  });

  // Só revela o jogo depois que as fontes estiverem prontas (ou após um curto prazo).
  const fontsReady = document.fonts?.ready ?? Promise.resolve();
  fontsReady.catch(() => undefined).finally(() => {
    window.setTimeout(hideLoading, 140);
  });
  window.setTimeout(hideLoading, 1600);

  // Expõe o núcleo para depuração no console.
  (window as unknown as { ferratoGame?: Game }).ferratoGame = game;
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  fail(`não foi possível abrir o Véu — ${detail}`);
  console.error('[Ferrato] Falha ao iniciar:', error);
}
