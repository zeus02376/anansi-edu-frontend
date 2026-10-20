import PropTypes from 'prop-types'

/**
 * Indicateur d'étapes accessible (liste ordonnée, étape courante annoncée).
 * Les étapes terminées sont des boutons pour revenir en arrière, sauf si `locked`.
 */
function StepIndicator({ steps, current, locked, onGo }) {
  return (
    <nav aria-label="Étapes de la candidature">
      <ol className="flex">
        {steps.map((title, index) => {
          const done = index < current
          const active = index === current
          const bubble = (
            <span
              aria-hidden="true"
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                done
                  ? 'bg-iuc-blue text-white'
                  : active
                    ? 'bg-iuc-blue text-white ring-4 ring-iuc-blue/20'
                    : 'border-2 border-slate-300 bg-white text-slate-400'
              }`}
            >
              {done ? '✓' : index + 1}
            </span>
          )
          const label = (
            <span
              className={`sr-only sm:not-sr-only sm:text-center sm:text-xs ${
                active ? 'font-semibold text-slate-900' : done ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              {title}
            </span>
          )
          return (
            <li
              aria-current={active ? 'step' : undefined}
              className="relative flex min-w-0 flex-1 justify-center"
              key={title}
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[-50%] right-1/2 top-4 h-0.5 -translate-y-1/2 ${
                    index <= current ? 'bg-iuc-blue' : 'bg-slate-200'
                  }`}
                />
              )}
              {done && !locked ? (
                <button
                  className="group relative flex min-w-0 flex-col items-center gap-1.5 rounded-md px-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-iuc-blue/20"
                  onClick={() => onGo(index)}
                  type="button"
                >
                  {bubble}
                  <span className="sr-only">Revenir à l’étape {index + 1} : </span>
                  <span className="group-hover:underline">{label}</span>
                </button>
              ) : (
                <div className="relative flex min-w-0 flex-col items-center gap-1.5 px-1">
                  {bubble}
                  <span className="sr-only">
                    {done ? 'Étape terminée : ' : active ? 'Étape en cours : ' : 'Étape à venir : '}
                  </span>
                  {label}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

StepIndicator.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.string).isRequired,
  current: PropTypes.number.isRequired,
  locked: PropTypes.bool,
  onGo: PropTypes.func.isRequired,
}

export default StepIndicator
