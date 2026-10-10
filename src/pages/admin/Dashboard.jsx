import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import api from '../../services/api'

const statCards = [
  { key: 'tenants', label: 'Établissements', description: 'Universités sur ANANSI', tone: 'bg-blue-50 text-blue-700' },
  { key: 'ecoles', label: 'Écoles', description: 'Structures académiques', tone: 'bg-violet-50 text-violet-700' },
  { key: 'etudiants', label: 'Étudiants', description: 'Dossiers enregistrés', tone: 'bg-emerald-50 text-emerald-700' },
]

function Dashboard() {
  const [stats, setStats] = useState({ tenants: null, ecoles: null, etudiants: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([
      api.get('/tenants'),
      api.get('/ecoles'),
      api.get('/etudiants'),
    ])
      .then(([tenants, ecoles, etudiants]) => {
        if (active) {
          setStats({
            tenants: tenants.data.length,
            ecoles: ecoles.data.length,
            etudiants: etudiants.data.length,
          })
        }
      })
      .catch(() => {
        if (active) setError('Impossible de charger les statistiques. Réessayez plus tard.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <DashboardLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold text-[#1E3A8A]">Vue d’ensemble</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Tableau de bord Admin
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Pilotez votre plateforme et suivez l’activité académique.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card, index) => (
          <article
            key={card.key}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {loading ? (
                    <span className="inline-block h-9 w-14 animate-pulse rounded bg-slate-100" />
                  ) : (
                    stats[card.key]
                  )}
                </p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold ${card.tone}`}>
                {['U', 'É', 'É'][index]}
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">{card.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-slate-900">Bienvenue dans votre espace Admin</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Utilisez la navigation pour gérer les établissements, les structures
          académiques, les enseignants et les étudiants de la plateforme.
        </p>
      </section>
    </DashboardLayout>
  )
}

export default Dashboard
