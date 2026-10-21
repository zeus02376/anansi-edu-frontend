import { useState } from 'react'
import PropTypes from 'prop-types'
import Modal from '../ui/Modal'
import { inputClass } from '../ui/styles'
import { corrigerNote } from '../../services/notesPersonnel'
import { getErrorMessage } from '../../utils/errors'
import {
  erreurSaisie,
  estModifiee,
  etatNoteLabels,
  libelleNote,
  ligneDepuisNote,
  lireValeur,
} from '../../utils/notes'

/**
 * Correction d'une note par le personnel (publiée ou non), avec un motif obligatoire.
 * La correction est journalisée côté serveur (ancienne et nouvelle valeur, motif, auteur).
 *
 * Concurrence : la requête porte l'updatedAt lu. Si la note a changé entre-temps (409),
 * `recharger()` relit la grille, la note de référence est remplacée par la valeur actuelle,
 * et les saisies et le motif sont conservés avec un message explicite.
 */
function CorrectionNote({ ligne, bareme, onClose, onCorrigee, recharger }) {
  const nom = `${ligne.etudiant.prenom} ${ligne.etudiant.nom}`
  const [reference, setReference] = useState(ligne.note)
  const [valeurs, setValeurs] = useState(ligneDepuisNote(ligne.note))
  const [motif, setMotif] = useState('')
  const [message, setMessage] = useState(null) // { type: 'error' | 'warning', text }
  const [occupe, setOccupe] = useState(false)

  const changer = (changement) =>
    setValeurs((courant) => ({
      ...courant,
      ...changement,
      ...(changement.etat && changement.etat !== 'NOTEE' ? { valeur: '' } : {}),
    }))

  const valider = async () => {
    const erreur = erreurSaisie(valeurs, bareme, true)
    if (erreur) return setMessage({ type: 'error', text: erreur })
    if (valeurs.etat === 'NOTEE' && lireValeur(valeurs.valeur) === null) {
      return setMessage({ type: 'error', text: 'Une note est obligatoire pour l’état « Notée ».' })
    }
    if (!estModifiee(valeurs, reference)) {
      return setMessage({ type: 'error', text: 'Aucune modification : la note est identique à la note actuelle.' })
    }
    if (motif.trim() === '') return setMessage({ type: 'error', text: 'Le motif de la correction est obligatoire.' })

    setOccupe(true)
    setMessage(null)
    const commentaire = valeurs.commentaire.trim()
    try {
      await corrigerNote(reference.id, {
        etat: valeurs.etat,
        ...(valeurs.etat === 'NOTEE' && { valeur: lireValeur(valeurs.valeur) }),
        ...(commentaire && { commentaire }),
        motif: motif.trim(),
        updatedAt: reference.updatedAt,
      })
      onCorrigee(
        `Note de ${nom} corrigée : ${libelleNote(reference.etat, reference.valeur)} → ${libelleNote(
          valeurs.etat,
          lireValeur(valeurs.valeur),
        )}. La correction est enregistrée dans l’historique.`,
      )
    } catch (error) {
      if (error.response?.status === 409) {
        const grille = await recharger()
        const actuelle = grille?.notes.find((l) => l.inscriptionId === ligne.inscriptionId)?.note
        if (actuelle) setReference(actuelle)
        setMessage({
          type: 'warning',
          text: `Cette note a été modifiée depuis votre lecture${
            actuelle ? ` (valeur actuelle : ${libelleNote(actuelle.etat, actuelle.valeur)})` : ''
          }. Rien n’a été enregistré. Vos saisies et votre motif sont conservés : vérifiez-les puis validez de nouveau.`,
        })
      } else {
        setMessage({ type: 'error', text: getErrorMessage(error, 'La correction a échoué. Veuillez réessayer.') })
      }
    } finally {
      setOccupe(false)
    }
  }

  return (
    <Modal onClose={onClose} title={`Corriger la note de ${nom}`}>
      <p className="text-sm text-slate-600">
        Note actuelle : <strong>{libelleNote(reference.etat, reference.valeur)}</strong>
        {reference.etat === 'NOTEE' ? ` / ${bareme}` : ''}. Toute correction est conservée dans l’historique avec son
        motif.
      </p>
      {message && (
        <p
          className={`mt-4 rounded-xl p-3 text-sm ${
            message.type === 'warning' ? 'bg-amber-50 text-amber-900' : 'bg-red-50 text-red-700'
          }`}
          role="alert"
        >
          {message.text}
        </p>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          État
          <select
            className={`${inputClass} mt-1.5`}
            onChange={(event) => changer({ etat: event.target.value })}
            value={valeurs.etat}
          >
            {Object.entries(etatNoteLabels).map(([valeur, libelle]) => (
              <option key={valeur} value={valeur}>
                {libelle}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Note / {bareme}
          <input
            className={`${inputClass} mt-1.5`}
            disabled={valeurs.etat !== 'NOTEE'}
            inputMode="decimal"
            onChange={(event) => changer({ valeur: event.target.value })}
            value={valeurs.valeur}
          />
        </label>
      </div>
      <label className="mt-4 block text-sm font-semibold text-slate-700">
        Commentaire (facultatif)
        <input
          className={`${inputClass} mt-1.5`}
          maxLength={500}
          onChange={(event) => changer({ commentaire: event.target.value })}
          value={valeurs.commentaire}
        />
      </label>
      <label className="mt-4 block text-sm font-semibold text-slate-700">
        Motif de la correction (obligatoire)
        <textarea
          className={`${inputClass} mt-1.5`}
          maxLength={500}
          onChange={(event) => setMotif(event.target.value)}
          placeholder="Erreur de saisie, recorrection après réclamation…"
          rows={3}
          value={motif}
        />
      </label>
      <div className="mt-6 flex justify-end gap-3">
        <button
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          onClick={onClose}
          type="button"
        >
          Annuler
        </button>
        <button
          className="rounded-xl bg-iuc-red px-5 py-2.5 text-sm font-bold text-white transition hover:bg-iuc-red/90 disabled:opacity-60"
          disabled={occupe}
          onClick={valider}
          type="button"
        >
          {occupe ? 'Enregistrement…' : 'Corriger la note'}
        </button>
      </div>
    </Modal>
  )
}

CorrectionNote.propTypes = {
  ligne: PropTypes.shape({
    inscriptionId: PropTypes.string.isRequired,
    etudiant: PropTypes.shape({ nom: PropTypes.string, prenom: PropTypes.string }).isRequired,
    note: PropTypes.shape({ id: PropTypes.string, updatedAt: PropTypes.string }).isRequired,
  }).isRequired,
  bareme: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onCorrigee: PropTypes.func.isRequired,
  recharger: PropTypes.func.isRequired,
}

export default CorrectionNote
