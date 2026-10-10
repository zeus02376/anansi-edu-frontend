import { ApiError, messageDe } from "@/lib/api";

// Sur la page de connexion, un 401 (ou un 400) veut dire « mauvais
// identifiants », pas « session expirée ».
export function messageErreurConnexion(erreur: unknown): string {
  if (erreur instanceof ApiError) {
    if (erreur.nature === "session" || erreur.nature === "validation") {
      return "Identifiants refusés : e-mail ou mot de passe incorrect.";
    }
    if (erreur.nature === "interdit") {
      return "Accès refusé : ce compte n'est pas autorisé à se connecter.";
    }
  }
  return messageDe(erreur);
}
