import PropTypes from 'prop-types'
import Field from '../ui/Field'
import { inputClass } from '../ui/styles'

const EMAIL = /^\S+@\S+\.\S+$/
const requis = (message) => (value) => value.trim() !== '' || message

const aujourdhui = () => new Date().toISOString().slice(0, 10)

function dateNaissanceValide(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())) {
    return 'La date de naissance n’est pas valide.'
  }
  if (value < '1900-01-01') return 'La date de naissance n’est pas valide.'
  if (value >= aujourdhui()) return 'La date de naissance doit être dans le passé.'
  return true
}

/** Étape 1 : identité et coordonnées du candidat. */
function IdentiteStep({ register, errors }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Nom" error={errors.nom}>
        <input
          autoComplete="family-name"
          className={inputClass}
          {...register('nom', {
            validate: requis('Le nom est requis.'),
            maxLength: { value: 100, message: 'Le nom est trop long (100 caractères maximum).' },
          })}
        />
      </Field>
      <Field label="Prénom" error={errors.prenom}>
        <input
          autoComplete="given-name"
          className={inputClass}
          {...register('prenom', {
            validate: requis('Le prénom est requis.'),
            maxLength: { value: 100, message: 'Le prénom est trop long (100 caractères maximum).' },
          })}
        />
      </Field>
      <Field label="Date de naissance" error={errors.dateNaissance}>
        <input
          autoComplete="bday"
          className={inputClass}
          max={aujourdhui()}
          type="date"
          {...register('dateNaissance', {
            required: 'La date de naissance est requise.',
            validate: dateNaissanceValide,
          })}
        />
      </Field>
      <Field label="Lieu de naissance" error={errors.lieuNaissance}>
        <input
          className={inputClass}
          {...register('lieuNaissance', { validate: requis('Le lieu de naissance est requis.') })}
        />
      </Field>
      <Field label="Nationalité" error={errors.nationalite}>
        <input
          className={inputClass}
          placeholder="Camerounaise"
          {...register('nationalite', { validate: requis('La nationalité est requise.') })}
        />
      </Field>
      <Field label="E-mail" error={errors.email}>
        <input
          autoComplete="email"
          className={inputClass}
          inputMode="email"
          type="email"
          {...register('email', {
            required: 'L’e-mail est requis.',
            pattern: { value: EMAIL, message: 'Saisissez une adresse e-mail valide.' },
            maxLength: { value: 254, message: 'L’adresse e-mail est trop longue.' },
          })}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Téléphone (facultatif)" error={errors.telephone}>
          <input
            autoComplete="tel"
            className={inputClass}
            inputMode="tel"
            placeholder="+237 6 00 00 00 00"
            type="tel"
            {...register('telephone', {
              validate: (value) =>
                value.trim() === '' ||
                /^\+?\d{8,15}$/.test(value.replace(/[\s.()-]/g, '')) ||
                'Le numéro de téléphone n’est pas valide (8 à 15 chiffres).',
            })}
          />
        </Field>
        <p className="mt-2 text-xs text-slate-400">
          L’adresse e-mail servira aussi à prouver votre identité lors de l’envoi de vos documents :
          saisissez-la avec soin.
        </p>
      </div>
    </div>
  )
}

IdentiteStep.propTypes = {
  register: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
}

export default IdentiteStep
