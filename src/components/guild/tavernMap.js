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

export function randomSpawn() {
  const spots = [[8, 9], [9, 9], [10, 9], [9, 10], [10, 10], [8, 10], [9, 7], [10, 7]];
  return spots[Math.floor(Math.random() * spots.length)];
}