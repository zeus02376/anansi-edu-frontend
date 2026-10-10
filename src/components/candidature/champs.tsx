import type { ReactNode } from "react";
import type { FieldError } from "react-hook-form";
import { CLASSE_ERREUR, CLASSE_LIBELLE } from "@/components/styles";

// Briques de formulaire de la candidature : libellé, message d'erreur lié au
// champ (aria-invalid, aria-describedby, role="alert") et coche.

export function attributsErreur(id: string, erreur: FieldError | undefined) {
  return {
    "aria-invalid": erreur ? (true as const) : undefined,
    "aria-describedby": erreur ? `${id}-erreur` : undefined,
  };
}

export function MessageErreur({
  id,
  erreur,
}: {
  id: string;
  erreur: FieldError | undefined;
}) {
  if (!erreur?.message) return null;
  return (
    <p id={`${id}-erreur`} role="alert" className={`${CLASSE_ERREUR} break-words`}>
      {erreur.message}
    </p>
  );
}

export function Champ({
  id,
  libelle,
  erreur,
  children,
}: {
  id: string;
  libelle: string;
  erreur: FieldError | undefined;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={CLASSE_LIBELLE}>
        {libelle}
      </label>
      {children}
      <MessageErreur id={id} erreur={erreur} />
    </div>
  );
}

export function Coche({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

// Bouton rendu inactif par `aria-disabled` plutôt que `disabled` : il garde le
// focus clavier. Le gestionnaire de clic doit lui-même ignorer l'action.
export const CLASSE_ARIA_INACTIF =
  "aria-disabled:translate-y-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:hover:translate-y-0";
