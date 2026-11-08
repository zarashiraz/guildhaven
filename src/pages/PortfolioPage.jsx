import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Panel from '../components/ui/Panel';
import { supabase } from '../lib/supabase';

// Quest IDs correspond to QuestPage.jsx. These are display-only skill labels.
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

const PATHS = [
  { id: 'all', label: 'All Paths', short: 'All', color: '#786858', light: '#EDE4D4' },
  { id: 'Software Engineering', label: 'Software Engineering', short: 'Software', color: '#647D98', light: '#E6EDF4' },
  { id: 'Business', label: 'Business', short: 'Business', color: '#A07869', light: '#F2E6DE' },
  { id: 'Data Science', label: 'Data Science', short: 'Data Science', color: '#688975', light: '#E6EEE5' },
];

const QUEST_NOTES = {
  1: 'Sorted the village mail and made every delivery count.',
  2: 'Kept the bakery running when tasks collided.',
  3: 'Mapped the quickest way between faraway villages.',
  4: 'Balanced the town’s wishes into one workable plan.',
  5: 'Turned messy ledger entries into useful answers.',
  6: 'Prepared the festival for uncertain days ahead.',
  7: 'Helped a tiny model learn, one adjustment at a time.',
  8: 'Found patterns hiding between library shelves.',
  9: 'Tested potion claims with evidence, not guesses.',
};

// Small hand-built pixel motifs instead of stock illustrations or emoji.
function QuestIllustration({ id }) {
  const shapes = {
    1: <><rect x="17" y="24" width="62" height="45" fill="#F9F1E3" stroke="#9C8794" strokeWidth="5"/><path d="M19 27 48 49 77 27" fill="none" stroke="#C7A8B6" strokeWidth="5"/><rect x="58" y="18" width="18" height="13" fill="#B3C9B6"/></>,
    2: <><rect x="22" y="46" width="55" height="25" fill="#C9A28A"/><rect x="16" y="36" width="67" height="15" fill="#E5C7A7"/><rect x="27" y="28" width="45" height="12" fill="#E8B8A3"/><rect x="35" y="21" width="29" height="10" fill="#F2D3B7"/><rect x="29" y="58" width="9" height="8" fill="#F5E4CE"/><rect x="59" y="58" width="9" height="8" fill="#F5E4CE"/></>,
    3: <><path d="M14 69 29 39 46 56 67 21 83 42" stroke="#B5C8A8" strokeWidth="9" fill="none"/><path d="M18 69 38 66 48 43 70 51 83 29" stroke="#A58F7D" strokeWidth="5" fill="none" strokeDasharray="7 5"/><rect x="14" y="65" width="12" height="12" fill="#A6B6D0"/><rect x="76" y="24" width="12" height="12" fill="#D6A7A6"/></>,
    4: <><rect x="19" y="26" width="58" height="49" fill="#D7C4B4"/><rect x="27" y="34" width="42" height="33" fill="#F8EEDD"/><rect x="34" y="42" width="28" height="5" fill="#A9BBA4"/><rect x="34" y="52" width="19" height="5" fill="#B8A8C8"/><rect x="41" y="17" width="14" height="15" fill="#C3A1A7"/></>,
    5: <><rect x="21" y="18" width="49" height="60" fill="#C9B7A6"/><rect x="28" y="26" width="35" height="44" fill="#F8F0DD"/><rect x="35" y="35" width="21" height="4" fill="#A9B9A8"/><rect x="35" y="46" width="21" height="4" fill="#C2AEC9"/><rect x="35" y="57" width="14" height="4" fill="#C2AEC9"/><circle cx="70" cy="62" r="13" fill="none" stroke="#8D9FAF" strokeWidth="6"/><rect x="79" y="72" width="16" height="6" transform="rotate(45 79 72)" fill="#8D9FAF"/></>,
    6: <><rect x="17" y="45" width="65" height="30" fill="#E7C8AD"/><path d="M13 45 28 21 43 45 57 21 72 45 85 23" fill="#CBA9B8" stroke="#B891A3" strokeWidth="4"/><rect x="44" y="54" width="13" height="21" fill="#B2C4B2"/><rect x="24" y="55" width="10" height="10" fill="#F9EEDA"/><rect x="67" y="55" width="10" height="10" fill="#F9EEDA"/></>,
    7: <><rect x="43" y="48" width="11" height="30" fill="#8C9F81"/><rect x="28" y="35" width="18" height="18" fill="#B7D2B0"/><rect x="52" y="31" width="19" height="19" fill="#A5C6A6"/><rect x="38" y="17" width="22" height="22" fill="#D8B5CA"/><rect x="19" y="77" width="61" height="7" fill="#B69A82"/></>,
    8: <><rect x="19" y="25" width="16" height="51" fill="#9CB7AD"/><rect x="39" y="18" width="18" height="58" fill="#B5A3C5"/><rect x="61" y="29" width="17" height="47" fill="#D4B49E"/><rect x="22" y="36" width="10" height="5" fill="#EDE8DA"/><rect x="43" y="32" width="10" height="5" fill="#EDE8DA"/><rect x="65" y="40" width="10" height="5" fill="#EDE8DA"/><rect x="13" y="76" width="72" height="7" fill="#8E7B6D"/></>,
    9: <><rect x="36" y="16" width="26" height="8" fill="#A3A0B8"/><rect x="42" y="24" width="14" height="23" fill="#C8C4D6"/><path d="M42 45 24 73 Q20 82 32 83 H66 Q78 82 72 73 L56 45" fill="#C7DFD2" stroke="#91ADA3" strokeWidth="5"/><rect x="31" y="67" width="35" height="8" fill="#A4C9BC"/><rect x="68" y="22" width="6" height="6" fill="#D7B5C8"/><rect x="77" y="35" width="5" height="5" fill="#D7B5C8"/></>,
  };
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20 shrink-0" aria-hidden="true" style={{ imageRendering: 'pixelated' }}>
      <rect x="6" y="6" width="88" height="88" fill="#FFF9ED" opacity=".65" />
      {shapes[Number(id)] || shapes[4]}
      <rect x="6" y="88" width="88" height="5" fill="#C8B8A3" opacity=".5" />
    </svg>
  );
}

function JournalBook() {
  return (
    <svg viewBox="0 0 180 124" className="h-28 w-40 sm:h-32 sm:w-44" aria-hidden="true" style={{ imageRendering: 'pixelated' }}>
      <rect x="20" y="31" width="140" height="83" fill="#9D8A9B" />
      <rect x="26" y="24" width="61" height="80" fill="#E9DEC8" />
      <rect x="93" y="24" width="61" height="80" fill="#F3E9D7" />
      <rect x="86" y="24" width="7" height="89" fill="#B8A2A7" />
      <rect x="35" y="42" width="39" height="4" fill="#C7B5AE" />
      <rect x="35" y="53" width="29" height="4" fill="#C7B5AE" />
      <rect x="35" y="64" width="36" height="4" fill="#C7B5AE" />
      <rect x="106" y="42" width="34" height="4" fill="#C7B5AE" />
      <rect x="106" y="53" width="26" height="4" fill="#C7B5AE" />
      <rect x="116" y="71" width="17" height="17" fill="#A7BFA9" />
      <rect x="120" y="63" width="9" height="9" fill="#C4D6BB" />
      <rect x="147" y="15" width="11" height="26" fill="#B99EB5" />
      <rect x="16" y="16" width="6" height="6" fill="#D8B998" />
      <rect x="160" y="85" width="7" height="7" fill="#A8C3AC" />
    </svg>
  );
}

function PortfolioPage() {
  const [quests, setQuests] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePath, setActivePath] = useState('all');

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
          if (active) { setQuests([]); setCompletedIds([]); }
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
    return quests.filter((quest) => completed.has(Number(quest.id))).map((quest) => {
      const details = QUEST_SKILLS[Number(quest.id)];
      return {
        ...quest,
        displayTitle: details?.title || quest.title || quest.name || 'Completed Quest',
        track: details?.track || 'Guildhaven',
        skills: details?.skills || [],
      };
    }).sort((a, b) => Number(a.id) - Number(b.id));
  }, [quests, completedIds]);

  const visibleQuests = useMemo(() => activePath === 'all'
    ? completedQuests
    : completedQuests.filter((quest) => quest.track === activePath), [activePath, completedQuests]);
  const visibleSkills = useMemo(() => [...new Set(visibleQuests.flatMap((quest) => quest.skills))], [visibleQuests]);
  const pathsExplored = useMemo(() => new Set(completedQuests.map((quest) => quest.track)).size, [completedQuests]);
  const totalForPath = activePath === 'all' ? quests.length : quests.filter((quest) => QUEST_SKILLS[Number(quest.id)]?.track === activePath).length;
  const currentPath = PATHS.find((path) => path.id === activePath) || PATHS[0];

  return (
    <Panel title="Portfolio">
      <div className="space-y-6 text-[#695F56]">
        {/* Journal cover */}
        <header className="relative overflow-hidden border-[3px] border-[#B9A38E] bg-[#F4EADB] shadow-[5px_5px_0_#D3C2AB]">
          <div className="flex items-center justify-between border-b-2 border-dashed border-[#D6C5B1] bg-[#EEE1CE] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#917A6C]">
            <span>Guildhaven / Field Journal</span><span>Vol. 01</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-5 py-5 sm:px-8">
            <div className="max-w-xl">
              <p className="font-mono text-[11px] uppercase tracking-[.22em] text-[#A08679]">Collected along the way</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[#685749] sm:text-3xl">The Adventurer's Journal</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#88786B]">A little record of places you've been, puzzles you've solved, and things you've learned.</p>
              <div className="mt-4 inline-block -rotate-2 border-2 border-[#B9A0A3] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-[#A17C85]">Property of a Guildhaven adventurer</div>
            </div>
            <div className="hidden sm:block"><JournalBook /></div>
          </div>
        </header>

        {loading && <p className="border-2 border-[#D2C2AD] bg-[#FCF7EB] p-5 text-sm">Opening your journal...</p>}
        {error && <p role="alert" className="border-l-4 border-[#C58F96] bg-[#F8EAEA] p-4 text-sm text-[#A16F79]">{error}</p>}

        {!loading && !error && (
          <>
            {/* Bookmark filters. These change only the displayed portfolio, never the player's career. */}
            <section aria-label="Filter journal by career path">
              <div className="mb-3 flex items-end justify-between gap-2">
                <div><p className="font-mono text-[10px] uppercase tracking-widest text-[#9A8878]">Choose a bookmark</p><h3 className="font-display text-xl font-bold text-[#69584C]">Browse your paths</h3></div>
                <span className="hidden font-mono text-[10px] text-[#9A8878] sm:block">All achievements stay in your journal</span>
              </div>
              <div className="flex flex-wrap items-end gap-2 border-b-[3px] border-[#B6A38D] pb-0">
                {PATHS.map((path) => (
                  <button key={path.id} type="button" onClick={() => setActivePath(path.id)} aria-pressed={activePath === path.id}
                    className={`relative -mb-[3px] border-[3px] px-3 py-3 font-display text-xs font-bold transition-transform sm:px-5 sm:text-sm ${activePath === path.id ? 'z-10 -translate-y-1 border-b-transparent' : 'border-b-[#B6A38D] opacity-80 hover:-translate-y-1 hover:opacity-100'}`}
                    style={{ backgroundColor: path.light, borderColor: path.color, color: path.color, boxShadow: activePath === path.id ? '3px -3px 0 #D5C6B5' : 'none' }}>
                    {path.label}
                  </button>
                ))}
              </div>
            </section>

            {/* A journal note, rather than three identical dashboard metrics */}
            <section className="grid gap-3 md:grid-cols-[1.3fr_1fr]">
              <div className="relative border-2 border-[#C5B39B] bg-[#FFF9EC] px-5 py-5 shadow-[3px_3px_0_#E1D3BD]">
                <div className="absolute right-4 top-0 h-5 w-9 bg-[#D6B9AE]/70" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#A18C75]">Journal entry / {currentPath.short}</p>
                <p className="mt-2 font-display text-3xl font-bold text-[#786350]">{visibleQuests.length} <span className="text-lg text-[#A58F78]">/ {totalForPath}</span></p>
                <p className="mt-1 text-sm text-[#8E7C6A]">quests tucked into this chapter</p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-dashed border-[#D6C7B6] pt-3 font-mono text-xs text-[#8B7B6A]">
                  <span>{visibleSkills.length} skills collected</span>
                  <span>{pathsExplored} career paths explored overall</span>
                </div>
              </div>
              <div className="flex items-center gap-4 border-2 border-[#B8C6B4] bg-[#EEF2E9] px-5 py-4 shadow-[3px_3px_0_#D6E0D2]">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center border-2 border-[#A4B89F] bg-[#DDE9D8] font-display text-3xl text-[#719077]">✦</div>
                <div><p className="font-mono text-[10px] uppercase tracking-widest text-[#7E9A7D]">A little reminder</p><p className="mt-1 font-display text-lg font-bold text-[#607A63]">Every quest counts.</p><p className="mt-1 text-xs leading-relaxed text-[#7A907B]">Your journal remembers every path, even when you explore a new one.</p></div>
              </div>
            </section>

            {/* Skill collection */}
            <section className="border-l-[5px] border-[#A9BDA5] bg-[#F4F5EB] px-5 py-5 sm:px-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#8A9B81]">Pressed flowers & learned things</p><h3 className="mt-1 font-display text-xl font-bold text-[#617A61]">Skill collection</h3></div>
                <span className="border border-[#BAC9B4] px-2 py-1 font-mono text-[10px] text-[#789078]">{visibleSkills.length} discovered</span>
              </div>
              {visibleSkills.length === 0 ? <p className="mt-4 text-sm text-[#82917E]">No skill stamps in this chapter yet. A new quest will change that.</p> : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {visibleSkills.map((skill, i) => <span key={skill} className="inline-flex items-center gap-2 border border-[#B9C8B4] bg-[#FCFBF2] px-3 py-2 text-xs font-semibold text-[#66816B] shadow-[2px_2px_0_#DDE5D7]"><span className="text-[#9DB49D]">{i % 2 === 0 ? '✧' : '✦'}</span>{skill}</span>)}
                </div>
              )}
            </section>

            {/* Scrapbook entries */}
            <section>
              <div className="mb-4 flex items-end justify-between gap-2 border-b-2 border-dashed border-[#CDBBA7] pb-3">
                <div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#9B8979]">Pages from the road</p><h3 className="mt-1 font-display text-2xl font-bold text-[#6C5C50]">Completed adventures</h3></div>
                <span className="font-mono text-xs text-[#A08D7C]">{visibleQuests.length} entries</span>
              </div>
              {visibleQuests.length === 0 ? (
                <div className="border-2 border-dashed border-[#CBB8A2] bg-[#FCF7ED] p-7 text-center">
                  <p className="font-display text-xl font-bold text-[#897765]">An unwritten chapter</p>
                  <p className="mt-2 text-sm text-[#9A897A]">Complete a quest in this path to add its first page.</p>
                  <Link to="/quests" className="mt-4 inline-block border-2 border-[#8AA58B] bg-[#E5EEDC] px-4 py-2 text-sm font-bold text-[#607E65] hover:bg-[#D9E7D2]">Find a quest</Link>
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  {visibleQuests.map((quest, i) => {
                    const theme = PATHS.find((path) => path.id === quest.track) || PATHS[0];
                    return (
                      <article key={quest.id} className="relative flex min-h-[215px] flex-col border-2 border-[#C8B8A4] bg-[#FFFBF2] p-4 shadow-[4px_4px_0_#E2D5C4] sm:p-5">
                        <span className="absolute right-3 top-3 -rotate-6 border-2 border-[#B0BFA8] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-[#7F9B78]">Completed</span>
                        <div className="flex gap-4 pr-16">
                          <div className="flex h-24 w-24 shrink-0 items-center justify-center border-2" style={{ backgroundColor: theme.light, borderColor: theme.color }}><QuestIllustration id={quest.id} /></div>
                          <div className="min-w-0 pt-1">
                            <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: theme.color }}>Entry {String(Number(quest.id)).padStart(2, '0')} / {quest.track}</p>
                            <h4 className="mt-2 font-display text-lg font-bold leading-snug text-[#6B594F]">{quest.displayTitle}</h4>
                            <p className="mt-2 text-xs leading-relaxed text-[#948476]">{QUEST_NOTES[Number(quest.id)] || 'Another adventure for the books.'}</p>
                          </div>
                        </div>
                        <div className="mt-4 border-t border-dashed border-[#D6C7B6] pt-3">
                          <p className="font-mono text-[10px] uppercase tracking-widest text-[#9B8D7A]">Notes learned</p>
                          <div className="mt-2 flex flex-wrap gap-2">{quest.skills.map((skill) => <span key={skill} className="border-b-2 px-2 py-1 text-xs font-medium" style={{ backgroundColor: theme.light, borderColor: theme.color, color: theme.color }}>{skill}</span>)}</div>
                        </div>
                        <div className="mt-auto pt-5"><Link to={`/quests/${quest.id}`} className="inline-block border-2 border-[#A4B79F] bg-[#E9F0E4] px-4 py-2 font-display text-xs font-bold text-[#66816A] hover:bg-[#DCE8D6]">Revisit this quest</Link></div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
            <p className="pb-2 text-center font-mono text-[10px] uppercase tracking-[.2em] text-[#AD9986]">More pages to come · Guildhaven</p>
          </>
        )}
      </div>
    </Panel>
  );
}

export default PortfolioPage;
