#!/usr/bin/env bash
# Monta as duas salas a partir das fontes e valida. Correr a partir de qualquer pasta do repositorio.
#   liquid/index.html  sala «liquid» (a unica que recebe funcionalidades novas)
#   index.html         sala antiga, servida na raiz do site (congelada; so recebe dados)
#   labs/arcade-data.js dados do laboratorio da arcada, gerados do catalogo (ops/tools/arcade_data.py)
# O motor da liquid (liquid/l05-engine.html) e gerado por liquid/build-liquid.py a partir de
# radio/e05-engine.html: nunca editar o l05 a mao, editar as transformacoes no build-liquid.py.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE/../.."

python3 liquid/build-liquid.py
python3 ops/tools/arcade_data.py

cat liquid/l01-head.html liquid/l02-body.html radio/e03-data.html liquid/l04-vj.html \
    liquid/l05-engine.html liquid/l06-art.html liquid/l07-focus.html liquid/l08-arcade.html \
    > liquid/index.html

cat radio/e01-head.html radio/e02-body.html radio/e03-data.html radio/e04a-stage.html \
    radio/e04b-stage.html radio/e04c-stage.html radio/e05-engine.html \
    > index.html

python3 ops/tools/validate.py
