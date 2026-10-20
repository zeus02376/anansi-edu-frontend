import { Navigate, Route, Routes } from 'react-router-dom'
import PropTypes from 'prop-types'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import PublicLayout from './components/PublicLayout'
import Login from './pages/auth/Login'
import Accueil from './pages/public/Accueil'
import Candidature from './pages/public/Candidature'
import FiliereDetail from './pages/public/FiliereDetail'
import Filieres from './pages/public/Filieres'
import Suivi from './pages/public/Suivi'
import ChangerMotDePasse from './pages/auth/ChangerMotDePasse'
import Comptes from './pages/admin/Comptes'
import AdminDashboard from './pages/admin/Dashboard'
import Candidatures from './pages/scolarite/Candidatures'
import ScolariteDashboard from './pages/scolarite/Dashboard'
import EnseignantDashboard from './pages/enseignant/Dashboard'
import EtudiantDashboard from './pages/etudiant/Dashboard'
import { CHANGE_PASSWORD_PATH } from './utils/dashboard'

function ModulePlaceholder({ title }) {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold text-iuc-blue">Gestion académique</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="font-bold text-slate-900">Espace en préparation</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Cette rubrique sera bientôt disponible sur IUC Campus.
        </p>
      </section>
    </DashboardLayout>
  )
}

ModulePlaceholder.propTypes = {
  title: PropTypes.string.isRequired,
}

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Accueil />} />
        <Route path="/filieres" element={<Filieres />} />
        <Route path="/filieres/:id" element={<FiliereDetail />} />
        <Route path="/candidature" element={<Candidature />} />
        <Route path="/suivi" element={<Suivi />} />
      </Route>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/comptes" element={<Comptes />} />
        <Route path="/admin/tenants" element={<ModulePlaceholder title="Tenants" />} />
        <Route path="/admin/ecoles" element={<ModulePlaceholder title="Écoles" />} />
        <Route path="/admin/filieres" element={<ModulePlaceholder title="Filières" />} />
        <Route
          path="/admin/enseignants"
          element={<ModulePlaceholder title="Enseignants" />}
        />
        <Route path="/admin/etudiants" element={<ModulePlaceholder title="Étudiants" />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['SCOLARITE', 'ADMIN']} />}>
        <Route path="/scolarite" element={<ScolariteDashboard />} />
        <Route path="/scolarite/candidatures" element={<Candidatures />} />
        <Route
          path="/scolarite/etudiants"
          element={<ModulePlaceholder title="Étudiants" />}
        />
        <Route
          path="/scolarite/inscriptions"
          element={<ModulePlaceholder title="Inscriptions" />}
        />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ENSEIGNANT']} />}>
        <Route path="/enseignant" element={<EnseignantDashboard />} />
        <Route
          path="/enseignant/matieres"
          element={<ModulePlaceholder title="Mes matières" />}
        />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ETUDIANT']} />}>
        <Route path="/etudiant" element={<EtudiantDashboard />} />
        <Route
          path="/etudiant/dossier"
          element={<ModulePlaceholder title="Mon dossier" />}
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route
          path={CHANGE_PASSWORD_PATH}
          element={<ChangerMotDePasse />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
