import api from './api'

// Établissement des routes publiques : facultatif tant qu'il n'y en a qu'un,
// obligatoire côté serveur dès qu'il y en a plusieurs (VITE_TENANT_SLUG).
const tenant = import.meta.env.VITE_TENANT_SLUG

/** GET public : pas de JWT, et l'établissement ciblé si configuré. */
export const getPublic = (url, { params, signal } = {}) =>
  api
    .get(url, { skipAuth: true, signal, params: { ...(tenant && { tenant }), ...params } })
    .then((response) => response.data)

/**
 * Filières filtrées côté serveur (langue, motCle, campusId, niveauEntree) :
 * sans filtre, renvoie toutes les filières, comme GET /filieres.
 */
export const fetchFilieres = (filtres = {}, signal) =>
  getPublic('/filieres/suggestions', { params: filtres, signal })

/** Toutes les filières de l'établissement (GET /filieres), sans filtre. */
export const fetchToutesLesFilieres = (signal) => getPublic('/filieres', { signal })

export const fetchFiliere = (id, signal) => getPublic(`/filieres/${id}`, { signal })

export const fetchCampus = (signal) => getPublic('/campus', { signal })

export const fetchEcoles = (signal) => getPublic('/ecoles', { signal })
