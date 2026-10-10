import { z } from "zod";
import {
  dateIsoSchema,
  statutDossierSchema,
} from "@/modules/commun/schemas";

// Tableau de bord de la scolarité : liste paginée des dossiers.

export const TAILLE_PAGE = 20;

export const TRIS = ["date_desc", "date_asc"] as const;
export const LIBELLE_TRI: Record<(typeof TRIS)[number], string> = {
  date_desc: "Plus récents d'abord",
  date_asc: "Plus anciens d'abord",
};

// Critères de la liste. Ils restent dans l'état de la page (jamais dans
// l'URL : un nom saisi est une donnée personnelle). La recherche est nettoyée
// (espaces autour retirés) ; « » = pas de filtre.
export const rechercheSchema = z
  .string()
  .trim()
  .max(100, "La recherche ne peut pas dépasser 100 caractères.");

export const criteresSchema = z.object({
  page: z
    .number("Le numéro de page n'est pas valide.")
    .int("Le numéro de page n'est pas valide.")
    .min(1, "Le numéro de page doit être au moins 1.")
    .default(1),
  q: rechercheSchema.default(""),
  programId: z.string().default(""),
  statut: z
    .union([statutDossierSchema, z.literal("")], "Ce statut n'existe pas.")
    .default(""),
  tri: z.enum(TRIS, "Ce tri n'existe pas.").default("date_desc"),
});
export type Criteres = z.infer<typeof criteresSchema>;

// TODO backend : GET /applications (contrat proposé, à confirmer) : paramètres
// page, pageSize, q (nom ou numéro de dossier), programId, statut, tri
// (date_desc | date_asc) ; format de la réponse ci-dessous, y compris
// doublonPossible (calculé par le serveur) et le comportement quand la page
// demandée dépasse la dernière.
export const dossierResumeSchema = z.object({
  id: z.string(),
  numeroDossier: z.string(),
  nom: z.string(),
  prenom: z.string(),
  programme: z.object({ id: z.string(), nom: z.string() }),
  statut: statutDossierSchema,
  soumisLe: dateIsoSchema,
  doublonPossible: z.boolean("Le signalement de doublon est manquant."),
});
export type DossierResume = z.infer<typeof dossierResumeSchema>;

export const pageDossiersSchema = z.object({
  items: z.array(dossierResumeSchema),
  total: z
    .number()
    .int()
    .min(0, "Le total de dossiers ne peut pas être négatif."),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});
export type PageDossiers = z.infer<typeof pageDossiersSchema>;
