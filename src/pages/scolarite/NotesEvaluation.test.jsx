import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import NotesEvaluation from './NotesEvaluation'

const mocks = vi.hoisted(() => ({
  fetchGrillePersonnel: vi.fn(),
  corrigerNote: vi.fn(),
  fetchHistoriqueNote: vi.fn(),
  publierEvaluationPersonnel: vi.fn(),
  depublierEvaluation: vi.fn(),
}))

vi.mock('../../services/notesPersonnel', () => mocks)
vi.mock('../../components/DashboardLayout', () => ({ default: ({ children }) => children }))

const noteDe = (id, valeur, extra = {}) => ({
  id: `n-${id}`,
  evaluationId: 'ev-1',
  inscriptionId: id,
  valeur,
  etat: 'NOTEE',
  commentaire: null,
  updatedAt: '2026-10-21T10:00:00.000Z',
  ...extra,
})

const evaluation = (statut = 'PUBLIEE') => ({
  id: 'ev-1',
  matiereId: 'mat-1',
  nom: 'Devoir 1',
  type: 'DEVOIR',
  coefficient: 1,
  bareme: 20,
  date: null,
  statut,
  publieLe: statut === 'PUBLIEE' ? '2026-10-21T10:00:00.000Z' : null,
  matiere: { id: 'mat-1', nom: 'Algorithmique', code: 'ALG' },
  createur: { id: 'u', nom: 'Kamga', prenom: 'Joseph' },
  _count: { notes: 3 },
})

const ligne = (id, nom, prenom, note, statutInscription = 'VALIDE') => ({
  inscriptionId: id,
  statutInscription,
  etudiant: { id: `e-${id}`, matricule: `M-${id}`, matriculeIuc: id === 'i1' ? 'IUC26E1234567' : null, nom, prenom },
  note,
})

const grille = (statut = 'PUBLIEE', extra = {}) => ({
  evaluation: evaluation(statut),
  publications: [],
  notes: [
    ligne('i1', 'Mballa', 'Amina', noteDe('i1', 14)),
    ligne('i2', 'Ngono', 'Paul', noteDe('i2', 9.5)),
    ligne('i3', 'Fotso', 'Marie', null),
    ligne('i4', 'Tchoua', 'Samuel', noteDe('i4', 8), 'SUSPENDU'),
  ],
  ...extra,
})

const rendre = () =>
  render(
    <MemoryRouter initialEntries={['/scolarite/evaluations/ev-1']}>
      <Routes>
        <Route path="/scolarite/evaluations/:id" element={<NotesEvaluation />} />
        <Route path="/scolarite/notes" element={<p>Liste</p>} />
      </Routes>
    </MemoryRouter>,
  )

const rangee = (id) => screen.getByTestId(`ligne-${id}`)
const ouvrirCorrection = async (id, nom) => {
  fireEvent.click(await screen.findByRole('button', { name: `Corriger la note de ${nom}` }))
  return screen.getByRole('dialog')
}
const champ = (dialogue, libelle) => within(dialogue).getByLabelText(libelle)
const valider = (dialogue) => fireEvent.click(within(dialogue).getByRole('button', { name: 'Corriger la note' }))

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset())
  mocks.fetchGrillePersonnel.mockResolvedValue(grille())
})
afterEach(cleanup)

describe('grille de notes du personnel', () => {
  it('affiche l’évaluation, ses notes, les matricules, et signale une inscription non validée', async () => {
    rendre()
    expect(await screen.findByRole('heading', { name: /Devoir 1/ })).toBeTruthy()
    expect(screen.getByText('Algorithmique (ALG)')).toBeTruthy()
    expect(screen.getByText(/créée par Joseph Kamga/)).toBeTruthy()
    expect(within(rangee('i1')).getByText('14')).toBeTruthy()
    expect(within(rangee('i1')).getByText('IUC26E1234567')).toBeTruthy()
    expect(within(rangee('i2')).getByText('9,5')).toBeTruthy()
    expect(within(rangee('i3')).getByText('Pas de note')).toBeTruthy()
    expect(within(rangee('i4')).getByText('Inscription suspendue')).toBeTruthy()
    expect(screen.getByRole('note').textContent).toContain('publiée')
  })

  it('une inscription sans note n’offre ni correction ni historique', async () => {
    rendre()
    await screen.findByRole('heading', { name: /Devoir 1/ })
    expect(within(rangee('i3')).queryByRole('button')).toBeNull()
    expect(within(rangee('i1')).getAllByRole('button')).toHaveLength(2)
  })

  it('refuse une correction sans motif, sans modification ou hors barème, sans rien envoyer', async () => {
    rendre()
    const dialogue = await ouvrirCorrection('i2', 'Paul Ngono')

    valider(dialogue)
    expect(within(dialogue).getByRole('alert').textContent).toContain('Aucune modification')

    fireEvent.change(champ(dialogue, /Note \//), { target: { value: '25' } })
    valider(dialogue)
    expect(within(dialogue).getByRole('alert').textContent).toContain('comprise entre 0 et 20')

    fireEvent.change(champ(dialogue, /Note \//), { target: { value: '12' } })
    valider(dialogue)
    expect(within(dialogue).getByRole('alert').textContent).toContain('motif de la correction est obligatoire')

    fireEvent.change(champ(dialogue, /Motif/), { target: { value: '   ' } })
    valider(dialogue)
    expect(within(dialogue).getByRole('alert').textContent).toContain('motif')
    expect(mocks.corrigerNote).not.toHaveBeenCalled()
  })

  it('corrige une note avec motif et updatedAt, puis recharge la grille et confirme', async () => {
    mocks.corrigerNote.mockResolvedValue({})
    mocks.fetchGrillePersonnel
      .mockResolvedValueOnce(grille())
      .mockResolvedValueOnce(
        grille('PUBLIEE', {
          notes: [
            ligne('i1', 'Mballa', 'Amina', noteDe('i1', 14)),
            ligne('i2', 'Ngono', 'Paul', noteDe('i2', 12, { updatedAt: '2026-10-21T11:00:00.000Z' })),
          ],
        }),
      )
    rendre()
    const dialogue = await ouvrirCorrection('i2', 'Paul Ngono')

    fireEvent.change(champ(dialogue, /Note \//), { target: { value: '12' } })
    fireEvent.change(champ(dialogue, /Motif/), { target: { value: '  Erreur de saisie  ' } })
    valider(dialogue)

    expect((await screen.findByRole('status')).textContent).toContain('Note de Paul Ngono corrigée : 9,5 → 12')
    expect(mocks.corrigerNote).toHaveBeenCalledWith('n-i2', {
      etat: 'NOTEE',
      valeur: 12,
      motif: 'Erreur de saisie',
      updatedAt: '2026-10-21T10:00:00.000Z',
    })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(within(rangee('i2')).getByText('12')).toBeTruthy()
  })

  it('une correction vers « Absent » n’envoie pas de valeur', async () => {
    mocks.corrigerNote.mockResolvedValue({})
    rendre()
    const dialogue = await ouvrirCorrection('i1', 'Amina Mballa')

    fireEvent.change(champ(dialogue, 'État'), { target: { value: 'ABSENT' } })
    expect(champ(dialogue, /Note \//).disabled).toBe(true)
    fireEvent.change(champ(dialogue, /Motif/), { target: { value: 'Absence justifiée' } })
    valider(dialogue)

    await waitFor(() => expect(mocks.corrigerNote).toHaveBeenCalled())
    expect(mocks.corrigerNote.mock.calls[0][1]).toEqual({
      etat: 'ABSENT',
      motif: 'Absence justifiée',
      updatedAt: '2026-10-21T10:00:00.000Z',
    })
  })

  it('conflit : relit la grille, garde la fenêtre, les saisies et le motif, indique la valeur actuelle', async () => {
    mocks.fetchGrillePersonnel
      .mockResolvedValueOnce(grille())
      .mockResolvedValueOnce(
        grille('PUBLIEE', {
          notes: [ligne('i1', 'Mballa', 'Amina', noteDe('i1', 15, { updatedAt: '2026-10-21T10:30:00.000Z' }))],
        }),
      )
    mocks.corrigerNote.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { statusCode: 409, message: 'Cette note a été modifiée depuis votre lecture : rechargez-la', erreurs: [] },
      },
    })
    rendre()
    const dialogue = await ouvrirCorrection('i1', 'Amina Mballa')

    fireEvent.change(champ(dialogue, /Note \//), { target: { value: '13' } })
    fireEvent.change(champ(dialogue, /Motif/), { target: { value: 'Recorrection' } })
    valider(dialogue)

    const alerte = await within(dialogue).findByRole('alert')
    expect(alerte.textContent).toContain('modifiée depuis votre lecture')
    expect(alerte.textContent).toContain('valeur actuelle : 15')
    expect(alerte.textContent).toContain('Rien n’a été enregistré')
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(champ(dialogue, /Note \//).value).toBe('13')
    expect(champ(dialogue, /Motif/).value).toBe('Recorrection')
    expect(mocks.fetchGrillePersonnel).toHaveBeenCalledTimes(2)

    // Nouvelle validation : l'updatedAt envoyé est celui du rechargement
    mocks.corrigerNote.mockResolvedValueOnce({})
    valider(dialogue)
    await waitFor(() => expect(mocks.corrigerNote).toHaveBeenCalledTimes(2))
    expect(mocks.corrigerNote.mock.calls[1][1]).toMatchObject({ valeur: 13, updatedAt: '2026-10-21T10:30:00.000Z' })
    expect((await screen.findByRole('status')).textContent).toContain('15 → 13')
  })

  it('une erreur du serveur (valeur invalide, motif) s’affiche dans la fenêtre, sans la fermer', async () => {
    mocks.corrigerNote.mockRejectedValueOnce({
      response: { status: 400, data: { message: ['Le motif est obligatoire'] } },
    })
    rendre()
    const dialogue = await ouvrirCorrection('i1', 'Amina Mballa')
    fireEvent.change(champ(dialogue, /Note \//), { target: { value: '10' } })
    fireEvent.change(champ(dialogue, /Motif/), { target: { value: 'x' } })
    valider(dialogue)

    expect((await within(dialogue).findByRole('alert')).textContent).toContain('Le motif est obligatoire')
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('affiche l’historique : ancienne → nouvelle valeur, motif, auteur', async () => {
    mocks.fetchHistoriqueNote.mockResolvedValue([
      {
        id: 'h2',
        ancienEtat: 'NOTEE',
        ancienneValeur: 16,
        nouvelEtat: 'ABSENT',
        nouvelleValeur: null,
        motif: 'Absence justifiée',
        date: '2026-10-21T12:00:00.000Z',
        auteur: { id: 'u', nom: 'Nkomo', prenom: 'Claire' },
      },
      {
        id: 'h1',
        ancienEtat: 'NOTEE',
        ancienneValeur: 12,
        nouvelEtat: 'NOTEE',
        nouvelleValeur: 16,
        motif: 'Erreur de saisie',
        date: '2026-10-21T11:00:00.000Z',
        auteur: { id: 'u', nom: 'Nkomo', prenom: 'Claire' },
      },
    ])
    rendre()
    fireEvent.click(await screen.findByRole('button', { name: 'Historique de la note de Amina Mballa' }))

    const journal = await screen.findByTestId('historique')
    expect(within(journal).getByText('16 → Absent')).toBeTruthy()
    expect(within(journal).getByText('12 → 16')).toBeTruthy()
    expect(within(journal).getByText(/Absence justifiée/)).toBeTruthy()
    expect(within(journal).getAllByText('Par Claire Nkomo')).toHaveLength(2)
    expect(mocks.fetchHistoriqueNote).toHaveBeenCalledWith('n-i1', expect.anything())
  })

  it('historique vide : message clair', async () => {
    mocks.fetchHistoriqueNote.mockResolvedValue([])
    rendre()
    fireEvent.click(await screen.findByRole('button', { name: 'Historique de la note de Amina Mballa' }))
    expect(await screen.findByText('Aucune correction enregistrée pour cette note.')).toBeTruthy()
  })
})

describe('publication et dépublication', () => {
  it('dépublier exige un motif, puis l’évaluation redevient un brouillon', async () => {
    mocks.depublierEvaluation.mockResolvedValue({})
    mocks.fetchGrillePersonnel
      .mockResolvedValueOnce(grille())
      .mockResolvedValueOnce(
        grille('BROUILLON', {
          publications: [
            { action: 'DEPUBLICATION', motif: 'Barème à revoir', date: '2026-10-21T12:00:00.000Z', auteur: { nom: 'Nkomo', prenom: 'Claire' } },
            { action: 'PUBLICATION', motif: null, date: '2026-10-21T10:00:00.000Z', auteur: { nom: 'Kamga', prenom: 'Joseph' } },
          ],
        }),
      )
    rendre()
    fireEvent.click(await screen.findByRole('button', { name: 'Dépublier' }))
    const dialogue = screen.getByRole('dialog')

    fireEvent.click(within(dialogue).getByRole('button', { name: 'Dépublier' }))
    expect(within(dialogue).getByRole('alert').textContent).toContain('Le motif est obligatoire')
    expect(mocks.depublierEvaluation).not.toHaveBeenCalled()

    fireEvent.change(within(dialogue).getByLabelText(/Motif/), { target: { value: ' Barème à revoir ' } })
    fireEvent.click(within(dialogue).getByRole('button', { name: 'Dépublier' }))

    expect((await screen.findByRole('status')).textContent).toContain('est dépubliée')
    expect(mocks.depublierEvaluation).toHaveBeenCalledWith('ev-1', 'Barème à revoir')
    expect(await screen.findByRole('button', { name: 'Publier' })).toBeTruthy()
    const journal = screen.getByTestId('publications')
    expect(within(journal).getByText(/Motif : Barème à revoir/)).toBeTruthy()
    expect(within(journal).getByText(/par Claire Nkomo/)).toBeTruthy()
  })

  it('republier demande confirmation puis publie', async () => {
    mocks.publierEvaluationPersonnel.mockResolvedValue({})
    mocks.fetchGrillePersonnel.mockResolvedValue(grille('BROUILLON'))
    rendre()
    fireEvent.click(await screen.findByRole('button', { name: 'Publier' }))
    const dialogue = screen.getByRole('dialog')
    expect(dialogue.textContent).toContain('visible des étudiants')
    expect(mocks.publierEvaluationPersonnel).not.toHaveBeenCalled()
    fireEvent.click(within(dialogue).getByRole('button', { name: 'Publier' }))

    await waitFor(() => expect(mocks.publierEvaluationPersonnel).toHaveBeenCalledWith('ev-1'))
    expect((await screen.findByRole('status')).textContent).toContain('est publiée')
  })

  it('dépublication refusée par le serveur (déjà dépubliée) : message affiché et grille rafraîchie', async () => {
    mocks.depublierEvaluation.mockRejectedValueOnce({
      response: { status: 409, data: { message: 'Cette évaluation n’est pas publiée' } },
    })
    rendre()
    fireEvent.click(await screen.findByRole('button', { name: 'Dépublier' }))
    const dialogue = screen.getByRole('dialog')
    fireEvent.change(within(dialogue).getByLabelText(/Motif/), { target: { value: 'x' } })
    fireEvent.click(within(dialogue).getByRole('button', { name: 'Dépublier' }))

    expect((await within(dialogue).findByRole('alert')).textContent).toContain('n’est pas publiée')
    await waitFor(() => expect(mocks.fetchGrillePersonnel).toHaveBeenCalledTimes(2))
  })

  it('« Publier » est désactivé pour un brouillon sans note', async () => {
    mocks.fetchGrillePersonnel.mockResolvedValue({
      ...grille('BROUILLON'),
      evaluation: { ...evaluation('BROUILLON'), _count: { notes: 0 } },
    })
    rendre()
    expect((await screen.findByRole('button', { name: 'Publier' })).disabled).toBe(true)
  })

  it('évaluation introuvable (404) : message clair', async () => {
    mocks.fetchGrillePersonnel.mockRejectedValue({ response: { status: 404, data: { message: 'Évaluation introuvable' } } })
    rendre()
    expect(await screen.findByRole('heading', { name: 'Évaluation introuvable' })).toBeTruthy()
  })

  it('erreur de chargement : message et « Réessayer »', async () => {
    mocks.fetchGrillePersonnel.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Erreur interne' } } })
    rendre()
    expect((await screen.findByRole('alert')).textContent).toContain('Erreur interne')
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByRole('heading', { name: /Devoir 1/ })).toBeTruthy()
  })
})
