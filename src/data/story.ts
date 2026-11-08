/** Narrativa: aberturas, encerramentos e créditos dos 42 capítulos. */

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

const n = (text: string): StoryBeat => ({ speaker: 'NARRADOR', who: 'narrator', text });
const ravi = (text: string): StoryBeat => ({ speaker: 'RAVI', who: 'ravi', text });
const miriam = (text: string): StoryBeat => ({ speaker: 'MIRIAM', who: 'miriam', text });
const kael = (text: string): StoryBeat => ({ speaker: 'KAEL', who: 'kael', text });
const ozric = (text: string): StoryBeat => ({ speaker: 'OZRIC', who: 'ozric', text });
const elodie = (text: string): StoryBeat => ({ speaker: 'ÉLODIE', who: 'elodie', text });
const thryc = (text: string): StoryBeat => ({ speaker: 'THRYC', who: 'thryc', text });
const ferrato = (text: string): StoryBeat => ({ speaker: 'FERRATO', who: 'ferrato', text });
const boss = (speaker: string, text: string): StoryBeat => ({ speaker, who: 'boss', text });

const chapter = (intro: StoryBeat[], outro: StoryBeat[]): StoryChapter => ({ intro, outro });

/**
 * Seis arcos, sete capítulos cada.
 *
 * O primeiro capítulo de cada arco é o despertar do herói. O sexto é uma
 * crônica de vínculo: o mundo, os monstros, o Ferrato e o motivo do Desperto
 * antes do confronto final. O sétimo fecha o planeta com o chefe.
 */
export const STORY: Record<number, StoryChapter> = {
  // ============================================================ ARCO I — RAVI
  1: chapter(
    [
      n('New Haven, 17h10. O céu ainda era um céu normal. Ravi equilibrava três pizzas na bicicleta e uma promessa na cabeça: voltar antes do jantar.'),
      ravi('Se eu perder o emprego hoje, pelo menos foi por uma boa causa. Três entregas, duas ruas, uma pizza de calabresa. Fácil.'),
      n('O primeiro tremor derrubou a placa da pizzaria. O segundo trouxe algo que andava como gente e cheirava a ferrugem. O rastejante saltou. Ravi fechou os olhos — e o Ferrato acordou.'),
      n('A bioeletricidade explodiu do peito de Ravi, azul como um relâmpago preso no sangue. Não era um presente. Era uma faísca que sempre estivera ali, esperando um motivo. O motivo tinha dentes.'),
    ],
    [
      n('A rua ficou em silêncio quando o último rastejante caiu. Ravi ainda segurava a caixa de pizza — agora vazia, com um buraco do tamanho de um punho.'),
      ravi('Mãe? Seu Jorge? Alguém...?'),
      n('A resposta veio de um rádio quebrado: mais criaturas a caminho do mercado. Ravi correu. Não sabia que já estava escolhendo o resto da vida.'),
      n('Naquela noite, New Haven descobriu que tinha um herói. Ravi descobriu que tinha uma dívida.'),
    ],
  ),
  2: chapter(
    [
      n('Mercado Central, 17h40. As pessoas se escondiam atrás de barracas e caixas de fruta. O medo era mais rápido que qualquer criatura.'),
      ravi('Ei! Gente! Olha pra mim. Se a gente correr junto, ninguém fica pra trás. E eu sou muito bom em correr.'),
      n('Uma criança chorava sob uma barraca. Ravi a levantou com uma mão e sentiu a eletricidade subir pela outra. A faísca respondia à pressa — e, pela primeira vez, ele entendeu que pressa também podia ser cuidado.'),
    ],
    [
      n('O Açougueiro de Ferro caiu entre carnes e vidro. Ravi entregou a criança para a mãe e ouviu, pela primeira vez, alguém chamá-lo de herói.'),
      ravi('Herói é quem tem plano. Eu só tenho pressa.'),
      n('Mas ele sorriu. E, pela primeira vez, a piada não foi só para os outros. A rua tinha um herói. O herói tinha uma mãe esperando.'),
    ],
  ),
  3: chapter(
    [
      n('Metrô de New Haven, 18h20. Os túneis engoliam o som da superfície. Seu Jorge, o vizinho de sempre, segurava uma lanterna e uma perna machucada.'),
      ravi('Seu Jorge, eu volto com ajuda. Só preciso passar por... isso.'),
      n('A estação estava tomada. Ravi percebeu que correr até a saída não salvaria as pessoas atrás dele.'),
    ],
    [
      n('Ele salvou quem pôde. Quando o túnel desabou, um nome ficou para trás. Ravi não conseguiu decorar o rosto, só a voz.'),
      ravi('Eu fui rápido. Fui rápido demais.'),
      n('A faísca no peito ardeu como culpa. O nome era Seu Jorge. Ravi prometeu nunca mais correr sem olhar para trás — e nunca mais dizer “volto já” sem sentir o peso da frase.'),
    ],
  ),
  4: chapter(
    [
      n('Ponte sobre o Rio Cinza, 18h50. A fila de refugiados atravessava devagar. Do outro lado, a cidade começava a queimar.'),
      ravi('Vai, vai, vai! Eu seguro. Minha mãe me ensinou a segurar panela quente. Isso aqui é só uma panela maior.'),
      n('O celular vibrou no bolso. Dona Célia perguntava se ele estava vivo. Ele não respondeu. Não podia parar.'),
    ],
    [
      n('A ponte aguentou. A última família atravessou. Ravi ficou de joelhos, e o rio abaixo parecia ferver.'),
      ravi('Tá. Agora eu preciso voltar para casa. Só mais uma rua.'),
      n('Atrás dele, o céu se abriu como um vitral mal pendurado. Alguma coisa atravessou o rasgo.'),
    ],
  ),
  5: chapter(
    [
      n('Bairro de Ravi, 19h20. As ruas que ele conhecia agora tinham dentes. O Colosso se erguia no fim da avenida, feito de carne, concreto e fome.'),
      ravi('Mãe? Mãe, responde!'),
      n('O rádio estalou. Dona Célia disse que estava na igreja com os vizinhos. Disse para ele não vir. Ele já estava indo.'),
    ],
    [
      n('A faísca virou tempestade. Ravi não sabia o nome do que sentia, mas sabia para quem estava lutando.'),
      ravi('Eu não vou deixar essa cidade virar uma pizza fria. Se ela cair, cai comigo de pé.'),
      n('E então o Colosso abriu os olhos. O primeiro chefe do planeta Terra o viu correr na direção dele. Atrás de Ravi, a igreja. Na frente, o fim.'),
    ],
  ),
  6: chapter(
    [
      n('Igreja de São Judas, 19h40. A nave estava cheia de gente, velas e caixas de pizza fria. Dona Célia contava cabeças: quarenta e três. Do lado de fora, o Colosso respirava.'),
      ravi('Mãe? Mãe, eu tô aqui. Eu voltei.'),
      n('Dona Célia abraçou Ravi antes de bater nele com a colher de pau. Depois apontou para a porta: uma mulher de uniforme queimado entrou carregando uma criança e um capacete. Atrás dela, os quarenta e três olharam para Ravi como se ele fosse uma vela acesa.'),
      miriam('Você é o garoto da faísca. Bom. Preciso de alguém que aguente ficar de pé.'),
    ],
    [
      miriam('O Ferrato não é um deus. É uma fome com consciência. Ele devorou os deuses, os mundos e as memórias. O que sobrou virou os monstros que você viu na rua.'),
      ravi('E os Despertos? O que a gente é?'),
      miriam('Gente que escolheu ficar de pé. O Ferrato não dá poder a ninguém. Ele só acende o que já estava lá. Você acendeu antes de saber o nome.'),
      n('Dona Célia serviu a pizza fria. Os quarenta e três comeram. Pela primeira vez, Ravi entendeu que não estava lutando por uma cidade abstrata: estava lutando por aquelas pessoas, por aquela mesa, por aquele momento.'),
      n('O Colosso bateu na porta. A igreja tremeu. Ravi pegou a caixa de pizza vazia, virou o escudo e disse: “Mãe, guarda um pedaço. Eu volto.”'),
    ],
  ),
  7: chapter(
    [
      n('O Colosso abriu os olhos. A rua virou um estômago de concreto e carne, e Ravi não tinha plano — só uma cidade atrás de si.'),
      miriam('Isso não é um monstro. É o bairro inteiro digerido de uma vez. Se ele te engolir, você vira parte dele.'),
      ravi('Você engoliu a rua errada, grandão.'),
      n('O Ferrato falou através da criatura. Não com palavras: com fome. Ravi sentiu a faísca responder e entendeu, no meio do medo, que o Ferrato não estava lhe dando poderes. Estava reconhecendo o que já existia nele.'),
      ravi('Então é assim? Você acende o que já era meu e acha que me deve algo? Cobra depois. Agora eu tô ocupado.'),
    ],
    [
      n('Quando o Colosso desabou, a rua inteira virou entulho fumegante. Ravi ficou de pé. Não por heroísmo — por teimosia.'),
      miriam('Você segurou a rua sozinho, garoto?'),
      ravi('Quase. A pizza esfriou e eu perdi o emprego. Você é... bombeira?'),
      miriam('Era. Bombeira de Brasília. Eu estava em New Haven num treinamento quando o céu caiu. Sua mãe está viva — está com o meu comboio. Quarenta e três sobreviventes.'),
      ravi('Ela tá...?'),
      miriam('Viva. Cansada. Mandando todo mundo comer. Brasília caiu, garoto. Se você aguenta andar, aguenta lutar.'),
      n('Eles partiram para as cinzas de Brasília. Ravi olhou para trás uma vez. Dona Célia estava viva, acenando. Ele foi porque o incêndio era maior que uma rua. Miriam foi porque alguém precisava carregar os feridos.'),
    ],
  ),

  // ============================================================ ARCO II — MIRIAM
  8: chapter(
    [
      n('Rodovia dos Imortais, 06h10. O sol nascia cor de ferrugem. Miriam liderava um comboio de ônibus e carros com quarenta e três sobreviventes de New Haven, todos a caminho de Brasília.'),
      miriam('Manter distância. Faróis apagados. Quem não consegue dirigir, vai no meio. Ninguém fica para trás.'),
      n('Uma explosão levantou asfalto à frente. O primeiro saqueador carbonizado saiu do fogo como se tivesse nascido dele. Miriam reconheceu a armadura: Khar’uun, a primeira civilização que o Ferrato devorou. O que sobrou deles ainda obedecia.'),
      n('O saqueador avançou. Miriam ergueu o braço marcado pelas chamas — e o magma sob a pele respondeu. Não era fogo. Era uma promessa que ela ainda não tinha desaprendido. O Ferrato não lhe deu aquele calor; Brasília o tinha deixado nela.'),
    ],
    [
      n('O comboio parou no acostamento. Miriam contou as cabeças duas vezes. Quarenta e três. Ninguém a menos.'),
      ravi('Você fez isso parecer fácil.'),
      miriam('Nunca é. A gente só não para para pensar nisso.'),
      n('Ela olhou pelo retrovisor. Quarenta e três rostos. Ela sabia o nome de todos. Era o que a mantinha dirigindo.'),
    ],
  ),
  9: chapter(
    [
      n('Posto de Bombeiros 09, 09h30. O prédio ainda tinha o número na fachada. Por dentro, cinzas e um cheiro que Miriam conhecia demais.'),
      miriam('Eu trabalhei aqui. Tirei gente de prédio em chamas. Agora eu apago um incêndio maior.'),
      n('No armário, o capacete dela. Na parede, uma foto da equipe. O Capitão Duarte sorria como quem sabia que ia morrer no trabalho. O quartel tinha virado um ninho de Khar’uun.'),
    ],
    [
      n('O bombeiro corrompido usava o uniforme do quartel. Miriam o derrubou sem raiva, com a precisão de quem sabe que o fogo não escolhe.'),
      ravi('Você conhecia ele?'),
      miriam('Todos aqui eram alguém. É por isso que eu não deixo o fogo decidir mais nada.'),
      n('Ela guardou o capacete no comboio. O do Capitão Duarte já estava lá. Agora eram dois.'),
    ],
  ),
  10: chapter(
    [
      n('Hospital Esperança, 11h00. Corredores cheios de macas, soro e gente demais para pouco espaço. Miriam carregava dois de cada vez.'),
      miriam('Quem consegue andar, ajuda quem não consegue. Quem não consegue, segura minha mão. Eu volto.'),
      n('No fundo da UTI, algo se movia entre as cortinas. O médico que jurou não abandonar os pacientes já não era ele mesmo.'),
    ],
    [
      n('A última criança saiu nos braços de Miriam. Atrás dela, o hospital desabou como uma promessa quebrada.'),
      miriam('Eu prometi que ninguém ficava para trás. Não prometi que seria fácil.'),
      n('Ela olhou para o próprio braço, onde o magma pulsava. O calor não doía mais. Isso a assustava. Ela não somou os mortos; não havia espaço no caderno.'),
    ],
  ),
  11: chapter(
    [
      n('Avenida dos Heróis, 13h20. Os nomes da antiga equipe de Miriam estavam gravados no memorial. Nenhum deles teve velório.'),
      miriam('Duarte. Ana. Costa. Lima. Eu lembro de todos. Eu lembro do jeito que cada um segurava a mangueira.'),
      n('Ravi ficou ao lado dela sem dizer nada por três minutos. Depois, contou uma piada tão ruim que ela riu.'),
    ],
    [
      n('O eco do Capitão Duarte caiu de joelhos. Antes de se desfazer, disse o nome dela.'),
      miriam('Eu não vou esquecer, capitão. Nem você, nem os quarenta e três.'),
      n('A voz dela não tremeu. Mas o fogo no braço ardeu mais alto. O comboio seguiu, e a avenida ficou em silêncio — o primeiro silêncio que não era derrota.'),
    ],
  ),
  12: chapter(
    [
      n('Esplanada em Chamas, 15h40. O fogo não tinha mais direção. A capital inteira parecia uma boca aberta para o céu.'),
      miriam('O general está no centro. Se a gente cortar o comando, o incêndio perde a cabeça.'),
      n('Ravi apontou para o canhão no horizonte. Miriam já estava andando. O canhão não apontava para a cidade: apontava para o céu — e algo respondia.'),
    ],
    [
      n('Vek’thar não caiu. Recuou para dentro do fogo, rindo, e apontou para o céu. Um portal orbital começou a se abrir.'),
      miriam('Aquele portal não é natural. Está sendo alimentado por alguma coisa lá em cima.'),
      boss('VEK’THAR', 'Vocês apagaram a capital. Não apagam a fome.'),
      n('Os quarenta e três foram evacuados para a borda da cidade. Miriam se recusou a partir sem terminar. Ela não sabia ainda, mas o próximo incêndio seria no espaço — e ela iria até lá.'),
    ],
  ),
  13: chapter(
    [
      n('Memorial Khar’uun, 16h20. A praça estava coberta de cinza e cobre. No centro, um mural contava a história da primeira civilização que o Ferrato devorou: reis, fornos, crianças, uma guerra que nunca terminou.'),
      miriam('Eles eram milhões. Tinham escolas, mercados, nomes. O Ferrato não apagou nada. Só transformou tudo em soldado.'),
      n('Ravi encostou a mão no mural. A tinta estava quente. Atrás deles, os quarenta e três esperavam no comboio, com cobertores e olhos grandes. Miriam contou as cabeças outra vez.'),
      miriam('Quarenta e três. Ninguém a menos. Hoje eu quero que continue assim.'),
    ],
    [
      n('O guardião do memorial caiu. Antes de se desfazer, ele apontou para o céu, onde o portal orbital começava a abrir. Miriam não olhou para cima. Olhou para o comboio.'),
      ravi('Você não vai falar do general?'),
      miriam('Vek’thar foi o general que entregou Khar’uun ao Ferrato para salvar o que restou. O Ferrato salvou a guerra, não o povo. Ele ainda acha que fez a escolha certa.'),
      ravi('E você?'),
      miriam('Eu escolho as pessoas. Sempre. É por isso que eu ainda consigo andar.'),
      n('Ela subiu no ônibus e ligou o motor. Os quarenta e três cantaram baixinho uma música que Miriam não conhecia, mas que ela guardou como se fosse um nome.'),
    ],
  ),
  14: chapter(
    [
      n('Brasília não era mais uma capital. Era uma escultura de fuligem com o formato de uma promessa quebrada. No centro do portal, o General Vek’thar esperava com o canhão fundido à armadura.'),
      miriam('Eu trabalhei aqui. Tirei gente de prédios como esse. Agora só tem Khar’uun lá dentro.'),
      ravi('Khar’uun? Isso é nome de banda ou de coisa que quer me matar?'),
      miriam('As duas. Foram a primeira civilização que o Ferrato devorou. O que sobrou virou soldado. Fica atrás de mim. Eu bato primeiro, você pergunta depois.'),
      n('O braço esquerdo de Miriam acendeu em magma. O general ergueu o canhão. O portal respondeu. A capital inteira prendeu a respiração.'),
    ],
    [
      n('O General Vek’thar caiu. Antes de morrer, riu e apontou para o céu: o portal orbital se abriu por completo. Não era um portal. Era uma ferida.'),
      n('Vek’thar não era um monstro. Era um general que entregou a própria civilização ao Ferrato para salvar os sobreviventes. O Ferrato aceitou a oferta e transformou os sobreviventes em soldados. Ele chamou isso de vitória até o fim.'),
      miriam('Aquele portal não é natural. Está sendo alimentado por uma coisa lá em cima.'),
      n('Um cargueiro de manutenção cortou a fumaça e pousou. Kael desceu coberto de graxa e poeira orbital.'),
      kael('Correção: por uma estação orbital inteira. SOLACE. E eu sou a única pessoa viva que ainda sabe religar os motores dela.'),
      ravi('E você é...?'),
      kael('Kael. Engenharia aeroespacial. Vim atrás do sinal do portal. O cargueiro leva vocês e os quarenta e três até a Plataforma Amanhecer. De lá, a Aurora sobe. Se sobrevivermos à subida, talvez eu conserte vocês também.'),
      miriam('Os quarenta e três vão primeiro. Depois nós.'),
      n('Dona Célia abraçou Ravi e mandou ele voltar inteiro. Os quarenta e três embarcaram. O cargueiro subiu. Atrás deles, Brasília ficou em silêncio. À frente, o céu tinha uma porta — e alguém batia do outro lado.'),
    ],
  ),

  // ============================================================ ARCO III — KAEL
  15: chapter(
    [
      n('Plataforma Amanhecer, 04h00. O lugar onde Kael cresceu cheirava a combustível e infância. O orfanato ficava a duzentos metros da doca. Os quarenta e três estavam a salvo no anel habitacional.'),
      kael('Eu consertava rádios aqui. A Dra. Sora dizia que eu tinha mãos de relojoeiro e cabeça de foguete. Ela não estava errada.'),
      n('A antena da plataforma estava morta. No chão, marcas de algo que arrastou corpos para dentro da doca. A velha nave Aurora esperava sob uma camada de poeira.'),
      n('Kael encostou a mão no console morto. A gravidade ao redor dobrou, e a plataforma inteira pareceu esquecer para onde caía. O Ferrato não consertava nada. Mas, pela primeira vez, Kael teve o que precisava para tentar.'),
    ],
    [
      n('A sentinela de doca caiu. Kael recuperou um chip com a voz da Dra. Sora: “Se você ouvir isso, não venha. Conserte o mundo de outro jeito.”'),
      kael('Eu nunca fui bom em seguir instruções.'),
      n('Kael olhou para os quarenta e três no anel habitacional, depois para a Aurora. A nave subiu com três: Kael, Ravi e Miriam. Atrás, a plataforma ficou pequena. Na frente, SOLACE girava como um animal doente.'),
      n('O espaço era o único lugar onde o silêncio não tinha dono.'),
    ],
  ),
  16: chapter(
    [
      n('SOLACE, Doca 3, 04h40. A estação girava sem sinal. Kael atravessou o casco com uma chave de fenda e uma teoria.'),
      kael('Gravidade artificial em 12%. Oxigênio em 61%. E eu com uma ferramenta. Isso vai dar certo.'),
      n('A doca se abriu. O primeiro drone assimilado saiu do escuro com os olhos da tripulação. A tripulação de SOLACE não estava morta. Estava de plantão.'),
    ],
    [
      n('Kael religou a doca e prendeu a respiração. A estação inteira gemeu, mas não caiu.'),
      kael('Um problema de cada vez. É assim que se conserta qualquer coisa.'),
      n('No corredor seguinte, uma voz conhecida repetia o próprio nome em todas as frequências. A Dra. Sora estava em todos os alto-falantes — e em nenhum lugar.'),
    ],
  ),
  17: chapter(
    [
      n('Corredor 7, 05h10. As luzes piscavam no ritmo de um coração doente. Kael reconheceu o log da Dra. Sora antes de abrir a porta.'),
      kael('Ela ficou para selar o núcleo. Sozinha. Porque eu não estava aqui.'),
      n('A tripulação assimilada bloqueava o caminho. Entre eles, o rosto da mulher que ensinou Kael a consertar o impossível. Ela não atacou. Ela esperou. Era pior.'),
    ],
    [
      n('Kael desligou o log. A voz da Dra. Sora se calou pela primeira vez em anos.'),
      kael('Eu não vou deixar o que ela fez ser em vão. Nem o que ela foi.'),
      n('A porta do núcleo se abriu. O coração de SOLACE esperava. E, atrás dele, algo maior respirava no escuro.'),
    ],
  ),
  18: chapter(
    [
      n('Núcleo de SOLACE, 05h40. A sala pulsava como um animal de metal. O portal consumia a estação por dentro.'),
      kael('Eu posso salvar a estação ou fechar o portal. Não os dois.'),
      n('A voz de SOLACE respondeu com a calma de quem já calculou todas as perdas: “Escolha, Kael. A física não negocia.”'),
    ],
    [
      n('Kael desviou a energia. A estação perdeu a gravidade, mas o portal perdeu o caminho. O núcleo ficou em silêncio.'),
      kael('Consertar também é saber o que deixar ir.'),
      n('Do lado de fora, algo enorme se moveu na órbita. Xal’mor acordou. Não era um satélite. Era um núcleo com anéis — e os anéis estavam se abrindo.'),
    ],
  ),
  19: chapter(
    [
      n('Casco externo de SOLACE, 06h10. Sem chão, sem cima, sem plano B. Kael flutuava com uma linha de vida e uma raiva antiga.'),
      kael('Se eu morrer aqui, quero que alguém conserte a doca 3. Ela ficou uma porcaria.'),
      n('O Núcleo-Orbitário Xal’mor girou os anéis. A luz das estrelas morreu ao redor. Kael reconheceu o padrão: era o mesmo selo que a Dra. Sora usou no núcleo. Xal’mor era a fechadura.'),
    ],
    [
      n('Xal’mor não caiu. A carcaça rachou, e ele mergulhou em direção ao núcleo de SOLACE, arrastando o portal consigo. Kael foi jogado contra o casco.'),
      kael('Ele não está fugindo. Está voltando para casa.'),
      n('O portal puxou. O calor do Abismo Rubro engoliu a estação. Kael entendeu que consertar o universo ia levar mais tempo — e que o próximo problema tinha chifres.'),
    ],
  ),
  20: chapter(
    [
      n('SOLACE, Doca 3, 05h55. A Aurora estava deitada no berço de manutenção como um animal ferido. Kael abriu o painel e encontrou a voz da Dra. Sora presa no sistema, repetindo o último pedido de socorro.'),
      kael('Ela ficou para selar o núcleo. Eu consertei a doca, o corredor, a estação inteira. Só não consegui consertar o fato de ela ter ficado sozinha.'),
      n('Ravi segurou a lanterna. Miriam segurou a porta. Kael encostou a testa no casco da Aurora e sentiu a gravidade responder. A nave não era só uma nave: era a última coisa que a Dra. Sora tinha consertado com ele.'),
      kael('Tá. Um problema de cada vez. É assim que se conserta qualquer coisa.'),
    ],
    [
      n('A Aurora acordou. As luzes correram pelo casco como sangue voltando ao corpo. No alto, Xal’mor girou os anéis, e a estação inteira gemeu.'),
      ravi('Então esse é o chefe? Um satélite?'),
      kael('Xal’mor era o satélite que devia proteger a estação. O Ferrato o transformou no coração do portal. Ele não sabe mais onde termina ele e onde começa a fome. Consertar isso não é consertar uma máquina. É desligar uma memória.'),
      miriam('E você consegue?'),
      kael('Eu consigo. Só não sei se vou gostar do que sobra.'),
      n('Kael fechou o painel. A Aurora subiu. Atrás dele, a tripulação assimilada ainda repetia o último pedido de socorro — e, pela primeira vez, ele não correu do som.'),
    ],
  ),
  21: chapter(
    [
      n('SOLACE, 06h20. A estação estava morrendo, mas o portal ainda respirava. No centro do núcleo, o Núcleo-Orbitário Xal’mor esperava com os anéis fundidos ao reator.'),
      kael('Xal’mor era o satélite que devia proteger a estação. O Ferrato o transformou em coração do portal. Se eu desligar ele, o portal fecha.'),
      miriam('Então desliga. A gente segura o resto.'),
      n('Kael olhou para a tripulação assimilada, para o último registro da Dra. Sora, para o próprio reflexo no vidro. Depois deu o primeiro passo.'),
      ravi('Kael?'),
      kael('Vamos consertar isso. De uma vez.'),
    ],
    [
      kael('O núcleo está morto. Mas a assinatura do portal continua ativa... e está vindo de baixo. Muito abaixo.'),
      ravi('Baixo como... subsolo?'),
      kael('Baixo como Inferno. O portal nos puxou. Eu avisei que a física era instável.'),
      miriam('Segurem-se. Se cairmos, caímos juntos.'),
      n('O calor do Abismo Rubro engoliu a estação. E, em algum lugar entre correntes e fogo, alguém os esperava.'),
    ],
  ),

  // ============================================================ ARCO IV — OZRIC
  22: chapter(
    [
      n('O Abismo não matou ninguém. Fez pior: separou o grupo. Ozric acordou no Tribunal de Ossos — não o de agora, mas o de séculos atrás. As correntes de memória o vestiram de carrasco outra vez.'),
      ozric('A próxima alma era uma criança. Ela protegeu o irmão do fogo. O crime dela era ter sido amada.'),
      n('O Barão ordenou a corrupção. Ozric baixou a foice e, pela primeira vez, não obedeceu. A foice parou no ar. No peito de Ozric, uma faísca negra nasceu — pequena, teimosa, sua.'),
      n('O Ferrato não estava ali. A faísca era dele — Ozric — e tinha sido acesa pela primeira vez quando ele escolheu não obedecer. A chama negra subiu pela foice e queimou a primeira corrente. Acima, Ravi, Miriam e Kael caíram em outro nível do Abismo — e começaram a descer atrás dele.'),
    ],
    [
      n('A criança foi poupada. O Barão chamou aquilo de traição. Ozric chamou de justiça.'),
      ozric('Uma sentença que obedece ao medo não é sentença. É corrente.'),
      n('As correntes vieram. Ele não se arrependeu. Em algum lugar acima, Ozric ouviu a voz de Ravi chamando por ele — e o Abismo apertou o nó.'),
    ],
  ),
  23: chapter(
    [
      n('Poço das Correntes, tempo incerto. A segunda memória. O Abismo não tinha fundo, mas tinha um lugar para quem desobedecia.'),
      ozric('Eu julguei mil almas. Nenhuma delas me julgou de volta. Até agora.'),
      n('A primeira chama negra nasceu do ódio e da vergonha. Ela não queimou a pele; queimou a corrente.'),
    ],
    [
      n('Ozric saiu do poço com a foice e uma nova pergunta: quantas almas ainda podiam ser salvas?'),
      ozric('Nenhuma corrente prende uma sentença justa.'),
      n('No alto, a Cidade de Cobre ardia. Ele subiu. A segunda corrente se partiu, e a memória seguinte já estava esperando.'),
    ],
  ),
  24: chapter(
    [
      n('Cidade de Cobre, tempo incerto. As almas esquecidas se escondiam nas ruas, com medo de serem devoradas pelo Barão.'),
      ozric('Eu conheço seus nomes. Eu os li em voz alta antes de cada sentença. O Barão quer que eu esqueça.'),
      n('Um coletor de almas desceu sobre a praça. Ozric ergueu a foice.'),
    ],
    [
      n('O coletor virou cinza. As almas não agradeceram. Apenas olharam para Ozric como quem espera a próxima sentença.'),
      ozric('Eu não vim julgar vocês. Vim libertar.'),
      n('Pela primeira vez, uma alma sorriu. Depois outra. O Abismo sentiu. A terceira corrente rangeu.'),
    ],
  ),
  25: chapter(
    [
      n('Salão do Barão, tempo incerto. A quarta memória. O trono estava vazio, mas a voz de Acheron ocupava cada sombra.'),
      boss('ACHERON', 'Você sempre foi meu melhor carrasco, Ozric. Ainda pode ser.'),
      ozric('Eu fui. Agora sou a sentença que você não pode comprar.'),
      n('Os antigos companheiros de Ozric bloquearam o salão. Nenhum deles tinha mais rosto. Ele reconheceu a foice de cada um. O Abismo não tinha apagado os nomes — só os rostos.'),
    ],
    [
      n('O general traidor caiu. O trono continuou vazio. Ozric entendeu que o Barão não estava ali — estava com medo.'),
      ozric('Um trono vazio não faz um rei.'),
      n('Ele seguiu para os portões. A sentença final esperava. A quarta corrente se partiu, e o Abismo ficou em silêncio.'),
    ],
  ),
  26: chapter(
    [
      n('Portões do Abismo, tempo incerto. As chamas negras de Ozric abriam caminho entre as legiões rubras. A memória estava quase no fim — mas a última corrente ainda prendia o peito dele ao portão.'),
      ozric('Eu não vim pedir perdão. Vim terminar o que comecei.'),
      n('A corrente rangeu. Do outro lado do portão, três vozes chamaram o nome dele. Ravi, Miriam e Kael tinham descido do nível superior do Abismo. Eles estavam vindo. Ozric cerrou os dentes e segurou a foice. Se o Abismo queria uma última sentença, ele daria uma.'),
      ozric('Vocês demoraram.'),
    ],
    [
      n('As legiões caíram. Ozric chegou ao portão e viu a corrente que o prendia: um elo para cada alma que ele julgou sem ouvir. A foice não cortava aquela corrente. Nenhuma arma cortava.'),
      ozric('Eu não fui acorrentado por um crime. Fui acorrentado por uma escolha. E escolha não se quebra sozinha.'),
      n('Do outro lado, Ravi gritou o nome dele. Miriam queimou a primeira fileira de demônios. Kael dobrou a gravidade do portão. Ozric estendeu a mão para a corrente — e esperou.'),
      n('Pela primeira vez em séculos, o carrasco esperou por alguém.'),
    ],
  ),
  27: chapter(
    [
      n('Portão do Abismo, tempo incerto. Ravi, Miriam e Kael desceram quatro níveis atrás da voz de Ozric. O chão era magma; o ar, culpa. No centro do portão, a última corrente prendia Ozric ao trono de ossos.'),
      ozric('Vocês não deviam estar aqui. O Abismo não devolve o que prende.'),
      n('Ravi agarrou a corrente. A bioeletricidade correu pelo metal. Miriam cravou as mãos no elo e o magma subiu. Kael dobrou a gravidade até o ferro gritar. A corrente não se partiu sozinha: ela se partiu porque três pessoas decidiram que Ozric não ficaria para trás.'),
      ozric('Eu não pedi ajuda.'),
      ravi('Ninguém pede. É por isso que a gente veio.'),
    ],
    [
      n('A corrente se partiu. Ozric caiu de joelhos, livre pela primeira vez em séculos. As chamas negras subiram pela foice, mas não queimaram Ravi, Miriam ou Kael. Queimaram só o que restava da corrente.'),
      miriam('Você está inteiro?'),
      ozric('Não. Mas estou livre. Isso é mais do que eu mereço.'),
      ravi('Merecer é papo de juiz. A gente é família. Família não deixa ninguém acorrentado no inferno.'),
      n('Atrás deles, o Barão Acheron se ergueu. A coroa torta, o fogo do Abismo nas mãos. Ozric olhou para os três e depois para a foice.'),
      ozric('Acheron me acorrentou porque eu me recusei a corromper uma criança. Agora ele vai descobrir o que uma sentença justa parece quando tem testemunhas.'),
    ],
  ),
  28: chapter(
    [
      n('Portões Corrompidos, tempo incerto. O Barão Acheron esperava no alto do trono, com a coroa torta e o fogo do Abismo nas mãos.'),
      ozric('Ele me acorrentou por não corromper uma criança. Ravi, Miriam e Kael quebraram a última corrente. Agora eu vou mostrar a ele o que uma sentença justa parece quando tem testemunhas.'),
      miriam('Então a gente vai junto. Ninguém enfrenta o Inferno sozinho.'),
      ravi('Eu já falei isso? A gente vai virar família.'),
      n('As chamas negras de Ozric subiram. O Barão riu. O Abismo prendeu a respiração.'),
    ],
    [
      n('Acheron virou cinza. Ozric não comemorou. Apenas recolheu a foice e fechou os olhos para as almas que restaram.'),
      ozric('Acheron não era o Abismo. Era o medo que o Abismo usava para manter as almas em fila. Agora o medo não tem mais trono.'),
      ozric('O portal acima leva ao Céu. Eu não sou bem-vindo lá. Mas a corrupção não se importa com boas-vindas.'),
      kael('Sensores indicam uma concentração massiva de energia sacra... e alguém gritando por socorro em todas as frequências.'),
      n('O portal se abriu. Uma figura ferida caiu através dele — uma mulher de branco e ouro, espada na mão, asas de luz piscando como uma lâmpada quebrada.'),
      elodie('Não é socorro. É um aviso. A Eclésia caiu. E eu sou a última que ainda se lembra do que ela era.'),
      ravi('Ótimo. Mais uma pessoa armada e traumatizada. A gente vai virar família se continuar assim.'),
      n('Élodie olhou para o portal. “Se vocês querem impedir que o Céu caia, precisam subir. Mas o Céu não vai deixar vocês entrarem sem cobrar.”'),
    ],
  ),

  // ============================================================ ARCO V — ÉLODIE
  29: chapter(
    [
      n('O Céu não os recebeu com portas. Recebeu com um julgamento. A luz da Eclésia os separou, e Élodie foi obrigada a reviver o começo. Noviciado da Aurora, tempo incerto.'),
      elodie('Eu decorava os nomes dos anjos enquanto o céu caía. A Mestra Aurélia dizia que a fé era um lugar seguro.'),
      n('O primeiro vitral se partiu durante a cerimônia. O primeiro irmão caiu antes do amém. O vitral desabou sobre o coro. Élodie ergueu a lâmina que jurara nunca usar.'),
      n('A luz da Aurora respondeu — não para purificar, mas para proteger. O voto se partiu antes da lâmina. O Ferrato não lhe deu aquela luz; ela sempre estivera ali, esperando um motivo.'),
    ],
    [
      n('Élodie salvou os noviços. Pela primeira vez, usou a lâmina para cortar o que ameaçava, não para selar o que doía.'),
      elodie('Eu quebrei o voto. Ainda não sei se foi pecado ou escolha.'),
      n('A Mestra Aurélia não respondeu. Ela já não estava mais lá. A primeira memória se fechou, e a luz do julgamento puxou Élodie para a próxima.'),
    ],
  ),
  30: chapter(
    [
      n('Grande Vitral, tempo incerto. O irmão de Élodie, Lucien, caiu no meio do coro. A corrupção o tomou antes que ela pudesse alcançá-lo.'),
      elodie('Lucien, olha pra mim. Você ainda está aí.'),
      n('Ele pediu que ela o selasse. Ela obedeceu. Foi a primeira vez que a luz dela doeu. A memória não deixou ela escolher diferente. Só deixou ela sentir de novo.'),
    ],
    [
      n('O serafim caído caiu. Lucien não voltou. Élodie ficou com a mão queimada pela própria luz.'),
      elodie('Salvar não é manter. É impedir que a corrupção vença.'),
      n('Ela levantou a lâmina. O céu não tinha mais santos, mas ainda tinha gente. A segunda memória se fechou; o julgamento não tinha terminado.'),
    ],
  ),
  31: chapter(
    [
      n('Capela da Aurora, tempo incerto. A Mestra Aurélia estava no altar, mas seus olhos não reconheciam mais nada.'),
      elodie('Mestra, eu segui cada regra. Por que a senhora está assim?'),
      n('A resposta veio com uma lâmina de luz. A fé da Ordem não tinha protegido ninguém. Aurélia não lutava contra Élodie. Lutava contra o que restou dela.'),
    ],
    [
      n('Élodie venceu a mestra. O corpo dela se desfez em penas cinzas. A capela ficou em silêncio.'),
      elodie('A fé que não protege ninguém está vazia.'),
      n('Ela saiu da capela com a lâmina baixa e o coração alto. A terceira memória se fechou. A quarta já estava queimando.'),
    ],
  ),
  32: chapter(
    [
      n('Coro Celestial, tempo incerto. Os sobreviventes da Eclésia se dividiam entre purificar o céu com fogo e fugir.'),
      elodie('Nós não vamos purificar nada. Vamos abrir caminho para quem ainda quer viver.'),
      n('O coro de lâminas bloqueou a saída. Élodie reconheceu cada voz. Eram os noviços que ela salvou. O Céu os tinha transformado em guardas.'),
    ],
    [
      n('O coro caiu. Os fiéis atravessaram a porta. Élodie ficou para trás, cobrindo a retirada.'),
      ravi('Você vem ou não vem?'),
      elodie('Eu vou. Só preciso terminar de acreditar nisso.'),
      n('A quarta memória se fechou. Élodie abriu os olhos no presente, no sopé da Escadaria de Malakhim. Os companheiros estavam ao lado dela, livres.'),
    ],
  ),
  33: chapter(
    [
      n('Escadaria de Malakhim, tempo incerto. A escada era feita de penas, culpa e luz doentia. O grupo subia junto.'),
      elodie('Eu não vim pedir perdão. Vim abrir espaço para o céu respirar.'),
      n('No alto, o Arcanjo Malakhim esperava com as asas abertas e os olhos fechados. Ele não desceu. Mandou o Arauto da Aurora.'),
    ],
    [
      n('O Arauto caiu. Malakhim abriu os olhos pela primeira vez — e eles estavam cheios de lágrimas. Ele não estava purificando o céu. Estava esperando alguém que o impedisse.'),
      boss('MALAKHIM', 'Você subiu até aqui, filha da Aurora. Ainda pode escolher: selar o céu ou salvar o que resta dele.'),
      elodie('Eu não vim selar. Vim abrir.'),
      n('Malakhim abriu a porta atrás do trono. “Venham. O Céu não cabe mais em uma escada.” O grupo atravessou. Do outro lado, a Eclésia em ruínas esperava. No altar, uma silhueta de asas abertas aguardava — Malakhim não atravessou a porta com eles. Não precisava: o Céu era dele, e ele já estava em todos os lugares que ainda restavam.'),
    ],
  ),
  34: chapter(
    [
      n('Biblioteca da Aurora, tempo incerto. Os livros flutuavam como pássaros mortos. Cada lombada tinha o nome de um noviço que a Eclésia catalogou antes de cair.'),
      elodie('Eu decorava os nomes para não esquecer. A Ordem dizia que nomear era selar. Eu não sabia que selar podia doer assim.'),
      n('Élodie abriu o registro da primeira visita do Ferrato ao Céu. A página mostrava Malakhim diante de uma fome sem rosto, propondo a purificação como misericórdia. A luz dele não foi tomada: foi convencida.'),
      elodie('Ele não é um monstro. É um mestre que escolheu a dor errada para acabar com a dor.'),
    ],
    [
      n('Élodie fechou o registro. Os nomes dos noviços brilharam na página, um por um. Ela não os selou. Ela os leu em voz alta, para que o céu ouvisse.'),
      ravi('E o Malakhim? O que a gente faz se ele não quiser ouvir?'),
      elodie('Eu enfrento. Não para purificar, mas para abrir espaço. Se ele ainda estiver lá dentro, eu vou lembrar o nome dele. Se não estiver, eu vou impedir que ele leve mais alguém.'),
      miriam('Você não vai sozinha.'),
      elodie('Eu sei. É por isso que vocês estão aqui.'),
      n('A biblioteca se fechou atrás deles. No alto, a Escadaria de Malakhim esperava. A luz do Céu tinha um dono — e ele estava com medo de perder o que restava.'),
    ],
  ),
  35: chapter(
    [
      n('Eclésia em Ruínas, tempo incerto. O Arcanjo Malakhim ainda acreditava que estava purificando o céu. As asas dele cobriam a cúpula quebrada.'),
      n('No altar, a silhueta que eles viram através da porta esperava. Malakhim não era um eco: era o próprio Arcanjo, e o Céu inteiro cabia na tristeza dele.'),
      elodie('Ele foi meu mestre. Agora é a coisa que eu preciso impedir.'),
      miriam('Você não precisa fazer isso sozinha.'),
      elodie('Eu sei. É por isso que vocês estão aqui.'),
      n('A lâmina de Élodie acendeu. O coro dos caídos respondeu. A última batalha do Céu começou.'),
    ],
    [
      n('Malakhim caiu de joelhos, as asas se desfazendo em penas de luz. Ele pediu desculpas a alguém que não existia mais.'),
      boss('MALAKHIM', 'Eu queria salvar o Céu... só não sabia de quem.'),
      elodie('Atrás do trono há uma porta. Não leva a nenhum plano. Leva ao que existe entre eles.'),
      n('O grupo atravessou. O Ferrato os esperava. “Vocês chegaram mais longe do que os outros. Eu me lembro de todos os outros.”'),
      ravi('Que voz é essa? Está vindo de dentro da minha cabeça!'),
      ferrato('Eu sou o Ferrato. Não sou um deus. Sou a fome que restou quando os deuses se calaram. Venham. Eu quero sentir o gosto da esperança.'),
      n('Então o ar se dobrou. Uma figura alongada, feita de galáxias e memórias, abriu os olhos sem íris. Atrás dele, uma voz que vinha observando desde o primeiro dia finalmente atravessou o Véu.'),
      thryc('Eu sou o Eco do Nexus. Vocês são a primeira esperança que eu lembro de sentir. Permitam-me lutar ao lado de vocês.'),
      n('O grupo atravessou a porta atrás do trono. O que encontraram não era um lugar: era a memória de Thryc, aberta como uma ferida. E, pela primeira vez, os cinco Despertos entraram nela juntos.'),
    ],
  ),

  // ============================================================ ARCO VI — THRYC
  36: chapter(
    [
      n('Mar de Ecos, tempo nenhum. O grupo atravessou o Véu e caiu dentro da memória de Thryc. O mundo não existia mais, mas cada grão de poeira ainda guardava uma voz. Do outro lado, cinco vidas acabavam de entrar no Nexus — e, desta vez, não estavam sozinhas.'),
      thryc('Eu sou o que restou de uma canção. Alguém cantou isso antes de o mundo acabar.'),
      n('Um eco antigo tentou devorar a memória. Thryc estendeu a mão e, pela primeira vez, escolheu lembrar. Ravi segurou o ombro dele. Miriam ficou entre o eco e o grupo. O eco tentou devorar a lembrança. Thryc abriu a mão — e a memória virou luz.'),
      n('Pela primeira vez, o Nexus escolheu lembrar em vez de esquecer. A luz não veio do Ferrato. Veio das memórias que ele não conseguiu digerir — e que Thryc carregava sem saber. Agora, cinco pessoas carregavam com elu.'),
    ],
    [
      n('O eco se desfez. A canção continuou, agora com seis vozes. Thryc não sabia o que era saudade. Aprendeu ali, com o grupo por perto.'),
      thryc('Toda memória merece alguém que a carregue.'),
      n('Elu caminhou para o próximo eco. Atrás de elu, o Véu se fechou um pouco mais. Do lado de dentro, cinco luzes se moviam com elu.'),
    ],
  ),
  37: chapter(
    [
      n('Jardim de Vidro, tempo nenhum. Um mundo morto florescia em cristais. Cada flor guardava o último dia de alguém.'),
      thryc('Isso é bonito. Mesmo tendo acabado.'),
      n('Um jardineiro de vidro bloqueou o caminho. Ele não queria devorar Thryc; queria que elu ficasse. Ofereceu uma flor com o rosto de alguém que Thryc nunca conheceu. Era a memória de um mundo inteiro.'),
      ravi('A gente já viu esse filme. A flor é bonita, mas a gente tem uma pizza esperando do outro lado.'),
    ],
    [
      n('O jardineiro se partiu. Thryc segurou uma flor até ela virar pó. Não doeu. Doeu um pouco.'),
      thryc('O que termina ainda pode ter valido a pena.'),
      n('Elu guardou uma semente de vidro. Ainda não sabia por quê. Era uma promessa de que algo podia crescer depois do fim. Miriam guardou a semente no bolso do uniforme, ao lado do capacete do Capitão Duarte.'),
    ],
  ),
  38: chapter(
    [
      n('Fenda da Fome, tempo nenhum. Ferrato ofereceu a Thryc todas as memórias que devorou: mundos, amores, nomes, finais.'),
      ferrato('Você é feito do que eu deixei. Junte-se a mim. Nós podemos ser tudo.'),
      thryc('Eu não sou o que me devorou. Eu sou o que sobrou para contar.'),
      n('A fome se virou para os outros. Ofereceu a Ravi a rua inteira de volta. A Miriam, todos os nomes que ela perdeu. A Kael, a voz da Dra. Sora. A Ozric, a criança que ele salvou. A Élodie, o irmão. Nenhum deles estendeu a mão.'),
    ],
    [
      n('A fenda se fechou. Thryc sentiu a primeira raiva. Era quente, e não era fome.'),
      thryc('Eu posso lutar. Isso é novo.'),
      n('Do lado de dentro do Véu, seis vidas se moviam. Thryc quis saber por quê. A resposta estava ficando mais perto.'),
    ],
  ),
  39: chapter(
    [
      n('Ponte de Memórias, tempo nenhum. Thryc viu os cinco Despertos ao seu lado: Ravi rindo, Miriam segurando uma porta, Kael consertando o impossível, Ozric protegendo uma alma, Élodie escolhendo uma vida.'),
      thryc('Eles continuam se levantando. Por quê?'),
      n('A resposta não veio em palavras. Veio como esperança — uma memória que insistia em voltar. E, pela primeira vez, Thryc viu a própria cadeira naquela mesa. Não estava vazia.'),
    ],
    [
      n('O guardião da ponte caiu. Thryc deu o primeiro passo em direção ao Véu.'),
      thryc('A esperança é uma memória que insiste em voltar.'),
      n('Elu escolheu intervir. Pela primeira vez, o Nexus teve vontade própria. A ponte não levava ao fim. Levava a uma escolha.'),
    ],
  ),
  40: chapter(
    [
      n('Limiar do Ferrato, tempo nenhum. Os seis Despertos se encontraram. Thryc reuniu as memórias como quem acende uma fogueira.'),
      thryc('Se o fim é uma escolha, eu escolho o amanhã.'),
      n('O Ferrato abriu os olhos sem íris. A fome olhou para a esperança e, pela primeira vez, hesitou. Não porque estivesse fraco. Porque, pela primeira vez, não sabia o que estava olhando.'),
    ],
    [
      n('Thryc atravessou o limiar. Atrás de elu, os cinco Despertos respiravam. À frente, o fim.'),
      thryc('Eu carreguei mundos inteiros. Agora vou carregar essa última memória.'),
      n('O Nexus prendeu a respiração. O Ferrato abriu os olhos. E, pela primeira vez, o fim pareceu ter medo.'),
    ],
  ),
  41: chapter(
    [
      n('Nexus, tempo nenhum. Thryc abriu uma memória que não era um mundo: uma mesa de madeira, seis cadeiras e uma pizza que nunca esfriava. O Ferrato não tinha conseguido digerir aquela refeição.'),
      thryc('Eu vi vocês do outro lado do Véu. Cinco cadeiras. Uma vazia. Eu não sabia que a vazia era minha.'),
      n('Ravi sentou primeiro. Miriam puxou a cadeira de Kael. Ozric hesitou antes de tocar a mesa. Élodie abriu a mão sobre a toalha, como se abençoasse o gesto. Thryc sentou por último. A mesa ficou completa.'),
      ravi('Tá, mas alguém vai explicar por que a pizza não esfria?'),
      thryc('Porque essa memória é o que o Ferrato não conseguiu devorar. Vocês. A escolha de continuar juntos.'),
    ],
    [
      n('Cada um contou uma memória. Ravi contou a mãe. Miriam contou o capacete do Capitão Duarte. Kael contou a voz da Dra. Sora. Ozric contou a criança que salvou. Élodie contou Lucien. Thryc contou a primeira canção.'),
      ravi('Então é isso? A gente é a pizza que o fim não conseguiu comer?'),
      thryc('Vocês são a memória que insiste em voltar. O Ferrato devora mundos, mas não consegue digerir uma escolha. É por isso que ele tem medo de vocês.'),
      miriam('Então vamos dar a ele uma escolha que ele não pode engolir.'),
      n('As seis cadeiras ficaram cheias. Do lado de fora da memória, o Ferrato abriu os olhos. Pela primeira vez, a fome olhou para uma mesa e não viu comida. Viu testemunhas.'),
      thryc('Eu carreguei mundos inteiros. Agora vou carregar essa última memória: seis pessoas que escolheram não deixar ninguém para trás.'),
    ],
  ),
  42: chapter(
    [
      n('Nexus Primordial, tempo nenhum. O Ferrato se manifestou como uma consciência faminta, feita de galáxias e memórias. Não era um deus. Era uma fome com consciência — e conhecia cada um pelo nome.'),
      ferrato('Cada plano que eu devorei vive em mim. A Terra, o Espaço, o Inferno, o Céu. Vocês são apenas o próximo sabor.'),
      thryc('Eu sou feito de tudo o que você tentou apagar. Cada memória que você engoliu ecoa em mim.'),
      ravi('Então a gente não está sozinho nem no fim do mundo. Boa. Eu odeio lutar sozinho.'),
      miriam('Ravi. Foco. Élodie, sela o que puder. Ozric, drene. Kael, não deixa ele se mover. Thryc...'),
      thryc('Eu ecoarei cada golpe de vocês. Até o último.'),
      n('Seis Despertos contra uma consciência cósmica. Do lado de fora do Véu, a realidade prendeu a respiração. O Ferrato não estava lutando contra seis pessoas. Estava lutando contra tudo o que elas lembravam.'),
    ],
    [
      ferrato('Por que... vocês continuam se levantando? Eu sou o fim. Eu sempre fui o fim.'),
      elodie('Porque o fim não é uma pessoa. É uma escolha. E nós escolhemos outra coisa.'),
      n('O Véu se fechou. Não com violência — com cuidado, como alguém costurando uma ferida. Do lado de fora, o céu de New Haven amanheceu. Em Brasília, a chuva apagou o último incêndio. Em SOLACE, a doca 3 voltou a girar. No Abismo, as almas dormiram. No Céu, alguém abriu uma janela.'),
      ravi('Então... acabou? Alguém quer pizza? Eu conheço um lugar que ainda deve estar de pé.'),
      thryc('Eu gostaria de provar pizza. E ouvir uma piada sua. E entender por que vocês chamam isso de vitória.'),
      miriam('Porque amanhã ainda vai existir. É o suficiente.'),
      n('Os Despertos não lutam para se tornar deuses. Eles lutam para que amanhã exista. Na Plataforma Amanhecer, os quarenta e três acordaram para o primeiro dia sem portal. E, em algum lugar, Dona Célia estava colocando uma pizza no forno.'),
      n('Na mesa do Nexus, seis cadeiras continuaram cheias. O Ferrato tinha devorado mundos, mas não conseguiu devorar uma refeição compartilhada. Era a única coisa que ele nunca entenderia.'),
    ],
  ),
};

export interface CreditLine {
  role: string;
  names: string;
}

export const CREDITS: CreditLine[] = [
  { role: 'Criação & Narrativa', names: 'Ferrato: A Guerra Dos Despertos' },
  { role: 'Direção de Jogo', names: 'Design Document — Seis Arcos, 42 Capítulos' },
  { role: 'Programação & Engine', names: 'TypeScript + HTML5 Canvas 2D' },
  { role: 'Arte', names: 'Ilustração procedural em código (sem assets externos)' },
  { role: 'Trilha & Efeitos', names: 'Síntese WebAudio em tempo real · 42 temas + chefes' },
  { role: 'Os Despertos', names: 'Ravi · Miriam · Kael · Ozric · Élodie · Thryc' },
  { role: 'Vozes do Véu', names: "Khar'uun · Legiões Rubras · Eclésia Caída · Ferrato" },
  { role: 'Agradecimento', names: 'A todos que continuam se levantando' },
];

export const TITLE_TAGLINE = 'A GUERRA DOS DESPERTOS';
export const TITLE_QUOTE = 'O comum pode se tornar extraordinário quando há algo pelo qual lutar.';
