import { createContext, useContext, useState } from 'react';

const PlayerContext = createContext(null);
const STORAGE_KEY = 'guildhaven-player';

function loadPlayer() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function PlayerProvider({ children }) {
  const [player, setPlayer] = useState(loadPlayer);

  function createCharacter({ username, career, avatar }) {
    // TODO (Abiya): replace this with signInGuest() and then
    // createPlayer(username, career, avatar) from src/services/players.js
    const newPlayer = { id: crypto.randomUUID(), username, career, avatar, xp: 0 };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlayer));
    } catch {
      // storage unavailable: the player still works for this session
    }
    setPlayer(newPlayer);
  }

  function logout() {
    // TODO (Abiya): also call supabase.auth.signOut() here
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable, nothing to clear
    }
    setPlayer(null);
  }

  return (
    <PlayerContext.Provider value={{ player, createCharacter, logout }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}