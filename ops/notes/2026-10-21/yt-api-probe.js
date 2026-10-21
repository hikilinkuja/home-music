// Sonda no leitor VERDADEIRO do YouTube (sem video: da nuvem o googlevideo.com esta bloqueado e os videos do
// catalogo dao erro 150; o estado do leitor responde na mesma). Mede: (1) quanto tempo as leituras da API
// (getVolume, isMuted) levam a refletir uma ordem (setVolume, mute, unMute); (2) o que o unMute faz a um
// volume 0; (3) se, dentro do onStateChange, o getPlayerState() ja da o estado novo; (4) o que as leituras dao
// logo a seguir a loadVideoById. Resultados de 2026-10-21 no README desta pasta.
// Uso: node ops/notes/2026-10-21/yt-api-probe.js [videoId,...]   (precisa de acesso a www.youtube.com)
'use strict';
const path = require('path');
const T = require(path.join(__dirname, '..', '..', 'tests', 'lib', 'common.js'));
const VIDS = (process.argv[2] || 'jfKfPfyJRdk,RPblvnQ4b9k').split(',').filter(Boolean);
const PAGE = `<!doctype html><html><body><div id="p"></div><script>
window.R=[]; function L(o){ o.t=Math.round(performance.now()); R.push(o); }
function onYouTubeIframeAPIReady(){
  window.pl=new YT.Player('p',{ width:480, height:270, videoId:'${VIDS[0]}',
    playerVars:{ autoplay:0, controls:0, playsinline:1, origin:location.origin },
    events:{ onReady:function(){ window.READY=1; },
      onStateChange:function(e){ L({ev:'state', data:e.data, cached:pl.getPlayerState()}); },
      onError:function(e){ L({ev:'error', data:e.data}); } } });
}
window.measure=function(cmd, arg, read, want){ return new Promise(function(res){
  var t0=performance.now(); if(arg===undefined) pl[cmd](); else pl[cmd](arg);
  var imm=pl[read]();
  var h=setInterval(function(){ var v=pl[read](); if(v===want || performance.now()-t0>3000){ clearInterval(h); res({cmd:cmd, arg:arg, read:read, immediate:imm, after:v, ms:Math.round(performance.now()-t0)}); } }, 2);
}); };
</script><script src="https://www.youtube.com/iframe_api"></script></body></html>`;
(async () => {
  const browser = await T.playwright().chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext();
  await ctx.route('**/*', r => (new URL(r.request().url()).hostname === 'hm.test' ? r.fulfill({ status: 200, contentType: 'text/html', body: PAGE }) : r.continue()));
  const page = await ctx.newPage();
  await page.goto('http://hm.test/p.html');
  for (let i = 0; i < 60 && !(await page.evaluate(() => window.READY)); i++) await page.waitForTimeout(500);
  if (!(await page.evaluate(() => window.READY))) { console.log('o leitor nao ficou pronto (rede?)'); process.exit(1); }
  const seq = [['setVolume', 80, 'getVolume', 80], ['mute', undefined, 'isMuted', true], ['unMute', undefined, 'isMuted', false],
    ['setVolume', 0, 'getVolume', 0], ['mute', undefined, 'isMuted', true], ['unMute', undefined, 'isMuted', false]];
  for (const s of seq) { console.log(JSON.stringify(await page.evaluate(([c, a, r, w]) => measure(c, a, r, w), s))); await page.waitForTimeout(600); }
  console.log('unMute com o volume a 0 deixa:', JSON.stringify(await page.evaluate(() => ({ volume: pl.getVolume(), muted: pl.isMuted() }))));
  for (const v of VIDS) {
    await page.evaluate((v) => { L({ ev: 'cue', v }); pl.cueVideoById(v); }, v); await page.waitForTimeout(1500);
    await page.evaluate((v) => { L({ ev: 'load', v }); pl.loadVideoById(v); L({ ev: 'logo a seguir ao load', state: String(pl.getPlayerState()), muted: String(pl.isMuted()) }); }, v);
    await page.waitForTimeout(3000);
  }
  for (const x of await page.evaluate(() => R)) console.log(JSON.stringify(x));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
