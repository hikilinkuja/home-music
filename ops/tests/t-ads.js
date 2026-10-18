// Anuncios e leitores parados (motor, v5.1). O YouTube simulado tem fase de anuncio (estado -1 com o
// tempo a avancar e nunca o 1, como no ensaio de 2026-10-18) e leitores parados no zero. Verifica que
// nenhum leitor sai do mudo antes do estado 1 (radio no computador e no telemovel, sala de foco e
// respiracao), que o mute a meio de um anuncio nao abre o som, que um anuncio a meio do disco fica
// calado, que o disco pre-carregado espera fora do ecra e entra sem espera, que o rito espera um
// anuncio longo sem prazo fixo, que o salto espera pelo disco seguinte (e se faz no prato do ar se o
// livre ficar bloqueado), e que o leitor parado (tambem o primeiro disco) e recarregado uma vez e na
// segunda paragem trocado. Oito cenarios ao mesmo tempo, cerca de 1,5 min.
'use strict';
const T = require('./lib/common');

/* regras do leitor simulado (por leitor e por ordem de carga nesse leitor) e o estado do motor */
const rules = (spec) => `
window.__ytRule=(function(){ var S=${JSON.stringify(spec)};
  return function(i){ return (S[i.el] && S[i.el][i.ne]) || S['*'] || {}; };
})();
setInterval(function(){ try{ if(window.HMENG) window.__log.push({ ev:'eng', t:performance.now(), s:HMENG.state() }); }catch(e){} }, 250);`;

const loadsOf = (log, el) => log.filter(e => e.ev === 'load' && e.el === el);
const firstAfter = (log, t, f) => log.find(e => e.t > t && f(e));
const secs = (ms) => +(ms / 1000).toFixed(2);

/* portao do som: nenhuma abertura fora do estado 1 ou durante um anuncio, nenhum anuncio a comecar com
   som, e a musica chega mesmo a abrir (min aberturas), para um motor que nunca abrisse nao passar */
function gateChecks(c, tag, log, els, minUn, minAds) {
  const un = log.filter(e => e.ev === 'unmute' && els.includes(e.el));
  const bad = un.filter(e => e.st !== 1 || e.ad);
  const ads = log.filter(e => e.ev === 'adStart' && els.includes(e.el));
  /* o anuncio a meio de um disco comeca forcosamente com o som da musica: ai conta o calar logo (cenario A) */
  const loud = ads.filter(e => !e.mu && !e.mid);
  if (minAds) c(`${tag}: houve anuncios (${minAds} ou mais)`, ads.length >= minAds, ads.length);
  c(`${tag}: nenhum leitor sai do mudo antes do estado 1`, bad.length === 0, JSON.stringify(bad.slice(0, 3)));
  c(`${tag}: nenhum anuncio comeca com som`, loud.length === 0, JSON.stringify(loud.slice(0, 3)));
  c(`${tag}: a musica abre (${minUn} ou mais aberturas)`, un.length >= minUn, un.length);
}
/* recarga e troca num leitor: as cargas ne a e b sao o mesmo video, uns 15 s depois */
function reloadOf(L, a, b) {
  const x = L.find(e => e.ne === a), y = L.find(e => e.ne === b);
  return { x, y, dt: x && y ? secs(y.t - x.t) : null, same: !!(x && y && x.vid === y.vid) };
}
const near15 = (dt) => dt != null && dt >= 14 && dt <= 17.5;
const geo = (page) => page.evaluate(() => {
  const g = (id) => {
    const el = document.getElementById(id), b = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return { l: Math.round(b.left), r: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height), live: el.classList.contains('live'), op: cs.opacity };
  };
  return { A: g('slotA'), B: g('slotB'), e: HMENG.state(), vw: innerWidth, vh: innerHeight };
});
const offscreen = (s) => !s.live && s.r <= 0 && s.w <= 2 && s.h <= 2 && s.op === '1';
const inMonitor = (s, vw, vh) => s.live && s.l >= 0 && s.r <= vw && s.w >= 200 && s.h >= 100;
/* os sons da agulha no contexto de efeitos do motor, com o instante agendado em segundos */
function needles(log) {
  const a = T.analyse(log);
  const at = (e) => e.t / 1000 + (e.when - e.now);
  return {
    lifts: a.srcs.filter(e => e.c === 'lift' && e.ctx === 0).map(at),
    drops: a.srcs.filter(e => e.c === 'drop' && e.ctx === 0).map(at),
    rituals: a.rituals, records: a.records,
  };
}

/* A) computador, anuncio de 8 s em todos os discos: portao (tambem com mute e desmute a meio do anuncio, e
   num anuncio a meio do disco), prato a espera fora do ecra, entrada sem espera */
async function scenAds(browser, c) {
  const r = await T.openLiquid(browser, { mode: 'desktop', qs: '?block=kingston', load: 800, init: rules({ '*': { ad: 8, dur: 30 } }) });
  await r.run(2); await r.act('mute'); await r.run(1); await r.act('mute');
  await r.run(17);
  const midK = await r.page.evaluate(() => { const k = HMENG.state().active; return __players['yt' + k]._midroll(4) ? k : null; });
  await r.run(4); const g1 = await geo(r.page);
  await r.run(25); const g2 = await geo(r.page);
  await r.run(29);
  const log = await r.log();
  const ev = await r.page.evaluate(() => HMPLOG.events().map(e => e.e));
  await r.close();
  const tag = 'computador, anuncios';
  c(`${tag}: sem erros de JavaScript`, r.errors.length === 0, r.errors.join(' | '));
  gateChecks(c, tag, log, ['ytA', 'ytB'], 3, 3);
  const ad0 = log.find(e => e.ev === 'adEnd' && e.el === 'ytA'), un0 = log.find(e => e.ev === 'unmute' && e.el === 'ytA');
  c(`${tag}: o primeiro disco so abre depois do anuncio`, ad0 && un0 && un0.t > ad0.t, JSON.stringify({ ad0, un0 }));
  const as0 = log.find(e => e.ev === 'adStart' && e.el === 'ytA');
  const tog = as0 && ad0 ? log.filter(e => e.ev === 'ACTION' && e.do === 'mute' && e.t > as0.t && e.t < ad0.t) : [];
  c(`${tag}: mute e desmute a meio do anuncio nao abrem o som`, tog.length === 2 && !log.some(e => e.ev === 'unmute' && e.el === 'ytA' && e.t < ad0.t),
    tog.length + ' toques no anuncio');
  const ms = log.find(e => e.ev === 'adStart' && e.mid), me = log.find(e => e.ev === 'adEnd' && e.mid);
  const mm = ms && firstAfter(log, ms.t - 1, e => e.ev === 'mute' && e.el === ms.el);
  c(`${tag}: anuncio a meio do disco calado logo (menos de 50 ms)`, !!midK && !!mm && mm.t - ms.t <= 50 && ev.includes('ad'), JSON.stringify({ midK, ms, mm }));
  const mu2 = me && firstAfter(log, me.t, e => e.ev === 'unmute' && e.el === me.el);
  c(`${tag}: e o som volta com a musica`, !!mu2 && mu2.st === 1, JSON.stringify(mu2));
  const n = needles(log), done = n.rituals.filter(x => x.gap != null);
  c(`${tag}: o disco pre-carregado entra sem espera (levantar-pousar 2,0 s)`, done.length >= 2 && done.every(x => Math.abs(x.gap - 2) <= 0.05),
    done.map(x => x.gap.toFixed(3)).join(' '));
  c(`${tag}: o prato a espera fica fora do ecra, 1 por 1, sem opacidade 0`, g1.e.preK === 'B' && g1.e.preReady && offscreen(g1.B), JSON.stringify(g1));
  c(`${tag}: o prato no ar fica no monitor`, inMonitor(g1.A, g1.vw, g1.vh), JSON.stringify(g1.A));
  c(`${tag}: depois da troca, o novo disco entra no monitor e o antigo sai do ecra`, g2.e.active === 'B' && inMonitor(g2.B, g2.vw, g2.vh) && offscreen(g2.A), JSON.stringify(g2));
}

/* B) computador, leitores parados no zero: recarga uma vez; segunda paragem, outro disco */
async function scenStuck(browser, c) {
  const r = await T.openLiquid(browser, {
    mode: 'desktop', qs: '?block=kingston', load: 800,
    init: rules({ ytA: { 1: { dur: 20 }, 2: { stuck: true }, 3: { dur: 20 } }, ytB: { 1: { stuck: true }, 2: { stuck: true }, 3: { dur: 20 } }, '*': { dur: 20 } }),
  });
  await r.run(58);
  const log = await r.log();
  const ev = await r.page.evaluate(() => HMPLOG.events().map(e => e.e));
  await r.close();
  const tag = 'computador, leitor parado';
  c(`${tag}: sem erros de JavaScript`, r.errors.length === 0, r.errors.join(' | '));
  gateChecks(c, tag, log, ['ytA', 'ytB'], 3, 0);
  const LB = loadsOf(log, 'ytB'), LA = loadsOf(log, 'ytA');
  const b1 = reloadOf(LB, 1, 2), b2 = reloadOf(LB, 2, 3);
  c(`${tag}: prato livre parado, recarregado uma vez (o mesmo video, ~15 s depois)`, b1.same && near15(b1.dt), JSON.stringify(b1));
  c(`${tag}: segunda paragem, outro disco (~15 s depois)`, b2.x && b2.y && !b2.same && near15(b2.dt), JSON.stringify(b2));
  const onB = b2.y && log.find(e => e.ev === 'unmute' && e.el === 'ytB' && e.vid === b2.y.vid);
  c(`${tag}: o disco de troca vai para o ar`, !!onB, b2.y && b2.y.vid);
  const a1 = reloadOf(LA, 2, 3);
  const onA = a1.y && log.find(e => e.ev === 'unmute' && e.el === 'ytA' && e.vid === a1.y.vid && e.t > a1.y.t);
  c(`${tag}: parado uma vez, recarregado e depois no ar`, a1.same && near15(a1.dt) && !!onA, JSON.stringify(a1));
  const nr = ev.filter(x => x === 'reload').length, ns = ev.filter(x => x === 'stall').length;
  c(`${tag}: registo com as recargas e a troca (reload 2, stall 1)`, nr === 2 && ns === 1, 'reload ' + nr + ', stall ' + ns);
  const n = needles(log), aired = n.records.filter(x => x.firstAud != null && x.endedT != null);
  const short = aired.filter(x => x.endedCur < x.dur - 0.05 || x.cuts.length);
  c(`${tag}: os discos no ar tocam ate ao fim`, aired.length >= 2 && short.length === 0, JSON.stringify(short.map(x => ({ vid: x.vid, cur: x.endedCur, cuts: x.cuts }))));
}

/* C) computador, anuncio de 50 s no disco armado: o rito espera, sem prazo fixo nem troca */
async function scenLongAd(browser, c) {
  const r = await T.openLiquid(browser, {
    mode: 'desktop', qs: '?block=kingston', load: 800,
    init: rules({ ytA: { 1: { dur: 20 } }, ytB: { 1: { ad: 50, dur: 20 } }, '*': { dur: 20 } }),
  });
  await r.run(57);
  const log = await r.log(); await r.close();
  const tag = 'computador, anuncio longo no rito';
  c(`${tag}: sem erros de JavaScript`, r.errors.length === 0, r.errors.join(' | '));
  gateChecks(c, tag, log, ['ytA', 'ytB'], 2, 1);
  const n = needles(log), lift = n.lifts[0], drop = n.drops.find(d => lift != null && d > lift);
  const gap = lift != null && drop != null ? +(drop - lift).toFixed(2) : null;
  c(`${tag}: a espera passa os 25 s do prazo antigo`, gap != null && gap >= 28, gap);
  const mid = lift != null ? log.filter(e => e.ev === 'load' && e.t / 1000 > lift && (drop == null || e.t / 1000 < drop)) : [];
  c(`${tag}: nenhum disco trocado enquanto o anuncio avanca`, lift != null && mid.length === 0, JSON.stringify(mid));
  const b = loadsOf(log, 'ytB')[0];
  c(`${tag}: o disco armado e o que vai para o ar`, b && log.some(e => e.ev === 'unmute' && e.el === 'ytB' && e.vid === b.vid), b && b.vid);
}

/* D) computador, salto com o seguinte ainda no anuncio: o disco no ar continua ate ele estar pronto */
async function scenSkip(browser, c) {
  const r = await T.openLiquid(browser, {
    mode: 'desktop', qs: '?block=kingston', load: 800,
    init: rules({ ytA: { 1: { dur: 60 } }, ytB: { 1: { ad: 12, dur: 30 } }, '*': { dur: 30 } }),
  });
  await r.run(4);
  await r.act('skip'); await r.page.waitForTimeout(800);
  const toast = await r.page.evaluate(() => { const t = document.getElementById('toast'); return t.classList.contains('on') ? t.textContent : ''; });
  await r.run(15);
  const log = await r.log(); await r.close();
  const tag = 'computador, salto';
  c(`${tag}: sem erros de JavaScript`, r.errors.length === 0, r.errors.join(' | '));
  gateChecks(c, tag, log, ['ytA', 'ytB'], 2, 1);
  const skip = log.find(e => e.ev === 'ACTION' && e.do === 'skip'), bv = loadsOf(log, 'ytB')[0];
  const ready = skip && bv && firstAfter(log, skip.t, e => e.ev === 'state' && e.el === 'ytB' && e.vid === bv.vid && e.st === 1);
  const touch = skip && ready ? log.filter(e => e.el === 'ytA' && e.t > skip.t && e.t < ready.t &&
    ((e.ev === 'state' && e.st !== 1) || e.ev === 'load' || (e.ev === 'vol' && e.v === 0) || e.ev === 'mute')) : null;
  c(`${tag}: o disco no ar continua ate o seguinte estar pronto`, !!ready && touch.length === 0 && secs(ready.t - skip.t) > 5,
    JSON.stringify({ wait: ready && secs(ready.t - skip.t), touch: touch && touch.slice(0, 3) }));
  const cut = ready && firstAfter(log, ready.t - 1, e => e.ev === 'state' && e.el === 'ytA' && e.st === 2);
  c(`${tag}: e so entao corta (menos de 1,5 s depois)`, !!cut && secs(cut.t - ready.t) <= 1.5, cut && secs(cut.t - ready.t));
  c(`${tag}: o seguinte entra no ar`, !!(bv && log.some(e => e.ev === 'unmute' && e.el === 'ytB' && e.vid === bv.vid)), bv && bv.vid);
  c(`${tag}: aviso de que o disco seguinte vem a caminho`, /next record/i.test(toast), toast);
}

/* E) telemovel, um so leitor: portao do som e espera por progresso (recarga, troca) */
async function scenMobile(browser, c) {
  const r = await T.openLiquid(browser, {
    mode: 'mobile', qs: '?block=flight', load: 800,
    init: rules({ ytA: { 1: { ad: 6, dur: 15 }, 2: { stuck: true }, 3: { stuck: true }, 4: { ad: 6, dur: 15 } }, '*': { dur: 15 } }),
  });
  await r.run(60);
  const log = await r.log(); await r.close();
  const tag = 'telemovel';
  c(`${tag}: sem erros de JavaScript`, r.errors.length === 0, r.errors.join(' | '));
  gateChecks(c, tag, log, ['ytA'], 2, 2);
  const ad0 = log.find(e => e.ev === 'adEnd' && e.el === 'ytA'), un0 = log.find(e => e.ev === 'unmute' && e.el === 'ytA');
  c(`${tag}: o primeiro disco so abre depois do anuncio`, ad0 && un0 && un0.t > ad0.t, JSON.stringify({ ad0, un0 }));
  const L = loadsOf(log, 'ytA'), a = reloadOf(L, 2, 3), b = reloadOf(L, 3, 4);
  c(`${tag}: leitor parado, recarregado uma vez (~15 s depois)`, a.same && near15(a.dt), JSON.stringify(a));
  c(`${tag}: segunda paragem, outro disco (~15 s depois)`, b.x && b.y && !b.same && near15(b.dt), JSON.stringify(b));
  const ad4 = b.y && log.find(e => e.ev === 'adEnd' && e.el === 'ytA' && e.vid === b.y.vid);
  const on4 = ad4 && log.find(e => e.ev === 'unmute' && e.el === 'ytA' && e.vid === b.y.vid && e.t > ad4.t);
  c(`${tag}: o disco de troca toca depois do seu anuncio`, !!on4, b.y && b.y.vid);
}

/* G) computador, salto a espera e o prato livre bloqueado (erro 153): o salto faz-se no prato do ar */
async function scenBlocked(browser, c) {
  const r = await T.openLiquid(browser, {
    mode: 'desktop', qs: '?block=kingston', load: 800,
    init: rules({ ytA: { 1: { dur: 60 } }, ytB: { 1: { ad: 12, dur: 30 } }, '*': { dur: 30 } }),
  });
  await r.run(4); await r.act('skip');
  await r.run(2); await r.page.evaluate(() => __players.ytB._err(153));
  await r.run(14);
  const log = await r.log();
  const ends = await r.page.evaluate(() => HMPLOG.rows().map(x => x.end || ''));
  await r.close();
  const tag = 'computador, prato livre bloqueado';
  c(`${tag}: sem erros de JavaScript`, r.errors.length === 0, r.errors.join(' | '));
  gateChecks(c, tag, log, ['ytA', 'ytB'], 2, 1);
  const err = log.find(e => e.ev === 'err' && e.el === 'ytB');
  const a2 = err && firstAfter(log, err.t, e => e.ev === 'load' && e.el === 'ytA');
  const on = a2 && log.find(e => e.ev === 'unmute' && e.el === 'ytA' && e.vid === a2.vid && e.t > a2.t);
  c(`${tag}: o salto faz-se no prato do ar`, !!on && ends.includes('skip'), JSON.stringify({ a2: a2 && a2.vid, ends }));
  const bLater = err ? log.filter(e => e.ev === 'load' && e.el === 'ytB' && e.t > err.t) : [];
  c(`${tag}: o prato bloqueado nao volta a ser usado`, !!err && bLater.length === 0, bLater.length);
}

/* H) computador, o primeiro disco parado no zero duas vezes: recarga, e depois outro disco no ar */
async function scenFirstStuck(browser, c) {
  const r = await T.openLiquid(browser, { mode: 'desktop', qs: '?block=kingston', load: 800, init: rules({ ytA: { 1: { stuck: true }, 2: { stuck: true } }, '*': { dur: 20 } }) });
  await r.run(37);
  const log = await r.log(); await r.close();
  const tag = 'computador, primeiro disco parado';
  c(`${tag}: sem erros de JavaScript`, r.errors.length === 0, r.errors.join(' | '));
  gateChecks(c, tag, log, ['ytA', 'ytB'], 1, 0);
  const a = reloadOf(loadsOf(log, 'ytA'), 1, 2), b = loadsOf(log, 'ytB')[0];
  const dt = a.y && b ? secs(b.t - a.y.t) : null;
  c(`${tag}: recarregado uma vez e, na segunda paragem, outro disco (~15 s cada)`, a.same && b && b.vid !== a.x.vid && near15(dt) && !!a.x,
    JSON.stringify({ a, dt }));
  c(`${tag}: o disco de troca vai para o ar`, !!(b && log.some(e => e.ev === 'unmute' && e.el === 'ytB' && e.vid === b.vid)), b && b.vid);
}

/* F) sala de foco: o leitor da sala e o da respiracao tambem so abrem no estado 1 */
async function scenFocus(browser, c) {
  const r = await T.openLiquid(browser, { mode: 'desktop', load: 800, init: rules({ fcZen: { 1: { ad: 4, dur: 300 } }, fcTune: { 1: { ad: 6, dur: 120 } }, '*': { dur: 120 } }) });
  await r.page.evaluate(() => { document.getElementById('fcBreathe').checked = true; });
  await r.act('focusOpen'); await r.page.waitForTimeout(7500);
  await r.page.evaluate(() => { const b = document.getElementById('fcGateSkip'); if (b) b.click(); const k = document.getElementById('fcBlack'); if (k && k.checked) k.click(); });
  await r.page.waitForTimeout(800);
  await r.page.click('#fcScenes .fc-card[data-id="write"]');
  await r.page.click('#fcBegin'); await r.page.waitForTimeout(9500);
  const log = await r.log(); await r.close();
  const tag = 'sala de foco';
  c(`${tag}: sem erros de JavaScript`, r.errors.length === 0, r.errors.join(' | '));
  gateChecks(c, tag + ', respiracao', log, ['fcZen'], 1, 1);
  gateChecks(c, tag + ', leitor da sala', log, ['fcTune'], 1, 1);
}

(async () => {
  const t = T.suite('ads');
  const browser = await T.launch();
  const S = [scenAds, scenStuck, scenLongAd, scenSkip, scenBlocked, scenFirstStuck, scenMobile, scenFocus];
  const res = await Promise.all(S.map(async (f) => {
    const out = [];
    try { await f(browser, (l, ok, d) => out.push([l, ok, d])); }
    catch (e) { out.push([f.name + ': excecao', false, e && e.stack]); }
    return out;
  }));
  res.forEach(out => out.forEach(([l, ok, d]) => t.check(l, ok, d)));
  await browser.close();
  t.done();
})().catch(e => { console.error('FAIL ads: excecao', e); process.exitCode = 1; });
