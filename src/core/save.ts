/** Persistência local de progresso (localStorage). */

export interface SaveData {
  version: number;
  unlocked: string[];
  /** Fase mais alta liberada (1..6). */
  maxStage: number;
  cleared: number[];
  selected: string;
  kills: number;
  deaths: number;
  bestCombo: number;
  muted: boolean;
}

const KEY = 'ferrato_guerra_dos_despertos_save_v1';
const VERSION = 1;

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
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const base = defaultSave();
    return {
      ...base,
      ...parsed,
      version: VERSION,
      unlocked: Array.isArray(parsed.unlocked) && parsed.unlocked.length ? parsed.unlocked : base.unlocked,
      cleared: Array.isArray(parsed.cleared) ? parsed.cleared : base.cleared,
      maxStage: typeof parsed.maxStage === 'number' ? Math.min(6, Math.max(1, parsed.maxStage)) : 1,
    };
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData): void {
  try {
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
