import { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import DashboardLayout from '../../components/DashboardLayout'
import { Carte, Etat } from '../../components/ui/Etat'
import { inputClass } from '../../components/ui/styles'
import { fetchMesNotes } from '../../services/moi'
import { anneeCourante, etatNoteLabels, formatNombre, typeEvaluationLabels } from '../../utils/notes'
import { useRessource } from '../../utils/useRessource'
import { usePageTitle } from '../../utils/usePageTitle'

function NoteEvaluation({ evaluation }) {
  const { note, bareme } = evaluation
  if (!note) return <span className="text-slate-500">Non noté</span>
  if (note.etat === 'NOTEE') {
    return (
      <span className="font-semibold text-slate-900">
        {formatNombre(note.valeur)} / {formatNombre(bareme)}
      </span>
    )
  }
  return (
    <span className="text-slate-700">
      <span className="font-semibold">{etatNoteLabels[note.etat] ?? note.etat}</span>
      <span className="ml-1 text-xs text-slate-500">
        {note.etat === 'ABSENT' ? '(compte 0)' : '(non compté)'}
      </span>
    </span>
  )
}

NoteEvaluation.propTypes = {
  evaluation: PropTypes.shape({
    bareme: PropTypes.number,
    note: PropTypes.shape({ etat: PropTypes.string, valeur: PropTypes.number }),
  }).isRequired,
}

function Matiere({ matiere }) {
  const nb = matiere.evaluations.length
  return (
    <details className="group rounded-xl border border-slate-200 bg-white" data-testid={`matiere-${matiere.code}`}>
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3">
        <span>
          <span className="font-semibold text-slate-900">{matiere.nom}</span>
          <span className="ml-2 text-xs text-slate-500">
            {matiere.code} · coef. {formatNombre(matiere.coefficient)}
          </span>
        </span>
        <span className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">
            {nb === 0 ? 'Aucune évaluation publiée' : `${nb} évaluation${nb > 1 ? 's' : ''}`}
          </span>
          <span className="rounded-lg bg-iuc-blue/10 px-2.5 py-1 font-bold text-iuc-blue">
            {matiere.moyenne === null ? '—' : `${formatNombre(matiere.moyenne)} / 20`}
          </span>
          <span aria-hidden="true" className="text-slate-400 transition group-open:rotate-90">
            ›
          </span>
        </span>
      </summary>
      <div className="border-t border-slate-100 px-4 py-3">
        {nb === 0 ? (
          <p className="text-sm text-slate-500">
            Aucune évaluation publiée pour cette matière pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {matiere.evaluations.map((evaluation) => (
              <li className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm" key={evaluation.id}>
                <span>
                  <span className="font-medium text-slate-800">{evaluation.nom}</span>
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {typeEvaluationLabels[evaluation.type] ?? evaluation.type}
                  </span>
                </span>
                <span className="flex items-center gap-4">
                  <span className="text-xs text-slate-500">coef. {formatNombre(evaluation.coefficient)}</span>
                  <NoteEvaluation evaluation={evaluation} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  )
}

Matiere.propTypes = {
  matiere: PropTypes.shape({
    nom: PropTypes.string,
    code: PropTypes.string,
    coefficient: PropTypes.number,
    moyenne: PropTypes.number,
    evaluations: PropTypes.array.isRequired,
  }).isRequired,
}

function Annee({ annee }) {
  const aucuneEvaluation = annee.matieres.every((matiere) => matiere.evaluations.length === 0)
  return (
    <div className="space-y-6">
      <Carte titre="Moyenne générale">
        <div className="flex flex-wrap items-center gap-3">
          {annee.moyenneGenerale === null ? (
            <p className="text-sm text-slate-500">
              Pas encore de moyenne générale : aucune note publiée n’entre dans le calcul.
            </p>
          ) : (
            <p className="text-3xl font-black text-iuc-blue" data-testid="moyenne-generale">
              {formatNombre(annee.moyenneGenerale)}
              <span className="text-lg font-semibold text-slate-400"> / 20</span>
            </p>
          )}
          {annee.provisoire && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
              Provisoire
            </span>
          )}
        </div>
        {annee.provisoire && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="note">
            Moyenne <strong>provisoire</strong> : calculée sur les évaluations publiées à ce jour, elle peut encore
            évoluer. Ce n’est pas un résultat définitif.
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          {annee.niveau?.nom} · année {annee.annee?.libelle}
        </p>
      </Carte>

      <Carte titre="Mes matières">
        {annee.matieres.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune matière n’est encore rattachée à votre niveau pour cette année.</p>
        ) : (
          <div className="space-y-3">
            {aucuneEvaluation && (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                Aucune évaluation n’a encore été publiée pour cette année : vos notes apparaîtront ici dès leur publication.
              </p>
            )}
            {annee.matieres.map((matiere) => (
              <Matiere key={matiere.id} matiere={matiere} />
            ))}
          </div>
        )}
      </Carte>
    </div>
  )
}

Annee.propTypes = {
  annee: PropTypes.shape({
    provisoire: PropTypes.bool,
    moyenneGenerale: PropTypes.number,
    niveau: PropTypes.object,
    annee: PropTypes.object,
    matieres: PropTypes.array.isRequired,
  }).isRequired,
}

function Notes() {
  usePageTitle('Mes notes')
  // '' = année par défaut (celle en cours) ; sinon l'année choisie, demandée au serveur (anneeId)
  const [choix, setChoix] = useState('')
  const [annees, setAnnees] = useState([])
  const fetcher = useCallback((signal) => fetchMesNotes(choix || undefined, signal), [choix])
  const { data, loading, error, recharger } = useRessource(fetcher)

  // La liste des années vient de la première réponse (sans anneeId) et reste affichée ensuite
  useEffect(() => {
    if (!choix && data?.annees) setAnnees(data.annees.map(({ annee }) => annee))
  }, [data, choix])

  const affichee = data ? (data.annees.find(({ annee }) => annee.id === choix) ?? anneeCourante(data.annees)) : null
  const valeurSelect = choix || affichee?.annee.id || ''

  return (
    <DashboardLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold text-iuc-blue">Espace étudiant</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Mes notes</h1>
        <p className="mt-2 text-sm text-slate-500">
          Vos notes publiées et vos moyennes, par année académique.
        </p>
      </div>

      {annees.length > 0 && (
        <div className="mb-6 max-w-xs">
          <label className="block text-sm font-semibold text-slate-700">
            Année académique
            <select
              className={`${inputClass} mt-1.5`}
              onChange={(event) => setChoix(event.target.value)}
              value={valeurSelect}
            >
              {annees.map((annee) => (
                <option key={annee.id} value={annee.id}>
                  {annee.libelle}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <Etat
        error={error}
        loading={loading}
        onRetry={recharger}
        vide={
          data && data.annees.length === 0
            ? 'Aucune note à afficher : vous n’avez pas d’inscription pour cette période. Vos notes apparaîtront ici dès leur publication.'
            : ''
        }
      >
        {affichee && <Annee annee={affichee} />}
      </Etat>
    </DashboardLayout>
  )
}

export default Notes
