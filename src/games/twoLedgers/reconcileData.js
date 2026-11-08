// The Two Ledgers: a duo quest. One player holds the Orders ledger, the other holds the
// Payments ledger. Together they find every order with a problem.

export const ORDERS = [
  { id: 'O-101', item: 'Sourdough loaf', amount: 24.5 },
  { id: 'O-102', item: 'Cinnamon rolls', amount: 18.0 },
  { id: 'O-103', item: 'Wedding cake', amount: 52.75 },
  { id: 'O-104', item: 'Berry tart', amount: 9.99 },
  { id: 'O-105', item: 'Party platter', amount: 31.2 },
  { id: 'O-106', item: 'Pastry box', amount: 44.0 },
  { id: 'O-107', item: 'Birthday cupcakes', amount: 12.5 },
  { id: 'O-108', item: 'Coffee catering', amount: 27.8 },
];

export const PAYMENTS = [
  { ref: 'PAY-1', orderId: 'O-101', amount: 24.5 },
  { ref: 'PAY-2', orderId: 'O-102', amount: 18.0 },
  { ref: 'PAY-3', orderId: 'O-104', amount: 9.99 },
  { ref: 'PAY-4', orderId: 'O-105', amount: 13.2 },
  { ref: 'PAY-5', orderId: 'O-106', amount: 44.0 },
  { ref: 'PAY-6', orderId: 'O-106', amount: 44.0 },
  { ref: 'PAY-7', orderId: 'O-108', amount: 27.8 },
  { ref: 'PAY-8', orderId: 'O-109', amount: 15.0 },
];

// Every id either player could blame
export const ALL_IDS = ['O-101', 'O-102', 'O-103', 'O-104', 'O-105', 'O-106', 'O-107', 'O-108', 'O-109'];

// The problems, with the reason, worked out from the two ledgers (not typed by hand)
export function findProblems() {
  const problems = {};
  const paidBy = {};
  for (const p of PAYMENTS) (paidBy[p.orderId] ??= []).push(p);

  for (const o of ORDERS) {
    const pays = paidBy[o.id] ?? [];
    if (pays.length === 0) problems[o.id] = 'Never paid';
    else if (pays.length > 1) problems[o.id] = 'Charged twice';
    else if (Math.abs(pays[0].amount - o.amount) > 0.001) problems[o.id] = 'Paid the wrong amount';
  }
  const known = new Set(ORDERS.map((o) => o.id));
  for (const p of PAYMENTS) if (!known.has(p.orderId)) problems[p.orderId] = 'Payment with no order';
  return problems;
}

export const PROBLEMS = findProblems();
export const ANSWER = new Set(Object.keys(PROBLEMS));

// How close is a guess? solved only when it is exactly right.
export function scoreSelection(selected) {
  const picks = [...new Set(selected)];
  const right = picks.filter((id) => ANSWER.has(id)).length;
  const wrong = picks.length - right;
  const missed = ANSWER.size - right;
  return { right, wrong, missed, picks: picks.length, solved: wrong === 0 && missed === 0 };
}

export const money = (n) => `$${n.toFixed(2)}`;