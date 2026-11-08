const avatars = {
  'avatar-1': { skin: 'fill-[#f2c9a0]', hair: 'fill-bark', shirt: 'fill-forest', long: false },
  'avatar-2': { skin: 'fill-[#c98f64]', hair: 'fill-ink', shirt: 'fill-dusk', long: false },
  'avatar-3': { skin: 'fill-[#8d5a3b]', hair: 'fill-ink', shirt: 'fill-gold', long: false },
  'avatar-4': { skin: 'fill-[#e8b48a]', hair: 'fill-wood', shirt: 'fill-sage', long: false },
  'avatar-5': { skin: 'fill-[#f2c9a0]', hair: 'fill-bark', shirt: 'fill-coral', long: true },
  'avatar-6': { skin: 'fill-[#c98f64]', hair: 'fill-ink', shirt: 'fill-teal', long: true },
  'avatar-7': { skin: 'fill-[#8d5a3b]', hair: 'fill-ink', shirt: 'fill-plum', long: true },
  'avatar-8': { skin: 'fill-[#e8b48a]', hair: 'fill-wood', shirt: 'fill-rose', long: true },
};

function Avatar({ id, className = '', ...props }) {
  const look = avatars[id] ?? avatars['avatar-1'];

  return (
    <svg viewBox="0 0 9 9" className={className} shapeRendering="crispEdges" aria-hidden="true" {...props}>
      {/* head and eyes */}
      <rect x="2" y="0" width="5" height="3" className={look.skin} />
      <rect x="3" y="2" width="1" height="1" className="fill-ink" />
      <rect x="5" y="2" width="1" height="1" className="fill-ink" />

      <rect x="1" y="3" width="7" height="3" className={look.shirt} />
      {look.long && <rect x="1" y="6" width="7" height="1" className={look.shirt} />}

      <rect x="2" y={look.long ? 7 : 6} width="2" height={look.long ? 2 : 3} className="fill-bark" />
      <rect x="5" y={look.long ? 7 : 6} width="2" height={look.long ? 2 : 3} className="fill-bark" />

      {look.long ? (
        <>
          <rect x="1" y="0" width="7" height="1" className={look.hair} />
          <rect x="1" y="1" width="1" height="5" className={look.hair} />
          <rect x="7" y="1" width="1" height="5" className={look.hair} />
        </>
      ) : (
        <rect x="2" y="0" width="5" height="1" className={look.hair} />
      )}
    </svg>
  );
}

export default Avatar;