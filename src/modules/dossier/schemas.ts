import { z } from "zod";
import {
  dateIsoSchema,
  sexeSchema,
  statutDocumentSchema,
  statutDossierSchema,
  typeDocumentSchema,
} from "@/modules/commun/schemas";

// Détail d'un dossier pour la scolarité.
//
// TODO backend : tous les contrats de ce fichier (GET /applications/:id,
// GET /applications/:id/history, PATCH .../documents/:docId, POST
// .../comments, POST .../decision) sont des PROPOSITIONS à confirmer avec
// l'équipe backend ; aucun n'existe encore côté serveur.

export const LONGUEUR_MAX_ID = 100;
export const LONGUEUR_MAX_MOTIF = 500;
export const LONGUEUR_MAX_COMMENTAIRE = 2000;
export const LONGUEUR_MAX_MESSAGE = 1000;

// Identifiant lu dans l'URL : vérifié avant tout appel au serveur.
export const idDossierSchema = z
  .string()
  .trim()
  .min(1, "L'identifiant du dossier est obligatoire.")
  .max(LONGUEUR_MAX_ID, "L'identifiant du dossier est trop long.");

// Réponse de GET /applications/:id.
// TODO backend : forme proposée (contrat 6), à confirmer.
export const documentDossierSchema = z.object({
  id: z.string(),
  type: typeDocumentSchema,
  nomFichier: z.string(),
  statut: statutDocumentSchema,
  motif: z.string().nullable(),
});
export type DocumentDossier = z.infer<typeof documentDossierSchema>;

export const commentaireSchema = z.object({
  id: z.string(),
  auteur: z.string(),
  contenu: z.string(),
  date: dateIsoSchema,
});
export type Commentaire = z.infer<typeof commentaireSchema>;

export const dossierSchema = z.object({
  id: z.string(),
  numeroDossier: z.string(),
  statut: statutDossierSchema,
  soumisLe: dateIsoSchema,
  doublonPossible: z.boolean(),
  candidat: z.object({
    nom: z.string(),
    prenom: z.string(),
    email: z.string(),
    telephone: z.string(),
    dateNaissance: dateIsoSchema,
    sexe: sexeSchema,
    adresse: z.string(),
  }),
  programme: z.object({
    id: z.string(),
    nom: z.string(),
    niveau: z.string(),
  }),
  documents: z.array(documentDossierSchema),
  commentaires: z.array(commentaireSchema),
});
export type Dossier = z.infer<typeof dossierSchema>;

// Réponse de GET /applications/:id/history, du plus ancien au plus récent.
// TODO backend : forme proposée (contrat 7), à confirmer.
export const evenementSchema = z.object({
  id: z.string(),
  action: z.string(),
  auteur: z.string(),
  date: dateIsoSchema,
  detail: z.string().nullable(),
});
export type Evenement = z.infer<typeof evenementSchema>;
export const historiqueSchema = z.array(evenementSchema);

// Refus d'un document : le motif est obligatoire (espaces seuls refusés).
export const refusDocumentSchema = z.object({
  motif: z
    .string()
    .trim()
    .min(1, "Le motif du refus est obligatoire.")
    .max(LONGUEUR_MAX_MOTIF, `Le motif ne dépasse pas ${LONGUEUR_MAX_MOTIF} caractères.`),
});
export type RefusDocumentSaisie = z.infer<typeof refusDocumentSchema>;

// Commentaire interne.
export const commentaireSaisieSchema = z.object({
  contenu: z
    .string()
    .trim()
    .min(1, "Le commentaire est obligatoire.")
    .max(
      LONGUEUR_MAX_COMMENTAIRE,
      `Le commentaire ne dépasse pas ${LONGUEUR_MAX_COMMENTAIRE} caractères.`,
    ),
});
export type CommentaireSaisie = z.infer<typeof commentaireSaisieSchema>;

// Décision sur le dossier. Le serveur décide si l'action est permise ; le
// navigateur vérifie seulement que le message demandé est bien saisi.
export const ACTIONS_DECISION = [
  "EN_EXAMEN",
  "DEMANDER_CORRECTION",
  "ACCEPTER",
  "REFUSER",
] as const;
export const actionDecisionSchema = z.enum(ACTIONS_DECISION, {
  error: "L'action demandée n'est pas reconnue.",
});
export type ActionDecision = z.infer<typeof actionDecisionSchema>;

const MESSAGE_OBLIGATOIRE: Partial<Record<ActionDecision, string>> = {
  DEMANDER_CORRECTION: "Le message de correction est obligatoire.",
  REFUSER: "Le motif du refus est obligatoire.",
};

export const decisionSchema = z
  .object({
    action: actionDecisionSchema,
    message: z
      .string()
      .trim()
      .max(LONGUEUR_MAX_MESSAGE, `Le message ne dépasse pas ${LONGUEUR_MAX_MESSAGE} caractères.`)
      .optional(),
  })
  .superRefine((decision, contexte) => {
    const obligatoire = MESSAGE_OBLIGATOIRE[decision.action];
    if (obligatoire && !decision.message) {
      contexte.addIssue({ code: "custom", path: ["message"], message: obligatoire });
    }
  });
export type DecisionSaisie = z.input<typeof decisionSchema>;
