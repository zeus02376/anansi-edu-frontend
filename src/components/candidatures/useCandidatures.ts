"use client";

import { useEffect, useRef, useState } from "react";
import { useRessource } from "@/hooks/useRessource";
import { api, messageErreurApi } from "@/services/api";
import {
  STATUTS_CANDIDATURE,
  type Candidature,
  type StatutCandidature,
} from "@/types";

function sans<T>(objet: Record<string, T>, cle: string): Record<string, T> {
  const copie = { ...objet };
  delete copie[cle];
  return copie;
}

export function nomCandidat(candidature: Candidature): string {
  return `${candidature.prenom} ${candidature.nom}`;
}

export function compterParStatut(
  candidatures: Candidature[],
): Record<StatutCandidature, number> {
  const compteurs = Object.fromEntries(
    STATUTS_CANDIDATURE.map((statut) => [statut, 0]),
  ) as Record<StatutCandidature, number>;
  for (const { statut } of candidatures) compteurs[statut] += 1;
  return compteurs;
}

// Liste des candidatures (GET /candidatures) et changement de statut d'un
// dossier. `enCours` donne, par dossier, le statut en train d'être
// enregistré ; `erreurs` le message du dernier échec.
export function useCandidatures() {
  const { donnees, erreur, chargement, recharger, remplacer } =
    useRessource<Candidature[]>("/candidatures");
  const [enCours, setEnCours] = useState<Record<string, StatutCandidature>>({});
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  // Dernière liste connue : deux changements lancés coup sur coup ne
  // doivent pas s'écraser l'un l'autre à leur retour.
  const liste = useRef<Candidature[] | null>(null);
  useEffect(() => {
    liste.current = donnees;
  }, [donnees]);

  function changerStatut(id: string, statut: StatutCandidature) {
    if (enCours[id]) return;
    setEnCours((precedent) => ({ ...precedent, [id]: statut }));
    setErreurs((precedentes) => sans(precedentes, id));

    api
      .patch<Candidature>(`/candidatures/${encodeURIComponent(id)}/statut`, {
        statut,
      })
      .then(({ data }) => {
        // La réponse n'inclut ni la filière ni l'année académique : on
        // la fusionne dans la ligne déjà affichée.
        if (liste.current) {
          const suivante = liste.current.map((candidature) =>
            candidature.id === id ? { ...candidature, ...data } : candidature,
          );
          liste.current = suivante;
          remplacer(suivante);
        }
      })
      .catch((echec: unknown) => {
        setErreurs((precedentes) => ({
          ...precedentes,
          [id]: messageErreurApi(echec),
        }));
      })
      .then(() => setEnCours((precedent) => sans(precedent, id)));
  }

  return {
    candidatures: donnees,
    erreur,
    chargement,
    recharger,
    enCours,
    erreurs,
    changerStatut,
  };
}
