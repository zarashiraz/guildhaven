
import XPBar from '../ui/XPBar';
import Avatar from '../ui/Avatar';
import { getLevelInfo } from '../../utils/xp';

function PlayerHUD({ player, careerName }) {
  const careerXP = Number(player?.xp ?? 0);
  const { level, xpIntoLevel, xpForNext } = getLevelInfo(careerXP);

  return (
    <section
      aria-label="Player status"
      className="flex flex-wrap items-center gap-5 rounded-sm border-4 border-bark bg-cream p-4 shadow-[4px_4px_0_0_var(--color-bark)]"
    >
      <Avatar
        id={player.avatar}
        className="h-16 w-16 shrink-0 border-4 border-bark bg-sage"
      />

      <div>
        <p className="font-display text-2xl font-bold text-bark">
          {player.username}
        </p>
        <p>{careerName}</p>
      </div>

      <div className="min-w-48 flex-1">
        <XPBar
          current={xpIntoLevel}
          max={xpForNext}
          level={level}
        />

        <p className="mt-2 text-right text-sm font-semibold text-bark">
          Total Career XP: {careerXP}
        </p>
      </div>
    </section>
  );
}

export default PlayerHUD;
