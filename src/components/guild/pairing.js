// The rules for pairing up at the Duo Quest Table.
// Everything here is plain functions, so it is easy to test.
//
// A pair state looks like: { outgoing: key or null, incoming: { [key]: { name, avatar, at } } }
//   outgoing = the one person you asked to pair with (you can only ask one at a time)
//   incoming = people who asked you
// You are paired when you asked someone who also asked you.

export const OFFER_LIFETIME = 30000;

export const emptyPair = () => ({ outgoing: null, incoming: {} });

// A message arrived from someone else. Returns { state, matched } where matched is their key if paired.
export function receive(state, msg, myKey, now) {
  if (!msg || msg.from === myKey) return { state, matched: null };

  if (msg.kind === 'offer' && msg.to === myKey) {
    const incoming = { ...state.incoming, [msg.from]: { name: msg.name, avatar: msg.avatar, at: now } };
    return {
      state: { ...state, incoming },
      matched: state.outgoing === msg.from ? msg.from : null,
    };
  }

  if (msg.kind === 'cancel' && state.incoming[msg.from]) {
    const incoming = { ...state.incoming };
    delete incoming[msg.from];
    return { state: { ...state, incoming }, matched: null };
  }

  return { state, matched: null };
}

// You asked someone. If they had already asked you, you are paired right away.
export function sendOffer(state, toKey) {
  return {
    state: { ...state, outgoing: toKey },
    matched: state.incoming[toKey] ? toKey : null,
  };
}

export function cancelOffer(state) {
  return { ...state, outgoing: null };
}

// Clean up: drop offers from people who stood up or waited too long.
// If you stood up yourself, everything is dropped. Returns the same object if nothing changed.
// cancelled = the key you had asked, if that offer was dropped (so you can tell them).
export function prune(state, seatedKeys, iAmSeated, now) {
  let incoming = state.incoming;
  let outgoing = state.outgoing;
  let cancelled = null;
  let changed = false;

  for (const [key, info] of Object.entries(state.incoming)) {
    if (!iAmSeated || !seatedKeys.has(key) || now - info.at > OFFER_LIFETIME) {
      if (incoming === state.incoming) incoming = { ...state.incoming };
      delete incoming[key];
      changed = true;
    }
  }

  if (outgoing && (!iAmSeated || !seatedKeys.has(outgoing))) {
    cancelled = outgoing;
    outgoing = null;
    changed = true;
  }

  return { state: changed ? { outgoing, incoming } : state, cancelled };
}

// Both people compute the same name for their private quest room.
export function sessionName(keyA, keyB) {
  return [keyA, keyB]
    .sort()
    .join('+')
    .replace(/[^a-zA-Z0-9+]/g, '');
}