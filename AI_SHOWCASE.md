# AI-Powered Workflow Story — Fearless Draft Board

*Bonus Prize entry: Best AI-Powered Workflow Story — how JetBrains tools and AI accelerated this build.*

## The tools

- **WebStorm 2026.3** (JetBrains IDE) — the entire project was built and edited in WebStorm.
- **Junie** (JetBrains AI coding agent, inside WebStorm) — used for scaffolding the draft engine and the recommendation scoring function.

## How AI accelerated the build

### 1. Junie scaffolded the state machine; I kept the rules

The draft engine is a strict state machine (20-turn pro draft order, Fearless locks, undo). I asked Junie to scaffold it from a one-paragraph spec. It produced a working first draft in minutes — but the first draft had a real rules error: it locked **bans** as well as picks between games. In Fearless Draft, only picks are locked; bans reset every game. I caught this because I knew the rule, corrected it, and added a unit test that specifically asserts a Game 1 ban is placeable in Game 2. AI got me to a testable draft fast; domain knowledge kept it correct.

### 2. WebStorm inspections caught two real bugs

- **An unbound handler.** A `select` element nested inside a `button` is invalid HTML. It rendered fine in one browser but the role dropdown silently failed to open in another. WebStorm's HTML inspection flagged the nesting; I restructured the slot so the select is a sibling, not a child, of the button.
- **A stale closure.** The recommendation list was computed from a captured `turn` object that went stale after undo. WebStorm's unresolved-variable inspection pointed at it; the fix was to recompute recommendations from the live series state on every render.

Both bugs would have shipped if I had only eyeballed the code. The IDE found them before the browser test did.

### 3. Junie wrote the first recommendation scorer; I made it honest

Junie's first scoring function used a "meta score" field that did not exist in the data — it would have been an invented number dressed up as analysis. I replaced it with a transparent, rules-based scorer that only uses fields actually present in the Data Dragon roster (lane, class tags, attack/magic/defense ratings) and documents every weight in `METHODOLOGY.md`. The lesson: AI is excellent at structure and terrible at knowing what it does not know. The fix was to constrain the scorer to verifiable inputs.

### 4. The data pipeline was the bottleneck AI could not remove

Getting a lane for all 173 champions took the most time in the whole project. Data Dragon does not publish lanes; CommunityDragon's "roles" are classes, not lanes. The answer was Riot's `client_positions` in the Fandom wiki's Lua module — which I had to fetch via the MediaWiki API and parse (the module is double-escaped in the API response, and my first two parsers matched nothing before I inspected the raw bytes). Three champions newer than the module needed separate verification against patch 26.22 tier lists. No AI tool could have done this reliably, because the answer required knowing *which* source is authoritative and *how* to verify the three exceptions. AI helped me write the parser; it could not choose the source.

## What AI did not do

- It did not choose the concept. The Fearless Draft insight — that the pool shrinks and ADC runs out first — came from understanding the format, not from a prompt.
- It did not verify anything. Every claim in this repo (lane assignments, draft order, the Fearless rule) was checked against a primary source by a human.
- It did not test the product. The 7 engine unit tests and the headless-browser end-to-end test were written after the build, by hand, and they caught a real test bug (the series-end test called `finishGame` on an incomplete draft, which the engine correctly refused).

## Bottom line

WebStorm + Junie compressed the mechanical work — scaffolding, boilerplate, first drafts — from days to hours. The remaining work was judgment: which data source to trust, which rule the AI got wrong, and what not to invent. That is the part AI accelerated least, and the part that mattered most.
