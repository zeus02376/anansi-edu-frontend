import PropTypes from 'prop-types'

/** Carte de section des espaces étudiant et enseignant. */
export function Carte({ titre, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">{titre}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

Carte.propTypes = { titre: PropTypes.string.isRequired, children: PropTypes.node }

/** Chargement, erreur (avec « Réessayer ») ou message vide, avant d'afficher le contenu. */
export function Etat({ loading, error, vide, onRetry, children }) {
  if (loading) {
    return (
      <p className="text-sm text-slate-500" role="status">
        Chargement…
      </p>
    )
  }
  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p>{error}</p>
        {onRetry && (
          <button className="mt-2 font-semibold underline" onClick={onRetry} type="button">
            Réessayer
          </button>
        )}
      </div>
    )
  }
  if (vide) return <p className="text-sm text-slate-500">{vide}</p>
  return children
}

Etat.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.string,
  vide: PropTypes.string,
  onRetry: PropTypes.func,
  children: PropTypes.node,
}

/** Paire libellé / valeur d'une fiche. */
export function Champ({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children || '—'}</dd>
    </div>
  )
}

Champ.propTypes = { label: PropTypes.string.isRequired, children: PropTypes.node }
