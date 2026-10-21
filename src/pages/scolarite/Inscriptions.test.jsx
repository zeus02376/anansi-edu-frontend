import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Inscriptions from './Inscriptions'

const mocks = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

vi.mock('../../services/api', () => ({ default: mocks.api }))
vi.mock('../../components/DashboardLayout', () => ({
  default: ({ children }) => children,
}))

const student = {
  id: 'student-1',
  matricule: 'IUC-2026-00001',
  user: { nom: 'Ngan', prenom: 'Amira', email: 'amira@example.test' },
}
const level = { id: 'level-1', nom: 'Licence 1', code: 'L1', filiere: { id: 'f-1', nom: 'Informatique', code: 'INF' } }
const otherLevel = { id: 'level-2', nom: 'Licence 1', code: 'L1', filiere: { id: 'f-2', nom: 'Gestion', code: 'GES' } }
const year = { id: 'year-1', libelle: '2026-2027' }
const existing = {
  id: 'registration-1',
  etudiantId: student.id,
  niveauId: level.id,
  anneeAcademiqueId: year.id,
  statut: 'EN_ATTENTE',
  fraisPayes: false,
  etudiant: student,
  niveau: level,
  anneeAcademique: year,
  dateInscription: '2026-10-01T00:00:00.000Z',
}

function renderPage() {
  return render(
    <MemoryRouter>
      <Inscriptions />
    </MemoryRouter>,
  )
}

describe('gestion des inscriptions de la scolarité', () => {
  let registrations

  beforeEach(() => {
    registrations = [existing]
    mocks.api.get.mockImplementation((path) => {
      if (path === '/inscriptions') return Promise.resolve({ data: registrations })
      if (path === '/etudiants') return Promise.resolve({ data: [student] })
      if (path === '/niveaux') return Promise.resolve({ data: [level, otherLevel] })
      if (path === '/annees-academiques') return Promise.resolve({ data: [year] })
      return Promise.reject(new Error(`Unexpected GET ${path}`))
    })
    mocks.api.post.mockImplementation((path, data) => {
      expect(path).toBe('/inscriptions')
      registrations = [
        {
          ...existing,
          ...data,
          id: 'registration-2',
          etudiant: student,
          niveau: level,
          anneeAcademique: year,
        },
        ...registrations,
      ]
      return Promise.resolve({ data: registrations[0] })
    })
    mocks.api.put.mockReset()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('affiche et filtre les inscriptions chargées', async () => {
    renderPage()

    expect(await screen.findByText('IUC-2026-00001')).toBeTruthy()
    expect(screen.getByText('Licence 1 (L1)')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Statut'), { target: { value: 'VALIDE' } })
    expect(await screen.findByText('Aucune inscription ne correspond à votre recherche.')).toBeTruthy()
  })

  it('crée une inscription depuis les choix du tenant', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Nouvelle inscription' }))
    await screen.findByRole('dialog')

    await waitFor(() => expect(mocks.api.get).toHaveBeenCalledWith('/etudiants'))
    fireEvent.change(screen.getByLabelText('Étudiant'), { target: { value: student.id } })
    fireEvent.change(screen.getByLabelText('Niveau'), { target: { value: level.id } })
    fireEvent.change(screen.getByLabelText('Année académique'), { target: { value: year.id } })

    fireEvent.click(screen.getByRole('button', { name: 'Créer l’inscription' }))

    await waitFor(() => {
      expect(mocks.api.post).toHaveBeenCalledWith('/inscriptions', {
        etudiantId: student.id,
        niveauId: level.id,
        anneeAcademiqueId: year.id,
        statut: 'EN_ATTENTE',
        fraisPayes: false,
      })
    })
    expect(await screen.findAllByText('Amira Ngan')).toHaveLength(2)
  })

  it('distingue deux niveaux de même nom par leur filière', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Nouvelle inscription' }))
    await screen.findByRole('dialog')
    const options = (await screen.findByLabelText('Niveau')).querySelectorAll('option')
    expect([...options].map((option) => option.textContent)).toEqual([
      'Sélectionner un niveau',
      'Licence 1 (L1) — Informatique',
      'Licence 1 (L1) — Gestion',
    ])
  })

  it('reste lisible si le serveur ne renvoie pas la filière du niveau', async () => {
    const { filiere, ...sansFiliere } = level
    expect(filiere).toBeTruthy()
    mocks.api.get.mockImplementation((path) => {
      if (path === '/inscriptions') return Promise.resolve({ data: registrations })
      if (path === '/etudiants') return Promise.resolve({ data: [student] })
      if (path === '/niveaux') return Promise.resolve({ data: [sansFiliere] })
      if (path === '/annees-academiques') return Promise.resolve({ data: [year] })
      return Promise.reject(new Error(`Unexpected GET ${path}`))
    })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Nouvelle inscription' }))
    expect(await screen.findByRole('option', { name: 'Licence 1 (L1)' })).toBeTruthy()
  })

  describe('modification d’une inscription', () => {
    const refusNotes = {
      response: {
        status: 409,
        data: {
          message:
            'Impossible de modifier le niveau, le statut : cette inscription porte déjà des notes. Traitez d’abord les notes de l’étudiant (seuls les frais d’inscription restent modifiables).',
        },
      },
    }

    async function ouvrirModification() {
      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Modifier' }))
      await screen.findByRole('dialog')
      await screen.findByLabelText('Niveau')
    }

    it('inscription notée : message clair du garde-fou, formulaire conservé, rien d’enregistré', async () => {
      mocks.api.put.mockRejectedValueOnce(refusNotes)
      await ouvrirModification()
      fireEvent.change(screen.getByLabelText('Niveau'), { target: { value: otherLevel.id } })
      fireEvent.change(within(screen.getByRole('dialog')).getByLabelText('Statut'), {
        target: { value: 'VALIDE' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

      const alerte = await screen.findByRole('alert')
      expect(alerte.textContent).toContain('cette inscription porte déjà des notes')
      expect(alerte.textContent).toContain('Rien n’a été modifié')
      expect(alerte.textContent).toContain('seuls les frais d’inscription')
      expect(screen.getByRole('dialog')).toBeTruthy()
      expect(screen.getByLabelText('Niveau').value).toBe(otherLevel.id)
    })

    it('« Rétablir » ramène niveau, année et statut d’origine et permet de n’enregistrer que les frais', async () => {
      mocks.api.put.mockRejectedValueOnce(refusNotes).mockResolvedValueOnce({ data: existing })
      await ouvrirModification()
      fireEvent.change(screen.getByLabelText('Niveau'), { target: { value: otherLevel.id } })
      fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
      fireEvent.click(await screen.findByRole('button', { name: /Rétablir le niveau/ }))

      expect(screen.getByLabelText('Niveau').value).toBe(level.id)
      expect(screen.queryByRole('alert')).toBeNull()

      fireEvent.click(screen.getByLabelText('Frais d’inscription payés'))
      fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
      await waitFor(() => expect(mocks.api.put).toHaveBeenCalledTimes(2))
      expect(mocks.api.put).toHaveBeenLastCalledWith('/inscriptions/registration-1', {
        etudiantId: student.id,
        niveauId: level.id,
        anneeAcademiqueId: year.id,
        statut: 'EN_ATTENTE',
        fraisPayes: true,
      })
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    })

    it('autre conflit (déjà inscrit cette année) : message du serveur, présenté comme un conflit', async () => {
      mocks.api.put.mockRejectedValueOnce({
        response: { status: 409, data: { message: 'Cet étudiant a déjà une inscription pour cette année académique' } },
      })
      await ouvrirModification()
      fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

      const alerte = await screen.findByRole('alert')
      expect(alerte.textContent).toContain('a déjà une inscription pour cette année académique')
      expect(screen.queryByRole('button', { name: /Rétablir/ })).toBeNull()
    })

    it('erreur de validation (400) : message du serveur, sans bouton de rétablissement', async () => {
      mocks.api.put.mockRejectedValueOnce({ response: { status: 400, data: { message: ['niveauId must be a UUID'] } } })
      await ouvrirModification()
      fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
      expect((await screen.findByRole('alert')).textContent).toContain('niveauId must be a UUID')
      expect(screen.queryByRole('button', { name: /Rétablir/ })).toBeNull()
    })
  })
})
