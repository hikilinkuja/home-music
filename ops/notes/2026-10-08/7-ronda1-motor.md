Changes are done and tested; the repository is clean apart from my two files. In a private copy, `python3 liquid/build-liquid.py` passes every assert, `bash ops/tools/build.sh` ends with "validacao OK", and the classic `index.html` hash (e092b28a…) is unchanged. I never ran the build in the shared repository.

## What changed

**`liquid/l04-vj.html`** (already in the orchestrator's WIP commit 6b8aa9e)
- `:13` `RIG.prepare` no longer plays a needle, so the RIG hooks cannot add a second one.
- `:18-19` new `RIG.lift(ms)` / `RIG.drop(ms)`, timed to the sounds.
- `:21` `quick` keeps its needle at +0.7 s (used for skips, errors and stalls) and adds the visual drop.
- `:7`, `:87-91` the field settles between lift and drop and gives a short pulse at the drop.

**`liquid/build-liquid.py`, edits to existing steps**
- Step 2:
  - `:27` `FX.setVol` now runs right after `FX.init`, which fixes the saved volume never reaching the effects.
  - `:28` the needle sounds are pre-generated about 1.5 s after load.
  - `:44` `HM.fxAudible()`.
  - `:58` fix (h): `rampOnly` no longer clears the flag before `rampInFirst`, so the first record now rises over 2 s instead of jumping in at the first `audioGuard` tick.
- Step 6 `:159`: `audioGuard` leaves the waiting deck alone during the changeover.
- Step 7 `:215`: the side fade closes the effects channel for focus and arcade (0.25 s down, back up over the fade time).
- Step 8 `:381`: at 06:00 only, a preloaded record goes back to the front of its genre's pool and its deck is stopped.

**`liquid/build-liquid.py`, new section 10 (`:416-1123`).** Helpers `rep`/`cut` (`:423`, `:429`) assert that every anchor occurs exactly once; a final assert checks that no `XFADE_LEAD` or `RIG.prepare` remains.
- **10a, constants:** `XFADE_LEAD` is replaced by `GAP_S=2.0`, `DROP_TO_MUSIC_S=0.4`, `PRE_LEAD=40`, `REC_TIMEOUT=25000`, `LIFT_LEAD=0.025`.
- **10b, effects chain and gate:**
  - `chain()` builds the master and dub echo once and is reused for offline rendering.
  - `FX.live()` is false when muted or when focus/arcade is open; `setVol(v, ramp)` applies it.
- **10c:** `stab`, `phone`, `siren`, `sub`, `skank`, `horn`, `sweep` and `rewind` accept a start offset `at`, so they can be placed on the AudioContext timeline.
- **10d/10e, needle and crackle sounds** (generated sample by sample, played dry, never through the echo):
  - Drop: short broadband contact click with a bounce, a body made of damped low and low-mid resonances, then about 0.4 s of lead-in groove (hiss, rumble, dust, one rotation click) that fades under the music.
  - Lift: run-out groove, a short scrape, a soft low pop, then silence; there is no crackle after the lift.
  - Crackle: 7.2 s loop with a random start point, darker and quieter than before.
  - Kits: `dub`, `backspin`, `spinback`, `tapestop`, `riser`, `siren`, `airhorn`, `echothrow`. The air horn, spinback and tape stop are ported from the focus room (l07). `duckEcho` lowers the echo before the drop.
  - `FX.after(d, fn)`: a timer driven by the audio clock, so a background tab cannot delay it.
- **10f:** the eleven older effects check the gate before playing.
- **10g/10h, player events:**
  - ENDED on the deck on air starts the changeover.
  - An error on the waiting deck marks the track dead and loads another (up to 4 times).
  - A 153/2 error on the idle deck stops it being used for preloading.
- **10i, changeover logic:**
  - `GAPKIT={reggae, dub, ska_rocksteady, ragga_jungle → "dub"}`; changing a genre's kit is a one-line edit.
  - On ENDED: lift at once; drop 2.0 s later at an absolute AudioContext time, pinned to the lift from a single clock read; music 0.4 s later.
  - Desktop preloads 40 s before the end, muted and paused at 0. SIMPLE loads after the lift.
  - If the new record is not ready after 25 s, it falls back to a hard cut.
  - `hardNext` is ignored during the changeover. If a preloaded record is ready, skip, error and stall jump straight to it (needle, then music 0.4 s later); otherwise they keep the old hard cut.
  - `hardNextAudio` now respects the user's mute and forces a reload.
  - `startTransition` now means "lift now".
- **10j, watchdog:** preloads within the last 40 s and treats a record frozen in its last 1.5 s, or found in state 0, as ended. The stall check is kept.
- **10k-10m:**
  - The block-change horn uses the same gate.
  - `toggleMute` also mutes the effects and does not unmute the waiting deck.
  - `HMFX` gains `needle` (rampInFirst always runs), `lift` (no crackle), `kits`, `gap`, `kit(name)`, `render(name, s)` (WAV via OfflineAudioContext) and `level()`.
  - `HMENG.state` shows the changeover and preload state.

## How it was tested
Scripts are in `scratchpad/work/engine/`: `h.js` (stub YouTube plus AudioContext source logging), `an.js`, `an2.js`, `render.js`, `wavstat.py`, `oldfx.js`.

**Real-time runs, 45 s records, two changeovers per run**

| Run | Full duration | Lift after ENDED | Drop − lift (AudioContext time) | Volume rise after drop |
|---|---|---|---|---|
| Desktop | 45/45 | 0.2-1.3 ms | 2.0000 s | 0.44-0.45 s |
| SIMPLE | 45/45 | 0.3-1.2 ms | 2.0000 s | 0.45 s |
| Desktop, hidden tab, timers throttled to 1 Hz | 45/45 | under 1.1 ms | 2.0000 s | 0.39-0.42 s |
| SIMPLE, hidden tab, timers throttled to 1 Hz | 45/45 | under 1.1 ms | 2.005-2.016 s | 0.40-0.41 s |
| SIMPLE, error on the waiting record during the gap | 60/60 | 1.0 ms | 2.0000 s | 0.45 s |

- The play call comes at drop+0.40 s; the volume figure is the first step of the 250 ms ramp.
- In the throttled SIMPLE run the stub's load takes 2 s, so the drop waits about 30 ms for the player to be ready.
- In the kingston block the dub kit sounds between 0.42 and 1.21 s after the lift. In the flight block there is no kit.

**Fake-clock runs**
- 25 minutes on desktop and on SIMPLE: every record reached ENDED at its full duration, with no early cut.
- 18:00 block change: the record on air plays to its end and the horn fires at 18:00:00. The next records come from the new block; on desktop the record preloaded at 17:59:29 is kept, as specified.
- 06:00 dawn: the dub_techno record preloaded at 05:59:53 is stopped at 06:00:10, an ambient record is preloaded at once, and ambient goes on air at 06:00:35 after the current record ended at 200/200.
- Skip without a preload is a hard cut with the needle 0.7 s later. Skip with a ready preload jumps to it, with music 0.5 s later.
- `hardNext` during the changeover is ignored. The skip challenge ("locked in") runs rim, rewind, cut, needle.
- Two errors on the preloaded deck: re-armed each time, then a normal changeover.
- Stall: hard cut 14.4 s after the freeze; inside the preload window it jumps to the ready deck instead.
- Dev skip works in both cases.
- Focus and arcade open, desktop and SIMPLE: zero effect sources on the engine's AudioContext across two changeovers, `FX.master` = 0, `fxAudible` false; after closing, the level returns to 0.56/0.70.
- Muted: no effect sources, master 0. On unmute only the deck on air is unmuted.
- Tapes: the radio's lift and drop stay silent while the master stays open for the tapes' own needle.
- VJ `LV.liftT`/`LV.dropT` land within 0.5 ms of the sounds.

**Integration with the other agents' current files:** no page errors and identical timings. `l06` already calls `HM.fxAudible()`; at 06:00 with the focus room open, `HMDAWN` produced no sound.

**Offline renders, compared with the old code**

| | Old | New |
|---|---|---|
| Crackle RMS / peak | -53.2 / -21.0 dBFS | -60.6 / -26.9 dBFS (7.4 dB quieter) |
| Drop peak | -14.2 dBFS | -11.6 dBFS |
| Drop body | sine sweep | 81% of energy between 80 and 300 Hz |
| Drop lead-in groove | 2.2 s settling noise | -35.7 dBFS RMS, silent after 1.05 s |
| Lift peak | -17.0 dBFS | -16.9 dBFS |
| After the lift | 1.3 s of crackle | true silence from 0.45 s |
| Dub kit, last 50 ms before the drop | (no gap existed) | -76 to -92 dBFS |

## Open points and uncertainties
- **Sound:** judged only by measurement, never by listening. The WAVs are in `.../work/engine/wav/` (lift, drop, ritual, ritual-dub, crackle, the eight kits), with the old sounds in `wav-old/`.
- **Real YouTube behaviour I could not test here:**
  - Whether a paused preloaded deck stays paused after `seekTo(0)`.
  - Muted autoplay on the idle deck.
  - Start delay of `playVideo`: any delay adds to the 0.4 s lead-in.
- **iOS:** `setVolume` is ignored, so the 250 ms de-click ramp does nothing there, and the side fade still does not silence the hidden radio on iPhone (existing issue from focus.md; I only gated the effects).
- **`HM.fxAudible()`:** also returns false while tapes have the radio side-lined. That goes beyond "focus/arcade or muted"; I chose it so the dawn announcement does not play over a tape.
- **Dead or compatibility code left in place:** `transitionFx` (now plays the dub kit), `FADE_DUR`, `FX._pendingNeedle` in `firstGesture`, `RIG.fadeBegin/setFade/finish`.
- **Not touched:** the `?dev` peek queue still delays block changes by three records (dev.md).
- **Not committed:** my latest `build-liquid.py` changes are not in the WIP commit; `git diff HEAD` shows 58 lines.
- **Harness only:** the skip-challenge timing in `h.js` drifts under heavy CPU load with the fake clock. This is not a problem in the radio.
- **Cleanup:** I accidentally wrote four small `run-*.txt` files into `/bin` and removed exactly those.