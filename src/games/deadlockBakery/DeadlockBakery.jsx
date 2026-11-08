import { useState } from 'react';
import Button from '../../components/ui/Button';
import GameFrame from '../GameFrame';

// The bakers share tools. Each baker needs TWO tools to bake one cake.
const BAKERS = [
  { name: 'Anna', tools: ['Oven', 'Mixer'] },
  { name: 'Ben', tools: ['Mixer', 'Scale'] },
  { name: 'Cleo', tools: ['Scale', 'Oven'] },
];

// Tries EVERY possible timing of the bakers' steps (every interleaving).
// threads = one list of steps per baker. A step is { t: 'lock' | 'unlock' | 'work' | 'read' | 'write', r? }.
// Returns: a deadlock (with the steps that cause it) if one exists, the possible final
// counter values, and the first run that ended with a counter different from `expected`.
function explore(threads, expected) {
  const seen = new Set();
  const finals = new Set();
  let deadlock = null;
  let bad = null;
  let states = 0;

  function step(state, i) {
    const op = threads[i][state.pcs[i]];
    if (!op) return null;
    if (op.t === 'lock' && state.owner[op.r] !== undefined) return null; // someone else holds it: wait
    const next = {
      pcs: [...state.pcs],
      tmps: [...state.tmps],
      counter: state.counter,
      owner: { ...state.owner },
    };
    next.pcs[i] += 1;
    let value;
    if (op.t === 'lock') next.owner[op.r] = i;
    if (op.t === 'unlock') delete next.owner[op.r];
    if (op.t === 'read') {
      next.tmps[i] = state.counter;
      value = state.counter;
    }
    if (op.t === 'write') {
      next.counter = state.tmps[i] + 1;
      value = next.counter;
    }
    return { next, op, value };
  }

  function visit(state, trace) {
    const key = JSON.stringify([state.pcs, state.tmps, state.counter, state.owner]);
    if (seen.has(key)) return;
    seen.add(key);
    states += 1;

    let moved = false;
    for (let i = 0; i < threads.length; i += 1) {
      const result = step(state, i);
      if (result) {
        moved = true;
        visit(result.next, [...trace, { i, op: result.op, value: result.value }]);
      }
    }

    if (!moved) {
      const allDone = state.pcs.every((pc, i) => pc >= threads[i].length);
      if (allDone) {
        finals.add(state.counter);
        if (expected !== undefined && state.counter !== expected && !bad) {
          bad = { trace, counter: state.counter };
        }
      } else if (!deadlock) {
        deadlock = { trace, state };
      }
    }
  }

  visit({ pcs: threads.map(() => 0), tmps: threads.map(() => 0), counter: 0, owner: {} }, []);
  return { deadlock, bad, finals: [...finals].sort(), states };
}

function describeStep(entry) {
  const name = BAKERS[entry.i].name;
  const { op, value } = entry;
  if (op.t === 'lock') return `${name} grabs the ${op.r}.`;
  if (op.t === 'unlock') return `${name} puts down the ${op.r}.`;
  if (op.t === 'work') return `${name} bakes a cake.`;
  if (op.t === 'read') return `${name} reads the cake counter and sees ${value}.`;
  return `${name} writes ${value} on the cake counter.`;
}

function whoIsStuck(state) {
  const lines = [];
  Object.entries(state.owner).forEach(([tool, i]) => {
    lines.push(`${BAKERS[i].name} is holding the ${tool}.`);
  });
  return lines;
}

function buildBakery(choices) {
  return BAKERS.map((b) => {
    const first = choices[b.name];
    const second = b.tools.find((t) => t !== first);
    return [
      { t: 'lock', r: first },
      { t: 'lock', r: second },
      { t: 'work' },
      { t: 'unlock', r: first },
      { t: 'unlock', r: second },
    ];
  });
}

function buildCounter(uses) {
  return ['Anna', 'Ben'].map((name) => {
    const steps = [{ t: 'read' }, { t: 'write' }];
    return uses[name]
      ? [{ t: 'lock', r: 'Counter lock' }, ...steps, { t: 'unlock', r: 'Counter lock' }]
      : steps;
  });
}

const HINT_ONE =
  'A freeze needs a circle of waiting: Anna waits for Ben, Ben waits for Cleo, Cleo waits for Anna. If every baker agrees on one order for the tools (say Oven, then Mixer, then Scale), nobody can be waiting for someone who is waiting for them.';
const HINT_TWO =
  'Both bakers must use the same lock. A lock only helps when everyone who touches the counter takes it, because a baker who skips the lock can still step in between the other baker\'s read and write.';

function DeadlockBakery({ onComplete }) {
  const [choices, setChoices] = useState({ Anna: 'Oven', Ben: 'Mixer', Cleo: 'Scale' });
  const [freeze, setFreeze] = useState(null); // result of the last bakery test
  const [partOneDone, setPartOneDone] = useState(false);
  const [uses, setUses] = useState({ Anna: false, Ben: false });
  const [race, setRace] = useState(null); // result of the last counter test
  const [won, setWon] = useState(false);

  function testBakery() {
    const res = explore(buildBakery(choices));
    setFreeze(res);
    if (!res.deadlock) setPartOneDone(true);
  }

  function testCounter() {
    const res = explore(buildCounter(uses), 2);
    setRace(res);
    if (!res.deadlock && res.finals.length === 1 && res.finals[0] === 2) setWon(true);
  }

  return (
    <GameFrame
      title="The Deadlock Bakery"
      howToPlay={[
        'Three bakers share three tools, and each baker needs two tools at once to bake a cake.',
        'Part 1: choose which tool each baker grabs first. Then test every possible timing.',
        'If the bakery can freeze (a deadlock), you will see the exact steps that cause it. Fix the order until no timing can freeze it.',
        'Part 2: two bakers add 1 to a shared cake counter. Decide who must use the counter lock so no cake is ever lost.',
      ]}
      hint={partOneDone ? HINT_TWO : HINT_ONE}
      won={won}
      winMessage="You fixed a deadlock with a consistent lock order, then fixed a race condition with a shared lock. Both ideas work the same way in Java with synchronized blocks."
      onComplete={onComplete}
    >
      <div className="rounded-sm border-4 border-wood bg-parchment p-4">
        <h3 className="font-display text-xl font-bold text-bark">Part 1: Stop the freeze</h3>
        <p className="mt-1">
          A baker grabs the first tool, then the second, bakes, then puts both down. If a tool is taken, the baker waits.
          A deadlock is when everyone waits forever.
        </p>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {BAKERS.map((b) => (
            <fieldset key={b.name} className="rounded-sm border-4 border-bark bg-cream p-3">
              <legend className="px-1 font-display text-lg font-bold text-bark">
                {b.name} needs the {b.tools[0]} and the {b.tools[1]}
              </legend>
              <p className="mb-1">Grabs first:</p>
              {b.tools.map((tool) => (
                <label key={tool} className="flex cursor-pointer items-center gap-2 py-1">
                  <input
                    type="radio"
                    name={`first-${b.name}`}
                    value={tool}
                    checked={choices[b.name] === tool}
                    onChange={() => {
                      setChoices((c) => ({ ...c, [b.name]: tool }));
                      setFreeze(null);
                    }}
                    className="h-5 w-5 accent-forest"
                  />
                  <span>{tool}</span>
                </label>
              ))}
              <p className="mt-1 text-base">
                Then grabs the {b.tools.find((t) => t !== choices[b.name])}.
              </p>
            </fieldset>
          ))}
        </div>

        <Button className="mt-3" onClick={testBakery}>
          Test every possible timing
        </Button>

        <div role="status" aria-live="polite" className="mt-3">
          {freeze && freeze.deadlock && (
            <div className="rounded-sm border-4 border-coral bg-cream p-3">
              <p className="font-display text-lg font-bold text-coral">
                ✗ The bakery can freeze! Here is one timing that does it:
              </p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-6">
                {freeze.deadlock.trace.map((entry, idx) => (
                  <li key={idx}>{describeStep(entry)}</li>
                ))}
              </ol>
              <p className="mt-2 font-bold">Now nobody can move:</p>
              <ul className="list-disc pl-6">
                {whoIsStuck(freeze.deadlock.state).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="mt-1">Everyone is waiting for a tool that someone else is holding.</p>
            </div>
          )}
          {freeze && !freeze.deadlock && (
            <p className="font-display text-lg font-bold text-forest">
              ✓ No timing can freeze the bakery. I checked all {freeze.states} situations.
            </p>
          )}
        </div>
      </div>

      {partOneDone && (
        <div className="rounded-sm border-4 border-wood bg-parchment p-4">
          <h3 className="font-display text-xl font-bold text-bark">Part 2: Do not lose a cake</h3>
          <p className="mt-1">
            Anna and Ben each add 1 to the shared cake counter. To do that, a baker reads the counter, then writes back
            what they read plus 1. The counter should end at 2. You can protect the steps with the counter lock.
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {['Anna', 'Ben'].map((name) => (
              <div key={name} className="rounded-sm border-4 border-bark bg-cream p-3">
                <label className="flex cursor-pointer items-center gap-2 font-display text-lg font-bold text-bark">
                  <input
                    type="checkbox"
                    checked={uses[name]}
                    onChange={(e) => {
                      setUses((u) => ({ ...u, [name]: e.target.checked }));
                      setRace(null);
                    }}
                    className="h-5 w-5 accent-forest"
                  />
                  {name} uses the counter lock
                </label>
                <ol className="mt-2 list-decimal pl-6 font-mono text-base">
                  {uses[name] && <li>grab the counter lock</li>}
                  <li>read the counter</li>
                  <li>write what you read + 1</li>
                  {uses[name] && <li>put down the counter lock</li>}
                </ol>
              </div>
            ))}
          </div>

          <Button className="mt-3" onClick={testCounter}>
            Test every possible timing
          </Button>

          <div role="status" aria-live="polite" className="mt-3">
            {race && race.finals.length > 0 && (
              <p className="font-display text-lg font-bold text-bark">
                Possible final counter values: {race.finals.join(' and ')} (checked {race.states} situations).
              </p>
            )}
            {race && race.bad && (
              <div className="mt-2 rounded-sm border-4 border-coral bg-cream p-3">
                <p className="font-display text-lg font-bold text-coral">
                  ✗ A cake can get lost! One timing ends with the counter at {race.bad.counter}, not 2:
                </p>
                <ol className="mt-1 list-decimal space-y-0.5 pl-6">
                  {race.bad.trace.map((entry, idx) => (
                    <li key={idx}>{describeStep(entry)}</li>
                  ))}
                </ol>
                <p className="mt-1">This is called a race condition (a lost update).</p>
              </div>
            )}
            {race && !race.bad && !race.deadlock && race.finals[0] === 2 && (
              <p className="font-display text-lg font-bold text-forest">
                ✓ Every possible timing ends at 2. No cake is ever lost.
              </p>
            )}
          </div>
        </div>
      )}
    </GameFrame>
  );
}

export default DeadlockBakery;