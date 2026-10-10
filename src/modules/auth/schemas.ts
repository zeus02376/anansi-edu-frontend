import { z } from "zod";
import { ROLES } from "@/lib/roles";

// Formulaire de connexion. Le backend refuse tout mot de passe de moins de
// 8 caractères.
export const connexionSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "L'adresse e-mail est obligatoire.")
    .pipe(z.email("L'adresse e-mail n'est pas valide.")),
  password: z
    .string()
    .min(1, "Le mot de passe est obligatoire.")
    .min(8, "Le mot de passe contient au moins 8 caractères."),
});
export type ConnexionSaisie = z.infer<typeof connexionSchema>;

// Réponse de GET /auth/me : la personne connectée et son rôle.
// TODO backend : GET /auth/me n'existe pas encore ; forme proposée, à
// confirmer. Le rôle vient toujours du serveur, jamais du navigateur.
export const utilisateurSchema = z.object({
  id: z.string(),
  role: z.enum(ROLES),
  tenantId: z.string().optional(),
  nom: z.string().optional(),
  prenom: z.string().optional(),
  email: z.string().optional(),
});
export type Utilisateur = z.infer<typeof utilisateurSchema>;
