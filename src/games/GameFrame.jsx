import { useEffect, useRef, useState } from 'react';
import Button from '../components/ui/Button';

// Shared wrapper for every Guildhaven mini-game.
// Gives each game the same: How to play, Hint, and a win panel that saves the quest.
function GameFrame({
  title,
  howToPlay = [],
  hint,
  won = false,
  winMessage = 'You solved it!',
  onComplete,
  children,
}) {
  const [showHow, setShowHow] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [claim, setClaim] = useState('idle'); // idle | saving | done | error
  const [claimError, setClaimError] = useState('');
  const winRef = useRef(null);

  // When the player wins, move keyboard / screen-reader focus to the win panel.
  useEffect(() => {
    if (won && winRef.current) winRef.current.focus();
  }, [won]);

  async function handleClaim() {
    setClaim('saving');
    setClaimError('');
    try {
      await onComplete();
      setClaim('done');
    } catch (err) {
      setClaimError(err?.message || 'Could not save your reward. Please try again.');
      setClaim('error');
    }
  }

  return (
    <section aria-label={title} className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          aria-expanded={showHow}
          onClick={() => setShowHow((v) => !v)}
        >
          {showHow ? 'Hide how to play' : 'How to play'}
        </Button>
        {hint && (
          <Button
            variant="secondary"
            aria-expanded={showHint}
            onClick={() => setShowHint((v) => !v)}
          >
            {showHint ? 'Hide hint' : 'Need a hint?'}
          </Button>
        )}
      </div>

      {showHow && howToPlay.length > 0 && (
        <div className="rounded-sm border-4 border-wood bg-parchment p-4">
          <h3 className="mb-2 font-display text-xl font-bold text-bark">How to play</h3>
          <ol className="list-decimal space-y-1 pl-6">
            {howToPlay.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </div>
      )}

      {showHint && hint && (
        <div className="rounded-sm border-4 border-gold bg-parchment p-4">
          <h3 className="mb-1 font-display text-xl font-bold text-bark">Hint</h3>
          <p>{hint}</p>
        </div>
      )}

      {children}

      {won && (
        <div
          ref={winRef}
          tabIndex={-1}
          role="status"
          className="rounded-sm border-4 border-forest bg-parchment p-5 shadow-[4px_4px_0_0_var(--color-forest)]"
        >
          <h3 className="font-display text-2xl font-bold text-forest">Quest complete!</h3>
          <p className="mt-1">{winMessage}</p>

          {claim !== 'done' && (
            <Button
              className="mt-3"
              onClick={handleClaim}
              disabled={claim === 'saving'}
            >
              {claim === 'saving' ? 'Saving…' : 'Claim your XP'}
            </Button>
          )}

          {claim === 'done' && (
            <p className="mt-3 font-bold text-forest">
              ✓ Reward claimed! Your XP has been added.
            </p>
          )}

          {claim === 'error' && (
            <p role="alert" className="mt-3 font-bold text-coral">
              {claimError}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default GameFrame;