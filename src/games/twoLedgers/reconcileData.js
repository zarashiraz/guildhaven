
 // The Two Ledgers: one mystery, independent career-specific investigations.
export const ORDERS = [
  { id: 'O-101', item: 'Sourdough loaf', amount: 24.5 },
  { id: 'O-102', item: 'Cinnamon rolls', amount: 18 },
  { id: 'O-103', item: 'Wedding cake', amount: 52.75 },
  { id: 'O-104', item: 'Berry tart', amount: 9.99 },
  { id: 'O-105', item: 'Party platter', amount: 31.2 },
  { id: 'O-106', item: 'Pastry box', amount: 44 },
  { id: 'O-107', item: 'Birthday cupcakes', amount: 12.5 },
  { id: 'O-108', item: 'Coffee catering', amount: 27.8 },
];

export const PAYMENTS = [
  { ref: 'PAY-1', orderId: 'O-101', amount: 24.5 },
  { ref: 'PAY-2', orderId: 'O-102', amount: 18 },
  { ref: 'PAY-3', orderId: 'O-104', amount: 9.99 },
  { ref: 'PAY-4', orderId: 'O-105', amount: 13.2 },
  { ref: 'PAY-5', orderId: 'O-106', amount: 44 },
  { ref: 'PAY-6', orderId: 'O-106', amount: 44 },
  { ref: 'PAY-7', orderId: 'O-108', amount: 27.8 },
  { ref: 'PAY-8', orderId: 'O-109', amount: 15 },
];

export const ALL_IDS = [
  ...new Set([
    ...ORDERS.map(o => o.id),
    ...PAYMENTS.map(p => p.orderId),
  ]),
].sort();

export const money = n => `$${Number(n).toFixed(2)}`;

export function findProblems() {
  const problems = {};
  const byOrder = {};

  for (const p of PAYMENTS) {
    (byOrder[p.orderId] ??= []).push(p);
  }

  for (const o of ORDERS) {
    const pays = byOrder[o.id] ?? [];

    if (!pays.length) {
      problems[o.id] = 'Never paid';
    } else if (pays.length > 1) {
      problems[o.id] = 'Charged twice';
    } else if (
      Math.abs(pays[0].amount - o.amount) > 0.001
    ) {
      problems[o.id] = 'Paid the wrong amount';
    }
  }

  const known = new Set(ORDERS.map(o => o.id));

  for (const p of PAYMENTS) {
    if (!known.has(p.orderId)) {
      problems[p.orderId] = 'Payment with no order';
    }
  }

  return problems;
}

export const PROBLEMS = findProblems();
export const ANSWER = new Set(Object.keys(PROBLEMS));

export function scoreSelection(selected) {
  const picks = [...new Set(selected)];
  const right = picks.filter(id => ANSWER.has(id)).length;
  const wrong = picks.length - right;
  const missed = ANSWER.size - right;

  return {
    right,
    wrong,
    missed,
    picks: picks.length,
    solved: wrong === 0 && missed === 0,
  };
}

export const normalizeCareer = value =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[ -]/g, '_');

export const CAREER_INFO = {
  swe: {
    name: 'Software Engineering',
    title: 'The Broken Checkout',
    subtitle:
      'Debug the payment processor and find faulty transactions.',
    skill: 'Event tracing & debugging',
  },
  business: {
    name: 'Business',
    title: 'The Missing Revenue',
    subtitle:
      'Reconcile invoices and payments to find discrepancies.',
    skill: 'Financial reconciliation',
  },
  data_science: {
    name: 'Data Science',
    title: 'The Anomaly Lab',
    subtitle:
      'Analyze expected versus observed transaction patterns.',
    skill: 'Anomaly detection',
  },
};

export function sideFor(meKey, partnerKey) {
  return String(meKey) < String(partnerKey) ? 'A' : 'B';
}

// Each career has enough evidence to solve the case independently.
export function careerEvidence(career) {
  const kind = normalizeCareer(career);
  const type = CAREER_INFO[kind] ? kind : null;

  if (!type) return null;

  const paymentsByOrder = Object.fromEntries(
    ALL_IDS.map(id => [
      id,
      PAYMENTS.filter(p => p.orderId === id),
    ])
  );

  const ordersById = Object.fromEntries(
    ORDERS.map(o => [o.id, o])
  );

  const rows = ALL_IDS.map(id => {
    const order = ordersById[id];
    const payments = paymentsByOrder[id];

    if (type === 'swe') {
      const events = [
        order ? 'ORDER_CREATED' : 'NO_ORDER_EVENT',
        ...payments.map(
          p => `CAPTURE(${p.ref},${money(p.amount)})`
        ),
      ];

      if (order && !payments.length) {
        events.push('CAPTURE_TIMEOUT');
      }

      return {
        id,
        main: events.join(' → '),
        expected: order
          ? money(order.amount)
          : 'NO ORDER',
        observed: payments.length
          ? payments.map(p => money(p.amount)).join(' + ')
          : 'NO CAPTURE',
      };
    }

    if (type === 'business') {
      return {
        id,
        main: order?.item ?? 'Unmatched receipt',
        expected: order
          ? money(order.amount)
          : 'NO INVOICE',
        observed: payments.length
          ? payments.map(p => money(p.amount)).join(' + ')
          : 'UNPAID',
      };
    }

    return {
      id,
      main:
        `orders=${order ? 1 : 0} · captures=${payments.length}`,
      expected: order
        ? money(order.amount)
        : 'NULL',
      observed: payments.length
        ? payments.map(p => money(p.amount)).join(' + ')
        : 'NULL',
    };
  });

  const columns = {
    swe: [
      'Order',
      'Event trace',
      'Expected payload',
      'Captured payload',
    ],
    business: [
      'Order',
      'Invoice item',
      'Amount due',
      'Receipts',
    ],
    data_science: [
      'Order',
      'Feature vector',
      'Expected value',
      'Observed values',
    ],
  }[type];

  return {
    ...CAREER_INFO[type],
    type,
    rows,
    columns,
  };
}
