import json,sys,re
S=sys.argv[1]; a,b=int(sys.argv[2]),int(sys.argv[3])
L=[json.loads(l) for l in open(S+"/bl/dg.jsonl")]
wp=json.load(open(S+"/bl/wp.json"))
L=[x for x in L if "dg" in x or x["v"] in wp]
for i,x in enumerate(L[a:b],a):
    s=f'{i}|{x["a"]} - {x["t"]}|{x["y"]}|{x["g"]}'
    d=x.get("dg")
    if d:
        s+=f' || DG {d["rel"]} ({d["yr"]},{d["c"]}) {"; ".join(d["lab"])}; {"; ".join(d["fmt"])}'
        if d["cr"]: s+="; "+"; ".join(d["cr"][:4])
        n=re.sub(r"\s+"," ",d["no"]).strip()
        if n: s+=f'; notes: {n[:180]}'
        s+=f'; have {d["hv"]}'
    if x["v"] in wp: s+=" || WP "+re.sub(r"\s+"," ",wp[x["v"]]["x"])[:420]
    print(s)
print("total com factos:",len(L),file=sys.stderr)
