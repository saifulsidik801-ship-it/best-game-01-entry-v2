// Wave-clear upgrade cards: pick 1 of 3 after every cleared wave.
export const UPGRADES = [
  {
    id: 'longer',
    icon: '↗',
    name: 'LONGER RAYS',
    desc: 'Rays reach +90 px further into the dark.',
    apply(w) { w.beamLengthBonus = (w.beamLengthBonus || 0) + 90; },
  },
  {
    id: 'wider',
    icon: '◉',
    name: 'WIDER RAYS',
    desc: 'Rays grow +6 px wider — easier burns.',
    apply(w) { w.beamWidthBonus = (w.beamWidthBonus || 0) + 6; },
  },
  {
    id: 'hotter',
    icon: '☀',
    name: 'HOTTER LIGHT',
    desc: 'Beams burn +35% faster.',
    apply(w) { w.beamDpsMul = (w.beamDpsMul || 1) * 1.35; },
  },
  {
    id: 'heart',
    icon: '♥',
    name: 'PRISM HEART',
    desc: '+25 max Heartflame HP and heal 25 now.',
    apply(w) { w.maxHp += 25; w.hp = Math.min(w.maxHp, w.hp + 25); },
  },
  {
    id: 'pulse',
    icon: '✦',
    name: 'TWIN PULSE',
    desc: 'Pulse radius +70 and max charge +50.',
    apply(w) { w.pulseRadiusBonus = (w.pulseRadiusBonus || 0) + 70; w.pulseMaxBonus = (w.pulseMaxBonus || 0) + 50; },
  },
  {
    id: 'quick',
    icon: '↻',
    name: 'QUICK PULSE',
    desc: 'Prism Pulse recharges 60% faster.',
    apply(w) { w.pulseRechargeMul = (w.pulseRechargeMul || 1) * 1.6; },
  },
  {
    id: 'slow',
    icon: '❄',
    name: 'SLOW DARK',
    desc: 'All wisps drift 12% slower.',
    apply(w) { w.wispSlowMul = (w.wispSlowMul || 1) * 0.88; },
  },
  {
    id: 'harvest',
    icon: '◆',
    name: 'EMBER HARVEST',
    desc: '+25% score from every burn.',
    apply(w) { w.scoreMul = (w.scoreMul || 1) * 1.25; },
  },
  {
    id: 'aegis',
    icon: '⛨',
    name: 'AEGIS FLAME',
    desc: 'The Heartflame takes 25% less damage.',
    apply(w) { w.damageTakenMul = (w.damageTakenMul || 1) * 0.75; },
  },
  {
    id: 'spin',
    icon: '⟳',
    name: 'SWIFT PRISM',
    desc: 'Keyboard rotation +60% and rays sweep wider.',
    apply(w) { w.prism.spinBoost = (w.prism.spinBoost || 1) * 1.6; },
  },
];

export function rollUpgrades(rng, n = 3) {
  const pool = UPGRADES.slice();
  const picks = [];
  while (picks.length < n && pool.length > 0) {
    const i = Math.floor(rng() * pool.length);
    picks.push(pool.splice(i, 1)[0]);
  }
  return picks;
}
