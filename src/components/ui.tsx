import type { ReactNode } from "react";
import type { StatutCandidature, StatutInscription } from "@/types";
import { CLASSE_BOUTON_SECONDAIRE } from "@/components/styles";

export function EnTete({
  titre,
  texte,
  actions,
}: {
  titre: string;
  texte?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {titre}
        </h1>
        {texte && <p className="mt-1.5 max-w-[65ch] text-muted">{texte}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Carte({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-line bg-surface ${className}`}
    >
      {children}
    </section>
  );
}

export function Chargement({ texte = "Chargement…" }: { texte?: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 px-5 py-8 text-sm text-muted"
    >
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-primary border-r-transparent motion-reduce:animate-none"
      />
      {texte}
    </div>
  );
}

// Message d'échec d'un appel au serveur, avec de quoi réessayer.
export function Erreur({
  message,
  onReessayer,
}: {
  message: string;
  onReessayer?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-600/40 bg-red-600/10 px-4 py-3 text-sm text-red-800"
    >
      <p>{message}</p>
      {onReessayer && (
        <button
          type="button"
          onClick={onReessayer}
          className={`${CLASSE_BOUTON_SECONDAIRE} border-red-700/50 px-3 py-1.5 text-red-800 hover:border-red-800 hover:bg-red-600/10`}
        >
          Réessayer
        </button>
      )}
    </div>
  );
}

export function Vide({ children }: { children: ReactNode }) {
  return <p className="px-5 py-8 text-sm text-muted">{children}</p>;
}

export const LIBELLE_STATUT_CANDIDATURE: Record<StatutCandidature, string> = {
  SOUMIS: "Soumis",
  INCOMPLET: "Incomplet",
  EN_EXAMEN: "En examen",
  ACCEPTE: "Accepté",
  REJETE: "Rejeté",
};

const CLASSE_STATUT_CANDIDATURE: Record<StatutCandidature, string> = {
  SOUMIS: "border-primary/30 bg-primary/10 text-primary",
  INCOMPLET: "border-amber-600/40 bg-amber-500/10 text-amber-800",
  EN_EXAMEN: "border-slate-400 bg-slate-100 text-slate-700",
  ACCEPTE: "border-green-700/40 bg-green-700/10 text-green-800",
  REJETE: "border-red-600/40 bg-red-600/10 text-red-800",
};

const CLASSE_BADGE =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";

export function BadgeCandidature({ statut }: { statut: StatutCandidature }) {
  return (
    <span className={`${CLASSE_BADGE} ${CLASSE_STATUT_CANDIDATURE[statut]}`}>
      {LIBELLE_STATUT_CANDIDATURE[statut]}
    </span>
  );
}

export const LIBELLE_STATUT_INSCRIPTION: Record<StatutInscription, string> = {
  EN_ATTENTE: "En attente",
  VALIDE: "Validée",
  REJETE: "Rejetée",
  SUSPENDU: "Suspendue",
};

const CLASSE_STATUT_INSCRIPTION: Record<StatutInscription, string> = {
  EN_ATTENTE: "border-amber-600/40 bg-amber-500/10 text-amber-800",
  VALIDE: "border-green-700/40 bg-green-700/10 text-green-800",
  REJETE: "border-red-600/40 bg-red-600/10 text-red-800",
  SUSPENDU: "border-slate-400 bg-slate-100 text-slate-700",
};

export function BadgeInscription({ statut }: { statut: StatutInscription }) {
  return (
    <span className={`${CLASSE_BADGE} ${CLASSE_STATUT_INSCRIPTION[statut]}`}>
      {LIBELLE_STATUT_INSCRIPTION[statut]}
    </span>
  );
}

// Classes des tableaux de données. Envelopper le <table> dans
// <div className={CLASSE_TABLEAU_DEFILANT}> pour le défilement sur mobile.
export const CLASSE_TABLEAU_DEFILANT = "overflow-x-auto";
export const CLASSE_TABLEAU = "w-full min-w-[40rem] text-left text-sm";
export const CLASSE_TH =
  "border-b border-line px-5 py-3 text-sm font-semibold whitespace-nowrap text-muted";
export const CLASSE_TD = "border-b border-line px-5 py-3 align-middle text-ink";

export function formaterDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}
