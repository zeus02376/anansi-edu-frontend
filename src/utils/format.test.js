import { describe, expect, it } from 'vitest'
import { formatDate } from './format'

describe('formatDate', () => {
  it('formate une date en français court', () => {
    expect(formatDate(new Date(2026, 9, 20, 12))).toBe('20 oct. 2026')
  })

  it('renvoie « — » pour une date absente ou invalide', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('')).toBe('—')
    expect(formatDate('pas une date')).toBe('—')
  })
})
