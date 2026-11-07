import { Link, NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/village', label: 'Village' },
  { to: '/quests', label: 'Quest Board' },
  { to: '/guild', label: 'Guild Hall' },
  { to: '/portfolio', label: 'Portfolio' },
];

// Focus ring colour that is visible on the dark brown header
const focusRing = 'focus-visible:outline-cream';

function Layout() {
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

          <Link
            to="/"
            aria-label="Home: back to character creation"
            className={`ml-auto rounded-sm border-2 border-cream p-2 text-cream hover:bg-cream hover:text-bark ${focusRing}`}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
              <path d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3L12 3z" />
            </svg>
          </Link>
        </nav>
      </header>

      <main id="main" className="p-8">
        <Outlet />
      </main>
    </>
  );
}

export default Layout;