/** Detecção de iOS e do modo standalone (web app instalado na Tela de Início). */
/** iPhone, iPod e iPad — incluindo iPadOS 13+, que se apresenta como MacIntel. */
export function isIOS() {
    if (typeof navigator === 'undefined')
        return false;
    if (/iPad|iPhone|iPod/.test(navigator.userAgent))
        return true;
    return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}
/** Verdadeiro quando o jogo já está rodando como web app instalado. */
export function isStandalone() {
    if (typeof window === 'undefined')
        return false;
    if (window.matchMedia?.('(display-mode: standalone)').matches)
        return true;
    return navigator.standalone === true;
}
/**
 * O Safari do iPhone não expõe a Fullscreen API para elementos da página.
 * Nesse caso, a tela cheia real vem de abrir o jogo pela Tela de Início.
 */
export function needsIOSInstallGuide() {
    return isIOS() && !isStandalone();
}
//# sourceMappingURL=platform.js.map