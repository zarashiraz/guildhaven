
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';

const PlayerContext = createContext(null);

const PROFILE_FIELDS =
  'id, username, career, avatar, total_xp';

function formatPlayer(profile) {
  if (!profile) return null;

  return {
    ...profile,
    xp: profile.total_xp ?? 0,
  };
}

export function PlayerProvider({ children }) {
  const [user, setUser] = useState(null);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    let active = true;
    let requestId = 0;

    async function loadProfile(authUser) {
      const currentRequest = ++requestId;

      if (!active) return;

      setUser(authUser);
      setLoading(true);
      setProfileError('');

      if (!authUser) {
        setPlayer(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_FIELDS)
        .eq('id', authUser.id)
        .maybeSingle();

      if (!active || currentRequest !== requestId) {
        return;
      }

      if (error) {
        console.error('Profile loading error:', error);
        setProfileError(error.message);
        setPlayer(null);
      } else {
        setPlayer(formatPlayer(data));
      }

      setLoading(false);
    }

    // Restore existing Supabase session.
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        console.error('Session error:', error);
      }

      loadProfile(data?.session?.user ?? null);
    });

    // Respond to sign in and sign out.
    const { data: listener } =
      supabase.auth.onAuthStateChange((event, session) => {
        if (
          event !== 'SIGNED_IN' &&
          event !== 'SIGNED_OUT' &&
          event !== 'USER_UPDATED'
        ) {
          return;
        }

        // Run database queries outside the auth callback.
        setTimeout(() => {
          if (active) {
            loadProfile(session?.user ?? null);
          }
        }, 0);
      });

    return () => {
      active = false;
      requestId++;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function createCharacter({
    username,
    career,
    avatar,
  }) {
    if (!user) {
      throw new Error('Please sign in first.');
    }

    const cleanUsername = username.trim();

    if (!cleanUsername) {
      throw new Error('Please enter a character name.');
    }

    if (!career) {
      throw new Error('Please choose a career path.');
    }

    // Do not overwrite an existing character or reset XP.
    const { data: existing, error: checkError } =
      await supabase
        .from('profiles')
        .select(PROFILE_FIELDS)
        .eq('id', user.id)
        .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      const existingPlayer = formatPlayer(existing);
      setPlayer(existingPlayer);
      return existingPlayer;
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: cleanUsername,
        career,
        avatar,
        total_xp: 0,
      })
      .select(PROFILE_FIELDS)
      .single();

    if (error) throw error;

    const newPlayer = formatPlayer(data);

    setPlayer(newPlayer);

    return newPlayer;
  }

  async function refreshPlayer() {
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_FIELDS)
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;

    const updatedPlayer = formatPlayer(data);
    setPlayer(updatedPlayer);

    return updatedPlayer;
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    setUser(null);
    setPlayer(null);
    setProfileError('');
  }

  return (
    <PlayerContext.Provider
      value={{
        user,
        player,
        loading,
        profileError,
        createCharacter,
        refreshPlayer,
        logout,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
