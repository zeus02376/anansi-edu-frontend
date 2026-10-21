import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import PublicationBoutons from '../../components/notes/PublicationBoutons'
import { Carte, Etat } from '../../components/ui/Etat'
import { inputClass } from '../../components/ui/styles'
import { fetchAnnees, fetchEvaluationsPersonnel, fetchMatieres } from '../../services/notesPersonnel'
import { formatDate } from '../../utils/format'
import {
  formatNombre,
  nomAuteur,
  statutEvaluationLabels,
  statutEvaluationStyles,
  typeEvaluationLabels,
} from '../../utils/notes'
import { useRessource } from '../../utils/useRessource'
import { usePageTitle } from '../../utils/usePageTitle'

/** Année à ouvrir par défaut : l'année active, sinon la plus récente. */
const anneeParDefaut = (annees) =>
  (annees.find((annee) => annee.active) ?? [...annees].sort((a, b) => b.dateDebut.localeCompare(a.dateDebut))[0])?.id ?? ''

/**
 * Évaluations de l'établissement (publiées et brouillons), par année et par matière :
 * accès à la grille de notes, publication et dépublication (motif obligatoire).
 */
function NotesEvaluations() {
  usePageTitle('Notes — évaluations')
  const annees = useRessource(fetchAnnees)
  const matieres = useRessource(fetchMatieres)
  const [anneeId, setAnneeId] = useState(null) // null : pas encore initialisée
  const [matiereId, setMatiereId] = useState('')
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (anneeId === null && annees.data) setAnneeId(anneeParDefaut(annees.data))
  }, [annees.data, anneeId])

  const fetcher = useCallback(
    (signal) => (anneeId === null ? Promise.resolve(null) : fetchEvaluationsPersonnel({ anneeId, matiereId }, signal)),
    [anneeId, matiereId],
  )
  const evaluations = useRessource(fetcher)

  const matieresDeLAnnee = useMemo(
    () => (matieres.data ?? []).filter((matiere) => !anneeId || matiere.anneeAcademiqueId === anneeId),
    [matieres.data, anneeId],
  )

  const apresAction = (retour) => {
    if (retour) setMessage(retour)
    evaluations.recharger()
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold text-iuc-red">Espace scolarité</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Notes</h1>
        <p className="mt-2 text-sm text-slate-500">
          Évaluations de l’établissement, publiées ou en brouillon : consultez les notes, corrigez-les, publiez ou
          dépubliez.{' '}
          <Link className="font-semibold text-iuc-red underline" to="/scolarite/notes/releve">
            Relevé d’un étudiant →
          </Link>
        </p>
      </div>

      <Carte titre="Évaluations">
        <Etat error={annees.error} loading={annees.loading} onRetry={annees.recharger}>
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Année académique
              <select
                className={`${inputClass} mt-1.5`}
                onChange={(event) => {
                  setAnneeId(event.target.value)
                  setMatiereId('')
                }}
                value={anneeId ?? ''}
              >
                <option value="">Toutes les années</option>
                {(annees.data ?? []).map((annee) => (
                  <option key={annee.id} value={annee.id}>
                    {annee.libelle}
                    {annee.active ? ' (active)' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Matière
              <select
                className={`${inputClass} mt-1.5`}
                onChange={(event) => setMatiereId(event.target.value)}
                value={matiereId}
              >
                <option value="">Toutes les matières</option>
                {matieresDeLAnnee.map((matiere) => (
                  <option key={matiere.id} value={matiere.id}>
                    {matiere.nom} ({matiere.code})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {message && (
            <p
              className={`mb-4 rounded-xl p-3 text-sm ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'
              }`}
              role="status"
            >
              {message.text}
            </p>
          )}

          <Etat
            error={evaluations.error}
            loading={evaluations.loading || anneeId === null}
            onRetry={evaluations.recharger}
            vide={
              evaluations.data && evaluations.data.length === 0
                ? 'Aucune évaluation pour ce filtre. Les évaluations sont créées par les enseignants.'
                : ''
            }
          >
            {evaluations.data && (
              <ul className="space-y-2">
                {evaluations.data.map((evaluation) => {
                  const nbNotes = evaluation._count?.notes ?? 0
                  return (
                    <li
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
                      data-testid={`evaluation-${evaluation.id}`}
                      key={evaluation.id}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {evaluation.nom}
                          <span
                            className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                              statutEvaluationStyles[evaluation.statut] ?? 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {statutEvaluationLabels[evaluation.statut] ?? evaluation.statut}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">
                          {evaluation.matiere?.nom} ({evaluation.matiere?.code}) ·{' '}
                          {typeEvaluationLabels[evaluation.type] ?? evaluation.type} · coef.{' '}
                          {formatNombre(evaluation.coefficient)} · sur {formatNombre(evaluation.bareme)} · {nbNotes} note
                          {nbNotes > 1 ? 's' : ''} · par {nomAuteur(evaluation.createur)}
                          {evaluation.statut === 'PUBLIEE' && evaluation.publieLe
                            ? ` · publiée le ${formatDate(evaluation.publieLe)}`
                            : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          className="rounded-lg border border-iuc-red/20 px-3 py-2 text-xs font-bold text-iuc-red hover:bg-iuc-red/5"
                          to={`/scolarite/evaluations/${evaluation.id}`}
                        >
                          Voir les notes
                        </Link>
                        <PublicationBoutons evaluation={evaluation} onChange={apresAction} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Etat>
        </Etat>
      </Carte>
    </DashboardLayout>
  )
}

export default NotesEvaluations
