import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MessagePage, SqueletteDetail } from '../../components/public/EtatPage'
import FiliereCard from '../../components/public/FiliereCard'
import { presentationParCode } from '../../content/ecolesPresentation'
import { fetchEcole, fetchToutesLesFilieres } from '../../services/catalogue'
import { ecoleAccent } from '../../utils/ecoleAccent'
import { getErrorMessage } from '../../utils/errors'
import { usePageTitle } from '../../utils/usePageTitle'

/** Présentation d'une école : son texte, son campus et toutes ses filières. */
function EcolePresentation() {
  const { id } = useParams()
  const [ecole, setEcole] = useState(null)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  // Les filières se chargent à part : leur échec n'empêche pas d'afficher l'école
  const [filieres, setFilieres] = useState({ statut: 'chargement', liste: [], message: '' })
  const [attemptFilieres, setAttemptFilieres] = useState(0)

  usePageTitle(ecole?.nom ?? 'École')

  useEffect(() => {
    const controller = new AbortController()
    setEcole(null)
    setError(null)
    fetchEcole(id, controller.signal)
      .then(setEcole)
      .catch((requestError) => {
        if (requestError.code === 'ERR_CANCELED') return
        setError({
          notFound: [400, 404].includes(requestError.response?.status),
          message: getErrorMessage(requestError, 'Impossible de charger cette école.'),
        })
      })
    return () => controller.abort()
  }, [id, attempt])

  useEffect(() => {
    const controller = new AbortController()
    setFilieres({ statut: 'chargement', liste: [], message: '' })
    fetchToutesLesFilieres(controller.signal)
      .then((liste) => setFilieres({ statut: 'pret', liste, message: '' }))
      .catch((requestError) => {
        if (requestError.code === 'ERR_CANCELED') return
        setFilieres({
          statut: 'erreur',
          liste: [],
          message: getErrorMessage(requestError, 'Impossible de charger les filières.'),
        })
      })
    return () => controller.abort()
  }, [id, attemptFilieres])

  // Filtrées côté client, comme le catalogue : l'API publique n'a pas de filtre par école
  const filieresDeLEcole = useMemo(
    () => (ecole ? filieres.liste.filter((filiere) => filiere.ecoleId === ecole.id) : []),
    [filieres.liste, ecole],
  )

  if (error?.notFound) {
    return (
      <MessagePage title="École introuvable">
        Cette école n’existe pas ou n’est plus présentée.
      </MessagePage>
    )
  }
  if (error) {
    return (
      <MessagePage title="Chargement impossible">
        <p role="alert">{error.message}</p>
        <button
          className="mt-3 font-bold text-iuc-blue underline"
          onClick={() => setAttempt((count) => count + 1)}
          type="button"
        >
          Réessayer
        </button>
      </MessagePage>
    )
  }
  if (!ecole) return <SqueletteDetail label="Chargement de l’école…" />

  const accent = ecoleAccent(ecole)
  const presentation = presentationParCode[ecole.code]

  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
          <nav aria-label="Fil d’Ariane" className="text-sm text-slate-400">
            <Link className="hover:text-iuc-blue" to="/filieres">
              Filières
            </Link>
            <span aria-hidden="true"> › </span>
            <span className="text-slate-600">{ecole.nom}</span>
          </nav>
          <p className="mt-4 text-sm font-semibold text-iuc-blue">École</p>
          <h1
            className={`mt-2 text-3xl font-bold leading-tight sm:text-4xl ${
              accent.text || 'text-slate-900'
            } ${accent.border ? `pl-4 ${accent.border}` : ''}`}
          >
            {ecole.nom}
          </h1>
          {ecole.campus && (
            <p className="mt-3 text-slate-500">
              Campus {ecole.campus.nom}
              {ecole.campus.adresse ? ` — ${ecole.campus.adresse}` : ''}
            </p>
          )}
          {ecole.description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{ecole.description}</p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-8">
        <section aria-labelledby="presentation-titre" className="space-y-4">
          {presentation?.statutDonnees === 'A_CONFIRMER' && (
            <p
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
              role="note"
            >
              Cette présentation est en cours de vérification auprès de l’établissement et peut
              évoluer.
            </p>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-iuc-blue" id="presentation-titre">
              Présentation
            </h2>
            {presentation?.descriptionLongue ? (
              <p className="mt-3 text-sm leading-7 text-slate-700">{presentation.descriptionLongue}</p>
            ) : (
              <p className="mt-3 text-sm text-slate-400">Présentation en cours de rédaction.</p>
            )}
          </div>
        </section>

        <section aria-labelledby="filieres-titre">
          <h2 className="text-lg font-bold text-iuc-blue" id="filieres-titre">
            Les filières de l’école
          </h2>
          {filieres.statut === 'chargement' ? (
            <p className="mt-3 text-sm text-slate-500" role="status">
              Chargement des filières…
            </p>
          ) : filieres.statut === 'erreur' ? (
            <div
              className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
              role="alert"
            >
              <span>{filieres.message}</span>
              <button
                className="shrink-0 font-bold underline"
                onClick={() => setAttemptFilieres((count) => count + 1)}
                type="button"
              >
                Réessayer
              </button>
            </div>
          ) : filieresDeLEcole.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Aucune filière n’est proposée pour cette école pour le moment.
            </p>
          ) : (
            <>
              <p aria-live="polite" className="mt-2 text-sm text-slate-500">
                {filieresDeLEcole.length} filière{filieresDeLEcole.length > 1 ? 's' : ''}
              </p>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filieresDeLEcole.map((filiere) => (
                  <FiliereCard filiere={filiere} key={filiere.id} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  )
}

export default EcolePresentation
