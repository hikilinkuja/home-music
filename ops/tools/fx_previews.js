// Grava em ficheiros os sons da troca de disco da sala liquid (agulha, kits do intervalo), a
// partir do proprio objeto FX da pagina montada, num OfflineAudioContext a 44,1 kHz e com o
// master ao volume 80, para o Paulo ouvir e escolher os kits por genero (tabela GAPKIT).
// Uso (depois de bash ops/tools/build.sh):
//   node ops/tools/fx_previews.js PASTA_DE_SAIDA
// Escreve WAV e, se houver ffmpeg, MP3 (192k). Nao guardar as amostras no repositorio: o codigo
// gera-as de novo quando for preciso.
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const T = require('../tests/lib/common');

const OUT = process.argv[2];
if (!OUT) { console.error('uso: node ops/tools/fx_previews.js PASTA_DE_SAIDA'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await T.launch();
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await T.serve(ctx, { dur: 300 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://hm.test/liquid/index.html');
  await page.waitForTimeout(1500);
  const res = await page.evaluate(async () => {
    /* apanhar o FX real sem mudar o codigo servido: o HMFX.render faz Object.create(FX) */
    let FX = null;
    const oc0 = Object.create;
    Object.create = function (p) { if (p && typeof p.needleAt === 'function') FX = p; return oc0.apply(this, arguments); };
    try { await HMFX.render('lift', 0.1); } finally { Object.create = oc0; }
    if (!FX) throw new Error('FX nao capturado');
    const SR = 44100, L = 1.0, GAP = 2.0, TO_MUSIC = 0.4;   /* GAP_S e DROP_TO_MUSIC_S do motor */
    function mk(secs) {
      const oc = new OfflineAudioContext(2, Math.ceil(secs * SR), SR);
      const R = Object.create(FX);
      R.ctx = oc; R._ck = null; R._ckT = null; R._bufs = {}; R._ckBuf = null;
      R.chain(oc); R.setVol(0.8);
      return { oc, R };
    }
    /* o disco seguinte: seno de 220 Hz a -20 dBFS, que abre em 250 ms como a musica */
    function pad(oc, t) {
      const o = oc.createOscillator(), g = oc.createGain();
      o.frequency.value = 220; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.1, t + 0.25);
      g.gain.setValueAtTime(0.1, t + 0.95); g.gain.linearRampToValueAtTime(0, t + 1.0);
      o.connect(g); g.connect(oc.destination); o.start(t); o.stop(t + 1.01);
    }
    function changeover(kit) {
      const { oc, R } = mk(L + GAP + TO_MUSIC + 2.0);
      R.needleAt('lift', L);
      if (kit && R.kit(kit, L + 0.42)) R.duckEcho(L + 1.5, L + 2.6);
      R.needleAt('drop', L + GAP);
      pad(oc, L + GAP + TO_MUSIC);
      return oc;
    }
    function enc(buf) {
      const nc = buf.numberOfChannels, n = buf.length, chs = [];
      for (let c = 0; c < nc; c++) chs.push(buf.getChannelData(c));
      let peak = 0;
      const ab = new ArrayBuffer(44 + n * nc * 4), v = new DataView(ab);
      const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
      w(0, 'RIFF'); v.setUint32(4, 36 + n * nc * 4, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true);
      v.setUint16(20, 3, true); v.setUint16(22, nc, true); v.setUint32(24, buf.sampleRate, true);
      v.setUint32(28, buf.sampleRate * nc * 4, true); v.setUint16(32, nc * 4, true); v.setUint16(34, 32, true);
      w(36, 'data'); v.setUint32(40, n * nc * 4, true);
      let o = 44;
      for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) { const x = chs[c][i]; if (Math.abs(x) > peak) peak = Math.abs(x); v.setFloat32(o, x, true); o += 4; }
      const u8 = new Uint8Array(ab); let s = '';
      for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
      return { b64: btoa(s), peakDb: 20 * Math.log10(peak || 1e-12) };
    }
    const out = {};
    const job = async (name, oc) => { out[name] = enc(await oc.startRendering()); };
    { const { oc, R } = mk(L + 1.5); R.needleAt('lift', L); await job('01-needle-lift', oc); }
    { const { oc, R } = mk(L + 2.1); R.needleAt('drop', L); await job('02-needle-drop', oc); }
    await job('03-changeover-plain', changeover(null));
    for (const k of HMFX.kits) await job('04-kit-' + k, changeover(k));
    return { out, kits: HMFX.kits, gap: HMFX.gap };
  });
  const ff = (() => { try { cp.execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch (e) { return false; } })();
  for (const [name, r] of Object.entries(res.out)) {
    const wav = path.join(OUT, name + '.wav');
    fs.writeFileSync(wav, Buffer.from(r.b64, 'base64'));
    if (ff) cp.execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '192k', path.join(OUT, name + '.mp3')]);
    console.log(name, 'pico', r.peakDb.toFixed(1), 'dBFS');
  }
  console.log('kits:', res.kits.join(' '), '| GAPKIT atual:', JSON.stringify(res.gap), errs.length ? '| erros: ' + errs.join(' | ') : '');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
