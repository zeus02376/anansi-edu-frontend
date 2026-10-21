// Logos de l'IUC et de SEAS : src/assets/logos/iuc.png et seas.png.
// Chargés par glob (et non par import direct) : l'application compile et s'affiche avec un
// repli textuel tant qu'un fichier n'a pas été ajouté au dépôt ; dès qu'il l'est, le logo
// apparaît sans autre modification. `undefined` = fichier absent.
const premier = (modules) => Object.values(modules)[0]

export const logoIuc = premier(
  import.meta.glob('../assets/logos/iuc.png', { eager: true, import: 'default' }),
)
export const logoSeas = premier(
  import.meta.glob('../assets/logos/seas.png', { eager: true, import: 'default' }),
)
