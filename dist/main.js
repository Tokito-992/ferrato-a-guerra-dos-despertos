/** Bootstrap do jogo: valida o canvas, inicia o loop e remove a tela de carregamento. */
import { Game } from './core/game.js';
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