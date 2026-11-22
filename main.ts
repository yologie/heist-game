// Midnight Vault — the hand-in program for the make.fun best-heist-game
// bounty (Node 22, standard library only). It copies this repository's
// game/ and screenshots/ beside it into /output (or MAKEFUN_OUTPUT_DIR
// outside the grader) and writes /output/dossier.json, the summary the
// judge reads, with buildDossier from the vendored make.fun library.
//
// Run it locally to check the entry:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });

const gameSrc = join(repoRoot, 'game');
const gameDst = join(outDir, 'game');
cpSync(gameSrc, gameDst, { recursive: true });

const shotsSrc = join(repoRoot, 'screenshots');
const shotsDst = join(outDir, 'screenshots');
mkdirSync(shotsDst, { recursive: true });
if (existsSync(shotsSrc)) {
  for (const name of readdirSync(shotsSrc)) {
    if (name.startsWith('.')) continue;
    cpSync(join(shotsSrc, name), join(shotsDst, name));
  }
}

// The gate's caps, from the kit's reference/gate.json: the dossier text is
// capped at 160 KiB, at most 4 screenshots of 256 KiB each, game/ at most
// 993 files and 48 MiB with every path under 1000 bytes.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
