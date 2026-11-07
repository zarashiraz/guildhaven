
import { supabase } from '../lib/supabase';

export async function completeQuest(questId) {
  const { data, error } = await supabase.rpc('complete_quest', {
    p_quest_id: questId,
  });

  if (error) throw error;

  return data;
}
