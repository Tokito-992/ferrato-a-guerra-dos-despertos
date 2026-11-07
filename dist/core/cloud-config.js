/**
 * Configuração pública do Supabase.
 *
 * A chave publishable/anon é feita para rodar no cliente. Ela não dá acesso
 * aos dados de outros jogadores: as políticas RLS da tabela `game_saves`
 * limitam cada conta ao próprio save. Nunca coloque a service_role aqui.
 */
export const SUPABASE_URL = 'https://sgrwqvylznarxwbgktyt.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_4Hn1PyDiC4KvmtkOdi0j2w_2k3XIiUW';
export function isCloudConfigured() {
    return (SUPABASE_URL.startsWith('https://') &&
        SUPABASE_PUBLISHABLE_KEY.length > 20 &&
        !SUPABASE_URL.includes('SEU-PROJETO'));
}
//# sourceMappingURL=cloud-config.js.map