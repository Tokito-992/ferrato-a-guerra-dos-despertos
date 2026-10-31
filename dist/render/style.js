/**
 * Chave de estilo visual reversível.
 *
 * O padrão é o modo anime-inspired. Para comparar com o estilo clássico,
 * use `?anime=0` na URL ou pressione F2 durante o jogo.
 */
const params = new URLSearchParams(window.location.search);
export const visualStyle = {
    anime: params.get('anime') !== '0',
};
export function setAnimeStyle(on) {
    visualStyle.anime = on;
}
export function toggleAnimeStyle() {
    visualStyle.anime = !visualStyle.anime;
    return visualStyle.anime;
}
//# sourceMappingURL=style.js.map