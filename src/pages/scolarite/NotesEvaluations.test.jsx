import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotesEvaluations from './NotesEvaluations'

const mocks = vi.hoisted(() => ({
  fetchAnnees: vi.fn(),
  fetchMatieres: vi.fn(),
  fetchEvaluationsPersonnel: vi.fn(),
  depublierEvaluation: vi.fn(),
  publierEvaluationPersonnel: vi.fn(),
}))

vi.mock('../../services/notesPersonnel', () => mocks)
vi.mock('../../components/DashboardLayout', () => ({ default: ({ children }) => children }))

const annees = [
  { id: 'a1', libelle: '2025-2026', active: false, dateDebut: '2025-09-01' },
  { id: 'a2', libelle: '2026-2027', active: true, dateDebut: '2026-09-01' },
]
const matieres = [
  { id: 'm1', nom: 'Algorithmique', code: 'ALG', anneeAcademiqueId: 'a2' },
  { id: 'm2', nom: 'Réseaux', code: 'RES', anneeAcademiqueId: 'a1' },
]
const evaluation = (id, nom, statut, notes) => ({
  id,
  nom,
  type: 'DEVOIR',
  coefficient: 1,
  bareme: 20,
  statut,
  publieLe: statut === 'PUBLIEE' ? '2026-10-21T10:00:00.000Z' : null,
  matiere: { id: 'm1', nom: 'Algorithmique', code: 'ALG' },
  createur: { nom: 'Kamga', prenom: 'Joseph' },
  _count: { notes },
})

const rendre = () =>
  render(
    <MemoryRouter>
      <NotesEvaluations />
    </MemoryRouter>,
  )

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset())
  mocks.fetchAnnees.mockResolvedValue(annees)
  mocks.fetchMatieres.mockResolvedValue(matieres)
  mocks.fetchEvaluationsPersonnel.mockResolvedValue([
    evaluation('e1', 'Devoir 1', 'PUBLIEE', 3),
    evaluation('e2', 'Devoir 2', 'BROUILLON', 2),
    evaluation('e3', 'Devoir 3', 'BROUILLON', 0),
  ])
})
afterEach(cleanup)

describe('évaluations du personnel', () => {
  it('ouvre l’année active et liste publiées et brouillons avec leur statut', async () => {
    rendre()
    const publiee = await screen.findByTestId('evaluation-e1')
    expect(mocks.fetchEvaluationsPersonnel).toHaveBeenCalledWith({ anneeId: 'a2', matiereId: '' }, expect.anything())
    expect(screen.getByLabelText('Année académique').value).toBe('a2')
    expect(within(publiee).getByText('Publiée')).toBeTruthy()
    expect(within(publiee).getByText(/par Joseph Kamga/)).toBeTruthy()
    expect(within(screen.getByTestId('evaluation-e2')).getByText('Brouillon')).toBeTruthy()
    expect(within(publiee).getByRole('link', { name: 'Voir les notes' }).getAttribute('href')).toBe(
      '/scolarite/evaluations/e1',
    )
  })

  it('offre « Dépublier » sur une publiée, « Publier » sur un brouillon, désactivé sans note', async () => {
    rendre()
    await screen.findByTestId('evaluation-e1')
    expect(within(screen.getByTestId('evaluation-e1')).getByRole('button', { name: 'Dépublier' })).toBeTruthy()
    expect(within(screen.getByTestId('evaluation-e2')).getByRole('button', { name: 'Publier' }).disabled).toBe(false)
    expect(within(screen.getByTestId('evaluation-e3')).getByRole('button', { name: 'Publier' }).disabled).toBe(true)
  })

  it('changer d’année relit la liste, vide le filtre matière et ne propose que les matières de l’année', async () => {
    rendre()
    await screen.findByTestId('evaluation-e1')
    const matiere = screen.getByLabelText('Matière')
    expect(within(matiere).queryByText('Réseaux (RES)')).toBeNull()

    fireEvent.change(matiere, { target: { value: 'm1' } })
    await waitFor(() =>
      expect(mocks.fetchEvaluationsPersonnel).toHaveBeenLastCalledWith({ anneeId: 'a2', matiereId: 'm1' }, expect.anything()),
    )

    fireEvent.change(screen.getByLabelText('Année académique'), { target: { value: 'a1' } })
    await waitFor(() =>
      expect(mocks.fetchEvaluationsPersonnel).toHaveBeenLastCalledWith({ anneeId: 'a1', matiereId: '' }, expect.anything()),
    )
    expect(screen.getByLabelText('Matière').value).toBe('')
    expect(within(screen.getByLabelText('Matière')).getByText('Réseaux (RES)')).toBeTruthy()
  })

  it('dépublier : motif obligatoire, puis message de confirmation et liste relue', async () => {
    mocks.depublierEvaluation.mockResolvedValue({})
    rendre()
    await screen.findByTestId('evaluation-e1')
    fireEvent.click(within(screen.getByTestId('evaluation-e1')).getByRole('button', { name: 'Dépublier' }))
    const dialogue = screen.getByRole('dialog')

    fireEvent.click(within(dialogue).getByRole('button', { name: 'Dépublier' }))
    expect(within(dialogue).getByRole('alert').textContent).toContain('Le motif est obligatoire')
    expect(mocks.depublierEvaluation).not.toHaveBeenCalled()

    fireEvent.change(within(dialogue).getByLabelText(/Motif/), { target: { value: 'Erreur de barème' } })
    fireEvent.click(within(dialogue).getByRole('button', { name: 'Dépublier' }))

    expect((await screen.findByRole('status')).textContent).toContain('« Devoir 1 » est dépubliée')
    expect(mocks.depublierEvaluation).toHaveBeenCalledWith('e1', 'Erreur de barème')
    await waitFor(() => expect(mocks.fetchEvaluationsPersonnel).toHaveBeenCalledTimes(2))
  })

  it('aucune évaluation : message clair', async () => {
    mocks.fetchEvaluationsPersonnel.mockResolvedValue([])
    rendre()
    expect(await screen.findByText(/Aucune évaluation pour ce filtre/)).toBeTruthy()
  })

  it('erreur de chargement des évaluations : message et « Réessayer »', async () => {
    mocks.fetchEvaluationsPersonnel.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Erreur interne' } } })
    rendre()
    expect((await screen.findByRole('alert')).textContent).toContain('Erreur interne')
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByTestId('evaluation-e1')).toBeTruthy()
  })
})
