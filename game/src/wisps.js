// Shadow wisps: the dark that drifts in from the edges to snuff the Heartflame.
// Each wisp has a colour; only a ray of the SAME colour can burn it. Shades are
// colourless and beam-proof — only a Prism Pulse can destroy them.
import { CX, CY, WISP_TYPES, clamp } from './config.js';

export function makeWisp(type, x, y, wave) {
  const def = WISP_TYPES[type];
  const hpScale = 1 + (wave - 1) * 0.09;
  const speedScale = 1 + (wave - 1) * 0.045;
  return {
    type,
    def,
    x, y,
    hp: def.hp * hpScale,
    maxHp: def.hp * hpScale,
    speed: def.speed * speedScale,
    radius: def.radius,
    score: def.score,
    damage: def.damage,
    color: def.color,
    soft: def.soft,
    immune: def.immune,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 1.6 + Math.random() * 1.4,
    burnFlash: 0,
    dead: false,
    reached: false,
  };
}

export function updateWisp(w, dt, t) {
  const dx = CX - w.x;
  const dy = CY - w.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;
  // Sideways wobble: sky wisps zig-zag hard, brutes barely sway.
  const sway = w.type === 'sky' ? 0.85 : w.type === 'brute' ? 0.12 : 0.45;
  const wob = Math.sin(t * w.wobbleSpeed + w.wobble) * sway;
  const px = -ny * wob;
  const py = nx * wob;
  w.x += (nx + px) * w.speed * dt;
  w.y += (ny + py) * w.speed * dt;
  w.burnFlash = Math.max(0, w.burnFlash - dt * 5);
  if (dist <= 48 + w.radius * 0.4) {
    w.reached = true;
  }
}

export function drawWisp(ctx, w, t) {
  const bob = Math.sin(t * 2.2 + w.wobble) * 2;
  const x = w.x;
  const y = w.y + bob;
  // Smoky body.
  const g = ctx.createRadialGradient(x, y, 1, x, y, w.radius * 1.25);
  g.addColorStop(0, 'rgba(24, 18, 48, 0.95)');
  g.addColorStop(0.7, 'rgba(16, 12, 36, 0.85)');
  g.addColorStop(1, 'rgba(10, 8, 24, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, w.radius * 1.25, 0, Math.PI * 2);
  ctx.fill();
  // Coloured rim: the only thing the rays care about.
  ctx.strokeStyle = w.color;
  ctx.globalAlpha = w.immune ? 0.55 : 0.95;
  ctx.lineWidth = w.immune ? 1.5 : 2.5;
  ctx.beginPath();
  ctx.arc(x, y, w.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // Burning flash.
  if (w.burnFlash > 0) {
    ctx.globalAlpha = w.burnFlash * 0.8;
    ctx.fillStyle = w.soft;
    ctx.beginPath();
    ctx.arc(x, y, w.radius * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // Eyes: two glowing dots that track the centre, plus a worried mouth.
  const lookX = ((CX - x) / Math.max(1, Math.hypot(CX - x, CY - y))) * 3;
  const lookY = ((CY - y) / Math.max(1, Math.hypot(CX - x, CY - y))) * 3;
  const eyeY = y - w.radius * 0.18 + lookY;
  const eyeDX = w.radius * 0.38;
  ctx.fillStyle = w.immune ? '#e5e9f2' : w.soft;
  ctx.beginPath();
  ctx.arc(x - eyeDX + lookX, eyeY, 3.2, 0, Math.PI * 2);
  ctx.arc(x + eyeDX + lookX, eyeY, 3.2, 0, Math.PI * 2);
  ctx.fill();
  // Little frown.
  ctx.strokeStyle = w.immune ? 'rgba(229,233,242,0.7)' : w.soft;
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x + lookX, y + w.radius * 0.42 + lookY, 5, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // HP arc for tough wisps.
  if (w.maxHp >= 30 && w.hp < w.maxHp) {
    const frac = clamp(w.hp / w.maxHp, 0, 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, w.radius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = w.color;
    ctx.beginPath();
    ctx.arc(x, y, w.radius + 6, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();
  }
}
