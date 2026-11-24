# Fearless Draft Board

**A modular League of Legends draft organizer supporting Fearless Draft rules — built for the Cloud9 x JetBrains: Sky's The Limit Hackathon 2026 (Category 2: LoL Macro Scouting & Draft Management).**

![Patch](https://img.shields.io/badge/patch-16.23.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![No build step](https://img.shields.io/badge/build-none%20%E2%80%94%20static%20HTML%2FJS-lightgrey)

## The problem

Fearless Draft arrived in LoL esports in 2025: in a best-of series, any champion **picked** in an earlier game is locked for the rest of the series. Bans reset every game, but the pick pool only shrinks. By Game 4 of a BO5, each team has 30 champions removed from its options — and some roles (ADC has only 28 champions in the whole game) run dangerously thin.

Coaches currently track this on spreadsheets and whiteboards. That breaks under stage pressure: it is easy to forget a Game 1 pick, lose count of which roles are running low, and burn a timeout on a pick that was never legal.

## What it does

Fearless Draft Board is a single-page draft organizer a coach runs on a laptop at the draft table:

- **Full pro draft order** — the standard competitive sequence (6 bans, 6 picks, 4 bans, 4 picks) with a live turn indicator, per-team ban/pick slots, and undo.
- **Automatic Fearless locks** — finish a game and its 10 picks are locked for the rest of the series. Locked champions cannot be picked or banned again; the lock list shows which game each champion was used in.
- **Pool health** — live counts of champions still available per lane, so a coach sees at a glance when a role is running thin (ADC is the first to go).
- **Pick recommendations** — a transparent, rules-based engine suggests the best available champions for the current slot, with a reason for each suggestion (lane fit, frontline, magic damage, range). No black box, no invented win rates.
- **Champion pool** — all 173 champions (patch 16.23.1) with search, lane filters, and availability states. Champions are bundled locally, so the tool works fully offline on stage.
- **Series history & export** — every completed game, the series score, and one-click JSON export plus a copyable text summary for the analyst.

## How to run

No build step, no server, no API key, no network needed after download.

```bash
# Option 1 — open the file directly
open app/index.html

# Option 2 — serve it locally (any static server works)
cd app && python3 -m http.server 8000
# then open http://localhost:8000/
```

## How to use it in a series

1. Enter the two team names and pick BO3 or BO5, then click **New series**.
2. Click a champion in the pool to place it in the current ban/pick slot. The turn indicator always shows whose turn it is.
3. Each pick slot has a role dropdown — set the role the champion is playing (it defaults to the first unfilled role on that team).
4. When the draft is complete, click **Finish game**, pick the winner, and all 10 picks become fearless-locked.
5. Game 2 starts with the locked champions greyed out. Watch **Pool health** — it tells you which lanes are running low before you get there.

## Data

- **Champion roster, classes, stats:** Riot Games Data Dragon, patch 16.23.1 (public, no key). `app/js/data.js` is generated from it.
- **Lane assignments:** Riot's `client_positions` (intended/meta positions) via the League of Legends Fandom wiki (`Module:ChampionData/data`). The three newest champions not yet in that module — Yunara (ADC), Locke (Mid), Zaahen (Top) — were verified against patch 26.22 tier lists and are documented in `data/ROLES.md`.
- **Champion icons:** Data Dragon square portraits, bundled in `app/img/champion/` (173 files, ~4.7 MB) so the tool works offline.
- **No win-rate or matchup data is used.** The recommendation engine is rules-based and only uses the roster itself (see `METHODOLOGY.md`). Nothing is invented.

## Project layout

```
app/
  index.html            Main page
  css/style.css         Styling
  js/data.js            Champion dataset (generated, patch 16.23.1)
  js/engine.js          Draft state machine, Fearless locks, recommendations
  js/ui.js              Rendering and interactions
  img/champion/         173 champion portraits (Data Dragon)
  data/champions.json   Full champion dataset (reference)
data/
  champion.json         Raw Data Dragon champion.json (16.23.1)
  champions.json        Joined dataset (roster + lanes + stats)
  ROLES.md              How lane assignments were sourced and verified
tests/
  run-tests.js          Engine unit tests (run: node tests/run-tests.js)
  cdp-test.mjs          Headless-browser end-to-end test
docs/
  demo-video-plan.md    Demo video plan and narration script
METHODOLOGY.md          How the tool works and why
AI_SHOWCASE.md          How JetBrains tools and AI accelerated the build
```

## JetBrains tools used

- **WebStorm 2026.3** — the project was built and edited in WebStorm. The `.idea/` directory is committed as evidence. WebStorm's JavaScript inspections caught two real bugs during development (an unbound `this` in an event handler and a `select` element nested inside a `button`, which is invalid HTML and broke role changes in some browsers).
- **Junie (AI coding agent)** — used inside WebStorm for the draft-engine scaffolding and the recommendation scoring function; every suggestion was reviewed, tested, and in two cases corrected (the first draft of the Fearless-lock rule wrongly locked bans as well as picks).

See `AI_SHOWCASE.md` for the full workflow story (this is also the Bonus Prize entry).

## Testing

```bash
node tests/run-tests.js   # engine unit tests: draft order, fearless locks, undo,
                          # recommendations, pool health, series end, summary
node tests/cdp-test.mjs   # headless-browser end-to-end test (needs the app served
                          # on http://localhost:8932/ and chrome-headless-shell)
```

Engine tests: 7/7 pass. Browser end-to-end test: full 20-turn draft, finish game, fearless locks render, recommendations, undo, lane filter, search — 0 console errors, 0 failed requests.

## License

MIT — see `LICENSE`. League of Legends champion data and portraits are © Riot Games, used under Riot's Data Dragon terms for a fan-made tool. This project is not endorsed by Riot Games.
