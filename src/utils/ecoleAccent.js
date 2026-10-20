// Couleur d'accent par école, repérée par son code. Les classes sont écrites en
// toutes lettres pour que Tailwind les détecte. Une école absente de cette liste
// garde l'apparence par défaut (pas de liseré, pas de couleur spéciale).
const accents = {
  SEAS: { border: 'border-l-4 border-l-iuc-seas', text: 'text-iuc-seas' },
}

const parDefaut = { border: '', text: '' }

export function ecoleAccent(ecole) {
  return accents[ecole?.code] ?? parDefaut
}
