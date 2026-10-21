# Auditoria de UI e UX da sala liquid: ronda 5 (limpeza de código), 2026-10-21

Regra da ronda (`ops/prompts/ui-audit.md`): sai só o que se prova não ser usado, por pesquisa no código e cobertura
de CSS no Chromium; o comportamento fica idêntico.

## 1. Inventário atualizado (`ui_audit.js`, `ui_report.py`, `ui_static.py`; 25 estados por largura)

- CSS (l01, l07, l08): 672 regras; 167 sem uso na visita, todas de estados não visitados ou de `@media` que a visita não
  ativou; nenhuma com um id ou uma classe ausentes da marcação e do JavaScript. Nenhuma regra provadamente morta.
- JavaScript: 525 funções com nome; 258 nunca chamadas na visita (caminhos não percorridos, o que não prova nada).
  Sem nenhuma referência além da declaração, antes desta ronda: `HMFX.oneDrop`, `HMFX.transitionFx`,
  `HM.skipIfBlocked`, `HM.flushPeek`, `HM.reVol`. Depois: nenhuma (os cinco nomes que o relatório ainda lista são
  opções de eventos e manipuladores do browser, `passive`, `maximumAge`, `onload`, `onclick`).
- Variáveis CSS definidas e nunca usadas: nenhuma. Código comentado: nenhum.

## 2. O que saiu

Motor (secção 16 do `liquid/build-liquid.py`, nível max, diff revisto):
- `HMFOCUS`, o modo de foco antigo da rádio (válvula de géneros e redução do volume): nada escreve `HMFOCUS.on`,
  por isso todos os seus ramos eram falsos. Saem a definição, o filtro na escolha do género (a linha volta à forma
  original, com o mesmo resultado), a condição no fim da corrida de um género e o fator `fdk` do volume (sempre 1);
- `HM.skipIfBlocked`, `HM.flushPeek`, `HM.reVol`, `FX.transitionFx` e `FX.oneDrop`: sem chamador; o bombo, o aro e a
  bolha que a `oneDrop` usava continuam no kit dub;
- `introAudio` e `introFading`: o resto da abertura da sala antiga (sempre `null` e `false` desde a secção 1) e as
  duas linhas que os consultavam, no volume e no mute.

CSS (regras do mesmo seletor no mesmo contexto, fundidas; nenhuma propriedade muda de valor):
- l01: `.vp-ctrl` e `#vol` (a segunda regra de cada um vinha depois do bloco do telemóvel e só somava propriedades;
  no `#vol`, o `flex:1` era anulado pelo `flex:1 1 100%`);
- l07: `#fcDial` (a transição), `#fcActs` (o alinhamento), `.fc-card .nm` no telemóvel (o espaçamento);
- l07: sai a primeira `.fc-card .gs` do telemóvel (tamanho e entrelinha), porque a segunda, no mesmo bloco, esconde
  o elemento.

Linhas por ficheiro (acrescentadas e retiradas): `liquid/l05-engine.html` (gerado) +3 e -32; `liquid/l01-head.html`
+3 e -5; `liquid/l07-focus.html` +4 e -8 (uma das linhas é um comentário que deixou de citar o `HMFOCUS`);
`liquid/build-liquid.py` +40 (as substituições da secção 16 e as verificações de que os nomes mortos não voltam).

## 3. O que fica, e porquê

- Os seis blocos `@media (max-width:760px)` do l01: cada um guarda regras únicas, junto da secção a que pertencem
  (topo, poema da ala da arte, ala da arte, leitor, botão do ecrã ligado, painel `?dev`). Juntá-los não tira código e
  mudaria a ordem da cascata em relação às regras de computador que ficam entre eles.
- As restantes «repetições» do inventário estático são o padrão normal de CSS: uma regra partilhada por vários
  seletores e depois a regra própria de cada um (`#waVid, #waPicWrap, #waVeil`; `.t-links a`; `.dv-pane th`; a lista
  de exceções da letra, que fica num só sítio, com o `#tArtist`, o `#tTitle` e o `#clock`).
- Os kits do intervalo ainda por escolher (`backspin`, `echothrow`, `tapestop`...): chamados pelo nome, pela tabela
  `GAPKIT` e pelo `HMFX.kit`; esperam escolha do Paulo.

## 4. Prova de que nada mudou

- Estilo calculado de cada elemento (`cssnap.js`, fora do repositório): 22 estados (sala, painéis do género, da
  sugestão, das Mixtapes, do Earn a skip e do Session log, sala de foco, «why?», sessão, gaveta, arcada), a 1440 e a
  390 px, com o sorteio fixo; 21 398 elementos, zero diferenças entre antes e depois (duas corridas antes da limpeza
  já só diferiam no arco do anel do tempo, que avança, e esse foi posto de lado).
- Bateria completa antes e depois (ver `ops/LOG.md`).
