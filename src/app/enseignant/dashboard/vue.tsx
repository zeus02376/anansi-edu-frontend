"use client";

import Link from "next/link";
import {
  anneeEnCours,
  ChipAvancement,
  EtatEnseignant,
  heuresRestantes,
  totaux,
} from "@/components/enseignant/outils";
import { Inclinable } from "@/components/Inclinable";
import { Nombre } from "@/components/Nombre";
import { Progression } from "@/components/Progression";
import { CLASSE_LIEN } from "@/components/styles";
import { Carte, EnTete, Vide } from "@/components/ui";
import { useEnseignantConnecte } from "@/hooks/useEnseignantConnecte";
import { useAuthStore } from "@/stores/authStore";
import type { Affectation } from "@/types";

function Chiffre({
  libelle,
  valeur,
  unite,
}: {
  libelle: string;
  valeur: number;
  unite?: string;
}) {
  return (
    <Inclinable className="h-full rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgb(15_23_42/0.04),0_14px_32px_-18px_rgb(15_23_42/0.14)]">
      <p className="text-sm font-semibold text-muted">{libelle}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-primary tabular-nums">
        <Nombre valeur={valeur} />
        {unite && <span className="ml-1 text-lg text-muted">{unite}</span>}
      </p>
    </Inclinable>
  );
}

function Contenu({ affectations }: { affectations: Affectation[] }) {
  const total = totaux(affectations);
  const annee = anneeEnCours(affectations);
  const lignes = annee
    ? affectations.filter((a) => a.anneeAcademiqueId === annee.id)
    : affectations;
  const restantes = lignes
    .filter((a) => heuresRestantes(a) > 0)
    .sort((a, b) => heuresRestantes(b) - heuresRestantes(a));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Chiffre libelle="Matières enseignées" valeur={total.matieres} />
        <Chiffre libelle="Heures prévues" valeur={total.prevues} unite="h" />
        <Chiffre libelle="Heures effectuées" valeur={total.effectuees} unite="h" />
        <Chiffre libelle="Avancement global" valeur={total.avancement} unite="%" />
      </div>

      <Carte className="mt-6">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink">
            Année en cours
          </h2>
          {annee && <p className="text-sm text-muted">{annee.libelle}</p>}
        </div>
        <ul className="divide-y divide-line">
          {lignes.map((a) => {
            const nom = a.matiere?.nom ?? "Matière inconnue";
            return (
              <li key={a.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{nom}</p>
                    {a.matiere && (
                      <p className="font-mono text-xs text-muted">
                        {a.matiere.code}
                      </p>
                    )}
                  </div>
                  <ChipAvancement affectation={a} />
                </div>
                <p className="mt-2 text-sm text-muted tabular-nums">
                  {a.heuresEffectuees} h sur {a.heuresPrevues} h
                </p>
                <Progression
                  className="mt-1.5"
                  valeur={a.heuresEffectuees}
                  max={a.heuresPrevues}
                  libelle={`Heures effectuées de ${nom}`}
                />
              </li>
            );
          })}
        </ul>
      </Carte>

      <Carte className="mt-6">
        <h2 className="border-b border-line px-5 py-4 font-display text-lg font-semibold text-ink">
          Heures restantes à assurer
        </h2>
        {restantes.length === 0 ? (
          <Vide>Toutes les heures prévues sont assurées.</Vide>
        ) : (
          <ul className="divide-y divide-line">
            {restantes.map((a) => (
              <li
                key={a.id}
                className="flex items-baseline justify-between gap-4 px-5 py-3 text-sm"
              >
                <span className="min-w-0 font-semibold text-ink">
                  {a.matiere?.nom ?? "Matière inconnue"}
                </span>
                <span className="whitespace-nowrap text-muted tabular-nums">
                  {heuresRestantes(a)} h restantes
                </span>
              </li>
            ))}
          </ul>
        )}
      </Carte>

      <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/enseignant/matieres" className={CLASSE_LIEN}>
          Voir toutes mes matières
        </Link>
        <Link href="/enseignant/profil" className={CLASSE_LIEN}>
          Voir mon profil
        </Link>
      </p>
    </>
  );
}

export default function EnseignantDashboardPage() {
  const prenom = useAuthStore((etat) => etat.user?.prenom);
  const etat = useEnseignantConnecte();

  return (
    <div>
      <EnTete
        titre={prenom ? `Bonjour ${prenom}` : "Tableau de bord"}
        texte="Vos matières et l'avancement de vos heures d'enseignement."
      />
      <div className="mt-6">
        <EtatEnseignant etat={etat} sujet="Vos enseignements">
          {(_enseignant, affectations) =>
            affectations.length === 0 ? (
              <Carte>
                <Vide>Aucune matière ne vous est affectée pour le moment.</Vide>
              </Carte>
            ) : (
              <Contenu affectations={affectations} />
            )
          }
        </EtatEnseignant>
      </div>
    </div>
  );
}
