export const statuses = ['SOUMIS', 'EN_EXAMEN', 'ACCEPTE', 'REJETE', 'INCOMPLET']

export const statusLabels = {
  SOUMIS: 'Soumis',
  EN_EXAMEN: 'En examen',
  ACCEPTE: 'Accepté',
  REJETE: 'Rejeté',
  INCOMPLET: 'Incomplet',
}

export const statusStyles = {
  SOUMIS: 'bg-amber-100 text-amber-800',
  EN_EXAMEN: 'bg-blue-100 text-blue-800',
  ACCEPTE: 'bg-emerald-100 text-emerald-800',
  REJETE: 'bg-red-100 text-red-800',
  INCOMPLET: 'bg-slate-100 text-slate-700',
}

// Message destiné au candidat pour chaque statut (page de suivi public)
export const statusMessages = {
  SOUMIS: 'Votre candidature a bien été reçue. Elle n’a pas encore été examinée.',
  INCOMPLET: 'Votre dossier est incomplet. Envoyez les pièces manquantes ci-dessous.',
  EN_EXAMEN: 'Votre dossier est en cours d’examen par la scolarité.',
  ACCEPTE: 'Votre candidature a été acceptée.',
  REJETE: 'Votre candidature n’a pas été retenue.',
}

// Tant que la décision n'est pas prise, le candidat peut encore déposer des documents
// (le serveur refuse le dépôt une fois la candidature acceptée ou rejetée)
export const statutsModifiables = ['SOUMIS', 'INCOMPLET', 'EN_EXAMEN']
