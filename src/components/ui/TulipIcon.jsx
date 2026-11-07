function TulipIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 9 12" className={className} shapeRendering="crispEdges" aria-hidden="true">
      {/* petals: three points on top */}
      <rect x="1" y="0" width="1" height="1" className="fill-rose" />
      <rect x="4" y="0" width="1" height="1" className="fill-rose" />
      <rect x="7" y="0" width="1" height="1" className="fill-rose" />
      <rect x="1" y="1" width="7" height="3" className="fill-rose" />
      <rect x="2" y="4" width="5" height="1" className="fill-rose" />
      <rect x="3" y="5" width="3" height="1" className="fill-rose" />

      {/* shading and highlight */}
      <rect x="4" y="1" width="1" height="3" className="fill-plum" />
      <rect x="2" y="1" width="1" height="2" className="fill-[#f0b8cc]" />

      {/* stem and leaves */}
      <rect x="4" y="6" width="1" height="6" className="fill-forest" />
      <rect x="2" y="7" width="1" height="1" className="fill-forest" />
      <rect x="2" y="8" width="2" height="1" className="fill-forest" />
      <rect x="6" y="8" width="1" height="1" className="fill-forest" />
      <rect x="5" y="9" width="2" height="1" className="fill-forest" />
    </svg>
  );
}

export default TulipIcon;