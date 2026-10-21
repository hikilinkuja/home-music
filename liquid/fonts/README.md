# Letra da sala liquid

Recursive (Arrow Type, <https://github.com/arrowtype/recursive>), letra variável com os eixos MONO, CASL, wght
(300 a 1000), slnt (0 a -15) e CRSV. Licença: SIL Open Font License 1.1 (`OFL.txt`, nesta pasta).

- `recursive-latin-full-normal.woff2` e `recursive-latin-ext-full-normal.woff2`: subconjuntos latino e latino
  alargado com todos os eixos, sem alteração, do pacote npm `@fontsource-variable/recursive` 5.3.0 (gerado a partir
  do Google Fonts); o latino alargado só se descarrega se a página tiver esses caracteres (`unicode-range`).
- Escolhida pelo Paulo a 2026-10-19 (estudo em `ops/notes/2026-10-19/fontes-estudo.md`): monoespaçada e linear nos
  rótulos (`"MONO" 1, "CASL" 0`), casual e proporcional nas frases (`"MONO" 0, "CASL" 0.6`). Regras no `:root` do
  `liquid/l01-head.html`; o `ops/tests/t-ui.js` verifica.
