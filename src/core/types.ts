import type { Camera } from '../core/camera.js';
import type { AudioEngine } from '../core/audio.js';
import type { Input } from '../core/input.js';
import type { ParticleSystem } from '../core/particles.js';
import type { StageDef } from '../data/stages.js';
import type { Combatant } from '../entities/combatant.js';
import type { Enemy } from '../entities/enemy.js';
import type { Boss } from '../entities/boss.js';
import type { Player } from '../entities/player.js';
import type { Projectile } from '../entities/projectiles.js';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type StatusKind = 'burn' | 'seal' | 'stun' | 'mark';

export interface HitOptions {
  knockback?: number;
  launch?: number;
  hitstun?: number;
  crit?: boolean;
  color?: string;
  status?: StatusKind;
  statusTime?: number;
  ignoreInvuln?: boolean;
  /** Quando definido, a direção do empurrão é calculada a partir daqui. */
  fromX?: number;
  shake?: number;
}

export interface DamageNumber {
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
}

export interface ProjectileDef {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  owner: 'player' | 'enemy';
  color: string;
  accent?: string;
  life?: number;
  gravity?: number;
  pierce?: boolean;
  homing?: number;
  /** Visual: orb (padrão), bolt, feather, chain, star, plasma. */
  style?: 'orb' | 'bolt' | 'feather' | 'star' | 'plasma' | 'echo';
  spin?: number;
  shake?: number;
}

export interface HazardDef {
  /** Tipo define comportamento e visual. */
  kind: 'magma' | 'singularity' | 'seal' | 'shock' | 'beam' | 'rain' | 'explosion' | 'rift' | 'void';
  x: number;
  y: number;
  w?: number;
  h?: number;
  radius?: number;
  duration: number;
  damage: number;
  owner: 'player' | 'enemy';
  color: string;
  accent?: string;
  /** Intervalo de dano contínuo (0 = acerta uma vez). */
  tick?: number;
  pull?: number;
  finalBurst?: number;
  delay?: number;
}

export interface World {
  readonly audio: AudioEngine;
  readonly particles: ParticleSystem;
  readonly camera: Camera;
  readonly input: Input;
  readonly stage: StageDef;
  readonly time: number;
  readonly groundY: number;
  readonly viewW: number;
  readonly viewH: number;
  readonly bossActive: boolean;
  readonly locked: boolean;
  /** Todos os jogadores da sessão (1 no solo, 2 no co-op local). */
  readonly players: Player[];
  /** Primeiro jogador; atalho de compatibilidade. */
  player: Player;
  enemies: Enemy[];
  boss: Boss | null;

  spawnProjectile(def: ProjectileDef): Projectile;
  spawnHazard(def: HazardDef): void;
  spawnEnemy(kind: string, x: number, elite?: boolean): Enemy;
  damageEnemy(target: Combatant, damage: number, opts?: HitOptions): void;
  /** Jogador vivo mais próximo do ponto informado. */
  nearestPlayer(x: number, y?: number): Player;
  /** Dano direcionado; sem alvo, atinge o jogador 1. */
  damagePlayer(damage: number, opts?: HitOptions, target?: Player): number;
  /** Dano em área que atinge todos os jogadores dentro do raio. */
  damagePlayers(x: number, y: number, radius: number, damage: number, opts?: HitOptions): number;
  /** Cura um jogador específico; sem alvo, cura o jogador 1. */
  healPlayer(amount: number, target?: Player): void;
  /** Cura todos os jogadores vivos (recompensa de onda/elite). */
  healParty(amount: number): void;
  shake(amount: number): void;
  flash(color: string, alpha: number): void;
  hitStop(seconds: number): void;
  text(text: string, x: number, y: number, color?: string, size?: number): void;
  after(seconds: number, fn: () => void): void;
  addCombo(count?: number): void;
  enemyKilled(enemy: Enemy): void;
  /** Impacto pesado no solo (usado por golpes sísmicos). */
  heavyImpact(x: number, y: number, color: string): void;
  /** Marca um inimigo como "selado" visual e mecanicamente, a partir do ponto informado. */
  sealEnemies(radius: number, duration: number, x?: number, y?: number): void;
  /** Destrói projéteis inimigos em um raio (usado por habilidades de selo). */
  clearEnemyProjectiles(x: number, y: number, radius: number): void;
}
