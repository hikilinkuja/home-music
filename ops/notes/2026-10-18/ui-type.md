# Auditoria de UI e UX da sala liquid: ronda 3 (tipografia), proposta

2026-10-18. Base: secção 2 do relatório da ronda 0 (`ui-audit.md`). Nada implementado: espera a escolha do
Paulo. A proposta foi aplicada numa cópia de trabalho, medida e fotografada (antes e depois no mesmo bloco da
grelha, `?block=flight`), e as fontes voltaram ao estado publicado. O script que a aplica está em
`ui-typescale.py`, nesta pasta.

## 1. Escala proposta

Cinco tamanhos e dois espaçamentos, em variáveis no `:root` do l01, com a família atual («Courier New»):

| Variável | Tamanho | Papel | Hoje |
|---|---|---|---|
| `--fs-label` | 10 px | rótulos, botões, chips, legendas curtas, em maiúsculas | 8 a 11,5 px em maiúsculas |
| `--fs-small` | 12 px | texto secundário em minúsculas: notas, listas, metadados, campos | 9 a 12 px em minúsculas |
| `--fs-body` | 13 px | texto de leitura: descrição da faixa, parágrafos dos painéis, ficha da obra | 12 a 13,5 px |
| `--fs-title` | 14 px | títulos em maiúsculas: painéis, secções, perguntas de abertura, relógio | 12 a 14,5 px em maiúsculas |
| `--fs-head` | 16 px | cabeçalhos: marca, nome do género, gavetas, cartão da obra; botões de fechar | 15 a 18 px |
| `--ls-caps` | 0,12em | espaçamento das maiúsculas pequenas e dos números | 0,1 a 0,5em |
| `--ls-title` | 0,2em | espaçamento dos títulos em maiúsculas | 0,1 a 0,4em |
| (frases) | 0 | sem espaçamento extra | 0,02 a 0,1em |

Ficam fora da escala, por serem tamanhos de exibição: o nome do artista (`clamp(20px, 3.4vw, 34px)`), o título
da faixa (`clamp(13px, 1.8vw, 17px)`), a linha grande da abertura, o relógio do anel da sala de foco
(calculado pelo tamanho do anel) e as setas da ala da arte (34 px, símbolos).

Fundamentos:
- Numa letra monoespaçada cada carácter avança 0,6 do tamanho. Um rótulo de 10 px com 0,12em avança 7,2 px por
  letra, exatamente o mesmo que os 9 px com 0,2em de hoje: as letras ficam 11% maiores e os botões mantêm a
  largura. Com 0,14em, o cartão da faixa partia os botões em duas filas (medido na primeira versão).
- Mínimo: 10 px para maiúsculas e 12 px para frases. As WCAG (diretrizes de acessibilidade para a web) não
  fixam nenhum tamanho mínimo. O critério é inferência minha: numa maiúscula de 10 px a altura das letras é
  parecida com a das minúsculas de 12 a 13 px, porque a altura das maiúsculas é bastante maior do que a das
  minúsculas sem hastes. Não medi as métricas exatas da Courier New.
- Maiúsculas só em rótulos, botões e títulos curtos (até cerca de cinco palavras). As frases passam a
  minúsculas, como estão escritas: subtítulos dos painéis, explicações do Earn the skip, das Mixtapes e da
  arcada, dica da ala da arte, lista de teclas, perguntas da sala de foco, créditos da abertura. Ficam em
  maiúsculas, como exceção, as linhas da abertura (a voz do MC), o nome do bloco com o horário e a etiqueta da
  obra («Residency · film loop on loan»).

## 2. Medido antes e depois (mesmo bloco, as duas larguras)

| | Antes | Depois |
|---|---|---|
| tamanhos desenhados, computador | 20 | 10 (5 da escala e 5 de exibição) |
| tamanhos desenhados, telemóvel | 18 | 8 |
| tamanho mínimo | 8 px | 10 px |
| textos abaixo de 11 px (computador) | 214 de 431 | 196 de 430 (todos rótulos em maiúsculas de 10 px) |
| frases (minúsculas) abaixo de 12 px, computador | 91 | 4 (BPM, ano, «TARGET … BPM»: rótulos escritos em maiúsculas) |
| frases abaixo de 12 px, telemóvel | 57 | 3 |
| textos em maiúsculas (computador) | 259 | 232 |
| maiúsculas com mais de cinco palavras | 22 | 3 (as exceções acima) |
| espaçamentos distintos (medidos em píxeis) | 50 | 8 |

Os testes `t-ui` e `t-focus` (este verifica que nada se sobrepõe nem sai do ecrã em quatro tamanhos de ecrã)
passaram com a proposta aplicada. As falhas de contraste continuam a ser as do texto sobre o campo líquido,
que dependem da cor do campo e da hora; não mudam com a escala.

## 3. O que se vê mudar

- Os botões da barra e do cartão ficam com letras maiores e o mesmo comprimento.
- Os subtítulos e as explicações deixam as maiúsculas espaçadas de 9 e 10 px e passam a frases de 12 px.
- Os títulos dos painéis crescem de 13 para 14 px; o texto de leitura de 12 a 12,5 para 13 px; a marca de
  15 para 16 px (no telemóvel, de 12 para 14 px).
- Os botões da sala de foco descem de 11 para 10 px (passam a ter o tamanho de todos os outros rótulos).
- Os painéis ficam um pouco mais compridos (as frases crescem de 10 para 12 px); na gaveta da sala de foco, o
  subtítulo de «Your time» passa para a linha de baixo.

## 4. Decisões do Paulo

1. A escala (cinco tamanhos, dois espaçamentos). Recomendação: aceitar.
2. A regra das maiúsculas (só rótulos, botões e títulos curtos; frases em minúsculas, como estão escritas;
   exceções: linhas da abertura, nome do bloco, etiqueta da obra). Recomendação: aceitar.
3. O mínimo: 10 px em maiúsculas, 12 px em frases. Recomendação: aceitar.
4. A família: manter a «Courier New» do sistema. Recomendação: manter nesta ronda. Fica registado que Android e
   Linux não a têm (cada um mostra a sua letra monoespaçada); uma letra própria, servida pelo site (por
   exemplo, a Courier Prime, de licença livre), daria o mesmo aspeto em todos os aparelhos, mas acrescenta
   ficheiros de letra ao repositório e não a experimentei nesta ronda.

## 5. Implementação, depois da escolha

- Correr `ui-typescale.py` sobre as fontes (acrescenta as variáveis ao `:root`, troca 178 tamanhos e 140
  espaçamentos declarados (7 tamanhos de exibição ficam), retira as maiúsculas de 20 regras de frases).
- Teste no `ops/tests/t-ui.js`: nenhum tamanho em píxeis fora das variáveis e das exceções de exibição;
  espaçamentos só com as variáveis ou 0; nos estados percorridos, nenhum texto abaixo de 10 px, nenhuma frase
  abaixo de 12 px fora dos rótulos listados, nenhum texto em maiúsculas com mais de cinco palavras fora das
  exceções.
- Capturas antes e depois; bateria completa antes de publicar.
