export const SURFACES = {
  TILE: {
    id: 'tile',
    name: 'Standard Tile',
    label: 'Standard Tile / Concrete',
    mu: 0.60,
    speedMult: 1.0,
    waddleMult: 1.0,
    driftFactor: 0.15,
    bouncePreserve: 0.0,
    decayRate: 4.8,
    color: '#64748b',
    badgeColor: 'border-slate-500 text-slate-300',
    handling: 'Standard traction; slide decays in ~2.5s'
  },
  ICE: {
    id: 'ice',
    name: 'Ice Patch',
    label: 'Sub-Zero Ice Slabs',
    mu: 0.05,
    speedMult: 2.2,
    waddleMult: 1.25,
    driftFactor: 0.05,
    bouncePreserve: 0.45,
    decayRate: 0.4,
    color: '#38bdf8',
    badgeColor: 'border-cyan-400 text-cyan-300 bg-cyan-950/40',
    handling: 'Near-zero friction; preserves slide momentum'
  },
  SKIM_MILK: {
    id: 'skim_milk',
    name: 'Skim Milk',
    label: 'Skim Milk Spill',
    mu: 0.20,
    speedMult: 1.5,
    waddleMult: 1.1,
    driftFactor: 0.85, // High drift: turning creates lateral slide
    bouncePreserve: 0.25,
    decayRate: 1.6,
    color: '#ffffff',
    badgeColor: 'border-white/80 text-white bg-slate-900/60',
    handling: 'High drift; wide skid turns'
  },
  BUTTER_OIL: {
    id: 'butter_oil',
    name: 'Butter Oil',
    label: 'Heavy Cream / Butter Oil',
    mu: 0.08,
    speedMult: 2.5,
    waddleMult: 1.2,
    driftFactor: 0.4,
    bouncePreserve: 0.80, // Preserves 80% velocity when bouncing off walls!
    decayRate: 0.65,
    color: '#facc15',
    badgeColor: 'border-amber-400 text-amber-300 bg-amber-950/40',
    handling: 'Ultra slick; 80% wall rebound preservation'
  },
  YOGURT: {
    id: 'yogurt',
    name: 'Yogurt Sludge',
    label: 'Yogurt / Curds',
    mu: 1.20,
    speedMult: 0.4,
    waddleMult: 0.55,
    driftFactor: 0.02,
    bouncePreserve: 0.0,
    decayRate: 12.0, // Immediate slide decay
    color: '#4ade80',
    badgeColor: 'border-emerald-400 text-emerald-300 bg-emerald-950/40',
    handling: 'Mud-like sludge; instant slide brake'
  }
};

export const ZONES = {
  ZONE_1: {
    id: 'zone_1',
    name: 'Receiving Dock',
    subtitle: 'Cold Storage & Tanker Bays',
    color: '#0284c7',
    bounds: { minX: -60, maxX: 60, minZ: 42, maxZ: 96 }
  },
  ZONE_2: {
    id: 'zone_2',
    name: 'Pasteurization Hub',
    subtitle: 'Boilers & Utility Catwalks',
    color: '#ea580c',
    bounds: { minX: -60, maxX: 60, minZ: -16, maxZ: 42 }
  },
  ZONE_3: {
    id: 'zone_3',
    name: 'Fermentation & Culture Lab',
    subtitle: 'Incubation Vats & Centrifuges',
    color: '#10b981',
    bounds: { minX: -60, maxX: 0, minZ: -78, maxZ: -16 }
  },
  ZONE_4: {
    id: 'zone_4',
    name: 'Packaging & Conveyor Maze',
    subtitle: 'Sorting Belts & Pneumatic Press',
    color: '#f59e0b',
    bounds: { minX: 0, maxX: 60, minZ: -78, maxZ: -16 }
  },
  ZONE_5: {
    id: 'zone_5',
    name: 'The Cheese Vault',
    subtitle: 'Aged Wheels & Executive Suite',
    color: '#eab308',
    bounds: { minX: -60, maxX: 60, minZ: -136, maxZ: -78 }
  }
};

export const GATES = {
  GATE_1: {
    id: 'gate_1',
    name: 'Sub-Zero Blast Door',
    lockedMsg: 'Locked! Slap tanker chocks to ram open.',
    pos: { x: 0, y: 0, z: 42 },
    width: 8.0,
    height: 4.5
  },
  GATE_2: {
    id: 'gate_2',
    name: 'Biometric Turnstiles',
    lockedMsg: 'Locked! Over-pressurize 3 steam valves onto the breaker.',
    pos: { x: 0, y: 0, z: -16 },
    width: 9.0,
    height: 3.5
  },
  GATE_3: {
    id: 'gate_3',
    name: 'Retractable Whey Bridge',
    lockedMsg: 'Retracted! Centrifuge-launch across the whey chasm.',
    pos: { x: 0, y: 0, z: -46 },
    width: 12.0,
    height: 1.0
  },
  GATE_4: {
    id: 'gate_4',
    name: '3-Wheel Pressure Vault',
    lockedMsg: 'Locked! Roll 3 heavy cheese wheels onto floor pads.',
    pos: { x: 0, y: 0, z: -78 },
    width: 10.0,
    height: 5.0
  }
};

export const COMBO_TITLES = [
  "MILK SPILL!",
  "CHEESE CRASH!",
  "LACTOSE INTOLERANT RAGE!",
  "MILK-NADO!!",
  "CHEESE-OCALYPSE!!!",
  "DAIRY ARMAGEDDON!!!!"
];
