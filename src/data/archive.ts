/**
 * Arquivo do Véu — o bestiário da campanha.
 *
 * Cada registro nasce bloqueado e só é revelado quando o jogador avista a
 * criatura, enfrenta o chefe, visita o capítulo ou encontra uma relíquia.
 * Heróis são revelados pelo desbloqueio narrativo de cada Desperto.
 */

import { CHARACTER_ORDER, CHARACTERS } from './characters.js';
import type { CharacterId } from './characters.js';
import { BOSSES } from './bosses.js';
import type { BossId } from './bosses.js';
import { ARC_COUNT, CHAPTERS_PER_ARC, STAGES, getArcStages, getStage } from './stages.js';
import type { AmbientKind, StageDef } from './stages.js';
import { ENEMY_BASE } from './enemies.js';
import type { EnemyAI, EnemyKind } from './enemies.js';

export type ArchiveSection = 'heroes' | 'creatures' | 'bosses' | 'places' | 'relics';

export interface ArchiveStat {
  label: string;
  value: string;
}

export interface ArchivePlaceInfo {
  location: string;
  elite: string;
  boss?: string;
}

export interface ArchiveEntry {
  id: string;
  section: ArchiveSection;
  name: string;
  subtitle: string;
  /** Parágrafos de lore; o primeiro costuma ser a ficha curta. */
  lore: string[];
  accent: string;
  arc: number;
  stageId?: number;
  heroId?: CharacterId;
  creatureKind?: EnemyKind;
  bossId?: BossId;
  relicKind?: RelicKind;
  ambient?: AmbientKind;
  place?: ArchivePlaceInfo;
  stats: ArchiveStat[];
}

export interface ArchiveSectionDef {
  id: ArchiveSection;
  label: string;
  short: string;
  accent: string;
  description: string;
}

export interface ArchiveSaveView {
  unlocked: readonly string[];
  archive: readonly string[];
}

export type RelicKind = 'fracture' | 'sanctuary' | 'anchor' | 'overcharge';

export const ARCHIVE_SECTIONS: ArchiveSectionDef[] = [
  {
    id: 'heroes',
    label: 'Despertos',
    short: 'DESPERTOS',
    accent: '#56e3ff',
    description: 'As seis vidas que o Véu não conseguiu digerir.',
  },
  {
    id: 'creatures',
    label: 'Criaturas',
    short: 'CRIATURAS',
    accent: '#ff8a3d',
    description: 'Tudo o que o Ferrato tocou e deixou com fome.',
  },
  {
    id: 'bosses',
    label: 'Chefes',
    short: 'CHEFES',
    accent: '#ff3357',
    description: 'As mãos que o Véu usa para segurar um plano inteiro.',
  },
  {
    id: 'places',
    label: 'Lugares & Elites',
    short: 'LUGARES',
    accent: '#ffd166',
    description: 'Os capítulos, suas ruínas e os campeões de cada um.',
  },
  {
    id: 'relics',
    label: 'Fenômenos & Relíquias',
    short: 'MAPA',
    accent: '#b48bff',
    description: 'As coisas estranhas que pulsam pelo mapa.',
  },
];

const AI_LABELS: Record<EnemyAI, string> = {
  leaper: 'Emboscada saltitante',
  melee: 'Corpo a corpo',
  flyer: 'Voo e disparo',
  charger: 'Investida linear',
  caster: 'Feitiçaria à distância',
  brute: 'Esmagamento em área',
  teleporter: 'Teleporte e corte',
  turret: 'Torreta de leque',
  diver: 'Mergulho aéreo',
  mirror: 'Espelho e eco',
};

const CREATURE_LORE: Record<EnemyKind, string> = {
  crawler:
    'Nasceu do asfalto rachado, onde o Ferrato misturou inseto, carne e pedra. O corpo baixo e segmentado se arrasta em silêncio até o salto.',
  warrior:
    'Restos de soldados Khar\'uun que ainda obedecem a uma guerra morta. A armadura cresceu para dentro do corpo e a lâmina virou osso.',
  drone:
    'Uma máquina de reconhecimento que aprendeu a ter fome. O casco assimilado pisca como se ainda transmitisse coordenadas para uma frota inexistente.',
  hound:
    'Cão de rua transformado em arma. O pelo virou brasa, o focinho se alongou e o instinto de matilha ficou preso dentro do crânio.',
  caster:
    'O manto esconde um corpo que já não tem rosto. A criatura canta baixinho e transforma a culpa de quem ouve em projéteis.',
  brute:
    'Uma pilha de músculo, concreto e ferrugem. Cada passo racha o chão; cada soco é uma demolição com hora marcada.',
  shade:
    'Alma que não aceitou o próprio fim. A fumaça fria imita a pessoa que ela foi e ataca quem ainda tem calor.',
  construct:
    'Vitral animado por uma oração corrompida. As cores continuam belas, mas cada estilhaço corta na direção de quem olha.',
  seraph:
    'Um anjo que caiu de dentro para fora. As asas ainda cantam, mas o corpo aprendeu a mergulhar como um predador.',
  echo:
    'Uma memória armada. Copia o gesto de um Desperto e devolve o golpe com um rosto que quase parece familiar.',
};

const ARC_FLAVOR: Record<number, string> = {
  1: 'Em New Haven, a cidade virou um estômago de concreto. As criaturas caçam entre entregas atrasadas, semáforos mortos e o cheiro de pizza queimada.',
  2: 'Em Brasília, a fome desceu sobre o Planalto e transformou o luto em legião. Cada ruína ainda guarda o nome de alguém que tentou apagar o fogo.',
  3: 'No vazio de SOLACE, o Ferrato assimilou tripulação e máquinas. Cada eco ainda repete o último pedido de socorro antes de atacar.',
  4: 'No Abismo Rubro, a corrupção é moeda. Almas são colecionadas, corpos viram instrumentos de sentença e o chão respira magma.',
  5: 'Na Eclésia, a luz foi tomada por dentro. O que resta canta hinos com a boca cheia de vidro e acredita que ainda está purificando o céu.',
  6: 'No Nexus, tudo o que foi devorado volta como eco — inclusive os monstros que os Despertos já venceram e as cidades que juraram salvar.',
};

const RELIC_LORE: Record<RelicKind, { name: string; subtitle: string; lore: string[]; accent: string; effect: string }> = {
  fracture: {
    name: 'Fratura Viva',
    subtitle: 'Rachadura pulsante no chão',
    accent: '#ff5a3c',
    lore: [
      'Uma ferida no próprio mapa. O chão se abre em intervalos regulares e cospe magma, ossos e detritos do que foi digerido.',
      'A Fratura não escolhe lado: atinge heróis e criaturas. Usar a erupção contra a horda é uma das primeiras lições de sobrevivência.',
    ],
    effect: 'Erupção periódica em área. Dano alto contra tudo que estiver no raio.',
  },
  sanctuary: {
    name: 'Santuário de Carne',
    subtitle: 'Coração suspenso em runas',
    accent: '#8df4a8',
    lore: [
      'Um coração que ainda bate dentro de um círculo de runas. Não pertence a ninguém que o jogador conheça, mas responde ao toque.',
      'Quem encosta recebe calor suficiente para continuar de pé. O Santuário se apaga depois de curar, como se tivesse dado a última reserva.',
    ],
    effect: 'Restaura 9% da vida e concede invulnerabilidade breve.',
  },
  anchor: {
    name: 'Âncora Gravitacional',
    subtitle: 'Peso que dobra o espaço',
    accent: '#9a7bff',
    lore: [
      'Um fragmento de SOLACE cravado no chão. A gravidade ao redor se inclina e tudo começa a escorregar para o centro.',
      'Kael reconhece a engenharia. O resto do grupo aprende a usar a âncora para reposicionar a luta — ou para puxar o chefe para perto.',
    ],
    effect: 'Atrai heróis, inimigos e chefes para o centro do campo.',
  },
  overcharge: {
    name: 'Sobrecarga',
    subtitle: 'Faísca engarrafada do Véu',
    accent: '#56e3ff',
    lore: [
      'Uma descarga tão antiga que esqueceu de apagar. Flutua em um invólucro de runas e responde à bioeletricidade dos Despertos.',
      'Ao ser absorvida, força a habilidade especial de volta ao corpo e mantém o herói sobrecarregado por alguns segundos.',
    ],
    effect: 'Zera o cooldown da habilidade e concede 5s de sobrecarga.',
  },
};

const PHENOMENON_LORE: Record<AmbientKind, { name: string; subtitle: string; lore: string[]; accent: string }> = {
  embers: {
    name: 'Brasas do Véu',
    subtitle: 'Chuva quente sobre New Haven',
    accent: '#ff8a3d',
    lore: [
      'Pequenos pontos de calor sobem do asfalto como se a cidade ainda estivesse queimando por dentro.',
      'Não são apenas partículas: algumas brasas procuram movimento. Quando o vento muda, o ar cheira a metal e a entrega queimada.',
    ],
  },
  ash: {
    name: 'Cinzas Ascendentes',
    subtitle: 'O luto de Brasília no ar',
    accent: '#ffae5a',
    lore: [
      'A capital queima em círculos. A cinza sobe em vez de cair, cobrindo o Planalto com um veludo cinza que apaga as pegadas.',
      'Miriam conhece esse cheiro. É o mesmo dos capacetes que ela não conseguiu trazer de volta.',
    ],
  },
  stars: {
    name: 'Mar de Estrelas',
    subtitle: 'O silêncio de SOLACE',
    accent: '#6ff2ff',
    lore: [
      'Estrelas suspensas em um vazio que não deveria ter chão. A luz viaja devagar demais e cada brilho parece um pedido de socorro atrasado.',
      'Kael conserta a rota com os olhos. O resto do grupo aprende a não olhar por tempo demais para o que está do outro lado do casco.',
    ],
  },
  magma: {
    name: 'Magma Vivo',
    subtitle: 'O chão que respira no Abismo',
    accent: '#ff4a2f',
    lore: [
      'O Abismo não tem chão: tem uma garganta. O magma pulsa como um coração e sobe em veias que atravessam as ruínas de cobre.',
      'Ozric sente a temperatura mudar antes de qualquer ataque. É a única vantagem de ter passado tanto tempo do lado de dentro.',
    ],
  },
  feathers: {
    name: 'Penas da Aurora',
    subtitle: 'Queda lenta da Eclésia',
    accent: '#ffe6a3',
    lore: [
      'Penas de luz caem sem parar de um céu que já não tem dono. Algumas ainda estão quentes; outras se desfazem antes de tocar o chão.',
      'Élodie as cataloga por reflexo. O hábito de nomear o que cai é a última coisa que a Ordem não conseguiu corromper nela.',
    ],
  },
  cosmic: {
    name: 'Corrente do Nexus',
    subtitle: 'Memórias entre planos',
    accent: '#b48bff',
    lore: [
      'Fios de memória atravessam o ar como correntes invisíveis. Cada um carrega um rosto, uma cidade ou um último gesto.',
      'Thryc reconhece o padrão: o Nexus não está vazio. Está cheio de tudo o que o Ferrato engoliu e não conseguiu esquecer.',
    ],
  },
};

const RELIC_KINDS: RelicKind[] = ['fracture', 'sanctuary', 'anchor', 'overcharge'];
const AMBIENT_KINDS: AmbientKind[] = ['embers', 'ash', 'stars', 'magma', 'feathers', 'cosmic'];

export const archiveCreatureId = (arc: number, kind: EnemyKind): string => `creature:${arc}:${kind}`;
export const archiveBossId = (boss: BossId): string => `boss:${boss}`;
export const archivePlaceId = (stageId: number): string => `place:${stageId}`;
export const archiveRelicId = (kind: RelicKind): string => `relic:${kind}`;
export const archivePhenomenonId = (kind: AmbientKind): string => `phenomenon:${kind}`;

function heroEntries(): ArchiveEntry[] {
  return CHARACTER_ORDER.map((id, index) => {
    const def = CHARACTERS[id];
    return {
      id: `hero:${id}`,
      section: 'heroes',
      name: def.name,
      subtitle: `${def.epithet} · ${def.combat}`,
      lore: [
        ...def.lore,
        `Habilidade: ${def.ability.name} — ${def.ability.desc}`,
        `Passiva: ${def.passive.name} — ${def.passive.desc}`,
      ],
      accent: def.colors.accent,
      arc: index + 1,
      heroId: id,
      stats: [
        { label: 'ORIGEM', value: def.origin },
        { label: 'ESTILO', value: def.style },
        { label: 'ARMA', value: def.weapon === 'fists' ? 'PUNHOS' : def.weapon === 'gauntlets' ? 'MANOPLAS' : def.weapon === 'gravity' ? 'GRAVIDADE' : def.weapon === 'scythe' ? 'FOICE' : def.weapon === 'sword' ? 'ESPADA' : 'LÂMINAS' },
        { label: 'COMBO', value: def.comboName },
      ],
    };
  });
}

function creatureEntries(): ArchiveEntry[] {
  const entries: ArchiveEntry[] = [];
  for (let arc = 1; arc <= ARC_COUNT; arc++) {
    const stages = getArcStages(arc);
    const first = stages[0];
    const kinds = Object.keys(first.enemyNames) as EnemyKind[];
    for (const kind of kinds) {
      const name = first.enemyNames[kind];
      if (!name) continue;
      const base = ENEMY_BASE[kind];
      entries.push({
        id: archiveCreatureId(arc, kind),
        section: 'creatures',
        name,
        subtitle: `${base.baseName} · ${first.location.split('—')[0]?.trim() ?? 'Plano desconhecido'}`,
        lore: [CREATURE_LORE[kind], ARC_FLAVOR[arc]],
        accent: base.accent,
        arc,
        stageId: first.id,
        creatureKind: kind,
        stats: [
          { label: 'ARQUÉTIPO', value: base.baseName },
          { label: 'COMPORTAMENTO', value: AI_LABELS[base.ai] },
          { label: 'AMEAÇA', value: base.hp >= 100 ? 'ALTA' : base.hp >= 55 ? 'MÉDIA' : 'BAIXA' },
          { label: 'ORIGEM', value: `ARCO ${arc}` },
        ],
      });
    }
  }
  return entries;
}

function bossEntries(): ArchiveEntry[] {
  return (Object.keys(BOSSES) as BossId[]).map((id) => {
    const def = BOSSES[id];
    // BossDef.stage guarda o arco (1–6); o chefe fecha o sexto capítulo do arco.
    const arc = def.stage;
    const stage = getStage(arc * CHAPTERS_PER_ARC);
    return {
      id: archiveBossId(id),
      section: 'bosses',
      name: def.name,
      subtitle: `${def.title} · ${stage.location}`,
      lore: [
        def.intro,
        `Fases: ${def.phases.map((phase) => phase.name).join(' → ')}.`,
        def.defeat,
      ],
      accent: def.colors.accent,
      arc,
      stageId: stage.id,
      bossId: id,
      stats: [
        { label: 'TÍTULO', value: def.title },
        { label: 'FASES', value: String(def.phases.length) },
        { label: 'ARENA', value: stage.name },
        { label: 'VITALIDADE', value: String(def.hp) },
      ],
    };
  });
}

function placeEntries(): ArchiveEntry[] {
  return STAGES.map((stage) => {
    const boss = stage.boss ? BOSSES[stage.boss] : null;
    return {
      id: archivePlaceId(stage.id),
      section: 'places',
      name: stage.name,
      subtitle: `${stage.subtitle} · ${stage.location}`,
      lore: [stage.synopsis, stage.motive],
      accent: stage.palette.accent,
      arc: stage.arc,
      stageId: stage.id,
      place: {
        location: stage.location,
        elite: stage.eliteName,
        boss: boss?.name,
      },
      stats: [
        { label: 'LOCAL', value: stage.location },
        { label: 'ELITE', value: stage.eliteName },
        { label: boss ? 'CHEFE' : 'CHEFE', value: boss?.name ?? 'NENHUM — CAPÍTULO DE PASSAGEM' },
        { label: 'AMBIENTE', value: stage.ambient.toUpperCase() },
      ],
    };
  });
}

function relicEntries(): ArchiveEntry[] {
  const entries: ArchiveEntry[] = RELIC_KINDS.map((kind) => {
    const def = RELIC_LORE[kind];
    return {
      id: archiveRelicId(kind),
      section: 'relics',
      name: def.name,
      subtitle: def.subtitle,
      lore: def.lore,
      accent: def.accent,
      arc: 0,
      relicKind: kind,
      stats: [
        { label: 'TIPO', value: 'RELÍQUIA DE ARENA' },
        { label: 'EFEITO', value: def.effect },
      ],
    };
  });

  for (const kind of AMBIENT_KINDS) {
    const def = PHENOMENON_LORE[kind];
    entries.push({
      id: archivePhenomenonId(kind),
      section: 'relics',
      name: def.name,
      subtitle: def.subtitle,
      lore: def.lore,
      accent: def.accent,
      arc: AMBIENT_KINDS.indexOf(kind) + 1,
      ambient: kind,
      stats: [
        { label: 'TIPO', value: 'FENÔMENO DO MAPA' },
        { label: 'ARCO', value: String(AMBIENT_KINDS.indexOf(kind) + 1) },
      ],
    });
  }
  return entries;
}

export const ARCHIVE_ENTRIES: ArchiveEntry[] = [
  ...heroEntries(),
  ...creatureEntries(),
  ...bossEntries(),
  ...placeEntries(),
  ...relicEntries(),
];

export const ARCHIVE_BY_ID = new Map(ARCHIVE_ENTRIES.map((entry) => [entry.id, entry]));
export const ARCHIVE_ENTRY_IDS = new Set(ARCHIVE_ENTRIES.map((entry) => entry.id));
export const ARCHIVE_TOTAL = ARCHIVE_ENTRIES.length;

export function archiveEntriesForSection(section: ArchiveSection): ArchiveEntry[] {
  return ARCHIVE_ENTRIES.filter((entry) => entry.section === section);
}

export function archiveEntryUnlocked(entry: ArchiveEntry, save: ArchiveSaveView): boolean {
  if (entry.section === 'heroes') return entry.heroId ? save.unlocked.includes(entry.heroId) : false;
  return save.archive.includes(entry.id);
}

export function archiveSectionProgress(
  section: ArchiveSection,
  save: ArchiveSaveView,
): { unlocked: number; total: number } {
  const entries = archiveEntriesForSection(section);
  return {
    unlocked: entries.filter((entry) => archiveEntryUnlocked(entry, save)).length,
    total: entries.length,
  };
}

export function archiveTotalProgress(save: ArchiveSaveView): { unlocked: number; total: number } {
  return {
    unlocked: ARCHIVE_ENTRIES.filter((entry) => archiveEntryUnlocked(entry, save)).length,
    total: ARCHIVE_TOTAL,
  };
}

/** Relíquias geradas em uma fase, espelhando buildStageObstacles. */
export function stageRelicKinds(stage: StageDef): RelicKind[] {
  const count = Math.max(2, Math.min(5, 2 + Math.floor((stage.arc - 1) / 2) + (stage.chapter >= 5 ? 1 : 0)));
  const extras: RelicKind[] = ['anchor', 'overcharge', 'fracture'];
  const kinds: RelicKind[] = [];
  for (let i = 0; i < count; i++) {
    if (i === 0) kinds.push('sanctuary');
    else if (i === 1) kinds.push('fracture');
    else kinds.push(extras[(stage.id + i) % extras.length]);
  }
  return kinds;
}

/**
 * Reconstrói o arquivo para saves antigos (ou v2 sem o campo `archive`).
 * Só revela o que o jogador necessariamente viu ao vencer os capítulos salvos.
 */
export function backfillArchiveIds(cleared: readonly number[], _maxStage: number): string[] {
  const ids = new Set<string>();
  for (const stageId of cleared) {
    if (!Number.isFinite(stageId) || stageId < 1 || stageId > STAGES.length) continue;
    const stage = getStage(stageId);
    ids.add(archivePlaceId(stage.id));
    ids.add(archivePhenomenonId(stage.ambient));
    for (const wave of stage.waves) {
      for (const spawn of wave.spawns) ids.add(archiveCreatureId(stage.arc, spawn.kind));
    }
    if (stage.boss) ids.add(archiveBossId(stage.boss));
    for (const kind of stageRelicKinds(stage)) ids.add(archiveRelicId(kind));
  }
  return Array.from(ids).filter((id) => ARCHIVE_ENTRY_IDS.has(id));
}
