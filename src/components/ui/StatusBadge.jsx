import PropTypes from 'prop-types'
import { statusLabels, statusStyles } from '../../utils/candidatureStatus'

/** Pastille colorée du statut d'une candidature. */
function StatusBadge({ statut }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
        statusStyles[statut] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      {statusLabels[statut] ?? statut}
    </span>
  )
}

StatusBadge.propTypes = {
  statut: PropTypes.string,
}

export default StatusBadge
