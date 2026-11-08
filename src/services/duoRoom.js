import { supabase } from '../lib/supabase';

// A private room for two players doing the duo quest together.
// Presence just says who is connected. Everything else is broadcast messages.

// Supabase gives back a room that is still closing if you open the same name again,
// so a new room always waits for the old one to finish closing.
let closing = Promise.resolve();

// sessionId: the same text for both players. me: { key }.
// handlers: { onStatus(text), onPartnerHere(true/false), onPartnerJoined(), onMessage(payload) }
// Returns { send(payload), leave() }
export function joinDuo(sessionId, me, handlers) {
  let channel = null;
  let left = false;

  closing.then(() => {
    if (left) return;

    const ch = supabase.channel(`duo-${sessionId}`, {
      config: { presence: { key: me.key }, broadcast: { self: false } },
    });
    channel = ch;

    ch.on('presence', { event: 'sync' }, () => {
      if (left || channel !== ch) return;
      const others = Object.keys(ch.presenceState()).filter((k) => k !== me.key);
      handlers.onPartnerHere(others.length > 0);
    })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (left || channel !== ch || key === me.key) return;
        handlers.onPartnerJoined();
      })
      .on('broadcast', { event: 'duo' }, ({ payload }) => {
        if (!left && channel === ch) handlers.onMessage(payload);
      })
      .subscribe(async (status) => {
        if (left || channel !== ch) return;
        handlers.onStatus(status);
        if (status === 'SUBSCRIBED') {
          try {
            await ch.track({ at: Date.now() });
          } catch (err) {
            console.error('Duo room presence failed:', err);
          }
        }
      });
  });

  return {
    send(payload) {
      if (!channel || channel.state !== 'joined') return;
      channel
        .send({ type: 'broadcast', event: 'duo', payload })
        .catch((err) => console.error('Duo message failed:', err));
    },
    leave() {
      left = true;
      const old = channel;
      channel = null;
      if (old) closing = Promise.resolve(supabase.removeChannel(old)).catch(() => {});
    },
  };
}