"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Role } from "@/lib/roles";
import { useAuthStore } from "@/stores/authStore";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/Sidebar";

function Interface({ children }: { children: ReactNode }) {
  const role = useAuthStore((etat) => etat.user?.role);
  const [menuOuvert, setMenuOuvert] = useState(false);

  // Échap ferme le tiroir du menu sur mobile.
  useEffect(() => {
    if (!menuOuvert) return;
    function surTouche(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") setMenuOuvert(false);
    }
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [menuOuvert]);

  if (!role) return null;

  return (
    <div className="flex flex-1 lg:h-screen lg:overflow-hidden">
      <Sidebar
        role={role}
        ouvert={menuOuvert}
        onFermer={() => setMenuOuvert(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col bg-wash lg:overflow-y-auto">
        <Navbar
          menuOuvert={menuOuvert}
          onBasculerMenu={() => setMenuOuvert(!menuOuvert)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
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
