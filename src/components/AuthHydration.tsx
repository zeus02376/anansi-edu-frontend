"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

// Relit le jeton enregistré dans le navigateur, une fois la page affichée.
export function AuthHydration() {
  useEffect(() => {
    void useAuthStore.persist.rehydrate();
  }, []);

  return null;
}
