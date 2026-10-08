**Liquid room intro: why it stopped for a few days and came back**

**Answer.** No commit broke the intro and none restored it. The intro code and everything it depends on have been byte-identical since 2026-10-03, and every committed version plays it correctly when the audio file loads. The intro streams Sound Killah from archive.org when the splash is tapped. If that file fails to load, is refused, or is slow, the page silently skips to the radio. The text lines are timed off the audio's playback position, so music and text disappear together while the radio still starts normally. That matches the symptom exactly. The most probable cause is that archive.org, or the server holding item DPH011, was unavailable or slow on those days, possibly made worse by a slow connection on Paulo's side. This is an inference: I found no outage record for 4 to 7 October 2026.

## 1. How the intro works and what decides whether it plays

**Where it lives**
- Markup: `liquid/l02-body.html:5-12` (#splash, #mc, #tapHint "tap to drop the needle", #skipIntro, #introCredit) and `:2` (#lightVeil).
- CSS: `liquid/l01-head.html:262-283`. #mc is hidden until it gets the class `on`; each `.mc-line` is invisible until it gets `show`.
- Text: the six `MC_LINES` in `radio/e03-data.html:2561-2568`.
- Logic: `liquid/l06-art.html:13-115`.
  - Audio source `P_SRC` is `https://archive.org/download/DPH011/04_Koncrete_Roots_Sound_Killah.mp3` (`:16`).
  - Line times `MC_AT_TRK=[6,10.5,15,19,23,26.2]` and fade point `P_FADE=28.5` (`:17`).
  - `startIntro` (`:84-109`) runs on `pointerdown` on #splash (`:110`), or Enter/Space on #tapHint (`:111`).
- Hand-off to the radio:
  - `sequenceIntoRadio` (`:31-70`) waits 1 s, then plays the freesound vinyl `VINYL_SRC` (`:30`) from 13 s.
  - `begin()` fires at 15 s, or on vinyl error or play() refusal, or if there is no progress after 2.5 s (`:55`).
  - `begin()` calls `HM.begin()` (which is `beginRadio`, `l05:552`) and `LVfx.unveil(2600)` (`l04-vj.html:128-137`).
- Engine side, via `liquid/build-liquid.py`:
  - Transformation 1 (`build-liquid.py:5-10`) removes the classic room's own intro (`radio/e05-engine.html:1218-1447`) and leaves a stub (`l05:1329-1330`).
  - Transformation 2 (`:12-61`) replaces autoStart: no `runIntro`, no `intro` class. It exports `window.HM` (`l05:1355-1369`: `begin`, `fxResume`, `animClock`, `isOn`, `prime`).
  - Transformation 3 (`:63-66`) sets the first-track ramp to 2000 ms.
  - The untouched `firstGesture` from the classic engine also runs on the same tap (`l05:1333-1344`, `FX.resume`).

**Conditions that decide whether music and text appear (all verified in code)**

- **The audio has to start.** The text is driven only by the audio's playback position (`a.currentTime`, `l06:104-105`). If the audio never advances, no line is ever shown.
- **Three silent skips.** Each one sends the page straight to `sequenceIntoRadio`, with no message, no retry and no fallback text:
  - the audio raises an `error` event: DNS or connection failure, HTTP 4xx/5xx (`l06:96`);
  - `play()` is refused: NotAllowedError, NotSupportedError or AbortError (`:97-98`);
  - **the 4 s guard**: if less than 0.4 s has played 4 s after the tap, the intro is dropped (`:100-102`). The audio is only created at the tap (`:93`), so the 4 s must also cover archive.org's redirect to its storage server, two TLS handshakes to US hosts, and buffering.
- **Not started by a stall later on.** If the audio starts and then stalls before 28.5 s, there is no second guard. The splash stays with partial text until "skip the intro".
- **Gesture.** The intro needs a user gesture, and it listens on `pointerdown` (unchanged since 6a3a84e).
  - Verified in this Chromium build: both mouse and emulated-touch `pointerdown` already count as a user gesture, and play() succeeds.
  - Not verified: iOS Safari. WebKit may not treat a touch `pointerdown` as a gesture, which would mean a consistent failure on iPhone rather than a few bad days.
- **No gates of any other kind.** No time-of-day or date gate, no localStorage flag (first visit or once per day), and no query parameter affect the intro. `?dev` and `?block=` (`l05:317`, `:1425`) do not touch it.
- **Saved volume.** The only stored value read is `hm_vol` (`l06:91`, forced to 1 on phones at `:92`), which only sets the intro's volume. `parseInt||80` means it can never be 0, and it does not affect the text.
- **Dawn override.** It is unrelated to the intro. It only fires on a live block change into "dawn" (transformation 8 `old_ch`, `build-liquid.py:360-371`, producing `l05:777-779`), at most once per day (`hm_dawn`, `l06:697`). It does not touch the splash.
- **External media and what happens when they fail:**
  - archive.org Sound Killah: the intro is silently skipped.
  - freesound vinyl: the radio starts at once, without the needle.
  - YouTube: the intro still runs; afterwards the radio shows "cannot reach YouTube" (`l05:516-530`, 9 s).

## 2. Git history and build

- **Shallow local clone.** The local repository is shallow (it starts at 6a3a84e). I made a full clone in the scratchpad: 127 commits, the first on 2026-10-01 21:56 +0200. Nothing exists between 25 and 30 September.
- **No change to the page during the window.** `liquid/index.html` was last changed on 2026-10-04 21:40 +0200 (0ec848e, v3.7). The next change is 2026-10-08 13:25 UTC (627e7ba, v3.8). In between there are only two "dance nearby" commits (b8b420d 10-05, e744197 10-07), which touch only `events/europe.json`. 9932997 and 183072f add sources and ops files but do not modify `liquid/index.html`.
- **Intro identical since 2026-10-03.** I extracted the intro module from all 16 versions since cd47fb2. Its hash is identical from 920d9d6 (2026-10-03 21:26) to 4059a05. The intro CSS, markup, MC_LINES, `LVfx.unveil` and `beginRadio` hashes are identical over the same span; the `window.HM` bridge has been identical since b9e0365. The `pointerdown` trigger has been the same since 6a3a84e.
- **v3.8 and v3.9 are unrelated.** v3.8 only changes the year formatting (transformation 9); v3.9 only removes catalogue entries.
- **Committed page always matched its sources (where checkable).** Rebuilding from the sources at 4059a05, 627e7ba and 9932997 gives a file byte-identical to the committed `liquid/index.html`. ccc6220 (v3.6), using that commit's sources plus l04/e05 from 9932997, also gives 0 differing lines. Earlier versions cannot be rebuilt (the sources were not committed until 9932997), but their intro is identical by hash anyway.
- **Duplicate commits are harmless.**
  - v3.6 is six one-file uploads in 8 s (a36c8c6 to ccc6220); the published page changes only in the last one.
  - v3.5.1 has three empty commits (d94defc, 7953657, 2e04fff, each with the same tree as its parent) before the real ones.
- **The dance workflow is ruled out.** `.github/workflows/dance.yml` stages only `events/europe.json`. The page does not fetch that file at load (verified: the only load-time requests are the page and `iframe_api`). It is fetched only when the dance panel is used (`l05:974-979`, which checks `r.ok` and has a `.catch`). I injected malformed JSON: no page error, and the fallback links render.

## 3. Reproduction in Playwright

Setup: YouTube stubbed, archive.org and freesound served from local WAV files, Chromium launched with `--autoplay-policy=document-user-activation-required`.

| Scenario | Result |
|---|---|
| Mouse tap, archive.org reachable | play() resolves, first line at about 6 s, intro continues |
| Emulated touch tap | Same as mouse; gesture counts at `pointerdown` |
| All 13 committed versions, 6a3a84e to 4059a05 | No page errors; play() resolves and the first line appears |
| archive.org connection refused | NotSupportedError, splash gone within 1 s, 0 lines, vinyl plays, radio starts |
| archive.org HTTP 503 | Same as connection refused |
| archive.org responds after 5 s | AbortError, splash gone at the 4 s guard, 0 lines, radio starts |
| archive.org responds after 3 s | Intro survives, first line at about 9 s |

## 4. Explanation, ranked

1. **Most probable: archive.org unavailable or too slow on those days.** This covers the front-end redirect at `archive.org/download` or the specific server holding DPH011; a single item being unavailable for days is common on archive.org. That produces either an error, a refused play() or a start later than about 3.6 s, all of which skip silently.
   - Supporting: no code changed during the window, every version is correct, the symptom (music and text together, radio fine) is exactly the reproduced skip, and nothing changed when it came back.
   - External evidence is only partial. archive.org had several incidents in 2026: 12, 15-16 (a power outage, per the Internet Archive blog), 18, 20, 29 and 30 August, and 19-21 September (per who.is). I found no record for 4 to 7 October, and the search service then hit its rate limit.
2. **Same mechanism, caused on Paulo's side.** A slow or high-latency connection (mobile data, a congested network) pushes time-to-first-audio past the 4 s guard. It is intermittent by location rather than by date.
3. **Device-dependent (unverified).** On iOS Safari a touch `pointerdown` may not count as a gesture, so play() is refused and the intro is skipped. That would fail on every iPhone visit; it is not the case in Chromium.
4. **Ruled out (verified):** a code regression, the build being out of sync, the dance commits or `europe.json`, the duplicate commits, localStorage flags and time gates, the dawn override, and the volume (which never hides the text). A stale GitHub Pages cache is also irrelevant, because the intro was identical in every version that could have been served.

## 5. Still fragile, and the fix

Yes, it is still fragile. It depends on a third-party file host with no fallback, the 4 s budget is tight, the audio is fetched only at the tap, the text is tied to the audio, and a skip leaves no trace. The audio and timing fixes go in `liquid/l06-art.html`; the trace in fix 5 also touches the `?dev` panel. No `build-liquid.py` transformation is needed.

1. **Host the media on the site itself**, with archive.org as fallback.
   - Put the unmodified MP3 at `sfx/intro-sound-killah.mp3`. CC BY-NC-ND 4.0 allows verbatim non-commercial redistribution with credit, and the credit is already at `l02:12`; add it to `sfx/LICENSES.md`.
   - Put the vinyl at `sfx/vinyl-625771.mp3` (CC0).
   - Try the site's own copy first and fall back to the external URL on error (`l06:16`, `:30`).
2. **Load the audio before the tap.** Create the `Audio` with `preload="auto"` when the page loads (around `l06:18`) and only call play() in the tap handler.
3. **Replace the 4 s check** (`l06:100-102`) with one based on the `playing` event, allowing about 8 to 10 s. If the audio still fails, show the lines on a wall clock instead of dropping the text, or offer "tap to retry". Add a stall guard after the intro has started.
4. **Also start on `click`**, guarded by `intro.started` as the existing handlers are, to cover iOS.
5. **Log why the intro was skipped**, for example in `window.HMI` and the `hm_intro_log` localStorage key: error code, rejection name or timeout, and elapsed milliseconds. Show it in the `?dev` panel so the next report can be checked rather than guessed.

The classic room (`radio/e05-engine.html:1218-1447`, served at the site root) depends on the same archive.org file plus a second one (DPH010), with an 8 s guard. Its sources are frozen, so whether to fix it there is Paulo's decision.

## Scratch files

All in `scratchpad/understand/`:
- `full/`: full clone
- `vers/liq-<sha>.html`: every committed version of the page
- `intro/<sha>.js`: extracted intro modules
- `rb/<sha>/`: rebuilds
- `harness.js`, `touchact.js`, `reqlog.js`: Playwright scripts
- `media/`: test WAV files

No repository files were modified.