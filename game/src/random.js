// Midnight Vault — tiny seeded RNG (xorshift32), so a ?seed=N run is identical
// every time and the screenshots are reproducible.

export function makeRng(seed) {
  let s = (seed >>> 0) || 0x9e3779b9;
  return function next() {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

export function pickRng(rng, list) {
  return list[Math.floor(rng() * list.length)];
}
