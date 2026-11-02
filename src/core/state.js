import { ZONES, COMBO_TITLES } from './constants.js';

class GameState {
  constructor() {
    this.reset();
    this.listeners = new Set();
  }

  reset() {
    this.currentZone = ZONES.ZONE_1;
    this.chaosScore = 0;
    this.wantedHeat = 0; // Tracks chaos accumulated since last capture for star rating
    this.alarmLevel = 0; // Starts at 0 stars
    this.comboMultiplier = 1;
    this.comboTimer = 0;
    this.alarmActive = false;

    // 4 Progressive Escape Gates
    this.gates = {
      gate_1: false, // Sub-Zero Blast Door (Zone 1 -> Zone 2)
      gate_2: false, // Biometric Turnstiles (Zone 2 -> Zone 3/4)
      gate_3: false, // Retractable Whey Bridge (Zone 3 <-> Zone 4)
      gate_4: false  // 3-Wheel Pressure Vault (Zone 3/4 -> Zone 5)
    };

    // Slapstick Mischief Challenges
    this.mischief = {
      crateTower: false,     // Topple 10-tier crate tower onto forklift
      clipboard: false,      // Slap 3 supervisors' clipboards in under 30s
      clipboardCount: 0,
      clipboardTimer: 0,
      disguisedBox: false,   // Travel 50m in cardboard box
      disguisedDistance: 0,
      certifiedDairy: false, // Slide under automatic label stamper
      broadcastSquawk: false,// Squawk into Executive Intercom
      milkCannon: false,     // Detonate CO2 Pressurized Milk Jug Cannon
      rocketExtinguisher: false // Launch mobile fire extinguisher rocket
    };

    this.staffStunnedTimer = 0;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, data) {
    for (const listener of this.listeners) {
      listener(event, data, this);
    }
  }

  setZone(zone) {
    if (!zone || this.currentZone.id === zone.id) return;
    this.currentZone = zone;
    this.notify('zone_change', zone);
  }

  unlockGate(gateId) {
    if (this.gates[gateId]) return false;
    this.gates[gateId] = true;
    this.notify('gate_unlocked', gateId);
    return true;
  }

  completeMischief(key) {
    if (this.mischief[key] === true) return false;
    this.mischief[key] = true;
    this.notify('mischief_completed', key);
    return true;
  }

  incrementClipboard() {
    if (this.mischief.clipboard) return;
    this.mischief.clipboardCount++;
    this.mischief.clipboardTimer = 30.0; // 30s window
    this.notify('clipboard_slapped', this.mischief.clipboardCount);
    if (this.mischief.clipboardCount >= 3) {
      this.completeMischief('clipboard');
      this.addChaos(250, "CLIPBOARD FLUTTER COMPLETE!");
    }
  }

  addDisguisedDistance(dist) {
    if (this.mischief.disguisedBox) return;
    this.mischief.disguisedDistance += dist;
    if (this.mischief.disguisedDistance >= 50.0) {
      this.completeMischief('disguisedBox');
      this.addChaos(300, "DISGUISED COURIER COMPLETE!");
    }
  }

  triggerStaffStun(duration = 6.0) {
    this.staffStunnedTimer = duration;
    this.completeMischief('broadcastSquawk');
    this.addChaos(350, "ALL STAFF STUNNED BY SQUAWK!!");
    this.notify('staff_stunned', duration);
  }

  isStaffStunned() {
    return this.staffStunnedTimer > 0;
  }

  addChaos(amount, title = '') {
    this.comboMultiplier = Math.min(this.comboMultiplier + 1, 8);
    this.comboTimer = 3.5;
    const earned = amount * this.comboMultiplier;
    this.chaosScore += earned;
    this.wantedHeat += earned;

    const titleIdx = Math.min(this.comboMultiplier - 1, COMBO_TITLES.length - 1);
    const finalTitle = title || COMBO_TITLES[titleIdx];

    // Slower, more progressive alarm escalation based on wantedHeat (resets to 0 when caught!):
    // 1 Star: 1,500 heat
    // 2 Stars: 3,500 heat
    // 3 Stars: 6,500 heat
    // 4 Stars: 11,000 heat
    // 5 Stars: 18,000 heat
    if (this.wantedHeat >= 18000 && this.alarmLevel < 5) this.setAlarmLevel(5);
    else if (this.wantedHeat >= 11000 && this.alarmLevel < 4) this.setAlarmLevel(4);
    else if (this.wantedHeat >= 6500 && this.alarmLevel < 3) this.setAlarmLevel(3);
    else if (this.wantedHeat >= 3500 && this.alarmLevel < 2) this.setAlarmLevel(2);
    else if (this.wantedHeat >= 1500 && this.alarmLevel < 1) this.setAlarmLevel(1);

    this.notify('score_added', { earned, total: this.chaosScore, title: finalTitle, multiplier: this.comboMultiplier });
  }

  resetAlarm() {
    this.wantedHeat = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;
    this.notify('combo_reset', null);
    this.setAlarmLevel(0);
  }

  setAlarmLevel(lvl) {
    this.alarmLevel = lvl;
    this.alarmActive = lvl >= 3;
    this.notify('alarm_changed', { level: lvl, active: this.alarmActive });
  }

  update(dt) {
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboMultiplier = 1;
        this.notify('combo_reset', null);
      }
    }

    if (this.staffStunnedTimer > 0) {
      this.staffStunnedTimer -= dt;
    }

    if (this.mischief.clipboardTimer > 0 && !this.mischief.clipboard) {
      this.mischief.clipboardTimer -= dt;
      if (this.mischief.clipboardTimer <= 0) {
        this.mischief.clipboardCount = 0;
        this.notify('clipboard_slapped', 0);
      }
    }
  }
}

export const gameState = new GameState();
