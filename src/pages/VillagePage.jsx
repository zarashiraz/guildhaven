
import { useState } from 'react';
import Panel from '../components/ui/Panel';
import PlayerHUD from '../components/village/PlayerHUD';
import BuildingCard from '../components/village/BuildingCard';
import { usePlayer } from '../context/PlayerContext';
import {
  careers,
  mockQuests,
  mockCompletedQuests,
} from '../data/mockData';

const normalizeCareer = (id) =>
  String(id ?? '').toLowerCase().replace(/[ -]/g, '_');

const xpField = (id) =>
  ({
    swe: 'swe_xp',
    business: 'business_xp',
    data_science: 'data_science_xp',
  })[normalizeCareer(id)];

function VillagePage() {
  const {
    player,
    switchCareer,
    switchingCareer,
  } = usePlayer();

  const [showPicker, setShowPicker] = useState(false);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');

  if (!player) return null;

  const career = careers.find(
    (c) =>
      normalizeCareer(c.id) === normalizeCareer(player.career)
  );

  const doneIds = mockCompletedQuests.map(
    (q) => q.quest_id
  );

  function openPicker() {
    setSelected(player.career);
    setError('');
    setShowPicker(true);
  }

  async function confirmSwitch() {
    try {
      setError('');
      await switchCareer(selected);
      setShowPicker(false);
    } catch (err) {
      setError(err.message || 'Could not switch career.');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Village</h1>

      {/* Existing XP bar remains at the top */}
      <PlayerHUD
        player={player}
        careerName={career?.name}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={openPicker}
          className="rounded-sm border-[3px] border-bark bg-cream px-5 py-3 font-display text-sm text-bark shadow-[3px_3px_0px_#725238] transition hover:-translate-y-1"
        >
          Switch Career Path
        </button>
      </div>

      {showPicker && (
        <div className="rounded-sm border-4 border-bark bg-cream p-6 shadow-[4px_4px_0_0_var(--color-bark)]">
          <h2 className="mb-2 font-display text-xl text-bark">
            Choose Your Career
          </h2>

          <p className="mb-4 text-bark">
            Your XP is saved separately for each career.
            Switching paths will restore your progress
            for that career.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {careers.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c.id)}
                className={`rounded-sm border-[3px] p-4 text-left transition hover:-translate-y-1 ${
                  normalizeCareer(selected) ===
                  normalizeCareer(c.id)
                    ? 'border-forest bg-sage/30'
                    : 'border-bark bg-parchment'
                }`}
              >
                <span className="block font-display text-sm text-bark">
                  {c.name}
                </span>

                <span className="mt-2 block text-sm text-bark">
                  {player[xpField(c.id)] ?? 0} XP saved
                </span>

                {normalizeCareer(selected) ===
                  normalizeCareer(c.id) && (
                  <span className="mt-2 block font-display text-sm text-forest">
                    ✓ Selected
                  </span>
                )}
              </button>
            ))}
          </div>

          {error && (
            <p role="alert" className="mt-3 text-red-700">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={switchingCareer}
              onClick={confirmSwitch}
              className="rounded-sm border-2 border-bark bg-forest px-5 py-3 font-display text-sm text-cream disabled:opacity-50"
            >
              {switchingCareer
                ? 'Switching...'
                : 'Confirm Switch'}
            </button>

            <button
              type="button"
              disabled={switchingCareer}
              onClick={() => setShowPicker(false)}
              className="rounded-sm border-2 border-bark bg-parchment px-5 py-3 font-display text-sm text-bark"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Panel title="The Village">
        <div className="grid gap-6 rounded-sm bg-sage/30 p-6 sm:grid-cols-3">
          {careers.map((c) => {
            const quests = mockQuests.filter(
              (q) =>
                normalizeCareer(q.career) ===
                normalizeCareer(c.id)
            );

            const done = quests.filter(
              (q) => doneIds.includes(q.id)
            ).length;

            return (
              <BuildingCard
                key={c.id}
                career={c}
                done={done}
                total={quests.length}
                isYourPath={
                  normalizeCareer(c.id) ===
                  normalizeCareer(player.career)
                }
              />
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

export default VillagePage;
