#!/usr/bin/env python3
"""Gestao do catalogo partilhado radio/e03-data.html (array TRACKS).

Subcomandos:
  pending ENTRADA.tsv SAIDA.tsv
      tira da lista o que ja esta no catalogo (mesmo artista e titulo normalizados)
      e o que consta de ops/queue/exclusions.tsv (artista inteiro, ou so a faixa se houver title).
  add RESOLVIDO.tsv --source ishkur|mix|playlist|weronika|canon|manual [--min 3] [--accept-s2]
      acrescenta ao catalogo as linhas aceites de uma saida do yt_resolve.py.
      --min 3 aceita S3, S4 e S5; --accept-s2 acrescenta S2 (rever antes por amostragem).
      S4 entra com o titulo real do video, nunca com o titulo da lista.
  stats
      contagem por genero.

Cada faixa nova leva ad:"AAAA-MM-DD" (selo «fresh in the crates» durante 14 dias),
s:null, w:null e um blurb curto e factual em ingles (lingua do site). Nunca inventar
avaliacoes, datas ou factos.
"""
import argparse
import datetime
import re
import sys
import unicodedata
from collections import Counter

E03 = "radio/e03-data.html"
EXCL = "ops/queue/exclusions.tsv"
BANNED = {chr(0x2014): "-", chr(0x2013): "-", chr(0x2012): "-", chr(0x2015): "-",
          chr(0x2022): chr(0x00B7)}


def norm(s):
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    s = re.sub(r"\(.*?\)|\[.*?\]", " ", s)
    return re.sub(r"[^a-z0-9]+", "", s)


def first_artist(a):
    return re.split(r"\s+(?:feat\.?|ft\.?|featuring|vs\.?|presents)\s+|\s*&\s*|,\s*|\s+and\s+",
                    a or "", flags=re.I)[0]


def sanitize(s):
    s = str(s or "")
    for k, v in BANNED.items():
        s = s.replace(k, v)
    s = "".join(ch for ch in s if ch >= " ")
    return " ".join(s.split())


def esc(s):
    return sanitize(s).replace("\\", "\\\\").replace('"', '\\"')


def load():
    src = open(E03, encoding="utf-8").read()
    m = re.search(r"(const TRACKS = \[)(.*?)(\n\];)", src, re.S)
    if not m:
        sys.exit("TRACKS nao encontrado em " + E03)
    body = m.group(2)
    vids = set(re.findall(r'v:"([A-Za-z0-9_-]{11})"', body))
    keys = set()
    for a, t in re.findall(r'a:"((?:[^"\\]|\\.)*)",\s*t:"((?:[^"\\]|\\.)*)"', body):
        keys.add((norm(a), norm(t)))
        keys.add((norm(first_artist(a)), norm(t)))
    genres = re.findall(r'\{ g:"([a-z_]+)"', body)
    return src, m, vids, keys, genres


def read_tsv(path):
    with open(path, encoding="utf-8") as f:
        lines = [l.rstrip("\n") for l in f if l.strip() and not l.startswith("#")]
    hdr = lines[0].split("\t")
    return hdr, [{h: (p[i] if i < len(p) else "") for i, h in enumerate(hdr)}
                 for p in (l.split("\t") for l in lines[1:])]


def exclusions():
    """Devolve (artistas excluidos por inteiro, pares (artista, titulo) excluidos)."""
    try:
        _, rows = read_tsv(EXCL)
    except FileNotFoundError:
        return set(), set()
    whole = {norm(r["artist"]) for r in rows if r.get("artist") and not r.get("title")}
    tracks = {(norm(r["artist"]), norm(r["title"])) for r in rows if r.get("artist") and r.get("title")}
    return whole, tracks


def cmd_pending(a):
    _, _, vids, keys, _ = load()
    excl, excl_t = exclusions()
    hdr, rows = read_tsv(a.entrada)
    keep, dup, exc = [], 0, 0
    for r in rows:
        k1 = (norm(r.get("artist")), norm(r.get("title")))
        k2 = (norm(first_artist(r.get("artist"))), norm(r.get("title")))
        if norm(r.get("artist")) in excl or norm(first_artist(r.get("artist"))) in excl \
                or k1 in excl_t or k2 in excl_t:
            exc += 1
            continue
        if k1 in keys or k2 in keys:
            dup += 1
            continue
        keep.append(r)
    with open(a.saida, "w", encoding="utf-8") as out:
        out.write("\t".join(hdr) + "\n")
        for r in keep:
            out.write("\t".join(r.get(h, "") for h in hdr) + "\n")
    print(f"entrada {len(rows)} | ja no catalogo {dup} | excluidas {exc} | pendentes {len(keep)}")


BLURB = {
    "ishkur": "Catalogued under {node} in Ishkur's Guide to Electronic Music.",
    "mix": "Lifted from a mix in the station's crates: {node}.",
    "playlist": "From the station's YouTube crates (2026 import).",
    "weronika": "Hand-picked for Home Music by Weronika, the station's guest selector.",
    "canon": "A fixture of the critics' all-time lists for its genre.",
    "manual": "Imported for Home Music.",
}


def cmd_add(a):
    src, m, vids, keys, _ = load()
    excl, excl_t = exclusions()
    _, rows = read_tsv(a.resolvido)
    ok = {"S5", "S4", "S3"} if a.min <= 3 else ({"S5", "S4"} if a.min == 4 else {"S5"})
    if a.accept_s2:
        ok.add("S2")
    today = a.date or datetime.date.today().isoformat()
    add, skipped = [], Counter()
    for r in rows:
        st, v = r.get("status", ""), r.get("video_id", "")
        if st not in ok or len(v) != 11:
            skipped[st or "?"] += 1
            continue
        title = r.get("yt_title") if st == "S4" else r.get("title")
        if st == "S4":
            title = re.sub(r"\s*[\(\[](official|audio|video|hd|hq|lyric)[^\)\]]*[\)\]]", "", title, flags=re.I)
        artist = r.get("artist")
        k = (norm(artist), norm(title))
        if norm(artist) in excl or norm(first_artist(artist)) in excl or k in excl_t \
                or (norm(r.get("artist")), norm(r.get("title"))) in excl_t:
            skipped["excluida"] += 1
            continue
        if v in vids or k in keys:
            skipped["duplicada"] += 1
            continue
        vids.add(v)
        keys.add(k)
        node = sanitize(r.get("node", "")) or "the station's crates"
        blurb = BLURB.get(a.source, BLURB["manual"]).format(node=node)
        year = r.get("year", "").strip()
        ypart = f" y:{int(year)}," if year.isdigit() else ""
        add.append(f'  {{ g:"{r.get("genre")}", a:"{esc(artist)}", t:"{esc(title)}",{ypart} '
                   f'v:"{v}", s:null, w:null, ad:"{today}",\n    b:"{esc(blurb)}" }},\n')
    if not add:
        print("nada a acrescentar;", dict(skipped))
        return
    block = f"\n  /* ==== import {a.source} {today}: {len(add)} faixas ==== */\n" + "".join(add)
    new = src[:m.end(2)] + block + src[m.end(2):]
    open(E03, "w", encoding="utf-8").write(new)
    print(f"acrescentadas {len(add)} | saltadas {dict(skipped)}")


def cmd_stats(_a):
    _, _, vids, _, genres = load()
    c = Counter(genres)
    for g, n in c.most_common():
        print(f"{g:22s} {n}")
    print("TOTAL", sum(c.values()), "| videoIds unicos", len(vids))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("pending")
    p.add_argument("entrada")
    p.add_argument("saida")
    p.set_defaults(fn=cmd_pending)
    p = sub.add_parser("add")
    p.add_argument("resolvido")
    p.add_argument("--source", required=True, choices=sorted(BLURB))
    p.add_argument("--min", type=int, default=3)
    p.add_argument("--accept-s2", action="store_true")
    p.add_argument("--date", help="AAAA-MM-DD (por omissao, hoje)")
    p.set_defaults(fn=cmd_add)
    p = sub.add_parser("stats")
    p.set_defaults(fn=cmd_stats)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
