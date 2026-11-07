function XPBar({ current, max, level }) {
  const percent = Math.min(100, Math.round((current / max) * 100));

  return (
    <div>
      <div className="mb-1 flex justify-between font-display text-bark">
        <span>Level {level}</span>
        <span>{current} / {max} XP</span>
      </div>
      <div
        role="progressbar"
        aria-label={`Level ${level} progress`}
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-5 border-4 border-bark bg-parchment"
      >
        <div
          className="h-full bg-gold transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default XPBar;