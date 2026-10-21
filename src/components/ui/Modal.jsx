import PropTypes from 'prop-types'

/** Fenêtre modale : fond semi-transparent, fermeture par clic sur le fond ou « × ». */
function Modal({ title, onClose, children, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${
          wide ? 'max-w-2xl' : 'max-w-lg'
        }`}
        role="dialog"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <h2 id="modal-title" className="text-lg font-bold text-iuc-red">
            {title}
          </h2>
          <button
            aria-label="Fermer"
            className="rounded-lg px-3 py-1.5 text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </section>
    </div>
  )
}

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  wide: PropTypes.bool,
}

export default Modal
