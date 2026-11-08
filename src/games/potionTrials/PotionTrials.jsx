
import { useState } from 'react';
import Button from '../../components/ui/Button';
import GameFrame from '../../components/games/GameFrame';
import {
  LEVELS,
  TRIALS,
  VERDICTS,
  twoProportion,
  correctVerdict,
} from './stats';

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

function PotionBottle({ color = 'lilac', size = 80 }) {
  const themes = {
    lilac: {
      liquid: '#B9A4CF',
      shine: '#E3D7F0',
      dark: '#8F7BA9',
    },
    rose: {
      liquid: '#DCA6B6',
      shine: '#F3D6DF',
      dark: '#B67E93',
    },
    sage: {
      liquid: '#A4C5AD',
      shine: '#D8EBDD',
      dark: '#789D84',
    },
  };

  const c = themes[color] || themes.lilac;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      aria-hidden="true"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect x="31" y="6" width="18" height="9" fill="#967C69" />
      <rect x="28" y="15" width="24" height="8" fill="#C7B2A2" />
      <rect x="31" y="23" width="18" height="11" fill="#A7B6BC" />
      <rect x="23" y="34" width="34" height="8" fill="#A7B6BC" />
      <rect x="17" y="42" width="46" height="25" fill="#A7B6BC" />
      <rect x="23" y="67" width="34" height="7" fill="#A7B6BC" />
      <rect x="23" y="46" width="34" height="19" fill={c.liquid} />
      <rect x="29" y="40" width="22" height="7" fill={c.liquid} />
      <rect x="28" y="50" width="6" height="12" fill={c.shine} />
      <rect x="48" y="54" width="6" height="10" fill={c.dark} />
      <rect x="37" y="43" width="5" height="5" fill={c.shine} />
      <rect x="43" y="35" width="4" height="4" fill={c.shine} />
      <rect x="17" y="42" width="5" height="25" fill="#87999F" />
      <rect x="58" y="42" width="5" height="25" fill="#87999F" />
      <rect x="23" y="67" width="34" height="5" fill="#87999F" />
    </svg>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#9B879E]">
      {children}
    </p>
  );
}

function PotionTrials({ onComplete }) {
  const [levelId, setLevelId] = useState('95');
  const [locked, setLocked] = useState(false);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [won, setWon] = useState(false);

  const level = LEVELS.find((l) => l.id === levelId);
  const trial = TRIALS[index];
  const stats = twoProportion(
    trial.curedA,
    trial.sizeA,
    trial.curedB,
    trial.sizeB
  );
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
      <div className="space-y-5 text-[#655A67]">

        {/* APOTHECARY HEADER */}
        <section className="overflow-hidden border-[3px] border-[#B7A2B8] bg-[#F4EEF4]">
          <div className="border-b-2 border-[#D2C2D2] bg-[#E9DFEA] px-4 py-2">
            <SectionLabel>
              Guildhaven Apothecary / Research Notes
            </SectionLabel>
          </div>

          <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-7">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#9B8C9E]">
                Laboratory Record No. 03
              </p>

              <h2 className="mt-2 font-display text-3xl font-bold text-[#765F7B]">
                The Potion Trials
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#8A7989]">
                Two potions. Three experiments.
                Can you tell a genuine discovery
                from a lucky coincidence?
              </p>
            </div>

            <div className="hidden items-end sm:flex">
              <PotionBottle color="rose" size={65} />
              <PotionBottle color="lilac" size={95} />
              <PotionBottle color="sage" size={65} />
            </div>
          </div>
        </section>

        {/* STEP 1 */}
        {!locked && (
          <section className="border-[3px] border-[#C5B4C6] bg-[#FCF9F7] p-5 sm:p-6">
            <SectionLabel>01 / Research Protocol</SectionLabel>

            <h3 className="mt-2 font-display text-xl font-bold text-[#765F7B]">
              How sure do you need to be?
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-[#807581]">
              A surer cutoff avoids false alarms but
              misses small real effects. A looser cutoff
              catches more real effects but raises more
              false alarms. Choose before you see any data.
            </p>

            <fieldset className="mt-5">
              <legend className="mb-3 font-display font-bold text-[#765F7B]">
                Confidence level
              </legend>

              <div className="grid gap-3">
                {LEVELS.map((l) => {
                  const selected = levelId === l.id;

                  return (
                    <label
                      key={l.id}
                      className={`flex cursor-pointer items-center gap-3 border-2 px-4 py-4 transition-colors ${
                        selected
                          ? 'border-[#AD94B5] bg-[#EEE5F0]'
                          : 'border-[#E0D7DF] bg-white hover:bg-[#F7F1F7]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="level"
                        value={l.id}
                        checked={selected}
                        onChange={() => setLevelId(l.id)}
                        className="h-4 w-4 shrink-0 accent-[#9277A0]"
                      />

                      <span className="text-sm leading-relaxed">
                        <strong className="text-[#765F7B]">
                          {l.label}
                        </strong>
                        <span className="block text-xs text-[#928494]">
                          Call it real only if p_value is
                          below {l.alpha}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-5">
              <Button onClick={() => setLocked(true)}>
                Lock it in
              </Button>
            </div>

            <p className="mt-3 font-mono text-[11px] text-[#9E919E]">
              Once selected, your confidence level cannot
              be changed during the trials.
            </p>
          </section>
        )}

        {/* TRIALS */}
        {locked && (
          <section className="overflow-hidden border-[3px] border-[#C5B4C6] bg-[#FCF9F7]">
            <div className="border-b-2 border-[#D7C9D6] bg-[#F0E8F0] px-5 py-4">
              <SectionLabel>
                02 / Experimental Findings
              </SectionLabel>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl font-bold text-[#765F7B]">
                    {trial.name}
                  </h3>
                  <p className="mt-1 text-sm text-[#928294]">
                    Trial {index + 1} of {TRIALS.length}
                  </p>
                </div>

                <span className="border-2 border-[#C8B8CC] bg-[#FAF6FB] px-3 py-2 font-mono text-xs font-bold text-[#8B7592]">
                  {level.label} / p &lt; {level.alpha}
                </span>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <p className="text-sm leading-relaxed text-[#786E7A]">
                {trial.story}
              </p>

              {/* POTION COMPARISON */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border-2 border-[#DEC3CD] bg-[#F9EDF0] p-4">
                  <div className="flex items-center gap-3">
                    <PotionBottle color="rose" size={62} />
                    <div>
                      <SectionLabel>Potion A</SectionLabel>
                      <p className="font-display text-lg font-bold text-[#9D7485]">
                        Original Formula
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-[#E9D1DA] pt-3 text-sm">
                    <div className="flex justify-between">
                      <span>Group size</span>
                      <strong>{trial.sizeA}</strong>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span>Cured</span>
                      <strong>{trial.curedA}</strong>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-[#C7C8DF] bg-[#F0EFF8] p-4">
                  <div className="flex items-center gap-3">
                    <PotionBottle color="lilac" size={62} />
                    <div>
                      <SectionLabel>Potion B</SectionLabel>
                      <p className="font-display text-lg font-bold text-[#8077A3]">
                        New Formula
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-[#DAD8E9] pt-3 text-sm">
                    <div className="flex justify-between">
                      <span>Group size</span>
                      <strong>{trial.sizeB}</strong>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span>Cured</span>
                      <strong>{trial.curedB}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* ORIGINAL DATA TABLE */}
              <div className="overflow-x-auto border-2 border-[#DED4DC] bg-white">
                <table className="w-full border-collapse text-left text-sm">
                  <caption className="sr-only">
                    Cures in each potion group
                  </caption>
                  <thead className="bg-[#EEE7EE] text-[#79667D]">
                    <tr>
                      <th className="p-3">Potion</th>
                      <th className="p-3">Group size</th>
                      <th className="p-3">Cured</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-[#E8E0E7]">
                      <td className="p-3">A (old)</td>
                      <td className="p-3">{trial.sizeA}</td>
                      <td className="p-3">{trial.curedA}</td>
                    </tr>
                    <tr className="border-t border-[#E8E0E7] bg-[#FCFAFC]">
                      <td className="p-3">B (new)</td>
                      <td className="p-3">{trial.sizeB}</td>
                      <td className="p-3">{trial.curedB}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* CODE PANEL */}
              <div className="overflow-hidden border-[3px] border-[#807484] bg-[#292630]">
                <div className="flex items-center justify-between border-b border-[#514956] bg-[#38323E] px-4 py-3">
                  <span className="font-mono text-xs font-bold text-[#D2C0D8]">
                    trial_analysis.py
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#A69BAB]">
                    Calculation Log
                  </span>
                </div>

                <div className="overflow-x-auto p-4">
                  {pythonLines(trial, stats).map((line) => (
                    <pre
                      key={line}
                      className="whitespace-pre font-mono text-sm leading-7 text-[#DAD6DF]"
                    >
                      {line}
                    </pre>
                  ))}
                </div>
              </div>

              {/* VERDICT */}
              <fieldset
                disabled={feedback?.ok}
                className="border-2 border-[#D9D1C3] bg-[#F7F4EC] p-4 sm:p-5"
              >
                <legend className="px-2 font-display text-lg font-bold text-[#806E7F]">
                  Your verdict
                </legend>

                <p className="mb-4 text-sm text-[#8D8289]">
                  Based on the trial results, what can
                  the apothecary conclude?
                </p>

                <div className="space-y-2">
                  {VERDICTS.map((v) => (
                    <label
                      key={v.id}
                      className={`flex cursor-pointer items-center gap-3 border-2 p-3 text-sm transition-colors ${
                        choice === v.id
                          ? 'border-[#B5A0BD] bg-[#EDE4F0]'
                          : 'border-[#E2DCD7] bg-white hover:bg-[#FBF8FC]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`verdict-${trial.id}`}
                        value={v.id}
                        checked={choice === v.id}
                        onChange={() => {
                          setChoice(v.id);
                          setFeedback(null);
                        }}
                        className="h-4 w-4 shrink-0 accent-[#9277A0]"
                      />
                      <span>{v.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={submit}
                  disabled={feedback?.ok}
                >
                  Submit verdict
                </Button>

                {feedback?.ok && !isLast && (
                  <Button
                    variant="secondary"
                    onClick={nextTrial}
                  >
                    Next trial
                  </Button>
                )}
              </div>

              <div role="status" aria-live="polite">
                {feedback && (
                  <div
                    className={`border-l-4 p-4 text-sm font-semibold leading-relaxed ${
                      feedback.ok
                        ? 'border-[#95B59D] bg-[#EAF3E9] text-[#64856A]'
                        : 'border-[#D3A1AB] bg-[#F8E9EC] text-[#A56F7C]'
                    }`}
                  >
                    <span className="font-bold">
                      {feedback.ok ? 'Correct. ' : 'Try again. '}
                    </span>
                    {feedback.text}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </GameFrame>
  );
}

export default PotionTrials;
