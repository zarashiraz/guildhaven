
import { useRef, useState } from 'react';
import Button from '../../components/ui/Button';
import GameFrame from '../../components/games/GameFrame';
import { RUNNER_SOURCE } from './runner';
import { rounds, scenarios, starterCode, solutions } from './scenarios';

const STORAGE_KEY = 'guildhaven-post-office-code';
const TIME_LIMIT_MS = 2500;
const SHOW_SOLUTION_AFTER = 3;

const palette = [
  { bg: '#FCE3E9', accent: '#C66E8D', hair: '#7B5148', skin: '#E9B48C', outfit: '#DB87A2' },
  { bg: '#E0EDF9', accent: '#688FBE', hair: '#4D454F', skin: '#BD886B', outfit: '#82A9D5' },
  { bg: '#E9E1F8', accent: '#9578C2', hair: '#9B6B46', skin: '#E6B58D', outfit: '#A58DD5' },
  { bg: '#E1F1E5', accent: '#6C9E82', hair: '#4B4038', skin: '#D49D7B', outfit: '#8BBFA0' },
  { bg: '#FFF0D5', accent: '#B78A4C', hair: '#72503D', skin: '#EDB98F', outfit: '#D6AC6B' },
];

function VillagerAvatar({ index = 0, size = 68 }) {
  const p = palette[index % palette.length];

  return (
    <div
      className="shrink-0 border-[3px] border-[#786777] p-1"
      style={{
        background: p.bg,
        boxShadow: '3px 3px 0 #C7B6C7',
      }}
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        role="img"
        aria-label="Pixel-art villager"
        style={{ imageRendering: 'pixelated' }}
      >
        <rect x="17" y="13" width="30" height="35" fill={p.hair} />
        <rect x="21" y="20" width="22" height="25" fill={p.skin} />
        <rect x="17" y="17" width="30" height="9" fill={p.hair} />

        {index % 3 === 0 && (
          <rect x="13" y="10" width="38" height="7" fill={p.outfit} />
        )}

        {index % 3 === 1 && (
          <rect x="20" y="9" width="24" height="9" fill={p.hair} />
        )}

        <rect x="24" y="31" width="4" height="4" fill="#3D3540" />
        <rect x="36" y="31" width="4" height="4" fill="#3D3540" />
        <rect x="29" y="40" width="7" height="2" fill="#A66570" />
        <rect x="15" y="48" width="34" height="16" fill={p.outfit} />
        <rect x="28" y="48" width="8" height="16" fill="#FFF8ED" />
        <rect x="12" y="52" width="5" height="12" fill={p.skin} />
        <rect x="47" y="52" width="5" height="12" fill={p.skin} />
      </svg>
    </div>
  );
}

function EnvelopeArt() {
  return (
    <svg
      viewBox="0 0 130 108"
      width="132"
      height="110"
      role="img"
      aria-label="Pixel-art envelope"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect x="18" y="26" width="94" height="66" fill="#7B627A" />
      <rect x="22" y="30" width="86" height="58" fill="#FFF6E9" />
      <path
        d="M22 30 L65 63 L108 30"
        fill="none"
        stroke="#D4A8BC"
        strokeWidth="5"
      />
      <path
        d="M22 88 L54 59 M108 88 L76 59"
        fill="none"
        stroke="#E6C5D2"
        strokeWidth="4"
      />
      <rect x="82" y="38" width="18" height="16" fill="#B5DCC4" />
      <rect x="86" y="42" width="10" height="8" fill="#79A98E" />
      <rect x="44" y="8" width="42" height="14" fill="#D4B8E7" />
      <rect x="50" y="12" width="30" height="6" fill="#FFF6E9" />
    </svg>
  );
}

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
    // The quest works even when local storage is unavailable.
  }
}

// Execute player code in a worker so an infinite loop cannot freeze the page.
function runInWorker(code, list) {
  return new Promise((resolve) => {
    const source = `${RUNNER_SOURCE}\nself.onmessage = function (e) { self.postMessage(runScenarios(e.data.code, e.data.scenarios)); };`;
    const url = URL.createObjectURL(
      new Blob([source], { type: 'text/javascript' })
    );
    const worker = new Worker(url);

    let finished = false;
    let timer;

    function finish(result) {
      if (finished) return;

      finished = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(result);
    }

    timer = setTimeout(
      () =>
        finish({
          fatal:
            'Your code took too long to answer. Is there a loop that never ends?',
        }),
      TIME_LIMIT_MS
    );

    worker.onmessage = (e) => finish(e.data);

    worker.onerror = (e) =>
      finish({
        fatal: `Your code crashed: ${e.message}`,
      });

    worker.postMessage({
      code,
      scenarios: list,
    });
  });
}

function describeRequest(step) {
  const lines = [`${step.method} ${step.url}`];

  Object.entries(step.headers || {}).forEach(([name, value]) =>
    lines.push(`header ${name}: ${value}`)
  );

  if (step.body !== undefined) {
    lines.push(`body: ${JSON.stringify(step.body)}`);
  }

  return lines;
}

function PostOfficeRush({ onComplete }) {
  const [code, setCode] = useState(loadSavedCode);
  const [round, setRound] = useState(1);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [failedRuns, setFailedRuns] = useState(0);
  const [confirmSolution, setConfirmSolution] = useState(false);
  const [won, setWon] = useState(false);

  const escapeMode = useRef(false);
  const editorRef = useRef(null);

  const currentRound = rounds[round - 1];
  const roundScenarios = scenarios.filter((s) => s.round === round);

  const resultById = {};

  if (result?.results) {
    result.results.forEach((r) => {
      resultById[r.id] = r;
    });
  }

  const hasRun = Boolean(result?.results);

  const allPassed =
    hasRun && result.results.every((r) => r.passed);

  const roundCleared =
    allPassed && result.forRound === round;

  const happyCount = roundScenarios.filter(
    (s) => resultById[s.id]?.passed
  ).length;

  const regressions = hasRun
    ? scenarios.filter(
        (s) =>
          s.round < round &&
          resultById[s.id] &&
          !resultById[s.id].passed
      )
    : [];

  function updateCode(next) {
    setCode(next);
    saveCode(next);
  }

  async function runTests() {
    if (running) return;

    setRunning(true);
    setConfirmSolution(false);

    const list = scenarios.filter((s) => s.round <= round);

    try {
      const outcome = await runInWorker(code, list);

      const passedAll =
        outcome.results &&
        outcome.results.every((r) => r.passed);

      setResult(
        outcome.fatal
          ? outcome
          : { ...outcome, forRound: round }
      );

      if (passedAll) {
        if (round === rounds.length) {
          setWon(true);
        }
      } else {
        setFailedRuns((n) => n + 1);
      }
    } catch (error) {
      setResult({
        fatal:
          error.message ||
          'The post office could not run your code.',
      });

      setFailedRuns((n) => n + 1);
    } finally {
      setRunning(false);
    }
  }

  function nextRound() {
    setRound((r) => r + 1);
    setResult(null);
    setFailedRuns(0);
    setConfirmSolution(false);
  }

  function handleKeyDown(e) {
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === 'Enter'
    ) {
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

      const next = `${code.slice(0, start)}  ${code.slice(end)}`;

      updateCode(next);

      requestAnimationFrame(() =>
        editorRef.current?.setSelectionRange(
          start + 2,
          start + 2
        )
      );

      return;
    }

    escapeMode.current = false;
  }

  function applySolution() {
    updateCode(solutions[round]);
    setConfirmSolution(false);
    setResult(null);
  }

  function resetCode() {
    updateCode(starterCode);
    setResult(null);
  }

  return (
    <GameFrame
      title="The Post Office Rush"
      howToPlay={[
        'Villagers send requests to the guild post office. You write the code that answers them.',
        'Edit the handle function in the editor. Each villager shows the request they send and the answer they expect.',
        'Press "Run the post office" (or Ctrl+Enter). Your code runs against every villager in line.',
        'Some villagers are surprises. You only see what they asked after you run your code.',
        'Make every villager happy to finish the quest.',
      ]}
      hint={currentRound.hint}
      won={won}
      winMessage="Every villager got the right answer. You built a real REST API handler with validation, pagination and safe retries."
      onComplete={onComplete}
    >
      <div className="space-y-6 text-[#55465A]">

        {/* Pastel pixel village header */}
        <section
          className="relative overflow-hidden border-4 border-[#756179] bg-[#F7E4F1]"
          style={{ boxShadow: '5px 5px 0 #C7B4C7' }}
        >
          <div className="border-b-4 border-[#756179] bg-[#D8C3E9] px-4 py-2 text-center font-display text-sm font-bold tracking-[0.2em] text-[#574665]">
            GUILDHAVEN POSTAL SERVICE
          </div>

          <div className="flex flex-col items-center gap-3 bg-gradient-to-br from-[#FBE5EE] via-[#F9EEDD] to-[#E2F2EA] px-5 py-6 sm:flex-row sm:justify-between sm:px-8">
            <div className="text-center sm:text-left">
              <p className="mb-2 inline-block border-2 border-[#9B83AD] bg-[#EEE3F8] px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#69547E]">
                Coding quest
              </p>

              <h2 className="font-display text-3xl font-bold text-[#604A68]">
                The Post Office Rush
              </h2>

              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#78667D]">
                The village is counting on you.
                Write the request handler and deliver
                every response correctly.
              </p>
            </div>

            <EnvelopeArt />
          </div>
        </section>

        {/* Rules */}
        <section
          className="border-4 border-[#A28DB2] bg-[#EEE5F8] p-4 sm:p-5"
          style={{ boxShadow: '4px 4px 0 #D8C9E5' }}
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-[#8F7AA4] bg-[#D7C3E9] font-display text-lg font-bold text-[#604A68]">
              i
            </div>

            <h3 className="font-display text-xl font-bold text-[#604A68]">
              The postal handbook
            </h3>
          </div>

          <ul className="space-y-2">
            {currentRound.rules.map((rule, i) => (
              <li
                key={rule}
                className="flex gap-3 border-2 border-[#D8C9E5] bg-[#FCF8FF] px-3 py-2 text-sm leading-relaxed"
              >
                <span className="font-mono font-bold text-[#997AB6]">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Editor */}
        <section
          className="overflow-hidden border-4 border-[#756179] bg-[#F5ECFA]"
          style={{ boxShadow: '5px 5px 0 #D4C1DC' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-4 border-[#756179] bg-[#D9C9EB] px-4 py-3">
            <label
              htmlFor="po-editor"
              className="font-display text-xl font-bold text-[#584663]"
            >
              Your code
            </label>

            <span className="border-2 border-[#9B83AD] bg-[#FAF6FF] px-3 py-1 font-mono text-xs font-bold text-[#78658D]">
              handle(request)
            </span>
          </div>

          <div className="p-3 sm:p-4">
            <textarea
              id="po-editor"
              ref={editorRef}
              value={code}
              onChange={(e) =>
                updateCode(e.target.value)
              }
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              aria-describedby="po-editor-help"
              className="h-96 w-full resize-y border-[3px] border-[#8B7799] bg-[#2F2B3C] p-4 font-mono text-sm leading-relaxed text-[#F9EDF9] outline-none focus:border-[#B4A2E1] sm:text-base"
            />

            <p
              id="po-editor-help"
              className="mt-2 text-xs leading-relaxed text-[#806F85]"
            >
              Tab inserts two spaces. Press Esc,
              then Tab to leave the editor.
              Ctrl+Enter runs your code.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                onClick={runTests}
                disabled={running}
              >
                {running
                  ? 'Running...'
                  : 'Run the post office'}
              </Button>

              <Button
                variant="secondary"
                onClick={resetCode}
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
              <div className="mt-4 border-[3px] border-[#C3A56C] bg-[#FFF3D9] p-4">
                <p className="font-semibold">
                  This replaces your code with a
                  working answer. Are you sure?
                </p>

                <div className="mt-3 flex flex-wrap gap-3">
                  <Button onClick={applySolution}>
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

        {/* Results */}
        <div
          role="status"
          aria-live="polite"
          className="font-display text-lg font-bold text-[#604A68]"
        >
          {running && (
            <div className="border-[3px] border-[#9B83AD] bg-[#E9E0F5] p-3">
              The villagers are lining up...
            </div>
          )}

          {!running && result?.fatal && (
            <div className="border-[3px] border-[#C77D90] bg-[#FCE4E9] p-3 text-[#A04D67]">
              Problem: {result.fatal}
            </div>
          )}

          {!running && hasRun && (
            <div className="border-[3px] border-[#8EB49B] bg-[#E1F2E6] p-3 text-[#52745D]">
              {happyCount} of {roundScenarios.length}{' '}
              villagers happy.
            </div>
          )}
        </div>

        {regressions.length > 0 && (
          <section className="border-4 border-[#C77D90] bg-[#FBE3E9] p-4">
            <h3 className="font-display text-lg font-bold text-[#9F5369]">
              Earlier villagers are upset again
            </h3>

            <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
              {regressions.map((s) => {
                const failedStep =
                  resultById[s.id].steps.find(
                    (st) => st.ran && !st.passed
                  );

                return (
                  <li key={s.id}>
                    {s.villager}: {failedStep?.message}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Villager queue */}
        <section>
          <div className="mb-4 flex items-center justify-between gap-3 border-b-[3px] border-[#BCA9C8] pb-3">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#A083AD]">
                Incoming requests
              </p>

              <h3 className="font-display text-2xl font-bold text-[#604A68]">
                The villagers in line
              </h3>
            </div>

            <div className="border-[3px] border-[#A28DB2] bg-[#EEE5F8] px-3 py-2 font-mono text-sm font-bold text-[#6D587D]">
              {roundScenarios.length} waiting
            </div>
          </div>

          <ul className="space-y-4">
            {roundScenarios.map((s, index) => {
              const r = resultById[s.id];
              const ran = Boolean(r);
              const revealed = !s.surprise || ran;
              const p = palette[index % palette.length];

              return (
                <li
                  key={s.id}
                  className="overflow-hidden border-4 border-[#786777]"
                  style={{
                    background: p.bg,
                    boxShadow: '4px 4px 0 #D5C8D4',
                  }}
                >
                  <div className="flex items-center gap-4 p-4">
                    <VillagerAvatar
                      index={index + (round - 1) * 2}
                      size={64}
                    />

                    <div className="min-w-0 flex-1">
                      <p
                        className="mb-1 font-mono text-[11px] font-bold uppercase tracking-widest"
                        style={{ color: p.accent }}
                      >
                        {ran
                          ? r.passed
                            ? 'Request delivered'
                            : 'Needs attention'
                          : 'Waiting for response'}
                      </p>

                      <h4 className="font-display text-xl font-bold text-[#54445B]">
                        {s.villager}
                      </h4>

                      <p className="mt-1 text-sm leading-relaxed text-[#655669]">
                        {s.story}
                      </p>
                    </div>

                    <div className="hidden shrink-0 border-2 border-[#A38FA7] bg-white/70 px-2 py-1 font-mono text-xs font-bold text-[#786777] sm:block">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>

                  <div className="border-t-[3px] border-[#D5C5D3] bg-white/60 p-3 sm:p-4">
                    {!revealed && (
                      <p className="border-2 border-dashed border-[#C6B5CC] bg-white/70 p-3 text-sm italic">
                        Surprise request. You will see
                        it after you run your code.
                      </p>
                    )}

                    {revealed && (
                      <ol className="space-y-3">
                        {s.steps.map((step, i) => {
                          const sr = r?.steps[i];

                          return (
                            <li
                              key={i}
                              className="border-2 border-[#D8C7D7] bg-[#FFFCFF] p-3"
                            >
                              <div className="mb-2 flex items-center gap-2">
                                <span className="border border-[#B9A3C4] bg-[#EEE5F8] px-2 py-0.5 font-mono text-[11px] font-bold text-[#6D587D]">
                                  REQUEST {i + 1}
                                </span>
                              </div>

                              <div className="break-all border-l-[3px] border-[#B7A1CD] bg-[#F4EFFA] p-3 font-mono text-sm leading-relaxed text-[#51475D]">
                                {describeRequest(step).map(
                                  (line, j) => (
                                    <span
                                      key={j}
                                      className="block"
                                    >
                                      {line}
                                    </span>
                                  )
                                )}
                              </div>

                              <p className="mt-3 text-sm">
                                <strong>
                                  Expected response:
                                </strong>{' '}
                                {step.expectText}
                              </p>

                              {sr?.ran && sr.passed && (
                                <p className="mt-2 border-l-4 border-[#79AA8A] bg-[#E6F5E9] p-2 text-sm font-bold text-[#50775D]">
                                  Got status {sr.received}.
                                  Correct.
                                </p>
                              )}

                              {sr?.ran && !sr.passed && (
                                <p className="mt-2 border-l-4 border-[#C77D90] bg-[#FCE7EB] p-2 text-sm font-bold text-[#9F5369]">
                                  {sr.message}
                                </p>
                              )}

                              {sr && !sr.ran && (
                                <p className="mt-2 text-sm italic text-[#827486]">
                                  Not tested yet (an
                                  earlier step failed).
                                </p>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {roundCleared && !won && (
          <div
            role="status"
            className="border-4 border-[#79A98A] bg-[#E0F2E5] p-5"
            style={{
              boxShadow: '4px 4px 0 #B8D7C2',
            }}
          >
            <h3 className="font-display text-xl font-bold text-[#52745D]">
              Round {round} cleared!
            </h3>

            <p className="mt-1 text-sm">
              The post office is ready for the next delivery.
            </p>

            <Button
              className="mt-3"
              onClick={nextRound}
            >
              Next round
            </Button>
          </div>
        )}
      </div>
    </GameFrame>
  );
}

export default PostOfficeRush;
