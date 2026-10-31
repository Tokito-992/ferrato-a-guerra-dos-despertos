/** Tela cheia com suporte aos prefixos usados por navegadores móveis. */
function fullscreenDocument() {
    return document;
}
export function fullscreenElement() {
    const doc = fullscreenDocument();
    return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.msFullscreenElement ?? null;
}
export function isFullscreen() {
    return fullscreenElement() !== null;
}
export function canFullscreen() {
    if (typeof document === 'undefined')
        return false;
    const el = document.documentElement;
    return Boolean(el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen);
}
async function lockLandscape() {
    const orientation = screen.orientation;
    try {
        await orientation?.lock?.('landscape');
    }
    catch {
        // Navegadores sem bloqueio de orientação (iOS, desktop) seguem o sistema.
    }
}
function unlockOrientation() {
    const orientation = screen.orientation;
    try {
        orientation?.unlock?.();
    }
    catch {
        // Sem suporte: nada a fazer.
    }
}
export async function enterFullscreen() {
    if (isFullscreen())
        return true;
    const el = document.documentElement;
    const request = (el.requestFullscreen ??
        el.webkitRequestFullscreen ??
        el.msRequestFullscreen);
    if (!request)
        return false;
    try {
        await request.call(el, { navigationUI: 'hide' });
    }
    catch {
        return false;
    }
    await lockLandscape();
    return isFullscreen();
}
export async function exitFullscreen() {
    if (!isFullscreen())
        return false;
    const doc = fullscreenDocument();
    const exit = doc.exitFullscreen ?? doc.webkitExitFullscreen ?? doc.msExitFullscreen;
    if (!exit)
        return false;
    try {
        await exit.call(doc);
    }
    catch {
        return false;
    }
    unlockOrientation();
    return true;
}
export async function toggleFullscreen() {
    return isFullscreen() ? exitFullscreen() : enterFullscreen();
}
export function watchFullscreen(callback) {
    const handler = () => callback(isFullscreen());
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'MSFullscreenChange'];
    for (const event of events) {
        document.addEventListener(event, handler);
    }
    handler();
    return () => {
        for (const event of events) {
            document.removeEventListener(event, handler);
        }
    };
}
//# sourceMappingURL=fullscreen.js.map