/** Guia de instalação no iPhone: a única forma confiável de tela cheia no Safari. */

export interface InstallGuideOptions {
  onOpen?: () => void;
  onClose?: () => void;
}

let activeGuide: HTMLElement | null = null;

function focusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.offsetParent !== null);
}

/**
 * Mostra o guia "Adicionar à Tela de Início".
 * Retorna `false` se o guia já estava aberto.
 */
export function showInstallGuide(options: InstallGuideOptions = {}): boolean {
  if (typeof document === 'undefined') return false;
  if (activeGuide) {
    activeGuide.querySelector<HTMLButtonElement>('.install-guide-close')?.focus();
    return false;
  }

  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const app = document.getElementById('app');
  const previousAppHidden = app?.getAttribute('aria-hidden') ?? null;

  const root = document.createElement('div');
  root.id = 'install-guide';
  root.className = 'install-guide';
  root.innerHTML = `
    <section class="install-guide-card" role="dialog" aria-modal="true"
      aria-labelledby="install-guide-title" aria-describedby="install-guide-desc">
      <button type="button" class="install-guide-close" aria-label="Fechar guia" data-close>×</button>
      <header class="install-guide-header">
        <img class="install-guide-icon" src="icons/icon-192.png" alt="" width="64" height="64" draggable="false" />
        <div>
          <p class="install-guide-kicker">IPHONE · SAFARI</p>
          <h2 id="install-guide-title">TELA CHEIA NO IPHONE</h2>
        </div>
      </header>
      <p id="install-guide-desc" class="install-guide-desc">
        O Safari do iPhone não libera a tela cheia para jogos no navegador.
        Instale o FERRATO na Tela de Início para abrir sem as barras do Safari
        e jogar em tela cheia de verdade.
      </p>
      <ol class="install-guide-steps">
        <li>
          <span class="install-guide-num" aria-hidden="true">1</span>
          <span class="install-guide-step-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v11" />
              <path d="m8 7 4-4 4 4" />
              <path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" />
            </svg>
          </span>
          <span class="install-guide-step-text">
            <strong>Toque em Compartilhar</strong>
            <span>O ícone de quadrado com uma seta para cima, na barra do Safari.</span>
          </span>
        </li>
        <li>
          <span class="install-guide-num" aria-hidden="true">2</span>
          <span class="install-guide-step-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="3" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </span>
          <span class="install-guide-step-text">
            <strong>Escolha “Adicionar à Tela de Início”</strong>
            <span>Role a lista de ações se essa opção não aparecer de imediato.</span>
          </span>
        </li>
        <li>
          <span class="install-guide-num" aria-hidden="true">3</span>
          <span class="install-guide-step-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="m5 12 4.5 4.5L19 7" />
            </svg>
          </span>
          <span class="install-guide-step-text">
            <strong>Confirme em “Adicionar”</strong>
            <span>O ícone do FERRATO vai para a sua Tela de Início.</span>
          </span>
        </li>
        <li>
          <span class="install-guide-num" aria-hidden="true">4</span>
          <span class="install-guide-step-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 11 9-8 9 8" />
              <path d="M5 9.5V21h14V9.5" />
              <path d="M9 21v-6h6v6" />
            </svg>
          </span>
          <span class="install-guide-step-text">
            <strong>Abra pelo ícone do FERRATO</strong>
            <span>O jogo inicia em modo standalone, sem as barras do navegador.</span>
          </span>
        </li>
      </ol>
      <p class="install-guide-note">
        <strong>Dica:</strong> gire o iPhone para a horizontal antes de jogar.
        O jogo instalado tem o próprio armazenamento: progresso e layout ficam
        salvos nele a partir de agora.
      </p>
      <footer class="install-guide-footer">
        <p>Você pode rever este guia em <strong>CONFIGURAÇÕES → TELA CHEIA NO IPHONE</strong>.</p>
        <button type="button" class="install-guide-primary" data-close>ENTENDI</button>
      </footer>
    </section>
  `;

  const close = (): void => {
    if (!activeGuide) return;
    activeGuide = null;
    document.body.classList.remove('install-guide-open', 'ui-overlay-open');
    document.removeEventListener('keydown', onKeyDown, true);
    if (app) {
      if (previousAppHidden === null) app.removeAttribute('aria-hidden');
      else app.setAttribute('aria-hidden', previousAppHidden);
    }
    root.remove();
    options.onClose?.();
    previousFocus?.focus({ preventScroll: true });
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusableElements(root);
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const current = document.activeElement;
    if (event.shiftKey && (current === first || !root.contains(current))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (current === last || !root.contains(current))) {
      event.preventDefault();
      first.focus();
    }
  };

  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('[data-close]') || target === root) {
      event.preventDefault();
      close();
    }
  });

  document.body.append(root);
  document.body.classList.add('install-guide-open', 'ui-overlay-open');
  app?.setAttribute('aria-hidden', 'true');
  document.addEventListener('keydown', onKeyDown, true);
  activeGuide = root;
  options.onOpen?.();
  root.querySelector<HTMLButtonElement>('.install-guide-close')?.focus({ preventScroll: true });
  return true;
}
