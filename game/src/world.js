// SPECTRA game state: waves, spawning, beam burning, pulse, combo, scoring,
// upgrades, win and lose. The renderer only reads this state; it never mutates it.
import {
  CX, CY, HEART_RADIUS, BEAM, PULSE, COMBO_WINDOW, START_HP, MAX_WAVE,
  WAVE_CLEAR_HEAL, wavePlan, pickWeighted, mulberry32, clamp,
} from './config.js';
import { makeWisp, updateWisp } from './wisps.js';
import { createPrism, updatePrism, rayList, rayHitsWisp } from './prism.js';
import { rollUpgrades } from './upgrades.js';

function readBest() {
  try {
    return Number(window.localStorage.getItem('spectra.best') || 0) || 0;
  } catch {
    return 0;
  }
}

function saveBest(v) {
  try {
    window.localStorage.setItem('spectra.best', String(v));
  } catch {
    // Storage unavailable: best score just lives for this session.
  }
}

export function createWorld(sys, opts = {}) {
  const shotMode = !!opts.shot;
  const world = {
    sys,
    shotMode,
    phase: 'title', // title | playing | upgrade | paused | win | over
    time: 0,
    wave: 0,
    score: 0,
    best: shotMode ? 9850 : readBest(),
    newBest: false,
    combo: 0,
    comboTimer: 0,
    kills: 0,
    burns: 0,
    hp: START_HP,
    maxHp: START_HP,
    charge: PULSE.maxCharge,
    pulseCooldown: 0,
    wisps: [],
    spawnQueue: [],
    spawnTimer: 0,
    spawnInterval: 1.5,
    prism: createPrism(),
    beamLengthBonus: 0,
    beamWidthBonus: 0,
    beamDpsMul: 1,
    pulseRadiusBonus: 0,
    pulseMaxBonus: 0,
    pulseRechargeMul: 1,
    wispSlowMul: 1,
    scoreMul: 1,
    damageTakenMul: 1,
    offered: [],
    banner: '',
    bannerTimer: 0,
    hurtFlash: 0,
    pulsed: false,
    rng: mulberry32(opts.seed || ((Math.random() * 1e9) | 0)),
    titleWisps: [],
  };

  // Ambient wisps drifting behind the title screen.
  for (let i = 0; i < 7; i++) {
    const a = world.rng() * Math.PI * 2;
    const r = 180 + world.rng() * 320;
    const types = ['ember', 'leaf', 'sky'];
    world.titleWisps.push(makeWisp(types[i % 3], CX + Math.cos(a) * r, CY + Math.sin(a) * r, 1));
  }

  world.startGame = function startGame() {
    world.phase = 'playing';
    world.time = 0;
    world.wave = 0;
    world.score = 0;
    world.newBest = false;
    world.combo = 0;
    world.comboTimer = 0;
    world.kills = 0;
    world.burns = 0;
    world.hp = START_HP;
    world.maxHp = START_HP;
    world.charge = PULSE.maxCharge;
    world.pulseCooldown = 0;
    world.wisps = [];
    world.spawnQueue = [];
    world.beamLengthBonus = 0;
    world.beamWidthBonus = 0;
    world.beamDpsMul = 1;
    world.pulseRadiusBonus = 0;
    world.pulseMaxBonus = 0;
    world.pulseRechargeMul = 1;
    world.wispSlowMul = 1;
    world.scoreMul = 1;
    world.damageTakenMul = 1;
    world.offered = [];
    world.prism = createPrism();
    world.hurtFlash = 0;
    world.pulsed = false;
    world.rng = mulberry32((Math.random() * 1e9) | 0);
    world.startWave(1);
    sys.audio.startPad();
  };

  world.startWave = function startWave(n) {
    world.wave = n;
    const plan = wavePlan(n);
    world.spawnQueue = [];
    for (let i = 0; i < plan.total; i++) {
      world.spawnQueue.push(pickWeighted(world.rng, plan.weights));
    }
    world.spawnInterval = plan.interval;
    world.spawnTimer = 1.1;
    world.banner = n === 1 ? 'WAVE 1 — THE DARK STIRS' : `WAVE ${n}`;
    world.bannerTimer = 2.2;
    sys.audio.wave();
  };

  function spawnPoint() {
    const a = world.rng() * Math.PI * 2;
    const r = 520 + world.rng() * 90;
    return {
      x: clamp(CX + Math.cos(a) * r, 24, 1256),
      y: clamp(CY + Math.sin(a) * r, 24, 776),
    };
  }

  world.spawnNext = function spawnNext() {
    const type = world.spawnQueue.shift();
    if (!type) return;
    const p = spawnPoint();
    const w = makeWisp(type, p.x, p.y, world.wave);
    w.speed *= world.wispSlowMul;
    world.wisps.push(w);
  };

  function killWisp(w, byPulse) {
    w.dead = true;
    world.kills++;
    world.burns++;
    world.combo++;
    world.comboTimer = COMBO_WINDOW;
    const mult = 1 + Math.min(world.combo, 24) * 0.1;
    const gained = Math.round(w.score * mult * world.scoreMul);
    world.score += gained;
    world.charge = Math.min(PULSE.maxCharge + world.pulseMaxBonus, world.charge + PULSE.killBonus);
    sys.particles.burst(w.x, w.y, w.color, byPulse ? 22 : 16, 260);
    sys.particles.text(w.x, w.y - 14, `+${gained}`, w.soft);
    if (!byPulse) sys.audio.burn();
  }

  world.firePulse = function firePulse() {
    if (world.phase !== 'playing') return false;
    if (world.pulseCooldown > 0 || world.charge < PULSE.cost) return false;
    world.charge -= PULSE.cost;
    world.pulseCooldown = PULSE.cooldown;
    world.pulsed = true;
    const radius = PULSE.radius + world.pulseRadiusBonus;
    sys.particles.ring(CX, CY, '#ffffff', radius);
    sys.particles.ring(CX, CY, COLORS_GOLD, radius * 0.8);
    sys.particles.shake(0.35);
    sys.audio.pulse();
    for (const w of world.wisps) {
      const d = Math.hypot(w.x - CX, w.y - CY);
      if (d <= radius + w.radius) {
        w.hp -= PULSE.damage;
        w.burnFlash = 1;
        if (w.hp <= 0 && !w.dead) killWisp(w, true);
      }
    }
    return true;
  };

  function damageHeart(amount) {
    const taken = Math.round(amount * world.damageTakenMul);
    world.hp = Math.max(0, world.hp - taken);
    world.hurtFlash = 1;
    world.combo = 0;
    world.comboTimer = 0;
    sys.particles.shake(0.6);
    sys.audio.hurt();
    if (world.hp <= 0) {
      world.phase = 'over';
      sys.audio.lose();
      if (world.score > world.best) {
        world.best = world.score;
        world.newBest = true;
        if (!world.shotMode) saveBest(world.best);
      }
    }
  }

  world.applyUpgrade = function applyUpgrade(index) {
    const up = world.offered[index];
    if (!up || world.phase !== 'upgrade') return;
    up.apply(world);
    sys.audio.upgrade();
    world.offered = [];
    world.startWave(world.wave + 1);
    world.phase = 'playing';
  };

  world.update = function update(dt) {
    world.time += dt;
    sys.particles.update(dt);
    world.bannerTimer = Math.max(0, world.bannerTimer - dt);
    world.hurtFlash = Math.max(0, world.hurtFlash - dt * 1.8);

    if (world.phase === 'title') {
      for (const w of world.titleWisps) {
        w.wobble += dt * 0.4;
        w.x += Math.sin(world.time * 0.5 + w.wobble) * 12 * dt;
        w.y += Math.cos(world.time * 0.4 + w.wobble) * 10 * dt;
      }
      updatePrism(world.prism, sys.input, dt);
      return;
    }
    if (world.phase !== 'playing') return;

    updatePrism(world.prism, sys.input, dt);

    // Spawning.
    if (world.spawnQueue.length > 0) {
      world.spawnTimer -= dt;
      if (world.spawnTimer <= 0) {
        world.spawnNext();
        world.spawnTimer = world.spawnInterval * (0.85 + world.rng() * 0.3);
      }
    }

    // Pulse input.
    if (sys.input.consumePressed('Space') || sys.input.clicked) {
      world.firePulse();
    }

    // Beam burning: each ray burns wisps of its own colour.
    const rays = rayList(world.prism, world);
    const dps = BEAM.dps * world.beamDpsMul;
    for (const w of world.wisps) {
      if (w.dead || w.immune) continue;
      for (const ray of rays) {
        if (ray.color !== w.type && !(w.type === 'brute' && ray.color === 'leaf')) {
          // Brutes are gold: any ray scorches them at half rate, leaf at full.
          if (w.type !== 'brute') continue;
        }
        if (!rayHitsWisp(ray, w)) continue;
        const rate = w.type === 'brute' && ray.color !== 'leaf' ? dps * 0.5 : dps;
        w.hp -= rate * dt;
        w.burnFlash = 1;
        if (Math.random() < dt * 14) {
          sys.particles.burst(w.x, w.y, w.color, 1, 60);
        }
        if (w.hp <= 0) {
          killWisp(w, false);
          break;
        }
      }
    }

    // Movement + arrivals.
    for (const w of world.wisps) {
      if (w.dead) continue;
      updateWisp(w, dt, world.time);
      if (w.reached) {
        w.dead = true;
        sys.particles.burst(CX, CY, '#ff5a4e', 14, 200);
        damageHeart(w.damage);
      }
    }
    world.wisps = world.wisps.filter((w) => !w.dead);

    // Combo decay.
    if (world.comboTimer > 0) {
      world.comboTimer -= dt;
      if (world.comboTimer <= 0) world.combo = 0;
    }

    // Pulse recharge.
    const maxCharge = PULSE.maxCharge + world.pulseMaxBonus;
    world.charge = Math.min(maxCharge, world.charge + PULSE.recharge * world.pulseRechargeMul * dt);
    world.pulseCooldown = Math.max(0, world.pulseCooldown - dt);

    // Wave cleared?
    if (world.spawnQueue.length === 0 && world.wisps.length === 0) {
      if (world.wave >= MAX_WAVE) {
        world.phase = 'win';
        sys.audio.win();
        if (world.score > world.best) {
          world.best = world.score;
          world.newBest = true;
          if (!world.shotMode) saveBest(world.best);
        }
      } else {
        world.hp = Math.min(world.maxHp, world.hp + WAVE_CLEAR_HEAL);
        sys.audio.clear();
        world.offered = rollUpgrades(world.rng, 3);
        world.phase = 'upgrade';
      }
    }
  };

  // Debug helpers for the automated playtest (never used by normal play).
  world.debug = {
    killAll() {
      for (const w of world.wisps) {
        if (!w.dead) killWisp(w, true);
      }
      world.wisps = [];
    },
    hurt(n) {
      damageHeart(n);
    },
    skipToWave(n) {
      world.wisps = [];
      world.spawnQueue = [];
      world.wave = n - 1;
      world.phase = 'playing';
      world.startWave(n);
    },
  };

  return world;
}

const COLORS_GOLD = '#ffd166';
