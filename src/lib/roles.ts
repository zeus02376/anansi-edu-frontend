export const ROLES = ["ADMIN", "SCOLARITE", "ENSEIGNANT", "ETUDIANT"] as const;

export type Role = (typeof ROLES)[number];

export const ACCUEIL_PAR_ROLE: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  SCOLARITE: "/scolarite/dashboard",
  ENSEIGNANT: "/enseignant/dashboard",
  ETUDIANT: "/etudiant/dashboard",
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
