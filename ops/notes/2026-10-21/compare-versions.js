// Compara o som da emissao entre versoes publicadas, com o YouTube simulado sincrono e assincrono (como o
// verdadeiro; lib/common.js, ytAsync). Para cada versao (commit do git) serve o liquid/index.html desse commit,
// liga a emissao, deixa tocar 30 s, faz mute e unmute (3 s) e mede mais 10 s. Mede o estado verdadeiro dos
// leitores do simulador a cada 100 ms: primeiro som, segundos audiveis, segmentos audiveis e volume.
// Uso: node ops/notes/2026-10-21/compare-versions.js c619c77,0a28961,ad9ca8b,HEAD [sync,async]
// (HEAD = a pasta de trabalho, como esta). Cerca de 1 minuto por versao e modo.
'use strict';
const path = require('path');
const cp = require('child_process');
const T = require(path.join(__dirname, '..', '..', 'tests', 'lib', 'common.js'));
const revs = (process.argv[2] || 'HEAD').split(',');
const modes = (process.argv[3] || 'sync,async').split(',');
const SAMPLE = `(() => { window.__aud = []; setInterval(() => { try {
  const k = HMENG.state().active, p = __players['yt' + k];
  const au = (x) => !!(x && x.st === 1 && !x.mu && x.vol > 0);
  window.__aud.push({ t: performance.now(), a: au(p), vol: p ? p.vol : null });
} catch (e) {} }, 100); })()`;
function summary(aud, t0) {
  const s = aud.filter(x => x.t >= t0); let first = null, ms = 0, prev = false, start = null; const segs = [];
  for (const x of s) {
    if (x.a && first === null) first = x.t - t0; if (x.a) ms += 100;
    if (x.a && !prev) start = x.t - t0; if (!x.a && prev) segs.push([+(start / 1000).toFixed(1), +((x.t - t0) / 1000).toFixed(1)]);
    prev = x.a;
  }
  if (prev) segs.push([+(start / 1000).toFixed(1), 'fim']);
  const v = s.filter(x => x.a).map(x => x.vol);
  return { primeiroSom: first === null ? null : +(first / 1000).toFixed(1), audivelS: +(ms / 1000).toFixed(1), segmentos: segs.slice(0, 8), volumeMax: v.length ? Math.max(...v) : 0 };
}
(async () => {
  const browser = await T.launch();
  for (const rev of revs) for (const m of modes) {
    const o = { dur: 300 };
    if (m === 'async') o.ytAsync = {};
    if (rev !== 'HEAD') { const html = cp.execFileSync('git', ['show', rev + ':liquid/index.html'], { cwd: T.ROOT, maxBuffer: 64 << 20 }).toString('utf8'); o.page = () => html; }
    const L = await T.openLiquid(browser, o);
    await L.page.evaluate(SAMPLE);
    const t0 = await L.page.evaluate(() => performance.now());
    await L.run(30);
    const tm = await L.page.evaluate(() => performance.now());
    await L.act('mute'); await L.run(3); await L.act('mute'); await L.run(10);
    const aud = await L.page.evaluate(() => window.__aud);
    console.log(JSON.stringify({ versao: rev, modo: m, arranque: summary(aud, t0), depoisDoUnmute: summary(aud, tm + 3000) }));
    await L.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
