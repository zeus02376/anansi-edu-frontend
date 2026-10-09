"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/roles";
import { Logo } from "@/components/Logo";

type Lien = { href: string; libelle: string };
type Groupe = { titre?: string; liens: Lien[] };

const LIENS_SCOLARITE: Lien[] = [
  { href: "/scolarite/dashboard", libelle: "Tableau de bord" },
  { href: "/scolarite/candidatures", libelle: "Candidatures" },
  { href: "/scolarite/etudiants", libelle: "Étudiants" },
];

// Un administrateur a aussi accès à l'espace scolarité.
const NAVIGATION: Record<Role, Groupe[]> = {
  ADMIN: [
    {
      titre: "Administration",
      liens: [
        { href: "/admin/dashboard", libelle: "Tableau de bord" },
        { href: "/admin/tenants", libelle: "Établissements" },
        { href: "/admin/ecoles", libelle: "Écoles" },
      ],
    },
    { titre: "Scolarité", liens: LIENS_SCOLARITE },
  ],
  SCOLARITE: [{ liens: LIENS_SCOLARITE }],
  ENSEIGNANT: [
    {
      liens: [
        { href: "/enseignant/dashboard", libelle: "Tableau de bord" },
        { href: "/enseignant/matieres", libelle: "Mes matières" },
        { href: "/enseignant/profil", libelle: "Mon profil" },
      ],
    },
  ],
  ETUDIANT: [
    {
      liens: [
        { href: "/etudiant/dashboard", libelle: "Tableau de bord" },
        { href: "/etudiant/dossier", libelle: "Mon dossier" },
        { href: "/etudiant/inscriptions", libelle: "Mes inscriptions" },
        { href: "/etudiant/matieres", libelle: "Mes matières" },
      ],
    },
  ],
};

// Menu latéral : fixe sur grand écran, tiroir coulissant sur mobile.
export function Sidebar({
  role,
  ouvert,
  onFermer,
}: {
  role: Role;
  ouvert: boolean;
  onFermer: () => void;
}) {
  const chemin = usePathname();

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onFermer}
        className={`fixed inset-0 z-30 print:hidden bg-ink/40 transition-opacity duration-200 lg:hidden ${
          ouvert ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        id="menu-principal"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 print:hidden flex-col bg-panel text-white transition-transform duration-200 motion-reduce:transition-none lg:static lg:z-auto lg:translate-x-0 ${
          ouvert ? "translate-x-0" : "invisible -translate-x-full lg:visible"
        }`}
      >
        <p className="flex h-16 shrink-0 items-center px-6">
          <Logo className="text-lg" />
        </p>

        <nav
          aria-label="Menu principal"
          className="flex-1 overflow-y-auto px-3 pb-6"
        >
          {NAVIGATION[role].map((groupe, index) => (
            <div key={groupe.titre ?? index} className="mt-4 first:mt-2">
              {groupe.titre && (
                <p className="px-3 pb-1.5 text-sm font-semibold text-white/75">
                  {groupe.titre}
                </p>
              )}
              <ul className="flex flex-col gap-1">
                {groupe.liens.map(({ href, libelle }) => {
                  const actif = chemin === href;
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onFermer}
                        aria-current={actif ? "page" : undefined}
                        className={`block rounded-md px-3 py-2 text-sm font-medium outline-hidden transition-[background-color,color,translate,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-white ${
                          actif
                            ? "bg-white text-primary shadow-[0_3px_0_0_rgb(8_20_80/0.35)]"
                            : "text-white/85 hover:translate-x-1 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {libelle}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
