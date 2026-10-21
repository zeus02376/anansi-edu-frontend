import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Evaluation from './Evaluation'

const mocks = vi.hoisted(() => ({
  fetchGrille: vi.fn(),
  enregistrerNotes: vi.fn(),
  publierEvaluation: vi.fn(),
  fetchMesAffectations: vi.fn(),
}))

vi.mock('../../services/notes', () => ({
  fetchGrille: mocks.fetchGrille,
  enregistrerNotes: mocks.enregistrerNotes,
  publierEvaluation: mocks.publierEvaluation,
}))
vi.mock('../../services/moi', () => ({ fetchMesAffectations: mocks.fetchMesAffectations }))
vi.mock('../../components/DashboardLayout', () => ({ default: ({ children }) => children }))

const etudiant = (id, nom, prenom) => ({ id: `e-${id}`, matricule: `M-${id}`, nom, prenom })
const noteDe = (id, valeur, extra = {}) => ({
  id: `n-${id}`,
  inscriptionId: id,
  valeur,
  etat: 'NOTEE',
  commentaire: null,
  updatedAt: `2026-10-21T10:00:0${id === 'i1' ? 1 : 2}.000Z`,
  ...extra,
})

const evaluation = (statut = 'BROUILLON') => ({
  id: 'ev-1',
  matiereId: 'mat-1',
  nom: 'Devoir 2',
  type: 'DEVOIR',
  coefficient: 1,
  bareme: 20,
  date: null,
  statut,
  publieLe: statut === 'PUBLIEE' ? '2026-10-21T10:00:00.000Z' : null,
})

const grille = (notes, statut = 'BROUILLON') => ({
  evaluation: evaluation(statut),
  notes: [
    { inscriptionId: 'i1', etudiant: etudiant('1', 'Mballa', 'Amina'), note: notes.i1 ?? null },
    { inscriptionId: 'i2', etudiant: etudiant('2', 'Ngono', 'Paul'), note: notes.i2 ?? null },
  ],
})

const rendre = () =>
  render(
    <MemoryRouter initialEntries={['/enseignant/evaluations/ev-1']}>
      <Routes>
        <Route path="/enseignant/evaluations/:id" element={<Evaluation />} />
        <Route path="/enseignant/matieres" element={<p>Mes matières</p>} />
      </Routes>
    </MemoryRouter>,
  )

const saisie = (nom) => screen.getByLabelText(`Note de ${nom}`)
const enregistrer = () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les notes' }))
const taper = (nom, valeur) => fireEvent.change(saisie(nom), { target: { value: valeur } })

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset())
  mocks.fetchMesAffectations.mockResolvedValue([{ id: 'a', matiere: { id: 'mat-1', nom: 'Algorithmique' } }])
})
afterEach(cleanup)

describe('grille de saisie des notes (brouillon)', () => {
  it('affiche l’en-tête, le statut Brouillon et les inscrits avec leurs notes', async () => {
    mocks.fetchGrille.mockResolvedValue(grille({ i1: noteDe('i1', 14) }))
    rendre()

    expect(await screen.findByRole('heading', { name: /Devoir 2/ })).toBeTruthy()
    expect(screen.getAllByText('Brouillon').length).toBeGreaterThan(0)
    expect(await screen.findByText('Algorithmique')).toBeTruthy()
    expect(saisie('Amina Mballa').value).toBe('14')
    expect(saisie('Paul Ngono').value).toBe('')
  })

  it('n’envoie que les lignes modifiées, avec l’updatedAt lu, puis confirme', async () => {
    mocks.fetchGrille.mockResolvedValue(grille({ i1: noteDe('i1', 14) }))
    mocks.enregistrerNotes.mockResolvedValue({
      enregistrees: 2,
      notes: [
        noteDe('i1', 16, { updatedAt: '2026-10-21T10:05:00.000Z' }),
        noteDe('i2', 12.5, { updatedAt: '2026-10-21T10:05:01.000Z' }),
      ],
    })
    rendre()
    await screen.findByLabelText('Note de Amina Mballa')

    taper('Amina Mballa', '16')
    taper('Paul Ngono', '12,5')
    expect(screen.getByText('2 modifications non enregistrées')).toBeTruthy()
    // Publier est bloqué tant que des modifications ne sont pas enregistrées
    expect(screen.getByRole('button', { name: 'Publier l’évaluation' }).disabled).toBe(true)
    enregistrer()

    expect((await screen.findByRole('status')).textContent).toContain('2 notes enregistrées')
    expect(mocks.enregistrerNotes).toHaveBeenCalledTimes(1)
    expect(mocks.enregistrerNotes).toHaveBeenCalledWith('ev-1', [
      { inscriptionId: 'i1', etat: 'NOTEE', valeur: 16, updatedAt: '2026-10-21T10:00:01.000Z' },
      { inscriptionId: 'i2', etat: 'NOTEE', valeur: 12.5 },
    ])
    expect(screen.queryByText(/modification.* non enregistrée/)).toBeNull()
  })

  it('une ligne inchangée n’est jamais envoyée (donc ne peut pas entrer en conflit)', async () => {
    mocks.fetchGrille.mockResolvedValue(grille({ i1: noteDe('i1', 14), i2: noteDe('i2', 9) }))
    mocks.enregistrerNotes.mockResolvedValue({ enregistrees: 1, notes: [noteDe('i2', 11)] })
    rendre()
    await screen.findByLabelText('Note de Paul Ngono')

    taper('Paul Ngono', '11')
    enregistrer()

    await waitFor(() => expect(mocks.enregistrerNotes).toHaveBeenCalled())
    expect(mocks.enregistrerNotes.mock.calls[0][1].map((l) => l.inscriptionId)).toEqual(['i2'])
  })

  it('valide côté client : note hors barème ou invalide, aucune requête envoyée', async () => {
    mocks.fetchGrille.mockResolvedValue(grille({}))
    rendre()
    await screen.findByLabelText('Note de Amina Mballa')

    taper('Amina Mballa', '25')
    taper('Paul Ngono', 'abc')
    enregistrer()

    const ligneAmina = screen.getByTestId('ligne-i1')
    expect(within(ligneAmina).getByRole('alert').textContent).toContain('comprise entre 0 et 20')
    expect(within(screen.getByTestId('ligne-i2')).getByRole('alert').textContent).toContain('Nombre invalide')
    expect(mocks.enregistrerNotes).not.toHaveBeenCalled()
  })

  it('un absent n’a pas de note (champ désactivé) et s’envoie sans valeur', async () => {
    mocks.fetchGrille.mockResolvedValue(grille({}))
    mocks.enregistrerNotes.mockResolvedValue({ enregistrees: 1, notes: [noteDe('i1', null, { etat: 'ABSENT' })] })
    rendre()
    await screen.findByLabelText('Note de Amina Mballa')

    fireEvent.change(screen.getByLabelText('État de Amina Mballa'), { target: { value: 'ABSENT' } })
    expect(saisie('Amina Mballa').disabled).toBe(true)
    enregistrer()

    await waitFor(() =>
      expect(mocks.enregistrerNotes).toHaveBeenCalledWith('ev-1', [{ inscriptionId: 'i1', etat: 'ABSENT' }]),
    )
  })

  it('« Annuler mes modifications » rétablit les valeurs enregistrées', async () => {
    mocks.fetchGrille.mockResolvedValue(grille({ i1: noteDe('i1', 14) }))
    rendre()
    await screen.findByLabelText('Note de Amina Mballa')

    taper('Amina Mballa', '3')
    fireEvent.click(screen.getByRole('button', { name: 'Annuler mes modifications' }))

    expect(saisie('Amina Mballa').value).toBe('14')
    expect(screen.queryByText(/non enregistrée/)).toBeNull()
  })
})

describe('conflits et erreurs par ligne', () => {
  it('CONFLIT : recharge la grille, garde les saisies, signale la ligne avec la valeur actuelle', async () => {
    mocks.fetchGrille
      .mockResolvedValueOnce(grille({ i1: noteDe('i1', 14) }))
      // Rechargement : la note d'Amina a été modifiée ailleurs (11), avec un nouvel updatedAt
      .mockResolvedValueOnce(grille({ i1: noteDe('i1', 11, { updatedAt: '2026-10-21T10:09:00.000Z' }) }))
    mocks.enregistrerNotes.mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          statusCode: 409,
          message: 'Saisie refusée : aucune note enregistrée',
          erreurs: [{ inscriptionId: 'i1', code: 'CONFLIT', message: 'Cette note a été modifiée depuis votre lecture' }],
        },
      },
    })
    rendre()
    await screen.findByLabelText('Note de Amina Mballa')

    taper('Amina Mballa', '19')
    taper('Paul Ngono', '13')
    enregistrer()

    const alerte = await screen.findByText(/Des notes ont été modifiées depuis le chargement/)
    expect(alerte.textContent).toContain('Rien n’a été enregistré')
    expect(mocks.fetchGrille).toHaveBeenCalledTimes(2)
    // Les saisies de l'enseignant sont conservées (pas d'échec silencieux, rien de perdu)
    expect(saisie('Amina Mballa').value).toBe('19')
    expect(saisie('Paul Ngono').value).toBe('13')
    // La ligne en conflit explique ce qui a changé
    expect(within(screen.getByTestId('ligne-i1')).getByRole('alert').textContent).toContain('valeur actuelle : 11')

    // Nouvel enregistrement : l'updatedAt envoyé est celui du rechargement
    mocks.enregistrerNotes.mockResolvedValueOnce({
      enregistrees: 2,
      notes: [noteDe('i1', 19, { updatedAt: '2026-10-21T10:10:00.000Z' }), noteDe('i2', 13)],
    })
    enregistrer()
    await waitFor(() => expect(mocks.enregistrerNotes).toHaveBeenCalledTimes(2))
    expect(mocks.enregistrerNotes.mock.calls[1][1][0]).toMatchObject({
      inscriptionId: 'i1',
      valeur: 19,
      updatedAt: '2026-10-21T10:09:00.000Z',
    })
    expect((await screen.findByRole('status')).textContent).toContain('2 notes enregistrées')
  })

  it('409 sans détail (écriture simultanée) : même rechargement avec message clair', async () => {
    mocks.fetchGrille.mockResolvedValue(grille({ i1: noteDe('i1', 14) }))
    mocks.enregistrerNotes.mockRejectedValueOnce({
      response: { status: 409, data: { message: 'Les notes ont été modifiées par une autre requête : rechargez la grille puis réessayez' } },
    })
    rendre()
    await screen.findByLabelText('Note de Amina Mballa')

    taper('Amina Mballa', '18')
    enregistrer()

    expect(await screen.findByText(/Des notes ont été modifiées depuis le chargement/)).toBeTruthy()
    expect(mocks.fetchGrille).toHaveBeenCalledTimes(2)
    expect(saisie('Amina Mballa').value).toBe('18')
  })

  it('NON_NOTABLE et VALEUR_INVALIDE : erreurs affichées ligne par ligne, rien d’enregistré', async () => {
    mocks.fetchGrille.mockResolvedValue(grille({}))
    mocks.enregistrerNotes.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          message: 'Saisie refusée : aucune note enregistrée',
          erreurs: [
            { inscriptionId: 'i1', code: 'NON_NOTABLE', message: 'Inscription non notable : seuls les inscrits validés peuvent être notés' },
            { inscriptionId: 'i2', code: 'VALEUR_INVALIDE', message: 'La note ne peut pas dépasser le barème (10)' },
          ],
        },
      },
    })
    rendre()
    await screen.findByLabelText('Note de Amina Mballa')

    taper('Amina Mballa', '10')
    taper('Paul Ngono', '15')
    enregistrer()

    expect(await screen.findByText(/aucune note n’a été enregistrée/)).toBeTruthy()
    expect(within(screen.getByTestId('ligne-i1')).getByRole('alert').textContent).toContain('Inscription non notable')
    expect(within(screen.getByTestId('ligne-i2')).getByRole('alert').textContent).toContain('barème (10)')
    // Pas de rechargement : ce ne sont pas des conflits, les saisies restent à corriger
    expect(mocks.fetchGrille).toHaveBeenCalledTimes(1)
    expect(saisie('Paul Ngono').value).toBe('15')
  })

  it('évaluation publiée entre-temps : rechargée en lecture seule, message explicite', async () => {
    mocks.fetchGrille
      .mockResolvedValueOnce(grille({ i1: noteDe('i1', 14) }))
      .mockResolvedValueOnce(grille({ i1: noteDe('i1', 14) }, 'PUBLIEE'))
    mocks.enregistrerNotes.mockRejectedValueOnce({
      response: { status: 409, data: { message: 'Évaluation publiée : l’enseignant ne peut plus la modifier' } },
    })
    rendre()
    await screen.findByLabelText('Note de Amina Mballa')

    taper('Amina Mballa', '18')
    enregistrer()

    expect(await screen.findByText(/publiée entre-temps/)).toBeTruthy()
    expect(screen.queryByLabelText('Note de Amina Mballa')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Enregistrer les notes' })).toBeNull()
  })
})

describe('publication et lecture seule', () => {
  it('publier demande confirmation, puis la grille devient lecture seule', async () => {
    mocks.fetchGrille
      .mockResolvedValueOnce(grille({ i1: noteDe('i1', 14), i2: noteDe('i2', 9) }))
      .mockResolvedValueOnce(grille({ i1: noteDe('i1', 14), i2: noteDe('i2', 9) }, 'PUBLIEE'))
    mocks.publierEvaluation.mockResolvedValue({ statut: 'PUBLIEE' })
    rendre()
    await screen.findByLabelText('Note de Amina Mballa')

    fireEvent.click(screen.getByRole('button', { name: 'Publier l’évaluation' }))
    const dialogue = screen.getByRole('dialog')
    expect(dialogue.textContent).toContain('la verrouille')
    expect(dialogue.textContent).toContain('2 notes saisies sur 2 inscrits')
    expect(mocks.publierEvaluation).not.toHaveBeenCalled()
    fireEvent.click(within(dialogue).getByRole('button', { name: 'Publier' }))

    expect(await screen.findByText(/Évaluation publiée : elle est visible des étudiants/)).toBeTruthy()
    expect(mocks.publierEvaluation).toHaveBeenCalledWith('ev-1')
    expect(screen.queryByLabelText('Note de Amina Mballa')).toBeNull()
    expect(screen.getByText(/lecture seule/)).toBeTruthy()
  })

  it('« Publier » est désactivé sans aucune note saisie', async () => {
    mocks.fetchGrille.mockResolvedValue(grille({}))
    rendre()
    await screen.findByLabelText('Note de Amina Mballa')
    expect(screen.getByRole('button', { name: 'Publier l’évaluation' }).disabled).toBe(true)
  })

  it('une évaluation publiée s’affiche en lecture seule, sans champ ni bouton de saisie', async () => {
    mocks.fetchGrille.mockResolvedValue(grille({ i1: noteDe('i1', 14), i2: noteDe('i2', null, { etat: 'ABSENT' }) }, 'PUBLIEE'))
    rendre()

    expect(await screen.findByText(/Pour corriger une note, contactez la scolarité/)).toBeTruthy()
    expect(screen.queryByLabelText('Note de Amina Mballa')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Enregistrer les notes' })).toBeNull()
    expect(within(screen.getByTestId('ligne-i1')).getByText('14')).toBeTruthy()
    expect(within(screen.getByTestId('ligne-i2')).getByText('Absent')).toBeTruthy()
  })

  it('évaluation introuvable (404) : message clair, pas de plantage', async () => {
    mocks.fetchGrille.mockRejectedValue({ response: { status: 404, data: { message: 'Évaluation introuvable' } } })
    rendre()
    expect(await screen.findByRole('heading', { name: 'Évaluation introuvable' })).toBeTruthy()
  })

  it('aucun inscrit validé : message adapté', async () => {
    mocks.fetchGrille.mockResolvedValue({ evaluation: evaluation(), notes: [] })
    rendre()
    expect(await screen.findByText(/Aucun inscrit validé/)).toBeTruthy()
  })
})
