import { input } from '../input/input.js';
import { resolveCollision, spatialGrid, SPATIAL_CELL_SIZE } from '../core/spatialGrid.js';
import { sound } from '../audio/sound.js';
import { gameState } from '../core/state.js';
import { SURFACES } from '../core/constants.js';
import { spawnMilkSplash, spawnSparks, spawnSurfaceTrail, spawnWallBounceSparks } from './particle.js';
import { createToonMaterial, addToonOutline } from '../core/toonShader.js';

export class PenguinPlayer {
  constructor(mapBuilder, onShowPopup) {
    this.mapBuilder = mapBuilder;
    this.onShowPopup = onShowPopup;
    this.mesh = new THREE.Group();

    this.baseSpeed = 13.0;
    this.baseSlideSpeed = 26.0;
    this.isSliding = false;
    this.slideTimer = 0;
    this.slideCooldown = 0;
    this.velocity = new THREE.Vector3();
    this.waddleTime = 0;
    this.slapCooldown = 0;
    this.radius = 0.52;

    this.currentSurface = SURFACES.TILE;
    this.isCaged = false;
    this.cageHits = 0;
    this.cageMesh = null;
    this.breakoutTimer = 0;
    this.trailTimer = 0;
    this.soundTimer = 0;

    // References to world entities
    this.scene = null;
    this.guards = [];
    this.workers = [];

    // Phase 4 Mischief States
    this.isDisguised = false;
    this.waxArmorTimer = 0;
    this.hasCertifiedBadge = false;

    this.buildMesh();
  }

  buildMesh() {
    // Torso (Cel-Shaded Slate-Blue like the reference picture)
    const bodyGeo = new THREE.SphereGeometry(0.75, 20, 18);
    bodyGeo.scale(1.0, 1.25, 0.95);
    const bodyMat = createToonMaterial(0x2b3d54); // Rich dark slate-navy like reference
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.position.y = 0.92;
    this.body.castShadow = true;
    addToonOutline(this.body, 0.06, 0x0f172a);
    this.mesh.add(this.body);

    // Big White Belly & Face Patch (Heart/oval shaped face+belly patch like reference)
    const bellyGeo = new THREE.SphereGeometry(0.60, 18, 16);
    bellyGeo.scale(0.88, 1.18, 0.56);
    this.belly = new THREE.Mesh(bellyGeo, createToonMaterial(0xffffff));
    this.belly.position.set(0, -0.06, 0.44);
    this.body.add(this.belly);

    // White Cheek/Forehead patches for the classic penguin face mask
    const cheekGeo = new THREE.SphereGeometry(0.24, 12, 12);
    cheekGeo.scale(1.1, 1.1, 0.6);
    const whiteMat = createToonMaterial(0xffffff);
    const leftCheek = new THREE.Mesh(cheekGeo, whiteMat);
    leftCheek.position.set(-0.18, 0.34, 0.52);
    const rightCheek = new THREE.Mesh(cheekGeo, whiteMat);
    rightCheek.position.set(0.18, 0.34, 0.52);
    this.body.add(leftCheek, rightCheek);

    // Small Cute Rounded Orange Cartoon Beak
    const beakGeo = new THREE.SphereGeometry(0.16, 12, 10);
    beakGeo.scale(1.15, 0.68, 1.35);
    const beakMat = createToonMaterial(0xf97316);
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.position.set(0, 0.25, 0.72);
    addToonOutline(beak, 0.08, 0x0f172a);
    this.body.add(beak);

    // Cute Dark Cartoon Eyes with White Specular Catchlights
    const pupilGeo = new THREE.SphereGeometry(0.095, 12, 12);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const highlightGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Left Eye
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.22, 0.36, 0.65);
    leftPupil.scale.set(1.0, 1.15, 0.6);
    const leftHighlight = new THREE.Mesh(highlightGeo, highlightMat);
    leftHighlight.position.set(-0.19, 0.39, 0.70);

    // Right Eye
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.22, 0.36, 0.65);
    rightPupil.scale.set(1.0, 1.15, 0.6);
    const rightHighlight = new THREE.Mesh(highlightGeo, highlightMat);
    rightHighlight.position.set(0.25, 0.39, 0.70);

    // Cute Rosy Cheeks
    const blushGeo = new THREE.SphereGeometry(0.075, 8, 8);
    blushGeo.scale(1.3, 0.7, 0.4);
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xfb7185 });
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.32, 0.24, 0.62);
    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.32, 0.24, 0.62);

    this.body.add(leftPupil, leftHighlight, rightPupil, rightHighlight, leftBlush, rightBlush);

    // Orange Cartoon Webbed Feet
    const footGeo = new THREE.SphereGeometry(0.22, 12, 10);
    footGeo.scale(1.1, 0.45, 1.45);
    const footMat = createToonMaterial(0xf97316);
    const leftFoot = new THREE.Mesh(footGeo, footMat);
    leftFoot.position.set(-0.32, 0.1, 0.24);
    addToonOutline(leftFoot, 0.08, 0x0f172a);

    const rightFoot = new THREE.Mesh(footGeo, footMat);
    rightFoot.position.set(0.32, 0.1, 0.24);
    addToonOutline(rightFoot, 0.08, 0x0f172a);

    this.leftFoot = leftFoot;
    this.rightFoot = rightFoot;
    this.mesh.add(leftFoot, rightFoot);

    // Cartoon Flippers (parented to body so they tilt and waddle together)
    const flipperGeo = new THREE.SphereGeometry(0.24, 12, 10);
    flipperGeo.scale(0.38, 1.55, 0.75);
    flipperGeo.translate(0, -0.22, 0);
    this.leftFlipper = new THREE.Mesh(flipperGeo, bodyMat);
    this.leftFlipper.position.set(-0.72, 0.18, 0);
    this.leftFlipper.rotation.z = 0.35;
    addToonOutline(this.leftFlipper, 0.07, 0x0f172a);

    this.rightFlipper = new THREE.Mesh(flipperGeo, bodyMat);
    this.rightFlipper.position.set(0.72, 0.18, 0);
    this.rightFlipper.rotation.z = -0.35;
    addToonOutline(this.rightFlipper, 0.07, 0x0f172a);

    this.body.add(this.leftFlipper, this.rightFlipper);

    // Cardboard Box Disguise Mesh (Phase 4)
    const boxGeo = new THREE.BoxGeometry(1.6, 2.2, 1.6);
    const boxMat = new THREE.MeshLambertMaterial({ color: 0xb45309 });
    const disguiseBox = new THREE.Mesh(boxGeo, boxMat);
    disguiseBox.position.y = 1.1;

    // Eye cutout in disguise box
    const eyeCutout = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.2), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
    eyeCutout.position.set(0, 0.3, 0.81);
    disguiseBox.add(eyeCutout);

    disguiseBox.visible = false;
    this.boxMesh = disguiseBox;
    this.mesh.add(disguiseBox);

    // Certified Grade-A Golden Badge (Phase 4)
    const badgeGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.06, 12);
    badgeGeo.rotateX(Math.PI / 2);
    const badgeMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.position.set(0, 1.0, 0.76);
    badgeMesh.visible = false;
    this.badgeMesh = badgeMesh;
    this.mesh.add(badgeMesh);
  }

  update(dt) {
    if (this.slapCooldown > 0) this.slapCooldown -= dt;
    if (this.slideCooldown > 0) this.slideCooldown -= dt;

    if (this.breakoutTimer > 0) {
      this.breakoutTimer -= dt;
      this.mesh.visible = Math.floor(this.breakoutTimer * 20) % 2 === 0;
      if (this.breakoutTimer <= 0) this.mesh.visible = true;
    }

    // When caged by security, movement is frozen; slapping rattles the cage to break out
    if (this.isCaged) {
      this.velocity.set(0, 0, 0);
      if (input.attack && this.slapCooldown <= 0) {
        this.handleCageSlap();
      }
      return;
    }

    // Phase 4 Wax Armor Timer
    if (this.waxArmorTimer > 0) {
      this.waxArmorTimer -= dt;
      if (this.waxArmorTimer <= 0 && this.body) {
        this.body.material = createToonMaterial(0x2b3d54);
      }
    }

    // Phase 4 Disguised Distance Accumulator
    if (this.isDisguised) {
      const speed = this.velocity.length();
      if (speed > 0.1) {
        gameState.addDisguisedDistance(speed * dt);
      }
    }

    // Dynamic Liquid Surface Friction Query
    const surfaceType = (this.mapBuilder && this.mapBuilder.getSurfaceAt(this.mesh.position.x, this.mesh.position.z)) || SURFACES.TILE;
    if (!this.currentSurface) this.currentSurface = SURFACES.TILE;

    if (this.currentSurface.id !== surfaceType.id) {
      this.currentSurface = surfaceType;

      // Play entrance sound
      if (surfaceType.id === 'ice') sound.playIceSlide();
      else if (surfaceType.id === 'skim_milk') sound.playMilkDrift();
      else if (surfaceType.id === 'butter_oil') sound.playOilBounce();
      else if (surfaceType.id === 'yogurt') sound.playYogurtSquelch();
    }

    // Slide Initiation Handling
    if (input.slide && !this.isSliding && this.slideCooldown <= 0) {
      this.isSliding = true;
      this.slideCooldown = 0.8;
      sound.playSlide();

      // Launch velocity boost based on surface top slide speed
      const curSpeed = this.velocity.length();
      const launchSpeed = Math.max(curSpeed * 1.3, this.baseSlideSpeed * this.currentSurface.speedMult);
      const faceAngle = this.mesh.rotation.y;
      this.velocity.x = Math.sin(faceAngle) * launchSpeed;
      this.velocity.z = Math.cos(faceAngle) * launchSpeed;

      spawnMilkSplash(this.mesh.position, 10);
    }

    // Directional Input
    let moveX = 0;
    let moveZ = 0;
    if (input.up) moveZ -= 1;
    if (input.down) moveZ += 1;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;

    if (input.isJoystickActive && (input.joystickVector.x !== 0 || input.joystickVector.y !== 0)) {
      moveX = input.joystickVector.x;
      moveZ = input.joystickVector.y;
    }

    const moveLenSq = moveX * moveX + moveZ * moveZ;
    const isMoving = moveLenSq > 0.001;

    if (isMoving && !input.isJoystickActive) {
      const invLen = 1.0 / Math.sqrt(moveLenSq);
      moveX *= invLen;
      moveZ *= invLen;
    }

    // Surface Physics Calculation
    const curSpeed = this.velocity.length();

    if (this.isSliding) {
      // Slide Momentum Decay governed by Surface Friction mu
      const decay = this.currentSurface.decayRate * dt * 5.5;
      const newSpeed = Math.max(0, curSpeed - decay);

      if (curSpeed > 0.001) {
        this.velocity.multiplyScalar(newSpeed / curSpeed);
      }

      // Steering while sliding
      if (isMoving) {
        // Skim Milk High Drift: high slip angle (steers gradually while continuing drift trajectory)
        const steerRate = this.currentSurface.id === 'skim_milk' ? 2.5 : (this.currentSurface.id === 'ice' ? 4.0 : 8.0);
        const targetVelX = moveX * (this.baseSlideSpeed * this.currentSurface.speedMult);
        const targetVelZ = moveZ * (this.baseSlideSpeed * this.currentSurface.speedMult);
        this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVelX, dt * steerRate);
        this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVelZ, dt * steerRate);

        // Skim milk skid drift sound
        if (this.currentSurface.id === 'skim_milk') {
          this.soundTimer += dt;
          if (this.soundTimer >= 0.28) {
            this.soundTimer = 0;
            sound.playMilkDrift();
          }
        }
      }

      // Exit slide if stopped or in sticky yogurt
      if (this.currentSurface.id === 'yogurt') {
        this.velocity.multiplyScalar(0.75); // Immediate brake
        if (curSpeed < 2.5) this.isSliding = false;
      } else if (newSpeed < 2.0 && !input.slide) {
        this.isSliding = false;
      }

    } else {
      // Waddling Running State
      const targetSpeed = this.baseSpeed * (this.currentSurface.waddleMult || 1.0);
      const accelRate = this.currentSurface.id === 'yogurt' ? 6.0 : (this.currentSurface.id === 'ice' ? 4.5 : 16.0);
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, moveX * targetSpeed, dt * accelRate);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, moveZ * targetSpeed, dt * accelRate);
    }

    // Step Movement & Wall Collision with Rebound Physics
    const nextX = this.mesh.position.x + this.velocity.x * dt;
    const nextZ = this.mesh.position.z + this.velocity.z * dt;

    const colResult = resolveCollision(this.mesh.position, nextX, nextZ, this.radius);

    // Wall Bounce Rebound in Heavy Cream / Butter Oil & Ice
    if (colResult.hit && this.currentSurface.bouncePreserve > 0 && curSpeed > 4.0) {
      const dot = this.velocity.x * colResult.normalX + this.velocity.z * colResult.normalZ;
      if (dot < 0) {
        // Reflect velocity vector
        this.velocity.x = (this.velocity.x - 2 * dot * colResult.normalX) * this.currentSurface.bouncePreserve;
        this.velocity.z = (this.velocity.z - 2 * dot * colResult.normalZ) * this.currentSurface.bouncePreserve;

        sound.playOilBounce();
        spawnWallBounceSparks(this.mesh.position, colResult.normalX, colResult.normalZ);

        if (this.currentSurface.id === 'butter_oil') {
          gameState.addChaos(75, "80% OIL REBOUND!");
          if (this.onShowPopup) {
            this.onShowPopup(this.mesh.position, "BOUNCE 80%!!", '#facc15');
          }
        }
      }
    }

    // Emit Surface Trail Particles
    this.trailTimer += dt;
    if (this.trailTimer >= 0.08) {
      this.trailTimer = 0;
      spawnSurfaceTrail(this.mesh.position, this.currentSurface.id, this.velocity);
    }

    // Heading rotation
    if (curSpeed > 0.2) {
      const targetAngle = Math.atan2(this.velocity.x, this.velocity.z);
      this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetAngle, dt * 12);
    }

    // Sliding vs Waddling Visuals
    if (this.isSliding) {
      this.body.rotation.x = THREE.MathUtils.lerp(this.body.rotation.x, Math.PI / 2.3, dt * 15);
      this.leftFlipper.rotation.z = 1.1;
      this.rightFlipper.rotation.z = -1.1;
    } else {
      this.body.rotation.x = THREE.MathUtils.lerp(this.body.rotation.x, 0, dt * 10);
      if (isMoving) {
        this.waddleTime += dt * (14 * (this.currentSurface.waddleMult || 1.0));
        const waddleAngle = Math.sin(this.waddleTime) * 0.22;
        this.body.rotation.z = waddleAngle;
        this.leftFlipper.rotation.z = 0.35 + Math.sin(this.waddleTime) * 0.28;
        this.rightFlipper.rotation.z = -0.35 - Math.sin(this.waddleTime) * 0.28;
        if (this.leftFoot && this.rightFoot) {
          this.leftFoot.position.y = 0.1 + Math.max(0, Math.sin(this.waddleTime)) * 0.12;
          this.rightFoot.position.y = 0.1 + Math.max(0, -Math.sin(this.waddleTime)) * 0.12;
        }
      } else {
        this.waddleTime += dt * 3;
        this.body.rotation.z = Math.sin(this.waddleTime) * 0.04;
        this.leftFlipper.rotation.z = 0.35;
        this.rightFlipper.rotation.z = -0.35;
        if (this.leftFoot && this.rightFoot) {
          this.leftFoot.position.y = 0.1;
          this.rightFoot.position.y = 0.1;
        }
      }
    }

    // Check for East Maintenance Alley shortcut discovery
    if (this.mesh.position.x >= 47 && this.mesh.position.z >= 0 && this.mesh.position.z <= 35) {
      if (!gameState.mischief.drainDiver) {
        gameState.completeMischief('drainDiver');
        gameState.addChaos(200, "MAINTENANCE ALLEY DISCOVERED!");
      }
    }

    // Slap Attack
    if (input.attack && this.slapCooldown <= 0) {
      this.executeSlap();
    }
  }

  enterBoxDisguise() {
    this.isDisguised = true;
    if (this.boxMesh) this.boxMesh.visible = true;
    if (this.body) this.body.visible = false;
    if (this.belly) this.belly.visible = false;
    if (this.leftFoot) this.leftFoot.visible = false;
    if (this.rightFoot) this.rightFoot.visible = false;
    if (this.onShowPopup) {
      this.onShowPopup(this.mesh.position, "DISGUISED AS COURIER! 📦", '#b45309');
    }
  }

  exitBoxDisguise() {
    if (!this.isDisguised) return;
    this.isDisguised = false;
    if (this.boxMesh) this.boxMesh.visible = false;
    if (this.body) this.body.visible = true;
    if (this.belly) this.belly.visible = true;
    if (this.leftFoot) this.leftFoot.visible = true;
    if (this.rightFoot) this.rightFoot.visible = true;
    sound.playSquish();
    spawnMilkSplash(this.mesh.position, 12);
  }

  applyWaxArmor(duration = 12.0) {
    this.waxArmorTimer = duration;
    if (this.body) {
      this.body.material = createToonMaterial(0xdc2626);
    }
    spawnSparks(this.mesh.position, 20);
    if (this.onShowPopup) {
      this.onShowPopup(this.mesh.position, "HOT WAX ARMOR!! 🛡️", '#dc2626');
    }
  }

  applyDairyStampBadge() {
    this.hasCertifiedBadge = true;
    if (this.badgeMesh) this.badgeMesh.visible = true;
    spawnSparks(this.mesh.position, 20);
    if (this.onShowPopup) {
      this.onShowPopup(this.mesh.position, "CERTIFIED DAIRY BADGE! ⭐", '#facc15');
    }
  }

  captureInCage(scene) {
    if (this.isCaged || this.breakoutTimer > 0 || this.waxArmorTimer > 0) return;
    this.isCaged = true;
    this.cageHits = 0;
    this.scene = scene;

    sound.playMetalClang();
    sound.playWhistle();

    // Reset alarm level to 0 stars and instruct all guards to disengage and retreat
    gameState.resetAlarm();
    this.guards.forEach(g => {
      if (g.retreatFromCage) {
        g.retreatFromCage(this.mesh.position);
      }
    });

    if (this.cageMesh && scene) scene.remove(this.cageMesh);
    const cage = new THREE.Group();
    cage.position.copy(this.mesh.position);

    const barMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const barGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.8, 6);
    const cageSize = 1.6;

    for (let x = -cageSize; x <= cageSize; x += 0.8) {
      [-cageSize, cageSize].forEach(z => {
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.position.set(x, 1.4, z);
        cage.add(bar);
      });
    }
    for (let z = -cageSize; z <= cageSize; z += 0.8) {
      [-cageSize, cageSize].forEach(x => {
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.position.set(x, 1.4, z);
        cage.add(bar);
      });
    }

    const roof = new THREE.Mesh(new THREE.BoxGeometry(cageSize * 2.2, 0.15, cageSize * 2.2), barMat);
    roof.position.y = 2.8;
    cage.add(roof);

    if (scene) scene.add(cage);
    this.cageMesh = cage;

    if (this.onShowPopup) {
      this.onShowPopup(this.mesh.position, "BUSTED!! SLAP CAGE TO ESCAPE!", '#ef4444');
    }
  }

  handleCageSlap() {
    this.slapCooldown = 0.16;
    this.cageHits++;
    sound.playMetalClang();

    if (this.cageMesh) {
      this.cageMesh.position.x = this.mesh.position.x + (Math.random() - 0.5) * 0.3;
      this.cageMesh.position.z = this.mesh.position.z + (Math.random() - 0.5) * 0.3;
    }
    spawnSparks(this.mesh.position, 8);

    if (this.cageHits >= 6) {
      this.breakOutOfCage();
    }
  }

  breakOutOfCage() {
    this.isCaged = false;
    sound.playExplosion();
    sound.playMetalClang();

    if (this.cageMesh && this.scene) {
      this.scene.remove(this.cageMesh);
      this.cageMesh = null;
    }

    this.breakoutTimer = 3.0; // 3 seconds flashing invulnerability
    spawnMilkSplash(this.mesh.position, 30);
    spawnSparks(this.mesh.position, 25);

    if (this.onShowPopup) {
      this.onShowPopup(this.mesh.position, "JAILBREAK! REVENGE!!", '#38bdf8');
    }
    // Ensure wanted heat & star rating stay at 0 stars after breaking out of the cage!
    gameState.resetAlarm();

    // Stun and blow back all nearby guards
    this.guards.forEach(g => {
      const distSq = g.mesh.position.distanceToSquared(this.mesh.position);
      if (distSq < 81.0) {
        const blast = g.mesh.position.clone().sub(this.mesh.position);
        if (blast.lengthSq() > 0.001) blast.normalize();
        blast.multiplyScalar(18);
        g.slip(blast);
        sound.playPanic();
      }
    });
  }

  executeSlap() {
    if (this.isDisguised) {
      this.exitBoxDisguise();
    }

    this.slapCooldown = 0.26;
    sound.playSlap();

    const attackPos = this.mesh.position;
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
    spawnMilkSplash(attackPos.clone().addScaledVector(forward, 1.2), 6);

    // DIRECT SLAP: Workers
    for (let i = 0; i < this.workers.length; i++) {
      const w = this.workers[i];
      if (w.mesh.position.distanceToSquared(attackPos) < 14) {
        w.slip(forward.clone().multiplyScalar(10));
        sound.playPanic();
      }
    }

    // DIRECT SLAP: Security Guards
    for (let i = 0; i < this.guards.length; i++) {
      const g = this.guards[i];
      if (g.mesh.position.distanceToSquared(attackPos) < 16 && g.state !== 'slipped') {
        g.slip(forward.clone().multiplyScalar(15));
        sound.playMetalClang();
        sound.playPanic();
        gameState.addChaos(120, "SECURITY SLAPPED!");
        if (this.onShowPopup) {
          this.onShowPopup(g.mesh.position, "SECURITY SLAPPED!", '#facc15');
        }
      }
    }

    // Query spatial cells around attack arc for props/puzzles
    const cx = Math.floor(attackPos.x / SPATIAL_CELL_SIZE);
    const cz = Math.floor(attackPos.z / SPATIAL_CELL_SIZE);
    const hitRangeSq = 3.6 * 3.6;

    for (let ox = -1; ox <= 1; ox++) {
      for (let oz = -1; oz <= 1; oz++) {
        const cell = spatialGrid.get(`${cx + ox},${cz + oz}`);
        if (!cell) continue;

        for (let i = 0; i < cell.length; i++) {
          const col = cell[i];
          if (col.obj && col.obj.takeDamage && !col.obj.isDestroyed) {
            const dx = col.pos.x - attackPos.x;
            const dz = col.pos.z - attackPos.z;
            if (dx * dx + dz * dz < hitRangeSq) {
              col.obj.takeDamage(1, forward);
            }
          }
        }
      }
    }
  }
}
