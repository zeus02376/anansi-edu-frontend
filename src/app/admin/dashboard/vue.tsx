"use client";

import Link from "next/link";
import { Inclinable } from "@/components/Inclinable";
import { Nombre } from "@/components/Nombre";
import { CLASSE_LIEN } from "@/components/styles";
import { EnTete, Erreur } from "@/components/ui";
import { useRessource } from "@/hooks/useRessource";

type Compteur = {
  libelle: string;
  chemin: string;
  // Page de détail, quand elle existe.
  lien?: { href: string; texte: string };
};

const COMPTEURS: Compteur[] = [
  {
    libelle: "Établissements",
    chemin: "/tenants",
    lien: { href: "/admin/tenants", texte: "Voir les établissements" },
  },
  {
    libelle: "Écoles",
    chemin: "/ecoles",
    lien: { href: "/admin/ecoles", texte: "Voir les écoles" },
  },
  {
    libelle: "Étudiants",
    chemin: "/etudiants",
    lien: { href: "/scolarite/etudiants", texte: "Voir les étudiants" },
  },
  { libelle: "Enseignants", chemin: "/enseignants" },
];

// Chaque compteur charge sa propre liste : un appel en échec n'empêche pas
// les autres de s'afficher.
function LigneCompteur({ libelle, chemin, lien }: Compteur) {
  const { donnees, erreur, chargement, recharger } =
    useRessource<unknown[]>(chemin);

  return (
    <li>
      <Inclinable className="flex h-full min-h-40 flex-col gap-2 rounded-xl border border-line bg-surface px-5 py-5 shadow-[0_1px_2px_rgb(15_23_42/0.04),0_14px_32px_-18px_rgb(15_23_42/0.14)]">
      <p className="text-sm font-semibold text-muted">{libelle}</p>
      {erreur ? (
        <Erreur message={erreur} onReessayer={recharger} />
      ) : (
        <p
          role={chargement ? "status" : undefined}
          className="font-display text-4xl font-semibold tracking-tight text-primary tabular-nums"
        >
          {chargement ? (
            <>
              <span aria-hidden="true" className="text-muted">
                …
              </span>
              <span className="sr-only">Chargement…</span>
            </>
          ) : (
            <Nombre valeur={donnees?.length ?? 0} />
          )}
        </p>
      )}
      {lien && (
        <Link href={lien.href} className={`${CLASSE_LIEN} mt-auto self-start`}>
          {lien.texte}
        </Link>
      )}
      </Inclinable>
    </li>
  );
}

export default function AdminDashboardPage() {
  return (
    <>
      <EnTete
        titre="Tableau de bord"
        texte="Vue d'ensemble de la plateforme."
      />

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {COMPTEURS.map((compteur) => (
          <LigneCompteur key={compteur.chemin} {...compteur} />
        ))}
      </ul>
    </>
  );
}
