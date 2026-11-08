
 // Shared mystery data. Each player sees a career-flavoured view of one half.
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
  const paidBy = {};

  for (const p of PAYMENTS) {
    (paidBy[p.orderId] ??= []).push(p);
  }

  for (const o of ORDERS) {
    const pays = paidBy[o.id] ?? [];

    if (!pays.length) {
      problems[o.id] = 'Never paid';
    } else if (pays.length > 1) {
      problems[o.id] = 'Charged twice';
    } else if (Math.abs(pays[0].amount - o.amount) > 0.001) {
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
  String(value ?? '').toLowerCase().replace(/[ -]/g, '_');

export const CAREER_INFO = {
  swe: {
    name: 'Software Engineering',
    title: 'The Debug Console',
    subtitle: 'Trace the café’s order and payment events.',
    accent: 'violet',
  },
  business: {
    name: 'Business',
    title: 'The Accounts Office',
    subtitle: 'Audit invoices and receipts.',
    accent: 'rose',
  },
  data_science: {
    name: 'Data Science',
    title: 'The Pattern Lab',
    subtitle: 'Compare records and hunt anomalies.',
    accent: 'mint',
  },
};

// The smaller stable player key always gets source A;
// the other gets source B.
export function sideFor(meKey, partnerKey) {
  return String(meKey) < String(partnerKey) ? 'A' : 'B';
}

export function careerEvidence(career, side) {
  const kind = normalizeCareer(career);
  const type = CAREER_INFO[kind] ? kind : 'business';
  const isA = side === 'A';

  const rows = isA
    ? ORDERS.map((o, i) => ({
        key: o.id,
        id: o.id,
        detail: o.item,
        amount: o.amount,
        seq: i + 1,
      }))
    : PAYMENTS.map((p, i) => ({
        key: p.ref,
        id: p.orderId,
        detail: p.ref,
        amount: p.amount,
        seq: i + 1,
      }));

  const headers = {
    swe: isA
      ? ['Event ID', 'Payload', 'Expected value']
      : ['Event ID', 'Linked order', 'Captured value'],

    business: isA
      ? ['Invoice', 'Description', 'Amount due']
      : ['Receipt', 'Invoice', 'Amount received'],

    data_science: isA
      ? ['Record ID', 'Category', 'Expected ($)']
      : ['Sample ID', 'Order ID', 'Observed ($)'],
  }[type];

  return {
    ...CAREER_INFO[type],
    side,
    rows,
    headers,
    note: isA
      ? 'You have the order-side evidence. Your partner has the payment-side evidence. Compare IDs and amounts together.'
      : 'You have the payment-side evidence. Your partner has the order-side evidence. Compare IDs and amounts together.',
    skill: {
      swe: 'Event tracing & debugging',
      business: 'Financial reconciliation',
      data_science: 'Anomaly detection',
    }[type],
  };
}
