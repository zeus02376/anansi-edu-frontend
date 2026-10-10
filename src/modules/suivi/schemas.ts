import { z } from "zod";
import { dateIsoSchema, statutDossierSchema } from "@/modules/commun/schemas";

// Formulaire de suivi : numéro de dossier + e-mail.
// TODO backend : le format réel du numéro de dossier n'est pas connu. On ne
// vérifie donc que sa présence et une longueur raisonnable.
export const NUMERO_LONGUEUR_MAX = 50;
export const EMAIL_LONGUEUR_MAX = 254;

export const suiviSchema = z.object({
  numero: z
    .string()
    .trim()
    .min(1, "Le numéro de dossier est obligatoire.")
    .max(
      NUMERO_LONGUEUR_MAX,
      `Le numéro de dossier est trop long (${NUMERO_LONGUEUR_MAX} caractères maximum).`,
    ),
  email: z
    .string()
    .trim()
    .min(1, "L'adresse e-mail est obligatoire.")
    .max(EMAIL_LONGUEUR_MAX, "L'adresse e-mail est trop longue.")
    .pipe(z.email("L'adresse e-mail n'est pas valide.")),
});
export type SuiviSaisie = z.input<typeof suiviSchema>;
export type SuiviRecherche = z.output<typeof suiviSchema>;

// Réponse de GET /applications/track.
// TODO backend : forme proposée, à confirmer (id et date des corrections,
// motif de la décision facultatif, décision null tant qu'il n'y en a pas).
export const correctionSchema = z.object({
  id: z.string(),
  motif: z.string(),
  date: dateIsoSchema,
});
export type Correction = z.infer<typeof correctionSchema>;

export const decisionSchema = z.object({
  resultat: z.enum(["ACCEPTE", "REJETE"]),
  motif: z.string().nullable(),
  date: dateIsoSchema,
});
export type Decision = z.infer<typeof decisionSchema>;

export const suiviDossierSchema = z.object({
  numeroDossier: z.string(),
  statut: statutDossierSchema,
  corrections: z.array(correctionSchema),
  decision: decisionSchema.nullable(),
});
export type SuiviDossier = z.infer<typeof suiviDossierSchema>;
