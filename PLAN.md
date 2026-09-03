# Plano de implementação — LULI FRUIT

## Fatias de risco

1. **Canvas + Matter.js:** estabilizar gravidade, paredes, colisões e redimensionamento responsivo.
2. **Fusão idempotente:** remover duas frutas uma única vez, criar a fruta seguinte e suportar cadeias.
3. **Input multi-dispositivo:** rato, toque, teclado e prevenção de comportamentos de zoom no tabuleiro.
4. **Estado persistente:** recorde e som guardados em LocalStorage.
5. **Feedback visual:** desenho procedural das frutas, partículas, pontuação e estados de pausa/game over.

## Critérios de verificação

- A página arranca sem erros TypeScript ou JavaScript.
- O jogador consegue começar, lançar frutas e fundir pares.
- O recorde sobrevive ao refresh.
- Pausa interrompe a simulação e o jogo pode ser reiniciado.
- O layout adapta-se a ecrãs estreitos e o Canvas mantém proporção útil.
- A condição de perigo produz Game Over depois de ocupação prolongada no topo.
