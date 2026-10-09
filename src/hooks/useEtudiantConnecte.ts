"use client";

import { useRessource } from "@/hooks/useRessource";
import { useAuthStore } from "@/stores/authStore";
import type { Etudiant, Inscription, Matiere } from "@/types";

// Fiche de l'étudiant connecté, ses inscriptions et les matières de son
// niveau. Le backend n'a pas de route « mon profil » : on lit /etudiants et
// /inscriptions, puis on retient ce qui correspond à la session.
export function useEtudiantConnecte() {
  const userId = useAuthStore((etat) => etat.user?.id);
  const liste = useRessource<Etudiant[]>("/etudiants");
  const toutesInscriptions = useRessource<Inscription[]>("/inscriptions");
  const toutesMatieres = useRessource<Matiere[]>("/matieres");

  const etudiant =
    liste.donnees?.find((element) => element.userId === userId) ?? null;

  // Les plus récentes d'abord.
  const inscriptions = etudiant
    ? (toutesInscriptions.donnees ?? [])
        .filter((inscription) => inscription.etudiantId === etudiant.id)
        .sort(
          (a, b) =>
            new Date(b.dateInscription).getTime() -
            new Date(a.dateInscription).getTime(),
        )
    : [];
  const inscriptionCourante = inscriptions[0] ?? null;

  const matieres =
    inscriptionCourante && toutesMatieres.donnees
      ? toutesMatieres.donnees.filter(
          (matiere) =>
            matiere.niveauId === inscriptionCourante.niveauId &&
            matiere.anneeAcademiqueId === inscriptionCourante.anneeAcademiqueId,
        )
      : null;

  return {
    chargement: liste.chargement || toutesInscriptions.chargement,
    erreur: liste.erreur ?? toutesInscriptions.erreur,
    introuvable: liste.donnees !== null && etudiant === null,
    etudiant,
    inscriptions,
    inscriptionCourante,
    // Les matières ont leur propre état : elles peuvent échouer seules.
    matieres: {
      donnees: matieres,
      chargement: toutesMatieres.chargement,
      erreur: toutesMatieres.erreur,
    },
    recharger() {
      liste.recharger();
      toutesInscriptions.recharger();
      toutesMatieres.recharger();
    },
  };
}
