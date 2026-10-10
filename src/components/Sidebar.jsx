import { NavLink } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuthStore } from '../stores/authStore'

const navigationByRole = {
  ADMIN: [
    { label: 'Tableau de bord', to: '/admin', icon: '⌂' },
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
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3A8A] text-lg font-black text-white">
            A
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-wide text-slate-900">ANANSI</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
              Espace académique
            </p>
          </div>
        </div>

        <div className="px-5 pb-3 pt-7">
          <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
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
                    ? 'bg-blue-50 text-[#1E3A8A]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-base">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="m-4 rounded-2xl bg-[#1E3A8A] p-4 text-white">
          <p className="text-sm font-bold">ANANSI EdTech</p>
          <p className="mt-1 text-xs leading-5 text-blue-100">
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
