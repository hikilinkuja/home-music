#!/usr/bin/env python3
"""Playlists e alinhamentos de mixes do YouTube.

  python3 ops/tools/yt_playlist.py list URL_DA_PLAYLIST SAIDA.tsv
      lista a playlist (yt-dlp, modo plano): video_id  secs  channel  title
      (pip install yt-dlp)

  python3 ops/tools/yt_playlist.py tracklist VIDEO_ID SAIDA.tsv
      le a descricao do video e extrai o alinhamento (linhas com tempo ou numeradas,
      no formato «Artista - Titulo»). Saida pronta para o yt_resolve.py:
        key  genre  artist  title  year  target_secs  node
      A coluna genre fica vazia: preenche-la por criterio proprio (contexto do mix e
      conhecimento do artista) antes de resolver, e declarar classificacoes forcadas.
      Acrescenta ao ficheiro de saida (modo append), para juntar varios mixes.
"""
import json
import os
import re
import sys
import urllib.request

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
HEADERS = {"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9",
           "Cookie": "SOCS=CAI; CONSENT=YES+cb"}
DASHES = "".join(map(chr, (0x2014, 0x2013, 0x2012, 0x2015)))
RX_TS = re.compile(r"^\s*[\[(]?((?:\d{1,2}:)?\d{1,2}:\d{2})[\])]?\s*[-.:|)]*\s*(.+?)\s*$")
RX_NUM = re.compile(r"^\s*(\d{1,2})[.)]\s+(.+?)\s*$")


def clean(s):
    for d in DASHES:
        s = s.replace(d, "-")
    return " ".join(str(s or "").replace("\t", " ").split())


def to_secs(t):
    p = [int(x) for x in t.split(":")]
    return p[0] * 3600 + p[1] * 60 + p[2] if len(p) == 3 else p[0] * 60 + p[1]


def cmd_list(url, out_path):
    import yt_dlp
    opts = {"quiet": True, "skip_download": True, "extract_flat": "in_playlist", "no_warnings": True}
    with yt_dlp.YoutubeDL(opts) as y:
        info = y.extract_info(url, download=False)
    rows = []
    for e in info.get("entries") or []:
        rows.append([e.get("id", ""), int(e.get("duration") or 0),
                     e.get("channel") or e.get("uploader") or "", e.get("title") or ""])
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("video_id\tsecs\tchannel\ttitle\n")
        for r in rows:
            f.write("\t".join(clean(x) for x in r) + "\n")
    print(f"{len(rows)} entradas; mixes acima de 21 min: {sum(1 for r in rows if r[1] > 1260)}")


def watch_info(vid):
    req = urllib.request.Request(f"https://www.youtube.com/watch?v={vid}&hl=en", headers=HEADERS)
    html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
    m = re.search(r"ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var |</script>)", html, re.S)
    if not m:
        raise RuntimeError("sem ytInitialPlayerResponse (consentimento ou bloqueio)")
    vd = json.loads(m.group(1)).get("videoDetails", {})
    return vd.get("title", ""), int(vd.get("lengthSeconds") or 0), vd.get("shortDescription", "")


def split_track(line):
    line = clean(line)
    line = re.sub(r"^\d{1,3}[.)]\s+", "", line)
    if " - " not in line:
        return None
    artist, title = line.split(" - ", 1)
    artist, title = artist.strip(" -"), title.strip(" -")
    if not artist or not title or len(artist) > 80:
        return None
    return artist, title


def cmd_tracklist(vid, out_path):
    title, total, desc = watch_info(vid)
    stamps, numbered = [], []
    for line in desc.splitlines():
        m = RX_TS.match(line)
        if m:
            tr = split_track(m.group(2))
            if tr:
                stamps.append((to_secs(m.group(1)), tr))
            continue
        m = RX_NUM.match(line)
        if m:
            tr = split_track(m.group(2))
            if tr:
                numbered.append(tr)
    rows = []
    if stamps:
        stamps.sort(key=lambda x: x[0])
        for i, (t0, (a, ti)) in enumerate(stamps):
            t1 = stamps[i + 1][0] if i + 1 < len(stamps) else total
            dur = t1 - t0 if t1 > t0 else 0
            rows.append((a, ti, dur if 90 <= dur <= 1300 else ""))
    else:
        rows = [(a, ti, "") for a, ti in numbered]
    new_file = not os.path.exists(out_path) or os.path.getsize(out_path) == 0
    with open(out_path, "a", encoding="utf-8") as f:
        if new_file:
            f.write("key\tgenre\tartist\ttitle\tyear\ttarget_secs\tnode\n")
        for i, (a, ti, dur) in enumerate(rows, 1):
            f.write("\t".join([f"mix-{vid}-{i:02d}", "", clean(a), clean(ti), "", str(dur),
                               clean(title)]) + "\n")
    print(f"{vid}: «{clean(title)}» {len(rows)} faixas no alinhamento")


def main():
    if len(sys.argv) != 4 or sys.argv[1] not in ("list", "tracklist"):
        print(__doc__)
        return 1
    if sys.argv[1] == "list":
        cmd_list(sys.argv[2], sys.argv[3])
    else:
        cmd_tracklist(sys.argv[2], sys.argv[3])
    return 0


if __name__ == "__main__":
    sys.exit(main())
