import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { lireRole } from "@/lib/roles";
import type { Role } from "@/lib/roles";
import type { ReponseConnexion, Utilisateur } from "@/types";

const DELAI_CONNEXION_MS = 10_000;

type ChargeDuJeton = { sub: string; tenantId: string; role: Role };

// Lit le contenu du jeton sans le vérifier : la signature est contrôlée par
// le backend à chaque requête. Ici on s'en sert seulement pour savoir qui
// est connecté après un rechargement, et pour écarter un jeton expiré.
function lireJeton(jeton: string): ChargeDuJeton | null {
  try {
    const partie = jeton.split(".")[1];
    const base64 = partie.replace(/-/g, "+").replace(/_/g, "/");
    const charge: unknown = JSON.parse(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")),
    );
    if (typeof charge !== "object" || charge === null) return null;

    const { sub, tenantId, role, exp } = charge as Record<string, unknown>;
    if (typeof sub !== "string" || typeof tenantId !== "string") return null;
    const roleLu = lireRole(role);
    if (!roleLu) return null;
    if (typeof exp === "number" && exp * 1000 <= Date.now()) return null;

    return { sub, tenantId, role: roleLu };
  } catch {
    return null;
  }
}

type EtatAuth = {
  user: Utilisateur | null;
  token: string | null;
  isAuthenticated: boolean;
  // Vrai une fois le jeton relu dans le navigateur : avant cela on ne sait
  // pas encore si la personne est connectée.
  estPret: boolean;
  login: (email: string, password: string) => Promise<Utilisateur>;
  logout: () => void;
};

export const useAuthStore = create<EtatAuth>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      estPret: false,

      // Appel direct, sans passer par l'instance de services/api.ts : cette
      // requête n'a pas de jeton à envoyer, et un 401 y signifie « mauvais
      // identifiants », pas « session expirée ».
      async login(email, password) {
        const { data } = await axios.post<ReponseConnexion>(
          `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? ""}/auth/login`,
          { email, motDePasse: password },
          { timeout: DELAI_CONNEXION_MS },
        );
        set({ user: data.user, token: data.access_token, isAuthenticated: true });
        return data.user;
      },

      logout() {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "anansi-auth",
      // Seul le jeton va dans localStorage.
      partialize: (etat) => ({ token: etat.token }),
      // La relecture est déclenchée côté navigateur par <AuthHydration />.
      skipHydration: true,
      merge: (stocke, etat) => {
        const jeton = (stocke as { token?: unknown } | undefined)?.token;
        const charge = typeof jeton === "string" ? lireJeton(jeton) : null;
        if (typeof jeton !== "string" || !charge) return etat;
        return {
          ...etat,
          token: jeton,
          user: { id: charge.sub, tenantId: charge.tenantId, role: charge.role },
          isAuthenticated: true,
        };
      },
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ estPret: true });
      },
    },
  ),
);
