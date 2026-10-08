# Research report: the SoundCloud link and a comment section for the radio (no repository files changed)

## Note on tools
- WebSearch was unavailable because the turn's shared budget of 200 searches was already used up.
- WebFetch could not resolve most hosts, including soundcloud.com, giscus.app, developers.soundcloud.com, docs.github.com and wikipedia.org. It did work for github.com.
- Parallel Search was rate-limited most of the time; only four of its calls succeeded.
- Because of this, I could not run any search for a matching YouTube upload. Where a statement below rests on my own knowledge and not on a source, I say so.

---

## 1. https://on.soundcloud.com/qlz3ssIMuiOLfJq4PN

### What it points to: not identifiable from this session
- **Verified (Parallel fetch):** the short link resolves to a SoundCloud error page. The title is «Something went wrong on SoundCloud» and the body reads «We can't find that playlist.» That wording is used for playlists, so the link points to a SoundCloud playlist (a "set"), not a single track. That playlist is not publicly reachable.
- **Verified:** SoundCloud's oEmbed endpoint, called with the short URL, returned HTTP 404. This does not settle anything, because oEmbed may not accept the on.soundcloud.com short form.
- **Inference, three possible causes:** the playlist was deleted; it was made private after the link was shared; or it is region-limited for the fetcher. I cannot tell which.
- **Unknown:** artist, title, duration, genre, whether it is on YouTube, and which station genre key it fits. I have no evidence for any of these and will not guess.
- **Needed from Paulo:** the full soundcloud.com/... URL (from «Copy link» in the app, or the secret-link form containing /s-XXXX), or a screenshot of the tracklist.
- **Local search:** neither the repository nor ops/HANDOFF.md / ops/LOG.md mention this link or the code «qlz3ss».

### What to do, depending on what it turns out to be
These follow from the project rules in CLAUDE.md.

**(a) A playlist of separate tracks to import**
- Each track goes through the normal import protocol: the «Artist - Topic» channel first, then the official channel, then another upload that confirms artist and title.
- It ends up as normal `TRACKS` entries with a YouTube `v` id. No engine change is needed.
- The genre key is decided track by track against the 20 keys.

**(b) One DJ mix or set longer than 21 minutes**
- CLAUDE.md excludes sets and mixes over 21 minutes from the rotation, so it must not go into `TRACKS`.
- Its natural place is the Mixtapes drawer, which already plays SoundCloud. Details under option A below.

**(c) A short track that exists only on SoundCloud**
- This would need SoundCloud playback inside the rotation: option B below, with its licensing problem.

### What exists locally (verified)
- The liquid room already uses the official SoundCloud Widget API for Weronika's two tapes.
  - Markup: `liquid/l02-body.html:159-197` (the `#mixPanel` drawer). The iframes at `:172` and `:183` carry `allow="autoplay"`. The backlink is at `:170`.
  - CSS: `liquid/l01-head.html:207-216`. The widget is collapsed to height 0 by `.schost`, and only unfolds as a fallback.
  - Code: `radio/e05-engine.html:1045-1110`, generated into `liquid/l05-engine.html:1156-1221`.
    - `scApi` loads `w.soundcloud.com/player/api.js`.
    - `scWidget` binds the READY, PLAY, PAUSE, FINISH, PLAY_PROGRESS and ERROR events.
    - `scToggle` (`e05:1095-1104`) unfolds the native widget after 2.6 s if playback has not started. The code comment there reads «consentimento por dar, bloqueio», meaning consent not yet given, or blocked.
    - On the first PLAY, the code fires `FX.needleDrop()` and `FX.crackleBurst(1.4)` (`e05:1068-1072`).
  - The radio gets out of the way when a tape plays. Transformation 7 in `liquid/build-liquid.py:194-221` replaces `mx2SideRadio` with `sideFade("tapes")`, a 700 ms fade (output in `l05:1063-1078`). The volume factor `sdf` is added to `applyVol` (`build-liquid.py:219-220`, giving `l05:464-470`), on top of `fdk`, the focus-mode ducking factor added by transformation 6 at `:132`.
- The tape code is hard-wired for exactly two tapes: `var SCT=[{...},{...}]` at `e05:1046` and `[0,1].forEach` at `e05:1105`. Since e05 is frozen, a third tape needs a new transformation in build-liquid.py that replaces those two strings, plus new markup in l02.

### Option A: add it as a tape (low cost, on demand, not in rotation)
- One new `.dw-tape` section in l02 (`scPlay2`, `scBar2`, `scFill2`, `scTime2`, `scHost2`) and the build transformation described above.
- The fade-aside, needle drop and backlink pattern can be reused as they are.

### Option B: SoundCloud tracks inside the rotation (high cost, and a licensing obstacle)

**Licensing (verified, SoundCloud API Terms of Use, via Parallel)**
- The terms forbid, unless explicitly licensed, «any playback experience which aggregates and streams User Content with content from other services (e.g. SoundCloud with YouTube)». They also forbid «any service that aggregates and streams User Content from multiple users into an on-demand listening service».
- Attribution is required: credit the uploader, credit SoundCloud as the source, and show «clearly visible backlinks ... to the URL for the relevant sound on soundcloud.com».
- File-save, download and offline access are forbidden; only session caching is allowed.
- **Inference:** a mixed YouTube and SoundCloud rotation falls under the first prohibition. I have not confirmed whether these API terms also cover a plain widget embed. The existing tapes shelf, which sits next to a YouTube tape, is a milder case: playback is on demand, the backlink is visible and the uploader is named.

**Track availability (verified, `github.com/soundcloud/api` openapi/api.yaml)**
- `access` can be `playable`, `preview` («a snippet is available») or `blocked` («no streaming is possible»).
- `available_country_codes` exists, so tracks can be region-limited.
- `embeddable_by` is marked `deprecated: true`, so there is no reliable per-track embedding flag to check in advance.
- Issue #535 in `soundcloud/api` reports the widget failing for some major-label tracks: the HLS stream URL returns 404. No cause is stated.
- **Inference:** a `preview` track would fire FINISH after the snippet, and the radio would skip on early.

**Widget API facts (verified, developers.soundcloud.com/docs/api/html5-widget, via Parallel)**
- Methods: `play`, `pause`, `toggle`, `seekTo(ms)`, `setVolume(0-100)`, and `load(url, options)`, which reloads the iframe and takes a `callback`.
- Getters are asynchronous and take callbacks: `getVolume`, `getDuration` (ms), `getPosition` (ms), `getSounds`, `getCurrentSound`, `getCurrentSoundIndex`.
- Audio events: LOAD_PROGRESS, PLAY_PROGRESS (`currentPosition` in ms, `relativePosition` from 0 to 1), PLAY, PAUSE, FINISH, SEEK. UI events: READY, CLICK_DOWNLOAD, CLICK_BUY, OPEN_SHARE_PANEL, ERROR.
- Embed parameters: `auto_play`, `single_active`, `start_track`, and others. With `single_active` left at its default, playing one SoundCloud player pauses the others on the page. A SoundCloud-to-SoundCloud crossfade therefore needs `single_active=false`.

**What the engine would need (verified call sites; the design is my inference)**
- **Decks:** `P.A`/`P.B` are YouTube players (`e05:375-438`): `makePlayer` at `:426`, and `ensureLoaded`/`loadVideoById` at `:421-425`. They would need a source adapter with play, pause, load, setVolume, state, time and duration.
- **Watchdog:** it polls synchronous getters (`getPlayerState`, `getCurrentTime`, `getDuration`) at `e05:674-685` (`l05:752+`) and starts the crossfade at `XFADE_LEAD=24` s before the end (`e05:11`). For SoundCloud it would have to read a position cached from PLAY_PROGRESS, converted from ms to seconds.
- **States and errors:** `onState` (`e05:524`) uses YouTube state codes and would map to PLAY/PAUSE/FINISH. `onYtError` (`e05:537`) would map to the ERROR event. The dead-track list `deadIds` is keyed by `t.v` (`e05:330`, `:335`).
- **Catalogue and validator:** `validate.py:58-64` rejects any `v` that is not exactly 11 characters, and duplicates. A field such as `sc:"https://soundcloud.com/..."` would need a validator change.
- **Volume:** `applyVol` uses `yt.setVolume` (`e05:389-393` becomes `l05:464-470` after transformations 6 and 7). SoundCloud's `setVolume(0-100)` maps one to one.
- **Phones:** transformation 4 (`build-liquid.py:68-76`) pins the volume at 100 on screens 760 px wide or less, because software volume is unreliable there (the repo comment says it is ignored on iOS). I expect the same for SoundCloud, so on phones a crossfade would become a cut. I did not find an external source for iOS volume in this session.
- **Autoplay (verified, MDN mdn/content autoplay guide):** audible autoplay needs user interaction with the site or a Permissions Policy grant. The `autoplay` policy's default allowlist is `self`, so a cross-origin iframe needs `allow="autoplay"`; the tape iframes already have it.
  - **Inference:** later programmatic plays in an unattended rotation can still stall on the SoundCloud consent banner. The 2.6 s fallback would have to become a skip (`hardNext`), not an unfold.

**Recommendation (inference)**
- Do not put SoundCloud into the rotation, because of the «SoundCloud with YouTube» clause.
- If the content is a mix, use option A.
- If it is tracks, look each one up on YouTube under the import protocol.

---

## 2. Comment section for a static GitHub Pages site

### Repository facts (verified with `gh api repos/hikilinkuja/home-music`)
- `visibility: public`, `has_discussions: false`, `has_issues: true`, owner type `User`.

### A design constraint from the engine (verified)
- Each listener's track order is built in the browser: `shuffle` uses `Math.random` (`e05:324-325`, `:346`, `:355`), and the rotation memory is kept per browser in localStorage (`hm_rot`, `l05:348-355`, from transformation 8 at `build-liquid.py:275-290`).
- The programme block comes from the visitor's local clock (`blockKeyFor`, `l05:306`).
- **Inference:** listeners are not hearing the same record at the same moment, so a live chat about "now" does not fit. Comments should attach to a record (its videoId), a programme block, or a single shared guestbook.

### Backends

**giscus (GitHub Discussions)**
- What Paulo must do (verified, giscus `locales/en/config.json`):
  - keep the repository public;
  - install the giscus app;
  - turn on Discussions (currently off);
  - use a category with the Announcements format, which is recommended. In that format only users with elevated repository roles can open discussions; everyone can comment and reply (verified, github/docs reusable `about-announcement-format.md`).
- How it works (verified, giscus README): it searches Discussions by a mapping (pathname, URL, title, og:title, a specific term, or a discussion number). The giscus bot creates the discussion on the first comment or reaction.
- Commenters need a GitHub account and must authorise the giscus app through OAuth, or comment on GitHub directly.
- Privacy (verified, giscus `PRIVACY-POLICY.md`): «We do not collect any data» and no cookies; a «server-encrypted token» is kept in localStorage.
- Embedding control (verified, giscus `ADVANCED-USAGE.md`):
  - a `giscus.json` file can restrict `origins`, which can be set to https://hikilinkuja.github.io;
  - the page can send `setConfig` by postMessage to change `term` without reloading, so one thread per videoId or per block is possible;
  - with `emitMetadata`, the page receives only `discussion` and `viewer`, not comment bodies. **Inference:** the page cannot restyle or re-time comments itself.
- Moderation (verified, github/docs):
  - lock a discussion; edit or delete comments; block users;
  - three types of temporary interaction limits: existing users, prior contributors, collaborators only.
- There is no spam filter beyond the GitHub-account barrier.

**utterances (GitHub Issues)**
- Requirements (verified, `src/configuration-component.ts`): a public repository and the utterances app installed. It offers the same mappings, including «specific term».
- Privacy (verified, privacy policy): it «does not collect any personal information», and it stores the API token in a cookie.
- **Inference:** comments would mix into the issue tracker. giscus does the same job using Discussions and provides a migration path from utterances.

**Reading GitHub data directly from the page**
- **Verified, github/docs:** unauthenticated REST calls are allowed for public data, limited to 60 requests per hour per IP. GraphQL examples always use a token.
- **Inference:** a custom display, such as dubplate labels or timed pop-ups, should either read REST sparingly or read a static JSON built by a GitHub Action.
- The Action pattern already exists in the repository: `.github/workflows/dance.yml` runs on cron «17 3 */2 * *» with `contents: write` and commits `events/europe.json`.
- **Verified, github/docs:** a prefilled issue URL accepts `title`, `body`, `labels` and `template`. Without the needed permissions it returns 404.

**Bluesky replies**
- **Verified:** the npm package bluesky-comments 0.13.1 (published 2025-10-06) calls `public.api.bsky.app/xrpc/app.bsky.feed.getPostThread` and `searchPosts`. Its ES bundle sends no `Authorization` header.
- Each page is tied to one Bluesky post `uri`. The README says auto-discovery by author is «not very reliable». Moderation is client-side filters only.
- Commenters need a Bluesky account (inference).

**Mastodon replies**
- **Verified, mastodon/documentation:** `GET /api/v1/statuses/:id/context` works without a token for public posts. Since version 4.0.0 it is limited to 40 ancestors, 60 descendants and depth 20.

**Cloudflare Worker + KV + Turnstile (anonymous, no account needed)**
- Verified free limits (cloudflare-docs):
  - Workers: 100,000 requests per day; 10 ms CPU per request.
  - KV: 100,000 reads per day; 1,000 writes per day; 1 GB storage.
  - Turnstile: free, up to 20 widgets. Server-side Siteverify is mandatory; each token is valid for 300 s and can be validated once.
- **Inference:**
  - Paulo needs a Cloudflare account;
  - the Turnstile secret lives in the Worker's secrets, so it stays out of the public repository (as CLAUDE.md requires);
  - the approval queue has to be built.

**Not recommended**
- **Cusdis:** archived on 17 July 2026 and deprecated (verified, GitHub).
- **Staticman:** needs its own hosted instance and commits user submissions into the repository (verified, README). **Inference:** that conflicts with the CLAUDE.md rule against storing personal data in this public repository. The Action-built JSON approach has the same issue, more mildly.
- **Remark42 and Isso:** self-hosted servers. Remark42 runs on Docker or a binary (verified), which is out of scope with no server.
- **Disqus:** not verified in this session.

### Five concepts that fit the radio

1. **Dubplate box (guestbook)**
   - Each signature is "cut" as a white-label acetate showing name, city and the date it was "cut", stored in a crate the visitor flips through.
   - An optional one-line «special» namechecks Home Music.
   - Source for the idea (verified, Wikipedia «Dubplate»): a dubplate is an acetate disc used by sound systems to play exclusive music; «dubplate specials» used «vocals specially recorded to namecheck the sound system».
   - Backend: one fixed giscus discussion (mapping = number), or a daily Action-built JSON so the labels can be custom-drawn.

2. **Shout-out line read by the MC**
   - Moderated short dedications appear in the gap between records through the MC overlay `showLine` (`liquid/l06-art.html:20-27`), styled like `MC_LINES` (`radio/e03-data.html:2561-2568`). It uses `textContent`, so the text cannot inject markup.
   - Source for the idea (verified, Wikipedia «Pirate radio in the United Kingdom»): 1990s rave pirates ran «listener participation through 'shouts' - enabled by the growth of pagers and mobile phones».
   - Can be styled as a pager readout. Approval before airing is mandatory. Backend: Worker + Turnstile.
   - There is a dormant hook: the `t.rec` credit «a present from ...» (transformation 5, `build-liquid.py:101-116`; `#tRec` at `l02-body.html:75`) is used by 0 catalogue entries.

3. **Pull-up meter on each record**
   - A «WHEEL UP» button adds to a counter per videoId.
   - Above a threshold, the next airing of that record opens with `FX.rewind` (`e05:219-228`) plus `FX.siren` (`e05:67`). It stays symbolic and never restarts the track, so it cannot fight the rotation.
   - Backend: giscus reactions with term = videoId (needs GitHub login), or a KV counter (aggregate writes against the 1,000-per-day limit).
   - I could not source the rewind/pull-up custom in this session; it rests on my own knowledge.

4. **Notes pinned to a moment in the record**
   - Comments carry a timestamp («[2:31] that bassline») and float up on the visual (VJ) layer, `l04-vj.html`, when that second airs for any later listener.
   - This fits the unsynchronised design, because it is asynchronous.
   - It needs the comment bodies, which giscus does not expose (verified), so it would use Issues REST or a Worker.

5. **One logbook per programme block (dawn, kingston, groove, flight, skank, pressure, afterhours)**
   - One giscus thread per block, switched by `setConfig({term})` when the block changes, like a phone-in per show.
   - This is the cheapest of the five. It can sit next to the Session Log panel (`l02-body.html:151-156`; `pushHistory` at `e05:789-806`).

### Recommended tiers (inference)
- **Zero infrastructure:** concept 5 or 1 on giscus, after enabling Discussions, installing the app and setting `giscus.json` origins. The cost is that every commenter needs a GitHub account.
- **Anonymous dedications:** concepts 2 and 3 on Worker + KV + Turnstile with an approval step.

### Sources
- Parallel fetches: on.soundcloud.com/qlz3ssIMuiOLfJq4PN; developers.soundcloud.com/docs/api/html5-widget; developers.soundcloud.com/docs/api/terms-of-use; en.wikipedia.org/wiki/Dubplate; en.wikipedia.org/wiki/Pirate_radio_in_the_United_Kingdom.
- github.com/soundcloud/api: `openapi/api.yaml` (downloaded to the scratchpad `understand/scapi/`), issues #535 and #502.
- github.com/giscus/giscus: README, PRIVACY-POLICY.md, ADVANCED-USAGE.md, locales/en/config.json.
- github.com/utterance/utterances: README, PRIVACY-POLICY.md, src/configuration-component.ts.
- github.com/github/docs: interaction-limit reusables, moderating-discussions.md, about-announcement-format reusable, creating-an-issue.md, primary-rate-limit-unauthenticated-users reusable, forming-calls-with-graphql.md.
- github.com/mastodon/documentation: methods/statuses.md.
- github.com/cloudflare/cloudflare-docs: Workers limits, KV limits, Turnstile plans, Turnstile server-side validation.
- github.com/mdn/content: media/guides/autoplay; Permissions-Policy autoplay.
- github.com/djyde/cusdis, github.com/eduardoboucas/staticman, github.com/umputun/remark42, github.com/czue/bluesky-comments.
- npm: bluesky-comments 0.13.1 (endpoints extracted to the scratchpad `understand/bsc/`) and the soundcloud-widget wrapper README.