import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import BrandMark from './BrandMark'

afterEach(cleanup)

describe('marque IUC Campus', () => {
  it('affiche le logo IUC dans une pastille blanche quand il est fourni', () => {
    render(<BrandMark logoSrc="/logo-test.png" />)
    const logo = screen.getByRole('img', { name: 'Logo IUC' })
    expect(logo.getAttribute('src')).toBe('/logo-test.png')
    expect(logo.parentElement.className).toContain('bg-white')
    expect(logo.parentElement.className).toContain('h-11')
  })

  it('le nom reste en blanc, lisible sur le fond rouge de l’en-tête', () => {
    render(<BrandMark logoSrc="/logo-test.png" subtitle="Institut Universitaire de la Côte" />)
    expect(screen.getByText('IUC Campus').className).toContain('text-white')
    expect(screen.getByText('Institut Universitaire de la Côte')).toBeTruthy()
  })

  it('sans fichier de logo, retombe sur le monogramme (fond vert, texte blanc)', () => {
    render(<BrandMark logoSrc={undefined} />)
    // Le logo n'étant pas dans le dépôt, la valeur par défaut est aussi le repli
    const monogramme = screen.getByText('I')
    expect(monogramme.className).toContain('bg-iuc-green')
    expect(monogramme.className).toContain('text-white')
    expect(screen.queryByRole('img')).toBeNull()
  })
})
