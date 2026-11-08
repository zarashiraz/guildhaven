// The test runner for "The Post Office Rush".
// It is stored as a STRING on purpose: the string is loaded into a Web Worker
// (so a player's infinite loop can't freeze the page), and the exact same string
// is turned into a normal function here so it can be unit-tested.
// Don't use backticks or ${...} inside the string.

export const RUNNER_SOURCE = `function runScenarios(code, scenarios) {
  function seedDb(n) {
    var letters = [];
    for (var i = 1; i <= n; i++) {
      letters.push({ id: i, to: 'Villager ' + i, body: 'Letter number ' + i });
    }
    return { letters: letters, nextId: n + 1 };
  }

  function getPath(obj, path) {
    var parts = String(path).split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur === null || cur === undefined) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function describe(v) {
    var s;
    try { s = JSON.stringify(v); } catch (e) { s = String(v); }
    return s === undefined ? 'nothing' : s;
  }

  var handle;
  try {
    handle = new Function(code + '\\n;return typeof handle === "function" ? handle : undefined;')();
  } catch (err) {
    return { fatal: 'Your code has a syntax problem: ' + (err && err.message ? err.message : err) };
  }
  if (typeof handle !== 'function') {
    return { fatal: 'Your code must define a function named handle(req, db).' };
  }

  var results = [];
  for (var s = 0; s < scenarios.length; s++) {
    var sc = scenarios[s];
    var db = seedDb(sc.seed);
    var stepResults = [];
    var bodies = [];
    var stopped = false;

    for (var i = 0; i < sc.steps.length; i++) {
      var st = sc.steps[i];
      if (stopped) {
        stepResults.push({ ran: false, passed: false });
        continue;
      }

      var u = new URL(st.url, 'http://guild.local');
      var query = {};
      u.searchParams.forEach(function (value, key) { query[key] = value; });
      var req = {
        method: st.method,
        path: u.pathname,
        query: query,
        headers: JSON.parse(JSON.stringify(st.headers || {})),
        body: st.body === undefined ? undefined : JSON.parse(JSON.stringify(st.body)),
      };

      var message = null;
      var res;
      var received = null;
      try {
        res = handle(req, db);
      } catch (err) {
        message = 'Your code crashed: ' + (err && err.message ? err.message : err);
      }

      var clean;
      if (message === null) {
        if (res === undefined) {
          message = 'Your function returned nothing. Did you forget a return statement?';
        } else if (res && typeof res.then === 'function') {
          message = 'handle must answer right away (no async / promises).';
        } else {
          try { clean = JSON.parse(JSON.stringify(res)); } catch (e) { clean = null; }
          if (!clean || typeof clean.status !== 'number') {
            message = 'Return an object shaped like { status: 200, body: ... }. You returned ' + describe(res) + '.';
          } else {
            received = clean.status;
          }
        }
      }

      var ex = st.expect;
      if (message === null) {
        if (clean.status !== ex.status) {
          message = 'Expected status ' + ex.status + ' but got ' + clean.status + '.';
        }
      }
      if (message === null && ex.body) {
        var paths = Object.keys(ex.body);
        for (var p = 0; p < paths.length; p++) {
          var want = ex.body[paths[p]];
          var got = getPath(clean.body, paths[p]);
          if (want === '*') {
            if (typeof got !== 'string' || got.length === 0) {
              message = 'Expected body.' + paths[p] + ' to be a message (non-empty text), got ' + describe(got) + '.';
              break;
            }
          } else if (got !== want) {
            message = 'Expected body.' + paths[p] + ' to be ' + describe(want) + ' but got ' + describe(got) + '.';
            break;
          }
        }
      }
      if (message === null && ex.bodyLen) {
        var keys = Object.keys(ex.bodyLen);
        for (var k = 0; k < keys.length; k++) {
          var arr = getPath(clean.body, keys[k]);
          var n = Array.isArray(arr) ? arr.length : null;
          if (n !== ex.bodyLen[keys[k]]) {
            message = 'Expected body.' + keys[k] + ' to hold ' + ex.bodyLen[keys[k]] + ' item(s) but it holds ' + (n === null ? 'no list' : n) + '.';
            break;
          }
        }
      }
      if (message === null && ex.lettersCount !== undefined) {
        var count = Array.isArray(db.letters) ? db.letters.length : null;
        if (count !== ex.lettersCount) {
          message = 'After this request the mailbox should hold ' + ex.lettersCount + ' letter(s), but it holds ' + count + '.';
        }
      }
      if (message === null && ex.sameBodyAs !== undefined) {
        if (describe(clean.body) !== describe(bodies[ex.sameBodyAs])) {
          message = 'This should repeat the earlier answer exactly (' + describe(bodies[ex.sameBodyAs]) + ') but you sent ' + describe(clean.body) + '.';
        }
      }

      bodies.push(clean ? clean.body : undefined);
      if (message === null) {
        stepResults.push({ ran: true, passed: true, received: received });
      } else {
        stepResults.push({ ran: true, passed: false, received: received, message: message });
        stopped = true;
      }
    }

    var allPassed = true;
    for (var r = 0; r < stepResults.length; r++) {
      if (!stepResults[r].passed) allPassed = false;
    }
    results.push({ id: sc.id, passed: allPassed, steps: stepResults });
  }

  return { results: results };
}`;

// Same function, usable directly (for tests, not used by the browser UI).
export const runScenarios = new Function('return ' + RUNNER_SOURCE)();