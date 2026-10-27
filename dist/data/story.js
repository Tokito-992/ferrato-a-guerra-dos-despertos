/** Narrativa: aberturas, encerramentos e créditos dos 36 capítulos. */
const n = (text) => ({ speaker: 'NARRADOR', who: 'narrator', text });
const ravi = (text) => ({ speaker: 'RAVI', who: 'ravi', text });
const miriam = (text) => ({ speaker: 'MIRIAM', who: 'miriam', text });
const kael = (text) => ({ speaker: 'KAEL', who: 'kael', text });
const ozric = (text) => ({ speaker: 'OZRIC', who: 'ozric', text });
const elodie = (text) => ({ speaker: 'ÉLODIE', who: 'elodie', text });
const thryc = (text) => ({ speaker: 'THRYC', who: 'thryc', text });
const ferrato = (text) => ({ speaker: 'FERRATO', who: 'ferrato', text });
const chapter = (intro, outro) => ({ intro, outro });
export const STORY = {
    // ============================================================ ARCO I — RAVI
    1: chapter([
        n('New Haven, 17h10. O céu ainda era um céu normal. Ravi equilibrava três pizzas na bicicleta e uma promessa na cabeça: voltar antes do jantar.'),
        ravi('Se eu perder o emprego hoje, pelo menos foi por uma boa causa. Três entregas, duas ruas, uma pizza de calabresa. Fácil.'),
        n('O primeiro tremor derrubou a placa da pizzaria. O segundo trouxe algo que andava como gente e cheirava a ferrugem.'),
    ], [
        n('A rua ficou em silêncio quando o último rastejante caiu. Ravi ainda segurava a caixa de pizza — agora vazia, com um buraco do tamanho de um punho.'),
        ravi('Mãe? Seu Jorge? Alguém...?'),
        n('A resposta veio de um rádio quebrado: mais criaturas a caminho do mercado. Ravi correu. Não sabia que já estava escolhendo o resto da vida.'),
    ]),
    2: chapter([
        n('Mercado Central, 17h40. As pessoas se escondiam atrás de barracas e caixas de fruta. O medo era mais rápido que qualquer criatura.'),
        ravi('Ei! Gente! Olha pra mim. Se a gente correr junto, ninguém fica pra trás. E eu sou muito bom em correr.'),
        n('Uma criança chorava sob uma barraca. Ravi a levantou com uma mão e sentiu a eletricidade subir pela outra.'),
    ], [
        n('O açougueiro de ferro caiu entre carnes e vidro. Ravi entregou a criança para a mãe e ouviu, pela primeira vez, alguém chamá-lo de herói.'),
        ravi('Herói é quem tem plano. Eu só tenho pressa.'),
        n('Mas ele sorriu. E, pela primeira vez, a piada não foi só para os outros.'),
    ]),
    3: chapter([
        n('Metrô de New Haven, 18h20. Os túneis engoliam o som da superfície. Seu Jorge, o vizinho de sempre, segurava uma lanterna e uma perna machucada.'),
        ravi('Seu Jorge, eu volto com ajuda. Só preciso passar por... isso.'),
        n('A estação estava tomada. Ravi percebeu que correr até a saída não salvaria as pessoas atrás dele.'),
    ], [
        n('Ele salvou quem pôde. Quando o túnel desabou, um nome ficou para trás. Ravi não conseguiu decorar o rosto, só a voz.'),
        ravi('Eu fui rápido. Fui rápido demais.'),
        n('A faísca no peito ardeu como culpa. Ele prometeu nunca mais correr sem olhar para trás.'),
    ]),
    4: chapter([
        n('Ponte sobre o Rio Cinza, 18h50. A fila de refugiados atravessava devagar. Do outro lado, a cidade começava a queimar.'),
        ravi('Vai, vai, vai! Eu seguro. Minha mãe me ensinou a segurar panela quente. Isso aqui é só uma panela maior.'),
        n('O celular vibrou no bolso. Dona Célia perguntava se ele estava vivo. Ele não respondeu. Não podia parar.'),
    ], [
        n('A ponte aguentou. A última família atravessou. Ravi ficou de joelhos, e o rio abaixo parecia ferver.'),
        ravi('Tá. Agora eu preciso voltar para casa. Só mais uma rua.'),
        n('Atrás dele, o céu se abriu como um vitral mal pendurado. Alguma coisa atravessou o rasgo.'),
    ]),
    5: chapter([
        n('Bairro de Ravi, 19h20. As ruas que ele conhecia agora tinham dentes. O Colosso se erguia no fim da avenida, feito de carne, concreto e fome.'),
        ravi('Mãe? Mãe, responde!'),
        n('O rádio estalou. Dona Célia disse que estava na igreja com os vizinhos. Disse para ele não vir. Ele já estava indo.'),
    ], [
        n('A faísca virou tempestade. Ravi não sabia o nome do que sentia, mas sabia para quem estava lutando.'),
        ravi('Eu não vou deixar essa cidade virar uma pizza fria. Se ela cair, cai comigo de pé.'),
        n('E então o Colosso abriu os olhos. O primeiro chefe do planeta Terra o viu correr na direção dele.'),
    ]),
    6: chapter([
        n('New Haven, 19h42. O céu se abriu como um vitral mal pendurado — e alguma coisa atravessou o rasgo.'),
        n('Do asfalto subiram criaturas de carne e ferrugem. A cidade gritou. O mundo, mais tarde, chamaria aquilo de Ferrato.'),
        ravi('Ah, não. Não no meu turno. Eu ainda tenho uma cidade pra manter de pé!'),
        n('A faísca que começara horas antes explodiu em tempestade. Relâmpagos inteiros correram pelos braços de Ravi.'),
        ravi('Tá bom. Eu não sei o que é isso... mas eu sei correr mais rápido que essas coisas. Vamos ver quem fica de pé.'),
    ], [
        n('Quando o Colosso desabou, a rua inteira virou entulho fumegante. Ravi ficou de pé. Não por heroísmo — por teimosia.'),
        miriam('Você segurou a rua sozinho, garoto?'),
        ravi('Quase. A pizza esfriou e eu perdi o emprego. Você é... bombeira?'),
        miriam('Era. Agora eu apago um incêndio maior. Brasília caiu. Se você aguenta andar, aguenta lutar.'),
        n('Eles partiram para as cinzas de Brasília. Miriam foi junto. Não porque acreditava em destino — porque alguém precisava carregar os feridos.'),
    ]),
    // ============================================================ ARCO II — MIRIAM
    7: chapter([
        n('Rodovia dos Imortais, 06h10. O sol nascia cor de ferrugem. Miriam liderava um comboio de ônibus e carros com quarenta e três sobreviventes.'),
        miriam('Manter distância. Faróis apagados. Quem não consegue dirigir, vai no meio. Ninguém fica para trás.'),
        n('Uma explosão levantou asfalto à frente. O primeiro saqueador carbonizado saiu do fogo como se tivesse nascido dele.'),
    ], [
        n('O comboio parou no acostamento. Miriam contou as cabeças duas vezes. Quarenta e três. Ninguém a menos.'),
        ravi('Você fez isso parecer fácil.'),
        miriam('Nunca é. A gente só não para para pensar nisso.'),
    ]),
    8: chapter([
        n('Posto de Bombeiros 09, 09h30. O prédio ainda tinha o número na fachada. Por dentro, cinzas e um cheiro que Miriam conhecia demais.'),
        miriam('Eu trabalhei aqui. Tirei gente de prédio em chamas. Agora eu apago um incêndio maior.'),
        n('No armário, o capacete dela. Na parede, uma foto da equipe. O Capitão Duarte sorria como quem sabia que ia morrer no trabalho.'),
    ], [
        n('O bombeiro corrompido usava o uniforme do quartel. Miriam o derrubou sem raiva, com a precisão de quem sabe que o fogo não escolhe.'),
        ravi('Você conhecia ele?'),
        miriam('Todos aqui eram alguém. É por isso que eu não deixo o fogo decidir mais nada.'),
    ]),
    9: chapter([
        n('Hospital Esperança, 11h00. Corredores cheios de macas, soro e gente demais para pouco espaço. Miriam carregava dois de cada vez.'),
        miriam('Quem consegue andar, ajuda quem não consegue. Quem não consegue, segura minha mão. Eu volto.'),
        n('No fundo da UTI, algo se movia entre as cortinas. O médico que jurou não abandonar os pacientes já não era ele mesmo.'),
    ], [
        n('A última criança saiu nos braços de Miriam. Atrás dela, o hospital desabou como uma promessa quebrada.'),
        miriam('Eu prometi que ninguém ficava para trás. Não prometi que seria fácil.'),
        n('Ela olhou para o próprio braço, onde o magma pulsava. O calor não doía mais. Isso a assustava.'),
    ]),
    10: chapter([
        n('Avenida dos Heróis, 13h20. Os nomes da antiga equipe de Miriam estavam gravados no memorial. Nenhum deles teve velório.'),
        miriam('Duarte. Ana. Costa. Lima. Eu lembro de todos. Eu lembro do jeito que cada um segurava a mangueira.'),
        n('Ravi ficou ao lado dela sem dizer nada por três minutos. Depois, contou uma piada tão ruim que ela riu.'),
    ], [
        n('O eco do Capitão Duarte caiu de joelhos. Antes de se desfazer, disse o nome dela.'),
        miriam('Eu não vou esquecer, capitão. Nem você, nem os quarenta e três.'),
        n('A voz dela não tremeu. Mas o fogo no braço ardeu mais alto.'),
    ]),
    11: chapter([
        n('Esplanada em Chamas, 15h40. O fogo não tinha mais direção. A capital inteira parecia uma boca aberta para o céu.'),
        miriam('O general está no centro. Se a gente cortar o comando, o incêndio perde a cabeça.'),
        n('Ravi apontou para o canhão no horizonte. Miriam já estava andando.'),
    ], [
        n("Vek'thar caiu, mas antes riu e apontou para o céu. Um portal orbital se abria."),
        miriam('Aquele portal não é natural. Está sendo alimentado por alguma coisa lá em cima.'),
        n('Ela não sabia ainda, mas o próximo incêndio seria no espaço. E ela iria até lá.'),
    ]),
    12: chapter([
        n('Brasília não era mais uma capital. Era uma escultura de fuligem com o formato de uma promessa quebrada.'),
        miriam("Eu trabalhei aqui. Tirei gente de prédios como esse. Agora só tem Khar'uun lá dentro."),
        ravi("Khar'uun? Isso é nome de banda ou de coisa que quer me matar?"),
        miriam('As duas. Fica atrás de mim. Eu bato primeiro, você pergunta depois.'),
        n('O braço esquerdo de Miriam acendeu em magma. Pela primeira vez em anos, o calor não doeu.'),
    ], [
        n("O General Vek'thar caiu. Mas antes de morrer, ele riu e apontou para o céu: um portal orbital estava se abrindo."),
        miriam('Aquele portal não é natural. Está sendo alimentado por alguma coisa lá em cima.'),
        kael('Correção: por uma estação orbital inteira. SOLACE. E eu sou a única pessoa viva que ainda sabe religar os motores dela.'),
        ravi('E você é...?'),
        kael('Kael. Engenharia aeroespacial. Se vocês sobreviverem à subida, talvez eu conserte vocês também.'),
    ]),
    // ============================================================ ARCO III — KAEL
    13: chapter([
        n('Plataforma Amanhecer, 04h00. O lugar onde Kael cresceu cheirava a combustível e infância. O orfanato ficava a duzentos metros da doca.'),
        kael('Eu consertava rádios aqui. A Dra. Sora dizia que eu tinha mãos de relojoeiro e cabeça de foguete. Ela não estava errada.'),
        n('A antena da plataforma estava morta. No chão, marcas de algo que arrastou corpos para dentro da doca.'),
    ], [
        n('A sentinela de doca caiu. Kael recuperou um chip com a voz da Dra. Sora: "Se você ouvir isso, não venha. Conserte o mundo de outro jeito."'),
        kael('Eu nunca fui bom em seguir instruções.'),
        n('Kael subiu na nave. O espaço era o único lugar onde o silêncio não tinha dono.'),
    ]),
    14: chapter([
        n('SOLACE, Doca 3, 04h40. A estação girava sem sinal. Kael atravessou o casco com uma chave de fenda e uma teoria.'),
        kael('Gravidade artificial em 12%. Oxigênio em 61%. E eu com uma ferramenta. Isso vai dar certo.'),
        n('A doca se abriu. O primeiro drone assimilado saiu do escuro com os olhos da tripulação.'),
    ], [
        n('Kael religou a doca e prendeu a respiração. A estação inteira gemeu, mas não caiu.'),
        kael('Um problema de cada vez. É assim que se conserta qualquer coisa.'),
        n('No corredor seguinte, uma voz conhecida repetia o próprio nome em todas as frequências.'),
    ]),
    15: chapter([
        n('Corredor 7, 05h10. As luzes piscavam no ritmo de um coração doente. Kael reconheceu o log da Dra. Sora antes de abrir a porta.'),
        kael('Ela ficou para selar o núcleo. Sozinha. Porque eu não estava aqui.'),
        n('A tripulação assimilada bloqueava o caminho. Entre eles, o rosto da mulher que ensinou Kael a consertar o impossível.'),
    ], [
        n('Kael desligou o log. A voz da Dra. Sora se calou pela primeira vez em anos.'),
        kael('Eu não vou deixar o que ela fez ser em vão. Nem o que ela foi.'),
        n('A porta do núcleo se abriu. O coração de SOLACE esperava.'),
    ]),
    16: chapter([
        n('Núcleo de SOLACE, 05h40. A sala pulsava como um animal de metal. O portal consumia a estação por dentro.'),
        kael('Eu posso salvar a estação ou fechar o portal. Não os dois.'),
        n('A voz de SOLACE respondeu com a calma de quem já calculou todas as perdas: "Escolha, Kael. A física não negocia."'),
    ], [
        n('Kael desviou a energia. A estação perdeu a gravidade, mas o portal perdeu o caminho. O núcleo ficou em silêncio.'),
        kael('Consertar também é saber o que deixar ir.'),
        n("Do lado de fora, algo enorme se moveu na órbita. Xal'mor acordou."),
    ]),
    17: chapter([
        n('Casco externo de SOLACE, 06h10. Sem chão, sem cima, sem plano B. Kael flutuava com uma linha de vida e uma raiva antiga.'),
        kael('Se eu morrer aqui, quero que alguém conserte a doca 3. Ela ficou uma porcaria.'),
        n("O Núcleo-Orbitário Xal'mor girou os anéis. A luz das estrelas morreu ao redor."),
    ], [
        n("Xal'mor caiu. Kael ficou à deriva por três segundos que duraram uma vida."),
        kael('Eu ainda estou aqui. Ainda bem. Ainda...'),
        n('O portal puxou. O calor do Abismo Rubro engoliu a estação. E Kael entendeu que consertar o universo ia levar mais tempo.'),
    ]),
    18: chapter([
        n("SOLACE, 06h20. A estação estava morrendo, mas o portal ainda respirava. No centro do núcleo, o Núcleo-Orbitário Xal'mor esperava."),
        kael('Ele era o satélite. O Ferrato o transformou em coração da estação. Se eu desligar ele, o portal fecha.'),
        miriam('Então desliga. A gente segura o resto.'),
        n('Kael olhou para a tripulação assimilada, para o último registro da Dra. Sora, para o próprio reflexo no vidro. Depois deu o primeiro passo.'),
        ravi('Kael?'),
        kael('Vamos consertar isso. De uma vez.'),
    ], [
        kael('O Núcleo está morto. Mas a assinatura do portal continua ativa... e está vindo de baixo. Muito abaixo.'),
        ravi('Baixo como... subsolo?'),
        kael('Baixo como Inferno. O portal nos puxou. Eu avisei que a física era instável.'),
        miriam('Segurem-se. Se cairmos, caímos juntos.'),
        n('O calor do Abismo Rubro engoliu a estação. E, em algum lugar entre correntes e fogo, alguém os esperava.'),
    ]),
    // ============================================================ ARCO IV — OZRIC
    19: chapter([
        n('Tribunal de Ossos, tempo incerto. Ozric era o carrasco do Abismo. A fila de almas não tinha fim, e o trono do Barão exigia sentenças.'),
        ozric('A próxima alma era uma criança. Ela protegeu o irmão do fogo. O crime dela era ter sido amada.'),
        n('O Barão ordenou a corrupção. Ozric baixou a foice e, pela primeira vez, não obedeceu.'),
    ], [
        n('A criança foi poupada. O Barão chamou aquilo de traição. Ozric chamou de justiça.'),
        ozric('Uma sentença que obedece ao medo não é sentença. É corrente.'),
        n('As correntes vieram. Ele não se arrependeu.'),
    ]),
    20: chapter([
        n('Poço das Correntes, tempo incerto. O Abismo não tinha fundo, mas tinha um lugar para quem desobedecia.'),
        ozric('Eu julguei mil almas. Nenhuma delas me julgou de volta. Até agora.'),
        n('A primeira chama negra nasceu do ódio e da vergonha. Ela não queimou a pele; queimou a corrente.'),
    ], [
        n('Ozric saiu do poço com a foice e uma nova pergunta: quantas almas ainda podiam ser salvas?'),
        ozric('Nenhuma corrente prende uma sentença justa.'),
        n('No alto, a Cidade de Cobre ardia. Ele subiu.'),
    ]),
    21: chapter([
        n('Cidade de Cobre, tempo incerto. As almas esquecidas se escondiam nas ruas, com medo de serem devoradas pelo Barão.'),
        ozric('Eu conheço seus nomes. Eu os li em voz alta antes de cada sentença. O Barão quer que eu esqueça.'),
        n('Um coletor de almas desceu sobre a praça. Ozric ergueu a foice.'),
    ], [
        n('O coletor virou cinza. As almas não agradeceram. Apenas olharam para Ozric como quem espera a próxima sentença.'),
        ozric('Eu não vim julgar vocês. Vim libertar.'),
        n('Pela primeira vez, uma alma sorriu. Depois outra. O Abismo sentiu.'),
    ]),
    22: chapter([
        n('Salão do Barão, tempo incerto. O trono estava vazio, mas a voz de Acheron ocupava cada sombra.'),
        n('A voz veio de todas as paredes: "Você sempre foi meu melhor carrasco, Ozric. Ainda pode ser."'),
        ozric('Eu fui. Agora sou a sentença que você não pode comprar.'),
        n('Os antigos companheiros de Ozric bloquearam o salão. Nenhum deles tinha mais rosto.'),
    ], [
        n('O general traidor caiu. O trono continuou vazio. Ozric entendeu que o Barão não estava ali — estava com medo.'),
        ozric('Um trono vazio não faz um rei.'),
        n('Ele seguiu para os portões. A sentença final esperava.'),
    ]),
    23: chapter([
        n('Portões do Abismo, tempo incerto. As chamas negras de Ozric abriam caminho entre as legiões rubras.'),
        ozric('Eu não vim pedir perdão. Vim terminar o que comecei.'),
        n('Do outro lado do portão, uma voz familiar chamou seu nome. Não era o Barão. Eram os Despertos.'),
    ], [
        n('Ozric atravessou o portão e encontrou o grupo. Eles estavam vivos. Isso era mais do que ele merecia.'),
        ravi('Cara, você é difícil de achar.'),
        ozric('Eu estava ocupado. Ainda estou.'),
        n('Atrás deles, o Barão Acheron se ergueu. A foice de Ozric pegou fogo.'),
    ]),
    24: chapter([
        n('Portões Corrompidos, tempo incerto. O Barão Acheron esperava no alto do trono, com a coroa torta e o fogo do Abismo nas mãos.'),
        ozric('Ele me acorrentou por não corromper uma criança. Agora eu vou mostrar a ele o que uma sentença justa parece.'),
        miriam('Então a gente vai junto. Ninguém enfrenta o Inferno sozinho.'),
        ravi('Eu já falei isso? A gente vai virar família.'),
        n('As chamas negras de Ozric subiram. O Barão riu. O Abismo prendeu a respiração.'),
    ], [
        n('Acheron virou cinza. Ozric não comemorou. Apenas recolheu a foice e fechou os olhos para as almas que restaram.'),
        ozric('O portal acima leva ao Céu. Eu não sou bem-vindo lá. Mas a corrupção não se importa com boas-vindas.'),
        kael('Sensores indicam uma concentração massiva de energia sacra... e alguém gritando por socorro em todas as frequências.'),
        elodie('Não é socorro. É um aviso. A Eclésia caiu. E eu sou a última que ainda se lembra do que ela era.'),
        ravi('Ótimo. Mais uma pessoa armada e traumatizada. A gente vai virar família se continuar assim.'),
    ]),
    // ============================================================ ARCO V — ÉLODIE
    25: chapter([
        n('Noviciado da Aurora, tempo incerto. Élodie era aprendiz da Ordem. Seu voto era catalogar e selar, nunca lutar.'),
        elodie('Eu decorava os nomes dos anjos enquanto o céu caía. A Mestra Aurélia dizia que a fé era um lugar seguro.'),
        n('O primeiro vitral se partiu durante a cerimônia. O primeiro irmão caiu antes do amém.'),
    ], [
        n('Élodie salvou os noviços. Pela primeira vez, usou a lâmina para cortar o que ameaçava, não para selar o que doía.'),
        elodie('Eu quebrei o voto. Ainda não sei se foi pecado ou escolha.'),
        n('A Mestra Aurélia não respondeu. Ela já não estava mais lá.'),
    ]),
    26: chapter([
        n('Grande Vitral, tempo incerto. O irmão de Élodie, Lucien, caiu no meio do coro. A corrupção o tomou antes que ela pudesse alcançá-lo.'),
        elodie('Lucien, olha pra mim. Você ainda está aí.'),
        n('Ele pediu que ela o selasse. Ela obedeceu. Foi a primeira vez que a luz dela doeu.'),
    ], [
        n('O serafim caído caiu. Lucien não voltou. Élodie ficou com a mão queimada pela própria luz.'),
        elodie('Salvar não é manter. É impedir que a corrupção vença.'),
        n('Ela levantou a lâmina. O céu não tinha mais santos, mas ainda tinha gente.'),
    ]),
    27: chapter([
        n('Capela da Aurora, tempo incerto. A Mestra Aurélia estava no altar, mas seus olhos não reconheciam mais nada.'),
        elodie('Mestra, eu segui cada regra. Por que a senhora está assim?'),
        n('A resposta veio com uma lâmina de luz. A fé da Ordem não tinha protegido ninguém.'),
    ], [
        n('Élodie venceu a mestra. O corpo dela se desfez em penas cinzas. A capela ficou em silêncio.'),
        elodie('A fé que não protege ninguém está vazia.'),
        n('Ela saiu da capela com a lâmina baixa e o coração alto.'),
    ]),
    28: chapter([
        n('Coro Celestial, tempo incerto. Os sobreviventes da Eclésia se dividiam entre purificar o céu com fogo e fugir.'),
        elodie('Nós não vamos purificar nada. Vamos abrir caminho para quem ainda quer viver.'),
        n('O coro de lâminas bloqueou a saída. Élodie reconheceu cada voz.'),
    ], [
        n('O coro caiu. Os fiéis atravessaram a porta. Élodie ficou para trás, cobrindo a retirada.'),
        ravi('Você vem ou não vem?'),
        elodie('Eu vou. Só preciso terminar de acreditar nisso.'),
    ]),
    29: chapter([
        n('Escadaria de Malakhim, tempo incerto. A escada era feita de penas, culpa e luz doentia.'),
        elodie('Eu não vim pedir perdão. Vim abrir espaço para o céu respirar.'),
        n('No alto, o Arcanjo Malakhim esperava com as asas abertas e os olhos fechados.'),
    ], [
        n('Malakhim caiu de joelhos. As asas se apagaram. Ele pediu desculpas a alguém que não existia mais.'),
        elodie('Atrás do trono há uma porta. Não leva a nenhum plano. Leva ao que existe entre eles.'),
        n('O grupo atravessou. O Ferrato os esperava. E, com ele, uma voz que ainda não tinha nome.'),
    ]),
    30: chapter([
        n('Eclésia em Ruínas, tempo incerto. O Arcanjo Malakhim ainda acreditava que estava purificando o céu.'),
        elodie('Ele foi meu mestre. Agora é a coisa que eu preciso impedir.'),
        miriam('Você não precisa fazer isso sozinha.'),
        elodie('Eu sei. É por isso que vocês estão aqui.'),
        n('A lâmina de Élodie acendeu. O coro dos caídos respondeu. A última batalha do Céu começou.'),
    ], [
        n('Malakhim caiu de joelhos, as asas se desfazendo em penas de luz. Ele pediu desculpas a alguém que não existia mais.'),
        elodie('Atrás do trono há uma porta. Não leva a nenhum plano. Leva ao que existe entre eles.'),
        ferrato('Vocês chegaram mais longe do que os outros. Eu me lembro de todos os outros.'),
        ravi('Que voz é essa? Está vindo de dentro da minha cabeça!'),
        ferrato('Eu sou o Ferrato. Não sou um deus. Sou a fome que restou quando os deuses se calaram. Venham. Eu quero sentir o gosto da esperança.'),
        n('Então o ar se dobrou. Uma figura alongada, feita de galáxias e memórias, abriu os olhos sem íris.'),
        thryc('Eu sou o Eco do Nexus. Vocês são a primeira esperança que eu lembro de sentir. Permitam-me lutar ao lado de vocês.'),
    ]),
    // ============================================================ ARCO VI — THRYC
    31: chapter([
        n('Mar de Ecos, tempo nenhum. Thryc abriu os olhos dentro de um mundo que já não existia. Havia vozes em cada grão de poeira.'),
        thryc('Eu sou o que restou de uma canção. Alguém cantou isso antes de o mundo acabar.'),
        n('Um eco antigo tentou devorar a memória. Thryc estendeu a mão e, pela primeira vez, escolheu lembrar.'),
    ], [
        n('O eco se desfez. A canção continuou, agora com duas vozes. Thryc não sabia o que era saudade. Aprendeu ali.'),
        thryc('Toda memória merece alguém que a carregue.'),
        n('Elu caminhou para o próximo eco.'),
    ]),
    32: chapter([
        n('Jardim de Vidro, tempo nenhum. Um mundo morto florescia em cristais. Cada flor guardava o último dia de alguém.'),
        thryc('Isso é bonito. Mesmo tendo acabado.'),
        n('Um jardineiro de vidro bloqueou o caminho. Ele não queria devorar Thryc; queria que elu ficasse.'),
    ], [
        n('O jardineiro se partiu. Thryc segurou uma flor até ela virar pó. Não doeu. Doeu um pouco.'),
        thryc('O que termina ainda pode ter valido a pena.'),
        n('Elu guardou uma semente de vidro. Ainda não sabia por quê.'),
    ]),
    33: chapter([
        n('Fenda da Fome, tempo nenhum. Ferrato ofereceu a Thryc todas as memórias que devorou: mundos, amores, nomes, finais.'),
        ferrato('Você é feito do que eu deixei. Junte-se a mim. Nós podemos ser tudo.'),
        thryc('Eu não sou o que me devorou. Eu sou o que sobrou para contar.'),
    ], [
        n('A fenda se fechou. Thryc sentiu a primeira raiva. Era quente, e não era fome.'),
        thryc('Eu posso lutar. Isso é novo.'),
        n('Do outro lado do Véu, seis vidas se moviam. Elu quis saber por quê.'),
    ]),
    34: chapter([
        n('Ponte de Memórias, tempo nenhum. Thryc viu os seis Despertos: Ravi rindo, Miriam segurando uma porta, Kael consertando o impossível, Ozric protegendo uma alma, Élodie escolhendo uma vida.'),
        thryc('Eles continuam se levantando. Por quê?'),
        n('A resposta não veio em palavras. Veio como esperança — uma memória que insistia em voltar.'),
    ], [
        n('O guardião da ponte caiu. Thryc deu o primeiro passo em direção ao Véu.'),
        thryc('A esperança é uma memória que insiste em voltar.'),
        n('Elu escolheu intervir. Pela primeira vez, o Nexus teve vontade própria.'),
    ]),
    35: chapter([
        n('Limiar do Ferrato, tempo nenhum. Os ecos dos seis Despertos se encontraram. Thryc reuniu as memórias como quem acende uma fogueira.'),
        thryc('Se o fim é uma escolha, eu escolho o amanhã.'),
        n('O Ferrato abriu os olhos sem íris. A fome olhou para a esperança e, pela primeira vez, hesitou.'),
    ], [
        n('Thryc atravessou o limiar. Atrás de elu, os seis Despertos respiravam. À frente, o fim.'),
        thryc('Eu carreguei mundos inteiros. Agora vou carregar essa última memória.'),
        n('O Nexus prendeu a respiração. O Ferrato abriu os olhos.'),
    ]),
    36: chapter([
        n('Nexus Primordial, tempo nenhum. O Ferrato se manifestou como uma consciência faminta, feita de galáxias e memórias.'),
        ferrato('Cada plano que eu devorei vive em mim. A Terra, o Espaço, o Inferno, o Céu. Vocês são apenas o próximo sabor.'),
        thryc('Eu sou feito de tudo o que você tentou apagar. Cada memória que você engoliu ecoa em mim.'),
        ravi('Então a gente não está sozinho nem no fim do mundo. Boa. Eu odeio lutar sozinho.'),
        miriam('Ravi. Foco. Élodie, sela o que puder. Ozric, drene. Kael, não deixa ele se mover. Thryc...'),
        thryc('Eu ecoarei cada golpe de vocês. Até o último.'),
        n('Seis Despertos contra uma consciência cósmica. Do lado de fora do Véu, a realidade prendeu a respiração.'),
    ], [
        ferrato('Por que... vocês continuam se levantando? Eu sou o fim. Eu sempre fui o fim.'),
        elodie('Porque o fim não é uma pessoa. É uma escolha. E nós escolhemos outra coisa.'),
        n('O Véu se fechou. Não com violência — com cuidado, como alguém costurando uma ferida.'),
        ravi('Então... acabou? Alguém quer pizza? Eu conheço um lugar que ainda deve estar de pé.'),
        thryc('Eu gostaria de provar pizza. E ouvir uma piada sua. E entender por que vocês chamam isso de vitória.'),
        miriam('Porque amanhã ainda vai existir. É o suficiente.'),
        n('Os Despertos não lutam para se tornar deuses. Eles lutam para que amanhã exista.'),
    ]),
};
export const CREDITS = [
    { role: 'Criação & Narrativa', names: 'Ferrato: A Guerra Dos Despertos' },
    { role: 'Direção de Jogo', names: 'Design Document — Seis Arcos, 36 Capítulos' },
    { role: 'Programação & Engine', names: 'TypeScript + HTML5 Canvas 2D' },
    { role: 'Arte', names: 'Ilustração procedural em código (sem assets externos)' },
    { role: 'Trilha & Efeitos', names: 'Síntese WebAudio em tempo real · 36 temas + chefes' },
    { role: 'Os Despertos', names: 'Ravi · Miriam · Kael · Ozric · Élodie · Thryc' },
    { role: 'Vozes do Véu', names: "Khar'uun · Legiões Rubras · Eclésia Caída · Ferrato" },
    { role: 'Agradecimento', names: 'A todos que continuam se levantando' },
];
export const TITLE_TAGLINE = 'A GUERRA DOS DESPERTOS';
export const TITLE_QUOTE = 'O comum pode se tornar extraordinário quando há algo pelo qual lutar.';
//# sourceMappingURL=story.js.map