import { NavLink } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuthStore } from '../stores/authStore'
import { CHANGE_PASSWORD_PATH } from '../utils/dashboard'

const navigationByRole = {
  ADMIN: [
    { label: 'Tableau de bord', to: '/admin', icon: '⌂' },
    { label: 'Candidatures', to: '/scolarite/candidatures', icon: '▣' },
    { label: 'Comptes', to: '/admin/comptes', icon: '☺' },
    { label: 'Tenants', to: '/admin/tenants', icon: '◫' },
    { label: 'Écoles', to: '/admin/ecoles', icon: '▤' },
    { label: 'Filières', to: '/admin/filieres', icon: '⌘' },
    { label: 'Enseignants', to: '/admin/enseignants', icon: '♙' },
    { label: 'Étudiants', to: '/admin/etudiants', icon: '♧' },
  ],
  SCOLARITE: [
    { label: 'Tableau de bord', to: '/scolarite', icon: '⌂' },
    { label: 'Candidatures', to: '/scolarite/candidatures', icon: '▣' },
    { label: 'Étudiants', to: '/scolarite/etudiants', icon: '♧' },
    { label: 'Inscriptions', to: '/scolarite/inscriptions', icon: '☷' },
  ],
  ENSEIGNANT: [
    { label: 'Tableau de bord', to: '/enseignant', icon: '⌂' },
    { label: 'Mes matières', to: '/enseignant/matieres', icon: '▤' },
  ],
  ETUDIANT: [
    { label: 'Tableau de bord', to: '/etudiant', icon: '⌂' },
    { label: 'Mon dossier', to: '/etudiant/dossier', icon: '▣' },
    { label: 'Changer mon mot de passe', to: CHANGE_PASSWORD_PATH, icon: '⚿' },
  ],
}

function Sidebar({ open, onClose }) {
  const user = useAuthStore((state) => state.user)
  const navigation = navigationByRole[user?.role] ?? []

  return (
    <>
      {open && (
        <button
          aria-label="Fermer le menu"
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-iuc-blue text-white transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-black text-iuc-blue">
            I
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-wide text-white">IUC Campus</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/60">
              Espace académique
            </p>
          </div>
        </div>

        <div className="px-5 pb-3 pt-7">
          <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">
            Espace {user?.role?.toLowerCase() ?? ''}
          </p>
        </div>
        <nav className="flex-1 space-y-1 px-4">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin' || item.to === '/scolarite' || item.to === '/enseignant' || item.to === '/etudiant'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-iuc-gold text-iuc-blue'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-base">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="m-4 rounded-2xl border border-white/15 bg-white/10 p-4 text-white">
          <p className="text-sm font-bold">IUC Campus</p>
          <p className="mt-1 text-xs leading-5 text-white/70">
            La réussite académique, simplement.
          </p>
        </div>
      </aside>
    </>
  )
}

Sidebar.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default Sidebar
