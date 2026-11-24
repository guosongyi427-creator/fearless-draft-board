// Capture screenshots: initial board, mid-draft, fearless locks after Game 1.
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell';
const PORT = 9334;
const URL = 'http://localhost:8932/index.html';
const chrome = spawn(CHROME, ['--headless', '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${PORT}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let msgId = 0; const pending = new Map(); let ws;
function send(method, params = {}, sessionId) {
  return new Promise((resolve) => { const id = ++msgId; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params, sessionId })); });
}
async function main() {
  let wsUrl;
  for (let i = 0; i < 30; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); wsUrl = (await r.json()).webSocketDebuggerUrl; break; }
    catch { await sleep(300); }
  }
  ws = new WebSocket(wsUrl);
  await new Promise((r) => { ws.onopen = r; });
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
  const { targetId } = await send('Target.createTarget', { url: URL });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  await sleep(2500);
  const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId)).result.value;
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(`screenshots/${name}.png`, Buffer.from(r.data, 'base64'));
    console.log('saved screenshots/' + name + '.png');
  };
  await shot('01-initial-board');
  // Play a full game 1 draft with real champion names (alphabetical first-available)
  for (let turn = 0; turn < 10; turn++) {
    await evalJs(`document.querySelector('.champ-card:not(.unavailable)').click()`);
    await sleep(80);
  }
  await shot('02-mid-draft');
  for (let turn = 10; turn < 20; turn++) {
    await evalJs(`document.querySelector('.champ-card:not(.unavailable)').click()`);
    await sleep(80);
  }
  await evalJs(`document.getElementById('finishGameBtn').click()`);
  await sleep(200);
  await evalJs(`document.getElementById('winBlueBtn').click()`);
  await sleep(400);
  await shot('03-fearless-locks-game2');
  // Game 2: do the 6 bans, then screenshot recommendations on first pick
  for (let i = 0; i < 6; i++) {
    await evalJs(`document.querySelector('.champ-card:not(.unavailable)').click()`);
    await sleep(80);
  }
  await shot('04-recommendations-pick');
  chrome.kill();
  console.log('DONE');
  process.exit(0);
}
main().catch((e) => { console.error('FAILED:', e.message); chrome.kill(); process.exit(1); });
