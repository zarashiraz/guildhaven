
import { supabase } from '../lib/supabase';

// Rules for NEW character usernames.
export function validateUsername(username) {
  const clean = String(username ?? '').trim();

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(clean)) {
    return 'Username must be 3–20 characters, using letters, numbers, or underscores.';
  }

  return null;
}

// Check username availability during character creation.
export async function checkUsername(username) {
  const validation = validateUsername(username);

  if (validation) {
    return {
      available: false,
      error: validation,
    };
  }

  const { data, error } = await supabase.rpc(
    'username_available',
    { p_username: username.trim() }
  );

  if (error) throw error;

  return {
    available: data === true,
    error: null,
  };
}

// Send friend requests by exact username.
// Older accounts with 1- or 2-character names are supported.
export async function sendFriendRequest(username) {
  const clean = String(username ?? '').trim();

  if (!/^[a-zA-Z0-9_]{1,20}$/.test(clean)) {
    throw new Error('Enter a valid username.');
  }

  const { data, error } = await supabase.rpc(
    'send_friend_request',
    { p_username: clean }
  );

  if (error) throw error;

  return data;
}

// Get accepted friends and pending requests.
export async function getFriendships() {
  const { data, error } = await supabase.rpc(
    'get_my_friendships'
  );

  if (error) throw error;

  return data ?? [];
}

// Accept or decline an incoming request.
export async function respondFriendRequest(requestId, accept) {
  const { data, error } = await supabase.rpc(
    'respond_friend_request',
    {
      p_request_id: requestId,
      p_accept: accept,
    }
  );

  if (error) throw error;

  return data;
}
