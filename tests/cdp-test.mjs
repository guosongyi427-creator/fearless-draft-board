// CDP interaction test for Fearless Draft Board.
// Launches chrome-headless-shell, drives a full draft game, checks console errors.
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell';
const PORT = 9333;
const URL = 'http://localhost:8932/index.html';

const chrome = spawn(CHROME, ['--headless', '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${PORT}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const j = await res.json();
      return j.webSocketDebuggerUrl;
    } catch { await sleep(300); }
  }
  throw new Error('CDP not reachable');
}

let msgId = 0;
const pending = new Map();
let ws;
const consoleErrors = [];
const failedRequests = [];

function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
}

async function main() {
  const wsUrl = await getWsUrl();
  ws = new WebSocket(wsUrl);
  await new Promise((r) => { ws.onopen = r; });
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id).resolve(m.result); pending.delete(m.id); }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      consoleErrors.push(m.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
    }
    if (m.method === 'Runtime.exceptionThrown') {
      consoleErrors.push('EXCEPTION: ' + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || ''));
    }
    if (m.method === 'Network.loadingFailed') {
      failedRequests.push(m.params.errorText);
    }
  };
  const { targetId } = await send('Target.createTarget', { url: URL });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Runtime.enable', {}, sessionId);
  await send('Network.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);
  await sleep(2500);

  const evalJs = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) throw new Error('eval failed: ' + JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };

  // 1. Page loaded, 173 champion cards
  const cards = await evalJs(`document.querySelectorAll('.champ-card').length`);
  console.log('champion cards:', cards, '(expect 173)');
  if (cards !== 173) throw new Error('wrong card count');

  // 2. Play a full game: click the first available champion card 20 times
  for (let turn = 0; turn < 20; turn++) {
    const ok = await evalJs(`(() => {
      const card = document.querySelector('.champ-card:not(.unavailable)');
      if (!card) return false;
      card.click();
      return true;
    })()`);
    if (!ok) throw new Error('no available card at turn ' + turn);
    await sleep(60);
  }
  const turnLabel = await evalJs(`document.getElementById('turnLabel').textContent`);
  console.log('after 20 picks, turn label:', JSON.stringify(turnLabel), '(expect Draft complete)');
  const finishDisabled = await evalJs(`document.getElementById('finishGameBtn').disabled`);
  console.log('finish button disabled:', finishDisabled, '(expect false)');
  if (finishDisabled) throw new Error('finish button should be enabled');

  // 3. Finish game (blue wins) via the modal
  await evalJs(`document.getElementById('finishGameBtn').click()`);
  await sleep(200);
  await evalJs(`document.getElementById('winBlueBtn').click()`);
  await sleep(300);
  const score = await evalJs(`document.getElementById('seriesScore').textContent`);
  console.log('series score after G1:', JSON.stringify(score), '(expect 1 – 0)');
  const gameLabel = await evalJs(`document.getElementById('gameLabel').textContent`);
  console.log('current game:', JSON.stringify(gameLabel), '(expect Game 2)');
  const fearlessCount = await evalJs(`document.getElementById('fearlessCount').textContent`);
  console.log('fearless lock count:', fearlessCount, '(expect 10)');
  if (fearlessCount !== '10') throw new Error('expected 10 fearless locks');
  const fearlessChips = await evalJs(`document.querySelectorAll('.fearless-chip').length`);
  console.log('fearless chips rendered:', fearlessChips, '(expect 10)');

  // 4. Locked champions are marked unavailable in game 2 pool
  const lockedMarks = await evalJs(`document.querySelectorAll('.champ-card.unavailable .lock-tag').length`);
  console.log('unavailable cards in G2 pool (hideUsed is on, so 0 shown):', lockedMarks);

  // 5. Recommendations render on a pick turn
  // (game 2 starts with bans; do 6 bans then check recommendations on first pick)
  for (let i = 0; i < 6; i++) {
    await evalJs(`document.querySelector('.champ-card:not(.unavailable)').click()`);
    await sleep(60);
  }
  const recoItems = await evalJs(`document.querySelectorAll('#recoList li').length`);
  console.log('recommendation items on first pick:', recoItems, '(expect 5)');
  if (recoItems !== 5) throw new Error('expected 5 recommendations');

  // 6. Undo works
  const before = await evalJs(`document.getElementById('turnLabel').textContent`);
  await evalJs(`document.getElementById('undoBtn').click()`);
  await sleep(150);
  const after = await evalJs(`document.getElementById('turnLabel').textContent`);
  console.log('undo: before =', JSON.stringify(before), '| after =', JSON.stringify(after));
  if (before === after) throw new Error('undo did not change turn');

  // 7. Lane filter works (show unavailable too, so the count is the full roster)
  await evalJs(`(() => { const h = document.getElementById('hideUsed'); if (h.checked) { h.checked = false; h.dispatchEvent(new Event('change', {bubbles:true})); } })()`);
  await sleep(150);
  await evalJs(`document.querySelector('[data-lane="jungle"]').click()`);
  await sleep(200);
  const jungleCards = await evalJs(`document.querySelectorAll('.champ-card').length`);
  console.log('jungle-filtered cards:', jungleCards, '(expect 41)');
  if (jungleCards !== 41) throw new Error('expected 41 jungle champions');

  // 8. Search works (reset lane filter to All first)
  await evalJs(`document.querySelector('[data-lane="all"]').click()`);
  await sleep(150);
  await evalJs(`(() => { const s = document.getElementById('champSearch'); s.value = 'jinx'; s.dispatchEvent(new Event('input', {bubbles:true})); })()`);
  await sleep(200);
  const searchCards = await evalJs(`document.querySelectorAll('.champ-card').length`);
  console.log('search "jinx" cards:', searchCards, '(expect 1)');
  if (searchCards !== 1) throw new Error('expected 1 search result');

  console.log('\nconsole errors:', consoleErrors.length ? consoleErrors : 'none');
  console.log('failed requests:', failedRequests.length ? failedRequests : 'none');
  if (consoleErrors.length) throw new Error('console errors present');
  console.log('\nALL CDP INTERACTION TESTS PASSED');
  chrome.kill();
  process.exit(0);
}

main().catch((e) => { console.error('TEST FAILED:', e.message); console.error('console errors:', consoleErrors); chrome.kill(); process.exit(1); });
