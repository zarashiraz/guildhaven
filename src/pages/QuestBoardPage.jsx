
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Panel from '../components/ui/Panel';
import { supabase } from '../lib/supabase';

const CAREERS = [
  {
    id: 'swe',
    label: 'Software Engineering',
    bg: '#FCE0E9',
    active: '#F4AFC4',
    text: '#69384C',
    bar: '#E89BB5',
    view: 'swe_skill_trends',
  },
  {
    id: 'business',
    label: 'Business',
    bg: '#DDF1E2',
    active: '#A9D8B8',
    text: '#315D42',
    bar: '#94BDA0',
    view: 'business_skill_trends',
  },
  {
    id: 'data-science',
    label: 'Data Science',
    bg: '#DFEFFA',
    active: '#A9D7F2',
    text: '#315B78',
    bar: '#8ABEDC',
    view: 'data_science_skill_trends',
  },
];

function QuestBoardPage() {
  const [selectedCareer, setSelectedCareer] = useState(null);

  const [skillsByCareer, setSkillsByCareer] = useState({
    swe: [],
    business: [],
    'data-science': [],
  });

  const [skillErrors, setSkillErrors] = useState({});
  const [skillsLoading, setSkillsLoading] = useState(true);

  const [quests, setQuests] = useState([]);
  const [doneIds, setDoneIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setSkillsLoading(true);
      setError('');
      setSkillErrors({});

      const [
        questResult,
        sweResult,
        businessResult,
        dataScienceResult,
        authResult,
      ] = await Promise.all([
        supabase
          .from('quests')
          .select('*')
          .order('id'),

        supabase
          .from('swe_skill_trends')
          .select('skill, job_count, percentage')
          .gt('percentage', 0)
          .order('job_count', { ascending: false }),

        supabase
          .from('business_skill_trends')
          .select('skill, job_count, percentage, total_jobs')
          .gt('percentage', 0)
          .order('job_count', { ascending: false }),

        supabase
          .from('data_science_skill_trends')
          .select('skill, job_count, percentage, total_jobs')
          .gt('percentage', 0)
          .order('job_count', { ascending: false }),

        supabase.auth.getUser(),
      ]);

      if (!active) return;

      if (questResult.error) {
        setError(questResult.error.message);
      } else {
        setQuests(questResult.data || []);
      }

      setSkillsByCareer({
        swe: sweResult.data || [],
        business: businessResult.data || [],
        'data-science': dataScienceResult.data || [],
      });

      setSkillErrors({
        swe: sweResult.error?.message || '',
        business: businessResult.error?.message || '',
        'data-science': dataScienceResult.error?.message || '',
      });

      setSkillsLoading(false);

      const user = authResult.data?.user;

      if (user) {
        const {
          data: completions,
          error: completionError,
        } = await supabase
          .from('quest_completions')
          .select('quest_id')
          .eq('player_id', user.id);

        if (completionError) {
          console.error(
            'Completion lookup:',
            completionError
          );
        } else if (active) {
          setDoneIds(
            (completions || []).map(
              (completion) => completion.quest_id
            )
          );
        }
      }

      if (active) setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  function toggleCareer(careerId) {
    setSelectedCareer((current) =>
      current === careerId ? null : careerId
    );
  }

  const selectedCareerInfo = CAREERS.find(
    (career) => career.id === selectedCareer
  );

  const visibleSkills = (
    skillsByCareer[selectedCareer] || []
  ).filter((skill) => Number(skill.percentage) > 0);

  const careerDescription =
    selectedCareer === 'swe'
      ? 'software development'
      : selectedCareer === 'business'
        ? 'business'
        : 'data science';

  return (
    <div className="space-y-6">
      <Panel title="Skill Demand Tracker">
        <p className="mb-5 text-bark">
          Discover what employers are looking for,
          then build those skills through Guildhaven quests.
        </p>

        {/* Career buttons */}
        <div className="flex flex-wrap gap-4 pb-4 pt-2">
          {CAREERS.map((career) => {
            const selected =
              selectedCareer === career.id;

            return (
              <button
                key={career.id}
                type="button"
                onClick={() => toggleCareer(career.id)}
                aria-expanded={selected}
                aria-controls="career-skill-details"
                style={{
                  backgroundColor: selected
                    ? career.active
                    : career.bg,
                  color: career.text,
                  borderColor: selected
                    ? career.text
                    : '#725238',
                  boxShadow: selected
                    ? '3px 4px 0px #725238'
                    : '2px 3px 0px #a98963',
                }}
                className="
                  cursor-pointer
                  rounded-md
                  border-[3px]
                  px-5 py-3
                  font-display
                  text-sm
                  transition-all
                  duration-300
                  ease-out
                  hover:-translate-y-1.5
                  hover:scale-105
                  active:translate-y-0.5
                  active:scale-95
                  focus-visible:outline
                  focus-visible:outline-2
                  focus-visible:outline-offset-4
                  motion-reduce:transform-none
                "
              >
                <span className="flex items-center gap-2">
                  {career.label}

                  <span aria-hidden="true">
                    {selected ? '⌃' : '⌄'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Skill stats stay hidden until a career is selected */}
        {selectedCareer && (
          <div
            id="career-skill-details"
            className="
              mt-4
              border-t-2
              border-[#a98963]
              pt-6
              animate-[fadeIn_0.3s_ease-out]
            "
          >
            <h3 className="mb-2 font-display text-xl text-bark">
              {selectedCareerInfo?.label}
            </h3>

            <p className="mb-6 text-sm text-bark opacity-75">
              Based on sampled Canadian{' '}
              {careerDescription} job postings.
              Percentages represent detected skill
              mentions in this sample, not the entire
              job market.
            </p>

            {skillsLoading && (
              <p>Loading skill trends...</p>
            )}

            {skillErrors[selectedCareer] && (
              <p className="text-red-700">
                Could not load trends:{' '}
                {skillErrors[selectedCareer]}
              </p>
            )}

            {!skillsLoading &&
              !skillErrors[selectedCareer] &&
              visibleSkills.length === 0 && (
                <p>
                  No skill demand data available yet.
                </p>
              )}

            {!skillsLoading &&
              !skillErrors[selectedCareer] &&
              visibleSkills.length > 0 && (
                <div className="space-y-5">
                  {visibleSkills.map((skill) => {
                    const percentage = Math.min(
                      100,
                      Math.max(
                        0,
                        Number(skill.percentage) || 0
                      )
                    );

                    const totalJobs =
                      Number(skill.total_jobs) || 50;

                    return (
                      <div key={skill.skill}>
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <span className="font-display text-bark">
                            {skill.skill}
                          </span>

                          <span
                            className="font-display"
                            style={{
                              color:
                                selectedCareerInfo.text,
                            }}
                          >
                            {percentage.toFixed(1)}%
                          </span>
                        </div>

                        <div className="h-4 overflow-hidden rounded-sm border-2 border-bark bg-[#f0e2c4]">
                          <div
                            className="
                              h-full
                              transition-all
                              duration-700
                              ease-out
                            "
                            style={{
                              width: `${percentage}%`,
                              backgroundColor:
                                selectedCareerInfo.bar,
                            }}
                          />
                        </div>

                        <p className="mt-1 text-xs opacity-70">
                          Found in {skill.job_count} of{' '}
                          {totalJobs} postings
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}
      </Panel>

      {/* Existing Quest Board */}
      <Panel title="Quest Board">
        {loading && <p>Loading quests...</p>}

        {error && (
          <p className="text-red-700">
            Could not load quests: {error}
          </p>
        )}

        {!loading && !error && quests.length === 0 && (
          <p>No quests available yet.</p>
        )}

        {!loading && !error && quests.length > 0 && (
          <ul className="space-y-3">
            {quests.map((quest) => {
              const done = doneIds.includes(quest.id);

              return (
                <li
                  key={quest.id}
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                    border-b-2
                    border-parchment
                    pb-3
                  "
                >
                  <div>
                    <p className="font-display text-xl text-bark">
                      {quest.title}
                    </p>

                    <p>{quest.description}</p>
                  </div>

                  {done ? (
                    <span className="shrink-0 font-display text-forest">
                      ✓ Done
                    </span>
                  ) : (
                    <Link
                      to={`/quests/${quest.id}`}
                      className="
                        shrink-0
                        rounded-sm
                        border-4
                        border-bark
                        bg-forest
                        px-4 py-2
                        font-display
                        text-cream
                        transition-transform
                        hover:-translate-y-1
                      "
                    >
                      Start (+{quest.xp_reward} XP)
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

export default QuestBoardPage;
