
import { useEffect, useState } from 'react';
import Panel from '../components/ui/Panel';
import PlayerHUD from '../components/village/PlayerHUD';
import BuildingCard from '../components/village/BuildingCard';
import { usePlayer } from '../context/PlayerContext';
import { supabase } from '../lib/supabase';
import { careers, mockQuests } from '../data/mockData';

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

  const [doneIds, setDoneIds] = useState([]);
  const [loadingQuests, setLoadingQuests] = useState(true);
  const [questError, setQuestError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadCompletedQuests() {
      try {
        setQuestError('');

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          if (active) setDoneIds([]);
          return;
        }

        const { data, error: completionError } = await supabase
          .from('quest_completions')
          .select('quest_id')
          .eq('player_id', user.id);

        if (completionError) throw completionError;

        if (active) {
          setDoneIds(
            (data || []).map((row) => Number(row.quest_id))
          );
        }
      } catch (err) {
        if (active) {
          setQuestError(
            err.message || 'Could not load quest progress.'
          );
        }
      } finally {
        if (active) setLoadingQuests(false);
      }
    }

    loadCompletedQuests();

    // Refresh progress when returning to the Village.
    function refreshProgress() {
      if (document.visibilityState === 'visible') {
        loadCompletedQuests();
      }
    }

    window.addEventListener('focus', loadCompletedQuests);
    document.addEventListener(
      'visibilitychange',
      refreshProgress
    );
    window.addEventListener(
      'guildhaven:xp-updated',
      loadCompletedQuests
    );

    return () => {
      active = false;
      window.removeEventListener('focus', loadCompletedQuests);
      document.removeEventListener(
        'visibilitychange',
        refreshProgress
      );
      window.removeEventListener(
        'guildhaven:xp-updated',
        loadCompletedQuests
      );
    };
  }, [player?.id]);

  if (!player) return null;

  const career = careers.find(
    (c) =>
      normalizeCareer(c.id) === normalizeCareer(player.career)
  );

  const completedSet = new Set(doneIds);

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
        {questError && (
          <p
            role="alert"
            className="mb-4 border-l-4 border-red-400 bg-red-50 p-3 text-sm text-red-700"
          >
            {questError}
          </p>
        )}

        {loadingQuests && (
          <p
            role="status"
            className="mb-4 text-sm text-bark"
          >
            Checking your quest journal...
          </p>
        )}

        <div className="grid gap-6 rounded-sm bg-sage/30 p-6 sm:grid-cols-3">
          {careers.map((c) => {
            const quests = mockQuests.filter(
              (q) =>
                normalizeCareer(q.career) ===
                normalizeCareer(c.id)
            );

            const done = quests.filter(
              (q) => completedSet.has(Number(q.id))
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
