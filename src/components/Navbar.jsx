import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuthStore } from '../stores/authStore'

function Navbar({ onMenuClick }) {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const initials = [user?.prenom?.[0], user?.nom?.[0]].filter(Boolean).join('').toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/10 bg-iuc-red px-4 text-white backdrop-blur sm:px-8">
      <button
        aria-label="Ouvrir le menu"
        className="rounded-lg p-2 text-white hover:bg-white/10 lg:hidden"
        onClick={onMenuClick}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      <div className="hidden text-sm text-white/70 sm:block">Portail de gestion académique</div>
      <div className="ml-auto flex items-center gap-3 sm:gap-5">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-white">
            {user?.prenom} {user?.nom}
          </p>
          <p className="text-xs text-white/70">{user?.role}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-iuc-green text-sm font-bold text-white">
          {initials || 'A'}
        </div>
        <button
          className="rounded-lg px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          onClick={handleLogout}
        >
          Déconnexion
        </button>
      </div>
    </header>
  )
}

Navbar.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
}

export default Navbar
