import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { dashboardByRole } from '../../utils/dashboard'

function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    clearError()
  }, [clearError])

  if (isAuthenticated && user) {
    return <Navigate to={dashboardByRole[user.role] ?? '/login'} replace />
  }

  const onSubmit = async ({ email, password }) => {
    try {
      const authenticatedUser = await login(email, password)
      navigate(dashboardByRole[authenticatedUser.role] ?? '/login', { replace: true })
    } catch {
      // The auth store exposes the request error to this form.
    }
  }

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[1fr_0.92fr]">
      <section className="relative hidden overflow-hidden bg-iuc-red px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-36 -left-24 h-96 w-96 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-iuc-green text-xl font-black text-white">
            I
          </div>
          <span className="text-xl font-extrabold tracking-[0.08em] text-white">
            IUC Campus
          </span>
        </div>
        <div className="relative max-w-xl py-14">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-white">
            Institut Universitaire de la Côte
          </p>
          <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
            IUC Campus
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/80">
            Plateforme de gestion académique
          </p>
        </div>
        <p className="relative text-sm text-white/80">
          Institut Universitaire de la Côte © 2025
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-12 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-iuc-red text-lg font-black text-white">
              I
            </div>
            <span className="text-lg font-extrabold tracking-[0.08em] text-iuc-red">
              IUC Campus
            </span>
          </div>
          <div className="mb-9">
            <p className="text-sm font-semibold text-iuc-red">Bienvenue à l’IUC</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-iuc-red">
              IUC Campus
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Plateforme de gestion académique
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nom@universite.cm"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-iuc-red focus:ring-4 focus:ring-iuc-red/10"
                {...register('email', {
                  required: 'Votre adresse e-mail est requise.',
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: 'Veuillez saisir une adresse e-mail valide.',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Votre mot de passe"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-iuc-red focus:ring-4 focus:ring-iuc-red/10"
                {...register('password', {
                  required: 'Votre mot de passe est requis.',
                })}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-iuc-red px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-iuc-red/15 transition hover:bg-iuc-red/90 focus:outline-none focus:ring-4 focus:ring-iuc-red/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {isLoading ? 'Connexion en cours…' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            Institut Universitaire de la Côte © 2025
          </p>
        </div>
      </section>
    </main>
  )
}

export default Login
