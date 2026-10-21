import PropTypes from 'prop-types'
import { logoIuc } from '../utils/logos'

/** Logo + nom de la plateforme, pour les fonds de couleur (en-tête, pied de page). */
function BrandMark({ subtitle, className = '', logoSrc = logoIuc }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      {logoSrc ? (
        // Pastille blanche : le logo (rouge et vert) reste lisible sur le fond rouge
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white p-1">
          <img alt="Logo IUC" className="h-full w-full object-contain" src={logoSrc} />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-iuc-green text-xl font-black text-white"
        >
          I
        </span>
      )}
      <span className="leading-tight">
        <span className="block text-lg font-extrabold tracking-[0.08em] text-white">IUC Campus</span>
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
  logoSrc: PropTypes.string,
}

export default BrandMark
