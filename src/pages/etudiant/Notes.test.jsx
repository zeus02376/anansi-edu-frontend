import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Notes from './Notes'

const mocks = vi.hoisted(() => ({ fetchMesNotes: vi.fn() }))

vi.mock('../../services/moi', () => ({ fetchMesNotes: mocks.fetchMesNotes }))
vi.mock('../../components/DashboardLayout', () => ({ default: ({ children }) => children }))

const annee = (id, libelle, debut, fin) => ({ id, libelle, dateDebut: debut, dateFin: fin })
const A1 = annee('a1', '2026-2027', '2026-09-01T00:00:00.000Z', '2027-07-31T00:00:00.000Z')
const A0 = annee('a0', '2025-2026', '2025-09-01T00:00:00.000Z', '2026-07-31T00:00:00.000Z')

const evaluation = (id, nom, extra = {}) => ({
  id,
  nom,
  type: 'DEVOIR',
  coefficient: 1,
  bareme: 20,
  date: null,
  comptee: true,
  note: { etat: 'NOTEE', valeur: 14, sur20: 14 },
  ...extra,
})

const reponseAnnee = (anneeData, extra = {}) => ({
  annee: anneeData,
  niveau: { id: 'n', nom: 'Licence 2', code: 'L2' },
  statutInscription: 'VALIDE',
  provisoire: true,
  moyenneGenerale: 12.6,
  matieres: [
    {
      id: 'm1',
      nom: 'Algorithmique',
      code: 'ALG',
      coefficient: 3,
      credits: 4,
      moyenne: 14.67,
      evaluations: [
        evaluation('e1', 'Devoir 1'),
        evaluation('e2', 'Examen final', { type: 'EXAMEN', coefficient: 2, bareme: 40, note: { etat: 'NOTEE', valeur: 30, sur20: 15 } }),
        evaluation('e3', 'TP', { comptee: true, note: { etat: 'ABSENT', valeur: null, sur20: 0 } }),
        evaluation('e4', 'Quiz', { comptee: false, note: { etat: 'DISPENSE', valeur: null, sur20: null } }),
        evaluation('e5', 'Oral', { comptee: false, note: null }),
      ],
    },
    { id: 'm2', nom: 'Réseaux', code: 'RES', coefficient: 1, credits: 2, moyenne: null, evaluations: [] },
  ],
  ...extra,
})

const rendre = () =>
  render(
    <MemoryRouter>
      <Notes />
    </MemoryRouter>,
  )

beforeEach(() => {
  mocks.fetchMesNotes.mockReset()
})
afterEach(cleanup)

describe('Mes notes (étudiant)', () => {
  it('affiche la moyenne générale avec la mention « provisoire » bien visible', async () => {
    mocks.fetchMesNotes.mockResolvedValue({ annees: [reponseAnnee(A1)] })
    rendre()

    expect((await screen.findByTestId('moyenne-generale')).textContent).toContain('12,6')
    expect(screen.getByText('Provisoire')).toBeTruthy()
    expect(screen.getByRole('note').textContent).toContain('provisoire')
    expect(screen.getByRole('note').textContent).toContain('pas un résultat définitif')
  })

  it('demande d’abord toutes les années, puis choisit celle en cours par défaut', async () => {
    mocks.fetchMesNotes.mockResolvedValue({
      annees: [reponseAnnee(A1), reponseAnnee(A0, { moyenneGenerale: 8 })],
    })
    rendre()

    await screen.findByTestId('moyenne-generale')
    expect(mocks.fetchMesNotes).toHaveBeenCalledWith(undefined, expect.anything())
    const select = screen.getByLabelText('Année académique')
    expect([...select.options].map((o) => o.text)).toEqual(['2026-2027', '2025-2026'])
  })

  it('un changement d’année interroge le serveur avec anneeId', async () => {
    mocks.fetchMesNotes.mockImplementation((anneeId) =>
      Promise.resolve({
        annees: anneeId === 'a0' ? [reponseAnnee(A0, { moyenneGenerale: 8 })] : [reponseAnnee(A1), reponseAnnee(A0, { moyenneGenerale: 8 })],
      }),
    )
    rendre()
    await screen.findByTestId('moyenne-generale')

    fireEvent.change(screen.getByLabelText('Année académique'), { target: { value: 'a0' } })

    await waitFor(() => expect(mocks.fetchMesNotes).toHaveBeenCalledWith('a0', expect.anything()))
    await waitFor(() => expect(screen.getByTestId('moyenne-generale').textContent).toContain('8'))
    // La liste des années reste disponible après le filtrage
    expect(screen.getByLabelText('Année académique').options).toHaveLength(2)
  })

  it('chaque matière se déplie sur le détail de ses évaluations publiées', async () => {
    mocks.fetchMesNotes.mockResolvedValue({ annees: [reponseAnnee(A1)] })
    rendre()
    const matiere = await screen.findByTestId('matiere-ALG')

    expect(within(matiere).getByText('14,67 / 20')).toBeTruthy()
    expect(within(matiere).getByText('Devoir 1')).toBeTruthy()
    expect(within(matiere).getByText('14 / 20')).toBeTruthy()
    expect(within(matiere).getByText('30 / 40')).toBeTruthy()
    expect(within(matiere).getByText('Examen')).toBeTruthy() // type de l'évaluation
    expect(within(matiere).getAllByText(/coef\./).length).toBeGreaterThanOrEqual(5)
    expect(within(matiere).getByText('(compte 0)')).toBeTruthy() // absent
    expect(within(matiere).getByText('(non compté)')).toBeTruthy() // dispensé
    expect(within(matiere).getByText('Non noté')).toBeTruthy()
  })

  it('une matière sans évaluation publiée l’indique, sans planter', async () => {
    mocks.fetchMesNotes.mockResolvedValue({ annees: [reponseAnnee(A1)] })
    rendre()
    const matiere = await screen.findByTestId('matiere-RES')
    expect(within(matiere).getByText('Aucune évaluation publiée')).toBeTruthy()
    expect(within(matiere).getByText('—')).toBeTruthy()
  })

  it('aucune évaluation publiée pour toute l’année : message, moyenne absente', async () => {
    mocks.fetchMesNotes.mockResolvedValue({
      annees: [
        reponseAnnee(A1, {
          moyenneGenerale: null,
          matieres: [{ id: 'm2', nom: 'Réseaux', code: 'RES', coefficient: 1, credits: 2, moyenne: null, evaluations: [] }],
        }),
      ],
    })
    rendre()

    expect(await screen.findByText(/Aucune évaluation n’a encore été publiée/)).toBeTruthy()
    expect(screen.getByText(/Pas encore de moyenne générale/)).toBeTruthy()
    expect(screen.queryByTestId('moyenne-generale')).toBeNull()
  })

  it('sans aucune inscription : message vide et pas de sélecteur d’année', async () => {
    mocks.fetchMesNotes.mockResolvedValue({ annees: [] })
    rendre()

    expect(await screen.findByText(/Aucune note à afficher/)).toBeTruthy()
    expect(screen.queryByLabelText('Année académique')).toBeNull()
  })

  it('une erreur du serveur s’affiche avec un bouton « Réessayer » qui recharge', async () => {
    mocks.fetchMesNotes.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Erreur interne' } } })
    mocks.fetchMesNotes.mockResolvedValue({ annees: [reponseAnnee(A1)] })
    rendre()

    expect((await screen.findByRole('alert')).textContent).toContain('Erreur interne')
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByTestId('moyenne-generale')).toBeTruthy()
  })
})
