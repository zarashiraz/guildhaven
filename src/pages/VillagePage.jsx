import Panel from '../components/ui/Panel';
import PlayerHUD from '../components/village/PlayerHUD';
import BuildingCard from '../components/village/BuildingCard';
import { usePlayer } from '../context/PlayerContext';
import { careers, mockQuests, mockCompletedQuests } from '../data/mockData';

function VillagePage() {
  const { player } = usePlayer();
  const career = careers.find((c) => c.id === player.career);
  const doneIds = mockCompletedQuests.map((q) => q.quest_id);

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Village</h1>

      <PlayerHUD player={player} careerName={career?.name} />

      <Panel title="The Village">
        <div className="grid gap-6 rounded-sm bg-sage/30 p-6 sm:grid-cols-3">
          {careers.map((c) => {
            const quests = mockQuests.filter((q) => q.career === c.id);
            const done = quests.filter((q) => doneIds.includes(q.id)).length;

            return (
              <BuildingCard
                key={c.id}
                career={c}
                done={done}
                total={quests.length}
                isYourPath={c.id === player.career}
              />
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

export default VillagePage;