import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { envoyerDocument } from '../../services/candidature'
import {
  DOCUMENT_ACCEPT,
  documentsAttendus,
  erreurFichier,
  formatTaille,
} from '../../utils/documents'
import { getErrorMessage } from '../../utils/errors'

const MESSAGE_LIMITE =
  'Trop d’envois en peu de temps. Patientez quelques minutes puis réessayez : les documents déjà envoyés sont bien reçus.'

/** Message clair pour un refus du serveur lors de l'envoi d'un document. */
function messageEnvoi(error) {
  const status = error.response?.status
  if (status === 429) return MESSAGE_LIMITE
  if (status === 413) return 'Fichier trop lourd : 10 Mo maximum.'
  if (status === 403) return 'Numéro de dossier ou e-mail incorrect pour cette candidature.'
  return getErrorMessage(error, 'L’envoi a échoué. Veuillez réessayer.')
}

const vide = { fichier: null, statut: 'vide', progression: 0, erreur: '', cle: 0 }

// Prêt à partir : fichier choisi et valide, ou envoi échoué pour une cause passagère
// (réseau, serveur, limite de débit). Un refus définitif (format, e-mail…) exige un autre fichier.
const envoyable = (ligne) =>
  ligne.fichier && (ligne.statut === 'pret' || (ligne.statut === 'erreur' && ligne.reessayable))

const estPassager = (error) => !error.response || error.response.status === 429 || error.response.status >= 500

/**
 * Envoi des documents d'une candidature par le candidat (numéro de dossier + e-mail).
 * Un seul envoi à la fois ; l'envoi n'est jamais obligatoire.
 */
function DocumentsUploader({ candidatureId, numeroDossier, email, piecesRequises }) {
  const [lignes, setLignes] = useState(() =>
    Object.fromEntries(documentsAttendus.map(({ type }) => [type, vide])),
  )
  const [limiteAtteinte, setLimiteAtteinte] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const controller = useRef(null)

  // Un envoi en cours est abandonné si l'écran est quitté
  useEffect(() => () => controller.current?.abort(), [])

  const maj = (type, changes) =>
    setLignes((courant) => ({ ...courant, [type]: { ...courant[type], ...changes } }))

  const choisir = (type, fichier) => {
    if (!fichier) {
      maj(type, { fichier: null, statut: 'vide', erreur: '' })
      return
    }
    const erreur = erreurFichier(fichier)
    maj(type, erreur ? { fichier: null, statut: 'erreur', erreur } : { fichier, statut: 'pret', erreur: '' })
  }

  const envoyer = async (type, fichier) => {
    controller.current = new AbortController()
    maj(type, { statut: 'envoi', progression: 0, erreur: '', reessayable: false })
    try {
      await envoyerDocument({
        candidatureId,
        numeroDossier,
        email,
        typeDocument: type,
        fichier,
        signal: controller.current.signal,
        onProgress: (progression) => maj(type, { progression }),
      })
      maj(type, { statut: 'envoye', progression: 100 })
      return 'ok'
    } catch (error) {
      if (error.code === 'ERR_CANCELED') return 'annule'
      const limite = error.response?.status === 429
      if (limite) setLimiteAtteinte(true)
      maj(type, { statut: 'erreur', erreur: messageEnvoi(error), reessayable: estPassager(error) })
      return limite ? 'limite' : 'echec'
    }
  }

  const envoyerUn = async (type) => {
    setEnCours(true)
    await envoyer(type, lignes[type].fichier)
    setEnCours(false)
  }

  const toutEnvoyer = async () => {
    setEnCours(true)
    for (const { type } of documentsAttendus) {
      const ligne = lignes[type]
      if (!envoyable(ligne)) continue
      // La limite de débit s'applique à toute l'adresse : inutile d'insister ;
      // tout autre échec ne doit pas empêcher l'envoi des documents suivants
      const resultat = await envoyer(type, ligne.fichier)
      if (resultat === 'limite' || resultat === 'annule') break
    }
    setEnCours(false)
  }

  const nouveau = (type) => setLignes((courant) => ({ ...courant, [type]: { ...vide, cle: courant[type].cle + 1 } }))

  const prets = documentsAttendus.filter(({ type }) => envoyable(lignes[type])).length
  const envoyes = documentsAttendus.filter(({ type }) => lignes[type].statut === 'envoye').length

  return (
    <div>
      {piecesRequises?.length > 0 && (
        <p className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          Pièces demandées pour cette filière : <span className="font-semibold">{piecesRequises.join(', ')}</span>.
        </p>
      )}
      <p className="mb-4 text-sm text-slate-500">
        Formats acceptés : PDF, JPG ou PNG, 10 Mo maximum par fichier. Les fichiers sont vérifiés avant l’envoi.
      </p>

      <ul className="space-y-3">
        {documentsAttendus.map(({ type, label }) => {
          const ligne = lignes[type]
          return (
            <li className="rounded-xl border border-slate-200 bg-white p-4" key={type}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-semibold text-slate-800" htmlFor={`doc-${type}`}>
                  {label}
                </label>
                {ligne.statut === 'envoye' && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    ✓ Envoyé
                  </span>
                )}
              </div>

              {ligne.statut === 'envoye' ? (
                <button
                  className="mt-2 text-xs font-semibold text-slate-500 underline hover:text-iuc-red"
                  onClick={() => nouveau(type)}
                  type="button"
                >
                  Envoyer un autre fichier
                </button>
              ) : (
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    accept={DOCUMENT_ACCEPT}
                    className="min-w-0 flex-1 text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-iuc-red/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-iuc-red hover:file:bg-iuc-red/15"
                    disabled={ligne.statut === 'envoi' || enCours}
                    id={`doc-${type}`}
                    key={ligne.cle}
                    onChange={(event) => choisir(type, event.target.files[0])}
                    type="file"
                  />
                  <button
                    className="shrink-0 rounded-lg bg-iuc-red px-4 py-2 text-sm font-bold text-white transition hover:bg-iuc-red/90 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!envoyable(ligne) || enCours || limiteAtteinte}
                    onClick={() => envoyerUn(type)}
                    type="button"
                  >
                    {ligne.statut === 'envoi' ? 'Envoi…' : 'Envoyer'}
                  </button>
                </div>
              )}

              {ligne.statut === 'pret' && (
                <p className="mt-2 text-xs text-slate-500">
                  {ligne.fichier.name} · {formatTaille(ligne.fichier.size)}
                </p>
              )}
              {ligne.statut === 'envoi' && (
                <div
                  aria-label={`Envoi de ${label}`}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={ligne.progression}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                >
                  <div
                    className="h-full rounded-full bg-iuc-red transition-all"
                    style={{ width: `${ligne.progression}%` }}
                  />
                </div>
              )}
              {ligne.erreur && (
                <p className="mt-2 text-xs font-medium text-red-600" role="alert">
                  {ligne.erreur}
                </p>
              )}
            </li>
          )
        })}
      </ul>

      <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-sm text-slate-500">
          {envoyes > 0 ? `${envoyes} document${envoyes > 1 ? 's' : ''} envoyé${envoyes > 1 ? 's' : ''}` : 'Aucun document envoyé pour l’instant'}
        </p>
        <button
          className="rounded-xl bg-iuc-red px-5 py-2.5 text-sm font-bold text-white transition hover:bg-iuc-red/90 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={prets < 2 || enCours || limiteAtteinte}
          onClick={toutEnvoyer}
          type="button"
        >
          {prets > 1 ? `Envoyer les ${prets} fichiers` : 'Envoyer tous les fichiers'}
        </button>
      </div>
      {limiteAtteinte && (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800" role="alert">
          {MESSAGE_LIMITE}{' '}
          <button className="font-bold underline" onClick={() => setLimiteAtteinte(false)} type="button">
            J’ai patienté, réessayer
          </button>
        </p>
      )}
    </div>
  )
}

DocumentsUploader.propTypes = {
  candidatureId: PropTypes.string.isRequired,
  numeroDossier: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  piecesRequises: PropTypes.arrayOf(PropTypes.string),
}

export default DocumentsUploader
