// Midnight Vault — everything the player sees: the room, the cones, the
// thief, the HUD with its alarm meter, and the screen overlays. All art is
// drawn with canvas code; there are no image assets.

import {
  ALARM_MAX,
  CANVAS_H,
  CANVAS_W,
  FONT,
  FONT_MONO,
  GUARD_HALF_ANGLE,
  GUARD_R,
  GUARD_RANGE,
  HUD_H,
  PALETTE,
  PLAY,
  PLAYER_R,
  SCREENS,
  SMOKE_COUNT,
} from './config.js';
import { buttonsFor } from './input.js';

function conePath(ctx, x, y, angle, range, half) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(PLAY.x, PLAY.y, PLAY.w, PLAY.h);
  // Checker tiles so movement reads at a glance.
  ctx.fillStyle = PALETTE.floorAlt;
  const tile = 47;
  for (let ty = PLAY.y; ty < PLAY.y + PLAY.h; ty += tile) {
    for (let tx = PLAY.x; tx < PLAY.x + PLAY.w; tx += tile) {
      const col = Math.round((tx - PLAY.x) / tile);
      const row = Math.round((ty - PLAY.y) / tile);
      if ((col + row) % 2 === 0) ctx.fillRect(tx, ty, tile, tile);
    }
  }
  // Thick outer wall.
  ctx.strokeStyle = PALETTE.wallEdge;
  ctx.lineWidth = 6;
  ctx.strokeRect(PLAY.x + 3, PLAY.y + 3, PLAY.w - 6, PLAY.h - 6);
}

function drawCover(ctx, r) {
  ctx.fillStyle = PALETTE.cover;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = PALETTE.coverEdge;
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `11px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = r.kind === 'case' ? 'DISPLAY' : r.kind === 'desk' ? 'DESK' : r.kind === 'vault' ? 'VAULT' : r.kind === 'pillar' ? '' : 'CRATE';
  if (label) ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2);
  if (r.kind === 'vault') {
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(r.x + r.w / 2, r.y + r.h / 2, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#17130a';
    ctx.font = `bold 15px ${FONT}`;
    ctx.fillText('$', r.x + r.w / 2, r.y + r.h / 2 + 1);
  }
}

function drawLoot(ctx, l, t) {
  if (l.taken) return;
  const bob = Math.sin(t * 3 + l.x) * 3;
  const y = l.y + bob;
  ctx.save();
  ctx.translate(l.x, y);
  if (l.kind === 'diamond') {
    ctx.fillStyle = PALETTE.diamond;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(13, -4);
    ctx.lineTo(0, 16);
    ctx.lineTo(-13, -4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(6, -4);
    ctx.lineTo(0, 2);
    ctx.lineTo(-6, -4);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(11, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-11, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8a6414';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
  // Glow ring so the target is obvious.
  ctx.strokeStyle = l.kind === 'diamond' ? 'rgba(127,231,242,0.5)' : 'rgba(242,193,78,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(l.x, y, 20 + Math.sin(t * 3) * 2, 0, Math.PI * 2);
  ctx.stroke();
}

function drawExit(ctx, state) {
  const e = state.room.exit;
  const open = state.exitOpen;
  ctx.fillStyle = open ? PALETTE.exitOpen : PALETTE.exitLocked;
  ctx.fillRect(e.x - 6, e.y - 34, 12, 68);
  ctx.strokeStyle = open ? '#bff0d4' : '#e8a49e';
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x - 6, e.y - 34, 12, 68);
  ctx.fillStyle = open ? '#0d2b18' : '#f5d9d6';
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(e.x - 16, e.y);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(open ? 'EXIT OPEN' : 'EXIT', 0, 0);
  ctx.restore();
  if (open) {
    ctx.strokeStyle = 'rgba(89,201,138,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, 30 + Math.sin(state.elapsed * 4) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawGuard(ctx, g, t) {
  conePath(ctx, g.x, g.y, g.angle, GUARD_RANGE, GUARD_HALF_ANGLE);
  ctx.fillStyle = g.spotting ? 'rgba(217,95,75,0.38)' : PALETTE.cone;
  ctx.fill();
  ctx.strokeStyle = PALETTE.coneEdge;
  ctx.lineWidth = 1;
  ctx.stroke();
  // Body: uniformed guard with a cap brim pointing where he looks.
  ctx.fillStyle = PALETTE.guard;
  ctx.beginPath();
  ctx.arc(g.x, g.y, GUARD_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.guardDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = PALETTE.guardDark;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.angle) * (GUARD_R + 5), g.y + Math.sin(g.angle) * (GUARD_R + 5));
  ctx.stroke();
  if (g.spotting) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 20px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('!', g.x, g.y - GUARD_R - 4);
  }
}

function drawCamera(ctx, c) {
  conePath(ctx, c.x, c.y, c.angle, c.range, c.halfAngle);
  ctx.fillStyle = c.spotting ? 'rgba(224,72,62,0.36)' : PALETTE.camCone;
  ctx.fill();
  ctx.strokeStyle = PALETTE.camConeEdge;
  ctx.lineWidth = 1;
  ctx.stroke();
  // Wall mount + lens.
  ctx.fillStyle = '#3a3f58';
  ctx.fillRect(c.x - 10, c.y - 6, 20, 12);
  ctx.fillStyle = c.spotting ? '#ff5a4e' : PALETTE.cam;
  ctx.beginPath();
  ctx.arc(c.x + Math.cos(c.angle) * 12, c.y + Math.sin(c.angle) * 12, 6, 0, Math.PI * 2);
  ctx.fill();
  if (c.spotting) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('!', c.x, c.y - 14);
  }
}

function drawSmoke(ctx, s) {
  const alpha = Math.min(1, s.ttl);
  ctx.fillStyle = `rgba(180,186,205,${0.45 * alpha})`;
  ctx.beginPath();
  ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(210,214,228,${0.35 * alpha})`;
  ctx.beginPath();
  ctx.arc(s.x - 18, s.y - 10, s.r * 0.55, 0, Math.PI * 2);
  ctx.arc(s.x + 20, s.y + 12, s.r * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(ctx, state) {
  const p = state.player;
  // A faint halo so the thief always reads against the dark floor.
  const halo = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 30);
  halo.addColorStop(0, 'rgba(242,193,78,0.16)');
  halo.addColorStop(1, 'rgba(242,193,78,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 30, 0, Math.PI * 2);
  ctx.fill();
  // Soft shadow, then the thief: dark hood, pale mask, gold trim.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 7, PLAYER_R + 2, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#20222f';
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#20222f';
  ctx.fillRect(p.x - 5, p.y - 4, 10, 3);
}

function alarmColor(alarm) {
  if (alarm >= 70) return PALETTE.alarmHigh;
  if (alarm >= 35) return PALETTE.alarmMid;
  return PALETTE.alarmLow;
}

function drawHud(ctx, state) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);
  ctx.strokeStyle = PALETTE.hudLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, HUD_H);
  ctx.lineTo(CANVAS_W, HUD_H);
  ctx.stroke();

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 17px ${FONT}`;
  ctx.fillText('MIDNIGHT VAULT', 14, 17);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `14px ${FONT}`;
  const roomName = state.room ? state.room.name : '';
  ctx.fillText(roomName, 14, 38);

  // Loot counter.
  ctx.fillStyle = PALETTE.text;
  ctx.font = `15px ${FONT}`;
  ctx.fillText(`LOOT  ${state.lootTaken}/${state.loot.length}`, 300, 26);
  // Timer.
  const t = Math.max(0, Math.ceil(state.timeLeft));
  ctx.fillStyle = t <= 15 ? PALETTE.alarmHigh : PALETTE.text;
  ctx.font = `bold 16px ${FONT_MONO}`;
  ctx.fillText(`TIME ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`, 420, 26);
  // Score.
  ctx.fillStyle = PALETTE.text;
  ctx.font = `15px ${FONT}`;
  ctx.fillText(`SCORE ${state.score}`, 540, 26);
  // Smoke pellets, second row under the loot counter.
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `13px ${FONT}`;
  ctx.fillText(`SMOKE [E] ${'●'.repeat(state.smokesLeft)}${'○'.repeat(Math.max(0, SMOKE_COUNT - state.smokesLeft))}`, 300, 42);

  // The alarm meter: the game's heartbeat, always visible.
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText('ALARM', 836, 16);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#262a3d';
  ctx.fillRect(700, 24, 220, 14);
  ctx.fillStyle = alarmColor(state.alarm);
  ctx.fillRect(700, 24, Math.max(0, (220 * state.alarm) / ALARM_MAX), 14);
  ctx.strokeStyle = PALETTE.hudLine;
  ctx.lineWidth = 1;
  ctx.strokeRect(700.5, 24.5, 220, 14);
  ctx.fillStyle = state.alarm >= 70 ? PALETTE.alarmHigh : PALETTE.dim;
  ctx.font = `bold 11px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(state.alarm >= 70 ? 'SPOTTED!' : `${Math.round(state.alarm)}%`, 924, 16);
  ctx.textAlign = 'left';
}

function drawButton(ctx, b, hover) {
  ctx.fillStyle = hover ? '#ffd970' : PALETTE.button;
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.w, b.h, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.buttonText;
  ctx.font = `bold 16px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
}

function drawOverlay(ctx, state, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 9, 18, 0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = accent;
  ctx.font = `bold 44px ${FONT}`;
  ctx.fillText(title, CANVAS_W / 2, 150);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `18px ${FONT}`;
  lines.forEach((line, i) => ctx.fillText(line, CANVAS_W / 2, 215 + i * 30));
  for (const b of buttonsFor(state)) drawButton(ctx, b, false);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `13px ${FONT}`;
  ctx.fillText('WASD / arrows to move  •  E smoke pellet  •  P pause  •  M mute', CANVAS_W / 2, CANVAS_H - 40);
}

export function render(ctx, state, t) {
  drawFloor(ctx);
  if (!state.room) {
    drawHud(ctx, state);
    return;
  }
  for (const r of state.room.cover) drawCover(ctx, r);
  drawExit(ctx, state);
  for (const l of state.loot) drawLoot(ctx, l, t);
  for (const c of state.cameras) drawCamera(ctx, c);
  for (const g of state.guards) drawGuard(ctx, g, t);
  for (const s of state.smokes) drawSmoke(ctx, s);
  if (state.screen !== SCREENS.TITLE) drawPlayer(ctx, state);
  drawHud(ctx, state);

  // Hot-alarm vignette: the frame itself warns you.
  if (state.alarm >= 70 && state.screen === SCREENS.PLAYING) {
    const pulse = 0.10 + 0.06 * Math.sin(t * 6);
    ctx.strokeStyle = `rgba(224,72,62,${pulse + 0.12})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, CANVAS_W - 10, CANVAS_H - 10);
  }

  if (state.screen === SCREENS.TITLE) {
    drawOverlay(ctx, state, 'MIDNIGHT VAULT', [
      'Three rooms. One diamond. No alarms.',
      'Sneak past the guards and their sweeping cameras,',
      'grab every piece of loot, then slip out the EXIT.',
      'Vision cones are danger. Crates and desks are cover.',
      'Smoke pellets [E] hide you — but they cost 25 points.',
    ], PALETTE.gold);
  } else if (state.screen === SCREENS.ROOM_CLEAR) {
    drawOverlay(ctx, state, 'ROOM CLEAR', [
      `${state.room.name} — loot secured.`,
      `Time bonus  +${state.roomBonus}`,
      `Score  ${state.score}`,
    ], PALETTE.alarmLow);
  } else if (state.screen === SCREENS.CAUGHT) {
    const reason = state.caughtReason === 'time'
      ? 'Time ran out — the vault sealed shut.'
      : 'The alarm hit 100% — the guards caught you.';
    drawOverlay(ctx, state, 'CAUGHT!', [
      reason,
      `${state.room.name}  •  loot ${state.lootTaken}/${state.loot.length}  •  score ${state.score}`,
      'Watch the cones. Use the cover. Smoke buys you seconds.',
    ], PALETTE.alarmHigh);
  } else if (state.screen === SCREENS.WIN) {
    drawOverlay(ctx, state, 'CLEAN GETAWAY!', [
      'Every room cleared. The diamond is yours.',
      `Final score  ${state.score}   •   Best  ${Math.max(state.best, state.score)}`,
      `Peak alarm  ${Math.round(state.peakAlarm)}%`,
    ], PALETTE.diamond);
  } else if (state.screen === SCREENS.PAUSED) {
    drawOverlay(ctx, state, 'PAUSED', [
      'The guards wait. The cameras keep sweeping.',
      `${state.room.name}  •  score ${state.score}`,
    ], PALETTE.text);
  }
}
