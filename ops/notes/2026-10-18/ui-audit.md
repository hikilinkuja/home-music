# Auditoria de UI e UX da sala liquid: ronda 0 (levantamento)

2026-10-18, sessão Claude Code na nuvem. Só leitura: nenhuma fonte da sala mudou. Prompt das rondas
em `ops/prompts/ui-audit.md`. UI: interface de utilizador; UX: experiência de utilizador; WCAG: Web
Content Accessibility Guidelines (diretrizes de acessibilidade do W3C, World Wide Web Consortium).

## Resumo

O problema dominante não é a cor nem o número de famílias de letra: é a escala tipográfica e a
arrumação do conteúdo no telemóvel. A página declara uma só família, mas desenha 20 tamanhos no
computador, metade do texto fica abaixo de 11 px, 59% está em maiúsculas espaçadas e há 21 valores de
espaçamento entre letras. A paleta de base tem contraste folgado (todas as cores de texto principais
passam 4,5:1 sobre o fundo); falham o nível AA 16 de 434 textos no computador e 13 de 318 no telemóvel,
quase todos em três sítios (Session log, Dub Desk, marcadores dos campos). Há dois defeitos visíveis
(Session log sem estilo; dica da ala da arte por cima da ficha no telemóvel), erros factuais dentro da
própria interface (painel The Sound), nove famílias de termos ambíguos além do «Gift a tune» e pouco
código morto: nenhuma regra de CSS aponta para um elemento inexistente, mas há 12 seletores
repetidos, seis blocos `@media` iguais no l01 e cinco funções do motor sem chamador.

## 1. Método e limites

Ferramentas novas, em `ops/tools/` (para repetir as medições antes e depois de cada ronda):

- `ui_audit.js`: percorre 25 estados da sala no Chromium, com o YouTube simulado dos testes, a 1440x900
  e a 390x844; em cada estado grava uma captura normal e outra sem texto (o fundo real por baixo de cada
  linha), mede o texto visível (tamanho, espaçamento, cor, opacidade, sobreposição), os controlos e as
  cores calculadas, e grava a cobertura de CSS e de JavaScript da visita inteira.
- `ui_report.py`: contraste de cada texto contra o fundo medido na captura (mediana e percentil 10),
  tipografia desenhada, cores, densidade por estado, alvos de toque, regras de CSS e funções sem uso
  (cobertura cruzada com as referências no código).
- `ui_static.py`: inventário das fontes por ficheiro e linha (cores literais, tamanhos, espaçamentos,
  seletores repetidos, `@media` repetidos, `!important`, estilos embutidos).

Estados percorridos: abertura antes do toque, abertura com a faixa inicial, emissão, descrição aberta
(computador), dica do ecrã fechado (telemóvel), painéis The Sound, The Dance Nearby, Gift a Tune e
Session Log, gaveta Mixtapes, Earn the skip, troca de campo, ala da arte (esta semana, ficha, quadro do
dia), arcada (Drop the Needle parado e a jogar, Dub Desk), sala de foco (entrada da primeira visita,
sessão, zona «why?», gaveta em três alturas, intervalo) e regresso à emissão.

Limites, por ordem de peso:

- Letra: o contentor não tem «Courier New»; o Chromium usou a Liberation Mono, com as mesmas métricas e
  traço mais grosso. Tamanhos, espaçamentos e posições medidos valem; o aspeto real, num Mac, num iPhone
  ou no Windows, é mais fino e mais pálido do que nas capturas. Em Android e Linux a página também não
  terá Courier New, porque não carrega letra própria: cada sistema escolhe a sua mono.
- O contraste sobre o campo líquido muda com o campo e com o instante; foi medido uma vez por estado.
- As WCAG 2 ignoram a espessura do traço: um texto de 9 px numa mono fina pode passar 4,5:1 e ler-se mal.
- Não foram visitados: hover e foco do teclado, portão de respiração, lista de pensamentos estacionados,
  resultado da experiência, ecrã inteiro da sala de foco, telemóvel deitado, painel `?dev`, avisos
  (toast), botão da agulha, linhas da abertura (ainda não tinham aparecido aos 3,5 s).
- Monitor preto (YouTube simulado) e caixas pretas nas Mixtapes (SoundCloud sem rede): não avaliados.
- A deteção automática de sobreposição usa o centro de cada linha e não apanhou a dica da ala da arte
  sobre a ficha; esse achado vem da captura.

## 2. Tipografia

| Tamanho desenhado (px) | 8 | 8,5 | 9 | 9,5 | 10 | 10,5 | 11 | 11,5 | 12 | 12,5 | 13 | 14 a 19 | 34 a 95 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Computador (434 textos) | 1 | 6 | 100 | 20 | 81 | 4 | 90 | 6 | 57 | 11 | 25 | 29 | 5 |
| Telemóvel (318 textos) | 1 | 5 | 53 | 9 | 94 | 4 | 56 | 3 | 44 | 11 | 15 | 19 | 4 |

- Abaixo de 11 px: 212 textos no computador (49%), 166 no telemóvel (52%); até 9,5 px: 127 (29%) e 68 (21%).
- Declarados nas fontes: 184 tamanhos com 23 valores distintos (de 8 px a 34 px, mais três `clamp` e dois
  relativos); 141 espaçamentos com 21 valores (de 0,02em a 0,5em); pesos só 400 e 500, mais o negrito
  por omissão de `h2`, `h3` e `b`.
- Maiúsculas: 257 de 434 textos (59%) no computador, 207 de 318 (65%) no telemóvel.
- Onde está a letra mais pequena: os botões da barra de cima no computador (`.tbtn`, 9 px, maiúsculas,
  0,2em; `l01-head.html:39`), «Live feed» (8 px, l01:75), «on air» e o nome do bloco (9 px), o chip do
  género (9 px), «fresh in the crates» (8,5 px), as ligações do cartão (9,5 px), os subtítulos dos
  painéis (10 px), os «why?» e os chips da sala de foco (10 px), a Dub Desk (8,5 a 9 px).
- Interpretação: a hierarquia faz-se sobretudo por cor, espaçamento e maiúsculas, e pouco por tamanho;
  os degraus de meio píxel (9 e 9,5; 10 e 10,5; 11 e 11,5; 12 e 12,5) não se leem como hierarquia e só
  somam irregularidade. A sala de foco tem a sua própria escala (botões de 11 px e 44 px de altura;
  l07:22), a rádio outra (9 px e cerca de 26 px).
- Família: «Courier New», ui-monospace, Menlo, monospace (l01:11), sem letra carregada. A escolha entre
  manter a do sistema ou carregar uma mono própria fica para a ronda 3 (há um laboratório antigo,
  `labs/type.html`, com sete letras de títulos).

## 3. Cor

Variáveis em `:root` (l01:8-11): `--ink` #060511, `--paper` #f4ecd9, `--amber` #ffb12b, `--teal` #41d9c8,
`--red` #e8392c, `--dim` #8d90b0, `--line` #2b2745 e `--blk`, o acento do bloco, que o motor muda
(l05:1283) entre âmbar, teal, vermelho e, na madrugada (dawn), o cinzento #8d90b0. Interpretação: um
acento cinzento faz o chip do género parecer desligado entre as 06h e as 08h.

Cores literais nas fontes: 249 ocorrências, 145 valores, 102 cores de base sem contar a transparência
(l01 45 valores, l04 54, l05 4, l07 26, l08 27). As do l04 são as paletas dos campos no canvas e devem
ficar como exceção declarada. Fora do l04 há 48 cores de base, que se agrupam por proximidade
(distância CIE76 abaixo de 6):

| Grupo | Cores (ocorrências) | Papel provável |
|---|---|---|
| quase pretos | #000000 (29), #03020a, #04030c, #050410 (7), #060511 (10), #0b0703, #0f0a05, #140e0a | fundo |
| azuis-noite | #080612, #070616, #070617, #07061a (7), #080714 (4), #0b0918 (3), #0d0b1c | superfície de painel e campo |
| cinzentos claros de texto | #c9c4d8 (5), #c9c6d8 (6), #d7d3e4 (6), #d8d2e4 | texto corrido |
| cinzentos apagados | #8d90b0 (`--dim`), #7f82a3 (8, só na sala de foco) | texto secundário |
| pergaminho | #f4ecd9 (`--paper`), #e6dfcf (poema), #f4f1e7 (barra das Mixtapes) | texto forte |
| linha | #2b2745 (`--line`), #241d3c | bordas |
| Dub Desk | #221409, #241607, #2a1c0c, #3a2a14, #160d06, #8a7750, #8f7a52, #6a5a3c, #cdbb92, #e7d9b8, #f2e7cd, #f6ead0, #e3b71f, #1c7a3a, #b3271e | tema próprio da consola (exceção a decidir) |
| isoladas | #4a4d6a (respiração), #0a0820 (máscara da arcada), #ec8b7d (prova «contested», l07:235), #ffffff (brilho dos botões da Dub Desk) | casos a rever |

Cores calculadas visíveis nos estados percorridos: 54 no computador, 51 no telemóvel.

Contraste da paleta de base (calculado): `--paper` sobre `--ink` 17,2:1; `--teal` 11,6; `--amber` 11,2;
`--dim` 6,5; `--red` 4,87; `--ink` sobre os acentos dos chips: âmbar 11,2, teal 11,6, vermelho 4,87,
cinzento da madrugada 6,5. A borda `--line` sobre `--ink` tem 1,43:1: os botões da barra quase não têm
contorno visível sobre o campo. Como o rótulo identifica o botão, isto não falha o critério 1.4.11, mas
explica porque a barra se lê como texto solto (interpretação).

Falhas medidas sobre o fundo real (limiar 4,5:1 para texto normal):

| Contraste | Onde | Causa |
|---|---|---|
| 2,1 | ligações do Session log | azul por omissão do navegador, sem estilo (secção 4.5) |
| 2,0 no mínimo | «tap to drop the needle» (abertura) | pulsa entre opacidade 0,3 e 1 |
| 2,6 (calculado) | texto do portão de respiração, #4a4d6a (l07:18) | estado não visitado |
| 2,9 | teclas da Dub Desk, #6a5a3c (l08:70) | cor da consola |
| 3,9 a 4,1 | «on air» e nome do bloco sobre o campo (9 px, `--dim`) | depende do campo |
| 4,1 a 4,5 | subtítulo, valores dos botões e crédito da Dub Desk (#8a7750) | cor da consola |
| 4,27 a 4,37 | marcadores dos campos (cidade, nome, faixa, intenção, nota) | cinzento por omissão do navegador (#757575), nunca definido |

## 4. Conteúdo e densidade

| Estado | Controlos | Textos | Palavras | Tamanhos | Cores de texto |
|---|---|---|---|---|---|
| emissão (computador / telemóvel) | 16 / 13 | 26 / 20 | 62 / 39 | 8 / 7 | 6 / 5 |
| The Sound | 26 / 15 | 48 / 26 | 352 / 192 | 11 / 9 | 7 / 6 |
| Gift a Tune | 21 / 17 | 37 / 25 | 181 / 144 | 11 / 7 | 8 / 6 |
| Dub Desk | 30 / 14 | 59 / 32 | 174 / 74 | 11 / 8 | 13 / 9 |
| sala de foco, entrada | 19 / 19 | 54 / 38 | 138 / 92 | 7 / 5 | 8 / 8 |
| sala de foco, zona «why?» | 16 / 1 | 87 / 24 | 1007 / 221 | 7 / 7 | 7 / 7 |

4.1 Emissão no computador: a navegação está repartida entre os sete botões da barra de cima e três
painéis da estação metidos no cartão da faixa (The dance nearby, The sound, Session log), ao lado das
ligações da própria faixa (YouTube, Spotify, Liner source). Interpretação: o cartão mistura «esta faixa»
com «a estação».

4.2 Emissão no telemóvel: a fita de botões mostra 3 dos 7 (Mixtapes, Gift a tune, Background); Art,
Focus, Arcade e Immerse ficam à direita, fora do ecrã, sem nenhum sinal de que a fita continua (a barra
de deslocamento está escondida, l01:159-161). O cartão empilha seis botões de 38 px, cerca de 270 px de
altura ao lado do monitor. A descrição da faixa está escondida (`#tBlurb{display:none}`, l01:173): os
textos com fonte de cada faixa (regra de 2026-10-18) nunca aparecem num telemóvel.

4.3 Painel The Sound: as ligações para a Wikipédia e para o Ishkur aparecem duas vezes cada (no topo e
em «Go deeper»); a grelha de duas colunas põe o título «Key records» numa coluna e a lista na outra,
deixando metade vazia; o parágrafo final, de cerca de 110 palavras, fala da estação e não do género, e
tem factos errados: descreve três programas («morning 06-13, afternoon 13-20, night 20-06»), quando a
grelha tem sete sub-blocos; diz «[→] next», mas a seta abre o Earn the skip (l05:1854); remete para «the
station's front door» sem ligação (l02:126). A contagem «N records from this sound in tonight's crate»
conta o catálogo inteiro, a qualquer hora (l05:1356). No computador, o painel tapa o monitor.

4.4 Gift a Tune: 181 palavras para uma ação (parágrafo de entrada e nota sobre o GitHub).

4.5 Session log (defeito): o motor gera `.h-time`, `.h-art`, `.h-tit` e `.h-links` (l05:1410-1426), mas o
l01 só tem estilo para `.h-time` e uma regra órfã, `#histList li b` (l01:135); as ligações saem coladas
(«YOUTUBESPOTIFY»), sublinhadas e no azul por omissão.

4.6 Ala da arte no telemóvel (defeito): com a ficha aberta, a dica «turn the phone sideways... pinch to
zoom» (`#waHint`, z-index 4, l01:337) fica por cima da ficha (`#wartFicha`, z-index 3, l01:360) e tapa o
nome do artista (captura `mobile/13-art-sheet`).

4.7 Arcada: o subtítulo explica a mecânica numa linha de 16 palavras em maiúsculas de 9 px; a Dub Desk
junta 59 textos e 13 cores de texto num ecrã.

4.8 Sala de foco: a entrada tem 6 ligações «why?», 54 textos e 19 controlos; a gaveta tem 8 secções e
369 palavras (três ecrãs); a lista de teclas aparece na barra da sessão e outra vez na gaveta. A zona
«why?» tem 1007 palavras num ecrã, aceitável numa zona de consulta separada.

4.9 Alvos de toque no telemóvel: os botões de fechar (×) dos painéis, da gaveta Mixtapes, do Earn the
skip, da ficha e da arcada medem 22x20 px, abaixo dos 24 px do critério 2.5.8 (AA); a exceção por
espaçamento livre provavelmente os salva, mas ficam pequenos. As ligações dos painéis têm 11 a 14 px
de altura (inline, admitidas pela exceção do critério).

## 5. Termos

| Termo | Onde | O que faz de facto | Problema |
|---|---|---|---|
| Gift a tune, «recommend music to the house», «Hand it over (GitHub)», «Copy the note», «a present from you», «the founders» | l02:60, l02:142-154, l06:766-798, l05:1334 | abre um painel; o primeiro botão abre uma nota pré-preenchida no GitHub, o segundo copia a nota; se a faixa entrar, o cartão mostra «a present from NOME» (campo `rec`) | é uma sugestão sujeita a escuta e verificação, não um presente; cinco formulações para uma ação; «Hand it over» só diz que abre o GitHub entre parênteses |
| Immerse (rádio e ala da arte) e Full screen (sala de foco) | l02:21, l02:65, l07:444 | ecrã inteiro | dois nomes para a mesma função; os dois «Immerse» (`fsBtn`, `waFsBtn`) justificam-se, cada um no seu contexto |
| Background | l02:61; l07:599; l07:610 | na rádio, troca o campo visual (tecla v); na sala de foco, «Background sounds» são sons e o grupo «Background» são fundos visuais | três sentidos |
| Skip | l02:103 | abre o Earn the skip (oito toques dentro de 3 BPM); a seta faz o mesmo | o rótulo promete uma ação imediata; o painel The Sound chama-lhe «next» |
| The sound | l02:86, l02:115 | painel do género («about this genre») | na sala de foco «sound» é o perfil de som |
| Scene, What kind of work?, Work | l07:525, l07:458, l07:572 | o mesmo conceito (a cena por tarefa) | três nomes |
| the selector's pomodoro, the programme valve, the house noise desk, Calm set | l07:529, l07:586, l07:599 | subtítulos da gaveta | gíria da casa, opaca à primeira leitura (interpretação) |
| tap to drop the needle, touch to drop the needle | l02:8, l02:111 | a mesma ação | dois verbos |
| demonstration ficha, ceded film loop, room sheet | l02:43, l06:238, l02:36 e 42 | ficha de demonstração; filme cedido; ficha da obra | «ficha» é português no site em inglês; «ceded» quer dizer «cedido» no sentido de renunciado (território, direitos), provável decalque de «cedido» (emprestado); «room sheet» parece-me corrente nos museus britânicos, mas não o verifiquei nesta sessão |
| Crop / Fit | l02:104, l06:817 | alterna o corte das barras pretas; o rótulo mostra a ação seguinte | revisto na ronda 1: segue a convenção da casa (Mute / Unmute, Screen on / off); sem problema |
| Live feed | l02:92 | o vídeo do disco que toca | não é uma emissão ao vivo |
| tonight's crate | l05:1356 | catálogo inteiro do género | «tonight» a qualquer hora |

## 6. Código

CSS (l01, l07, l08): 666 regras. 169 não serviram na visita, todas de estados não visitados (hover,
foco, respiração, pensamentos, experiência, ecrã inteiro da sala de foco, telemóvel deitado, painel
`?dev`, avisos, linhas da abertura) ou de `@media` que a visita não ativou. Nenhuma tem um id ou uma
classe ausentes da marcação e do JavaScript. Órfã por estrutura: `#histList li b` (l01:135). Repetições
no mesmo contexto: `.vp-ctrl` (l01:100 e 431) e `#vol` (l01:102 e 432, a segunda anula a primeira);
`#waVid`, `#waPicWrap` e `#waVeil` (l01:309, depois cada um); `.t-links a` (l01:175 e 176); `#fcDial`
(l07:123 e 132); `#fcActs` (l07:152 e 274); `.fc-card .nm` (l07:338 e 373) e `.fc-card .gs` (l07:340 e
372, onde a segunda esconde o elemento e torna inútil o tamanho da primeira), as duas últimas no mesmo
bloco `@media`. Seis blocos `@media (max-width:760px)` separados no l01 (linhas 150, 333, 388, 426, 438,
496). `--blk` começa igual a `--amber`. Dois `!important` no l07 (deliberados, para o atributo
`hidden`). Estilos embutidos: 4 atributos (entre eles o `<b style="color:var(--amber)">` do Gift a
Tune, l02:146) e 8 atribuições em JavaScript.

JavaScript: 524 funções com nome; 257 nunca foram chamadas na visita, o que não prova nada (caminhos
não percorridos). Sem nenhuma referência além da declaração, em toda a página e nos testes:
`HMFX.oneDrop` (l05:154, herdada do e05:122), `HMFX.transitionFx` (l05:323, escrita pelo
build-liquid.py:620; os kits tocam pela tabela `GAPKIT`), `HM.skipIfBlocked` (l05:1914,
build-liquid.py:240), `HM.flushPeek` e `HM.reVol` (l05:1920 e 1921, build-liquid.py:150 e 151). São
motor: ronda 5, nível max, diff revisto.

Fora da sala: `radio/index.html` (187 KB, a cópia criada por engano, ainda servida pelo GitHub Pages),
`introlab.html` na raiz e oito páginas em `labs/`, todas públicas. Eliminados a 2026-10-18 por decisão do
Paulo, com o gerador `ops/tools/arcade_data.py` (só servia `labs/arcade.html`).

## 7. As dez constatações com maior ganho por custo

| # | Constatação | Ronda | Custo | Ganho |
|---|---|---|---|---|
| 1 | Session log sem estilo (defeito, 4.5) | correção | baixo | médio |
| 2 | Dica da ala da arte por cima da ficha no telemóvel (defeito, 4.6) | correção | baixo | médio |
| 3 | Factos errados e ligações duplicadas no painel The Sound (4.3) | 1 | baixo | médio |
| 4 | Família «Gift a tune» e os outros termos da secção 5 | 1 | baixo | alto |
| 5 | Descrição da faixa escondida no telemóvel (4.2) | 4 | baixo | alto |
| 6 | Art, Focus, Arcade e Immerse escondidos na fita do telemóvel (4.2) | 4 | médio | alto |
| 7 | Escala tipográfica: tamanho mínimo e cinco ou seis tamanhos; barra de cima a 9 px (2) | 3 | médio | alto |
| 8 | Paleta por papéis: fundir os quatro cinzentos de texto, os dois apagados e os fundos; dar cor aos marcadores; exceções declaradas para o l04 e a Dub Desk (3) | 2 | médio | médio |
| 9 | Cartão da faixa a misturar a faixa e a estação (4.1) | 4 | médio | médio |
| 10 | Gaveta da sala de foco: subtítulos em gíria, teclas repetidas, oito secções (4.8, 5) | 1 e 4 | baixo a médio | médio |

Para a ronda 5: as cinco funções do motor, as repetições e os seis blocos `@media` do l01, a regra órfã.

## 8. Decisões do Paulo antes da ronda 1

Respondidas a 2026-10-18: os dois defeitos corrigidos na sessão da ronda 1 (v5.3, teste
`ops/tests/t-ui.js`); `radio/index.html`, `introlab.html` e `labs/` eliminados.

- Os dois defeitos (1 e 2) podem entrar já na sessão da ronda 1, como correções com teste, ou esperar pela
  ronda 4. Recomendação: já, porque são pequenos e não dependem de nenhuma escolha de desenho.
- Termos: a ronda 1 traz a tabela de alternativas; a escolha é do Paulo.
- O que fazer a `radio/index.html`, `introlab.html` e `labs/` (apagar, manter, tirar da publicação).

## 9. Como repetir

```
node ops/tools/ui_audit.js PASTA            # capturas e medições (cerca de 2,5 min)
python3 ops/tools/ui_report.py PASTA        # contraste, tipografia, densidade, CSS e JS sem uso
python3 ops/tools/ui_static.py PASTA        # inventário das fontes
```

PASTA fora do repositório (por exemplo, a pasta temporária da sessão).
