import Panel from '../components/ui/Panel';
import XPBar from '../components/ui/XPBar';
import { getLevelInfo } from '../utils/xp';
import { mockPlayer } from '../data/mockData';

function VillagePage() {
  const { level, xpIntoLevel, xpForNext } = getLevelInfo(mockPlayer.xp);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Panel title={mockPlayer.username}>
        <XPBar current={xpIntoLevel} max={xpForNext} level={level} />
      </Panel>
      <Panel title="Village">
        <p>The three career buildings are coming next.</p>
      </Panel>
    </div>
  );
}

export default VillagePage;