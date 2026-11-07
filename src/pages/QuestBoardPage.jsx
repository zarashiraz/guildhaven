import { Link } from 'react-router-dom';
import Panel from '../components/ui/Panel';
import { mockQuests, mockCompletedQuests } from '../data/mockData';

function QuestBoardPage() {
  const doneIds = mockCompletedQuests.map((q) => q.quest_id);

  return (
    <Panel title="Quest Board">
      <ul className="space-y-3">
        {mockQuests.map((quest) => {
          const done = doneIds.includes(quest.id);
          return (
            <li
              key={quest.id}
              className="flex items-center justify-between gap-4 border-b-2 border-parchment pb-3"
            >
              <div>
                <p className="font-display text-xl text-bark">{quest.title}</p>
                <p>{quest.description}</p>
              </div>
              {done ? (
                <span className="font-display text-forest">✓ Done</span>
              ) : (
                <Link
                  to={`/quests/${quest.id}`}
                  className="shrink-0 rounded-sm border-4 border-bark bg-forest px-4 py-2 font-display text-cream"
                >
                  Start (+{quest.xp_reward} XP)
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export default QuestBoardPage;