# Registo das voltas

## 2026-10-21: v5.9, letra Recursive (sessão Claude Code na nuvem)

- O Paulo confirmou que a v5.8 funciona e pediu a letra escolhida (Recursive) e, a seguir, a ronda 5.
- Letra servida pelo site (`liquid/fonts/`: subconjuntos latino e latino alargado com todos os eixos, do pacote npm
  `@fontsource-variable/recursive` 5.3.0, e a licença OFL); `@font-face` no l01; `--font-label` e `--fv-label`
  (monoespaçada linear) em todas as regras com maiúsculas ou 10 px (80 regras, por script), no cartão da faixa, nos
  relógios, no alvo do Earn a skip e no Begin; `--font-text` e `--fv-text` (casual) no corpo e nos campos de texto.
  Medido nos estados abertos (sala, sugestão, sala de foco, «why?», gaveta, arcada) a 390, 1440 e 2560 px: nenhum
  texto com a variação errada; o subconjunto alargado não chega a ser pedido.
- Escala fluida: os cinco tamanhos iguais até 1440 px e 15% maiores aos 2560 px (10/12/13/14/16 para
  11,5/13,8/15/16,1/18,4).
- Testes: `t-ui.js` com seis verificações novas (54); `validate.py` verifica os ficheiros da letra. Bateria completa:
  art 40, gate 7, rain 5, focus 121, devlog 10, intro 20, ritual 14, ads 71, ui 54, side 20, realyt 12, todos a passar.
- Em fila: ronda 5 (limpeza de código), ronda 4.

## 2026-10-21: v5.8, abertura servida pelo próprio site e primeiro disco já não calado (sessão Claude Code na nuvem)

- Queixas do Paulo: a abertura voltou a falhar («countless times this happened»); «music stops after playing for
  1 second. when click mute it restarts for a second and then stops again».
- Abertura: a faixa vinha em streaming do archive.org, que caiu várias vezes entre agosto e outubro (registos
  públicos) e, a 2026-10-21, não respondeu ao GitHub Actions das 15h49 às 15h52 UTC. Correção: a abertura e a agulha
  tocam as cópias do site (`sfx/intro-sound-killah.mp3`, `sfx/vinyl-625771.mp3`), pedidas ao carregar, com o
  archive.org e o freesound de reserva antes e depois do toque; registo da fonte em `hm_intro_log` (`si`, `fb`) e no
  separador Engine do `?dev`. Os ficheiros vieram pelo fluxo novo `.github/workflows/intro-media.yml`
  (`ops/tools/fetch_intro_media.py`, MD5 conferido com os metadados do Internet Archive): o vinil às 15h53, a faixa
  às 17h29, quando o archive.org voltou. `sfx/LICENSES.md` atualizado (CC BY-NC-ND 4.0 permite a cópia inteira e sem
  alteração, com crédito; o vinil é CC0). `validate.py` falha se faltarem.
- Primeiro disco calado (motor, secção 15 do `build-liquid.py`, diff revisto): li o código da API do YouTube e medi o
  leitor verdadeiro (`ops/notes/2026-10-21/`): as leituras são cópias que só mudam com a mensagem seguinte do leitor
  e o `unMute` com o volume a 0 põe-no em 5. A rampa do primeiro disco ficava à espera para sempre e o disco a volume
  0; cada «Unmute» dava uns segundos do volume 5 do YouTube até o guarda do som repor o 0. O defeito vem do portão do
  som da v5.1 (a v5.0 não o tem; a v5.7 só trocou três segundos baixinhos por silêncio). 15b: depois de um `seekTo` ou
  `playVideo` nosso, o portão espera 250 ms. Sala de foco: o leitor repõe o volume depois do `unMute`.
- Testes: YouTube simulado assíncrono, como o verdadeiro (`ytAsync`; `HM_YT_ASYNC=1` liga-o em toda a bateria); teste
  novo `t-realyt.js` (12 verificações; na v5.7 publicada passam 5); `t-intro.js` alargado (20, com os dois ficheiros
  verdadeiros de `sfx/`); o simulador de áudio passou a responder a pedidos parciais (sem eles a agulha nunca saltava
  para os 13 s nos testes). Bateria oficial: art 40, gate 7, rain 5, focus 121, devlog 10, intro 18 (20 depois de
  chegar a faixa), ritual 14, ads 71, ui 47, side 20, realyt 12, todos a passar; a mesma bateria com o YouTube
  assíncrono também passa toda (antes da 15b, o `t-ads` assíncrono falhava 5 verificações, como na v5.7).
- Servido confirmado: a liquid servida tem as fontes da abertura em lista (`P_SRCS`), o `gateSoon` e a rampa com
  `opened`; o GitHub Pages serve as duas gravações com pedidos parciais (206; 8 793 667 e 1 626 336 bytes).
- Em fila: confirmar a ouvir no computador e no telemóvel; Recursive; ronda 5; ronda 4.

## 2026-10-19: escolha da letra e passagem para o computador (sessão Claude Code na nuvem)

- Estudo de letras enviado ao Paulo (cinco folhas, seis pares contra as capturas dele). Escolha: 6, Recursive
  (monoespaçada nos rótulos, casual no texto corrido). Por implementar; plano no `ops/HANDOFF.md`.
- O Paulo pediu para continuar no computador (limite de uso na nuvem) e, a seguir, a ronda 5. Nada ficou por enviar:
  tudo está em `main`.

## 2026-10-19: v5.7, rádio calada de lado (sessão Claude Code na nuvem)

- Queixa do Paulo, com captura: na sala de foco («Read», lo-fi beats a tocar), a música da rádio ouvia-se por trás,
  baixa mas audível, perto do fim da primeira faixa da sala.
- Diagnóstico: com a rádio de lado o volume é 0 (fator `HMSIDE.f`), mas o motor não pedia mudo. Se o YouTube repõe
  um volume seu (depois de um anúncio a meio do disco) ou tira o mudo sozinho, o portão do som saía sem corrigir
  («se tem som, não faço nada») e a rádio ficava audível até ao fim do disco. O YouTube simulado não repunha volume
  e por isso os testes não o apanhavam; o YouTube real não toca vídeos na nuvem, e não pude confirmar qual dos dois
  comportamentos é o dele: a correção cobre os dois.
- Reproduzido no YouTube simulado com `restore` e `_restoreNow` (lib/common.js): no motor publicado, 19,6 s e 16,7 s
  de rádio audível em 75 s; no corrigido, 0 s e 0,17 s (vigia de 500 ms).
- Motor (`build-liquid.py`, secção 14, diff revisto): de lado, os pratos ficam mudos (portão, fim do esbatido,
  vigia de 500 ms); ao voltar, o portão abre o prato do ar no início do esbatido; com som, o portão reaplica sempre
  o volume. O único `unMute` continua no portão.
- Teste novo `ops/tests/t-side.js` (4 variantes, 20 verificações).
- Testes: bateria completa a passar (art 40, gate 7, rain 5, focus 121, devlog 10, intro 5, ritual 14,
  ads 71, ui 47, side 20); `build.sh` com validação OK.
- Servido confirmado: a liquid servida tem a secção 14 (pratos mudos de lado e vigia de 500 ms).

## 2026-10-19: v5.6, auditoria de UI, ronda 3 (tipografia) (sessão Claude Code na nuvem)

- Escolha do Paulo: todas as recomendações de `ops/notes/2026-10-18/ui-type.md`.
- `ops/notes/2026-10-18/ui-typescale.py` aplicado às fontes (l01, l07, l08): 178 tamanhos e 140 espaçamentos
  passam às variáveis da escala; 20 regras de frases deixam as maiúsculas; 7 tamanhos de exibição ficam. O diff
  é o mesmo do ensaio da proposta, por isso as medições da proposta valem: tamanhos desenhados de 20 para 10
  (computador), mínimo de 8 para 10 px, frases abaixo de 12 px de 91 para 4 rótulos, maiúsculas longas de 22
  para 3 exceções.
- Motor intacto.
- Teste `t-ui.js` alargado (46 verificações): tamanhos e espaçamentos só pelas variáveis; mínimos e
  maiúsculas verificados na emissão, nos painéis, nas Mixtapes, no Earn a skip e na sala de foco; falha 3
  verificações contra a versão anterior.
- Defeito anterior encontrado pela bateria (hoje é segunda-feira): na porta da sala de foco, a 390x844, a linha
  de recomeço da semana somada à pergunta da primeira visita empurrava «or adjust the details first» para fora
  do ecrã; a v5.5 publicada também falhava. Corrigido no telemóvel (espaços mais curtos, nomes das cenas a 12 px,
  que o script tinha passado a 14 px); o `t-ui.js` passa a forçar a linha de recomeço, para o apanhar em qualquer
  dia.
- Testes: bateria completa a passar (art 40, gate 7, rain 5, focus 121, devlog 10, intro 5, ritual 14,
  ads 71, ui 46), depois `ui` com a verificação da porta (47, falha na v5.5); `build.sh` com validação OK.
- Servido confirmado: a liquid servida tem as variáveis da escala e a correção da porta da sala de foco.

## 2026-10-18: auditoria de UI, ronda 3 (tipografia), proposta (sessão Claude Code na nuvem)

- Proposta em `ops/notes/2026-10-18/ui-type.md`: cinco tamanhos (10, 12, 13, 14, 16 px) e dois espaçamentos
  (0,12em e 0,2em) em variáveis; maiúsculas só em rótulos, botões e títulos curtos; mínimo de 10 px em
  maiúsculas e 12 px em frases; família mantida.
- Aplicada numa cópia de trabalho e medida no mesmo bloco: tamanhos de 20 para 10 (computador), mínimo de 8 para
  10 px, frases abaixo de 12 px de 91 para 4 (rótulos), maiúsculas longas de 22 para 3 (exceções); `t-ui` e
  `t-focus` passaram. Fontes repostas; nada publicado na sala.
- Correção durante o ensaio: com 0,14em os botões do cartão partiam em duas filas; 0,12em mantém a largura atual.
- `ops/tools/ui_audit.js`: terceiro argumento opcional `?block=` (comparar antes e depois no mesmo bloco).

## 2026-10-18: v5.5, auditoria de UI, ronda 2 (cores) (sessão Claude Code na nuvem)

- Escolha do Paulo: todas as recomendações de `ops/notes/2026-10-18/ui-colors.md`.
- Paleta de 20 papéis em variáveis no `:root` do l01; 144 literais substituídos por script, só dentro dos
  blocos `<style>` (l01 48, l07 42, l08 54); consola Dub Desk com variáveis locais; marcadores dos campos em
  `--dim`; `--line` #3b3560; prova «contested» no `--red`; dica do ecrã inteiro em `--dim`.
- Motor: um valor de dados, o acento da madrugada (#8d90b0 para #f4ecd9), no `build-liquid.py`; diff revisto.
- Medido antes e depois (`ops/tools/ui_audit.js`): falhas AA de 16 para 4 (computador) e de 13 para 1
  (telemóvel); cores visíveis de 54 para 33 e de 51 para 31. Restam texto sobre o campo líquido e o pulsar
  de «drop the needle» (rondas 3 e 4).
- Correção minha: o «Kill the bass» aceso não falhava o contraste (a regra verde perdia por especificidade e
  o botão saía dourado); a regra passou a ganhar e o botão sai verde, com texto creme.
- Teste `t-ui.js` alargado (43 verificações); confirmado que falha 7 contra a versão anterior.
- Testes: bateria completa a passar (art 40, gate 7, rain 5, focus 121, devlog 10, intro 5, ritual 14,
  ads 71, ui 43); `build.sh` com validação OK.
- Servido confirmado: a liquid servida tem a paleta nova (`--line` #3b3560), a regra verde da consola e o acento
  da madrugada em pergaminho.

## 2026-10-18: auditoria de UI, ronda 2 (cores), proposta (sessão Claude Code na nuvem)

- Proposta em `ops/notes/2026-10-18/ui-colors.md`: 145 valores literais de cor passam a 20 papéis em
  variáveis (interface) e 11 variáveis locais (consola Dub Desk); todo o literal tem destino (verificado por
  script). Corrige seis falhas de contraste, duas delas em estados que a ronda 0 não visitou (dica do ecrã
  inteiro da sala de foco, 1,71:1; «Kill the bass» aceso, 3,65:1). Página de amostras enviada ao Paulo.
- Nada implementado; cinco decisões pedidas (paleta, borda dos botões, prova «contested», dica do ecrã
  inteiro, acento da madrugada).

## 2026-10-18: v5.4, auditoria de UI, ronda 1 (termos) (sessão Claude Code na nuvem)

- Escolha do Paulo: todas as recomendações de `ops/notes/2026-10-18/ui-terms.md`.
- Termos novos: Suggest a tune (painel, botões, nota enviada ao GitHub, crédito «suggested by»), Full
  screen (rádio, ala da arte; alterna com «Exit full screen»), Visuals, Room sounds, Screen background
  (leitores de ecrã), Earn a skip (no telemóvel «Skip…»), The genre, Kind of work, subtítulos da gaveta da
  sala de foco (focus and break lengths, which genres play, mixed under the music), Calm genres only,
  drop the needle, Guess the Genre, demonstration sheet, film loop on loan, about the work, Video, Keep
  screen on e Let screen sleep (também na dica do ecrã fechado).
- Painel The Genre: créditos com os sete blocos, «Liner notes draw mainly on Discogs and Wikipedia»,
  atalhos certos (seta, m, f, v, w); contagem «records of this genre in the station's crates»; com o painel
  estendido, as ligações do topo escondem-se (CSS `:has`).
- Motor: três literais de texto no `build-liquid.py` (secção 13 nova e o crédito da secção 5), sem lógica;
  diff revisto.
- Medido ao implementar: «Earn a skip» com «Keep screen on» punha os botões do monitor do telemóvel em
  três filas (de 103 para 151 px); daí «Skip…» só no telemóvel, como a recomendação previa. A barra de cima a
  1024 px já tinha duas filas antes (fica para a ronda 4).
- Correção minha: na proposta escrevi que nenhum texto citava o AllMusic; oito textos antigos do catálogo
  citam-no. Os créditos dizem por isso «draw mainly on» e não «come from».
- Teste `ops/tests/t-ui.js` alargado (34 verificações).
- Testes: bateria completa a passar (art 40, gate 7, rain 5, focus 121, devlog 10, intro 5, ritual 14,
  ads 71, ui 34); `build.sh` com validação OK.
- Servido confirmado: a liquid servida tem «Suggest a tune» e a contagem nova do painel The Genre.

## 2026-10-18: v5.3, auditoria de UI, correções da ronda 0 e proposta da ronda 1 (sessão Claude Code na nuvem)

- Decisões do Paulo sobre a ronda 0: corrigir já os dois defeitos; eliminar `radio/index.html`,
  `introlab.html` e `labs/`.
- Session log: o motor escreve `.h-art`, `.h-tit` e `.h-links`, que na liquid não tinham estilo; agora
  artista em pergaminho, título em âmbar, ligações em teal sem sublinhado e separadas. Saiu a regra órfã
  `#histList li b` (l01).
- Ala da arte no telemóvel: a ficha passou para cima da dica (z-index 5 contra 4); o nome do artista
  deixou de ficar tapado.
- Teste novo `ops/tests/t-ui.js` (16 verificações): falha 10 antes da correção, passa 16 depois.
- Eliminados `radio/index.html`, `introlab.html`, as oito páginas de `labs/` e `ops/tools/arcade_data.py`
  (gerava só os dados de `labs/arcade.html`); `build.sh` e `validate.py` deixaram de os referir; a linha
  do `CLAUDE.md` sobre a cópia antiga saiu.
- Ronda 1: proposta em `ops/notes/2026-10-18/ui-terms.md` (15 termos com alternativas e comprimentos,
  correções factuais do painel The Sound, texto do «Suggest a tune»). Nada implementado até à escolha.
- Testes: bateria completa a passar (art 40, gate 7, rain 5, focus 121, devlog 10, intro 5, ritual 14,
  ads 71, ui 16); `build.sh` com validação OK.
- Servido confirmado: a liquid servida tem o estilo novo do Session log; `radio/index.html` e `labs/` devolvem 404.

## 2026-10-18: auditoria de UI e UX da liquid, ronda 0 (sessão Claude Code na nuvem)

- Pedido do Paulo: auditoria por rondas (letra, cor, conteúdo, termos, limpeza de código); prompt
  reescrito e guardado em `ops/prompts/ui-audit.md`. Esta volta fez só a ronda 0 (levantamento): nenhuma
  fonte da sala mudou, o site servido fica igual.
- Ferramentas novas: `ops/tools/ui_audit.js` (25 estados a 1440x900 e 390x844 no Chromium com o YouTube
  simulado; capturas com e sem texto; cobertura de CSS e JavaScript), `ui_report.py` (contraste sobre o
  fundo real, tipografia, densidade, alvos de toque, código sem uso) e `ui_static.py` (inventário das
  fontes). Relatório: `ops/notes/2026-10-18/ui-audit.md`.
- Principais números: 20 tamanhos de letra desenhados no computador, metade do texto abaixo de 11 px,
  59% em maiúsculas, 21 espaçamentos declarados; 48 cores de base fora dos campos do l04; contraste AA
  falha em 16 de 434 textos (computador) e 13 de 318 (telemóvel); nenhuma regra de CSS aponta para um
  elemento inexistente; 12 seletores repetidos; 5 funções do motor sem chamador.
- Defeitos encontrados (não corrigidos, à espera do Paulo): Session log sem estilo (ligações coladas no
  azul por omissão); no telemóvel, a dica da ala da arte tapa o nome do artista na ficha. Factos errados
  no painel The Sound (três programas em vez de sete sub-blocos, «[→] next», «tonight's crate»).
- Limite: o contentor não tem Courier New (o Chromium usou a Liberation Mono, de métricas iguais e traço
  mais grosso), por isso as capturas parecem mais legíveis do que o site num Mac ou num iPhone.
- Testes da sala não corridos (nada na sala mudou); `build.sh` com validação OK.

## 2026-10-18: v5.2, sala de foco, ronda 2b (sessão local do Claude Code)

- Pedido: registo de totais, experiência pessoal, campo para despejar distrações e intenção «se...
  então», com as quatro escolhas do Paulo (período de um bloco, ordem ABBA com a primeira letra
  sorteada, nota só na experiência, só blocos completos nos totais). Mudaram `liquid/l07-focus.html`,
  `liquid/focus-evidence.json` e `ops/tests/t-focus.js`; motor, catálogo e sala antiga intactos. A
  versão é a v5.2 porque a v5.1 já tinha saído (anúncios do YouTube).
- Registo `hm_focus_log` (versão 1, até 2000 blocos, só no browser): cada bloco que chega ao intervalo;
  o «+5 min of work» do intervalo soma ao mesmo bloco. Totais de hoje e da semana no topo da porta, a
  semana em barras na gaveta, sem sequências; esconder, exportar (CSV e JSON) e apagar na gaveta.
  Aviso suave no intervalo passadas 4 horas num dia, dispensável por um dia.
- Plano «se... então» opcional na linha do passo mais pequeno, mostrado por cima do anel; «Park a
  thought» durante o trabalho (tecla t), com a lista no intervalo.
- Experiência pessoal na gaveta: uma cena, dois perfis; o perfil de cada bloco vem da ordem AB BA;
  «I got distracted» no bloco e nota de 1 a 5 no intervalo; bloco com o som mudado fora da contagem
  (a letra repete-se); resultado só com quatro blocos contados de cada som: médias, diferença por par
  com intervalo de 95% pela t de Student, veredicto e limites (sem ocultação, nota subjetiva, tarefas
  que variam); blocos deixados a meio contam como inacabados.
- Provas: 5 entradas passaram a «in room» (`progress-log`, `no-punishing-streaks`,
  `light-gamification`, `daily-cap`, `personal-experiment`); 2 novas (`if-then-plan`, moderada;
  `park-a-thought`, desenho nosso), com fontes confirmadas pelo DOI; ficam 31 na sala, 1 proposta
  (`best-hours`), 2 conselhos e 1 fora de plano.
- Defeito antigo apanhado nas medições e corrigido: quando a porta ou o intervalo não cabiam, o
  navegador espremia os campos (a intenção de 52 para 20 píxeis) e o anel (os números saíam do
  círculo, visto numa captura do telemóvel). Agora só o anel encolhe, o tempo segue o seu tamanho real,
  e a porta compacta-se em ecrãs até 1100 de altura (Begin e ajustes lado a lado).
- Testes: `t-focus` com 121 verificações (eram 63). Bateria completa a passar: gate 7, rain 5,
  focus 121, devlog 10, intro 5, ritual 14, ads 71; art saltado (falta o ffmpeg neste Mac).
- Publicado num commit (`0c432e7`); servido confirmado (a liquid servida é igual à montada e o ficheiro
  de provas servido tem as 35 entradas).

## 2026-10-18: v5.1, anúncios calados e espera por progresso no motor da liquid (sessão Claude Code na nuvem)

- Ronda do motor (nível max) com o desenho em 6 pontos aceite pelo Paulo (`ops/HANDOFF.md`). Mudaram
  `liquid/build-liquid.py` (secções 10 e 12; o `l05` gerado), o CSS dos pratos no `l01`, os leitores da
  sala de foco no `l07` (só o mudo até ao estado 1) e um comentário do `l03`; catálogo, sala antiga e
  `l04` intactos.
- Portão do som: um leitor só sai do mudo com a sua música em PLAYING; o único `unMute` do motor está
  na função `gate`, verificado pelo build. Antes abriam cedo o arranque (o primeiro disco abria durante
  o anúncio), o corte no mesmo prato, o botão de som, o primeiro gesto e a guarda de som; a sala de foco
  nunca calava o leitor. Um estado -1 no disco no ar volta a calar (anúncio a meio, não medido no ensaio).
- Prato à espera fora do ecrã, 1 por 1 píxel, no computador (antes: transparente no monitor); entra no
  monitor ao ir para o ar, com meio segundo de entrada. `PRE_LEAD` de 40 para 120 s.
- Vigia do carregamento em vez do `REC_TIMEOUT` de 25 s: 5 s parado, um `playVideo`; 15 s, recarrega;
  segunda paragem, outro disco; com progresso (anúncio ou música) nunca corta. Saltos no computador
  esperam pelo disco seguinte; erros e discos encravados no ar passam pelo rito do fim. Telemóvel: o
  salto é o rito do fim, com o seguinte a carregar mudo no mesmo leitor.
- Registo: eventos novos `reload`, `stall`, `cue`, `ad` e fim `stall` (o fim `timeout` acabou).
- Testes: `ops/tests/t-ads.js` (novo; YouTube simulado com anúncio em estado -1 e tempo a avançar,
  leitor parado no zero e anúncio a meio): 71/71; no motor antigo passavam 33 (falhavam as aberturas
  durante o anúncio, o prato transparente, o corte aos 25 s, o salto imediato, a falta de recarga e a
  sala de foco com anúncio audível). Bateria completa, depois de juntar a v5.0 da sala de foco (outra
  sessão), a passar: art 40, gate 7, rain 5, focus 63, devlog 10, intro 5, ritual 14, ads 71 (7,5 min).
- Limites: o YouTube simulado não é o real (da nuvem não há anúncios nem conteúdo licenciado); a
  confirmação com anúncios reais fica para uma ligação doméstica (`ops/HANDOFF.md`). O tamanho de
  1 por 1 segue o leitor OFF do ensaio, que não separou o tamanho da posição.
- Publicado num commit (`400bf23`), depois de um rebase sobre a v5.0 da sala de foco; servido
  confirmado (as duas salas iguais às montadas).

## 2026-10-18: v5.0, sala de foco, ronda 2a (sessão local do Claude Code)

- Pedido do Paulo: perfis de som por cena com a pergunta da primeira visita, zona «why?» na forma C a
  partir do ficheiro de provas e porta com «continuar onde parei», passo mais pequeno e recomeço.
  Mudaram `liquid/l07-focus.html`, `liquid/focus-evidence.json` (mudado de `ops/notes/2026-10-18/`),
  `ops/tools/validate.py` e `ops/tests/t-focus.js`; motor, catálogo e sala antiga intactos.
- Perfis de som: Silence, Nature (chuva), Ambient (focus zen, ambient, ambient techno), Lo-fi,
  Minimal (dub, hypnotic e ambient techno), Liquid (só liquid, sem intelligent), Energy (deep house,
  lo-fi house). Por omissão: Read Nature, Study Silence, Write e Code Minimal, Create Nature,
  Routine Energy. Resposta «Yes, usually»: Read e Study passam a Lo-fi. Resposta «No, I like it
  quiet»: nenhuma cena com música. A escolha da pessoa fica lembrada por cena; o seletor fica um passo
  atrás das cartas («change») e na gaveta.
- Zona «why?»: separador na barra de cima e 15 ligações junto das decisões (o «why?» do som segue o
  perfil em vigor). O painel lê o ficheiro de provas: 33 entradas (24 na sala, 2 conselhos para fora
  dela, 6 propostas, 1 fora de plano), 9 mitos e 2 estudos retirados, com selo de força e ligações
  às fontes; sem o ficheiro, diz onde ele está. `validate.py` verifica o ficheiro e falha se uma
  ligação da sala não tiver prova.
- Porta: «Continue where you stopped» com a nota da última vez (um toque abre a sessão), passo mais
  pequeno opcional (aparece com a intenção e fica à vista no primeiro bloco), linha de recomeço à
  segunda-feira, no dia 1 do mês e a 1 de janeiro.
- Testes: `t-focus` com 63 verificações (eram 46). Defeito apanhado na revisão do diff e corrigido
  antes de publicar: com «My last» escolhida, o som mudado à porta perdia-se no Begin; o teste novo
  falha sem a correção. Bateria completa a passar (art saltado: falta o ffmpeg neste Mac).

## 2026-10-18: v4.5, textos específicos e com fonte para as faixas (sessão Claude Code na nuvem)

- Regra nova no `CLAUDE.md`: texto `b` específico de cada faixa, só com factos de fonte
  verificável, fonte registada em `ops/queue/blurb-sources.tsv`; obrigatória nas importações.
- Reescritos 724 dos 1236 textos genéricos (opção 1 do Paulo: história quando documentada, factos
  da edição nos outros casos). Fontes: Discogs (edição confirmada pelo alinhamento) em 685, mais
  39 artigos da Wikipédia. Os 149 textos que já eram específicos ficaram como estavam.
- Ficam genéricos 512 (lofi_house 229, deep_house 59, house 58, reggae 31, dub 23 e outros):
  sem edição no Discogs, correspondência errada (afastada à mão) ou só digitais sem informação.
- Revisão de cada lote contra a regra: corrigidos cerca de 60 textos que tinham inferências
  («first release» deduzido do catálogo, «his own label», nomes verdadeiros de memória).
- Ferramentas em `ops/tools/blurbs/` (README com o procedimento).

## 2026-10-18: ensaio dos anúncios, leitor escondido contra visível (sessão local do Claude Code, sem publicação)

- Pedido do Paulo: antes de corrigir o motor, medir se o disco seguinte, pré-carregado mudo num leitor
  escondido, passa o anúncio tão bem como num leitor visível (ele não quer janela visível). Corrido no
  Mac e não na nuvem: de um centro de dados o YouTube esconde o conteúdo licenciado e, por inferência,
  também os anúncios.
- Desenho e ferramentas: `ops/notes/2026-10-18/ads-probe.txt`, `ops/tools/yt_ads_probe.py`,
  `ops/tools/yt_ads_summary.py`. 20 vídeos (10 «Topic», 10 sem «Topic»), cada um em três leitores ao
  mesmo tempo: VIS (300 por 200, visível), HID (opacidade 0, como o leitor B), OFF (1 por 1 fora do
  ecrã, como a sala de foco). Regras do motor proposto: recarregar depois de 15 s sem progresso,
  limite de 90 s.
- Música a tocar em 90 s: VIS 16 de 20, HID 11 de 20, OFF 19 de 20. Pares discordantes: HID contra
  OFF 0 contra 8 (p=0,008); VIS contra HID 8 contra 3 (p=0,23); VIS contra OFF 1 contra 4 (p=0,38).
  Esconder por opacidade 0 é o pior; o leitor fora do ecrã não ficou atrás do visível.
- A falha principal não é o anúncio: é o leitor parado no zero, sem anúncio nem progresso (aos 90 s:
  VIS 4, HID 8, OFF 1). Recarregar uma vez salvou cerca de metade (VIS 5 de 9, HID 5 de 14, OFF 6 de 7).
- Anúncios: no leitor visível, em 8 de 10 «Topic» e 3 de 10 outros; o mais longo visto durou 29,5 s
  (até 58 s num escondido). Nenhum anúncio com som (leitores mudos), nenhum estado PLAYING durante um
  anúncio em cerca de 730 amostras, e a API (estado -1 com o tempo a avançar) reconheceu 96% das
  amostras de anúncio: o portão do som pelo estado 1 é seguro.
- Retoma: os 27 discos prontos, parados 20 s no zero e postos a tocar, entraram todos em menos de
  2 s, sem anúncio.
- Limites: um só computador e um só dia, perfis novos (que recebem mais anúncios do que um browser
  com histórico), amostra pequena; o leitor OFF difere do HID também no tamanho e nos parâmetros.
  Os «Topic» trouxeram anúncio mais vezes (8 de 10 contra 3 de 10), mas os outros da amostra são
  faixas sem «Topic», não os uploads antigos trocados na v4.5: não mede o efeito da troca.

## 2026-10-18: v4.9, sala de foco, ronda 1 da avaliação científica (sessão local do Claude Code)

- Avaliação da sala à luz da literatura (25 fontes: Pomodoro e pausas, música e ruído de fundo,
  intenções e resíduo de atenção, interrupções, ecrã, respiração, registo); o Paulo aprovou a
  ronda 1. Só `liquid/l07-focus.html` mudou; motor, catálogo e sala antiga intactos.
- Seis cenas por tarefa: Read (sem música, chuva baixa, 25+5), Study (silêncio, 25+5), Write
  (dub techno e ambient techno, 50+10), Code & numbers (dub, hypnotic e ambient techno, 50+10),
  Create (sem música, chuva moderada, 35+7), Routine (deep house, lo-fi house, lo-fi beats,
  25+5). Interruptor «Play music while I work» na gaveta; tocar ou saltar à mão liga a música.
- Intervalo de um quinto do bloco (longo, 30 min, a cada terceiro); no último minuto a música desce
  e aparece «+5 min», que também desfaz o intervalo no primeiro minuto e meio. Intervalo guiado:
  música calada, chuva baixa, convite a sair do ecrã, «onde paraste» (lembrado no bloco seguinte e
  na entrada da visita seguinte), respiração de 1 minuto.
- Só minutos durante o foco (segundos ao passar o rato, em pausa e no intervalo); sino suave por
  omissão e sino grave no fim do intervalo; respiração desligada por omissão, 1 ou 3 minutos;
  linha «phone on silent, out of sight» antes do Begin. Memória passa à versão 2, com migração.
- Testes: `t-focus` reescrito (46 verificações, relógio acelerado por `window.HMFR`).

## 2026-10-18: diagnóstico da demora a carregar no computador (sessão local do Claude Code, sem publicação)

- Queixa do Paulo: no computador (Chrome e Firefox, também na sala de foco) os vídeos demoram muito a
  entrar; no telemóvel (Chrome, Brave) não.
- Causa: o YouTube põe anúncios antes dos vídeos de música no leitor embutido (um ou dois seguidos,
  vistos e fotografados: «Sponsored 1 of 2», cerca de 20 a 40 s). Medido com o Chrome instalado,
  perfil novo, numa página mínima: «Me at the zoo» (sem anúncios) toca em 1,1 s; os vídeos de
  música, «Topic» ou não, tocam aos 18 a 39 s. Amostra de 8 pares da troca da v4.5: demoraram 6 dos
  8 uploads antigos e 7 dos 8 «Topic»; a troca não é a causa (amostra pequena).
- O motor agrava: o disco seguinte arma-se mudo no leitor B, invisível (opacidade 0), e a sala de
  foco usa um leitor de 1 por 1 píxel; em 5 ensaios com leitor invisível, 3 ficaram sem música em
  70 s (a carregar, sem anúncio a correr); com leitor visível, 1 em 5 (amostra pequena). Com `REC_TIMEOUT` de 25 s, o disco armado cai por tempo e a rádio corta
  para outro, que também traz anúncio. O registo de emissão do browser embutido (17/10) tem 5 de 5
  discos do leitor B em «timeout» e silêncios de 26 a 69 s entre discos. No telemóvel há um só
  leitor, visível, e o Brave tira os anúncios.
- Ensaios para o desenho da correção (leitor visível de 320 por 200, perfil novo do Chrome): durante
  o anúncio a API dá o estado -1 com o tempo a avançar, e o `mute()` do leitor cala também o anúncio
  (o elemento de vídeo do anúncio vem `muted`); passado o anúncio, a música chega a PLAYING, o leitor
  para no zero, e 15 s depois arranca em menos de 1 s, sem anúncio novo.
- Nada mudado no motor; opções em `ops/HANDOFF.md`, à espera da escolha do Paulo.

## 2026-10-18: v4.8, três vídeos corrigidos por decisão do Paulo (sessão local do Claude Code)

- Brawther, «Khawuleza (Unreleased Dub)», e Harrison BDP, «Dust»: dados como apagados na v4.5, mas o
  erro era do catálogo, com uma letra do videoId na caixa errada («GL4OSV4q9LI» por «Gl4OSV4q9LI»,
  «BkB4DWT3BbE» por «Bkb4DWT3BbE»; os IDs do YouTube distinguem maiúsculas). Ficam os mesmos
  uploads (Do Funkk, 390 s; Houseum, 566 s), sem «Topic» de nenhuma das duas. A pesquisa mostra que
  a do Brawther é a sua dub, por editar, de Jeremiah, «Khawuleza» (título do catálogo mantido).
- Sam Binga, «Get Down Low (En:vy Remix)»: o vídeo tocava outra faixa («Proud», Enei Remix);
  passou para o «Topic» (183 s, a mesma duração do upload da Critical Music).
- Os três novos confirmados por oEmbed; registo em `topic-swap-2026-10-17-applied.tsv`.

## 2026-10-18: v4.7, revisão manual das 141 S4 da troca por «Topic» (sessão local do Claude Code)

- As 141 faixas S4 de `topic-swap-2026-10-17-kept.tsv` (há «Topic» do artista com outro título)
  passaram por uma pesquisa de canções no YouTube Music a partir do IP doméstico, com o título
  grafado de vários modos (apóstrofos, sem parênteses, título antes do artista), e revisão à mão
  dos candidatos com o título do vídeo antigo (oEmbed) e o alinhamento dos álbuns.
- Trocadas 6, só o videoId, todas com oEmbed 200: house 3 (Armand Van Helden, «Witch Doktor»,
  versão longa de 392 s; Mr Oizo, «Flat Beat», versão do single de 326 s em vez do vídeo oficial
  editado; Charanjit Singh, «Raga Madhuvanti», faixa do «Ten Ragas To A Disco Beat»), deep_house 1
  (34th Floor Experience, «Set Me Free (Original Mix)», mesma duração), dub 1 (Nazamba, Linval
  Thompson and OBF, «Curfew Drop», «Topic» do O.B.F), ska_rocksteady 1 (The Pyramids, «John
  Chewy»). Duas vêm do canal genérico «Release - Topic», aceites só porque o artista foi
  confirmado nos metadados do YouTube Music.
- Ficaram 135 (`ops/queue/topic-swap-2026-10-18-s4-review.tsv`, motivo por linha): 104 sem a faixa
  no YouTube Music (só outras faixas do artista), 13 com «Topic» mais curto ou só em edição,
  9 com outra mistura, versão ou faixa, 3 em que o «Topic» de título parecido é de outro artista,
  2 só ao vivo, 2 de identidade ou mistura incerta (DJ Dove, «Illusions»; Ras Midas, «Cant Stop
  Rasta Now») e 2 com vídeo apagado e sem «Topic» (Brawther, Harrison BDP).
- Por decidir pelo Paulo: Intrusion, «Reflection II», só existe em «Topic» como «Unreleased
  Extended Mix» (774 s); o vídeo atual é a «Original Version» (265 s).
- Só catálogo, sem `ops/tests/run.sh` (não toca no motor nem na interface). Publicado num commit,
  depois de um rebase sobre a v4.6 da sala de foco; servido confirmado (as duas salas iguais às montadas).

## 2026-10-17: v4.6, sala de foco em três tempos (sessão local do Claude Code)

- Proposta em texto, quatro alternativas e maquetes da C e da D; o Paulo escolheu a D e pediu os
  fundos da rádio na sala, mantendo os da sala. Só `liquid/l07-focus.html` mudou; motor, catálogo
  e sala antiga intactos.
- Entrada: intenção, cenas (Deep work, Study, Read; «My last» a partir da segunda visita) e Begin,
  que arranca o tempo e a música. Sessão: tempo num anel (toque pausa e retoma), barra com música,
  volume próprio e chuva, lareira e vinil por toque. Gaveta: cena, tempo (25, 35, 50; som do fim;
  End session), géneros, volume, sons, fundo, esconder controlos, respiração à entrada.
- Fundos: dusk, ink e off da sala, mais os sete campos da rádio (copiados do canvas `#vj`; a lista
  lê-se pelo `HMFIELD.next` e o campo volta onde estava). Memória em localStorage `hm_focus`.
- Leitor da sala: sorteio por género aceso e depois por faixa (antes, por faixa: com os oito
  géneros calmos, cerca de 74% saía de lofi house ou deep house). Pomodoro com três marcas,
  coerente com a pausa longa de 30 minutos a cada terceiro bloco.
- Testes (`ops/tests/run.sh`, primeira vez num Mac, com Node e Playwright instalados pelo
  Homebrew e pelo npm): gate 7/7, rain 5/5, focus 24/24 (novo), devlog 10/10, intro 5/5,
  ritual 14/14; art saltado (sem ffmpeg neste Mac). `common.js` passa a encontrar o Playwright
  instalado pelo Homebrew.

## 2026-10-17: v4.5, troca de 696 vídeos S2/S3 pelas versões «Topic» (sessão local do Claude Code)

- Sondagem do catálogo inteiro (1385 faixas) pelo YouTube Music a partir do IP doméstico: 398 já
  eram «Topic»; 987 não (uploads de terceiros, canais oficiais ou de editoras, vídeos apagados).
  As 987 passaram pelo `yt_resolve.py` em sete lotes de 150, com a duração do vídeo atual como alvo.
- Trocadas 696, só o videoId (título, ano, blurb e data de entrada ficaram): lofi_house 242,
  house 145, deep_house 142, reggae 43, hypnotic_techno 25, dub_techno 25, dub 14, liquid 12,
  uk_garage 7, ambient_techno 6, atmospheric_jungle 6, dubstep 6, ska_rocksteady 6, lofi 5,
  breakbeat 4, ragga_jungle 4, intelligent_dnb 3, oldskool_hardcore 1. Todas «Topic», todas com
  incorporação confirmada por oEmbed.
- Critério: 648 automáticas (S5, título igual sem versão a mais nem a menos, duração a menos de
  max(15 s, 6%) do vídeo antigo); 48 por revisão manual (mesma mistura com título grafado de outro
  modo, versão longa da mesma faixa, vídeo antigo apagado ou errado). Pela regra da versão longa:
  The Chemical Brothers, «Star Guitar» (388 s), Benga & Coki, «Night» (372 s), Stardust, «Music
  Sounds Better With You» (404 s), JT Donaldson, «Stay Inside» (Sandy Rivera Extended Remix,
  317 s), e outras 15 mais longas que o upload antigo.
- Vídeos errados corrigidos de passagem: Barbara Tucker, «Beautiful People (C.J.'s Dub)» (era um
  documentário da DJ Mag), Charles Pierre, «Euphoria» (excerto de um set de festival), MPH, «Nova»
  (mashup), Sakro, «Believe it» (era «Beautiful Music»), Demuja, «Move» (era «Move Like That»);
  apagados substituídos: Mall Grab, «Guap», Basic Channel, «Phylyps Trak», Vales, «Warm The Room».
- Ficaram 291 como estavam (`ops/queue/topic-swap-2026-10-17-kept.tsv`, com o melhor candidato e o
  motivo): 141 S4 (há «Topic» do artista mas com outro título), 64 S2 e 20 S3 (sem «Topic»),
  15 M, e 51 revistas à mão e recusadas (outra mistura, «Topic» mais curto, outra faixa).
  Continuam apagados, sem «Topic»: Brawther, «Khawuleza (Unreleased Dub)», e Harrison BDP, «Dust».
  Sam Binga, «Get Down Low (En:vy Remix)», tem um vídeo de outra faixa («Proud», Enei Remix).
- Registo das trocas, para reposição: `ops/queue/topic-swap-2026-10-17-applied.tsv` (old_vid e
  new_vid); entrada e saída do resolvedor em `topic-swap-2026-10-17-{in,resolved}.tsv`.
- Publicado em cinco commits (155, 155, 129, 129, 128); só catálogo, sem `ops/tests/run.sh`
  (não toca no motor nem na interface). Servido confirmado: as duas salas iguais às montadas.

## 2026-10-17: v4.4, as 78 «nada» resolvidas de uma ligação doméstica (sessão local do Claude Code)

- `yt_resolve.py` corrido no computador do Paulo (IP doméstico em Portugal): o YouTube Music
  devolve os canais «Topic». Das 78: 72 S5, 2 S4, 4 M, todas com duração conferida pelo resolvedor.
- Entraram 73 (catálogo 1312 para 1385): lofi_house 46, house 15, deep_house 5, uk_garage 2,
  reggae 1, lofi 1, dubstep 1, dub 1, breakbeat 1; 70 do Spotify, 3 do SoundCloud. Todas «Topic».
  vecher 1998, «тоска», era S4 só porque a comparação de títulos falha no cirílico (título igual).
- Pela preferência pela extended: Satoshi Tomiie, «Indian Summer», entrou em «Full Length» (420 s)
  em vez da «Radio Edit», e Papa Soul, «Moody Type Love Pt. II», no «Soul Groove (UK) Remix»
  (439 s) em vez da «Radio Edit» desse remix.
- Ficaram de fora 5, marcadas «errado-local» em `ops/queue/retry-2026-10-17.tsv`: Arttu,
  «Mic Check» (S4 com outra faixa, «Bass Trakk»), Bellamy, «it's a question of values (raw
  version)», Drez, «Back 2 Basics Skepta Remix», zacattacq e proc, «Laser Beams», e Tawk,
  «Cali Weed» (os quatro M: o melhor candidato é outra faixa).
- Ficheiros: `ops/queue/nada-2026-10-17-{in,resolved,accept-spotify,accept-soundcloud}.tsv`.
- O `build.sh` precisa do Node.js; no computador do Paulo não há Node instalado, foi usado um
  Node 22 oficial descarregado para uma pasta temporária.

## 2026-10-17: v4.3, canais «Topic» e repetição das não encontradas (sessão Claude Code na nuvem)

- Diagnóstico: vista da nuvem, o YouTube esconde o conteúdo licenciado (zero «Topic» em 290
  pesquisas; YouTube Music com zero canções até para «Bob Marley One Love»; páginas dos canais
  «Topic» vazias; o vídeo «Topic» de Wailing Souls, «Kingdom Rise Kingdom Fall», existe e o oEmbed
  confirma-o). `yt_resolve.py`: YouTube Music como primeiro nível, aviso de IP sem catálogo,
  `--verify` por oEmbed, consultas com títulos simplificados e comparação de títulos sem os
  sufixos do Spotify («- Original Mix», «- Radio Edit»).
- Entraram 8 das 126 (catálogo 1280 para 1288): house 4, deep_house 2, dub 1, dubstep 1; todas S2
  ou S3, duração conferida (salvo a do SoundCloud, sem duração de referência), incorporação
  confirmada por oEmbed. Mall Grab, «Feel You», já estava como «Feel U».
- Depois, por decisão do Paulo (prefere a versão extended quando é a mesma faixa), entraram 24
  versões longas (catálogo 1288 para 1312): lofi_house 13, house 7, deep_house 3,
  hypnotic_techno 1. Gusto e Anja Schneider confirmados no Discogs, no Beatport e na Bleep
  (a edição curta é corte da mistura longa); Berkson & What trocado por um upload de 548 s
  que coincide com o Spotify. Fica Todd Terry, «Bounce 2 the Beat» (identidade incerta).
- Ficavam 117 em `ops/queue/retry-2026-10-17.tsv`: 15 A1 e 10 A2 (corte longo, decisão do Paulo),
  78 sem upload visível da nuvem, 14 candidatos errados (mixes, ao vivo, outras faixas, álbuns).

## 2026-10-17: v4.2, importação das playlists do Spotify e do SoundCloud

- Entraram 576 faixas (catálogo 704 para 1280): lofi_house 235, house 124, deep_house 124,
  reggae 38, ragga_jungle 14, hypnotic_techno 11, dub 8, uk_garage 6, atmospheric_jungle 5,
  lofi 5, liquid 4, dub_techno 1, ambient_techno 1.
- Ficaram de fora 225 de 801 (as 193 que não estavam já no catálogo, com motivo, em
  `ops/queue/import-2026-10-17-left-out.tsv`): 126 não encontradas no YouTube, 29 já no
  catálogo, 27 com remix ou versão diferente da pedida, 17 com duração diferente da do Spotify,
  9 pop ou crossover, 5 sem género na grelha (baile funk, funk árabe, samba, pop brasileira),
  4 cortes de mix de DJ, 3 vídeos errados do SoundCloud recusados à mão, 1 excluída, 1 acelerada,
  1 com duas faixas, 1 repetida entre listas, 1 vídeo duplicado.
- Revisão: duas amostras de uploads de terceiros (30 e 25 linhas); a primeira mostrou 3 erros
  de versão, que levaram ao filtro estrito de duração e versão; a segunda, depois do filtro, 0.

## 2026-10-17: v4.1, toda a música do Ishkur retirada (sessão Claude Code na nuvem)

- Faixas novas: 0. Retiradas: 475 do Ishkur (breakbeat 69, uk_garage 67, liquid 56, dubstep 46,
  dub_techno 45, ambient 43, ragga_jungle 43, ambient_techno 37, atmospheric_jungle 22, house 22,
  intelligent_dnb 13, deep_house 9, oldskool_hardcore 2, reggae 1). Catálogo 1179 para 704.
- Exclusão por faixa para as 475; linhas literais em `ops/queue/hold-2026-10-17-ishkur.tsv`.
  Tarefa 1 (resto do Ishkur) cancelada.
- Não entraram: as duas playlists do Spotify e a do SoundCloud (rede bloqueada; a do SoundCloud
  responde «We can't find that playlist»). Ficam em fila no `HANDOFF`.

## 2026-10-08: v4.1-ops, testes e notas no repositório (sessão Claude Code na nuvem)

- Testes automáticos da liquid em `ops/tests/` (`bash ops/tests/run.sh`): galeria e filme no
  telemóvel, efeitos calados no foco e em mute, chuva, registo e painel `?dev`, introdução,
  troca de disco. Correm no Chromium com o YouTube simulado, sem rede, em cerca de 6 minutos.
- Ferramenta `ops/tools/fx_previews.js` para gravar as amostras dos sons da troca de disco.
- Notas de análise da v4.0 em `ops/notes/2026-10-08/`; faixas assinaladas e incertas da
  auditoria em `ops/queue/genre-audit-flags-2026-10-08.tsv`.
- `CLAUDE.md`: política de gastos e qualidade decidida pelo Paulo (trabalho sozinho por omissão,
  agentes só com estimativa e autorização, rondas, testes antes de publicar, max no motor e high
  no resto) e passo dos testes no procedimento de publicação.
- Lição da v4.0: 68 agentes e cerca de 8,8 milhões de tokens numa volta; o mapeamento custou um
  sétimo, a auditoria exaustiva e a revisão em várias camadas o resto.

## 2026-10-08: v4.0, notas do Paulo, ronda 1 (sessão Claude Code na nuvem)

- Importações: continuam bloqueadas pela rede (YouTube, Ishkur, SoundCloud, Discogs com 403).
- Catálogo 1192 para 1179: 7 retiradas a pedido do Paulo (exclusões por faixa no
  `exclusions.tsv`, formato novo com coluna `title`), 5 duplicados exatos, 1 em espera (BCee /
  Blu Mar Ten). Auditoria de géneros: 100 mudanças aplicadas (entre elas Flowrian «Thank You»
  de dub para liquid, Pender Street Steppers «Our Time» de lofi_house para deep_house, dez dubs
  clássicos que estavam em ragga_jungle, intelligent_dnb de 4 para 22).
- Motor da liquid (secção 10 do `build-liquid.py`): fim do corte antecipado (a troca começava
  24 s antes do fim e cada disco perdia cerca de 14 s, 19 s no telemóvel); ritual novo de
  levantar, 2 s, pousar; sons de agulha refeitos; kit dub só depois de reggae, dub, ska e
  ragga jungle; efeitos da emissão calados no foco, na arcada e em mute; rampa do primeiro
  disco corrigida.
- Sala de foco: chuva com o máximo a +6 dB (GainNode e limitador; recurso a duas cópias
  desfasadas, cerca de +3,9 dB, se o freesound recusar CORS); «Back to the full room» com
  debrum vermelho.
- Galeria: barra de topo com «Back to the radio» (debrum vermelho), «This week» / «Daily
  canvas» e «Immerse»; filme inteiro no telemóvel (`object-fit:contain`, pinça só na peça,
  ecrã inteiro do vídeo no iPhone); falhas do «daily canvas» corrigidas.
- Registo de emissão `HMPLOG` (l03) e painel `?dev` com separadores Next, Log, Banks, Engine
  (l09); atraso de três discos do `?dev` na mudança de bloco corrigido; introdução mais
  robusta (pré-carregamento, 10 s de margem, registo `hm_intro_log`).
- Diagnóstico da introdução: nenhum commit a partiu; o mais provável é falha ou lentidão do
  archive.org (sem registo de incidente encontrado para 4 a 7 de outubro).
- Revisão adversarial: 11 achados confirmados, todos menores, corrigidos.
- Em fila: importações (rede), decisões do Paulo listadas no `HANDOFF.md`.

## 2026-10-08: v3.8, manutenção; importações bloqueadas pela rede (sessão Claude Code na nuvem)

- Faixas novas: 0 (catálogo inalterado, 1192 faixas). As tarefas 1 (resto do Ishkur) e 2
  (faixas dos mixes da playlist 2) não começaram: o proxy de saída do ambiente recusa (403)
  `www.youtube.com`, `youtube.com`, `m.youtube.com`, `music.youtube.com`, `i.ytimg.com`,
  `music.ishkur.com` e `hikilinkuja.github.io`. Nenhum videoId foi procurado por outra via.
- Tarefa 3: `labs/arcade-data.js` regenerado (65 para 1192 faixas, 20 géneros, só os campos
  g, a, t, y, v) por um gerador novo, `ops/tools/arcade_data.py`, ligado ao `build.sh` e ao
  `validate.py`. Corrige também um erro latente: no «selector's shift» do laboratório,
  dub_techno, ska_rocksteady e oldskool_hardcore estavam na grelha mas sem faixas; ao chegar a
  um deles, a emissão do jogo parava com um TypeError (reproduzido com os dados antigos).
- Liquid: o ano em falta deixou de aparecer como «(undefined)» na revelação da arcada e no
  painel estendido do género (transformação 9 do `build-liquid.py`). A sala antiga, congelada,
  mantém o defeito no painel de cinco géneros; fica para decisão do Paulo.
- Confirmação do servido: o pedido a `hikilinkuja.github.io` está bloqueado; verificado pelo
  GitHub (commit em `main` e execução do GitHub Pages).
- Em fila: tarefas 1 e 2 (dependem de abrir a rede), voz do «dawn override» (depende da gravação).

## 2026-10-04: v3.7, importação em massa (sessão Cowork)

- Catálogo de 149 para 1192 faixas: Weronika 156, playlist 1 «House, Disco» 234,
  playlist 2 «reaggae/ska» 154, cortes do Ishkur 490, cânone ska e rocksteady 32
  (descontados 20 duplicados).
- Exclusões editoriais: brostep americano no nó Dubstep (Getter, Flux Pavilion, Apashe),
  crossovers pop e EDM de festival; falsos positivos do decisor automático corrigidos à mão.
- Em fila: resto do Ishkur (cerca de 1150 por tentar), faixas dos 98 mixes da playlist 2.

## 2026-10-04: v3.6, grelha fina de 7 sub-blocos e motor novo (sessão Cowork)

- Permanência proporcional à caixa, rotação persistente, selo «fresh in the crates»,
  ponte entre blocos com abridores, «dawn override» instrumental às 06h.

## 2026-10-08: passagem para as sessões Claude Code na nuvem (sessão Cowork)

- Fontes completas, `CLAUDE.md`, `ops/HANDOFF.md`, filas e ferramentas no repositório;
  a partir daqui o trabalho da rádio corre em sessões na nuvem.
