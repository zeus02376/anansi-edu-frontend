import type { ReactNode } from "react";
import {
  CLASSE_BOUTON_PRINCIPAL,
  CLASSE_ERREUR,
  CLASSE_LIBELLE,
} from "@/components/styles";

// Titre d'une section à l'intérieur d'une <Carte>.
export function TitreCarte({ children }: { children: ReactNode }) {
  return (
    <h2 className="border-b border-line px-5 py-4 font-display text-lg font-semibold text-ink">
      {children}
    </h2>
  );
}

// Attributs à poser sur le champ lui-même pour le relier à son libellé,
// à son aide et à son message d'erreur.
export function ariaChamp(id: string, erreur?: string, aide = false) {
  const decritPar = [aide && `${id}-aide`, erreur && `${id}-erreur`]
    .filter(Boolean)
    .join(" ");
  return {
    id,
    "aria-invalid": erreur ? true : undefined,
    "aria-describedby": decritPar || undefined,
  } as const;
}

// Libellé, champ (passé en enfant), aide et message d'erreur.
export function Champ({
  id,
  libelle,
  erreur,
  aide,
  className = "",
  children,
}: {
  id: string;
  libelle: string;
  erreur?: string;
  aide?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={CLASSE_LIBELLE}>
        {libelle}
      </label>
      {children}
      {aide && (
        <p id={`${id}-aide`} className="text-sm text-muted">
          {aide}
        </p>
      )}
      {erreur && (
        <p id={`${id}-erreur`} role="alert" className={CLASSE_ERREUR}>
          {erreur}
        </p>
      )}
    </div>
  );
}

// Bas de formulaire : échec de l'envoi, confirmation, bouton d'envoi.
export function Envoi({
  erreur,
  confirmation,
  enCours,
  libelle,
  libelleEnCours,
}: {
  erreur?: string;
  confirmation: string | null;
  enCours: boolean;
  libelle: string;
  libelleEnCours: string;
}) {
  return (
    <div className="flex flex-col items-start gap-4 sm:col-span-2">
      {erreur && (
        <p
          role="alert"
          className="apparition rounded-md border border-red-600/40 bg-red-600/10 px-3.5 py-2.5 text-sm text-red-800"
        >
          {erreur}
        </p>
      )}
      {confirmation && !erreur && (
        <p
          role="status"
          className="apparition rounded-md border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-sm text-ink"
        >
          {confirmation}
        </p>
      )}
      <button
        type="submit"
        disabled={enCours}
        className={CLASSE_BOUTON_PRINCIPAL}
      >
        {enCours && (
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
          />
        )}
        {enCours ? libelleEnCours : libelle}
      </button>
    </div>
  );
}
