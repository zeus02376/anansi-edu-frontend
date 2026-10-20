import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Candidature from './Candidature'

const mocks = vi.hoisted(() => ({
  creerCandidature: vi.fn(),
  fetchAnneesOuvertes: vi.fn(),
  fetchFilieres: vi.fn(),
}))

vi.mock('../../services/candidature', () => ({
  creerCandidature: mocks.creerCandidature,
  fetchAnneesOuvertes: mocks.fetchAnneesOuvertes,
}))
vi.mock('../../services/catalogue', () => ({ fetchFilieres: mocks.fetchFilieres }))
vi.mock('../../components/candidature/DocumentsUploader', () => ({
  default: () => <div>Documents</div>,
}))

const filiere = {
  id: 'filiere-1',
  ecoleId: 'ecole-1',
  nom: 'Génie logiciel',
  cycle: 'BSC',
  langue: 'FR',
  piecesRequises: ['CNI'],
  ecole: { id: 'ecole-1', nom: 'SEAS', tenantId: 'tenant-1', campusId: null, campus: null },
}
const annee = { id: 'annee-1', libelle: '2026-2027', dateDebut: '2026-09-01T00:00:00.000Z' }

const AVERTISSEMENT = /le courriel de confirmation n’a pas pu\s+être envoyé/

beforeEach(() => {
  sessionStorage.clear()
  mocks.creerCandidature.mockReset()
  mocks.fetchFilieres.mockResolvedValue([filiere])
  mocks.fetchAnneesOuvertes.mockResolvedValue([annee])
})

afterEach(cleanup)

/** Parcourt les trois étapes (la filière est présélectionnée par ?filiere=) et dépose le dossier. */
async function deposer() {
  render(
    <MemoryRouter initialEntries={['/candidature?filiere=filiere-1']}>
      <Routes>
        <Route path="/candidature" element={<Candidature />} />
      </Routes>
    </MemoryRouter>,
  )
  const saisir = (label, value) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } })

  await screen.findByLabelText('Nom')
  saisir('Nom', 'Ngo')
  saisir('Prénom', 'Amina')
  saisir('Date de naissance', '2005-01-15')
  saisir('Lieu de naissance', 'Douala')
  saisir('Nationalité', 'Camerounaise')
  saisir('E-mail', 'amina@example.test')
  fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))

  await screen.findByText('Votre formation')
  fireEvent.click(await screen.findByRole('button', { name: 'Continuer' }))

  await screen.findByText('Vérifiez votre dossier')
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: 'Envoyer ma candidature' }))
}

describe('dépôt d’une candidature publique', () => {
  it('transmet la notification de la réponse à la confirmation : avertissement si le courriel a échoué', async () => {
    mocks.creerCandidature.mockResolvedValue({
      id: 'candidature-1',
      numeroDossier: 'CAND-2026-TEST',
      notification: { id: 'notification-1', statut: 'ECHEC', peutRelancer: true },
    })
    await deposer()

    expect(await screen.findByText('Votre candidature est enregistrée')).toBeTruthy()
    expect(screen.getByText('CAND-2026-TEST')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toMatch(AVERTISSEMENT)
    expect(screen.getByRole('status').textContent).toContain('Conservez votre numéro de dossier')
  })

  it('n’affiche aucun avertissement quand le courriel est envoyé', async () => {
    mocks.creerCandidature.mockResolvedValue({
      id: 'candidature-1',
      numeroDossier: 'CAND-2026-TEST',
      notification: { id: 'notification-1', statut: 'ENVOYEE', peutRelancer: false },
    })
    await deposer()

    expect(await screen.findByText('Votre candidature est enregistrée')).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('reste correct si la réponse ne contient pas de notification (ancien serveur)', async () => {
    mocks.creerCandidature.mockResolvedValue({ id: 'candidature-1', numeroDossier: 'CAND-2026-TEST' })
    await deposer()

    expect(await screen.findByText('Votre candidature est enregistrée')).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('envoie l’établissement de l’école de la filière et le dossier saisi', async () => {
    mocks.creerCandidature.mockResolvedValue({
      id: 'candidature-1',
      numeroDossier: 'CAND-2026-TEST',
      notification: { statut: 'ENVOYEE' },
    })
    await deposer()
    await screen.findByText('Votre candidature est enregistrée')

    expect(mocks.creerCandidature).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        filiereId: 'filiere-1',
        anneeAcademiqueId: 'annee-1',
        email: 'amina@example.test',
      }),
    )
  })

  it('ne conserve pas la notification en session : l’avertissement n’apparaît qu’au dépôt', async () => {
    mocks.creerCandidature.mockResolvedValue({
      id: 'candidature-1',
      numeroDossier: 'CAND-2026-TEST',
      notification: { statut: 'ECHEC' },
    })
    await deposer()
    await screen.findByText('Votre candidature est enregistrée')

    const conserve = JSON.parse(sessionStorage.getItem('anansi-dossier'))
    expect(conserve.numeroDossier).toBe('CAND-2026-TEST')
    expect(conserve.notification).toBeUndefined()
  })
})
