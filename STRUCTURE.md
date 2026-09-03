# Estrutura técnica

`client/src/pages/Home.tsx` funciona como moldura React e gere os ecrãs menu, jogo, ajuda e definições. O Canvas é a superfície de renderização e não depende de componentes de UI para cada frame.

`client/src/game/fruits.ts` contém o catálogo configurável de frutas, níveis, raios, massa, pontuação, cores e probabilidades. `client/src/game/gameEngine.ts` contém uma classe agnóstica da interface que gere o mundo Matter.js, paredes, gravidade, lançamentos, fusões, combos, partículas e estado persistente.

A comunicação entre motor e interface é feita através de snapshots imutáveis e eventos de fusão. Isto permite substituir o desenho procedural por sprites ou adicionar moedas, skins, missões e power-ups sem misturar a física com a apresentação.
