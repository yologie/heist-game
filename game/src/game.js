// Midnight Vault — game state and update logic: the thief, the patrols, the
// alarm, the loot and the exit. Rendering lives in render.js, input in
// input.js; this file only moves the world one step at a time.

import {
  ALARM_DECAY,
  ALARM_MAX,
  BUMP_RANGE,
  CAM_ALARM_RATE,
  CAM_HALF_ANGLE,
  CAM_RANGE,
  DIAMOND_SCORE,
  GUARD_ALARM_RATE,
  GUARD_HALF_ANGLE,
  GUARD_HUNT_MULT,
  GUARD_RANGE,
  GUARD_R,
  GUARD_SPEED,
  LOOT_SCORE,
  PLAY,
  PLAYER_R,
  PLAYER_SPEED,
  SCREENS,
  SMOKE_COST,
  SMOKE_COUNT,
  SMOKE_RADIUS,
  SMOKE_TIME,
  TIME_BONUS_PER_SEC,
} from './config.js';
import { ROOMS } from './rooms.js';
import { angleDiff, circleHitsRect, hasLineOfSight, pointInCone, pushCircleOutOfRect } from './vision.js';
import { sfx, alarmTick } from './sound.js';

export function createGame() {
  return {
    screen: SCREENS.TITLE,
    screenBeforePause: SCREENS.PLAYING,
    roomIndex: 0,
    room: null,
    player: { x: 0, y: 0 },
    guards: [],
    cameras: [],
    loot: [],
    smokes: [],
    smokesLeft: SMOKE_COUNT,
    alarm: 0,
    timeLeft: 0,
    score: 0,
    totalScore: 0,
    lootTaken: 0,
    caughtReason: '',
    roomBonus: 0,
    peakAlarm: 0,
    elapsed: 0,
    best: 0,
    spottedNow: false,
    exitOpen: false,
    flash: 0,
  };
}

export function loadRoom(state, index) {
  const def = ROOMS[index];
  state.roomIndex = index;
  state.room = def;
  state.player = { x: def.start.x, y: def.start.y };
  state.guards = def.guards.map((g) => ({
    path: g.path,
    pause: g.pause,
    x: g.path[0][0],
    y: g.path[0][1],
    target: 1 % g.path.length,
    pauseLeft: 0,
    angle: 0,
    spotting: false,
  }));
  state.cameras = def.cameras.map((c, i) => ({
    ...c,
    angle: c.base,
    phase: i * 1.7,
    spotting: false,
    range: CAM_RANGE,
    halfAngle: CAM_HALF_ANGLE,
  }));
  state.loot = def.loot.map((l) => ({ ...l, taken: false }));
  state.smokes = [];
  state.smokesLeft = SMOKE_COUNT;
  state.alarm = 0;
  state.timeLeft = def.time;
  state.lootTaken = 0;
  state.caughtReason = '';
  state.roomBonus = 0;
  state.peakAlarm = 0;
  state.exitOpen = false;
  state.flash = 0;
  state.screen = SCREENS.PLAYING;
}

export function startGame(state) {
  state.totalScore = 0;
  state.score = 0;
  loadRoom(state, 0);
}

export function retryRoom(state) {
  state.score = state.totalScore;
  loadRoom(state, state.roomIndex);
}

export function nextRoom(state) {
  state.totalScore = state.score;
  if (state.roomIndex + 1 >= ROOMS.length) {
    state.screen = SCREENS.WIN;
    if (state.score > state.best) state.best = state.score;
    sfx.win();
    return;
  }
  loadRoom(state, state.roomIndex + 1);
}

export function toTitle(state) {
  state.screen = SCREENS.TITLE;
}

export function togglePause(state) {
  if (state.screen === SCREENS.PLAYING) {
    state.screenBeforePause = SCREENS.PLAYING;
    state.screen = SCREENS.PAUSED;
  } else if (state.screen === SCREENS.PAUSED) {
    state.screen = state.screenBeforePause;
  }
}

export function dropSmoke(state) {
  if (state.screen !== SCREENS.PLAYING) return false;
  if (state.smokesLeft <= 0) return false;
  state.smokes.push({ x: state.player.x, y: state.player.y, r: SMOKE_RADIUS, ttl: SMOKE_TIME });
  state.smokesLeft -= 1;
  state.score = Math.max(0, state.score - SMOKE_COST);
  sfx.smoke();
  return true;
}

function movePlayer(state, dt, ix, iy) {
  const p = state.player;
  if (ix === 0 && iy === 0) return;
  const len = Math.hypot(ix, iy);
  const vx = (ix / len) * PLAYER_SPEED * dt;
  const vy = (iy / len) * PLAYER_SPEED * dt;
  p.x += vx;
  p.y += vy;
  p.x = Math.max(PLAY.x + PLAYER_R, Math.min(PLAY.x + PLAY.w - PLAYER_R, p.x));
  p.y = Math.max(PLAY.y + PLAYER_R, Math.min(PLAY.y + PLAY.h - PLAYER_R, p.y));
  for (const r of state.room.cover) {
    if (circleHitsRect(p.x, p.y, PLAYER_R, r)) {
      const fixed = pushCircleOutOfRect(p.x, p.y, PLAYER_R, r);
      p.x = fixed.x;
      p.y = fixed.y;
    }
  }
}

function updateGuards(state, dt) {
  const hunt = state.alarm > 60 ? GUARD_HUNT_MULT : 1;
  for (const g of state.guards) {
    g.spotting = false;
    if (g.pauseLeft > 0) {
      g.pauseLeft -= dt;
      continue;
    }
    const target = g.path[g.target];
    const dx = target[0] - g.x;
    const dy = target[1] - g.y;
    const dist = Math.hypot(dx, dy);
    const step = GUARD_SPEED * hunt * dt;
    if (dist <= step) {
      g.x = target[0];
      g.y = target[1];
      g.target = (g.target + 1) % g.path.length;
      g.pauseLeft = g.pause;
    } else {
      g.x += (dx / dist) * step;
      g.y += (dy / dist) * step;
      const want = Math.atan2(dy, dx);
      g.angle += angleDiff(want, g.angle) * Math.min(1, dt * 8);
    }
  }
}

function updateCameras(state) {
  for (const c of state.cameras) {
    c.angle = c.base + Math.sin(state.elapsed * c.speed + c.phase) * c.arc;
  }
}

// One frame of the heist. inputAxes is {x, y} from the keys held this frame.
export function update(state, dt, inputAxes) {
  if (state.screen !== SCREENS.PLAYING) return;
  state.elapsed += dt;
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 2);

  movePlayer(state, dt, inputAxes.x, inputAxes.y);
  updateGuards(state, dt);
  updateCameras(state);

  for (const s of state.smokes) s.ttl -= dt;
  state.smokes = state.smokes.filter((s) => s.ttl > 0);

  // Detection: guards and cameras raise the alarm while they can see the
  // thief; bumping into a guard is nearly instant exposure.
  let seen = false;
  const cover = state.room.cover;
  const smokes = state.smokes;
  for (const g of state.guards) {
    const d = Math.hypot(state.player.x - g.x, state.player.y - g.y);
    const inCone = pointInCone(state.player.x, state.player.y, g.x, g.y, g.angle, GUARD_RANGE, GUARD_HALF_ANGLE)
      && hasLineOfSight(g.x, g.y, state.player.x, state.player.y, cover, smokes);
    if (inCone || d < BUMP_RANGE) {
      g.spotting = true;
      seen = true;
      state.alarm += (d < BUMP_RANGE ? GUARD_ALARM_RATE * 1.8 : GUARD_ALARM_RATE) * dt;
      const want = Math.atan2(state.player.y - g.y, state.player.x - g.x);
      g.angle += angleDiff(want, g.angle) * Math.min(1, dt * 6);
    }
  }
  for (const c of state.cameras) {
    const inCone = pointInCone(state.player.x, state.player.y, c.x, c.y, c.angle, CAM_RANGE, CAM_HALF_ANGLE)
      && hasLineOfSight(c.x, c.y, state.player.x, state.player.y, cover, smokes);
    if (inCone) {
      c.spotting = true;
      seen = true;
      state.alarm += CAM_ALARM_RATE * dt;
    }
  }
  if (!seen) state.alarm = Math.max(0, state.alarm - ALARM_DECAY * dt);
  state.alarm = Math.min(ALARM_MAX, state.alarm);
  state.peakAlarm = Math.max(state.peakAlarm, state.alarm);
  state.spottedNow = seen;
  if (seen) alarmTick(state.alarm);
  if (state.alarm >= ALARM_MAX) {
    state.caughtReason = 'spotted';
    state.screen = SCREENS.CAUGHT;
    sfx.caught();
    return;
  }

  // Loot: walk over it to grab it. The last piece opens the exit.
  for (const l of state.loot) {
    if (l.taken) continue;
    if (Math.hypot(state.player.x - l.x, state.player.y - l.y) < 28) {
      l.taken = true;
      state.lootTaken += 1;
      const value = l.kind === 'diamond' ? DIAMOND_SCORE : LOOT_SCORE;
      state.score += value;
      if (l.kind === 'diamond') sfx.diamond();
      else sfx.pickup();
      if (state.lootTaken === state.loot.length) {
        state.exitOpen = true;
        sfx.exitOpen();
      }
    }
  }

  // The exit only counts once every piece of loot is grabbed.
  if (state.exitOpen) {
    const e = state.room.exit;
    if (Math.hypot(state.player.x - e.x, state.player.y - e.y) < 30) {
      state.roomBonus = Math.ceil(state.timeLeft) * TIME_BONUS_PER_SEC;
      state.score += state.roomBonus;
      state.screen = SCREENS.ROOM_CLEAR;
      sfx.roomClear();
      return;
    }
  }

  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.caughtReason = 'time';
    state.screen = SCREENS.CAUGHT;
    sfx.caught();
  }
}
