#!/usr/bin/env python3
"""Resolve faixas em videoIds do YouTube, segundo o protocolo de importacao da casa.

Protocolo (regra permanente do Paulo): canal «Artista - Topic» primeiro; se nao houver,
canal oficial do artista ou da editora; se nao houver, outro upload que confirme artista
e faixa no titulo. «A musica tocar e o mais importante», mas nunca aceitar um video que
nao seja a faixa pedida.

Uso:
  python3 ops/tools/yt_resolve.py ENTRADA.tsv SAIDA.tsv [--limit 150] [--sleep 1.4]

ENTRADA.tsv tem cabecalho e as colunas
  key  genre  artist  title  year  target_secs  node
(year, target_secs e node podem ficar vazios; target_secs e a duracao conhecida da faixa).

SAIDA.tsv recebe linhas novas no fim (modo append) com
  key  genre  artist  title  year  status  video_id  channel  secs  yt_title  node  query
As chaves ja presentes na SAIDA sao saltadas, por isso o comando retoma onde parou.

status:
  S5  canal Topic do artista e titulo certo
  S4  canal Topic do artista mas outro titulo (usar o titulo real do video, nunca o da lista)
  S3  canal do proprio artista ou da editora, com artista e titulo no titulo do video
  S2  upload de terceiros com artista e titulo no titulo do video
  M   nada aceitavel (fica registado o melhor candidato para revisao)
  E   erro de rede ou bloqueio do YouTube
Com target_secs, a duracao do video tem de ficar a menos de max(25 s, 18%) do alvo.

Pesquisa: pagina de resultados do YouTube (ytInitialData); se falhar, yt-dlp
(pip install yt-dlp). Cinco erros seguidos param o processo: provavel bloqueio,
reportar ao Paulo em vez de insistir.
"""
import argparse
import json
import math
import os
import random
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
HEADERS = {"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9",
           "Cookie": "SOCS=CAI; CONSENT=YES+cb"}
RX_DATA = re.compile(r'(?:var ytInitialData|window\["ytInitialData"\])\s*=\s*(\{.+?\});\s*</script>', re.S)
GENERIC_TOPIC = {"release topic"}
GENRE_HINT = {"dub_techno": "dub techno", "ragga_jungle": "jungle", "uk_garage": "garage",
              "dubstep": "dubstep", "breakbeat": "breaks", "atmospheric_jungle": "jungle",
              "liquid": "drum and bass", "intelligent_dnb": "drum and bass",
              "ambient_techno": "ambient", "ambient": "ambient", "house": "house",
              "deep_house": "deep house", "lofi_house": "house", "hypnotic_techno": "techno",
              "reggae": "reggae", "dub": "dub", "ska_rocksteady": "ska",
              "oldskool_hardcore": "hardcore"}
OUT_COLS = ["key", "genre", "artist", "title", "year", "status", "video_id", "channel",
            "secs", "yt_title", "node", "query"]


def norm(s):
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    return " ".join(re.sub(r"[^a-z0-9 ]+", " ", s).split())


def strip_paren(s):
    return " ".join(re.sub(r"\(.*?\)|\[.*?\]", " ", s or "").split())


def to_secs(t):
    if not t:
        return 0
    try:
        p = [int(x) for x in t.strip().split(":")]
    except ValueError:
        return 0
    if len(p) == 3:
        return p[0] * 3600 + p[1] * 60 + p[2]
    if len(p) == 2:
        return p[0] * 60 + p[1]
    return 0


def fetch_html(query):
    url = "https://www.youtube.com/results?" + urllib.parse.urlencode(
        {"search_query": query, "hl": "en", "gl": "US"})
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def walk_videos(node, out, limit=10):
    if len(out) >= limit:
        return
    if isinstance(node, dict):
        vr = node.get("videoRenderer")
        if isinstance(vr, dict) and vr.get("videoId"):
            runs = (vr.get("ownerText") or vr.get("longBylineText") or {}).get("runs") or [{}]
            title = "".join(x.get("text", "") for x in (vr.get("title") or {}).get("runs", []))
            secs = to_secs((vr.get("lengthText") or {}).get("simpleText", ""))
            out.append({"vid": vr["videoId"], "channel": runs[0].get("text", ""),
                        "title": title, "secs": secs,
                        "verified": "VERIFIED" in json.dumps(vr.get("ownerBadges") or [])})
            return
        for v in node.values():
            walk_videos(v, out, limit)
    elif isinstance(node, list):
        for v in node:
            walk_videos(v, out, limit)


def search_page(query):
    html = fetch_html(query)
    m = RX_DATA.search(html)
    if not m:
        raise RuntimeError("sem ytInitialData (consentimento ou bloqueio)")
    data = json.loads(m.group(1))
    vids = []
    walk_videos(data.get("contents"), vids)
    return vids


def search_ytdlp(query):
    import yt_dlp  # pip install yt-dlp
    opts = {"quiet": True, "skip_download": True, "extract_flat": "in_playlist",
            "no_warnings": True}
    with yt_dlp.YoutubeDL(opts) as y:
        info = y.extract_info("ytsearch10:" + query, download=False)
    vids = []
    for e in info.get("entries") or []:
        vids.append({"vid": e.get("id", ""), "channel": e.get("channel") or e.get("uploader") or "",
                     "title": e.get("title") or "", "secs": int(e.get("duration") or 0),
                     "verified": bool(e.get("channel_is_verified"))})
    return vids


def search(query):
    try:
        return search_page(query)
    except Exception as first:
        try:
            return search_ytdlp(query)
        except ImportError:
            raise first
        except Exception:
            raise first


STOP = {"the", "and", "of", "dj", "mc", "feat", "ft", "featuring", "presents", "pres", "vs", "with"}
BAD_WORDS = {"cover", "karaoke", "reaction", "tutorial", "8d", "slowed", "sped", "nightcore",
             "hour", "hours", "loop", "lesson", "megamix", "podcast", "album", "ep"}
SOFT_BAD = {"live", "instrumental", "remix", "rmx", "set", "full", "type", "boiler"}


def first_artist(a):
    return re.split(r"\s+(?:feat\.?|ft\.?|featuring|vs\.?|presents|pres\.)\s+|\s*&\s*|,\s*|\s+and\s+",
                    a or "", flags=re.I)[0].strip() or (a or "")


def concat(s):
    return norm(s).replace(" ", "")


def score(c, artist, title, target):
    """Pontuacao de um candidato (ver docstring do modulo). Devolve 0 a 5.5."""
    secs = c["secs"]
    if secs < 90 or secs > 1300:
        return 0.0
    if norm(c["channel"]) in GENERIC_TOPIC:
        return 0.0
    nch, nti = norm(c["channel"]), norm(c["title"])
    want_t = norm(strip_paren(title))
    words_req = set(norm(title).split()) | set(norm(artist).split())
    for w in nti.split():
        if w in BAD_WORDS and w not in words_req:
            return 0.0
        if w in SOFT_BAD and w not in words_req:
            if w in ("remix", "rmx") and ("mix" in words_req or "remix" in words_req):
                continue
            return 0.0
    mixed_penalty = 1.0 if ("mixed" in nti.split() and "mixed" not in words_req) else 0.0
    fa = first_artist(artist)
    aws = [w for w in norm(fa).split() if w not in STOP and len(w) > 1] or norm(fa).split()
    tws = [w for w in want_t.split() if len(w) > 2] or want_t.split()
    padded = " " + nti + " "
    hits = sum(1 for w in tws if (" " + w + " ") in padded)
    t_ok = bool(tws) and (hits >= max(1, math.ceil(len(tws) * 0.6))
                          or (want_t and want_t.replace(" ", "") in nti.replace(" ", "")))
    ch_words, ch_concat = set(nch.split()), nch.replace(" ", "")
    a_in_ch = bool(aws) and all(w in ch_words or w in ch_concat for w in aws)
    a_in_ti = bool(aws) and all((" " + w + " ") in padded for w in aws)
    topic = c["channel"].strip().endswith(" - Topic")
    if topic:
        ch_artist = concat(c["channel"].strip()[:-len(" - Topic")])
        exact = ch_artist in {concat(artist), concat(fa)}
        if t_ok and (exact or a_in_ch):
            s = 5.0
        elif exact:
            s = 4.0
        elif a_in_ti and t_ok:
            s = 4.0
        else:
            s = 1.0
    elif a_in_ch:
        s = 3.0 if t_ok else 1.0
    elif c.get("verified") and a_in_ti and t_ok:
        s = 3.0
    elif a_in_ti and t_ok:
        s = 2.0
    else:
        s = 0.0
    s = max(0.0, s - mixed_penalty) if s >= 2 else s
    if target:
        d = abs(secs - target)
        if d <= max(25, target * 0.18):
            s += 0.5
        elif d > max(60, target * 0.35):
            s = min(s, 1.0)
    return s


def queries_for(row):
    artist, title, genre = row["artist"], strip_paren(row["title"]), row.get("genre", "")
    main = first_artist(artist)
    qs = [f"{artist} {title}"]
    if main != artist:
        qs.append(f"{main} {title}")
    hint = GENRE_HINT.get(genre)
    if hint:
        qs.append(f"{main} {title} {hint}")
    seen, uniq = set(), []
    for q in qs:
        q = " ".join(q.split())
        if q.lower() not in seen:
            seen.add(q.lower())
            uniq.append(q)
    return uniq


def resolve(row, sleep_s):
    target = 0
    try:
        target = int(float(row.get("target_secs") or 0))
    except ValueError:
        target = 0
    best, best_s, best_q, top1 = None, 0.0, "", None
    for i, q in enumerate(queries_for(row)):
        if i:
            time.sleep(sleep_s + random.random() * 0.6)
        vids = search(q)
        if vids and top1 is None:
            top1 = vids[0]
        for c in vids:
            s = score(c, row["artist"], row["title"], target)
            closer = best is not None and s == best_s and target and \
                abs(c["secs"] - target) < abs(best["secs"] - target)
            if s > best_s or closer:
                best, best_s, best_q = c, s, q
        if best_s >= 3:
            break
    if best is None or best_s < 2:
        c = top1 or {"vid": "", "channel": "", "secs": 0, "title": ""}
        return "M", c, best_q
    return "S" + str(int(best_s)), best, best_q


def read_tsv(path):
    with open(path, encoding="utf-8") as f:
        lines = [l.rstrip("\n") for l in f if l.strip() and not l.startswith("#")]
    hdr = lines[0].split("\t")
    rows = []
    for l in lines[1:]:
        p = l.split("\t")
        rows.append({h: (p[i] if i < len(p) else "") for i, h in enumerate(hdr)})
    return rows


def clean(s):
    return " ".join(str(s or "").replace("\t", " ").split())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("entrada")
    ap.add_argument("saida")
    ap.add_argument("--limit", type=int, default=0, help="maximo de faixas nesta chamada")
    ap.add_argument("--sleep", type=float, default=1.4, help="pausa entre pesquisas (s)")
    a = ap.parse_args()

    rows = read_tsv(a.entrada)
    done = set()
    new_file = not os.path.exists(a.saida) or os.path.getsize(a.saida) == 0
    if not new_file:
        for r in read_tsv(a.saida):
            done.add(r.get("key", ""))
    todo = [r for r in rows if r.get("key") not in done]
    if a.limit:
        todo = todo[:a.limit]
    print(f"entrada {len(rows)} | ja feitas {len(done)} | nesta chamada {len(todo)}", flush=True)

    errors, counts = 0, {}
    with open(a.saida, "a", encoding="utf-8") as out:
        if new_file:
            out.write("\t".join(OUT_COLS) + "\n")
        for n, row in enumerate(todo, 1):
            try:
                status, c, q = resolve(row, a.sleep)
                errors = 0
            except Exception as e:
                errors += 1
                status, c, q = "E", {"vid": "", "channel": str(e)[:60], "secs": 0, "title": ""}, ""
                time.sleep(4 * errors)
            counts[status] = counts.get(status, 0) + 1
            if status != "E":
                vals = [row.get("key"), row.get("genre"), row.get("artist"), row.get("title"),
                        row.get("year"), status, c["vid"], c["channel"], c["secs"], c["title"],
                        row.get("node"), q]
                out.write("\t".join(clean(v) for v in vals) + "\n")
                out.flush()
            print(f"{n}/{len(todo)} {status} {row.get('artist')} :: {row.get('title')} -> "
                  f"{c['vid']} [{c['channel']}] {c['secs']}s", flush=True)
            if errors >= 5:
                print("PARAGEM: cinco erros seguidos; provavel bloqueio do YouTube. "
                      "Reportar ao Paulo, nao insistir.", flush=True)
                break
            time.sleep(a.sleep + random.random() * 0.6)
    print("resumo:", json.dumps(counts, ensure_ascii=False), flush=True)
    return 2 if errors >= 5 else 0


if __name__ == "__main__":
    sys.exit(main())
