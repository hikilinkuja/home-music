// Biblioteca comum dos testes da sala liquid (ver ops/tests/README.md).
// A pagina montada (liquid/index.html) e servida a partir do repositorio numa origem falsa
// (http://hm.test); o YouTube e substituido por um leitor simulado; o archive.org, o freesound,
// a Wikimedia e o museu de Chicago recebem ficheiros de substituicao gerados na hora; qualquer
// outro pedido e cortado. Nenhum teste toca a rede real.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..', '..');

function playwright() {
  try { return require('playwright'); } catch (e) { /* segue */ }
  for (const p of ['/opt/node22/lib/node_modules/playwright', '/usr/lib/node_modules/playwright', '/usr/local/lib/node_modules/playwright']) {
    try { return require(p); } catch (e) { /* segue */ }
  }
  console.error('Playwright nao encontrado. Na nuvem vem instalado; localmente: npm i -g playwright (sem descarregar browsers se ja houver Chromium).');
  process.exit(2);
}

/* ---------- resultado: PASS / FAIL ---------- */
function suite(name) {
  const res = [];
  return {
    check(label, ok, detail) {
      res.push({ label, ok: !!ok });
      console.log((ok ? 'PASS ' : 'FAIL ') + name + ': ' + label + (ok || detail === undefined ? '' : '  [' + String(detail).slice(0, 400) + ']'));
    },
    warn(label) { console.log('WARN ' + name + ': ' + label); },
    done() {
      const bad = res.filter(r => !r.ok).length;
      console.log(`${name}: ${res.length - bad}/${res.length} passam`);
      process.exitCode = bad ? 1 : 0;
    },
  };
}

/* ---------- ficheiros de substituicao ---------- */
function wav(file, secs, opt) {
  const sr = 8000, n = Math.round(secs * sr), b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24);
  b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  let seed = 7;
  for (let i = 0; i < n; i++) {
    let x;
    if (opt.noise) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; x = (seed / 0x7fffffff) * 2 - 1; }
    else x = Math.sin(2 * Math.PI * opt.freq * i / sr);
    b.writeInt16LE(Math.round(x * (opt.amp || 0.25) * 32767), 44 + i * 2);
  }
  fs.writeFileSync(file, b);
}
let MEDIA = null;
function media() {
  if (MEDIA) return MEDIA;
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'hm-tests-'));
  wav(path.join(d, 'intro.wav'), 20, { freq: 220 });
  wav(path.join(d, 'vinyl.wav'), 18, { noise: true, amp: 0.1 });
  wav(path.join(d, 'rain.wav'), 5, { noise: true, amp: 0.25 });
  wav(path.join(d, 'loop.wav'), 5, { freq: 300 });
  const ff = (args, out) => { try { cp.execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args, out]); return fs.existsSync(out); } catch (e) { return false; } };
  const film = path.join(d, 'film43.webm'), pic = path.join(d, 'pic.jpg');
  MEDIA = {
    dir: d,
    intro: fs.readFileSync(path.join(d, 'intro.wav')),
    vinyl: fs.readFileSync(path.join(d, 'vinyl.wav')),
    rain: fs.readFileSync(path.join(d, 'rain.wav')),
    loop: fs.readFileSync(path.join(d, 'loop.wav')),
    film: ff(['-f', 'lavfi', '-i', 'testsrc=size=640x480:rate=10', '-t', '2', '-c:v', 'libvpx', '-b:v', '300k'], film) ? fs.readFileSync(film) : null,
    pic: ff(['-f', 'lavfi', '-i', 'testsrc=size=800x1000', '-frames:v', '1'], pic) ? fs.readFileSync(pic) : null,
  };
  return MEDIA;
}

/* ---------- leitor do YouTube simulado ---------- */
// dur: duracao fixa de cada video em segundos (0 = 150 a 449 s, conforme o id); load: ms ate tocar
function ytStub(dur, load) {
  return `
(function(){
  function L(o){ o.t=performance.now(); (window.__log=window.__log||[]).push(o); }
  function durFor(id){ if(${dur | 0}) return ${dur | 0}; var h=0; for(var i=0;i<id.length;i++){ h=(h*31+id.charCodeAt(i))>>>0; } return 150 + (h % 300); }
  var LOAD=${load | 0};
  window.__players={};
  function Player(el, opts){
    var self=this; this.el=el; this.opts=opts; this.st=-1; this.vid=null; this.t0=0; this.p0=0; this.vol=100; this.mu=false; this.endT=null; this.dur=0;
    window.__players[el]=this;
    setTimeout(function(){ opts.events && opts.events.onReady && opts.events.onReady({target:self}); }, 50);
  }
  Player.prototype._set=function(st){ this.st=st; L({ev:'state', el:this.el, st:st, vid:this.vid, cur:+this.getCurrentTime().toFixed(3), dur:this.dur, mu:this.mu, vol:this.vol}); var e=this.opts.events; if(e && e.onStateChange) e.onStateChange({data:st, target:this}); };
  Player.prototype._err=function(code){ L({ev:'err', el:this.el, vid:this.vid, code:code}); clearTimeout(this.endT); this._loadTok=(this._loadTok||0)+1; var e=this.opts.events; if(e && e.onError) e.onError({data:code, target:this}); };
  Player.prototype._play=function(){ var self=this; clearTimeout(this.endT); this.p0=performance.now(); this._set(1); var left=(this.dur-this.t0)*1000; this.endT=setTimeout(function(){ self.t0=self.dur; self._set(0); }, Math.max(0,left)); };
  Player.prototype._freeze=function(){ this.t0=this.getCurrentTime(); clearTimeout(this.endT); };
  Player.prototype.loadVideoById=function(a){
    var id=(typeof a==='string')?a:a.videoId, start=(typeof a==='object' && a.startSeconds)||0;
    var self=this; this._freeze(); this.vid=id; this.dur=durFor(id); this.t0=start; this._loadTok=(this._loadTok||0)+1; var tok=this._loadTok;
    L({ev:'load', el:this.el, vid:id, dur:this.dur, mu:this.mu, vol:this.vol});
    this._set(-1);
    setTimeout(function(){ if(tok!==self._loadTok) return; self._set(3); }, Math.round(LOAD*0.3));
    setTimeout(function(){ if(tok!==self._loadTok) return; self._play(); }, LOAD);
  };
  Player.prototype.cueVideoById=function(id){ this._freeze(); this.vid=id; this.dur=durFor(id); this.t0=0; this._set(5); };
  Player.prototype.playVideo=function(){ if(this.vid && this.st!==1 && this.st!==-1 && this.st!==3) this._play(); };
  Player.prototype.pauseVideo=function(){ if(this.st===1){ this._freeze(); this._set(2); } };
  Player.prototype.stopVideo=function(){ this._freeze(); this._loadTok=(this._loadTok||0)+1; this._set(5); };
  Player.prototype.seekTo=function(s){ var was=this.st; this._freeze(); this.t0=s; if(was===1) this._play(); };
  Player.prototype.getPlayerState=function(){ return this.st; };
  Player.prototype.getCurrentTime=function(){ if(this.st!==1) return this.t0; return Math.min(this.dur, this.t0+(performance.now()-this.p0)/1000); };
  Player.prototype.getDuration=function(){ return this.dur; };
  Player.prototype.setVolume=function(v){ if(v!==this.vol){ this.vol=v; L({ev:'vol', el:this.el, v:v, vid:this.vid, cur:+this.getCurrentTime().toFixed(3), dur:this.dur, st:this.st, mu:this.mu}); } };
  Player.prototype.getVolume=function(){ return this.vol; };
  Player.prototype.mute=function(){ if(!this.mu) L({ev:'mute', el:this.el, vid:this.vid}); this.mu=true; };
  Player.prototype.unMute=function(){ if(this.mu) L({ev:'unmute', el:this.el, vid:this.vid, st:this.st}); this.mu=false; };
  Player.prototype.isMuted=function(){ return this.mu; };
  Player.prototype.getVideoData=function(){ return {}; };
  Player.prototype.getIframe=function(){ return document.getElementById(this.el); };
  window.YT={ Player:Player, PlayerState:{ENDED:0,PLAYING:1,PAUSED:2,BUFFERING:3,CUED:5} };
  setTimeout(function(){ if(window.onYouTubeIframeAPIReady) window.onYouTubeIframeAPIReady(); }, 30);
})();`;
}

// regista cada fonte de som WebAudio iniciada (contexto, quando, quem a chamou)
const INIT = `
(function(){
  window.__log=window.__log||[];
  function L(o){ o.t=performance.now(); window.__log.push(o); }
  function names(){ var s=(new Error()).stack.split('\\n').slice(2,9).join(' | '); var r=[], re=/at (?:Object\\.)?([\\w$]+) \\(/g, m; while((m=re.exec(s))) r.push(m[1]); return r; }
  var n=0, Orig=window.AudioContext;
  window.AudioContext=function(o){ var c=new Orig(o); c.__id=n++; L({ev:'ctx', id:c.__id}); return c; };
  window.AudioContext.prototype=Orig.prototype;
  [AudioScheduledSourceNode, AudioBufferSourceNode].forEach(function(K){
    var st=K.prototype.start;
    K.prototype.start=function(when){
      var c=this.context, off=!(c instanceof Orig);
      var w=names(), bd=this.buffer ? this.buffer.duration : null;
      if(w.indexOf('needleAt')>=0) w.push(bd>0.9 ? 'needleDrop' : 'needleLift');
      if(!off) L({ev:'src', ctx:c.__id, when:(when||0), now:c.currentTime, kind:this.constructor.name, bd:bd, who:w});
      return st.apply(this, arguments);
    };
  });
})();`;

/* ---------- servir o repositorio e os substitutos ---------- */
const MIME = { html: 'text/html; charset=utf-8', js: 'application/javascript', css: 'text/css', json: 'application/json',
  png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', mp3: 'audio/mpeg', wav: 'audio/wav', txt: 'text/plain' };
const AIC = JSON.stringify({ data: [{ id: 1, title: 'Stand-in painting', artist_display: 'Stand-in Painter', date_display: '1884',
  image_id: 'abc', short_description: 'Stand-in description.', medium_display: 'Oil on canvas', credit_line: 'Test' }] });

// opt: { dur, load, page: (html)=>html, archive: 'ok'|'503'|'abort'|{delayMs}, freesound: 'ok'|'abort'|'local', aic: 'ok'|'fail' }
async function serve(ctx, opt = {}) {
  const M = media();
  const st = { tap: null };
  await ctx.route('**/*', async (route) => {
    const u = new URL(route.request().url());
    if (u.hostname === 'hm.test') {
      const f = path.join(ROOT, decodeURIComponent(u.pathname));
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || !fs.statSync(f).isFile()) return route.fulfill({ status: 404, body: '' });
      let body = fs.readFileSync(f);
      if (opt.page && f.endsWith('index.html')) body = opt.page(body.toString('utf8'));
      return route.fulfill({ status: 200, contentType: MIME[path.extname(f).slice(1)] || 'application/octet-stream', body });
    }
    if (u.hostname === '127.0.0.1') return route.continue();
    if (u.hostname === 'www.youtube.com' && u.pathname === '/iframe_api')
      return route.fulfill({ status: 200, contentType: 'application/javascript', body: ytStub(opt.dur || 0, opt.load || 1200) });
    if (u.hostname === 'archive.org' && u.pathname.includes('DPH011')) {
      const a = opt.archive || 'abort';
      if (a === 'abort') return route.abort('connectionrefused');
      if (a === '503') return route.fulfill({ status: 503, contentType: 'text/html', body: 'Service Unavailable' });
      if (a.delayMs) { while (st.tap === null) await new Promise(r => setTimeout(r, 50)); const w = st.tap + a.delayMs - Date.now(); if (w > 0) await new Promise(r => setTimeout(r, w)); }
      return route.fulfill({ status: 200, contentType: 'audio/wav', body: M.intro }).catch(() => {});
    }
    if (u.href.includes('Symphonie') || (u.hostname === 'archive.org' && /\.(mp4|webm)$/.test(u.pathname))) {
      return M.film ? route.fulfill({ status: 200, contentType: 'video/webm', body: M.film }) : route.abort();
    }
    if (u.hostname.endsWith('freesound.org')) {
      if ((opt.freesound || 'abort') === 'abort') return route.abort();
      return route.fulfill({ status: 200, contentType: 'audio/wav', body: u.pathname.includes('869851') ? M.rain : (u.pathname.includes('625771') ? M.vinyl : M.loop) });
    }
    if (u.hostname.endsWith('wikimedia.org')) return M.pic ? route.fulfill({ status: 200, contentType: 'image/jpeg', body: M.pic }) : route.abort();
    if (u.hostname === 'api.artic.edu' && u.pathname.includes('/iiif/')) return M.pic ? route.fulfill({ status: 200, contentType: 'image/jpeg', body: M.pic }) : route.abort();
    if (u.hostname === 'api.artic.edu') return opt.aic === 'fail' ? route.fulfill({ status: 503, body: 'down' }) : route.fulfill({ status: 200, contentType: 'application/json', body: AIC });
    return route.abort();
  });
  return st;
}

// servidor local SEM cabecalhos CORS (para o recurso da chuva); devolve { url, close }
function noCorsServer() {
  const M = media();
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'audio/wav' }); res.end(req.url.includes('869851') ? M.rain : M.loop); });
    s.listen(0, '127.0.0.1', () => resolve({ url: 'http://127.0.0.1:' + s.address().port, close: () => s.close() }));
  });
}

async function launch(extra = []) {
  return playwright().chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', ...extra] });
}

// abre a sala liquid e liga a emissao; devolve a pagina e utilitarios
// o: { mode:'desktop'|'mobile', qs, dur, load, init (script extra), beforeStart(page), e as opcoes do serve }
async function openLiquid(browser, o = {}) {
  const vp = o.mode === 'mobile'
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
    : { viewport: { width: 1440, height: 900 } };
  const ctx = await browser.newContext(vp);
  await serve(ctx, o);
  await ctx.addInitScript(INIT);
  if (o.init) await ctx.addInitScript(o.init);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://hm.test/liquid/index.html' + (o.qs || ''));
  await page.waitForTimeout(1200);
  if (o.beforeStart) await o.beforeStart(page);
  if (o.mode === 'mobile') await page.tap('#splash'); else await page.click('#splash');
  for (let i = 0; i < 120; i++) { await page.waitForTimeout(200); if (await page.evaluate(() => window.HM && HM.isOn())) break; }
  await page.evaluate(() => {
    window.__log.push({ ev: 'BEGIN', t: performance.now() });
    setInterval(function () { try { window.__log.push({ ev: 'lvl', t: performance.now(), m: HMFX.level(), s: HMSIDE.f }); } catch (e) { } }, 500);
  });
  const act = async (a) => page.evaluate((a) => {
    window.__log.push({ ev: 'ACTION', do: a, t: performance.now() });
    const st = HMENG.state();
    if (a === 'skip') HMENG.hardNext();
    else if (a === 'errActive') __players['yt' + st.active]._err(150);
    else if (a === 'focusOpen') document.getElementById('focusBtn').click();
    else if (a === 'focusClose') document.getElementById('fcExit').click();
    else if (a === 'mute') document.getElementById('muteBtn').click();
  }, a);
  return {
    page, ctx, errors, act,
    async run(secs, actions = []) {
      const todo = actions.slice().sort((a, b) => a.at - b.at); const t0 = Date.now();
      while ((Date.now() - t0) / 1000 < secs) {
        const el = (Date.now() - t0) / 1000;
        while (todo.length && todo[0].at <= el) await act(todo.shift().do);
        await page.waitForTimeout(100);
      }
    },
    log: () => page.evaluate(() => window.__log),
    close: () => ctx.close(),
  };
}

/* ---------- analise do registo (trocas de disco) ---------- */
function analyse(log) {
  const SKIPW = new Set(['_play', 'start', 'st', 'names', 'L']);
  const cls = (e) => {
    const w = e.who || [];
    if (w.includes('needleLift')) return 'lift';
    if (w.includes('needleDrop')) return 'drop';
    if (w.includes('after')) return 'timer';
    if (w.includes('crackle')) return 'crackle';
    return w.find(x => !SKIPW.has(x)) || '?';
  };
  const begin = (log.find(e => e.ev === 'BEGIN') || { t: 0 }).t;
  const inst = [], cur = {}, srcs = [];
  for (const e of log) {
    if (e.ev === 'load') { const I = { el: e.el, vid: e.vid, dur: e.dur, ev: [], cuts: [] }; inst.push(I); cur[e.el] = I; }
    if (e.el && cur[e.el]) cur[e.el].ev.push(e);
    if (e.ev === 'src') { e.c = cls(e); srcs.push(e); }
  }
  for (const I of inst) {
    let vol = null, mu = false, st = -1, audible = false;
    for (const e of I.ev) {
      if (e.ev === 'vol') vol = e.v;
      if (e.ev === 'mute') mu = true;
      if (e.ev === 'unmute') mu = false;
      if (e.ev === 'state') { st = e.st; if (e.st === 0) { I.endedT = e.t; I.endedCur = e.cur; } }
      const a = vol > 0 && !mu && st === 1;
      if (!a && audible && st !== 0 && e.ev !== 'load') I.cuts.push({ cur: e.cur, why: e.ev });
      if (a && I.firstAud == null) I.firstAud = e.t;
      audible = a;
    }
  }
  const lifts = srcs.filter(e => e.c === 'lift' && e.ctx === 0), drops = srcs.filter(e => e.c === 'drop' && e.ctx === 0);
  const rituals = [];
  for (const Lf of lifts) {
    const D = drops.find(d => d.t >= Lf.t);
    if (!D) { rituals.push({ liftT: Lf.t, drop: null }); continue; }
    const dropPerf = D.t / 1000 + (D.when - D.now);
    const rise = log.find(e => e.ev === 'vol' && e.v > 0 && e.t / 1000 >= dropPerf - 0.05 && e.t > D.t);
    const between = srcs.filter(e => e.ctx === 0 && e.t > Lf.t && e.t < D.t && !['lift', 'drop', 'timer', 'crackle'].includes(e.c));
    rituals.push({ liftT: Lf.t, gap: D.when - Lf.when, rise: rise ? rise.t / 1000 - dropPerf : null, kitSources: between.length });
  }
  return { begin, records: inst, rituals, srcs };
}

module.exports = { ROOT, playwright, suite, media, ytStub, INIT, serve, noCorsServer, launch, openLiquid, analyse };
