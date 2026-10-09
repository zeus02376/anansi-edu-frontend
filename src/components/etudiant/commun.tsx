import type { ReactNode } from "react";
import { EchecDeChargement } from "@/components/AccesLimite";
import { Carte, Chargement, Vide } from "@/components/ui";
import type { useEtudiantConnecte } from "@/hooks/useEtudiantConnecte";
import type { Etudiant } from "@/types";

export type EtatEtudiant = ReturnType<typeof useEtudiantConnecte>;

export const CLASSE_TITRE_CARTE =
  "border-b border-line px-5 py-4 font-display text-lg font-semibold text-ink";

export const CLASSE_FILTRE =
  "rounded-full border border-field px-3.5 py-1.5 text-sm font-semibold text-ink transition-colors duration-150 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary";

// États communs à toutes les pages : chargement, échec (avis calme si le
// serveur répond 403) et absence de dossier. Renvoie null quand le dossier
// est prêt à être affiché.
export function etatDuDossier(
  etat: EtatEtudiant,
  sujet: string,
): ReactNode | null {
  if (etat.chargement) {
    return (
      <Carte className="mt-6">
        <Chargement texte="Chargement de votre dossier…" />
      </Carte>
    );
  }
  if (etat.erreur) {
    return (
      <div className="mt-6">
        <EchecDeChargement
          message={etat.erreur}
          sujet={sujet}
          profil="étudiant"
          onReessayer={etat.recharger}
        />
      </div>
    );
  }
  if (etat.introuvable || !etat.etudiant) {
    return (
      <Carte className="mt-6">
        <Vide>
          Aucun dossier étudiant n&apos;est lié à votre compte. Contactez la
          scolarité.
        </Vide>
      </Carte>
    );
  }
  return null;
}

export function nomComplet(
  etudiant: Etudiant,
  repli?: { prenom?: string; nom?: string },
): string {
  const prenom = etudiant.user?.prenom ?? repli?.prenom;
  const nom = etudiant.user?.nom ?? repli?.nom;
  return [prenom, nom].filter(Boolean).join(" ") || "—";
}

export function initiales(nom: string): string {
  const lettres = nom
    .split(/\s+/)
    .filter((mot) => mot && mot !== "—")
    .slice(0, 2)
    .map((mot) => mot[0].toUpperCase());
  return lettres.join("") || "?";
}

// Seules les adresses http(s) sont acceptées comme photo.
export function urlPhotoValide(url: string | null): string | null {
  if (!url) return null;
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function Champ({
  libelle,
  children,
}: {
  libelle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted">{libelle}</dt>
      <dd className="mt-0.5 font-semibold break-words text-ink">{children}</dd>
    </div>
  );
}
