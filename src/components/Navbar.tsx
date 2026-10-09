"use client";

import { useRouter } from "next/navigation";
import { LIBELLE_ROLE } from "@/lib/roles";
import { useAuthStore } from "@/stores/authStore";
import { CLASSE_BOUTON_SECONDAIRE } from "@/components/styles";

// Barre du haut : bouton du menu (mobile), personne connectée, déconnexion.
export function Navbar({
  menuOuvert,
  onBasculerMenu,
}: {
  menuOuvert: boolean;
  onBasculerMenu: () => void;
}) {
  const router = useRouter();
  const user = useAuthStore((etat) => etat.user);
  const logout = useAuthStore((etat) => etat.logout);

  function seDeconnecter() {
    logout();
    router.replace("/login");
  }

  // Le nom n'est connu que pendant la session où l'on s'est connecté : il
  // n'est pas enregistré dans le navigateur.
  const nom = [user?.prenom, user?.nom].filter(Boolean).join(" ");

  return (
    <header className="sticky top-0 z-20 print:hidden flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6">
      <button
        type="button"
        onClick={onBasculerMenu}
        aria-expanded={menuOuvert}
        aria-controls="menu-principal"
        className="-ml-1.5 flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-primary lg:hidden"
      >
        <span className="sr-only">
          {menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="size-5"
        >
          <path d="M3 5.5h14M3 10h14M3 14.5h14" />
        </svg>
      </button>

      <div className="ml-auto flex min-w-0 items-center gap-4">
        {user && (
          <p className="min-w-0 text-right text-sm leading-tight">
            {nom && (
              <span className="block truncate font-semibold text-ink">
                {nom}
              </span>
            )}
            <span
              className={
                nom ? "block text-muted" : "block font-semibold text-ink"
              }
            >
              {LIBELLE_ROLE[user.role]}
            </span>
          </p>
        )}
        <button
          type="button"
          onClick={seDeconnecter}
          className={`${CLASSE_BOUTON_SECONDAIRE} shrink-0 px-3.5 py-2`}
        >
          Se déconnecter
        </button>
      </div>
    </header>
  );
}
