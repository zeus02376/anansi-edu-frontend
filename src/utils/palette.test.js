import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Garde-fou du rebranding : les anciennes couleurs inventées (bleu et doré) ne doivent pas
// revenir, et les deux paires illisibles (contraste 1,8:1) ne doivent jamais être utilisées.
const ancien = ['iuc-' + 'blue', 'iuc-' + 'gold']

function sources(dossier) {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = join(dossier, entree.name)
    if (entree.isDirectory()) return sources(chemin)
    return /\.(jsx?|css)$/.test(entree.name) ? [chemin] : []
  })
}

describe('palette IUC (rouge et vert du logo)', () => {
  const fichiers = sources('src').filter((f) => !f.endsWith('palette.test.js'))

  it('aucune classe de l’ancienne palette ne reste dans src/', () => {
    const restes = fichiers.filter((f) => ancien.some((nom) => readFileSync(f, 'utf8').includes(nom)))
    expect(restes).toEqual([])
  })

  it('la configuration Tailwind déclare le rouge et le vert du logo, plus l’ancienne palette', () => {
    const config = readFileSync('tailwind.config.js', 'utf8')
    expect(config).toContain("red: '#8C120C'")
    expect(config).toContain("green: '#277A1D'")
    expect(config).toContain("seas: '#AA670A'")
    for (const nom of ['blue:', 'gold:']) expect(config).not.toContain(nom)
  })

  it('jamais de texte vert sur fond rouge (ni l’inverse) dans une même classe', () => {
    const illisibles = []
    for (const f of fichiers) {
      for (const ligne of readFileSync(f, 'utf8').split('\n')) {
        const rougePlein = /\bbg-iuc-red(?![\w/-])/.test(ligne)
        const vertPlein = /\bbg-iuc-green(?![\w/-])/.test(ligne)
        if ((rougePlein && /\btext-iuc-green\b/.test(ligne)) || (vertPlein && /\btext-iuc-red\b/.test(ligne))) {
          illisibles.push(`${f}: ${ligne.trim().slice(0, 100)}`)
        }
      }
    }
    expect(illisibles).toEqual([])
  })
})
