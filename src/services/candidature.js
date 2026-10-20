import api from './api'
import { getPublic } from './catalogue'

// Toutes ces routes sont publiques : aucun JWT n'est envoyé (skipAuth).

/** Années académiques ouvertes aux candidatures (id, libelle, dateDebut, dateFin). */
export const fetchAnneesOuvertes = (signal) => getPublic('/annees-academiques/ouvertes', { signal })

/** Dépôt d'une candidature : renvoie la candidature créée (id, numeroDossier, statut…). */
export const creerCandidature = (payload) =>
  api.post('/candidatures', payload, { skipAuth: true }).then((response) => response.data)

/** Suivi par numéro de dossier exact : sous-ensemble public de la candidature. */
export const fetchSuivi = (numeroDossier, signal) =>
  getPublic(`/candidatures/suivi/${encodeURIComponent(numeroDossier)}`, { signal })
