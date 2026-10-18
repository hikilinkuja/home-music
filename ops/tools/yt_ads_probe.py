"""Ensaio emparelhado: anuncios do YouTube num leitor visivel, escondido (opacidade 0, como o
leitor B da radio) e fora do ecra de 1 por 1 pixel (como a sala de foco).

Para cada video da amostra, os tres leitores carregam o mesmo video ao mesmo tempo, cada um no
seu contexto (cookies proprios, limpos antes de cada ensaio). Todos mudos (API mute() e Chrome
com --mute-audio: nada se ouve no Mac). Regras do motor proposto, so com a API:
  progresso = getCurrentTime() a mudar (anuncio ou musica);
  15 s sem progresso -> recarregar o video uma vez; limite de 90 s.
Depois de a musica tocar (estado 1, sem anuncio), VIS e HID param no zero, HID fica visivel
(como o prato que vai para o ar), esperam 20 s e voltam a tocar: mede-se se entra sem anuncio.
O quadro de anuncio (classe ad-showing no leitor, video mudo ou nao) le-se dentro do iframe so
para diagnostico e para validar a detecao pela API.

Uso (so numa ligacao domestica, com o Google Chrome instalado e pip install playwright; da nuvem o
YouTube esconde o conteudo licenciado e os anuncios, e o ensaio nao mede nada):
  python3 ops/tools/yt_ads_probe.py AMOSTRA.tsv RESULTADOS.jsonl
  python3 ops/tools/yt_ads_summary.py RESULTADOS.jsonl
AMOSTRA.tsv: uma linha por video, "tipo<TAB>videoId" (tipo livre, por exemplo topic ou other).
Abre tres janelas pequenas do Chrome, num perfil temporario, sem som (--mute-audio).
Primeira corrida e resultados: ops/notes/2026-10-18/ads-probe.txt.
"""
import asyncio, json, math, sys, time
from playwright.async_api import async_playwright

URL = "https://hikilinkuja.github.io/home-music/xp-ads.html"
PAGE = ("<!doctype html><html><head><meta charset='utf-8'></head>"
        "<body style='margin:0;background:#111'>"
        "<script src='https://www.youtube.com/iframe_api'></script></body></html>")
RADIO_VARS = {"autoplay": 0, "controls": 0, "disablekb": 1, "fs": 0, "iv_load_policy": 3,
              "modestbranding": 1, "rel": 0, "playsinline": 1}
FOCUS_VARS = {"autoplay": 0, "controls": 0, "playsinline": 1}
ARMS = {
    "VIS": {"css": "position:absolute;left:20px;top:20px;width:300px;height:200px;opacity:1",
            "vars": RADIO_VARS, "w": "100%", "h": "100%", "x": 0},
    "HID": {"css": "position:absolute;left:20px;top:20px;width:300px;height:200px;opacity:0",
            "vars": RADIO_VARS, "w": "100%", "h": "100%", "x": 400},
    "OFF": {"css": "position:absolute;left:-9999px;top:0",
            "vars": FOCUS_VARS, "w": "1", "h": "1", "x": 800},
}
SETUP = """async ([css, vars, w, h]) => {
  await new Promise(r => { (function wt(){ if (window.YT && YT.Player) r(); else setTimeout(wt, 150); })(); });
  var box = document.createElement('div'); box.id = 'box'; box.style.cssText = css;
  var d = document.createElement('div'); d.id = 'pl'; box.appendChild(d); document.body.appendChild(box);
  vars.origin = location.origin; vars.widget_referrer = location.href;
  await new Promise(res => { new YT.Player('pl', { width: w, height: h, playerVars: vars,
    events: { onReady: function(e){ window.PP = e.target; res(); } } }); });
  return 'ok';
}"""
API = "() => [PP.getPlayerState(), Math.round(PP.getCurrentTime()*10)/10, PP.isMuted()]"
FRAME = """() => { var mp = document.querySelector('#movie_player');
  var vs = [...document.querySelectorAll('video')].map(v => [v.muted, Math.round(v.currentTime*10)/10, v.paused]);
  return { ad: !!(mp && mp.classList.contains('ad-showing')), vids: vs }; }"""
CAP, STALL, PAUSE = 90.0, 15.0, 20.0


def ok(x):
    return x is not None and not (isinstance(x, float) and math.isnan(x))


async def frame_info(pg):
    for f in pg.frames:
        if "youtube.com/embed" in f.url:
            try:
                return await f.evaluate(FRAME)
            except Exception as e:
                return {"err": str(e)[:50]}
    return {}


async def fresh_page(ctx, pg, arm):
    await ctx.clear_cookies()
    try:
        cdp = await ctx.new_cdp_session(pg)
        for o in ("https://www.youtube.com", "https://youtube.com", "https://www.google.com",
                  "https://googleads.g.doubleclick.net", "https://static.doubleclick.net"):
            await cdp.send("Storage.clearDataForOrigin", {"origin": o, "storageTypes": "all"})
        await cdp.detach()
    except Exception:
        pass
    await pg.goto(URL + "?t=%d" % (time.time() * 1000))
    a = ARMS[arm]
    await pg.evaluate(SETUP, [a["css"], a["vars"], a["w"], a["h"]])


async def run_arm(arm, ctx, pg, vid):
    r = {"arm": arm, "vid": vid}
    try:
        await fresh_page(ctx, pg, arm)
    except Exception as e:
        r["setup_err"] = str(e)[:80]
        return r
    await pg.evaluate("v => { PP.mute(); PP.loadVideoById(v); }", vid)
    t0 = time.time(); last_ct, last_prog = None, t0
    r.update({"ready": None, "first_prog": None, "reloaded": None, "ad_seen": False, "ad_api": False,
              "ad_unmuted": False, "ad_max": 0.0, "api_ad_mismatch": 0, "trace": []})
    while time.time() - t0 < CAP:
        now = time.time() - t0
        try:
            st, ct, mu = await pg.evaluate(API)
        except Exception:
            st, ct, mu = None, None, None
        fi = await frame_info(pg)
        ad = bool(fi.get("ad"))
        if ad:
            r["ad_seen"] = True
            if any(not v[0] for v in fi.get("vids", [])):
                r["ad_unmuted"] = True
            r["ad_max"] = max(r["ad_max"], max([v[1] for v in fi.get("vids", [])] or [0]))
        if not ok(ct):
            ct = None
        if ct is not None and last_ct is not None and ct != last_ct:
            last_prog = time.time()
            if r["first_prog"] is None:
                r["first_prog"] = round(now, 1)
        api_ad = (st == -1 and ct is not None and last_ct is not None and ct != last_ct)
        if api_ad:
            r["ad_api"] = True
        # validacao da detecao pela API: polls com anuncio no quadro, quantos a API tambem ve, e
        # (o que importa para o portao do som) se a API alguma vez diz PLAYING durante um anuncio
        if ad:
            r["ad_polls"] = r.get("ad_polls", 0) + 1
            if api_ad:
                r["ad_polls_api"] = r.get("ad_polls_api", 0) + 1
            if st == 1:
                r["api_ad_mismatch"] += 1
        last_ct = ct
        if len(r["trace"]) < 200:
            r["trace"].append([round(now, 1), st, ct, int(ad)])
        if st == 1 and not ad:
            r["ready"] = round(now, 1)
            break
        if time.time() - last_prog >= STALL and r["reloaded"] is None:
            r["reloaded"] = round(now, 1)
            try:
                await pg.evaluate("v => { PP.mute(); PP.loadVideoById(v); }", vid)
            except Exception:
                pass
            last_prog, last_ct = time.time(), None
        await asyncio.sleep(1.0)
    if r["ready"] is None:
        r["final_state"] = r["trace"][-1] if r["trace"] else None
        return r
    if arm == "OFF":
        return r
    # o disco pronto espera no zero e vai para o ar (HID fica visivel, como o prato que entra)
    try:
        await pg.evaluate("() => { PP.pauseVideo(); PP.seekTo(0, true); }")
        if arm == "HID":
            await pg.evaluate("() => { document.getElementById('box').style.opacity = '1'; }")
        await asyncio.sleep(PAUSE)
        await pg.evaluate("() => { PP.playVideo(); }")
        t1 = time.time(); r["resume"] = None; r["resume_ad"] = False
        while time.time() - t1 < 10:
            st, ct, mu = await pg.evaluate(API)
            fi = await frame_info(pg)
            if fi.get("ad"):
                r["resume_ad"] = True
            if st == 1 and ct is not None and ct > 0.2 and not fi.get("ad"):
                r["resume"] = round(time.time() - t1, 1)
                break
            await asyncio.sleep(0.5)
        await pg.evaluate("() => { PP.pauseVideo(); }")
    except Exception as e:
        r["resume_err"] = str(e)[:80]
    return r


async def main(sample, out):
    vids = [l.split("\t") for l in open(sample).read().splitlines() if l.strip()]
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", headless=False,
                                    ignore_default_args=["--enable-automation"],
                                    args=["--mute-audio", "--disable-backgrounding-occluded-windows",
                                          "--disable-blink-features=AutomationControlled"])
        arms = {}
        for arm, a in ARMS.items():
            ctx = await b.new_context(no_viewport=True)
            await ctx.route(URL + "*", lambda route: route.fulfill(status=200, content_type="text/html", body=PAGE))
            pg = await ctx.new_page()
            try:
                cdp = await ctx.new_cdp_session(pg)
                w = await cdp.send("Browser.getWindowForTarget")
                await cdp.send("Browser.setWindowBounds", {"windowId": w["windowId"],
                               "bounds": {"left": a["x"], "top": 40, "width": 390, "height": 300}})
                await cdp.detach()
            except Exception:
                pass
            arms[arm] = (ctx, pg)
        print("chrome", b.version, flush=True)
        # aquecimento: um video sem anuncios carrega o codigo do leitor em cada contexto
        warm = await asyncio.gather(*[run_arm(k, c, g, "jNQXAC9IVRw") for k, (c, g) in arms.items()])
        print("aquecimento", [(w["arm"], w.get("ready")) for w in warm], flush=True)
        with open(out, "a") as f:
            for i, (kind, vid) in enumerate(vids, 1):
                res = await asyncio.gather(*[run_arm(k, c, g, vid) for k, (c, g) in arms.items()])
                for r in res:
                    r["kind"], r["n"] = kind, i
                    f.write(json.dumps(r) + "\n")
                f.flush()
                print(i, kind, vid, " | ".join("%s %s%s%s" % (r["arm"], r.get("ready"),
                      " ad" if r.get("ad_seen") else "", " rel" if r.get("reloaded") is not None else "")
                      for r in res), flush=True)
        await b.close()


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1], sys.argv[2]))
