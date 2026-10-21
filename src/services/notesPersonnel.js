import api from './api'

// Consultation et corrections du personnel (SCOLARITE, ADMIN) : filtrées par l'établissement du JWT.
const donnees = (promesse) => promesse.then((response) => response.data)
const id = (valeur) => encodeURIComponent(valeur)

export const fetchAnnees = (signal) => donnees(api.get('/annees-academiques', { signal }))
export const fetchMatieres = (signal) => donnees(api.get('/matieres', { signal }))
export const fetchEtudiants = (signal) => donnees(api.get('/etudiants', { signal }))

/** Évaluations de l'établissement, filtrables par année et par matière. */
export const fetchEvaluationsPersonnel = ({ anneeId, matiereId } = {}, signal) =>
  donnees(
    api.get('/evaluations', {
      signal,
      params: { ...(anneeId && { anneeId }), ...(matiereId && { matiereId }) },
    }),
  )

/** Grille : inscrits VALIDE et toute inscription ayant une note, avec le journal des publications. */
export const fetchGrillePersonnel = (evaluationId, signal) =>
  donnees(api.get(`/evaluations/${id(evaluationId)}/notes`, { signal }))

/** Correction d'une note (publiée ou non) : motif obligatoire, journalisée. */
export const corrigerNote = (noteId, correction) => donnees(api.put(`/notes/${id(noteId)}`, correction))

export const fetchHistoriqueNote = (noteId, signal) =>
  donnees(api.get(`/notes/${id(noteId)}/historique`, { signal }))

export const publierEvaluationPersonnel = (evaluationId) =>
  donnees(api.post(`/evaluations/${id(evaluationId)}/publier`))

export const depublierEvaluation = (evaluationId, motif) =>
  donnees(api.post(`/evaluations/${id(evaluationId)}/depublier`, { motif }))

/** Relevé d'un étudiant : toutes ses années, ou celle demandée. */
export const fetchReleve = (etudiantId, anneeId, signal) =>
  donnees(
    api.get(`/etudiants/${id(etudiantId)}/releve`, { signal, params: anneeId ? { anneeId } : undefined }),
  )
