"use client";

import { useCallback, useEffect, useState } from "react";
import { api, messageErreurApi } from "@/services/api";

type Reponse<T> = {
  chemin: string;
  version: number;
  donnees: T | null;
  erreur: string | null;
};

// Charge une ressource du backend (GET) et expose l'état d'affichage :
// données, message d'erreur en français, chargement, et de quoi recharger.
// Passer `null` comme chemin met le chargement en attente : on peut ainsi
// enchaîner deux appels, le second dépendant du premier. Le chargement se
// déduit de la dernière réponse reçue (celle de ce chemin et de cette
// version) : il n'y a donc pas d'instant où l'on croirait la liste vide.
export function useRessource<T>(chemin: string | null) {
  const [reponse, setReponse] = useState<Reponse<T> | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (chemin === null) return;

    const annulation = new AbortController();
    api
      .get<T>(chemin, { signal: annulation.signal })
      .then(({ data }) => {
        setReponse({ chemin, version, donnees: data, erreur: null });
      })
      .catch((erreur: unknown) => {
        if (annulation.signal.aborted) return;
        setReponse({
          chemin,
          version,
          donnees: null,
          erreur: messageErreurApi(erreur, { messageServeur: false }),
        });
      });

    return () => annulation.abort();
  }, [chemin, version]);

  const memeChemin = reponse !== null && reponse.chemin === chemin;
  const aJour = memeChemin && reponse.version === version;

  const recharger = useCallback(() => {
    setVersion((precedente) => precedente + 1);
  }, []);

  // Met à jour les données affichées sans refaire d'appel (après un PATCH).
  const remplacer = useCallback(
    (donnees: T) => {
      if (chemin === null) return;
      setReponse({ chemin, version, donnees, erreur: null });
    },
    [chemin, version],
  );

  return {
    // Pendant un rechargement, on garde les données déjà affichées.
    donnees: memeChemin ? reponse.donnees : null,
    erreur: aJour ? reponse.erreur : null,
    chargement: chemin !== null && !aJour,
    recharger,
    remplacer,
  };
}
