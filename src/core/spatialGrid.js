export const SPATIAL_CELL_SIZE = 16;
export const spatialGrid = new Map();

export function hashPos(x, z) {
  const cx = Math.floor(x / SPATIAL_CELL_SIZE);
  const cz = Math.floor(z / SPATIAL_CELL_SIZE);
  return `${cx},${cz}`;
}

export function registerCollider(collider) {
  if (collider.type === 'box') {
    const minCx = Math.floor((collider.cx - collider.hx) / SPATIAL_CELL_SIZE);
    const maxCx = Math.floor((collider.cx + collider.hx) / SPATIAL_CELL_SIZE);
    const minCz = Math.floor((collider.cz - collider.hz) / SPATIAL_CELL_SIZE);
    const maxCz = Math.floor((collider.cz + collider.hz) / SPATIAL_CELL_SIZE);
    for (let x = minCx; x <= maxCx; x++) {
      for (let z = minCz; z <= maxCz; z++) {
        const key = `${x},${z}`;
        if (!spatialGrid.has(key)) spatialGrid.set(key, []);
        spatialGrid.get(key).push(collider);
      }
    }
  } else if (collider.pos) {
    const key = hashPos(collider.pos.x, collider.pos.z);
    if (!spatialGrid.has(key)) spatialGrid.set(key, []);
    spatialGrid.get(key).push(collider);
  }
}

export function removeCollider(collider) {
  if (!collider) return;
  if (collider.type === 'box') {
    const minCx = Math.floor((collider.cx - collider.hx) / SPATIAL_CELL_SIZE);
    const maxCx = Math.floor((collider.cx + collider.hx) / SPATIAL_CELL_SIZE);
    const minCz = Math.floor((collider.cz - collider.hz) / SPATIAL_CELL_SIZE);
    const maxCz = Math.floor((collider.cz + collider.hz) / SPATIAL_CELL_SIZE);
    for (let x = minCx; x <= maxCx; x++) {
      for (let z = minCz; z <= maxCz; z++) {
        const cell = spatialGrid.get(`${x},${z}`);
        if (cell) {
          const idx = cell.indexOf(collider);
          if (idx !== -1) cell.splice(idx, 1);
        }
      }
    }
  } else if (collider.pos) {
    const key = hashPos(collider.pos.x, collider.pos.z);
    const cell = spatialGrid.get(key);
    if (cell) {
      const idx = cell.indexOf(collider);
      if (idx !== -1) cell.splice(idx, 1);
    }
  }
}

export function clearSpatialGrid() {
  spatialGrid.clear();
}

/**
 * Fast AABB & Radial Collision Resolver with smooth wall-sliding and bounce normals
 * Returns { hit: boolean, normalX: number, normalZ: number }
 */
export function resolveCollision(currPos, nextX, nextZ, radius) {
  const cx = Math.floor(nextX / SPATIAL_CELL_SIZE);
  const cz = Math.floor(nextZ / SPATIAL_CELL_SIZE);
  let hit = false;
  let normalX = 0;
  let normalZ = 0;

  // Check current cell and neighboring 8 cells
  for (let ox = -1; ox <= 1; ox++) {
    for (let oz = -1; oz <= 1; oz++) {
      const cell = spatialGrid.get(`${cx + ox},${cz + oz}`);
      if (!cell) continue;

      for (let i = 0; i < cell.length; i++) {
        const col = cell[i];

        // Box collider
        if (col.type === 'box') {
          const closestX = Math.max(col.cx - col.hx, Math.min(nextX, col.cx + col.hx));
          const closestZ = Math.max(col.cz - col.hz, Math.min(nextZ, col.cz + col.hz));
          const dx = nextX - closestX;
          const dz = nextZ - closestZ;
          const distSq = dx * dx + dz * dz;

          if (distSq < radius * radius) {
            hit = true;
            if (distSq > 0.00001) {
              const dist = Math.sqrt(distSq);
              const overlap = radius - dist;
              const nx = dx / dist;
              const nz = dz / dist;
              nextX += nx * overlap;
              nextZ += nz * overlap;
              normalX = nx;
              normalZ = nz;
            } else {
              // Deep inside: push along least penetration axis
              const overlapX = (col.hx + radius) - Math.abs(nextX - col.cx);
              const overlapZ = (col.hz + radius) - Math.abs(nextZ - col.cz);
              if (overlapX < overlapZ) {
                const sgn = nextX >= col.cx ? 1 : -1;
                nextX = col.cx + sgn * (col.hx + radius);
                normalX = sgn;
                normalZ = 0;
              } else {
                const sgn = nextZ >= col.cz ? 1 : -1;
                nextZ = col.cz + sgn * (col.hz + radius);
                normalX = 0;
                normalZ = sgn;
              }
            }
          }
        }
        // Circle / Radial collider
        else if (col.pos) {
          const cdx = nextX - col.pos.x;
          const cdz = nextZ - col.pos.z;
          const minDist = col.radius + radius;
          const distSq = cdx * cdx + cdz * cdz;

          if (distSq < minDist * minDist && distSq > 0.00001) {
            hit = true;
            const dist = Math.sqrt(distSq);
            const push = (minDist - dist);
            const nx = cdx / dist;
            const nz = cdz / dist;
            nextX += nx * push;
            nextZ += nz * push;
            normalX = nx;
            normalZ = nz;
          }
        }
      }
    }
  }

  currPos.x = nextX;
  currPos.z = nextZ;

  return { hit, normalX, normalZ };
}
