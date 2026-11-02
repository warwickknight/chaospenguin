import { gameState } from '../core/state.js';
import { ZONES, GATES } from '../core/constants.js';
import { sound } from '../audio/sound.js';

export class HUD {
  constructor(canvasId = 'minimap-canvas') {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.popupContainer = document.getElementById('popup-container');
    this.drawer = document.getElementById('objectives-drawer');

    this.initEventListeners();
    this.initGameStateSubscriptions();
  }

  initEventListeners() {
    // Sound Button
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        const icon = document.getElementById('sound-icon');
        if (icon) icon.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    // Toggle Objectives Drawer
    const btnObjectives = document.getElementById('btn-objectives');
    if (btnObjectives) {
      btnObjectives.addEventListener('click', () => this.toggleDrawer());
    }

    const btnCloseDrawer = document.getElementById('btn-close-drawer');
    if (btnCloseDrawer) {
      btnCloseDrawer.addEventListener('click', () => this.toggleDrawer(false));
    }
  }

  toggleDrawer(forceState) {
    if (!this.drawer) return;
    if (typeof forceState === 'boolean') {
      if (forceState) this.drawer.classList.add('open');
      else this.drawer.classList.remove('open');
    } else {
      this.drawer.classList.toggle('open');
    }
  }

  initGameStateSubscriptions() {
    gameState.subscribe((event, data) => {
      if (event === 'score_added') {
        const scoreEl = document.getElementById('score-display');
        if (scoreEl) scoreEl.textContent = gameState.chaosScore.toLocaleString();

        const badge = document.getElementById('combo-badge');
        if (badge) {
          badge.textContent = `x${data.multiplier} COMBO`;
          badge.classList.remove('hidden');
        }

        const comboTitleEl = document.getElementById('combo-title');
        if (comboTitleEl) comboTitleEl.textContent = data.title;

      } else if (event === 'combo_reset') {
        const badge = document.getElementById('combo-badge');
        if (badge) badge.classList.add('hidden');
        const comboTitleEl = document.getElementById('combo-title');
        if (comboTitleEl) comboTitleEl.textContent = '';

      } else if (event === 'alarm_changed') {
        const stars = '⭐'.repeat(Math.max(0, data.level)) + '☆'.repeat(Math.max(0, 5 - data.level));
        const starEl = document.getElementById('alarm-level-stars');
        if (starEl) starEl.textContent = stars;

      } else if (event === 'zone_change') {
        this.showZoneBanner(data);

      } else if (event === 'gate_unlocked') {
        this.updateObjectiveUI();

      } else if (event === 'mischief_completed' || event === 'clipboard_slapped') {
        this.updateObjectiveUI();
      }
    });
  }

  showZoneBanner(zone) {
    const banner = document.getElementById('zone-banner');
    const nameEl = document.getElementById('zone-name');
    const subEl = document.getElementById('zone-subtitle');
    if (!banner || !nameEl || !subEl) return;

    nameEl.textContent = zone.name.toUpperCase();
    subEl.textContent = zone.subtitle;
    banner.style.opacity = '1';
    banner.style.transform = 'translate(-50%, 0) scale(1)';

    setTimeout(() => {
      banner.style.opacity = '0';
      banner.style.transform = 'translate(-50%, -15px) scale(0.95)';
    }, 2800);
  }

  showPopupText(camera, pos, text, color = '#facc15') {
    if (!this.popupContainer || !camera) return;

    const tempV = pos.clone();
    tempV.y += 1.8;
    tempV.project(camera);

    const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(tempV.y * 0.5) + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = 'floating-popup';
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = color;
    this.popupContainer.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transform = 'translate(-50%, -140%) scale(1.35)';
      el.style.opacity = '0';
    });

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 850);
  }

  updateObjectiveUI() {
    // Escape Gates
    const checkG1 = document.getElementById('check-gate-1');
    const checkG2 = document.getElementById('check-gate-2');
    const checkG3 = document.getElementById('check-gate-3');
    const checkG4 = document.getElementById('check-gate-4');
    if (checkG1) checkG1.checked = gameState.gates.gate_1;
    if (checkG2) checkG2.checked = gameState.gates.gate_2;
    if (checkG3) checkG3.checked = gameState.gates.gate_3;
    if (checkG4) checkG4.checked = gameState.gates.gate_4;

    // Mischief
    const checkM1 = document.getElementById('check-m-tower');
    const checkM2 = document.getElementById('check-m-clip');
    const checkM3 = document.getElementById('check-m-box');
    const checkM4 = document.getElementById('check-m-stamp');
    const checkM5 = document.getElementById('check-m-squawk');
    const checkM6 = document.getElementById('check-m-cannon');
    const checkM7 = document.getElementById('check-m-extinguisher');

    if (checkM1) checkM1.checked = gameState.mischief.crateTower;
    if (checkM2) {
      checkM2.checked = gameState.mischief.clipboardCount >= 3;
      const countEl = document.getElementById('clipboard-count-text');
      if (countEl) countEl.textContent = `(${gameState.mischief.clipboardCount}/3)`;
    }
    if (checkM3) checkM3.checked = gameState.mischief.disguisedBox;
    if (checkM4) checkM4.checked = gameState.mischief.certifiedDairy;
    if (checkM5) checkM5.checked = gameState.mischief.broadcastSquawk;
    if (checkM6) checkM6.checked = gameState.mischief.milkCannon;
    if (checkM7) checkM7.checked = gameState.mischief.rocketExtinguisher;
  }

  /**
   * Radar Minimap renderer covering the 5 connected zones
   */
  renderMinimap(player, guards = [], workers = []) {
    if (!this.ctx || !player || !player.mesh) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, w, h);

    const px = player.mesh.position.x;
    const pz = player.mesh.position.z;
    const radarRange = 65.0;

    const toLocal = (wx, wz) => ({
      mx: w / 2 + ((wx - px) / radarRange) * (w / 2),
      mz: h / 2 + ((wz - pz) / radarRange) * (h / 2)
    });

    // Draw Zone Boundaries on Radar
    Object.values(ZONES).forEach(z => {
      const p1 = toLocal(z.bounds.minX, z.bounds.minZ);
      const p2 = toLocal(z.bounds.maxX, z.bounds.maxZ);
      ctx.strokeStyle = z.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(p1.mx, p1.mz, p2.mx - p1.mx, p2.mz - p1.mz);
    });

    // Draw Gates
    Object.values(GATES).forEach(g => {
      const pt = toLocal(g.pos.x, g.pos.z);
      const isUnlocked = gameState.gates[g.id];
      ctx.fillStyle = isUnlocked ? '#22c55e' : '#ef4444';
      ctx.fillRect(pt.mx - 4, pt.mz - 2, 8, 4);
    });

    // Guards
    ctx.fillStyle = '#84cc16';
    for (let i = 0; i < guards.length; i++) {
      const g = guards[i];
      const pt = toLocal(g.mesh.position.x, g.mesh.position.z);
      if (pt.mx >= 0 && pt.mx <= w && pt.mz >= 0 && pt.mz <= h) {
        ctx.beginPath();
        ctx.arc(pt.mx, pt.mz, 3.0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Workers
    ctx.fillStyle = '#facc15';
    for (let i = 0; i < workers.length; i++) {
      const wk = workers[i];
      const pt = toLocal(wk.mesh.position.x, wk.mesh.position.z);
      if (pt.mx >= 0 && pt.mx <= w && pt.mz >= 0 && pt.mz <= h) {
        ctx.beginPath();
        ctx.arc(pt.mx, pt.mz, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 3.8, 0, Math.PI * 2);
    ctx.fill();

    // Heading indicator
    const forward = new THREE.Vector3(0, 0, 6).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.mesh.rotation.y);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2);
    ctx.lineTo(w / 2 + forward.x, h / 2 + forward.z);
    ctx.stroke();
  }
}
