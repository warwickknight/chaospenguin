class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playTone(type, startFreq, endFreq, duration, gainVal = 0.25) {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, t);
      if (endFreq !== startFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 10), t + duration);
      }
      gain.gain.setValueAtTime(gainVal, t);
      gain.gain.linearRampToValueAtTime(0.001, t + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + duration);
    } catch(e) {}
  }

  playSlap() { this.playTone('triangle', 360, 40, 0.1, 0.35); }
  playSquish() { this.playTone('sine', 450, 110, 0.12, 0.2); }
  playZap() { this.playTone('sawtooth', 920, 200, 0.18, 0.25); }
  playSlide() { this.playTone('sine', 180, 320, 0.22, 0.2); }
  playWhistle() { this.playTone('sine', 1600, 1900, 0.25, 0.2); }
  playHydraulic() { this.playTone('sine', 140, 35, 0.28, 0.3); }
  playDing() { this.playTone('sine', 1760, 1760, 0.35, 0.25); }
  playGlassShatter() { this.playTone('square', 2200, 150, 0.18, 0.3); }
  playPanic() { this.playTone('sine', 550, 750, 0.25, 0.15); }
  playSiren() { this.playTone('triangle', 650, 950, 0.35, 0.15); }

  // Phase 2: Surface Physics Sounds
  playIceSlide() {
    this.playTone('sine', 480, 780, 0.3, 0.18);
  }

  playMilkDrift() {
    this.playTone('triangle', 280, 120, 0.25, 0.22);
    this.playTone('sine', 380, 160, 0.2, 0.18);
  }

  playOilBounce() {
    this.playTone('sine', 220, 680, 0.16, 0.35);
    this.playTone('triangle', 180, 450, 0.14, 0.25);
  }

  playYogurtSquelch() {
    this.playTone('sawtooth', 120, 40, 0.28, 0.3);
    this.playTone('sine', 240, 60, 0.22, 0.25);
  }

  playSquawk() {
    this.playTone('sawtooth', 420, 680, 0.28, 0.3);
    this.playTone('square', 780, 520, 0.22, 0.2);
  }

  // Phase 3: Puzzle Audio
  playSteamHiss() {
    this.playTone('sawtooth', 750, 1200, 0.35, 0.25);
  }

  playRumble() {
    this.playTone('sawtooth', 60, 30, 0.6, 0.4);
    this.playTone('triangle', 90, 45, 0.5, 0.3);
  }

  playLeverClick() {
    this.playTone('square', 620, 240, 0.12, 0.3);
    this.playTone('triangle', 380, 110, 0.1, 0.35);
  }

  playCentrifugeSpin(freq = 280) {
    this.playTone('sine', freq, freq + 80, 0.15, 0.18);
  }

  playMetalClang() {
    this.playTone('square', 820, 300, 0.2, 0.2);
    this.playTone('sine', 1240, 400, 0.2, 0.15);
  }

  playGateOpen() {
    this.playTone('sawtooth', 90, 40, 0.6, 0.4);
    this.playTone('square', 320, 120, 0.5, 0.3);
  }

  playWhoosh() {
    this.playTone('sawtooth', 300, 80, 0.35, 0.3);
    this.playTone('sine', 480, 120, 0.28, 0.25);
  }

  playPop() {
    this.playTone('sine', 880, 220, 0.08, 0.4);
  }

  playExplosion() {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(15, t + 0.45);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
    } catch(e) {}
  }
}

export const sound = new SoundEngine();
