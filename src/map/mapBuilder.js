import { FACILITY_LAYOUT } from './zoneData.js';
import { registerCollider, removeCollider } from '../core/spatialGrid.js';
import { gameState } from '../core/state.js';
import { sound } from '../audio/sound.js';
import { createToonMaterial, addToonOutline } from '../core/toonShader.js';

export class MapBuilder {
  constructor(scene) {
    this.scene = scene;
    this.gateMeshes = new Map();
    this.gateColliders = new Map();
    this.surfaceMeshes = [];
    this.surfaceRegions = [];
    this.interactiveProps = [];

    // Shared Geometries & Materials
    this.initSharedAssets();
  }

  initSharedAssets() {
    this.geos = {
      box: new THREE.BoxGeometry(1, 1, 1),
      sphere: new THREE.SphereGeometry(1, 12, 12),
      cylinder: new THREE.CylinderGeometry(1, 1, 1, 16),
      plane: new THREE.PlaneGeometry(1, 1)
    };
    this.geos.plane.rotateX(-Math.PI / 2);

    this.mats = {
      wall: createToonMaterial(0xf97316), // Warm orange factory wall like the reference image
      wallTrim: createToonMaterial(0xc2410c), // Deep rust orange comic trim
      glass: new THREE.MeshLambertMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.45 }),
      doorLocked: createToonMaterial(0xef4444),
      doorUnlocked: createToonMaterial(0x22c55e),
      steel: createToonMaterial(0xe2e8f0),
      gold: createToonMaterial(0xfacc15),
      pipe: createToonMaterial(0x94a3b8),
      hazard: createToonMaterial(0xfde047),
      whey: new THREE.MeshLambertMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.9 })
    };
  }

  buildAll() {
    this.buildZoneFloors();
    this.buildSurfaces();
    this.buildWalls();
    this.buildGates();
    this.buildWheyChasm();
    this.buildZoneProps();

    // Subscribe to state gate unlock events
    gameState.subscribe((event, data) => {
      if (event === 'gate_unlocked') {
        this.openGateVisual(data);
      }
    });
  }

  /**
   * Distinct themed floors for each zone
   */
  buildZoneFloors() {
    FACILITY_LAYOUT.zones.forEach(zone => {
      const b = zone.bounds;
      const w = b.maxX - b.minX;
      const d = b.maxZ - b.minZ;
      const cx = (b.minX + b.maxX) / 2;
      const cz = (b.minZ + b.maxZ) / 2;

      // Create subtle comic-book floor tile texture (clean pastel floor with soft isometric grid joints)
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      const hex = '#' + zone.floorColor.toString(16).padStart(6, '0');
      ctx.fillStyle = hex;
      ctx.fillRect(0, 0, 256, 256);

      // Soft subtle tile joints so the floor reads as a dairy factory floor instead of empty white space
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, 256, 256);
      ctx.beginPath();
      ctx.moveTo(128, 0);
      ctx.lineTo(128, 256);
      ctx.moveTo(0, 128);
      ctx.lineTo(256, 128);
      ctx.stroke();

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(Math.max(1, Math.floor(w / 10)), Math.max(1, Math.floor(d / 10)));

      // Use MeshLambertMaterial with our canvas texture so the floor color is 100% true to the reference art
      // without MeshToonMaterial gradient blowing it out to white
      const floorMat = new THREE.MeshLambertMaterial({
        map: texture
      });
      const floorGeo = new THREE.PlaneGeometry(w, d);
      floorGeo.rotateX(-Math.PI / 2);

      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.set(cx, 0, cz);
      floorMesh.receiveShadow = true;
      this.scene.add(floorMesh);
    });
  }

  /**
   * Organic comic-book splat puddle (like the reference illustration!)
   */
  createOrganicPuddleGroup(width, depth, colorHex, isMilk = false) {
    const group = new THREE.Group();
    const fillMat = new THREE.MeshBasicMaterial({
      color: colorHex
    });
    const outlineMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b
    });
    const shadowMat = new THREE.MeshBasicMaterial({
      color: isMilk ? 0xcbd5e1 : 0x64748b,
      transparent: true,
      opacity: 0.55
    });

    // Organic overlapping lobes to form a cartoon splat puddle
    const rx = width * 0.42;
    const rz = depth * 0.42;
    const lobes = [
      { ox: 0, oz: 0, sx: rx, sz: rz },
      { ox: -rx * 0.55, oz: rz * 0.25, sx: rx * 0.65, sz: rz * 0.58 },
      { ox: rx * 0.58, oz: -rz * 0.22, sx: rx * 0.62, sz: rz * 0.55 },
      { ox: rx * 0.25, oz: rz * 0.55, sx: rx * 0.52, sz: rz * 0.48 },
      { ox: -rx * 0.35, oz: -rz * 0.52, sx: rx * 0.55, sz: rz * 0.46 },
      // Satellite droplets around the main puddle (matching the reference art!)
      { ox: -rx * 1.05, oz: rz * 0.05, sx: 0.45, sz: 0.38 },
      { ox: -rx * 0.95, oz: rz * 0.32, sx: 0.32, sz: 0.28 },
      { ox: rx * 1.02, oz: rz * 0.25, sx: 0.48, sz: 0.36 },
      { ox: rx * 0.55, oz: -rz * 0.85, sx: 0.30, sz: 0.26 }
    ];

    const discGeo = new THREE.CircleGeometry(1, 24);
    discGeo.rotateX(-Math.PI / 2);

    lobes.forEach(l => {
      // Bottom comic drop-shadow rim
      const shadowMesh = new THREE.Mesh(discGeo, shadowMat);
      shadowMesh.position.set(l.ox + 0.14, 0.015, l.oz + 0.16);
      shadowMesh.scale.set(l.sx + 0.22, 1, l.sz + 0.22);
      group.add(shadowMesh);

      // Crisp dark comic ink outline layer
      const outMesh = new THREE.Mesh(discGeo, outlineMat);
      outMesh.position.set(l.ox, 0.022, l.oz);
      outMesh.scale.set(l.sx + 0.14, 1, l.sz + 0.14);
      group.add(outMesh);

      // Inner liquid fill layer
      const inMesh = new THREE.Mesh(discGeo, fillMat);
      inMesh.position.set(l.ox, 0.032, l.oz);
      inMesh.scale.set(l.sx, 1, l.sz);
      group.add(inMesh);
    });

    return group;
  }

  /**
   * Surface liquid & friction patches
   */
  buildSurfaces() {
    FACILITY_LAYOUT.surfaces.forEach(s => {
      const isMilk = s.type && s.type.id === 'skim_milk';
      const puddleGroup = this.createOrganicPuddleGroup(s.width, s.depth, s.color, isMilk);
      puddleGroup.position.set(s.x, 0, s.z);
      this.scene.add(puddleGroup);

      // Store bounds for player friction check
      this.surfaceRegions.push({
        type: s.type,
        minX: s.x - s.width / 2,
        maxX: s.x + s.width / 2,
        minZ: s.z - s.depth / 2,
        maxZ: s.z + s.depth / 2
      });
    });
  }

  /**
   * Facility Structural Walls
   */
  buildWalls() {
    FACILITY_LAYOUT.walls.forEach(w => {
      // Shorter half-height factory partitions so isometric camera can see characters & setpieces clearly
      const wallH = Math.min(w.h, 2.2);
      const wallGeo = new THREE.BoxGeometry(w.w, wallH, w.d);
      const wallMesh = new THREE.Mesh(wallGeo, this.mats.wall);
      wallMesh.position.set(w.cx, wallH / 2, w.cz);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      addToonOutline(wallMesh, 0.02, 0x1e293b);
      this.scene.add(wallMesh);

      // Decorative top trim with crisp comic outline
      const trimGeo = new THREE.BoxGeometry(w.w + 0.12, 0.28, w.d + 0.12);
      const trimMesh = new THREE.Mesh(trimGeo, this.mats.wallTrim);
      trimMesh.position.set(w.cx, wallH + 0.14, w.cz);
      addToonOutline(trimMesh, 0.025, 0x1e293b);
      this.scene.add(trimMesh);

      // Register into Spatial Grid for O(1) collision queries
      registerCollider({
        type: 'box',
        cx: w.cx,
        cz: w.cz,
        hx: w.w / 2,
        hz: w.d / 2,
        obj: null
      });
    });
  }

  /**
   * 4 Progressive Escape Gates
   */
  buildGates() {
    FACILITY_LAYOUT.gates.forEach(g => {
      const gateGroup = new THREE.Group();
      gateGroup.position.set(g.pos.x, g.pos.y, g.pos.z);

      if (g.id === 'gate_1') {
        // Sub-Zero Blast Door (Zone 1 -> Zone 2)
        const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(g.width + 1.2, g.height + 0.6, 2.0), this.mats.wall);
        doorFrame.position.y = g.height / 2;
        addToonOutline(doorFrame, 0.04);

        const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(g.width - 0.2, g.height, 0.8), this.mats.steel);
        doorLeaf.position.y = g.height / 2;
        addToonOutline(doorLeaf, 0.04);

        // Keypad and Red Warning Beacon
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), this.mats.doorLocked);
        beacon.position.set(0, g.height + 0.5, 0.6);
        addToonOutline(beacon, 0.08);
        doorLeaf.add(beacon);

        // Warning Stripes
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(g.width - 0.4, 0.4, 0.85), this.mats.hazard);
        stripe.position.set(0, 0, 0);
        doorLeaf.add(stripe);

        gateGroup.add(doorLeaf);
        this.gateMeshes.set(g.id, { leaf: doorLeaf, beacon: beacon, group: gateGroup, origY: g.height / 2 });

      } else if (g.id === 'gate_2') {
        // Biometric Turnstiles (Zone 2 -> Zone 3/4)
        const turnstileFrame = new THREE.Mesh(new THREE.BoxGeometry(g.width, 1.4, 1.6), this.mats.steel);
        turnstileFrame.position.y = 0.7;
        addToonOutline(turnstileFrame, 0.04);

        // Laser Barrier Mesh (blocks passage until unlocked)
        const laserGeo = new THREE.BoxGeometry(g.width - 0.5, 2.6, 0.3);
        const laserMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.65 });
        const laserMesh = new THREE.Mesh(laserGeo, laserMat);
        laserMesh.position.y = 2.0;

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), this.mats.doorLocked);
        beacon.position.set(0, 3.4, 0);
        addToonOutline(beacon, 0.08);

        gateGroup.add(turnstileFrame, laserMesh, beacon);
        this.gateMeshes.set(g.id, { leaf: laserMesh, beacon: beacon, group: gateGroup, origY: 2.0 });

      } else if (g.id === 'gate_3') {
        // Retractable Whey Bridge across the whey chasm (spans between x: -6 and x: 6)
        const bridgeGeo = new THREE.BoxGeometry(g.width, 0.5, 6.0);
        const bridgeMat = createToonMaterial(0x38bdf8);
        const bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
        bridgeMesh.position.set(0, 0.25, 0);
        addToonOutline(bridgeMesh, 0.04);

        // Initially raised / retracted (hinged at x: -6 on Zone 3's edge, tilted up)
        bridgeMesh.rotation.z = Math.PI / 2.3;
        bridgeMesh.position.x = -g.width / 2;

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), this.mats.doorLocked);
        beacon.position.set(-g.width / 2, 2.5, 0);
        addToonOutline(beacon, 0.08);

        gateGroup.add(bridgeMesh, beacon);
        this.gateMeshes.set(g.id, { leaf: bridgeMesh, beacon: beacon, group: gateGroup, isBridge: true });

      } else if (g.id === 'gate_4') {
        // 3-Wheel Pressure Vault (Bank-style circular vault door with spoked wheel handle)
        const vaultFrame = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.65, 10, 24), this.mats.steel);
        vaultFrame.position.y = 4.2;
        addToonOutline(vaultFrame, 0.04, 0x1e293b);

        const vaultDoor = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.0, 1.0, 24), this.mats.gold);
        vaultDoor.rotateX(Math.PI / 2);
        vaultDoor.position.set(0, 4.2, 0);
        addToonOutline(vaultDoor, 0.04, 0x1e293b);

        // Classic Bank Vault Spoked Wheel Handle on the front
        const handleWheel = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.2, 8, 16), this.mats.steel);
        handleWheel.rotateX(Math.PI / 2);
        handleWheel.position.set(0, 0.65, 0);
        addToonOutline(handleWheel, 0.05, 0x1e293b);
        vaultDoor.add(handleWheel);

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), this.mats.doorLocked);
        beacon.position.set(0, 8.8, 0.8);
        addToonOutline(beacon, 0.08, 0x1e293b);

        gateGroup.add(vaultFrame, vaultDoor, beacon);
        this.gateMeshes.set(g.id, { leaf: vaultDoor, beacon: beacon, group: gateGroup, isVault: true });
      }

      this.scene.add(gateGroup);

      // Register physical blocking collider in spatial grid
      const collider = {
        type: 'box',
        cx: g.pos.x,
        cz: g.pos.z,
        hx: g.width / 2,
        hz: (g.id === 'gate_3') ? 3.0 : 1.2,
        obj: null,
        gateId: g.id
      };
      this.gateColliders.set(g.id, collider);
      registerCollider(collider);
    });
  }

  /**
   * Boiling Whey Chasm between Zone 3 and Zone 4
   */
  buildWheyChasm() {
    const chasmGeo = new THREE.BoxGeometry(12, 1.5, 20);
    const chasmMesh = new THREE.Mesh(chasmGeo, this.mats.whey);
    chasmMesh.position.set(0, 0.05, -46);
    addToonOutline(chasmMesh, 0.02, 0x1e293b);
    this.scene.add(chasmMesh);

    // Hazard Rim Curbs along the chasm edges (leaving the bridge threshold [-49, -43] open)
    const curbGeo = new THREE.BoxGeometry(0.8, 0.7, 6.5);
    [-6.0, 6.0].forEach(x => {
      [-52.5, -39.5].forEach(z => {
        const curb = new THREE.Mesh(curbGeo, this.mats.hazard);
        curb.position.set(x, 0.35, z);
        addToonOutline(curb, 0.04, 0x1e293b);
        this.scene.add(curb);
        registerCollider({ type: 'box', cx: x, cz: z, hx: 0.5, hz: 3.25, obj: null });
      });
    });

    // Chasm north & south water colliders so you can only cross on the bridge at Z = -46
    registerCollider({ type: 'box', cx: 0, cz: -52.5, hx: 5.5, hz: 3.5, obj: null });
    registerCollider({ type: 'box', cx: 0, cz: -39.5, hx: 5.5, hz: 3.5, obj: null });

    // Hazard Steam Pillars
    for (let z = -54; z <= -38; z += 8) {
      [-6.5, 6.5].forEach(x => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 3.5, 10), this.mats.steel);
        pillar.position.set(x, 1.75, z);
        addToonOutline(pillar, 0.04, 0x1e293b);
        this.scene.add(pillar);
        registerCollider({ pos: pillar.position, radius: 0.7, obj: null });
      });
    }
  }

  /**
   * Helper: Builds a classic stainless steel dairy silo vat (like the reference illustration)
   */
  createStainlessVat(x, z, radius = 2.0, height = 3.6) {
    const vatGroup = new THREE.Group();
    vatGroup.position.set(x, 0, z);

    const steelMat = createToonMaterial(0xcbd5e1);
    const darkSteelMat = createToonMaterial(0x64748b);
    const legMat = createToonMaterial(0x334155);

    // Cylindrical body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 20), steelMat);
    body.position.y = 1.0 + height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    addToonOutline(body, 0.04, 0x1e293b);
    vatGroup.add(body);

    // Rounded top dome
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      steelMat
    );
    dome.scale.set(1, 0.42, 1);
    dome.position.y = 1.0 + height;
    addToonOutline(dome, 0.04, 0x1e293b);
    vatGroup.add(dome);

    // Top hatch / pipe connector
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 0.45, 12), darkSteelMat);
    cap.position.y = 1.0 + height + radius * 0.42;
    addToonOutline(cap, 0.06, 0x1e293b);
    vatGroup.add(cap);

    // Front circular porthole flange (just like the reference art!)
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.3, 14), darkSteelMat);
    flange.rotateX(Math.PI / 2);
    flange.position.set(0, 1.8, radius + 0.05);
    addToonOutline(flange, 0.07, 0x1e293b);
    vatGroup.add(flange);

    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.34, 12), createToonMaterial(0x94a3b8));
    glass.rotateX(Math.PI / 2);
    glass.position.set(0, 1.8, radius + 0.06);
    vatGroup.add(glass);

    // 4 sturdy cylindrical legs with footplates
    const legGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.2, 10);
    const footGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.12, 10);
    [0.7, 2.3, 3.9, 5.4].forEach(angle => {
      const lx = Math.cos(angle) * (radius * 0.72);
      const lz = Math.sin(angle) * (radius * 0.72);
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, 0.6, lz);
      addToonOutline(leg, 0.06, 0x1e293b);
      const foot = new THREE.Mesh(footGeo, darkSteelMat);
      foot.position.set(lx, 0.06, lz);
      addToonOutline(foot, 0.06, 0x1e293b);
      vatGroup.add(leg, foot);
    });

    this.scene.add(vatGroup);
    registerCollider({ pos: new THREE.Vector3(x, 0, z), radius: radius + 0.2, obj: null });
    return vatGroup;
  }

  /**
   * Helper: Builds a Pac-Man style giant cartoon Swiss cheese wheel with missing wedge & holes (like reference art!)
   */
  createDecorativeCheeseWheel(x, z, radius = 2.2, height = 1.25, rotY = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    const rindMat = createToonMaterial(0xfbbf24); // Warm golden yellow cheese rind
    const innerMat = createToonMaterial(0xd97706); // Deeper amber interior cut face
    const holeMat = createToonMaterial(0xb45309); // Darker cheese holes

    // 300-degree cylinder leaving a 60-degree cut wedge
    const wedgeAngle = Math.PI * 1.68;
    const wheelGeo = new THREE.CylinderGeometry(radius, radius, height, 24, 1, false, 0, wedgeAngle);
    const wheel = new THREE.Mesh(wheelGeo, rindMat);
    wheel.position.y = height / 2;
    wheel.castShadow = true;
    wheel.receiveShadow = true;
    addToonOutline(wheel, 0.045, 0x1e293b);
    group.add(wheel);

    // Cut interior faces so the missing wedge shows the Swiss cheese holes inside
    const faceGeo = new THREE.PlaneGeometry(radius, height);
    const face1 = new THREE.Mesh(faceGeo, innerMat);
    face1.position.set(0, height / 2, radius / 2);
    face1.rotation.y = Math.PI / 2;
    group.add(face1);

    const face2 = new THREE.Mesh(faceGeo, innerMat);
    const endAngle = wedgeAngle;
    face2.position.set(Math.sin(endAngle) * (radius / 2), height / 2, Math.cos(endAngle) * (radius / 2));
    face2.rotation.y = endAngle - Math.PI / 2;
    group.add(face2);

    // Decorative Swiss cheese holes on top & cut faces
    const dotGeo = new THREE.SphereGeometry(0.18, 8, 8);
    dotGeo.scale(1, 0.35, 1);
    [
      { dx: -radius * 0.45, dz: -radius * 0.35, s: 1.1 },
      { dx: -radius * 0.2, dz: radius * 0.45, s: 0.8 },
      { dx: radius * 0.35, dz: -radius * 0.4, s: 0.9 }
    ].forEach(h => {
      const dot = new THREE.Mesh(dotGeo, holeMat);
      dot.position.set(h.dx, height + 0.01, h.dz);
      dot.scale.setScalar(h.s);
      group.add(dot);
    });

    this.scene.add(group);
    registerCollider({ pos: new THREE.Vector3(x, 0, z), radius: radius, obj: null });
    return group;
  }

  /**
   * Characteristic Set-Pieces for each Zone
   */
  buildZoneProps() {
    // ZONE 1: Row of 3 Stainless Steel Dairy Silo Vats along the upper-left wall (matching reference illustration!)
    const vatPositionsZ1 = [
      { x: -10.5, z: 73 },
      { x: -10.5, z: 65 },
      { x: -10.5, z: 57 }
    ];
    vatPositionsZ1.forEach(vp => {
      this.createStainlessVat(vp.x, vp.z, 2.0, 3.4);
    });

    // Overhead connecting manifold pipe linking the 3 Zone 1 vats
    const manifold = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 17.0, 10),
      createToonMaterial(0x94a3b8)
    );
    manifold.rotateX(Math.PI / 2);
    manifold.position.set(-10.5, 5.2, 65);
    addToonOutline(manifold, 0.05, 0x1e293b);
    this.scene.add(manifold);

    // ZONE 1: Giant Cartoon Swiss Cheese Wheels in the foreground/sides (matching reference illustration!)
    // Placed in bottom-right foreground with ample clearance around the diagonal conveyor belt!
    this.createDecorativeCheeseWheel(13.0, 88.0, 2.2, 1.3, -0.4);
    this.createDecorativeCheeseWheel(17.5, 83.0, 2.0, 1.25, 0.6);
    this.createDecorativeCheeseWheel(16.5, 93.0, 1.8, 1.1, 1.2);

    // Decorative East Service Archway signage & pillars at (x: 26, z: 42)
    const archPillarGeo = new THREE.BoxGeometry(0.8, 3.2, 2.4);
    const archPillar1 = new THREE.Mesh(archPillarGeo, this.mats.steel);
    archPillar1.position.set(22.4, 1.6, 42);
    addToonOutline(archPillar1, 0.04);
    const archPillar2 = new THREE.Mesh(archPillarGeo, this.mats.steel);
    archPillar2.position.set(29.6, 1.6, 42);
    addToonOutline(archPillar2, 0.04);

    const archLintel = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.6, 2.4), this.mats.hazard);
    archLintel.position.set(26.0, 3.2, 42);
    addToonOutline(archLintel, 0.04);

    this.scene.add(archPillar1, archPillar2, archLintel);

    // ZONE 2: Steam Boilers (Classic stainless cartoon vats with tripod legs & overhead bridge pipe)
    [-18, 18].forEach(x => {
      this.createStainlessVat(x, 12, 2.5, 4.4);
      this.createStainlessVat(x, -2, 2.2, 3.8);
    });
    const boilerPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 36.0, 10),
      createToonMaterial(0x94a3b8)
    );
    boilerPipe.rotateZ(Math.PI / 2);
    boilerPipe.position.set(0, 5.8, 12);
    addToonOutline(boilerPipe, 0.04, 0x1e293b);
    this.scene.add(boilerPipe);

    // ZONE 3: Bio-Dairy Culture Vats & Swiss Cheese Accents
    [
      { x: -44, z: -32, r: 2.6, h: 3.8 },
      { x: -44, z: -56, r: 2.6, h: 3.8 },
      { x: -20, z: -30, r: 2.2, h: 3.4 }
    ].forEach(v => {
      this.createStainlessVat(v.x, v.z, v.r, v.h);
    });
    this.createDecorativeCheeseWheel(-46, -68, 2.1, 1.2, 0.5);

    // ZONE 4: Overhead Conveyor Sorting Arches (placed over the 3 sorting belts at x = 20, 32, 44)
    [20, 32, 44].forEach(x => {
      const archGroup = new THREE.Group();
      archGroup.position.set(x, 0, -48);

      const postGeo = new THREE.BoxGeometry(0.5, 3.2, 1.4);
      const postL = new THREE.Mesh(postGeo, this.mats.steel);
      postL.position.set(-1.7, 1.6, 0);
      addToonOutline(postL, 0.04, 0x1e293b);

      const postR = new THREE.Mesh(postGeo, this.mats.steel);
      postR.position.set(1.7, 1.6, 0);
      addToonOutline(postR, 0.04, 0x1e293b);

      const header = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.7, 1.6), this.mats.wallTrim);
      header.position.set(0, 3.2, 0);
      addToonOutline(header, 0.04, 0x1e293b);

      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), createToonMaterial(0x38bdf8));
      beacon.position.set(0, 3.7, 0);
      addToonOutline(beacon, 0.06, 0x1e293b);

      archGroup.add(postL, postR, header, beacon);
      this.scene.add(archGroup);
    });

    // ZONE 5: Multi-Tier Cedar Cheese Aging Racks stocked with Golden Swiss Cheese Wheels!
    [-22, 22].forEach(x => {
      const rackGroup = new THREE.Group();
      rackGroup.position.set(x, 0, -100);

      const woodMat = createToonMaterial(0x92400e);
      const darkWoodMat = createToonMaterial(0x78350f);

      // 4 Corner Posts
      const postGeo = new THREE.BoxGeometry(0.45, 5.2, 0.45);
      [-1.3, 1.3].forEach(px => {
        [-13.5, 0, 13.5].forEach(pz => {
          const post = new THREE.Mesh(postGeo, darkWoodMat);
          post.position.set(px, 2.6, pz);
          post.castShadow = true;
          addToonOutline(post, 0.04, 0x1e293b);
          rackGroup.add(post);
        });
      });

      // 3 Horizontal Shelf Planks + Cheese Wheels on shelves
      [1.2, 2.8, 4.4].forEach((py, tierIdx) => {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.25, 28), woodMat);
        plank.position.set(0, py, 0);
        plank.castShadow = true;
        addToonOutline(plank, 0.03, 0x1e293b);
        rackGroup.add(plank);

        // Decorative aged cheese wheels resting on the shelves
        for (let wz = -10; wz <= 10; wz += 5) {
          const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(1.05, 1.05, 0.75, 14),
            createToonMaterial(tierIdx % 2 === 0 ? 0xfbbf24 : 0xf59e0b)
          );
          wheel.position.set(0, py + 0.5, wz);
          addToonOutline(wheel, 0.04, 0x1e293b);
          rackGroup.add(wheel);
        }
      });

      this.scene.add(rackGroup);
      registerCollider({ type: 'box', cx: x, cz: -100, hx: 1.6, hz: 14, obj: null });
    });

    // Decorative giant cheese wheels in Zone 5 Vault corners
    this.createDecorativeCheeseWheel(-14, -90, 2.1, 1.25, 0.4);
    this.createDecorativeCheeseWheel(14, -90, 2.1, 1.25, -0.5);

    // Executive Suite Penthouse Red Carpet, Mahogany Desk & Throne Chair
    const carpet = new THREE.Mesh(
      new THREE.BoxGeometry(10.0, 0.06, 18.0),
      createToonMaterial(0xbe123c)
    );
    carpet.position.set(0, 0.03, -121);
    addToonOutline(carpet, 0.02, 0x1e293b);
    this.scene.add(carpet);

    const desk = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.35, 3.0), createToonMaterial(0x78350f));
    desk.position.set(0, 0.675, -125);
    desk.castShadow = true;
    addToonOutline(desk, 0.04, 0x1e293b);
    this.scene.add(desk);
    registerCollider({ type: 'box', cx: 0, cz: -125, hx: 3.6, hz: 1.6, obj: null });

    // Executive Leather Chair behind desk
    const chair = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.6, 1.6), createToonMaterial(0x1e293b));
    chair.position.set(0, 1.3, -128);
    addToonOutline(chair, 0.04, 0x0f172a);
    this.scene.add(chair);
  }

  openGateVisual(gateId) {
    const gateData = this.gateMeshes.get(gateId);
    const collider = this.gateColliders.get(gateId);

    if (collider) {
      removeCollider(collider);
      this.gateColliders.delete(gateId);
    }

    if (!gateData) return;
    sound.playGateOpen();
    gateData.beacon.material = this.mats.doorUnlocked;

    if (gateData.isBridge) {
      // Lower drawbridge to span the whey chasm
      let progress = 0;
      const lowerBridge = () => {
        progress += 0.04;
        gateData.leaf.rotation.z = THREE.MathUtils.lerp(Math.PI / 2.3, 0, progress);
        gateData.leaf.position.x = THREE.MathUtils.lerp(-6.0, 0, progress);
        if (progress < 1) requestAnimationFrame(lowerBridge);
      };
      lowerBridge();
    } else if (gateData.isVault) {
      // Roll open circular vault door
      let progress = 0;
      const openVault = () => {
        progress += 0.03;
        gateData.leaf.position.x = THREE.MathUtils.lerp(0, -6.5, progress);
        if (progress < 1) requestAnimationFrame(openVault);
      };
      openVault();
    } else {
      // Lift or slide open gate leaf
      let progress = 0;
      const liftLeaf = () => {
        progress += 0.05;
        gateData.leaf.position.y = THREE.MathUtils.lerp(gateData.origY, gateData.origY + 5.5, progress);
        gateData.leaf.material.opacity = THREE.MathUtils.lerp(1.0, 0.1, progress);
        if (progress < 1) requestAnimationFrame(liftLeaf);
      };
      liftLeaf();
    }
  }

  /**
   * Returns surface type for player's current (x, z)
   */
  getSurfaceAt(x, z) {
    for (let i = 0; i < this.surfaceRegions.length; i++) {
      const reg = this.surfaceRegions[i];
      if (x >= reg.minX && x <= reg.maxX && z >= reg.minZ && z <= reg.maxZ) {
        return reg.type;
      }
    }
    return null;
  }
}
