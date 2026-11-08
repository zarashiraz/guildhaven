// A tiny pretend SQL engine for "The Query Library".
// It understands ONE kind of expression: a window function.
//   FUNCTION(column) OVER (PARTITION BY column ORDER BY column DESC)

export const COLUMNS = ['title', 'genre', 'month', 'loans'];

// How many times each book was borrowed each month. This data is made up for the game.
export const ROWS = [
  { title: 'Dragon Tides', genre: 'Fantasy', month: 1, loans: 40 },
  { title: 'Dragon Tides', genre: 'Fantasy', month: 2, loans: 55 },
  { title: 'Dragon Tides', genre: 'Fantasy', month: 3, loans: 48 },
  { title: 'Wizard Mail', genre: 'Fantasy', month: 1, loans: 60 },
  { title: 'Wizard Mail', genre: 'Fantasy', month: 2, loans: 52 },
  { title: 'Wizard Mail', genre: 'Fantasy', month: 3, loans: 70 },
  { title: 'Clue Hunters', genre: 'Mystery', month: 1, loans: 30 },
  { title: 'Clue Hunters', genre: 'Mystery', month: 2, loans: 30 },
  { title: 'Clue Hunters', genre: 'Mystery', month: 3, loans: 45 },
  { title: 'Shadow Lane', genre: 'Mystery', month: 1, loans: 25 },
  { title: 'Shadow Lane', genre: 'Mystery', month: 2, loans: 38 },
  { title: 'Shadow Lane', genre: 'Mystery', month: 3, loans: 30 },
];

const NO_ARG = ['ROW_NUMBER', 'RANK', 'DENSE_RANK'];
const ONE_ARG = ['SUM', 'AVG'];
const OFFSET = ['LAG', 'LEAD'];

const SHAPE = 'Write it like: FUNCTION(column) OVER (PARTITION BY column ORDER BY column DESC)';

const PATTERN = new RegExp(
  '^([a-z_]+)\\s*\\(\\s*([a-z_]*)\\s*(?:,\\s*(\\d+)\\s*)?\\)\\s*OVER\\s*\\(\\s*' +
    '(?:PARTITION\\s+BY\\s+([a-z_]+))?\\s*' +
    '(?:ORDER\\s+BY\\s+([a-z_]+)(?:\\s+(ASC|DESC))?)?\\s*\\)$',
  'i',
);

function checkColumn(name) {
  if (name && !COLUMNS.includes(name.toLowerCase())) {
    return `There is no column called "${name}". The columns are: ${COLUMNS.join(', ')}.`;
  }
  return null;
}

// Returns { spec } if the text is understood, or { error } with a friendly message.
export function parseWindow(text) {
  const cleaned = String(text || '').trim().replace(/;$/, '').replace(/\s+/g, ' ');
  if (!cleaned) return { error: 'Type a window expression first.' };

  const m = cleaned.match(PATTERN);
  if (!m) return { error: `I cannot read that. ${SHAPE}` };

  const fn = m[1].toUpperCase();
  const arg = m[2].toLowerCase();
  const offset = m[3] ? Number(m[3]) : 1;
  const partition = m[4] ? m[4].toLowerCase() : null;
  const order = m[5] ? m[5].toLowerCase() : null;
  const desc = (m[6] || '').toUpperCase() === 'DESC';

  if (![...NO_ARG, ...ONE_ARG, ...OFFSET].includes(fn)) {
    return { error: `I do not know the function ${fn}. Try ROW_NUMBER, RANK, DENSE_RANK, SUM, AVG, LAG or LEAD.` };
  }
  if (NO_ARG.includes(fn) && (arg || m[3])) {
    return { error: `${fn}() takes nothing inside the brackets.` };
  }
  if (!NO_ARG.includes(fn) && !arg) {
    return { error: `${fn}() needs a column inside the brackets, like ${fn}(loans).` };
  }
  if (ONE_ARG.includes(fn) && m[3]) {
    return { error: `${fn}() only takes one column.` };
  }

  const problem = checkColumn(arg) || checkColumn(partition) || checkColumn(order);
  if (problem) return { error: problem };

  if (['SUM', 'AVG'].includes(fn) && !['month', 'loans'].includes(arg)) {
    return { error: `${fn}() needs a number column: month or loans.` };
  }
  if (['ROW_NUMBER', 'RANK', 'DENSE_RANK', 'LAG', 'LEAD'].includes(fn) && !order) {
    return { error: `${fn} needs an ORDER BY inside OVER (...) to know what "before" and "after" mean.` };
  }

  return { spec: { fn, arg, offset, partition, order, desc } };
}

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// Computes the answer column: one value per row of ROWS.
export function runWindow(spec) {
  const rows = ROWS.map((r, idx) => ({ ...r, idx }));
  const groups = new Map();
  rows.forEach((r) => {
    const key = spec.partition ? r[spec.partition] : '_all';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  });

  const out = Array(rows.length).fill(null);

  groups.forEach((group) => {
    const ordered = spec.order
      ? [...group].sort((a, b) => {
          const c = compare(a[spec.order], b[spec.order]);
          return (spec.desc ? -c : c) || a.idx - b.idx;
        })
      : [...group];

    ordered.forEach((row, i) => {
      const same = (other) => !spec.order || other[spec.order] === row[spec.order];
      let value;

      if (spec.fn === 'ROW_NUMBER') {
        value = i + 1;
      } else if (spec.fn === 'RANK') {
        value = ordered.findIndex(same) + 1;
      } else if (spec.fn === 'DENSE_RANK') {
        const before = new Set(
          ordered.filter((o) => compare(o[spec.order], row[spec.order]) * (spec.desc ? -1 : 1) < 0).map((o) => o[spec.order]),
        );
        value = before.size + 1;
      } else if (spec.fn === 'SUM' || spec.fn === 'AVG') {
        // With ORDER BY the frame runs from the first row up to the last row tied with this one.
        let lastPeer = i;
        ordered.forEach((o, j) => {
          if (same(o)) lastPeer = Math.max(lastPeer, j);
        });
        const frame = spec.order ? ordered.slice(0, lastPeer + 1) : ordered;
        const total = frame.reduce((s, o) => s + o[spec.arg], 0);
        value = spec.fn === 'SUM' ? total : Math.round((total / frame.length) * 100) / 100;
      } else {
        const j = spec.fn === 'LAG' ? i - spec.offset : i + spec.offset;
        value = ordered[j] ? ordered[j][spec.arg] : null;
      }
      out[row.idx] = value;
    });
  });

  return out;
}

// The librarian's four questions. `answer` is the expression that gives the expected result.
export const CHALLENGES = [
  {
    ask: 'Next to every row, show the total loans for that row\'s genre.',
    answer: 'SUM(loans) OVER (PARTITION BY genre)',
    hint: 'SUM is a normal aggregate, but OVER lets it keep every row. PARTITION BY genre adds up each genre separately. You do not need ORDER BY here.',
  },
  {
    ask: 'Rank every row within its genre by loans, busiest first. Rows that tie share a rank, and the next rank is skipped (1, 2, 3, 3, 3, 6).',
    answer: 'RANK() OVER (PARTITION BY genre ORDER BY loans DESC)',
    hint: 'RANK, DENSE_RANK and ROW_NUMBER all number rows, but only one skips numbers after a tie. DESC puts the biggest loans first.',
  },
  {
    ask: 'For each row, show how many loans that same book had the month before (empty if there is no earlier month).',
    answer: 'LAG(loans) OVER (PARTITION BY title ORDER BY month)',
    hint: 'LAG looks at an earlier row. Each book is its own partition, and month is the order. LAG(loans) means "the loans value from one row back".',
  },
  {
    ask: 'Show a running total of loans for each book, month by month.',
    answer: 'SUM(loans) OVER (PARTITION BY title ORDER BY month)',
    hint: 'Adding ORDER BY to a SUM window turns it into a running total: each row adds up everything from the first row to itself.',
  },
].map((c) => ({ ...c, expected: runWindow(parseWindow(c.answer).spec) }));