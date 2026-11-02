/**
 * Cel-Shading & Comic-Book Ink Outline Engine
 */

let sharedGradientMap = null;
const edgeMatCache = new Map();
const outlineMatCache = new Map();

export function getCelGradientMap() {
  if (sharedGradientMap) return sharedGradientMap;

  // 3-Tone Discrete Stepped Luminance Gradient for comic-book cel-shading
  // In Three.js r128, MeshToonMaterial multiplies irradiance * diffuse * gradientMap.
  // With AmbientLight(0.55) + DirectionalLight(0.50), irradiance spans [0.55, 1.05],
  // which samples the upper half of the gradient texture cleanly when tone-balanced!
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');

  // Stepped tones: Deep Shadow, Mid Shadow, Base Midtone, Crisp Highlight
  ctx.fillStyle = '#738296';
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = '#9aa8bc';
  ctx.fillRect(1, 0, 1, 1);
  ctx.fillStyle = '#dce4ef';
  ctx.fillRect(2, 0, 1, 1);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(3, 0, 1, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;

  sharedGradientMap = texture;
  return sharedGradientMap;
}

/**
 * Creates a vibrant Cel-Shaded Toon Material that preserves rich base colors
 * without blowing out to white.
 */
export function createToonMaterial(color, options = {}) {
  const gradientMap = getCelGradientMap();
  return new THREE.MeshToonMaterial({
    color: color,
    gradientMap: gradientMap,
    transparent: options.transparent || false,
    opacity: options.opacity !== undefined ? options.opacity : 1.0,
    ...options
  });
}

/**
 * Applies a crisp comic-book ink outline to any mesh:
 * 1. Inverted-hull silhouette outline (with polygonOffset so curved surfaces never black out)
 * 2. Hard crease edge lines (EdgesGeometry) so boxes, cylinders, and bevels have crisp ink seams
 */
export function addToonOutline(mesh, thickness = 0.045, outlineColor = 0x1e293b) {
  if (!mesh || !mesh.geometry) return null;

  // 1. Inverted-hull silhouette outline
  let outlineMat = outlineMatCache.get(outlineColor);
  if (!outlineMat) {
    outlineMat = new THREE.MeshBasicMaterial({
      color: outlineColor,
      side: THREE.BackSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 2
    });
    outlineMatCache.set(outlineColor, outlineMat);
  }

  const outlineMesh = new THREE.Mesh(mesh.geometry, outlineMat);
  const scaleMult = 1.0 + thickness;
  outlineMesh.scale.set(scaleMult, scaleMult, scaleMult);
  outlineMesh.position.set(0, 0, 0);
  outlineMesh.rotation.set(0, 0, 0);
  mesh.add(outlineMesh);

  // 2. Hard crease ink edges for flat/architectural surfaces (boxes, cylinders, cones)
  try {
    const edgesGeo = new THREE.EdgesGeometry(mesh.geometry, 28);
    if (edgesGeo.attributes.position && edgesGeo.attributes.position.count > 0) {
      let lineMat = edgeMatCache.get(outlineColor);
      if (!lineMat) {
        lineMat = new THREE.LineBasicMaterial({
          color: outlineColor,
          transparent: true,
          opacity: 0.85
        });
        edgeMatCache.set(outlineColor, lineMat);
      }
      const edgeLines = new THREE.LineSegments(edgesGeo, lineMat);
      mesh.add(edgeLines);
    }
  } catch (_) {
    // Ignore if geometry doesn't support EdgesGeometry
  }

  return outlineMesh;
}

