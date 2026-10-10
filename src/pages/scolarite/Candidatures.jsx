import { useCallback, useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import api from '../../services/api'

const statuses = ['SOUMIS', 'INCOMPLET', 'EN_EXAMEN', 'ACCEPTE', 'REJETE']

const statusLabels = {
  SOUMIS: 'Soumis',
  INCOMPLET: 'Incomplet',
  EN_EXAMEN: 'En examen',
  ACCEPTE: 'Accepté',
  REJETE: 'Rejeté',
}

const statusStyles = {
  SOUMIS: 'bg-iuc-blue/10 text-iuc-blue',
  INCOMPLET: 'bg-amber-50 text-amber-700',
  EN_EXAMEN: 'bg-violet-50 text-violet-700',
  ACCEPTE: 'bg-emerald-50 text-emerald-700',
  REJETE: 'bg-red-50 text-red-700',
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date)
}

function Candidatures() {
  const [candidatures, setCandidatures] = useState([])
  const [filter, setFilter] = useState('TOUS')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState({})
  const [rowErrors, setRowErrors] = useState({})

  const loadCandidatures = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/candidatures')
      setCandidatures(data)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Impossible de charger les candidatures. Veuillez réessayer.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCandidatures()
  }, [loadCandidatures])

  const filteredCandidatures = useMemo(
    () =>
      filter === 'TOUS'
        ? candidatures
        : candidatures.filter((candidature) => candidature.statut === filter),
    [candidatures, filter],
  )

  const changeStatus = async (candidature, statut) => {
    setUpdating((current) => ({ ...current, [candidature.id]: true }))
    setRowErrors((current) => ({ ...current, [candidature.id]: '' }))
    try {
      const { data } = await api.patch(`/candidatures/${candidature.id}/statut`, {
        statut,
      })
      setCandidatures((current) =>
        current.map((item) => (item.id === candidature.id ? { ...item, ...data } : item)),
      )
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ??
        'Le statut n’a pas pu être modifié.'
      setRowErrors((current) => ({
        ...current,
        [candidature.id]: Array.isArray(message) ? message.join(', ') : message,
      }))
    } finally {
      setUpdating((current) => ({ ...current, [candidature.id]: false }))
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-iuc-blue">Admissions</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Candidatures
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Consultez les dossiers et mettez à jour leur statut.
          </p>
        </div>
        <label className="flex items-center gap-3 text-sm font-medium text-slate-600">
          Filtrer par statut
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-iuc-blue focus:ring-4 focus:ring-iuc-blue/10"
          >
            <option value="TOUS">Tous les statuts</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center"
        >
          <span>{Array.isArray(error) ? error.join(', ') : error}</span>
          <button onClick={loadCandidatures} className="font-bold underline">
            Réessayer
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-4 p-6" aria-label="Chargement des candidatures">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Les candidatures ne sont pas disponibles pour le moment.
          </div>
        ) : filteredCandidatures.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-700">Aucune candidature à afficher</p>
            <p className="mt-2 text-sm text-slate-400">
              {filter === 'TOUS'
                ? 'Les nouveaux dossiers apparaîtront ici.'
                : `Aucun dossier au statut « ${statusLabels[filter]} ».`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {['Nom', 'Prénom', 'Email', 'Filière', 'Statut', 'Date', 'Actions'].map(
                    (column) => (
                      <th
                        key={column}
                        className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400"
                      >
                        {column}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidatures.map((candidature) => (
                  <tr key={candidature.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                      {candidature.nom}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{candidature.prenom}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{candidature.email}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {candidature.filiere?.nom ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                          statusStyles[candidature.statut] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {statusLabels[candidature.statut] ?? candidature.statut}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                      {formatDate(candidature.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <label className="sr-only" htmlFor={`status-${candidature.id}`}>
                        Changer le statut de {candidature.prenom} {candidature.nom}
                      </label>
                      <select
                        id={`status-${candidature.id}`}
                        value={candidature.statut}
                        disabled={updating[candidature.id]}
                        onChange={(event) => changeStatus(candidature, event.target.value)}
                        className="max-w-36 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-iuc-blue disabled:opacity-60"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                      {rowErrors[candidature.id] && (
                        <p role="alert" className="mt-1 max-w-36 text-xs text-red-600">
                          {rowErrors[candidature.id]}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="mt-4 text-xs text-slate-400">
        {filteredCandidatures.length} dossier{filteredCandidatures.length === 1 ? '' : 's'}
        {filter === 'TOUS' ? '' : ` · ${statusLabels[filter]}`}
      </p>
    </DashboardLayout>
  )
}

export default Candidatures
