// Midnight Vault — deterministic staging for screenshots. ?shot=start|play|
// near|end&seed=N puts the real game into a chosen state through its own
// public functions, so every screenshot is a true render of the game code.

import { SCREENS } from './config.js';
import { loadRoom, startGame } from './game.js';

export function stageShot(state, shot) {
  if (shot === 'start') {
    loadRoom(state, 0);
    state.screen = SCREENS.TITLE;
    return;
  }
  if (shot === 'play') {
    // Room 2 mid-play: thief crossing the hall, guards and cameras live,
    // one loot grabbed, the alarm already warm — the whole game in one frame.
    startGame(state);
    loadRoom(state, 1);
    state.player = { x: 480, y: 400 };
    state.guards[0].x = 420; state.guards[0].y = 170; state.guards[0].angle = Math.PI / 2;
    state.guards[1].x = 380; state.guards[1].y = 330; state.guards[1].angle = 0;
    state.guards[2].x = 620; state.guards[2].y = 520; state.guards[2].angle = -Math.PI / 2;
    state.cameras[0].angle = Math.PI / 2 + 0.3;
    state.cameras[1].angle = Math.PI / 2 - 0.25;
    state.loot[0].taken = true;
    state.lootTaken = 1;
    state.score = 100;
    state.alarm = 38;
    state.timeLeft = 62;
    state.elapsed = 12;
    return;
  }
  if (shot === 'near') {
    // Room 3, nearly done: the diamond grabbed, thief slipping to the exit
    // while the alarm burns — the getaway paying off the planning.
    startGame(state);
    loadRoom(state, 2);
    state.player = { x: 830, y: 346 };
    state.guards[0].x = 500; state.guards[0].y = 150; state.guards[0].angle = Math.PI / 2;
    state.guards[1].x = 430; state.guards[1].y = 380; state.guards[1].angle = Math.PI;
    state.guards[2].x = 700; state.guards[2].y = 500; state.guards[2].angle = -Math.PI / 2;
    state.guards[3].x = 700; state.guards[3].y = 300; state.guards[3].angle = Math.PI;
    state.cameras[0].angle = Math.PI / 2 + 0.2;
    state.cameras[1].angle = Math.PI / 2 - 0.3;
    state.cameras[2].angle = -Math.PI / 2 + 0.25;
    for (const l of state.loot) l.taken = true;
    state.lootTaken = 3;
    state.score = 500;
    state.exitOpen = true;
    state.alarm = 64;
    state.timeLeft = 41;
    state.elapsed = 30;
    return;
  }
  if (shot === 'end') {
    startGame(state);
    state.score = 1480;
    state.best = 1480;
    state.peakAlarm = 64;
    state.screen = SCREENS.WIN;
  }
}
