// Dossier déposé dans cet onglet : permet de retrouver l'écran de confirmation
// après un rechargement (sans jamais redéposer la candidature). sessionStorage :
// effacé à la fermeture de l'onglet ; seuls les éléments nécessaires à l'envoi
// de documents sont conservés.
const KEY = 'anansi-dossier'

export function lireDossier() {
  try {
    const valeur = JSON.parse(sessionStorage.getItem(KEY))
    return valeur?.id && valeur?.numeroDossier && valeur?.email ? valeur : null
  } catch {
    return null
  }
}

export function ecrireDossier({ id, numeroDossier, email, piecesRequises }) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ id, numeroDossier, email, piecesRequises }))
  } catch {
    // stockage indisponible (navigation privée…) : l'écran de confirmation reste affiché
  }
}

export function effacerDossier() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // rien à faire
  }
}
