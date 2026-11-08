
import { useEffect, useRef, useState } from 'react';

const STARTER_CODE = `async function getPendingOrders(fetcher) {
  const response = await fetcher('/api/orders');
  const orders = response.json();

  return orders.filter(order => order.status === 'pending');
}`;

const HINTS = [
  'Hint 1: response.json() is asynchronous. What happens if you forget await?',
  'Hint 2: The API returns an object containing an orders array, not an array directly.',
  'Hint 3: Check response.ok before processing data. A failed HTTP request should throw an error.',
];

const RUNNER_HTML = `
<!doctype html>
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; connect-src 'none'; form-action 'none'">
<script>
  window.addEventListener('message', async (event) => {
    if (!event.data || event.data.type !== 'RUN_TESTS') return;

    const { source, runId } = event.data;
    const results = [];

    function mockResponse(ok, status, orders) {
      return {
        ok,
        status,
        json: async () => ({ orders })
      };
    }

    async function check(name, fn, expectedIds) {
      try {
        const output = await fn();

        if (!Array.isArray(output)) {
          throw new Error('Expected an array of orders');
        }

        const actualIds = output.map(order => order.id);
        const passed =
          JSON.stringify(actualIds) ===
          JSON.stringify(expectedIds);

        results.push({
          name,
          passed,
          detail: passed
            ? 'Passed'
            : 'Expected IDs ' + JSON.stringify(expectedIds) +
              ', received ' + JSON.stringify(actualIds)
        });
      } catch (error) {
        results.push({
          name,
          passed: false,
          detail: String(error.message || error)
        });
      }
    }

    try {
      const factory = new Function(
        source +
        String.fromCharCode(10) +
        'return getPendingOrders;'
      );

      const getPendingOrders = factory();

      if (typeof getPendingOrders !== 'function') {
        throw new Error('Define a getPendingOrders function');
      }

      await check(
        'Returns only pending orders',
        () => getPendingOrders(async () =>
          mockResponse(true, 200, [
            { id: 1, status: 'pending' },
            { id: 2, status: 'delivered' },
            { id: 3, status: 'pending' }
          ])
        ),
        [1, 3]
      );

      await check(
        'Handles an empty result',
        () => getPendingOrders(async () =>
          mockResponse(true, 200, [
            { id: 4, status: 'delivered' }
          ])
        ),
        []
      );

      try {
        await getPendingOrders(async () =>
          mockResponse(false, 503, [])
        );

        results.push({
          name: 'Handles HTTP server errors',
          passed: false,
          detail: 'Expected an error for HTTP 503'
        });
      } catch (error) {
        results.push({
          name: 'Handles HTTP server errors',
          passed: true,
          detail: 'Correctly rejected a failed request'
        });
      }
    } catch (error) {
      results.push({
        name: 'JavaScript compilation',
        passed: false,
        detail: String(error.message || error)
      });
    }

    parent.postMessage({
      type: 'TEST_RESULTS',
      runId,
      results
    }, '*');
  });
</script>
`;

export default function BrokenAPI({
  onComplete,
  alreadyCompleted = false
}) {
  const [code, setCode] = useState(STARTER_CODE);
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [sandboxReady, setSandboxReady] = useState(false);
  const [solved, setSolved] = useState(false);
  const [rewarding, setRewarding] = useState(false);
  const [rewarded, setRewarded] = useState(alreadyCompleted);
  const [message, setMessage] = useState('');
  const [hintIndex, setHintIndex] = useState(-1);

  const iframeRef = useRef(null);
  const runIdRef = useRef(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    function handleResult(event) {
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      if (event.data?.type !== 'TEST_RESULTS') return;
      if (event.data.runId !== runIdRef.current) return;

      clearTimeout(timeoutRef.current);

      const testResults = event.data.results || [];

      setResults(testResults);
      setRunning(false);

      const passed =
        testResults.length === 3 &&
        testResults.every(result => result.passed);

      setSolved(passed);
      setMessage(
        passed
          ? 'All tests passed! The marketplace is working! 🌷'
          : 'Some tests failed. Read the results and debug your code.'
      );
    }

    window.addEventListener('message', handleResult);

    return () => {
      window.removeEventListener('message', handleResult);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  function updateCode(value) {
    setCode(value);
    setResults([]);
    setSolved(false);
    setMessage('');
  }

  function runTests() {
    if (!sandboxReady || running || code.length > 5000) {
      return;
    }

    const runId = ++runIdRef.current;

    setRunning(true);
    setSolved(false);
    setResults([]);
    setMessage('Running your tests...');

    iframeRef.current.contentWindow.postMessage(
      { type: 'RUN_TESTS', source: code, runId },
      '*'
    );

    timeoutRef.current = setTimeout(() => {
      if (runIdRef.current === runId) {
        setRunning(false);
        setMessage('Tests timed out. Check for infinite loops.');
      }
    }, 5000);
  }

  async function claimXP() {
    if (!solved || rewarding || rewarded) return;

    setRewarding(true);

    try {
      const reward = await onComplete();
      setRewarded(true);
      setMessage(
        `Quest saved! +${reward?.xp_earned ?? 50} XP ⭐`
      );
    } catch (error) {
      setMessage(`Could not save XP: ${error.message}`);
    } finally {
      setRewarding(false);
    }
  }

  return (
    <section className="space-y-5 text-[#493425]">
      <iframe
        ref={iframeRef}
        title="Isolated JavaScript test runner"
        srcDoc={RUNNER_HTML}
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        onLoad={() => setSandboxReady(true)}
        style={{ display: 'none' }}
      />

      <header>
        <h2 className="font-display text-2xl text-forest">
          🛠️ The Broken API
        </h2>
        <p className="mt-2">
          The Guildhaven marketplace can't load pending orders.
          You're the software engineering intern assigned to fix it.
        </p>
      </header>

      <div className="rounded-lg border-2 border-[#a77e52] bg-[#f5e5c3] p-4">
        <h3 className="mb-2 font-bold">📜 Your Task</h3>
        <p className="text-sm">
          Fix the JavaScript function so it correctly fetches orders,
          handles HTTP errors, and returns only pending orders.
        </p>

        <p className="mt-3 text-sm font-bold">
          API endpoint: GET /api/orders
        </p>

        <pre className="mt-2 overflow-auto rounded bg-[#fff8e9] p-3 text-xs">
{`HTTP 200 OK

{
  "orders": [
    { "id": 1, "status": "pending" },
    { "id": 2, "status": "delivered" }
  ]
}`}
        </pre>
      </div>

      <div className="rounded-lg border-2 border-[#9ab58c] bg-[#e8f2da] p-4">
        <h3 className="font-bold">🌱 Quick Lesson</h3>
        <p className="mt-2 text-sm">
          An API response contains an HTTP status and a body.
          <code> response.ok </code> tells you whether the
          request succeeded. <code>response.json()</code> returns
          a Promise, so use <code>await</code> to read its data.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border-4 border-[#77553b]">
        <div className="flex items-center justify-between bg-[#77553b] px-4 py-2 text-white">
          <span className="font-bold">💻 orders.js</span>
          <span className="text-xs">JavaScript</span>
        </div>

        <label htmlFor="api-code" className="sr-only">
          Edit the getPendingOrders JavaScript function
        </label>

        <textarea
          id="api-code"
          spellCheck={false}
          value={code}
          onChange={event => updateCode(event.target.value)}
          className="h-72 w-full resize-y bg-[#17261d] p-4 font-mono text-sm leading-6 text-[#d7eed1] outline-none focus:ring-4 focus:ring-[#9ac797]"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={runTests}
          disabled={!sandboxReady || running}
          className="rounded-lg bg-[#356d43] px-5 py-3 font-bold text-white disabled:opacity-50"
        >
          {running ? 'Running...' : '▶ Run Tests'}
        </button>

        <button
          type="button"
          onClick={() => updateCode(STARTER_CODE)}
          disabled={running}
          className="rounded-lg bg-[#9a7150] px-5 py-3 font-bold text-white disabled:opacity-50"
        >
          ↺ Reset Code
        </button>

        <button
          type="button"
          onClick={() =>
            setHintIndex(index => Math.min(index + 1, HINTS.length - 1))
          }
          className="rounded-lg border-2 border-[#9a7150] px-5 py-3 font-bold"
        >
          💡 Hint
        </button>
      </div>

      {hintIndex >= 0 && (
        <div className="rounded-lg bg-[#fff2c6] p-3 text-sm">
          {HINTS.slice(0, hintIndex + 1).map(hint => (
            <p key={hint} className="mb-2">{hint}</p>
          ))}
        </div>
      )}

      <div className="rounded-lg border-2 border-[#bda17e] bg-[#fff8e9] p-4">
        <h3 className="mb-3 font-bold">🧪 Automated Tests</h3>

        {results.length === 0 ? (
          <p className="text-sm">
            Run your code to see whether it passes the tests.
          </p>
        ) : (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className="rounded-lg bg-white/70 p-3"
              >
                <p className="font-semibold">
                  {result.passed ? '✅' : '❌'} {result.name}
                </p>
                <p className="mt-1 text-sm">{result.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p
        aria-live="polite"
        className="rounded-lg bg-[#e8f2da] p-3 font-semibold"
      >
        {message || 'Your marketplace team is counting on you! 🌼'}
      </p>

      {solved && (
        <div className="rounded-xl border-4 border-[#d2a85b] bg-[#fff0c8] p-5 text-center">
          <p className="text-3xl">🎉 🌷 ⭐</p>

          <h3 className="mt-2 font-display text-xl">
            Marketplace Restored!
          </h3>

          <p className="my-3">
            You debugged the API and passed all three tests.
          </p>

          <button
            type="button"
            onClick={claimXP}
            disabled={rewarding || rewarded}
            className="rounded-lg bg-[#356d43] px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            {rewarded
              ? 'Quest Completed ✓'
              : rewarding
                ? 'Saving XP...'
                : 'Claim 50 XP ⭐'}
          </button>

          {rewarded && (
            <p className="mt-3 text-sm">
              Your quest progress has been saved.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
