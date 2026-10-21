// Auditoria de UI (ops/prompts/ui-audit.md), ronda 1: correcoes e termos.
// Session log: as linhas que o motor escreve tem estilo (ligacoes em teal, sem sublinhado, separadas,
// contraste AA sobre o painel); ala da arte no telemovel: com a ficha aberta, a dica (#waHint) nao fica
// por cima da ficha nem do nome do artista. Termos escolhidos pelo Paulo (ops/notes/2026-10-18/ui-terms.md):
// os antigos ausentes da pagina montada, os novos presentes, os rotulos visiveis certos no computador e no
// telemovel (Skip... so no telemovel), o monitor do telemovel em duas filas no maximo, e as ligacoes do topo
// do painel do genero escondidas quando ha painel estendido. Ronda 2 (cores, ops/notes/2026-10-18/ui-colors.md):
// nenhuma cor literal nas fontes da interface fora do :root (l01), das variaveis da consola (#ag-dk, l08) e das
// excecoes (canvas e SVG desenhados em JavaScript; sombras e gradientes em preto, branco ou tinta com alfa);
// todas as variaveis usadas estao definidas; contraste dos casos corrigidos; acento da madrugada em pergaminho.
// Ronda 3 (tipografia, ops/notes/2026-10-18/ui-type.md): tamanhos e espacamentos so pelas variaveis (fora os de
// exibicao); nos estados abertos, nenhum texto abaixo de 10 px, nenhuma frase abaixo de 12 px (fora tres rotulos
// escritos em maiusculas) e nenhum texto em maiusculas com mais de cinco palavras (fora tres excecoes).
// Ronda 3b (letra Recursive, liquid/fonts): servida pelo site e carregada; variacoes so pelas variaveis e todo o
// rotulo com --fv-label; rotulos monoespacados e frases casuais nos estados abertos; tamanhos de sempre a 1440 px
// e 15% maiores a 2560 px. Cerca de 80 segundos.
'use strict';
const fs = require('fs');
const path = require('path');
const T = require('./lib/common');

// textos que nao podem voltar (visiveis ou enviados), e os que os substituem
const OLD = ['>Gift a tune<', 'Gift a Tune', 'recommend music', 'Hand it over', 'Copy the note', 'a present from', 'Tune recommendation',
  '>Immerse<', '"Immerse"', '>Background<', 'Background sounds', 'aria-label="Background"', 'liquid background', '>Skip<', '>The sound<',
  '>The Sound<', '>Scene<', '>Work<', 'selector&#39;s pomodoro', 'programme valve', 'house noise desk', '>Calm set<',
  'touch to drop the needle', 'tap to drop the needle', '>Drop the Needle<', 'drop the needle pauses', 'demonstration ficha',
  'ceded film loop', 'room sheet', '>Live feed<', '"Screen on"', '"Screen off"', '>Screen on<', "tonight's crate", 'AllMusic',
  '[&rarr;] next', 'morning 06-13'];
const NEW = ['>Suggest a tune<', 'Suggest a Tune', 'we listen to every suggestion', '>Send via GitHub<', '>Copy the suggestion<',
  '"suggested by "', 'Tune suggestion', '>Full screen<', '"Full screen"', '>Visuals<', '>Room sounds<', 'aria-label="Screen background"',
  'Earn a skip', 'Skip&hellip;', '>The genre<', '>The Genre<', '>Kind of work<', 'focus and break lengths', 'which genres play',
  'mixed under the music', '>Calm genres only<', '>drop the needle<', '>Guess the Genre<', 'demonstration sheet', 'film loop on loan',
  'about the work', '>Video<', '"Keep screen on"', '"Let screen sleep"', "records of this genre in the station's crates",
  'Liner notes draw mainly on Discogs and Wikipedia', '[&rarr;] earn a skip', 'seven blocks'];

const lum = (c) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);

(async () => {
  const t = T.suite('ui');
  // so as fontes da interface (l01 a l09, com o l05 gerado): o catalogo e os textos das faixas ficam fora
  const html = fs.readdirSync(path.join(T.ROOT, 'liquid')).filter(f => /^l0\d-.*\.html$/.test(f))
    .map(f => fs.readFileSync(path.join(T.ROOT, 'liquid', f), 'utf8')).join('\n');
  const back = OLD.filter(x => html.includes(x));
  t.check('termos antigos ausentes das fontes da interface', back.length === 0, back.join(' | '));
  const miss = NEW.filter(x => !html.includes(x));
  t.check('termos novos presentes nas fontes da interface', miss.length === 0, miss.join(' | '));
  // cores: so papeis
  const COLOR = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])|rgba?\([^)]*\)/g;
  const SHADE = /^rgba\((0,0,0|255,255,255|6,5,17),[.\d]+\)$/;
  const stray = [], defs = new Set(['--blk']), uses = new Set();
  for (const f of ['l01-head.html', 'l02-body.html', 'l03-plog.html', 'l06-art.html', 'l07-focus.html', 'l08-arcade.html', 'l09-dev.html']) {
    const src = fs.readFileSync(path.join(T.ROOT, 'liquid', f), 'utf8');
    const zones = [];
    for (const re of [/:root\{[^}]*\}/g, /#ag-dk\{[^}]*\}/g, /\/\*[\s\S]*?\*\//g]) { let m; while ((m = re.exec(src))) zones.push([m.index, m.index + m[0].length]); }
    src.split('\n').reduce((off, line, i) => {
      let m; COLOR.lastIndex = 0;
      while ((m = COLOR.exec(line))) {
        const at = off + m.index, v = m[0].replace(/\s/g, '').toLowerCase();
        if (zones.some(([a, b]) => at >= a && at < b) || SHADE.test(v) || /fillStyle|setAttribute\("stroke"/.test(line)) continue;
        stray.push(`${f}:${i + 1} ${m[0]}`);
      }
      return off + line.length + 1;
    }, 0);
    for (const m of src.matchAll(/(--[\w-]+)\s*:/g)) defs.add(m[1]);
    for (const m of src.matchAll(/var\((--[\w-]+)/g)) uses.add(m[1]);
  }
  t.check('cores: nenhuma literal fora do :root, da consola e das excecoes', stray.length === 0, stray.slice(0, 8).join(' | '));
  const undef = [...uses].filter(v => !defs.has(v));
  t.check('cores: todas as variaveis usadas estao definidas', undef.length === 0, undef.join(' | '));
  // tipografia: so variaveis, fora os tamanhos de exibicao
  const DISPLAY = new Set(['clamp(20px,3.4vw,34px)', 'clamp(13px,1.8vw,17px)', 'clamp(22px,4.6vw,30px)', 'calc(var(--fc-ring) * .25)', '25cqmin', '.2em', '34px']);
  const badType = [];
  for (const f of ['l01-head.html', 'l02-body.html', 'l03-plog.html', 'l06-art.html', 'l07-focus.html', 'l08-arcade.html', 'l09-dev.html']) {
    const src = fs.readFileSync(path.join(T.ROOT, 'liquid', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of src.matchAll(/(?<![\w-])font-size\s*:\s*([^;}"]+)/g)) {
      const v = m[1].trim();
      if (!/^var\(--fs-(label|small|body|title|head)\)$/.test(v) && !DISPLAY.has(v)) badType.push(f + ' font-size:' + v);
    }
    for (const m of src.matchAll(/(?<![\w-])letter-spacing\s*:\s*([^;}"]+)/g)) {
      const v = m[1].trim();
      if (!/^(0|normal|var\(--ls-(caps|title)\))$/.test(v)) badType.push(f + ' letter-spacing:' + v);
    }
  }
  t.check('letra: tamanhos e espacamentos so pelas variaveis da escala', badType.length === 0, badType.slice(0, 8).join(' | '));
  // letra Recursive (2026-10-21): servida pelo site; variacoes so pelas variaveis; rotulos (maiusculas, 10 px) com --fv-label
  const l01 = fs.readFileSync(path.join(T.ROOT, 'liquid', 'l01-head.html'), 'utf8');
  const faces = [...l01.matchAll(/@font-face\{[^}]*font-family:"Recursive"[^}]*url\("(fonts\/[\w.-]+\.woff2)"\)/g)].map(m => m[1]);
  const missing = faces.filter(f => !fs.existsSync(path.join(T.ROOT, 'liquid', f)));
  t.check('letra: Recursive servida pelo site (dois @font-face, ficheiros e licenca OFL presentes)',
    faces.length === 2 && missing.length === 0 && fs.existsSync(path.join(T.ROOT, 'liquid', 'fonts', 'OFL.txt')), JSON.stringify({ faces, missing }));
  const badFv = [];
  for (const f of ['l01-head.html', 'l07-focus.html', 'l08-arcade.html']) {
    const src = fs.readFileSync(path.join(T.ROOT, 'liquid', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const st of src.matchAll(/<style>([\s\S]*?)<\/style>/g)) for (const b of st[1].matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      const sel = b[1].trim(), body = b[2];
      if (sel === ':root') continue;
      for (const v of body.matchAll(/font-variation-settings\s*:\s*([^;}]+)/g)) if (!/^(var\(--fv-(label|text)\)|inherit)$/.test(v[1].trim())) badFv.push(f + ' ' + sel.slice(0, 40) + ' ' + v[1].trim());
      if (/text-transform:uppercase|font-size:var\(--fs-label\)/.test(body) && !/font-variation-settings:var\(--fv-label\)/.test(body)) badFv.push(f + ' ' + sel.slice(0, 40) + ' sem --fv-label');
    }
  }
  t.check('letra: variacoes so por --fv-label e --fv-text, e todo o rotulo com --fv-label', badFv.length === 0, badFv.slice(0, 6).join(' | '));
  // nos estados abertos: minimo de 10 px, frases de 12 px, maiusculas so em textos curtos
  const TYPE = () => {
    const SMALL_OK = '#tBpm, #tYear, .sk-target', CAPS_OK = '#blockLabel, #waK, .mc-line';
    const bad = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const txt = n.nodeValue.replace(/\s+/g, ' ').trim(), el = n.parentElement;
      if (!txt || !el || /^(SCRIPT|STYLE|OPTION|TITLE)$/.test(el.tagName) || !el.getClientRects().length) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility !== 'visible' || el.closest('[hidden]') || el.closest('#devPanel')) continue;
      let shown = true; for (let x = el; x; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || +c.opacity === 0) { shown = false; break; } }
      if (!shown) continue;
      const fs = parseFloat(cs.fontSize), caps = cs.textTransform === 'uppercase', words = txt.split(' ').length;
      const who = (el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + el.className) + ' «' + txt.slice(0, 30) + '»';
      if (fs < 10) bad.push('abaixo de 10 px: ' + who + ' ' + fs);
      else if (!caps && fs < 12 && !el.closest(SMALL_OK)) bad.push('frase abaixo de 12 px: ' + who + ' ' + fs);
      if (caps && words > 5 && !el.closest(CAPS_OK)) bad.push('maiusculas longas: ' + who);
    }
    return bad;
  };
  // cada texto visivel com a variacao certa: rotulo (monoespacado) se em maiusculas, abaixo de 12 px ou no cartao da
  // faixa, nos relogios, no alvo do Earn a skip e no Begin; frase (casual) nos outros casos (a regra do estudo da ronda 3b)
  const FV = () => {
    const LBL = '#tArtist,#tTitle,#clock,#fcTime,#fcClock,#fcBegin,#skTarget', bad = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; const seen = new Set();
    while ((n = w.nextNode())) {
      const el = n.parentElement, txt = n.nodeValue.replace(/\s+/g, ' ').trim();
      if (!txt || !el || seen.has(el) || /^(SCRIPT|STYLE|OPTION|TITLE)$/.test(el.tagName) || !el.getClientRects().length) continue;
      seen.add(el);
      const cs = getComputedStyle(el);
      if (cs.visibility !== 'visible' || el.closest('[hidden]') || el.closest('#devPanel')) continue;
      let shown = true; for (let x = el; x; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || +c.opacity === 0) { shown = false; break; } }
      if (!shown) continue;
      const wantL = cs.textTransform === 'uppercase' || parseFloat(cs.fontSize) < 11.9 || !!el.closest(LBL), isL = /"MONO" 1/.test(cs.fontVariationSettings);
      if (wantL !== isL) bad.push((wantL ? 'rotulo sem mono: ' : 'frase em mono: ') + (el.id ? '#' + el.id : el.tagName.toLowerCase()) + ' «' + txt.slice(0, 24) + '»');
    }
    return bad;
  };
  const browser = await T.launch();

  for (const mode of ['desktop', 'mobile']) {
    const r = await T.openLiquid(browser, { mode, dur: 60, load: 400 });
    await r.run(3);
    const h = await r.page.evaluate(() => {
      document.getElementById('histBtn').click();
      const li = document.querySelector('#histList li:not(.h-empty)');
      if (!li) return { li: false };
      const as = [...li.querySelectorAll('.h-links a')];
      const cs = as.map(a => getComputedStyle(a));
      const R = as.map(a => a.getBoundingClientRect());
      return { li: true, n: as.length, color: cs.map(c => c.color), deco: cs.map(c => c.textDecorationLine),
        gap: R.length === 2 ? Math.round(R[1].left - R[0].right) : null,
        art: getComputedStyle(li.querySelector('.h-art')).color, tit: getComputedStyle(li.querySelector('.h-tit')).color,
        panel: getComputedStyle(document.getElementById('histPanel')).backgroundColor };
    });
    t.check(`${mode}: Session log com uma linha`, h.li, JSON.stringify(h));
    if (h.li) {
      t.check(`${mode}: duas ligacoes, sem o azul por omissao`, h.n === 2 && h.color.every(c => c !== 'rgb(0, 0, 238)'), JSON.stringify(h.color));
      t.check(`${mode}: ligacoes sem sublinhado`, h.deco.every(d => d === 'none'), JSON.stringify(h.deco));
      t.check(`${mode}: ligacoes separadas (12 px ou mais)`, h.gap >= 12, h.gap);
      const bg = rgb(h.panel).slice(0, 3);
      const worst = Math.min(...h.color.map(c => ratio(rgb(c), bg)), ratio(rgb(h.art), bg), ratio(rgb(h.tit), bg));
      t.check(`${mode}: contraste AA das linhas sobre o painel`, worst >= 4.5, worst.toFixed(2));
    }
    const L = await r.page.evaluate(() => {
      const vis = (el) => [...el.querySelectorAll('span')].filter(x => getComputedStyle(x).display !== 'none').map(x => x.textContent).join('') || el.textContent;
      const lab = (id) => vis(document.getElementById(id)).trim();
      document.getElementById('histBtn').click();
      document.getElementById('wakeBtn').classList.add('avail');
      const bs = [...document.querySelectorAll('.vp-ctrl .tbtn')].filter(e => e.getBoundingClientRect().width > 0);
      const gp = document.getElementById('genrePanel'), gx = document.getElementById('gExt'), gl = gp.querySelector('.g-links');
      const was = gx.hidden;
      gx.hidden = false; const withExt = getComputedStyle(gl).display;
      gx.hidden = true; const noExt = getComputedStyle(gl).display;
      gx.hidden = was;
      return { gift: lab('giftBtn'), field: lab('fieldBtn'), fs: lab('fsBtn'), genre: lab('genreBtn'), skip: lab('skipBtn'),
        video: document.querySelector('.vp-top .lab').textContent, rows: new Set(bs.map(e => Math.round(e.getBoundingClientRect().top))).size,
        withExt, noExt };
    });
    const want = { gift: 'Suggest a tune', field: 'Visuals', fs: 'Full screen', genre: 'The genre', skip: mode === 'mobile' ? 'Skip\u2026' : 'Earn a skip', video: 'Video' };
    for (const k of Object.keys(want)) t.check(`${mode}: rotulo ${want[k]}`, L[k] === want[k], L[k]);
    t.check(`${mode}: botoes do monitor em ${mode === 'mobile' ? 'duas filas no maximo' : 'uma fila'}`, L.rows <= (mode === 'mobile' ? 2 : 1), L.rows);
    t.check(`${mode}: painel do genero sem ligacoes repetidas com o painel estendido`, L.withExt === 'none' && L.noExt !== 'none', JSON.stringify(L));
    if (mode === 'desktop') {
      const C = await r.page.evaluate(() => {
        const cs = (el, pseudo) => getComputedStyle(el, pseudo || null);
        const tmp = document.createElement('span'); tmp.className = 'fc-lv lv-contested'; document.getElementById('focus').appendChild(tmp);
        const dk = document.getElementById('dkBass'); dk.classList.add('on');
        const out = { ph: cs(document.getElementById('giftWhat'), '::placeholder').color, why: cs(document.getElementById('fcWhy')).color,
          seal: cs(document.getElementById('fcSealHint')).color, contested: cs(tmp).color,
          bass: [cs(dk).color, cs(dk).backgroundColor], keys: [cs(document.querySelector('.dkkeys')).color, cs(document.getElementById('desk')).getPropertyValue('--dk-wood').trim()],
          kv: cs(document.querySelector('.knob .kv')).color, line: cs(document.documentElement).getPropertyValue('--line').trim() };
        dk.classList.remove('on'); tmp.remove();
        return out;
      });
      const DIM = 'rgb(141, 144, 176)';
      t.check('cores: marcadores dos campos em --dim', C.ph === DIM, C.ph);
      t.check('cores: texto da respiracao e dica do ecra inteiro em --dim', C.why === DIM && C.seal === DIM, JSON.stringify([C.why, C.seal]));
      t.check('cores: prova contested no vermelho da paleta', C.contested === 'rgb(232, 57, 44)', C.contested);
      t.check('cores: borda e linhas em #3b3560', C.line === '#3b3560', C.line);
      const hex = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
      const rb = ratio(rgb(C.bass[0]), rgb(C.bass[1])), rk = ratio(rgb(C.keys[0]), hex(C.keys[1])), rv = ratio(rgb(C.kv), hex(C.keys[1]));
      t.check('cores: Kill the bass aceso em verde', C.bass[1] === 'rgb(28, 122, 58)', C.bass[1]);
      t.check('cores: consola com contraste AA (Kill the bass aceso, teclas, valores)', rb >= 4.5 && rk >= 4.5 && rv >= 4.5, [rb, rk, rv].map(x => x.toFixed(2)).join(' '));
    }
    const tb = [], fv = [];
    if (mode === 'desktop') {
      // a letra carrega do proprio site; tamanhos fluidos: iguais a 1440 px, +15% aos 2560 px
      const sizes = async () => r.page.evaluate(() => ['--fs-label', '--fs-small', '--fs-body', '--fs-title', '--fs-head'].map(v => {
        const d = document.createElement('div'); d.style.fontSize = 'var(' + v + ')'; document.body.appendChild(d); const x = parseFloat(getComputedStyle(d).fontSize); d.remove(); return +x.toFixed(1); }));
      const F = await r.page.evaluate(async () => { await document.fonts.ready; return { ok: document.fonts.check('16px Recursive'), st: [...document.fonts].filter(f => f.family.replace(/"/g, '') === 'Recursive').map(f => f.status) }; });
      t.check('letra: Recursive carregada do site', F.ok && F.st.indexOf('loaded') >= 0, JSON.stringify(F));
      const s1440 = await sizes();
      await r.page.setViewportSize({ width: 2560, height: 1000 }); await r.page.waitForTimeout(300);
      const s2560 = await sizes();
      await r.page.setViewportSize({ width: 1440, height: 900 }); await r.page.waitForTimeout(300);
      t.check('letra: tamanhos de sempre a 1440 px (10, 12, 13, 14, 16)', JSON.stringify(s1440) === JSON.stringify([10, 12, 13, 14, 16]), JSON.stringify(s1440));
      t.check('letra: tamanhos maiores a 2560 px (11,5, 13,8, 15, 16,1, 18,4)', JSON.stringify(s2560) === JSON.stringify([11.5, 13.8, 15, 16.1, 18.4]), JSON.stringify(s2560));
    }
    for (const open of [null, 'genreBtn', 'giftBtn', 'mixBtn', 'skipBtn', 'focusBtn']) {
      await r.page.evaluate((id) => {
        document.querySelectorAll('.panel.on .pclose').forEach(b => b.click());
        ['mixClose', 'skClose'].forEach(i => { const e = document.getElementById(i); if (e && e.offsetParent) e.click(); });
        if (id) document.getElementById(id).click();
      }, open);
      await r.page.waitForTimeout(500);
      tb.push(...(await r.page.evaluate(TYPE)).map(x => (open || 'emissao') + ': ' + x));
      fv.push(...(await r.page.evaluate(FV)).map(x => (open || 'emissao') + ': ' + x));
    }
    t.check(`${mode}: rotulos monoespacados e frases casuais (Recursive) na emissao, paineis e sala de foco`, fv.length === 0, [...new Set(fv)].slice(0, 6).join(' | '));
    await r.page.evaluate(() => document.getElementById('fcExit').click());
    t.check(`${mode}: letra (minimos e maiusculas) na emissao, paineis, Mixtapes, Earn a skip e sala de foco`, tb.length === 0, [...new Set(tb)].slice(0, 6).join(' | '));
    t.check(`${mode}: sem erros de JavaScript`, r.errors.length === 0, r.errors.join(' | '));
    await r.close();
  }

  // acento da madrugada (06h a 08h): pergaminho, nao o cinzento que parecia desligado
  const dw = await T.openLiquid(browser, { qs: '?block=dawn', dur: 60, load: 400 });
  await dw.run(2);
  const blk = await dw.page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--blk').trim());
  t.check('cores: acento da madrugada em pergaminho', blk === '#f4ecd9', blk);
  await dw.close();

  // porta da sala de foco em 390x844 com a linha de recomeco (segunda-feira e dia 1), totais e experiencia:
  // forca-se a linha, para o teste valer em qualquer dia
  // (o estado do t-focus: dois blocos de hoje no registo, para a porta ter totais, e uma experiencia em Read)
  const fd = await T.openLiquid(browser, { mode: 'mobile', dur: 60, load: 400, init: `if(!sessionStorage.getItem('mb')){ sessionStorage.setItem('mb','1');
    var d=new Date(), p=function(n){ return (n<10?'0':'')+n; }, k=d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());
    localStorage.setItem('hm_focus_log', JSON.stringify({ v:1, b:[{ t:d.getTime()-7200000, d:k, s:'write', p:'minimal', m:50 }, { t:d.getTime()-3600000, d:k, s:'write', p:'minimal', m:50 }],
      x:{ id:'xmob', s:'read', A:'nature', B:'silence', f:'A', t0:d.getTime(), un:{ A:0, B:0 } }, xp:[] })); }` });
  await fd.page.evaluate(() => document.getElementById('focusBtn').click());
  await fd.page.waitForTimeout(1500);
  const door = await fd.page.evaluate(async () => {
    const f = document.getElementById('fcFresh'); f.hidden = false; document.getElementById('fcFreshT').textContent = 'A fresh week: a good day to restart';
    await new Promise(res => setTimeout(res, 300));
    const b = (id) => { const e = document.getElementById(id); return e && !e.hidden && e.offsetParent ? Math.round(e.getBoundingClientRect().bottom) : null; };
    return { habit: b('fcHabit') !== null, begin: b('fcBegin'), adjust: b('fcAdjust'), h: innerHeight };
  });
  t.check('telemovel: porta da sala de foco cabe em 390x844 com a linha de recomeco, totais e experiencia',
    door.adjust !== null && door.adjust <= door.h && door.begin <= door.h, JSON.stringify(door));
  await fd.close();

  // ala da arte no telemovel: ficha aberta por cima da dica
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await T.serve(ctx, {});
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://hm.test/liquid/index.html');
  await page.waitForTimeout(600);
  await page.evaluate(() => document.getElementById('skipIntro').click());
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.getElementById('wartBtn').click());
  await page.waitForTimeout(1500);
  const a = await page.evaluate(async () => {
    const $ = (id) => document.getElementById(id);
    $('waHint').classList.add('on');
    $('waFichaBtn').click();
    await new Promise(res => setTimeout(res, 700));
    const top = (el) => { const b = el.getBoundingClientRect(); const e = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return e ? (e.closest('#wartFicha') ? 'ficha' : (e.id || e.tagName)) : null; };
    return { open: $('wartFicha').classList.contains('on'), hint: top($('waHint')), artist: top($('waFArtist')) };
  });
  t.check('telemovel: ficha da obra aberta', a.open, JSON.stringify(a));
  t.check('telemovel: a dica fica por baixo da ficha', a.hint === 'ficha', a.hint);
  t.check('telemovel: o nome do artista ve-se (nada por cima)', a.artist === 'ficha', a.artist);
  t.check('telemovel: ala da arte sem erros de JavaScript', errors.length === 0, errors.join(' | '));
  await ctx.close();

  await browser.close();
  t.done();
})().catch(e => { console.error('FAIL ui: excecao', e); process.exitCode = 1; });
