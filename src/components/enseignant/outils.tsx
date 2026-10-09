"use client";

import type { ReactNode } from "react";
import { EchecDeChargement } from "@/components/AccesLimite";
import { Chargement, Vide } from "@/components/ui";
import { useEnseignantConnecte } from "@/hooks/useEnseignantConnecte";
import type { Affectation, AnneeAcademique, Enseignant } from "@/types";

export const LIBELLE_TYPE: Record<Enseignant["type"], string> = {
  PERMANENT: "Permanent",
  VACATAIRE: "Vacataire",
};

export type Avancement = "TERMINEE" | "NON_COMMENCEE" | "EN_COURS";

export function avancementDe(affectation: Affectation): Avancement {
  const { heuresPrevues: prevues, heuresEffectuees: effectuees } = affectation;
  if (prevues > 0 && effectuees >= prevues) return "TERMINEE";
  if (effectuees === 0) return "NON_COMMENCEE";
  return "EN_COURS";
}

const LIBELLE_AVANCEMENT: Record<Avancement, string> = {
  TERMINEE: "Terminée",
  NON_COMMENCEE: "Non commencée",
  EN_COURS: "En cours",
};

const CLASSE_AVANCEMENT: Record<Avancement, string> = {
  TERMINEE: "border-green-700/40 bg-green-700/10 text-green-800",
  NON_COMMENCEE: "border-slate-400 bg-slate-100 text-slate-700",
  EN_COURS: "border-primary/30 bg-primary/10 text-primary",
};

export function ChipAvancement({ affectation }: { affectation: Affectation }) {
  const avancement = avancementDe(affectation);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${CLASSE_AVANCEMENT[avancement]}`}
    >
      {LIBELLE_AVANCEMENT[avancement]}
    </span>
  );
}

export function heuresRestantes(affectation: Affectation): number {
  return Math.max(0, affectation.heuresPrevues - affectation.heuresEffectuees);
}

export function totaux(affectations: Affectation[]) {
  const annees = new Set<string>();
  let credits = 0;
  let prevues = 0;
  let effectuees = 0;
  for (const affectation of affectations) {
    annees.add(affectation.anneeAcademiqueId);
    credits += affectation.matiere?.credits ?? 0;
    prevues += affectation.heuresPrevues;
    effectuees += affectation.heuresEffectuees;
  }
  const avancement =
    prevues > 0 ? Math.min(100, Math.round((effectuees / prevues) * 100)) : 0;
  return {
    matieres: affectations.length,
    annees: annees.size,
    credits,
    prevues,
    effectuees,
    avancement,
  };
}

// Année en cours : l'année active la plus récente, sinon la plus récente.
export function anneeEnCours(
  affectations: Affectation[],
): AnneeAcademique | null {
  const annees = new Map<string, AnneeAcademique>();
  for (const affectation of affectations) {
    if (affectation.anneeAcademique) {
      annees.set(affectation.anneeAcademique.id, affectation.anneeAcademique);
    }
  }
  const debut = (annee: AnneeAcademique) =>
    new Date(annee.dateDebut).getTime() || 0;
  const triees = [...annees.values()].sort(
    (a, b) => Number(b.active) - Number(a.active) || debut(b) - debut(a),
  );
  return triees[0] ?? null;
}

// Gère chargement, échec et fiche absente ; affiche ensuite le contenu.
export function EtatEnseignant({
  etat,
  sujet,
  children,
}: {
  etat: ReturnType<typeof useEnseignantConnecte>;
  sujet: string;
  children: (enseignant: Enseignant, affectations: Affectation[]) => ReactNode;
}) {
  const { chargement, erreur, introuvable, enseignant, affectations, recharger } =
    etat;
  if (erreur) {
    return (
      <EchecDeChargement
        message={erreur}
        sujet={sujet}
        profil="enseignant"
        onReessayer={recharger}
      />
    );
  }
  if (chargement) return <Chargement texte="Chargement de vos enseignements…" />;
  if (introuvable || !enseignant) {
    return (
      <Vide>
        Aucune fiche enseignant n&apos;est liée à votre compte. Contactez la
        scolarité.
      </Vide>
    );
  }
  if (!affectations) {
    return <Chargement texte="Chargement de vos affectations…" />;
  }
  return <>{children(enseignant, affectations)}</>;
}
