import { sound } from '../audio/sound.js';
import { gameState } from '../core/state.js';
import { registerCollider, removeCollider } from '../core/spatialGrid.js';
import { spawnMilkSplash, spawnSparks, spawnFire } from '../entities/particle.js';
import { SURFACES } from '../core/constants.js';
import { createToonMaterial, addToonOutline } from '../core/toonShader.js';

export class GatePuzzlesManager {
  constructor(scene, mapBuilder) {
    this.scene = scene;
    this.mapBuilder = mapBuilder;

    // Puzzle State
    this.gate1_chocks = [];
    this.gate1_tanker = null;
    this.gate1_rolling = false;
    this.gate1_tankerZ = 80;

    this.gate2_valves = [];
    this.gate2_valvesTurned = 0;
    this.gate2_breakerShortCircuited = false;
    this.gate2_breakerMesh = null;

    this.gate3_centrifugeMesh = null;
    this.gate3_leverMesh = null;
    this.gate3_leverActivated = false;

    this.gate4_cheeseWheels = [];
    this.gate4_pads = [];
    this.gate4_padsFilled = 0;

    this.initGate1();
    this.initGate2();
    this.initGate3();
    this.initGate4();
  }

  // =========================================================================
  // GATE 1: TANKER TRUCK & CHOCKS (Zone 1 Receiving Dock)
  // =========================================================================
  initGate1() {
    // Parked Milk Tanker facing Gate 1 (Positioned north of the starting splash zone so the starting screen matches the reference art!)
    const truckGroup = new THREE.Group();
    const startZ = 66;
    this.gate1_tankerZ = startZ;
    truckGroup.position.set(0, 0, startZ);

    // Large stainless steel tanker with cartoon cel-shading
    const tankerMat = createToonMaterial(0xcbd5e1);
    const tanker = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 9.5, 16), tankerMat);
    tanker.rotateX(Math.PI / 2);
    tanker.position.y = 2.7;
    tanker.castShadow = true;
    addToonOutline(tanker, 0.04, 0x1e293b);

    // Red warning bumper on rear pointing towards Gate 1 (North)
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.8, 0.8), createToonMaterial(0xef4444));
    bumper.position.set(0, 1.2, -5.0);
    addToonOutline(bumper, 0.04, 0x1e293b);

    // Truck cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.2, 4.0), createToonMaterial(0x0284c7));
    cab.position.set(0, 1.9, 5.5);
    cab.castShadow = true;
    addToonOutline(cab, 0.04, 0x1e293b);

    truckGroup.add(tanker, bumper, cab);
    this.scene.add(truckGroup);
    this.gate1_tanker = truckGroup;

    this.gate1_truckCollider = {
      type: 'box',
      cx: 0,
      cz: startZ,
      hx: 2.1,
      hz: 6.8,
      obj: null
    };
    registerCollider(this.gate1_truckCollider);

    // 2 Slap-able Rubber Wheel Chocks
    const chockMat = createToonMaterial(0xfacc15);
    const chockGeo = new THREE.BoxGeometry(0.8, 0.6, 1.2);

    const chockPositions = [
      { x: -2.4, z: startZ, id: 'left' },
      { x: 2.4, z: startZ, id: 'right' }
    ];

    chockPositions.forEach(cp => {
      const chock = new THREE.Mesh(chockGeo, chockMat);
      chock.position.set(cp.x, 0.3, cp.z);
      addToonOutline(chock, 0.06);
      this.scene.add(chock);

      const chockObj = {
        mesh: chock,
        dislodged: false,
        takeDamage: () => this.dislodgeChock(chockObj)
      };

      const collider = { pos: chock.position, radius: 0.9, obj: chockObj };
      registerCollider(collider);
      chockObj.collider = collider;

      this.gate1_chocks.push(chockObj);
    });
  }

  dislodgeChock(chockObj) {
    if (chockObj.dislodged) return;
    chockObj.dislodged = true;
    removeCollider(chockObj.collider);

    sound.playMetalClang();
    spawnSparks(chockObj.mesh.position, 12);

    // Fly off
    chockObj.mesh.position.y += 2.0;
    chockObj.mesh.position.x += (chockObj.mesh.position.x > 0 ? 3.0 : -3.0);
    chockObj.mesh.rotation.z = 0.5;

    const remaining = this.gate1_chocks.filter(c => !c.dislodged).length;
    if (remaining > 0) {
      gameState.addChaos(50, "WHEEL CHOCK REMOVED (1/2)!");
    } else {
      // Both chocks removed: Tanker rolls backwards down the slope!
      this.gate1_rolling = true;
      sound.playRumble();
      gameState.addChaos(150, "RUNAWAY TANKER ROLLING!!");
    }
  }

  // =========================================================================
  // GATE 2: STEAM VALVES & BREAKER SHORT-CIRCUIT (Zone 2)
  // =========================================================================
  initGate2() {
    // 3 Steam Valves mounted on floor-standing steam risers along Zone 2
    const valveMat = createToonMaterial(0xef4444);
    const pipeMat = createToonMaterial(0x94a3b8);
    const flangeMat = createToonMaterial(0x475569);
    const valveGeo = new THREE.TorusGeometry(0.55, 0.14, 10, 18);

    const valvePositions = [
      { x: -14, y: 1.4, z: 24 },
      { x: 0, y: 1.4, z: 30 },
      { x: 14, y: 1.4, z: 22 }
    ];

    valvePositions.forEach((vp, idx) => {
      const riserGroup = new THREE.Group();
      riserGroup.position.set(vp.x, 0, vp.z);

      // Floor riser pipe column
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 2.2, 12), pipeMat);
      pipe.position.y = 1.1;
      pipe.castShadow = true;
      addToonOutline(pipe, 0.05, 0x1e293b);
      riserGroup.add(pipe);

      // Base flange
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.7, 0.2, 12), flangeMat);
      base.position.y = 0.1;
      addToonOutline(base, 0.05, 0x1e293b);
      riserGroup.add(base);

      // Pressure gauge on top of riser
      const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.14, 12), createToonMaterial(0xfef08a));
      gauge.rotateX(Math.PI / 2);
      gauge.position.set(0, 2.35, 0.1);
      addToonOutline(gauge, 0.06, 0x1e293b);
      riserGroup.add(gauge);

      // Interactive red valve wheel with cross-spokes
      const valveGroup = new THREE.Group();
      valveGroup.position.set(0, vp.y, 0.42);

      const valveWheel = new THREE.Mesh(valveGeo, valveMat);
      addToonOutline(valveWheel, 0.06, 0x1e293b);
      const spoke1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 0.12), valveMat);
      const spoke2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.12), valveMat);
      valveGroup.add(valveWheel, spoke1, spoke2);
      riserGroup.add(valveGroup);

      this.scene.add(riserGroup);

      const worldPos = new THREE.Vector3(vp.x, vp.y, vp.z);
      const valveObj = {
        mesh: valveGroup,
        wheel: valveWheel,
        worldPos: worldPos,
        turns: 0,
        maxTurns: 3,
        takeDamage: () => this.turnSteamValve(valveObj, idx)
      };

      const col = { pos: worldPos, radius: 1.35, obj: valveObj };
      registerCollider(col);
      this.gate2_valves.push(valveObj);
    });

    // High-Voltage Breaker Box beside Turnstiles
    const breakerGroup = new THREE.Group();
    breakerGroup.position.set(-6, 1.8, -14.8);
    const breaker = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 2.2, 0.7),
      createToonMaterial(0x334155)
    );
    addToonOutline(breaker, 0.04, 0x1e293b);
    const hazardSign = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 0.75),
      createToonMaterial(0xfacc15)
    );
    addToonOutline(hazardSign, 0.04, 0x1e293b);
    breakerGroup.add(breaker, hazardSign);
    this.scene.add(breakerGroup);
    this.gate2_breakerMesh = breakerGroup;
  }

  turnSteamValve(valveObj, idx) {
    if (valveObj.turns >= valveObj.maxTurns) return;
    valveObj.turns++;
    valveObj.mesh.rotation.z += Math.PI / 2;

    sound.playSteamHiss();
    spawnMilkSplash(valveObj.worldPos, 10);
    spawnSparks(valveObj.worldPos, 8);

    if (valveObj.turns >= valveObj.maxTurns) {
      valveObj.wheel.material = createToonMaterial(0x22c55e);
      this.gate2_valvesTurned++;
      gameState.addChaos(90, `VALVE ${idx + 1} OVERPRESSURIZED! (${this.gate2_valvesTurned}/3)`);

      if (this.gate2_valvesTurned >= 3 && !this.gate2_breakerShortCircuited) {
        this.triggerBreakerShortCircuit();
      }
    } else {
      gameState.addChaos(30, `VALVE PRESSURE RISING (${valveObj.turns}/3)`);
    }
  }

  triggerBreakerShortCircuit() {
    this.gate2_breakerShortCircuited = true;
    sound.playExplosion();
    sound.playZap();

    // Intense lightning sparks and milk splash on breaker
    spawnSparks(this.gate2_breakerMesh.position, 35);
    spawnMilkSplash(this.gate2_breakerMesh.position, 25);
    spawnFire(this.gate2_breakerMesh.position, 20);

    // Unlock Gate 2 Turnstiles
    gameState.unlockGate('gate_2');
    gameState.addChaos(400, "CIRCUIT BREAKER SHORTED! TURNSTILES OPEN!!");
  }

  // =========================================================================
  // GATE 3: CENTRIFUGE LAUNCHER & WHEY DRAWBRIDGE (Zone 3 <-> Zone 4)
  // =========================================================================
  initGate3() {
    // Open Centrifuge Pit in Zone 3 with rotating turbine fins
    const centGroup = new THREE.Group();
    centGroup.position.set(-32, 0, -48);

    const outerDrum = new THREE.Mesh(
      new THREE.CylinderGeometry(3.8, 3.5, 1.5, 20),
      createToonMaterial(0x10b981)
    );
    outerDrum.position.y = 0.75;
    outerDrum.castShadow = true;
    addToonOutline(outerDrum, 0.04, 0x1e293b);
    centGroup.add(outerDrum);

    const innerRotor = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 2.8, 1.6, 16),
      createToonMaterial(0x0f172a)
    );
    innerRotor.position.y = 0.76;
    centGroup.add(innerRotor);

    // Hazard rim stripes
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(3.65, 0.22, 8, 24),
      createToonMaterial(0xfacc15)
    );
    rim.rotateX(Math.PI / 2);
    rim.position.y = 1.52;
    addToonOutline(rim, 0.04, 0x1e293b);
    centGroup.add(rim);

    this.scene.add(centGroup);
    this.gate3_centrifugeMesh = centGroup;

    // Emergency Yellow Drawbridge Lever on Zone 3 side of Whey Chasm (x: -7.5, z: -46)
    const leverPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.68, 2.6, 12),
      createToonMaterial(0x475569)
    );
    leverPillar.position.set(-7.5, 1.3, -46);
    leverPillar.castShadow = true;
    addToonOutline(leverPillar, 0.05, 0x1e293b);
    this.scene.add(leverPillar);

    const leverHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 1.5, 0.35),
      createToonMaterial(0xfacc15)
    );
    leverHandle.position.set(-7.5, 2.3, -45.5);
    leverHandle.rotation.x = 0.5; // Tilted up
    addToonOutline(leverHandle, 0.06, 0x1e293b);
    this.scene.add(leverHandle);
    this.gate3_leverMesh = leverHandle;

    const leverObj = {
      takeDamage: () => this.activateWheyBridgeLever()
    };
    registerCollider({ pos: leverHandle.position, radius: 2.8, obj: leverObj });
  }

  activateWheyBridgeLever() {
    if (this.gate3_leverActivated) return;
    this.gate3_leverActivated = true;
    this.gate3_leverMesh.rotation.x = -0.5; // Pull down lever

    sound.playLeverClick();
    sound.playHydraulic();
    sound.playGateOpen();
    spawnSparks(this.gate3_leverMesh.position, 20);

    // Unlock Gate 3 Drawbridge
    gameState.unlockGate('gate_3');
    gameState.addChaos(450, "WHEY DRAWBRIDGE LOWERED!!");
  }

  // =========================================================================
  // GATE 4: CHEESE TUMBLER PUZZLE & 3 FLOOR PADS (Zone 3 & Zone 4 -> Zone 5 Vault)
  // =========================================================================
  initGate4() {
    const cheeseMat = createToonMaterial(0xfbbf24);
    const rindAccentMat = createToonMaterial(0xd97706);
    const cheeseGeo = new THREE.CylinderGeometry(1.5, 1.5, 1.1, 20);
    cheeseGeo.rotateZ(Math.PI / 2);

    // Placed on the SOUTH side of Gate 4 (Zones 3 & 4 at Z = -64 to -68) so the player can roll them into the pads at Z = -73.5 to unlock the Vault!
    const wheelPositions = [
      { x: -12, z: -66 },
      { x: 4, z: -63 },
      { x: 14, z: -66 }
    ];

    wheelPositions.forEach((wp, idx) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(wp.x, 1.5, wp.z);

      const wheelMesh = new THREE.Mesh(cheeseGeo, cheeseMat);
      wheelMesh.castShadow = true;
      addToonOutline(wheelMesh, 0.05, 0x1e293b);
      wheelGroup.add(wheelMesh);

      // Decorative Swiss cheese wax stamp on sides
      const label = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.14, 12), rindAccentMat);
      label.rotateZ(Math.PI / 2);
      addToonOutline(label, 0.05, 0x1e293b);
      wheelGroup.add(label);

      this.scene.add(wheelGroup);

      const wheelObj = {
        mesh: wheelGroup,
        velocity: new THREE.Vector3(),
        isSeated: false,
        radius: 1.5,
        takeDamage: (amount, dir) => {
          if (wheelObj.isSeated) return;
          sound.playSlap();
          wheelObj.velocity.x += dir.x * 18.0;
          wheelObj.velocity.z += dir.z * 18.0;
          spawnMilkSplash(wheelGroup.position, 6);
        }
      };

      wheelObj.collider = { pos: wheelGroup.position, radius: 1.5, obj: wheelObj };
      registerCollider(wheelObj.collider);
      this.gate4_cheeseWheels.push(wheelObj);
    });

    // 3 Recessed Circular Floor Pads in front of Gate 4 at Z = -73.5
    const padPositions = [
      { x: -6, z: -73.5 },
      { x: 0, z: -73.5 },
      { x: 6, z: -73.5 }
    ];

    padPositions.forEach(pp => {
      const padGroup = new THREE.Group();
      padGroup.position.set(pp.x, 0.06, pp.z);

      const rimMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.85, 1.95, 0.1, 20),
        createToonMaterial(0x334155)
      );
      addToonOutline(rimMesh, 0.04, 0x1e293b);

      const padMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 0.14, 20),
        createToonMaterial(0xef4444)
      );
      padMesh.position.y = 0.02;
      addToonOutline(padMesh, 0.04, 0x1e293b);

      padGroup.add(rimMesh, padMesh);
      this.scene.add(padGroup);

      this.gate4_pads.push({
        x: pp.x,
        z: pp.z,
        mesh: padMesh,
        filled: false
      });
    });
  }

  update(dt, player) {
    // -----------------------------------------------------------------------
    // Gate 1: Tanker Rolling Physics
    // -----------------------------------------------------------------------
    if (this.gate1_rolling && this.gate1_tanker) {
      this.gate1_tankerZ -= dt * 14.0;
      this.gate1_tanker.position.z = this.gate1_tankerZ;
      this.gate1_truckCollider.cz = this.gate1_tankerZ;

      spawnSparks(this.gate1_tanker.position, 3);

      // Hit Gate 1 Blast Door at Z = 43
      if (this.gate1_tankerZ <= 43.5) {
        this.gate1_rolling = false;
        sound.playExplosion();
        sound.playMetalClang();

        spawnFire(this.gate1_tanker.position, 25);
        spawnMilkSplash(this.gate1_tanker.position, 30);

        // Unlock Sub-Zero Blast Door
        gameState.unlockGate('gate_1');
        gameState.addChaos(350, "SUB-ZERO BLAST DOOR RAMMED OPEN!!");

        // Remove the parked tanker collider so player can walk freely through the doorway into Zone 2!
        if (this.gate1_truckCollider) {
          removeCollider(this.gate1_truckCollider);
          this.gate1_truckCollider = null;
        }

        // Convert threshold corridor to Ice Surface
        this.mapBuilder.surfaceRegions.push({
          type: SURFACES.ICE,
          minX: -6,
          maxX: 6,
          minZ: 38,
          maxZ: 46
        });
      }
    }

    // -----------------------------------------------------------------------
    // Gate 3: Centrifuge Radial Orbit & Cannonball Launch
    // -----------------------------------------------------------------------
    if (player && player.mesh && !gameState.gates.gate_3) {
      const cPos = this.gate3_centrifugeMesh.position;
      const pPos = player.mesh.position;
      const dist = Math.hypot(pPos.x - cPos.x, pPos.z - cPos.z);

      // Spinning inside centrifuge
      if (dist < 3.8 && !player.isAirborneLaunch) {
        const angle = Math.atan2(pPos.z - cPos.z, pPos.x - cPos.x) + dt * 14.0;
        player.mesh.position.x = cPos.x + Math.cos(angle) * 2.8;
        player.mesh.position.z = cPos.z + Math.sin(angle) * 2.8;

        // Space/Slide triggers high speed launch across the whey vat
        if (player.isSliding) {
          player.isAirborneLaunch = true;
          player.velocity.set(38.0, 8.0, 0); // Fast East launch
          sound.playCentrifugeSpin(500);
          sound.playSquawk();
          gameState.addChaos(150, "CENTRIFUGE SLINGSHOT!!");
        }
      }

      // Check proximity to Emergency Lever during launch or waddle
      if (Math.hypot(pPos.x - (-7.5), pPos.z - (-46)) < 3.4 && !this.gate3_leverActivated) {
        this.activateWheyBridgeLever();
      }
    }

    // -----------------------------------------------------------------------
    // Gate 4: Rolling Cheese Wheels Physics
    // -----------------------------------------------------------------------
    this.gate4_cheeseWheels.forEach(wheel => {
      if (wheel.isSeated) return;

      const speed = wheel.velocity.length();
      if (speed > 0.05) {
        wheel.mesh.position.addScaledVector(wheel.velocity, dt);
        // Keep cheese wheels inside the Vault Antechamber bounds so they never get stuck behind walls
        wheel.mesh.position.x = Math.max(-24, Math.min(24, wheel.mesh.position.x));
        wheel.mesh.position.z = Math.max(-75.5, Math.min(-58, wheel.mesh.position.z));
        wheel.collider.pos = wheel.mesh.position;

        // Roll rotation
        wheel.mesh.rotation.x += dt * speed * 1.5;

        // Friction decay
        wheel.velocity.multiplyScalar(0.97);

        // Check if rolled into any floor pad
        this.gate4_pads.forEach(pad => {
          if (!pad.filled && Math.hypot(wheel.mesh.position.x - pad.x, wheel.mesh.position.z - pad.z) < 2.2) {
            pad.filled = true;
            wheel.isSeated = true;
            wheel.velocity.set(0, 0, 0);
            wheel.mesh.position.set(pad.x, 0.75, pad.z);
            wheel.mesh.rotation.set(0, 0, Math.PI / 2);

            pad.mesh.material = createToonMaterial(0x22c55e);
            sound.playDing();
            sound.playMetalClang();
            spawnSparks(pad.mesh.position, 15);

            this.gate4_padsFilled++;
            gameState.addChaos(120, `TUMBLER LOCKED! (${this.gate4_padsFilled}/3)`);

            if (this.gate4_padsFilled >= 3) {
              sound.playRumble();
              sound.playGateOpen();
              gameState.unlockGate('gate_4');
              gameState.addChaos(600, "VAULT COMBINATION SOLVED! PENTHOUSE OPEN!!");
            }
          }
        });
      }
    });
  }
}
