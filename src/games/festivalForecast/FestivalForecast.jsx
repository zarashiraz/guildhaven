
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

const PALETTE = {
  ink: '#66546B',
  purple: '#8E77A5',
  pink: '#E6A8BF',
  green: '#92BFA3',
  blue: '#A4C6E6',
  yellow: '#EACB8D',
};

const CHANNEL_THEMES = [
  {
    bg: '#FBE8EF',
    border: '#D9A9BF',
    accent: '#B87C99',
    track: '#F3D4E0',
  },
  {
    bg: '#E8F0FC',
    border: '#A9C4E1',
    accent: '#779EC9',
    track: '#D2E3F4',
  },
  {
    bg: '#E7F5EA',
    border: '#A9CEB3',
    accent: '#79AC8A',
    track: '#D0E9D7',
  },
];

function FestivalIllustration() {
  return (
    <svg
      viewBox="0 0 240 150"
      className="h-36 w-full max-w-[240px]"
      role="img"
      aria-label="Pixel-art festival with colorful market stalls"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect x="0" y="119" width="240" height="31" fill="#C8DFBD" />
      <rect x="0" y="134" width="240" height="16" fill="#B5D2AB" />

      <path
        d="M12 25 L65 41 L119 20 L178 38 L228 22"
        fill="none"
        stroke="#967F9E"
        strokeWidth="3"
      />

      <path d="M30 30 L40 45 L50 35 Z" fill="#E8A9C0" />
      <path d="M84 33 L94 47 L104 26 Z" fill="#F0CD86" />
      <path d="M143 28 L153 45 L163 33 Z" fill="#A8CDB5" />
      <path d="M195 33 L205 45 L215 27 Z" fill="#A9C8E6" />

      <rect x="15" y="70" width="90" height="53" fill="#E9C9B0" />
      <rect x="10" y="55" width="100" height="20" fill="#D889A9" />
      <rect x="10" y="55" width="20" height="20" fill="#FFF6E9" />
      <rect x="50" y="55" width="20" height="20" fill="#FFF6E9" />
      <rect x="90" y="55" width="20" height="20" fill="#FFF6E9" />

      <rect x="37" y="85" width="46" height="26" fill="#A77883" />
      <rect x="44" y="92" width="32" height="13" fill="#FFE9D0" />
      <rect x="50" y="95" width="9" height="7" fill="#D69A64" />
      <rect x="63" y="95" width="9" height="7" fill="#D69A64" />

      <rect x="132" y="63" width="91" height="60" fill="#C9D8EF" />
      <rect x="127" y="48" width="101" height="20" fill="#91A9D6" />
      <rect x="127" y="48" width="20" height="20" fill="#FFF6E9" />
      <rect x="167" y="48" width="20" height="20" fill="#FFF6E9" />
      <rect x="207" y="48" width="21" height="20" fill="#FFF6E9" />

      <rect x="154" y="81" width="46" height="30" fill="#8A9BC5" />
      <rect x="161" y="87" width="32" height="18" fill="#F5E8FA" />

      <rect x="113" y="108" width="12" height="15" fill="#B58F76" />
      <rect x="111" y="100" width="16" height="12" fill="#E4B393" />
      <rect x="110" y="96" width="18" height="7" fill="#6D5568" />
      <rect x="109" y="115" width="20" height="13" fill="#B58CC8" />

      <rect x="22" y="19" width="6" height="6" fill="#D9A4BB" />
      <rect x="214" y="13" width="7" height="7" fill="#E6C687" />
      <rect x="188" y="9" width="5" height="5" fill="#A9CFB5" />
    </svg>
  );
}

function ChannelIllustration({ index }) {
  const colors = [
    ['#E3A4BA', '#F6D6E2', '#A96C89'],
    ['#8EB5D9', '#D7E9F8', '#5C8BB8'],
    ['#9CC9A9', '#DCF0E1', '#6D9D7B'],
  ];

  const [main, light, dark] = colors[index % colors.length];

  return (
    <svg
      viewBox="0 0 76 76"
      width="76"
      height="76"
      aria-hidden="true"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect x="0" y="0" width="76" height="76" fill={light} />

      {index === 0 && (
        <>
          <rect x="13" y="24" width="38" height="28" fill={main} />
          <rect x="51" y="30" width="10" height="16" fill={dark} />
          <rect x="21" y="30" width="22" height="16" fill="#FFF9F0" />
          <rect x="17" y="54" width="8" height="8" fill={dark} />
          <rect x="43" y="54" width="8" height="8" fill={dark} />
          <rect x="54" y="18" width="5" height="5" fill="#E5C17E" />
          <rect x="61" y="11" width="5" height="5" fill="#E5C17E" />
        </>
      )}

      {index === 1 && (
        <>
          <rect x="19" y="12" width="38" height="52" fill={dark} />
          <rect x="23" y="17" width="30" height="40" fill="#FFF9F0" />
          <rect x="28" y="23" width="20" height="5" fill={main} />
          <rect x="28" y="33" width="15" height="4" fill={main} />
          <rect x="28" y="42" width="20" height="4" fill={main} />
          <rect x="35" y="59" width="7" height="3" fill="#FFF9F0" />
        </>
      )}

      {index === 2 && (
        <>
          <rect x="11" y="24" width="38" height="29" fill={main} />
          <rect x="18" y="30" width="24" height="16" fill="#FFF9F0" />
          <rect x="48" y="18" width="15" height="20" fill={dark} />
          <rect x="52" y="12" width="7" height="8" fill={dark} />
          <rect x="20" y="55" width="7" height="7" fill={dark} />
          <rect x="40" y="55" width="7" height="7" fill={dark} />
          <rect x="53" y="44" width="6" height="6" fill="#E6C58C" />
        </>
      )}
    </svg>
  );
}

function FestivalForecast({ onComplete }) {
  const [spend, setSpend] = useState(START_SPEND);
  const [budgetLocked, setBudgetLocked] = useState(false);
  const [budgetMsg, setBudgetMsg] = useState('');

  const [method, setMethod] = useState('last');
  const [n, setN] = useState(4);
  const [forecastLocked, setForecastLocked] = useState(false);
  const [forecastMsg, setForecastMsg] = useState('');

  const spent = CHANNELS.reduce(
    (s, c) => s + spend[c.id],
    0
  );

  const unspent = BUDGET - spent;
  const tickets = totalTickets(spend);

  const methodInfo = METHODS.find((m) => m.id === method);
  const test = backtest(method, n);
  const nextWeek = forecastNext(method, n, SALES);
  const won = budgetLocked && forecastLocked;

  function move(id, delta) {
    if (budgetLocked) return;

    setBudgetMsg('');
    setSpend((s) => ({
      ...s,
      [id]: s[id] + delta,
    }));
  }

  function lockBudget() {
    if (unspent > 0) {
      setBudgetMsg(
        `You still have $${unspent} unspent. Unspent money sells no tickets.`
      );
      return;
    }

    if (tickets >= GOAL_TICKETS) {
      setBudgetLocked(true);
      setBudgetMsg('');
    } else {
      setBudgetMsg(
        `That plan sells about ${Math.round(tickets)} tickets. You need at least ${GOAL_TICKETS}. Look at which channel's next $${STEP} adds the most, and move money there.`
      );
    }
  }

  function lockForecast() {
    if (test.mae <= GOAL_MISS) {
      setForecastLocked(true);
      setForecastMsg('');
    } else {
      setForecastMsg(
        `This method missed by ${fmt(test.mae)} tickets on average. You need ${GOAL_MISS} or less. Sales are growing, so think about which method can follow a rising line.`
      );
    }
  }

  // Original backtest chart calculations.
  const chartW = 560;
  const chartH = 200;

  const allValues = [
    ...SALES,
    ...test.rows.map((r) => r.predicted),
  ];

  const lo = Math.min(...allValues) - 10;
  const hi = Math.max(...allValues) + 10;

  const x = (week) =>
    30 +
    ((week - 1) / (SALES.length - 1)) * (chartW - 50);

  const y = (v) =>
    chartH -
    20 -
    ((v - lo) / (hi - lo)) * (chartH - 40);

  const actualPath = SALES.map(
    (v, i) => `${i === 0 ? 'M' : 'L'}${x(i + 1)},${y(v)}`
  ).join(' ');

  const forecastPath = test.rows.map(
    (r, i) =>
      `${i === 0 ? 'M' : 'L'}${x(r.week)},${y(r.predicted)}`
  ).join(' ');

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
      <div className="space-y-6 text-[#66546B]">

        {/* FESTIVAL HEADER */}
        <section
          className="overflow-hidden border-4 border-[#947D9F] bg-[#FBE8F0]"
          style={{ boxShadow: '5px 5px 0 #DAC8DE' }}
        >
          <div className="border-b-[3px] border-[#947D9F] bg-[#E8D9F5] px-4 py-2 text-center font-mono text-xs font-bold tracking-[0.18em] text-[#795F8C]">
            GUILDHAVEN FESTIVAL PLANNING OFFICE
          </div>

          <div className="flex flex-col items-center justify-between gap-4 bg-gradient-to-br from-[#FCE8EF] via-[#FFF0DC] to-[#E6F3EA] px-5 py-6 sm:flex-row sm:px-8">
            <div>
              <span className="inline-block border-2 border-[#BCA6C9] bg-white/75 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#856D98]">
                Business Quest
              </span>

              <h2 className="mt-3 font-display text-3xl font-bold text-[#624F71]">
                The Festival Forecast
              </h2>

              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#796A80]">
                The festival needs a brilliant marketing
                plan. Spend wisely, sell tickets, and
                predict what happens next.
              </p>
            </div>

            <FestivalIllustration />
          </div>
        </section>

        {/* PART 1 */}
        <section
          className="overflow-hidden border-4 border-[#B89BC8] bg-[#F9F1FC]"
          style={{ boxShadow: '5px 5px 0 #DED0E5' }}
        >
          <div className="border-b-[3px] border-[#B89BC8] bg-[#EADCF5] px-4 py-4 sm:px-5">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#9275A8]">
              Part 01 / Marketing Strategy
            </p>

            <h3 className="mt-1 font-display text-2xl font-bold text-[#675177]">
              Spend the advertising budget
            </h3>

            <p className="mt-2 text-sm text-[#7C6A87]">
              Allocate your festival funds across three
              advertising channels.
            </p>
          </div>

          <div className="p-4 sm:p-5">
            {/* BUDGET SUMMARY */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border-[3px] border-[#D8B7C8] bg-[#FBE8EF] p-4">
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#AE7891]">
                  Total Budget
                </p>

                <p className="mt-2 font-display text-2xl font-bold text-[#906078]">
                  ${BUDGET}
                </p>
              </div>

              <div className="border-[3px] border-[#B9CFE6] bg-[#E8F1FA] p-4">
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#7A9BB8]">
                  Spent
                </p>

                <p className="mt-2 font-display text-2xl font-bold text-[#6486A6]">
                  ${spent}
                </p>
              </div>

              <div className="border-[3px] border-[#B6D6BF] bg-[#E8F5EB] p-4">
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#79A586]">
                  Unspent
                </p>

                <p className="mt-2 font-display text-2xl font-bold text-[#5D916E]">
                  ${unspent}
                </p>
              </div>
            </div>

            {/* CHANNEL CARDS */}
            <ul className="mt-5 space-y-4">
              {CHANNELS.map((c, i) => {
                const dollars = spend[c.id];
                const theme =
                  CHANNEL_THEMES[i % CHANNEL_THEMES.length];

                return (
                  <li
                    key={c.id}
                    className="border-[3px] p-4 sm:p-5"
                    style={{
                      backgroundColor: theme.bg,
                      borderColor: theme.border,
                      boxShadow: '3px 3px 0 #DDD0DF',
                    }}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div
                        className="w-fit shrink-0 border-[3px] border-white"
                        style={{
                          boxShadow: `3px 3px 0 ${theme.border}`,
                        }}
                      >
                        <ChannelIllustration index={i} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-display text-xl font-bold text-[#66516F]">
                          {c.name}
                        </h4>

                        <p className="mt-1 text-sm leading-relaxed text-[#78677D]">
                          {c.note}
                        </p>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div className="border-2 border-white bg-white/75 p-3">
                            <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-[#98849C]">
                              Current Allocation
                            </p>

                            <p className="mt-1 font-display text-xl font-bold text-[#6A5677]">
                              ${dollars}
                            </p>

                            <p className="mt-1 text-xs text-[#82738B]">
                              Sells {fmt(ticketsFor(c, dollars))} tickets
                            </p>
                          </div>

                          <div className="border-2 border-white bg-white/75 p-3">
                            <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-[#98849C]">
                              Next ${STEP} Adds
                            </p>

                            <p className="mt-1 font-display text-xl font-bold text-[#6A5677]">
                              +{fmt(nextStepGain(c, dollars))}
                            </p>

                            <p className="mt-1 text-xs text-[#82738B]">
                              Additional tickets
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            variant="secondary"
                            onClick={() => move(c.id, -STEP)}
                            disabled={budgetLocked || dollars < STEP}
                            aria-label={`Take $${STEP} away from ${c.name}`}
                          >
                            - ${STEP}
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
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* TICKET GOAL */}
            <div className="mt-5 border-[3px] border-[#B6D6BF] bg-[#E8F5EB] p-4 sm:p-5">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#7CA48A]">
                Estimated Ticket Sales
              </p>

              <p
                role="status"
                aria-live="polite"
                className="mt-2 font-display text-2xl font-bold text-[#577D64]"
              >
                About {Math.round(tickets)} tickets
              </p>

              <p className="mt-1 text-sm text-[#6C9077]">
                Goal: {GOAL_TICKETS} tickets
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                onClick={lockBudget}
                disabled={budgetLocked}
              >
                Lock in budget
              </Button>

              {budgetLocked && (
                <p className="border-2 border-[#9FC9AC] bg-[#E5F5E9] px-3 py-2 text-sm font-bold text-[#5A8667]">
                  Budget locked: {Math.round(tickets)} tickets.
                </p>
              )}
            </div>

            {budgetMsg && (
              <p
                role="alert"
                className="mt-4 border-l-4 border-[#D9A0B6] bg-[#FBE7EF] p-4 text-sm font-semibold leading-relaxed text-[#A36881]"
              >
                {budgetMsg}
              </p>
            )}
          </div>
        </section>

        {/* PART 2 */}
        {budgetLocked && (
          <section
            className="overflow-hidden border-4 border-[#A6BBD6] bg-[#F0F5FC]"
            style={{ boxShadow: '5px 5px 0 #CEDAE8' }}
          >
            <div className="border-b-[3px] border-[#A6BBD6] bg-[#DCE9F8] px-4 py-4 sm:px-5">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#7C99B8]">
                Part 02 / Sales Forecasting
              </p>

              <h3 className="mt-1 font-display text-2xl font-bold text-[#607B9B]">
                Forecast next week's sales
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-[#748DA8]">
                Choose a forecasting method and test
                how accurately it predicts past sales.
              </p>
            </div>

            <div className="p-4 sm:p-5">

              {/* SALES HISTORY */}
              <div className="border-[3px] border-[#C8D8E9] bg-white/85 p-4">
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#8DA4BD]">
                  Historical Sales Data
                </p>

                <p className="mt-2 text-sm leading-relaxed text-[#6D8096]">
                  Weekly ticket sales so far:
                </p>

                <p className="mt-2 break-words font-mono text-sm font-bold leading-loose text-[#5D7898]">
                  {SALES.join(', ')}
                </p>

                <p className="mt-2 text-xs text-[#8A9CB0]">
                  The backtest checks weeks 7 to 12.
                </p>
              </div>

              {/* FORECAST METHOD */}
              <fieldset
                className="mt-5"
                disabled={forecastLocked}
              >
                <legend className="font-display text-xl font-bold text-[#607B9B]">
                  Choose a forecasting method
                </legend>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {METHODS.map((m, i) => {
                    const selected = method === m.id;

                    return (
                      <label
                        key={m.id}
                        className={`flex cursor-pointer items-center gap-3 border-[3px] p-4 transition-all ${
                          selected
                            ? 'border-[#819FCA] bg-[#DFEAF9] shadow-[3px_3px_0_#CAD9EB]'
                            : 'border-[#D0DCEB] bg-white/80 hover:border-[#A8C0DE]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="method"
                          value={m.id}
                          checked={selected}
                          onChange={() => {
                            setMethod(m.id);
                            setForecastMsg('');
                          }}
                          className="h-5 w-5 shrink-0 accent-[#819FCA]"
                        />

                        <span className="font-semibold text-[#617A98]">
                          {m.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* LOOKBACK SLIDER */}
              {methodInfo.usesN && (
                <label className="mt-5 block border-[3px] border-[#C8D8E9] bg-[#E8F1FB] p-4">
                  <span className="font-display text-lg font-bold text-[#607B9B]">
                    Weeks to look back (N): {n}
                  </span>

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
                    className="mt-4 block w-full max-w-sm accent-[#8DA8D0]"
                  />

                  <div className="mt-2 flex max-w-sm justify-between font-mono text-xs text-[#8DA2BA]">
                    <span>2 weeks</span>
                    <span>8 weeks</span>
                  </div>
                </label>
              )}

              {/* ACCURACY RESULT */}
              <div
                className={`mt-5 border-[3px] p-4 ${
                  test.mae <= GOAL_MISS
                    ? 'border-[#A9D1B5] bg-[#E8F6EB]'
                    : 'border-[#DFB5C5] bg-[#FCEBF1]'
                }`}
              >
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#917C9C]">
                  Forecast Accuracy
                </p>

                <p
                  role="status"
                  aria-live="polite"
                  className={`mt-2 font-display text-2xl font-bold ${
                    test.mae <= GOAL_MISS
                      ? 'text-[#5F906E]'
                      : 'text-[#AD7189]'
                  }`}
                >
                  Average miss: {fmt(test.mae)} tickets
                </p>

                <p className="mt-2 text-sm font-semibold text-[#806E87]">
                  Goal: {GOAL_MISS} or less.
                </p>

                <p className="mt-1 text-sm font-bold text-[#806E87]">
                  {test.mae <= GOAL_MISS
                    ? 'Good enough.'
                    : 'Too far off.'}
                </p>
              </div>

              {/* FORECAST CHART */}
              <div className="mt-5 border-[3px] border-[#C6D5E8] bg-[#FFFCFF] p-3 sm:p-4">
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#8DA4BD]">
                  Sales Trend Comparison
                </p>

                <h4 className="mt-1 font-display text-lg font-bold text-[#607B9B]">
                  Actual vs predicted sales
                </h4>

                <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-[#71849D]">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-[3px] w-7 bg-[#B28ACB]" />
                    Real sales
                  </span>

                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block w-7 border-t-[3px] border-dashed border-[#78B69A]"
                    />
                    Predicted sales
                  </span>
                </div>

                <svg
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  className="mt-3 w-full max-w-2xl border-2 border-[#E1D7EC] bg-[#FBF8FE]"
                  aria-hidden="true"
                >
                  {[40, 80, 120, 160].map((line) => (
                    <line
                      key={line}
                      x1="25"
                      x2="540"
                      y1={line}
                      y2={line}
                      stroke="#E8DFF0"
                      strokeWidth="1"
                    />
                  ))}

                  <path
                    d={actualPath}
                    fill="none"
                    stroke="#B28ACB"
                    strokeWidth="4"
                  />

                  <path
                    d={forecastPath}
                    fill="none"
                    stroke="#78B69A"
                    strokeWidth="4"
                    strokeDasharray="8 5"
                  />
                </svg>
              </div>

              {/* BACKTEST TABLE */}
              <div className="mt-5 overflow-x-auto border-[3px] border-[#C6D5E8] bg-white">
                <table className="w-full min-w-[400px] border-collapse text-left text-sm">
                  <caption className="bg-[#DCE9F8] px-4 py-3 text-left font-display text-lg font-bold text-[#607B9B]">
                    Backtest: weeks 7 to 12
                  </caption>

                  <thead className="bg-[#EAF2FB] text-[#6884A2]">
                    <tr>
                      <th className="p-3">Week</th>
                      <th className="p-3">Real sales</th>
                      <th className="p-3">Predicted</th>
                      <th className="p-3">Miss</th>
                    </tr>
                  </thead>

                  <tbody>
                    {test.rows.map((r, i) => (
                      <tr
                        key={r.week}
                        className={
                          i % 2 === 0
                            ? 'bg-white'
                            : 'bg-[#F1F6FC]'
                        }
                      >
                        <td className="border-t border-[#DCE6F2] p-3 font-bold">
                          {r.week}
                        </td>

                        <td className="border-t border-[#DCE6F2] p-3">
                          {r.actual}
                        </td>

                        <td className="border-t border-[#DCE6F2] p-3">
                          {fmt(r.predicted)}
                        </td>

                        <td className="border-t border-[#DCE6F2] p-3 font-semibold">
                          {fmt(r.miss)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* FINAL FORECAST */}
              <div className="mt-5 border-[3px] border-[#B8D3BF] bg-[#EAF5EC] p-4">
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#7CA38A]">
                  Final Forecast Decision
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button
                    onClick={lockForecast}
                    disabled={forecastLocked}
                  >
                    Use this method
                  </Button>

                  {forecastLocked && (
                    <p className="border-2 border-[#A7CEB1] bg-white/75 px-3 py-2 text-sm font-bold text-[#5D8B6A]">
                      Forecast for week 13: about{' '}
                      {Math.round(nextWeek)} tickets.
                    </p>
                  )}
                </div>

                {forecastMsg && (
                  <p
                    role="alert"
                    className="mt-4 border-l-4 border-[#D9A0B6] bg-[#FBE8EF] p-4 text-sm font-semibold leading-relaxed text-[#A36881]"
                  >
                    {forecastMsg}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </GameFrame>
  );
}

export default FestivalForecast;
