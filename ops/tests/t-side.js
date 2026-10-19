// Radio de lado (sala de foco aberta): nenhum leitor da radio se ouve, mesmo que o YouTube reponha um volume
// seu quando a musica comeca (com e sem tirar o mudo); ao fechar a sala, a radio volta a ouvir-se.
// Queixa do Paulo a 2026-10-19: a radio, baixinha, por tras da sala de foco ao fim de alguns minutos.
// O YouTube simulado ganha window.__ytRule com restore (lib/common.js). Discos de 25 s, para haver trocas.
// Cerca de 2 minutos.
'use strict';
const T = require('./lib/common');

// tempo (ms) em que cada leitor da radio esteve audivel (estado 1, volume > 0, sem mudo) entre t0 e t1
const audibleMs = (log, t0, t1, els) => {
  const S = {}, ms = {}, firstAt = {};
  let last = null;
  for (const e of log) {
    if (last !== null) for (const k of els) {
      const s = S[k]; if (!s) continue;
      const a = Math.max(last, t0), b = Math.min(e.t, t1);
      if (b > a && s.st === 1 && s.vol > 0 && !s.mu) { ms[k] = (ms[k] || 0) + (b - a); if (firstAt[k] == null) firstAt[k] = Math.round(a - t0); }
    }
    last = e.t;
    if (!e.el || els.indexOf(e.el) < 0) continue;
    const s = S[e.el] = S[e.el] || { st: -1, vol: 100, mu: false };
    if (e.ev === 'state') s.st = e.st; if (e.ev === 'vol') s.vol = e.v; if (e.ev === 'mute') s.mu = true; if (e.ev === 'unmute') s.mu = false;
    if (e.ev === 'restore') { s.vol = e.vol; s.mu = e.mu; }
  }
  const tot = Object.values(ms).reduce((x, y) => x + y, 0);
  return { tot: Math.round(tot), ms, firstAt };
};

(async () => {
  const t = T.suite('side');
  const browser = await T.launch();
  const VAR = [
    { n: 'repoe o volume no arranque', unmute: false },
    { n: 'repoe o volume e tira o mudo no arranque', unmute: true },
    { n: 'repoe o volume depois de um anuncio a meio do disco', unmute: false, each: true, mid: true },
    { n: 'tira o mudo sozinho a meio da musica', unmute: false, now: true },
  ];
  for (const v of VAR) {
    // so os leitores da radio (ytA, ytB) repoem: o leitor da sala de foco fica como sempre
    const init = v.now ? '' : `window.__ytRule=function(o){ return (o.el==='ytA'||o.el==='ytB') ? { restore:{ vol:30, unmute:${v.unmute}, each:${!!v.each} } } : {}; };`;
    const r = await T.openLiquid(browser, { mode: 'desktop', dur: 25, load: 400, init });
    await r.run(4);
    await r.act('focusOpen');
    await r.page.waitForTimeout(3200);                  // o esbatido da radio leva 2,6 s
    const t0 = await r.page.evaluate(() => performance.now());
    // tres trocas de disco na radio, de lado; nas variantes do meio do disco, aos 8 s e aos 38 s, no prato do ar
    const poke = async () => r.page.evaluate((v) => { const p = __players['yt' + HMENG.state().active]; if (v.mid) p._midroll(3); else if (v.now) p._restoreNow(30); }, v);
    if (v.mid || v.now) { await r.run(8); await poke(); await r.run(30); await poke(); await r.run(37); }
    else await r.run(75);
    const t1 = await r.page.evaluate(() => performance.now());
    await r.act('focusClose');
    await r.run(30);                                    // de volta: a radio tem de se ouvir
    const log = await r.log();
    const loads = log.filter(e => e.ev === 'load' && e.t > t0 && e.t < t1 && (e.el === 'ytA' || e.el === 'ytB')).length;
    const aside = audibleMs(log, t0, t1, ['ytA', 'ytB']);
    t.check(`${v.n}: houve trocas de disco com a radio de lado`, loads >= 2, loads);
    t.check(`${v.n}: radio calada com a sala de foco aberta (menos de 0,1 s audivel em 75 s)`, aside.tot < 100, JSON.stringify(aside));
    const back = audibleMs(log, t1 + 3000, t1 + 30000, ['ytA', 'ytB']);
    t.check(`${v.n}: radio volta a ouvir-se ao fechar a sala (mais de 15 s em 27 s)`, back.tot > 15000, JSON.stringify(back));
    const vmax = Math.max(0, ...log.filter(e => e.ev === 'vol' && e.t > t1 && (e.el === 'ytA' || e.el === 'ytB')).map(e => e.v));
    t.check(`${v.n}: e no volume da radio, acima dos 30 repostos pelo YouTube`, vmax > 30, vmax);
    t.check(`${v.n}: sem erros de JavaScript`, r.errors.length === 0, r.errors.join(' | '));
    await r.close();
  }
  await browser.close();
  t.done();
})().catch(e => { console.error('FAIL side: excecao', e); process.exitCode = 1; });
