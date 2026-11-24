# Demo video plan — Fearless Draft Board (< 3 min, target ~2:30)

Goal: prove in under 3 minutes that the tool is real, the Fearless rule is enforced, and a coach would actually use it. All footage must show the real app running — no mockups, no staged data.

## Scenes

| Time | Visual | Narration (English) |
|---|---|---|
| 0:00–0:15 | Title card: "Fearless Draft Board — a draft organizer for Fearless Draft series" + the app loading with all 173 champions | "Fearless Draft changed how League of Legends series are prepared. Once a champion is picked, it's gone for the rest of the series. Coaches track that on spreadsheets. This is a better way." |
| 0:15–0:45 | Draft board, Game 1: click through the first ban phase and the first picks (Blue bans Aatrox, Red bans Ahri, etc.). Turn indicator moves. | "Here's the draft board. It enforces the standard pro order — six bans, six picks, four bans, four picks. The turn indicator always shows whose move it is, and you can undo a misclick." |
| 0:45–1:15 | Pick recommendations panel: on Blue's first pick, the recommendation list shows 5 champions with reasons. Click one. Show the pick landing in its slot with the role dropdown. | "On every pick, the tool suggests the best available champions — and tells you why. Lane fit, frontline, magic damage. It's rules-based and transparent, not a black box." |
| 1:15–1:45 | Finish Game 1 (Blue wins). The Fearless locks panel fills with 10 champions. Switch to Game 2: those 10 are greyed out in the pool. Pool health shows ADC dropping. | "Finish a game and its ten picks are locked for the rest of the series. They can't be picked or banned again. Watch pool health — ADC has only 28 champions in the whole game, and it runs out first." |
| 1:45–2:10 | Series history + export: show two completed games, the series score, click Export JSON and Copy summary. | "Every game is recorded, the score is tracked, and you can export the whole series as JSON or a text summary for your analyst." |
| 2:10–2:30 | Closing card: repo URL, "Built with WebStorm and Junie · Category 2 · Cloud9 x JetBrains". | "Fearless Draft Board — built with WebStorm and Junie, for the Cloud9 x JetBrains hackathon. Open source, offline-ready, and free for any coach to use." |

## Production notes

- Record the app running in a browser at 1280x720. Use the local server (`python3 -m http.server 8000 --directory app`) so champion images load.
- Use a real draft sequence, not random clicks: plan the Game 1 picks in advance so the narration matches the screen (e.g., Blue first-picks a top laner the recommender suggests).
- For the Game 2 segment, complete Game 1's draft quickly (or pre-record it) so the video stays under 3 minutes — do not fake the lock: the 10 locked champions must be the ones actually picked in the Game 1 shown.
- Voiceover: human narration (Songyi or a presenter). Keep it under 3 minutes total.
- No copyrighted music. No Riot trademarks beyond the champion names/portraits already in the tool (fair use as a fan-made coaching tool; the repo states it is not endorsed by Riot Games).

## Shot list (for the editor)

1. `title.png` — title card.
2. `draft-g1.mp4` — screen recording of Game 1 draft (ban phase + first picks).
3. `reco.png` — close-up of the recommendations panel.
4. `finish-g1.mp4` — clicking Finish game, Blue wins, locks panel filling.
5. `g2-locks.mp4` — Game 2 pool with locked champions greyed out + pool health.
6. `export.mp4` — history + export/copy.
7. `closing.png` — closing card with repo URL.
