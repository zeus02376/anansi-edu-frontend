import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import EcolePresentation from './EcolePresentation'

const mocks = vi.hoisted(() => ({
  fetchEcole: vi.fn(),
  fetchToutesLesFilieres: vi.fn(),
}))

vi.mock('../../services/catalogue', () => mocks)

const ecoleSeas = {
  id: 'ecole-1',
  code: 'SEAS',
  nom: 'SEAS — School of Engineering and Applied Sciences',
  description: 'Programmes en anglais, tutelle University of Buea + MINESUP',
  campusId: 'campus-1',
  campus: { id: 'campus-1', nom: 'Logbessou', adresse: 'Douala' },
}

const filiere = (id, nom, ecoleId, extra = {}) => ({
  id,
  nom,
  code: nom.slice(0, 3).toUpperCase(),
  cycle: 'BSC',
  langue: 'EN',
  ecoleId,
  ecole: { id: ecoleId, nom: 'École', code: 'X', campus: null },
  piecesRequises: [],
  statutDonnees: 'CONFIRME',
  ...extra,
})

const toutes = [
  filiere('f-1', 'Information Systems Management', 'ecole-1'),
  filiere('f-2', 'Computer Science Engineering', 'ecole-1'),
  filiere('f-3', 'Droit des affaires', 'ecole-2'),
]

function rendre(chemin = '/ecoles/ecole-1') {
  return render(
    <MemoryRouter initialEntries={[chemin]}>
      <Routes>
        <Route path="/ecoles/:id" element={<EcolePresentation />} />
        <Route path="/filieres" element={<p>Catalogue</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const reponseHttp = (status) => ({ response: { status, data: { message: 'Erreur' } } })

beforeEach(() => {
  mocks.fetchEcole.mockReset()
  mocks.fetchToutesLesFilieres.mockReset()
  mocks.fetchEcole.mockResolvedValue(ecoleSeas)
  mocks.fetchToutesLesFilieres.mockResolvedValue(toutes)
})

afterEach(cleanup)

describe('présentation d’une école', () => {
  it('affiche un état de chargement tant que l’école n’est pas arrivée', () => {
    mocks.fetchEcole.mockReturnValue(new Promise(() => {}))
    rendre()
    expect(screen.getByRole('status').textContent).toContain('Chargement de l’école')
  })

  it('école introuvable (404 ou 400) : message clair et retour au catalogue', async () => {
    for (const status of [404, 400]) {
      mocks.fetchEcole.mockRejectedValueOnce(reponseHttp(status))
      const { unmount } = rendre()
      expect(await screen.findByRole('heading', { name: 'École introuvable' })).toBeTruthy()
      expect(screen.getByRole('link', { name: '← Retour aux filières' }).getAttribute('href')).toBe('/filieres')
      unmount()
    }
  })

  it('erreur réseau : message, puis « Réessayer » recharge l’école', async () => {
    mocks.fetchEcole.mockRejectedValueOnce({ code: 'ERR_NETWORK' })
    rendre()
    expect((await screen.findByRole('alert')).textContent).toContain('Impossible de joindre le serveur')
    expect(screen.getByRole('heading', { name: 'Chargement impossible' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByRole('heading', { level: 1, name: ecoleSeas.nom })).toBeTruthy()
    expect(mocks.fetchEcole).toHaveBeenCalledTimes(2)
  })

  it('affiche le nom, le campus, la description et le texte de présentation', async () => {
    rendre()
    expect(await screen.findByRole('heading', { level: 1, name: ecoleSeas.nom })).toBeTruthy()
    expect(screen.getByText('Campus Logbessou — Douala')).toBeTruthy()
    expect(screen.getByText(ecoleSeas.description)).toBeTruthy()
    const presentation = screen.getByRole('heading', { name: 'Présentation' }).parentElement
    expect(presentation.textContent).toContain('anglais')
    expect(presentation.textContent).toContain('University of Buea')
    expect(presentation.textContent).toContain('MINESUP')
    expect(screen.getByRole('link', { name: 'Filières' }).getAttribute('href')).toBe('/filieres')
    expect(document.title).toBe(`${ecoleSeas.nom} · IUC Campus`)
    expect(mocks.fetchEcole).toHaveBeenCalledWith('ecole-1', expect.anything())
  })

  it('applique la couleur d’accent de l’école et signale la présentation « à confirmer »', async () => {
    rendre()
    const titre = await screen.findByRole('heading', { level: 1, name: ecoleSeas.nom })
    expect(titre.className).toContain('text-iuc-seas')
    expect(titre.className).toContain('border-l-iuc-seas')
    expect(screen.getByRole('note').textContent).toContain('en cours de vérification')
  })

  it('école sans campus : pas de ligne campus', async () => {
    mocks.fetchEcole.mockResolvedValue({ ...ecoleSeas, campusId: null, campus: null })
    rendre()
    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByText(/Campus/)).toBeNull()
  })

  it('ne liste que les filières de l’école', async () => {
    rendre()
    expect(await screen.findByText('2 filières')).toBeTruthy()
    const liens = screen
      .getAllByRole('link')
      .filter((lien) => lien.getAttribute('href')?.startsWith('/filieres/'))
    expect(liens.map((lien) => lien.textContent)).toEqual([
      'Information Systems Management',
      'Computer Science Engineering',
    ])
    expect(liens[0].getAttribute('href')).toBe('/filieres/f-1')
    expect(screen.queryByText('Droit des affaires')).toBeNull()
    expect(mocks.fetchToutesLesFilieres).toHaveBeenCalled()
  })

  it('une école sans entrée dans les présentations : message neutre, sans bandeau ni plantage', async () => {
    mocks.fetchEcole.mockResolvedValue({
      id: 'ecole-2',
      code: 'INCONNU',
      nom: 'École de droit',
      description: null,
      campusId: null,
      campus: null,
    })
    rendre('/ecoles/ecole-2')
    expect(await screen.findByRole('heading', { level: 1, name: 'École de droit' })).toBeTruthy()
    expect(screen.getByText('Présentation en cours de rédaction.')).toBeTruthy()
    expect(screen.queryByRole('note')).toBeNull()
    // Et ses filières s'affichent quand même
    expect(await screen.findByText('Droit des affaires')).toBeTruthy()
    expect(screen.getByText('1 filière')).toBeTruthy()
  })

  it('école sans filière : message adapté', async () => {
    mocks.fetchToutesLesFilieres.mockResolvedValue([filiere('f-3', 'Droit', 'ecole-2')])
    rendre()
    expect(await screen.findByText(/Aucune filière n’est proposée pour cette école/)).toBeTruthy()
  })

  it('échec du chargement des filières : l’école reste affichée, avec « Réessayer »', async () => {
    mocks.fetchToutesLesFilieres.mockRejectedValueOnce({ code: 'ERR_NETWORK' })
    rendre()
    expect(await screen.findByRole('heading', { level: 1, name: ecoleSeas.nom })).toBeTruthy()
    const alerte = await screen.findByRole('alert')
    expect(within(alerte).getByText(/Impossible de joindre le serveur/)).toBeTruthy()
    expect(screen.getByText(/Présentation/)).toBeTruthy()

    fireEvent.click(within(alerte).getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByText('2 filières')).toBeTruthy()
    expect(mocks.fetchEcole).toHaveBeenCalledTimes(1)
  })
})
