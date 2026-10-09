"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ACCUEIL_PAR_ROLE } from "@/lib/roles";
import type { Role } from "@/lib/roles";
import { useAuthStore } from "@/stores/authStore";

function Attente() {
  return (
    <div
      role="status"
      className="flex flex-1 items-center justify-center gap-3 p-10 text-sm text-muted"
    >
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-primary border-r-transparent motion-reduce:animate-none"
      />
      Vérification de votre session…
    </div>
  );
}

// Réserve une page aux personnes connectées et, si `roles` est fourni, à
// celles qui ont l'un de ces rôles. Sans connexion, on va sur /login ; avec
// un rôle non autorisé, sur le tableau de bord de son propre rôle. C'est un
// confort d'affichage : la vraie barrière est le backend, qui vérifie le
// jeton et le rôle à chaque requête.
export function ProtectedRoute({
  roles,
  children,
}: {
  roles?: readonly Role[];
  children: ReactNode;
}) {
  const router = useRouter();
  const estPret = useAuthStore((etat) => etat.estPret);
  const isAuthenticated = useAuthStore((etat) => etat.isAuthenticated);
  const role = useAuthStore((etat) => etat.user?.role);

  const autorise =
    isAuthenticated && role !== undefined && (!roles || roles.includes(role));
  // Où envoyer la personne si elle n'a pas sa place ici.
  const destination = !estPret || autorise
    ? null
    : isAuthenticated && role
      ? ACCUEIL_PAR_ROLE[role]
      : "/login";

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  if (!estPret || !autorise) {
    return <Attente />;
  }

  return <>{children}</>;
}
