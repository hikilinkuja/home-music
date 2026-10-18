// Sala de foco (v4.6, ronda 1 da avaliacao em v4.9, ronda 2a em v5.0): entrada com seis cenas por tarefa e Begin,
// sessao com anel (so minutos durante o foco), ultimo minuto com a musica a descer e «+5 min»,
// intervalo de um quinto do bloco com a musica calada, chuva baixa e «onde paraste», sino suave por
// omissao, respiracao opcional, gaveta, fundos da sala e da radio, sorteio por genero, memoria (e a
// migracao da memoria da v4.6). Nada sobreposto nem fora do ecra em 1440x900, 1024x768, 390x844 e
// 844x390, no trabalho e no intervalo. Ronda 2a: perfis de som por cena e pergunta da primeira visita,
// zona «why?» (painel e ligacoes, todas com prova no focus-evidence.json), «continuar onde parei»,
// passo mais pequeno e linha de recomeco. Ronda 2b (v5.2): registo dos blocos completos (totais do dia e da
// semana, «+5 min» no mesmo bloco, tampa de 2000), aviso das quatro horas, plano «se... entao», pensamentos
// estacionados, experiencia pessoal AB BA (ordem, nota de 1 a 5, «I got distracted», bloco mudado fora da
// contagem, resultado com intervalo so com quatro de cada, inacabados, exportacao CSV e JSON, parar, apagar).
// O relogio da sala acelera-se pelo window.HMFR. Cerca de 3 min.
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
const ENTRY = ['#fcTop .fbrand', '#fcClock', '#fcTot', '#fcWhyBtn', '#fcExit', '#fcFresh', '#fcCont', '#fcIntent', '#fcStep', '#fcIfLnk', '#fcIfRow',
  '#fcHabit', '#fcScenes .fc-card', '#fcSound', '#fcPhone', '#fcBegin', '#fcAdjust'];
const SESS = ['#fcTop .fbrand', '#fcWhyBtn', '#fcSeal', '#fcExit', '#fcTag', '#fcNext', '#fcDial', '#fcHint', '#fcBrk', '#fcRate', '#fcParkBtn',
  '#fcParkBox', '#fcDis', '#fcPlus', '#fcBreatheNow', '#fcGo', '#fcNowBox', '#fcPlay', '#fcSkipT', '.fc-vol', '#fcTgRn', '#fcTgFp', '#fcTgCk', '#fcMore', '#fcKeys'];

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
    tot: d('fcTot').hidden ? '' : d('fcTot').textContent, rate: !d('fcRate').hidden, xnote: d('fcXNote').hidden ? '' : d('fcXNote').textContent,
    parked: d('fcParked').hidden ? '' : d('fcParkL').textContent, day: d('fcDayN').hidden ? '' : d('fcDayN').textContent,
    cap: !d('fcCapN').hidden, park: !d('fcParkBtn').hidden, dis: d('fcDis').hidden ? '' : d('fcDis').textContent,
  };
});
/* registo dos blocos (hm_focus_log) e experiencia, lidos pelo window.HMFR */
const flog = (page) => page.evaluate(() => JSON.parse(JSON.stringify({ log: HMFR.log(), xb: HMFR.fc.xb, cur: HMFR.fc.curProf, next: HMFR.xNext(), today: HMFR.dayKey(new Date()) })));
/* acaba o bloco ou o intervalo em curso (o relogio da sala conta um segundo de cada vez) */
const finish = async (page) => { await page.evaluate(() => { HMFR.fc.pomo.left = 1; }); await page.waitForTimeout(1600); };
/* descarrega uma exportacao e devolve o texto */
const grab = async (page, sel) => {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click(sel)]);
  const fs = require('fs'); const f = await dl.path(); return { name: dl.suggestedFilename(), text: fs.readFileSync(f, 'utf8') };
};
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

  t.check('registo: sem blocos, a porta nao mostra totais', s.tot === '' && (await flog(r.page)).log.b.length === 0, JSON.stringify(s.tot));
  await r.page.fill('#fcIntent', 'chapter 3 draft');
  t.check('passo mais pequeno: aparece quando ha intencao', await r.page.isVisible('#fcStep'));
  await r.page.fill('#fcStep', 'open the outline');
  t.check('se... entao: a ligacao esta na linha do passo e os campos fechados', await r.page.isVisible('#fcIfLnk') && !(await r.page.isVisible('#fcIfRow')));
  await r.page.click('#fcIfLnk'); await r.page.waitForTimeout(200);
  await r.page.fill('#fcIf', 'I want to check my phone'); await r.page.fill('#fcThen', 'I park the thought and carry on');
  L = await layout(r.page, ENTRY);
  t.check('entrada com o plano «se... entao» aberto 1440x900: tudo no ecra, nada sobreposto', (await r.page.isVisible('#fcIfRow')) && !L.bad.length, L.bad.join(' | '));
  await r.page.click('#fcIfLnk'); await r.page.waitForTimeout(200);
  t.check('se... entao: «done» fecha os campos e a ligacao diz que o plano esta ligado', !(await r.page.isVisible('#fcIfRow')) &&
    (await r.page.textContent('#fcIfLnk')) === 'if-then plan: on', await r.page.textContent('#fcIfLnk'));
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
  t.check('se... entao: o plano fica por cima do anel durante o trabalho', /if\s*I want to check my phone\s*then\s*I park the thought/.test(s.next), s.next);
  t.check('fora da experiencia: sem nota nem «I got distracted»; «Park a thought» a vista', !s.rate && s.dis === '' && s.park, JSON.stringify(s));
  await r.page.keyboard.press('t'); await r.page.waitForTimeout(200);
  t.check('estacionar: a tecla t abre o campo com o cursor nele', await r.page.evaluate(() => document.activeElement && document.activeElement.id === 'fcPark'));
  await r.page.keyboard.type('reply to Ana about Friday'); await r.page.keyboard.press('Enter'); await r.page.waitForTimeout(200);
  const pk = await r.page.evaluate(() => HMFR.fc.park.map(x => x.t));
  t.check('estacionar: Enter guarda o pensamento e fecha o campo', pk.length === 1 && pk[0] === 'reply to Ana about Friday' && !(await r.page.isVisible('#fcParkBox')) &&
    /parked/i.test(await r.page.textContent('#fcParkBtn')), JSON.stringify(pk));
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
  let F = await flog(r.page);
  t.check('registo: o bloco completo entra com o dia, a cena, o perfil e 50 min', F.log.b.length === 1 && F.log.b[0].m === 50 && F.log.b[0].s === 'write' &&
    F.log.b[0].p === 'liquid' && F.log.b[0].d === F.today && !('e' in F.log.b[0]), JSON.stringify(F.log.b));
  t.check('intervalo: os pensamentos estacionados e o total do dia; sem nota fora da experiencia', /reply to Ana about Friday/.test(s.parked) &&
    s.day === 'today so far: 50 min of focus' && !s.rate && !s.cap, JSON.stringify(s));
  L = await layout(r.page, SESS);
  t.check('intervalo 1440x900: tudo no ecra, nada sobreposto', !L.bad.length, L.bad.join(' | '));
  await r.page.fill('#fcNote', 'halfway through section 2');
  await r.page.click('#fcPlus'); await r.page.waitForTimeout(1800);
  s = await st(r.page); m = await tune(r.page);
  t.check('«+5 min» no intervalo: volta ao trabalho por 5 min com a musica', /focus/.test(s.phase) && s.left > 290 && s.left <= 300 && m.state === 1, JSON.stringify(s) + ' estado ' + m.state);
  t.check('onde paraste: lembrado no bloco seguinte; o primeiro passo ja nao', /halfway through section 2/.test(s.next) && !/first step/.test(s.next), s.next);
  await setLeft(r.page, 2); await r.page.waitForTimeout(3000);
  F = await flog(r.page);
  t.check('registo: o «+5 min of work» do intervalo soma ao mesmo bloco (55 min, um so bloco)', F.log.b.length === 1 && F.log.b[0].m === 55, JSON.stringify(F.log.b));
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
  t.check('memoria: guarda o plano «se... entao» e os pensamentos estacionados', mem.ift && mem.ift.i === 'I want to check my phone' &&
    mem.ift.t === 'I park the thought and carry on' && mem.park.length === 1, JSON.stringify({ ift: mem.ift, park: mem.park }));
  t.check('totais: depois de recarregar, a porta mostra hoje e esta semana (o bloco por acabar nao conta)', s.tot === 'today 55 minthis week 55 min', s.tot);
  t.check('se... entao: com plano guardado, a porta mostra os dois campos preenchidos', (await r.page.isVisible('#fcIfRow')) &&
    (await r.page.inputValue('#fcIf')) === 'I want to check my phone');
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

  /* 2b) experiencia pessoal: Write, Minimal (A) contra Silence (B), ordem AB BA a partir da letra sorteada;
     notas 3 para A e 4 ou 5 para B; um bloco com o som mudado fica fora da contagem */
  r = await T.openLiquid(browser, { mode: 'desktop', init: `if(!sessionStorage.getItem('xl')){ sessionStorage.setItem('xl','1'); localStorage.setItem('hm_focus_log', '{bad json'); }` });
  await enter(r);
  F = await flog(r.page);
  t.check('registo ilegivel: comeca vazio, sem erros', F.log.v === 1 && F.log.b.length === 0 && !F.log.x && r.errors.length === 0, JSON.stringify(F.log) + r.errors.join('|'));
  await r.page.click('#fcAdjust'); await r.page.waitForTimeout(400);
  await r.page.selectOption('#fcXScene', 'write');
  await r.page.selectOption('#fcXA', 'minimal');
  await r.page.selectOption('#fcXB', 'minimal');
  const xab = await r.page.evaluate(() => [document.getElementById('fcXA').value, document.getElementById('fcXB').value]);
  t.check('experiencia: escolher o mesmo som nos dois troca-os, nunca ficam iguais', xab[0] !== xab[1] && xab[1] === 'minimal', xab.join(','));
  await r.page.selectOption('#fcXA', 'minimal'); await r.page.selectOption('#fcXB', 'silence');
  await r.page.click('#fcXGo'); await r.page.waitForTimeout(300);
  F = await flog(r.page);
  const X = F.log.x;
  t.check('experiencia: comeca com a cena, os dois sons e a primeira letra sorteada', X && X.s === 'write' && X.A === 'minimal' && X.B === 'silence' && /^[AB]$/.test(X.f), JSON.stringify(X));
  const o = X.f === 'A' ? 'B' : 'A', SEQ = [X.f, o, o, X.f, X.f, o, o, X.f];
  t.check('experiencia: o primeiro bloco e a primeira letra', F.next === X.f, F.next + ' ' + X.f);
  await r.page.keyboard.press('Escape'); await r.page.waitForTimeout(300);
  s = await st(r.page);
  const snd = await r.page.textContent('#fcSoundT');
  t.check('porta: a cena da experiencia vem escolhida e o som diz que vem da experiencia, sem «change»', /write\*/.test(s.cards) &&
    s.sound === (X[X.f] === 'minimal' ? 'Minimal' : 'Silence') && /set by your experiment, sound [AB]/.test(snd) && !(await r.page.isVisible('#fcSoundCh')), s.cards + ' ' + s.sound + ' ' + snd);
  await r.page.click('#fcBegin'); await r.page.waitForTimeout(2200);
  const RATE = { A: [3, 3, 3, 3], B: [4, 5, 4, 5] }, used = { A: 0, B: 0 };
  let okSeq = true, okProf = true, okMusic = true, seqLog = [];
  for (let j = 0; j < 8; j++) {
    F = await flog(r.page); s = await st(r.page); m = await tune(r.page);
    const c = SEQ[j];
    if (X[c] !== 'silence') for (let w = 0; w < 15 && (await tune(r.page)).state !== 1; w++) await r.page.waitForTimeout(200);
    m = await tune(r.page);
    seqLog.push((F.xb ? F.xb.c : '-') + ':' + F.cur);
    if (!F.xb || F.xb.c !== c) okSeq = false;
    if (F.cur !== X[c]) okProf = false;
    if ((X[c] === 'minimal') !== (m.state === 1)) okMusic = false;
    if (j === 0) {
      t.check('bloco da experiencia: linha «experiment» por cima do anel e «I got distracted» a vista', /experiment\s*sound [AB]/.test(s.next) && s.dis === 'I got distracted', JSON.stringify(s));
      await r.page.click('#fcDis'); await r.page.click('#fcDis'); await r.page.waitForTimeout(200);
      t.check('«I got distracted»: cada toque conta e o botao mostra a contagem', (await flog(r.page)).xb.k === 2 && /· 2$/.test(await r.page.textContent('#fcDis')));
      L = await layout(r.page, SESS);
      t.check('sessao da experiencia 1440x900: tudo no ecra, nada sobreposto', !L.bad.length, L.bad.join(' | '));
    }
    if (j === 3) {
      /* o som mudado a meio tira o bloco da contagem: sem nota, aviso, e o bloco seguinte repete a letra */
      await r.page.click('#fcMore'); await r.page.waitForTimeout(400);
      await r.page.click('#fcProfs .fc-chip[data-prof="liquid"]'); await r.page.waitForTimeout(300);
      await r.page.keyboard.press('Escape'); await r.page.waitForTimeout(300);
      t.check('som mudado a meio: a linha da experiencia avisa que o bloco nao conta', /will not count/.test(await r.page.textContent('#fcNext')));
      await finish(r.page);
      s = await st(r.page); F = await flog(r.page);
      t.check('som mudado a meio: o intervalo nao pede nota e diz porque; a ordem nao avanca', !s.rate && /does not count/.test(s.xnote) && F.next === c &&
        F.log.b[F.log.b.length - 1].ch === 1, JSON.stringify(s) + ' next=' + F.next);
      await finish(r.page);
      F = await flog(r.page);
      t.check('som mudado a meio: o bloco seguinte repete o mesmo som', F.xb && F.xb.c === c && F.cur === X[c], JSON.stringify(F.xb) + ' ' + F.cur);
    }
    await finish(r.page);
    s = await st(r.page);
    if (j === 0) {
      t.check('fim do bloco da experiencia: o intervalo pede a nota de 1 a 5', s.rate && (await r.page.textContent('#fcRateQ')) === 'How focused were you?', JSON.stringify(s));
      L = await layout(r.page, SESS);
      t.check('intervalo com a nota e os pensamentos 1440x900: tudo no ecra, nada sobreposto', !L.bad.length, L.bad.join(' | '));
    }
    const v = RATE[c][used[c]++];
    await r.page.click(`#fcRate [data-rate="${v}"]`); await r.page.waitForTimeout(150);
    if (j === 0) {
      s = await st(r.page); F = await flog(r.page);
      t.check('nota: um toque guarda-a, a pergunta passa a «Focus noted» e a ordem avanca', F.log.b[0].r === v && F.log.b[0].k === 2 && F.next === SEQ[1] &&
        (await r.page.textContent('#fcRateQ')) === 'Focus noted' && /Rated so far: A [01], B [01]/.test(s.xnote), JSON.stringify(F.log.b[0]) + ' ' + s.xnote);
    }
    if (j === 6) {
      await r.page.click('#fcMore'); await r.page.waitForTimeout(400);
      const pre = await r.page.textContent('#fcXRes');
      t.check('antes de quatro de cada: sem resultado, com as contagens', /No result yet/.test(pre) && /Rated so far: A [34], B [34]/.test(pre), pre);
      await r.page.keyboard.press('Escape'); await r.page.waitForTimeout(300);
    }
    await finish(r.page);
  }
  t.check('experiencia: a ordem dos blocos contados e AB BA AB BA a partir da letra sorteada', okSeq, SEQ.join('') + ' <- ' + seqLog.join(' '));
  t.check('experiencia: cada bloco toca o som da sua letra (e o Silence cala a musica)', okProf && okMusic, seqLog.join(' ') + ' music=' + okMusic);
  const XS = await r.page.evaluate(() => HMFR.xStats());
  t.check('resultado: quatro de cada, quatro pares, diferenca media +1,5 e intervalo de 95% pela t de Student', XS.ready && XS.A.n === 4 && XS.B.n === 4 &&
    XS.d.join() === '1,2,1,2' && Math.abs(XS.mean - 1.5) < 1e-9 && Math.abs(XS.lo - (1.5 - 3.182 * Math.sqrt(1 / 3) / 2)) < 1e-6, JSON.stringify(XS));
  await r.page.click('#fcMore'); await r.page.waitForTimeout(400);
  let res = await r.page.textContent('#fcXRes');
  t.check('resultado na gaveta: medias, diferenca com intervalo e veredicto com o nome do som', /A, Minimal: focus 3\.0 on average over 4 blocks/.test(res) &&
    /B, Silence: focus 4\.5 on average over 4 blocks/.test(res) && /\+1\.5 \(95% interval \+0\.6 to \+2\.4, 4 pairs\)/.test(res) && /So far Silence went better/.test(res), res);
  t.check('resultado: os limites ficam ditos (sem ocultacao, nota subjetiva, tarefas que variam)', /no blinding/.test(await r.page.textContent('#fcXRun')) &&
    /own impression/.test(await r.page.textContent('#fcXRun')) && /tasks vary/.test(await r.page.textContent('#fcXRun')));
  L = await layout(r.page, ['#fcDrawer']);
  t.check('gaveta com o resultado: dentro do ecra', !L.bad.length, L.bad.join(' | '));
  const csv = await grab(r.page, '#fcExpCsv');
  const rows = csv.text.trim().split('\n');
  t.check('exportar CSV: cabecalho e uma linha por bloco, com a experiencia, a nota e se conta', /^home-music-focus-log-\d{8}-\d{4}\.csv$/.test(csv.name) &&
    rows[0] === 'date,time,scene,sound,minutes,experiment,condition,rating,distracted,counted' && rows.length === 10 &&
    rows.filter(l => /,1$/.test(l)).length === 8 && rows.filter(l => /,0$/.test(l)).length === 1, csv.name + ' ' + rows.length + ' ' + rows.slice(0, 3).join(' / '));
  const js = await grab(r.page, '#fcExpJson');
  let jo = null; try { jo = JSON.parse(js.text); } catch (e) { /* segue */ }
  t.check('exportar JSON: o registo inteiro, com a experiencia em curso', jo && jo.log && jo.log.v === 1 && jo.log.b.length === 9 && jo.log.x && jo.log.x.id === X.id, js.text.slice(0, 200));
  await r.page.keyboard.press('Escape'); await r.page.waitForTimeout(300);
  /* um bloco deixado a meio com «End session» conta como inacabado para a sua letra */
  const c9 = (await flog(r.page)).xb.c;
  await r.page.evaluate(() => { HMFR.fc.pomo.left = HMFR.fc.pomo.total - 120; });
  await r.page.click('#fcMore'); await r.page.waitForTimeout(400);
  await r.page.click('#fcEnd'); await r.page.waitForTimeout(500);
  F = await flog(r.page);
  t.check('«End session» a meio de um bloco da experiencia: conta como inacabado, nao entra nos totais', F.log.x.un[c9] === 1 && F.log.b.length === 9, JSON.stringify(F.log.x.un));
  await r.page.click('#fcAdjust'); await r.page.waitForTimeout(400);
  res = await r.page.textContent('#fcXRes');
  t.check('resultado: mostra os blocos inacabados por letra', new RegExp('unfinished: A ' + (c9 === 'A' ? 1 : 0) + ', B ' + (c9 === 'B' ? 1 : 0)).test(res), res);
  await r.page.click('#fcXStop'); await r.page.waitForTimeout(300);
  F = await flog(r.page);
  t.check('parar: a experiencia passa para as acabadas com o resultado; a gaveta volta a oferecer uma nova', !F.log.x && F.log.xp.length === 1 &&
    F.log.xp[0].res.mean === 1.5 && await r.page.isVisible('#fcXGo'), JSON.stringify(F.log.xp[0] && F.log.xp[0].res));
  await r.page.keyboard.press('Escape'); await r.page.waitForTimeout(300);
  t.check('parar: a porta volta a oferecer «change» no som', await r.page.isVisible('#fcSoundCh'));
  await r.page.click('#fcAdjust'); await r.page.waitForTimeout(400);
  await r.page.click('#fcLogDel'); await r.page.waitForTimeout(200);
  const del1 = (await flog(r.page)).log.b.length;
  await r.page.click('#fcLogDel'); await r.page.waitForTimeout(300);
  F = await flog(r.page);
  const raw = await r.page.evaluate(() => localStorage.getItem('hm_focus_log'));
  t.check('apagar: o primeiro toque so pede confirmacao, o segundo apaga tudo do browser', del1 === 9 && F.log.b.length === 0 && F.log.xp.length === 0 && raw === null,
    del1 + ' ' + F.log.b.length + ' ' + raw);
  await r.page.keyboard.press('Escape'); await r.page.waitForTimeout(300);
  t.check('apagar: a porta deixa de mostrar totais', (await st(r.page)).tot === '');
  t.check('experiencia: sem erros de JavaScript', r.errors.length === 0, r.errors.join(' | '));
  await r.close();

  /* 2c) aviso das quatro horas e tampa do registo: 1996 blocos antigos e 230 min hoje */
  r = await T.openLiquid(browser, { mode: 'desktop', init: `if(!sessionStorage.getItem('cap')){ sessionStorage.setItem('cap','1');
    var d=new Date(), p=function(n){ return (n<10?'0':'')+n; }, k=d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()), b=[];
    for(var i=0;i<1996;i++) b.push({ t:1700000000000+i, d:'2025-01-0'+(1+i%9), s:'read', p:'nature', m:25 });
    [50,50,50,80].forEach(function(m, i){ b.push({ t:d.getTime()-3600000*(4-i), d:k, s:'write', p:'minimal', m:m }); });
    localStorage.setItem('hm_focus_log', JSON.stringify({ v:1, b:b, x:null, xp:[] })); }` });
  await enter(r);
  s = await st(r.page);
  t.check('porta: os totais de hoje e da semana no topo', /^today 3 h 50this week \d+ h \d{2}$|^today 3 h 50this week \d+ h$/.test(s.tot), s.tot);
  await r.page.click('#fcTot'); await r.page.waitForTimeout(500);
  const wk = await r.page.evaluate(() => ({ n: document.querySelectorAll('#fcWeek .dy').length, td: document.querySelector('#fcWeek .dy.td .mm').textContent,
    sum: document.getElementById('fcLogSum').textContent, drw: document.getElementById('focus').classList.contains('drw') }));
  t.check('totais: um toque abre a gaveta na semana de segunda a domingo, com hoje marcado', wk.drw && wk.n === 7 && wk.td === '3h50' && /Today: 3 h 50, 4 blocks/.test(wk.sum), JSON.stringify(wk));
  await r.page.keyboard.press('Escape'); await r.page.waitForTimeout(300);
  await r.page.click('#fcBegin'); await r.page.waitForTimeout(1200);
  await finish(r.page);
  s = await st(r.page); F = await flog(r.page);
  t.check('quatro horas: o intervalo mostra o aviso suave, sem o total do dia', s.cap && s.day === '', JSON.stringify(s));
  t.check('tampa: o registo fica nos 2000 blocos, sai o mais antigo', F.log.b.length === 2000 && F.log.b[0].t === 1700000000001 && F.log.b[1999].m === 25, F.log.b.length + ' ' + F.log.b[0].t);
  L = await layout(r.page, SESS);
  t.check('intervalo com o aviso 1440x900: tudo no ecra, nada sobreposto', !L.bad.length, L.bad.join(' | '));
  await r.page.click('#fcCapX'); await r.page.waitForTimeout(700);
  s = await st(r.page);
  const capMem = await r.page.evaluate(() => JSON.parse(localStorage.getItem('hm_focus') || '{}').capDay);
  t.check('quatro horas: «dismiss» tira o aviso por hoje e fica lembrado', !s.cap && s.day === 'today so far: 4 h 15 of focus' && capMem === (await flog(r.page)).today,
    JSON.stringify(s) + ' ' + capMem);
  await finish(r.page); await finish(r.page);
  s = await st(r.page);
  t.check('quatro horas: dispensado, nao volta no intervalo seguinte', !s.cap && s.day === 'today so far: 4 h 40 of focus', JSON.stringify(s));
  await r.page.click('#fcMore'); await r.page.waitForTimeout(400);
  await r.page.click('#fcTotOn'); await r.page.waitForTimeout(200);
  s = await st(r.page);
  t.check('esconder os totais: o intervalo deixa de mostrar o total do dia', s.day === '', JSON.stringify(s));
  await r.page.click('#fcEnd'); await r.page.waitForTimeout(500);
  s = await st(r.page);
  t.check('esconder os totais: a porta tambem deixa de os mostrar', s.stage === 'entry' && s.tot === '', JSON.stringify(s));
  t.check('quatro horas: sem erros de JavaScript', r.errors.length === 0, r.errors.join(' | '));
  await r.close();

  /* 3) telemovel de pe e deitado: «Read» sem musica, trabalho e intervalo sem sobreposicoes; com dois blocos
     de hoje no registo e uma experiencia em Read (Nature contra Silence), para a porta ter totais e o
     intervalo a nota e os pensamentos estacionados */
  r = await T.openLiquid(browser, { mode: 'mobile', init: `if(!sessionStorage.getItem('mb')){ sessionStorage.setItem('mb','1');
    var d=new Date(), p=function(n){ return (n<10?'0':'')+n; }, k=d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());
    localStorage.setItem('hm_focus_log', JSON.stringify({ v:1, b:[{ t:d.getTime()-7200000, d:k, s:'write', p:'minimal', m:50 }, { t:d.getTime()-3600000, d:k, s:'write', p:'minimal', m:50 }],
      x:{ id:'xmob', s:'read', A:'nature', B:'silence', f:'A', t0:d.getTime(), un:{ A:0, B:0 } }, xp:[] })); }` });
  await enter(r);
  s = await st(r.page);
  t.check('telemovel: os totais no topo da porta, no lugar do relogio', s.tot === 'today 1 h 40this week 1 h 40' && !(await r.page.isVisible('#fcClock')), s.tot);
  L = await layout(r.page, ENTRY);
  t.check('entrada 390x844: tudo no ecra, nada sobreposto', L.n >= 9 && !L.bad.length, L.bad.join(' | '));
  await r.page.tap('#fcBegin'); await r.page.waitForTimeout(1500);
  m = await tune(r.page);
  t.check('«Read»: comeca sem musica', m.loads.length === 0, m.loads.join(','));
  L = await layout(r.page, SESS);
  t.check('sessao 390x844: tudo no ecra, nada sobreposto', L.n >= 11 && !L.bad.length, L.bad.join(' | '));
  await r.page.tap('#fcParkBtn'); await r.page.waitForTimeout(300);
  L = await layout(r.page, SESS);
  t.check('sessao 390x844 com o campo de estacionar aberto: tudo no ecra, nada sobreposto', (await r.page.isVisible('#fcPark')) && !L.bad.length, L.bad.join(' | '));
  await r.page.keyboard.type('book the dentist'); await r.page.keyboard.press('Enter'); await r.page.waitForTimeout(200);
  await setLeft(r.page, 2); await r.page.waitForTimeout(3000);
  s = await st(r.page);
  t.check('«Read»: intervalo de 5 min', s.phase === 'break' && s.left > 290 && s.left <= 300, JSON.stringify(s));
  t.check('telemovel: o intervalo pede a nota e mostra o pensamento estacionado', s.rate && /book the dentist/.test(s.parked), JSON.stringify(s));
  L = await layout(r.page, SESS);
  t.check('intervalo 390x844: tudo no ecra, nada sobreposto', !L.bad.length, L.bad.join(' | '));
  await r.page.tap('#fcRate [data-rate="4"]'); await r.page.waitForTimeout(200);
  await r.page.tap('#fcParkL .fc-x'); await r.page.waitForTimeout(200);
  s = await st(r.page);
  t.check('telemovel: a nota fica e o pensamento tratado sai da lista', (await flog(r.page)).log.b[2].r === 4 && s.parked === '' &&
    (await r.page.evaluate(() => HMFR.fc.park.length)) === 0, JSON.stringify(s));
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
