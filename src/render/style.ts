/**
 * Chave de estilo visual reversível.
 *
 * O padrão desta branch é o modo anime-inspired. Para comparar com o estilo
 * clássico, use `?anime=0` na URL ou pressione F2 durante o jogo. A `main`
 * permanece com o estilo clássico até a branch ser aprovada e mesclada.
 */

const params = new URLSearchParams(window.location.search);

export const visualStyle = {
  anime: params.get('anime') !== '0',
};

export function setAnimeStyle(on: boolean): void {
  visualStyle.anime = on;
}

export function toggleAnimeStyle(): boolean {
  visualStyle.anime = !visualStyle.anime;
  return visualStyle.anime;
}
