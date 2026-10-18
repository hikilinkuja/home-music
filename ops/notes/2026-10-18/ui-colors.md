# Auditoria de UI e UX da sala liquid: ronda 2 (cores), proposta

2026-10-18. Base: secção 3 do relatório da ronda 0 (`ui-audit.md`). Amostras numa página gerada na pasta
temporária da sessão (enviada ao Paulo); os valores estão todos aqui.

**Implementado na v5.5 (2026-10-18): o Paulo aceitou todas as recomendações** (paleta, `--line` #3b3560,
«contested» no `--red`, dica do ecrã inteiro em `--dim`, madrugada em pergaminho). Resultado medido com
`ops/tools/ui_audit.js`: falhas AA de 16 para 4 textos no computador e de 13 para 1 no telemóvel; cores
calculadas visíveis de 54 para 33 e de 51 para 31. As que restam não são da paleta: «drop the needle»
pulsa até à opacidade 0,3, e o nome do bloco, «on air» e o BPM leem-se sobre o campo líquido (ronda 3 ou 4).

Correção à proposta: o «Kill the bass» aceso não falhava (3,65:1), porque a regra verde (`#dkBass.on`)
nunca se aplicava; a regra dos botões de tempo acesos (`#dkTimeBank .tbtn.on`) era mais específica e o
botão saía dourado (10,1:1). Corrigida a especificidade (`#dkTimeBank #dkBass.on`): o grave cortado sai
verde, como a regra pretendia, com texto creme (4,52:1). Anotado para a ronda 4: «Spin the dubplate» usa o
estilo geral dentro da consola.

## 1. O que se propõe

Hoje as fontes da interface têm 145 valores de cor literais (102 cores de base; 48 fora dos campos do
l04). Propõe-se que a interface use só 20 papéis, definidos em variáveis no `:root` do l01, e que a
consola Dub Desk mantenha o seu tema com 11 variáveis locais, declaradas como exceção. Todo o literal atual
tem destino (verificado por script: zero sem destino).

| Papel | Valor | Uso | Absorve |
|---|---|---|---|
| `--bg` | #000000 | fundo da página e do vídeo | |
| `--ink` | #060511 | fundo mais escuro; texto sobre os acentos | #04030c, #070617 |
| `--surface` | #0b0918 | campos, cartões, listas, áreas elevadas | #07061a, #0a0820, rgba(7,6,26,.7 e .85), rgba(13,11,28,.85) |
| `--panel` | rgba(6,5,17,.95) | painéis, gavetas, fichas, avisos | nove variantes de .92 a .98 |
| `--glass` | rgba(5,4,16,.8) | peças a flutuar sobre o campo (monitor, nome do campo, dica, cartão da obra, barra da sala de foco) | rgba(5,4,16,.78 e .86), rgba(6,5,17,.78 e .85) |
| `--chrome` | rgba(5,4,16,.6) | botões sobre o campo; anel do tempo | rgba(5,4,16,.35 e .55) |
| `--scrim` | rgba(3,2,10,.82) | fundo das janelas modais | |
| `--paper` | #f4ecd9 | texto principal e títulos | #e6dfcf (poema) |
| `--text` | #c9c4d8 | texto corrido | #c9c6d8, #d7d3e4, #d8d2e4 |
| `--dim` | #8d90b0 | texto secundário, legendas, marcadores dos campos | #7f82a3, #4a4d6a, pergaminho a .22, .28 e .62 |
| `--amber` | #ffb12b | acento principal | |
| `--teal` | #41d9c8 | ligações, acento secundário | |
| `--red` | #e8392c | no ar, regresso, erro, prova contestada | #ec8b7d |
| `--line` | #2b2745 (ver opção A) | linhas e bordas | #241d3c, pergaminho a .14 |
| `--amber-soft` | rgba(255,177,43,.06) | fundo tingido de âmbar | .05, .07, rgba(20,14,10,.8) |
| `--amber-edge` | rgba(255,177,43,.35) | borda e anel de âmbar | .25 |
| `--teal-soft` | rgba(65,217,200,.06) | realce tingido de teal | |
| `--teal-glow` | rgba(65,217,200,.15) | brilho de teal | .1, .12, .16, .2 |
| `--teal-edge` | rgba(65,217,200,.45) | borda de teal | .4, .5 |
| `--red-soft` | rgba(232,57,44,.3) | fundo tingido de vermelho | .22, .4 |

`--blk` (acento do bloco, que o motor muda) fica como está.

Consola Dub Desk (variáveis locais em `#desk` e `#dkCrate`, l08): `--dk-wood-deep` #0f0a05 (absorve
#0b0703), `--dk-wood` #160d06, `--dk-wood-lit` #241607 (absorve #221409), `--dk-edge` #3a2a14 (absorve
#2a1c0c e o tracejado dos botões), `--dk-dim` #9a865c (absorve #8a7750, #8f7a52, #6a5a3c), `--dk-text`
#cdbb92, `--dk-text-hi` #e7d9b8, `--dk-cream` #f6ead0 (absorve #f2e7cd), `--dk-gold` #e3b71f, `--dk-green`
#1c7a3a, `--dk-red` #b3271e.

## 2. Contraste

Papéis de texto sobre cada superfície (translúcidos sobre preto):

| | `--bg` | `--ink` | `--surface` | `--panel` | `--glass` |
|---|---|---|---|---|---|
| `--paper` | 17,85 | 17,20 | 16,73 | 17,23 | 17,42 |
| `--text` | 12,37 | 11,92 | 11,60 | 11,95 | 12,07 |
| `--dim` | 6,75 | 6,50 | 6,33 | 6,52 | 6,59 |
| `--amber` | 11,58 | 11,16 | 10,85 | 11,18 | 11,30 |
| `--teal` | 11,98 | 11,55 | 11,24 | 11,57 | 11,69 |
| `--red` | 5,05 | 4,87 | 4,74 | 4,88 | 4,93 |

Fusões que mudam o contraste de texto:

| Onde | Antes | Depois | |
|---|---|---|---|
| prova «contested» (sala de foco) | 8,26 | 4,88 | desce; continua acima de 4,5 (ver decisão 3) |
| legendas da sala de foco (#7f82a3) | 5,62 | 6,75 | sobe |
| texto do portão de respiração (#4a4d6a) | 2,56 | 6,75 | falha corrigida |
| dica «full screen · esc to leave» (pergaminho a .22) | 1,71 | 6,75 | falha corrigida, estado não visitado na ronda 0; fica mais visível no ecrã inteiro (decisão 4) |
| texto de leitura mais claro (#d7d3e4) | 13,84 | 11,95 | desce um pouco |
| marcadores dos campos (#757575, cor por omissão) | 4,27 | 6,33 | falha corrigida |
| consola: valores, teclas, crédito (#8a7750) | 4,05 | 4,98 | falha corrigida |
| consola: teclas (#6a5a3c) | 2,87 | 5,43 | falha corrigida |
| consola: «Kill the bass» aceso (texto escuro sobre verde) | 3,65 | 4,52 | falha corrigida, estado não visitado na ronda 0; texto creme |

As ligações do Session log (2,1) já foram corrigidas na v5.3.

## 3. O que se vê mudar

Quase nada à primeira vista, por construção: os papéis usam os valores mais frequentes. Mudam de forma
percetível: os campos de texto da sala de foco ficam ligeiramente mais claros (`--surface` sólido em vez
de tinta a .7 e .85); o cartão de cena escolhido passa de castanho escuro a âmbar muito tingido; os
textos secundários da sala de foco ficam um pouco mais claros; o texto de leitura mais claro fica um
pouco mais escuro; os marcadores dos campos deixam o cinzento do navegador; o vermelho dos hover e da
resposta errada da arcada iguala-se (.3).

## 4. Exceções (ficam literais, com a razão)

- campos do l04 (paletas desenhadas no canvas, 57 ocorrências): são arte, não interface;
- acentos dos blocos no motor (8, dados em JavaScript, iguais aos valores dos papéis);
- sombras, gradientes, vinhetas e o véu da gaveta: preto, branco ou tinta com transparência (19);
- anéis de profundidade da sala de foco (alfa calculado em JavaScript) e o realce do intervalo no canvas
  da sala de foco (`fillStyle`, igual a `--teal-soft`);
- o parâmetro de cor no endereço do leitor do SoundCloud (%23ffb12b, l02).

## 5. Decisões do Paulo

1. A paleta (secção 1) e a consola com variáveis locais. Recomendação: aceitar.
2. Opção A, a borda dos botões (`--line`): hoje #2b2745, 1,43:1 sobre o fundo; os botões da barra leem-se
   como texto solto. Não é falha das WCAG. Valores amostrados: #352f55 (1,63), #3b3560 (1,80), #443e6b
   (2,07). Recomendação: #3b3560, visível sem mudar o carácter da barra. Toca em todas as bordas e linhas.
3. Prova «contested»: juntar ao `--red` (4,88:1, um papel a menos) ou manter um vermelho claro só para
   texto (8,26:1, um papel a mais). Recomendação: juntar.
4. Dica do ecrã inteiro da sala de foco: hoje quase invisível de propósito (1,71:1). Recomendação: `--dim`,
   porque diz como sair do ecrã inteiro; a dica só aparece com o selo ligado.
5. Opção B, o acento da madrugada (06h às 08h): o chip usa o cinzento #8d90b0 e parece desligado.
   Alternativas: pergaminho (#f4ecd9) ou teal (já é o da tarde). Muda dados dos blocos no motor
   (`build-liquid.py`, secção 8). Recomendação: pergaminho.

## 6. Implementação, depois da escolha

- `:root` do l01 com os 20 papéis (e o `--line` escolhido); variáveis da consola no l08; regra
  `::placeholder{color:var(--dim)}`; cada literal substituído pelo seu papel no l01, l02, l07 e l08.
- Teste no `ops/tests/t-ui.js`: falha se aparecer uma cor literal nas fontes da interface fora do `:root`,
  das variáveis da consola e das exceções da secção 4; mede o contraste dos casos corrigidos na página.
- Capturas antes e depois com `ops/tools/ui_audit.js`; bateria completa antes de publicar.
