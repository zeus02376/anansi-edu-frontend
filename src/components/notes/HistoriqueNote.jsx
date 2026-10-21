import { useCallback } from 'react'
import PropTypes from 'prop-types'
import Modal from '../ui/Modal'
import { Etat } from '../ui/Etat'
import { fetchHistoriqueNote } from '../../services/notesPersonnel'
import { formatDateHeure, libelleNote, nomAuteur } from '../../utils/notes'
import { useRessource } from '../../utils/useRessource'

/** Journal des corrections d'une note : du plus récent au plus ancien. */
function HistoriqueNote({ noteId, titre, onClose }) {
  const fetcher = useCallback((signal) => fetchHistoriqueNote(noteId, signal), [noteId])
  const { data, loading, error, recharger } = useRessource(fetcher)

  return (
    <Modal onClose={onClose} title={titre} wide>
      <Etat
        error={error}
        loading={loading}
        onRetry={recharger}
        vide={data && data.length === 0 ? 'Aucune correction enregistrée pour cette note.' : ''}
      >
        {data && (
          <ol className="space-y-3" data-testid="historique">
            {data.map((ligne) => (
              <li className="rounded-xl bg-slate-50 p-4 text-sm" key={ligne.id}>
                <p className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">
                    {libelleNote(ligne.ancienEtat, ligne.ancienneValeur)} →{' '}
                    {libelleNote(ligne.nouvelEtat, ligne.nouvelleValeur)}
                  </span>
                  <span className="text-xs text-slate-500">{formatDateHeure(ligne.date)}</span>
                </p>
                <p className="mt-1 text-slate-700">
                  <span className="font-semibold">Motif :</span> {ligne.motif}
                </p>
                <p className="mt-1 text-xs text-slate-500">Par {nomAuteur(ligne.auteur)}</p>
              </li>
            ))}
          </ol>
        )}
      </Etat>
    </Modal>
  )
}

HistoriqueNote.propTypes = {
  noteId: PropTypes.string.isRequired,
  titre: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default HistoriqueNote
