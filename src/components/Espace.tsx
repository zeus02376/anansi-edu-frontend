"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/roles";
import { useAuthStore } from "@/stores/authStore";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/Sidebar";

function Interface({ children }: { children: ReactNode }) {
  const role = useAuthStore((etat) => etat.user?.role);
  const chemin = usePathname();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const contenu = useRef<HTMLDivElement>(null);

  // Tiroir du menu sur mobile : tant qu'il est ouvert, le focus y entre, le
  // reste de la page est neutralisé et ne défile plus ; Échap le ferme. À la
  // fermeture, le focus revient sur le bouton qui l'a ouvert.
  useEffect(() => {
    if (!menuOuvert) return;

    const colonne = contenu.current;
    const bouton = document.querySelector<HTMLElement>(
      '[aria-controls="menu-principal"]',
    );
    function surTouche(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") setMenuOuvert(false);
    }

    colonne?.setAttribute("inert", "");
    document.body.style.overflow = "hidden";
    document
      .querySelector<HTMLElement>("#menu-principal a[aria-current], #menu-principal a")
      ?.focus();
    window.addEventListener("keydown", surTouche);

    return () => {
      colonne?.removeAttribute("inert");
      document.body.style.overflow = "";
      window.removeEventListener("keydown", surTouche);
      bouton?.focus();
    };
  }, [menuOuvert]);

  if (!role) return null;

  return (
    <div className="flex flex-1 lg:h-screen lg:overflow-hidden">
      <Sidebar
        role={role}
        ouvert={menuOuvert}
        onFermer={() => setMenuOuvert(false)}
      />
      <div
        ref={contenu}
        className="flex min-w-0 flex-1 flex-col bg-wash lg:overflow-y-auto"
      >
        <Navbar
          menuOuvert={menuOuvert}
          onBasculerMenu={() => setMenuOuvert(!menuOuvert)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {/* La clé relance l'animation d'entrée à chaque changement de page. */}
          <div key={chemin} className="apparition mx-auto w-full max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Enveloppe commune des espaces connectés : contrôle d'accès, menu latéral
// et barre du haut. `roles` liste les profils autorisés dans cet espace.
export function Espace({
  roles,
  children,
}: {
  roles: readonly Role[];
  children: ReactNode;
}) {
  return (
    <ProtectedRoute roles={roles}>
      <Interface>{children}</Interface>
    </ProtectedRoute>
  );
}
