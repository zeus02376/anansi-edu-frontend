import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

const RETOUR_FILIERES = { to: '/filieres', label: '← Retour aux filières' }

/** Page entière de message (introuvable, erreur) des pages publiques de détail. */
export function MessagePage({ title, children, retour = RETOUR_FILIERES }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-8">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <div className="mt-3 text-sm text-slate-500">{children}</div>
      <Link className="mt-6 inline-block text-sm font-bold text-iuc-red underline" to={retour.to}>
        {retour.label}
      </Link>
    </div>
  )
}

MessagePage.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  retour: PropTypes.shape({ to: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
}

/** Squelette d'une page de détail pendant son chargement. */
export function SqueletteDetail({ label }) {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-12 sm:px-8" role="status">
      <span className="sr-only">{label}</span>
      <div className="h-5 w-32 rounded bg-slate-200" />
      <div className="mt-4 h-9 w-2/3 rounded bg-slate-200" />
      <div className="mt-8 h-64 rounded-2xl bg-white" />
    </div>
  )
}

SqueletteDetail.propTypes = { label: PropTypes.string.isRequired }
