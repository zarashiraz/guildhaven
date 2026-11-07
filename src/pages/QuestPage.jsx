import { useParams, Link } from 'react-router-dom';
import Panel from '../components/ui/Panel';
import { mockQuests } from '../data/mockData';

function QuestPage() {
  const { questId } = useParams();
  const quest = mockQuests.find((q) => q.id === questId);

  if (!quest) {
    return (
      <Panel title="Quest not found">
        <Link to="/quests" className="underline">← Back to the Quest Board</Link>
      </Panel>
    );
  }

  return (
    <Panel title={quest.title}>
      <p>{quest.description}</p>
      <p className="my-6 rounded-sm border-4 border-dashed border-wood p-8 text-center">
        The "{quest.minigame}" mini-game goes here.
      </p>
      <Link to="/quests" className="underline">← Back to the Quest Board</Link>
    </Panel>
  );
}

export default QuestPage;