import { useEffect, useRef, useState } from 'react';
import { COLS, ROWS, TILE, STOOLS, isStool } from './tavernMap';
import Avatar from '../ui/Avatar';

const W = COLS * TILE; // 320
const H = ROWS * TILE; // 192
const WALK_SPEED = 80; // drawing units per second (5 tiles a second)

// Small helper so the scene reads like a list of pixel rectangles
function R({ x, y, w, h, c, o }) {
  return <rect x={x} y={y} width={w} height={h} opacity={o} style={{ fill: c }} />;
}

const BARK = 'var(--color-bark)';
const WOOD = 'var(--color-wood)';
const CREAM = 'var(--color-cream)';
const GOLD = 'var(--color-gold)';
const FOREST = 'var(--color-forest)';
const ROSE = 'var(--color-rose)';
const CORAL = 'var(--color-coral)';
const INK = 'var(--color-ink)';
const TOP = '#c58f5e'; // lit top edge of wooden things
const SIDE = '#7a5233'; // shaded front of wooden things

function Flame({ x, y }) {
  return (
    <g className="motion-safe:animate-pulse">
      <R x={x} y={y} w={3} h={5} c="#f0a030" />
      <R x={x + 1} y={y + 1} w={1} h={4} c="#ffd86a" />
    </g>
  );
}

// Slides people smoothly towards their tile (and snaps if the player prefers less motion).
// Done in JavaScript so that the drawing order can change while someone walks.
function useSmoothPositions(players) {
  const [shown, setShown] = useState({});
  const targets = useRef({});

  useEffect(() => {
    const next = {};
    players.forEach((p) => {
      next[p.key] = { x: p.x * TILE, y: p.y * TILE + (isStool(p.x, p.y) ? 3 : 0) };
    });
    targets.current = next;
  }, [players]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame;
    let last = performance.now();

    function tick(now) {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      const goal = targets.current;
      setShown((prev) => {
        const next = {};
        let changed = Object.keys(prev).length !== Object.keys(goal).length;
        Object.entries(goal).forEach(([key, t]) => {
          const cur = prev[key] ?? t;
          let nx = t.x;
          let ny = t.y;
          const dx = t.x - cur.x;
          const dy = t.y - cur.y;
          const dist = Math.hypot(dx, dy);
          const step = WALK_SPEED * dt;
          if (!reduce && dist > step && dist > 0) {
            nx = cur.x + (dx / dist) * step;
            ny = cur.y + (dy / dist) * step;
          }
          next[key] = { x: nx, y: ny };
          if (!prev[key] || prev[key].x !== nx || prev[key].y !== ny) changed = true;
        });
        return changed ? next : prev;
      });
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return shown;
}

function Bubble({ text, x, y }) {
  const shown = text.length > 30 ? `${text.slice(0, 29)}…` : text;
  const width = Math.max(28, shown.length * 4.1 + 10);
  return (
    <g>
      <rect x={x - width / 2} y={y - 15} width={width} height="14" rx="3" style={{ fill: CREAM, stroke: BARK, strokeWidth: 1.4 }} />
      <polygon points={`${x - 3},${y - 1.5} ${x + 3},${y - 1.5} ${x},${y + 3}`} style={{ fill: BARK }} />
      <polygon points={`${x - 2},${y - 2} ${x + 2},${y - 2} ${x},${y + 1.5}`} style={{ fill: CREAM }} />
      <text x={x} y={y - 5} textAnchor="middle" fontSize="7.2" style={{ fill: INK }}>
        {shown}
      </text>
    </g>
  );
}

// ---------- Things that sit on the floor (drawn in depth order with the people) ----------

function Table({ x, y }) {
  return (
    <g>
      {/* soft shadow on the floor */}
      <R x={x + 1} y={y + 30} w={66} h={6} c="#000" o={0.2} />
      <R x={x + 3} y={y + 33} w={62} h={4} c="#000" o={0.15} />
      {/* legs */}
      <R x={x + 3} y={y + 24} w={5} h={9} c="#5c3d24" />
      <R x={x + 56} y={y + 24} w={5} h={9} c="#5c3d24" />
      <R x={x + 3} y={y + 24} w={1} h={9} c={SIDE} />
      <R x={x + 56} y={y + 24} w={1} h={9} c={SIDE} />
      {/* front apron (the shaded face) */}
      <R x={x} y={y + 19} w={64} h={7} c={SIDE} />
      <R x={x} y={y + 25} w={64} h={1} c="#4b3220" />
      {/* top surface, slightly wider than the apron so it overhangs */}
      <R x={x - 1} y={y} w={66} h={20} c={WOOD} />
      <R x={x - 1} y={y} w={66} h={1} c={TOP} />
      <R x={x - 1} y={y + 19} w={66} h={1} c="#6b4a2f" />
      {/* table runner that hangs over the front */}
      <R x={x + 7} y={y + 5} w={50} h={11} c="#9fcfc7" />
      <R x={x + 7} y={y + 5} w={50} h={1} c="#c9e6df" />
      <R x={x + 7} y={y + 16} w={50} h={1} c="#6fa89f" />
      <R x={x + 7} y={y + 16} w={5} h={6} c="#8dbdb5" />
      <R x={x + 52} y={y + 16} w={5} h={6} c="#8dbdb5" />
      <R x={x + 7} y={y + 22} w={5} h={1} c="#6fa89f" />
      <R x={x + 52} y={y + 22} w={5} h={1} c="#6fa89f" />
      {[10, 22, 40, 52].map((dx) => (
        <g key={dx}>
          <circle cx={x + dx} cy={y + 11} r="3.8" style={{ fill: CREAM }} />
          <circle cx={x + dx} cy={y + 11} r="2.1" style={{ fill: '#e3d8ba' }} />
        </g>
      ))}
      <R x={x + 29} y={y + 6} w={4} h={7} c={CREAM} />
      <R x={x + 29} y={y + 6} w={1} h={7} c="#d8c7a2" />
      <Flame x={x + 29.5} y={y + 2} />
      <circle cx={x + 31} cy={y + 8} r="13" fill="url(#tv-warm)" opacity="0.6" />
      <R x={x + 3} y={y + 2} w={4} h={4} c={CORAL} />
      <R x={x + 3} y={y + 5} w={4} h={1} c="#a8553a" />
      <R x={x + 57} y={y + 14} w={4} h={4} c="var(--color-dusk)" />
      <R x={x + 57} y={y + 17} w={4} h={1} c="#34495c" />
    </g>
  );
}

function QuestTable({ onQuestTable }) {
  const x = 48;
  const y = 96;
  return (
    <g
      role="button"
      tabIndex={-1}
      onClick={(e) => {
        e.stopPropagation();
        onQuestTable();
      }}
      className="cursor-pointer"
    >
      <R x={x + 1} y={y + 30} w={66} h={6} c="#000" o={0.2} />
      <R x={x + 3} y={y + 33} w={62} h={4} c="#000" o={0.15} />
      <R x={x + 3} y={y + 24} w={5} h={9} c="#5c3d24" />
      <R x={x + 56} y={y + 24} w={5} h={9} c="#5c3d24" />
      <R x={x} y={y + 19} w={64} h={7} c="#8a5f1e" />
      <R x={x} y={y + 25} w={64} h={1} c="#4b3220" />
      <R x={x - 1} y={y} w={66} h={20} c={GOLD} />
      <R x={x - 1} y={y} w={66} h={1} c="#f3cf7a" />
      <R x={x - 1} y={y + 19} w={66} h={1} c="#b8862a" />
      <R x={x + 5} y={y + 3} w={38} h={14} c="var(--color-parchment)" />
      <R x={x + 5} y={y + 3} w={38} h={1} c={BARK} />
      <R x={x + 5} y={y + 16} w={38} h={1} c={BARK} />
      <R x={x + 10} y={y + 7} w={12} h={1} c={INK} o={0.5} />
      <R x={x + 10} y={y + 10} w={20} h={1} c={INK} o={0.5} />
      <R x={x + 10} y={y + 13} w={14} h={1} c={INK} o={0.5} />
      <circle cx={x + 35} cy={y + 10} r="3" style={{ fill: '#c0392b' }} />
      <R x={x + 47} y={y + 3} w={2} h={14} c={CREAM} />
      <R x={x + 46} y={y + 2} w={4} h={3} c={FOREST} />
      <R x={x + 53} y={y + 5} w={4} h={7} c={CREAM} />
      <Flame x={x + 53.5} y={y + 1} />
      <g className="motion-safe:animate-pulse">
        <R x={x - 3} y={y - 4} w={2} h={2} c={GOLD} />
        <R x={x + 66} y={y - 1} w={2} h={2} c={GOLD} />
        <R x={x + 32} y={y - 7} w={2} h={2} c={GOLD} />
      </g>
      {/* hanging plaque */}
      <R x={x - 4} y={y + 36} w={72} h={15} c={CREAM} />
      <R x={x - 4} y={y + 36} w={72} h={2} c={BARK} />
      <R x={x - 4} y={y + 49} w={72} h={2} c={BARK} />
      <R x={x - 6} y={y + 38} w={2} h={11} c={BARK} />
      <R x={x + 68} y={y + 38} w={2} h={11} c={BARK} />
      <text x={x + 32} y={y + 46} textAnchor="middle" fontSize="8" fontWeight="700" style={{ fill: INK }}>
        Duo Quest Table
      </text>
    </g>
  );
}

function Plant({ x, y }) {
  return (
    <g>
      <R x={x + 1} y={y + 13} w={14} h={3} c="#000" o={0.22} />
      <R x={x + 4} y={y + 8} w={8} h={8} c={BARK} />
      <R x={x + 3} y={y + 7} w={10} h={2} c="#85603f" />
      <R x={x + 4} y={y + 8} w={2} h={8} c={TOP} o={0.5} />
      <R x={x + 1} y={y - 1} w={14} h={9} c={FOREST} />
      <R x={x - 2} y={y + 2} w={6} h={7} c="#264d30" />
      <R x={x + 12} y={y + 1} w={6} h={7} c="#264d30" />
      <R x={x + 4} y={y - 8} w={8} h={8} c="var(--color-sage)" />
      <R x={x + 6} y={y - 11} w={4} h={4} c="#b5cdb0" />
      <R x={x + 5} y={y + 1} w={2} h={2} c="#b5cdb0" />
      <R x={x + 10} y={y - 4} w={2} h={2} c="#b5cdb0" />
    </g>
  );
}

function Stool({ sx, sy }) {
  const x = sx * TILE;
  const y = sy * TILE;
  return (
    <g>
      <R x={x + 2} y={y + 13} w={12} h={3} c="#000" o={0.25} />
      <R x={x + 3} y={y + 9} w={2} h={6} c="#5c3d24" />
      <R x={x + 11} y={y + 9} w={2} h={6} c="#5c3d24" />
      <R x={x + 3} y={y + 7} w={10} h={4} c="#7a2236" />
      <R x={x + 2} y={y + 3} w={12} h={6} c="#a8324a" />
      <R x={x + 4} y={y + 3} w={6} h={1} c="#d8607a" />
      <R x={x + 2} y={y + 8} w={12} h={1} c="#6a1c2d" />
    </g>
  );
}

function Person({ p, pos }) {
  return (
    <g style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
      {p.isSelf && (
        <ellipse cx="8" cy="16.5" rx="11" ry="3.6" className="motion-safe:animate-pulse" style={{ fill: GOLD, opacity: 0.9 }} />
      )}
      <ellipse cx="8" cy="16.5" rx="7" ry="2.2" style={{ fill: '#000', opacity: 0.3 }} />
      <Avatar id={p.avatar} x="-1" y="-2" width="18" height="18" />
    </g>
  );
}

// Draws the tavern and everyone in it. Players: [{ key, username, avatar, x, y, isSelf }]
function TavernScene({ players, bubbles, onTile, onStep, onQuestTable }) {
  const shown = useSmoothPositions(players);
  const where = (p) => shown[p.key] ?? { x: p.x * TILE, y: p.y * TILE + (isStool(p.x, p.y) ? 3 : 0) };

  // Everything standing on the floor, sorted so things further back are drawn first.
  const things = [];
  [4, 8].forEach((ty) =>
    things.push({ key: `table-${ty}`, base: (ty + 2) * TILE, node: <Table x={12 * TILE} y={ty * TILE} /> }),
  );
  things.push({ key: 'quest', base: 8 * TILE, node: <QuestTable onQuestTable={onQuestTable} /> });
  [5, 9].forEach((ty) =>
    things.push({ key: `plant-${ty}`, base: (ty + 1) * TILE, node: <Plant x={18 * TILE} y={ty * TILE} /> }),
  );
  STOOLS.forEach(([sx, sy]) =>
    things.push({ key: `stool-${sx}-${sy}`, base: sy * TILE + 14, node: <Stool sx={sx} sy={sy} /> }),
  );
  players.forEach((p) => {
    const pos = where(p);
    things.push({ key: p.key, base: pos.y + 16.5, node: <Person p={p} pos={pos} /> });
  });
  things.sort((a, b) => a.base - b.base);

  function handleClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const tx = Math.floor(((e.clientX - rect.left) / rect.width) * COLS);
    const ty = Math.floor(((e.clientY - rect.top) / rect.height) * ROWS);
    onTile(tx, ty);
  }

  function handleKeyDown(e) {
    const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      onStep(move[0], move[1]);
    }
  }

  return (
    <div
      tabIndex={0}
      role="group"
      aria-label="The tavern. Use the arrow keys to walk around."
      onKeyDown={handleKeyDown}
      className="overflow-hidden rounded-sm border-4 border-bark bg-ink shadow-[4px_4px_0_0_var(--color-bark)]"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full cursor-pointer"
        shapeRendering="crispEdges"
        aria-hidden="true"
        onClick={handleClick}
        style={{ fontFamily: 'Nunito, sans-serif' }}
      >
        <defs>
          {/* Herringbone-style floor: planks zigzag down the room */}
          <pattern id="tv-floor" width="16" height="32" patternUnits="userSpaceOnUse">
            <rect width="16" height="32" style={{ fill: '#b9744a' }} />
            {Array.from({ length: 8 }, (_, r) => {
              const off = (r < 4 ? r * 4 : (8 - r) * 4) % 16;
              const y = r * 4;
              return (
                <g key={r}>
                  <rect y={y} width="16" height="4" style={{ fill: r % 2 ? '#b06c44' : '#bf7d52' }} />
                  <rect y={y} width="16" height="1" style={{ fill: '#8f5232' }} />
                  <rect x={off} y={y} width="1" height="4" style={{ fill: '#8f5232' }} />
                  <rect x={(off + 8) % 16} y={y} width="1" height="4" style={{ fill: '#8f5232' }} />
                  <rect x={(off + 2) % 16} y={y + 1} width="4" height="1" opacity="0.45" style={{ fill: '#e0a06c' }} />
                </g>
              );
            })}
          </pattern>
          <pattern id="tv-wall" width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="16" height="16" style={{ fill: '#ecdcb9' }} />
            <rect x="3" y="5" width="1" height="1" style={{ fill: '#d8c7a2' }} />
            <rect x="11" y="12" width="1" height="1" style={{ fill: '#d8c7a2' }} />
            <rect x="8" y="2" width="1" height="1" style={{ fill: '#f4e8cc' }} />
          </pattern>
          <radialGradient id="tv-glow" cx="160" cy="62" r="170" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffb85a" stopOpacity="0.38" />
            <stop offset="1" stopColor="#ffb85a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="tv-warm" gradientUnits="objectBoundingBox">
            <stop offset="0" stopColor="#ffd070" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffd070" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="tv-vig" cx="160" cy="100" r="230" gradientUnits="userSpaceOnUse">
            <stop offset="0.5" stopColor="#1d1008" stopOpacity="0" />
            <stop offset="1" stopColor="#1d1008" stopOpacity="0.55" />
          </radialGradient>
          <linearGradient id="tv-down" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d1008" stopOpacity="0.4" />
            <stop offset="1" stopColor="#1d1008" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="tv-sideL" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#1d1008" stopOpacity="0.5" />
            <stop offset="1" stopColor="#1d1008" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="tv-sideR" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor="#1d1008" stopOpacity="0.5" />
            <stop offset="1" stopColor="#1d1008" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ================= Room shell ================= */}
        <rect x="0" y="32" width={W} height={H - 32} fill="url(#tv-floor)" />
        <rect x="0" y="0" width={W} height="32" fill="url(#tv-wall)" />

        {/* Wood panelling with raised panels */}
        <R x={0} y={20} w={W} h={12} c={WOOD} />
        <R x={0} y={20} w={W} h={2} c={TOP} />
        <R x={0} y={22} w={W} h={1} c="#6b4a2f" />
        {Array.from({ length: 20 }, (_, i) => (
          <g key={i}>
            <R x={i * 16 + 2} y={24} w={12} h={5} c="#8e6340" />
            <R x={i * 16 + 2} y={24} w={12} h={1} c="#6b4a2f" />
            <R x={i * 16 + 2} y={28} w={12} h={1} c="#b98859" />
          </g>
        ))}
        <R x={0} y={30} w={W} h={2} c={BARK} />
        <R x={0} y={30} w={W} h={1} c="#85603f" />

        {/* Crown moulding, ceiling beam and joist ends */}
        <R x={0} y={0} w={W} h={5} c={BARK} />
        <R x={0} y={1} w={W} h={1} c="#85603f" />
        <R x={0} y={5} w={W} h={2} c="#c9b48c" />
        <R x={0} y={7} w={W} h={1} c="#b09a72" />
        {Array.from({ length: 8 }, (_, i) => (
          <R key={i} x={i * 44 + 14} y={0} w={7} h={5} c="#4d3420" />
        ))}
        {/* The beam casts a shadow onto the wall */}
        <rect x="0" y="7" width={W} height="12" fill="url(#tv-down)" />
        {/* Wall meets floor: dark corner */}
        <rect x="0" y="32" width={W} height="14" fill="url(#tv-down)" />

        {/* Warm glow on the floor around the quest table (behind furniture) */}
        <circle cx={80} cy={112} r="52" fill="url(#tv-warm)" opacity="0.55" className="motion-safe:animate-pulse" />

        {/* ================= Rugs ================= */}
        <R x={33} y={163} w={64} h={30} c="#000" o={0.2} />
        <R x={32} y={160} w={64} h={30} c="#a8324a" />
        <R x={35} y={163} w={58} h={24} c={ROSE} />
        <R x={38} y={166} w={52} h={18} c="#e8a6bd" />
        {[44, 54, 64, 74, 84].map((x) => (
          <R key={x} x={x} y={173} w={4} h={4} c="#a8324a" />
        ))}
        {[34, 38, 42, 46, 50, 54, 58, 62, 66, 70, 74, 78, 82, 86, 90].map((x) => (
          <R key={x} x={x} y={190} w={2} h={2} c="#a8324a" />
        ))}
        <R x={134} y={52} w={52} h={12} c="#264d30" />
        <R x={136} y={54} w={48} h={8} c={FOREST} />
        <R x={138} y={56} w={44} h={1} c={GOLD} />
        <R x={138} y={60} w={44} h={1} c={GOLD} />

        {/* Sleeping cat */}
        <R x={148} y={56} w={16} h={7} c="#d98a3d" />
        <R x={146} y={57} w={5} h={6} c="#c47a30" />
        <R x={160} y={53} w={7} h={7} c="#d98a3d" />
        <R x={160} y={51} w={2} h={3} c="#d98a3d" />
        <R x={165} y={51} w={2} h={3} c="#d98a3d" />
        <R x={162} y={56} w={1} h={1} c={INK} />
        <R x={144} y={60} w={5} h={2} c="#c47a30" />
        <R x={151} y={56} w={2} h={7} c="#f0b36a" />
        <R x={157} y={56} w={2} h={7} c="#f0b36a" />

        {/* ================= On the back wall ================= */}
        {/* Shelf */}
        <R x={4} y={15} w={72} h={3} c={WOOD} />
        <R x={4} y={15} w={72} h={1} c={TOP} />
        <R x={4} y={18} w={72} h={1} c={BARK} />
        <R x={4} y={19} w={72} h={2} c="#000" o={0.18} />
        {[
          [8, 'var(--color-dusk)', 6, 7],
          [18, CREAM, 5, 6],
          [28, CORAL, 6, 8],
          [40, 'var(--color-sage)', 7, 7],
          [52, GOLD, 5, 6],
          [62, 'var(--color-plum)', 6, 8],
        ].map(([x, c, w, h]) => (
          <g key={x}>
            <R x={x} y={15 - h} w={w} h={h} c={c} />
            <R x={x} y={15 - h} w={w} h={1} c="#fff" o={0.35} />
            <R x={x + w - 1} y={15 - h} w={1} h={h} c="#000" o={0.2} />
            <R x={x + 1} y={15 - h - 1} w={w - 2} h={1} c={BARK} />
          </g>
        ))}

        {/* Notice board */}
        <R x={85} y={7} w={32} h={20} c="#000" o={0.2} />
        <R x={84} y={5} w={32} h={20} c={BARK} />
        <R x={84} y={5} w={32} h={1} c={TOP} />
        <R x={86} y={7} w={28} h={16} c="#c9a06a" />
        <R x={86} y={7} w={28} h={1} c="#a9824f" />
        {[
          [89, 9, 7, 6, CREAM],
          [99, 10, 6, 7, 'var(--color-sage)'],
          [107, 9, 5, 5, ROSE],
          [90, 17, 6, 4, GOLD],
          [100, 18, 9, 4, CREAM],
        ].map(([x, y, w, h, c]) => (
          <g key={x + y}>
            <R x={x + 1} y={y + 1} w={w} h={h} c="#000" o={0.2} />
            <R x={x} y={y} w={w} h={h} c={c} />
            <R x={x + 1} y={y + 2} w={w - 2} h={1} c={INK} o={0.45} />
            <R x={x + w / 2 - 0.5} y={y - 1} w={1.5} h={1.5} c="#c0392b" />
          </g>
        ))}

        {/* Sconces */}
        {[118, 198].map((x) => (
          <g key={x}>
            <R x={x} y={14} w={6} h={2} c={BARK} />
            <R x={x + 1} y={9} w={4} h={5} c={CREAM} />
            <Flame x={x + 1.5} y={4} />
            <circle cx={x + 3} cy={9} r="16" fill="url(#tv-warm)" opacity="0.5" />
          </g>
        ))}

        {/* Window with curtains */}
        <R x={213} y={7} w={40} h={25} c="#000" o={0.18} />
        <R x={212} y={5} w={40} h={25} c={BARK} />
        <R x={214} y={7} w={36} h={19} c="#a9d6e6" />
        <R x={214} y={7} w={36} h={5} c="#c7e6ef" />
        <R x={231} y={7} w={2} h={19} c={BARK} />
        <R x={214} y={15} w={36} h={2} c={BARK} />
        <R x={210} y={26} w={44} h={4} c={WOOD} />
        <R x={210} y={26} w={44} h={1} c={TOP} />
        <R x={210} y={30} w={44} h={2} c="#000" o={0.2} />
        <R x={210} y={5} w={7} h={22} c={ROSE} />
        <R x={247} y={5} w={7} h={22} c={ROSE} />
        <R x={213} y={5} w={1} h={22} c="#a8324a" />
        <R x={250} y={5} w={1} h={22} c="#a8324a" />

        {/* Banner */}
        <R x={258} y={0} w={14} h={2} c={BARK} />
        <R x={260} y={2} w={12} h={22} c="#000" o={0.2} />
        <R x={259} y={2} w={12} h={22} c="#a8324a" />
        <polygon points="259,24 271,24 265,30" style={{ fill: '#a8324a' }} />
        <R x={259} y={2} w={12} h={2} c={GOLD} />
        <R x={263} y={9} w={4} h={4} c={GOLD} />
        <R x={264} y={7} w={2} h={8} c={GOLD} />
        <R x={262} y={10} w={6} h={2} c={GOLD} />

        {/* ================= Big furniture against the wall ================= */}
        {/* Kitchen counter */}
        <R x={0} y={48} w={82} h={7} c="#000" o={0.22} />
        <R x={0} y={48} w={82} h={11} c="#000" o={0.1} />
        <R x={8} y={24} w={11} h={8} c={CORAL} />
        <R x={10} y={22} w={7} h={2} c="#a8553a" />
        <R x={19} y={26} w={4} h={2} c={CORAL} />
        <R x={5} y={26} w={3} h={2} c={CORAL} />
        <R x={26} y={25} w={11} h={7} c="#7e8a93" />
        <R x={28} y={23} w={7} h={2} c="#5f6a72" />
        <R x={44} y={27} w={12} h={5} c={CREAM} />
        <R x={45} y={26} w={10} h={1} c="#d8c7a2" />
        <R x={62} y={26} w={14} h={6} c="#c68a4a" />
        <R x={64} y={25} w={10} h={2} c="#e0a85c" />
        <R x={0} y={32} w={80} h={8} c="#c08a5a" />
        <R x={0} y={32} w={80} h={1} c="#e5b682" />
        <R x={0} y={39} w={80} h={2} c="#8a5a35" />
        <R x={0} y={41} w={80} h={7} c={WOOD} />
        <R x={0} y={47} w={80} h={1} c="#5c3d24" />
        {[0, 20, 40, 60].map((x) => (
          <g key={x}>
            <R x={x + 2} y={43} w={16} h={4} c={BARK} o={0.45} />
            <R x={x + 2} y={43} w={16} h={1} c="#000" o={0.3} />
            <R x={x + 9} y={44} w={2} h={2} c={GOLD} />
          </g>
        ))}

        {/* Barrels with round lids so they look solid */}
        <R x={82} y={46} w={32} h={5} c="#000" o={0.22} />
        <R x={82} y={26} w={15} h={22} c={WOOD} />
        <ellipse cx="89.5" cy="26" rx="7.5" ry="3" style={{ fill: '#c9976a' }} />
        <ellipse cx="89.5" cy="26" rx="5" ry="1.8" style={{ fill: '#a97a4f' }} />
        <R x={82} y={31} w={15} h={2} c={BARK} />
        <R x={82} y={38} w={15} h={2} c={BARK} />
        <R x={82} y={44} w={15} h={2} c={BARK} />
        <R x={82} y={29} w={2} h={19} c="#b98859" o={0.7} />
        <R x={95} y={29} w={2} h={19} c={INK} o={0.3} />
        <R x={99} y={33} w={14} h={15} c={WOOD} />
        <ellipse cx="106" cy="33" rx="7" ry="2.8" style={{ fill: '#c9976a' }} />
        <ellipse cx="106" cy="33" rx="4.5" ry="1.6" style={{ fill: '#a97a4f' }} />
        <R x={99} y={38} w={14} h={2} c={BARK} />
        <R x={99} y={44} w={14} h={2} c={BARK} />
        <R x={99} y={35} w={2} h={13} c="#b98859" o={0.7} />
        <R x={111} y={35} w={2} h={13} c={INK} o={0.3} />

        {/* Fireplace: chimney breast with a deep firebox */}
        <R x={124} y={46} w={76} h={8} c="#000" o={0.25} />
        <R x={128} y={0} w={64} h={48} c="#8a8176" />
        {Array.from({ length: 6 }, (_, row) => (
          <R key={row} x={128} y={row * 8 + 6} w={64} h={1} c="#6f675d" />
        ))}
        {Array.from({ length: 6 }, (_, row) =>
          Array.from({ length: 5 }, (_, col) => {
            const x = 128 + col * 16 - (row % 2 ? 8 : 0);
            return <R key={`${row}-${col}`} x={Math.max(x, 128)} y={row * 8 + 6} w={1} h={8} c="#6f675d" />;
          }),
        )}
        <R x={128} y={0} w={4} h={48} c="#a29889" o={0.55} />
        <R x={188} y={0} w={4} h={48} c="#000" o={0.2} />
        {/* Mantel overhangs the chimney */}
        <R x={123} y={5} w={74} h={6} c={BARK} />
        <R x={123} y={5} w={74} h={1} c={TOP} />
        <R x={123} y={11} w={74} h={1} c="#4b3220" />
        <R x={126} y={12} w={68} h={6} c="#000" o={0.3} />
        <R x={132} y={0} w={4} h={5} c={CREAM} />
        <Flame x={132} y={-3} />
        <R x={176} y={0} w={8} h={5} c="var(--color-dusk)" />
        <R x={178} y={-2} w={4} h={2} c="var(--color-sage)" />
        <R x={150} y={0} w={20} h={5} c={FOREST} />
        <R x={152} y={1} w={4} h={3} c={ROSE} />
        <R x={160} y={1} w={4} h={3} c={GOLD} />
        {/* Firebox: dark back wall with lit side walls for depth */}
        <R x={140} y={19} w={40} h={29} c="#1f140d" />
        <polygon points="140,19 146,23 146,48 140,48" style={{ fill: '#3b2a1e' }} />
        <polygon points="180,19 174,23 174,48 180,48" style={{ fill: '#3b2a1e' }} />
        <R x={146} y={23} w={28} h={25} c="#2b1d14" />
        <R x={138} y={17} w={44} h={3} c="#a29889" />
        <R x={136} y={19} w={4} h={29} c="#a29889" />
        <R x={180} y={19} w={4} h={29} c="#a29889" />
        <circle cx="160" cy="42" r="30" fill="url(#tv-warm)" opacity="0.7" />
        <g className="motion-safe:animate-pulse">
          <R x={148} y={36} w={24} h={12} c="#e8702a" />
          <R x={152} y={28} w={16} h={20} c="#f0a030" />
          <R x={156} y={33} w={8} h={15} c="#ffd86a" />
          <R x={160} y={25} w={3} h={5} c="#e8702a" />
        </g>
        <R x={142} y={44} w={36} h={4} c={BARK} />
        <R x={146} y={42} w={28} h={3} c="#85603f" />
        {/* Stone hearth step */}
        <R x={122} y={47} w={76} h={5} c="#a29889" />
        <R x={122} y={47} w={76} h={1} c="#cfc6b6" />
        <R x={122} y={51} w={76} h={1} c="#6f675d" />

        {/* Dish hutch with a lit side and glass */}
        <R x={268} y={46} w={52} h={6} c="#000" o={0.22} />
        <R x={272} y={0} w={48} h={48} c="#4f9a94" />
        <R x={270} y={0} w={4} h={48} c="#3a7a75" />
        <R x={271} y={0} w={50} h={5} c="#3a7a75" />
        <R x={271} y={5} w={50} h={1} c="#6ab5ae" />
        <R x={277} y={8} w={38} h={22} c="#2f6f6a" />
        <R x={277} y={18} w={38} h={2} c="#3a7a75" />
        {[285, 296, 307].map((x) => (
          <g key={x}>
            <circle cx={x} cy={13} r="4.5" style={{ fill: CREAM }} />
            <circle cx={x} cy={13} r="2.5" style={{ fill: '#9fcfc7' }} />
          </g>
        ))}
        {[281, 289, 297, 305, 311].map((x) => (
          <R key={x} x={x} y={23} w={4} h={4} c={x % 16 === 9 ? CORAL : CREAM} />
        ))}
        <polygon points="281,8 287,8 279,30 273,30" style={{ fill: '#fff' }} opacity="0.12" />
        <R x={277} y={32} w={18} h={14} c="#3a7a75" />
        <R x={297} y={32} w={18} h={14} c="#3a7a75" />
        <R x={279} y={34} w={14} h={10} c="#4f9a94" />
        <R x={299} y={34} w={14} h={10} c="#4f9a94" />
        <R x={292} y={38} w={2} h={2} c={GOLD} />
        <R x={298} y={38} w={2} h={2} c={GOLD} />

        {/* ================= Tables, plants, stools and people, sorted by depth ================= */}
        {things.map((t) => (
          <g key={t.key}>{t.node}</g>
        ))}

        {/* ================= Frame and light ================= */}
        {/* Heavy wooden pillars with a lit edge, casting shade onto the room */}
        <rect x="5" y="0" width="18" height={H} fill="url(#tv-sideL)" />
        <rect x={W - 23} y="0" width="18" height={H} fill="url(#tv-sideR)" />
        <R x={0} y={0} w={6} h={H} c="#4d3420" />
        <R x={1} y={0} w={1} h={H} c="#7a5233" />
        <R x={3} y={0} w={1} h={H} c="#3a2616" />
        <R x={6} y={0} w={1} h={H} c={INK} o={0.5} />
        <R x={W - 6} y={0} w={6} h={H} c="#4d3420" />
        <R x={W - 5} y={0} w={1} h={H} c="#7a5233" />
        <R x={W - 3} y={0} w={1} h={H} c="#3a2616" />
        <R x={W - 7} y={0} w={1} h={H} c={INK} o={0.5} />
        <R x={0} y={H - 4} w={W} h={4} c="#3a2616" />
        <R x={0} y={H - 4} w={W} h={1} c="#6b4a2f" />

        <rect x="0" y="0" width={W} height={H} fill="url(#tv-glow)" />
        <polygon points="216,32 248,32 282,150 214,172" style={{ fill: '#fff6c8' }} opacity="0.09" />
        <polygon points="226,32 240,32 258,140 232,150" style={{ fill: '#fff6c8' }} opacity="0.07" />
        <rect x="0" y="0" width={W} height={H} fill="url(#tv-vig)" />

        {/* ================= Names and speech bubbles (always on top) ================= */}
        {players.map((p) => {
          const pos = where(p);
          return (
            <text
              key={`n-${p.key}`}
              x={pos.x + 8}
              y={pos.y + 26}
              textAnchor="middle"
              fontSize="7.2"
              fontWeight="700"
              strokeLinejoin="round"
              style={{ fill: INK, stroke: CREAM, strokeWidth: 2.2, paintOrder: 'stroke' }}
            >
              {p.username}
            </text>
          );
        })}
        {players.map((p) => {
          const bubble = bubbles[p.key];
          if (!bubble) return null;
          const pos = where(p);
          return <Bubble key={`b-${p.key}`} text={bubble.text} x={pos.x + 8} y={pos.y - 4} />;
        })}
      </svg>
    </div>
  );
}

export default TavernScene;