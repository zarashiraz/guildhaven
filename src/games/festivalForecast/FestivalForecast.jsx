import { useState } from 'react';
import Button from '../../components/ui/Button';
import GameFrame from '../../components/games/GameFrame';
import {
  BUDGET,
  STEP,
  GOAL_TICKETS,
  CHANNELS,
  START_SPEND,
  ticketsFor,
  totalTickets,
  nextStepGain,
  SALES,
  GOAL_MISS,
  METHODS,
  forecastNext,
  backtest,
} from './forecastData';

const fmt = (n) => n.toFixed(1);

function FestivalForecast({ onComplete }) {
  const [spend, setSpend] = useState(START_SPEND);
  const [budgetLocked, setBudgetLocked] = useState(false);
  const [budgetMsg, setBudgetMsg] = useState('');

  const [method, setMethod] = useState('last');
  const [n, setN] = useState(4);
  const [forecastLocked, setForecastLocked] = useState(false);
  const [forecastMsg, setForecastMsg] = useState('');

  const spent = CHANNELS.reduce((s, c) => s + spend[c.id], 0);
  const unspent = BUDGET - spent;
  const tickets = totalTickets(spend);

  const methodInfo = METHODS.find((m) => m.id === method);
  const test = backtest(method, n);
  const nextWeek = forecastNext(method, n, SALES);
  const won = budgetLocked && forecastLocked;

  function move(id, delta) {
    if (budgetLocked) return;
    setBudgetMsg('');
    setSpend((s) => ({ ...s, [id]: s[id] + delta }));
  }

  function lockBudget() {
    if (unspent > 0) {
      setBudgetMsg(`You still have $${unspent} unspent. Unspent money sells no tickets.`);
      return;
    }
    if (tickets >= GOAL_TICKETS) {
      setBudgetLocked(true);
      setBudgetMsg('');
    } else {
      setBudgetMsg(
        `That plan sells about ${Math.round(tickets)} tickets. You need at least ${GOAL_TICKETS}. Look at which channel's next $${STEP} adds the most, and move money there.`,
      );
    }
  }

  function lockForecast() {
    if (test.mae <= GOAL_MISS) {
      setForecastLocked(true);
      setForecastMsg('');
    } else {
      setForecastMsg(
        `This method missed by ${fmt(test.mae)} tickets on average. You need ${GOAL_MISS} or less. Sales are growing, so think about which method can follow a rising line.`,
      );
    }
  }

  // Simple line picture of the backtest
  const chartW = 560;
  const chartH = 200;
  const allValues = [...SALES, ...test.rows.map((r) => r.predicted)];
  const lo = Math.min(...allValues) - 10;
  const hi = Math.max(...allValues) + 10;
  const x = (week) => 30 + ((week - 1) / (SALES.length - 1)) * (chartW - 50);
  const y = (v) => chartH - 20 - ((v - lo) / (hi - lo)) * (chartH - 40);
  const actualPath = SALES.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i + 1)},${y(v)}`).join(' ');
  const forecastPath = test.rows.map((r, i) => `${i === 0 ? 'M' : 'L'}${x(r.week)},${y(r.predicted)}`).join(' ');

  return (
    <GameFrame
      title="The Festival Forecast"
      howToPlay={[
        'Part 1: spend the $1000 festival budget on three kinds of advertising to sell as many tickets as you can.',
        'Each extra $50 in one channel sells fewer new tickets than the last $50. Compare the "next $50 adds" numbers.',
        'Part 2: pick a forecasting method for weekly ticket sales. We test it on weeks 7 to 12, pretending we did not know them yet.',
        'Lock in a budget that sells at least 264 tickets and a method that misses by 8 tickets or less.',
      ]}
      hint="Part 1: the best plan makes the next $50 add about the same number of tickets in every channel. Part 2: sales climb every week, so a method that only looks backwards (a plain average) will always be too low."
      won={won}
      winMessage="You balanced a marketing budget using diminishing returns, then picked a forecast by testing it on past weeks."
      onComplete={onComplete}
    >
      <div className="rounded-sm border-4 border-wood bg-parchment p-4">
        <h3 className="font-display text-xl font-bold text-bark">Part 1: Spend the advertising budget</h3>
        <p className="mt-1">
          Budget: ${BUDGET}. Spent: ${spent}. Unspent: ${unspent}.
        </p>

        <ul className="mt-3 space-y-3">
          {CHANNELS.map((c) => {
            const dollars = spend[c.id];
            return (
              <li key={c.id} className="rounded-sm bg-cream p-3">
                <p className="font-display text-lg font-bold text-bark">{c.name}</p>
                <p>{c.note}</p>
                <p className="mt-1">
                  Spending <strong>${dollars}</strong> sells <strong>{fmt(ticketsFor(c, dollars))}</strong> tickets.
                </p>
                <p>
                  The next ${STEP} would add <strong>{fmt(nextStepGain(c, dollars))}</strong> more tickets.
                </p>
                <div className="mt-2 flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => move(c.id, -STEP)}
                    disabled={budgetLocked || dollars < STEP}
                    aria-label={`Take $${STEP} away from ${c.name}`}
                  >
                    − ${STEP}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => move(c.id, STEP)}
                    disabled={budgetLocked || unspent < STEP}
                    aria-label={`Add $${STEP} to ${c.name}`}
                  >
                    + ${STEP}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>

        <p role="status" aria-live="polite" className="mt-3 font-display text-xl font-bold text-bark">
          Total: about {Math.round(tickets)} tickets. Goal: {GOAL_TICKETS}.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button onClick={lockBudget} disabled={budgetLocked}>
            Lock in budget
          </Button>
          {budgetLocked && <p className="font-bold text-forest">✓ Budget locked: {Math.round(tickets)} tickets.</p>}
        </div>
        {budgetMsg && (
          <p role="alert" className="mt-2 font-bold text-coral">
            ✗ {budgetMsg}
          </p>
        )}
      </div>

      {budgetLocked && (
        <div className="rounded-sm border-4 border-wood bg-parchment p-4">
          <h3 className="font-display text-xl font-bold text-bark">Part 2: Forecast next week&apos;s sales</h3>
          <p className="mt-1">
            Weekly ticket sales so far: {SALES.join(', ')}. Pick a method. The table shows how it would have done on weeks 7
            to 12.
          </p>

          <fieldset className="mt-3" disabled={forecastLocked}>
            <legend className="font-bold">Method</legend>
            {METHODS.map((m) => (
              <label key={m.id} className="mt-1 flex items-center gap-2">
                <input
                  type="radio"
                  name="method"
                  value={m.id}
                  checked={method === m.id}
                  onChange={() => {
                    setMethod(m.id);
                    setForecastMsg('');
                  }}
                />
                {m.name}
              </label>
            ))}
          </fieldset>

          {methodInfo.usesN && (
            <label className="mt-3 block">
              <span className="font-bold">Weeks to look back (N): {n}</span>
              <input
                type="range"
                min="2"
                max="8"
                step="1"
                value={n}
                disabled={forecastLocked}
                onChange={(e) => {
                  setN(Number(e.target.value));
                  setForecastMsg('');
                }}
                className="mt-1 block w-full max-w-sm"
              />
            </label>
          )}

          <p role="status" aria-live="polite" className="mt-3 font-display text-xl font-bold text-bark">
            Average miss: {fmt(test.mae)} tickets. Goal: {GOAL_MISS} or less.{' '}
            {test.mae <= GOAL_MISS ? '✓ Good enough.' : '✗ Too far off.'}
          </p>

          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            className="mt-2 w-full max-w-2xl rounded-sm border-2 border-wood bg-cream"
            aria-hidden="true"
          >
            <path d={actualPath} fill="none" stroke="#3b2a1a" strokeWidth="3" />
            <path d={forecastPath} fill="none" stroke="#2f6b3a" strokeWidth="3" strokeDasharray="8 5" />
            <text x="34" y="18" fontSize="14" fill="#3b2a1a">
              Solid: real sales. Dashed: what the method predicted.
            </text>
          </svg>

          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <caption className="pb-1 text-left font-bold">Backtest: weeks 7 to 12</caption>
              <thead>
                <tr>
                  <th className="border-b-4 border-wood p-2">Week</th>
                  <th className="border-b-4 border-wood p-2">Real sales</th>
                  <th className="border-b-4 border-wood p-2">Predicted</th>
                  <th className="border-b-4 border-wood p-2">Miss</th>
                </tr>
              </thead>
              <tbody>
                {test.rows.map((r) => (
                  <tr key={r.week}>
                    <td className="border-b-2 border-wood/40 p-2">{r.week}</td>
                    <td className="border-b-2 border-wood/40 p-2">{r.actual}</td>
                    <td className="border-b-2 border-wood/40 p-2">{fmt(r.predicted)}</td>
                    <td className="border-b-2 border-wood/40 p-2">{fmt(r.miss)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button onClick={lockForecast} disabled={forecastLocked}>
              Use this method
            </Button>
            {forecastLocked && (
              <p className="font-bold text-forest">✓ Forecast for week 13: about {Math.round(nextWeek)} tickets.</p>
            )}
          </div>
          {forecastMsg && (
            <p role="alert" className="mt-2 font-bold text-coral">
              ✗ {forecastMsg}
            </p>
          )}
        </div>
      )}
    </GameFrame>
  );
}

export default FestivalForecast;