// All the content for "The Post Office Rush": rules, villagers (test cases), starter code,
// and the working solution. Everything here is plain data, so it can be sent to the Web Worker.

const auth = {};

export const starterCode = `// Welcome to the Guild Post Office!
// Every villager's request arrives as \`req\`:
//   req.method   "GET", "POST", ...
//   req.path     "/letters/2"
//   req.query    { page: "2" }                  (values are always strings!)
//   req.headers  { "idempotency-key": "..." }   (header names are lowercase)
//   req.body     whatever the villager sent (POST requests)
//
// The mailbox is \`db.letters\`: an array of { id, to, body }.
// It starts with 5 letters (ids 1 to 5). \`db.nextId\` is 6.
//
// Return an answer shaped like { status: 200, body: ... }.
// Every error answer uses a body like { error: "what went wrong" }.

function handle(req, db) {
  // Your jobs: GET one letter, POST a letter, GET the list, and handle retries.
  return { status: 404, body: { error: 'Not found' } };
}
`;

export const rounds = [
  {
    n: 1,
    name: 'The Post Office Rush',
    rules: [
      'GET /letters/:id finds one letter: 200 with the letter. A letter that does not exist: 404. An id that is not a whole number (like "abc"): 400.',
      'POST /letters sends a new letter. The body is { to, body }, both non-empty text. Success: 201 and the new letter { id, to, body } (db.nextId is a handy counter). Invalid: 400, and the mailbox must NOT change.',
      'GET /letters lists letters: 200 with { items, page, limit, total }. Defaults: page 1, limit 10. A limit above 20 is quietly lowered to 20. page and limit must be whole numbers of at least 1, otherwise 400.',
      'Some villagers retry a POST. The header idempotency-key means "this is the same send". Same key and same body as an earlier success: give the exact same answer and do NOT add a second letter. Same key but a different body: 422. A request that failed must not use up its key.',
      'Every error body looks like { error: "some message" }. Query values arrive as strings.',
    ],
    hint: 'Do the easy jobs first (GET one letter, then POST). For lists, page p starts at index (p - 1) * limit and Array.slice takes a page. For retries, keep db.keys = {}, and save the key with the original answer only after you really created the letter.',
  },
];

function get(id, villager, story, url, expect, extra = {}) {
  return {
    id,
    villager,
    story,
    seed: 5,
    steps: [{ method: 'GET', url, expect, expectText: extra.expectText }],
    ...extra.meta,
  };
}

function post(body, headers = auth) {
  return { method: 'POST', url: '/letters', headers, body };
}

const allScenarios = [
  // ---------- Round 1 ----------
  {
    ...get('r1-mira', 'Mira the Baker', 'Mira wants to read letter 2.', '/letters/2', {
      status: 200,
      body: { id: 2, to: 'Villager 2', body: 'Letter number 2' },
    }, { expectText: '200 and letter 2' }),
    round: 1,
  },
  {
    ...get('r1-tomas', 'Tomas the Miller', 'Tomas asks for a letter nobody sent.', '/letters/99', {
      status: 404,
      body: { error: '*' },
    }, { expectText: '404 with an error message' }),
    round: 1,
  },
  {
    ...get('r1-abc', 'Surprise villager', 'This villager did something odd.', '/letters/abc', {
      status: 400,
      body: { error: '*' },
    }, { expectText: '400 with an error message' }),
    round: 1,
    surprise: true,
  },
  {
    ...get('r1-parcels', 'Surprise villager', 'This villager went to the wrong counter.', '/parcels/1', {
      status: 404,
      body: { error: '*' },
    }, { expectText: '404 with an error message' }),
    round: 1,
    surprise: true,
  },
  {
    id: 'r1-delete',
    villager: 'Surprise villager',
    story: 'This villager tried something sneaky.',
    seed: 5,
    steps: [
      {
        method: 'DELETE',
        url: '/letters/1',
        expect: { status: 405, body: { error: '*' } },
        expectText: '405 with an error message',
      },
    ],
    round: 1,
    surprise: true,
  },

  // ---------- Round 2 ----------
  {
    id: 'r2-pip',
    villager: 'Pip the Messenger',
    story: 'Pip posts a friendly letter.',
    seed: 5,
    steps: [
      {
        ...post({ to: 'Pip', body: 'Hello' }),
        expect: { status: 201, body: { id: 6, to: 'Pip', body: 'Hello' }, lettersCount: 6 },
        expectText: '201, the new letter with id 6, mailbox now has 6',
      },
    ],
    round: 2,
  },
  {
    id: 'r2-nobody',
    villager: 'Old Wren',
    story: 'Wren forgot to write the message part.',
    seed: 5,
    steps: [
      {
        ...post({ to: 'Pip' }),
        expect: { status: 400, body: { error: '*' }, lettersCount: 5 },
        expectText: '400 with an error message, mailbox still 5',
      },
    ],
    round: 2,
  },
  {
    id: 'r2-blank',
    villager: 'Surprise villager',
    story: 'This villager sent something that looks full but is not.',
    seed: 5,
    steps: [
      {
        ...post({ to: '   ', body: 'Hi' }),
        expect: { status: 400, body: { error: '*' }, lettersCount: 5 },
        expectText: '400 with an error message, mailbox still 5',
      },
    ],
    round: 2,
    surprise: true,
  },
  {
    id: 'r2-null',
    villager: 'Surprise villager',
    story: 'This villager sent a very empty envelope.',
    seed: 5,
    steps: [
      {
        ...post(null),
        expect: { status: 400, body: { error: '*' }, lettersCount: 5 },
        expectText: '400 with an error message, mailbox still 5',
      },
    ],
    round: 2,
    surprise: true,
  },
  {
    id: 'r2-two',
    villager: 'Surprise villager',
    story: 'This villager sends two letters in a row, then checks the second.',
    seed: 5,
    steps: [
      {
        ...post({ to: 'A', body: 'one' }),
        expect: { status: 201, body: { id: 6 }, lettersCount: 6 },
        expectText: '201, id 6',
      },
      {
        ...post({ to: 'B', body: 'two' }),
        expect: { status: 201, body: { id: 7 }, lettersCount: 7 },
        expectText: '201, id 7',
      },
      {
        method: 'GET',
        url: '/letters/7',
        expect: { status: 200, body: { id: 7, to: 'B', body: 'two' } },
        expectText: '200 and letter 7',
      },
    ],
    round: 2,
    surprise: true,
  },

  // ---------- Round 3 ----------
  {
    id: 'r3-all',
    villager: 'Mira the Baker',
    story: 'Mira wants to see the whole mailbox.',
    seed: 5,
    steps: [
      {
        method: 'GET',
        url: '/letters',
        expect: {
          status: 200,
          body: { page: 1, limit: 10, total: 5, 'items.0.id': 1 },
          bodyLen: { items: 5 },
        },
        expectText: '200, page 1, limit 10, total 5, five items',
      },
    ],
    round: 3,
  },
  {
    id: 'r3-page2',
    villager: 'Tomas the Miller',
    story: 'Tomas reads two letters at a time and wants page 2.',
    seed: 5,
    steps: [
      {
        method: 'GET',
        url: '/letters?page=2&limit=2',
        expect: {
          status: 200,
          body: { page: 2, limit: 2, total: 5, 'items.0.id': 3, 'items.1.id': 4 },
          bodyLen: { items: 2 },
        },
        expectText: '200, letters 3 and 4, total 5',
      },
    ],
    round: 3,
  },
  {
    id: 'r3-last',
    villager: 'Pip the Messenger',
    story: 'Pip goes to the last page, which is not full.',
    seed: 5,
    steps: [
      {
        method: 'GET',
        url: '/letters?page=3&limit=2',
        expect: {
          status: 200,
          body: { page: 3, total: 5, 'items.0.id': 5 },
          bodyLen: { items: 1 },
        },
        expectText: '200, only letter 5',
      },
    ],
    round: 3,
  },
  {
    id: 'r3-huge',
    villager: 'Surprise villager',
    story: 'This villager is very greedy.',
    seed: 5,
    steps: [
      {
        method: 'GET',
        url: '/letters?limit=500',
        expect: { status: 200, body: { limit: 20, total: 5 }, bodyLen: { items: 5 } },
        expectText: '200 with the limit lowered to 20',
      },
    ],
    round: 3,
    surprise: true,
  },
  {
    id: 'r3-zero',
    villager: 'Surprise villager',
    story: 'This villager asked for a page that cannot exist.',
    seed: 5,
    steps: [
      {
        method: 'GET',
        url: '/letters?page=0',
        expect: { status: 400, body: { error: '*' } },
        expectText: '400 with an error message',
      },
    ],
    round: 3,
    surprise: true,
  },
  {
    id: 'r3-abc',
    villager: 'Surprise villager',
    story: 'This villager typed something that is not a number.',
    seed: 5,
    steps: [
      {
        method: 'GET',
        url: '/letters?limit=abc',
        expect: { status: 400, body: { error: '*' } },
        expectText: '400 with an error message',
      },
    ],
    round: 3,
    surprise: true,
  },

  // ---------- Retries ----------
  {
    id: 'r4-nopass',
    villager: 'Stranger at the door',
    story: 'A stranger tries to post a letter with no token.',
    seed: 5,
    steps: [
      {
        ...post({ to: 'Pip', body: 'Hi' }, {}),
        expect: { status: 401, body: { error: '*' }, lettersCount: 5 },
        expectText: '401 with an error message, mailbox still 5',
      },
    ],
    round: 4,
  },
  {
    id: 'r4-wrong',
    villager: 'Sneaky Fox',
    story: 'Fox shows a token, but it is a fake.',
    seed: 5,
    steps: [
      {
        ...post({ to: 'Pip', body: 'Hi' }, { 'x-guild-token': 'let-me-in' }),
        expect: { status: 403, body: { error: '*' }, lettersCount: 5 },
        expectText: '403 with an error message, mailbox still 5',
      },
    ],
    round: 4,
  },
  {
    id: 'r4-retry',
    villager: 'Pip the Messenger',
    story: 'Pip\'s connection dropped, so Pip sends the exact same letter twice.',
    seed: 5,
    steps: [
      {
        ...post({ to: 'Pip', body: 'Hi' }, { ...auth, 'idempotency-key': 'k1' }),
        expect: { status: 201, body: { id: 6 }, lettersCount: 6 },
        expectText: '201, new letter id 6',
      },
      {
        ...post({ to: 'Pip', body: 'Hi' }, { ...auth, 'idempotency-key': 'k1' }),
        expect: { status: 201, sameBodyAs: 0, lettersCount: 6 },
        expectText: '201, the very same letter, mailbox still 6',
      },
    ],
    round: 4,
  },
  {
    id: 'r4-reuse',
    villager: 'Surprise villager',
    story: 'This villager reused a stamp for a different letter.',
    seed: 5,
    steps: [
      {
        ...post({ to: 'A', body: 'one' }, { ...auth, 'idempotency-key': 'k1' }),
        expect: { status: 201, body: { id: 6 }, lettersCount: 6 },
        expectText: '201, id 6',
      },
      {
        ...post({ to: 'A', body: 'something else' }, { ...auth, 'idempotency-key': 'k1' }),
        expect: { status: 422, body: { error: '*' }, lettersCount: 6 },
        expectText: '422 with an error message, mailbox still 6',
      },
    ],
    round: 4,
    surprise: true,
  },
  {
    id: 'r4-twins',
    villager: 'Surprise villager',
    story: 'Two villagers send identical letters with different stamps.',
    seed: 5,
    steps: [
      {
        ...post({ to: 'A', body: 'same' }, { ...auth, 'idempotency-key': 'one' }),
        expect: { status: 201, body: { id: 6 }, lettersCount: 6 },
        expectText: '201, id 6',
      },
      {
        ...post({ to: 'A', body: 'same' }, { ...auth, 'idempotency-key': 'two' }),
        expect: { status: 201, body: { id: 7 }, lettersCount: 7 },
        expectText: '201, a NEW letter, id 7',
      },
    ],
    round: 4,
    surprise: true,
  },
  {
    id: 'r4-failed-key',
    villager: 'Surprise villager',
    story: 'This villager makes a mistake, fixes it, and tries again.',
    seed: 5,
    steps: [
      {
        ...post({ to: 'A' }, { ...auth, 'idempotency-key': 'oops' }),
        expect: { status: 400, body: { error: '*' }, lettersCount: 5 },
        expectText: '400 with an error message',
      },
      {
        ...post({ to: 'A', body: 'fixed' }, { ...auth, 'idempotency-key': 'oops' }),
        expect: { status: 201, body: { id: 6, body: 'fixed' }, lettersCount: 6 },
        expectText: '201, the letter is sent this time',
      },
    ],
    round: 4,
    surprise: true,
  },
];

// The villagers used in this game (a mix of regular and surprise requests).
// The others above are spares: add an id here to put that villager in line.
const IN_GAME = [
  'r1-mira', 'r1-tomas', 'r1-abc',
  'r2-pip', 'r2-nobody', 'r2-null',
  'r3-page2', 'r3-huge', 'r3-zero',
  'r4-retry', 'r4-reuse', 'r4-failed-key',
];

export const scenarios = allScenarios
  .filter((s) => IN_GAME.includes(s.id))
  .map((s) => ({ ...s, round: 1 }));

// A working answer, used by the "Show me a working answer" button after several failed tries.
const solution = `function listLetters(req, db) {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  let limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
  if (!Number.isInteger(page) || page < 1) {
    return { status: 400, body: { error: 'page must be a whole number of 1 or more' } };
  }
  if (!Number.isInteger(limit) || limit < 1) {
    return { status: 400, body: { error: 'limit must be a whole number of 1 or more' } };
  }
  limit = Math.min(limit, 20);
  const start = (page - 1) * limit;
  return {
    status: 200,
    body: {
      items: db.letters.slice(start, start + limit),
      page,
      limit,
      total: db.letters.length,
    },
  };
}

function createLetter(req, db) {
  const b = req.body;
  const ok =
    typeof b === 'object' && b !== null &&
    typeof b.to === 'string' && b.to.trim() !== '' &&
    typeof b.body === 'string' && b.body.trim() !== '';
  if (!ok) {
    return { status: 400, body: { error: 'Both "to" and "body" must be non-empty text' } };
  }

  const key = req.headers['idempotency-key'];
  const fingerprint = JSON.stringify(b);
  if (!db.keys) db.keys = {};
  if (key && db.keys[key]) {
    if (db.keys[key].fingerprint !== fingerprint) {
      return { status: 422, body: { error: 'That idempotency key was used for a different letter' } };
    }
    return db.keys[key].response;
  }

  const letter = { id: db.nextId, to: b.to, body: b.body };
  db.nextId += 1;
  db.letters.push(letter);
  const response = { status: 201, body: letter };
  if (key) db.keys[key] = { fingerprint, response };
  return response;
}

function handle(req, db) {
  if (req.path === '/letters') {
    if (req.method === 'GET') return listLetters(req, db);
    if (req.method === 'POST') return createLetter(req, db);
  }

  const match = req.path.match(/^\\/letters\\/([^/]+)$/);
  if (req.method === 'GET' && match) {
    const id = Number(match[1]);
    if (!Number.isInteger(id)) {
      return { status: 400, body: { error: 'Letter id must be a number' } };
    }
    const letter = db.letters.find((l) => l.id === id);
    if (!letter) {
      return { status: 404, body: { error: 'Letter not found' } };
    }
    return { status: 200, body: letter };
  }

  return { status: 404, body: { error: 'Route not found' } };
}
`;

export const solutions = { 1: solution };