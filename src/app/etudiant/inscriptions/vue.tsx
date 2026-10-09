"use client";

import { useState } from "react";
import {
  CLASSE_FILTRE,
  Champ,
  etatDuDossier,
} from "@/components/etudiant/commun";
import {
  BadgeInscription,
  Carte,
  EnTete,
  formaterDate,
  LIBELLE_STATUT_INSCRIPTION,
  Vide,
} from "@/components/ui";
import { useEtudiantConnecte } from "@/hooks/useEtudiantConnecte";
import type { StatutInscription } from "@/types";

type Filtre = StatutInscription | "TOUS";

const STATUTS: StatutInscription[] = [
  "EN_ATTENTE",
  "VALIDE",
  "REJETE",
  "SUSPENDU",
];

export default function EtudiantInscriptionsPage() {
  const etat = useEtudiantConnecte();
  const { etudiant, inscriptions, inscriptionCourante } = etat;
  const [filtre, setFiltre] = useState<Filtre>("TOUS");

  const entete = (
    <EnTete
      titre="Mes inscriptions"
      texte="L'historique de vos inscriptions, de la plus récente à la plus ancienne."
    />
  );
  const bloquant = etatDuDossier(etat, "Vos inscriptions");
  if (bloquant || !etudiant) {
    return (
      <>
        {entete}
        {bloquant}
      </>
    );
  }

  const visibles =
    filtre === "TOUS"
      ? inscriptions
      : inscriptions.filter((inscription) => inscription.statut === filtre);

  return (
    <>
      {entete}

      <Carte className="mt-6">
        {inscriptions.length === 0 ? (
          <Vide>Vous n&apos;avez pas encore d&apos;inscription.</Vide>
        ) : (
          <>
            <div className="border-b border-line px-5 py-4">
              <div
                role="group"
                aria-label="Filtrer par statut"
                className="flex flex-wrap gap-2"
              >
                <button
                  type="button"
                  aria-pressed={filtre === "TOUS"}
                  className={CLASSE_FILTRE}
                  onClick={() => setFiltre("TOUS")}
                >
                  Toutes ({inscriptions.length})
                </button>
                {STATUTS.map((statut) => (
                  <button
                    key={statut}
                    type="button"
                    aria-pressed={filtre === statut}
                    className={CLASSE_FILTRE}
                    onClick={() => setFiltre(statut)}
                  >
                    {LIBELLE_STATUT_INSCRIPTION[statut]} (
                    {inscriptions.filter((i) => i.statut === statut).length})
                  </button>
                ))}
              </div>
              <p aria-live="polite" className="mt-3 text-sm text-muted">
                {visibles.length}{" "}
                {visibles.length > 1
                  ? "inscriptions affichées"
                  : "inscription affichée"}
              </p>
            </div>

            {visibles.length === 0 ? (
              <Vide>Aucune inscription avec ce statut.</Vide>
            ) : (
              <ol className="px-5 py-5">
                {visibles.map((inscription, rang) => (
                  <li
                    key={inscription.id}
                    className={`relative border-l-2 border-line pl-6 ${
                      rang < visibles.length - 1 ? "pb-6" : ""
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute top-1.5 -left-[7px] size-3 rounded-full border-2 border-primary ${
                        inscription.id === inscriptionCourante?.id
                          ? "bg-primary"
                          : "bg-surface"
                      }`}
                    />
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h2 className="font-display text-lg font-semibold text-ink">
                        {inscription.anneeAcademique?.libelle ?? "Année inconnue"}
                      </h2>
                      <BadgeInscription statut={inscription.statut} />
                      {inscription.id === inscriptionCourante?.id && (
                        <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-on-primary">
                          Actuelle
                        </span>
                      )}
                    </div>
                    <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-3">
                      <Champ libelle="Niveau">
                        {inscription.niveau?.nom ?? "—"}
                      </Champ>
                      <Champ libelle="Date d'inscription">
                        {formaterDate(inscription.dateInscription)}
                      </Champ>
                      <Champ libelle="Frais de scolarité">
                        {inscription.fraisPayes ? "Payés" : "Non payés"}
                      </Champ>
                    </dl>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </Carte>
    </>
  );
}
