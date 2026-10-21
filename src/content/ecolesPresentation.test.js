import { describe, expect, it } from 'vitest'
import { presentationParCode } from './ecolesPresentation'

describe('présentation des écoles', () => {
  it('SEAS : un texte en français qui cite l’anglais et la tutelle, marqué « à confirmer »', () => {
    const seas = presentationParCode.SEAS
    expect(seas.descriptionLongue.length).toBeGreaterThan(200)
    expect(seas.descriptionLongue).toContain('anglais')
    expect(seas.descriptionLongue).toContain('University of Buea')
    expect(seas.descriptionLongue).toContain('MINESUP')
    expect(seas.statutDonnees).toBe('A_CONFIRMER')
  })

  it('un code absent donne undefined (la page gère ce cas)', () => {
    expect(presentationParCode.INCONNU).toBeUndefined()
    expect(presentationParCode.INCONNU?.descriptionLongue).toBeUndefined()
  })
})
