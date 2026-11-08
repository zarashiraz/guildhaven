
import { useRef, useState } from 'react';
import Button from '../../components/ui/Button';
import GameFrame from '../../components/games/GameFrame';
import {
  RUNNER_SOURCE,
  tests,
  starterCode,
  solution,
  rules,
  hint,
  VILLAGE_NODES,
} from './roadData';

const STORAGE_KEY = 'guildhaven-road-planner-code';
const TIME_LIMIT_MS = 2500;
const SHOW_SOLUTION_AFTER = 3;

const C = {
  ink: '#625D64',
  muted: '#89818B',
  sage: '#8EAD97',
  sageDark: '#668A73',
  lilac: '#B4A3C5',
  blue: '#A8BED2',
  rose: '#D8B1B7',
  cream: '#FAF7EF',
  parchment: '#F2EDE2',
  border: '#B9AE9F',
};

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

// Runs the player's code in a Web Worker so an infinite loop
// cannot freeze the page.
function runInWorker(code, list) {
  return new Promise((resolve) => {
    const source = `${RUNNER_SOURCE}\nself.onmessage = function (e) { self.postMessage(runRoadTests(e.data.code, e.data.tests)); };`;
    const url = URL.createObjectURL(
      new Blob([source], { type: 'text/javascript' })
    );
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
      TIME_LIMIT_MS
    );

    worker.onmessage = (e) => finish(e.data);
    worker.onerror = (e) =>
      finish({ fatal: `Your code crashed: ${e.message}` });

    worker.postMessage({ code, tests: list });
  });
}

function PixelCompass() {
  return (
    <svg
      viewBox="0 0 100 100"
      width="100"
      height="100"
      aria-hidden="true"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect x="42" y="4" width="16" height="10" fill="#B7A0C5" />
      <rect x="45" y="14" width="10" height="12" fill="#C7B4D1" />
      <rect x="42" y="26" width="16" height="10" fill="#B7A0C5" />
      <rect x="26" y="42" width="10" height="16" fill="#A5BBD0" />
      <rect x="14" y="45" width="12" height="10" fill="#B9CBDA" />
      <rect x="4" y="42" width="10" height="16" fill="#A5BBD0" />
      <rect x="64" y="42" width="10" height="16" fill="#A5BBD0" />
      <rect x="74" y="45" width="12" height="10" fill="#B9CBDA" />
      <rect x="86" y="42" width="10" height="16" fill="#A5BBD0" />
      <rect x="42" y="64" width="16" height="10" fill="#9DBAA4" />
      <rect x="45" y="74" width="10" height="12" fill="#B7D1BB" />
      <rect x="42" y="86" width="16" height="10" fill="#9DBAA4" />
      <rect x="36" y="36" width="28" height="28" fill="#D7C9B4" />
      <rect x="42" y="42" width="16" height="16" fill="#FAF7EF" />
      <rect x="47" y="47" width="6" height="6" fill="#A38BB2" />
    </svg>
  );
}

function PixelLandmark({ type = 'house' }) {
  if (type === 'tree') {
    return (
      <g style={{ imageRendering: 'pixelated' }}>
        <rect x="-3" y="-23" width="6" height="19" fill="#927A66" />
        <rect x="-14" y="-29" width="28" height="13" fill="#A8C5A7" />
        <rect x="-9" y="-37" width="18" height="10" fill="#8FAF94" />
        <rect x="-4" y="-42" width="8" height="7" fill="#8FAF94" />
        <rect x="-11" y="-25" width="6" height="5" fill="#D0E2C9" />
      </g>
    );
  }

  if (type === 'tower') {
    return (
      <g style={{ imageRendering: 'pixelated' }}>
        <rect x="-13" y="-31" width="26" height="27" fill="#B5A8C6" />
        <rect x="-17" y="-38" width="34" height="9" fill="#9786AF" />
        <rect x="-17" y="-44" width="7" height="8" fill="#9786AF" />
        <rect x="-3" y="-44" width="6" height="8" fill="#9786AF" />
        <rect x="10" y="-44" width="7" height="8" fill="#9786AF" />
        <rect x="-4" y="-24" width="8" height="10" fill="#E8DFD3" />
        <rect x="-5" y="-13" width="10" height="9" fill="#8B7A9F" />
      </g>
    );
  }

  return (
    <g style={{ imageRendering: 'pixelated' }}>
      <rect x="-15" y="-21" width="30" height="18" fill="#E2C5B5" />
      <rect x="-20" y="-27" width="40" height="7" fill="#C69CA9" />
      <rect x="-14" y="-34" width="28" height="7" fill="#C69CA9" />
      <rect x="-5" y="-14" width="10" height="11" fill="#A88D86" />
      <rect x="-12" y="-16" width="5" height="6" fill="#F8F2DC" />
      <rect x="7" y="-16" width="5" height="6" fill="#F8F2DC" />
    </g>
  );
}

function VillageMap({ roads, path }) {
  const pathPairs = new Set();

  if (path) {
    for (let i = 0; i + 1 < path.length; i += 1) {
      pathPairs.add(`${path[i]}|${path[i + 1]}`);
      pathPairs.add(`${path[i + 1]}|${path[i]}`);
    }
  }

  const onPath = (name) =>
    Boolean(path && path.includes(name));

  const entries = Object.entries(VILLAGE_NODES);

  return (
    <div className="overflow-hidden border-[3px] border-[#B7C3B2] bg-[#EAF0E7]">
      <div className="flex items-center justify-between border-b-2 border-[#C8D2C5] bg-[#DCE8DB] px-3 py-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#728A77]">
          Village Route Map
        </span>
        <span className="font-mono text-[10px] text-[#839B87]">
          Guildhaven / North District
        </span>
      </div>

      <svg
        viewBox="0 0 580 270"
        className="block w-full"
        aria-hidden="true"
        style={{ imageRendering: 'pixelated' }}
      >
        <defs>
          <pattern
            id="road-map-grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#DFE8DA"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect
          width="580"
          height="270"
          fill="#EFF2E7"
        />
        <rect
          width="580"
          height="270"
          fill="url(#road-map-grid)"
        />

        <path
          d="M0 215 Q100 185 180 215 T350 210 T580 190"
          fill="none"
          stroke="#D6E5E9"
          strokeWidth="20"
          opacity="0.75"
        />
        <path
          d="M0 215 Q100 185 180 215 T350 210 T580 190"
          fill="none"
          stroke="#BBD5DF"
          strokeWidth="8"
          opacity="0.8"
        />

        {[
          [38, 50],
          [528, 45],
          [85, 228],
          [490, 226],
        ].map(([x, y], i) => (
          <g key={`decor-${i}`} transform={`translate(${x}, ${y})`}>
            <PixelLandmark type="tree" />
          </g>
        ))}

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
                stroke={used ? '#658F75' : '#C3B6A4'}
                strokeWidth={used ? 10 : 7}
                strokeLinecap="square"
              />

              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={used ? '#A9C9AE' : '#E6DCCB'}
                strokeWidth={used ? 5 : 3}
                strokeDasharray={used ? 'none' : '6 5'}
              />

              <g
                transform={`translate(${(a.x + b.x) / 2}, ${(a.y + b.y) / 2 - 7})`}
              >
                <rect
                  x="-15"
                  y="-11"
                  width="30"
                  height="21"
                  fill={used ? '#DDEDE0' : '#FFF9EF'}
                  stroke={used ? '#8DAE94' : '#C7BBAA'}
                  strokeWidth="1.5"
                />

                <text
                  textAnchor="middle"
                  y="4"
                  fontSize="12"
                  fontWeight="bold"
                  fill={used ? '#557961' : '#807264'}
                >
                  {r.minutes}
                </text>
              </g>
            </g>
          );
        })}

        {entries.map(([name, p], i) => {
          const active = onPath(name);

          return (
            <g key={name}>
              <g transform={`translate(${p.x}, ${p.y - 8})`}>
                <PixelLandmark
                  type={
                    i % 3 === 0
                      ? 'tower'
                      : i % 3 === 1
                        ? 'house'
                        : 'tree'
                  }
                />
              </g>

              <circle
                cx={p.x}
                cy={p.y}
                r="11"
                fill={active ? '#779F83' : '#FFF9EF'}
                stroke={active ? '#557A61' : '#A99A88'}
                strokeWidth="3"
              />

              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                fill={active ? '#E9F6E9' : '#B7A8BE'}
              />

              <text
                x={p.x}
                y={p.y + 31}
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill="#625D64"
                stroke="#EFF2E7"
                strokeWidth="4"
                paintOrder="stroke"
              >
                {name}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-4 border-t-2 border-[#C8D2C5] bg-[#F5F7EF] px-4 py-2 text-xs text-[#7D8B7B]">
        <span className="flex items-center gap-2">
          <span className="h-2 w-5 bg-[#A9C9AE]" />
          Selected route
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-5 bg-[#C3B6A4]" />
          Other roads
        </span>
        <span>Numbers show travel minutes</span>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.17em] text-[#928A8D]">
      {children}
    </p>
  );
}

function RoadPlanner({ onComplete }) {
  const [code, setCode] = useState(loadSavedCode);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [failedRuns, setFailedRuns] = useState(0);
  const [confirmSolution, setConfirmSolution] = useState(false);
  const [won, setWon] = useState(false);

  const escapeMode = useRef(false);
  const editorRef = useRef(null);

  const byId = {};

  if (result && result.results) {
    result.results.forEach((r) => {
      byId[r.id] = r;
    });
  }

  const hasRun = Boolean(result && result.results);
  const happyCount = tests.filter(
    (t) => byId[t.id]?.passed
  ).length;

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

    if (
      outcome.results &&
      outcome.results.every((r) => r.passed)
    ) {
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

    if (
      e.key === 'Tab' &&
      !e.shiftKey &&
      !escapeMode.current
    ) {
      e.preventDefault();

      const el = e.target;
      const start = el.selectionStart;
      const end = el.selectionEnd;

      updateCode(
        `${code.slice(0, start)}  ${code.slice(end)}`
      );

      requestAnimationFrame(() => {
        if (editorRef.current) {
          editorRef.current.setSelectionRange(
            start + 2,
            start + 2
          );
        }
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
      <div className="space-y-5 text-[#625D64]">

        {/* CARTOGRAPHER HEADER */}
        <section className="overflow-hidden border-[3px] border-[#B6ADA6] bg-[#F4F0E7]">
          <div className="border-b-2 border-[#D5CCC2] bg-[#EAE4D9] px-4 py-2">
            <SectionLabel>
              Guildhaven Cartographer's Workshop
            </SectionLabel>
          </div>

          <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-7">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#9A9087]">
                Route Planning / Field Notes
              </p>

              <h2 className="mt-2 font-display text-3xl font-bold text-[#70645E]">
                The Road Planner
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#877D77]">
                Every village has a destination.
                Find the quickest paths through
                Guildhaven's winding roads.
              </p>
            </div>

            <div className="hidden shrink-0 sm:block">
              <PixelCompass />
            </div>
          </div>
        </section>

        {/* RULES */}
        <section className="border-[3px] border-[#BEC8B8] bg-[#F5F7F0] p-5 sm:p-6">
          <SectionLabel>
            Cartographer's Handbook / Instructions
          </SectionLabel>

          <h3 className="mt-2 font-display text-xl font-bold text-[#617966]">
            The rules
          </h3>

          <ul className="mt-4 space-y-2">
            {rules.map((rule, i) => (
              <li
                key={rule}
                className="flex gap-3 border-b border-[#E0E7DB] pb-2 text-sm leading-relaxed text-[#6C796C] last:border-b-0"
              >
                <span className="shrink-0 font-mono text-xs font-bold text-[#91A994]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-l-4 border-[#B5A7C1] bg-[#F0ECF3] p-4 text-sm leading-relaxed text-[#81748B]">
            You write plain JavaScript. The{' '}
            <code className="font-semibold">type</code>{' '}
            lines in the starter code are TypeScript.
            They only describe the shape of the data,
            so you can read them like a label.
          </div>
        </section>

        {/* CODE EDITOR */}
        <section className="overflow-hidden border-[3px] border-[#A5ADA8] bg-[#F8F7F1]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#D1D8D1] bg-[#E7ECE7] px-5 py-4">
            <div>
              <SectionLabel>
                Workshop Desk / Route Algorithm
              </SectionLabel>
              <h3 className="mt-1 font-display text-xl font-bold text-[#637569]">
                Your code
              </h3>
            </div>

            <span className="border-2 border-[#C2D0C3] bg-[#F5F8F2] px-3 py-2 font-mono text-xs text-[#758A78]">
              shortestPath.js
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <label htmlFor="rp-editor" className="sr-only">
              Your code
            </label>

            <div className="overflow-hidden border-[3px] border-[#53645B] bg-[#27342E]">
              <div className="flex items-center justify-between border-b border-[#53645B] bg-[#34463B] px-4 py-3">
                <span className="font-mono text-xs font-bold text-[#C7DACB]">
                  route_planner.js
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#91AE99]">
                  JavaScript Editor
                </span>
              </div>

              <textarea
                id="rp-editor"
                ref={editorRef}
                value={code}
                onChange={(e) =>
                  updateCode(e.target.value)
                }
                onKeyDown={handleKeyDown}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                aria-describedby="rp-editor-help"
                className="block h-96 w-full resize-y border-0 bg-[#27342E] p-4 font-mono text-sm leading-7 text-[#E1ECE0] outline-none focus:bg-[#2D3B33]"
              />
            </div>

            <p
              id="rp-editor-help"
              className="mt-3 text-xs leading-relaxed text-[#8B9589]"
            >
              Tab inserts two spaces. To move on with
              the keyboard, press Esc and then Tab.
              Ctrl+Enter runs your code.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                onClick={runTests}
                disabled={running}
              >
                {running
                  ? 'Planning…'
                  : 'Plan the routes'}
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

              {failedRuns >= SHOW_SOLUTION_AFTER &&
                !confirmSolution && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setConfirmSolution(true)
                    }
                  >
                    Show me a working answer
                  </Button>
                )}
            </div>

            {confirmSolution && (
              <div className="mt-4 border-[3px] border-[#D0BEA4] bg-[#F6F0E5] p-4">
                <SectionLabel>
                  Workshop Note / Confirmation
                </SectionLabel>

                <p className="mt-2 text-sm leading-relaxed text-[#867660]">
                  This replaces your code with a working
                  answer. Are you sure?
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    onClick={() => {
                      updateCode(solution);
                      setConfirmSolution(false);
                      setResult(null);
                    }}
                  >
                    Yes, show it
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() =>
                      setConfirmSolution(false)
                    }
                  >
                    Keep my code
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* TEST STATUS */}
        <div role="status" aria-live="polite">
          {running && (
            <div className="border-l-4 border-[#A9BBD0] bg-[#EDF2F8] p-4 text-sm font-semibold text-[#6C849F]">
              The villagers are waiting for directions…
            </div>
          )}

          {!running && result?.fatal && (
            <div className="border-l-4 border-[#D3A8AB] bg-[#F8ECEB] p-4 text-sm font-semibold text-[#A37478]">
              Problem: {result.fatal}
            </div>
          )}

          {!running && hasRun && (
            <div className="flex flex-wrap items-center gap-3 border-[3px] border-[#B7C7B9] bg-[#EDF3EC] p-4">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#839D86]">
                Route Test Report
              </span>

              <span className="font-display text-lg font-bold text-[#617E69]">
                {happyCount} of {tests.length} maps solved
              </span>
            </div>
          )}
        </div>

        {/* MAPS */}
        <section className="space-y-4">
          <div className="border-b-2 border-[#D9D4CA] pb-3">
            <SectionLabel>
              Atlas Collection / Route Tests
            </SectionLabel>

            <h3 className="mt-2 font-display text-2xl font-bold text-[#70645E]">
              The maps
            </h3>

            <p className="mt-1 text-sm text-[#8B827A]">
              Test your algorithm against village
              routes across Guildhaven.
            </p>
          </div>

          <ul className="space-y-4">
            {tests.map((t, i) => {
              const r = byId[t.id];
              const revealed =
                !t.surprise || Boolean(r);

              return (
                <li
                  key={t.id}
                  className={`overflow-hidden border-[3px] ${
                    r?.passed
                      ? 'border-[#A7C1AB] bg-[#F5F8F2]'
                      : r
                        ? 'border-[#D5B3B5] bg-[#FCF6F5]'
                        : 'border-[#C9BFB1] bg-[#FCF9F2]'
                  }`}
                >
                  <div
                    className={`flex flex-wrap items-center justify-between gap-3 border-b-2 px-4 py-3 ${
                      r?.passed
                        ? 'border-[#C9DCCB] bg-[#E7F1E6]'
                        : r
                          ? 'border-[#E9D4D3] bg-[#F6E9E8]'
                          : 'border-[#E0D8CC] bg-[#F1ECE3]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#9A8C7B]">
                        {String(i + 1).padStart(2, '0')}
                      </span>

                      <h4 className="font-display text-lg font-bold text-[#6F655F]">
                        {t.name}
                      </h4>
                    </div>

                    <span
                      className={`border-2 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${
                        r?.passed
                          ? 'border-[#B3CFB7] bg-[#F3FAF2] text-[#658A6D]'
                          : r
                            ? 'border-[#E1BFC1] bg-[#FFF6F5] text-[#AB797E]'
                            : 'border-[#D7CCBE] bg-[#FCFAF5] text-[#938677]'
                      }`}
                    >
                      {r
                        ? r.passed
                          ? 'Solved'
                          : 'Not yet'
                        : 'Waiting'}
                    </span>
                  </div>

                  <div className="space-y-4 p-4 sm:p-5">
                    <p className="text-sm leading-relaxed text-[#7F7770]">
                      {t.story}
                    </p>

                    {!revealed && (
                      <div className="border-2 border-dashed border-[#C6B6D0] bg-[#F3EEF6] p-4 text-sm italic text-[#8B7994]">
                        Surprise map. You will see it
                        after you run your code.
                      </div>
                    )}

                    {revealed && (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-3">
                          <div className="border-2 border-[#C6D4C6] bg-[#EDF4EC] px-4 py-3">
                            <SectionLabel>Starting Point</SectionLabel>
                            <p className="mt-1 font-display text-lg font-bold text-[#68846D]">
                              {t.from}
                            </p>
                          </div>

                          <div className="border-2 border-[#C7D1DF] bg-[#EDF2F8] px-4 py-3">
                            <SectionLabel>Destination</SectionLabel>
                            <p className="mt-1 font-display text-lg font-bold text-[#748AA5]">
                              {t.to}
                            </p>
                          </div>
                        </div>

                        {t.hideRoads ? (
                          <p className="text-sm text-[#877E74]">
                            {t.roads.length} roads
                            (too many to list).
                          </p>
                        ) : (
                          <div className="border-2 border-[#E0D9CE] bg-[#F7F4ED] p-4">
                            <SectionLabel>
                              Available Roads
                            </SectionLabel>

                            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                              {t.roads.map((road, j) => (
                                <li
                                  key={j}
                                  className="flex items-center justify-between gap-3 border-b border-[#E5DDD1] pb-2 text-sm text-[#756C63]"
                                >
                                  <span>
                                    {road.a} to {road.b}
                                  </span>
                                  <span className="shrink-0 font-mono font-bold text-[#8D9E89]">
                                    {road.minutes} min
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {t.map && (
                          <VillageMap
                            roads={t.roads}
                            path={r?.got?.path}
                          />
                        )}

                        <div className="border-l-4 border-[#B4A6C0] bg-[#F3EFF5] p-4 text-sm text-[#82738D]">
                          <strong>Expects:</strong>{' '}
                          {t.expectText}
                        </div>

                        {r && r.passed && (
                          <p className="border-l-4 border-[#9EBBA4] bg-[#EAF3E9] p-3 text-sm font-bold text-[#63856B]">
                            {r.message}
                          </p>
                        )}

                        {r && !r.passed && (
                          <p className="border-l-4 border-[#D3A8AB] bg-[#F8ECEB] p-3 text-sm font-bold text-[#A37478]">
                            {r.message}
                          </p>
                        )}

                        {r && r.got && r.got.path && (
                          <div className="border-2 border-[#D7DDD0] bg-[#F6F8F1] p-4">
                            <SectionLabel>
                              Your Calculated Route
                            </SectionLabel>

                            <p className="mt-2 break-words font-mono text-sm font-bold leading-relaxed text-[#617D68]">
                              {r.got.path.length > 12
                                ? `${r.got.path.length} stops`
                                : r.got.path.join(' → ')}
                            </p>

                            <p className="mt-2 text-xs text-[#859487]">
                              Travel time:{' '}
                              {String(r.got.minutes)} min
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </GameFrame>
  );
}

export default RoadPlanner;
