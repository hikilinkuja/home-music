Findings for the focus room's audio and the return buttons (verified vs inferred)

**How I checked.** I joined the eight liquid sources into a scratch page in the same order `ops/tools/build.sh` uses. I stubbed `YT.Player` and served `iframe_api` locally, so the player loads without YouTube. All other network requests were aborted. I ran Chromium with `--autoplay-policy=no-user-gesture-required` and logged every WebAudio source start (which context, node type, loop flag, whether `#focus.on` was set), the FX master gain value and every `HTMLMediaElement.volume` write. No repository files were changed. I could not download the freesound files: the proxy returned 403 for `cdn.freesound.org`. The web search tool was rate-limited, so the sample's level, length, licence and CORS headers are all unverified. The scratch scripts are listed at the end.

## 1. Rain on the window

**Where it comes from.** It is a recorded sample, not synthesis: `SMP.rn = "https://cdn.freesound.org/previews/869/869851_19205925-hq.mp3"` at `liquid/l07-focus.html:438-442`. Commit dd01a25 calls the three desk samples CC0; I could not check that.

**Gain chain:**
- `sndInit` (l07:444-453) runs on the first `input` event of any of the three desk faders (l07:463-465). It creates three `new Audio()` elements (looping, `preload=auto`, volume 0) and starts all of them at once.
- `sndApply` (l07:457) sets `snd.els.rn.volume = fcRn.value/100 * .9`.
- There is no WebAudio, no shared bus and no limiter. Each element's output goes straight into the browser mixer.
- `sndStop` (l07:466-470) pauses everything when the room closes (l07:613).

**Fader.** `#fcRn` at l07:121-122 runs 0 to 100, step 1, default 0. The taper is linear in amplitude: 50 is about -6.9 dB and 75 is about -3.4 dB relative to the file. At 100 the gain is 0.9, which is -0.92 dB relative to the file.
- Verified: fader at 100 writes `volume = 0.9`.
- Verified: `audio.volume = 1.35` throws `IndexSizeError`.
- So `.volume` can add at most +0.92 dB (x1.11). Any "50% louder" needs a WebAudio GainNode above 1, or a louder file.

**What sums on the same output:**
- crackle and fireplace elements (0.9 each at most);
- the room player `#fcTune` YouTube iframe (`fcVol` up to 100, x0.35 during breaks; l07:302-309, 360-363);
- the zen-gate YouTube player (up to 34, l07:212-231);
- the end rings, on their own AudioContext straight to `destination` (l07:473-539);
- the engine FX bus at gain 0.7, which leaks into focus (section 2);
- the hidden radio, YouTube at 0.

No liquid source contains a `DynamicsCompressor` (grep). Inference: Chrome adds these streams together and hard-clips at full scale. Whether +3.5 dB or +6 dB clips depends on the file's peak level, which I could not measure.

**How to read "50% louder".**
- Amplitude x1.5 is +3.52 dB, which is heard as only about 28% louder (perceived loudness doubles every +10 dB).
- Heard as 50% louder is +5.85 dB, about amplitude x2.
- +10 dB is heard as twice as loud.
- Recommendation: aim for +6 dB, i.e. a maximum linear gain of 1.8 against the file instead of 0.9, with a limiter on the desk bus. +10 dB is only safe with the limiter and a measured file, and at that level the rain starts to mask the music.

**Proposed change, option A (recommended).** Host the rain file in the repository and route it through WebAudio. Same origin means no CORS problem. A cross-origin `createMediaElementSource` without an `Access-Control-Allow-Origin` header plays silence, and setting `crossOrigin` without the header stops the file loading at all; freesound's CORS behaviour is unverified. GainNodes also work on iOS, where `.volume` cannot be set. Replace l07:437-470 with:

```js
var SMP={ ck:"https://cdn.freesound.org/previews/719/719879_7597896-hq.mp3",
  rn:"../sfx/focus-rain.mp3", /* copia da casa do freesound 869851 (CC0) */
  fp:"https://cdn.freesound.org/previews/484/484338_5902878-hq.mp3" };
var DMAX={ ck:.9, rn:1.8, fp:.9 };  /* chuva: +6 dB sobre o maximo antigo (0,9) */
var DID={ ck:"fcCk", rn:"fcRn", fp:"fcFp" };
var snd={ els:null, g:null, bus:null, rctx:null };
function sndInit(){
  if(snd.els) return;
  snd.els={}; snd.g={};
  var ac=rctx();
  if(ac && !snd.bus){
    var lim=ac.createDynamicsCompressor();
    lim.threshold.value=-3; lim.knee.value=0; lim.ratio.value=20; lim.attack.value=.002; lim.release.value=.2;
    lim.connect(ac.destination); snd.bus=lim;
  }
  Object.keys(SMP).forEach(function(k){
    var a=new Audio(); a.loop=true; a.preload="auto"; a.src=SMP[k];
    if(ac && SMP[k].indexOf("http")!==0){
      try{ var g=ac.createGain(); g.gain.value=0; ac.createMediaElementSource(a).connect(g); g.connect(snd.bus); snd.g[k]=g; }catch(e){ a.volume=0; }
    } else { a.volume=0; }
    snd.els[k]=a;
    var p=a.play(); if(p&&p.catch)p.catch(function(){});
  });
  sndApply();
}
function sndApply(){
  if(!snd.els) return;
  Object.keys(DID).forEach(function(k){
    var lin=$(DID[k]).value/100*DMAX[k];
    if(snd.g[k]) snd.g[k].gain.setTargetAtTime(lin, snd.rctx.currentTime, .04);
    else snd.els[k].volume=Math.min(1, lin);
  });
  $("fcVCk").textContent=$("fcCk").value; $("fcVRn").textContent=$("fcRn").value; $("fcVFp").textContent=$("fcFp").value;
}
function sndStop(){
  if(!snd.els) return;
  Object.keys(snd.els).forEach(function(k){ try{ snd.els[k].pause(); }catch(e){} });
  Object.keys(snd.g||{}).forEach(function(k){ try{ snd.g[k].disconnect(); }catch(e){} });
  snd.els=null; snd.g=null;
}
```

The path `../sfx/` resolves to `/home-music/sfx/`, the same pattern `l06:702` already uses for `dawn-mc.mp3`. Before shipping, download the file and run `ffmpeg -hide_banner -i focus-rain.mp3 -af volumedetect -f null -`. If `max_volume` is -7 dB or lower, +6 dB is clean even without the limiter.

**Option B (smallest change).** Commit a pre-gained file and change only the URL on l07:440, keeping the `.9` factor:

```
ffmpeg -i in.mp3 -af "volume=6dB,alimiter=limit=0.891:level=false" -c:a libmp3lame -b:a 160k sfx/focus-rain.mp3
```

This does not fix iOS.

**iOS (inferred from Apple's documented behaviour, not tested).** iOS ignores `HTMLMediaElement.volume`. Touching any desk fader once would start all three loops at full level, including the vinyl crackle sample, and the faders would do nothing. Option A fixes this for every file that is hosted in the repository.

## 2. Vinyl sound from the main radio while focus is open

**Mechanism (verified).**
- `focusOpen` (l07:592) calls `HM.sideKey("focus", true, 2600)`, which is `sideFade` from transformation 7 (build-liquid.py:201-216, 223-225; generated at l05:1063-1077 and l05:1372).
- `sideFade` only scales the radio's YouTube volume, through `applyVol` (transformations 6 and 7, build-liquid.py:131-134 and 219-222; l05:464-470).
- The FX WebAudio master is never touched. Its gain is 0.7 (`radio/e05-engine.html:22`, `setVol` at e05:34).
- The hidden radio keeps running: the watchdog starts a crossfade 24 s before each track ends (e05:684, `XFADE_LEAD` at e05:11), and natural ends go through `hardNext("ended")`.
- In the probe: radio YouTube volume went to 0, `HMSIDE.f` went to 0, and FX master stayed at 0.70.

**Probe timeline, crossfade started with the focus room open.** Everything ran on the FX context with `focus` true:
- t0: kick and rim;
- +0.49 s: bubble;
- +1.1 s: sub;
- +1.9 s: needleDrop (thump, 0.05 s click, 2.2 s groove hiss), the looping 2 s crackle buffer, and a rim;
- +2.6 s: phone tones.

**Probe timeline, natural end with the focus room open:** needleLift plus crackle loop immediately, then needleDrop plus crackle loop 3.3 s later (2.6 s swap plus 0.7 s `RIG.quick`).

**Every source, and whether it fires during focus:**
- **`FX.needleDrop`** (e05:133-165): yes, verified. Called through `HMFX.needle` (e05:1484-1487, l05:1440-1443), from `RIG.prepare` 1.9 s into each crossfade (`liquid/l04-vj.html:12`) and from `RIG.quick` 0.7 s after an ended-swap (l04:18). The safety-net timers at l05:573 and l05:660 only fire while a ramp is still pending.
- **`FX.crackleBurst` / `FX.crackle`** (e05:245-251, e05:229-244; 2 s looped noise at gain 0.16): yes, verified. 2.4 s with every needle, 1.3 s with every lift.
- **`FX.needleLift`** (e05:253-270): yes, verified. Through `HMFX.lift` (l05:1444-1447), from `hardNext("ended")` (e05:572, l05:650).
- **`FX.transitionFx`** (e05:271-277; dub percussion, not vinyl): yes, verified. Called at e05:603 (touch devices) and e05:639 (l05:681/717).
- **`FX.horn`** on programme change (l05:785, inside the block changed by transformation 8): inferred yes, same master. Not exercised.
- **`HMDAWN.play`** (`l06:647-720`, own AudioContext to `destination`), called from l05:779 (transformation 8, build-liquid.py:360-371): inferred yes, at 06:00. It is not gated by the FX master.
- **`VINYL_SRC`** (l06:30, l06:46): no. It only plays inside `sequenceIntoRadio` (l06:31-70), once per page load, guarded by `intro.done`.
- **l04 `HMFX` calls:** lines 12 and 18 are the radio's needle, covered above. `RIG.first` (l04:19-23) only calls `HM.rampOnly` and makes no sound.
- **Focus desk crackle `fcCk`** (l07:119-120, 439, 456): silent at 0 on desktop and Android (verified volume 0, although the element is playing). Full level on iOS as soon as any fader is touched (inferred, see section 1).
- **Pomodoro end rings** "spinback" (l07:511-517) and "tape stop" (l07:530-538): vinyl-like, but only if chosen in `#fcRing` (l07:96-101; fired at l07:387).
- **Room-player content:** `DEEP` (l07:148) includes `lofi` and `lofi_house`. Inferred: many of those recordings have crackle mixed in.
- **Edge case:** `focusOpen` does not pause a playing mixtape or SoundCloud tape. Their own foley would keep sounding (l05:1092, 1097, 1116, 1183).

**Dead code (verified).** l07 never sets `window.HMFOCUS.on`; it stayed false in the probe. So the valve filter, the `fdk` duck and `skipIfBlocked` from transformation 6 (build-liquid.py:120-134, 141, 226-231; l05:381-382, 412, 467, 1373-1378) do nothing. The only ducking in focus is `fcp.duck` on the room's own player (l07:360-363).

**Side finding (verified).** `FX.setVol(masterVol/100)` at e05:821 runs before `FX.init()` at e05:1463, so it does nothing. The foley stays at 0.7 regardless of the saved volume until someone moves the slider. The probe showed 0.7 with `masterVol` at 80.

**Fix: gate the FX master, in build-liquid.py only.** I verified this in a scratch build: FX master went to 0 on open and back to 0.56 on close, with no page errors. Tapes are excluded on purpose because they trigger their own needle.

(a) In transformation 7, change the start of `new_sf` (build-liquid.py:201-203) to:

```js
window.HMSIDE={ f:1, src:{}, h:null, fx:1 };
function sideFade(key, on, ms){
  HMSIDE.src[key]=!!on;
  /* a foley da emissao (agulha, crepitar, kit dub, corneta) cala-se enquanto a radio
     esta de lado no foco ou na arcada; as tapes trazem a sua propria agulha */
  var fxT=(HMSIDE.src.focus || HMSIDE.src.arcade) ? 0 : 1;
  if(fxT!==HMSIDE.fx){ HMSIDE.fx=fxT; try{ FX.setVol(masterVol/100, fxT ? (ms||700)/1000 : 0.25); }catch(e){} }
```

The gate has to come before the early return on line 206.

(b) Add a new transformation, for example 7b, placed before `# 8)`:

```python
old_fv="  setVol: function(v){ if(this.master) this.master.gain.value = 0.7 * v; },"
new_fv="""  setVol: function(v, ramp){
    if(!this.master) return;
    var sf=(window.HMSIDE && HMSIDE.fx!=null) ? HMSIDE.fx : 1;
    var g=this.master.gain, to=0.7 * v * sf;
    if(ramp && this.ctx){ var t=this.ctx.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(to, t+ramp); }
    else { if(this.ctx){ g.cancelScheduledValues(this.ctx.currentTime); } g.value = to; }
  },"""
assert s.count(old_fv)==1
s=s.replace(old_fv,new_fv)
```

(c) Dawn uses its own context, so gate it directly. In `l06:695`, make this the first line of `play()`:

```js
if(window.HMSIDE && HMSIDE.fx===0) return;
```

Gating `HMFX.needle` by an early return instead would be wrong. It also calls `rampInFirst`, so the next track would stay at fade 0 and the radio would be silent after leaving focus.

**iOS note for the hidden radio (inferred).** The project's own comment says YouTube `setVolume` is ignored on iOS (build-liquid.py:68-70). If that holds, the side fade does not silence the broadcast on iPhone at all. Possible fix in `sideFade`'s `animClock` done callback, on touch devices (`SIMPLE`):

```js
p.yt.mute()   /* when the target is 0 */
if(!muted) p.yt.unMute()   /* when the target is back to 1 */
```

`audioGuard` (l05:1381-1418) can call `unMute` during its first roughly 12 s.

## 3. Return buttons

**`#waBack`, "Back to the radio"** (`liquid/l02-body.html:31`), `class="tbtn"`.
- It sits in `#waCap .row` (l02:27-32) next to `#waWingBtn` "Daily canvas" (l02:28; its label changes at l06:444), `#waFichaBtn` (l02:29) and `#waFsBtn` (l02:30).
- CSS: `.tbtn` at `l01-head.html:37-41`, `.tbtn:hover` at l01:42, `.tbtn.on` at l01:43, the phone `.tbtn` size rule at l01:146-147, `#waCap` at l01:321-322, `#waCap .row` at l01:326, `:focus-visible` amber outline at l01:17.
- Handler l06:441 calls `wartClose` (l06:297-304). Esc and "w" also close the room (l06:465-466).
- Measured: desktop 146x26 px at (329,846), phone 154x42 px wrapped onto the second row. The border is the same `rgb(43,39,69) 1px` as its three neighbours, with no shadow or outline.

**`#fcExit`, "Back to the full room"** (l07:138), `class="tbtn fc-chrome"`.
- CSS: position only at l07:63. It fades out with the idle chrome after 5 s while "hide this column" is ticked (l07:15-17, 252-259).
- Handler l07:617 calls `focusClose` (l07:603-615). In the focus room Esc only breaks the seal (l07:579-584).

**Close buttons marked "×", not labelled "back":**
- `#arcClose` (l08:74, CSS l08:7-8);
- `.pclose` (l02:109, 126, 138, 152, and `#mixClose` at l02:161; CSS l01:107-108);
- `#wartFichaClose` (l02:35, CSS l01:338-339);
- `#skClose` (l02:201, CSS l01:252).

`#fcGateSkip` (l07:74) and `#skipIntro` (l02:11) are skips, not returns.

**Proposed change.** Add `back` to the class list on l02:31 and l07:138, then add after l01:43:

```css
/* regresso a radio: debrum vermelho, distinto dos outros botoes */
.tbtn.back{border-color:var(--red); box-shadow:0 0 0 1px var(--red); color:var(--paper)}
.tbtn.back:hover{color:var(--paper); border-color:var(--red); box-shadow:0 0 0 2px var(--red); background:rgba(232,57,44,.18)}
```

`--red` is `#e8392c` (l01:9). I used `box-shadow` rather than `outline` so the amber keyboard-focus outline (l01:17) still shows. `.tbtn.back:hover` outranks `.tbtn:hover`, so hovering no longer turns the border amber. Neither the phone size rule nor `#fcExit`'s own rule conflicts.

## Scratch files
Everything is in `scratchpad/understand/`:
- `focus_probe.js`: the leak probe against the current build;
- `focus_probe_fix.js` and `fixtest/liquid/l05-engine.html`: the patched engine and its probe;
- `patch_build.py` and `fixtest/build-liquid-fix.py`: the build-script patch;
- `btn_probe.js`: the button measurements;
- `liquid-probe.html` and `liquid-fix.html`: the assembled test pages.