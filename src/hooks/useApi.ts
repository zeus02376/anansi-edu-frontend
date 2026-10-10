"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Reponse<T> = {
  cle: string;
  version: number;
  donnees: T | null;
  erreur: unknown;
};

// Charge une ressource avec le client d'API (lib/api.ts) et expose l'état
// d'affichage : données, erreur (à afficher avec <EtatErreur>), chargement,
// et de quoi recharger.
//  - `cle` décrit tout ce dont dépend l'appel (page, filtres, identifiant) :
//    quand elle change, la ressource est rechargée ;
//  - `charger` à null met le chargement en attente.
// Pendant un rechargement, les données déjà affichées sont conservées.
export function useApi<T>(
  charger: ((signal: AbortSignal) => Promise<T>) | null,
  cle: string,
) {
  const [reponse, setReponse] = useState<Reponse<T> | null>(null);
  const [version, setVersion] = useState(0);
  const dernierChargeur = useRef(charger);

  useEffect(() => {
    dernierChargeur.current = charger;
  });

  useEffect(() => {
    const lancer = dernierChargeur.current;
    if (!lancer) return;

    const annulation = new AbortController();
    lancer(annulation.signal)
      .then((donnees) => {
        setReponse({ cle, version, donnees, erreur: null });
      })
      .catch((erreur: unknown) => {
        if (annulation.signal.aborted) return;
        setReponse({ cle, version, donnees: null, erreur });
      });

    return () => annulation.abort();
  }, [cle, version]);

  const memeCle = reponse !== null && reponse.cle === cle;
  const aJour = memeCle && reponse.version === version;

  const recharger = useCallback(() => {
    setVersion((precedente) => precedente + 1);
  }, []);

  // Remplace les données affichées sans refaire d'appel.
  const remplacer = useCallback(
    (donnees: T) => {
      setReponse({ cle, version, donnees, erreur: null });
    },
    [cle, version],
  );

  return {
    donnees: memeCle ? reponse.donnees : null,
    erreur: aJour ? reponse.erreur : null,
    chargement: charger !== null && !aJour,
    recharger,
    remplacer,
  };
}
