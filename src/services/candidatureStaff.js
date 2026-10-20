import api from './api'

/**
 * @typedef {Object} NotificationCandidature
 * @property {string} id
 * @property {'EN_ATTENTE'|'EN_COURS'|'ENVOYEE'|'ECHEC'} statut
 * @property {boolean} peutRelancer
 * @property {string} createdAt
 * @property {string|null} [envoyeLe]
 */

const encodePathSegment = (value) => encodeURIComponent(String(value))

/** Récupère un document avec la session du personnel, sans exposer l'URL serveur. */
export const fetchCandidatureDocument = (candidatureId, documentId) =>
  api
    .get(
      `/candidatures/${encodePathSegment(candidatureId)}/documents/${encodePathSegment(documentId)}/fichier`,
      { responseType: 'blob' },
    )
    .then((response) => response.data)

/**
 * Relance l'envoi d'une notification échouée avec la session du personnel.
 * @returns {Promise<NotificationCandidature>}
 */
export const retryCandidatureNotification = (candidatureId, notificationId) =>
  api
    .post(
      `/candidatures/${encodePathSegment(candidatureId)}/notifications/${encodePathSegment(notificationId)}/retry`,
    )
    .then((response) => response.data)
