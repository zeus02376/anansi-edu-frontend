import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from './errors'

/**
 * Charge une ressource au montage. Un 404 n'est pas une erreur : « rien pour
 * l'instant » (`introuvable`), la page affiche alors un message d'attente.
 * `recharger` relance la requête (bouton « Réessayer »).
 */
export function useRessource(fetcher) {
  const [etat, setEtat] = useState({ data: null, loading: true, error: '', introuvable: false })
  const [tentative, setTentative] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setEtat({ data: null, loading: true, error: '', introuvable: false })
    fetcher(controller.signal)
      .then((data) => setEtat({ data, loading: false, error: '', introuvable: false }))
      .catch((error) => {
        if (controller.signal.aborted) return
        const introuvable = error.response?.status === 404
        setEtat({
          data: null,
          loading: false,
          introuvable,
          error: introuvable ? '' : getErrorMessage(error, 'Impossible de charger ces informations.'),
        })
      })
    return () => controller.abort()
  }, [fetcher, tentative])

  const recharger = useCallback(() => setTentative((n) => n + 1), [])
  return { ...etat, recharger }
}
