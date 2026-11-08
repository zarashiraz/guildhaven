import { useState } from 'react';
import Button from '../../components/ui/Button';
import GameFrame from '../../components/games/GameFrame';

const BUDGET = 14; // work days available before the festival

const REQS = [
  { id: 'online', name: 'Online ticket booking', days: 4 },
  { id: 'paper', name: 'Paper tickets at the gate', days: 2 },
  { id: 'phone', name: 'Phone booking line', days: 3 },
  { id: 'stage', name: 'Live music stage', days: 4 },
  { id: 'quiet', name: 'Quiet reading corner', days: 2 },
  { id: 'food', name: 'Food stalls', days: 3 },
  { id: 'kids', name: 'Free entry for kids', days: 1 },
  { id: 'fire', name: 'Late-night fireworks', days: 3 },
  { id: 'recycle', name: 'Recycling stations', days: 1 },
];

// needs: every group must be covered, and a group is covered if ANY requirement in it is chosen.
// blocks: the stakeholder will not sign off if any of these is chosen.
const PEOPLE = [
  {
    name: 'Mayor Elm',
    says: '"Keep it safe, green and open to every family. No fireworks. The permit alone would eat our budget."',
    needs: [['kids'], ['recycle']],
    blocks: ['fire'],
  },
  {
    name: 'Mira the Baker',
    says: '"I need food stalls, and people must be able to book their tickets ahead of time."',
    needs: [['food'], ['online', 'phone']],
    blocks: [],
  },
  {
    name: 'Old Fox',
    says: '"Half the elders do not use the internet. They still need a way to get tickets."',
    needs: [['paper', 'phone']],
    blocks: [],
  },
  {
    name: 'Tomas the Musician',
    says: '"I need a stage. The music is the whole point of the festival!"',
    needs: [['stage']],
    blocks: [],
  },
  {
    name: 'Librarian Wren',
    says: '"I would like a quiet corner. And no fireworks, they frighten the library cats."',
    needs: [['quiet']],
    blocks: ['fire'],
  },
];

const nameOf = (id) => REQS.find((r) => r.id === id).name;

function statusFor(person, chosen) {
  const refused = person.blocks.filter((id) => chosen.includes(id));
  if (refused.length > 0) {
    return { ok: false, text: `Refuses to sign: you included ${refused.map(nameOf).join(', ')}.` };
  }
  const missing = person.needs.filter((group) => !group.some((id) => chosen.includes(id)));
  if (missing.length > 0) {
    return {
      ok: false,
      text: `Not yet. Still needs: ${missing.map((g) => g.map(nameOf).join(' or ')).join('; ')}.`,
    };
  }
  return { ok: true, text: 'Signed off.' };
}

function StakeholderSummit({ onComplete }) {
  const [chosen, setChosen] = useState([]);
  const [message, setMessage] = useState('');
  const [won, setWon] = useState(false);

  const used = REQS.filter((r) => chosen.includes(r.id)).reduce((sum, r) => sum + r.days, 0);
  const over = used - BUDGET;
  const statuses = PEOPLE.map((p) => statusFor(p, chosen));
  const signedCount = statuses.filter((s) => s.ok).length;

  function toggle(id) {
    setChosen((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
    setMessage('');
  }

  function present() {
    if (over > 0) {
      setMessage(`The plan is ${over} work day${over === 1 ? '' : 's'} over budget. Cut something or find a cheaper way.`);
    } else if (signedCount < PEOPLE.length) {
      setMessage(`Only ${signedCount} of ${PEOPLE.length} people signed off. Read what each one still needs.`);
    } else {
      setMessage('');
      setWon(true);
    }
  }

  // Traceability: which chosen requirement serves which stakeholder.
  const trace = REQS.filter((r) => chosen.includes(r.id)).map((r) => ({
    req: r,
    who: PEOPLE.filter((p) => p.needs.some((g) => g.includes(r.id))).map((p) => p.name),
  }));

  return (
    <GameFrame
      title="The Stakeholder Summit"
      howToPlay={[
        'Five villagers are planning the Guildhaven festival, and each wants something different.',
        `You have ${BUDGET} work days to build things. Tick the features that go in the plan.`,
        'Each villager shows live whether they would sign off, and what is missing or what they refuse.',
        'Look for features that satisfy more than one person. Then press "Present the plan".',
      ]}
      hint="Two people need a way to get tickets, but they need different things. Is there one feature that covers both of them for less than the two separate features cost? Also, nobody needs the fireworks, and two people refuse them."
      won={won}
      winMessage="Everyone signed off and you stayed in budget. Finding one requirement that serves several stakeholders is exactly what a business analyst does."
      onComplete={onComplete}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <fieldset className="rounded-sm border-4 border-wood bg-parchment p-4">
          <legend className="px-1 font-display text-xl font-bold text-bark">Features for the plan</legend>
          <ul className="space-y-1">
            {REQS.map((r) => (
              <li key={r.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-sm p-1 hover:bg-cream">
                  <input
                    type="checkbox"
                    checked={chosen.includes(r.id)}
                    onChange={() => toggle(r.id)}
                    className="h-5 w-5 accent-forest"
                  />
                  <span className="flex-1">{r.name}</span>
                  <span className="font-bold">{r.days} day{r.days === 1 ? '' : 's'}</span>
                </label>
              </li>
            ))}
          </ul>

          <div className="mt-3">
            <p className="font-bold">
              Work days used: {used} of {BUDGET}
              {over > 0 && <span className="text-coral"> (over budget by {over})</span>}
            </p>
            <div
              role="progressbar"
              aria-label="Work days used"
              aria-valuemin={0}
              aria-valuemax={BUDGET}
              aria-valuenow={Math.min(used, BUDGET)}
              aria-valuetext={`${used} of ${BUDGET} work days used`}
              className="mt-1 h-5 w-full overflow-hidden rounded-sm border-4 border-bark bg-cream"
            >
              <div
                className={`h-full ${over > 0 ? 'bg-coral' : 'bg-forest'}`}
                style={{ width: `${Math.min(100, (used / BUDGET) * 100)}%` }}
              />
            </div>
          </div>
        </fieldset>

        <div className="space-y-3">
          <h3 className="font-display text-xl font-bold text-bark">
            The stakeholders ({signedCount} of {PEOPLE.length} signed off)
          </h3>
          <ul className="space-y-3">
            {PEOPLE.map((p, i) => (
              <li
                key={p.name}
                className={`rounded-sm border-4 p-3 ${statuses[i].ok ? 'border-forest bg-parchment' : 'border-bark bg-cream'}`}
              >
                <p className="font-display text-lg font-bold text-bark">
                  {statuses[i].ok ? '✓ ' : '○ '}
                  {p.name}
                </p>
                <p className="italic">{p.says}</p>
                <p className={`mt-1 font-bold ${statuses[i].ok ? 'text-forest' : 'text-bark'}`}>{statuses[i].text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <Button onClick={present} disabled={won}>
          Present the plan
        </Button>
        <div role="status" aria-live="polite" className="mt-2 font-bold text-coral">
          {message}
        </div>
      </div>

      {won && (
        <div className="rounded-sm border-4 border-wood bg-parchment p-4">
          <h3 className="font-display text-xl font-bold text-bark">Requirements traceability</h3>
          <p className="mb-2">Business analysts keep a table like this to show why every feature is in the plan.</p>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="border-b-4 border-wood p-2">Feature</th>
                <th className="border-b-4 border-wood p-2">Days</th>
                <th className="border-b-4 border-wood p-2">Needed by</th>
              </tr>
            </thead>
            <tbody>
              {trace.map((row) => (
                <tr key={row.req.id}>
                  <td className="border-b-2 border-wood/40 p-2">{row.req.name}</td>
                  <td className="border-b-2 border-wood/40 p-2">{row.req.days}</td>
                  <td className="border-b-2 border-wood/40 p-2">{row.who.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GameFrame>
  );
}

export default StakeholderSummit;