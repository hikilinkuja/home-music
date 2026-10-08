#!/usr/bin/env python3
"""Portao de qualidade antes de publicar. Sai com codigo 1 se algo falhar.

Verifica:
  - sintaxe JavaScript do catalogo e de cada <script> inline das duas salas (node --check);
  - ausencia de travessao (U+2014), meia-risca (U+2013) e marcador (U+2022) nos ficheiros publicados;
  - videoIds com 11 caracteres e sem duplicados;
  - todos os generos usados existem em GENRES (e03) e em GBPM (radio/e05-engine.html);
  - as duas salas montadas contem o catalogo inteiro.
Uso: python3 ops/tools/validate.py   (a partir da raiz do repositorio)
"""
import os
import re
import subprocess
import sys
import tempfile
from collections import Counter

PAGES = ["index.html", "liquid/index.html"]
E03 = "radio/e03-data.html"
BANNED = {chr(0x2014): "travessao", chr(0x2013): "meia-risca", chr(0x2022): "marcador"}
fails = []


def node_check(code, label, module=False):
    suffix = ".mjs" if module else ".js"
    with tempfile.NamedTemporaryFile("w", suffix=suffix, delete=False, encoding="utf-8") as f:
        f.write(code)
        path = f.name
    r = subprocess.run(["node", "--check", path], capture_output=True, text=True)
    os.unlink(path)
    if r.returncode != 0:
        fails.append(f"sintaxe JS em {label}: {r.stderr.strip().splitlines()[-1] if r.stderr else '?'}")


def scripts(html):
    for m in re.finditer(r"<script(?P<attrs>[^>]*)>(?P<body>.*?)</script>", html, re.S | re.I):
        attrs = m.group("attrs").lower()
        if "src=" in attrs:
            continue
        t = re.search(r'type\s*=\s*["\']?([^"\'\s>]+)', attrs)
        typ = t.group(1) if t else ""
        if typ in ("", "text/javascript", "application/javascript"):
            yield m.group("body"), False
        elif typ == "module":
            yield m.group("body"), True


def main():
    e03 = open(E03, encoding="utf-8").read()
    for i, (code, mod) in enumerate(scripts(e03)):
        node_check(code, f"{E03} bloco {i + 1}", mod)
    body = re.search(r"const TRACKS = \[(.*?)\n\];", e03, re.S).group(1)
    vids = re.findall(r'v:"([^"]*)"', body)
    bad = [v for v in vids if not re.fullmatch(r"[A-Za-z0-9_-]{11}", v)]
    if bad:
        fails.append(f"videoIds invalidos: {bad[:5]}")
    dups = [v for v, n in Counter(vids).items() if n > 1]
    if dups:
        fails.append(f"videoIds duplicados: {dups[:5]}")
    used = Counter(re.findall(r'\{ g:"([a-z_]+)"', body))
    gblock = re.search(r"const GENRES = \{(.*?)\n\};", e03, re.S)
    gkeys = set(re.findall(r"\n  ([a-z_]+): \{", gblock.group(0))) if gblock else set()
    if set(used) - gkeys:
        fails.append(f"generos sem entrada em GENRES: {sorted(set(used) - gkeys)}")
    e05 = open("radio/e05-engine.html", encoding="utf-8").read()
    gb = re.search(r"var GBPM=\{(.*?)\};", e05, re.S)
    gbkeys = set(re.findall(r"([a-z_]+):", gb.group(1))) if gb else set()
    if set(used) - gbkeys:
        fails.append(f"generos sem BPM em GBPM: {sorted(set(used) - gbkeys)}")
    for page in PAGES + [E03]:
        txt = open(page, encoding="utf-8").read()
        for ch, name in BANNED.items():
            if ch in txt:
                fails.append(f"{name} ({ch!r}) em {page}: {txt.count(ch)} ocorrencias")
    for page in PAGES:
        html = open(page, encoding="utf-8").read()
        for i, (code, mod) in enumerate(scripts(html)):
            node_check(code, f"{page} script {i + 1}", mod)
        n = len(re.findall(r'\{ g:"[a-z_]+"', html))
        if n < len(vids):
            fails.append(f"{page} tem {n} faixas, o catalogo tem {len(vids)}: montar de novo")
    print(f"catalogo: {len(vids)} faixas, {len(used)} generos")
    for g, n in used.most_common():
        print(f"  {g:22s} {n}")
    if fails:
        print("\nFALHAS:")
        for f in fails:
            print(" -", f)
        return 1
    print("\nvalidacao OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
