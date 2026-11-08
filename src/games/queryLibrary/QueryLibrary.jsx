import { useState } from 'react';
import Button from '../../components/ui/Button';
import GameFrame from '../../components/games/GameFrame';
import { ROWS, CHALLENGES, parseWindow, runWindow } from './sqlEngine';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const PARTS = [
  'a calculation (SUM or AVG), and a PARTITION BY.',
  'a ranking function with no column inside the brackets, a PARTITION BY, and an ORDER BY with DESC.',
  'a function that looks at an earlier row, a PARTITION BY, and an ORDER BY.',
  'a SUM, a PARTITION BY, and an ORDER BY.',
];
const show = (v) => (v === null ? 'NULL' : String(v));

function QueryLibrary({ onComplete }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [result, setResult] = useState(null); // { error } or { values, correct }
  const [won, setWon] = useState(false);

  const challenge = CHALLENGES[index];
  const isLast = index === CHALLENGES.length - 1;

  function runQuery() {
    const parsed = parseWindow(text);
    if (parsed.error) {
      setResult({ error: parsed.error });
      return;
    }
    const values = runWindow(parsed.spec);
    const correct = same(values, challenge.expected);
    setResult({ values, correct });
    if (correct && isLast) setWon(true);
  }

  function nextQuestion() {
    setIndex((i) => i + 1);
    setText('');
    setResult(null);
  }

  const wrongRows = result && result.values
    ? ROWS.map((_, i) => i).filter((i) => result.values[i] !== challenge.expected[i])
    : [];

  return (
    <GameFrame
      title="The Query Library"
      howToPlay={[
        'The librarian keeps a table called loans: how many times each book was borrowed each month.',
        'She asks 4 questions. Each answer is one new column, made with a SQL window function.',
        'Read the "How to read a window function" box below. It shows what each part of the expression does.',
        'Type only the window expression into the dark box, then press "Run query".',
        'You will see your new column next to the expected one. Match the librarian to move on.',
      ]}
      hint={challenge.hint}
      won={won}
      winMessage="You wrote four real SQL window functions: a partitioned total, a rank with ties, LAG, and a running total."
      onComplete={onComplete}
    >
      <div className="rounded-sm border-4 border-gold bg-parchment p-4">
        <h3 className="font-display text-xl font-bold text-bark">How to read a window function</h3>
        <p className="mt-1">
          A window function adds a new column. Every row stays in the table, and each row gets an answer worked out from a
          group of rows around it.
        </p>
        <p className="mt-2 rounded-sm bg-ink p-2 font-mono text-base text-cream">
          SUM(loans) OVER (PARTITION BY genre ORDER BY month)
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>
            <strong>SUM(loans)</strong> is the calculation. Other choices: AVG(loans), RANK(), LAG(loans).
          </li>
          <li>
            <strong>OVER ( … )</strong> means &quot;do it for every row, but do not squash the rows together&quot;.
          </li>
          <li>
            <strong>PARTITION BY genre</strong> splits the rows into separate groups, one per genre. Each group is
            calculated on its own.
          </li>
          <li>
            <strong>ORDER BY month</strong> puts the rows in order inside each group. You only need it when order matters,
            like ranking, LAG, or a running total.
          </li>
        </ul>
        <p className="mt-2">
          <strong>Example (not one of the answers):</strong> <code>AVG(loans) OVER (PARTITION BY genre)</code> gives every
          Fantasy row the average loans of all Fantasy rows (about 54), and every Mystery row the average of all Mystery
          rows (about 33).
        </p>
      </div>

      <div className="rounded-sm border-4 border-wood bg-parchment p-4">
        <p className="font-display text-lg font-bold text-bark">
          Question {index + 1} of {CHALLENGES.length}
        </p>
        <p className="mt-1 text-lg">{challenge.ask}</p>
        <p className="mt-1">
          <strong>Parts you will need:</strong> {PARTS[index]}
        </p>

        <div className="mt-3 rounded-sm border-4 border-bark bg-ink p-3 font-mono text-base text-cream">
          <p>SELECT title, genre, month, loans,</p>
          <label className="my-2 block">
            <span className="sr-only">Your window expression</span>
            <input
              type="text"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setResult(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runQuery();
              }}
              placeholder="FUNCTION(column) OVER (PARTITION BY ... ORDER BY ...)"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              disabled={won}
              className="w-full rounded-sm border-2 border-cream bg-ink p-2 text-cream placeholder:text-sage"
            />
          </label>
          <p>AS answer</p>
          <p>FROM loans;</p>
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <Button onClick={runQuery} disabled={won}>
            Run query
          </Button>
          {result && result.correct && !isLast && (
            <Button variant="secondary" onClick={nextQuestion}>
              Next question
            </Button>
          )}
        </div>

        <div role="status" aria-live="polite" className="mt-3 font-bold">
          {result && result.error && <p className="text-coral">✗ {result.error}</p>}
          {result && result.values && result.correct && (
            <p className="text-forest">✓ That matches the librarian&apos;s answer exactly.</p>
          )}
          {result && result.values && !result.correct && (
            <p className="text-coral">
              ✗ {wrongRows.length} of {ROWS.length} rows are different from what the librarian expected. Compare the two
              columns below.
            </p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <caption className="pb-1 text-left font-display text-lg font-bold text-bark">
            {result && result.values ? 'Your result' : 'The loans table'}
          </caption>
          <thead>
            <tr>
              <th className="border-b-4 border-wood p-2">title</th>
              <th className="border-b-4 border-wood p-2">genre</th>
              <th className="border-b-4 border-wood p-2">month</th>
              <th className="border-b-4 border-wood p-2">loans</th>
              {result && result.values && <th className="border-b-4 border-wood p-2">answer</th>}
              {result && result.values && !result.correct && (
                <th className="border-b-4 border-wood p-2">expected</th>
              )}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => {
              const wrong = result && result.values && result.values[i] !== challenge.expected[i];
              return (
                <tr key={`${r.title}-${r.month}`} className={wrong ? 'bg-parchment' : ''}>
                  <td className="border-b-2 border-wood/40 p-2">{r.title}</td>
                  <td className="border-b-2 border-wood/40 p-2">{r.genre}</td>
                  <td className="border-b-2 border-wood/40 p-2">{r.month}</td>
                  <td className="border-b-2 border-wood/40 p-2">{r.loans}</td>
                  {result && result.values && (
                    <td className="border-b-2 border-wood/40 p-2 font-bold">
                      {show(result.values[i])}
                      {wrong && <span className="sr-only"> (different from expected)</span>}
                    </td>
                  )}
                  {result && result.values && !result.correct && (
                    <td className="border-b-2 border-wood/40 p-2">{show(challenge.expected[i])}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GameFrame>
  );
}

export default QueryLibrary;