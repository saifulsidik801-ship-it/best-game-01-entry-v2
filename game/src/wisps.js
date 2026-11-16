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

// One cute chibi anime face per wisp, drawn procedurally — no image assets.
// Hair colour IS the wisp colour (ember red, leaf green, sky blue, shade grey,
// brute gold), so the same-colour-ray rule still reads at a glance.
function drawChibiFace(ctx, w, x, y) {
  const r = w.radius;
  const hair = w.immune ? '#6b7280' : w.color;
  const skin = w.immune ? '#c9ced8' : '#ffe3c2';
  const lookX = ((CX - x) / Math.max(1, Math.hypot(CX - x, CY - y))) * 3;
  const lookY = ((CY - y) / Math.max(1, Math.hypot(CX - x, CY - y))) * 3;
  // Hair behind: a coloured cap, slightly bigger than the face.
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(x, y - r * 0.06, r * 0.96, 0, Math.PI * 2);
  ctx.fill();
  // Face.
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(x, y + r * 0.08, r * 0.78, 0, Math.PI * 2);
  ctx.fill();
  // Fringe: three points of hair across the forehead.
  ctx.fillStyle = hair;
  for (let i = -1; i <= 1; i++) {
    const bx = x + i * r * 0.42;
    ctx.beginPath();
    ctx.moveTo(bx - r * 0.26, y - r * 0.58);
    ctx.lineTo(bx + r * 0.26, y - r * 0.58);
    ctx.lineTo(bx, y - r * 0.12);
    ctx.closePath();
    ctx.fill();
  }
  // Hairstyle per wisp kind.
  if (w.type === 'leaf') {
    // Twin tails.
    ctx.beginPath();
    ctx.arc(x - r * 1.02, y + r * 0.1, r * 0.32, 0, Math.PI * 2);
    ctx.arc(x + r * 1.02, y + r * 0.1, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
  } else if (w.type === 'sky') {
    // Long side locks.
    ctx.beginPath();
    ctx.ellipse(x - r * 0.95, y + r * 0.5, r * 0.22, r * 0.52, 0.12, 0, Math.PI * 2);
    ctx.ellipse(x + r * 0.95, y + r * 0.5, r * 0.22, r * 0.52, -0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (w.type === 'ember') {
    // Ahoge cowlick.
    ctx.strokeStyle = hair;
    ctx.lineWidth = Math.max(1.2, r * 0.09);
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.95);
    ctx.quadraticCurveTo(x + r * 0.28, y - r * 1.35, x + r * 0.12, y - r * 1.55);
    ctx.stroke();
  } else if (w.type === 'brute') {
    // Spiky gold mane.
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI * 0.85 + (i * Math.PI * 0.7) / 4;
      const tx = x + Math.cos(a) * r * 1.28;
      const ty = y - r * 0.06 + Math.sin(a) * r * 1.28;
      const bx = x + Math.cos(a) * r * 0.9;
      const by = y - r * 0.06 + Math.sin(a) * r * 0.9;
      ctx.beginPath();
      ctx.moveTo(bx - r * 0.16, by);
      ctx.lineTo(bx + r * 0.16, by);
      ctx.lineTo(tx, ty);
      ctx.closePath();
      ctx.fill();
    }
  }
  // Big anime eyes; pupils track the Heartflame.
  const eyeY = y - r * 0.02 + lookY;
  const eyeDX = r * 0.34;
  const eRX = Math.max(2.2, r * 0.2);
  const eRY = Math.max(3, r * 0.3);
  for (const s of [-1, 1]) {
    const ex = x + s * eyeDX + lookX;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eRX, eRY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = w.immune ? '#8b96ac' : w.color;
    ctx.beginPath();
    ctx.arc(ex, eyeY + eRY * 0.1, eRY * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#14101f';
    ctx.beginPath();
    ctx.arc(ex + lookX * 0.4, eyeY + eRY * 0.12, eRY * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex - eRX * 0.3, eyeY - eRY * 0.35, Math.max(1, eRY * 0.18), 0, Math.PI * 2);
    ctx.fill();
  }
  // Blush.
  ctx.fillStyle = 'rgba(255, 120, 140, 0.5)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.52, y + r * 0.32, r * 0.14, r * 0.08, 0, 0, Math.PI * 2);
  ctx.ellipse(x + r * 0.52, y + r * 0.32, r * 0.14, r * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  // Worried little mouth.
  ctx.strokeStyle = 'rgba(90, 40, 40, 0.85)';
  ctx.lineWidth = Math.max(1, r * 0.07);
  ctx.beginPath();
  ctx.arc(x, y + r * 0.48, r * 0.12, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
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
  // Chibi anime face: hair in the wisp's own colour, big eyes, blush.
  drawChibiFace(ctx, w, x, y);
  // Burning flash washes over the whole wisp.
  if (w.burnFlash > 0) {
    ctx.globalAlpha = w.burnFlash * 0.8;
    ctx.fillStyle = w.soft;
    ctx.beginPath();
    ctx.arc(x, y, w.radius * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
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
