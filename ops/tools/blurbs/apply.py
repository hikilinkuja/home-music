import json,sys,re,os
from collections import Counter
S,W=sys.argv[1],sys.argv[2]
L=[json.loads(l) for l in open(S+"/bl/dg.jsonl")]
wp=json.load(open(S+"/bl/wp.json"))
L=[x for x in L if "dg" in x or x["v"] in wp]
P="radio/e03-data.html"; t=open(P,encoding="utf-8").read()
bc=Counter(re.findall(r'\n\s*b:"((?:[^"\\]|\\.)*)"',t))
SRC="ops/queue/blurb-sources.tsv"
have=set()
if not os.path.exists(SRC): open(SRC,"w",encoding="utf-8").write("# fonte de cada texto b reescrito (regra de 2026-10-18)\nvideo_id\tartist\ttitle\tsource\n")
else: have={l.split("\t")[0] for l in open(SRC,encoding="utf-8")}
ok=bad=0; out=[]
for line in open(W,encoding="utf-8"):
    i,b=line.rstrip("\n").split("\t",1); x=L[int(i)]
    if len(b)>230 or re.search("[–—•\"]",b): print("REJEITADO",i,len(b),b); bad+=1; continue
    m=re.search(r'(v:"'+re.escape(x["v"])+r'".*?\n\s*b:")((?:[^"\\]|\\.)*)(")',t)
    if not m: print("SEM ENTRADA",i,x["v"]); bad+=1; continue
    if bc[m.group(2)]<3: print("JA ESPECIFICO",i); continue
    t=t[:m.start(2)]+b+t[m.end(2):]
    src=(wp[x["v"]]["u"] if x["v"] in wp and ("WP" in b or True) else "")
    srcs=[s for s in [x.get("dg",{}).get("u"),wp.get(x["v"],{}).get("u")] if s]
    if x["v"] not in have: out.append(f'{x["v"]}\t{x["a"]}\t{x["t"]}\t{" ".join(srcs)}\n')
    ok+=1
open(P,"w",encoding="utf-8").write(t)
open(SRC,"a",encoding="utf-8").write("".join(out))
print("aplicados",ok,"rejeitados",bad)
