
import { useState } from 'react';

const SIZE = 5;
const START = [0, 0];
const GOAL = [4, 4];

const ROCKS = new Set([
  '1,1', '2,1', '3,1', '1,3', '3,3'
]);

const MOVES = {
  up: { icon: '↑', dr: -1, dc: 0 },
  down: { icon: '↓', dr: 1, dc: 0 },
  left: { icon: '←', dr: 0, dc: -1 },
  right: { icon: '→', dr: 0, dc: 1 }
};

export default function BrokenRobot({ onComplete }) {
  const [position, setPosition] = useState(START);
  const [commands, setCommands] = useState([]);
  const [message, setMessage] = useState(
    'Sprout needs help getting home! 🌷'
  );
  const [won, setWon] = useState(false);
  const [running, setRunning] = useState(false);
  const [rewarding, setRewarding] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  function addCommand(direction) {
    if (running || won || commands.length >= 20) return;
    setCommands((prev) => [...prev, direction]);
  }

  function reset() {
    if (running || rewarding) return;
    setPosition(START);
    setCommands([]);
    setWon(false);
    setMessage('Try a new path! You got this 🌱');
  }

  async function runProgram() {
    if (running || won || !commands.length) return;

    setRunning(true);
    setPosition(START);
    setMessage('Sprout is following your instructions...');

    let row = START[0];
    let col = START[1];

    for (const direction of commands) {
      await sleep(350);

      const move = MOVES[direction];
      const nextRow = row + move.dr;
      const nextCol = col + move.dc;

      const blocked =
        nextRow < 0 ||
        nextRow >= SIZE ||
        nextCol < 0 ||
        nextCol >= SIZE ||
        ROCKS.has(`${nextRow},${nextCol}`);

      if (blocked) {
        setMessage('Bonk! 🪨 Debug your path and try again.');
        setRunning(false);
        return;
      }

      row = nextRow;
      col = nextCol;
      setPosition([row, col]);
    }

    if (row === GOAL[0] && col === GOAL[1]) {
      setWon(true);
      setMessage('YOU DID IT! Sprout made it home! 🌸');
    } else {
      setMessage('Almost there! Add or change some moves.');
    }

    setRunning(false);
  }

  async function claimReward() {
    if (!won || rewarding || rewarded) return;

    setRewarding(true);

    try {
      await onComplete?.();
      setRewarded(true);
      setMessage('Quest complete! Your progress is saved! ⭐');
    } catch (error) {
      setMessage(`Could not save XP: ${error.message}`);
    } finally {
      setRewarding(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl text-forest">
          🤖 Garden Rescue
        </h2>
        <p className="mt-2 text-sm">
          Help Sprout reach the cottage!
          Plan a route using arrow commands.
        </p>
      </div>

      <div className="mx-auto max-w-sm rounded-xl border-4 border-[#8a633d] bg-[#a9c98c] p-3 shadow-md">
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: SIZE * SIZE }, (_, i) => {
            const row = Math.floor(i / SIZE);
            const col = i % SIZE;
            const key = `${row},${col}`;

            const isRobot =
              position[0] === row && position[1] === col;

            const isGoal =
              GOAL[0] === row && GOAL[1] === col;

            return (
              <div
                key={key}
                className="flex aspect-square items-center justify-center rounded-md border border-[#8eac75] bg-[#d7e9b9] text-2xl sm:text-3xl"
                aria-label={
                  isRobot ? 'Robot' :
                  isGoal ? 'Cottage' :
                  ROCKS.has(key) ? 'Rock' : 'Grass'
                }
              >
                {isRobot ? '🤖' :
                 isGoal ? '🏡' :
                 ROCKS.has(key) ? '🪨' :
                 (row + col) % 3 === 0 ? '🌼' : '🌱'}
              </div>
            );
          })}
        </div>
      </div>

      <p
        aria-live="polite"
        className="rounded-lg bg-[#f4e6bf] p-3 text-center font-semibold text-[#63472d]"
      >
        {message}
      </p>

      <div className="space-y-3">
        <h3 className="font-display text-lg text-forest">
          Your Program 📜
        </h3>

        <div className="flex min-h-14 flex-wrap gap-2 rounded-lg border-2 border-dashed border-[#a98963] p-3">
          {commands.length === 0 ? (
            <span className="text-sm opacity-70">
              Add commands below...
            </span>
          ) : (
            commands.map((command, index) => (
              <span
                key={index}
                className="rounded-md bg-[#e8d3a5] px-3 py-1 text-xl"
              >
                {MOVES[command].icon}
              </span>
            ))
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {Object.entries(MOVES).map(([name, move]) => (
            <button
              key={name}
              type="button"
              disabled={running || won}
              onClick={() => addCommand(name)}
              className="rounded-lg border-2 border-[#725238] bg-[#f2dfb8] px-4 py-2 text-xl font-bold text-[#4a3525] hover:bg-[#e6c992] disabled:opacity-50"
              aria-label={`Add ${name} command`}
            >
              {move.icon}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            disabled={running || won || !commands.length}
            onClick={runProgram}
            className="rounded-lg bg-[#356d43] px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {running ? 'Running...' : '▶ Run Program'}
          </button>

          <button
            type="button"
            disabled={running || rewarding}
            onClick={reset}
            className="rounded-lg bg-[#a87950] px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            ↻ Reset
          </button>

          <button
            type="button"
            disabled={running || won || !commands.length}
            onClick={() => setCommands((prev) => prev.slice(0, -1))}
            className="rounded-lg border-2 border-[#a87950] px-4 py-2"
          >
            Undo
          </button>
        </div>
      </div>

      {won && (
        <div className="rounded-xl border-2 border-[#e0b65a] bg-[#fff2c6] p-5 text-center">
          <p className="text-3xl">🌸 ⭐ 🌸</p>
          <h3 className="mt-2 font-display text-xl">
            Quest Complete!
          </h3>
          <p className="my-3">Sprout is safe. Great debugging!</p>

          <button
            type="button"
            disabled={rewarding || rewarded}
            onClick={claimReward}
            className="rounded-lg bg-[#356d43] px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            {rewarded ? 'Reward Saved ✓' :
             rewarding ? 'Saving...' : 'Claim 50 XP ⭐'}
          </button>
        </div>
      )}
    </div>
  );
}
