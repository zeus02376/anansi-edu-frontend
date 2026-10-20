import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { inputClass } from '../ui/styles'
import {
  cycleLabels,
  formatDuree,
  formatMontant,
  langueLabels,
} from '../../utils/catalogue'
import { formatDate } from '../../utils/format'

const unique = (items) => [...new Map(items.map((item) => [item.id, item])).values()]

/**
 * Étape 2 : choix de la filière (campus → école → filière, avec recherche) et,
 * si plusieurs années sont ouvertes, de l'année académique.
 */
function FormationStep({ catalogue, filiereId, onSelect, anneeId, onSelectAnnee, errors }) {
  const { filieres, annees } = catalogue
  const [campusId, setCampusId] = useState('')
  const [ecoleId, setEcoleId] = useState('')
  const [recherche, setRecherche] = useState('')

  const campus = useMemo(
    () => unique(filieres.map((f) => f.ecole.campus).filter(Boolean)).sort((a, b) => a.nom.localeCompare(b.nom)),
    [filieres],
  )
  const ecoles = useMemo(
    () =>
      unique(filieres.map((f) => f.ecole))
        .filter((ecole) => !campusId || ecole.campusId === campusId)
        .sort((a, b) => a.nom.localeCompare(b.nom)),
    [filieres, campusId],
  )
  const visibles = useMemo(() => {
    const mot = recherche.trim().toLocaleLowerCase('fr')
    return filieres.filter(
      (f) =>
        (!campusId || f.ecole.campusId === campusId) &&
        (!ecoleId || f.ecoleId === ecoleId) &&
        (!mot || `${f.nom} ${f.code}`.toLocaleLowerCase('fr').includes(mot)),
    )
  }, [filieres, campusId, ecoleId, recherche])
  const choisie = filieres.find((f) => f.id === filiereId)

  const changerCampus = (value) => {
    setCampusId(value)
    // Une école d'un autre campus ne peut plus rester sélectionnée
    if (ecoleId && !filieres.some((f) => f.ecoleId === ecoleId && (!value || f.ecole.campusId === value))) {
      setEcoleId('')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">
          Filtrez par campus ou par école, ou cherchez un nom de formation. Vous pouvez aussi{' '}
          <Link className="font-semibold text-iuc-blue underline" rel="noreferrer" target="_blank" to="/filieres">
            parcourir le catalogue détaillé
          </Link>
          .
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block text-xs font-semibold text-slate-500">
            Campus
            <select className={`${inputClass} mt-1`} onChange={(e) => changerCampus(e.target.value)} value={campusId}>
              <option value="">Tous</option>
              {campus.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-500">
            École
            <select className={`${inputClass} mt-1`} onChange={(e) => setEcoleId(e.target.value)} value={ecoleId}>
              <option value="">Toutes</option>
              {ecoles.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-500">
            Rechercher
            <input
              className={`${inputClass} mt-1`}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Nom de la filière"
              type="search"
              value={recherche}
            />
          </label>
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-700">Filière souhaitée</legend>
        {visibles.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            Aucune filière ne correspond à ces filtres.
          </p>
        ) : (
          <div className="mt-3 space-y-2" role="radiogroup">
            {visibles.map((f) => (
              <label
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-iuc-blue/40 has-[:checked]:border-iuc-blue has-[:checked]:bg-iuc-blue/5 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-iuc-blue/20"
                key={f.id}
              >
                <input
                  checked={f.id === filiereId}
                  className="mt-1 h-4 w-4 accent-iuc-blue"
                  name="filiere"
                  onChange={() => onSelect(f)}
                  type="radio"
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-900">{f.nom}</span>
                  <span className="mt-0.5 block text-sm text-slate-500">
                    {f.ecole.nom}
                    {f.ecole.campus ? ` · Campus ${f.ecole.campus.nom}` : ''}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-iuc-blue/10 px-2 py-0.5 text-iuc-blue">
                      {cycleLabels[f.cycle] ?? f.cycle}
                    </span>
                    {f.langue && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                        {langueLabels[f.langue] ?? f.langue}
                      </span>
                    )}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
        {errors.filiereId && <p className="mt-2 text-xs text-red-600">{errors.filiereId.message}</p>}
      </fieldset>

      {choisie && (
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">À savoir sur cette filière</p>
          <ul className="mt-2 space-y-1">
            <li>Niveau d’entrée : {choisie.niveauEntree ?? 'à préciser'}</li>
            <li>Durée : {formatDuree(choisie.dureeAnnees) ?? 'à préciser'}</li>
            <li>
              Frais de candidature :{' '}
              {[
                formatMontant(choisie.fraisCandidatureNational) && `${formatMontant(choisie.fraisCandidatureNational)} (national)`,
                formatMontant(choisie.fraisCandidatureEtranger) && `${formatMontant(choisie.fraisCandidatureEtranger)} (étranger)`,
              ]
                .filter(Boolean)
                .join(' · ') || 'à préciser'}
            </li>
            {choisie.piecesRequises?.length > 0 && <li>Pièces à fournir : {choisie.piecesRequises.join(', ')}</li>}
          </ul>
          {choisie.statutDonnees === 'A_CONFIRMER' && (
            <p className="mt-2 text-xs text-amber-800">Ces informations sont en cours de vérification.</p>
          )}
        </div>
      )}

      <div>
        {annees.length > 1 ? (
          <label className="block text-sm font-semibold text-slate-700">
            Année académique
            <select
              className={`${inputClass} mt-1.5 sm:max-w-xs`}
              onChange={(e) => onSelectAnnee(e.target.value)}
              value={anneeId}
            >
              <option value="">Sélectionner une année</option>
              {annees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.libelle} (dès le {formatDate(a.dateDebut)})
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-sm text-slate-600">
            Année académique : <span className="font-semibold text-slate-900">{annees[0]?.libelle}</span>
          </p>
        )}
        {errors.anneeAcademiqueId && (
          <p className="mt-2 text-xs text-red-600">{errors.anneeAcademiqueId.message}</p>
        )}
      </div>
    </div>
  )
}

FormationStep.propTypes = {
  catalogue: PropTypes.shape({
    filieres: PropTypes.array.isRequired,
    annees: PropTypes.array.isRequired,
  }).isRequired,
  filiereId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  anneeId: PropTypes.string,
  onSelectAnnee: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
}

export default FormationStep
