/** Tela cheia com suporte aos prefixos usados por navegadores móveis. */

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  msFullscreenElement?: Element | null;
  msExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type OrientationApi = {
  lock?: (orientation: string) => Promise<void>;
  unlock?: () => void;
};

function fullscreenDocument(): FullscreenDocument {
  return document as FullscreenDocument;
}

export function fullscreenElement(): Element | null {
  const doc = fullscreenDocument();
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.msFullscreenElement ?? null;
}

export function isFullscreen(): boolean {
  return fullscreenElement() !== null;
}

export function canFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement as FullscreenElement;
  return Boolean(el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen);
}

async function lockLandscape(): Promise<void> {
  const orientation = screen.orientation as unknown as OrientationApi | undefined;
  try {
    await orientation?.lock?.('landscape');
  } catch {
    // Navegadores sem bloqueio de orientação (iOS, desktop) seguem o sistema.
  }
}

function unlockOrientation(): void {
  const orientation = screen.orientation as unknown as OrientationApi | undefined;
  try {
    orientation?.unlock?.();
  } catch {
    // Sem suporte: nada a fazer.
  }
}

export async function enterFullscreen(): Promise<boolean> {
  if (isFullscreen()) return true;
  const el = document.documentElement as FullscreenElement;
  const request = (el.requestFullscreen ??
    el.webkitRequestFullscreen ??
    el.msRequestFullscreen) as
    | ((options?: FullscreenOptions) => Promise<void> | void)
    | undefined;
  if (!request) return false;
  try {
    await request.call(el, { navigationUI: 'hide' });
  } catch {
    return false;
  }
  await lockLandscape();
  return isFullscreen();
}

export async function exitFullscreen(): Promise<boolean> {
  if (!isFullscreen()) return false;
  const doc = fullscreenDocument();
  const exit = doc.exitFullscreen ?? doc.webkitExitFullscreen ?? doc.msExitFullscreen;
  if (!exit) return false;
  try {
    await exit.call(doc);
  } catch {
    return false;
  }
  unlockOrientation();
  return true;
}

export async function toggleFullscreen(): Promise<boolean> {
  return isFullscreen() ? exitFullscreen() : enterFullscreen();
}

export function watchFullscreen(callback: (on: boolean) => void): () => void {
  const handler = (): void => callback(isFullscreen());
  const events = ['fullscreenchange', 'webkitfullscreenchange', 'MSFullscreenChange'];
  for (const event of events) {
    document.addEventListener(event, handler as EventListener);
  }
  handler();
  return () => {
    for (const event of events) {
      document.removeEventListener(event, handler as EventListener);
    }
  };
}
