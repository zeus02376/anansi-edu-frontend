"use client";

import { useSyncExternalStore } from "react";

// Vrai à partir de 768 px de large. Sert à choisir entre un tableau (grand
// écran) et une liste de cartes (mobile) : un seul des deux est affiché à la
// fois, donc aucun champ de formulaire n'est en double.
export function useEcranLarge(): boolean {
  return useSyncExternalStore(
    (notifier) => {
      const requete = window.matchMedia("(min-width: 48rem)");
      requete.addEventListener("change", notifier);
      return () => requete.removeEventListener("change", notifier);
    },
    () => window.matchMedia("(min-width: 48rem)").matches,
    () => true,
  );
}
