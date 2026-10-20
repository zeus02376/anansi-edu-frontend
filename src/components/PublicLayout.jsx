import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import BrandMark from './BrandMark'

const links = [
  { label: 'Accueil', to: '/', end: true },
  { label: 'Filières', to: '/filieres' },
]

const linkClass = ({ isActive }) =>
  `border-b-2 px-1 py-1.5 text-sm font-semibold transition ${
    isActive
      ? 'border-iuc-gold text-white'
      : 'border-transparent text-white/75 hover:text-white'
  }`

/** Mise en page des pages publiques : sans menu latéral ni session. */
function PublicLayout() {
  const { pathname } = useLocation()

  // Une navigation entre pages publiques repart toujours du haut de page
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-iuc-light">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-iuc-blue text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-8">
          <Link
            to="/"
            aria-label="IUC Campus, accueil"
            className="rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
          >
            <BrandMark />
          </Link>
          <nav
            aria-label="Navigation principale"
            className="order-last flex w-full gap-5 sm:order-none sm:w-auto sm:flex-1 sm:justify-center"
          >
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <Link
            to="/login"
            className="rounded-xl bg-iuc-gold px-4 py-2 text-sm font-bold text-iuc-blue transition hover:bg-iuc-gold/85 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
          >
            Connexion
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-iuc-blue text-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <BrandMark subtitle="Institut Universitaire de la Côte" />
          </div>
          <nav aria-label="Liens du pied de page" className="flex gap-5 text-sm">
            <Link className="hover:text-white" to="/filieres">
              Filières
            </Link>
            <Link className="hover:text-white" to="/login">
              Espace connecté
            </Link>
          </nav>
        </div>
        <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Institut Universitaire de la Côte. Tous droits réservés.
        </p>
      </footer>
    </div>
  )
}

export default PublicLayout
