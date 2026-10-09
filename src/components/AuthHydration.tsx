"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

// Relit le jeton enregistré dans le navigateur, une fois la page affichée.
export function AuthHydration() {
  useEffect(() => {
    // Si le navigateur bloque localStorage, Zustand n'expose pas `persist` :
    // on continue avec une session gardée seulement en mémoire.
    const persistance = useAuthStore.persist as
      | typeof useAuthStore.persist
      | undefined;
    if (persistance) {
      void persistance.rehydrate();
    } else {
      useAuthStore.setState({ estPret: true });
    }
  }, []);

  return null;
}
