import { MapBuilder } from './map/mapBuilder.js';
import { PenguinPlayer } from './entities/player.js';
import { SecurityGuard } from './entities/guard.js';
import { FactoryWorker } from './entities/worker.js';
import { initParticles, updateParticles } from './entities/particle.js';
import { HUD } from './ui/hud.js';
import { setupInput } from './input/input.js';
import { gameState } from './core/state.js';
import { ZONES } from './core/constants.js';
import { GatePuzzlesManager } from './interactables/gatePuzzles.js';
import { MischiefManager } from './interactables/mischiefSystem.js';
import { ConveyorManager } from './interactables/conveyorSystem.js';

let scene, camera, renderer, clock;
let mapBuilder, player, hud, puzzles, mischief, conveyors;
let guards = [];
let workers = [];
let screenShakeIntensity = 0;

function init() {
  const canvas = document.getElementById('game-canvas');

  // Scene with bright cel-shaded sky blue cartoon backdrop
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x7dd3fc); // Vibrant cartoon sky blue
  scene.fog = new THREE.FogExp2(0x7dd3fc, 0.0022);
  clock = new THREE.Clock();

  // Camera (Lower FOV for true isometric comic-book look like the reference art)
  const aspect = window.innerWidth / window.innerHeight;
  const isPortrait = window.innerHeight > window.innerWidth;
  camera = new THREE.PerspectiveCamera(isPortrait ? 42 : 34, aspect, 0.1, 1000);
  camera.position.set(18, 22, 98);
  camera.lookAt(0, 0, 80);

  // High Performance WebGL Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Balanced Cel Lighting: calibrated so total irradiance stays within [0.45, 0.98]
  // preventing MeshToonMaterial from clipping to pure white!
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.52);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xfffbeb, 0.48);
  dirLight.position.set(35, 65, 45);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 10;
  dirLight.shadow.camera.far = 220;
  const d = 55;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  scene.add(dirLight);

  // Subtle fill light from opposite angle for soft comic shadow contrast
  const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.18);
  rimLight.position.set(-40, 25, -40);
  scene.add(rimLight);

  // Initialize Particle System
  initParticles(scene);

  // Build Macro Map Architecture (Zones 1 to 5, Walls, Surfaces, Gates)
  mapBuilder = new MapBuilder(scene);
  mapBuilder.buildAll();

  // Instantiate Interactive Gate Puzzles (Tanker, Steam Breaker, Centrifuge, Cheese Vault)
  puzzles = new GatePuzzlesManager(scene, mapBuilder);

  // Instantiate Bottle & Carton Conveyor System
  conveyors = new ConveyorManager(scene, mapBuilder);

  // Instantiate HUD
  hud = new HUD('minimap-canvas');

  // Instantiate Player in Zone 1 (Receiving Bay)
  player = new PenguinPlayer(mapBuilder, (pos, text, color) => {
    hud.showPopupText(camera, pos, text, color);
  });
  player.mesh.position.set(0, 0, 80);
  scene.add(player.mesh);

  // Initial NPCs distributed across zones
  // Zone 1
  workers.push(new FactoryWorker(scene, -8, 65, false));
  guards.push(new SecurityGuard(scene, 14, 65));

  // Zone 2
  workers.push(new FactoryWorker(scene, -6, 25, true)); // Supervisor with clipboard
  workers.push(new FactoryWorker(scene, 10, 15, true)); // Supervisor with clipboard
  guards.push(new SecurityGuard(scene, -12, 10));

  // Zone 3
  workers.push(new FactoryWorker(scene, -36, -38, false));

  // Zone 4
  workers.push(new FactoryWorker(scene, 28, -38, false));
  guards.push(new SecurityGuard(scene, 35, -55));

  // Zone 5
  workers.push(new FactoryWorker(scene, 0, -118, true)); // Penthouse Manager

  // Link World Entities to Player for direct slap knockdown and cage mechanics
  player.scene = scene;
  player.guards = guards;
  player.workers = workers;

  // Instantiate Phase 4 Slapstick Mischief Manager
  mischief = new MischiefManager(scene, player, mapBuilder);

  // Setup Input Handlers
  setupInput(canvas, () => hud.toggleDrawer());

  // Window Resize
  window.addEventListener('resize', onWindowResize);

  // Trigger initial Zone 1 announcement
  gameState.setZone(ZONES.ZONE_1);
}

function onWindowResize() {
  if (!camera || !renderer) return;
  const isPortrait = window.innerHeight > window.innerWidth;
  camera.fov = isPortrait ? 42 : 34;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function checkZonePresence(pos) {
  // Check which zone player is currently inside
  for (const zone of Object.values(ZONES)) {
    const b = zone.bounds;
    if (pos.x >= b.minX && pos.x <= b.maxX && pos.z >= b.minZ && pos.z <= b.maxZ) {
      gameState.setZone(zone);
      break;
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);
  gameState.update(dt);

  if (player && player.mesh) {
    player.update(dt);
    checkZonePresence(player.mesh.position);

    // Isometric 45-degree angle matching the reference illustration
    const isPortrait = window.innerHeight > window.innerWidth;
    const camOffset = isPortrait ? 24 : 21;
    const targetCamX = player.mesh.position.x + camOffset;
    const targetCamY = isPortrait ? 28 : 24;
    const targetCamZ = player.mesh.position.z + camOffset;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, dt * 6);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, dt * 6);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, dt * 6);
    camera.lookAt(player.mesh.position.x, 0.8, player.mesh.position.z);
  }

  // Update Interactive Gate Puzzles, Slapstick Mischief & Conveyor Belts
  if (puzzles) {
    puzzles.update(dt, player);
  }
  if (mischief) {
    mischief.update(dt, player);
  }
  if (conveyors) {
    conveyors.update(dt, player);
  }

  // Update NPCs
  const playerPos = player ? player.mesh.position : new THREE.Vector3();

  for (let i = 0; i < guards.length; i++) guards[i].update(dt, player);
  for (let i = 0; i < workers.length; i++) workers[i].update(dt, playerPos);

  // Update Particles
  updateParticles(dt);

  // Render Minimap
  if (hud) hud.renderMinimap(player, guards, workers);

  // Render Scene
  renderer.render(scene, camera);
}

window.onload = () => {
  init();
  animate();
};
