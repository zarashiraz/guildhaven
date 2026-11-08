// Statistics for "The Potion Trials". No React in here.

// Error function (Abramowitz and Stegun), good enough for a game
function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const poly = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  return sign * (1 - poly * Math.exp(-ax * ax));
}

export function normalCdf(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

// Two-proportion z-test: did potion B really cure a different share than potion A?
export function twoProportion(curedA, sizeA, curedB, sizeB) {
  const rateA = curedA / sizeA;
  const rateB = curedB / sizeB;
  const pooled = (curedA + curedB) / (sizeA + sizeB);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / sizeA + 1 / sizeB));
  const z = (rateB - rateA) / se;
  const p = 2 * (1 - normalCdf(Math.abs(z)));
  const smallestExpected = Math.min(sizeA * pooled, sizeA * (1 - pooled), sizeB * pooled, sizeB * (1 - pooled));
  return { rateA, rateB, pooled, se, z, p, smallestExpected };
}

export const LEVELS = [
  { id: '90', label: '90% sure', alpha: 0.1 },
  { id: '95', label: '95% sure', alpha: 0.05 },
  { id: '99', label: '99% sure', alpha: 0.01 },
];

export const TRIALS = [
  {
    id: 't1',
    name: 'Trial 1: The Garden Gnome Test',
    story: 'Potion A is the old recipe, Potion B is the new one. How many sick gnomes got better?',
    curedA: 48,
    sizeA: 100,
    curedB: 61,
    sizeB: 100,
  },
  {
    id: 't2',
    name: 'Trial 2: The Big Village Test',
    story: 'The whole village joined in. A thousand villagers tried each potion.',
    curedA: 480,
    sizeA: 1000,
    curedB: 530,
    sizeB: 1000,
  },
  {
    id: 't3',
    name: 'Trial 3: The Dragon Test',
    story: 'Only five dragons were brave enough to try each potion.',
    curedA: 4,
    sizeA: 5,
    curedB: 2,
    sizeB: 5,
  },
];

export const VERDICTS = [
  { id: 'real', label: 'Real difference' },
  { id: 'luck', label: 'Could just be luck' },
  { id: 'notenough', label: 'Not enough data to tell' },
];

// The right verdict depends on how sure the player decided to be BEFORE seeing the trials
export function correctVerdict(stats, alpha) {
  if (stats.smallestExpected < 5) return 'notenough';
  return stats.p < alpha ? 'real' : 'luck';
}