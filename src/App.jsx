
import { Navigate, Route, Routes } from 'react-router-dom';
import { usePlayer } from './context/PlayerContext';

import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import CharacterCreationPage from './pages/CharacterCreationPage';
import VillagePage from './pages/VillagePage';
import QuestBoardPage from './pages/QuestBoardPage';
import QuestPage from './pages/QuestPage';
import GuildHallPage from './pages/GuildHallPage';
import PortfolioPage from './pages/PortfolioPage';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#f8eed6] p-12 text-center font-display text-forest">
      Loading Guildhaven...
    </div>
  );
}

function EntryRoute() {
  const { user, player, loading } = usePlayer();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <Navigate
      to={player ? '/village' : '/create-character'}
      replace
    />
  );
}

function AuthRoute() {
  const { user, player, loading } = usePlayer();

  if (loading) return <LoadingScreen />;

  if (user) {
    return (
      <Navigate
        to={player ? '/village' : '/create-character'}
        replace
      />
    );
  }

  return <AuthPage />;
}

function CharacterRoute() {
  const { user, player, loading } = usePlayer();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (player) return <Navigate to="/village" replace />;

  return <CharacterCreationPage />;
}

function ProtectedLayout() {
  const { user, player, loading } = usePlayer();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!player) {
    return <Navigate to="/create-character" replace />;
  }

  return <Layout />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<EntryRoute />} />
      <Route path="/auth" element={<AuthRoute />} />
      <Route
        path="/create-character"
        element={<CharacterRoute />}
      />

      <Route element={<ProtectedLayout />}>
        <Route path="/village" element={<VillagePage />} />
        <Route path="/quests" element={<QuestBoardPage />} />
        <Route
          path="/quests/:questId"
          element={<QuestPage />}
        />
        <Route path="/guild" element={<GuildHallPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
      </Route>

      <Route path="*" element={<EntryRoute />} />
    </Routes>
  );
}

export default App;
