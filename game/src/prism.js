// The prism: a crystal on the Heartflame that splits one sunbeam into three
// coloured rays. The player aims it; a ray only burns wisps of its own colour.
import { CX, CY, PRISM_RADIUS, BEAM, COLORS, lerpAngle, clamp } from './config.js';

export const RAY_COLORS = ['ember', 'leaf', 'sky'];

export function createPrism() {
  return {
    angle: -Math.PI / 2, // points up at the start
    spin: 5.2, // radians per second on A/D or arrow keys
    spinBoost: 1,
  };
}

// The three rays: angles and which colour each one carries.
export function rayList(prism, world) {
  const len = BEAM.length + (world.beamLengthBonus || 0);
  const half = BEAM.halfWidth + (world.beamWidthBonus || 0);
  return [
    { angle: prism.angle - BEAM.fan, color: 'ember', length: len, half },
    { angle: prism.angle, color: 'leaf', length: len, half },
    { angle: prism.angle + BEAM.fan, color: 'sky', length: len, half },
  ];
}

// True when the wisp's centre lies inside the ray's corridor.
export function rayHitsWisp(ray, wisp) {
  const dx = wisp.x - CX;
  const dy = wisp.y - CY;
  const along = dx * Math.cos(ray.angle) + dy * Math.sin(ray.angle);
  if (along < PRISM_RADIUS * 0.8 || along > ray.length) return false;
  const perp = Math.abs(-dx * Math.sin(ray.angle) + dy * Math.cos(ray.angle));
  return perp < ray.half + wisp.radius * 0.55;
}

export function updatePrism(prism, input, dt) {
  const mouse = input.aimAngle();
  // Mouse aim is direct; keys spin the prism for keyboard-only play.
  const held = input.rotateHeld();
  if (held !== 0) {
    prism.angle += held * prism.spin * prism.spinBoost * dt;
  } else {
    prism.angle = lerpAngle(prism.angle, mouse, clamp(dt * 14, 0, 1));
  }
}

export function drawPrism(ctx, prism, world, t) {
  const rays = rayList(prism, world);
  // The sunbeam shaft falling from the top of the sky onto the crystal.
  const shaft = ctx.createLinearGradient(CX, 0, CX, CY);
  shaft.addColorStop(0, 'rgba(255, 244, 200, 0.55)');
  shaft.addColorStop(0.7, 'rgba(255, 244, 200, 0.12)');
  shaft.addColorStop(1, 'rgba(255, 244, 200, 0)');
  ctx.fillStyle = shaft;
  ctx.beginPath();
  ctx.moveTo(CX - 26, 0);
  ctx.lineTo(CX + 26, 0);
  ctx.lineTo(CX + 10, CY - 18);
  ctx.lineTo(CX - 10, CY - 18);
  ctx.closePath();
  ctx.fill();

  // The three rays, additive so overlaps glow brighter.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const ray of rays) {
    const col = COLORS[ray.color];
    const soft = COLORS[ray.color + 'Soft'] || col;
    const x2 = CX + Math.cos(ray.angle) * ray.length;
    const y2 = CY + Math.sin(ray.angle) * ray.length;
    const shimmer = 1 + Math.sin(t * 6 + ray.angle * 3) * 0.08;
    const grad = ctx.createLinearGradient(CX, CY, x2, y2);
    grad.addColorStop(0, soft);
    grad.addColorStop(0.25, col);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = grad;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = ray.half * 2 * shimmer;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = ray.half * 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  // The crystal itself: a faceted triangle that spins with the aim.
  ctx.save();
  ctx.translate(CX, CY);
  ctx.rotate(prism.angle + Math.PI / 2);
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, PRISM_RADIUS + 26);
  glow.addColorStop(0, 'rgba(190, 240, 255, 0.5)');
  glow.addColorStop(1, 'rgba(190, 240, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, PRISM_RADIUS + 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -PRISM_RADIUS);
  ctx.lineTo(PRISM_RADIUS * 0.86, PRISM_RADIUS * 0.62);
  ctx.lineTo(-PRISM_RADIUS * 0.86, PRISM_RADIUS * 0.62);
  ctx.closePath();
  const body = ctx.createLinearGradient(0, -PRISM_RADIUS, 0, PRISM_RADIUS);
  body.addColorStop(0, '#dff7ff');
  body.addColorStop(0.5, '#7ee7ff');
  body.addColorStop(1, '#3aa7e0');
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Facet lines.
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -PRISM_RADIUS);
  ctx.lineTo(0, PRISM_RADIUS * 0.62);
  ctx.moveTo(-PRISM_RADIUS * 0.86, PRISM_RADIUS * 0.62);
  ctx.lineTo(0, 0);
  ctx.moveTo(PRISM_RADIUS * 0.86, PRISM_RADIUS * 0.62);
  ctx.lineTo(0, 0);
  ctx.stroke();
  // Colour dots on the facets: which ray leaves where.
  const dotCols = [COLORS.ember, COLORS.leaf, COLORS.sky];
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i - 1) * BEAM.fan;
    ctx.fillStyle = dotCols[i];
    ctx.beginPath();
    ctx.arc(Math.cos(a) * (PRISM_RADIUS + 9), Math.sin(a) * (PRISM_RADIUS + 9), 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // A tiny face on the crystal: the little guardian spins with the aim.
  ctx.fillStyle = '#12303f';
  ctx.beginPath();
  ctx.arc(-7, -4, 2.6, 0, Math.PI * 2);
  ctx.arc(7, -4, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-6.2, -4.8, 0.9, 0, Math.PI * 2);
  ctx.arc(7.8, -4.8, 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#12303f';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 4, 5, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
  ctx.restore();
}
