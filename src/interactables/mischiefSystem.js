import { sound } from '../audio/sound.js';
import { gameState } from '../core/state.js';
import { registerCollider, removeCollider } from '../core/spatialGrid.js';
import { spawnMilkSplash, spawnSparks, spawnFire, spawnFoamJet, spawnCartoonPuff } from '../entities/particle.js';
import { createToonMaterial, addToonOutline } from '../core/toonShader.js';
import { SURFACES } from '../core/constants.js';

export class MischiefManager {
  constructor(scene, player, mapBuilder = null) {
    this.scene = scene;
    this.player = player;
    this.mapBuilder = mapBuilder;

    this.crates = [];
    this.forklifts = [];
    this.boxes = [];
    this.stamper = null;
    this.intercomMic = null;
    this.hotWaxTank = null;
    this.milkCannons = [];
    this.extinguishers = [];

    this.initCrateTower();
    this.initForklifts();
    this.initCardboardBoxes();
    this.initPneumaticStamper();
    this.initExecutiveIntercom();
    this.initHotWaxTank();
    this.initMilkCannon();
    this.initExtinguishers();
  }

  // =========================================================================
  // 1. 10-TIER CRATE TOWER (Zone 1 Receiving Dock)
  // =========================================================================
  initCrateTower() {
    const crateMat = createToonMaterial(0x0284c7);
    const crateGeo = new THREE.BoxGeometry(1.2, 0.9, 1.2);
    const baseX = -5.5;
    const baseZ = 56;

    // 10 crates structured in pyramid tiers: 4 on bottom, 3 on tier 2, 2 on tier 3, 1 on top
    const tiers = [
      { y: 0.45, count: 4, startX: -1.8, spacing: 1.25 },
      { y: 1.38, count: 3, startX: -1.25, spacing: 1.25 },
      { y: 2.31, count: 2, startX: -0.62, spacing: 1.25 },
      { y: 3.24, count: 1, startX: 0, spacing: 1.25 }
    ];

    tiers.forEach(tier => {
      for (let i = 0; i < tier.count; i++) {
        const crate = new THREE.Mesh(crateGeo, crateMat);
        const x = baseX + tier.startX + i * tier.spacing;
        const z = baseZ + (Math.random() - 0.5) * 0.15;
        crate.position.set(x, tier.y, z);
        crate.castShadow = true;
        crate.receiveShadow = true;
        addToonOutline(crate, 0.045, 0x1e293b);
        this.scene.add(crate);

        const crateData = {
          mesh: crate,
          velocity: new THREE.Vector3(),
          isToppled: false,
          takeDamage: () => this.toppleCrateTower()
        };

        crateData.collider = { pos: crate.position, radius: 0.8, obj: crateData };
        registerCollider(crateData.collider);
        this.crates.push(crateData);
      }
    });
  }

  toppleCrateTower() {
    if (gameState.mischief.crateTower) return;
    gameState.completeMischief('crateTower');

    sound.playGlassShatter();
    sound.playExplosion();

    // Scatter all 10 crates outward violently
    this.crates.forEach(c => {
      c.isToppled = true;
      removeCollider(c.collider);
      c.velocity.set(
        (Math.random() - 0.5) * 22,
        Math.random() * 10 + 6,
        (Math.random() - 0.5) * 22
      );
      spawnMilkSplash(c.mesh.position, 6);
    });

    // Bowl over nearby forklifts and workers
    this.forklifts.forEach(f => {
      if (Math.hypot(f.mesh.position.x - 0, f.mesh.position.z - 62) < 20.0) {
        f.spinOut();
      }
    });

    gameState.addChaos(300, "10-TIER CRATE TOWER TOPPLED!! FORKLIFT BOWLING!");
  }

  // =========================================================================
  // FORKLIFTS (Zone 1 & Zone 4)
  // =========================================================================
  initForklifts() {
    const createForklift = (waypoints, initialIndex = 0) => {
      const flGroup = new THREE.Group();
      const startPt = waypoints[initialIndex];
      flGroup.position.set(startPt.x, 0, startPt.z);

      // Yellow industrial chassis
      const bodyMat = createToonMaterial(0xeab308);
      const steelMat = createToonMaterial(0x334155);
      const wheelMat = createToonMaterial(0x0f172a);
      const driverMat = createToonMaterial(0xfacc15);
      const skinMat = createToonMaterial(0xfde047);
      const hardHatMat = createToonMaterial(0xffffff);

      const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 3.2), bodyMat);
      body.position.y = 0.75;
      body.castShadow = true;
      addToonOutline(body, 0.04, 0x1e293b);

      // 4 Heavy-duty wheels
      const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 12);
      wheelGeo.rotateZ(Math.PI / 2);
      [-1.15, 1.15].forEach(wx => {
        [-1.0, 1.0].forEach(wz => {
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.position.set(wx, 0.38, wz);
          addToonOutline(wheel, 0.05, 0x1e293b);
          flGroup.add(wheel);
        });
      });

      // Protective Roll Cage Overhead
      const cageMat = createToonMaterial(0x1e293b);
      const cagePostGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 6);
      [-0.9, 0.9].forEach(cx => {
        [-0.8, 0.4].forEach(cz => {
          const post = new THREE.Mesh(cagePostGeo, cageMat);
          post.position.set(cx, 2.0, cz);
          flGroup.add(post);
        });
      });
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 1.4), cageMat);
      roof.position.set(0, 2.9, -0.2);
      flGroup.add(roof);

      // Seat & Steering Wheel Console
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.9), steelMat);
      seat.position.set(0, 1.4, -0.3);
      const wheelConsole = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.4), steelMat);
      wheelConsole.position.set(0, 1.6, 0.5);
      const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 6, 12), wheelMat);
      steeringWheel.rotation.x = Math.PI / 3;
      steeringWheel.position.set(0, 2.05, 0.4);
      flGroup.add(seat, wheelConsole, steeringWheel);

      // FACTORY WORKER DRIVER sitting in the seat!
      const driverGroup = new THREE.Group();
      driverGroup.position.set(0, 1.4, -0.2);

      const driverTorso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.85, 0.6), driverMat);
      driverTorso.position.y = 0.55;
      addToonOutline(driverTorso, 0.05, 0x1e293b);

      const driverHead = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), skinMat);
      driverHead.position.y = 1.35;
      addToonOutline(driverHead, 0.05, 0x1e293b);

      const hardHat = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), hardHatMat);
      hardHat.position.y = 1.45;
      hardHat.scale.set(1.05, 0.85, 1.15);
      addToonOutline(hardHat, 0.05, 0x1e293b);

      // Arms holding steering wheel
      const armGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);
      const leftArm = new THREE.Mesh(armGeo, driverMat);
      leftArm.position.set(-0.35, 0.6, 0.35);
      leftArm.rotation.x = Math.PI / 3;
      const rightArm = new THREE.Mesh(armGeo, driverMat);
      rightArm.position.set(0.35, 0.6, 0.35);
      rightArm.rotation.x = Math.PI / 3;

      driverGroup.add(driverTorso, driverHead, hardHat, leftArm, rightArm);
      flGroup.add(driverGroup);

      // Front Vertical Mast & Lift Forks
      const mast = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 0.16), steelMat);
      mast.position.set(0, 1.9, 1.65);
      addToonOutline(mast, 0.04, 0x1e293b);

      const forks = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 1.8), steelMat);
      forks.position.set(0, 0.22, 2.45);
      addToonOutline(forks, 0.04, 0x1e293b);

      // Wooden shipping pallet on forks
      const palletMat = createToonMaterial(0xb45309);
      const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 1.5), palletMat);
      pallet.position.set(0, 0.38, 2.45);
      addToonOutline(pallet, 0.04, 0x1e293b);

      // Cartoon Milk Crates on the pallet!
      const crateMat = createToonMaterial(0x0284c7);
      const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.65), crateMat);
      crate1.position.set(-0.38, 0.76, 2.45);
      addToonOutline(crate1, 0.05, 0x1e293b);
      const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.65), crateMat);
      crate2.position.set(0.38, 0.76, 2.45);
      addToonOutline(crate2, 0.05, 0x1e293b);

      flGroup.add(body, mast, forks, pallet, crate1, crate2);
      this.scene.add(flGroup);

      const fData = {
        mesh: flGroup,
        driver: driverGroup,
        speed: 4.5,
        waypoints: waypoints,
        targetIdx: (initialIndex + 1) % waypoints.length,
        isSpunOut: false,
        spinTimer: 0,
        spinOut: () => {
          fData.isSpunOut = true;
          fData.spinTimer = 3.5;
          sound.playPanic();
          sound.playMetalClang();
          spawnSparks(flGroup.position, 16);
          gameState.addChaos(120, "FORKLIFT DRIVER BOWLED OVER!");
        }
      };

      fData.collider = { pos: flGroup.position, radius: 1.8, obj: { takeDamage: () => fData.spinOut() } };
      registerCollider(fData.collider);

      this.forklifts.push(fData);
    };

    // Realistic navigation circuits that follow open warehouse aisles (never through walls or props!)
    // Zone 1: Receiving Bay East Aisle Loop (patrols wide open east dock lane between x: 16 and x: 30)
    createForklift([
      { x: 18, z: 54 },
      { x: 28, z: 54 },
      { x: 28, z: 75 },
      { x: 18, z: 75 }
    ], 0);

    // Zone 4: Packaging Aisle Loop (navigates clean perimeter around the sorting belts & arches)
    createForklift([
      { x: 10, z: -20 },
      { x: 52, z: -20 },
      { x: 52, z: -64 },
      { x: 10, z: -64 }
    ], 0);
  }

  // =========================================================================
  // 3. CARDBOARD BOXES (Zone 4 Packaging Maze)
  // =========================================================================
  initCardboardBoxes() {
    const boxMat = createToonMaterial(0xd97706);
    const tapeMat = createToonMaterial(0xfef08a);
    const boxGeo = new THREE.BoxGeometry(1.5, 1.4, 1.5);

    const boxPositions = [
      { x: 14, z: -30 },
      { x: 38, z: -44 }
    ];

    boxPositions.forEach(bp => {
      const boxGroup = new THREE.Group();
      boxGroup.position.set(bp.x, 0.7, bp.z);

      const box = new THREE.Mesh(boxGeo, boxMat);
      box.castShadow = true;
      addToonOutline(box, 0.045, 0x1e293b);
      boxGroup.add(box);

      // Packing tape strip on top
      const tape = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.08, 0.35), tapeMat);
      tape.position.y = 0.68;
      boxGroup.add(tape);

      this.scene.add(boxGroup);

      const boxData = {
        mesh: boxGroup,
        isUsed: false
      };

      const collider = {
        pos: boxGroup.position,
        radius: 1.4,
        obj: {
          takeDamage: () => this.enterCardboardBox(boxData)
        }
      };
      registerCollider(collider);
      this.boxes.push(boxData);
    });
  }

  enterCardboardBox(boxData) {
    if (this.player.isDisguised) {
      // Exit disguise
      this.player.exitBoxDisguise();
      return;
    }

    sound.playSquish();
    boxData.mesh.visible = false;
    this.player.enterBoxDisguise();
    gameState.addChaos(50, "DISGUISED IN CARDBOARD BOX!");
  }

  // =========================================================================
  // 4. PNEUMATIC LABEL STAMPER (Zone 4 Packaging Maze)
  // =========================================================================
  initPneumaticStamper() {
    const stamperGroup = new THREE.Group();
    // Placed in the open packaging aisle at x: 32, z: -22 so the player can cleanly belly-slide underneath!
    stamperGroup.position.set(32, 0, -22);

    const frameMat = createToonMaterial(0x475569);
    const hazardMat = createToonMaterial(0xfacc15);

    // 2 Side Gantry Pillars leaving a wide 3.2m tunnel underneath for belly-sliding!
    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.4, 2.2), frameMat);
    leftPillar.position.set(-1.95, 2.2, 0);
    leftPillar.castShadow = true;
    addToonOutline(leftPillar, 0.04, 0x1e293b);

    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.4, 2.2), frameMat);
    rightPillar.position.set(1.95, 2.2, 0);
    rightPillar.castShadow = true;
    addToonOutline(rightPillar, 0.04, 0x1e293b);

    // Overhead Crossbeam Header
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.9, 2.4), frameMat);
    topBeam.position.set(0, 4.35, 0);
    addToonOutline(topBeam, 0.04, 0x1e293b);

    // Moving Piston Stamper Head
    const piston = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.25, 0.7, 16), hazardMat);
    piston.position.y = 3.6;
    addToonOutline(piston, 0.05, 0x1e293b);

    stamperGroup.add(leftPillar, rightPillar, topBeam, piston);
    this.scene.add(stamperGroup);

    this.stamper = {
      group: stamperGroup,
      piston: piston,
      timer: 0,
      isDown: false
    };

    // Only register colliders on the two side pillars so the center tunnel is open!
    registerCollider({ type: 'box', cx: 30.05, cz: -22, hx: 0.45, hz: 1.1, obj: null });
    registerCollider({ type: 'box', cx: 33.95, cz: -22, hx: 0.45, hz: 1.1, obj: null });
  }

  // =========================================================================
  // 5. EXECUTIVE INTERCOM MICROPHONE (Zone 5 Penthouse Suite)
  // =========================================================================
  initExecutiveIntercom() {
    // Microphone on desk at (0, 1.8, -124.5)
    const micGroup = new THREE.Group();
    micGroup.position.set(0, 1.4, -124.5);

    const stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.35, 0.15, 12),
      createToonMaterial(0x1e293b)
    );
    addToonOutline(stand, 0.05, 0x1e293b);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.65, 8),
      createToonMaterial(0xfacc15)
    );
    stem.position.y = 0.35;
    addToonOutline(stem, 0.05, 0x1e293b);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 12, 12),
      createToonMaterial(0xef4444)
    );
    head.position.y = 0.75;
    addToonOutline(head, 0.06, 0x1e293b);

    micGroup.add(stand, stem, head);
    this.scene.add(micGroup);

    const micObj = {
      takeDamage: () => this.broadcastIntercomSquawk()
    };
    registerCollider({ pos: new THREE.Vector3(0, 1.4, -124.5), radius: 2.2, obj: micObj });
    this.intercomMic = micGroup;
  }

  broadcastIntercomSquawk() {
    sound.playSquawk();
    sound.playSquawk();

    spawnSparks(this.intercomMic.position, 25);
    gameState.triggerStaffStun(6.0);
  }

  // =========================================================================
  // HOT WAX DIP TANK (Zone 5 Penthouse Suite)
  // =========================================================================
  initHotWaxTank() {
    const tankGroup = new THREE.Group();
    tankGroup.position.set(-14, 0, -118);

    // Steel containment tub
    const rim = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.65, 4.6),
      createToonMaterial(0x64748b)
    );
    rim.position.y = 0.325;
    addToonOutline(rim, 0.04, 0x1e293b);

    // Molten crimson cheese wax pool
    const waxPool = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 0.55, 4.0),
      createToonMaterial(0xef4444)
    );
    waxPool.position.y = 0.36;
    addToonOutline(waxPool, 0.03, 0x1e293b);

    tankGroup.add(rim, waxPool);
    this.scene.add(tankGroup);
    this.hotWaxTank = tankGroup;
  }

  // =========================================================================
  // PRESSURE-COOKER MILK JUG CANNON (Zone 1 Receiving Dock)
  // =========================================================================
  initMilkCannon() {
    const cannonGroup = new THREE.Group();
    const pos = new THREE.Vector3(-14, 0, 80);
    cannonGroup.position.copy(pos);

    // Wooden staging pallet base
    const pallet = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.25, 2.4),
      createToonMaterial(0xb45309)
    );
    pallet.position.y = 0.125;
    addToonOutline(pallet, 0.04, 0x1e293b);
    cannonGroup.add(pallet);

    // High pressure CO2 tank next to pallet
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 2.0, 10),
      createToonMaterial(0x3b82f6)
    );
    tank.position.set(-1.4, 1.0, 0);
    addToonOutline(tank, 0.05, 0x1e293b);
    cannonGroup.add(tank);

    // Pressure gauge dial on top of CO2 tank
    const dial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.08, 12),
      createToonMaterial(0xfacc15)
    );
    dial.rotateX(Math.PI / 2);
    dial.position.set(-1.4, 2.1, 0.2);
    cannonGroup.add(dial);

    // Red manual release valve wheel
    const valve = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.05, 6, 12),
      createToonMaterial(0xef4444)
    );
    valve.position.set(-1.4, 1.8, 0.4);
    cannonGroup.add(valve);

    // Pyramidal stack of pressurized white milk jugs
    const jugGeo = new THREE.CylinderGeometry(0.28, 0.3, 0.85, 10);
    const jugMat = createToonMaterial(0xffffff);
    const capMat = createToonMaterial(0x0284c7);

    const jugMeshes = [];
    const jugPositions = [
      { x: -0.5, y: 0.65, z: -0.5 },
      { x: 0.5, y: 0.65, z: -0.5 },
      { x: -0.5, y: 0.65, z: 0.5 },
      { x: 0.5, y: 0.65, z: 0.5 },
      { x: 0, y: 1.45, z: 0 }
    ];

    jugPositions.forEach(jp => {
      const jugGroup = new THREE.Group();
      jugGroup.position.set(jp.x, jp.y, jp.z);

      const jMesh = new THREE.Mesh(jugGeo, jugMat);
      addToonOutline(jMesh, 0.06, 0x1e293b);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.14, 8), capMat);
      cap.position.y = 0.46;

      jugGroup.add(jMesh, cap);
      cannonGroup.add(jugGroup);
      jugMeshes.push(jugGroup);
    });

    this.scene.add(cannonGroup);

    const cannonData = {
      group: cannonGroup,
      jugs: jugMeshes,
      valve: valve,
      pos: pos,
      isTriggered: false,
      shakeTimer: 0,
      exploded: false
    };

    cannonData.collider = {
      pos: pos,
      radius: 2.2,
      obj: {
        takeDamage: () => this.triggerMilkCannon(cannonData)
      }
    };
    registerCollider(cannonData.collider);
    this.milkCannons.push(cannonData);
  }

  triggerMilkCannon(cannon) {
    if (cannon.isTriggered) return;
    cannon.isTriggered = true;
    cannon.shakeTimer = 1.0; // 1s swelling & violent shaking buildup

    sound.playSteamHiss();
    sound.playPop();
    spawnSparks(cannon.pos, 15);
    gameState.addChaos(75, "CO2 PRESSURE OVERLOAD!");
  }

  explodeMilkCannon(cannon) {
    cannon.exploded = true;
    removeCollider(cannon.collider);

    sound.playExplosion();
    sound.playPop();
    sound.playSquish();

    // Huge milk splash and fire blast upward
    const blastPos = cannon.pos.clone().setY(1.0);
    spawnMilkSplash(blastPos, 35);
    spawnFire(blastPos, 20);
    spawnSparks(blastPos, 25);

    // Launch milk jugs flying into the air!
    cannon.jugs.forEach(j => {
      j.position.y += Math.random() * 8.0 + 4.0;
      j.position.x += (Math.random() - 0.5) * 12.0;
      j.position.z += (Math.random() - 0.5) * 12.0;
      j.rotation.x = Math.random() * Math.PI * 2;
      j.rotation.z = Math.random() * Math.PI * 2;
    });

    // Knock over nearby guards & workers in blast radius
    if (this.player && this.player.guards) {
      this.player.guards.forEach(g => {
        const dSq = g.mesh.position.distanceToSquared(blastPos);
        if (dSq < 144) {
          const blast = g.mesh.position.clone().sub(blastPos);
          if (blast.lengthSq() > 0.001) blast.normalize();
          g.slip(blast.multiplyScalar(20));
          sound.playPanic();
        }
      });
    }
    if (this.player && this.player.workers) {
      this.player.workers.forEach(w => {
        const dSq = w.mesh.position.distanceToSquared(blastPos);
        if (dSq < 144) {
          const blast = w.mesh.position.clone().sub(blastPos);
          if (blast.lengthSq() > 0.001) blast.normalize();
          w.slip(blast.multiplyScalar(16));
        }
      });
    }

    // Spawn massive organic milk puddle where the cannon blew up!
    if (this.mapBuilder && this.mapBuilder.createOrganicPuddleGroup) {
      const puddle = this.mapBuilder.createOrganicPuddleGroup(14, 14, 0xffffff, true);
      puddle.position.copy(cannon.pos);
      this.scene.add(puddle);
      this.mapBuilder.surfaceRegions.push({
        type: SURFACES.SKIM_MILK,
        minX: cannon.pos.x - 7,
        maxX: cannon.pos.x + 7,
        minZ: cannon.pos.z - 7,
        maxZ: cannon.pos.z + 7
      });
    }

    gameState.completeMischief('milkCannon');
    gameState.addChaos(350, "PRESSURIZED MILK CANNON DETONATED!!");
  }

  // =========================================================================
  // CHEMICAL FIRE EXTINGUISHER ROCKETS (Zone 1 & Zone 2)
  // =========================================================================
  initExtinguishers() {
    const extMat = createToonMaterial(0xef4444); // Glossy fire engine red
    const cartMat = createToonMaterial(0x1e293b);
    const wheelMat = createToonMaterial(0x0f172a);
    const brassMat = createToonMaterial(0xfacc15);

    const positions = [
      { x: 14, z: 88, heading: Math.PI },   // Zone 1 South Wall
      { x: -16, z: 38, heading: 0 },        // Zone 2 West Wall
      { x: 22, z: 20, heading: -Math.PI / 2} // Zone 2 Center Wall
    ];

    positions.forEach(p => {
      const group = new THREE.Group();
      group.position.set(p.x, 0, p.z);
      group.rotation.y = p.heading;

      // Wheeled trolley frame
      const trolley = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.6), cartMat);
      trolley.position.y = 0.7;
      group.add(trolley);

      // Rubber wheels
      const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.12, 10);
      wheelGeo.rotateZ(Math.PI / 2);
      [-0.45, 0.45].forEach(wx => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(wx, 0.24, 0);
        group.add(wheel);
      });

      // Red extinguisher tank cylinder
      const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 1.6, 12),
        extMat
      );
      tank.position.y = 1.0;
      addToonOutline(tank, 0.05, 0x1e293b);
      group.add(tank);

      // Brass top valve & horn nozzle
      const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8), brassMat);
      valve.position.y = 1.9;
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 8), cartMat);
      horn.rotateX(Math.PI / 2);
      horn.position.set(0, 1.8, -0.4);
      group.add(valve, horn);

      this.scene.add(group);

      const extData = {
        mesh: group,
        horn: horn,
        velocity: new THREE.Vector3(),
        isLaunched: false,
        fuel: 0,
        spin: 0
      };

      extData.collider = {
        pos: group.position,
        radius: 1.4,
        obj: {
          takeDamage: () => this.launchExtinguisherRocket(extData)
        }
      };
      registerCollider(extData.collider);
      this.extinguishers.push(extData);
    });
  }

  launchExtinguisherRocket(ext) {
    if (ext.isLaunched) return;
    ext.isLaunched = true;
    ext.fuel = 4.5; // 4.5 seconds of rocket thrust!
    ext.spin = (Math.random() - 0.5) * 8.0;

    // Launch forward with initial burst
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), ext.mesh.rotation.y);
    ext.velocity = forward.multiplyScalar(16.0);

    sound.playWhoosh();
    sound.playSteamHiss();
    spawnSparks(ext.mesh.position, 15);
    gameState.completeMischief('rocketExtinguisher');
    gameState.addChaos(150, "FIRE EXTINGUISHER ROCKET LAUNCHED!!");
  }

  update(dt, player) {
    // 1. Update scattered crates physics
    this.crates.forEach(c => {
      if (c.isToppled && c.velocity.lengthSq() > 0.01) {
        c.velocity.y -= 22.0 * dt; // gravity
        c.mesh.position.addScaledVector(c.velocity, dt);

        if (c.mesh.position.y <= 0.45) {
          c.mesh.position.y = 0.45;
          c.velocity.y = -c.velocity.y * 0.35; // bounce
          c.velocity.multiplyScalar(0.7);
        }
      }
    });

    // 2. Update Forklifts with realistic steering, driver head turn, and waypoint navigation
    this.forklifts.forEach(f => {
      if (f.isSpunOut) {
        f.spinTimer -= dt;
        f.mesh.rotation.y += dt * 12.0;
        if (f.driver) {
          f.driver.rotation.z = Math.sin(Date.now() * 0.02) * 0.4;
        }
        if (f.spinTimer <= 0) {
          f.isSpunOut = false;
          if (f.driver) f.driver.rotation.z = 0;
        }
      } else {
        const target = f.waypoints[f.targetIdx];
        const dx = target.x - f.mesh.position.x;
        const dz = target.z - f.mesh.position.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 1.2) {
          // Reached waypoint: proceed to next aisle node
          f.targetIdx = (f.targetIdx + 1) % f.waypoints.length;
        } else {
          // Smoothly steer towards target waypoint
          const targetAngle = Math.atan2(dx, dz);
          let diff = targetAngle - f.mesh.rotation.y;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          f.mesh.rotation.y += diff * Math.min(1.0, dt * 5.0);

          // Drive forward in heading direction
          const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), f.mesh.rotation.y);
          f.mesh.position.addScaledVector(forward, f.speed * dt);

          // Subtle driver animation
          if (f.driver) {
            f.driver.rotation.y = diff * 0.4;
          }
        }
        f.collider.pos = f.mesh.position;
      }
    });

    // 3. Update Pneumatic Stamper cycle
    if (this.stamper) {
      this.stamper.timer += dt * 2.8;
      const cycle = Math.sin(this.stamper.timer);
      const stampH = cycle > 0.8 ? 0.6 : THREE.MathUtils.lerp(3.6, 0.6, Math.max(0, cycle));
      this.stamper.piston.position.y = stampH;

      // Check if player slides under while stamping down
      if (stampH < 1.1 && player && player.mesh) {
        const dist = Math.hypot(player.mesh.position.x - 32, player.mesh.position.z - (-22));
        if (dist < 2.2 && !gameState.mischief.certifiedDairy) {
          player.applyDairyStampBadge();
          sound.playDing();
          sound.playHydraulic();
          gameState.completeMischief('certifiedDairy');
          gameState.addChaos(250, "CERTIFIED GRADE-A DAIRY PENGUIN!");
        }
      }
    }

    // 4. Hot Wax Dip Tank Invulnerability Check
    if (this.hotWaxTank && player && player.mesh) {
      const dist = Math.hypot(player.mesh.position.x - (-14), player.mesh.position.z - (-118));
      if (dist < 2.0 && player.waxArmorTimer <= 0) {
        player.applyWaxArmor(12.0);
        sound.playSquish();
        gameState.addChaos(150, "HOT WAX INVULNERABILITY ARMOR!");
      }
    }

    // 5. Update Milk Cannons
    this.milkCannons.forEach(cannon => {
      if (cannon.isTriggered && !cannon.exploded) {
        cannon.shakeTimer -= dt;
        // Violent cartoon wobble buildup
        const shake = (1.0 - cannon.shakeTimer) * 0.15;
        cannon.group.position.x = cannon.pos.x + (Math.random() - 0.5) * shake;
        cannon.group.position.z = cannon.pos.z + (Math.random() - 0.5) * shake;
        cannon.group.scale.y = 1.0 + Math.sin(Date.now() * 0.05) * 0.15;

        spawnFoamJet(cannon.pos.clone().setY(2.2), new THREE.Vector3(0, 1, 0), 2);

        if (cannon.shakeTimer <= 0) {
          this.explodeMilkCannon(cannon);
        }
      }
    });

    // 6. Update Fire Extinguisher Rockets
    this.extinguishers.forEach(ext => {
      if (ext.isLaunched && ext.fuel > 0) {
        ext.fuel -= dt;

        // Thrust forward
        ext.mesh.position.addScaledVector(ext.velocity, dt);
        ext.mesh.rotation.y += ext.spin * dt;

        // Emit high pressure foam jet backward from the horn nozzle
        const backDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), ext.mesh.rotation.y);
        spawnFoamJet(ext.mesh.position.clone().setY(0.8), backDir, 3);

        ext.collider.pos = ext.mesh.position;

        // Knock down any guards or workers in its path!
        if (this.player && this.player.guards) {
          this.player.guards.forEach(g => {
            if (g.mesh.position.distanceToSquared(ext.mesh.position) < 9.0 && g.state !== 'slipped') {
              g.slip(ext.velocity.clone().multiplyScalar(1.2));
              sound.playPanic();
              sound.playMetalClang();
              gameState.addChaos(120, "GUARD BOWLED OVER BY ROCKET!");
            }
          });
        }
        if (this.player && this.player.workers) {
          this.player.workers.forEach(w => {
            if (w.mesh.position.distanceToSquared(ext.mesh.position) < 8.0 && w.state !== 'slipped') {
              w.slip(ext.velocity.clone().multiplyScalar(1.2));
              sound.playPanic();
            }
          });
        }

        // Bounce wildly off boundary limits
        if (ext.mesh.position.x > 34 || ext.mesh.position.x < -34) {
          ext.velocity.x *= -0.8;
          ext.spin = (Math.random() - 0.5) * 12.0;
          sound.playMetalClang();
          spawnSparks(ext.mesh.position, 8);
        }
        if (ext.mesh.position.z > 94 || ext.mesh.position.z < -14) {
          ext.velocity.z *= -0.8;
          ext.spin = (Math.random() - 0.5) * 12.0;
          sound.playMetalClang();
          spawnSparks(ext.mesh.position, 8);
        }

        if (ext.fuel <= 0) {
          // Final splat explosion
          sound.playExplosion();
          spawnMilkSplash(ext.mesh.position, 20);
          removeCollider(ext.collider);
          ext.mesh.rotation.x = Math.PI / 2;
          ext.mesh.position.y = 0.3;
        }
      }
    });
  }
}
