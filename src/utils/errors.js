/** Message lisible pour une erreur axios (message du serveur, délai dépassé, serveur injoignable…). */
export function getErrorMessage(error, fallback) {
  if (error.code === 'ECONNABORTED') {
    return 'Le serveur met trop de temps à répondre. Vérifiez la connexion puis réessayez.'
  }
  if (error.code === 'ERR_NETWORK') {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez.'
  }
  const message = error.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  return message || error.message || fallback
}
