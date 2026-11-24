# How lane assignments were sourced

## Sources

Fearless Draft Board needs a lane (Top / Jungle / Mid / ADC / Support) for every champion. Riot's Data Dragon does **not** publish lanes — it publishes classes (Fighter, Mage, Assassin, Marksman, Tank, Support), which are not the same thing.

Lane assignments come from **Riot's `client_positions`** — the intended/meta positions Riot itself publishes per champion — via the League of Legends Fandom wiki module `Module:ChampionData/data` (172 champions, retrieved 2026-11-24). This is the closest thing to an authoritative lane list.

## Coverage

- 170 of 173 champions matched directly on display name.
- 3 champions are newer than the Fandom module and were assigned from patch 26.22 tier lists and role guides (all accessed 2026-11-24):
  - **Yunara → ADC.** A traditional marksman; "a traditional ADC … for ADCs" (First Comics News); listed as an ADC build with a 48.8% win rate as ADC on patch 16.23 (dreambot.dev); 99.3% of her games are bot lane (nerfplz).
  - **Locke → Mid.** Listed in the Mid S-tier on the patch 26.22 tier list (axeetech.com); "Locke normally plays mid" and only 2.1% of his games are support (nerfplz).
  - **Zaahen → Top.** Listed in the Top A-tier on the patch 26.22 tier list (axeetech.com).

## Lane counts (final)

| Lane | Champions |
|------|-----------|
| Top | 47 |
| Jungle | 41 |
| Mid | 44 |
| ADC | 28 |
| Support | 36 |
| Multi-lane | 22 champions list two lanes |

## Note

Lane assignments are Riot's intended positions, not a guarantee of how a specific team plays a champion. In the app, each pick slot's role is editable, so a coach can override the default when a team plays a champion off-role.
