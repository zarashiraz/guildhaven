import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { joinDuo } from '../../services/duoRoom';
import { sessionName } from './pairing';
import {
  ALL_IDS,
  ORDERS,
  PAYMENTS,
  PROBLEMS,
  money,
  scoreSelection,
} from '../../games/twoLedgers/reconcileData';

const STATUS_TEXT = {
  connecting: 'Connecting…',
  SUBSCRIBED: 'Connected',
  CHANNEL_ERROR: 'Connection problem. Reconnecting…',
  TIMED_OUT: 'Connection problem. Reconnecting…',
  CLOSED: 'Reconnecting…',
};

// me / partner: { key, username, avatar }. onExit goes back to the Guild Hall.
function DuoQuest({ me, partner, onExit }) {
  const iHaveOrders = me.key < partner.key; // both players work this out the same way
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null); // { solved, right, wrong, missed, picks, by }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('connecting');
  const [partnerHere, setPartnerHere] = useState(false);
  const [everHere, setEverHere] = useState(false); // has your partner ever been in the room?
  const [waited, setWaited] = useState(false); // gave up waiting for them
  const room = useRef(null);
  const selectedRef = useRef([]);
  const logRef = useRef(null);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    const joined = joinDuo(sessionName(me.key, partner.key), me, {
      onStatus: setStatus,
      onPartnerHere: (here) => {
        setPartnerHere(here);
        if (here) setEverHere(true);
      },
      // A partner just arrived: catch them up on what is already ticked
      onPartnerJoined: () => joined.send({ kind: 'sync', selected: selectedRef.current }),
      onMessage: (msg) => {
        if (msg.kind === 'toggle') {
          setSelected((list) =>
            msg.on ? [...new Set([...list, msg.id])] : list.filter((id) => id !== msg.id)
          );
        } else if (msg.kind === 'sync') {
          setSelected((list) => [...new Set([...list, ...(msg.selected ?? [])])]);
        } else if (msg.kind === 'result') {
          setResult(msg.result);
        } else if (msg.kind === 'chat') {
          setMessages((list) => [...list.slice(-49), msg]);
        }
      },
    });
    room.current = joined;
    return () => {
      joined.leave();
      room.current = null;
    };
  }, [me, partner]);

  // If your partner never arrives, stop waiting after a while
  useEffect(() => {
    const timer = setTimeout(() => setWaited(true), 25000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  const solved = Boolean(result?.solved);
  const left = everHere && !partnerHere; // they were here and now they are gone
  const noShow = !everHere && waited; // they never came
  const over = !solved && (left || noShow);

  function toggle(id) {
    if (solved || over) return;
    const on = !selected.includes(id);
    setSelected((list) => (on ? [...list, id] : list.filter((x) => x !== id)));
    room.current?.send({ kind: 'toggle', id, on });
  }

  function check() {
    const score = { ...scoreSelection(selected), by: me.username };
    setResult(score);
    room.current?.send({ kind: 'result', result: score });
  }

  function sendChat(e) {
    e.preventDefault();
    const clean = text.trim().slice(0, 140);
    if (!clean) return;
    const msg = { kind: 'chat', username: me.username, text: clean, at: Date.now() };
    setMessages((list) => [...list.slice(-49), msg]);
    room.current?.send(msg);
    setText('');
  }

  let feedback = 'Talk it through, tick the problem orders, then check your answer together.';
  if (result && !solved) {
    feedback =
      `Not quite (checked by ${result.by}). ${result.right} of your ${result.picks} picks are real problems` +
      (result.wrong > 0 ? ', and some are not problems' : '') +
      (result.missed > 0 ? '. There are more to find.' : '.');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border-4 border-wood bg-parchment p-3">
        <div>
          <h3 className="font-display text-2xl font-bold text-bark">Quest: The Two Ledgers</h3>
          <p className="text-base">
            The café&apos;s books don&apos;t balance. You each hold one ledger. Find every order with a problem:
            never paid, paid the wrong amount, charged twice, or a payment with no order.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Avatar id={partner.avatar} className="h-10 w-10 shrink-0" />
          <div className="leading-tight">
            <strong className="block">{partner.username}</strong>
            <span role="status" className="text-base">
              {partnerHere
                ? 'In the room'
                : left
                  ? 'Left the quest'
                  : noShow
                    ? 'Did not arrive'
                    : 'Waiting for them to arrive…'}
            </span>
          </div>
        </div>
      </div>

      {over && (
        <div role="alert" className="space-y-2 rounded-sm border-4 border-coral bg-parchment p-3">
          <p className="font-bold">
            {left
              ? `${partner.username} left, so the quest has ended.`
              : `${partner.username} hasn't joined the quest.`}
          </p>
          <Button onClick={onExit}>Back to the Guild Hall</Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Your half of the clues */}
        <section aria-label="Your ledger" className="rounded-sm border-4 border-wood bg-parchment p-3">
          <h3 className="font-display text-xl font-bold text-bark">
            Your ledger: {iHaveOrders ? 'Orders' : 'Payments'}
          </h3>
          <p className="mb-2 text-base">
            {partner.username} has the {iHaveOrders ? 'Payments' : 'Orders'} ledger. Tell each other what you
            see. You can&apos;t show it.
          </p>
          <table className="w-full text-left text-base">
            <thead>
              <tr className="border-b-4 border-wood">
                {iHaveOrders ? (
                  <>
                    <th className="py-1 pr-2">Order</th>
                    <th className="py-1 pr-2">Item</th>
                    <th className="py-1 text-right">Amount</th>
                  </>
                ) : (
                  <>
                    <th className="py-1 pr-2">Payment</th>
                    <th className="py-1 pr-2">For order</th>
                    <th className="py-1 text-right">Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {iHaveOrders
                ? ORDERS.map((o) => (
                    <tr key={o.id} className="border-b border-wood/40">
                      <td className="py-1 pr-2 font-bold">{o.id}</td>
                      <td className="py-1 pr-2">{o.item}</td>
                      <td className="py-1 text-right">{money(o.amount)}</td>
                    </tr>
                  ))
                : PAYMENTS.map((p) => (
                    <tr key={p.ref} className="border-b border-wood/40">
                      <td className="py-1 pr-2 font-bold">{p.ref}</td>
                      <td className="py-1 pr-2">{p.orderId}</td>
                      <td className="py-1 text-right">{money(p.amount)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </section>

        {/* Shared answer board */}
        <section aria-label="Problem orders" className="rounded-sm border-4 border-wood bg-parchment p-3">
          <h3 className="font-display text-xl font-bold text-bark">Problem orders (shared)</h3>
          <p className="mb-2 text-base">Either of you can tick or untick. You both see it.</p>
          <ul className="grid grid-cols-3 gap-2">
            {ALL_IDS.map((id) => {
              const on = selected.includes(id);
              return (
                <li key={id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    disabled={solved || over}
                    onClick={() => toggle(id)}
                    className={`w-full rounded-sm border-4 px-2 py-1 font-display text-lg font-bold ${
                      on ? 'border-bark bg-gold text-ink' : 'border-wood bg-cream text-bark hover:bg-parchment'
                    } disabled:cursor-default`}
                  >
                    {id}
                  </button>
                </li>
              );
            })}
          </ul>

          <p
            role="status"
            className={`mt-3 rounded-sm p-2 text-base font-bold ${
              solved ? 'bg-forest text-cream' : result ? 'bg-cream text-coral' : 'bg-cream text-bark'
            }`}
          >
            {solved ? 'Books balanced! You found every problem together.' : feedback}
          </p>

          {solved && (
            <ul className="mt-2 space-y-1 text-base">
              {Object.entries(PROBLEMS).map(([id, why]) => (
                <li key={id}>
                  <strong>{id}:</strong> {why}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {!solved && (
              <Button onClick={check} disabled={selected.length === 0 || over}>
                Check our answer
              </Button>
            )}
            <Button variant="secondary" onClick={onExit}>
              {solved ? 'Back to the Guild Hall' : 'Leave quest'}
            </Button>
          </div>
        </section>
      </div>

      {/* Chat */}
      <section aria-label="Quest chat" className="rounded-sm border-4 border-wood bg-parchment p-3">
        <p className="mb-1 text-base font-bold">{STATUS_TEXT[status] ?? status}</p>
        <ul
          ref={logRef}
          role="log"
          aria-live="polite"
          className="mb-2 max-h-32 space-y-0.5 overflow-y-auto rounded-sm bg-ink/70 p-2 text-base text-cream"
        >
          {messages.length === 0 && <li className="italic">Say hi and compare your ledgers.</li>}
          {messages.map((m, i) => (
            <li key={`${m.at}-${i}`}>
              <strong className="text-gold">{m.username}:</strong> {m.text}
            </li>
          ))}
        </ul>
        <form onSubmit={sendChat} className="flex gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Your message</span>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={140}
              placeholder="e.g. I have O-103 for $52.75. Do you?"
              className="w-full rounded-sm border-4 border-bark bg-cream px-2 py-1"
            />
          </label>
          <Button type="submit">Send</Button>
        </form>
      </section>
    </div>
  );
}

export default DuoQuest;