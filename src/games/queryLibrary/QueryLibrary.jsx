
import { useState } from 'react';
import Button from '../../components/ui/Button';
import GameFrame from '../../components/games/GameFrame';
import {
  ROWS,
  CHALLENGES,
  parseWindow,
  runWindow,
} from './sqlEngine';

const same = (a, b) =>
  JSON.stringify(a) === JSON.stringify(b);

const PARTS = [
  'a calculation (SUM or AVG), and a PARTITION BY.',
  'a ranking function with no column inside the brackets, a PARTITION BY, and an ORDER BY with DESC.',
  'a function that looks at an earlier row, a PARTITION BY, and an ORDER BY.',
  'a SUM, a PARTITION BY, and an ORDER BY.',
];

const show = (v) =>
  v === null ? 'NULL' : String(v);

function LibraryArt() {
  return (
    <svg
      viewBox="0 0 160 120"
      width="160"
      height="120"
      aria-hidden="true"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect x="10" y="95" width="140" height="8" fill="#A88D77" />
      <rect x="15" y="103" width="12" height="12" fill="#8B715F" />
      <rect x="133" y="103" width="12" height="12" fill="#8B715F" />

      <rect x="20" y="28" width="20" height="67" fill="#A8B9A2" />
      <rect x="24" y="34" width="12" height="54" fill="#DCE8D7" />

      <rect x="43" y="17" width="19" height="78" fill="#C8A4A9" />
      <rect x="47" y="24" width="11" height="61" fill="#EED7DA" />

      <rect x="65" y="35" width="20" height="60" fill="#9EACC4" />
      <rect x="69" y="41" width="12" height="47" fill="#DFE7F1" />

      <rect x="88" y="24" width="20" height="71" fill="#D7BD91" />
      <rect x="92" y="30" width="12" height="57" fill="#F4E8CD" />

      <rect x="111" y="42" width="22" height="53" fill="#B8A7C5" />
      <rect x="115" y="48" width="14" height="39" fill="#E8DFF0" />

      <rect x="23" y="43" width="14" height="4" fill="#8C9F88" />
      <rect x="46" y="38" width="13" height="4" fill="#B17E87" />
      <rect x="68" y="55" width="14" height="4" fill="#788AA8" />
      <rect x="91" y="45" width="14" height="4" fill="#BA9B6B" />
      <rect x="114" y="62" width="16" height="4" fill="#9985AB" />

      <rect x="45" y="74" width="14" height="3" fill="#B17E87" />
      <rect x="91" y="76" width="14" height="3" fill="#BA9B6B" />
    </svg>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#958A78]">
      {children}
    </p>
  );
}

function QueryLibrary({ onComplete }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [won, setWon] = useState(false);

  const challenge = CHALLENGES[index];
  const isLast = index === CHALLENGES.length - 1;

  function runQuery() {
    const parsed = parseWindow(text);

    if (parsed.error) {
      setResult({ error: parsed.error });
      return;
    }

    const values = runWindow(parsed.spec);
    const correct = same(values, challenge.expected);

    setResult({ values, correct });

    if (correct && isLast) setWon(true);
  }

  function nextQuestion() {
    setIndex((i) => i + 1);
    setText('');
    setResult(null);
  }

  const wrongRows =
    result && result.values
      ? ROWS.map((_, i) => i).filter(
          (i) =>
            result.values[i] !== challenge.expected[i]
        )
      : [];

  return (
    <GameFrame
      title="The Query Library"
      howToPlay={[
        'The librarian keeps a table called loans: how many times each book was borrowed each month.',
        'She asks 4 questions. Each answer is one new column, made with a SQL window function.',
        'Read the "How to read a window function" box below. It shows what each part of the expression does.',
        'Type only the window expression into the dark box, then press "Run query".',
        'You will see your new column next to the expected one. Match the librarian to move on.',
      ]}
      hint={challenge.hint}
      won={won}
      winMessage="You wrote four real SQL window functions: a partitioned total, a rank with ties, LAG, and a running total."
      onComplete={onComplete}
    >
      <div className="space-y-5 text-[#665F56]">

        {/* LIBRARY HEADER */}
        <section className="overflow-hidden border-[3px] border-[#B8AC98] bg-[#F3EFE5]">
          <div className="border-b-2 border-[#D3C9B8] bg-[#E8E2D5] px-4 py-2">
            <SectionLabel>
              Guildhaven Library / Archive Records
            </SectionLabel>
          </div>

          <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-7">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#9D907D]">
                The Archivist's Desk
              </p>

              <h2 className="mt-2 font-display text-3xl font-bold text-[#746453]">
                The Query Library
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#877B6D]">
                Hidden patterns are tucked between the
                shelves. Use SQL window functions to
                uncover the librarian's answers.
              </p>
            </div>

            <div className="hidden shrink-0 sm:block">
              <LibraryArt />
            </div>
          </div>
        </section>

        {/* WINDOW FUNCTION GUIDE */}
        <section className="border-[3px] border-[#C4C5AF] bg-[#F7F7EF] p-5 sm:p-6">
          <SectionLabel>Reference Shelf / SQL Handbook</SectionLabel>

          <h3 className="mt-2 font-display text-xl font-bold text-[#65725D]">
            How to read a window function
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-[#7A8073]">
            A window function adds a new column. Every row
            stays in the table, and each row gets an answer
            worked out from a group of rows around it.
          </p>

          <div className="mt-4 overflow-x-auto border-[3px] border-[#5B625C] bg-[#2C3431] p-4">
            <code className="whitespace-pre font-mono text-sm text-[#DBE9DA]">
              SUM(loans) OVER (PARTITION BY genre ORDER BY month)
            </code>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              {
                title: 'SUM(loans)',
                desc: 'The calculation. Other choices: AVG(loans), RANK(), LAG(loans).',
              },
              {
                title: 'OVER ( ... )',
                desc: 'Do it for every row, without squashing the rows together.',
              },
              {
                title: 'PARTITION BY genre',
                desc: 'Split the rows into separate groups. Each genre is calculated on its own.',
              },
              {
                title: 'ORDER BY month',
                desc: 'Put rows in order inside each group. Used for ranking, LAG and running totals.',
              },
            ].map((part) => (
              <div
                key={part.title}
                className="border-2 border-[#D4D9C9] bg-[#FCFCF7] p-4"
              >
                <code className="text-sm font-bold text-[#61765F]">
                  {part.title}
                </code>
                <p className="mt-2 text-sm leading-relaxed text-[#7D8175]">
                  {part.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 border-l-4 border-[#AAB89E] bg-[#EDF1E7] p-4 text-sm leading-relaxed text-[#697B65]">
            <strong>Example (not one of the answers):</strong>{' '}
            <code className="break-words font-mono text-xs">
              AVG(loans) OVER (PARTITION BY genre)
            </code>{' '}
            gives every Fantasy row the average loans
            of all Fantasy rows (about 54), and every
            Mystery row the average of all Mystery rows
            (about 33).
          </div>
        </section>

        {/* QUERY CHALLENGE */}
        <section className="overflow-hidden border-[3px] border-[#B7AD9E] bg-[#FCF9F2]">
          <div className="border-b-2 border-[#D6CBBE] bg-[#EEE7DA] px-5 py-4">
            <SectionLabel>
              Archive Request / Question {index + 1}
            </SectionLabel>

            <h3 className="mt-2 font-display text-xl font-bold text-[#756452]">
              The librarian's request
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-[#746B61]">
              {challenge.ask}
            </p>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div className="border-l-4 border-[#9EB0A3] bg-[#EDF2ED] p-4 text-sm text-[#637A69]">
              <strong>Parts you will need:</strong>{' '}
              {PARTS[index]}
            </div>

            {/* SQL EDITOR */}
            <div className="overflow-hidden border-[3px] border-[#575F5A] bg-[#28312E]">
              <div className="flex items-center justify-between border-b border-[#4A5750] bg-[#344039] px-4 py-3">
                <span className="font-mono text-xs font-bold text-[#D7E3D7]">
                  library_query.sql
                </span>

                <span className="font-mono text-[10px] uppercase tracking-widest text-[#A9BEAC]">
                  SQL Console
                </span>
              </div>

              <div className="space-y-2 overflow-x-auto p-4 font-mono text-sm text-[#E4EAE0]">
                <p className="whitespace-pre">
                  SELECT title, genre, month, loans,
                </p>

                <label className="block">
                  <span className="sr-only">
                    Your window expression
                  </span>

                  <input
                    type="text"
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setResult(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') runQuery();
                    }}
                    placeholder="FUNCTION(column) OVER (PARTITION BY ... ORDER BY ...)"
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    disabled={won}
                    className="w-full min-w-0 border-2 border-[#718578] bg-[#35443B] px-3 py-3 font-mono text-sm text-[#F0F5EC] outline-none placeholder:text-[#9CB1A1] focus:border-[#B8D3BC]"
                  />
                </label>

                <p>AS answer</p>
                <p>FROM loans;</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={runQuery} disabled={won}>
                Run query
              </Button>

              {result && result.correct && !isLast && (
                <Button
                  variant="secondary"
                  onClick={nextQuestion}
                >
                  Next question
                </Button>
              )}
            </div>

            {/* FEEDBACK */}
            <div role="status" aria-live="polite">
              {result && result.error && (
                <div className="border-l-4 border-[#D1A1A4] bg-[#F8ECEB] p-4 text-sm font-semibold text-[#9D6F72]">
                  {result.error}
                </div>
              )}

              {result && result.values && result.correct && (
                <div className="border-l-4 border-[#9BB7A0] bg-[#E9F1E7] p-4 text-sm font-semibold text-[#607C64]">
                  That matches the librarian's answer exactly.
                </div>
              )}

              {result && result.values && !result.correct && (
                <div className="border-l-4 border-[#D1A1A4] bg-[#F8ECEB] p-4 text-sm font-semibold text-[#9D6F72]">
                  {wrongRows.length} of {ROWS.length} rows
                  are different from what the librarian
                  expected. Compare the two columns below.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* RESULT TABLE */}
        <section className="overflow-hidden border-[3px] border-[#B8AC98] bg-[#FCFAF4]">
          <div className="border-b-2 border-[#D7CBB9] bg-[#EEE7DB] px-5 py-4">
            <SectionLabel>
              Library Records / loans
            </SectionLabel>

            <h3 className="mt-2 font-display text-xl font-bold text-[#746453]">
              {result && result.values
                ? 'Your result'
                : 'The loans table'}
            </h3>

            <p className="mt-1 text-xs text-[#948878]">
              Book borrowing records from the Guildhaven
              library.
            </p>
          </div>

          <div className="overflow-x-auto p-4 sm:p-5">
            <table className="w-full min-w-[460px] border-collapse text-left text-sm">
              <thead className="bg-[#E5E9DD] text-[#62715E]">
                <tr>
                  <th className="p-3">title</th>
                  <th className="p-3">genre</th>
                  <th className="p-3">month</th>
                  <th className="p-3">loans</th>

                  {result && result.values && (
                    <th className="p-3">answer</th>
                  )}

                  {result && result.values && !result.correct && (
                    <th className="p-3">expected</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {ROWS.map((r, i) => {
                  const wrong =
                    result &&
                    result.values &&
                    result.values[i] !==
                      challenge.expected[i];

                  return (
                    <tr
                      key={`${r.title}-${r.month}`}
                      className={
                        wrong
                          ? 'bg-[#F8EBE9]'
                          : i % 2 === 0
                            ? 'bg-[#FFFEFA]'
                            : 'bg-[#F5F4EC]'
                      }
                    >
                      <td className="border-b border-[#E0DED2] p-3 font-semibold text-[#6F6859]">
                        {r.title}
                      </td>

                      <td className="border-b border-[#E0DED2] p-3">
                        {r.genre}
                      </td>

                      <td className="border-b border-[#E0DED2] p-3">
                        {r.month}
                      </td>

                      <td className="border-b border-[#E0DED2] p-3">
                        {r.loans}
                      </td>

                      {result && result.values && (
                        <td className="border-b border-[#E0DED2] p-3 font-mono font-bold text-[#617A67]">
                          {show(result.values[i])}
                          {wrong && (
                            <span className="sr-only">
                              {' '}(different from expected)
                            </span>
                          )}
                        </td>
                      )}

                      {result && result.values && !result.correct && (
                        <td className="border-b border-[#E0DED2] p-3 font-mono text-[#A17676]">
                          {show(challenge.expected[i])}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </GameFrame>
  );
}

export default QueryLibrary;
