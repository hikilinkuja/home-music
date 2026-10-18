"""Auditoria de UI, ronda 3 (proposta; aplicar so com a escolha do Paulo; ver ui-type.md) (tipografia): aplica a escala proposta aos blocos <style> do l01, l07 e l08.
Uso: python3 typescale.py [--dry]"""
import re, sys
from collections import Counter
ROOT = '/home/user/home-music/liquid/'
DRY = '--dry' in sys.argv
TOKENS = """  /* tipografia por papeis (auditoria de UI, ronda 3; ops/notes/2026-10-18/ui-type.md): cinco tamanhos e dois
     espacamentos; as maiusculas so em rotulos, botoes e titulos curtos; ops/tests/t-ui.js verifica */
  --fs-label:10px; --fs-small:12px; --fs-body:13px; --fs-title:14px; --fs-head:16px;
  --ls-caps:.12em; --ls-title:.2em;
"""
# frases em maiusculas (mais de cinco palavras): passam a minusculas, como estao escritas
NOCAPS = {'.dw-sub', '.sk-sub', '#fcKeys', '.fc-kbd', '#arcade .asub', '#waHint', '.dkkeys', '#introCredit', '.psub',
          '#wartFicha .fsub', '.fc-qh .q', '.fc-cap', '#gExt blockquote cite', '.dw-tape h4', '.dw-idle', '#fcWhy',
          '.gx-eph figcaption', '#standbyMsg', '.sk-msg', '#fcHabit .q', '#fcRate .q', '#fcBrk label'}
OVR = {'#tBlurb': 'body', '.brand b': 'head', '#tBpm': 'label', '#tYear': 'label', '#fcWord': 'title'}
# maiusculas escritas no proprio texto (sem text-transform): contam como maiusculas para o espacamento
CAPSFORCE = {'.brand b', '#tBpm', '#tYear', '.sk-target', '.sk-meter'}
FS = {'label': 'var(--fs-label)', 'small': 'var(--fs-small)', 'body': 'var(--fs-body)', 'title': 'var(--fs-title)', 'head': 'var(--fs-head)'}
log = Counter(); notes = []

def last_compound(sel):
    c = re.split(r'\s+|>', sel.strip())[-1]
    return c if ('.' in c or '#' in c) else None   # etiquetas soltas (span, a, label) nao herdam por nome

def rules(css):
    """(inicio do corpo, fim do corpo, seletor) de cada regra de estilo, @media incluido"""
    out, i, n = [], 0, len(css)
    while i < n:
        if css[i].isspace(): i += 1; continue
        if css.startswith('/*', i):
            j = css.find('*/', i + 2); i = n if j < 0 else j + 2; continue
        if css[i] == '}': i += 1; continue
        j = css.find('{', i)
        if j < 0: break
        sel = re.sub(r'/\*.*?\*/', '', css[i:j], flags=re.S).strip()
        if sel.startswith('@media') or sel.startswith('@supports'): i = j + 1; continue
        depth, k = 1, j + 1
        while k < n and depth:
            depth += (css[k] == '{') - (css[k] == '}'); k += 1
        if not sel.startswith('@'): out.append((j + 1, k - 1, sel))
        i = k
    return out

def fs_token(v, caps, sel):
    if sel in OVR: return OVR[sel]
    m = re.fullmatch(r'([\d.]+)px', v.strip())
    if not m: return None
    x = float(m.group(1))
    if x >= 20: return None
    if caps:
        return 'label' if x <= 11.5 else ('title' if x <= 14.5 else 'head')
    return 'small' if x <= 12 else ('body' if x <= 13.5 else ('title' if x <= 15.5 else 'head'))

def process(fname, css, capsel):
    out, pos = [], 0
    for a, b, sel in rules(css):
        body = css[a:b]
        sels = [s.strip() for s in sel.split(',')]
        if any(s in NOCAPS for s in sels) and re.search(r'text-transform\s*:\s*uppercase', body):
            body = re.sub(r'\s*text-transform\s*:\s*uppercase\s*;?', '', body); log['maiusculas retiradas'] += 1
        caps = bool(re.search(r'text-transform\s*:\s*uppercase', body)) or any(last_compound(s) in capsel for s in sels if not any(s == x for x in NOCAPS))
        if any(s in NOCAPS for s in sels): caps = False
        if any(s in CAPSFORCE for s in sels): caps = True
        tok = None
        def fsub(m):
            nonlocal tok
            v = m.group(2); t = fs_token(v, caps, sels[0])
            if not t: log['tamanho mantido ' + v.strip()] += 1; return m.group(0)
            tok = t; log['%s -> %s' % (v.strip(), t)] += 1
            return m.group(1) + FS[t]
        body = re.sub(r'(font-size\s*:\s*)([^;}]+)', fsub, body)
        def lsub(m):
            v = m.group(2).strip()
            if v in ('0', 'normal'): return m.group(0)
            em = re.fullmatch(r'([\d.]+)em', v)
            x = float(em.group(1)) if em else 0
            if any(x in NOCAPS for x in sels): new = '0'
            elif caps: new = 'var(--ls-title)' if tok in ('title', 'head') else 'var(--ls-caps)'
            else: new = 'var(--ls-caps)' if x >= .12 else '0'
            log['espacamento %s -> %s' % (v, new)] += 1
            return m.group(1) + new
        body = re.sub(r'(letter-spacing\s*:\s*)([^;}]+)', lsub, body)
        out.append(css[pos:a]); out.append(body); pos = b
    out.append(css[pos:])
    return ''.join(out)

def edit(fname):
    p = ROOT + fname; s = open(p, encoding='utf-8').read()
    blocks = re.findall(r'<style>(.*?)</style>', s, re.S)
    return p, s, blocks

capsel = set()
for f in ['l01-head.html', 'l07-focus.html', 'l08-arcade.html']:
    for css in re.findall(r'<style>(.*?)</style>', open(ROOT + f, encoding='utf-8').read(), re.S):
        for a, b, sel in rules(css):
            if re.search(r'text-transform\s*:\s*uppercase', css[a:b]):
                for s in sel.split(','):
                    if s.strip() not in NOCAPS and last_compound(s): capsel.add(last_compound(s))
for f in ['l01-head.html', 'l07-focus.html', 'l08-arcade.html']:
    p = ROOT + f; s = open(p, encoding='utf-8').read()
    s2 = re.sub(r'<style>(.*?)</style>', lambda m: '<style>' + process(f, m.group(1), capsel) + '</style>', s, flags=re.S)
    if f == 'l01-head.html':
        s2 = s2.replace('  --mono:"Courier New"', TOKENS + '  --mono:"Courier New"', 1)
    if not DRY: open(p, 'w', encoding='utf-8').write(s2)
for k, v in sorted(log.items()): print('%4d  %s' % (v, k))
