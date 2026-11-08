import { useRef, useState } from 'react';
import Button from '../../components/ui/Button';
import GameFrame from '../../components/games/GameFrame';
import { RUNNER_SOURCE } from './runner';
import { rounds, scenarios, starterCode, solutions } from './scenarios';

const STORAGE_KEY = 'guildhaven-post-office-code';
const TIME_LIMIT_MS = 2500;
const SHOW_SOLUTION_AFTER = 3; // failed runs before the solution button appears

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
    const source = `${RUNNER_SOURCE}\nself.onmessage = function (e) { self.postMessage(runScenarios(e.data.code, e.data.scenarios)); };`;
    const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    const worker = new Worker(url);

    function finish(result) {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(result);
    }

    const timer = setTimeout(
      () => finish({ fatal: 'Your code took too long to answer. Is there a loop that never ends?' }),
      TIME_LIMIT_MS,
    );

    worker.onmessage = (e) => finish(e.data);
    worker.onerror = (e) => finish({ fatal: `Your code crashed: ${e.message}` });
    worker.postMessage({ code, scenarios: list });
  });
}

function describeRequest(step) {
  const lines = [`${step.method} ${step.url}`];
  Object.entries(step.headers || {}).forEach(([name, value]) => lines.push(`header ${name}: ${value}`));
  if (step.body !== undefined) lines.push(`body: ${JSON.stringify(step.body)}`);
  return lines;
}

function PostOfficeRush({ onComplete }) {
  const [code, setCode] = useState(loadSavedCode);
  const [round, setRound] = useState(1);
  const [result, setResult] = useState(null); // { fatal } or { results, forRound }
  const [running, setRunning] = useState(false);
  const [failedRuns, setFailedRuns] = useState(0);
  const [confirmSolution, setConfirmSolution] = useState(false);
  const [won, setWon] = useState(false);
  const escapeMode = useRef(false); // true after Esc, so the next Tab leaves the editor
  const editorRef = useRef(null);

  const currentRound = rounds[round - 1];
  const roundScenarios = scenarios.filter((s) => s.round === round);
  const resultById = {};
  if (result && result.results) {
    result.results.forEach((r) => {
      resultById[r.id] = r;
    });
  }

  const hasRun = Boolean(result && result.results);
  const allPassed = hasRun && result.results.every((r) => r.passed);
  const roundCleared = allPassed && result.forRound === round;
  const happyCount = roundScenarios.filter((s) => resultById[s.id]?.passed).length;
  const regressions = hasRun
    ? scenarios.filter((s) => s.round < round && resultById[s.id] && !resultById[s.id].passed)
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
    const outcome = await runInWorker(code, list);
    const passedAll = outcome.results && outcome.results.every((r) => r.passed);
    setResult(outcome.fatal ? outcome : { ...outcome, forRound: round });
    if (passedAll) {
      if (round === rounds.length) setWon(true);
    } else {
      setFailedRuns((n) => n + 1);
    }
    setRunning(false);
  }

  function nextRound() {
    setRound((r) => r + 1);
    setResult(null);
    setFailedRuns(0);
    setConfirmSolution(false);
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
      const next = `${code.slice(0, start)}  ${code.slice(end)}`;
      updateCode(next);
      requestAnimationFrame(() => {
        if (editorRef.current) {
          editorRef.current.setSelectionRange(start + 2, start + 2);
        }
      });
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
      <div className="rounded-sm border-4 border-wood bg-parchment p-4">
        <h3 className="mb-2 font-display text-xl font-bold text-bark">The rules</h3>
        <ul className="list-disc space-y-1 pl-6">
          {currentRound.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>

      <div>
        <label htmlFor="po-editor" className="mb-1 block font-display text-xl font-bold text-bark">
          Your code
        </label>
        <textarea
          id="po-editor"
          ref={editorRef}
          value={code}
          onChange={(e) => updateCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-describedby="po-editor-help"
          className="h-96 w-full resize-y rounded-sm border-4 border-bark bg-ink p-3 font-mono text-base leading-relaxed text-cream"
        />
        <p id="po-editor-help" className="mt-1 text-base">
          Tab inserts two spaces. To move on with the keyboard, press Esc and then Tab. Ctrl+Enter runs your code.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={runTests} disabled={running}>
            {running ? 'Running…' : 'Run the post office'}
          </Button>
          <Button variant="secondary" onClick={resetCode} disabled={running}>
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
              <Button onClick={applySolution}>Yes, show it</Button>
              <Button variant="secondary" onClick={() => setConfirmSolution(false)}>
                Keep my code
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results summary, announced to screen readers */}
      <div role="status" aria-live="polite" className="font-display text-xl font-bold text-bark">
        {running && 'The villagers are lining up…'}
        {!running && result?.fatal && (
          <span className="text-coral">Problem: {result.fatal}</span>
        )}
        {!running && hasRun && (
          <span>
            {happyCount} of {roundScenarios.length} villagers happy.
          </span>
        )}
      </div>

      {regressions.length > 0 && (
        <div className="rounded-sm border-4 border-coral bg-parchment p-3">
          <h3 className="font-display text-lg font-bold text-bark">Earlier villagers are upset again</h3>
          <ul className="mt-1 list-disc space-y-1 pl-6">
            {regressions.map((s) => {
              const failedStep = resultById[s.id].steps.find((st) => st.ran && !st.passed);
              return (
                <li key={s.id}>
                  {s.villager}: {failedStep?.message}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div>
        <h3 className="mb-2 font-display text-xl font-bold text-bark">The villagers in line</h3>
        <ul className="space-y-3">
          {roundScenarios.map((s) => {
            const r = resultById[s.id];
            const ran = Boolean(r);
            const revealed = !s.surprise || ran;
            return (
              <li key={s.id} className="rounded-sm border-4 border-bark bg-parchment p-3">
                <p className="font-display text-lg font-bold text-bark">
                  {ran ? (r.passed ? '✓ Happy: ' : '✗ Upset: ') : 'Waiting: '}
                  {s.villager}
                </p>
                <p>{s.story}</p>

                {!revealed && (
                  <p className="mt-1 italic">Surprise request. You will see it after you run your code.</p>
                )}

                {revealed && (
                  <ol className="mt-2 space-y-2">
                    {s.steps.map((step, i) => {
                      const sr = r?.steps[i];
                      return (
                        <li key={i} className="rounded-sm bg-cream p-2">
                          <p className="font-mono text-base">
                            {describeRequest(step).map((line) => (
                              <span key={line} className="block break-all">
                                {line}
                              </span>
                            ))}
                          </p>
                          <p className="mt-1">
                            <strong>Expects:</strong> {step.expectText}
                          </p>
                          {sr?.ran && sr.passed && (
                            <p className="font-bold text-forest">✓ Got status {sr.received}. Correct.</p>
                          )}
                          {sr?.ran && !sr.passed && (
                            <p className="font-bold text-coral">✗ {sr.message}</p>
                          )}
                          {sr && !sr.ran && (
                            <p className="italic">Not tested yet (an earlier step failed).</p>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {roundCleared && !won && (
        <div role="status" className="rounded-sm border-4 border-forest bg-parchment p-4">
          <h3 className="font-display text-xl font-bold text-forest">Round {round} cleared!</h3>
          <Button className="mt-3" onClick={nextRound}>
            Next round
          </Button>
        </div>
      )}
    </GameFrame>
  );
}

export default PostOfficeRush;