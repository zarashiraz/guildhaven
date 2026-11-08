
import { supabase } from '../lib/supabase';

export async function getInDemandSkills(career = 'swe') {
  const { data, error } = await supabase
    .from('skill_demand')
    .select('skill, percentage, source, period, source_url')
    .eq('career', career)
    .order('percentage', { ascending: false });

  if (error) throw error;

  return data ?? [];
}
