import { sound } from '../audio/sound.js';

export const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  attack: false,
  slide: false,
  joystickVector: { x: 0, y: 0 },
  isJoystickActive: false
};

export function setupInput(canvas, onToggleObjectives) {
  // Desktop Keyboard
  window.addEventListener('keydown', (e) => {
    sound.resume();
    const code = e.code;
    if (code === 'KeyW' || code === 'ArrowUp') input.up = true;
    if (code === 'KeyS' || code === 'ArrowDown') input.down = true;
    if (code === 'KeyA' || code === 'ArrowLeft') input.left = true;
    if (code === 'KeyD' || code === 'ArrowRight') input.right = true;
    if (code === 'Space') input.attack = true;
    if (code === 'ShiftLeft' || code === 'ShiftRight') input.slide = true;
    if (code === 'KeyO' || code === 'Tab') {
      e.preventDefault();
      if (onToggleObjectives) onToggleObjectives();
    }
  });

  window.addEventListener('keyup', (e) => {
    const code = e.code;
    if (code === 'KeyW' || code === 'ArrowUp') input.up = false;
    if (code === 'KeyS' || code === 'ArrowDown') input.down = false;
    if (code === 'KeyA' || code === 'ArrowLeft') input.left = false;
    if (code === 'KeyD' || code === 'ArrowRight') input.right = false;
    if (code === 'Space') input.attack = false;
    if (code === 'ShiftLeft' || code === 'ShiftRight') input.slide = false;
  });

  // Mouse Click (Slap)
  canvas.addEventListener('pointerdown', (e) => {
    sound.resume();
    if (e.pointerType === 'mouse' && e.button === 0) {
      input.attack = true;
      setTimeout(() => { input.attack = false; }, 120);
    }
  });

  // Mobile Virtual Joystick
  const joystickZone = document.getElementById('joystick-zone');
  const joystickKnob = document.getElementById('joystick-knob');
  if (joystickZone && joystickKnob) {
    let touchId = null;
    let center = { x: 0, y: 0 };
    const maxRadius = 45;

    joystickZone.addEventListener('touchstart', (e) => {
      sound.resume();
      e.preventDefault();
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      const rect = joystickZone.getBoundingClientRect();
      center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      handleJoystick(touch.clientX, touch.clientY);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          handleJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    }, { passive: false });

    const endJoystick = (e) => {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          input.isJoystickActive = false;
          input.joystickVector.x = 0;
          input.joystickVector.y = 0;
          joystickKnob.style.transform = `translate(0px, 0px)`;
          break;
        }
      }
    };

    window.addEventListener('touchend', endJoystick);
    window.addEventListener('touchcancel', endJoystick);

    function handleJoystick(clientX, clientY) {
      const dx = clientX - center.x;
      const dy = clientY - center.y;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const clampedDist = Math.min(dist, maxRadius);

      const knobX = Math.cos(angle) * clampedDist;
      const knobY = Math.sin(angle) * clampedDist;
      joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

      input.isJoystickActive = clampedDist > 5;
      const normDist = clampedDist / maxRadius;
      input.joystickVector.x = Math.cos(angle) * normDist;
      input.joystickVector.y = Math.sin(angle) * normDist;
    }
  }

  // Mobile Touch Action Buttons
  const attackBtn = document.getElementById('touch-attack');
  const slideBtn = document.getElementById('touch-slide');

  if (attackBtn) {
    attackBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      sound.resume();
      input.attack = true;
    }, { passive: false });
    attackBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      input.attack = false;
    }, { passive: false });
  }

  if (slideBtn) {
    slideBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      sound.resume();
      input.slide = true;
    }, { passive: false });
    slideBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      input.slide = false;
    }, { passive: false });
  }
}
