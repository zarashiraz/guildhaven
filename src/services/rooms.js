import { supabase } from '../lib/supabase';

// The Guild Hall runs on Supabase Realtime. No database tables are needed:
//   Presence  = who is in the room and where they are standing
//   Broadcast = chat messages
const ROOM_NAME = 'guild-hall';

// player: { id, username, avatar, career }, tabId: any short unique string, start: { x, y }
// handlers: { onPlayers(list), onChat(message), onStatus(text) }
// Returns { move(x, y), say(text), leave() }
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
    .subscribe(async (status) => {
      handlers.onStatus(status);
      if (status === 'SUBSCRIBED') {
        await channel.track(me);
      }
    });

  return {
    key,
    move(x, y) {
      me = { ...me, x, y };
      channel.track(me);
    },
    say(text) {
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