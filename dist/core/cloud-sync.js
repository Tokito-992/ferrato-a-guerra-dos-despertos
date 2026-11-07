/**
 * Sincronização do save local com a conta Supabase.
 *
 * Regras de segurança contra perda de progresso:
 * - entrar numa conta com save na nuvem nunca substitui nada sozinho;
 * - se a nuvem estiver mais recente, o upload automático fica bloqueado;
 * - o jogador escolhe explicitamente qual save manter.
 */
import { isCloudConfigured } from './cloud-config.js?v=89d06180c01f';
import { CloudError, clearStoredSession, consumeAuthHash, downloadCloudSave, refreshSession as refreshSessionApi, requestPasswordReset as requestPasswordResetApi, restoreSession, signIn as signInApi, signOut as signOutApi, signUp as signUpApi, updatePassword as updatePasswordApi, uploadCloudSave, } from './supabase.js?v=89d06180c01f';
import { localSaveUpdatedAt, markLocalSaveUpdated } from './save.js?v=89d06180c01f';
/** Margem para evitar que diferenças de relógio entre aparelhos causem falsos conflitos. */
const CONFLICT_THRESHOLD_MS = 1500;
const UPLOAD_DEBOUNCE_MS = 1600;
function describeError(error) {
    if (!(error instanceof CloudError)) {
        return 'Não foi possível conectar à nuvem. Tente novamente.';
    }
    const text = error.message.toLowerCase();
    if (error.code === 'not_configured')
        return 'A nuvem não está configurada neste build.';
    if (error.code === 'invalid_credentials' || text.includes('invalid login credentials')) {
        return 'E-mail ou senha incorretos.';
    }
    if (text.includes('email not confirmed')) {
        return 'Confirme seu e-mail antes de entrar. Verifique a caixa de entrada e o spam.';
    }
    if (text.includes('already registered') || text.includes('already exists')) {
        return 'Este e-mail já tem uma conta. Use a aba Entrar.';
    }
    if (text.includes('password should be at least') || text.includes('password is too short')) {
        return 'A senha precisa ter pelo menos 6 caracteres.';
    }
    if (text.includes('rate limit') || error.status === 429) {
        return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    }
    if (error.code === '42501' || text.includes('permission denied')) {
        return 'Sem permissão para acessar o save na nuvem. Confira as políticas RLS do Supabase.';
    }
    if (error.code === 'PGRST205' || text.includes('could not find the table')) {
        return 'A tabela de saves não existe. Rode o SQL de configuração no Supabase.';
    }
    if (error.status === 401)
        return 'Sessão expirada. Entre novamente.';
    return error.message || 'Erro na nuvem. Tente novamente.';
}
class CloudSync {
    constructor() {
        this.host = null;
        this.session = null;
        this.initialized = false;
        this.initPromise = null;
        this.busy = false;
        this.conflictRecord = null;
        this.cloudRecord = null;
        this.cloudNewer = false;
        this.recovery = false;
        this.lastError = null;
        this.lastSyncedAt = null;
        this.uploadTimer = null;
        this.listeners = new Set();
    }
    attach(host) {
        this.host = host;
    }
    get configured() {
        return isCloudConfigured();
    }
    get signedIn() {
        return this.session !== null;
    }
    get email() {
        return this.session?.user.email ?? null;
    }
    get recoveryMode() {
        return this.recovery;
    }
    get conflict() {
        return this.conflictRecord;
    }
    get cloudSave() {
        return this.cloudRecord;
    }
    get localSave() {
        return this.host?.getSave() ?? null;
    }
    get localUpdatedAt() {
        return localSaveUpdatedAt();
    }
    get lastSync() {
        return this.lastSyncedAt;
    }
    get snapshot() {
        return {
            configured: this.configured,
            signedIn: this.signedIn,
            email: this.email,
            busy: this.busy,
            conflict: this.conflictRecord !== null,
            cloudNewer: this.cloudNewer,
            recovery: this.recovery,
            lastError: this.lastError,
            lastSyncedAt: this.lastSyncedAt,
        };
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    notify() {
        this.host?.onCloudStateChange();
        for (const listener of this.listeners) {
            try {
                listener();
            }
            catch {
                // Um listener quebrado não pode derrubar a sincronização.
            }
        }
    }
    clearUploadTimer() {
        if (this.uploadTimer === null)
            return;
        window.clearTimeout(this.uploadTimer);
        this.uploadTimer = null;
    }
    init() {
        if (this.initPromise)
            return this.initPromise;
        this.initPromise = this.runInit();
        return this.initPromise;
    }
    async runInit() {
        if (this.initialized || !this.configured) {
            this.initialized = true;
            this.notify();
            return { recovery: this.recovery, confirmed: false };
        }
        this.initialized = true;
        this.busy = true;
        this.lastError = null;
        this.notify();
        try {
            const redirect = await consumeAuthHash();
            const session = redirect?.session ?? (await restoreSession());
            if (!session) {
                this.busy = false;
                this.notify();
                return { recovery: false, confirmed: false };
            }
            this.session = session;
            if (redirect?.type === 'recovery') {
                this.recovery = true;
                this.busy = false;
                this.notify();
                return { recovery: true, confirmed: false };
            }
            await this.bootstrapCloud();
            return { recovery: false, confirmed: redirect?.type === 'signup' };
        }
        catch (error) {
            // Um link expirado não pode apagar uma sessão válida já salva.
            this.busy = false;
            this.lastError = describeError(error);
            this.notify();
            return { recovery: false, confirmed: false };
        }
    }
    /**
     * Executa uma chamada autenticada e, se o token tiver expirado durante uma
     * sessão longa, renova a sessão e tenta mais uma vez.
     */
    async withSession(action) {
        if (!this.session) {
            throw new CloudError('Entre na sua conta para salvar na nuvem.', 401, 'signed_out');
        }
        try {
            return await action(this.session);
        }
        catch (error) {
            if (!(error instanceof CloudError) || error.status !== 401)
                throw error;
            const current = this.session;
            if (!current)
                throw error;
            try {
                this.session = await refreshSessionApi(current);
            }
            catch (refreshError) {
                this.session = null;
                clearStoredSession();
                this.notify();
                throw refreshError;
            }
            return action(this.session);
        }
    }
    /** Confere a nuvem sem substituir o save local. */
    async bootstrapCloud() {
        if (!this.session || !this.host)
            return;
        this.busy = true;
        this.lastError = null;
        this.notify();
        try {
            const cloud = await this.withSession((session) => downloadCloudSave(session));
            this.cloudRecord = cloud;
            this.conflictRecord = null;
            if (!cloud) {
                await this.uploadLocalInternal();
            }
            else {
                const localAt = localSaveUpdatedAt();
                if (localAt === 0 || cloud.clientUpdatedAt > localAt + CONFLICT_THRESHOLD_MS) {
                    this.cloudNewer = true;
                }
                else if (localAt > cloud.clientUpdatedAt + CONFLICT_THRESHOLD_MS) {
                    await this.uploadLocalInternal();
                }
            }
            this.lastSyncedAt = Date.now();
        }
        catch (error) {
            this.lastError = describeError(error);
        }
        finally {
            this.busy = false;
            this.notify();
        }
    }
    async uploadLocalInternal() {
        const host = this.host;
        if (!this.session || !host)
            return;
        const localAt = localSaveUpdatedAt();
        const timestamp = localAt > 0 ? localAt : Date.now();
        const record = await this.withSession((session) => uploadCloudSave(session, host.getSave(), timestamp));
        this.cloudRecord = record;
        this.cloudNewer = false;
        markLocalSaveUpdated(record.clientUpdatedAt || timestamp);
        this.lastSyncedAt = Date.now();
    }
    /** Chamado depois de um login/cadastro explícito. */
    async afterAuth() {
        if (!this.session)
            return;
        this.busy = true;
        this.lastError = null;
        this.notify();
        try {
            const cloud = await this.withSession((session) => downloadCloudSave(session));
            this.cloudRecord = cloud;
            if (cloud) {
                this.conflictRecord = cloud;
                const localAt = localSaveUpdatedAt();
                this.cloudNewer =
                    localAt === 0 || cloud.clientUpdatedAt > localAt + CONFLICT_THRESHOLD_MS;
            }
            else {
                this.conflictRecord = null;
                this.cloudNewer = false;
                await this.uploadLocalInternal();
            }
            this.lastSyncedAt = Date.now();
        }
        catch (error) {
            this.lastError = describeError(error);
        }
        finally {
            this.busy = false;
            this.notify();
        }
    }
    async signIn(email, password) {
        if (!this.configured)
            throw new CloudError('A nuvem não está configurada.', 0, 'not_configured');
        this.busy = true;
        this.lastError = null;
        this.conflictRecord = null;
        this.cloudNewer = false;
        this.recovery = false;
        this.notify();
        try {
            this.session = await signInApi(email, password);
            await this.afterAuth();
        }
        catch (error) {
            this.busy = false;
            this.lastError = describeError(error);
            this.notify();
            throw error;
        }
    }
    async signUp(email, password) {
        if (!this.configured)
            throw new CloudError('A nuvem não está configurada.', 0, 'not_configured');
        this.busy = true;
        this.lastError = null;
        this.conflictRecord = null;
        this.cloudNewer = false;
        this.recovery = false;
        this.notify();
        try {
            const result = await signUpApi(email, password);
            if (!result.session) {
                this.busy = false;
                this.notify();
                return { needsConfirmation: true };
            }
            this.session = result.session;
            await this.afterAuth();
            return { needsConfirmation: false };
        }
        catch (error) {
            this.busy = false;
            this.lastError = describeError(error);
            this.notify();
            throw error;
        }
    }
    async resolveConflict(choice) {
        if (!this.session || !this.host || !this.conflictRecord)
            return;
        this.busy = true;
        this.lastError = null;
        this.notify();
        try {
            if (choice === 'cloud') {
                const record = this.conflictRecord;
                this.host.applyCloudSave(record.save, record.clientUpdatedAt);
                this.cloudNewer = false;
                this.lastSyncedAt = Date.now();
            }
            else {
                await this.uploadLocalInternal();
            }
            this.conflictRecord = null;
        }
        catch (error) {
            this.lastError = describeError(error);
            throw error;
        }
        finally {
            this.busy = false;
            this.notify();
        }
    }
    async uploadLocal(force = false) {
        if (!this.session) {
            throw new CloudError('Entre na sua conta para salvar na nuvem.', 401, 'signed_out');
        }
        if (!force && this.conflictRecord) {
            throw new CloudError('Escolha qual save usar antes de enviar.', 409, 'conflict');
        }
        if (!force && this.cloudNewer) {
            throw new CloudError('Baixe o save da nuvem antes de enviar.', 409, 'cloud_newer');
        }
        this.clearUploadTimer();
        this.busy = true;
        this.lastError = null;
        this.notify();
        try {
            await this.uploadLocalInternal();
            this.conflictRecord = null;
            this.cloudNewer = false;
        }
        catch (error) {
            this.lastError = describeError(error);
            throw error;
        }
        finally {
            this.busy = false;
            this.notify();
        }
    }
    async downloadCloud() {
        if (!this.session || !this.host) {
            throw new CloudError('Entre na sua conta para baixar o save.', 401, 'signed_out');
        }
        this.busy = true;
        this.lastError = null;
        this.notify();
        try {
            const cloud = await this.withSession((session) => downloadCloudSave(session));
            if (!cloud)
                throw new CloudError('Nenhum save na nuvem ainda.', 404, 'no_cloud_save');
            this.cloudRecord = cloud;
            this.host.applyCloudSave(cloud.save, cloud.clientUpdatedAt);
            this.conflictRecord = null;
            this.cloudNewer = false;
            this.lastSyncedAt = Date.now();
        }
        catch (error) {
            this.lastError = describeError(error);
            throw error;
        }
        finally {
            this.busy = false;
            this.notify();
        }
    }
    async signOut() {
        this.clearUploadTimer();
        if (this.session && !this.conflictRecord && !this.cloudNewer) {
            try {
                await this.uploadLocalInternal();
            }
            catch {
                // Sair não pode ficar preso por falta de rede.
            }
        }
        const session = this.session;
        this.session = null;
        this.conflictRecord = null;
        this.cloudRecord = null;
        this.cloudNewer = false;
        this.recovery = false;
        this.lastError = null;
        this.lastSyncedAt = null;
        this.busy = true;
        this.notify();
        try {
            await signOutApi(session);
        }
        finally {
            this.busy = false;
            this.notify();
        }
    }
    async requestPasswordReset(email) {
        this.busy = true;
        this.lastError = null;
        this.notify();
        try {
            const redirectTo = `${window.location.origin}${window.location.pathname}`;
            await requestPasswordResetApi(email, redirectTo);
        }
        catch (error) {
            this.lastError = describeError(error);
            throw error;
        }
        finally {
            this.busy = false;
            this.notify();
        }
    }
    async updatePassword(password) {
        if (!this.session) {
            throw new CloudError('O link de recuperação expirou. Solicite outro.', 401, 'signed_out');
        }
        this.busy = true;
        this.lastError = null;
        this.notify();
        try {
            await this.withSession((session) => updatePasswordApi(session, password));
            this.recovery = false;
            await this.bootstrapCloud();
        }
        catch (error) {
            this.lastError = describeError(error);
            throw error;
        }
        finally {
            this.busy = false;
            this.notify();
        }
    }
    /** Agenda o envio após uma gravação local; falhas não interrompem o jogo. */
    scheduleUpload(_save) {
        // Enquanto a nuvem está sendo conferida, o estado do save remoto ainda é
        // desconhecido; enviar agora poderia sobrescrever progresso mais novo.
        if (this.busy || !this.session || this.conflictRecord || this.cloudNewer)
            return;
        this.clearUploadTimer();
        this.uploadTimer = window.setTimeout(() => {
            this.uploadTimer = null;
            if (this.busy || this.conflictRecord || this.cloudNewer)
                return;
            void this.uploadLocal().catch(() => undefined);
        }, UPLOAD_DEBOUNCE_MS);
    }
    /** Usado ao fechar a aba para tentar enviar o último save pendente. */
    async flush() {
        if (this.busy || !this.session || this.conflictRecord || this.cloudNewer)
            return;
        this.clearUploadTimer();
        try {
            await this.uploadLocalInternal();
        }
        catch {
            // Sem tempo/rede para enviar; o próximo acesso tenta de novo.
        }
    }
}
export const cloudSync = new CloudSync();
//# sourceMappingURL=cloud-sync.js.map