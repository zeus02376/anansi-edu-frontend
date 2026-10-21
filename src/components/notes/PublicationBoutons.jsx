import { useState } from 'react'
import PropTypes from 'prop-types'
import Modal from '../ui/Modal'
import { inputClass } from '../ui/styles'
import { depublierEvaluation, publierEvaluationPersonnel } from '../../services/notesPersonnel'
import { getErrorMessage } from '../../utils/errors'

/**
 * Publier (brouillon avec au moins une note) ou dépublier (motif obligatoire) une évaluation.
 * `onChange(message)` est appelé après l'action — ou après un échec 409, pour rafraîchir
 * l'affichage — afin que la page recharge ses données.
 */
function PublicationBoutons({ evaluation, onChange }) {
  const [dialogue, setDialogue] = useState(null) // 'publier' | 'depublier'
  const [motif, setMotif] = useState('')
  const [etat, setEtat] = useState({ occupe: false, erreur: '' })
  const nbNotes = evaluation._count?.notes ?? 0
  const publiee = evaluation.statut === 'PUBLIEE'

  const fermer = () => {
    setDialogue(null)
    setMotif('')
    setEtat({ occupe: false, erreur: '' })
  }

  const executer = async (operation, message, erreurParDefaut) => {
    setEtat({ occupe: true, erreur: '' })
    try {
      await operation()
      fermer()
      onChange({ type: 'success', text: message })
    } catch (error) {
      setEtat({ occupe: false, erreur: getErrorMessage(error, erreurParDefaut) })
      // Une évaluation déjà publiée ou dépubliée ailleurs : on rafraîchit l'état affiché
      if (error.response?.status === 409) onChange(null)
    }
  }

  const depublier = () => {
    if (motif.trim() === '') {
      setEtat({ occupe: false, erreur: 'Le motif est obligatoire.' })
      return
    }
    executer(
      () => depublierEvaluation(evaluation.id, motif.trim()),
      `« ${evaluation.nom} » est dépubliée : elle n’est plus visible des étudiants et son enseignant peut de nouveau la modifier.`,
      'La dépublication a échoué.',
    )
  }

  return (
    <>
      {publiee ? (
        <button
          className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50"
          onClick={() => setDialogue('depublier')}
          type="button"
        >
          Dépublier
        </button>
      ) : (
        <button
          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={nbNotes === 0}
          onClick={() => setDialogue('publier')}
          title={nbNotes === 0 ? 'Aucune note saisie : rien à publier' : undefined}
          type="button"
        >
          Publier
        </button>
      )}

      {dialogue === 'publier' && (
        <Modal onClose={fermer} title="Publier l’évaluation">
          <p className="text-sm text-slate-700">
            Publier « {evaluation.nom} » la rend visible des étudiants ({nbNotes} note{nbNotes > 1 ? 's' : ''}) et
            verrouille sa saisie pour l’enseignant.
          </p>
          {etat.erreur && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
              {etat.erreur}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              onClick={fermer}
              type="button"
            >
              Annuler
            </button>
            <button
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
              disabled={etat.occupe}
              onClick={() =>
                executer(
                  () => publierEvaluationPersonnel(evaluation.id),
                  `« ${evaluation.nom} » est publiée : elle est visible des étudiants.`,
                  'La publication a échoué.',
                )
              }
              type="button"
            >
              {etat.occupe ? 'Publication…' : 'Publier'}
            </button>
          </div>
        </Modal>
      )}

      {dialogue === 'depublier' && (
        <Modal onClose={fermer} title="Dépublier l’évaluation">
          <p className="text-sm text-slate-700">
            Dépublier « {evaluation.nom} » la retire immédiatement du relevé des étudiants (leurs moyennes sont
            recalculées) et la rend de nouveau modifiable par son enseignant. L’opération est journalisée.
          </p>
          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Motif (obligatoire)
            <textarea
              className={`${inputClass} mt-1.5`}
              maxLength={500}
              onChange={(event) => setMotif(event.target.value)}
              rows={3}
              value={motif}
            />
          </label>
          {etat.erreur && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
              {etat.erreur}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              onClick={fermer}
              type="button"
            >
              Annuler
            </button>
            <button
              className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-60"
              disabled={etat.occupe}
              onClick={depublier}
              type="button"
            >
              {etat.occupe ? 'Dépublication…' : 'Dépublier'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

PublicationBoutons.propTypes = {
  evaluation: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nom: PropTypes.string.isRequired,
    statut: PropTypes.string.isRequired,
    _count: PropTypes.shape({ notes: PropTypes.number }),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
}

export default PublicationBoutons
