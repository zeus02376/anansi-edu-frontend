import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Etudiants from './Etudiants'

const mocks = vi.hoisted(() => ({
  api: { get: vi.fn() },
}))

vi.mock('../../services/api', () => ({ default: mocks.api }))
vi.mock('../../components/DashboardLayout', () => ({
  default: ({ children }) => children,
}))

const student = {
  id: 'student-1',
  matricule: 'IUC-2026-00001',
  dateNaissance: '2005-02-03T00:00:00.000Z',
  lieuNaissance: 'Douala',
  nationalite: 'Camerounaise',
  user: { nom: 'Ngan', prenom: 'Amira', email: 'amira@example.test' },
  inscriptions: [{ id: 'registration-1' }],
}

function renderPage() {
  return render(
    <MemoryRouter>
      <Etudiants />
    </MemoryRouter>,
  )
}

describe('répertoire des étudiants', () => {
  beforeEach(() => {
    mocks.api.get.mockImplementation((path) => {
      if (path === '/etudiants') return Promise.resolve({ data: [student] })
      if (path === '/etudiants/student-1') {
        return Promise.resolve({
          data: {
            ...student,
            inscriptions: [
              {
                id: 'registration-1',
                statut: 'VALIDE',
                dateInscription: '2026-10-01T00:00:00.000Z',
                niveau: { nom: 'Licence 1' },
                anneeAcademique: { libelle: '2026-2027' },
              },
            ],
          },
        })
      }
      return Promise.reject(new Error(`Unexpected GET ${path}`))
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('recherche les étudiants par nom, e-mail ou matricule', async () => {
    renderPage()

    expect(await screen.findByText('amira@example.test')).toBeTruthy()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher un étudiant' }), {
      target: { value: 'IUC-2026' },
    })
    expect(screen.getByText('Amira Ngan')).toBeTruthy()

    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher un étudiant' }), {
      target: { value: 'absent' },
    })
    expect(await screen.findByText('Aucun étudiant ne correspond à votre recherche.')).toBeTruthy()
  })

  it('consulte le profil et les inscriptions de l’étudiant', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Voir le dossier' }))

    expect(await screen.findByText('Licence 1')).toBeTruthy()
    expect(screen.getByText(/Année 2026-2027/)).toBeTruthy()
    expect(screen.getByText('Validée')).toBeTruthy()
  })
})
