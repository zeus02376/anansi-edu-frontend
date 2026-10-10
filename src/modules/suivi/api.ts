import { api } from "@/lib/api";
import { suiviDossierSchema, type SuiviRecherche } from "./schemas";

// TODO backend : GET /applications/track?numero=...&email=... n'existe pas
// encore. À confirmer : noms des paramètres, 404 identique quand le numéro
// OU l'e-mail est faux (pour ne pas révéler quels dossiers existent), et
// limitation du nombre d'essais.
export function suivreDossier(recherche: SuiviRecherche, signal?: AbortSignal) {
  return api.get("/applications/track", {
    params: { numero: recherche.numero, email: recherche.email },
    schema: suiviDossierSchema,
    signal,
  });
}
