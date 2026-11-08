
import { useState } from 'react';
import Button from '../../components/ui/Button';
import GameFrame from '../../components/games/GameFrame';

// Four weeks of sales at the festival market.
// This data is made up for the game.
const PRODUCTS = [
  { stall: 'Bakery', name: 'Bread', price: 4, cost: [1.5, 1.5, 1.5, 1.5], units: [120, 118, 122, 119] },
  { stall: 'Bakery', name: 'Pastry', price: 3, cost: [1, 1, 1, 1], units: [80, 52, 81, 79] },
  { stall: 'Honey Stand', name: 'Honey jars', price: 8, cost: [3, 3, 7.5, 3], units: [50, 52, 51, 50] },
  { stall: 'Honey Stand', name: 'Honey candy', price: 2, cost: [0.5, 0.5, 0.5, 0.5], units: [100, 98, 102, 100] },
  { stall: 'Candle Shop', name: 'Candles', price: 6, cost: [2.5, 2.5, 2.5, 2.5], units: [40, 42, 41, 40] },
  { stall: 'Candle Shop', name: 'Soap', price: 5, cost: [2, 2, 2, 2], units: [30, 31, 29, 30] },
  { stall: 'Tea Tent', name: 'Tea', price: 2.5, cost: [0.6, 0.6, 0.6, 0.6], units: [200, 205, 198, 202] },
  { stall: 'Tea Tent', name: 'Biscuits', price: 1.5, cost: [0.5, 0.5, 0.5, 0.5], units: [90, 88, 92, 91] },
];

const STALLS = ['Bakery', 'Honey Stand', 'Candle Shop', 'Tea Tent'];

const ROWS = PRODUCTS.flatMap((p) =>
  [0, 1, 2, 3].map((w) => ({
    week: w + 1,
    stall: p.stall,
    product: p.name,
    units: p.units[w],
    revenue: p.units[w] * p.price,
    cost: p.units[w] * p.cost[w],
  }))
);

const METRICS = {
  profit: {
    label: 'Profit',
    money: true,
    value: (g) => g.revenue - g.cost,
  },
  revenue: {
    label: 'Revenue',
    money: true,
    value: (g) => g.revenue,
  },
  cost: {
    label: 'Total cost',
    money: true,
    value: (g) => g.cost,
  },
  units: {
    label: 'Items sold',
    money: false,
    value: (g) => g.units,
  },
  price: {
    label: 'Average price per item',
    money: true,
    value: (g) => g.revenue / g.units,
  },
  unitCost: {
    label: 'Average cost per item',
    money: true,
    value: (g) => g.cost / g.units,
  },
};

const GROUPS = {
  week: 'Week',
  stall: 'Stall',
  product: 'Product',
};

function formatValue(metric, v) {
  const m = METRICS[metric];
  const rounded = Math.round(v * 100) / 100;

  return m.money
    ? `$${rounded.toFixed(2)}`
    : String(Math.round(v));
}

function summarize(rows, groupBy, metric) {
  const groups = new Map();

  rows.forEach((r) => {
    const key =
      groupBy === 'week'
        ? `Week ${r.week}`
        : groupBy === 'stall'
          ? r.stall
          : r.product;

    if (!groups.has(key)) {
      groups.set(key, {
        label: key,
        units: 0,
        revenue: 0,
        cost: 0,
      });
    }

    const g = groups.get(key);

    g.units += r.units;
    g.revenue += r.revenue;
    g.cost += r.cost;
  });

  return [...groups.values()].map((g) => ({
    label: g.label,
    value: METRICS[metric].value(g),
  }));
}

const CAUSES = [
  { id: 'units', text: 'Customers bought fewer items' },
  { id: 'price', text: 'The selling price was cut' },
  { id: 'cost', text: 'Each item cost more to make' },
];

const BAR_COLORS = [
  '#B6A0DC',
  '#E5A7BE',
  '#A7CDB7',
  '#A8CBE8',
  '#E9C88D',
  '#D8B4A4',
  '#C2B5E7',
  '#9BC9C9',
];

function DetectiveArt() {
  return (
    <svg
      viewBox="0 0 200 150"
      width="200"
      height="150"
      role="img"
      aria-label="Pixel-art detective notebook and magnifying glass"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect x="28" y="18" width="102" height="116" fill="#826B92" />
      <rect x="34" y="23" width="90" height="105" fill="#FFF8E9" />
      <rect x="44" y="35" width="64" height="8" fill="#D6BDE6" />
      <rect x="44" y="53" width="45" height="4" fill="#D8C8DA" />
      <rect x="44" y="65" width="55" height="4" fill="#D8C8DA" />
      <rect x="44" y="77" width="38" height="4" fill="#D8C8DA" />
      <rect x="44" y="89" width="50" height="4" fill="#D8C8DA" />
      <rect x="44" y="101" width="35" height="4" fill="#D8C8DA" />

      <rect x="20" y="29" width="15" height="6" fill="#E8C78C" />
      <rect x="20" y="48" width="15" height="6" fill="#E8C78C" />
      <rect x="20" y="67" width="15" height="6" fill="#E8C78C" />
      <rect x="20" y="86" width="15" height="6" fill="#E8C78C" />

      <rect x="105" y="30" width="56" height="56" fill="#715B80" />
      <rect x="112" y="37" width="42" height="42" fill="#B9DDEA" />
      <rect x="119" y="44" width="28" height="28" fill="#DFF3F6" />
      <rect x="149" y="80" width="12" height="14" fill="#715B80" />
      <rect x="156" y="90" width="13" height="13" fill="#715B80" />
      <rect x="165" y="99" width="13" height="27" fill="#B88C73" />

      <rect x="139" y="15" width="8" height="8" fill="#E5A7BE" />
      <rect x="174" y="45" width="7" height="7" fill="#A7CDB7" />
      <rect x="15" y="119" width="7" height="7" fill="#B6A0DC" />
    </svg>
  );
}

const selectClass =
  'mt-2 w-full cursor-pointer border-[3px] border-[#A48DAF] bg-white px-3 py-3 text-sm font-semibold text-[#66536F] outline-none transition-colors focus:border-[#796293] focus:bg-[#FFFCFF]';

function LedgerDetective({ onComplete }) {
  const [groupBy, setGroupBy] = useState('week');
  const [metric, setMetric] = useState('profit');
  const [week, setWeek] = useState('all');
  const [stall, setStall] = useState('all');

  const [culprit, setCulprit] = useState('');
  const [cause, setCause] = useState('');
  const [feedback, setFeedback] = useState('');
  const [won, setWon] = useState(false);

  const rows = ROWS.filter(
    (r) =>
      (week === 'all' || r.week === Number(week)) &&
      (stall === 'all' || r.stall === stall)
  );

  const data = summarize(rows, groupBy, metric);
  const max = Math.max(...data.map((d) => d.value), 0.0001);

  function fileReport() {
    if (!culprit || !cause) {
      setFeedback(
        'Choose both a stall and a cause before you file the report.'
      );
    } else if (culprit !== 'Honey Stand') {
      setFeedback(
        "That stall's numbers look steady. Filter to week 3, group by stall, and look for the stall whose profit fell the most."
      );
    } else if (cause !== 'cost') {
      setFeedback(
        'Right stall, but check the cause. For the Honey Stand, compare items sold, average price and average cost per item across the four weeks.'
      );
    } else {
      setFeedback('');
      setWon(true);
    }
  }

  return (
    <GameFrame
      title="The Ledger Detective"
      howToPlay={[
        'The festival market made less profit in week 3. Your job is to find out why.',
        'Use the controls to group and filter the sales data. The bars and the table show the same numbers.',
        'Watch out for red herrings: not every dip matters.',
        'When you know which stall and what changed, file your report.',
      ]}
      hint="Start with Group by: Week and Show: Profit to see the dip. Then set Week to 3 and group by Stall. Once you find the stall, filter to it, group by Week, and switch Show between Items sold, Average price and Average cost per item. Only one of them changes in week 3."
      won={won}
      winMessage="Case closed! The Honey Stand's cost per honey jar jumped in week 3, while sales and prices stayed the same. Splitting data by group and checking one measure at a time is how real analysts find the cause."
      onComplete={onComplete}
    >
      <div className="space-y-6 text-[#65546D]">

        {/* DETECTIVE HEADER */}
        <section
          className="overflow-hidden border-4 border-[#917C9C] bg-[#F6E9F8]"
          style={{ boxShadow: '5px 5px 0 #D9C7DB' }}
        >
          <div className="border-b-[3px] border-[#917C9C] bg-[#DCCBEC] px-4 py-2 text-center font-mono text-xs font-bold tracking-[0.2em] text-[#725D80]">
            GUILDHAVEN MARKET INVESTIGATION BUREAU
          </div>

          <div className="flex flex-col items-center justify-between gap-4 bg-gradient-to-br from-[#FBE5ED] via-[#FFF2DD] to-[#E4F0FA] px-5 py-6 sm:flex-row sm:px-8">
            <div>
              <span className="inline-block border-2 border-[#B9A3C7] bg-[#F4EAFB] px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#866C9C]">
                Business Investigation
              </span>

              <h2 className="mt-3 font-display text-3xl font-bold text-[#604C6C]">
                The Ledger Detective
              </h2>

              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#786780]">
                Something strange happened at the
                festival market in week 3.
                Follow the numbers and uncover the cause.
              </p>
            </div>

            <div className="shrink-0">
              <DetectiveArt />
            </div>
          </div>
        </section>

        {/* CASE BRIEF */}
        <section className="border-[3px] border-[#D6B4C6] bg-[#FFF0F5] p-4 sm:p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#B17A96]">
            Case File 001
          </p>

          <h3 className="mt-2 font-display text-xl font-bold text-[#815B72]">
            The mystery of the missing profit
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-[#806A78]">
            Four market stalls have submitted their sales
            records. Use the investigation tools to compare
            the numbers and identify what changed.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Bakery', color: '#FBE4EA' },
              { label: 'Honey Stand', color: '#FFF0D3' },
              { label: 'Candle Shop', color: '#E9E1F8' },
              { label: 'Tea Tent', color: '#DFF1E7' },
            ].map((item) => (
              <div
                key={item.label}
                className="border-2 border-[#BFAFC3] px-2 py-3 text-center font-display text-sm font-bold text-[#695672]"
                style={{ backgroundColor: item.color }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </section>

        {/* INVESTIGATION */}
        <section
          className="overflow-hidden border-4 border-[#947D9F] bg-[#F8F2FC]"
          style={{ boxShadow: '5px 5px 0 #D8C8DF' }}
        >
          <div className="border-b-[3px] border-[#947D9F] bg-[#E6D9F3] px-4 py-3 sm:px-5">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#9076A5]">
              Investigation Desk
            </p>

            <h3 className="mt-1 font-display text-2xl font-bold text-[#624D72]">
              Investigate the data
            </h3>
          </div>

          <div className="p-4 sm:p-5">
            {/* FILTER CONTROLS */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block border-2 border-[#D9C9E5] bg-[#F0E8F8] p-3">
                <span className="font-display text-sm font-bold text-[#78618D]">
                  Group by
                </span>

                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className={selectClass}
                >
                  {Object.entries(GROUPS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block border-2 border-[#E8C8D5] bg-[#FBEAF0] p-3">
                <span className="font-display text-sm font-bold text-[#A26D87]">
                  Show
                </span>

                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                  className={selectClass}
                >
                  {Object.entries(METRICS).map(([id, m]) => (
                    <option key={id} value={id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block border-2 border-[#BFD8CB] bg-[#E6F4EB] p-3">
                <span className="font-display text-sm font-bold text-[#6D987C]">
                  Week
                </span>

                <select
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  className={selectClass}
                >
                  <option value="all">All weeks</option>

                  {[1, 2, 3, 4].map((w) => (
                    <option key={w} value={w}>
                      Week {w}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block border-2 border-[#C5D7E9] bg-[#E7F1FA] p-3">
                <span className="font-display text-sm font-bold text-[#6688A7]">
                  Stall
                </span>

                <select
                  value={stall}
                  onChange={(e) => setStall(e.target.value)}
                  className={selectClass}
                >
                  <option value="all">All stalls</option>

                  {STALLS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* CHART HEADER */}
            <div className="mt-6 border-b-[3px] border-[#D8C9E2] pb-3">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#A28AAD]">
                Sales Records
              </p>

              <h4 className="mt-1 font-display text-xl font-bold text-[#654F73]">
                {METRICS[metric].label} by{' '}
                {GROUPS[groupBy].toLowerCase()}
                {week !== 'all' ? `, week ${week}` : ''}
                {stall !== 'all' ? `, ${stall}` : ''}
              </h4>
            </div>

            {/* DATA TABLE */}
            <div className="mt-4 overflow-x-auto border-[3px] border-[#D5C4DD] bg-white">
              <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                <thead className="bg-[#E8DDF3] text-[#66517A]">
                  <tr>
                    <th className="p-3 font-display">
                      {GROUPS[groupBy]}
                    </th>

                    <th className="p-3 font-display">
                      {METRICS[metric].label}
                    </th>

                    <th className="p-3">
                      <span className="sr-only">Bar</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data.map((d, i) => (
                    <tr
                      key={d.label}
                      className={
                        i % 2 === 0
                          ? 'bg-[#FFFCFF]'
                          : 'bg-[#F8F2FB]'
                      }
                    >
                      <td className="border-t border-[#E5D9E9] p-3 font-semibold text-[#66546D]">
                        {d.label}
                      </td>

                      <td className="border-t border-[#E5D9E9] p-3 font-mono font-bold text-[#725A83]">
                        {formatValue(metric, d.value)}
                      </td>

                      <td
                        className="w-1/2 border-t border-[#E5D9E9] p-3"
                        aria-hidden="true"
                      >
                        <div className="h-6 overflow-hidden border border-[#E1D7E8] bg-[#F0EAF4]">
                          <div
                            className="h-full border-r-2 border-[#89759D] transition-all duration-300"
                            style={{
                              width: `${Math.max(
                                2,
                                (d.value / max) * 100
                              )}%`,
                              backgroundColor:
                                BAR_COLORS[i % BAR_COLORS.length],
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-[#98849F]">
              Change the filters above to examine
              the same records from different angles.
            </p>
          </div>
        </section>

        {/* FINAL REPORT */}
        <section
          className="overflow-hidden border-4 border-[#B89D79] bg-[#FFF4DF]"
          style={{ boxShadow: '5px 5px 0 #E4D2B7' }}
        >
          <div className="border-b-[3px] border-[#B89D79] bg-[#F5DEB9] px-4 py-3 sm:px-5">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#A48660]">
              Detective's Findings
            </p>

            <h3 className="mt-1 font-display text-2xl font-bold text-[#80664F]">
              File your report
            </h3>
          </div>

          <div className="p-4 sm:p-5">
            <p className="mb-5 text-sm leading-relaxed text-[#8B7664]">
              Once you have identified the suspicious
              stall and the reason for the profit drop,
              submit your findings.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block border-2 border-[#E3CFAE] bg-[#FFF9EC] p-3">
                <span className="font-display text-sm font-bold text-[#886E55]">
                  Which stall caused the drop?
                </span>

                <select
                  value={culprit}
                  onChange={(e) => setCulprit(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Choose a stall</option>

                  {STALLS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block border-2 border-[#E3CFAE] bg-[#FFF9EC] p-3">
                <span className="font-display text-sm font-bold text-[#886E55]">
                  What changed?
                </span>

                <select
                  value={cause}
                  onChange={(e) => setCause(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Choose a cause</option>

                  {CAUSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.text}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5">
              <Button onClick={fileReport} disabled={won}>
                File the report
              </Button>
            </div>

            {feedback && (
              <div
                role="status"
                aria-live="polite"
                className="mt-4 border-l-4 border-[#D49AAD] bg-[#FBE6EC] p-4 text-sm font-semibold leading-relaxed text-[#9E617A]"
              >
                {feedback}
              </div>
            )}
          </div>
        </section>
      </div>
    </GameFrame>
  );
}

export default LedgerDetective;
