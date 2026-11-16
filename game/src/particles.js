// Particles, floating score text, shockwave rings, screen shake and the
// starfield backdrop. Pure canvas, no assets.
import { W, H, mulberry32 } from './config.js';

export function createParticles(seed) {
  const rng = mulberry32(seed || 1234);
  const stars = [];
  for (let i = 0; i < 130; i++) {
    stars.push({
      x: rng() * W,
      y: rng() * H,
      r: 0.6 + rng() * 1.7,
      tw: rng() * Math.PI * 2,
      speed: 0.4 + rng() * 1.2,
    });
  }

  const p = {
    bursts: [],
    rings: [],
    texts: [],
    trauma: 0,
    shakeX: 0,
    shakeY: 0,

    burst(x, y, color, n, speed) {
      for (let i = 0; i < n; i++) {
        const a = rng() * Math.PI * 2;
        const s = speed * (0.3 + rng() * 0.7);
        p.bursts.push({
          x, y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 0.45 + rng() * 0.4,
          maxLife: 0.85,
          size: 2 + rng() * 4,
          color,
        });
      }
    },

    ring(x, y, color, maxR) {
      p.rings.push({ x, y, color, r: 12, maxR, life: 0.5, maxLife: 0.5 });
    },

    text(x, y, str, color) {
      p.texts.push({ x, y, str, color, life: 0.9, maxLife: 0.9 });
    },

    shake(amount) {
      p.trauma = Math.min(1, p.trauma + amount);
    },

    update(dt) {
      p.trauma = Math.max(0, p.trauma - dt * 1.6);
      const mag = p.trauma * p.trauma * 14;
      p.shakeX = (rng() * 2 - 1) * mag;
      p.shakeY = (rng() * 2 - 1) * mag;
      for (const b of p.bursts) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vx *= 0.92;
        b.vy *= 0.92;
        b.life -= dt;
      }
      p.bursts = p.bursts.filter((b) => b.life > 0);
      for (const r of p.rings) {
        r.r += (r.maxR - r.r) * dt * 7;
        r.life -= dt;
      }
      p.rings = p.rings.filter((r) => r.life > 0);
      for (const t of p.texts) {
        t.y -= 42 * dt;
        t.life -= dt;
      }
      p.texts = p.texts.filter((t) => t.life > 0);
    },

    drawBackground(ctx, t) {
      const g = ctx.createRadialGradient(640, 400, 60, 640, 400, 760);
      g.addColorStop(0, '#12173a');
      g.addColorStop(0.55, '#0a0d26');
      g.addColorStop(1, '#05060f');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      for (const s of stars) {
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.speed + s.tw));
        ctx.globalAlpha = a;
        ctx.fillStyle = '#cdd8ff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Faint arena rings so the eye reads the distance to the heart.
      ctx.strokeStyle = 'rgba(120, 150, 255, 0.07)';
      ctx.lineWidth = 1;
      for (const r of [120, 200, 290, 380]) {
        ctx.beginPath();
        ctx.arc(640, 400, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    },

    draw(ctx) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const b of p.bursts) {
        ctx.globalAlpha = Math.max(0, b.life / b.maxLife);
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size * (0.5 + b.life / b.maxLife), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      for (const r of p.rings) {
        ctx.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.9;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'center';
      ctx.font = 'bold 20px system-ui, sans-serif';
      for (const t of p.texts) {
        ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
        ctx.fillStyle = t.color;
        ctx.fillText(t.str, t.x, t.y);
      }
      ctx.globalAlpha = 1;
    },
  };
  return p;
}
