"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

// Au démarrage de l'application, demande au serveur qui est connecté.
export function AuthHydration() {
  useEffect(() => {
    void useAuthStore.getState().chargerSession();
  }, []);

  return null;
}
