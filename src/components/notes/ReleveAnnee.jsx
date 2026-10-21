import PropTypes from 'prop-types'
import { Carte } from '../ui/Etat'
import { etatNoteLabels, formatNombre, typeEvaluationLabels } from '../../utils/notes'

/**
 * Relevé d'une année (moyenne générale, matières dépliables, évaluations) : commun à la
 * page de l'étudiant et au relevé du personnel. `provisoire` force la mention (le relevé du
 * personnel ne la porte pas dans sa réponse) ; `commentaires` affiche le commentaire des notes.
 */
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

function Matiere({ matiere, commentaires }) {
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
          <span className="rounded-lg bg-iuc-red/10 px-2.5 py-1 font-bold text-iuc-red">
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
                {commentaires && evaluation.note?.commentaire && (
                  <span className="w-full text-xs italic text-slate-500">« {evaluation.note.commentaire} »</span>
                )}
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
  commentaires: PropTypes.bool,
}

function ReleveAnnee({ annee, provisoire = annee.provisoire, commentaires = false, personnel = false }) {
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
            <p className="text-3xl font-black text-iuc-red" data-testid="moyenne-generale">
              {formatNombre(annee.moyenneGenerale)}
              <span className="text-lg font-semibold text-slate-400"> / 20</span>
            </p>
          )}
          {provisoire && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
              Provisoire
            </span>
          )}
        </div>
        {provisoire && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="note">
            Moyenne <strong>provisoire</strong> : calculée sur les évaluations publiées à ce jour, elle peut encore
            évoluer. Ce n’est pas un résultat définitif.
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          {annee.niveau?.nom} · année {annee.annee?.libelle}
        </p>
      </Carte>

      <Carte titre={personnel ? "Matières" : "Mes matières"}>
        {annee.matieres.length === 0 ? (
          <p className="text-sm text-slate-500">{personnel
              ? "Aucune matière n’est rattachée au niveau de cet étudiant pour cette année."
              : "Aucune matière n’est encore rattachée à votre niveau pour cette année."}</p>
        ) : (
          <div className="space-y-3">
            {aucuneEvaluation && (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                {personnel
                  ? "Aucune évaluation n’a encore été publiée pour cette année : les notes apparaîtront ici dès leur publication."
                  : "Aucune évaluation n’a encore été publiée pour cette année : vos notes apparaîtront ici dès leur publication."}
              </p>
            )}
            {annee.matieres.map((matiere) => (
              <Matiere commentaires={commentaires} key={matiere.id} matiere={matiere} />
            ))}
          </div>
        )}
      </Carte>
    </div>
  )
}

ReleveAnnee.propTypes = {
  annee: PropTypes.shape({
    provisoire: PropTypes.bool,
    moyenneGenerale: PropTypes.number,
    niveau: PropTypes.object,
    annee: PropTypes.object,
    matieres: PropTypes.array.isRequired,
  }).isRequired,
  provisoire: PropTypes.bool,
  commentaires: PropTypes.bool,
  personnel: PropTypes.bool,
}

export default ReleveAnnee
