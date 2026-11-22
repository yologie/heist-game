// Midnight Vault — vision cones and line of sight. A watcher (guard or
// camera) sees the thief when the thief is inside its cone range and angle
// and the segment between them crosses no cover rectangle and no smoke cloud.

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function pointInCone(px, py, ox, oy, facing, range, halfAngle) {
  const dx = px - ox;
  const dy = py - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 1) return true;
  return Math.abs(angleDiff(Math.atan2(dy, dx), facing)) <= halfAngle;
}

// Segment (x1,y1)-(x2,y2) against an axis-aligned rectangle. Slab method.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

// Segment against a circle (smoke cloud). True when the segment passes
// within radius of the centre.
export function segmentHitsCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((cx - x1) * dx + (cy - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  return Math.hypot(cx - px, cy - py) < r;
}

export function hasLineOfSight(x1, y1, x2, y2, cover, smokes) {
  for (const r of cover) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return false;
  }
  for (const s of smokes) {
    if (segmentHitsCircle(x1, y1, x2, y2, s.x, s.y, s.r)) return false;
  }
  return true;
}

// A watcher sees the thief: inside the cone and a clear line of sight.
export function watcherSees(watcher, px, py, cover, smokes) {
  if (!pointInCone(px, py, watcher.x, watcher.y, watcher.angle, watcher.range, watcher.halfAngle)) {
    return false;
  }
  return hasLineOfSight(watcher.x, watcher.y, px, py, cover, smokes);
}

// Circle (the thief) against a rectangle, for movement collision.
export function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  return (cx - nx) * (cx - nx) + (cy - ny) * (cy - ny) < r * r;
}

// Push a circle out of a rectangle it overlaps; returns the corrected centre.
export function pushCircleOutOfRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  let dx = cx - nx;
  let dy = cy - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return { x: cx, y: cy };
  if (d2 < 1e-9) {
    // Centre inside the rectangle: push out along the smallest penetration.
    const left = cx - rect.x;
    const right = rect.x + rect.w - cx;
    const top = cy - rect.y;
    const bottom = rect.y + rect.h - cy;
    const m = Math.min(left, right, top, bottom);
    if (m === left) return { x: rect.x - r, y: cy };
    if (m === right) return { x: rect.x + rect.w + r, y: cy };
    if (m === top) return { x: cx, y: rect.y - r };
    return { x: cx, y: rect.y + rect.h + r };
  }
  const d = Math.sqrt(d2);
  dx /= d;
  dy /= d;
  return { x: nx + dx * r, y: ny + dy * r };
}
