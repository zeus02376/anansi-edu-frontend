import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import Confirmation from '../../components/candidature/Confirmation'
import FormationStep from '../../components/candidature/FormationStep'
import IdentiteStep from '../../components/candidature/IdentiteStep'
import RecapStep from '../../components/candidature/RecapStep'
import StepIndicator from '../../components/candidature/StepIndicator'
import { creerCandidature, fetchAnneesOuvertes } from '../../services/candidature'
import { fetchFilieres } from '../../services/catalogue'
import { effacerDossier, ecrireDossier, lireDossier } from '../../utils/candidatureSession'
import { getErrorMessage } from '../../utils/errors'
import { usePageTitle } from '../../utils/usePageTitle'

const ETAPES = ['Identité', 'Formation', 'Récapitulatif', 'Confirmation']
const TITRES = ['Votre identité', 'Votre formation', 'Vérifiez votre dossier']
const ETAPE_CONFIRMATION = 3
// Champs contrôlés avant de quitter chaque étape
const CHAMPS = [
  ['nom', 'prenom', 'dateNaissance', 'lieuNaissance', 'nationalite', 'email', 'telephone'],
  ['filiereId', 'anneeAcademiqueId'],
  ['certifie'],
]

const valeursVides = {
  nom: '',
  prenom: '',
  dateNaissance: '',
  lieuNaissance: '',
  nationalite: '',
  email: '',
  telephone: '',
  filiereId: '',
  anneeAcademiqueId: '',
  certifie: false,
}

function messageDepot(error) {
  const base = getErrorMessage(error, 'Le dépôt de la candidature a échoué. Veuillez réessayer.')
  return error.response?.status === 429 ? `${base}. Vos informations sont conservées.` : base
}

function Candidature() {
  usePageTitle('Candidature')
  const [params] = useSearchParams()
  const [dossier, setDossier] = useState(lireDossier)
  const [etape, setEtape] = useState(dossier ? ETAPE_CONFIRMATION : 0)
  const [catalogue, setCatalogue] = useState({ statut: 'chargement', filieres: [], annees: [], erreur: '' })
  const [tentative, setTentative] = useState(0)
  const [envoi, setEnvoi] = useState(false)
  const [erreurEnvoi, setErreurEnvoi] = useState('')
  const envoiEnCours = useRef(false)
  const titreRef = useRef(null)
  const premierRendu = useRef(true)
  const preselectionFaite = useRef(false)

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: valeursVides })

  // Champs sans élément HTML propre : leur validité est contrôlée à la sortie de l'étape.
  // reset() supprime ces enregistrements : on les refait après chaque réinitialisation.
  const enregistrerChampsVirtuels = useCallback(() => {
    register('filiereId', { required: 'Choisissez une filière.' })
    register('anneeAcademiqueId', { required: 'Aucune année académique sélectionnée.' })
  }, [register])
  useEffect(() => {
    enregistrerChampsVirtuels()
  }, [enregistrerChampsVirtuels])

  // Catalogue (filières avec école et campus) et années ouvertes aux candidatures
  useEffect(() => {
    const controller = new AbortController()
    setCatalogue((courant) => ({ ...courant, statut: 'chargement', erreur: '' }))
    Promise.all([fetchFilieres({}, controller.signal), fetchAnneesOuvertes(controller.signal)])
      .then(([filieres, annees]) => setCatalogue({ statut: 'pret', filieres, annees, erreur: '' }))
      .catch((error) => {
        if (error.code === 'ERR_CANCELED') return
        setCatalogue({
          statut: 'erreur',
          filieres: [],
          annees: [],
          erreur: getErrorMessage(error, 'Impossible de charger les filières.'),
        })
      })
    return () => controller.abort()
  }, [tentative])

  // Une seule année ouverte : sélectionnée d'office ; ?filiere=<id> : présélection depuis une fiche
  useEffect(() => {
    if (catalogue.statut !== 'pret') return
    if (catalogue.annees.length === 1) setValue('anneeAcademiqueId', catalogue.annees[0].id)
    const demandee = params.get('filiere')
    if (!preselectionFaite.current && demandee && catalogue.filieres.some((f) => f.id === demandee)) {
      setValue('filiereId', demandee)
    }
    preselectionFaite.current = true
  }, [catalogue, params, setValue])

  // Le focus suit l'étape (lecteurs d'écran, clavier), sauf à l'ouverture de la page
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false
      return
    }
    titreRef.current?.focus()
  }, [etape])

  const valeurs = watch()
  const filiere = catalogue.filieres.find((f) => f.id === valeurs.filiereId)
  const annee = catalogue.annees.find((a) => a.id === valeurs.anneeAcademiqueId)
  const fermees = catalogue.statut === 'pret' && catalogue.annees.length === 0
  const bloque = etape === 1 && (catalogue.statut !== 'pret' || fermees)

  const suivant = async () => {
    if (bloque) return
    if (await trigger(CHAMPS[etape])) setEtape((courante) => courante + 1)
  }

  const deposer = handleSubmit(async (v) => {
    if (envoiEnCours.current) return
    envoiEnCours.current = true
    setEnvoi(true)
    setErreurEnvoi('')
    try {
      const email = v.email.trim()
      const creee = await creerCandidature({
        // L'établissement est celui de l'école de la filière choisie
        tenantId: filiere.ecole.tenantId,
        nom: v.nom.trim(),
        prenom: v.prenom.trim(),
        email,
        ...(v.telephone.trim() && { telephone: v.telephone.trim() }),
        dateNaissance: `${v.dateNaissance}T00:00:00.000Z`,
        lieuNaissance: v.lieuNaissance.trim(),
        nationalite: v.nationalite.trim(),
        filiereId: v.filiereId,
        anneeAcademiqueId: v.anneeAcademiqueId,
      })
      const cree = {
        id: creee.id,
        numeroDossier: creee.numeroDossier,
        email,
        piecesRequises: filiere.piecesRequises,
        notification: creee.notification,
      }
      ecrireDossier(cree)
      setDossier(cree)
      setEtape(ETAPE_CONFIRMATION)
    } catch (error) {
      setErreurEnvoi(messageDepot(error))
    } finally {
      envoiEnCours.current = false
      setEnvoi(false)
    }
  })

  const nouvelle = () => {
    effacerDossier()
    setDossier(null)
    reset(valeursVides)
    enregistrerChampsVirtuels()
    // Une seule année ouverte : elle reste sélectionnée d'office
    if (catalogue.annees.length === 1) setValue('anneeAcademiqueId', catalogue.annees[0].id)
    setEtape(0)
  }

  const onSubmit = (event) => {
    if (etape === 2) return deposer(event)
    event.preventDefault()
    return suivant()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <p className="text-sm font-semibold text-iuc-red">Candidature en ligne</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Déposer ma candidature</h1>

      <div className="mt-8">
        <StepIndicator
          current={etape}
          locked={etape === ETAPE_CONFIRMATION}
          onGo={setEtape}
          steps={ETAPES}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {etape === ETAPE_CONFIRMATION && dossier ? (
          <Confirmation
            dossier={dossier}
            notification={dossier.notification}
            onNouvelle={nouvelle}
            titleRef={titreRef}
          />
        ) : (
          <form noValidate onSubmit={onSubmit}>
            <h2 className="mb-5 text-lg font-bold text-iuc-red outline-none" ref={titreRef} tabIndex={-1}>
              {TITRES[etape]}
            </h2>

            {etape === 0 && <IdentiteStep errors={errors} register={register} />}

            {etape === 1 &&
              (catalogue.statut === 'chargement' ? (
                <p className="py-10 text-center text-sm text-slate-500" role="status">
                  Chargement des filières…
                </p>
              ) : catalogue.statut === 'erreur' ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                  {catalogue.erreur}{' '}
                  <button className="font-bold underline" onClick={() => setTentative((n) => n + 1)} type="button">
                    Réessayer
                  </button>
                </div>
              ) : fermees ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" role="alert">
                  Les candidatures ne sont pas ouvertes pour le moment. Consultez le{' '}
                  <Link className="font-bold underline" to="/filieres">
                    catalogue des filières
                  </Link>{' '}
                  et revenez plus tard.
                </div>
              ) : (
                <FormationStep
                  anneeId={valeurs.anneeAcademiqueId}
                  catalogue={catalogue}
                  errors={errors}
                  filiereId={valeurs.filiereId}
                  onSelect={(f) => setValue('filiereId', f.id, { shouldValidate: true })}
                  onSelectAnnee={(id) => setValue('anneeAcademiqueId', id, { shouldValidate: true })}
                />
              ))}

            {etape === 2 && (
              <RecapStep
                annee={annee}
                errors={errors}
                filiere={filiere}
                onEdit={setEtape}
                register={register}
                values={valeurs}
              />
            )}

            {erreurEnvoi && (
              <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
                {erreurEnvoi}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
              {etape > 0 ? (
                <button
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  disabled={envoi}
                  onClick={() => setEtape(etape - 1)}
                  type="button"
                >
                  Retour
                </button>
              ) : (
                <span />
              )}
              <button
                className="rounded-xl bg-iuc-red px-6 py-2.5 text-sm font-bold text-white transition hover:bg-iuc-red/90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={envoi || bloque}
                type="submit"
              >
                {etape === 2 ? (envoi ? 'Envoi en cours…' : 'Envoyer ma candidature') : 'Continuer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default Candidature
