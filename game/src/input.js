// Keyboard + mouse input, reported in the game's logical 1280x800 space.
import { CX, CY, W, H } from './config.js';

export function createInput(canvas) {
  const input = {
    mouseX: CX,
    mouseY: CY - 220,
    mouseDown: false,
    clicked: false,
    keys: new Set(),
    pressed: new Set(),
    // Aim angle from the prism (centre) to the mouse pointer.
    aimAngle() {
      return Math.atan2(input.mouseY - CY, input.mouseX - CX);
    },
    consumePressed(code) {
      if (input.pressed.has(code)) {
        input.pressed.delete(code);
        return true;
      }
      return false;
    },
    // Rotation keys held: -1 left, +1 right, 0 none.
    rotateHeld() {
      const left = input.keys.has('KeyA') || input.keys.has('ArrowLeft');
      const right = input.keys.has('KeyD') || input.keys.has('ArrowRight');
      return (right ? 1 : 0) - (left ? 1 : 0);
    },
    endFrame() {
      input.pressed.clear();
      input.clicked = false;
    },
  };

  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  }

  canvas.addEventListener('mousemove', (e) => {
    const p = toLogical(e.clientX, e.clientY);
    input.mouseX = p.x;
    input.mouseY = p.y;
  });
  canvas.addEventListener('mousedown', (e) => {
    const p = toLogical(e.clientX, e.clientY);
    input.mouseX = p.x;
    input.mouseY = p.y;
    input.mouseDown = true;
    input.clicked = true;
  });
  window.addEventListener('mouseup', () => {
    input.mouseDown = false;
  });
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (!e.repeat) input.pressed.add(e.code);
    input.keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => {
    input.keys.delete(e.code);
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  return input;
}
