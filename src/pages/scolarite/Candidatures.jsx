import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import DashboardLayout from '../../components/DashboardLayout'
import Field from '../../components/ui/Field'
import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/ui/StatusBadge'
import { inputClass } from '../../components/ui/styles'
import api from '../../services/api'
import {
  fetchCandidatureDocument,
  retryCandidatureNotification,
} from '../../services/candidatureStaff'
import { fetchEcoles, fetchToutesLesFilieres } from '../../services/catalogue'
import { useAuthStore } from '../../stores/authStore'
import { statuses, statusLabels } from '../../utils/candidatureStatus'
import { getErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'

const notificationLabels = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours d’envoi',
  ENVOYEE: 'Envoyée',
  ECHEC: 'Échec',
}

const notificationStatus = (notification) => notification?.statut

// Un SMTP lent laisse la notification « en cours » : on relit le dossier toutes les
// 3 s (30 s au plus) jusqu'à son état final, sans que le personnel recharge la liste.
const PENDING_NOTIFICATIONS = ['EN_ATTENTE', 'EN_COURS']
const isPending = (status) => PENDING_NOTIFICATIONS.includes(status)
const hasPendingNotification = (candidature) =>
  Boolean(candidature?.notifications?.some((item) => isPending(notificationStatus(item))))
const NOTIFICATION_POLL_MS = 3000
const NOTIFICATION_POLL_MAX_ATTEMPTS = 10

const safeDocumentName = (name, id) => {
  const safeName = Array.from(String(name || `document-${id}`), (character) => {
    const code = character.charCodeAt(0)
    return /[\\/:*?"<>|]/.test(character) || code < 32 || code === 127
      ? '_'
      : character
  })
    .join('')
    .trim()
  return safeName || `document-${id}`
}

const notificationStatusMessage = (status, isRetry = false) => {
  if (status === 'ENVOYEE') return 'Le courriel a été envoyé avec succès.'
  if (status === 'ECHEC') {
    return isRetry
      ? 'Le nouvel envoi a échoué. Le statut de la candidature reste enregistré ; vous pouvez réessayer.'
      : 'Le statut de la candidature est enregistré, mais le courriel n’a pas été envoyé. Vous pouvez réessayer depuis les détails.'
  }
  if (status === 'EN_COURS') return 'Le courriel est en cours d’envoi.'
  if (status === 'EN_ATTENTE') return 'Le courriel est en attente d’envoi.'
  return 'Le statut a bien été enregistré.'
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
  const [documentLoading, setDocumentLoading] = useState({})
  const [documentErrors, setDocumentErrors] = useState({})
  const [notificationLoading, setNotificationLoading] = useState({})
  const [notificationMessage, setNotificationMessage] = useState(null)
  const [watched, setWatched] = useState([])
  const pollAttempts = useRef({})
  const [createdStudents, setCreatedStudents] = useState({})
  const [createdAccount, setCreatedAccount] = useState(null)
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

  const watchNotifications = useCallback((candidatureId) => {
    pollAttempts.current[candidatureId] = 0
    setWatched((current) => (current.includes(candidatureId) ? current : [...current, candidatureId]))
  }, [])

  // Suit les dossiers dont une notification est encore « en cours » (voir PENDING_NOTIFICATIONS)
  useEffect(() => {
    if (!watched.length) return undefined
    const timer = window.setInterval(async () => {
      const finished = []
      for (const candidatureId of watched) {
        pollAttempts.current[candidatureId] = (pollAttempts.current[candidatureId] ?? 0) + 1
        const gaveUp = pollAttempts.current[candidatureId] >= NOTIFICATION_POLL_MAX_ATTEMPTS
        try {
          const { data } = await api.get(`/candidatures/${candidatureId}`)
          setSelectedCandidature((current) =>
            current?.id === candidatureId ? { ...current, ...data } : current,
          )
          if (!hasPendingNotification(data)) {
            const status = notificationStatus(data.notifications?.[0])
            setRowMessages((current) => ({
              ...current,
              [candidatureId]: {
                type: status === 'ECHEC' ? 'error' : 'success',
                text: notificationStatusMessage(status),
              },
            }))
            finished.push(candidatureId)
            continue
          }
        } catch {
          // erreur passagère : on réessaie au prochain passage
        }
        if (gaveUp) finished.push(candidatureId)
      }
      if (finished.length) {
        setWatched((current) => current.filter((id) => !finished.includes(id)))
      }
    }, NOTIFICATION_POLL_MS)
    return () => window.clearInterval(timer)
  }, [watched])

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

  // Compte étudiant créé depuis cette candidature (lien exact par candidatureId)
  const studentFor = (candidature) =>
    createdStudents[candidature.id] ??
    students.find((student) => student.candidatureId === candidature.id)
  const hasStudentAccount = (candidature) => Boolean(studentFor(candidature))

  const openDetails = async (candidature) => {
    setSelectedCandidature(candidature)
    setModal('details')
    setModalLoading(true)
    setModalError('')
    try {
      const { data } = await api.get(`/candidatures/${candidature.id}`)
      setSelectedCandidature({ ...candidature, ...data })
      if (hasPendingNotification(data)) watchNotifications(candidature.id)
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
      const { data } = await api.patch(`/candidatures/${selectedCandidature.id}/statut`, {
        statut,
        ...(commentaire.trim() ? { commentaire: commentaire.trim() } : {}),
      })
      const candidatureId = selectedCandidature.id
      const deliveryStatus = notificationStatus(data?.notification)
      setModal(null)
      setSelectedCandidature(null)
      await loadCandidatures()
      await loadStudents()
      setRowMessages((current) => ({
        ...current,
        [candidatureId]: {
          type: deliveryStatus === 'ECHEC' ? 'error' : 'success',
          text: notificationStatusMessage(deliveryStatus),
        },
      }))
      if (isPending(deliveryStatus)) watchNotifications(candidatureId)
    } catch (requestError) {
      setModalError(
        `Le statut n’a pas été modifié. ${getErrorMessage(
          requestError,
          'Veuillez réessayer.',
        )}`,
      )
    } finally {
      setModalLoading(false)
    }
  }

  const openDocument = async (document) => {
    const candidatureId = selectedCandidature?.id
    if (!candidatureId) return

    // Ouvre la fenêtre dans le geste utilisateur pour éviter son blocage après l'appel API.
    const previewWindow = window.open('', '_blank')
    if (previewWindow) previewWindow.opener = null
    setDocumentErrors((current) => ({ ...current, [document.id]: '' }))
    setDocumentLoading((current) => ({ ...current, [document.id]: true }))
    try {
      const blob = await fetchCandidatureDocument(candidatureId, document.id)
      const objectUrl = URL.createObjectURL(blob)
      if (previewWindow) {
        previewWindow.location.replace(objectUrl)
      } else {
        const link = window.document.createElement('a')
        link.href = objectUrl
        link.download = safeDocumentName(document.nomFichier, document.id)
        link.rel = 'noopener'
        window.document.body.appendChild(link)
        link.click()
        link.remove()
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
    } catch (requestError) {
      previewWindow?.close()
      setDocumentErrors((current) => ({
        ...current,
        [document.id]: getErrorMessage(
          requestError,
          'Impossible d’ouvrir ce document. Vérifiez vos droits puis réessayez.',
        ),
      }))
    } finally {
      setDocumentLoading((current) => ({ ...current, [document.id]: false }))
    }
  }

  const retryNotification = async (notification) => {
    const candidatureId = selectedCandidature?.id
    if (!candidatureId) return
    setNotificationLoading((current) => ({ ...current, [notification.id]: true }))
    setNotificationMessage(null)
    try {
      const result = await retryCandidatureNotification(candidatureId, notification.id)
      const updatedNotification = result?.notification ?? result
      const status = notificationStatus(updatedNotification)
      setSelectedCandidature((current) => ({
        ...current,
        notifications: current.notifications.map((item) =>
          item.id === notification.id ? { ...item, ...updatedNotification } : item,
        ),
      }))
      setNotificationMessage({
        type: status === 'ECHEC' ? 'error' : 'success',
        text: notificationStatusMessage(status, true),
      })
      if (isPending(status)) watchNotifications(candidatureId)
    } catch (requestError) {
      setNotificationMessage({
        type: 'error',
        text: `Le nouvel envoi n’a pas pu être lancé. ${getErrorMessage(
          requestError,
          'Veuillez réessayer.',
        )}`,
      })
    } finally {
      setNotificationLoading((current) => ({ ...current, [notification.id]: false }))
    }
  }

  const createStudent = async (candidature) => {
    setRowLoading((current) => ({ ...current, [candidature.id]: true }))
    setRowMessages((current) => ({ ...current, [candidature.id]: null }))
    try {
      // L'établissement vient du JWT côté serveur : seul l'identifiant de la candidature est envoyé
      const { data } = await api.post('/etudiants', { candidatureId: candidature.id })
      // Le mot de passe temporaire n'est gardé que dans l'alerte, pas dans les listes
      const { motDePasseTemporaire, ...student } = data
      setCreatedStudents((current) => ({ ...current, [candidature.id]: student }))
      setStudents((current) => [...current, student])
      setCreatedAccount({
        matricule: student.matricule,
        nomComplet: `${candidature.prenom} ${candidature.nom}`,
        email: candidature.email,
        motDePasseTemporaire,
      })
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
      // /filieres et /ecoles sont publiques (sans JWT) ; /annees-academiques exige encore un JWT
      const [filieresData, anneesResponse, ecolesData] = await Promise.all([
        fetchToutesLesFilieres(),
        api.get('/annees-academiques'),
        fetchEcoles(),
      ])
      const tenantEcoleIds = new Set(
        (Array.isArray(ecolesData) ? ecolesData : [])
          .filter((ecole) => ecole.tenantId === user.tenantId)
          .map((ecole) => ecole.id),
      )
      setOptions({
        filieres: (Array.isArray(filieresData) ? filieresData : [])
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

  return (
    <DashboardLayout>
      <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-semibold text-iuc-red">Admissions</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Candidatures
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Consultez les dossiers, suivez leur traitement et créez les comptes étudiants.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-iuc-red px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-iuc-red/90 focus:outline-none focus:ring-4 focus:ring-iuc-red/20"
          onClick={openNewCandidature}
          type="button"
        >
          <span aria-hidden="true" className="text-lg leading-none text-white">
            +
          </span>
          Nouvelle candidature
        </button>
      </div>

      {createdAccount && (
        <div
          role="status"
          className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <div className="min-w-0 space-y-2">
            <p className="font-semibold">
              Étudiant créé avec le matricule {createdAccount.matricule} (
              {createdAccount.nomComplet})
            </p>
            {createdAccount.motDePasseTemporaire && (
              <>
                <p>
                  Identifiant : <span className="font-semibold">{createdAccount.email}</span>
                  <br />
                  Mot de passe temporaire :{' '}
                  <code className="select-all rounded-md bg-white px-2 py-0.5 font-mono text-base font-bold tracking-wider text-iuc-red ring-1 ring-emerald-200">
                    {createdAccount.motDePasseTemporaire}
                  </code>
                </p>
                <p className="rounded-lg bg-amber-50 px-3 py-2 font-semibold text-amber-800 ring-1 ring-amber-200">
                  ⚠ À noter maintenant : ce mot de passe ne sera plus jamais affiché.
                  L’étudiant devra le changer à sa première connexion.
                </p>
              </>
            )}
          </div>
          <button
            aria-label="Fermer le message"
            className="shrink-0 rounded-lg px-2 text-lg leading-none text-emerald-600 hover:bg-emerald-100"
            onClick={() => setCreatedAccount(null)}
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
            <span className="h-9 w-9 animate-spin rounded-full border-4 border-iuc-red/15 border-t-iuc-red" />
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
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-iuc-red">
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
                        <StatusBadge statut={candidature.statut} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                        {formatDate(candidature.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-iuc-red hover:text-iuc-red"
                            onClick={() => openDetails(candidature)}
                            type="button"
                          >
                            Voir
                          </button>
                          <button
                            className="rounded-lg border border-iuc-red/20 px-3 py-2 text-xs font-bold text-iuc-red transition hover:bg-iuc-red/5"
                            onClick={() => openStatus(candidature)}
                            type="button"
                          >
                            Changer statut
                          </button>
                          {candidature.statut === 'ACCEPTE' &&
                            !studentExists &&
                            !studentError && (
                            <button
                              className="rounded-lg bg-iuc-green px-3 py-2 text-xs font-bold text-white transition hover:bg-iuc-green/85 disabled:cursor-not-allowed disabled:opacity-60"
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
                              {studentFor(candidature)?.matricule || 'Compte créé'}
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
              <span className="h-7 w-7 animate-spin rounded-full border-4 border-iuc-red/15 border-t-iuc-red" />
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
                      <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600" key={document.id}>
                        <span className="min-w-0 break-words">
                          {document.typeDocument} — {document.nomFichier}
                          {document.valide ? ' · Validé' : ' · À vérifier'}
                        </span>
                        <button
                          className="shrink-0 rounded-lg border border-iuc-red/20 px-3 py-2 text-xs font-bold text-iuc-red transition hover:bg-iuc-red/5 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={documentLoading[document.id]}
                          onClick={() => openDocument(document)}
                          type="button"
                        >
                          {documentLoading[document.id] ? 'Chargement…' : 'Ouvrir / télécharger'}
                        </button>
                        {documentErrors[document.id] && (
                          <p className="w-full text-xs text-red-700" role="alert">
                            {documentErrors[document.id]}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedCandidature.notifications?.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <h3 className="text-sm font-bold text-slate-800">Notifications par e-mail</h3>
                  <ul className="mt-2 space-y-3">
                    {selectedCandidature.notifications.map((notification) => {
                      const status = notificationStatus(notification)
                      return (
                        <li
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"
                          key={notification.id}
                        >
                          <div className="text-sm text-slate-600">
                            <p className="font-semibold text-slate-800">
                              {notificationLabels[status] ?? status ?? 'État inconnu'}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Créée le {formatDate(notification.createdAt)}
                              {notification.envoyeLe
                                ? ` · Envoyée le ${formatDate(notification.envoyeLe)}`
                                : ''}
                            </p>
                            {status === 'ECHEC' && (
                              <p className="mt-1 text-xs text-amber-800">
                                L’envoi a échoué. Vous pouvez relancer le courriel.
                              </p>
                            )}
                          </div>
                          {status === 'ECHEC' && notification.peutRelancer && (
                            <button
                              className="rounded-lg border border-iuc-red/20 px-3 py-2 text-xs font-bold text-iuc-red transition hover:bg-iuc-red/5 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={notificationLoading[notification.id]}
                              onClick={() => retryNotification(notification)}
                              type="button"
                            >
                              {notificationLoading[notification.id]
                                ? 'Relance…'
                                : 'Relancer l’envoi'}
                            </button>
                          )}
                          {status === 'ECHEC' && !notification.peutRelancer && (
                            <p className="text-xs text-slate-500">
                              Cette notification ne peut plus être relancée.
                            </p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  {notificationMessage && (
                    <p
                      className={`mt-3 rounded-xl p-3 text-sm ${
                        notificationMessage.type === 'error'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}
                      role={notificationMessage.type === 'error' ? 'alert' : 'status'}
                    >
                      {notificationMessage.text}
                    </p>
                  )}
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
                className="rounded-xl bg-iuc-red px-4 py-2.5 text-sm font-bold text-white hover:bg-iuc-red/90 disabled:opacity-60"
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
              <span className="h-7 w-7 animate-spin rounded-full border-4 border-iuc-red/15 border-t-iuc-red" />
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
                  className="rounded-xl bg-iuc-red px-4 py-2.5 text-sm font-bold text-white hover:bg-iuc-red/90 disabled:opacity-60"
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
              className="rounded-xl bg-iuc-red px-4 py-2.5 text-sm font-bold text-white hover:bg-iuc-red/90"
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
