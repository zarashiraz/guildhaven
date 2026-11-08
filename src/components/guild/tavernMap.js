// The shape of the tavern: how big it is and what blocks the way.
// One tile = 16 drawing units. The room is 20 tiles wide and 12 tall.
// Rows 0 and 1 are the back wall. Players walk on rows 2 to 11.

export const TILE = 16;
export const COLS = 20;
export const ROWS = 12;

// Furniture players cannot walk through: [x, y, width, height] in tiles
export const BLOCKED = [
  [0, 2, 5, 1], // kitchen counter
  [5, 2, 2, 1], // barrels
  [8, 2, 4, 1], // fireplace
  [17, 2, 3, 1], // dish hutch
  [12, 4, 4, 2], // table A
  [12, 8, 4, 2], // table B
  [3, 6, 4, 2], // duo quest table
  [18, 5, 1, 1], // plant
  [18, 9, 1, 1], // plant
];

// Stools. Players can stand on them, which looks like sitting down.
export const STOOLS = [
  [11, 4], [11, 5], [16, 4], [16, 5],
  [11, 8], [11, 9], [16, 8], [16, 9],
  [2, 6], [2, 7], [7, 6], [7, 7],
];

export function isStool(x, y) {
  return STOOLS.some(([sx, sy]) => sx === x && sy === y);
}

export function isWalkable(x, y) {
  if (x < 0 || x >= COLS || y < 2 || y >= ROWS) return false;
  return !BLOCKED.some(([bx, by, bw, bh]) => x >= bx && x < bx + bw && y >= by && y < by + bh);
}

// Shortest walk between two tiles that goes around furniture, using as few turns as possible.
// Returns the tiles to step on (not including where you start), or null if there is no way.
export function findPath(from, to) {
  if (!isWalkable(to.x, to.y)) return null;
  if (from.x === to.x && from.y === to.y) return [];

  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const STEP = 10;
  const TURN = 3;
  const id = (x, y, d) => (y * COLS + x) * 4 + d;

  // Each state is (tile, direction we were walking). Cost = steps, plus a small cost per turn.
  const best = new Map();
  const prev = new Map();
  const open = [];
  for (let d = 0; d < 4; d += 1) {
    best.set(id(from.x, from.y, d), 0);
    open.push({ x: from.x, y: from.y, d, cost: 0, first: true });
  }

  let goal = null;
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i += 1) if (open[i].cost < open[bi].cost) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur.cost > best.get(id(cur.x, cur.y, cur.d))) continue;
    if (cur.x === to.x && cur.y === to.y) {
      goal = cur;
      break;
    }
    for (let nd = 0; nd < 4; nd += 1) {
      const nx = cur.x + DIRS[nd][0];
      const ny = cur.y + DIRS[nd][1];
      if (!isWalkable(nx, ny)) continue;
      const cost = cur.cost + STEP + (!cur.first && nd !== cur.d ? TURN : 0);
      const nid = id(nx, ny, nd);
      if (best.has(nid) && best.get(nid) <= cost) continue;
      best.set(nid, cost);
      prev.set(nid, { x: cur.x, y: cur.y, d: cur.d, first: cur.first });
      open.push({ x: nx, y: ny, d: nd, cost, first: false });
    }
  }
  if (!goal) return null;

  const path = [];
  let node = { x: goal.x, y: goal.y, d: goal.d, first: false };
  while (!node.first) {
    path.unshift({ x: node.x, y: node.y });
    node = prev.get(id(node.x, node.y, node.d));
  }
  return path;
}

export function randomSpawn() {
  const spots = [[8, 9], [9, 9], [10, 9], [9, 10], [10, 10], [8, 10], [9, 7], [10, 7]];
  return spots[Math.floor(Math.random() * spots.length)];
}