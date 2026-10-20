import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { ecoleAccent } from '../../utils/ecoleAccent'
import {
  cycleLabels,
  formatDuree,
  formatMontant,
  langueLabels,
} from '../../utils/catalogue'

function Info({ label, children }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-700">{children}</dd>
    </div>
  )
}

Info.propTypes = { label: PropTypes.string.isRequired, children: PropTypes.node }

/** Carte d'une filière dans le catalogue public. */
function FiliereCard({ filiere }) {
  const { ecole } = filiere
  const accent = ecoleAccent(ecole)
  const national = formatMontant(filiere.fraisCandidatureNational)
  const etranger = formatMontant(filiere.fraisCandidatureEtranger)
  const duree = formatDuree(filiere.dureeAnnees)

  return (
    <article
      className={`relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-iuc-blue/30 hover:shadow-md ${accent.border}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-iuc-blue/10 px-2.5 py-1 text-xs font-bold text-iuc-blue">
          {cycleLabels[filiere.cycle] ?? filiere.cycle}
        </span>
        {filiere.langue && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
            {langueLabels[filiere.langue] ?? filiere.langue}
          </span>
        )}
        {filiere.statutDonnees === 'A_CONFIRMER' && (
          <span
            className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200"
            title="Ces informations sont en cours de vérification"
          >
            À confirmer
          </span>
        )}
      </div>

      <h3 className="mt-3 text-lg font-bold leading-snug text-slate-900">
        <Link
          className="rounded after:absolute after:inset-0 hover:text-iuc-blue focus:outline-none focus-visible:ring-4 focus-visible:ring-iuc-blue/20"
          to={`/filieres/${filiere.id}`}
        >
          {filiere.nom}
        </Link>
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        {ecole.nom}
        {ecole.campus ? ` · Campus ${ecole.campus.nom}` : ''}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4">
        <Info label="Niveau d’entrée">{filiere.niveauEntree ?? 'À préciser'}</Info>
        <Info label="Durée">{duree ?? 'À préciser'}</Info>
        <Info label="Frais de candidature">
          {national || etranger ? (
            <>
              {national && <span className="block">{national} <span className="font-normal text-slate-400">(national)</span></span>}
              {etranger && <span className="block">{etranger} <span className="font-normal text-slate-400">(étranger)</span></span>}
            </>
          ) : (
            'À préciser'
          )}
        </Info>
      </dl>

      <span className="mt-auto pt-5 text-sm font-bold text-iuc-blue">Voir le détail →</span>
    </article>
  )
}

FiliereCard.propTypes = {
  filiere: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nom: PropTypes.string.isRequired,
    cycle: PropTypes.string.isRequired,
    langue: PropTypes.string,
    dureeAnnees: PropTypes.number,
    niveauEntree: PropTypes.string,
    fraisCandidatureNational: PropTypes.number,
    fraisCandidatureEtranger: PropTypes.number,
    statutDonnees: PropTypes.string,
    ecole: PropTypes.shape({
      nom: PropTypes.string.isRequired,
      campus: PropTypes.shape({ nom: PropTypes.string.isRequired }),
    }).isRequired,
  }).isRequired,
}

export default FiliereCard
