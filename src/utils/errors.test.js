import { describe, expect, it } from 'vitest'
import { getErrorMessage } from './errors'

describe('getErrorMessage', () => {
  it('renvoie le message du serveur', () => {
    const error = { response: { data: { message: 'Candidature introuvable' } } }
    expect(getErrorMessage(error, 'repli')).toBe('Candidature introuvable')
  })

  it('assemble les messages de validation en liste', () => {
    const error = { response: { data: { message: ['email invalide', 'nom requis'] } } }
    expect(getErrorMessage(error, 'repli')).toBe('email invalide, nom requis')
  })

  it('explique un délai dépassé et un serveur injoignable', () => {
    expect(getErrorMessage({ code: 'ECONNABORTED' }, 'repli')).toContain('trop de temps')
    expect(getErrorMessage({ code: 'ERR_NETWORK' }, 'repli')).toContain('Impossible de joindre le serveur')
  })

  it('retombe sur le message de l’erreur, puis sur le repli', () => {
    expect(getErrorMessage({ message: 'boom' }, 'repli')).toBe('boom')
    expect(getErrorMessage({}, 'repli')).toBe('repli')
  })
})
