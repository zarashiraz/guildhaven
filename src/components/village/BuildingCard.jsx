
import { Link } from 'react-router-dom';

const roofColors = {
  swe: 'fill-forest',
  business: 'fill-gold',
  data_science: 'fill-dusk',
  'data-science': 'fill-dusk',
  'data science': 'fill-dusk',
};

const roofRows = [
  [6, 2, 4],
  [5, 3, 6],
  [4, 4, 8],
  [3, 5, 10],
  [2, 6, 12],
];

function BuildingArt({ roofClass }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-24 w-24"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {roofRows.map(([x, y, w]) => (
        <rect
          key={y}
          x={x}
          y={y}
          width={w}
          height="1"
          className={roofClass}
        />
      ))}

      <rect
        x="3"
        y="7"
        width="10"
        height="8"
        className="fill-wood"
      />

      <rect
        x="7"
        y="11"
        width="2"
        height="4"
        className="fill-bark"
      />

      <rect
        x="4"
        y="9"
        width="2"
        height="2"
        className="fill-cream"
      />

      <rect
        x="10"
        y="9"
        width="2"
        height="2"
        className="fill-cream"
      />
    </svg>
  );
}

function BuildingCard({
  career,
  done,
  total,
  isYourPath,
}) {
  return (
    <Link
      to={`/quests?career=${career.id}`}
      className={`block rounded-sm border-4 p-4 text-center transition hover:-translate-y-1 active:translate-x-1 active:translate-y-1 active:shadow-none ${
        isYourPath
          ? 'border-bark bg-cream shadow-[4px_4px_0_0_var(--color-bark)]'
          : 'border-dashed border-wood bg-parchment hover:border-bark hover:bg-cream'
      }`}
    >
      <div className="flex justify-center">
        <BuildingArt
          roofClass={
            roofColors[career.id] ?? 'fill-sage'
          }
        />
      </div>

      <h3 className="mt-2 font-display text-xl font-bold text-bark">
        {career.building}
      </h3>

      <p className="font-semibold">
        {career.name}
      </p>

      <p className="text-base">
        {career.blurb}
      </p>

      <p className="mt-2 font-display text-bark">
        {done} / {total} quests done
      </p>

      {isYourPath ? (
        <p className="mt-1 font-display text-forest">
          ★ Your path
        </p>
      ) : (
        <p className="mt-1 font-display text-bark">
          Explore · No XP
        </p>
      )}
    </Link>
  );
}

export default BuildingCard;
