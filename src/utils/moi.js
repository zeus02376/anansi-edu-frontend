export const inscriptionLabels = {
  EN_ATTENTE: 'En attente',
  VALIDE: 'Validée',
  REJETE: 'Rejetée',
  SUSPENDU: 'Suspendue',
}

export const inscriptionStyles = {
  EN_ATTENTE: 'bg-amber-100 text-amber-800',
  VALIDE: 'bg-emerald-100 text-emerald-800',
  REJETE: 'bg-red-100 text-red-800',
  SUSPENDU: 'bg-slate-100 text-slate-700',
}

export const typeEnseignantLabels = {
  PERMANENT: 'Permanent',
  VACATAIRE: 'Vacataire',
}

export const typeDocumentLabels = {
  CNI: 'Pièce d’identité',
  DIPLOME: 'Dernier diplôme',
  RELEVE_NOTES: 'Relevé de notes',
  PHOTO: 'Photo d’identité',
  AUTRE: 'Autre document',
}

/** Nom complet d'un compte (« Prénom Nom »). */
export const nomComplet = (user) => [user?.prenom, user?.nom].filter(Boolean).join(' ')

/** Inscription « en cours » : celle dont l'année couvre aujourd'hui, sinon la plus récente. */
export function inscriptionEnCours(inscriptions, maintenant = new Date()) {
  if (!inscriptions?.length) return null
  const couvrante = inscriptions.find((inscription) => {
    const { dateDebut, dateFin } = inscription.anneeAcademique ?? {}
    return dateDebut && dateFin && new Date(dateDebut) <= maintenant && maintenant <= new Date(dateFin)
  })
  return couvrante ?? inscriptions[0]
}
