Twelve MP3 previews are in `scratchpad/previews/` (192k, 44.1 kHz). They were rendered from the page's own FX code with nothing changed, at master volume 80, with no clipping and no normalising. No repository file was edited. The levels below are measurements only; I have not listened to the files.

**Snapshot.** The private copy is `scratchpad/work/previews/repo`. `bash ops/tools/build.sh` ended with "validacao OK". When I finished, `liquid/build-liquid.py` (md5 29d66ef8…) and `radio/e05-engine.html` were still byte-identical to the ones in the repository, so the previews match the current FX sources.

**How it was rendered.** Harness: `scratchpad/work/previews/render.js`.
- The built `liquid/index.html` was loaded in Chromium from a fake origin (`http://hm.local`, served from disk through `ctx.route`). The YouTube API was replaced by `understand/ytstub.js` and every other host was aborted. There were no page errors.
- The FX object is private inside the engine's closure. To reach it without changing the served code, I wrapped `Object.create` for one call to `HMFX.render('lift')`, which runs `Object.create(FX)` internally, and kept the object it passed.
- Each preview gets `R = Object.create(FX)` pointed at its own 2-channel 44.1 kHz OfflineAudioContext. The fields are reset exactly as the page's `fxRender` (`l05:1862`) resets them, then `R.chain(oc)` and the real `R.setVol(0.8)` run.
- That gives a master gain of 0.56, the same value `HMFX.level()` reports on the live page at load. The real `live()` was kept (it returns true at load).

**What I adapted, and why.**
- The page's own `fxRender` is mono at 48 kHz and uses master 0.7 (volume 100), so I could not use it as is.
- I used 2 channels at 44.1 kHz. The FX are mono, so left and right come out identical (measured: 0 differing samples).
- The changeover timing copies `endOfRecord` and `recDrop` (`l05:992-1039`), shifted so the lift starts at 1.0 s:

| Time | Event |
|---|---|
| 0 to 1.0 s | Silence (measured -inf) |
| 1.0 s | Lift |
| 1.42 s | Kit, if any |
| 2.5 s | Echo duck down (`duckEcho`), back up from 3.6 s |
| 3.0 s | Drop (lift + `GAP_S` 2.0) |
| 3.4 s | Next-record stand-in starts (drop + `DROP_TO_MUSIC_S` 0.4) |

- The stand-in is a 220 Hz sine at -20 dBFS peak. It opens linearly over 250 ms, as `recMusic` does, lasts 1 s, and goes straight to the output, not through the FX master. The plain changeover, and `01`/`02`, also start with 1 s of silence.
- The dub kit adds the phone tones in 40% of changeovers at random. I re-rolled until each case came up and rendered both (1 try each). This gives one extra file you did not ask for, `04b`. The wrapper on `phone` only records the call; it still runs the original `FX.phone`.
- There is no `05-kit-dub`, because `04` already is that kit.

**Measurements** (ffmpeg volumedetect on the MP3, with the WAV in brackets):

| File | Duration MP3 (WAV) | Mean dB | Max dB |
|---|---|---|---|
| 01-needle-lift | 2.482 (2.44) s | -43.7 (-43.4) | -17.8 (-17.4) |
| 02-needle-drop | 3.082 (3.05) s | -41.4 (-41.0) | -14.7 (-14.0) |
| 03-changeover-plain | 5.433 (5.40) s | -31.2 | -13.4 |
| 04-changeover-dub-kit | 5.433 s | -30.1 | -14.0 |
| 04b-changeover-dub-kit-phone | 5.433 s | -30.0 | -12.3 |
| 05-kit-backspin | 5.433 s | -31.1 | -13.7 |
| 05-kit-spinback | 5.433 s | -31.1 | -12.0 |
| 05-kit-tapestop | 5.433 s | -31.0 | -13.8 |
| 05-kit-riser | 5.433 s | -31.2 | -14.1 |
| 05-kit-siren | 5.433 s | -31.1 | -15.3 |
| 05-kit-airhorn | 5.433 s | -30.6 | -15.0 |
| 05-kit-echothrow | 5.433 s | -31.2 | -12.2 |

The MP3s run about 0.03 to 0.04 s longer than the WAVs; that is the MP3 encoder's padding. The highest peak anywhere is -11.3 dBFS (spinback WAV), and no sample reaches full scale (0 samples at or above 1.0 in every file).

**Level of each kit during the gap** (100 ms peak windows):

| Kit | Peak in the gap |
|---|---|
| Dub, airhorn | about -15 to -16 dB |
| Backspin, spinback, tapestop | -20 to -23 dB, then fading |
| Riser | -24 dB |
| Siren | -29 to -32 dB |
| Echothrow | -37 dB dry hit, then echoes at -26, -28 and -31 dB at +0.36 s steps |

The mean levels in the table look alike because the -20 dB stand-in tone dominates them. Siren and echothrow are about 10 dB below the other kits, so Paulo may find them faint. That is how the site plays them now, not a rendering fault.

Every echo tail is pulled down by the duck before the drop. After the stand-in ends the files are silent or below -85 dB.

**Uncertain or not covered.**
- The needle sounds and the dub kit are randomised, so each real changeover differs slightly from these renders.
- On a real site the music starts later than drop + 0.4 s, by however long YouTube takes to start.
- On touch devices the drop waits for the single player to be ready, so the 2 s gap can stretch there.
- Mobile forces volume 100, which would make every sound about 1.9 dB louder than these files.
- Headless Chromium ran at 44.1 kHz; many real devices run at 48 kHz, which does not change the sound's character.

Scratch files are in `scratchpad/work/previews/`: the float32 WAVs in `wav/`, the measurements in `render.out.json`, and the segment-analysis script `seg.py`.