import { api } from "@/lib/api";
import {
  dossierSchema,
  historiqueSchema,
  idDossierSchema,
  type ActionDecision,
} from "./schemas";

// Appels du détail d'un dossier. Les identifiants sont vérifiés puis
// encodés avant d'entrer dans un chemin.
// TODO backend : tous ces endpoints sont proposés, aucun n'est confirmé.

function chemin(id: string, suite = ""): string {
  return `/applications/${encodeURIComponent(idDossierSchema.parse(id))}${suite}`;
}

// TODO backend : GET /applications/:id (contrat 6) ; 404 si le dossier n'existe pas.
export const lireDossier = (id: string, signal?: AbortSignal) =>
  api.get(chemin(id), { schema: dossierSchema, signal });

// TODO backend : GET /applications/:id/history (contrat 7), du plus ancien au plus récent.
export const lireHistorique = (id: string, signal?: AbortSignal) =>
  api.get(chemin(id, "/history"), { schema: historiqueSchema, signal });

// Écritures : le statut 2xx suffit, la réponse n'est pas lue (le dossier et
// l'historique sont rechargés ensuite).
// TODO backend : PATCH /applications/:id/documents/:docId (contrat 8,
// proposé hors cahier des charges). Motif obligatoire pour REFUSE.
export const validerDocument = (id: string, docId: string) =>
  api.patch(chemin(id, `/documents/${encodeURIComponent(docId)}`), {
    corps: { statut: "VALIDE" },
  });

export const refuserDocument = (id: string, docId: string, motif: string) =>
  api.patch(chemin(id, `/documents/${encodeURIComponent(docId)}`), {
    corps: { statut: "REFUSE", motif },
  });

// TODO backend : POST /applications/:id/comments { contenu } (contrat 9, proposé).
export const ajouterCommentaire = (id: string, contenu: string) =>
  api.post(chemin(id, "/comments"), { corps: { contenu } });

// TODO backend : POST /applications/:id/decision { action, message? }
// (contrat 10, proposé). Message obligatoire pour DEMANDER_CORRECTION et
// REFUSER ; 409 si l'action n'est pas permise dans l'état actuel.
export const decider = (id: string, action: ActionDecision, message?: string) =>
  api.post(chemin(id, "/decision"), {
    corps: message ? { action, message } : { action },
  });
