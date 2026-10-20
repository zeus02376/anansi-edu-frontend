export const langueLabels = { FR: 'Français', EN: 'Anglais', FR_EN: 'Bilingue (FR/EN)' }

export const cycleLabels = {
  BTS: 'BTS',
  HND: 'HND',
  LICENCE: 'Licence',
  MASTER: 'Master',
  INGENIEUR: 'Ingénieur',
  BSC: 'B.Sc.',
  BBA: 'BBA',
  BENG: 'B.Eng',
}

export const regimeLabels = { LMD: 'LMD', ANGLO_SAXON: 'Anglo-saxon', NATIONAL: 'National' }

export const modeAdmissionLabels = {
  CONCOURS: 'Concours',
  ETUDE_DOSSIER: 'Étude de dossier',
  ENTRETIEN: 'Entretien',
}

/** Filtres de langue proposés au public (le serveur inclut les filières bilingues). */
export const langueFilters = [
  { value: 'FR', label: 'Français' },
  { value: 'EN', label: 'Anglais' },
]

/** Montant en FCFA (« 25 000 FCFA »), ou null si non renseigné. */
export function formatMontant(value) {
  if (value === null || value === undefined) return null
  return `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`
}

/** Durée en années (« 3 ans »), ou null si non renseignée. */
export function formatDuree(annees) {
  if (!annees) return null
  return `${annees} an${annees > 1 ? 's' : ''}`
}
