import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import Modal from '../../components/ui/Modal'
import { inputClass } from '../../components/ui/styles'
import { fetchMesAffectations } from '../../services/moi'
import { enregistrerNotes, fetchGrille, publierEvaluation } from '../../services/notes'
import { getErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'
import {
  estModifiee,
  etatNoteLabels,
  formatNombre,
  ligneDepuisNote,
  messagesCodesLigne,
  preparerSaisie,
  statutEvaluationLabels,
  statutEvaluationStyles,
  typeEvaluationLabels,
} from '../../utils/notes'
import { useRessource } from '../../utils/useRessource'
import { usePageTitle } from '../../utils/usePageTitle'

const styleMessage = {
  success: 'bg-emerald-50 text-emerald-800',
  info: 'bg-slate-100 text-slate-700',
  warning: 'bg-amber-50 text-amber-900',
  error: 'bg-red-50 text-red-700',
}

/** Valeur actuellement enregistrée d'une note, pour un message de conflit. */
function resumeNote(note) {
  if (!note) return 'aucune note'
  return note.etat === 'NOTEE' ? formatNombre(note.valeur) : etatNoteLabels[note.etat]
}

/**
 * Grille de saisie des notes d'une évaluation de l'enseignant (inscrits VALIDE).
 * Brouillon : saisie en lot (seules les lignes modifiées sont envoyées, avec l'updatedAt lu).
 * Publiée : lecture seule. Un conflit (note modifiée ailleurs) recharge la grille en
 * conservant les saisies non enregistrées, avec un message explicite.
 */
function Evaluation() {
  usePageTitle('Évaluation')
  const { id } = useParams()
  const affectations = useRessource(fetchMesAffectations)
  const [grille, setGrille] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreurChargement, setErreurChargement] = useState('')
  const [introuvable, setIntrouvable] = useState(false)
  const [lignes, setLignes] = useState({})
  const [erreursLignes, setErreursLignes] = useState({})
  const [message, setMessage] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [confirmation, setConfirmation] = useState(false)

  /**
   * Charge la grille. `conserver` : saisies locales à garder (par inscription) au lieu de
   * les remplacer par les valeurs du serveur (cas du rechargement après un conflit).
   */
  const charger = useCallback(
    async (conserver = {}, signal) => {
      try {
        const data = await fetchGrille(id, signal)
        setGrille(data)
        setLignes(
          Object.fromEntries(
            data.notes.map((ligne) => [ligne.inscriptionId, conserver[ligne.inscriptionId] ?? ligneDepuisNote(ligne.note)]),
          ),
        )
        setErreurChargement('')
        setIntrouvable(false)
        return data
      } catch (error) {
        if (signal?.aborted) return null
        if (error.response?.status === 404) setIntrouvable(true)
        else setErreurChargement(getErrorMessage(error, 'Impossible de charger la grille.'))
        return null
      } finally {
        setChargement(false)
      }
    },
    [id],
  )

  useEffect(() => {
    const controller = new AbortController()
    charger({}, controller.signal)
    return () => controller.abort()
  }, [charger])

  const evaluation = grille?.evaluation
  const verrouillee = evaluation?.statut === 'PUBLIEE'
  const notes = grille ? Object.fromEntries(grille.notes.map((ligne) => [ligne.inscriptionId, ligne.note])) : {}
  const nbNotes = grille ? grille.notes.filter((ligne) => ligne.note).length : 0
  const nbModifiees = grille
    ? grille.notes.filter((ligne) => estModifiee(lignes[ligne.inscriptionId] ?? ligneDepuisNote(ligne.note), ligne.note))
        .length
    : 0
  const matiere = affectations.data?.find((affectation) => affectation.matiere?.id === evaluation?.matiereId)?.matiere

  const modifierLigne = (inscriptionId, changement) => {
    setLignes((courant) => ({
      ...courant,
      [inscriptionId]: {
        ...courant[inscriptionId],
        ...changement,
        // Un absent ou un dispensé n'a pas de note
        ...(changement.etat && changement.etat !== 'NOTEE' ? { valeur: '' } : {}),
      },
    }))
    setErreursLignes((courant) => {
      const suivant = { ...courant }
      delete suivant[inscriptionId]
      return suivant
    })
  }

  const annulerModifications = () => {
    setLignes(Object.fromEntries(grille.notes.map((ligne) => [ligne.inscriptionId, ligneDepuisNote(ligne.note)])))
    setErreursLignes({})
    setMessage(null)
  }

  /** Échec de la saisie : conflit (rechargement), refus par ligne, évaluation verrouillée ou introuvable. */
  const traiterEchec = async (error, envoyees) => {
    const status = error.response?.status
    const erreurs = Array.isArray(error.response?.data?.erreurs) ? error.response.data.erreurs : []
    const conflits = erreurs.filter((e) => e.code === 'CONFLIT')
    const conserver = Object.fromEntries(envoyees.map((l) => [l.inscriptionId, lignes[l.inscriptionId]]))

    if (conflits.length > 0 || (status === 409 && erreurs.length === 0)) {
      const data = await charger(conserver)
      if (data?.evaluation.statut === 'PUBLIEE') {
        setErreursLignes({})
        setMessage({
          type: 'error',
          text: 'Cette évaluation a été publiée entre-temps : elle est maintenant en lecture seule et vos saisies n’ont pas été enregistrées. Pour corriger une note, contactez la scolarité.',
        })
        return
      }
      const actuelles = Object.fromEntries((data?.notes ?? []).map((ligne) => [ligne.inscriptionId, ligne.note]))
      setErreursLignes(
        Object.fromEntries(
          conflits.map((e) => [
            e.inscriptionId,
            {
              code: 'CONFLIT',
              message: `Modifiée ailleurs depuis votre chargement (valeur actuelle : ${resumeNote(actuelles[e.inscriptionId])}). Votre saisie est conservée : vérifiez-la puis enregistrez de nouveau.`,
            },
          ]),
        ),
      )
      setMessage({
        type: 'warning',
        text: 'Des notes ont été modifiées depuis le chargement de la grille (autre onglet ou scolarité). Rien n’a été enregistré : la grille a été rechargée avec les valeurs actuelles et vos saisies non enregistrées sont conservées. Vérifiez-les puis enregistrez de nouveau.',
      })
      return
    }
    if (erreurs.length > 0) {
      setErreursLignes(
        Object.fromEntries(
          erreurs.map((e) => [e.inscriptionId, { code: e.code, message: e.message ?? messagesCodesLigne[e.code] }]),
        ),
      )
      setMessage({
        type: 'error',
        text: 'Saisie refusée : aucune note n’a été enregistrée. Corrigez les lignes signalées puis réessayez.',
      })
      return
    }
    if (status === 404) {
      setIntrouvable(true)
      return
    }
    setMessage({ type: 'error', text: getErrorMessage(error, 'L’enregistrement a échoué. Veuillez réessayer.') })
  }

  const enregistrer = async () => {
    const { lignes: aEnvoyer, erreurs } = preparerSaisie(lignes, notes, evaluation.bareme)
    if (Object.keys(erreurs).length > 0) {
      setErreursLignes(Object.fromEntries(Object.entries(erreurs).map(([cle, texte]) => [cle, { message: texte }])))
      setMessage({ type: 'error', text: 'Corrigez les lignes signalées avant d’enregistrer.' })
      return
    }
    if (aEnvoyer.length === 0) {
      setMessage({ type: 'info', text: 'Aucune modification à enregistrer.' })
      return
    }
    setEnvoi(true)
    setMessage(null)
    setErreursLignes({})
    try {
      const resultat = await enregistrerNotes(id, aEnvoyer)
      const parInscription = Object.fromEntries(resultat.notes.map((note) => [note.inscriptionId, note]))
      setGrille((courante) => ({
        ...courante,
        notes: courante.notes.map((ligne) =>
          parInscription[ligne.inscriptionId] ? { ...ligne, note: parInscription[ligne.inscriptionId] } : ligne,
        ),
      }))
      setLignes((courant) => ({
        ...courant,
        ...Object.fromEntries(resultat.notes.map((note) => [note.inscriptionId, ligneDepuisNote(note)])),
      }))
      setMessage({
        type: 'success',
        text: `${resultat.enregistrees} note${resultat.enregistrees > 1 ? 's' : ''} enregistrée${resultat.enregistrees > 1 ? 's' : ''}.`,
      })
    } catch (error) {
      await traiterEchec(error, aEnvoyer)
    } finally {
      setEnvoi(false)
    }
  }

  const publier = async () => {
    setEnvoi(true)
    try {
      await publierEvaluation(id)
      setConfirmation(false)
      await charger({})
      setErreursLignes({})
      setMessage({ type: 'success', text: 'Évaluation publiée : elle est visible des étudiants et verrouillée.' })
    } catch (error) {
      setConfirmation(false)
      await charger(Object.fromEntries(Object.entries(lignes)))
      setMessage({ type: 'error', text: getErrorMessage(error, 'La publication a échoué.') })
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link className="text-sm font-semibold text-iuc-red hover:underline" to="/enseignant/matieres">
          ← Mes matières
        </Link>
      </div>

      {chargement && (
        <p className="text-sm text-slate-500" role="status">
          Chargement de la grille…
        </p>
      )}
      {erreurChargement && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          <p>{erreurChargement}</p>
          <button className="mt-2 font-semibold underline" onClick={() => charger({})} type="button">
            Réessayer
          </button>
        </div>
      )}
      {introuvable && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">Évaluation introuvable</h1>
          <p className="mt-2 text-sm text-slate-500">
            Cette évaluation n’existe plus, ne vous appartient pas, ou vous n’êtes plus affecté à sa matière.
          </p>
        </div>
      )}

      {evaluation && (
        <>
          <div className="mb-6">
            <p className="text-sm font-semibold text-iuc-red">{matiere ? matiere.nom : 'Évaluation'}</p>
            <h1 className="mt-1 flex flex-wrap items-center gap-3 text-2xl font-bold text-slate-900 sm:text-3xl">
              {evaluation.nom}
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                  statutEvaluationStyles[evaluation.statut] ?? 'bg-slate-100 text-slate-700'
                }`}
              >
                {statutEvaluationLabels[evaluation.statut] ?? evaluation.statut}
              </span>
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {typeEvaluationLabels[evaluation.type] ?? evaluation.type} · coefficient {formatNombre(evaluation.coefficient)}{' '}
              · notée sur {formatNombre(evaluation.bareme)}
              {evaluation.date ? ` · ${formatDate(evaluation.date)}` : ''}
            </p>
          </div>

          {verrouillee ? (
            <p className="mb-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900" role="note">
              Évaluation <strong>publiée</strong> : les notes sont visibles des étudiants et verrouillées (lecture
              seule). Pour corriger une note, contactez la scolarité.
            </p>
          ) : (
            <p className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="note">
              <strong>Brouillon</strong> : les étudiants ne voient rien tant que vous ne publiez pas. Seules les lignes
              que vous modifiez sont enregistrées.
            </p>
          )}

          {message && (
            <p
              className={`mb-6 rounded-xl p-4 text-sm ${styleMessage[message.type]}`}
              role={message.type === 'error' || message.type === 'warning' ? 'alert' : 'status'}
            >
              {message.text}
            </p>
          )}

          {grille.notes.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              Aucun inscrit validé pour cette matière pour le moment : il n’y a personne à noter.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Matricule</th>
                    <th className="px-4 py-3">Étudiant</th>
                    <th className="px-4 py-3">État</th>
                    <th className="px-4 py-3">Note / {formatNombre(evaluation.bareme)}</th>
                    <th className="px-4 py-3">Commentaire</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grille.notes.map((ligne) => {
                    const valeurs = lignes[ligne.inscriptionId] ?? ligneDepuisNote(ligne.note)
                    const nom = `${ligne.etudiant.prenom} ${ligne.etudiant.nom}`
                    const erreur = erreursLignes[ligne.inscriptionId]
                    const modifiee = !verrouillee && estModifiee(valeurs, ligne.note)
                    return (
                      <tr
                        className={erreur ? 'bg-red-50/60' : modifiee ? 'bg-amber-50/50' : ''}
                        data-testid={`ligne-${ligne.inscriptionId}`}
                        key={ligne.inscriptionId}
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                          {ligne.etudiant.matricule}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {nom}
                          {erreur && (
                            <p className="mt-1 text-xs font-normal text-red-700" role="alert">
                              {erreur.message ?? messagesCodesLigne[erreur.code]}
                            </p>
                          )}
                        </td>
                        {verrouillee ? (
                          <>
                            <td className="px-4 py-3">{etatNoteLabels[ligne.note?.etat] ?? '—'}</td>
                            <td className="px-4 py-3 font-semibold">
                              {ligne.note?.etat === 'NOTEE' ? formatNombre(ligne.note.valeur) : '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{ligne.note?.commentaire ?? ''}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3">
                              <select
                                aria-label={`État de ${nom}`}
                                className={`${inputClass} min-w-[8.5rem] py-2`}
                                onChange={(event) => modifierLigne(ligne.inscriptionId, { etat: event.target.value })}
                                value={valeurs.etat}
                              >
                                {Object.entries(etatNoteLabels).map(([valeur, libelle]) => (
                                  <option key={valeur} value={valeur}>
                                    {libelle}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                aria-label={`Note de ${nom}`}
                                className={`${inputClass} w-28 py-2`}
                                disabled={valeurs.etat !== 'NOTEE'}
                                inputMode="decimal"
                                onChange={(event) => modifierLigne(ligne.inscriptionId, { valeur: event.target.value })}
                                placeholder="—"
                                value={valeurs.valeur}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                aria-label={`Commentaire pour ${nom}`}
                                className={`${inputClass} min-w-[12rem] py-2`}
                                maxLength={500}
                                onChange={(event) => modifierLigne(ligne.inscriptionId, { commentaire: event.target.value })}
                                value={valeurs.commentaire}
                              />
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!verrouillee && grille.notes.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                className="rounded-xl bg-iuc-red px-5 py-2.5 text-sm font-bold text-white transition hover:bg-iuc-red/90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={envoi || nbModifiees === 0}
                onClick={enregistrer}
                type="button"
              >
                {envoi ? 'Enregistrement…' : 'Enregistrer les notes'}
              </button>
              {nbModifiees > 0 && (
                <>
                  <span className="text-sm text-amber-800">
                    {nbModifiees} modification{nbModifiees > 1 ? 's' : ''} non enregistrée{nbModifiees > 1 ? 's' : ''}
                  </span>
                  <button
                    className="text-sm font-semibold text-slate-600 underline"
                    disabled={envoi}
                    onClick={annulerModifications}
                    type="button"
                  >
                    Annuler mes modifications
                  </button>
                </>
              )}
              <span className="flex-1" />
              <button
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={envoi || nbModifiees > 0 || nbNotes === 0}
                onClick={() => setConfirmation(true)}
                title={
                  nbModifiees > 0
                    ? 'Enregistrez vos modifications avant de publier'
                    : nbNotes === 0
                      ? 'Saisissez au moins une note avant de publier'
                      : undefined
                }
                type="button"
              >
                Publier l’évaluation
              </button>
            </div>
          )}

          {confirmation && (
            <Modal onClose={() => setConfirmation(false)} title="Publier l’évaluation">
              <p className="text-sm text-slate-700">
                Publier « {evaluation.nom} » la rend visible des étudiants et la verrouille : vous ne pourrez plus
                modifier ses notes (toute correction passera par la scolarité). {nbNotes} note
                {nbNotes > 1 ? 's' : ''} saisie{nbNotes > 1 ? 's' : ''} sur {grille.notes.length} inscrit
                {grille.notes.length > 1 ? 's' : ''} ; les inscrits sans note ne sont pas comptés.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  onClick={() => setConfirmation(false)}
                  type="button"
                >
                  Annuler
                </button>
                <button
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                  disabled={envoi}
                  onClick={publier}
                  type="button"
                >
                  {envoi ? 'Publication…' : 'Publier'}
                </button>
              </div>
            </Modal>
          )}
        </>
      )}
    </DashboardLayout>
  )
}

export default Evaluation
