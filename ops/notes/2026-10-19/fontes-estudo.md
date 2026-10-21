# Estudo de letras (ronda 3b da auditoria de UI), 2026-10-19

**Implementado na v5.9 (2026-10-21): a 6, Recursive**, servida pelo site (`liquid/fonts/`), com a regra do estudo
(rótulos e maiúsculas monoespaçados, frases casuais) escrita em CSS e verificada no `t-ui.js` (nenhum desvio nos
estados abertos, a 390, 1440 e 2560 px), e a escala fluida (+15% aos 2560 px).

Pedido do Paulo: no monitor grande, o texto corrido em Courier New lê-se mal (painel Suggest a tune, cartões das
cenas, zona «why?», gaveta de ajustes); o cartão da faixa, em contrapartida, «brilha». Leitura: a Courier New serve
como letra de exibição (curta, grande, negrito, maiúsculas) e falha como letra de texto (traço fino, monoespaçada,
itálico pequeno quase ilegível). Solução habitual: um par, uma letra com carácter para rótulos e títulos e outra
legível para o texto corrido.

Candidatos (todos de licença livre, OFL, no Google Fonts):
1. Courier Prime (tudo): a Courier redesenhada para leitura, traço mais grosso, itálico verdadeiro.
2. IBM Plex Mono + IBM Plex Sans: família coerente, muito legível.
3. Space Mono + Space Grotesk: retro-futurista.
4. Courier Prime + Literata: serifa de leitura longa em ecrã (tom de notas de capa).
5. Atkinson Hyperlegible Mono + Atkinson Hyperlegible Next: desenhadas para legibilidade máxima.
6. Recursive: uma letra variável, monoespaçada nos rótulos e casual no texto.

Método (`fontes-estudo.js`, nesta pasta): na página real, a 1920x1080, a letra de rótulos substitui a Courier New
(`--mono`) e a letra de texto aplica-se às frases em minúsculas de 12 px ou mais e aos campos de texto; cinco
contextos fotografados (Suggest a tune, cenas, cartão, zona «why?», gaveta). Referência «atual»: as capturas do
próprio Paulo (a nuvem não tem Courier New e desenharia com uma substituta mais grossa). As folhas de comparação
foram enviadas ao Paulo e não ficam no repositório.

Limites: os tamanhos são os da v5.6 (fixos); o crescimento com o ecrã em monitores grandes (por exemplo, texto de
leitura de 13 para 15 px entre 1440 e 2560 px) aplica-se depois de escolhida a letra. Faixas diferentes em cada
captura do cartão (a rotação muda), o que não afeta a comparação das letras.

Implementação depois da escolha: ficheiros de letra servidos pelo próprio site (woff2, com a licença OFL), duas
variáveis (`--font-label`, `--font-text`), regra de quem leva cada uma, escala fluida, teste no `t-ui.js`.
