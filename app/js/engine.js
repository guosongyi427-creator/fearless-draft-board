/* Fearless Draft Board — draft engine
 *
 * Standard pro draft order (one game):
 *   Ban phase 1:  B R B R B R          (6 bans)
 *   Pick phase 1: B R R B B R          (6 picks)
 *   Ban phase 2:  R B R B              (4 bans)
 *   Pick phase 2: R B B R              (4 picks)
 * Total per game: 10 bans, 10 picks.
 *
 * Fearless Draft rule (2025 series format): champions PICKED in an earlier
 * game of the same series are locked for the rest of the series — they cannot
 * be picked or banned again. Bans do NOT carry over between games.
 */

// Draft turn sequence for a single game.
const DRAFT_TURNS = [
  { type: 'ban',  team: 'blue' }, { type: 'ban',  team: 'red' },
  { type: 'ban',  team: 'blue' }, { type: 'ban',  team: 'red' },
  { type: 'ban',  team: 'blue' }, { type: 'ban',  team: 'red' },
  { type: 'pick', team: 'blue' }, { type: 'pick', team: 'red' },
  { type: 'pick', team: 'red' },  { type: 'pick', team: 'blue' },
  { type: 'pick', team: 'blue' }, { type: 'pick', team: 'red' },
  { type: 'ban',  team: 'red' },  { type: 'ban',  team: 'blue' },
  { type: 'ban',  team: 'red' },  { type: 'ban',  team: 'blue' },
  { type: 'pick', team: 'red' },  { type: 'pick', team: 'blue' },
  { type: 'pick', team: 'blue' }, { type: 'pick', team: 'red' },
];

const LANES = ['top', 'jungle', 'mid', 'adc', 'support'];
const LANE_LABEL = { top: 'Top', jungle: 'Jungle', mid: 'Mid', adc: 'ADC', support: 'Support' };
const PHASES = [
  { from: 0,  to: 5,  label: 'Ban phase 1' },
  { from: 6,  to: 11, label: 'Pick phase 1' },
  { from: 12, to: 15, label: 'Ban phase 2' },
  { from: 16, to: 19, label: 'Pick phase 2' },
];

function emptyGame(number) {
  return {
    number,
    turnIndex: 0,
    bans: { blue: [], red: [] },
    // picks are ordered slots; each slot: { champion: string|null, role: string|null }
    picks: {
      blue: LANES.map((lane) => ({ champion: null, role: lane })),
      red: LANES.map((lane) => ({ champion: null, role: lane })),
    },
    winner: null,
  };
}

function createSeries(teamA, teamB, bestOf) {
  return {
    teamA, teamB, bestOf,
    games: [emptyGame(1)],
    score: { blue: 0, red: 0 },
    // championId -> game number in which it was picked (fearless lock)
    fearlessLocks: {},
  };
}

function currentGame(series) {
  return series.games[series.games.length - 1];
}

function phaseLabel(turnIndex) {
  if (turnIndex >= DRAFT_TURNS.length) return 'Draft complete';
  const p = PHASES.find((x) => turnIndex >= x.from && turnIndex <= x.to);
  return p ? p.label : '';
}

function currentTurn(series) {
  const game = currentGame(series);
  if (game.turnIndex >= DRAFT_TURNS.length) return null;
  return DRAFT_TURNS[game.turnIndex];
}

function isDraftComplete(series) {
  return currentGame(series).turnIndex >= DRAFT_TURNS.length;
}

function pickedInGame(game) {
  const out = [];
  for (const team of ['blue', 'red']) {
    for (const slot of game.picks[team]) {
      if (slot.champion) out.push(slot.champion);
    }
  }
  return out;
}

function bannedInGame(game) {
  return [...game.bans.blue, ...game.bans.red];
}

/** Champions that cannot be used right now, with the reason. */
function availability(series, championId) {
  const game = currentGame(series);
  if (series.fearlessLocks[championId]) {
    return { ok: false, reason: `Fearless-locked (Game ${series.fearlessLocks[championId]})` };
  }
  if (bannedInGame(game).includes(championId)) return { ok: false, reason: 'Banned this game' };
  if (pickedInGame(game).includes(championId)) return { ok: false, reason: 'Picked this game' };
  return { ok: true, reason: '' };
}

/** Place a champion into the current draft slot. Returns true on success. */
function placeChampion(series, championId) {
  const game = currentGame(series);
  const turn = currentTurn(series);
  if (!turn) return false;
  if (!availability(series, championId).ok) return false;
  if (turn.type === 'ban') {
    game.bans[turn.team].push(championId);
  } else {
    const slot = game.picks[turn.team].find((s) => !s.champion);
    if (!slot) return false;
    slot.champion = championId;
  }
  game.turnIndex += 1;
  return true;
}

/** Undo the most recent draft action. Returns true on success. */
function undoLast(series) {
  const game = currentGame(series);
  if (game.turnIndex <= 0) return false;
  game.turnIndex -= 1;
  const turn = DRAFT_TURNS[game.turnIndex];
  if (turn.type === 'ban') {
    game.bans[turn.team].pop();
  } else {
    // remove the most recently filled pick slot of that team
    const slots = game.picks[turn.team];
    for (let i = slots.length - 1; i >= 0; i -= 1) {
      if (slots[i].champion) { slots[i].champion = null; break; }
    }
  }
  return true;
}

/** Finish the current game, lock its picks, and start the next game. */
function finishGame(series, winnerTeam) {
  const game = currentGame(series);
  if (!isDraftComplete(series)) return false;
  game.winner = winnerTeam;
  series.score[winnerTeam] += 1;
  for (const cid of pickedInGame(game)) {
    series.fearlessLocks[cid] = game.number;
  }
  const winsNeeded = Math.floor(series.bestOf / 2) + 1;
  const over = series.score.blue >= winsNeeded || series.score.red >= winsNeeded;
  if (!over) series.games.push(emptyGame(game.number + 1));
  return true;
}

function seriesOver(series) {
  const winsNeeded = Math.floor(series.bestOf / 2) + 1;
  return series.score.blue >= winsNeeded || series.score.red >= winsNeeded;
}

function seriesWinner(series) {
  if (!seriesOver(series)) return null;
  return series.score.blue > series.score.red ? 'blue' : 'red';
}

/* ------------------------------------------------------------------ */
/* Recommendation engine — transparent, rules-based.                  */
/* No win-rate data is invented: scores come only from the champion    */
/* roster itself (lane fit, class tags, damage/tank profile) and the   */
/* current draft state (roles already filled, classes already picked). */
/* ------------------------------------------------------------------ */

function teamComp(picks) {
  const champs = picks.filter((s) => s.champion).map((s) => CHAMPIONS[s.champion]);
  const tags = {};
  let ap = 0, ad = 0, tank = 0;
  for (const c of champs) {
    for (const t of c.tags) tags[t] = (tags[t] || 0) + 1;
    if (c.magic >= 7) ap += 1;
    if (c.attack >= 7) ad += 1;
    if (c.tags.includes('Tank') || c.defense >= 7) tank += 1;
  }
  return { count: champs.length, tags, ap, ad, tank };
}

function recommend(series, team, role, limit = 5) {
  const game = currentGame(series);
  const myPicks = game.picks[team];
  const comp = teamComp(myPicks);
  const filledRoles = new Set(myPicks.filter((s) => s.champion).map((s) => s.role));
  const out = [];
  for (const [cid, c] of Object.entries(CHAMPIONS)) {
    if (!c.lanes.includes(role)) continue;
    const av = availability(series, cid);
    if (!av.ok) continue;
    let score = 0;
    const reasons = [];
    // Primary lane fit: champions whose first listed lane is this role score best.
    if (c.lanes[0] === role) { score += 40; reasons.push(`Primary ${LANE_LABEL[role]}`); }
    else { score += 22; reasons.push(`Can play ${LANE_LABEL[role]}`); }
    // Team-comp needs.
    if (comp.tank === 0 && (c.tags.includes('Tank') || c.defense >= 7)) {
      score += 18; reasons.push('Adds frontline');
    }
    if (comp.ap === 0 && c.magic >= 7 && !c.tags.includes('Tank')) {
      score += 14; reasons.push('Adds magic damage');
    }
    if (comp.ad === 0 && c.attack >= 7) {
      score += 10; reasons.push('Adds physical damage');
    }
    // Avoid stacking the same class three times.
    const sameClass = c.tags.reduce((n, t) => n + (comp.tags[t] || 0), 0);
    if (sameClass >= 3) score -= 12;
    // Prefer champions that are easy to execute in a high-pressure series game.
    if (c.difficulty <= 4) score += 5;
    // Slight preference for ranged ADCs / supports with utility in the bot lane.
    if (role === 'adc' && c.range >= 500) { score += 4; reasons.push('Long range'); }
    if (role === 'support' && (c.tags.includes('Support') || c.magic >= 6)) { score += 4; }
    out.push({ id: cid, name: c.name, score, reasons });
  }
  out.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return { picks: out.slice(0, limit), filledRoles, comp };
}

/** Champions still available per lane (for the pool-health panel). */
function poolHealth(series) {
  const counts = {};
  const totals = {};
  for (const lane of LANES) {
    totals[lane] = 0; counts[lane] = 0;
    for (const [cid, c] of Object.entries(CHAMPIONS)) {
      if (!c.lanes.includes(lane)) continue;
      totals[lane] += 1;
      if (availability(series, cid).ok) counts[lane] += 1;
    }
  }
  return LANES.map((lane) => ({ lane, left: counts[lane], total: totals[lane] }));
}

/** One-line text summary of the whole series (for copy/export). */
function seriesSummary(series) {
  const lines = [];
  lines.push(`Fearless Draft Board — ${series.teamA} (Blue) vs ${series.teamB} (Red), BO${series.bestOf}, patch ${PATCH}`);
  lines.push(`Score: ${series.teamA} ${series.score.blue} - ${series.score.red} ${series.teamB}`);
  for (const game of series.games) {
    const winner = game.winner ? (game.winner === 'blue' ? series.teamA : series.teamB) : 'in progress';
    lines.push(`\nGame ${game.number} — winner: ${winner}`);
    lines.push(`  Blue bans: ${game.bans.blue.map((id) => CHAMPIONS[id].name).join(', ') || '—'}`);
    lines.push(`  Red bans: ${game.bans.red.map((id) => CHAMPIONS[id].name).join(', ') || '—'}`);
    const fmt = (team) => game.picks[team].map((s) => `${s.champion ? CHAMPIONS[s.champion].name : '—'} (${LANE_LABEL[s.role]})`).join(', ');
    lines.push(`  Blue picks: ${fmt('blue')}`);
    lines.push(`  Red picks: ${fmt('red')}`);
  }
  const locks = Object.entries(series.fearlessLocks);
  if (locks.length) {
    lines.push(`\nFearless-locked (${locks.length}): ${locks.map(([id, g]) => `${CHAMPIONS[id].name} (G${g})`).join(', ')}`);
  }
  return lines.join('\n');
}
