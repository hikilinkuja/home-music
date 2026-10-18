"""Resumo do ensaio de anuncios (RESULTADOS.jsonl do ops/tools/yt_ads_probe.py)."""
import json, sys, statistics
from collections import defaultdict

R = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]
by = defaultdict(list)
for r in R:
    by[r["arm"]].append(r)
ARMS = [a for a in ("VIS", "HID", "OFF") if a in by]
n_trials = max(r["n"] for r in R)
print(f"ensaios: {n_trials} videos x {len(ARMS)} leitores")


def ready(r):
    return r.get("ready") is not None


for a in ARMS:
    L = by[a]
    rd = [r["ready"] for r in L if ready(r)]
    no_rel = [r for r in L if ready(r) and r.get("reloaded") is None]
    rel = [r for r in L if r.get("reloaded") is not None]
    rel_ok = [r for r in rel if ready(r)]
    ads = [r for r in L if r.get("ad_seen")]
    print(f"\n{a}: musica a tocar em 90 s: {len(rd)}/{len(L)}"
          f" (<=30 s: {sum(1 for x in rd if x <= 30)}, <=60 s: {sum(1 for x in rd if x <= 60)})"
          f"; mediana {statistics.median(rd) if rd else '-'} s")
    print(f"  sem recarregar: {len(no_rel)}; parados 15 s e recarregados: {len(rel)}, dos quais tocaram: {len(rel_ok)}")
    print(f"  com anuncio: {len(ads)} (topic {sum(1 for r in ads if r['kind']=='topic')}/"
          f"{sum(1 for r in L if r['kind']=='topic')}, outros {sum(1 for r in ads if r['kind']=='other')}/"
          f"{sum(1 for r in L if r['kind']=='other')}); anuncio mais longo visto {max([r.get('ad_max', 0) for r in L] or [0])} s")
    print(f"  anuncio com som em algum momento: {sum(1 for r in L if r.get('ad_unmuted'))}")
    ap, aa, mm = (sum(r.get(k, 0) for r in L) for k in ("ad_polls", "ad_polls_api", "api_ad_mismatch"))
    print(f"  detecao pela API: {aa}/{ap} amostras de anuncio vistas como anuncio; PLAYING durante anuncio: {mm}")
    nev = [r for r in L if not ready(r)]
    if nev:
        kinds = defaultdict(int)
        for r in nev:
            tr = r.get("trace") or []
            last = tr[-1] if tr else None
            kinds["parado no zero sem anuncio" if last and last[2] in (0, None) and not last[3]
                  else ("parado em anuncio" if last and last[3] else "outro")] += 1
        print(f"  sem musica aos 90 s: {dict(kinds)}")
    if a != "OFF":
        rs = [r for r in L if ready(r)]
        ok = [r for r in rs if r.get("resume") is not None and r["resume"] <= 2]
        print(f"  retoma depois de 20 s parado: {len(ok)}/{len(rs)} em <=2 s; anuncio na retoma: "
              f"{sum(1 for r in rs if r.get('resume_ad'))}")

print("\nemparelhado por video (musica em 90 s):")
idx = defaultdict(dict)
for r in R:
    idx[r["n"]][r["arm"]] = r
for x, y in (("VIS", "HID"), ("VIS", "OFF"), ("HID", "OFF")):
    if x in by and y in by:
        c = defaultdict(int)
        for n, d in idx.items():
            c[(ready(d[x]), ready(d[y]))] += 1
        print(f"  {x} e {y} ambos: {c[(True, True)]}; so {x}: {c[(True, False)]}; so {y}: {c[(False, True)]}; nenhum: {c[(False, False)]}")
print("\npor video (VIS / HID / OFF: segundos ate a musica, a=anuncio, r=recarregado):")
for n in sorted(idx):
    d = idx[n]
    cells = []
    for a in ARMS:
        r = d[a]
        cells.append(f"{r.get('ready')}{'a' if r.get('ad_seen') else ''}{'r' if r.get('reloaded') is not None else ''}")
    print(f"  {n:2d} {d[ARMS[0]]['kind']:5s} {d[ARMS[0]]['vid']}  " + "  ".join(f"{c:>8s}" for c in cells))
