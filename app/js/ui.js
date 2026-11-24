/* Fearless Draft Board — UI wiring */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const ROLES = ['top', 'jungle', 'mid', 'adc', 'support'];

  let series = createSeries('Cloud9', 'Opponents', 5);
  let laneFilter = 'all';
  let searchQuery = '';
  let hideUsed = true;

  const toast = (msg) => {
    const el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; }, 2600);
  };

  /* ---------- rendering ---------- */

  function championImg(cid) {
    const c = CHAMPIONS[cid];
    return `<img src="img/champion/${c.img}" alt="${c.name}" loading="lazy">`;
  }

  function renderTurnBar() {
    const game = currentGame(series);
    $('gameLabel').textContent = `Game ${game.number}`;
    $('phaseLabel').textContent = isDraftComplete(series)
      ? 'Draft complete — finish the game to lock picks'
      : phaseLabel(game.turnIndex);
    const turn = currentTurn(series);
    const label = $('turnLabel');
    if (!turn) {
      label.textContent = 'Draft complete';
      label.className = 'turn-label done';
    } else {
      const teamName = turn.team === 'blue' ? series.teamA : series.teamB;
      label.textContent = `${turn.team === 'blue' ? 'Blue' : 'Red'} · ${teamName} to ${turn.type}`;
      label.className = `turn-label ${turn.team}`;
    }
    $('seriesScore').textContent = `${series.score.blue} – ${series.score.red}`;
    $('blueName').textContent = series.teamA;
    $('redName').textContent = series.teamB;
    $('undoBtn').disabled = game.turnIndex <= 0;
    $('finishGameBtn').disabled = !isDraftComplete(series) || seriesOver(series);
    $('resetGameBtn').disabled = game.turnIndex <= 0 && game.number === 1;
  }

  function renderSide(team) {
    const game = currentGame(series);
    const turn = currentTurn(series);
    // bans
    const banBox = $(team === 'blue' ? 'blueBans' : 'redBans');
    banBox.innerHTML = '';
    for (let i = 0; i < 5; i += 1) {
      const cid = game.bans[team][i];
      const div = document.createElement('div');
      div.className = 'ban-slot' + (cid ? ' filled' : '');
      if (cid) {
        div.innerHTML = championImg(cid) + `<span class="slot-name">${CHAMPIONS[cid].name}</span>`;
      }
      banBox.appendChild(div);
    }
    // picks
    const pickBox = $(team === 'blue' ? 'bluePicks' : 'redPicks');
    pickBox.innerHTML = '';
    game.picks[team].forEach((slot, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isActive = turn && turn.type === 'pick' && turn.team === team &&
        game.picks[team].findIndex((s) => !s.champion) === idx;
      btn.className = 'pick-slot' + (slot.champion ? ' filled' : '') + (isActive ? ' active' : '');
      const thumb = slot.champion
        ? `<span class="pick-thumb">${championImg(slot.champion)}</span>`
        : `<span class="pick-thumb empty">+</span>`;
      const meta = slot.champion
        ? `<span class="pick-meta"><span class="pick-name">${CHAMPIONS[slot.champion].name}</span><br><span class="pick-sub">${CHAMPIONS[slot.champion].tags.join(' · ')}</span></span>`
        : `<span class="pick-meta"><span class="pick-name">Pick ${idx + 1}</span><br><span class="pick-sub">Awaiting champion</span></span>`;
      const select = `<select class="role-select" data-team="${team}" data-idx="${idx}" aria-label="Role for pick ${idx + 1}" ${slot.champion ? '' : 'disabled'}>`
        + ROLES.map((r) => `<option value="${r}" ${slot.role === r ? 'selected' : ''}>${LANE_LABEL[r]}</option>`).join('')
        + `</select>`;
      btn.innerHTML = thumb + meta + select;
      btn.addEventListener('click', (e) => {
        if (e.target.tagName === 'SELECT') return;
        // Clicking a filled slot does nothing (use Undo); clicking the active empty slot is a no-op.
      });
      const sel = btn.querySelector('select');
      sel.addEventListener('change', () => {
        slot.role = sel.value;
        renderRecommendations();
      });
      sel.addEventListener('click', (e) => e.stopPropagation());
      pickBox.appendChild(btn);
    });
  }

  function renderPool() {
    const grid = $('champGrid');
    grid.innerHTML = '';
    const q = searchQuery.trim().toLowerCase();
    let shown = 0, total = 0;
    const entries = Object.entries(CHAMPIONS).sort((a, b) => a[1].name.localeCompare(b[1].name));
    for (const [cid, c] of entries) {
      total += 1;
      if (laneFilter !== 'all' && !c.lanes.includes(laneFilter)) continue;
      if (q && !c.name.toLowerCase().includes(q)) continue;
      const av = availability(series, cid);
      if (hideUsed && !av.ok) continue;
      shown += 1;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'champ-card' + (av.ok ? '' : ' unavailable');
      card.innerHTML = `<img src="img/champion/${c.img}" alt="${c.name}" loading="lazy">`
        + `<div class="champ-name">${c.name}</div>`
        + `<div class="champ-lanes">${c.lanes.map((l) => LANE_LABEL[l]).join(' / ')}</div>`
        + (av.ok ? '' : `<div class="lock-tag">${av.reason}</div>`);
      if (av.ok) {
        card.addEventListener('click', () => {
          const turn = currentTurn(series);
          if (!turn) { toast('Draft is complete — finish the game first.'); return; }
          if (placeChampion(series, cid)) {
            renderAll();
          } else {
            toast('That champion is not available right now.');
          }
        });
      }
      grid.appendChild(card);
    }
    $('poolCount').textContent = `Showing ${shown} of ${total} champions · Patch ${PATCH} · Click a champion to place it in the current ${currentTurn(series) ? currentTurn(series).type : '—'} slot.`;
  }

  function renderRecommendations() {
    const turn = currentTurn(series);
    const list = $('recoList');
    const sub = $('recoSub');
    list.innerHTML = '';
    if (!turn || turn.type !== 'pick') {
      sub.textContent = turn ? 'Recommendations appear on pick turns.' : 'Draft complete — finish the game to lock picks.';
      return;
    }
    const game = currentGame(series);
    const slot = game.picks[turn.team].find((s) => !s.champion);
    if (!slot) { sub.textContent = 'No open pick slot.'; return; }
    const teamName = turn.team === 'blue' ? series.teamA : series.teamB;
    sub.textContent = `${teamName} · ${LANE_LABEL[slot.role]} slot · top suggestions for this pick`;
    const { picks } = recommend(series, turn.team, slot.role, 5);
    if (!picks.length) {
      list.innerHTML = '<li class="muted">No champions left for this lane — the pool is exhausted. Consider a flex pick from another lane.</li>';
      return;
    }
    for (const r of picks) {
      const li = document.createElement('li');
      li.innerHTML = `<img src="img/champion/${CHAMPIONS[r.id].img}" alt="${r.name}">`
        + `<span><span class="reco-name">${r.name}</span><br><span class="reco-why">${r.reasons.join(' · ')}</span></span>`
        + `<span class="reco-score">${r.score}</span>`;
      li.addEventListener('click', () => {
        if (placeChampion(series, r.id)) renderAll();
      });
      list.appendChild(li);
    }
  }

  function renderFearless() {
    const list = $('fearlessList');
    const entries = Object.entries(series.fearlessLocks);
    $('fearlessCount').textContent = String(entries.length);
    if (!entries.length) {
      list.innerHTML = '<p class="muted">No champions locked yet. Finish Game 1 to lock its picks.</p>';
      return;
    }
    list.innerHTML = '';
    entries.sort((a, b) => a[1] - b[1]);
    for (const [cid, gameNo] of entries) {
      const chip = document.createElement('span');
      chip.className = 'fearless-chip';
      chip.innerHTML = `<img src="img/champion/${CHAMPIONS[cid].img}" alt="${CHAMPIONS[cid].name}"> ${CHAMPIONS[cid].name} · G${gameNo}`;
      list.appendChild(chip);
    }
  }

  function renderPoolHealth() {
    const box = $('poolHealth');
    box.innerHTML = '';
    for (const { lane, left, total } of poolHealth(series)) {
      const pct = Math.round((left / total) * 100);
      const cls = pct < 25 ? 'low' : pct < 50 ? 'mid' : '';
      const row = document.createElement('div');
      row.className = 'health-row';
      row.innerHTML = `<span>${LANE_LABEL[lane]}</span><span class="health-bar ${cls}"><span style="width:${pct}%"></span></span><span class="health-count">${left}/${total}</span>`;
      box.appendChild(row);
    }
  }

  function renderHistory() {
    const box = $('historyList');
    const done = series.games.filter((g) => g.winner);
    if (!done.length) {
      box.innerHTML = '<p class="muted">No completed games yet.</p>';
      return;
    }
    box.innerHTML = '';
    for (const game of done) {
      const winner = game.winner === 'blue' ? series.teamA : series.teamB;
      const div = document.createElement('div');
      div.className = 'history-game';
      const fmt = (team) => game.picks[team].map((s) => s.champion ? CHAMPIONS[s.champion].name : '—').join(', ');
      div.innerHTML = `<div class="h-title">Game ${game.number} — ${winner} wins</div>`
        + `<div class="h-teams">Blue: ${fmt('blue')}</div>`
        + `<div class="h-teams">Red: ${fmt('red')}</div>`;
      box.appendChild(div);
    }
    if (seriesOver(series)) {
      const w = seriesWinner(series);
      const div = document.createElement('div');
      div.className = 'history-game';
      div.innerHTML = `<div class="h-title">Series complete — ${(w === 'blue' ? series.teamA : series.teamB)} wins ${series.score.blue}–${series.score.red}</div>`;
      box.appendChild(div);
    }
  }

  function renderAll() {
    renderTurnBar();
    renderSide('blue');
    renderSide('red');
    renderPool();
    renderRecommendations();
    renderFearless();
    renderPoolHealth();
    renderHistory();
  }

  /* ---------- events ---------- */

  $('champSearch').addEventListener('input', (e) => { searchQuery = e.target.value; renderPool(); });
  $('hideUsed').addEventListener('change', (e) => { hideUsed = e.target.checked; renderPool(); });
  document.querySelectorAll('.lane-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lane-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      laneFilter = btn.dataset.lane;
      renderPool();
    });
  });

  $('undoBtn').addEventListener('click', () => { if (undoLast(series)) renderAll(); });
  $('resetGameBtn').addEventListener('click', () => {
    const game = currentGame(series);
    series.games[series.games.length - 1] = emptyGame(game.number);
    renderAll();
    toast('Current game reset.');
  });
  $('finishGameBtn').addEventListener('click', () => { $('finishModal').hidden = false; });
  $('cancelFinishBtn').addEventListener('click', () => { $('finishModal').hidden = true; });
  $('winBlueBtn').addEventListener('click', () => finishAndAdvance('blue'));
  $('winRedBtn').addEventListener('click', () => finishAndAdvance('red'));

  function finishAndAdvance(winner) {
    $('finishModal').hidden = true;
    if (!finishGame(series, winner)) { toast('Draft is not complete yet.'); return; }
    if (seriesOver(series)) {
      toast(`Series over — ${(winner === 'blue' ? series.teamA : series.teamB)} wins the series.`);
    } else {
      toast(`Game ${currentGame(series).number - 1} finished. Picks are now fearless-locked.`);
    }
    renderAll();
  }

  $('newSeriesBtn').addEventListener('click', () => {
    series = createSeries($('teamAName').value.trim() || 'Blue', $('teamBName').value.trim() || 'Red', parseInt($('bestOf').value, 10));
    renderAll();
    toast('New series started.');
  });
  $('teamAName').addEventListener('change', () => { series.teamA = $('teamAName').value.trim() || 'Blue'; renderAll(); });
  $('teamBName').addEventListener('change', () => { series.teamB = $('teamBName').value.trim() || 'Red'; renderAll(); });
  $('bestOf').addEventListener('change', () => {
    series.bestOf = parseInt($('bestOf').value, 10);
    renderAll();
  });

  $('exportJsonBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(series, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'fearless-draft-series.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('copySummaryBtn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(seriesSummary(series));
      toast('Series summary copied to clipboard.');
    } catch (e) {
      toast('Copy failed — select the summary from Export JSON instead.');
    }
  });

  // Keyboard: Esc closes the finish modal.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $('finishModal').hidden = true;
  });

  $('patchLabel').textContent = PATCH;
  renderAll();
})();
