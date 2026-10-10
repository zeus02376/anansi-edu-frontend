import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import PropTypes from 'prop-types'
import DashboardLayout from '../../components/DashboardLayout'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const statuses = ['SOUMIS', 'EN_EXAMEN', 'ACCEPTE', 'REJETE', 'INCOMPLET']

const statusLabels = {
  SOUMIS: 'Soumis',
  EN_EXAMEN: 'En examen',
  ACCEPTE: 'Accepté',
  REJETE: 'Rejeté',
  INCOMPLET: 'Incomplet',
}

const statusStyles = {
  SOUMIS: 'bg-amber-100 text-amber-800',
  EN_EXAMEN: 'bg-blue-100 text-blue-800',
  ACCEPTE: 'bg-emerald-100 text-emerald-800',
  REJETE: 'bg-red-100 text-red-800',
  INCOMPLET: 'bg-slate-100 text-slate-700',
}

function getErrorMessage(error, fallback) {
  if (error.code === 'ECONNABORTED') {
    return 'Le serveur met trop de temps à répondre. Vérifiez la connexion puis réessayez.'
  }
  const message = error.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  return message || error.message || fallback
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date)
}

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
          <h2 id="modal-title" className="text-lg font-bold text-iuc-blue">
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

function Candidatures() {
  const user = useAuthStore((state) => state.user)
  const [candidatures, setCandidatures] = useState([])
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [filter, setFilter] = useState('TOUS')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [studentError, setStudentError] = useState('')
  const [modal, setModal] = useState(null)
  const [selectedCandidature, setSelectedCandidature] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [rowLoading, setRowLoading] = useState({})
  const [rowMessages, setRowMessages] = useState({})
  const [createdStudents, setCreatedStudents] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [options, setOptions] = useState({ filieres: [], annees: [] })
  const [optionsLoading, setOptionsLoading] = useState(false)

  const statusForm = useForm({
    defaultValues: { statut: '', commentaire: '' },
  })
  const candidatureForm = useForm()

  const loadCandidatures = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/candidatures')
      if (!Array.isArray(data)) {
        throw new Error('La réponse du serveur est invalide.')
      }
      setCandidatures(data)
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          'Impossible de charger les candidatures. Veuillez réessayer.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true)
    setStudentError('')
    try {
      const { data } = await api.get('/etudiants')
      if (!Array.isArray(data)) {
        throw new Error('La réponse des étudiants est invalide.')
      }
      setStudents(data)
    } catch (requestError) {
      setStudentError(
        getErrorMessage(
          requestError,
          'Impossible de vérifier les comptes étudiants existants.',
        ),
      )
    } finally {
      setStudentsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCandidatures()
    loadStudents()
  }, [loadCandidatures, loadStudents])

  const filteredCandidatures = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('fr')
    return candidatures.filter((candidature) => {
      const matchesStatus = filter === 'TOUS' || candidature.statut === filter
      const nom = candidature.nom ?? ''
      const prenom = candidature.prenom ?? ''
      const matchesSearch =
        !normalizedSearch ||
        [`${nom} ${prenom}`, `${prenom} ${nom}`, candidature.email ?? '']
          .some((value) => value.toLocaleLowerCase('fr').includes(normalizedSearch))
      return matchesStatus && matchesSearch
    })
  }, [candidatures, filter, search])

  const hasStudentAccount = (candidature) =>
    Boolean(
      createdStudents[candidature.id] ||
        students.some(
          (student) =>
            student.user?.email?.toLocaleLowerCase() ===
            candidature.email?.toLocaleLowerCase(),
        ),
    )

  const openDetails = async (candidature) => {
    setSelectedCandidature(candidature)
    setModal('details')
    setModalLoading(true)
    setModalError('')
    try {
      const { data } = await api.get(`/candidatures/${candidature.id}`)
      setSelectedCandidature({ ...candidature, ...data })
    } catch (requestError) {
      setModalError(
        getErrorMessage(requestError, 'Impossible de charger les détails du dossier.'),
      )
    } finally {
      setModalLoading(false)
    }
  }

  const openStatus = (candidature) => {
    setSelectedCandidature(candidature)
    statusForm.reset({ statut: candidature.statut, commentaire: '' })
    setModalError('')
    setModal('status')
  }

  const submitStatus = async ({ statut, commentaire }) => {
    if (!selectedCandidature) return
    setModalLoading(true)
    setModalError('')
    try {
      await api.patch(`/candidatures/${selectedCandidature.id}/statut`, {
        statut,
        ...(commentaire.trim() ? { commentaire: commentaire.trim() } : {}),
      })
      setModal(null)
      setSelectedCandidature(null)
      await loadCandidatures()
      await loadStudents()
    } catch (requestError) {
      setModalError(getErrorMessage(requestError, 'Le statut n’a pas pu être modifié.'))
    } finally {
      setModalLoading(false)
    }
  }

  const createStudent = async (candidature) => {
    if (!user?.tenantId) {
      setRowMessages((current) => ({
        ...current,
        [candidature.id]: {
          type: 'error',
          text: 'Le tenant de votre compte est introuvable. Reconnectez-vous.',
        },
      }))
      return
    }

    setRowLoading((current) => ({ ...current, [candidature.id]: true }))
    setRowMessages((current) => ({ ...current, [candidature.id]: null }))
    try {
      const { data } = await api.post('/etudiants', {
        candidatureId: candidature.id,
        tenantId: user.tenantId,
      })
      setCreatedStudents((current) => ({ ...current, [candidature.id]: data }))
      setStudents((current) => [...current, data])
      setSuccessMessage(
        `Étudiant créé avec le matricule ${data.matricule} (${candidature.prenom} ${candidature.nom})`,
      )
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (requestError) {
      setRowMessages((current) => ({
        ...current,
        [candidature.id]: {
          type: 'error',
          text: getErrorMessage(requestError, 'La création du compte étudiant a échoué.'),
        },
      }))
    } finally {
      setRowLoading((current) => ({ ...current, [candidature.id]: false }))
    }
  }

  const openNewCandidature = async () => {
    if (!user?.tenantId) {
      setModalError('Le tenant de votre compte est introuvable. Reconnectez-vous.')
      setModal('new')
      return
    }
    setModalError('')
    setOptionsLoading(true)
    setModal('new')
    candidatureForm.reset()

    try {
      const [filieresResponse, anneesResponse, ecolesResponse] = await Promise.all([
        api.get('/filieres'),
        api.get('/annees-academiques'),
        api.get('/ecoles'),
      ])
      const tenantEcoleIds = new Set(
        (Array.isArray(ecolesResponse.data) ? ecolesResponse.data : [])
          .filter((ecole) => ecole.tenantId === user.tenantId)
          .map((ecole) => ecole.id),
      )
      setOptions({
        filieres: (Array.isArray(filieresResponse.data) ? filieresResponse.data : [])
          .filter((filiere) => tenantEcoleIds.has(filiere.ecoleId)),
        annees: (Array.isArray(anneesResponse.data) ? anneesResponse.data : [])
          .filter((annee) => annee.tenantId === user.tenantId),
      })
    } catch (requestError) {
      setModalError(
        getErrorMessage(
          requestError,
          'Impossible de charger les filières et années académiques.',
        ),
      )
    } finally {
      setOptionsLoading(false)
    }
  }

  const submitNewCandidature = async (values) => {
    if (!user?.tenantId) {
      setModalError('Le tenant de votre compte est introuvable. Reconnectez-vous.')
      return
    }

    setModalLoading(true)
    setModalError('')
    try {
      const { data } = await api.post(
        '/candidatures',
        {
          tenantId: user.tenantId,
          nom: values.nom.trim(),
          prenom: values.prenom.trim(),
          email: values.email.trim(),
          telephone: values.telephone?.trim() || undefined,
          dateNaissance: new Date(`${values.dateNaissance}T00:00:00.000Z`).toISOString(),
          lieuNaissance: values.lieuNaissance.trim(),
          nationalite: values.nationalite.trim(),
          filiereId: values.filiereId,
          anneeAcademiqueId: values.anneeAcademiqueId,
        },
        { skipAuth: true },
      )
      setModal('created-candidature')
      setSelectedCandidature(data)
      await loadCandidatures()
    } catch (requestError) {
      setModalError(
        getErrorMessage(requestError, 'La création de la candidature a échoué.'),
      )
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => {
    if (modalLoading) return
    setModal(null)
    setSelectedCandidature(null)
    setModalError('')
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-iuc-blue focus:ring-4 focus:ring-iuc-blue/10'

  return (
    <DashboardLayout>
      <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-semibold text-iuc-blue">Admissions</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Candidatures
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Consultez les dossiers, suivez leur traitement et créez les comptes étudiants.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-iuc-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-iuc-blue/90 focus:outline-none focus:ring-4 focus:ring-iuc-blue/20"
          onClick={openNewCandidature}
          type="button"
        >
          <span aria-hidden="true" className="text-lg leading-none text-iuc-gold">
            +
          </span>
          Nouvelle candidature
        </button>
      </div>

      {successMessage && (
        <div
          role="status"
          className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"
        >
          <span>{successMessage}</span>
          <button
            aria-label="Fermer le message"
            className="shrink-0 rounded-lg px-2 text-lg leading-none text-emerald-600 hover:bg-emerald-100"
            onClick={() => setSuccessMessage('')}
            type="button"
          >
            ×
          </button>
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center"
        >
          <span>{error}</span>
          <button onClick={loadCandidatures} className="font-bold underline" type="button">
            Réessayer
          </button>
        </div>
      )}
      {studentError && (
        <div
          role="alert"
          className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:flex-row sm:items-center"
        >
          {studentError}
          <button
            className="shrink-0 font-bold underline"
            onClick={loadStudents}
            type="button"
          >
            Réessayer
          </button>
        </div>
      )}

      <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Rechercher par nom ou e-mail</span>
          <svg
            aria-hidden="true"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            className={`${inputClass} pl-10`}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par nom ou e-mail"
            type="search"
            value={search}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
          Statut
          <select
            className={`${inputClass} sm:w-44`}
            onChange={(event) => setFilter(event.target.value)}
            value={filter}
          >
            <option value="TOUS">Tous les statuts</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div
            aria-label="Chargement des candidatures"
            className="flex min-h-64 flex-col items-center justify-center gap-3 p-8"
            role="status"
          >
            <span className="h-9 w-9 animate-spin rounded-full border-4 border-iuc-blue/15 border-t-iuc-blue" />
            <span className="text-sm text-slate-500">Chargement des candidatures…</span>
          </div>
        ) : filteredCandidatures.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-700">Aucune candidature</p>
            <p className="mt-2 text-sm text-slate-400">
              {error
                ? 'Les dossiers ne sont pas disponibles pour le moment.'
                : search || filter !== 'TOUS'
                  ? 'Aucun dossier ne correspond à votre recherche.'
                  : 'Les nouveaux dossiers apparaîtront ici.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {[
                    'Numéro dossier',
                    'Nom complet',
                    'Email',
                    'Filière',
                    'Statut',
                    'Date',
                    'Actions',
                  ].map((column) => (
                    <th
                      key={column}
                      className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-400"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidatures.map((candidature) => {
                  const studentExists = hasStudentAccount(candidature)
                  const rowMessage = rowMessages[candidature.id]
                  return (
                    <tr key={candidature.id} className="align-top transition hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-iuc-blue">
                        {candidature.numeroDossier || '—'}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                        {candidature.nom} {candidature.prenom}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">{candidature.email}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {candidature.filiere?.nom ?? '—'}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
                            statusStyles[candidature.statut] ?? 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {statusLabels[candidature.statut] ?? candidature.statut}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                        {formatDate(candidature.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-iuc-blue hover:text-iuc-blue"
                            onClick={() => openDetails(candidature)}
                            type="button"
                          >
                            Voir
                          </button>
                          <button
                            className="rounded-lg border border-iuc-blue/20 px-3 py-2 text-xs font-bold text-iuc-blue transition hover:bg-iuc-blue/5"
                            onClick={() => openStatus(candidature)}
                            type="button"
                          >
                            Changer statut
                          </button>
                          {candidature.statut === 'ACCEPTE' &&
                            !studentExists &&
                            !studentError && (
                            <button
                              className="rounded-lg bg-iuc-gold px-3 py-2 text-xs font-bold text-iuc-blue transition hover:bg-iuc-gold/85 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={
                                studentsLoading || rowLoading[candidature.id]
                              }
                              onClick={() => createStudent(candidature)}
                              type="button"
                            >
                              {studentsLoading
                                ? 'Vérification…'
                                : rowLoading[candidature.id]
                                ? 'Création…'
                                : 'Créer le compte étudiant'}
                            </button>
                          )}
                          {studentExists && (
                            <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                              {createdStudents[candidature.id]?.matricule ||
                                students.find(
                                  (student) =>
                                    student.user?.email?.toLocaleLowerCase() ===
                                    candidature.email?.toLocaleLowerCase(),
                                )?.matricule ||
                                'Compte créé'}
                            </span>
                          )}
                        </div>
                        {rowMessage && (
                          <p
                            className={`mt-2 max-w-sm rounded-lg px-3 py-2 text-xs ${
                              rowMessage.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-red-50 text-red-700'
                            }`}
                            role={rowMessage.type === 'error' ? 'alert' : 'status'}
                          >
                            {rowMessage.text}
                          </p>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {!loading && !error && (
        <p className="mt-4 text-xs text-slate-400">
          {filteredCandidatures.length} dossier
          {filteredCandidatures.length === 1 ? '' : 's'} affiché
          {filteredCandidatures.length === 1 ? '' : 's'}
        </p>
      )}

      {modal === 'details' && selectedCandidature && (
        <Modal onClose={closeModal} title="Détails de la candidature" wide>
          {modalLoading ? (
            <div className="flex items-center justify-center gap-3 py-10" role="status">
              <span className="h-7 w-7 animate-spin rounded-full border-4 border-iuc-blue/15 border-t-iuc-blue" />
              <span className="text-sm text-slate-500">Chargement des détails…</span>
            </div>
          ) : (
            <>
              {modalError && (
                <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800" role="alert">
                  {modalError}
                </p>
              )}
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {[
                  ['Numéro de dossier', selectedCandidature.numeroDossier],
                  ['Statut', statusLabels[selectedCandidature.statut] ?? selectedCandidature.statut],
                  ['Nom', selectedCandidature.nom],
                  ['Prénom', selectedCandidature.prenom],
                  ['E-mail', selectedCandidature.email],
                  ['Téléphone', selectedCandidature.telephone],
                  ['Date de naissance', formatDate(selectedCandidature.dateNaissance)],
                  ['Lieu de naissance', selectedCandidature.lieuNaissance],
                  ['Nationalité', selectedCandidature.nationalite],
                  ['Filière', selectedCandidature.filiere?.nom],
                  ['Année académique', selectedCandidature.anneeAcademique?.libelle],
                  ['Date de soumission', formatDate(selectedCandidature.createdAt)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {label}
                    </dt>
                    <dd className="mt-1 break-words text-sm font-medium text-slate-800">
                      {value || '—'}
                    </dd>
                  </div>
                ))}
              </dl>
              {selectedCandidature.documents?.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <h3 className="text-sm font-bold text-slate-800">Documents</h3>
                  <ul className="mt-2 space-y-2">
                    {selectedCandidature.documents.map((document) => (
                      <li className="text-sm text-slate-600" key={document.id}>
                        {document.typeDocument} — {document.nomFichier}
                        {document.valide ? ' · Validé' : ' · À vérifier'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedCandidature.historiques?.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <h3 className="text-sm font-bold text-slate-800">Historique</h3>
                  <ul className="mt-2 space-y-2">
                    {selectedCandidature.historiques.map((history) => (
                      <li className="text-sm text-slate-600" key={history.id}>
                        {history.action} · {formatDate(history.createdAt)}
                        {history.commentaire ? ` — ${history.commentaire}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </Modal>
      )}

      {modal === 'status' && selectedCandidature && (
        <Modal onClose={closeModal} title="Changer le statut">
          <p className="mb-5 text-sm text-slate-500">
            Dossier <span className="font-semibold text-slate-700">{selectedCandidature.numeroDossier}</span>
          </p>
          <form className="space-y-4" onSubmit={statusForm.handleSubmit(submitStatus)}>
            <Field label="Nouveau statut" error={statusForm.formState.errors.statut}>
              <select
                className={inputClass}
                {...statusForm.register('statut', { required: 'Choisissez un statut.' })}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Commentaire (optionnel)">
              <textarea
                className={inputClass}
                placeholder="Ajouter une note à l’historique…"
                rows={3}
                {...statusForm.register('commentaire')}
              />
            </Field>
            {modalError && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
                {modalError}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                disabled={modalLoading}
                onClick={closeModal}
                type="button"
              >
                Annuler
              </button>
              <button
                className="rounded-xl bg-iuc-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-iuc-blue/90 disabled:opacity-60"
                disabled={modalLoading}
                type="submit"
              >
                {modalLoading ? 'Enregistrement…' : 'Confirmer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'new' && (
        <Modal onClose={closeModal} title="Nouvelle candidature" wide>
          {optionsLoading ? (
            <div className="flex items-center justify-center gap-3 py-10" role="status">
              <span className="h-7 w-7 animate-spin rounded-full border-4 border-iuc-blue/15 border-t-iuc-blue" />
              <span className="text-sm text-slate-500">Chargement des filières et années…</span>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={candidatureForm.handleSubmit(submitNewCandidature)}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom" error={candidatureForm.formState.errors.nom}>
                  <input
                    className={inputClass}
                    {...candidatureForm.register('nom', { required: 'Le nom est requis.' })}
                  />
                </Field>
                <Field label="Prénom" error={candidatureForm.formState.errors.prenom}>
                  <input
                    className={inputClass}
                    {...candidatureForm.register('prenom', {
                      required: 'Le prénom est requis.',
                    })}
                  />
                </Field>
                <Field label="E-mail" error={candidatureForm.formState.errors.email}>
                  <input
                    className={inputClass}
                    type="email"
                    {...candidatureForm.register('email', {
                      required: 'L’e-mail est requis.',
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: 'Saisissez une adresse e-mail valide.',
                      },
                    })}
                  />
                </Field>
                <Field label="Téléphone" error={candidatureForm.formState.errors.telephone}>
                  <input
                    className={inputClass}
                    type="tel"
                    {...candidatureForm.register('telephone')}
                  />
                </Field>
                <Field
                  label="Date de naissance"
                  error={candidatureForm.formState.errors.dateNaissance}
                >
                  <input
                    className={inputClass}
                    type="date"
                    {...candidatureForm.register('dateNaissance', {
                      required: 'La date de naissance est requise.',
                    })}
                  />
                </Field>
                <Field
                  label="Lieu de naissance"
                  error={candidatureForm.formState.errors.lieuNaissance}
                >
                  <input
                    className={inputClass}
                    {...candidatureForm.register('lieuNaissance', {
                      required: 'Le lieu de naissance est requis.',
                    })}
                  />
                </Field>
                <Field label="Nationalité" error={candidatureForm.formState.errors.nationalite}>
                  <input
                    className={inputClass}
                    {...candidatureForm.register('nationalite', {
                      required: 'La nationalité est requise.',
                    })}
                  />
                </Field>
                <Field label="Filière" error={candidatureForm.formState.errors.filiereId}>
                  <select
                    className={inputClass}
                    defaultValue=""
                    {...candidatureForm.register('filiereId', {
                      required: 'Sélectionnez une filière.',
                    })}
                  >
                    <option disabled value="">
                      Sélectionner une filière
                    </option>
                    {options.filieres.map((filiere) => (
                      <option key={filiere.id} value={filiere.id}>
                        {filiere.nom} {filiere.code ? `(${filiere.code})` : ''}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Année académique"
                  error={candidatureForm.formState.errors.anneeAcademiqueId}
                >
                  <select
                    className={inputClass}
                    defaultValue=""
                    {...candidatureForm.register('anneeAcademiqueId', {
                      required: 'Sélectionnez une année académique.',
                    })}
                  >
                    <option disabled value="">
                      Sélectionner une année
                    </option>
                    {options.annees.map((annee) => (
                      <option key={annee.id} value={annee.id}>
                        {annee.libelle}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              {modalError && (
                <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
                  {modalError}
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                  disabled={modalLoading}
                  onClick={closeModal}
                  type="button"
                >
                  Annuler
                </button>
                <button
                  className="rounded-xl bg-iuc-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-iuc-blue/90 disabled:opacity-60"
                  disabled={
                    modalLoading ||
                    options.filieres.length === 0 ||
                    options.annees.length === 0
                  }
                  type="submit"
                >
                  {modalLoading ? 'Envoi…' : 'Créer la candidature'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {modal === 'created-candidature' && selectedCandidature && (
        <Modal onClose={closeModal} title="Candidature créée">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-bold text-emerald-800">
              Dossier {selectedCandidature.numeroDossier} créé avec succès.
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              {selectedCandidature.nom} {selectedCandidature.prenom}
            </p>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              className="rounded-xl bg-iuc-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-iuc-blue/90"
              onClick={closeModal}
              type="button"
            >
              Fermer
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  )
}

export default Candidatures
