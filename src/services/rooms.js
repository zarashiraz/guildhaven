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

    ch.on('presence', { event: 'sync' }, () => {
      if (left || channel !== ch) return;

      const state = ch.presenceState();
      const players = Object.entries(state).flatMap(([presenceKey, metas]) =>
        metas.length ? [{ ...metas[metas.length - 1], key: presenceKey }] : []
      );
      handlers.onPlayers(players);
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
      channel.track(me).catch(() => {});
    } else {
      clearTimeout(watchdog);
      watchdog = null;
      attempts = 0;
      startWatchdog();
    }
  }
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('online', wake);

  connect();

  return {
    key,

    move(x, y) {
      me = { ...me, x, y };
      if (joined && channel) {
        channel.track(me).catch((err) => {
          console.error('Player movement sync failed:', err);
        });
      }
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
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('online', wake);
      const old = channel;
      channel = null;
      if (old) closeChannel(old);
    },
  };
}