import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, ""),
  timeout: 10_000,
});

// Chaque requête part avec le jeton de la personne connectée.
api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Un 401 veut dire que le jeton n'est plus accepté (expiré, compte
// désactivé) : on déconnecte et on renvoie vers la page de connexion.
api.interceptors.response.use(
  (reponse) => reponse,
  (erreur: unknown) => {
    if (axios.isAxiosError(erreur) && erreur.response?.status === 401) {
      useAuthStore.getState().logout();
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.assign("/login?session=expiree");
      }
    }
    return Promise.reject(erreur);
  },
);

export const MESSAGE_SERVEUR_INJOIGNABLE =
  "Le serveur est injoignable. Vérifiez votre connexion puis réessayez.";
export const MESSAGE_ACCES_REFUSE =
  "Accès refusé : votre compte n'a pas le droit de faire cette action.";

// Le backend écrit ses propres messages d'erreur en français, sauf ceux de
// la validation automatique (en anglais) qui arrivent sous forme de liste.
function messageDuBackend(donnees: unknown): string | null {
  if (typeof donnees !== "object" || donnees === null) return null;
  const { message } = donnees as { message?: unknown };
  return typeof message === "string" && message.trim() ? message : null;
}

// Traduit n'importe quel échec d'appel en une phrase lisible.
export function messageErreurApi(erreur: unknown): string {
  if (!axios.isAxiosError(erreur)) {
    return "Une erreur inattendue s'est produite. Réessayez.";
  }
  if (!erreur.response) {
    return MESSAGE_SERVEUR_INJOIGNABLE;
  }

  const { status, data } = erreur.response;
  if (status === 401) {
    return "Votre session a expiré. Reconnectez-vous.";
  }
  if (status === 403) {
    return MESSAGE_ACCES_REFUSE;
  }
  if (status === 404) {
    return messageDuBackend(data) ?? "L'élément demandé est introuvable.";
  }
  if (status === 409) {
    return (
      messageDuBackend(data) ??
      "Cette action entre en conflit avec des données existantes."
    );
  }
  if (status === 400) {
    return (
      messageDuBackend(data) ??
      "Les informations envoyées ne sont pas valides. Vérifiez les champs."
    );
  }
  if (status === 429) {
    return "Trop de requêtes. Patientez un instant avant de réessayer.";
  }
  if (status >= 500) {
    return "Le serveur rencontre un problème. Réessayez dans quelques instants.";
  }
  return "La requête a échoué. Réessayez.";
}

// Sur la page de connexion, un 401 veut dire « mauvais identifiants ».
export function messageErreurConnexion(erreur: unknown): string {
  if (axios.isAxiosError(erreur) && erreur.response) {
    const { status } = erreur.response;
    if (status === 400 || status === 401) {
      return "Identifiants refusés : e-mail ou mot de passe incorrect.";
    }
    if (status === 403) {
      return "Accès refusé : ce compte n'est pas autorisé à se connecter.";
    }
  }
  return messageErreurApi(erreur);
}
