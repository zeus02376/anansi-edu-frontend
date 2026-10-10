import { useState } from 'react'
import { useForm } from 'react-hook-form'
import DashboardLayout from '../../components/DashboardLayout'
import api from '../../services/api'

const roleLabels = {
  SCOLARITE: 'Scolarité',
  ENSEIGNANT: 'Enseignant',
}

function getErrorMessage(error, fallback) {
  const message = error.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  return message || error.message || fallback
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-iuc-blue focus:ring-4 focus:ring-iuc-blue/10'

function Comptes() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState([])
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { role: 'SCOLARITE' } })

  const onSubmit = async (values) => {
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api.post('/auth/create-staff', {
        nom: values.nom.trim(),
        prenom: values.prenom.trim(),
        email: values.email.trim(),
        telephone: values.telephone?.trim() || undefined,
        motDePasse: values.motDePasse,
        role: values.role,
      })
      setCreated((current) => [data, ...current])
      reset({ role: values.role })
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'La création du compte a échoué.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-7">
        <p className="text-sm font-semibold text-iuc-blue">Administration</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Gestion des comptes
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Créez les comptes du personnel de scolarité et des enseignants.
        </p>
      </div>

      {created.length > 0 && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <p className="font-semibold">Compte créé : {created[0].email}</p>
          <p className="mt-1">
            Communiquez le mot de passe choisi à {created[0].prenom} {created[0].nom} par
            un canal sûr.
          </p>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-5 text-lg font-bold text-iuc-blue">Nouveau compte</h2>
        <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              <span className="mb-1.5 block">Nom</span>
              <input
                className={inputClass}
                {...register('nom', { required: 'Le nom est requis.' })}
              />
              {errors.nom && <p className="mt-1 text-xs text-red-600">{errors.nom.message}</p>}
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              <span className="mb-1.5 block">Prénom</span>
              <input
                className={inputClass}
                {...register('prenom', { required: 'Le prénom est requis.' })}
              />
              {errors.prenom && (
                <p className="mt-1 text-xs text-red-600">{errors.prenom.message}</p>
              )}
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              <span className="mb-1.5 block">E-mail</span>
              <input
                className={inputClass}
                type="email"
                autoComplete="off"
                {...register('email', {
                  required: 'L’e-mail est requis.',
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: 'Saisissez une adresse e-mail valide.',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              <span className="mb-1.5 block">Téléphone (optionnel)</span>
              <input className={inputClass} type="tel" {...register('telephone')} />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              <span className="mb-1.5 block">Rôle</span>
              <select className={inputClass} {...register('role', { required: true })}>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              <span className="mb-1.5 block">Mot de passe</span>
              <input
                className={inputClass}
                type="password"
                autoComplete="new-password"
                {...register('motDePasse', {
                  required: 'Le mot de passe est requis.',
                  minLength: { value: 8, message: '8 caractères minimum.' },
                })}
              />
              {errors.motDePasse && (
                <p className="mt-1 text-xs text-red-600">{errors.motDePasse.message}</p>
              )}
            </label>
          </div>
          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              className="w-full rounded-xl bg-iuc-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-iuc-blue/90 disabled:opacity-60 sm:w-auto"
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'Création…' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </section>

      {created.length > 0 && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-3 text-sm font-bold text-slate-800">Créés pendant cette session</h2>
          <ul className="divide-y divide-slate-100">
            {created.map((account) => (
              <li
                className="flex flex-col gap-1 py-2.5 text-sm sm:flex-row sm:justify-between"
                key={account.id}
              >
                <span className="font-medium text-slate-800">
                  {account.prenom} {account.nom} — {account.email}
                </span>
                <span className="text-slate-500">{roleLabels[account.role] ?? account.role}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </DashboardLayout>
  )
}

export default Comptes
