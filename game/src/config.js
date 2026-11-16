// SPECTRA tuning: every number the game balances on lives here.
export const W = 1280;
export const H = 800;
export const CX = 640;
export const CY = 400;
export const HEART_RADIUS = 48;
export const PRISM_RADIUS = 30;
export const MAX_WAVE = 10;

export const COLORS = {
  ember: '#ff5a4e',
  emberSoft: '#ff9a6b',
  leaf: '#4ade80',
  leafSoft: '#a7f3c0',
  sky: '#38bdf8',
  skySoft: '#a5e8ff',
  shade: '#9aa3b2',
  gold: '#ffd166',
  heart: '#ffb347',
  ink: '#070818',
  panel: '#101736',
  text: '#e8ecff',
  dim: '#8b96c2',
};

export const BEAM = {
  length: 520,
  halfWidth: 13,
  dps: 26,
  fan: 0.66, // radians between neighbouring rays (about 38 degrees)
};

export const PULSE = {
  radius: 260,
  cost: 50,
  maxCharge: 100,
  recharge: 7, // per second
  killBonus: 10, // charge gained per burn
  cooldown: 1.1,
  damage: 120,
};

export const COMBO_WINDOW = 3.0;
export const START_HP = 100;
export const WAVE_CLEAR_HEAL = 8;

// Wisp kinds. speed in px/s, hp in beam-damage points, damage in heart HP.
export const WISP_TYPES = {
  ember: { color: COLORS.ember, soft: COLORS.emberSoft, speed: 56, hp: 20, radius: 17, score: 100, damage: 10, immune: false },
  leaf: { color: COLORS.leaf, soft: COLORS.leafSoft, speed: 82, hp: 16, radius: 15, score: 100, damage: 10, immune: false },
  sky: { color: COLORS.sky, soft: COLORS.skySoft, speed: 118, hp: 12, radius: 13, score: 150, damage: 8, immune: false },
  shade: { color: COLORS.shade, soft: '#e5e9f2', speed: 46, hp: 34, radius: 19, score: 250, damage: 16, immune: true },
  brute: { color: COLORS.gold, soft: '#ffe9a8', speed: 34, hp: 95, radius: 30, score: 400, damage: 22, immune: false },
};

// How a wave is built: total wisps, seconds between spawns, mix weights.
export function wavePlan(n) {
  const total = 8 + n * 3;
  const interval = Math.max(0.55, 1.7 - n * 0.1);
  const weights = { ember: 3, leaf: 2, sky: 1, shade: 0, brute: 0 };
  if (n >= 2) weights.leaf = 3;
  if (n >= 3) weights.sky = 2;
  if (n >= 4) weights.shade = 1;
  if (n >= 5) weights.sky = 3;
  if (n >= 6) weights.shade = 2;
  if (n >= 7) weights.brute = 1;
  if (n >= 8) weights.shade = 3;
  if (n >= 9) weights.brute = 2;
  return { total, interval, weights };
}

// Small deterministic RNG (mulberry32) so shot scenes are reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted(rng, weights) {
  let sum = 0;
  for (const k of Object.keys(weights)) sum += weights[k];
  let roll = rng() * sum;
  for (const k of Object.keys(weights)) {
    roll -= weights[k];
    if (roll <= 0) return k;
  }
  return 'ember';
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
