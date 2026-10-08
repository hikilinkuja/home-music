# Passagem de trabalho para as sessões na nuvem

Estado a 2026-10-08. Ler primeiro o `CLAUDE.md` da raiz. Executar as tarefas por ordem,
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

## Situação do catálogo (v3.7, publicada a 2026-10-04)

1192 faixas: dub_techno 123, uk_garage 108, liquid 107, deep_house 97, breakbeat 93,
house 75, ragga_jungle 64, dubstep 64, reggae 63, lofi_house 60, dub 55, hypnotic_techno 53,
atmospheric_jungle 53, ambient_techno 50, ambient 46, ska_rocksteady 35, focus_zen 27,
lofi 10, oldskool_hardcore 5, intelligent_dnb 4.

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

## Tarefa 1: resto do Ishkur (por fazer; bloqueada pela rede a 2026-10-08)

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

- Feito a 2026-10-08 (v3.8): `labs/arcade-data.js` passou a ser gerado por
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
