# Registo das voltas

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
