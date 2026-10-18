// Sala de foco (v4.6, ronda 1 da avaliacao em v4.9, ronda 2a em v5.0): entrada com seis cenas por tarefa e Begin,
// sessao com anel (so minutos durante o foco), ultimo minuto com a musica a descer e «+5 min»,
// intervalo de um quinto do bloco com a musica calada, chuva baixa e «onde paraste», sino suave por
// omissao, respiracao opcional, gaveta, fundos da sala e da radio, sorteio por genero, memoria (e a
// migracao da memoria da v4.6). Nada sobreposto nem fora do ecra em 1440x900, 1024x768, 390x844 e
// 844x390, no trabalho e no intervalo. Ronda 2a: perfis de som por cena e pergunta da primeira visita,
// zona «why?» (painel e ligacoes, todas com prova no focus-evidence.json), «continuar onde parei»,
// passo mais pequeno e linha de recomeco. O relogio da sala acelera-se pelo window.HMFR. Cerca de 2 min.
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
const ENTRY = ['#fcTop .fbrand', '#fcWhyBtn', '#fcExit', '#fcFresh', '#fcCont', '#fcIntent', '#fcStep', '#fcHabit', '#fcScenes .fc-card',
  '#fcSound', '#fcPhone', '#fcBegin', '#fcAdjust'];
const SESS = ['#fcTop .fbrand', '#fcWhyBtn', '#fcSeal', '#fcExit', '#fcTag', '#fcNext', '#fcDial', '#fcHint', '#fcBrk', '#fcPlus', '#fcBreatheNow',
  '#fcGo', '#fcNowBox', '#fcPlay', '#fcSkipT', '.fc-vol', '#fcTgRn', '#fcTgFp', '#fcTgCk', '#fcMore', '#fcKeys'];

const st = (page) => page.evaluate(() => {
  const d = (id) => document.getElementById(id);
  return {
    stage: d('focus').getAttribute('data-stage'),
    phase: d('fcPhase').textContent,
    left: +d('fcDial').getAttribute('data-left'),
    tn: d('fcTN').textContent, tu: d('fcTU').textContent,
    cards: [...document.querySelectorAll('#fcScenes .fc-card')].map(b => b.getAttribute('data-id') + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(','),
    drw: d('focus').classList.contains('drw'),
    plus: !d('fcPlus').hidden, breathe: !d('fcBreatheNow').hidden,
    brk: getComputedStyle(d('fcBrk')).display !== 'none',
    next: d('fcNext').hidden ? '' : d('fcNext').textContent,
    sd: [...document.querySelectorAll('#fcScenes .fc-card .sd')].map(e => e.textContent.trim()).join(','),
    habit: !d('fcHabit').hidden, sound: d('fcSoundN').textContent,
  };
});
/* painel «why?»: aberto, quantas provas, qual a destacada e se esta dentro do ecra */
const labSt = (page) => page.evaluate(() => {
  const hl = document.querySelector('#fcLab .fc-ev.hl');
  const r = document.getElementById('fcLab').getBoundingClientRect();
  return { on: document.getElementById('focus').classList.contains('lab'), n: document.querySelectorAll('#fcLab .fc-ev').length,
    hl: hl ? hl.id : '', open: hl ? hl.open : false, top: hl ? Math.round(hl.getBoundingClientRect().top) : -1,
    inView: r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1,
    links: document.querySelectorAll('#fcLab .fc-src a[href^="https://"]').length };
});
const setLeft = (page, s) => page.evaluate((s) => { HMFR.fc.pomo.left = s; }, s);
const enter = async (r) => {
  await r.act('focusOpen'); await r.page.waitForTimeout(600);
  const gate = await r.page.evaluate(() => {
    const on = document.getElementById('fcGate').classList.contains('on');
    if (on) document.getElementById('fcGateSkip').click();
    /* controlos sempre visiveis: o desvanecer ao fim de 5 s tira-lhes os cliques a meio do teste */
    const b = document.getElementById('fcBlack'); if (b.checked) b.click();
    return on;
  });
  await r.page.waitForTimeout(700);
  return gate;
};
/* registo do leitor simulado da sala: generos carregados, ultimo estado e ultimo volume */
const tune = (page) => page.evaluate(() => {
  const by = {}; TRACKS.forEach(t => { by[t.v] = t.g; });
  const L = window.__log.filter(e => e.el === 'fcTune');
  const loads = L.filter(e => e.ev === 'load').map(e => by[e.vid]);
  const sts = L.filter(e => e.ev === 'state'), vols = L.filter(e => e.ev === 'vol');
  return { loads, state: sts.length ? sts[sts.length - 1].st : null, vol: vols.length ? vols[vols.length - 1].v : null };
});

(async () => {
  const t = T.suite('focus');
  const browser = await T.launch();

  /* 1) computador: entrada, Begin, ciclo completo, gaveta, fundos, sorteio, memoria */
  let r = await T.openLiquid(browser, { mode: 'desktop', init: SPY, freesound: 'ok' });
  const before = await r.page.evaluate(() => { const s = []; for (let i = 0; i < 8; i++) s.push(HMFIELD.next()); return s; });
  const gate = await enter(r);
  let s = await st(r.page);
  t.check('entrada: seis cenas por tarefa, a primeira escolhida', s.stage === 'entry' && s.cards === 'read*,study,write,tech,create,routine', JSON.stringify(s));
  const defs = await r.page.evaluate(() => ({ ring: document.getElementById('fcRing').value, breathe: document.getElementById('fcBreathe').checked }));
  t.check('omissao: sem respiracao a entrada e com o sino suave', !gate && !defs.breathe && defs.ring === '5', JSON.stringify(defs) + ' gate=' + gate);
  let L = await layout(r.page, ENTRY);
  t.check('entrada 1440x900: tudo no ecra, nada sobreposto', L.n >= 9 && !L.bad.length, L.bad.join(' | '));
  const after = await r.page.evaluate(() => HMFIELD.next());
  t.check('fundos: ler a lista dos campos da radio deixa o campo onde estava', after === before[1], before.join(',') + ' -> ' + after);

  /* ronda 2a: primeira visita, perfis de som por omissao, recomeco e zona «why?» */
  t.check('primeira visita: pergunta do habito e um perfil de som por cena', s.habit && s.sd === 'Nature,Silence,Minimal,Minimal,Nature,Energy' && s.sound === 'Nature', JSON.stringify(s));
  const fr = await r.page.evaluate(() => ({ el: document.getElementById('fcFresh').hidden ? '' : document.getElementById('fcFreshT').textContent,
    now: HMFR.fresh(new Date()), mon: HMFR.fresh(new Date(2026, 9, 19)), tue: HMFR.fresh(new Date(2026, 9, 20)),
    m1: HMFR.fresh(new Date(2026, 10, 1)), y1: HMFR.fresh(new Date(2027, 0, 1)) }));
  t.check('recomeco: segunda-feira, dia 1 e 1 de janeiro; a linha da porta segue a data de hoje', fr.el === fr.now && /week/.test(fr.mon) && fr.tue === '' &&
    /month/.test(fr.m1) && /year/.test(fr.y1), JSON.stringify(fr));
  await r.page.click('#fcWhyBtn'); await r.page.waitForTimeout(900);
  let W = await labSt(r.page);
  t.check('why: o separador abre com as provas, mitos e retirados, e as fontes com ligacao', W.on && W.n >= 40 && W.links >= 40 && W.inView, JSON.stringify(W));
  await r.page.keyboard.press('Escape'); await r.page.waitForTimeout(400);
  t.check('why: Esc fecha o painel', !(await labSt(r.page)).on);
  await r.page.click('#fcPhone .fc-why'); await r.page.waitForTimeout(700);
  W = await labSt(r.page);
  t.check('why: a ligacao junto do telemovel abre a prova certa, aberta e a vista', W.on && W.hl === 'why-phone-away' && W.open && W.top >= 0 && W.top < 200, JSON.stringify(W));
  const orphan = await r.page.evaluate(() => [...document.querySelectorAll('#focus [data-why]')].map(b => b.getAttribute('data-why')).filter(i => !document.getElementById('why-' + i)));
  t.check('why: todas as ligacoes da sala tem prova no ficheiro', orphan.length === 0, orphan.join(','));
  await r.page.click('#fcLabX'); await r.page.waitForTimeout(400);
  await r.page.click('#fcHabit [data-habit="music"]'); await r.page.waitForTimeout(300);
  s = await st(r.page);
  t.check('habito «Yes, usually»: a pergunta sai e Read e Study passam a lo-fi', !s.habit && s.sd === 'Lo-fi,Lo-fi,Minimal,Minimal,Nature,Energy' && s.sound === 'Lo-fi', JSON.stringify(s));

  await r.page.fill('#fcIntent', 'chapter 3 draft');
  t.check('passo mais pequeno: aparece quando ha intencao', await r.page.isVisible('#fcStep'));
  await r.page.fill('#fcStep', 'open the outline');
  await r.page.click('#fcScenes .fc-card[data-id="write"]');
  await r.page.click('#fcSoundCh'); await r.page.waitForTimeout(200);
  await r.page.click('#fcProfPick .fc-chip[data-prof="liquid"]'); await r.page.waitForTimeout(300);
  s = await st(r.page);
  t.check('som da cena: mudar a porta muda a carta de Write e o som em vigor', s.sd.split(',')[2] === 'Liquid' && s.sound === 'Liquid' && /write\*/.test(s.cards), JSON.stringify(s));
  L = await layout(r.page, ENTRY.concat(['#fcProfPick .fc-chip']));
  t.check('entrada com os perfis abertos 1440x900: tudo no ecra, nada sobreposto', !L.bad.length, L.bad.join(' | '));
  await r.page.click('#fcBegin'); await r.page.waitForTimeout(2600);
  s = await st(r.page);
  t.check('Begin: sessao de 50 min a correr', s.stage === 'session' && /focus/.test(s.phase) && s.left > 2990 && s.left < 3000, JSON.stringify(s));
  t.check('foco: so minutos, sem segundos', s.tn === '50' && s.tu === 'min', s.tn + ' ' + s.tu);
  let m = await tune(r.page);
  t.check('Begin: a musica arranca no perfil escolhido (liquid)', m.loads.length >= 1 && m.loads[0] === 'liquid', m.loads.join(','));
  t.check('primeiro passo: a vista no primeiro bloco', /first step/.test(s.next) && /open the outline/.test(s.next), s.next);
  const tag = await r.page.textContent('#fcTag');
  t.check('sessao: cena e intencao por cima do anel', /write/.test(tag) && /chapter 3 draft/.test(tag), tag);
  L = await layout(r.page, SESS);
  t.check('sessao 1440x900: tudo no ecra, nada sobreposto', L.n >= 14 && !L.bad.length, L.bad.join(' | '));

  await r.page.click('#fcDial'); await r.page.waitForTimeout(300);
  const p1 = await st(r.page); await r.page.waitForTimeout(1500);
  s = await st(r.page);
  t.check('anel: um toque pausa o tempo e mostra os segundos', s.phase === 'paused' && s.left === p1.left && /:/.test(s.tn), JSON.stringify(s));
  await r.page.click('#fcDial'); await r.page.waitForTimeout(300);

  /* ultimo minuto: «+5 min» aparece e a musica comeca a descer */
  const v0 = (await tune(r.page)).vol;
  await setLeft(r.page, 62); await r.page.waitForTimeout(3500);
  s = await st(r.page); m = await tune(r.page);
  t.check('ultimo minuto: «+5 min» visivel e musica a descer', s.plus && m.vol < v0, 'plus=' + s.plus + ' vol ' + v0 + '->' + m.vol);
  L = await layout(r.page, SESS);
  t.check('ultimo minuto 1440x900: nada sobreposto', !L.bad.length, L.bad.join(' | '));

  /* intervalo: um quinto do bloco, musica calada, chuva baixa, convite e «onde paraste» */
  await setLeft(r.page, 2); await r.page.waitForTimeout(5500);
  s = await st(r.page); m = await tune(r.page);
  t.check('intervalo: 10 min depois de 50', s.phase === 'break' && s.left > 590 && s.left <= 600, JSON.stringify(s));
  t.check('intervalo: musica calada', m.state === 2, 'estado ' + m.state);
  const ov = await r.page.evaluate(() => HMFR.fc.sndOv);
  t.check('intervalo: chuva baixa no lugar dos sons de trabalho', ov && ov.rn === 35, JSON.stringify(ov));
  t.check('intervalo: convite, «onde paraste», «+5 min» e respiracao', s.brk && s.plus && s.breathe, JSON.stringify(s));
  L = await layout(r.page, SESS);
  t.check('intervalo 1440x900: tudo no ecra, nada sobreposto', !L.bad.length, L.bad.join(' | '));
  await r.page.fill('#fcNote', 'halfway through section 2');
  await r.page.click('#fcPlus'); await r.page.waitForTimeout(1800);
  s = await st(r.page); m = await tune(r.page);
  t.check('«+5 min» no intervalo: volta ao trabalho por 5 min com a musica', /focus/.test(s.phase) && s.left > 290 && s.left <= 300 && m.state === 1, JSON.stringify(s) + ' estado ' + m.state);
  t.check('onde paraste: lembrado no bloco seguinte; o primeiro passo ja nao', /halfway through section 2/.test(s.next) && !/first step/.test(s.next), s.next);
  await setLeft(r.page, 2); await r.page.waitForTimeout(3000);
  await setLeft(r.page, 2); await r.page.waitForTimeout(3000);
  s = await st(r.page); m = await tune(r.page);
  t.check('fim do intervalo: bloco novo de 50 min com a musica de volta', s.phase === 'focus · 2 of 3' && s.left > 2990 && m.state === 1, JSON.stringify(s) + ' estado ' + m.state);

  await r.page.click('#fcMore'); await r.page.waitForTimeout(500);
  L = await layout(r.page, ['#fcDrawer']);
  t.check('gaveta: abre dentro do ecra', (await st(r.page)).drw && L.n === 1 && !L.bad.length, L.bad.join(' | '));
  await r.page.click('#fcProfs .fc-chip[data-prof="silence"]'); await r.page.waitForTimeout(400);
  m = await tune(r.page);
  t.check('gaveta: o perfil Silence cala a musica', m.state === 2, 'estado ' + m.state);
  const nl = m.loads.length;
  await r.page.click('#fcProfs .fc-chip[data-prof="minimal"]'); await r.page.waitForTimeout(1800);
  m = await tune(r.page);
  t.check('gaveta: o perfil Minimal traz musica de dub ou hypnotic techno', m.state === 1 && m.loads.length > nl &&
    ['dub_techno', 'hypnotic_techno', 'ambient_techno'].includes(m.loads[m.loads.length - 1]), m.loads.slice(nl).join(',') + ' estado ' + m.state);
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

  await r.page.click('#fcMusicOn'); await r.page.waitForTimeout(400);
  m = await tune(r.page);
  t.check('gaveta: desligar a musica cala o leitor', m.state === 2, 'estado ' + m.state);
  await r.page.click('#fcMusicOn'); await r.page.waitForTimeout(400);

  /* sorteio por genero: ambient (poucas faixas) e lo-fi house (muitas) com a mesma parte */
  await r.page.evaluate(() => {
    document.querySelectorAll('#fcValve .fc-chip[aria-pressed=true]').forEach(b => b.click());
    document.getElementById('fcMoreG').click();
    [...document.querySelectorAll('#fcValve .fc-chip')].filter(b => ['ambient', 'lo-fi house'].includes(b.textContent)).forEach(b => b.click());
  });
  await r.page.keyboard.press('Escape'); await r.page.waitForTimeout(400);
  t.check('gaveta: Esc fecha', !(await st(r.page)).drw);
  const n0 = (await tune(r.page)).loads.length;
  for (let k = 0; k < 40; k++) await r.page.click('#fcSkipT');
  await r.page.waitForTimeout(300);
  const g = (await tune(r.page)).loads.slice(n0);
  const amb = g.filter(x => x === 'ambient').length;
  t.check('sorteio: cada genero aceso tem a mesma parte (ambient 10 a 30 em 40)', g.length === 40 && amb >= 10 && amb <= 30, amb + '/' + g.length);
  t.check('computador: sem erros de JavaScript', r.errors.length === 0, r.errors.join(' | '));

  /* memoria: depois de recarregar, a entrada oferece «My last», escolhida, e lembra onde se parou */
  await r.act('focusClose'); await r.page.waitForTimeout(400);
  await r.page.reload(); await r.page.waitForTimeout(1200);
  await r.page.click('#splash');
  for (let k = 0; k < 60; k++) { await r.page.waitForTimeout(200); if (await r.page.evaluate(() => window.HM && HM.isOn())) break; }
  await enter(r);
  s = await st(r.page);
  t.check('memoria: «My last» aparece e vem escolhida', s.stage === 'entry' && s.cards === 'read,study,write,tech,create,routine,last*', JSON.stringify(s));
  const mem = await r.page.evaluate(() => JSON.parse(localStorage.getItem('hm_focus')));
  t.check('memoria: guarda fundo, intencao, generos e onde se parou', mem && mem.v === 2 && mem.bg === 'ink' && mem.intent === 'chapter 3 draft' &&
    mem.allow.length === 2 && mem.note === 'halfway through section 2', JSON.stringify(mem));
  t.check('memoria: guarda o habito e o perfil escolhido por cena', mem.habit === 'music' && mem.prof && mem.prof.write === 'minimal' && mem.curProf === 'custom' &&
    !s.habit && s.sd === 'Lo-fi,Lo-fi,Minimal,Minimal,Nature,Energy,your mix', JSON.stringify({ habit: mem.habit, prof: mem.prof, cur: mem.curProf, sd: s.sd }));
  const ln = await r.page.evaluate(() => document.getElementById('fcCont').hidden ? '' : document.getElementById('fcContN').textContent);
  t.check('continuar onde parei: a porta mostra o botao com a nota', /halfway through section 2/.test(ln), ln);

  /* 1024x768: entrada, trabalho e intervalo sem sobreposicoes */
  await r.page.setViewportSize({ width: 1024, height: 768 }); await r.page.waitForTimeout(400);
  L = await layout(r.page, ENTRY);
  t.check('entrada 1024x768: tudo no ecra, nada sobreposto', L.n >= 10 && !L.bad.length, L.bad.join(' | '));
  await r.page.click('#fcCont'); await r.page.waitForTimeout(800);
  s = await st(r.page);
  t.check('continuar onde parei: um toque abre a sessao com a ultima configuracao e a nota', s.stage === 'session' && /focus/.test(s.phase) &&
    s.left > 2990 && /halfway through section 2/.test(s.next), JSON.stringify(s));
  L = await layout(r.page, SESS);
  t.check('sessao 1024x768: tudo no ecra, nada sobreposto', L.n >= 12 && !L.bad.length, L.bad.join(' | '));
  await setLeft(r.page, 2); await r.page.waitForTimeout(3000);
  L = await layout(r.page, SESS);
  t.check('intervalo 1024x768: tudo no ecra, nada sobreposto', !L.bad.length, L.bad.join(' | '));
  await r.close();

  /* 2) memoria da v4.6: as cenas antigas viram «custom», o sino suave e a respiracao desligada */
  r = await T.openLiquid(browser, { mode: 'desktop', init: `if(!sessionStorage.getItem('v1')){ sessionStorage.setItem('v1','1'); localStorage.setItem('hm_focus', JSON.stringify({v:1, scene:'deep', len:50, allow:['dub_techno'], snd:{rn:45,fp:0,ck:0}, ring:0, vol:70, bg:'dusk', idle:true, breathe:true, intent:''})); }` });
  const gate2 = await enter(r);
  const mig = await r.page.evaluate(() => ({ ring: document.getElementById('fcRing').value, breathe: document.getElementById('fcBreathe').checked,
    scene: document.getElementById('fcSceneSel').value, cards: [...document.querySelectorAll('#fcScenes .fc-card')].map(b => b.getAttribute('data-id') + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(',') }));
  t.check('migracao v4.6: sino suave, sem respiracao, «My last» escolhida', !gate2 && mig.ring === '5' && !mig.breathe && mig.scene === 'custom' && /last\*$/.test(mig.cards), JSON.stringify(mig));
  /* com «My last» escolhida, mudar o som a porta tem de sobreviver ao Begin (que reaplica a escolha) */
  await r.page.click('#fcSoundCh'); await r.page.waitForTimeout(200);
  await r.page.click('#fcProfPick .fc-chip[data-prof="lofi"]'); await r.page.waitForTimeout(300);
  await r.page.click('#fcBegin'); await r.page.waitForTimeout(2200);
  m = await tune(r.page);
  const cp = await r.page.evaluate(() => HMFR.fc.curProf);
  t.check('«My last» e outro som: o Begin toca o som escolhido (lo-fi)', cp === 'lofi' && m.loads.length >= 1 && m.loads[0] === 'lofi', cp + ' ' + m.loads.join(','));
  t.check('migracao: sem erros de JavaScript', r.errors.length === 0, r.errors.join(' | '));
  await r.close();

  /* 3) telemovel de pe e deitado: «Read» sem musica, trabalho e intervalo sem sobreposicoes */
  r = await T.openLiquid(browser, { mode: 'mobile' });
  await enter(r);
  L = await layout(r.page, ENTRY);
  t.check('entrada 390x844: tudo no ecra, nada sobreposto', L.n >= 9 && !L.bad.length, L.bad.join(' | '));
  await r.page.tap('#fcBegin'); await r.page.waitForTimeout(1500);
  m = await tune(r.page);
  t.check('«Read»: comeca sem musica', m.loads.length === 0, m.loads.join(','));
  L = await layout(r.page, SESS);
  t.check('sessao 390x844: tudo no ecra, nada sobreposto', L.n >= 11 && !L.bad.length, L.bad.join(' | '));
  await setLeft(r.page, 2); await r.page.waitForTimeout(3000);
  s = await st(r.page);
  t.check('«Read»: intervalo de 5 min', s.phase === 'break' && s.left > 290 && s.left <= 300, JSON.stringify(s));
  L = await layout(r.page, SESS);
  t.check('intervalo 390x844: tudo no ecra, nada sobreposto', !L.bad.length, L.bad.join(' | '));
  await r.page.tap('#fcMore'); await r.page.waitForTimeout(500);
  const sheet = await r.page.evaluate(() => { const b = document.getElementById('fcDrawer').getBoundingClientRect(); return { top: b.top, bottom: b.bottom, h: innerHeight }; });
  t.check('telemovel: ajustes numa folha que sobe de baixo', sheet.bottom <= sheet.h + 1 && sheet.top > 60, JSON.stringify(sheet));
  await r.page.tap('#fcDrawerX'); await r.page.waitForTimeout(500);
  await r.page.tap('#fcBrk .tip .fc-why'); await r.page.waitForTimeout(900);
  W = await labSt(r.page);
  t.check('telemovel: o «why?» do intervalo abre a prova numa folha dentro do ecra', W.on && W.hl === 'why-guided-break' && W.inView, JSON.stringify(W));
  await r.page.tap('#fcLabX'); await r.page.waitForTimeout(500);
  await r.page.setViewportSize({ width: 844, height: 390 }); await r.page.waitForTimeout(600);
  L = await layout(r.page, SESS);
  t.check('intervalo 844x390 (deitado): tudo no ecra, nada sobreposto', !L.bad.length, L.bad.join(' | '));
  await setLeft(r.page, 2); await r.page.waitForTimeout(3000);
  L = await layout(r.page, SESS);
  t.check('sessao 844x390 (deitado): tudo no ecra, nada sobreposto', L.n >= 9 && !L.bad.length, L.bad.join(' | '));
  t.check('telemovel: sem erros de JavaScript', r.errors.length === 0, r.errors.join(' | '));
  await r.close();

  await browser.close();
  t.done();
})().catch(e => { console.error('FAIL focus: excecao', e); process.exitCode = 1; });
