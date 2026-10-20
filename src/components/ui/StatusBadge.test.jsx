import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import StatusBadge from './StatusBadge'

afterEach(cleanup)

describe('StatusBadge', () => {
  it('affiche le libellé français du statut', () => {
    render(<StatusBadge statut="EN_EXAMEN" />)
    expect(screen.getByText('En examen')).toBeTruthy()
  })

  it('affiche le statut tel quel s’il est inconnu', () => {
    render(<StatusBadge statut="INCONNU" />)
    expect(screen.getByText('INCONNU')).toBeTruthy()
  })
})
