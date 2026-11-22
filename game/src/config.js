// Midnight Vault — shared constants: canvas geometry, palette, scoring.
// Every number the game tunes lives here so the rooms and the renderer agree.

export const CANVAS_W = 960;
export const CANVAS_H = 640;
export const HUD_H = 52;
export const PLAY = { x: 8, y: HUD_H + 8, w: 944, h: 572 };

export const PLAYER_R = 11;
export const PLAYER_SPEED = 150;

export const GUARD_R = 12;
export const GUARD_SPEED = 58;
export const GUARD_RANGE = 150;
export const GUARD_HALF_ANGLE = 0.55;
export const GUARD_ALARM_RATE = 55;
export const GUARD_HUNT_MULT = 1.35;

export const CAM_RANGE = 175;
export const CAM_HALF_ANGLE = 0.42;
export const CAM_ALARM_RATE = 40;

export const ALARM_MAX = 100;
export const ALARM_DECAY = 14;
export const BUMP_RANGE = 42;

export const SMOKE_COUNT = 2;
export const SMOKE_RADIUS = 72;
export const SMOKE_TIME = 4;
export const SMOKE_COST = 25;

export const LOOT_SCORE = 100;
export const DIAMOND_SCORE = 300;
export const TIME_BONUS_PER_SEC = 10;

export const PALETTE = {
  bg: '#0d0f1a',
  floor: '#171a26',
  floorAlt: '#1b1f30',
  wall: '#2c3149',
  wallEdge: '#454c6e',
  cover: '#3a2f22',
  coverEdge: '#6b5636',
  hud: '#101222',
  hudLine: '#2a2f4a',
  text: '#e8e6d8',
  dim: '#9aa0b5',
  gold: '#f2c14e',
  diamond: '#7fe7f2',
  thief: '#e8e6d8',
  thiefTrim: '#1d1f2e',
  guard: '#d95f4b',
  guardDark: '#8f2f22',
  cone: 'rgba(217, 95, 75, 0.20)',
  coneEdge: 'rgba(217, 95, 75, 0.55)',
  cam: '#e0483e',
  camCone: 'rgba(224, 72, 62, 0.18)',
  camConeEdge: 'rgba(224, 72, 62, 0.5)',
  alarmLow: '#59c98a',
  alarmMid: '#f2c14e',
  alarmHigh: '#e0483e',
  exitLocked: '#8a2f28',
  exitOpen: '#59c98a',
  smoke: 'rgba(180, 186, 205, 0.55)',
  button: '#f2c14e',
  buttonText: '#17130a',
};

export const SCREENS = {
  TITLE: 'title',
  PLAYING: 'playing',
  ROOM_CLEAR: 'roomClear',
  CAUGHT: 'caught',
  WIN: 'win',
  PAUSED: 'paused',
};

export const FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';
export const FONT_MONO = '"Consolas", "SF Mono", monospace';
