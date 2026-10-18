#!/usr/bin/env python3
"""Inventario estatico das fontes da sala liquid (auditoria de UI e UX): cores literais (CSS,
atributos e JavaScript), tamanhos de letra, espacamentos entre letras, pesos, regras de CSS com o
mesmo seletor no mesmo contexto, blocos @media repetidos, !important e estilos embutidos.

Uso: python3 ops/tools/ui_static.py [PASTA]
Imprime um resumo; com PASTA grava PASTA/static.json com cada ocorrencia (ficheiro:linha)."""
import json, os, re, sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FILES = ['l01-head.html', 'l02-body.html', 'l03-plog.html', 'l04-vj.html', 'l05-engine.html', 'l06-art.html',
         'l07-focus.html', 'l08-arcade.html', 'l09-dev.html']
COLOR = re.compile(r'#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])|rgba?\([^)]*\)|hsla?\([^)]*\)')


def norm(c):
    c = c.lower().replace(' ', '')
    if re.fullmatch(r'#[0-9a-f]{3}', c):
        c = '#' + ''.join(ch * 2 for ch in c[1:])
    return c


def base(c):
    """a cor sem a transparencia, para agrupar rgba(255,177,43,.35) com #ffb12b"""
    if c.startswith('#'):
        return c
    v = re.findall(r'[\d.]+', c)
    if c.startswith('rgb') and len(v) >= 3 and all('.' not in x for x in v[:3]):
        return '#%02x%02x%02x' % tuple(int(x) for x in v[:3])
    return c


def ctx_of(line):
    m = re.search(r'([a-z-]+)\s*:\s*[^;]*$', line.split(COLOR.pattern[:0] or '\x00')[0])
    return m.group(1) if m else ''


out = {'colors': [], 'sizes': [], 'spacing': [], 'weights': [], 'dups': [], 'media': [], 'important': [], 'inline': []}
for f in FILES:
    txt = open(os.path.join(ROOT, 'liquid', f), encoding='utf-8').read()
    lines = txt.split('\n')
    # zonas de CSS: blocos <style> (l01, l07, l08); o resto e marcacao ou JavaScript
    css_spans = [(m.start(), m.end()) for m in re.finditer(r'<style>.*?</style>', txt, re.S)]
    off = 0
    for i, ln in enumerate(lines, 1):
        in_css = any(a <= off < b for a, b in css_spans)
        off += len(ln) + 1
        if re.match(r'\s*(//|/\*|\*)', ln) and not in_css:
            continue
        for m in COLOR.finditer(ln):
            pre = ln[:m.start()]
            prop = re.findall(r'([a-zA-Z-]+)\s*[:=]\s*[^;:=]*$', pre)
            out['colors'].append(dict(f=f, l=i, c=norm(m.group(0)), base=base(norm(m.group(0))), css=in_css, prop=(prop[-1] if prop else '')))
        for m in re.finditer(r'font-size\s*:\s*([^;"}]+)', ln):
            out['sizes'].append(dict(f=f, l=i, v=m.group(1).strip()))
        for m in re.finditer(r'letter-spacing\s*:\s*([^;"}]+)', ln):
            out['spacing'].append(dict(f=f, l=i, v=m.group(1).strip()))
        for m in re.finditer(r'font-weight\s*:\s*([^;"}]+)', ln):
            out['weights'].append(dict(f=f, l=i, v=m.group(1).strip()))
        if '!important' in ln:
            out['important'].append(dict(f=f, l=i))
        for m in re.finditer(r'style\s*=\s*"([^"]*)"', ln):
            out['inline'].append(dict(f=f, l=i, kind='atributo', v=m.group(1)[:60]))
        for m in re.finditer(r'\.style\.(?!setProperty|display|transform|opacity|left|top|width|height|visibility)([a-zA-Z]+)\s*=', ln):
            out['inline'].append(dict(f=f, l=i, kind='js', v=m.group(1)))
    # seletores repetidos no mesmo contexto e blocos @media repetidos
    for a, b in css_spans:
        css = txt[a:b]
        lineof = lambda k: txt.count('\n', 0, a + k) + 1
        seen, ctx, media = defaultdict(list), [], Counter()
        i, n = 0, len(css)
        while i < n:
            if css[i].isspace():
                i += 1; continue
            if css.startswith('/*', i):
                j = css.find('*/', i + 2); i = n if j < 0 else j + 2; continue
            if css[i] == '}':
                if ctx: ctx.pop()
                i += 1; continue
            j = css.find('{', i)
            if j < 0: break
            sel = re.sub(r'\s+', ' ', css[i:j]).strip().replace('<style>', '').strip()
            if sel.startswith('@media'):
                media[sel] += 1; ctx.append(sel); i = j + 1; continue
            depth, k = 1, j + 1
            while k < n and depth:
                depth += (css[k] == '{') - (css[k] == '}'); k += 1
            if not sel.startswith('@'):
                for s in sel.split(','):
                    seen[(ctx[-1] if ctx else '', s.strip())].append(lineof(i))
            i = k
        for (c, s), ls in seen.items():
            if len(ls) > 1:
                out['dups'].append(dict(f=f, media=c, sel=s, lines=ls))
        for m, k in media.items():
            if k > 1:
                out['media'].append(dict(f=f, media=m, n=k))

if len(sys.argv) > 1:
    json.dump(out, open(os.path.join(sys.argv[1], 'static.json'), 'w'), indent=1)

C = out['colors']
print('cores literais: %d ocorrencias, %d valores distintos, %d cores-base distintas (sem a transparencia)' % (
    len(C), len({c['c'] for c in C}), len({c['base'] for c in C})))
byf = defaultdict(set)
for c in C:
    byf[c['f']].add(c['c'])
print('  por ficheiro (valores distintos):', ', '.join('%s %d' % (f, len(v)) for f, v in byf.items()))
print('  em CSS %d, em JavaScript ou marcacao %d' % (sum(c['css'] for c in C), sum(not c['css'] for c in C)))
bc = Counter(c['base'] for c in C)
print('  cores-base mais usadas:', ', '.join('%s %d' % kv for kv in bc.most_common(14)))
print('tamanhos de letra declarados: %d, valores distintos %d' % (len(out['sizes']), len({s['v'] for s in out['sizes']})))
print('  ', ', '.join('%s:%d' % kv for kv in sorted(Counter(s['v'] for s in out['sizes']).items(), key=lambda kv: (len(kv[0]), kv[0]))))
print('espacamentos declarados: %d, valores distintos %d' % (len(out['spacing']), len({s['v'] for s in out['spacing']})))
print('  ', ', '.join('%s:%d' % kv for kv in Counter(s['v'] for s in out['spacing']).most_common()))
print('pesos:', dict(Counter(s['v'] for s in out['weights'])))
print('seletores repetidos no mesmo contexto: %d' % len(out['dups']))
for d in out['dups']:
    print('   %s %s %s %s' % (d['f'], d['lines'], d['sel'][:50], d['media'][:34]))
print('blocos @media repetidos:', '; '.join('%s %s x%d' % (m['f'], m['media'][:40], m['n']) for m in out['media']))
print('!important: %d (%s)' % (len(out['important']), ', '.join(sorted({'%s' % x['f'] for x in out['important']}))))
print('estilos embutidos: %d (atributo %d, JavaScript %d)' % (len(out['inline']), sum(x['kind'] == 'atributo' for x in out['inline']), sum(x['kind'] == 'js' for x in out['inline'])))
