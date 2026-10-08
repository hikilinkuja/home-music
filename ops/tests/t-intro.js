// Introducao robusta (v4.0): se o archive.org responder 5 s depois do toque, a introducao toca
// com as linhas do MC; se responder com erro, a emissao arranca e o motivo fica em hm_intro_log.
// Tempo real: cerca de 30 segundos.
'use strict';
const T = require('./lib/common');

async function scenario(browser, archive, secs) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const st = await T.serve(ctx, { archive, freesound: 'ok', dur: 300 });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://hm.test/liquid/index.html');
  await page.waitForTimeout(400);
  st.tap = Date.now();
  await page.mouse.click(683, 400);
  await page.waitForTimeout(secs * 1000);
  const r = await page.evaluate(() => ({
    lines: document.querySelectorAll('#mc .mc-line.show').length,
    log: localStorage.getItem('hm_intro_log') || '[]',
    on: !!(window.HM && HM.isOn()),
  }));
  await ctx.close();
  return Object.assign(r, { errors });
}

(async () => {
  const t = T.suite('intro');
  const browser = await T.launch(['--autoplay-policy=document-user-activation-required']);
  let r = await scenario(browser, { delayMs: 5000 }, 13);
  t.check('archive.org lento (5 s): linhas do MC aparecem', r.lines >= 1, JSON.stringify(r));
  t.check('archive.org lento (5 s): registado como ok', /"ok"/.test(r.log), r.log);
  t.check('archive.org lento: sem erros de JavaScript', r.errors.length === 0, r.errors.join(' | '));
  r = await scenario(browser, '503', 6);
  t.check('archive.org com erro: motivo registado em hm_intro_log', /error/.test(r.log), r.log);
  t.check('archive.org com erro: a emissao arranca', r.on, JSON.stringify(r));
  await browser.close();
  t.done();
})().catch(e => { console.error('FAIL intro: excecao', e); process.exitCode = 1; });
