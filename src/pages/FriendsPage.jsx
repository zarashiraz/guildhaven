
import Panel from '../components/ui/Panel';
import FriendsPanel from '../components/guild/FriendsPanel';
import { usePlayer } from '../context/PlayerContext';

export default function FriendsPage() {
  const { player } = usePlayer();

  return (
    <Panel title="Friends">
      <div className="mx-auto w-full max-w-4xl">
        <FriendsPanel playerId={player?.id} />
      </div>
    </Panel>
  );
}
