import { supabase } from '../lib/supabase';

export async function getSkills() {
  const { data, error } = await supabase
    .from('skills')
    .select('*');

  if (error) throw error;

  return data;
}


export async function createPlayer(username, career, avatar) {
  const { data: { user }, error: authError } =
    await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Player is not authenticated');
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      username,
      career,
      avatar,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}
