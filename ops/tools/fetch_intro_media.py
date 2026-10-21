#!/usr/bin/env python3
"""Descarrega para sfx/ as duas gravacoes da abertura da sala liquid, sem as alterar.

- sfx/intro-sound-killah.mp3: Koncrete Roots, "Sound Killah" (Dubophonic, DPH011), do Internet
  Archive; CC BY-NC-ND 4.0, por isso o ficheiro fica inteiro e igual ao original (MD5 conferido
  com os metadados do proprio Internet Archive).
- sfx/vinyl-625771.mp3: o vinil da agulha, freesound 625771 (pre-visualizacao hq), CC0.

A abertura (liquid/l06-art.html) toca primeiro estas copias e so usa as fontes externas como
reserva; o archive.org caiu varias vezes entre agosto e outubro de 2026 e a abertura ficava muda.
Correr numa ligacao com acesso ao archive.org e ao freesound (o fluxo .github/workflows/
intro-media.yml corre-o no GitHub e faz o commit; da nuvem do Claude estes anfitrioes estao
bloqueados). So biblioteca padrao: funciona em Linux, macOS e Windows.

Uso: python3 ops/tools/fetch_intro_media.py [--force]
"""
import hashlib
import json
import os
import sys
import time
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
UA = {"User-Agent": "home-music-intro-fetch/1.0 (+https://hikilinkuja.github.io/home-music/)"}
ITEM, NAME = "DPH011", "04_Koncrete_Roots_Sound_Killah.mp3"
FILES = [
    # (destino, url, minimo de bytes, md5 esperado: "archive" = pedir aos metadados do item)
    ("sfx/intro-sound-killah.mp3", "https://archive.org/download/%s/%s" % (ITEM, NAME), 600000, "archive"),
    ("sfx/vinyl-625771.mp3", "https://cdn.freesound.org/previews/625/625771_9351406-hq.mp3", 100000, None),
]


def get(url, tries=5):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                return r.read()
        except Exception as e:  # rede, 5xx, tempo esgotado: tentar outra vez
            last = e
            print("  tentativa %d falhou: %s" % (i + 1, e), file=sys.stderr)
            time.sleep(5 * (i + 1))
    raise SystemExit("FAIL %s: %s" % (url, last))


def archive_md5():
    meta = json.loads(get("https://archive.org/metadata/%s/files" % ITEM))
    for f in meta.get("result", []):
        if f.get("name") == NAME and f.get("md5"):
            return f["md5"].lower()
    raise SystemExit("FAIL metadados de %s sem MD5 para %s" % (ITEM, NAME))


def is_mp3(b):
    # etiqueta ID3 no inicio, ou sincronia de trama MPEG (11 bits a 1)
    return b[:3] == b"ID3" or (len(b) > 1 and b[0] == 0xFF and (b[1] & 0xE0) == 0xE0)


def main():
    force = "--force" in sys.argv
    for dest, url, minimum, md5 in FILES:
        path = os.path.join(ROOT, dest)
        if os.path.exists(path) and not force:
            print("ja existe: %s (%d bytes); --force para descarregar outra vez" % (dest, os.path.getsize(path)))
            continue
        print("a descarregar %s" % url)
        body = get(url)
        if len(body) < minimum:
            raise SystemExit("FAIL %s: so %d bytes" % (dest, len(body)))
        if not is_mp3(body):
            raise SystemExit("FAIL %s: nao parece MP3 (comeca por %r)" % (dest, body[:8]))
        got = hashlib.md5(body).hexdigest()
        if md5 == "archive":
            want = archive_md5()
            if got != want:
                raise SystemExit("FAIL %s: MD5 %s, o Internet Archive diz %s" % (dest, got, want))
        with open(path + ".part", "wb") as fh:
            fh.write(body)
        os.replace(path + ".part", path)
        print("ok %s: %d bytes, md5 %s" % (dest, len(body), got))


if __name__ == "__main__":
    main()
