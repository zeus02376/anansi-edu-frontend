import { api } from "@/lib/api";
import type { TypeDocument } from "@/modules/commun/schemas";
import {
  candidatureCreeeSchema,
  formationsSchema,
  type CorpsCandidature,
} from "./schemas";

// Délai d'un envoi de fichier : jusqu'à 5 Mo, bien plus long que les 15 s
// par défaut.
const DELAI_ENVOI_DOCUMENT_MS = 120_000;

// TODO backend : GET /programs n'existe pas encore (contrat proposé).
export function listerFormations(signal?: AbortSignal) {
  return api.get("/programs", { schema: formationsSchema, signal });
}

// TODO backend : POST /applications, corps JSON { nom, prenom, dateNaissance,
// sexe, telephone, email, adresse, programId } -> 201 { id, numeroDossier } ;
// 422 { errors: { champ: "message" } } à confirmer.
export function creerCandidature(corps: CorpsCandidature) {
  return api.post("/applications", { corps, schema: candidatureCreeeSchema });
}

// TODO backend : POST /applications/:id/documents, multipart/form-data avec
// « type » et « fichier » -> 201 à confirmer. Le corps de la réponse n'est ni
// utilisé ni validé : le statut 2xx suffit.
export function envoyerDocument(
  id: string,
  type: TypeDocument,
  fichier: File,
  signal?: AbortSignal,
) {
  const corps = new FormData();
  corps.append("type", type);
  corps.append("fichier", fichier);
  return api.post(`/applications/${encodeURIComponent(id)}/documents`, {
    corps,
    delaiMs: DELAI_ENVOI_DOCUMENT_MS,
    signal,
  });
}
