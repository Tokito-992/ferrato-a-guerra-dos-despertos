/**
 * Painel da sala privada online.
 *
 * O host abre a sala e recebe um código curto; o convidado entra com esse
 * código. A cena de combate usa a mesma `OnlineSession` guardada no `Game`,
 * então o painel pode ser fechado durante o capítulo sem derrubar a conexão.
 */
import { isCloudConfigured } from '../core/cloud-config.js?v=1400d032a431';
import { clamp } from '../core/math.js?v=1400d032a431';
import { OnlineSession } from '../core/online.js?v=1400d032a431';
import { CHARACTER_ORDER, CHARACTERS } from '../data/characters.js?v=1400d032a431';
import { getStage, MAX_STAGE } from '../data/stages.js?v=1400d032a431';
let activePanel = null;
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function statusText(status, host) {
    switch (status) {
        case 'connecting':
            return 'CONECTANDO À SALA…';
        case 'waiting':
            return 'AGUARDANDO O PARCEIRO';
        case 'connected':
            return 'SALA CONECTADA';
        case 'peer-left':
            return host ? 'SALA ABERTA' : 'O HOST SAIU';
        case 'closed':
            return 'SALA ENCERRADA';
        default:
            return 'FALHA NA CONEXÃO';
    }
}
export function openOnlinePanel(game) {
    if (activePanel)
        return true;
    if (!isCloudConfigured()) {
        game.setNotice('A SALA ONLINE NÃO ESTÁ CONFIGURADA NESTE BUILD', '#ff6a7a');
        return false;
    }
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const app = document.getElementById('app');
    const previousAppHidden = app?.getAttribute('aria-hidden') ?? null;
    const root = document.createElement('div');
    root.id = 'online-panel';
    root.className = 'account-panel online-panel';
    root.innerHTML = `
    <section class="account-card online-card" role="dialog" aria-modal="true"
      aria-labelledby="online-title" aria-describedby="online-desc">
      <button type="button" class="account-close" aria-label="Fechar sala online" data-close>×</button>
      <header class="account-header">
        <img class="account-icon" src="icons/icon-192.png" alt="" width="64" height="64" draggable="false" />
        <div>
          <p class="account-kicker">CO-OP ONLINE · SALA PRIVADA</p>
          <h2 id="online-title">SALA FERRATO</h2>
        </div>
      </header>
      <div id="online-body" class="account-body"></div>
    </section>
  `;
    const body = root.querySelector('#online-body');
    if (!body)
        return false;
    let session = null;
    let mode = 'entry';
    let role = 'host';
    let busy = false;
    let error = '';
    let notice = '';
    let copyState = '';
    let stageId = clamp(game.save.maxStage, 1, MAX_STAGE);
    let guestChar = null;
    let guestReady = false;
    let guestCharTouched = false;
    let announceTimer = null;
    const unsubs = [];
    const unlocked = () => {
        const list = CHARACTER_ORDER.filter((id) => game.save.unlocked.includes(id));
        return list.length > 0 ? list : [CHARACTER_ORDER[0]];
    };
    const defaultGuestChar = (hero) => {
        const options = unlocked();
        return options.includes(hero) ? hero : options[0];
    };
    const stopAnnounce = () => {
        if (announceTimer !== null)
            window.clearInterval(announceTimer);
        announceTimer = null;
    };
    const startAnnounce = (target) => {
        stopAnnounce();
        const announce = () => {
            if (target !== session) {
                stopAnnounce();
                return;
            }
            if (target.peerConnected) {
                stopAnnounce();
                return;
            }
            target.announceGuest(guestChar, guestReady);
        };
        announce();
        announceTimer = window.setInterval(announce, 1200);
    };
    const syncHostLobby = () => {
        if (!session || session.role !== 'host')
            return;
        const stage = getStage(stageId);
        session.setHostLobby(stage.id, stage.character, true);
    };
    const startGuest = (target, start) => {
        if (target !== session)
            return;
        hidePanel(true);
        game.transitionTo(() => game.showOnlineGuest(start.stageId, start.p1, start.p2));
    };
    const startHost = (target) => {
        if (target !== session)
            return;
        const lobby = session?.lobby;
        const p2 = lobby?.guestChar;
        if (!p2 || !lobby?.guestReady || !session.peerConnected) {
            notice = 'AGUARDE O PARCEIRO ESCOLHER O PERSONAGEM E FICAR PRONTO.';
            renderRoom();
            return;
        }
        const stage = getStage(stageId);
        session.start(stage.id, stage.character, p2);
        hidePanel(true);
        game.transitionTo(() => game.showOnlineHost(stage.id, stage.character, p2));
    };
    const attachSession = (target) => {
        session = target;
        role = target.role;
        if (role === 'guest') {
            stageId = clamp(target.lobby?.stageId ?? stageId, 1, MAX_STAGE);
            if (!guestChar)
                guestChar = defaultGuestChar(getStage(stageId).character);
        }
        unsubs.push(target.on('status', () => {
            if (target !== session)
                return;
            if (mode === 'room')
                renderRoom();
        }));
        unsubs.push(target.on('lobby', (value) => {
            if (target !== session)
                return;
            const lobby = value;
            if (role === 'guest' && lobby) {
                stageId = clamp(lobby.stageId, 1, MAX_STAGE);
                const hero = getStage(stageId).character;
                const nextChar = guestCharTouched && guestChar ? guestChar : defaultGuestChar(hero);
                const nextReady = lobby.guestReady;
                // Só reenvia ao host quando algo mudou; `setGuestLobby` emite 'lobby'
                // de novo e sem essa guarda entraria em recursão.
                if (nextChar !== guestChar || nextReady !== guestReady) {
                    guestChar = nextChar;
                    guestReady = nextReady;
                    target.setGuestLobby(guestChar, guestReady);
                }
            }
            if (mode === 'room')
                renderRoom();
        }));
        unsubs.push(target.on('peer-connected', () => {
            if (target !== session)
                return;
            stopAnnounce();
            notice = '';
            if (mode === 'room')
                renderRoom();
        }));
        unsubs.push(target.on('peer-left', () => {
            if (target !== session)
                return;
            notice =
                role === 'host'
                    ? 'O PARCEIRO SAIU. O CÓDIGO CONTINUA VALENDO.'
                    : 'O HOST SAIU. FECHE A SALA PARA VOLTAR AO LOBBY.';
            if (mode === 'room')
                renderRoom();
        }));
        unsubs.push(target.on('start', (value) => {
            if (target !== session || role !== 'guest')
                return;
            const start = value;
            if (start)
                startGuest(target, start);
        }));
        if (role === 'host')
            syncHostLobby();
        else
            startAnnounce(target);
    };
    const detachSession = () => {
        stopAnnounce();
        for (const unsubscribe of unsubs)
            unsubscribe();
        unsubs.length = 0;
        session = null;
    };
    const hidePanel = (keepSession) => {
        if (!activePanel)
            return;
        activePanel = null;
        detachSession();
        document.body.classList.remove('account-open', 'ui-overlay-open');
        document.removeEventListener('keydown', onKeyDown, true);
        if (app) {
            if (previousAppHidden === null)
                app.removeAttribute('aria-hidden');
            else
                app.setAttribute('aria-hidden', previousAppHidden);
        }
        root.remove();
        if (!keepSession) {
            game.dropOnlineSession();
            previousFocus?.focus({ preventScroll: true });
        }
    };
    const closeFromUser = () => {
        if (mode === 'room' && session)
            session.leave();
        hidePanel(false);
    };
    const roomCode = () => session?.code ?? '-----';
    const renderEntry = () => {
        mode = 'entry';
        const disabled = busy ? 'disabled' : '';
        body.innerHTML = `
      <p id="online-desc" class="account-desc">
        Convide uma pessoa para a campanha. O host simula o capítulo e envia o estado;
        o convidado entra com o código curto. Cada jogador grava o próprio progresso neste aparelho.
      </p>
      <div class="online-entry">
        <article class="online-entry-card">
          <p class="account-save-kicker">HOST</p>
          <h3 class="account-subtitle">CRIAR SALA</h3>
          <p class="account-desc">Abrir uma sala privada e receber um código para compartilhar.</p>
          <button type="button" class="account-primary" data-action="create" ${disabled}>
            ${busy ? 'CONECTANDO…' : 'CRIAR SALA'}
          </button>
        </article>
        <article class="online-entry-card">
          <p class="account-save-kicker">CONVIDADO</p>
          <h3 class="account-subtitle">ENTRAR POR CÓDIGO</h3>
          <form class="account-form" data-form="join">
            <label class="account-field">
              <span>CÓDIGO DA SALA</span>
              <input type="text" name="code" inputmode="text" autocomplete="off" maxlength="8"
                placeholder="EX.: 7K2PD" ${busy ? 'disabled' : ''} />
            </label>
            <button type="submit" class="account-secondary" ${disabled}>ENTRAR NA SALA</button>
          </form>
        </article>
      </div>
      ${error ? `<p class="account-error" role="alert">${escapeHtml(error)}</p>` : ''}
      ${notice ? `<p class="account-notice" role="status">${escapeHtml(notice)}</p>` : ''}
      <p class="account-note">
        A sala usa o Supabase Realtime. O código é o convite: compartilhe apenas com seu parceiro.
        Sem matchmaking público nesta versão.
      </p>
    `;
        body.querySelector('input[name="code"]')?.focus({ preventScroll: true });
    };
    const guestOptions = (selected) => unlocked()
        .map((id) => `<option value="${id}" ${id === selected ? 'selected' : ''}>${escapeHtml(CHARACTERS[id].name.toUpperCase())}</option>`)
        .join('');
    const renderRoom = () => {
        if (!session) {
            renderEntry();
            return;
        }
        mode = 'room';
        const lobby = session.lobby;
        const connected = session.peerConnected;
        const host = session.role === 'host';
        const selectedStage = getStage(stageId);
        const partnerChar = lobby?.guestChar ?? null;
        if (!host) {
            const hero = getStage(clamp(lobby?.stageId ?? stageId, 1, MAX_STAGE)).character;
            if (!guestCharTouched || !guestChar)
                guestChar = defaultGuestChar(hero);
        }
        const stageOptions = Array.from({ length: clamp(game.save.maxStage, 1, MAX_STAGE) }, (_, index) => index + 1)
            .map((id) => `<option value="${id}" ${id === stageId ? 'selected' : ''}>CAP. ${String(id).padStart(2, '0')} · ${escapeHtml(getStage(id).subtitle.toUpperCase())}</option>`)
            .join('');
        const guestName = partnerChar ? CHARACTERS[partnerChar].name.toUpperCase() : '—';
        const canStartHost = connected && !!partnerChar && (lobby?.guestReady ?? false) && !busy;
        body.innerHTML = `
      <p id="online-desc" class="account-desc">
        ${host
            ? 'Compartilhe o código. Você comanda o capítulo e o save do seu aparelho; o convidado grava o progresso dele.'
            : 'Escolha seu Desperto e marque pronto. O host decide quando o capítulo começa.'}
      </p>
      <div class="online-code-row">
        <div>
          <p class="account-save-kicker">CÓDIGO DA SALA</p>
          <p class="online-code">${escapeHtml(roomCode())}</p>
        </div>
        <button type="button" class="account-secondary" data-action="copy">
          ${copyState ? escapeHtml(copyState) : 'COPIAR CÓDIGO'}
        </button>
      </div>
      <div class="online-room-status ${connected ? 'online' : ''}">
        <span class="online-dot"></span>
        ${escapeHtml(statusText(session.status, host))}
        ${host ? ` · ${connected ? 'PARCEIRO CONECTADO' : 'AGUARDANDO PARCEIRO'}` : ''}
      </div>
      ${host
            ? `
            <div class="online-grid">
              <label class="account-field">
                <span>CAPÍTULO (HOST)</span>
                <select name="stage" ${connected ? '' : ''}>${stageOptions}</select>
              </label>
              <div class="online-field-static">
                <span>P1 · HERÓI DO CAPÍTULO</span>
                <strong>${escapeHtml(CHARACTERS[selectedStage.character].name.toUpperCase())}</strong>
                <em>${escapeHtml(selectedStage.subtitle.toUpperCase())}</em>
              </div>
              <div class="online-field-static">
                <span>P2 · CONVIDADO</span>
                <strong>${escapeHtml(guestName)}</strong>
                <em>${lobby?.guestReady ? 'PRONTO' : connected ? 'ESCOLHENDO PERSONAGEM' : 'AGUARDANDO PARCEIRO'}</em>
              </div>
            </div>
            <button type="button" class="account-primary online-start" data-action="start" ${canStartHost ? '' : 'disabled'}>
              INICIAR CO-OP ONLINE
            </button>
            <p class="account-note">
              ${connected
                ? 'Quando o convidado ficar pronto, o capítulo começa para os dois.'
                : 'O convidado deve abrir MULTIJOGADOR → SALA PRIVADA ONLINE e digitar o código acima.'}
            </p>
          `
            : `
            <div class="online-grid">
              <div class="online-field-static">
                <span>CAPÍTULO DO HOST</span>
                <strong>CAP. ${String(clamp(lobby?.stageId ?? stageId, 1, MAX_STAGE)).padStart(2, '0')}</strong>
                <em>${escapeHtml(getStage(clamp(lobby?.stageId ?? stageId, 1, MAX_STAGE)).subtitle.toUpperCase())}</em>
              </div>
              <div class="online-field-static">
                <span>P1 · HOST</span>
                <strong>${escapeHtml(CHARACTERS[lobby?.p1 ?? getStage(stageId).character].name.toUpperCase())}</strong>
                <em>${lobby?.hostReady ? 'PRONTO' : 'AGUARDANDO'}</em>
              </div>
              <label class="account-field">
                <span>P2 · SEU DESPERTO</span>
                <select name="guestChar" ${connected ? '' : 'disabled'}>
                  ${guestOptions(guestChar ?? defaultGuestChar(selectedStage.character))}
                </select>
              </label>
            </div>
            <button type="button" class="account-${guestReady ? 'danger' : 'primary'} online-start" data-action="ready" ${connected ? '' : 'disabled'}>
              ${guestReady ? 'CANCELAR PRONTIDÃO' : 'ESTOU PRONTO'}
            </button>
            <p class="account-note">
              ${guestReady
                ? 'Pronto. O host pode iniciar o capítulo a qualquer momento.'
                : 'O save do host e o seu são gravados separadamente ao concluir o capítulo.'}
            </p>
          `}
      ${error ? `<p class="account-error" role="alert">${escapeHtml(error)}</p>` : ''}
      ${notice ? `<p class="account-notice" role="status">${escapeHtml(notice)}</p>` : ''}
    `;
    };
    const onKeyDown = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            closeFromUser();
            return;
        }
        if (event.key !== 'Tab')
            return;
        const items = Array.from(root.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), [href]')).filter((element) => element.offsetParent !== null);
        if (items.length === 0)
            return;
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
            closeFromUser();
        }
    });
    root.addEventListener('change', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLSelectElement))
            return;
        if (target.name === 'stage' && role === 'host') {
            stageId = clamp(Number(target.value) || 1, 1, MAX_STAGE);
            notice = '';
            syncHostLobby();
            renderRoom();
        }
        else if (target.name === 'guestChar' && role === 'guest' && session) {
            const value = target.value;
            if (CHARACTERS[value]) {
                guestChar = value;
                guestCharTouched = true;
                session.setGuestLobby(guestChar, guestReady);
                renderRoom();
            }
        }
    });
    root.addEventListener('submit', (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement))
            return;
        event.preventDefault();
        if (busy)
            return;
        const input = form.querySelector('input[name="code"]');
        const code = (input?.value ?? '').trim().toUpperCase();
        if (!/^[A-Z0-9]{4,8}$/.test(code)) {
            error = 'DIGITE O CÓDIGO DE 5 CARACTERES DA SALA.';
            renderEntry();
            return;
        }
        void joinRoom(code);
    });
    root.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Element))
            return;
        const action = target.closest('[data-action]')?.dataset.action;
        if (!action)
            return;
        if (action === 'copy') {
            void navigator.clipboard
                ?.writeText(roomCode())
                .then(() => {
                copyState = 'CÓDIGO COPIADO';
                renderRoom();
            })
                .catch(() => {
                copyState = 'COPIE MANUALMENTE';
                renderRoom();
            });
            return;
        }
        if (action === 'start' && session) {
            startHost(session);
            return;
        }
        if (action === 'ready' && session && role === 'guest') {
            guestReady = !guestReady;
            session.setGuestLobby(guestChar, guestReady);
            notice = guestReady ? 'PRONTO! AGUARDE O HOST INICIAR.' : '';
            renderRoom();
            return;
        }
        if (action === 'create') {
            void createRoom();
        }
    });
    const createRoom = async () => {
        if (busy)
            return;
        busy = true;
        error = '';
        notice = '';
        renderEntry();
        const target = new OnlineSession('host');
        try {
            game.onlineSession = target;
            await target.connect();
            busy = false;
            mode = 'room';
            attachSession(target);
            renderRoom();
        }
        catch (err) {
            busy = false;
            game.dropOnlineSession();
            error = err instanceof Error ? err.message : 'Não foi possível criar a sala.';
            renderEntry();
        }
    };
    const joinRoom = async (code) => {
        if (busy)
            return;
        busy = true;
        error = '';
        notice = '';
        renderEntry();
        const target = new OnlineSession('guest', code);
        try {
            game.onlineSession = target;
            await target.connect();
            busy = false;
            role = 'guest';
            mode = 'room';
            attachSession(target);
            renderRoom();
        }
        catch (err) {
            busy = false;
            game.dropOnlineSession();
            error = err instanceof Error ? err.message : 'Sala indisponível. Confira o código.';
            renderEntry();
        }
    };
    document.body.append(root);
    document.body.classList.add('account-open', 'ui-overlay-open');
    app?.setAttribute('aria-hidden', 'true');
    document.addEventListener('keydown', onKeyDown, true);
    activePanel = root;
    if (game.onlineSession) {
        attachSession(game.onlineSession);
        renderRoom();
    }
    else {
        renderEntry();
    }
    return true;
}
//# sourceMappingURL=online-panel.js.map