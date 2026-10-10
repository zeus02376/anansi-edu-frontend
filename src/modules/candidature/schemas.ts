import { z } from "zod";
import {
  programSchema,
  sexeSchema,
  SEXES,
  TAILLE_MAX_DOCUMENT,
  TYPES_MIME_DOCUMENT,
  type TypeDocument,
} from "@/modules/commun/schemas";

// Formulaire de candidature en cinq étapes (identité, coordonnées,
// formation, documents, récapitulatif) et réponses du serveur associées.

function aujourdhui(): string {
  const date = new Date();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mois}-${jour}`;
}

function estUneDateValide(valeur: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valeur)) return false;
  const date = new Date(`${valeur}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(valeur);
}

// Longueurs maximales des champs de texte.
export const LONGUEUR_MAX_NOM = 100;
export const LONGUEUR_MAX_ADRESSE = 300;
export const LONGUEUR_MAX_EMAIL = 254;
// Un numéro de 15 chiffres au plus, avec ses séparateurs (espaces, points…).
export const LONGUEUR_MAX_TELEPHONE = 30;

// Étape 1 : identité. Le sexe est envoyé tel quel (FEMININ / MASCULIN).
export const identiteSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(1, "Le nom est obligatoire.")
    .max(LONGUEUR_MAX_NOM, `Le nom est trop long (${LONGUEUR_MAX_NOM} caractères maximum).`),
  prenom: z
    .string()
    .trim()
    .min(1, "Le prénom est obligatoire.")
    .max(
      LONGUEUR_MAX_NOM,
      `Le prénom est trop long (${LONGUEUR_MAX_NOM} caractères maximum).`,
    ),
  dateNaissance: z
    .string()
    .min(1, "La date de naissance est obligatoire.")
    .refine(estUneDateValide, "La date de naissance n'est pas valide.")
    .refine(
      (valeur) => !estUneDateValide(valeur) || valeur >= "1900-01-01",
      "La date de naissance n'est pas valide.",
    )
    .refine(
      (valeur) => !estUneDateValide(valeur) || valeur < aujourdhui(),
      "La date de naissance doit être dans le passé.",
    ),
  sexe: z.enum(SEXES, { error: "Sélectionnez le sexe." }),
});

// Étape 2 : coordonnées.
export const coordonneesSchema = z.object({
  telephone: z
    .string()
    .trim()
    .min(1, "Le numéro de téléphone est obligatoire.")
    .max(
      LONGUEUR_MAX_TELEPHONE,
      `Le numéro de téléphone est trop long (${LONGUEUR_MAX_TELEPHONE} caractères maximum).`,
    )
    .refine(
      (valeur) => /^\+?\d{8,15}$/.test(valeur.replace(/[\s.()-]/g, "")),
      "Le numéro de téléphone n'est pas valide (8 à 15 chiffres).",
    ),
  email: z
    .string()
    .trim()
    .min(1, "L'adresse e-mail est obligatoire.")
    .max(
      LONGUEUR_MAX_EMAIL,
      `L'adresse e-mail est trop longue (${LONGUEUR_MAX_EMAIL} caractères maximum).`,
    )
    .pipe(z.email("L'adresse e-mail n'est pas valide.")),
  adresse: z
    .string()
    .trim()
    .min(1, "L'adresse est obligatoire.")
    .min(5, "L'adresse est trop courte.")
    .max(
      LONGUEUR_MAX_ADRESSE,
      `L'adresse est trop longue (${LONGUEUR_MAX_ADRESSE} caractères maximum).`,
    ),
});

// Étape 3 : formation (identifiant d'un Program renvoyé par GET /programs).
export const formationSchema = z.object({
  programId: z
    .string({ error: "Choisissez une formation." })
    .min(1, "Choisissez une formation."),
});

// L'identifiant doit être celui d'une formation de la liste reçue du serveur
// (un brouillon peut citer une formation retirée depuis).
export function formationDansListeSchema(ids: readonly string[]) {
  return z
    .string({ error: "Choisissez une formation." })
    .refine(
      (id) => ids.includes(id),
      "Cette formation n'est pas dans la liste proposée. Choisissez-en une.",
    );
}

// Un fichier choisi dans le navigateur : absent, vide, d'un format refusé ou
// trop gros sont autant de messages distincts.
export function fichierSchema({ requis }: { requis: boolean }) {
  // Une clé absente vaut « aucun fichier » (sans cela, zod refuserait la clé).
  return z.preprocess((valeur) => valeur ?? null, z.custom<File | null>()).superRefine((fichier, ctx) => {
    if (!fichier) {
      if (requis) {
        ctx.addIssue({ code: "custom", message: "Ce document est obligatoire." });
      }
      return;
    }
    if (!(TYPES_MIME_DOCUMENT as readonly string[]).includes(fichier.type)) {
      ctx.addIssue({
        code: "custom",
        message: "Format non accepté : utilisez un fichier PDF, JPG ou PNG.",
      });
      return;
    }
    if (fichier.size === 0) {
      ctx.addIssue({ code: "custom", message: "Le fichier est vide." });
      return;
    }
    if (fichier.size > TAILLE_MAX_DOCUMENT) {
      ctx.addIssue({
        code: "custom",
        message: "Le fichier est trop lourd (5 Mo maximum).",
      });
    }
  });
}

// Étape 4 : pièce d'identité (CNI) et dernier diplôme (DIPLOME) obligatoires,
// photo d'identité (PHOTO) facultative.
export const documentsSchema = z.object({
  pieceIdentite: fichierSchema({ requis: true }),
  dernierDiplome: fichierSchema({ requis: true }),
  photoIdentite: fichierSchema({ requis: false }),
});

export const candidatureSchema = z.object({
  ...identiteSchema.shape,
  ...coordonneesSchema.shape,
  ...formationSchema.shape,
  ...documentsSchema.shape,
});
export type CandidatureSaisie = z.input<typeof candidatureSchema>;
export type Candidature = z.output<typeof candidatureSchema>;
export type NomDeChamp = keyof CandidatureSaisie;

export const ETAPES: { titre: string; champs: NomDeChamp[] }[] = [
  { titre: "Identité", champs: Object.keys(identiteSchema.shape) as NomDeChamp[] },
  { titre: "Coordonnées", champs: Object.keys(coordonneesSchema.shape) as NomDeChamp[] },
  { titre: "Formation", champs: Object.keys(formationSchema.shape) as NomDeChamp[] },
  { titre: "Documents", champs: Object.keys(documentsSchema.shape) as NomDeChamp[] },
  { titre: "Récapitulatif", champs: [] },
];
export const DERNIERE_ETAPE = ETAPES.length - 1;

// Champ du formulaire -> type de document envoyé au serveur.
export const DOCUMENTS = [
  { champ: "pieceIdentite", type: "CNI" },
  { champ: "dernierDiplome", type: "DIPLOME" },
  { champ: "photoIdentite", type: "PHOTO" },
] as const satisfies readonly {
  champ: keyof z.input<typeof documentsSchema>;
  type: TypeDocument;
}[];

// Corps de POST /applications : les données, sans les fichiers.
// TODO backend : forme du corps à confirmer.
export const corpsCandidatureSchema = z.object({
  nom: z.string(),
  prenom: z.string(),
  dateNaissance: z.string(),
  sexe: sexeSchema,
  telephone: z.string(),
  email: z.string(),
  adresse: z.string(),
  programId: z.string(),
});
export type CorpsCandidature = z.infer<typeof corpsCandidatureSchema>;

export function versCorps(valeurs: Candidature): CorpsCandidature {
  const { nom, prenom, dateNaissance, sexe, telephone, email, adresse, programId } = valeurs;
  return corpsCandidatureSchema.parse({
    nom,
    prenom,
    dateNaissance,
    sexe,
    telephone,
    email,
    adresse,
    programId,
  });
}

// Réponse de GET /programs.
// TODO backend : GET /programs n'existe pas encore ; forme proposée
// { id, code, nom, niveau }[], à confirmer.
export const formationsSchema = z.array(programSchema);

// Réponse de POST /applications (201) : seuls { id, numeroDossier } sont
// exigés, les autres champs éventuels sont ignorés.
// TODO backend : forme proposée { id, numeroDossier }, à confirmer. Les
// erreurs de validation arrivent en 422 { errors: { champ: "message" } } avec
// les noms de champs du corps ci-dessus, et des messages en français.
export const candidatureCreeeSchema = z.object({
  id: z.string(),
  numeroDossier: z.string().min(1),
});
export type CandidatureCreee = z.infer<typeof candidatureCreeeSchema>;

// POST /applications/:id/documents (201) : la réponse n'est pas utilisée, le
// statut 2xx suffit ; aucun schéma ne la valide.

// Brouillon conservé dans sessionStorage : les champs de texte et l'étape,
// jamais les fichiers.
export const brouillonSchema = z.object({
  etape: z.number().int().min(0).max(DERNIERE_ETAPE),
  valeurs: z.object({
    nom: z.string().optional(),
    prenom: z.string().optional(),
    dateNaissance: z.string().optional(),
    sexe: z.enum(SEXES).optional(),
    telephone: z.string().optional(),
    email: z.string().optional(),
    adresse: z.string().optional(),
    programId: z.string().optional(),
  }),
});
export type Brouillon = z.infer<typeof brouillonSchema>;

// Numéro de dossier lu dans l'URL de la confirmation : on ne garde que des
// caractères sûrs, sur 40 au plus ; vide, il n'y a rien à afficher.
export const numeroUrlSchema = z
  .string()
  .transform((valeur) => valeur.replace(/[^A-Za-z0-9\-_./]/g, "").slice(0, 40))
  .pipe(z.string().min(1));
