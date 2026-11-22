// Midnight Vault — the three rooms. Each room is pure data: cover rectangles
// (block movement and sight), guard patrol loops, sweeping cameras, loot,
// the exit door and the thief's start. Coordinates are canvas pixels;
// the play area runs x 8..952, y 60..632 (see config PLAY).

export const ROOMS = [
  {
    name: 'Room 1 — The Gallery',
    time: 90,
    start: { x: 60, y: 346 },
    exit: { x: 930, y: 346 },
    cover: [
      { x: 300, y: 186, w: 120, h: 50, kind: 'case' },
      { x: 600, y: 306, w: 60, h: 60, kind: 'crate' },
      { x: 200, y: 426, w: 120, h: 50, kind: 'case' },
      { x: 700, y: 150, w: 44, h: 44, kind: 'pillar' },
    ],
    guards: [
      { path: [[180, 140], [770, 140], [770, 260], [180, 260]], pause: 0.7 },
      { path: [[180, 500], [770, 500], [770, 400], [180, 400]], pause: 0.7 },
    ],
    cameras: [
      { x: 480, y: 76, base: Math.PI / 2, arc: 0.62, speed: 0.55 },
    ],
    loot: [{ x: 480, y: 346, kind: 'gold' }],
  },
  {
    name: 'Room 2 — Vault Hall',
    time: 100,
    start: { x: 60, y: 346 },
    exit: { x: 930, y: 346 },
    cover: [
      { x: 250, y: 150, w: 140, h: 50, kind: 'desk' },
      { x: 570, y: 150, w: 140, h: 50, kind: 'desk' },
      { x: 430, y: 316, w: 60, h: 60, kind: 'crate' },
      { x: 510, y: 316, w: 60, h: 60, kind: 'crate' },
      { x: 250, y: 456, w: 140, h: 50, kind: 'desk' },
      { x: 570, y: 456, w: 140, h: 50, kind: 'desk' },
      { x: 458, y: 92, w: 44, h: 44, kind: 'pillar' },
    ],
    guards: [
      { path: [[150, 130], [810, 130], [810, 200], [150, 200]], pause: 0.6 },
      { path: [[300, 290], [660, 290], [660, 400], [300, 400]], pause: 0.8 },
      { path: [[150, 560], [810, 560], [810, 480], [150, 480]], pause: 0.6 },
    ],
    cameras: [
      { x: 240, y: 76, base: Math.PI / 2 + 0.35, arc: 0.55, speed: 0.7 },
      { x: 720, y: 76, base: Math.PI / 2 - 0.35, arc: 0.55, speed: 0.6 },
    ],
    loot: [
      { x: 200, y: 346, kind: 'gold' },
      { x: 760, y: 346, kind: 'gold' },
    ],
  },
  {
    name: 'Room 3 — The Diamond Vault',
    time: 120,
    start: { x: 60, y: 346 },
    exit: { x: 930, y: 346 },
    cover: [
      { x: 400, y: 250, w: 160, h: 100, kind: 'vault' },
      { x: 180, y: 150, w: 60, h: 60, kind: 'crate' },
      { x: 720, y: 150, w: 60, h: 60, kind: 'crate' },
      { x: 180, y: 486, w: 120, h: 50, kind: 'desk' },
      { x: 660, y: 486, w: 120, h: 50, kind: 'desk' },
      { x: 458, y: 92, w: 44, h: 44, kind: 'pillar' },
      { x: 458, y: 556, w: 44, h: 44, kind: 'pillar' },
    ],
    guards: [
      { path: [[140, 120], [820, 120], [820, 225], [140, 225]], pause: 0.5 },
      { path: [[330, 230], [630, 230], [630, 420], [330, 420]], pause: 0.7 },
      { path: [[140, 540], [820, 540], [820, 470], [140, 470]], pause: 0.5 },
      { path: [[820, 230], [820, 420], [660, 420], [660, 230]], pause: 0.6 },
    ],
    cameras: [
      { x: 180, y: 76, base: Math.PI / 2 + 0.3, arc: 0.6, speed: 0.8 },
      { x: 780, y: 76, base: Math.PI / 2 - 0.3, arc: 0.6, speed: 0.7 },
      { x: 480, y: 616, base: -Math.PI / 2, arc: 0.55, speed: 0.65 },
    ],
    loot: [
      { x: 180, y: 260, kind: 'gold' },
      { x: 780, y: 260, kind: 'gold' },
      { x: 480, y: 546, kind: 'diamond' },
    ],
  },
];
