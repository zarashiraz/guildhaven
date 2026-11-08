
import { supabase } from '../lib/supabase';

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

  let channel = null;
  let left = false;
  let connected = false;
  let retryTimer = null;
  let retries = 0;
  let generation = 0;

  function updateStatus(status) {
    if (!left) handlers.onStatus(status);
  }

  function clearRetry() {
    if (retryTimer !== null) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  }

  function removeOldChannel(oldChannel) {
    if (!oldChannel) return;

    Promise.resolve(supabase.removeChannel(oldChannel))
      .catch((error) => {
        console.error('[Guild Hall] Channel cleanup:', error);
      });
  }

  function scheduleReconnect() {
    if (left || retryTimer !== null) return;

    connected = false;

    // Do not repeatedly reconnect while offline.
    if (!navigator.onLine) {
      updateStatus('connecting');
      return;
    }

    const delay = Math.min(
        1000 * 2 ** Math.min(retries, 3),
        8000
    );

    retries += 1;

    updateStatus('connecting');

    console.log(
      `[Guild Hall] Reconnecting in ${delay / 1000}s`
    );

    retryTimer = setTimeout(() => {
      retryTimer = null;
      reconnect();
    }, delay);
  }

  function reconnect() {
    if (left) return;

    clearRetry();
    connected = false;

    // Invalidate callbacks from the previous channel.
    generation += 1;

    const oldChannel = channel;
    channel = null;

    removeOldChannel(oldChannel);
    connect();
  }

  function connect() {
    if (left || channel) return;

    updateStatus('connecting');

    const currentGeneration = ++generation;

    const ch = supabase.channel(ROOM_NAME, {
      config: {
        presence: { key },
        broadcast: { self: true },
      },
    });

    channel = ch;

    ch.on('presence', { event: 'sync' }, () => {
      if (
        left ||
        channel !== ch ||
        generation !== currentGeneration
      ) {
        return;
      }

      const state = ch.presenceState();

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
    });

    ch.on('broadcast', { event: 'chat' }, ({ payload }) => {
      if (
        !left &&
        channel === ch &&
        generation === currentGeneration
      ) {
        handlers.onChat(payload);
      }
    });

    ch.subscribe(async (status, error) => {
      if (
        left ||
        channel !== ch ||
        generation !== currentGeneration
      ) {
        return;
      }

      console.log(
        '[Guild Hall Realtime]',
        status,
        error ?? ''
      );

      if (status === 'SUBSCRIBED') {
        clearRetry();
        connected = true;
        retries = 0;

        updateStatus('SUBSCRIBED');

        try {
          await ch.track(me);
        } catch (trackError) {
          console.error(
            '[Guild Hall] Presence tracking failed:',
            trackError
          );
        }

        return;
      }

      if (
        status === 'CHANNEL_ERROR' ||
        status === 'TIMED_OUT' ||
        status === 'CLOSED'
      ) {
        connected = false;
        handlers.onPlayers([]);

        updateStatus(status);
        scheduleReconnect();
      }
    });
  }

  function wake() {
    if (left || !navigator.onLine) return;

    // Reconnect only if the channel is actually unavailable.
    if (
      connected &&
      channel &&
      channel.state === 'joined'
    ) {
      return;
    }

    // Respect an existing retry timer.
    if (retryTimer !== null) return;

    reconnect();
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      wake();
    }
  }

  window.addEventListener('online', wake);
  document.addEventListener(
    'visibilitychange',
    onVisibilityChange
  );

  connect();

  return {
    key,

    move(x, y) {
      me = { ...me, x, y };

      if (
        connected &&
        channel &&
        channel.state === 'joined'
      ) {
        channel.track(me).catch((error) => {
          console.error(
            '[Guild Hall] Movement sync failed:',
            error
          );
        });
      }
    },

    async say(text) {
      if (
        !connected ||
        !channel ||
        channel.state !== 'joined'
      ) {
        throw new Error('Guild Hall is reconnecting.');
      }

      const result = await channel.send({
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

      if (result !== 'ok') {
        throw new Error('Message could not be sent.');
      }
    },

    leave() {
      if (left) return;

      left = true;
      connected = false;
      generation += 1;

      clearRetry();

      window.removeEventListener('online', wake);
      document.removeEventListener(
        'visibilitychange',
        onVisibilityChange
      );

      const oldChannel = channel;
      channel = null;

      removeOldChannel(oldChannel);
    },
  };
}
