// Chuva da sala de foco no maximo (v4.0): com CORS, o ganho WebAudio chega a 1,8 (+6 dB sobre o
// maximo antigo de 0,9); sem CORS, o recurso toca duas copias da chuva a volume 1,0; com o fader a
// 0, tudo calado. Cerca de 40 segundos.
'use strict';
const T = require('./lib/common');

const SPY = `
window.__rain={ targets:[], vols:[] };
(function(){
  var sta=AudioParam.prototype.setTargetAtTime;
  AudioParam.prototype.setTargetAtTime=function(v){ window.__rain.targets.push(v); return sta.apply(this, arguments); };
  var d=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'volume'), n=0;
  Object.defineProperty(HTMLMediaElement.prototype, 'volume', { configurable:true,
    get:function(){ return d.get.call(this); },
    set:function(v){ if(!this.__id) this.__id=++n; window.__rain.vols.push({ id:this.__id, src:String(this.src), v:v }); d.set.call(this, v); } });
})();`;

const fader = (page, v) => page.evaluate((v) => { const f = document.getElementById('fcRn'); f.value = v; f.dispatchEvent(new Event('input', { bubbles: true })); }, v);
const rainVols = (page) => page.evaluate(() => {
  const last = {}; window.__rain.vols.filter(x => x.src.includes('869851')).forEach(x => { last[x.id] = x.v; });
  return Object.values(last);
});

(async () => {
  const t = T.suite('rain');
  const browser = await T.launch();

  /* 1) com CORS (o substituto servido pelo Playwright passa a verificacao CORS) */
  let r = await T.openLiquid(browser, { mode: 'desktop', dur: 300, freesound: 'ok', init: SPY });
  await r.act('focusOpen'); await r.page.waitForTimeout(1500);
  await fader(r.page, 100); await r.page.waitForTimeout(1500);
  const tg = await r.page.evaluate(() => Math.max(0, ...window.__rain.targets));
  t.check('CORS: ganho da chuva no maximo e 1,8 (+6 dB)', Math.abs(tg - 1.8) < 0.01, tg);
  t.check('CORS: sem erros de JavaScript', r.errors.length === 0, r.errors.join(' | '));
  await r.close();

  /* 2) sem CORS: servidor local sem cabecalhos, a pagina aponta o freesound para ele */
  const srv = await T.noCorsServer();
  r = await T.openLiquid(browser, { mode: 'desktop', dur: 300, init: SPY, page: (h) => h.split('https://cdn.freesound.org').join(srv.url) });
  await r.act('focusOpen'); await r.page.waitForTimeout(1500);
  await fader(r.page, 100); await r.page.waitForTimeout(2500);
  let v = await rainVols(r.page);
  t.check('sem CORS: duas copias da chuva a volume 1,0', v.filter(x => x >= 0.99).length >= 2, JSON.stringify(v));
  await fader(r.page, 0); await r.page.waitForTimeout(1500);
  v = await rainVols(r.page);
  t.check('sem CORS: fader a 0 cala a chuva', v.length && v.every(x => x === 0), JSON.stringify(v));
  t.check('sem CORS: sem erros de JavaScript', r.errors.length === 0, r.errors.join(' | '));
  await r.close(); srv.close();

  await browser.close();
  t.done();
})().catch(e => { console.error('FAIL rain: excecao', e); process.exitCode = 1; });
