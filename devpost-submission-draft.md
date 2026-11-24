# Devpost submission draft — Fearless Draft Board

Category: **Category 2 (LoL): Macro Scouting & Draft Management System**
Repository (to be created on publish): `https://github.com/guosongyi427-creator/fearless-draft-board`
Demo video: (to be produced — see `docs/demo-video-plan.md`, target < 3 min)

---

## What it does

Fearless Draft Board is a League of Legends draft organizer built for the Fearless Draft series format. In Fearless Draft, any champion picked in an earlier game is locked for the rest of the series — bans reset, picks do not — so the available pool only shrinks, and some roles run out first (ADC has only 28 champions in the whole game).

The tool gives a coach:

- **A full pro draft board** enforcing the standard competitive order (6 bans, 6 picks, 4 bans, 4 picks) with a live turn indicator, per-team ban/pick slots, and undo.
- **Automatic Fearless locks** — finish a game and its 10 picks are locked for the rest of the series; locked champions cannot be picked or banned again, and the lock list shows which game each champion was used in.
- **Pool health** — live counts of champions still available per lane, so a coach sees a role running thin before it becomes a crisis.
- **Pick recommendations** — a transparent, rules-based engine that suggests the best available champions for the current slot and explains each suggestion (lane fit, frontline, magic damage, range). No black box, no invented win rates.
- **A 173-champion pool** (patch 16.23.1) with search and lane filters, bundled locally so the tool works fully offline on stage.
- **Series history and export** — every completed game, the series score, one-click JSON export and a copyable text summary.

## How I built it

- **Stack:** static HTML/CSS/JavaScript — no build step, no server, no API key, no network dependency after download. Open `app/index.html` or serve the `app/` folder.
- **Data:** Riot Games Data Dragon (patch 16.23.1) for the champion roster, classes, and stats. Lane assignments from Riot's `client_positions` via the League of Legends Fandom wiki; the three champions newer than that module (Yunara, Locke, Zaahen) were verified against patch 26.22 tier lists. Champion portraits are bundled locally. No win-rate or matchup data is used — the recommender only uses fields actually present in the roster (see `METHODOLOGY.md`).
- **JetBrains tools:** the project was built in **WebStorm 2026.3**; the `.idea/` directory is committed as evidence. **Junie** (AI coding agent inside WebStorm) scaffolded the draft engine and the recommendation scorer. WebStorm's inspections caught two real bugs (an invalid `select`-inside-`button` nesting and a stale closure in the recommendation render). See `AI_SHOWCASE.md` for the full workflow story.
- **Testing:** 7 engine unit tests (`node tests/run-tests.js`) covering draft order, Fearless locks, undo, recommendations, pool health, series end, and summary — all pass. A headless-browser end-to-end test (`node tests/cdp-test.mjs`) plays a full 20-turn draft via real clicks, finishes a game, verifies 10 Fearless locks render, and checks recommendations, undo, lane filter, and search — 0 console errors, 0 failed requests.

## Challenges I ran into

- **Data Dragon does not publish lanes.** It publishes classes (Fighter, Mage, …), which are not lanes. The answer was Riot's `client_positions` in the Fandom wiki's Lua module, fetched via the MediaWiki API — but the API response is double-escaped, and my first two parsers matched nothing before I inspected the raw bytes. Three champions newer than the module needed separate verification.
- **Junie's first draft of the Fearless rule was wrong.** It locked bans as well as picks between games. In Fearless Draft only picks are locked. I caught it from domain knowledge and added a unit test that asserts a Game 1 ban is placeable in Game 2.
- **Junie's first recommender invented a "meta score"** that did not exist in the data. I replaced it with a transparent rules-based scorer that only uses verifiable roster fields.
- **A 512 MB `/tmp` RAM disk killed the WebStorm download** at exactly 512 MB. The fix was to download to the workspace instead — a reminder to check the filesystem before assuming a download failed for network reasons.

## Accomplishments that I'm proud of

- The draft state machine makes illegal states unrepresentable: you cannot place a pick out of order, pick a locked champion, or finish an incomplete draft. That is what makes it trustworthy on stage.
- Pool health — the single most useful Fearless Draft signal — is a one-glance panel, not a spreadsheet column.
- Everything is honest: lane sources are documented, the recommender's weights are documented, and the limitations (no live data, Riot's intended positions) are stated in `METHODOLOGY.md` rather than hidden.

## What I learned

- The hardest part of a sports-data tool is not the UI, it is deciding which data source is authoritative and how to verify the exceptions.
- AI is excellent at structure and terrible at knowing what it does not know. Constraining it to verifiable inputs matters more than the prompt.
- A strict state machine beats a freeform board when correctness under pressure is the requirement.

## What's next

- Optional GRID esports data integration for pro pick/ban rates, to power a "pro meta" view alongside the rules-based recommender.
- A scrim-mode that lets a coach pre-load an opponent's champion pool and simulate a series against it.
- Per-player champion pools (each player has their own comfort picks; the recommender should weight those).

## Built with

JavaScript (ES2022), HTML, CSS — no frameworks, no build step. Data: Riot Games Data Dragon 16.23.1, League of Legends Fandom wiki (`Module:ChampionData/data`). Tools: WebStorm 2026.3, Junie.

## Bonus prize — Best AI-Powered Workflow Story

See `AI_SHOWCASE.md` in the repository (also the direct URL for the bonus submission).

---

## Pre-submission checklist

- [ ] Publish the repo as `guosongyi427-creator/fearless-draft-board` (public, main, MIT LICENSE at root)
- [ ] Confirm `.idea/` is committed (JetBrains evidence) and `webstorm.tar.gz` is NOT committed
- [ ] Record the demo video (< 3 min) from `docs/demo-video-plan.md` and publish it as public on YouTube (劲松 channel)
- [ ] Host a working demo link (or note the repo + run instructions as the judge-accessible build)
- [ ] Register on Devpost for the hackathon (account 851284512gjsdml@gmail.com) if not already registered
- [ ] Submit on Devpost before Jan 12, 2027 11:00 AM PT (= Jan 13, 2027 03:00 CST), Category 2
- [ ] Include the AI_SHOWCASE.md link for the Bonus Prize
- [ ] Verify the repo README renders and the LICENSE is detected by GitHub
