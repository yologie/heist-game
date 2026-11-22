// Midnight Vault — boot and main loop. Fixed 1/60 s timestep, canvas sized
// to the room, ?seed=N for a reproducible run, ?shot=… for screenshots and
// ?selftest=1 for a scripted check that drives the real input path.

import { CANVAS_H, CANVAS_W, SCREENS } from './config.js';
import { createGame, loadRoom, update } from './game.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import { makeRng } from './random.js';

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || '1');
const shot = params.get('shot') || '';
const selftest = params.get('selftest') === '1';

export const rng = makeRng(seed);
export const state = createGame();
// Debug handle for play-testing from the browser console.
window.__mv = { state };
try {
  state.best = Number(localStorage.getItem('midnight-vault-best') || '0') || 0;
} catch (e) {
  state.best = 0;
}

const canvas = document.getElementById('game');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const ctx = canvas.getContext('2d');

const input = createInput(state, canvas);

// Room 1 behind the title screen so the first frame already shows the game.
loadRoom(state, 0);
state.screen = SCREENS.TITLE;

if (shot) stageShot(state, shot);

let last = performance.now();
let acc = 0;
const STEP = 1 / 60;

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dt;
  while (acc >= STEP) {
    update(state, STEP, input.axes());
    acc -= STEP;
  }
  render(ctx, state, now / 1000);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// Keep the best score across visits.
setInterval(() => {
  try {
    if (state.score > state.best) state.best = state.score;
    localStorage.setItem('midnight-vault-best', String(state.best));
  } catch (e) {
    // Private mode or no storage: the game plays on regardless.
  }
}, 1000);

// Announce screen changes and finds for assistive tech.
const statusEl = document.getElementById('status');
let lastScreen = state.screen;
let lastLoot = 0;
setInterval(() => {
  if (!statusEl) return;
  if (state.screen !== lastScreen) {
    lastScreen = state.screen;
    statusEl.textContent = `Screen: ${state.screen}. Score ${state.score}.`;
  } else if (state.lootTaken !== lastLoot) {
    lastLoot = state.lootTaken;
    statusEl.textContent = `Loot ${state.lootTaken} of ${state.loot.length}. Score ${state.score}.`;
  }
}, 300);

// Scripted self-test (?selftest=1): movement and pause go through real
// dispatched key events; detection and loot use state placement plus the
// real update loop. Results land in #selftest and in the document title.
if (selftest) {
  const results = [];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const key = (code, type) => window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true, cancelable: true }));
  const check = (name, ok) => results.push(`${name}:${ok ? 'PASS' : 'FAIL'}`);
  async function runSelftest() {
    await sleep(300);
    check('title-screen', state.screen === SCREENS.TITLE);
    key('Enter', 'keydown');
    await sleep(150);
    check('enter-starts-game', state.screen === SCREENS.PLAYING);
    const x0 = state.player.x;
    key('ArrowRight', 'keydown');
    await sleep(600);
    key('ArrowRight', 'keyup');
    check('arrow-moves-thief', state.player.x > x0 + 20);
    key('KeyP', 'keydown');
    await sleep(120);
    check('p-pauses', state.screen === SCREENS.PAUSED);
    key('KeyP', 'keydown');
    await sleep(120);
    check('p-resumes', state.screen === SCREENS.PLAYING);
    // Stand in front of guard 0, inside his cone, and watch the alarm climb.
    state.player = { x: 280, y: 140 };
    state.guards[0].x = 180; state.guards[0].y = 140; state.guards[0].angle = 0;
    const a0 = state.alarm;
    await sleep(700);
    check('cone-raises-alarm', state.alarm > a0 + 10);
    // Walk onto the loot and watch it get grabbed.
    state.player = { x: 480, y: 346 };
    await sleep(200);
    check('loot-pickup', state.lootTaken === 1 && state.score >= 100);
    // Smoke pellet spends one charge and hides the thief.
    const s0 = state.smokesLeft;
    key('KeyE', 'keydown');
    await sleep(150);
    check('smoke-pellet', state.smokesLeft === s0 - 1 && state.smokes.length === 1);
    const el = document.getElementById('selftest');
    if (el) el.textContent = `SELFTEST ${results.join(' ')}`;
    document.title = `SELFTEST ${results.join(' ')}`;
    window.__selftestDone = true;
  }
  runSelftest();
}
