import api from './api'

// Évaluations et notes de l'enseignant connecté : l'identité vient du JWT.
const donnees = (promesse) => promesse.then((response) => response.data)
const ME = '/enseignants/me'

export const fetchEvaluations = (matiereId, signal) =>
  donnees(api.get(`${ME}/matieres/${encodeURIComponent(matiereId)}/evaluations`, { signal }))

export const creerEvaluation = (matiereId, evaluation) =>
  donnees(api.post(`${ME}/matieres/${encodeURIComponent(matiereId)}/evaluations`, evaluation))

export const modifierEvaluation = (id, modifications) =>
  donnees(api.patch(`${ME}/evaluations/${encodeURIComponent(id)}`, modifications))

export const supprimerEvaluation = (id) =>
  donnees(api.delete(`${ME}/evaluations/${encodeURIComponent(id)}`))

export const publierEvaluation = (id) =>
  donnees(api.post(`${ME}/evaluations/${encodeURIComponent(id)}/publier`))

/** Grille : inscrits VALIDE de la matière avec leur note (et son updatedAt). */
export const fetchGrille = (id, signal) =>
  donnees(api.get(`${ME}/evaluations/${encodeURIComponent(id)}/notes`, { signal }))

/** Saisie en lot, tout ou rien ; 409 si une note a changé depuis la lecture (updatedAt). */
export const enregistrerNotes = (id, notes) =>
  donnees(api.put(`${ME}/evaluations/${encodeURIComponent(id)}/notes`, { notes }))
