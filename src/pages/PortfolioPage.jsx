import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Panel from '../components/ui/Panel';
import { supabase } from '../lib/supabase';

// Quest IDs match the switch statement in QuestPage.jsx.
const QUEST_SKILLS = {
  1: { title: 'Post Office Rush', track: 'Software Engineering', skills: ['JavaScript', 'Algorithms', 'Debugging'] },
  2: { title: 'Deadlock Bakery', track: 'Software Engineering', skills: ['Concurrency', 'Deadlocks', 'Synchronization'] },
  3: { title: 'The Road Planner', track: 'Software Engineering', skills: ['Graph Algorithms', "Dijkstra's Algorithm", 'Pathfinding'] },
  4: { title: 'Stakeholder Summit', track: 'Business', skills: ['Requirements Analysis', 'Stakeholder Management', 'Prioritization'] },
  5: { title: 'Ledger Detective', track: 'Business', skills: ['Data Analysis', 'Business Metrics', 'Reporting'] },
  6: { title: 'Festival Forecast', track: 'Business', skills: ['Forecasting', 'Decision Making', 'Risk Analysis'] },
  7: { title: 'The Gradient Garden', track: 'Data Science', skills: ['Machine Learning', 'Gradient Descent', 'Overfitting'] },
  8: { title: 'The Query Library', track: 'Data Science', skills: ['SQL', 'Window Functions', 'Data Querying'] },
  9: { title: 'The Potion Trials', track: 'Data Science', skills: ['Hypothesis Testing', 'Statistical Significance', 'Z-Tests'] },
};

const TRACK_COLORS = {
  'Software Engineering': { bg: '#E9EDF5', border: '#B8C4D7', text: '#687A99' },
  Business: { bg: '#F5EBE8', border: '#DCC2B9', text: '#A17C72' },
  'Data Science': { bg: '#E9F0E7', border: '#BDD0B9', text: '#68876D' },
};

function BookArt() {
  return (
    <svg viewBox="0 0 100 100" width="100" height="100" aria-hidden="true" style={{ imageRendering: 'pixelated' }}>
      <rect x="13" y="23" width="34" height="55" fill="#B7A4C7" />
      <rect x="47" y="23" width="40" height="55" fill="#D3C3DF" />
      <rect x="20" y="30" width="22" height="40" fill="#EDE6F2" />
      <rect x="52" y="30" width="28" height="40" fill="#F4EFF7" />
      <rect x="45" y="23" width="5" height="55" fill="#9C89AD" />
      <rect x="25" y="39" width="12" height="3" fill="#C5B4D2" />
      <rect x="25" y="47" width="12" height="3" fill="#C5B4D2" />
      <rect x="56" y="39" width="18" height="3" fill="#D3C4DD" />
      <rect x="56" y="47" width="18" height="3" fill="#D3C4DD" />
      <rect x="56" y="55" width="13" height="3" fill="#D3C4DD" />
      <rect x="13" y="78" width="74" height="6" fill="#A98FB9" />
      <rect x="7" y="14" width="5" height="5" fill="#D5B58D" />
      <rect x="88" y="9" width="5" height="5" fill="#A9C6B0" />
      <rect x="92" y="64" width="4" height="4" fill="#D5B58D" />
    </svg>
  );
}

function PortfolioPage() {
  const [quests, setQuests] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadPortfolio() {
      setLoading(true);
      setError('');
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const user = authData?.user;

        if (!user) {
          if (active) {
            setQuests([]);
            setCompletedIds([]);
          }
          return;
        }

        const [questsResponse, completionsResponse] = await Promise.all([
          supabase.from('quests').select('*'),
          supabase.from('quest_completions').select('quest_id').eq('player_id', user.id),
        ]);

        if (questsResponse.error) throw questsResponse.error;
        if (completionsResponse.error) throw completionsResponse.error;

        if (active) {
          setQuests(questsResponse.data || []);
          setCompletedIds((completionsResponse.data || []).map((row) => Number(row.quest_id)));
        }
      } catch (err) {
        if (active) setError(err.message || 'Unable to load your portfolio.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPortfolio();
    return () => { active = false; };
  }, []);

  const completedQuests = useMemo(() => {
    const completed = new Set(completedIds);
    return quests
      .filter((quest) => completed.has(Number(quest.id)))
      .map((quest) => {
        const details = QUEST_SKILLS[Number(quest.id)];
        return {
          ...quest,
          displayTitle: details?.title || quest.title || quest.name || 'Completed Quest',
          track: details?.track || 'Guildhaven',
          skills: details?.skills || [],
        };
      })
      .sort((a, b) => Number(a.id) - Number(b.id));
  }, [quests, completedIds]);

  const skills = useMemo(
    () => [...new Set(completedQuests.flatMap((quest) => quest.skills))],
    [completedQuests]
  );
  const tracks = useMemo(
    () => [...new Set(completedQuests.map((quest) => quest.track))],
    [completedQuests]
  );

  return (
    <Panel title="Portfolio">
      <div className="space-y-6 text-[#655F68]">
        <section className="overflow-hidden border-[3px] border-[#BDB0C5] bg-[#F4EFF5]">
          <div className="border-b-2 border-[#D7CBDC] bg-[#EAE2EE] px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-[#95819E]">
            Guildhaven / Personal Archive
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-6 sm:px-7">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#9E8FA4]">The Adventurer's Journal</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-[#776582]">Your Story So Far</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#897C90]">
                Every quest leaves a little knowledge behind. Here's everything you've accomplished on your journey through Guildhaven.
              </p>
            </div>
            <div className="hidden shrink-0 sm:block"><BookArt /></div>
          </div>
        </section>

        {loading && <p className="border-2 border-[#D8D0D9] bg-[#FAF7FA] p-5 text-sm">Opening your journal...</p>}
        {error && <p role="alert" className="border-l-4 border-[#D4A2A9] bg-[#F9ECEE] p-4 text-sm text-[#A16F79]">{error}</p>}

        {!loading && !error && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Quests Completed', value: `${completedQuests.length} / ${quests.length}`, bg: '#EDE8F2', color: '#786A8A' },
                { label: 'Skills Learned', value: skills.length, bg: '#E8F0E6', color: '#66846B' },
                { label: 'Paths Explored', value: tracks.length, bg: '#F4EDE4', color: '#987B62' },
              ].map((stat) => (
                <div key={stat.label} className="border-[3px] border-[#D2CBC9] p-4" style={{ backgroundColor: stat.bg }}>
                  <p className="font-mono text-[11px] uppercase tracking-wider" style={{ color: stat.color }}>{stat.label}</p>
                  <p className="mt-2 font-display text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            <section className="border-[3px] border-[#BBCBB8] bg-[#F5F8F2] p-5 sm:p-6">
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#8B9F88]">Knowledge Collected</p>
              <h3 className="mt-2 font-display text-xl font-bold text-[#657F68]">Skills You've Learned</h3>
              {skills.length === 0 ? (
                <p className="mt-3 text-sm text-[#8A9688]">Your skill collection is waiting for its first discovery. Complete a quest to begin!</p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="border-2 border-[#BED0BB] bg-[#E8F0E5] px-3 py-2 text-xs font-semibold text-[#658069]">{skill}</span>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 border-b-2 border-[#DDD4D5] pb-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-[#A19499]">Quest Archive</p>
                <h3 className="mt-2 font-display text-2xl font-bold text-[#766C75]">Completed Adventures</h3>
              </div>
              {completedQuests.length === 0 ? (
                <div className="border-[3px] border-[#D7CFCA] bg-[#FAF8F3] p-6 text-center">
                  <p className="font-display text-xl font-bold text-[#877C7E]">Your journal is waiting...</p>
                  <p className="mt-2 text-sm text-[#9B9191]">Finish your first quest and it will appear here.</p>
                  <Link to="/quests" className="mt-4 inline-block border-2 border-[#B6C7B4] bg-[#E6EFE4] px-4 py-2 text-sm font-bold text-[#638169] hover:bg-[#D9E8D6]">Explore Quests</Link>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {completedQuests.map((quest) => {
                    const theme = TRACK_COLORS[quest.track] || { bg: '#F2F0EC', border: '#D1C9BE', text: '#80786E' };
                    return (
                      <article key={quest.id} className="flex flex-col border-[3px] border-[#CFC7C7] bg-[#FCFAF7]">
                        <div className="border-b-2 px-4 py-3" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                          <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.text }}>{quest.track}</p>
                          <h4 className="mt-2 font-display text-xl font-bold text-[#6C626C]">{quest.displayTitle}</h4>
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#8B9A88]">Skills Earned</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {quest.skills.length ? quest.skills.map((skill) => (
                              <span key={skill} className="border border-[#D8D2D6] bg-[#F5F2F4] px-2 py-1 text-xs text-[#7C727D]">{skill}</span>
                            )) : <span className="text-xs text-[#9B9299]">Quest completed</span>}
                          </div>
                          <div className="mt-auto pt-5">
                            <Link to={`/quests/${quest.id}`} className="inline-block border-2 border-[#B8C8B6] bg-[#E9F0E7] px-4 py-2 text-sm font-bold text-[#68816A] transition-colors hover:bg-[#DCE9D9]">Revisit Quest</Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </Panel>
  );
}

export default PortfolioPage;
