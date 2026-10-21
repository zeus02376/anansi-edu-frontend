// Libellés et règles communes aux écrans de notes (étudiant et enseignant).

export const typeEvaluationLabels = {
  DEVOIR: 'Devoir',
  TP: 'TP',
  PROJET: 'Projet',
  EXAMEN: 'Examen',
  AUTRE: 'Autre',
}

export const etatNoteLabels = {
  NOTEE: 'Notée',
  ABSENT: 'Absent',
  DISPENSE: 'Dispensé',
}

export const statutEvaluationLabels = {
  BROUILLON: 'Brouillon',
  PUBLIEE: 'Publiée',
}

export const statutEvaluationStyles = {
  BROUILLON: 'bg-amber-100 text-amber-800',
  PUBLIEE: 'bg-emerald-100 text-emerald-800',
}

const nombre = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

/** Nombre au format français (« 12,6 »), « — » s'il est absent. */
export const formatNombre = (valeur) =>
  valeur === null || valeur === undefined ? '—' : nombre.format(valeur)

/** Année « en cours » : celle dont les dates couvrent aujourd'hui, sinon la plus récente (la première). */
export function anneeCourante(annees, maintenant = new Date()) {
  if (!annees?.length) return null
  const couvrante = annees.find(({ annee }) => {
    return (
      annee?.dateDebut &&
      annee?.dateFin &&
      new Date(annee.dateDebut) <= maintenant &&
      maintenant <= new Date(annee.dateFin)
    )
  })
  return couvrante ?? annees[0]
}

// ---------- Grille de saisie de l'enseignant ----------

/** Valeurs de formulaire d'une ligne de la grille, d'après la note enregistrée (ou vide). */
export function ligneDepuisNote(note) {
  return {
    etat: note?.etat ?? 'NOTEE',
    valeur: note?.valeur === null || note?.valeur === undefined ? '' : String(note.valeur).replace('.', ','),
    commentaire: note?.commentaire ?? '',
  }
}

/** Lit une note saisie : null si vide, NaN si invalide, sinon le nombre (virgule ou point). */
export function lireValeur(texte) {
  const brut = String(texte ?? '').trim()
  if (brut === '') return null
  if (!/^\d+([.,]\d+)?$/.test(brut)) return Number.NaN
  return Number(brut.replace(',', '.'))
}

/** La ligne diffère-t-elle de la note enregistrée ? */
export function estModifiee(ligne, note) {
  const base = ligneDepuisNote(note)
  return (
    ligne.etat !== base.etat ||
    lireValeur(ligne.valeur) !== lireValeur(base.valeur) ||
    ligne.commentaire.trim() !== base.commentaire.trim()
  )
}

/** Message d'erreur d'une ligne modifiée, ou null si elle est valide. */
export function erreurSaisie(ligne, bareme, aDejaUneNote) {
  const valeur = lireValeur(ligne.valeur)
  if (ligne.etat !== 'NOTEE') {
    return valeur === null ? null : 'Aucune note pour un absent ou un dispensé'
  }
  if (valeur === null) {
    return aDejaUneNote ? 'Une note enregistrée ne peut pas être effacée : saisissez une valeur' : null
  }
  if (Number.isNaN(valeur)) return 'Nombre invalide'
  if (!/^\d+([.,]\d{1,2})?$/.test(ligne.valeur.trim())) return '2 décimales au plus'
  if (valeur < 0 || valeur > bareme) return `La note doit être comprise entre 0 et ${formatNombre(bareme)}`
  return null
}

/**
 * Prépare la saisie en lot : ne garde que les lignes modifiées (donc seules ces notes
 * peuvent entrer en conflit), avec l'updatedAt lu dans la grille. Une ligne vide pour
 * une note qui n'existe pas encore est ignorée (rien n'a été saisi).
 * @returns {{ lignes: object[], erreurs: Record<string, string> }}
 */
export function preparerSaisie(lignes, notes, bareme) {
  const aEnvoyer = []
  const erreurs = {}
  for (const [inscriptionId, ligne] of Object.entries(lignes)) {
    const note = notes[inscriptionId] ?? null
    if (!estModifiee(ligne, note)) continue
    const valeur = lireValeur(ligne.valeur)
    if (ligne.etat === 'NOTEE' && valeur === null && !note) continue
    const erreur = erreurSaisie(ligne, bareme, Boolean(note))
    if (erreur) {
      erreurs[inscriptionId] = erreur
      continue
    }
    const commentaire = ligne.commentaire.trim()
    aEnvoyer.push({
      inscriptionId,
      etat: ligne.etat,
      ...(ligne.etat === 'NOTEE' && { valeur }),
      ...(commentaire && { commentaire }),
      ...(note && { updatedAt: note.updatedAt }),
    })
  }
  return { lignes: aEnvoyer, erreurs }
}

export const messagesCodesLigne = {
  NON_NOTABLE: 'Inscription non notable (non validée ou hors de cette matière)',
  VALEUR_INVALIDE: 'Valeur invalide',
  CONFLIT: 'Note modifiée ailleurs depuis votre chargement',
}

// ---------- Personnel (scolarité, administration) ----------

/** Contenu d'une note pour l'affichage (« 12 », « Absent », « Dispensé », « — »). */
export function libelleNote(etat, valeur) {
  if (!etat) return '—'
  if (etat === 'NOTEE') return formatNombre(valeur)
  return etatNoteLabels[etat] ?? etat
}

export const actionPublicationLabels = {
  PUBLICATION: 'Publiée',
  DEPUBLICATION: 'Dépubliée',
}

export const statutInscriptionLabels = {
  EN_ATTENTE: 'Inscription en attente',
  VALIDE: 'Inscription validée',
  REJETE: 'Inscription rejetée',
  SUSPENDU: 'Inscription suspendue',
}

/** Date et heure au format français court (« 21/10/2026 14:05 »), « — » si invalide. */
export function formatDateHeure(valeur) {
  const date = new Date(valeur)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

/** Nom complet d'un auteur renvoyé par l'API ({ nom, prenom }), « — » s'il est inconnu. */
export const nomAuteur = (auteur) => (auteur ? [auteur.prenom, auteur.nom].filter(Boolean).join(' ') : '—')
