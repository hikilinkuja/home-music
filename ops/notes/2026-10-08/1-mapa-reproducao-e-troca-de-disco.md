The track ends early because of one fixed constant. The engine starts every changeover 24 s before the end of the record (`XFADE_LEAD = 24`, `radio/e05-engine.html:11`, used at `:684`). That lead was sized for the classic room's 11 s vinyl rite, but the liquid room's rite takes only 3.1 s. In simulation, every record lost its last 14.1 to 14.6 s on desktop and was cut abruptly about 19.3 s early on touch devices.

**Method.** I read the source files and their line numbers, and checked that running `liquid/build-liquid.py` on `e05` reproduces `liquid/l05-engine.html` byte for byte. Runtime claims come from a Playwright harness: a fake `window.YT` (default load time 1.2 s), a fake clock, and logging of every `setVolume`, load, stop and WebAudio source creation. The harness is `scratchpad/understand/lifecycle/lc_harness.js` (analyser: `lc_analyze.js`, same folder). Another agent shares the parent scratch folder and overwrote my first `harness.js`, so the private copy lives in `lifecycle/`. "Verified" means read in code and reproduced in the harness. "Inferred" means a platform behaviour I could not test here (iOS, the real YouTube player).

None of the build-liquid.py transformations touch the watchdog, `startTransition`, `onState`, the `"ended"` branch or the FX object. They are inherited unchanged from `e05`; the one exception is step 4b, which swaps `nextTrack` for `pullTrack` inside `hardNext` and `startTransition`. The `l05` lines are given in brackets.

## 1. Track lifecycle (liquid, normal radio mode)

**Boot**
- autoStart (build-liquid.py step 2, lines 24-32; `l05:1345`) runs `FX.init`, `buildQueue`, `pendingFirst=pullTrack()` and `setNow(pendingFirst,false)`. Step 8 adds `rotMark` to `setNow`, so the first track is marked as played already at page load. It then calls `loadApi` (`e05:439`, 9 s timer to `apiFail`) and `maybeStart`.
- `onYouTubeIframeAPIReady` (`e05:417`) creates deck A, and deck B only when not `SIMPLE`. `SIMPLE` is `pointer:coarse` (`e05:10`), so every touch device runs on a single player.
- A's `onReady` calls `maybeStart` (`e05:468`): mute, then `ensureLoaded` (`e05:421`), which is `loadVideoById`. The first record autoplays muted under the intro, and `HM.prime` (step 2) keeps it playing muted.

**First record**
- The splash tap (`l06:84-110`) plays Sound Killah until 28.5 s, fades for 2.6 s, waits 1 s, then plays the vinyl sample from 13 s.
- At vinyl t≥15 s (or on error, or a 2.5 s timeout; `l06:55-58`) `HM.begin()` calls `beginRadio` (`e05:475` [`l05:552`]): unMute, `fadeVol(p,0)`, `seekTo(0)`, `playVideo`, then `RIG.first`. `RIG.first` is in `l04:19-23` and calls `HM.rampOnly` after 150 ms.
- `setTimeout(checkAudible,6000)` follows, plus `audioGuard()` (step 6, build-liquid.py:135-181 [`l05:1382`], 3 s interval).
- **Bug (verified):** `HM.rampOnly` (build-liquid.py:49-53 [`l05:1418-1422`]) sets `firstRampPending=false` before calling `rampInFirst()`. But `rampInFirst` returns at once when the flag is false (`e05:1476`). So no ramp ever runs, and the 9.5 s safety (`e05:496`) is also inert.
- What actually happens: the first `audioGuard` tick about 3 s after begin finds fade 0 and calls `fadeVol(p,1)` (build-liquid.py:169). Harness: volume 0 at begin, then 80 three seconds later in a single step. Paulo hears the music jump in at full volume about 1 s after the vinyl sample has faded, not a 2 s rise. This has been present since 56b56a2 (v2.3).

**End detection**
- The watchdog runs every 600 ms (`e05:675-686` [`l05:753-764`]) and skips if `!radioOn` or `transitioning`.
- When state is 1, it tracks progress and checks for a stall: time frozen for more than 14 s calls `hardNext("stalled")` (`e05:682`). It also checks `if(dur>40 && dur-cur<=24) startTransition()` (`e05:684`). For any record longer than 40 s, "the end" is therefore defined as dur minus 24 s.
- YouTube ENDED (state 0) goes to `onState` (`e05:535` [`l05:613`]), then `hardNext("ended")`, but only if the deck is active and not transitioning. That only happens for records of 40 s or less, or after a failure. Of the 519 imports in `ops/queue/ishkur-imported-2026-10-04.tsv`, none is 40 s or shorter (minimum 121 s, median 347 s). The ENDED path is effectively dead in normal play.

**Next pull**
- `pullTrack` (step 4b, build-liquid.py:85-86) takes from the dev queue `devQ` first, otherwise `nextTrack` (`e05:358`, modified by step 6 and step 8 lines 330-358).
- `nextTrack` re-picks the genre when needed: `forceGenre` (the dawn override), else `pickGenre(currentGenre||bridgeG)` (`e05:337`). `pickGenre` takes the nearest-BPM `ADJ` neighbour, and the second nearest 28% of the time; otherwise the nearest-BPM genre in the block; otherwise a random genre weighted by unplayed tracks (step 8, 318-326).
- `runLeft=runFor(g)` sets the run length: 3 to 5 tracks, capped at ceil(n/2) for small crates.
- `poolFor` puts never-played tracks first (shuffled), then the oldest-played. A long-intro opener (`op:1`) goes to the front after a bridge. The pick avoids repeating `current`.
- The pull happens at dur minus 24 s, so the genre run advances before the record is on air. `setNow` (the card plus `rotMark`) happens at x≥0.45 of the ramp on desktop (`e05:656-661`), or at the cut on touch devices.

**Changeover** (`startTransition`, `e05:593-672` [`l05:671-750`])
- **Desktop:** load the incoming record on the idle deck at fade 0 and unMute, then call `FX.transitionFx()` and `RIG.prepare`. In `l04:11-14`, `prepare` fires `HMFX.needle()` at +1.9 s and its callback at +3.1 s. `waitBoth` polls every 250 ms until the incoming is playing and the callback has fired, with a 30 s timeout that calls `hardNext()`. Then `ramp()` runs a 6 s equal-power fade (cos for the outgoing, sin for the incoming; `e05:651-655`), and the outgoing deck gets `stopVideo` (`e05:663`).
- **Touch (`SIMPLE`):** the same FX, then `RIG.prepare`. The 3.1 s callback starts a 1.9 s rig clock, and at x≥0.5 `hardNextAudio(t)` loads the next record on the same player at fade 1 (`e05:617`). That is a hard cut with no fade.

## 2. Every path that can stop, fade, skip or replace a track early (most likely first)

1. **The fixed 24 s lead. Certain, deterministic, every record.**
   - The comment at `e05:11` says it covers a vinyl rite of about 11 s. In the classic room, `e04c-stage.html` fires the prepare callback at 11.0 s, so the loss there is about 7 s. In the liquid room the rite was replaced by `l04` (3.1 s), so the same lead roughly doubles the loss.
   - Outgoing silence starts at about 24 − max(3.1, load time) − 0.25 − 6 s before the end, with up to 0.6 s of watchdog jitter.
   - **Desktop, measured on 5 transitions:** the fade-out starts 20.0 to 20.5 s before the end. The record is silent and stopped 14.1 to 14.6 s before the end. With 6 s loads, it is silent 11.4 to 11.8 s before the end.
   - **Touch, measured on 5 transitions:** hard cut 19.3 to 19.4 s before the end, then silence while the next record buffers, then the next record at full volume.
   - **Loss by genre:** using median durations from the import tsv, 14.5 s is 3.5% of a record for ambient, dub techno and deep house; 4.1 to 5.0% for breakbeat, liquid, ragga jungle, uk garage and dubstep; and 8.1% for ska. The faded-or-lost share is 4.9 to 11.4%. Long outros (dub, dub techno, ambient) are hit hardest.
   - **The incoming record is also trimmed:** it plays silently for about 2.1 s before the ramp (rise logged at its 2.1 s mark), and reaches full volume only at about 7.4 s.
2. **Stall watchdog (`e05:682`).** If the player reports state 1 but its time is frozen for 14 s, the record is swapped immediately on the same deck at full volume, with a needle drop 0.7 s later from `RIG.quick` (`l04:18`). Reproduced (swap 14.4 s after the freeze). The real YouTube player normally reports state 3 when buffering, so this is unlikely but possible.
3. **Error on the active deck** (`e05:551-552`): `hardNext("error")` cuts hard. Codes 2 and 153 only show a message. Errors 101 and 150 almost always arrive at load time, so a mid-track cut is unlikely. Errors on the incoming deck during a changeover retry `startTransition` up to 4 times. After that, the watchdog keeps re-calling `startTransition` with no retry cap, so the FX bursts can repeat.
4. **Keyboard handlers.**
   - `e05:1204` guards only INPUT elements. Typing "m" in the gift textarea (`l02:143`) toggles mute (`e05:1213`); "f" toggles fullscreen; ArrowRight opens the skip challenge.
   - With `?dev`, "n" anywhere, including the textarea and city box (`l06:573-575`, no target check), calls `hardNext("dev")`.
   - The skip challenge (`skPass`, `e05:1168-1171`) plays a rim, then a rewind 0.65 s later, then `hardNext` 0.35 s after that: a user-initiated cut.
5. **30 s `waitBoth` timeout (`e05:645`).** If the incoming never reaches state 1, the outgoing ends at T0+24 s (ENDED is ignored while transitioning), about 6 s of silence follow, and then a different record plays. One possible trigger: `ensureLoaded` (`e05:423`) skips the load when `loadedId` equals the requested video on a deck that was stopped. This is rare and only theoretical with the current crate sizes.
6. **ENDED path with a suspended AudioContext.** `hardNext("ended")` sets `firstRampPending` and relies on `HMFX.needle` (`e05:1485`) to ramp. If `FX.ctx` is not running, that call only sets `_pendingNeedle`, and the 6 s safety does the same. The next record then stays at fade 0, silent until the following changeover. This needs a record of 40 s or less, or a fallback path. Low.
7. **Platform behaviour (inferred, not testable here).** On mobile, YouTube pauses embeds in the background, and the watchdog ignores state 2. iOS ignores `setVolume` (the build-liquid.py step 4 comment), so fades and side-fades are inert there. iOS may also pause the radio deck when another player starts: the focus room's zen and own-tune players, the arcade "drop the needle" game, or the mixtape shelf. Nothing resumes it afterwards.

**Ruled out (verified):**
- **Block changes** (`e05:694-704` plus build-liquid.py step 8, 360-371): they only set `bridgeG`, call `buildQueue`, show a toast and play `FX.horn`. Harness at 18:00 and at 06:00: the record on air continued and was cut only by the normal 24 s lead.
- **Dawn override:** riser and closer play over the current record, and the next pick is ambient.
- **`runFor` / crate-proportional genre switching:** affects selection only.
- **Focus room and arcade:** they side-fade the radio to 0 through `sideFade` (step 7) but never stop it. The radio keeps rotating unheard, so you come back to a different record.
- **`visibilitychange`:** the only handler, `l06:551-553`, re-acquires the wake lock.
- **Intro/outro trims:** the radio decks have no `startSeconds` or `endSeconds`.
- **The `HMFOCUS` valve (step 6), `skipIfBlocked`, `flushPeek`, `reVol`:** dead code. Nothing outside `l05` uses them, and `HMFOCUS.on` never becomes true.

## 3. Sound design of a normal changeover today, and the lift / 2 s / drop proposal

**Desktop timeline (verified).** T0 is the watchdog tick at dur minus 24 s.

| Time | Sound or event |
|---|---|
| T0+0.00 | `kick` and `rim` (wet) |
| T0+0.48 | `bubble`, two hits 0.17 s apart |
| T0+1.10 | `sub` |
| T0+1.90 | `rim` (wet), plus `needleDrop` and `crackleBurst(2.4)` (2.4 s, then a 0.6 s fade) from `RIG.prepare` calling `HMFX.needle` |
| T0+2.60 | `phone`, only 40% of the time (`e05:277`) |
| T0+3.35 | 6 s crossfade starts |
| T0+6.05 | card switches |
| T0+9.35 | outgoing deck stopped |

All of this sits on top of the outgoing record at full volume. There is never any silence between songs; the overlap is 6 s.

**Touch timeline (verified).** The same FX at the same offsets, then a hard switch at T0+4.1 to 4.2 s (`loadVideoById` on the same deck), silence for the buffering time, and the next record at full volume.

**ENDED path (`e05:569-584`), unused in practice:**
- ENDED: `needleLift` plus `crackleBurst(1.3)`.
- +2.6 s: load the next record at fade 0.
- +0.7 s (`RIG.quick`): `needleDrop` plus `crackleBurst(2.4)`, and a 2 s linear ramp driven by the clock, not by playback.
- In the harness, the music started 0.5 s after the drop, already about 25% into the ramp. Lift to drop is 3.3 s.

**How the needle sounds are synthesized.** Everything goes into `FX.master` (gain 0.7 × volume) and the shared echo (delay 0.36 s, feedback 0.52, lowpass 1.7 kHz, wet 0.9).
- **`needleLift`** (`e05:253-270`):
  - A sine 52 to 90 Hz, rising over 90 ms; gain peaks at 0.12 after 12 ms and decays by 130 ms.
  - A 40 ms white-noise click, high-passed at 1600 Hz, gain 0.14, at +50 ms.
  - Dry only. `HMFX.lift` (`e05:1488-1491`) then keeps a 1.3 s crackle going after the lift.
  - Judgement: an upward synth "blip" plus a click, followed by groove noise after the arm is supposedly up. That is the wrong way round: a real lift ends the groove noise, with a low pop going downward, then silence.
- **`needleDrop`** (`e05:133-165`):
  - A sine 82 to 48 Hz over 70 ms, peak 0.18, gone by 110 ms (the thud).
  - A 50 ms high-passed click at 1400 Hz, gain 0.2, at +30 ms, with a 0.5 send to the echo. The contact click therefore echoes 4 to 5 times, which is a dub effect, not a turntable.
  - 2.2 s of "settling" noise: white noise plus sparse ±1.6 impulses, bandpass 5.2 kHz Q 0.8, rising to 0.085 by 0.3 s, held to 1.2 s, gone by 2.2 s.
  - Plus `crackleBurst(2.4)`.
- **`crackle`** (`e05:229-243`): a 2 s looped buffer of dense impulses (probability 0.0018 per sample, about 80 per second at ±0.8) over a ±0.012 noise floor, gain 0.16, unfiltered. It is mono, bright, with an audible 2 s loop and no 33⅓ rpm periodicity or rumble.
- Overall it is a plausible sketch but stylized, not a real tonearm. The intro already uses a real CC0 recording (freesound 625771, seconds 13 to 17, `l06:28-30`). CC0 lift and drop samples hosted under `sfx/` and decoded with `decodeAudioData` into `FX.master` would match it. Paulo's offer of samples is worth taking: one lift with the run-out groove ending, one drop with about 1 s of lead-in groove.

**Proposal: build-liquid.py step 10** (new; each replacement asserted to occur exactly once).

- **a) Constants.** After the `FADE_DUR` line, add `GAP_MS=2000`, `DROP_TO_MUSIC_MS=400`, `PRE_LEAD=40`.
- **b) Watchdog.** Replace the `e05:684` line with `if(dur>40 && dur-cur<=PRE_LEAD){ preloadNext(); }`. Keep the stall check.
- **c) `onState`.** Replace `e05:535` with two rules:
  - When the preload deck reaches state 1 while loading: `pauseVideo(); seekTo(0,true)` and mark it ready. On `SIMPLE`, mark it ready without pausing (pausing is risky on iOS).
  - `if(st===0 && k===activeKey && !transitioning) endOfRecord();`
- **d) New functions**, inserted before `/* watchdog */`:
  - `PRE{k,t,phase}` and `REC{on,liftAt}`.
  - `armDeck(k,t)`: set `pendingTrack`, `fadeVol` 0, plus `yt.mute()` because iOS ignores `setVolume`. Set `loadedId=null` to defeat the `ensureLoaded` shortcut, then `ensureLoaded`.
  - `preloadNext()`: desktop only. Pull the next record into the idle deck about 40 s before the end. It must not set `transitioning`.
  - `endOfRecord()`: set `REC.on` and `transitioning=true` (this blocks the watchdog and `audioGuard`), play the lift, and if nothing is preloaded, pull now and `armDeck` (the same deck on `SIMPLE`).
  - `waitDrop()`: poll every 100 ms until `GAP_MS` has passed and the deck is ready. On a 25 s timeout, fall back to `hardNext("timeout")`.
  - `dropNow()`: play the drop; after `DROP_TO_MUSIC_MS`, `seekTo(0)`, `playVideo`, unMute unless the user has muted, and a 250 ms de-click ramp. Then `stopVideo` the old deck, swap `activeKey`, `rigDeck` and the live slot, call `RIG.setNext` and `setNow(t,true)`, clear `PRE`/`REC` and `transitioning`, and reset `lastT`/`lastStamp`.
  - This does not call `startTransition`, `transitionFx`, `RIG.prepare` or `RIG.quick`, because the `l04` hooks would fire a second needle.
- **e) `HMFX`.** Remove the crackle from `lift` (`e05:1490`). Add a `drop()` that plays `needleDrop` plus about 0.6 s of lead-in crackle and does not call `rampInFirst`. Optionally give `needleLift`/`needleDrop` an `at` offset so the drop can be scheduled exactly at lift + 2 s in AudioContext time; background-tab timers run at 1 Hz and could stretch the gap to about 3 s.
- **f) `onYtError`.** Replace the `transitioning && k!==activeKey` branch (`e05:548-551`): an error on `PRE.k` marks the video dead and re-arms (up to 4 tries), and the active-deck branch only runs when `!REC.on`.
- **g) `hardNext`.** Make the guard `if(swapPending||REC.on) return;`. Skips, errors and stalls keep the immediate cut. Optionally, skips could get a short lift/drop of their own.
- **h) Fix the first-record ramp.** In step 2, change `rampOnly` to `if(firstRampPending){ rampInFirst(); }`. This path (`beginRadio` → `RIG.first` → `rampOnly`) never touches the new code, so it stays separate.
- **i) Block bridge.** `nextTrack`, `bridgeG` and `forceGenre` are untouched because everything still goes through `pullTrack`. In step 8's block-change string (build-liquid.py:363-369), add a dawn-only discard: put `PRE.t` back at the front of `pools[g]`, stop its deck and clear `PRE`. Then the 06:00 ambient override takes effect on the very next record. Outside dawn, keeping the preloaded record matches the current bridge semantics, since `currentGenre` already refers to the pulled record today.
- **j) Result.** Lift, 2.0 s, drop, music about 0.4 s later. Total gap is about 2.4 s plus whatever trailing silence the video has.

## 4. The "sounds when songs are hanging"

**What plays, and when (verified):**
- The "hanging" sound is `FX.transitionFx` (`e05:271-278`), fired at the start of every normal changeover (`e05:603` touch, `e05:639` desktop). It is not genre-aware: one-drop kick and rim, organ bubble, sub, and the DTMF phone 40% of the time, all with dub echo. That is reggae and dub sound-system vocabulary, which is why it fits reggae, dub and jungle and clashes elsewhere. The `needleDrop` and crackle 1.9 s later come from `l04` `RIG.prepare`.
- **Block change** (06, 08, 13, 15, 18, 20, 02 h): `FX.horn` plus a toast. At 06:00 `HMDAWN` also plays its riser and closer (`l06:662-694`) through its own AudioContext straight to the speakers.
- **Skip:** rim, then rewind.
- **Stall, error, dev skip:** only `RIG.quick`'s needle drop at +0.7 s.
- **Buffering:** nothing.
- There are no random drops; the only randomness is the phone's 40%.

**Side finding: vinyl sounds leaking into focus mode.** This matches Paulo's report. `FX.master` is never multiplied by `HMSIDE.f`, and `toggleMute` (`e05:822-828`) only mutes the YouTube decks. With the focus room open, the radio kept rotating, and every changeover still emitted kick, rim, bubble, sub, `needleDrop` and crackle (verified at 173 s, 450 s and 721 s with `HMSIDE.f=0`). The same happens in the arcade, with the mixtape shelf, and when muted. `HMDAWN` also ignores mute.

Fix: in step 7's `sideFade` step, call `FX.setVol(masterVol/100*HMSIDE.f)`. Apply the same factor in the volume-slider handler (`e05:818`) and in `toggleMute`, and make `HMDAWN.play` check side and mute.

**All FX functions and their character:**

| Function | Synthesis | Character | Used? |
|---|---|---|---|
| `stab` (`e05:40`) | saw A3-C4-E4 triad, bandpass 900, echo 0.75 | dub chord stab | unused |
| `phone` (`:53`) | 5 DTMF pairs, 130 ms apart, echo | sound-system phone | in `transitionFx` |
| `siren` (`:67`) | triangle 540 Hz, 4.2 Hz LFO ±130 Hz, 1.2 s, mostly wet | soft dub siren | unused |
| `kick` (`:83`) | sine 96 to 48 Hz, 0.26 s | thump | in `transitionFx` |
| `rim` (`:94`) | 60 ms noise, bandpass 1.9 kHz, optional echo | rimshot | in `transitionFx` and skip |
| `bubble` (`:106`) | square D3+A3, lowpass 760, 2 hits | organ bubble | in `transitionFx` |
| `oneDrop` (`:122`) | 2 bars at 72 BPM | reggae one-drop groove | unused |
| `needleDrop` (`:133`) | see section 3 | needle down | yes |
| `sub` (`:166`) | sine 62 to 40 Hz, 0.9 s | sub drop | in `transitionFx` |
| `skank` (`:177`) | saw F3-A3-C4, lowpass 1200, 2 hits, echo | guitar skank | unused |
| `horn` (`:193`) | saw 110/165/220 Hz, lowpass 900, 1.25 s swell, echo | dub horn | block changes |
| `sweep` (`:208`) | saw 140 to 980 Hz in 0.7 s, mostly wet | filter riser | unused |
| `rewind` (`:219`) | saw 520 to 55 Hz in 0.45 s, echo | rewind / backspin | skip only |
| `crackle` / `crackleBurst` (`:229`, `:245`) | see section 3 | surface noise | yes |
| `needleLift` (`:253`) | see section 3 | needle up | ENDED path and tapes |

The focus room also synthesizes five sounds of its own (`l07:478-539`) that could move into `FX`: air horn, square siren at 640 Hz with a 7 Hz LFO, spinback (saw 420 to 28 Hz), cowbell echo, and tape stop (saw 196 to 18 Hz with a closing filter).

**Constraint (from the code, not tested in a browser):** the YouTube audio sits in a cross-origin iframe, so WebAudio cannot reach it. A true echo-out, backspin or filter on the music itself is impossible. What is possible is overlaying a synthesized or sampled FX and quickly fading the deck's volume, which mimics a backspin or tape stop.

**Suggested genre kits.** Add an `FX.kitFor(g)` through step 10, fired at the lift and keyed to the outgoing genre, around 50% of the time and never the same kit twice in a row:
- reggae, dub, ska: the current kit, `siren`, `skank`
- ragga jungle, atmospheric jungle, oldskool hardcore: `rewind`/spinback, air horn, `siren`
- dubstep: `sub`, `siren`
- uk garage, breakbeat: rewind or spinback
- house, deep house, lofi house: tape stop or `sweep`
- liquid, intelligent dnb, hypnotic techno: `sweep` only
- ambient, ambient techno, dub techno, lofi, focus zen: nothing, just the lift and drop