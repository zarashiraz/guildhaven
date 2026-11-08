// Everything the Road Planner needs that is not a React component.
// The player writes plain JavaScript. The TypeScript types are shown only to describe the data.

// This string runs inside a Web Worker. Keep it free of backticks and dollar-brace.
export const RUNNER_SOURCE = `
function runRoadTests(code, tests) {
  var fn;
  try {
    fn = new Function(code + '\\nreturn typeof shortestPath === "function" ? shortestPath : null;')();
  } catch (e) {
    return { fatal: 'Your code has an error: ' + e.message };
  }
  if (!fn) return { fatal: 'I could not find a function called shortestPath.' };

  function cheapestMap(roads) {
    var m = {};
    roads.forEach(function (r) {
      [[r.a, r.b], [r.b, r.a]].forEach(function (pair) {
        var k = pair[0] + '|' + pair[1];
        if (m[k] === undefined || r.minutes < m[k]) m[k] = r.minutes;
      });
    });
    return m;
  }

  function optimum(roads, from, to) {
    var cost = cheapestMap(roads);
    var nodes = {};
    roads.forEach(function (r) { nodes[r.a] = true; nodes[r.b] = true; });
    nodes[from] = true; nodes[to] = true;
    var names = Object.keys(nodes);
    var dist = {}, done = {};
    names.forEach(function (n) { dist[n] = Infinity; });
    dist[from] = 0;
    for (var round = 0; round < names.length; round++) {
      var u = null;
      names.forEach(function (n) {
        if (!done[n] && (u === null || dist[n] < dist[u])) u = n;
      });
      if (u === null || dist[u] === Infinity) break;
      done[u] = true;
      names.forEach(function (v) {
        var c = cost[u + '|' + v];
        if (c !== undefined && dist[u] + c < dist[v]) dist[v] = dist[u] + c;
      });
    }
    return dist[to] === Infinity ? null : dist[to];
  }

  var results = tests.map(function (t) {
    var best = optimum(t.roads, t.from, t.to);
    var got;
    try {
      got = fn(JSON.parse(JSON.stringify(t.roads)), t.from, t.to);
    } catch (e) {
      return { id: t.id, passed: false, message: 'Your code crashed: ' + e.message, got: null };
    }
    function fail(message) { return { id: t.id, passed: false, message: message, got: got }; }

    if (best === null) {
      if (got === null) return { id: t.id, passed: true, message: 'Correct: no route, so null.', got: got };
      return fail('There is no way to get there, so the answer should be null.');
    }
    if (got === null || got === undefined) {
      return fail('You returned nothing, but a route exists (it takes ' + best + ' minutes).');
    }
    if (!Array.isArray(got.path) || typeof got.minutes !== 'number') {
      return fail('Return an object like { path: ["A", "B"], minutes: 5 }.');
    }
    if (got.path[0] !== t.from) return fail('Your path should start at ' + t.from + '.');
    if (got.path[got.path.length - 1] !== t.to) return fail('Your path should end at ' + t.to + '.');
    var cost = cheapestMap(t.roads);
    var sum = 0;
    for (var i = 0; i + 1 < got.path.length; i++) {
      var c = cost[got.path[i] + '|' + got.path[i + 1]];
      if (c === undefined) {
        return fail('There is no road between ' + got.path[i] + ' and ' + got.path[i + 1] + '.');
      }
      sum += c;
    }
    if (sum !== got.minutes) {
      return fail('Your minutes say ' + got.minutes + ', but the roads on your path add up to ' + sum + '.');
    }
    if (got.minutes !== best) {
      return fail('That route takes ' + got.minutes + ' minutes, but a faster one exists.');
    }
    return { id: t.id, passed: true, message: 'Correct: ' + got.minutes + ' minutes.', got: got };
  });
  return { results: results };
}
`;

export const runRoadTests = new Function(`return (function(){ ${RUNNER_SOURCE}\n return runRoadTests; })()`)();

export const starterCode = `// roads: a list of roads. Every road works in both directions.
//   type Road = { a: string; b: string; minutes: number }
//   type Route = { path: string[]; minutes: number }
//
// Return the FASTEST route from "from" to "to", or null if there is none.
function shortestPath(roads, from, to) {
  // Your code here
  return null;
}
`;

export const rules = [
  'Return an object like { path: ["Mill", "Farm", "Lake"], minutes: 9 } that lists every stop, including the start and the destination.',
  'Fastest means the fewest minutes in total, not the fewest stops.',
  'Roads work both ways. Two roads can connect the same two places. The quicker one counts.',
  'If you are already there, return a path with just that one place and 0 minutes.',
  'If there is no way to get there, return null.',
  'Some maps are big. Trying every possible route will be too slow.',
];

export const hint =
  'Keep a table of the best known minutes to each place: 0 for the start, Infinity for the rest. Repeatedly take the unvisited place with the smallest number, then check whether going through it gives any neighbour a better number. Also remember which place each one came from, so you can rebuild the path at the end (this is called Dijkstra\'s algorithm).';

// The village map (used for the picture and the "whole village" test)
export const VILLAGE_NODES = {
  Mill: { x: 50, y: 150 },
  Farm: { x: 150, y: 220 },
  Bridge: { x: 150, y: 80 },
  Market: { x: 270, y: 50 },
  Library: { x: 390, y: 80 },
  Lake: { x: 270, y: 210 },
  Tower: { x: 410, y: 200 },
  Harbor: { x: 520, y: 140 },
};

const VILLAGE_ROADS = [
  { a: 'Mill', b: 'Farm', minutes: 2 },
  { a: 'Mill', b: 'Bridge', minutes: 5 },
  { a: 'Farm', b: 'Lake', minutes: 4 },
  { a: 'Bridge', b: 'Market', minutes: 2 },
  { a: 'Bridge', b: 'Lake', minutes: 9 },
  { a: 'Market', b: 'Library', minutes: 3 },
  { a: 'Market', b: 'Harbor', minutes: 14 },
  { a: 'Library', b: 'Tower', minutes: 6 },
  { a: 'Lake', b: 'Tower', minutes: 3 },
  { a: 'Tower', b: 'Harbor', minutes: 4 },
  { a: 'Library', b: 'Harbor', minutes: 13 },
];

// A 14 x 14 grid of crossroads with made-up travel times
function makeGrid(size) {
  const roads = [];
  const name = (i, j) => `X${i}-${j}`;
  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j < size; j += 1) {
      if (j + 1 < size) roads.push({ a: name(i, j), b: name(i, j + 1), minutes: 1 + ((i * 7 + j * 13 + i * j) % 9) });
      if (i + 1 < size) roads.push({ a: name(i, j), b: name(i + 1, j), minutes: 1 + ((i * 11 + j * 5 + i * j) % 9) });
    }
  }
  return { roads, from: name(0, 0), to: name(size - 1, size - 1) };
}

const grid = makeGrid(14);

export const tests = [
  {
    id: 'straight',
    name: 'The straight road',
    story: 'Mira just wants to walk from the Mill to the Farm. One road, no tricks.',
    roads: [{ a: 'Mill', b: 'Farm', minutes: 5 }],
    from: 'Mill',
    to: 'Farm',
    expectText: 'Path Mill, Farm in 5 minutes.',
  },
  {
    id: 'scenic',
    name: 'The scenic detour',
    story: 'The direct road is a muddy crawl. Two short roads through the Lake are quicker.',
    roads: [
      { a: 'Mill', b: 'Farm', minutes: 10 },
      { a: 'Mill', b: 'Lake', minutes: 3 },
      { a: 'Lake', b: 'Farm', minutes: 3 },
    ],
    from: 'Mill',
    to: 'Farm',
    expectText: 'Path Mill, Lake, Farm in 6 minutes (beats the 10 minute direct road).',
  },
  {
    id: 'there',
    name: 'Already there',
    story: 'Tomas is standing in the Market and asks the way to the Market.',
    roads: [{ a: 'Market', b: 'Bridge', minutes: 4 }],
    from: 'Market',
    to: 'Market',
    expectText: 'Path Market, in 0 minutes.',
  },
  {
    id: 'village',
    name: 'Across the whole village',
    story: 'Pip needs to get from the Mill to the Harbor. Look at the map: the fewest stops is not the fastest.',
    roads: VILLAGE_ROADS,
    from: 'Mill',
    to: 'Harbor',
    map: true,
    expectText: 'The fastest route on the map, 13 minutes.',
  },
  {
    id: 'noroad',
    name: 'No road at all',
    surprise: true,
    story: 'Two hamlets with no road between them.',
    roads: [
      { a: 'Mill', b: 'Farm', minutes: 2 },
      { a: 'Lake', b: 'Tower', minutes: 2 },
    ],
    from: 'Mill',
    to: 'Tower',
    expectText: 'null, because there is no route.',
  },
  {
    id: 'tworoads',
    name: 'Two roads, one cheaper',
    surprise: true,
    story: 'The old road and the new road both link the same two places.',
    roads: [
      { a: 'Mill', b: 'Farm', minutes: 9 },
      { a: 'Mill', b: 'Farm', minutes: 4 },
    ],
    from: 'Mill',
    to: 'Farm',
    expectText: 'Path Mill, Farm in 4 minutes.',
  },
  {
    id: 'bothways',
    name: 'Roads work both ways',
    surprise: true,
    story: 'The roads are written down in one direction, but villagers walk them both ways.',
    roads: [
      { a: 'Lake', b: 'Farm', minutes: 3 },
      { a: 'Tower', b: 'Lake', minutes: 2 },
    ],
    from: 'Farm',
    to: 'Tower',
    expectText: 'Path Farm, Lake, Tower in 5 minutes.',
  },
  {
    id: 'big',
    name: 'The giant crossroads',
    surprise: true,
    story: 'A huge grid of 196 crossroads. Trying every route would take longer than the lifetime of the village.',
    roads: grid.roads,
    from: grid.from,
    to: grid.to,
    hideRoads: true,
    expectText: 'The fastest route from one corner to the opposite corner (your code must be quick).',
  },
];

export const solution = `// roads: a list of roads. Every road works in both directions.
//   type Road = { a: string; b: string; minutes: number }
//   type Route = { path: string[]; minutes: number }
function shortestPath(roads, from, to) {
  // 1. Build a list of neighbours for every place (roads work both ways)
  const neighbours = {};
  const add = (x, y, minutes) => {
    if (!neighbours[x]) neighbours[x] = [];
    neighbours[x].push({ to: y, minutes });
  };
  for (const road of roads) {
    add(road.a, road.b, road.minutes);
    add(road.b, road.a, road.minutes);
  }

  // 2. Best known minutes to each place, and where we came from
  const best = { [from]: 0 };
  const cameFrom = {};
  const done = new Set();

  while (true) {
    // Pick the unvisited place with the smallest number
    let current = null;
    for (const place of Object.keys(best)) {
      if (!done.has(place) && (current === null || best[place] < best[current])) {
        current = place;
      }
    }
    if (current === null) return null; // nowhere left to go
    if (current === to) break;
    done.add(current);

    for (const next of neighbours[current] || []) {
      const total = best[current] + next.minutes;
      if (best[next.to] === undefined || total < best[next.to]) {
        best[next.to] = total;
        cameFrom[next.to] = current;
      }
    }
  }

  // 3. Walk backwards to rebuild the path
  const path = [to];
  while (path[0] !== from) path.unshift(cameFrom[path[0]]);
  return { path, minutes: best[to] };
}
`;