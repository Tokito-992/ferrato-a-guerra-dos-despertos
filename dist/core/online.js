/**
 * Co-op online por sala privada.
 *
 * O host é autoritativo: simula o capítulo com os dois jogadores e envia
 * snapshots periódicos. O convidado envia apenas a própria entrada e desenha o
 * estado recebido. Cada cliente grava o próprio save localmente.
 *
 * O transporte usa Supabase Realtime (canais de broadcast) sem SDK: são dois
 * WebSockets Phoenix, um por jogador. A chave publishable é pública e o código
 * curto da sala funciona como convite.
 */
import { CHARACTERS } from '../data/characters.js?v=1400d032a431';
import { isCloudConfigured, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './cloud-config.js?v=1400d032a431';
/** Bits de entrada enviados pelo convidado, na ordem fixa abaixo. */
export const NET_ACTIONS = [
    'left',
    'right',
    'jump',
    'attack',
    'heavy',
    'dash',
    'ability',
];
export function packInput(input, player = 0) {
    let down = 0;
    let pressed = 0;
    NET_ACTIONS.forEach((action, index) => {
        const bit = 1 << index;
        if (input.isDown(action, player))
            down |= bit;
        if (input.pressed(action, player))
            pressed |= bit;
    });
    return { down, pressed };
}
export function unpackInput(down, pressed) {
    const downActions = [];
    const pressedActions = [];
    NET_ACTIONS.forEach((action, index) => {
        const bit = 1 << index;
        if (down & bit)
            downActions.push(action);
        if (pressed & bit)
            pressedActions.push(action);
    });
    return { down: downActions, pressed: pressedActions };
}
function randomCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(5);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    }
    else {
        for (let i = 0; i < bytes.length; i++)
            bytes[i] = Math.floor(Math.random() * 256);
    }
    let out = '';
    for (const byte of bytes)
        out += alphabet[byte % alphabet.length];
    return out;
}
/**
 * Conexão de um jogador com um canal privado. O código da sala é o convite;
 * qualquer pessoa com o código pode entrar (por isso ele deve ser compartilhado
 * apenas com o parceiro).
 */
export class RoomConnection {
    constructor(role, code, callbacks = {}) {
        this.ws = null;
        this.topic = '';
        this.ref = 0;
        this.heartbeat = null;
        this.watchdog = null;
        this.lastPeerAt = 0;
        this.joined = false;
        this.closedByUser = false;
        this.peerWasPresent = false;
        this.role = role;
        this.code = code.trim().toUpperCase();
        this.callbacks = callbacks;
    }
    get connected() {
        return this.joined && this.ws?.readyState === WebSocket.OPEN;
    }
    get peerPresent() {
        return this.peerWasPresent;
    }
    connect() {
        return new Promise((resolve, reject) => {
            if (!isCloudConfigured()) {
                reject(new Error('A nuvem não está configurada neste build.'));
                return;
            }
            if (!this.code || !/^[A-Z0-9]{4,8}$/.test(this.code)) {
                reject(new Error('Código de sala inválido.'));
                return;
            }
            this.callbacks.onStatus?.('connecting');
            const base = SUPABASE_URL.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
            const url = `${base}/realtime/v1/websocket?apikey=${encodeURIComponent(SUPABASE_PUBLISHABLE_KEY)}` +
                '&vsn=1.0.0';
            this.topic = `realtime:ferrato-room-${this.code}`;
            let settled = false;
            let socket;
            try {
                socket = new WebSocket(url);
            }
            catch {
                this.callbacks.onStatus?.('error', 'Não foi possível abrir a conexão.');
                reject(new Error('Não foi possível abrir a conexão.'));
                return;
            }
            this.ws = socket;
            const timer = window.setTimeout(() => {
                if (settled)
                    return;
                settled = true;
                try {
                    socket.close();
                }
                catch {
                    // Socket já fechado.
                }
                this.callbacks.onStatus?.('error', 'A sala demorou para responder.');
                reject(new Error('A sala demorou para responder.'));
            }, 12000);
            socket.onopen = () => {
                // O join é um frame Phoenix de primeira classe; não pode ser embrulhado
                // no envelope de broadcast usado pelos eventos de jogo.
                const join = {
                    topic: this.topic,
                    event: 'phx_join',
                    payload: {
                        config: {
                            broadcast: { self: false },
                            presence: { key: `${this.role}-${Math.random().toString(36).slice(2, 10)}` },
                        },
                    },
                    ref: String(++this.ref),
                };
                try {
                    socket.send(JSON.stringify(join));
                }
                catch {
                    // O timeout de conexão cobre uma falha de envio.
                }
            };
            socket.onmessage = (event) => {
                let message;
                try {
                    message = JSON.parse(String(event.data));
                }
                catch {
                    return;
                }
                this.receive(message, () => {
                    if (settled)
                        return;
                    settled = true;
                    window.clearTimeout(timer);
                    this.afterJoin();
                    resolve();
                }, (error) => {
                    if (settled)
                        return;
                    settled = true;
                    window.clearTimeout(timer);
                    reject(error);
                });
            };
            socket.onerror = () => {
                if (!settled) {
                    settled = true;
                    window.clearTimeout(timer);
                    reject(new Error('Não foi possível entrar na sala.'));
                }
                this.callbacks.onStatus?.('error', 'A conexão com a sala falhou.');
            };
            socket.onclose = () => {
                window.clearTimeout(timer);
                this.stopTimers();
                const wasJoined = this.joined;
                this.joined = false;
                this.ws = null;
                if (!settled) {
                    settled = true;
                    reject(new Error('A sala foi encerrada antes da conexão.'));
                    return;
                }
                if (this.closedByUser) {
                    this.callbacks.onStatus?.('closed');
                }
                else if (wasJoined) {
                    this.callbacks.onStatus?.('peer-left', 'A conexão com a sala foi perdida.');
                    this.callbacks.onPeerLeft?.('A conexão com a sala foi perdida.');
                }
            };
        });
    }
    receive(message, connected, failed) {
        if (message.event === 'phx_reply' && message.payload?.status) {
            const status = message.payload.status;
            if (status === 'ok' && !this.joined) {
                this.joined = true;
                connected();
            }
            else if (status !== 'ok' && !this.joined) {
                failed(new Error('Sala indisponível. Confira o código.'));
            }
            return;
        }
        if (message.event === 'broadcast') {
            const innerEvent = message.payload?.event;
            const payload = message.payload?.payload;
            if (typeof innerEvent !== 'string')
                return;
            // Qualquer tráfego do parceiro mantém a presença viva.
            this.lastPeerAt = Date.now();
            this.peerWasPresent = true;
            if (innerEvent === 'ping') {
                this.send('pong', {});
                return;
            }
            if (innerEvent === 'pong')
                return;
            if (innerEvent === 'bye') {
                this.peerWasPresent = false;
                this.callbacks.onPeerLeft?.('O parceiro saiu da sala.');
                return;
            }
            this.callbacks.onMessage?.(innerEvent, payload);
            return;
        }
        if (message.event === 'phx_error' || message.event === 'phx_close') {
            if (this.joined && !this.closedByUser) {
                this.callbacks.onStatus?.('peer-left', 'A sala foi encerrada.');
                this.callbacks.onPeerLeft?.('A sala foi encerrada.');
            }
        }
    }
    afterJoin() {
        this.callbacks.onStatus?.(this.role === 'host' ? 'waiting' : 'connected');
        this.heartbeat = window.setInterval(() => {
            if (!this.connected)
                return;
            this.send('ping', {});
        }, 2500);
        this.watchdog = window.setInterval(() => {
            if (!this.joined || this.closedByUser)
                return;
            // O host anuncia-se com frequência; o convidado também. Se o outro lado
            // ficou em silêncio, a sala está morta.
            if (this.lastPeerAt > 0 && Date.now() - this.lastPeerAt > 8000) {
                this.lastPeerAt = 0;
                this.peerWasPresent = false;
                this.callbacks.onStatus?.('peer-left', 'O parceiro perdeu a conexão.');
                this.callbacks.onPeerLeft?.('O parceiro perdeu a conexão.');
            }
        }, 2000);
    }
    stopTimers() {
        if (this.heartbeat !== null)
            window.clearInterval(this.heartbeat);
        if (this.watchdog !== null)
            window.clearInterval(this.watchdog);
        this.heartbeat = null;
        this.watchdog = null;
    }
    /** Envia um broadcast de jogo; ignora quando a conexão ainda não abriu. */
    send(event, payload) {
        const socket = this.ws;
        if (!socket || socket.readyState !== WebSocket.OPEN)
            return;
        const message = {
            topic: this.topic,
            event: 'broadcast',
            payload: { type: 'broadcast', event, payload },
            ref: String(++this.ref),
        };
        try {
            socket.send(JSON.stringify(message));
        }
        catch {
            // Uma mensagem perdida não deve quebrar o loop; o próximo ping detecta.
        }
    }
    /** Despede-se e fecha o canal. */
    close(notify = true) {
        if (this.closedByUser)
            return;
        this.closedByUser = true;
        this.stopTimers();
        if (notify)
            this.send('bye', {});
        this.joined = false;
        const socket = this.ws;
        this.ws = null;
        if (socket) {
            window.setTimeout(() => {
                try {
                    socket.close();
                }
                catch {
                    // Já fechado.
                }
            }, 30);
        }
        this.callbacks.onStatus?.('closed');
    }
}
/**
 * Sessão de uma sala: concentra o estado do lobby e o protocolo de jogo em
 * cima do transporte. O host abre a sala, o convidado entra com o código.
 */
export class OnlineSession {
    constructor(role, code = randomCode()) {
        this.listeners = new Map();
        this._status = 'connecting';
        this._peerConnected = false;
        this.lobbyState = null;
        this.role = role;
        this.code = role === 'host' ? code : code.trim().toUpperCase();
        this.room = new RoomConnection(role, this.code, {
            onStatus: (status, detail) => {
                this._status = status;
                if (status === 'peer-left' || status === 'closed' || status === 'error') {
                    this._peerConnected = false;
                }
                this.emit('status', { status, detail });
            },
            onPeerLeft: (detail) => {
                this._peerConnected = false;
                this._status = 'peer-left';
                this.resetGuestLobby();
                this.emit('peer-left', detail);
            },
            onMessage: (event, payload) => this.handleMessage(event, payload),
        });
    }
    get status() {
        return this._status;
    }
    get peerConnected() {
        return this._peerConnected;
    }
    get lobby() {
        return this.lobbyState;
    }
    on(event, listener) {
        let set = this.listeners.get(event);
        if (!set) {
            set = new Set();
            this.listeners.set(event, set);
        }
        set.add(listener);
        return () => {
            set?.delete(listener);
        };
    }
    emit(event, value) {
        const set = this.listeners.get(event);
        if (!set)
            return;
        for (const listener of set) {
            try {
                listener(value);
            }
            catch {
                // Um listener quebrado não pode derrubar a rede.
            }
        }
    }
    handleMessage(event, payload) {
        const data = (payload ?? {});
        switch (event) {
            case 'hello': {
                if (this.role === 'host') {
                    this._peerConnected = true;
                    this._status = 'connected';
                    const guestChar = typeof data.guestChar === 'string' ? data.guestChar : null;
                    const guestReady = data.guestReady === true;
                    if (this.lobbyState) {
                        this.lobbyState = {
                            ...this.lobbyState,
                            guestChar: guestChar ?? this.lobbyState.guestChar,
                            guestReady,
                        };
                    }
                    // Reenvia o estado completo para o convidado que acabou de entrar.
                    this.sendHostLobby();
                    this.welcomeGuest();
                    this.emit('lobby', this.lobbyState);
                    this.emit('peer-connected', null);
                }
                return;
            }
            case 'welcome': {
                if (this.role !== 'guest')
                    return;
                this._peerConnected = true;
                const stageId = Number(data.stageId);
                const p1 = data.p1;
                if (Number.isFinite(stageId) && typeof p1 === 'string') {
                    this.lobbyState = {
                        stageId: Math.max(1, Math.floor(stageId)),
                        p1: p1,
                        guestChar: this.lobbyState?.guestChar ?? null,
                        hostReady: data.hostReady === true,
                        guestReady: this.lobbyState?.guestReady ?? false,
                    };
                    this.emit('lobby', this.lobbyState);
                }
                this.emit('peer-connected', null);
                return;
            }
            case 'lobby': {
                if (this.role !== 'guest')
                    return;
                this._peerConnected = true;
                const stageId = Number(data.stageId);
                if (Number.isFinite(stageId)) {
                    this.lobbyState = {
                        stageId: Math.max(1, Math.floor(stageId)),
                        p1: typeof data.p1 === 'string' ? data.p1 : this.lobbyState?.p1 ?? 'ravi',
                        guestChar: this.lobbyState?.guestChar ?? null,
                        hostReady: data.hostReady === true,
                        guestReady: this.lobbyState?.guestReady ?? false,
                    };
                    this.emit('lobby', this.lobbyState);
                }
                return;
            }
            case 'guest': {
                if (this.role !== 'host')
                    return;
                this._peerConnected = true;
                const guestChar = typeof data.guestChar === 'string' ? data.guestChar : null;
                if (this.lobbyState) {
                    this.lobbyState = {
                        ...this.lobbyState,
                        guestChar,
                        guestReady: data.guestReady === true,
                    };
                    this.emit('lobby', this.lobbyState);
                }
                return;
            }
            case 'start': {
                if (this.role !== 'guest')
                    return;
                const start = readStart(data);
                if (start) {
                    this._peerConnected = true;
                    this.emit('start', start);
                }
                return;
            }
            case 'restart': {
                if (this.role !== 'guest')
                    return;
                const start = readStart(data);
                if (start)
                    this.emit('restart', start);
                return;
            }
            case 'input': {
                if (this.role !== 'host')
                    return;
                const down = Number(data.down) || 0;
                const pressed = Number(data.pressed) || 0;
                this.emit('input', { down, pressed });
                return;
            }
            case 'snapshot': {
                if (this.role !== 'guest')
                    return;
                if (data.s && typeof data.s === 'object')
                    this.emit('snapshot', data.s);
                return;
            }
            case 'pause': {
                if (this.role !== 'guest')
                    return;
                this.emit('pause', data.paused === true);
                return;
            }
            case 'pause-request':
            case 'restart-request':
            case 'resume-request': {
                if (this.role !== 'host')
                    return;
                this.emit(event, null);
                return;
            }
            case 'stage-clear': {
                if (this.role !== 'guest')
                    return;
                const stageId = Number(data.stageId);
                if (Number.isFinite(stageId))
                    this.emit('stage-clear', Math.floor(stageId));
                return;
            }
            case 'lobby-return': {
                if (this.role !== 'guest')
                    return;
                const stageId = Number(data.stageId);
                if (Number.isFinite(stageId)) {
                    this.lobbyState = {
                        stageId: Math.max(1, Math.floor(stageId)),
                        p1: typeof data.p1 === 'string' ? data.p1 : this.lobbyState?.p1 ?? 'ravi',
                        guestChar: this.lobbyState?.guestChar ?? null,
                        hostReady: false,
                        guestReady: false,
                    };
                    this.emit('lobby', this.lobbyState);
                }
                this.emit('lobby-return', {
                    stageId: Number.isFinite(stageId) ? Math.floor(stageId) : null,
                    cleared: data.cleared === true,
                });
                return;
            }
            case 'leave': {
                this._peerConnected = false;
                this._status = 'peer-left';
                this.resetGuestLobby();
                this.emit('status', { status: 'peer-left', detail: 'O parceiro saiu da sala.' });
                this.emit('peer-left', 'O parceiro saiu da sala.');
                return;
            }
            default:
                return;
        }
    }
    async connect() {
        await this.room.connect();
    }
    /** Host: define o capítulo e o herói da party e envia ao convidado. */
    setHostLobby(stageId, p1, hostReady = false) {
        if (this.role !== 'host')
            return;
        this.lobbyState = {
            stageId,
            p1,
            guestChar: this.lobbyState?.guestChar ?? null,
            hostReady,
            guestReady: this.lobbyState?.guestReady ?? false,
        };
        this.sendHostLobby();
        this.emit('lobby', this.lobbyState);
    }
    sendHostLobby() {
        if (this.role !== 'host' || !this.lobbyState)
            return;
        this.room.send('lobby', {
            stageId: this.lobbyState.stageId,
            p1: this.lobbyState.p1,
            hostReady: this.lobbyState.hostReady,
        });
    }
    /** Host: esquece personagem/prontidão do convidado que saiu. */
    resetGuestLobby() {
        if (this.role !== 'host' || !this.lobbyState)
            return;
        if (this.lobbyState.guestChar === null && !this.lobbyState.guestReady)
            return;
        this.lobbyState = {
            ...this.lobbyState,
            guestChar: null,
            guestReady: false,
        };
        this.emit('lobby', this.lobbyState);
    }
    /** Convidado: informa personagem escolhido e prontidão. */
    setGuestLobby(guestChar, guestReady = false) {
        if (this.role !== 'guest')
            return;
        if (this.lobbyState) {
            this.lobbyState = { ...this.lobbyState, guestChar, guestReady };
        }
        else {
            this.lobbyState = { stageId: 1, p1: 'ravi', guestChar, hostReady: false, guestReady };
        }
        this.room.send('guest', { guestChar, guestReady });
        this.emit('lobby', this.lobbyState);
    }
    /** Convidado: apresenta-se assim que entra; repete até receber o welcome. */
    announceGuest(guestChar, guestReady) {
        if (this.role !== 'guest')
            return;
        this.room.send('hello', { guestChar, guestReady });
    }
    /** Host aceita um convidado que já se apresentou. */
    welcomeGuest() {
        if (this.role !== 'host' || !this.lobbyState)
            return;
        this._peerConnected = true;
        this.room.send('welcome', {
            stageId: this.lobbyState.stageId,
            p1: this.lobbyState.p1,
            hostReady: this.lobbyState.hostReady,
        });
    }
    start(stageId, p1, p2) {
        if (this.role !== 'host')
            return;
        this.lobbyState = {
            stageId,
            p1,
            guestChar: p2,
            hostReady: true,
            guestReady: true,
        };
        this.room.send('start', { stageId, p1, p2 });
    }
    restart(stageId, p1, p2) {
        if (this.role !== 'host')
            return;
        this.room.send('restart', { stageId, p1, p2 });
    }
    sendInput(down, pressed) {
        if (this.role !== 'guest')
            return;
        this.room.send('input', { down, pressed });
    }
    sendSnapshot(snapshot) {
        if (this.role !== 'host')
            return;
        this.room.send('snapshot', { s: snapshot });
    }
    setPaused(paused) {
        if (this.role !== 'host')
            return;
        this.room.send('pause', { paused });
    }
    requestPause() {
        if (this.role === 'guest')
            this.room.send('pause-request', {});
    }
    requestResume() {
        if (this.role === 'guest')
            this.room.send('resume-request', {});
    }
    requestRestart() {
        if (this.role === 'guest')
            this.room.send('restart-request', {});
    }
    /** Host avisa que o capítulo terminou; o convidado grava o próprio save. */
    stageClear(stageId) {
        if (this.role !== 'host')
            return;
        this.room.send('stage-clear', { stageId });
    }
    /** Host volta a sala ao lobby depois de um capítulo. */
    lobbyReturn(stageId, p1, cleared = false) {
        if (this.role !== 'host')
            return;
        if (this.lobbyState) {
            this.lobbyState = {
                ...this.lobbyState,
                stageId,
                p1,
                hostReady: false,
                guestReady: false,
            };
            this.emit('lobby', this.lobbyState);
        }
        this.room.send('lobby-return', { stageId, p1, cleared });
    }
    leave() {
        this.room.close(true);
        this._status = 'closed';
        this._peerConnected = false;
    }
    dispose() {
        this.room.close(false);
        this.listeners.clear();
    }
}
function readStart(data) {
    const stageId = Number(data.stageId);
    const p1 = data.p1;
    const p2 = data.p2;
    if (!Number.isFinite(stageId) || typeof p1 !== 'string' || typeof p2 !== 'string')
        return null;
    if (!(p1 in CHARACTERS) || !(p2 in CHARACTERS))
        return null;
    return {
        stageId: Math.max(1, Math.min(42, Math.floor(stageId))),
        p1: p1,
        p2: p2,
    };
}
export { randomCode };
//# sourceMappingURL=online.js.map