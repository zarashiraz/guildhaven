import { useRef, useState } from 'react';
import Button from '../../components/ui/Button';
import GameFrame from '../../components/games/GameFrame';
import { RUNNER_SOURCE, tests, starterCode, solution, rules, hint, VILLAGE_NODES } from './roadData';

const STORAGE_KEY = 'guildhaven-road-planner-code';
const TIME_LIMIT_MS = 2500;
const SHOW_SOLUTION_AFTER = 3;

function loadSavedCode() {
  try {
    return localStorage.getItem(STORAGE_KEY) || starterCode;
  } catch {
    return starterCode;
  }
}

function saveCode(code) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Storage can be blocked. The game still works without saving.
  }
}

// Runs the player's code in a Web Worker so an infinite loop cannot freeze the page.
function runInWorker(code, list) {
  return new Promise((resolve) => {
    const source = `${RUNNER_SOURCE}\nself.onmessage = function (e) { self.postMessage(runRoadTests(e.data.code, e.data.tests)); };`;
    const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    const worker = new Worker(url);

    function finish(result) {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(result);
    }

    const timer = setTimeout(
      () =>
        finish({
          fatal:
            'Your code took too long. Is there a loop that never ends, or are you trying every possible route?',
        }),
      TIME_LIMIT_MS,
    );

    worker.onmessage = (e) => finish(e.data);
    worker.onerror = (e) => finish({ fatal: `Your code crashed: ${e.message}` });
    worker.postMessage({ code, tests: list });
  });
}

function VillageMap({ roads, path }) {
  const pathPairs = new Set();
  if (path) {
    for (let i = 0; i + 1 < path.length; i += 1) {
      pathPairs.add(`${path[i]}|${path[i + 1]}`);
      pathPairs.add(`${path[i + 1]}|${path[i]}`);
    }
  }
  const onPath = (name) => Boolean(path && path.includes(name));

  return (
    <svg
      viewBox="0 0 580 270"
      className="mt-2 w-full rounded-sm border-2 border-wood bg-cream"
      aria-hidden="true"
    >
      {roads.map((r) => {
        const a = VILLAGE_NODES[r.a];
        const b = VILLAGE_NODES[r.b];
        const used = pathPairs.has(`${r.a}|${r.b}`);
        return (
          <g key={`${r.a}-${r.b}`}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={used ? '#2f6b3a' : '#8a6a43'}
              strokeWidth={used ? 6 : 3}
            />
            <text
              x={(a.x + b.x) / 2}
              y={(a.y + b.y) / 2 - 6}
              textAnchor="middle"
              fontSize="16"
              fontWeight="bold"
              fill="#3b2a1a"
            >
              {r.minutes}
            </text>
          </g>
        );
      })}
      {Object.entries(VILLAGE_NODES).map(([name, p]) => (
        <g key={name}>
          <circle
            cx={p.x}
            cy={p.y}
            r="14"
            fill={onPath(name) ? '#2f6b3a' : '#f3e6c8'}
            stroke="#3b2a1a"
            strokeWidth="3"
          />
          <text x={p.x} y={p.y + 32} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#3b2a1a">
            {name}
          </text>
        </g>
      ))}
    </svg>
  );
}

function RoadPlanner({ onComplete }) {
  const [code, setCode] = useState(loadSavedCode);
  const [result, setResult] = useState(null); // { fatal } or { results }
  const [running, setRunning] = useState(false);
  const [failedRuns, setFailedRuns] = useState(0);
  const [confirmSolution, setConfirmSolution] = useState(false);
  const [won, setWon] = useState(false);
  const escapeMode = useRef(false);
  const editorRef = useRef(null);

  const byId = {};
  if (result && result.results) result.results.forEach((r) => (byId[r.id] = r));
  const hasRun = Boolean(result && result.results);
  const happyCount = tests.filter((t) => byId[t.id]?.passed).length;

  function updateCode(next) {
    setCode(next);
    saveCode(next);
  }

  async function runTests() {
    if (running) return;
    setRunning(true);
    setConfirmSolution(false);
    const outcome = await runInWorker(code, tests);
    setResult(outcome);
    if (outcome.results && outcome.results.every((r) => r.passed)) {
      setWon(true);
    } else {
      setFailedRuns((n) => n + 1);
    }
    setRunning(false);
  }

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runTests();
      return;
    }
    if (e.key === 'Escape') {
      escapeMode.current = true;
      return;
    }
    if (e.key === 'Tab' && !e.shiftKey && !escapeMode.current) {
      e.preventDefault();
      const el = e.target;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      updateCode(`${code.slice(0, start)}  ${code.slice(end)}`);
      requestAnimationFrame(() => {
        if (editorRef.current) editorRef.current.setSelectionRange(start + 2, start + 2);
      });
      return;
    }
    escapeMode.current = false;
  }

  return (
    <GameFrame
      title="The Road Planner"
      howToPlay={[
        'Villagers want the fastest way between two places. You write the function that finds it.',
        'Edit shortestPath in the editor. It gets the list of roads, the start and the destination.',
        'Press "Plan the routes" (or Ctrl+Enter). Your code runs on every map below.',
        'Some maps are surprises. You only see them after you run your code.',
        'Get every map right to finish the quest.',
      ]}
      hint={hint}
      won={won}
      winMessage="Every route was the fastest one, even on the giant map. You wrote Dijkstra's shortest path algorithm."
      onComplete={onComplete}
    >
      <div className="rounded-sm border-4 border-wood bg-parchment p-4">
        <h3 className="mb-2 font-display text-xl font-bold text-bark">The rules</h3>
        <ul className="list-disc space-y-1 pl-6">
          {rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <p className="mt-2">
          You write plain JavaScript. The <code>type</code> lines in the starter code are TypeScript. They only describe the
          shape of the data, so you can read them like a label.
        </p>
      </div>

      <div>
        <label htmlFor="rp-editor" className="mb-1 block font-display text-xl font-bold text-bark">
          Your code
        </label>
        <textarea
          id="rp-editor"
          ref={editorRef}
          value={code}
          onChange={(e) => updateCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-describedby="rp-editor-help"
          className="h-96 w-full resize-y rounded-sm border-4 border-bark bg-ink p-3 font-mono text-base leading-relaxed text-cream"
        />
        <p id="rp-editor-help" className="mt-1 text-base">
          Tab inserts two spaces. To move on with the keyboard, press Esc and then Tab. Ctrl+Enter runs your code.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={runTests} disabled={running}>
            {running ? 'Planning…' : 'Plan the routes'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              updateCode(starterCode);
              setResult(null);
            }}
            disabled={running}
          >
            Start over
          </Button>
          {failedRuns >= SHOW_SOLUTION_AFTER && !confirmSolution && (
            <Button variant="secondary" onClick={() => setConfirmSolution(true)}>
              Show me a working answer
            </Button>
          )}
        </div>

        {confirmSolution && (
          <div className="mt-3 rounded-sm border-4 border-gold bg-parchment p-3">
            <p>This replaces your code with a working answer. Are you sure?</p>
            <div className="mt-2 flex gap-3">
              <Button
                onClick={() => {
                  updateCode(solution);
                  setConfirmSolution(false);
                  setResult(null);
                }}
              >
                Yes, show it
              </Button>
              <Button variant="secondary" onClick={() => setConfirmSolution(false)}>
                Keep my code
              </Button>
            </div>
          </div>
        )}
      </div>

      <div role="status" aria-live="polite" className="font-display text-xl font-bold text-bark">
        {running && 'The villagers are waiting for directions…'}
        {!running && result?.fatal && <span className="text-coral">Problem: {result.fatal}</span>}
        {!running && hasRun && (
          <span>
            {happyCount} of {tests.length} maps solved.
          </span>
        )}
      </div>

      <div>
        <h3 className="mb-2 font-display text-xl font-bold text-bark">The maps</h3>
        <ul className="space-y-3">
          {tests.map((t) => {
            const r = byId[t.id];
            const revealed = !t.surprise || Boolean(r);
            return (
              <li key={t.id} className="rounded-sm border-4 border-bark bg-parchment p-3">
                <p className="font-display text-lg font-bold text-bark">
                  {r ? (r.passed ? '✓ Solved: ' : '✗ Not yet: ') : 'Waiting: '}
                  {t.name}
                </p>
                <p>{t.story}</p>

                {!revealed && <p className="mt-1 italic">Surprise map. You will see it after you run your code.</p>}

                {revealed && (
                  <div className="mt-2 rounded-sm bg-cream p-2">
                    <p>
                      <strong>Go from</strong> {t.from} <strong>to</strong> {t.to}
                    </p>
                    {t.hideRoads ? (
                      <p>{t.roads.length} roads (too many to list).</p>
                    ) : (
                      <ul className="mt-1 list-disc pl-6">
                        {t.roads.map((road, i) => (
                          <li key={i}>
                            {road.a} to {road.b}: {road.minutes} min
                          </li>
                        ))}
                      </ul>
                    )}
                    {t.map && <VillageMap roads={t.roads} path={r?.got?.path} />}
                    <p className="mt-1">
                      <strong>Expects:</strong> {t.expectText}
                    </p>
                    {r && r.passed && <p className="font-bold text-forest">✓ {r.message}</p>}
                    {r && !r.passed && <p className="font-bold text-coral">✗ {r.message}</p>}
                    {r && r.got && r.got.path && (
                      <p>
                        Your route: {r.got.path.length > 12 ? `${r.got.path.length} stops` : r.got.path.join(' → ')} (
                        {String(r.got.minutes)} min)
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </GameFrame>
  );
}

export default RoadPlanner;