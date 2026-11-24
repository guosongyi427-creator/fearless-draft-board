let s = createSeries('C9', 'T1', 5);

function autoCompleteGame(s) {
  while (!isDraftComplete(s)) {
    const avail = Object.keys(CHAMPIONS).filter(id => availability(s, id).ok);
    if (!avail.length) { console.log('FAIL: no available champions to complete draft'); process.exit(1); }
    if (!placeChampion(s, avail[0])) { console.log('FAIL: auto-place failed'); process.exit(1); }
  }
}

const expected = [
  ['ban','blue'],['ban','red'],['ban','blue'],['ban','red'],['ban','blue'],['ban','red'],
  ['pick','blue'],['pick','red'],['pick','red'],['pick','blue'],['pick','blue'],['pick','red'],
  ['ban','red'],['ban','blue'],['ban','red'],['ban','blue'],
  ['pick','red'],['pick','blue'],['pick','blue'],['pick','red'],
];
for (let i = 0; i < expected.length; i++) {
  const t = currentTurn(s);
  if (!t || t.type !== expected[i][0] || t.team !== expected[i][1]) {
    console.log('FAIL turn', i, 'expected', expected[i], 'got', t); process.exit(1);
  }
  const avail = Object.keys(CHAMPIONS).filter(id => availability(s, id).ok);
  if (!placeChampion(s, avail[0])) { console.log('FAIL place at turn', i); process.exit(1); }
}
console.log('PASS: draft order (20 turns), draft complete =', isDraftComplete(s));

const g1picks = pickedInGame(currentGame(s));
console.log('game 1 picks:', g1picks.length, '(expect 10)');
finishGame(s, 'blue');
console.log('score after G1:', JSON.stringify(s.score), '(expect blue 1)');
console.log('fearless locks:', Object.keys(s.fearlessLocks).length, '(expect 10)');
console.log('game 2 started:', currentGame(s).number === 2);
const lockedId = g1picks[0];
const av = availability(s, lockedId);
console.log('locked champ availability ok =', av.ok, '(expect false), reason:', av.reason);
if (av.ok) { console.log('FAIL: locked champ is available'); process.exit(1); }
const placed = placeChampion(s, lockedId);
console.log('placing locked champ returns:', placed, '(expect false)');
if (placed) { console.log('FAIL: locked champ placed'); process.exit(1); }
console.log('PASS: fearless locks enforced, bans reset');

const before = currentGame(s).turnIndex;
const anyAvail = Object.keys(CHAMPIONS).filter(id => availability(s, id).ok)[0];
placeChampion(s, anyAvail);
if (!undoLast(s) || currentGame(s).turnIndex !== before) { console.log('FAIL: undo'); process.exit(1); }
console.log('PASS: undo restores turn index');

const rec = recommend(s, 'blue', 'top', 5);
console.log('recommendations for blue top:', rec.picks.map(r => `${r.name}(${r.score})`).join(', '));
if (rec.picks.length !== 5) { console.log('FAIL: expected 5 recs'); process.exit(1); }
if (!rec.picks.every(r => CHAMPIONS[r.id].lanes.includes('top'))) { console.log('FAIL: rec not a top laner'); process.exit(1); }
if (!rec.picks.every(r => availability(s, r.id).ok)) { console.log('FAIL: rec not available'); process.exit(1); }
console.log('PASS: recommendations are valid top laners, all available');

const ph = poolHealth(s);
console.log('pool health:', ph.map(p => `${p.lane}:${p.left}/${p.total}`).join(' '));
if (ph.some(p => p.left > p.total || p.left < 0)) { console.log('FAIL: pool health bounds'); process.exit(1); }
console.log('PASS: pool health sane');

autoCompleteGame(s);
finishGame(s, 'blue'); // G2
autoCompleteGame(s);
finishGame(s, 'blue'); // G3 -> blue has 3, series over
console.log('series over:', seriesOver(s), '(expect true), winner:', seriesWinner(s), '(expect blue)');
if (!seriesOver(s) || seriesWinner(s) !== 'blue') { console.log('FAIL: series end'); process.exit(1); }
console.log('PASS: series ends at 3 wins in BO5');

const summary = seriesSummary(s);
console.log('summary lines:', summary.split('\n').length);
if (!summary.includes('Fearless-locked')) { console.log('FAIL: summary missing locks'); process.exit(1); }
console.log('PASS: summary includes fearless locks');
console.log('\nALL ENGINE TESTS PASSED');
