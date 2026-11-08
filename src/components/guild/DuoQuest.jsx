
import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { supabase } from '../../lib/supabase';
import { usePlayer } from '../../context/PlayerContext';
import { joinDuo } from '../../services/duoRoom';
import { sessionName } from './pairing';
import {
  ALL_IDS,
  PROBLEMS,
  CAREER_INFO,
  normalizeCareer,
  careerEvidence,
  scoreSelection,
} from '../../games/twoLedgers/reconcileData';

const frame =
  'border-[3px] border-[#b8a5a4] bg-[#fffaf3] shadow-[4px_4px_0_#e3d4d0]';

const label =
  'font-mono text-[11px] font-bold uppercase tracking-[.14em]';

const statusText = {
  connecting: 'Connecting…',
  SUBSCRIBED: 'Live connection',
  CHANNEL_ERROR: 'Connection error',
  TIMED_OUT: 'Timed out',
  CLOSED: 'Disconnected',
};

export default function DuoQuest({
  me,
  partner,
  onExit,
}) {
  const { refreshPlayer } = usePlayer();

  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('connecting');
  const [partnerHere, setPartnerHere] = useState(false);
  const [everHere, setEverHere] = useState(false);
  const [waited, setWaited] = useState(false);
  const [reward, setReward] = useState('idle');
  const [rewardError, setRewardError] = useState('');

  const room = useRef(null);
  const selectedRef = useRef([]);
  const resultRef = useRef(null);
  const rewardAttempted = useRef(false);
  const logRef = useRef(null);

  const evidence = careerEvidence(me.career);

  const partnerCareer =
    CAREER_INFO[normalizeCareer(partner.career)]?.name ??
    'Unknown career';

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

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

        onPartnerJoined: () => {
          joined.send({
            kind: 'sync',
            selected: selectedRef.current,
            result: resultRef.current,
          });
        },

        onMessage: msg => {
          if (
            msg.kind === 'toggle' &&
            ALL_IDS.includes(msg.id)
          ) {
            setSelected(list => {
              const next = msg.on
                ? [...new Set([...list, msg.id])]
                : list.filter(id => id !== msg.id);

              selectedRef.current = next;
              return next;
            });

            setResult(null);
            resultRef.current = null;
          } else if (msg.kind === 'sync') {
            setSelected(list => {
              const next = [
                ...new Set([
                  ...list,
                  ...(msg.selected ?? []).filter(id =>
                    ALL_IDS.includes(id)
                  ),
                ]),
              ];

              selectedRef.current = next;
              return next;
            });

            if (msg.result) {
              setResult(msg.result);
              resultRef.current = msg.result;
            }
          } else if (msg.kind === 'result') {
            setResult(msg.result);
            resultRef.current = msg.result;
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

  const disconnected =
    (everHere && !partnerHere) ||
    (!everHere && waited);

  const canPlay =
    !solved &&
    !disconnected &&
    partnerHere &&
    status === 'SUBSCRIBED';

  // Each player claims their own reward using their
  // authenticated Supabase account.
  // The database prevents repeat awards.
  useEffect(() => {
    if (!solved || rewardAttempted.current) {
      return;
    }

    rewardAttempted.current = true;

    let active = true;

    async function claimReward() {
      setReward('claiming');
      setRewardError('');

      try {
        const ids = result?.selectedIds;

        if (!Array.isArray(ids)) {
          throw new Error(
            'Missing verified answer. Please start a new investigation.'
          );
        }

        const { data, error } = await supabase.rpc(
          'complete_duo_quest',
          {
            p_selected: ids,
          }
        );

        if (error) throw error;

        if (!active) return;

        const response = Array.isArray(data)
          ? data[0]
          : data;

        setReward(
          response?.awarded ? 'earned' : 'already'
        );

        try {
          await refreshPlayer();
        } catch (refreshError) {
          console.error(
            'XP awarded, but profile refresh failed:',
            refreshError
          );
        }
      } catch (err) {
        console.error('Duo XP reward failed:', err);

        if (active) {
          setReward('error');
          setRewardError(
            err.message ?? 'Could not claim XP.'
          );
          rewardAttempted.current = false;
        }
      }
    }

    claimReward();

    return () => {
      active = false;
    };
  }, [solved, result, refreshPlayer]);

  function toggle(id) {
    if (!canPlay) return;

    const on = !selectedRef.current.includes(id);

    const next = on
      ? [...selectedRef.current, id]
      : selectedRef.current.filter(x => x !== id);

    selectedRef.current = next;
    setSelected(next);
    setResult(null);
    resultRef.current = null;

    room.current?.send({
      kind: 'toggle',
      id,
      on,
    });
  }

  function check() {
    if (!canPlay || !selectedRef.current.length) {
      return;
    }

    const ids = [...selectedRef.current];

    const score = {
      ...scoreSelection(ids),
      selectedIds: ids,
      by: me.username,
    };

    setResult(score);
    resultRef.current = score;

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

  return (
    <div className="space-y-5 text-[#544c54]">
      <header className="border-[3px] border-[#b8a5c9] bg-[#f2edf7] p-5 shadow-[5px_5px_0_#ded2e8] sm:p-7">
        <p className={`${label} text-[#9b80a5]`}>
          Guildhaven • co-op investigation / case 001
        </p>

        <h2 className="mt-2 font-display text-2xl text-[#65536e] sm:text-3xl">
          The Two Ledgers
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6">
          A café checkout mystery. Every career has
          its own investigation. Solve the case
          together and earn 100 XP each.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="border-2 border-[#cbbbd6] bg-white/70 px-3 py-2">
            Your career: {evidence?.name ?? 'Not found'}
          </span>

          <span className="border-2 border-[#cbbbd6] bg-white/70 px-3 py-2">
            Partner: {partnerCareer}
          </span>

          <span className="border-2 border-[#cbbbd6] bg-white/70 px-3 py-2">
            {partnerHere
              ? 'Partner connected'
              : 'Waiting for partner'}
          </span>

          <span className="border-2 border-[#cbbbd6] bg-[#fff5d8] px-3 py-2 font-bold">
            Reward: 100 XP
          </span>
        </div>
      </header>

      <div className={`${frame} flex flex-wrap items-center justify-between gap-3 p-4`}>
        <div className="flex items-center gap-3">
          <Avatar
            id={partner.avatar}
            className="h-11 w-11 shrink-0"
          />

          <div>
            <p className={`${label} text-[#a18b99]`}>
              Your investigation partner
            </p>

            <p className="font-display">
              {partner.username}{' '}
              <span className="font-sans text-xs">
                ({partnerCareer})
              </span>
            </p>
          </div>
        </div>

        <p className="text-sm">
          {partnerHere
            ? 'At the table with you'
            : 'Waiting for connection'}
        </p>
      </div>

      {disconnected && !solved && (
        <div
          role="alert"
          className="border-[3px] border-[#d6a0a6] bg-[#fff0f0] p-4"
        >
          <p>
            Your partner is not connected.
            Return to the Guild Hall to pair again.
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
          className={`${frame} overflow-hidden`}
          aria-label="Your career investigation"
        >
          <div className="border-b-[3px] border-[#b8a5a4] bg-[#e9e2f1] p-4">
            <p className={`${label} text-[#8a7899]`}>
              Private career challenge • {evidence?.skill}
            </p>

            <h3 className="mt-1 font-display text-xl text-[#62546f]">
              {evidence?.title ?? 'Career unavailable'}
            </h3>

            <p className="mt-1 text-sm">
              {evidence?.subtitle ??
                'Your player profile needs a valid career.'}
            </p>
          </div>

          <div className="border-b border-[#e8dbd6] bg-[#fff9ed] p-4 text-sm leading-6">
            {evidence?.type === 'swe' &&
              'Debug the checkout service. Trace ORDER_CREATED, CAPTURE, and CAPTURE_TIMEOUT events. Find missing captures, duplicate captures, incorrect values, and captures without orders.'}

            {evidence?.type === 'business' &&
              'Audit the café books. Compare invoices against receipts. Find unpaid invoices, short payments, duplicate receipts, and receipts without invoices.'}

            {evidence?.type === 'data_science' &&
              'Compare transaction counts, expected values, and observed values. Identify missing observations, duplicate events, anomalous amounts, and orphan records.'}

            {!evidence &&
              'Career not recognized. Check your saved player profile.'}
          </div>

          {evidence && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-xs text-[#5b505c]">
                <thead>
                  <tr className="bg-[#eee8f3]">
                    {evidence.columns.map(h => (
                      <th
                        key={h}
                        className="border-b-2 border-[#c7b8ce] px-3 py-3"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {evidence.rows.map((r, i) => (
                    <tr
                      key={r.id}
                      className={
                        i % 2
                          ? 'bg-[#faf3ed]'
                          : 'bg-[#fffdf8]'
                      }
                    >
                      <td className="border-b border-[#e7dcd8] px-3 py-3 font-mono font-bold">
                        {r.id}
                      </td>

                      <td className="break-words border-b border-[#e7dcd8] px-3 py-3 font-mono">
                        {r.main}
                      </td>

                      <td className="border-b border-[#e7dcd8] px-3 py-3 font-mono">
                        {r.expected}
                      </td>

                      <td className="border-b border-[#e7dcd8] px-3 py-3 font-mono">
                        {r.observed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="border-t-2 border-[#e5d9dc] bg-[#f7f1f7] p-3 text-xs">
            Your partner sees their own career's
            investigation. Share findings through chat.
          </p>
        </section>

        <section
          className={`${frame} overflow-hidden`}
          aria-label="Shared case board"
        >
          <div className="border-b-[3px] border-[#b8a5a4] bg-[#e5efe8] p-4">
            <p className={`${label} text-[#6d9280]`}>
              Shared case board
            </p>

            <h3 className="mt-1 font-display text-xl text-[#4f7361]">
              Mark the faulty orders
            </h3>

            <p className="mt-1 text-sm">
              Both players share the same answer.
            </p>
          </div>

          <div className="p-4">
            <p className="mb-3 text-sm leading-6">
              Investigate your evidence, mark every
              faulty order, and close the case.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {ALL_IDS.map(id => (
                <button
                  key={id}
                  type="button"
                  disabled={!canPlay}
                  aria-pressed={selected.includes(id)}
                  onClick={() => toggle(id)}
                  className={`border-[3px] border-[#85717d] px-2 py-3 font-display text-xs disabled:opacity-50 ${
                    selected.includes(id)
                      ? 'bg-[#e8d7f0] text-[#644d70]'
                      : 'bg-[#fff9ed] text-[#776675]'
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>

            <div
              role="status"
              aria-live="polite"
              className={`mt-4 border-l-4 p-4 text-sm ${
                solved
                  ? 'border-[#86ad96] bg-[#e6f1e9]'
                  : 'border-[#c4b3d1] bg-[#f3eef7]'
              }`}
            >
              {solved
                ? 'Case closed! Every faulty order was found.'
                : result
                  ? `${result.by} checked: ${result.right} correct, ${result.wrong} incorrect, ${result.missed} missing.`
                  : 'Compare findings, then mark the suspicious orders.'}
            </div>

            {solved && (
              <div className="mt-4 border-[3px] border-[#a3c3ab] bg-[#eef8ef] p-4">
                <p className="font-display text-lg text-[#4f7361]">
                  Investigation Complete!
                </p>

                {reward === 'claiming' && (
                  <p className="mt-2 text-sm">
                    Saving your XP reward…
                  </p>
                )}

                {reward === 'earned' && (
                  <div
                    role="status"
                    className="mt-3 border-2 border-[#d6c28d] bg-[#fff4cb] p-3"
                  >
                    <p className="font-display text-xl text-[#85662f]">
                      +100 XP Earned!
                    </p>

                    <p className="mt-1 text-sm">
                      Added to your total XP and
                      your current career XP.
                    </p>
                  </div>
                )}

                {reward === 'already' && (
                  <p className="mt-2 text-sm">
                    You've already earned the 100 XP
                    reward for this quest.
                  </p>
                )}

                {reward === 'error' && (
                  <div
                    role="alert"
                    className="mt-3 border-2 border-[#d6a0a6] bg-[#fff0f0] p-3"
                  >
                    <p className="text-sm">
                      XP could not be saved: {rewardError}
                    </p>

                    <button
                      type="button"
                      className="mt-2 text-sm font-bold underline"
                      onClick={() => {
                        rewardAttempted.current = false;
                        setReward('idle');
                        setResult(prev => prev
                          ? { ...prev }
                          : prev
                        );
                      }}
                    >
                      Retry reward
                    </button>
                  </div>
                )}

                <div className="mt-4 space-y-1 text-sm">
                  <p className="mb-2 font-bold">
                    Investigation report
                  </p>

                  {Object.entries(PROBLEMS).map(
                    ([id, why]) => (
                      <p key={id}>
                        <strong>{id}</strong>: {why}
                      </p>
                    )
                  )}
                </div>
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
        className={`${frame} overflow-hidden`}
        aria-label="Investigation chat"
      >
        <div className="flex items-center justify-between gap-2 border-b-2 border-[#dfd3d7] bg-[#f5e9ec] p-4">
          <h3 className="font-display text-lg text-[#765d6b]">
            Investigation correspondence
          </h3>

          <span className={`${label} text-[#957b88]`}>
            {statusText[status] ?? status}
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
                No notes yet. Ask your partner
                what their investigation revealed.
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
                value={text}
                onChange={e =>
                  setText(e.target.value)
                }
                maxLength={140}
                placeholder="Share your findings…"
                className="w-full border-[3px] border-[#c8b4c0] bg-[#fffdf9] px-3 py-2 text-sm outline-none"
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
