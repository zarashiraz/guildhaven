
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

const LINE_GOAL = 1.5;
const TRAIN_GOAL = 1.0;
const STEPS = 20;
const LEARNING_RATES = [0.001, 0.01, 0.05, 0.1, 0.3, 0.6, 1, 1.9];
const BEST = bestDegree();

const HINTS = {
  1: 'The plants grow taller with more sunlight, so the line must slope upward. Try a slope around 2 and an intercept (the height at zero sunlight) around 3, then fine-tune.',
  2: 'Each step moves the line downhill by (learning rate × slope of the error). Tiny steps barely move in 20 steps. Huge steps jump over the bottom and land higher on the other side. Look for a middle value.',
  3: 'Training error always keeps falling as the model gets more flexible. Test error is the honest score. Try several degrees and compare the test error, then pick the degree where it is lowest.',
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const card = 'border-[3px] border-[#B4BCA5] bg-[#FAF9F2] p-4 sm:p-6';
const heading = 'font-display text-xl font-bold text-[#536B59]';
const muted = 'text-sm leading-relaxed text-[#777A6E]';
const tableHead = 'border-b-2 border-[#BCC9B8] bg-[#E9EEE4] px-3 py-2 text-left text-[#566E5C]';
const tableCell = 'border-b border-[#DDE4D8] px-3 py-2 text-[#606B61]';

function PlantArt() {
  return (
    <svg
      viewBox="0 0 120 120"
      width="120"
      height="120"
      aria-hidden="true"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect x="52" y="36" width="12" height="54" fill="#72977C" />
      <rect x="40" y="26" width="12" height="20" fill="#8CAF94" />
      <rect x="28" y="34" width="12" height="12" fill="#8CAF94" />
      <rect x="64" y="42" width="20" height="12" fill="#91B99B" />
      <rect x="84" y="34" width="12" height="12" fill="#91B99B" />
      <rect x="40" y="56" width="12" height="12" fill="#A6C7A6" />
      <rect x="28" y="48" width="12" height="12" fill="#A6C7A6" />
      <rect x="64" y="62" width="12" height="12" fill="#85AB8F" />
      <rect x="76" y="54" width="12" height="12" fill="#85AB8F" />
      <rect x="36" y="82" width="44" height="10" fill="#C99585" />
      <rect x="42" y="92" width="32" height="17" fill="#DBAD99" />
      <rect x="48" y="109" width="20" height="5" fill="#BB8579" />
      <rect x="18" y="18" width="6" height="6" fill="#D7BE81" />
      <rect x="94" y="18" width="6" height="6" fill="#D7BE81" />
      <rect x="101" y="74" width="5" height="5" fill="#C7A5B8" />
    </svg>
  );
}

function ChartShell({ title, children }) {
  return (
    <div className="border-2 border-[#C8D1BF] bg-[#F4F5ED] p-3">
      <div className="mb-3 flex items-center justify-between border-b border-[#D4DCCF] pb-2">
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#849381]">
          {title}
        </span>
        <span className="font-mono text-[10px] text-[#9BA798]">
          FIELD DATA
        </span>
      </div>
      {children}
    </div>
  );
}

function LineChart({ m, c }) {
  const sx = (h) => 50 + (h / 10) * 340;
  const sy = (y) => 220 - (y / 30) * 200;

  return (
    <ChartShell title="Sunlight / Growth">
      <svg
        viewBox="0 0 420 250"
        className="w-full"
        aria-hidden="true"
      >
        {[60, 100, 140, 180].map((v) => (
          <line key={v} x1="50" y1={v} x2="400" y2={v}
            stroke="#DFE5DA" strokeWidth="1" />
        ))}
        <line x1="50" y1="220" x2="400" y2="220"
          stroke="#87988A" strokeWidth="2" />
        <line x1="50" y1="20" x2="50" y2="220"
          stroke="#87988A" strokeWidth="2" />
        <text x="225" y="245" textAnchor="middle"
          fill="#718073" fontSize="13">Hours of sunlight</text>
        <text x="14" y="120" textAnchor="middle"
          fill="#718073" fontSize="13"
          transform="rotate(-90 14 120)">Height (cm)</text>
        <line
          x1={sx(0)}
          y1={sy(c)}
          x2={sx(10)}
          y2={sy(10 * m + c)}
          stroke="#719B80"
          strokeWidth="4"
        />
        {HOURS.map((h, i) => (
          <circle
            key={h}
            cx={sx(h)}
            cy={sy(HEIGHTS[i])}
            r="6"
            fill="#D5A5AF"
            stroke="#997E87"
            strokeWidth="2"
          />
        ))}
      </svg>
      <p className="mt-1 text-center font-mono text-[11px] text-[#8B9789]">
        Rose dots: observations · Sage line: prediction
      </p>
    </ChartShell>
  );
}

function LossChart({ losses }) {
  const top = 230;
  const sx = (i) => 50 + (i / STEPS) * 340;
  const sy = (l) => 160 - (clamp(l, 0, top) / top) * 140;
  const points = losses.map((l, i) =>
    `${sx(i)},${Number.isFinite(l) ? sy(l) : 20}`
  ).join(' ');

  return (
    <ChartShell title="Training / Error">
      <svg viewBox="0 0 420 190" className="w-full" aria-hidden="true">
        {[55, 90, 125].map((v) => (
          <line key={v} x1="50" y1={v} x2="400" y2={v}
            stroke="#DFE5DA" strokeWidth="1" />
        ))}
        <line x1="50" y1="160" x2="400" y2="160"
          stroke="#87988A" strokeWidth="2" />
        <line x1="50" y1="20" x2="50" y2="160"
          stroke="#87988A" strokeWidth="2" />
        <text x="225" y="182" textAnchor="middle"
          fill="#718073" fontSize="13">Training step</text>
        <text x="14" y="90" textAnchor="middle"
          fill="#718073" fontSize="13"
          transform="rotate(-90 14 90)">Error</text>
        <polyline points={points} fill="none"
          stroke="#A68EAE" strokeWidth="4" />
      </svg>
    </ChartShell>
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
    <ChartShell title="Fertilizer / Model Fit">
      <svg viewBox="0 0 420 270" className="w-full" aria-hidden="true">
        {[65, 130, 195].map((v) => (
          <line key={v} x1="50" y1={v} x2="400" y2={v}
            stroke="#DFE5DA" strokeWidth="1" />
        ))}
        <line x1="50" y1="20" x2="50" y2="250"
          stroke="#87988A" strokeWidth="2" />
        <text x="225" y="266" textAnchor="middle"
          fill="#718073" fontSize="13">Fertilizer</text>
        <polyline points={path.join(' ')} fill="none"
          stroke="#719B80" strokeWidth="4" />
        {TRAIN.x.map((x, i) => (
          <circle key={`tr${x}`} cx={sx(x)} cy={sy(TRAIN.y[i])}
            r="6" fill="#D5A5AF" stroke="#997E87"
            strokeWidth="2" />
        ))}
        {TEST.x.map((x, i) => (
          <circle key={`te${x}`} cx={sx(x)} cy={sy(TEST.y[i])}
            r="6" fill="none" stroke="#9A8CB7"
            strokeWidth="3" />
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap justify-center gap-4 text-xs text-[#778678]">
        <span>● Training plants</span>
        <span>○ Test plants</span>
      </div>
    </ChartShell>
  );
}

function SectionHeader({ number, label, title, description }) {
  return (
    <div className="mb-5 border-b-2 border-[#D6DED0] pb-4">
      <div className="flex items-center gap-3">
        <span className="border-2 border-[#A7B9A4] bg-[#E3EBDF] px-2 py-1 font-mono text-xs font-bold text-[#66806B]">
          {number}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#98A295]">
          {label}
        </span>
      </div>
      <h3 className={`${heading} mt-3`}>{title}</h3>
      <p className={`${muted} mt-2`}>{description}</p>
    </div>
  );
}

function GradientGarden({ onComplete }) {
  const [m, setM] = useState(1);
  const [c, setC] = useState(1);
  const [part1Done, setPart1Done] = useState(false);
  const loss = lineLoss(m, c);

  const [rate, setRate] = useState(LEARNING_RATES[0]);
  const [run, setRun] = useState(null);
  const [part2Done, setPart2Done] = useState(false);

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
      [degree]: {
        train: polynomialError(coeffs, TRAIN),
        test: polynomialError(coeffs, TEST),
      },
    }));
    setLockMessage('');
  }

  function lockIn() {
    if (!tried[degree]) {
      setLockMessage('Fit this model first, so you can see its test error.');
    } else if (degree !== BEST) {
      setLockMessage(
        `Degree ${degree} has a test error of ${tried[degree].test.toFixed(2)}, but another degree does better on the test plants. Try the ones you have not fitted yet.`
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
      <div className="space-y-6 text-[#596A5B]">

        {/* BOTANICAL HEADER */}
        <div className="relative overflow-hidden border-[3px] border-[#A8B7A3] bg-[#EAF0E5]">
          <div className="border-b-2 border-[#B8C8B2] bg-[#DCE7D7] px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#718A74]">
            Guildhaven Botanical Research Station
          </div>
          <div className="flex items-center justify-between gap-3 px-5 py-5 sm:px-7">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#91A18C]">
                Field Notebook / Machine Learning
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-[#526F59]">
                The Gradient Garden
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#758675]">
                Study the plants, discover the patterns,
                and teach your model how to grow.
              </p>
            </div>
            <div className="hidden shrink-0 sm:block">
              <PlantArt />
            </div>
          </div>
        </div>

        {/* PART 1 */}
        <section className={card}>
          <SectionHeader
            number="01"
            label="Field Observation"
            title="Fit a line by hand"
            description="Each dot is a plant: how many hours of sunlight it got and how tall it grew. Move the sliders so the green line runs through the dots. The error is the average squared distance between the line and the dots. Lower is better."
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <LineChart m={m} c={c} />

            <div className="space-y-4">
              <div className="border-2 border-[#D0D9CA] bg-[#F0F3EA] p-4">
                <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-widest text-[#8C9A88]">
                  Adjust your model
                </p>

                <label className="block">
                  <span className="text-sm font-bold text-[#617B65]">
                    Slope
                  </span>
                  <span className="ml-2 font-mono text-sm text-[#7D8D7C]">
                    {m.toFixed(1)} cm / hour
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={m}
                    onChange={(e) => changeLine(Number(e.target.value), c)}
                    className="mt-3 w-full accent-[#7A9E81]"
                  />
                </label>

                <label className="mt-5 block">
                  <span className="text-sm font-bold text-[#617B65]">
                    Intercept
                  </span>
                  <span className="ml-2 font-mono text-sm text-[#7D8D7C]">
                    {c.toFixed(1)} cm
                  </span>
                  <p className="mt-1 text-xs text-[#9AA495]">
                    Height with no sunlight
                  </p>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={c}
                    onChange={(e) => changeLine(m, Number(e.target.value))}
                    className="mt-3 w-full accent-[#7A9E81]"
                  />
                </label>
              </div>

              <div
                role="status"
                aria-live="polite"
                className={`border-2 p-4 ${
                  part1Done
                    ? 'border-[#A4C2A8] bg-[#E5F1E4]'
                    : 'border-[#D9C6B1] bg-[#F6F0E5]'
                }`}
              >
                <p className="font-mono text-[11px] uppercase tracking-widest text-[#8A9887]">
                  Model Error
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-[#59775F]">
                  {loss.toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-[#879485]">
                  Goal: {LINE_GOAL} or lower
                </p>
                {part1Done && (
                  <p className="mt-2 font-bold text-[#638B6B]">
                    Close enough! Next experiment unlocked.
                  </p>
                )}
              </div>
            </div>
          </div>

          <details className="mt-5 border-2 border-[#D5DDCF] bg-[#F3F5EF] p-3">
            <summary className="cursor-pointer font-semibold text-[#647B66]">
              View the plant observations
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full max-w-md border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={tableHead}>Hours of sunlight</th>
                    <th className={tableHead}>Height (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map((h, i) => (
                    <tr key={h}>
                      <td className={tableCell}>{h}</td>
                      <td className={tableCell}>{HEIGHTS[i]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>

        {/* PART 2 */}
        {part1Done && (
          <section className={card}>
            <SectionHeader
              number="02"
              label="Learning Experiment"
              title="Let the computer learn"
              description={`Gradient descent starts with a bad line (flat at zero) and takes ${STEPS} small steps downhill on the error. The learning rate is how big each step is. You need to reach an error of ${TRAIN_GOAL} or lower.`}
            />

            <div className="flex flex-wrap items-end gap-4 border-2 border-[#D2D9CD] bg-[#F0F2EA] p-4">
              <label className="block">
                <span className="block text-sm font-bold text-[#617B65]">
                  Learning rate
                </span>
                <select
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="mt-2 min-w-32 border-2 border-[#AEBEA9] bg-[#FFFEF9] p-2 text-[#536B59]"
                >
                  {LEARNING_RATES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              <Button onClick={train}>
                Train for {STEPS} steps
              </Button>
            </div>

            <div className="mt-5" role="status" aria-live="polite">
              {run && (
                <div className="grid gap-5 lg:grid-cols-2">
                  <LossChart losses={run.losses} />
                  <div className="border-2 border-[#D4DCCF] bg-[#F4F5EF] p-4">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-[#8B9A89]">
                      Training Report
                    </p>
                    <h4 className="mt-3 font-display text-lg font-bold text-[#617663]">
                      Learning rate: {run.rate}
                    </h4>
                    <p className="mt-2 text-sm text-[#718172]">
                      Final error:{' '}
                      <strong>
                        {run.diverged
                          ? 'exploded'
                          : `${run.final.toFixed(2)} after ${STEPS} steps`}
                      </strong>
                    </p>

                    {run.diverged && (
                      <p className="mt-4 border-l-4 border-[#CB9D9F] bg-[#F5E8E6] p-3 text-sm text-[#9B686B]">
                        The steps were too big. Each one jumped over the bottom and landed higher on the other side, so the error grew.
                      </p>
                    )}

                    {!run.diverged && run.final > TRAIN_GOAL &&
                      run.final > run.losses[0] * 0.5 && (
                        <p className="mt-4 border-l-4 border-[#CB9D9F] bg-[#F5E8E6] p-3 text-sm text-[#9B686B]">
                          Barely moved. The steps were too small to get near the bottom in {STEPS} steps.
                        </p>
                      )}

                    {!run.diverged && run.final > TRAIN_GOAL &&
                      run.final <= run.losses[0] * 0.5 && (
                        <p className="mt-4 border-l-4 border-[#D3BE91] bg-[#F7F1E3] p-3 text-sm text-[#947C50]">
                          Getting there, but still learning when the {STEPS} steps ran out. Take bigger steps.
                        </p>
                      )}

                    {run.final <= TRAIN_GOAL && (
                      <p className="mt-4 border-l-4 border-[#9CBD9F] bg-[#E6F0E4] p-3 text-sm font-semibold text-[#63896B]">
                        Converged! The error reached the bottom of the valley within {STEPS} steps.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* PART 3 */}
        {part2Done && (
          <section className={card}>
            <SectionHeader
              number="03"
              label="Model Selection"
              title="How curvy should the model be?"
              description="Now the relationship is curved. Filled dots are training plants (the model learns from these). Hollow dots are test plants (the model never sees them). Fit different degrees (1 is a straight line, 9 is very wiggly) and pick the one that does best on the test plants."
            />

            <div className="grid gap-5 lg:grid-cols-2">
              <CurveChart coeffs={currentCoeffs} />

              <div className="space-y-4">
                <div className="border-2 border-[#D0D9CA] bg-[#F0F3EA] p-4">
                  <label className="block">
                    <span className="font-semibold text-[#617B65]">
                      Model degree
                    </span>
                    <span className="ml-2 font-mono text-lg font-bold text-[#617B65]">
                      {degree}
                    </span>
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
                      className="mt-3 w-full accent-[#7A9E81]"
                    />
                    <span className="mt-1 flex justify-between text-xs text-[#96A293]">
                      <span>Straight</span>
                      <span>Very curvy</span>
                    </span>
                  </label>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button onClick={fitModel}>
                      Fit degree {degree}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={lockIn}
                      disabled={won}
                    >
                      Lock in degree {degree}
                    </Button>
                  </div>

                  <p
                    role="status"
                    aria-live="polite"
                    className="mt-3 text-sm font-semibold text-[#A57679]"
                  >
                    {lockMessage}
                  </p>
                </div>

                <div className="overflow-x-auto border-2 border-[#D0D9CA] bg-[#FFFEF9]">
                  <table className="w-full border-collapse text-left text-sm">
                    <caption className="bg-[#E7EEE4] px-3 py-3 text-left font-semibold text-[#607662]">
                      Models you've fitted
                      <span className="block text-xs font-normal text-[#889787]">
                        Lower error is better
                      </span>
                    </caption>
                    <thead>
                      <tr>
                        <th className={tableHead}>Degree</th>
                        <th className={tableHead}>Training error</th>
                        <th className={tableHead}>Test error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(tried)
                        .map(Number)
                        .sort((a, b) => a - b)
                        .map((d) => (
                          <tr key={d}>
                            <td className={tableCell}>{d}</td>
                            <td className={tableCell}>
                              {tried[d].train.toFixed(2)}
                            </td>
                            <td className={tableCell}>
                              {tried[d].test.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {won && (
              <div className="mt-5 border-l-4 border-[#93B79A] bg-[#E6F0E4] p-4 text-sm leading-relaxed text-[#587A60]">
                <strong>Research complete.</strong> Training error keeps dropping as the model gets curvier, but test error is lowest at degree {BEST}. Very curvy models memorise the noise in the training plants and fail on new ones. That is overfitting.
              </div>
            )}
          </section>
        )}
      </div>
    </GameFrame>
  );
}

export default GradientGarden;
