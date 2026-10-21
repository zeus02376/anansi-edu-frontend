import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { Carte, Etat } from '../../components/ui/Etat'
import Modal from '../../components/ui/Modal'
import api from '../../services/api'
import { getErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'
import { inscriptionLabels, inscriptionStyles, nomComplet } from '../../utils/moi'
import { usePageTitle } from '../../utils/usePageTitle'

function Etudiants() {
  usePageTitle('Étudiants')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')

  const loadStudents = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/etudiants')
      if (!Array.isArray(data)) throw new Error('La réponse des étudiants est invalide.')
      setStudents(data)
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Impossible de charger les étudiants.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr')
    if (!query) return students
    return students.filter((student) =>
      `${nomComplet(student.user)} ${student.matricule ?? ''} ${student.user?.email ?? ''} ${
        student.nationalite ?? ''
      }`
        .toLocaleLowerCase('fr')
        .includes(query),
    )
  }, [search, students])

  const openDetails = async (student) => {
    setSelected(student)
    setDetailsLoading(true)
    setDetailsError('')
    try {
      const { data } = await api.get(`/etudiants/${student.id}`)
      setSelected(data)
    } catch (requestError) {
      setDetailsError(
        getErrorMessage(requestError, 'Impossible de charger le dossier étudiant.'),
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  const closeDetails = () => {
    setSelected(null)
    setDetailsError('')
  }

  return (
    <DashboardLayout>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-iuc-red">Gestion académique</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Étudiants</h1>
          <p className="mt-2 text-sm text-slate-500">
            Consultez les profils et le parcours d’inscription des étudiants.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-xl bg-iuc-red px-5 py-3 text-sm font-bold text-white transition hover:bg-iuc-red/90"
          to="/scolarite/candidatures"
        >
          Traiter les candidatures
        </Link>
      </div>

      <Carte titre="Répertoire des étudiants">
        <label className="mb-4 block">
          <span className="sr-only">Rechercher un étudiant</span>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-iuc-red focus:ring-4 focus:ring-iuc-red/10 sm:max-w-md"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom, e-mail, matricule ou nationalité"
            type="search"
            value={search}
          />
        </label>

        <Etat
          error={error}
          loading={loading}
          onRetry={loadStudents}
          vide={
            filteredStudents.length === 0
              ? search
                ? 'Aucun étudiant ne correspond à votre recherche.'
                : 'Aucun étudiant enregistré pour le moment.'
              : ''
          }
        >
          {filteredStudents.length > 0 && (
            <div className="-mx-5 overflow-x-auto sm:-mx-6">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/80">
                    {['Matricule', 'Nom complet', 'E-mail', 'Nationalité', 'Inscriptions', ''].map(
                      (column, index) => (
                        <th
                          className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6"
                          key={`${column}-${index}`}
                        >
                          {column}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr className="hover:bg-slate-50/70" key={student.id}>
                      <td className="whitespace-nowrap px-4 py-4 font-mono text-sm font-semibold text-iuc-red first:pl-5 sm:first:pl-6">
                        {student.matricule}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                        {nomComplet(student.user) || '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {student.user?.email || '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {student.nationalite || '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {student.inscriptions?.length ?? 0}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right last:pr-5 sm:last:pr-6">
                        <button
                          className="rounded-lg border border-iuc-red/20 px-3 py-2 text-xs font-bold text-iuc-red transition hover:bg-iuc-red/5"
                          onClick={() => openDetails(student)}
                          type="button"
                        >
                          Voir le dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Etat>
      </Carte>

      {!loading && !error && (
        <p className="mt-4 text-xs text-slate-400">
          {filteredStudents.length} étudiant{filteredStudents.length === 1 ? '' : 's'} affiché
          {filteredStudents.length === 1 ? '' : 's'}
        </p>
      )}

      {selected && (
        <Modal onClose={closeDetails} title="Dossier étudiant" wide>
          {detailsLoading ? (
            <p className="py-6 text-center text-sm text-slate-500" role="status">
              Chargement du dossier…
            </p>
          ) : detailsError ? (
            <div className="space-y-3" role="alert">
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {detailsError}
              </p>
              <button
                className="text-sm font-bold text-iuc-red underline"
                onClick={() => openDetails(selected)}
                type="button"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Nom complet
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">
                    {nomComplet(selected.user)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Matricule
                  </dt>
                  <dd className="mt-1 font-mono text-sm text-slate-800">{selected.matricule}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    E-mail
                  </dt>
                  <dd className="mt-1 break-words text-sm text-slate-800">
                    {selected.user?.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Nationalité
                  </dt>
                  <dd className="mt-1 text-sm text-slate-800">{selected.nationalite || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Date de naissance
                  </dt>
                  <dd className="mt-1 text-sm text-slate-800">
                    {formatDate(selected.dateNaissance)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Lieu de naissance
                  </dt>
                  <dd className="mt-1 text-sm text-slate-800">
                    {selected.lieuNaissance || '—'}
                  </dd>
                </div>
              </dl>

              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-sm font-bold text-slate-800">Historique des inscriptions</h3>
                {selected.inscriptions?.length ? (
                  <ul className="mt-3 divide-y divide-slate-100">
                    {selected.inscriptions.map((inscription) => (
                      <li
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                        key={inscription.id}
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {inscription.niveau?.nom || 'Niveau non précisé'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Année {inscription.anneeAcademique?.libelle || '—'} ·{' '}
                            {formatDate(inscription.dateInscription)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
                            inscriptionStyles[inscription.statut] ?? 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {inscriptionLabels[inscription.statut] ?? inscription.statut}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Aucune inscription enregistrée.</p>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}
    </DashboardLayout>
  )
}

export default Etudiants
