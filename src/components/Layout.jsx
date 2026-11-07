import { Link, NavLink, Outlet, Navigate } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';

const navItems = [
  { to: '/village', label: 'Village' },
  { to: '/quests', label: 'Quest Board' },
  { to: '/guild', label: 'Guild Hall' },
  { to: '/portfolio', label: 'Portfolio' },
];

// Focus ring colour that is visible on the dark brown header
const focusRing = 'focus-visible:outline-cream';

function Layout() {
  const { player, logout } = usePlayer();
  if (!player) return <Navigate to="/" replace />;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-cream focus:p-3 focus:text-bark"
      >
        Skip to main content
      </a>

      <header className="border-b-4 border-wood bg-bark px-8 py-4">
        <nav aria-label="Main" className="flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className={`mr-4 font-display text-2xl font-bold text-cream hover:underline ${focusRing}`}
          >
            Guildhaven
          </Link>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-sm px-3 py-1 font-display text-lg ${focusRing} ${
                  isActive ? 'bg-cream text-bark' : 'text-cream hover:underline'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          <button
            type="button"
            onClick={logout}
            className={`ml-auto rounded-sm border-2 border-cream px-4 py-2 font-display text-lg text-cream shadow-[3px_3px_0_0_var(--color-wood)] transition hover:bg-cream hover:text-bark active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${focusRing}`}
          >
            Log out
          </button>
        </nav>
      </header>

      <main id="main" className="p-8">
        <Outlet />
      </main>
    </>
  );
}

export default Layout;