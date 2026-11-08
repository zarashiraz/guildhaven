import { useState } from 'react';
import Button from '../../components/ui/Button';
import GameFrame from '../../components/games/GameFrame';
import {
  HOURS,
  HEIGHTS,
  TRAIN,
  TEST,
  lineLoss,
  trainLine,
  fitPolynomial,
  evaluatePolynomial,
  polynomialError,
  bestDegree,
} from './ml';

const LINE_GOAL = 1.5; // Part 1: be this close (average squared error) to win
const TRAIN_GOAL = 1.0; // Part 2: reach this error in 20 steps
const STEPS = 20;
const LEARNING_RATES = [0.001, 0.01, 0.05, 0.1, 0.3, 0.6, 1, 1.9];
const BEST = bestDegree();

const HINTS = {
  1: 'The plants grow taller with more sunlight, so the line must slope upward. Try a slope around 2 and an intercept (the height at zero sunlight) around 3, then fine-tune.',
  2: 'Each step moves the line downhill by (learning rate × slope of the error). Tiny steps barely move in 20 steps. Huge steps jump over the bottom and land higher on the other side. Look for a middle value.',
  3: 'Training error always keeps falling as the model gets more flexible. Test error is the honest score. Try several degrees and compare the test error, then pick the degree where it is lowest.',
};

// Small helpers for drawing charts with SVG.
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function LineChart({ m, c }) {
  const sx = (h) => 50 + (h / 10) * 340;
  const sy = (y) => 220 - (y / 30) * 200;
  return (
    <svg viewBox="0 0 420 250" className="w-full max-w-xl rounded-sm border-4 border-bark bg-cream" aria-hidden="true">
      <line x1="50" y1="220" x2="400" y2="220" className="stroke-bark" strokeWidth="2" />
      <line x1="50" y1="20" x2="50" y2="220" className="stroke-bark" strokeWidth="2" />
      <text x="225" y="245" textAnchor="middle" className="fill-bark" fontSize="13">Hours of sunlight</text>
      <text x="14" y="120" textAnchor="middle" className="fill-bark" fontSize="13" transform="rotate(-90 14 120)">Height (cm)</text>
      <line x1={sx(0)} y1={sy(c)} x2={sx(10)} y2={sy(10 * m + c)} className="stroke-forest" strokeWidth="4" />
      {HOURS.map((h, i) => (
        <circle key={h} cx={sx(h)} cy={sy(HEIGHTS[i])} r="6" className="fill-rose stroke-bark" strokeWidth="2" />
      ))}
    </svg>
  );
}

function LossChart({ losses }) {
  const top = 230;
  const sx = (i) => 50 + (i / STEPS) * 340;
  const sy = (l) => 160 - (clamp(l, 0, top) / top) * 140;
  const points = losses.map((l, i) => `${sx(i)},${Number.isFinite(l) ? sy(l) : 20}`).join(' ');
  return (
    <svg viewBox="0 0 420 190" className="w-full max-w-xl rounded-sm border-4 border-bark bg-cream" aria-hidden="true">
      <line x1="50" y1="160" x2="400" y2="160" className="stroke-bark" strokeWidth="2" />
      <line x1="50" y1="20" x2="50" y2="160" className="stroke-bark" strokeWidth="2" />
      <text x="225" y="182" textAnchor="middle" className="fill-bark" fontSize="13">Training step</text>
      <text x="14" y="90" textAnchor="middle" className="fill-bark" fontSize="13" transform="rotate(-90 14 90)">Error</text>
      <polyline points={points} fill="none" className="stroke-plum" strokeWidth="4" />
    </svg>
  );
}

function CurveChart({ coeffs }) {
  const sx = (x) => 50 + ((x + 1) / 2) * 340;
  const sy = (y) => 130 - (clamp(y, -6, 6) / 6) * 105;
  const path = [];
  for (let x = -1; x <= 1.0001; x += 0.02) {
    path.push(`${sx(x)},${sy(evaluatePolynomial(coeffs, x))}`);
  }
  return (
    <svg viewBox="0 0 420 270" className="w-full max-w-xl rounded-sm border-4 border-bark bg-cream" aria-hidden="true">
      <line x1="50" y1="130" x2="400" y2="130" className="stroke-wood" strokeWidth="1" />
      <line x1="50" y1="20" x2="50" y2="250" className="stroke-bark" strokeWidth="2" />
      <text x="225" y="266" textAnchor="middle" className="fill-bark" fontSize="13">Fertilizer</text>
      <polyline points={path.join(' ')} fill="none" className="stroke-forest" strokeWidth="4" />
      {TRAIN.x.map((x, i) => (
        <circle key={`tr${x}`} cx={sx(x)} cy={sy(TRAIN.y[i])} r="6" className="fill-rose stroke-bark" strokeWidth="2" />
      ))}
      {TEST.x.map((x, i) => (
        <circle key={`te${x}`} cx={sx(x)} cy={sy(TEST.y[i])} r="6" fill="none" className="stroke-dusk" strokeWidth="3" />
      ))}
    </svg>
  );
}

function GradientGarden({ onComplete }) {
  // Part 1: fit a line by hand
  const [m, setM] = useState(1);
  const [c, setC] = useState(1);
  const [part1Done, setPart1Done] = useState(false);
  const loss = lineLoss(m, c);

  // Part 2: gradient descent
  const [rate, setRate] = useState(LEARNING_RATES[0]);
  const [run, setRun] = useState(null);
  const [part2Done, setPart2Done] = useState(false);

  // Part 3: overfitting
  const [degree, setDegree] = useState(1);
  const [tried, setTried] = useState({});
  const [lockMessage, setLockMessage] = useState('');
  const [won, setWon] = useState(false);

  function changeLine(nextM, nextC) {
    setM(nextM);
    setC(nextC);
    if (lineLoss(nextM, nextC) <= LINE_GOAL) setPart1Done(true);
  }

  function train() {
    const result = trainLine(rate, STEPS);
    setRun({ ...result, rate });
    if (result.final <= TRAIN_GOAL) setPart2Done(true);
  }

  function fitModel() {
    const coeffs = fitPolynomial(degree);
    setTried((t) => ({
      ...t,
      [degree]: { train: polynomialError(coeffs, TRAIN), test: polynomialError(coeffs, TEST) },
    }));
    setLockMessage('');
  }

  function lockIn() {
    if (!tried[degree]) {
      setLockMessage('Fit this model first, so you can see its test error.');
    } else if (degree !== BEST) {
      setLockMessage(
        `Degree ${degree} has a test error of ${tried[degree].test.toFixed(2)}, but another degree does better on the test plants. Try the ones you have not fitted yet.`,
      );
    } else {
      setLockMessage('');
      setWon(true);
    }
  }

  const currentCoeffs = fitPolynomial(degree);
  const part = !part1Done ? 1 : !part2Done ? 2 : 3;

  return (
    <GameFrame
      title="The Gradient Garden"
      howToPlay={[
        'Part 1: draw the best straight line through the plant data by hand, using two sliders.',
        'Part 2: let the computer find the line itself with gradient descent. You choose the learning rate (the size of each step).',
        'Part 3: pick how curvy the model should be. Too simple misses the pattern, too curvy memorises noise (overfitting).',
        'Each part unlocks the next.',
      ]}
      hint={HINTS[part]}
      won={won}
      winMessage="You fitted a line by hand, tuned gradient descent, and avoided overfitting by judging on test data. That is the core loop of machine learning."
      onComplete={onComplete}
    >
      {/* PART 1 */}
      <div className="rounded-sm border-4 border-wood bg-parchment p-4">
        <h3 className="font-display text-xl font-bold text-bark">Part 1: Fit a line by hand</h3>
        <p className="mt-1">
          Each dot is a plant: how many hours of sunlight it got and how tall it grew. Move the sliders so the green line
          runs through the dots. The error is the average squared distance between the line and the dots. Lower is better.
        </p>

        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <LineChart m={m} c={c} />
          <div className="space-y-3">
            <label className="block">
              <span className="font-bold">Slope: {m.toFixed(1)} cm per hour of sunlight</span>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={m}
                onChange={(e) => changeLine(Number(e.target.value), c)}
                className="mt-1 w-full accent-forest"
              />
            </label>
            <label className="block">
              <span className="font-bold">Intercept: {c.toFixed(1)} cm (height with no sunlight)</span>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={c}
                onChange={(e) => changeLine(m, Number(e.target.value))}
                className="mt-1 w-full accent-forest"
              />
            </label>
            <p className="font-display text-lg font-bold text-bark" role="status" aria-live="polite">
              Error: {loss.toFixed(2)} (goal: {LINE_GOAL} or lower)
              {part1Done && <span className="text-forest"> ✓ Close enough!</span>}
            </p>
          </div>
        </div>

        <details className="mt-3">
          <summary className="cursor-pointer font-bold">Show the plant data as a table</summary>
          <table className="mt-2 w-full max-w-md border-collapse text-left">
            <thead>
              <tr>
                <th className="border-b-4 border-wood p-2">Hours of sunlight</th>
                <th className="border-b-4 border-wood p-2">Height (cm)</th>
              </tr>
            </thead>
            <tbody>
              {HOURS.map((h, i) => (
                <tr key={h}>
                  <td className="border-b-2 border-wood/40 p-2">{h}</td>
                  <td className="border-b-2 border-wood/40 p-2">{HEIGHTS[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>

      {/* PART 2 */}
      {part1Done && (
        <div className="rounded-sm border-4 border-wood bg-parchment p-4">
          <h3 className="font-display text-xl font-bold text-bark">Part 2: Let the computer learn</h3>
          <p className="mt-1">
            Gradient descent starts with a bad line (flat at zero) and takes {STEPS} small steps downhill on the error.
            The learning rate is how big each step is. You need to reach an error of {TRAIN_GOAL} or lower.
          </p>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="font-bold">Learning rate</span>
              <select
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="mt-1 block rounded-sm border-4 border-bark bg-cream p-2"
              >
                {LEARNING_RATES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
            <Button onClick={train}>Train for {STEPS} steps</Button>
          </div>

          <div className="mt-3" role="status" aria-live="polite">
            {run && (
              <div className="grid gap-3 lg:grid-cols-2">
                <LossChart losses={run.losses} />
                <div>
                  <p className="font-display text-lg font-bold text-bark">
                    Learning rate {run.rate}: error {run.diverged ? 'exploded' : `${run.final.toFixed(2)} after ${STEPS} steps`}.
                  </p>
                  {run.diverged && (
                    <p className="mt-1 font-bold text-coral">
                      ✗ The steps were too big. Each one jumped over the bottom and landed higher on the other side, so the error grew.
                    </p>
                  )}
                  {!run.diverged && run.final > TRAIN_GOAL && run.final > run.losses[0] * 0.5 && (
                    <p className="mt-1 font-bold text-coral">
                      ✗ Barely moved. The steps were too small to get near the bottom in {STEPS} steps.
                    </p>
                  )}
                  {!run.diverged && run.final > TRAIN_GOAL && run.final <= run.losses[0] * 0.5 && (
                    <p className="mt-1 font-bold text-coral">
                      ✗ Getting there, but still learning when the {STEPS} steps ran out. Take bigger steps.
                    </p>
                  )}
                  {run.final <= TRAIN_GOAL && (
                    <p className="mt-1 font-bold text-forest">
                      ✓ Converged! The error reached the bottom of the valley within {STEPS} steps.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PART 3 */}
      {part2Done && (
        <div className="rounded-sm border-4 border-wood bg-parchment p-4">
          <h3 className="font-display text-xl font-bold text-bark">Part 3: How curvy should the model be?</h3>
          <p className="mt-1">
            Now the relationship is curved. Filled dots are training plants (the model learns from these). Hollow dots
            are test plants (the model never sees them). Fit different degrees (1 is a straight line, 9 is very wiggly)
            and pick the one that does best on the test plants.
          </p>

          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <CurveChart coeffs={currentCoeffs} />
            <div>
              <label className="block">
                <span className="font-bold">Degree: {degree}</span>
                <input
                  type="range"
                  min="1"
                  max="9"
                  step="1"
                  value={degree}
                  onChange={(e) => {
                    setDegree(Number(e.target.value));
                    setLockMessage('');
                  }}
                  className="mt-1 w-full accent-forest"
                />
              </label>
              <div className="mt-2 flex flex-wrap gap-3">
                <Button onClick={fitModel}>Fit degree {degree}</Button>
                <Button variant="secondary" onClick={lockIn} disabled={won}>
                  Lock in degree {degree}
                </Button>
              </div>
              <p role="status" aria-live="polite" className="mt-2 font-bold text-coral">
                {lockMessage}
              </p>

              <table className="mt-2 w-full border-collapse text-left">
                <caption className="pb-1 text-left font-bold">Models you have fitted (error, lower is better)</caption>
                <thead>
                  <tr>
                    <th className="border-b-4 border-wood p-2">Degree</th>
                    <th className="border-b-4 border-wood p-2">Training error</th>
                    <th className="border-b-4 border-wood p-2">Test error</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(tried)
                    .map(Number)
                    .sort((a, b) => a - b)
                    .map((d) => (
                      <tr key={d}>
                        <td className="border-b-2 border-wood/40 p-2">{d}</td>
                        <td className="border-b-2 border-wood/40 p-2">{tried[d].train.toFixed(2)}</td>
                        <td className="border-b-2 border-wood/40 p-2">{tried[d].test.toFixed(2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {won && (
            <p className="mt-3 font-bold text-forest">
              ✓ Training error keeps dropping as the model gets curvier, but test error is lowest at degree {BEST}. Very
              curvy models memorise the noise in the training plants and fail on new ones. That is overfitting.
            </p>
          )}
        </div>
      )}
    </GameFrame>
  );
}

export default GradientGarden;