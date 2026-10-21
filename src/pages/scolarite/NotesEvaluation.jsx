import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import CorrectionNote from '../../components/notes/CorrectionNote'
import HistoriqueNote from '../../components/notes/HistoriqueNote'
import PublicationBoutons from '../../components/notes/PublicationBoutons'
import { fetchGrillePersonnel } from '../../services/notesPersonnel'
import { getErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'
import {
  actionPublicationLabels,
  etatNoteLabels,
  formatDateHeure,
  formatNombre,
  nomAuteur,
  statutEvaluationLabels,
  statutEvaluationStyles,
  statutInscriptionLabels,
  typeEvaluationLabels,
} from '../../utils/notes'
import { usePageTitle } from '../../utils/usePageTitle'

const styleMessage = {
  success: 'bg-emerald-50 text-emerald-800',
  warning: 'bg-amber-50 text-amber-900',
  error: 'bg-red-50 text-red-700',
}

/**
 * Grille de notes d'une évaluation, côté personnel : consultation (publiée ou brouillon),
 * correction d'une note avec motif, historique des corrections, publication et dépublication.
 */
function NotesEvaluation() {
  usePageTitle('Notes — évaluation')
  const { id } = useParams()
  const [grille, setGrille] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [introuvable, setIntrouvable] = useState(false)
  const [message, setMessage] = useState(null)
  const [correction, setCorrection] = useState(null) // ligne de la grille
  const [historique, setHistorique] = useState(null) // ligne de la grille

  /** Charge (ou recharge) la grille ; renvoie les données, ou null en cas d'échec. */
  const charger = useCallback(
    async (signal) => {
      try {
        const data = await fetchGrillePersonnel(id, signal)
        setGrille(data)
        setErreur('')
        setIntrouvable(false)
        return data
      } catch (error) {
        if (signal?.aborted) return null
        if (error.response?.status === 404) setIntrouvable(true)
        else setErreur(getErrorMessage(error, 'Impossible de charger les notes de cette évaluation.'))
        return null
      } finally {
        setChargement(false)
      }
    },
    [id],
  )

  useEffect(() => {
    const controller = new AbortController()
    charger(controller.signal)
    return () => controller.abort()
  }, [charger])

  const evaluation = grille?.evaluation
  const publiee = evaluation?.statut === 'PUBLIEE'

  const apresPublication = (retour) => {
    if (retour) setMessage(retour)
    charger()
  }

  const apresCorrection = (texte) => {
    setCorrection(null)
    setMessage({ type: 'success', text: texte })
    charger()
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link className="text-sm font-semibold text-iuc-red hover:underline" to="/scolarite/notes">
          ← Évaluations
        </Link>
      </div>

      {chargement && (
        <p className="text-sm text-slate-500" role="status">
          Chargement des notes…
        </p>
      )}
      {erreur && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          <p>{erreur}</p>
          <button className="mt-2 font-semibold underline" onClick={() => charger()} type="button">
            Réessayer
          </button>
        </div>
      )}
      {introuvable && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">Évaluation introuvable</h1>
          <p className="mt-2 text-sm text-slate-500">
            Cette évaluation n’existe pas ou n’appartient pas à votre établissement.
          </p>
        </div>
      )}

      {evaluation && (
        <>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-iuc-red">
                {evaluation.matiere?.nom} ({evaluation.matiere?.code})
              </p>
              <h1 className="mt-1 flex flex-wrap items-center gap-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                {evaluation.nom}
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                    statutEvaluationStyles[evaluation.statut] ?? 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {statutEvaluationLabels[evaluation.statut] ?? evaluation.statut}
                </span>
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {typeEvaluationLabels[evaluation.type] ?? evaluation.type} · coefficient{' '}
                {formatNombre(evaluation.coefficient)} · notée sur {formatNombre(evaluation.bareme)}
                {evaluation.date ? ` · ${formatDate(evaluation.date)}` : ''} · créée par{' '}
                {nomAuteur(evaluation.createur)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <PublicationBoutons evaluation={evaluation} onChange={apresPublication} />
            </div>
          </div>

          <p
            className={`mb-6 rounded-xl p-4 text-sm ${publiee ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}
            role="note"
          >
            {publiee ? (
              <>
                Évaluation <strong>publiée</strong> : visible des étudiants, verrouillée pour son enseignant. Vous pouvez
                corriger une note (motif obligatoire, journalisé) ou dépublier l’évaluation.
              </>
            ) : (
              <>
                <strong>Brouillon</strong> : les étudiants ne voient rien. Vous pouvez corriger une note (motif
                obligatoire) ; la saisie reste du ressort de l’enseignant.
              </>
            )}
          </p>

          {message && (
            <p className={`mb-6 rounded-xl p-4 text-sm ${styleMessage[message.type]}`} role="status">
              {message.text}
            </p>
          )}

          {grille.notes.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              Aucun inscrit validé et aucune note pour cette évaluation.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Matricule</th>
                    <th className="px-4 py-3">Étudiant</th>
                    <th className="px-4 py-3">État</th>
                    <th className="px-4 py-3">Note / {formatNombre(evaluation.bareme)}</th>
                    <th className="px-4 py-3">Commentaire</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grille.notes.map((ligne) => {
                    const nom = `${ligne.etudiant.prenom} ${ligne.etudiant.nom}`
                    return (
                      <tr data-testid={`ligne-${ligne.inscriptionId}`} key={ligne.inscriptionId}>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                          {ligne.etudiant.matricule}
                          {ligne.etudiant.matriculeIuc && <span className="block">{ligne.etudiant.matriculeIuc}</span>}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {nom}
                          {ligne.statutInscription !== 'VALIDE' && (
                            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                              {statutInscriptionLabels[ligne.statutInscription] ?? ligne.statutInscription}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">{ligne.note ? etatNoteLabels[ligne.note.etat] : 'Pas de note'}</td>
                        <td className="px-4 py-3 font-semibold">
                          {ligne.note?.etat === 'NOTEE' ? formatNombre(ligne.note.valeur) : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{ligne.note?.commentaire ?? ''}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {ligne.note ? (
                            <>
                              <button
                                aria-label={`Corriger la note de ${nom}`}
                                className="rounded-lg border border-iuc-red/20 px-3 py-1.5 text-xs font-bold text-iuc-red hover:bg-iuc-red/5"
                                onClick={() => setCorrection(ligne)}
                                type="button"
                              >
                                Corriger
                              </button>
                              <button
                                aria-label={`Historique de la note de ${nom}`}
                                className="ml-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                onClick={() => setHistorique(ligne)}
                                type="button"
                              >
                                Historique
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <section className="mt-8">
            <h2 className="text-sm font-bold text-slate-800">Publications</h2>
            {grille.publications.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Cette évaluation n’a jamais été publiée.</p>
            ) : (
              <ul className="mt-2 space-y-2" data-testid="publications">
                {grille.publications.map((publication, index) => (
                  <li className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700" key={`${publication.date}-${index}`}>
                    <span className="font-semibold">{actionPublicationLabels[publication.action] ?? publication.action}</span>{' '}
                    le {formatDateHeure(publication.date)} par {nomAuteur(publication.auteur)}
                    {publication.motif && <span className="block text-slate-600">Motif : {publication.motif}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {correction && (
            <CorrectionNote
              bareme={evaluation.bareme}
              ligne={correction}
              onClose={() => setCorrection(null)}
              onCorrigee={apresCorrection}
              recharger={() => charger()}
            />
          )}
          {historique && (
            <HistoriqueNote
              noteId={historique.note.id}
              onClose={() => setHistorique(null)}
              titre={`Historique de la note de ${historique.etudiant.prenom} ${historique.etudiant.nom}`}
            />
          )}
        </>
      )}
    </DashboardLayout>
  )
}

export default NotesEvaluation
