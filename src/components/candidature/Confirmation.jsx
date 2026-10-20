import { useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

/** Étape finale : numéro de dossier à conserver, puis envoi (facultatif) des documents. */
function Confirmation({ dossier, onNouvelle, titleRef }) {
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
        <p className="mt-3 text-sm text-emerald-900">Votre numéro de dossier :</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <code className="select-all rounded-lg bg-white px-4 py-2 font-mono text-xl font-bold tracking-wider text-iuc-blue ring-1 ring-emerald-200">
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
          className="mt-4 inline-block text-sm font-bold text-iuc-blue underline"
          to={`/suivi?numero=${encodeURIComponent(dossier.numeroDossier)}`}
        >
          Suivre ma candidature →
        </Link>
      </section>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-between">
        <Link
          className="inline-flex justify-center rounded-xl bg-iuc-blue px-5 py-3 text-sm font-bold text-white transition hover:bg-iuc-blue/90"
          to="/"
        >
          Terminer
        </Link>
        <button
          className="text-sm font-semibold text-slate-500 underline hover:text-iuc-blue"
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
  onNouvelle: PropTypes.func.isRequired,
  titleRef: PropTypes.object,
}

export default Confirmation
