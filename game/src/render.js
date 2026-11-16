// Everything the player sees: arena, Heartflame, wisps, prism, HUD, banners
// and every screen (title, upgrade choice, pause, victory, game over).
import { W, H, CX, CY, HEART_RADIUS, COLORS, MAX_WAVE } from './config.js';
import { drawWisp } from './wisps.js';
import { drawPrism } from './prism.js';

export function upgradeCardRect(i) {
  const w = 300;
  const h = 240;
  const gap = 28;
  const total = 3 * w + 2 * gap;
  const x0 = CX - total / 2;
  return { x: x0 + i * (w + gap), y: 300, w, h };
}

function drawHeartPedestal(ctx, world, t) {
  const pulse = 1 + Math.sin(t * 3) * 0.05;
  const lowHp = world.hp / world.maxHp < 0.3;
  // Warm glow of the flame the wisps want to snuff.
  const glow = ctx.createRadialGradient(CX, CY, 4, CX, CY, HEART_RADIUS + 34);
  const inner = lowHp ? 'rgba(255, 90, 60, 0.5)' : 'rgba(255, 179, 71, 0.5)';
  glow.addColorStop(0, inner);
  glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(CX, CY, HEART_RADIUS + 34, 0, Math.PI * 2);
  ctx.fill();
  // Pedestal ring.
  ctx.strokeStyle = lowHp ? '#ff5a4e' : COLORS.gold;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(CX, CY, HEART_RADIUS * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // Flame tongue licking up behind the crystal.
  const flick = Math.sin(t * 9) * 3 + Math.sin(t * 13.7) * 2;
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.moveTo(CX - 9, CY + 26);
  ctx.quadraticCurveTo(CX - 14, CY + 2 + flick, CX, CY - 16 + flick);
  ctx.quadraticCurveTo(CX + 14, CY + 2 + flick, CX + 9, CY + 26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.moveTo(CX - 5, CY + 24);
  ctx.quadraticCurveTo(CX - 7, CY + 8, CX, CY - 4 + flick);
  ctx.quadraticCurveTo(CX + 7, CY + 8, CX + 5, CY + 24);
  ctx.closePath();
  ctx.fill();
}

function drawBar(ctx, x, y, w, h, frac, fill, label, valueText) {
  ctx.fillStyle = 'rgba(6, 8, 24, 0.75)';
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, Math.max(0, w * Math.min(1, frac)), h);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y - 7);
  ctx.textAlign = 'right';
  ctx.fillText(valueText, x + w, y - 7);
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawSparkle(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const inner = r * 0.26;
  for (let i = 0; i < 8; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 4;
    const rad = i % 2 === 0 ? r : inner;
    const px = cx + Math.cos(ang) * rad;
    const py = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

// The make.fun mark, in the style of the site's own header: a gold sparkle
// in a dark rounded square, then the "make.fun" wordmark.
function drawMakefunBadge(ctx, rightX, topY, scale) {
  const h = 34 * scale;
  ctx.save();
  ctx.font = `bold ${Math.round(17 * scale)}px system-ui, sans-serif`;
  const textW = ctx.measureText('make.fun').width;
  const pad = 10 * scale;
  const icon = 22 * scale;
  const gap = 8 * scale;
  const w = pad + icon + gap + textW + pad;
  const x = rightX - w;
  ctx.fillStyle = 'rgba(9, 13, 34, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 1;
  roundRectPath(ctx, x, topY, w, h, 9 * scale);
  ctx.fill();
  ctx.stroke();
  const ix = x + pad;
  const iy = topY + (h - icon) / 2;
  ctx.fillStyle = '#141a3d';
  roundRectPath(ctx, ix, iy, icon, icon, 6 * scale);
  ctx.fill();
  drawSparkle(ctx, ix + icon / 2, iy + icon / 2, icon * 0.42, '#ffd166');
  ctx.fillStyle = '#f4f6ff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('make.fun', ix + icon + gap, topY + h / 2 + 0.5 * scale);
  ctx.restore();
}

function drawHud(ctx, world) {
  // Top-left: Heartflame + Pulse charge.
  drawBar(ctx, 28, 52, 230, 14, world.hp / world.maxHp, '#ff8c42', 'HEARTFLAME', `${Math.ceil(world.hp)} / ${world.maxHp}`);
  const maxCharge = 100 + world.pulseMaxBonus;
  const ready = world.charge >= 50 && world.pulseCooldown <= 0;
  drawBar(ctx, 28, 96, 230, 10, world.charge / maxCharge, ready ? '#7ee7ff' : '#3a6a8a', 'PRISM PULSE' + (ready ? ' — READY' : ''), `${Math.floor(world.charge)}`);
  // Top-centre: wave + hostiles left.
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText(`WAVE ${Math.max(1, world.wave)} / ${MAX_WAVE}`, CX, 44);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '14px system-ui, sans-serif';
  const left = world.wisps.length + world.spawnQueue.length;
  ctx.fillText(left > 0 ? `${left} wisps in the dark` : 'the dark is spent…', CX, 66);
  // Top-right: score, best, combo.
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText(`${world.score.toLocaleString('en-US')}`, W - 28, 44);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`BEST ${world.best.toLocaleString('en-US')}`, W - 28, 64);
  if (world.combo >= 2) {
    const mult = (1 + Math.min(world.combo, 24) * 0.1).toFixed(1);
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(`COMBO x${mult}  (${world.combo})`, W - 28, 90);
  }
  // Bottom hint.
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(232, 236, 255, 0.75)';
  ctx.font = '15px system-ui, sans-serif';
  if (world.phase === 'playing') {
    if (world.kills === 0 && world.wave <= 1) {
      ctx.fillText('Aim a ray at a wisp of the SAME COLOUR to burn it', CX, H - 56);
    } else if (!world.pulsed) {
      ctx.fillText('SPACE or CLICK — PRISM PULSE burns everything nearby (grey Shades only die to the Pulse)', CX, H - 56);
    } else {
      ctx.fillText('Mouse aims · Click / Space = Pulse · P pause · R restart · M mute', CX, H - 56);
    }
  }
  // Wave banner.
  if (world.bannerTimer > 0 && world.banner) {
    ctx.globalAlpha = Math.min(1, world.bannerTimer);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.fillText(world.banner, CX, 190);
    ctx.globalAlpha = 1;
  }
  // Hurt vignette.
  if (world.hurtFlash > 0) {
    const g = ctx.createRadialGradient(CX, CY, 200, CX, CY, 720);
    g.addColorStop(0, 'rgba(255,40,40,0)');
    g.addColorStop(1, `rgba(255,40,40,${0.45 * world.hurtFlash})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  // make.fun mark, bottom-right: small, subtle, clear of the hint line.
  drawMakefunBadge(ctx, W - 24, H - 52, 0.8);
}

function drawLegendRow(ctx, y) {
  const items = [
    { color: COLORS.ember, label: 'EMBER — slow' },
    { color: COLORS.leaf, label: 'LEAF — quick' },
    { color: COLORS.sky, label: 'SKY — darting' },
    { color: COLORS.shade, label: 'SHADE — Pulse only' },
    { color: COLORS.gold, label: 'BRUTE — any ray' },
  ];
  ctx.font = '15px system-ui, sans-serif';
  const widths = items.map((it) => ctx.measureText(it.label).width + 34);
  const total = widths.reduce((a, b) => a + b, 0) + 24 * (items.length - 1);
  let x = CX - total / 2;
  ctx.textAlign = 'left';
  for (let i = 0; i < items.length; i++) {
    ctx.fillStyle = items[i].color;
    ctx.beginPath();
    ctx.arc(x + 8, y - 5, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.text;
    ctx.fillText(items[i].label, x + 22, y);
    x += widths[i] + 24;
  }
}

function drawTitle(ctx, world, t) {
  ctx.fillStyle = 'rgba(5, 6, 15, 0.55)';
  ctx.fillRect(0, 0, W, H);
  // make.fun mark, top-right corner of the title screen.
  drawMakefunBadge(ctx, W - 28, 28, 1);
  ctx.textAlign = 'center';
  // Logo with a prismatic gradient.
  const grad = ctx.createLinearGradient(CX - 260, 0, CX + 260, 0);
  grad.addColorStop(0, COLORS.ember);
  grad.addColorStop(0.33, COLORS.gold);
  grad.addColorStop(0.55, COLORS.leaf);
  grad.addColorStop(0.8, COLORS.sky);
  grad.addColorStop(1, '#b48cff');
  ctx.fillStyle = grad;
  ctx.font = 'bold 96px system-ui, sans-serif';
  ctx.fillText('SPECTRA', CX, 218);
  ctx.fillStyle = COLORS.text;
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText('Split the light. Burn the dark. Guard the last flame.', CX, 258);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('A prism at the heart of the night splits one sunbeam into three coloured rays.', CX, 292);
  ctx.fillText('Only a ray of the SAME colour can burn a wisp — and the dark keeps coming.', CX, 316);
  drawLegendRow(ctx, 368);
  // Controls panel.
  ctx.fillStyle = 'rgba(16, 23, 54, 0.9)';
  const pw = 560;
  const ph = 128;
  ctx.fillRect(CX - pw / 2, 420, pw, ph);
  ctx.strokeStyle = 'rgba(126, 231, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(CX - pw / 2, 420, pw, ph);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('HOW TO PLAY', CX, 448);
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillStyle = COLORS.dim;
  ctx.fillText('MOUSE — aim the prism   ·   CLICK / SPACE — Prism Pulse (50 charge)', CX, 478);
  ctx.fillText('A / D or ← / → — spin the prism   ·   P — pause   ·   R — restart   ·   M — mute', CX, 504);
  ctx.fillText('Survive all 10 waves. Between waves, choose a boon. Shades fear only the Pulse.', CX, 530);
  // Best + start prompt.
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 18px system-ui, sans-serif';
  if (world.best > 0) ctx.fillText(`BEST  ${world.best.toLocaleString('en-US')}`, CX, 596);
  if (world.shotMode || Math.sin(t * 4) > -0.2) {
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('CLICK OR PRESS ENTER TO START', CX, 646);
  }
}

function drawUpgrade(ctx, world) {
  ctx.fillStyle = 'rgba(5, 6, 15, 0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.fillText(`WAVE ${world.wave} CLEARED`, CX, 190);
  ctx.fillStyle = COLORS.text;
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText('The dark recoils. Choose a boon — click a card or press 1, 2 or 3.', CX, 228);
  for (let i = 0; i < world.offered.length; i++) {
    const up = world.offered[i];
    const r = upgradeCardRect(i);
    ctx.fillStyle = '#101736';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = 'rgba(126, 231, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = COLORS.gold;
    ctx.font = '44px system-ui, sans-serif';
    ctx.fillText(up.icon, r.x + r.w / 2, r.y + 74);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 19px system-ui, sans-serif';
    ctx.fillText(up.name, r.x + r.w / 2, r.y + 116);
    ctx.fillStyle = COLORS.dim;
    ctx.font = '15px system-ui, sans-serif';
    const words = up.desc.split(' ');
    let line = '';
    let ly = r.y + 148;
    for (const word of words) {
      if (ctx.measureText(line + word).width > r.w - 36) {
        ctx.fillText(line.trim(), r.x + r.w / 2, ly);
        line = '';
        ly += 20;
      }
      line += word + ' ';
    }
    ctx.fillText(line.trim(), r.x + r.w / 2, ly);
    ctx.fillStyle = 'rgba(232, 236, 255, 0.6)';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(`[${i + 1}]`, r.x + r.w / 2, r.y + r.h - 18);
  }
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(5, 6, 15, 0.7)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText('PAUSED', CX, 380);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillText('Press P to resume · R to restart', CX, 424);
}

function drawEnd(ctx, world, won) {
  ctx.fillStyle = won ? 'rgba(8, 20, 12, 0.72)' : 'rgba(15, 6, 10, 0.75)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? COLORS.gold : COLORS.ember;
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText(won ? 'THE DAWN HOLDS' : 'THE LIGHT FADES', CX, 300);
  ctx.fillStyle = COLORS.text;
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText(
    won
      ? 'Ten waves of dark, burned away. The Heartflame still burns.'
      : `The wisps reached the Heartflame on wave ${world.wave}.`,
    CX, 344,
  );
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText(`SCORE  ${world.score.toLocaleString('en-US')}`, CX, 420);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText(`Waves cleared: ${won ? 10 : Math.max(0, world.wave - 1)}  ·  Wisps burned: ${world.burns}  ·  Best combo: x${(1 + Math.min(world.combo, 24) * 0.1).toFixed(1)}`, CX, 462);
  if (world.newBest) {
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('★ NEW BEST ★', CX, 502);
  }
  ctx.fillStyle = COLORS.dim;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(`I scored ${world.score.toLocaleString('en-US')} in SPECTRA (wave ${world.wave}) — beat that!`, CX, 548);
  if (world.shotMode || Math.sin(world.time * 4) > -0.2) {
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('PRESS R OR CLICK TO PLAY AGAIN', CX, 610);
  }
}

export function render(ctx, world, t) {
  const sys = world.sys;
  sys.particles.drawBackground(ctx, t);
  ctx.save();
  ctx.translate(sys.particles.shakeX, sys.particles.shakeY);
  drawHeartPedestal(ctx, world, t);
  if (world.phase === 'title') {
    for (const w of world.titleWisps) drawWisp(ctx, w, t);
  } else {
    for (const w of world.wisps) drawWisp(ctx, w, t);
  }
  drawPrism(ctx, world.prism, world, t);
  sys.particles.draw(ctx);
  ctx.restore();

  if (world.phase === 'title') {
    drawTitle(ctx, world, t);
  } else if (world.phase === 'upgrade') {
    drawHud(ctx, world);
    drawUpgrade(ctx, world);
  } else if (world.phase === 'paused') {
    drawHud(ctx, world);
    drawPaused(ctx);
  } else if (world.phase === 'win') {
    drawHud(ctx, world);
    drawEnd(ctx, world, true);
  } else if (world.phase === 'over') {
    drawHud(ctx, world);
    drawEnd(ctx, world, false);
  } else {
    drawHud(ctx, world);
  }
}
