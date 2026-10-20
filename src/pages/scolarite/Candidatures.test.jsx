import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Candidatures from './Candidatures'
import ProtectedRoute from '../../components/ProtectedRoute'

const mocks = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
  fetchCandidatureDocument: vi.fn(),
  retryCandidatureNotification: vi.fn(),
  authState: {
    isAuthenticated: true,
    user: { role: 'ADMIN', tenantId: 'tenant-1' },
  },
}))

vi.mock('../../services/api', () => ({ default: mocks.api }))
vi.mock('../../services/candidatureStaff', () => ({
  fetchCandidatureDocument: mocks.fetchCandidatureDocument,
  retryCandidatureNotification: mocks.retryCandidatureNotification,
}))
vi.mock('../../services/catalogue', () => ({
  fetchEcoles: vi.fn(),
  fetchToutesLesFilieres: vi.fn(),
}))
vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector) => selector(mocks.authState),
}))
vi.mock('../../components/DashboardLayout', () => ({
  default: ({ children }) => children,
}))

const candidature = {
  id: 'candidature-1',
  numeroDossier: 'CAND-2026-TEST',
  nom: 'Ngo',
  prenom: 'Amina',
  email: 'amina@example.test',
  statut: 'ACCEPTE',
  createdAt: '2026-01-15T10:00:00.000Z',
  filiere: { nom: 'Informatique' },
}

const details = {
  ...candidature,
  documents: [
    {
      id: 'document-1',
      typeDocument: 'CNI',
      nomFichier: 'cni.pdf',
      urlFichier: 'https://untrusted.example/file',
      valide: false,
    },
  ],
  notifications: [
    {
      id: 'notification-failed',
      statut: 'ECHEC',
      peutRelancer: true,
      createdAt: '2026-01-15T10:01:00.000Z',
    },
    {
      id: 'notification-sent',
      statut: 'ENVOYEE',
      createdAt: '2026-01-15T10:02:00.000Z',
      envoyeLe: '2026-01-15T10:03:00.000Z',
    },
  ],
}

function renderStaffPage() {
  return render(
    <MemoryRouter initialEntries={['/scolarite/candidatures']}>
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SCOLARITE']} />}>
          <Route path="/scolarite/candidatures" element={<Candidatures />} />
        </Route>
        <Route path="/login" element={<p>Connexion</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function openDetails() {
  fireEvent.click(await screen.findByRole('button', { name: 'Voir' }))
  await screen.findByRole('button', { name: 'Ouvrir / télécharger' })
}

describe('gestion des candidatures côté personnel', () => {
  beforeEach(() => {
    mocks.authState.isAuthenticated = true
    mocks.authState.user = { role: 'ADMIN', tenantId: 'tenant-1' }
    mocks.api.get.mockImplementation((path) => {
      if (path === '/candidatures') return Promise.resolve({ data: [candidature] })
      if (path === '/etudiants') return Promise.resolve({ data: [] })
      if (path === `/candidatures/${candidature.id}`) {
        return Promise.resolve({ data: details })
      }
      return Promise.reject(new Error(`Unexpected GET ${path}`))
    })
    mocks.api.post.mockReset()
    mocks.api.patch.mockReset()
    mocks.fetchCandidatureDocument.mockReset()
    mocks.fetchCandidatureDocument.mockResolvedValue(
      new Blob(['document'], { type: 'application/pdf' }),
    )
    mocks.retryCandidatureNotification.mockReset()
    Object.defineProperty(window, 'open', {
      configurable: true,
      value: vi.fn(() => ({
        opener: window,
        location: { replace: vi.fn() },
        close: vi.fn(),
      })),
    })
    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      value: vi.fn(),
    })
    URL.createObjectURL = vi.fn(() => 'blob:document-preview')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it.each(['ADMIN', 'SCOLARITE'])('autorise le rôle %s à consulter les candidatures', async (role) => {
    mocks.authState.user = { role, tenantId: 'tenant-1' }
    renderStaffPage()
    expect(await screen.findByRole('heading', { name: 'Candidatures' })).toBeTruthy()
  })

  it('refuse l’accès aux rôles non autorisés', () => {
    mocks.authState.user = { role: 'ETUDIANT', tenantId: 'tenant-1' }
    renderStaffPage()
    expect(screen.getByText('Connexion')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Candidatures' })).toBeNull()
  })

  it('ouvre le document via l’API authentifiée sans utiliser son URL déclarée', async () => {
    const { container } = renderStaffPage()
    await openDetails()

    expect(screen.getByText('Échec')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Relancer l’envoi' })).toBeTruthy()
    expect(container.querySelector('a[href="https://untrusted.example/file"]')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir / télécharger' }))

    await waitFor(() =>
      expect(mocks.fetchCandidatureDocument).toHaveBeenCalledWith(
        candidature.id,
        'document-1',
      ),
    )
    expect(window.open).toHaveBeenCalledWith('', '_blank')
  })

  it('permet de relancer un envoi en échec et affiche son nouvel état', async () => {
    mocks.retryCandidatureNotification.mockResolvedValue({
      id: 'notification-failed',
      statut: 'EN_COURS',
      peutRelancer: false,
    })
    renderStaffPage()
    await openDetails()
    fireEvent.click(screen.getByRole('button', { name: 'Relancer l’envoi' }))

    expect((await screen.findByRole('status')).textContent).toContain(
      'Le courriel est en cours d’envoi.',
    )
    expect(mocks.retryCandidatureNotification).toHaveBeenCalledWith(
      candidature.id,
      'notification-failed',
    )
    expect(screen.getByText('En cours d’envoi')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Relancer l’envoi' })).toBeNull()
  })

  it('n’offre une relance que si le backend indique peutRelancer', async () => {
    mocks.api.get.mockImplementation((path) => {
      if (path === '/candidatures') return Promise.resolve({ data: [candidature] })
      if (path === '/etudiants') return Promise.resolve({ data: [] })
      if (path === `/candidatures/${candidature.id}`) {
        return Promise.resolve({
          data: {
            ...details,
            notifications: [{ ...details.notifications[0], peutRelancer: false }],
          },
        })
      }
      return Promise.reject(new Error(`Unexpected GET ${path}`))
    })
    renderStaffPage()
    await openDetails()

    expect(screen.getByText('Cette notification ne peut plus être relancée.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Relancer l’envoi' })).toBeNull()
  })

  it('affiche le message API si la mise à jour du statut échoue', async () => {
    mocks.api.patch.mockRejectedValue({
      response: { data: { message: 'Transition refusée par le serveur.' } },
    })
    renderStaffPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Changer statut' }))
    fireEvent.change(screen.getByLabelText('Nouveau statut'), {
      target: { value: 'REJETE' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer' }))

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Le statut n’a pas été modifié. Transition refusée par le serveur.',
    )
  })

  it('confirme que le statut est enregistré même si son courriel échoue', async () => {
    mocks.api.patch.mockResolvedValue({
      data: { notification: { statut: 'ECHEC' } },
    })
    renderStaffPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Changer statut' }))
    fireEvent.change(screen.getByLabelText('Nouveau statut'), {
      target: { value: 'EN_EXAMEN' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer' }))

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Le statut de la candidature est enregistré, mais le courriel n’a pas été envoyé.',
    )
  })

  it('crée un compte étudiant depuis une candidature acceptée', async () => {
    mocks.api.post.mockResolvedValue({
      data: {
        id: 'student-1',
        candidatureId: candidature.id,
        matricule: 'MAT-001',
        email: candidature.email,
        motDePasseTemporaire: 'Temporaire-123',
      },
    })
    renderStaffPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Créer le compte étudiant' }))

    expect(await screen.findByText(/Étudiant créé avec le matricule MAT-001/)).toBeTruthy()
    // L'établissement vient du JWT côté serveur : seul candidatureId est envoyé
    expect(mocks.api.post).toHaveBeenCalledWith('/etudiants', {
      candidatureId: candidature.id,
    })
  })

  describe('suivi d’une notification en cours d’envoi', () => {
    const enCours = { id: 'notification-slow', statut: 'EN_COURS', peutRelancer: false, createdAt: '2026-01-15T10:01:00.000Z' }
    const envoyee = { ...enCours, statut: 'ENVOYEE', envoyeLe: '2026-01-15T10:01:05.000Z' }
    const detailAvec = (notification) => ({ data: { ...details, notifications: [notification] } })
    const appelsDetail = () =>
      mocks.api.get.mock.calls.filter(([path]) => path === `/candidatures/${candidature.id}`).length

    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('met à jour le détail sans rechargement jusqu’à l’état final, puis arrête de sonder', async () => {
      let notification = enCours
      mocks.api.get.mockImplementation((path) => {
        if (path === '/candidatures') return Promise.resolve({ data: [candidature] })
        if (path === '/etudiants') return Promise.resolve({ data: [] })
        return Promise.resolve(detailAvec(notification))
      })
      renderStaffPage()
      await openDetails()
      expect(screen.getByText('En cours d’envoi')).toBeTruthy()
      expect(appelsDetail()).toBe(1)

      notification = envoyee
      await vi.advanceTimersByTimeAsync(3000)
      expect(await screen.findByText('Envoyée')).toBeTruthy()
      expect(screen.queryByText('En cours d’envoi')).toBeNull()

      const appels = appelsDetail()
      await vi.advanceTimersByTimeAsync(15000)
      expect(appelsDetail()).toBe(appels)
    })

    it('abandonne après 10 relectures si la notification reste en cours', async () => {
      mocks.api.get.mockImplementation((path) => {
        if (path === '/candidatures') return Promise.resolve({ data: [candidature] })
        if (path === '/etudiants') return Promise.resolve({ data: [] })
        return Promise.resolve(detailAvec(enCours))
      })
      renderStaffPage()
      await openDetails()

      await vi.advanceTimersByTimeAsync(3000 * 10)
      expect(appelsDetail()).toBe(1 + 10)
      await vi.advanceTimersByTimeAsync(30000)
      expect(appelsDetail()).toBe(1 + 10)
    })

    it('ne sonde pas quand toutes les notifications sont dans un état final', async () => {
      renderStaffPage()
      await openDetails()
      await vi.advanceTimersByTimeAsync(10000)
      expect(appelsDetail()).toBe(1)
    })

    it('après un changement de statut, met à jour le message de la ligne quand le courriel part', async () => {
      let notification = enCours
      mocks.api.get.mockImplementation((path) => {
        if (path === '/candidatures') return Promise.resolve({ data: [candidature] })
        if (path === '/etudiants') return Promise.resolve({ data: [] })
        return Promise.resolve(detailAvec(notification))
      })
      mocks.api.patch.mockResolvedValue({ data: { notification: enCours } })
      renderStaffPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Changer statut' }))
      fireEvent.change(screen.getByLabelText('Nouveau statut'), { target: { value: 'EN_EXAMEN' } })
      fireEvent.click(screen.getByRole('button', { name: 'Confirmer' }))
      expect((await screen.findByRole('status')).textContent).toContain('Le courriel est en cours d’envoi.')

      notification = envoyee
      await vi.advanceTimersByTimeAsync(3000)
      await waitFor(() =>
        expect(screen.getByRole('status').textContent).toContain('Le courriel a été envoyé avec succès.'),
      )
    })

    it('signale un échec final détecté pendant le suivi', async () => {
      let notification = enCours
      mocks.api.get.mockImplementation((path) => {
        if (path === '/candidatures') return Promise.resolve({ data: [candidature] })
        if (path === '/etudiants') return Promise.resolve({ data: [] })
        return Promise.resolve(detailAvec(notification))
      })
      mocks.api.patch.mockResolvedValue({ data: { notification: enCours } })
      renderStaffPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Changer statut' }))
      fireEvent.change(screen.getByLabelText('Nouveau statut'), { target: { value: 'EN_EXAMEN' } })
      fireEvent.click(screen.getByRole('button', { name: 'Confirmer' }))
      await screen.findByRole('status')

      notification = { ...enCours, statut: 'ECHEC', peutRelancer: true }
      await vi.advanceTimersByTimeAsync(3000)
      expect((await screen.findByRole('alert')).textContent).toContain('le courriel n’a pas été envoyé')
    })
  })
})
