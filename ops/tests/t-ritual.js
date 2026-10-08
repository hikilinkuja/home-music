// Troca de disco (motor, v4.0): cada disco toca ate ao fim; levantar da agulha, 2,0 s no relogio
// de audio, pousar, musica cerca de 0,4 s depois; kit dub no intervalo so depois de reggae, dub,
// ska_rocksteady e ragga_jungle. Tempo real: cerca de 2 minutos.
'use strict';
const T = require('./lib/common');

(async () => {
  const t = T.suite('ritual');
  const browser = await T.launch();
  const CASES = [
    { mode: 'desktop', block: 'kingston', kit: true },
    { mode: 'mobile', block: 'flight', kit: false },
  ];
  for (const c of CASES) {
    const r = await T.openLiquid(browser, { mode: c.mode, qs: '?block=' + c.block, dur: 20, load: 1200 });
    await r.run(50);
    const a = T.analyse(await r.log());
    const tag = `${c.mode}/${c.block}`;
    t.check(`${tag}: sem erros de JavaScript`, r.errors.length === 0, r.errors.join(' | '));
    const ended = a.records.filter(x => x.endedT != null);
    t.check(`${tag}: pelo menos dois discos chegaram ao fim`, ended.length >= 2, ended.length);
    const short = ended.filter(x => x.endedCur < x.dur - 0.05 || x.cuts.length);
    t.check(`${tag}: nenhum disco cortado antes do fim`, short.length === 0, JSON.stringify(short.map(x => ({ vid: x.vid, cur: x.endedCur, dur: x.dur, cuts: x.cuts }))));
    const done = a.rituals.filter(x => x.gap != null);
    t.check(`${tag}: cada levantar tem o seu pousar`, a.rituals.length >= 2 && done.length === a.rituals.length, JSON.stringify(a.rituals));
    t.check(`${tag}: intervalo levantar-pousar de 2,0 s (+-0,05)`, done.length && done.every(x => Math.abs(x.gap - 2) <= 0.05), done.map(x => x.gap.toFixed(3)).join(' '));
    t.check(`${tag}: musica entra 0,25 a 1,0 s depois do pousar`, done.length && done.every(x => x.rise != null && x.rise >= 0.25 && x.rise <= 1.0), done.map(x => x.rise).join(' '));
    const kits = done.map(x => x.kitSources);
    if (c.kit) t.check(`${tag}: kit dub no intervalo`, kits.every(k => k > 0), kits.join(' '));
    else t.check(`${tag}: sem kit no intervalo`, kits.every(k => k === 0), kits.join(' '));
    await r.close();
  }
  await browser.close();
  t.done();
})().catch(e => { console.error('FAIL ritual: excecao', e); process.exitCode = 1; });
