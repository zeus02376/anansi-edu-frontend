export const ROLES = ["ADMIN", "SCOLARITE", "ENSEIGNANT", "ETUDIANT"] as const;

export type Role = (typeof ROLES)[number];

export const ACCUEIL_PAR_ROLE: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  SCOLARITE: "/scolarite",
  ENSEIGNANT: "/enseignant/dashboard",
  ETUDIANT: "/etudiant/dashboard",
};

// Rôles autorisés dans chaque espace. Lu par le proxy et par les layouts.
// Les pages hors de ces espaces (/candidature, /suivi) sont ouvertes à toute
// personne connectée.
export const ROLES_PAR_ESPACE: Record<string, readonly Role[]> = {
  "/admin": ["ADMIN"],
  "/scolarite": ["SCOLARITE", "ADMIN"],
  "/enseignant": ["ENSEIGNANT"],
  "/etudiant": ["ETUDIANT"],
};

export const LIBELLE_ROLE: Record<Role, string> = {
  ADMIN: "Administrateur",
  SCOLARITE: "Scolarité",
  ENSEIGNANT: "Enseignant",
  ETUDIANT: "Étudiant",
};

export function lireRole(valeur: unknown): Role | null {
  if (typeof valeur !== "string") return null;
  const role = valeur.trim().toUpperCase();
  return (ROLES as readonly string[]).includes(role) ? (role as Role) : null;
}
