# Registo das voltas

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
