import { describe, expect, it } from 'vitest'
import {
  anneeCourante,
  erreurSaisie,
  estModifiee,
  formatNombre,
  ligneDepuisNote,
  lireValeur,
  preparerSaisie,
} from './notes'

const note = (valeur, extra = {}) => ({
  etat: 'NOTEE',
  valeur,
  commentaire: null,
  updatedAt: '2026-10-21T10:00:00.000Z',
  ...extra,
})
const ligne = (valeur, extra = {}) => ({ etat: 'NOTEE', valeur, commentaire: '', ...extra })

describe('formatNombre', () => {
  it('formate à la française, 2 décimales au plus, « — » si absent', () => {
    expect(formatNombre(12.6)).toBe('12,6')
    expect(formatNombre(14.666666)).toBe('14,67')
    expect(formatNombre(20)).toBe('20')
    expect(formatNombre(null)).toBe('—')
    expect(formatNombre(undefined)).toBe('—')
  })
})

describe('anneeCourante', () => {
  const annees = [
    { annee: { id: 'a2', dateDebut: '2027-09-01T00:00:00.000Z', dateFin: '2028-07-31T00:00:00.000Z' } },
    { annee: { id: 'a1', dateDebut: '2026-09-01T00:00:00.000Z', dateFin: '2027-07-31T00:00:00.000Z' } },
  ]

  it('choisit l’année dont les dates couvrent aujourd’hui', () => {
    expect(anneeCourante(annees, new Date('2026-12-01')).annee.id).toBe('a1')
  })

  it('à défaut, prend la plus récente (la première)', () => {
    expect(anneeCourante(annees, new Date('2030-01-01')).annee.id).toBe('a2')
  })

  it('renvoie null sans année', () => {
    expect(anneeCourante([])).toBeNull()
    expect(anneeCourante(undefined)).toBeNull()
  })
})

describe('lireValeur', () => {
  it('lit virgule et point, null si vide, NaN si invalide', () => {
    expect(lireValeur('12,5')).toBe(12.5)
    expect(lireValeur(' 12.5 ')).toBe(12.5)
    expect(lireValeur('')).toBeNull()
    expect(lireValeur('   ')).toBeNull()
    expect(Number.isNaN(lireValeur('abc'))).toBe(true)
    expect(Number.isNaN(lireValeur('-3'))).toBe(true)
  })
})

describe('ligneDepuisNote / estModifiee', () => {
  it('une note enregistrée donne une ligne non modifiée', () => {
    expect(ligneDepuisNote(note(13.5))).toEqual({ etat: 'NOTEE', valeur: '13,5', commentaire: '' })
    expect(estModifiee(ligneDepuisNote(note(13.5)), note(13.5))).toBe(false)
  })

  it('sans note, une ligne vide n’est pas modifiée', () => {
    expect(estModifiee(ligneDepuisNote(null), null)).toBe(false)
  })

  it('détecte un changement de valeur, d’état ou de commentaire (13,5 et 13.5 sont identiques)', () => {
    expect(estModifiee(ligne('13.5'), note(13.5))).toBe(false)
    expect(estModifiee(ligne('14'), note(13.5))).toBe(true)
    expect(estModifiee(ligne('', { etat: 'ABSENT' }), note(13.5))).toBe(true)
    expect(estModifiee(ligne('13,5', { commentaire: 'Bien' }), note(13.5))).toBe(true)
  })
})

describe('erreurSaisie', () => {
  it('accepte une note dans le barème, avec 2 décimales au plus', () => {
    expect(erreurSaisie(ligne('15,25'), 20, false)).toBeNull()
    expect(erreurSaisie(ligne('0'), 20, false)).toBeNull()
    expect(erreurSaisie(ligne('20'), 20, false)).toBeNull()
  })

  it('refuse hors barème, invalide, trop de décimales', () => {
    expect(erreurSaisie(ligne('20,5'), 20, false)).toContain('entre 0 et 20')
    expect(erreurSaisie(ligne('abc'), 20, false)).toBe('Nombre invalide')
    expect(erreurSaisie(ligne('12,345'), 20, false)).toBe('2 décimales au plus')
  })

  it('refuse d’effacer une note enregistrée, mais pas une saisie vide sur une note inexistante', () => {
    expect(erreurSaisie(ligne(''), 20, true)).toContain('ne peut pas être effacée')
    expect(erreurSaisie(ligne(''), 20, false)).toBeNull()
  })

  it('refuse une note pour un absent ou un dispensé', () => {
    expect(erreurSaisie(ligne('5', { etat: 'ABSENT' }), 20, false)).toContain('absent')
    expect(erreurSaisie(ligne('', { etat: 'DISPENSE' }), 20, false)).toBeNull()
  })
})

describe('preparerSaisie', () => {
  it('n’envoie que les lignes modifiées, avec l’updatedAt lu', () => {
    const notes = { a: note(10, { updatedAt: 'T-a' }), b: note(12, { updatedAt: 'T-b' }), c: null }
    const lignes = {
      a: ligne('10'), // inchangée
      b: ligne('15', { commentaire: ' Bien ' }), // modifiée, note existante
      c: ligne('9,5'), // nouvelle note
    }
    const { lignes: envoyees, erreurs } = preparerSaisie(lignes, notes, 20)
    expect(erreurs).toEqual({})
    expect(envoyees).toEqual([
      { inscriptionId: 'b', etat: 'NOTEE', valeur: 15, commentaire: 'Bien', updatedAt: 'T-b' },
      { inscriptionId: 'c', etat: 'NOTEE', valeur: 9.5 },
    ])
  })

  it('n’envoie pas d’updatedAt pour une nouvelle note, ni de valeur pour un absent', () => {
    const { lignes } = preparerSaisie({ x: ligne('', { etat: 'ABSENT' }) }, { x: null }, 20)
    expect(lignes).toEqual([{ inscriptionId: 'x', etat: 'ABSENT' }])
  })

  it('ignore une ligne vide sans note, et signale les erreurs par ligne', () => {
    const { lignes, erreurs } = preparerSaisie(
      { vide: ligne(''), trop: ligne('25'), efface: ligne('') },
      { vide: null, trop: null, efface: note(8) },
      20,
    )
    expect(lignes).toEqual([])
    expect(Object.keys(erreurs).sort()).toEqual(['efface', 'trop'])
  })
})
