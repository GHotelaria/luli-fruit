# LULI FRUIT

LULI FRUIT é um jogo casual de navegador em que frutas iguais se juntam para criar frutas maiores. A mecânica pertence ao género **Fruit Merge**, mas a marca, a direcção visual e a implementação são próprias.

> **Objectivo deste README:** permitir que uma pessoa abra o projecto no VS Code e faça alterações sem precisar de conhecer toda a arquitectura.

## 1. Como executar

Instale o [Node.js](https://nodejs.org/) e o [VS Code](https://code.visualstudio.com/). Abra a pasta `luli-fruit` no VS Code, abra o terminal integrado e execute:

```bash
pnpm install
pnpm dev
```

Abra no navegador o endereço indicado pelo Vite. Para validar o projecto antes de partilhar, use `pnpm check`. Para criar uma build final, use `pnpm build`.

## 2. Onde alterar cada coisa

| Quero alterar… | Ficheiro | O que procurar |
|---|---|---|
| Gravidade, atrito, combo e tempo de perigo | `client/src/game/config.ts` | `GAME_CONFIG.physics`, `danger` e `combo` |
| Frequência e aparência de frutas | `client/src/game/fruits.ts` | array `FRUITS` |
| Pontuação por fruta | `client/src/game/fruits.ts` | propriedade `score` |
| Regras de fusão | `client/src/game/gameEngine.ts` | método `tryMerge` |
| Controlos e ecrãs | `client/src/pages/Home.tsx` | funções `pointerPosition`, `drop` e blocos `screen` |
| Cores, layout e responsividade | `client/src/index.css` | variáveis e classes CSS |
| Título e descrição do navegador | `client/index.html` | `<title>` e meta description |

A regra mais importante é começar por `client/src/game/config.ts`. Os valores que afectam o comportamento geral estão reunidos nesse ficheiro para evitar procurar números soltos no código.

## 3. Configuração rápida

| Configuração | Valor actual | Efeito |
|---|---:|---|
| `physics.gravity` | `1.08` | A velocidade com que as frutas caem. Aumente para uma queda mais rápida. |
| `physics.restitution` | `0.16` | O ressalto depois das colisões. |
| `physics.friction` | `0.45` | O quanto as frutas deslizam umas sobre as outras. |
| `danger.lineY` | `82` | Altura da linha de perigo no tabuleiro. |
| `danger.maxTimeMs` | `2600` | Tempo que as frutas podem ficar acima da linha. |
| `combo.resetAfterMs` | `2800` | Tempo sem fusão até o combo desaparecer. |
| `spawn.maxLevelIncreaseScore` | `180` | Pontuação necessária para começar a incluir frutas maiores. |

Por exemplo, para tornar o jogo mais difícil, aumente `gravity` para `1.25`, reduza `maxTimeMs` para `2000` e baixe `combo.resetAfterMs` para `2200`.

## 4. Alterar frutas

Cada entrada de `FRUITS` representa um nível. Um exemplo simplificado:

```ts
{
  id: "strawberry",
  name: "Moranguito",
  level: 3,
  radius: 27,
  mass: 1.5,
  score: 10,
  color: "#F05D5E",
  accent: "#FFB07E",
  weight: 18,
}
```

`radius` controla o tamanho, `mass` influencia a resposta física, `score` define os pontos ganhos, `color` e `accent` controlam a ilustração procedural, e `weight` define a probabilidade de aparecer. As frutas menores têm pesos maiores de propósito. Para adicionar uma fruta, copie uma entrada, atribua o próximo `level` e actualize o nome, cores, raio, massa, pontuação e peso.

## 5. Como funciona o jogo

`gameEngine.ts` é responsável apenas pela simulação. O Matter.js cria o mundo, o chão, as paredes e os corpos circulares. Quando dois corpos com o mesmo `fruitLevel` colidem, o método `tryMerge` remove ambos, cria o nível seguinte, atribui pontuação, actualiza o combo e emite partículas.

`Home.tsx` é a camada visual. Ela desenha o Canvas, mostra o menu, o HUD, a pausa e o Game Over. O motor envia snapshots através de `subscribe`, por isso a interface não precisa de conhecer os detalhes da física.

## 6. Controlos

No desktop, mova o rato para posicionar a fruta e solte o botão para a lançar. A fruta acompanha o ponteiro e a linha pontilhada mostra o ponto de queda. As setas esquerda/direita e Espaço funcionam quando o Canvas está focado. No telemóvel, arraste horizontalmente e solte o dedo. O tabuleiro já usa `touch-action: none` para evitar zoom e gestos indesejados.

## 7. Organização da pasta

```text
luli-fruit/
├── client/
│   ├── index.html
│   └── src/
│       ├── game/
│       │   ├── config.ts       # configuração rápida
│       │   ├── fruits.ts       # dados das frutas
│       │   └── gameEngine.ts   # Matter.js e regras
│       ├── pages/Home.tsx      # ecrãs e Canvas
│       └── index.css           # identidade visual
├── ASSETS.md                  # manifesto de assets
├── ideas.md                   # direcção visual
├── PLAN.md                    # plano e critérios de verificação
├── STRUCTURE.md               # arquitectura resumida
└── package.json
```

## 8. Notas para futuras extensões

O projecto está preparado para crescer sem misturar sistemas. Moedas e loja podem usar um novo módulo de economia; skins podem estender os dados de `FRUITS`; missões podem ouvir eventos de fusão; e power-ups podem ser adicionados como entidades separadas no motor. A primeira versão mantém esses sistemas fora do jogo para proteger a estabilidade.

## 9. Checklist depois de uma alteração

Depois de editar, execute `pnpm check` e `pnpm build`. Abra o jogo e teste pelo menos uma queda, uma fusão, a pausa, o reinício, o Game Over e o comportamento do ponteiro no desktop e no telemóvel. Se alterar a física, teste também se as frutas não atravessam o chão nem ficam presas nas paredes.
