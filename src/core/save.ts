/** Persistência local de progresso (localStorage) — campanha de 36 capítulos. */

import { CHARACTER_ORDER } from '../data/characters.js';
import type { CharacterId } from '../data/characters.js';
import { CHAPTERS_PER_ARC, MAX_STAGE } from '../data/stages.js';

export interface SaveData {
  version: number;
  unlocked: string[];
  /** Capítulo mais alto liberado (1..36). */
  maxStage: number;
  cleared: number[];
  selected: string;
  kills: number;
  deaths: number;
  bestCombo: number;
  muted: boolean;
}

interface LegacySave {
  version?: number;
  unlocked?: string[];
  maxStage?: number;
  cleared?: number[];
  selected?: string;
  kills?: number;
  deaths?: number;
  bestCombo?: number;
  muted?: boolean;
}

/** Mantemos a chave v1 para conseguir migrar arquivos antigos sem perder progresso. */
const KEY = 'ferrato_guerra_dos_despertos_save_v1';
const LEGACY_MAX_STAGE = 6;
const VERSION = 2;

const clampStage = (value: unknown, fallback = 1): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(MAX_STAGE, Math.round(value)));
};

const heroForStage = (stageId: number): CharacterId => {
  const arc = Math.max(1, Math.min(6, Math.ceil(clampStage(stageId) / CHAPTERS_PER_ARC)));
  return CHARACTER_ORDER[arc - 1];
};

const validHero = (value: unknown): CharacterId | null =>
  typeof value === 'string' && (CHARACTER_ORDER as string[]).includes(value) ? (value as CharacterId) : null;

function sanitize(data: LegacySave): SaveData {
  const cleared = Array.from(
    new Set(
      (Array.isArray(data.cleared) ? data.cleared : [])
        .map((id) => Math.round(Number(id)))
        .filter((id) => Number.isFinite(id) && id >= 1 && id <= MAX_STAGE),
    ),
  ).sort((a, b) => a - b);

  let maxStage = clampStage(data.maxStage);
  for (const id of cleared) maxStage = Math.max(maxStage, Math.min(MAX_STAGE, id + 1));

  const unlocked = Array.from(
    new Set(
      (Array.isArray(data.unlocked) ? data.unlocked : [])
        .map(validHero)
        .filter((id): id is CharacterId => id !== null),
    ),
  );
  if (!unlocked.includes('ravi')) unlocked.unshift('ravi');
  const arc = Math.max(1, Math.min(6, Math.ceil(maxStage / CHAPTERS_PER_ARC)));
  for (let i = 0; i < arc; i++) {
    const hero = CHARACTER_ORDER[i];
    if (!unlocked.includes(hero)) unlocked.push(hero);
  }

  const selected = validHero(data.selected);
  return {
    version: VERSION,
    unlocked,
    maxStage,
    cleared,
    selected: selected && unlocked.includes(selected) ? selected : heroForStage(maxStage),
    kills: typeof data.kills === 'number' && data.kills > 0 ? Math.round(data.kills) : 0,
    deaths: typeof data.deaths === 'number' && data.deaths > 0 ? Math.round(data.deaths) : 0,
    bestCombo: typeof data.bestCombo === 'number' && data.bestCombo > 0 ? Math.round(data.bestCombo) : 0,
    muted: Boolean(data.muted),
  };
}

/**
 * Arquivos v1 tinham seis fases lineares. Cada fase antiga vira o finale do
 * arco correspondente; os cinco capítulos novos que antecedem esse finale são
 * liberados para que o jogador possa reviver a história expandida.
 */
function migrateLegacy(data: LegacySave): SaveData {
  const oldCleared = new Set(
    (Array.isArray(data.cleared) ? data.cleared : [])
      .map((id) => Math.round(Number(id)))
      .filter((id) => Number.isFinite(id) && id >= 1 && id <= LEGACY_MAX_STAGE),
  );
  const oldMax = Math.max(1, Math.min(LEGACY_MAX_STAGE, Math.round(Number(data.maxStage) || 1)));
  const cleared: number[] = [];
  let maxStage = 1;

  for (let oldStage = 1; oldStage <= LEGACY_MAX_STAGE; oldStage++) {
    if (!oldCleared.has(oldStage)) continue;
    const first = (oldStage - 1) * CHAPTERS_PER_ARC + 1;
    const finale = oldStage * CHAPTERS_PER_ARC;
    for (let id = first; id <= finale; id++) cleared.push(id);
    maxStage = Math.max(maxStage, Math.min(MAX_STAGE, finale + 1));
  }

  // Quem apenas destravou uma fase antiga mas ainda não a venceu precisa poder
  // jogar os capítulos novos que levam até ela.
  if (oldMax > 0 && !oldCleared.has(oldMax)) {
    maxStage = Math.max(maxStage, (oldMax - 1) * CHAPTERS_PER_ARC + 1);
  }
  if (oldCleared.has(LEGACY_MAX_STAGE)) maxStage = MAX_STAGE;

  const unlocked = Array.from(
    new Set(
      (Array.isArray(data.unlocked) ? data.unlocked : [])
        .map(validHero)
        .filter((id): id is CharacterId => id !== null),
    ),
  );
  if (!unlocked.includes('ravi')) unlocked.unshift('ravi');
  const arc = Math.max(1, Math.min(6, Math.ceil(maxStage / CHAPTERS_PER_ARC)));
  for (let i = 0; i < arc; i++) {
    const hero = CHARACTER_ORDER[i];
    if (!unlocked.includes(hero)) unlocked.push(hero);
  }

  const selected = validHero(data.selected);
  return {
    version: VERSION,
    unlocked,
    maxStage,
    cleared: Array.from(new Set(cleared)).sort((a, b) => a - b),
    selected: selected && unlocked.includes(selected) ? selected : heroForStage(maxStage),
    kills: typeof data.kills === 'number' && data.kills > 0 ? Math.round(data.kills) : 0,
    deaths: typeof data.deaths === 'number' && data.deaths > 0 ? Math.round(data.deaths) : 0,
    bestCombo: typeof data.bestCombo === 'number' && data.bestCombo > 0 ? Math.round(data.bestCombo) : 0,
    muted: Boolean(data.muted),
  };
}

export function defaultSave(): SaveData {
  return {
    version: VERSION,
    unlocked: ['ravi'],
    maxStage: 1,
    cleared: [],
    selected: 'ravi',
    kills: 0,
    deaths: 0,
    bestCombo: 0,
    muted: false,
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as LegacySave;
    if (!parsed || typeof parsed !== 'object') return defaultSave();
    const isCurrent = parsed.version === VERSION;
    return isCurrent ? sanitize(parsed) : migrateLegacy(parsed);
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData): void {
  try {
    data.version = VERSION;
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Armazenamento indisponível (modo privado): o jogo segue sem persistir.
  }
}

export function resetSave(): SaveData {
  const data = defaultSave();
  writeSave(data);
  return data;
}
