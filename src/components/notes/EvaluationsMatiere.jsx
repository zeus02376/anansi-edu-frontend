import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import Field from '../ui/Field'
import Modal from '../ui/Modal'
import { inputClass } from '../ui/styles'
import {
  creerEvaluation,
  fetchEvaluations,
  modifierEvaluation,
  publierEvaluation,
  supprimerEvaluation,
} from '../../services/notes'
import { getErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'
import {
  formatNombre,
  statutEvaluationLabels,
  statutEvaluationStyles,
  typeEvaluationLabels,
} from '../../utils/notes'
import { useRessource } from '../../utils/useRessource'

/** Création ou modification (brouillon) d'une évaluation. */
function EvaluationForm({ evaluation, onClose, onSaved, matiereId }) {
  const [erreur, setErreur] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      nom: evaluation?.nom ?? '',
      type: evaluation?.type ?? 'DEVOIR',
      coefficient: evaluation?.coefficient ?? 1,
      bareme: evaluation?.bareme ?? 20,
      date: evaluation?.date ? evaluation.date.slice(0, 10) : '',
    },
  })

  const onSubmit = async (valeurs) => {
    setErreur('')
    const donnees = {
      nom: valeurs.nom.trim(),
      type: valeurs.type,
      coefficient: Number(String(valeurs.coefficient).replace(',', '.')),
      bareme: Number(String(valeurs.bareme).replace(',', '.')),
      ...(valeurs.date && { date: `${valeurs.date}T00:00:00.000Z` }),
    }
    try {
      if (evaluation) await modifierEvaluation(evaluation.id, donnees)
      else await creerEvaluation(matiereId, donnees)
      onSaved()
    } catch (error) {
      setErreur(getErrorMessage(error, 'L’enregistrement a échoué. Veuillez réessayer.'))
    }
  }

  const nombre = (min, max) => ({
    required: 'Obligatoire',
    validate: (value) => {
      const n = Number(String(value).replace(',', '.'))
      if (Number.isNaN(n) || n < min || n > max) return `Entre ${min} et ${max}`
      return /^\d+([.,]\d{1,2})?$/.test(String(value).trim()) || '2 décimales au plus'
    },
  })

  return (
    <Modal onClose={onClose} title={evaluation ? 'Modifier l’évaluation' : 'Nouvelle évaluation'}>
      <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
        {erreur && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
            {erreur}
          </p>
        )}
        <Field label="Nom" error={errors.nom}>
          <input
            className={inputClass}
            placeholder="Devoir 1, Examen final…"
            {...register('nom', {
              validate: (value) => value.trim() !== '' || 'Le nom est obligatoire',
              maxLength: { value: 100, message: '100 caractères au maximum' },
            })}
          />
        </Field>
        <Field label="Type" error={errors.type}>
          <select className={inputClass} {...register('type')}>
            {Object.entries(typeEvaluationLabels).map(([valeur, libelle]) => (
              <option key={valeur} value={valeur}>
                {libelle}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Coefficient" error={errors.coefficient}>
            <input
              className={inputClass}
              inputMode="decimal"
              {...register('coefficient', nombre(0.01, 999.99))}
            />
          </Field>
          <Field label="Barème (note maximale)" error={errors.bareme}>
            <input className={inputClass} inputMode="decimal" {...register('bareme', nombre(0.01, 999.99))} />
          </Field>
        </div>
        <Field label="Date (facultative)" error={errors.date}>
          <input className={inputClass} type="date" {...register('date')} />
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Annuler
          </button>
          <button
            className="rounded-xl bg-iuc-red px-5 py-2.5 text-sm font-bold text-white transition hover:bg-iuc-red/90 disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

EvaluationForm.propTypes = {
  evaluation: PropTypes.object,
  matiereId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
}

/** Confirmation d'une action sur une évaluation (publier, supprimer). */
function Confirmation({ titre, message, confirmer, danger, onConfirm, onClose, erreur, occupe }) {
  return (
    <Modal onClose={onClose} title={titre}>
      <p className="text-sm text-slate-700">{message}</p>
      {erreur && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
          {erreur}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          onClick={onClose}
          type="button"
        >
          Annuler
        </button>
        <button
          className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-60 ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-iuc-red hover:bg-iuc-red/90'
          }`}
          disabled={occupe}
          onClick={onConfirm}
          type="button"
        >
          {occupe ? 'En cours…' : confirmer}
        </button>
      </div>
    </Modal>
  )
}

Confirmation.propTypes = {
  titre: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmer: PropTypes.string.isRequired,
  danger: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  erreur: PropTypes.string,
  occupe: PropTypes.bool,
}

/**
 * Évaluations d'une matière de l'enseignant : créer, modifier (brouillon), saisir les
 * notes, publier, supprimer (brouillon). Une évaluation publiée est verrouillée.
 */
function EvaluationsMatiere({ matiereId }) {
  const fetcher = useCallback((signal) => fetchEvaluations(matiereId, signal), [matiereId])
  const { data, loading, error, recharger } = useRessource(fetcher)
  const [dialogue, setDialogue] = useState(null) // { type: 'form'|'publier'|'supprimer', evaluation? }
  const [action, setAction] = useState({ occupe: false, erreur: '' })

  const fermer = () => {
    setDialogue(null)
    setAction({ occupe: false, erreur: '' })
  }
  const apresEnregistrement = () => {
    fermer()
    recharger()
  }

  const executer = async (operation, messageErreur) => {
    setAction({ occupe: true, erreur: '' })
    try {
      await operation()
      apresEnregistrement()
    } catch (requestError) {
      setAction({ occupe: false, erreur: getErrorMessage(requestError, messageErreur) })
    }
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-800">Évaluations</h3>
        <button
          className="rounded-lg bg-iuc-red px-3 py-2 text-xs font-bold text-white transition hover:bg-iuc-red/90"
          onClick={() => setDialogue({ type: 'form' })}
          type="button"
        >
          + Nouvelle évaluation
        </button>
      </div>

      {loading && (
        <p className="text-sm text-slate-500" role="status">
          Chargement…
        </p>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          <p>{error}</p>
          <button className="mt-1 font-semibold underline" onClick={recharger} type="button">
            Réessayer
          </button>
        </div>
      )}
      {data && data.length === 0 && (
        <p className="text-sm text-slate-500">
          Aucune évaluation pour cette matière. Créez la première pour saisir des notes.
        </p>
      )}
      {data && data.length > 0 && (
        <ul className="space-y-2">
          {data.map((evaluation) => {
            const brouillon = evaluation.statut === 'BROUILLON'
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
                    {typeEvaluationLabels[evaluation.type] ?? evaluation.type} · coef.{' '}
                    {formatNombre(evaluation.coefficient)} · sur {formatNombre(evaluation.bareme)} · {nbNotes} note
                    {nbNotes > 1 ? 's' : ''}
                    {evaluation.date ? ` · ${formatDate(evaluation.date)}` : ''}
                    {!brouillon && evaluation.publieLe ? ` · publiée le ${formatDate(evaluation.publieLe)}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    className="rounded-lg border border-iuc-red/20 px-3 py-2 text-xs font-bold text-iuc-red hover:bg-iuc-red/5"
                    to={`/enseignant/evaluations/${evaluation.id}`}
                  >
                    {brouillon ? 'Saisir les notes' : 'Voir les notes'}
                  </Link>
                  {brouillon && (
                    <>
                      <button
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white"
                        onClick={() => setDialogue({ type: 'form', evaluation })}
                        type="button"
                      >
                        Modifier
                      </button>
                      <button
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={nbNotes === 0}
                        onClick={() => setDialogue({ type: 'publier', evaluation })}
                        title={nbNotes === 0 ? 'Saisissez au moins une note avant de publier' : undefined}
                        type="button"
                      >
                        Publier
                      </button>
                      <button
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                        onClick={() => setDialogue({ type: 'supprimer', evaluation })}
                        type="button"
                      >
                        Supprimer
                      </button>
                    </>
                  )}
                  {!brouillon && (
                    <span className="text-xs text-slate-500">Verrouillée (correction par la scolarité)</span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {dialogue?.type === 'form' && (
        <EvaluationForm
          evaluation={dialogue.evaluation}
          matiereId={matiereId}
          onClose={fermer}
          onSaved={apresEnregistrement}
        />
      )}
      {dialogue?.type === 'publier' && (
        <Confirmation
          confirmer="Publier"
          erreur={action.erreur}
          message={`Publier « ${dialogue.evaluation.nom} » la rend visible des étudiants et la verrouille : vous ne pourrez plus modifier ses notes (toute correction passera par la scolarité).`}
          occupe={action.occupe}
          onClose={fermer}
          onConfirm={() =>
            executer(() => publierEvaluation(dialogue.evaluation.id), 'La publication a échoué.')
          }
          titre="Publier l’évaluation"
        />
      )}
      {dialogue?.type === 'supprimer' && (
        <Confirmation
          confirmer="Supprimer"
          danger
          erreur={action.erreur}
          message={`Supprimer « ${dialogue.evaluation.nom} » supprime aussi les notes déjà saisies. Cette action est définitive.`}
          occupe={action.occupe}
          onClose={fermer}
          onConfirm={() =>
            executer(() => supprimerEvaluation(dialogue.evaluation.id), 'La suppression a échoué.')
          }
          titre="Supprimer l’évaluation"
        />
      )}
    </div>
  )
}

EvaluationsMatiere.propTypes = {
  matiereId: PropTypes.string.isRequired,
}

export default EvaluationsMatiere
