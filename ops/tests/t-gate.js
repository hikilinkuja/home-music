// Efeitos da emissao calados com a radio de lado (motor, v4.0): com a sala de foco aberta ou em
// mute, nenhuma fonte de som no contexto de efeitos do motor e o master a 0; ao fechar o foco,
// os efeitos voltam. Tempo real: cerca de 1 minuto e meio.
'use strict';
const T = require('./lib/common');

function fxSources(log, from, to) {
  return log.filter(e => e.ev === 'src' && e.ctx === 0 && e.t > from && e.t < to);
}

(async () => {
  const t = T.suite('gate');
  const browser = await T.launch();

  /* 1) sala de foco aberta durante duas trocas */
  let r = await T.openLiquid(browser, { mode: 'desktop', qs: '?block=kingston', dur: 15, load: 800 });
  await r.run(40, [{ at: 2, do: 'focusOpen' }, { at: 36, do: 'focusClose' }]);
  let log = await r.log();
  const open = log.find(e => e.ev === 'ACTION' && e.do === 'focusOpen'), close = log.find(e => e.ev === 'ACTION' && e.do === 'focusClose');
  const ends = log.filter(e => e.ev === 'state' && e.st === 0 && e.t > open.t + 500 && e.t < close.t);
  t.check('foco: sem erros de JavaScript', r.errors.length === 0, r.errors.join(' | '));
  t.check('foco: houve trocas de disco com o foco aberto', ends.length >= 1, ends.length);
  const leak = fxSources(log, open.t + 500, close.t);
  t.check('foco: nenhum efeito da emissao com o foco aberto', leak.length === 0, JSON.stringify(leak.slice(0, 5).map(e => e.who)));
  const lv = log.filter(e => e.ev === 'lvl' && e.t > open.t + 800 && e.t < close.t);
  t.check('foco: master dos efeitos a 0', lv.length && lv.every(e => e.m === 0), lv.slice(0, 5).map(e => e.m).join(' '));
  const after = log.filter(e => e.ev === 'lvl' && e.t > close.t + 2500);
  t.check('foco: efeitos voltam depois de fechar', after.length && after[after.length - 1].m > 0, after.map(e => e.m).join(' '));
  await r.close();

  /* 2) mute */
  r = await T.openLiquid(browser, { mode: 'desktop', qs: '?block=kingston', dur: 12, load: 800 });
  await r.run(30, [{ at: 2, do: 'mute' }]);
  log = await r.log();
  const mute = log.find(e => e.ev === 'ACTION' && e.do === 'mute');
  const ends2 = log.filter(e => e.ev === 'state' && e.st === 0 && e.t > mute.t + 500);
  t.check('mute: houve trocas de disco em mute', ends2.length >= 1, ends2.length);
  const leak2 = fxSources(log, mute.t + 500, Infinity);
  t.check('mute: nenhum efeito da emissao em mute', leak2.length === 0, JSON.stringify(leak2.slice(0, 5).map(e => e.who)));
  await r.close();

  await browser.close();
  t.done();
})().catch(e => { console.error('FAIL gate: excecao', e); process.exitCode = 1; });
