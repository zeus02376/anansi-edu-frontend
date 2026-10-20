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

/**
 * Envoi d'un document (multipart). Un candidat sans compte prouve son identité
 * par le numéro de dossier ET l'e-mail de sa candidature.
 */
export function envoyerDocument({
  candidatureId,
  numeroDossier,
  email,
  typeDocument,
  fichier,
  onProgress,
  signal,
}) {
  const formulaire = new FormData()
  formulaire.append('typeDocument', typeDocument)
  formulaire.append('numeroDossier', numeroDossier)
  formulaire.append('email', email)
  formulaire.append('fichier', fichier) // le fichier en dernier : les champs texte sont lus d'abord
  return api
    .post(`/candidatures/${candidatureId}/documents`, formulaire, {
      skipAuth: true,
      signal,
      // Un fichier de 10 Mo peut dépasser le délai par défaut sur une connexion lente
      timeout: 120000,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100))
      },
    })
    .then((response) => response.data)
}
