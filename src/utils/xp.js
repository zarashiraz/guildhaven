const XP_PER_LEVEL = 200;

export function getLevelInfo(xp) {
  return {
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    xpIntoLevel: xp % XP_PER_LEVEL,
    xpForNext: XP_PER_LEVEL,
  };
}