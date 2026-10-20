/** Documents attendus d'un candidat (valeurs de TypeDocument côté backend). */
export const documentsAttendus = [
  { type: 'CNI', label: 'Pièce d’identité (CNI)' },
  { type: 'DIPLOME', label: 'Dernier diplôme' },
  { type: 'RELEVE_NOTES', label: 'Relevé de notes' },
  { type: 'PHOTO', label: 'Photo d’identité' },
]

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
export const DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png'

const EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']

/** Taille lisible (« 2,4 Mo »). */
export function formatTaille(octets) {
  if (octets < 1024) return `${octets} o`
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`
  return `${(octets / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`
}

/**
 * Contrôle un fichier avant envoi (le serveur compte aussi les refus dans la
 * limite de débit : mieux vaut les éviter ici). Renvoie un message ou ''.
 */
export function erreurFichier(fichier) {
  const extension = fichier.name.includes('.') ? fichier.name.split('.').pop().toLowerCase() : ''
  if (!EXTENSIONS.includes(extension)) {
    return 'Format non accepté : utilisez un fichier PDF, JPG ou PNG.'
  }
  if (fichier.size === 0) return 'Ce fichier est vide.'
  if (fichier.size > MAX_DOCUMENT_BYTES) {
    return `Fichier trop lourd (${formatTaille(fichier.size)}) : 10 Mo maximum.`
  }
  return ''
}
