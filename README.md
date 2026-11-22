# Midnight Vault — a heist game

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/yologie/heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/yologie/heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

**Midnight Vault** is a top-down stealth heist game built for the [make.fun "Make the best heist game" bounty](https://make.fun/bounty/best-heist-game-20261122-0559). Three rooms of rising difficulty — the Gallery, the Vault Hall, and the Diamond Vault. Sneak past patrolling guards and sweeping security cameras, grab every piece of loot, and slip out the EXIT before the alarm hits 100%.

## How to play

- **WASD / arrow keys** — move the thief
- **E** — drop a smoke pellet (2 per room, costs 25 points, blocks vision)
- **P** — pause, **M** — mute, **Enter** — confirm
- Guards patrol with vision cones that follow their facing; cameras sweep red cones across the room. Being seen raises the **alarm meter** — it decays when you're hidden, and at 100% you're caught.
- Crates, desks and display cases block sight: use them as cover. Bumping into a guard is nearly instant exposure.
- Grab all the loot to open the EXIT, then get out. Score = loot + time bonus − smoke costs.

## Run it

Serve `game/` with any static server and open `index.html` in desktop Chrome — no build step, no network requests, all art drawn in canvas code and all sound synthesized with WebAudio:

```sh
cd game && python3 -m http.server 8123
```

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-game.ts`.

## Layout

- `game/index.html` — canvas page, loads `src/main.js`
- `game/src/config.js` — geometry, palette, scoring
- `game/src/rooms.js` — the three rooms (cover, patrols, cameras, loot)
- `game/src/vision.js` — vision cones and line of sight
- `game/src/game.js` — state machine and update logic
- `game/src/input.js` — keyboard and mouse
- `game/src/render.js` — all drawing: rooms, cones, HUD, overlays
- `game/src/sound.js` — synthesized WebAudio cues
- `game/src/shots.js` — deterministic `?shot=` staging for screenshots
- `game/src/random.js` — seeded RNG
- `game/src/main.js` — boot, fixed-timestep loop, `?selftest=1`
- `screenshots/` — real renders of the game's own code
