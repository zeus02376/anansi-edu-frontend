import PropTypes from 'prop-types'
import { cycleLabels, formatMontant, langueLabels } from '../../utils/catalogue'
import { formatDate } from '../../utils/format'

function Bloc({ titre, onEdit, children }) {
  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-iuc-blue">{titre}</h3>
        <button className="text-sm font-semibold text-slate-500 underline hover:text-iuc-blue" onClick={onEdit} type="button">
          Modifier
        </button>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">{children}</dl>
    </section>
  )
}

Bloc.propTypes = { titre: PropTypes.string.isRequired, onEdit: PropTypes.func.isRequired, children: PropTypes.node }

function Ligne({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-slate-800">{children || '—'}</dd>
    </div>
  )
}

Ligne.propTypes = { label: PropTypes.string.isRequired, children: PropTypes.node }

/** Étape 3 : relecture avant l'envoi, et certification de l'exactitude des informations. */
function RecapStep({ values, filiere, annee, onEdit, register, errors }) {
  const national = formatMontant(filiere?.fraisCandidatureNational)
  const etranger = formatMontant(filiere?.fraisCandidatureEtranger)

  return (
    <div className="space-y-4">
      <Bloc onEdit={() => onEdit(0)} titre="Identité">
        <Ligne label="Nom">{values.nom?.trim()}</Ligne>
        <Ligne label="Prénom">{values.prenom?.trim()}</Ligne>
        <Ligne label="Date de naissance">{formatDate(values.dateNaissance)}</Ligne>
        <Ligne label="Lieu de naissance">{values.lieuNaissance?.trim()}</Ligne>
        <Ligne label="Nationalité">{values.nationalite?.trim()}</Ligne>
        <Ligne label="E-mail">{values.email?.trim()}</Ligne>
        <Ligne label="Téléphone">{values.telephone?.trim()}</Ligne>
      </Bloc>

      <Bloc onEdit={() => onEdit(1)} titre="Formation">
        <Ligne label="Filière">{filiere?.nom}</Ligne>
        <Ligne label="Diplôme">{filiere && (cycleLabels[filiere.cycle] ?? filiere.cycle)}</Ligne>
        <Ligne label="École">{filiere?.ecole.nom}</Ligne>
        <Ligne label="Campus">{filiere?.ecole.campus?.nom}</Ligne>
        <Ligne label="Langue">{filiere?.langue && (langueLabels[filiere.langue] ?? filiere.langue)}</Ligne>
        <Ligne label="Année académique">{annee?.libelle}</Ligne>
        {(national || etranger) && (
          <Ligne label="Frais de candidature">
            {[national && `${national} (national)`, etranger && `${etranger} (étranger)`].filter(Boolean).join(' · ')}
          </Ligne>
        )}
      </Bloc>

      <div>
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            className="mt-0.5 h-4 w-4 accent-iuc-blue"
            type="checkbox"
            {...register('certifie', { required: 'Vous devez certifier l’exactitude de ces informations.' })}
          />
          <span>Je certifie que les informations ci-dessus sont exactes.</span>
        </label>
        {errors.certifie && <p className="mt-1.5 text-xs text-red-600">{errors.certifie.message}</p>}
      </div>
    </div>
  )
}

RecapStep.propTypes = {
  values: PropTypes.object.isRequired,
  filiere: PropTypes.object,
  annee: PropTypes.object,
  onEdit: PropTypes.func.isRequired,
  register: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
}

export default RecapStep
