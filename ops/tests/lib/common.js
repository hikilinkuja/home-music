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
  for (const p of ['/opt/node22/lib/node_modules/playwright', '/usr/lib/node_modules/playwright', '/usr/local/lib/node_modules/playwright',
    '/opt/homebrew/lib/node_modules/playwright']) {
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
// dur: duracao fixa de cada video em segundos (0 = 150 a 449 s, conforme o id); load: ms ate tocar.
// Anuncios e leitores parados (t-ads.js): se a pagina definir window.__ytRule, cada loadVideoById
// pergunta-lhe { el, vid, n (cargas no total), nv (cargas deste video neste leitor), ne (cargas neste
// leitor) } e recebe { ad: segundos de anuncio, stuck: parado no zero, dur: duracao }. Anuncio como no
// ensaio de 2026-10-18: estado -1 com o tempo a avancar, nunca o 1; depois 3 e a musica do zero.
// Parado: estado -1 no zero, sem progresso, ate outra carga. Sem __ytRule, o leitor e o de sempre.
// restore: { vol, unmute, each } imita um YouTube que, quando a musica comeca (com each, tambem quando volta
// depois de um anuncio a meio), repoe um volume seu (por exemplo o que a pessoa usa no YouTube) e, com unmute,
// tira tambem o mudo; _restoreNow(vol) fa-lo a meio da musica, sem mudar de estado (t-side.js).
// async: { cmd, info, ev, poll, seekBuf } imita a API verdadeira (www-widgetapi.js lido e leitor medido a 2026-10-21,
// ops/notes/2026-10-21): as ordens (mute, unMute, setVolume, playVideo...) chegam ao leitor por postMessage, cmd ms
// depois; as leituras (getPlayerState, isMuted, getVolume, getCurrentTime) devolvem o playerInfo guardado, que so
// muda com as mensagens infoDelivery do leitor (info ms depois de cada ordem e a cada poll ms): logo a seguir a uma
// ordem, a leitura ainda da o valor antigo; loadVideoById e cueVideoById apagam o playerInfo (undefined ate a
// mensagem seguinte); numa mudanca de estado o playerInfo chega antes do onStateChange (ev ms depois); o unMute com
// o volume a 0 poe o volume em 5 (medido); seekTo com a musica a tocar passa seekBuf ms pelo estado 3. Sem async, o
// leitor e o de sempre (sincrono). window.__players guarda o leitor verdadeiro.
function ytStub(dur, load, async) {
  const A = async ? JSON.stringify(Object.assign({ cmd: 5, info: 5, ev: 10, poll: 500, seekBuf: 300 }, async)) : 'null';
  return `
(function(){
  var A=${A};
  function L(o){ o.t=performance.now(); (window.__log=window.__log||[]).push(o); }
  function durFor(id){ if(${dur | 0}) return ${dur | 0}; var h=0; for(var i=0;i<id.length;i++){ h=(h*31+id.charCodeAt(i))>>>0; } return 150 + (h % 300); }
  var LOAD=${load | 0}, NL=0, NLV={}, NLE={};
  window.__players={};
  function Player(el, opts){
    var self=this; this.el=el; this.opts=opts; this.st=-1; this.vid=null; this.t0=0; this.p0=0; this.vol=100; this.mu=false; this.endT=null; this.dur=0;
    this.inAd=false; this.adT0=0; this.stuck=false;
    window.__players[el]=this;
    setTimeout(function(){ opts.events && opts.events.onReady && opts.events.onReady({target:self}); }, 50);
  }
  Player.prototype._set=function(st){ this.st=st; L({ev:'state', el:this.el, st:st, vid:this.vid, cur:+this.getCurrentTime().toFixed(3), dur:this.dur, mu:this.mu, vol:this.vol, ad:this.inAd}); var e=this.opts.events; if(e && e.onStateChange) e.onStateChange({data:st, target:this}); };
  Player.prototype._err=function(code){ L({ev:'err', el:this.el, vid:this.vid, code:code}); clearTimeout(this.endT); this._loadTok=(this._loadTok||0)+1; this.inAd=false; this.stuck=false; var e=this.opts.events; if(e && e.onError) e.onError({data:code, target:this}); };
  Player.prototype._play=function(){ var self=this; clearTimeout(this.endT); this.p0=performance.now();
    if(this.rule && this.rule.restore && (!this.restored || this.rule.restore.each)){ this.restored=true; this.vol=this.rule.restore.vol; if(this.rule.restore.unmute) this.mu=false; L({ev:'restore', el:this.el, vid:this.vid, vol:this.vol, mu:this.mu}); }
    this._set(1); var left=(this.dur-this.t0)*1000; this.endT=setTimeout(function(){ self.t0=self.dur; self._set(0); }, Math.max(0,left)); };
  Player.prototype._freeze=function(){ if(this.inAd){ this.t0=0; } else { this.t0=this.getCurrentTime(); } clearTimeout(this.endT); };
  Player.prototype._cancel=function(){ if(this.inAd) L({ev:'adCut', el:this.el, vid:this.vid}); this.inAd=false; this.stuck=false; };
  Player.prototype.loadVideoById=function(a){
    var id=(typeof a==='string')?a:a.videoId, start=(typeof a==='object' && a.startSeconds)||0;
    var self=this; this._freeze(); this._cancel(); this.vid=id; this.t0=start; this._loadTok=(this._loadTok||0)+1; var tok=this._loadTok;
    var kv=this.el+'|'+id; NL++; NLV[kv]=(NLV[kv]||0)+1; NLE[this.el]=(NLE[this.el]||0)+1;
    var r=(window.__ytRule && window.__ytRule({ el:this.el, vid:id, n:NL, nv:NLV[kv], ne:NLE[this.el] })) || {};
    this.dur=r.dur || durFor(id); this.rule=r; this.restored=false;
    L({ev:'load', el:this.el, vid:id, dur:this.dur, mu:this.mu, vol:this.vol, n:NL, nv:NLV[kv], ne:NLE[this.el], ad:r.ad||0, stuck:!!r.stuck});
    this._set(-1);
    if(r.stuck){ this.stuck=true; return; }
    if(r.ad>0){
      setTimeout(function(){
        if(tok!==self._loadTok) return;
        self.inAd=true; self.adT0=performance.now();
        L({ev:'adStart', el:self.el, vid:id, mu:self.mu, vol:self.vol, secs:r.ad});
        setTimeout(function(){
          if(tok!==self._loadTok) return;
          self.inAd=false; self.t0=start;
          L({ev:'adEnd', el:self.el, vid:id, mu:self.mu});
          self._set(3);
          setTimeout(function(){ if(tok!==self._loadTok) return; self._play(); }, Math.round(LOAD*0.7));
        }, r.ad*1000);
      }, Math.round(LOAD*0.3));
      return;
    }
    setTimeout(function(){ if(tok!==self._loadTok) return; self._set(3); }, Math.round(LOAD*0.3));
    setTimeout(function(){ if(tok!==self._loadTok) return; self._play(); }, LOAD);
  };
  Player.prototype.cueVideoById=function(id){ this._freeze(); this._cancel(); this._loadTok=(this._loadTok||0)+1; this.vid=id; this.dur=durFor(id); this.t0=0; this._set(5); };
  /* anuncio a meio de um disco que ja toca (so para os testes): -1 com o tempo do anuncio a avancar,
     e depois a musica retoma onde ia */
  Player.prototype._midroll=function(secs){
    if(this.st!==1) return false;
    var self=this, tok=this._loadTok; this._freeze();
    this.inAd=true; this.adT0=performance.now();
    L({ev:'adStart', el:this.el, vid:this.vid, mu:this.mu, vol:this.vol, secs:secs, mid:true});
    this._set(-1);
    setTimeout(function(){
      if(tok!==self._loadTok) return;
      self.inAd=false; L({ev:'adEnd', el:self.el, vid:self.vid, mu:self.mu, mid:true});
      self._set(3);
      setTimeout(function(){ if(tok!==self._loadTok) return; self._play(); }, 300);
    }, secs*1000);
    return true;
  };
  /* o YouTube a repor um volume seu e a tirar o mudo a meio da musica, sem mudar de estado (t-side.js) */
  Player.prototype._restoreNow=function(vol){ this.vol=vol; this.mu=false; L({ev:'restore', el:this.el, vid:this.vid, vol:vol, mu:false}); };
  Player.prototype.playVideo=function(){ if(this.vid && this.st!==1 && this.st!==-1 && this.st!==3) this._play(); };
  Player.prototype.pauseVideo=function(){ if(this.st===1){ this._freeze(); this._set(2); } };
  Player.prototype.stopVideo=function(){ this._freeze(); this._cancel(); this._loadTok=(this._loadTok||0)+1; this._set(5); };
  Player.prototype.seekTo=function(s){ if(this.inAd || this.stuck){ L({ev:'seekIgnored', el:this.el, vid:this.vid, ad:this.inAd}); return; } var was=this.st; this._freeze(); this.t0=s; if(was===1) this._play(); };
  Player.prototype.getPlayerState=function(){ return this.st; };
  Player.prototype.getCurrentTime=function(){ if(this.inAd) return (performance.now()-this.adT0)/1000; if(this.st!==1) return this.t0; return Math.min(this.dur, this.t0+(performance.now()-this.p0)/1000); };
  Player.prototype.getDuration=function(){ return this.dur; };
  Player.prototype.setVolume=function(v){ if(v!==this.vol){ this.vol=v; L({ev:'vol', el:this.el, v:v, vid:this.vid, cur:+this.getCurrentTime().toFixed(3), dur:this.dur, st:this.st, mu:this.mu}); } };
  Player.prototype.getVolume=function(){ return this.vol; };
  Player.prototype.mute=function(){ if(!this.mu) L({ev:'mute', el:this.el, vid:this.vid, st:this.st, ad:this.inAd}); this.mu=true; };
  Player.prototype.unMute=function(){ if(this.mu) L({ev:'unmute', el:this.el, vid:this.vid, st:this.st, ad:this.inAd}); this.mu=false; };
  Player.prototype.isMuted=function(){ return this.mu; };
  Player.prototype.getVideoData=function(){ return {}; };
  Player.prototype.getIframe=function(){ return document.getElementById(this.el); };
  /* fachada assincrona: o que a pagina ve quando A existe */
  function Facade(el, opts){
    var self=this, ev=(opts && opts.events) || {};
    this.el=el; this.info={};
    var inner=new Player(el, { events:{
      onReady:function(){ self._deliver(); setTimeout(function(){ ev.onReady && ev.onReady({target:self}); }, A.ev); },
      onStateChange:function(e){ var st=e.data; self._deliver(); setTimeout(function(){ ev.onStateChange && ev.onStateChange({data:st, target:self}); }, A.ev); },
      onError:function(e){ var c=e.data; setTimeout(function(){ ev.onError && ev.onError({data:c, target:self}); }, A.ev); }
    } });
    this.inner=inner;
    setInterval(function(){ self._deliver(); }, A.poll);
  }
  Facade.prototype._deliver=function(){ var i=this.inner;
    this.info={ playerState:i.st, muted:i.mu, volume:i.vol, currentTime:i.getCurrentTime(), currentTimeLastUpdated_:Date.now()/1000, playbackRate:1, duration:i.dur }; };
  ['mute','unMute','setVolume','playVideo','pauseVideo','stopVideo','seekTo'].forEach(function(n){
    Facade.prototype[n]=function(){ var a=arguments, self=this; setTimeout(function(){
      var i=self.inner;
      if(n==='unMute' && i.mu && i.vol===0){ i.vol=5; L({ev:'restore', el:i.el, vid:i.vid, vol:5, mu:false, why:'unMute at 0'}); }
      if(n==='seekTo' && i.st===1 && A.seekBuf){ i._freeze(); i.t0=a[0]||0; i._set(3); var tok=i._loadTok; setTimeout(function(){ if(tok===i._loadTok && i.st===3) i._play(); }, A.seekBuf); }
      else i[n].apply(i, a);
      setTimeout(function(){ self._deliver(); }, A.info); }, A.cmd); return this; };
  });
  ['loadVideoById','cueVideoById'].forEach(function(n){
    Facade.prototype[n]=function(){ var a=arguments, self=this; this.info={}; setTimeout(function(){ self.inner[n].apply(self.inner, a); }, A.cmd); return this; };
  });
  Facade.prototype.getPlayerState=function(){ return this.info.playerState; };
  Facade.prototype.isMuted=function(){ return this.info.muted; };
  Facade.prototype.getVolume=function(){ return this.info.volume; };
  Facade.prototype.getDuration=function(){ return this.info.duration; };
  Facade.prototype.getCurrentTime=function(){ var h=this.info.currentTime; if(this.info.playerState===1){ var k=Date.now()/1000-this.info.currentTimeLastUpdated_; if(k>0) h+=Math.min(k,1); } return h; };
  Facade.prototype.getVideoData=function(){ return {}; };
  Facade.prototype.getIframe=function(){ return document.getElementById(this.el); };
  Facade.prototype._midroll=function(s){ return this.inner._midroll(s); };
  Facade.prototype._restoreNow=function(v){ return this.inner._restoreNow(v); };
  window.YT={ Player:(A ? Facade : Player), PlayerState:{ENDED:0,PLAYING:1,PAUSED:2,BUFFERING:3,CUED:5} };
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

// audio com pedidos parciais (Range), como o GitHub Pages, o freesound e o archive.org: sem eles o Chromium nao
// deixa saltar para um ponto do ficheiro (a agulha comeca aos 13 s do vinil)
function fulfillMedia(route, body, contentType) {
  const m = /bytes=(\d+)-(\d*)/.exec(route.request().headers()['range'] || '');
  if (!m) return route.fulfill({ status: 200, contentType, headers: { 'Accept-Ranges': 'bytes' }, body }).catch(() => {});
  const a = Math.min(+m[1], body.length - 1), b = m[2] ? Math.min(+m[2], body.length - 1) : body.length - 1;
  return route.fulfill({ status: 206, contentType, body: body.subarray(a, b + 1),
    headers: { 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${a}-${b}/${body.length}` } }).catch(() => {});
}

// opt: { dur, load, ytAsync (ver ytStub; HM_YT_ASYNC=1 no ambiente liga-o em todos os testes), page: (html)=>html, archive: 'ok'|'503'|'abort'|{delayMs}, freesound: 'ok'|'abort'|'local', aic: 'ok'|'fail',
//        sfx: 'abort'|'404'|'ok'|'real' (copias da abertura e da agulha em sfx/; por omissao falham, como o archive.org,
//        para a abertura nao atrasar os outros testes; 'real' serve os ficheiros do repositorio) }
async function serve(ctx, opt = {}) {
  const M = media();
  const st = { tap: null };
  await ctx.route('**/*', async (route) => {
    const u = new URL(route.request().url());
    if (u.hostname === 'hm.test' && /^\/sfx\/(intro-sound-killah|vinyl-625771)\.mp3$/.test(u.pathname) && opt.sfx !== 'real') {
      const s = opt.sfx || 'abort';
      if (s === 'abort') return route.abort('connectionrefused');
      if (s === '404') return route.fulfill({ status: 404, body: '' });
      return fulfillMedia(route, u.pathname.includes('vinyl') ? M.vinyl : M.intro, 'audio/wav');
    }
    if (u.hostname === 'hm.test') {
      const f = path.join(ROOT, decodeURIComponent(u.pathname));
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || !fs.statSync(f).isFile()) return route.fulfill({ status: 404, body: '' });
      let body = fs.readFileSync(f);
      if (opt.page && f.endsWith('index.html')) body = opt.page(body.toString('utf8'));
      if (/\.(mp3|wav)$/.test(f)) return fulfillMedia(route, body, MIME[path.extname(f).slice(1)]);
      return route.fulfill({ status: 200, contentType: MIME[path.extname(f).slice(1)] || 'application/octet-stream', body });
    }
    if (u.hostname === '127.0.0.1') return route.continue();
    if (u.hostname === 'www.youtube.com' && u.pathname === '/iframe_api')
      return route.fulfill({ status: 200, contentType: 'application/javascript', body: ytStub(opt.dur || 0, opt.load || 1200, opt.ytAsync || (process.env.HM_YT_ASYNC ? {} : null)) });
    if (u.hostname === 'archive.org' && u.pathname.includes('DPH011')) {
      const a = opt.archive || 'abort';
      if (a === 'abort') return route.abort('connectionrefused');
      if (a === '503') return route.fulfill({ status: 503, contentType: 'text/html', body: 'Service Unavailable' });
      if (a.delayMs) { while (st.tap === null) await new Promise(r => setTimeout(r, 50)); const w = st.tap + a.delayMs - Date.now(); if (w > 0) await new Promise(r => setTimeout(r, w)); }
      return fulfillMedia(route, M.intro, 'audio/wav');
    }
    if (u.href.includes('Symphonie') || (u.hostname === 'archive.org' && /\.(mp4|webm)$/.test(u.pathname))) {
      return M.film ? route.fulfill({ status: 200, contentType: 'video/webm', body: M.film }) : route.abort();
    }
    if (u.hostname.endsWith('freesound.org')) {
      if ((opt.freesound || 'abort') === 'abort') return route.abort();
      if (u.pathname.includes('625771')) return fulfillMedia(route, M.vinyl, 'audio/wav');
      return route.fulfill({ status: 200, contentType: 'audio/wav', body: u.pathname.includes('869851') ? M.rain : M.loop });
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
