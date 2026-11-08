
import { useCallback, useEffect, useRef, useState } from 'react';
import Panel from '../components/ui/Panel';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import TavernScene from '../components/guild/TavernScene';
import DuoQuest from '../components/guild/DuoQuest';
import {
  COLS,
  DUO_SEATS,
  ROWS,
  findPath,
  isDuoSeat,
  isWalkable,
  randomSpawn,
} from '../components/guild/tavernMap';
import {
  cancelOffer,
  emptyPair,
  prune,
  receive,
  sendOffer,
} from '../components/guild/pairing';
import { usePlayer } from '../context/PlayerContext';
import { joinTavern } from '../services/rooms';

const CAREER_NAMES = {
  swe: 'Software Eng.',
  business: 'Business',
  data_science: 'Data Science',
};

const normalizeCareer = (id) =>
  String(id ?? '')
    .trim()
    .toLowerCase()
    .replace(/[ -]/g, '_');

const careerName = (id) =>
  CAREER_NAMES[normalizeCareer(id)] ?? 'Career unavailable';

const STATUS = {
  connecting: { text: 'Connecting…', dot: 'bg-gold' },
  SUBSCRIBED: { text: 'Connected', dot: 'bg-forest' },
  CHANNEL_ERROR: { text: 'Could not connect', dot: 'bg-coral' },
  TIMED_OUT: { text: 'Timed out', dot: 'bg-coral' },
  CLOSED: { text: 'Disconnected', dot: 'bg-coral' },
};

function GuildHallPage() {
  const { player } = usePlayer();

  const playerId = player?.id;
  const playerName = player?.username;
  const playerAvatar = player?.avatar;
  const playerCareer = normalizeCareer(player?.career);

  const [tabId] = useState(() =>
    Math.random().toString(36).slice(2, 7)
  );

  const [others, setOthers] = useState([]);
  const [pos, setPos] = useState(() => {
    const [x, y] = randomSpawn();
    return { x, y };
  });

  const [messages, setMessages] = useState([]);
  const [bubbles, setBubbles] = useState({});
  const [status, setStatus] = useState('connecting');
  const [text, setText] = useState('');
  const [chatOpen, setChatOpen] = useState(true);
  const [chatNote, setChatNote] = useState('');
  const [notice, setNotice] = useState('');
  const [pair, setPair] = useState(emptyPair);
  const [tick, setTick] = useState(0);
  const [duo, setDuo] = useState(null);

  const tavern = useRef(null);
  const pairRef = useRef(pair);
  const posRef = useRef(pos);
  const othersRef = useRef([]);
  const walkTimer = useRef(null);
  const logRef = useRef(null);

  const myKey = playerId ? `${playerId}:${tabId}` : 'me';

  const commitPair = useCallback((next) => {
    pairRef.current = next;
    setPair(next);
  }, []);

  // Both players agreed to pair.
  const beginDuo = useCallback(
    (me, partner) => {
      clearInterval(walkTimer.current);
      walkTimer.current = null;
      commitPair(emptyPair());
      setDuo({ me, partner });
    },
    [commitPair]
  );

  // Join the Guild Hall using the career saved in Supabase.
  useEffect(() => {
    if (!playerId || !playerCareer || duo) {
      return undefined;
    }

    let room = null;

    const timer = setTimeout(() => {
      const self = {
        key: myKey,
        username: playerName,
        avatar: playerAvatar,
        career: playerCareer,
      };

      room = joinTavern(
        {
          id: playerId,
          username: playerName,
          avatar: playerAvatar,
          career: playerCareer,
        },
        tabId,
        { ...posRef.current },
        {
          onPlayers: (players) => {
            othersRef.current = players;
            setOthers(players);
          },

          onStatus: setStatus,

          onChat: (msg) => {
            setMessages((list) => [
              ...list.slice(-49),
              msg,
            ]);

            setBubbles((b) => ({
              ...b,
              [msg.key]: msg,
            }));

            setTimeout(() => {
              setBubbles((b) => {
                if (b[msg.key] !== msg) return b;

                const next = { ...b };
                delete next[msg.key];
                return next;
              });
            }, 6000);
          },

          onPair: (msg) => {
            const { state, matched } = receive(
              pairRef.current,
              msg,
              myKey,
              Date.now()
            );

            commitPair(state);

            if (matched) {
              const matchingPlayer =
                othersRef.current.find(
                  (o) => o.key === matched
                );

              beginDuo(self, {
                key: matched,
                username:
                  msg.name ?? matchingPlayer?.username,
                avatar:
                  msg.avatar ?? matchingPlayer?.avatar,
                career: normalizeCareer(
                  msg.career ?? matchingPlayer?.career
                ),
              });
            }
          },
        }
      );

      tavern.current = room;
    }, 0);

    return () => {
      clearTimeout(timer);

      if (room) room.leave();

      tavern.current = null;
    };
  }, [
    playerId,
    playerName,
    playerAvatar,
    playerCareer,
    tabId,
    myKey,
    duo,
    commitPair,
    beginDuo,
  ]);

  const iAmSeated = isDuoSeat(pos.x, pos.y);

  const seatedKeys = others
    .filter(
      (o) =>
        o.key !== myKey &&
        isDuoSeat(o.x, o.y)
    )
    .map((o) => o.key)
    .join('|');

  // Expire pairing offers when players leave the table.
  useEffect(() => {
    const interval = setInterval(
      () => setTick((t) => t + 1),
      3000
    );

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const seated = new Set(
      seatedKeys ? seatedKeys.split('|') : []
    );

    const { state, cancelled } = prune(
      pairRef.current,
      seated,
      iAmSeated,
      Date.now()
    );

    if (state !== pairRef.current) {
      commitPair(state);
    }

    if (cancelled && tavern.current) {
      tavern.current.pair({
        kind: 'cancel',
        from: myKey,
        to: cancelled,
      });
    }
  }, [
    seatedKeys,
    iAmSeated,
    tick,
    myKey,
    commitPair,
  ]);

  // Stop walking when leaving the page.
  useEffect(() => {
    const timers = walkTimer;

    return () => clearInterval(timers.current);
  }, []);

  // Scroll chat to the newest message.
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop =
        logRef.current.scrollHeight;
    }
  }, [messages, chatOpen]);

  function setPosition(x, y, mode = 'send') {
    posRef.current = { x, y };
    setPos({ x, y });

    if (!tavern.current || mode === 'skip') {
      return;
    }

    tavern.current.move(
      x,
      y,
      mode === 'force'
    );
  }

  function stopWalking() {
    clearInterval(walkTimer.current);
    walkTimer.current = null;
  }

  // Walk to a destination while avoiding furniture.
  function walkTo(x, y) {
    stopWalking();

    const origin = { ...posRef.current };
    const path = findPath(origin, { x, y });

    if (!path || path.length === 0) return;

    const modeAt = (i) => {
      if (i === path.length - 1) {
        return 'force';
      }

      const before =
        i === 0 ? origin : path[i - 1];

      const turns =
        path[i].x - before.x !==
          path[i + 1].x - path[i].x ||
        path[i].y - before.y !==
          path[i + 1].y - path[i].y;

      return turns ? 'force' : 'skip';
    };

    let i = 0;

    setPosition(
      path[i].x,
      path[i].y,
      modeAt(i)
    );

    i += 1;

    walkTimer.current = setInterval(() => {
      if (i >= path.length) {
        stopWalking();
        return;
      }

      setPosition(
        path[i].x,
        path[i].y,
        modeAt(i)
      );

      i += 1;
    }, 190);
  }

  // Arrow keys move one tile.
  function stepBy(dx, dy) {
    stopWalking();

    const nx = posRef.current.x + dx;
    const ny = posRef.current.y + dy;

    if (isWalkable(nx, ny)) {
      setPosition(nx, ny);
    }
  }

  // Walk to the closest available quest-table seat.
  function sitAtQuestTable() {
    const taken = new Set(
      others
        .filter((o) => o.key !== myKey)
        .map((o) => `${o.x},${o.y}`)
    );

    const here = posRef.current;

    if (isDuoSeat(here.x, here.y)) return;

    let best = null;

    for (const [sx, sy] of DUO_SEATS) {
      if (taken.has(`${sx},${sy}`)) {
        continue;
      }

      const path = findPath(here, {
        x: sx,
        y: sy,
      });

      if (
        path &&
        (!best || path.length < best.length)
      ) {
        best = path;
      }
    }

    if (!best) {
      setNotice(
        'All the seats at the Quest Table are taken right now.'
      );
      return;
    }

    setNotice('');

    const goal = best[best.length - 1];

    walkTo(goal.x, goal.y);
  }

  // Send a pairing request with the saved career.
  function requestPair(other) {
    if (
      !tavern.current ||
      pairRef.current.outgoing ||
      !playerCareer
    ) {
      return;
    }

    const { state, matched } = sendOffer(
      pairRef.current,
      other.key
    );

    commitPair(state);

    tavern.current.pair({
      kind: 'offer',
      from: myKey,
      to: other.key,
      name: playerName,
      avatar: playerAvatar,
      career: playerCareer,
    });

    if (matched) {
      beginDuo(
        {
          key: myKey,
          username: playerName,
          avatar: playerAvatar,
          career: playerCareer,
        },
        {
          key: other.key,
          username: other.username,
          avatar: other.avatar,
          career: normalizeCareer(
            pairRef.current.incoming[other.key]
              ?.career ?? other.career
          ),
        }
      );
    }
  }

  function cancelPair() {
    const to = pairRef.current.outgoing;

    if (!to) return;

    if (tavern.current) {
      tavern.current.pair({
        kind: 'cancel',
        from: myKey,
        to,
      });
    }

    commitPair(
      cancelOffer(pairRef.current)
    );
  }

  function sendMessage(e) {
    e.preventDefault();

    const clean = text.trim().slice(0, 140);

    if (!clean) return;

    if (
      !tavern.current ||
      status !== 'SUBSCRIBED'
    ) {
      setChatNote(
        'Not connected to the hall yet. Try again in a moment.'
      );
      return;
    }

    setChatNote('');
    tavern.current.say(clean);
    setText('');
  }

  const everyone = others
    .filter((o) => o.key !== myKey)
    .map((o) => ({
      ...o,
      isSelf: false,
    }));

  everyone.push({
    key: myKey,
    username: playerName ?? 'You',
    avatar: playerAvatar,
    career: playerCareer,
    x: pos.x,
    y: pos.y,
    isSelf: true,
  });

  const takenSeats = new Set(
    others
      .filter((o) => o.key !== myKey)
      .map((o) => `${o.x},${o.y}`)
  );

  const seatedOthers = everyone.filter(
    (p) =>
      !p.isSelf &&
      isDuoSeat(p.x, p.y)
  );

  const shownStatus = STATUS[status] ?? {
    text: status,
    dot: 'bg-gold',
  };

  const recent = messages.slice(-30);

  // Render the private Duo Quest.
  if (duo) {
    return (
      <Panel title="Guild Hall">
        <DuoQuest
          me={duo.me}
          partner={duo.partner}
          onExit={() => setDuo(null)}
        />
      </Panel>
    );
  }

  return (
    <Panel title="Guild Hall">
      <div className="grid items-start gap-4 lg:grid-cols-[auto_13rem] lg:justify-center">
        <div
          className="relative mx-auto w-full max-w-3xl lg:mx-0 lg:w-[var(--hall-width)] lg:max-w-none"
          style={{
            '--hall-width':
              'min(calc((100vh - 15rem) * 1.6667), max(20rem, calc(100vw - 24rem)))',
          }}
        >
          <div className="relative">
            <TavernScene
              players={everyone}
              bubbles={bubbles}
              onTile={walkTo}
              onStep={stepBy}
              onQuestTable={sitAtQuestTable}
            />

            {/* Available Quest Table seats */}
            <div className="pointer-events-none absolute inset-1">
              {!iAmSeated &&
                DUO_SEATS.filter(
                  ([sx, sy]) =>
                    !takenSeats.has(`${sx},${sy}`)
                ).map(([sx, sy]) => (
                  <button
                    key={`${sx}-${sy}`}
                    type="button"
                    aria-label="Sit here to look for a quest partner"
                    onClick={() => walkTo(sx, sy)}
                    className="pointer-events-auto absolute animate-pulse rounded-sm border-2 border-dashed border-gold bg-gold/40 hover:bg-gold/70"
                    style={{
                      left: `${(sx / COLS) * 100}%`,
                      top: `${(sy / ROWS) * 100}%`,
                      width: `${100 / COLS}%`,
                      height: `${100 / ROWS}%`,
                    }}
                  />
                ))}
            </div>

            {notice && (
              <div
                role="status"
                className="absolute bottom-3 left-1/2 w-[min(22rem,80%)] -translate-x-1/2 rounded-sm border-4 border-gold bg-parchment p-2 text-center shadow-[3px_3px_0_0_var(--color-bark)]"
              >
                <p>{notice}</p>

                <button
                  type="button"
                  onClick={() => setNotice('')}
                  className="mt-1 underline"
                >
                  Got it
                </button>
              </div>
            )}
          </div>

          {/* Quest pairing */}
          <section
            aria-label="Quest pairing"
            className="mt-2 space-y-2 rounded-sm border-4 border-gold bg-parchment p-3"
          >
            <p className="font-display text-lg font-bold text-bark">
              Quest Table
            </p>

            {!iAmSeated && (
              <>
                <p className="text-base">
                  Want to team up? Sit on a
                  glowing stool at the table to
                  look for a partner.
                </p>

                <Button
                  className="px-3 py-1 text-base"
                  onClick={sitAtQuestTable}
                >
                  Take me to the table
                </Button>
              </>
            )}

            {iAmSeated && (
              <>
                {seatedOthers.length === 0 && (
                  <p className="text-base">
                    You're seated. Waiting for
                    another adventurer to sit down…
                  </p>
                )}

                {seatedOthers.map((o) => {
                  const asked =
                    pair.outgoing === o.key;

                  const wantsMe = Boolean(
                    pair.incoming[o.key]
                  );

                  return (
                    <div
                      key={o.key}
                      className="flex items-center gap-2"
                    >
                      <Avatar
                        id={o.avatar}
                        className="h-8 w-8 shrink-0"
                      />

                      <span className="min-w-0 flex-1 truncate font-bold">
                        {o.username}
                      </span>

                      {asked ? (
                        <>
                          <span className="text-base">
                            Waiting for them…
                          </span>

                          <Button
                            variant="secondary"
                            className="px-2 py-1 text-base"
                            onClick={cancelPair}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          className="px-3 py-1 text-base"
                          disabled={Boolean(
                            pair.outgoing
                          )}
                          onClick={() =>
                            requestPair(o)
                          }
                        >
                          {wantsMe
                            ? 'Accept'
                            : 'Pair up'}
                        </Button>
                      )}
                    </div>
                  );
                })}

                {seatedOthers.some(
                  (o) =>
                    pair.incoming[o.key] &&
                    pair.outgoing !== o.key
                ) && (
                  <p className="text-base">
                    Someone wants to pair with you.
                    Press Accept to start.
                  </p>
                )}

                <p className="text-base">
                  Walk away to stop looking
                  for a partner.
                </p>
              </>
            )}
          </section>

          {/* Guild chat */}
          <section
            aria-label="Guild chat"
            className="mt-2 w-full lg:absolute lg:left-3 lg:top-3 lg:mt-0 lg:w-[min(17rem,60%)]"
          >
            <button
              type="button"
              aria-expanded={chatOpen}
              onClick={() =>
                setChatOpen((v) => !v)
              }
              className="mb-1 rounded-sm bg-ink/70 px-2 py-0.5 text-base font-bold text-cream underline"
            >
              {chatOpen
                ? 'Hide chat'
                : 'Show chat'}
            </button>

            {chatOpen && (
              <>
                <ul
                  ref={logRef}
                  role="log"
                  aria-live="polite"
                  className="mb-1 max-h-24 space-y-0.5 overflow-y-auto rounded-sm bg-ink/70 p-2 text-base text-cream"
                >
                  {recent.length === 0 && (
                    <li className="italic">
                      No messages yet. Say hello!
                    </li>
                  )}

                  {recent.map((m, i) => (
                    <li key={`${m.at}-${i}`}>
                      <strong className="text-gold">
                        {m.username}:
                      </strong>{' '}
                      {m.text}
                    </li>
                  ))}
                </ul>

                <form
                  onSubmit={sendMessage}
                  className="flex gap-1"
                >
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">
                      Your message
                    </span>

                    <input
                      type="text"
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        setChatNote('');
                      }}
                      maxLength={140}
                      placeholder="Say something…"
                      className="w-full rounded-sm border-4 border-bark bg-cream px-2 py-1"
                    />
                  </label>

                  <Button type="submit">
                    Send
                  </Button>
                </form>

                {chatNote && (
                  <p
                    role="alert"
                    className="mt-1 rounded-sm bg-parchment p-1 text-base font-bold text-coral"
                  >
                    {chatNote}
                  </p>
                )}
              </>
            )}
          </section>
        </div>

        {/* Players currently in the Guild Hall */}
        <section
          aria-label="Who is here"
          className="rounded-sm border-4 border-wood bg-parchment p-3"
        >
          <p
            role="status"
            className="mb-2 flex items-center gap-2 text-base font-bold"
          >
            <span
              aria-hidden="true"
              className={`inline-block h-3 w-3 rounded-full ${shownStatus.dot}`}
            />

            {shownStatus.text}
          </p>

          <h3 className="font-display text-lg font-bold text-bark">
            Here now ({everyone.length})
          </h3>

          <ul className="mt-2 max-h-[22rem] space-y-2 overflow-y-auto">
            {everyone.map((p) => (
              <li
                key={p.key}
                className="flex items-center gap-2"
              >
                <Avatar
                  id={p.avatar}
                  className="h-8 w-8 shrink-0"
                />

                <span className="min-w-0 leading-tight">
                  <strong className="block truncate">
                    {p.username}
                    {p.isSelf && ' (you)'}
                  </strong>

                  <span className="text-base">
                    {careerName(p.career)}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-base">
            Click the floor or use the arrow
            keys to walk.
          </p>
        </section>
      </div>
    </Panel>
  );
}

export default GuildHallPage;
