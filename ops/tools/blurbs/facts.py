# Fichas de factos para as faixas com texto generico. Fase wp (Wikipedia em lotes) e fase dg (Discogs). Retoma.
import re,json,time,os,sys,urllib.request,urllib.parse
from collections import Counter
UA={"User-Agent":"HomeMusic/1.0 (https://hikilinkuja.github.io/home-music/)","Accept":"application/json"}
PH,OUT=sys.argv[1],sys.argv[2]
last=[0.0]
def get(u,gap):
    for k in range(12):
        w=gap-(time.time()-last[0])
        if w>0: time.sleep(w)
        last[0]=time.time()
        try:
            with urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=25) as r: return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code==429:
                ra=e.headers.get("Retry-After"); time.sleep(int(ra)+2 if ra and ra.isdigit() else 30*(k+1)); continue
            return {"_err":e.code}
        except Exception: time.sleep(5)
    return {"_err":"x"}
def norm(s): return re.sub(r"[^a-z0-9]+"," ",(s or "").lower()).strip()
t=open("radio/e03-data.html",encoding="utf-8").read()
ents=re.findall(r'\{ g:"(\w+)",(.*?)\n\s*b:"((?:[^"\\]|\\.)*)"',t)
bc=Counter(b for g,x,b in ents)
rows=[]
for g,x,b in ents:
    if bc[b]<3: continue
    f=dict(re.findall(r'(\w+):"((?:[^"\\]|\\.)*)"',x)); y=re.search(r'y:(\d{4})',x)
    a=f.get("a","").replace('\\"','"'); ti=f.get("t","").replace('\\"','"')
    a1=re.split(r",| & | feat\.? | ft\.? | x | vs\.? | and ",a,flags=re.I)[0].strip()
    tt=re.sub(r"\s*[\(\[].*$|\s+-\s+.*$","",ti).strip() or ti
    rows.append({"v":f["v"],"g":g,"a":a,"t":ti,"y":y.group(1) if y else "","a1":a1,"tt":tt})
done={}
if os.path.exists(OUT):
    for l in open(OUT,encoding="utf-8"): r=json.loads(l); done[r["v"]]=r
if PH=="wp":
    cand={}
    for r in rows:
        for q in (f'{r["tt"]} ({r["a1"]} song)',f'{r["tt"]} (song)',r["tt"]): cand.setdefault(q,[]).append(r["v"])
    titles=list(cand); found={}
    for i in range(0,len(titles),20):
        d=get("https://en.wikipedia.org/w/api.php?"+urllib.parse.urlencode({"action":"query","titles":"|".join(titles[i:i+20]),"prop":"extracts","exintro":1,"explaintext":1,"exlimit":20,"redirects":1,"format":"json"}),1.0)
        q=d.get("query",{}); m={x["from"]:x["to"] for x in q.get("normalized",[])+q.get("redirects",[])}
        pages={p.get("title"):p for p in q.get("pages",{}).values() if "missing" not in p}
        for ti in titles[i:i+20]:
            tgt=m.get(m.get(ti,ti),m.get(ti,ti)); p=pages.get(tgt)
            if p and p.get("extract"): found[ti]=(tgt,p["extract"])
        if i%400==0: print("wp",i,len(titles),flush=True)
    wp={}
    for r in rows:
        for q in (f'{r["tt"]} ({r["a1"]} song)',f'{r["tt"]} (song)',r["tt"]):
            if q in found:
                tgt,x=found[q]
                if norm(r["a1"]) in norm(x[:1500]) and norm(r["tt"]) in norm(tgt) and "may refer to" not in x[:300]:
                    wp[r["v"]]={"u":"https://en.wikipedia.org/wiki/"+urllib.parse.quote(tgt.replace(" ","_")),"x":x[:700]}; break
    json.dump(wp,open(OUT,"w",encoding="utf-8"),ensure_ascii=False); print("wp encontrados",len(wp),flush=True)
else:
    todo=[r for r in rows if r["v"] not in done]; print("dg por fazer",len(todo),flush=True)
    for n,r in enumerate(todo,1):
        rec={k:r[k] for k in ("v","g","a","t","y")}
        res=get("https://api.discogs.com/database/search?"+urllib.parse.urlencode({"artist":r["a1"],"track":r["tt"],"type":"release","per_page":20}),2.45).get("results",[])
        def ok(x): 
            fm=" ".join(x.get("format",[]))
            return not re.search(r"Compilation|Mixed|Promo|Unofficial",fm) and norm(x.get("title","")).startswith(norm(r["a1"]).split(" ")[0])
        res=sorted([x for x in res if ok(x)],key=lambda x:int(x.get("year") or 9999))
        for x in res[:2]:
            d=get(x["resource_url"],2.45)
            if not any(norm(r["tt"]) and norm(r["tt"]) in norm(tk.get("title","")) for tk in d.get("tracklist",[])): continue
            rec["dg"]={"u":d.get("uri"),"rel":d.get("title"),"yr":d.get("year"),"c":d.get("country"),
              "lab":[f'{l["name"]} {l.get("catno","")}'.strip() for l in d.get("labels",[])][:2],
              "fmt":[(f.get("name","")+" "+" ".join(f.get("descriptions",[]))).strip() for f in d.get("formats",[])][:1],
              "cr":[f'{c["role"]}: {c["name"]}' for c in d.get("extraartists",[]) if re.search(r"Produc|Written|Mix|Engineer|Record|Vocal|Remix|Featur|Arrang|Bass|Drum|Keyboard|Guitar|Sax|Trumpet",c.get("role",""))][:6],
              "no":re.sub(r"\[/?\w+[^\]]*\]","",(d.get("notes") or ""))[:350],"hv":d.get("community",{}).get("have")}
            break
        with open(OUT,"a",encoding="utf-8") as f: f.write(json.dumps(rec,ensure_ascii=False)+"\n")
        if n%100==0: print("dg",n,flush=True)
    print("fim",flush=True)
