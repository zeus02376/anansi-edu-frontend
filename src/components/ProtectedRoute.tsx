"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ACCUEIL_PAR_ROLE, LIBELLE_ROLE } from "@/lib/roles";
import type { Role } from "@/lib/roles";
import { useAuthStore } from "@/stores/authStore";
import { CLASSE_BOUTON_PRINCIPAL, CLASSE_TITRE } from "@/components/styles";

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
// celles qui ont l'un de ces rôles. C'est un confort d'affichage : la vraie
// barrière est le backend, qui vérifie le jeton et le rôle à chaque requête.
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

  const doitSeConnecter = estPret && !isAuthenticated;

  useEffect(() => {
    if (doitSeConnecter) router.replace("/login");
  }, [doitSeConnecter, router]);

  if (!estPret || !isAuthenticated || !role) {
    return <Attente />;
  }

  if (roles && !roles.includes(role)) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="max-w-md">
          <h1 className={CLASSE_TITRE}>Accès refusé</h1>
          <p className="mt-3 text-base text-muted">
            Cette page est réservée à d&apos;autres profils. Vous êtes
            connecté en tant que {LIBELLE_ROLE[role].toLowerCase()}.
          </p>
          <Link
            href={ACCUEIL_PAR_ROLE[role]}
            className={`${CLASSE_BOUTON_PRINCIPAL} mt-6`}
          >
            Revenir à mon tableau de bord
          </Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
