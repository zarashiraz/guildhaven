
import { useState } from 'react';
import Button from '../../components/ui/Button';
import GameFrame from '../../components/games/GameFrame';

const BUDGET = 14;

const REQS = [
  { id: 'online', name: 'Online ticket booking', days: 4 },
  { id: 'paper', name: 'Paper tickets at the gate', days: 2 },
  { id: 'phone', name: 'Phone booking line', days: 3 },
  { id: 'stage', name: 'Live music stage', days: 4 },
  { id: 'quiet', name: 'Quiet reading corner', days: 2 },
  { id: 'food', name: 'Food stalls', days: 3 },
  { id: 'kids', name: 'Free entry for kids', days: 1 },
  { id: 'fire', name: 'Late-night fireworks', days: 3 },
  { id: 'recycle', name: 'Recycling stations', days: 1 },
];

const PEOPLE = [
  {
    name: 'Mayor Elm',
    says: '"Keep it safe, green and open to every family. No fireworks. The permit alone would eat our budget."',
    needs: [['kids'], ['recycle']],
    blocks: ['fire'],
  },
  {
    name: 'Mira the Baker',
    says: '"I need food stalls, and people must be able to book their tickets ahead of time."',
    needs: [['food'], ['online', 'phone']],
    blocks: [],
  },
  {
    name: 'Old Fox',
    says: '"Half the elders do not use the internet. They still need a way to get tickets."',
    needs: [['paper', 'phone']],
    blocks: [],
  },
  {
    name: 'Tomas the Musician',
    says: '"I need a stage. The music is the whole point of the festival!"',
    needs: [['stage']],
    blocks: [],
  },
  {
    name: 'Librarian Wren',
    says: '"I would like a quiet corner. And no fireworks, they frighten the library cats."',
    needs: [['quiet']],
    blocks: ['fire'],
  },
];

const nameOf = (id) => REQS.find((r) => r.id === id).name;

function statusFor(person, chosen) {
  const refused = person.blocks.filter((id) => chosen.includes(id));

  if (refused.length > 0) {
    return {
      ok: false,
      text: `Refuses to sign: you included ${refused.map(nameOf).join(', ')}.`,
    };
  }

  const missing = person.needs.filter(
    (group) => !group.some((id) => chosen.includes(id))
  );

  if (missing.length > 0) {
    return {
      ok: false,
      text: `Not yet. Still needs: ${missing
        .map((g) => g.map(nameOf).join(' or '))
        .join('; ')}.`,
    };
  }

  return { ok: true, text: 'Signed off.' };
}

const COLORS = {
  ink: '#66546B',
  border: '#947D9A',
  lavender: '#EDE3F8',
  pink: '#FBE5ED',
  mint: '#E2F3E8',
  blue: '#E2EFFB',
  yellow: '#FFF1D8',
  peach: '#FCE8D8',
};

const FEATURE_COLORS = [
  '#FBE5ED',
  '#E2EFFB',
  '#EDE3F8',
  '#FFF1D8',
  '#E2F3E8',
  '#FCE8D8',
];

const VILLAGER_COLORS = [
  {
    bg: '#E2F3E8',
    skin: '#E6B38E',
    hair: '#7A594A',
    outfit: '#80B69B',
    accent: '#507C64',
  },
  {
    bg: '#FBE5ED',
    skin: '#D99D78',
    hair: '#70463C',
    outfit: '#D989A8',
    accent: '#A95D7B',
  },
  {
    bg: '#FFF1D8',
    skin: '#C99473',
    hair: '#E6D6C4',
    outfit: '#C99D68',
    accent: '#926E43',
  },
  {
    bg: '#E2EFFB',
    skin: '#E9B58D',
    hair: '#4C414E',
    outfit: '#82A8D8',
    accent: '#547BAA',
  },
  {
    bg: '#EDE3F8',
    skin: '#C88F6D',
    hair: '#5D4755',
    outfit: '#AA8DCD',
    accent: '#8066A3',
  },
];

function PixelVillager({ index, size = 76 }) {
  const p = VILLAGER_COLORS[index];

  return (
    <div
      className="shrink-0 border-[3px] p-1"
      style={{
        background: p.bg,
        borderColor: p.accent,
        boxShadow: '3px 3px 0 #D7C8D9',
      }}
    >
      <svg
        viewBox="0 0 64 72"
        width={size}
        height={size}
        role="img"
        aria-label={`${PEOPLE[index].name} pixel-art portrait`}
        style={{ imageRendering: 'pixelated' }}
      >
        <rect x="13" y="24" width="38" height="30" fill={p.hair} />
        <rect x="19" y="23" width="26" height="30" fill={p.skin} />
        <rect x="17" y="18" width="30" height="13" fill={p.hair} />

        {index === 0 && (
          <>
            <rect x="15" y="10" width="34" height="10" fill="#54866D" />
            <rect x="21" y="5" width="22" height="10" fill="#54866D" />
            <rect x="29" y="8" width="6" height="6" fill="#F8DF8C" />
          </>
        )}

        {index === 1 && (
          <>
            <rect x="15" y="9" width="34" height="13" fill="#FFF9F1" />
            <rect x="11" y="18" width="42" height="7" fill="#FFF9F1" />
            <rect x="19" y="23" width="26" height="4" fill="#E8D7C8" />
          </>
        )}

        {index === 2 && (
          <>
            <rect x="15" y="17" width="34" height="8" fill="#B9986E" />
            <rect x="23" y="8" width="18" height="12" fill="#B9986E" />
            <rect x="23" y="38" width="18" height="4" fill="#E6D6C4" />
          </>
        )}

        {index === 3 && (
          <>
            <rect x="15" y="12" width="34" height="10" fill="#4C414E" />
            <rect x="22" y="7" width="20" height="9" fill="#4C414E" />
            <rect x="14" y="27" width="5" height="13" fill="#4C414E" />
          </>
        )}

        {index === 4 && (
          <>
            <rect x="13" y="14" width="38" height="10" fill="#5D4755" />
            <rect x="11" y="23" width="8" height="24" fill="#5D4755" />
            <rect x="45" y="23" width="8" height="24" fill="#5D4755" />
            <rect x="20" y="33" width="12" height="8" fill="none" stroke="#604C69" strokeWidth="2" />
            <rect x="34" y="33" width="12" height="8" fill="none" stroke="#604C69" strokeWidth="2" />
            <rect x="32" y="35" width="2" height="2" fill="#604C69" />
          </>
        )}

        <rect x="24" y="34" width="4" height="4" fill="#3C303A" />
        <rect x="36" y="34" width="4" height="4" fill="#3C303A" />
        <rect x="29" y="45" width="7" height="2" fill="#AA6A6C" />

        <rect x="16" y="54" width="32" height="18" fill={p.outfit} />
        <rect x="10" y="59" width="8" height="13" fill={p.outfit} />
        <rect x="46" y="59" width="8" height="13" fill={p.outfit} />
        <rect x="27" y="54" width="10" height="18" fill="#FFF8F1" />
      </svg>
    </div>
  );
}

function FestivalArt() {
  return (
    <svg
      viewBox="0 0 230 145"
      className="h-36 w-full max-w-[230px]"
      role="img"
      aria-label="Pixel-art festival stalls"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect x="0" y="115" width="230" height="30" fill="#C6DFBF" />
      <rect x="12" y="24" width="7" height="7" fill="#D69AB9" />
      <rect x="42" y="13" width="7" height="7" fill="#9BBDD8" />
      <rect x="186" y="22" width="7" height="7" fill="#E2BB79" />
      <rect x="212" y="48" width="6" height="6" fill="#A7CBAE" />

      <rect x="18" y="69" width="88" height="52" fill="#E6C8A9" />
      <rect x="14" y="55" width="96" height="20" fill="#D887A7" />
      <rect x="14" y="55" width="20" height="20" fill="#FFF4E4" />
      <rect x="54" y="55" width="20" height="20" fill="#FFF4E4" />
      <rect x="94" y="55" width="16" height="20" fill="#FFF4E4" />
      <rect x="42" y="84" width="40" height="25" fill="#A97876" />
      <rect x="48" y="90" width="28" height="13" fill="#FFF0C9" />

      <rect x="124" y="54" width="91" height="67" fill="#D6C5E9" />
      <rect x="119" y="40" width="101" height="20" fill="#9C89CB" />
      <rect x="119" y="40" width="20" height="20" fill="#FFF4E4" />
      <rect x="159" y="40" width="20" height="20" fill="#FFF4E4" />
      <rect x="199" y="40" width="21" height="20" fill="#FFF4E4" />
      <rect x="145" y="75" width="46" height="30" fill="#8074AA" />
      <rect x="153" y="81" width="30" height="18" fill="#F5E5FF" />

      <path d="M18 29 L72 43 L130 24 L186 37 L215 23" fill="none" stroke="#907A9C" strokeWidth="3" />
      <path d="M35 33 L45 48 L55 36 Z" fill="#E8B0BF" />
      <path d="M89 36 L99 51 L109 32 Z" fill="#F2D38B" />
      <path d="M147 28 L157 44 L167 32 Z" fill="#A9D9C0" />
    </svg>
  );
}

function StakeholderSummit({ onComplete }) {
  const [chosen, setChosen] = useState([]);
  const [message, setMessage] = useState('');
  const [won, setWon] = useState(false);

  const used = REQS
    .filter((r) => chosen.includes(r.id))
    .reduce((sum, r) => sum + r.days, 0);

  const over = used - BUDGET;
  const statuses = PEOPLE.map((p) => statusFor(p, chosen));
  const signedCount = statuses.filter((s) => s.ok).length;

  function toggle(id) {
    setChosen((list) =>
      list.includes(id)
        ? list.filter((x) => x !== id)
        : [...list, id]
    );
    setMessage('');
  }

  function present() {
    if (over > 0) {
      setMessage(
        `The plan is ${over} work day${over === 1 ? '' : 's'} over budget. Cut something or find a cheaper way.`
      );
    } else if (signedCount < PEOPLE.length) {
      setMessage(
        `Only ${signedCount} of ${PEOPLE.length} people signed off. Read what each one still needs.`
      );
    } else {
      setMessage('');
      setWon(true);
    }
  }

  const trace = REQS
    .filter((r) => chosen.includes(r.id))
    .map((r) => ({
      req: r,
      who: PEOPLE.filter((p) =>
        p.needs.some((g) => g.includes(r.id))
      ).map((p) => p.name),
    }));

  return (
    <GameFrame
      title="The Stakeholder Summit"
      howToPlay={[
        'Five villagers are planning the Guildhaven festival, and each wants something different.',
        `You have ${BUDGET} work days to build things. Tick the features that go in the plan.`,
        'Each villager shows live whether they would sign off, and what is missing or what they refuse.',
        'Look for features that satisfy more than one person. Then press "Present the plan".',
      ]}
      hint="Two people need a way to get tickets, but they need different things. Is there one feature that covers both of them for less than the two separate features cost? Also, nobody needs the fireworks, and two people refuse them."
      won={won}
      winMessage="Everyone signed off and you stayed in budget. Finding one requirement that serves several stakeholders is exactly what a business analyst does."
      onComplete={onComplete}
    >
      <div className="space-y-6 text-[#66546B]">

        {/* FESTIVAL HEADER */}
        <section
          className="overflow-hidden border-4 border-[#927C99] bg-[#FBE7EF]"
          style={{ boxShadow: '5px 5px 0 #D9C7DB' }}
        >
          <div className="border-b-[3px] border-[#927C99] bg-[#E7D9F5] px-4 py-2 text-center font-mono text-xs font-bold tracking-[0.2em] text-[#715B7D]">
            GUILDHAVEN FESTIVAL COMMITTEE
          </div>

          <div className="flex flex-col items-center justify-between gap-5 bg-gradient-to-br from-[#FCE7EF] via-[#FFF1DC] to-[#E4F3EA] px-5 py-6 sm:flex-row sm:px-7">
            <div>
              <span className="inline-block border-2 border-[#B8A0C8] bg-white/70 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#826A96]">
                Business Quest
              </span>

              <h2 className="mt-3 font-display text-3xl font-bold text-[#654F70]">
                The Stakeholder Summit
              </h2>

              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#76657B]">
                The festival is almost here. Build a plan
                that makes every villager happy without
                going over budget.
              </p>
            </div>

            <div className="shrink-0">
              <FestivalArt />
            </div>
          </div>
        </section>

        {/* LIVE STATUS */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border-[3px] border-[#BCA4D0] bg-[#EFE5F8] p-4">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#8C72A3]">
              Festival Budget
            </p>

            <p className="mt-2 font-display text-3xl font-bold text-[#66517A]">
              {used}
              <span className="text-lg text-[#9A86A8]">
                {' '}/ {BUDGET} days
              </span>
            </p>

            <p className={`mt-1 text-sm font-semibold ${over > 0 ? 'text-[#B65D77]' : 'text-[#796A85]'}`}>
              {over > 0
                ? `${over} day${over === 1 ? '' : 's'} over budget`
                : `${BUDGET - used} work days remaining`}
            </p>

            {/* Budget usage meter, not a quest progress bar */}
            <div
              role="progressbar"
              aria-label="Work days used"
              aria-valuemin={0}
              aria-valuemax={BUDGET}
              aria-valuenow={Math.min(used, BUDGET)}
              aria-valuetext={`${used} of ${BUDGET} work days used`}
              className="mt-3 h-5 overflow-hidden border-2 border-[#927C99] bg-white/80"
            >
              <div
                className={`h-full transition-all duration-300 ${
                  over > 0 ? 'bg-[#E5A1B5]' : 'bg-[#A9CDB7]'
                }`}
                style={{
                  width: `${Math.min(100, (used / BUDGET) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="border-[3px] border-[#9EC6AD] bg-[#E5F4E9] p-4">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#6B9C7B]">
              Committee Approval
            </p>

            <p className="mt-2 font-display text-3xl font-bold text-[#527A60]">
              {signedCount}
              <span className="text-lg text-[#82A68D]">
                {' '}/ {PEOPLE.length} signed
              </span>
            </p>

            <p className="mt-1 text-sm text-[#63826C]">
              Each villager checks your plan automatically.
            </p>

            <div className="mt-3 flex gap-2">
              {statuses.map((s, i) => (
                <div
                  key={PEOPLE[i].name}
                  className={`h-5 flex-1 border-2 ${
                    s.ok
                      ? 'border-[#76A78B] bg-[#A9D6B6]'
                      : 'border-[#C5D8C8] bg-white/70'
                  }`}
                  aria-label={`${PEOPLE[i].name}: ${s.ok ? 'signed' : 'not signed'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid items-start gap-5 lg:grid-cols-2">

          {/* FEATURES */}
          <fieldset
            className="min-w-0 border-4 border-[#947D9A] bg-[#F9F2FB] p-4 sm:p-5"
            style={{ boxShadow: '4px 4px 0 #D9C7DB' }}
          >
            <legend className="px-2 font-display text-xl font-bold text-[#654F70]">
              Features for the plan
            </legend>

            <p className="mb-4 text-sm text-[#85738A]">
              Choose the features your team will build.
              Every feature costs work days.
            </p>

            <ul className="space-y-2">
              {REQS.map((r, i) => {
                const selected = chosen.includes(r.id);

                return (
                  <li key={r.id}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 border-[3px] p-3 transition-all duration-200 hover:-translate-y-0.5 ${
                        selected
                          ? 'border-[#8B76A1] shadow-[3px_3px_0_#D0BBD9]'
                          : 'border-[#E1D3E5] hover:border-[#B8A2C8]'
                      }`}
                      style={{
                        backgroundColor: selected
                          ? FEATURE_COLORS[i % FEATURE_COLORS.length]
                          : '#FFFCFF',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggle(r.id)}
                        className="h-5 w-5 shrink-0 accent-[#8F76AD]"
                      />

                      <span className="flex-1 text-sm font-semibold text-[#65546D]">
                        {r.name}
                      </span>

                      <span className="shrink-0 border-2 border-[#C8B6CC] bg-white/80 px-2 py-1 font-mono text-xs font-bold text-[#816B8C]">
                        {r.days} {r.days === 1 ? 'day' : 'days'}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          {/* STAKEHOLDERS */}
          <section>
            <div className="mb-4 border-b-[3px] border-[#CDB9D2] pb-3">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#A188AD]">
                Festival Committee
              </p>

              <h3 className="mt-1 font-display text-2xl font-bold text-[#654F70]">
                Meet the villagers
              </h3>

              <p className="mt-1 text-sm text-[#86758C]">
                Listen to their requests and earn their approval.
              </p>
            </div>

            <ul className="space-y-4">
              {PEOPLE.map((p, i) => {
                const signed = statuses[i].ok;
                const palette = VILLAGER_COLORS[i];

                return (
                  <li
                    key={p.name}
                    className="overflow-hidden border-[3px] border-[#947D9A]"
                    style={{
                      background: palette.bg,
                      boxShadow: '4px 4px 0 #D9C7DB',
                    }}
                  >
                    <div className="flex items-center gap-3 p-3 sm:p-4">
                      <PixelVillager index={i} />

                      <div className="min-w-0 flex-1">
                        <h4 className="font-display text-lg font-bold text-[#57465F]">
                          {p.name}
                        </h4>

                        <span
                          className={`mt-1 inline-block border-2 px-2 py-0.5 font-mono text-[11px] font-bold ${
                            signed
                              ? 'border-[#8DB99C] bg-[#DDF2E3] text-[#50775D]'
                              : 'border-[#D5B6C4] bg-[#FFF3F7] text-[#A36B81]'
                          }`}
                        >
                          {signed ? 'SIGNED OFF' : 'AWAITING APPROVAL'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t-2 border-[#D8CADB] bg-white/65 p-3 sm:p-4">
                      <p className="text-sm italic leading-relaxed text-[#66566B]">
                        {p.says}
                      </p>

                      <div
                        className={`mt-3 border-l-4 p-3 text-sm font-semibold leading-relaxed ${
                          signed
                            ? 'border-[#83B794] bg-[#E7F5EA] text-[#50765A]'
                            : 'border-[#D5A6BB] bg-[#FFF0F5] text-[#916178]'
                        }`}
                      >
                        {statuses[i].text}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* PRESENT PLAN */}
        <section
          className="border-4 border-[#947D9A] bg-[#FFF0DB] p-5"
          style={{ boxShadow: '4px 4px 0 #E3CFB6' }}
        >
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#AE8861]">
            Final Proposal
          </p>

          <h3 className="mt-1 font-display text-xl font-bold text-[#765D65]">
            Ready to present your plan?
          </h3>

          <p className="mb-4 mt-2 text-sm text-[#806D72]">
            Check your budget and make sure all five
            villagers are willing to sign.
          </p>

          <Button onClick={present} disabled={won}>
            Present the plan
          </Button>

          <div
            role="status"
            aria-live="polite"
            className="mt-3 font-semibold text-[#B15F79]"
          >
            {message}
          </div>
        </section>

        {/* TRACEABILITY */}
        {won && (
          <section
            className="border-4 border-[#8FB69B] bg-[#E7F5EB] p-4 sm:p-5"
            style={{ boxShadow: '4px 4px 0 #C2DCC8' }}
          >
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#6D9C7C]">
              Approved Festival Plan
            </p>

            <h3 className="mt-2 font-display text-2xl font-bold text-[#52745D]">
              Requirements traceability
            </h3>

            <p className="mb-4 mt-2 text-sm text-[#678271]">
              Business analysts keep a table like this to
              show why every feature is in the plan.
            </p>

            <div className="overflow-x-auto border-[3px] border-[#B8D5BF] bg-white/85">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-[#D3EBD9] text-[#50745B]">
                  <tr>
                    <th className="p-3 font-display">Feature</th>
                    <th className="p-3 font-display">Days</th>
                    <th className="p-3 font-display">Needed by</th>
                  </tr>
                </thead>

                <tbody>
                  {trace.map((row, i) => (
                    <tr
                      key={row.req.id}
                      className={i % 2 === 0 ? 'bg-white' : 'bg-[#F1FAF3]'}
                    >
                      <td className="border-t border-[#D5E9DA] p-3">
                        {row.req.name}
                      </td>
                      <td className="border-t border-[#D5E9DA] p-3 font-mono font-bold">
                        {row.req.days}
                      </td>
                      <td className="border-t border-[#D5E9DA] p-3">
                        {row.who.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </GameFrame>
  );
}

export default StakeholderSummit;
