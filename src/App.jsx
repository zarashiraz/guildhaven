import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CharacterCreationPage from './pages/CharacterCreationPage';
import VillagePage from './pages/VillagePage';
import QuestBoardPage from './pages/QuestBoardPage';
import QuestPage from './pages/QuestPage';
import GuildHallPage from './pages/GuildHallPage';
import PortfolioPage from './pages/PortfolioPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<CharacterCreationPage />} />

      <Route element={<Layout />}>
        <Route path="/village" element={<VillagePage />} />
        <Route path="/quests" element={<QuestBoardPage />} />
        <Route path="/quests/:questId" element={<QuestPage />} />
        <Route path="/guild" element={<GuildHallPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
      </Route>
    </Routes>
  );
}

export default App;