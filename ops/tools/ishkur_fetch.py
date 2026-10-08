#!/usr/bin/env python3
"""Lista as faixas do Ishkur's Guide to Electronic Music nos nos que a radio usa.

Metodo (o mesmo das voltas anteriores): le coords.json, calcula o centroide do poligono
de cada no e pede musicbox.php?x=..&y=..&match=genre; os ficheiros vem como
music/<Genero> - (AAAA) Artista - Titulo.mp3.

Uso:
  python3 ops/tools/ishkur_fetch.py SAIDA.tsv

SAIDA.tsv: key  genre  artist  title  year  target_secs  node
(pronta para ops/tools/catalogue.py pending e depois ops/tools/yt_resolve.py)
Precisa de rede para music.ishkur.com.
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request

BASE = "https://music.ishkur.com"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
NODES = [
    ("Dub Techno", "dub_techno"), ("Ragga Jungle", "ragga_jungle"),
    ("Speed Garage", "uk_garage"), ("2-Step Garage", "uk_garage"), ("Future Garage", "uk_garage"),
    ("Dubstep", "dubstep"), ("Nu Skool Breaks", "breakbeat"), ("Breaks", "breakbeat"),
    ("Atmospheric Jungle", "atmospheric_jungle"), ("Liquid Funk", "liquid"),
    ("Ambient Techno", "ambient_techno"), ("Ambient", "ambient"),
    ("Chicago House", "house"), ("Garage", "house"),
    ("Euro Deep House", "deep_house"), ("US Deep House", "deep_house"),
]
RX_FILE = re.compile(r"music/([^\"'<>\n]+?\.mp3)")
RX_PARSE = re.compile(r"^[^/]*?- \((\d{4})\) (.+?) - (.+?)\.mp3$")


def get(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8", "replace")


def centroid(geom):
    pts = []

    def walk(c):
        if c and isinstance(c[0], (int, float)):
            pts.append(c)
        else:
            for x in c:
                walk(x)
    walk(geom["coordinates"])
    return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        return 1
    feats = json.loads(get("/coords.json"))["features"]
    by_name = {f["properties"]["name"]: f for f in feats}
    rows = []
    for node, genre in NODES:
        f = by_name.get(node)
        if not f:
            print("no em falta no coords.json:", node, flush=True)
            continue
        cx, cy = centroid(f["geometry"])
        html = get("/musicbox.php?" + urllib.parse.urlencode({"x": cx, "y": cy, "match": "genre"}))
        seen, n = set(), 0
        for m in RX_FILE.finditer(html):
            fn = urllib.parse.unquote(m.group(1)).replace("%27", "'")
            if fn in seen:
                continue
            seen.add(fn)
            p = RX_PARSE.match(fn)
            if not p:
                continue
            n += 1
            rows.append([f"ish-{slug(node)}-{n:03d}", genre, p.group(2).strip(), p.group(3).strip(),
                         p.group(1), "", node])
        print(f"{node}: {n} faixas", flush=True)
        time.sleep(0.4)
    with open(sys.argv[1], "w", encoding="utf-8") as out:
        out.write("key\tgenre\tartist\ttitle\tyear\ttarget_secs\tnode\n")
        for r in rows:
            out.write("\t".join(" ".join(str(x).replace("\t", " ").split()) for x in r) + "\n")
    print("total:", len(rows), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
