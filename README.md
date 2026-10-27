# FERRATO — A Guerra Dos Despertos

Beat 'em up 2D single-player para navegador, feito com **HTML5 Canvas**, **CSS3** e **TypeScript**. Seis Despertos, seis arcos de seis capítulos (36 fases), chefes com múltiplas fases, cutscenes e progressão salva localmente. Toda a arte e todo o áudio são gerados em tempo de execução — não há sprites, trilhas ou fontes de jogo baixadas.

**Jogue online:** https://tokito-992.github.io/ferrato-a-guerra-dos-despertos/

## Jogar

```bash
npm install
npm run build
npm run serve
# abra http://localhost:4173
```

> O jogo usa módulos ES. Abrir `index.html` direto por `file://` não funciona; sirva a pasta por HTTP.

No GitHub Pages, publique a raiz do repositório (mantendo `index.html`, `styles/` e `dist/`). Não há backend, WebSocket, conta ou requisição de rede em tempo de execução; apenas as fontes do Google Fonts são opcionais (há fallbacks no CSS).

## Controles

| Tecla | Ação |
| --- | --- |
| `A` / `D` ou `←` / `→` | Mover / trocar de arco nos menus |
| `W` / `↑` | Subir / interagir em menus |
| `S` / `↓` | Descer em menus / trocar de capítulo |
| `ESPAÇO` | Pular |
| `J` | Ataque leve (cadeia de combo) |
| `K` | Ataque pesado / contra-ataque |
| `L` ou `Shift` | Dash com invulnerabilidade curta |
| `E` | Habilidade especial (com recarga) |
| `ENTER` | Confirmar / avançar diálogo |
| `ESC` / `P` | Pausar |
| `BACKSPACE` / `Q` | Voltar |
| `M` | Ligar/desligar áudio |

Menus também aceitam mouse (clique e hover).

## Conteúdo

### Campanha em seis arcos

A campanha tem **36 capítulos**. Cada arco é dedicado a um Desperto e conta sua história pessoal em cinco capítulos, fechando o planeta no sexto com o chefe do arco. Os capítulos 1–5 terminam em uma onda de elite; o capítulo 6 mantém as ondas originais e o confronto final.

| Arco | Desperto | Capítulos | Chefe do planeta |
| --- | --- | --- | --- |
| I — O Despertar | Ravi | 1–6 | Colosso de Carne-Ferrato |
| II — Cinzas Ascendentes | Miriam | 7–12 | General Vek'thar |
| III — Órbita Quebrada | Kael | 13–18 | Núcleo-Orbitário Xal'mor |
| IV — Portões Corrompidos | Ozric | 19–24 | Barão Acheron |
| V — Véu Rasgado | Élodie | 25–30 | Arcanjo Malakhim |
| VI — Ferrato | Thryc | 31–36 | Ferrato |

| Arco | Capítulos |
| --- | --- |
| I | 1 A Última Entrega · 2 Mercado em Pânico · 3 Estação Central · 4 Ponte Nova Haven · 5 Aurora de Ferro · 6 O Despertar |
| II | 1 Estrada de Cinzas · 2 Quartel 09 · 3 Hospital Esperança · 4 Avenida dos Heróis · 5 Fogo Que Não Cessa · 6 Cinzas Ascendentes |
| III | 1 Órfãos do Amanhecer · 2 Doca de Atracação · 3 Corredor 7 · 4 Coração de SOLACE · 5 Órbita de Guerra · 6 Órbita Quebrada |
| IV | 1 O Julgamento · 2 Correntes do Exílio · 3 Cidade das Almas · 4 O Trono Vazio · 5 A Última Sentença · 6 Portões Corrompidos |
| V | 1 O Juramento · 2 Vitral Partido · 3 Aurora Interior · 4 Coro dos Caídos · 5 Asas de Luz · 6 Véu Rasgado |
| VI | 1 Memórias de um Mundo · 2 O Jardim de Vidro · 3 Vozes do Véu · 4 O Primeiro Eco · 5 Antes do Fim · 6 Ferrato |

Cada capítulo tem três ondas com composições e elites próprias, arena com câmera travada, abertura e encerramento em cutscene. Ao concluir um capítulo, o próximo é liberado; ao concluir o capítulo 6 de um arco, o Desperto do arco seguinte desperta. A vitória no capítulo 36 leva à tela final e aos créditos.

### Despertos

| Herói | Epíteto | Estilo | Habilidade | Arco |
| --- | --- | --- | --- | --- |
| Ravi | O Pulso | Acrobático elétrico | Pulso Voltaico | I |
| Miriam | A Quebra-Ossos | Tank ofensivo geotérmico | Erupção Magmática | II |
| Kael | Zero-G | Zoner gravitacional | Singularidade | III |
| Ozric | O Exilado | Híbrido vampírico com foice | Colheita de Chamas Negras | IV |
| Élodie | Lâmina Celeste | Duelista sagrada | Selo da Aurora | V |
| Thryc | Eco | Manipulador do Nexus | Eco | VI |

Cada herói tem atributos, golpes, alcance, hitboxes, passiva, efeitos e som de habilidade próprios. Kael é **não-binário**; Thryc é **agênero** e usa pronomes neutros (**elu/delu**).

## Sistemas

- Combos com contador, hitstun, knockback, launch, críticos, hitstop, partículas e números de dano.
- Invulnerabilidade em dash, após dano e em transições; inimigos com i-frames, status (selo, queimadura, marca) e resistências.
- Habilidades com recarga e medidor de calor/ritmo próprio de cada herói, com efeito sonoro exclusivo.
- Dez arquétipos de inimigos com IA distinta (rastejantes, guerreiros, drones, ceifadores, cães, brutamontes, serafins, construtos, ecos) e variações elite.
- Chefes com telegrafia, padrões por fase, invocação de reforços, projéteis, feixes, hazards e mudança de fase com invulnerabilidade temporária.
- Câmera lateral com limites por arena, parallax em camadas, clima e paleta próprios para cada capítulo.
- Menu principal (Novo Jogo, Continuar, Despertos & Arcos, Créditos), pausa (continuar, trocar Desperto, reiniciar, sair), game over (tentar novamente, trocar, menu) e vitória.
- Seleção por arcos e capítulos, com sinopse, motivo do herói, lore, guardião/chefe, dificuldade e progresso.
- Progressão em `localStorage` (chave `ferrato_guerra_dos_despertos_save_v1`, esquema **v2**): capítulos concluídos, capítulo máximo, heróis desbloqueados, herói selecionado, abates, quedas, melhor combo e áudio.
- Áudio procedural via WebAudio: 36 temas de fase, 6 temas de chefe, 6 ambientes e efeitos sintetizados.
- Dificuldade progressiva por arco e capítulo; o HP dos chefes acompanha o arco.
- Sem dependências de runtime; arte e som são desenhados/sintetizados no navegador.

### Migração de save

Saves antigos de seis fases são migrados automaticamente para o esquema v2, sem apagar o progresso. As fases antigas viram os capítulos finais dos novos arcos:

| Save antigo | Novo capítulo |
| --- | --- |
| Fase 1 | 6 |
| Fase 2 | 12 |
| Fase 3 | 18 |
| Fase 4 | 24 |
| Fase 5 | 30 |
| Fase 6 | 36 |

Um arco antigo concluído libera os seis capítulos daquele arco. A chave de `localStorage` é mantida para permitir a migração.

### Resetar o progresso

No console do navegador:

```js
localStorage.removeItem('ferrato_guerra_dos_despertos_save_v1');
location.reload();
```

## Arquitetura

```
src/
  main.ts              bootstrap do canvas e do loop
  core/                Game (loop, cenas, transições), input, áudio, save v2,
                       câmera, partículas, matemática e tipos compartilhados
  data/                heróis, 36 capítulos, chefes, inimigos, história e créditos
  entities/            Combatant, Player, Enemy, Boss, projéteis e hazards
  render/              tema, personagens, retratos, inimigos, chefes e cenários
  scenes/              título, seleção por arcos, história, gameplay, vitória e créditos
  ui/                  HUD e menus (teclado + mouse)
styles/main.css        moldura, letterbox e tipografia
index.html             entrada estática
dist/                  JavaScript compilado (gerado por `tsc`)
```

O jogo roda em resolução interna fixa de **1280×720**, ajustada por CSS com letterbox. A lógica é independente de framerate e usa passos de simulação com limite de delta.

## Scripts

| Comando | Função |
| --- | --- |
| `npm run typecheck` | Checagem de tipos sem emitir arquivos |
| `npm run build` | Compila `src/` para `dist/` |
| `npm run serve` | Servidor estático local em `http://localhost:4173` |
| `npm start` | Igual a `serve` |

Requisito de build: Node.js 18 ou superior. A única dependência de desenvolvimento é o TypeScript; o jogo em si não tem dependências de runtime.

## Publicação no GitHub Pages

O jogo está publicado em **https://tokito-992.github.io/ferrato-a-guerra-dos-despertos/** (branch `main`, pasta raiz).

Para republicar em outro repositório:

1. Envie o repositório para o GitHub.
2. Em **Settings → Pages**, escolha **Deploy from a branch**, branch `main` e pasta `/ (root)`.
3. O `index.html` da raiz carrega `styles/main.css` e `dist/main.js`; mantenha os dois no repositório.
4. Não é necessário passo de build no CI, pois `dist/` é versionado. Se preferir compilar no deploy, rode `npm run build` antes de publicar.

## Créditos

Design, código, arte procedural e áudio procedural: projeto **Ferrato**. Tipografia opcional: Cinzel, Rajdhani e Share Tech Mono (Google Fonts), com fallbacks locais.
