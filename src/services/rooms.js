import { supabase } from '../lib/supabase';

// The Guild Hall runs on Supabase Realtime. No database tables are needed:
//   Presence  = who is in the room and where they are standing
//   Broadcast = chat messages
const ROOM_NAME = 'guild-hall';

// player: { id, username, avatar, career }, tabId: any short unique string, start: { x, y }
// handlers: { onPlayers(list), onChat(message), onStatus(text) }
// Returns { key, move(x, y), say(text), leave() }
// Supabase reconnects and rejoins the channel by itself, so we just let it.
export function joinTavern(player, tabId, start, handlers) {
  const key = `${player.id}:${tabId}`;
  let me = {
    uid: player.id,
    username: player.username,
    avatar: player.avatar,
    career: player.career,
    x: start.x,
    y: start.y,
  };

  const channel = supabase.channel(ROOM_NAME, {
    config: { presence: { key }, broadcast: { self: true } },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const list = Object.entries(state).map(([k, metas]) => ({
        key: k,
        ...metas[metas.length - 1],
      }));
      handlers.onPlayers(list);
    })
    .on('broadcast', { event: 'chat' }, ({ payload }) => handlers.onChat(payload))
    .subscribe(async (status, err) => {
      // Open the browser console (F12) to see why a connection drops.
      console.log('[guild hall]', status, err ?? '');
      handlers.onStatus(status);
      if (status === 'SUBSCRIBED') {
        await channel.track(me);
      }
    });

  return {
    key,
    move(x, y) {
      me = { ...me, x, y };
      if (channel.state === 'joined') channel.track(me);
    },
    say(text) {
      if (channel.state !== 'joined') return;
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
      supabase.removeChannel(channel);
    },
  };
}