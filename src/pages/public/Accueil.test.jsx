import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Accueil from './Accueil'

const mocks = vi.hoisted(() => ({
  fetchEcoles: vi.fn(),
  logos: { iuc: '/logos/iuc.png', seas: '/logos/seas.png' },
}))

vi.mock('../../services/catalogue', () => ({ fetchEcoles: mocks.fetchEcoles }))
// Getters : chaque test choisit si les fichiers de logo « existent »
vi.mock('../../utils/logos', () => ({
  get logoIuc() {
    return mocks.logos.iuc
  },
  get logoSeas() {
    return mocks.logos.seas
  },
}))

const ecoles = [
  { id: 'ecole-droit', code: 'DROIT', nom: 'École de droit' },
  { id: 'ecole-seas-42', code: 'SEAS', nom: 'SEAS — School of Engineering and Applied Sciences' },
]

const rendre = () =>
  render(
    <MemoryRouter>
      <Accueil />
    </MemoryRouter>,
  )

beforeEach(() => {
  mocks.logos.iuc = '/logos/iuc.png'
  mocks.logos.seas = '/logos/seas.png'
  mocks.fetchEcoles.mockReset()
  mocks.fetchEcoles.mockResolvedValue(ecoles)
})

afterEach(cleanup)

describe('accueil : IUC et SEAS', () => {
  it('affiche les logos de l’IUC et de SEAS avec leurs noms', () => {
    rendre()
    expect(screen.getByRole('img', { name: 'Logo IUC' }).getAttribute('src')).toBe('/logos/iuc.png')
    expect(screen.getByRole('img', { name: 'Logo SEAS' }).getAttribute('src')).toBe('/logos/seas.png')
    expect(screen.getAllByText('Institut Universitaire de la Côte').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'SEAS — School of Engineering and Applied Sciences' })).toBeTruthy()
  })

  it('le bandeau IUC reste prudent : aucune école ni campus nommé', () => {
    rendre()
    const bandeau = screen.getByRole('region', { name: 'Institut Universitaire de la Côte' })
    expect(bandeau.textContent).toContain('Plusieurs écoles et campus')
    expect(bandeau.textContent).not.toMatch(/SEAS|Logbessou|Bonanjo/)
  })

  it('le texte de SEAS explique l’école : anglais, tutelle, formations', () => {
    rendre()
    const bloc = screen.getByRole('region', { name: /SEAS — School of Engineering/ })
    expect(bloc.textContent).toContain('anglais')
    expect(bloc.textContent).toContain('MINESUP')
    expect(bloc.textContent).toContain('en cours de vérification')
  })

  it('« Découvrir SEAS » mène à la page de l’école trouvée par son code (id jamais en dur)', async () => {
    rendre()
    const lien = await screen.findByRole('link', { name: 'Découvrir SEAS' })
    expect(lien.getAttribute('href')).toBe('/ecoles/ecole-seas-42')
    expect(mocks.fetchEcoles).toHaveBeenCalledWith(expect.anything())
  })

  it('pendant le chargement, le bouton n’est pas actif', () => {
    mocks.fetchEcoles.mockReturnValue(new Promise(() => {}))
    rendre()
    expect(screen.queryByRole('link', { name: 'Découvrir SEAS' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Découvrir SEAS' }).disabled).toBe(true)
  })

  it('SEAS absente de GET /ecoles : le bloc reste affiché, sans lien actif', async () => {
    mocks.fetchEcoles.mockResolvedValue([ecoles[0]])
    rendre()
    expect(await screen.findByText(/fiche détaillée est momentanément indisponible/)).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Découvrir SEAS' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Découvrir SEAS' }).disabled).toBe(true)
    expect(screen.getByRole('img', { name: 'Logo SEAS' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /SEAS — School of Engineering/ })).toBeTruthy()
  })

  it('GET /ecoles en erreur : l’accueil reste complet', async () => {
    mocks.fetchEcoles.mockRejectedValue({ code: 'ERR_NETWORK' })
    rendre()
    await waitFor(() => expect(screen.getByText(/fiche détaillée est momentanément indisponible/)).toBeTruthy())
    expect(screen.queryByRole('link', { name: 'Découvrir SEAS' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Trouvez la formation qui vous correspond' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Votre parcours, étape par étape' })).toBeTruthy()
  })

  it('sans fichiers de logo, des repères de repli s’affichent à la place (aucune image cassée)', () => {
    mocks.logos.iuc = undefined
    mocks.logos.seas = undefined
    rendre()
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('SEAS', { selector: 'span' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /SEAS — School of Engineering/ })).toBeTruthy()
  })

  it('garde les trois étapes Explorer, Candidater, Suivre et leurs liens, sous les nouveaux blocs', () => {
    rendre()
    for (const [label, href] of [
      ['Voir les filières →', '/filieres'],
      ['Déposer ma candidature →', '/candidature'],
      ['Suivre ma candidature →', '/suivi'],
    ]) {
      expect(screen.getByRole('link', { name: label }).getAttribute('href')).toBe(href)
    }
    const bandeau = screen.getByRole('region', { name: 'Institut Universitaire de la Côte' })
    const seas = screen.getByRole('region', { name: /SEAS — School of Engineering/ })
    const hero = screen.getByRole('heading', { name: 'Trouvez la formation qui vous correspond' })
    const etapes = screen.getByRole('heading', { name: 'Votre parcours, étape par étape' })
    const avant = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
    expect(avant(bandeau, seas)).toBe(true)
    expect(avant(seas, hero)).toBe(true)
    expect(avant(hero, etapes)).toBe(true)
  })
})
