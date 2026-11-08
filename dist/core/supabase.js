/**
 * Cliente mínimo do Supabase (Auth + PostgREST) sem SDK.
 *
 * Mantém o jogo leve e sem dependências extras. A chave publishable/anon é
 * pública; a proteção dos saves vem das políticas RLS criadas em
 * `supabase/schema.sql`.
 */
import { sanitizeSave } from './save.js?v=be05988e5819';
import { isCloudConfigured, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './cloud-config.js?v=be05988e5819';
export class CloudError extends Error {
    constructor(message, status = 0, code = '') {
        super(message);
        this.status = status;
        this.code = code;
        this.name = 'CloudError';
    }
}
const SESSION_KEY = 'ferrato_cloud_session_v1';
const REQUEST_TIMEOUT = 15000;
function saveStoredSession(session) {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    catch {
        // Armazenamento indisponível: a sessão continua válida só nesta aba.
    }
}
export function loadStoredSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        if (typeof parsed.accessToken !== 'string' ||
            typeof parsed.refreshToken !== 'string' ||
            typeof parsed.expiresAt !== 'number' ||
            typeof parsed.user?.id !== 'string' ||
            typeof parsed.user?.email !== 'string') {
            return null;
        }
        return {
            accessToken: parsed.accessToken,
            refreshToken: parsed.refreshToken,
            expiresAt: parsed.expiresAt,
            user: { id: parsed.user.id, email: parsed.user.email },
        };
    }
    catch {
        return null;
    }
}
export function clearStoredSession() {
    try {
        localStorage.removeItem(SESSION_KEY);
    }
    catch {
        // Ignora armazenamento indisponível.
    }
}
async function request(path, options = {}) {
    if (!isCloudConfigured()) {
        throw new CloudError('A nuvem não está configurada neste build.', 0, 'not_configured');
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), options.timeout ?? REQUEST_TIMEOUT);
    try {
        const headers = {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${options.token ?? SUPABASE_PUBLISHABLE_KEY}`,
            ...options.headers,
        };
        if (options.body !== undefined)
            headers['Content-Type'] = 'application/json';
        const response = await fetch(`${SUPABASE_URL}${path}`, {
            method: options.method ?? 'GET',
            headers,
            body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
            signal: controller.signal,
            keepalive: options.keepalive === true,
        });
        if (!response.ok) {
            let json = null;
            try {
                json = (await response.json());
            }
            catch {
                // Resposta sem JSON (ex.: erro de proxy).
            }
            const message = json?.error_description ||
                json?.msg ||
                json?.message ||
                json?.error ||
                `A nuvem respondeu com erro ${response.status}.`;
            throw new CloudError(message, response.status, json?.error_code ?? json?.code ?? json?.error ?? '');
        }
        return response;
    }
    catch (error) {
        if (error instanceof CloudError)
            throw error;
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new CloudError('A nuvem demorou para responder. Tente novamente.', 0, 'timeout');
        }
        throw new CloudError('Sem conexão com a nuvem. Verifique sua internet.', 0, 'network');
    }
    finally {
        window.clearTimeout(timeout);
    }
}
function sessionFromAuth(json) {
    if (typeof json.access_token !== 'string' ||
        typeof json.refresh_token !== 'string' ||
        typeof json.user?.id !== 'string' ||
        typeof json.user?.email !== 'string') {
        return null;
    }
    const expiresAt = typeof json.expires_at === 'number'
        ? json.expires_at * 1000
        : Date.now() + (typeof json.expires_in === 'number' ? json.expires_in : 3600) * 1000;
    return {
        accessToken: json.access_token,
        refreshToken: json.refresh_token,
        expiresAt,
        user: { id: json.user.id, email: json.user.email },
    };
}
/** Cria a conta. Com confirmação de e-mail ligada, retorna `needsConfirmation`. */
export async function signUp(email, password) {
    // Devolve o link de confirmação para a origem atual (quando permitido no
    // painel do Supabase). Sem isso, o Supabase usa o Site URL do projeto.
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const query = new URLSearchParams({ redirect_to: redirectTo });
    const response = await request(`/auth/v1/signup?${query.toString()}`, {
        method: 'POST',
        body: { email, password },
    });
    const json = (await response.json());
    const session = sessionFromAuth(json);
    if (session) {
        saveStoredSession(session);
        return { session, needsConfirmation: false };
    }
    return { session: null, needsConfirmation: true };
}
export async function signIn(email, password) {
    const response = await request('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: { email, password },
    });
    const json = (await response.json());
    const session = sessionFromAuth(json);
    if (!session)
        throw new CloudError('Resposta de login inválida.', 0, 'invalid_response');
    saveStoredSession(session);
    return session;
}
export async function refreshSession(session) {
    const response = await request('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        body: { refresh_token: session.refreshToken },
    });
    const json = (await response.json());
    const next = sessionFromAuth(json);
    if (!next)
        throw new CloudError('Sessão expirada. Entre novamente.', 401, 'invalid_session');
    saveStoredSession(next);
    return next;
}
/** Recupera a sessão salva e renova o token quando estiver perto de expirar. */
export async function restoreSession() {
    const stored = loadStoredSession();
    if (!stored)
        return null;
    if (stored.expiresAt > Date.now() + 60000)
        return stored;
    try {
        return await refreshSession(stored);
    }
    catch (error) {
        // Sem internet: mantém a sessão para tentar de novo numa próxima ação.
        if (error instanceof CloudError && (error.status === 0 || error.status >= 500))
            return stored;
        clearStoredSession();
        return null;
    }
}
export async function signOut(session) {
    if (session) {
        try {
            await request('/auth/v1/logout', { method: 'POST', token: session.accessToken });
        }
        catch {
            // O logout local deve acontecer mesmo se a rede falhar.
        }
    }
    clearStoredSession();
}
export async function getUser(session) {
    const response = await request('/auth/v1/user', { token: session.accessToken });
    const json = (await response.json());
    if (typeof json.id !== 'string' || typeof json.email !== 'string') {
        throw new CloudError('Conta inválida. Entre novamente.', 401, 'invalid_user');
    }
    return { id: json.id, email: json.email };
}
export async function requestPasswordReset(email, redirectTo) {
    const query = new URLSearchParams({ redirect_to: redirectTo });
    await request(`/auth/v1/recover?${query.toString()}`, {
        method: 'POST',
        body: { email },
    });
}
export async function updatePassword(session, password) {
    await request('/auth/v1/user', {
        method: 'PUT',
        token: session.accessToken,
        body: { password },
    });
}
/**
 * Consome o hash devolvido pelo Supabase em links de confirmação/recuperação.
 * Os tokens são removidos da barra de endereço antes de qualquer await.
 */
export async function consumeAuthHash() {
    if (typeof window === 'undefined')
        return null;
    const raw = window.location.hash.replace(/^#/, '');
    if (!raw)
        return null;
    const params = new URLSearchParams(raw);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type') ?? '';
    const errorDescription = params.get('error_description');
    if (!accessToken && !errorDescription)
        return null;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    if (errorDescription) {
        throw new CloudError(errorDescription, 400, params.get('error') ?? 'auth_redirect');
    }
    if (!accessToken || !refreshToken)
        return null;
    const expiresIn = Number(params.get('expires_in') ?? 3600);
    const expiresAt = Number(params.get('expires_at') ?? 0) * 1000 || Date.now() + expiresIn * 1000;
    const provisional = {
        accessToken,
        refreshToken,
        expiresAt,
        user: { id: '', email: '' },
    };
    const user = await getUser(provisional);
    const session = { ...provisional, user };
    saveStoredSession(session);
    return { session, type };
}
function rowUpdatedAt(value, fallback) {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
export async function downloadCloudSave(session) {
    const query = new URLSearchParams({
        select: 'save_data,client_updated_at,updated_at',
        user_id: `eq.${session.user.id}`,
        limit: '1',
    });
    const response = await request(`/rest/v1/game_saves?${query.toString()}`, {
        token: session.accessToken,
        headers: { Accept: 'application/json' },
    });
    const rows = (await response.json());
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row)
        return null;
    return {
        save: sanitizeSave(row.save_data),
        clientUpdatedAt: rowUpdatedAt(row.client_updated_at, 0),
        serverUpdatedAt: typeof row.updated_at === 'string' ? row.updated_at : '',
    };
}
export async function uploadCloudSave(session, save, clientUpdatedAt) {
    const query = new URLSearchParams({ on_conflict: 'user_id' });
    const response = await request(`/rest/v1/game_saves?${query.toString()}`, {
        method: 'POST',
        token: session.accessToken,
        headers: {
            Accept: 'application/json',
            Prefer: 'resolution=merge-duplicates,return=representation',
        },
        keepalive: true,
        body: {
            user_id: session.user.id,
            save_data: save,
            client_updated_at: clientUpdatedAt,
            updated_at: new Date().toISOString(),
        },
    });
    const rows = (await response.json());
    const row = Array.isArray(rows) ? rows[0] : null;
    return {
        save: row ? sanitizeSave(row.save_data) : save,
        clientUpdatedAt: row ? rowUpdatedAt(row.client_updated_at, clientUpdatedAt) : clientUpdatedAt,
        serverUpdatedAt: row?.updated_at ?? new Date().toISOString(),
    };
}
//# sourceMappingURL=supabase.js.map