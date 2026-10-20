import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Confirmation from './Confirmation'

vi.mock('./DocumentsUploader', () => ({
  default: () => <div>Documents</div>,
}))

afterEach(cleanup)

const dossier = {
  id: 'candidature-1',
  numeroDossier: 'CAND-2026-TEST',
  email: 'candidate@example.test',
}

function renderConfirmation(notification) {
  return render(
    <MemoryRouter>
      <Confirmation dossier={dossier} notification={notification} onNouvelle={vi.fn()} />
    </MemoryRouter>,
  )
}

describe('confirmation de candidature publique', () => {
  it('avertit si le courriel de confirmation a échoué, en demandant de garder le numéro', () => {
    renderConfirmation({ statut: 'ECHEC' })

    expect(screen.getByRole('status').textContent).toContain(
      'Votre candidature a bien été enregistrée, mais le courriel de confirmation n’a pas pu être envoyé.',
    )
    expect(screen.getByRole('status').textContent).toContain(
      'Conservez votre numéro de dossier',
    )
    expect(screen.getByText('CAND-2026-TEST')).toBeTruthy()
  })

  it('conserve la confirmation existante quand le courriel est envoyé', () => {
    renderConfirmation({ statut: 'ENVOYEE' })

    expect(screen.getByRole('heading', { name: 'Votre candidature est enregistrée' })).toBeTruthy()
    expect(screen.getByText('CAND-2026-TEST')).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
  })
})
