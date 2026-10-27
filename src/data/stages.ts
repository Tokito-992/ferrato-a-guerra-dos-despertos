/**
 * A campanha em seis arcos de seis capítulos.
 *
 * Cada arco é o planeta/plano de um Desperto. Os cinco primeiros capítulos
 * aprofundam a história pessoal do herói; o sexto é o clímax com o chefe do
 * planeta antes de o Véu levar o grupo ao próximo arco.
 *
 * As seis fases originais foram preservadas como os capítulos 6, 12, 18, 24,
 * 30 e 36 — os confrontos finais de Ravi, Miriam, Kael, Ozric, Élodie e Thryc.
 */

import type { CharacterId } from './characters.js';
import type { BossId } from './bosses.js';
import type { EnemyKind } from './enemies.js';
import { hexToRgba, mixColor } from '../core/math.js';

export type AmbientKind = 'embers' | 'ash' | 'stars' | 'magma' | 'feathers' | 'cosmic';

export interface WaveSpawn {
  kind: EnemyKind;
  count: number;
  elite?: boolean;
}

export interface WaveDef {
  at: number;
  label: string;
  spawns: WaveSpawn[];
}

export interface StagePalette {
  skyTop: string;
  skyBottom: string;
  far: string;
  mid: string;
  near: string;
  ground: string;
  groundDark: string;
  accent: string;
  accent2: string;
  fog: string;
  sun: string;
}

export interface StageDef {
  id: number;
  /** Arco/planeta (1..6). */
  arc: number;
  /** Capítulo dentro do arco (1..6). */
  chapter: number;
  name: string;
  subtitle: string;
  location: string;
  synopsis: string;
  /** Linha curta de lore exibida na seleção de capítulo. */
  motive: string;
  width: number;
  floor: number;
  gravity: number;
  music: number;
  ambient: AmbientKind;
  palette: StagePalette;
  waves: WaveDef[];
  /** Capítulos 1..5 não têm chefe; o capítulo 6 encerra o planeta. */
  boss: BossId | null;
  character: CharacterId;
  enemyNames: Partial<Record<EnemyKind, string>>;
  eliteName: string;
  /** Multiplicador de vida/dano dos inimigos da fase. */
  difficulty: number;
}

export const ARC_COUNT = 6;
export const CHAPTERS_PER_ARC = 6;
export const MAX_STAGE = ARC_COUNT * CHAPTERS_PER_ARC;
export const STAGE_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
export const FLOOR_Y = 602;

interface ChapterSeed {
  name: string;
  location: string;
  synopsis: string;
  motive: string;
  eliteName: string;
  waves: [string, string, string];
  tint: string;
  tintAmount: number;
  accent?: string;
  accent2?: string;
}

interface FinaleSeed {
  name: string;
  location: string;
  synopsis: string;
  motive: string;
  width: number;
  waves: WaveDef[];
  boss: BossId;
  enemyNames: Partial<Record<EnemyKind, string>>;
  eliteName: string;
}

interface ArcSeed {
  arc: number;
  hero: CharacterId;
  planet: string;
  ambient: AmbientKind;
  gravity: number;
  palette: StagePalette;
  enemyNames: Partial<Record<EnemyKind, string>>;
  pool: EnemyKind[];
  chapters: ChapterSeed[];
  finale: FinaleSeed;
}

const NEW_HAVEN_PALETTE: StagePalette = {
  skyTop: '#1b0f18',
  skyBottom: '#e0603a',
  far: '#4a2430',
  mid: '#2c1a22',
  near: '#161016',
  ground: '#2b2224',
  groundDark: '#151012',
  accent: '#ff7a3c',
  accent2: '#ffd166',
  fog: 'rgba(255, 112, 60, 0.12)',
  sun: '#ffb36b',
};

const BRASILIA_PALETTE: StagePalette = {
  skyTop: '#241812',
  skyBottom: '#b26a3c',
  far: '#4b3a32',
  mid: '#2d2420',
  near: '#191414',
  ground: '#3a332d',
  groundDark: '#1c1815',
  accent: '#ffae5a',
  accent2: '#ff5a3c',
  fog: 'rgba(255, 170, 90, 0.12)',
  sun: '#ffd08a',
};

const SOLACE_PALETTE: StagePalette = {
  skyTop: '#040812',
  skyBottom: '#0d2a48',
  far: '#122b4a',
  mid: '#0b1b2d',
  near: '#060d18',
  ground: '#22344a',
  groundDark: '#0d1723',
  accent: '#6ff2ff',
  accent2: '#7f6bff',
  fog: 'rgba(90, 220, 255, 0.1)',
  sun: '#a8f6ff',
};

const ABYSS_PALETTE: StagePalette = {
  skyTop: '#140306',
  skyBottom: '#7a1119',
  far: '#3c0c14',
  mid: '#240810',
  near: '#120409',
  ground: '#2c0f14',
  groundDark: '#150609',
  accent: '#ff4a2f',
  accent2: '#ff2f6a',
  fog: 'rgba(255, 50, 40, 0.16)',
  sun: '#ff7a3c',
};

const ECLESIA_PALETTE: StagePalette = {
  skyTop: '#20203a',
  skyBottom: '#c9b98a',
  far: '#5c5a78',
  mid: '#3c3a54',
  near: '#25243a',
  ground: '#4c465c',
  groundDark: '#262232',
  accent: '#ffe6a3',
  accent2: '#ffcf6a',
  fog: 'rgba(255, 235, 175, 0.14)',
  sun: '#fff3c9',
};

const NEXUS_PALETTE: StagePalette = {
  skyTop: '#08040f',
  skyBottom: '#251046',
  far: '#1a1040',
  mid: '#120a28',
  near: '#080414',
  ground: '#24163a',
  groundDark: '#0f081d',
  accent: '#b48bff',
  accent2: '#6ff2ff',
  fog: 'rgba(180, 139, 255, 0.14)',
  sun: '#ff8ae2',
};

const ARC_SEEDS: ArcSeed[] = [
  {
    arc: 1,
    hero: 'ravi',
    planet: 'Terra — New Haven',
    ambient: 'embers',
    gravity: 1950,
    palette: NEW_HAVEN_PALETTE,
    pool: ['crawler', 'hound', 'warrior', 'caster', 'brute'],
    enemyNames: {
      crawler: 'Rastejante Ferratizado',
      hound: 'Cão de Asfalto',
      warrior: 'Saqueador de Carne',
      caster: 'Faiscante',
      brute: 'Brutamontes de Ferro',
    },
    chapters: [
      {
        name: 'A Última Entrega',
        location: 'Terra — Rua da Pizzaria, New Haven',
        synopsis:
          'Dezessete e dez. Ravi ainda tem três entregas e um mundo inteiro para não deixar cair.',
        motive: 'Proteger a rua que o criou — uma entrega de cada vez.',
        eliteName: 'Cão de Rua Ferratizado',
        waves: ['Primeiro Tremor', 'Becos Famintos', 'A Última Entrega'],
        tint: '#2a0f18',
        tintAmount: 0.18,
        accent: '#ff8a3d',
        accent2: '#ffd166',
      },
      {
        name: 'Mercado em Pânico',
        location: 'Terra — Mercado Central de New Haven',
        synopsis:
          'Civis presos entre barracas e criaturas. Ravi descobre que uma piada também pode ser um escudo.',
        motive: 'Ninguém deveria enfrentar o medo sozinho.',
        eliteName: 'Açougueiro de Ferro',
        waves: ['Corredores Selvagens', 'Pânico no Mercado', 'O Açougueiro'],
        tint: '#3a1a24',
        tintAmount: 0.14,
        accent: '#ff9a3c',
        accent2: '#56e3ff',
      },
      {
        name: 'Estação Central',
        location: 'Terra — Metrô de New Haven',
        synopsis:
          'Nos túneis, sobreviventes se agarram a uma última luz. Ravi aprende que correr rápido não é o mesmo que salvar todo mundo.',
        motive: 'A velocidade não basta se você não olhar para trás.',
        eliteName: 'Condutor de Carne',
        waves: ['Plataforma Vazia', 'Túneis Famintos', 'O Condutor'],
        tint: '#0a1420',
        tintAmount: 0.28,
        accent: '#ffb36b',
        accent2: '#8df4ff',
      },
      {
        name: 'Ponte Nova Haven',
        location: 'Terra — Ponte sobre o Rio Cinza',
        synopsis:
          'A ponte é a única saída. Ravi segura a fila de refugiados enquanto o céu começa a rachar.',
        motive: 'Se a cidade vai cair, ela cai com ele de pé.',
        eliteName: 'Colosso de Ponte',
        waves: ['Fila de Refugiados', 'A Ponte Range', 'O Guardião de Concreto'],
        tint: '#3a1a16',
        tintAmount: 0.12,
        accent: '#ff6a3c',
        accent2: '#ffd166',
      },
      {
        name: 'Aurora de Ferro',
        location: 'Terra — Bairro de Ravi, New Haven',
        synopsis:
          'O céu se abre sobre o bairro. A faísca no peito de Ravi vira tempestade — e o Colosso desperta.',
        motive: 'A primeira faísca não foi acidente. Foi uma escolha.',
        eliteName: 'Arauto da Fome',
        waves: ['Chuva de Ferro', 'O Bairro em Chamas', 'O Arauto'],
        tint: '#5a2a1a',
        tintAmount: 0.1,
        accent: '#ffd166',
        accent2: '#ff5a3c',
      },
    ],
    finale: {
      name: 'O Despertar',
      location: 'Terra — Subúrbio de New Haven',
      synopsis:
        'O céu se abre por completo. Criaturas ferratizadas sobem do asfalto e o sangue de alguns moradores começa a ferver.',
      motive: 'Alguém precisa ficar de pé quando a rua inteira cai.',
      width: 2600,
      waves: [
        { at: 0, label: 'Primeiro Contato', spawns: [{ kind: 'crawler', count: 3 }] },
        {
          at: 950,
          label: 'Rastejantes',
          spawns: [{ kind: 'crawler', count: 4 }, { kind: 'crawler', count: 1, elite: true }],
        },
        {
          at: 1750,
          label: 'A Matilha',
          spawns: [{ kind: 'crawler', count: 4 }, { kind: 'crawler', count: 2, elite: true }],
        },
      ],
      boss: 'colossus',
      enemyNames: { crawler: 'Rastejante Ferratizado' },
      eliteName: 'Matilha Alfa',
    },
  },
  {
    arc: 2,
    hero: 'miriam',
    planet: 'Terra — Brasília',
    ambient: 'ash',
    gravity: 1950,
    palette: BRASILIA_PALETTE,
    pool: ['warrior', 'caster', 'hound', 'brute', 'shade'],
    enemyNames: {
      warrior: "Guerreiro Khar'uun Corrompido",
      caster: 'Ceifador Incendiário',
      hound: 'Cão de Cinzas',
      brute: 'Brutamontes Carbonizado',
      shade: 'Sombra de Fuligem',
    },
    chapters: [
      {
        name: 'Estrada de Cinzas',
        location: 'Terra — Rodovia dos Imortais',
        synopsis:
          'Um comboio de sobreviventes corta a estrada sob uma chuva de brasas. Miriam assume o volante e a responsabilidade.',
        motive: 'Ninguém fica para trás — nunca.',
        eliteName: 'Saqueador Carbonizado',
        waves: ['Convoy Interrompido', 'Fogo na Rodovia', 'O Saqueador'],
        tint: '#2a1810',
        tintAmount: 0.16,
        accent: '#ffae5a',
        accent2: '#ff5a3c',
      },
      {
        name: 'Quartel 09',
        location: 'Terra — Posto de Bombeiros 09, Brasília',
        synopsis:
          'As ruínas do antigo quartel ainda cheiram a fumaça. Miriam encontra o próprio capacete e a voz de quem a ensinou a entrar no fogo.',
        motive: 'O fogo não apaga o que a gente salvou.',
        eliteName: 'Bombeiro Corrompido',
        waves: ['Alarme Falso', 'Corredores de Fuligem', 'O Último Turno'],
        tint: '#3a2418',
        tintAmount: 0.12,
        accent: '#ff9b3c',
        accent2: '#ffe6a3',
      },
      {
        name: 'Hospital Esperança',
        location: 'Terra — Hospital Esperança, Brasília',
        synopsis:
          'Feridos demais, médicos de menos. Miriam carrega quem pode e promete voltar por quem não pode.',
        motive: 'Cada vida que sai daqui é uma vitória.',
        eliteName: 'Enfermeiro da Peste',
        waves: ['Triagem', 'UTI Tomada', 'O Médico Cego'],
        tint: '#1a2024',
        tintAmount: 0.18,
        accent: '#8df4a8',
        accent2: '#ffae5a',
      },
      {
        name: 'Avenida dos Heróis',
        location: 'Terra — Memorial dos Heróis, Brasília',
        synopsis:
          'Os nomes da antiga equipe de Miriam estão gravados na pedra. Ela não chora; ela memoriza cada um.',
        motive: 'Lembrar dos nomes é continuar lutando.',
        eliteName: 'Eco do Capitão Duarte',
        waves: ['Cortejo Quebrado', 'Nomes na Pedra', 'O Eco do Capitão'],
        tint: '#242028',
        tintAmount: 0.14,
        accent: '#ffd166',
        accent2: '#ff5a7a',
      },
      {
        name: 'Fogo Que Não Cessa',
        location: 'Terra — Esplanada em Chamas',
        synopsis:
          "A capital queima em círculos. No centro do incêndio, o General Vek'thar espera com um canhão apontado para o céu.",
        motive: 'Apagar o incêndio na nascente — antes que ele alcance o resto do mundo.',
        eliteName: 'Brutamontes Incendiário',
        waves: ['Esplanada', 'Chuva de Brasas', 'O Incendiário'],
        tint: '#4a1a14',
        tintAmount: 0.1,
        accent: '#ff5a3c',
        accent2: '#ffd166',
      },
    ],
    finale: {
      name: 'Cinzas Ascendentes',
      location: 'Terra — Ruínas de Brasília',
      synopsis:
        'O exército convencional caiu. Os ataques são coordenados. Aberrações maiores mostram que não são invasores: são conquistadores.',
      motive: 'Ela já viu fogo demais. Desta vez vai apagar a fonte.',
      width: 2820,
      waves: [
        { at: 0, label: 'Vanguarda', spawns: [{ kind: 'warrior', count: 3 }] },
        { at: 1000, label: 'Legião de Cinzas', spawns: [{ kind: 'warrior', count: 4 }] },
        {
          at: 1900,
          label: 'O Ceifador',
          spawns: [{ kind: 'warrior', count: 3 }, { kind: 'caster', count: 1, elite: true }],
        },
      ],
      boss: 'vekthar',
      enemyNames: {
        warrior: "Guerreiro Khar'uun Corrompido",
        caster: 'Ceifador Incendiário',
      },
      eliteName: 'Ceifador Incendiário',
    },
  },
  {
    arc: 3,
    hero: 'kael',
    planet: 'Espaço — SOLACE',
    ambient: 'stars',
    gravity: 1500,
    palette: SOLACE_PALETTE,
    pool: ['drone', 'warrior', 'construct', 'caster', 'echo'],
    enemyNames: {
      drone: 'Drone Assimilado',
      warrior: "Tripulante Khar'uun Corrompido",
      construct: 'Construto de Doca',
      caster: 'Manto de Vácuo',
      echo: 'Eco de Tripulação',
    },
    chapters: [
      {
        name: 'Órfãos do Amanhecer',
        location: 'Espaço — Plataforma Amanhecer',
        synopsis:
          'Kael volta ao lugar onde cresceu e onde aprendeu a consertar tudo, menos a própria solidão.',
        motive: 'Consertar o que o mundo quebrou começa em casa.',
        eliteName: 'Sentinela de Doca',
        waves: ['Pátio Abandonado', 'Doca de Lançamento', 'A Sentinela'],
        tint: '#101a2a',
        tintAmount: 0.16,
        accent: '#6ff2ff',
        accent2: '#7f6bff',
      },
      {
        name: 'Doca de Atracação',
        location: 'Espaço — SOLACE, Doca 3',
        synopsis:
          'A estação gira sem sinal. Kael atravessa o casco com uma ferramenta e uma teoria que ninguém mais entende.',
        motive: 'A gravidade é só mais uma coisa para consertar.',
        eliteName: 'Drone de Atracação',
        waves: ['Atracação Forçada', 'Gravidade Zero', 'O Drone'],
        tint: '#0a1828',
        tintAmount: 0.14,
        accent: '#56e3ff',
        accent2: '#b48bff',
      },
      {
        name: 'Corredor 7',
        location: 'Espaço — SOLACE, Corredor 7',
        synopsis:
          'Os corredores estão cheios de ecos da tripulação. Kael encontra o último registro da Dra. Sora: ela ficou para selar o núcleo.',
        motive: 'Ninguém fica para trás — nem os que já se foram.',
        eliteName: 'Tripulante Assimilado',
        waves: ['Corredor Sete', 'Ecos da Tripulação', 'O Assimilado'],
        tint: '#0c1424',
        tintAmount: 0.22,
        accent: '#9d8bff',
        accent2: '#6ff2ff',
      },
      {
        name: 'Coração de SOLACE',
        location: 'Espaço — Núcleo de SOLACE',
        synopsis:
          'O núcleo pede uma escolha: a estação ou o portal. Kael aprende que consertar também é saber o que deixar ir.',
        motive: 'Talvez consertar seja saber o que deixar ir.',
        eliteName: 'Núcleo Defensivo',
        waves: ['Sala de Máquinas', 'Defesas do Núcleo', 'O Guardião'],
        tint: '#121a3a',
        tintAmount: 0.18,
        accent: '#6ff2ff',
        accent2: '#ff8ae2',
      },
      {
        name: 'Órbita de Guerra',
        location: 'Espaço — Casco Externo de SOLACE',
        synopsis:
          "Sem gravidade, sem chão, sem plano B. O portal se abre e o Núcleo-Orbitário Xal'mor desperta.",
        motive: 'Mesmo no vazio, a gente escolhe ficar.',
        eliteName: 'Sentinela Orbital',
        waves: ['Casco Externo', 'Sem Gravidade', 'A Sentinela Orbital'],
        tint: '#0a1a3a',
        tintAmount: 0.1,
        accent: '#6ff2ff',
        accent2: '#ff5a7a',
      },
    ],
    finale: {
      name: 'Órbita Quebrada',
      location: 'Espaço — Estação SOLACE',
      synopsis:
        "Para impedir a abertura de um portal massivo, os Despertos vão ao espaço. Lá descobrem os Khar'uun — e o que o Ferrato fez com eles.",
      motive: 'Se o espaço não tem chão, Kael constrói um.',
      width: 2940,
      waves: [
        { at: 0, label: 'Drones Assimilados', spawns: [{ kind: 'drone', count: 3 }] },
        {
          at: 1050,
          label: 'Tripulação',
          spawns: [{ kind: 'drone', count: 3 }, { kind: 'warrior', count: 2 }],
        },
        {
          at: 1950,
          label: 'Sentinela',
          spawns: [
            { kind: 'drone', count: 3 },
            { kind: 'warrior', count: 3 },
            { kind: 'drone', count: 1, elite: true },
          ],
        },
      ],
      boss: 'xalmor',
      enemyNames: {
        drone: 'Drone Assimilado',
        warrior: "Tripulante Khar'uun Corrompido",
      },
      eliteName: 'Sentinela Gravitacional',
    },
  },
  {
    arc: 4,
    hero: 'ozric',
    planet: 'Inferno — Abismo Rubro',
    ambient: 'magma',
    gravity: 1950,
    palette: ABYSS_PALETTE,
    pool: ['shade', 'hound', 'brute', 'caster', 'echo'],
    enemyNames: {
      shade: 'Alma Penitente Corrompida',
      hound: 'Cão Rubro',
      brute: 'Carrasco Traidor',
      caster: 'Manto de Cinzas',
      echo: 'Eco de Alma',
    },
    chapters: [
      {
        name: 'O Julgamento',
        location: 'Inferno — Tribunal de Ossos',
        synopsis:
          'Ozric era o carrasco do Abismo. Diante da alma de uma criança, ele descobre que uma sentença pode ser uma escolha.',
        motive: 'Uma alma inocente não se dobra.',
        eliteName: 'Carrasco Auxiliar',
        waves: ['Fila de Almas', 'O Tribunal', 'O Auxiliar'],
        tint: '#2a080c',
        tintAmount: 0.16,
        accent: '#ff4a2f',
        accent2: '#ffd166',
      },
      {
        name: 'Correntes do Exílio',
        location: 'Inferno — Poço das Correntes',
        synopsis:
          'O Barão o acorrentou por desobedecer. Ozric quebra os elos com a primeira chama negra.',
        motive: 'Nenhuma corrente prende uma sentença justa.',
        eliteName: 'Carcereiro Rubro',
        waves: ['Poço Fundo', 'Correntes Vivas', 'O Carcereiro'],
        tint: '#1a0408',
        tintAmount: 0.22,
        accent: '#ff3357',
        accent2: '#ff8a3c',
      },
      {
        name: 'Cidade das Almas',
        location: 'Inferno — Cidade de Cobre',
        synopsis:
          'Almas esquecidas se escondem nas ruas de cobre. Ozric promete que nenhuma será devorada enquanto ele carregar a foice.',
        motive: 'As almas esquecidas ainda têm nome.',
        eliteName: 'Coletor de Almas',
        waves: ['Ruas de Cobre', 'Fome de Almas', 'O Coletor'],
        tint: '#2a1408',
        tintAmount: 0.16,
        accent: '#ff8a3c',
        accent2: '#ff3357',
      },
      {
        name: 'O Trono Vazio',
        location: 'Inferno — Salão do Barão',
        synopsis:
          'O trono de Acheron está vazio, mas a voz dele não. Os antigos companheiros de Ozric já não têm rosto.',
        motive: 'Um trono vazio não faz um rei.',
        eliteName: 'General Traidor',
        waves: ['Salão Negro', 'Guardas do Barão', 'O General'],
        tint: '#140208',
        tintAmount: 0.2,
        accent: '#ff3357',
        accent2: '#b48bff',
      },
      {
        name: 'A Última Sentença',
        location: 'Inferno — Portões do Abismo',
        synopsis:
          'Ozric chega aos portões com a foice em chamas e a certeza de que a sentença final é escolher quem proteger.',
        motive: 'A sentença final é escolher quem proteger.',
        eliteName: 'Arauto do Abismo',
        waves: ['Portões', 'Chamas Negras', 'O Arauto'],
        tint: '#20060a',
        tintAmount: 0.14,
        accent: '#ff4a2f',
        accent2: '#ffd166',
      },
    ],
    finale: {
      name: 'Portões Corrompidos',
      location: 'Inferno — Níveis do Abismo Rubro',
      synopsis:
        'Ao fecharem um Portão, os Despertos são arrastados para o Inferno. As legiões de almas corrompidas são mais cruéis do que qualquer coisa já vista.',
      motive: 'Ele não veio julgar o Barão. Veio libertar as almas.',
      width: 3040,
      waves: [
        { at: 0, label: 'Almas Penitentes', spawns: [{ kind: 'shade', count: 3 }] },
        {
          at: 1050,
          label: 'Cães Rubros',
          spawns: [{ kind: 'hound', count: 3 }, { kind: 'shade', count: 2 }],
        },
        {
          at: 2050,
          label: 'Inquisidor',
          spawns: [
            { kind: 'brute', count: 2 },
            { kind: 'hound', count: 2 },
            { kind: 'brute', count: 1, elite: true },
          ],
        },
      ],
      boss: 'acheron',
      enemyNames: {
        shade: 'Alma Penitente Corrompida',
        hound: 'Cão Rubro',
        brute: 'Carrasco Traidor',
      },
      eliteName: 'Inquisidor Acorrentado',
    },
  },
  {
    arc: 5,
    hero: 'elodie',
    planet: 'Céu — Eclésia',
    ambient: 'feathers',
    gravity: 1950,
    palette: ECLESIA_PALETTE,
    pool: ['seraph', 'construct', 'caster', 'warrior', 'shade'],
    enemyNames: {
      seraph: 'Serafim Caído',
      construct: 'Construto Vitral',
      caster: 'Manto de Luz Corrompida',
      warrior: 'Guardião da Aurora Caído',
      shade: 'Sombra de Vitral',
    },
    chapters: [
      {
        name: 'O Juramento',
        location: 'Céu — Noviciado da Aurora',
        synopsis:
          'Élodie fez um voto de catalogar e selar, nunca lutar. O céu começou a cair antes de ela terminar de decorá-lo.',
        motive: 'Selar a dor para que ela não se espalhe.',
        eliteName: 'Guardião do Noviciado',
        waves: ['Claustro', 'Biblioteca Selada', 'O Guardião'],
        tint: '#2a283a',
        tintAmount: 0.14,
        accent: '#ffe6a3',
        accent2: '#fff4cd',
      },
      {
        name: 'Vitral Partido',
        location: 'Céu — Grande Vitral',
        synopsis:
          'O irmão de Élodie caiu. Para salvá-lo, ela quebrou o voto — e descobriu que a luz também pode cortar.',
        motive: 'Às vezes, salvar é impedir que a corrupção vença.',
        eliteName: 'Serafim Caído',
        waves: ['Vitral', 'Estilhaços', 'O Caído'],
        tint: '#3a3040',
        tintAmount: 0.12,
        accent: '#fff2b0',
        accent2: '#ff9b3c',
      },
      {
        name: 'Aurora Interior',
        location: 'Céu — Capela da Aurora',
        synopsis:
          'A Mestra Aurélia também caiu. Élodie precisa escolher entre a doutrina da Ordem e as pessoas que ainda respiram.',
        motive: 'A fé que não protege ninguém está vazia.',
        eliteName: 'Mestra Corrompida',
        waves: ['Capela', 'Coro Vazio', 'A Mestra'],
        tint: '#242038',
        tintAmount: 0.18,
        accent: '#ffe08a',
        accent2: '#ff5a7a',
      },
      {
        name: 'Coro dos Caídos',
        location: 'Céu — Coro Celestial',
        synopsis:
          'Os sobreviventes da Eclésia se dividem entre purificar e fugir. Élodie abre caminho para os que escolhem viver.',
        motive: 'Nenhuma pureza vale mais que uma vida.',
        eliteName: 'Coro de Lâminas',
        waves: ['Coro', 'Vozes Caídas', 'O Coro de Lâminas'],
        tint: '#302a44',
        tintAmount: 0.12,
        accent: '#fff4cd',
        accent2: '#b48bff',
      },
      {
        name: 'Asas de Luz',
        location: 'Céu — Escadaria de Malakhim',
        synopsis:
          'A escadaria até o Arcanjo é feita de penas e culpa. Élodie sobe sem pedir perdão.',
        motive: 'Não vim purificar o céu. Vim abrir espaço para ele respirar.',
        eliteName: 'Arauto da Aurora',
        waves: ['Escadaria', 'Asas de Luz', 'O Arauto'],
        tint: '#3a3048',
        tintAmount: 0.08,
        accent: '#fff4cd',
        accent2: '#ff8ae2',
      },
    ],
    finale: {
      name: 'Véu Rasgado',
      location: 'Céu — Eclésia Celestial em Ruínas',
      synopsis:
        'A maior parte do exército celestial sucumbiu. Os restantes se dividem entre purificar a Eclésia com fogo ou lutar ao lado dos Despertos.',
      motive: 'Ela não vai purificar o céu. Vai impedir que ele caia.',
      width: 3140,
      waves: [
        { at: 0, label: 'Serafins Caídos', spawns: [{ kind: 'seraph', count: 2 }] },
        {
          at: 1050,
          label: 'Vitrais Partidos',
          spawns: [{ kind: 'construct', count: 2 }, { kind: 'caster', count: 2 }],
        },
        {
          at: 2050,
          label: 'Cavaleiro da Aurora',
          spawns: [
            { kind: 'seraph', count: 3 },
            { kind: 'construct', count: 2 },
            { kind: 'seraph', count: 1, elite: true },
          ],
        },
      ],
      boss: 'malakhim',
      enemyNames: {
        seraph: 'Serafim Caído',
        caster: 'Manto de Luz Corrompida',
        construct: 'Construto Vitral',
      },
      eliteName: 'Cavaleiro da Aurora Caída',
    },
  },
  {
    arc: 6,
    hero: 'thryc',
    planet: 'Nexus — Entre Planos',
    ambient: 'cosmic',
    gravity: 1500,
    palette: NEXUS_PALETTE,
    pool: ['echo', 'construct', 'shade', 'drone', 'brute', 'seraph'],
    enemyNames: {
      echo: 'Eco Corrompido dos Despertos',
      construct: 'Manifestação dos Planos',
      shade: 'Eco da Terra',
      drone: 'Eco do Espaço',
      brute: 'Eco do Inferno',
      seraph: 'Eco do Céu',
    },
    chapters: [
      {
        name: 'Memórias de um Mundo',
        location: 'Nexus — Mar de Ecos',
        synopsis:
          'Thryc acorda dentro das memórias de um mundo devorado. A primeira coisa que elu sente não é fome: é saudade.',
        motive: 'Toda memória merece alguém que a carregue.',
        eliteName: 'Eco Antigo',
        waves: ['Mar de Ecos', 'Canção Quebrada', 'O Eco Antigo'],
        tint: '#0a0414',
        tintAmount: 0.14,
        accent: '#b48bff',
        accent2: '#6ff2ff',
      },
      {
        name: 'O Jardim de Vidro',
        location: 'Nexus — Jardim de Vidro',
        synopsis:
          'Um mundo morto ainda floresce em vidro. Thryc tenta segurar uma flor e aprende que o fim também pode ser bonito.',
        motive: 'O que termina ainda pode ter valido a pena.',
        eliteName: 'Jardineiro de Vidro',
        waves: ['Jardim', 'Raízes de Vidro', 'O Jardineiro'],
        tint: '#0e0a1e',
        tintAmount: 0.12,
        accent: '#6ff2ff',
        accent2: '#ff8ae2',
      },
      {
        name: 'Vozes do Véu',
        location: 'Nexus — Fenda da Fome',
        synopsis:
          'Ferrato oferece a Thryc todas as memórias que devorou. Elu recusa a fome e descobre que pode lutar.',
        motive: 'Eu não sou o que me devorou.',
        eliteName: 'Voz da Fome',
        waves: ['Fenda', 'Vozes', 'A Voz da Fome'],
        tint: '#12041a',
        tintAmount: 0.2,
        accent: '#ff8ae2',
        accent2: '#b48bff',
      },
      {
        name: 'O Primeiro Eco',
        location: 'Nexus — Ponte de Memórias',
        synopsis:
          'Thryc vê seis vidas do outro lado do Véu. Pela primeira vez, elu escolhe intervir.',
        motive: 'A esperança é uma memória que insiste em voltar.',
        eliteName: 'Guardião da Ponte',
        waves: ['Ponte', 'Memórias dos Seis', 'O Guardião'],
        tint: '#14102a',
        tintAmount: 0.1,
        accent: '#6ff2ff',
        accent2: '#ffe6a3',
      },
      {
        name: 'Antes do Fim',
        location: 'Nexus — Limiar do Ferrato',
        synopsis:
          'Os ecos dos seis Despertos se encontram no limiar. Thryc reúne coragem para o que vem depois do fim.',
        motive: 'Se o fim é uma escolha, eu escolho o amanhã.',
        eliteName: 'Arauto do Fim',
        waves: ['Limiar', 'Ecos do Mundo', 'O Arauto'],
        tint: '#100820',
        tintAmount: 0.08,
        accent: '#ff8ae2',
        accent2: '#6ff2ff',
      },
    ],
    finale: {
      name: 'Ferrato',
      location: 'Entre Planos — Nexus Primordial',
      synopsis:
        'Todos os caminhos levam ao Nexus, onde o Ferrato se manifesta como uma consciência faminta. A batalha definirá o destino da existência.',
      motive: 'Enquanto houver memória, há amanhã.',
      width: 3320,
      waves: [
        { at: 0, label: 'Ecos Corrompidos', spawns: [{ kind: 'echo', count: 3 }] },
        {
          at: 1100,
          label: 'Planos Invadidos',
          spawns: [{ kind: 'construct', count: 2 }, { kind: 'echo', count: 3 }],
        },
        {
          at: 2150,
          label: 'Manifestação',
          spawns: [
            { kind: 'echo', count: 3 },
            { kind: 'seraph', count: 2 },
            { kind: 'construct', count: 1, elite: true },
          ],
        },
      ],
      boss: 'ferrato',
      enemyNames: {
        echo: 'Eco Corrompido dos Despertos',
        construct: 'Manifestação dos Planos',
        shade: 'Eco da Terra',
        drone: 'Eco do Espaço',
        brute: 'Eco do Inferno',
        seraph: 'Eco do Céu',
      },
      eliteName: 'Manifestação dos Planos',
    },
  },
];

function paletteFor(seed: ArcSeed, chapter: ChapterSeed): StagePalette {
  const mix = (color: string): string => mixColor(color, chapter.tint, chapter.tintAmount);
  const accent = chapter.accent ?? mix(seed.palette.accent);
  return {
    skyTop: mix(seed.palette.skyTop),
    skyBottom: mix(seed.palette.skyBottom),
    far: mix(seed.palette.far),
    mid: mix(seed.palette.mid),
    near: mix(seed.palette.near),
    ground: mix(seed.palette.ground),
    groundDark: mix(seed.palette.groundDark),
    accent,
    accent2: chapter.accent2 ?? mix(seed.palette.accent2),
    fog: hexToRgba(accent, 0.1 + chapter.tintAmount * 0.3),
    sun: mix(seed.palette.sun),
  };
}

function chapterWidth(arc: number, chapter: number): number {
  return 2400 + (arc - 1) * 80 + chapter * 70;
}

function stageDifficulty(arc: number, chapter: number): number {
  return Math.round((0.95 + (arc - 1) * 0.16 + (chapter - 1) * 0.085) * 100) / 100;
}

function buildWaves(seed: ArcSeed, chapter: ChapterSeed, number: number, width: number): WaveDef[] {
  const at = (offset: number): EnemyKind => seed.pool[((offset % seed.pool.length) + seed.pool.length) % seed.pool.length];
  const base = 2 + Math.floor((number + 1) / 2);
  const wave1: WaveSpawn[] = [{ kind: at(number - 1), count: base }];
  const wave2: WaveSpawn[] = [{ kind: at(number), count: base + (number >= 3 ? 1 : 0) }];
  if (number >= 4) wave2.push({ kind: at(number + 1), count: 1 });
  const wave3: WaveSpawn[] = [
    { kind: at(number + 1), count: base + 1 },
    { kind: at(0), count: 1, elite: true },
  ];
  if (number >= 5) wave3.push({ kind: at(number + 2), count: 2 });
  return [
    { at: 0, label: chapter.waves[0], spawns: wave1 },
    { at: Math.round(width * 0.34), label: chapter.waves[1], spawns: wave2 },
    { at: Math.round(width * 0.68), label: chapter.waves[2], spawns: wave3 },
  ];
}

function buildArc(seed: ArcSeed): StageDef[] {
  const stages: StageDef[] = [];
  seed.chapters.forEach((chapter, index) => {
    const number = index + 1;
    const width = chapterWidth(seed.arc, number);
    stages.push({
      id: (seed.arc - 1) * CHAPTERS_PER_ARC + number,
      arc: seed.arc,
      chapter: number,
      name: chapter.name,
      subtitle: `Arco ${STAGE_ROMAN[seed.arc - 1]} · Capítulo ${number}`,
      location: chapter.location,
      synopsis: chapter.synopsis,
      motive: chapter.motive,
      width,
      floor: FLOOR_Y,
      gravity: seed.gravity,
      music: (seed.arc - 1) * CHAPTERS_PER_ARC + number - 1,
      ambient: seed.ambient,
      palette: paletteFor(seed, chapter),
      waves: buildWaves(seed, chapter, number, width),
      boss: null,
      character: seed.hero,
      enemyNames: seed.enemyNames,
      eliteName: chapter.eliteName,
      difficulty: stageDifficulty(seed.arc, number),
    });
  });

  const finale = seed.finale;
  stages.push({
    id: seed.arc * CHAPTERS_PER_ARC,
    arc: seed.arc,
    chapter: CHAPTERS_PER_ARC,
    name: finale.name,
    subtitle: `Arco ${STAGE_ROMAN[seed.arc - 1]} · Capítulo ${CHAPTERS_PER_ARC}`,
    location: finale.location,
    synopsis: finale.synopsis,
    motive: finale.motive,
    width: finale.width,
    floor: FLOOR_Y,
    gravity: seed.gravity,
    music: seed.arc * CHAPTERS_PER_ARC - 1,
    ambient: seed.ambient,
    palette: seed.palette,
    waves: finale.waves,
    boss: finale.boss,
    character: seed.hero,
    enemyNames: finale.enemyNames,
    eliteName: finale.eliteName,
    difficulty: stageDifficulty(seed.arc, CHAPTERS_PER_ARC),
  });
  return stages;
}

export const STAGES: StageDef[] = ARC_SEEDS.flatMap(buildArc);

export function getStage(id: number): StageDef {
  return STAGES[Math.max(0, Math.min(STAGES.length - 1, id - 1))];
}

export function getArcStages(arc: number): StageDef[] {
  const safe = Math.max(1, Math.min(ARC_COUNT, arc));
  return STAGES.filter((stage) => stage.arc === safe);
}

export function arcFirstStage(arc: number): number {
  return (Math.max(1, Math.min(ARC_COUNT, arc)) - 1) * CHAPTERS_PER_ARC + 1;
}

export function arcFinaleStage(arc: number): number {
  return Math.max(1, Math.min(ARC_COUNT, arc)) * CHAPTERS_PER_ARC;
}

export function isArcFinale(stage: StageDef): boolean {
  return stage.chapter === CHAPTERS_PER_ARC;
}

export function stageLabel(stage: StageDef): string {
  return `ARCO ${STAGE_ROMAN[stage.arc - 1]} · CAP. ${stage.chapter}`;
}

export function stageLongLabel(stage: StageDef): string {
  return `Arco ${STAGE_ROMAN[stage.arc - 1]} · Capítulo ${stage.chapter}`;
}
