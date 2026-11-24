# Methodology — Fearless Draft Board

## The problem

Fearless Draft (introduced in LoL esports in 2025) changes series preparation fundamentally. In a best-of series, any champion **picked** in an earlier game is unavailable for the rest of the series. Bans reset every game; picks do not. The consequences compound:

- By Game 4 of a BO5, 30 champions are removed from each team's options.
- Roles with small pools run out first. ADC has only 28 champions in the entire game; after two games of ADC picks and bans, a team can be down to a handful of viable marksmen.
- A coach who forgets a Game 1 pick can waste a ban, a pick, or a timeout on a champion that was never legal.

Coaches currently track this on spreadsheets or whiteboards, which break under stage pressure. Fearless Draft Board replaces that with a single tool that enforces the rule automatically.

## Approach

### 1. Draft state machine

The tool models a series as a strict state machine, not a freeform board:

- **Draft order** is the standard professional sequence, enforced turn by turn: 6 bans (alternating), 6 picks (B, R, R, B, B, R), 4 bans (R, B, R, B), 4 picks (R, B, B, R). A champion can only be placed in the current slot; there is no way to place a pick out of order.
- **Undo** reverses exactly one action, so a misclick is recoverable without restarting the draft.
- **Finish game** is only enabled when all 20 draft actions are complete. Finishing locks the game's 10 picks and advances the series.

This matters because the most common draft-tool failure is letting the user create an illegal state. By making illegal states unrepresentable, the tool is trustworthy on stage.

### 2. Fearless locks

When a game is finished, its 10 picked champions are recorded in a lock table (`championId → game number`). From then on:

- A locked champion cannot be picked or banned in any later game.
- The lock list shows each champion with the game it was used in, so the reason is always visible.
- Bans from earlier games do **not** carry over — only picks are locked, matching the actual Fearless Draft rule.

### 3. Recommendation engine (transparent, rules-based)

The pick recommender suggests up to 5 champions for the current slot. It is deliberately rules-based and fully transparent — every suggestion carries its reasons, and the scoring function is short enough to read in one sitting (`recommend()` in `app/js/engine.js`).

Inputs, in priority order:

1. **Lane fit (largest weight).** Champions whose primary lane matches the slot score highest; champions that *can* play the lane (multi-lane) score lower. Lane data comes from Riot's `client_positions`, not from guesswork.
2. **Team-comp gaps.** The engine inspects the team's picks so far (class tags, attack/magic/defense ratings from Data Dragon):
   - If the team has no frontline (no Tank tag and no high-defense champion), tanks are boosted.
   - If the team has no magic damage, mages are boosted.
   - If the team has no physical damage, high-attack champions are boosted.
3. **Class diversity.** Stacking the same class three times is penalised, so the tool does not suggest a fourth assassin into an all-assassin comp.
4. **Execution reliability.** Low-difficulty champions get a small bonus — in a high-pressure series game, a reliable pick beats a flashy one.
5. **Lane-specific traits.** Long-range ADCs and utility supports get a small bonus in the bot lane.

What the engine does **not** do: it does not use win rates, matchup tables, or pro pick rates. Those would require a live data feed and a statistical model, and inventing them would be dishonest. The engine's job is to narrow a 173-champion pool to a short, defensible list for a human coach to choose from — not to make the decision for them.

### 4. Pool health

For each lane, the tool counts champions still available (not banned, picked, or fearless-locked) and shows the remaining fraction. This is the single most useful Fearless Draft signal: it tells a coach *before* Game 3 that ADC is down to 12 champions, so they should secure their marksman early in Game 3 rather than saving it for later.

### 5. Data pipeline

- **Roster, classes, stats:** Riot Data Dragon, patch 16.23.1, `champion.json` (public, no key). Downloaded and frozen into `app/js/data.js` so the tool is deterministic and works offline.
- **Lanes:** Riot's `client_positions` from the League of Legends Fandom wiki (`Module:ChampionData/data`, 172 champions). The three champions newer than that module — **Yunara** (ADC), **Locke** (Mid), **Zaahen** (Top) — were verified against patch 26.22 tier lists; see `data/ROLES.md`.
- **Portraits:** Data Dragon square icons, bundled locally (`app/img/champion/`, 173 files) so the tool works with no network on stage.

## Limitations (honest)

- **No live data.** The tool does not fetch live match results, scrim data, or patch win rates. A coach who wants live meta data should pair it with their own scouting. The tool's value is in enforcing the Fearless rule and narrowing the pool, not in predicting the meta.
- **Lane assignments are Riot's intended positions**, not a per-team scrim reality. A champion that a specific team plays off-role (e.g., a mid laner playing a "top" champion in mid) will not be flagged as a mid option unless Riot lists it there. Each pick slot's role is editable, so a coach can override it.
- **Recommendations are a starting point**, not a draft call. The final pick is always the coach's.

## Verification

- **Engine unit tests** (`node tests/run-tests.js`): draft order (20 turns), fearless locks enforced, bans reset between games, undo, recommendations (valid lane, all available), pool health bounds, series ends at 3 wins in a BO5, summary includes locks. 7/7 pass.
- **Headless-browser end-to-end test** (`node tests/cdp-test.mjs`): full 20-turn draft via real clicks, finish game, 10 fearless locks rendered, recommendations on first pick, undo, lane filter (41 jungle champions), search. 0 console errors, 0 failed requests.
