Art wing report (liquid room). Source line numbers refer to `liquid/l06-art.html` (L06), `liquid/l02-body.html` (L02) and `liquid/l01-head.html` (L01).

**Build context (verified).** `build-liquid.py` changes only `radio/e05-engine.html` into `l05`. It never reads L06, L02 or L01; `build.sh:15-17` concatenates them verbatim. A scratch concatenation is byte-identical to `liquid/index.html`, so these index offsets hold: L01 +0, L02 +407, L06 +4797.

Some L06 code calls `HM.*`, which comes from the engine through two `build-liquid.py` transformations:
- **Transformation 2** (the `autoStart` replacement) exports `HM.begin`, `HM.prime`, `HM.fxResume` and `HM.animClock`, used at L06:41, 76-78 and 86.
- **Transformation 8** (the block-change hunk) calls `HMDAWN.play()`, defined at L06:647-720. It appears at l05:779.

# 1. Structure, and where the buttons should go

**Markup (L02:14-46).** `#wart` is a fixed full-screen layer with `z-index:90` (L01:286-287). It contains:
- **Media layers:**
  - `video#waVid`, `loop muted playsinline preload=none` (L02:15).
  - `#waPicWrap` holding `img#waPic` and the lens `#waLens` (L02:16).
  - `canvas#waCv` (L02:17), `#waVeil` (L02:18), `#waPoem` (L02:19).
- **Hint:** `#waHint` (L02:20).
- **Piece arrows:** `.wa-nav` prev/next (L02:21-22).
- **Caption card `#waCap`** (L02:23-33): kind and number line (`#waK`, `#waNum`), title `#waT`, artist `#waA`, then one `.row` of four identical `.tbtn` buttons:
  - `#waWingBtn` "Daily canvas"
  - `#waFichaBtn` "Room sheet"
  - `#waFsBtn` "Immerse"
  - `#waBack` "Back to the radio"
- **Room sheet `aside#wartFicha`** (L02:34-45), which slides in from the right.
- **Entry points:** `#wartBtn` in the header (L02:57, L06:440) and the `w` key once the intro is done (L06:465).

**Residencies.** `WPIECES` (L06:137-162) holds four static pieces:
1. Film: Eggeling, "Symphonie Diagonale", source `EGG` (L06:125).
2. Canvas: af Klint, "Svanen No. 17", source `SWAN` (L06:126).
3. Poem: Yeats (L06:127-136).
4. Field: "Low Tide" demonstration, drawn by `fgStep` at L06:190-211.

The comment at L06:163 says the programme renews weekly, but nothing rotates it. `isoWeek` is used only to print the week number in the room sheet (L06:169). `wa.cur` starts at 0 (L06:164), so piece 1 (the film) always opens first.

The page runs through `waShow` (L06:255-282), which calls `waShowLayers` (L06:246-254) and `waFillFicha` (L06:167-181). `waLoop` (L06:212-245) breathes the veil, runs the poem and draws the field.

**Daily canvas.** `wa.wing` toggles between "week" and "day" (L06:442-448). The button relabels itself "Daily canvas" or "This week: residency" and hides the arrows in day mode. `dailyFetch` (L06:311-329) and `dailyShow` (L06:330-358) query the Art Institute of Chicago (AIC) API.

Side bugs in the failure path, verified by reading the code:
- `DAILY.got=true` is set even on failure (L06:328), so the fetch is never retried in that session, although the page says "try again in a moment" (L06:338).
- On failure the room sheet is not refilled and keeps the previous residency's text (early return at L06:340).
- `waShowLayers({kind:"field"})` shows `#waCv`, but `waLoop` treats the day wing as a canvas (L06:215). So `fgStep` never runs and the field stays blank.

**Why it reads as part of the description (measured).** All four buttons share `.tbtn` (L01:37-43) inside the caption card under the artist line.
- On a 390-wide phone the card is 177 px tall: 16,651 to 351,828. The buttons wrap into two rows: "Daily canvas" and "Room sheet" at y 726, "Immerse" and "Back" at y 774.
- At 844x390 and on desktop the buttons are only 26 px tall. The 42 px touch size applies only at `max-width:760px` (L01:146), and a landscape phone is wider than that.

**Proposal: a top toolbar for the wing, the card keeps only the piece.** It reuses three existing patterns:
- the header gradient bar `#top` (L01:25-29);
- the arcade's segmented tabs `.tbtn.arcTab.on` (l08:78-79), whose `.tbtn.on` gives the amber fill (L01:43);
- `.bmore` for the text link (L01:369-372), and the `--red` token (L01:9) already used by the on-air dot (L01:33).

Markup, replacing L02:27-32 and inserting before `#waPrev`:
```html
<nav id="waBar" aria-label="art wing">
  <button class="tbtn tbtn-exit" id="waBack" type="button">&lsaquo; Back to the radio</button>
  <div class="wa-wings" role="tablist">
    <button class="tbtn waWing on" data-wing="week" role="tab" aria-selected="true" type="button">This week</button>
    <button class="tbtn waWing" data-wing="day" role="tab" aria-selected="false" type="button">Daily canvas</button>
  </div>
  <button class="tbtn" id="waFsBtn" type="button">Immerse</button>
</nav>
<!-- in #waCap, after #waA, instead of .row: -->
<button class="bmore" id="waFichaBtn" type="button">room sheet</button>
```

CSS for L01:
```css
#waBar{position:absolute; left:0; right:0; top:0; z-index:2; display:flex; align-items:center; gap:8px;
  padding:calc(10px + env(safe-area-inset-top,0px)) 16px 18px;
  background:linear-gradient(to bottom, rgba(0,0,0,.62), rgba(0,0,0,0))}
.wa-wings{display:flex; margin:0 auto}
.wa-wings .tbtn + .tbtn{border-left:none}
.tbtn.tbtn-exit{border-color:var(--red); color:var(--paper)}
.tbtn.tbtn-exit:hover{color:var(--red); border-color:var(--red)}
@media (max-width:760px){
  #waBar{flex-wrap:wrap; padding:calc(8px + env(safe-area-inset-top,0px)) 10px 12px}
  .wa-wings{order:3; flex:1 1 100%; margin:6px 0 0}
  .wa-wings .tbtn{flex:1 1 50%; justify-content:center}
  #waPoemTitle{top:124px}
}
```
- `z-index:2` keeps the bar below `#wartFicha` (z 3), so the room sheet still covers it.
- `#waHint` (z 4, `top:14px`, L01:314) would collide with the bar. Move it above the card (`top:auto; bottom:130px`).
- `#waPoemTitle` (`top:64px`, L01:319) would sit under the 118 px phone bar, hence the `top:124px` rule above.

JavaScript, replacing L06:442-448:
```js
document.querySelectorAll(".waWing").forEach(function(b){ b.addEventListener("click", function(){
  var w=b.dataset.wing; if(w===wa.wing) return; wa.wing=w;
  document.querySelectorAll(".waWing").forEach(function(x){ var on=x.dataset.wing===w; x.classList.toggle("on",on); x.setAttribute("aria-selected",on?"true":"false"); });
  $("waPrev").style.display=$("waNext").style.display=(w==="week")?"":"none";
  gesReset(); if(w==="day"){ dailyShow(); } else { waShow(wa.cur); } }); });
```

I mocked this layout in Playwright by injecting the CSS and DOM at runtime only; no repository file was touched.
- On a 390 phone the bar is 0-118 and the card shrinks from 177 to 100 px.
- On desktop the bar is 54 px tall. It overlays the top of a full-height film; auto-hiding the chrome after a few idle seconds is optional.

Applying the same `.tbtn-exit` class to `#fcExit` "Back to the full room" (l07:138) would keep the exits consistent; Paulo may have meant that button too.

# 2. Piece 1 on the phone

**What piece 1 is (verified).** The page reads "piece 1 of 4" for "Symphonie Diagonale". It is a native `<video>` (L02:15), not an iframe or a canvas. Its source `EGG` (L06:125) is set lazily in `waShow` (L06:266-270).

**Cause (verified by measurement).** `#waVid{... width:100%; height:100%; object-fit:cover}` (L01:288-289) fills the viewport and crops whatever does not fit. Git history shows the film has used `cover` since v2.1 (6a3a84e). v3.5 moved only the paintings to `contain` (L01:291 says "a obra inteira, sempre", meaning the whole work, always); the film was left out.

The real file's aspect ratio is not verified: archive.org is blocked from this machine. I served a 640x480 stand-in, assuming the 4:3 of silent cinema. Results with that stand-in:

| Viewport | Video box | Cover scale | Rendered size | Visible part of frame |
|---|---|---|---|---|
| 390x844, DPR (device pixel ratio) 3 | 0,0,390,844 | 1.758 | 1125x844 | 34.7% of the width |
| 360x740, DPR 3 | 0,0,360,740 | 1.542 | 987x740 | 36.5% of the width |
| 844x390 (rotated) | full screen | 1.319 | 844x633 | 61.6% of the height |
| 1440x900 (desktop) | full screen | 2.25 | 1440x1080 | 83.3% of the height |

The 1440x900 desktop also loses 16.7% of the frame height to `cover`. So the hint "rotate the phone for the full piece" is false today: rotating still crops 38%.

**Main fix.** Change L01:288 to `object-fit:contain`.
- With `contain` at 390x844 the film is 390x293 at y 276-569, clear of the card (which starts at 651). At 360x740 it is 360x270 at y 235-505, card at 547.
- At 844x390 the film is 520x390, and the card (16-489, 271-374) covers its lower-left part. Add a landscape rule, `@media (orientation:landscape) and (max-height:500px)`, that compacts or auto-hides `#waCap`. Better still with the toolbar above.

**Related phone defects.**
- **Pinch zooms the page, not the piece (verified in the emulator).** `#wart` has `touch-action:auto`, and no rule anywhere sets it except `.vidpanel` on desktop (L01:348). In a two-finger CDP pinch, Chromium fired `pointercancel` for both pointers after 8 moves. The custom zoom stopped at 1.5 and `visualViewport.scale` went to 5, meaning the whole page zoomed. Fix: `#wart{touch-action:none}` plus `#wartFicha{touch-action:pan-y}` so the room sheet still scrolls.
- **The hint is clipped.** `#waHint` uses `white-space:nowrap` (L01:317) and measures 498 px wide at x=-54 on a 390 screen, so both edges are cut off. Fix: `white-space:normal; width:max-content; max-width:calc(100vw - 32px); text-align:center`, and reword it once the film is uncropped.
- **The arrows cover the film edges.** `.wa-nav` at x 6-54 and 336-384 sits over the edges of a contained film. This is minor; it could move into the toolbar on phones.
- **Immerse on iPhone (platform knowledge, not tested here).** It calls `documentElement.requestFullscreen` (L06:459-462), which iPhone Safari does not offer for non-video elements. For the film, fall back to `$("waVid").webkitEnterFullscreen()` or `requestFullscreen()` on the video itself; the native player then shows the whole film in landscape.

**Screenshots:**
- Current (`cover`): `film-p390.png`, `film-p360.png`, `film-l844.png`, `film-d1440.png`.
- CSS-override preview of `contain`: `film-*-contain-preview.png`.
- After the pinch test: `film-p390-after-pinch.png`.

# 3. Zoom on paintings today

**State and target.** The state is `GES {s,x,y,pts,d0,s0}` (L06:360). `gesTarget` (L06:361-365) zooms the film if visible, otherwise the painting wrapper; the poem and field cannot be zoomed. `gesApply` sets `translate(x,y) scale(s)` on the element (L06:366-369). The default `transform-origin` is the centre, so zoom always pivots on the screen centre, never on the cursor or the pinch midpoint.

**Pointer gestures (L06:373-397).**
- Touches that start on `#waCap`, `#wartFicha` or `.wa-nav` are ignored.
- Two pointers: `s = clamp(1, 4, s0*d/d0)`. One pointer with `s>1`: pan by the raw delta, with no clamp, so the image can be dragged fully off screen. In the emulator I panned the film 600 px.
- Mouse pan on paintings is broken (verified): `img#waPic` is natively draggable, so `dragstart` fires and then `pointercancel` after one move, and the pan stops at 40,20. Pan works on the video.

**Wheel (L06:398-404).**
- It is bound on all of `#wart`, including the room sheet. Verified at 1280x600: the sheet has 678 px of content in 600 px, and six wheel notches left `scrollTop` at 0. Wheeling over the open room sheet zooms the piece behind instead of scrolling.
- Each event multiplies by a fixed 1.08 (in) or 0.93 (out), whatever the size of `deltaY`, its `deltaMode` or `ctrlKey`. The steps are asymmetric (1.08 x 0.93 = 1.0044).
- 12 notches give 2.518 and about 19 reach the cap of 4 (verified). Thirty tiny trackpad events of deltaY -4 jump straight to 4 (verified).
- `x` and `y` reset only when `s` reaches exactly 1, so zooming back out leaves the view off-centre.

**Reset.** Double-click anywhere in `#wart` resets, including on caption buttons (L06:405). There are also resets on piece change, wing change and daily show (L06:252-253, 265, 356, 446).

**Missing.** There are no zoom buttons, no zoom percentage, no keyboard zoom (arrows change pieces at L06:452-456; Esc closes), no pinch midpoint anchoring and no inertia.

**Reading lens (L06:410-438, CSS L01:295-299).**
- It is enabled only if `(pointer:fine) and (min-width:761px)` matches at page load (L06:412), so a later window resize never enables it.
- `#waLens` is a full-width band, 36vh tall, always vertically centred on the screen; it does not follow the cursor. It is opaque and dims the rest of the screen with a 2000 px shadow.
- It uses the same `img.src` as its background at a fixed magnification `Z=2.6` (L06:415). It hides when `s>1` or when the cursor leaves the painted area.
- Measured at 1440x900: band 0,288,1440x324; `background-size` 2371x2340, which is the 912x900 rendering times 2.6.
- Leftover band (verified): after wheel zooming without moving the mouse, the band stays visible and is scaled with the wrapper, because `#waLens` sits inside `#waPicWrap`. See `swan-d1440-wheel12.png`.

**Sources and resolution.**
- Svanen: the full original upload from `upload.wikimedia.org`, not a thumbnail (L06:126). Its real pixel size is unknown here. Phones load the whole file too.
- Daily canvas: AIC IIIF `/full/1200,/0/default.jpg` (L06:323), 1200 px wide. Zooming to 4x or the 2.6x lens upscales it past the source resolution, which blurs it (inference from the arithmetic).

**Improvement ideas:**
- Zoom toward the cursor or pinch midpoint: `t' = (m-c) - (s'/s)*(m-c-t)`.
- Proportional wheel steps (`exp(-deltaY*k)`, with finer steps for `ctrlKey` trackpad pinches), plus a short CSS transition.
- Clamp the pan so an edge never enters the frame.
- `draggable="false"`, `-webkit-user-drag:none` and grab/grabbing cursors on `#waPic`.
- Exclude `#wartFicha` and `#waCap` from the wheel and double-click handlers.
- A zoom strip in the toolbar (minus, percentage, plus, fit), and keys `+`, `-` and `0`.
- Double-click to zoom 2x at the clicked point.
- A minimap showing the visible rectangle.
- Deep zoom with tiles: AIC serves IIIF Image API 2 `info.json`, usable with OpenSeadragon from cdnjs. Wikimedia could show a thumbnail at fit and swap to the original past a threshold.
- An adjustable lens (wheel changes `Z` while the lens is open), a round loupe that follows the cursor or a band that tracks it vertically, an `L` key toggle, and the leftover-band fix.
- Optional curated detail stops ("zoom to x,y" with a caption), written only from verified sources.

Screenshots: `swan-d1440-lens.png`, `swan-d1440-wheel12.png`, `film-d1280-zoom-drag.png`, `swan-d1280-zoom-drag.png`, `swan-d1280-pan-unbounded.png`, `ficha-d1280-wheel.png`, `daily-p390.png` and the other `daily-*.png`.

# 4. External media in L06, and what plays when

| Source | Line | When it loads | What it does |
|---|---|---|---|
| `P_SRC`, archive.org Koncrete Roots "Sound Killah" mp3 | L06:16 | Splash tap (L06:110) or Enter/Space on `#tapHint` (L06:111), via `startIntro` (L06:84-109) | Plays from 0; MC lines appear at `MC_AT_TRK` (L06:17, 103-105); fades out at 28.5 s over 2.6 s, then `sequenceIntoRadio` |
| `VINYL_SRC`, freesound 625771 HQ preview mp3 (CC0) | L06:30 | One second after the intro ends or is skipped, in `sequenceIntoRadio` (L06:31-70) | Seeks to 13 s and plays; at 15 s calls `HM.begin()` and `LVfx.unveil(2600)`; at 17 s fades over 300 ms and pauses |
| `EGG`, archive.org mp4 | L06:125 | First time the film piece is shown | Always muted; paused on piece change, daily show and close (L06:259, 301, 332); `src` is never unloaded |
| `SWAN`, Wikimedia original | L06:126 | When the canvas piece is shown (L06:272) | Silent image |
| AIC search API | L06:315-316 | Only on the first daily-canvas open | Picks the day's painting |
| AIC IIIF image, 1200 px | L06:323 | With the daily canvas | Silent image |
| `../sfx/dawn-mc.mp3` | L06:702 | Dawn change at 06:00, once per day (`localStorage hm_dawn`) | The file does not exist in `sfx/` (verified), so the error path plays only the synthesized riser and closer, each in a fresh `AudioContext` |

Fallbacks for `P_SRC`: an error, a rejected `play()`, or less than 0.4 s of progress after 4 s all jump straight to the radio (L06:96-102).

Fallbacks for `VINYL_SRC`: an error, a rejected `play()`, or less than 13.3 s of progress after 2.5 s all call `HM.begin()` (L06:52-55). The volume comes from `hm_vol`, or is forced to 1 on phones (L06:47-50).

The art wing itself plays no sound.

**Inference: the intro that stopped for a few days.** The MC text only advances as the intro audio's `currentTime` grows (L06:103-105). An archive.org outage or a start slower than 4 s therefore removes both the music and the text, and the room drops straight into the radio. That would explain "intro music and text stopped for a few days".

**Inference: vinyl heard in focus mode.** `VINYL_SRC` plays once per page load, guarded by `intro.done` (L06:32), so it cannot be the vinyl Paulo hears in focus mode. More likely sources are the engine's WebAudio effects: `needleDrop`, `needleLift` and `crackleBurst` (l05:133-253, 1437-1446) go out through `FX.master` (l05:22, 34). Transformation 7's `sideFade` changes only the YouTube volume, so those effects are not ducked in focus. Not verified by listening.

# Files

Everything is in `scratchpad/understand/art/`:
- Screenshots: `film-p390.png`, `film-p360.png`, `film-l844.png`, `film-d1440.png`, `film-*-contain-preview.png`, `film-p390-after-pinch.png`, `swan-*.png`, `daily-*.png`, `ficha-d1280-wheel.png`, `film-d1280-zoom-drag.png`, `swan-d1280-zoom-drag.png`, `swan-d1280-pan-unbounded.png`
- Mock of the proposed layout: `proposal-p390.png`, `proposal-p360.png`, `proposal-d1440.png`
- Measurements: `probe-results.json`, `probe2-results.json`
- Scripts: `probe.js`, `probe2.js`, `probe3.js`, `preview.js`
- Stand-in media: `test43.webm`, `swan.jpg`, `daily.jpg`