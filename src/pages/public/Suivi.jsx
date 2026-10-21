import { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import DocumentsUploader from '../../components/candidature/DocumentsUploader'
import Field from '../../components/ui/Field'
import StatusBadge from '../../components/ui/StatusBadge'
import { inputClass } from '../../components/ui/styles'
import { fetchSuivi } from '../../services/candidature'
import { statusMessages, statutsModifiables } from '../../utils/candidatureStatus'
import { lireDossier } from '../../utils/candidatureSession'
import { getErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'
import { usePageTitle } from '../../utils/usePageTitle'

// Format généré par le serveur : CAND-<année>-<8 caractères hexadécimaux>
const FORMAT_NUMERO = /^CAND-\d{4}-[0-9A-F]{8}$/
const FORMAT_EMAIL = /^\S+@\S+\.\S+$/
const normaliser = (valeur) => valeur.trim().toUpperCase()

function messageErreur(error) {
  const status = error.response?.status
  if (status === 404) {
    return 'Aucune candidature ne correspond à ce numéro de dossier. Vérifiez le numéro saisi (exemple : CAND-2026-1A2B3C4D).'
  }
  if (status === 429) {
    return 'Trop de consultations en peu de temps. Patientez environ une minute puis réessayez.'
  }
  return getErrorMessage(error, 'Impossible de consulter le dossier. Veuillez réessayer.')
}

function Info({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-800">{children}</dd>
    </div>
  )
}

Info.propTypes = { label: PropTypes.string.isRequired, children: PropTypes.node }

/** Envoi de documents depuis le suivi : l'e-mail de la candidature sert de preuve. */
function DepotDocuments({ suivi }) {
  // Le dossier déposé dans cet onglet fournit déjà l'e-mail
  const [email, setEmail] = useState(() => {
    const dossier = lireDossier()
    return dossier?.numeroDossier === suivi.numeroDossier ? dossier.email : ''
  })
  const [valide, setValide] = useState(Boolean(email))
  const [erreur, setErreur] = useState('')

  const confirmer = (event) => {
    event.preventDefault()
    if (!FORMAT_EMAIL.test(email.trim())) {
      setErreur('Saisissez l’adresse e-mail utilisée pour la candidature.')
      return
    }
    setErreur('')
    setEmail(email.trim())
    setValide(true)
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-iuc-red">Envoyer des documents</h2>
      {!valide ? (
        <form className="mt-3" noValidate onSubmit={confirmer}>
          <p className="text-sm text-slate-500">
            Pour des raisons de sécurité, indiquez l’adresse e-mail utilisée lors du dépôt de la candidature.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex-1">
              <label className="sr-only" htmlFor="email-candidature">
                E-mail de la candidature
              </label>
              <input
                autoComplete="email"
                className={inputClass}
                id="email-candidature"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@exemple.com"
                type="email"
                value={email}
              />
              {erreur && <p className="mt-1 text-xs text-red-600">{erreur}</p>}
            </div>
            <button
              className="rounded-xl bg-iuc-red px-5 py-2.5 text-sm font-bold text-white hover:bg-iuc-red/90"
              type="submit"
            >
              Continuer
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-3">
          <p className="mb-4 text-sm text-slate-500">
            Les documents que vous envoyez ici sont transmis à la scolarité ; la liste des documents déjà reçus
            n’est pas affichée sur cette page.{' '}
            <button
              className="font-semibold text-iuc-red underline"
              onClick={() => setValide(false)}
              type="button"
            >
              Changer d’e-mail
            </button>
          </p>
          <DocumentsUploader
            candidatureId={suivi.id}
            email={email}
            numeroDossier={suivi.numeroDossier}
          />
        </div>
      )}
    </section>
  )
}

DepotDocuments.propTypes = {
  suivi: PropTypes.shape({ id: PropTypes.string.isRequired, numeroDossier: PropTypes.string.isRequired }).isRequired,
}

function Suivi() {
  usePageTitle('Suivi de candidature')
  const [params, setParams] = useSearchParams()
  const [numeroInitial] = useState(() => params.get('numero') ?? '')
  const [etat, setEtat] = useState({ statut: 'repos' })
  const controller = useRef(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { numero: numeroInitial } })

  const consulter = useCallback(async (numero) => {
    controller.current?.abort()
    controller.current = new AbortController()
    setEtat({ statut: 'chargement' })
    try {
      const data = await fetchSuivi(numero, controller.current.signal)
      setEtat({ statut: 'ok', data })
    } catch (error) {
      if (error.code === 'ERR_CANCELED') return
      setEtat({ statut: 'erreur', message: messageErreur(error) })
    }
  }, [])

  // Lien reçu avec ?numero=… : consultation immédiate
  useEffect(() => {
    if (FORMAT_NUMERO.test(normaliser(numeroInitial))) consulter(normaliser(numeroInitial))
    return () => controller.current?.abort()
  }, [numeroInitial, consulter])

  const onSubmit = handleSubmit(({ numero }) => {
    const valeur = normaliser(numero)
    setParams({ numero: valeur }, { replace: true })
    return consulter(valeur)
  })

  const suivi = etat.statut === 'ok' ? etat.data : null
  const enCours = etat.statut === 'chargement'

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <p className="text-sm font-semibold text-iuc-red">Suivi</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Suivre ma candidature</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Saisissez le numéro de dossier remis lors du dépôt de votre candidature.
      </p>

      <form
        className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start"
        noValidate
        onSubmit={onSubmit}
      >
        <div className="flex-1">
          <Field error={errors.numero} label="Numéro de dossier">
            <input
              autoCapitalize="characters"
              autoComplete="off"
              className={`${inputClass} font-mono uppercase tracking-wider`}
              placeholder="CAND-2026-1A2B3C4D"
              spellCheck={false}
              {...register('numero', {
                required: 'Saisissez votre numéro de dossier.',
                validate: (valeur) =>
                  FORMAT_NUMERO.test(normaliser(valeur)) ||
                  'Ce numéro n’a pas le bon format (exemple : CAND-2026-1A2B3C4D).',
              })}
            />
          </Field>
        </div>
        <button
          className="rounded-xl bg-iuc-red px-6 py-2.5 text-sm font-bold text-white transition hover:bg-iuc-red/90 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-[1.85rem]"
          disabled={enCours}
          type="submit"
        >
          {enCours ? 'Recherche…' : 'Consulter'}
        </button>
      </form>

      {etat.statut === 'erreur' && (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {etat.message}
        </p>
      )}

      {suivi && (
        <>
          <section
            aria-live="polite"
            className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-iuc-red">Dossier {suivi.numeroDossier}</h2>
              <StatusBadge statut={suivi.statut} />
            </div>
            <p className="mt-3 text-sm text-slate-600">{statusMessages[suivi.statut]}</p>
            <dl className="mt-5 grid gap-x-6 gap-y-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
              <Info label="Candidat">
                {suivi.prenom} {suivi.nom}
              </Info>
              <Info label="Déposé le">{formatDate(suivi.dateDepot)}</Info>
              <Info label="Filière">
                {suivi.filiere.nom} <span className="font-normal text-slate-400">({suivi.filiere.code})</span>
              </Info>
              <Info label="École">{suivi.ecole}</Info>
              <Info label="Année académique">{suivi.anneeAcademique}</Info>
            </dl>
          </section>

          {statutsModifiables.includes(suivi.statut) ? (
            <DepotDocuments key={suivi.numeroDossier} suivi={suivi} />
          ) : (
            <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              La décision a été rendue : l’envoi de nouveaux documents n’est plus possible.
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default Suivi
