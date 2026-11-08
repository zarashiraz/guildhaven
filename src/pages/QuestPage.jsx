
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Panel from '../components/ui/Panel';
import { supabase } from '../lib/supabase';
import PostOfficeRush from '../games/postOfficeRush/PostOfficeRush';

function QuestPage() {
  const { questId } = useParams();

  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadQuest() {
      setLoading(true);
      setError('');
      setCompleted(false);

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

      const { data: authData } = await supabase.auth.getUser();

      if (authData?.user) {
        const { data: completion, error: completionError } =
          await supabase
            .from('quest_completions')
            .select('quest_id')
            .eq('user_id', authData.user.id)
            .eq('quest_id', data.id)
            .maybeSingle();

        if (completionError) {
          console.error('Completion lookup failed:', completionError);
        }

        if (active && completion) {
          setCompleted(true);
        }
      }

      if (active) setLoading(false);
    }

    loadQuest();

    return () => {
      active = false;
    };
  }, [questId]);

  async function handleQuestComplete() {
    if (!quest) {
      throw new Error('Quest not loaded.');
    }

    if (completed) return;

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData?.user) {
      throw new Error('Please sign in to save your progress.');
    }

    const userId = authData.user.id;

    const { data: existing, error: checkError } =
      await supabase
        .from('quest_completions')
        .select('quest_id')
        .eq('user_id', userId)
        .eq('quest_id', quest.id)
        .maybeSingle();

    if (checkError) {
      throw new Error(checkError.message);
    }

    if (existing) {
      setCompleted(true);
      return;
    }

    const { error: insertError } = await supabase
      .from('quest_completions')
      .insert({
        user_id: userId,
        quest_id: quest.id
      });

    if (insertError) {
      if (insertError.code === '23505') {
        setCompleted(true);
        return;
      }

      throw new Error(insertError.message);
    }

    setCompleted(true);

    window.dispatchEvent(
      new Event('guildhaven:xp-updated')
    );
  }

  function renderMinigame() {
    switch (Number(quest.id)) {
      case 1:
        return <PostOfficeRush onComplete={handleQuestComplete} />;
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

  if (error || !quest) {
    return (
      <Panel title="Quest Not Found">
        <p>{error}</p>
        <Link to="/quests" className="underline">
          ← Back to Quest Board
        </Link>
      </Panel>
    );
  }

  return (
    <Panel title={quest.title}>
      <p>{quest.description}</p>

      {completed && (
        <div className="my-4 rounded-lg border-2 border-green-700 bg-green-50 p-4 text-green-800">
          ✓ Quest already completed!
        </div>
      )}

      <div className="my-6">
        {renderMinigame()}
      </div>

      <Link to="/quests" className="underline">
        ← Back to Quest Board
      </Link>
    </Panel>
  );
}

export default QuestPage;
