// SPECTRA entry point: canvas setup, game loop, phase transitions and the
// deterministic ?shot= staging the screenshots are taken from.
import { W, H, CX, CY, mulberry32, clamp } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createParticles } from './particles.js';
import { createWorld } from './world.js';
import { render, upgradeCardRect } from './render.js';
import { makeWisp } from './wisps.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 1) || 1;

const input = createInput(canvas);
const audio = createAudio();
const particles = createParticles(seed);
const world = createWorld({ input, audio, particles }, { shot: !!shot, seed });

let muted = false;
let lastTime = performance.now();

function resize() {
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = `${Math.floor(W * scale)}px`;
  canvas.style.height = `${Math.floor(H * scale)}px`;
}
window.addEventListener('resize', resize);
resize();

function inCard(x, y, i) {
  const r = upgradeCardRect(i);
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function handleTransitions() {
  if (input.consumePressed('KeyM')) {
    muted = !muted;
    audio.setMuted(muted);
  }
  if (world.phase === 'title') {
    if (input.consumePressed('Enter') || input.consumePressed('Space') || input.clicked) {
      audio.unlock();
      audio.click();
      world.startGame();
      input.endFrame();
    }
    return;
  }
  if (world.phase === 'playing') {
    if (input.consumePressed('KeyP')) {
      world.phase = 'paused';
      audio.click();
    } else if (input.consumePressed('KeyR')) {
      world.startGame();
      input.endFrame();
    }
    return;
  }
  if (world.phase === 'upgrade') {
    if (input.consumePressed('Digit1')) world.applyUpgrade(0);
    else if (input.consumePressed('Digit2')) world.applyUpgrade(1);
    else if (input.consumePressed('Digit3')) world.applyUpgrade(2);
    else if (input.clicked) {
      for (let i = 0; i < 3; i++) {
        if (inCard(input.mouseX, input.mouseY, i)) {
          world.applyUpgrade(i);
          break;
        }
      }
      input.endFrame();
    }
    return;
  }
  if (world.phase === 'paused') {
    if (input.consumePressed('KeyP') || input.consumePressed('Enter')) {
      world.phase = 'playing';
      audio.click();
    } else if (input.consumePressed('KeyR')) {
      world.startGame();
      input.endFrame();
    }
    return;
  }
  if (world.phase === 'win' || world.phase === 'over') {
    if (input.consumePressed('KeyR') || input.consumePressed('Enter') || input.clicked) {
      audio.unlock();
      world.startGame();
      input.endFrame();
    }
  }
}

function frame(now) {
  const dt = clamp((now - lastTime) / 1000, 0.001, 0.033);
  lastTime = now;
  handleTransitions();
  world.update(dt);
  render(ctx, world, world.time);
  input.endFrame();
  requestAnimationFrame(frame);
}

// ---- Deterministic screenshot staging (?shot=start|play|win|end&seed=N) ----
function stageShot() {
  const rng = mulberry32(seed * 7919 + 13);
  if (shot === 'play') {
    world.startGame();
    world.wave = 3;
    world.score = 2450;
    world.combo = 5;
    world.comboTimer = 2.4;
    world.kills = 31;
    world.burns = 31;
    world.hp = 82;
    world.charge = 70;
    world.spawnQueue = ['ember', 'leaf', 'sky', 'leaf', 'ember', 'shade'];
    world.spawnTimer = 1.4;
    world.banner = 'WAVE 3';
    world.bannerTimer = 1.6;
    world.prism.angle = -Math.PI * 0.32;
    const staged = [
      ['ember', 300, 220], ['leaf', 980, 200], ['sky', 1060, 470],
      ['ember', 250, 560], ['leaf', 880, 620], ['sky', 520, 130],
      ['shade', 1120, 300], ['ember', 180, 380], ['leaf', 640, 120],
      ['sky', 420, 660], ['ember', 760, 700], ['leaf', 1020, 640],
    ];
    world.wisps = staged.map(([type, x, y]) => {
      const w = makeWisp(type, x, y, 3);
      w.wobble = rng() * Math.PI * 2;
      return w;
    });
    world.wisps[0].burnFlash = 0.8;
    world.wisps[3].burnFlash = 0.5;
    particles.burst(300, 220, '#ff5a4e', 12, 200);
    particles.burst(980, 200, '#4ade80', 10, 180);
    particles.text(300, 190, '+150', '#ff9a6b');
    world.time = 8.4;
  } else if (shot === 'win') {
    world.startGame();
    world.wave = 10;
    world.score = 12450;
    world.kills = 87;
    world.burns = 87;
    world.combo = 12;
    world.hp = 64;
    world.spawnQueue = [];
    world.wisps = [];
    world.banner = '';
    world.bannerTimer = 0;
    world.phase = 'win';
    world.newBest = true;
    world.best = 12450;
    world.time = 12.0;
    particles.burst(CX, CY - 120, '#ffd166', 26, 300);
    particles.ring(CX, CY, '#ffd166', 300);
  } else if (shot === 'end') {
    world.startGame();
    world.wave = 6;
    world.score = 8450;
    world.kills = 63;
    world.burns = 63;
    world.combo = 12;
    world.hp = 0;
    world.spawnQueue = [];
    world.banner = '';
    world.bannerTimer = 0;
    world.phase = 'over';
    world.newBest = true;
    world.best = 8450;
    world.time = 9.6;
    const staged = [
      ['shade', 700, 330], ['ember', 560, 300], ['leaf', 780, 430],
    ];
    world.wisps = staged.map(([type, x, y]) => makeWisp(type, x, y, 6));
    particles.burst(CX, CY, '#ff5a4e', 18, 220);
  } else {
    // start: the title screen, best score fixed so runs are identical.
    world.time = 6.2;
  }
  render(ctx, world, world.time);
  window.__shotReady = true;
}

window.__game = { world, input, audio, particles, version: 'spectra-v2' };

if (shot) {
  stageShot();
} else {
  requestAnimationFrame(frame);
}
