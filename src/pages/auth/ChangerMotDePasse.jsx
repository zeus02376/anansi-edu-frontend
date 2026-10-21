import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuthStore } from '../../stores/authStore'
import { dashboardByRole } from '../../utils/dashboard'

function getErrorMessage(error, fallback) {
  const message = error.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  return message || error.message || fallback
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-iuc-red focus:ring-4 focus:ring-iuc-red/10'

function ChangerMotDePasse() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const changePassword = useAuthStore((state) => state.changePassword)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const mustChange = Boolean(user?.doitChangerMotDePasse)
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm()

  const onSubmit = async ({ motDePasseActuel, nouveauMotDePasse }) => {
    setSubmitting(true)
    setError('')
    setSuccess(false)
    try {
      await changePassword(motDePasseActuel, nouveauMotDePasse)
      reset()
      if (mustChange) {
        navigate(dashboardByRole[user.role] ?? '/login', { replace: true })
      } else {
        setSuccess(true)
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Le mot de passe n’a pas pu être modifié.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-7">
        <p className="text-sm font-semibold text-iuc-red">Mon compte</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Changer mon mot de passe
        </h1>
      </div>

      {mustChange && (
        <div
          role="alert"
          className="mb-5 max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          <p className="font-semibold">Première connexion</p>
          <p className="mt-1">
            Vous utilisez un mot de passe temporaire. Choisissez votre propre mot de passe
            pour accéder à votre espace.
          </p>
        </div>
      )}
      {success && (
        <div
          role="status"
          className="mb-5 max-w-lg rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"
        >
          Votre mot de passe a été modifié.
        </div>
      )}

      <section className="max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
          <label className="block text-sm font-semibold text-slate-700">
            <span className="mb-1.5 block">
              {mustChange ? 'Mot de passe temporaire' : 'Mot de passe actuel'}
            </span>
            <input
              className={inputClass}
              type="password"
              autoComplete="current-password"
              {...register('motDePasseActuel', { required: 'Ce champ est requis.' })}
            />
            {errors.motDePasseActuel && (
              <p className="mt-1 text-xs text-red-600">{errors.motDePasseActuel.message}</p>
            )}
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            <span className="mb-1.5 block">Nouveau mot de passe</span>
            <input
              className={inputClass}
              type="password"
              autoComplete="new-password"
              {...register('nouveauMotDePasse', {
                required: 'Ce champ est requis.',
                minLength: { value: 8, message: '8 caractères minimum.' },
                validate: (value) =>
                  value !== getValues('motDePasseActuel') ||
                  'Le nouveau mot de passe doit être différent de l’actuel.',
              })}
            />
            {errors.nouveauMotDePasse && (
              <p className="mt-1 text-xs text-red-600">{errors.nouveauMotDePasse.message}</p>
            )}
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            <span className="mb-1.5 block">Confirmer le nouveau mot de passe</span>
            <input
              className={inputClass}
              type="password"
              autoComplete="new-password"
              {...register('confirmation', {
                required: 'Ce champ est requis.',
                validate: (value) =>
                  value === getValues('nouveauMotDePasse') ||
                  'Les mots de passe ne correspondent pas.',
              })}
            />
            {errors.confirmation && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmation.message}</p>
            )}
          </label>
          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <button
            className="w-full rounded-xl bg-iuc-red px-4 py-2.5 text-sm font-bold text-white hover:bg-iuc-red/90 disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Enregistrement…' : 'Changer le mot de passe'}
          </button>
        </form>
      </section>
    </DashboardLayout>
  )
}

export default ChangerMotDePasse
