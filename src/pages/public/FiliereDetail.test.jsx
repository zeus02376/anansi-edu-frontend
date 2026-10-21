import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import FiliereDetail from './FiliereDetail'

const mocks = vi.hoisted(() => ({ fetchFiliere: vi.fn() }))

vi.mock('../../services/catalogue', () => mocks)

const filiere = {
  id: 'filiere-1',
  ecoleId: 'ecole-1',
  nom: 'Information Systems Management',
  code: 'ISM',
  cycle: 'BSC',
  langue: 'EN',
  dureeAnnees: 3,
  piecesRequises: [],
  statutDonnees: 'CONFIRME',
  ecole: {
    id: 'ecole-1',
    code: 'SEAS',
    nom: 'SEAS — School of Engineering and Applied Sciences',
    description: 'Programmes en anglais',
    campus: { id: 'campus-1', nom: 'Logbessou', adresse: null },
  },
}

const rendre = () =>
  render(
    <MemoryRouter initialEntries={['/filieres/filiere-1']}>
      <Routes>
        <Route path="/filieres/:id" element={<FiliereDetail />} />
        <Route path="/ecoles/:id" element={<p>Page école</p>} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  mocks.fetchFiliere.mockReset()
  mocks.fetchFiliere.mockResolvedValue(filiere)
})

afterEach(cleanup)

describe('fiche d’une filière', () => {
  it('le nom de l’école de la section « L’école et le campus » mène à la page de l’école', async () => {
    rendre()
    await screen.findByRole('heading', { level: 1, name: filiere.nom })
    const lien = screen.getByRole('link', { name: filiere.ecole.nom })
    expect(lien.getAttribute('href')).toBe('/ecoles/ecole-1')
    // La couleur d'accent de l'école reste sur le texte
    expect(lien.parentElement.className).toContain('text-iuc-seas')

    fireEvent.click(lien)
    expect(await screen.findByText('Page école')).toBeTruthy()
  })

  it('conserve ses états : chargement, introuvable, erreur avec réessayer', async () => {
    mocks.fetchFiliere.mockReturnValueOnce(new Promise(() => {}))
    const { unmount } = rendre()
    expect(screen.getByRole('status').textContent).toContain('Chargement de la filière')
    unmount()

    mocks.fetchFiliere.mockRejectedValueOnce({ response: { status: 404 } })
    const introuvable = rendre()
    expect(await screen.findByRole('heading', { name: 'Filière introuvable' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '← Retour aux filières' }).getAttribute('href')).toBe('/filieres')
    introuvable.unmount()

    mocks.fetchFiliere.mockRejectedValueOnce({ code: 'ERR_NETWORK' })
    rendre()
    expect((await screen.findByRole('alert')).textContent).toContain('Impossible de joindre le serveur')
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByRole('heading', { level: 1, name: filiere.nom })).toBeTruthy()
  })
})
