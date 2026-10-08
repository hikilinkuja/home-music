# Notas de análise de 2026-10-08 (v4.0)

Relatórios escritos pelos agentes da sessão de 2026-10-08, guardados tal como foram produzidos
(em inglês) para as sessões seguintes não terem de redescobrir o projeto. Os caminhos
`scratchpad/...` referem-se à máquina dessa sessão e já não existem; os testes que lá estavam
foram consolidados em `ops/tests/`.

## Estado de cada ficheiro

Os ficheiros 1 a 6 descrevem o código ANTES da v4.0: os números de linha estão desatualizados,
mas os mecanismos, os diagnósticos e as propostas continuam úteis. Os ficheiros 7 a 12 descrevem
o que a v4.0 mudou e como foi testado; o 11 corrige pormenores dos 7 a 10.

| Ficheiro | Conteúdo | O que continua útil |
|---|---|---|
| 1-mapa-reproducao-e-troca-de-disco | ciclo de vida de um disco, causa do corte antecipado (24 s), sons da agulha, lista de todos os efeitos FX | secção 4: os efeitos existentes e a proposta de kits por género |
| 2-mapa-sala-de-foco-e-botoes | chuva, fuga dos efeitos da emissão para o foco, botões de regresso | comportamento do iOS (volume ignorado), cadeia de som da sala de foco |
| 3-mapa-galeria-filme-e-zoom | galeria, filme 1 no telemóvel, zoom das pinturas | secção 3: limitações do zoom e ideias de melhoria (ainda por decidir) |
| 4-diagnostico-introducao | porque a introdução falhou alguns dias | secção 5: alojar o MP3 no próprio site (falta descarregá-lo) |
| 5-mapa-painel-dev-e-motor-de-selecao | modo `?dev`, rotação, seleção por género, simulação de tempo de antena | secção 2: desequilíbrios (uk_garage só por sorteio, repetição em flight e pressure) |
| 6-soundcloud-e-comentarios | a ligação do SoundCloud, termos da API, alternativas para comentários | secção 2: cinco conceitos de comentários e os backends possíveis (por decidir) |
| 7-ronda1-motor | ritual de levantar, 2 s, pousar; pré-carregamento; kits; portão dos efeitos | o que o motor faz agora e onde (secção 10 do `build-liquid.py`) |
| 8-ronda1-galeria | barra de topo, filme inteiro, falhas do daily canvas | |
| 9-ronda1-chuva | ganho de 1,8 com CORS, recurso de duas cópias sem CORS | |
| 10-ronda1-registo-e-painel-dev | `HMPLOG`, separadores do `?dev`, introdução robusta | colunas do CSV e motivos de fim |
| 11-ronda1-correcoes-da-revisao | os 10 defeitos menores corrigidos depois da revisão | |
| 12-ronda1-amostras-de-som | como foram gravadas as amostras dos sons | hoje: `node ops/tools/fx_previews.js PASTA` |

## Decisões que estes ficheiros preparam (pendentes do Paulo)

- kits do intervalo por género: `GAPKIT` no `build-liquid.py`, amostras com `ops/tools/fx_previews.js`;
- comentários: conceito e backend (ficheiro 6, secção 2);
- zoom das pinturas no computador (ficheiro 3, secção 3);
- uk_garage sem vizinho na tabela ADJ do motor (ficheiro 5, secção 2).
