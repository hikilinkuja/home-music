// Galeria da liquid (v4.0): o filme 1 aparece inteiro (object-fit:contain) e nao fica tapado pela
// barra de topo nem pela ficha, em telemovel de pe e deitado e no computador; «Back to the radio»
// e «Back to the full room» com o debrum vermelho; a pinca amplia a obra e nao a pagina.
// Usa um filme de substituicao em 4:3 gerado pelo ffmpeg. Cerca de 40 segundos.
'use strict';
const T = require('./lib/common');

const VPS = [
  { n: 'telemovel 390x844', o: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } },
  { n: 'telemovel 360x740', o: { viewport: { width: 360, height: 740 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } },
  { n: 'telemovel deitado 844x390', o: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } },
  { n: 'computador 1440x900', o: { viewport: { width: 1440, height: 900 } } },
];

const MEASURE = () => {
  const $ = (id) => document.getElementById(id);
  const R = (el) => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
  const vis = (el) => el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
  const inter = (a, b) => { const w = Math.min(a.r, b.r) - Math.max(a.x, b.x), h = Math.min(a.b, b.b) - Math.max(a.y, b.y); return (w > 0.5 && h > 0.5) ? Math.round(w * h) : 0; };
  const v = $('waVid');
  if (!vis(v) || !v.videoWidth) return { film: false };
  const box = R(v), s = Math.min(box.w / v.videoWidth, box.h / v.videoHeight), w = v.videoWidth * s, h = v.videoHeight * s;
  const art = { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, r: box.x + (box.w + w) / 2, b: box.y + (box.h + h) / 2 };
  const btns = Array.from(document.querySelectorAll('#waBar .tbtn')).filter(vis).map(R);
  const hint = $('waHint');
  return {
    film: true, fit: getComputedStyle(v).objectFit,
    inView: art.x >= -0.5 && art.y >= -0.5 && art.r <= innerWidth + 0.5 && art.b <= innerHeight + 0.5,
    overBar: btns.reduce((n, b) => n + inter(art, b), 0), overCap: inter(art, R($('waCap'))),
    hintOut: vis(hint) && hint.classList.contains('on') ? (R(hint).x < -0.5 || R(hint).r > innerWidth + 0.5) : false,
    touch: getComputedStyle($('wart')).touchAction,
    back: { cls: $('waBack').classList.contains('back'), shadow: getComputedStyle($('waBack')).boxShadow },
    fcBack: !!document.querySelector('#fcExit.back'),
  };
};

(async () => {
  const t = T.suite('art');
  if (!T.media().film) { t.warn('ffmpeg indisponivel: sem filme de substituicao, teste saltado'); return t.done(); }
  const browser = await T.launch();
  for (const vp of VPS) {
    const ctx = await browser.newContext(vp.o);
    await T.serve(ctx, {});
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://hm.test/liquid/index.html');
    await page.waitForTimeout(600);
    await page.evaluate(() => document.getElementById('skipIntro').click());
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.getElementById('wartBtn').click());
    await page.waitForFunction(() => { const v = document.getElementById('waVid'); return v && v.videoWidth > 0; }, null, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(600);
    const m = await page.evaluate(MEASURE);
    t.check(`${vp.n}: filme carregado e visivel`, m.film, JSON.stringify(m));
    if (m.film) {
      t.check(`${vp.n}: filme inteiro (contain)`, m.fit === 'contain', m.fit);
      t.check(`${vp.n}: filme dentro do ecra`, m.inView, JSON.stringify(m));
      t.check(`${vp.n}: barra de topo nao tapa o filme`, m.overBar === 0, m.overBar);
      t.check(`${vp.n}: ficha nao tapa o filme`, m.overCap === 0, m.overCap);
      t.check(`${vp.n}: dica dentro do ecra`, !m.hintOut);
      t.check(`${vp.n}: pinca amplia a obra, nao a pagina (touch-action none)`, m.touch === 'none', m.touch);
      t.check(`${vp.n}: Back to the radio com debrum vermelho`, m.back.cls && m.back.shadow.includes('232, 57, 44'), JSON.stringify(m.back));
      t.check(`${vp.n}: Back to the full room com debrum vermelho`, m.fcBack);
    }
    t.check(`${vp.n}: sem erros de JavaScript`, errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  await browser.close();
  t.done();
})().catch(e => { console.error('FAIL art: excecao', e); process.exitCode = 1; });
