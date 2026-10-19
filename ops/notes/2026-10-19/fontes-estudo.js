// Estudo de letras (ronda 3b): aplica cada par a pagina real e fotografa cinco contextos a 1920x1080.
const T = require('/home/user/home-music/ops/tests/lib/common.js');
const OUT = process.argv[2];
const GF = (q) => 'https://fonts.googleapis.com/css2?' + q + '&display=swap';
const V = [
  { k: '0-atual', n: 'Atual: Courier New (sistema)' },
  { k: '1-courier-prime', n: 'Courier Prime (tudo)', css: 'family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700', label: '"Courier Prime"', text: '"Courier Prime"' },
  { k: '2-plex', n: 'IBM Plex Mono + IBM Plex Sans', css: 'family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,700;1,400&family=IBM+Plex+Sans:ital,wght@0,400;0,500;1,400', label: '"IBM Plex Mono"', text: '"IBM Plex Sans"' },
  { k: '3-space', n: 'Space Mono + Space Grotesk', css: 'family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Space+Grotesk:wght@400;500', label: '"Space Mono"', text: '"Space Grotesk"' },
  { k: '4-prime-literata', n: 'Courier Prime + Literata', css: 'family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Literata:ital,opsz,wght@0,7..72,400;1,7..72,400', label: '"Courier Prime"', text: 'Literata' },
  { k: '5-atkinson', n: 'Atkinson Hyperlegible Mono + Next', css: 'family=Atkinson+Hyperlegible+Mono:ital,wght@0,400;0,700;1,400&family=Atkinson+Hyperlegible+Next:ital,wght@0,400;0,500;1,400', label: '"Atkinson Hyperlegible Mono"', text: '"Atkinson Hyperlegible Next"' },
  { k: '6-recursive', n: 'Recursive (mono nos rotulos, casual no texto)', css: 'family=Recursive:slnt,wght,CASL,CRSV,MONO@-15..0,300..1000,0..1,0..1,0..1', label: 'Recursive', text: 'Recursive', rec: true },
];
const APPLY = ({ label, text, rec }) => {
  if (!label) return;
  const root = document.documentElement;
  root.style.setProperty('--mono', label + ', ui-monospace, monospace');
  document.body.style.fontFamily = 'var(--mono)';
  if (rec) root.style.fontVariationSettings = '"MONO" 1, "CASL" 0';
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  const done = new Set();
  while ((n = w.nextNode())) {
    const el = n.parentElement; if (!el || done.has(el) || !n.nodeValue.trim()) continue; done.add(el);
    if (/^(SCRIPT|STYLE)$/.test(el.tagName) || el.closest('#tArtist,#tTitle,#fcTime,#clock,#fcClock,.tbtn,#fcBegin')) continue;
    const cs = getComputedStyle(el);
    if (cs.textTransform === 'uppercase' || parseFloat(cs.fontSize) < 12) continue;
    el.style.fontFamily = text + ', system-ui, sans-serif';
    if (rec) el.style.fontVariationSettings = '"MONO" 0, "CASL" 0.6';
  }
  for (const el of document.querySelectorAll('input[type=text],textarea')) { el.style.fontFamily = text + ', system-ui, sans-serif'; if (rec) el.style.fontVariationSettings = '"MONO" 0, "CASL" 0.6'; }
};
(async () => {
  const b = await T.launch();
  for (const v of V) {
    const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
    await T.serve(ctx, { load: 400, dur: 300 });
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.continue());
    await ctx.addInitScript(T.INIT);
    const p = await ctx.newPage();
    await p.goto('http://hm.test/liquid/index.html?block=kingston');
    await p.waitForTimeout(800);
    if (v.css) await p.evaluate((u) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = u; document.head.appendChild(l); }, GF(v.css));
    await p.click('#splash');
    for (let i = 0; i < 60; i++) { await p.waitForTimeout(200); if (await p.evaluate(() => window.HM && HM.isOn())) break; }
    await p.evaluate(() => document.getElementById('skipIntro').click()).catch(() => {});
    await p.waitForTimeout(6000);
    await p.evaluate(() => document.fonts.ready);
    const shot = async (name, sel, pad, maxH) => {
      await p.evaluate(APPLY, v); await p.waitForTimeout(400); await p.evaluate(() => document.fonts.ready);
      const r = await p.evaluate((s) => { const e = document.querySelector(s); const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; }, sel);
      const clip = { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: Math.min(1920, r.w + 2 * pad), height: Math.min(maxH || 1080, r.h + 2 * pad) };
      await p.screenshot({ path: `${OUT}/${name}-${v.k}.png`, clip });
    };
    await shot('3-cartao', '#now', 14);
    await p.evaluate(() => document.getElementById('giftBtn').click()); await p.waitForTimeout(500);
    await shot('1-sugestao', '#giftPanel', 6);
    await p.evaluate(() => document.querySelector('#giftPanel .pclose').click());
    await p.evaluate(() => document.getElementById('focusBtn').click()); await p.waitForTimeout(1500);
    await p.evaluate(() => { const q = document.querySelector('[data-habit=quiet]'); if (q && q.offsetParent) q.click(); });
    await p.waitForTimeout(400);
    await shot('2-cenas', '#fcScenes', 10);
    await p.evaluate(() => document.getElementById('fcWhyBtn').click()); await p.waitForTimeout(1200);
    await p.evaluate(() => { const d = document.querySelector('#fcLab details, #fcLab .fc-ev'); if (d && d.tagName === 'DETAILS') d.open = true; });
    await p.waitForTimeout(300);
    await shot('4-provas', '#fcLab', 0, 900);
    await p.evaluate(() => document.getElementById('fcLabX').click()); await p.waitForTimeout(400);
    await p.evaluate(() => document.getElementById('fcBegin').click()); await p.waitForTimeout(1200);
    await p.mouse.move(400, 400);
    await p.evaluate(() => document.getElementById('fcMore').click()); await p.waitForTimeout(800);
    await shot('5-ajustes', '#fcDrawer', 0, 900);
    console.log(v.k, 'ok');
    await ctx.close();
  }
  await b.close();
})();
