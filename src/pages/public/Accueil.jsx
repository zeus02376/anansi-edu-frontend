import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { presentationParCode } from '../../content/ecolesPresentation'
import { fetchEcoles } from '../../services/catalogue'
import { logoIuc, logoSeas } from '../../utils/logos'
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

const NOM_SEAS = 'SEAS — School of Engineering and Applied Sciences'

/** Bandeau d'identité : le site est celui de l'Institut Universitaire de la Côte. */
function BandeauIuc() {
  return (
    <section aria-label="Institut Universitaire de la Côte" className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-8">
        {logoIuc ? (
          <img alt="Logo IUC" className="h-12 w-auto max-w-[9rem] shrink-0 object-contain" src={logoIuc} />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-iuc-green text-xl font-black text-white"
          >
            I
          </span>
        )}
        <div>
          <p className="text-lg font-extrabold text-iuc-red">Institut Universitaire de la Côte</p>
          <p className="text-sm text-slate-500">Plusieurs écoles et campus, un seul site pour les découvrir.</p>
        </div>
      </div>
    </section>
  )
}

/**
 * Présentation de SEAS. Le lien vers sa page vient de GET /ecoles (code === 'SEAS') : si
 * l'appel échoue ou ne contient pas SEAS, le bloc reste affiché, sans lien actif.
 */
function BlocSeas({ ecoleId, chargee }) {
  const presentation = presentationParCode.SEAS
  const aConfirmer = presentation?.statutDonnees === 'A_CONFIRMER'

  return (
    <section aria-labelledby="seas-titre" className="bg-iuc-light">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 border-l-4 border-l-iuc-seas bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:gap-8 sm:p-8">
          {logoSeas ? (
            <img alt="Logo SEAS" className="h-16 w-auto max-w-[10rem] shrink-0 object-contain sm:h-20" src={logoSeas} />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-iuc-seas text-sm font-black tracking-wide text-white sm:h-20 sm:w-20"
            >
              SEAS
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">École à la une</p>
            <h2 className="mt-1 text-xl font-bold text-iuc-seas sm:text-2xl" id="seas-titre">
              {NOM_SEAS}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{presentation?.resume}</p>
            {aConfirmer && (
              <p className="mt-2 text-xs text-amber-800">
                Présentation en cours de vérification auprès de l’établissement.
              </p>
            )}
          </div>
          <div className="shrink-0">
            {ecoleId ? (
              <Link
                className="inline-flex w-full justify-center rounded-xl bg-iuc-green px-5 py-3 text-sm font-bold text-white transition hover:bg-iuc-green/85 focus:outline-none focus-visible:ring-4 focus-visible:ring-iuc-green/30 sm:w-auto"
                to={`/ecoles/${ecoleId}`}
              >
                Découvrir SEAS
              </Link>
            ) : (
              <>
                <button
                  aria-disabled="true"
                  className="inline-flex w-full cursor-not-allowed justify-center rounded-xl bg-iuc-green px-5 py-3 text-sm font-bold text-white opacity-50 sm:w-auto"
                  disabled
                  type="button"
                >
                  Découvrir SEAS
                </button>
                {chargee && (
                  <p className="mt-2 text-xs text-slate-500">La fiche détaillée est momentanément indisponible.</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

BlocSeas.propTypes = {
  ecoleId: PropTypes.string,
  chargee: PropTypes.bool.isRequired,
}

function Accueil() {
  usePageTitle('')
  // Identifiant de l'école SEAS, jamais écrit en dur : retrouvé par son code
  const [seas, setSeas] = useState({ id: null, chargee: false })

  useEffect(() => {
    const controller = new AbortController()
    fetchEcoles(controller.signal)
      .then((ecoles) => {
        const ecole = Array.isArray(ecoles) ? ecoles.find((e) => e.code === 'SEAS') : null
        setSeas({ id: ecole?.id ?? null, chargee: true })
      })
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED') setSeas({ id: null, chargee: true })
      })
    return () => controller.abort()
  }, [])

  return (
    <>
      <BandeauIuc />
      <BlocSeas chargee={seas.chargee} ecoleId={seas.id} />

      <section className="relative overflow-hidden bg-iuc-red text-white">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-36 -left-24 h-96 w-96 rounded-full border border-white/10" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white">
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
              className="inline-flex justify-center rounded-xl bg-iuc-green px-5 py-3 text-sm font-bold text-white transition hover:bg-iuc-green/85"
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
            <Link className="font-semibold text-white underline hover:text-white/80" to="/suivi">
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
                className="flex h-9 w-9 items-center justify-center rounded-full bg-iuc-green text-sm font-black text-white"
              >
                {index + 1}
              </span>
              <h3 className="mt-4 font-bold text-slate-900">{etape.titre}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{etape.texte}</p>
              <Link className="mt-4 inline-block text-sm font-bold text-iuc-red hover:underline" to={etape.lien.to}>
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
