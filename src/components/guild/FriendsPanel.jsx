
import { useCallback, useEffect, useState } from 'react';
import Avatar from '../ui/Avatar';
import {
  getFriendships,
  sendFriendRequest,
  respondFriendRequest,
} from '../../services/friends';

function FriendRow({ item, children }) {
  return (
    <li className="flex items-center gap-2 border-b border-wood/30 py-2">
      <Avatar
        id={item.avatar}
        className="h-8 w-8 shrink-0"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">
          {item.username}
        </p>

        <p className="text-sm capitalize">
          {item.career?.replaceAll('_', ' ')}
        </p>
      </div>

      {children}
    </li>
  );
}

export default function FriendsPanel({ playerId }) {
  const [username, setUsername] = useState('');
  const [friendships, setFriendships] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!playerId) {
      setFriendships([]);
      return;
    }

    setLoading(true);

    try {
      const data = await getFriendships();
      setFriendships(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Check for incoming requests every 5 seconds.
  // This does not modify Guild Hall Realtime.
  useEffect(() => {
    if (!playerId) return;

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        getFriendships()
          .then(setFriendships)
          .catch((error) => {
            console.error('Friend refresh failed:', error);
          });
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [playerId]);

  async function addFriend(e) {
    e.preventDefault();

    if (busy || !username.trim()) return;

    setBusy(true);
    setMessage('');

    try {
      const result = await sendFriendRequest(username);

      setMessage(result);
      setUsername('');

      await refresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function respond(id, accept) {
    if (busy) return;

    setBusy(true);
    setMessage('');

    try {
      const result = await respondFriendRequest(id, accept);

      setMessage(result);

      await refresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  const friends = friendships.filter(
    (item) => item.friendship_status === 'accepted'
  );

  const incoming = friendships.filter(
    (item) =>
      item.friendship_status === 'pending' &&
      item.direction === 'incoming'
  );

  const outgoing = friendships.filter(
    (item) =>
      item.friendship_status === 'pending' &&
      item.direction === 'outgoing'
  );

  return (
    <section
      aria-label="Guild friends"
      className="rounded-sm border-4 border-wood bg-parchment p-3"
    >
      <h3 className="font-display text-lg font-bold text-bark">
        Guild Friends
      </h3>

      <form
        onSubmit={addFriend}
        className="mt-3 flex flex-wrap gap-2"
      >
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          maxLength={20}
          aria-label="Friend's username"
          className="min-w-0 flex-1 rounded-sm border-2 border-bark bg-cream px-2 py-1"
        />

        <button
          type="submit"
          disabled={busy || !username.trim()}
          className="rounded-sm border-2 border-bark bg-gold px-3 py-1 font-bold disabled:opacity-50"
        >
          {busy ? 'Wait...' : 'Add'}
        </button>
      </form>

      {message && (
        <p role="status" className="mt-2 text-sm font-bold">
          {message}
        </p>
      )}

      {loading && (
        <p className="mt-2 text-sm">
          Loading friends...
        </p>
      )}

      <div className="mt-4">
        <h4 className="font-bold">
          Friend Requests ({incoming.length})
        </h4>

        {incoming.length === 0 && (
          <p className="mt-1 text-sm">
            No incoming requests.
          </p>
        )}

        <ul>
          {incoming.map((item) => (
            <FriendRow
              key={item.request_id}
              item={item}
            >
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    respond(item.request_id, true)
                  }
                  className="rounded-sm bg-forest px-2 py-1 text-sm text-cream disabled:opacity-50"
                >
                  Accept
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    respond(item.request_id, false)
                  }
                  className="rounded-sm bg-coral px-2 py-1 text-sm text-cream disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            </FriendRow>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <h4 className="font-bold">
          Friends ({friends.length})
        </h4>

        {friends.length === 0 && (
          <p className="mt-1 text-sm">
            No friends yet. Invite someone!
          </p>
        )}

        <ul>
          {friends.map((item) => (
            <FriendRow
              key={item.request_id}
              item={item}
            />
          ))}
        </ul>
      </div>

      {outgoing.length > 0 && (
        <div className="mt-4">
          <h4 className="font-bold">
            Sent Requests ({outgoing.length})
          </h4>

          <ul>
            {outgoing.map((item) => (
              <FriendRow
                key={item.request_id}
                item={item}
              >
                <span className="text-sm">
                  Pending
                </span>
              </FriendRow>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
