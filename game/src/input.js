// Midnight Vault — keyboard and mouse input. WASD / arrows move the thief,
// E drops a smoke pellet, P pauses, M mutes, Enter or Space presses the
// screen's main button, and the mouse clicks the on-screen buttons.

import { CANVAS_W, SCREENS } from './config.js';
import { dropSmoke, nextRoom, retryRoom, startGame, toTitle, togglePause } from './game.js';
import { sfx, toggleMute, unlockAudio } from './sound.js';

const MOVE_KEYS = {
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
};

const BTN_W = 220;
const BTN_H = 46;

// The buttons on each screen, in canvas pixels. render.js draws these;
// click handling below hit-tests the same list, so they never drift apart.
export function buttonsFor(state) {
  const cx = CANVAS_W / 2 - BTN_W / 2;
  switch (state.screen) {
    case SCREENS.TITLE:
      return [{ id: 'start', label: 'START THE HEIST', x: cx, y: 470, w: BTN_W, h: BTN_H }];
    case SCREENS.ROOM_CLEAR:
      return [{ id: 'next', label: state.roomIndex + 1 >= 3 ? 'SEE THE SCORE' : 'NEXT ROOM', x: cx, y: 420, w: BTN_W, h: BTN_H }];
    case SCREENS.CAUGHT:
      return [
        { id: 'retry', label: 'TRY THIS ROOM AGAIN', x: cx, y: 400, w: BTN_W, h: BTN_H },
        { id: 'title', label: 'BACK TO TITLE', x: cx, y: 460, w: BTN_W, h: BTN_H },
      ];
    case SCREENS.WIN:
      return [
        { id: 'again', label: 'PLAY AGAIN', x: cx, y: 430, w: BTN_W, h: BTN_H },
        { id: 'title', label: 'BACK TO TITLE', x: cx, y: 490, w: BTN_W, h: BTN_H },
      ];
    case SCREENS.PAUSED:
      return [
        { id: 'resume', label: 'RESUME', x: cx, y: 330, w: BTN_W, h: BTN_H },
        { id: 'title', label: 'QUIT TO TITLE', x: cx, y: 390, w: BTN_W, h: BTN_H },
      ];
    default:
      return [];
  }
}

function pressButton(state, id) {
  sfx.click();
  if (id === 'start' || id === 'again') startGame(state);
  else if (id === 'next') nextRoom(state);
  else if (id === 'retry') retryRoom(state);
  else if (id === 'resume') togglePause(state);
  else if (id === 'title') toTitle(state);
}

export function createInput(state, canvas) {
  const held = new Set();

  function axes() {
    let x = 0;
    let y = 0;
    for (const code of held) {
      const v = MOVE_KEYS[code];
      if (v) {
        x += v[0];
        y += v[1];
      }
    }
    return { x, y };
  }

  function canvasPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((clientY - rect.top) / rect.height) * 640,
    };
  }

  function onKeyDown(e) {
    unlockAudio();
    if (e.code === 'KeyM') {
      toggleMute();
      return;
    }
    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (state.screen === SCREENS.PLAYING || state.screen === SCREENS.PAUSED) togglePause(state);
      return;
    }
    if (e.code === 'KeyE') {
      dropSmoke(state);
      return;
    }
    if (e.code === 'Enter' || e.code === 'Space') {
      const btns = buttonsFor(state);
      if (btns.length > 0) {
        e.preventDefault();
        pressButton(state, btns[0].id);
      }
      return;
    }
    if (MOVE_KEYS[e.code]) {
      held.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    }
  }

  function onKeyUp(e) {
    held.delete(e.code);
  }

  function onClick(e) {
    unlockAudio();
    const p = canvasPoint(e.clientX, e.clientY);
    for (const b of buttonsFor(state)) {
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
        pressButton(state, b.id);
        return;
      }
    }
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('click', onClick);
  window.addEventListener('blur', () => held.clear());

  return { axes, held };
}
