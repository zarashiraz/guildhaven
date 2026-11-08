
import { useEffect, useRef, useState } from 'react';
import Panel from '../components/ui/Panel';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import TavernScene from '../components/guild/TavernScene';
import { findPath, isWalkable, randomSpawn } from '../components/guild/tavernMap';
import { usePlayer } from '../context/PlayerContext';
import { joinTavern } from '../services/rooms';

const CAREER_NAMES = {
  swe: 'Software Eng.',
  business: 'Business',
  data_science: 'Data Science',
};

const careerName = (id) =>
  CAREER_NAMES[String(id ?? '').toLowerCase().replace(/[ -]/g, '_')] ?? '';

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
  const playerCareer = player?.career;

  const [tabId] = useState(() => Math.random().toString(36).slice(2, 7));
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
  const tavern = useRef(null);
  const startPos = useRef(pos);
  const posRef = useRef(pos);
  const walkTimer = useRef(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (!playerId) return undefined;

    // Wait one tick before joining. In development React runs effects twice, and
    // joining and leaving the same channel instantly can leave it broken.
    let room = null;
    const timer = setTimeout(() => {
      room = joinTavern(
        {
          id: playerId,
          username: playerName,
          avatar: playerAvatar,
          career: playerCareer,
        },
        tabId,
        startPos.current,
        {
          onPlayers: setOthers,
          onStatus: setStatus,
          onChat: (msg) => {
            setMessages((list) => [...list.slice(-49), msg]);
            setBubbles((b) => ({ ...b, [msg.key]: msg }));
            setTimeout(() => {
              setBubbles((b) => {
                if (b[msg.key] !== msg) return b;
                const next = { ...b };
                delete next[msg.key];
                return next;
              });
            }, 6000);
          },
        },
      );
      tavern.current = room;
    }, 0);

    return () => {
      clearTimeout(timer);
      if (room) room.leave();
      tavern.current = null;
    };
  }, [playerId, playerName, playerAvatar, playerCareer, tabId]);

  // Stop any walk in progress when leaving the page
  useEffect(() => {
    const timers = walkTimer;
    return () => clearInterval(timers.current);
  }, []);

  // Keep the chat scrolled to the newest message
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, chatOpen]);

  // Put the player on a tile and tell everyone else
  function setPosition(x, y) {
    posRef.current = { x, y };
    setPos({ x, y });
    if (tavern.current) tavern.current.move(x, y);
  }

  function stopWalking() {
    clearInterval(walkTimer.current);
    walkTimer.current = null;
  }

  // Click the floor: walk there one tile at a time, going around the furniture
  function walkTo(x, y) {
    stopWalking();
    const path = findPath(posRef.current, { x, y });
    if (!path || path.length === 0) return;
    let i = 0;
    setPosition(path[i].x, path[i].y);
    i += 1;
    walkTimer.current = setInterval(() => {
      if (i >= path.length) {
        stopWalking();
        return;
      }
      setPosition(path[i].x, path[i].y);
      i += 1;
    }, 190);
  }

  // Arrow keys: one tile
  function stepBy(dx, dy) {
    stopWalking();
    const nx = posRef.current.x + dx;
    const ny = posRef.current.y + dy;
    if (isWalkable(nx, ny)) setPosition(nx, ny);
  }

  function sendMessage(e) {
    e.preventDefault();
    const clean = text.trim().slice(0, 140);
    if (!clean) return;
    if (!tavern.current || status !== 'SUBSCRIBED') {
      setChatNote('Not connected to the hall yet. Try again in a moment.');
      return;
    }
    setChatNote('');
    tavern.current.say(clean);
    setText('');
  }

  const myKey = playerId ? `${playerId}:${tabId}` : 'me';
  const everyone = others
    .filter((o) => o.key !== myKey)
    .map((o) => ({ ...o, isSelf: false }));

  everyone.push({
    key: myKey,
    username: playerName ?? 'You',
    avatar: playerAvatar,
    career: playerCareer,
    x: pos.x,
    y: pos.y,
    isSelf: true,
  });

  const shownStatus = STATUS[status] ?? {
    text: status,
    dot: 'bg-gold',
  };

  const recent = messages.slice(-30);

  return (
    <Panel title="Guild Hall">
      <div className="grid items-start gap-4 lg:grid-cols-[auto_13rem] lg:justify-center">
        {/* The tavern, sized to fit the screen, with the chat floating in the corner */}
        <div
          className="relative mx-auto w-full lg:mx-0"
          style={{
            maxWidth: '100%',
            width: 'min(calc((100vh - 15rem) * 1.6667), max(20rem, calc(100vw - 24rem)))',
          }}
        >
          <TavernScene
            players={everyone}
            bubbles={bubbles}
            onTile={walkTo}
            onStep={stepBy}
            onQuestTable={() =>
              setNotice(
                'Duo quests are opening soon. Sit here with a friend to take on a quest together.'
              )
            }
          />

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

          {/* Chat floats over the top-left corner */}
          <section
            aria-label="Guild chat"
            className="absolute left-3 top-3 w-[min(17rem,60%)]"
          >
            <button
              type="button"
              aria-expanded={chatOpen}
              onClick={() => setChatOpen((v) => !v)}
              className="mb-1 rounded-sm bg-ink/70 px-2 py-0.5 text-base font-bold text-cream underline"
            >
              {chatOpen ? 'Hide chat' : 'Show chat'}
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

        {/* Who is here */}
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
            Click the floor or use the arrow keys to walk.
          </p>
        </section>
      </div>
    </Panel>
  );
}

export default GuildHallPage;
