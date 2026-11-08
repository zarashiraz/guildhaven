import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Panel from '../components/ui/Panel';
import { supabase } from '../lib/supabase';
import { usePlayer } from '../context/PlayerContext';
import PostOfficeRush from '../games/postOfficeRush/PostOfficeRush';
import DeadlockBakery from '../games/deadlockBakery/DeadlockBakery';
import StakeholderSummit from '../games/stakeholderSummit/StakeholderSummit';
import LedgerDetective from '../games/ledgerDetective/LedgerDetective';

const normalizeCareer = (id) =>
  String(id ?? '').toLowerCase().replace(/[ -]/g, '_');

function QuestPage() {
  const { questId } = useParams();
  const { player, refreshPlayer } = usePlayer();

  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
          .eq('user_id', authData.user.id)
          .eq('quest_id', data.id)
          .maybeSingle();

        if (completionError) {
          console.error(
            'Completion lookup failed:',
            completionError
          );
        }

        if (active && completion) {
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

  // Called by a minigame's "Claim your XP" button after the player wins.
  // It THROWS on failure so the minigame can show the error itself.
  async function handleQuestComplete() {
    if (!quest || completed || saving) return;

    if (!isYourCareer) {
      throw new Error(
        'Switch to this career in the Village to earn XP.'
      );
    }

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
          : 'Quest already completed.'
      );

      await refreshPlayer();

      window.dispatchEvent(
        new Event('guildhaven:xp-updated')
      );
    } catch (err) {
      throw new Error(
        err.message || 'Could not complete quest.'
      );
    } finally {
      setSaving(false);
    }
  }

  function renderMinigame() {
    switch (Number(quest.id)) {
      case 1:
        return <PostOfficeRush onComplete={handleQuestComplete} />;
      case 2:
        return <DeadlockBakery onComplete={handleQuestComplete} />;
      case 4:
        return <StakeholderSummit onComplete={handleQuestComplete} />;
      case 5:
        return <LedgerDetective onComplete={handleQuestComplete} />;
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
          {isYourCareer
            ? 'Complete this quest to earn XP for your selected career.'
            : "You can view this quest, but XP is only available on your selected career path."}
        </p>

        {!isYourCareer && (
          <Link
            to="/village"
            className="mt-2 inline-block underline"
          >
            Switch Career Path →
          </Link>
        )}
      </div>

      {completed && (
        <p className="my-4 rounded-sm border-2 border-forest bg-sage/20 p-4 text-forest">
          ✓ Quest already completed!
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="my-3 text-red-700"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="my-3 text-forest"
        >
          {message}
        </p>
      )}

      <div className="my-6">
        {renderMinigame()}
      </div>

      <Link
        to="/quests"
        className="underline"
      >
        ← Back to Quest Board
      </Link>
    </Panel>
  );
}

export default QuestPage;