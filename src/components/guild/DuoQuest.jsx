
import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { joinDuo } from '../../services/duoRoom';
import { sessionName } from './pairing';
import {
  ALL_IDS,
  PROBLEMS,
  money,
  scoreSelection,
  careerEvidence,
  sideFor,
  CAREER_INFO,
  normalizeCareer,
} from '../../games/twoLedgers/reconcileData';

const STATUS_TEXT = {
  connecting: 'Connecting to your partner…',
  SUBSCRIBED: 'Live connection',
  CHANNEL_ERROR: 'Connection problem. Reconnecting…',
  TIMED_OUT: 'Connection timed out. Reconnecting…',
  CLOSED: 'Reconnecting…',
};

const card =
  'border-[3px] border-[#b8a5a4] bg-[#fffaf3] shadow-[4px_4px_0_#e3d4d0]';

const tiny =
  'font-mono text-[11px] font-bold uppercase tracking-[.15em]';

const borderButton =
  'border-[3px] border-[#85717d] px-3 py-3 font-display text-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50';

function EvidenceTable({ evidence }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[390px] border-collapse text-left text-sm text-[#5b505c]">
        <thead>
          <tr className="bg-[#eee8f3] text-[#685873]">
            {evidence.headers.map(h => (
              <th
                key={h}
                className="border-b-2 border-[#c7b8ce] px-3 py-3 font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {evidence.rows.map((r, i) => (
            <tr
              key={r.key}
              className={
                i % 2 ? 'bg-[#faf3ed]' : 'bg-[#fffdf8]'
              }
            >
              <td className="border-b border-[#e7dcd8] px-3 py-2.5 font-mono font-bold">
                {evidence.side === 'A' ? r.id : r.detail}
              </td>

              <td className="border-b border-[#e7dcd8] px-3 py-2.5">
                {evidence.side === 'A' ? r.detail : r.id}
              </td>

              <td className="border-b border-[#e7dcd8] px-3 py-2.5 text-right font-mono">
                {money(r.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// me and partner must include:
// { key, username, avatar, career }

export default function DuoQuest({ me, partner, onExit }) {
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('connecting');
  const [partnerHere, setPartnerHere] = useState(false);
  const [everHere, setEverHere] = useState(false);
  const [waited, setWaited] = useState(false);

  const room = useRef(null);
  const selectedRef = useRef([]);
  const logRef = useRef(null);

  const side = sideFor(me.key, partner.key);
  const evidence = careerEvidence(me.career, side);

  const partnerCareer =
    CAREER_INFO[normalizeCareer(partner.career)]?.name ??
    'Guild member';

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    const joined = joinDuo(
      sessionName(me.key, partner.key),
      me,
      {
        onStatus: setStatus,

        onPartnerHere: here => {
          setPartnerHere(here);
          if (here) setEverHere(true);
        },

        onPartnerJoined: () =>
          joined.send({
            kind: 'sync',
            selected: selectedRef.current,
          }),

        onMessage: msg => {
          if (msg.kind === 'toggle') {
            setSelected(list =>
              msg.on
                ? [...new Set([...list, msg.id])]
                : list.filter(id => id !== msg.id)
            );
          } else if (msg.kind === 'sync') {
            setSelected(list => [
              ...new Set([
                ...list,
                ...(msg.selected ?? []),
              ]),
            ]);
          } else if (msg.kind === 'result') {
            setResult(msg.result);
          } else if (msg.kind === 'chat') {
            setMessages(list => [
              ...list.slice(-49),
              msg,
            ]);
          }
        },
      }
    );

    room.current = joined;

    return () => {
      joined.leave();
      room.current = null;
    };
  }, [me.key, partner.key]);

  useEffect(() => {
    const timer = setTimeout(
      () => setWaited(true),
      25000
    );

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop =
        logRef.current.scrollHeight;
    }
  }, [messages]);

  const solved = Boolean(result?.solved);
  const left = everHere && !partnerHere;
  const noShow = !everHere && waited;
  const over = !solved && (left || noShow);

  const canPlay =
    !solved &&
    !over &&
    partnerHere &&
    status === 'SUBSCRIBED';

  function toggle(id) {
    if (!canPlay) return;

    const on = !selected.includes(id);

    const next = on
      ? [...selected, id]
      : selected.filter(x => x !== id);

    selectedRef.current = next;
    setSelected(next);
    setResult(null);

    room.current?.send({
      kind: 'toggle',
      id,
      on,
    });
  }

  function check() {
    if (!canPlay || !selected.length) return;

    const score = {
      ...scoreSelection(selectedRef.current),
      by: me.username,
    };

    setResult(score);

    room.current?.send({
      kind: 'result',
      result: score,
    });
  }

  function sendChat(e) {
    e.preventDefault();

    const clean = text.trim().slice(0, 140);

    if (
      !clean ||
      !partnerHere ||
      status !== 'SUBSCRIBED'
    ) {
      return;
    }

    const msg = {
      kind: 'chat',
      username: me.username,
      text: clean,
      at: Date.now(),
    };

    setMessages(list => [
      ...list.slice(-49),
      msg,
    ]);

    room.current?.send(msg);
    setText('');
  }

  const feedback = solved
    ? 'Case closed. Every discrepancy has been found.'
    : result
      ? `${result.by} checked the board: ${result.right} correct, ${result.wrong} incorrect, ${result.missed} still missing.`
      : 'Compare your evidence, then mark every suspicious order.';

  return (
    <div className="space-y-5 text-[#544c54]">
      <header className="relative overflow-hidden border-[3px] border-[#b8a5c9] bg-[#f2edf7] p-5 shadow-[5px_5px_0_#ded2e8] sm:p-7">
        <div className="absolute right-5 top-5 hidden border-[3px] border-[#b9a5c9] bg-[#fffaf8] px-3 py-2 font-mono text-xs text-[#8a7595] sm:block">
          CASE FILE / 001
        </div>

        <p className={`${tiny} text-[#9b80a5]`}>
          Guildhaven • co-op investigation
        </p>

        <h2 className="mt-2 font-display text-2xl text-[#65536e] sm:text-3xl">
          The Two Ledgers
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6">
          The village café is missing money. You and your
          partner each have half the evidence. Compare
          your records, uncover the discrepancies, and
          close the case together.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="border-2 border-[#cbbbd6] bg-white/70 px-3 py-1.5 text-xs">
            Your path: {evidence.name}
          </span>

          <span className="border-2 border-[#cbbbd6] bg-white/70 px-3 py-1.5 text-xs">
            Evidence set {side} / 2
          </span>

          <span className="border-2 border-[#cbbbd6] bg-white/70 px-3 py-1.5 text-xs">
            {partnerHere
              ? 'Partner connected'
              : 'Waiting for partner'}
          </span>
        </div>
      </header>

      <div
        className={`${card} flex flex-wrap items-center justify-between gap-3 p-4`}
      >
        <div className="flex items-center gap-3">
          <Avatar
            id={partner.avatar}
            className="h-11 w-11 shrink-0"
          />

          <div>
            <p className={`${tiny} text-[#a18b99]`}>
              Your investigation partner
            </p>

            <p className="font-display text-base">
              {partner.username}{' '}
              <span className="font-sans text-xs font-normal">
                ({partnerCareer})
              </span>
            </p>
          </div>
        </div>

        <p
          role="status"
          className="text-sm text-[#7d6a79]"
        >
          {partnerHere
            ? 'At the table with you'
            : left
              ? 'Left the investigation'
              : noShow
                ? 'Did not arrive'
                : 'On their way…'}
        </p>
      </div>

      {over && (
        <div
          role="alert"
          className="border-[3px] border-[#d6a0a6] bg-[#fff0f0] p-4"
        >
          <p className="font-bold">
            {left
              ? `${partner.username} left the quest.`
              : `${partner.username} has not joined yet.`}
          </p>

          <div className="mt-3">
            <Button onClick={onExit}>
              Back to Guild Hall
            </Button>
          </div>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section
          aria-label="Your private career evidence"
          className={`${card} overflow-hidden`}
        >
          <div className="border-b-[3px] border-[#b8a5a4] bg-[#e9e2f1] px-4 py-4">
            <p className={`${tiny} text-[#8a7899]`}>
              Private evidence • {evidence.skill}
            </p>

            <h3 className="mt-1 font-display text-xl text-[#62546f]">
              {evidence.title}
            </h3>

            <p className="mt-1 text-sm">
              {evidence.subtitle}
            </p>
          </div>

          <div className="border-b border-[#e8dbd6] bg-[#fff9ed] px-4 py-3 text-sm leading-6">
            {evidence.note}
          </div>

          <EvidenceTable evidence={evidence} />

          <p className="border-t-2 border-[#e5d9dc] bg-[#f7f1f7] px-4 py-3 text-xs text-[#8a7888]">
            Only you can see this evidence. Use the chat
            to compare with your partner.
          </p>
        </section>

        <section
          aria-label="Shared investigation board"
          className={`${card} overflow-hidden`}
        >
          <div className="border-b-[3px] border-[#b8a5a4] bg-[#e5efe8] px-4 py-4">
            <p className={`${tiny} text-[#6d9280]`}>
              Shared case board
            </p>

            <h3 className="mt-1 font-display text-xl text-[#4f7361]">
              Mark the discrepancies
            </h3>

            <p className="mt-1 text-sm">
              Both players can select or remove an order.
            </p>
          </div>

          <div className="p-4">
            <p className="mb-3 text-sm leading-6">
              Look for missing payments, mismatched
              amounts, duplicates, and payments
              without orders.
            </p>

            <ul className="grid grid-cols-3 gap-2 sm:gap-3">
              {ALL_IDS.map(id => {
                const active = selected.includes(id);

                return (
                  <li key={id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      disabled={!canPlay}
                      onClick={() => toggle(id)}
                      className={`${borderButton} w-full ${
                        active
                          ? 'bg-[#e8d7f0] text-[#644d70] shadow-[2px_2px_0_#bca5c7]'
                          : 'bg-[#fff9ed] text-[#776675] hover:bg-[#f7ecf5]'
                      }`}
                    >
                      {id}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div
              role="status"
              aria-live="polite"
              className={`mt-4 border-l-4 px-4 py-3 text-sm leading-6 ${
                solved
                  ? 'border-[#86ad96] bg-[#e6f1e9]'
                  : result
                    ? 'border-[#d9a4aa] bg-[#f9e9ea]'
                    : 'border-[#c4b3d1] bg-[#f3eef7]'
              }`}
            >
              {feedback}
            </div>

            {solved && (
              <div className="mt-4 border-2 border-[#b8d0be] bg-[#f3faf3] p-3">
                <p
                  className={`${tiny} mb-2 text-[#63816d]`}
                >
                  Investigation notes
                </p>

                <ul className="space-y-1 text-sm">
                  {Object.entries(PROBLEMS).map(
                    ([id, why]) => (
                      <li key={id}>
                        <strong>{id}</strong> · {why}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {!solved && (
                <Button
                  onClick={check}
                  disabled={
                    !canPlay || !selected.length
                  }
                >
                  Check our answer
                </Button>
              )}

              <Button
                variant="secondary"
                onClick={onExit}
              >
                {solved
                  ? 'Back to Guild Hall'
                  : 'Leave quest'}
              </Button>
            </div>
          </div>
        </section>
      </div>

      <section
        aria-label="Private quest chat"
        className={`${card} overflow-hidden`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#dfd3d7] bg-[#f5e9ec] px-4 py-3">
          <h3 className="font-display text-lg text-[#765d6b]">
            Investigation correspondence
          </h3>

          <span className={`${tiny} text-[#957b88]`}>
            {STATUS_TEXT[status] ?? status}
          </span>
        </div>

        <div className="p-4">
          <ul
            ref={logRef}
            role="log"
            aria-live="polite"
            className="mb-3 max-h-48 min-h-24 space-y-2 overflow-y-auto border-2 border-[#e8d9df] bg-[#fffdfb] p-3 text-sm"
          >
            {!messages.length && (
              <li className="italic text-[#9c8c97]">
                No notes yet. Ask your partner what
                their records show.
              </li>
            )}

            {messages.map((m, i) => (
              <li key={`${m.at}-${i}`}>
                <strong className="text-[#92739b]">
                  {m.username}:
                </strong>{' '}
                {m.text}
              </li>
            ))}
          </ul>

          <form
            onSubmit={sendChat}
            className="flex gap-2"
          >
            <label className="min-w-0 flex-1">
              <span className="sr-only">
                Your message
              </span>

              <input
                type="text"
                value={text}
                onChange={e =>
                  setText(e.target.value)
                }
                maxLength={140}
                placeholder="What does your evidence show?"
                className="w-full border-[3px] border-[#c8b4c0] bg-[#fffdf9] px-3 py-2 text-sm outline-none focus:border-[#937ba1]"
              />
            </label>

            <Button
              type="submit"
              disabled={
                !partnerHere ||
                status !== 'SUBSCRIBED'
              }
            >
              Send
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
