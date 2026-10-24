/** Narrativa: aberturas, encerramentos e créditos. */

import type { CharacterId } from './characters.js';

export type SpeakerId = CharacterId | 'narrator' | 'ferrato' | 'boss';

export interface StoryBeat {
  speaker: string;
  who: SpeakerId;
  text: string;
}

export interface StoryChapter {
  intro: StoryBeat[];
  outro: StoryBeat[];
}

export const STORY: Record<number, StoryChapter> = {
  1: {
    intro: [
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'New Haven, 19h42. O céu se abriu como um vitral mal pendurado — e alguma coisa atravessou o rasgo.',
      },
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'Do asfalto subiram criaturas de carne e ferrugem. A cidade gritou. O mundo, mais tarde, chamaria aquilo de Ferrato.',
      },
      {
        speaker: 'RAVI',
        who: 'ravi',
        text: 'Ah, não. Não no meu turno. Eu ainda tenho três pizzas pra entregar!',
      },
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'Uma faísca nasceu no peito de Ravi. Depois outra. Depois relâmpagos inteiros correram pelos seus braços.',
      },
      {
        speaker: 'RAVI',
        who: 'ravi',
        text: 'Tá bom. Eu não sei o que é isso... mas eu sei correr mais rápido que essas coisas. Vamos ver quem fica de pé.',
      },
    ],
    outro: [
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'Quando o Colosso desabou, a rua inteira virou entulho fumegante. Ravi ficou de pé. Não por heroísmo — por teimosia.',
      },
      {
        speaker: 'MIRIAM',
        who: 'miriam',
        text: 'Você segurou a rua sozinho, garoto?',
      },
      {
        speaker: 'RAVI',
        who: 'ravi',
        text: 'Quase. A pizza esfriou e eu perdi o emprego. Você é... bombeira?',
      },
      {
        speaker: 'MIRIAM',
        who: 'miriam',
        text: 'Era. Agora eu apago um incêndio maior. Brasília caiu. Se você aguenta andar, aguenta lutar.',
      },
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'Eles partiram para as cinzas de Brasília. Miriam foi junto. Não porque acreditava em destino — porque alguém precisava carregar os feridos.',
      },
    ],
  },
  2: {
    intro: [
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'Brasília não era mais uma capital. Era uma escultura de fuligem com o formato de uma promessa quebrada.',
      },
      {
        speaker: 'MIRIAM',
        who: 'miriam',
        text: 'Eu trabalhei aqui. Tirei gente de prédios como esse. Agora só tem Khar\'uun lá dentro.',
      },
      {
        speaker: 'RAVI',
        who: 'ravi',
        text: 'Khar\'uun? Isso é nome de banda ou de coisa que quer me matar?',
      },
      {
        speaker: 'MIRIAM',
        who: 'miriam',
        text: 'As duas. Fica atrás de mim. Eu bato primeiro, você pergunta depois.',
      },
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'O braço esquerdo de Miriam acendeu em magma. Pela primeira vez em anos, o calor não doeu.',
      },
    ],
    outro: [
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'O General Vek\'thar caiu. Mas antes de morrer, ele riu e apontou para o céu: um portal orbital estava se abrindo.',
      },
      {
        speaker: 'MIRIAM',
        who: 'miriam',
        text: 'Aquele portal não é natural. Está sendo alimentado por alguma coisa lá em cima.',
      },
      {
        speaker: 'KAEL',
        who: 'kael',
        text: 'Correção: por uma estação orbital inteira. SOLACE. E eu sou a única pessoa viva que ainda sabe religar os motores dela.',
      },
      {
        speaker: 'RAVI',
        who: 'ravi',
        text: 'E você é...?',
      },
      {
        speaker: 'KAEL',
        who: 'kael',
        text: 'Kael. Técnico aeroespacial. Se vocês sobreviverem à subida, talvez eu conserte vocês também.',
      },
    ],
  },
  3: {
    intro: [
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'A SOLACE girava em silêncio, um esqueleto de metal do tamanho de uma cidade, coberto de estrelas mortas.',
      },
      {
        speaker: 'KAEL',
        who: 'kael',
        text: 'Gravidade artificial instável. Oxigênio em 63%. E vocês trouxeram sapatos de rua. Ótimo.',
      },
      {
        speaker: 'MIRIAM',
        who: 'miriam',
        text: 'Você sempre fala assim com quem salva sua estação?',
      },
      {
        speaker: 'KAEL',
        who: 'kael',
        text: 'Só com quem eu pretendo manter viva. Não toquem nas placas gravitacionais. Elas mordem.',
      },
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'Foi ali, entre escombros e corpos assimilados, que eles entenderam: os Khar\'uun não eram os invasores. Eram as primeiras vítimas.',
      },
    ],
    outro: [
      {
        speaker: 'KAEL',
        who: 'kael',
        text: 'O Núcleo está morto. Mas a assinatura do portal continua ativa... e está vindo de baixo. Muito abaixo.',
      },
      {
        speaker: 'RAVI',
        who: 'ravi',
        text: 'Baixo como... subsolo?',
      },
      {
        speaker: 'KAEL',
        who: 'kael',
        text: 'Baixo como Inferno. O portal nos puxou. Eu avisei que a física era instável.',
      },
      {
        speaker: 'MIRIAM',
        who: 'miriam',
        text: 'Segurem-se. Se cairmos, caimos juntos.',
      },
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'O calor do Abismo Rubro engoliu a estação. E, em algum lugar entre correntes e fogo, alguém os esperava.',
      },
    ],
  },
  4: {
    intro: [
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'O Abismo Rubro respirava. Cada parede era uma garganta. Cada chama, um nome esquecido.',
      },
      {
        speaker: 'OZRIC',
        who: 'ozric',
        text: 'Vocês não deviam estar aqui. Nenhuma alma viva devia.',
      },
      {
        speaker: 'RAVI',
        who: 'ravi',
        text: 'Olha, a gente também não queria. Você é daqui?',
      },
      {
        speaker: 'OZRIC',
        who: 'ozric',
        text: 'Eu era o carrasco. Julgava almas em nome de um trono podre. Quando me recusei a corromper inocentes, me acorrentaram aqui.',
      },
      {
        speaker: 'MIRIAM',
        who: 'miriam',
        text: 'Então você conhece o Barão Acheron.',
      },
      {
        speaker: 'OZRIC',
        who: 'ozric',
        text: 'Conheço o que ele fez com as almas que eu deveria proteger. Me soltem. Eu tenho uma sentença a cumprir.',
      },
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'As correntes se partiram. Chamas negras subiram do chão — e não queimavam carne. Queimavam corrupção.',
      },
    ],
    outro: [
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'Acheron virou cinza. Ozric não comemorou. Apenas recolheu a foice e fechou os olhos para as almas que restaram.',
      },
      {
        speaker: 'OZRIC',
        who: 'ozric',
        text: 'O portal acima leva ao Céu. Eu não sou bem-vindo lá. Mas a corrupção não se importa com boas-vindas.',
      },
      {
        speaker: 'KAEL',
        who: 'kael',
        text: 'Sensores indicam uma concentração massiva de energia sacra... e alguém gritando por socorro em todas as frequências.',
      },
      {
        speaker: 'ÉLODIE',
        who: 'elodie',
        text: 'Não é socorro. É um aviso. A Eclésia caiu. E eu sou a última que ainda se lembra do que ela era.',
      },
      {
        speaker: 'RAVI',
        who: 'ravi',
        text: 'Ótimo. Mais uma pessoa armada e traumatizada. A gente vai virar família se continuar assim.',
      },
    ],
  },
  5: {
    intro: [
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'A Eclésia flutuava em ruínas, dourada por uma luz doentia. Os vitrais mostravam santos chorando.',
      },
      {
        speaker: 'ÉLODIE',
        who: 'elodie',
        text: 'Eu era aprendiz da Ordem da Aurora. Meu juramento era catalogar e selar. Nunca lutar.',
      },
      {
        speaker: 'MIRIAM',
        who: 'miriam',
        text: 'E o que mudou?',
      },
      {
        speaker: 'ÉLODIE',
        who: 'elodie',
        text: 'Eu vi meus irmãos caindo, um por um. O Arcanjo Malakhim ainda acredita que está purificando este lugar. Ele não está.',
      },
      {
        speaker: 'OZRIC',
        who: 'ozric',
        text: 'A fé dele virou fome. Eu já vi isso antes. Não vai ser bonito.',
      },
      {
        speaker: 'ÉLODIE',
        who: 'elodie',
        text: 'Então que não seja bonito. Que seja justo. Sigam-me — eu conheço o caminho até o coro.',
      },
    ],
    outro: [
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'Malakhim caiu de joelhos, as asas se desfazendo em penas de luz. Ele pediu desculpas a alguém que não existia mais.',
      },
      {
        speaker: 'ÉLODIE',
        who: 'elodie',
        text: 'Atrás do trono há uma porta. Não leva a nenhum plano. Leva ao que existe entre eles.',
      },
      {
        speaker: 'FERRATO',
        who: 'ferrato',
        text: 'Vocês chegaram mais longe do que os outros. Eu me lembro de todos os outros.',
      },
      {
        speaker: 'RAVI',
        who: 'ravi',
        text: 'Que voz é essa? Está vindo de dentro da minha cabeça!',
      },
      {
        speaker: 'FERRATO',
        who: 'ferrato',
        text: 'Eu sou o Ferrato. Não sou um deus. Sou a fome que restou quando os deuses se calaram. Venham. Eu quero sentir o gosto da esperança.',
      },
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'Então o ar se dobrou. Uma figura alongada, feita de galáxias e memórias, abriu os olhos sem íris.',
      },
      {
        speaker: 'THRYC',
        who: 'thryc',
        text: 'Eu sou o Eco do Nexus. Vocês são a primeira esperança que eu lembro de sentir. Permitam-me lutar ao lado de vocês.',
      },
    ],
  },
  6: {
    intro: [
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'O Nexus Primordial não tem chão, céu ou tempo. Tem vontade. E a vontade dele está com fome.',
      },
      {
        speaker: 'FERRATO',
        who: 'ferrato',
        text: 'Cada plano que eu devorei vive em mim. A Terra, o Espaço, o Inferno, o Céu. Vocês são apenas o próximo sabor.',
      },
      {
        speaker: 'THRYC',
        who: 'thryc',
        text: 'Eu sou feito de tudo o que você tentou apagar. Cada memória que você engoliu ecoa em mim.',
      },
      {
        speaker: 'RAVI',
        who: 'ravi',
        text: 'Então a gente não está sozinho nem no fim do mundo. Boa. Eu odeio lutar sozinho.',
      },
      {
        speaker: 'MIRIAM',
        who: 'miriam',
        text: 'Ravi. Foco. Élodie, sela o que puder. Ozric, drene. Kael, não deixa ele se mover. Thryc...',
      },
      {
        speaker: 'THRYC',
        who: 'thryc',
        text: 'Eu ecoarei cada golpe de vocês. Até o último.',
      },
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'Seis Despertos contra uma consciência cósmica. Do lado de fora do Véu, a realidade prendeu a respiração.',
      },
    ],
    outro: [
      {
        speaker: 'FERRATO',
        who: 'ferrato',
        text: 'Por que... vocês continuam se levantando? Eu sou o fim. Eu sempre fui o fim.',
      },
      {
        speaker: 'ÉLODIE',
        who: 'elodie',
        text: 'Porque o fim não é uma pessoa. É uma escolha. E nós escolhemos outra coisa.',
      },
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'O Véu se fechou. Não com violência — com cuidado, como alguém costurando uma ferida.',
      },
      {
        speaker: 'RAVI',
        who: 'ravi',
        text: 'Então... acabou? Alguém quer pizza? Eu conheço um lugar que ainda deve estar de pé.',
      },
      {
        speaker: 'THRYC',
        who: 'thryc',
        text: 'Eu gostaria de provar pizza. E ouvir uma piada sua. E entender por que vocês chamam isso de vitória.',
      },
      {
        speaker: 'MIRIAM',
        who: 'miriam',
        text: 'Porque amanhã ainda vai existir. É o suficiente.',
      },
      {
        speaker: 'NARRADOR',
        who: 'narrator',
        text: 'Os Despertos não lutam para se tornar deuses. Eles lutam para que amanhã exista.',
      },
    ],
  },
};

export interface CreditLine {
  role: string;
  names: string;
}

export const CREDITS: CreditLine[] = [
  { role: 'Criação & Narrativa', names: 'Ferrato: A Guerra Dos Despertos' },
  { role: 'Direção de Jogo', names: 'Design Document — Arcos I a VI' },
  { role: 'Programação & Engine', names: 'TypeScript + HTML5 Canvas 2D' },
  { role: 'Arte', names: 'Ilustração procedural em código (sem assets externos)' },
  { role: 'Trilha & Efeitos', names: 'Síntese WebAudio em tempo real' },
  { role: 'Os Despertos', names: 'Ravi · Miriam · Kael · Ozric · Élodie · Thryc' },
  { role: 'Vozes do Véu', names: 'Khar\'uun · Legiões Rubras · Eclésia Caída · Ferrato' },
  { role: 'Agradecimento', names: 'A todos que continuam se levantando' },
];

export const TITLE_TAGLINE = 'A GUERRA DOS DESPERTOS';
export const TITLE_QUOTE = 'O comum pode se tornar extraordinário quando há algo pelo qual lutar.';
