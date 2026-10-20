import PropTypes from 'prop-types'

/** Monogramme + nom de la plateforme (repris de l'écran de connexion). */
function BrandMark({ subtitle, className = '' }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-iuc-gold text-xl font-black text-iuc-blue"
      >
        I
      </span>
      <span className="leading-tight">
        <span className="block text-lg font-extrabold tracking-[0.08em] text-iuc-gold">
          IUC Campus
        </span>
        {subtitle && (
          <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-white/70">
            {subtitle}
          </span>
        )}
      </span>
    </span>
  )
}

BrandMark.propTypes = {
  subtitle: PropTypes.string,
  className: PropTypes.string,
}

export default BrandMark
