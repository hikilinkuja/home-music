# Textos das faixas (campo `b`), a partir de factos com fonte

Regra no `CLAUDE.md` (2026-10-18). Os scripts trabalham sobre as faixas cujo texto é genérico
(texto repetido três ou mais vezes no catálogo). PASTA é uma pasta de trabalho fora do repositório
(por exemplo o scratchpad da sessão); os scripts esperam encontrar lá `bl/`.

1. Fichas de factos (sem custo de modelo; o Discogs aceita cerca de 25 pedidos por minuto sem
   chave, a Wikipédia limita o IP da nuvem e o script respeita o `Retry-After`):
   ```
   mkdir -p PASTA/bl
   python3 ops/tools/blurbs/facts.py wp PASTA/bl/wp.json      # Wikipédia, em lotes de 20 títulos
   python3 ops/tools/blurbs/facts.py dg PASTA/bl/dg.jsonl     # Discogs; retoma onde parou
   ```
   O Discogs só conta quando a faixa aparece no alinhamento da edição e o artista confere; são
   afastadas compilações, misturas e promos, e escolhida a edição mais antiga.
2. Ver as fichas em formato compacto, 100 de cada vez: `python3 ops/tools/blurbs/show.py PASTA 0 100`.
3. Escrever `PASTA/bl/wN.tsv` (índice, tabulação, texto em inglês, até 230 caracteres, sem aspas
   retas nem travessões) só com o que a ficha diz. Rever antes de aplicar: nada de «his own
   label», «first release» deduzido do número de catálogo, nomes verdadeiros ou géneros de memória.
   Fichas com correspondência errada (ano, formato ou estilo impossíveis) ficam de fora.
4. Aplicar: `python3 ops/tools/blurbs/apply.py PASTA PASTA/bl/wN.tsv` (só substitui textos ainda
   genéricos e acrescenta a fonte a `ops/queue/blurb-sources.tsv`); depois `bash ops/tools/build.sh`.
