import { supabase } from '../lib/supabase';

// Presence = players and positions
// Broadcast = chat messages
// No database publication changes needed.
const ROOM_NAME = 'guild-hall';

// Supabase hands back the OLD channel if you open the same room while it is still
// closing, which then gets shut down under you. So we always wait for the old one.
let closing = Promise.resolve();
function closeChannel(ch) {
  closing = Promise.resolve(supabase.removeChannel(ch)).catch(() => {});
}

const stamp = () => new Date().toLocaleTimeString();

// Log the raw connection and login events once, so we can see exactly why it drops.
let socketLogged = false;
function logSocketEvents() {
  if (socketLogged) return;
  socketLogged = true;
  const rt = supabase.realtime;
  try {
    rt.onOpen?.(() => console.log(stamp(), '[Guild Hall socket] open'));
    rt.onClose?.((e) => console.log(stamp(), '[Guild Hall socket] CLOSED', e?.code, e?.reason ?? ''));
    rt.onError?.((e) => console.log(stamp(), '[Guild Hall socket] ERROR', e?.message ?? e));
    supabase.auth.onAuthStateChange((event) => console.log(stamp(), '[Guild Hall auth]', event));
  } catch (err) {
    console.log('[Guild Hall socket] could not attach logging', err);
  }
}

export function joinTavern(player, tabId, start, handlers) {
  logSocketEvents();

  const key = `${player.id}:${tabId}`;

  let me = {
    uid: player.id,
    username: player.username,
    avatar: player.avatar,
    career: player.career,
    x: start.x,
    y: start.y,
  };

  let channel = null;
  let left = false;
  let joined = false;
  let watchdog = null;
  let attempts = 0;
  let lastSent = 0;
  let sendTimer = null;
  let lastPresence = []; // who is in the room, from presence
  const positions = new Map(); // key -> { x, y }, from movement messages

  // Movement goes through broadcast messages, NOT presence. Presence has a very low
  // limit on this project and Supabase closes the room if it is exceeded.
  function sendPosition() {
    sendTimer = null;
    lastSent = Date.now();
    if (joined && channel) {
      channel
        .send({ type: 'broadcast', event: 'move', payload: { key, x: me.x, y: me.y } })
        .catch((err) => console.error('Player movement sync failed:', err));
    }
  }

  // Combine "who is here" (presence) with "where they stand" (movement messages)
  function publishPlayers() {
    handlers.onPlayers(
      lastPresence.map((p) => {
        const at = positions.get(p.key);
        return at ? { ...p, x: at.x, y: at.y } : p;
      })
    );
  }

  function connect() {
    closing.then(open);
  }

  function open() {
    if (left || channel) return;

    const ch = supabase.channel(ROOM_NAME, {
      config: {
        presence: { key },
        broadcast: { self: true },
      },
    });
    channel = ch;

    // If Supabase ever closes the room on purpose, this prints the reason.
    ch.on('system', {}, (payload) => {
      if (payload?.status === 'error') console.log(stamp(), '[Guild Hall] server says:', payload.message);
    });

    ch.on('presence', { event: 'sync' }, () => {
      if (left || channel !== ch) return;

      const state = ch.presenceState();
      lastPresence = Object.entries(state).flatMap(([presenceKey, metas]) =>
        metas.length ? [{ ...metas[metas.length - 1], key: presenceKey }] : []
      );
      // Forget positions of people who left
      const here = new Set(lastPresence.map((p) => p.key));
      for (const k of positions.keys()) if (!here.has(k)) positions.delete(k);
      publishPlayers();
    })
      // Someone new arrived: tell them where we are standing
      .on('presence', { event: 'join' }, ({ key: joinedKey }) => {
        if (left || channel !== ch || joinedKey === key) return;
        sendPosition();
      })
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        if (left || channel !== ch || !payload || payload.key === key) return;
        positions.set(payload.key, { x: payload.x, y: payload.y });
        publishPlayers();
      })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        if (!left && channel === ch) handlers.onChat(payload);
      })
      .subscribe(async (status, error) => {
        if (left || channel !== ch) return;

        console.log(stamp(), '[Guild Hall Realtime]', status, error ?? '');
        handlers.onStatus(status);

        if (status === 'SUBSCRIBED') {
          joined = true;
          attempts = 0;
          clearTimeout(watchdog);
          watchdog = null;
          try {
            await ch.track(me);
          } catch (err) {
            console.error('Failed to track player:', err);
          }
          sendPosition();
        } else {
          joined = false;
          startWatchdog();
        }
      });
  }

  // If we are not connected a few seconds after a drop, throw the channel away
  // and build a fresh one. Supabase gets the first few seconds to fix itself.
  function startWatchdog() {
    if (left || watchdog) return;
    const wait = Math.min(2000 + attempts * 1500, 8000);
    watchdog = setTimeout(() => {
      watchdog = null;
      if (left || joined) return;
      attempts += 1;
      console.log(stamp(), '[Guild Hall Realtime] reconnecting, attempt', attempts);
      const old = channel;
      channel = null;
      if (old) closeChannel(old);
      connect();
    }, wait);
  }

  // Coming back to the tab or the internet: check the connection right away.
  function wake() {
    if (left || document.visibilityState === 'hidden') return;
    if (joined && channel) {
      sendPosition();
    } else {
      clearTimeout(watchdog);
      watchdog = null;
      attempts = 0;
      startWatchdog();
    }
  }
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('online', wake);

  // Every few seconds, repeat where we are standing (covers anyone who missed a message)
  const heartbeat = setInterval(() => {
    if (joined && channel) sendPosition();
  }, 4000);

  connect();

  return {
    key,

    // force = send right now (turns and arrivals). Otherwise it is limited to ~4 per second.
    move(x, y, force = false) {
      me = { ...me, x, y };
      if (force) {
        clearTimeout(sendTimer);
        sendPosition();
        return;
      }
      if (sendTimer) return;
      sendTimer = setTimeout(sendPosition, Math.max(0, 250 - (Date.now() - lastSent)));
    },

    async say(text) {
      if (!joined || !channel) return;
      try {
        await channel.send({
          type: 'broadcast',
          event: 'chat',
          payload: { key, username: me.username, avatar: me.avatar, text, at: Date.now() },
        });
      } catch (err) {
        console.error('Chat send failed:', err);
      }
    },

    leave() {
      if (left) return;
      left = true;
      joined = false;
      clearTimeout(watchdog);
      clearTimeout(sendTimer);
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('online', wake);
      const old = channel;
      channel = null;
      if (old) closeChannel(old);
    },
  };
}