/** Arquétipos de inimigos e seus comportamentos de IA. */

export type EnemyKind =
  | 'crawler'
  | 'warrior'
  | 'drone'
  | 'hound'
  | 'caster'
  | 'brute'
  | 'shade'
  | 'construct'
  | 'seraph'
  | 'echo';

export type EnemyAI =
  | 'leaper'
  | 'melee'
  | 'flyer'
  | 'charger'
  | 'caster'
  | 'brute'
  | 'teleporter'
  | 'turret'
  | 'diver'
  | 'mirror';

export interface EnemyDef {
  kind: EnemyKind;
  baseName: string;
  hp: number;
  speed: number;
  damage: number;
  w: number;
  h: number;
  scale: number;
  range: number;
  ai: EnemyAI;
  flying: boolean;
  color: string;
  accent: string;
  glow: string;
  attackCooldown: number;
  windup: number;
  attackDuration: number;
  windupFx: string;
}

export const ENEMY_BASE: Record<EnemyKind, EnemyDef> = {
  crawler: {
    kind: 'crawler',
    baseName: 'Rastejante',
    hp: 36,
    speed: 168,
    damage: 8,
    w: 62,
    h: 42,
    scale: 1,
    range: 92,
    ai: 'leaper',
    flying: false,
    color: '#5f8a3f',
    accent: '#d8ff64',
    glow: '#9dff4a',
    attackCooldown: 1.15,
    windup: 0.32,
    attackDuration: 0.5,
    windupFx: '#c6ff5a',
  },
  warrior: {
    kind: 'warrior',
    baseName: 'Guerreiro Khar\'uun',
    hp: 66,
    speed: 112,
    damage: 11,
    w: 50,
    h: 94,
    scale: 1,
    range: 104,
    ai: 'melee',
    flying: false,
    color: '#63459a',
    accent: '#c39bff',
    glow: '#a06bff',
    attackCooldown: 1.35,
    windup: 0.48,
    attackDuration: 0.28,
    windupFx: '#c39bff',
  },
  drone: {
    kind: 'drone',
    baseName: 'Drone Assimilado',
    hp: 44,
    speed: 138,
    damage: 8,
    w: 54,
    h: 50,
    scale: 1,
    range: 320,
    ai: 'flyer',
    flying: true,
    color: '#43637f',
    accent: '#66e0ff',
    glow: '#54d6ff',
    attackCooldown: 1.8,
    windup: 0.5,
    attackDuration: 0.2,
    windupFx: '#66e0ff',
  },
  hound: {
    kind: 'hound',
    baseName: 'Cão Rubro',
    hp: 50,
    speed: 205,
    damage: 10,
    w: 78,
    h: 48,
    scale: 1,
    range: 118,
    ai: 'charger',
    flying: false,
    color: '#8e2f24',
    accent: '#ff8a3c',
    glow: '#ff5a1f',
    attackCooldown: 1.6,
    windup: 0.38,
    attackDuration: 0.36,
    windupFx: '#ff8a3c',
  },
  caster: {
    kind: 'caster',
    baseName: 'Manto Corrompido',
    hp: 50,
    speed: 96,
    damage: 10,
    w: 48,
    h: 92,
    scale: 1,
    range: 330,
    ai: 'caster',
    flying: false,
    color: '#7a3a66',
    accent: '#ff6ab4',
    glow: '#ff4f9b',
    attackCooldown: 2.2,
    windup: 0.72,
    attackDuration: 0.3,
    windupFx: '#ff6ab4',
  },
  brute: {
    kind: 'brute',
    baseName: 'Carrasco Traidor',
    hp: 135,
    speed: 84,
    damage: 16,
    w: 70,
    h: 116,
    scale: 1,
    range: 120,
    ai: 'brute',
    flying: false,
    color: '#6b4a3a',
    accent: '#ffad5a',
    glow: '#ff7a2f',
    attackCooldown: 2.1,
    windup: 0.72,
    attackDuration: 0.42,
    windupFx: '#ffad5a',
  },
  shade: {
    kind: 'shade',
    baseName: 'Alma Penitente',
    hp: 56,
    speed: 170,
    damage: 12,
    w: 48,
    h: 94,
    scale: 1,
    range: 100,
    ai: 'teleporter',
    flying: false,
    color: '#3d4a6c',
    accent: '#8ba6ff',
    glow: '#6f8cff',
    attackCooldown: 1.7,
    windup: 0.42,
    attackDuration: 0.26,
    windupFx: '#8ba6ff',
  },
  construct: {
    kind: 'construct',
    baseName: 'Construto Vitral',
    hp: 96,
    speed: 66,
    damage: 11,
    w: 62,
    h: 104,
    scale: 1,
    range: 300,
    ai: 'turret',
    flying: false,
    color: '#5b6b8a',
    accent: '#a8f4ff',
    glow: '#7fe6ff',
    attackCooldown: 1.9,
    windup: 0.62,
    attackDuration: 0.24,
    windupFx: '#a8f4ff',
  },
  seraph: {
    kind: 'seraph',
    baseName: 'Serafim Caído',
    hp: 62,
    speed: 130,
    damage: 12,
    w: 56,
    h: 96,
    scale: 1,
    range: 260,
    ai: 'diver',
    flying: true,
    color: '#c9c2a8',
    accent: '#fff1c4',
    glow: '#ffe9a8',
    attackCooldown: 1.7,
    windup: 0.5,
    attackDuration: 0.55,
    windupFx: '#fff1c4',
  },
  echo: {
    kind: 'echo',
    baseName: 'Eco Corrompido',
    hp: 70,
    speed: 150,
    damage: 12,
    w: 50,
    h: 96,
    scale: 1,
    range: 120,
    ai: 'mirror',
    flying: false,
    color: '#63459a',
    accent: '#c39bff',
    glow: '#9b7bff',
    attackCooldown: 1.3,
    windup: 0.44,
    attackDuration: 0.3,
    windupFx: '#c39bff',
  },
};

export const ELITE_HP_MULT = 3.4;
export const ELITE_DAMAGE_MULT = 1.3;
