export const particles = [];
let sceneRef = null;

const smallSphereGeo = new THREE.SphereGeometry(0.2, 6, 6);
const mats = {
  milk: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }),
  spark: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
  fire: new THREE.MeshBasicMaterial({ color: 0xf97316 }),
  steam: new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.6 }),
  ice: new THREE.MeshBasicMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.85 }),
  oil: new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.9 }),
  yogurt: new THREE.MeshBasicMaterial({ color: 0x86efac, transparent: true, opacity: 0.95 }),
  cartoonPuff: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  cartoonDrop: new THREE.MeshBasicMaterial({ color: 0xe0f2fe }),
  extinguisherFoam: new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.9 })
};

export class Particle {
  constructor(pos, vel, mat, size, life, hasOutline = false) {
    this.mesh = new THREE.Mesh(smallSphereGeo, mat);
    if (hasOutline) {
      const outMat = new THREE.MeshBasicMaterial({
        color: 0x1e293b,
        side: THREE.BackSide
      });
      const outMesh = new THREE.Mesh(smallSphereGeo, outMat);
      outMesh.scale.setScalar(1.18);
      this.mesh.add(outMesh);
    }
    this.mesh.position.copy(pos);
    this.mesh.scale.setScalar(size * 4);
    this.velocity = vel;
    this.life = life;
    this.maxLife = life;
    this.baseSize = size * 4;
    if (sceneRef) sceneRef.add(this.mesh);
    particles.push(this);
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) {
      if (sceneRef) sceneRef.remove(this.mesh);
      return false;
    }
    this.velocity.y -= 9.8 * dt;
    this.mesh.position.addScaledVector(this.velocity, dt);
    if (this.mesh.position.y < 0.1) {
      this.mesh.position.y = 0.1;
      this.velocity.multiplyScalar(0.7);
    }
    this.mesh.scale.setScalar((this.life / this.maxLife) * this.baseSize);
    return true;
  }
}

export function initParticles(scene) {
  sceneRef = scene;
}

export function spawnMilkSplash(pos, count = 8) {
  for (let i = 0; i < count; i++) {
    const vel = new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 5 + 2, (Math.random() - 0.5) * 8);
    new Particle(pos, vel, mats.cartoonPuff, 0.28, 0.55 + Math.random() * 0.3, true);
  }
}

export function spawnCartoonPuff(pos, count = 3, size = 0.35) {
  for (let i = 0; i < count; i++) {
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 2.5,
      Math.random() * 2.0 + 0.5,
      (Math.random() - 0.5) * 2.5
    );
    new Particle(pos, vel, mats.cartoonPuff, size, 0.45 + Math.random() * 0.25, true);
  }
}

export function spawnFoamJet(pos, dir, count = 4) {
  for (let i = 0; i < count; i++) {
    const vel = dir.clone().multiplyScalar(9.0 + Math.random() * 5.0);
    vel.x += (Math.random() - 0.5) * 4.0;
    vel.y += Math.random() * 3.0 + 1.0;
    vel.z += (Math.random() - 0.5) * 4.0;
    new Particle(pos, vel, mats.extinguisherFoam, 0.35, 0.55 + Math.random() * 0.25, false);
  }
}

export function spawnSparks(pos, count = 15) {
  for (let i = 0; i < count; i++) {
    const vel = new THREE.Vector3((Math.random() - 0.5) * 12, Math.random() * 8 + 2, (Math.random() - 0.5) * 12);
    new Particle(pos, vel, mats.spark, 0.12, 0.4);
  }
}

export function spawnFire(pos, count = 15) {
  for (let i = 0; i < count; i++) {
    const vel = new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 5 + 3, (Math.random() - 0.5) * 4);
    new Particle(pos, vel, mats.fire, 0.25, 0.7);
  }
}

export function spawnSurfaceTrail(pos, surfaceId, velocity) {
  const p = pos.clone();
  p.y = 0.15;
  const speed = velocity.length();
  if (speed < 0.5) return;

  // Cel-shaded comic cartoon puff clouds when sliding!
  if (surfaceId === 'skim_milk' || surfaceId === 'ice') {
    spawnCartoonPuff(p, 2, 0.28);
  } else if (surfaceId === 'butter_oil') {
    const vel = new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 2 + 0.8, (Math.random() - 0.5) * 2);
    new Particle(p, vel, mats.oil, 0.22, 0.45);
  } else if (surfaceId === 'yogurt') {
    const vel = new THREE.Vector3((Math.random() - 0.5) * 1.5, Math.random() * 1.2 + 0.2, (Math.random() - 0.5) * 1.5);
    new Particle(p, vel, mats.yogurt, 0.32, 0.6);
  } else {
    spawnCartoonPuff(p, 1, 0.2);
  }
}

export function spawnWallBounceSparks(pos, normalX, normalZ) {
  for (let i = 0; i < 12; i++) {
    const vel = new THREE.Vector3(
      normalX * (Math.random() * 8 + 4) + (Math.random() - 0.5) * 6,
      Math.random() * 6 + 2,
      normalZ * (Math.random() * 8 + 4) + (Math.random() - 0.5) * 6
    );
    new Particle(pos, vel, mats.oil, 0.18, 0.45);
  }
}

export function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].update(dt)) {
      particles.splice(i, 1);
    }
  }
}
