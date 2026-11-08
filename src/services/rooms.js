
import { supabase } from '../lib/supabase';

// Presence = players and positions
// Broadcast = chat messages
// No database publication changes needed.
const ROOM_NAME = 'guild-hall';

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

  let left = false;
  let subscribed = false;

  const channel = supabase.channel(ROOM_NAME, {
    config: {
      presence: { key },
      broadcast: { self: true },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      if (left) return;

      const state = channel.presenceState();

      const players = Object.entries(state).flatMap(
        ([presenceKey, metas]) =>
          metas.length
            ? [{
                ...metas[metas.length - 1],
                key: presenceKey,
              }]
            : []
      );

      handlers.onPlayers(players);
    })
    .on('broadcast', { event: 'chat' }, ({ payload }) => {
      if (!left) {
        handlers.onChat(payload);
      }
    })
    .subscribe(async (status, error) => {
      if (left) return;

      console.log('[Guild Hall Realtime]', status, error ?? '');

      handlers.onStatus(status);

      if (status === 'SUBSCRIBED') {
        subscribed = true;

        try {
          await channel.track(me);
        } catch (err) {
          console.error('Failed to track player:', err);
        }
      } else {
        subscribed = false;
        handlers.onPlayers([]);
      }
    });

  return {
    key,

    move(x, y) {
      me = { ...me, x, y };

      if (subscribed) {
        channel.track(me).catch((err) => {
          console.error('Player movement sync failed:', err);
        });
      }
    },

    async say(text) {
      if (!subscribed) return;

      try {
        await channel.send({
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
      } catch (err) {
        console.error('Chat send failed:', err);
      }
    },

    leave() {
      if (left) return;

      left = true;
      subscribed = false;

      supabase.removeChannel(channel).catch((err) => {
        console.error('Failed to leave Guild Hall:', err);
      });
    },
  };
}
