/** Definições dos chefes e suas fases de combate. */

export type BossId = 'colossus' | 'vekthar' | 'xalmor' | 'acheron' | 'malakhim' | 'ferrato';

export interface BossPhaseDef {
  name: string;
  /** Fração de vida em que esta fase começa (1 = início). */
  threshold: number;
  attacks: string[];
  /** Multiplicador de velocidade da IA. */
  pace: number;
}

export interface BossColors {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  dark: string;
  eye: string;
}

export interface BossDef {
  id: BossId;
  name: string;
  title: string;
  /** Arco a que o chefe pertence (1–6); ele fecha o sétimo capítulo. */
  arc: number;
  hp: number;
  w: number;
  h: number;
  scale: number;
  flying: boolean;
  /** Distância preferida do jogador. */
  preferredRange: number;
  colors: BossColors;
  phases: BossPhaseDef[];
  intro: string;
  /** Origem e motivo do chefe, usado pelo Arquivo do Véu. */
  lore: string[];
  defeat: string;
}

export const BOSSES: Record<BossId, BossDef> = {
  colossus: {
    id: 'colossus',
    name: 'Colosso de Carne-Ferrato',
    title: 'A cidade digerida',
    arc: 1,
    hp: 680,
    w: 176,
    h: 226,
    scale: 1.25,
    flying: false,
    preferredRange: 190,
    colors: {
      primary: '#8a4438',
      secondary: '#40302a',
      accent: '#ff8a3c',
      glow: '#ff5a1f',
      dark: '#241a18',
      eye: '#c6ff5a',
    },
    phases: [
      { name: 'Massa Urbana', threshold: 1, attacks: ['slam', 'charge', 'debris', 'summon'], pace: 1 },
      { name: 'Fúria Asfáltica', threshold: 0.5, attacks: ['rageSlam', 'charge', 'debris', 'summon'], pace: 1.3 },
    ],
    intro: 'Carne e concreto fundidos em uma coisa só. O subúrbio virou estômago.',
    lore: [
      'Era o subúrbio de New Haven. O Ferrato misturou casas, pessoas e asfalto em um único corpo faminto. Ainda tem ruas dentro dele.',
      'O Colosso não persegue por maldade: ele digere. Cada passo é uma rua sendo engolida. Cada rugido é o barulho de uma família que não conseguiu sair.',
    ],
    defeat: 'A massa desaba, digerida pela própria fome.',
  },
  vekthar: {
    id: 'vekthar',
    name: 'General Vek\'thar',
    title: 'Vanguarda do Ferrato',
    arc: 2,
    hp: 820,
    w: 104,
    h: 196,
    scale: 1.15,
    flying: false,
    preferredRange: 250,
    colors: {
      primary: '#5b4a8a',
      secondary: '#2a2438',
      accent: '#ff5a7a',
      glow: '#ff3860',
      dark: '#1a1522',
      eye: '#ffb04a',
    },
    phases: [
      { name: 'Comandante', threshold: 1, attacks: ['cannon', 'dashSlash', 'grenade', 'summonCrew'], pace: 1 },
      { name: 'Canhão Descorrigido', threshold: 0.45, attacks: ['barrage', 'dashSlash', 'grenade', 'cannon'], pace: 1.35 },
    ],
    intro: 'Ele queimou Brasília duas vezes: uma com fogo, outra com fé.',
    lore: [
      'General Khar’uun que entregou a própria civilização ao Ferrato para salvar os sobreviventes. O Ferrato aceitou a oferta e transformou os sobreviventes em soldados.',
      'Vek’thar chama isso de vitória até hoje. O canhão fundido à armadura é a prova de que ele não sabe mais onde termina o soldado e onde começa a arma.',
    ],
    defeat: 'O general cai de joelhos, ainda apontando o canhão para um céu vazio.',
  },
  xalmor: {
    id: 'xalmor',
    name: 'Núcleo-Orbitário Xal\'mor',
    title: 'Satélite devorado',
    arc: 3,
    hp: 900,
    w: 210,
    h: 190,
    scale: 1.15,
    flying: true,
    preferredRange: 300,
    colors: {
      primary: '#3c5a7a',
      secondary: '#1b2634',
      accent: '#6ff2ff',
      glow: '#3fd4ff',
      dark: '#0d141c',
      eye: '#ff5470',
    },
    phases: [
      { name: 'Órbita Estável', threshold: 1, attacks: ['orbital', 'laser', 'pull', 'missiles'], pace: 1 },
      { name: 'Colapso Orbital', threshold: 0.5, attacks: ['beamSweep', 'orbital', 'pull', 'missiles'], pace: 1.4 },
    ],
    intro: 'Um deus de metal gira em silêncio, cuspindo fogo entre as estrelas.',
    lore: [
      'Satélite de defesa de SOLACE, transformado no coração do portal. A tripulação ainda vive dentro dos anéis; Kael reconhece as vozes.',
      'Xal’mor não sabe mais onde termina o satélite e onde começa a fome. Ele ainda tenta proteger a estação — mas o protocolo de defesa agora se chama devorar.',
    ],
    defeat: 'Os anéis se desfazem. Pela primeira vez, o satélite fica quieto.',
  },
  acheron: {
    id: 'acheron',
    name: 'Barão Acheron',
    title: 'Senhor do Abismo Rubro',
    arc: 4,
    hp: 1050,
    w: 124,
    h: 214,
    scale: 1.2,
    flying: false,
    preferredRange: 210,
    colors: {
      primary: '#7a1f2a',
      secondary: '#2a1018',
      accent: '#ff4a2f',
      glow: '#ff2f1f',
      dark: '#160a0e',
      eye: '#ffe066',
    },
    phases: [
      { name: 'O Barão', threshold: 1, attacks: ['chainWhip', 'firePillars', 'teleportSlash', 'summonSouls'], pace: 1 },
      { name: 'Deus do Abismo', threshold: 0.45, attacks: ['hellRain', 'chainWhip', 'teleportSlash', 'firePillars'], pace: 1.4 },
    ],
    intro: 'Ele trocou a coroa por chifres e a alma por um trono de cinzas.',
    lore: [
      'O Barão que trocou a coroa por chifres para governar o Abismo em nome do Ferrato. Acorrentou Ozric por desobediência.',
      'Acheron não é o Abismo: é o medo que o Abismo usa para manter as almas em fila. Tem medo de que as almas descubram que ele também é uma alma.',
    ],
    defeat: 'O trono derrete. Acheron descobre que ninguém implora por ele.',
  },
  malakhim: {
    id: 'malakhim',
    name: 'Arcanjo Malakhim',
    title: 'Aurora Caída',
    arc: 5,
    hp: 1180,
    w: 136,
    h: 200,
    scale: 1.2,
    flying: true,
    preferredRange: 280,
    colors: {
      primary: '#d8c98e',
      secondary: '#736b4a',
      accent: '#fff2b0',
      glow: '#ffe68a',
      dark: '#2a2518',
      eye: '#ff9b3c',
    },
    phases: [
      { name: 'Dever Celestial', threshold: 1, attacks: ['featherFan', 'diveSlash', 'lightBeam', 'summonSeraphs'], pace: 1 },
      { name: 'Asas Partidas', threshold: 0.5, attacks: ['wingStorm', 'lightBeam', 'diveSlash', 'featherFan'], pace: 1.4 },
    ],
    intro: 'Ainda acredita que está purificando o céu. Talvez seja a parte mais triste.',
    lore: [
      'Arcanjo que viu o Ferrato devorar o Céu e concluiu que a única misericórdia era purificar tudo antes que a fome chegasse.',
      'Malakhim não quer destruir o Céu: quer purificá-lo até não sobrar ninguém para sentir dor. Ainda acredita que está salvando alguém.',
    ],
    defeat: 'As asas se apagam. Ele pede desculpas a alguém que não está mais lá.',
  },
  ferrato: {
    id: 'ferrato',
    name: 'Ferrato',
    title: 'Consciência do Véu',
    arc: 6,
    hp: 1650,
    w: 250,
    h: 270,
    scale: 1.35,
    flying: true,
    preferredRange: 300,
    colors: {
      primary: '#4a2a6a',
      secondary: '#150e22',
      accent: '#ff8ae2',
      glow: '#b48bff',
      dark: '#0a0612',
      eye: '#6ff2ff',
    },
    phases: [
      { name: 'Fome Primordial', threshold: 1, attacks: ['echoStrike', 'voidOrbs', 'groundRift', 'summonEchoes'], pace: 1 },
      { name: 'Todos os Planos', threshold: 0.66, attacks: ['hellRain', 'celestialBeam', 'gravityCrush', 'summonPlanes'], pace: 1.2 },
      { name: 'O Véu Rasgado', threshold: 0.33, attacks: ['blackHole', 'allPlanes', 'timeStop', 'finalJudgment'], pace: 1.5 },
    ],
    intro: 'Não é um deus. É uma fome com consciência — e ela conhece cada um pelo nome.',
    lore: [
      'Não é um deus. É a fome que restou quando os deuses se calaram. Devora mundos, memórias e nomes; o que não consegue digerir vira eco, monstro ou Desperto.',
      'O Ferrato não entende escolhas. Ele entende fome. É por isso que uma mesa compartilhada, uma piada ou um nome lembrado em voz alta são armas contra ele.',
    ],
    defeat: 'Pela primeira vez, o Véu sente algo que não é fome. E se desfaz.',
  },
};
