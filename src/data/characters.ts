/** Definições dos seis Despertos jogáveis. */

export type CharacterId = 'ravi' | 'miriam' | 'kael' | 'ozric' | 'elodie' | 'thryc';

export interface CharacterColors {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  skin: string;
  hair: string;
  eye: string;
  aura: string;
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  epithet: string;
  stage: number;
  gender: string;
  sexuality: string;
  origin: string;
  combat: string;
  style: string;
  lore: string[];
  colors: CharacterColors;
  maxHp: number;
  speed: number;
  jump: number;
  weight: number;
  scale: number;
  weapon: 'fists' | 'gauntlets' | 'gravity' | 'scythe' | 'sword' | 'blades';
  ability: { name: string; desc: string; cooldown: number; hint: string };
  passive: { name: string; desc: string };
  meter: string;
  comboName: string;
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  ravi: {
    id: 'ravi',
    name: 'Ravi',
    epithet: 'O Pulso',
    stage: 1,
    gender: 'Masculino (cisgênero)',
    sexuality: 'Heterossexual',
    origin: 'Entregador de pizza de New Haven',
    combat: 'Acrobático Elétrico',
    style: 'Mobilidade e combos rápidos',
    lore: [
      'Impulsivo, otimista e teimoso. Protege os outros antes mesmo de entender o que está acontecendo.',
      'O Ferrato acendeu a bioeletricidade em seu sangue. Quanto mais rápido ele luta, mais forte fica.',
    ],
    colors: {
      primary: '#ff8a3d',
      secondary: '#28344d',
      accent: '#56e3ff',
      glow: '#8df4ff',
      skin: '#b4764c',
      hair: '#201713',
      eye: '#ffd166',
      aura: '#38d8ff',
    },
    maxHp: 105,
    speed: 268,
    jump: 630,
    weight: 1,
    scale: 1,
    weapon: 'fists',
    ability: {
      name: 'Pulso Voltaico',
      desc: 'Descarga em área ao redor. O dano cresce com o combo acumulado e encadeia raios nos inimigos próximos.',
      cooldown: 7,
      hint: 'E — descarga elétrica em área',
    },
    passive: {
      name: 'Ritmo Voltaico',
      desc: 'Cada golpe do combo aumenta o dano elétrico das habilidades.',
    },
    meter: 'CARGA VOLTAICA',
    comboName: 'Combo Relâmpago',
  },
  miriam: {
    id: 'miriam',
    name: 'Miriam',
    epithet: 'A Quebra-Ossos',
    stage: 2,
    gender: 'Feminino (cisgênero)',
    sexuality: 'Heterossexual',
    origin: 'Ex-bombeira voluntária de New Haven',
    combat: 'Tank Ofensivo',
    style: 'Corpo a corpo pesado e geotérmico',
    lore: [
      'Pragmática, estoica e durona. Guarda a gentileza para civis e para os mais jovens do grupo.',
      'As queimaduras do braço esquerdo brilham em magma. O calor que ela acumula vira arma.',
    ],
    colors: {
      primary: '#c9412f',
      secondary: '#3a2a22',
      accent: '#ff9b3c',
      glow: '#ff6a2b',
      skin: '#8a5a3b',
      hair: '#1c1210',
      eye: '#ffc46b',
      aura: '#ff7a2f',
    },
    maxHp: 155,
    speed: 182,
    jump: 545,
    weight: 1.5,
    scale: 1.1,
    weapon: 'gauntlets',
    ability: {
      name: 'Erupção Magmática',
      desc: 'Três pilares de magma irrompem à frente, queimando o solo. O calor acumulado aumenta o dano.',
      cooldown: 10,
      hint: 'E — pilares de magma',
    },
    passive: {
      name: 'Núcleo Tectônico',
      desc: 'O dano recebido aquece o corpo: até +45% de dano. O calor esfria com o tempo.',
    },
    meter: 'CALOR TECTÔNICO',
    comboName: 'Demolidor',
  },
  kael: {
    id: 'kael',
    name: 'Kael',
    epithet: 'Zero-G',
    stage: 3,
    gender: 'Não-binário',
    sexuality: 'Heterossexual',
    origin: 'Técnico aeroespacial da antiga iniciativa terrestre',
    combat: 'Zoner Gravitacional',
    style: 'Controle de campo e mobilidade gravitacional',
    lore: [
      'Reservado, analítico e sarcástico. Demonstra afeto consertando as coisas dos outros.',
      'Manipula a gravidade ao redor do corpo: flutua, dobra o espaço curto e esmaga com singularidades.',
    ],
    colors: {
      primary: '#7f6bff',
      secondary: '#26304b',
      accent: '#6ff2ff',
      glow: '#9d8bff',
      skin: '#cbd0dc',
      hair: '#b79cff',
      eye: '#56e3ff',
      aura: '#7f6bff',
    },
    maxHp: 98,
    speed: 232,
    jump: 570,
    weight: 0.85,
    scale: 1.03,
    weapon: 'gravity',
    ability: {
      name: 'Singularidade',
      desc: 'Abre um poço gravitacional que puxa e tritura inimigos, terminando em uma explosão de massa.',
      cooldown: 11,
      hint: 'E — poço gravitacional',
    },
    passive: {
      name: 'Zero-G',
      desc: 'Segure o pulo no ar para planar. O dash é um salto instantâneo que ignora dano.',
    },
    meter: 'MASSA GRAVITACIONAL',
    comboName: 'Órbita Crítica',
  },
  ozric: {
    id: 'ozric',
    name: 'Ozric',
    epithet: 'O Exilado',
    stage: 4,
    gender: 'Masculino (cisgênero)',
    sexuality: 'Heterossexual',
    origin: 'Ex-Carrasco Infernal do Abismo Rubro',
    combat: 'Híbrido Vampírico',
    style: 'Foice, alcance médio e drenagem de vida',
    lore: [
      'Melancólico, honorável e rígido. Carrega culpa pelas almas que não conseguiu salvar.',
      'Suas chamas negras não queimam carne: queimam corrupção. A foice bebe a vida de quem a merece.',
    ],
    colors: {
      primary: '#8a2030',
      secondary: '#241a22',
      accent: '#ff3357',
      glow: '#ff6a3d',
      skin: '#91858f',
      hair: '#151016',
      eye: '#ff2f4a',
      aura: '#ff3357',
    },
    maxHp: 122,
    speed: 206,
    jump: 566,
    weight: 1.15,
    scale: 1.06,
    weapon: 'scythe',
    ability: {
      name: 'Colheita de Chamas Negras',
      desc: 'Um arco de fogo negro devora a corrupção à frente e devolve parte do dano como vida.',
      cooldown: 9,
      hint: 'E — colheita que drena vida',
    },
    passive: {
      name: 'Sentença',
      desc: 'Todos os golpes drenam 8% do dano causado. Chamas negras queimam inimigos por 4s.',
    },
    meter: 'VIDA DRENADA',
    comboName: 'Julgamento',
  },
  elodie: {
    id: 'elodie',
    name: 'Élodie',
    epithet: 'Lâmina Celeste',
    stage: 5,
    gender: 'Feminino (cisgênero)',
    sexuality: 'Heterossexual',
    origin: 'Aprendiz da Ordem da Aurora',
    combat: 'Duelista Sagrada',
    style: 'Precisão, contra-ataques e selamento',
    lore: [
      'Idealista, compassiva e teimosa. É a voz da esperança em um exército de cínicos.',
      'Sua lâmina carrega luz estelar. Em vez de purificar, ela sela a corrupção para que não volte.',
    ],
    colors: {
      primary: '#f5e2b0',
      secondary: '#c9a44f',
      accent: '#fff4cd',
      glow: '#ffe6a3',
      skin: '#f0cfa6',
      hair: '#f8e9c4',
      eye: '#ffdc85',
      aura: '#ffe08a',
    },
    maxHp: 108,
    speed: 240,
    jump: 600,
    weight: 0.95,
    scale: 1,
    weapon: 'sword',
    ability: {
      name: 'Selo da Aurora',
      desc: 'Sela todos os inimigos próximos: ficam atordoados, recebem +35% de dano e os projéteis são desfeitos.',
      cooldown: 12,
      hint: 'E — sela inimigos em área',
    },
    passive: {
      name: 'Contra-ataque',
      desc: 'O dash concede lampejo: o próximo golpe é crítico. K assume postura de contra-ataque.',
    },
    meter: 'GRAÇA DA AURORA',
    comboName: 'Sentença Celeste',
  },
  thryc: {
    id: 'thryc',
    name: 'Thryc',
    epithet: 'Eco',
    stage: 6,
    gender: 'Agênero (pronomes neutros)',
    sexuality: 'Heterossexual',
    origin: 'Eco do Nexus Primordial',
    combat: 'Manipulador do Nexus',
    style: 'Distorção espaço-temporal e ecos',
    lore: [
      'Calmo, enigmático e poeticamente direto. Curioso com coisas simples: comida, piadas, música.',
      'Formado pelas memórias de realidades consumidas. Pode repetir ações recém-feitas — como um eco.',
    ],
    colors: {
      primary: '#b48bff',
      secondary: '#1d2b4a',
      accent: '#6ff2ff',
      glow: '#ff8ae2',
      skin: '#d6ecff',
      hair: '#7b5cff',
      eye: '#ffffff',
      aura: '#b48bff',
    },
    maxHp: 114,
    speed: 250,
    jump: 610,
    weight: 0.9,
    scale: 1.08,
    weapon: 'blades',
    ability: {
      name: 'Eco',
      desc: 'Repete o último ataque três vezes em rajadas de espaço-tempo. Se nenhum ataque foi feito, ecoa uma fenda.',
      cooldown: 8,
      hint: 'E — repete o último ataque',
    },
    passive: {
      name: 'Memória do Véu',
      desc: 'Cada eco acerta com 70% do dano e atordoa. O dash atravessa inimigos deixando uma fenda.',
    },
    meter: 'MEMÓRIA ECOADA',
    comboName: 'Ressonância',
  },
};

export const CHARACTER_ORDER: CharacterId[] = ['ravi', 'miriam', 'kael', 'ozric', 'elodie', 'thryc'];

export function getCharacter(id: string): CharacterDef {
  return CHARACTERS[id as CharacterId] ?? CHARACTERS.ravi;
}
