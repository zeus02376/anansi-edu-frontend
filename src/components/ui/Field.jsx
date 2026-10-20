import PropTypes from 'prop-types'

/** Libellé + champ de formulaire + message d'erreur react-hook-form. */
function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        <span className="mb-1.5 block">{label}</span>
        {children}
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  )
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.object,
  children: PropTypes.node.isRequired,
}

export default Field
