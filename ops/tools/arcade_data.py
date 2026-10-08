#!/usr/bin/env python3
"""Gera labs/arcade-data.js (dados do laboratorio labs/arcade.html) a partir do catalogo.

Fontes:
  radio/e03-data.html     BLOCKS e GENRES (copiados tal como estao) e TRACKS
  radio/e05-engine.html   GBPM
O catalogo e avaliado pelo node (o mesmo que o validate.py usa), sem analisar JavaScript
com expressoes regulares. De cada faixa so seguem os campos que o laboratorio usa:
g, a, t, y (quando existe) e v; o resto (blurbs, ligacoes, datas de entrada) fica no e03.

Uso: python3 ops/tools/arcade_data.py   (a partir de qualquer pasta; o build.sh chama-o)
"""
import json
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
E03 = os.path.join(ROOT, "radio", "e03-data.html")
E05 = os.path.join(ROOT, "radio", "e05-engine.html")
OUT = os.path.join(ROOT, "labs", "arcade-data.js")
HEAD = "/* dados do catalogo para os laboratorios; gerado a partir do e03 por ops/tools/arcade_data.py (nao editar a mao) */\n"


def tracks_via_node(e03):
    code = re.search(r"<script>(.*)</script>", e03, re.S).group(1)
    code += "\nprocess.stdout.write(JSON.stringify(TRACKS.map(function(t){" \
            " return {g:t.g, a:t.a, t:t.t, y:(t.y||null), v:t.v}; })));\n"
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(code)
        path = f.name
    try:
        r = subprocess.run(["node", path], capture_output=True, text=True, encoding="utf-8")
    finally:
        os.unlink(path)
    if r.returncode != 0:
        # o node poe o local e a mensagem do erro no inicio; o fim e so pilha interna
        head = []
        for ln in r.stderr.strip().splitlines():
            head.append(ln)
            if re.match(r"\w*Error\b", ln):
                break
        sys.exit("node falhou ao ler o catalogo (linha contada dentro do <script> do e03):\n"
                 + "\n".join(head[:8]))
    return json.loads(r.stdout)


def js(s):
    return json.dumps(s, ensure_ascii=False)


def main():
    e03 = open(E03, encoding="utf-8").read()
    e05 = open(E05, encoding="utf-8").read()
    blocks = re.search(r"^const BLOCKS = \{.*?\n\};", e03, re.S | re.M).group(0)
    genres = re.search(r"^const GENRES = \{.*?\n\};", e03, re.S | re.M).group(0)
    gbpm = re.search(r"var GBPM=\{(.*?)\};", e05, re.S).group(1).strip()
    tracks = tracks_via_node(e03)
    lines = []
    for t in tracks:
        y = f" y:{int(t['y'])}," if t.get("y") else ""
        lines.append(f"  {{ g:{js(t['g'])}, a:{js(t['a'])}, t:{js(t['t'])},{y} v:{js(t['v'])} }}")
    out = (HEAD + blocks + "\n" + genres + "\n"
           + f"/* {len(tracks)} faixas */\nconst TRACKS = [\n" + ",\n".join(lines) + "\n];\n"
           + "const GBPM = { " + gbpm + " };\n")
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(out)
    print(f"labs/arcade-data.js: {len(tracks)} faixas, {len(out) // 1024} KB")


if __name__ == "__main__":
    main()
