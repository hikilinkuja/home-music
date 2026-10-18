// Levantamento da interface da sala liquid (auditoria de UI e UX, ronda 0 e seguintes).
// Percorre os estados da sala no Chromium, com o YouTube simulado dos testes (ops/tests/lib), a
// 1440x900 e a 390x844; em cada estado guarda duas capturas (normal e sem texto, para medir o fundo
// real por baixo de cada linha) e mede o texto visivel, os controlos e as cores calculadas. Grava
// tambem a cobertura de CSS e de JavaScript da visita inteira. As capturas ficam na PASTA indicada,
// nunca no repositorio. Uso:
//   node ops/tools/ui_audit.js PASTA [desktop|mobile|ambos] [?block=flight]
// (o terceiro argumento fixa o bloco da grelha, para comparar antes e depois no mesmo bloco)
// Depois: python3 ops/tools/ui_report.py PASTA   (tabelas e contrastes a partir do data-*.json)
'use strict';
const fs = require('fs');
const path = require('path');
const { serve, launch, INIT } = require('../tests/lib/common.js');

const OUT = process.argv[2];
if (!OUT) { console.error('uso: node ops/tools/ui_audit.js PASTA [desktop|mobile]'); process.exit(2); }
const MODES = process.argv[3] && process.argv[3] !== 'ambos' ? [process.argv[3]] : ['desktop', 'mobile'];
const QS = process.argv[4] || '';

// medicao dentro da pagina: texto visivel (tamanho, espacamento, cor, retangulos), controlos e cores
const MEASURE = () => {
  const vw = innerWidth, vh = innerHeight;
  const effOp = (e) => { let o = 1; for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none') return 0; o *= parseFloat(c.opacity); } return o; };
  const painted = (e) => {
    if (/^(CANVAS|IMG|VIDEO|IFRAME|svg)$/i.test(e.tagName)) return true;
    const c = getComputedStyle(e);
    const bg = c.backgroundColor.match(/[\d.]+/g);
    return (bg && (bg.length < 4 || +bg[3] > 0.05)) || c.backgroundImage !== 'none';
  };
  const key = (e) => {
    let s = e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.classList.length ? '.' + [...e.classList].join('.') : '');
    if (!e.id) { for (let a = e.parentElement; a; a = a.parentElement) { if (a.id) { s = '#' + a.id + ' ' + s; break; } } }
    return s;
  };
  const cover = (el, cx, cy) => {
    for (const e of document.elementsFromPoint(cx, cy)) {
      if (e === el || el.contains(e) || e.contains(el)) return null;
      if (painted(e) && effOp(e) >= 0.05 && getComputedStyle(e).visibility === 'visible') return key(e);
    }
    return null;
  };
  const pe = document.createElement('style'); pe.textContent = '*{pointer-events:auto!important}'; document.head.appendChild(pe);
  const texts = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const txt = n.nodeValue.replace(/\s+/g, ' ').trim();
    const el = n.parentElement;
    if (!txt || !el || /^(SCRIPT|STYLE|NOSCRIPT|OPTION|TITLE)$/.test(el.tagName)) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    const rects = [...r.getClientRects()].filter(q => q.width > 0.5 && q.height > 0.5 && q.right > 0 && q.bottom > 0 && q.left < vw && q.top < vh);
    if (!rects.length) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility !== 'visible') continue;
    const op = effOp(el);
    if (op < 0.05) continue;
    const q = rects[0];
    const cov = cover(el, Math.min(vw - 1, Math.max(0, q.left + q.width / 2)), Math.min(vh - 1, Math.max(0, q.top + q.height / 2)));
    texts.push({
      key: key(el), tag: el.tagName.toLowerCase(), txt: txt.slice(0, 70), words: txt.split(' ').length,
      fs: parseFloat(cs.fontSize), ls: cs.letterSpacing, lh: cs.lineHeight, fw: cs.fontWeight, tt: cs.textTransform,
      ff: cs.fontFamily.split(',')[0].replace(/"/g, ''), color: cs.color, op: +op.toFixed(3), shadow: cs.textShadow !== 'none', covered: cov,
      rects: rects.slice(0, 4).map(z => [Math.max(0, z.left), Math.max(0, z.top), Math.min(vw, z.right), Math.min(vh, z.bottom)].map(v => +v.toFixed(1))),
    });
  }
  // campos de texto: o marcador (placeholder) tambem e texto que se le
  for (const el of document.querySelectorAll('input[placeholder],textarea[placeholder]')) {
    const b = el.getBoundingClientRect();
    if (b.width < 1 || b.bottom < 0 || b.top > vh || effOp(el) < 0.05 || getComputedStyle(el).visibility !== 'visible' || el.value) continue;
    const ps = getComputedStyle(el, '::placeholder');
    texts.push({ key: key(el) + '::placeholder', tag: 'placeholder', txt: el.placeholder.slice(0, 70), words: el.placeholder.split(' ').length,
      fs: parseFloat(ps.fontSize), ls: ps.letterSpacing, lh: ps.lineHeight, fw: ps.fontWeight, tt: ps.textTransform, ff: ps.fontFamily.split(',')[0].replace(/"/g, ''),
      color: ps.color, op: +effOp(el).toFixed(3), shadow: false, covered: cover(el, b.left + b.width / 2, b.top + b.height / 2),
      rects: [[b.left + 8, b.top + 4, Math.min(b.right - 8, b.left + 8 + el.placeholder.length * parseFloat(ps.fontSize) * 0.6), b.bottom - 4].map(v => +Math.max(0, v).toFixed(1))] });
  }
  // controlos visiveis e nao tapados
  const ctrls = [];
  for (const el of document.querySelectorAll('button,a[href],input,select,textarea,[role=button],[tabindex]:not([tabindex="-1"])')) {
    const b = el.getBoundingClientRect();
    if (b.width < 2 || b.height < 2 || b.right < 0 || b.bottom < 0 || b.left > vw || b.top > vh) continue;
    if (getComputedStyle(el).visibility !== 'visible' || effOp(el) < 0.05) continue;
    if (el.type === 'hidden') continue;
    const cov = cover(el, Math.min(vw - 1, Math.max(0, b.left + b.width / 2)), Math.min(vh - 1, Math.max(0, b.top + b.height / 2)));
    if (cov) continue;
    ctrls.push({ key: key(el), label: (el.innerText || el.value || el.getAttribute('aria-label') || el.title || el.placeholder || '').replace(/\s+/g, ' ').trim().slice(0, 50),
      title: el.title || '', aria: el.getAttribute('aria-label') || '', w: Math.round(b.width), h: Math.round(b.height) });
  }
  // cores calculadas de tudo o que se ve (texto, fundo, bordas)
  const colors = {};
  const add = (v, role, k) => { if (!v || /^rgba\(0, 0, 0, 0\)$/.test(v) || v === 'transparent') return; const o = colors[v] = colors[v] || { n: 0, roles: {}, keys: new Set() }; o.n++; o.roles[role] = (o.roles[role] || 0) + 1; if (o.keys.size < 6) o.keys.add(k); };
  for (const el of document.body.querySelectorAll('*')) {
    const b = el.getBoundingClientRect();
    if (b.width < 1 || b.height < 1 || b.right < 0 || b.bottom < 0 || b.left > vw || b.top > vh) continue;
    const c = getComputedStyle(el);
    if (c.visibility !== 'visible' || effOp(el) < 0.05) continue;
    const k = key(el);
    if ([...el.childNodes].some(x => x.nodeType === 3 && x.nodeValue.trim())) add(c.color, 'text', k);
    add(c.backgroundColor, 'bg', k);
    for (const s of ['Top', 'Right', 'Bottom', 'Left']) if (parseFloat(c['border' + s + 'Width']) > 0 && c['border' + s + 'Style'] !== 'none') { add(c['border' + s + 'Color'], 'border', k); break; }
    if (el.tagName.toLowerCase() === 'svg' || el.closest('svg')) add(c.stroke !== 'none' ? c.stroke : null, 'icon', k);
  }
  pe.remove();
  for (const v in colors) colors[v].keys = [...colors[v].keys];
  return { vw, vh, texts, ctrls, colors };
};

const NOTEXT = '*,*::before,*::after,*::placeholder{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important}';

async function run(mode) {
  const dir = path.join(OUT, mode);
  fs.mkdirSync(dir, { recursive: true });
  const browser = await launch();
  const vp = mode === 'mobile'
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
    : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
  const ctx = await browser.newContext(vp);
  await serve(ctx, { archive: 'ok', freesound: 'ok', aic: 'ok', load: 600 });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.coverage.startCSSCoverage({ resetOnNavigation: false });
  await page.coverage.startJSCoverage({ resetOnNavigation: false, reportAnonymousScripts: true });
  const states = [];
  let idx = 0;
  const wait = (ms) => page.waitForTimeout(ms);
  const click = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);
  const wake = async () => { await page.mouse.move(300 + Math.random() * 50, 300); await wait(120); };
  async function snap(name, note) {
    idx++;
    const base = String(idx).padStart(2, '0') + '-' + name;
    try {
      await page.screenshot({ path: path.join(dir, base + '.png') });
      const m = await page.evaluate(MEASURE);
      const h = await page.addStyleTag({ content: NOTEXT });
      await wait(60);
      await page.screenshot({ path: path.join(dir, base + '.notext.png') });
      await h.evaluate(e => e.remove());
      states.push({ name: base, note: note || '', dpr: vp.deviceScaleFactor, ...m });
      console.log(mode, base, 'textos', m.texts.length, 'controlos', m.ctrls.length);
    } catch (e) { console.log(mode, base, 'FALHOU', e.message); }
  }
  async function step(name, fn, note) { try { await fn(); await snap(name, note); } catch (e) { console.log(mode, name, 'FALHOU', e.message); } }

  await page.goto('http://hm.test/liquid/index.html' + QS);
  await wait(1500);
  await snap('splash', 'antes do primeiro toque');
  if (mode === 'mobile') await page.tap('#splash'); else await page.click('#splash');
  await wait(3500);
  await snap('intro', 'linhas da abertura com a faixa de abertura');
  await click('#skipIntro');
  for (let i = 0; i < 120; i++) { await wait(200); if (await page.evaluate(() => window.HM && HM.isOn())) break; }
  await wait(7000);
  await wake();
  await snap('main', 'emissao, sem paineis');
  if (mode === 'mobile') {
    await wait(7000);
    await snap('main-tip', 'dica do ecra fechado (12 s depois do arranque, so no telemovel)');
    await click('#braveTipOk');
  } else {
    await step('main-blurb', async () => { await click('#blurbMore'); await wait(300); }, 'descricao da faixa aberta');
    await click('#blurbMore');
  }
  const panel = async (btn, name, note, after) => {
    await step(name, async () => { await click(btn); await wait(after || 700); }, note);
    await page.evaluate(() => document.querySelectorAll('.panel.on .pclose').forEach(b => b.click()));
    await wait(200);
  };
  await panel('#genreBtn', 'genre', 'painel The sound');
  await panel('#danceBtn', 'dance', 'painel The dance nearby', 1500);
  await panel('#giftBtn', 'gift', 'painel Gift a tune');
  await panel('#histBtn', 'hist', 'painel Session log');
  await step('mixtapes', async () => { await click('#mixBtn'); await wait(900); }, 'gaveta Mixtapes');
  await click('#mixClose'); await wait(300);
  await step('skip', async () => { await click('#skipBtn'); await wait(500); }, 'Earn the skip');
  await click('#skClose'); await wait(300);
  await step('field', async () => { await click('#fieldBtn'); await wait(350); }, 'troca de campo com o nome do campo');
  await wait(2500);
  await step('art', async () => { await click('#wartBtn'); await wait(3500); }, 'ala da arte, esta semana');
  await step('art-sheet', async () => { await click('#waFichaBtn'); await wait(900); }, 'ficha da obra aberta');
  await click('#wartFichaClose'); await wait(400);
  await step('art-day', async () => { await click('.waWing[data-wing=day]'); await wait(3000); }, 'ala da arte, quadro do dia');
  await click('#waBack'); await wait(800);
  await step('arcade', async () => { await click('#arcBtn'); await wait(900); }, 'arcada, Drop the Needle');
  await step('arcade-play', async () => { await click('#arcStart'); await wait(7500); }, 'arcada, ronda a decorrer');
  await step('arcade-desk', async () => { await click('.arcTab[data-g=dk]'); await wait(700); }, 'arcada, Dub Desk');
  await click('#arcClose'); await wait(600);
  await step('focus-entry', async () => { await click('#focusBtn'); await wait(1800); }, 'sala de foco, entrada (primeira visita)');
  await step('focus-session', async () => { await click('#fcBegin'); await wait(2500); await wake(); }, 'sala de foco, sessao');
  await step('focus-why', async () => { await click('#fcWhyBtn'); await wait(1200); }, 'zona why?');
  await click('#fcLabX'); await wait(400);
  await step('focus-drawer', async () => { await wake(); await click('#fcMore'); await wait(800); }, 'gaveta de ajustes, topo');
  await step('focus-drawer-mid', async () => { await page.evaluate(() => { const d = document.getElementById('fcDrawer'); d.scrollTop = d.scrollHeight / 2 - d.clientHeight / 2; }); await wait(300); }, 'gaveta de ajustes, meio');
  await step('focus-drawer-end', async () => { await page.evaluate(() => { const d = document.getElementById('fcDrawer'); d.scrollTop = d.scrollHeight; }); await wait(300); }, 'gaveta de ajustes, fim');
  await click('#fcDrawerX'); await wait(500);
  await step('focus-break', async () => { await page.evaluate(() => { HMFR.fc.pomo.left = 1; }); await wait(2500); await wake(); }, 'sala de foco, intervalo');
  await click('#fcExit'); await wait(800);
  await step('back-main', async () => { await wake(); await wait(500); }, 'regresso a emissao');

  const css = await page.coverage.stopCSSCoverage();
  const js = await page.coverage.stopJSCoverage();
  fs.writeFileSync(path.join(OUT, 'data-' + mode + '.json'), JSON.stringify({ mode, errors, states }, null, 0));
  fs.writeFileSync(path.join(OUT, 'cov-css-' + mode + '.json'), JSON.stringify(css.map(c => ({ url: c.url, text: c.text, ranges: c.ranges }))));
  fs.writeFileSync(path.join(OUT, 'cov-js-' + mode + '.json'), JSON.stringify(js.filter(c => /hm\.test/.test(c.url)).map(c => ({ url: c.url, functions: c.functions }))));
  console.log(mode, 'estados', states.length, 'erros da pagina', errors.length, errors.slice(0, 3).join(' | '));
  await browser.close();
}

(async () => { for (const m of MODES) await run(m); })();
