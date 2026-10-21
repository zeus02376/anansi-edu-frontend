import api from './api'

// Routes « moi » : l'identité vient du JWT, aucun identifiant n'est envoyé.
const get = (url, signal) => api.get(url, { signal }).then((response) => response.data)

export const fetchMonProfilEtudiant = (signal) => get('/etudiants/me', signal)
export const fetchMesInscriptions = (signal) => get('/etudiants/me/inscriptions', signal)
export const fetchMaCandidature = (signal) => get('/etudiants/me/candidature', signal)

export const fetchMonProfilEnseignant = (signal) => get('/enseignants/me', signal)
export const fetchMesAffectations = (signal) => get('/enseignants/me/affectations', signal)

/** Mes notes publiées et moyennes provisoires ; sans anneeId : toutes mes années. */
export const fetchMesNotes = (anneeId, signal) =>
  api
    .get('/etudiants/me/notes', { signal, params: anneeId ? { anneeId } : undefined })
    .then((response) => response.data)

/** Variante sans paramètre (référence stable pour useRessource). */
export const fetchToutesMesNotes = (signal) => fetchMesNotes(undefined, signal)
