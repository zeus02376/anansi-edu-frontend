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

// Espace (ex. "/scolarite") auquel appartient un chemin, ou null. Le chemin
// est décodé et débarrassé des barres en double : `/%73colarite` ou
// `//scolarite` désignent la même page que `/scolarite`. Un chemin mal
// encodé (null renvoyé par `cheminNormalise`) ne doit jamais passer.
export function cheminNormalise(pathname: string): string | null {
  try {
    return decodeURIComponent(pathname).replace(/\/{2,}/g, "/");
  } catch {
    return null;
  }
}

export function espaceDuChemin(chemin: string): string | null {
  return (
    Object.keys(ROLES_PAR_ESPACE).find(
      (prefixe) => chemin === prefixe || chemin.startsWith(`${prefixe}/`),
    ) ?? null
  );
}

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
