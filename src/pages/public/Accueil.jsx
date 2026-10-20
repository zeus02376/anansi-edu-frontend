import { Link } from 'react-router-dom'
import { usePageTitle } from '../../utils/usePageTitle'

const etapes = [
  {
    titre: 'Explorer',
    texte: 'Consultez les filières par école et par campus : niveau d’entrée, frais et pièces à fournir.',
    lien: { to: '/filieres', label: 'Voir les filières' },
  },
  {
    titre: 'Candidater',
    texte: 'Déposez votre dossier en ligne pour la filière de votre choix.',
    lien: { to: '/candidature', label: 'Déposer ma candidature' },
  },
  {
    titre: 'Suivre',
    texte: 'Retrouvez l’avancement de votre candidature avec votre numéro de dossier.',
    lien: { to: '/suivi', label: 'Suivre ma candidature' },
  },
]

function Accueil() {
  usePageTitle('')

  return (
    <>
      <section className="relative overflow-hidden bg-iuc-blue text-white">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-36 -left-24 h-96 w-96 rounded-full border border-white/10" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-iuc-gold">
            Institut Universitaire de la Côte
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Trouvez la formation qui vous correspond
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/80">
            IUC Campus réunit les écoles et les filières de l’Institut Universitaire de la Côte,
            de la découverte des formations à la candidature.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex justify-center rounded-xl bg-iuc-gold px-5 py-3 text-sm font-bold text-iuc-blue transition hover:bg-iuc-gold/85"
              to="/filieres"
            >
              Découvrir les filières
            </Link>
            <Link
              className="inline-flex justify-center rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              to="/candidature"
            >
              Candidater en ligne
            </Link>
          </div>
          <p className="mt-5 text-sm text-white/70">
            Déjà candidat ?{' '}
            <Link className="font-semibold text-white underline hover:text-iuc-gold" to="/suivi">
              Suivre ma candidature
            </Link>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <h2 className="text-2xl font-bold text-slate-900">Votre parcours, étape par étape</h2>
        <ol className="mt-8 grid gap-5 sm:grid-cols-3">
          {etapes.map((etape, index) => (
            <li
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              key={etape.titre}
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-iuc-gold text-sm font-black text-iuc-blue"
              >
                {index + 1}
              </span>
              <h3 className="mt-4 font-bold text-slate-900">{etape.titre}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{etape.texte}</p>
              <Link className="mt-4 inline-block text-sm font-bold text-iuc-blue hover:underline" to={etape.lien.to}>
                {etape.lien.label} →
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}

export default Accueil
