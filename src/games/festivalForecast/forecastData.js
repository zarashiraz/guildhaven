// Numbers and maths for "The Festival Forecast". No React in here.

export const BUDGET = 1000;
export const STEP = 50;
export const GOAL_TICKETS = 264; // about 95% of the best possible (277.5)

// Each channel sells tickets = power * sqrt(dollars). Each extra dollar helps a bit less.
export const CHANNELS = [
  { id: 'posters', name: 'Posters', power: 2, note: 'Cheap, but only people walking past see them.' },
  { id: 'social', name: 'Social media', power: 8, note: 'Reaches lots of villagers.' },
  { id: 'radio', name: 'Village radio', power: 3, note: 'Steady, middle of the road.' },
];

export const START_SPEND = { posters: 350, social: 300, radio: 350 };

export function ticketsFor(channel, dollars) {
  return channel.power * Math.sqrt(dollars);
}

export function totalTickets(spend) {
  return CHANNELS.reduce((sum, c) => sum + ticketsFor(c, spend[c.id]), 0);
}

// What the next $50 would add in one channel
export function nextStepGain(channel, dollars) {
  return ticketsFor(channel, dollars + STEP) - ticketsFor(channel, dollars);
}

// Weekly ticket sales for the last 12 weeks
export const SALES = [118, 125, 142, 141, 168, 170, 185, 201, 203, 226, 231, 250];
export const BACKTEST_START = 6; // we test the method on weeks 7 to 12 (index 6 to 11)
export const GOAL_MISS = 8; // average miss must be at most this many tickets

export const METHODS = [
  { id: 'last', name: 'Same as last week', usesN: false },
  { id: 'average', name: 'Average of the last N weeks', usesN: true },
  { id: 'trend', name: 'Straight-line trend of the last N weeks', usesN: true },
];

export function forecastNext(method, n, history) {
  if (method === 'last') return history[history.length - 1];
  const window = history.slice(-n);
  const mean = window.reduce((a, b) => a + b, 0) / window.length;
  if (method === 'average') return mean;
  // trend: fit a straight line through the window and extend it by one week
  const mid = (window.length - 1) / 2;
  let top = 0;
  let bottom = 0;
  window.forEach((value, i) => {
    top += (i - mid) * (value - mean);
    bottom += (i - mid) ** 2;
  });
  const slope = bottom === 0 ? 0 : top / bottom;
  return mean + slope * (window.length - mid);
}

// Pretend we only knew the weeks before each test week, forecast it, and compare to what really happened.
export function backtest(method, n) {
  const rows = [];
  for (let t = BACKTEST_START; t < SALES.length; t += 1) {
    const predicted = forecastNext(method, n, SALES.slice(0, t));
    rows.push({ week: t + 1, actual: SALES[t], predicted, miss: Math.abs(predicted - SALES[t]) });
  }
  const mae = rows.reduce((sum, r) => sum + r.miss, 0) / rows.length;
  return { rows, mae };
}