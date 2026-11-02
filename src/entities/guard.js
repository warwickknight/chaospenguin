import { sound } from '../audio/sound.js';
import { gameState } from '../core/state.js';
import { resolveCollision } from '../core/spatialGrid.js';
import { spawnMilkSplash } from './particle.js';
import { createToonMaterial, addToonOutline } from '../core/toonShader.js';

export class SecurityGuard {
  constructor(scene, x, z) {
    this.scene = scene;
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, 0, z);
    this.spawnPos = new THREE.Vector3(x, 0, z);
    this.speed = 5.2;
    this.chaseSpeed = 7.5;
    this.state = 'patrol';
    this.slipTimer = 0;
    this.targetPos = new THREE.Vector3(x, 0, z);
    this.patrolTimer = Math.random() * 2;
    this.velocity = new THREE.Vector3();
    this.whistleTimer = 3.0;

    this.build();
    scene.add(this.mesh);
  }

  build() {
    const bodyGeo = new THREE.CylinderGeometry(0.42, 0.48, 1.4, 12);
    bodyGeo.translate(0, 0.9, 0);
    const bodyMesh = new THREE.Mesh(bodyGeo, createToonMaterial(0x1e293b));
    bodyMesh.castShadow = true;
    addToonOutline(bodyMesh, 0.05, 0x0f172a);
    this.mesh.add(bodyMesh);

    const vestGeo = new THREE.CylinderGeometry(0.45, 0.50, 0.78, 12);
    vestGeo.translate(0, 1.0, 0);
    const vestMesh = new THREE.Mesh(vestGeo, createToonMaterial(0x84cc16));
    addToonOutline(vestMesh, 0.05, 0x0f172a);
    this.mesh.add(vestMesh);

    // Cartoon Head with Sunglasses & Mustache
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 12), createToonMaterial(0xfde047));
    head.position.y = 1.9;
    head.castShadow = true;
    addToonOutline(head, 0.06, 0x0f172a);
    this.mesh.add(head);

    // Aviator Sunglasses
    const shades = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.18), createToonMaterial(0x09090b));
    shades.position.set(0, 1.94, 0.3);
    addToonOutline(shades, 0.06, 0x0f172a);
    this.mesh.add(shades);

    // Police Cap + Visor + Gold Badge
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.22, 12), createToonMaterial(0x1e293b));
    cap.position.y = 2.18;
    addToonOutline(cap, 0.06, 0x0f172a);
    this.mesh.add(cap);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.35), createToonMaterial(0x09090b));
    visor.position.set(0, 2.09, 0.28);
    this.mesh.add(visor);

    const badge = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), createToonMaterial(0xfacc15));
    badge.position.set(0, 2.2, 0.42);
    this.mesh.add(badge);

    // Left & Right Arms + Baton
    const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.75, 8);
    this.leftArm = new THREE.Mesh(armGeo, createToonMaterial(0x1e293b));
    this.leftArm.position.set(-0.56, 1.15, 0);
    addToonOutline(this.leftArm, 0.06, 0x0f172a);

    this.rightArm = new THREE.Mesh(armGeo, createToonMaterial(0x1e293b));
    this.rightArm.position.set(0.56, 1.15, 0);
    addToonOutline(this.rightArm, 0.06, 0x0f172a);

    const baton = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.7, 8), createToonMaterial(0x09090b));
    baton.position.set(0, -0.35, 0.25);
    baton.rotation.x = Math.PI / 2.5;
    addToonOutline(baton, 0.06, 0x0f172a);
    this.rightArm.add(baton);

    this.mesh.add(this.leftArm, this.rightArm);
  }

  update(dt, player) {
    if (gameState.isStaffStunned()) {
      this.mesh.rotation.y += dt * 10;
      this.mesh.rotation.x = Math.sin(Date.now() * 0.01) * 0.25;
      return;
    }

    if (this.state === 'slipped') {
      this.slipTimer -= dt;
      this.mesh.rotation.x = Math.PI / 2;
      this.mesh.position.y = 0.2;
      this.mesh.position.addScaledVector(this.velocity, dt);
      this.velocity.multiplyScalar(0.92);
      if (this.slipTimer <= 0) {
        this.state = 'chase';
        this.mesh.rotation.x = 0;
        this.mesh.position.y = 0;
      }
      return;
    }

    const playerPos = player ? player.mesh.position : new THREE.Vector3();
    const playerDisguised = player ? (player.isDisguised || player.waxArmorTimer > 0) : false;
    const playerCaged = player ? player.isCaged : false;
    const distSq = this.mesh.position.distanceToSquared(playerPos);

    // If player is caged, guards disengage and walk away back to their patrol stations
    if (playerCaged) {
      this.state = 'patrol';
      this.patrolTimer -= dt;
      if (this.patrolTimer <= 0) {
        this.patrolTimer = 4.0 + Math.random() * 3.0;
        // Head back toward spawn post / away from cage
        this.targetPos.set(
          this.spawnPos.x + (Math.random() - 0.5) * 15,
          0,
          this.spawnPos.z + (Math.random() - 0.5) * 15
        );
      }
      const dx = this.targetPos.x - this.mesh.position.x;
      const dz = this.targetPos.z - this.mesh.position.z;
      const len = Math.hypot(dx, dz);
      if (len > 1.0) {
        const inv = 1.0 / len;
        this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, dx * inv * this.speed, dt * 4);
        this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, dz * inv * this.speed, dt * 4);
      } else {
        this.velocity.set(0, 0, 0);
      }
      const nextX = this.mesh.position.x + this.velocity.x * dt;
      const nextZ = this.mesh.position.z + this.velocity.z * dt;
      resolveCollision(this.mesh.position, nextX, nextZ, 0.48);
      if (this.velocity.lengthSq() > 0.1) {
        this.mesh.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
      }
      return;
    }

    // Guard vision & chase range based on star alarm level:
    // 0 stars: 9-unit detection radius (distSq < 81)
    // 1 star: 12-unit detection radius (distSq < 144)
    // 2 stars: 15-unit detection radius (distSq < 225)
    // 3+ stars: facility-wide pursuit
    const detectionRadiusSq = gameState.alarmLevel >= 3 ? 1600.0 : (gameState.alarmLevel === 2 ? 225.0 : (gameState.alarmLevel === 1 ? 144.0 : 81.0));

    if (!playerDisguised && (distSq < detectionRadiusSq || gameState.alarmLevel >= 4)) {
      this.state = 'chase';
      this.whistleTimer -= dt;
      if (this.whistleTimer <= 0) {
        sound.playWhistle();
        this.whistleTimer = 4.0 + Math.random() * 2.0;
      }

      const dx = playerPos.x - this.mesh.position.x;
      const dz = playerPos.z - this.mesh.position.z;
      const len = Math.hypot(dx, dz);
      if (len > 0.001) {
        const inv = 1.0 / len;
        this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, dx * inv * this.chaseSpeed, dt * 7);
        this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, dz * inv * this.chaseSpeed, dt * 7);
      }

      // Catch player in steel cage trap!
      if (distSq < 4.5 && player && !player.isCaged && player.breakoutTimer <= 0 && player.waxArmorTimer <= 0) {
        player.captureInCage(this.scene);
      }
    } else {
      this.state = 'patrol';
      this.patrolTimer -= dt;
      if (this.patrolTimer <= 0) {
        this.patrolTimer = 3.0 + Math.random() * 2.5;
        this.targetPos.set(
          this.mesh.position.x + (Math.random() - 0.5) * 20,
          0,
          this.mesh.position.z + (Math.random() - 0.5) * 20
        );
      }
      const dx = this.targetPos.x - this.mesh.position.x;
      const dz = this.targetPos.z - this.mesh.position.z;
      const len = Math.hypot(dx, dz);
      if (len > 1.0) {
        const inv = 1.0 / len;
        this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, dx * inv * this.speed, dt * 4);
        this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, dz * inv * this.speed, dt * 4);
      } else {
        this.velocity.set(0, 0, 0);
      }
    }

    const nextX = this.mesh.position.x + this.velocity.x * dt;
    const nextZ = this.mesh.position.z + this.velocity.z * dt;
    resolveCollision(this.mesh.position, nextX, nextZ, 0.48);

    if (this.velocity.lengthSq() > 0.1) {
      this.mesh.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
      const swing = Math.sin(Date.now() * 0.012) * 0.45;
      if (this.leftArm && this.rightArm) {
        this.leftArm.rotation.x = swing;
        this.rightArm.rotation.x = -swing;
      }
    } else if (this.leftArm && this.rightArm) {
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
    }
  }

  retreatFromCage(cagePos) {
    this.state = 'patrol';
    this.patrolTimer = 5.0 + Math.random() * 2.0;
    // Walk away from cage towards original post
    const awayVec = this.spawnPos.clone().sub(cagePos);
    if (awayVec.lengthSq() < 16.0) {
      awayVec.set((Math.random() - 0.5) * 20, 0, (Math.random() - 0.5) * 20);
    }
    this.targetPos.copy(this.mesh.position).add(awayVec.normalize().multiplyScalar(16));
  }

  slip(forceDir) {
    this.state = 'slipped';
    this.slipTimer = 2.0;
    this.velocity.copy(forceDir);
    sound.playPanic();
    spawnMilkSplash(this.mesh.position, 8);
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}
