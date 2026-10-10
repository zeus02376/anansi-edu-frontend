import { z } from "zod";
import { api } from "@/lib/api";
import { programSchema } from "@/modules/commun/schemas";
import {
  TAILLE_PAGE,
  pageDossiersSchema,
  type Criteres,
  type PageDossiers,
} from "./schemas";

// TODO backend : GET /applications?page=&pageSize=&q=&programId=&statut=&tri=
// (contrat proposé, à confirmer, voir schemas.ts).
function demanderPage(criteres: Criteres, signal: AbortSignal) {
  return api.get("/applications", {
    params: { ...criteres, pageSize: TAILLE_PAGE },
    schema: pageDossiersSchema,
    signal,
  });
}

// Si la page demandée n'existe plus (la liste est devenue plus courte), on
// revient à la dernière page. Le numéro de page affiché est celui de la
// réponse.
export async function listerDossiers(
  criteres: Criteres,
  signal: AbortSignal,
): Promise<PageDossiers> {
  const reponse = await demanderPage(criteres, signal);
  const derniere = Math.max(1, Math.ceil(reponse.total / reponse.pageSize));
  if (criteres.page > derniere) {
    return demanderPage({ ...criteres, page: derniere }, signal);
  }
  return reponse;
}

// TODO backend : GET /programs n'existe pas encore (contrat proposé :
// Program[] { id, code, nom, niveau }).
export function listerFormations(signal: AbortSignal) {
  return api.get("/programs", { schema: z.array(programSchema), signal });
}
