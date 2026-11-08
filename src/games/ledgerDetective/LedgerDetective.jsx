import { useState } from 'react';
import Button from '../../components/ui/Button';
import GameFrame from '../../components/games/GameFrame';

// Four weeks of sales at the festival market. This data is made up for the game.
// price and cost are per item. Honey jars cost much more to make in week 3 (the culprit).
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
  })),
);

const METRICS = {
  profit: { label: 'Profit', money: true, value: (g) => g.revenue - g.cost },
  revenue: { label: 'Revenue', money: true, value: (g) => g.revenue },
  cost: { label: 'Total cost', money: true, value: (g) => g.cost },
  units: { label: 'Items sold', money: false, value: (g) => g.units },
  price: { label: 'Average price per item', money: true, value: (g) => g.revenue / g.units },
  unitCost: { label: 'Average cost per item', money: true, value: (g) => g.cost / g.units },
};

const GROUPS = { week: 'Week', stall: 'Stall', product: 'Product' };

function formatValue(metric, v) {
  const m = METRICS[metric];
  const rounded = Math.round(v * 100) / 100;
  return m.money ? `$${rounded.toFixed(2)}` : String(Math.round(v));
}

function summarize(rows, groupBy, metric) {
  const groups = new Map();
  rows.forEach((r) => {
    const key = groupBy === 'week' ? `Week ${r.week}` : groupBy === 'stall' ? r.stall : r.product;
    if (!groups.has(key)) groups.set(key, { label: key, units: 0, revenue: 0, cost: 0 });
    const g = groups.get(key);
    g.units += r.units;
    g.revenue += r.revenue;
    g.cost += r.cost;
  });
  return [...groups.values()].map((g) => ({ label: g.label, value: METRICS[metric].value(g) }));
}

const CAUSES = [
  { id: 'units', text: 'Customers bought fewer items' },
  { id: 'price', text: 'The selling price was cut' },
  { id: 'cost', text: 'Each item cost more to make' },
];

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
    (r) => (week === 'all' || r.week === Number(week)) && (stall === 'all' || r.stall === stall),
  );
  const data = summarize(rows, groupBy, metric);
  const max = Math.max(...data.map((d) => d.value), 0.0001);

  function fileReport() {
    if (!culprit || !cause) {
      setFeedback('Choose both a stall and a cause before you file the report.');
    } else if (culprit !== 'Honey Stand') {
      setFeedback('That stall\'s numbers look steady. Filter to week 3, group by stall, and look for the stall whose profit fell the most.');
    } else if (cause !== 'cost') {
      setFeedback('Right stall, but check the cause. For the Honey Stand, compare items sold, average price and average cost per item across the four weeks.');
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
      <div className="rounded-sm border-4 border-wood bg-parchment p-4">
        <h3 className="mb-2 font-display text-xl font-bold text-bark">Investigate the data</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="font-bold">Group by</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="mt-1 w-full rounded-sm border-4 border-bark bg-cream p-2"
            >
              {Object.entries(GROUPS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-bold">Show</span>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="mt-1 w-full rounded-sm border-4 border-bark bg-cream p-2"
            >
              {Object.entries(METRICS).map(([id, m]) => (
                <option key={id} value={id}>{m.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-bold">Week</span>
            <select
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              className="mt-1 w-full rounded-sm border-4 border-bark bg-cream p-2"
            >
              <option value="all">All weeks</option>
              {[1, 2, 3, 4].map((w) => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-bold">Stall</span>
            <select
              value={stall}
              onChange={(e) => setStall(e.target.value)}
              className="mt-1 w-full rounded-sm border-4 border-bark bg-cream p-2"
            >
              <option value="all">All stalls</option>
              {STALLS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>

        <h4 className="mt-4 font-display text-lg font-bold text-bark">
          {METRICS[metric].label} by {GROUPS[groupBy].toLowerCase()}
          {week !== 'all' ? `, week ${week}` : ''}
          {stall !== 'all' ? `, ${stall}` : ''}
        </h4>

        <table className="mt-2 w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="border-b-4 border-wood p-2">{GROUPS[groupBy]}</th>
              <th className="border-b-4 border-wood p-2">{METRICS[metric].label}</th>
              <th className="border-b-4 border-wood p-2">
                <span className="sr-only">Bar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <td className="border-b-2 border-wood/40 p-2">{d.label}</td>
                <td className="border-b-2 border-wood/40 p-2 font-bold">{formatValue(metric, d.value)}</td>
                <td className="w-1/2 border-b-2 border-wood/40 p-2" aria-hidden="true">
                  <div
                    className="h-5 rounded-sm border-2 border-bark bg-forest"
                    style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-sm border-4 border-wood bg-parchment p-4">
        <h3 className="mb-2 font-display text-xl font-bold text-bark">File your report</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="font-bold">Which stall caused the drop?</span>
            <select
              value={culprit}
              onChange={(e) => setCulprit(e.target.value)}
              className="mt-1 w-full rounded-sm border-4 border-bark bg-cream p-2"
            >
              <option value="">Choose a stall</option>
              {STALLS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-bold">What changed?</span>
            <select
              value={cause}
              onChange={(e) => setCause(e.target.value)}
              className="mt-1 w-full rounded-sm border-4 border-bark bg-cream p-2"
            >
              <option value="">Choose a cause</option>
              {CAUSES.map((c) => (
                <option key={c.id} value={c.id}>{c.text}</option>
              ))}
            </select>
          </label>
        </div>
        <Button className="mt-3" onClick={fileReport} disabled={won}>
          File the report
        </Button>
        <div role="status" aria-live="polite" className="mt-2 font-bold text-coral">
          {feedback}
        </div>
      </div>
    </GameFrame>
  );
}

export default LedgerDetective;