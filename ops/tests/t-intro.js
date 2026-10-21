// Introducao robusta (v4.0; fontes de reserva na v5.8): a abertura e a agulha tocam primeiro a copia do
// proprio site (sfx/) e so usam o archive.org e o freesound se a copia faltar ou falhar. Cenarios: copia do
// site a funcionar (o archive.org nem e pedido); copia em falta e archive.org lento (5 s depois do toque): toca
// a reserva; as duas fontes em baixo: a emissao arranca e o motivo fica em hm_intro_log; a agulha pela copia
// do site e, sem ela, pelo freesound; os ficheiros verdadeiros de sfx/ tocam (a faixa e longa que chegue). Tempo real: cerca de
// 70 segundos.
'use strict';
const fs = require('fs');
const path = require('path');
const T = require('./lib/common');

// regista, por endereco, o tempo maximo a que cada audio chegou (prova de que tocou e de onde)
const PROBE = `(() => {
  window.__mx = {}; window.__du = {};
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    const el = this;
    if (!el.__probe) { el.__probe = 1; el.addEventListener('timeupdate', () => {
      const k = el.currentSrc || el.src; if (k) { window.__mx[k] = Math.max(window.__mx[k] || 0, el.currentTime); window.__du[k] = el.duration; } }); }
    return play.apply(this, arguments);
  };
})();`;

async function scenario(browser, o, secs, how) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const st = await T.serve(ctx, Object.assign({ freesound: 'ok', dur: 300 }, o));
  await ctx.addInitScript(PROBE);
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const reqs = []; page.on('request', q => reqs.push(q.url()));
  await page.goto('http://hm.test/liquid/index.html');
  await page.waitForTimeout(400);
  st.tap = Date.now();
  if (how === 'skip') await page.click('#skipIntro'); else await page.mouse.click(683, 400);
  await page.waitForTimeout(secs * 1000);
  const r = await page.evaluate(() => ({
    lines: document.querySelectorAll('#mc .mc-line.show').length,
    log: localStorage.getItem('hm_intro_log') || '[]',
    on: !!(window.HM && HM.isOn()),
    mx: window.__mx,
    du: window.__du,
  }));
  await ctx.close();
  const last = (() => { try { const L = JSON.parse(r.log); return L[L.length - 1] || {}; } catch (e) { return {}; } })();
  const reached = (re) => Math.max(0, ...Object.keys(r.mx || {}).filter(k => re.test(k)).map(k => r.mx[k]));
  return Object.assign(r, { errors, reqs, last, reached });
}

(async () => {
  const t = T.suite('intro');
  const browser = await T.launch(['--autoplay-policy=document-user-activation-required']);

  let r = await scenario(browser, { sfx: 'ok', archive: 'abort' }, 9);
  t.check('copia do site: linhas do MC aparecem', r.lines >= 1, JSON.stringify(r.last));
  t.check('copia do site: registado como ok, fonte 0, sem falhas', r.last.why === 'ok' && r.last.si === 0 && !r.last.fb, JSON.stringify(r.last));
  t.check('copia do site: o archive.org nem e pedido', !r.reqs.some(u => u.includes('archive.org/download/DPH011')), r.reqs.filter(u => u.includes('archive')).join(' '));
  t.check('copia do site: o audio que toca e o de sfx/', r.reached(/\/sfx\/intro-sound-killah\.mp3$/) > 3, JSON.stringify(r.mx));
  t.check('copia do site: sem erros de JavaScript', r.errors.length === 0, r.errors.join(' | '));

  // o ficheiro verdadeiro do repositorio (o validate.py exige-o): toca, mostra linhas e dura mais do que a abertura
  if (fs.existsSync(path.join(__dirname, '..', '..', 'sfx', 'intro-sound-killah.mp3'))) {
    r = await scenario(browser, { sfx: 'real', archive: 'abort' }, 9);
    const du = Math.max(0, ...Object.keys(r.du || {}).filter(k => /intro-sound-killah/.test(k)).map(k => r.du[k] || 0));
    t.check('ficheiro real em sfx/: toca pela fonte 0 e mostra linhas do MC', r.lines >= 1 && r.last.why === 'ok' && r.last.si === 0, JSON.stringify(r.last));
    t.check('ficheiro real em sfx/: dura mais de 31 s (fade aos 28,5 s)', du > 31, 'duracao ' + du);
  } else t.warn('sfx/intro-sound-killah.mp3 ausente: cenario do ficheiro real por correr');
  if (fs.existsSync(path.join(__dirname, '..', '..', 'sfx', 'vinyl-625771.mp3'))) {
    r = await scenario(browser, { sfx: 'real', archive: 'abort', freesound: 'abort' }, 6, 'skip');
    t.check('vinil real em sfx/: a agulha toca do segundo 13 e passa dos 14 s', r.reached(/\/sfx\/vinyl-625771\.mp3$/) >= 14, JSON.stringify(r.mx));
    t.check('vinil real em sfx/: a emissao arranca', r.on, '');
  } else t.warn('sfx/vinyl-625771.mp3 ausente: cenario do vinil real por correr');

  r = await scenario(browser, { sfx: '404', archive: { delayMs: 5000 } }, 13);
  t.check('copia em falta, archive.org lento (5 s): linhas do MC aparecem', r.lines >= 1, JSON.stringify(r.last));
  t.check('copia em falta, archive.org lento: ok pela fonte 1, falha da 0 registada', r.last.why === 'ok' && r.last.si === 1 && /^0:/.test(r.last.fb || ''), JSON.stringify(r.last));
  t.check('copia em falta: sem erros de JavaScript', r.errors.length === 0, r.errors.join(' | '));

  r = await scenario(browser, { sfx: 'abort', archive: '503' }, 6);
  t.check('as duas fontes em baixo: motivo error registado, com as duas falhas', r.last.why === 'error' && /0:/.test(r.last.fb || '') && /1:/.test(r.last.fb || ''), JSON.stringify(r.last));
  t.check('as duas fontes em baixo: a emissao arranca', r.on, JSON.stringify(r.last));

  r = await scenario(browser, { sfx: 'ok', freesound: 'abort' }, 6, 'skip');
  t.check('agulha pela copia do site: o vinil passa dos 14 s', r.reached(/\/sfx\/vinyl-625771\.mp3$/) >= 14, JSON.stringify(r.mx));
  t.check('agulha pela copia do site: o freesound nem e pedido', !r.reqs.some(u => u.includes('625771_9351406')), '');
  t.check('agulha pela copia do site: a emissao arranca', r.on, '');

  r = await scenario(browser, { sfx: '404', freesound: 'ok' }, 6, 'skip');
  t.check('agulha sem copia: o vinil do freesound passa dos 14 s', r.reached(/625771_9351406-hq\.mp3$/) >= 14, JSON.stringify(r.mx));
  t.check('agulha sem copia: a emissao arranca', r.on, '');
  t.check('agulha sem copia: sem erros de JavaScript', r.errors.length === 0, r.errors.join(' | '));

  await browser.close();
  t.done();
})().catch(e => { console.error('FAIL intro: excecao', e); process.exitCode = 1; });
