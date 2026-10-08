# Registo das voltas

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
