import { supabase } from '../lib/supabase';

// The Guild Hall runs on Supabase Realtime. No database tables are needed:
//   Presence  = who is in the room and where they are standing
//   Broadcast = chat messages
const ROOM_NAME = 'guild-hall';

// player: { id, username, avatar, career }, tabId: any short unique string, start: { x, y }
// handlers: { onPlayers(list), onChat(message), onStatus(text) }
// Returns { key, move(x, y), say(text), leave() }
// If the connection drops, it reconnects by itself.
export function joinTavern(player, tabId, start, handlers) {
  // Each browser tab gets its own key, so you can test with two tabs on one account.
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
  let retryTimer = null;
  let retries = 0;

  function connect() {
    if (left) return;
    const ch = supabase.channel(ROOM_NAME, {
      config: { presence: { key }, broadcast: { self: true } },
    });
    channel = ch;

    ch.on('presence', { event: 'sync' }, () => {
      if (channel !== ch) return;
      const state = ch.presenceState();
      const list = Object.entries(state).map(([k, metas]) => ({
        key: k,
        ...metas[metas.length - 1],
      }));
      handlers.onPlayers(list);
    })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        if (channel === ch) handlers.onChat(payload);
      })
      .subscribe(async (status) => {
        if (left || channel !== ch) return;
        handlers.onStatus(status);
        if (status === 'SUBSCRIBED') {
          retries = 0;
          await ch.track(me);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          scheduleReconnect();
        }
      });
  }

  function reconnectNow() {
    if (left) return;
    clearTimeout(retryTimer);
    retryTimer = null;
    const old = channel;
    channel = null;
    if (old) supabase.removeChannel(old);
    connect();
  }

  function scheduleReconnect() {
    if (left || retryTimer) return;
    const wait = Math.min(1000 * 2 ** retries, 8000);
    retries += 1;
    retryTimer = setTimeout(reconnectNow, wait);
  }

  // Coming back to the tab or the internet: make sure we are connected and visible.
  function wake() {
    if (left) return;
    if (document.visibilityState === 'hidden') return;
    if (channel && channel.state === 'joined') {
      channel.track(me);
    } else {
      retries = 0;
      reconnectNow();
    }
  }
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('online', wake);

  connect();

  return {
    key,
    move(x, y) {
      me = { ...me, x, y };
      if (channel && channel.state === 'joined') channel.track(me);
    },
    say(text) {
      if (!channel || channel.state !== 'joined') return;
      channel.send({
        type: 'broadcast',
        event: 'chat',
        payload: {
          key,
          username: me.username,
          avatar: me.avatar,
          text,
          at: Date.now(),
        },
      });
    },
    leave() {
      left = true;
      clearTimeout(retryTimer);
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('online', wake);
      const old = channel;
      channel = null;
      if (old) supabase.removeChannel(old);
    },
  };
}