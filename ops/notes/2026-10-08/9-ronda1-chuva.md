I changed only `liquid/l07-focus.html`. At fader 100 the rain is now twice the old maximum amplitude (+6 dB, measured) when the browser accepts the sample over CORS, and about 1.57 times (+3.9 dB, worked out but not measured) when it does not. `#fcExit` now has the `back` class. The full-copy build passes `validacao OK`, and none of the four Playwright runs had page errors.

**What changed in `liquid/l07-focus.html`**
- **Line 138:** `#fcExit` is now `class="tbtn fc-chrome back"`. The `.tbtn.back` CSS is already in l01 (lines 46-47, the other agent's work).
- **Lines 437-458, levels:** the comment block is rewritten and `DID` (key to fader id) is added.
  - `sndLvl` (line 454): crackle and fireplace stay at `0.9*x`, as before.
  - Rain uses `0.9*x*(1+x*x)`, a smooth curve that stays close to the old one at the bottom and doubles at the top: 0.24 at 25, 0.5625 at 50, 1.05 at 75, 1.8 at 100.
  - `LIM` (line 458) is the limiter setting: -1.5 dBFS threshold, 20:1 ratio, hard knee.
- **Line 468, `sndBus`:** builds DynamicsCompressor, then a trim GainNode, then the output. Chromium's compressor adds its own make-up gain to everything that passes through it: I measured +1.71 dB at a -3 dB threshold. The trim (computed as 0.9063 for -1.5 dB) cancels that, so anything below the threshold passes at unity and crackle and fireplace sound exactly as before.
- **Line 489, `sndWeb` (main path):** each of the three samples loads with `crossOrigin="anonymous"` and runs through MediaElementSource, its own GainNode, then the bus.
  - Fader changes glide via `setTargetAtTime` (about 50 ms).
  - If the element fires `error` (CORS refused), the handler disconnects it, unloads it, falls back to `sndPlain` and re-applies the fader.
  - The CORS failure is remembered for that sample until the page reloads, so reopening the room does not repeat the failed request.
- **Lines 484, 520-546, fallback:**
  - `sndPlain` reloads the sample without `crossOrigin` and controls level with `.volume`.
  - For rain it adds a second copy, `rn2`. `sndHalf` starts it half a loop ahead of the first.
  - `sndTo` starts playback inside the fader gesture.
  - `sndTick` ramps `.volume` (25 ms steps, about 60 ms time constant) and pauses any element that reaches 0.
- **Line 548, `sndApply`:** in the fallback, up to fader 50 only the first rain copy plays, on the normal curve. Above 50 the first rises from 0.5625 to 1.0 and the second fades in from 0 to 1.0.
- **Line 570:** each fader `input` now calls `rctx()` first, so the gesture resumes the AudioContext.
- **Line 572, `sndStop`:** stops the volume ramp and invalidates any CORS `error` that arrives late. Fallback elements are unloaded at once. Gain-node elements fade over about 30 ms and are unloaded and disconnected 200 ms later.
- **Line 588, `rctx`:** now resumes from any state except running or closed (this covers iOS "interrupted"), and catches the promise rejection.

**How I tested**
- I worked in a private copy at `scratchpad/work/focus/repo` (fresh full copy, `bash ops/tools/build.sh`).
- The test script is `work/focus/desk_test.js`, run as `node desk_test.js cors|nocors|noac|hot`. The stand-ins are 5 s loops at 0.25 amplitude (ck 300 Hz, rn 500 Hz, fp 700 Hz), plus a 0.9-amplitude rain for the limiter test.
- Chromium ran without the autoplay flag. Faders were moved with real key presses (End, Home, arrows); the YouTube player was stubbed.
- **Not tested the way the task says:** a WAV served through `page.route` without the CORS header still passed the CORS check. Playwright's fulfill appears to add that header itself. So the media came from a real local HTTP server on a second loopback origin (page on 127.0.0.1, media on localhost), with the freesound URLs rewritten in the test copy only.

Results:
- **cors:**
  - Each sample routes through its own GainNode into the compressor (threshold -1.5), then the trim (0.9063), then the output.
  - Rain gain is 1.8 at 100, 0.5625 at 50, 0.2943 at 30.
  - Output RMS was 0.3182 at 100, against 0.318 expected and an old maximum of 0.159, so twice the old level (+6.0 dB). It was 0.0994 at 50 and 0.0521 at 30, both matching the curve.
  - Crackle and fireplace gains were 0.9 at 100.
  - All faders at 0: output 0.
  - After `#fcExit`: everything paused with `src` removed, output 0.
  - Reopening and moving a fader works again.
  - The AudioContext was running.
- **nocors:**
  - Three CORS failures in the console, then the fallback.
  - At 100 both rain copies are at 1.0, offset by 2.44 to 2.54 s on the 5 s loop.
  - At 50 the first copy is at 0.5625 and the second is paused at 0; at 30 the first is at 0.2943.
  - Crackle and fireplace are at 0.9 at 100.
  - At 0, everything is paused at volume 0.
  - After closing, everything is paused and unloaded.
  - Reopening went straight to the fallback with no new CORS requests.
- **noac** (no AudioContext): the same fallback figures, no errors.
- **hot** (rain alone at 1.62 into the limiter): output peak 0.885. With all three at 100 (about +6.3 dBFS in), the peak over 1.5 s was 0.924 to 0.949. The same test with a -1 dB threshold went slightly over full scale (1.0005 to 1.0023), which is why I set -1.5.

**Not verified**
- Whether freesound's CDN actually sends a CORS header (I could not reach it), so I don't know which path real visitors get.
- The real rain file's peak level. If it is hot, the limiter will cut part of the +6 dB.
- iOS behaviour, including whether its gain-node routing works.
- The +3.9 dB of the fallback is calculated, not measured: the browser gives no access to that audio, and the sine stand-in is periodic, so it cannot show incoherence. Real rain is noise, so copies half a loop apart should add in power.

There is also an older quirk I left alone: after reopening the room, faders left above 0 stay silent until one is moved.