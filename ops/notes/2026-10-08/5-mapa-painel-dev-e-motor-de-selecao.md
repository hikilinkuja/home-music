# Report: dev mode and the data the DJ system uses (liquid room)

There is no real "dev app" today. `?dev` only opens a 3-track "up next" box with a skip button, the play history is not kept after the page closes, and nothing shows the track bank per time bracket. I prototyped the play log and both dev tabs in scratch files. All the hooks applied cleanly to the real engine, and with a stubbed YouTube player the log recorded the expected rows.

How I checked: I read the code and regenerated `l05` in scratch with `build-liquid.py`; it is byte-identical to the committed file, and the committed `liquid/index.html` equals the concatenation of its parts. I ran Playwright against a local server with `window.YT` stubbed: one-second playhead ticks, 50 s fake videos, 0.4 s load. I simulated the selection logic in node by running the generated `l05` scheduling code verbatim on the real catalogue. No repository files were changed.

## 1. Dev mode today

**`?dev` switch.** `window.HMDEV` is created by build transformation 2 (`liquid/build-liquid.py:54-59`; generated `l05:1424-1428`):
- `on` is true when the address has `dev`.
- `peek(n)` calls `devPeek`.
- `skip()` calls `hardNext("dev")`, which skips without the tap-the-BPM challenge.

**Peek queue.** Build transformation 4b (`build-liquid.py:77-99`; `l05:438-447`) adds `devQ`, `pullTrack()` and `devPeek(n)`:
- `devPeek` runs `nextTrack()` ahead of time and parks the tracks in `devQ`.
- The 2 calls that used to go straight to `nextTrack()` (`hardNext` and `startTransition`) now go through `pullTrack()`.
- `HM.flushPeek` (`build-liquid.py:143`) empties `devQ`, but nothing ever calls it (checked with grep).

**The panel.** Markup at `liquid/l02-body.html:214-218` (`#devPanel`, `#devNext`, `#devSkip`), CSS at `liquid/l01-head.html:389-396` (fixed box, 250px wide, z-index 85). Code at `liquid/l06-art.html:556-580`:
- It shows the next 3 tracks with genre and BPM.
- It repaints through a MutationObserver on `#tArtist`.
- The "n" key skips; the handler does not ignore typing in INPUT or TEXTAREA (`l06:573-575`).
- There are no tabs.

**Defect (verified).** `?dev` shifts the programme change by 3 tracks. The panel keeps `devQ` topped up at 3, and a block change does not clear it. In a test with the clock faked to 14:59:25, three Lo-fi House tracks played under the "AFTERNOON FLIGHT" label before the bridge opener (LTJ Bukem, "Horizons"). Without `?dev`, "Horizons" played immediately at 15:00. The comment at `build-liquid.py:77-78` says the peek never changes the broadcast; that only holds within a block.

**Other dev pages.** There are none:
- `labs/*.html` are design labs (arcade, focus, mobile, residency, sound-deep, type, vj).
- `introlab.html` and `mixtapes/index.html` are not diagnostic pages.
- `radio/index.html` is the stale copy.
- The only other diagnostic, `window.HMI` (`radio/e05-engine.html:1230-1231`), is cut out of `l05` by transformation 1 (`build-liquid.py:5-10`). It survives only in the frozen classic room.

**Session log.** The visible "Session log" (`e05:789-805`, `#histPanel`) is a DOM list of at most 60 entries. It is not saved.

## 2. Selection engine

| Part | Where | Behaviour (verified in code) |
|---|---|---|
| Grid | `build-liquid.py:238-263` (`l05:291-314`) | Replaces `BLOCKS` in place and `blockKeyFor` with the 7 sub-blocks. Catalogue `BLOCKS` (`e03:3-10`) still has morning/afternoon/night. |
| `?block=` | `build-liquid.py:265-273` | Accepts the 7 names plus aliases (morning=kingston, afternoon=flight, night=pressure). With an override the block-change timer never fires (`e05:695`). |
| Block change | `e05:694-704` + `build-liquid.py:360-371` (`l05:772-788`) | Every 20 s: `bridgeG=currentGenre`. At dawn it sets `forceGenre="ambient"` and calls `HMDAWN.play()`. `buildQueue()` resets only `currentGenre` and `runLeft`, not the pools. |
| Rotation memory | `build-liquid.py:276-296` (`l05:347-357`) | `localStorage hm_rot` = {videoId: last-played time}, exposed as `window.HMROT`. Pruned (800 oldest) only above 4000 keys; about 30 bytes per key. |
| When a track counts as played | `build-liquid.py:373-380` | Marked inside `setNow`. That includes the first track at page load (`autoStart`), before the intro ends: `hm_rot` had 1 key before `HM.begin` (verified). Tracks that play muted while focus, arcade or tapes are open also count. |
| Pools | `build-liquid.py:298-315` | One deck per genre, not per sub-block (uk_garage shares its deck between skank and pressure). Rebuilt only when empty: never-played tracks shuffled first, then the rest by oldest play. |
| Genre choice | `e05:337-356` + `build-liquid.py:318-328` | Nearest-BPM neighbour from `ADJ` (`e05:303-321`) inside the block, 72% nearest and 28% second. If no neighbour, the closest BPM in the block. The weighted draw (1 + never-played count) runs only at session start or after a genre with no `ADJ` entry (house, uk_garage, focus_zen). |
| "Stay proportional to crate size" | `runFor`, `l05:358-362` | Run length is 3-5, capped at ceil(n/2). It only bites for intelligent_dnb (4 tracks, max 2) and oldskool_hardcore (5 tracks, 3). It is not proportional. |
| Bridge and openers | `build-liquid.py:330-358` | First pick after a block change: `wasBridge=true` and the first `op:1` track in the pool moves to the front. Only 6 `op:1` tracks exist, all liquid or atmospheric_jungle, so openers only fire when entering flight. |
| BPM | `e05:282-285` | `GBPM` lives inside the engine closure, not on `window`. Only 6 of 1185 tracks have an explicit `bpm` (reggae and dub). Every other card shows `~GBPM[genre]`, which is why "Flowrian / Thank You", tagged `g:"dub"` (`e03:1170`), shows 72 BPM. |

**Simulated airtime (verified).** 200 sessions × 40 picks per block, using the generated `l05` code:

| Block | Airtime share | Problem |
|---|---|---|
| flight | liquid 49%, atmospheric_jungle 27%, intelligent_dnb 25% | intelligent_dnb has 4 tracks |
| pressure | ragga_jungle 51%, oldskool_hardcore 25%, dubstep 17%, uk_garage 7% | oldskool_hardcore has 5 tracks; uk_garage has 107 |
| groove | house 66%, lofi_house 34% | |
| skank | uk_garage 66%, breakbeat 34% | |
| afterhours | deep_house 42%, dub_techno 37%, hypnotic_techno 21% | |

- flight and pressure play only about 34 distinct tracks per 40 picks; the other blocks play 40.
- No genre's `ADJ` list contains uk_garage. Once pressure leaves uk_garage it only comes back through the weighted draw.
- lofi (10 tracks) and focus_zen (27) are in no block, so they never reach the radio. That matches the rule "lo-fi hip hop only in the focus room".

## 3a. Play log design

**Where the code goes.** Use two new source files:
- `liquid/l03-plog.html`: the recorder. It holds the storage and the API, with no page markup. It must be concatenated before `l05`, because `autoStart` calls `setNow` while `l05` is still loading.
- `liquid/l09-dev.html`: the dev panel UI, after `l08`.

`ops/tools/build.sh` becomes:
`cat l01 l02 radio/e03-data.html liquid/l03-plog.html l04 l05 l06 l07 l08 liquid/l09-dev.html > liquid/index.html`

`validate.py` needs no change: it checks every inline script and the banned characters in the assembled page. The prototype page passed both checks (8 scripts, 0 banned characters). The CLAUDE.md list of liquid sources needs the two new files.

**Engine hooks.** Add a section 10 to `build-liquid.py`, just before the line that writes `l05` (line 400). Each change is a `rep(old,new)` that asserts the anchor occurs exactly once. All the anchors below were checked to occur once after transformations 1-9, and the prototype build passed every assert.

Choice reasons (stored per track object in a `WeakMap WHY`):

| Anchor | Source | Change |
|---|---|---|
| `window.HMROT=ROT;` | `build-liquid.py:276-296` | Declare `WHY`, `PW`, `OPV`, `DDP` and a safe `plog(fn,...)` caller |
| `function nextTrack(){` | `e05:358` | Reset `PW="run"` |
| `currentGenre=forceGenre; forceGenre=null; wasBridge=true;` | `build-liquid.py:330-358` | `PW="force"` |
| `return (near.length>1 && Math.random()<0.28) ? near[1] : near[0];` | `e05:346` | `PW="adj"` or `"adj2"` |
| `return rest[0];` | `e05:352` | `PW="bpm"` |
| `var r=Math.random()*tot;` | `build-liquid.py:318-328` | `PW="weighted"` |
| `if(pool[oi].op){...}` | `build-liquid.py:330-358` | `OPV=ob.v` (opener promoted) |
| `if(current && t && t.v === current.v ...)` | `e05:369` | `DDP=true` (duplicate swapped out) |
| `  runLeft--;\n  return t;\n}\nvar devQ=[];` | `build-liquid.py:77-99` | `WHY.set(t,{gw, br:wasBridge, op, dd, fr:!ROT.map[t.v], lp, rl, pl, b, pk})` |
| `pullTrack` | `build-liquid.py:77-99` | Mark `pq=1` when the track was served from `devQ` |

Play events:

| Event | Anchor | Source | Logged |
|---|---|---|---|
| Start | `current = t;` + rotMark line | `build-liquid.py:373-380` | `plog("start", t, WHY.get(t), {block, ov, on:radioOn, side:HMSIDE.f, mu, sm:SIMPLE, dk, bpm, bs})`, placed before `rotMark` so the previous play time is still readable |
| Aired | `firstLogged = true; pushHistory(current);` | `e05:490` | `plog("air", v)`: the first track's real start |
| State changes | `function onState(k, st){` | `e05:524` | Playing time and buffering count |
| Progress | Watchdog, before `RIG.setProgress` | `e05:683` | Position, duration, seconds sidelined or muted. Memory only; saved every 30 s or on end, never per tick |
| End, crossfade | `try{ out.yt.stopVideo(); }catch(e){}` | `e05:663` | `"xfade"` with the outgoing position and duration |
| End, phone crossfade | `if(x >= 0.5 && !swapped){...}` | `e05:617` | `"xfade-simple"` |
| End, every other | `function hardNext(reason){\n  if(swapPending) return;` | `e05:566-567` | End with `reason`: ended, error, stalled, dev, focus |

`hardNext` only special-cases `"ended"`, so passing names to the 3 callers that pass none changes no behaviour:
- `setTimeout(hardNext, 350)` (`e05:1171`) gets `"skip"`.
- `if(!inc.ready){ hardNext(); return; }` (`e05:629`) gets `"inc-not-ready"`.
- `transitioning=false; hardNext(); }` (`e05:645`) gets `"xfade-timeout"`.

Other events:
- `if(bad){ deadIds[bad.v] = true; }` (`e05:547`): `dead` event with videoId, error code, deck, active or incoming.
- `if(code === 153 || code === 2){` (`e05:539`): `blocked` event.
- `    currentBlock = bk;\n    buildQueue();` (`build-liquid.py:360-371`): `block` event with from, to, bridgeG, forceGenre and `devQ.length`. Optional fix for the `?dev` lag: put the `devQ` tracks back at the front of their pools and empty `devQ`.
- `function sideFade(key, on, ms){\n  HMSIDE.src[key]=!!on;` (`build-liquid.py:194-218`): `side` on/off for focus, arcade and tapes.

**`HMDEV` additions** (edit the literal in `build-liquid.py:54-59`). All read-only copies, so the panel never disturbs the queue:
- `state()`: block, override, current genre, `runLeft`, `bridgeG`, `forceGenre`, current track, `radioOn`, `SIMPLE`, `transitioning`, side, muted, dead ids, peeked ids.
- `pools()`: the remaining videoIds in each genre's deck.
- `gbpm`, `adj`, `runFor`, `blockAt`.

The dev tabs must not call `peek()`: it advances the queue.

**What each row records** (short keys):
- When: session id and sequence number, pick, on-air, playing and end times.
- What: block, override flag, genre, artist and title (cut to 80 characters), videoId, BPM and whether it is exact.
- Why: genre branch (`gw`: run, adj, adj2, bpm, weighted, force), bridge, opener, never-played, previous play time, peeked, duplicate swap, `runLeft`, pool remaining.
- How it ended: end reason, seconds reached, video duration, seconds sidelined or muted, buffering count, phone mode, deck, picked-before-air flag.

Possible end reasons: xfade, xfade-simple, ended, skip, dev, focus, error, stalled, xfade-timeout, inc-not-ready, superseded, unload, unload-before-air. Measured rows average about 340 bytes.

**Storage.**
- Keys: `hm_plog` = `{v:1, r:[rows]}` as a ring of 2000 (about 700 KB) and `hm_plog_ev` as a ring of 400. Browsers allow about 5 MB per origin.
- The origin is `hikilinkuja.github.io`, shared by both rooms and by any other Pages project of that account. The classic room uses only `hm_vol` (verified).
- Two open tabs: on save, re-read the stored log and merge by (session, sequence).
- If the quota is exceeded, keep only the newer half.
- Final save on `pagehide` and on `visibilitychange` to hidden.
- Inference, not tested here: Safari may delete script storage after 7 days without a visit, and that would also wipe `hm_rot`.
- The recorder runs always; the panel is shown only with `?dev`. The data never leaves the browser and must not be committed to the public repository.

**Export.** Blob plus a link with `download`: `home-music-playlog-YYYYMMDD-HHMM.csv` (fixed columns, quoted) and a JSON file with rows and events. Plus a Clear button with confirmation.

**Prototype results (verified with the stub).**
- Rows came out as `weighted/xfade 35.5/50`, `run/xfade 35.3/50`, `dev 12/50`, `error 5.6/50` plus a `dead` event with code 150.
- On a phone viewport: `xfade-simple 30.4/50`.

From this, a finding (verified in the stub, cause inferred from code): every crossfaded track loses about the last 14.5 s on desktop and about 19.6 s on phones. The crossfade starts 24 s before the end (`XFADE_LEAD=24`, `e05:11`, sized for the classic room's 11 s vinyl routine), but the liquid `RIG.prepare` calls back after 3.1 s (`l04:11-14`). This bears directly on "music stops before it finishes".

Also verified in code: the vinyl and crossfade sounds keep playing during focus. `FX.master` is never scaled by `HMSIDE`, which only changes the YouTube volume (`build-liquid.py:219-222`; `FX.setVol` is called only from the slider, `e05:818-821`). The `side` events will show this in the log.

## 3b. Dev panel: tabs and the per-bracket bank

**Panel.** `l09` turns `#devPanel` into tabs: Next (the current list, moved in), Log, Banks, Engine.
- Wide mode for the last three: `min(760px, 100vw-24px)`, scrolling.
- Toggle key "d", ignored while typing in INPUT or TEXTAREA. "d" is not bound anywhere today.
- Stack it above focus (z-index 88) if it should be usable there.
- Move `l06:556-580` into `l09` and fix the "n" key's input check there.

**Log tab.**
- The last 60 rows: time, block, genre, track, why, end, seconds played / duration.
- Totals:
  - ends by reason;
  - median tail lost on crossfade;
  - per block: airtime share against crate share;
  - distinct tracks per hour and replays within 24 h;
  - gap or overlap between tracks;
  - error codes;
  - share of time sidelined.
- Export buttons.

**Banks tab.** For each of the 7 sub-blocks, read from `BLOCKS`, `TRACKS`, `HMROT.map`, `HMDEV.state()` and `HMDEV.pools()`:
- Header: label, hours, total alive, total never played; the current block highlighted.
- Per genre: alive and dead counts, never played, played, oldest play, number of `op:1` tracks, GBPM and exact-BPM count, run cap, tracks left in the deck, and which in-block genres reach it through `ADJ` (otherwise "weighted only").
- uk_garage flagged as shared between skank and pressure.
- An "off the grid" line: lofi 10, focus_zen 27.
- Expandable track lists with per-track status (never played, last played, dead, peeked, position in deck).

## Prototype files (scratch, not in the repo)

The prototype is enough to start from, but it is not the final code. Fix before porting:
- the "enters from" column: say "weighted only" instead of "unreachable";
- the run column: show the cap, not a random sample.

Files are in scratchpad/understand:
- section10.py
- proto/l03-plog.html
- proto/l09-dev.html
- proto/l05-proto.html
- banks.png
- log.png
- sim.js