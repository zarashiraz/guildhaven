import { useEffect, useRef, useState } from 'react';
import Panel from '../components/ui/Panel';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import TavernScene from '../components/guild/TavernScene';
import { isWalkable, randomSpawn } from '../components/guild/tavernMap';
import { usePlayer } from '../context/PlayerContext';
import { joinTavern } from '../services/rooms';

const CAREER_NAMES = {
  swe: 'Software Engineering',
  business: 'Business',
  data_science: 'Data Science',
};

const careerName = (id) =>
  CAREER_NAMES[String(id ?? '').toLowerCase().replace(/[ -]/g, '_')] ?? '';

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
  const [notice, setNotice] = useState('');
  const tavern = useRef(null);
  const startPos = useRef(pos);
  const logRef = useRef(null);

  useEffect(() => {
    if (!playerId) return undefined;

    const room = joinTavern(
      { id: playerId, username: playerName, avatar: playerAvatar, career: playerCareer },
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

    return () => {
      room.leave();
      tavern.current = null;
    };
  }, [playerId, playerName, playerAvatar, playerCareer, tabId]);

  // Keep the chat scrolled to the newest message
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  function moveTo(x, y) {
    if (!isWalkable(x, y)) return;
    setPos({ x, y });
    if (tavern.current) tavern.current.move(x, y);
  }

  function sendMessage(e) {
    e.preventDefault();
    const clean = text.trim().slice(0, 140);
    if (!clean || !tavern.current) return;
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

  const statusText = {
    connecting: 'Connecting to the hall…',
    SUBSCRIBED: 'Connected. Everyone here is a real Guildhaven player.',
    CHANNEL_ERROR: 'Could not connect to the hall. Check that Realtime is turned on in Supabase.',
    TIMED_OUT: 'The hall took too long to answer. Try refreshing.',
    CLOSED: 'Disconnected from the hall.',
  }[status] ?? status;

  return (
    <Panel title="Guild Hall">
      <p role="status" className="mb-3">
        {statusText}
      </p>

      <TavernScene
        players={everyone}
        bubbles={bubbles}
        onTile={moveTo}
        onStep={(dx, dy) => moveTo(pos.x + dx, pos.y + dy)}
        onQuestTable={() =>
          setNotice('Duo quests are opening soon. Sit here with a friend to take on a quest together.')
        }
      />
      <p className="mt-2">
        Click the floor to walk there, or click the tavern and use the arrow keys. Stand on a stool to sit down.
      </p>

      {notice && (
        <p role="status" className="mt-3 rounded-sm border-4 border-gold bg-parchment p-3">
          {notice}
        </p>
      )}

      <div className="mt-5 grid gap-5 md:grid-cols-[1fr_16rem]">
        <section aria-label="Guild chat" className="rounded-sm border-4 border-wood bg-parchment p-4">
          <h3 className="font-display text-xl font-bold text-bark">Guild chat</h3>
          <ul
            ref={logRef}
            role="log"
            aria-live="polite"
            className="my-2 h-48 space-y-1 overflow-y-auto rounded-sm bg-cream p-2"
          >
            {messages.length === 0 && <li className="italic">No messages yet. Say hello!</li>}
            {messages.map((m, i) => (
              <li key={`${m.at}-${i}`}>
                <strong>{m.username}:</strong> {m.text}
              </li>
            ))}
          </ul>
          <form onSubmit={sendMessage} className="flex flex-wrap gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Your message</span>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={140}
                placeholder="Say something to the hall"
                className="w-full rounded-sm border-4 border-bark bg-cream p-2"
              />
            </label>
            <Button type="submit" disabled={status !== 'SUBSCRIBED'}>
              Send
            </Button>
          </form>
        </section>

        <section aria-label="Who is here" className="rounded-sm border-4 border-wood bg-parchment p-4">
          <h3 className="font-display text-xl font-bold text-bark">Who is here ({everyone.length})</h3>
          <ul className="mt-2 space-y-2">
            {everyone.map((p) => (
              <li key={p.key} className="flex items-center gap-2">
                <Avatar id={p.avatar} className="h-8 w-8 shrink-0" />
                <span>
                  <strong>{p.username}</strong>
                  {p.isSelf && ' (you)'}
                  <br />
                  <span className="text-base">{careerName(p.career)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Panel>
  );
}

export default GuildHallPage;