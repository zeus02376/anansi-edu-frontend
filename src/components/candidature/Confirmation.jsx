import { useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import DocumentsUploader from './DocumentsUploader'

/** Étape finale : numéro de dossier à conserver, puis envoi (facultatif) des documents. */
function Confirmation({ dossier, notification, onNouvelle, titleRef }) {
  const [copie, setCopie] = useState(false)

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(dossier.numeroDossier)
      setCopie(true)
      setTimeout(() => setCopie(false), 2500)
    } catch {
      // presse-papiers indisponible : le numéro reste sélectionnable à l'écran
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
        <h2 className="text-xl font-bold text-emerald-900 outline-none" ref={titleRef} tabIndex={-1}>
          Votre candidature est enregistrée
        </h2>
        {notification?.statut === 'ECHEC' && (
          <p
            className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900"
            role="status"
          >
            Votre candidature a bien été enregistrée, mais le courriel de confirmation n’a pas pu
            être envoyé. Conservez votre numéro de dossier pour suivre votre candidature.
          </p>
        )}
        <p className="mt-3 text-sm text-emerald-900">Votre numéro de dossier :</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <code className="select-all rounded-lg bg-white px-4 py-2 font-mono text-xl font-bold tracking-wider text-iuc-red ring-1 ring-emerald-200">
            {dossier.numeroDossier}
          </code>
          <button
            className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
            onClick={copier}
            type="button"
          >
            {copie ? '✓ Copié' : 'Copier'}
          </button>
        </div>
        <p className="mt-4 rounded-lg bg-white/70 p-3 text-sm font-semibold text-emerald-900">
          ⚠ Conservez ce numéro : il est indispensable pour suivre l’avancement de votre candidature et
          pour envoyer vos documents. Il ne pourra pas vous être redonné automatiquement.
        </p>
        <Link
          className="mt-4 inline-block text-sm font-bold text-iuc-red underline"
          to={`/suivi?numero=${encodeURIComponent(dossier.numeroDossier)}`}
        >
          Suivre ma candidature →
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-bold text-iuc-red">Envoyer mes documents</h2>
        <p className="mt-2 text-sm text-slate-500">
          Vous pouvez envoyer vos pièces maintenant ou plus tard : ce n’est pas obligatoire pour
          finaliser le dépôt. Pour le faire plus tard, utilisez la page{' '}
          <Link className="font-semibold text-iuc-red underline" to="/suivi">
            Suivi
          </Link>{' '}
          avec votre numéro de dossier et l’e-mail de votre candidature ({dossier.email}).
        </p>
        <div className="mt-4">
          <DocumentsUploader
            candidatureId={dossier.id}
            email={dossier.email}
            numeroDossier={dossier.numeroDossier}
            piecesRequises={dossier.piecesRequises}
          />
        </div>
      </section>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-between">
        <Link
          className="inline-flex justify-center rounded-xl bg-iuc-red px-5 py-3 text-sm font-bold text-white transition hover:bg-iuc-red/90"
          to="/"
        >
          Terminer
        </Link>
        <button
          className="text-sm font-semibold text-slate-500 underline hover:text-iuc-red"
          onClick={onNouvelle}
          type="button"
        >
          Déposer une autre candidature
        </button>
      </div>
    </div>
  )
}

Confirmation.propTypes = {
  dossier: PropTypes.shape({
    id: PropTypes.string.isRequired,
    numeroDossier: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    piecesRequises: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  notification: PropTypes.shape({
    statut: PropTypes.string,
  }),
  onNouvelle: PropTypes.func.isRequired,
  titleRef: PropTypes.object,
}

export default Confirmation
