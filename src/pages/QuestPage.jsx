
import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Panel from '../components/ui/Panel';
import { supabase } from '../lib/supabase';
import { usePlayer } from '../context/PlayerContext';

import PostOfficeRush from '../games/postOfficeRush/PostOfficeRush';
import DeadlockBakery from '../games/deadlockBakery/DeadlockBakery';
import StakeholderSummit from '../games/stakeholderSummit/StakeholderSummit';
import LedgerDetective from '../games/ledgerDetective/LedgerDetective';
import GradientGarden from '../games/gradientGarden/GradientGarden';
import QueryLibrary from '../games/queryLibrary/QueryLibrary';
import RoadPlanner from '../games/roadPlanner/RoadPlanner';
import FestivalForecast from '../games/festivalForecast/FestivalForecast';
import PotionTrials from '../games/potionTrials/PotionTrials';

const normalizeCareer = (id) =>
  String(id ?? '')
    .trim()
    .toLowerCase()
    .replace(/[ -]/g, '_');

function QuestPage() {
  const { questId } = useParams();
  const { player, refreshPlayer } = usePlayer();

  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Prevent repeated completion requests while one is in progress.
  const savingRef = useRef(false);

  const isYourCareer = Boolean(
    quest &&
      player &&
      normalizeCareer(quest.career) ===
        normalizeCareer(player.career)
  );

  useEffect(() => {
    let active = true;

    async function loadQuest() {
      setLoading(true);
      setError('');
      setQuest(null);
      setCompleted(false);
      setMessage('');

      const { data, error: questError } = await supabase
        .from('quests')
        .select('*')
        .eq('id', questId)
        .single();

      if (!active) return;

      if (questError || !data) {
        setError('Quest not found.');
        setLoading(false);
        return;
      }

      setQuest(data);

      const { data: authData } =
        await supabase.auth.getUser();

      if (authData?.user) {
        const {
          data: completion,
          error: completionError,
        } = await supabase
          .from('quest_completions')
          .select('quest_id')
          .eq('player_id', authData.user.id)
          .eq('quest_id', data.id)
          .maybeSingle();

        if (!active) return;

        if (completionError) {
          console.error(
            'Completion lookup failed:',
            completionError
          );
        }

        if (completion) {
          setCompleted(true);
        }
      }

      if (active) {
        setLoading(false);
      }
    }

    loadQuest();

    return () => {
      active = false;
    };
  }, [questId]);

  // Called when a player claims XP after winning a minigame.
  async function handleQuestComplete() {
    if (!quest) return;

    // Already completed quests can be replayed without XP.
    if (completed) {
      setMessage(
        'You already completed this quest. Enjoy replaying it!'
      );
      return;
    }

    if (savingRef.current || saving) return;

    if (!isYourCareer) {
      throw new Error(
        'Switch to this career in the Village to earn XP.'
      );
    }

    savingRef.current = true;
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { data, error: rpcError } =
        await supabase.rpc(
          'complete_career_quest',
          {
            p_quest_id: Number(quest.id),
          }
        );

      if (rpcError) throw rpcError;

      setCompleted(true);

      setMessage(
        data?.awarded
          ? `Quest complete! +${data.xp_awarded} XP`
          : 'Quest already completed. You can replay it anytime!'
      );

      if (data?.awarded) {
        await refreshPlayer();

        window.dispatchEvent(
          new Event('guildhaven:xp-updated')
        );
      }
    } catch (err) {
      throw new Error(
        err.message || 'Could not complete quest.',
        { cause: err }
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function renderMinigame() {
    switch (Number(quest.id)) {
      case 1:
        return (
          <PostOfficeRush
            onComplete={handleQuestComplete}
          />
        );

      case 2:
        return (
          <DeadlockBakery
            onComplete={handleQuestComplete}
          />
        );

      case 3:
        return (
          <RoadPlanner
            onComplete={handleQuestComplete}
          />
        );

      case 4:
        return (
          <StakeholderSummit
            onComplete={handleQuestComplete}
          />
        );

      case 5:
        return (
          <LedgerDetective
            onComplete={handleQuestComplete}
          />
        );

      case 6:
        return (
          <FestivalForecast
            onComplete={handleQuestComplete}
          />
        );

      case 7:
        return (
          <GradientGarden
            onComplete={handleQuestComplete}
          />
        );

      case 8:
        return (
          <QueryLibrary
            onComplete={handleQuestComplete}
          />
        );

      case 9:
        return (
          <PotionTrials
            onComplete={handleQuestComplete}
          />
        );

      default:
        return (
          <div className="my-6 rounded-sm border-4 border-dashed border-wood p-8 text-center">
            <h3 className="font-display text-xl text-forest">
              Quest Under Construction
            </h3>

            <p className="mt-3">
              This challenge is being prepared.
            </p>
          </div>
        );
    }
  }

  if (loading) {
    return (
      <Panel title="Loading Quest">
        Loading...
      </Panel>
    );
  }

  if (!quest) {
    return (
      <Panel title="Quest Not Found">
        <p>{error || 'Quest not found.'}</p>

        <Link to="/quests" className="underline">
          ← Back to Quest Board
        </Link>
      </Panel>
    );
  }

  return (
    <Panel title={quest.title}>
      <p>{quest.description}</p>

      {/* CAREER INFORMATION */}
      <div
        className={`my-4 rounded-sm border-2 p-4 ${
          isYourCareer
            ? 'border-forest bg-sage/20 text-forest'
            : 'border-wood bg-parchment text-bark'
        }`}
      >
        <p className="font-display text-sm">
          {isYourCareer
            ? '★ Your Career Path'
            : 'Explore Another Career'}
        </p>

        <p className="mt-2">
          {completed
            ? 'You have already earned XP for this quest. You can revisit and replay it whenever you like.'
            : isYourCareer
              ? 'Complete this quest to earn XP for your selected career.'
              : 'You can view this quest, but XP is only available on your selected career path.'}
        </p>

        {!isYourCareer && !completed && (
          <Link
            to="/village"
            className="mt-2 inline-block underline"
          >
            Switch Career Path →
          </Link>
        )}
      </div>

      {/* COMPLETED QUEST BANNER */}
      {completed && (
        <div
          className="
            my-4
            border-4
            border-[#8CB99B]
            bg-[#E3F3E7]
            p-4
            text-[#3E7652]
          "
          style={{
            boxShadow: '4px 4px 0 #B7D9C1',
          }}
        >
          <p className="font-display text-lg font-bold">
            ✓ Quest Completed
          </p>

          <p className="mt-2 text-sm">
            You have already completed this adventure!
            Feel free to explore the challenge again,
            experiment with different solutions,
            or replay it for practice.
          </p>

          <p className="mt-2 text-sm font-bold">
            XP has already been awarded.
            Replaying will not award additional XP.
          </p>
        </div>
      )}

      {/* ERRORS */}
      {error && (
        <p
          role="alert"
          className="my-3 text-red-700"
        >
          {error}
        </p>
      )}

      {/* COMPLETION MESSAGE */}
      {message && (
        <p
          role="status"
          className="
            my-3
            rounded-sm
            border-2
            border-[#8CB99B]
            bg-[#E3F3E7]
            p-3
            text-forest
          "
        >
          {message}
        </p>
      )}

      {/* ALWAYS RENDER THE MINIGAME */}
      <div className="my-6">
        {renderMinigame()}
      </div>

      {/* RETURN TO QUEST BOARD */}
      <Link
        to="/quests"
        className="
          inline-block
          rounded-sm
          border-4
          border-bark
          bg-[#E9DFF8]
          px-4 py-2
          font-display
          text-[#654B80]
          transition-transform
          hover:-translate-y-1
        "
      >
        ← Back to Quest Board
      </Link>
    </Panel>
  );
}

export default QuestPage;
