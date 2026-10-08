#!/usr/bin/env bash
# Testes da sala liquid: monta o site (build.sh, com validacao) e corre os testes no Chromium com o
# YouTube simulado. Uso, a partir de qualquer pasta do repositorio:
#   bash ops/tests/run.sh                 todos (cerca de 6 minutos)
#   bash ops/tests/run.sh art devlog      so os indicados (art gate rain devlog intro ritual)
#   NOBUILD=1 bash ops/tests/run.sh ...   sem montar antes
# Sai com codigo 1 se algum teste falhar. Nao publicar com falhas.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE/../.."

if [ -z "${NOBUILD:-}" ]; then
  bash ops/tools/build.sh > /tmp/hm-build.log 2>&1 || { tail -20 /tmp/hm-build.log; echo "FAIL build"; exit 1; }
  echo "build: $(tail -1 /tmp/hm-build.log)"
fi

ALL="art gate rain devlog intro ritual"
LIST="${*:-$ALL}"
fail=0
for t in $LIST; do
  f="$HERE/t-$t.js"
  [ -f "$f" ] || { echo "FAIL teste desconhecido: $t"; fail=1; continue; }
  echo "== $t"
  out="$(node "$f" 2>&1)"; rc=$?
  printf '%s\n' "$out" | grep -E '^(PASS|FAIL|WARN|[a-z]+: [0-9]+/[0-9]+)'
  [ $rc -eq 0 ] || { fail=1; printf '%s\n' "$out" | grep -vE '^(PASS|FAIL|WARN)' | grep -iE 'excecao|error' | head -5; }
done
[ $fail -eq 0 ] && echo "TODOS OS TESTES PASSAM" || echo "HA FALHAS: nao publicar"
exit $fail
