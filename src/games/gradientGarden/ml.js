// The math behind "The Gradient Garden". The data is made up for the game.

// Part 1 and 2: hours of sunlight vs plant height (cm).
export const HOURS = [0.5, 1, 2, 2.5, 3.5, 4, 5, 6, 6.5, 7.5, 8.5, 9.5];
export const HEIGHTS = [4.9, 4.1, 7.8, 9.8, 10, 12, 12.5, 17.1, 17, 20.6, 20.8, 24.4];

// The best possible straight line has an error of about 0.80.
export const BEST_LINE_LOSS = 0.8;

// Average squared error of the line height = m * hours + c.
export function lineLoss(m, c) {
  const total = HOURS.reduce((sum, h, i) => sum + (m * h + c - HEIGHTS[i]) ** 2, 0);
  return total / HOURS.length;
}

// Gradient descent on the same data. The sunlight hours are rescaled to (hours - 5) / 3
// so the numbers stay small (a standard trick). Starts at w = 0, b = 0.
export function trainLine(learningRate, steps) {
  const xs = HOURS.map((h) => (h - 5) / 3);
  const n = xs.length;
  const loss = (w, b) => xs.reduce((s, x, i) => s + (w * x + b - HEIGHTS[i]) ** 2, 0) / n;

  let w = 0;
  let b = 0;
  const losses = [loss(w, b)];
  let diverged = false;

  for (let t = 0; t < steps; t += 1) {
    let gw = 0;
    let gb = 0;
    xs.forEach((x, i) => {
      const err = w * x + b - HEIGHTS[i];
      gw += (2 * err * x) / n;
      gb += (2 * err) / n;
    });
    w -= learningRate * gw;
    b -= learningRate * gb;
    const l = loss(w, b);
    if (!Number.isFinite(l) || l > 1e6) {
      diverged = true;
      losses.push(Infinity);
      break;
    }
    losses.push(l);
  }
  return { losses, w, b, diverged, final: losses[losses.length - 1] };
}

// Part 3: a curved relationship. 10 training plants and 10 different test plants.
// x is the (rescaled) amount of fertilizer, y is the plant height.
export const TRAIN = {
  x: [-0.9, -0.7, -0.5, -0.3, -0.1, 0.1, 0.3, 0.5, 0.7, 0.9],
  y: [-3.59, -2.56, -0.1, 0.44, 2.26, 1.81, 2.84, 1.95, 2.64, 1.06],
};
export const TEST = {
  x: [-0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1],
  y: [-3.26, -0.84, -0.04, 1.59, 1.55, 2.69, 2.21, 2.66, 1.59, 1.4],
};

// Solves A * x = B (Gaussian elimination with partial pivoting).
function solve(A, B) {
  const m = A.length;
  const M = A.map((row, i) => [...row, B[i]]);
  for (let c = 0; c < m; c += 1) {
    let p = c;
    for (let r = c + 1; r < m; r += 1) {
      if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    }
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < m; r += 1) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= m; k += 1) M[r][k] -= f * M[c][k];
    }
  }
  const x = Array(m).fill(0);
  for (let r = m - 1; r >= 0; r -= 1) {
    let s = M[r][m];
    for (let k = r + 1; k < m; k += 1) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}

// Least-squares polynomial of the given degree, fitted to the TRAINING plants only.
export function fitPolynomial(degree) {
  const m = degree + 1;
  const A = Array.from({ length: m }, () => Array(m).fill(0));
  const B = Array(m).fill(0);
  TRAIN.x.forEach((x, i) => {
    for (let r = 0; r < m; r += 1) {
      B[r] += TRAIN.y[i] * x ** r;
      for (let c = 0; c < m; c += 1) A[r][c] += x ** (r + c);
    }
  });
  return solve(A, B);
}

export function evaluatePolynomial(coeffs, x) {
  return coeffs.reduce((sum, k, i) => sum + k * x ** i, 0);
}

export function polynomialError(coeffs, data) {
  const total = data.x.reduce((s, x, i) => s + (evaluatePolynomial(coeffs, x) - data.y[i]) ** 2, 0);
  return total / data.x.length;
}

// The degree (1 to 9) with the lowest error on the TEST plants.
export function bestDegree() {
  let best = 1;
  let bestError = Infinity;
  for (let d = 1; d <= 9; d += 1) {
    const e = polynomialError(fitPolynomial(d), TEST);
    if (e < bestError) {
      bestError = e;
      best = d;
    }
  }
  return best;
}