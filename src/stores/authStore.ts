import { create } from "zustand";
import { api, ApiError, gererSessionExpiree } from "@/lib/api";
import { utilisateurSchema } from "@/modules/auth/schemas";
import type { Utilisateur } from "@/modules/auth/schemas";

// Session de la personne connectée.
//
// Le jeton de session est un cookie posé et lu par le backend : il n'est
// jamais accessible à JavaScript. Le navigateur ne garde que le profil
// renvoyé par GET /auth/me, en mémoire, et le perd à chaque rechargement
// (il est relu au démarrage). Rien n'est écrit dans localStorage.

type EtatAuth = {
  user: Utilisateur | null;
  isAuthenticated: boolean;
  // Vrai une fois la session vérifiée auprès du serveur : avant cela on ne
  // sait pas encore si la personne est connectée.
  estPret: boolean;
  // Pourquoi la dernière lecture de la session a échoué, hors « pas connecté ».
  erreurSession: ApiError | null;
  chargerSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<Utilisateur>;
  logout: () => Promise<void>;
  viderSession: () => void;
};

let chargementEnCours: Promise<void> | null = null;

export const useAuthStore = create<EtatAuth>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  estPret: false,
  erreurSession: null,

  // Relit la session auprès du serveur (GET /auth/me).
  // TODO backend : GET /auth/me n'existe pas encore.
  chargerSession() {
    chargementEnCours ??= (async () => {
      try {
        const user = await api.get("/auth/me", {
          schema: utilisateurSchema,
          ignorer401: true,
        });
        set({ user, isAuthenticated: true, estPret: true, erreurSession: null });
      } catch (erreur) {
        // 401 : personne n'est connecté. Toute autre erreur (serveur
        // injoignable, /auth/me absent) : on ne sait pas, donc on ne
        // laisse entrer personne.
        set({
          user: null,
          isAuthenticated: false,
          estPret: true,
          erreurSession:
            erreur instanceof ApiError && erreur.nature !== "session" ? erreur : null,
        });
      } finally {
        chargementEnCours = null;
      }
    })();
    return chargementEnCours;
  },

  // TODO backend : POST /auth/login doit poser le cookie de session (httpOnly)
  // et accepter { email, motDePasse }.
  async login(email, motDePasse) {
    await api.post("/auth/login", {
      corps: { email, motDePasse },
      ignorer401: true,
    });
    await get().chargerSession();

    const { user, erreurSession } = get();
    if (user) return user;
    throw (
      erreurSession ??
      new ApiError(
        "serveur",
        "La connexion a été acceptée mais le serveur n'a pas ouvert de session. Contactez l'équipe technique.",
      )
    );
  },

  // TODO backend : POST /auth/logout n'est pas spécifié ; il doit effacer le
  // cookie de session. La session locale est vidée tout de suite.
  logout() {
    get().viderSession();
    return api.post("/auth/logout", { ignorer401: true }).then(
      () => undefined,
      () => undefined,
    );
  },

  viderSession() {
    set({ user: null, isAuthenticated: false });
  },
}));

// Session refusée par le serveur (401) : on vide l'état et on renvoie vers
// la page de connexion.
export function terminerSession() {
  useAuthStore.getState().viderSession();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    // Hors d'un composant React il n'y a pas de routeur : on recharge la page,
    // ce qui vide aussi tout ce qui était affiché.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login?raison=session");
  }
}

gererSessionExpiree(terminerSession);
