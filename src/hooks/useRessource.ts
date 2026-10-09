"use client";

import { useCallback, useEffect, useState } from "react";
import { api, messageErreurApi } from "@/services/api";

type EtatRessource<T> = {
  donnees: T | null;
  erreur: string | null;
  chargement: boolean;
};

// Charge une ressource du backend (GET) et expose l'état d'affichage :
// données, message d'erreur en français, chargement, et de quoi recharger.
// Passer `null` comme chemin met le chargement en attente.
export function useRessource<T>(chemin: string | null) {
  const [etat, setEtat] = useState<EtatRessource<T>>({
    donnees: null,
    erreur: null,
    chargement: chemin !== null,
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (chemin === null) return;

    const annulation = new AbortController();
    api
      .get<T>(chemin, { signal: annulation.signal })
      .then((reponse) => {
        setEtat({ donnees: reponse.data, erreur: null, chargement: false });
      })
      .catch((erreur: unknown) => {
        if (annulation.signal.aborted) return;
        setEtat({
          donnees: null,
          erreur: messageErreurApi(erreur),
          chargement: false,
        });
      });

    return () => annulation.abort();
  }, [chemin, version]);

  const recharger = useCallback(() => {
    setEtat((precedent) => ({ ...precedent, erreur: null, chargement: true }));
    setVersion((precedente) => precedente + 1);
  }, []);

  // Met à jour les données affichées sans refaire d'appel (après un PATCH).
  const remplacer = useCallback((donnees: T) => {
    setEtat({ donnees, erreur: null, chargement: false });
  }, []);

  return { ...etat, recharger, remplacer };
}
