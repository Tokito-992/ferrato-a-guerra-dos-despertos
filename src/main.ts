/** Bootstrap do jogo: valida o canvas, inicia o loop e remove a tela de carregamento. */

import { Game } from './core/game.js';
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

  // Alternância reversível do estilo visual. `?anime=0` força o clássico.
  document.body.classList.toggle('anime-style', visualStyle.anime);
  window.addEventListener('keydown', (event) => {
    if (event.code !== 'F2') return;
    event.preventDefault();
    const on = toggleAnimeStyle();
    document.body.classList.toggle('anime-style', on);
    game.setNotice(
      on ? 'ESTILO ANIME ATIVADO' : 'ESTILO CLÁSSICO ATIVADO',
      on ? '#ff6ad5' : '#56e3ff',
    );
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
