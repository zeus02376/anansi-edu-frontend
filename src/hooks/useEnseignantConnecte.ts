"use client";

import { useRessource } from "@/hooks/useRessource";
import { useAuthStore } from "@/stores/authStore";
import type { Affectation, Enseignant } from "@/types";

// Fiche de l'enseignant connecté et ses affectations.
// Le backend n'a pas de route « mon profil » : on lit /enseignants puis on
// retient la fiche dont userId est celui de la session, avant de charger
// /enseignants/:id/affectations (qui inclut matière et année académique).
export function useEnseignantConnecte() {
  const userId = useAuthStore((etat) => etat.user?.id);
  const liste = useRessource<Enseignant[]>("/enseignants");
  const enseignant =
    liste.donnees?.find((element) => element.userId === userId) ?? null;
  const affectations = useRessource<Affectation[]>(
    enseignant ? `/enseignants/${encodeURIComponent(enseignant.id)}/affectations` : null,
  );

  return {
    // Les données de la fiche arrivent avec la liste.
    chargement: liste.chargement || (enseignant !== null && affectations.chargement),
    erreur: liste.erreur ?? affectations.erreur,
    // Vrai quand la liste est chargée mais qu'aucune fiche ne correspond.
    introuvable: liste.donnees !== null && enseignant === null,
    enseignant,
    affectations: affectations.donnees,
    recharger() {
      liste.recharger();
      affectations.recharger();
    },
  };
}
