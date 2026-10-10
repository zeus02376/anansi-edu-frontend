import { z } from "zod";

// Valeurs partagées par plusieurs domaines.
//
// TODO backend : les statuts de dossier reprennent ceux du backend actuel
// (StatutCandidature). Les statuts de document et la demande de correction
// ne sont pas encore spécifiés : à confirmer avec l'équipe backend.

export const STATUTS_DOSSIER = [
  "SOUMIS",
  "INCOMPLET",
  "EN_EXAMEN",
  "ACCEPTE",
  "REJETE",
] as const;
export const statutDossierSchema = z.enum(STATUTS_DOSSIER);
export type StatutDossier = z.infer<typeof statutDossierSchema>;

export const LIBELLE_STATUT_DOSSIER: Record<StatutDossier, string> = {
  SOUMIS: "Soumis",
  INCOMPLET: "Correction demandée",
  EN_EXAMEN: "En examen",
  ACCEPTE: "Accepté",
  REJETE: "Refusé",
};

export const STATUTS_DOCUMENT = ["A_VERIFIER", "VALIDE", "REFUSE"] as const;
export const statutDocumentSchema = z.enum(STATUTS_DOCUMENT);
export type StatutDocument = z.infer<typeof statutDocumentSchema>;

export const LIBELLE_STATUT_DOCUMENT: Record<StatutDocument, string> = {
  A_VERIFIER: "À vérifier",
  VALIDE: "Valide",
  REFUSE: "Refusé",
};

// Mêmes valeurs que TypeDocument du backend actuel.
export const TYPES_DOCUMENT = [
  "CNI",
  "DIPLOME",
  "RELEVE_NOTES",
  "PHOTO",
  "AUTRE",
] as const;
export const typeDocumentSchema = z.enum(TYPES_DOCUMENT);
export type TypeDocument = z.infer<typeof typeDocumentSchema>;

export const LIBELLE_TYPE_DOCUMENT: Record<TypeDocument, string> = {
  CNI: "Pièce d'identité",
  DIPLOME: "Dernier diplôme",
  RELEVE_NOTES: "Relevé de notes",
  PHOTO: "Photo d'identité",
  AUTRE: "Autre document",
};

export const SEXES = ["FEMININ", "MASCULIN"] as const;
export const sexeSchema = z.enum(SEXES);
export type Sexe = z.infer<typeof sexeSchema>;

export const LIBELLE_SEXE: Record<Sexe, string> = {
  FEMININ: "Féminin",
  MASCULIN: "Masculin",
};

// TODO backend : GET /programs n'existe pas encore (le backend actuel expose
// /filieres, réservé à l'administration). Une formation = une filière et un
// niveau.
export const programSchema = z.object({
  id: z.string(),
  code: z.string(),
  nom: z.string(),
  niveau: z.string(),
});
export type Program = z.infer<typeof programSchema>;

// Date ISO renvoyée par le serveur.
export const dateIsoSchema = z.string().min(1);

export const TAILLE_MAX_DOCUMENT = 5 * 1024 * 1024; // 5 Mo
export const TYPES_MIME_DOCUMENT = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;
