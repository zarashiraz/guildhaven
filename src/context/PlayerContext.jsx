
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';
import {
  checkUsername,
  validateUsername,
} from '../services/friends';

const PlayerContext = createContext(null);

const PROFILE_FIELDS =
  'id, username, career, avatar, total_xp, swe_xp, business_xp, data_science_xp';

const normalizeCareer = (id) =>
  String(id ?? '').toLowerCase().replace(/[ -]/g, '_');

const xpField = (career) =>
  ({
    swe: 'swe_xp',
    business: 'business_xp',
    data_science: 'data_science_xp',
  })[normalizeCareer(career)];

function formatPlayer(profile) {
  if (!profile) return null;

  return {
    ...profile,
    xp: profile[xpField(profile.career)] ?? 0,
  };
}

export function PlayerProvider({ children }) {
  const [user, setUser] = useState(null);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [switchingCareer, setSwitchingCareer] = useState(false);

  useEffect(() => {
    let active = true;
    let requestId = 0;

    async function loadProfile(authUser) {
      const id = ++requestId;

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

      if (!active || id !== requestId) return;

      if (error) {
        console.error('Profile loading error:', error);
        setProfileError(error.message);
        setPlayer(null);
      } else {
        setPlayer(formatPlayer(data));
      }

      setLoading(false);
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        console.error('Session error:', error);
      }

      loadProfile(data?.session?.user ?? null);
    });

    const { data: listener } =
      supabase.auth.onAuthStateChange((event, session) => {
        if (
          !['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)
        ) {
          return;
        }

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

  async function createCharacter({ username, career, avatar }) {
    if (!user) {
      throw new Error('Please sign in first.');
    }

    const cleanUsername = username?.trim() ?? '';

    if (!cleanUsername) {
      throw new Error('Please enter a character name.');
    }

    if (!xpField(career)) {
      throw new Error('Please choose a valid career path.');
    }

    // Load an existing character if this user already has one.
    const { data: existing, error: checkError } =
      await supabase
        .from('profiles')
        .select(PROFILE_FIELDS)
        .eq('id', user.id)
        .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      const result = formatPlayer(existing);
      setPlayer(result);
      return result;
    }

    // Validate username formatting.
    const validationError = validateUsername(cleanUsername);

    if (validationError) {
      throw new Error(validationError);
    }

    // Check whether username is already taken.
    const { available, error: usernameError } =
      await checkUsername(cleanUsername);

    if (usernameError) {
      throw new Error(usernameError);
    }

    if (!available) {
      throw new Error(
        'This username is already taken! Please choose another.'
      );
    }

    // Create new character.
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

    if (error) {
      // Catch any duplicate username error from Supabase.
      // This also protects against two people registering
      // the same username at the same time.
      if (error.code === '23505') {
        throw new Error(
          'This username is already taken! Please choose another.'
        );
      }

      throw error;
    }

    const result = formatPlayer(data);
    setPlayer(result);

    return result;
  }

  async function refreshPlayer() {
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_FIELDS)
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;

    const result = formatPlayer(data);
    setPlayer(result);

    return result;
  }

  async function switchCareer(newCareer) {
    if (!user || !player) {
      throw new Error('Please sign in first.');
    }

    if (!xpField(newCareer)) {
      throw new Error('Invalid career path.');
    }

    if (newCareer === player.career) {
      return player;
    }

    setSwitchingCareer(true);

    try {
      const { error } = await supabase.rpc(
        'switch_career_path',
        { p_career: newCareer }
      );

      if (error) throw error;

      return await refreshPlayer();
    } finally {
      setSwitchingCareer(false);
    }
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
        switchingCareer,
        createCharacter,
        switchCareer,
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
