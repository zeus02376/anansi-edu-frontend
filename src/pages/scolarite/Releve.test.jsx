import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Releve from './Releve'

const mocks = vi.hoisted(() => ({
  fetchEtudiants: vi.fn(),
  fetchReleve: vi.fn(),
}))

vi.mock('../../services/notesPersonnel', () => mocks)
vi.mock('../../components/DashboardLayout', () => ({ default: ({ children }) => children }))

const etudiants = [
  { id: 'e1', matricule: 'IUC-2026-00001', matriculeIuc: 'IUC26E1234567', user: { nom: 'Mballa', prenom: 'Amina' } },
  { id: 'e2', matricule: 'IUC-2026-00002', matriculeIuc: null, user: { nom: 'Ngono', prenom: 'Élise' } },
]

const anneeReleve = (id, libelle, moyenneGenerale, note) => ({
  annee: { id, libelle, dateDebut: id === 'a2' ? '2026-01-01' : '2025-01-01', dateFin: id === 'a2' ? '2026-12-31' : '2025-12-31' },
  niveau: { nom: 'Licence 1' },
  moyenneGenerale,
  matieres: [
    {
      id: 'm1',
      nom: 'Algorithmique',
      code: 'ALG',
      coefficient: 2,
      moyenne: moyenneGenerale,
      evaluations: [
        {
          id: `ev-${id}`,
          nom: 'Devoir 1',
          type: 'DEVOIR',
          coefficient: 1,
          bareme: 20,
          note,
        },
      ],
    },
  ],
})

const rendre = () =>
  render(
    <MemoryRouter>
      <Releve />
    </MemoryRouter>,
  )

const chercher = async (terme) => {
  fireEvent.change(await screen.findByLabelText(/Rechercher/), { target: { value: terme } })
}

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset())
  mocks.fetchEtudiants.mockResolvedValue(etudiants)
  mocks.fetchReleve.mockResolvedValue({
    annees: [
      anneeReleve('a2', '2026-2027', 14, { etat: 'NOTEE', valeur: 14, commentaire: 'Bon travail' }),
      anneeReleve('a1', '2025-2026', 11, { etat: 'ABSENT', valeur: null }),
    ],
  })
})
afterEach(cleanup)

describe('relevé de notes du personnel', () => {
  it('ne montre rien tant qu’aucun étudiant n’est choisi', async () => {
    rendre()
    await screen.findByLabelText(/Rechercher/)
    expect(screen.queryByTestId('resultats')).toBeNull()
    expect(mocks.fetchReleve).not.toHaveBeenCalled()
  })

  it('recherche sans tenir compte des accents ni de la casse, y compris par matricule IUC', async () => {
    rendre()
    await chercher('elise')
    expect(within(screen.getByTestId('resultats')).getByText('Élise Ngono')).toBeTruthy()

    await chercher('iuc26e1234567')
    const resultats = screen.getByTestId('resultats')
    expect(within(resultats).getByText('Amina Mballa')).toBeTruthy()
    expect(within(resultats).queryByText('Élise Ngono')).toBeNull()

    await chercher('zzz')
    expect(screen.getByText('Aucun étudiant ne correspond à cette recherche.')).toBeTruthy()
  })

  it('affiche le relevé de l’année courante, provisoire, avec commentaire et matricules', async () => {
    rendre()
    await chercher('mballa')
    fireEvent.click(within(screen.getByTestId('resultats')).getByRole('button'))

    expect(await screen.findByTestId('moyenne-generale')).toBeTruthy()
    expect(mocks.fetchReleve).toHaveBeenCalledWith('e1', undefined, expect.anything())
    expect(screen.getByTestId('moyenne-generale').textContent).toContain('14')
    expect(screen.getByText('Provisoire')).toBeTruthy()
    expect(screen.getByRole('note').textContent).toContain('Ce n’est pas un résultat définitif')
    expect(screen.getByTestId('etudiant-choisi').textContent).toContain('IUC26E1234567')
    const matiere = screen.getByTestId('matiere-ALG')
    expect(within(matiere).getAllByText('14 / 20')).toHaveLength(2) // moyenne de la matière + note
    expect(within(matiere).getByText('« Bon travail »')).toBeTruthy()
    // Libellés adaptés au personnel, pas à l'étudiant
    expect(screen.getByRole('heading', { name: 'Matières' })).toBeTruthy()
    expect(screen.queryByText('Mes matières')).toBeNull()
  })

  it('changer d’année charge cette année et signale l’absent comme comptant 0', async () => {
    rendre()
    await chercher('mballa')
    fireEvent.click(within(screen.getByTestId('resultats')).getByRole('button'))
    await screen.findByTestId('moyenne-generale')

    fireEvent.change(screen.getByLabelText('Année académique'), { target: { value: 'a1' } })
    await waitFor(() => expect(mocks.fetchReleve).toHaveBeenLastCalledWith('e1', 'a1', expect.anything()))
    await waitFor(() => expect(screen.getByTestId('moyenne-generale').textContent).toContain('11'))
    expect(screen.getByText('(compte 0)')).toBeTruthy()
    expect(screen.getByText('Provisoire')).toBeTruthy()
  })

  it('étudiant sans inscription : message explicite', async () => {
    mocks.fetchReleve.mockResolvedValue({ annees: [] })
    rendre()
    await chercher('ngono')
    fireEvent.click(within(screen.getByTestId('resultats')).getByRole('button'))
    expect(await screen.findByText(/aucune inscription/)).toBeTruthy()
  })

  it('erreur du serveur sur le relevé : message et « Réessayer »', async () => {
    mocks.fetchReleve.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Erreur interne' } } })
    rendre()
    await chercher('mballa')
    fireEvent.click(within(screen.getByTestId('resultats')).getByRole('button'))
    expect((await screen.findByRole('alert')).textContent).toContain('Erreur interne')
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByTestId('moyenne-generale')).toBeTruthy()
  })
})
