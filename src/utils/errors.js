/** Message lisible pour une erreur axios (message du serveur, délai dépassé…). */
export function getErrorMessage(error, fallback) {
  if (error.code === 'ECONNABORTED') {
    return 'Le serveur met trop de temps à répondre. Vérifiez la connexion puis réessayez.'
  }
  const message = error.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  return message || error.message || fallback
}
