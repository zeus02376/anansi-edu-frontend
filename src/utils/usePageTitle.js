import { useEffect } from 'react'

/** Titre de l'onglet : « <titre> · IUC Campus ». */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · IUC Campus` : 'IUC Campus'
  }, [title])
}
