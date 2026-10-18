# Auditoria de UI (interface de utilizador) e UX (experiência de utilizador) da sala liquid, por rondas

Prompt aprovado pelo Paulo a 2026-10-18. Cada sessão executa uma ronda: basta escrever «executa a
ronda N de ops/prompts/ui-audit.md». A ronda 0 está feita (`ops/notes/2026-10-18/ui-audit.md`).

## Regras da tarefa
- Segue o CLAUDE.md e lê o ops/HANDOFF.md antes de começar.
- Executa só a ronda indicada. No fim, para, atualiza o ops/HANDOFF.md, regista a volta no
  ops/LOG.md e entrega o relatório.
- O que for proposta (paleta, escala tipográfica, termos novos, cortes de conteúdo) fica em
  texto até o Paulo escolher. Só se implementa o que ele aprovar.
- Trabalha sozinho, sem subagentes. Esforço high; max nas rondas que tocarem no motor.

## Âmbito
- Auditoria completa: liquid/l01-head.html, l02-body.html, l06-art.html, l07-focus.html
  (sala de foco), l08-arcade.html e todos os textos de interface.
- l04-vj.html: só a camada visível; é motor, com as regras do motor.
- Só limpeza de código: l03-plog.html, l09-dev.html (painel interno ?dev) e
  liquid/build-liquid.py.
- Fora do âmbito: a sala antiga (index.html na raiz e radio/e01 a e05), radio/index.html,
  o catálogo e os textos das faixas (campo b).
- Nunca editar à mão liquid/index.html nem liquid/l05-engine.html.
- A interface continua em inglês.

## Método comum
- Ver antes de julgar: capturas de ecrã no Chromium com o YouTube simulado, a 390 px e a 1440 px
  de largura, de cada estado relevante. Ferramentas: `node ops/tools/ui_audit.js PASTA`,
  `python3 ops/tools/ui_report.py PASTA`, `python3 ops/tools/ui_static.py PASTA` (ver a secção 9 do
  relatório da ronda 0). As capturas ficam na pasta temporária da sessão, nunca no repositório.
- Inventários por script (contagens, valores, onde ocorrem). Ler resumos, não saídas inteiras.
- Cada constatação indica: onde (ficheiro:linha ou seletor, e a captura), o problema, o
  critério violado, a proposta e o custo (baixo, médio, alto). Separar o que é medido
  (contraste, contagens) do que é juízo.
- Implementação aprovada: mudanças pequenas e reversíveis; bash ops/tools/build.sh e
  bash ops/tests/run.sh sem FAIL antes de publicar; diff revisto antes do commit se tocar
  no l04 ou no build-liquid.py; cada regra visual verificável traz o seu teste em
  ops/tests/; commit com a versão seguinte, segundo o CLAUDE.md.

## Ronda 0: levantamento (só leitura, nada se altera) (feita a 2026-10-18)
Entregar ops/notes/<data>/ui-audit.md com:
- Tipografia: famílias, tamanhos, pesos, espaçamento entre letras, altura de linha e uso
  de maiúsculas, em tabela (valor, ocorrências, onde), incluindo o texto desenhado em canvas.
- Cor: todas as cores (hex, rgb, rgba, nomes, gradientes, cores definidas em JavaScript e
  em canvas), agrupadas por proximidade e pelo papel que desempenham; contraste de cada par
  real de texto e fundo, com a lista dos que falham as WCAG 2.2 nível AA.
- Conteúdo e densidade: por ecrã e por painel, quantos elementos, botões e linhas de texto
  estão visíveis; onde há sobreposição, texto ilegível sobre o vídeo ou o canvas, ou
  informação repetida.
- Termos: todas as etiquetas, títulos, dicas (title), textos de exemplo nos campos
  (placeholder) e mensagens visíveis, com o que a função faz de facto (lido no código) e a
  discrepância, se houver.
- Código: regras de CSS (folhas de estilo) sem correspondência no DOM (árvore de elementos
  da página), regras duplicadas ou sobrepostas, funções e variáveis JavaScript sem
  chamadas, código comentado e restos de versões antigas.
- As dez constatações com maior ganho por custo, por ordem.

## Ronda 1: termos
Tabela: termo atual, o que faz, problema, duas ou três alternativas com o comprimento em
caracteres (a barra de botões tem pouco espaço), recomendação. Tratar o «Gift a tune» em
todos os pontos onde aparece, para que o termo novo fique coerente: botão, título, texto do
painel, botões, nota de rodapé, texto da nota enviada ao GitHub e linha «a present from» no
cartão. Tratar também os outros termos da secção 5 do relatório da ronda 0 e os factos errados
do painel The Sound (secção 4.3). Implementar só os termos que o Paulo escolher.

## Ronda 2: cores
Propor uma paleta de papéis em variáveis CSS (:root), com o menor número de cores que cubra
os usos reais. Cada cor leva papel definido, contraste medido e amostra numa página HTML
(linguagem de marcação de hipertexto) na pasta temporária, com os pares lado a lado.
Mapear cada cor atual para uma variável ou justificar a exceção (por exemplo, as cores dos
campos visuais do l04 e o tema da Dub Desk). Depois da aprovação: substituir os valores literais
pelas variáveis e acrescentar um teste que falhe se aparecer uma cor literal fora da lista de
exceções.

## Ronda 3: tipografia
Manter a família, salvo proposta fundamentada. Propor uma escala curta (cinco ou seis
tamanhos), dois ou três valores de espaçamento entre letras e regras para as maiúsculas,
com capturas de antes e depois. Indicar os tamanhos mínimos efetivamente desenhados no
telemóvel e propor um mínimo, dizendo que a WCAG não fixa nenhum. Depois da aprovação:
variáveis CSS e um teste equivalente ao das cores.

## Ronda 4: conteúdo e densidade
Para cada ecrã ou painel sobrecarregado: o que é essencial, o que passa para um segundo
nível (gaveta, dica, painel) e o que pode sair, com captura de antes e maquete de depois.
Prioridades: cartão do canto inferior esquerdo, barra de botões no telemóvel, sala de foco.
Nenhuma funcionalidade sai sem decisão do Paulo.

## Ronda 5: limpeza de código
Atualizar o inventário de código da ronda 0 e remover só o que se prova não ser usado.
Prova por ocorrência: pesquisa no código e cobertura de CSS no Chromium. A cobertura só
vale para os estados visitados, por isso uma regra só sai se não for usada em nenhum estado
nem referida no JavaScript (classes acrescentadas dinamicamente). O comportamento fica
idêntico: os testes passam antes e depois, e as capturas não mostram diferenças além das
esperadas. Relatório com as linhas removidas por ficheiro.

## Relatório de cada ronda
O que foi feito, o que foi medido, o que falhou e porquê, as decisões que cabem ao Paulo (com
recomendação) e o que fica para a ronda seguinte.
