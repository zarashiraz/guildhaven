import { useState } from 'react';
import Button from '../../components/ui/Button';
import GameFrame from '../../components/games/GameFrame';
import { LEVELS, TRIALS, VERDICTS, twoProportion, correctVerdict } from './stats';

const r3 = (n) => n.toFixed(3);
const r4 = (n) => n.toFixed(4);

function pythonLines(t, s) {
  return [
    `a_rate = ${t.curedA} / ${t.sizeA}                      # ${r3(s.rateA)}`,
    `b_rate = ${t.curedB} / ${t.sizeB}                      # ${r3(s.rateB)}`,
    `pooled = (${t.curedA} + ${t.curedB}) / (${t.sizeA} + ${t.sizeB})        # ${r3(s.pooled)}`,
    `se = sqrt(pooled * (1 - pooled) * (1/${t.sizeA} + 1/${t.sizeB}))   # ${r4(s.se)}`,
    `z = (b_rate - a_rate) / se                 # ${r3(s.z)}`,
    `p_value = 2 * (1 - normal_cdf(abs(z)))     # ${r4(s.p)}`,
    `smallest_expected = ${s.smallestExpected.toFixed(1)}                 # needs to be 5 or more`,
  ];
}

function PotionTrials({ onComplete }) {
  const [levelId, setLevelId] = useState('95');
  const [locked, setLocked] = useState(false);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState('');
  const [feedback, setFeedback] = useState(null); // { ok, text }
  const [won, setWon] = useState(false);

  const level = LEVELS.find((l) => l.id === levelId);
  const trial = TRIALS[index];
  const stats = twoProportion(trial.curedA, trial.sizeA, trial.curedB, trial.sizeB);
  const isLast = index === TRIALS.length - 1;

  function submit() {
    if (!choice) {
      setFeedback({ ok: false, text: 'Pick a verdict first.' });
      return;
    }
    const right = correctVerdict(stats, level.alpha);
    if (choice === right) {
      let why;
      if (right === 'notenough') {
        why = `Only ${stats.smallestExpected.toFixed(1)} cures are expected in the smallest group. With fewer than 5, the p-value cannot be trusted.`;
      } else if (right === 'real') {
        why = `The p-value ${r4(stats.p)} is below ${level.alpha}. A gap this big would be rare by luck alone.`;
      } else {
        why = `The p-value ${r4(stats.p)} is not below ${level.alpha}. A gap this big happens by luck often enough.`;
      }
      setFeedback({ ok: true, text: `Correct. ${why}` });
      if (isLast) setWon(true);
    } else {
      setFeedback({
        ok: false,
        text: `Not quite. Check small groups first (smallest expected under 5 means "not enough data"). Otherwise compare the p-value ${r4(stats.p)} with your cutoff of ${level.alpha}: below it means real, above it means could be luck.`,
      });
    }
  }

  function nextTrial() {
    setIndex((i) => i + 1);
    setChoice('');
    setFeedback(null);
  }

  return (
    <GameFrame
      title="The Potion Trials"
      howToPlay={[
        'First choose how sure you need to be before you call a result real. You pick this before seeing any data, and then it is locked.',
        'Then look at three potion trials. The code panel shows how the numbers were worked out.',
        'The p-value is the chance of seeing a gap this big if the two potions were actually identical.',
        'Give a verdict for each trial: real difference, could just be luck, or not enough data to tell.',
      ]}
      hint="Step 1: is the smallest expected number 5 or more? If not, say not enough data. Step 2: if p_value is lower than your cutoff (1 minus your sureness, so 0.05 for 95%), call it real. Otherwise it could be luck."
      won={won}
      winMessage="You set your cutoff before seeing the data and ran a real two-proportion z-test, including the small-sample check."
      onComplete={onComplete}
    >
      {!locked && (
        <div className="rounded-sm border-4 border-wood bg-parchment p-4">
          <h3 className="font-display text-xl font-bold text-bark">Step 1: How sure do you need to be?</h3>
          <p className="mt-1">
            A surer cutoff avoids false alarms but misses small real effects. A looser cutoff catches more real effects but
            raises more false alarms. Choose before you see any data.
          </p>
          <fieldset className="mt-3">
            <legend className="font-bold">Confidence level</legend>
            {LEVELS.map((l) => (
              <label key={l.id} className="mt-1 flex items-center gap-2">
                <input
                  type="radio"
                  name="level"
                  value={l.id}
                  checked={levelId === l.id}
                  onChange={() => setLevelId(l.id)}
                />
                {l.label} (call it real only if p_value is below {l.alpha})
              </label>
            ))}
          </fieldset>
          <Button className="mt-3" onClick={() => setLocked(true)}>
            Lock it in
          </Button>
        </div>
      )}

      {locked && (
        <div className="rounded-sm border-4 border-wood bg-parchment p-4">
          <p className="font-bold">
            Your cutoff: {level.label}. Call it real only if p_value is below {level.alpha}.
          </p>
          <p className="mt-1 font-display text-lg font-bold text-bark">
            Trial {index + 1} of {TRIALS.length}
          </p>
          <h3 className="font-display text-xl font-bold text-bark">{trial.name}</h3>
          <p>{trial.story}</p>

          <table className="mt-3 w-full max-w-md border-collapse text-left">
            <caption className="sr-only">Cures in each potion group</caption>
            <thead>
              <tr>
                <th className="border-b-4 border-wood p-2">Potion</th>
                <th className="border-b-4 border-wood p-2">Group size</th>
                <th className="border-b-4 border-wood p-2">Cured</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b-2 border-wood/40 p-2">A (old)</td>
                <td className="border-b-2 border-wood/40 p-2">{trial.sizeA}</td>
                <td className="border-b-2 border-wood/40 p-2">{trial.curedA}</td>
              </tr>
              <tr>
                <td className="border-b-2 border-wood/40 p-2">B (new)</td>
                <td className="border-b-2 border-wood/40 p-2">{trial.sizeB}</td>
                <td className="border-b-2 border-wood/40 p-2">{trial.curedB}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-3 overflow-x-auto rounded-sm border-4 border-bark bg-ink p-3 font-mono text-base text-cream">
            {pythonLines(trial, stats).map((line) => (
              <pre key={line} className="whitespace-pre">
                {line}
              </pre>
            ))}
          </div>

          <fieldset className="mt-3" disabled={feedback?.ok}>
            <legend className="font-bold">Your verdict</legend>
            {VERDICTS.map((v) => (
              <label key={v.id} className="mt-1 flex items-center gap-2">
                <input
                  type="radio"
                  name={`verdict-${trial.id}`}
                  value={v.id}
                  checked={choice === v.id}
                  onChange={() => {
                    setChoice(v.id);
                    setFeedback(null);
                  }}
                />
                {v.label}
              </label>
            ))}
          </fieldset>

          <div className="mt-3 flex flex-wrap gap-3">
            <Button onClick={submit} disabled={feedback?.ok}>
              Submit verdict
            </Button>
            {feedback?.ok && !isLast && <Button variant="secondary" onClick={nextTrial}>Next trial</Button>}
          </div>

          <div role="status" aria-live="polite" className="mt-3 font-bold">
            {feedback && (
              <p className={feedback.ok ? 'text-forest' : 'text-coral'}>
                {feedback.ok ? '✓ ' : '✗ '}
                {feedback.text}
              </p>
            )}
          </div>
        </div>
      )}
    </GameFrame>
  );
}

export default PotionTrials;