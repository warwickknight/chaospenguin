import { sound } from '../audio/sound.js';
import { gameState } from '../core/state.js';
import { resolveCollision } from '../core/spatialGrid.js';
import { spawnMilkSplash } from './particle.js';
import { createToonMaterial, addToonOutline } from '../core/toonShader.js';

export class FactoryWorker {
  constructor(scene, x, z, isSupervisor = false) {
    this.scene = scene;
    this.isSupervisor = isSupervisor;
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, 0, z);
    this.speed = isSupervisor ? 5.5 : 4.0;
    this.state = 'idle';
    this.slipTimer = 0;
    this.targetPos = new THREE.Vector3(x, 0, z);
    this.patrolTimer = Math.random() * 2;
    this.velocity = new THREE.Vector3();
    this.hasClipboard = isSupervisor;

    this.build();
    scene.add(this.mesh);
  }

  build() {
    const bodyMat = createToonMaterial(this.isSupervisor ? 0x1d4ed8 : 0xfacc15);
    const bodyGeo = new THREE.CylinderGeometry(0.36, 0.45, 1.35, 12);
    bodyGeo.translate(0, 0.85, 0);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = true;
    addToonOutline(bodyMesh, 0.05, 0x0f172a);
    this.mesh.add(bodyMesh);

    // Dairy Apron
    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.9, 0.25), createToonMaterial(0xffffff));
    apron.position.set(0, 0.8, 0.32);
    addToonOutline(apron, 0.05, 0x0f172a);
    this.mesh.add(apron);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), createToonMaterial(0xfde047));
    head.position.y = 1.82;
    head.castShadow = true;
    addToonOutline(head, 0.06, 0x0f172a);
    this.mesh.add(head);

    // Cute Cartoon Eyes
    const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.12, 1.86, 0.32);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.12, 1.86, 0.32);
    this.mesh.add(eyeL, eyeR);

    // Hardhat / Dairy Cap
    const hatColor = this.isSupervisor ? 0xffffff : 0x38bdf8;
    const hat = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), createToonMaterial(hatColor));
    hat.position.y = 1.92;
    addToonOutline(hat, 0.06, 0x0f172a);
    this.mesh.add(hat);

    // Clipboard for supervisors
    if (this.isSupervisor) {
      const clipboard = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.8, 0.08),
        createToonMaterial(0xd97706)
      );
      clipboard.position.set(0.45, 1.2, 0.38);
      clipboard.rotation.y = -0.3;
      addToonOutline(clipboard, 0.06, 0x0f172a);

      // White paper sheet on clipboard
      const paper = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.65, 0.09), createToonMaterial(0xffffff));
      clipboard.add(paper);

      this.clipboardMesh = clipboard;
      this.mesh.add(clipboard);
    }
  }

  update(dt, playerPos) {
    if (gameState.isStaffStunned()) {
      this.mesh.rotation.y += dt * 8;
      this.mesh.rotation.z = Math.sin(Date.now() * 0.015) * 0.2;
      return;
    }

    if (this.state === 'slipped') {
      this.slipTimer -= dt;
      this.mesh.rotation.x = Math.PI / 2;
      this.mesh.position.y = 0.2;
      this.mesh.position.addScaledVector(this.velocity, dt);
      this.velocity.multiplyScalar(0.92);
      if (this.slipTimer <= 0) {
        this.state = 'idle';
        this.mesh.rotation.x = 0;
        this.mesh.position.y = 0;
      }
      return;
    }

    const distSq = this.mesh.position.distanceToSquared(playerPos);
    if (distSq < 81.0 || gameState.alarmLevel >= 3) {
      this.state = 'panic';
      const dx = this.mesh.position.x - playerPos.x;
      const dz = this.mesh.position.z - playerPos.z;
      const len = Math.hypot(dx, dz);
      if (len > 0.001) {
        const inv = 1.0 / len;
        this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, dx * inv * this.speed * 1.4, dt * 6);
        this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, dz * inv * this.speed * 1.4, dt * 6);
      }
    } else {
      this.patrolTimer -= dt;
      if (this.patrolTimer <= 0) {
        this.patrolTimer = 2.5 + Math.random() * 2;
        this.targetPos.set(
          this.mesh.position.x + (Math.random() - 0.5) * 16,
          0,
          this.mesh.position.z + (Math.random() - 0.5) * 16
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
    resolveCollision(this.mesh.position, nextX, nextZ, 0.45);

    if (this.velocity.lengthSq() > 0.1) {
      this.mesh.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
    }
  }

  slip(forceDir) {
    this.state = 'slipped';
    this.slipTimer = 1.8;
    this.velocity.copy(forceDir);
    sound.playSquish();
    spawnMilkSplash(this.mesh.position, 6);

    if (this.isSupervisor && this.hasClipboard) {
      this.hasClipboard = false;
      if (this.clipboardMesh) {
        this.clipboardMesh.visible = false;
      }
      gameState.incrementClipboard();
      gameState.addChaos(60, "CLIPBOARD FLUTTER!");
    } else {
      gameState.addChaos(35, "WORKER TRIPPED!");
    }
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}
