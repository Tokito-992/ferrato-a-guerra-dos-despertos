/** Painel de conta: login, cadastro, recuperação e sincronização do save. */
import { cloudSync } from '../core/cloud-sync.js?v=2287ee03d2bc';
import { MAX_STAGE } from '../data/stages.js?v=2287ee03d2bc';
let activePanel = null;
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function formatDate(ms) {
    if (!ms)
        return 'SEM DATA';
    try {
        return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
        }).format(new Date(ms));
    }
    catch {
        return 'DATA INDISPONÍVEL';
    }
}
function saveSummary(save) {
    return {
        chapter: `CAPÍTULO ${save.maxStage} / ${MAX_STAGE}`,
        cleared: `${save.cleared.length} CAPÍTULOS CONCLUÍDOS`,
        record: `RECORDE ${save.bestScore} · RANK ${save.bestRank}`,
    };
}
function focusableElements(root) {
    return Array.from(root.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((element) => element.offsetParent !== null);
}
function errorMarkup(message) {
    if (!message)
        return '';
    return `<p class="account-error" role="alert">${escapeHtml(message)}</p>`;
}
function noticeMarkup(message) {
    if (!message)
        return '';
    return `<p class="account-success" role="status">${escapeHtml(message)}</p>`;
}
function saveCardMarkup(save, timestamp, cloud) {
    const summary = saveSummary(save);
    return `
    <div class="account-save ${cloud ? 'cloud' : ''}">
      <p class="account-save-kicker">${cloud ? 'SAVE NA NUVEM' : 'SAVE NESTE APARELHO'}</p>
      <strong>${summary.chapter}</strong>
      <span>${summary.cleared}</span>
      <span>${summary.record}</span>
      <time>${formatDate(timestamp)}</time>
    </div>
  `;
}
/**
 * Mostra o painel de conta. Retorna `false` se ele já estava aberto.
 */
export function showAccountPanel(options = {}) {
    if (typeof document === 'undefined')
        return false;
    if (activePanel) {
        activePanel.querySelector('.account-close')?.focus();
        return false;
    }
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const app = document.getElementById('app');
    const previousAppHidden = app?.getAttribute('aria-hidden') ?? null;
    const root = document.createElement('div');
    root.id = 'account-panel';
    root.className = 'account-panel';
    root.innerHTML = `
    <section class="account-card" role="dialog" aria-modal="true"
      aria-labelledby="account-title" aria-describedby="account-desc">
      <button type="button" class="account-close" aria-label="Fechar conta" data-close>×</button>
      <header class="account-header">
        <img class="account-icon" src="icons/icon-192.png" alt="" width="64" height="64" draggable="false" />
        <div>
          <p class="account-kicker">NUVEM · SAVE ENTRE APARELHOS</p>
          <h2 id="account-title">CONTA FERRATO</h2>
        </div>
      </header>
      <div id="account-body" class="account-body"></div>
    </section>
  `;
    const card = root.querySelector('.account-card');
    const body = root.querySelector('#account-body');
    if (!card || !body)
        return false;
    const values = {
        email: '',
        password: '',
        newPassword: '',
        confirmPassword: '',
    };
    const form = {
        mode: 'login',
        forgot: false,
        confirmDownload: false,
        submitting: false,
        error: '',
        notice: '',
    };
    const busy = () => form.submitting || cloudSync.snapshot.busy;
    const errorText = () => form.error || cloudSync.snapshot.lastError || '';
    const resetMessages = () => {
        form.error = '';
        form.notice = '';
    };
    const authView = (snapshot) => {
        const isSignup = form.mode === 'signup';
        const isBusy = busy();
        return `
      <div class="account-tabs" role="tablist" aria-label="Entrar ou criar conta">
        <button type="button" role="tab" aria-selected="${!isSignup}" class="${!isSignup ? 'active' : ''}"
          data-mode="login">ENTRAR</button>
        <button type="button" role="tab" aria-selected="${isSignup}" class="${isSignup ? 'active' : ''}"
          data-mode="signup">CRIAR CONTA</button>
      </div>
      <p id="account-desc" class="account-desc">
        ${isSignup
            ? 'Crie sua conta para levar o progresso entre o iPhone e o PC. O save local só é enviado depois que você entrar.'
            : 'Entre para continuar de onde parou em qualquer aparelho. Seu save local continua aqui mesmo sem conta.'}
      </p>
      <form class="account-form" data-form="auth" novalidate>
        <label class="account-field">
          <span>E-MAIL</span>
          <input type="email" name="email" inputmode="email" autocomplete="email"
            value="${escapeHtml(values.email)}" placeholder="voce@exemplo.com"
            required ${isBusy ? 'disabled' : ''} />
        </label>
        <label class="account-field">
          <span>SENHA</span>
          <input type="password" name="password"
            autocomplete="${isSignup ? 'new-password' : 'current-password'}"
            value="${escapeHtml(values.password)}" placeholder="mínimo 6 caracteres"
            required ${isBusy ? 'disabled' : ''} />
        </label>
        ${errorMarkup(errorText())}
        ${noticeMarkup(form.notice)}
        <button type="submit" class="account-primary" ${isBusy ? 'disabled' : ''}>
          ${isBusy ? 'CONECTANDO…' : isSignup ? 'CRIAR CONTA' : 'ENTRAR'}
        </button>
      </form>
      <div class="account-links">
        <button type="button" class="account-link" data-action="forgot" ${isBusy ? 'disabled' : ''}>
          ESQUECI A SENHA
        </button>
        <span>SEU SAVE LOCAL CONTINUA NESTE APARELHO</span>
      </div>
      <p class="account-note">
        A conta é protegida pelo Supabase. O jogo não armazena sua senha.
        ${snapshot.configured ? '' : ' A nuvem não está configurada neste build.'}
      </p>
    `;
    };
    const forgotView = () => {
        const isBusy = busy();
        return `
      <h3 class="account-subtitle">RECUPERAR SENHA</h3>
      <p id="account-desc" class="account-desc">
        Informe o e-mail da conta. Enviaremos um link para você definir uma nova senha.
        Confira também a pasta de spam.
      </p>
      <form class="account-form" data-form="forgot" novalidate>
        <label class="account-field">
          <span>E-MAIL</span>
          <input type="email" name="email" inputmode="email" autocomplete="email"
            value="${escapeHtml(values.email)}" placeholder="voce@exemplo.com"
            required ${isBusy ? 'disabled' : ''} />
        </label>
        ${errorMarkup(errorText())}
        ${noticeMarkup(form.notice)}
        <button type="submit" class="account-primary" ${isBusy ? 'disabled' : ''}>
          ${isBusy ? 'ENVIANDO…' : 'ENVIAR LINK'}
        </button>
      </form>
      <div class="account-links">
        <button type="button" class="account-link" data-action="back-login">VOLTAR PARA ENTRAR</button>
      </div>
    `;
    };
    const recoveryView = () => {
        const isBusy = busy();
        return `
      <h3 class="account-subtitle">DEFINIR NOVA SENHA</h3>
      <p id="account-desc" class="account-desc">
        Você entrou pelo link de recuperação. Escolha uma nova senha para sua conta.
      </p>
      <form class="account-form" data-form="recovery" novalidate>
        <label class="account-field">
          <span>NOVA SENHA</span>
          <input type="password" name="newPassword" autocomplete="new-password"
            value="${escapeHtml(values.newPassword)}" placeholder="mínimo 6 caracteres"
            required ${isBusy ? 'disabled' : ''} />
        </label>
        <label class="account-field">
          <span>CONFIRME A NOVA SENHA</span>
          <input type="password" name="confirmPassword" autocomplete="new-password"
            value="${escapeHtml(values.confirmPassword)}" placeholder="repita a senha"
            required ${isBusy ? 'disabled' : ''} />
        </label>
        ${errorMarkup(errorText())}
        ${noticeMarkup(form.notice)}
        <button type="submit" class="account-primary" ${isBusy ? 'disabled' : ''}>
          ${isBusy ? 'SALVANDO…' : 'SALVAR NOVA SENHA'}
        </button>
      </form>
      <div class="account-links">
        <button type="button" class="account-link" data-action="logout" ${isBusy ? 'disabled' : ''}>
          CANCELAR E SAIR
        </button>
      </div>
    `;
    };
    const conflictView = (snapshot) => {
        const cloud = cloudSync.conflict;
        const local = cloudSync.localSave;
        if (!cloud || !local)
            return authView(snapshot);
        const localSummary = saveSummary(local);
        const cloudSummary = saveSummary(cloud.save);
        const isBusy = busy();
        return `
      <h3 class="account-subtitle">ESCOLHA O SAVE</h3>
      <p id="account-desc" class="account-desc">
        Encontramos progresso na nuvem e neste aparelho. Escolha qual deseja manter.
        O outro será substituído e essa ação não pode ser desfeita.
      </p>
      <div class="account-compare">
        <article class="account-compare-card">
          <p class="account-save-kicker">ESTE APARELHO</p>
          <h4>${localSummary.chapter}</h4>
          <p>${localSummary.cleared}</p>
          <p>${localSummary.record}</p>
          <time>${formatDate(cloudSync.localUpdatedAt || null)}</time>
          <button type="button" class="account-primary" data-action="use-local" ${isBusy ? 'disabled' : ''}>
            USAR ESTE APARELHO
          </button>
        </article>
        <article class="account-compare-card cloud">
          <p class="account-save-kicker">NUVEM</p>
          <h4>${cloudSummary.chapter}</h4>
          <p>${cloudSummary.cleared}</p>
          <p>${cloudSummary.record}</p>
          <time>${formatDate(cloud.clientUpdatedAt || null)}</time>
          <button type="button" class="account-primary" data-action="use-cloud" ${isBusy ? 'disabled' : ''}>
            USAR A NUVEM
          </button>
        </article>
      </div>
      ${errorMarkup(errorText())}
      ${noticeMarkup(form.notice)}
      <p class="account-note">
        Dica: use a nuvem se você jogou em outro aparelho. Use este aparelho se o progresso mais novo está aqui.
      </p>
    `;
    };
    const downloadConfirmView = () => {
        const isBusy = busy();
        return `
      <h3 class="account-subtitle">BAIXAR DA NUVEM?</h3>
      <p id="account-desc" class="account-desc">
        O save deste aparelho será substituído pelo save da nuvem.
        Essa ação não pode ser desfeita.
      </p>
      ${errorMarkup(errorText())}
      <div class="account-confirm-actions">
        <button type="button" class="account-primary" data-action="download-confirm" ${isBusy ? 'disabled' : ''}>
          ${isBusy ? 'BAIXANDO…' : 'BAIXAR E SUBSTITUIR'}
        </button>
        <button type="button" class="account-secondary" data-action="cancel" ${isBusy ? 'disabled' : ''}>
          CANCELAR
        </button>
      </div>
    `;
    };
    const accountView = (snapshot) => {
        const local = cloudSync.localSave;
        const cloud = cloudSync.cloudSave;
        const isBusy = busy();
        const status = snapshot.busy
            ? 'SINCRONIZANDO…'
            : snapshot.cloudNewer
                ? 'NUVEM MAIS RECENTE'
                : snapshot.lastError
                    ? 'ERRO DE SINCRONIZAÇÃO'
                    : 'SINCRONIZADO';
        return `
      <div class="account-user">
        <span class="account-avatar" aria-hidden="true">◈</span>
        <div class="account-user-text">
          <strong>${escapeHtml(snapshot.email ?? '')}</strong>
          <span>NUVEM CONECTADA</span>
        </div>
        <span class="account-badge ${snapshot.cloudNewer ? 'warn' : ''}">${status}</span>
      </div>
      <p id="account-desc" class="account-desc">
        Seu progresso é enviado automaticamente enquanto você joga.
        Sem internet, o save continua neste aparelho e sincroniza depois.
      </p>
      ${snapshot.cloudNewer
            ? '<p class="account-warning">Há um save mais recente na nuvem. Baixe para continuar de onde parou.</p>'
            : ''}
      <div class="account-saves">
        ${local ? saveCardMarkup(local, cloudSync.localUpdatedAt || null, false) : ''}
        ${cloud
            ? saveCardMarkup(cloud.save, cloud.clientUpdatedAt || null, true)
            : '<div class="account-save cloud empty"><p class="account-save-kicker">SAVE NA NUVEM</p><strong>AINDA VAZIO</strong><span>O próximo envio cria seu save na nuvem.</span></div>'}
      </div>
      ${errorMarkup(errorText())}
      ${noticeMarkup(form.notice)}
      <div class="account-actions">
        <button type="button" class="account-primary" data-action="upload" ${isBusy || snapshot.cloudNewer ? 'disabled' : ''}>
          ENVIAR AGORA
        </button>
        <button type="button" class="account-secondary" data-action="download" ${isBusy || !cloud ? 'disabled' : ''}>
          BAIXAR DA NUVEM
        </button>
        <button type="button" class="account-danger" data-action="logout" ${isBusy ? 'disabled' : ''}>
          SAIR DA CONTA
        </button>
      </div>
      <p class="account-status" role="status">
        ${snapshot.lastSyncedAt ? `Última sincronização: ${formatDate(snapshot.lastSyncedAt)}` : 'Ainda não sincronizado neste acesso.'}
      </p>
      <p class="account-note">
        A senha é gerenciada pelo Supabase; o jogo não armazena sua senha.
      </p>
    `;
    };
    const viewHtml = (snapshot) => {
        if (snapshot.recovery)
            return recoveryView();
        if (snapshot.conflict)
            return conflictView(snapshot);
        if (!snapshot.signedIn)
            return form.forgot ? forgotView() : authView(snapshot);
        if (form.confirmDownload)
            return downloadConfirmView();
        return accountView(snapshot);
    };
    const focusFirst = () => {
        const target = body.querySelector('input[name="email"]') ??
            body.querySelector('input') ??
            body.querySelector('button') ??
            root.querySelector('.account-close');
        target?.focus({ preventScroll: true });
    };
    let unsubscribe = null;
    const runAction = async (action, success) => {
        if (busy())
            return;
        resetMessages();
        form.submitting = true;
        render(false);
        try {
            await action();
            form.notice = success;
        }
        catch {
            form.error = cloudSync.snapshot.lastError || 'Não foi possível concluir. Tente novamente.';
        }
        finally {
            form.submitting = false;
            render(false);
        }
    };
    const render = (focus = false) => {
        const snapshot = cloudSync.snapshot;
        const scrollTop = card.scrollTop;
        const active = document.activeElement;
        const activeName = active instanceof HTMLInputElement ? active.name : '';
        body.innerHTML = viewHtml(snapshot);
        card.scrollTop = scrollTop;
        body.querySelectorAll('input[name]').forEach((input) => {
            input.addEventListener('input', () => {
                const name = input.name;
                if (name in values)
                    values[name] = input.value;
            });
        });
        body.querySelectorAll('[data-mode]').forEach((button) => {
            button.addEventListener('click', () => {
                form.mode = button.dataset.mode === 'signup' ? 'signup' : 'login';
                resetMessages();
                render(true);
            });
        });
        const authForm = body.querySelector('[data-form="auth"]');
        authForm?.addEventListener('submit', (event) => {
            event.preventDefault();
            if (busy())
                return;
            const email = values.email.trim();
            const password = values.password;
            resetMessages();
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                form.error = 'Informe um e-mail válido.';
                render(true);
                return;
            }
            if (password.length < 6) {
                form.error = 'A senha precisa ter pelo menos 6 caracteres.';
                render(true);
                return;
            }
            form.submitting = true;
            render(false);
            void (async () => {
                try {
                    if (form.mode === 'signup') {
                        const result = await cloudSync.signUp(email, password);
                        values.password = '';
                        if (result.needsConfirmation) {
                            form.mode = 'login';
                            form.notice =
                                'Conta criada. Confirme seu e-mail e depois entre. Verifique também a pasta de spam.';
                        }
                        else {
                            form.notice = 'Conta criada e conectada.';
                        }
                    }
                    else {
                        await cloudSync.signIn(email, password);
                        values.password = '';
                        form.notice = 'Conectado.';
                    }
                }
                catch {
                    form.error = cloudSync.snapshot.lastError || 'Não foi possível conectar. Tente novamente.';
                }
                finally {
                    form.submitting = false;
                    render(false);
                }
            })();
        });
        const forgotForm = body.querySelector('[data-form="forgot"]');
        forgotForm?.addEventListener('submit', (event) => {
            event.preventDefault();
            if (busy())
                return;
            const email = values.email.trim();
            resetMessages();
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                form.error = 'Informe um e-mail válido.';
                render(true);
                return;
            }
            form.submitting = true;
            render(false);
            void (async () => {
                try {
                    await cloudSync.requestPasswordReset(email);
                    form.notice =
                        'Se este e-mail tiver uma conta, enviamos um link para redefinir a senha. Confira o spam.';
                }
                catch {
                    form.error = cloudSync.snapshot.lastError || 'Não foi possível enviar o link.';
                }
                finally {
                    form.submitting = false;
                    render(false);
                }
            })();
        });
        const recoveryForm = body.querySelector('[data-form="recovery"]');
        recoveryForm?.addEventListener('submit', (event) => {
            event.preventDefault();
            if (busy())
                return;
            resetMessages();
            if (values.newPassword.length < 6) {
                form.error = 'A nova senha precisa ter pelo menos 6 caracteres.';
                render(true);
                return;
            }
            if (values.newPassword !== values.confirmPassword) {
                form.error = 'As senhas não conferem.';
                render(true);
                return;
            }
            form.submitting = true;
            render(false);
            void (async () => {
                try {
                    await cloudSync.updatePassword(values.newPassword);
                    values.newPassword = '';
                    values.confirmPassword = '';
                    form.notice = 'Senha atualizada. Você está conectado.';
                }
                catch {
                    form.error = cloudSync.snapshot.lastError || 'Não foi possível salvar a nova senha.';
                }
                finally {
                    form.submitting = false;
                    render(false);
                }
            })();
        });
        const action = (name) => body.querySelector(`[data-action="${name}"]`);
        action('forgot')?.addEventListener('click', () => {
            form.forgot = true;
            resetMessages();
            render(true);
        });
        action('back-login')?.addEventListener('click', () => {
            form.forgot = false;
            resetMessages();
            render(true);
        });
        action('upload')?.addEventListener('click', () => {
            void runAction(() => cloudSync.uploadLocal(), 'Save enviado para a nuvem.');
        });
        action('download')?.addEventListener('click', () => {
            form.confirmDownload = true;
            resetMessages();
            render(true);
        });
        action('download-confirm')?.addEventListener('click', () => {
            void runAction(async () => {
                await cloudSync.downloadCloud();
                form.confirmDownload = false;
            }, 'Save da nuvem carregado.');
        });
        action('cancel')?.addEventListener('click', () => {
            form.confirmDownload = false;
            resetMessages();
            render(true);
        });
        action('logout')?.addEventListener('click', () => {
            void runAction(async () => {
                await cloudSync.signOut();
                form.mode = 'login';
                form.forgot = false;
                form.confirmDownload = false;
                values.password = '';
                values.newPassword = '';
                values.confirmPassword = '';
            }, 'Você saiu. O save local continua neste aparelho.');
        });
        action('use-local')?.addEventListener('click', () => {
            void runAction(() => cloudSync.resolveConflict('local'), 'Save deste aparelho enviado para a nuvem.');
        });
        action('use-cloud')?.addEventListener('click', () => {
            void runAction(() => cloudSync.resolveConflict('cloud'), 'Save da nuvem carregado.');
        });
        if (focus) {
            focusFirst();
        }
        else if (activeName) {
            body.querySelector(`input[name="${activeName}"]`)?.focus({
                preventScroll: true,
            });
        }
    };
    const close = () => {
        if (!activePanel)
            return;
        activePanel = null;
        unsubscribe?.();
        unsubscribe = null;
        document.body.classList.remove('account-open', 'ui-overlay-open');
        document.removeEventListener('keydown', onKeyDown, true);
        if (app) {
            if (previousAppHidden === null)
                app.removeAttribute('aria-hidden');
            else
                app.setAttribute('aria-hidden', previousAppHidden);
        }
        root.remove();
        options.onClose?.();
        previousFocus?.focus({ preventScroll: true });
    };
    const onKeyDown = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            close();
            return;
        }
        if (event.key !== 'Tab')
            return;
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
        }
        else if (!event.shiftKey && (current === last || !root.contains(current))) {
            event.preventDefault();
            first.focus();
        }
    };
    root.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Element))
            return;
        if (target.closest('[data-close]') || target === root) {
            event.preventDefault();
            close();
        }
    });
    document.body.append(root);
    document.body.classList.add('account-open', 'ui-overlay-open');
    app?.setAttribute('aria-hidden', 'true');
    document.addEventListener('keydown', onKeyDown, true);
    activePanel = root;
    unsubscribe = cloudSync.subscribe(() => render(false));
    options.onOpen?.();
    render(true);
    return true;
}
//# sourceMappingURL=account-panel.js.map