
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
  },
  {
    id: 'business',
    label: 'Business',
    bg: '#DDF1E2',
    active: '#A9D8B8',
    text: '#315D42',
  },
  {
    id: 'uiux',
    label: 'UI/UX Design',
    bg: '#DFEFFA',
    active: '#A9D7F2',
    text: '#315B78',
  },
];

function QuestBoardPage() {
  const [selectedCareer, setSelectedCareer] = useState(null);

  const [skills, setSkills] = useState([]);
  const [quests, setQuests] = useState([]);
  const [doneIds, setDoneIds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [skillsLoading, setSkillsLoading] = useState(true);

  const [error, setError] = useState('');
  const [skillsError, setSkillsError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setSkillsLoading(true);
      setError('');
      setSkillsError('');

      const [questResult, skillResult, authResult] =
        await Promise.all([
          supabase
            .from('quests')
            .select('*')
            .order('id'),

          supabase
            .from('swe_skill_trends')
            .select('skill, job_count, percentage')
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

      if (skillResult.error) {
        setSkillsError(skillResult.error.message);
      } else {
        setSkills(skillResult.data || []);
      }

      setSkillsLoading(false);

      const user = authResult.data?.user;

      if (user) {
        const { data: completions, error: completionError } =
          await supabase
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

      if (active) {
        setLoading(false);
      }
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

  const visibleSkills = skills.filter(
    (skill) => Number(skill.percentage) > 0
  );

  return (
    <div className="space-y-6">

      {/* SKILL DEMAND TRACKER */}
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

        {/* Hidden until a career is selected */}
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

            {selectedCareer === 'swe' ? (
              <div>

                <h3 className="mb-2 font-display text-xl text-bark">
                  Software Engineering
                </h3>

                <p className="mb-6 text-sm text-bark opacity-75">
                  Based on 50 sampled Canadian software
                  development job postings. Percentages
                  represent detected skill mentions in
                  this sample, not the entire job market.
                </p>

                {skillsLoading && (
                  <p>Loading skill trends...</p>
                )}

                {skillsError && (
                  <p className="text-red-700">
                    Could not load trends: {skillsError}
                  </p>
                )}

                {!skillsLoading &&
                  !skillsError &&
                  visibleSkills.length === 0 && (
                    <p>
                      No skill demand data available yet.
                    </p>
                  )}

                {!skillsLoading &&
                  !skillsError &&
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

                        return (
                          <div key={skill.skill}>

                            <div className="mb-2 flex items-center justify-between gap-4">

                              <span className="font-display text-bark">
                                {skill.skill}
                              </span>

                              <span className="font-display text-forest">
                                {percentage.toFixed(1)}%
                              </span>

                            </div>

                            <div className="h-4 overflow-hidden rounded-sm border-2 border-bark bg-[#f0e2c4]">

                              <div
                                className="
                                  h-full
                                  bg-[#356d43]
                                  transition-all
                                  duration-700
                                  ease-out
                                "
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />

                            </div>

                            <p className="mt-1 text-xs opacity-70">
                              Found in {skill.job_count} of
                              50 postings
                            </p>

                          </div>
                        );
                      })}

                    </div>
                  )}

              </div>
            ) : (

              <div className="
                rounded-sm
                border-2
                border-dashed
                border-[#a98963]
                bg-[#fff8e9]
                p-8
                text-center
              ">

                <h3 className="mb-3 font-display text-xl text-bark">
                  {selectedCareerInfo?.label}
                </h3>

                <p className="text-bark">
                  Job market insights for this career
                  are coming soon.
                </p>

              </div>
            )}

          </div>
        )}

      </Panel>

      {/* QUEST BOARD */}
      <Panel title="Quest Board">

        {loading && (
          <p>Loading quests...</p>
        )}

        {error && (
          <p className="text-red-700">
            Could not load quests: {error}
          </p>
        )}

        {!loading &&
          !error &&
          quests.length === 0 && (
            <p>No quests available yet.</p>
          )}

        {!loading &&
          !error &&
          quests.length > 0 && (

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
