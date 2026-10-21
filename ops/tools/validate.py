#!/usr/bin/env python3
"""Portao de qualidade antes de publicar. Sai com codigo 1 se algo falhar.

Verifica:
  - sintaxe JavaScript do catalogo e de cada <script> inline das duas salas (node --check);
  - ausencia de travessao (U+2014), meia-risca (U+2013) e marcador (U+2022) nos ficheiros publicados;
  - videoIds com 11 caracteres e sem duplicados;
  - todos os generos usados existem em GENRES (e03) e em GBPM (radio/e05-engine.html);
  - as duas salas montadas contem o catalogo inteiro;
  - liquid/focus-evidence.json (zona «why?» da sala de foco) e JSON valido, com campos, forcas e
    estados conhecidos, ids unicos, e cobre todos os data-why e why: do liquid/l07-focus.html;
  - as gravacoes da abertura e da agulha (SFX_MEDIA, v5.8), pedidas pela sala liquid, existem no
    repositorio e parecem MP3 completos (sem elas, a abertura volta a depender do archive.org; trazer
    com ops/tools/fetch_intro_media.py ou com o fluxo .github/workflows/intro-media.yml).
Uso: python3 ops/tools/validate.py   (a partir da raiz do repositorio)
"""
import json
import os
import re
import subprocess
import sys
import tempfile
from collections import Counter

PAGES = ["index.html", "liquid/index.html"]
EVID = "liquid/focus-evidence.json"
FOCUS = "liquid/l07-focus.html"
EVSTATUS = {"in room", "tip", "proposed", "not planned"}
E03 = "radio/e03-data.html"
SFX_MEDIA = ["sfx/intro-sound-killah.mp3", "sfx/vinyl-625771.mp3"]
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
        lines = r.stderr.strip().splitlines()
        msg = next((l for l in lines if re.match(r"\w*Error\b", l)), lines[0] if lines else "?")
        fails.append(f"sintaxe JS em {label}: {msg}")


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


def evidence_check():
    """Base de provas da zona «why?» da sala de foco (liquid/focus-evidence.json)."""
    try:
        txt = open(EVID, encoding="utf-8").read()
        ev = json.loads(txt)
    except (OSError, ValueError) as e:
        fails.append(f"{EVID} ilegivel: {e}")
        return 0
    for ch, name in BANNED.items():
        if ch in txt:
            fails.append(f"{name} ({ch!r}) em {EVID}: {txt.count(ch)} ocorrencias")
    levels = set(ev.get("levels", {}))
    ids = []
    for e in ev.get("entries", []):
        miss = [k for k in ("id", "status", "decision", "finding", "strength", "sources") if not e.get(k)]
        if miss:
            fails.append(f"{EVID}: entrada {e.get('id', '?')} sem {miss}")
        if e.get("strength") not in levels:
            fails.append(f"{EVID}: {e.get('id')} com forca desconhecida {e.get('strength')!r}")
        if e.get("status") not in EVSTATUS:
            fails.append(f"{EVID}: {e.get('id')} com estado desconhecido {e.get('status')!r}")
        for src in e.get("sources", []):
            if not src.get("cite"):
                fails.append(f"{EVID}: {e.get('id')} com fonte sem cite")
        ids.append(e.get("id"))
    dups = [i for i, n in Counter(ids).items() if n > 1]
    if dups:
        fails.append(f"{EVID}: ids repetidos {dups}")
    focus = open(FOCUS, encoding="utf-8").read()
    used = set(re.findall(r'(?:data-why="|why:")([a-z0-9-]+)"', focus))
    if used - set(ids):
        fails.append(f"{FOCUS} pede provas que nao existem: {sorted(used - set(ids))}")
    return len(ids)


def media_check():
    """Gravacoes servidas pelo proprio site que a sala liquid pede (sfx/*.mp3)."""
    html = open("liquid/index.html", encoding="utf-8").read()
    # o sfx/dawn-mc.mp3 (voz do «dawn override») ainda nao existe e o HMDAWN salta-o: fica de fora
    names = [n for n in SFX_MEDIA if f'"../{n}"' in html]
    for n in names:
        if not os.path.isfile(n):
            fails.append(f"{n} pedido pela sala liquid e ausente (a abertura voltaria a depender da fonte externa): "
                         "trazer com ops/tools/fetch_intro_media.py ou o fluxo .github/workflows/intro-media.yml")
            continue
        head = open(n, "rb").read(4)
        if os.path.getsize(n) < 50000 or not (head[:3] == b"ID3" or (head[0] == 0xFF and head[1] & 0xE0 == 0xE0)):
            fails.append(f"{n} nao parece um MP3 completo ({os.path.getsize(n)} bytes)")
    return len(names)


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
    nev = evidence_check()
    nmed = media_check()
    print(f"catalogo: {len(vids)} faixas, {len(used)} generos; provas da sala de foco: {nev}; gravacoes em sfx/: {nmed}")
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
