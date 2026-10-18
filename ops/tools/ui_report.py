#!/usr/bin/env python3
"""Relatorio do levantamento da interface (auditoria de UI e UX), a partir do que o
ops/tools/ui_audit.js gravou na PASTA: contraste medido sobre o fundo real (captura sem texto),
tipografia desenhada, cores calculadas, densidade por estado, alvos de toque, e CSS e funcoes
JavaScript sem uso (cobertura do Chromium cruzada com as referencias no codigo).

Uso: python3 ops/tools/ui_report.py PASTA
Escreve PASTA/report.json (tudo) e imprime um resumo curto; o modelo le o resumo, nao o JSON."""
import json, os, re, statistics, sys
from collections import Counter, defaultdict
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = sys.argv[1]
SRC = ['l01-head.html', 'l02-body.html', 'l03-plog.html', 'l04-vj.html', 'l05-engine.html', 'l06-art.html',
       'l07-focus.html', 'l08-arcade.html', 'l09-dev.html']
SRCTXT = {f: open(os.path.join(ROOT, 'liquid', f), encoding='utf-8').read() for f in SRC}
BUILT = open(os.path.join(ROOT, 'liquid', 'index.html'), encoding='utf-8').read()


def rgba(s):
    v = [float(x) for x in re.findall(r'[\d.]+', s)]
    return (v + [1.0])[:4] if len(v) >= 3 else None


def lum(c):
    def ch(x):
        x /= 255
        return x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2])


def ratio(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def where(token):
    """primeiro ficheiro:linha das fontes onde o texto aparece"""
    for f, t in SRCTXT.items():
        i = t.find(token)
        if i >= 0:
            return '%s:%d' % (f, t.count('\n', 0, i) + 1)
    return '?'


def hexs(c):
    return '#%02x%02x%02x' % tuple(int(round(x)) for x in c[:3])


# ---------- contraste, tipografia, densidade ----------
report = {'modes': {}}
for mode in ('desktop', 'mobile'):
    p = os.path.join(OUT, 'data-%s.json' % mode)
    if not os.path.exists(p):
        continue
    D = json.load(open(p))
    texts, states, colors = {}, [], defaultdict(lambda: {'n': 0, 'roles': Counter(), 'keys': set()})
    for st in D['states']:
        img = Image.open(os.path.join(OUT, mode, st['name'] + '.notext.png')).convert('RGB')
        dpr = st['dpr']
        vis = [t for t in st['texts'] if not t['covered']]
        for t in vis:
            col = rgba(t['color'])
            px = []
            for (x0, y0, x1, y1) in t['rects']:
                box = tuple(int(round(v * dpr)) for v in (x0, y0, x1, y1))
                if box[2] - box[0] < 1 or box[3] - box[1] < 1:
                    continue
                reg = img.crop(box)
                reg = reg.resize((max(1, reg.width // 2), max(1, reg.height // 2)))
                px.extend(reg.get_flattened_data() if hasattr(reg, 'get_flattened_data') else reg.getdata())
            if not px or not col:
                continue
            med = tuple(statistics.median(c[i] for c in px) for i in range(3))
            a = col[3] * t['op']
            fg = tuple(a * col[i] + (1 - a) * med[i] for i in range(3))
            rs = sorted(ratio(fg, c) for c in px[::max(1, len(px) // 400)])
            r_med, r_p10 = ratio(fg, med), rs[len(rs) // 10]
            large = t['fs'] >= 24 or (t['fs'] >= 18.66 and int(t['fw']) >= 700)
            k = t['key'] + '|' + t['txt'][:40]
            e = texts.setdefault(k, dict(key=t['key'], txt=t['txt'], fs=t['fs'], ls=t['ls'], tt=t['tt'], fw=t['fw'], ff=t['ff'],
                                         color=hexs(col[:3]) + ('' if col[3] == 1 else '/%.2f' % col[3]), shadow=t['shadow'],
                                         need=3.0 if large else 4.5, worst=99, worst_p10=99, bg=None, states=[]))
            e['states'].append(st['name'])
            if r_med < e['worst']:
                e['worst'], e['worst_p10'], e['bg'] = round(r_med, 2), round(r_p10, 2), hexs(med)
        ctr = st['ctrls']
        small = [c for c in ctr if c['h'] < 24 or c['w'] < 24]
        under44 = [c for c in ctr if c['h'] < 44 or c['w'] < 44]
        states.append(dict(name=st['name'], note=st['note'], controls=len(ctr), texts=len(vis),
                           words=sum(t['words'] for t in vis), sizes=len({t['fs'] for t in vis}),
                           text_colors=len({t['color'] for t in vis}), min_fs=min([t['fs'] for t in vis] or [0]),
                           under24=[(c['key'], c['label'], c['w'], c['h']) for c in small],
                           under44=len(under44)))
        for v, o in st['colors'].items():
            colors[v]['n'] += o['n']
            colors[v]['roles'].update(o['roles'])
            colors[v]['keys'].update(o['keys'])
    T = list(texts.values())
    fails = sorted([t for t in T if t['worst'] < t['need']], key=lambda t: t['worst'])
    report['modes'][mode] = dict(
        errors=D['errors'], states=states, texts=T, fails=fails,
        sizes=Counter(t['fs'] for t in T), spacing=Counter(t['ls'] for t in T),
        upper=sum(1 for t in T if t['tt'] == 'uppercase'), families=Counter(t['ff'] for t in T),
        colors={v: dict(n=o['n'], roles=dict(o['roles']), keys=sorted(o['keys'])[:6]) for v, o in colors.items()})

# ---------- CSS sem uso: cobertura cruzada com referencias fora do CSS ----------
def css_rules(text):
    """(inicio, fim, seletor, contexto @media) de cada regra de estilo, com @media aninhado"""
    out, i, n, ctx = [], 0, len(text), []
    while i < n:
        if text[i].isspace():
            i += 1
            continue
        if text.startswith('/*', i):
            j = text.find('*/', i + 2)
            i = n if j < 0 else j + 2
            continue
        if text[i] == '}':
            if ctx:
                ctx.pop()
            i += 1
            continue
        j = text.find('{', i)
        if j < 0:
            break
        sel = re.sub(r'/\*.*?\*/', '', text[i:j], flags=re.S).strip()
        if sel.startswith('@media') or sel.startswith('@supports'):
            ctx.append(sel)
            i = j + 1
            continue
        depth, k = 1, j + 1
        while k < n and depth:
            if text[k] == '{':
                depth += 1
            elif text[k] == '}':
                depth -= 1
            k += 1
        if not sel.startswith('@'):
            out.append((i + len(text[i:j]) - len(text[i:j].lstrip()), k, sel, ctx[-1] if ctx else ''))
        i = k
    return out


NONCSS = re.sub(r'<style>.*?</style>', ' ', BUILT, flags=re.S)
# palavras que aparecem dentro de literais de texto e de atributos (class="...", "on", ".fc-why", "#fcLab"):
# um seletor so conta como referido se cada id e classe dele estiver neste conjunto
STRWORDS = set()
for lit in re.findall(r'"((?:[^"\\\n]|\\.)*)"|\'((?:[^\'\\\n]|\\.)*)\'', NONCSS):
    STRWORDS.update(re.findall(r'[A-Za-z][\w-]*', lit[0] or lit[1]))
used_by_sheet = defaultdict(set)
sheets = {}
for mode in ('desktop', 'mobile'):
    p = os.path.join(OUT, 'cov-css-%s.json' % mode)
    if not os.path.exists(p):
        continue
    for s in json.load(open(p)):
        sheets[s['text']] = s['text']
        for r in s['ranges']:
            used_by_sheet[s['text']].add((r['start'], r['end']))
css_unused = []
css_total = 0
for text in sheets:
    rs = used_by_sheet[text]
    for (a, b, sel, med) in css_rules(text):
        css_total += 1
        if any(x < b and y > a for (x, y) in rs):
            continue
        toks = re.findall(r'[#.]([A-Za-z][\w-]*)', re.sub(r'\[[^\]]*\]|::?[\w-]+(\([^)]*\))?', ' ', sel))
        missing = [t for t in toks if t not in STRWORDS]
        css_unused.append(dict(sel=sel[:90], media=med[:40], where=where(sel.split(',')[0].strip()[:60]),
                               dead=bool(missing), missing=missing))
report['css'] = dict(total=css_total, unused=css_unused)

# ---------- funcoes JavaScript com nome nunca chamadas na visita, e as sem referencias ----------
calls = defaultdict(int)
names = {}
for mode in ('desktop', 'mobile'):
    p = os.path.join(OUT, 'cov-js-%s.json' % mode)
    if not os.path.exists(p):
        continue
    for s in json.load(open(p)):
        for f in s['functions']:
            if not f['functionName'] or not f['ranges']:
                continue
            k = (s['url'], f['ranges'][0]['startOffset'])
            names[k] = f['functionName']
            calls[k] += f['ranges'][0]['count']
js_uncalled = []
for k, nm in names.items():
    if calls[k]:
        continue
    refs = len(re.findall(r'(?<![\w$])' + re.escape(nm) + r'(?![\w$])', NONCSS))
    js_uncalled.append(dict(name=nm, refs=refs, where=where('function ' + nm + '(') if where('function ' + nm + '(') != '?' else where(nm)))
report['js'] = dict(named=len(names), uncalled=sorted(js_uncalled, key=lambda x: (x['refs'], x['where'])))

json.dump(report, open(os.path.join(OUT, 'report.json'), 'w'), indent=1, default=list)

# ---------- resumo ----------
for mode, M in report['modes'].items():
    print('== %s: %d textos distintos, erros da pagina %d' % (mode, len(M['texts']), len(M['errors'])))
    print('tamanhos (px: textos):', ', '.join('%g:%d' % kv for kv in sorted(M['sizes'].items())))
    print('espacamentos:', len(M['spacing']), '| maiusculas: %d de %d' % (M['upper'], len(M['texts'])), '| familias:', dict(M['families']))
    print('cores calculadas visiveis: %d' % len(M['colors']))
    print('falham o contraste AA: %d de %d' % (len(M['fails']), len(M['texts'])))
    for t in M['fails'][:45]:
        print('  %5.2f (p10 %4.2f, pede %.1f) %4gpx %s sobre %s %s | %s | %s' % (t['worst'], t['worst_p10'], t['need'], t['fs'], t['color'], t['bg'],
              'sombra' if t['shadow'] else '', t['key'][:42], t['txt'][:40]))
    print('estado: controlos, textos, palavras, tamanhos, cores de texto, letra minima, alvos <24, alvos <44')
    for s in M['states']:
        print('  %-22s %3d %3d %4d %2d %2d %4g %2d %2d' % (s['name'], s['controls'], s['texts'], s['words'], s['sizes'], s['text_colors'], s['min_fs'], len(s['under24']), s['under44']))
print('== CSS: %d regras, %d sem uso na visita, %d sem referencia fora do CSS' % (report['css']['total'], len(css_unused), sum(1 for u in css_unused if u['dead'])))
print('== JS: %d funcoes com nome, %d nunca chamadas na visita, %d sem nenhuma referencia alem da declaracao' % (
    report['js']['named'], len(js_uncalled), sum(1 for j in js_uncalled if j['refs'] <= 1)))
for u in css_unused:
    if u['dead']:
        print('  CSS morto? %-60s %-28s falta %s %s' % (u['sel'][:60], u['where'], ','.join(u['missing']), u['media'][:30]))
for j in report['js']['uncalled']:
    if j['refs'] <= 1:
        print('  JS sem referencia: %-24s %s' % (j['name'], j['where']))
