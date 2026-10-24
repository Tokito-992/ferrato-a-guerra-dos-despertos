# FERRATO — A Guerra Dos Despertos

Beat 'em up 2D single-player para navegador, feito com **HTML5 Canvas**, **CSS3** e **TypeScript**. Seis Despertos, seis fases lineares, chefes com múltiplas fases, cutscenes e progressão salva localmente. Toda a arte e todo o áudio são gerados em tempo de execução — não há sprites, trilhas ou fontes de jogo baixadas.

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
| `A` / `D` ou `←` / `→` | Mover |
| `W` / `↑` | Subir / interagir em menus |
| `S` / `↓` | Descer em menus |
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

### Despertos

| Herói | Epíteto | Estilo | Habilidade | Desperta na |
| --- | --- | --- | --- | --- |
| Ravi | O Pulso | Acrobático elétrico | Pulso Voltaico | Fase I |
| Miriam | A Quebra-Ossos | Tank ofensivo geotérmico | Erupção Magmática | Fase II |
| Kael | Zero-G | Zoner gravitacional | Singularidade | Fase III |
| Ozric | O Exilado | Híbrido vampírico com foice | Colheita de Chamas Negras | Fase IV |
| Élodie | Lâmina Celeste | Duelista sagrada | Selo da Aurora | Fase V |
| Thryc | Eco | Manipulador do Nexus | Eco | Fase VI |

Cada herói tem atributos, golpes, alcance, hitboxes, passiva e efeitos próprios. Thryc usa pronomes neutros (**elu/delu**).

### Fases e chefes

| Fase | Local | Chefe | Fases do chefe |
| --- | --- | --- | --- |
| I — O Despertar | Subúrbio de New Haven | Colosso de Carne-Ferrato | 2 |
| II — Cinzas Ascendentes | Ruínas de Brasília | General Vek'thar | 2 |
| III — Órbita Quebrada | Estação SOLACE | Núcleo-Orbitário Xal'mor | 2 |
| IV — Portões Corrompidos | Abismo Rubro | Barão Acheron | 2 |
| V — Véu Rasgado | Eclésia Celestial | Arcanjo Malakhim | 2 |
| VI — Ferrato | Nexus Primordial | Ferrato | 3 |

Cada fase tem três ondas com composições e elites próprias, arena com câmera travada, abertura e encerramento em cutscene. Ao vencer uma fase, o próximo Desperto é desbloqueado e a seleção avança para a fase seguinte. A vitória na Fase VI leva à tela final e aos créditos.

## Sistemas

- Combos com contador, hitstun, knockback, launch, críticos, hitstop, partículas e números de dano.
- Invulnerabilidade em dash, após dano e em transições; inimigos com i-frames, status (selo, queimadura, marca) e resistências.
- Habilidades com recarga e medidor de calor/ritmo próprio de cada herói.
- Dez arquétipos de inimigos com IA distinta (rastejantes, guerreiros, drones, ceifadores, cães, brutamontes, serafins, construtos, ecos) e variações elite.
- Chefes com telegrafia, padrões por fase, invocação de reforços, projéteis, feixes, hazards e mudança de fase com invulnerabilidade temporária.
- Câmera lateral com limites por arena, parallax em camadas, clima e paleta próprios para cada fase.
- Menu principal (Novo Jogo, Continuar, Despertos & Fases, Créditos), pausa (continuar, trocar Desperto, reiniciar, sair), game over (tentar novamente, trocar, menu) e vitória.
- Progressão em `localStorage` (chave `ferrato_guerra_dos_despertos_save_v1`): fases concluídas, fase máxima, heróis desbloqueados, herói selecionado, abates, quedas, melhor combo e áudio.
- Áudio procedural via WebAudio (música por fase e efeitos sintetizados).

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
  core/                Game (loop, cenas, transições), input, áudio, save,
                       câmera, partículas, matemática e tipos compartilhados
  data/                heróis, fases, chefes, inimigos, história e créditos
  entities/            Combatant, Player, Enemy, Boss, projéteis e hazards
  render/              tema, personagens, retratos, inimigos, chefes e cenários
  scenes/              título, seleção, história, gameplay, vitória e créditos
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
