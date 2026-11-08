
export const OFFER_LIFETIME = 30000;

export const emptyPair = () => ({
  outgoing: null,
  incoming: {},
});

// Handle a pairing message from another player.
export function receive(state, msg, myKey, now) {
  if (!msg || msg.from === myKey) {
    return { state, matched: null };
  }

  if (
    msg.kind === 'offer' &&
    msg.to === myKey
  ) {
    const incoming = {
      ...state.incoming,
      [msg.from]: {
        name: msg.name,
        avatar: msg.avatar,
        career: msg.career,
        at: now,
      },
    };

    return {
      state: {
        ...state,
        incoming,
      },
      matched:
        state.outgoing === msg.from
          ? msg.from
          : null,
    };
  }

  if (
    msg.kind === 'cancel' &&
    state.incoming[msg.from]
  ) {
    const incoming = {
      ...state.incoming,
    };

    delete incoming[msg.from];

    return {
      state: {
        ...state,
        incoming,
      },
      matched: null,
    };
  }

  return {
    state,
    matched: null,
  };
}

// Ask another player to pair.
export function sendOffer(state, toKey) {
  return {
    state: {
      ...state,
      outgoing: toKey,
    },
    matched: state.incoming[toKey]
      ? toKey
      : null,
  };
}

// Cancel your outgoing pairing request.
export function cancelOffer(state) {
  return {
    ...state,
    outgoing: null,
  };
}

// Remove expired pairing requests.
export function prune(
  state,
  seatedKeys,
  iAmSeated,
  now
) {
  let incoming = state.incoming;
  let outgoing = state.outgoing;
  let cancelled = null;
  let changed = false;

  for (const [key, info] of Object.entries(
    state.incoming
  )) {
    if (
      !iAmSeated ||
      !seatedKeys.has(key) ||
      now - info.at > OFFER_LIFETIME
    ) {
      if (incoming === state.incoming) {
        incoming = {
          ...state.incoming,
        };
      }

      delete incoming[key];
      changed = true;
    }
  }

  if (
    outgoing &&
    (!iAmSeated ||
      !seatedKeys.has(outgoing))
  ) {
    cancelled = outgoing;
    outgoing = null;
    changed = true;
  }

  return {
    state: changed
      ? { outgoing, incoming }
      : state,
    cancelled,
  };
}

// Both players compute the same private room name.
export function sessionName(keyA, keyB) {
  return [keyA, keyB]
    .sort()
    .join('+')
    .replace(/[^a-zA-Z0-9+]/g, '');
}
