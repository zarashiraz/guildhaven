import { useState } from 'react';
import Button from '../../components/ui/Button';
import GameFrame from '../../components/games/GameFrame';
import { ROWS, CHALLENGES, parseWindow, runWindow } from './sqlEngine';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
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
        'Type the window expression, for example: SUM(loans) OVER (PARTITION BY genre).',
        'Press "Run query" to see your new column next to the expected one. Match the librarian to move on.',
      ]}
      hint={challenge.hint}
      won={won}
      winMessage="You wrote four real SQL window functions: a partitioned total, a rank with ties, LAG, and a running total."
      onComplete={onComplete}
    >
      <div className="rounded-sm border-4 border-wood bg-parchment p-4">
        <p className="font-display text-lg font-bold text-bark">
          Question {index + 1} of {CHALLENGES.length}
        </p>
        <p className="mt-1 text-lg">{challenge.ask}</p>

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