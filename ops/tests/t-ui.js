// Auditoria de UI (ops/prompts/ui-audit.md), ronda 1: correcoes e termos.
// Session log: as linhas que o motor escreve tem estilo (ligacoes em teal, sem sublinhado, separadas,
// contraste AA sobre o painel); ala da arte no telemovel: com a ficha aberta, a dica (#waHint) nao fica
// por cima da ficha nem do nome do artista. Cerca de 40 segundos.
'use strict';
const T = require('./lib/common');

const lum = (c) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);

(async () => {
  const t = T.suite('ui');
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
    t.check(`${mode}: sem erros de JavaScript`, r.errors.length === 0, r.errors.join(' | '));
    await r.close();
  }

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
