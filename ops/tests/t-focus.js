// Sala de foco em tres tempos (v4.6): entrada com cenas, sessao com anel e barra, gaveta de ajustes,
// memoria no browser, fundos proprios e da radio, sorteio por genero. Verifica tambem que nenhum
// controlo fica por cima de outro nem fora do ecra (computador 1440x900 e 1024x768, telemovel de pe
// e deitado). Cerca de 1 minuto.
'use strict';
const T = require('./lib/common');

/* conta as copias do canvas da radio (#vj) para o canvas da sala */
const SPY = `
window.__vjDraws=0;
(function(){
  var di=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(src){ if(src && src.id==='vj') window.__vjDraws++; return di.apply(this, arguments); };
})();`;

/* elementos visiveis: dentro do ecra e sem sobreposicoes entre eles */
const layout = (page, sels) => page.evaluate((sels) => {
  const vis = (el) => {
    if (!el || el.offsetParent === null) return false;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0;
  };
  const items = [];
  sels.forEach(s => document.querySelectorAll(s).forEach((el, i) => { if (vis(el)) items.push({ n: s + (i ? '#' + i : ''), r: el.getBoundingClientRect() }); }));
  const out = items.filter(o => o.r.left < -1 || o.r.top < -1 || o.r.right > innerWidth + 1 || o.r.bottom > innerHeight + 1).map(o => 'fora:' + o.n);
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i].r, b = items[j].r;
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (w > 1 && h > 1) out.push(items[i].n + ' x ' + items[j].n);
  }
  return { n: items.length, bad: out };
}, sels);
const ENTRY = ['#fcTop .fbrand', '#fcExit', '#fcIntent', '#fcScenes .fc-card', '#fcBegin', '#fcAdjust'];
const SESS = ['#fcTop .fbrand', '#fcSeal', '#fcExit', '#fcTag', '#fcDial', '#fcHint', '#fcGo', '#fcNowBox', '#fcPlay', '#fcSkipT',
  '.fc-vol', '#fcTgRn', '#fcTgFp', '#fcTgCk', '#fcMore', '#fcKeys'];

const st = (page) => page.evaluate(() => ({
  stage: document.getElementById('focus').getAttribute('data-stage'),
  phase: document.getElementById('fcPhase').textContent,
  time: document.getElementById('fcTime').textContent,
  cards: [...document.querySelectorAll('#fcScenes .fc-card')].map(b => b.getAttribute('data-id') + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')),
  drw: document.getElementById('focus').classList.contains('drw'),
}));
const enter = async (r) => {
  await r.act('focusOpen'); await r.page.waitForTimeout(600);
  await r.page.evaluate(() => {
    const g = document.getElementById('fcGateSkip'); if (document.getElementById('fcGate').classList.contains('on')) g.click();
    /* controlos sempre visiveis: o desvanecer ao fim de 5 s tira-lhes os cliques a meio do teste */
    const b = document.getElementById('fcBlack'); if (b.checked) b.click();
  });
  await r.page.waitForTimeout(700);
};
const loadedGenres = (page) => page.evaluate(() => {
  const by = {}; TRACKS.forEach(t => { by[t.v] = t.g; });
  return window.__log.filter(e => e.ev === 'load' && e.el === 'fcTune').map(e => by[e.vid]);
});

(async () => {
  const t = T.suite('focus');
  const browser = await T.launch();

  /* 1) computador: entrada, Begin, sessao, gaveta, fundos, memoria */
  let r = await T.openLiquid(browser, { mode: 'desktop', init: SPY, freesound: 'ok' });
  const before = await r.page.evaluate(() => { const s = []; for (let i = 0; i < 8; i++) s.push(HMFIELD.next()); return s; });
  await enter(r);
  let s = await st(r.page);
  t.check('entrada: abre na entrada com tres cenas e a primeira escolhida', s.stage === 'entry' && s.cards.join() === 'deep*,study,read', JSON.stringify(s));
  let L = await layout(r.page, ENTRY);
  t.check('entrada 1440x900: tudo no ecra, nada sobreposto', L.n >= 6 && !L.bad.length, L.bad.join(' | '));
  const after = await r.page.evaluate(() => HMFIELD.next());
  t.check('fundos: ler a lista dos campos da radio deixa o campo onde estava', after === before[1], before.join(',') + ' -> ' + after);

  await r.page.fill('#fcIntent', 'chapter 3 draft');
  await r.page.click('#fcBegin'); await r.page.waitForTimeout(2600);
  s = await st(r.page);
  t.check('Begin: passa a sessao com o tempo a correr', s.stage === 'session' && /focus/.test(s.phase) && s.time < '50:00' && s.time > '49:50', JSON.stringify(s));
  let g = await loadedGenres(r.page);
  t.check('Begin: a musica arranca num genero da cena', g.length >= 1 && ['dub_techno', 'hypnotic_techno', 'ambient_techno'].includes(g[0]), g.join(','));
  const tag = await r.page.textContent('#fcTag');
  t.check('sessao: cena e intencao por cima do anel', /deep work/.test(tag) && /chapter 3 draft/.test(tag), tag);
  L = await layout(r.page, SESS);
  t.check('sessao 1440x900: tudo no ecra, nada sobreposto', L.n >= 14 && !L.bad.length, L.bad.join(' | '));

  await r.page.click('#fcDial'); await r.page.waitForTimeout(300);
  s = await st(r.page);
  const t1 = s.time; await r.page.waitForTimeout(1500);
  s = await st(r.page);
  t.check('anel: um toque pausa o tempo', s.phase === 'paused' && s.time === t1, JSON.stringify(s));
  await r.page.click('#fcDial'); await r.page.waitForTimeout(300);

  await r.page.click('#fcMore'); await r.page.waitForTimeout(500);
  L = await layout(r.page, ['#fcDrawer']);
  t.check('gaveta: abre dentro do ecra', (await st(r.page)).drw && L.n === 1 && !L.bad.length, L.bad.join(' | '));
  const bgs = await r.page.$$eval('#fcBgs .fc-chip', bs => bs.map(b => b.getAttribute('data-bg')));
  t.check('fundos: os tres da sala e os sete da radio', bgs.slice(0, 3).join() === 'dusk,ink,off' && bgs.filter(b => b.startsWith('radio:')).length === 7, bgs.join(','));
  const radio = bgs.find(b => b.startsWith('radio:'));
  await r.page.click(`#fcBgs .fc-chip[data-bg="${radio}"]`); await r.page.waitForTimeout(600);
  const d1 = await r.page.evaluate(() => window.__vjDraws);
  await r.page.waitForTimeout(600);
  const d2 = await r.page.evaluate(() => window.__vjDraws);
  t.check('fundos: o campo da radio passa a ser copiado para a sala', d2 > d1, d1 + ' -> ' + d2);
  const nx = await r.page.evaluate(() => HMFIELD.next());
  const i = before.indexOf(radio.slice(6));
  t.check('fundos: a radio fica no mesmo campo', i >= 0 && nx === before[(i + 1) % 7], radio + ' -> ' + nx);
  await r.page.click('#fcBgs .fc-chip[data-bg="ink"]'); await r.page.waitForTimeout(400);
  const d3 = await r.page.evaluate(() => window.__vjDraws); await r.page.waitForTimeout(600);
  t.check('fundos: o estilo proprio da sala continua disponivel', (await r.page.evaluate(() => window.__vjDraws)) === d3);

  /* sorteio por genero: ambient (poucas faixas) e lo-fi house (muitas) com a mesma parte */
  await r.page.evaluate(() => {
    document.querySelectorAll('#fcValve .fc-chip[aria-pressed=true]').forEach(b => b.click());
    document.getElementById('fcMoreG').click();
    [...document.querySelectorAll('#fcValve .fc-chip')].filter(b => ['ambient', 'lo-fi house'].includes(b.textContent)).forEach(b => b.click());
  });
  await r.page.keyboard.press('Escape'); await r.page.waitForTimeout(400);
  t.check('gaveta: Esc fecha', !(await st(r.page)).drw);
  const n0 = (await loadedGenres(r.page)).length;
  for (let k = 0; k < 40; k++) await r.page.click('#fcSkipT');
  await r.page.waitForTimeout(300);
  g = (await loadedGenres(r.page)).slice(n0);
  const amb = g.filter(x => x === 'ambient').length;
  t.check('sorteio: cada genero aceso tem a mesma parte (ambient 10 a 30 em 40)', g.length === 40 && amb >= 10 && amb <= 30, amb + '/' + g.length);
  t.check('computador: sem erros de JavaScript', r.errors.length === 0, r.errors.join(' | '));

  /* memoria: depois de recarregar, a entrada oferece «My last», escolhida */
  await r.act('focusClose'); await r.page.waitForTimeout(400);
  await r.page.reload(); await r.page.waitForTimeout(1200);
  await r.page.click('#splash');
  for (let k = 0; k < 60; k++) { await r.page.waitForTimeout(200); if (await r.page.evaluate(() => window.HM && HM.isOn())) break; }
  await enter(r);
  s = await st(r.page);
  t.check('memoria: «My last» aparece e vem escolhida', s.stage === 'entry' && s.cards.join() === 'deep,study,read,last*', JSON.stringify(s));
  const mem = await r.page.evaluate(() => JSON.parse(localStorage.getItem('hm_focus')));
  t.check('memoria: guarda o fundo, a intencao e os generos', mem && mem.bg === 'ink' && mem.intent === 'chapter 3 draft' && mem.allow.length === 2, JSON.stringify(mem));

  /* 1024x768: sessao sem sobreposicoes */
  await r.page.setViewportSize({ width: 1024, height: 768 });
  await r.page.click('#fcBegin'); await r.page.waitForTimeout(800);
  L = await layout(r.page, SESS);
  t.check('sessao 1024x768: tudo no ecra, nada sobreposto', L.n >= 12 && !L.bad.length, L.bad.join(' | '));
  await r.close();

  /* 2) telemovel de pe e deitado */
  r = await T.openLiquid(browser, { mode: 'mobile' });
  await enter(r);
  L = await layout(r.page, ENTRY);
  t.check('entrada 390x844: tudo no ecra, nada sobreposto', L.n >= 6 && !L.bad.length, L.bad.join(' | '));
  await r.page.tap('#fcBegin'); await r.page.waitForTimeout(900);
  L = await layout(r.page, SESS);
  t.check('sessao 390x844: tudo no ecra, nada sobreposto', L.n >= 11 && !L.bad.length, L.bad.join(' | '));
  await r.page.tap('#fcMore'); await r.page.waitForTimeout(500);
  const sheet = await r.page.evaluate(() => { const b = document.getElementById('fcDrawer').getBoundingClientRect(); return { top: b.top, bottom: b.bottom, h: innerHeight }; });
  t.check('telemovel: ajustes numa folha que sobe de baixo', sheet.bottom <= sheet.h + 1 && sheet.top > 60, JSON.stringify(sheet));
  await r.page.tap('#fcDrawerX'); await r.page.waitForTimeout(500);
  await r.page.setViewportSize({ width: 844, height: 390 }); await r.page.waitForTimeout(500);
  L = await layout(r.page, SESS);
  t.check('sessao 844x390 (deitado): tudo no ecra, nada sobreposto', L.n >= 10 && !L.bad.length, L.bad.join(' | '));
  t.check('telemovel: sem erros de JavaScript', r.errors.length === 0, r.errors.join(' | '));
  await r.close();

  await browser.close();
  t.done();
})().catch(e => { console.error('FAIL focus: excecao', e); process.exitCode = 1; });
