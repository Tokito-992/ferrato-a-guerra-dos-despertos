/** Persistência local de progresso (localStorage) — campanha de 42 capítulos. */
import { CHARACTER_ORDER } from '../data/characters.js?v=6ccbb66fdb55';
import { ARC_COUNT, CHAPTERS_PER_ARC, MAX_STAGE } from '../data/stages.js?v=6ccbb66fdb55';
import { ARCHIVE_ENTRY_IDS, backfillArchiveIds } from '../data/archive.js?v=6ccbb66fdb55';
import { isRank } from './rank.js?v=6ccbb66fdb55';
import { sanitizeBindings } from './bindings.js?v=6ccbb66fdb55';
export const TOUCH_BUTTON_IDS = [
    'left',
    'right',
    'jump',
    'attack',
    'heavy',
    'dash',
    'ability',
    'pause',
    'fullscreen',
];
/** Mantemos a chave v1 para conseguir migrar arquivos antigos sem perder progresso. */
const KEY = 'ferrato_guerra_dos_despertos_save_v1';
const UPDATED_KEY = 'ferrato_guerra_dos_despertos_save_updated_v1';
const LEGACY_MAX_STAGE = 6;
const VERSION = 3;
/** Teto de corações extras que podem ser acumulados entre capítulos. */
export const MAX_HEARTS = 3;
const sanitizeHearts = (value) => {
    const hearts = Math.round(Number(value));
    if (!Number.isFinite(hearts))
        return 0;
    return Math.max(0, Math.min(MAX_HEARTS, hearts));
};
const clampStage = (value, fallback = 1) => {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return fallback;
    return Math.max(1, Math.min(MAX_STAGE, Math.round(value)));
};
const heroForStage = (stageId) => {
    const arc = Math.max(1, Math.min(6, Math.ceil(clampStage(stageId) / CHAPTERS_PER_ARC)));
    return CHARACTER_ORDER[arc - 1];
};
const validHero = (value) => typeof value === 'string' && CHARACTER_ORDER.includes(value) ? value : null;
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const validTouchPoint = (value) => {
    if (!value || typeof value !== 'object')
        return null;
    const point = value;
    if (typeof point.x !== 'number' || !Number.isFinite(point.x))
        return null;
    if (typeof point.y !== 'number' || !Number.isFinite(point.y))
        return null;
    return { x: clamp01(point.x), y: clamp01(point.y) };
};
/** Mantém apenas botões conhecidos e coordenadas válidas; saves antigos ficam sem layout livre. */
export function sanitizeTouchPositions(value) {
    if (!value || typeof value !== 'object')
        return null;
    const source = value;
    const positions = {};
    for (const id of TOUCH_BUTTON_IDS) {
        const point = validTouchPoint(source[id]);
        if (point)
            positions[id] = point;
    }
    return Object.keys(positions).length > 0 ? positions : null;
}
function sanitize(data) {
    const cleared = Array.from(new Set((Array.isArray(data.cleared) ? data.cleared : [])
        .map((id) => Math.round(Number(id)))
        .filter((id) => Number.isFinite(id) && id >= 1 && id <= MAX_STAGE))).sort((a, b) => a - b);
    let maxStage = clampStage(data.maxStage);
    for (const id of cleared)
        maxStage = Math.max(maxStage, Math.min(MAX_STAGE, id + 1));
    const unlocked = Array.from(new Set((Array.isArray(data.unlocked) ? data.unlocked : [])
        .map(validHero)
        .filter((id) => id !== null)));
    if (!unlocked.includes('ravi'))
        unlocked.unshift('ravi');
    const arc = Math.max(1, Math.min(6, Math.ceil(maxStage / CHAPTERS_PER_ARC)));
    for (let i = 0; i < arc; i++) {
        const hero = CHARACTER_ORDER[i];
        if (!unlocked.includes(hero))
            unlocked.push(hero);
    }
    const selected = validHero(data.selected);
    const archive = Array.isArray(data.archive)
        ? Array.from(new Set(data.archive.filter((id) => typeof id === 'string' && ARCHIVE_ENTRY_IDS.has(id))))
        : backfillArchiveIds(cleared, maxStage);
    return {
        version: VERSION,
        unlocked,
        maxStage,
        cleared,
        selected: selected && unlocked.includes(selected) ? selected : heroForStage(maxStage),
        hearts: sanitizeHearts(data.hearts),
        kills: typeof data.kills === 'number' && data.kills > 0 ? Math.round(data.kills) : 0,
        deaths: typeof data.deaths === 'number' && data.deaths > 0 ? Math.round(data.deaths) : 0,
        bestCombo: typeof data.bestCombo === 'number' && data.bestCombo > 0 ? Math.round(data.bestCombo) : 0,
        bestScore: typeof data.bestScore === 'number' && data.bestScore > 0 ? Math.round(data.bestScore) : 0,
        bestRank: isRank(data.bestRank) ? data.bestRank : 'D',
        muted: Boolean(data.muted),
        touchLayout: data.touchLayout === 'lefty' ? 'lefty' : 'standard',
        touchDock: data.touchDock === 'top' ? 'top' : 'bottom',
        touchPositions: sanitizeTouchPositions(data.touchPositions),
        bindings: sanitizeBindings(data.bindings),
        archive,
    };
}
/**
 * Arquivos v1 tinham seis fases lineares. Cada fase antiga vira o finale do
 * arco correspondente; os cinco capítulos novos que antecedem esse finale são
 * liberados para que o jogador possa reviver a história expandida.
 */
function migrateLegacy(data) {
    const oldCleared = new Set((Array.isArray(data.cleared) ? data.cleared : [])
        .map((id) => Math.round(Number(id)))
        .filter((id) => Number.isFinite(id) && id >= 1 && id <= LEGACY_MAX_STAGE));
    const oldMax = Math.max(1, Math.min(LEGACY_MAX_STAGE, Math.round(Number(data.maxStage) || 1)));
    const cleared = [];
    let maxStage = 1;
    for (let oldStage = 1; oldStage <= LEGACY_MAX_STAGE; oldStage++) {
        if (!oldCleared.has(oldStage))
            continue;
        const first = (oldStage - 1) * CHAPTERS_PER_ARC + 1;
        const finale = oldStage * CHAPTERS_PER_ARC;
        for (let id = first; id <= finale; id++)
            cleared.push(id);
        maxStage = Math.max(maxStage, Math.min(MAX_STAGE, finale + 1));
    }
    // Quem apenas destravou uma fase antiga mas ainda não a venceu precisa poder
    // jogar os capítulos novos que levam até ela.
    if (oldMax > 0 && !oldCleared.has(oldMax)) {
        maxStage = Math.max(maxStage, (oldMax - 1) * CHAPTERS_PER_ARC + 1);
    }
    if (oldCleared.has(LEGACY_MAX_STAGE))
        maxStage = MAX_STAGE;
    const unlocked = Array.from(new Set((Array.isArray(data.unlocked) ? data.unlocked : [])
        .map(validHero)
        .filter((id) => id !== null)));
    if (!unlocked.includes('ravi'))
        unlocked.unshift('ravi');
    const arc = Math.max(1, Math.min(6, Math.ceil(maxStage / CHAPTERS_PER_ARC)));
    for (let i = 0; i < arc; i++) {
        const hero = CHARACTER_ORDER[i];
        if (!unlocked.includes(hero))
            unlocked.push(hero);
    }
    const selected = validHero(data.selected);
    const migratedCleared = Array.from(new Set(cleared)).sort((a, b) => a - b);
    return {
        version: VERSION,
        unlocked,
        maxStage,
        cleared: migratedCleared,
        selected: selected && unlocked.includes(selected) ? selected : heroForStage(maxStage),
        hearts: sanitizeHearts(data.hearts),
        kills: typeof data.kills === 'number' && data.kills > 0 ? Math.round(data.kills) : 0,
        deaths: typeof data.deaths === 'number' && data.deaths > 0 ? Math.round(data.deaths) : 0,
        bestCombo: typeof data.bestCombo === 'number' && data.bestCombo > 0 ? Math.round(data.bestCombo) : 0,
        bestScore: typeof data.bestScore === 'number' && data.bestScore > 0 ? Math.round(data.bestScore) : 0,
        bestRank: isRank(data.bestRank) ? data.bestRank : 'D',
        muted: Boolean(data.muted),
        touchLayout: data.touchLayout === 'lefty' ? 'lefty' : 'standard',
        touchDock: data.touchDock === 'top' ? 'top' : 'bottom',
        touchPositions: sanitizeTouchPositions(data.touchPositions),
        bindings: sanitizeBindings(data.bindings),
        archive: backfillArchiveIds(migratedCleared, maxStage),
    };
}
export function defaultSave() {
    return {
        version: VERSION,
        unlocked: ['ravi'],
        maxStage: 1,
        cleared: [],
        selected: 'ravi',
        hearts: 0,
        kills: 0,
        deaths: 0,
        bestCombo: 0,
        bestScore: 0,
        bestRank: 'D',
        muted: false,
        touchLayout: 'standard',
        touchDock: 'bottom',
        touchPositions: null,
        bindings: sanitizeBindings(null),
        archive: [],
    };
}
/**
 * Saves v2 tinham 36 capítulos (6 por arco). O v3 tem 42 (7 por arco): o
 * sexto capítulo de cada arco é novo. Mapeia o progresso antigo para o novo
 * layout sem apagar nada e preserva os corações acumulados.
 */
function migrateV2(data) {
    const oldCleared = new Set((Array.isArray(data.cleared) ? data.cleared : [])
        .map((id) => Math.round(Number(id)))
        .filter((id) => Number.isFinite(id) && id >= 1 && id <= ARC_COUNT * 6));
    const mapOldStage = (oldId) => {
        const oldArc = Math.max(1, Math.min(ARC_COUNT, Math.ceil(oldId / 6)));
        const oldChapter = ((oldId - 1) % 6) + 1;
        const newChapter = oldChapter === 6 ? CHAPTERS_PER_ARC : oldChapter;
        return (oldArc - 1) * CHAPTERS_PER_ARC + newChapter;
    };
    const cleared = Array.from(new Set(Array.from(oldCleared).map(mapOldStage))).sort((a, b) => a - b);
    const oldMaxRaw = Math.round(Number(data.maxStage) || 1);
    const oldMax = Math.max(1, Math.min(ARC_COUNT * 6, oldMaxRaw));
    const oldMaxArc = Math.max(1, Math.min(ARC_COUNT, Math.ceil(oldMax / 6)));
    const oldMaxChapter = ((oldMax - 1) % 6) + 1;
    // Se o chefe antigo estava liberado mas ainda não tinha sido vencido, o
    // jogador deve passar pelo novo capítulo de crônica antes de enfrentá-lo.
    let maxStage = oldMaxChapter === 6 && !oldCleared.has(oldMax)
        ? (oldMaxArc - 1) * CHAPTERS_PER_ARC + (CHAPTERS_PER_ARC - 1)
        : mapOldStage(oldMax);
    for (const id of cleared)
        maxStage = Math.max(maxStage, Math.min(MAX_STAGE, id + 1));
    maxStage = Math.max(1, Math.min(MAX_STAGE, maxStage));
    const unlocked = Array.from(new Set((Array.isArray(data.unlocked) ? data.unlocked : [])
        .map(validHero)
        .filter((id) => id !== null)));
    if (!unlocked.includes('ravi'))
        unlocked.unshift('ravi');
    const arc = Math.max(1, Math.min(ARC_COUNT, Math.ceil(maxStage / CHAPTERS_PER_ARC)));
    for (let i = 0; i < arc; i++) {
        const hero = CHARACTER_ORDER[i];
        if (!unlocked.includes(hero))
            unlocked.push(hero);
    }
    const selected = validHero(data.selected);
    return {
        version: VERSION,
        unlocked,
        maxStage,
        cleared,
        selected: selected && unlocked.includes(selected) ? selected : heroForStage(maxStage),
        hearts: sanitizeHearts(data.hearts),
        kills: typeof data.kills === 'number' && data.kills > 0 ? Math.round(data.kills) : 0,
        deaths: typeof data.deaths === 'number' && data.deaths > 0 ? Math.round(data.deaths) : 0,
        bestCombo: typeof data.bestCombo === 'number' && data.bestCombo > 0 ? Math.round(data.bestCombo) : 0,
        bestScore: typeof data.bestScore === 'number' && data.bestScore > 0 ? Math.round(data.bestScore) : 0,
        bestRank: isRank(data.bestRank) ? data.bestRank : 'D',
        muted: Boolean(data.muted),
        touchLayout: data.touchLayout === 'lefty' ? 'lefty' : 'standard',
        touchDock: data.touchDock === 'top' ? 'top' : 'bottom',
        touchPositions: sanitizeTouchPositions(data.touchPositions),
        bindings: sanitizeBindings(data.bindings),
        archive: backfillArchiveIds(cleared, maxStage),
    };
}
/** Valida e normaliza um save vindo do localStorage ou da nuvem. */
export function sanitizeSave(value) {
    if (!value || typeof value !== 'object')
        return defaultSave();
    const parsed = value;
    if (parsed.version === VERSION)
        return sanitize(parsed);
    if (parsed.version === 2)
        return migrateV2(parsed);
    return migrateLegacy(parsed);
}
/** Timestamp local do último save; 0 quando o arquivo é anterior a este recurso. */
export function localSaveUpdatedAt() {
    try {
        const raw = localStorage.getItem(UPDATED_KEY);
        const value = Number(raw);
        return Number.isFinite(value) && value > 0 ? value : 0;
    }
    catch {
        return 0;
    }
}
export function markLocalSaveUpdated(at = Date.now()) {
    try {
        localStorage.setItem(UPDATED_KEY, String(at));
    }
    catch {
        // Armazenamento indisponível: a sincronização usa o relógio do servidor.
    }
}
export function loadSave() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw)
            return defaultSave();
        return sanitizeSave(JSON.parse(raw));
    }
    catch {
        return defaultSave();
    }
}
/**
 * Grava o save local. `updatedAt` permite preservar o timestamp de um save
 * baixado da nuvem em vez de marcá-lo como recém-jogado.
 */
export function writeSave(data, updatedAt = Date.now()) {
    try {
        data.version = VERSION;
        localStorage.setItem(KEY, JSON.stringify(data));
        markLocalSaveUpdated(updatedAt);
    }
    catch {
        // Armazenamento indisponível (modo privado): o jogo segue sem persistir.
    }
}
export function resetSave() {
    const data = defaultSave();
    writeSave(data);
    return data;
}
//# sourceMappingURL=save.js.map