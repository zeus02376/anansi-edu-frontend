import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'

function Dashboard() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold text-iuc-red">Espace scolarité</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Tableau de bord Scolarité
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Retrouvez les candidatures et les opérations de gestion des étudiants.
        </p>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Suivi des admissions</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Consultez les dossiers reçus et accompagnez leur traitement.
            </p>
          </div>
          <Link
            to="/scolarite/candidatures"
            className="inline-flex items-center justify-center rounded-xl bg-iuc-red px-5 py-3 text-sm font-bold text-white transition hover:bg-iuc-red/90"
          >
            Voir les candidatures
          </Link>
        </div>
      </section>
    </DashboardLayout>
  )
}

export default Dashboard
