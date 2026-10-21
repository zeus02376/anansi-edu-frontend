import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import EvaluationsMatiere from './EvaluationsMatiere'

const mocks = vi.hoisted(() => ({
  fetchEvaluations: vi.fn(),
  creerEvaluation: vi.fn(),
  modifierEvaluation: vi.fn(),
  publierEvaluation: vi.fn(),
  supprimerEvaluation: vi.fn(),
}))

vi.mock('../../services/notes', () => mocks)

const evaluation = (id, nom, statut, extra = {}) => ({
  id,
  matiereId: 'mat-1',
  nom,
  type: 'DEVOIR',
  coefficient: 1,
  bareme: 20,
  date: null,
  statut,
  publieLe: statut === 'PUBLIEE' ? '2026-10-21T10:00:00.000Z' : null,
  _count: { notes: 0 },
  ...extra,
})

const liste = [
  evaluation('e1', 'Examen final', 'PUBLIEE', { type: 'EXAMEN', coefficient: 2, bareme: 40, _count: { notes: 3 } }),
  evaluation('e2', 'Devoir 2', 'BROUILLON', { _count: { notes: 2 } }),
  evaluation('e3', 'Projet', 'BROUILLON', { _count: { notes: 0 } }),
]

const rendre = () =>
  render(
    <MemoryRouter>
      <EvaluationsMatiere matiereId="mat-1" />
    </MemoryRouter>,
  )
const carte = (id) => screen.getByTestId(`evaluation-${id}`)

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset())
  mocks.fetchEvaluations.mockResolvedValue(liste)
})
afterEach(cleanup)

describe('évaluations d’une matière', () => {
  it('liste les évaluations avec leur statut : brouillon modifiable, publiée verrouillée', async () => {
    rendre()
    await screen.findByText('Devoir 2')

    const publiee = within(carte('e1'))
    expect(publiee.getByText('Publiée')).toBeTruthy()
    expect(publiee.getByText('Voir les notes')).toBeTruthy()
    expect(publiee.getByText(/Verrouillée/)).toBeTruthy()
    expect(publiee.queryByRole('button', { name: 'Modifier' })).toBeNull()
    expect(publiee.queryByRole('button', { name: 'Publier' })).toBeNull()
    expect(publiee.queryByRole('button', { name: 'Supprimer' })).toBeNull()

    const brouillon = within(carte('e2'))
    expect(brouillon.getByText('Brouillon')).toBeTruthy()
    expect(brouillon.getByText('Saisir les notes').getAttribute('href')).toBe('/enseignant/evaluations/e2')
    expect(brouillon.getByRole('button', { name: 'Modifier' })).toBeTruthy()
    expect(brouillon.getByRole('button', { name: 'Supprimer' })).toBeTruthy()
    expect(brouillon.getByRole('button', { name: 'Publier' }).disabled).toBe(false)
  })

  it('« Publier » est désactivé tant qu’aucune note n’est saisie', async () => {
    rendre()
    await screen.findByText('Projet')
    expect(within(carte('e3')).getByRole('button', { name: 'Publier' }).disabled).toBe(true)
  })

  it('matière sans évaluation : message d’invitation, création possible', async () => {
    mocks.fetchEvaluations.mockResolvedValue([])
    rendre()
    expect(await screen.findByText(/Aucune évaluation pour cette matière/)).toBeTruthy()
    expect(screen.getByRole('button', { name: '+ Nouvelle évaluation' })).toBeTruthy()
  })

  it('crée une évaluation avec les valeurs par défaut (coefficient 1, barème 20) puis recharge la liste', async () => {
    mocks.creerEvaluation.mockResolvedValue(evaluation('e9', 'Devoir 3', 'BROUILLON'))
    rendre()
    await screen.findByText('Devoir 2')

    fireEvent.click(screen.getByRole('button', { name: '+ Nouvelle évaluation' }))
    const dialogue = screen.getByRole('dialog')
    fireEvent.change(within(dialogue).getByLabelText('Nom'), { target: { value: '  Devoir 3  ' } })
    fireEvent.change(within(dialogue).getByLabelText('Type'), { target: { value: 'TP' } })
    fireEvent.click(within(dialogue).getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(mocks.creerEvaluation).toHaveBeenCalled())
    expect(mocks.creerEvaluation).toHaveBeenCalledWith('mat-1', {
      nom: 'Devoir 3',
      type: 'TP',
      coefficient: 1,
      bareme: 20,
    })
    await waitFor(() => expect(mocks.fetchEvaluations).toHaveBeenCalledTimes(2))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('valide le formulaire : nom obligatoire, coefficient et barème bornés', async () => {
    rendre()
    await screen.findByText('Devoir 2')
    fireEvent.click(screen.getByRole('button', { name: '+ Nouvelle évaluation' }))
    const dialogue = screen.getByRole('dialog')

    fireEvent.change(within(dialogue).getByLabelText('Coefficient'), { target: { value: '0' } })
    fireEvent.change(within(dialogue).getByLabelText('Barème (note maximale)'), { target: { value: '12,345' } })
    fireEvent.click(within(dialogue).getByRole('button', { name: 'Enregistrer' }))

    expect(await within(dialogue).findByText('Le nom est obligatoire')).toBeTruthy()
    expect(within(dialogue).getAllByText(/Entre 0,?0?1|Entre 0\.01|2 décimales au plus/).length).toBeGreaterThan(0)
    expect(mocks.creerEvaluation).not.toHaveBeenCalled()
  })

  it('affiche l’erreur du serveur (nom déjà utilisé) sans fermer le formulaire', async () => {
    mocks.creerEvaluation.mockRejectedValue({
      response: { status: 409, data: { message: 'Une évaluation « Devoir 2 » existe déjà pour cette matière' } },
    })
    rendre()
    await screen.findByText('Devoir 2')
    fireEvent.click(screen.getByRole('button', { name: '+ Nouvelle évaluation' }))
    const dialogue = screen.getByRole('dialog')
    fireEvent.change(within(dialogue).getByLabelText('Nom'), { target: { value: 'Devoir 2' } })
    fireEvent.click(within(dialogue).getByRole('button', { name: 'Enregistrer' }))

    expect((await within(dialogue).findByRole('alert')).textContent).toContain('existe déjà')
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('modifie un brouillon : formulaire prérempli, PATCH puis rechargement', async () => {
    mocks.modifierEvaluation.mockResolvedValue({})
    rendre()
    await screen.findByText('Devoir 2')

    fireEvent.click(within(carte('e2')).getByRole('button', { name: 'Modifier' }))
    const dialogue = screen.getByRole('dialog')
    expect(within(dialogue).getByLabelText('Nom').value).toBe('Devoir 2')
    fireEvent.change(within(dialogue).getByLabelText('Nom'), { target: { value: 'Devoir 2 corrigé' } })
    fireEvent.click(within(dialogue).getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(mocks.modifierEvaluation).toHaveBeenCalled())
    expect(mocks.modifierEvaluation.mock.calls[0][0]).toBe('e2')
    expect(mocks.modifierEvaluation.mock.calls[0][1]).toMatchObject({ nom: 'Devoir 2 corrigé', coefficient: 1, bareme: 20 })
  })

  it('publier demande confirmation avant d’appeler le serveur', async () => {
    mocks.publierEvaluation.mockResolvedValue({})
    rendre()
    await screen.findByText('Devoir 2')

    fireEvent.click(within(carte('e2')).getByRole('button', { name: 'Publier' }))
    const dialogue = screen.getByRole('dialog')
    expect(dialogue.textContent).toContain('la verrouille')
    expect(mocks.publierEvaluation).not.toHaveBeenCalled()
    fireEvent.click(within(dialogue).getByRole('button', { name: 'Publier' }))

    await waitFor(() => expect(mocks.publierEvaluation).toHaveBeenCalledWith('e2'))
    await waitFor(() => expect(mocks.fetchEvaluations).toHaveBeenCalledTimes(2))
  })

  it('échec de publication : message du serveur, fenêtre conservée', async () => {
    mocks.publierEvaluation.mockRejectedValue({
      response: { status: 409, data: { message: 'Cette évaluation est déjà publiée' } },
    })
    rendre()
    await screen.findByText('Devoir 2')
    fireEvent.click(within(carte('e2')).getByRole('button', { name: 'Publier' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Publier' }))

    expect((await screen.findByRole('alert')).textContent).toContain('déjà publiée')
  })

  it('supprimer demande confirmation et prévient que les notes sont supprimées', async () => {
    mocks.supprimerEvaluation.mockResolvedValue({})
    rendre()
    await screen.findByText('Devoir 2')

    fireEvent.click(within(carte('e2')).getByRole('button', { name: 'Supprimer' }))
    const dialogue = screen.getByRole('dialog')
    expect(dialogue.textContent).toContain('supprime aussi les notes')
    expect(mocks.supprimerEvaluation).not.toHaveBeenCalled()
    fireEvent.click(within(dialogue).getByRole('button', { name: 'Supprimer' }))

    await waitFor(() => expect(mocks.supprimerEvaluation).toHaveBeenCalledWith('e2'))
  })

  it('erreur de chargement : message et « Réessayer »', async () => {
    mocks.fetchEvaluations.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Erreur interne' } } })
    rendre()
    expect((await screen.findByRole('alert')).textContent).toContain('Erreur interne')
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByText('Devoir 2')).toBeTruthy()
  })
})
