I fixed nine of the ten findings in the liquid sources. Each one was re-tested the way it was reproduced and behaves as intended. The final fresh private build of the current tree ends "validacao OK", and the classic room is byte-identical to HEAD (index.html md5 ec9e1b40…, e05 md5 ef18f879…). The tenth finding (CLAUDE.md) is outside the files I may edit and is left to you; the suggested text is at the end. I never ran build.sh in the repository and made no commits, so liquid/l05-engine.html and liquid/index.html in the working tree are still stale until the orchestrator builds.

## Changes

**liquid/build-liquid.py** (l05 is regenerated from these; every new transformation asserts its anchor count)
- **Endless lift loop (finding 1).**
  - 10i, `endOfRecord` (line 923): the next record is now chosen with `pullTrack()` before any sound or REC setup (line 928). If no record is armed and none can be pulled, the deck is faded and the function returns silently. The watchdog's 600 ms re-entry then only repeats a cheap, silent `pullTrack()`, and play resumes as soon as a track exists. The first two lines are unchanged, so the r11 anchor still matches.
  - Optional hardening, done: `PRE_COOL=15000` (10a, line 449) and `preCool` (line 863). The armed-error branch (10h, lines 839-848) sets the cooldown after the 5th consecutive failure, and `preloadNext` (line 915) checks it. Without this, every 600 ms tick killed five more tracks during the 40 s preload window.
- **Tape needle silenced by mute (finding 2).**
  - 10b, `FX.live()` (line 479): focus and arcade still close the gate; mute closes it only when no tape is playing.
  - `FX.setVol` now records the gate state in `HMSIDE.fx` itself (line 488, only for the real `FX`). This covers toggleMute, the volume slider and the two new paths below in one place.
  - 10i, `radioFxOk()` (line 866) now checks `muted` explicitly, so the radio's own foley stays silent under mute.
  - Step 7, `sideFade` (line 211): the gate is re-evaluated on every side change, with a 10 ms opening ramp for the tapes key so the tape's needle is not swallowed.
- **Foley master stuck at 0 (finding 3).** New step 10l2 (lines 1080-1082, anchor count 2) adds `FX.setVol(masterVol/100);` after both inherited `p.yt.unMute(); muted=false;` (generated l05:830 in beginRadio and l05:866 in the "tap for sound" handler).

**liquid/l07-focus.html, iOS fader never pauses (finding 4).** The ramp value now lives in `snd.cv` and is never read back from the element:
- `cv` added to the state (459), initialised in `sndPlain` (486-487) and `sndInit` (514);
- `sndTick` (539-549) ramps from `snd.cv` and wraps the `.volume` write in try/catch;
- `sndStop` clears `snd.cv` (578).

**liquid/l01-head.html, arrows over Immerse at 568x320 (finding 5).** In the landscape rule (block at 387, rule at 403-404): `bottom:min(calc(var(--wa-ch) + 2px), calc(100% - var(--wa-bh) - 40px))` and `padding:6px 14px`. The arrows are now 46 px tall and never rise above the bar's bottom edge.

**liquid/l03-plog.html**
- **Clear undone by another tab (finding 7).**
  - `clr` mark (line 28), set in `clear()` (257).
  - Written as `c:clr` in both storage wraps in `save()` (193, 195).
  - `merged()` and `mergedEv()` (150, 164) adopt a newer mark from disk. They then drop rows that ended before it (`kept()`) and events stamped before it, both from `mine`/`myEv` and from other sessions' rows on disk.
- **Rows of a killed session stay open (finding 8).**
  - `STALE=15 min` and `BEAT=5 min` (line 20).
  - New `ls:0` field (57); `save()` stamps it on every open row (189).
  - The 60 s interval (203) also saves when rows are open and the last save is older than `BEAT`.
  - `merged()` (154) closes another session's open rows that have not been stamped for longer than `STALE` as `lost` / `lost-before-air`, with `en` set to the last stamp.
  - New CSV column `last_seen` is appended last (35 columns now). The header comment lists `lost`.
- **Year exported as 0 (finding 10).**
  - `mk()` now stores `y:t.y || ""` (53).
  - The CSV year column has a new type `"y"` that writes an empty field for 0, which covers rows already stored with y:0.
  - `json()` (251) exports y:0 as "" without changing what is stored.

**liquid/l09-dev.html**
- **Panel over the splash (finding 6).** At boot, `show(cur)` (437) restores the tab and its `wide` class but does not show the panel. The boot timer (438-443) adds `on` and paints once `HM.isOn()` is true. The optional refinement is done: if the person presses d before the radio starts (`userSet`, set in `toggle` at 67), their choice is kept.
- **Armed line never shown (finding 9).** `armedSig()` and `nextSig` (94, 99). A new 1 s interval (429-433) repaints Next only when the armed record or its ready state changes.
- **Related display fix (part of finding 8).** `stats()` (127-142, display 204-205) now counts "on air now" and "waiting" for this session only. Open rows from other sessions are shown separately as "open in other tabs" and "waiting in other tabs".

## Tests

All runs were on private builds in `scratchpad/work/fixr1` (`repo`, then `final`), using the reviewers' harnesses copied there. I stubbed YT in every run, and none produced page errors.

**Finding 1**
- `ERRALL=1 DUR=100 START=09:00 desktop` (r2.js): 15 tracks dead at 95 s, against 153 before the fix. Preload attempts run at 60, 75.7 and 91.3 s.
- r3.js (`__errall` toggle; at 95 s every kingston track is moved out of its genre, which makes the block unplayable; it is restored at 120 s):

| Build | 99-120 s | After restoring at 120 s |
|---|---|---|
| New | 0 sources | lift 120.45, dub kit, drop 121.67, ytB playing at 121.7 |
| Old round-1 build | 34 needle lifts | the loop continued |

- Regressions: normal desktop and mobile runs (DUR=30, 130 s) still give 4 lifts and 4 drops. An `errPre` at 30 s re-arms the deck and the change at 59.8 s is normal.

**Finding 2** (h.js, REAL=1)
- Mute at 10 s, then play and Next on a tape: drop and crackle at 15.27 and 20.28 s, `HMFX.level()` 0.56.
- DUR=25 scenario, muted:
  - the tape's needle sounds: drop 7.21 s, end-of-tape lift 32.24 s, next tape 34.04 s;
  - the radio's own changeover at 24.99 s makes no sound;
  - closing the panel while muted gives level 0;
  - unmuting gives 0.56, opening focus gives 0, closing it gives 0.56.

**Finding 3** (revmute/t.js, real mouse clicks)
- Mute clicked before the radio starts: level 0.56 from start to 49 s.
- "tap for sound": level 0.56 right after the tap.
- The control run is unchanged.

**Finding 4** (refute-ios/t.js)
- With iOS `.volume` emulated and no CORS: rain and crackle pause at 0 within 1 s, and 4 of 4 intervals are cleared (before the fix: still playing, interval never cleared).
- Normal `.volume` without CORS, and iOS with CORS working, behave as before.

**Finding 5** (refute-arrows/t.js)
- 568x320 and 600x320, field piece: the arrows sit at y 148-194, Immerse ends at 146 and the caption starts at 194. Taps at (30,143) and (210,143) hit `waFsBtn`, and a real tap opens fullscreen with the piece still "4 of 4".
- 327, 330, 375 and 390 px heights: the arrows stay just above the caption, as before.

**Finding 6** (t-overlay.js plus a new t-ov2.js)
- Before the radio starts, the panel box is [0,0,0,0] and covers 0% of the screen for next, log and banks, on phone and desktop. The tap starts the intro in all six cases.
- After skip-intro: "on", or "wide on" for log and banks, with content painted.
- d pressed before the start opens the panel; dd keeps it closed after boot.

**Finding 7** (refute-clear t.js; it calls `HMPLOG.clear()` directly because its button selector does not match)
- Before Clear: 8 rows. Right after: 2. Twenty-five seconds later: 7 rows, of which 0 had ended before the Clear, and 0 events came back.

**Finding 8** (t-kill2.js, a later session with `Date.now` offset)
- Offset 0: "on air now 1, open in other tabs 1 / waiting 1, waiting in other tabs 1".
- Offset 20 min: the dead session's rows read `lost` / `lost-before-air`, the CSV has 35 columns with `last_seen`, and "on air now 1" is the session's own record.
- t-crash.js (renderer killed) gives the same split.

**Finding 9** (h.js `?dev DUR=60`)
- 21 s: "ARMED ON DECK B, LOADING". 30-55 s: "ARMED ON DECK B, READY", with the list topped back up to 3 records.
- 63 s: cleared after the change. 100 s: "ARMED ON DECK A, READY".

**Finding 10**
- refute-year t.js: the unknown-year row exports an empty year in CSV and "" in JSON; the known year (2024) is unchanged.
- t-legacy.js: a stored legacy row with y:0 exports empty in CSV and JSON, and storage is left unchanged.

**Characters**: no U+2014, U+2013 or U+2022 in any file I edited.

## Left undone or uncertain
- **CLAUDE.md (finding 11)** is not mine to edit. Suggested replacement for the "Fontes da liquid" line: «Fontes da liquid, pela ordem de montagem em `ops/tools/build.sh`: `liquid/l01-head.html`, `l02-body.html`, o catálogo `radio/e03-data.html`, `l03-plog.html` (registo de emissão `HMPLOG`; tem de ficar antes do l05, que o chama), `l04-vj.html`, `l05-engine.html`, `l06-art.html`, `l07-focus.html`, `l08-arcade.html`, `l09-dev.html` (painel `?dev`, tecla d).» Keep the existing sentence about l05 being generated.
- **Screens under 320 px tall** (finding 5): Immerse stays protected, but the arrows now sit over the top 20 to 50 px of the field piece's caption (measured at 568x290 and 568x270). At 270 px the caption itself already reaches into Immerse; the left column simply cannot hold all three, and this predates my change. Real iPhone SE Safari heights with the toolbars showing were not checked.
- **Rapid needle drops in the error path** (not a regression): when every load fails, the inherited `hardNext("error")` retries produce about 6 needle drops within 0.25 s (100.83 to 101.08 s) before the "too many dead links" standby.
- **Other assumptions**:
  - The skip-puzzle sounds (`FX.rim` and `FX.rewind`) are not checked by `radioFxOk`, so under mute with a tape playing they would now sound, as they did before round 1.
  - The SoundCloud `_dropped` refinement was not needed and not done.
  - A frozen tab that resumes after 15 minutes is briefly counted as `lost` by other tabs until its next save puts its own rows back.
  - Nothing was tested on a real phone.