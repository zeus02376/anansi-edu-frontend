import { Link } from 'react-router-dom'

function Accueil() {
  return (
    <section className="relative overflow-hidden bg-iuc-blue text-white">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
      <div className="absolute -bottom-36 -left-24 h-96 w-96 rounded-full border border-white/10" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-iuc-gold">
          Institut Universitaire de la Côte
        </p>
        <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">IUC Campus</h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-white/80">
          Plateforme de gestion académique.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex rounded-xl bg-iuc-gold px-5 py-3 text-sm font-bold text-iuc-blue transition hover:bg-iuc-gold/85"
        >
          Se connecter
        </Link>
      </div>
    </section>
  )
}

export default Accueil
