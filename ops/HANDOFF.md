# Passagem de trabalho para as sessões na nuvem

Estado a 2026-10-08 (atualizado a 2026-10-21, v5.8, abertura servida pelo próprio site; auditoria de UI, rondas 0 a 3). Ler primeiro o `CLAUDE.md` da raiz. Executar as tarefas por ordem,
sem esperar nova ordem do Paulo, publicando por lotes (no máximo cerca de 150 faixas novas
por commit, para não perder trabalho se a máquina for reciclada). Guardar os ficheiros de
trabalho em `ops/queue/` e fazer commit deles com cada lote, para a sessão seguinte retomar.

## Bloqueio de rede (sessão de 2026-10-08)

A política de rede do ambiente na nuvem recusou (HTTP 403 do proxy de saída) todos os
pedidos a `www.youtube.com`, `youtube.com`, `m.youtube.com`, `music.youtube.com`,
`i.ytimg.com`, `music.ishkur.com` e `hikilinkuja.github.io`; PyPI e GitHub passam.
As tarefas 1 e 2 não chegaram a começar (nenhum ficheiro de fila novo). Antes de as
retomar, o Paulo tem de acrescentar esses domínios em «Allowed domains» nas definições de
rede do ambiente (menu do ambiente na barra de título da sessão, «Edit»), com «Allow
package managers» marcado. Primeiro comando de cada sessão, para confirmar:
`curl -sS -o /dev/null -w "%{http_code}\n" https://www.youtube.com/` (200 ou 30x; 000 com
«CONNECT tunnel failed, response 403» significa que continua bloqueado).

O bloqueio continuava na segunda volta do mesmo dia (v4.0): também `soundcloud.com`,
`on.soundcloud.com`, `w.soundcloud.com` e `www.discogs.com` devolvem 403.

## Situação do catálogo (v4.0, publicada a 2026-10-08)

1179 faixas: dub_techno 117, liquid 108, deep_house 101, uk_garage 92, breakbeat 89,
house 82, dubstep 80, reggae 67, dub 56, lofi_house 52, ragga_jungle 52, hypnotic_techno 51,
ambient_techno 51, ambient 47, atmospheric_jungle 37, ska_rocksteady 32, focus_zen 27,
intelligent_dnb 22, lofi 10, oldskool_hardcore 6.

Auditoria de géneros de 2026-10-08 (`ops/queue/genre-audit-2026-10-08.tsv`): 1185 faixas
revistas por 21 auditores, cada mudança verificada por um segundo revisor cético; 100 mudanças
aplicadas, 14 rejeitadas por falta de prova, 118 faixas ficaram «incertas» (sem mudança) e 61
foram assinaladas para o Paulo (covers, mixes longos no focus_zen, crossovers, géneros sem
chave, vídeos suspeitos). Retiradas: 7 a pedido do Paulo (com exclusão por faixa), 5 duplicados
exatos e BCee / Blu Mar Ten «Rose Coloured Stained Glass Windows» (em espera; linha literal em
`ops/queue/hold-2026-10-08.tsv`).

Lista completa das faixas assinaladas e incertas, com motivos: `ops/queue/genre-audit-flags-2026-10-08.tsv`.

Por decidir pelo Paulo (perguntas feitas a 2026-10-08):
- vídeos suspeitos no ragga_jungle que parecem os originais dancehall ou roots e não as versões
  jungle (Michael Prophet «Gunman», King Kong «Trouble Again», Capleton «Cold Blooded
  Murderer», Buju Banton «Move Your Body», General Malice «Clubshakin», Cutty Ranks
  «Original Rude Boy Style») e outros (Burial «Lambeth», «Bassline» «Falsehood», Conquest
  «Forever», Tina Moore, Edward Oberon, Zeno, Total Science and SPY): confirmar ouvindo, ou
  re-resolver quando o YouTube abrir;
- covers do reggae e do ska, mixes acima de 21 minutos no focus_zen, crossovers (Rui Da Silva,
  Chase and Status, Chaka Demus and Pliers), disco sem chave própria;
- a ligação do SoundCloud (`on.soundcloud.com/qlz3ssIMuiOLfJq4PN`) dá «We can't find that
  playlist»: pedir o endereço completo;
- secção de comentários: escolher conceito e backend (giscus exige ativar Discussions e
  instalar a app; anónimo exige Cloudflare Worker);
- kits de som do intervalo para os outros géneros (amostras enviadas ao Paulo; gravar de novo com
  `node ops/tools/fx_previews.js PASTA`);
- zoom das pinturas no computador: que ideias implementar (`ops/notes/2026-10-08/`, ficheiro 3);
- uk_garage sem vizinho na tabela ADJ do motor: só entra por sorteio (ficheiro 5 das notas).

## Pedidos de 2026-10-17

- Feito: retiradas as 475 faixas do Ishkur (hold em `ops/queue/hold-2026-10-17-ishkur.tsv`).
- Feito: importadas 576 faixas de cinco playlists do Spotify (exportadas pelo Paulo em CSV) e de
  uma do SoundCloud (alinhamento colado pelo Paulo), em cinco lotes. O que ficou de fora, com o
  motivo, está em `ops/queue/import-2026-10-17-left-out.tsv` (126 não encontradas no YouTube
  podem ser tentadas de novo; as restantes foram recusadas por versão ou duração erradas, ou
  por não terem lugar na grelha).
- Causa do zero S5 (investigada a 2026-10-17, v4.3): da nuvem, o YouTube esconde todo o conteúdo
  licenciado (pesquisa normal sem «Topic», YouTube Music com zero canções, canais «Topic» vazios).
  Não é defeito do script. O `yt_resolve.py` passou a tentar primeiro o YouTube Music (funciona
  numa ligação doméstica), a avisar quando não vê nenhum «Topic» e a ter `--verify` (oEmbed) para
  confirmar videoIds achados por fora. Pormenores no `CLAUDE.md` (secção da rede).
- Repetição das 126 não encontradas: entraram 8; o resto está em `ops/queue/retry-2026-10-17.tsv`
  por grupos: A1 (15, corte mais longo da mesma faixa ou mistura: o Spotify tem a edição curta,
  o YouTube a original ou estendida), A2 (10, provável corte longo mas incerto), nada (78, sem
  upload visível da nuvem, quase todas lofi_house e house de editoras pequenas, provavelmente só
  em «Topic»), errado (14), duplicada (1).

### Em espera do Paulo (importação)

1. Feito: A1 e A2 entraram na versão longa (24; decisão do Paulo: prefere a extended quando é a
   mesma faixa, regra a aplicar em importações futuras). Fica Todd Terry, «Bounce 2 the Beat»
   (duas faixas de nome parecido, não se sabe qual é a do Spotify).
2. Feito (v4.4, sessão local): das 78 «nada» entraram 73, todas «Topic»; 5 ficaram
   «errado-local» na fila (outra faixa). Feito (v4.5, sessão local): troca das faixas S2/S3
   pelas versões «Topic»; 696 de 987 trocadas (registo em
   `ops/queue/topic-swap-2026-10-17-applied.tsv`). Ficaram 291 em
   `ops/queue/topic-swap-2026-10-17-kept.tsv`. Feito (v4.7, sessão local): passagem manual das
   141 S4; trocadas 6 (registadas no fim do mesmo `applied.tsv`), ficaram 135 com motivo em
   `ops/queue/topic-swap-2026-10-18-s4-review.tsv` (104 sem a faixa no YouTube Music). Restam
   na kept, sem «Topic», as 64 S2, 20 S3 e 15 M: só um motor de pesquisa externo ou a revisão
   do Paulo as podem resolver.
3. Feito (v4.8): Brawther, «Khawuleza (Unreleased Dub)», e Harrison BDP, «Dust», não estavam
   apagados: o videoId do catálogo tinha uma letra com a caixa trocada (corrigido, mesmo upload);
   Sam Binga, «Get Down Low (En:vy Remix)», passou para o «Topic» da faixa.
   Por decidir pelo Paulo: Intrusion, «Reflection II»: o «Topic» só tem a «Unreleased
   Extended Mix» (774 s), o vídeo atual é a «Original Version» (265 s); trocar só se o Paulo
   aceitar a versão estendida como a mesma faixa.

## Sala de foco v4.6, ronda 1 (v4.9), ronda 2a (v5.0) e ronda 2b (v5.2), 2026-10-18

Alternativa D escolhida pelo Paulo (entrada com cenas, sessão com anel e barra, gaveta), com os
fundos da rádio integrados e os três da sala mantidos; teste `ops/tests/t-focus.js`. Ronda 1 da
avaliação à luz da literatura (seis cenas por tarefa, intervalo proporcional e guiado, «+5 min»,
«onde paraste», só minutos, sino suave, respiração opcional). Pesquisa funda em
`ops/notes/2026-10-18/1-pesquisa-sala-de-foco.md`; as provas vivem em `liquid/focus-evidence.json`.
Ronda 2a (v5.0): perfis de som por cena com a pergunta da primeira visita, zona «why?» (forma C) e
porta com «continuar onde parei», passo mais pequeno e recomeço.
Ronda 2b (v5.2), com as quatro escolhas do Paulo (período de um bloco; ordem ABBA com a primeira letra
sorteada; nota só nos blocos da experiência; só blocos completos nos totais):
- registo `hm_focus_log` (versão 1, tampa de 2000 blocos, só no browser): cada bloco que chega ao
  intervalo, com dia, cena, perfil e minutos; o «+5 min of work» pedido no intervalo soma ao mesmo
  bloco; totais de hoje e da semana no topo da porta (no telemóvel, no lugar do relógio; um toque abre
  a gaveta neles) e, na gaveta, a semana de segunda a domingo em barras, o resumo e a semana anterior;
  sem sequências; os totais podem esconder-se; exportação CSV e JSON e apagar (segundo toque);
- aviso suave no intervalo passadas 4 horas num dia, dispensável por um dia (memória `capDay`);
- plano «se... então» opcional: ligação na linha do passo mais pequeno, dois campos, mostrado por cima
  do anel e lembrado entre visitas (memória `ift`);
- «Park a thought» durante o trabalho (botão discreto ou tecla t, Enter guarda): a lista aparece no
  intervalo, cada pensamento sai com um toque ou todos com «clear all» (memória `park`, até 30);
- experiência pessoal na gaveta: uma cena e dois perfis; na cena da experiência o perfil de cada bloco
  vem da ordem (sem mudar o perfil lembrado para a cena), a porta diz «set by your experiment»;
  «I got distracted» durante o bloco; nota de 1 a 5 no intervalo; um bloco com o som mudado a meio não
  conta e a letra repete-se; a posição na ordem vem sempre da contagem no registo; resultado só com
  quatro blocos contados de cada som: médias, distrações por bloco, diferença B menos A por par com
  intervalo de 95% (t de Student), veredicto e limites; blocos deixados a meio (pelo menos 1 min)
  contam como inacabados; parar guarda a experiência e o resultado em `xp` (até 20);
- provas: `progress-log`, `no-punishing-streaks`, `light-gamification`, `daily-cap` e
  `personal-experiment` passaram a «in room»; novas `if-then-plan` (moderada) e `park-a-thought`
  (desenho nosso, com Masicampo e Baumeister 2011, Scullin e colegas 2018, Risko e Gilbert 2016);
- defeito antigo corrigido: quando a porta ou o intervalo não cabiam, o navegador espremia os campos
  (a intenção descia de 52 para 20 píxeis) e o anel (os números saíam do círculo); agora nada encolhe
  além do anel, cujo tempo segue o tamanho real, e a porta desliza se for preciso; em ecrãs de
  computador até 1100 de altura a porta compacta-se (Begin e ajustes lado a lado, sem as legendas).
Escolhas minhas, a confirmar pelo Paulo: os textos ingleses (pergunta da nota, aviso das quatro horas);
o plano aberto na porta sempre que existe; os pensamentos só no intervalo (não na porta); «I got
distracted» só nos blocos da experiência; mexer na duração ou nos géneros a meio torna a cena «custom»
e a experiência só volta a aplicar-se quando a cena for escolhida de novo.

Em fila, propostas e por decidir pelo Paulo:
- possível: tempo entre abrir a sala e o Begin como medida da experiência (nota de pesquisa, 3.D),
  pensamentos estacionados à vista na porta depois de «End session», e uma vista por hora do dia a
  partir do registo (que já guarda a hora de cada bloco), para a prova `best-hours` (ainda «proposed»);
- ronda 3 (catálogo): marcar as faixas com voz (`vx:1`) para os perfis filtrarem por faixa e não por
  género (o liquid e o deep house têm faixas cantadas); psytrance minimal ou progressivo como género
  novo, se o Paulo o abrir (entraria como perfil de som);
- curadoria pelo Paulo dos perfis (géneros e volumes) e do perfil de cada cena, incluindo a resposta
  «sim» (Read e Study em lo-fi) e «não» (nenhuma cena com música);
- som de pássaros CC0 para os intervalos (hoje é a chuva);
- por verificar num iPhone real: barra em duas linhas, folhas de ajustes e de provas, sons de fundo
  e o intervalo a ligar a chuva sem toque; na v5.2, os totais no topo, a nota de 1 a 5 numa linha e o
  campo de estacionar com o teclado aberto.

### Demora a carregar no computador (v5.1, publicada a 2026-10-18; falta a confirmação numa ligação doméstica)

Causa (diagnóstico e ensaio de 2026-10-18, `ops/LOG.md` e `ops/notes/2026-10-18/ads-probe.txt`):
anúncios do YouTube antes dos vídeos de música (20 a 60 s) e leitores parados no zero sem anúncio;
o motor agravava com o leitor B escondido por opacidade 0, `REC_TIMEOUT` de 25 s e corte para outro
disco, que trazia outro anúncio. Decidido pelo Paulo: anúncios sempre sem som; o disco seguinte
carrega antes de o atual acabar; sem janela visível.
Feito na v5.1 (secções 10 e 12 do `build-liquid.py`, CSS no `l01`, leitores da sala de foco no `l07`;
teste `ops/tests/t-ads.js`, 71 verificações, das quais 38 falham no motor antigo):
1. portão do som: cada leitor só sai do mudo com a sua música em PLAYING (estado 1); o único `unMute`
   do motor está na função `gate` (o build falha se aparecer outro); cobre o primeiro disco, o rito,
   os saltos, o botão de som, a agulha, o primeiro gesto e a guarda de som; um estado -1 no disco no
   ar (anúncio a meio) volta a calar; na sala de foco, o leitor da sala e o da respiração;
2. o prato à espera fica fora do ecrã, 1 por 1 píxel, como o leitor da sala de foco (só no
   computador; no telemóvel o leitor único fica como estava), e entra no monitor ao ir para o ar;
3. `PRE_LEAD` de 120 s; discos de 2 min ou menos armam logo no início;
4. vigia do carregamento: progresso é `getCurrentTime()` a mudar; 5 s parado, um `playVideo`; 15 s,
   recarrega uma vez; segunda paragem, outro disco (o armado troca no mesmo prato; o do ar sai como
   disco encravado); sem prazo fixo, nunca corta enquanto houver progresso;
5. salto no computador: o disco atual continua até o seguinte estar pronto no prato livre e só então
   corta, com o aviso «NEXT RECORD ON ITS WAY»;
6. telemóvel: pontos 1 e 4 (o salto é o rito do fim, com o seguinte a carregar mudo no mesmo leitor).
Escolhas minhas, a confirmar pelo Paulo: o prato à espera em 1 por 1 (o ensaio não separou o tamanho da
posição; a alternativa é fora do ecrã com o tamanho do monitor); erros e discos encravados no ar passam
pelo rito (levantar, 2 s, pousar) em vez do corte rápido; o aviso do salto; o anúncio a meio do disco
calado pelo estado -1 (não medido no ensaio, que só viu anúncios antes do vídeo).
Por fazer:
- confirmação com anúncios reais, só numa ligação doméstica (sessão local do Claude Code ou o Paulo):
  `ops/tools/yt_ads_probe.py` adaptado à sala, ou a liquid com `?dev` a correr 30 a 60 minutos e o
  registo exportado (eventos `reload`, `stall`, `cue`, `ad`; fins `stall`). Medir: trocas sem espera
  (levantar-pousar 2,0 s), esperas do rito, recargas e trocas, anúncio ouvido (deve ser nenhum), e a
  retoma do disco parado no zero até cerca de 100 s (o ensaio só mediu 20 s);
- por decidir pelo Paulo: o mesmo portão na arcada (`l08`, jogo «drop the needle») e nas mixtapes
  (leitor visível, com controlos); a sala antiga (congelada) continua com o comportamento antigo;
- possível: vigia do carregamento na sala de foco (hoje um leitor parado fica parado até se saltar).

## Textos das faixas (2026-10-18)

- Feito: 724 textos com fonte (v4.5). Ficam 512 genéricos, sobretudo lofi_house das playlists do
  Spotify, por falta de fonte; uma volta futura pode tentar o Bandcamp ou o Resident Advisor
  (este último recusa pedidos da nuvem, código 403).
- Cada importação passa a escrever os textos das faixas novas: `ops/tools/blurbs/README.md`.

## Auditoria de UI e UX da liquid (pedido do Paulo, 2026-10-18)

Prompt das rondas em `ops/prompts/ui-audit.md` (uma ronda por sessão: «executa a ronda N»).
- Feito: ronda 0, levantamento só de leitura, relatório em `ops/notes/2026-10-18/ui-audit.md`;
  ferramentas `ops/tools/ui_audit.js`, `ui_report.py` e `ui_static.py` (repetir antes e depois de
  cada ronda; capturas fora do repositório).
- Feito (v5.3): os dois defeitos da ronda 0 (Session log sem estilo; no telemóvel, a dica da ala da
  arte por cima da ficha), com o teste `ops/tests/t-ui.js`; eliminados `radio/index.html`,
  `introlab.html`, `labs/` e o gerador `ops/tools/arcade_data.py` (decisões do Paulo).
- Feito (v5.4): ronda 1, termos. O Paulo aceitou todas as recomendações de
  `ops/notes/2026-10-18/ui-terms.md` (Suggest a tune, Full screen, Visuals, Room sounds, Earn a skip com
  «Skip…» no telemóvel, The genre, Kind of work, subtítulos da gaveta, drop the needle, Guess the Genre,
  demonstration sheet, film loop on loan, about the work, Video, Keep screen on) e as correções do painel
  The Sound (sete blocos, fontes, atalhos, contagem, ligações repetidas escondidas por CSS). Três textos no
  motor (build-liquid.py, secção 13, e o crédito «suggested by»); diff revisto. Teste `t-ui.js` alargado.
- Nota para o catálogo (fora da auditoria): um texto de faixa ainda diz «the heaviest score in tonight's
  crate» (Norman Grant, Twinkle Music) e oito textos antigos citam o AllMusic sem registo em
  `ops/queue/blurb-sources.tsv`.
- Feito (v5.5): ronda 2, cores. Paleta de 20 papéis no `:root` do l01 (`ops/notes/2026-10-18/ui-colors.md`),
  consola Dub Desk com 11 variáveis locais em `#ag-dk` (l08), marcadores dos campos em `--dim`, `--line`
  #3b3560, madrugada em pergaminho (dado do bloco no `build-liquid.py`, secção 8). Regra: nenhuma cor literal
  nas fontes da interface fora dessas definições e das exceções (canvas e SVG em JavaScript; sombras e
  gradientes em preto, branco ou tinta com alfa); o `t-ui.js` falha se aparecer uma. «Kill the bass» aceso
  passou a verde (a regra existia e perdia por especificidade).
- Feito (v5.6): ronda 3, tipografia. Escala de cinco tamanhos (`--fs-label` 10, `--fs-small` 12, `--fs-body` 13,
  `--fs-title` 14, `--fs-head` 16 px) e dois espaçamentos (`--ls-caps` 0,12em, `--ls-title` 0,2em) no `:root` do
  l01; maiúsculas só em rótulos, botões e títulos curtos (frases em minúsculas, como estão escritas); mínimo de
  10 px em maiúsculas e 12 px em frases; família mantida (Courier New do sistema; letra própria fica como ideia).
  Regra: nenhum tamanho em píxeis fora das variáveis e dos tamanhos de exibição; o `t-ui.js` falha se aparecer.
- Pedidos do Paulo de 2026-10-19 (fora das rondas), pela ordem que ele aceitou: (1) feito na v5.7, a rádio ouvia-se
  baixinha por trás da sala de foco numa troca de disco (secção 14 do `build-liquid.py`, teste `t-side.js`);
  (2) estudo de letras mais legíveis em monitor grande, ronda 3b (`ops/notes/2026-10-19/fontes-estudo.md`): o Paulo
  escolheu a 6, Recursive (2026-10-19). Por implementar, primeiro passo da próxima sessão: letra servida pelo próprio
  site (Recursive variável, woff2, subconjunto latino, com a licença OFL ao lado, numa pasta `liquid/fonts/`);
  `@font-face` no l01; `--font-label` (Recursive com `font-variation-settings: "MONO" 1, "CASL" 0`) para tudo o que hoje
  usa `--mono`, e `--font-text` (Recursive `"MONO" 0, "CASL" 0.6`) para as frases em minúsculas (as regras com
  `--fs-small` ou `--fs-body` sem maiúsculas) e os campos de texto, como no guião `fontes-estudo.js`; escala fluida para
  monitores grandes (os cinco tamanhos a crescer entre 1440 e 2560 px, por exemplo texto de leitura de 13 para 15 px);
  teste no `t-ui.js` (letra carregada com `document.fonts.check`, rótulos e frases com a variação certa); bateria
  completa; capturas antes e depois com `ops/tools/ui_audit.js`. Não é motor; (3) volume vertical para Rain, Fire e Vinyl na barra da sala de foco, opção A
  (controlo vertical por cima de cada botão, ao passar o rato e ao segundo toque), na ronda 4.
- Ordem pedida pelo Paulo a 2026-10-19: implementar a Recursive e depois a ronda 5 (limpeza de código, prompt em
  `ops/prompts/ui-audit.md`; as cinco funções do motor sem chamador ficam a nível max, diff revisto). A ronda 4 fica em
  fila depois disso, com o volume vertical opção A.
- Sessões no computador do Paulo (desde 2026-10-19, por limite de uso na nuvem): `git pull --rebase origin main`
  antes de tudo. Os testes precisam de Node, do Playwright com Chromium (no computador pode instalar-se com
  `npm i -g playwright` e `npx playwright install chromium`; a regra de não instalar é só da nuvem) e, para o teste
  da galeria, do ffmpeg (sem ele, `t-art` sai com WARN e não conta como falha).
- Em fila: ronda 4 (conteúdo e densidade; anotado: texto sobre o campo
  líquido sem fundo (nome do bloco, «on air», BPM), pulsar de «drop the needle» até 0,3, «Spin the dubplate»
  com o estilo geral dentro da consola, barra de cima a 1024 px em duas filas; a ligação «Liner
  source» só abre o campo `w`, 50 faixas; as fontes do Discogs dos 719 textos estão só em
  `ops/queue/blurb-sources.tsv`), 5 (limpeza de código; motor a nível max).

## Primeiro disco calado (v5.8, 2026-10-21; motor)

- Queixa do Paulo: «music stops after playing for 1 second. when click mute it restarts for a second and then stops
  again». Causa (notas em `ops/notes/2026-10-21/`): a API verdadeira do YouTube devolve cópias do estado do leitor
  que só mudam com a mensagem seguinte dele, e o `unMute` com o volume a 0 põe-no em 5 (lido e medido); a rampa do
  primeiro disco ficava à espera para sempre e o disco ficava a volume 0. O defeito vem do portão do som da v5.1;
  a v5.7 transformou três segundos baixinhos em silêncio.
- Feito: secção 15 do `build-liquid.py` (diff revisto; 15b: depois de um `seekTo` ou `playVideo` nosso, o portão espera
  250 ms, porque a bateria assíncrona mostrou o som a abrir com o leitor no estado 3); leitor da sala de foco repõe o
  volume depois do `unMute`;
  YouTube simulado assíncrono nos testes (`ytAsync`, ou `HM_YT_ASYNC=1` para a bateria inteira) e teste novo
  `t-realyt.js` (12 verificações; na v5.7 publicada passam 5).
- Por confirmar: ouvir no computador e no telemóvel do Paulo. Se voltar a acontecer, pedir o registo (tecla d,
  separador Log, exportar JSON).

## Abertura (v5.8, 2026-10-21)

- Queixa do Paulo: a abertura voltou a falhar («countless times»). Causa: a faixa vinha em streaming do archive.org,
  que caiu várias vezes entre agosto e outubro de 2026; a 2026-10-21 não respondeu às ligações do GitHub Actions
  (três tentativas de 60 s, 15h49 a 15h52 UTC).
- Feito: a abertura e a agulha tocam primeiro as cópias do site (`sfx/intro-sound-killah.mp3`,
  `sfx/vinyl-625771.mp3`) e só usam o archive.org e o freesound de reserva (secção 1 do l06; teste `t-intro.js`).
  O vinil chegou ao `main` às 15h53 UTC (1 626 336 bytes, 56,6 s, MP3 de 48 kHz).
- A faixa chegou ao `main` no mesmo dia, às 17h29 UTC, quando o archive.org voltou a responder (8 793 667 bytes,
  MD5 conferido com os metadados do item; 320 kbps, 219 s). O fluxo `.github/workflows/intro-media.yml` fica só a
  pedido («Run workflow»), para o caso de ser preciso trazer outra vez; no computador do Paulo também serve
  `python3 ops/tools/fetch_intro_media.py`. O `validate.py` falha se os ficheiros faltarem.

## Próxima ronda (proposta)

Sessão nova, a partir deste ficheiro. Ordem sugerida, uma ronda de cada vez, conforme as decisões
do Paulo:
1. Se a rede estiver aberta: tarefas 1 e 2 (importações por script, nível high, sem agentes).
2. Catálogo: aplicar as decisões sobre as faixas assinaladas (nível high).
3. Motor: kits do intervalo escolhidos pelo Paulo, com o seu teste em `ops/tests/` (nível max).
4. Comentários e zoom: só depois de o Paulo escolher conceito e backend.
Em cada ronda: estimativa antes de começar, `bash ops/tests/run.sh` antes de publicar,
`HANDOFF` e `LOG` atualizados no fim.

Fontes já tratadas:
- Playlist «radio» da Weronika: 156 de 157 no ar (a 67 foi excluída pelo Paulo).
  `import/pl3-weronika-radio.tsv` tem agora o videoId de cada faixa.
- Playlist 1 do YouTube «House, Disco» (PLE-1dgVzWDx8Fc_ag0NqRouBKAX9Npn3f): triada por
  inteiro, 234 faixas importadas; os mixes desta playlist não foram pedidos.
- Playlist 2 do YouTube «reaggae/ska» (PLE-1dgVzWDx8Q8F3qhVZXGYPE8QBOwbrO): faixas até
  21 minutos triadas (154 importadas); os 98 mixes acima de 21 minutos estão por tratar
  (tarefa 2).
- Ishkur's Guide: 490 faixas importadas de 1639 listadas nos 16 nós que a rádio usa
  (registo em `ops/queue/ishkur-imported-2026-10-04.tsv`); o resto é a tarefa 1.
- Cânone ska e rocksteady: 32 faixas, apoiadas em listas críticas de referência.

## Tarefa 1: resto do Ishkur (CANCELADA a 2026-10-17: o Paulo retirou toda a música do Ishkur; não reimportar)

```
pip install -q yt-dlp
python3 ops/tools/ishkur_fetch.py ops/queue/ishkur-all.tsv
python3 ops/tools/catalogue.py pending ops/queue/ishkur-all.tsv ops/queue/ishkur-pending.tsv
python3 ops/tools/yt_resolve.py ops/queue/ishkur-pending.tsv ops/queue/ishkur-resolved.tsv --limit 150
```
Repetir o último comando até não restarem faixas (retoma sozinho; cada chamada de 150 leva
cerca de cinco minutos). Rever depois:
- S5 e S3 entram; S4 entra com o título real do vídeo (o `catalogue.py` trata disso) e deve
  ser declarado no relatório; S2 (uploads de terceiros) rever por amostragem de pelo menos
  20 linhas antes de aceitar com `--accept-s2`; M fica de fora, registado.
- Aplicar o critério editorial: nada de crossovers pop ou EDM de festival (acrescentar
  artistas a `ops/queue/exclusions.tsv` quando for o caso e declarar).
```
python3 ops/tools/catalogue.py add ops/queue/ishkur-resolved.tsv --source ishkur --accept-s2
bash ops/tools/build.sh
```
Publicar por lotes como diz o `CLAUDE.md`.

## Tarefa 2: faixas de dentro dos mixes da playlist 2 (por fazer; bloqueada pela rede a 2026-10-08)

```
python3 ops/tools/yt_playlist.py list "https://www.youtube.com/playlist?list=PLE-1dgVzWDx8Q8F3qhVZXGYPE8QBOwbrO" ops/queue/pl2-all.tsv
```
Para cada entrada acima de 1260 segundos:
`python3 ops/tools/yt_playlist.py tracklist VIDEO_ID ops/queue/pl2-mix-tracks.tsv`.
Muitos são sessões contínuas sem alinhamento na descrição: registar e seguir.
Preencher a coluna `genre` por critério próprio (dub_techno para a linha Basic Channel,
Rhythm & Sound, Echospace e afins; dub, reggae ou ska_rocksteady para o resto; declarar
classificações forçadas), depois `yt_resolve.py`, `catalogue.py add --source mix`, montar,
validar e publicar.

## Tarefa 3: manutenção

- Feito a 2026-10-08 (v3.8; laboratório e gerador eliminados a 2026-10-18): `labs/arcade-data.js` passou a ser gerado por
  `ops/tools/arcade_data.py` (chamado pelo `build.sh` e verificado pelo `validate.py`) a
  partir de `radio/e03-data.html`, com o catálogo inteiro e só os campos que o laboratório
  usa (g, a, t, y, v). Não há nada a fazer à mão: cada montagem atualiza-o.
- Feito a 2026-10-08: a liquid deixou de mostrar «(undefined)» nas faixas sem ano (531 de
  1192), no jogo da arcada (`l08-arcade.html`) e no painel estendido do género
  (transformação 9 do `build-liquid.py`). A sala antiga continua a mostrar «(undefined)» no
  painel estendido de uk_garage, dub_techno, house, oldskool_hardcore e ska_rocksteady
  (`radio/e05-engine.html`, congelado): só se corrige se o Paulo autorizar mexer na sala antiga.
- Por fazer: voz do «dawn override». Quando o Paulo enviar a gravação, gravá-la como
  `sfx/dawn-mc.mp3`; o resto já está ligado.

## Armadilhas conhecidas

- O canal «Release - Topic» é genérico e devolve faixas de artistas errados: excluído no
  resolvedor.
- Canais Topic de homónimos (por exemplo, a banda italiana PFM em vez do duo de drum and
  bass): o resolvedor exige o nome do artista no canal; rever os casos S4.
- Falsos positivos já rejeitados à mão: Blues Brothers por Slag Brothers, banda sonora de
  Jerry Goldsmith por Flint, The Slow Mo Guys por Shockt, vídeos infantis e de patinagem.
- Se o YouTube pedir consentimento ou bloquear (o resolvedor para ao quinto erro seguido),
  parar e reportar ao Paulo. Nunca inventar videoIds.

## Relatório de cada volta

Acrescentar uma secção a `ops/LOG.md` (data, versão, faixas novas por género, o que falhou,
exclusões e decisões) e responder ao Paulo em português europeu, segundo o `CLAUDE.md`.
