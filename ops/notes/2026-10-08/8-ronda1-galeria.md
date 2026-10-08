All five items are done in `liquid/l01-head.html`, `liquid/l02-body.html` and `liquid/l06-art.html`, and the tests pass at every viewport. The film is now shown whole at 390x844, 360x740, 844x390 and 1440x900, and neither the toolbar nor the caption covers it anywhere.

The l06 intro code (start to line 116) and the dev panel block are byte-identical to the original. The dev panel has moved from 556-580 to **664-688** because I added code above it, so the agent who edits it next should find it by its comment, not by the old line numbers. None of the three files contains U+2014, U+2013 or U+2022. A private build in `work/ui/repo` passes the build script's validation, and `index.html` and `radio/` match HEAD exactly.

**1. Red back button**
- `waBack` now has class `tbtn back` (l02:16) and reads "‹ Back to the radio".
- The CSS is at l01:44-48. The red outer ring is a box-shadow, so the amber keyboard outline still shows outside it. On hover the ring thickens and gets a red tint.
- It works for `#fcExit` as well: with the class added at runtime it gets the same red border and ring.

**2. Toolbar, room sheet and daily canvas**
- `nav#waBar` is the first child of `#wart` (l02:15-22): back button, a two-button "This week" / "Daily canvas" switch, then Immerse. The caption now holds only the piece, with "room sheet" as a text link after the artist.
- The room sheet's subtitle has a new id, `#waFSub`; the old `#waWeek` span is gone.
- **Layout (l01:290-403):**
  - The film and paintings sit in a "stage" between the bar and the caption. l06 measures both with a ResizeObserver (l06:263-276), so nothing is drawn over the piece.
  - Phone, upright: Back and Immerse on one row, the two wing buttons full width below. The piece arrows move to their own strip just above the caption.
  - Phone, sideways (landscape, height up to 500px): the bar and caption become a 240px column on the left, and the piece gets the full height on the right.
  - The poem title, the arrows and the hint all moved inside the stage, so they no longer collide with the bar.
- **Keyboard:** w, Esc (closes the room sheet first, then the wing) and the arrow keys still work. Opening the wing with the keyboard moves focus to the back button; opening it with a mouse or finger does not, so no outline lights up on its own.
- **Daily canvas fixes (l06:351-440):**
  - A failed fetch can be retried: pressing Daily canvas again asks the museum again. Only one request runs at a time, with a 12 s timeout.
  - The room sheet is never left showing the residency's text: there is now a "loading" sheet and a "museum did not answer" sheet.
  - The green field behind "The museum door is closed" was always blank; it now draws.
  - A late answer from the museum no longer overwrites "This week" if the visitor has already switched back.

**3. Whole film on the phone**
- `#waVid` uses `object-fit:contain`.
- `#wart` has `touch-action:none` and `#wartFicha` has `touch-action:pan-y`, so a pinch zooms the piece and the room sheet still scrolls.
- The hint now wraps inside the screen and its wording depends on the piece. Upright, on the film, it says "turn the phone sideways for a larger film · pinch to zoom, then drag to pan". It shows once per session for the film and once for paintings, and hides when the piece changes.
- Immerse (l06:546-570) uses page fullscreen where it exists. Where it doesn't (iPhone), the film goes to the video's own fullscreen player, and Immerse is hidden on the other pieces.

**4. Dawn guard.** The `HM.fxAudible` check is the first line of `HMDAWN.play()` (l06:804).

**5. No zoom changes**, with one exception: the mouse wheel over an open room sheet now scrolls the sheet instead of zooming the piece behind it (l06:475). The bar was also added to the list of places where a touch does not start a pan (l06:451).

**How I tested**

Playwright in `work/ui/`: a 4:3 640x480 stand-in film, stand-in images and a stubbed museum API, served through `page.route`. Phones were emulated as mobile with touch and DPR 3. Scripts: `test.js`, `test2.js`, `test3.js`, `test4.js`; results in `results-main.json` and `results-interact.json`.

Film position and overlap:

| Viewport | Film rectangle | Overlap with toolbar buttons | Overlap with caption |
|---|---|---|---|
| 390x844 | 390x293 at y 248 | 0 | 0 |
| 360x740 | 360x270 at y 208 | 0 | 0 |
| 844x390 | 520x390 at x 282 (full height) | 0 | 0 |
| 740x360 (extra) | 480x360 | 0 | 0 |
| 1440x900 | 1015x761 at y 46 | 0 | 0 |

The painting and the daily canvas are also 0/0 at every viewport, and no page errors were recorded.

Other measured results:
- **Back button:** opened with w, focus lands on it with a 2px amber outline at 2px offset, outside the 1px red ring. Hover gives a 2px ring and a red tint. Opening with a mouse click or a tap leaves focus on the Art button with no outline.
- **Keyboard:** Tab and Enter switch walls, the arrow keys change pieces, and Esc closes the room sheet and then the wing.
- **Pinch on a phone:** the film scales to 4 and the page zoom stays at 1. Before the change, the report measured a page zoom of 5.
- **Room sheet:**
  - Touch-dragging it scrolls 345px with the page zoom at 1.
  - The wheel at 1280x600 scrolls it 78px and leaves the piece unzoomed.
- **Daily canvas:**
  - With the museum failing the first time, the field draws and the sheet shows "Daily canvas, day 281"; pressing Daily canvas again loads the painting.
  - The late-answer case was tested too.
- **Immerse:** on desktop it toggles fullscreen. With page fullscreen removed to imitate an iPhone, it calls the video's own fullscreen once on the film and is hidden on the painting.
- **Dawn sound:** with fxAudible returning false, nothing plays and no daily stamp is saved. With true, it plays normally.
- **Reading lens:** still works on desktop inside the stage.

**Not done or uncertain**
- **Smaller piece on desktop:** the film is 1015x761 at 1440x900, down from full-bleed, because the stage keeps it clear of the bar and caption.
- **Hint in landscape:** for its 5 seconds it sits over the top of the film. The arrows still touch a few pixels of a very wide painting's edges in the sideways layout.
- **iPhone behaviour is inferred, not run on a device:** it is unverified whether iPhone Safari has no page fullscreen, and whether the fallback still counts as a user tap when it runs after a rejected fullscreen request.
- **The real film's shape is unverified,** since archive.org is blocked here; 4:3 was assumed.
- **`fxAudible`:** the engine's real `HM.fxAudible` was not available here, so I tested with a stub.

Screenshots are in `scratchpad/work/ui/shots/` (46 files):
- **Each of p390, p360, l844, l740 and d1440:** `film-`, `canvas-`, `poem-`, `field-`, `daily-`, `ficha-daily-` and `ficha-film-` plus the viewport name (`film-p390.png` and so on).
- **Back button:** `back-focus-d1440.png`, `back-hover-d1440.png`, `mouse-open-d1440.png`, `kb-open-d1440.png`.
- **Daily canvas:** `daily-fail-p390.png`, `ficha-daily-fail-p390.png`, `daily-retry-p390.png`, `daily-loading-p390.png`.
- **Other:** `pinch-film-p390.png`, `iphone-canvas-no-immerse-p390.png`, `canvas-lens-d1440.png`.