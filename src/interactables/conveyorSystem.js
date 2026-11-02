import { sound } from '../audio/sound.js';
import { gameState } from '../core/state.js';
import { registerCollider } from '../core/spatialGrid.js';
import { spawnMilkSplash, spawnSparks } from '../entities/particle.js';
import { SURFACES } from '../core/constants.js';
import { createToonMaterial, addToonOutline } from '../core/toonShader.js';

export class ConveyorBelt {
  constructor(scene, mapBuilder, x, z, length, isHorizontal = true, direction = 1) {
    this.scene = scene;
    this.mapBuilder = mapBuilder;
    this.x = x;
    this.z = z;
    this.length = length;
    this.width = 2.4;
    this.isHorizontal = isHorizontal;
    this.direction = direction;
    this.isOverdrive = false;
    this.speed = 4.0;
    this.overdriveSpeed = 16.0;
    this.cartonSpawnTimer = 0;
    this.switchPos = new THREE.Vector3(
      this.x + (this.isHorizontal ? -this.length / 2 - 1.2 : 2.0),
      0,
      this.z
    );

    this.mesh = new THREE.Group();
    this.cartons = [];

    this.build();
    scene.add(this.mesh);
  }

  build() {
    const sx = this.isHorizontal ? this.length : this.width;
    const sz = this.isHorizontal ? this.width : this.length;

    // Dark slate rubber belt surface
    const beltMat = createToonMaterial(0x334155);
    const belt = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.35, sz), beltMat);
    belt.position.set(this.x, 0.55, this.z);
    belt.castShadow = true;
    belt.receiveShadow = true;
    addToonOutline(belt, 0.035, 0x1e293b);
    this.mesh.add(belt);

    // Metallic grey industrial side rails with rollers (like the reference illustration!)
    const railMat = createToonMaterial(0x94a3b8);
    const rail1 = new THREE.Mesh(
      new THREE.BoxGeometry(this.isHorizontal ? this.length + 0.2 : 0.28, 0.48, this.isHorizontal ? 0.28 : this.length + 0.2),
      railMat
    );
    rail1.position.set(
      this.isHorizontal ? this.x : this.x - this.width / 2,
      0.58,
      this.isHorizontal ? this.z - this.width / 2 : this.z
    );
    addToonOutline(rail1, 0.04, 0x1e293b);

    const rail2 = new THREE.Mesh(
      new THREE.BoxGeometry(this.isHorizontal ? this.length + 0.2 : 0.28, 0.48, this.isHorizontal ? 0.28 : this.length + 0.2),
      railMat
    );
    rail2.position.set(
      this.isHorizontal ? this.x : this.x + this.width / 2,
      0.58,
      this.isHorizontal ? this.z + this.width / 2 : this.z
    );
    addToonOutline(rail2, 0.04, 0x1e293b);
    this.mesh.add(rail1, rail2);

    // Support legs beneath the conveyor belt (matching the reference art!)
    const legGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.55, 8);
    const footGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 8);
    const legMat = createToonMaterial(0x64748b);
    const step = 4.5;
    for (let offset = -this.length / 2 + 1.5; offset <= this.length / 2 - 1.0; offset += step) {
      [-this.width * 0.38, this.width * 0.38].forEach(side => {
        const lx = this.isHorizontal ? this.x + offset : this.x + side;
        const lz = this.isHorizontal ? this.z + side : this.z + offset;
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, 0.28, lz);
        addToonOutline(leg, 0.06, 0x1e293b);
        const foot = new THREE.Mesh(footGeo, railMat);
        foot.position.set(lx, 0.04, lz);
        this.mesh.add(leg, foot);
      });
    }

    // Overdrive Switch Lever
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.4, 1.2, 8),
      createToonMaterial(0x64748b)
    );
    base.position.copy(this.switchPos);
    base.position.y = 0.6;
    addToonOutline(base, 0.05, 0x1e293b);
    this.mesh.add(base);

    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6),
      createToonMaterial(0xef4444)
    );
    handle.position.copy(this.switchPos);
    handle.position.y = 1.3;
    handle.rotation.z = 0.35;
    addToonOutline(handle, 0.06, 0x1e293b);
    this.switchHandle = handle;
    this.mesh.add(handle);

    // Register switch collider for slap interaction
    const switchObj = {
      takeDamage: () => this.toggleOverdrive()
    };
    registerCollider({ pos: this.switchPos, radius: 1.5, obj: switchObj });

    // Pre-populate cartons along the belt so it looks lively right away!
    for (let d = -this.length * 0.35; d <= this.length * 0.35; d += 3.2) {
      const cx = this.isHorizontal ? this.x + d : this.x;
      const cz = this.isHorizontal ? this.z : this.z + d;
      this.spawnBottle(cx, cz, true);
    }
  }

  toggleOverdrive() {
    this.isOverdrive = !this.isOverdrive;
    this.switchHandle.rotation.z = this.isOverdrive ? -0.35 : 0.35;
    this.switchHandle.material = createToonMaterial(this.isOverdrive ? 0x22c55e : 0xef4444);

    if (this.isOverdrive) {
      sound.playZap();
      sound.playHydraulic();
      gameState.addChaos(120, "CONVEYOR OVERDRIVE x4 SPEED!");
    } else {
      sound.playLeverClick();
    }
  }

  contains(pos) {
    const halfX = (this.isHorizontal ? this.length : this.width) / 2;
    const halfZ = (this.isHorizontal ? this.width : this.length) / 2;
    return (
      pos.x >= this.x - halfX &&
      pos.x <= this.x + halfX &&
      pos.z >= this.z - halfZ &&
      pos.z <= this.z + halfZ
    );
  }

  getVelocity() {
    const curSpeed = this.isOverdrive ? this.overdriveSpeed : this.speed;
    return this.isHorizontal
      ? new THREE.Vector3(curSpeed * this.direction, 0, 0)
      : new THREE.Vector3(0, 0, curSpeed * this.direction);
  }

  update(dt, player) {
    // If player is on belt, convey them!
    if (player && player.mesh && this.contains(player.mesh.position)) {
      const cv = this.getVelocity();
      player.mesh.position.addScaledVector(cv, dt);
    }

    // Spawn and update bottles / cartons
    this.cartonSpawnTimer += dt;
    const interval = this.isOverdrive ? 0.3 : 1.2;
    if (this.cartonSpawnTimer >= interval) {
      this.cartonSpawnTimer = 0;
      const startX = this.isHorizontal ? this.x - (this.length / 2) * this.direction : this.x;
      const startZ = this.isHorizontal ? this.z : this.z - (this.length / 2) * this.direction;
      this.spawnBottle(startX, startZ);
    }

    // Update active bottles
    for (let i = this.cartons.length - 1; i >= 0; i--) {
      const b = this.cartons[i];
      if (b.isFlying) {
        b.velocity.y -= 18.0 * dt;
        b.mesh.position.addScaledVector(b.velocity, dt);

        if (b.mesh.position.y <= 0.3) {
          // Splat on ground!
          sound.playSquish();
          spawnMilkSplash(b.mesh.position, 12);
          this.scene.remove(b.mesh);
          this.cartons.splice(i, 1);

          // Spawn dynamic milk surface puddle
          if (this.mapBuilder && this.mapBuilder.surfaceRegions) {
            this.mapBuilder.surfaceRegions.push({
              type: SURFACES.SKIM_MILK,
              minX: b.mesh.position.x - 2.5,
              maxX: b.mesh.position.x + 2.5,
              minZ: b.mesh.position.z - 2.5,
              maxZ: b.mesh.position.z + 2.5
            });
          }
          gameState.addChaos(20, "BOTTLE SPLAT!");
        }
      } else {
        b.mesh.position.addScaledVector(this.getVelocity(), dt);

        // In overdrive, launch off end of belt
        const endDist = this.isHorizontal
          ? Math.abs(b.mesh.position.x - this.x) - this.length / 2
          : Math.abs(b.mesh.position.z - this.z) - this.length / 2;

        if (endDist > 0) {
          if (this.isOverdrive) {
            b.isFlying = true;
            b.velocity = this.getVelocity().multiplyScalar(1.4);
            b.velocity.y = 8.0 + Math.random() * 4.0;
            b.velocity.x += (Math.random() - 0.5) * 5.0;
          } else {
            this.scene.remove(b.mesh);
            this.cartons.splice(i, 1);
          }
        }
      }
    }
  }

  spawnBottle(x, z, forceCarton = false) {
    const isCarton = forceCarton || Math.random() > 0.2;
    let mesh;

    if (isCarton) {
      // Classic blue & white cartoon milk carton with gable top fold (like the reference illustration!)
      mesh = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.72, 0.65),
        createToonMaterial(0xffffff)
      );
      body.position.y = 0.36;
      body.castShadow = true;
      addToonOutline(body, 0.06, 0x1e293b);

      // Sky-blue carton label band
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(0.67, 0.28, 0.67),
        createToonMaterial(0x38bdf8)
      );
      band.position.y = 0.02;
      body.add(band);

      // Gable top
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(0.47, 0.32, 4),
        createToonMaterial(0xe0f2fe)
      );
      roof.position.y = 0.88;
      roof.rotation.y = Math.PI / 4;
      addToonOutline(roof, 0.06, 0x1e293b);

      // Top ridge seal
      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 0.1, 0.08),
        createToonMaterial(0x38bdf8)
      );
      ridge.position.y = 1.02;
      addToonOutline(ridge, 0.06, 0x1e293b);

      mesh.add(body, roof, ridge);
    } else {
      // Light blue glass milk bottle
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.28, 0.85, 10),
        createToonMaterial(0xbae6fd)
      );
      addToonOutline(mesh, 0.06, 0x1e293b);
    }

    mesh.position.set(x, 0.75, z);
    this.scene.add(mesh);

    this.cartons.push({
      mesh: mesh,
      isFlying: false,
      velocity: new THREE.Vector3()
    });
  }
}

export class ConveyorManager {
  constructor(scene, mapBuilder) {
    this.scene = scene;
    this.mapBuilder = mapBuilder;
    this.belts = [];

    this.initBelts();
  }

  initBelts() {
    // Zone 1 Receiving & Bottling Conveyor Lines (framing the central milk spill just like the reference illustration!)
    // Lower diagonal/transverse conveyor: bottom-left foreground, clear of cheese wheels and vats
    this.belts.push(new ConveyorBelt(this.scene, this.mapBuilder, -7.5, 87.0, 12, false, 1));
    // Upper diagonal conveyor: top-right background
    this.belts.push(new ConveyorBelt(this.scene, this.mapBuilder, 7.5, 69.0, 11, false, -1));

    // 3 Parallel Conveyor Tracks in Zone 4 (Packaging & Sorting)
    this.belts.push(new ConveyorBelt(this.scene, this.mapBuilder, 20, -35, 24, false, 1));
    this.belts.push(new ConveyorBelt(this.scene, this.mapBuilder, 32, -45, 24, false, -1));
    this.belts.push(new ConveyorBelt(this.scene, this.mapBuilder, 44, -35, 24, false, 1));
  }

  update(dt, player) {
    for (let i = 0; i < this.belts.length; i++) {
      this.belts[i].update(dt, player);
    }
  }
}
