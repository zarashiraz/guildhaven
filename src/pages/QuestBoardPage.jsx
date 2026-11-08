
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Panel from '../components/ui/Panel';
import { supabase } from '../lib/supabase';
import { usePlayer } from '../context/PlayerContext';

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
    id: 'data_science',
    label: 'Data Science',
    bg: '#DFEFFA',
    active: '#A9D7F2',
    text: '#315B78',
    bar: '#8ABEDC',
    view: 'data_science_skill_trends',
  },
];

const normalizeCareer = (career) =>
  String(career ?? '')
    .trim()
    .toLowerCase()
    .replace(/[ -]/g, '_');

function QuestBoardPage() {
  const { player, loading: playerLoading } = usePlayer();

  const playerCareer = normalizeCareer(player?.career);

  const [selectedCareer, setSelectedCareer] = useState(null);
  const [skillsByCareer, setSkillsByCareer] = useState({});
  const [skillErrors, setSkillErrors] = useState({});
  const [skillsLoading, setSkillsLoading] = useState(true);

  const [quests, setQuests] = useState([]);
  const [doneIds, setDoneIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Automatically select the player's career.
  useEffect(() => {
    if (!playerLoading && playerCareer) {
      setSelectedCareer((current) =>
        current ?? playerCareer
      );
    }
  }, [playerCareer, playerLoading]);

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
        data_science: dataScienceResult.data || [],
      });

      setSkillErrors({
        swe: sweResult.error?.message || '',
        business: businessResult.error?.message || '',
        data_science: dataScienceResult.error?.message || '',
      });

      setSkillsLoading(false);

      const user = authResult.data?.user;

      if (user) {
        const { data: completions, error: completionError } =
          await supabase
            .from('quest_completions')
            .select('quest_id')
            .eq('player_id', user.id);

        if (completionError) {
          console.error('Completion lookup:', completionError);
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

  // Keep a career selected when clicking its button.
  function selectCareer(careerId) {
    setSelectedCareer(careerId);
  }

  const activeCareer = selectedCareer || playerCareer;

  const selectedCareerInfo = CAREERS.find(
    (career) => career.id === activeCareer
  );

  const isYourCareer = activeCareer === playerCareer;

  const visibleSkills = (
    skillsByCareer[activeCareer] || []
  ).filter((skill) => Number(skill.percentage) > 0);

  // Only display quests matching the selected career.
  const visibleQuests = quests.filter(
    (quest) =>
      normalizeCareer(quest.career) === activeCareer
  );

  const careerDescription =
    activeCareer === 'swe'
      ? 'software development'
      : activeCareer === 'business'
        ? 'business'
        : 'data science';

  return (
    <div className="space-y-6">
      <Panel title="Skill Demand Tracker">
        <p className="mb-5 text-bark">
          Discover what employers are looking for,
          then build those skills through Guildhaven quests.
        </p>

        {/* Career selection buttons */}
        <div className="flex flex-wrap gap-4 pb-4 pt-2">
          {CAREERS.map((career) => {
            const selected = activeCareer === career.id;

            return (
              <button
                key={career.id}
                type="button"
                onClick={() => selectCareer(career.id)}
                aria-pressed={selected}
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

        {/* Skill demand statistics */}
        {selectedCareerInfo && (
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
              {selectedCareerInfo.label}
            </h3>

            {isYourCareer && (
              <p className="mb-3 text-sm font-bold text-forest">
                ★ Your Career Path
              </p>
            )}

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

            {skillErrors[activeCareer] && (
              <p className="text-red-700">
                Could not load trends:{' '}
                {skillErrors[activeCareer]}
              </p>
            )}

            {!skillsLoading &&
              !skillErrors[activeCareer] &&
              visibleSkills.length === 0 && (
                <p>
                  No skill demand data available yet.
                </p>
              )}

            {!skillsLoading &&
              !skillErrors[activeCareer] &&
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
                              color: selectedCareerInfo.text,
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

      {/* Quest Board follows the selected career */}
      <Panel title="Quest Board">
        {selectedCareerInfo && (
          <div className="mb-5">
            <h3 className="font-display text-lg text-bark">
              {selectedCareerInfo.label} Quests
            </h3>

            {isYourCareer ? (
              <p className="mt-2 text-sm text-forest">
                ★ Your career path. Complete these
                quests to earn XP!
              </p>
            ) : (
              <p className="mt-2 text-sm text-bark">
                Explore these quests! XP can only be
                earned for your selected career path.
              </p>
            )}
          </div>
        )}

        {loading && <p>Loading quests...</p>}

        {error && (
          <p className="text-red-700">
            Could not load quests: {error}
          </p>
        )}

        {!loading &&
          !error &&
          visibleQuests.length === 0 && (
            <p>No quests available for this career yet.</p>
          )}

        {!loading &&
          !error &&
          visibleQuests.length > 0 && (
            <ul className="space-y-3">
              {visibleQuests.map((quest) => {
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
