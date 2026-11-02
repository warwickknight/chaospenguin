import { ZONES, GATES, SURFACES } from '../core/constants.js';

/**
 * Macro Layout Definitions for LactoCorp Facility
 */
export const FACILITY_LAYOUT = {
  // Global factory outer bounds
  bounds: {
    minX: -62,
    maxX: 62,
    minZ: -140,
    maxZ: 100
  },

  // Zone regions with distinct architectural styling
  zones: [
    {
      ...ZONES.ZONE_1,
      floorColor: 0x7dd3fc, // Bright cartoon sky-blue floor
      ambientColor: 0x38bdf8,
      wallColor: 0x3b82f6,
      description: 'Truck loading docks and sub-zero storage',
      spawns: { player: { x: 0, z: 80 } }
    },
    {
      ...ZONES.ZONE_2,
      floorColor: 0xfdba74, // Vibrant warm orange / boiler room
      ambientColor: 0xf97316,
      wallColor: 0xea580c,
      description: 'Industrial steam boilers and overhead pipe network'
    },
    {
      ...ZONES.ZONE_3,
      floorColor: 0x6ee7b7, // Vibrant mint / bio-dairy room
      ambientColor: 0x10b981,
      wallColor: 0x059669,
      description: 'High-tech bio-dairy chamber and centrifuges'
    },
    {
      ...ZONES.ZONE_4,
      floorColor: 0xfde047, // Bright yellow packaging floor
      ambientColor: 0xeab308,
      wallColor: 0xd97706,
      description: 'Kinetic conveyor belt maze and packaging nodes'
    },
    {
      ...ZONES.ZONE_5,
      floorColor: 0xfcd34d, // Golden cheese vault
      ambientColor: 0xf59e0b,
      wallColor: 0x78350f,
      description: 'Aged cheese cathedral and Dairy Baron penthouse'
    }
  ],

  // Liquid and friction surface regions across the map
  surfaces: [
    // Zone 1 Center Comic Milk Spill right around the player's starting area (matching reference art!)
    {
      type: SURFACES.SKIM_MILK,
      x: 0,
      z: 78,
      width: 11,
      depth: 13,
      color: 0xffffff,
      opacity: 1.0
    },
    // Zone 1 Cold Storage Ice Slabs
    {
      type: SURFACES.ICE,
      x: -24,
      z: 70,
      width: 16,
      depth: 22,
      color: 0xcffafe,
      opacity: 0.95
    },
    // Zone 1 Secondary Milk Spill near Tanker
    {
      type: SURFACES.SKIM_MILK,
      x: 7,
      z: 58,
      width: 12,
      depth: 10,
      color: 0xffffff,
      opacity: 1.0
    },
    // Zone 2 Heavy Cream leaks under Burst Pipe
    {
      type: SURFACES.BUTTER_OIL,
      x: 0,
      z: 10,
      width: 16,
      depth: 14,
      color: 0xfef08a,
      opacity: 0.85
    },
    // Zone 3 Bioluminescent Culture & Yogurt sludge
    {
      type: SURFACES.YOGURT,
      x: -32,
      z: -48,
      width: 16,
      depth: 16,
      color: 0x86efac,
      opacity: 0.8
    },
    // Vault Antechamber Butter Oil slick right in front of the 3 pressure pads (Z: -64 to -77)
    {
      type: SURFACES.BUTTER_OIL,
      x: 0,
      z: -70,
      width: 24,
      depth: 12,
      color: 0xfef08a,
      opacity: 0.9
    },
    // Zone 5 Polished Butter Oil floor in the Vault
    {
      type: SURFACES.BUTTER_OIL,
      x: 0,
      z: -105,
      width: 22,
      depth: 22,
      color: 0xfef08a,
      opacity: 0.9
    }
  ],

  // Physical Gates
  gates: [
    {
      ...GATES.GATE_1,
      doorMeshName: 'gate_1_mesh',
      wallW: 28,
      openingW: 8.0
    },
    {
      ...GATES.GATE_2,
      doorMeshName: 'gate_2_mesh',
      wallW: 28,
      openingW: 9.0
    },
    {
      ...GATES.GATE_3,
      doorMeshName: 'gate_3_mesh',
      wallW: 0, // Bridge spans the whey chasm
      openingW: 12.0
    },
    {
      ...GATES.GATE_4,
      doorMeshName: 'gate_4_mesh',
      wallW: 34,
      openingW: 10.0
    }
  ],

  // Walls: static boundary and partition walls [x, z, width, depth, height]
  walls: [
    // Outer Facility Perimeter Walls
    // South Wall (Loading Bay side with truck bays)
    { cx: 0, cz: 96, w: 122, d: 2, h: 5 },
    // North Wall (Vault & Penthouse)
    { cx: 0, cz: -136, w: 122, d: 2, h: 6 },
    // West Outer Wall
    { cx: -60, cz: -20, w: 2, d: 232, h: 5 },
    // East Outer Wall
    { cx: 60, cz: -20, w: 2, d: 232, h: 5 },

    // Zone 1 Internal Walls
    // West Cold Storage Locker partition
    { cx: -18, cz: 70, w: 1.5, d: 28, h: 4.5 },
    // South truck bumper stops
    { cx: -8, cz: 94, w: 10, d: 1.5, h: 1.2 },
    { cx: 8, cz: 94, w: 10, d: 1.5, h: 1.2 },

    // Partition Wall between Zone 1 and Zone 2 (Z = 42)
    // Left side partition: x from -60 to -4.5 (width 55.5)
    { cx: -32.25, cz: 42, w: 55.5, d: 2.2, h: 5 },
    // Right side partition: x from 4.5 to 22 (width 17.5, cx: 13.25)
    // Leaves Gate 1 central portal at x: [-4.5, 4.5] (cz: 42)
    { cx: 13.25, cz: 42, w: 17.5, d: 2.2, h: 5 },
    // Far-East partition segment: x from 30 to 60 (width 30, cx: 45)
    // Leaves an Open Service Archway at x: [22, 30] (cz: 42, width 8) connecting Zone 1 to Zone 2!
    { cx: 45, cz: 42, w: 30, d: 2.2, h: 5 },

    // Partition Wall between Zone 2 and Zones 3 & 4 (Z = -16)
    // Left segment (sealing Zone 3 completely from Zone 2): x from -60 to -4.5 (width 55.5)
    { cx: -32.25, cz: -16, w: 55.5, d: 2.2, h: 5 },
    // Right segment (sealing Zone 4 from Zone 2): x from 4.5 to 60 (width 55.5)
    // This forces all passage through the central Gate 2 Turnstiles at (x: 0, z: -16)!
    { cx: 32.25, cz: -16, w: 55.5, d: 2.2, h: 5 },

    // Central Divider between Zone 3 (West) and Zone 4 (East) along X = 0
    // South segment (Z: -16 to -36): cx: 0, cz: -26, d: 20
    { cx: 0, cz: -26, w: 2.2, d: 20, h: 5 },
    // North segment (Z: -56 to -66): cx: 0, cz: -61, d: 10
    // Leaves Z: -66 to -78 open as a shared Vault Antechamber in front of Gate 4!
    { cx: 0, cz: -61, w: 2.2, d: 10, h: 5 },
    // Between Z: -56 and Z: -36 is the Boiling Whey Chasm (Z: -46, depth 20) with Gate 3 Bridge!
    // Transverse Chasm Guard Walls preventing walking around the bridge on the chasm edges:
    { cx: -3.2, cz: -36, w: 6.4, d: 1.5, h: 2.2 },
    { cx: 3.2, cz: -36, w: 6.4, d: 1.5, h: 2.2 },
    { cx: -3.2, cz: -56, w: 6.4, d: 1.5, h: 2.2 },
    { cx: 3.2, cz: -56, w: 6.4, d: 1.5, h: 2.2 },

    // Partition Wall between Zones 3/4 and Zone 5 (The Vault) at Z = -78
    // Sealed from outer walls (-60 to +60) leaving ONLY the central 10-unit doorway for Gate 4
    { cx: -32.5, cz: -78, w: 55, d: 2.5, h: 6 },
    { cx: 32.5, cz: -78, w: 55, d: 2.5, h: 6 },

    // Zone 5 Executive Suite Interior Glass Partition (Z = -112)
    { cx: -18, cz: -112, w: 22, d: 1.2, h: 4.5 },
    { cx: 18, cz: -112, w: 22, d: 1.2, h: 4.5 }
  ],

  // Underground Bypass Pipe Tunnel (East maintenance route)
  bypassPipes: []
};
