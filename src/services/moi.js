import api from './api'

// Routes « moi » : l'identité vient du JWT, aucun identifiant n'est envoyé.
const get = (url, signal) => api.get(url, { signal }).then((response) => response.data)

export const fetchMonProfilEtudiant = (signal) => get('/etudiants/me', signal)
export const fetchMesInscriptions = (signal) => get('/etudiants/me/inscriptions', signal)
export const fetchMaCandidature = (signal) => get('/etudiants/me/candidature', signal)

export const fetchMonProfilEnseignant = (signal) => get('/enseignants/me', signal)
export const fetchMesAffectations = (signal) => get('/enseignants/me/affectations', signal)
